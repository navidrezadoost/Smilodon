import { describe, expect, it } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

describe('Issue #77: hover hit-target geometry', () => {
  it('styles the hover state without moving or resizing option elements', () => {
    const select = document.createElement('enhanced-select') as EnhancedSelect;
    document.body.appendChild(select);
    try {
      const css = [...select.shadowRoot!.querySelectorAll('style')]
        .map((style) => style.textContent ?? '').join('\n');
      const base = css.match(/\.option\s*\{([\s\S]*?)\n\s*\}/)?.[1] ?? '';
      const hover = css.match(/\.option:hover:not\(\.disabled\):not\(\.smilodon-option--disabled\),[\s\S]*?\{([\s\S]*?)\n\s*\}/)?.[1] ?? '';
      const selected = css.match(/\.option\.selected:hover\s*\{([\s\S]*?)\n\s*\}/)?.[1] ?? '';
      expect(base).toContain('box-sizing: border-box');
      expect(hover).toContain('outline: var(--select-option-hover-border, none)');
      expect(hover).toContain('outline-offset: -1px');
      expect(hover).not.toMatch(/(?:^|\n)\s*(?:border|transform|padding|margin|width|height)\s*:/);
      expect(selected).toContain('outline: var(--select-option-selected-hover-border');
      expect(selected).not.toMatch(/(?:^|\n)\s*(?:border|transform|padding|margin|width|height)\s*:/);
      expect(css).toContain('--select-option-hover-transform: none');
    } finally {
      select.remove();
    }
  });

  it('keeps rendered SelectOption host geometry stable in enabled and selected hover states', () => {
    const select = document.createElement('enhanced-select') as EnhancedSelect;
    document.body.appendChild(select);
    try {
      select.setItems([
        { value: 'enabled', label: 'Enabled' },
        { value: 'selected', label: 'Selected' },
      ]);
      const option = select.shadowRoot?.querySelector<HTMLElement>('select-option');
      expect(option?.shadowRoot).toBeTruthy();

      const css = option!.shadowRoot!
        .querySelector('style')?.textContent ?? '';
      const hover = css.match(/:host\(:hover[\s\S]*?\{([\s\S]*?)\n\s*\}/)?.[1] ?? '';
      const selectedHover = css.match(/:host\(\[aria-selected="true"\]:hover\)[\s\S]*?\{([\s\S]*?)\n\s*\}/)?.[1] ?? '';

      expect(hover).toContain('outline: var(--select-option-hover-border, none)');
      expect(hover).toContain('outline-offset: -1px');
      expect(hover).not.toMatch(/(?:^|\n)\s*(?:border|border-bottom|transform)\s*:/);
      expect(selectedHover).toContain('outline: var(--select-option-selected-hover-border');
      expect(selectedHover).toContain('outline-offset: -1px');
      expect(selectedHover).not.toMatch(/(?:^|\n)\s*(?:border|border-bottom|transform)\s*:/);
    } finally {
      select.remove();
    }
  });
});
