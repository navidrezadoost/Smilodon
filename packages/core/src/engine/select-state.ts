import type { SelectKey } from './contracts.js';
import type { SelectionConfig } from './selection-policy.js';

export interface SelectState<K extends SelectKey = SelectKey> {
  lifecycle: 'disconnected' | 'connected';
  popup: 'closed' | 'open';
  disabled: boolean;
  focused: boolean;
  query: string;
  /** Navigation identity; must be registered and enabled, or null. */
  activeKey: K | null;
  /** Selection identity survives absence from the current registered/visible set. */
  selectedKeys: ReadonlySet<K>;
  registeredKeys: ReadonlySet<K>;
  selection: SelectionConfig<K>;
  dataStatus: 'idle' | 'loading' | 'error';
}

export function createInitialSelectState<K extends SelectKey = SelectKey>(): SelectState<K> {
  return {
    lifecycle: 'disconnected',
    popup: 'closed',
    disabled: false,
    focused: false,
    query: '',
    activeKey: null,
    selectedKeys: new Set<K>(),
    registeredKeys: new Set<K>(),
    selection: {
      multiple: false,
      required: false,
      allowDeselect: false,
      disabledKeys: new Set<K>(),
      maxSelections: 0,
    },
    dataStatus: 'idle',
  };
}
