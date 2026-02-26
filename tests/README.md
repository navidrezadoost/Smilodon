# Smilodon Testing Guide

Comprehensive testing strategy for the Smilodon monorepo, ensuring consistent behavior across all framework implementations.

## Quick Start

```bash
# Install dependencies (includes Playwright browsers)
npm install
npm run playwright:install

# Run all tests
npm test

# Run specific test suites
npm run test:unit          # Core unit tests (Vitest)
npm run test:contracts     # Framework contract tests (Testing Library)
npm run test:e2e           # End-to-end tests (Playwright)

# Run framework-specific tests
npm run test:contracts:react
npm run test:e2e:vue
npm run test:e2e:critical  # Critical path only
```

## Testing Architecture

We use a **3-layer testing pyramid**:

### 1. Unit Tests (Vitest)
- **Location**: `packages/core/tests/`
- **Purpose**: Test core library logic in isolation
- **Tools**: Vitest, jsdom
- **Speed**: Fast (< 1s)
- **Coverage**: Core utilities, algorithms, state management

```bash
npm run test:unit
npm run test:unit:watch  # Watch mode for development
```

### 2. Contract Tests (Testing Library)
- **Location**: `tests/contracts/`
- **Purpose**: Ensure all framework adapters implement the same API and behavior
- **Tools**: Vitest, @testing-library/* (framework-specific)
- **Speed**: Medium (5-10s per framework)
- **Coverage**: Framework adapter APIs, event handling, imperative methods

Each framework must implement all tests defined in `SelectContract`:

```typescript
// tests/contracts/contract-interface.ts
interface SelectContract {
  // Rendering
  testBasicRender(): Promise<ContractTestResult>;
  testRenderWithItems(): Promise<ContractTestResult>;
  
  // Selection
  testSingleSelection(): Promise<ContractTestResult>;
  testMultiSelection(): Promise<ContractTestResult>;
  
  // ... 50+ test methods
}
```

**Run contract tests:**

```bash
npm run test:contracts              # All frameworks
npm run test:contracts:react        # React only
npm run test:contracts:vue          # Vue only
npm run test:contracts:svelte       # Svelte only
npm run test:contracts:angular      # Angular only
npm run test:contracts:vanilla      # Vanilla only
```

### 3. E2E Tests (Playwright)
- **Location**: `tests/e2e/scenarios/`
- **Purpose**: Test user interactions from end-developer perspective
- **Tools**: Playwright (multi-browser)
- **Speed**: Slow (30-60s per framework)
- **Coverage**: Real browser interactions, keyboard/mouse events, accessibility

Each scenario runs against **all 5 frameworks** in **multiple browsers**:

```typescript
// tests/e2e/scenarios/basic-selection.spec.ts
test.describe('Basic Selection - react', () => {
  test('@react @all @critical should render select', async ({ page }) => {
    // Test implementation
  });
});
```

**Run E2E tests:**

```bash
npm run test:e2e                # All frameworks, all scenarios
npm run test:e2e:react          # React only
npm run test:e2e:critical       # Critical path only
npm run test:e2e:ui             # Interactive UI mode
```

### Playwright Preflight

E2E scripts now run a Playwright preflight step before executing tests:

```bash
npm run test:e2e:preflight
```

If you see very fast (`~1ms`) failures for many tests, it usually means browsers could not launch (not installed or download blocked).

Common fixes:

```bash
npm run playwright:install
```

If downloads are geo-restricted in your region, set `PLAYWRIGHT_DOWNLOAD_HOST` to an accessible mirror or run E2E inside Playwright Docker image (`mcr.microsoft.com/playwright`).

## Test Scenarios

### Contract Tests (tests/contracts/)

Each framework must pass these test categories:

1. **Rendering** (5 tests)
   - Basic render, with items, with groups, conditional rendering, dynamic updates

2. **Selection** (8 tests)
   - Single selection, multi-selection, programmatic selection, deselection

3. **Keyboard Navigation** (7 tests)
   - Arrow keys, Enter, Escape, Tab, Home/End

4. **Search/Filter** (5 tests)
   - Search input, filtering, case-insensitive, highlighting

5. **Accessibility** (10 tests)
   - ARIA attributes, roles, keyboard support, screen reader announcements

6. **Events** (6 tests)
   - Change, open, close, search, custom events

7. **Imperative API** (5 tests)
   - open(), close(), select(), clear(), focus()

8. **Edge Cases** (4 tests)
   - Empty items, disabled items, async loading, error states

### E2E Tests (tests/e2e/scenarios/)

Real user scenarios across all frameworks:

1. **basic-selection.spec.ts**
   - Render, click to open, select item, close dropdown
   - Keyboard navigation (ArrowDown, Enter, Escape)

2. **multi-select.spec.ts**
   - Select multiple items, deselect, display count
   - Keyboard multi-selection with Ctrl/Cmd

3. **search.spec.ts**
   - Filter by search, highlight matches, case-insensitive
   - Navigate filtered results, clear search

4. **keyboard-nav.spec.ts** *(to be created)*
   - Full keyboard navigation matrix
   - Tab order, focus management, screen reader testing

5. **virtual-scroll.spec.ts** *(to be created)*
   - Performance with 10,000+ items
   - Scroll behavior, viewport rendering

6. **infinite-scroll.spec.ts** *(to be created)*
   - Load more on scroll, async data fetching

## Test Data & Fixtures

Shared test data in `tests/contracts/fixtures/test-data.ts`:

```typescript
// Small dataset for basic tests
export const basicItems = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];

// Large dataset for performance tests
export const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
  value: `item-${i}`,
  label: `Item ${i}`,
}));

// Grouped items for hierarchy tests
export const groupedItems = [
  {
    group: 'Fruits',
    items: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
    ],
  },
  // ...
];
```

## Cross-Framework Comparison

Contract tests can compare results across frameworks:

```typescript
// Run same test on all frameworks
const results = await Promise.all([
  reactTests.testSingleSelection(),
  vueTests.testSingleSelection(),
  svelteTests.testSingleSelection(),
  angularTests.testSingleSelection(),
  vanillaTests.testSingleSelection(),
]);

// Compare timing
const timings = results.map(r => r.timing);
const avgTiming = timings.reduce((a, b) => a + b, 0) / timings.length;

// Ensure all frameworks behave consistently
expect(Math.max(...timings) - Math.min(...timings)).toBeLessThan(50); // Within 50ms
```

## Performance Benchmarks

Expected performance from `tests/contracts/fixtures/test-data.ts`:

```typescript
export const performanceBenchmarks = {
  initialization: {
    small: 10,      // < 10ms for 10 items
    medium: 50,     // < 50ms for 100 items
    large: 200,     // < 200ms for 10,000 items
  },
  selection: {
    single: 5,      // < 5ms
    multi: 20,      // < 20ms for 100 selections
  },
  search: {
    filter: 10,     // < 10ms to filter 10,000 items
    highlight: 5,   // < 5ms to highlight matches
  },
  virtualScroll: {
    render: 16,     // < 16ms (60fps) for viewport update
    scroll: 8,      // < 8ms (120fps) for smooth scroll
  },
};
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:unit
      
  contracts:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        framework: [react, vue, svelte, angular, vanilla]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:contracts:${{ matrix.framework }}
      
  e2e:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        framework: [react, vue, svelte, angular, vanilla]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run playwright:install
      - run: npm run test:e2e:${{ matrix.framework }}
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report-${{ matrix.framework }}
          path: playwright-report/
```

### Local Pre-commit Hook

```bash
# .git/hooks/pre-commit
#!/bin/bash
npm run test:unit && npm run test:contracts
```

## Debugging Tests

### Unit Tests

```bash
# Run specific test file
npm run test:unit -- packages/core/tests/smoke.spec.ts

# Debug mode
DEBUG=true npm run test:unit

# Watch mode
npm run test:unit:watch
```

### Contract Tests

```bash
# Run single framework
npm run test:contracts:react

# Verbose output
npm run test:contracts -- --reporter=verbose

# UI mode
npx vitest --ui --config tests/contracts/vitest.config.ts
```

### E2E Tests

```bash
# Interactive UI mode
npm run test:e2e:ui

# Debug mode (headed browser)
npx playwright test --debug

# Specific test by name
npx playwright test -g "should select item"

# Specific framework
npm run test:e2e:react -- --debug

# Generate trace for debugging
npx playwright test --trace on
npx playwright show-trace trace.zip
```

## Test Coverage

### Current Status

- **Core Unit Tests**: ✅ Complete (smoke, interaction, stress, CSP, shadow DOM)
- **Contract Tests**: 🔄 In Progress (React template done, others pending)
- **E2E Tests**: 🔄 In Progress (3/6 scenarios implemented)

### Coverage Goals

- Unit Tests: > 90% code coverage
- Contract Tests: 100% API surface
- E2E Tests: 100% critical user paths

## Best Practices

### Writing Contract Tests

```typescript
// ✅ Good: Test behavior, not implementation
async testSingleSelection(): Promise<ContractTestResult> {
  const { container } = render(<Select items={basicItems} />);
  
  // Interact as a user would
  await userEvent.click(container.querySelector('enhanced-select')!);
  await userEvent.click(screen.getByRole('option', { name: 'Banana' }));
  
  // Assert on observable behavior
  expect(screen.getByRole('combobox')).toHaveTextContent('Banana');
}

// ❌ Bad: Testing implementation details
async testSingleSelection() {
  const component = new Select({ items: basicItems });
  expect(component._internalState.selectedValue).toBe('banana');
}
```

### Writing E2E Tests

```typescript
// ✅ Good: Use stable locators
const select = page.locator('enhanced-select').first();
const option = page.getByRole('option', { name: 'Banana' });

// ❌ Bad: Brittle selectors
const select = page.locator('.select-wrapper > div:nth-child(2)');
```

### Performance Testing

```typescript
// ✅ Good: Measure actual impact
test('should render 10,000 items efficiently', async () => {
  const start = performance.now();
  render(<Select items={largeDataset} />);
  const duration = performance.now() - start;
  
  expect(duration).toBeLessThan(200); // 200ms budget
});

// Include in CI performance tracking
```

## Framework-Specific Notes

### React
- Uses `@testing-library/react` and `@testing-library/user-event`
- Test React 18 features (StrictMode, Suspense)

### Vue
- Uses `@testing-library/vue`
- Test both Composition API and Options API usage

### Svelte
- Uses `@testing-library/svelte`
- Test both Svelte 4 and Svelte 5 (when ready)

### Angular
- Uses `@angular/core/testing` and TestBed
- Test standalone components and module-based usage

### Vanilla
- Direct DOM manipulation testing
- Test imperative API extensively

## Resources

- [Testing Architecture](../docs/TESTING-ARCHITECTURE.md) - Detailed strategy
- [Contract Interface](./contracts/contract-interface.ts) - Test API reference
- [Test Data](./contracts/fixtures/test-data.ts) - Shared fixtures
- [Playwright Config](./e2e/playwright.config.ts) - E2E configuration

## Troubleshooting

### Tests timing out
- Increase timeout in vitest.config.ts or playwright.config.ts
- Check for unresolved promises

### Flaky E2E tests
- Use `await expect(locator).toBeVisible()` instead of fixed waits
- Ensure test isolation (clean state between tests)

### Contract tests failing on one framework
- Compare implementation with working frameworks
- Check framework-specific binding patterns
- Review event handling differences

---

For questions or contributions, see [CONTRIBUTING.md](../CONTRIBUTING.md).
