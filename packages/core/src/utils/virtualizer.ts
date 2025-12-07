import { FenwickTree } from './fenwick-tree.js';
import { DOMPool } from './dom-pool.js';

type ItemGetter = (index: number) => unknown;

export interface VirtualizerOptions {
  estimatedItemHeight: number;
  buffer: number;
  maxPoolExtra?: number; // extra nodes beyond window size
  measurementThreshold?: number; // px change to consider a height update
  enableTelemetry?: boolean; // enable pool stats
}

export class Virtualizer {
  private container: HTMLElement;
  private itemsLength: number;
  private options: VirtualizerOptions;
  measuredHeights = new Map<number, number>();
  averageHeight: number;
  private pool: DOMPool;
  private itemGetter: ItemGetter;
  private fenwick?: FenwickTree;
  private activeNodes = new Map<number, HTMLElement>(); // index -> node mapping

  constructor(container: HTMLElement, itemsLength: number, itemGetter: ItemGetter, options: VirtualizerOptions) {
    this.container = container;
    this.itemsLength = itemsLength;
    this.itemGetter = itemGetter;
    this.options = options;
    this.averageHeight = options.estimatedItemHeight;
    
    // Initialize DOM pool with LRU eviction
    const maxPoolSize = Math.ceil((options.buffer * 2 + 10) * 1.5) + (options.maxPoolExtra ?? 32);
    this.pool = new DOMPool({
      maxSize: maxPoolSize,
      factory: () => {
        const div = document.createElement('div');
        div.setAttribute('data-selectable', '');
        return div;
      },
      reset: (node) => {
        // Clear content but preserve data-selectable
        node.textContent = '';
        node.removeAttribute('style');
        // Remove aria attributes
        node.removeAttribute('aria-selected');
        node.removeAttribute('aria-checked');
      },
      telemetry: options.enableTelemetry || false,
    });

    // Use Fenwick tree for large lists (>5000 items)
    if (itemsLength > 5000) {
      this.fenwick = new FenwickTree(itemsLength);
      // Initialize with estimated heights
      for (let i = 0; i < itemsLength; i++) {
        this.fenwick.add(i, options.estimatedItemHeight);
      }
    }
    
    this.container.style.willChange = 'transform';
  }

  computeWindow(scrollTop: number, viewportHeight: number) {
    const { buffer } = this.options;
    const startIndex = Math.max(Math.floor(scrollTop / this.averageHeight) - buffer, 0);
    const endIndex = Math.min(Math.ceil((scrollTop + viewportHeight) / this.averageHeight) + buffer, this.itemsLength - 1);
    const windowSize = Math.max(0, endIndex - startIndex + 1);
    
    // Adjust pool size dynamically based on window
    const newPoolSize = windowSize + (this.options.maxPoolExtra ?? 32);
    this.pool.setMaxSize(newPoolSize);
    
    return { startIndex, endIndex, windowSize };
  }

  cumulativeOffset(index: number): number {
    if (index <= 0) return 0;
    
    // Use Fenwick tree for O(log n) prefix sum
    if (this.fenwick) {
      return this.fenwick.sum(index - 1);
    }
    
    // Fallback: approximate using average height with sparse adjustments
    let total = 0;
    for (let i = 0; i < index; i++) {
      total += this.measuredHeights.get(i) ?? this.averageHeight;
    }
    return total;
  }

  acquireNode(index: number): HTMLElement {
    // Check if we already have this node active (reuse)
    const existing = this.activeNodes.get(index);
    if (existing) return existing;
    
    const node = this.pool.acquire();
    node.setAttribute('data-index', String(index));
    this.activeNodes.set(index, node);
    return node;
  }

  releaseNode(index: number): void {
    const node = this.activeNodes.get(index);
    if (node) {
      this.pool.release(node);
      this.activeNodes.delete(index);
    }
  }

  releaseExcess(activeIndices: Set<number>): void {
    // Release nodes not in active set
    for (const [index, node] of this.activeNodes) {
      if (!activeIndices.has(index)) {
        this.pool.release(node);
        this.activeNodes.delete(index);
      }
    }
  }

  render(startIndex: number, endIndex: number, updateNode: (node: HTMLElement, item: unknown, index: number) => void) {
    const frag = document.createDocumentFragment();
    const activeIndices = new Set<number>();
    
    for (let i = startIndex; i <= endIndex; i++) {
      const node = this.acquireNode(i);
      updateNode(node, this.itemGetter(i), i);
      frag.appendChild(node);
      activeIndices.add(i);
      
      // Measure on appear (deferred)
      queueMicrotask(() => this.measureOnAppear(node, i));
    }
    
    // Translate container by cumulative offset of startIndex
    const topOffset = this.cumulativeOffset(startIndex);
    this.container.style.transform = `translate3d(0, ${Math.round(topOffset * 100) / 100}px, 0)`;
    this.container.replaceChildren(frag);
    
    // Recycle nodes not in use
    requestAnimationFrame(() => this.releaseExcess(activeIndices));
  }

  measureOnAppear(node: HTMLElement, index: number) {
    const h = node.offsetHeight;
    const prev = this.measuredHeights.get(index);
    const threshold = this.options.measurementThreshold ?? 5;
    
    if (prev === undefined || Math.abs(prev - h) > threshold) {
      const oldValue = prev ?? this.averageHeight;
      this.measuredHeights.set(index, h);
      
      // Update Fenwick tree with new measurement
      if (this.fenwick) {
        this.fenwick.update(index, oldValue, h);
      }
      
      // Update running average (weighted by measured count)
      const count = this.measuredHeights.size;
      const total = Array.from(this.measuredHeights.values()).reduce((a, b) => a + b, 0);
      this.averageHeight = Math.round((total / count) * 100) / 100;
    }
  }

  /**
   * Get pool statistics (if telemetry enabled)
   */
  getPoolStats() {
    return this.pool.getStats();
  }

  /**
   * Update items length and resize Fenwick tree if needed
   */
  setItemsLength(newLength: number): void {
    this.itemsLength = newLength;
    
    if (this.fenwick) {
      this.fenwick.resize(newLength);
    } else if (newLength > 5000 && !this.fenwick) {
      // Activate Fenwick tree when crossing threshold
      this.fenwick = new FenwickTree(newLength);
      
      // Populate with existing measurements
      for (const [index, height] of this.measuredHeights) {
        this.fenwick.update(index, this.averageHeight, height);
      }
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.pool.clear();
    this.activeNodes.clear();
    this.measuredHeights.clear();
    if (this.fenwick) {
      this.fenwick.reset();
    }
  }
}
