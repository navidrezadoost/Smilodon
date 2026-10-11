export type SelectKey = string | number;

export type CloseReason =
  | 'escape'
  | 'outside-pointer'
  | 'selection'
  | 'blur'
  | 'programmatic'
  | 'disabled'
  | 'disconnect';

export type { ItemAdapter } from './item-adapter.js';

export type SelectionMode = 'single' | 'multi';
