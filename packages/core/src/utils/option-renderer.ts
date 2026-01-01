/**
 * Option Renderer
 * 
 * Unified renderer that handles both lightweight (label/value) and 
 * custom component rendering with consistent performance characteristics.
 */

import type { 
  CustomOptionContract, 
  CustomOptionContext, 
  CustomOptionFactory, 
  ExtendedSelectItem 
} from '../types/custom-option';
import { CustomOptionPool } from './custom-option-pool';

export interface OptionRendererConfig {
  enableRecycling: boolean;
  maxPoolSize: number;
  getValue: (item: unknown) => unknown;
  getLabel: (item: unknown) => string;
  getDisabled?: (item: unknown) => boolean;
  onSelect: (index: number) => void;
  onCustomEvent?: (index: number, eventName: string, data: unknown) => void;
  onError?: (index: number, error: Error) => void;
}

/**
 * Manages rendering of both lightweight and custom component options
 */
export class OptionRenderer {
  private _config: OptionRendererConfig;
  private _pool: CustomOptionPool;
  private _mountedElements: Map<number, HTMLElement> = new Map();
  
  constructor(config: OptionRendererConfig) {
    this._config = config;
    this._pool = new CustomOptionPool(config.maxPoolSize);
  }
  
  /**
   * Render an option (lightweight or custom component)
   * 
   * @param item - The data item
   * @param index - The option index
   * @param isSelected - Whether the option is selected
   * @param isFocused - Whether the option has keyboard focus
   * @param uniqueId - Unique ID for the select instance
   * @returns The rendered DOM element
   */
  render(
    item: unknown,
    index: number,
    isSelected: boolean,
    isFocused: boolean,
    uniqueId: string
  ): HTMLElement {
    const extendedItem = item as ExtendedSelectItem;
    const value = this._config.getValue(item);
    const label = this._config.getLabel(item);
    const isDisabled = this._config.getDisabled ? this._config.getDisabled(item) : false;
    
    // Determine if this is a custom component or lightweight option
    const hasCustomComponent = extendedItem.optionComponent && typeof extendedItem.optionComponent === 'function';
    
    if (hasCustomComponent) {
      return this._renderCustomComponent(
        item,
        index,
        value,
        label,
        isSelected,
        isFocused,
        isDisabled,
        uniqueId,
        extendedItem.optionComponent!
      );
    } else {
      return this._renderLightweightOption(
        item,
        index,
        value,
        label,
        isSelected,
        isFocused,
        isDisabled,
        uniqueId
      );
    }
  }
  
  /**
   * Update selection state for an option
   * 
   * @param index - The option index
   * @param selected - Whether it's selected
   */
  updateSelection(index: number, selected: boolean): void {
    const element = this._mountedElements.get(index);
    if (!element) return;
    
    // Check if this is a custom component
    const component = this._pool.getComponent(index);
    if (component) {
      component.updateSelected(selected);
    } else {
      // Update lightweight option
      if (selected) {
        element.classList.add('selected');
        element.setAttribute('aria-selected', 'true');
      } else {
        element.classList.remove('selected');
        element.setAttribute('aria-selected', 'false');
      }
    }
  }
  
  /**
   * Update focused state for an option
   * 
   * @param index - The option index
   * @param focused - Whether it has keyboard focus
   */
  updateFocused(index: number, focused: boolean): void {
    const element = this._mountedElements.get(index);
    if (!element) return;
    
    // Check if this is a custom component
    const component = this._pool.getComponent(index);
    if (component) {
      if (component.updateFocused) {
        component.updateFocused(focused);
      }
      // Also update the element's focused class for styling
      element.classList.toggle('focused', focused);
    } else {
      // Update lightweight option
      element.classList.toggle('focused', focused);
    }
  }
  
  /**
   * Unmount and cleanup an option
   * 
   * @param index - The option index
   */
  unmount(index: number): void {
    // Release custom component if exists
    this._pool.release(index);
    
    // Remove from mounted elements
    this._mountedElements.delete(index);
  }
  
  /**
   * Unmount all options
   */
  unmountAll(): void {
    this._pool.releaseAll();
    this._mountedElements.clear();
  }
  
  /**
   * Get pool statistics
   */
  getStats() {
    return this._pool.getStats();
  }
  
  /**
   * Render a lightweight option (traditional label/value)
   */
  private _renderLightweightOption(
    item: unknown,
    index: number,
    value: unknown,
    label: string,
    isSelected: boolean,
    isFocused: boolean,
    isDisabled: boolean,
    uniqueId: string
  ): HTMLElement {
    const option = document.createElement('div');
    option.className = 'option';
    if (isSelected) option.classList.add('selected');
    if (isFocused) option.classList.add('focused');
    if (isDisabled) option.classList.add('disabled');
    
    option.id = `${uniqueId}-option-${index}`;
    option.textContent = label;
    option.dataset.value = String(value);
    option.dataset.index = String(index);
    option.dataset.mode = 'lightweight';
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', String(isSelected));
    if (isDisabled) {
      option.setAttribute('aria-disabled', 'true');
    }
    
    // Click handler
    if (!isDisabled) {
      option.addEventListener('click', () => {
        this._config.onSelect(index);
      });
    }
    
    this._mountedElements.set(index, option);
    
    
    return option;
  }
  
  /**
   * Render a custom component option
   */
  private _renderCustomComponent(
    item: unknown,
    index: number,
    value: unknown,
    label: string,
    isSelected: boolean,
    isFocused: boolean,
    isDisabled: boolean,
    uniqueId: string,
    factory: CustomOptionFactory
  ): HTMLElement {
    // Create wrapper container for the custom component
    const wrapper = document.createElement('div');
    wrapper.className = 'option option-custom';
    if (isSelected) wrapper.classList.add('selected');
    if (isFocused) wrapper.classList.add('focused');
    if (isDisabled) wrapper.classList.add('disabled');
    
    wrapper.id = `${uniqueId}-option-${index}`;
    wrapper.dataset.value = String(value);
    wrapper.dataset.index = String(index);
    wrapper.dataset.mode = 'component';
    wrapper.setAttribute('role', 'option');
    wrapper.setAttribute('aria-selected', String(isSelected));
    wrapper.setAttribute('aria-label', label); // Accessibility fallback
    if (isDisabled) {
      wrapper.setAttribute('aria-disabled', 'true');
    }
    
    // Create context for the custom component
    const context: CustomOptionContext = {
      item,
      index,
      value,
      label,
      isSelected,
      isFocused,
      isDisabled,
      onSelect: (idx: number) => {
        if (!isDisabled) {
          this._config.onSelect(idx);
        }
      },
      onCustomEvent: (eventName: string, data: unknown) => {
        if (this._config.onCustomEvent) {
          this._config.onCustomEvent(index, eventName, data);
        }
      }
    };
    
    // Acquire component from pool and mount it
    try {
      const component = this._pool.acquire(factory, item, index, context, wrapper);
      
      // Get the component's root element and attach click handler to wrapper
      const componentElement = component.getElement();
      
      if (!isDisabled) {
        // Use event delegation on the wrapper
        wrapper.addEventListener('click', (e) => {
          // Only trigger if clicking within the component
          if (wrapper.contains(e.target as Node)) {
            this._config.onSelect(index);
          }
        });
      }
      
      
    } catch (error) {
      console.error(`[OptionRenderer] Failed to render custom component at index ${index}:`, error);
      
      // Fallback to lightweight rendering on error
      wrapper.innerHTML = '';
      wrapper.textContent = label;
      wrapper.classList.add('component-error');
      
      if (this._config.onError) {
        this._config.onError(index, error as Error);
      }
    }
    
    this._mountedElements.set(index, wrapper);
    
    return wrapper;
  }
}
