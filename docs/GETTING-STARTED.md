# Getting Started Guide

> API status: examples in this older guide use the compatibility `NativeSelect`/`NativeSelectElement` API. The maintained component API is `Select` in the React, Vue, and Svelte adapters, or the `enhanced-select` custom element in core. See the [current Select Component guide](./SELECT-COMPONENT.md) and [API Reference](./API-REFERENCE.md). Angular is not a maintained adapter and `@smilodon/angular` is not a supported package.

## Quick Start (5 minutes)

### Installation

Choose your framework:

```bash
# React
npm install @smilodon/core @smilodon/react

# Vue
npm install @smilodon/core @smilodon/vue

# Svelte
npm install @smilodon/core @smilodon/svelte

# Vanilla JavaScript
npm install @smilodon/core
```

### Your First Select Component

#### React

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

**Time to first render: ~2 minutes** ✅

#### Vue

```vue
<template>
  <NativeSelect
    :items="items"
    @select="handleSelect"
  />
</template>

<script setup>
import { NativeSelect } from '@smilodon/vue';

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

**Time to first render: ~2 minutes** ✅

#### Svelte

```svelte
<script>
  import { NativeSelect } from '@smilodon/svelte';
  
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

**Time to first render: ~2 minutes** ✅

#### Angular

Angular is not a maintained adapter. The repository does not publish a supported `@smilodon/angular` package; use a maintained adapter or the core custom element directly.

#### Vanilla JS

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import { NativeSelectElement } from './node_modules/@smilodon/core/dist/index.js';
    
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

**Time to first render: ~3 minutes** ✅

---

## Common Use Cases (10 minutes)

### 1. Multi-Select

```tsx
<NativeSelect
  items={items}
  multi={true}
  onSelect={({ indices, items }) => {
    console.log(`Selected ${indices.length} items:`, items);
  }}
/>
```

### 2. Large Dataset (10,000+ items)

```tsx
const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
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

**Performance**: Renders in <50ms, scrolls at 60 FPS ✅

### 3. Custom Item Template

```tsx
<NativeSelect
  items={users}
  optionTemplate={(user) => `
    <div class="user-option">
      <img src="${user.avatar}" alt="" />
      <div>
        <strong>${user.name}</strong>
        <small>${user.email}</small>
      </div>
    </div>
  `}
/>
```

**Security Note**: Sanitize untrusted data (see Security section)

### 4. Remote Data with Async Loading

```tsx
import { useState, useEffect } from 'react';

function AsyncSelect() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/items')
      .then(r => r.json())
      .then(data => {
        setItems(data);
        setLoading(false);
      });
  }, []);
  
  if (loading) return <div>Loading...</div>;
  
  return <NativeSelect items={items} />;
}
```

### 5. Controlled Selection

```tsx
const [selectedIndices, setSelectedIndices] = useState([0]);

<NativeSelect
  items={items}
  selectedIndices={selectedIndices}
  onSelect={({ indices }) => setSelectedIndices(indices)}
/>
```

---

## Styling (5 minutes)

### CSS Custom Properties (Recommended)

```css
native-select {
  --ns-item-height: 50px;
  --ns-item-padding: 12px 16px;
  --ns-item-bg: #ffffff;
  --ns-item-hover-bg: #f0f0f0;
  --ns-item-selected-bg: #e3f2fd;
  --ns-item-selected-color: #1976d2;
  --ns-border-color: #ddd;
  --ns-border-radius: 8px;
  --ns-focus-outline: 2px solid #1976d2;
  --ns-font-size: 16px;
  --ns-max-height: 400px;
}
```

### Global CSS (Light DOM)

```css
/* Style the host element */
native-select {
  display: block;
  width: 300px;
  margin: 20px;
}
```

### Framework-Specific Styling

**React with CSS Modules**:
```tsx
import styles from './Select.module.css';

<NativeSelect
  className={styles.mySelect}
  items={items}
/>
```

**Styled Components**:
```tsx
import styled from 'styled-components';

const StyledSelect = styled(NativeSelect)`
  --ns-item-height: 60px;
  --ns-item-selected-bg: ${props => props.theme.primary};
`;
```

**Tailwind CSS**:
```tsx
<NativeSelect
  className="w-full max-w-md mx-auto"
  style={{
    '--ns-item-height': '48px',
    '--ns-border-radius': '0.5rem'
  }}
  items={items}
/>
```

---

## Accessibility (3 minutes)

**Built-in ARIA support** - No configuration needed:

- ✅ `role="listbox"` on container
- ✅ `role="option"` on items
- ✅ `aria-selected` state management
- ✅ `aria-multiselectable` for multi-select
- ✅ `aria-activedescendant` for keyboard navigation
- ✅ Screen reader announcements
- ✅ Keyboard navigation (Arrow keys, Home, End, Enter, Space)
- ✅ Type-ahead search

**Test with screen readers**:
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS/iOS)

---

## TypeScript (2 minutes)

### Full Type Safety

```typescript
import { NativeSelect } from '@smilodon/react';
import type { NativeSelectProps } from '@smilodon/react';

interface User {
  id: number;
  name: string;
  email: string;
}

const users: User[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' }
];

function UserSelect() {
  const handleSelect = (data: { indices: number[]; items: User[] }) => {
    // TypeScript knows items is User[]
    console.log(data.items[0].name);
  };
  
  return <NativeSelect items={users} onSelect={handleSelect} />;
}
```

### Custom Element Types

```typescript
// For vanilla JS usage
declare global {
  interface HTMLElementTagNameMap {
    'native-select': NativeSelectElement;
  }
}
```

---

## Performance Tips (5 minutes)

### 1. Optimize Item Height

```tsx
// ✅ Good: Accurate estimate
<NativeSelect
  items={items}
  estimatedItemHeight={48} // Match your CSS
/>

// ❌ Bad: Wildly inaccurate
<NativeSelect
  items={items}
  estimatedItemHeight={20} // Items are actually 60px
/>
```

### 2. Increase Buffer for Fast Scrolling

```tsx
// Default buffer: 5 items
<NativeSelect items={items} buffer={10} />
```

### 3. Memoize Large Datasets

```tsx
// ✅ Good: Memoized
const items = useMemo(() => 
  generateLargeDataset(10000),
  []
);

// ❌ Bad: Recreated every render
const items = generateLargeDataset(10000);
```

### 4. Use Web Workers for Heavy Processing

```tsx
import { WorkerManager } from '@smilodon/core';

const worker = new WorkerManager();

// Process data off main thread
const filtered = await worker.filter(items, 'search query');
```

---

## Troubleshooting (5 minutes)

### Items Not Displaying

**Problem**: Empty select component

**Solutions**:
1. Check `items` prop is an array
2. Verify custom element is registered
3. Check browser console for errors

```tsx
// Debug
useEffect(() => {
  console.log('Items:', items);
  console.log('Registered:', customElements.get('native-select'));
}, [items]);
```

### Selection Not Working

**Problem**: Clicks don't select items

**Solutions**:
1. Check `onSelect` handler is attached
2. Verify items have `data-selectable` attribute
3. Check for CSS `pointer-events: none`

### Performance Issues

**Problem**: Slow scrolling with large datasets

**Solutions**:
1. Set accurate `estimatedItemHeight`
2. Increase `buffer` value
3. Check for expensive `optionTemplate`
4. Profile with Performance Monitor

```typescript
import { getTelemetry } from '@smilodon/core';

const telemetry = getTelemetry();
console.log('Metrics:', telemetry.getMetrics());
```

### CSP Violations

**Problem**: "Refused to execute inline script"

**Solutions**:
1. Add CSP headers (see Security guide)
2. Check no inline styles in templates
3. Use `setHTMLSanitizer()` for templates

---

## Next Steps (5 minutes)

### Advanced Features

1. **Custom Renderers (Option B)** - Full control over rendering with a DOM return
   ```typescript
   // Works with the web component and wrappers (React/Vue/Svelte) as `optionRenderer`
   const optionRenderer = (item, index, helpers) => {
     const el = document.createElement('div');
     el.className = 'my-option';
     el.textContent = `${index + 1}. ${item.label}`;
     el.addEventListener('click', () => helpers.onSelect(item, index));
     return el; // Must return an HTMLElement
   };
   ```

2. **Accessible labeling** - Use a literal accessible name and description
   ```html
   <label for="user-picker">Choose a user</label>
   <enhanced-select id="user-picker" aria-label="Choose a user"
     aria-description="Type to search; results update as you type."></enhanced-select>
   ```
   The core forwards literal `aria-label` and `aria-description` attributes to its internal combobox. Host `aria-labelledby` and `aria-describedby` ID references are not forwarded across the shadow boundary; internal validation descriptions created by `setError()` are associated within the shadow root.

3. **Server-Side Lookup** - Stream results as you fetch
   ```typescript
   const el = document.querySelector('enhanced-select');
   el.updateConfig({ searchable: true, serverSide: { enabled: true } });
   let controller: AbortController | null = null;
   el.addEventListener('search', async (e: CustomEvent) => {
     controller?.abort();
     controller = new AbortController();
     const resp = await fetch(`/api/users?q=${encodeURIComponent(e.detail.query)}`, { signal: controller.signal });
     const items = await resp.json();
     el.setItems(items);
   });
   ```

4. **Large flat lists** - The public `virtualize` setting uses incremental chunk rendering; it is not viewport virtualization and does not guarantee bounded mounted DOM.
   ```typescript
   const items = Array.from({ length: 100_000 }, (_, i) => ({ value: i, label: `Item ${i}` }));
   const el = document.querySelector('enhanced-select');
   el.updateConfig({ virtualize: true });
   el.setItems(items);
   ```
   True viewport-windowed rendering remains guarded by a private test seam and is not a supported production mode. See [Known Limitations](./KNOWN-LIMITATIONS.md#viewport-virtualization-status).

2. **Portal Mode** - Render outside overflow:hidden
   ```tsx
   <NativeSelect items={items} portal={true} />
   ```

3. **Performance Telemetry** - Monitor metrics
   ```typescript
   import { getTelemetry } from '@smilodon/core';
   
   const telemetry = getTelemetry();
   telemetry.startRecording();
   // ... use component
   console.log(telemetry.getMetrics());
   ```

### Learn More

- 📖 [API Reference](./API-REFERENCE.md) - Complete API documentation
- 🔒 [Security Guide](../.azure/phase9-security-guide.md) - CSP compliance
- 🎨 [Styling Guide](./STYLING.md) - Advanced theming
- 🚀 [Performance Guide](./PERFORMANCE.md) - Optimization techniques
- 🔄 [Migration Guide](./MIGRATION.md) - From other libraries

---

## Time to Productivity

- ✅ **5 minutes**: First component rendering
- ✅ **10 minutes**: Multi-select, large datasets
- ✅ **15 minutes**: Custom styling
- ✅ **20 minutes**: Custom templates
- ✅ **30 minutes**: Advanced features

**Goal achieved**: 90% of common tasks in < 30 minutes! 🎉

---

## Getting Help

- 💬 GitHub Discussions
- 🐛 GitHub Issues
- 📧 Email: support@smilodon.dev
- 📖 Full Documentation: [docs.native-select.dev](https://docs.native-select.dev)

**Still stuck?** Check the [Troubleshooting Guide](./TROUBLESHOOTING.md) or ask in Discussions!
