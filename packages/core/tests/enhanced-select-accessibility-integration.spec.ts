import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

function getLiveRegion(select: EnhancedSelect): HTMLElement {
  const liveRegion = select.shadowRoot?.querySelector<HTMLElement>('[role="status"]');
  expect(liveRegion).toBeTruthy();
  return liveRegion!;
}

function getOptionByValue(select: EnhancedSelect, value: string): HTMLElement | null {
  return select.shadowRoot?.querySelector<HTMLElement>(`[part="option"][data-value="${value}"]`) ?? null;
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

  it('applies initial combobox and listbox semantics through the applier', () => {
    const input = getInput(select);
    const listbox = getListbox(select);

    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(input.getAttribute('aria-autocomplete')).toBe('none');
    expect(input.getAttribute('aria-controls')).toBe(listbox.id);
    expect(listbox.getAttribute('role')).toBe('listbox');
    expect(listbox.hasAttribute('aria-labelledby')).toBe(false);
    expect(listbox.hasAttribute('aria-multiselectable')).toBe(false);
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
    const descriptionId = getInput(select).getAttribute('aria-describedby');
    expect(descriptionId).toBeTruthy();
    expect(select.shadowRoot?.getElementById(descriptionId!)?.textContent).toBe('Choose an option');
  });

  it('clears the validation description relationship when error state is cleared', () => {
    select.setError('Choose an option');
    const descriptionId = getInput(select).getAttribute('aria-describedby');

    select.clearError();

    expect(getInput(select).getAttribute('aria-invalid')).toBe('false');
    expect(getInput(select).hasAttribute('aria-describedby')).toBe(false);
    expect(select.shadowRoot?.getElementById(descriptionId!)?.textContent).toBe('');
  });

  it('reflects host accessible-name and description attributes onto the internal combobox', () => {
    const input = getInput(select);
    const listbox = getListbox(select);
    select.setAttribute('aria-label', 'Favorite fruit');
    select.setAttribute('aria-description', 'Choose a fruit for the order.');

    expect(input.getAttribute('aria-label')).toBe('Favorite fruit');
    expect(input.getAttribute('aria-description')).toBe('Choose a fruit for the order.');
    expect(listbox.getAttribute('aria-label')).toBe('Favorite fruit');

    select.setAttribute('aria-label', 'Preferred fruit');
    select.removeAttribute('aria-description');

    expect(input.getAttribute('aria-label')).toBe('Preferred fruit');
    expect(input.hasAttribute('aria-description')).toBe(false);
    expect(listbox.getAttribute('aria-label')).toBe('Preferred fruit');

    select.removeAttribute('aria-label');
    expect(input.hasAttribute('aria-label')).toBe(false);
    expect(listbox.hasAttribute('aria-label')).toBe(false);
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

  it('keeps the live region role as status', () => {
    expect(getLiveRegion(select).getAttribute('role')).toBe('status');
  });

  it('routes announcement messages through the web applier with polite atomic semantics', () => {
    const liveRegion = getLiveRegion(select);

    (select as any)._announce('Announcement via effect');

    expect(liveRegion.textContent).toBe('Announcement via effect');
    expect(liveRegion.getAttribute('aria-live')).toBe('polite');
    expect(liveRegion.getAttribute('aria-atomic')).toBe('true');
  });

  it('preserves the no-results search announcement', () => {
    select.updateConfig({ searchable: true });
    select.setItems(items);
    const input = getInput(select);
    input.value = 'Missing';

    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

    expect(getLiveRegion(select).textContent).toBe('0 results found for "Missing"');
  });

  it('preserves selection announcements and does not add a clear announcement', () => {
    select.setItems(items);

    (select as any)._selectOption(0);

    const liveRegion = getLiveRegion(select);
    expect(liveRegion.textContent).toBe('Selected Apple');
    select.clear();
    expect(select.getSelectedValues()).toEqual([]);
    expect(liveRegion.textContent).toBe('Selected Apple');
  });

  it('keeps focus on the input when the input container is triggered', () => {
    const input = getInput(select);
    const container = select.shadowRoot?.querySelector<HTMLElement>('.input-container');
    expect(container).toBeTruthy();
    const focus = vi.spyOn(input, 'focus');

    container!.dispatchEvent(new MouseEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      button: 0,
    }));

    expect(focus).toHaveBeenCalledTimes(2);
    expect(select.shadowRoot?.activeElement).toBe(input);
  });

  it('returns focus to the input after clear-control activation', async () => {
    select.updateConfig({ clearControl: { enabled: true } });
    select.setItems(items);
    await select.setSelectedValues(['APL']);
    const input = getInput(select);
    const clearButton = select.shadowRoot?.querySelector<HTMLButtonElement>('[part="clear-button"]');
    expect(clearButton).toBeTruthy();
    const focus = vi.spyOn(input, 'focus');

    clearButton!.click();

    expect(focus).toHaveBeenCalledTimes(2);
    expect(select.shadowRoot?.activeElement).toBe(input);
  });

  it('focuses the renderer helper target through explicit focus intent', () => {
    select.setItems(items);
    const option = getOptionByValue(select, 'BAN');
    const otherOption = getOptionByValue(select, 'APL');
    expect(option).toBeTruthy();
    const focus = vi.spyOn(option!, 'focus');
    const otherFocus = vi.spyOn(otherOption!, 'focus');

    (select as any)._buildRendererHelpers().keyboardFocus(1);

    expect(focus).toHaveBeenCalledOnce();
    expect(otherFocus).not.toHaveBeenCalled();
    expect((select as any)._engine.state.activeKey).toBe('b');
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

  it('does not create an ID reference to the internal combobox as a listbox name', () => {
    const listbox = getListbox(select);

    expect(listbox.hasAttribute('aria-labelledby')).toBe(false);
    expect(listbox.hasAttribute('aria-label')).toBe(false);
  });

  it('keeps normal option role=option through the web applier path', async () => {
    select.setItems(items);
    await select.setSelectedValues(['BAN']);

    expect(getOptionByValue(select, 'BAN')?.getAttribute('role')).toBe('option');
  });

  it('applies selected state from engine keys and updates it after deselection', async () => {
    select.setItems(items);
    await select.setSelectedValues(['BAN']);
    expect(getOptionByValue(select, 'BAN')?.getAttribute('aria-selected')).toBe('true');

    await select.setSelectedValues([]);

    expect(getOptionByValue(select, 'BAN')?.getAttribute('aria-selected')).toBe('false');
  });

  it('applies disabled state and removes it from enabled options', () => {
    const disabledItems = [
      { id: 'a', value: 'APL', label: 'Apple', disabled: true },
      items[1],
    ];
    select.setItems(disabledItems);

    expect(getOptionByValue(select, 'APL')?.getAttribute('aria-disabled')).toBe('true');
    expect(getOptionByValue(select, 'BAN')?.hasAttribute('aria-disabled')).toBe(false);
  });

  it('keeps multi-select option ARIA aligned with selectedKeys', async () => {
    select.updateConfig({ selection: { mode: 'multi' } });
    select.setItems(items);
    await select.setSelectedValues(['APL', 'BAN']);
    const selectedKeys = (select as any)._engine.state.selectedKeys as Set<string>;

    expect(selectedKeys).toEqual(new Set(['a', 'b']));
    expect(getOptionByValue(select, 'APL')?.getAttribute('aria-selected')).toBe('true');
    expect(getOptionByValue(select, 'BAN')?.getAttribute('aria-selected')).toBe('true');
  });

  it('preserves selected option ARIA by key after reorder', async () => {
    select.setItems(items);
    await select.setSelectedValues(['BAN']);

    select.setItems([...items].reverse());

    expect(getOptionByValue(select, 'BAN')?.getAttribute('aria-selected')).toBe('true');
    expect(getOptionByValue(select, 'APL')?.getAttribute('aria-selected')).toBe('false');
  });

  it('retains filtered selection by key without applying ARIA to a missing option', async () => {
    select.updateConfig({ searchable: true });
    select.setItems(items);
    await select.setSelectedValues(['BAN']);
    const input = getInput(select);
    input.value = 'Apple';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

    expect((select as any)._engine.state.selectedKeys.has('b')).toBe(true);
    expect(getOptionByValue(select, 'BAN')).toBeNull();
    expect(getOptionByValue(select, 'APL')?.getAttribute('aria-selected')).toBe('false');
  });

  it('applies role, selected, and disabled ARIA to custom renderer hosts', async () => {
    const rendererItems = [
      items[0],
      { id: 'c', value: 'DIS', label: 'Disabled', disabled: true },
    ];
    select.setItems(rendererItems);
    await select.setSelectedValues(['APL']);
    select.optionRenderer = (item: any) => {
      const host = document.createElement('div');
      host.setAttribute('role', 'presentation');
      host.setAttribute('aria-selected', 'false');
      return host;
    };

    const selected = getOptionByValue(select, 'APL');
    const disabled = getOptionByValue(select, 'DIS');
    expect(selected?.getAttribute('role')).toBe('option');
    expect(selected?.getAttribute('aria-selected')).toBe('true');
    expect(disabled?.getAttribute('role')).toBe('option');
    expect(disabled?.getAttribute('aria-disabled')).toBe('true');
  });
});
