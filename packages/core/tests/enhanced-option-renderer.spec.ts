import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('EnhancedSelect optionRenderer', () => {
  let el: any;

  beforeEach(async () => {
    el = document.createElement('enhanced-select');
    document.body.appendChild(el);
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

  afterEach(() => {
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });

  it('renders custom option elements and supports selection', async () => {
    const renderer = vi.fn((item: any, _index: number, _helpers: any) => {
      const div = document.createElement('div');
      div.textContent = `custom-${item.label ?? item}`;
      return div;
    });

    el.optionRenderer = renderer;
    el.setItems([
      { label: 'Alpha', value: 'a' },
      { label: 'Beta', value: 'b', disabled: true },
    ]);

    await new Promise((resolve) => setTimeout(resolve, 10));

    const options = el.shadowRoot?.querySelectorAll('[data-index]');
    expect(options?.length).toBe(2);
    expect(renderer).toHaveBeenCalledTimes(2);

    const first = options?.[0] as HTMLElement | undefined;
    expect(first?.textContent).toContain('custom-Alpha');

    first?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(el.getSelectedValues()).toEqual(['a']);
    const refreshedFirst = el.shadowRoot?.querySelector('[data-index="0"]') as HTMLElement | null;
    expect(refreshedFirst?.classList.contains('smilodon-option--selected')).toBe(true);

    const second = options?.[1] as HTMLElement | undefined;
    second?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    // Disabled option should not change selection
    expect(el.getSelectedValues()).toEqual(['a']);
    const refreshedSecond = el.shadowRoot?.querySelector('[data-index="1"]') as HTMLElement | null;
    expect(refreshedSecond?.classList.contains('smilodon-option--selected')).toBe(false);
  });
});
