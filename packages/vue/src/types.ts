import {
  GroupedItem,
  ClassMap,
  RendererHelpers,
  GlobalSelectConfig,
  SelectionConfig,
  MultiSelectDisplayConfig,
  ScrollToSelectedConfig,
  StyleConfig,
} from '@smilodon/core';

export interface SelectItem {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
  [key: string]: any;
}

export interface SelectProps {
  /** Array of items to display in the select */
  items?: SelectItem[];
  /** Grouped items (alternative to items) */
  groupedItems?: GroupedItem[];
  /** Selected value(s) - for v-model binding */
  modelValue?: string | number | (string | number)[];
  /** Default value for uncontrolled mode */
  defaultValue?: string | number | (string | number)[];
  /** Enable multi-select mode */
  multiple?: boolean;
  /** Enable search functionality */
  searchable?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Disable the select */
  disabled?: boolean;
  /** Mark as required */
  required?: boolean;
  /** Show error state */
  error?: boolean;
  /** Enable infinite scroll */
  infiniteScroll?: boolean;
  /** Number of items per page (for infinite scroll) */
  pageSize?: number;
  /** Enable virtual scrolling */
  virtualized?: boolean;
  /** Maximum number of selections (for multi-select) */
  maxSelections?: number;
  /** Partial core selection config for advanced selection behavior */
  selectionConfig?: Partial<SelectionConfig>;
  /** Multi-select chip display behavior */
  multiSelectDisplay?: Partial<MultiSelectDisplayConfig>;
  /** Scroll-to-selected behavior */
  scrollToSelected?: Partial<ScrollToSelectedConfig>;
  /** Core style configuration for internal parts */
  styles?: StyleConfig;
  /** Full core config passthrough for advanced runtime features */
  config?: Partial<GlobalSelectConfig>;
  /** Custom icon/markup for selected chip remove buttons */
  removeButtonIcon?: string;
  /** Behavior overrides for visually disabled options */
  disabledOptionBehavior?: {
    selectable?: boolean;
    hoverable?: boolean;
    focusable?: boolean;
  };
  /** Show the selected-state side indicator */
  showSelectedIndicator?: boolean;
  /** Text and layout direction */
  direction?: 'ltr' | 'rtl';
  /** Dropdown placement */
  placement?: 'bottom' | 'top' | 'auto';
  /** Custom CSS class */
  className?: string;
  /** Custom inline styles */
  style?: Record<string, string>;
  /** State-class mapping for utility CSS frameworks */
  classMap?: ClassMap;

  /** Custom option renderer returning an HTMLElement */
  optionRenderer?: (item: SelectItem, index: number, helpers: RendererHelpers) => HTMLElement;

  /** Custom Vue renderer returning a VNode */
  customRenderer?: (item: SelectItem, index: number) => unknown;
}

export interface SelectEmits {
  /** Emitted when selection changes - for v-model */
  'update:modelValue': (value: string | number | (string | number)[]) => void;
  /** Emitted when selection changes with full details */
  change: (value: string | number | (string | number)[], selectedItems: SelectItem[]) => void;
  /** Emitted when an item is selected */
  select: (item: SelectItem, index: number) => void;
  /** Emitted when dropdown opens */
  open: () => void;
  /** Emitted when dropdown closes */
  close: () => void;
  /** Emitted when search query changes */
  search: (query: string) => void;
  /** Emitted when more items are requested (infinite scroll) */
  loadMore: (page: number) => void;
  /** Emitted when user creates a new item (if enabled) */
  create: (value: string) => void;
}

export interface SelectExposed {
  /** Open the dropdown */
  open: () => void;
  /** Close the dropdown */
  close: () => void;
  /** Focus the select */
  focus: () => void;
  /** Set items programmatically */
  setItems: (items: SelectItem[]) => void;
  /** Set grouped items programmatically */
  setGroupedItems: (groups: GroupedItem[]) => void;
  /** Clear selection */
  clear: () => void;
  /** Get selected items */
  getSelectedItems: () => SelectItem[];
  /** Get selected values */
  getSelectedValues: () => Array<string | number>;
  /** Clear current search query */
  clearSearch: () => void;
  /** Apply partial core config at runtime */
  updateConfig: (config: Partial<GlobalSelectConfig>) => void;
  /** Set error state */
  setError: (message: string) => void;
  /** Clear error state */
  clearError: () => void;
  /** Toggle required state */
  setRequired: (required: boolean) => void;
  /** Validate the component */
  validate: () => boolean;
}
