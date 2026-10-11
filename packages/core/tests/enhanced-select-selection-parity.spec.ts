import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { SelectKey } from '../src/engine/contracts';
import { EnhancedSelect } from '../src/components/enhanced-select';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

type TestItem = {
  id: string;
  value: string;
  label: string;
  disabled?: boolean;
};

const makeItems = (): TestItem[] => [
  { id: 'a', value: 'APL', label: 'Apple' },
  { id: 'b', value: 'BAN', label: 'Banana' },
  { id: 'c', value: 'CHR', label: 'Cherry' },
];

function engineSelectedKeys(select: EnhancedSelect): SelectKey[] {
  return [...((select as any)._engine.state.selectedKeys as ReadonlySet<SelectKey>)];
}

function clickOption(select: EnhancedSelect, index: number): void {
  const option = select.shadowRoot?.querySelector<HTMLElement>(`[data-index="${index}"]`);
  expect(option, `expected option at index ${index}`).toBeTruthy();
  option!.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

function dispatchKey(select: EnhancedSelect, key: string, options: KeyboardEventInit = {}): void {
  const input = select.shadowRoot?.querySelector<HTMLInputElement>('[part="input"]');
  expect(input).toBeTruthy();
  input!.dispatchEvent(new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  }));
}

describe('EnhancedSelect selection shadow parity', () => {
  let select: EnhancedSelect;

  beforeEach(() => {
    select = document.createElement('enhanced-select') as EnhancedSelect;
    document.body.appendChild(select);
  });

  afterEach(() => {
    select.remove();
  });

  it('mirrors single pointer selection while legacy indices remain populated', () => {
    select.setItems(makeItems());

    clickOption(select, 0);

    expect((select as any)._state.selectedIndices).toEqual(new Set([0]));
    expect(select.getSelectedValues()).toEqual(['APL']);
    expect(engineSelectedKeys(select)).toEqual(['a']);
  });

  it('mirrors multiple pointer selections by key', () => {
    select.updateConfig({ selection: { mode: 'multi' } });
    select.setItems(makeItems());

    clickOption(select, 0);
    clickOption(select, 2);

    expect((select as any)._state.selectedIndices).toEqual(new Set([0, 2]));
    expect(engineSelectedKeys(select)).toEqual(['a', 'c']);
  });

  it('mirrors multi-select deselection by key', () => {
    select.updateConfig({ selection: { mode: 'multi' } });
    select.setItems(makeItems());
    clickOption(select, 1);

    clickOption(select, 1);

    expect((select as any)._state.selectedIndices.size).toBe(0);
    expect(engineSelectedKeys(select)).toEqual([]);
  });

  it('mirrors clearing to an empty key set', () => {
    select.setItems(makeItems());
    clickOption(select, 0);

    select.clear();

    expect((select as any)._state.selectedIndices.size).toBe(0);
    expect(engineSelectedKeys(select)).toEqual([]);
  });

  it('mirrors clear-control clicks through the shared clear path', () => {
    select.updateConfig({ clearControl: { enabled: true, hideWhenEmpty: false } });
    select.setItems(makeItems());
    clickOption(select, 0);
    const clearButton = select.shadowRoot!.querySelector<HTMLButtonElement>('.clear-control-button');
    expect(clearButton).toBeTruthy();

    clearButton!.click();

    expect((select as any)._state.selectedIndices.size).toBe(0);
    expect(engineSelectedKeys(select)).toEqual([]);
  });

  it('keeps selection parity when mode reconciliation reduces multi-selection', () => {
    select.updateConfig({
      limitations: { autoMitigateRuntimeModeSwitch: false, policies: {} },
      selection: { mode: 'multi' },
    });
    select.setItems(makeItems());
    clickOption(select, 0);
    clickOption(select, 2);

    select.updateConfig({ selection: { mode: 'single' } });

    expect((select as any)._state.selectedIndices).toEqual(new Set([0]));
    expect(engineSelectedKeys(select)).toEqual(['a']);
  });

  it('preserves selected key parity when items are regrouped', () => {
    const items = makeItems();
    select.setItems(items);
    clickOption(select, 0);

    select.setGroupedItems([{ label: 'Fruit', options: items }]);

    expect((select as any)._state.selectedIndices).toEqual(new Set([0]));
    expect(engineSelectedKeys(select)).toEqual(['a']);
    expect(select.getSelectedValues()).toEqual(['APL']);
  });

  it('keeps the last required selection mirrored when clear is requested', () => {
    select.setItems(makeItems());
    clickOption(select, 0);
    select.setRequired(true);

    select.clear();

    expect((select as any)._state.selectedIndices).toEqual(new Set([0]));
    expect(engineSelectedKeys(select)).toEqual(['a']);
  });

  it('mirrors programmatic setSelectedValues by item key', async () => {
    select.setItems(makeItems());

    await select.setSelectedValues(['CHR']);

    expect(select.getSelectedValues()).toEqual(['CHR']);
    expect((select as any)._state.selectedIndices).toEqual(new Set([2]));
    expect(engineSelectedKeys(select)).toEqual(['c']);
  });

  it('mirrors server-fetched selected values by key when the item is not registered', async () => {
    const remoteItem = { id: 'remote', value: 'REMOTE', label: 'Remote item' };
    select.updateConfig({
      serverSide: {
        enabled: true,
        fetchSelectedItems: async (values) => values.includes('REMOTE') ? [remoteItem] : [],
      },
    });

    await select.setSelectedValues(['REMOTE']);

    expect(engineSelectedKeys(select)).toEqual(['remote']);
    expect((select as any)._state.selectedIndices).toEqual(new Set());
    expect(select.getSelectedValues()).toEqual(['REMOTE']);
  });

  it('mirrors initial server-selected items by key', async () => {
    const remoteItem = { id: 'initial-remote', value: 'INITIAL', label: 'Initial remote item' };
    select.updateConfig({
      serverSide: {
        enabled: true,
        initialSelectedValues: ['INITIAL'],
        fetchSelectedItems: async () => [remoteItem],
      },
    });

    await (select as any)._loadInitialSelectedItems();

    expect(engineSelectedKeys(select)).toEqual(['initial-remote']);
    expect((select as any)._state.selectedIndices).toEqual(new Set());
    expect(select.getSelectedValues()).toEqual(['INITIAL']);
  });

  it('does not mirror a disabled option into selectedKeys', () => {
    select.setItems([
      { id: 'blocked', value: 'BLK', label: 'Blocked', disabled: true },
      { id: 'enabled', value: 'OK', label: 'Enabled' },
    ]);

    clickOption(select, 0);

    expect((select as any)._state.selectedIndices.size).toBe(0);
    expect(engineSelectedKeys(select)).toEqual([]);
  });

  it('preserves a selected key when search filters its item out of view', () => {
    select.updateConfig({ searchable: true });
    select.setItems(makeItems());
    clickOption(select, 0);
    const input = select.shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')!;

    input.value = 'Banana';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

    expect((select as any)._state.searchQuery).toBe('Banana');
    expect(select.getAttribute('data-open')).toBe('true');
    const visibleOptions = Array.from(select.shadowRoot!.querySelectorAll<HTMLElement>('[data-index]'));
    expect(visibleOptions.map((option) => option.getAttribute('data-value'))).toEqual(['BAN']);
    expect(engineSelectedKeys(select)).toEqual(['a']);
    expect((select as any)._state.selectedIndices).toEqual(new Set([0]));
  });

  it('preserves selected keys across item reorder', () => {
    const items = makeItems();
    select.setItems(items);
    clickOption(select, 0);

    select.setItems([items[2], items[0], items[1]]);

    expect(engineSelectedKeys(select)).toEqual(['a']);
    expect((select as any)._state.selectedIndices).toEqual(new Set([1]));
    expect(select.getSelectedValues()).toEqual(['APL']);
  });

  it('preserves a selected key and resolves its replacement item', () => {
    select.setItems([{ id: 'a', value: 'OLD', label: 'Old item' }]);
    clickOption(select, 0);

    select.setItems([{ id: 'a', value: 'NEW', label: 'Replacement item' }]);

    expect(engineSelectedKeys(select)).toEqual(['a']);
    expect(select.getSelectedValues()).toEqual(['NEW']);
    expect(select.getSelectedItems()).toEqual([{ id: 'a', value: 'NEW', label: 'Replacement item' }]);
  });

  it('rejects duplicate keys without changing the existing selection', () => {
    select.setItems(makeItems());
    clickOption(select, 0);

    expect(() => select.setItems([
      { id: 'duplicate', value: 'ONE', label: 'One' },
      { id: 'duplicate', value: 'TWO', label: 'Two' },
    ])).toThrow(/duplicate item key/i);

    expect(engineSelectedKeys(select)).toEqual(['a']);
    expect(select.getSelectedValues()).toEqual(['APL']);
  });

  it('mirrors keyboard range selection', () => {
    select.updateConfig({ selection: { mode: 'multi' } });
    select.setItems(makeItems());
    clickOption(select, 0);
    select.open();

    dispatchKey(select, 'ArrowDown', { shiftKey: true });

    expect((select as any)._state.selectedIndices).toEqual(new Set([0, 1]));
    expect(engineSelectedKeys(select)).toEqual(['a', 'b']);
  });

  it('mirrors select-all while excluding disabled options', () => {
    select.updateConfig({ selection: { mode: 'multi' } });
    select.setItems([
      { id: 'a', value: 'APL', label: 'Apple' },
      { id: 'b', value: 'BAN', label: 'Banana', disabled: true },
      { id: 'c', value: 'CHR', label: 'Cherry' },
    ]);

    dispatchKey(select, 'a', { ctrlKey: true });

    expect(engineSelectedKeys(select)).toEqual(['a', 'c']);
    expect((select as any)._state.selectedIndices).toEqual(new Set([0, 2]));
  });

  it('mirrors selected-item removal by key', () => {
    select.updateConfig({ selection: { mode: 'multi' } });
    select.setItems(makeItems());
    clickOption(select, 0);

    (select as any)._handleOptionRemove(0);

    expect((select as any)._state.selectedIndices.size).toBe(0);
    expect(engineSelectedKeys(select)).toEqual([]);
  });
});
