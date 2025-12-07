// Public types and contracts for the native-select component
export type Placement =
  | 'top' | 'bottom' | 'left' | 'right'
  | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'
  | 'left-start' | 'left-end' | 'right-start' | 'right-end';

export type Strategy = 'fixed' | 'absolute';

export interface RemoteConfig {
  endpoint: string;
  pageSize?: number;
  headers?: Record<string, string>;
  transformer?: (resp: unknown) => unknown[] | Promise<unknown[]>;
  cacheTTL?: number;
}

// Event payloads: frozen contract for Phase 0
export interface SelectEventDetail<T = unknown> {
  item: T;
  index: number;
  value?: unknown;
  multi?: boolean;
}

export interface OpenEventDetail { }
export interface CloseEventDetail { }
export interface SearchEventDetail { query: string }
export interface PageLoadedEventDetail { page: number; count: number }
export interface ErrorEventDetail { message: string; cause?: unknown }

export interface SelectEventsDetailMap {
  select: SelectEventDetail;
  open: OpenEventDetail;
  close: CloseEventDetail;
  search: SearchEventDetail;
  pageLoaded: PageLoadedEventDetail;
  error: ErrorEventDetail;
}

export type SelectEventName = keyof SelectEventsDetailMap;

export interface RendererHelpers {
  onSelect: (item: unknown, index: number) => void;
  getIndex: (node: Element | null) => number | null;
  keyboardFocus: (index: number) => void;
}

export interface NativeSelectOptions {
  placement?: Placement;
  strategy?: Strategy;
  portal?: boolean; // false => portal-less mode
  offset?: [number, number]; // [skidding, distance]
  flip?: boolean;
  shift?: boolean;
  boundary?: Element | Document; // overflow boundary
  optionRenderer?: (item: unknown, index: number, helpers: RendererHelpers) => HTMLElement;
  optionTemplate?: (item: unknown, index: number) => string;
  remote?: RemoteConfig | null;
  loadMode?: 'full' | 'lazy';
  infinite?: boolean;
  virtualize?: boolean;
  estimatedItemHeight?: number;
  bufferSize?: number;
}

// Attribute ↔ property mapping (documentation reference)
// - placement (attr) ↔ options.placement (prop)
// - strategy (attr) ↔ options.strategy (prop)
// - portal (attr) ↔ options.portal (prop)
