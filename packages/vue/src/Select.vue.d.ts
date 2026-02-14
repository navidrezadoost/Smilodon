import { DefineComponent } from 'vue';
import type {
  SelectEventDetail,
  OpenEventDetail,
  CloseEventDetail,
  SearchEventDetail,
  ChangeEventDetail,
  LoadMoreEventDetail,
  GroupedItem,
  RendererHelpers,
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
  /** Dropdown placement */
  placement?: 'bottom' | 'top' | 'auto';
  /** Custom CSS class */
  className?: string;
  /** Custom inline styles */
  style?: Record<string, string>;

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
}

declare const Select: DefineComponent<SelectProps, SelectExposed, SelectEmits>;

export default Select;
