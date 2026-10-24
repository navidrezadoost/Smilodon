import { afterEach, describe, expect, it } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select';
import { NativeSelectElement } from '../src/components/native-select';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}
const mounted: HTMLElement[] = [];

function mount<T extends HTMLElement>(tagName: string): T {
  const element = document.createElement(tagName) as T;
  document.body.appendChild(element);
  mounted.push(element);
  return element;
}

afterEach(() => {
  for (const element of mounted.splice(0)) element.remove();
});

describe('Phase 1 environment-sensitive risk characterization', () => {
  it('keeps plain option labels as text but inserts legacy optionTemplate output as markup', () => {
    const payload = '<img data-phase1-probe="markup" src="/local-missing.png" onerror="window.__phase1Probe = true">';

    const enhanced = mount<EnhancedSelect>('enhanced-select');
    enhanced.setItems([{ value: 'unsafe-label', label: payload }]);
    const enhancedOption = enhanced.shadowRoot!.querySelector<HTMLElement>(
      '.options-container [data-index="0"]',
    );
    const optionContent = enhancedOption?.shadowRoot?.querySelector('.option-content');

    expect(enhancedOption).toBeTruthy();
    expect(optionContent?.querySelector('img[data-phase1-probe="markup"]')).toBeNull();
    expect(optionContent?.textContent).toContain(payload);

    const legacy = mount<NativeSelectElement>('smilodon-select');
    legacy.optionTemplate = (item) => `<div>${(item as { label: string }).label}</div>`;
    legacy.setItems([{ value: 'template', label: payload }]);

    const renderedImage = legacy.shadowRoot!.querySelector('img[data-phase1-probe="markup"]');
    expect(renderedImage).toBeTruthy();
    expect(renderedImage?.getAttribute('onerror')).toContain('window.__phase1Probe');
  });

  it('does not submit selection through FormData or forward host aria-labelledby into the shadow input', async () => {
    const form = document.createElement('form');
    const label = document.createElement('label');
    label.id = 'phase1-select-label';
    label.textContent = 'Fruit';
    const element = document.createElement('enhanced-select') as EnhancedSelect;
    element.setAttribute('name', 'fruit');
    element.setAttribute('aria-labelledby', label.id);
    form.append(label, element);
    document.body.appendChild(form);
    mounted.push(form);

    element.setItems([{ value: 'apple', label: 'Apple' }]);
    await element.setSelectedValues(['apple']);

    expect(element.getSelectedValues()).toEqual(['apple']);
    expect(new FormData(form).has('fruit')).toBe(false);
    expect(element.shadowRoot!.querySelector('[part="input"]')?.getAttribute('aria-labelledby')).toBeNull();
  });
});
