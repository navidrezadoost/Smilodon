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

### Framework Usage

**`@smilodon/core` works directly in all frameworks** as a Web Component - no adapters needed!

Simply import and use `<smilodon-select>` in React, Vue, Svelte, or any framework:

```jsx
// React, Vue, Svelte - all work the same way
import '@smilodon/core';
<smilodon-select ref={selectRef} />
```

**Optional Framework Adapters** (for enhanced developer experience):
- **React**: `npm install @smilodon/react` - React hooks and components
- **Vue**: `npm install @smilodon/vue` - Vue composables and components  
- **Svelte**: `npm install @smilodon/svelte` - Svelte stores and components
- **Vanilla**: `npm install @smilodon/vanilla` - Vanilla JS helpers

These adapters provide framework-native APIs (hooks, composables) for enhanced developer experience, but are **not required** - the core package works everywhere!

**Note:** Angular support has been discontinued as of December 2025.

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
- **Framework Agnostic**: Works with React, Vue, Svelte, or vanilla JS
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
  items: SelectItem[] | string[] | number[];  // Dataset (can be millions of items)
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

> **Flexible Input Formats:**
> - **Object arrays**: `[{ value: '1', label: 'Option 1' }, ...]`
> - **String arrays**: `['Apple', 'Banana', 'Cherry']` - automatically converted to `SelectItem` format
> - **Number arrays**: `[1, 2, 3, 5, 8]` - automatically converted to `SelectItem` format

### Examples with Different Input Types

#### Object Array (Traditional)
```javascript
select.items = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' }
];
```

#### String Array (Auto-converted)
```javascript
select.items = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];
// Automatically becomes:
// [
//   { value: 'Apple', label: 'Apple' },
//   { value: 'Banana', label: 'Banana' },
//   ...
// ]
```

#### Number Array (Auto-converted)
```javascript
select.items = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
// Automatically becomes:
// [
//   { value: 1, label: '1' },
//   { value: 2, label: '2' },
//   ...
// ]
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

Smilodon uses CSS custom properties (CSS variables) for easy theming and customization. The default theme is **light mode** with a clean white background.

#### Basic Customization

```css
enhanced-select {
  /* Options styling */
  --select-option-bg: #ffffff;
  --select-option-color: #1f2937;
  --select-option-padding: 8px 12px;
  
  /* Hover state */
  --select-option-hover-bg: #f3f4f6;
  --select-option-hover-color: #1f2937;
  
  /* Selected state */
  --select-option-selected-bg: #e0e7ff;
  --select-option-selected-color: #4338ca;
  
  /* Active/focused state */
  --select-option-active-bg: #f3f4f6;
  --select-option-active-color: #1f2937;
  
  /* Dropdown */
  --select-dropdown-bg: white;
  --select-dropdown-border: #ccc;
  --select-dropdown-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
```

#### Dark Mode (Opt-in)

Dark mode is **opt-in only** and can be enabled by adding a class or data attribute:

```html
<!-- Using class -->
<enhanced-select class="dark-mode"></enhanced-select>

<!-- Using data attribute -->
<enhanced-select data-theme="dark"></enhanced-select>
```

```css
/* Custom dark mode colors */
enhanced-select.dark-mode {
  --select-dark-bg: #1f2937;
  --select-dark-text: #f9fafb;
  --select-dark-border: #4b5563;
  --select-dark-dropdown-bg: #1f2937;
  --select-dark-option-color: #f9fafb;
  --select-dark-option-bg: #1f2937;
  --select-dark-option-hover-bg: #374151;
  --select-dark-option-selected-bg: #3730a3;
}
```

#### Available CSS Variables

**Light Mode (Default)**
```css
--select-options-bg           /* Options container background (white) */
--select-option-color          /* Option text color (#1f2937) */
--select-option-bg             /* Option background (white) */
--select-option-padding        /* Option padding (8px 12px) */
--select-option-hover-bg       /* Hover background (#f3f4f6) */
--select-option-hover-color    /* Hover text color (#1f2937) */
--select-option-selected-bg    /* Selected background (#e0e7ff) */
--select-option-selected-color /* Selected text color (#4338ca) */
--select-option-active-bg      /* Active background (#f3f4f6) */
--select-option-active-color   /* Active text color (#1f2937) */
--select-dropdown-bg           /* Dropdown background (white) */
--select-dropdown-border       /* Dropdown border color (#ccc) */
--select-dropdown-shadow       /* Dropdown shadow */
```

**Dark Mode (Opt-in)**
```css
--select-dark-bg               /* Dark input background (#1f2937) */
--select-dark-text             /* Dark text color (#f9fafb) */
--select-dark-border           /* Dark border color (#4b5563) */
--select-dark-dropdown-bg      /* Dark dropdown background (#1f2937) */
--select-dark-options-bg       /* Dark options container bg (#1f2937) */
--select-dark-option-color     /* Dark option text (#f9fafb) */
--select-dark-option-bg        /* Dark option background (#1f2937) */
--select-dark-option-hover-bg  /* Dark hover background (#374151) */
--select-dark-option-selected-bg /* Dark selected bg (#3730a3) */
```

**Complete CSS Variables List (60+ variables)**

See the [full CSS variables reference](https://github.com/navidrezadoost/smilodon/blob/main/CHANGELOG.md#135---2026-02-09) for all 60+ customizable properties including:
- Input container (gap, padding, height, borders, focus states)
- Input field (width, padding, font, colors)
- Arrow/icon (size, color, hover states, position)
- **Separator line** (width, height, gradient, position)
- **Selection badges** (padding, colors, **remove/delete button**)
- Dropdown (margins, max-height, borders, shadows)
- Options (font size, line height, borders, transitions)
- Load more button (padding, borders, colors, hover states)
- Loading/empty states (padding, colors, backgrounds, spinner)

#### Highlighted Customization Features

**Separator Line Between Input and Arrow**
The vertical separator line that appears between the input area and the dropdown arrow is fully customizable:

```css
enhanced-select {
  /* Customize the separator line */
  --select-separator-width: 2px;           /* Line thickness */
  --select-separator-height: 80%;          /* Line height */
  --select-separator-position: 40px;       /* Distance from right edge */
  --select-separator-gradient: linear-gradient(
    to bottom,
    transparent 0%,
    #3b82f6 20%,
    #3b82f6 80%,
    transparent 100%
  );
}
```

**Badge Remove/Delete Button (Multi-Select)**
The × button that removes selected items in multi-select mode is fully customizable:

```css
enhanced-select {
  /* Customize badge appearance */
  --select-badge-bg: #10b981;              /* Badge background */
  --select-badge-color: white;             /* Badge text color */
  --select-badge-padding: 6px 10px;        /* Badge spacing */
  
  /* Customize the × (remove/delete) button */
  --select-badge-remove-size: 18px;        /* Button size */
  --select-badge-remove-bg: rgba(255, 255, 255, 0.3);  /* Button background */
  --select-badge-remove-color: white;      /* × symbol color */
  --select-badge-remove-font-size: 18px;   /* × symbol size */
  --select-badge-remove-hover-bg: rgba(255, 255, 255, 0.6);  /* Hover state */
}
```

#### Real-World Customization Examples

**Example 1: Bootstrap-style Select**
```css
enhanced-select {
  --select-input-border: 1px solid #ced4da;
  --select-input-border-radius: 0.375rem;
  --select-input-focus-border: #86b7fe;
  --select-input-focus-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  --select-option-hover-bg: #e9ecef;
  --select-option-selected-bg: #0d6efd;
  --select-option-selected-color: white;
  --select-badge-bg: #0d6efd;
}
```

**Example 2: Material Design**
```css
enhanced-select {
  --select-input-border-radius: 4px;
  --select-input-focus-border: #1976d2;
  --select-input-focus-shadow: none;
  --select-option-padding: 16px;
  --select-option-hover-bg: rgba(0, 0, 0, 0.04);
  --select-option-selected-bg: #e3f2fd;
  --select-option-selected-color: #1976d2;
  --select-badge-bg: #1976d2;
  --select-badge-border-radius: 16px;
}
```

**Example 3: Tailwind-style**
```css
enhanced-select {
  --select-input-border: 1px solid #e5e7eb;
  --select-input-border-radius: 0.5rem;
  --select-input-focus-border: #3b82f6;
  --select-input-focus-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  --select-option-padding: 0.5rem 0.75rem;
  --select-option-hover-bg: #f3f4f6;
  --select-option-selected-bg: #dbeafe;
  --select-option-selected-color: #1e40af;
}
```

**Example 4: Custom Brand Colors**
```css
enhanced-select {
  /* Your brand colors */
  --select-input-focus-border: #ff6b6b;
  --select-arrow-color: #ff6b6b;
  --select-badge-bg: #ff6b6b;
  --select-option-selected-bg: #ffe0e0;
  --select-option-selected-color: #c92a2a;
  --select-button-border: 1px solid #ff6b6b;
  --select-button-color: #ff6b6b;
  --select-button-hover-bg: #ff6b6b;
}
```

#### Framework-Specific Examples

**React - Customizing Separator & Badge Remove Button**
```jsx
import { Select } from '@smilodon/react';

function App() {
  return (
    <Select
      items={items}
      multiple
      style={{
        '--select-option-hover-bg': '#2563eb',
        '--select-option-padding': '12px 16px',
        '--select-badge-bg': '#3b82f6',
        '--select-badge-remove-bg': 'rgba(255, 255, 255, 0.4)',
        '--select-badge-remove-hover-bg': 'rgba(255, 255, 255, 0.7)',
        '--select-separator-gradient': 'linear-gradient(to bottom, transparent 0%, #3b82f6 20%, #3b82f6 80%, transparent 100%)'
      }}
    />
  );
}
```

**Vue - Complete Customization**
```vue
<template>
  <Select
    :items="items"
    multiple
    :style="{
      '--select-option-hover-bg': '#2563eb',
      '--select-option-padding': '12px 16px',
      '--select-badge-bg': '#3b82f6',
      '--select-badge-remove-size': '20px',
      '--select-badge-remove-bg': 'rgba(255, 255, 255, 0.4)',
      '--select-separator-width': '2px',
      '--select-separator-height': '70%'
    }"
  />
</template>
```

**Svelte - Themed Components**
```svelte
<script>
  import { Select } from '@smilodon/svelte';
</script>

<Select
  items={items}
  multiple
  style="
    --select-badge-bg: #10b981;
    --select-badge-remove-bg: rgba(255, 255, 255, 0.3);
    --select-badge-remove-hover-bg: rgba(255, 255, 255, 0.6);
    --select-separator-gradient: linear-gradient(to bottom, transparent, #10b981, transparent);
  "
/>
```

**Vanilla JS - Dynamic Styling**
```javascript
const select = document.querySelector('enhanced-select');

// Apply custom separator and badge styles
select.style.setProperty('--select-separator-width', '2px');
select.style.setProperty('--select-separator-gradient', 'linear-gradient(to bottom, transparent, #ff6b6b, transparent)');
select.style.setProperty('--select-badge-bg', '#ff6b6b');
select.style.setProperty('--select-badge-remove-size', '18px');
select.style.setProperty('--select-badge-remove-bg', 'rgba(255, 255, 255, 0.3)');
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
