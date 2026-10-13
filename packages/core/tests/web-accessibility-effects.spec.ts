import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { AccessibilityEffect } from '../src/engine/accessibility';
import { applyAccessibilityEffects } from '../src/platform/web/accessibility-effects';

function comboboxEffect(overrides: Partial<Extract<AccessibilityEffect, { type: 'SYNC_COMBOBOX_ARIA' }>> = {}) {
  return {
    type: 'SYNC_COMBOBOX_ARIA' as const,
    role: 'combobox' as const,
    expanded: true,
    disabled: false,
    readonly: false,
    autocomplete: 'none' as const,
    multiple: false,
    required: false,
    invalid: false,
    activeKey: null,
    controlsId: null,
    labelledBy: [],
    describedBy: [],
    ariaLabel: null,
    ...overrides,
  };
}

describe('web accessibility effect applier', () => {
  it('applies combobox role and expanded state', () => {
    const combobox = document.createElement('input');

    applyAccessibilityEffects([comboboxEffect()], { combobox });

    expect(combobox.getAttribute('role')).toBe('combobox');
    expect(combobox.getAttribute('aria-expanded')).toBe('true');
  });

  it('applies autocomplete list and none values', () => {
    const combobox = document.createElement('input');

    applyAccessibilityEffects([
      comboboxEffect({ autocomplete: 'list' }),
      comboboxEffect({ autocomplete: 'none' }),
    ], { combobox });

    expect(combobox.getAttribute('aria-autocomplete')).toBe('none');
  });

  it('sets controls id only when provided and removes a stale value otherwise', () => {
    const combobox = document.createElement('input');
    combobox.setAttribute('aria-controls', 'old-listbox');

    applyAccessibilityEffects([comboboxEffect({ controlsId: 'listbox-1' })], { combobox });
    expect(combobox.getAttribute('aria-controls')).toBe('listbox-1');

    applyAccessibilityEffects([comboboxEffect({ controlsId: null })], { combobox });
    expect(combobox.hasAttribute('aria-controls')).toBe(false);
  });

  it('maps activeKey to the rendered option id', () => {
    const combobox = document.createElement('input');
    const option = document.createElement('div');
    option.id = 'option-b';

    applyAccessibilityEffects([comboboxEffect({ activeKey: 'b' })], {
      combobox,
      getOptionByKey: (key) => key === 'b' ? option : null,
    });

    expect(combobox.getAttribute('aria-activedescendant')).toBe('option-b');
  });

  it('removes active descendant when the active option is missing or has no id', () => {
    const combobox = document.createElement('input');
    combobox.setAttribute('aria-activedescendant', 'stale-option');

    applyAccessibilityEffects([comboboxEffect({ activeKey: 'missing' })], {
      combobox,
      getOptionByKey: () => null,
    });
    expect(combobox.hasAttribute('aria-activedescendant')).toBe(false);

    const noIdOption = document.createElement('div');
    applyAccessibilityEffects([comboboxEffect({ activeKey: 'no-id' })], {
      combobox,
      getOptionByKey: () => noIdOption,
    });
    expect(combobox.hasAttribute('aria-activedescendant')).toBe(false);
  });

  it('applies listbox role, multiselectable, and busy state', () => {
    const listbox = document.createElement('div');
    const effect: Extract<AccessibilityEffect, { type: 'SYNC_LISTBOX_ARIA' }> = {
      type: 'SYNC_LISTBOX_ARIA',
      role: 'listbox',
      multiple: true,
      busy: true,
      labelledBy: ['label-a', 'label-b'],
      ariaLabel: null,
    };

    applyAccessibilityEffects([effect], { listbox });

    expect(listbox.getAttribute('role')).toBe('listbox');
    expect(listbox.getAttribute('aria-multiselectable')).toBe('true');
    expect(listbox.getAttribute('aria-busy')).toBe('true');
    expect(listbox.getAttribute('aria-labelledby')).toBe('label-a label-b');
  });

  it('removes single-select and non-busy listbox attributes to preserve existing semantics', () => {
    const listbox = document.createElement('div');
    listbox.setAttribute('aria-multiselectable', 'true');
    listbox.setAttribute('aria-busy', 'true');

    applyAccessibilityEffects([{
      type: 'SYNC_LISTBOX_ARIA',
      role: 'listbox',
      multiple: false,
      busy: false,
      labelledBy: [],
      ariaLabel: null,
    }], { listbox });

    expect(listbox.hasAttribute('aria-multiselectable')).toBe(false);
    expect(listbox.hasAttribute('aria-busy')).toBe(false);
  });

  it('applies selected and disabled state to the option resolved by key', () => {
    const option = document.createElement('div');
    const effect: AccessibilityEffect<string> = {
      type: 'SYNC_OPTION_ARIA', key: 'item-a', selected: true, disabled: true, active: false,
    };

    applyAccessibilityEffects([effect], { getOptionByKey: () => option });

    expect(option.getAttribute('role')).toBe('option');
    expect(option.getAttribute('aria-selected')).toBe('true');
    expect(option.getAttribute('aria-disabled')).toBe('true');
  });

  it('writes announcement intent to the live region', () => {
    const liveRegion = document.createElement('div');

    applyAccessibilityEffects([{
      type: 'ANNOUNCE', politeness: 'assertive', message: 'Selection unavailable',
    }], { liveRegion });

    expect(liveRegion.getAttribute('aria-live')).toBe('assertive');
    expect(liveRegion.getAttribute('aria-atomic')).toBe('true');
    expect(liveRegion.textContent).toBe('Selection unavailable');
  });

  it('does not call focus by default', () => {
    const input = document.createElement('input');
    const focus = vi.spyOn(input, 'focus');

    applyAccessibilityEffects([{
      type: 'FOCUS_INTENT', target: 'input', reason: 'requested',
    }], { focusTargets: { input } });

    expect(focus).not.toHaveBeenCalled();
  });

  it('calls focus only when applyFocus is enabled', () => {
    const input = document.createElement('input');
    const focus = vi.spyOn(input, 'focus');

    applyAccessibilityEffects([{
      type: 'FOCUS_INTENT', target: 'input', reason: 'requested',
    }], { focusTargets: { input } }, { applyFocus: true });

    expect(focus).toHaveBeenCalledOnce();
  });

  it('treats missing targets as safe no-ops', () => {
    expect(() => applyAccessibilityEffects([
      comboboxEffect({ activeKey: 'missing' }),
      { type: 'SYNC_LISTBOX_ARIA', role: 'listbox', multiple: false, busy: false, labelledBy: [], ariaLabel: null },
      { type: 'SYNC_OPTION_ARIA', key: 'missing', selected: false, disabled: false, active: false },
      { type: 'ANNOUNCE', politeness: 'polite', message: 'No target' },
      { type: 'FOCUS_INTENT', target: 'active-option', reason: 'requested' },
    ], {})).not.toThrow();
  });

  it('keeps DOM type references in the web platform, not the engine', () => {
    const root = resolve(process.cwd(), 'packages/core/src');
    const engineSource = readFileSync(resolve(root, 'engine/accessibility.ts'), 'utf8');
    const adapterSource = readFileSync(resolve(root, 'platform/web/accessibility-effects.ts'), 'utf8');

    expect(engineSource).not.toMatch(/\b(document|window|HTMLElement)\b/);
    expect(adapterSource).toContain('HTMLElement');
  });
});
