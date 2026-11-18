import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

describe('EnhancedSelect custom arrow slot', () => {
  let select: EnhancedSelect;

  beforeEach(() => {
    select = document.createElement('enhanced-select') as EnhancedSelect;
    select.setItems([
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
    ]);
    document.body.appendChild(select);
  });

  afterEach(() => select.remove());

  it('keeps the built-in SVG as the named slot fallback', () => {
    const slot = select.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="arrow"]');
    const arrow = slot?.querySelector<SVGElement>('[part="arrow"]');

    expect(slot).toBeTruthy();
    expect(arrow).toBeTruthy();
    expect(arrow?.getAttribute('aria-hidden')).toBe('true');
  });

  it('marks assigned custom content and clears the marker when removed', () => {
    const slot = select.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="arrow"]')!;
    const icon = document.createElement('span');
    icon.slot = 'arrow';
    icon.textContent = 'chevron';
    select.appendChild(icon);

    slot.dispatchEvent(new Event('slotchange'));
    expect(slot.assignedElements({ flatten: true })).toContain(icon);
    expect(select.getAttribute('data-custom-arrow')).toBe('true');

    icon.remove();
    slot.dispatchEvent(new Event('slotchange'));
    expect(select.hasAttribute('data-custom-arrow')).toBe(false);
  });

  it('keeps the arrow container pointer target working for slotted content', () => {
    const icon = document.createElement('span');
    icon.slot = 'arrow';
    select.appendChild(icon);

    icon.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));

    expect((select as any)._state.isOpen).toBe(true);
  });
});
