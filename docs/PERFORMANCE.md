# Performance Tuning Guide

Optimize `@smilodon` for maximum performance.

---

## Table of Contents

1. [Performance Goals](#performance-goals)
2. [Quick Wins](#quick-wins)
3. [Virtualizer Tuning](#virtualizer-tuning)
4. [Web Workers](#web-workers)
5. [Memory Optimization](#memory-optimization)
6. [Bundle Size Optimization](#bundle-size-optimization)
7. [Profiling & Monitoring](#profiling--monitoring)
8. [Troubleshooting](#troubleshooting)
9. [Performance Runbook](#performance-runbook)

---

## Performance Goals

### Target Metrics

| Metric | Target | Excellent |
|--------|--------|-----------|
| Initial render | <100ms | **<50ms** ✅ |
| Scroll FPS | 30+ | **60 FPS** ✅ |
| Selection latency | <50ms | **<16ms** ✅ |
| Memory usage | <20 MB | **<10 MB** ✅ |
| Bundle size | <10 KB | **6.6 KB** ✅ |

### Performance by Dataset Size

| Items | Render Time | Memory | Scroll FPS |
|-------|-------------|--------|------------|
| 100 | <10ms | 2 MB | 60 FPS |
| 1,000 | <20ms | 4 MB | 60 FPS |
| 10,000 | <50ms | 8 MB | 60 FPS |
| 100,000 | <100ms | 12 MB | 60 FPS |
| 1,000,000 | <200ms | 18 MB | 60 FPS |

---

## Performance Runbook

For step-by-step, repeatable **manual browser measurements**, see
[`PERFORMANCE-RUNBOOK.md`](./PERFORMANCE-RUNBOOK.md).

## Quick Wins

### 1. Set Accurate Item Height

**Impact**: 🚀🚀🚀 (High)

```tsx
// ❌ Bad: Inaccurate estimate
<NativeSelect
  items={items}
  estimatedItemHeight={48}  // Items are actually 72px
/>
// Result: Janky scrollbar, incorrect scroll positions

// ✅ Good: Accurate estimate
<NativeSelect
  items={items}
  estimatedItemHeight={72}  // Matches CSS
/>
```

**How to find accurate height**:

```typescript
// Method 1: Measure in browser DevTools
// 1. Inspect any item element
// 2. Check computed height in DevTools

// Method 2: Measure programmatically
const item = document.querySelector('[role="option"]');
const height = item?.getBoundingClientRect().height;
console.log('Item height:', height);
```

### 2. Increase Buffer for Fast Scrolling

**Impact**: 🚀🚀 (Medium-High)

```tsx
// ❌ Default: Buffer = 5
<NativeSelect items={items} />
// Result: Items may flash during fast scrolling

// ✅ Optimized: Buffer = 10-15
<NativeSelect
  items={items}
  buffer={10}  // Render 10 extra items above/below viewport
/>
// Result: Smoother scrolling, no flashing
```

**Buffer sizing guide**:
- Small datasets (<1,000): `buffer={5}` (default)
- Medium datasets (1,000-10,000): `buffer={10}`
- Large datasets (10,000+): `buffer={15}`
- Very fast scrolling: `buffer={20}`

### 3. Memoize Data

**Impact**: 🚀🚀🚀 (High)

```tsx
// ❌ Bad: Data recreated every render
function MySelect() {
  const items = generateItems(10000);  // Runs every render!
  return <NativeSelect items={items} />;
}

// ✅ Good: Memoized data
function MySelect() {
  const items = useMemo(() => generateItems(10000), []);
  return <NativeSelect items={items} />;
}

// ✅ Better: Memoized with dependencies
function MySelect({ filter }) {
  const items = useMemo(
    () => generateItems(10000).filter(filter),
    [filter]
  );
  return <NativeSelect items={items} />;
}
```

### 4. Avoid Expensive Templates

**Impact**: 🚀🚀 (Medium-High)

```tsx
// ❌ Bad: Complex template with multiple images
<NativeSelect
  items={users}
  optionTemplate={(user) => `
    <div class="user">
      <img src="${user.avatar}" />
      <img src="${user.badge}" />
      <div>
        <h3>${user.name}</h3>
        <p>${user.bio}</p>
        <small>${user.email}</small>
      </div>
    </div>
  `}
/>

// ✅ Good: Simpler template
<NativeSelect
  items={users}
  optionTemplate={(user) => `
    <div class="user">
      <strong>${user.name}</strong>
      <small>${user.email}</small>
    </div>
  `}
/>
```

### 5. Use CSS Custom Properties

**Impact**: 🚀 (Medium)

```css
/* ❌ Bad: Inline styles (CSP violations, slower) */
.custom-select [role="option"] {
  height: 48px;
  padding: 12px;
  background: #fff;
}
.custom-select [role="option"]:hover {
  background: #f0f0f0;
}

/* ✅ Good: CSS custom properties (CSP-safe, faster) */
native-select {
  --ns-item-height: 48px;
  --ns-item-padding: 12px;
  --ns-item-bg: #fff;
  --ns-item-hover-bg: #f0f0f0;
}
```

---

## Virtualizer Tuning

### Understanding Virtualization

The virtualizer renders only visible items:

```
Dataset: 10,000 items
Viewport height: 400px
Item height: 48px
Visible items: 400 / 48 ≈ 9 items
Buffer: 5 items

DOM elements created: 9 + (5 × 2) = 19 items
Memory saved: 99.8%! ✅
```

### Advanced Configuration

```tsx
<NativeSelect
  items={largeDataset}
  
  // Core settings
  estimatedItemHeight={48}  // Must be accurate!
  buffer={10}               // Extra items above/below
  
  // Performance tweaks
  portal={false}            // Disable if in normal flow
  strategy="absolute"       // Use "fixed" for overflow:hidden
/>
```

### Dynamic Item Heights

For items with varying heights:

```tsx
// If heights vary slightly (±10px)
<NativeSelect
  items={items}
  estimatedItemHeight={50}  // Use average height
  buffer={15}               // Increase buffer
/>

// If heights vary significantly
// Option 1: Normalize heights with CSS
<style>
  native-select [role="option"] {
    min-height: var(--ns-item-height);
  }
</style>

// Option 2: Use custom renderer with fixed heights
<NativeSelect
  items={items}
  optionTemplate={(item) => `
    <div style="height: 60px; overflow: hidden;">
      ${item.content}
    </div>
  `}
/>
```

### Scroll Performance

```tsx
import { useEffect, useRef } from 'react';

function OptimizedSelect() {
  const selectRef = useRef<NativeSelectElement>(null);
  
  useEffect(() => {
    const select = selectRef.current;
    if (!select) return;
    
    // Enable smooth scrolling for programmatic scrolls
    select.scrollToIndex(100, 'smooth');
    
    // Disable smooth scrolling for user scrolls (better performance)
    select.addEventListener('wheel', () => {
      select.style.scrollBehavior = 'auto';
    });
  }, []);
  
  return <NativeSelect ref={selectRef} items={items} />;
}
```

---

## Web Workers

### When to Use Workers

Use workers for:
- ✅ Datasets > 10,000 items
- ✅ Complex filtering/sorting
- ✅ Heavy data transformations
- ✅ Search-as-you-type

Don't use workers for:
- ❌ Small datasets (<1,000 items)
- ❌ Simple operations
- ❌ One-time transformations

### Basic Worker Usage

```tsx
import { WorkerManager } from '@smilodon/core';
import { useEffect, useState } from 'react';

function WorkerSelect() {
  const [items, setItems] = useState([]);
  const [worker] = useState(() => new WorkerManager());
  
  // Filter in worker
  async function handleSearch(query: string) {
    const filtered = await worker.filter(largeDataset, query);
    setItems(filtered);
  }
  
  // Cleanup
  useEffect(() => {
    return () => worker.terminate();
  }, [worker]);
  
  return (
    <div>
      <input
        type="text"
        placeholder="Search..."
        onChange={(e) => handleSearch(e.target.value)}
      />
      <NativeSelect items={items} />
    </div>
  );
}
```

### Advanced Worker Patterns

#### Parallel Processing

```tsx
const worker = new WorkerManager({ maxWorkers: 4 });

// Process multiple operations in parallel
const [filtered, sorted, mapped] = await Promise.all([
  worker.filter(items, 'query'),
  worker.sort(items, (a, b) => a.name.localeCompare(b.name)),
  worker.map(items, item => ({ ...item, processed: true }))
]);
```

#### Debounced Search

```tsx
import { useMemo, useState } from 'react';
import { debounce } from 'lodash';

function SearchSelect() {
  const [items, setItems] = useState(largeDataset);
  const worker = useMemo(() => new WorkerManager(), []);
  
  const handleSearch = useMemo(
    () => debounce(async (query: string) => {
      if (!query) {
        setItems(largeDataset);
        return;
      }
      
      const filtered = await worker.filter(largeDataset, query);
      setItems(filtered);
    }, 300),
    [worker]
  );
  
  return (
    <div>
      <input
        type="text"
        onChange={(e) => handleSearch(e.target.value)}
      />
      <NativeSelect items={items} />
    </div>
  );
}
```

#### Custom Worker Tasks

```typescript
// Create custom worker
const workerCode = `
  self.onmessage = (e) => {
    const { type, data } = e.data;
    
    if (type === 'customFilter') {
      const filtered = data.items.filter(item => {
        // Complex filtering logic
        return item.score > 0.8 && item.active;
      });
      
      self.postMessage({ type: 'result', data: filtered });
    }
  };
`;

const blob = new Blob([workerCode], { type: 'application/javascript' });
const worker = new Worker(URL.createObjectURL(blob));

worker.postMessage({ type: 'customFilter', data: { items } });
worker.onmessage = (e) => {
  if (e.data.type === 'result') {
    setItems(e.data.data);
  }
};
```

---

## Memory Optimization

### Memory Profiling

Use Chrome DevTools Memory Profiler:

```typescript
// Take heap snapshot before
console.profile('NativeSelect');

// Use component
<NativeSelect items={largeDataset} />

// Take heap snapshot after
console.profileEnd('NativeSelect');
```

### Reduce Memory Usage

#### 1. Limit DOM Elements

```tsx
// ❌ Bad: Large buffer = more DOM elements
<NativeSelect items={items} buffer={50} />
// Memory: ~15 MB

// ✅ Good: Smaller buffer
<NativeSelect items={items} buffer={10} />
// Memory: ~8 MB
```

#### 2. Avoid Large Objects

```tsx
// ❌ Bad: Storing entire objects
const items = users.map(user => ({
  id: user.id,
  label: user.name,
  avatar: user.avatar,
  bio: user.bio,
  metadata: user.metadata,  // Large nested object
  history: user.history     // Large array
}));

// ✅ Good: Only store what's needed
const items = users.map(user => ({
  id: user.id,
  label: user.name,
  avatar: user.avatar
}));

// Store full objects separately
const userMap = new Map(users.map(u => [u.id, u]));
```

#### 3. Clean Up Resources

```tsx
function MySelect() {
  const worker = useMemo(() => new WorkerManager(), []);
  
  // ❌ Bad: No cleanup
  // Workers leak memory!
  
  // ✅ Good: Cleanup on unmount
  useEffect(() => {
    return () => {
      worker.terminate();
    };
  }, [worker]);
  
  return <NativeSelect items={items} />;
}
```

#### 4. Use Pagination for Massive Datasets

```tsx
// For datasets > 100,000 items
function PaginatedSelect() {
  const [page, setPage] = useState(0);
  const pageSize = 10000;
  
  const items = useMemo(
    () => largeDataset.slice(page * pageSize, (page + 1) * pageSize),
    [page]
  );
  
  return (
    <div>
      <NativeSelect items={items} />
      <button onClick={() => setPage(p => Math.max(0, p - 1))}>
        Previous
      </button>
      <button onClick={() => setPage(p => p + 1)}>
        Next
      </button>
    </div>
  );
}
```

---

## Bundle Size Optimization

### Tree-Shaking

Only import what you need:

```tsx
// ❌ Bad: Imports everything
import * as NativeSelect from '@smilodon/core';

// ✅ Good: Tree-shakeable imports
import { NativeSelect } from '@smilodon/react';
import { WorkerManager, getTelemetry } from '@smilodon/core';
```

### Bundle Analysis

```bash
# Analyze bundle
npm install -D webpack-bundle-analyzer

# Add to webpack config
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin()
  ]
};

# Or use Vite
npm install -D rollup-plugin-visualizer
```

### Code Splitting

```tsx
// Lazy load select component
const NativeSelect = lazy(() => import('@smilodon/react'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NativeSelect items={items} />
    </Suspense>
  );
}
```

### Conditional Features

```tsx
// Only load workers when needed
let WorkerManager: any;

async function enableWorkers() {
  if (!WorkerManager) {
    const module = await import('@smilodon/core');
    WorkerManager = module.WorkerManager;
  }
  return new WorkerManager();
}

// Usage
const worker = await enableWorkers();
const filtered = await worker.filter(items, query);
```

---

## Profiling & Monitoring

### Built-in Telemetry

```tsx
import { getTelemetry } from '@smilodon/core';

function ProfiledSelect() {
  const telemetry = getTelemetry();
  
  useEffect(() => {
    telemetry.startRecording();
    
    return () => {
      const metrics = telemetry.getMetrics();
      console.table({
        'Render Time': `${metrics.renderTime}ms`,
        'Scroll FPS': metrics.scrollFPS,
        'Memory': `${metrics.memoryUsage.toFixed(2)} MB`,
        'Items': metrics.itemCount,
        'Rendered': metrics.renderedItems
      });
      
      telemetry.stopRecording();
    };
  }, []);
  
  return <NativeSelect items={items} />;
}
```

### Custom Performance Marks

```tsx
import { getTelemetry } from '@smilodon/core';

const telemetry = getTelemetry();

// Mark start
telemetry.mark('filter-start');

// Do work
const filtered = items.filter(predicate);

// Mark end
telemetry.mark('filter-end');

// Measure
const duration = telemetry.measure('filter', 'filter-start', 'filter-end');
console.log(`Filtering took ${duration}ms`);
```

### React DevTools Profiler

```tsx
import { Profiler } from 'react';

function App() {
  return (
    <Profiler
      id="NativeSelect"
      onRender={(id, phase, actualDuration) => {
        console.log(`${id} (${phase}) took ${actualDuration}ms`);
      }}
    >
      <NativeSelect items={items} />
    </Profiler>
  );
}
```

### Performance Observer

```typescript
// Monitor long tasks
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration > 50) {
      console.warn('Long task detected:', entry);
    }
  }
});

observer.observe({ entryTypes: ['longtask'] });
```

---

## Troubleshooting

### Issue: Slow Initial Render

**Symptoms**: First render takes >100ms

**Diagnosis**:
```typescript
import { getTelemetry } from '@smilodon/core';

const telemetry = getTelemetry();
telemetry.startRecording();

// ... render component

const metrics = telemetry.getMetrics();
console.log('Render time:', metrics.renderTime);
```

**Solutions**:
1. Reduce item count (paginate or filter)
2. Simplify `optionTemplate`
3. Memoize items array
4. Use code splitting

### Issue: Janky Scrolling

**Symptoms**: Scroll FPS < 30

**Diagnosis**:
```typescript
const metrics = telemetry.getMetrics();
console.log('Scroll FPS:', metrics.scrollFPS);
```

**Solutions**:
1. Set accurate `estimatedItemHeight`
2. Increase `buffer` value
3. Simplify item templates
4. Remove expensive CSS (box-shadow, gradients)
5. Use `will-change: transform` sparingly

```css
/* ❌ Bad: Too many expensive styles */
[role="option"] {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  background: linear-gradient(to bottom, #fff, #f5f5f5);
  transition: all 0.3s;
}

/* ✅ Good: Simple, performant styles */
[role="option"] {
  background: var(--ns-item-bg);
  transition: background-color 0.15s;
}
```

### Issue: High Memory Usage

**Symptoms**: Memory > 20 MB

**Diagnosis**:
```typescript
const metrics = telemetry.getMetrics();
console.log('Memory:', metrics.memoryUsage, 'MB');
```

**Solutions**:
1. Reduce `buffer` size
2. Remove unnecessary data from items
3. Terminate workers when not needed
4. Use pagination for massive datasets

### Issue: Large Bundle Size

**Symptoms**: Bundle > 10 KB

**Diagnosis**:
```bash
# Check bundle size
npm run build
ls -lh dist/*.js | awk '{print $5, $9}'
```

**Solutions**:
1. Import only what you need
2. Enable tree-shaking
3. Use code splitting
4. Check for duplicate dependencies

```bash
# Find duplicates
npm ls @smilodon/core
```

---

## Performance Checklist

### Before Optimization

- [ ] Measure current performance
- [ ] Identify bottlenecks
- [ ] Set performance goals
- [ ] Profile with DevTools

### During Optimization

- [ ] Set accurate `estimatedItemHeight`
- [ ] Optimize `buffer` value
- [ ] Memoize data
- [ ] Simplify templates
- [ ] Use workers for heavy tasks
- [ ] Enable tree-shaking
- [ ] Monitor bundle size

### After Optimization

- [ ] Verify metrics improved
- [ ] Test on low-end devices
- [ ] Check memory usage
- [ ] Validate bundle size
- [ ] Document optimizations

---

## Real-World Examples

### E-commerce Product Select (50,000 products)

```tsx
function ProductSelect() {
  const worker = useMemo(() => new WorkerManager(), []);
  const [items, setItems] = useState(products);
  
  const handleSearch = useMemo(
    () => debounce(async (query: string) => {
      const filtered = await worker.filter(products, query);
      setItems(filtered);
    }, 300),
    [worker]
  );
  
  useEffect(() => {
    return () => worker.terminate();
  }, [worker]);
  
  return (
    <div>
      <input
        type="text"
        placeholder="Search products..."
        onChange={(e) => handleSearch(e.target.value)}
      />
      <NativeSelect
        items={items}
        estimatedItemHeight={80}
        buffer={12}
        optionTemplate={(product) => `
          <div class="product">
            <img src="${product.thumbnail}" alt="" />
            <div>
              <strong>${product.name}</strong>
              <span>$${product.price}</span>
            </div>
          </div>
        `}
      />
    </div>
  );
}
```

**Performance**:
- Initial render: 45ms ✅
- Scroll: 60 FPS ✅
- Search: <100ms ✅
- Memory: 12 MB ✅

---

## Next Steps

- 📖 [API Reference](./API-REFERENCE.md) - Full API docs
- 🎨 [Styling Guide](./STYLING.md) - Advanced theming
- 🔒 [Security Guide](../.azure/phase9-security-guide.md) - CSP & security
- 📘 [Getting Started](./GETTING-STARTED.md) - Quick start guide

---

**Need help?** Ask in [GitHub Discussions](https://github.com/native-select/native-select/discussions)!
