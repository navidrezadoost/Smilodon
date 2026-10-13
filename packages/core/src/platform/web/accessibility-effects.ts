import type { SelectKey } from '../../engine/contracts.js';
import type { AccessibilityEffect } from '../../engine/accessibility.js';

export interface WebAccessibilityTargets<TKey extends SelectKey = SelectKey> {
  combobox?: HTMLElement | null;
  listbox?: HTMLElement | null;
  getOptionByKey?: (key: TKey) => HTMLElement | null;
  liveRegion?: HTMLElement | null;
  focusTargets?: {
    input?: HTMLElement | null;
    clearButton?: HTMLElement | null;
    getActiveOption?: () => HTMLElement | null;
  };
}

export interface ApplyAccessibilityEffectOptions {
  /** Focus is opt-in so applying semantic state does not add focus behavior. */
  applyFocus?: boolean;
}

function setBooleanAttribute(element: HTMLElement, name: string, value: boolean): void {
  element.setAttribute(name, String(value));
}

function setOptionalAttribute(element: HTMLElement, name: string, value: string | null): void {
  if (value) {
    element.setAttribute(name, value);
  } else {
    element.removeAttribute(name);
  }
}

function setIdListAttribute(element: HTMLElement, name: string, ids: readonly string[]): void {
  setOptionalAttribute(element, name, ids.length > 0 ? ids.join(' ') : null);
}

function applyCombobox<TKey extends SelectKey>(
  effect: Extract<AccessibilityEffect<TKey>, { type: 'SYNC_COMBOBOX_ARIA' }>,
  targets: WebAccessibilityTargets<TKey>,
): void {
  const combobox = targets.combobox;
  if (!combobox) return;

  combobox.setAttribute('role', effect.role);
  setBooleanAttribute(combobox, 'aria-expanded', effect.expanded);
  setBooleanAttribute(combobox, 'aria-disabled', effect.disabled);
  setBooleanAttribute(combobox, 'aria-readonly', effect.readonly);
  setBooleanAttribute(combobox, 'aria-required', effect.required);
  setBooleanAttribute(combobox, 'aria-invalid', effect.invalid);
  combobox.setAttribute('aria-autocomplete', effect.autocomplete);
  setOptionalAttribute(combobox, 'aria-controls', effect.controlsId);
  setIdListAttribute(combobox, 'aria-labelledby', effect.labelledBy);
  setIdListAttribute(combobox, 'aria-describedby', effect.describedBy);
  setOptionalAttribute(combobox, 'aria-label', effect.ariaLabel);

  const activeOption = effect.activeKey == null
    ? null
    : targets.getOptionByKey?.(effect.activeKey) ?? null;
  setOptionalAttribute(combobox, 'aria-activedescendant', activeOption?.id || null);
}

function applyListbox<TKey extends SelectKey>(
  effect: Extract<AccessibilityEffect<TKey>, { type: 'SYNC_LISTBOX_ARIA' }>,
  targets: WebAccessibilityTargets<TKey>,
): void {
  const listbox = targets.listbox;
  if (!listbox) return;

  listbox.setAttribute('role', effect.role);
  if (effect.multiple) listbox.setAttribute('aria-multiselectable', 'true');
  else listbox.removeAttribute('aria-multiselectable');
  if (effect.busy) listbox.setAttribute('aria-busy', 'true');
  else listbox.removeAttribute('aria-busy');
  setIdListAttribute(listbox, 'aria-labelledby', effect.labelledBy);
  setOptionalAttribute(listbox, 'aria-label', effect.ariaLabel);
}

function applyOption<TKey extends SelectKey>(
  effect: Extract<AccessibilityEffect<TKey>, { type: 'SYNC_OPTION_ARIA' }>,
  targets: WebAccessibilityTargets<TKey>,
): void {
  const option = targets.getOptionByKey?.(effect.key);
  if (!option) return;

  option.setAttribute('role', 'option');
  setBooleanAttribute(option, 'aria-selected', effect.selected);
  if (effect.disabled) option.setAttribute('aria-disabled', 'true');
  else option.removeAttribute('aria-disabled');
}

function applyFocusIntent<TKey extends SelectKey>(
  target: 'input' | 'clear-button' | 'active-option' | 'none',
  targets: WebAccessibilityTargets<TKey>,
  options: ApplyAccessibilityEffectOptions,
): void {
  if (!options.applyFocus || target === 'none') return;

  const focusTarget = target === 'input'
    ? targets.focusTargets?.input
    : target === 'clear-button'
      ? targets.focusTargets?.clearButton
      : targets.focusTargets?.getActiveOption?.();
  focusTarget?.focus();
}

/** Applies engine accessibility effects to caller-owned web DOM targets. */
export function applyAccessibilityEffects<TKey extends SelectKey>(
  effects: readonly AccessibilityEffect<TKey>[],
  targets: WebAccessibilityTargets<TKey>,
  options: ApplyAccessibilityEffectOptions = {},
): void {
  for (const effect of effects) {
    switch (effect.type) {
      case 'SYNC_COMBOBOX_ARIA':
        applyCombobox(effect, targets);
        break;
      case 'SYNC_LISTBOX_ARIA':
        applyListbox(effect, targets);
        break;
      case 'SYNC_OPTION_ARIA':
        applyOption(effect, targets);
        break;
      case 'ANNOUNCE':
        if (targets.liveRegion) {
          targets.liveRegion.setAttribute('aria-live', effect.politeness);
          targets.liveRegion.setAttribute('aria-atomic', 'true');
          targets.liveRegion.textContent = effect.message;
        }
        break;
      case 'FOCUS_INTENT':
        applyFocusIntent(effect.target, targets, options);
        break;
    }
  }
}
