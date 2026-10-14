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

    select.setGroupedItems([{ label: 'Fruit', options: groupedItems }]);

    expect(select.shadowRoot!.querySelectorAll('[part="option"]')).toHaveLength(3);
    expect(select.shadowRoot!.querySelector('[part="group-header"]')?.textContent).toBe('Fruit');
    expect((select as any)._renderPlan.intendedRenderKeys).toEqual(['a', 'b', 'c']);
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
