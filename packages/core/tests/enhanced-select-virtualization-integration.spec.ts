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
  });
});
