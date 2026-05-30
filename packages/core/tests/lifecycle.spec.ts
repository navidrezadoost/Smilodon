import { describe, it, expect, beforeAll } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select.js';
import { SelectOption } from '../src/components/select-option.js';
import { valuesEqual, arrayIncludesValue, arraysEqualByValue } from '../src/utils/value-equality.js';

describe('value equality', () => {
  it('treats string and number primitives as equal when coercible', () => {
    expect(valuesEqual('1', 1)).toBe(true);
    expect(valuesEqual(1, '1')).toBe(true);
    expect(valuesEqual('GET', 'GET')).toBe(true);
    expect(valuesEqual('1', 2)).toBe(false);
  });

  it('matches arrays with loose equality', () => {
    expect(arraysEqualByValue(['1', '2'], [1, 2])).toBe(true);
    expect(arrayIncludesValue(['GET', 'POST'], 'POST')).toBe(true);
  });
});

describe('custom element lifecycle (Vue/Nuxt compatibility)', () => {
  beforeAll(() => {
    if (!customElements.get('enhanced-select')) {
      customElements.define('enhanced-select', EnhancedSelect);
    }
  });

  it('renders SelectOption content after host connects', async () => {
    const host = document.createElement('div');
    const select = document.createElement('enhanced-select') as EnhancedSelect;

    select.setItems([
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
    ]);

    host.appendChild(select);
    document.body.appendChild(host);

    select.open();

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const options = select.shadowRoot?.querySelectorAll('select-option, [part="option"]');
    expect(options && options.length).toBeGreaterThan(0);

    const optionHost = select.shadowRoot?.querySelector('select-option') as SelectOption | null;
    if (optionHost?.shadowRoot) {
      expect(optionHost.shadowRoot.textContent?.trim()).toContain('Alpha');
    } else {
      const partOption = select.shadowRoot?.querySelector('[part="option"]');
      expect(partOption?.textContent?.trim()).toContain('Alpha');
    }

    document.body.removeChild(host);
  });

  it('syncs direction only after the host is connected', () => {
    const select = document.createElement('enhanced-select') as EnhancedSelect;

    select.updateConfig({ direction: 'rtl' });
    expect(select.hasAttribute('dir')).toBe(false);

    document.body.appendChild(select);
    expect(select.getAttribute('dir')).toBe('rtl');

    document.body.removeChild(select);
  });

  it('selects values with loose string/number equality', async () => {
    const select = document.createElement('enhanced-select') as EnhancedSelect;
    document.body.appendChild(select);

    select.setItems([
      { value: 1, label: 'One' },
      { value: 2, label: 'Two' },
    ]);

    await select.setSelectedValues(['1']);

    expect(select.getSelectedValues()).toEqual([1]);

    document.body.removeChild(select);
  });
});
