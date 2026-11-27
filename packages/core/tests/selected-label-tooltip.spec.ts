import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

describe('selected label tooltip', () => {
  let select: EnhancedSelect;

  beforeEach(() => {
    select = document.createElement('enhanced-select') as EnhancedSelect;
    document.body.appendChild(select);
  });

  afterEach(() => {
    select.remove();
  });

  function setDimensions(element: HTMLElement, clientWidth: number, scrollWidth: number): void {
    Object.defineProperty(element, 'clientWidth', { configurable: true, value: clientWidth });
    Object.defineProperty(element, 'scrollWidth', { configurable: true, value: scrollWidth });
  }

  it('creates one hidden tooltip in the instance shadow root', () => {
    const tooltips = select.shadowRoot!.querySelectorAll('[role="tooltip"]');
    expect(tooltips).toHaveLength(1);
    expect((tooltips[0] as HTMLElement).hidden).toBe(true);
    expect(tooltips[0].id).toBe(`${(select as any)._uniqueId}-selected-label-tooltip`);
  });

  it('shows the selected display label only when the single-select input overflows', async () => {
    const label = 'International Pharmaceutical Distribution Company — Central Branch';
    select.updateConfig({ searchable: false });
    await select.setItems([{ value: 'internal-product-1029', label }]);
    await select.setSelectedValues(['internal-product-1029']);
    const input = select.shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')!;
    const tooltip = select.shadowRoot!.querySelector<HTMLElement>('[role="tooltip"]')!;
    setDimensions(input, 100, 100);
    (select as any)._showSelectedLabelTooltip(input);
    expect(tooltip.hidden).toBe(true);

    setDimensions(input, 100, 220);
    (select as any)._showSelectedLabelTooltip(input);
    expect(tooltip.hidden).toBe(false);
    expect(tooltip.textContent).toBe(label);
    expect(tooltip.textContent).not.toBe('internal-product-1029');
    expect(input.getAttribute('aria-describedby')?.split(/\s+/)).toContain(tooltip.id);
  });

  it('uses the configured display-label resolver instead of the selected value key', async () => {
    const displayLabel = 'Resolved display label for selected record';
    select.updateConfig({
      searchable: false,
      serverSide: { enabled: false, getLabelFromItem: () => displayLabel },
    });
    await select.setItems([{ value: 'opaque-key', label: 'Source field label' }]);
    await select.setSelectedValues(['opaque-key']);
    const input = select.shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')!;
    const tooltip = select.shadowRoot!.querySelector<HTMLElement>('[role="tooltip"]')!;
    input.value = displayLabel;
    setDimensions(input, 70, 260);

    (select as any)._showSelectedLabelTooltip(input);

    expect(tooltip.textContent).toBe(displayLabel);
    expect(tooltip.textContent).not.toBe('opaque-key');
  });

  it('composes and later removes only the tooltip description token', async () => {
    const label = 'A very long selected label that cannot fit in the input';
    select.updateConfig({ searchable: false });
    await select.setItems([{ value: 'long', label }]);
    await select.setSelectedValues(['long']);
    select.setError('Selection needs attention');
    const input = select.shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')!;
    const tooltip = select.shadowRoot!.querySelector<HTMLElement>('[role="tooltip"]')!;
    setDimensions(input, 80, 240);
    (select as any)._showSelectedLabelTooltip(input);
    const describedBy = input.getAttribute('aria-describedby')?.split(/\s+/) ?? [];
    expect(describedBy).toContain(tooltip.id);
    expect(describedBy).toContain((select as any)._errorDescription.id);

    (select as any)._hideSelectedLabelTooltip();
    expect(input.getAttribute('aria-describedby')?.split(/\s+/)).toContain((select as any)._errorDescription.id);
    expect(input.getAttribute('aria-describedby')?.split(/\s+/)).not.toContain(tooltip.id);
  });

  it('suppresses a selected-value tooltip while the input displays a search query', async () => {
    const label = 'A very long selected label that cannot fit in the input';
    select.updateConfig({ searchable: true });
    await select.setItems([{ value: 'long', label }]);
    await select.setSelectedValues(['long']);
    const input = select.shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')!;
    const tooltip = select.shadowRoot!.querySelector<HTMLElement>('[role="tooltip"]')!;
    setDimensions(input, 80, 240);
    input.value = 'searching for another option';
    (select as any)._state.searchQuery = 'searching for another option';

    (select as any)._showSelectedLabelTooltip(input);

    expect(tooltip.hidden).toBe(true);
    expect(input.hasAttribute('aria-describedby')).toBe(false);
  });

  it('makes only truncated chip labels keyboard reachable and uses their display label', async () => {
    const label = 'Northern Regional Distribution Company';
    select.updateConfig({ selection: { mode: 'multi' }, searchable: false });
    await select.setItems([{ value: 'regional-key', label }]);
    await select.setSelectedValues(['regional-key']);
    const badgeLabel = select.shadowRoot!.querySelector<HTMLElement>('.selection-badge-label')!;
    const tooltip = select.shadowRoot!.querySelector<HTMLElement>('[role="tooltip"]')!;
    setDimensions(badgeLabel, 50, 220);
    (select as any)._refreshSelectedLabelTooltipMeasurements();

    expect(badgeLabel.tabIndex).toBe(0);
    (select as any)._showSelectedLabelTooltip(badgeLabel);
    expect(tooltip.hidden).toBe(false);
    expect(tooltip.textContent).toBe(label);
    expect(badgeLabel.getAttribute('aria-describedby')).toContain(tooltip.id);
  });

  it('keeps the remove control outside the tooltip trigger and invalidates removed chips', async () => {
    select.updateConfig({ selection: { mode: 'multi' }, searchable: false });
    await select.setItems([{ value: 'a', label: 'A long selected value which is truncated' }]);
    await select.setSelectedValues(['a']);
    let badgeLabel = select.shadowRoot!.querySelector<HTMLElement>('.selection-badge-label')!;
    const remove = select.shadowRoot!.querySelector<HTMLButtonElement>('.badge-remove')!;
    const tooltip = select.shadowRoot!.querySelector<HTMLElement>('[role="tooltip"]')!;
    setDimensions(badgeLabel, 40, 200);
    (select as any)._showSelectedLabelTooltip(badgeLabel);
    expect((select as any)._selectedLabelTriggerFromTarget(remove)).toBe(null);
    expect(tooltip.hidden).toBe(false);

    await select.clear();
    badgeLabel = select.shadowRoot!.querySelector<HTMLElement>('.selection-badge-label') as HTMLElement;
    expect(badgeLabel).toBe(null);
    expect(tooltip.hidden).toBe(true);
  });

  it('Escape dismisses the tooltip without blurring its input trigger', async () => {
    const label = 'A very long selected label that cannot fit in the input';
    select.updateConfig({ searchable: false });
    await select.setItems([{ value: 'long', label }]);
    await select.setSelectedValues(['long']);
    const input = select.shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')!;
    const tooltip = select.shadowRoot!.querySelector<HTMLElement>('[role="tooltip"]')!;
    setDimensions(input, 60, 220);
    input.focus();
    (select as any)._showSelectedLabelTooltip(input);
    expect(tooltip.hidden).toBe(false);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));

    expect(tooltip.hidden).toBe(true);
    expect(select.shadowRoot!.activeElement).toBe(input);
    expect(select.hasAttribute('data-open')).toBe(true);
  });

  it('clears tooltip references and pending hide work on disconnect', async () => {
    const label = 'A very long selected label that cannot fit in the input';
    select.updateConfig({ searchable: false });
    await select.setItems([{ value: 'long', label }]);
    await select.setSelectedValues(['long']);
    const input = select.shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')!;
    setDimensions(input, 50, 220);
    (select as any)._showSelectedLabelTooltip(input);
    (select as any)._scheduleSelectedLabelTooltipHide();

    select.remove();

    expect((select as any)._selectedLabelTooltip.hidden).toBe(true);
    expect((select as any)._selectedLabelTooltipTrigger).toBe(null);
    expect((select as any)._selectedLabelTooltipHideTimer).toBe(null);
    expect((select as any)._selectedLabelTooltipResizeObserver).toBe(null);
  });
});
