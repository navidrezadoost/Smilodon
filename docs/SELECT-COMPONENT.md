# Enhanced Select Component

A configurable, framework-agnostic select component with single and multi-selection, host-controlled data loading, server-side selected-item lookup, and customizable rendering.

## Features

✅ **High Cohesion, Low Coupling**: Independent option components that handle their own state and events
✅ **Framework Support**: React, Vue, Svelte adapters included
✅ **Multi & Single Select**: Configurable selection modes with validation
✅ **Global Configuration**: Define defaults globally, override at component level
✅ **Full Customization**: Every visual detail is customizable via CSS variables and inline styles
✅ **Load More**: Manual or observer-triggered requests for additional host-provided data
✅ **Busy State**: Loading indicators with minimum display time to prevent flashing
✅ **Server-Side Selection**: Solve the challenge of pre-selecting items not yet loaded
✅ **Scroll to Selected**: Auto-scroll to selected items on open/close
✅ **Keyboard Navigation**: ARIA semantics and keyboard interaction are implemented; accessibility certification is still in progress
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
});
```

Data fetching, pagination, request cancellation, and page caching belong to the host application. In the current public `EnhancedSelect` path, `virtualize` controls legacy chunked rendering for large flat lists; it does not enable viewport-windowed virtualization. See [Known Limitations](./KNOWN-LIMITATIONS.md#viewport-virtualization-status).

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
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
      },
      selectedOption: {
        backgroundColor: '#4caf50',
        color: 'white',
      },
      activeOption: {
        border: '1px solid #2563eb',
        outline: '2px solid rgba(37, 99, 235, 0.2)',
      },
      badge: {
        height: '32px',
        borderRadius: '10px',
        background: '#0f172a',
        color: '#fff',
      },
      badgeRemove: {
        width: '20px',
        height: '20px',
        fontSize: '12px',
      },
      groupHeader: {
        textAlign: 'center',
        color: '#7c3aed',
        margin: '6px 0 0',
      },
      classNames: {
        container: 'my-select',
        dropdown: 'my-dropdown',
        option: 'my-option',
        groupHeader: 'my-group-header',
        badge: 'my-chip',
        badgeRemove: 'my-chip-remove',
      },
    },
    selection: {
      removeButtonIcon: '<svg viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>',
    },
  }}
/>
```

The latest styling surface also supports dedicated chip parts (`chip`, `chip-label`, `chip-remove`, `chip-remove-icon`), richer `--select-badge-*` sizing/state tokens, `--select-group-header-*` layout tokens, and `--select-option-*` border/radius/active-state tokens.

For alignment-specific styling, switch and inspect both of these together:

- the selected value in the closed input with `--select-input-text-align`
- the dropdown option labels with `--select-option-text-align`

If needed, also align grouped headers with `--select-group-header-text-align`.

### Dropdown placement

The option box can open in three modes:

- `bottom` (default)
- `top`
- `auto`

Per-instance example:

```tsx
<Select
  items={items}
  config={{
    dropdownPlacement: {
      mode: 'auto',
    },
  }}
/>
```

In `auto` mode, the component checks whether the dropdown has enough room below the select. If not, it opens above instead.

### Direction

The select supports both `ltr` and `rtl` directions. The shared default is `ltr`.

Global default:

```ts
configureSelect({
  direction: 'rtl',
});
```

Per-instance example:

```tsx
<Select
  items={items}
  config={{
    direction: 'rtl',
  }}
/>
```

This updates the shell direction, arrow/clear-control anchoring, separator side, and selected indicator side in the dropdown. The component also syncs the host `dir` attribute automatically.

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
5. The host application owns page caching, pagination, request cancellation, and replacing/appending items. The component emits `loadMore` requests but does not fetch or cache pages itself.

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
| `onLoadMore` | `(page) => void` | Called when the component requests that the host load more items |
| `onError` | `(error) => void` | Called on error |

### Component Methods

| Method | Description |
|--------|-------------|
| `getSelectedItems()` | Get currently selected items |
| `getSelectedValues()` | Get currently selected values |
| `setSelectedValues(values: unknown[])` | Set selected items by value; returns a promise and may fetch missing selected items when server-side lookup is configured |
| `clear()` | Clear all selections |
| `clearSearch()` | Clear the search query |
| `open()` / `close()` | Open or close the dropdown |
| `updateConfig(config: Partial<GlobalSelectConfig>)` | Update configuration |
| `setItems(items: unknown[])` | Replace the displayed item set |
| `setGroupedItems(groups: GroupedItem[])` | Replace the displayed groups |
| `setError(message: string)` / `clearError()` | Set or clear the internal validation error and its combobox description |
| `setRequired(required: boolean)` / `validate()` | Set required state and validate the current selection |

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

## Large-list rendering status

The public `virtualize` setting currently enables incremental chunk rendering on large flat lists; it does not keep only the viewport and overscan rows mounted. True viewport-windowed `virtual-window` rendering is guarded by a private test seam and is not a supported or production-certified public mode. The public default remains the legacy rendering path. Do not infer bounded DOM or production virtualization support from `virtualize: true`; see [Known Limitations](./KNOWN-LIMITATIONS.md#viewport-virtualization-status) and the [Phase 4 certification record](./architecture/PHASE-4-CERTIFICATION.md).

The component provides search/load-more events, busy-state presentation, and item-update methods. Data fetching, request cancellation, pagination, and page caching remain host responsibilities.

## Accessibility

- The internal combobox and popup listbox receive their accessible name from the host's `aria-label`; the combobox's literal description comes from `aria-description`.
- `setError(message)` marks the combobox invalid and associates the message with it; `clearError()` removes that error description.
- Keyboard interaction includes Arrow keys, Enter, Escape, Home, and End, with focus normally remaining on the combobox input. Removing a selected chip by keyboard moves focus to the next available remove control.
- Selection, result-count, and validation announcements use a polite live region.
- Host `aria-labelledby` and `aria-describedby` references are not forwarded across the component's shadow-root boundary. Use the literal host attributes above; error descriptions are linked internally.
- Automated accessibility checks are being expanded and still require pinned Chromium/Firefox/WebKit verification. Manual screen-reader and assistive-technology assessment has not been completed. This is not a WCAG conformance claim.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## License

MIT
