# Testing Architecture

This document outlines the comprehensive testing strategy for the Smilodon UI toolkit, ensuring consistent behavior, performance, and API across all framework adapters (React, Vue, Svelte, and Vanilla JS).

## Testing Philosophy

We test from the perspective of an end developer who:
1. Installs `@smilodon/{framework}` via npm
2. Imports and uses the component in their project
3. Expects consistent behavior across all frameworks
4. Needs clear error messages when something goes wrong

## Testing Pyramid

```
                    ┌─────────────────┐
                    │   E2E Tests     │  ← Cross-framework visual & interaction
                    │   (Playwright)  │
                    └─────────────────┘
                  ┌───────────────────────┐
                  │  Contract Tests       │  ← API consistency
                  │  (Testing Library)    │
                  └───────────────────────┘
              ┌───────────────────────────────┐
              │   Unit Tests                  │  ← Core logic only
              │   (Vitest)                    │
              └───────────────────────────────┘
```

## 1. Unit Tests (Core Package Only)

**Location:** `packages/core/tests/`

**Purpose:** Test core web component logic without framework dependencies

**Tool:** Vitest

**Coverage:**
- Component initialization and lifecycle
- Item management (setItems, setGroupedItems)
- Selection logic (single, multi-select)
- Search/filter functionality
- Virtual scrolling calculations
- Infinite scroll pagination
- Event emission and handling
- Accessibility attributes (ARIA)
- Keyboard navigation
- Performance benchmarks

**Run:**
```bash
npm run test:core
npm run test:core:watch
npm run test:core:coverage
```

**Example:**
```typescript
// packages/core/tests/selection.spec.ts
import { describe, it, expect } from 'vitest';

describe('Selection Logic', () => {
  it('should select single item', () => {
    const select = document.createElement('enhanced-select');
    select.setItems([...]);
    select.setSelectedValues(['item1']);
    expect(select.getSelectedValues()).toEqual(['item1']);
  });
});
```

## 2. Adapter Contract Tests

**Location:** `tests/contracts/`

**Purpose:** Ensure all framework adapters provide the same API and behavior

**Tool:** Vitest + Framework Testing Libraries
- React: `@testing-library/react`
- Vue: `@testing-library/vue`
- Svelte: `@testing-library/svelte`
- Angular: `@angular/core/testing`
- Vanilla: DOM Testing Library

**Test Matrix:**

| Test Case | React | Vue | Svelte | Angular | Vanilla |
|-----------|-------|-----|--------|---------|---------|
| ✅ Render with items | ✓ | ✓ | ✓ | ✓ | ✓ |
| ✅ setValue() updates UI | ✓ | ✓ | ✓ | ✓ | ✓ |
| ✅ User selection triggers onChange | ✓ | ✓ | ✓ | ✓ | ✓ |
| ✅ Multi-select mode | ✓ | ✓ | ✓ | ✓ | ✓ |
| ✅ Search filtering | ✓ | ✓ | ✓ | ✓ | ✓ |
| ✅ Keyboard navigation | ✓ | ✓ | ✓ | ✓ | ✓ |
| ✅ Disabled state | ✓ | ✓ | ✓ | ✓ | ✓ |
| ✅ Error state | ✓ | ✓ | ✓ | ✓ | ✓ |
| ✅ Imperative API (ref) | ✓ | ✓ | ✓ | ✓ | ✓ |
| ✅ Event callbacks | ✓ | ✓ | ✓ | ✓ | ✓ |
| ✅ Grouped items | ✓ | ✓ | ✓ | ✓ | ✓ |
| ✅ Dynamic item updates | ✓ | ✓ | ✓ | ✓ | ✓ |

**Contract Definition:**
```typescript
// tests/contracts/select-contract.ts
export interface SelectContract {
  // Rendering
  rendersWithItems: () => Promise<void>;
  rendersPlaceholder: () => Promise<void>;
  
  // Value Management
  setValueUpdatesUI: () => Promise<void>;
  getValueReturnsCorrectValue: () => Promise<void>;
  
  // User Interaction
  clickItemSelectsIt: () => Promise<void>;
  searchFiltersItems: () => Promise<void>;
  keyboardNavigationWorks: () => Promise<void>;
  
  // Events
  onChangeFiresOnSelection: () => Promise<void>;
  onOpenFiresWhenOpened: () => Promise<void>;
  onCloseFiresWhenClosed: () => Promise<void>;
  
  // State Management
  disabledPreventsInteraction: () => Promise<void>;
  errorStateDisplaysCorrectly: () => Promise<void>;
  
  // Imperative API
  refOpenMethodWorks: () => Promise<void>;
  refCloseMethodWorks: () => Promise<void>;
  refClearMethodWorks: () => Promise<void>;
}
```

**Run:**
```bash
npm run test:contracts
npm run test:contracts:react
npm run test:contracts:vue
npm run test:contracts:svelte
npm run test:contracts:angular
npm run test:contracts:vanilla
```

## 3. End-to-End Tests

**Location:** `tests/e2e/`

**Purpose:** Test real user interactions across all frameworks

**Tool:** Playwright

**Test Scenarios:**

### Core Scenarios (All Frameworks)
1. **Basic Selection**
   - Open dropdown
   - Click item
   - Verify selection
   - Check onChange callback

2. **Multi-Select**
   - Enable multi-select
   - Select multiple items
   - Verify all selected
   - Deselect item

3. **Search**
   - Type in search box
   - Verify filtered results
   - Select from filtered results

4. **Keyboard Navigation**
   - Tab to select
   - Arrow keys to navigate
   - Enter to select
   - Escape to close

5. **Large Dataset (Virtual Scroll)**
   - Load 10,000 items
   - Scroll through list
   - Verify smooth performance
   - Select item from middle

6. **Infinite Scroll**
   - Load initial page
   - Scroll to bottom
   - Verify next page loads
   - Select from new page

7. **Grouped Options**
   - Render groups
   - Navigate between groups
   - Select from each group

8. **Error States**
   - Show error styling
   - Display error message
   - Verify accessibility

**Framework-Specific Setup:**

```typescript
// tests/e2e/fixtures/frameworks.ts
export const frameworks = {
  react: {
    url: 'http://localhost:5173',
    buildCommand: 'npm run build -w @smilodon/react',
    serveCommand: 'npm run preview -w playground-react',
  },
  vue: {
    url: 'http://localhost:5174',
    buildCommand: 'npm run build -w @smilodon/vue',
    serveCommand: 'npm run preview -w playground-vue',
  },
  svelte: {
    url: 'http://localhost:5175',
    buildCommand: 'npm run build -w @smilodon/svelte',
    serveCommand: 'npm run preview -w playground-svelte',
  },
  angular: {
    url: 'http://localhost:5176',
    buildCommand: 'npm run build -w @smilodon/angular',
    serveCommand: 'npm run preview -w playground-angular',
  },
  vanilla: {
    url: 'http://localhost:5177',
    buildCommand: 'npm run build -w @smilodon/vanilla',
    serveCommand: 'npm run preview -w playground-vanilla',
  },
};
```

**Run:**
```bash
npm run test:e2e              # All frameworks
npm run test:e2e:react        # React only
npm run test:e2e:vue          # Vue only
npm run test:e2e:svelte       # Svelte only
npm run test:e2e:angular      # Angular only
npm run test:e2e:vanilla      # Vanilla only
npm run test:e2e:headed       # With browser UI
```

## 4. Visual Regression Tests

**Location:** `tests/visual/`

**Purpose:** Ensure UI consistency across frameworks

**Tool:** Playwright + Percy or Chromatic

**Scenarios:**
- Default state
- Open dropdown
- Selected item
- Multi-select with 3 items
- Error state
- Disabled state
- Searchable with results
- Grouped options
- Virtual scroll (top, middle, bottom)

**Run:**
```bash
npm run test:visual
npm run test:visual:update    # Update snapshots
```

## 5. Performance Tests

**Location:** `tests/performance/`

**Purpose:** Ensure consistent performance across frameworks

**Metrics:**
- Initial render time
- Time to interactive
- Bundle size (gzipped)
- Memory usage
- Virtual scroll FPS
- Search responsiveness

**Benchmarks:**
```typescript
export const performanceBenchmarks = {
  initialRender: {
    max: 50, // ms
    items: 100,
  },
  virtualScroll: {
    minFPS: 55,
    items: 10000,
  },
  search: {
    maxDelay: 16, // ms (60fps)
    items: 1000,
  },
  bundleSize: {
    maxGzipped: 5000, // bytes (5KB)
  },
};
```

**Run:**
```bash
npm run test:perf
npm run test:perf:react
npm run test:perf:compare     # Compare all frameworks
```

## 6. Accessibility Tests

**Location:** `tests/a11y/`

**Purpose:** Ensure WCAG 2.1 AAA compliance across frameworks

**Tool:** axe-core + Playwright

**Checks:**
- ARIA attributes
- Keyboard navigation
- Focus management
- Screen reader announcements
- Color contrast
- Touch target sizes
- Semantic HTML

**Run:**
```bash
npm run test:a11y
npm run test:a11y:report      # Generate detailed report
```

## Test Execution Strategy

### Local Development
```bash
# Quick feedback loop
npm test                       # Run all unit tests
npm run test:contracts         # Verify adapter consistency
npm run test:e2e:quick         # Smoke tests only
```

### Pre-Commit
```bash
# Runs via Husky
npm run test:pre-commit
  → Unit tests (changed files)
  → Contract tests (changed adapters)
  → Lint
  → Type check
```

### Pull Request CI
```bash
# GitHub Actions
npm run test:ci
  → All unit tests
  → All contract tests
  → E2E tests (critical paths)
  → Visual regression (changed components)
  → Performance benchmarks
  → Accessibility audit
```

### Release CI
```bash
# Before publishing
npm run test:release
  → Full test suite
  → All E2E scenarios
  → All visual regressions
  → Performance regression check
  → Bundle size verification
  → Documentation build
```

## Debugging Strategy

### Framework-Specific Issues

**1. Identify the Layer:**
```
Is it Core? → Test with vanilla web component
Is it Adapter? → Test with another framework
Is it Build? → Check bundle output
```

**2. Isolate the Problem:**
```bash
# Create minimal reproduction
npm run playground:react      # Start dev server
# Modify playground/react/App.tsx to reproduce issue
```

**3. Debug Tools:**
- React: React DevTools
- Vue: Vue DevTools
- Svelte: Svelte DevTools
- Angular: Angular DevTools
- Vanilla: Browser DevTools

**4. Contract Test:**
```bash
# Verify if behavior differs across frameworks
npm run test:contracts -- --grep "specific test"
```

### Performance Issues

**1. Measure:**
```bash
npm run test:perf:profile     # Generate flame graph
```

**2. Compare:**
```bash
npm run test:perf:compare     # Compare across frameworks
```

**3. Analyze:**
- Check bundle size: `npm run size`
- Check render count: Use React Profiler / Vue DevTools
- Check memory: Browser Memory Profiler

## Continuous Monitoring

### Metrics Dashboard
- Test pass rate per framework
- Bundle size trends
- Performance metrics over time
- Coverage reports

### Alerts
- Test failures in CI
- Performance regression > 10%
- Bundle size increase > 1KB
- Accessibility violations

## File Structure

```
smilodon/
├── packages/
│   ├── core/
│   │   └── tests/              # Unit tests (Vitest)
│   ├── react/
│   │   └── tests/              # React-specific tests
│   ├── vue/
│   │   └── tests/              # Vue-specific tests
│   ├── svelte/
│   │   └── tests/              # Svelte-specific tests
│   ├── angular/
│   │   └── tests/              # Angular-specific tests
│   └── vanilla/
│       └── tests/              # Vanilla-specific tests
├── tests/
│   ├── contracts/              # Adapter contract tests
│   │   ├── fixtures/           # Shared test data
│   │   ├── react.spec.ts
│   │   ├── vue.spec.ts
│   │   ├── svelte.spec.ts
│   │   ├── angular.spec.ts
│   │   └── vanilla.spec.ts
│   ├── e2e/                    # E2E tests (Playwright)
│   │   ├── fixtures/
│   │   ├── scenarios/
│   │   │   ├── basic-selection.spec.ts
│   │   │   ├── multi-select.spec.ts
│   │   │   ├── search.spec.ts
│   │   │   ├── keyboard-nav.spec.ts
│   │   │   └── virtual-scroll.spec.ts
│   │   └── playwright.config.ts
│   ├── visual/                 # Visual regression
│   │   ├── screenshots/
│   │   └── visual.spec.ts
│   ├── performance/            # Performance benchmarks
│   │   ├── benchmarks/
│   │   └── perf.spec.ts
│   └── a11y/                   # Accessibility tests
│       └── a11y.spec.ts
├── playground/                 # Test applications
│   ├── react/
│   ├── vue/
│   ├── svelte/
│   ├── angular/
│   └── vanilla/
└── .github/
    └── workflows/
        ├── test-unit.yml
        ├── test-contracts.yml
        ├── test-e2e.yml
        └── test-release.yml
```

## Best Practices

### 1. Test Isolation
- Each test should be independent
- No shared state between tests
- Clean up after each test

### 2. Deterministic Tests
- No random data in tests
- Use fixed timestamps
- Mock external dependencies

### 3. Clear Assertions
```typescript
// ❌ Bad
expect(result).toBeTruthy();

// ✅ Good
expect(result).toEqual({ value: 'expected', items: [...] });
```

### 4. Descriptive Test Names
```typescript
// ❌ Bad
it('works', () => {});

// ✅ Good
it('should emit onChange event when user selects an item', () => {});
```

### 5. Test What Users Do
```typescript
// ❌ Bad - Testing implementation
expect(component.state.isOpen).toBe(true);

// ✅ Good - Testing behavior
expect(screen.getByRole('listbox')).toBeVisible();
```

## Conclusion

This testing architecture ensures:
- ✅ **Consistency:** Same behavior across all frameworks
- ✅ **Quality:** Comprehensive coverage at all levels
- ✅ **Speed:** Fast feedback during development
- ✅ **Confidence:** Safe refactoring and releases
- ✅ **Maintainability:** Clear structure and documentation
- ✅ **Professional:** Production-ready testing practices
