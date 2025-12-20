import React, { useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useState } from 'react';
import type {
  SelectEventDetail,
  OpenEventDetail,
  CloseEventDetail,
  SearchEventDetail,
  ChangeEventDetail,
  LoadMoreEventDetail,
  GroupedItem,
} from '@smilodon/core';

/**
 * Item type for the select component
 */
export interface SelectItem {
  value: string | number;
  label: string;
  disabled?: boolean;
  [key: string]: unknown;
}

/**
 * Props for the Select component
 */
export interface SelectProps {
  /** Array of items to display in the dropdown */
  items?: SelectItem[];
  
  /** Grouped items (alternative to flat items array) */
  groupedItems?: GroupedItem[];
  
  /** Currently selected value(s) */
  value?: string | number | Array<string | number>;
  
  /** Default value(s) for uncontrolled mode */
  defaultValue?: string | number | Array<string | number>;
  
  /** Enable multi-select mode */
  multiple?: boolean;
  
  /** Enable search/filter functionality */
  searchable?: boolean;
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Disable the select */
  disabled?: boolean;
  
  /** Required field */
  required?: boolean;
  
  /** Error state */
  error?: boolean;
  
  /** Error message to display */
  errorMessage?: string;
  
  /** Enable infinite scroll */
  infiniteScroll?: boolean;
  
  /** Page size for infinite scroll */
  pageSize?: number;
  
  /** Enable virtual scrolling for large lists */
  virtualized?: boolean;
  
  /** Estimated height of each item (for virtualization) */
  estimatedItemHeight?: number;
  
  /** Maximum number of selections (for multiple mode) */
  maxSelections?: number;
  
  /** Dropdown placement */
  placement?: 'top' | 'bottom' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
  
  /** Custom CSS class name */
  className?: string;
  
  /** Inline styles */
  style?: React.CSSProperties;
  
  /** Custom item renderer */
  renderItem?: (item: SelectItem, index: number) => React.ReactNode;
  
  /** Custom selected value renderer */
  renderValue?: (selectedItems: SelectItem[]) => React.ReactNode;
  
  // Event Handlers
  /** Called when selection changes */
  onChange?: (value: string | number | Array<string | number>, items: SelectItem[]) => void;
  
  /** Called when an item is selected */
  onSelect?: (item: SelectItem, index: number) => void;
  
  /** Called when dropdown opens */
  onOpen?: () => void;
  
  /** Called when dropdown closes */
  onClose?: () => void;
  
  /** Called when search query changes */
  onSearch?: (query: string, results?: SelectItem[], count?: number) => void;
  
  /** Called when more items are needed (infinite scroll) */
  onLoadMore?: (page: number) => void | Promise<void>;
  
  /** Loading state for async operations */
  loading?: boolean;
  
  /** Enable creatable mode (allow creating new options) */
  creatable?: boolean;
  
  /** Called when a new option is created */
  onCreate?: (label: string) => void;
}

/**
 * Imperative handle for the Select component
 */
export interface SelectHandle {
  /** Focus the select input */
  focus: () => void;
  
  /** Open the dropdown */
  open: () => void;
  
  /** Close the dropdown */
  close: () => void;
  
  /** Get currently selected items */
  getSelectedItems: () => SelectItem[];
  
  /** Get currently selected values */
  getSelectedValues: () => Array<string | number>;
  
  /** Programmatically set items */
  setItems: (items: SelectItem[]) => void;
  
  /** Programmatically set grouped items */
  setGroupedItems: (groups: GroupedItem[]) => void;
  
  /** Clear the selection */
  clear: () => void;
}

/**
 * Smilodon Select Component for React
 * 
 * A production-ready, accessible select component with advanced features:
 * - Single and multi-select modes
 * - Searchable with client or server-side filtering
 * - Infinite scroll and virtual scrolling for large datasets
 * - Grouped options
 * - Custom rendering
 * - Full keyboard navigation
 * - WCAG 2.1 AAA compliant
 * 
 * @example
 * ```tsx
 * // Simple usage
 * <Select
 *   items={[
 *     { value: 'apple', label: 'Apple' },
 *     { value: 'banana', label: 'Banana' }
 *   ]}
 *   value="apple"
 *   onChange={(value) => console.log(value)}
 * />
 * 
 * // Multi-select with search
 * <Select
 *   items={items}
 *   multiple
 *   searchable
 *   value={selectedValues}
 *   onChange={(values) => setSelectedValues(values)}
 * />
 * 
 * // With grouped items
 * <Select
 *   groupedItems={[
 *     { label: 'Fruits', options: [...] },
 *     { label: 'Vegetables', options: [...] }
 *   ]}
 *   onChange={(value) => console.log(value)}
 * />
 * ```
 */
export const Select = forwardRef<SelectHandle, SelectProps>((props, ref) => {
  const {
    items = [],
    groupedItems,
    value,
    defaultValue,
    multiple = false,
    searchable = false,
    placeholder = 'Select an option...',
    disabled = false,
    required = false,
    error = false,
    errorMessage,
    infiniteScroll = false,
    pageSize = 20,
    virtualized = false,
    estimatedItemHeight = 48,
    maxSelections,
    placement = 'bottom-start',
    className,
    style,
    renderItem,
    renderValue,
    onChange,
    onSelect,
    onOpen,
    onClose,
    onSearch,
    onLoadMore,
    loading = false,
    creatable = false,
    onCreate,
  } = props;

  const elementRef = useRef<any>(null);
  const [isControlled] = useState(value !== undefined);
  const [internalValue, setInternalValue] = useState(defaultValue);

  // Register custom element if not already registered
  const [isElementReady, setIsElementReady] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (customElements.get('enhanced-select')) {
        setIsElementReady(true);
      } else {
        import('@smilodon/core').then((module) => {
          if (!customElements.get('enhanced-select')) {
            customElements.define('enhanced-select', module.EnhancedSelect);
          }
          setIsElementReady(true);
        });
      }
    }
  }, []);

  // Initialize component
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !isElementReady) return;

    // Wait for the element to be fully upgraded
    if (!element.setItems) {
      console.warn('Enhanced select element not fully initialized yet');
      return;
    }

    // Set initial items
    if (groupedItems) {
      element.setGroupedItems(groupedItems);
    } else if (items.length > 0) {
      element.setItems(items);
    }

    // Configure component
    const config = {
      searchable,
      placeholder,
      enabled: !disabled,
      selection: {
        mode: multiple ? 'multi' : 'single',
        maxSelections: maxSelections,
      },
      infiniteScroll: {
        enabled: infiniteScroll,
        pageSize: pageSize,
      },
      scrollToSelected: {
        enabled: true,
      },
      creatable: creatable,
    };

    element.updateConfig(config);

    // Set initial value
    const currentValue = isControlled ? value : internalValue;
    if (currentValue !== undefined) {
      const values = Array.isArray(currentValue) ? currentValue : [currentValue];
      element.setSelectedValues(values);
    }

    // Set error state
    if (error) {
      element.setError(errorMessage || 'Invalid selection');
    } else {
      element.clearError();
    }

    // Set required state
    if (required) {
      element.setRequired(true);
    }
  }, [isElementReady, items, groupedItems, searchable, placeholder, disabled, multiple, maxSelections, infiniteScroll, pageSize, creatable, error, errorMessage, required, value, internalValue, isControlled]);

  // Update items when they change
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !isElementReady || !element.setItems) return;
    
    if (groupedItems) {
      element.setGroupedItems(groupedItems);
    } else {
      element.setItems(items);
    }
  }, [items, groupedItems, isElementReady]);

  // Update selected value when it changes (controlled mode)
  useEffect(() => {
    if (!elementRef.current || !isControlled) return;
    
    if (value !== undefined) {
      const values = Array.isArray(value) ? value : [value];
      elementRef.current.setSelectedValues(values);
    }
  }, [value, isControlled]);

  // Update config when props change
  useEffect(() => {
    if (!elementRef.current) return;

    const config = {
      searchable,
      placeholder,
      enabled: !disabled,
      selection: {
        mode: multiple ? 'multi' : 'single',
        maxSelections: maxSelections,
      },
      infiniteScroll: {
        enabled: infiniteScroll,
        pageSize: pageSize,
      },
    };

    elementRef.current.updateConfig(config);
  }, [searchable, placeholder, disabled, multiple, maxSelections, infiniteScroll, pageSize]);

  // Update error state
  useEffect(() => {
    if (!elementRef.current) return;

    if (error) {
      elementRef.current.setError(errorMessage || 'Invalid selection');
    } else {
      elementRef.current.clearError();
    }
  }, [error, errorMessage]);

  // Update required state
  useEffect(() => {
    if (!elementRef.current) return;
    elementRef.current.setRequired(required);
  }, [required]);

  // Event handlers
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleSelect = (e: CustomEvent<SelectEventDetail>) => {
      const { item, index } = e.detail;
      onSelect?.(item as SelectItem, index);
    };

    const handleChange = (e: CustomEvent<ChangeEventDetail>) => {
      const { selectedItems, selectedValues } = e.detail;
      
      // Cast selectedValues to proper type
      const values = selectedValues as (string | number)[];
      
      // Update internal value in uncontrolled mode
      if (!isControlled) {
        setInternalValue(multiple ? values : values[0]);
      }

      // Call onChange callback
      if (onChange) {
        const value = multiple ? values : values[0];
        onChange(value, selectedItems as SelectItem[]);
      }
    };

    const handleOpen = (e: CustomEvent<OpenEventDetail>) => {
      onOpen?.();
    };

    const handleClose = (e: CustomEvent<CloseEventDetail>) => {
      onClose?.();
    };

    const handleSearch = (e: CustomEvent<SearchEventDetail>) => {
      const { query, results, count } = e.detail;
      onSearch?.(query, results as SelectItem[] | undefined, count);
    };

    const handleLoadMore = (e: CustomEvent<LoadMoreEventDetail>) => {
      const { page } = e.detail;
      onLoadMore?.(page);
    };

    element.addEventListener('select', handleSelect);
    element.addEventListener('change', handleChange);
    element.addEventListener('open', handleOpen);
    element.addEventListener('close', handleClose);
    element.addEventListener('search', handleSearch);
    element.addEventListener('loadMore', handleLoadMore);

    return () => {
      element.removeEventListener('select', handleSelect);
      element.removeEventListener('change', handleChange);
      element.removeEventListener('open', handleOpen);
      element.removeEventListener('close', handleClose);
      element.removeEventListener('search', handleSearch);
      element.removeEventListener('loadMore', handleLoadMore);
    };
  }, [onSelect, onChange, onOpen, onClose, onSearch, onLoadMore, isControlled, multiple]);

  // Expose imperative handle
  useImperativeHandle(ref, () => ({
    focus: () => {
      elementRef.current?.focus();
    },
    open: () => {
      elementRef.current?.open();
    },
    close: () => {
      elementRef.current?.close();
    },
    getSelectedItems: () => {
      return elementRef.current?.getSelectedItems() || [];
    },
    getSelectedValues: () => {
      return elementRef.current?.getSelectedValues() || [];
    },
    setItems: (items: SelectItem[]) => {
      elementRef.current?.setItems(items);
    },
    setGroupedItems: (groups: GroupedItem[]) => {
      elementRef.current?.setGroupedItems(groups);
    },
    clear: () => {
      elementRef.current?.setSelectedValues([]);
      if (!isControlled) {
        setInternalValue(multiple ? [] : undefined);
      }
      onChange?.(multiple ? [] : '', []);
    },
  }));

  return React.createElement('enhanced-select', {
    ref: elementRef,
    className,
    style,
  });
});

Select.displayName = 'Select';
