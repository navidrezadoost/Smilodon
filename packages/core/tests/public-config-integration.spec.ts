import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resetSelectConfig } from '../src/config/global-config.js';
import { EnhancedSelect } from '../src/components/enhanced-select.js';
import { validateDataLoadingConfig } from '../src/index.js';
import type {
  DataLoadingConfigErrorDetail,
  SelectInstanceConfig,
} from '../src/index.js';

describe('EnhancedSelect per-instance data-loading configuration', () => {
  let select: EnhancedSelect;

  beforeEach(() => {
    resetSelectConfig();
    select = document.createElement('enhanced-select') as EnhancedSelect;
    document.body.appendChild(select);
  });

  afterEach(() => {
    select.remove();
    resetSelectConfig();
  });

  it('defaults to legacy without creating or enabling a request coordinator', () => {
    expect((select as any)._dataLoadingConfig).toEqual({
      protocol: 'legacy',
      searchMode: 'local',
      paginationMode: 'page',
      firstPage: 1,
    });
    expect((select as any)._dataRequestCoordinator).toBeNull();
    expect((select as any)._acknowledgedReady).toBe(false);
    expect(validateDataLoadingConfig({})).toMatchObject({
      valid: true,
      value: { protocol: 'legacy', searchMode: 'local', paginationMode: 'page', firstPage: 1 },
    });
  });

  it('rejects only invalid dataLoading while applying unrelated valid configuration', () => {
    const order: string[] = [];
    const emitted: DataLoadingConfigErrorDetail[] = [];
    select.addEventListener('dataLoadingConfigError', (event) => {
      order.push('event');
      emitted.push((event as CustomEvent<DataLoadingConfigErrorDetail>).detail);
    });

    const config: SelectInstanceConfig = {
      searchable: true,
      placeholder: 'Updated independently',
      infiniteScroll: {
        enabled: false,
        pageSize: 37,
        initialPage: 6,
        cachePages: false,
        maxCachedPages: 0,
        preloadAdjacent: false,
        scrollRestoration: 'disabled',
      },
      callbacks: {
        onDataLoadingConfigError: (detail) => {
          order.push('callback');
          expect(detail).toBe(emitted[emitted.length - 1]);
        },
      },
      dataLoading: { protocol: 'legacy', searchMode: 'remote' },
    };

    select.updateConfig(config);

    expect((select as any)._config.searchable).toBe(true);
    expect((select as any)._config.placeholder).toBe('Updated independently');
    expect((select as any)._config.infiniteScroll.pageSize).toBe(37);
    expect((select as any)._dataLoadingConfig).toEqual({
      protocol: 'legacy',
      searchMode: 'local',
      paginationMode: 'page',
      firstPage: 1,
    });
    expect((select as any)._dataRequestCoordinator).toBeNull();
    expect(emitted).toHaveLength(1);
    expect(emitted[0].issues).toEqual([
      expect.objectContaining({ path: 'searchMode', code: 'requires-acknowledged-protocol' }),
    ]);
    expect(order).toEqual(['event', 'callback']);
  });

  it('deduplicates matching invalid diagnostics and re-arms after a valid candidate', () => {
    const emitted: DataLoadingConfigErrorDetail[] = [];
    select.addEventListener('dataLoadingConfigError', (event) => {
      emitted.push((event as CustomEvent<DataLoadingConfigErrorDetail>).detail);
    });

    select.updateConfig({ dataLoading: { protocol: 'legacy', searchMode: 'remote' } });
    select.updateConfig({ dataLoading: { searchMode: 'remote', protocol: 'legacy' } });
    expect(emitted).toHaveLength(1);

    select.updateConfig({ dataLoading: { protocol: 'legacy', searchMode: 'remote', fetchLimit: 0 } });
    expect(emitted).toHaveLength(2);

    select.updateConfig({ dataLoading: { protocol: 'acknowledged', searchMode: 'remote' } });
    expect((select as any)._dataLoadingConfig).toMatchObject({
      protocol: 'acknowledged',
      searchMode: 'remote',
    });
    expect((select as any)._dataRequestCoordinator).toBeNull();

    select.updateConfig({ dataLoading: { protocol: 'legacy', searchMode: 'remote' } });
    expect(emitted).toHaveLength(3);
  });

  it('rejects deeply nested unknown values without recursively traversing them', () => {
    const emitted: DataLoadingConfigErrorDetail[] = [];
    select.addEventListener('dataLoadingConfigError', (event) => {
      emitted.push((event as CustomEvent<DataLoadingConfigErrorDetail>).detail);
    });

    const createDeepCandidate = (leaf: string): SelectInstanceConfig => {
      let nested: unknown = { leaf };
      for (let depth = 0; depth < 20_000; depth += 1) nested = { child: nested };
      return { dataLoading: { unsupportedExtension: nested } } as unknown as SelectInstanceConfig;
    };

    expect(() => select.updateConfig(createDeepCandidate('first'))).not.toThrow();
    // The nested value cannot change the unknown-field diagnostic, so it remains the same
    // consecutive invalid configuration transition without requiring a deep clone or compare.
    expect(() => select.updateConfig(createDeepCandidate('second'))).not.toThrow();
    expect(emitted).toHaveLength(1);
    expect(emitted[0].issues).toEqual([
      expect.objectContaining({ path: 'unsupportedExtension', code: 'unknown-field' }),
    ]);
  });

  it('retains the last valid acknowledged configuration after an invalid update', () => {
    select.updateConfig({ dataLoading: { protocol: 'acknowledged', searchMode: 'hybrid', fetchLimit: 12 } });
    select.updateConfig({ dataLoading: { protocol: 'legacy', paginationMode: 'cursor' } });

    expect((select as any)._dataLoadingConfig).toEqual({
      protocol: 'acknowledged',
      searchMode: 'hybrid',
      paginationMode: 'page',
      firstPage: 1,
      fetchLimit: 12,
    });
    expect((select as any)._dataRequestCoordinator).toBeNull();
  });

  it('does not invalidate an already active request when rejecting a later invalid config', async () => {
    const requests: unknown[] = [];
    select.addEventListener('search', (event) => {
      requests.push((event as CustomEvent).detail);
    });

    (select as any)._enableAcknowledgedDataLoadingForTest({
      dataLoading: {
        protocol: 'acknowledged',
        searchMode: 'remote',
        fetchLimit: 2,
      },
      infiniteScroll: { enabled: false, pageSize: 2 },
    });
    await (select as any)._setAcknowledgedDataLoadingReadyForTest();

    const coordinator = (select as any)._dataRequestCoordinator;
    const coordinatorSnapshotBefore = coordinator.getSnapshot();
    const activeRequestId = coordinatorSnapshotBefore.activeRequest.requestId;
    const componentBusyBefore = (select as any)._state.isBusy;
    const projectionPendingBefore = (select as any)._acknowledgedProjectionPending;
    expect(coordinatorSnapshotBefore.busy).toBe(true);
    expect(componentBusyBefore).toBe(true);
    expect(projectionPendingBefore).toBe(false);
    expect(requests).toHaveLength(1);

    select.updateConfig({ dataLoading: { protocol: 'legacy', searchMode: 'remote' } });

    expect(coordinator.getSnapshot()).toEqual(coordinatorSnapshotBefore);
    expect(coordinator.getSnapshot().activeRequest.requestId).toBe(activeRequestId);
    expect((select as any)._state.isBusy).toBe(componentBusyBefore);
    expect((select as any)._acknowledgedProjectionPending).toBe(projectionPendingBefore);
    expect((select as any)._acknowledgedReady).toBe(true);
    expect(requests).toHaveLength(1);
  });
});
