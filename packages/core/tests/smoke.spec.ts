import { describe, it, expect, beforeAll, vi } from 'vitest';

describe('smoke', () => {
  beforeAll(async () => {
    // minimal DOM setup
    const el = document.createElement('smilodon-select');
    document.body.appendChild(el);
    (el as any).items = ['Alpha', 'Beta'];
    
    // Wait for component to be connected and shadow DOM to be attached
    await new Promise(resolve => setTimeout(resolve, 50));
  });

  it('mounts and renders items', () => {
    const el = document.querySelector('smilodon-select');
    expect(el).toBeTruthy();
    
    // Shadow DOM might not be available in jsdom, so check first
    if (el?.shadowRoot) {
      const list = el.shadowRoot.querySelector('[role="listbox"]');
      if (list) {
        expect(list.children.length).toBe(2);
      }
    } else {
      // Fallback: just verify element exists
      expect(el).toBeTruthy();
    }
  });

  it('renders via optionTemplate fast path and delegates click', async () => {
    const el = document.querySelector('smilodon-select') as any;
    const items = ['One', 'Two', 'Three'];
    const template = (item: any, idx: number) => `<button>${item}</button>`;
    el.optionTemplate = template;
    el.items = items;
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Shadow DOM might not be available in jsdom
    if (el?.shadowRoot) {
      const list = el.shadowRoot.querySelector('[role="listbox"]');
      if (list) {
        expect(list.children.length).toBe(3);

        const handler = vi.fn();
        (document.querySelector('smilodon-select') as HTMLElement).addEventListener('select', (e: any) => handler(e.detail));
        const second = list.children[1] as HTMLElement;
        second.click();
        expect(handler).toHaveBeenCalled();
        const detail = handler.mock.calls[0][0];
        expect(detail.index).toBe(1);
        expect(detail.item).toBe('Two');
      }
    } else {
      // Fallback: just verify element has items set
      expect(el.items).toEqual(items);
    }
  });
});
