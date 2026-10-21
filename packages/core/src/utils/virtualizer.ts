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

export interface VirtualizerScrollResult {
  /** Clamped target index in the current item set. */
  index: number;
  /** Prefix-sum offset for the target item. */
  offset: number;
  /** Intended container scrollTop; the caller owns applying it to the DOM. */
  scrollTop: number;
}

export interface VirtualizerWindow {
  startIndex: number;
  endIndex: number;
  windowSize: number;
}

export interface VirtualizerWindowUpdate {
  window: VirtualizerWindow;
  changed: boolean;
  scrollTop: number;
  viewportHeight: number;
}

export class Virtualizer {
  private container: HTMLElement;
  private itemsLength: number;
  private options: VirtualizerOptions;
  private readonly estimatedItemHeight: number;
  measuredHeights = new Map<number, number>();
  private measuredHeightTotal = 0;
  averageHeight: number;
  private pool: DOMPool;
  private itemGetter: ItemGetter;
  private fenwick: FenwickTree;
  private activeNodes = new Map<number, HTMLElement>(); // index -> node mapping
  private destroyed = false;
  private recycleRafId = 0;
  private intendedScrollTop = 0;
  private currentWindow: VirtualizerWindow | null = null;

  constructor(container: HTMLElement, itemsLength: number, itemGetter: ItemGetter, options: VirtualizerOptions) {
    this.container = container;
    this.itemsLength = itemsLength;
    this.itemGetter = itemGetter;
    this.options = options;
    this.estimatedItemHeight = options.estimatedItemHeight;
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

    // One prefix index keeps offset, window, and scroll calculations on the
    // same measured-height policy at every list size.
    this.fenwick = this.createFenwickTree(itemsLength);
    
    this.container.style.willChange = 'transform';
  }

  computeWindow(scrollTop: number, viewportHeight: number) {
    const { buffer } = this.options;
    const visibleStartIndex = this.indexAtOffset(scrollTop);
    const calculatedStartIndex = visibleStartIndex - buffer;
    const startIndex = this.itemsLength > 0
      ? Math.max(0, Math.min(this.itemsLength - 1, calculatedStartIndex))
      : 0;
    const viewportEnd = Math.max(0, scrollTop + viewportHeight);
    let visibleEndIndex = this.indexAtOffset(viewportEnd);
    // The item beginning exactly at the viewport's lower edge is not visible.
    // indexAtOffset deliberately advances across exact boundaries for the
    // viewport start, so reverse that choice here when the viewport has height.
    if (
      viewportHeight > 0
      && visibleEndIndex > visibleStartIndex
      && this.cumulativeOffset(visibleEndIndex) === viewportEnd
    ) {
      visibleEndIndex -= 1;
    }
    const calculatedEndIndex = Math.max(visibleStartIndex, visibleEndIndex) + buffer;
    const endIndex = this.itemsLength > 0
      ? Math.max(0, Math.min(this.itemsLength - 1, calculatedEndIndex))
      : -1;
    const windowSize = Math.max(0, endIndex - startIndex + 1);
    
    // Adjust pool size dynamically based on window
    const newPoolSize = windowSize + (this.options.maxPoolExtra ?? 32);
    this.pool.setMaxSize(newPoolSize);
    
    return { startIndex, endIndex, windowSize };
  }

  /** Computes and records a scroll-derived window without installing listeners. */
  updateWindow(scrollTop: number, viewportHeight: number): VirtualizerWindowUpdate | null {
    if (this.destroyed) return null;

    const safeScrollTop = Number.isFinite(scrollTop) ? Math.max(0, scrollTop) : 0;
    const safeViewportHeight = Number.isFinite(viewportHeight) && viewportHeight >= 0
      ? viewportHeight
      : 0;
    const nextWindow = this.computeWindow(safeScrollTop, safeViewportHeight);
    const changed = this.currentWindow === null
      || this.currentWindow.startIndex !== nextWindow.startIndex
      || this.currentWindow.endIndex !== nextWindow.endIndex
      || this.currentWindow.windowSize !== nextWindow.windowSize;

    this.currentWindow = { ...nextWindow };
    return {
      window: { ...nextWindow },
      changed,
      scrollTop: safeScrollTop,
      viewportHeight: safeViewportHeight,
    };
  }

  /** Returns a copy of the last recorded window, or null before the first update. */
  getCurrentWindow(): VirtualizerWindow | null {
    return this.currentWindow ? { ...this.currentWindow } : null;
  }

  /** Finds the item containing an offset, advancing past exact item boundaries. */
  private indexAtOffset(offset: number): number {
    if (this.itemsLength <= 0) return 0;

    const target = Math.max(0, offset);
    let index = Math.max(0, Math.min(this.itemsLength - 1, this.fenwick.lowerBound(target)));

    // FenwickTree.lowerBound returns the preceding item when the target lands
    // exactly on an item boundary. For the viewport start, select the next item.
    while (index < this.itemsLength - 1 && this.cumulativeOffset(index + 1) <= target) {
      index += 1;
    }

    return index;
  }

  cumulativeOffset(index: number): number {
    if (!Number.isFinite(index)) {
      return index === Number.POSITIVE_INFINITY && this.itemsLength > 0
        ? this.fenwick.sum(this.itemsLength - 1)
        : 0;
    }
    const boundedIndex = Math.max(0, Math.min(this.itemsLength, Math.trunc(index)));
    if (boundedIndex === 0) return 0;
    return this.fenwick.sum(boundedIndex - 1);
  }

  /**
   * Calculates and records the intended scroll position for an item without
   * mutating the container. The caller may apply the returned scrollTop.
   * Returns null after destruction or when there are no items to target.
   */
  scrollToIndex(index: number): VirtualizerScrollResult | null {
    if (this.destroyed || this.itemsLength <= 0) return null;

    const requestedIndex = Number.isFinite(index) ? Math.trunc(index) : 0;
    const targetIndex = Math.max(0, Math.min(this.itemsLength - 1, requestedIndex));
    const offset = this.cumulativeOffset(targetIndex);
    this.intendedScrollTop = offset;

    return { index: targetIndex, offset, scrollTop: offset };
  }

  /**
   * Resolves a stable key against the caller's current data identity, then
   * delegates to scrollToIndex(). Invalid or out-of-range resolutions are
   * rejected rather than clamped to a different item's position.
   */
  scrollToKey<TKey>(
    key: TKey,
    resolveIndex: (key: TKey) => number | null | undefined,
  ): VirtualizerScrollResult | null {
    if (this.destroyed || this.itemsLength <= 0) return null;

    const index = resolveIndex(key);
    if (
      typeof index !== 'number'
      || !Number.isInteger(index)
      || index < 0
      || index >= this.itemsLength
    ) {
      return null;
    }

    return this.scrollToIndex(index);
  }

  /** Returns the last scroll position requested through scrollToIndex(). */
  getIntendedScrollTop(): number {
    return this.intendedScrollTop;
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
    if (this.destroyed) return;

    const frag = document.createDocumentFragment();
    const activeIndices = new Set<number>();
    
    for (let i = startIndex; i <= endIndex; i++) {
      const node = this.acquireNode(i);
      updateNode(node, this.itemGetter(i), i);
      frag.appendChild(node);
      activeIndices.add(i);
      
      // Measure on appear (deferred)
      queueMicrotask(() => {
        if (!this.destroyed) {
          this.measureOnAppear(node, i);
        }
      });
    }
    
    // Translate container by cumulative offset of startIndex
    const topOffset = this.cumulativeOffset(startIndex);
    this.container.style.transform = `translate3d(0, ${Math.round(topOffset * 100) / 100}px, 0)`;
    this.container.replaceChildren(frag);
    
    // Recycle nodes not in use
    if (this.recycleRafId) {
      cancelAnimationFrame(this.recycleRafId);
    }
    this.recycleRafId = requestAnimationFrame(() => {
      this.recycleRafId = 0;
      if (!this.destroyed) {
        this.releaseExcess(activeIndices);
      }
    });
  }

  measureOnAppear(node: HTMLElement, index: number) {
    this.measureItem(index, node.offsetHeight);
  }

  /** Records a validated measured height and updates the virtual offset index. */
  measureItem(index: number, height: number): boolean {
    if (
      this.destroyed
      || !Number.isInteger(index)
      || index < 0
      || index >= this.itemsLength
      || !Number.isFinite(height)
      || height <= 0
    ) return false;

    const prev = this.measuredHeights.get(index);
    const threshold = this.options.measurementThreshold ?? 5;

    if (prev === undefined || Math.abs(prev - height) > threshold) {
      const oldValue = prev ?? this.estimatedItemHeight;
      this.measuredHeights.set(index, height);
      this.measuredHeightTotal += height - (prev ?? 0);
      
      // Update Fenwick tree with new measurement
      this.fenwick.update(index, oldValue, height);
      
      this.updateAverageHeight();
      return true;
    }

    return false;
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
    const previousLength = this.itemsLength;
    this.itemsLength = newLength;
    if (newLength !== previousLength) this.currentWindow = null;

    let removedMeasurement = false;
    for (const [index, height] of this.measuredHeights) {
      if (index >= newLength) {
        this.measuredHeightTotal -= height;
        this.measuredHeights.delete(index);
        removedMeasurement = true;
      }
    }

    if (removedMeasurement) this.updateAverageHeight();

    for (const index of Array.from(this.activeNodes.keys())) {
      if (index >= newLength) {
        this.releaseNode(index);
      }
    }
    
    if (newLength !== previousLength) {
      this.fenwick = this.createFenwickTree(newLength);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.destroyed = true;
    if (this.recycleRafId) {
      cancelAnimationFrame(this.recycleRafId);
      this.recycleRafId = 0;
    }
    this.pool.clear();
    this.activeNodes.clear();
    this.measuredHeights.clear();
    this.measuredHeightTotal = 0;
    this.averageHeight = this.estimatedItemHeight;
    this.currentWindow = null;
    this.fenwick.reset();
  }

  private updateAverageHeight(): void {
    const count = this.measuredHeights.size;
    this.averageHeight = count > 0
      ? Math.round((this.measuredHeightTotal / count) * 100) / 100
      : this.estimatedItemHeight;
  }

  private createFenwickTree(size: number): FenwickTree {
    const tree = new FenwickTree(size);
    for (let index = 0; index < size; index++) {
      tree.add(index, this.estimatedItemHeight);
    }
    for (const [index, height] of this.measuredHeights) {
      if (index < size) {
        tree.update(index, this.estimatedItemHeight, height);
      }
    }
    return tree;
  }
}
