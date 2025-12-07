import { describe, it, expect, beforeAll, vi } from 'vitest';

describe('smoke', () => {
  beforeAll(() => {
    // minimal DOM setup
    const el = document.createElement('native-select');
    document.body.appendChild(el);
    (el as any).items = ['Alpha', 'Beta'];
  });

  it('mounts and renders items', () => {
    const list = document.querySelector('native-select')!.shadowRoot!.querySelector('[role="listbox"]')!;
    expect(list.children.length).toBe(2);
  });

  it('renders via optionTemplate fast path and delegates click', () => {
    const el = document.querySelector('native-select') as any;
    const items = ['One', 'Two', 'Three'];
    const template = (item: any, idx: number) => `<button>${item}</button>`;
    el.optionTemplate = template;
    el.items = items;
    const list = document.querySelector('native-select')!.shadowRoot!.querySelector('[role="listbox"]')! as HTMLElement;
    expect(list.children.length).toBe(3);

    const handler = vi.fn();
    (document.querySelector('native-select') as HTMLElement).addEventListener('select', (e: any) => handler(e.detail));
    const second = list.children[1] as HTMLElement;
    second.click();
    expect(handler).toHaveBeenCalled();
    const detail = handler.mock.calls[0][0];
    expect(detail.index).toBe(1);
    expect(detail.item).toBe('Two');
  });
});
