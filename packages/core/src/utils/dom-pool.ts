/**
 * DOM Node Pool with LRU eviction and aggressive cleanup.
 * Reuses nodes to minimize GC pressure and layout thrashing.
 * 
 * Features:
 * - LRU eviction when pool exceeds maxSize
 * - Style reset to avoid style pollution
 * - Event listener cleanup
 * - Performance telemetry integration
 */

interface PoolNode {
  node: HTMLElement;
  lastUsed: number; // performance.now() timestamp
  inUse: boolean;
}

export interface DOMPoolOptions {
  /** Maximum pool size (default: renderedNodes + 32) */
  maxSize?: number;
  /** Factory function to create new nodes */
  factory: () => HTMLElement;
  /** Reset function called before reuse */
  reset?: (node: HTMLElement) => void;
  /** Enable performance telemetry */
  telemetry?: boolean;
}

export class DOMPool {
  private pool: PoolNode[] = [];
  private factory: () => HTMLElement;
  private reset: (node: HTMLElement) => void;
  private maxSize: number;
  private telemetry: boolean;
  
  // Telemetry
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(options: DOMPoolOptions) {
    this.factory = options.factory;
    this.reset = options.reset || this.defaultReset.bind(this);
    this.maxSize = options.maxSize || 64;
    this.telemetry = options.telemetry || false;
  }

  /**
   * Acquire a node from pool or create new one
   * Complexity: O(n) for LRU scan, amortized O(1) for small pools
   */
  acquire(): HTMLElement {
    const now = performance.now();

    // Find first available node
    for (let i = 0; i < this.pool.length; i++) {
      const poolNode = this.pool[i];
      if (!poolNode.inUse) {
        poolNode.inUse = true;
        poolNode.lastUsed = now;
        this.reset(poolNode.node);
        
        if (this.telemetry) this.hits++;
        return poolNode.node;
      }
    }

    // No available nodes, create new one
    const node = this.factory();
    this.pool.push({
      node,
      lastUsed: now,
      inUse: true,
    });

    if (this.telemetry) this.misses++;

    // Evict if pool too large
    if (this.pool.length > this.maxSize) {
      this.evictLRU();
    }

    return node;
  }

  /**
   * Release node back to pool
   * Complexity: O(n) to find node
   */
  release(node: HTMLElement): void {
    const poolNode = this.pool.find(p => p.node === node);
    if (poolNode) {
      poolNode.inUse = false;
      poolNode.lastUsed = performance.now();
      
      // Aggressive cleanup
      this.reset(poolNode.node);
    }
  }

  /**
   * Evict least recently used node
   * Complexity: O(n)
   */
  private evictLRU(): void {
    // Find LRU node that's not in use
    let lruIndex = -1;
    let oldestTime = Infinity;

    for (let i = 0; i < this.pool.length; i++) {
      const poolNode = this.pool[i];
      if (!poolNode.inUse && poolNode.lastUsed < oldestTime) {
        lruIndex = i;
        oldestTime = poolNode.lastUsed;
      }
    }

    if (lruIndex >= 0) {
      const evicted = this.pool.splice(lruIndex, 1)[0];
      // Full cleanup before GC
      this.deepCleanup(evicted.node);
      
      if (this.telemetry) this.evictions++;
    }
  }

  /**
   * Default reset: clear content, remove inline styles, remove attributes
   */
  private defaultReset(node: HTMLElement): void {
    // Clear content
    node.textContent = '';
    
    // Remove inline styles
    node.removeAttribute('style');
    
    // Remove data attributes (preserve data-index, data-selectable for delegation)
    const attrs = Array.from(node.attributes);
    for (const attr of attrs) {
      if (attr.name.startsWith('data-') && 
          attr.name !== 'data-index' && 
          attr.name !== 'data-selectable') {
        node.removeAttribute(attr.name);
      }
    }
    
    // Remove ARIA attributes that might pollute reuse
    const ariaAttrs = ['aria-selected', 'aria-checked', 'aria-disabled'];
    ariaAttrs.forEach(attr => node.removeAttribute(attr));
  }

  /**
   * Deep cleanup before eviction/destruction
   */
  private deepCleanup(node: HTMLElement): void {
    // Remove all event listeners by cloning (nuclear option)
    const clone = node.cloneNode(true) as HTMLElement;
    node.parentNode?.replaceChild(clone, node);
    
    // Clear references
    node.textContent = '';
  }

  /**
   * Clear entire pool
   */
  clear(): void {
    for (const poolNode of this.pool) {
      this.deepCleanup(poolNode.node);
    }
    this.pool = [];
    this.resetTelemetry();
  }

  /**
   * Adjust max pool size dynamically
   */
  setMaxSize(size: number): void {
    this.maxSize = size;
    // Evict excess nodes
    while (this.pool.length > this.maxSize) {
      this.evictLRU();
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    const available = this.pool.filter(p => !p.inUse).length;
    const hitRate = this.hits + this.misses > 0 
      ? this.hits / (this.hits + this.misses) 
      : 0;

    return {
      total: this.pool.length,
      available,
      inUse: this.pool.length - available,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      hitRate,
    };
  }

  /**
   * Reset telemetry counters
   */
  resetTelemetry(): void {
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }
}
