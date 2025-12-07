/**
 * React Adapter for Enhanced Select Component
 */

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { EnhancedSelect } from '@smilodon/core';
import type { GlobalSelectConfig } from '@smilodon/core';

export interface ReactSelectProps extends Partial<GlobalSelectConfig> {
  /** Items to display */
  items?: unknown[];
  /** Initial selected values */
  initialSelectedValues?: unknown[];
  /** Controlled selected values */
  selectedValues?: unknown[];
  /** Callback when selection changes */
  onSelectionChange?: (items: unknown[], values: unknown[]) => void;
  /** Callback when option is selected */
  onOptionSelect?: (data: { item: unknown; index: number; value: unknown; label: string; selected: boolean }) => void;
  /** Callback when dropdown opens */
  onOpen?: () => void;
  /** Callback when dropdown closes */
  onClose?: () => void;
  /** Callback when search query changes */
  onSearch?: (query: string) => void;
  /** Callback when more items are loaded */
  onLoadMore?: (page: number) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Custom className for wrapper */
  className?: string;
  /** Custom style for wrapper */
  style?: React.CSSProperties;
}

export interface ReactSelectRef {
  /** Get currently selected items */
  getSelectedItems: () => unknown[];
  /** Get currently selected values */
  getSelectedValues: () => unknown[];
  /** Set selected items by value */
  setSelectedValues: (values: unknown[]) => Promise<void>;
  /** Clear all selections */
  clear: () => void;
  /** Open dropdown */
  open: () => void;
  /** Close dropdown */
  close: () => void;
  /** Update configuration */
  updateConfig: (config: Partial<GlobalSelectConfig>) => void;
  /** Set items */
  setItems: (items: unknown[]) => void;
}

export const Select = forwardRef<ReactSelectRef, ReactSelectProps>((props, ref) => {
  const {
    items = [],
    initialSelectedValues,
    selectedValues,
    onSelectionChange,
    onOptionSelect,
    onOpen,
    onClose,
    onSearch,
    onLoadMore,
    onError,
    className,
    style,
    ...config
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<EnhancedSelect | null>(null);

  // Initialize select component
  useEffect(() => {
    if (!containerRef.current) return;

    const select = document.createElement('enhanced-select') as EnhancedSelect;
    containerRef.current.appendChild(select);
    selectRef.current = select;

    // Apply configuration
    select.updateConfig({
      ...config,
      callbacks: {
        onSelect: onOptionSelect,
        onOpen,
        onClose,
        onSearch,
        onLoadMore,
        onError,
        onChange: onSelectionChange,
      },
    });

    // Set initial items
    if (items.length > 0) {
      select.setItems(items);
    }

    // Set initial selected values
    if (initialSelectedValues) {
      select.setSelectedValues(initialSelectedValues);
    }

    // Event listeners
    const handleChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      onSelectionChange?.(customEvent.detail.selectedItems, customEvent.detail.selectedValues);
    };

    select.addEventListener('change', handleChange);

    return () => {
      select.removeEventListener('change', handleChange);
      if (containerRef.current) {
        containerRef.current.removeChild(select);
      }
    };
  }, []);

  // Update items when they change
  useEffect(() => {
    if (selectRef.current && items) {
      selectRef.current.setItems(items);
    }
  }, [items]);

  // Handle controlled selected values
  useEffect(() => {
    if (selectRef.current && selectedValues !== undefined) {
      selectRef.current.setSelectedValues(selectedValues);
    }
  }, [selectedValues]);

  // Update configuration when props change
  useEffect(() => {
    if (selectRef.current) {
      selectRef.current.updateConfig(config);
    }
  }, [config]);

  // Expose imperative handle
  useImperativeHandle(ref, () => ({
    getSelectedItems: () => selectRef.current?.getSelectedItems() || [],
    getSelectedValues: () => selectRef.current?.getSelectedValues() || [],
    setSelectedValues: async (values: unknown[]) => {
      await selectRef.current?.setSelectedValues(values);
    },
    clear: () => selectRef.current?.clear(),
    open: () => selectRef.current?.open(),
    close: () => selectRef.current?.close(),
    updateConfig: (config: Partial<GlobalSelectConfig>) => selectRef.current?.updateConfig(config),
    setItems: (items: unknown[]) => selectRef.current?.setItems(items),
  }));

  return <div ref={containerRef} className={className} style={style} />;
});

Select.displayName = 'Select';

// Export configuration helpers
export { configureSelect, resetSelectConfig } from '@smilodon/core';
