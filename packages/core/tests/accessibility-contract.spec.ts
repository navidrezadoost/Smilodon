import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  computeAccessibilityEffects,
  computeComboboxAccessibility,
  computeListboxAccessibility,
  computeOptionAccessibility,
  type AccessibilityComboboxState,
} from '../src/engine/accessibility';

function state(overrides: Partial<AccessibilityComboboxState<string>> = {}): AccessibilityComboboxState<string> {
  const required = overrides.required ?? false;
  const invalid = overrides.invalid ?? false;
  return {
    expanded: false,
    disabled: false,
    readonly: false,
    searchable: false,
    multiple: false,
    required,
    invalid,
    busy: false,
    activeKey: null,
    selectedKeys: new Set(),
    disabledKeys: new Set(),
    popupRole: 'listbox',
    label: {},
    validation: overrides.validation ?? { required, invalid },
    ...overrides,
  };
}

describe('accessibility state contract', () => {
  it('computes combobox intent without requiring DOM access', () => {
    expect(computeComboboxAccessibility(state())).toMatchObject({
      role: 'combobox',
      expanded: false,
      disabled: false,
      activeKey: null,
    });
  });

  it.each([false, true])('represents expanded=%s in combobox intent', (expanded) => {
    expect(computeComboboxAccessibility(state({ expanded })).expanded).toBe(expanded);
  });

  it('maps searchable mode to list autocomplete', () => {
    expect(computeComboboxAccessibility(state({ searchable: true })).autocomplete).toBe('list');
  });

  it('maps non-searchable mode to no autocomplete', () => {
    expect(computeComboboxAccessibility(state({ searchable: false })).autocomplete).toBe('none');
  });

  it('represents multi-select intent on the listbox', () => {
    expect(computeListboxAccessibility(state({ multiple: true })).multiple).toBe(true);
  });

  it('represents required and invalid state in combobox intent', () => {
    expect(computeComboboxAccessibility(state({ required: true, invalid: true }))).toMatchObject({
      required: true,
      invalid: true,
    });
  });

  it('represents active identity by key without an index or generated DOM ID', () => {
    const intent = computeComboboxAccessibility(state({ activeKey: 'item-a' }));
    expect(intent.activeKey).toBe('item-a');
    expect(intent).not.toHaveProperty('activeIndex');
    expect(intent).not.toHaveProperty('activeDescendantId');
  });

  it('preserves caller-provided label and description IDs without generating IDs', () => {
    const intent = computeComboboxAccessibility(state({
      label: {
        labelId: 'field-label',
        labelledBy: ['group-label', 'field-label'],
        describedBy: ['help-text'],
        ariaLabel: 'Choose a city',
        ariaDescription: 'Results are limited to active locations',
      },
      validation: {
        required: false,
        invalid: true,
        errorMessage: 'Choose a valid city',
        errorDescriptionId: 'error-text',
      },
    }), 'city-listbox');

    expect(intent).toMatchObject({
      controlsId: 'city-listbox',
      labelledBy: ['field-label', 'group-label'],
      describedBy: ['help-text', 'error-text'],
      ariaLabel: 'Choose a city',
      ariaDescription: 'Results are limited to active locations',
    });
  });

  it('computes selected option intent from selectedKeys', () => {
    expect(computeOptionAccessibility(state({ selectedKeys: new Set(['item-a']) }), 'item-a'))
      .toMatchObject({ key: 'item-a', selected: true });
  });

  it('computes disabled option intent from disabledKeys', () => {
    expect(computeOptionAccessibility(state({ disabledKeys: new Set(['item-a']) }), 'item-a'))
      .toMatchObject({ key: 'item-a', disabled: true, active: false });
  });

  it('does not mark any option active when activeKey is absent', () => {
    const effects = computeAccessibilityEffects(state(), { optionKeys: ['item-a', 'item-b'] });
    expect(effects.filter((effect) => effect.type === 'SYNC_OPTION_ARIA' && effect.active)).toEqual([]);
  });

  it('represents announcements as semantic effects without live-region DOM operations', () => {
    expect(computeAccessibilityEffects(state(), {
      optionKeys: [],
      announcements: [{ politeness: 'polite', message: '3 results available' }],
    })).toContainEqual({ type: 'ANNOUNCE', politeness: 'polite', message: '3 results available' });
  });

  it('represents focus as a target intent without calling focus', () => {
    expect(computeAccessibilityEffects(state(), {
      optionKeys: [],
      focusIntents: [{ target: 'input', reason: 'popup-closed' }],
    })).toContainEqual({ type: 'FOCUS_INTENT', target: 'input', reason: 'popup-closed' });
  });

  it('keeps browser globals out of the engine contract module', () => {
    const source = readFileSync(resolve(process.cwd(), 'packages/core/src/engine/accessibility.ts'), 'utf8');
    expect(source).not.toMatch(/\b(document|window|HTMLElement)\b/);
  });
});
