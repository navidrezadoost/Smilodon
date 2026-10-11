import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

type TestItem = { id: string; value: string; label: string; disabled?: boolean };

const makeItems = (): TestItem[] => [
  { id: 'a', value: 'APL', label: 'Apple' },
  { id: 'b', value: 'BAN', label: 'Banana' },
  { id: 'c', value: 'CHR', label: 'Cherry' },
];

function selectedKeys(select: EnhancedSelect): string[] {
  return [...((select as any)._engine.state.selectedKeys as ReadonlySet<string>)];
}

function clickOption(select: EnhancedSelect, index: number): void {
  const option = select.shadowRoot?.querySelector<HTMLElement>(`[data-index="${index}"]`);
  expect(option, `expected option at index ${index}`).toBeTruthy();
  option!.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

describe('EnhancedSelect selection authority', () => {
  let select: EnhancedSelect;

  beforeEach(() => {
    select = document.createElement('enhanced-select') as EnhancedSelect;
    document.body.appendChild(select);
  });

  afterEach(() => {
    select.remove();
  });

  it('updates engine selectedKeys before deriving the single-select legacy snapshot', () => {
    select.setItems(makeItems());
    const engine = (select as any)._engine;
    const originalDispatch = engine.dispatch.bind(engine);
    const stateAtDispatch: Array<{ keys: string[]; indices: number[] }> = [];
    vi.spyOn(engine, 'dispatch').mockImplementation((event: any) => {
      const effects = originalDispatch(event);
      if (event.type === 'SELECT_KEY_REQUEST') {
        stateAtDispatch.push({
          keys: [...engine.state.selectedKeys],
          indices: [...(select as any)._state.selectedIndices],
        });
      }
      return effects;
    });

    clickOption(select, 0);

    expect(stateAtDispatch).toEqual([{ keys: ['a'], indices: [] }]);
    expect((select as any)._state.selectedIndices).toEqual(new Set([0]));
  });

  it('toggles multi-select engine keys and derives the selected indices', () => {
    select.updateConfig({ selection: { mode: 'multi' } });
    select.setItems(makeItems());

    clickOption(select, 0);
    clickOption(select, 2);

    expect(selectedKeys(select)).toEqual(['a', 'c']);
    expect((select as any)._state.selectedIndices).toEqual(new Set([0, 2]));
    clickOption(select, 0);
    expect(selectedKeys(select)).toEqual(['c']);
    expect((select as any)._state.selectedIndices).toEqual(new Set([2]));
  });

  it('clears engine selection and its compatibility snapshots', () => {
    select.setItems(makeItems());
    clickOption(select, 1);

    select.clear();

    expect(selectedKeys(select)).toEqual([]);
    expect((select as any)._state.selectedIndices).toEqual(new Set());
    expect((select as any)._state.selectedItems).toEqual(new Map());
  });

  it('sets engine selection from selected values', async () => {
    select.setItems(makeItems());

    await select.setSelectedValues(['CHR']);

    expect(selectedKeys(select)).toEqual(['c']);
    expect((select as any)._state.selectedIndices).toEqual(new Set([2]));
  });

  it('preserves selected keys across reorder and derives the new index', () => {
    const items = makeItems();
    select.setItems(items);
    clickOption(select, 0);

    select.setItems([items[2], items[0], items[1]]);

    expect(selectedKeys(select)).toEqual(['a']);
    expect((select as any)._state.selectedIndices).toEqual(new Set([1]));
  });

  it('keeps a filtered selection in engine state', () => {
    select.updateConfig({ searchable: true });
    select.setItems(makeItems());
    clickOption(select, 0);
    const input = select.shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')!;

    input.value = 'Banana';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

    expect(selectedKeys(select)).toEqual(['a']);
    expect((select as any)._state.selectedIndices).toEqual(new Set([0]));
  });

  it('preserves a selected key and resolves a replacement item', () => {
    select.setItems([{ id: 'a', value: 'OLD', label: 'Old item' }]);
    clickOption(select, 0);

    select.setItems([{ id: 'a', value: 'NEW', label: 'Replacement item' }]);

    expect(selectedKeys(select)).toEqual(['a']);
    expect((select as any)._state.selectedIndices).toEqual(new Set([0]));
    expect(select.getSelectedValues()).toEqual(['NEW']);
  });

  it('enforces the existing duplicate-key policy', () => {
    select.setItems(makeItems());
    clickOption(select, 0);

    expect(() => select.setItems([
      { id: 'duplicate', value: 'ONE', label: 'One' },
      { id: 'duplicate', value: 'TWO', label: 'Two' },
    ])).toThrow(/duplicate item key/i);
    expect(selectedKeys(select)).toEqual(['a']);
  });

  it('does not treat a mutated legacy snapshot as selection authority', () => {
    select.setItems(makeItems());
    clickOption(select, 0);
    (select as any)._state.selectedIndices.clear();
    (select as any)._state.selectedItems.clear();

    expect(select.getSelectedValues()).toEqual(['APL']);
    expect(selectedKeys(select)).toEqual(['a']);

    clickOption(select, 2);
    expect((select as any)._state.selectedIndices).toEqual(new Set([2]));
    expect(selectedKeys(select)).toEqual(['c']);
  });

  it('keeps change event selectedValues backward-compatible', () => {
    select.setItems(makeItems());
    const changes: unknown[][] = [];
    select.addEventListener('change', (event) => {
      changes.push((event as CustomEvent<{ selectedValues: unknown[] }>).detail.selectedValues);
    });

    clickOption(select, 1);

    expect(changes.at(-1)).toEqual(['BAN']);
  });
});
