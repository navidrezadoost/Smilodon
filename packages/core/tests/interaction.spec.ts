import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Interaction & Accessibility', () => {
  let el: any;

  beforeEach(() => {
    el = document.createElement('native-select');
    document.body.appendChild(el);
    el.items = ['Apple', 'Banana', 'Cherry', 'Date'];
  });

  it('navigates with ArrowDown/ArrowUp', () => {
    const list = el.shadowRoot!.querySelector('[role="listbox"]')! as HTMLElement;
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect((el as any)._activeIndex).toBe(0);
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect((el as any)._activeIndex).toBe(1);
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect((el as any)._activeIndex).toBe(0);
  });

  it('selects with Enter key', () => {
    const handler = vi.fn();
    el.addEventListener('select', (e: any) => handler(e.detail));
    const list = el.shadowRoot!.querySelector('[role="listbox"]')! as HTMLElement;
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(handler).toHaveBeenCalled();
    const detail = handler.mock.calls[0][0];
    expect(detail.index).toBe(0);
    expect(detail.item).toBe('Apple');
  });

  it('supports multi-select toggle with Space', () => {
    el.multi = true;
    const list = el.shadowRoot!.querySelector('[role="listbox"]')! as HTMLElement;
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
    const list = el.shadowRoot!.querySelector('[role="listbox"]')! as HTMLElement;
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' }));
    await new Promise((r) => setTimeout(r, 50));
    expect((el as any)._activeIndex).toBe(2); // Cherry
  });

  it('sets ARIA attributes correctly', () => {
    const list = el.shadowRoot!.querySelector('[role="listbox"]')!;
    expect(list.getAttribute('role')).toBe('listbox');
    expect(list.hasAttribute('aria-label')).toBe(true);
    el.multi = true;
    expect(list.getAttribute('aria-multiselectable')).toBe('true');
  });

  it('sets aria-selected on options', () => {
    const list = el.shadowRoot!.querySelector('[role="listbox"]')! as HTMLElement;
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    const option = el.shadowRoot!.querySelector('[data-index="0"]')!;
    expect(option.getAttribute('aria-selected')).toBe('true');
  });
});
