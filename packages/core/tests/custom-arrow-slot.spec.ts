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
    // A slot with no directly assigned nodes still contains the fallback SVG.
    // Flattening must not mistake that fallback for a custom arrow.
    expect(slot.assignedElements()).toHaveLength(0);
    expect(select.hasAttribute('data-custom-arrow')).toBe(false);
    expect(slot.querySelector('[part="arrow"]')).toBeTruthy();
  });

  it('respects the public arrow hover background token for custom arrows (#104)', () => {
    const css = [...select.shadowRoot!.querySelectorAll('style')]
      .map((style) => style.textContent ?? '')
      .join('\n');
    const defaultHover = css.match(/\.dropdown-arrow-container:hover\s*\{([^}]*)\}/)?.[1] ?? '';
    const customHover = css.match(/:host\(\[data-custom-arrow="true"\]\)\s*\.dropdown-arrow-container:hover\s*\{([^}]*)\}/)?.[1] ?? '';

    expect(defaultHover).toContain('background-color: var(--select-arrow-hover-bg, rgba(15, 52, 96, 0.05))');
    expect(customHover).toContain('background-color: var(--select-arrow-hover-bg, transparent)');
    expect(customHover).not.toMatch(/background-color:\s*transparent\s*;/);
  });

  it('keeps the arrow container pointer target working for slotted content', () => {
    const icon = document.createElement('span');
    icon.slot = 'arrow';
    select.appendChild(icon);

    icon.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));

    expect((select as any)._state.isOpen).toBe(true);
  });
});
