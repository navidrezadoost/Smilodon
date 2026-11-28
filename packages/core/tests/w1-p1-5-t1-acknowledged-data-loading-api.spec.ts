import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select.js';
import { resetSelectConfig } from '../src/config/global-config.js';
import type {
  DataLoadingConfigErrorEventDetail,
  DataProjectionEventDetail,
  DataRequest,
} from '../src/data-loading/public-types.js';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

type SelectUpdate = Parameters<EnhancedSelect['updateConfig']>[0];

/**
 * Create and mount an <enhanced-select> with an acknowledged remote setup by
 * default. Additional top-level overrides (e.g. `searchable`) merge in without
 * clobbering the default dataLoading configuration.
 */
function createSelect(overrides?: Partial<SelectUpdate>): EnhancedSelect {
  const select = document.createElement('enhanced-select') as EnhancedSelect;
  select.updateConfig({
    infiniteScroll: { enabled: true, pageSize: 5 },
    dataLoading: { protocol: 'acknowledged', searchMode: 'remote', fetchLimit: 5 },
    ...overrides,
  } as SelectUpdate);
  document.body.appendChild(select);
  return select;
}

function collectSearches(select: EnhancedSelect): DataRequest[] {
  const requests: DataRequest[] = [];
  select.addEventListener('search', (event) => {
    const detail = (event as CustomEvent).detail;
    if (detail?.request) requests.push(detail.request as DataRequest);
  });
  return requests;
}

function renderedValues(select: EnhancedSelect): string[] {
  return Array.from(select.shadowRoot?.querySelectorAll('[role="option"]') ?? []).map(
    (node) => (node as HTMLElement).dataset.value ?? '',
  );
}

/**
 * Deterministic settlement: poll the PUBLIC state predicate rather than a bare
 * event-loop yield. Resolves once the accepted projection has finished
 * (projectionPending false) and, when requested, the terminal status is reached.
 */
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

function completion(
  request: DataRequest,
  overrides: Record<string, unknown>,
): Record<string, unknown> {
  return {
    requestId: request.requestId,
    queryGeneration: request.queryGeneration,
    ...overrides,
  };
}

describe('W1-P1.5-T1 acknowledged data-loading public API characterization', () => {
  beforeEach(() => {
    resetSelectConfig();
  });

  afterEach(() => {
    document.body.replaceChildren();
    resetSelectConfig();
    vi.useRealTimers();
  });

  describe('API-032: updateConfig invalid data-loading config', () => {
    it('emits dataLoadingConfigError with structured issues when the dataLoading candidate is invalid', () => {
      const select = createSelect();
      const events: DataLoadingConfigErrorEventDetail[] = [];
      select.addEventListener('dataLoadingConfigError', (event) => {
        events.push((event as CustomEvent<DataLoadingConfigErrorEventDetail>).detail);
      });

      select.updateConfig({ dataLoading: { protocol: 'bogus' } as never });

      expect(events).toHaveLength(1);
      expect(Array.isArray(events[0].issues)).toBe(true);
      expect(events[0].issues.length).toBeGreaterThan(0);
      expect(events[0].issues[0]).toMatchObject({ path: 'protocol', code: 'invalid-value' });
    });

    it('emits the event before invoking onDataLoadingConfigError, with the same detail object', () => {
      const select = createSelect();
      const order: string[] = [];
      const callback = vi.fn((detail: DataLoadingConfigErrorEventDetail) => {
        order.push('callback');
        return detail;
      });
      select.addEventListener('dataLoadingConfigError', () => order.push('event'));
      select.updateConfig({ callbacks: { onDataLoadingConfigError: callback } });

      select.updateConfig({ dataLoading: { protocol: 'bogus' } as never });

      // Deterministic public ordering: the event fires before the callback.
      expect(order).toEqual(['event', 'callback']);
      expect(callback).toHaveBeenCalledTimes(1);
      const eventDetail = new Promise<DataLoadingConfigErrorEventDetail>((resolve) => {
        select.addEventListener('dataLoadingConfigError', (e) => resolve((e as CustomEvent).detail));
      });
      select.updateConfig({ dataLoading: { protocol: 'nope' } as never });
      // The callback receives exactly the detail that is emitted on the event.
      return eventDetail.then((detail) => {
        expect(callback).toHaveBeenLastCalledWith(detail);
      });
    });

    it('deduplicates identical invalid candidates but re-emits after a valid config resets the signature', () => {
      const select = createSelect();
      const events: DataLoadingConfigErrorEventDetail[] = [];
      select.addEventListener('dataLoadingConfigError', (event) => {
        events.push((event as CustomEvent<DataLoadingConfigErrorEventDetail>).detail);
      });

      const invalid = { dataLoading: { protocol: 'bogus' } as never };
      select.updateConfig(invalid);
      select.updateConfig(invalid); // identical signature: suppressed
      expect(events).toHaveLength(1);

      select.updateConfig({
        dataLoading: { protocol: 'acknowledged', searchMode: 'remote', fetchLimit: 5 },
      }); // valid resets dedup state
      select.updateConfig(invalid); // same invalid again: re-emitted

      expect(events).toHaveLength(2);
    });

    it('does not emit dataLoadingConfigError for a valid dataLoading update', () => {
      const select = createSelect();
      const events: DataLoadingConfigErrorEventDetail[] = [];
      select.addEventListener('dataLoadingConfigError', (event) => {
        events.push((event as CustomEvent<DataLoadingConfigErrorEventDetail>).detail);
      });

      select.updateConfig({
        dataLoading: { protocol: 'acknowledged', searchMode: 'hybrid', fetchLimit: 10 },
      });

      expect(events).toHaveLength(0);
    });

    it('does not emit dataLoadingConfigError for unrelated invalid configuration', () => {
      const select = createSelect();
      const events: DataLoadingConfigErrorEventDetail[] = [];
      select.addEventListener('dataLoadingConfigError', (event) => {
        events.push((event as CustomEvent<DataLoadingConfigErrorEventDetail>).detail);
      });

      // Invalid scrollToSelected / selectedOptions are rejected by their own
      // validators and never surface on the data-loading config-error channel.
      select.updateConfig({ scrollToSelected: { enabled: 'notabool' } as never });
      select.updateConfig({ selectedOptions: { maxCount: -5 } as never });

      expect(events).toHaveLength(0);
    });
  });

  describe('API-060: startDataLoading before vs after connect', () => {
    it('defers the initial search until connected when startDataLoading is called before mounting', async () => {
      const select = document.createElement('enhanced-select') as EnhancedSelect;
      select.updateConfig({
        infiniteScroll: { enabled: true, pageSize: 5 },
        dataLoading: { protocol: 'acknowledged', searchMode: 'remote', fetchLimit: 5 },
      });
      const requests = collectSearches(select);

      select.startDataLoading(); // not connected yet
      expect(requests).toHaveLength(0);

      document.body.appendChild(select);
      await vi.waitFor(() => {
        if (requests.length !== 1) throw new Error('waiting for deferred search');
      }, { timeout: 2000 });

      expect(select.getDataLoadingState().activeRequest?.requestId).toBe(requests[0].requestId);
    });

    it('emits exactly one initial search when startDataLoading is called repeatedly after connect', async () => {
      const select = createSelect();
      const requests = collectSearches(select);

      select.startDataLoading();
      select.startDataLoading();
      select.startDataLoading();
      await waitSettled(select, 'loading');

      expect(requests).toHaveLength(1);
    });

    it('is a no-op for the legacy protocol and leaves idle state', () => {
      const select = createSelect({ dataLoading: { protocol: 'legacy' } });
      const requests = collectSearches(select);

      select.startDataLoading();

      expect(requests).toHaveLength(0);
      const state = select.getDataLoadingState();
      expect(state.status).toBe('idle');
      expect(state.busy).toBe(false);
      expect(state.activeRequest).toBeNull();
    });

    it('emits a search request observable through both the event and the state snapshot', async () => {
      const select = createSelect();
      const requests = collectSearches(select);

      select.startDataLoading();
      await waitSettled(select, 'loading');

      expect(requests).toHaveLength(1);
      const state = select.getDataLoadingState();
      expect(state.busy).toBe(true);
      expect(state.activeRequest?.requestId).toBe(requests[0].requestId);
      expect(state.activeRequest?.queryGeneration).toBe(requests[0].queryGeneration);
    });
  });

  describe('API-061: getDataLoadingState snapshots', () => {
    it('reports an idle snapshot before startDataLoading is called', () => {
      const select = createSelect();

      const state = select.getDataLoadingState();

      expect(state.status).toBe('idle');
      expect(state.busy).toBe(false);
      expect(state.activeRequest).toBeNull();
      expect(state.error).toBeNull();
    });

    it('reports an active snapshot while a request is outstanding and a completed snapshot after acceptance', async () => {
      const select = createSelect();
      const requests = collectSearches(select);
      select.startDataLoading();

      const active = select.getDataLoadingState();
      expect(active.status).toBe('loading');
      expect(active.activeRequest?.requestId).toBe(requests[0].requestId);

      const result = select.completeDataRequest(
        completion(requests[0], { status: 'exhausted', items: [{ value: 'one', label: 'One' }], hasMore: false }) as never,
      );
      expect(result).toBe('accepted');
      // accepted is a synchronous classification; projection settles asynchronously
      expect(select.getDataLoadingState().projectionPending).toBe(true);

      await waitSettled(select, 'exhausted');
      const completed = select.getDataLoadingState();
      expect(completed.busy).toBe(false);
      expect(completed.activeRequest).toBeNull();
    });

    it('returns detached snapshots so mutating one does not affect internal state', () => {
      const select = createSelect();
      collectSearches(select);
      select.startDataLoading();

      const first = select.getDataLoadingState();
      expect(first.activeRequest).not.toBeNull();
      (first.activeRequest as { position: { page?: number } }).position.page = 999;
      (first as { status: string }).status = 'tampered';

      const second = select.getDataLoadingState();
      expect(second.status).toBe('loading');
      expect(second.activeRequest?.position).not.toMatchObject({ page: 999 });
    });
  });

  describe('API-062: completeDataRequest completion matrix', () => {
    it('returns "invalid" for malformed completion envelopes without mutating state, DOM, or emitting events', async () => {
      const select = createSelect();
      const requests = collectSearches(select);
      const events: string[] = [];
      for (const name of ['dataProjection', 'error', 'diagnostic', 'dataLoadingConfigError']) {
        select.addEventListener(name, () => events.push(name));
      }
      select.startDataLoading();
      await waitSettled(select, 'loading');

      const before = select.getDataLoadingState();
      const beforeValues = renderedValues(select);
      const beforeEvents = events.length;

      expect(select.completeDataRequest({} as never)).toBe('invalid');
      expect(select.completeDataRequest(null as never)).toBe('invalid');
      expect(
        select.completeDataRequest(completion(requests[0], { status: 'bogus' }) as never),
      ).toBe('invalid');

      await vi.waitFor(() => {
        // give any erroneous async side effects a chance to surface
        expect(events.length).toBe(beforeEvents);
      }, { timeout: 500 });
      const after = select.getDataLoadingState();
      expect(after.status).toBe(before.status);
      expect(after.activeRequest?.requestId).toBe(before.activeRequest?.requestId);
      expect(after.queryGeneration).toBe(before.queryGeneration);
      expect(renderedValues(select)).toEqual(beforeValues);
      expect(events.length).toBe(beforeEvents);
    });

    it('returns "unknown-request" without disturbing a rendered result, state, or events', async () => {
      const select = createSelect();
      const requests = collectSearches(select);
      const events: string[] = [];
      for (const name of ['dataProjection', 'error', 'diagnostic', 'dataLoadingConfigError']) {
        select.addEventListener(name, () => events.push(name));
      }
      select.startDataLoading();
      await waitSettled(select, 'loading');

      const accepted = select.completeDataRequest(
        completion(requests[0], {
          status: 'succeeded',
          items: [{ value: 'a', label: 'Apple' }, { value: 'b', label: 'Banana' }],
          hasMore: true,
        }) as never,
      );
      expect(accepted).toBe('accepted');
      await waitSettled(select, 'succeeded');

      const before = select.getDataLoadingState();
      const beforeValues = renderedValues(select);
      expect(beforeValues).toEqual(['a', 'b']);
      const beforeEvents = events.length;

      const result = select.completeDataRequest(
        completion(requests[0], {
          requestId: 'no-such-request',
          status: 'succeeded',
          items: [{ value: 'z', label: 'Z' }],
          hasMore: true,
        }) as never,
      );

      expect(result).toBe('unknown-request');
      await vi.waitFor(() => {
        expect(events.length).toBe(beforeEvents);
      }, { timeout: 500 });
      expect(renderedValues(select)).toEqual(beforeValues);
      const after = select.getDataLoadingState();
      expect(after.status).toBe(before.status);
      expect(after.activeRequest?.requestId).toBe(before.activeRequest?.requestId);
    });

    it('returns "stale" for a superseded request and leaves the newer active request, state, DOM, and events untouched', async () => {
      const select = createSelect({ searchable: true });
      const requests = collectSearches(select);
      const events: string[] = [];
      for (const name of ['dataProjection', 'error', 'diagnostic', 'dataLoadingConfigError']) {
        select.addEventListener(name, () => events.push(name));
      }
      select.startDataLoading();
      await waitSettled(select, 'loading');
      const first = requests[0];

      const input = select.shadowRoot!.querySelector('input[part="input"]') as HTMLInputElement;
      input.value = 'abc';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await vi.waitFor(() => {
        if (requests.length < 2) throw new Error('waiting for superseding search');
      }, { timeout: 2000 });
      await waitSettled(select, 'loading');

      const newer = requests[requests.length - 1];
      expect(newer.queryGeneration).not.toBe(first.queryGeneration);

      const before = select.getDataLoadingState();
      const beforeValues = renderedValues(select);
      const beforeEvents = events.length;
      expect(before.activeRequest?.requestId).toBe(newer.requestId);

      const result = select.completeDataRequest(
        completion(first, { status: 'succeeded', items: [{ value: 'a', label: 'A' }], hasMore: true }) as never,
      );

      expect(result).toBe('stale');
      await vi.waitFor(() => {
        expect(events.length).toBe(beforeEvents);
      }, { timeout: 500 });
      const after = select.getDataLoadingState();
      // The superseded completion must not disturb the newer active request.
      expect(after.status).toBe(before.status);
      expect(after.activeRequest?.requestId).toBe(newer.requestId);
      expect(after.queryGeneration).toBe(newer.queryGeneration);
      expect(renderedValues(select)).toEqual(beforeValues);
      expect(events.length).toBe(beforeEvents);
    });

    it('accepts a matching completion synchronously while projecting the result asynchronously', async () => {
      const select = createSelect();
      const requests = collectSearches(select);
      select.startDataLoading();
      await waitSettled(select, 'loading');

      const result = select.completeDataRequest(
        completion(requests[0], {
          status: 'exhausted',
          items: [{ value: 'one', label: 'One' }],
          hasMore: false,
        }) as never,
      );

      // Synchronous acceptance, projection still pending.
      expect(result).toBe('accepted');
      expect(select.getDataLoadingState().projectionPending).toBe(true);

      await waitSettled(select, 'exhausted');
      expect(select.getDataLoadingState().projectionPending).toBe(false);
    });

    describe('terminal-status matrix (each completes and settles deterministically)', () => {
      const matrix: Array<{
        name: string;
        payload: Record<string, unknown>;
        endStatus: string;
        hasMore: boolean;
        values: string[];
        error: Record<string, unknown> | null;
      }> = [
        {
          name: 'succeeded',
          payload: { status: 'succeeded', items: [{ value: 'a', label: 'A' }], hasMore: true },
          endStatus: 'succeeded',
          hasMore: true,
          values: ['a'],
          error: null,
        },
        {
          name: 'exhausted',
          payload: { status: 'exhausted', items: [{ value: 'b', label: 'B' }], hasMore: false },
          endStatus: 'exhausted',
          hasMore: false,
          values: ['b'],
          error: null,
        },
        {
          name: 'empty-advance-next',
          payload: { status: 'empty', hasMore: true, advance: 'next' },
          endStatus: 'empty',
          hasMore: true,
          values: [],
          error: null,
        },
        {
          name: 'empty-advance-retry',
          payload: { status: 'empty', hasMore: true, advance: 'retry' },
          endStatus: 'empty',
          hasMore: true,
          values: [],
          error: null,
        },
        {
          name: 'failed',
          payload: { status: 'failed', error: { message: 'boom', retryable: true } },
          endStatus: 'failed',
          hasMore: false,
          values: [],
          error: { message: 'boom', retryable: true },
        },
        {
          name: 'cancelled',
          payload: { status: 'cancelled' },
          endStatus: 'cancelled',
          hasMore: false,
          values: [],
          error: null,
        },
      ];

      for (const entry of matrix) {
        it(`projects a "${entry.name}" completion to status "${entry.endStatus}" and emits one dataProjection`, async () => {
          const select = createSelect();
          const requests = collectSearches(select);
          const projections: DataProjectionEventDetail[] = [];
          select.addEventListener('dataProjection', (event) => {
            projections.push((event as CustomEvent<DataProjectionEventDetail>).detail);
          });
          select.startDataLoading();
          await waitSettled(select, 'loading');

          const result = select.completeDataRequest(
            completion(requests[0], entry.payload) as never,
          );
          expect(result).toBe('accepted');
          expect(select.getDataLoadingState().projectionPending).toBe(true);

          await waitSettled(select, entry.endStatus);
          const state = select.getDataLoadingState();
          expect(state.projectionPending).toBe(false);
          expect(state.busy).toBe(false);
          expect(state.activeRequest).toBeNull();
          expect(state.hasMore).toBe(entry.hasMore);
          expect(state.error).toEqual(entry.error);
          expect(renderedValues(select)).toEqual(entry.values);
          expect(projections.map((detail) => detail.status)).toEqual(['complete']);
        });
      }
    });

    it('returns "resource-limit" and emits a diagnostic for an oversized cursor token', async () => {
      const select = createSelect({
        dataLoading: {
          protocol: 'acknowledged',
          searchMode: 'remote',
          paginationMode: 'cursor',
          fetchLimit: 5,
        },
      });
      const requests = collectSearches(select);
      const diagnostics: Array<Record<string, unknown>> = [];
      select.addEventListener('diagnostic', (event) => {
        diagnostics.push((event as CustomEvent).detail);
      });
      select.startDataLoading();
      await waitSettled(select, 'loading');

      const result = select.completeDataRequest(
        completion(requests[0], {
          status: 'succeeded',
          items: [{ value: 'a', label: 'A' }],
          hasMore: true,
          nextCursor: 'x'.repeat(50_000),
        }) as never,
      );

      expect(result).toBe('resource-limit');
      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0]).toMatchObject({
        source: 'event',
        name: 'acknowledgedDataLoadingResourceLimit',
      });
      expect(select.getDataLoadingState().resourceLimit).toMatchObject({
        reason: 'cursor-token-size',
      });
    });

    it('does not expose a public hook to lower the cursor-depth cap (cursor-depth subpath remains outstanding)', () => {
      const select = createSelect();
      const events: DataLoadingConfigErrorEventDetail[] = [];
      select.addEventListener('dataLoadingConfigError', (event) => {
        events.push((event as CustomEvent<DataLoadingConfigErrorEventDetail>).detail);
      });

      // maxCursorPages is an internal coordinator policy field, not part of the
      // public DataLoadingConfig surface. Supplying it is rejected as unknown.
      select.updateConfig({
        dataLoading: {
          protocol: 'acknowledged',
          searchMode: 'remote',
          paginationMode: 'cursor',
          fetchLimit: 5,
          maxCursorPages: 1,
        } as never,
      });

      expect(events).toHaveLength(1);
      expect(events[0].issues).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: 'maxCursorPages', code: 'unknown-field' })]),
      );
    });

    it('without an acknowledged coordinator validates shape and returns invalid/unknown-request only', () => {
      const select = createSelect({ dataLoading: { protocol: 'legacy' } });

      expect(select.completeDataRequest({} as never)).toBe('invalid');
      expect(
        select.completeDataRequest({
          requestId: 'unused',
          queryGeneration: 0,
          status: 'succeeded',
          items: [],
          hasMore: true,
        } as never),
      ).toBe('unknown-request');
    });
  });
});
