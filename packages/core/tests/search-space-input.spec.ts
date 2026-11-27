import { afterEach, describe, expect, it, vi } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

describe('Space in searchable input', () => {
  let select: EnhancedSelect;

  afterEach(() => select?.remove());

  function createSelect(searchable: boolean, mode: 'single' | 'multi' = 'single'): EnhancedSelect {
    select = document.createElement('enhanced-select') as EnhancedSelect;
    select.updateConfig({ searchable, selection: { mode } });
    select.setItems([
      { value: 'north-pharma', label: 'North Pharma' },
      { value: 'north-medical', label: 'North Medical' },
      { value: 'south-pharma', label: 'South Pharma' },
    ]);
    document.body.appendChild(select);
    return select;
  }

  function keydown(key: string, init: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
    (select as any)._input.dispatchEvent(event);
    return event;
  }

  it('does not cancel searchable Space or route it through option selection', () => {
    createSelect(true);
    const selectOption = vi.spyOn(select as any, '_selectOption');
    const selectedValues = select.getSelectedValues();

    const event = keydown(' ');

    expect(event.defaultPrevented).toBe(false);
    expect(selectOption).not.toHaveBeenCalled();
    expect(select.getSelectedValues()).toEqual(selectedValues);
    expect((select as any)._state.isOpen).toBe(false);
  });

  it('preserves non-searchable Space option activation', () => {
    createSelect(false);
    select.open();
    keydown('ArrowDown');

    const event = keydown(' ');

    expect(event.defaultPrevented).toBe(true);
    expect(select.getSelectedValues()).toEqual(['north-pharma']);
  });

  it('preserves Enter option activation in searchable mode', () => {
    createSelect(true);
    select.open();
    keydown('ArrowDown');

    const event = keydown('Enter');

    expect(event.defaultPrevented).toBe(true);
    expect(select.getSelectedValues()).toEqual(['north-pharma']);
  });
});
