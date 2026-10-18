import type { SelectKey } from './contracts.js';
import type { SelectState } from './select-state.js';

export type AccessibilityPopupRole = 'listbox';

export interface AccessibilityLabelState {
  labelId?: string | null;
  labelledBy?: readonly string[];
  describedBy?: readonly string[];
  ariaLabel?: string | null;
}

export interface AccessibilityValidationState {
  required: boolean;
  invalid: boolean;
  errorMessage?: string | null;
  errorDescriptionId?: string | null;
}

export interface AccessibilityComboboxState<TKey extends SelectKey = SelectKey> {
  expanded: boolean;
  disabled: boolean;
  readonly: boolean;
  searchable: boolean;
  multiple: boolean;
  required: boolean;
  invalid: boolean;
  busy: boolean;
  activeKey: TKey | null;
  selectedKeys: ReadonlySet<TKey>;
  disabledKeys: ReadonlySet<TKey>;
  popupRole: AccessibilityPopupRole;
  label: AccessibilityLabelState;
  validation: AccessibilityValidationState;
}

export interface ComboboxAccessibilityIntent<TKey extends SelectKey = SelectKey> {
  role: 'combobox';
  expanded: boolean;
  disabled: boolean;
  readonly: boolean;
  autocomplete: 'none' | 'list';
  multiple: boolean;
  required: boolean;
  invalid: boolean;
  activeKey: TKey | null;
  controlsId: string | null;
  labelledBy: readonly string[];
  describedBy: readonly string[];
  ariaLabel: string | null;
}

export interface ListboxAccessibilityIntent {
  role: AccessibilityPopupRole;
  multiple: boolean;
  busy: boolean;
  labelledBy: readonly string[];
  ariaLabel: string | null;
}

export interface OptionAccessibilityIntent<TKey extends SelectKey = SelectKey> {
  key: TKey;
  selected: boolean;
  disabled: boolean;
  active: boolean;
}

export interface AccessibilityAnnouncementIntent {
  politeness: 'polite' | 'assertive';
  message: string;
}

export interface AccessibilityFocusIntent {
  target: 'input' | 'clear-button' | 'active-option' | 'none';
  reason: string;
}

export type AccessibilityEffect<TKey extends SelectKey = SelectKey> =
  | (ComboboxAccessibilityIntent<TKey> & { type: 'SYNC_COMBOBOX_ARIA' })
  | (ListboxAccessibilityIntent & { type: 'SYNC_LISTBOX_ARIA' })
  | (OptionAccessibilityIntent<TKey> & { type: 'SYNC_OPTION_ARIA' })
  | ({ type: 'ANNOUNCE' } & AccessibilityAnnouncementIntent)
  | ({ type: 'FOCUS_INTENT' } & AccessibilityFocusIntent);

export interface AccessibilityEffectOptions<TKey extends SelectKey = SelectKey> {
  /** A caller-provided target ID; the engine never generates DOM IDs. */
  controlsId?: string | null;
  /** Keys of options the caller wants accessibility intent for. */
  optionKeys: readonly TKey[];
  announcements?: readonly AccessibilityAnnouncementIntent[];
  focusIntents?: readonly AccessibilityFocusIntent[];
}

export interface AccessibilityStateContext {
  readonly?: boolean;
  searchable?: boolean;
  invalid?: boolean;
  label?: AccessibilityLabelState;
  errorMessage?: string | null;
  errorDescriptionId?: string | null;
}

/** Projects existing engine state into accessibility semantics without DOM data. */
export function deriveAccessibilityState<TKey extends SelectKey>(
  state: SelectState<TKey>,
  context: AccessibilityStateContext = {},
): AccessibilityComboboxState<TKey> {
  const required = state.selection.required;
  const invalid = context.invalid ?? false;

  return {
    expanded: state.popup === 'open',
    disabled: state.disabled,
    readonly: context.readonly ?? false,
    searchable: context.searchable ?? false,
    multiple: state.selection.multiple,
    required,
    invalid,
    busy: state.dataStatus === 'loading',
    activeKey: state.activeKey,
    selectedKeys: state.selectedKeys,
    disabledKeys: state.selection.disabledKeys,
    popupRole: 'listbox',
    label: context.label ?? {},
    validation: {
      required,
      invalid,
      errorMessage: context.errorMessage ?? null,
      errorDescriptionId: context.errorDescriptionId ?? null,
    },
  };
}

function uniqueIds(ids: readonly (string | null | undefined)[]): string[] {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

function getLabelledBy(label: AccessibilityLabelState): string[] {
  return uniqueIds([label.labelId, ...(label.labelledBy ?? [])]);
}

function getDescribedBy<TKey extends SelectKey>(state: AccessibilityComboboxState<TKey>): string[] {
  return uniqueIds([
    ...(state.label.describedBy ?? []),
    state.validation.errorDescriptionId,
  ]);
}

/** Computes combobox semantics without reading from or writing to the DOM. */
export function computeComboboxAccessibility<TKey extends SelectKey>(
  state: AccessibilityComboboxState<TKey>,
  controlsId: string | null = null,
): ComboboxAccessibilityIntent<TKey> {
  return {
    role: 'combobox',
    expanded: state.expanded,
    disabled: state.disabled,
    readonly: state.readonly,
    autocomplete: state.searchable ? 'list' : 'none',
    multiple: state.multiple,
    required: state.required,
    invalid: state.invalid,
    activeKey: state.activeKey,
    controlsId,
    labelledBy: getLabelledBy(state.label),
    describedBy: getDescribedBy(state),
    ariaLabel: state.label.ariaLabel ?? null,
  };
}

/** Computes listbox semantics; the supplied label IDs remain caller-owned data. */
export function computeListboxAccessibility<TKey extends SelectKey>(
  state: AccessibilityComboboxState<TKey>,
): ListboxAccessibilityIntent {
  return {
    role: state.popupRole,
    multiple: state.multiple,
    busy: state.busy,
    labelledBy: getLabelledBy(state.label),
    ariaLabel: state.label.ariaLabel ?? null,
  };
}

/** Computes one option's semantic state from stable identity, never its index. */
export function computeOptionAccessibility<TKey extends SelectKey>(
  state: AccessibilityComboboxState<TKey>,
  key: TKey,
): OptionAccessibilityIntent<TKey> {
  const disabled = state.disabled || state.disabledKeys.has(key);
  return {
    key,
    selected: state.selectedKeys.has(key),
    disabled,
    active: !disabled && state.activeKey === key,
  };
}

/**
 * Produces semantic accessibility effects. IDs and rendered option keys are
 * caller inputs; this function does not inspect the DOM or perform side effects.
 */
export function computeAccessibilityEffects<TKey extends SelectKey>(
  state: AccessibilityComboboxState<TKey>,
  options: AccessibilityEffectOptions<TKey>,
): AccessibilityEffect<TKey>[] {
  return [
    {
      type: 'SYNC_COMBOBOX_ARIA',
      ...computeComboboxAccessibility(state, options.controlsId ?? null),
    },
    {
      type: 'SYNC_LISTBOX_ARIA',
      ...computeListboxAccessibility(state),
    },
    ...options.optionKeys.map((key): AccessibilityEffect<TKey> => ({
      type: 'SYNC_OPTION_ARIA',
      ...computeOptionAccessibility(state, key),
    })),
    ...(options.announcements ?? []).map((announcement): AccessibilityEffect<TKey> => ({
      type: 'ANNOUNCE',
      ...announcement,
    })),
    ...(options.focusIntents ?? []).map((focusIntent): AccessibilityEffect<TKey> => ({
      type: 'FOCUS_INTENT',
      ...focusIntent,
    })),
  ];
}
