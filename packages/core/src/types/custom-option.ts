/**
 * Custom Option Rendering System
 * 
 * This module provides types and contracts for rendering custom framework components
 * as select options, enabling deep customization while maintaining performance and cohesion.
 */

/**
 * Contract that custom option components must implement
 * 
 * Custom components must expose these methods to integrate with the select system:
 * - `mountOption()`: Called when the option is added to DOM
 * - `unmountOption()`: Called when the option is removed from DOM
 * - `updateSelected()`: Called when selection state changes
 * - `getElement()`: Returns the root DOM element
 */
export interface CustomOptionContract {
  /**
   * Mount the component into the provided container
   * @param container - The DOM element to mount into
   * @param context - Context data including selection state and callbacks
   */
  mountOption(container: HTMLElement, context: CustomOptionContext): void;
  
  /**
   * Unmount and cleanup the component
   */
  unmountOption(): void;
  
  /**
   * Update the component when selection state changes
   * @param selected - Whether this option is currently selected
   */
  updateSelected(selected: boolean): void;
  
  /**
   * Get the root DOM element of the component
   * @returns The root element that receives click events
   */
  getElement(): HTMLElement;
  
  /**
   * Optional: Handle when the option becomes focused (keyboard navigation)
   * @param focused - Whether this option has keyboard focus
   */
  updateFocused?(focused: boolean): void;
  
  /**
   * Optional: Handle when the option becomes disabled
   * @param disabled - Whether this option is disabled
   */
  updateDisabled?(disabled: boolean): void;
}

/**
 * Context provided to custom option components
 */
export interface CustomOptionContext {
  /** The item data */
  item: unknown;
  
  /** The index of this option in the list */
  index: number;
  
  /** The value extracted from the item */
  value: unknown;
  
  /** The label extracted from the item */
  label: string;
  
  /** Whether this option is currently selected */
  isSelected: boolean;
  
  /** Whether this option currently has keyboard focus */
  isFocused: boolean;
  
  /** Whether the option is disabled */
  isDisabled: boolean;
  
  /** Callback to notify the select that this option was clicked */
  onSelect: (index: number) => void;
  
  /** Callback to notify custom events from the option */
  onCustomEvent?: (eventName: string, data: unknown) => void;
}

/**
 * Factory function signature for creating custom option instances
 * 
 * @param item - The data item for this option
 * @param index - The index in the list
 * @returns A new instance implementing CustomOptionContract
 */
export type CustomOptionFactory = (item: unknown, index: number) => CustomOptionContract;

/**
 * Extended item type supporting custom components
 * 
 * Items can now include:
 * - Traditional: { label: string, value: any }
 * - Custom Component: { label: string, value: any, optionComponent: CustomOptionFactory }
 */
export interface ExtendedSelectItem {
  /** Display label (still required for accessibility and fallback) */
  label: string;
  
  /** Value used for selection */
  value: unknown;
  
  /** Optional: Custom component factory for rendering this option */
  optionComponent?: CustomOptionFactory;
  
  /** Optional: Whether this option is disabled */
  disabled?: boolean;
  
  /** Any additional data */
  [key: string]: unknown;
}

/**
 * Renderer mode for the select component
 */
export type OptionRendererMode = 'lightweight' | 'component';

/**
 * Configuration for custom option rendering
 */
export interface CustomOptionConfig {
  /** Default renderer mode when no component specified */
  defaultMode: OptionRendererMode;
  
  /** Enable performance optimizations for component rendering */
  enableVirtualization: boolean;
  
  /** Recycle component instances when scrolling (for large lists) */
  enableComponentRecycling: boolean;
  
  /** Maximum component instances to keep in pool */
  maxComponentPoolSize: number;
}

/**
 * Events emitted by custom option components
 */
export interface CustomOptionEvents {
  /** Custom component emitted an event */
  'option:custom-event': {
    index: number;
    eventName: string;
    data: unknown;
  };
  
  /** Component failed to mount */
  'option:mount-error': {
    index: number;
    error: Error;
  };
  
  /** Component lifecycle event for debugging */
  'option:lifecycle': {
    index: number;
    phase: 'mount' | 'unmount' | 'update';
  };
}
