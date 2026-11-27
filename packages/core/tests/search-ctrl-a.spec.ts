import { afterEach, describe, expect, it, vi } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

describe('searchable Ctrl+A', () => {
  let select: EnhancedSelect;

  afterEach(() => select?.remove());

  function createSelect(searchable: boolean, mode: 'single' | 'multi' = 'multi'): EnhancedSelect {
    select = document.createElement('enhanced-select') as EnhancedSelect;
    select.updateConfig({ searchable, selection: { mode } });
    select.setItems([
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'cherry', label: 'Cherry' },
    ]);
    document.body.appendChild(select);
    return select;
  }

  function ctrlA(): KeyboardEvent {
    const event = new KeyboardEvent('keydown', {
      key: 'a',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    (select as any)._handleKeydown(event);
    return event;
  }

  it('does not prevent searchable text selection or invoke select-all', async () => {
    createSelect(true);
    await select.setSelectedValues(['apple', 'banana']);
    (select as any)._state.searchQuery = 'nonexistent-product';
    const selectAll = vi.spyOn(select as any, '_selectAll');
    const selectionChanges: unknown[] = [];
    select.addEventListener('change', (event) => selectionChanges.push((event as CustomEvent).detail));

    const event = ctrlA();

    expect(event.defaultPrevented).toBe(false);
    expect(selectAll).not.toHaveBeenCalled();
    expect(select.getSelectedValues()).toEqual(['apple', 'banana']);
    expect((select as any)._state.searchQuery).toBe('nonexistent-product');
    expect(selectionChanges).toEqual([]);
  });

  it('retains select-all for a non-searchable multi-select', async () => {
    createSelect(false);
    await select.setSelectedValues(['apple']);

    const event = ctrlA();

    expect(event.defaultPrevented).toBe(true);
    expect(select.getSelectedValues()).toEqual(['apple', 'banana', 'cherry']);
  });

  it('clears the no-results context and restores options through the existing empty-query path', async () => {
    createSelect(true);
    const emptyStateChanges: Array<{ context: unknown }> = [];
    select.addEventListener('emptyStateChange', (event) => {
      emptyStateChanges.push((event as CustomEvent<{ context: unknown }>).detail);
    });

    (select as any)._handleSearch('nonexistent-product');
    expect(select.getEmptyStateContext()).toEqual({ query: 'nonexistent-product', reason: 'no-results' });
    expect(select.shadowRoot!.querySelectorAll('[part="option"]')).toHaveLength(0);

    (select as any)._handleSearch('');

    expect((select as any)._state.searchQuery).toBe('');
    expect(select.getEmptyStateContext()).toBeNull();
    expect(select.shadowRoot!.querySelectorAll('[part="option"]')).toHaveLength(3);
    expect(emptyStateChanges.at(-1)).toEqual({ context: null });
  });
});
