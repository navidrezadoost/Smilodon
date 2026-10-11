import type { SelectKey } from './contracts.js';
import type { SelectEffect } from './select-effects.js';
import type { SelectEvent } from './select-events.js';
import type { SelectState } from './select-state.js';
import { applySelectionRequest, type SelectionRequest } from './selection-policy.js';

export interface TransitionResult<K extends SelectKey = SelectKey> {
  state: SelectState<K>;
  effects: SelectEffect<K>[];
}

export function transition<K extends SelectKey>(
  state: SelectState<K>,
  event: SelectEvent<K>,
): TransitionResult<K> {
  switch (event.type) {
    case 'CONNECT':
      return { state: { ...state, lifecycle: 'connected' }, effects: [] };

    case 'DISCONNECT': {
      const effects: SelectEffect<K>[] = state.popup === 'open'
        ? [{ type: 'POPUP_CLOSED', reason: 'disconnect' }, { type: 'SYNC_ARIA' }]
        : [];
      return {
        state: { ...state, lifecycle: 'disconnected', popup: 'closed', focused: false },
        effects,
      };
    }

    case 'OPEN_REQUEST':
      if (state.lifecycle !== 'connected' || state.disabled || state.popup === 'open') {
        return { state: enforceInvariants(state), effects: [] };
      }
      return {
        state: { ...state, popup: 'open' },
        effects: [{ type: 'POPUP_OPENED' }, { type: 'FOCUS_TRIGGER' }, { type: 'SYNC_ARIA' }],
      };

    case 'CLOSE_REQUEST':
      if (state.popup === 'closed') {
        return { state, effects: [] };
      }
      return {
        state: { ...state, popup: 'closed' },
        effects: [{ type: 'POPUP_CLOSED', reason: event.reason }, { type: 'SYNC_ARIA' }],
      };

    case 'TOGGLE_REQUEST':
      return transition(state, state.popup === 'open'
        ? { type: 'CLOSE_REQUEST', reason: 'programmatic' }
        : { type: 'OPEN_REQUEST' });

    case 'FOCUS_GAINED':
      return state.focused
        ? { state, effects: [] }
        : { state: { ...state, focused: true }, effects: [{ type: 'SYNC_ARIA' }] };

    case 'FOCUS_LOST':
      return state.focused
        ? { state: { ...state, focused: false }, effects: [{ type: 'SYNC_ARIA' }] }
        : { state, effects: [] };

    case 'DISABLED_CHANGED': {
      if (state.disabled === event.disabled) {
        return { state: enforceInvariants(state), effects: [] };
      }
      const nextState = enforceInvariants({ ...state, disabled: event.disabled });
      const effects: SelectEffect<K>[] = [];
      if (event.disabled && state.popup === 'open') {
        effects.push({ type: 'POPUP_CLOSED', reason: 'disabled' });
      }
      effects.push({ type: 'SYNC_ARIA' });
      return {
        state: nextState,
        effects,
      };
    }

    case 'ITEMS_REGISTERED': {
      const registeredKeys = new Set(event.keys);
      const disabledKeys = new Set(event.disabledKeys ?? []);
      const selection = { ...state.selection, disabledKeys };
      const activeKey = resolveActiveKey(state.activeKey, registeredKeys, disabledKeys);
      const selectedKeys = applySelectionRequest<K>(
        state.selectedKeys,
        { type: 'replace', keys: Array.from(state.selectedKeys), reason: 'programmatic' },
        selection,
      );
      const nextState = {
        ...state,
        activeKey,
        selectedKeys,
        registeredKeys,
        selection,
      };
      const effects: SelectEffect<K>[] = [];
      if (!keysEqual(activeKey, state.activeKey)) {
        effects.push({ type: 'ACTIVE_KEY_CHANGED', activeKey, reason: 'programmatic' });
      }
      if (!setsEqual(selectedKeys, state.selectedKeys)) {
        effects.push({ type: 'SELECTION_CHANGED', selectedKeys: Array.from(selectedKeys), reason: 'programmatic' });
      }
      if (effects.length > 0) {
        effects.push({ type: 'SYNC_ARIA' });
      }
      return { state: nextState, effects };
    }

    case 'SELECTION_CONFIG_CHANGED': {
      const selection = {
        ...state.selection,
        multiple: event.multiple ?? state.selection.multiple,
        required: event.required ?? state.selection.required,
        allowDeselect: event.allowDeselect ?? state.selection.allowDeselect,
        maxSelections: event.maxSelections ?? state.selection.maxSelections,
        disabledKeys: event.disabledKeys ? new Set(event.disabledKeys) : state.selection.disabledKeys,
      };
      const selectedKeys = applySelectionRequest(
        state.selectedKeys,
        { type: 'replace', keys: Array.from(state.selectedKeys), reason: 'programmatic' },
        selection,
      );
      const activeKey = resolveActiveKey(state.activeKey, state.registeredKeys, selection.disabledKeys);
      const nextState = { ...state, selection, selectedKeys, activeKey };
      const effects: SelectEffect<K>[] = [];
      if (!keysEqual(activeKey, state.activeKey)) {
        effects.push({ type: 'ACTIVE_KEY_CHANGED', activeKey, reason: 'programmatic' });
      }
      if (!setsEqual(selectedKeys, state.selectedKeys)) {
        effects.push({ type: 'SELECTION_CHANGED', selectedKeys: Array.from(selectedKeys), reason: 'programmatic' });
      }
      if (effects.length > 0) {
        effects.push({ type: 'SYNC_ARIA' });
      }
      return { state: nextState, effects };
    }

    case 'ACTIVE_KEY_CHANGED': {
      if (
        event.key !== null
        && (!state.registeredKeys.has(event.key) || state.selection.disabledKeys.has(event.key))
      ) {
        return { state, effects: [] };
      }

      if (keysEqual(state.activeKey, event.key)) {
        return { state, effects: [] };
      }

      return {
        state: { ...state, activeKey: event.key },
        effects: [
          { type: 'ACTIVE_KEY_CHANGED', activeKey: event.key, reason: event.reason },
          { type: 'SYNC_ARIA' },
        ],
      };
    }

    case 'SELECT_KEY_REQUEST':
    case 'DESELECT_KEY_REQUEST':
    case 'TOGGLE_KEY_REQUEST':
    case 'CLEAR_SELECTION_REQUEST':
    case 'REPLACE_SELECTION_REQUEST': {
      const selectedKeys = applySelectionRequest<K>(
        state.selectedKeys,
        selectionRequestFromEvent<K>(event),
        state.selection,
      );

      if (setsEqual(selectedKeys, state.selectedKeys)) {
        return { state, effects: [] };
      }

      return {
        state: { ...state, selectedKeys },
        effects: [
          { type: 'SELECTION_CHANGED', selectedKeys: Array.from(selectedKeys), reason: event.reason },
          { type: 'SYNC_ARIA' },
        ],
      };
    }

    default:
      return { state, effects: [] };
  }
}

function selectionRequestFromEvent<K extends SelectKey>(
  event: Extract<
    SelectEvent<K>,
    | { type: 'SELECT_KEY_REQUEST' }
    | { type: 'DESELECT_KEY_REQUEST' }
    | { type: 'TOGGLE_KEY_REQUEST' }
    | { type: 'CLEAR_SELECTION_REQUEST' }
    | { type: 'REPLACE_SELECTION_REQUEST' }
  >,
): SelectionRequest<K> {
  switch (event.type) {
    case 'SELECT_KEY_REQUEST':
      return { type: 'select' as const, key: event.key, reason: event.reason };
    case 'DESELECT_KEY_REQUEST':
      return { type: 'deselect' as const, key: event.key, reason: event.reason };
    case 'TOGGLE_KEY_REQUEST':
      return { type: 'toggle' as const, key: event.key, reason: event.reason };
    case 'CLEAR_SELECTION_REQUEST':
      return { type: 'clear' as const, reason: event.reason };
    case 'REPLACE_SELECTION_REQUEST':
      return { type: 'replace' as const, keys: event.keys, reason: event.reason };
  }
}

function enforceInvariants<K extends SelectKey>(state: SelectState<K>): SelectState<K> {
  if (state.lifecycle === 'disconnected' || state.disabled) {
    return state.popup === 'closed' ? state : { ...state, popup: 'closed' };
  }
  return state;
}

function resolveActiveKey<K extends SelectKey>(
  key: K | null,
  registeredKeys: ReadonlySet<K>,
  disabledKeys: ReadonlySet<K>,
): K | null {
  return key !== null && registeredKeys.has(key) && !disabledKeys.has(key) ? key : null;
}

function setsEqual<K>(left: ReadonlySet<K>, right: ReadonlySet<K>): boolean {
  if (left.size !== right.size) return false;

  for (const value of left) {
    if (!right.has(value)) return false;
  }

  return true;
}

/** Match Map/Set identity, including NaN and signed zero. */
function keysEqual(left: SelectKey | null, right: SelectKey | null): boolean {
  return left === right || Object.is(left, right);
}
