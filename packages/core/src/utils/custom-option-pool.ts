/**
 * Custom Option Component Pool
 * 
 * Manages lifecycle and recycling of custom option components for optimal performance.
 * Uses object pooling pattern to minimize allocation/deallocation overhead.
 */

import type { CustomOptionContract, CustomOptionContext, CustomOptionFactory } from '../types/custom-option';

interface PooledComponent {
  instance: CustomOptionContract;
  inUse: boolean;
  lastUsedIndex: number;
}

/**
 * Manages a pool of reusable custom option component instances
 */
export class CustomOptionPool {
  private _pool: Map<string, PooledComponent[]> = new Map();
  private _maxPoolSize: number;
  private _activeComponents: Map<number, CustomOptionContract> = new Map();
  
  constructor(maxPoolSize = 50) {
    this._maxPoolSize = maxPoolSize;
  }
  
  /**
   * Get or create a component instance for the given index
   * 
   * @param factory - Factory function to create new instances
   * @param item - The data item
   * @param index - The option index
   * @param context - Context for mounting
   * @param container - DOM container for mounting
   * @returns Component instance
   */
  acquire(
    factory: CustomOptionFactory,
    item: unknown,
    index: number,
    context: CustomOptionContext,
    container: HTMLElement
  ): CustomOptionContract {
    const factoryKey = this._getFactoryKey(factory);
    
    // Try to find an available component in the pool
    const pooled = this._findAvailableComponent(factoryKey);
    
    let component: CustomOptionContract;
    
    if (pooled) {
      // Reuse pooled component
      component = pooled.instance;
      pooled.inUse = true;
      pooled.lastUsedIndex = index;
    } else {
      // Create new component
      try {
        component = factory(item, index);
        
        // Add to pool if under limit
        const pool = this._pool.get(factoryKey) || [];
        if (pool.length < this._maxPoolSize) {
          pool.push({
            instance: component,
            inUse: true,
            lastUsedIndex: index
          });
          this._pool.set(factoryKey, pool);
        }
      } catch (error) {
        console.error(`[CustomOptionPool] Failed to create component:`, error);
        throw error;
      }
    }
    
    // Mount the component
    try {
      component.mountOption(container, context);
      this._activeComponents.set(index, component);
    } catch (error) {
      console.error(`[CustomOptionPool] Failed to mount component at index ${index}:`, error);
      throw error;
    }
    
    return component;
  }
  
  /**
   * Release a component back to the pool
   * 
   * @param index - The index of the component to release
   */
  release(index: number): void {
    const component = this._activeComponents.get(index);
    if (!component) return;
    
    try {
      component.unmountOption();
    } catch (error) {
      console.error(`[CustomOptionPool] Failed to unmount component at index ${index}:`, error);
    }
    
    this._activeComponents.delete(index);
    
    // Mark as available in pool
    for (const pool of this._pool.values()) {
      const pooled = pool.find(p => p.instance === component);
      if (pooled) {
        pooled.inUse = false;
        break;
      }
    }
  }
  
  /**
   * Release all active components
   */
  releaseAll(): void {
    const indices = Array.from(this._activeComponents.keys());
    indices.forEach(index => this.release(index));
  }
  
  /**
   * Update selection state for a component
   * 
   * @param index - The index of the component
   * @param selected - Whether it's selected
   */
  updateSelection(index: number, selected: boolean): void {
    const component = this._activeComponents.get(index);
    if (component) {
      component.updateSelected(selected);
    }
  }
  
  /**
   * Update focused state for a component
   * 
   * @param index - The index of the component
   * @param focused - Whether it has keyboard focus
   */
  updateFocused(index: number, focused: boolean): void {
    const component = this._activeComponents.get(index);
    if (component && component.updateFocused) {
      component.updateFocused(focused);
    }
  }
  
  /**
   * Get active component at index
   * 
   * @param index - The option index
   * @returns The component instance or undefined
   */
  getComponent(index: number): CustomOptionContract | undefined {
    return this._activeComponents.get(index);
  }
  
  /**
   * Clear the entire pool
   */
  clear(): void {
    this.releaseAll();
    this._pool.clear();
  }
  
  /**
   * Get pool statistics for debugging
   */
  getStats(): { totalPooled: number; activeComponents: number; availableComponents: number } {
    let totalPooled = 0;
    let availableComponents = 0;
    
    for (const pool of this._pool.values()) {
      totalPooled += pool.length;
      availableComponents += pool.filter(p => !p.inUse).length;
    }
    
    return {
      totalPooled,
      activeComponents: this._activeComponents.size,
      availableComponents
    };
  }
  
  /**
   * Find an available component in the pool
   */
  private _findAvailableComponent(factoryKey: string): PooledComponent | undefined {
    const pool = this._pool.get(factoryKey);
    if (!pool) return undefined;
    
    return pool.find(p => !p.inUse);
  }
  
  /**
   * Generate a unique key for a factory function
   */
  private _getFactoryKey(factory: CustomOptionFactory): string {
    // Use function name or create a symbol
    return factory.name || `factory_${factory.toString().slice(0, 50)}`;
  }
}
