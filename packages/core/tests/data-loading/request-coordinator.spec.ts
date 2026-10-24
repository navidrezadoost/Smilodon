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
    maxCursorPages?: number;
    maxCursorTokenBytes?: number;
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
        maxCursorPages: overrides.maxCursorPages,
        maxCursorTokenBytes: overrides.maxCursorTokenBytes,
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

  it('validates finite cursor resource-policy bounds and supplies bounded defaults', () => {
    expect(validateDataCoordinatorConfig()).toMatchObject({
      valid: true,
      value: { maxCursorPages: 256, maxCursorTokenBytes: 1_024 },
    });
    expect(validateDataCoordinatorConfig({ dataLoading: { maxCursorPages: 0 } })).toMatchObject({ valid: false });
    expect(validateDataCoordinatorConfig({ dataLoading: { maxCursorPages: 4_097 } })).toMatchObject({ valid: false });
    expect(validateDataCoordinatorConfig({ dataLoading: { maxCursorTokenBytes: 0 } })).toMatchObject({ valid: false });
    expect(validateDataCoordinatorConfig({ dataLoading: { maxCursorTokenBytes: 4_097 } })).toMatchObject({ valid: false });
  });

  it('allocates request IDs uniquely across coordinator instances', () => {
    const first = requestAction(makeRemoteCoordinator().connect());
    const second = requestAction(makeRemoteCoordinator().connect());
    expect(first.requestId).not.toBe(second.requestId);
    expect(first.requestId).toMatch(/-generation-\d+-request-\d+-[a-z0-9]+$/);
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
    expect(coordinator.requestLoadMore()).toEqual([]);
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

  it('treats sentinel updates as transitions and keeps manual load-more independent', () => {
    const coordinator = new DataRequestCoordinator({
      config: { dataLoading: { protocol: 'acknowledged', fetchLimit: 2 } },
      initialItems: ['seed'],
      hasMore: true,
    });
    coordinator.connect();

    const first = requestAction(coordinator.setSentinelIntersecting(true));
    markLoading(coordinator, first);
    expect(coordinator.setSentinelIntersecting(true)).toEqual([]);
    expect(coordinator.completeDataRequest(ack(first, {
      status: 'succeeded', items: ['seed', 'next'], hasMore: true,
    }))).toBe('accepted');

    // A duplicate true notification while still intersecting is not a new
    // trigger. A genuine exit/re-entry can request the next position.
    expect(coordinator.setSentinelIntersecting(true)).toEqual([]);
    coordinator.setSentinelIntersecting(false);
    const second = requestAction(coordinator.setSentinelIntersecting(true));
    expect(second.position).toEqual({ mode: 'page', page: 3 });
    markLoading(coordinator, second);
    expect(coordinator.completeDataRequest(ack(second, {
      status: 'succeeded', items: ['seed', 'next', 'last'], hasMore: true,
    }))).toBe('accepted');

    // Manual loading remains available without an observer transition.
    const manual = requestAction(coordinator.requestLoadMore('manual'));
    expect(manual.position).toEqual({ mode: 'page', page: 4 });
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

  it('reports an oversized cursor as a resource limit without settling or partially committing the request', () => {
    const coordinator = makeRemoteCoordinator({ paginationMode: 'cursor', maxCursorTokenBytes: 4 });
    const first = requestAction(coordinator.connect());
    markLoading(coordinator, first);
    const before = coordinator.getSnapshot();

    expect(coordinator.completeDataRequest(ack(first, {
      status: 'succeeded',
      items: ['must-not-commit-yet'],
      hasMore: true,
      nextCursor: 'ééé', // six UTF-8 bytes, not three characters.
    }))).toBe('resource-limit');
    expect(coordinator.getSnapshot()).toMatchObject({
      status: 'loading',
      busy: true,
      activeRequest: first,
      items: before.items,
      hasMore: before.hasMore,
      nextEligiblePosition: before.nextEligiblePosition,
      resourceLimit: {
        reason: 'cursor-token-size',
        maxCursorTokenBytes: 4,
        actualCursorTokenBytes: 6,
        requestId: first.requestId,
      },
    });

    expect(coordinator.completeDataRequest(ack(first, {
      status: 'succeeded',
      items: ['accepted-after-correction'],
      hasMore: true,
      nextCursor: 'xy',
    }))).toBe('accepted');
    expect(coordinator.getSnapshot()).toMatchObject({
      status: 'succeeded',
      busy: false,
      items: ['accepted-after-correction'],
      nextEligiblePosition: { mode: 'cursor', cursor: 'xy', ordinal: 2 },
      resourceLimit: null,
    });

    const second = requestAction(coordinator.requestLoadMore());
    markLoading(coordinator, second);
    expect(coordinator.completeDataRequest(ack(second, {
      status: 'empty',
      hasMore: true,
      advance: 'next',
      nextCursor: '12345',
    }))).toBe('resource-limit');
    expect(coordinator.getSnapshot()).toMatchObject({ busy: true, activeRequest: second, items: ['accepted-after-correction'] });
    const policyUpdate = coordinator.updateConfig({ dataLoading: { maxCursorTokenBytes: 5 } });
    expect(policyUpdate).toMatchObject({ status: 'accepted', actions: [] });
    expect(coordinator.getSnapshot().activeRequest).toEqual(second);
    expect(coordinator.completeDataRequest(ack(second, {
      status: 'empty',
      hasMore: true,
      advance: 'next',
      nextCursor: '12345',
    }))).toBe('accepted');
    expect(coordinator.getSnapshot()).toMatchObject({
      busy: false,
      nextEligiblePosition: { mode: 'cursor', cursor: '12345', ordinal: 3 },
      resourceLimit: null,
    });
  });

  it('accepts the last permitted cursor page, preserves hasMore, and resumes only after raising the cap', () => {
    const coordinator = makeRemoteCoordinator({ paginationMode: 'cursor', maxCursorPages: 2 });
    const first = requestAction(coordinator.connect());
    markLoading(coordinator, first);
    expect(coordinator.completeDataRequest(ack(first, {
      status: 'succeeded', items: ['one'], hasMore: true, nextCursor: 'cursor-a',
    }))).toBe('accepted');

    const second = requestAction(coordinator.requestLoadMore());
    expect(second.position).toEqual({ mode: 'cursor', cursor: 'cursor-a', ordinal: 2 });
    markLoading(coordinator, second);
    expect(coordinator.completeDataRequest(ack(second, {
      status: 'succeeded', items: ['one', 'two'], hasMore: true, nextCursor: 'cursor-b',
    }))).toBe('accepted');
    expect(coordinator.getSnapshot()).toMatchObject({
      status: 'resource-limited',
      busy: false,
      hasMore: true,
      nextEligiblePosition: { mode: 'cursor', cursor: 'cursor-b', ordinal: 3 },
      resourceLimit: { reason: 'cursor-depth', maxCursorPages: 2, requestId: second.requestId },
    });
    expect(coordinator.requestLoadMore()).toEqual([]);
    expect(coordinator.setSentinelIntersecting(true)).toEqual([]);
    expect(coordinator.getSnapshot().hasMore).toBe(true);

    const raised = coordinator.updateConfig({ dataLoading: { maxCursorPages: 3 } });
    expect(raised).toMatchObject({ status: 'accepted', actions: [] });
    expect(coordinator.getSnapshot()).toMatchObject({ status: 'idle', hasMore: true, resourceLimit: null });
    expect(coordinator.setSentinelIntersecting(true)).toEqual([]);
    const third = requestAction(coordinator.requestLoadMore('manual'));
    expect(third.position).toEqual({ mode: 'cursor', cursor: 'cursor-b', ordinal: 3 });
    markLoading(coordinator, third);
    expect(coordinator.completeDataRequest(ack(third, {
      status: 'exhausted', items: ['one', 'two', 'three'], hasMore: false,
    }))).toBe('accepted');
    expect(coordinator.getSnapshot()).toMatchObject({ status: 'exhausted', hasMore: false, resourceLimit: null });
  });

  it('retains exact cursor history across a same-query reconnect and resets it for a new query', () => {
    const coordinator = makeRemoteCoordinator({ paginationMode: 'cursor' });
    const first = requestAction(coordinator.connect());
    markLoading(coordinator, first);
    expect(coordinator.completeDataRequest(ack(first, {
      status: 'succeeded', items: ['one'], hasMore: true, nextCursor: 'cursor-a',
    }))).toBe('accepted');

    const second = requestAction(coordinator.requestLoadMore());
    markLoading(coordinator, second);
    expect(coordinator.completeDataRequest(ack(second, {
      status: 'succeeded', items: ['one', 'two'], hasMore: true, nextCursor: 'cursor-b',
    }))).toBe('accepted');

    const interrupted = requestAction(coordinator.requestLoadMore());
    coordinator.disconnect();
    expect(coordinator.connect()).toEqual([]);
    coordinator.setSentinelIntersecting(false);
    const resumed = requestAction(coordinator.setSentinelIntersecting(true));
    expect(resumed.position).toEqual(interrupted.position);
    markLoading(coordinator, resumed);
    expect(coordinator.completeDataRequest(ack(resumed, {
      status: 'succeeded', items: ['one', 'two', 'three'], hasMore: true, nextCursor: 'cursor-a',
    }))).toBe('invalid');

    const newQuery = requestAction(coordinator.setQuery('new query'));
    expect(newQuery.position).toEqual({ mode: 'cursor', ordinal: 1 });
    markLoading(coordinator, newQuery);
    expect(coordinator.completeDataRequest(ack(newQuery, {
      status: 'succeeded', items: ['new result'], hasMore: true, nextCursor: 'cursor-a',
    }))).toBe('accepted');
  });

  it('keeps cursor position on empty retry and advances only after an explicit next cursor', () => {
    const coordinator = makeRemoteCoordinator({ paginationMode: 'cursor' });
    const first = requestAction(coordinator.connect());
    markLoading(coordinator, first);

    expect(coordinator.completeDataRequest(ack(first, {
      status: 'empty',
      hasMore: true,
      advance: 'retry',
    }))).toBe('accepted');
    expect(coordinator.getSnapshot()).toMatchObject({
      nextEligiblePosition: first.position,
      sentinelBlocked: true,
    });

    coordinator.setSentinelIntersecting(false);
    const retry = requestAction(coordinator.setSentinelIntersecting(true));
    expect(retry.position).toEqual(first.position);
    expect(retry.requestId).not.toBe(first.requestId);
    markLoading(coordinator, retry);
    expect(coordinator.completeDataRequest(ack(retry, {
      status: 'empty',
      hasMore: true,
      advance: 'next',
      nextCursor: 'cursor-next',
    }))).toBe('accepted');
    expect(coordinator.getSnapshot()).toMatchObject({
      nextEligiblePosition: { mode: 'cursor', cursor: 'cursor-next', ordinal: 2 },
      sentinelBlocked: true,
    });

    coordinator.setSentinelIntersecting(false);
    const next = requestAction(coordinator.setSentinelIntersecting(true));
    expect(next.position).toEqual({ mode: 'cursor', cursor: 'cursor-next', ordinal: 2 });
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
    const forgedOldGenerationId = request.requestId.replace(/-generation-\d+-/, '-generation-9-');
    expect(coordinator.completeDataRequest({
      requestId: forgedOldGenerationId,
      queryGeneration: 9,
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
    const settledSnapshot = coordinator.getSnapshot();
    expect(coordinator.completeDataRequest(ack(request, {
      status: 'exhausted',
      items: ['late'],
      hasMore: false,
    }))).toBe('unknown-request');
    expect(coordinator.getSnapshot()).toEqual(settledSnapshot);
  });

  it('rejects malformed error payloads atomically and accepts a corrected failure', () => {
    const coordinator = makeRemoteCoordinator();
    const search = requestAction(coordinator.connect());
    markLoading(coordinator, search);
    expect(coordinator.completeDataRequest(ack(search, {
      status: 'succeeded',
      items: ['accepted'],
      hasMore: true,
    }))).toBe('accepted');

    const request = requestAction(coordinator.requestLoadMore());
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
    const beforeStale = coordinator.getSnapshot();
    expect(coordinator.completeDataRequest(ack(first, {
      status: 'exhausted',
      items: ['stale'],
      hasMore: false,
    }))).toBe('stale');
    expect(coordinator.getSnapshot()).toEqual(beforeStale);
    expect(coordinator.getSnapshot().activeRequest).toEqual(second);
  });

  it('classifies old-generation IDs without retaining one invalidation entry per superseded request', () => {
    const coordinator = makeRemoteCoordinator();
    const first = requestAction(coordinator.connect());
    let current = first;

    for (let index = 0; index < 512; index += 1) {
      current = requestAction(coordinator.setQuery(`rapid-query-${index}`));
    }

    expect(Object.keys(coordinator)).not.toContain('invalidatedRequests');
    expect(current.queryGeneration).toBeGreaterThan(first.queryGeneration);
    const beforeStale = coordinator.getSnapshot();
    expect(coordinator.completeDataRequest(ack(first, {
      status: 'exhausted',
      items: ['must-not-commit'],
      hasMore: false,
    }))).toBe('stale');
    expect(coordinator.getSnapshot()).toEqual(beforeStale);
    expect(coordinator.getSnapshot().activeRequest).toEqual(current);
  });

  it('keeps settled duplicates unknown in their generation and classifies them stale after that generation ends', () => {
    const coordinator = makeRemoteCoordinator();
    const settled = requestAction(coordinator.connect());
    markLoading(coordinator, settled);
    const completion = ack(settled, {
      status: 'exhausted',
      items: ['accepted'],
      hasMore: false,
    });

    expect(coordinator.completeDataRequest(completion)).toBe('accepted');
    expect(coordinator.completeDataRequest(completion)).toBe('unknown-request');

    coordinator.setQuery('next generation');
    expect(coordinator.completeDataRequest(completion)).toBe('stale');
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
    const beforeStale = coordinator.getSnapshot();
    expect(coordinator.completeDataRequest(ack(first, {
      status: 'exhausted',
      items: ['late again'],
      hasMore: false,
    }))).toBe('stale');
    expect(coordinator.getSnapshot()).toEqual(beforeStale);
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
