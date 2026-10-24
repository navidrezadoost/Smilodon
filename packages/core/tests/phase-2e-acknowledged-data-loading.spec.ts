import { afterEach, describe, expect, it, vi } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

type TestItem = { id: string; value: string; label: string };
type ObserverRecord = {
  root: Element | Document | null;
  targets: Set<Element>;
  disconnected: boolean;
  emit: (target: Element, isIntersecting: boolean) => void;
};

const items: TestItem[] = [
  { id: 'a', value: 'a', label: 'Apple' },
  { id: 'b', value: 'b', label: 'Banana' },
  { id: 'c', value: 'c', label: 'Cherry' },
];

function createSelect(seed = items): EnhancedSelect {
  const select = document.createElement('enhanced-select') as EnhancedSelect;
  select.updateConfig({
    searchable: true,
    selection: { mode: 'multi', closeOnSelect: false },
    loadMore: { enabled: true, itemsPerLoad: 2 },
    infiniteScroll: { enabled: false, pageSize: 2 },
  });
  select.setItems(seed.slice());
  return select;
}

function enableAcknowledged(
  select: EnhancedSelect,
  config: Record<string, unknown> = {
    dataLoading: { protocol: 'acknowledged', searchMode: 'remote', fetchLimit: 2 },
    infiniteScroll: { pageSize: 2 },
  },
  options: { hasMore?: boolean } = {},
): void {
  (select as any)._enableAcknowledgedDataLoadingForTest(config, options);
}

function markReady(select: EnhancedSelect): Promise<void> {
  return (select as any)._setAcknowledgedDataLoadingReadyForTest();
}

function complete(select: EnhancedSelect, request: any, completion: Record<string, unknown>): Promise<string> {
  return (select as any)._completeDataRequestForTest({
    requestId: request.requestId,
    queryGeneration: request.queryGeneration,
    ...completion,
  });
}

function latestRequest(details: any[]): any {
  const detail = details[details.length - 1];
  expect(detail?.request).toBeTruthy();
  return detail.request;
}

function setInputQuery(select: EnhancedSelect, query: string): void {
  const input = select.shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')!;
  input.value = query;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}

function stubIntersectionObserver(): ObserverRecord[] {
  const records: ObserverRecord[] = [];
  class TestIntersectionObserver {
    private targets = new Set<Element>();
    private disconnected = false;
    readonly root: Element | Document | null;

    constructor(private callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      this.root = options?.root ?? null;
      const thisObserver = this;
      records.push({
        root: this.root,
        targets: this.targets,
        get disconnected() { return thisObserver.disconnected; },
        emit: (target, isIntersecting) => {
          this.callback([{
            target,
            isIntersecting,
          } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
        },
      });
    }

    observe(target: Element): void { this.targets.add(target); }
    unobserve(target: Element): void { this.targets.delete(target); }
    disconnect(): void { this.disconnected = true; this.targets.clear(); }
  }

  vi.stubGlobal('IntersectionObserver', TestIntersectionObserver);
  return records;
}

describe('Phase 2E private acknowledged EnhancedSelect integration', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.unstubAllGlobals();
  });

  it('keeps legacy notifications unchanged when acknowledged mode is not enabled', async () => {
    const select = createSelect();
    const order: string[] = [];
    const searchEvents: any[] = [];
    const loadEvents: any[] = [];
    select.updateConfig({ callbacks: {
      onSearch: () => order.push('callback-search'),
      onLoadMore: () => order.push('callback-load'),
    } });
    select.addEventListener('search', (event) => {
      order.push('event-search');
      searchEvents.push((event as CustomEvent).detail);
    });
    select.addEventListener('loadMore', (event) => {
      order.push('event-load');
      loadEvents.push((event as CustomEvent).detail);
    });
    document.body.appendChild(select);

    setInputQuery(select, 'Apple');
    (select as any)._loadMoreItems();
    await vi.waitFor(() => expect(searchEvents).toHaveLength(1));

    expect(searchEvents[0]).toMatchObject({ query: 'Apple', count: 1 });
    expect(searchEvents[0]).not.toHaveProperty('request');
    expect(loadEvents[0]).toEqual({ page: 2, items: [] });
    expect(loadEvents[0]).not.toHaveProperty('request');
    expect(order.indexOf('event-load')).toBeLessThan(order.indexOf('callback-load'));
    expect(order.indexOf('event-search')).toBeLessThan(order.indexOf('callback-search'));
  });

  it('holds the initial remote request until listener readiness and shares its identity across channels', async () => {
    const select = createSelect([]);
    const order: string[] = [];
    const events: any[] = [];
    const callback = vi.fn((query: string) => { order.push(`callback:${query}`); });
    select.updateConfig({ callbacks: { onSearch: callback } });
    select.addEventListener('search', (event) => {
      const detail = (event as CustomEvent).detail;
      events.push(detail);
      order.push(`event:${detail.query}`);
    });
    document.body.appendChild(select);
    enableAcknowledged(select);

    expect(events).toHaveLength(0);
    expect(select.getAttribute('aria-busy')).not.toBe('true');

    await markReady(select);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ query: '', results: [], count: 0 });
    expect(callback).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['event:', 'callback:']);
    expect((callback as any).mock.calls[0][0]).toBe('');
    expect((callback as any).mock.calls[0][1].requestId).toBe(events[0].request.requestId);
    expect(Object.isFrozen(events[0].request)).toBe(true);
    expect(events[0].request.position).toEqual({ mode: 'page', page: 1 });
  });

  it('cancels before announcing a superseding query and rejects the older response without mutation', async () => {
    const select = createSelect([]);
    const order: string[] = [];
    const searches: any[] = [];
    const cancellations: any[] = [];
    select.addEventListener('search', (event) => {
      searches.push((event as CustomEvent).detail);
      order.push('search');
    });
    select.addEventListener('dataRequestCancel', (event) => {
      cancellations.push((event as CustomEvent).detail);
      order.push('cancel');
    });
    document.body.appendChild(select);
    enableAcknowledged(select);
    await markReady(select);
    const firstRequest = latestRequest(searches);

    setInputQuery(select, 'Banana');
    const secondRequest = latestRequest(searches);

    expect(order.slice(-2)).toEqual(['cancel', 'search']);
    expect(cancellations[0]).toMatchObject({ requestId: firstRequest.requestId, reason: 'query-changed' });
    expect(secondRequest.requestId).not.toBe(firstRequest.requestId);
    const beforeItems = select.loadedItems;
    const beforeRegistry = (select as any)._itemRegistry;
    const beforeRenderCycle = (select as any)._renderCycleId;
    expect(await complete(select, firstRequest, {
      status: 'succeeded', items: [{ id: 'stale', value: 'stale', label: 'Stale' }], hasMore: true,
    })).toBe('stale');
    expect(select.loadedItems).toBe(beforeItems);
    expect((select as any)._itemRegistry).toBe(beforeRegistry);
    expect((select as any)._renderCycleId).toBe(beforeRenderCycle);
    expect((select as any)._state.isBusy).toBe(true);
    expect((select as any)._dataRequestCoordinator.getSnapshot().activeRequest.requestId).toBe(secondRequest.requestId);

    expect(await complete(select, secondRequest, {
      status: 'succeeded',
      items: [{ id: 'banana', value: 'banana', label: 'Banana' }],
      hasMore: true,
    })).toBe('accepted');
    expect(select.shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')!.value).toBe('Banana');
  });

  it('does not mutate component data or busy state for invalid completion payloads', async () => {
    const select = createSelect([]);
    const searches: any[] = [];
    select.addEventListener('search', (event) => searches.push((event as CustomEvent).detail));
    document.body.appendChild(select);
    enableAcknowledged(select);
    await markReady(select);
    const request = latestRequest(searches);
    const priorItems = select.loadedItems;
    const priorRegistry = (select as any)._itemRegistry;
    const priorRenderCycle = (select as any)._renderCycleId;

    expect(await complete(select, request, { status: 'succeeded', items: 'not-an-array', hasMore: true })).toBe('invalid');
    expect(select.loadedItems).toBe(priorItems);
    expect((select as any)._itemRegistry).toBe(priorRegistry);
    expect((select as any)._renderCycleId).toBe(priorRenderCycle);
    expect((select as any)._state.isBusy).toBe(true);
    expect((select as any)._dataRequestCoordinator.getSnapshot().activeRequest.requestId).toBe(request.requestId);
  });

  it('keeps setItems immediate without settling a remote request or filtering remote results locally', async () => {
    const select = createSelect([]);
    const searches: any[] = [];
    select.addEventListener('search', (event) => searches.push((event as CustomEvent).detail));
    document.body.appendChild(select);
    enableAcknowledged(select);
    await markReady(select);
    const request = latestRequest(searches);
    const interimItems = [{ id: 'b', value: 'b', label: 'Banana' }];

    select.setItems(interimItems);
    expect(select.loadedItems).toEqual(interimItems);
    expect((select as any)._state.isBusy).toBe(true);
    expect((select as any)._dataRequestCoordinator.getSnapshot().activeRequest.requestId).toBe(request.requestId);

    expect(await complete(select, request, {
      status: 'succeeded', items: [{ id: 'z', value: 'z', label: 'Zucchini' }], hasMore: true,
    })).toBe('accepted');
    expect(select.loadedItems).toEqual([{ id: 'z', value: 'z', label: 'Zucchini' }]);
    expect(select.shadowRoot!.querySelector('[data-value="z"]')).toBeTruthy();
    expect((select as any)._state.isBusy).toBe(false);
  });

  it('keeps acknowledged projection locked until chunked option rendering finishes', async () => {
    const select = createSelect([]);
    const searches: any[] = [];
    const loads: any[] = [];
    select.addEventListener('search', (event) => searches.push((event as CustomEvent).detail));
    select.addEventListener('loadMore', (event) => loads.push((event as CustomEvent).detail));
    document.body.appendChild(select);
    enableAcknowledged(select);
    await markReady(select);
    const request = latestRequest(searches);
    const largeResult = Array.from({ length: 401 }, (_, index) => ({
      id: `item-${index}`,
      value: `item-${index}`,
      label: `Item ${index}`,
    }));

    const projection = complete(select, request, {
      status: 'succeeded', items: largeResult, hasMore: true,
    });

    expect((select as any)._acknowledgedProjectionPending).toBe(true);
    expect(select.shadowRoot!.querySelector('[role="listbox"]')?.getAttribute('aria-busy')).toBe('true');
    expect(select.shadowRoot!.querySelector('[data-value="item-400"]')).toBeNull();
    setInputQuery(select, 'intermediate query');
    setInputQuery(select, 'latest query');
    await (select as any)._loadMoreItems('manual');
    expect((select as any)._state.searchQuery).toBe('');
    expect(select.shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')!.value).toBe('latest query');
    expect((select as any)._dataRequestCoordinator.getSnapshot().queryGeneration).toBe(request.queryGeneration);
    expect(searches).toHaveLength(1);
    expect(loads).toHaveLength(0);

    expect(await projection).toBe('accepted');
    expect(select.loadedItems).toHaveLength(401);
    expect((select as any)._acknowledgedProjectionPending).toBe(false);
    expect(searches).toHaveLength(2);
    expect(latestRequest(searches).query).toBe('latest query');
    expect(latestRequest(searches).queryGeneration).toBe(request.queryGeneration + 1);
    expect((select as any)._dataRequestCoordinator.getSnapshot().query).toBe('latest query');
    expect(select.shadowRoot!.querySelector('[role="listbox"]')?.getAttribute('aria-busy')).toBe('true');
  });

  it('coalesces query intent through projection failure and dispatches it after canonical recovery', async () => {
    const select = createSelect([]);
    const searches: any[] = [];
    select.addEventListener('search', (event) => searches.push((event as CustomEvent).detail));
    document.body.appendChild(select);
    enableAcknowledged(select);
    await markReady(select);
    const request = latestRequest(searches);
    (select as any)._failNextAcknowledgedProjectionForTest('before-publish');

    expect(await complete(select, request, {
      status: 'succeeded', items: [{ id: 'a', value: 'a', label: 'Apple' }], hasMore: true,
    })).toBe('accepted');
    expect((select as any)._acknowledgedProjectionPending).toBe(true);

    setInputQuery(select, 'Banana');
    setInputQuery(select, 'Cherry');
    expect(select.shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')!.value).toBe('Cherry');
    expect((select as any)._state.searchQuery).toBe('');
    expect((select as any)._dataRequestCoordinator.getSnapshot().query).toBe('');
    expect((select as any)._dataRequestCoordinator.getSnapshot().queryGeneration).toBe(request.queryGeneration);
    expect(searches).toHaveLength(1);

    await (select as any)._retryAcknowledgedProjectionForTest();

    expect(select.loadedItems).toEqual([{ id: 'a', value: 'a', label: 'Apple' }]);
    expect((select as any)._acknowledgedProjectionPending).toBe(false);
    expect(searches).toHaveLength(2);
    expect(latestRequest(searches).query).toBe('Cherry');
    expect(latestRequest(searches).queryGeneration).toBe(request.queryGeneration + 1);
    expect((select as any)._dataRequestCoordinator.getSnapshot().query).toBe('Cherry');
  });

  it('reprojects the accepted snapshot before reopening readiness after disconnect interrupts chunk rendering', async () => {
    const select = createSelect([]);
    const searches: any[] = [];
    select.addEventListener('search', (event) => searches.push((event as CustomEvent).detail));
    document.body.appendChild(select);
    enableAcknowledged(select);
    await markReady(select);
    const request = latestRequest(searches);
    const largeResult = Array.from({ length: 401 }, (_, index) => ({
      id: `reconnect-${index}`,
      value: `reconnect-${index}`,
      label: `Reconnect ${index}`,
    }));

    const interruptedProjection = complete(select, request, {
      status: 'succeeded', items: largeResult, hasMore: true,
    });
    expect((select as any)._acknowledgedProjectionPending).toBe(true);
    setInputQuery(select, 'Banana');
    setInputQuery(select, 'Cherry');
    expect(select.shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')!.value).toBe('Cherry');
    expect((select as any)._dataRequestCoordinator.getSnapshot().queryGeneration).toBe(request.queryGeneration);
    select.remove();
    expect(await interruptedProjection).toBe('accepted');
    expect((select as any)._acknowledgedProjectionPending).toBe(true);

    document.body.appendChild(select);
    expect(select.shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')!.value).toBe('Cherry');
    await markReady(select);

    expect((select as any)._acknowledgedProjectionPending).toBe(false);
    expect((select as any)._state.searchQuery).toBe('Cherry');
    expect((select as any)._dataRequestCoordinator.getSnapshot().query).toBe('Cherry');
    expect(latestRequest(searches).query).toBe('Cherry');
    expect(searches).toHaveLength(2);
  });

  it('preserves selected identity when an accepted page omits the selected record', async () => {
    const select = createSelect();
    document.body.appendChild(select);
    select.open();
    select.shadowRoot!.querySelector<HTMLElement>('[data-index="0"]')!.click();
    const searchEvents: any[] = [];
    select.addEventListener('search', (event) => searchEvents.push((event as CustomEvent).detail));
    enableAcknowledged(select);
    await markReady(select);
    const request = latestRequest(searchEvents);

    expect(await complete(select, request, {
      status: 'succeeded', items: [{ id: 'z', value: 'z', label: 'Zucchini' }], hasMore: true,
    })).toBe('accepted');

    expect([...(select as any)._engine.state.selectedKeys]).toEqual(['a']);
    expect(select.getSelectedItems()).toEqual([items[0]]);
    expect(select.loadedItems).toEqual([{ id: 'z', value: 'z', label: 'Zucchini' }]);
  });

  it.each([
    ['larger', items.slice(), 'succeeded', true],
    ['equal', items.slice(0, 2), 'succeeded', true],
    ['smaller', items.slice(0, 1), 'succeeded', true],
    ['empty exhausted', [], 'exhausted', false],
  ] as const)('settles %s snapshots and restores load-more scroll position', async (_label, nextItems, status, hasMore) => {
    const select = createSelect(items.slice(0, 2));
    const loads: any[] = [];
    const callback = vi.fn();
    select.updateConfig({ callbacks: { onLoadMore: callback } });
    select.addEventListener('loadMore', (event) => loads.push((event as CustomEvent).detail));
    document.body.appendChild(select);
    enableAcknowledged(select, {
      dataLoading: { protocol: 'acknowledged', searchMode: 'local', fetchLimit: 2 },
      infiniteScroll: { pageSize: 2, initialPage: 1 },
    }, { hasMore: true });
    await markReady(select);
    const options = (select as any)._optionsContainer as HTMLElement;
    options.scrollTop = 37;
    await (select as any)._loadMoreItems('manual');
    const request = latestRequest(loads);
    const completion = status === 'exhausted'
      ? { status, items: nextItems, hasMore }
      : { status, items: nextItems, hasMore };

    expect(await complete(select, request, completion)).toBe('accepted');
    expect(loads[0].page).toBe(2);
    expect((callback as any).mock.calls[0][0]).toBe(2);
    expect((callback as any).mock.calls[0][1].requestId).toBe(request.requestId);
    expect(select.loadedItems).toEqual(nextItems);
    expect(options.scrollTop).toBe(37);
    expect((select as any)._state.isBusy).toBe(false);
    expect((select as any)._state.currentPage).toBe(2);
    if (status === 'exhausted') {
      expect(select.shadowRoot!.querySelector('.load-more-button')).toBeNull();
    }
  });

  it('recovers projection from the accepted coordinator snapshot after injected failures', async () => {
    const select = createSelect([]);
    const searches: any[] = [];
    const diagnostics: any[] = [];
    select.addEventListener('search', (event) => searches.push((event as CustomEvent).detail));
    select.addEventListener('diagnostic', (event) => diagnostics.push((event as CustomEvent).detail));
    document.body.appendChild(select);
    enableAcknowledged(select);
    await markReady(select);
    const request = latestRequest(searches);
    (select as any)._failNextAcknowledgedProjectionForTest('before-publish');

    expect(await complete(select, request, {
      status: 'succeeded', items: [{ id: 'a', value: 'a', label: 'Apple' }], hasMore: true,
    })).toBe('accepted');
    expect(select.loadedItems).toEqual([]);
    expect((select as any)._state.isBusy).toBe(true);
    expect((select as any)._acknowledgedProjectionPending).toBe(true);
    expect(diagnostics[diagnostics.length - 1].detail).toMatchObject({ requestId: request.requestId, queryGeneration: request.queryGeneration });

    await (select as any)._retryAcknowledgedProjectionForTest();

    expect(select.loadedItems).toEqual([{ id: 'a', value: 'a', label: 'Apple' }]);
    expect((select as any)._state.isBusy).toBe(false);
    expect((select as any)._acknowledgedProjectionPending).toBe(false);
    expect((select as any)._dataRequestCoordinator.getSnapshot().items).toEqual(select.loadedItems);
  });

  it('keeps a post-publication projection failure locked until canonical retry succeeds', async () => {
    const select = createSelect([]);
    const searches: any[] = [];
    select.addEventListener('search', (event) => searches.push((event as CustomEvent).detail));
    document.body.appendChild(select);
    enableAcknowledged(select);
    await markReady(select);
    const request = latestRequest(searches);
    (select as any)._failNextAcknowledgedProjectionForTest('after-publish');
    const acceptedItems = [{ id: 'a', value: 'a', label: 'Apple' }];

    expect(await complete(select, request, { status: 'succeeded', items: acceptedItems, hasMore: true })).toBe('accepted');
    expect(select.loadedItems).toEqual(acceptedItems);
    expect((select as any)._acknowledgedProjectionPending).toBe(true);
    expect((select as any)._state.isBusy).toBe(true);
    await (select as any)._loadMoreItems('manual');
    expect((select as any)._dataRequestCoordinator.getSnapshot().activeRequest).toBeNull();

    await (select as any)._retryAcknowledgedProjectionForTest();
    expect((select as any)._acknowledgedProjectionPending).toBe(false);
    expect((select as any)._state.isBusy).toBe(false);
  });

  it('uses observer exit/re-entry transitions, filters stale targets, and replaces observers on reconnect', async () => {
    const observerRecords = stubIntersectionObserver();
    const select = createSelect(items.slice(0, 2));
    select.updateConfig({ infiniteScroll: { enabled: true, pageSize: 2 } });
    const loads: any[] = [];
    select.addEventListener('loadMore', (event) => loads.push((event as CustomEvent).detail));
    enableAcknowledged(select, {
      dataLoading: { protocol: 'acknowledged', searchMode: 'local', fetchLimit: 2 },
      infiniteScroll: { pageSize: 2, initialPage: 1 },
    }, { hasMore: true });
    document.body.appendChild(select);
    await markReady(select);

    const firstObserver = observerRecords[observerRecords.length - 1];
    const sentinel = (select as any)._loadMoreTrigger as HTMLElement;
    expect(firstObserver.root).toBe((select as any)._optionsContainer);
    expect(firstObserver.targets.has(sentinel)).toBe(true);
    firstObserver.emit(document.createElement('div'), true);
    expect(loads).toHaveLength(0);
    firstObserver.emit(sentinel, true);
    firstObserver.emit(sentinel, true);
    expect(loads).toHaveLength(1);

    const request = latestRequest(loads);
    expect(await complete(select, request, { status: 'empty', hasMore: true, advance: 'retry' })).toBe('accepted');
    const currentSentinel = (select as any)._loadMoreTrigger as HTMLElement;
    expect(currentSentinel).toBe(sentinel);
    firstObserver.emit(currentSentinel, true);
    expect(loads).toHaveLength(1);
    firstObserver.emit(currentSentinel, false);
    firstObserver.emit(currentSentinel, true);
    expect(loads).toHaveLength(2);

    const disconnectedRequest = latestRequest(loads);
    const itemsBeforeDisconnect = select.loadedItems;
    const staleTarget = (select as any)._loadMoreTrigger as HTMLElement;
    select.remove();
    expect(firstObserver.disconnected).toBe(true);
    firstObserver.emit(staleTarget, true);
    expect(loads).toHaveLength(2);
    expect(await complete(select, disconnectedRequest, {
      status: 'succeeded', items: [{ id: 'late', value: 'late', label: 'Late' }], hasMore: true,
    })).toBe('stale');
    expect(select.loadedItems).toBe(itemsBeforeDisconnect);

    document.body.appendChild(select);
    await markReady(select);
    const secondObserver = observerRecords[observerRecords.length - 1];
    expect(secondObserver).not.toBe(firstObserver);
    expect(secondObserver.root).toBe((select as any)._optionsContainer);
  });

  it('retains manual load-more when IntersectionObserver is unavailable', async () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const select = createSelect(items.slice(0, 2));
    select.updateConfig({ infiniteScroll: { enabled: true, pageSize: 2 } });
    const loads: any[] = [];
    select.addEventListener('loadMore', (event) => loads.push((event as CustomEvent).detail));
    enableAcknowledged(select, {
      dataLoading: { protocol: 'acknowledged', searchMode: 'local', fetchLimit: 2 },
      infiniteScroll: { pageSize: 2, initialPage: 1 },
    }, { hasMore: true });
    document.body.appendChild(select);
    await markReady(select);

    const button = select.shadowRoot!.querySelector<HTMLButtonElement>('.load-more-button');
    expect(button).toBeTruthy();
    button!.click();
    expect(loads).toHaveLength(1);
    expect(latestRequest(loads).position).toEqual({ mode: 'page', page: 2 });
  });
});
