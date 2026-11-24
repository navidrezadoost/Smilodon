import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  configureSelect,
  resetSelectConfig,
  selectConfig,
  validateScrollToSelectedConfig,
  validateSelectedOptionsConfig,
} from '../src/index';
import { EnhancedSelect } from '../src/components/enhanced-select';

if (!customElements.get('enhanced-select')) customElements.define('enhanced-select', EnhancedSelect);

describe('selected-options public Core configuration (E3.1)', () => {
  let select: EnhancedSelect;

  beforeEach(() => {
    resetSelectConfig();
    select = document.createElement('enhanced-select') as EnhancedSelect;
    document.body.appendChild(select);
  });

  afterEach(() => {
    select.remove();
    resetSelectConfig();
  });

  it('defines backward-compatible defaults and restores them on reset', () => {
    expect(selectConfig.getConfig().selectedOptions).toEqual({
      placement: 'original',
      groupedPlacement: 'within-group',
    });
    expect(selectConfig.getConfig().scrollToSelected).toEqual({
      enabled: true,
      multiSelectTarget: 'first',
      onOpen: 'reveal',
      behavior: 'smooth',
      block: 'nearest',
    });

    configureSelect({
      selectedOptions: { placement: 'selected-first' },
      scrollToSelected: { onOpen: 'align' },
    });
    resetSelectConfig();

    expect(selectConfig.getConfig().selectedOptions.placement).toBe('original');
    expect(selectConfig.getConfig().selectedOptions.groupedPlacement).toBe('within-group');
    expect(selectConfig.getConfig().scrollToSelected.onOpen).toBe('reveal');
  });

  it('resolves global defaults and partial per-instance overrides without losing sibling fields', () => {
    configureSelect({ selectedOptions: { placement: 'selected-first' } });
    const globallyConfigured = document.createElement('enhanced-select') as EnhancedSelect;
    expect((globallyConfigured as any)._config.selectedOptions).toEqual({
      placement: 'selected-first',
      groupedPlacement: 'within-group',
    });

    globallyConfigured.updateConfig({
      selectedOptions: { groupedPlacement: 'within-group' },
      scrollToSelected: { onOpen: 'align' },
    });

    expect((globallyConfigured as any)._config.selectedOptions).toEqual({
      placement: 'selected-first',
      groupedPlacement: 'within-group',
    });
    expect((globallyConfigured as any)._config.scrollToSelected).toMatchObject({
      enabled: true,
      multiSelectTarget: 'first',
      onOpen: 'align',
      behavior: 'smooth',
      block: 'nearest',
    });
    globallyConfigured.remove();
  });

  it('validates enum values, types, and unknown fields', () => {
    expect(validateSelectedOptionsConfig({ placement: 'selected-first' })).toEqual({
      valid: true,
      value: { placement: 'selected-first' },
    });
    expect(validateSelectedOptionsConfig({ placement: 'selection-time' })).toMatchObject({
      valid: false,
      issues: [{ path: 'placement', code: 'invalid-value' }],
    });
    expect(validateSelectedOptionsConfig({ groupedPlacement: 'selected-group' })).toMatchObject({
      valid: false,
      issues: [{ path: 'groupedPlacement', code: 'invalid-value' }],
    });
    expect(validateSelectedOptionsConfig({ placement: 'original', surprise: true })).toMatchObject({
      valid: false,
      issues: [{ path: 'surprise', code: 'unknown-field' }],
    });
    expect(validateScrollToSelectedConfig({ onOpen: 'jump' })).toMatchObject({
      valid: false,
      issues: [{ path: 'onOpen', code: 'invalid-value' }],
    });
    expect(validateScrollToSelectedConfig({ enabled: 'yes' })).toMatchObject({
      valid: false,
      issues: [{ path: 'enabled', code: 'invalid-type' }],
    });
  });

  it('safely rejects invalid sections while applying unrelated valid fields', () => {
    configureSelect({ selectedOptions: { placement: 'selected-first' } });
    configureSelect({
      selectedOptions: { placement: 'selection-time' as any },
      direction: 'rtl',
    });
    expect(selectConfig.getConfig().selectedOptions.placement).toBe('selected-first');
    expect(selectConfig.getConfig().direction).toBe('rtl');

    select.updateConfig({
      selectedOptions: { placement: 'selection-time' as any },
      scrollToSelected: { onOpen: 'jump' as any },
      placeholder: 'Still applied',
    });
    expect((select as any)._config.selectedOptions.placement).toBe('original');
    expect((select as any)._config.scrollToSelected.onOpen).toBe('reveal');
    expect((select as any)._config.placeholder).toBe('Still applied');
  });

  it('does not mutate caller-owned nested update objects', () => {
    const selectedOptions = Object.freeze({ placement: 'selected-first' as const });
    const scrollToSelected = Object.freeze({ onOpen: 'preserve' as const });
    const update = Object.freeze({ selectedOptions, scrollToSelected });

    configureSelect(update);

    expect(selectedOptions).toEqual({ placement: 'selected-first' });
    expect(scrollToSelected).toEqual({ onOpen: 'preserve' });
    expect(selectConfig.getConfig().selectedOptions).toEqual({
      placement: 'selected-first',
      groupedPlacement: 'within-group',
    });
  });

  it('activates the public projection policy at open and snapshots policy and selection for that opening', async () => {
    select.setItems([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
      { value: 'c', label: 'C' },
    ]);
    await select.updateConfig({ selection: { mode: 'multi' } });
    await select.setSelectedValues(['b']);
    select.open();
    expect((select as any)._selectedOptionsConfigAtOpen).toEqual({
      placement: 'original',
      groupedPlacement: 'within-group',
    });
    expect((select as any)._renderPlan.filteredKeys).toEqual(['a', 'b', 'c']);

    select.updateConfig({ selectedOptions: { placement: 'selected-first' } });
    expect((select as any)._selectedOptionsConfigAtOpen.placement).toBe('original');
    expect((select as any)._renderPlan.filteredKeys).toEqual(['a', 'b', 'c']);

    await select.setSelectedValues(['c']);
    expect((select as any)._renderPlan.filteredKeys).toEqual(['a', 'b', 'c']);

    select.close();
    select.open();
    expect((select as any)._selectedOptionsConfigAtOpen.placement).toBe('selected-first');
    expect((select as any)._renderPlan.filteredKeys).toEqual(['c', 'a', 'b']);

    await select.setSelectedValues(['a']);
    expect((select as any)._renderPlan.filteredKeys).toEqual(['c', 'a', 'b']);
    select.updateConfig({ selectedOptions: { placement: 'original' } });
    expect((select as any)._renderPlan.filteredKeys).toEqual(['c', 'a', 'b']);
    select.close();
    select.open();
    expect((select as any)._renderPlan.filteredKeys).toEqual(['a', 'b', 'c']);
  });
});
