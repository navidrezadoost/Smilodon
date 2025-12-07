# Smilodon Select Components

High-performance select components with extreme-scale virtualization and advanced features.

**6.6KB gzipped** • **1M+ items at 60 FPS** • **Zero dependencies** • **Tree-shakeable** • **CSP-compliant**

---

## ✨ Features

### Core Features
- 🚀 **Extreme Performance**: Handles 1M+ items with 60 FPS scrolling
- 📦 **Tiny Bundle**: 6.6KB gzipped core + <1KB adapters
- ⚡ **Virtual Scrolling**: Only renders visible items
- 🎯 **Multi-Select**: Built-in multi-selection with keyboard support
- ⌨️ **Accessible**: Full ARIA compliance, screen reader support
- 🔒 **Secure**: CSP-compliant, XSS prevention, shadow DOM isolation
- 🌐 **Framework Agnostic**: React, Vue, Svelte, Angular, or vanilla JS
- 📱 **SSR Compatible**: Works with Next.js, Nuxt, SvelteKit, Angular Universal
- 🎨 **Customizable**: CSS variables, custom templates
- 📊 **Performance Monitoring**: Built-in telemetry

### Enhanced Features (NEW!)
- 🔧 **Global Configuration**: Set defaults once, use everywhere
- 🔄 **Infinite Scroll**: Built-in pagination with caching
- 📥 **Load More**: Incremental loading with custom batch sizes
- ⏳ **Busy State**: Smart loading indicators
- 🌐 **Server-Side Selection**: Pre-select items not yet loaded
- 📍 **Scroll-to-Selected**: Auto-scroll to selected items
- ❌ **Removable Options**: Multi-select with remove buttons
- 🎨 **Full Customization**: Every visual detail is customizable
- 🔌 **High Cohesion/Low Coupling**: Independent option components
- 📞 **Rich Callbacks**: User-defined functions for all events

---

## 📦 Packages

| Package | Size | Description |
|---------|------|-------------|
| [@smilodon/core](./packages/core) | 6.6 KB | Core Web Components |
| [@smilodon/react](./packages/react) | +787 B | React wrapper |
| [@smilodon/vue](./packages/vue) | +668 B | Vue 3 wrapper |
| [@smilodon/svelte](./packages/svelte) | +1.2 KB | Svelte wrapper |
| [@smilodon/angular](./packages/angular) | +892 B | Angular wrapper |

---

## 🚀 Quick Start

### Choose Your Component

We offer two powerful select components:

1. **NativeSelect**: Lightweight, high-performance basic select
2. **EnhancedSelect** (NEW!): Full-featured with infinite scroll, server-side selection, and more

### React - Basic NativeSelect

```bash
npm install @smilodon/core @smilodon/react
```

**Basic Usage**:

```tsx
import { NativeSelect } from '@smilodon/react';

function App() {
  const items = [
    { id: 1, label: 'Apple' },
    { id: 2, label: 'Banana' },
    { id: 3, label: 'Cherry' }
  ];

  return (
    <NativeSelect
      items={items}
      onSelect={({ indices, items }) => {
        console.log('Selected:', items[indices[0]]);
      }}
    />
  );
}
```

### React - Enhanced Select (NEW!)

```tsx
import { Select, configureSelect } from '@smilodon/react';

// Optional: Set global defaults
configureSelect({
  selection: { mode: 'multi' },
  scrollToSelected: { enabled: true },
  busyBucket: { enabled: true },
});

function App() {
  const items = [
    { value: 1, label: 'Option 1' },
    { value: 2, label: 'Option 2' },
    { value: 3, label: 'Option 3' },
  ];

  return (
    <Select
      items={items}
      onOptionSelect={(data) => {
        console.log('Selected:', data.value, data.label);
      }}
      config={{
        selection: { mode: 'multi', showRemoveButton: true },
        loadMore: { enabled: true, itemsPerLoad: 3 },
        serverSide: {
          enabled: true,
          fetchSelectedItems: async (values) => {
            // Fetch pre-selected items from server
            const response = await fetch(`/api/items?ids=${values.join(',')}`);
            return response.json();
          },
        },
      }}
    />
  );
}
```

**Large Dataset (10,000+ items)**:

```tsx
const largeDataset = Array.from({ length: 100000 }, (_, i) => ({
  id: i,
  label: `Item ${i}`
}));

<NativeSelect
  items={largeDataset}
  estimatedItemHeight={48}
  buffer={10}
  onSelect={handleSelect}
/>
```

**Multi-Select**:

```tsx
<NativeSelect
  items={items}
  multi
  onSelect={({ indices, items }) => {
    console.log(`Selected ${indices.length} items`);
  }}
/>
```

**⏱️ Time to first render: ~2 minutes**

[See complete React guide →](./docs/GETTING-STARTED.md#react)

---

### Vue

**Installation**:

```bash
npm install @native-select/core @native-select/vue
```

**Basic Usage**:

```vue
<template>
  <NativeSelect
    :items="items"
    @select="handleSelect"
  />
</template>

<script setup>
import { NativeSelect } from '@native-select/vue';

const items = [
  { id: 1, label: 'Apple' },
  { id: 2, label: 'Banana' },
  { id: 3, label: 'Cherry' }
];

function handleSelect({ indices, items }) {
  console.log('Selected:', items[indices[0]]);
}
</script>
```

**⏱️ Time to first render: ~2 minutes**

[See complete Vue guide →](./docs/GETTING-STARTED.md#vue)

---

### Svelte

**Installation**:

```bash
npm install @native-select/core @native-select/svelte
```

**Basic Usage**:

```svelte
<script>
  import { NativeSelect } from '@native-select/svelte';
  
  const items = [
    { id: 1, label: 'Apple' },
    { id: 2, label: 'Banana' },
    { id: 3, label: 'Cherry' }
  ];
  
  function handleSelect(event) {
    console.log('Selected:', event.detail.items[0]);
  }
</script>

<NativeSelect
  {items}
  on:select={handleSelect}
/>
```

**⏱️ Time to first render: ~2 minutes**

[See complete Svelte guide →](./docs/GETTING-STARTED.md#svelte)

---

### Angular

**Installation**:

```bash
npm install @native-select/core @native-select/angular
```

**Basic Usage**:

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { NativeSelectModule } from '@native-select/angular';

@NgModule({
  imports: [NativeSelectModule]
})
export class AppModule { }

// app.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <native-select
      [items]="items"
      (select)="handleSelect($event)">
    </native-select>
  `
})
export class AppComponent {
  items = [
    { id: 1, label: 'Apple' },
    { id: 2, label: 'Banana' },
    { id: 3, label: 'Cherry' }
  ];
  
  handleSelect(event: any) {
    console.log('Selected:', event.items[0]);
  }
}
```

**⏱️ Time to first render: ~3 minutes**

[See complete Angular guide →](./docs/GETTING-STARTED.md#angular)

---

### Vanilla JavaScript

**Installation**:

```bash
npm install @native-select/core
```

**Basic Usage**:

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import { NativeSelectElement } from './node_modules/@native-select/core/dist/index.js';
    
    customElements.define('native-select', NativeSelectElement);
    
    const select = document.getElementById('my-select');
    select.items = [
      { id: 1, label: 'Apple' },
      { id: 2, label: 'Banana' },
      { id: 3, label: 'Cherry' }
    ];
    
    select.addEventListener('select', (e) => {
      console.log('Selected:', e.detail.items[0]);
    });
  </script>
</head>
<body>
  <native-select id="my-select"></native-select>
</body>
</html>
```

**⏱️ Time to first render: ~3 minutes**

[See complete vanilla JS guide →](./docs/GETTING-STARTED.md#vanilla-js)

---

## 📚 Documentation

### Getting Started
- 📘 [Complete Getting Started Guide](./docs/GETTING-STARTED.md) - Quickstart for all frameworks (5-30 min)
- 📖 [API Reference](./docs/API-REFERENCE.md) - Complete API documentation
- 🔄 [Migration Guides](./docs/MIGRATION.md) - From React Select, Floating UI, Downshift, HeadlessUI

### Advanced Topics
- 🚀 [Performance Tuning](./docs/PERFORMANCE.md) - Optimization techniques and profiling
- 🔒 [Security Guide](./.azure/phase9-security-guide.md) - CSP compliance, XSS prevention
- 🧮 [Algorithm Reference](./docs/ALGORITHMS.md) - Core algorithms and complexity analysis
- 🎨 [Theming System](./docs/PHASE12-THEMING-COMPLETE.md) - 160+ CSS variables, Material/Fluent/Apple themes

### Resources
- 💬 [GitHub Discussions](https://github.com/native-select/native-select/discussions)
- 🐛 [GitHub Issues](https://github.com/native-select/native-select/issues)
- 🎮 Live Demos *(coming soon)*

---

## 🎯 Common Use Cases

### Large Datasets

Handle 100,000+ items smoothly:

```tsx
<NativeSelect
  items={largeDataset}
  estimatedItemHeight={48}
  buffer={10}
/>
```

### Custom Item Templates

```tsx
<NativeSelect
  items={users}
  optionTemplate={(user) => `
    <div class="user-option">
      <strong>${user.name}</strong>
      <small>${user.email}</small>
    </div>
  `}
/>
```

### Controlled Selection

```tsx
const [selectedIndices, setSelectedIndices] = useState([0]);

<NativeSelect
  items={items}
  selectedIndices={selectedIndices}
  onSelect={({ indices }) => setSelectedIndices(indices)}
/>
```

### Remote Data Loading

```tsx
const [items, setItems] = useState([]);

useEffect(() => {
  fetch('/api/items')
    .then(r => r.json())
    .then(setItems);
}, []);

<NativeSelect items={items} />
```

[See all examples →](./docs/GETTING-STARTED.md#common-use-cases)

---

## 🎨 Styling

### CSS Custom Properties

```css
native-select {
  --ns-item-height: 50px;
  --ns-item-bg: #ffffff;
  --ns-item-hover-bg: #f0f0f0;
  --ns-item-selected-bg: #e3f2fd;
  --ns-item-selected-color: #1976d2;
  --ns-border-radius: 8px;
  --ns-max-height: 400px;
}
```

### Framework Styling

**Tailwind CSS**:
```tsx
<NativeSelect
  className="w-full max-w-md"
  style={{ '--ns-border-radius': '0.5rem' }}
  items={items}
/>
```

**Styled Components**:
```tsx
const StyledSelect = styled(NativeSelect)`
  --ns-item-height: 60px;
  --ns-item-selected-bg: ${props => props.theme.primary};
`;
```

[See complete styling guide →](./docs/GETTING-STARTED.md#styling)

---

## ⚡ Performance

### Benchmarks

Tested with 100,000 items on M1 MacBook Pro:

| Metric | Result |
|--------|--------|
| Initial Render | **<50ms** ✅ |
| Scroll FPS | **60 FPS** ✅ |
| Memory Usage | **8 MB** ✅ |
| Selection Latency | **<16ms** ✅ |

### Bundle Sizes

All sizes gzipped + minified:

```
@native-select/core:   6.6 KB
@native-select/react:  7.4 KB (core + adapter)
@native-select/vue:    7.3 KB (core + adapter)
@native-select/svelte: 7.8 KB (core + adapter)
```

**Comparison**:
- React Select: 32 KB
- Downshift: 8 KB
- HeadlessUI: 7 KB
- Floating UI: 14 KB
- **@native-select: 6.6 KB** ✅

[See performance guide →](./docs/PERFORMANCE.md)

---

## 🔒 Security

### CSP Compliance

Works in Content Security Policy restricted environments:

- ✅ No `eval()` or `Function()` constructors
- ✅ No inline styles or scripts
- ✅ CSP-safe CSS custom properties
- ✅ Shadow DOM isolation

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self'; style-src 'self'">
```

### HTML Sanitization

Optional integration with DOMPurify:

```typescript
import { setHTMLSanitizer } from '@native-select/core';
import DOMPurify from 'dompurify';

setHTMLSanitizer({
  sanitize: (html) => DOMPurify.sanitize(html)
});
```

[See complete security guide →](./.azure/phase9-security-guide.md)

---

## ♿ Accessibility

Built-in ARIA support (no configuration needed):

- ✅ `role="listbox"` and `role="option"`
- ✅ `aria-selected`, `aria-multiselectable`
- ✅ `aria-activedescendant` for keyboard nav
- ✅ Screen reader announcements
- ✅ Keyboard navigation (Arrow keys, Home, End, Enter, Space)
- ✅ Type-ahead search

Tested with:
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS/iOS)

---

## 🏗️ Architecture

### Core Components

- **Virtualizer**: O(1) windowed rendering with dynamic heights
- **Fenwick Tree**: O(log n) range queries for multi-selection
- **DOM Pool**: Node reuse for memory efficiency
- **Web Workers**: Off-main-thread data processing
- **Telemetry**: Real-time performance monitoring

### Advanced Features

- Virtual scrolling with configurable buffer
- Multi-selection with keyboard support
- Custom renderers for complex items
- Performance telemetry and monitoring
- CSP compliance and security hardening
- Shadow DOM isolation

[See architecture docs →](./DESIGN_DOC_STRATEGIC.md)

---

## 🛠️ Development

### Build

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Build individual packages
npm run build:core
npm run build:react
npm run build:vue
npm run build:svelte

# Check bundle sizes
npm run size
```

### Test

```bash
# Run all tests
npm test

# Run tests for specific package
npm run test:core
npm run test:react

# Run e2e tests
npm run e2e

# Watch mode
npm run test:watch
```

### Monorepo Structure

```
packages/
├── core/       # @native-select/core - Web Component
├── react/      # @native-select/react - React wrapper
├── vue/        # @native-select/vue - Vue 3 wrapper
└── svelte/     # @native-select/svelte - Svelte wrapper
```

---

## 📝 API Overview

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `T[]` | `[]` | Items to display |
| `selectedIndices` | `number[]` | `[]` | Selected item indices |
| `multi` | `boolean` | `false` | Enable multi-selection |
| `estimatedItemHeight` | `number` | `48` | Estimated item height (px) |
| `buffer` | `number` | `5` | Items to render outside viewport |
| `portal` | `boolean` | `false` | Render in document portal |
| `strategy` | `'absolute' \| 'fixed'` | `'absolute'` | CSS positioning |
| `optionTemplate` | `(item: T) => string` | - | Custom item template |
| `disabled` | `boolean` | `false` | Disable component |

### Events

| Event | Detail | Description |
|-------|--------|-------------|
| `select` | `{ indices: number[]; items: T[] }` | Selection changed |
| `open` | `void` | Dropdown opened |
| `close` | `void` | Dropdown closed |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `open()` | `void` | Open dropdown |
| `close()` | `void` | Close dropdown |
| `scrollToIndex(index)` | `void` | Scroll to item |
| `clearSelection()` | `void` | Clear all selections |
| `selectAll()` | `void` | Select all items (multi-select) |

[See complete API reference →](./docs/API-REFERENCE.md)

---

## 🎯 Enhanced Select Component (NEW!)

The Enhanced Select component provides advanced features for complex use cases:

### Key Features

- **Global Configuration**: Set defaults once, use everywhere
- **Infinite Scroll**: Built-in pagination with intelligent caching
- **Server-Side Selection**: Pre-select items not yet loaded
- **Load More**: Incremental loading with custom batch sizes
- **Busy State**: Smart loading indicators with minimum display time
- **Scroll-to-Selected**: Auto-scroll to selected items on open
- **Independent Options**: High cohesion, low coupling architecture
- **Full Customization**: Every detail is customizable via CSS or config

### Quick Examples

#### Global Configuration
```typescript
import { configureSelect } from '@smilodon/core';

// Set defaults once
configureSelect({
  selection: { mode: 'multi', showRemoveButton: true },
  scrollToSelected: { enabled: true },
  busyBucket: { enabled: true },
  infiniteScroll: { enabled: true, pageSize: 20 },
});
```

#### Server-Side Selection
```tsx
<Select
  items={currentPageItems}
  config={{
    serverSide: {
      enabled: true,
      initialSelectedValues: [5, 12, 23], // From server
      fetchSelectedItems: async (values) => {
        const response = await fetch(`/api/items?ids=${values.join(',')}`);
        return response.json();
      },
    },
  }}
/>
```

#### Infinite Scroll with Selected Item on Distant Page
```tsx
<Select
  items={items}
  config={{
    infiniteScroll: {
      enabled: true,
      pageSize: 20,
      cachePages: true,
      scrollRestoration: 'auto',
    },
    serverSide: {
      enabled: true,
      fetchSelectedItems: async (values) => {
        // Fetch specific items without loading all pages
        return await fetchItemsByIds(values);
      },
    },
  }}
  onLoadMore={(page) => {
    fetchPage(page).then(newItems => {
      setItems([...items, ...newItems]);
    });
  }}
/>
```

#### Multi-Select with Remove Buttons
```tsx
<Select
  items={items}
  config={{
    selection: {
      mode: 'multi',
      maxSelections: 10,
      showRemoveButton: true,
    },
  }}
  onOptionSelect={(data) => {
    console.log(`${data.label}: ${data.selected ? 'selected' : 'removed'}`);
  }}
/>
```

### Complete Documentation

- [📖 Enhanced Select Guide](./docs/SELECT-COMPONENT.md) - Complete feature documentation
- [🔧 Implementation Details](./docs/SELECT-IMPLEMENTATION.md) - Architecture and solutions
- [🚀 Migration Guide](./docs/SELECT-MIGRATION.md) - Migrate from other libraries
- [💡 Interactive Examples](./examples/select-examples.html) - Live demos

---

## 🌐 Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

Required features:
- Custom Elements V1
- Shadow DOM V1
- Intersection Observer
- CSS Custom Properties

---

## 📋 Success Criteria

Phase 9 (Security):
- [x] CSP test suite passing (no eval, no unsafe-inline)
- [x] Shadow DOM security tests
- [x] Optional HTML sanitizer integration
- [x] Security audit checklist
- [x] Fallback guidelines for restricted environments

Phase 10 (Documentation):
- [x] README with quickstart for all frameworks
- [x] Complete getting started guide (<30 min onboarding)
- [x] Full API reference
- [x] Migration guides (React Select, Floating UI, Downshift, HeadlessUI)
- [x] Performance tuning guide
- [ ] Live playground demos
- [ ] Styling guide

---

## 🗺️ Roadmap

- [ ] Phase 11: Integration testing (SSR, hydration)
- [ ] Phase 12: Playground and live demos
- [ ] Phase 13: Advanced styling guide
- [ ] Phase 14: Performance benchmarks site
- [ ] Phase 15: Accessibility audit & improvements

---

## 📜 License

MIT

---

## 🤝 Contributing

Contributions welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## 💬 Getting Help

- 📖 [Documentation](./docs/GETTING-STARTED.md)
- 💬 [GitHub Discussions](https://github.com/native-select/native-select/discussions)
- 🐛 [GitHub Issues](https://github.com/native-select/native-select/issues)
- 📧 Email: support@native-select.dev

---

**Made with ❤️ for extreme-scale data visualization**
