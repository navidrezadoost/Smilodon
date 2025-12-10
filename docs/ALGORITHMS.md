# Algorithm Reference

Compact technical reference for core algorithms and complexity guarantees.

---

## Table of Contents

1. [Positioner](#positioner)
2. [Virtualizer Windowing](#virtualizer-windowing)
3. [Cumulative Offset](#cumulative-offset)
4. [Fenwick Tree](#fenwick-tree)
5. [Performance Targets](#performance-targets)
6. [Testing Checklist](#testing-checklist)
7. [Tradeoffs](#tradeoffs)

---

## Positioner

**Complexity**: O(1) per placement check

### Algorithm

```typescript
// 1. Calculate base coordinates per placement
function getBaseCoords(placement: Placement, anchor: Rect, dropdown: Rect) {
  switch (placement) {
    case 'bottom':
      return { x: anchor.left, y: anchor.bottom };
    case 'top':
      return { x: anchor.left, y: anchor.top - dropdown.height };
    case 'left':
      return { x: anchor.left - dropdown.width, y: anchor.top };
    case 'right':
      return { x: anchor.right, y: anchor.top };
  }
}

// 2. Try placements from flip order
const flipOrder = ['bottom', 'top', 'left', 'right'];
for (const placement of flipOrder) {
  const coords = getBaseCoords(placement, anchor, dropdown);
  
  // 3. Check overflow using boundaryRect
  const overflow = getOverflow(coords, dropdown, boundaryRect);
  
  // 4. If fits → optionally shift → return
  if (!overflow.any) {
    if (shift) {
      coords.x = clamp(coords.x, boundary.left, boundary.right - dropdown.width);
      coords.y = clamp(coords.y, boundary.top, boundary.bottom - dropdown.height);
    }
    return { coords, placement };
  }
}

// 5. Else clamp to boundary (fallback)
return {
  coords: {
    x: clamp(coords.x, boundary.left, boundary.right - dropdown.width),
    y: clamp(coords.y, boundary.top, boundary.bottom - dropdown.height)
  },
  placement: 'bottom' // default
};
```

### Key Points

- **O(1) per placement**: Each placement check is constant time
- **Flip order**: Try preferred placement first, then alternatives
- **Shift**: Optional micro-adjustment to keep dropdown in boundary
- **Fallback**: Always clamp to boundary if no placement fits

---

## Virtualizer Windowing

**Complexity**: O(1) window computation

### Algorithm

```typescript
function computeWindow(
  scrollTop: number,
  viewportHeight: number,
  avgHeight: number,
  buffer: number
): { start: number; end: number } {
  
  // 1. Calculate visible range
  const start = Math.floor(scrollTop / avgHeight) - buffer;
  const end = Math.ceil((scrollTop + viewportHeight) / avgHeight) + buffer;
  
  // 2. Clamp to valid indices
  return {
    start: Math.max(0, start),
    end: Math.min(itemCount, end)
  };
}

// 3. Render nodes for [start..end]
function render(start: number, end: number) {
  const fragment = document.createDocumentFragment();
  
  for (let i = start; i < end; i++) {
    const node = pool.acquire() || createNode();
    updateNode(node, items[i], i);
    fragment.appendChild(node);
  }
  
  // 4. Use cumulativeOffset(start) for translateY
  const offset = cumulativeOffset(start);
  container.style.transform = `translateY(${offset}px)`;
  
  container.appendChild(fragment);
}
```

### Key Points

- **Buffer**: Render extra items above/below viewport to prevent flashing
- **O(1) computation**: Simple arithmetic, no iteration
- **DOM pooling**: Reuse nodes to minimize allocations
- **Transform**: Use `translateY` for GPU acceleration

---

## Cumulative Offset

**Complexity**: O(n) naive, O(log n) with Fenwick

### Naive Implementation (Sparse Measurement)

```typescript
// For items with mostly uniform heights + sparse measurements
function cumulativeOffset(index: number): number {
  let offset = index * averageHeight;
  
  // Add deltas for measured items before index
  for (const [i, measuredHeight] of measuredHeights.entries()) {
    if (i < index) {
      offset += measuredHeight - averageHeight;
    }
  }
  
  return offset;
}
```

**Complexity**: O(m) where m = number of measured items

### Optimized (Fenwick Tree)

```typescript
// Use Fenwick tree when measured count > ~1000
class CumulativeOffsetTracker {
  private fenwick: FenwickTree;
  private averageHeight: number;
  
  constructor(itemCount: number, avgHeight: number) {
    this.fenwick = new FenwickTree(itemCount);
    this.averageHeight = avgHeight;
  }
  
  // When item i is measured
  updateHeight(i: number, measuredHeight: number) {
    const delta = measuredHeight - this.averageHeight;
    this.fenwick.add(i, delta);
  }
  
  // Get offset to index i
  getOffset(i: number): number {
    return i * this.averageHeight + this.fenwick.sum(i - 1);
  }
}
```

**Complexity**: O(log n) per update and query

### Formula

```
cumulativeOffset(i) = i × averageHeight + Σ(measuredHeight[j] - averageHeight)
                                          for all j < i where measured
```

### Key Points

- **Sparse measurement**: Only measure items when rendered
- **Running average**: Update `averageHeight` incrementally
- **Fenwick optimization**: Use for large datasets with many measurements
- **Memory**: Fenwick adds O(n) memory overhead

---

## Fenwick Tree

**Binary Indexed Tree** for efficient prefix sums.

### Operations

```typescript
class FenwickTree {
  private tree: number[];
  
  constructor(size: number) {
    this.tree = new Array(size + 1).fill(0);
  }
  
  // Add delta to index i - O(log n)
  add(i: number, delta: number): void {
    i++; // 1-indexed
    while (i < this.tree.length) {
      this.tree[i] += delta;
      i += i & -i; // Add lowest set bit
    }
  }
  
  // Get sum of [0..i] - O(log n)
  sum(i: number): number {
    i++; // 1-indexed
    let sum = 0;
    while (i > 0) {
      sum += this.tree[i];
      i -= i & -i; // Remove lowest set bit
    }
    return sum;
  }
  
  // Get sum of [left..right] - O(log n)
  rangeSum(left: number, right: number): number {
    return this.sum(right) - (left > 0 ? this.sum(left - 1) : 0);
  }
}
```

### Use Cases

1. **Cumulative offsets** with many measured heights
2. **Multi-selection** range queries
3. **Index lookup** by scroll position (binary search on sums)

### Binary Search on Sums

```typescript
// Find index where cumulative offset >= targetOffset
function findIndexByOffset(targetOffset: number): number {
  let left = 0;
  let right = itemCount - 1;
  
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    const offset = cumulativeOffset(mid);
    
    if (offset < targetOffset) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  
  return left;
}
```

**Complexity**: O(log²n) with Fenwick (log n per offset query × log n binary search)

### Key Points

- **O(log n)**: Both add and sum operations
- **Space**: O(n) for tree array
- **1-indexed**: Internal implementation uses 1-based indexing
- **Lowest set bit**: Core operation `i & -i` finds rightmost 1-bit

---

## Performance Targets

### Per-Frame Budget

| Operation | Target | Budget |
|-----------|--------|--------|
| Window computation | <1ms | 4ms |
| DOM updates | <4ms | 8ms |
| Event handling | <1ms | 4ms |
| **Total per frame** | **<6ms** | **16ms (60 FPS)** |

### Initial Render

| Dataset Size | Target | Excellent |
|--------------|--------|-----------|
| 1K items | <20ms | <10ms |
| 10K items | <50ms | <30ms |
| 100K items | <100ms | <50ms |
| 1M items | <200ms | <100ms |

### Scroll Performance

- **FPS**: 60 (stable)
- **Frame time**: <16ms
- **Jank**: 0 frames >50ms

### Memory

| Dataset Size | Target | Max |
|--------------|--------|-----|
| 1K items | <5 MB | 10 MB |
| 10K items | <10 MB | 20 MB |
| 100K items | <20 MB | 40 MB |
| 1M items | <50 MB | 100 MB |

---

## Testing Checklist

### Per Pull Request

- [ ] **Unit tests** pass
- [ ] **E2E smoke scenarios** (open, select, scroll, close)
- [ ] **Performance run** on small runner:
  - [ ] TTI (Time to Interactive) within target
  - [ ] Scroll FPS stable at 60 FPS for 1K dataset
  - [ ] Heap snapshot shows no memory leaks
  - [ ] Bundle gzipped size under gate (6.6 KB core)
- [ ] **Accessibility** automated checks (axe-core)
- [ ] **CSP** static analyzer passes

### Smoke Test Script

```bash
# Build
npm run build:core

# Unit tests
npm run test:core

# Bundle size
ls -lh packages/core/dist/index.min.js
gzip -c packages/core/dist/index.min.js | wc -c

# E2E
npm run test:e2e

# Accessibility
npm run test:a11y
```

### Performance Regression Check

```typescript
// Use telemetry to catch regressions
import { getTelemetry } from '@smilodon/core';

const telemetry = getTelemetry();
telemetry.startRecording();

// ... perform operations

const metrics = telemetry.getMetrics();

// Assert thresholds
expect(metrics.renderTime).toBeLessThan(50);
expect(metrics.scrollFPS).toBeGreaterThan(55);
expect(metrics.memoryUsage).toBeLessThan(20);
```

---

## Tradeoffs

### 1. Positioning Strategy: `absolute` vs `fixed`

**`absolute` (default)**:
- ✅ Stays within containing stacking context
- ✅ Respects parent positioning
- ❌ Clipped by `overflow: hidden` ancestors

**`fixed`**:
- ✅ Avoids ancestor clipping
- ✅ Positioned relative to viewport
- ❌ Different stacking context
- ❌ May scroll with page

**Decision**: Use `fixed` when `portal=false` and ancestors have `overflow: hidden`. Otherwise use `absolute` to keep popup within containing stacking context.

```typescript
// Auto-detect overflow:hidden ancestors
if (hasOverflowHiddenAncestor(element) && !portal) {
  strategy = 'fixed';
}
```

### 2. Fenwick Tree Complexity

**Without Fenwick**:
- ✅ Simple implementation
- ✅ No memory overhead
- ❌ O(m) offset queries (m = measured items)

**With Fenwick**:
- ✅ O(log n) offset queries
- ✅ Scales to millions of items
- ❌ Adds O(n) memory overhead
- ❌ More complex implementation

**Decision**: Use Fenwick only for:
- Very large lists (>10K items)
- High measurement count (>1K measured)
- Performance-critical scenarios

```typescript
// Auto-enable Fenwick
const useFenwick = itemCount > 10000 || measuredCount > 1000;
```

### 3. Web Worker Offload

**Main Thread**:
- ✅ Simple synchronous code
- ✅ No message passing overhead
- ❌ Blocks UI during heavy operations

**Web Worker**:
- ✅ Reduces main-thread work
- ✅ Keeps UI responsive
- ❌ Message passing overhead
- ❌ Not supported in all CSP contexts
- ❌ Cannot access DOM

**Decision**: Offload to worker when:
- Operation takes >8ms on main thread
- Dataset size >10K items
- CSP allows workers (`worker-src`)
- Not manipulating DOM

```typescript
// Auto-offload heavy operations
const useWorker = 
  operationCost > 8 && 
  itemCount > 10000 && 
  CSPFeatures.hasWorkers();
```

### 4. DOM Pooling

**Without Pooling**:
- ✅ Simple: create/destroy as needed
- ❌ GC pressure from allocations
- ❌ Layout thrashing

**With Pooling**:
- ✅ Reduces GC pressure
- ✅ Better performance (70-90% hit rate)
- ❌ Memory overhead (pool size)
- ❌ More complex lifecycle

**Decision**: Always use pooling for virtualized lists. Pool size = rendered window size × 1.5.

### 5. Portal Rendering

**Without Portal** (`portal=false`):
- ✅ Simple: dropdown in natural DOM position
- ✅ Inherits styles from ancestors
- ❌ Clipped by `overflow: hidden`
- ❌ Z-index stacking issues

**With Portal** (`portal=true`):
- ✅ Avoids clipping
- ✅ Predictable stacking
- ❌ Styles may need duplication
- ❌ Additional DOM manipulation

**Decision**: Use portal when:
- Ancestor has `overflow: hidden`
- Complex stacking contexts
- Dropdown must escape container

```typescript
// Auto-enable portal
if (hasOverflowHiddenAncestor(element)) {
  portal = true;
}
```

---

## Complexity Summary

| Operation | Naive | Optimized | Notes |
|-----------|-------|-----------|-------|
| Position check | O(1) | O(1) | Per placement |
| Window compute | O(1) | O(1) | Simple arithmetic |
| Cumulative offset | O(m) | **O(log n)** | With Fenwick |
| Fenwick add | - | **O(log n)** | Update height |
| Fenwick sum | - | **O(log n)** | Prefix sum |
| Index lookup | O(n) | **O(log²n)** | Binary search + Fenwick |
| Multi-select range | O(n) | **O(log n)** | With Fenwick |

**Legend**:
- n = total items
- m = measured items
- Optimized = with Fenwick tree

---

## Implementation Notes

### Average Height Tracking

```typescript
class AverageHeightTracker {
  private sum = 0;
  private count = 0;
  
  update(height: number) {
    this.sum += height;
    this.count++;
  }
  
  get average(): number {
    return this.count > 0 ? this.sum / this.count : 48; // default
  }
}
```

### Overflow Detection

```typescript
interface Overflow {
  top: number;
  right: number;
  bottom: number;
  left: number;
  any: boolean;
}

function getOverflow(
  coords: { x: number; y: number },
  size: { width: number; height: number },
  boundary: Rect
): Overflow {
  return {
    top: boundary.top - coords.y,
    right: coords.x + size.width - boundary.right,
    bottom: coords.y + size.height - boundary.bottom,
    left: boundary.left - coords.x,
    any: 
      coords.y < boundary.top ||
      coords.x + size.width > boundary.right ||
      coords.y + size.height > boundary.bottom ||
      coords.x < boundary.left
  };
}
```

### Transform Optimization

```typescript
// ✅ Good: GPU-accelerated
element.style.transform = `translateY(${offset}px)`;

// ❌ Bad: Forces layout
element.style.top = `${offset}px`;
```

### Will-Change Usage

```typescript
// Enable during scroll only
function onScrollStart() {
  container.style.willChange = 'transform';
}

function onScrollEnd() {
  container.style.willChange = 'auto'; // Free resources
}
```

---

## Further Reading

- [Virtualizer Implementation](../packages/core/src/virtualizer.ts)
- [Fenwick Tree Implementation](../packages/core/src/data-structures/fenwick-tree.ts)
- [Positioner Implementation](../packages/core/src/positioning/positioner.ts)
- [Performance Guide](./PERFORMANCE.md)
- [Phase 6: Advanced Performance](../.azure/phase6-complete.md)

---

**Last Updated**: Phase 10 (December 2025)
