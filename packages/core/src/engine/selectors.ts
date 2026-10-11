import type { SelectKey } from './contracts.js';
import type { SelectState } from './select-state.js';

export function isOpen<K extends SelectKey>(state: SelectState<K>): boolean {
  return state.popup === 'open';
}

export function isDisabled<K extends SelectKey>(state: SelectState<K>): boolean {
  return state.disabled;
}

export function isFocused<K extends SelectKey>(state: SelectState<K>): boolean {
  return state.focused;
}

export function hasSelection<K extends SelectKey>(state: SelectState<K>): boolean {
  return state.selectedKeys.size > 0;
}

export function isSelected<K extends SelectKey>(state: SelectState<K>, key: K): boolean {
  return state.selectedKeys.has(key);
}

export function getSelectedKeys<K extends SelectKey>(state: SelectState<K>): K[] {
  return Array.from(state.selectedKeys);
}

export function getActiveKey<K extends SelectKey>(state: SelectState<K>): K | null {
  return state.activeKey;
}

export function isRegisteredKey<K extends SelectKey>(state: SelectState<K>, key: K): boolean {
  return state.registeredKeys.has(key);
}
