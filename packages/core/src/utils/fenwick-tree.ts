/**
 * Fenwick Tree (Binary Indexed Tree) for O(log n) prefix sum queries and updates.
 * Used for cumulative height calculations in variable-height virtualization.
 * 
 * Space: O(n)
 * Time: O(log n) for both query and update
 * 
 * @see https://en.wikipedia.org/wiki/Fenwick_tree
 */
export class FenwickTree {
  private tree: Float64Array;
  private size: number;

  constructor(size: number) {
    this.size = size;
    // 1-indexed for cleaner bit manipulation
    this.tree = new Float64Array(size + 1);
  }

  /**
   * Add delta to index i (0-indexed input)
   * Complexity: O(log n)
   */
  add(index: number, delta: number): void {
    // Convert to 1-indexed
    let i = index + 1;
    while (i <= this.size) {
      this.tree[i] += delta;
      // Move to next relevant index: i + LSB(i)
      i += i & -i;
    }
  }

  /**
   * Get prefix sum from 0 to index (inclusive, 0-indexed input)
   * Complexity: O(log n)
   */
  sum(index: number): number {
    if (index < 0) return 0;
    // Convert to 1-indexed
    let i = index + 1;
    let result = 0;
    while (i > 0) {
      result += this.tree[i];
      // Move to parent: i - LSB(i)
      i -= i & -i;
    }
    return result;
  }

  /**
   * Get sum in range [left, right] (inclusive, 0-indexed)
   * Complexity: O(log n)
   */
  rangeSum(left: number, right: number): number {
    if (left > right) return 0;
    return this.sum(right) - (left > 0 ? this.sum(left - 1) : 0);
  }

  /**
   * Update value at index to newValue (handles delta internally)
   * Requires tracking current values externally or use add() directly
   * Complexity: O(log n)
   */
  update(index: number, oldValue: number, newValue: number): void {
    this.add(index, newValue - oldValue);
  }

  /**
   * Binary search to find the smallest index where sum(index) >= target
   * Useful for finding scroll position -> item index mapping
   * Complexity: O(log² n) or O(log n) with optimization
   * 
   * @returns index (0-indexed) or -1 if not found
   */
  lowerBound(target: number): number {
    if (target <= 0) return 0;

    // Optimized binary search on Fenwick tree structure
    let pos = 0;
    let sum = 0;
    // Start from highest power of 2 <= size
    let bit = 1 << Math.floor(Math.log2(this.size));

    while (bit > 0) {
      if (pos + bit <= this.size) {
        const nextSum = sum + this.tree[pos + bit];
        if (nextSum < target) {
          pos += bit;
          sum = nextSum;
        }
      }
      bit >>= 1;
    }

    // Convert back to 0-indexed
    return pos;
  }

  /**
   * Reset all values to 0
   * Complexity: O(n)
   */
  reset(): void {
    this.tree.fill(0);
  }

  /**
   * Resize the tree (useful for dynamic item lists)
   * Complexity: O(n)
   */
  resize(newSize: number): void {
    if (newSize === this.size) return;
    
    const oldTree = this.tree;
    const oldSize = this.size;
    
    this.size = newSize;
    this.tree = new Float64Array(newSize + 1);
    
    // Copy existing values up to min(oldSize, newSize)
    const copySize = Math.min(oldSize, newSize);
    for (let i = 1; i <= copySize; i++) {
      this.tree[i] = oldTree[i];
    }
  }

  /**
   * Get current size
   */
  getSize(): number {
    return this.size;
  }

  /**
   * Export state for serialization (e.g., to SharedArrayBuffer)
   */
  exportState(): { size: number; tree: number[] } {
    return {
      size: this.size,
      tree: Array.from(this.tree),
    };
  }

  /**
   * Import state from serialization
   */
  static fromState(state: { size: number; tree: number[] }): FenwickTree {
    const ft = new FenwickTree(state.size);
    ft.tree = new Float64Array(state.tree);
    return ft;
  }
}
