import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { SelectKey } from '../src/engine/contracts';
import { EnhancedSelect } from '../src/components/enhanced-select';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

type TestItem = { id: string; value: string; label: string };

const makeItems = (): TestItem[] => [
  { id: 'a', value: 'APL', label: 'Apple' },
  { id: 'b', value: 'BAN', label: 'Banana' },
  { id: 'c', value: 'CHR', label: 'Cherry' },
];

function engineSelectedKeys(select: EnhancedSelect): SelectKey[] {
  return [...((select as any)._engine.state.selectedKeys as ReadonlySet<SelectKey>)];
}

function engineActiveKey(select: EnhancedSelect): SelectKey | null {
  return (select as any)._engine.state.activeKey;
}

function getInput(select: EnhancedSelect): HTMLInputElement {
  const input = select.shadowRoot?.querySelector<HTMLInputElement>('[part="input"]');
  expect(input).toBeTruthy();
  return input!;
}

function filterTo(select: EnhancedSelect, query: string): void {
  const input = getInput(select);
  input.value = query;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}

function clickOption(select: EnhancedSelect, index: number): void {
  const option = select.shadowRoot?.querySelector<HTMLElement>(`[data-index="${index}"]`);
  expect(option, `expected rendered option at index ${index}`).toBeTruthy();
  option!.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

function setGuardedWindow(select: EnhancedSelect, startIndex: number, endIndex: number): void {
  const itemHeight = 20;
  (select as any)._updateGuardedVirtualWindow(
    startIndex * itemHeight,
    Math.max(0, endIndex - startIndex - 1) * itemHeight,
  );
}

describe('EnhancedSelect pre-virtualization integration guards', () => {
  let select: EnhancedSelect;

  beforeEach(() => {
    select = document.createElement('enhanced-select') as EnhancedSelect;
    document.body.appendChild(select);
  });

  afterEach(() => {
    select.remove();
  });

  it('keeps selected keys attached to the same item keys after filtering and rerendering', () => {
    select.updateConfig({ searchable: true, selection: { mode: 'multi', closeOnSelect: false } });
    select.setItems(makeItems());
    clickOption(select, 0);
    clickOption(select, 2);

    filterTo(select, 'Cherry');
    expect(engineSelectedKeys(select)).toEqual(['a', 'c']);
    expect(select.shadowRoot!.querySelector('[data-value="CHR"]')?.getAttribute('aria-selected')).toBe('true');

    filterTo(select, '');
    expect(engineSelectedKeys(select)).toEqual(['a', 'c']);
    expect(select.shadowRoot!.querySelector('[data-value="APL"]')?.getAttribute('aria-selected')).toBe('true');
    expect(select.shadowRoot!.querySelector('[data-value="CHR"]')?.getAttribute('aria-selected')).toBe('true');
    expect(select.shadowRoot!.querySelector('[data-value="BAN"]')?.getAttribute('aria-selected')).toBe('false');
  });

  it('does not erase selectedKeys when filtering hides the selected item', () => {
    select.updateConfig({ searchable: true });
    select.setItems(makeItems());
    clickOption(select, 0);

    filterTo(select, 'Banana');

    expect(engineSelectedKeys(select)).toEqual(['a']);
    expect(select.shadowRoot!.querySelector('[data-value="APL"]')).toBeNull();
    expect(select.shadowRoot!.querySelector('[data-value="BAN"]')?.getAttribute('aria-selected')).toBe('false');
  });

  it('clears active identity when filtering removes its key from the candidate set', () => {
    select.updateConfig({ searchable: true });
    select.setItems(makeItems());
    select.open();
    getInput(select).dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowDown', bubbles: true, cancelable: true,
    }));
    expect(engineActiveKey(select)).toBe('b');

    filterTo(select, 'Apple');

    expect(engineActiveKey(select)).toBeNull();
    expect(getInput(select).hasAttribute('aria-activedescendant')).toBe(false);
  });

  it('keeps filter invalidation policy when a guarded window is active', () => {
    select.updateConfig({ searchable: true });
    select.setItems(makeItems());
    select.open();
    getInput(select).dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowDown', bubbles: true, cancelable: true,
    }));
    const activeKey = engineActiveKey(select);
    setGuardedWindow(select, 0, 1);
    (select as any)._renderOptions();
    expect(engineActiveKey(select)).toBe(activeKey);

    filterTo(select, 'Apple');

    expect(engineActiveKey(select)).toBeNull();
    expect((select as any)._virtualizationScope.filteredKeys).toEqual(['a']);
    expect(getInput(select).hasAttribute('aria-activedescendant')).toBe(false);
  });

  it('clearing a filter remaps keys to the current filtered indexes before materialization', () => {
    select.updateConfig({ searchable: true });
    select.setItems(makeItems());
    filterTo(select, 'Banana');
    setGuardedWindow(select, 0, 1);
    (select as any)._renderOptions();

    filterTo(select, '');

    const plan = (select as any)._renderPlan;
    expect(plan.filteredKeys).toEqual(['a', 'b', 'c']);
    expect(plan.filteredIndexByKey.get('a')).toBe(0);
    expect(plan.filteredIndexByKey.get('b')).toBe(1);
    expect(plan.filteredIndexByKey.get('c')).toBe(2);
    expect((select as any)._materializeGuardedVirtualKey('c')).toBe(true);
    expect((select as any)._virtualizationScope.mountedKeys).toEqual(['c']);
  });

  it('keeps selection attached to its key after reorder and guarded remount', () => {
    select.updateConfig({ selection: { mode: 'multi', closeOnSelect: false } });
    const [apple, banana, cherry] = makeItems();
    select.setItems([apple, banana, cherry]);
    clickOption(select, 0);
    setGuardedWindow(select, 0, 1);
    (select as any)._renderOptions();

    select.setItems([cherry, apple, banana]);

    expect(engineSelectedKeys(select)).toEqual(['a']);
    expect((select as any)._virtualizationScope.mountedKeys).toEqual(['c']);
    expect((select as any)._materializeGuardedVirtualKey('a')).toBe(true);
    expect(select.shadowRoot!.querySelector('[data-value="APL"]')?.getAttribute('aria-selected')).toBe('true');
    expect(engineSelectedKeys(select)).toEqual(['a']);
  });

  it('remaps active identity by key after reorder and materializes the current index', () => {
    const [apple, banana, cherry] = makeItems();
    select.setItems([apple, banana, cherry]);
    select.open();
    (select as any)._setActive(0);
    setGuardedWindow(select, 0, 1);
    (select as any)._renderOptions();

    select.setItems([cherry, apple, banana]);

    expect(engineActiveKey(select)).toBe('a');
    expect((select as any)._state.activeIndex).toBe(1);
    expect((select as any)._virtualizationScope.mountedKeys).toEqual(['c']);
    expect(getInput(select).hasAttribute('aria-activedescendant')).toBe(false);

    (select as any)._setActive(1);

    const activeOption = select.shadowRoot!.querySelector<HTMLElement>('[data-value="APL"]');
    expect(engineActiveKey(select)).toBe('a');
    expect(activeOption).toBeTruthy();
    expect(getInput(select).getAttribute('aria-activedescendant')).toBe(activeOption!.id);
  });

  it('moves the active guarded window repeatedly without losing active identity', () => {
    select.setItems(makeItems());
    select.open();
    setGuardedWindow(select, 0, 1);
    (select as any)._renderOptions();

    (select as any)._setActive(2);
    expect(engineActiveKey(select)).toBe('c');
    expect((select as any)._virtualizationScope.mountedKeys).toEqual(['c']);
    expect(getInput(select).getAttribute('aria-activedescendant')).toBe(
      select.shadowRoot!.querySelector<HTMLElement>('[data-value="CHR"]')?.id,
    );

    (select as any)._setActive(0);
    expect(engineActiveKey(select)).toBe('a');
    expect((select as any)._virtualizationScope.mountedKeys).toEqual(['a']);
    expect(getInput(select).getAttribute('aria-activedescendant')).toBe(
      select.shadowRoot!.querySelector<HTMLElement>('[data-value="APL"]')?.id,
    );
  });

  it('moves a repeated selected-key materialization without losing selection', () => {
    select.updateConfig({ selection: { mode: 'multi', closeOnSelect: false } });
    select.setItems(makeItems());
    clickOption(select, 0);
    clickOption(select, 2);
    setGuardedWindow(select, 1, 2);
    (select as any)._renderOptions();
    const selectedBefore = engineSelectedKeys(select);

    expect((select as any)._materializeGuardedVirtualKey('a')).toBe(true);
    expect((select as any)._virtualizationScope.mountedKeys).toEqual(['a']);
    expect((select as any)._materializeGuardedVirtualKey('c')).toBe(true);

    expect(engineSelectedKeys(select)).toEqual(selectedBefore);
    expect((select as any)._virtualizationScope.mountedKeys).toEqual(['c']);
    expect(select.shadowRoot!.querySelector('[data-value="CHR"]')?.getAttribute('aria-selected')).toBe('true');
  });

  it('discards superseded chunk renders without stale IDs or mounted keys', async () => {
    const items = Array.from({ length: 800 }, (_, index) => ({
      id: `item-${index}`,
      value: `value-${index}`,
      label: `Option ${index}`,
    }));
    select.setItems(items);
    setGuardedWindow(select, 0, 400);
    (select as any)._renderOptions();
    expect(select.shadowRoot!.querySelectorAll('[part="option"]').length).toBe(80);

    setGuardedWindow(select, 500, 800);
    (select as any)._renderOptions();
    await new Promise((resolve) => window.setTimeout(resolve, 50));

    const expectedKeys = items.slice(500).map((item) => item.id);
    const rendered = Array.from(select.shadowRoot!.querySelectorAll<HTMLElement>('[part="option"]'));
    expect(rendered).toHaveLength(300);
    expect(rendered[0].dataset.smIndex).toBe('500');
    expect(rendered.some((option) => option.id.endsWith('-option-0'))).toBe(false);
    expect((select as any)._virtualizationScope.mountedKeys).toEqual(expectedKeys);
  });

  it('refreshes custom renderer item and index context after guarded remount', () => {
    const calls: Array<{ id: string; index: number }> = [];
    select.optionRenderer = (item: unknown, index: number) => {
      calls.push({ id: (item as TestItem).id, index });
      return document.createElement('div');
    };
    select.setItems(makeItems());
    setGuardedWindow(select, 0, 1);
    (select as any)._renderOptions();
    const previousCallCount = calls.length;

    expect((select as any)._materializeGuardedVirtualKey('c')).toBe(true);

    expect(calls.slice(previousCallCount)).toEqual([{ id: 'c', index: 2 }]);
    expect(select.shadowRoot!.querySelector('[data-value="CHR"]')?.getAttribute('data-index')).toBe('2');
  });

  it('restores selected option ARIA after clearing and reapplying a filter', () => {
    select.updateConfig({ searchable: true, selection: { mode: 'multi', closeOnSelect: false } });
    select.setItems(makeItems());
    clickOption(select, 1);

    filterTo(select, 'Apple');
    expect(select.shadowRoot!.querySelector('[data-value="BAN"]')).toBeNull();
    filterTo(select, '');
    expect(select.shadowRoot!.querySelector('[data-value="BAN"]')?.getAttribute('aria-selected')).toBe('true');

    filterTo(select, 'Banana');
    expect(select.shadowRoot!.querySelector('[data-value="BAN"]')?.getAttribute('aria-selected')).toBe('true');
  });

  it('passes refreshed item and index context to custom renderers after reorder', () => {
    const calls: Array<{ id: string; index: number }> = [];
    select.optionRenderer = (item: unknown, index: number) => {
      calls.push({ id: (item as TestItem).id, index });
      return document.createElement('div');
    };
    const [apple, banana, cherry] = makeItems();
    select.setItems([apple, banana, cherry]);
    const previousCallCount = calls.length;

    select.setItems([cherry, apple, banana]);

    expect(calls.slice(previousCallCount)).toEqual([
      { id: 'c', index: 0 },
      { id: 'a', index: 1 },
      { id: 'b', index: 2 },
    ]);
    expect(select.shadowRoot!.querySelector('[data-value="CHR"]')?.getAttribute('data-index')).toBe('0');
  });

  it('removes aria-activedescendant when the active target is absent', () => {
    select.setItems(makeItems());
    select.open();
    getInput(select).dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowDown', bubbles: true, cancelable: true,
    }));
    getInput(select).dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowDown', bubbles: true, cancelable: true,
    }));
    expect(getInput(select).hasAttribute('aria-activedescendant')).toBe(true);

    select.shadowRoot!.querySelector<HTMLElement>('[data-index="2"]')!.remove();
    (select as any)._syncLegacyActiveAria();

    expect(getInput(select).hasAttribute('aria-activedescendant')).toBe(false);
  });

  it('derives DataKeys from every loaded item', () => {
    select.setItems(makeItems());

    expect((select as any)._virtualizationScope.dataKeys).toEqual(['a', 'b', 'c']);
  });

  it('derives filtered and registered keys from the current logical search result', () => {
    select.updateConfig({ searchable: true });
    select.setItems(makeItems());
    filterTo(select, 'Banana');

    const scope = (select as any)._virtualizationScope;
    expect(scope.filteredKeys).toEqual(['b']);
    expect(scope.registeredKeys).toEqual(['b']);
  });

  it('keeps RegisteredKeys logical while chunked rendering has only mounted part of the target set', () => {
    const items = Array.from({ length: 360 }, (_, index) => ({
      id: `item-${index}`,
      value: `value-${index}`,
      label: `Option ${index}`,
    }));
    select.setItems(items);

    const scope = (select as any)._virtualizationScope;
    expect(scope.registeredKeys).toHaveLength(items.length);
    expect(scope.windowKeys).toHaveLength(items.length);
    expect(scope.mountedKeys.length).toBeGreaterThan(0);
    expect(scope.mountedKeys.length).toBeLessThan(items.length);
  });

  it('derives MountedKeys from actual option targets in the options container', () => {
    select.setItems(makeItems());
    const options = Array.from(select.shadowRoot!.querySelectorAll<HTMLElement>('[part="option"]'));
    const keys = (select as any)._virtualizationScope.mountedKeys;
    expect(keys).toEqual(['a', 'b', 'c']);

    options[1].remove();
    (select as any)._refreshVirtualizationScope([0, 1, 2]);

    expect((select as any)._virtualizationScope.mountedKeys).toEqual(['a', 'c']);
  });

  it('does not change selected, active, or ARIA state when deriving the scope', () => {
    select.setItems(makeItems());
    clickOption(select, 0);
    select.open();
    getInput(select).dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowDown', bubbles: true, cancelable: true,
    }));
    const selectedBefore = engineSelectedKeys(select);
    const activeBefore = engineActiveKey(select);
    const activeDescendantBefore = getInput(select).getAttribute('aria-activedescendant');

    (select as any)._deriveVirtualizationScope([0, 1, 2]);

    expect(engineSelectedKeys(select)).toEqual(selectedBefore);
    expect(engineActiveKey(select)).toBe(activeBefore);
    expect(getInput(select).getAttribute('aria-activedescendant')).toBe(activeDescendantBefore);
  });

  it('creates a legacy render plan containing every current filtered key', () => {
    select.updateConfig({ searchable: true });
    select.setItems(makeItems());
    filterTo(select, 'Banana');

    expect((select as any)._renderPlan.filteredKeys).toEqual(['b']);
  });

  it('sets intendedRenderKeys to all filtered keys in legacy mode', () => {
    select.updateConfig({ searchable: true });
    select.setItems(makeItems());
    filterTo(select, 'Apple');

    const plan = (select as any)._renderPlan;
    expect(plan.mode).toBe('legacy-full');
    expect(plan.intendedRenderKeys).toEqual(plan.filteredKeys);
    expect((select as any)._virtualizationScope.windowKeys).toEqual(plan.intendedRenderKeys);
  });

  it('maps stable keys to their current filtered positions after reorder', () => {
    const [apple, banana, cherry] = makeItems();
    select.setItems([apple, banana, cherry]);

    select.setItems([cherry, apple, banana]);

    const plan = (select as any)._renderPlan;
    expect(plan.filteredIndexByKey.get('c')).toBe(0);
    expect(plan.filteredIndexByKey.get('a')).toBe(1);
    expect(plan.filteredIndexByKey.get('b')).toBe(2);
  });

  it('does not mutate selected keys when creating a render plan', () => {
    select.setItems(makeItems());
    clickOption(select, 0);
    const selectedBefore = engineSelectedKeys(select);

    const plan = (select as any)._createLegacyRenderPlan([0, 1, 2]);

    expect(plan.intendedRenderKeys).toEqual(['a', 'b', 'c']);
    expect(engineSelectedKeys(select)).toEqual(selectedBefore);
  });

  it('computes a bounded virtual plan without activating it for rendering', () => {
    select.setItems(makeItems());
    const activePlanBefore = (select as any)._renderPlan;

    const virtualPlan = (select as any)._createVirtualRenderPlan(1, 3);

    expect(virtualPlan.mode).toBe('virtual-window');
    expect(virtualPlan.intendedRenderKeys).toEqual(['b', 'c']);
    expect(virtualPlan.filteredIndices).toEqual([1, 2]);
    expect((select as any)._renderPlan).toBe(activePlanBefore);
    expect((select as any)._renderPlan.mode).toBe('legacy-full');
    expect((select as any)._renderPlan.intendedRenderKeys).toEqual(['a', 'b', 'c']);
  });

  it('keeps legacy-full as the default active render mode', () => {
    select.updateConfig({ searchable: true });
    select.setItems(makeItems());
    filterTo(select, 'a');

    expect((select as any)._renderPlan.mode).toBe('legacy-full');
    expect((select as any)._renderPlan.filteredKeys).toEqual(['a', 'b']);
    expect(Array.from(select.shadowRoot!.querySelectorAll<HTMLElement>('[part="option"]'))
      .map((option) => option.dataset.value)).toEqual(['APL', 'BAN']);
  });

  it('renders only the guarded bounded subset while legacy-full remains the default', () => {
    select.setItems(makeItems());
    setGuardedWindow(select, 1, 2);

    (select as any)._renderOptions();

    expect((select as any)._renderPlan.mode).toBe('virtual-window');
    expect((select as any)._renderPlan.intendedRenderKeys).toEqual(['b']);
    expect(Array.from(select.shadowRoot!.querySelectorAll<HTMLElement>('[part="option"]'))
      .map((option) => option.dataset.value)).toEqual(['BAN']);
    expect((select as any)._guardedVirtualWindow).toEqual({ startIndex: 1, endIndex: 2 });
  });

  it('calculates guarded render bounds through Virtualizer.updateWindow', () => {
    select.setItems(makeItems());

    setGuardedWindow(select, 0, 2);

    expect((select as any)._guardedVirtualizer.getCurrentWindow()).toEqual({
      startIndex: 0,
      endIndex: 1,
      windowSize: 2,
    });
    expect((select as any)._guardedVirtualWindow).toEqual({ startIndex: 0, endIndex: 2 });
    (select as any)._renderOptions();
    expect((select as any)._renderPlan.intendedRenderKeys).toEqual(['a', 'b']);
  });

  it('applies scrollToIndex intent through updateWindow without changing selection or active identity', () => {
    select.updateConfig({ selection: { mode: 'multi', closeOnSelect: false } });
    select.setItems(makeItems());
    clickOption(select, 0);
    select.open();
    (select as any)._setActive(0);
    setGuardedWindow(select, 0, 1);
    const selectedBefore = engineSelectedKeys(select);
    const activeBefore = engineActiveKey(select);
    const virtualizer = (select as any)._guardedVirtualizer;

    const scrollIntent = virtualizer.scrollToIndex(2);
    expect(scrollIntent).toMatchObject({ index: 2, offset: 40, scrollTop: 40 });
    expect((select as any)._applyGuardedScrollResult(scrollIntent)).toBe(true);
    (select as any)._renderOptions();

    expect((select as any)._guardedVirtualizer.getCurrentWindow()).toMatchObject({ startIndex: 2, endIndex: 2 });
    expect((select as any)._virtualizationScope.mountedKeys).toEqual(['c']);
    expect(engineSelectedKeys(select)).toEqual(selectedBefore);
    expect(engineActiveKey(select)).toBe(activeBefore);
    expect(getInput(select).hasAttribute('aria-activedescendant')).toBe(false);
  });

  it('does not create or use a guarded controller in default legacy-full mode', () => {
    select.setItems(makeItems());

    expect((select as any)._guardedVirtualizer).toBeNull();
    expect((select as any)._renderPlan.mode).toBe('legacy-full');
    expect((select as any)._renderPlan.intendedRenderKeys).toEqual(['a', 'b', 'c']);
    expect(select.shadowRoot!.querySelectorAll('[part="option"]')).toHaveLength(3);
  });

  it('resolves a filtered key against the current order before scroll materialization', () => {
    select.updateConfig({ searchable: true });
    const [apple, banana, cherry] = makeItems();
    select.setItems([cherry, apple, banana]);
    filterTo(select, 'a');
    setGuardedWindow(select, 0, 1);
    (select as any)._renderOptions();

    expect((select as any)._renderPlan.filteredKeys).toEqual(['a', 'b']);
    expect((select as any)._renderPlan.filteredIndexByKey.get('a')).toBe(0);
    expect((select as any)._renderPlan.filteredIndexByKey.get('b')).toBe(1);
    expect((select as any)._materializeGuardedVirtualKey('b')).toBe(true);

    expect((select as any)._guardedVirtualizer.getCurrentWindow()).toMatchObject({ startIndex: 1, endIndex: 1 });
    expect((select as any)._virtualizationScope.mountedKeys).toEqual(['b']);
    expect(select.shadowRoot!.querySelector('[data-value="BAN"]')).toBeTruthy();
  });

  it('refreshes the controller after filter changes while preserving selection and active identity policy', () => {
    select.updateConfig({ searchable: true, selection: { mode: 'multi', closeOnSelect: false } });
    select.setItems(makeItems());
    clickOption(select, 2);
    select.open();
    (select as any)._setActive(2);
    const selectedBefore = engineSelectedKeys(select);
    setGuardedWindow(select, 2, 3);
    (select as any)._renderOptions();

    filterTo(select, 'Apple');

    expect((select as any)._guardedVirtualizer.getCurrentWindow()).toMatchObject({ startIndex: 0, endIndex: 0 });
    expect((select as any)._virtualizationScope.filteredKeys).toEqual(['a']);
    expect((select as any)._virtualizationScope.mountedKeys).toEqual(['a']);
    expect(engineSelectedKeys(select)).toEqual(selectedBefore);
    expect(engineActiveKey(select)).toBeNull();
    expect(getInput(select).hasAttribute('aria-activedescendant')).toBe(false);
  });

  it('keeps selected and active keys stable across repeated guarded window updates', () => {
    select.updateConfig({ selection: { mode: 'multi', closeOnSelect: false } });
    select.setItems(makeItems());
    clickOption(select, 0);
    select.open();
    (select as any)._setActive(2);
    const selectedBefore = engineSelectedKeys(select);
    const activeBefore = engineActiveKey(select);

    setGuardedWindow(select, 0, 1);
    (select as any)._renderOptions();
    setGuardedWindow(select, 1, 3);
    (select as any)._renderOptions();
    setGuardedWindow(select, 0, 2);
    (select as any)._renderOptions();

    expect(engineSelectedKeys(select)).toEqual(selectedBefore);
    expect(engineActiveKey(select)).toBe(activeBefore);
    expect((select as any)._virtualizationScope.mountedKeys).toEqual(['a', 'b']);
    expect(getInput(select).hasAttribute('aria-activedescendant')).toBe(false);
  });

  it('updates mounted keys and active descendant only after the controller window is rendered', () => {
    select.setItems(makeItems());
    select.open();
    (select as any)._setActive(0);
    const input = getInput(select);
    const apple = select.shadowRoot!.querySelector<HTMLElement>('[data-value="APL"]')!;
    expect(input.getAttribute('aria-activedescendant')).toBe(apple.id);

    setGuardedWindow(select, 1, 2);
    expect(select.shadowRoot!.querySelector('[data-value="APL"]')).toBeTruthy();

    (select as any)._renderOptions();

    expect((select as any)._virtualizationScope.mountedKeys).toEqual(['b']);
    expect(input.hasAttribute('aria-activedescendant')).toBe(false);
    expect((select as any)._materializeGuardedVirtualKey('a')).toBe(true);
    const remountedApple = select.shadowRoot!.querySelector<HTMLElement>('[data-value="APL"]');
    expect(remountedApple).toBeTruthy();
    expect(input.getAttribute('aria-activedescendant')).toBe(remountedApple!.id);
  });

  it('destroys and clears the guarded controller when grouped rendering takes over', () => {
    const groupedItems = makeItems();
    select.setItems(groupedItems);
    setGuardedWindow(select, 1, 2);
    expect((select as any)._guardedVirtualizer).toBeTruthy();

    select.setGroupedItems([{ label: 'Fruit', options: groupedItems }]);

    expect((select as any)._guardedVirtualizer).toBeNull();
    expect((select as any)._guardedVirtualWindow).toBeNull();
    expect((select as any)._renderPlan.mode).toBe('legacy-full');
    expect(select.shadowRoot!.querySelectorAll('[part="option"]')).toHaveLength(3);
  });

  it('materializes a requested key into the current guarded window', () => {
    select.setItems(makeItems());
    setGuardedWindow(select, 0, 1);
    (select as any)._renderOptions();

    expect((select as any)._virtualizationScope.mountedKeys).toEqual(['a']);
    expect((select as any)._materializeGuardedVirtualKey('c')).toBe(true);

    expect((select as any)._guardedVirtualWindow).toEqual({ startIndex: 2, endIndex: 3 });
    expect((select as any)._virtualizationScope.mountedKeys).toEqual(['c']);
    expect(select.shadowRoot!.querySelector('[data-value="CHR"]')).toBeTruthy();
  });

  it('preserves selection outside the mounted window and restores selected ARIA when remounted', () => {
    select.updateConfig({ selection: { mode: 'multi', closeOnSelect: false } });
    select.setItems(makeItems());
    clickOption(select, 0);
    const selectedBefore = engineSelectedKeys(select);
    setGuardedWindow(select, 1, 3);

    (select as any)._renderOptions();

    expect(engineSelectedKeys(select)).toEqual(selectedBefore);
    expect(select.shadowRoot!.querySelector('[data-value="APL"]')).toBeNull();
    expect((select as any)._virtualizationScope.mountedKeys).toEqual(['b', 'c']);

    (select as any)._scrollToSelected();

    expect(engineSelectedKeys(select)).toEqual(['a']);
    expect(select.shadowRoot!.querySelector('[data-value="APL"]')?.getAttribute('aria-selected')).toBe('true');
  });

  it('clears active descendant while active target is outside the window and restores it when remounted', () => {
    select.setItems(makeItems());
    select.open();
    getInput(select).dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowDown', bubbles: true, cancelable: true,
    }));
    const activeKey = engineActiveKey(select);
    expect(activeKey).not.toBeNull();
    const activeIndex = (select as any)._itemRegistry.keyToIndex.get(activeKey);

    setGuardedWindow(
      select,
      activeIndex === 0 ? 1 : 0,
      activeIndex === 0 ? 3 : 1,
    );
    (select as any)._renderOptions();

    expect(engineActiveKey(select)).toBe(activeKey);
    expect((select as any)._engine.state.registeredKeys.has(activeKey)).toBe(true);
    expect((select as any)._virtualizationScope.mountedKeys).not.toContain(activeKey);
    expect(getInput(select).hasAttribute('aria-activedescendant')).toBe(false);

    (select as any)._setActive(activeIndex);

    const activeOption = select.shadowRoot!.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    expect(activeOption).toBeTruthy();
    expect(getInput(select).getAttribute('aria-activedescendant')).toBe(activeOption!.id);
  });

  it('drops stale mounted keys and active descendant after a newer key materialization', () => {
    select.setItems(makeItems());
    select.open();
    getInput(select).dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowDown', bubbles: true, cancelable: true,
    }));
    const activeKey = engineActiveKey(select);
    expect(activeKey).not.toBeNull();
    const activeIndex = (select as any)._itemRegistry.keyToIndex.get(activeKey);
    const firstKey = activeKey === 'c' ? 'a' : 'c';
    const latestKey = activeKey === 'a' ? 'b' : 'a';

    setGuardedWindow(select, 0, 1);
    (select as any)._renderOptions();
    expect((select as any)._materializeGuardedVirtualKey(firstKey)).toBe(true);
    expect((select as any)._materializeGuardedVirtualKey(latestKey)).toBe(true);

    expect((select as any)._virtualizationScope.mountedKeys).toEqual([latestKey]);
    expect((select as any)._virtualizationScope.mountedKeys).not.toContain(activeKey);
    expect(engineActiveKey(select)).toBe(activeKey);
    expect(getInput(select).hasAttribute('aria-activedescendant')).toBe(false);

    // The materialized key has replaced the previous range, rather than
    // leaving option targets from an earlier render in the mounted snapshot.
    const firstIndex = (select as any)._itemRegistry.keyToIndex.get(firstKey);
    expect(select.shadowRoot!.querySelector(`[data-index="${activeIndex}"]`)).toBeNull();
    expect(select.shadowRoot!.querySelector(`[data-index="${firstIndex}"]`)).toBeNull();
  });

  it('keeps the virtual plan key-to-filtered-index mapping in current filtered order', () => {
    select.updateConfig({ searchable: true });
    const [apple, banana, cherry] = makeItems();
    select.setItems([cherry, apple, banana]);
    filterTo(select, 'a');
    const activePlan = (select as any)._renderPlan;

    const virtualPlan = (select as any)._createVirtualRenderPlan(0, 2);

    expect(virtualPlan.filteredKeys).toEqual(['a', 'b']);
    expect(virtualPlan.intendedRenderKeys).toEqual(['a', 'b']);
    expect(virtualPlan.filteredIndices).toEqual([1, 2]);
    expect(virtualPlan.filteredIndexByKey.get('a')).toBe(0);
    expect(virtualPlan.filteredIndexByKey.get('b')).toBe(1);
    expect((select as any)._renderPlan).toBe(activePlan);
    expect(activePlan.mode).toBe('legacy-full');
    expect(activePlan.intendedRenderKeys).toEqual(['a', 'b']);
  });

  it('does not mutate selection, active identity, or ARIA while calculating a virtual plan', () => {
    select.setItems(makeItems());
    clickOption(select, 0);
    select.open();
    getInput(select).dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowDown', bubbles: true, cancelable: true,
    }));
    const selectedBefore = engineSelectedKeys(select);
    const activeBefore = engineActiveKey(select);
    const activeDescendantBefore = getInput(select).getAttribute('aria-activedescendant');

    const virtualPlan = (select as any)._createVirtualRenderPlan(1, 3);

    expect(virtualPlan.intendedRenderKeys).toEqual(['b', 'c']);
    expect(engineSelectedKeys(select)).toEqual(selectedBefore);
    expect(engineActiveKey(select)).toBe(activeBefore);
    expect(getInput(select).getAttribute('aria-activedescendant')).toBe(activeDescendantBefore);
    expect((select as any)._renderPlan.mode).toBe('legacy-full');
  });

  it('keeps grouped rendering on the existing full synchronous path', () => {
    const groupedItems = makeItems();
    select.setItems(groupedItems);
    setGuardedWindow(select, 1, 2);

    select.setGroupedItems([{ label: 'Fruit', options: groupedItems }]);

    expect(select.shadowRoot!.querySelectorAll('[part="option"]')).toHaveLength(3);
    expect(select.shadowRoot!.querySelector('[part="group-header"]')?.textContent).toBe('Fruit');
    expect((select as any)._renderPlan.intendedRenderKeys).toEqual(['a', 'b', 'c']);
    expect((select as any)._renderPlan.mode).toBe('legacy-full');
    expect((select as any)._guardedVirtualWindow).toBeNull();
  });

  it('eventually renders all filtered options through the current chunked path', async () => {
    const items = Array.from({ length: 360 }, (_, index) => ({
      id: `item-${index}`,
      value: `value-${index}`,
      label: `Option ${index}`,
    }));
    select.setItems(items);

    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        cancelAnimationFrame(frame);
        reject(new Error('chunked rendering did not mount every filtered option'));
      }, 5000);
      let frame = 0;
      const checkRenderedCount = () => {
        if (select.shadowRoot!.querySelectorAll('[part="option"]').length === items.length) {
          window.clearTimeout(timeout);
          resolve();
          return;
        }
        frame = requestAnimationFrame(checkRenderedCount);
      };
      checkRenderedCount();
    });

    expect(select.shadowRoot!.querySelectorAll('[part="option"]')).toHaveLength(items.length);
    const plan = (select as any)._renderPlan;
    expect(plan.intendedRenderKeys).toEqual(plan.filteredKeys);
    expect((select as any)._virtualizationScope.mountedKeys).toEqual(plan.intendedRenderKeys);
  });
});
