import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

const items = [
  { id: 'a', value: 'APL', label: 'Apple' },
  { id: 'b', value: 'BAN', label: 'Banana' },
];

function getInput(select: EnhancedSelect): HTMLInputElement {
  const input = select.shadowRoot?.querySelector<HTMLInputElement>('[part="input"]');
  expect(input).toBeTruthy();
  return input!;
}

function getListbox(select: EnhancedSelect): HTMLElement {
  const listbox = select.shadowRoot?.querySelector<HTMLElement>('[part="listbox"]');
  expect(listbox).toBeTruthy();
  return listbox!;
}

describe('EnhancedSelect combobox accessibility integration', () => {
  let select: EnhancedSelect;

  beforeEach(() => {
    select = document.createElement('enhanced-select') as EnhancedSelect;
    document.body.appendChild(select);
  });

  afterEach(() => {
    select.remove();
  });

  it('keeps the input role as combobox', () => {
    expect(getInput(select).getAttribute('role')).toBe('combobox');
  });

  it('updates aria-expanded through the accessibility applier when opened', () => {
    select.setItems(items);

    select.open();

    expect(getInput(select).getAttribute('aria-expanded')).toBe('true');
  });

  it('updates aria-expanded through the accessibility applier when closed', () => {
    select.setItems(items);
    select.open();

    select.close();

    expect(getInput(select).getAttribute('aria-expanded')).toBe('false');
  });

  it('maps searchable configuration to aria-autocomplete=list', () => {
    select.updateConfig({ searchable: true });

    expect(getInput(select).getAttribute('aria-autocomplete')).toBe('list');
  });

  it('maps non-searchable configuration to aria-autocomplete=none', () => {
    select.updateConfig({ searchable: true });
    select.updateConfig({ searchable: false });

    expect(getInput(select).getAttribute('aria-autocomplete')).toBe('none');
  });

  it('maps required engine state to aria-required=true', () => {
    select.setRequired(true);

    expect(getInput(select).getAttribute('aria-required')).toBe('true');
  });

  it('maps component validation state to aria-invalid=true', () => {
    select.setError('Choose an option');

    expect(getInput(select).getAttribute('aria-invalid')).toBe('true');
  });

  it('keeps controls id stable and points it at the listbox', () => {
    const input = getInput(select);
    const listbox = select.shadowRoot?.querySelector<HTMLElement>('[part="listbox"]');
    expect(listbox).toBeTruthy();
    const initialControlsId = input.getAttribute('aria-controls');

    select.updateConfig({ searchable: true });

    expect(initialControlsId).toBeTruthy();
    expect(input.getAttribute('aria-controls')).toBe(initialControlsId);
    expect(listbox!.id).toBe(initialControlsId);
  });

  it('does not write empty label or description attributes when none are provided', () => {
    const input = getInput(select);

    expect(input.hasAttribute('aria-labelledby')).toBe(false);
    expect(input.hasAttribute('aria-describedby')).toBe(false);
    expect(input.hasAttribute('aria-label')).toBe(false);
  });

  it('preserves existing public item and value APIs', async () => {
    select.setItems(items);

    await select.setSelectedValues(['BAN']);

    expect(select.getSelectedValues()).toEqual(['BAN']);
  });

  it('keeps the popup role as listbox', () => {
    expect(getListbox(select).getAttribute('role')).toBe('listbox');
  });

  it('maps multi mode to aria-multiselectable=true', () => {
    select.updateConfig({ selection: { mode: 'multi' } });

    expect(getListbox(select).getAttribute('aria-multiselectable')).toBe('true');
  });

  it('removes aria-multiselectable in single mode', () => {
    select.updateConfig({ selection: { mode: 'multi' } });
    select.updateConfig({ selection: { mode: 'single' } });

    expect(getListbox(select).hasAttribute('aria-multiselectable')).toBe(false);
  });

  it('maps busy state to aria-busy=true', () => {
    (select as any)._setBusy(true);

    expect(getListbox(select).getAttribute('aria-busy')).toBe('true');
  });

  it('removes aria-busy when loading ends', () => {
    (select as any)._setBusy(true);
    (select as any)._setBusy(false);

    expect(getListbox(select).hasAttribute('aria-busy')).toBe(false);
  });

  it('keeps a valid non-empty listbox label relationship without empty labels', () => {
    const input = getInput(select);
    const listbox = getListbox(select);

    expect(listbox.getAttribute('aria-labelledby')).toBe(input.id);
    expect(listbox.hasAttribute('aria-label')).toBe(false);
    expect(listbox.getAttribute('aria-labelledby')).not.toBe('');
  });
});
