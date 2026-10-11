import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SelectKey } from '../src/engine/contracts';
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

function activeKey(select: EnhancedSelect): SelectKey | null {
  return (select as any)._engine.state.activeKey;
}

function activeIndex(select: EnhancedSelect): number {
  return (select as any)._state.activeIndex;
}

function inputElement(select: EnhancedSelect): HTMLInputElement {
  const input = select.shadowRoot?.querySelector<HTMLInputElement>('[part="input"]');
  expect(input).toBeTruthy();
  return input!;
}

function pressKey(select: EnhancedSelect, key: string): void {
  inputElement(select).dispatchEvent(new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
  }));
}

function clickOption(select: EnhancedSelect, index: number): void {
  const option = select.shadowRoot?.querySelector<HTMLElement>(`[data-index="${index}"]`);
  expect(option).toBeTruthy();
  option!.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

function filterTo(select: EnhancedSelect, query: string): void {
  const input = inputElement(select);
  input.value = query;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}

describe('EnhancedSelect active-key authority', () => {
  let select: EnhancedSelect;

  beforeEach(() => {
    select = document.createElement('enhanced-select') as EnhancedSelect;
    document.body.appendChild(select);
  });

  afterEach(() => {
    select.remove();
  });

  it('dispatches ArrowDown to the engine before deriving activeIndex', () => {
    select.setItems(makeItems());
    select.open();
    const engine = (select as any)._engine;
    const originalDispatch = engine.dispatch.bind(engine);
    const stateAtDispatch: Array<{ key: SelectKey | null; index: number }> = [];
    vi.spyOn(engine, 'dispatch').mockImplementation((event: any) => {
      const effects = originalDispatch(event);
      if (event.type === 'ACTIVE_KEY_CHANGED' && event.key === 'b') {
        stateAtDispatch.push({ key: engine.state.activeKey, index: activeIndex(select) });
      }
      return effects;
    });

    pressKey(select, 'ArrowDown');

    expect(stateAtDispatch).toEqual([{ key: 'b', index: 0 }]);
    expect(activeIndex(select)).toBe(1);
  });

  it('dispatches ArrowUp to the engine before deriving activeIndex', () => {
    select.setItems(makeItems());
    select.open();
    pressKey(select, 'ArrowDown');
    const engine = (select as any)._engine;
    const originalDispatch = engine.dispatch.bind(engine);
    const stateAtDispatch: Array<{ key: SelectKey | null; index: number }> = [];
    vi.spyOn(engine, 'dispatch').mockImplementation((event: any) => {
      const effects = originalDispatch(event);
      if (event.type === 'ACTIVE_KEY_CHANGED' && event.key === 'a') {
        stateAtDispatch.push({ key: engine.state.activeKey, index: activeIndex(select) });
      }
      return effects;
    });

    pressKey(select, 'ArrowUp');

    expect(stateAtDispatch).toEqual([{ key: 'a', index: 1 }]);
    expect(activeIndex(select)).toBe(0);
  });

  it('does not activate a disabled option', () => {
    select.setItems([
      { id: 'a', value: 'APL', label: 'Apple' },
      { id: 'b', value: 'BAN', label: 'Banana', disabled: true },
      { id: 'c', value: 'CHR', label: 'Cherry' },
    ]);
    select.open();

    (select as any)._setActive(1, 'keyboard');

    expect(activeKey(select)).toBe('a');
    expect(activeIndex(select)).toBe(0);
  });

  it('clears activeKey when filtering hides the active item', () => {
    select.updateConfig({ searchable: true });
    select.setItems(makeItems());
    select.open();
    pressKey(select, 'ArrowDown');

    filterTo(select, 'Apple');

    expect(activeKey(select)).toBeNull();
    expect(activeIndex(select)).toBe(-1);
    expect(inputElement(select).hasAttribute('aria-activedescendant')).toBe(false);
  });

  it('preserves activeKey when filtering keeps the active item visible', () => {
    select.updateConfig({ searchable: true });
    select.setItems(makeItems());
    select.open();
    pressKey(select, 'ArrowDown');

    filterTo(select, 'Banana');

    expect(activeKey(select)).toBe('b');
    expect(activeIndex(select)).toBe(1);
  });

  it('preserves activeKey across same-key replacement and derives its new index', () => {
    select.setItems(makeItems());
    select.open();
    pressKey(select, 'ArrowDown');

    select.setItems([makeItems()[2], makeItems()[1], makeItems()[0]]);

    expect(activeKey(select)).toBe('b');
    expect(activeIndex(select)).toBe(1);
  });

  it('clears activeKey when replacement removes its key', () => {
    const items = makeItems();
    select.setItems(items);
    select.open();
    pressKey(select, 'ArrowDown');

    select.setItems([items[0], items[2]]);

    expect(activeKey(select)).toBeNull();
    expect(activeIndex(select)).toBe(-1);
  });

  it('keeps aria-activedescendant aligned with engine activeKey', () => {
    select.setItems(makeItems());
    select.open();
    pressKey(select, 'ArrowDown');
    const option = select.shadowRoot!.querySelector<HTMLElement>('[data-index="1"]');

    expect(activeKey(select)).toBe('b');
    expect(inputElement(select).getAttribute('aria-activedescendant')).toBe(option?.id);
  });

  it('updates activeKey through the engine when an option is selected', () => {
    select.updateConfig({ selection: { closeOnSelect: false, mode: 'single' } });
    select.setItems(makeItems());

    clickOption(select, 2);

    expect(activeKey(select)).toBe('c');
    expect(activeIndex(select)).toBe(2);
  });

  it('uses engine activeKey for navigation even if the legacy index is corrupted', () => {
    select.setItems(makeItems());
    select.open();
    pressKey(select, 'ArrowDown');
    expect(activeKey(select)).toBe('b');
    (select as any)._state.activeIndex = -1;

    pressKey(select, 'ArrowDown');

    expect(activeKey(select)).toBe('c');
    expect(activeIndex(select)).toBe(2);

    (select as any)._state.activeIndex = 0;
    pressKey(select, 'Enter');

    expect(activeKey(select)).toBe('c');
    expect([...((select as any)._engine.state.selectedKeys as ReadonlySet<string>)]).toEqual(['c']);
  });
});
