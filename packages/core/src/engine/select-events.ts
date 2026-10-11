import type { CloseReason, SelectKey } from './contracts.js';
import type { ActiveReason, SelectionReason } from './selection-policy.js';

export type SelectEvent<K extends SelectKey = SelectKey> =
  | { type: 'CONNECT' }
  | { type: 'DISCONNECT' }
  | { type: 'OPEN_REQUEST' }
  | { type: 'CLOSE_REQUEST'; reason: CloseReason }
  | { type: 'TOGGLE_REQUEST' }
  | { type: 'FOCUS_GAINED' }
  | { type: 'FOCUS_LOST' }
  | { type: 'DISABLED_CHANGED'; disabled: boolean }
  // Replaces the visible keys and disabled-key snapshot (omission means no disabled keys).
  | { type: 'ITEMS_REGISTERED'; keys: readonly K[]; disabledKeys?: readonly K[] }
  | {
      type: 'SELECTION_CONFIG_CHANGED';
      multiple?: boolean;
      required?: boolean;
      allowDeselect?: boolean;
      maxSelections?: number;
      disabledKeys?: readonly K[];
    }
  | { type: 'ACTIVE_KEY_CHANGED'; key: K | null; reason: ActiveReason }
  | { type: 'SELECT_KEY_REQUEST'; key: K; reason: SelectionReason }
  | { type: 'DESELECT_KEY_REQUEST'; key: K; reason: SelectionReason }
  | { type: 'TOGGLE_KEY_REQUEST'; key: K; reason: SelectionReason }
  | { type: 'CLEAR_SELECTION_REQUEST'; reason: SelectionReason }
  | { type: 'REPLACE_SELECTION_REQUEST'; keys: readonly K[]; reason: SelectionReason };
