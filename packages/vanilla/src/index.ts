/**
 * Smilodon Vanilla - Simple helpers for using Smilodon Select with vanilla JavaScript/TypeScript
 * 
 * This package provides convenience functions and utilities for working with
 * the Smilodon Select web component in vanilla JavaScript applications.
 */

/**
 * Select item interface
 */
export interface SelectItem {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
  [key: string]: any;
}

/**
 * Grouped items interface
 */
export interface GroupedItem {
  group: string;
  items: SelectItem[];
}

/**
 * Create a select element with options
 */
export function createSelect(options: {
  items?: SelectItem[];
  groupedItems?: GroupedItem[];
  value?: string | number | (string | number)[];
  multiple?: boolean;
  searchable?: boolean;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  infiniteScroll?: boolean;
  pageSize?: number;
  virtualized?: boolean;
  maxSelections?: number;
  placement?: 'bottom' | 'top' | 'auto';
  clearable?: boolean;
  clearSelectionOnClear?: boolean;
  clearSearchOnClear?: boolean;
  clearAriaLabel?: string;
  clearIcon?: string;
  className?: string;
  style?: Partial<CSSStyleDeclaration>;
  onChange?: (value: any, items: any[]) => void;
  onSelect?: (item: any, index: number) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onSearch?: (query: string) => void;
  onLoadMore?: (page: number) => void;
  onCreate?: (value: string) => void;
  onClear?: (detail: { clearedSelection: boolean; clearedSearch: boolean }) => void;
  onDiagnostic?: (detail: any) => void;
  trackingEnabled?: boolean;
  trackEvents?: boolean;
  trackStyling?: boolean;
  trackLimitations?: boolean;
  emitDiagnostics?: boolean;
  trackingMaxEntries?: number;
  limitationPolicies?: Record<string, { mode: 'default' | 'suppress' | 'strict'; note?: string }>;
  autoMitigateRuntimeModeSwitch?: boolean;
}): HTMLElement {
  const select = document.createElement('enhanced-select') as any;

  // Set attributes
  if (options.placeholder) select.setAttribute('placeholder', options.placeholder);
  if (options.disabled) select.setAttribute('disabled', '');
  if (options.required) select.setAttribute('required', '');
  if (options.error) select.setAttribute('error', '');
  if (options.searchable) select.setAttribute('searchable', '');
  if (options.multiple) select.setAttribute('multiple', '');
  if (options.virtualized) select.setAttribute('virtualized', '');
  if (options.infiniteScroll) select.setAttribute('infinite-scroll', '');
  if (options.pageSize) select.setAttribute('page-size', String(options.pageSize));
  if (options.maxSelections) select.setAttribute('max-selections', String(options.maxSelections));
  if (options.placement) select.setAttribute('placement', options.placement);

  // Set class name
  if (options.className) {
    select.className = options.className;
  }

  // Set inline styles
  if (options.style) {
    Object.assign(select.style, options.style);
  }

  // Set items
  if (options.items) {
    select.setItems(options.items);
  }
  if (options.groupedItems) {
    select.setGroupedItems(options.groupedItems);
  }

  // Set initial value
  if (options.value !== undefined) {
    const values = Array.isArray(options.value) ? options.value : [options.value];
    select.setSelectedValues(values);
  }

  // Add event listeners
  if (options.onChange) {
    select.addEventListener('change', (e: Event) => {
      const event = e as CustomEvent;
      const { selectedItems, selectedValues } = event.detail;
      const value = options.multiple ? selectedValues : selectedValues[0];
      options.onChange!(value, selectedItems);
    });
  }

  if (options.onSelect) {
    select.addEventListener('select', (e: Event) => {
      const event = e as CustomEvent;
      options.onSelect!(event.detail.item, event.detail.index);
    });
  }

  if (options.onOpen) {
    select.addEventListener('open', options.onOpen);
  }

  if (options.onClose) {
    select.addEventListener('close', options.onClose);
  }

  if (options.onSearch) {
    select.addEventListener('search', (e: Event) => {
      const event = e as CustomEvent;
      options.onSearch!(event.detail.query);
    });
  }

  if (options.onLoadMore) {
    select.addEventListener('loadMore', (e: Event) => {
      const event = e as CustomEvent;
      options.onLoadMore!(event.detail.page);
    });
  }

  if (options.onCreate) {
    select.addEventListener('create', (e: Event) => {
      const event = e as CustomEvent;
      options.onCreate!(event.detail.value);
    });
  }

  if (options.onClear) {
    select.addEventListener('clear', (e: Event) => {
      const event = e as CustomEvent;
      options.onClear!({
        clearedSelection: !!event.detail?.clearedSelection,
        clearedSearch: !!event.detail?.clearedSearch,
      });
    });
  }

  if (options.onDiagnostic) {
    select.addEventListener('diagnostic', (e: Event) => {
      const event = e as CustomEvent;
      options.onDiagnostic!(event.detail);
    });
  }

  select.updateConfig?.({
    clearControl: {
      enabled: options.clearable === true,
      clearSelection: options.clearSelectionOnClear ?? true,
      clearSearch: options.clearSearchOnClear ?? true,
      ariaLabel: options.clearAriaLabel,
      icon: options.clearIcon,
    },
    tracking: {
      enabled: options.trackingEnabled ?? false,
      events: options.trackEvents ?? true,
      styling: options.trackStyling ?? true,
      limitations: options.trackLimitations ?? true,
      emitDiagnostics: options.emitDiagnostics ?? false,
      maxEntries: options.trackingMaxEntries ?? 200,
    },
    limitations: {
      policies: options.limitationPolicies,
      autoMitigateRuntimeModeSwitch: options.autoMitigateRuntimeModeSwitch ?? true,
    },
  });

  return select;
}

/**
 * Initialize a select element that already exists in the DOM
 */
export function initSelect(
  element: HTMLElement,
  options: {
    items?: SelectItem[];
    groupedItems?: GroupedItem[];
    value?: string | number | (string | number)[];
  }
): void {
  const select = element as any;

  if (options.items) {
    select.setItems(options.items);
  }

  if (options.groupedItems) {
    select.setGroupedItems(options.groupedItems);
  }

  if (options.value !== undefined) {
    const values = Array.isArray(options.value) ? options.value : [options.value];
    select.setSelectedValues(values);
  }
}

/**
 * Get the selected value(s) from a select element
 */
export function getValue(element: HTMLElement): any {
  const select = element as any;
  const values = select.getSelectedValues?.() || [];
  const multiple = element.hasAttribute('multiple');
  return multiple ? values : values[0];
}

/**
 * Set the selected value(s) for a select element
 */
export function setValue(
  element: HTMLElement,
  value: string | number | (string | number)[]
): void {
  const select = element as any;
  const values = Array.isArray(value) ? value : [value];
  select.setSelectedValues?.(values);
}

/**
 * Clear the selection
 */
export function clear(element: HTMLElement): void {
  const select = element as any;
  select.setSelectedValues?.([]);
}

/**
 * Open the dropdown
 */
export function open(element: HTMLElement): void {
  const select = element as any;
  select.open?.();
}

/**
 * Close the dropdown
 */
export function close(element: HTMLElement): void {
  const select = element as any;
  select.close?.();
}

/**
 * Update items
 */
export function setItems(element: HTMLElement, items: SelectItem[]): void {
  const select = element as any;
  select.setItems?.(items);
}

/**
 * Update grouped items
 */
export function setGroupedItems(element: HTMLElement, groups: GroupedItem[]): void {
  const select = element as any;
  select.setGroupedItems?.(groups);
}

export function getCapabilities(element: HTMLElement): any {
  const select = element as any;
  return select.getCapabilities?.();
}

export function getKnownLimitations(element: HTMLElement): any[] {
  const select = element as any;
  return select.getKnownLimitations?.() || [];
}

export function getTrackingSnapshot(element: HTMLElement): any {
  const select = element as any;
  return select.getTrackingSnapshot?.() || { events: [], styles: [], limitations: [] };
}

export function clearTracking(element: HTMLElement, source?: 'event' | 'style' | 'limitation' | 'all'): void {
  const select = element as any;
  select.clearTracking?.(source);
}

export function setLimitationPolicies(
  element: HTMLElement,
  policies: Record<string, { mode: 'default' | 'suppress' | 'strict'; note?: string }>
): void {
  const select = element as any;
  select.setLimitationPolicies?.(policies);
}

// Re-export types from core for convenience
export type {
  SelectEventDetail,
  ChangeEventDetail,
  SearchEventDetail,
  LoadMoreEventDetail,
  DiagnosticEventDetail,
  LimitationPolicyMap,
  TrackingSnapshot,
  SelectCapabilitiesReport,
  LimitationState,
} from '@smilodon/core';
