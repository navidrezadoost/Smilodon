import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select.js';
import { resetSelectConfig } from '../src/config/global-config.js';
import type {
  DataLoadingConfigErrorEventDetail,
  DataProjectionEventDetail,
  DataRequest,
  DataRequestCancelNotification,
} from '../src/data-loading/public-types.js';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

type SelectUpdate = Parameters<EnhancedSelect['updateConfig']>[0];

/**
 * Mount an <enhanced-select> with an acknowledged remote setup by default.
 * `loadMore` is enabled so a public `.load-more-button` fallback exists even
 * without an IntersectionObserver (jsdom), giving a public trigger for
 * acknowledged load-more events.
 */
function createSelect(overrides?: Partial<SelectUpdate>): EnhancedSelect {
  const select = document.createElement('enhanced-select') as EnhancedSelect;
  select.updateConfig({
    searchable: true,
    loadMore: { enabled: true, itemsPerLoad: 3 },
    infiniteScroll: { enabled: true, pageSize: 5 },
    dataLoading: { protocol: 'acknowledged', searchMode: 'remote', fetchLimit: 5 },
    ...overrides,
  } as SelectUpdate);
  document.body.appendChild(select);
  return select;
}

interface Captured {
  events: Record<string, unknown[]>;
}

/** Capture public `detail` payloads for a set of event names. */
function capture(select: EnhancedSelect, names: string[]): Captured {
  const events: Record<string, unknown[]> = {};
  for (const name of names) {
    events[name] = [];
    select.addEventListener(name, (event) => {
      events[name].push((event as CustomEvent).detail);
    });
  }
  return { events };
}

async function waitSettled(select: EnhancedSelect, expectedStatus?: string): Promise<void> {
  await vi.waitFor(() => {
    const state = select.getDataLoadingState();
    if (state.projectionPending) throw new Error('projectionPending');
    if (expectedStatus !== undefined && state.status !== expectedStatus) {
      throw new Error(`status ${state.status} != ${expectedStatus}`);
    }
    return true;
  }, { timeout: 2000 });
}

/** Start acknowledged loading and settle on an outstanding request. */
async function startLoading(select: EnhancedSelect): Promise<DataRequest> {
  select.startDataLoading();
  await waitSettled(select, 'loading');
  const request = select.getDataLoadingState().activeRequest;
  if (!request) throw new Error('no active request after start');
  return request;
}

function completion(request: DataRequest, overrides: Record<string, unknown>): Record<string, unknown> {
  return { requestId: request.requestId, queryGeneration: request.queryGeneration, ...overrides };
}

function loadMoreButton(select: EnhancedSelect): HTMLButtonElement | null {
  return select.shadowRoot?.querySelector('.load-more-button') ?? null;
}

function typeQuery(select: EnhancedSelect, value: string): void {
  const input = select.shadowRoot!.querySelector('input[part="input"]') as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('W1-P1.5-T2 async data-loading public event characterization', () => {
  beforeEach(() => {
    resetSelectConfig();
  });

  afterEach(() => {
    document.body.replaceChildren();
    resetSelectConfig();
    vi.useRealTimers();
  });

  describe('EVENT-004: search (local + acknowledged)', () => {
    it('emits an acknowledged search event whose detail carries query, empty results, and the request', async () => {
      const select = createSelect();
      const { events } = capture(select, ['search']);

      const request = await startLoading(select);

      expect(events.search).toHaveLength(1);
      const detail = events.search[0] as { query: string; results: unknown[]; count: number; request: DataRequest };
      expect(detail.query).toBe('');
      expect(detail.results).toEqual([]);
      expect(detail.count).toBe(0);
      expect(detail.request.kind).toBe('search');
      expect(detail.request.requestId).toBe(request.requestId);
      expect(detail.request.queryGeneration).toBe(request.queryGeneration);
    });

    it('emits an acknowledged search event whose request reflects the typed query and normalizedQuery', async () => {
      const select = createSelect();
      const { events } = capture(select, ['search']);

      // A connected remote-protocol component starts on the initial (empty) search.
      await startLoading(select);
      typeQuery(select, '  Apple  ');
      await vi.waitFor(() => {
        if ((events.search as { query: string }[]).length < 2) throw new Error('waiting for typed search');
      }, { timeout: 2000 });

      const detail = events.search[events.search.length - 1] as { query: string; request: DataRequest };
      expect(detail.query).toBe('  Apple  ');
      expect(detail.request.query).toBe('  Apple  ');
      // normalizedQuery trims surrounding whitespace (case is preserved).
      expect(detail.request.normalizedQuery).toBe('Apple');
    });

    it('emits a local (non-acknowledged) search event with the filtered result count', async () => {
      const select = createSelect({ dataLoading: { protocol: 'legacy' }, data: [] } as never);
      const { events } = capture(select, ['search']);
      select.setItems([
        { value: 'a', label: 'Apple' },
        { value: 'b', label: 'Apricot' },
        { value: 'c', label: 'Banana' },
      ]);

      typeQuery(select, 'ap');
      await vi.waitFor(() => {
        if ((events.search as unknown[]).length === 0) throw new Error('waiting for search');
      }, { timeout: 2000 });

      const detail = events.search[0] as { query: string; results: unknown[]; count: number };
      expect(detail.query).toBe('ap');
      expect(detail.count).toBe(2);
      expect(detail.results).toHaveLength(2);
    });
  });

  describe('EVENT-005: pageLoaded is declared-only', () => {
    // NOTE ON EVIDENCE BOUNDARY: these are bounded *runtime* observations at
    // specific completion checkpoints. They establish that `pageLoaded` is not
    // dispatched at an acknowledged page completion or a legacy load-more. They
    // do NOT, on their own, prove the event can never be emitted on any
    // execution path. The "declared-only" conclusion also rests on a separate
    // source inspection (the type is declared in public-types.ts but no
    // dispatch site exists in enhanced-select.ts). EVENT-005 therefore remains
    // Missing with DEVIATION-02 as an ADR candidate — the runtime negative and
    // the source inspection are distinct evidence, neither over-claiming.
    it('does not emit pageLoaded at an acknowledged page completion (bounded runtime observation)', async () => {
      const select = createSelect();
      const { events } = capture(select, ['pageLoaded', 'dataProjection']);

      const request = await startLoading(select);
      select.completeDataRequest(
        completion(request, { status: 'succeeded', items: [{ value: 'a', label: 'A' }], hasMore: true }) as never,
      );
      await waitSettled(select, 'succeeded');

      expect(events.pageLoaded).toHaveLength(0);
      // Completion is signalled on the projection channel instead.
      expect((events.dataProjection as { status: string }[]).map((d) => d.status)).toEqual(['complete']);
    });

    it('does not emit pageLoaded at a legacy load-more completion (bounded runtime observation)', async () => {
      const select = createSelect({
        searchable: false,
        infiniteScroll: { enabled: false },
        dataLoading: { protocol: 'legacy' },
        data: [],
      } as never);
      const { events } = capture(select, ['pageLoaded', 'loadMore']);
      select.setItems([{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]);
      select.open();

      await vi.waitFor(() => {
        if (!loadMoreButton(select)) throw new Error('waiting for load-more button');
      }, { timeout: 2000 });
      loadMoreButton(select)!.click();
      await vi.waitFor(() => {
        if ((events.loadMore as unknown[]).length === 0) throw new Error('waiting for loadMore');
      }, { timeout: 2000 });

      expect(events.pageLoaded).toHaveLength(0);
      expect(events.loadMore).toHaveLength(1);
    });
  });

  describe('EVENT-006: error (async shape)', () => {
    it('emits an error whose detail carries message and cause on an async server failure, before onError', async () => {
      const failure = new Error('server exploded');
      const select = createSelect({
        serverSide: { enabled: true, fetchSelectedItems: async () => { throw failure; } },
      });
      const order: string[] = [];
      const errorDetails: unknown[] = [];
      select.addEventListener('error', (event) => {
        order.push('error');
        errorDetails.push((event as CustomEvent).detail);
      });
      select.updateConfig({ callbacks: { onError: () => order.push('onError') } });

      // setSelectedValues is a public async path that surfaces fetch failures as `error`.
      await select.setSelectedValues(['missing']);

      expect(errorDetails).toHaveLength(1);
      const detail = errorDetails[0] as { message: string; cause: unknown };
      expect(detail.message).toBe('server exploded');
      expect(detail.cause).toBe(failure);
      expect(order).toEqual(['error', 'onError']);
    });
  });

  describe('EVENT-008: loadMore (legacy + acknowledged)', () => {
    it('emits an acknowledged loadMore event carrying a fresh page-mode load-more request at page 2', async () => {
      const select = createSelect();
      const { events } = capture(select, ['loadMore']);

      // The initial remote search is issued at firstPage (default 1).
      const first = await startLoading(select);
      expect(first.position).toEqual({ mode: 'page', page: 1 });
      select.completeDataRequest(
        completion(first, { status: 'succeeded', items: [{ value: 'a', label: 'A' }], hasMore: true }) as never,
      );
      await waitSettled(select, 'succeeded');
      // A succeeded page at page 1 advances the eligible position to page 2.
      expect(select.getDataLoadingState().nextEligiblePosition).toEqual({ mode: 'page', page: 2 });

      await vi.waitFor(() => {
        if (!loadMoreButton(select)) throw new Error('waiting for load-more button');
      }, { timeout: 2000 });
      loadMoreButton(select)!.click();
      await vi.waitFor(() => {
        if ((events.loadMore as unknown[]).length === 0) throw new Error('waiting for loadMore');
      }, { timeout: 2000 });

      // Establish the active request explicitly — this test must fail if no
      // page-mode load-more request was created for the load-more trigger.
      const active = select.getDataLoadingState().activeRequest;
      expect(active).not.toBeNull();
      expect(active!.kind).toBe('loadMore');
      expect(active!.position.mode).toBe('page');
      expect((active!.position as { mode: 'page'; page: number }).page).toBe(2);
      // The load-more request is distinct from the initial search request.
      expect(active!.requestId).not.toBe(first.requestId);

      const detail = events.loadMore[0] as { page: number; items: unknown[]; request: DataRequest };
      expect(detail.request.kind).toBe('loadMore');
      expect(detail.items).toEqual([]);
      // The emitted page derives from the request's own page-mode position.
      expect(detail.page).toBe(2);
      expect(detail.request.position).toEqual({ mode: 'page', page: 2 });
      // The event's request correlates with the request the snapshot reports as
      // active, by (immutable) request identifier and query generation. This
      // asserts correlation, not object reference identity.
      expect(detail.request.requestId).toBe(active!.requestId);
      expect(detail.request.queryGeneration).toBe(active!.queryGeneration);
    });

    it('emits a legacy loadMore event with page number and empty items', async () => {
      const select = createSelect({
        searchable: false,
        infiniteScroll: { enabled: false },
        dataLoading: { protocol: 'legacy' },
        data: [],
      } as never);
      const { events } = capture(select, ['loadMore']);
      select.setItems([{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]);
      select.open();

      await vi.waitFor(() => {
        if (!loadMoreButton(select)) throw new Error('waiting for load-more button');
      }, { timeout: 2000 });
      loadMoreButton(select)!.click();
      await vi.waitFor(() => {
        if ((events.loadMore as unknown[]).length === 0) throw new Error('waiting for loadMore');
      }, { timeout: 2000 });

      const detail = events.loadMore[0] as { page: number; items: unknown[] };
      expect(detail.page).toBe(2);
      expect(detail.items).toEqual([]);
      // A legacy load-more event detail has no acknowledged request envelope.
      expect((detail as { request?: unknown }).request).toBeUndefined();
    });
  });

  describe('EVENT-012: diagnostic (boundedness — Partial)', () => {
    it('emits a resource-limit diagnostic carrying source, name, bounded detail, and mirrors it in the snapshot', async () => {
      const select = createSelect({
        dataLoading: { protocol: 'acknowledged', searchMode: 'remote', paginationMode: 'cursor', fetchLimit: 5 },
      });
      const { events } = capture(select, ['diagnostic']);

      const request = await startLoading(select);
      const result = select.completeDataRequest(
        completion(request, {
          status: 'succeeded',
          items: [{ value: 'a', label: 'A' }],
          hasMore: true,
          nextCursor: 'x'.repeat(50_000),
        }) as never,
      );

      expect(result).toBe('resource-limit');
      expect(events.diagnostic).toHaveLength(1);
      const detail = events.diagnostic[0] as {
        source: string;
        name: string;
        timestamp: number;
        detail: {
          reason: string;
          maxCursorTokenBytes: number;
          actualCursorTokenBytes: number;
          requestId: string;
        };
      };
      expect(detail.source).toBe('event');
      expect(detail.name).toBe('acknowledgedDataLoadingResourceLimit');
      expect(typeof detail.timestamp).toBe('number');
      // The diagnostic's bounded `detail` is the coordinator resource-limit object.
      expect(detail.detail).toMatchObject({
        reason: 'cursor-token-size',
        maxCursorTokenBytes: 1024,
        actualCursorTokenBytes: 50_000,
        requestId: request.requestId,
      });
      // The same resource-limit is reflected on the public snapshot.
      expect(select.getDataLoadingState().resourceLimit).toEqual(detail.detail);
    });

    it('emits one diagnostic per resource-limit result — a replayed completion re-emits (boundedness is per-result, not global)', async () => {
      const select = createSelect({
        dataLoading: { protocol: 'acknowledged', searchMode: 'remote', paginationMode: 'cursor', fetchLimit: 5 },
      });
      const { events } = capture(select, ['diagnostic']);

      const request = await startLoading(select);
      const oversized = completion(request, {
        status: 'succeeded',
        items: [{ value: 'a', label: 'A' }],
        hasMore: true,
        nextCursor: 'x'.repeat(50_000),
      }) as never;

      expect(select.completeDataRequest(oversized)).toBe('resource-limit');
      expect(events.diagnostic).toHaveLength(1);

      // A replayed completion against the same still-active request again
      // classifies as resource-limit and emits a further diagnostic. This is
      // why the boundedness claim is scoped per-result, not global — EVENT-012
      // stays Partial (projection-failure diagnostic uncharacterized, below).
      expect(select.completeDataRequest(oversized)).toBe('resource-limit');
      expect(events.diagnostic).toHaveLength(2);
      for (const entry of events.diagnostic as { name: string }[]) {
        expect(entry.name).toBe('acknowledgedDataLoadingResourceLimit');
      }
    });

    it('emits no diagnostic on a healthy acknowledged success (projection-failure diagnostic not exercised)', async () => {
      const select = createSelect();
      const { events } = capture(select, ['diagnostic']);

      const request = await startLoading(select);
      select.completeDataRequest(
        completion(request, { status: 'succeeded', items: [{ value: 'a', label: 'A' }], hasMore: true }) as never,
      );
      await waitSettled(select, 'succeeded');

      // No resource-limit and no projection-failure diagnostic is emitted for a
      // healthy cycle. The `acknowledgedProjectionFailed` diagnostic is NOT
      // characterized here: it is reachable only via a projection exception
      // path that has no deterministic public trigger in this increment (see
      // EVENT-020 / evidence). EVENT-012 therefore remains Partial.
      expect(events.diagnostic).toHaveLength(0);
    });
  });

  describe('EVENT-020: dataProjection', () => {
    it('emits one dataProjection "complete" whose detail matches the request id, generation, and attempt', async () => {
      const select = createSelect();
      const { events } = capture(select, ['dataProjection']);

      const request = await startLoading(select);
      select.completeDataRequest(
        completion(request, { status: 'succeeded', items: [{ value: 'a', label: 'A' }], hasMore: true }) as never,
      );
      await waitSettled(select, 'succeeded');

      expect(events.dataProjection).toHaveLength(1);
      const detail = events.dataProjection[0] as DataProjectionEventDetail;
      expect(detail.status).toBe('complete');
      expect(detail.requestId).toBe(request.requestId);
      expect(detail.queryGeneration).toBe(request.queryGeneration);
      expect(typeof (detail as { attempt: number }).attempt).toBe('number');
    });

    it('emits exactly one dataProjection per accepted completion across successive requests', async () => {
      const select = createSelect();
      const { events } = capture(select, ['dataProjection']);

      const first = await startLoading(select);
      select.completeDataRequest(
        completion(first, { status: 'succeeded', items: [{ value: 'a', label: 'A' }], hasMore: true }) as never,
      );
      await waitSettled(select, 'succeeded');

      // Trigger a load-more request and complete it too.
      await vi.waitFor(() => {
        if (!loadMoreButton(select)) throw new Error('waiting for button');
      }, { timeout: 2000 });
      loadMoreButton(select)!.click();
      await waitSettled(select, 'loading');
      const second = select.getDataLoadingState().activeRequest!;
      select.completeDataRequest(
        completion(second, { status: 'exhausted', items: [{ value: 'b', label: 'B' }], hasMore: false }) as never,
      );
      await waitSettled(select, 'exhausted');

      expect((events.dataProjection as DataProjectionEventDetail[]).map((d) => d.status)).toEqual(['complete', 'complete']);
      // Each projection corresponds to a distinct request id.
      const ids = (events.dataProjection as DataProjectionEventDetail[]).map((d) => d.requestId);
      expect(new Set(ids).size).toBe(2);
    });
  });

  describe('EVENT-021: dataRequestCancel', () => {
    it('emits dataRequestCancel with reason "query-changed" when the query supersedes an active request', async () => {
      const select = createSelect();
      const { events } = capture(select, ['dataRequestCancel']);

      const request = await startLoading(select);
      typeQuery(select, 'abc');
      await vi.waitFor(() => {
        if ((events.dataRequestCancel as unknown[]).length === 0) throw new Error('waiting for cancel');
      }, { timeout: 2000 });

      const detail = events.dataRequestCancel[0] as DataRequestCancelNotification;
      expect(detail.reason).toBe('query-changed');
      expect(detail.requestId).toBe(request.requestId);
      expect(detail.queryGeneration).toBe(request.queryGeneration);
    });

    it('emits dataRequestCancel with reason "config-changed" when a threshold change invalidates an active request', async () => {
      const select = createSelect();
      const { events } = capture(select, ['dataRequestCancel']);

      // Settle the initial empty search so the typed query starts a fresh request.
      const first = await startLoading(select);
      select.completeDataRequest(
        completion(first, { status: 'exhausted', items: [], hasMore: false }) as never,
      );
      await waitSettled(select, 'exhausted');

      typeQuery(select, 'a');
      await waitSettled(select, 'loading');
      const active = select.getDataLoadingState().activeRequest!;

      // Raising the threshold above the current query length flips eligibility.
      select.updateConfig({
        dataLoading: { protocol: 'acknowledged', searchMode: 'remote', fetchLimit: 5, minSearchCharacters: 5 },
      });
      await vi.waitFor(() => {
        if ((events.dataRequestCancel as unknown[]).length === 0) throw new Error('waiting for cancel');
      }, { timeout: 2000 });

      const detail = events.dataRequestCancel[0] as DataRequestCancelNotification;
      expect(detail.reason).toBe('config-changed');
      expect(detail.requestId).toBe(active.requestId);
      expect(detail.queryGeneration).toBe(active.queryGeneration);
      // The full cancellation notification carries exactly the three fields.
      expect(Object.keys(detail).sort()).toEqual(['queryGeneration', 'reason', 'requestId']);
      // Exactly one cancellation for the one superseded request.
      expect(events.dataRequestCancel).toHaveLength(1);
    });

    it('emits dataRequestCancel with reason "disconnected" when the element is removed while a request is active', async () => {
      const select = createSelect();
      const { events } = capture(select, ['dataRequestCancel']);

      const request = await startLoading(select);
      select.remove();
      await vi.waitFor(() => {
        if ((events.dataRequestCancel as unknown[]).length === 0) throw new Error('waiting for cancel');
      }, { timeout: 2000 });

      const detail = events.dataRequestCancel[0] as DataRequestCancelNotification;
      expect(detail.reason).toBe('disconnected');
      expect(detail.requestId).toBe(request.requestId);
      expect(detail.queryGeneration).toBe(request.queryGeneration);
      // The full cancellation notification carries exactly the three fields.
      expect(Object.keys(detail).sort()).toEqual(['queryGeneration', 'reason', 'requestId']);
      expect(events.dataRequestCancel).toHaveLength(1);
    });

    it('invokes onDataRequestCancel with the same detail object (reference identity) and emits before the callback', async () => {
      const select = createSelect();
      const order: string[] = [];
      const callback = vi.fn(() => order.push('callback'));
      select.updateConfig({ callbacks: { onDataRequestCancel: callback } });
      const { events } = capture(select, ['dataRequestCancel']);
      select.addEventListener('dataRequestCancel', () => order.push('event'));

      await startLoading(select);
      typeQuery(select, 'abc');
      await vi.waitFor(() => {
        if ((events.dataRequestCancel as unknown[]).length === 0) throw new Error('waiting for cancel');
      }, { timeout: 2000 });

      expect(callback).toHaveBeenCalledTimes(1);
      // The callback receives the exact same object dispatched on the event.
      expect(callback.mock.calls[0][0]).toBe(events.dataRequestCancel[0]);
      // The event is dispatched before the callback is invoked.
      expect(order).toEqual(['event', 'callback']);
    });
  });

  describe('EVENT-022: dataLoadingConfigError', () => {
    it('emits dataLoadingConfigError whose detail is an issues array describing the rejected field', () => {
      const select = createSelect();
      const { events } = capture(select, ['dataLoadingConfigError']);

      select.updateConfig({ dataLoading: { protocol: 'bogus' } as never });

      expect(events.dataLoadingConfigError).toHaveLength(1);
      const detail = events.dataLoadingConfigError[0] as DataLoadingConfigErrorEventDetail;
      expect(Array.isArray(detail.issues)).toBe(true);
      expect(detail.issues.length).toBeGreaterThan(0);
      expect(detail.issues[0]).toMatchObject({ path: 'protocol', code: 'invalid-value' });
      expect(typeof detail.issues[0].message).toBe('string');
    });

    it('does not emit dataLoadingConfigError for a valid update and deduplicates an identical repeated candidate', () => {
      const select = createSelect();
      const { events } = capture(select, ['dataLoadingConfigError']);

      select.updateConfig({ dataLoading: { protocol: 'acknowledged', searchMode: 'remote', fetchLimit: 5 } });
      expect(events.dataLoadingConfigError).toHaveLength(0);

      const invalid = { dataLoading: { protocol: 'bogus' } as never };
      select.updateConfig(invalid);
      select.updateConfig(invalid);
      expect(events.dataLoadingConfigError).toHaveLength(1);
    });
  });
});
