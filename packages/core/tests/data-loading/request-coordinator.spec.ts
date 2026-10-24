import { describe, expect, it } from 'vitest';
import {
  DataRequestCoordinator,
  validateDataCoordinatorConfig,
  type DataCoordinatorAction,
  type DataRequest,
} from '../../src/data-loading/request-coordinator';

function requestAction(actions: readonly DataCoordinatorAction[]): DataRequest {
  const action = actions.find((candidate) => candidate.type === 'request');
  if (!action || action.type !== 'request') throw new Error('Expected a request action');
  return action.request;
}

function cancellationAction(actions: readonly DataCoordinatorAction[]): Extract<DataCoordinatorAction, { type: 'cancel' }> {
  const action = actions.find((candidate) => candidate.type === 'cancel');
  if (!action || action.type !== 'cancel') throw new Error('Expected a cancellation action');
  return action;
}

function makeRemoteCoordinator(
  overrides: {
    paginationMode?: 'page' | 'cursor';
    searchMode?: 'remote' | 'hybrid';
    firstPage?: number;
    fetchLimit?: number;
    pageSize?: number;
    initialQuery?: string;
    initialItems?: readonly unknown[];
  } = {},
): DataRequestCoordinator {
  return new DataRequestCoordinator({
    config: {
      dataLoading: {
        protocol: 'acknowledged',
        searchMode: overrides.searchMode ?? 'remote',
        paginationMode: overrides.paginationMode ?? 'page',
        firstPage: overrides.firstPage ?? 1,
        fetchLimit: overrides.fetchLimit,
      },
      infiniteScroll: {
        pageSize: overrides.pageSize ?? 20,
        initialPage: 8,
      },
    },
    initialQuery: overrides.initialQuery,
    initialItems: overrides.initialItems,
  });
}

function ack(
  request: DataRequest,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  return {
    requestId: request.requestId,
    queryGeneration: request.queryGeneration,
    ...payload,
  };
}

function markLoading(coordinator: DataRequestCoordinator, request: DataRequest): void {
  expect(coordinator.markNotificationsDispatched(request.requestId)).toBe(true);
  expect(coordinator.getSnapshot().status).toBe('loading');
}

describe('DOM-independent acknowledged data-loading coordinator', () => {
  it('keeps legacy defaults request-free and rejects incompatible opt-in configuration', () => {
    expect('document' in globalThis).toBe(false);
    const legacy = new DataRequestCoordinator({ initialItems: ['a'], hasMore: true });
    expect(legacy.connect()).toEqual([]);
    expect(legacy.requestLoadMore()).toEqual([]);
    expect(legacy.getSnapshot()).toMatchObject({ status: 'idle', busy: false, items: ['a'] });

    expect(validateDataCoordinatorConfig({ dataLoading: { searchMode: 'remote' } })).toMatchObject({
      valid: false,
    });
    expect(validateDataCoordinatorConfig({
      dataLoading: { protocol: 'acknowledged', searchMode: 'remote' },
    })).toMatchObject({ valid: false });
    expect(() => new DataRequestCoordinator({
      config: { dataLoading: { protocol: 'acknowledged', paginationMode: 'cursor' } },
    })).toThrow(/fetchLimit/);
    expect(validateDataCoordinatorConfig({
      dataLoading: { protocol: 'acknowledged' },
      infiniteScroll: { initialPage: Number.MAX_SAFE_INTEGER, pageSize: 1 },
    })).toMatchObject({ valid: false });

    const remote = makeRemoteCoordinator();
    expect(requestAction(remote.connect()).query).toBe('');
  });

  it('starts one remote query at firstPage with an immutable per-request configuration snapshot', () => {
    const coordinator = makeRemoteCoordinator({ firstPage: 4, fetchLimit: 7, pageSize: 30, initialQuery: '  Ada  ' });
    const request = requestAction(coordinator.connect());

    expect(request).toMatchObject({
      kind: 'search',
      mode: 'remote',
      query: '  Ada  ',
      normalizedQuery: 'Ada',
      fetchLimit: 7,
      position: { mode: 'page', page: 4 },
    });
    expect(coordinator.getSnapshot()).toMatchObject({ status: 'requested', busy: true });
    expect(Object.isFrozen(request)).toBe(true);
    expect(Object.isFrozen(request.position)).toBe(true);
    expect(coordinator.connect()).toEqual([]);
    expect(coordinator.markNotificationsDispatched(request.requestId)).toBe(true);

    const update = coordinator.updateConfig({ dataLoading: { fetchLimit: 11 } });
    expect(update.status).toBe('accepted');
    expect(coordinator.getSnapshot().activeRequest?.fetchLimit).toBe(7);
    expect(coordinator.completeDataRequest(ack(request, {
      status: 'succeeded',
      items: ['a', 'b'],
      hasMore: true,
    }))).toBe('accepted');

    const nextRequest = requestAction(coordinator.requestLoadMore());
    expect(nextRequest.position).toEqual({ mode: 'page', page: 5 });
    expect(nextRequest.fetchLimit).toBe(11);
    expect(nextRequest.requestId).not.toBe(request.requestId);
  });

  it('uses effective pageSize only when fetchLimit is omitted and snapshots it', () => {
    const coordinator = makeRemoteCoordinator({ pageSize: 13 });
    const request = requestAction(coordinator.connect());
    expect(request.fetchLimit).toBe(13);

    const update = coordinator.updateConfig({ infiniteScroll: { pageSize: 25 } });
    expect(update.status).toBe('accepted');
    expect(coordinator.getSnapshot().activeRequest?.fetchLimit).toBe(13);
  });

  it('does not mutate active state for invalid config and preserves the pending request snapshot', () => {
    const coordinator = makeRemoteCoordinator({ fetchLimit: 5 });
    const request = requestAction(coordinator.connect());
    const before = coordinator.getSnapshot();

    expect(coordinator.updateConfig({ dataLoading: { fetchLimit: 0 } }).status).toBe('invalid');
    expect(coordinator.getSnapshot()).toEqual(before);
    expect(coordinator.updateConfig({ dataLoading: { fetchLimit: 9 } }).status).toBe('accepted');
    expect(coordinator.getSnapshot().activeRequest).toEqual(request);
    expect(coordinator.getSnapshot().activeRequest?.fetchLimit).toBe(5);
  });

  it('commits page positions only on acceptance and retries failures at the same position with a new ID', () => {
    const coordinator = new DataRequestCoordinator({
      config: {
        dataLoading: { protocol: 'acknowledged', fetchLimit: 2 },
        infiniteScroll: { initialPage: 4 },
      },
      initialItems: ['seed'],
      hasMore: true,
    });
    coordinator.connect();
    const first = requestAction(coordinator.requestLoadMore());
    expect(first.position).toEqual({ mode: 'page', page: 5 });
    markLoading(coordinator, first);

    expect(coordinator.completeDataRequest(ack(first, {
      status: 'failed',
      error: { message: 'temporary', retryable: true },
    }))).toBe('accepted');
    expect(coordinator.getSnapshot()).toMatchObject({
      items: ['seed'],
      hasMore: true,
      busy: false,
      lastCommittedPage: 4,
      nextEligiblePosition: { mode: 'page', page: 5 },
      status: 'failed',
    });

    const retry = requestAction(coordinator.requestLoadMore());
    expect(retry.position).toEqual(first.position);
    expect(retry.requestId).not.toBe(first.requestId);
    markLoading(coordinator, retry);
    expect(coordinator.completeDataRequest(ack(retry, {
      status: 'succeeded',
      items: ['seed', 'new'],
      hasMore: true,
    }))).toBe('accepted');
    expect(coordinator.getSnapshot()).toMatchObject({
      lastCommittedPage: 5,
      nextEligiblePosition: { mode: 'page', page: 6 },
      items: ['seed', 'new'],
    });
  });

  it('treats host cancellation as non-failure and retries the same position after a fresh trigger', () => {
    const coordinator = new DataRequestCoordinator({
      config: { dataLoading: { protocol: 'acknowledged', fetchLimit: 3 } },
      initialItems: ['seed'],
      hasMore: true,
    });
    coordinator.connect();
    const first = requestAction(coordinator.requestLoadMore());
    markLoading(coordinator, first);
    expect(coordinator.completeDataRequest(ack(first, {
      status: 'cancelled',
      reason: 'host-cancelled',
    }))).toBe('accepted');
    expect(coordinator.getSnapshot()).toMatchObject({
      status: 'cancelled',
      busy: false,
      error: null,
      items: ['seed'],
      lastCommittedPage: 1,
      nextEligiblePosition: { mode: 'page', page: 2 },
      sentinelBlocked: true,
    });

    expect(coordinator.setSentinelIntersecting(true)).toEqual([]);
    coordinator.setSentinelIntersecting(false);
    const retry = requestAction(coordinator.setSentinelIntersecting(true));
    expect(retry.position).toEqual(first.position);
    expect(retry.requestId).not.toBe(first.requestId);
  });

  it('accepts the optional host-cancellation reason when omitted', () => {
    const coordinator = makeRemoteCoordinator();
    const request = requestAction(coordinator.connect());
    markLoading(coordinator, request);

    expect(coordinator.completeDataRequest(ack(request, { status: 'cancelled' }))).toBe('accepted');
    expect(coordinator.getSnapshot()).toMatchObject({ status: 'cancelled', busy: false, error: null });
  });

  it('blocks an empty-page sentinel loop until exit/re-entry, while allowing explicit manual retry', () => {
    const coordinator = new DataRequestCoordinator({
      config: { dataLoading: { protocol: 'acknowledged', fetchLimit: 4 } },
      initialItems: ['seed'],
      hasMore: true,
    });
    coordinator.connect();

    const first = requestAction(coordinator.setSentinelIntersecting(true));
    markLoading(coordinator, first);
    expect(coordinator.setSentinelIntersecting(true)).toEqual([]);
    expect(coordinator.completeDataRequest(ack(first, {
      status: 'empty',
      hasMore: true,
      advance: 'next',
    }))).toBe('accepted');
    expect(coordinator.getSnapshot()).toMatchObject({
      sentinelBlocked: true,
      nextEligiblePosition: { mode: 'page', page: 3 },
      busy: false,
    });
    expect(coordinator.setSentinelIntersecting(true)).toEqual([]);

    coordinator.setSentinelIntersecting(false);
    const next = requestAction(coordinator.setSentinelIntersecting(true));
    expect(next.position).toEqual({ mode: 'page', page: 3 });
    markLoading(coordinator, next);
    expect(coordinator.completeDataRequest(ack(next, {
      status: 'empty',
      hasMore: true,
      advance: 'retry',
    }))).toBe('accepted');
    expect(coordinator.getSnapshot().nextEligiblePosition).toEqual({ mode: 'page', page: 3 });
    expect(coordinator.getSnapshot().sentinelBlocked).toBe(true);

    const manualRetry = requestAction(coordinator.requestLoadMore('manual'));
    expect(manualRetry.position).toEqual({ mode: 'page', page: 3 });
    expect(manualRetry.requestId).not.toBe(next.requestId);
  });

  it('rejects repeated cursor tokens without partial mutation and advances only on valid tokens', () => {
    const coordinator = makeRemoteCoordinator({ paginationMode: 'cursor' });
    const first = requestAction(coordinator.connect());
    expect(first.position).toEqual({ mode: 'cursor', ordinal: 1 });
    markLoading(coordinator, first);
    expect(coordinator.completeDataRequest(ack(first, {
      status: 'succeeded',
      items: ['one'],
      hasMore: true,
      nextCursor: 'cursor-a',
    }))).toBe('accepted');

    const second = requestAction(coordinator.requestLoadMore());
    expect(second.position).toEqual({ mode: 'cursor', cursor: 'cursor-a', ordinal: 2 });
    markLoading(coordinator, second);
    const beforeInvalid = coordinator.getSnapshot();
    expect(coordinator.completeDataRequest(ack(second, {
      status: 'succeeded',
      items: ['one', 'two'],
      hasMore: true,
      nextCursor: 'cursor-a',
    }))).toBe('invalid');
    expect(coordinator.getSnapshot()).toEqual(beforeInvalid);

    expect(coordinator.completeDataRequest(ack(second, {
      status: 'succeeded',
      items: ['one', 'two'],
      hasMore: true,
      nextCursor: 'cursor-b',
    }))).toBe('accepted');
    expect(coordinator.getSnapshot().nextEligiblePosition).toEqual({
      mode: 'cursor',
      cursor: 'cursor-b',
      ordinal: 3,
    });

    const third = requestAction(coordinator.requestLoadMore());
    markLoading(coordinator, third);
    const beforeMalformedCursor = coordinator.getSnapshot();
    expect(coordinator.completeDataRequest(ack(third, {
      status: 'succeeded',
      items: ['one', 'two', 'three'],
      hasMore: true,
      nextCursor: { token: 'not-serializable-by-contract' },
    }))).toBe('invalid');
    expect(coordinator.getSnapshot()).toEqual(beforeMalformedCursor);
  });

  it('validates completion identity and payload atomically and permits correction under the active ID', () => {
    const coordinator = makeRemoteCoordinator({ initialItems: ['old'] });
    const request = requestAction(coordinator.connect());
    markLoading(coordinator, request);
    const before = coordinator.getSnapshot();

    expect(coordinator.completeDataRequest(ack(request, {
      status: 'succeeded',
      items: ['partial'],
      hasMore: false,
    }))).toBe('invalid');
    expect(coordinator.getSnapshot()).toEqual(before);
    expect(coordinator.completeDataRequest({
      requestId: 'unknown',
      queryGeneration: request.queryGeneration,
      status: 'exhausted',
      items: [],
      hasMore: false,
    })).toBe('unknown-request');
    expect(coordinator.getSnapshot()).toEqual(before);

    expect(coordinator.completeDataRequest(ack(request, {
      status: 'exhausted',
      items: [],
      hasMore: false,
    }))).toBe('accepted');
    expect(coordinator.getSnapshot()).toMatchObject({ items: [], hasMore: false, busy: false, status: 'exhausted' });
    expect(coordinator.completeDataRequest(ack(request, {
      status: 'exhausted',
      items: ['late'],
      hasMore: false,
    }))).toBe('unknown-request');
  });

  it('rejects malformed error payloads atomically and accepts a corrected failure', () => {
    const coordinator = makeRemoteCoordinator({ initialItems: ['accepted'] });
    const request = requestAction(coordinator.connect());
    markLoading(coordinator, request);
    const before = coordinator.getSnapshot();

    expect(coordinator.completeDataRequest(ack(request, {
      status: 'failed',
      error: { message: 'temporary', retryable: 'yes' },
    }))).toBe('invalid');
    expect(coordinator.getSnapshot()).toEqual(before);
    expect(coordinator.completeDataRequest(ack(request, {
      status: 'failed',
      error: { message: 'temporary', retryable: true },
    }))).toBe('accepted');
    expect(coordinator.getSnapshot()).toMatchObject({
      status: 'failed',
      busy: false,
      items: ['accepted'],
      error: { message: 'temporary', retryable: true },
    });
  });

  it('invalidates old query requests before notifying cancellation and rejects late results as stale', () => {
    const coordinator = makeRemoteCoordinator();
    const first = requestAction(coordinator.connect());
    markLoading(coordinator, first);

    const actions = coordinator.setQuery('new query');
    expect(actions[0]).toMatchObject({
      type: 'cancel',
      notification: { requestId: first.requestId, reason: 'query-changed' },
    });
    const second = requestAction(actions);
    expect(second.queryGeneration).toBeGreaterThan(first.queryGeneration);
    expect(second.query).toBe('new query');
    expect(coordinator.completeDataRequest(ack(first, {
      status: 'exhausted',
      items: ['stale'],
      hasMore: false,
    }))).toBe('stale');
    expect(coordinator.getSnapshot().activeRequest).toEqual(second);
  });

  it('invalidates pending work across disconnect and reconnects searches with a newer ID/generation', () => {
    const coordinator = makeRemoteCoordinator({ firstPage: 6 });
    const first = requestAction(coordinator.connect());
    markLoading(coordinator, first);
    expect(cancellationAction(coordinator.disconnect()).notification).toEqual({
      requestId: first.requestId,
      queryGeneration: first.queryGeneration,
      reason: 'disconnected',
    });
    expect(coordinator.completeDataRequest(ack(first, {
      status: 'exhausted',
      items: ['late'],
      hasMore: false,
    }))).toBe('stale');

    const reconnected = requestAction(coordinator.connect());
    expect(reconnected.requestId).not.toBe(first.requestId);
    expect(reconnected.queryGeneration).toBeGreaterThan(first.queryGeneration);
    expect(reconnected.position).toEqual({ mode: 'page', page: 6 });
  });

  it('does not auto-request a disconnected load-more position after reconnect', () => {
    const coordinator = makeRemoteCoordinator();
    const search = requestAction(coordinator.connect());
    markLoading(coordinator, search);
    expect(coordinator.completeDataRequest(ack(search, {
      status: 'succeeded',
      items: ['one'],
      hasMore: true,
    }))).toBe('accepted');

    const page = requestAction(coordinator.requestLoadMore());
    markLoading(coordinator, page);
    coordinator.disconnect();
    expect(coordinator.connect()).toEqual([]);
    expect(coordinator.getSnapshot().nextEligiblePosition).toEqual(page.position);
    expect(coordinator.setSentinelIntersecting(true)).toEqual([]);
    coordinator.setSentinelIntersecting(false);
    const rearmed = requestAction(coordinator.setSentinelIntersecting(true));
    expect(rearmed.position).toEqual(page.position);
    expect(rearmed.requestId).not.toBe(page.requestId);
  });

  it('restarts the initial query on a protocol-defining config change and cancels once', () => {
    const coordinator = makeRemoteCoordinator();
    const first = requestAction(coordinator.connect());
    markLoading(coordinator, first);

    const result = coordinator.updateConfig({
      dataLoading: { searchMode: 'hybrid' },
    });
    expect(result.status).toBe('accepted');
    if (result.status !== 'accepted') throw new Error('Expected valid configuration');
    expect(result.actions[0]).toMatchObject({ type: 'cancel', notification: { reason: 'config-changed' } });
    const next = requestAction(result.actions);
    expect(next).toMatchObject({ kind: 'search', mode: 'hybrid' });
    expect(next.queryGeneration).toBeGreaterThan(first.queryGeneration);
    expect(coordinator.completeDataRequest(ack(first, {
      status: 'exhausted',
      items: ['stale'],
      hasMore: false,
    }))).toBe('stale');
  });

  it('rejects page progress that would overflow the safe integer range', () => {
    const coordinator = new DataRequestCoordinator({
      config: {
        dataLoading: {
          protocol: 'acknowledged',
          searchMode: 'remote',
          firstPage: Number.MAX_SAFE_INTEGER,
          fetchLimit: 1,
        },
      },
    });
    const request = requestAction(coordinator.connect());
    markLoading(coordinator, request);
    const before = coordinator.getSnapshot();
    expect(coordinator.completeDataRequest(ack(request, {
      status: 'succeeded',
      items: ['one'],
      hasMore: true,
    }))).toBe('invalid');
    expect(coordinator.getSnapshot()).toEqual(before);
    expect(coordinator.completeDataRequest(ack(request, {
      status: 'exhausted',
      items: ['one'],
      hasMore: false,
    }))).toBe('accepted');
  });
});
