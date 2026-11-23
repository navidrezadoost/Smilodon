import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select';

if (!customElements.get('enhanced-select')) customElements.define('enhanced-select', EnhancedSelect);

type Item = { id: string; value: string; label: string };

const makeItems = (count: number, offset = 0): Item[] => Array.from({ length: count }, (_, index) => ({
  id: `item-${index + offset}`,
  value: `item-${index + offset}`,
  label: `Option ${index + offset}`,
}));

function renderedValues(select: EnhancedSelect): string[] {
  return Array.from(select.shadowRoot!.querySelectorAll<HTMLElement>('[part="option"]'))
    .map((option) => option.getAttribute('data-value') ?? '');
}

function latestRequest(details: any[]): any {
  const request = details.at(-1)?.request;
  expect(request, JSON.stringify(details)).toBeTruthy();
  return request;
}

describe('selected-first virtualization and data-loading qualification (E3.2)', () => {
  let select: EnhancedSelect;

  beforeEach(() => {
    select = document.createElement('enhanced-select') as EnhancedSelect;
    select.updateConfig({
      searchable: true,
      estimatedItemHeight: 20,
      selection: { mode: 'multi', closeOnSelect: false },
      loadMore: { enabled: true, itemsPerLoad: 4 },
      infiniteScroll: { enabled: false, pageSize: 4 },
    });
    select.updateConfig({ selectedOptions: { placement: 'selected-first' } });
    document.body.appendChild(select);
  });

  afterEach(() => {
    select.remove();
    document.body.replaceChildren();
  });

  it.each([
    [1_000, 0],
    [1_000, 500],
    [1_000, 999],
    [10_000, 0],
    [10_000, 5_000],
    [10_000, 9_999],
  ])('keeps source identity and bounded geometry for %i options with selection at %i', async (count, selectedIndex) => {
    const items = makeItems(count);
    select.setItems(items);
    await select.setSelectedValues([`item-${selectedIndex}`]);
    select.open();

    const scroller = (select as any)._optionsContainer as HTMLElement;
    Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: 60 });
    (select as any)._updateGuardedVirtualWindow(0, 60);
    (select as any)._renderOptions();

    const plan = (select as any)._renderPlan;
    expect(plan.filteredKeys).toHaveLength(count);
    expect(plan.filteredKeys[0]).toBe(`item-${selectedIndex}`);
    expect(plan.sourceIndexByKey.get(`item-${selectedIndex}`)).toBe(selectedIndex);
    expect(plan.displayIndexByKey.get(`item-${selectedIndex}`)).toBe(0);
    expect(scroller.querySelectorAll('[part="option"]').length).toBeLessThanOrEqual(8);

    const farVisualKey = plan.filteredKeys[count - 1];
    expect((select as any)._materializeGuardedVirtualKey(farVisualKey)).toBe(true);
    const mounted = scroller.querySelector<HTMLElement>(`[data-value="${farVisualKey}"]`);
    expect(mounted).toBeTruthy();
    expect(Number(mounted!.getAttribute('data-sm-index') ?? mounted!.getAttribute('data-index')))
      .toBe(plan.sourceIndexByKey.get(farVisualKey));
    expect((select as any)._virtualizationScope.mountedKeys).toContain(farVisualKey);

    const window = (select as any)._guardedVirtualWindow as { startIndex: number; endIndex: number };
    const virtualizer = (select as any)._guardedVirtualizer;
    const top = Number(scroller.querySelector<HTMLElement>('[data-virtual-spacer="top"]')!.style.height.replace('px', ''));
    const bottom = Number(scroller.querySelector<HTMLElement>('[data-virtual-spacer="bottom"]')!.style.height.replace('px', ''));
    expect(top).toBe(virtualizer.cumulativeOffset(window.startIndex));
    expect(bottom).toBe(virtualizer.cumulativeOffset(count) - virtualizer.cumulativeOffset(window.endIndex));
    expect(window.startIndex).toBeLessThanOrEqual(count - 1);
    expect(window.endIndex).toBeGreaterThan(window.startIndex);

    (select as any)._setActive(plan.sourceIndexByKey.get(farVisualKey));
    const activeOption = scroller.querySelector<HTMLElement>(`[data-value="${farVisualKey}"]`);
    expect((select as any)._engine.state.activeKey).toBe(farVisualKey);
    expect(activeOption).toBeTruthy();
    expect(select.shadowRoot!.querySelector('[part="input"]')?.getAttribute('aria-activedescendant'))
      .toBe(activeOption!.id);
  }, 60_000);

  it('progressively mounts a large selected-first list in projected order without omissions or duplicates', async () => {
    const items = makeItems(1_000);
    select.setItems(items);
    await select.setSelectedValues(['item-900', 'item-10']);
    select.open();

    await vi.waitFor(() => {
      expect(select.shadowRoot!.querySelectorAll('[part="option"]')).toHaveLength(items.length);
    }, { timeout: 10_000 });

    const expected = (select as any)._renderPlan.filteredKeys as string[];
    expect(renderedValues(select)).toEqual(expected);
    expect(new Set(renderedValues(select)).size).toBe(items.length);
    expect(expected.slice(0, 2)).toEqual(['item-10', 'item-900']);
    expect((select as any)._virtualizationScope.mountedKeys).toEqual(expected);
  });

  it('keeps selected identity when filtering excludes it and does not materialize an ineligible target', async () => {
    select.setItems(makeItems(120));
    await select.setSelectedValues(['item-99']);
    select.open();
    (select as any)._state.searchQuery = 'Option 1';
    (select as any)._renderOptions();
    const selectedBefore = [...(select as any)._engine.state.selectedKeys];
    const materialize = vi.spyOn(select as any, '_materializeGuardedVirtualKey');

    expect((select as any)._renderPlan.filteredKeys).not.toContain('item-99');
    (select as any)._scrollToSelected();

    expect([...(select as any)._engine.state.selectedKeys]).toEqual(selectedBefore);
    expect(materialize).not.toHaveBeenCalled();
  });

  it('keeps the keyboard-active key independent from the selected scroll target', async () => {
    select.updateConfig({ scrollToSelected: { enabled: true, multiSelectTarget: 'last', behavior: 'auto' } });
    select.setItems(makeItems(8));
    await select.setSelectedValues(['item-2', 'item-6']);
    select.open();
    (select as any)._cancelOpenSelectedScroll();
    (select as any)._setActive(1);
    const activeBefore = (select as any)._engine.state.activeKey;
    const scroll = vi.spyOn(select as any, '_scrollOptionWithinOptionsContainer').mockImplementation(() => {});

    (select as any)._scrollToSelected({ setActive: false });

    expect(scroll).toHaveBeenCalledOnce();
    expect(scroll.mock.calls[0][0].getAttribute('data-value')).toBe('item-6');
    expect((select as any)._engine.state.activeKey).toBe(activeBefore);
    expect(activeBefore).toBe('item-1');
  });

  it('freezes display order while selection and equivalent fresh item objects change, then recomputes on reopen', async () => {
    select.setItems(makeItems(8));
    await select.setSelectedValues(['item-6']);
    select.open();
    const openingOrder = [...(select as any)._renderPlan.filteredKeys];

    await select.setSelectedValues(['item-2']);
    select.setItems(makeItems(8));
    expect((select as any)._renderPlan.filteredKeys).toEqual(openingOrder);
    expect((select as any)._engine.state.selectedKeys.has('item-2')).toBe(true);

    select.close();
    select.open();
    expect((select as any)._renderPlan.filteredKeys[0]).toBe('item-2');
    expect((select as any)._renderPlan.sourceIndexByKey.get('item-2')).toBe(2);
  });

  it('appends an acknowledged page without resetting order or issuing a duplicate request', async () => {
    const firstPage = makeItems(4);
    select.setItems(firstPage);
    await select.setSelectedValues(['item-3']);
    const loads: any[] = [];
    const searches: any[] = [];
    select.addEventListener('loadMore', (event) => loads.push((event as CustomEvent).detail));
    select.addEventListener('search', (event) => searches.push((event as CustomEvent).detail));
    (select as any)._enableAcknowledgedDataLoadingForTest({
      dataLoading: { protocol: 'acknowledged', searchMode: 'remote', paginationMode: 'page', fetchLimit: 4 },
      infiniteScroll: { pageSize: 4, initialPage: 1 },
    }, { hasMore: true });
    await (select as any)._setAcknowledgedDataLoadingReadyForTest();
    const initialRequest = latestRequest(searches);
    expect(initialRequest.position).toMatchObject({ mode: 'page', page: 1 });
    expect(await select.completeDataRequest({
      requestId: initialRequest.requestId,
      queryGeneration: initialRequest.queryGeneration,
      status: 'succeeded',
      items: firstPage,
      hasMore: true,
    })).toBe('accepted');
    await vi.waitFor(() => expect((select as any)._acknowledgedProjectionPending).toBe(false));

    select.open();
    const openingOrder = [...(select as any)._renderPlan.filteredKeys];

    await (select as any)._loadMoreItems('manual');
    const request = latestRequest(loads);
    expect(request.position).toMatchObject({ mode: 'page', page: 2 });
    const pageResult = await select.completeDataRequest({
      requestId: request.requestId,
      queryGeneration: request.queryGeneration,
      status: 'exhausted',
      items: [...firstPage, ...makeItems(4, 4)],
      hasMore: false,
    });
    expect(pageResult, JSON.stringify({ request, snapshot: (select as any)._dataRequestCoordinator.getSnapshot() })).toBe('accepted');
    await vi.waitFor(() => expect((select as any)._acknowledgedProjectionPending).toBe(false));

    expect(select.loadedItems).toHaveLength(8);
    expect((select as any)._renderPlan.filteredKeys).toEqual([
      'item-3', 'item-0', 'item-1', 'item-2', 'item-4', 'item-5', 'item-6', 'item-7',
    ]);
    expect(new Set((select as any)._renderPlan.filteredKeys).size).toBe(8);
    expect((select as any)._engine.state.selectedKeys.has('item-3')).toBe(true);
    expect((select as any)._renderPlan.filteredKeys.slice(0, openingOrder.length)).toEqual(openingOrder);
    expect(loads).toHaveLength(1);
  });
});
