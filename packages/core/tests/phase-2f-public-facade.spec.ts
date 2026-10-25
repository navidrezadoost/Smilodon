import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select.js';
import { resetSelectConfig } from '../src/config/global-config.js';
import type {
  DataProjectionEventDetail,
  DataRequest,
  DataRequestCancelNotification,
  DataRequestCompletion,
  SelectInstanceConfig,
} from '../src/data-loading/public-types.js';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

function createSelect(): EnhancedSelect {
  const select = document.createElement('enhanced-select') as EnhancedSelect;
  select.updateConfig({
    infiniteScroll: { enabled: true, pageSize: 5 },
    dataLoading: { protocol: 'acknowledged', searchMode: 'remote', fetchLimit: 5 },
  });
  document.body.appendChild(select);
  return select;
}

describe('EnhancedSelect public acknowledged data-loading facade', () => {
  beforeEach(() => {
    resetSelectConfig();
  });

  afterEach(() => {
    document.body.replaceChildren();
    resetSelectConfig();
  });

  it('waits for explicit readiness and classifies completion synchronously before projection', async () => {
    const select = createSelect();
    const order: string[] = [];
    const searchDetails: any[] = [];
    const projectionDetails: DataProjectionEventDetail[] = [];
    const onSearch = vi.fn((query: string, request?: DataRequest) => {
      order.push('search-callback');
      expect(query).toBe('');
      expect(request).toBe(searchDetails[0].request);
    });
    const onDataProjection = vi.fn((detail: DataProjectionEventDetail) => {
      order.push(`projection-callback:${detail.status}`);
      expect(detail).toBe(projectionDetails[projectionDetails.length - 1]);
    });
    select.updateConfig({ callbacks: { onSearch, onDataProjection } });
    select.addEventListener('search', (event) => {
      order.push('search-event');
      searchDetails.push((event as CustomEvent).detail);
    });
    select.addEventListener('dataProjection', (event) => {
      const detail = (event as CustomEvent<DataProjectionEventDetail>).detail;
      projectionDetails.push(detail);
      order.push(`projection-event:${detail.status}`);
    });

    expect(searchDetails).toHaveLength(0);
    select.startDataLoading();
    select.startDataLoading();
    expect(searchDetails).toHaveLength(1);
    expect(order.slice(0, 2)).toEqual(['search-event', 'search-callback']);

    const request = searchDetails[0].request as DataRequest;
    const beforeCompletion = select.getDataLoadingState();
    expect(beforeCompletion.activeRequest?.requestId).toBe(request.requestId);
    expect(beforeCompletion.busy).toBe(true);
    expect(beforeCompletion).not.toHaveProperty('items');

    const projectionComplete = new Promise<DataProjectionEventDetail>((resolve) => {
      select.addEventListener('dataProjection', (event) => {
        const detail = (event as CustomEvent<DataProjectionEventDetail>).detail;
        if (detail.status === 'complete') resolve(detail);
      }, { once: false });
    });
    const completion: DataRequestCompletion = {
      requestId: request.requestId,
      queryGeneration: request.queryGeneration,
      status: 'succeeded',
      items: [{ value: 'one', label: 'One' }],
      hasMore: true,
    };

    const result = select.completeDataRequest(completion);
    expect(result).toBe('accepted');
    expect(result).not.toBeInstanceOf(Promise);
    expect(projectionDetails).toHaveLength(0);
    expect(select.getDataLoadingState()).toMatchObject({ busy: true, projectionPending: true });

    const completed = await projectionComplete;
    expect(completed).toMatchObject({
      requestId: request.requestId,
      queryGeneration: request.queryGeneration,
      attempt: 1,
      status: 'complete',
    });
    expect(order.slice(-2)).toEqual(['projection-event:complete', 'projection-callback:complete']);
    expect(select.getDataLoadingState()).toMatchObject({ busy: false, projectionPending: false });
  });

  it('rejects stale and duplicate completions at the public facade', async () => {
    const select = createSelect();
    const requests: any[] = [];
    const projections: DataProjectionEventDetail[] = [];
    select.addEventListener('search', (event) => requests.push((event as CustomEvent).detail));
    select.addEventListener('dataProjection', (event) => {
      projections.push((event as CustomEvent<DataProjectionEventDetail>).detail);
    });

    select.startDataLoading();
    const original = requests[0].request as DataRequest;
    (select as any)._handleSearch('replacement');
    const replacement = requests[1].request as DataRequest;
    const completion: DataRequestCompletion = {
      requestId: replacement.requestId,
      queryGeneration: replacement.queryGeneration,
      status: 'succeeded',
      items: [{ value: 'replacement', label: 'Replacement' }],
      hasMore: true,
    };
    const originalCompletion: DataRequestCompletion = {
      ...completion,
      requestId: original.requestId,
      queryGeneration: original.queryGeneration,
    };

    expect(select.completeDataRequest(originalCompletion)).toBe('stale');
    expect(select.getDataLoadingState().activeRequest?.requestId).toBe(replacement.requestId);
    expect(select.completeDataRequest(completion)).toBe('accepted');
    expect(select.completeDataRequest(completion)).toBe('unknown-request');
    await vi.waitFor(() => expect(projections).toHaveLength(1));
    expect(projections[0]).toMatchObject({
      requestId: replacement.requestId,
      queryGeneration: replacement.queryGeneration,
      attempt: 1,
      status: 'complete',
    });
  });

  it('returns detached state records and preserves request identity across projection recovery', async () => {
    const select = createSelect();
    const searches: any[] = [];
    const projections: DataProjectionEventDetail[] = [];
    const cancellations: unknown[] = [];
    select.addEventListener('search', (event) => searches.push((event as CustomEvent).detail));
    select.addEventListener('dataProjection', (event) => {
      projections.push((event as CustomEvent<DataProjectionEventDetail>).detail);
    });
    select.addEventListener('dataRequestCancel', (event) => {
      cancellations.push((event as CustomEvent).detail);
    });

    select.startDataLoading();
    const request = searches[0].request as DataRequest;
    const detached = select.getDataLoadingState();
    (detached.activeRequest as any).position.page = 999;
    (detached.nextEligiblePosition as any).page = 999;
    expect(select.getDataLoadingState().activeRequest?.position).toEqual({ mode: 'page', page: 1 });
    expect(select.getDataLoadingState().nextEligiblePosition).toEqual({ mode: 'page', page: 1 });

    (select as any)._failNextAcknowledgedProjectionForTest('before-publish');
    expect(select.completeDataRequest({
      requestId: request.requestId,
      queryGeneration: request.queryGeneration,
      status: 'succeeded',
      items: [{ value: 'one', label: 'One' }],
      hasMore: true,
    })).toBe('accepted');
    expect(projections[0]).toMatchObject({
      requestId: request.requestId,
      queryGeneration: request.queryGeneration,
      attempt: 1,
      status: 'failed',
    });

    select.remove();
    document.body.appendChild(select);
    const projectionRecovered = new Promise<DataProjectionEventDetail>((resolve) => {
      const listener = (event: Event) => {
        const detail = (event as CustomEvent<DataProjectionEventDetail>).detail;
        if (detail.status === 'complete') {
          select.removeEventListener('dataProjection', listener);
          resolve(detail);
        }
      };
      select.addEventListener('dataProjection', listener);
    });
    select.startDataLoading();

    const recovered = await projectionRecovered;
    expect(recovered).toMatchObject({
      requestId: request.requestId,
      queryGeneration: request.queryGeneration,
      attempt: 2,
      status: 'complete',
    });
    expect(searches).toHaveLength(1);
    expect(cancellations).toEqual([]);
    expect(select.getDataLoadingState()).toMatchObject({ busy: false, projectionPending: false });
  });

  it('coalesces query and mode changes during interrupted projection before reconnect dispatch', async () => {
    const select = createSelect();
    const requests: any[] = [];
    const projectionOrder: string[] = [];
    select.addEventListener('search', (event) => requests.push((event as CustomEvent).detail));
    select.addEventListener('dataProjection', (event) => {
      const detail = (event as CustomEvent<DataProjectionEventDetail>).detail;
      projectionOrder.push(`projection:${detail.status}`);
    });

    select.startDataLoading();
    const originalRequest = requests[0].request as DataRequest;
    (select as any)._failNextAcknowledgedProjectionForTest('before-publish');
    expect(select.completeDataRequest({
      requestId: originalRequest.requestId,
      queryGeneration: originalRequest.queryGeneration,
      status: 'succeeded',
      items: [{ value: 'committed', label: 'Committed' }],
      hasMore: true,
    })).toBe('accepted');
    expect(projectionOrder).toEqual(['projection:failed']);

    (select as any)._handleSearch('latest query');
    select.updateConfig({ dataLoading: { paginationMode: 'cursor' } });
    select.remove();

    const recoveredProjection = new Promise<void>((resolve) => {
      const listener = (event: Event) => {
        const detail = (event as CustomEvent<DataProjectionEventDetail>).detail;
        if (detail.status === 'complete') {
          select.removeEventListener('dataProjection', listener);
          resolve();
        }
      };
      select.addEventListener('dataProjection', listener);
    });
    const latestRequest = new Promise<DataRequest>((resolve) => {
      const listener = (event: Event) => {
        const detail = (event as CustomEvent).detail;
        if (detail.request?.query === 'latest query') {
          select.removeEventListener('search', listener);
          resolve(detail.request as DataRequest);
        }
      };
      select.addEventListener('search', listener);
    });

    document.body.appendChild(select);
    select.startDataLoading();
    const recoveredRequest = await latestRequest;
    await recoveredProjection;

    expect(projectionOrder).toEqual(['projection:failed', 'projection:complete']);
    expect(requests).toHaveLength(2);
    expect(recoveredRequest).toMatchObject({
      query: 'latest query',
      position: { mode: 'cursor', ordinal: 1 },
    });
    expect(recoveredRequest.requestId).not.toBe(originalRequest.requestId);
  });

  it('defers configuration changes made by projection listeners until notification dispatch completes', async () => {
    const select = createSelect();
    const order: string[] = [];
    const requests: any[] = [];
    select.addEventListener('search', (event) => {
      const detail = (event as CustomEvent).detail;
      requests.push(detail);
      order.push(`search:${detail.request.position.mode}:${detail.request.query}`);
    });
    select.addEventListener('dataProjection', (event) => {
      if ((event as CustomEvent<DataProjectionEventDetail>).detail.status !== 'complete') return;
      order.push('projection:complete');
      select.updateConfig({ dataLoading: { paginationMode: 'cursor' } });
    });

    select.startDataLoading();
    const request = requests[0].request as DataRequest;
    const nextRequest = new Promise<DataRequest>((resolve) => {
      const listener = (event: Event) => {
        const next = (event as CustomEvent).detail.request as DataRequest;
        if (next.requestId !== request.requestId) {
          select.removeEventListener('search', listener);
          resolve(next);
        }
      };
      select.addEventListener('search', listener);
    });

    expect(select.completeDataRequest({
      requestId: request.requestId,
      queryGeneration: request.queryGeneration,
      status: 'succeeded',
      items: [{ value: 'one', label: 'One' }],
      hasMore: true,
    })).toBe('accepted');
    (select as any)._handleSearch('latest query');
    const transitionedRequest = await nextRequest;

    expect(order).toEqual([
      'search:page:',
      'projection:complete',
      'search:cursor:latest query',
    ]);
    expect(requests).toHaveLength(2);
    expect(transitionedRequest).toMatchObject({
      query: 'latest query',
      position: { mode: 'cursor', ordinal: 1 },
    });
  });

  it('settles deferred config and query intent when a projection listener throws', async () => {
    const select = createSelect();
    const requests: any[] = [];
    const order: string[] = [];
    const listenerErrors: string[] = [];
    const onWindowError = (event: ErrorEvent) => {
      listenerErrors.push(event.message);
      event.preventDefault();
    };
    window.addEventListener('error', onWindowError);
    select.addEventListener('search', (event) => {
      const detail = (event as CustomEvent).detail;
      requests.push(detail);
      order.push(`search:${detail.request.query}:${detail.request.position.mode}`);
    });
    select.addEventListener('dataProjection', (event) => {
      if ((event as CustomEvent<DataProjectionEventDetail>).detail.status !== 'complete') return;
      order.push('projection:complete');
      select.updateConfig({ dataLoading: { paginationMode: 'cursor' } });
      (select as any)._handleSearch('latest after throw');
      throw new Error('projection listener failed');
    });

    try {
      select.startDataLoading();
      const request = requests[0].request as DataRequest;
      const nextRequest = new Promise<DataRequest>((resolve) => {
        const listener = (event: Event) => {
          const next = (event as CustomEvent).detail.request as DataRequest;
          if (next.requestId !== request.requestId) {
            select.removeEventListener('search', listener);
            resolve(next);
          }
        };
        select.addEventListener('search', listener);
      });

      expect(select.completeDataRequest({
        requestId: request.requestId,
        queryGeneration: request.queryGeneration,
        status: 'succeeded',
        items: [{ value: 'one', label: 'One' }],
        hasMore: true,
      })).toBe('accepted');
      const transitioned = await nextRequest;

      expect(order).toEqual([
        'search::page',
        'projection:complete',
        'search:latest after throw:cursor',
      ]);
      expect(transitioned).toMatchObject({
        query: 'latest after throw',
        position: { mode: 'cursor', ordinal: 1 },
      });
      expect(listenerErrors).toHaveLength(1);
      expect(select.getDataLoadingState().activeRequest?.requestId).toBe(transitioned.requestId);
    } finally {
      window.removeEventListener('error', onWindowError);
    }
  });

  it('emits cancellation before the replacement request on an acknowledged mode transition', () => {
    const select = createSelect();
    const order: string[] = [];
    const cancellationDetails: any[] = [];
    const searchDetails: any[] = [];
    const onDataRequestCancel = vi.fn((detail: DataRequestCancelNotification) => {
      order.push('cancel-callback');
      expect(detail).toBe(cancellationDetails[0]);
    });
    select.updateConfig({ callbacks: { onDataRequestCancel } });
    select.addEventListener('dataRequestCancel', (event) => {
      order.push('cancel-event');
      cancellationDetails.push((event as CustomEvent).detail);
    });
    select.addEventListener('search', (event) => {
      order.push('search-event');
      searchDetails.push((event as CustomEvent).detail);
    });

    select.startDataLoading();
    const firstRequest = searchDetails[0].request as DataRequest;
    const update: SelectInstanceConfig = {
      dataLoading: { paginationMode: 'cursor' },
    };
    select.updateConfig(update);

    expect(order).toEqual(['search-event', 'cancel-event', 'cancel-callback', 'search-event']);
    expect(cancellationDetails[0]).toEqual({
      requestId: firstRequest.requestId,
      queryGeneration: firstRequest.queryGeneration,
      reason: 'config-changed',
    });
    expect(searchDetails[1].request.position).toEqual({ mode: 'cursor', ordinal: 1 });
    expect(searchDetails[1].request.queryGeneration).toBeGreaterThan(firstRequest.queryGeneration);
  });

  it('does not dispatch acknowledged or fallback legacy requests for invalid initial configuration', () => {
    const select = document.createElement('enhanced-select') as EnhancedSelect;
    const search = vi.fn();
    select.addEventListener('search', search);
    select.updateConfig({ dataLoading: { protocol: 'legacy', searchMode: 'remote' } });
    document.body.appendChild(select);

    select.startDataLoading();

    expect(search).not.toHaveBeenCalled();
    expect(select.getDataLoadingState()).toMatchObject({ busy: false, activeRequest: null });
  });

  it('coalesces pre-connection readiness and snapshots the effective page-size fallback per request', async () => {
    const select = document.createElement('enhanced-select') as EnhancedSelect;
    const searches: any[] = [];
    const loadMore: any[] = [];
    select.updateConfig({
      infiniteScroll: { enabled: true, pageSize: 7 },
      dataLoading: { protocol: 'acknowledged', searchMode: 'remote' },
    });
    select.addEventListener('search', (event) => searches.push((event as CustomEvent).detail));
    select.addEventListener('loadMore', (event) => loadMore.push((event as CustomEvent).detail));

    select.startDataLoading();
    select.startDataLoading();
    expect(searches).toHaveLength(0);
    document.body.appendChild(select);
    expect(searches).toHaveLength(1);
    expect(searches[0].request.fetchLimit).toBe(7);

    const firstRequest = searches[0].request as DataRequest;
    select.updateConfig({ infiniteScroll: { enabled: true, pageSize: 11 } });
    expect(select.getDataLoadingState().activeRequest?.fetchLimit).toBe(7);

    const projectionComplete = new Promise<void>((resolve) => {
      const listener = (event: Event) => {
        const detail = (event as CustomEvent<DataProjectionEventDetail>).detail;
        if (detail.status === 'complete') {
          select.removeEventListener('dataProjection', listener);
          resolve();
        }
      };
      select.addEventListener('dataProjection', listener);
    });
    expect(select.completeDataRequest({
      requestId: firstRequest.requestId,
      queryGeneration: firstRequest.queryGeneration,
      status: 'succeeded',
      items: [{ value: 'one', label: 'One' }],
      hasMore: true,
    })).toBe('accepted');
    await projectionComplete;

    await (select as any)._loadMoreItems('manual');
    expect(loadMore).toHaveLength(1);
    expect(loadMore[0].request.fetchLimit).toBe(11);
    expect(loadMore[0].request.position).toEqual({ mode: 'page', page: 2 });
  });

  it('keeps a cursor request active after a token-size limit and accepts a corrected completion on that identity', async () => {
    const select = document.createElement('enhanced-select') as EnhancedSelect;
    const requests: any[] = [];
    const diagnostics: any[] = [];
    select.updateConfig({
      dataLoading: {
        protocol: 'acknowledged',
        searchMode: 'remote',
        paginationMode: 'cursor',
        fetchLimit: 2,
      },
    });
    select.addEventListener('search', (event) => requests.push((event as CustomEvent).detail));
    select.addEventListener('diagnostic', (event) => diagnostics.push((event as CustomEvent).detail));
    document.body.appendChild(select);
    select.startDataLoading();
    const request = requests[0].request as DataRequest;

    expect(select.completeDataRequest({
      requestId: request.requestId,
      queryGeneration: request.queryGeneration,
      status: 'succeeded',
      items: [],
      hasMore: true,
      nextCursor: 'x'.repeat(1_025),
    })).toBe('resource-limit');
    expect(select.getDataLoadingState()).toMatchObject({
      busy: true,
      activeRequest: { requestId: request.requestId },
      resourceLimit: {
        reason: 'cursor-token-size',
        maxCursorTokenBytes: 1_024,
        actualCursorTokenBytes: 1_025,
        requestId: request.requestId,
      },
    });
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].name).toBe('acknowledgedDataLoadingResourceLimit');

    const projectionComplete = new Promise<void>((resolve) => {
      select.addEventListener('dataProjection', (event) => {
        if ((event as CustomEvent<DataProjectionEventDetail>).detail.status === 'complete') resolve();
      });
    });
    expect(select.completeDataRequest({
      requestId: request.requestId,
      queryGeneration: request.queryGeneration,
      status: 'succeeded',
      items: [{ value: 'one', label: 'One' }],
      hasMore: true,
      nextCursor: 'cursor-1',
    })).toBe('accepted');
    await projectionComplete;
    expect(select.getDataLoadingState()).toMatchObject({
      busy: false,
      resourceLimit: null,
      nextEligiblePosition: { mode: 'cursor', cursor: 'cursor-1', ordinal: 2 },
    });
  });
});
