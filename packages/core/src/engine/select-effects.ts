import type { CloseReason, SelectKey } from './contracts.js';
import type { ActiveReason, SelectionReason } from './selection-policy.js';

export type SelectEffect<K extends SelectKey = SelectKey> =
  | { type: 'POPUP_OPENED' }
  | { type: 'POPUP_CLOSED'; reason: CloseReason }
  | { type: 'ACTIVE_KEY_CHANGED'; activeKey: K | null; reason: ActiveReason }
  | { type: 'SELECTION_CHANGED'; selectedKeys: readonly K[]; reason: SelectionReason }
  | { type: 'FOCUS_TRIGGER' }
  | { type: 'SYNC_ARIA' };
