import React, { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import type {
  NativeSelectOptions,
  SelectEventDetail,
  OpenEventDetail,
  CloseEventDetail,
  SearchEventDetail,
} from '@native-select/core';

export interface NativeSelectProps extends Partial<NativeSelectOptions> {
  /** List of items to render */
  items?: unknown[];
  /** Enable multi-select */
  multi?: boolean;
  /** Popup placement */
  placement?: 'top' | 'bottom';
  /** Estimated item height */
  estimatedItemHeight?: number;
  /** Render buffer size */
  buffer?: number;
  /** Class name for custom styling */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  
  // Event handlers
  onSelect?: (detail: SelectEventDetail) => void;
  onOpen?: (detail: OpenEventDetail) => void;
  onClose?: (detail: CloseEventDetail) => void;
  onSearch?: (detail: SearchEventDetail) => void;
}

export interface NativeSelectHandle {
  focus: () => void;
  open: () => void;
  close: () => void;
  readonly selectedIndices: number[];
  readonly selectedItems: unknown[];
  readonly activeIndex: number;
}

/**
 * React adapter for @native-select/core
 * Thin wrapper that maps React props to Custom Element
 */
export const NativeSelect = forwardRef<NativeSelectHandle, NativeSelectProps>(
  (props, ref) => {
    const {
      items,
      multi,
      placement,
      estimatedItemHeight,
      buffer,
      className,
      style,
      onSelect,
      onOpen,
      onClose,
      onSearch,
      ...rest
    } = props;

    const elementRef = useRef<any>(null);

    // Register custom element if not already registered
    useEffect(() => {
      if (typeof window !== 'undefined' && !customElements.get('native-select')) {
        import('@native-select/core').then((module) => {
          if (!customElements.get('native-select')) {
            customElements.define('native-select', module.NativeSelectElement);
          }
        });
      }
    }, []);

    // Sync items prop
    useEffect(() => {
      if (elementRef.current && items) {
        elementRef.current.items = items;
      }
    }, [items]);

    // Sync multi prop
    useEffect(() => {
      if (elementRef.current && multi !== undefined) {
        elementRef.current.multi = multi;
      }
    }, [multi]);

    // Sync placement prop
    useEffect(() => {
      if (elementRef.current && placement) {
        elementRef.current.placement = placement;
      }
    }, [placement]);

    // Sync estimatedItemHeight
    useEffect(() => {
      if (elementRef.current && estimatedItemHeight !== undefined) {
        elementRef.current.estimatedItemHeight = estimatedItemHeight;
      }
    }, [estimatedItemHeight]);

    // Sync buffer
    useEffect(() => {
      if (elementRef.current && buffer !== undefined) {
        elementRef.current.buffer = buffer;
      }
    }, [buffer]);

    // Event handlers
    useEffect(() => {
      const element = elementRef.current;
      if (!element) return;

      const handleSelect = (e: CustomEvent<SelectEventDetail>) => {
        onSelect?.(e.detail);
      };
      const handleOpen = (e: CustomEvent<OpenEventDetail>) => {
        onOpen?.(e.detail);
      };
      const handleClose = (e: CustomEvent<CloseEventDetail>) => {
        onClose?.(e.detail);
      };
      const handleSearch = (e: CustomEvent<SearchEventDetail>) => {
        onSearch?.(e.detail);
      };

      element.addEventListener('select', handleSelect);
      element.addEventListener('open', handleOpen);
      element.addEventListener('close', handleClose);
      element.addEventListener('search', handleSearch);

      return () => {
        element.removeEventListener('select', handleSelect);
        element.removeEventListener('open', handleOpen);
        element.removeEventListener('close', handleClose);
        element.removeEventListener('search', handleSearch);
      };
    }, [onSelect, onOpen, onClose, onSearch]);

    // Expose imperative handle
    useImperativeHandle(ref, () => ({
      focus: () => elementRef.current?.focus(),
      open: () => elementRef.current?.open(),
      close: () => elementRef.current?.close(),
      get selectedIndices() {
        return elementRef.current?.selectedIndices || [];
      },
      get selectedItems() {
        return elementRef.current?.selectedItems || [];
      },
      get activeIndex() {
        return elementRef.current?.activeIndex || -1;
      },
    }));

    return React.createElement('native-select', {
      ref: elementRef,
      className,
      style,
      ...rest,
    });
  }
);

NativeSelect.displayName = 'NativeSelect';

/**
 * Hook for idiomatic React usage
 * Provides refs and event handlers
 */
export function useNativeSelect() {
  const ref = useRef<NativeSelectHandle>(null);

  const focus = useCallback(() => {
    ref.current?.focus();
  }, []);

  const open = useCallback(() => {
    ref.current?.open();
  }, []);

  const close = useCallback(() => {
    ref.current?.close();
  }, []);

  const getSelectedIndices = useCallback(() => {
    return ref.current?.selectedIndices || [];
  }, []);

  const getSelectedItems = useCallback(() => {
    return ref.current?.selectedItems || [];
  }, []);

  const getActiveIndex = useCallback(() => {
    return ref.current?.activeIndex || -1;
  }, []);

  return {
    ref,
    focus,
    open,
    close,
    getSelectedIndices,
    getSelectedItems,
    getActiveIndex,
  };
}
