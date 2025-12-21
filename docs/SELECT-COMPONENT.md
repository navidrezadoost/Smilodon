# Enhanced Select Component

A highly configurable, framework-agnostic select component with advanced features including infinite scroll, multi-select, server-side selection, and full customization.

## Features

✅ **High Cohesion, Low Coupling**: Independent option components that handle their own state and events
✅ **Framework Support**: React, Vue, Svelte adapters included
✅ **Multi & Single Select**: Configurable selection modes with validation
✅ **Global Configuration**: Define defaults globally, override at component level
✅ **Full Customization**: Every visual detail is customizable via CSS variables and inline styles
✅ **Infinite Scroll**: Built-in pagination with caching and preloading
✅ **Load More**: Incremental loading with customizable batch sizes
✅ **Busy State**: Loading indicators with minimum display time to prevent flashing
✅ **Server-Side Selection**: Solve the challenge of pre-selecting items not yet loaded
✅ **Scroll to Selected**: Auto-scroll to selected items on open/close
✅ **Keyboard Navigation**: Full a11y support with ARIA attributes
✅ **Remove Options**: Multi-select with removable chips
✅ **Search/Filter**: Optional searchable dropdown
✅ **Callbacks**: Rich event system with user-defined callbacks

**Note:** Angular support has been discontinued. Use React, Vue, Svelte, or Vanilla JavaScript.

## Installation

```bash
npm install @smilodon/core
# Framework-specific packages
npm install @smilodon/react
npm install @smilodon/vue
npm install @smilodon/svelte
```

## Quick Start

### React

```tsx
import { Select, configureSelect } from '@smilodon/react';

// Optional: Configure global defaults
configureSelect({
  selection: {
    mode: 'multi',
    showRemoveButton: true,
  },
  scrollToSelected: {
    enabled: true,
    multiSelectTarget: 'first',
  },
});

function App() {
  const [selectedValues, setSelectedValues] = useState([]);
  
  const items = [
    { value: 1, label: 'Option 1' },
    { value: 2, label: 'Option 2' },
    { value: 3, label: 'Option 3' },
  ];

  return (
    <Select
      items={items}
      selectedValues={selectedValues}
      onSelectionChange={(items, values) => {
        console.log('Selected:', values);
        setSelectedValues(values);
      }}
      onOptionSelect={(data) => {
        console.log('Option selected:', data.value, data.label);
      }}
      config={{
        selection: { mode: 'multi' },
        loadMore: { enabled: true, itemsPerLoad: 3 },
      }}
    />
  );
}
```

### Vue 3

```vue
<template>
  <Select
    :items="items"
    v-model="selectedValues"
    :config="config"
    @change="handleChange"
    @select="handleSelect"
  />
</template>

<script setup>
import { ref } from 'vue';
import Select from '@smilodon/vue';

const items = ref([
  { value: 1, label: 'Option 1' },
  { value: 2, label: 'Option 2' },
]);

const selectedValues = ref([]);

const config = {
  selection: { mode: 'single' },
  busyBucket: { enabled: true },
};

const handleChange = (items, values) => {
  console.log('Changed:', values);
};

const handleSelect = (data) => {
  console.log('Selected:', data.value, data.label);
};
</script>
```

### Svelte

```svelte
<script>
  import Select from '@smilodon/svelte';
  
  let items = [
    { value: 1, label: 'Option 1' },
    { value: 2, label: 'Option 2' },
  ];
  
  let selectedValues = [];
  
  const config = {
    selection: { mode: 'multi', maxSelections: 5 },
    scrollToSelected: { enabled: true },
  };
  
  function handleChange(event) {
    console.log('Changed:', event.detail.values);
  }
  
  function handleSelect(event) {
    console.log('Selected:', event.detail.value, event.detail.label);
  }
</script>

<Select
  {items}
  bind:selectedValues
  {config}
  on:change={handleChange}
  on:select={handleSelect}
/>
```

### Vanilla JavaScript

```html
<enhanced-select id="my-select"></enhanced-select>

<script type="module">
import '@smilodon/core';
import { configureSelect } from '@smilodon/core';

// Global configuration
configureSelect({
  selection: { mode: 'single' },
  busyBucket: { enabled: true },
});

const selectEl = document.getElementById('my-select');
selectEl.setItems([
  { value: 1, label: 'Option 1' },
  { value: 2, label: 'Option 2' },
]);

selectEl.configure({
  selection: { mode: 'multi' },
  loadMore: { enabled: true },
});

selectEl.addEventListener('change', (event) => {
  console.log('Changed:', event.detail.values);
});

selectEl.addEventListener('select', (event) => {
  console.log('Selected:', event.detail.value, event.detail.label);
});
</script>
```

## Global Configuration

Configure defaults once, use everywhere:

```typescript
import { configureSelect } from '@smilodon/core';

configureSelect({
  // Selection behavior
  selection: {
    mode: 'single', // or 'multi'
    allowDeselect: true,
    maxSelections: 0, // 0 = unlimited
    showRemoveButton: true,
    closeOnSelect: true,
  },
  
  // Scroll to selected item
  scrollToSelected: {
    enabled: true,
    multiSelectTarget: 'first', // or 'last'
    behavior: 'smooth',
    block: 'nearest',
  },
  
  // Load more functionality
  loadMore: {
    enabled: true,
    itemsPerLoad: 3,
    threshold: 100, // pixels from bottom
    showLoader: true,
  },
  
  // Busy/loading state
  busyBucket: {
    enabled: true,
    showSpinner: true,
    message: 'Loading...',
    minDisplayTime: 200, // ms
  },
  
  // Server-side data
  serverSide: {
    enabled: true,
    initialSelectedValues: [1, 2, 3],
    fetchSelectedItems: async (values) => {
      // Fetch items by values from server
      const response = await fetch(`/api/items?ids=${values.join(',')}`);
      return response.json();
    },
    getValueFromItem: (item) => item.id,
    getLabelFromItem: (item) => item.name,
  },
  
  // Infinite scroll
  infiniteScroll: {
    enabled: true,
    pageSize: 20,
    initialPage: 1,
    cachePages: true,
    maxCachedPages: 10,
    preloadAdjacent: true,
    scrollRestoration: 'auto',
  },
  
  // Callbacks
  callbacks: {
    onSelect: (data) => console.log('Selected:', data),
    onOpen: () => console.log('Opened'),
    onClose: () => console.log('Closed'),
    onSearch: (query) => console.log('Search:', query),
    onLoadMore: (page) => console.log('Load more:', page),
    onChange: (items, values) => console.log('Changed:', values),
    onError: (error) => console.error('Error:', error),
  },
  
  // General settings
  enabled: true,
  searchable: true,
  placeholder: 'Select an option...',
  virtualize: true,
  estimatedItemHeight: 48,
});
```

## Component-Level Configuration

Override global settings per component:

```tsx
<Select
  items={items}
  config={{
    selection: { mode: 'multi' }, // Overrides global
    loadMore: { enabled: false }, // Overrides global
  }}
/>
```

**Note**: Component-level config always takes precedence over global config.

## Full Customization

### CSS Variables

```css
:root {
  /* Input */
  --select-border-color: #ccc;
  --select-border-focus-color: #1976d2;
  --select-border-radius: 4px;
  --select-shadow-focus-color: rgba(25, 118, 210, 0.1);
  --select-disabled-bg: #f5f5f5;
  
  /* Dropdown */
  --select-dropdown-bg: white;
  --select-dropdown-border: #ccc;
  --select-dropdown-shadow: 0 4px 6px rgba(0,0,0,0.1);
  --select-dropdown-z-index: 1000;
  
  /* Options */
  --select-option-hover-bg: #f0f0f0;
  --select-option-selected-bg: #e3f2fd;
  --select-option-selected-color: #1976d2;
  --select-option-active-outline: #1976d2;
  
  /* Remove button */
  --select-remove-btn-bg: transparent;
  --select-remove-btn-color: #666;
  --select-remove-btn-hover-bg: #ffebee;
  --select-remove-btn-hover-color: #c62828;
  --select-remove-btn-focus-outline: #1976d2;
  
  /* Spinner */
  --select-spinner-color: #ccc;
  --select-spinner-active-color: #1976d2;
  
  /* Other */
  --select-busy-color: #666;
  --select-empty-color: #999;
  --select-divider-color: #e0e0e0;
}
```

### Inline Styles

```tsx
<Select
  items={items}
  config={{
    styles: {
      container: {
        width: '300px',
        margin: '20px',
      },
      dropdown: {
        maxHeight: '400px',
        borderRadius: '8px',
      },
      option: {
        padding: '12px 16px',
        fontSize: '16px',
      },
      selectedOption: {
        backgroundColor: '#4caf50',
        color: 'white',
      },
      classNames: {
        container: 'my-select',
        dropdown: 'my-dropdown',
        option: 'my-option',
      },
    },
  }}
/>
```

## Advanced Scenarios

### Scenario 1: Server-Side Selection (Initial Load)

When receiving data from the server with pre-selected items:

```typescript
// Server response includes selected IDs
const serverData = {
  items: [...], // Current page items
  selectedIds: [5, 12, 23], // Pre-selected from different pages
};

// Configure select to fetch selected items
<Select
  items={serverData.items}
  config={{
    serverSide: {
      enabled: true,
      initialSelectedValues: serverData.selectedIds,
      fetchSelectedItems: async (values) => {
        // Fetch the actual items for these IDs
        const response = await fetch(`/api/items?ids=${values.join(',')}`);
        return response.json();
      },
      getValueFromItem: (item) => item.id,
      getLabelFromItem: (item) => item.name,
    },
  }}
/>
```

### Scenario 2: Infinite Scroll with Selected Item on Page 5

When a selected item is on a page that hasn't been loaded yet:

```typescript
<Select
  items={currentPageItems}
  config={{
    infiniteScroll: {
      enabled: true,
      pageSize: 20,
      cachePages: true,
      scrollRestoration: 'auto', // Automatically scrolls to selected
    },
    serverSide: {
      enabled: true,
      initialSelectedValues: [itemOnPage5Id],
      fetchSelectedItems: async (values) => {
        // Fetch specific items even if their page isn't loaded
        const response = await fetch(`/api/items/by-ids`, {
          method: 'POST',
          body: JSON.stringify({ ids: values }),
        });
        return response.json();
      },
    },
    scrollToSelected: {
      enabled: true,
      behavior: 'smooth',
    },
  }}
/>
```

**How it works:**
1. Component fetches selected items via `fetchSelectedItems`
2. These items are added to the internal state
3. When dropdown opens, it scrolls to the selected item
4. The selected item is rendered even if its page isn't loaded
5. Page caching ensures performance

### Scenario 3: Multi-Select with Remove Buttons

```typescript
<Select
  items={items}
  config={{
    selection: {
      mode: 'multi',
      maxSelections: 10,
      showRemoveButton: true, // Show × button on each selected
    },
  }}
  onOptionSelect={(data) => {
    console.log(`${data.label} ${data.selected ? 'selected' : 'removed'}`);
  }}
/>
```

### Scenario 4: Load More with Custom Trigger

```typescript
<Select
  items={items}
  config={{
    loadMore: {
      enabled: true,
      itemsPerLoad: 3,
      showLoader: true,
    },
  }}
  onLoadMore={async (page) => {
    const newItems = await fetchItemsFromServer(page);
    setItems([...items, ...newItems]);
  }}
/>
```

## API Reference

### Component Props

| Prop | Type | Description |
|------|------|-------------|
| `items` | `unknown[]` | Items to display in the dropdown |
| `selectedValues` | `unknown[]` | Controlled selected values |
| `initialSelectedValues` | `unknown[]` | Initial selected values (uncontrolled) |
| `config` | `Partial<GlobalSelectConfig>` | Component-level configuration |
| `onSelectionChange` | `(items, values) => void` | Called when selection changes |
| `onOptionSelect` | `(data) => void` | Called when an option is selected/deselected |
| `onOpen` | `() => void` | Called when dropdown opens |
| `onClose` | `() => void` | Called when dropdown closes |
| `onSearch` | `(query) => void` | Called when search query changes |
| `onLoadMore` | `(page) => void` | Called when more items are loaded |
| `onError` | `(error) => void` | Called on error |

### Component Methods

| Method | Description |
|--------|-------------|
| `getSelectedItems()` | Get currently selected items |
| `getSelectedValues()` | Get currently selected values |
| `setSelectedValues(values)` | Set selected items by value |
| `clear()` | Clear all selections |
| `open()` | Open dropdown |
| `close()` | Close dropdown |
| `updateConfig(config)` | Update configuration |
| `setItems(items)` | Set items to display |

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type { 
  GlobalSelectConfig, 
  SelectionConfig,
  ScrollToSelectedConfig,
  ServerSideConfig,
} from '@smilodon/core';

const config: GlobalSelectConfig = {
  // Fully typed configuration
};
```

## Performance

- **Virtualization**: Only renders visible items
- **Page Caching**: LRU cache for loaded pages
- **Debounced Search**: Prevents excessive filtering
- **Lazy Loading**: Load items on demand
- **Efficient DOM Updates**: Minimal re-renders

## Accessibility

- Full keyboard navigation (Arrow keys, Enter, Escape, Home, End)
- ARIA attributes for screen readers
- Focus management
- Live region announcements
- Type-ahead search

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## License

MIT
