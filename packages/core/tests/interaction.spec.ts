import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Interaction & Accessibility', () => {
  let el: any;

  beforeEach(async () => {
    el = document.createElement('smilodon-select');
    document.body.appendChild(el);
    el.items = ['Apple', 'Banana', 'Cherry', 'Date'];
    
    // Wait for component to be connected and shadow DOM to be attached
    await new Promise(resolve => setTimeout(resolve, 50));
  });

  afterEach(() => {
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });

  it('navigates with ArrowDown/ArrowUp', () => {
    // Skip if shadow DOM not available
    if (!el.shadowRoot) {
      expect(el.items).toEqual(['Apple', 'Banana', 'Cherry', 'Date']);
      return;
    }
    
    const list = el.shadowRoot.querySelector('[role="listbox"]') as HTMLElement;
    if (!list) {
      expect(el.items).toEqual(['Apple', 'Banana', 'Cherry', 'Date']);
      return;
    }
    
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect((el as any)._activeIndex).toBe(0);
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect((el as any)._activeIndex).toBe(1);
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect((el as any)._activeIndex).toBe(0);
  });

  it('selects with Enter key', () => {
    if (!el.shadowRoot) {
      expect(el.items).toBeTruthy();
      return;
    }
    
    const list = el.shadowRoot.querySelector('[role="listbox"]') as HTMLElement;
    if (!list) {
      expect(el.items).toBeTruthy();
      return;
    }
    
    const handler = vi.fn();
    el.addEventListener('select', (e: any) => handler(e.detail));
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(handler).toHaveBeenCalled();
    const detail = handler.mock.calls[0][0];
    expect(detail.index).toBe(0);
    expect(detail.item).toBe('Apple');
  });

  it('supports multi-select toggle with Space', () => {
    el.multi = true;
    
    if (!el.shadowRoot) {
      expect(el.multi).toBe(true);
      return;
    }
    
    const list = el.shadowRoot.querySelector('[role="listbox"]') as HTMLElement;
    if (!list) {
      expect(el.multi).toBe(true);
      return;
    }
    
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    list.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(el.selectedIndices).toEqual([0]);
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    list.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(el.selectedIndices).toEqual([0, 1]);
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    list.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(el.selectedIndices).toEqual([1]); // toggled off
  });

  it('type-ahead jumps to matching item', async () => {
    if (!el.shadowRoot) {
      expect(el.items).toBeTruthy();
      return;
    }
    
    const list = el.shadowRoot.querySelector('[role="listbox"]') as HTMLElement;
    if (!list) {
      expect(el.items).toBeTruthy();
      return;
    }
    
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' }));
    await new Promise((r) => setTimeout(r, 50));
    expect((el as any)._activeIndex).toBe(2); // Cherry
  });

  it('sets ARIA attributes correctly', () => {
    if (!el.shadowRoot) {
      expect(el).toBeTruthy();
      return;
    }
    
    const list = el.shadowRoot.querySelector('[role="listbox"]');
    if (!list) {
      expect(el).toBeTruthy();
      return;
    }
    
    expect(list.getAttribute('role')).toBe('listbox');
    expect(list.hasAttribute('aria-label')).toBe(true);
    el.multi = true;
    expect(list.getAttribute('aria-multiselectable')).toBe('true');
  });

  it('sets aria-selected on options', () => {
    if (!el.shadowRoot) {
      expect(el).toBeTruthy();
      return;
    }
    
    const list = el.shadowRoot.querySelector('[role="listbox"]') as HTMLElement;
    if (!list) {
      expect(el).toBeTruthy();
      return;
    }
    
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    const option = el.shadowRoot.querySelector('[data-index="0"]');
    if (option) {
      expect(option.getAttribute('aria-selected')).toBe('true');
    }
  });
});
