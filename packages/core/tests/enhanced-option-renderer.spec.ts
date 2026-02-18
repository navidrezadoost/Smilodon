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

    // Styling hooks: core guarantees both namespaced *and* legacy classes
    expect(first?.classList.contains('smilodon-option')).toBe(true);
    expect(first?.classList.contains('option')).toBe(true);

    first?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(el.getSelectedValues()).toEqual(['a']);
    const refreshedFirst = el.shadowRoot?.querySelector('[data-index="0"]') as HTMLElement | null;
    expect(refreshedFirst?.classList.contains('smilodon-option--selected')).toBe(true);
    expect(refreshedFirst?.classList.contains('selected')).toBe(true);

  // Active styling hook should be reflected when activeIndex changes.
  // Avoid calling private _setActive in tests (it triggers scrollIntoView, which jsdom may not implement).
  (el as any)._state.activeIndex = 0;
  (el as any)._renderOptions();
  const activeFirst = el.shadowRoot?.querySelector('[data-index="0"]') as HTMLElement | null;
  expect(activeFirst?.classList.contains('smilodon-option--active')).toBe(true);
  expect(activeFirst?.classList.contains('active')).toBe(true);

    const second = options?.[1] as HTMLElement | undefined;

    // Disabled styling hooks should be set based on item.disabled
    expect(second?.classList.contains('smilodon-option--disabled')).toBe(true);
    expect(second?.classList.contains('disabled')).toBe(true);

    second?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    // Disabled option should not change selection
    expect(el.getSelectedValues()).toEqual(['a']);
    const refreshedSecond = el.shadowRoot?.querySelector('[data-index="1"]') as HTMLElement | null;
    expect(refreshedSecond?.classList.contains('smilodon-option--selected')).toBe(false);
    expect(refreshedSecond?.classList.contains('selected')).toBe(false);
  });

  it('does not duplicate click handlers when renderer reuses elements across re-renders', async () => {
    const cache = new Map<number, HTMLElement>();
    const renderer = vi.fn((item: any, index: number) => {
      let option = cache.get(index);
      if (!option) {
        option = document.createElement('div');
        cache.set(index, option);
      }
      option.textContent = `cached-${item.label ?? item}`;
      return option;
    });

    const changeSpy = vi.fn();
    el.addEventListener('change', changeSpy);

    el.optionRenderer = renderer;
    el.setItems([{ label: 'Alpha', value: 'a' }]);

    await new Promise((resolve) => setTimeout(resolve, 10));

    (el as any)._renderOptions();
    (el as any)._renderOptions();
    (el as any)._renderOptions();

    const option = el.shadowRoot?.querySelector('[data-index="0"]') as HTMLElement | null;
    option?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(changeSpy).toHaveBeenCalledTimes(1);
    expect(el.getSelectedValues()).toEqual(['a']);
  });

  it('moves active styling to the newly selected option in single-select mode', async () => {
    el.optionRenderer = (item: any) => {
      const div = document.createElement('div');
      div.textContent = String(item.label);
      return div;
    };

    const items = [
      { label: 'Alpha', value: 'a' },
      { label: 'Beta', value: 'b' },
    ];

    el.setItems(items);
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Simulate initial state where first option is selected/active (e.g. after open)
    (el as any)._state.selectedIndices = new Set([0]);
    (el as any)._state.selectedItems = new Map([[0, items[0]]]);
    (el as any)._state.activeIndex = 0;
    (el as any)._renderOptions();

    const second = el.shadowRoot?.querySelector('[data-index="1"]') as HTMLElement | null;
    second?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const firstAfter = el.shadowRoot?.querySelector('[data-index="0"]') as HTMLElement | null;
    const secondAfter = el.shadowRoot?.querySelector('[data-index="1"]') as HTMLElement | null;

    expect(el.getSelectedValues()).toEqual(['b']);
    expect((el as any)._state.activeIndex).toBe(1);
    expect(firstAfter?.classList.contains('active')).toBe(false);
    expect(firstAfter?.classList.contains('smilodon-option--active')).toBe(false);
    expect(secondAfter?.classList.contains('active')).toBe(true);
    expect(secondAfter?.classList.contains('smilodon-option--active')).toBe(true);
  });
});
