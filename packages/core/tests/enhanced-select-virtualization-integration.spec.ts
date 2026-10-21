import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

const makeLargeItems = (count: number): TestItem[] => Array.from({ length: count }, (_, index) => ({
  id: `item-${index}`,
  value: `value-${index}`,
  label: `Option ${index}`,
}));

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
  const itemHeight = (select as any)._resolveGuardedEstimatedItemHeight() as number;
  (select as any)._updateGuardedVirtualWindow(
    startIndex * itemHeight,
    Math.max(0, endIndex - startIndex - 1) * itemHeight,
  );
}

function runGuardedScheduledUpdate(select: EnhancedSelect): void {
  const scheduled: { callback?: () => void } = {};
  const requestFrame = vi.spyOn(select as any, '_requestLifecycleFrame')
    .mockImplementation((...args: unknown[]) => {
      scheduled.callback = args[0] as () => void;
      return 9001;
    });
  (select as any)._scheduleGuardedVirtualWindowUpdate();
  requestFrame.mockRestore();
  scheduled.callback?.();
}

function mockResizeObservers(): Array<{
  targets: Set<Element>;
  emit: (target: Element, height: number) => void;
  callback: ResizeObserverCallback;
}> {
  const instances: Array<{
    targets: Set<Element>;
    emit: (target: Element, height: number) => void;
    callback: ResizeObserverCallback;
  }> = [];
  class TestResizeObserver {
    private targets = new Set<Element>();
    constructor(private callback: ResizeObserverCallback) {
      instances.push({
        targets: this.targets,
        callback,
        emit: (target, height) => callback([{
          target,
          contentRect: { height } as DOMRectReadOnly,
          borderBoxSize: [{ blockSize: height, inlineSize: 100 }] as ResizeObserverSize[],
        } as ResizeObserverEntry], this as unknown as ResizeObserver),
      });
    }
    observe(target: Element): void { this.targets.add(target); }
    unobserve(target: Element): void { this.targets.delete(target); }
    disconnect(): void { this.targets.clear(); }
  }
  vi.stubGlobal('ResizeObserver', TestResizeObserver);
  return instances;
}

describe('EnhancedSelect pre-virtualization integration guards', () => {
  let select: EnhancedSelect;

  beforeEach(() => {
    select = document.createElement('enhanced-select') as EnhancedSelect;
    document.body.appendChild(select);
  });

  afterEach(() => {
    select.remove();
    vi.unstubAllGlobals();
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
    expect(scrollIntent).toMatchObject({ index: 2, offset: 96, scrollTop: 96 });
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

  describe('guarded Virtualizer-backed regression gate', () => {
    it('keeps selectedKeys stable across repeated guarded updateWindow calls', () => {
      select.updateConfig({ selection: { mode: 'multi', closeOnSelect: false } });
      select.setItems(makeItems());
      clickOption(select, 0);
      const selectedBefore = engineSelectedKeys(select);
      setGuardedWindow(select, 0, 2);
      setGuardedWindow(select, 1, 3);
      setGuardedWindow(select, 0, 1);
      (select as any)._renderOptions();

      expect(engineSelectedKeys(select)).toEqual(selectedBefore);
    });

    it('keeps activeKey stable across repeated guarded updateWindow calls', () => {
      select.setItems(makeItems());
      select.open();
      (select as any)._setActive(2);
      const activeBefore = engineActiveKey(select);
      setGuardedWindow(select, 0, 1);
      setGuardedWindow(select, 1, 2);
      setGuardedWindow(select, 0, 2);
      (select as any)._renderOptions();

      expect(engineActiveKey(select)).toBe(activeBefore);
      expect(getInput(select).hasAttribute('aria-activedescendant')).toBe(false);
    });

    it('resolves scrollToKey against the reordered key index instead of its prior index', () => {
      const [apple, banana, cherry] = makeItems();
      select.setItems([apple, banana, cherry]);
      setGuardedWindow(select, 0, 1);
      (select as any)._renderOptions();

      select.setItems([cherry, apple, banana]);
      expect((select as any)._renderPlan.filteredIndexByKey.get('a')).toBe(1);
      expect((select as any)._materializeGuardedVirtualKey('a')).toBe(true);

      expect((select as any)._guardedVirtualizer.getCurrentWindow()).toMatchObject({ startIndex: 1, endIndex: 1 });
      expect((select as any)._virtualizationScope.mountedKeys).toEqual(['a']);
      expect(select.shadowRoot!.querySelector('[data-value="APL"]')).toBeTruthy();
    });

    it('uses the current filtered index generation for scrollToIndex materialization', () => {
      select.updateConfig({ searchable: true });
      select.setItems(makeItems());
      setGuardedWindow(select, 0, 2);
      (select as any)._renderOptions();
      filterTo(select, 'Cherry');

      expect((select as any)._renderPlan.filteredKeys).toEqual(['c']);
      expect((select as any)._guardedVirtualizer.getCurrentWindow()).toMatchObject({ startIndex: 0, endIndex: 0 });
      const result = (select as any)._guardedVirtualizer.scrollToIndex(0);
      expect((select as any)._applyGuardedScrollResult(result)).toBe(true);
      (select as any)._renderOptions();

      expect((select as any)._virtualizationScope.mountedKeys).toEqual(['c']);
      expect(select.shadowRoot!.querySelector('[data-value="CHR"]')).toBeTruthy();
    });

    it('clears mounted keys and active descendant when the window evicts the active option', () => {
      select.setItems(makeItems());
      select.open();
      (select as any)._setActive(0);
      setGuardedWindow(select, 2, 3);
      (select as any)._renderOptions();

      expect((select as any)._virtualizationScope.mountedKeys).toEqual(['c']);
      expect(getInput(select).hasAttribute('aria-activedescendant')).toBe(false);
      expect((select as any)._materializeGuardedVirtualKey('a')).toBe(true);
      const option = select.shadowRoot!.querySelector<HTMLElement>('[data-value="APL"]');
      expect((select as any)._virtualizationScope.mountedKeys).toEqual(['a']);
      expect(getInput(select).getAttribute('aria-activedescendant')).toBe(option!.id);
    });

    it('restores selected ARIA after scroll-to-selected remounts the selected key', () => {
      select.updateConfig({ selection: { mode: 'multi', closeOnSelect: false } });
      select.setItems(makeItems());
      clickOption(select, 0);
      setGuardedWindow(select, 2, 3);
      (select as any)._renderOptions();

      expect(engineSelectedKeys(select)).toEqual(['a']);
      expect(select.shadowRoot!.querySelector('[data-value="APL"]')).toBeNull();
      (select as any)._scrollToSelected();

      expect(engineSelectedKeys(select)).toEqual(['a']);
      expect(select.shadowRoot!.querySelector('[data-value="APL"]')?.getAttribute('aria-selected')).toBe('true');
      expect((select as any)._virtualizationScope.mountedKeys).toEqual(['a']);
    });

    it('destroys and clears guarded controller state on disconnect', () => {
      select.setItems(makeItems());
      setGuardedWindow(select, 0, 1);
      (select as any)._renderOptions();
      expect((select as any)._virtualizationScope.mountedKeys).toEqual(['a']);

      select.remove();

      expect((select as any)._guardedVirtualizer).toBeNull();
      expect((select as any)._guardedVirtualWindow).toBeNull();
      expect((select as any)._virtualizationScope.mountedKeys).toEqual([]);
    });

    it('does not leave stale option IDs after a guarded render supersedes materialization', async () => {
      const items = Array.from({ length: 400 }, (_, index) => ({
        id: `item-${index}`,
        value: `value-${index}`,
        label: `Option ${index}`,
      }));
      select.setItems(items);
      setGuardedWindow(select, 0, 350);
      (select as any)._renderOptions();
      const firstRange = (select as any)._renderPlan.intendedRenderKeys[0];

      expect((select as any)._materializeGuardedVirtualKey('item-399')).toBe(true);
      await new Promise((resolve) => window.setTimeout(resolve, 50));

      expect((select as any)._virtualizationScope.mountedKeys).toEqual(['item-399']);
      expect(select.shadowRoot!.querySelector('[data-value="value-0"]')).toBeNull();
      expect(select.shadowRoot!.querySelector('[id$="option-0"]')).toBeNull();
      expect((select as any)._virtualizationScope.mountedKeys).not.toContain(firstRange);
    });

    it('keeps public virtualize configuration from activating guarded bounded mode', () => {
      select.updateConfig({ virtualize: true });
      select.setItems(makeItems());

      expect((select as any)._guardedVirtualizer).toBeNull();
      expect((select as any)._renderPlan.mode).toBe('legacy-full');
      expect(select.shadowRoot!.querySelectorAll('[part="option"]')).toHaveLength(3);
    });

    it('does not install a scroll listener in default legacy-full mode', () => {
      select.setItems(makeItems());
      const optionsContainer = (select as any)._optionsContainer as HTMLElement;
      const dropdown = (select as any)._dropdown as HTMLElement;
      const containerListener = vi.spyOn(optionsContainer, 'addEventListener');
      const dropdownListener = vi.spyOn(dropdown, 'addEventListener');

      expect(containerListener.mock.calls.filter(([type]) => type === 'scroll')).toEqual([]);
      expect(dropdownListener.mock.calls.filter(([type]) => type === 'scroll')).toEqual([]);
      containerListener.mockRestore();
      dropdownListener.mockRestore();
    });
  });

  describe('guarded viewport sizing and scroll scheduling scaffold', () => {
    it('uses the configured estimated item height when it is valid', () => {
      select.updateConfig({ estimatedItemHeight: 24 });
      select.setItems(makeItems());

      setGuardedWindow(select, 0, 1);

      expect((select as any)._guardedVirtualizer.averageHeight).toBe(24);
      expect((select as any)._resolveGuardedEstimatedItemHeight()).toBe(24);
    });

    it('uses a rendered option measurement when the configured height is invalid', () => {
      select.updateConfig({ estimatedItemHeight: Number.NaN });
      select.setItems(makeItems());
      const option = select.shadowRoot!.querySelector<HTMLElement>('[part="option"]')!;
      vi.spyOn(option, 'getBoundingClientRect').mockReturnValue({ height: 31 } as DOMRect);

      expect((select as any)._resolveGuardedEstimatedItemHeight()).toBe(31);
      setGuardedWindow(select, 0, 1);
      expect((select as any)._guardedVirtualizer.averageHeight).toBe(31);
    });

    it('uses a safe internal estimate when configured and rendered heights are invalid', () => {
      select.updateConfig({ estimatedItemHeight: Number.POSITIVE_INFINITY });
      select.setItems(makeItems());

      expect((select as any)._resolveGuardedEstimatedItemHeight()).toBe(48);
      setGuardedWindow(select, 0, 1);
      expect((select as any)._guardedVirtualizer.averageHeight).toBe(48);
    });

    it('derives guarded viewport height from dropdown and options container geometry', () => {
      select.setItems(makeItems());
      const dropdown = (select as any)._dropdown as HTMLElement;
      const optionsContainer = (select as any)._optionsContainer as HTMLElement;
      Object.defineProperty(dropdown, 'clientHeight', { configurable: true, value: 137 });
      Object.defineProperty(optionsContainer, 'clientHeight', { configurable: true, value: 93 });

      expect((select as any)._resolveGuardedViewportHeight()).toBe(93);

      Object.defineProperty(dropdown, 'clientHeight', { configurable: true, value: 0 });
      vi.spyOn(dropdown, 'getBoundingClientRect').mockReturnValue({ height: 0 } as DOMRect);
      expect((select as any)._resolveGuardedViewportHeight()).toBe(93);
    });

    it('turns zero or invalid viewport measurements into a safe bounded window', () => {
      select.setItems(makeItems());
      setGuardedWindow(select, 0, 1);
      const dropdown = (select as any)._dropdown as HTMLElement;
      const optionsContainer = (select as any)._optionsContainer as HTMLElement;
      Object.defineProperty(dropdown, 'clientHeight', { configurable: true, value: Number.NaN });
      Object.defineProperty(optionsContainer, 'clientHeight', { configurable: true, value: -1 });
      vi.spyOn(dropdown, 'getBoundingClientRect').mockReturnValue({ height: Number.POSITIVE_INFINITY } as DOMRect);
      vi.spyOn(optionsContainer, 'getBoundingClientRect').mockReturnValue({ height: 0 } as DOMRect);

      expect((select as any)._resolveGuardedViewportHeight()).toBe(0);
      runGuardedScheduledUpdate(select);

      expect((select as any)._guardedVirtualWindow).toEqual({ startIndex: 0, endIndex: 3 });
      expect((select as any)._virtualizationScope.mountedKeys.length).toBeLessThanOrEqual(3);
    });

    it('applies a small guarded overscan around the visible range', () => {
      select.updateConfig({ estimatedItemHeight: 20 });
      const items = Array.from({ length: 20 }, (_, index) => ({
        id: `item-${index}`,
        value: `value-${index}`,
        label: `Option ${index}`,
      }));
      select.setItems(items);
      setGuardedWindow(select, 0, 1);
      const dropdown = (select as any)._optionsContainer as HTMLElement;
      Object.defineProperty(dropdown, 'clientHeight', { configurable: true, value: 40 });
      dropdown.scrollTop = 100;

      runGuardedScheduledUpdate(select);

      expect((select as any)._guardedVirtualWindow).toEqual({ startIndex: 3, endIndex: 10 });
      expect((select as any)._virtualizationScope.mountedKeys).toEqual(items.slice(3, 10).map((item) => item.id));
    });

    it('refreshes the guarded window after scrollTop changes and a scheduled update runs', () => {
      select.updateConfig({ estimatedItemHeight: 20 });
      const items = Array.from({ length: 20 }, (_, index) => ({
        id: `item-${index}`,
        value: `value-${index}`,
        label: `Option ${index}`,
      }));
      select.setItems(items);
      setGuardedWindow(select, 0, 1);
      const dropdown = (select as any)._optionsContainer as HTMLElement;
      Object.defineProperty(dropdown, 'clientHeight', { configurable: true, value: 40 });
      dropdown.scrollTop = 160;

      runGuardedScheduledUpdate(select);

      expect((select as any)._guardedVirtualizer.getCurrentWindow()).toMatchObject({ startIndex: 8, endIndex: 10 });
      expect((select as any)._guardedVirtualWindow).toEqual({ startIndex: 6, endIndex: 13 });
      expect((select as any)._virtualizationScope.mountedKeys).toEqual(items.slice(6, 13).map((item) => item.id));
    });

    it('routes guarded dropdown scroll events to the private scheduling helper', () => {
      select.setItems(makeItems());
      setGuardedWindow(select, 0, 1);
      const dropdown = (select as any)._optionsContainer as HTMLElement;
      const schedule = vi.spyOn(select as any, '_scheduleGuardedVirtualWindowUpdate');

      dropdown.dispatchEvent(new Event('scroll'));

      expect(schedule).toHaveBeenCalledOnce();
      schedule.mockRestore();
    });

    it('cancels pending guarded scroll work and clears targets on disconnect', () => {
      select.setItems(makeItems());
      setGuardedWindow(select, 0, 1);
      const requestFrame = vi.spyOn(select as any, '_requestLifecycleFrame').mockReturnValue(9010);
      const cancelFrame = vi.spyOn(window, 'cancelAnimationFrame');
      (select as any)._scheduleGuardedVirtualWindowUpdate();

      select.remove();

      expect(cancelFrame).toHaveBeenCalledWith(9010);
      expect((select as any)._guardedVirtualWindowRafId).toBeNull();
      expect((select as any)._guardedVirtualizer).toBeNull();
      expect((select as any)._virtualizationScope.mountedKeys).toEqual([]);
      requestFrame.mockRestore();
      cancelFrame.mockRestore();
    });

    it('cancels guarded scheduling and destroys the controller on grouped fallback', () => {
      const groupedItems = makeItems();
      select.setItems(groupedItems);
      setGuardedWindow(select, 0, 1);
      const requestFrame = vi.spyOn(select as any, '_requestLifecycleFrame').mockReturnValue(9011);
      const cancelFrame = vi.spyOn(window, 'cancelAnimationFrame');
      const removeListener = vi.spyOn((select as any)._optionsContainer as HTMLElement, 'removeEventListener');
      (select as any)._scheduleGuardedVirtualWindowUpdate();

      select.setGroupedItems([{ label: 'Fruit', options: groupedItems }]);

      expect(cancelFrame).toHaveBeenCalledWith(9011);
      expect((select as any)._guardedVirtualizer).toBeNull();
      expect((select as any)._guardedScrollListenerAttached).toBe(false);
      expect(removeListener.mock.calls.some(([type]) => type === 'scroll')).toBe(true);
      expect(select.shadowRoot!.querySelectorAll('[part="option"]')).toHaveLength(3);
      requestFrame.mockRestore();
      cancelFrame.mockRestore();
      removeListener.mockRestore();
    });

    it('preserves selection and active identity through repeated scheduled updates', () => {
      select.updateConfig({ estimatedItemHeight: 20, selection: { mode: 'multi', closeOnSelect: false } });
      const items = Array.from({ length: 12 }, (_, index) => ({
        id: `item-${index}`,
        value: `value-${index}`,
        label: `Option ${index}`,
      }));
      select.setItems(items);
      clickOption(select, 0);
      select.open();
      (select as any)._setActive(10);
      const selectedBefore = engineSelectedKeys(select);
      const activeBefore = engineActiveKey(select);
      setGuardedWindow(select, 0, 1);
      const dropdown = (select as any)._optionsContainer as HTMLElement;
      Object.defineProperty(dropdown, 'clientHeight', { configurable: true, value: 40 });

      dropdown.scrollTop = 80;
      runGuardedScheduledUpdate(select);
      dropdown.scrollTop = 160;
      runGuardedScheduledUpdate(select);

      expect(engineSelectedKeys(select)).toEqual(selectedBefore);
      expect(engineActiveKey(select)).toBe(activeBefore);
    });

    it('clears active descendant after a scheduled eviction and restores it after materialization', () => {
      select.updateConfig({ estimatedItemHeight: 20 });
      const items = Array.from({ length: 12 }, (_, index) => ({
        id: `item-${index}`,
        value: `value-${index}`,
        label: `Option ${index}`,
      }));
      select.setItems(items);
      select.open();
      (select as any)._setActive(0);
      setGuardedWindow(select, 0, 1);
      const dropdown = (select as any)._optionsContainer as HTMLElement;
      Object.defineProperty(dropdown, 'clientHeight', { configurable: true, value: 20 });
      dropdown.scrollTop = 120;

      runGuardedScheduledUpdate(select);

      expect((select as any)._virtualizationScope.mountedKeys).not.toContain('item-0');
      expect(getInput(select).hasAttribute('aria-activedescendant')).toBe(false);
      expect((select as any)._materializeGuardedVirtualKey('item-0')).toBe(true);
      const activeOption = select.shadowRoot!.querySelector<HTMLElement>('[data-value="value-0"]');
      expect(activeOption).toBeTruthy();
      expect(getInput(select).getAttribute('aria-activedescendant')).toBe(activeOption!.id);
    });

    it('keeps default full rendering and installs no scroll listener outside guarded mode', () => {
      select.updateConfig({ virtualize: true });
      select.setItems(makeItems());
      const dropdown = (select as any)._dropdown as HTMLElement;
      const optionsContainer = (select as any)._optionsContainer as HTMLElement;
      const dropdownListener = vi.spyOn(dropdown, 'addEventListener');
      const optionsListener = vi.spyOn(optionsContainer, 'addEventListener');

      (select as any)._renderOptions();

      expect((select as any)._guardedVirtualizer).toBeNull();
      expect((select as any)._renderPlan.mode).toBe('legacy-full');
      expect((select as any)._renderPlan.intendedRenderKeys).toEqual(['a', 'b', 'c']);
      expect(select.shadowRoot!.querySelectorAll('[part="option"]')).toHaveLength(3);
      expect(dropdownListener.mock.calls.filter(([type]) => type === 'scroll')).toEqual([]);
      expect(optionsListener.mock.calls.filter(([type]) => type === 'scroll')).toEqual([]);
      dropdownListener.mockRestore();
      optionsListener.mockRestore();
    });
  });

  describe('guarded scroll geometry and positioning', () => {
    function configureGuardedList(count = 100): { items: TestItem[]; scroller: HTMLElement } {
      select.updateConfig({ estimatedItemHeight: 20, searchable: true });
      const items = makeLargeItems(count);
      select.setItems(items);
      const scroller = (select as any)._optionsContainer as HTMLElement;
      Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: 100 });
      setGuardedWindow(select, 0, 5);
      (select as any)._renderOptions();
      return { items, scroller };
    }

    it('retains total virtual scroll height while mounting only the bounded window', () => {
      const { scroller } = configureGuardedList(10_000);
      const spacers = scroller.querySelectorAll<HTMLElement>('[data-virtual-spacer]');
      Object.defineProperty(scroller, 'scrollHeight', {
        configurable: true,
        get: () => Array.from(spacers).reduce((total, spacer) => total + Number.parseFloat(spacer.style.height), 0)
          + scroller.querySelectorAll('[part="option"]').length * 20,
      });

      expect(scroller.querySelectorAll('[part="option"]').length).toBeLessThanOrEqual(6);
      expect(spacers).toHaveLength(2);
      expect(scroller.scrollHeight).toBeGreaterThanOrEqual(10_000 * 20);
      expect((select as any)._virtualizationScope.registeredKeys).toHaveLength(10_000);
      expect((select as any)._virtualizationScope.mountedKeys.length).toBeLessThanOrEqual(6);
    });

    it('sets top and bottom spacer heights from virtualizer prefix offsets', () => {
      const { scroller } = configureGuardedList(40);
      (select as any)._updateGuardedVirtualWindow(200, 100);
      (select as any)._renderOptions();
      const virtualizer = (select as any)._guardedVirtualizer;
      const window = (select as any)._guardedVirtualWindow;
      const top = scroller.querySelector<HTMLElement>('[data-virtual-spacer="top"]')!;
      const bottom = scroller.querySelector<HTMLElement>('[data-virtual-spacer="bottom"]')!;

      expect(Number.parseFloat(top.style.height)).toBe(virtualizer.cumulativeOffset(window.startIndex));
      expect(Number.parseFloat(bottom.style.height)).toBe(
        Math.max(0, virtualizer.cumulativeOffset(40) - virtualizer.cumulativeOffset(window.endIndex)),
      );
      for (const spacer of [top, bottom]) {
        expect(spacer.getAttribute('aria-hidden')).toBe('true');
        expect(spacer.hasAttribute('data-index')).toBe(false);
        expect(spacer.hasAttribute('data-sm-selectable')).toBe(false);
      }
    });

    it('updates mounted options and spacer geometry while scrolling forward and backward', () => {
      const { scroller } = configureGuardedList(100);
      scroller.scrollTop = 800;
      runGuardedScheduledUpdate(select);
      expect((select as any)._virtualizationScope.mountedKeys[0]).toBe('item-38');
      expect(Number.parseFloat(scroller.querySelector<HTMLElement>('[data-virtual-spacer="top"]')!.style.height)).toBeGreaterThan(0);

      scroller.scrollTop = 0;
      runGuardedScheduledUpdate(select);
      expect((select as any)._virtualizationScope.mountedKeys[0]).toBe('item-0');
      expect(Number.parseFloat(scroller.querySelector<HTMLElement>('[data-virtual-spacer="top"]')!.style.height)).toBe(0);
    });

    it('coalesces repeated scroll events and keeps one guarded listener attached', () => {
      select.updateConfig({ estimatedItemHeight: 20 });
      select.setItems(makeLargeItems(100));
      const scroller = (select as any)._optionsContainer as HTMLElement;
      const addListener = vi.spyOn(scroller, 'addEventListener');
      setGuardedWindow(select, 0, 5);
      const schedule = vi.spyOn(select as any, '_scheduleGuardedVirtualWindowUpdate');
      const requestFrame = vi.spyOn(select as any, '_requestLifecycleFrame').mockReturnValue(9020);

      scroller.dispatchEvent(new Event('scroll'));
      scroller.dispatchEvent(new Event('scroll'));
      scroller.dispatchEvent(new Event('scroll'));

      expect(addListener.mock.calls.filter(([type]) => type === 'scroll')).toHaveLength(1);
      expect(schedule).toHaveBeenCalledTimes(3);
      expect(requestFrame).toHaveBeenCalledOnce();
      expect((select as any)._guardedVirtualWindowRafId).toBe(9020);
      addListener.mockRestore();
      schedule.mockRestore();
      requestFrame.mockRestore();
    });

    it('preserves selected identity while scrolling evicts its option node', () => {
      select.updateConfig({ estimatedItemHeight: 20, selection: { mode: 'multi', closeOnSelect: false } });
      const items = makeLargeItems(80);
      select.setItems(items);
      clickOption(select, 0);
      const selectedBefore = engineSelectedKeys(select);
      const scroller = (select as any)._optionsContainer as HTMLElement;
      Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: 100 });
      setGuardedWindow(select, 0, 5);
      (select as any)._renderOptions();
      scroller.scrollTop = 600;
      runGuardedScheduledUpdate(select);

      expect(engineSelectedKeys(select)).toEqual(selectedBefore);
      expect(select.shadowRoot!.querySelector('[data-value="value-0"]')).toBeNull();
    });

    it('preserves active identity and removes its ARIA reference while offscreen', () => {
      const { scroller } = configureGuardedList(80);
      select.open();
      (select as any)._setActive(0);
      const activeBefore = engineActiveKey(select);
      scroller.scrollTop = 600;
      runGuardedScheduledUpdate(select);

      expect(engineActiveKey(select)).toBe(activeBefore);
      expect(getInput(select).hasAttribute('aria-activedescendant')).toBe(false);
    });

    it('uses the current key index when scrolling to a key after reorder', () => {
      const { scroller } = configureGuardedList(20);
      const items = makeLargeItems(20);
      select.setItems([items[10], ...items.slice(0, 10), ...items.slice(11)]);

      expect((select as any)._materializeGuardedVirtualKey('item-0')).toBe(true);
      expect((select as any)._guardedVirtualizer.getCurrentWindow()).toMatchObject({ startIndex: 1, endIndex: 6 });
      expect((select as any)._optionsContainer.scrollTop).toBe(20);
      expect((select as any)._virtualizationScope.mountedKeys).toContain('item-0');
      expect(scroller).toBe((select as any)._optionsContainer);
    });

    it('recalculates list height and clamps scrollTop when filtering shrinks results', () => {
      const { scroller } = configureGuardedList(100);
      scroller.scrollTop = 1800;
      runGuardedScheduledUpdate(select);
      filterTo(select, 'Option 1');

      const virtualizer = (select as any)._guardedVirtualizer;
      expect((select as any)._renderPlan.filteredKeys.length).toBe(11);
      expect(virtualizer.cumulativeOffset(11)).toBe(220);
      expect(scroller.scrollTop).toBeLessThanOrEqual(120);
      expect((select as any)._guardedVirtualWindow.endIndex).toBeLessThanOrEqual(11);
      expect(scroller.scrollHeight).toBeLessThan(100 * 20);
    });

    it('keeps active descendant absent until the active option is mounted, then restores it', () => {
      const { scroller } = configureGuardedList(100);
      select.open();
      (select as any)._setActive(0);
      scroller.scrollTop = 1000;
      runGuardedScheduledUpdate(select);
      expect(getInput(select).hasAttribute('aria-activedescendant')).toBe(false);

      expect((select as any)._materializeGuardedVirtualKey('item-0')).toBe(true);
      const activeOption = select.shadowRoot!.querySelector<HTMLElement>('[data-value="value-0"]')!;
      expect(getInput(select).getAttribute('aria-activedescendant')).toBe(activeOption.id);
      expect(activeOption.isConnected).toBe(true);
    });

    it('preserves custom renderer item and index context after scrolling', () => {
      const calls: Array<{ id: string; index: number }> = [];
      select.optionRenderer = (item: unknown, index: number) => {
        calls.push({ id: (item as TestItem).id, index });
        return document.createElement('div');
      };
      const { scroller } = configureGuardedList(100);
      const previousCount = calls.length;
      scroller.scrollTop = 1200;
      runGuardedScheduledUpdate(select);

      expect(calls.length).toBeGreaterThan(previousCount);
      expect(calls.every(({ id, index }) => id === `item-${index}`)).toBe(true);
      expect(Array.from(scroller.querySelectorAll<HTMLElement>('[part="option"]'))
        .every((option) => option.dataset.smIndex === option.dataset.index)).toBe(true);
    });

    it('removes guarded spacer geometry when grouped rendering takes over', () => {
      const { items, scroller } = configureGuardedList(20);
      expect(scroller.querySelector('[data-virtual-spacer]')).toBeTruthy();

      select.setGroupedItems([{ label: 'Options', options: items }]);

      expect(scroller.querySelector('[data-virtual-spacer]')).toBeNull();
      expect(scroller.querySelectorAll('[part="option"]')).toHaveLength(20);
      expect((select as any)._guardedVirtualizer).toBeNull();
    });

    it('reconnects with one listener and cancels stale guarded work', () => {
      const { scroller } = configureGuardedList(100);
      const addListener = vi.spyOn(scroller, 'addEventListener');
      const requestFrame = vi.spyOn(select as any, '_requestLifecycleFrame').mockReturnValue(9030);
      (select as any)._scheduleGuardedVirtualWindowUpdate();
      select.remove();

      expect((select as any)._guardedVirtualWindowRafId).toBeNull();
      document.body.appendChild(select);
      expect((select as any)._guardedVirtualizer).toBeTruthy();
      expect(addListener.mock.calls.filter(([type]) => type === 'scroll')).toHaveLength(1);
      expect((select as any)._guardedVirtualWindowRafId).toBeNull();
      addListener.mockRestore();
      requestFrame.mockRestore();
    });

    it('leaves the legacy-full DOM structure and behavior unchanged', () => {
      select.setItems(makeLargeItems(20));
      const scroller = (select as any)._optionsContainer as HTMLElement;
      const beforeChildren = Array.from(scroller.children).map((element) => element.tagName);

      (select as any)._renderOptions();

      expect((select as any)._renderPlan.mode).toBe('legacy-full');
      expect(scroller.querySelector('[data-virtual-spacer]')).toBeNull();
      expect(Array.from(scroller.children).map((element) => element.tagName)).toEqual(beforeChildren);
      expect(scroller.querySelectorAll('[part="option"]')).toHaveLength(20);
    });

    it('bounds mounted options by viewport and overscan for 10,000 items', () => {
      const { scroller } = configureGuardedList(10_000);
      scroller.scrollTop = 50_000;
      runGuardedScheduledUpdate(select);

      expect(scroller.querySelectorAll('[part="option"]').length).toBeLessThanOrEqual(10);
      expect((select as any)._virtualizationScope.mountedKeys.length).toBeLessThanOrEqual(10);
      expect((select as any)._renderPlan.filteredKeys).toHaveLength(10_000);
    });
  });

  describe('guarded renderer parity and lifecycle hardening', () => {
    function setupGuardedRendererList(items = makeLargeItems(40), viewportHeight = 60): HTMLElement {
      select.updateConfig({ estimatedItemHeight: 20, searchable: true });
      select.setItems(items);
      const scroller = (select as any)._optionsContainer as HTMLElement;
      Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: viewportHeight });
      setGuardedWindow(select, 0, Math.ceil(viewportHeight / 20));
      (select as any)._renderOptions();
      return scroller;
    }

    it('measures mounted guarded options and reflects measured geometry in spacers', () => {
      const observers = mockResizeObservers();
      setupGuardedRendererList(makeLargeItems(40));
      const scroller = (select as any)._optionsContainer as HTMLElement;
      const option = scroller.querySelector<HTMLElement>('[data-index="0"]')!;
      const virtualizer = (select as any)._guardedVirtualizer;

      expect(observers).toHaveLength(1);
      expect(observers[0].targets.has(option)).toBe(true);
      expect(observers[0].targets.has(scroller.querySelector('[data-virtual-spacer]')!)).toBe(false);
      observers[0].emit(option, 31);

      expect(virtualizer.measuredHeights.get(0)).toBe(31);
      expect(scroller.querySelector<HTMLElement>('[data-virtual-spacer="bottom"]')?.style.height)
        .toBe(`${virtualizer.cumulativeOffset(40) - virtualizer.cumulativeOffset((select as any)._guardedVirtualWindow.endIndex)}px`);
    });

    it('measures custom renderer option roots through the same guarded path', () => {
      const observers = mockResizeObservers();
      select.optionRenderer = (item: unknown) => {
        const option = document.createElement('div');
        option.textContent = (item as TestItem).label;
        return option;
      };
      setupGuardedRendererList(makeLargeItems(40));
      const option = (select as any)._optionsContainer.querySelector('[data-index="0"]') as HTMLElement;

      observers[0].emit(option, 29);

      expect((select as any)._guardedVirtualizer.measuredHeights.get(0)).toBe(29);
    });

    it('rejects a queued resize callback from a superseded render of a reused renderer node', () => {
      const observers = mockResizeObservers();
      const reused = document.createElement('div');
      select.optionRenderer = (item: unknown) => {
        reused.textContent = (item as TestItem).label;
        return reused;
      };
      setupGuardedRendererList(makeLargeItems(40));
      const oldObserver = observers[observers.length - 1];
      const option = (select as any)._optionsContainer.querySelector('[data-index="0"]') as HTMLElement;

      (select as any)._renderOptions();
      expect((select as any)._optionsContainer.querySelector('[data-index="0"]')).toBe(option);
      expect(observers[observers.length - 1]).not.toBe(oldObserver);

      oldObserver.emit(option, 99);
      expect((select as any)._guardedVirtualizer.measuredHeights.size).toBe(0);
      observers[observers.length - 1].emit(option, 27);
      expect((select as any)._guardedVirtualizer.measuredHeights.get(0)).toBe(27);
    });

    it('ignores zero, non-finite, and stale option measurements', () => {
      const observers = mockResizeObservers();
      setupGuardedRendererList(makeLargeItems(40));
      const option = (select as any)._optionsContainer.querySelector('[data-index="0"]') as HTMLElement;
      const virtualizer = (select as any)._guardedVirtualizer;
      observers[0].emit(option, 0);
      observers[0].emit(option, Number.NaN);
      expect(virtualizer.measuredHeights.size).toBe(0);

      select.setItems([...makeLargeItems(40)].reverse());
      observers[0].emit(option, 90);
      expect((select as any)._guardedVirtualizer.measuredHeights.size).toBe(0);
    });

    it('preserves the stable visible key and intra-row offset when rows above it grow', () => {
      const observers = mockResizeObservers();
      setupGuardedRendererList(makeLargeItems(6000), 80);
      const scroller = (select as any)._optionsContainer as HTMLElement;
      scroller.scrollTop = 200;
      runGuardedScheduledUpdate(select);
      const aboveAnchor = scroller.querySelector<HTMLElement>('[data-index="3"]')!;
      expect(observers[0].targets.has(aboveAnchor)).toBe(true);

      observers[0].emit(aboveAnchor, 60);

      expect(scroller.scrollTop).toBe(220);
      expect((select as any)._guardedVirtualizer.cumulativeOffset(5)).toBe(220);
    });

    it('keeps an explicit scroll-to-key position when the target row is measured', () => {
      const observers = mockResizeObservers();
      setupGuardedRendererList(makeLargeItems(6000));
      expect((select as any)._materializeGuardedVirtualKey('item-8')).toBe(true);
      const scroller = (select as any)._optionsContainer as HTMLElement;
      const target = scroller.querySelector<HTMLElement>('[data-index="8"]')!;
      expect(scroller.scrollTop).toBe(160);

      observers[0].emit(target, 35);

      expect(scroller.scrollTop).toBe(160);
      expect((select as any)._guardedVirtualizer.measuredHeights.get(8)).toBe(35);
    });

    it('clears measurements when items with the same keys are replaced or reordered', () => {
      const observers = mockResizeObservers();
      setupGuardedRendererList(makeLargeItems(40));
      const option = (select as any)._optionsContainer.querySelector('[data-index="0"]') as HTMLElement;
      observers[0].emit(option, 30);
      expect((select as any)._guardedVirtualizer.measuredHeights.size).toBe(1);

      select.setItems(makeLargeItems(40).reverse());
      expect((select as any)._guardedVirtualizer.measuredHeights.size).toBe(0);
      select.setItems(makeLargeItems(40).map((item) => ({ ...item, label: `${item.label} replaced` })));
      expect((select as any)._guardedVirtualizer.measuredHeights.size).toBe(0);
    });

    it('invalidates index measurements when the active filter generation changes', () => {
      const observers = mockResizeObservers();
      setupGuardedRendererList(makeLargeItems(40));
      const option = (select as any)._optionsContainer.querySelector('[data-index="0"]') as HTMLElement;
      observers[0].emit(option, 30);
      expect((select as any)._guardedVirtualizer.measuredHeights.size).toBe(1);

      filterTo(select, 'Option 1');

      expect((select as any)._guardedVirtualizer.measuredHeights.size).toBe(0);
      expect((select as any)._renderPlan.filteredKeys).toHaveLength(11);
    });

    it('keeps selection, active identity, and ARIA coherent across measurement, scroll, filter, and keyboard input', () => {
      const observers = mockResizeObservers();
      select.updateConfig({ selection: { mode: 'multi', closeOnSelect: false } });
      const scroller = setupGuardedRendererList(makeLargeItems(100));
      select.open();
      const firstOption = scroller.querySelector<HTMLElement>('[data-index="0"]')!;
      observers[observers.length - 1].emit(firstOption, 30);
      scroller.scrollTop = 600;
      runGuardedScheduledUpdate(select);
      filterTo(select, 'Option 1');
      getInput(select).dispatchEvent(new KeyboardEvent('keydown', {
        key: 'ArrowDown', bubbles: true, cancelable: true,
      }));

      const filteredKeys = (select as any)._renderPlan.filteredKeys as string[];
      const activeKey = engineActiveKey(select);
      expect((select as any)._guardedVirtualizer.measuredHeights.size).toBe(0);
      expect(activeKey).not.toBeNull();
      expect(filteredKeys).toContain(activeKey);
      expect(engineSelectedKeys(select)).toEqual([]);
      const activeIndex = (select as any)._itemRegistry.keyToIndex.get(activeKey);
      const activeOption = select.shadowRoot!.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
      expect(getInput(select).getAttribute('aria-activedescendant')).toBe(activeOption?.id ?? null);
    });

    it('tears down observers for grouped fallback and ignores callbacks after disconnect', () => {
      const observers = mockResizeObservers();
      setupGuardedRendererList(makeLargeItems(40));
      const observer = observers[0];
      const option = (select as any)._optionsContainer.querySelector('[data-index="0"]') as HTMLElement;
      select.setGroupedItems([{ label: 'Group', options: makeLargeItems(2) }]);
      expect(observer.targets.size).toBe(0);
      expect((select as any)._guardedOptionResizeObserver).toBeNull();

      select.setItems(makeLargeItems(40));
      setGuardedWindow(select, 0, 3);
      (select as any)._renderOptions();
      const staleVirtualizer = (select as any)._guardedVirtualizer;
      const staleObserver = observers[observers.length - 1];
      const staleOption = (select as any)._optionsContainer.querySelector('[data-index="0"]') as HTMLElement;
      select.remove();
      staleObserver.emit(staleOption, 99);
      expect(staleVirtualizer.measuredHeights.size).toBe(0);
      expect(staleObserver.targets.size).toBe(0);
      expect(option.isConnected).toBe(false);
    });

    function renderWindow(startIndex: number, endIndex: number): void {
      setGuardedWindow(select, startIndex, endIndex);
      (select as any)._renderOptions();
    }

    it('preserves built-in selection, disabled ARIA, active styling, and keyboard selection after remount', () => {
      select.updateConfig({
        estimatedItemHeight: 20,
        selection: { mode: 'multi', closeOnSelect: false },
      });
      const items = [
        { id: 'chosen', value: 'CHOSEN', label: 'Chosen' },
        { id: 'blocked', value: 'BLOCKED', label: 'Blocked', disabled: true },
        ...makeLargeItems(20),
      ];
      select.setItems(items);
      clickOption(select, 0);
      setupGuardedRendererList(items);
      renderWindow(10, 14);
      renderWindow(0, 3);

      const chosen = select.shadowRoot!.querySelector<HTMLElement>('[data-value="CHOSEN"]')!;
      const blocked = select.shadowRoot!.querySelector<HTMLElement>('[data-value="BLOCKED"]')!;
      expect(chosen.id).toBe(`${(select as any)._uniqueId}-option-0`);
      expect(chosen.getAttribute('aria-selected')).toBe('true');
      expect(chosen.classList.contains('smilodon-option--selected')).toBe(true);
      expect(blocked.getAttribute('aria-disabled')).toBe('true');

      select.open();
      (select as any)._setActive(0);
      getInput(select).dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter', bubbles: true, cancelable: true,
      }));
      expect(engineSelectedKeys(select)).not.toContain('chosen');
    });

    it('keeps built-in option identity and current item content after reorder', () => {
      const items = makeLargeItems(20);
      setupGuardedRendererList(items);
      select.setItems([items[10], ...items.slice(0, 10), ...items.slice(11)]);
      renderWindow(0, 5);

      const option = select.shadowRoot!.querySelector<HTMLElement>('[data-value="value-0"]')!;
      expect(option.dataset.index).toBe('1');
      expect(option.id).toBe(`${(select as any)._uniqueId}-option-1`);
      expect(option.textContent).toContain('Option 0');
    });

    it('passes current custom item and index context after reorder, filter, and remount', () => {
      const calls: Array<{ id: string; index: number }> = [];
      select.optionRenderer = (item: unknown, index: number) => {
        calls.push({ id: (item as TestItem).id, index });
        const option = document.createElement('div');
        option.textContent = (item as TestItem).label;
        return option;
      };
      const items = makeLargeItems(20);
      setupGuardedRendererList(items);
      select.setItems([items[10], ...items.slice(0, 10), ...items.slice(11)]);
      renderWindow(10, 15);
      filterTo(select, 'Option 0');
      const beforeMaterialize = calls.length;

      expect((select as any)._materializeGuardedVirtualKey('item-0')).toBe(true);

      expect(calls.slice(beforeMaterialize)).toContainEqual({ id: 'item-0', index: 1 });
      const option = select.shadowRoot!.querySelector<HTMLElement>('[data-value="value-0"]')!;
      expect(option.dataset.index).toBe('1');
      expect(option.textContent).toBe('Option 0');
    });

    it('does not duplicate custom option event handling after remount', () => {
      select.updateConfig({ selection: { mode: 'multi', closeOnSelect: false } });
      let clickCount = 0;
      select.optionRenderer = (item: unknown) => {
        const option = document.createElement('div');
        option.textContent = (item as TestItem).label;
        option.addEventListener('click', () => { clickCount += 1; });
        return option;
      };
      const items = makeLargeItems(30);
      setupGuardedRendererList(items);

      clickOption(select, 0);
      renderWindow(12, 16);
      renderWindow(0, 4);
      clickOption(select, 0);

      expect(clickCount).toBe(2);
      expect(engineSelectedKeys(select)).toEqual([]);
    });

    it('refreshes custom content when the same key receives a replacement item', () => {
      select.optionRenderer = (item: unknown) => {
        const option = document.createElement('div');
        const current = item as TestItem;
        option.textContent = `${current.label} (${current.value})`;
        return option;
      };
      const items = makeLargeItems(20);
      setupGuardedRendererList(items);
      const replacement = { ...items[0], value: 'updated-value', label: 'Updated option' };
      select.setItems([replacement, ...items.slice(1)]);
      renderWindow(0, 5);

      const option = select.shadowRoot!.querySelector<HTMLElement>('[data-value="updated-value"]')!;
      expect(option.textContent).toBe('Updated option (updated-value)');
      expect(option.dataset.smValue).toBe('updated-value');
      expect(option.getAttribute('aria-label')).toBe('Updated option');
    });

    it('refreshes IDs and selected or disabled ARIA when a custom node is reused', () => {
      const cached = new Map<string, HTMLElement>();
      select.updateConfig({ selection: { mode: 'multi', closeOnSelect: false } });
      select.optionRenderer = (item: unknown) => {
        const current = item as TestItem;
        let option = cached.get(current.id);
        if (!option) {
          option = document.createElement('div');
          cached.set(current.id, option);
        }
        option.textContent = current.label;
        return option;
      };
      const items = [
        { id: 'a', value: 'A', label: 'Alpha' },
        { id: 'b', value: 'B', label: 'Beta' },
        ...makeLargeItems(12),
      ];
      setupGuardedRendererList(items);
      clickOption(select, 0);
      const reordered = [
        { ...items[1], disabled: true },
        { ...items[0] },
        ...items.slice(2),
      ];
      select.setItems(reordered);
      renderWindow(0, 5);

      const alpha = select.shadowRoot!.querySelector<HTMLElement>('[data-value="A"]')!;
      expect(alpha.id).toBe(`${(select as any)._uniqueId}-option-1`);
      expect(alpha.dataset.index).toBe('1');
      expect(alpha.getAttribute('aria-selected')).toBe('true');
      expect(alpha.hasAttribute('aria-disabled')).toBe(false);
      const beta = select.shadowRoot!.querySelector<HTMLElement>('[data-value="B"]')!;
      expect(beta.getAttribute('aria-disabled')).toBe('true');

      select.setItems([{ ...reordered[0], disabled: false }, { ...reordered[1] }, ...reordered.slice(2)]);
      const refreshedBeta = select.shadowRoot!.querySelector<HTMLElement>('[data-value="B"]')!;
      expect(refreshedBeta.hasAttribute('aria-disabled')).toBe(false);
    });

    it('preserves selected keys while custom options are evicted and remounted', () => {
      select.updateConfig({ selection: { mode: 'multi', closeOnSelect: false } });
      select.optionRenderer = (item: unknown) => {
        const option = document.createElement('div');
        option.textContent = (item as TestItem).label;
        return option;
      };
      const items = makeLargeItems(40);
      setupGuardedRendererList(items);
      clickOption(select, 0);
      const selectedBefore = engineSelectedKeys(select);
      renderWindow(20, 25);
      expect(select.shadowRoot!.querySelector('[data-value="value-0"]')).toBeNull();
      expect(engineSelectedKeys(select)).toEqual(selectedBefore);

      expect((select as any)._materializeGuardedVirtualKey('item-0')).toBe(true);
      expect(select.shadowRoot!.querySelector('[data-value="value-0"]')?.getAttribute('aria-selected')).toBe('true');
      expect(engineSelectedKeys(select)).toEqual(selectedBefore);
    });

    it('preserves active key while its custom option is unmounted', () => {
      select.optionRenderer = (item: unknown) => {
        const option = document.createElement('div');
        option.textContent = (item as TestItem).label;
        return option;
      };
      const scroller = setupGuardedRendererList(makeLargeItems(50));
      select.open();
      (select as any)._setActive(0);
      const activeBefore = engineActiveKey(select);
      scroller.scrollTop = 500;
      runGuardedScheduledUpdate(select);

      expect(engineActiveKey(select)).toBe(activeBefore);
      expect(select.shadowRoot!.querySelector('[data-value="value-0"]')).toBeNull();
      expect(getInput(select).hasAttribute('aria-activedescendant')).toBe(false);
    });

    it('restores active descendant only after the correct custom option remounts', () => {
      select.optionRenderer = (item: unknown) => {
        const option = document.createElement('div');
        option.textContent = (item as TestItem).label;
        return option;
      };
      const scroller = setupGuardedRendererList(makeLargeItems(50));
      select.open();
      (select as any)._setActive(0);
      scroller.scrollTop = 500;
      runGuardedScheduledUpdate(select);
      expect(getInput(select).hasAttribute('aria-activedescendant')).toBe(false);

      expect((select as any)._materializeGuardedVirtualKey('item-0')).toBe(true);
      const option = select.shadowRoot!.querySelector<HTMLElement>('[data-value="value-0"]')!;
      expect(option.textContent).toBe('Option 0');
      expect(getInput(select).getAttribute('aria-activedescendant')).toBe(option.id);
    });

    it('invalidates stale chunk rendering when the custom renderer is replaced', () => {
      const scheduled: Array<() => void> = [];
      select.optionRenderer = (item: unknown) => {
        const option = document.createElement('div');
        option.dataset.renderer = 'old';
        option.textContent = (item as TestItem).label;
        return option;
      };
      const requestFrame = vi.spyOn(select as any, '_requestLifecycleFrame')
        .mockImplementation((callback: () => void) => {
          scheduled.push(callback);
          return 9040 + scheduled.length;
        });
      select.setItems(makeLargeItems(400));
      expect(scheduled.length).toBeGreaterThan(0);
      select.optionRenderer = (item: unknown) => {
        const option = document.createElement('div');
        option.dataset.renderer = 'new';
        option.textContent = (item as TestItem).label;
        return option;
      };
      const currentCount = select.shadowRoot!.querySelectorAll('[data-renderer="new"]').length;

      scheduled[0]();

      expect(select.shadowRoot!.querySelectorAll('[data-renderer="old"]')).toHaveLength(0);
      expect(select.shadowRoot!.querySelectorAll('[data-renderer="new"]')).toHaveLength(currentCount);
      requestFrame.mockRestore();
    });

    it('clears guarded artifacts and pending work during grouped fallback, then allows a fresh flat guard', () => {
      const items = makeLargeItems(30);
      select.optionRenderer = (item: unknown) => {
        const option = document.createElement('div');
        option.textContent = (item as TestItem).label;
        return option;
      };
      const scroller = setupGuardedRendererList(items);
      const requestFrame = vi.spyOn(select as any, '_requestLifecycleFrame').mockReturnValue(9050);
      const cancelFrame = vi.spyOn(window, 'cancelAnimationFrame');
      (select as any)._scheduleGuardedVirtualWindowUpdate();
      select.setGroupedItems([{ label: 'Group', options: items }]);

      expect(cancelFrame).toHaveBeenCalledWith(9050);
      expect(scroller.querySelector('[data-virtual-spacer]')).toBeNull();
      expect(scroller.querySelectorAll('[data-index]')).toHaveLength(30);
      expect((select as any)._guardedVirtualizer).toBeNull();
      expect((select as any)._guardedScrollListenerAttached).toBe(false);

      select.setItems(items);
      renderWindow(0, 5);
      expect((select as any)._guardedVirtualizer).toBeTruthy();
      expect(scroller.querySelector('[data-virtual-spacer]')).toBeTruthy();
      requestFrame.mockRestore();
      cancelFrame.mockRestore();
    });

    it('releases mounted custom option nodes on disconnect and creates fresh nodes on reconnect', () => {
      const observers = mockResizeObservers();
      const renderedNodes: HTMLElement[] = [];
      select.optionRenderer = (item: unknown) => {
        const option = document.createElement('div');
        option.textContent = (item as TestItem).label;
        renderedNodes.push(option);
        return option;
      };
      setupGuardedRendererList(makeLargeItems(30));
      const mountedBeforeDisconnect = Array.from(
        (select as any)._optionsContainer.querySelectorAll<HTMLElement>('[data-index]'),
      );
      const staleObserver = observers[observers.length - 1];

      select.remove();
      expect((select as any)._optionsContainer.querySelector('[data-index]')).toBeNull();
      expect((select as any)._optionsContainer.querySelector('[data-virtual-spacer]')).toBeNull();
      expect(staleObserver.targets.size).toBe(0);
      document.body.appendChild(select);

      const mountedAfterReconnect = Array.from(
        (select as any)._optionsContainer.querySelectorAll<HTMLElement>('[data-index]'),
      );
      expect(mountedBeforeDisconnect.every((node) => !node.isConnected)).toBe(true);
      expect(mountedAfterReconnect.every((node) => !mountedBeforeDisconnect.includes(node))).toBe(true);
      expect(renderedNodes.some((node) => mountedBeforeDisconnect.includes(node))).toBe(true);
      expect(observers[observers.length - 1]).not.toBe(staleObserver);
      staleObserver.emit(mountedBeforeDisconnect[0], 99);
      expect((select as any)._guardedVirtualizer.measuredHeights.size).toBe(0);
    });

    it('settles rapid scroll, filter, and reorder work on the latest rendered keys', () => {
      const scroller = setupGuardedRendererList(makeLargeItems(100));
      scroller.scrollTop = 1200;
      runGuardedScheduledUpdate(select);
      filterTo(select, 'Option 1');
      const filtered = (select as any)._renderPlan.filteredKeys as string[];
      select.setItems([...makeLargeItems(100)].reverse());
      scroller.scrollTop = 0;
      runGuardedScheduledUpdate(select);

      const plan = (select as any)._renderPlan;
      expect(plan.filteredKeys).not.toEqual(filtered);
      expect(plan.intendedRenderKeys.every((key: string) => plan.filteredKeys.includes(key))).toBe(true);
      expect((select as any)._virtualizationScope.mountedKeys).toEqual(plan.intendedRenderKeys);
      for (const option of Array.from(scroller.querySelectorAll<HTMLElement>('[data-index]'))) {
        const index = Number(option.dataset.index);
        expect((select as any)._itemRegistry.indexToKey.get(index)).toBeDefined();
        expect(option.id).toBe(`${(select as any)._uniqueId}-option-${index}`);
      }
    });

    it('keeps a 10,000-item custom renderer mount set bounded by viewport and overscan', () => {
      const observers = mockResizeObservers();
      select.optionRenderer = (item: unknown) => {
        const option = document.createElement('div');
        option.textContent = (item as TestItem).label;
        return option;
      };
      const scroller = setupGuardedRendererList(makeLargeItems(10_000), 100);
      scroller.scrollTop = 80_000;
      runGuardedScheduledUpdate(select);

      expect(scroller.querySelectorAll('[part="option"]').length).toBeLessThanOrEqual(10);
      expect((select as any)._virtualizationScope.mountedKeys.length).toBeLessThanOrEqual(10);
      expect((select as any)._renderPlan.filteredKeys).toHaveLength(10_000);
      expect(observers[observers.length - 1].targets.size).toBe(scroller.querySelectorAll('[part="option"]').length);
      expect(observers.slice(0, -1).every((observer) => observer.targets.size === 0)).toBe(true);
    });

    it('keeps built-in and custom renderers on the full legacy path by default', () => {
      const items = makeLargeItems(8);
      select.setItems(items);
      const scroller = (select as any)._optionsContainer as HTMLElement;
      expect((select as any)._renderPlan.mode).toBe('legacy-full');
      expect((select as any)._guardedOptionResizeObserver).toBeNull();
      expect(scroller.querySelectorAll('[part="option"]')).toHaveLength(items.length);
      expect(scroller.querySelector('[data-virtual-spacer]')).toBeNull();

      select.optionRenderer = (item: unknown) => {
        const option = document.createElement('div');
        option.textContent = `custom:${(item as TestItem).id}`;
        return option;
      };

      expect((select as any)._renderPlan.mode).toBe('legacy-full');
      expect(scroller.querySelectorAll('[part="option"]')).toHaveLength(items.length);
      expect(scroller.querySelector('[part="option"]')?.textContent).toBe('custom:item-0');
      expect(scroller.querySelector('[data-virtual-spacer]')).toBeNull();
    });
  });
});
