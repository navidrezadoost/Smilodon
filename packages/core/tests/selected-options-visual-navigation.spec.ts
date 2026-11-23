import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SelectKey } from '../src/engine/contracts';
import { EnhancedSelect } from '../src/components/enhanced-select';

if (!customElements.get('enhanced-select')) customElements.define('enhanced-select', EnhancedSelect);

type Item = { value: string; label: string; disabled?: boolean };

function activeKey(select: EnhancedSelect): SelectKey | null {
  return (select as any)._engine.state.activeKey;
}

function selectedValues(select: EnhancedSelect): string[] {
  return [...((select as any)._engine.state.selectedKeys as ReadonlySet<SelectKey>)] as string[];
}

function press(select: EnhancedSelect, key: string, options: KeyboardEventInit = {}): void {
  const input = select.shadowRoot?.querySelector<HTMLInputElement>('[part="input"]');
  expect(input).toBeTruthy();
  input!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options }));
}

describe('selected-first visual keyboard navigation', () => {
  let select: EnhancedSelect;

  beforeEach(() => {
    select = document.createElement('enhanced-select') as EnhancedSelect;
    select.updateConfig({ selectedOptions: { placement: 'selected-first' } });
    document.body.appendChild(select);
  });

  afterEach(() => select.remove());

  async function setup(items: Item[], selected: string[] = []): Promise<void> {
    select.updateConfig({ selection: { mode: 'multi' } });
    select.setItems(items);
    if (selected.length > 0) await select.setSelectedValues(selected);
    select.open();
  }

  it('moves Arrow and Page keys by displayed keys rather than source-index arithmetic', async () => {
    await setup(['a', 'b', 'c', 'd', 'e'].map((value) => ({ value, label: value.toUpperCase() })), ['e']);
    expect((select as any)._renderPlan.filteredKeys).toEqual(['e', 'a', 'b', 'c', 'd']);

    press(select, 'ArrowDown');
    expect(activeKey(select)).toBe('a');
    expect((select as any)._state.activeIndex).toBe(0);
    const activeId = select.shadowRoot!.querySelector<HTMLElement>('[data-index="0"]')!.id;
    expect(select.shadowRoot!.querySelector('[part="input"]')?.getAttribute('aria-activedescendant')).toBe(activeId);

    press(select, 'PageDown');
    expect(activeKey(select)).toBe('d');
    press(select, 'PageUp');
    expect(activeKey(select)).toBe('e');
  });

  it('uses visual Home and End boundaries and skips disabled options', async () => {
    await setup([
      { value: 'a', label: 'Apple' },
      { value: 'b', label: 'Banana', disabled: true },
      { value: 'c', label: 'Cherry' },
      { value: 'd', label: 'Date' },
    ], ['d']);

    press(select, 'Home');
    expect(activeKey(select)).toBe('d');
    press(select, 'ArrowDown');
    expect(activeKey(select)).toBe('a');
    press(select, 'ArrowDown');
    expect(activeKey(select)).toBe('c');
    press(select, 'End');
    expect(activeKey(select)).toBe('c');
  });

  it('requests keyboard pagination only at the true visual end', async () => {
    await setup(['a', 'b', 'c', 'd'].map((value) => ({ value, label: value.toUpperCase() })), ['d']);
    const requestLoadMore = vi.spyOn(select as any, '_requestKeyboardLoadMore').mockReturnValue(true);

    press(select, 'ArrowDown');
    expect(activeKey(select)).toBe('a');
    expect(requestLoadMore).not.toHaveBeenCalled();

    press(select, 'End');
    expect(activeKey(select)).toBe('c');
    press(select, 'ArrowDown');
    expect(requestLoadMore).toHaveBeenCalledOnce();
    expect(activeKey(select)).toBe('c');
  });

  it('extends Shift+Arrow range through displayed keys without selecting source-index gaps', async () => {
    await setup(['a', 'b', 'c', 'd', 'e'].map((value) => ({ value, label: value.toUpperCase() })), ['e']);

    press(select, 'ArrowDown', { shiftKey: true });

    expect(activeKey(select)).toBe('a');
    expect(new Set(selectedValues(select))).toEqual(new Set(['e', 'a']));
    expect((select as any)._renderPlan.filteredKeys).toEqual(['e', 'a', 'b', 'c', 'd']);
  });

  it('keeps active and selected stable through a controlled-style rerender', async () => {
    await setup(['a', 'b', 'c', 'd', 'e'].map((value) => ({ value, label: value.toUpperCase() })), ['e']);
    press(select, 'ArrowDown');
    const selectedBefore = selectedValues(select);
    expect(activeKey(select)).toBe('a');

    (select as any)._renderOptions();

    expect(activeKey(select)).toBe('a');
    expect(selectedValues(select)).toEqual(selectedBefore);
    const active = select.shadowRoot!.querySelector<HTMLElement>('[data-index="0"]');
    expect(select.shadowRoot!.querySelector('[part="input"]')?.getAttribute('aria-activedescendant')).toBe(active?.id);
  });

  it('extends Shift+Home and Shift+End over the visual interval', async () => {
    await setup(['a', 'b', 'c', 'd', 'e'].map((value) => ({ value, label: value.toUpperCase() })), ['c']);

    press(select, 'End', { shiftKey: true });
    expect(activeKey(select)).toBe('e');
    expect(new Set(selectedValues(select))).toEqual(new Set(['a', 'b', 'c', 'd', 'e']));

    press(select, 'Home', { shiftKey: true });
    expect(activeKey(select)).toBe('c');
    expect(new Set(selectedValues(select))).toEqual(new Set(['c']));
  });

  it('materializes an off-screen visual destination before publishing active ARIA', async () => {
    await setup(Array.from({ length: 20 }, (_, index) => ({
      value: `item-${index}`,
      label: `Item ${index}`,
    })), ['item-19']);
    const itemHeight = (select as any)._resolveGuardedEstimatedItemHeight() as number;
    (select as any)._updateGuardedVirtualWindow(0, 0);
    (select as any)._renderOptions();
    expect(select.shadowRoot!.querySelector('[data-value="item-19"]')).toBeTruthy();
    expect(select.shadowRoot!.querySelector('[data-value="item-0"]')).toBeNull();

    press(select, 'ArrowDown');

    const target = select.shadowRoot!.querySelector<HTMLElement>('[data-value="item-0"]');
    expect(target).toBeTruthy();
    expect((select as any)._guardedVirtualizer.getCurrentWindow().startIndex).toBeGreaterThan(0);
    expect(activeKey(select)).toBe('item-0');
    expect(select.shadowRoot!.querySelector('[part="input"]')?.getAttribute('aria-activedescendant')).toBe(target!.id);
    expect(itemHeight).toBeGreaterThan(0);
  });

  it('searches type-ahead candidates in displayed order', async () => {
    await setup([
      { value: 'apple', label: 'Apple' },
      { value: 'apricot', label: 'Apricot' },
      { value: 'berry', label: 'Berry' },
    ], ['apricot']);

    press(select, 'a');

    expect((select as any)._renderPlan.filteredKeys).toEqual(['apricot', 'apple', 'berry']);
    expect(activeKey(select)).toBe('apricot');
  });

  it('retains source order when original placement is configured', async () => {
    select.updateConfig({ selectedOptions: { placement: 'original' } });
    await setup(['a', 'b', 'c'].map((value) => ({ value, label: value.toUpperCase() })), ['c']);

    press(select, 'Home');
    press(select, 'ArrowDown');

    expect(activeKey(select)).toBe('b');
    expect((select as any)._renderPlan.filteredKeys).toEqual(['a', 'b', 'c']);
  });
});
