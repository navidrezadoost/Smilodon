import React, { useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useState, useMemo } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type {
  SelectEventDetail,
  OpenEventDetail,
  CloseEventDetail,
  SearchEventDetail,
  ChangeEventDetail,
  LoadMoreEventDetail,
  ClearEventDetail,
  GroupedItem,
  RendererHelpers,
  DiagnosticEventDetail,
  LimitationPolicyMap,
  TrackingSnapshot,
  SelectCapabilitiesReport,
  LimitationState,
} from '@smilodon/core';

/**
 * Item type for the select component
 */
export interface SelectItem {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
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
  
  /** Customize group header rendering when groupedItems are used */
  groupHeaderRenderer?: (group: GroupedItem, index: number) => React.ReactNode;
  
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

  /** Enable clear control button inside input */
  clearable?: boolean;

  /** Clear selection when clear control is clicked */
  clearSelectionOnClear?: boolean;

  /** Clear search query when clear control is clicked */
  clearSearchOnClear?: boolean;

  /** ARIA label for clear control */
  clearAriaLabel?: string;

  /** Icon text for clear control */
  clearIcon?: string;
  
  /** Custom CSS class name */
  className?: string;
  
  /** Inline styles */
  style?: React.CSSProperties;
  
  /** Custom item renderer */
  renderItem?: (item: SelectItem, index: number) => React.ReactNode;

  /** Custom React renderer for option content */
  customRenderer?: (item: SelectItem, index: number) => React.ReactNode;

  /** Custom option renderer (DOM). Returns an HTMLElement for full control. */
  optionRenderer?: (item: SelectItem, index: number, helpers: RendererHelpers) => HTMLElement;
  
  /** Custom selected value renderer */
  renderValue?: (selectedItems: SelectItem[]) => React.ReactNode;
  
  /**
   * Class map for overriding internal state classes.
   * Useful for Tailwind or other utility-first CSS frameworks.
   */
  classMap?: {
    selected?: string;
    active?: string;
    disabled?: string;
    [key: string]: string | undefined;
  };

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

  /** Called when clear control is used */
  onClear?: (detail: { clearedSelection: boolean; clearedSearch: boolean }) => void;

  /** Called when diagnostic tracking is emitted */
  onDiagnostic?: (detail: DiagnosticEventDetail) => void;

  /** Enable runtime tracking */
  trackingEnabled?: boolean;

  /** Track emitted events */
  trackEvents?: boolean;

  /** Track styling changes */
  trackStyling?: boolean;

  /** Track limitations and policy changes */
  trackLimitations?: boolean;

  /** Emit diagnostic events */
  emitDiagnostics?: boolean;

  /** Max entries kept per tracking channel */
  trackingMaxEntries?: number;

  /** Limitation control policies */
  limitationPolicies?: LimitationPolicyMap;

  /** Automatically mitigate single/multi runtime switching */
  autoMitigateRuntimeModeSwitch?: boolean;
  
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

  /** Runtime capability report */
  getCapabilities: () => SelectCapabilitiesReport | undefined;

  /** Known limitations report */
  getKnownLimitations: () => LimitationState[];

  /** Tracking snapshot */
  getTrackingSnapshot: () => TrackingSnapshot;

  /** Clear tracking logs */
  clearTracking: (source?: 'event' | 'style' | 'limitation' | 'all') => void;

  /** Update limitation policies */
  setLimitationPolicies: (policies: LimitationPolicyMap) => void;
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
    clearable = false,
    clearSelectionOnClear = true,
    clearSearchOnClear = true,
    clearAriaLabel,
    clearIcon,
    className,
    style,
    renderItem,
    customRenderer,
    renderValue,
  optionRenderer,
    onChange,
    onSelect,
    onOpen,
    onClose,
    onSearch,
    onLoadMore,
    onClear,
    onDiagnostic,
    trackingEnabled = false,
    trackEvents = true,
    trackStyling = true,
    trackLimitations = true,
    emitDiagnostics = false,
    trackingMaxEntries = 200,
    limitationPolicies,
    autoMitigateRuntimeModeSwitch = true,
    loading = false,
    creatable = false,
    onCreate,
    classMap,
  } = props;

  const elementRef = useRef<any>(null);
  const [isControlled] = useState(value !== undefined);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const hasAppliedInitialValueRef = useRef(false);
  const reactRendererCache = useRef(new Map<number, { container: HTMLElement; root: Root }>());

  const areValuesEqual = useCallback((nextValues: Array<string | number>, currentValues: Array<string | number>) => {
    if (nextValues.length !== currentValues.length) return false;
    return nextValues.every((value, index) => value === currentValues[index]);
  }, []);

  const scheduleRootUnmount = useCallback((root: Root) => {
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(() => root.unmount());
      return;
    }

    Promise.resolve().then(() => root.unmount());
  }, []);

  // Use refs for renderers to avoid reconstructing the wrapper function on every render
  const customRendererRef = useRef(customRenderer ?? renderItem);
  const optionRendererRef = useRef(optionRenderer);
  
  // Update ref when props change
  useEffect(() => {
    customRendererRef.current = customRenderer ?? renderItem;
    optionRendererRef.current = optionRenderer;
  }, [customRenderer, renderItem, optionRenderer]);

  const resolvedOptionRenderer = useMemo(() => {
    // If a direct DOM renderer is provided, use it (assumed stable or controlled by user)
    // Wait, if optionRenderer is provided as inline function, it changes every render.
    // We should wrap it too IF it is provided.
    
    if (!!optionRenderer) {
      return (item: SelectItem, index: number, helpers: RendererHelpers) => {
         return optionRendererRef.current?.(item, index, helpers) || document.createElement('div');
      };
    }
    
    // We only want to reconstruct the wrapper if the existence of a renderer changes,
    // NOT if the identity of the function changes (to avoid infinite loops with inline functions).
    const hasReactRenderer = !!(customRenderer ?? renderItem);
    
    if (!hasReactRenderer) return undefined;

    return (item: SelectItem, index: number, _helpers: RendererHelpers) => {
      const renderer = customRendererRef.current;
      if (!renderer) return document.createElement('div'); 

      let entry = reactRendererCache.current.get(index);
      if (!entry) {
        const container = document.createElement('div');
        // Note: createRoot should be reused.
        const root = createRoot(container);
        entry = { container, root };
        reactRendererCache.current.set(index, entry);
      }

      entry.root.render(<>{renderer(item, index)}</>);
      return entry.container;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!optionRenderer, !!(customRenderer ?? renderItem)]); // Only reconstruct if presence changes




  useEffect(() => {
    return () => {
      reactRendererCache.current.forEach(({ root }) => scheduleRootUnmount(root));
      reactRendererCache.current.clear();
    };
  }, [scheduleRootUnmount]);

  useEffect(() => {
    const totalItems = groupedItems
      ? groupedItems.reduce((count, group) => count + group.options.length, 0)
      : items.length;

    reactRendererCache.current.forEach((entry, index) => {
      if (index >= totalItems) {
        scheduleRootUnmount(entry.root);
        reactRendererCache.current.delete(index);
      }
    });
  }, [items, groupedItems, scheduleRootUnmount]);

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

    if (resolvedOptionRenderer) {
      element.optionRenderer = resolvedOptionRenderer;
    }

    if (props.groupHeaderRenderer) {
      // the web component expects an HTMLElement-returning renderer; we wrap
      // the React nodes similarly to other renderers
      element.groupHeaderRenderer = (group: any, idx: number) => {
        const container = document.createElement('div');
        const node = props.groupHeaderRenderer?.(group as SelectItem & { label: string; options: any[] }, idx);
        if (node) {
          const root = createRoot(container);
          root.render(<>{node}</>);
          // we don't keep roots around because headers are recreated on each
          // open; the scoping is lightweight enough.
        }
        return container;
      };
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
      clearControl: {
        enabled: clearable,
        clearSelection: clearSelectionOnClear,
        clearSearch: clearSearchOnClear,
        ariaLabel: clearAriaLabel,
        icon: clearIcon,
      },
      tracking: {
        enabled: trackingEnabled,
        events: trackEvents,
        styling: trackStyling,
        limitations: trackLimitations,
        emitDiagnostics,
        maxEntries: trackingMaxEntries,
      },
      limitations: {
        policies: limitationPolicies,
        autoMitigateRuntimeModeSwitch,
      },
    };

    element.updateConfig(config);

    // Set classMap if provided
    if (classMap) {
      element.classMap = classMap;
    } else {
      element.classMap = undefined;
    }

    // Set initial uncontrolled value only once
    if (!isControlled && !hasAppliedInitialValueRef.current && internalValue !== undefined) {
      const values = Array.isArray(internalValue) ? internalValue : [internalValue];
      const currentValues = element.getSelectedValues?.() || [];
      if (!areValuesEqual(values, currentValues)) {
        element.setSelectedValues(values);
      }
      hasAppliedInitialValueRef.current = true;
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
  }, [isElementReady, items, groupedItems, searchable, placeholder, disabled, multiple, maxSelections, infiniteScroll, pageSize, creatable, clearable, clearSelectionOnClear, clearSearchOnClear, clearAriaLabel, clearIcon, trackingEnabled, trackEvents, trackStyling, trackLimitations, emitDiagnostics, trackingMaxEntries, limitationPolicies, autoMitigateRuntimeModeSwitch, error, errorMessage, required, internalValue, isControlled, resolvedOptionRenderer, props.groupHeaderRenderer, areValuesEqual]);

  // Update items when they change
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !isElementReady || !element.setItems) return;
    if (groupedItems) {
      element.setGroupedItems(groupedItems);
    } else if (items && items.length && (items as any)[0] && (items as any)[0].group !== undefined) {
      // Auto-convert flat items with `group` property into groupedItems
      const map = new Map<string, SelectItem[]>();
      (items as SelectItem[]).forEach((it) => {
        const g = (it as any).group ?? 'Ungrouped';
        if (!map.has(g)) map.set(g, []);
        map.get(g)!.push(it);
      });
      const groups = Array.from(map.entries()).map(([label, options]) => ({ label, options }));
      element.setGroupedItems(groups as GroupedItem[]);
    } else {
      element.setItems(items);
    }
  }, [items, groupedItems, props.groupHeaderRenderer, isElementReady]);

  // Update selected value when it changes (controlled mode)
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !isControlled || !isElementReady || !element.setSelectedValues) return;
    
    if (value !== undefined) {
      const values = Array.isArray(value) ? value : [value];
      const currentValues = element.getSelectedValues?.() || [];
      if (!areValuesEqual(values, currentValues)) {
        element.setSelectedValues(values);
      }
    }
  }, [value, isControlled, isElementReady, areValuesEqual]);

  // Update config when props change
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !isElementReady || !element.updateConfig) return;

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
      clearControl: {
        enabled: clearable,
        clearSelection: clearSelectionOnClear,
        clearSearch: clearSearchOnClear,
        ariaLabel: clearAriaLabel,
        icon: clearIcon,
      },
      tracking: {
        enabled: trackingEnabled,
        events: trackEvents,
        styling: trackStyling,
        limitations: trackLimitations,
        emitDiagnostics,
        maxEntries: trackingMaxEntries,
      },
      limitations: {
        policies: limitationPolicies,
        autoMitigateRuntimeModeSwitch,
      },
    };

    element.updateConfig(config);
  }, [searchable, placeholder, disabled, multiple, maxSelections, infiniteScroll, pageSize, clearable, clearSelectionOnClear, clearSearchOnClear, clearAriaLabel, clearIcon, trackingEnabled, trackEvents, trackStyling, trackLimitations, emitDiagnostics, trackingMaxEntries, limitationPolicies, autoMitigateRuntimeModeSwitch, isElementReady]);

  // Update error state
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !isElementReady) return;

    if (error) {
      if (element.setError) element.setError(errorMessage || 'Invalid selection');
    } else {
      if (element.clearError) element.clearError();
    }
  }, [error, errorMessage, isElementReady]);

  // Update required state
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !isElementReady || !element.setRequired) return;
    element.setRequired(required);
  }, [required, isElementReady]);

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

    const handleClear = (e: CustomEvent<ClearEventDetail>) => {
      onClear?.({
        clearedSelection: e.detail.clearedSelection,
        clearedSearch: e.detail.clearedSearch,
      });
    };

    const handleDiagnostic = (e: CustomEvent<DiagnosticEventDetail>) => {
      onDiagnostic?.(e.detail);
    };

    element.addEventListener('select', handleSelect);
    element.addEventListener('change', handleChange);
    element.addEventListener('open', handleOpen);
    element.addEventListener('close', handleClose);
    element.addEventListener('search', handleSearch);
    element.addEventListener('loadMore', handleLoadMore);
    element.addEventListener('clear', handleClear);
    element.addEventListener('diagnostic', handleDiagnostic);

    return () => {
      element.removeEventListener('select', handleSelect);
      element.removeEventListener('change', handleChange);
      element.removeEventListener('open', handleOpen);
      element.removeEventListener('close', handleClose);
      element.removeEventListener('search', handleSearch);
      element.removeEventListener('loadMore', handleLoadMore);
      element.removeEventListener('clear', handleClear);
      element.removeEventListener('diagnostic', handleDiagnostic);
    };
  }, [onSelect, onChange, onOpen, onClose, onSearch, onLoadMore, onClear, onDiagnostic, isControlled, multiple]);

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
    getCapabilities: () => {
      return elementRef.current?.getCapabilities?.();
    },
    getKnownLimitations: () => {
      return elementRef.current?.getKnownLimitations?.() || [];
    },
    getTrackingSnapshot: () => {
      return elementRef.current?.getTrackingSnapshot?.() || { events: [], styles: [], limitations: [] };
    },
    clearTracking: (source?: 'event' | 'style' | 'limitation' | 'all') => {
      elementRef.current?.clearTracking?.(source);
    },
    setLimitationPolicies: (policies: LimitationPolicyMap) => {
      elementRef.current?.setLimitationPolicies?.(policies);
    },
  }));

  return React.createElement('enhanced-select', {
    ref: elementRef,
    className,
    style,
  });
});

Select.displayName = 'Select';
