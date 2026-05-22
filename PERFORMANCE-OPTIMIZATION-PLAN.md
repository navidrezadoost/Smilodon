# Performance Optimization Plan

## Executive Summary

Comprehensive plan to optimize JavaScript engine performance by eliminating patterns that cause TurboFan deoptimization, reducing overhead, and applying modern performance paradigms.

**Goal**: Eliminate engine pressure while maintaining functionality through careful, regression-tested changes.

---

## ❌ WebGPU for Multi-Select: NOT RECOMMENDED

**Verdict**: Overkill and counterproductive

**Reasons**:
- GPU communication overhead > DOM manipulation cost for typical use cases
- WebGPU shines for: heavy compute, parallel algorithms, 3D graphics
- Current approach (virtual scrolling + DOM recycling) is already optimal
- Adding WebGPU would introduce complexity without performance gain

**Current optimal approach**: 
✅ Virtual scrolling (Virtualizer)
✅ DOM element pooling  
✅ requestAnimationFrame batching
✅ CSS containment

---

## 🎯 Optimization Opportunities Found

### 1. **Switch Statements → Lookup Objects** ✅ PARTIALLY DONE

**Status**: 50% complete

**Remaining switches to convert**:

#### A. `native-select.ts` - attributeChangedCallback (Line 115)
```typescript
// BEFORE (switch)
attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null) {
  switch (name) {
    case 'placement':
      this._options.placement = ...;
      break;
    // ... more cases
  }
}

// AFTER (lookup object)
private _attributeHandlers: Record<string, (value: string | null) => void> = {
  'placement': (v) => { this._options.placement = v ?? undefined; },
  'strategy': (v) => { this._options.strategy = v ?? undefined; },
  'portal': (v) => { this._options.portal = v === 'true' ? true : v === 'false' ? false : undefined; },
};

attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null) {
  this._attributeHandlers[name]?.(newValue);
}
```

**Performance gain**: O(1) lookup vs O(n) case checking

---

#### B. `worker-manager.ts` - generateWorkerCode switch (Line 106)
```typescript
// Inside worker code - convert switch to lookup object
const operations = {
  'transform': handleTransform,
  'search': handleSearch,
  'filter': handleFilter,
  'sort': handleSort,
};

// Replace switch with:
const handler = operations[type];
if (!handler) throw new Error('Unknown operation: ' + type);
result = handler(payload);
```

**Performance gain**: Faster dispatch, better branch prediction

---

### 2. **TurboFan Optimizations**

#### A. **Monomorphic Function Calls**

**Problem**: Polymorphic call sites prevent inlining

**Example found** in `native-select.ts:398`:
```typescript
// POLYMORPHIC (bad)
selectedValues: Array.from(this._selectedItems.values()).map(i => (i as any)?.value ?? i)
```

**Fix**: Separate code paths for different types
```typescript
// MONOMORPHIC (good)
private _getSelectedValues(): unknown[] {
  const result: unknown[] = [];
  for (const item of this._selectedItems.values()) {
    // Type guard ensures monomorphic access
    if (item && typeof item === 'object' && 'value' in item) {
      result.push(item.value);
    } else {
      result.push(item);
    }
  }
  return result;
}
```

**Performance gain**: Enables inline caching, 2-5x faster

---

#### B. **Avoid `forEach` in Hot Paths**

**Problem**: `forEach` creates function closures that prevent optimization

**Found in**:
- `worker-manager.ts:278` - Search function
- `custom-option-pool.ts:122` - Batch release
- `enhanced-select.ts:342` - Style target iteration

**Pattern to replace**:
```typescript
// BEFORE (forEach - creates closure)
items.forEach((item, index) => {
  const text = String(item).toLowerCase();
  if (text.includes(query)) results.push({ item, index });
});

// AFTER (for-loop - inlineable)
for (let index = 0; index < items.length; index++) {
  const item = items[index];
  const text = String(item).toLowerCase();
  if (text.includes(query)) results.push({ item, index });
}
```

**Performance gain**: 
- Eliminates closure allocation
- Enables loop unrolling
- Better CPU cache utilization
- 10-30% faster in hot paths

---

#### C. **Eliminate Array.from + map chains**

**Found in**: `native-select.ts:228, 398`

```typescript
// BEFORE (creates 2 intermediate arrays)
const values = Array.from(this._selectedItems.values()).map(item => {
  const v = item?.value ?? item;
  return typeof v === 'function' ? v() : v;
});

// AFTER (single pass, no intermediates)  
const values: unknown[] = [];
for (const item of this._selectedItems.values()) {
  const v = item?.value ?? item;
  values.push(typeof v === 'function' ? v() : v);
}
```

**Performance gain**: 
- Zero intermediate allocations
- Linear memory access
- 2-3x faster for large arrays

---

### 3. **Remove Unused Parameters**

**Problem**: Extra parameters prevent optimization and waste stack space

**Examples to audit**:
```typescript
// BEFORE
attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null)

// AFTER (if oldValue never used)
attributeChangedCallback(name: string, newValue: string | null)
```

**Action**: Full codebase audit with ESLint rule: `no-unused-vars`

---

### 4. **Reduce Function Indirection**

**Problem**: Extra function calls prevent inlining

**Found in**: `worker-manager.ts:271-280` (executeFallback)

```typescript
// BEFORE (function creates another function)
'transform': <T>(payload: any): T => {
  const { items, transformer } = payload as TransformRequest;
  const fn = new Function('item', 'index', `return (${transformer})(item, index)`);
  return items.map((item, i) => fn(item, i)) as T;
}

// AFTER (inline execution, avoid map closure)
'transform': <T>(payload: any): T => {
  const { items, transformer } = payload as TransformRequest;
  const fn = new Function('item', 'index', `return (${transformer})(item, index)`);
  const result: unknown[] = [];
  for (let i = 0; i < items.length; i++) {
    result.push(fn(items[i], i));
  }
  return result as T;
}
```

---

### 5. **Loop Optimization Patterns**

#### A. **Hoist invariant computations**
```typescript
// BEFORE
for (let i = 0; i < items.length; i++) {
  if (text.toLowerCase().includes(query.toLowerCase())) {
    results.push(items[i]);
  }
}

// AFTER
const lowerQuery = query.toLowerCase();
for (let i = 0; i < items.length; i++) {
  if (text.toLowerCase().includes(lowerQuery)) {
    results.push(items[i]);
  }
}
```

#### B. **Reverse loops for decrementing counters**
```typescript
// CPU prefers counting down to zero
for (let i = items.length - 1; i >= 0; i--) {
  // process items[i]
}
```

#### C. **Unroll small fixed-size loops**
```typescript
// BEFORE (loop overhead)
for (let i = 0; i < 4; i++) {
  process(coords[i]);
}

// AFTER (unrolled)
process(coords[0]);
process(coords[1]);
process(coords[2]);
process(coords[3]);
```

---

### 6. **for...in Elimination**

**Found in**: 2 locations
- `global-config.ts:439`
- `enhanced-select.ts:4303`

```typescript
// BEFORE (slow, unpredictable property order)
for (const key in source) {
  if (source.hasOwnProperty(key)) {
    target[key] = source[key];
  }
}

// AFTER (fast, predictable)
const keys = Object.keys(source);
for (let i = 0; i < keys.length; i++) {
  const key = keys[i];
  target[key] = source[key];
}
```

---

## 📋 Implementation Priority

### Phase 1: High Impact, Low Risk ✅
1. [x] Convert keyboard handlers to lookup objects (DONE)
2. [x] Convert executeFallback to lookup object (DONE)  
3. [ ] Convert attributeChangedCallback to lookup object
4. [ ] Convert worker switch statement to lookup object

### Phase 2: Medium Impact, Medium Risk ⚠️
5. [ ] Replace forEach with for-loops in hot paths
6. [ ] Eliminate Array.from + map chains
7. [ ] Remove for...in loops
8. [ ] Make function calls monomorphic

### Phase 3: High Impact, Higher Risk 🔥
9. [ ] Inline small frequently-called functions
10. [ ] Unroll fixed-size loops
11. [ ] Remove unused parameters (requires API audit)

---

## 🧪 Regression Testing Strategy

**CRITICAL**: Each optimization must have corresponding tests

### Test Types Required:

#### 1. **Functional Tests**
```typescript
describe('Optimized keyboard handlers', () => {
  it('should handle ArrowDown exactly as before', () => {
    // Test all key combinations
  });
});
```

#### 2. **Performance Benchmarks**
```typescript
describe('Performance regression tests', () => {
  it('should not regress on large option sets', () => {
    const start = performance.now();
    // Render 10,000 options
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(BASELINE_MS * 1.1);
  });
});
```

#### 3. **Memory Tests**
```typescript
it('should not leak memory', () => {
  const before = performance.memory.usedJSHeapSize;
  // Create and destroy 100 instances
  gc(); // Force garbage collection
  const after = performance.memory.usedJSHeapSize;
  expect(after - before).toBeLessThan(1024 * 1024); // < 1MB leak
});
```

#### 4. **Edge Case Tests**
- Empty arrays
- Null/undefined values
- Very large datasets (100k+ items)
- Rapid repeated calls

---

## 🔬 Profiling & Validation

### Before Each Change:
```bash
# 1. Baseline performance
npm run benchmark -- --profile

# 2. V8 deopt-explorer
node --trace-deopt --trace-opt dist/enhanced-select.js

# 3. Chrome DevTools Performance tab
# Record 10 seconds of interaction
```

### After Each Change:
```bash
# 1. Verify no regressions
npm run benchmark -- --compare baseline.json

# 2. Check for new deopts
node --trace-deopt dist/enhanced-select.js | grep "Deoptimized"

# 3. Validate memory
node --expose-gc --trace-gc dist/test.js
```

---

## 📊 Expected Performance Gains

| Optimization | Expected Improvement | Risk Level |
|--------------|---------------------|------------|
| Switch → Lookup | 5-10% in hot paths | Low ✅ |
| forEach → for | 10-30% in loops | Medium ⚠️ |
| Monomorphic calls | 2-5x in critical paths | High 🔥 |
| Array operation chains | 2-3x for large arrays | Low ✅ |
| Eliminate for...in | 10-20% in object iteration | Low ✅ |

**Overall target**: 20-40% improvement in typical workloads

---

## 🚫 Anti-Patterns to Avoid

1. **Don't optimize cold paths** - Profile first!
2. **Don't sacrifice readability** - Unless proven critical
3. **Don't assume** - Measure every change
4. **Don't batch changes** - One optimization per commit
5. **Don't skip tests** - Regressions are expensive

---

## 📝 Change Log Template

For each optimization:
```markdown
## [Optimization] Description

**File**: path/to/file.ts
**Lines**: 123-145
**Pattern**: Switch statement → Lookup object

### Before:
```typescript
// old code
```

### After:
```typescript
// new code
```

### Benchmark Results:
- Baseline: 45ms
- Optimized: 38ms  
- Improvement: 15.5%

### Tests Added:
- ✅ Functional parity test
- ✅ Performance benchmark
- ✅ Memory leak test
```

---

## 🎯 Next Steps

1. **Review and approve** this plan
2. **Set up benchmarking infrastructure**
3. **Create baseline performance profile**
4. **Implement Phase 1 optimizations**
5. **Validate with regression tests**
6. **Measure and document improvements**
7. **Proceed to Phase 2**

---

## 🤝 Review Checklist

Before merging each optimization:

- [ ] Benchmark shows improvement
- [ ] No new deoptimizations
- [ ] All tests pass
- [ ] No memory leaks
- [ ] Code review approved
- [ ] Documentation updated
- [ ] Performance metrics logged

---

**Status**: Ready for implementation
**Owner**: TBD
**Timeline**: 2-3 weeks (careful, incremental approach)
