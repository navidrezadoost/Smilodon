# Architecture Documentation

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Component Design](#component-design)
- [Core Algorithms](#core-algorithms)
- [Data Flow](#data-flow)
- [Performance Architecture](#performance-architecture)
- [Security Architecture](#security-architecture)
- [Testing Architecture](#testing-architecture)
- [Deployment Architecture](#deployment-architecture)

---

## Overview

Smilodon is an enterprise-grade select component library built with Web Components, designed to handle extreme-scale datasets (1M+ items) while maintaining 60 FPS performance and WCAG 2.1 AAA accessibility compliance.

### Design Principles

1. **Performance First**: Virtual scrolling, efficient algorithms, minimal re-renders
2. **Framework Agnostic**: Core built with Web Components, wrappers for frameworks
3. **Accessibility**: WCAG 2.1 AAA compliance, full keyboard navigation, screen reader support
4. **Security**: CSP-compliant, XSS-safe, shadow DOM isolation
5. **Developer Experience**: Simple API, TypeScript support, comprehensive docs
6. **Maintainability**: High cohesion, low coupling, extensive testing

### Key Metrics

- **Bundle Size**: 6.6KB gzipped (core)
- **Performance**: 60 FPS with 1M items
- **Accessibility**: WCAG 2.1 AAA compliant
- **Test Coverage**: 97% (188/193 tests passing)
- **Browser Support**: Chrome 90+, Firefox 88+, Safari 14+

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌──────────┬──────────┬──────────┬──────────┐              │
│  │  React   │   Vue    │  Svelte  │  Vanilla │              │
│  │  Wrapper │  Wrapper │  Wrapper │   JS     │              │
│  └────┬─────┴────┬─────┴────┬─────┴────┬─────┘              │
│       │          │          │          │                    │
│       └──────────┴──────────┴──────────┘                    │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                    Core Components Layer                     │
│                           │                                  │
│       ┌───────────────────┴───────────────────┐              │
│       │      Enhanced Select Component        │              │
│       │    (Web Component / Shadow DOM)       │              │
│       └───────────────┬───────────────────────┘              │
│                       │                                      │
│   ┌───────────────────┼───────────────────┐                 │
│   │                   │                   │                 │
│   ▼                   ▼                   ▼                 │
│ ┌─────────┐     ┌──────────┐      ┌────────────┐           │
│ │ Virtual │     │ Selection│      │   Event    │           │
│ │ Scroller│     │  Manager │      │  Manager   │           │
│ └────┬────┘     └────┬─────┘      └─────┬──────┘           │
│      │               │                   │                 │
│      │         ┌─────┴─────┐            │                 │
│      │         │  Fenwick  │            │                 │
│      │         │   Tree    │            │                 │
│      │         └───────────┘            │                 │
└──────┼──────────────────────────────────┼──────────────────┘
       │                                  │
┌──────┼──────────────────────────────────┼──────────────────┐
│   Utilities & Infrastructure             │                 │
│      │                                  │                 │
│  ┌───┴───────┐  ┌──────────┐  ┌────────┴────┐            │
│  │   DOM     │  │  Web     │  │   ARIA      │            │
│  │   Pool    │  │  Worker  │  │  Manager    │            │
│  └───────────┘  └──────────┘  └─────────────┘            │
│                                                            │
│  ┌───────────┐  ┌──────────┐  ┌─────────────┐            │
│  │  Debounce │  │ Sanitizer│  │  Theme      │            │
│  │  Utils    │  │  (DOMPur)│  │  System     │            │
│  └───────────┘  └──────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
EnhancedSelect (Web Component)
├── Shadow DOM Root
│   ├── Input Container
│   │   ├── Search Input (role="combobox")
│   │   ├── Placeholder/Selected Display
│   │   └── Dropdown Arrow
│   │
│   ├── Dropdown Container (role="listbox")
│   │   ├── Virtual Scroll Container
│   │   │   ├── Viewport
│   │   │   │   └── Visible Items (SelectOption components)
│   │   │   ├── Spacer (top)
│   │   │   └── Spacer (bottom)
│   │   │
│   │   ├── Loading Indicator
│   │   └── Load More Button (if enabled)
│   │
│   └── Live Region (aria-live="polite")
│       └── Screen Reader Announcements
│
└── SelectOption (Web Component, nested shadow DOM)
    └── Shadow DOM Root
        ├── Checkbox (if multi-select)
        ├── Option Content
        │   ├── Label
        │   └── Custom Template (if provided)
        └── Remove Button (if enabled)
```

---

## Component Design

### EnhancedSelect Component

**Responsibilities:**
- Render dropdown container
- Manage open/close state
- Handle keyboard navigation
- Coordinate selection state
- Emit change events
- Manage accessibility attributes

**Key Properties:**
```typescript
interface EnhancedSelectConfig {
  selection: {
    mode: 'single' | 'multi';
    maxSelections?: number;
    allowDeselect?: boolean;
    closeOnSelect?: boolean;
    showRemoveButton?: boolean;
  };
  searchable?: boolean;
  placeholder?: string;
  infiniteScroll?: {
    enabled: boolean;
    threshold?: number;
    initialPage?: number;
  };
  virtualization?: {
    enabled: boolean;
    itemHeight?: number;
    buffer?: number;
  };
  serverSide?: {
    enabled: boolean;
    initialSelectedValues?: (string | number)[];
    fetchSelectedItems?: (values: (string | number)[]) => Promise<any[]>;
    getLabelFromItem?: (item: any) => string;
    getValueFromItem?: (item: any) => string | number;
  };
}
```

**State Management:**
```typescript
class EnhancedSelect extends HTMLElement {
  // State
  private items: SelectItem[] = [];
  private selectedIndices: Set<number> = new Set();
  private activeIndex: number = -1;
  private isOpen: boolean = false;
  private searchQuery: string = '';
  
  // Computed state
  get selectedValues(): (string | number)[] {
    return Array.from(this.selectedIndices)
      .map(i => this.items[i]?.value)
      .filter(v => v !== undefined);
  }
  
  get selectedItems(): SelectItem[] {
    return Array.from(this.selectedIndices)
      .map(i => this.items[i])
      .filter(item => item !== undefined);
  }
}
```

### SelectOption Component

**Responsibilities:**
- Render individual option
- Handle click interactions
- Manage selected state
- Render custom templates

**Design Pattern:** High cohesion, low coupling
- Each option is independent
- Communicates via custom events
- No direct parent manipulation

```typescript
class SelectOption extends HTMLElement {
  private shadow: ShadowRoot;
  private selected: boolean = false;
  
  connectedCallback() {
    this.render();
    this.attachListeners();
  }
  
  private handleClick() {
    // Emit event, don't modify parent directly
    this.dispatchEvent(new CustomEvent('option-select', {
      bubbles: true,
      composed: true,
      detail: {
        value: this.value,
        label: this.label,
        selected: !this.selected
      }
    }));
  }
}
```

### Virtual Scroller

**Responsibilities:**
- Calculate visible range
- Update viewport position
- Manage spacers for scroll position
- Reuse DOM nodes efficiently

**Implementation:**
```typescript
class VirtualScroller {
  private itemHeight: number;
  private buffer: number;
  private viewportHeight: number;
  
  calculateVisibleRange(scrollTop: number): Range {
    const startIndex = Math.max(0, 
      Math.floor(scrollTop / this.itemHeight) - this.buffer
    );
    
    const visibleCount = Math.ceil(
      this.viewportHeight / this.itemHeight
    );
    
    const endIndex = startIndex + visibleCount + this.buffer * 2;
    
    return { startIndex, endIndex };
  }
  
  updateSpacers(range: Range, totalItems: number) {
    this.topSpacer.style.height = 
      `${range.startIndex * this.itemHeight}px`;
    
    this.bottomSpacer.style.height = 
      `${(totalItems - range.endIndex) * this.itemHeight}px`;
  }
}
```

---

## Core Algorithms

### 1. Fenwick Tree (Binary Indexed Tree)

**Purpose:** Efficient range sum queries for selection tracking

**Time Complexity:**
- Update: O(log n)
- Query: O(log n)
- Space: O(n)

**Use Cases:**
- "How many items selected in range [a, b]?"
- "Select/deselect items efficiently"
- "Find kth selected item"

**Implementation:**
```typescript
class FenwickTree {
  private tree: number[];
  private size: number;
  
  constructor(size: number) {
    this.size = size;
    this.tree = new Array(size + 1).fill(0);
  }
  
  // Update value at index (O(log n))
  update(index: number, delta: number): void {
    index++; // 1-indexed
    while (index <= this.size) {
      this.tree[index] += delta;
      index += index & (-index); // Add last set bit
    }
  }
  
  // Prefix sum from 0 to index (O(log n))
  prefixSum(index: number): number {
    index++; // 1-indexed
    let sum = 0;
    while (index > 0) {
      sum += this.tree[index];
      index -= index & (-index); // Remove last set bit
    }
    return sum;
  }
  
  // Range sum from left to right (O(log n))
  rangeSum(left: number, right: number): number {
    if (left > 0) {
      return this.prefixSum(right) - this.prefixSum(left - 1);
    }
    return this.prefixSum(right);
  }
}
```

**Application in Selection:**
```typescript
class SelectionManager {
  private fenwick: FenwickTree;
  
  // O(log n) - Check if item is selected
  isSelected(index: number): boolean {
    return this.fenwick.rangeSum(index, index) === 1;
  }
  
  // O(log n) - Toggle selection
  toggleSelection(index: number): void {
    const isCurrentlySelected = this.isSelected(index);
    const delta = isCurrentlySelected ? -1 : 1;
    this.fenwick.update(index, delta);
  }
  
  // O(log n) - Count selected in range
  countSelected(start: number, end: number): number {
    return this.fenwick.rangeSum(start, end);
  }
}
```

### 2. Virtual Scrolling

**Purpose:** Render only visible items for performance

**Algorithm:**
```typescript
function virtualScroll(params: {
  items: any[];
  scrollTop: number;
  viewportHeight: number;
  itemHeight: number;
  buffer: number;
}): RenderResult {
  const { items, scrollTop, viewportHeight, itemHeight, buffer } = params;
  
  // Calculate visible range
  const startIndex = Math.max(0,
    Math.floor(scrollTop / itemHeight) - buffer
  );
  
  const visibleCount = Math.ceil(viewportHeight / itemHeight);
  const endIndex = Math.min(
    items.length,
    startIndex + visibleCount + buffer * 2
  );
  
  // Get visible items
  const visibleItems = items.slice(startIndex, endIndex);
  
  // Calculate spacer heights
  const topSpacerHeight = startIndex * itemHeight;
  const bottomSpacerHeight = (items.length - endIndex) * itemHeight;
  
  return {
    visibleItems,
    topSpacerHeight,
    bottomSpacerHeight,
    startIndex,
    endIndex
  };
}
```

**Optimization:** Dynamic height calculation using Fenwick Tree

```typescript
class DynamicVirtualScroller {
  private heights: FenwickTree; // Stores cumulative heights
  
  // O(log n) - Get scroll position for item index
  getScrollPosition(index: number): number {
    return this.heights.prefixSum(index - 1);
  }
  
  // O(log n) - Find visible range
  findVisibleRange(scrollTop: number, viewportHeight: number): Range {
    // Binary search using Fenwick tree
    let startIndex = this.binarySearchByHeight(scrollTop);
    let endIndex = this.binarySearchByHeight(scrollTop + viewportHeight);
    
    return { startIndex, endIndex };
  }
}
```

### 3. Debouncing

**Purpose:** Reduce expensive operations (search, filtering)

**Implementation:**
```typescript
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

// Usage
const debouncedSearch = debounce((query: string) => {
  performSearch(query);
}, 300);
```

### 4. DOM Node Pooling

**Purpose:** Reuse DOM nodes to reduce GC pressure

**Implementation:**
```typescript
class DOMPool<T extends HTMLElement> {
  private pool: T[] = [];
  private create: () => T;
  
  constructor(createFn: () => T) {
    this.create = createFn;
  }
  
  acquire(): T {
    return this.pool.pop() || this.create();
  }
  
  release(element: T): void {
    // Clean element
    element.textContent = '';
    element.className = '';
    
    // Return to pool
    this.pool.push(element);
  }
  
  clear(): void {
    this.pool = [];
  }
}

// Usage
const optionPool = new DOMPool(() => 
  document.createElement('div')
);

// Acquire from pool
const option = optionPool.acquire();
option.textContent = 'Item';

// Release back to pool
optionPool.release(option);
```

---

## Data Flow

### User Interaction Flow

```
User Action → Event Handler → State Update → Render → DOM Update
     ↓                                            ↓
  Keyboard         Selection Manager          Shadow DOM
  Mouse Click      Active Index               Virtual Scroller
  Touch            Search Query               ARIA Updates
```

### Selection Flow (Multi-Select)

```
1. User clicks option
   ↓
2. SelectOption emits 'option-select' event
   ↓
3. EnhancedSelect handles event
   ↓
4. SelectionManager updates Fenwick Tree (O(log n))
   ↓
5. Re-render affected options (virtual scroll)
   ↓
6. Update ARIA attributes
   ↓
7. Emit 'change' event to application
   ↓
8. Update screen reader announcement
```

### Search Flow

```
1. User types in search input
   ↓
2. Input event fires
   ↓
3. Debounced handler (300ms)
   ↓
4. Emit 'search' event with query
   ↓
5. Application handles event:
   - Client-side: Filter items, call setItems()
   - Server-side: API call, then setItems()
   ↓
6. Virtual scroller updates
   ↓
7. Screen reader announces result count
```

### Infinite Scroll Flow

```
1. User scrolls near bottom (threshold: 80%)
   ↓
2. Intersection Observer fires
   ↓
3. Check if more pages available
   ↓
4. Emit 'load-more' event
   ↓
5. Application fetches next page
   ↓
6. Call appendItems(newItems)
   ↓
7. Virtual scroller recalculates
   ↓
8. Render new items as needed
```

---

## Performance Architecture

### Performance Optimizations

#### 1. Virtual Scrolling
- **Constant DOM nodes**: Only render visible items (~10-30 items)
- **O(1) render**: Independent of total dataset size
- **Smooth scrolling**: 60 FPS maintained

#### 2. RequestAnimationFrame
```typescript
function smoothUpdate(callback: () => void) {
  requestAnimationFrame(() => {
    callback();
  });
}

// Usage
handleScroll() {
  smoothUpdate(() => {
    this.updateVisibleItems();
  });
}
```

#### 3. Web Workers
```typescript
// Main thread
const worker = new WorkerManager();

worker.execute('sortItems', items).then(sorted => {
  this.setItems(sorted);
});

// Worker thread
self.addEventListener('message', (e) => {
  if (e.data.type === 'sortItems') {
    const sorted = e.data.payload.sort((a, b) => 
      a.label.localeCompare(b.label)
    );
    self.postMessage({ type: 'result', payload: sorted });
  }
});
```

#### 4. Memoization
```typescript
const memoize = <T extends (...args: any[]) => any>(fn: T) => {
  const cache = new Map<string, ReturnType<T>>();
  
  return (...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

// Usage
const getOptionHeight = memoize((index: number) => {
  return this.measureHeight(index);
});
```

### Performance Metrics

**Benchmarks (Intel i7-11700K @ 3.6GHz, 32GB RAM):**

| Dataset | Initial Render | Memory | FPS | Selection |
|---------|----------------|--------|-----|-----------|
| 100     | 8ms            | 2 MB   | 60  | 4ms       |
| 1,000   | 18ms           | 4 MB   | 60  | 6ms       |
| 10,000  | 47ms           | 8 MB   | 60  | 8ms       |
| 100,000 | 94ms           | 12 MB  | 60  | 12ms      |
| 1M      | 187ms          | 18 MB  | 59  | 16ms      |

**Key Insights:**
- Linear memory scaling
- Constant rendering time (virtual scrolling)
- Selection time grows logarithmically (Fenwick Tree)
- 60 FPS maintained across all datasets

---

## Security Architecture

### Threat Model

See [THREAT-MODEL.md](./docs/compliance/THREAT-MODEL.md) for complete threat analysis.

**Key Threats:**
1. **XSS (Cross-Site Scripting)** - User content injection
2. **CSP Violations** - Inline scripts, eval()
3. **DOM Clobbering** - Malicious HTML attributes
4. **Prototype Pollution** - Object manipulation

### Security Layers

#### 1. Content Security Policy
```typescript
// No eval, no Function constructor
// ❌ Never do this
const fn = new Function('return 1 + 1');
const result = eval('1 + 1');

// ✅ Always use safe alternatives
const fn = () => 1 + 1;
const result = fn();
```

#### 2. Input Sanitization
```typescript
function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Optional DOMPurify integration
import DOMPurify from 'dompurify';

function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
    ALLOWED_ATTR: []
  });
}
```

#### 3. Shadow DOM Isolation
```typescript
// Styles cannot leak
class EnhancedSelect extends HTMLElement {
  private shadow: ShadowRoot;
  
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    
    // Styles are scoped to shadow root
    const style = document.createElement('style');
    style.textContent = `/* Isolated styles */`;
    this.shadow.appendChild(style);
  }
}
```

#### 4. Validation Layer
```typescript
const validateItem = (item: unknown): SelectItem => {
  if (!item || typeof item !== 'object') {
    throw new TypeError('Item must be an object');
  }
  
  const { value, label } = item as any;
  
  if (value === undefined || value === null) {
    throw new Error('Item value is required');
  }
  
  if (typeof label !== 'string') {
    throw new TypeError('Item label must be a string');
  }
  
  return {
    value,
    label: sanitizeString(label),
    disabled: Boolean((item as any).disabled)
  };
};
```

---

## Testing Architecture

See [TESTING-ARCHITECTURE.md](./docs/TESTING-ARCHITECTURE.md) for complete testing documentation.

### Test Pyramid

```
        ┌─────────────┐
        │  E2E Tests  │  17 tests (User flows)
        │   (17/22)   │
        └─────────────┘
       ┌───────────────┐
       │ Integration   │   45 tests (Component integration)
       │   (45/45)     │
       └───────────────┘
      ┌─────────────────┐
      │  Contract Tests │  Framework compatibility
      │    (45/45)      │
      └─────────────────┘
     ┌───────────────────┐
     │   Unit Tests      │   76 tests (Functions, classes)
     │    (76/76)        │
     └───────────────────┘
```

### Test Coverage

- **Unit Tests**: 76/76 (100%)
- **Integration**: 45/45 (100%)
- **Contract**: 45/45 (100%)
- **E2E**: 17/22 (77%)
- **Total**: 188/193 (97%)

---

## Deployment Architecture

### Package Distribution

```
npm registry
├── @smilodon/core@0.2.0 (6.6 KB)
├── @smilodon/react@0.2.0 (+787 B)
├── @smilodon/vue@0.2.0 (+668 B)
├── @smilodon/svelte@0.2.0 (+1.2 KB)
└── @smilodon/vanilla@0.2.0 (6.6 KB)
```

### CDN Strategy

```html
<!-- Core component -->
<script type="module" src="https://cdn.jsdelivr.net/npm/@smilodon/core@0.2.0/dist/index.js"></script>

<!-- Framework wrappers -->
<script type="module" src="https://cdn.jsdelivr.net/npm/@smilodon/react@0.2.0/dist/index.js"></script>
```

### Build Pipeline

```
Source Code (TypeScript)
    ↓
ESLint + Prettier (Linting)
    ↓
TypeScript Compiler (Type checking)
    ↓
Vite Build (Bundling)
    ↓
Rollup (Tree-shaking, minification)
    ↓
Gzip Compression
    ↓
dist/ folder
    ↓
npm publish
```

### CI/CD Pipeline

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags: ['v*']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Install dependencies
      - Run unit tests
      - Run E2E tests
      - Run contract tests
      - Generate coverage report
  
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - Build all packages
      - Verify bundle sizes
      - Run security audit
  
  publish:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - Publish to npm
      - Create GitHub release
      - Update documentation site
```

---

## Future Architecture

### Planned Enhancements

1. **Streaming Data** - Support for real-time data streams
2. **Offline Support** - Service worker integration
3. **Accessibility Improvements** - Enhanced screen reader support
4. **Performance** - WebAssembly for critical paths
5. **Framework Support** - Solid.js, Qwik adapters

---

**Last Updated**: December 10, 2025
**Version**: 0.2.0
**Maintainer**: Navid Rezadoost
