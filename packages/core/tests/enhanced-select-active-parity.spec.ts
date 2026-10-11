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

function engineActiveKey(select: EnhancedSelect): SelectKey | null {
  return (select as any)._engine.state.activeKey;
}

function engineSelectedKeys(select: EnhancedSelect): SelectKey[] {
  return [...((select as any)._engine.state.selectedKeys as ReadonlySet<SelectKey>)];
}

function activeIndex(select: EnhancedSelect): number {
  return (select as any)._state.activeIndex;
}

function inputElement(select: EnhancedSelect): HTMLInputElement {
  const input = select.shadowRoot?.querySelector<HTMLInputElement>('[part="input"]');
  expect(input).toBeTruthy();
  return input!;
}

function pressKey(select: EnhancedSelect, key: string, options: KeyboardEventInit = {}): void {
  inputElement(select).dispatchEvent(new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
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

describe('EnhancedSelect active-key shadow parity', () => {
  let select: EnhancedSelect;

  beforeEach(() => {
    select = document.createElement('enhanced-select') as EnhancedSelect;
    document.body.appendChild(select);
  });

  afterEach(() => {
    select.remove();
  });

  it('sets activeKey consistently with activeIndex when opening', () => {
    select.setItems(makeItems());

    select.open();

    expect(activeIndex(select)).toBe(0);
    expect(engineActiveKey(select)).toBe('a');
  });

  it('mirrors ArrowDown navigation to activeKey', () => {
    select.setItems(makeItems());
    select.open();

    pressKey(select, 'ArrowDown');

    expect(activeIndex(select)).toBe(1);
    expect(engineActiveKey(select)).toBe('b');
  });

  it('mirrors ArrowUp navigation to activeKey', () => {
    select.setItems(makeItems());
    select.open();
    pressKey(select, 'ArrowDown');

    pressKey(select, 'ArrowUp');

    expect(activeIndex(select)).toBe(0);
    expect(engineActiveKey(select)).toBe('a');
  });

  it('mirrors type-ahead activation to activeKey', () => {
    select.setItems(makeItems());

    pressKey(select, 'c');

    expect(activeIndex(select)).toBe(2);
    expect(engineActiveKey(select)).toBe('c');
  });

  it('mirrors renderer keyboardFocus helper activation to activeKey', () => {
    select.setItems(makeItems());
    select.open();

    (select as any)._rendererHelpers.keyboardFocus(2);

    expect(activeIndex(select)).toBe(2);
    expect(engineActiveKey(select)).toBe('c');
    expect(inputElement(select).getAttribute('aria-activedescendant'))
      .toBe(select.shadowRoot!.querySelector<HTMLElement>('[data-index="2"]')?.id);
  });

  it('mirrors scroll-to-selected activation to activeKey', async () => {
    select.setItems(makeItems());
    await select.setSelectedValues(['CHR']);
    select.open();
    pressKey(select, 'ArrowUp');
    expect(engineActiveKey(select)).toBe('b');

    (select as any)._scrollToSelected();

    expect(activeIndex(select)).toBe(2);
    expect(engineActiveKey(select)).toBe('c');
  });

  it('mirrors pointer selection to activeKey', () => {
    select.updateConfig({ selection: { closeOnSelect: false, mode: 'single' } });
    select.setItems(makeItems());

    clickOption(select, 2);

    expect(activeIndex(select)).toBe(2);
    expect(engineActiveKey(select)).toBe('c');
  });

  it('keeps activeKey aligned when Enter selects the active option', () => {
    select.setItems(makeItems());
    select.open();
    pressKey(select, 'ArrowDown');

    pressKey(select, 'Enter');

    expect(activeIndex(select)).toBe(1);
    expect(engineActiveKey(select)).toBe('b');
  });

  it('keeps selection and active parity aligned through open, navigate, select, filter, replace, and clear', () => {
    select.updateConfig({
      searchable: true,
      selection: { closeOnSelect: false, mode: 'single' },
    });
    const items = makeItems();
    select.setItems(items);
    select.open();

    pressKey(select, 'ArrowDown');
    expect(engineActiveKey(select)).toBe('b');

    pressKey(select, 'Enter');
    expect(engineSelectedKeys(select)).toEqual(['b']);
    expect(engineActiveKey(select)).toBe('b');
    expect((select as any)._state.selectedIndices).toEqual(new Set([1]));

    filterTo(select, 'Banana');
    expect(engineSelectedKeys(select)).toEqual(['b']);
    expect(engineActiveKey(select)).toBe('b');

    select.setItems([
      { id: 'b', value: 'BAN-NEW', label: 'New Banana' },
      items[0],
      items[2],
    ]);
    expect(engineSelectedKeys(select)).toEqual(['b']);
    expect(engineActiveKey(select)).toBe('b');
    expect((select as any)._state.selectedIndices).toEqual(new Set([0]));

    select.clear();
    expect(engineSelectedKeys(select)).toEqual([]);
    expect(engineActiveKey(select)).toBe('b');
    expect((select as any)._state.selectedIndices.size).toBe(0);
    expect(activeIndex(select)).toBe(0);
  });

  it('skips disabled options and rejects direct activation of one', () => {
    select.setItems([
      { id: 'a', value: 'APL', label: 'Apple' },
      { id: 'b', value: 'BAN', label: 'Banana', disabled: true },
      { id: 'c', value: 'CHR', label: 'Cherry' },
    ]);
    select.open();

    pressKey(select, 'ArrowDown');
    (select as any)._setActive(1, 'keyboard');

    expect(activeIndex(select)).toBe(2);
    expect(engineActiveKey(select)).toBe('c');
  });

  it('retains active parity when required selection configuration is synchronized', () => {
    select.setItems(makeItems());
    select.open();
    pressKey(select, 'ArrowDown');

    select.setRequired(true);

    expect(activeIndex(select)).toBe(1);
    expect(engineActiveKey(select)).toBe('b');
    expect(inputElement(select).getAttribute('aria-activedescendant'))
      .toBe(select.shadowRoot!.querySelector<HTMLElement>('[data-index="1"]')?.id);
  });

  it('clears activeKey and aria-activedescendant when filtering hides the active item', () => {
    select.updateConfig({ searchable: true });
    select.setItems(makeItems());
    select.open();
    pressKey(select, 'ArrowDown');
    expect(engineActiveKey(select)).toBe('b');

    filterTo(select, 'Apple');

    expect(activeIndex(select)).toBe(-1);
    expect(engineActiveKey(select)).toBeNull();
    expect(inputElement(select).hasAttribute('aria-activedescendant')).toBe(false);
  });

  it('preserves activeKey when filtering keeps the active item visible', () => {
    select.updateConfig({ searchable: true });
    select.setItems(makeItems());
    select.open();
    pressKey(select, 'ArrowDown');

    filterTo(select, 'Banana');

    expect(activeIndex(select)).toBe(1);
    expect(engineActiveKey(select)).toBe('b');
    expect(inputElement(select).getAttribute('aria-activedescendant'))
      .toBe(select.shadowRoot!.querySelector<HTMLElement>('[data-index="1"]')?.id);
  });

  it('preserves activeKey when a replacement item has the same enabled key', () => {
    select.setItems(makeItems());
    select.open();
    pressKey(select, 'ArrowDown');

    select.setItems([
      makeItems()[0],
      { id: 'b', value: 'BAN-NEW', label: 'New Banana' },
      makeItems()[2],
    ]);

    expect(activeIndex(select)).toBe(1);
    expect(engineActiveKey(select)).toBe('b');
  });

  it('clears activeKey when its item key disappears on replacement', () => {
    const items = makeItems();
    select.setItems(items);
    select.open();
    pressKey(select, 'ArrowDown');

    select.setItems([items[0], items[2]]);

    expect(activeIndex(select)).toBe(-1);
    expect(engineActiveKey(select)).toBeNull();
    expect(inputElement(select).hasAttribute('aria-activedescendant')).toBe(false);
  });

  it('points aria-activedescendant at the active option id', () => {
    select.setItems(makeItems());
    select.open();
    pressKey(select, 'ArrowDown');
    const activeOption = select.shadowRoot!.querySelector<HTMLElement>('[data-index="1"]');

    expect(activeOption?.id).toBeTruthy();
    expect(engineActiveKey(select)).toBe('b');
    expect(inputElement(select).getAttribute('aria-activedescendant')).toBe(activeOption?.id);
  });

  it('clears aria-activedescendant when registration becomes empty', () => {
    select.setItems(makeItems());
    select.open();
    expect(inputElement(select).hasAttribute('aria-activedescendant')).toBe(true);

    select.setItems([]);

    expect(activeIndex(select)).toBe(-1);
    expect(engineActiveKey(select)).toBeNull();
    expect(inputElement(select).hasAttribute('aria-activedescendant')).toBe(false);
  });
});