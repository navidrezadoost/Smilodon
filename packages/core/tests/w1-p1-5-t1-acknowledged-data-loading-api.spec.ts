import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select.js';
import { resetSelectConfig } from '../src/config/global-config.js';
import type {
  DataLoadingConfigErrorEventDetail,
  DataRequest,
} from '../src/data-loading/public-types.js';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

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

function withCallback(
  request: DataRequest,
  overrides?: Partial<Record<string, unknown>>,
): Record<string, unknown> {
  return {
    requestId: request.requestId,
    queryGeneration: request.queryGeneration,
    status: 'succeeded',
    items: [{ value: 'a', label: 'A' }],
    hasMore: true,
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

    it('invokes onDataLoadingConfigError callback with the same detail object emitted on the event', () => {
      const select = createSelect();
      const events: DataLoadingConfigErrorEventDetail[] = [];
      const callback = vi.fn();
      select.addEventListener('dataLoadingConfigError', (event) => {
        events.push((event as CustomEvent<DataLoadingConfigErrorEventDetail>).detail);
      });
      select.updateConfig({ callbacks: { onDataLoadingConfigError: callback } });

      select.updateConfig({ dataLoading: { protocol: 'bogus' } as never });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(events[0]);
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
      await flush();

      expect(requests).toHaveLength(1);
      expect(select.getDataLoadingState().activeRequest?.requestId).toBe(requests[0].requestId);
    });

    it('emits exactly one initial search when startDataLoading is called repeatedly after connect', async () => {
      const select = createSelect();
      const requests = collectSearches(select);

      select.startDataLoading();
      select.startDataLoading();
      select.startDataLoading();
      await flush();

      expect(requests).toHaveLength(1);
    });

    it('is a no-op for the legacy protocol and leaves idle state', async () => {
      const select = createSelect({
        dataLoading: { protocol: 'legacy' },
      });
      const requests = collectSearches(select);

      select.startDataLoading();
      await flush();

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
      await flush();

      expect(requests).toHaveLength(1);
      const state = select.getDataLoadingState();
      expect(state.status).toBe('loading');
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

      const result = select.completeDataRequest(withCallback(requests[0]) as never);
      expect(result).toBe('accepted');
      // accepted is a synchronous classification; projection settles asynchronously
      expect(select.getDataLoadingState().projectionPending).toBe(true);

      await flush();
      const completed = select.getDataLoadingState();
      expect(completed.status).toBe('succeeded');
      expect(completed.busy).toBe(false);
      expect(completed.activeRequest).toBeNull();
    });

    it('returns detached snapshots so mutating one does not affect internal state', () => {
      const select = createSelect();
      collectSearches(select);
      select.startDataLoading();

      const first = select.getDataLoadingState();
      expect(first.activeRequest).not.toBeNull();
      // Mutate the returned snapshot aggressively.
      (first.activeRequest as { position: { page?: number } }).position.page = 999;
      (first as { status: string }).status = 'tampered';

      const second = select.getDataLoadingState();
      expect(second.status).toBe('loading');
      expect(second.activeRequest?.position).not.toMatchObject({ page: 999 });
    });
  });

  describe('API-062: completeDataRequest matrix', () => {
    it('returns "invalid" for malformed completion envelopes', () => {
      const select = createSelect();
      collectSearches(select);
      select.startDataLoading();

      expect(select.completeDataRequest({} as never)).toBe('invalid');
      expect(select.completeDataRequest(null as never)).toBe('invalid');
    });

    it('returns "unknown-request" for an unrecognized requestId and does not mutate state', () => {
      const select = createSelect();
      const requests = collectSearches(select);
      select.startDataLoading();
      const before = select.getDataLoadingState();
      const nodeCount = select.shadowRoot?.querySelectorAll('[role="option"]').length ?? 0;

      const result = select.completeDataRequest(
        withCallback(requests[0], { requestId: 'no-such-request' }) as never,
      );

      expect(result).toBe('unknown-request');
      const after = select.getDataLoadingState();
      expect(after.status).toBe(before.status);
      expect(after.activeRequest?.requestId).toBe(before.activeRequest?.requestId);
      expect(select.shadowRoot?.querySelectorAll('[role="option"]').length ?? 0).toBe(nodeCount);
    });

    it('returns "stale" when completing a superseded request after a newer search advances the generation', async () => {
      const select = createSelect({ searchable: true });
      const requests = collectSearches(select);
      select.startDataLoading();
      const first = requests[0];

      const input = select.shadowRoot!.querySelector('input[part="input"]') as HTMLInputElement;
      input.value = 'abc';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await flush();

      expect(requests.length).toBeGreaterThanOrEqual(2);
      expect(requests[requests.length - 1].queryGeneration).not.toBe(first.queryGeneration);

      const result = select.completeDataRequest(withCallback(first) as never);
      expect(result).toBe('stale');
    });

    it('accepts a matching completion synchronously while projecting the result asynchronously', async () => {
      const select = createSelect();
      const requests = collectSearches(select);
      select.startDataLoading();

      const result = select.completeDataRequest(
        withCallback(requests[0], {
          status: 'exhausted',
          items: [{ value: 'one', label: 'One' }],
          hasMore: false,
        }) as never,
      );

      // Synchronous acceptance, projection still pending.
      expect(result).toBe('accepted');
      expect(select.getDataLoadingState().projectionPending).toBe(true);

      await flush();
      const settled = select.getDataLoadingState();
      expect(settled.projectionPending).toBe(false);
      expect(settled.status).toBe('exhausted');
    });

    it('returns "resource-limit" and emits a diagnostic for an oversized cursor token', () => {
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

      const result = select.completeDataRequest(
        withCallback(requests[0], { nextCursor: 'x'.repeat(50_000) }) as never,
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

    it('returns "invalid" without projecting items for an unrecognized status', () => {
      const select = createSelect();
      const requests = collectSearches(select);
      select.startDataLoading();
      const nodeCount = select.shadowRoot?.querySelectorAll('[role="option"]').length ?? 0;

      const result = select.completeDataRequest(
        withCallback(requests[0], { status: 'bogus' }) as never,
      );

      expect(result).toBe('invalid');
      expect(select.shadowRoot?.querySelectorAll('[role="option"]').length ?? 0).toBe(nodeCount);
    });

    it('without an acknowledged coordinator validates shape and returns invalid/unknown-request only', () => {
      const select = createSelect({
        dataLoading: { protocol: 'legacy' },
      });

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
