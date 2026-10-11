import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

type TestItem = { id: string; value: string; label: string };

const makeItems = (): TestItem[] => [
  { id: 'a', value: 'APL', label: 'Apple' },
  { id: 'b', value: 'BAN', label: 'Banana' },
];

function selectedKeys(select: EnhancedSelect): string[] {
  return [...((select as any)._engine.state.selectedKeys as ReadonlySet<string>)];
}

function clickOption(select: EnhancedSelect, index: number): void {
  const option = select.shadowRoot?.querySelector<HTMLElement>(`[data-index="${index}"]`);
  expect(option).toBeTruthy();
  option!.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

describe('EnhancedSelect compatibility projections', () => {
  let select: EnhancedSelect;

  beforeEach(() => {
    select = document.createElement('enhanced-select') as EnhancedSelect;
    document.body.appendChild(select);
  });

  afterEach(() => {
    select.remove();
  });

  it('projects selected keys to current legacy indices and items', () => {
    select.updateConfig({ selection: { mode: 'multi' } });
    select.setItems(makeItems());

    clickOption(select, 0);
    clickOption(select, 1);

    expect((select as any)._state.selectedIndices).toEqual(new Set([0, 1]));
    expect((select as any)._state.selectedItems).toEqual(new Map([[0, makeItems()[0]], [1, makeItems()[1]]]));
  });

  it('projects the engine active key to activeIndex', () => {
    select.setItems(makeItems());
    select.open();
    select.shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );

    expect((select as any)._engine.state.activeKey).toBe('b');
    expect((select as any)._state.activeIndex).toBe(1);
  });

  it('serves selected values and items from the record cache while a selected key is detached', () => {
    select.setItems(makeItems());
    clickOption(select, 0);

    select.setItems([]);

    expect(selectedKeys(select)).toEqual(['a']);
    expect((select as any)._state.selectedIndices).toEqual(new Set());
    expect((select as any)._state.selectedItems).toEqual(new Map());
    expect(select.getSelectedValues()).toEqual(['APL']);
    expect(select.getSelectedItems()).toEqual([makeItems()[0]]);

    select.clear();

    expect(selectedKeys(select)).toEqual([]);
    expect(select.getSelectedValues()).toEqual([]);
  });

  it('refreshes the cached selected record when a detached key returns with a replacement item', () => {
    select.setItems([{ id: 'a', value: 'OLD', label: 'Old item' }]);
    clickOption(select, 0);
    select.setItems([]);

    const replacement = { id: 'a', value: 'NEW', label: 'New item' };
    select.setItems([replacement]);

    expect(selectedKeys(select)).toEqual(['a']);
    expect((select as any)._state.selectedItems).toEqual(new Map([[0, replacement]]));
    expect(select.getSelectedItems()).toEqual([replacement]);
    expect(select.getSelectedValues()).toEqual(['NEW']);
  });

  it('emits compatible change item, value, and index details from engine selection', () => {
    select.setItems(makeItems());
    const changes: Array<{ selectedItems: unknown[]; selectedValues: unknown[]; selectedIndices: number[] }> = [];
    select.addEventListener('change', (event) => {
      changes.push((event as CustomEvent<typeof changes[number]>).detail);
    });

    clickOption(select, 1);

    expect(changes.at(-1)).toEqual({
      selectedItems: [makeItems()[1]],
      selectedValues: ['BAN'],
      selectedIndices: [1],
    });
  });

  it('sets engine keys first and then projects setSelectedValues into legacy snapshots', async () => {
    select.setItems(makeItems());
    (select as any)._state.selectedIndices.add(0);
    (select as any)._state.selectedItems.set(0, { id: 'stale' });

    await select.setSelectedValues(['BAN']);

    expect(selectedKeys(select)).toEqual(['b']);
    expect((select as any)._state.selectedIndices).toEqual(new Set([1]));
    expect((select as any)._state.selectedItems).toEqual(new Map([[1, makeItems()[1]]]));
  });

  it('clears engine selection and both compatibility projections through clear()', () => {
    select.setItems(makeItems());
    clickOption(select, 0);

    select.clear();

    expect(selectedKeys(select)).toEqual([]);
    expect((select as any)._state.selectedIndices).toEqual(new Set());
    expect((select as any)._state.selectedItems).toEqual(new Map());
    expect(select.getSelectedValues()).toEqual([]);
  });

  it('does not use corrupted compatibility snapshots as the source for selected values', () => {
    select.setItems(makeItems());
    clickOption(select, 0);
    (select as any)._state.selectedIndices.clear();
    (select as any)._state.selectedItems.clear();

    expect(select.getSelectedValues()).toEqual(['APL']);
    expect((select as any)._state.selectedIndices).toEqual(new Set([0]));
    expect((select as any)._state.selectedItems).toEqual(new Map([[0, makeItems()[0]]]));
  });
});
