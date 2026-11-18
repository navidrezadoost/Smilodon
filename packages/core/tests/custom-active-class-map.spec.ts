import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

const items = [
  { id: 'one', value: 'one', label: 'First' },
  { id: 'two', value: 'two', label: 'Dana Pharmaceutical Group' },
  { id: 'three', value: 'three', label: 'Third' },
  { id: 'four', value: 'four', label: 'Tehran Darou' },
];

describe('Issue #82 - custom active class lifecycle', () => {
  let select: EnhancedSelect;
  let cached: Map<string, HTMLElement>;
  const option = (index: number) => {
    const node = select.shadowRoot!.querySelector<HTMLElement>(`[data-index="${index}"]`);
    expect(node).toBeTruthy();
    return node!;
  };
  const down = () => select.shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')!
    .dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));

  beforeEach(() => {
    cached = new Map();
    select = document.createElement('enhanced-select') as EnhancedSelect;
    document.body.appendChild(select);
    select.classMap = { selected: 'custom-selected', active: 'custom-active', disabled: 'custom-disabled' };
    select.optionRenderer = (item) => {
      const record = item as typeof items[number];
      let element = cached.get(record.id);
      if (!element) {
        element = document.createElement('div');
        cached.set(record.id, element);
      }
      element.textContent = record.label;
      return element;
    };
    select.setItems(items);
  });

  afterEach(() => select.remove());

  it('removes all active aliases when navigation changes the active option', () => {
    select.open();
    down();
    down();
    const old = option(1);
    expect(old.classList.contains('custom-active')).toBe(true);
    expect(old.classList.contains('active')).toBe(false);

    down();
    expect(old.classList.contains('custom-active')).toBe(false);
    expect(old.classList.contains('active')).toBe(false);
    expect(old.classList.contains('sm-active')).toBe(false);
    expect(old.classList.contains('smilodon-option--active')).toBe(false);
    expect(old.matches('.option.active')).toBe(false);
    expect(old.dataset.smState?.includes('active') ?? false).toBe(false);
    expect(option(2).classList.contains('custom-active')).toBe(true);
  });

  it('cleans stale built-in classes on cached elements during re-render', () => {
    select.open();
    down();
    down();
    const old = option(1);
    old.classList.add('active', 'sm-active');
    down();
    (select as any)._renderOptions();
    expect(option(1)).toBe(old);
    expect(old.classList.contains('active')).toBe(false);
    expect(old.classList.contains('sm-active')).toBe(false);
    expect(old.classList.contains('custom-active')).toBe(false);
  });

  it('reconciles replaced class maps without retaining former custom classes', () => {
    select.open();
    down();
    const first = option(0);
    expect(first.classList.contains('custom-active')).toBe(true);
    select.classMap = { active: 'new-active second-active' };
    expect(option(0)).toBe(first);
    expect(first.classList.contains('custom-active')).toBe(false);
    expect(first.classList.contains('new-active')).toBe(true);
    expect(first.classList.contains('active')).toBe(false);
    select.classMap = undefined;
    expect(first.classList.contains('new-active')).toBe(false);
    expect(first.classList.contains('second-active')).toBe(false);
    expect(first.classList.contains('active')).toBe(true);
  });

  it('keeps old option inactive after selecting fourth item and reopening', () => {
    select.open();
    down();
    down();
    expect(option(1).classList.contains('custom-active')).toBe(true);
    option(3).dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    expect(select.getSelectedValues()).toEqual(['four']);
    select.open();
    const previous = option(1);
    expect(previous.getAttribute('aria-selected')).toBe('false');
    expect(previous.dataset.smState?.includes('active') ?? false).toBe(false);
    for (const name of ['active', 'sm-active', 'smilodon-option--active', 'custom-active']) {
      expect(previous.classList.contains(name)).toBe(false);
    }
    expect(previous.matches('.option.active')).toBe(false);
    expect(option(3).classList.contains('custom-active')).toBe(true);
    expect(option(3).getAttribute('aria-selected')).toBe('true');
  });
});
