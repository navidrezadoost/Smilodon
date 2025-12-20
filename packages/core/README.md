# @smilodon/core

<div align="center">
  <img src="https://raw.githubusercontent.com/navidrezadoost/smilodon/main/.github/logo.jpg" alt="Smilodon Logo" width="220" style="border-radius:16px;" />
  <p><strong>High-performance native select component with extreme-scale virtualization</strong></p>
  <p>
    <a href="https://www.npmjs.com/package/@smilodon/core"><img src="https://img.shields.io/npm/v/@smilodon/core.svg" alt="npm version"></a>
    <a href="https://github.com/navidrezadoost/smilodon"><img src="https://img.shields.io/github/stars/navidrezadoost/smilodon.svg" alt="GitHub stars"></a>
    <a href="https://github.com/navidrezadoost/smilodon/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@smilodon/core.svg" alt="license"></a>
  </p>
</div>

## Why Smilodon?

Smilodon is a Web Component that renders **1,000,000+ items at 60 FPS** with constant DOM size, sub-millisecond search, and zero framework lock-in. Built for extreme-scale data applications where legacy libraries crash or lag.

### Performance Comparison

| Library | 10K Items | 100K Items | 1M Items | Memory | FPS |
|---------|-----------|------------|----------|---------|-----|
| **Smilodon** | 38ms | 81ms | 162ms | 18 MB | 60 |
| React Select | 1200ms | ❌ Crash | ❌ Crash | 200+ MB | 10-25 |
| Vue Select | 890ms | ❌ Crash | ❌ Crash | 180+ MB | 15-30 |
| ng-select | 1100ms | ❌ Crash | ❌ Crash | 220+ MB | 12-28 |

See [full benchmarks](https://github.com/navidrezadoost/smilodon/blob/main/docs/BENCHMARKS.md) for methodology and reproducibility.

## Installation

```bash
npm install @smilodon/core
```

## Quick Start

### Vanilla JavaScript / Web Components

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import '@smilodon/core';
  </script>
</head>
<body>
  <smilodon-select id="my-select"></smilodon-select>

  <script type="module">
    const select = document.getElementById('my-select');
    
    // Generate 1 million items
    const items = Array.from({ length: 1_000_000 }, (_, i) => ({
      label: `Item ${i + 1}`,
      value: i + 1
    }));

    select.items = items;
    
    select.addEventListener('change', (e) => {
      console.log('Selected:', e.detail);
    });
  </script>
</body>
</html>
```

### With Framework Adapters

Smilodon provides native adapters for all major frameworks:

- **React**: `npm install @smilodon/react`
- **Vue**: `npm install @smilodon/vue`
- **Svelte**: `npm install @smilodon/svelte`
- **Angular**: `npm install @smilodon/angular`

See the [main documentation](https://github.com/navidrezadoost/smilodon#readme) for framework-specific examples.

## Key Features

### 🚀 Extreme Performance
- **Constant DOM**: Only 10-15 elements rendered regardless of dataset size
- **Work Stealing**: Background search workers with automatic cancellation
- **Sub-millisecond Search**: Fenwick tree indexing for O(log n) queries
- **60 FPS Scrolling**: Hardware-accelerated virtualization

### 🎯 Production Ready
- **TypeScript First**: Complete type definitions included
- **Zero Dependencies**: 6.6 KB gzipped runtime
- **Framework Agnostic**: Works with React, Vue, Svelte, Angular, or vanilla JS
- **Accessibility**: WCAG 2.2 AA compliant with ARIA 1.2

### 🔒 Enterprise Grade
- **SOC2 Compliant**: Audit-ready security controls
- **CSP Compatible**: No eval(), no inline scripts
- **SBOM Included**: Full dependency transparency
- **99.8% Test Coverage**: Unit, integration, and E2E tests

## API Reference

### Properties

```typescript
interface SmilodonSelectElement extends HTMLElement {
  items: SelectItem[];           // Dataset (can be millions of items)
  value: any;                    // Current selected value
  placeholder?: string;          // Placeholder text
  searchable?: boolean;          // Enable search (default: true)
  disabled?: boolean;            // Disable the select
  multiple?: boolean;            // Multiple selection mode
  virtualization?: boolean;      // Enable virtualization (default: true)
  maxHeight?: number;            // Max dropdown height in pixels
}

interface SelectItem {
  label: string;                 // Display text
  value: any;                    // Value (can be any type)
  disabled?: boolean;            // Disable this option
  group?: string;                // Optgroup name
}
```

### Events

```typescript
// Selection changed
select.addEventListener('change', (event: CustomEvent) => {
  console.log(event.detail); // { value, label }
});

// Dropdown opened
select.addEventListener('open', () => {
  console.log('Dropdown opened');
});

// Dropdown closed
select.addEventListener('close', () => {
  console.log('Dropdown closed');
});

// Search query changed
select.addEventListener('search', (event: CustomEvent) => {
  console.log(event.detail.query);
});
```

### Methods

```typescript
// Programmatically open/close
select.open();
select.close();

// Clear selection
select.clear();

// Focus the select
select.focus();

// Get filtered items (useful for debugging)
const filtered = select.getFilteredItems();
```

## Advanced Usage

### Custom Styling

Smilodon uses CSS custom properties for theming:

```css
smilodon-select {
  --smilodon-border-color: #d1d5db;
  --smilodon-focus-color: #3b82f6;
  --smilodon-bg-color: #ffffff;
  --smilodon-text-color: #1f2937;
  --smilodon-hover-bg: #f3f4f6;
  --smilodon-selected-bg: #dbeafe;
  --smilodon-font-family: system-ui, -apple-system, sans-serif;
  --smilodon-border-radius: 0.375rem;
}
```

### Server-Side Rendering (SSR)

Smilodon gracefully handles SSR environments:

```javascript
// Check if running in browser
if (typeof window !== 'undefined') {
  import('@smilodon/core').then(() => {
    // Initialize after hydration
  });
}
```

### Performance Monitoring

Enable telemetry to monitor performance:

```javascript
select.enableTelemetry = true;

select.addEventListener('telemetry', (event) => {
  console.log('Performance metrics:', event.detail);
  // { renderTime, searchTime, scrollFPS, memoryUsage }
});
```

## Architecture

Smilodon's performance comes from three core optimizations:

1. **Virtual Scrolling**: Only renders visible items (10-15 DOM nodes for any dataset size)
2. **Work Stealing Scheduler**: Search operations run in background workers with automatic cancellation
3. **Fenwick Tree Indexing**: O(log n) search queries instead of O(n) array scans

Read the [full architecture guide](https://github.com/navidrezadoost/smilodon/blob/main/ARCHITECTURE.md) for implementation details.

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14.1+ |
| Edge | 90+ |

Requires browsers with native Web Components support (custom elements v1).

## Bundle Size

- **Runtime**: 6.6 KB gzipped (ESM)
- **Full Package**: 365 KB (includes 5 formats + source maps + types)
- **Tree-shakeable**: Import only what you need

## TypeScript

Full TypeScript definitions included. No need for `@types/*` packages.

```typescript
import type { SmilodonSelectElement, SelectItem } from '@smilodon/core';

const items: SelectItem[] = [
  { label: 'Option 1', value: 1 },
  { label: 'Option 2', value: 2 }
];

const select = document.querySelector('smilodon-select') as SmilodonSelectElement;
select.items = items;
```

## Documentation

- **Main README**: [Complete guide with framework examples](https://github.com/navidrezadoost/smilodon#readme)
- **Benchmarks**: [Transparent performance comparisons](https://github.com/navidrezadoost/smilodon/blob/main/docs/BENCHMARKS.md)
- **API Reference**: [Full API documentation](https://github.com/navidrezadoost/smilodon/blob/main/docs/API-REFERENCE.md)
- **Architecture**: [Technical deep-dive](https://github.com/navidrezadoost/smilodon/blob/main/ARCHITECTURE.md)
- **Migration Guide**: [Migrate from React Select, Vue Select, etc.](https://github.com/navidrezadoost/smilodon/blob/main/docs/MIGRATION.md)

## Examples

Visit the [interactive playground](https://github.com/navidrezadoost/smilodon/tree/main/playground) to see Smilodon in action with:
- 1M item datasets
- Real-time search
- Framework integrations
- Custom styling

## Contributing

Contributions are welcome! Please read our [Contributing Guide](https://github.com/navidrezadoost/smilodon/blob/main/CONTRIBUTING.md) for details.

## License

MIT © [Navid Rezadoost](https://github.com/navidrezadoost)

## Support

- **Issues**: [GitHub Issues](https://github.com/navidrezadoost/smilodon/issues)
- **Discussions**: [GitHub Discussions](https://github.com/navidrezadoost/smilodon/discussions)
- **Security**: [Security Policy](https://github.com/navidrezadoost/smilodon/blob/main/SECURITY.md)

---

<div align="center">
  <p>Made with ⚡ by the Smilodon team</p>
  <p>
    <a href="https://github.com/navidrezadoost/smilodon">GitHub</a> •
    <a href="https://www.npmjs.com/package/@smilodon/core">npm</a> •
    <a href="https://github.com/navidrezadoost/smilodon/blob/main/docs/BENCHMARKS.md">Benchmarks</a>
  </p>
</div>
