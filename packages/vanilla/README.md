# @smilodon/vanilla

Vanilla JavaScript/TypeScript helpers for Smilodon Select. Part of the [Smilodon](https://github.com/navidrezadoost/smilodon) UI toolkit.

> Large-list status: the helper's public `virtualized` option maps to legacy chunked rendering for large flat lists; it does not window rows to the viewport. True viewport virtualization remains guarded by a private test seam and is not a supported production mode. See the [current limitation record](../../docs/KNOWN-LIMITATIONS.md#viewport-virtualization-status).

> Current API: use the [API reference](../../docs/API-REFERENCE.md) and the package's exported TypeScript declarations. The long-form guide below contains legacy `NativeSelect` examples and is not a current API inventory.
>
> **Registration prerequisite:** import `@smilodon/core` before calling `createSelect()` or `initSelect()`. The Vanilla helper creates an `enhanced-select` element and immediately calls its imperative methods; it does not wait for custom-element registration/upgrade. For an existing host, await `customElements.whenDefined('enhanced-select')` before `initSelect()`.

## Acknowledged data-loading adapter status

The Phase 2F-D development candidate currently integrates acknowledged data loading through the core API and React adapter only. The `@smilodon/vanilla` helper does not publish a typed helper contract for request identity, completion, cancellation, and projection lifecycle. Passing `dataLoading` through casts or relying on the underlying element is undocumented and unsupported through these helpers. Vanilla adapter parity remains a separate, pending work package; the legacy helper API remains supported.

## Features

- ✨ **Simple API** - Easy-to-use helper functions for vanilla JS
- 🔍 **Zero Dependencies** - Only requires @smilodon/core
- ♿ **Accessibility behaviors** - The shared core passed its scoped Phase 4 automated browser matrix in Chromium, Firefox, and WebKit. This does not certify every Vanilla integration, minimum browser versions, or WCAG conformance; manual assistive-technology assessment remains pending.
- ⚡ **Bundle size** - Size depends on the selected package entry, dependency graph, and bundler output. No current version-specific gzipped-size measurement is claimed here.
- 🔧 **TypeScript** - Full type safety included
- 📦 **Tree-Shakeable** - Import only what you need
- 🎯 **Web Standards** - Built on native Web Components

## 📖 Documentation

**Live documentation & interactive examples:** [navidrezadoost.github.io/Smilodon](https://navidrezadoost.github.io/Smilodon/)

**Framework integration (Vue 3, Nuxt 4, React, SSR, Vite):** [`docs/FRAMEWORK-INTEGRATION.md`](../../docs/FRAMEWORK-INTEGRATION.md)

👉 **[Legacy Vanilla JS Guide (mixed-era examples)](./COMPLETE-GUIDE.md)** 👈

## Installation

```bash
npm install @smilodon/vanilla @smilodon/core
```

## Quick Start

### Using the Helper Function

```typescript
import '@smilodon/core';
import { createSelect } from '@smilodon/vanilla';

const select = createSelect({
  items: [
    { value: '1', label: 'Apple' },
    { value: '2', label: 'Banana' },
    { value: '3', label: 'Cherry' },
  ],
  placeholder: 'Select a fruit...',
  onChange: (value, items) => {
    console.log('Selected:', value, items);
  }
});

document.body.appendChild(select);
```

### Direction and option-state controls

```typescript
import '@smilodon/core';
import { createSelect } from '@smilodon/vanilla';

const items = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
];

const select = createSelect({
  items,
  direction: 'rtl',
  removeButtonIcon: '−',
  disabledOptionBehavior: {
    hoverable: true,
    focusable: true,
    selectable: false,
  },
  showSelectedIndicator: false,
});
```

- `direction` switches the instance between `ltr` and `rtl`
- `removeButtonIcon` replaces the chip remove icon with text or inline SVG markup
- `disabledOptionBehavior` controls whether dimmed options can still be hovered, focused, or selected
- `showSelectedIndicator` hides or shows the selected side indicator without custom pseudo-element overrides

### Core config parity and global defaults

The Vanilla helpers now expose both adapter-style convenience options and the full shared core config shape.

#### Convenience options on `createSelect()` / `initSelect()`

Use these when you want advanced core features without writing the whole `updateConfig()` object yourself:

- `selectionConfig`
- `multiSelectDisplay`
- `scrollToSelected`
- `styles`
- `config`

```typescript
import '@smilodon/core';
import { createSelect } from '@smilodon/vanilla';

const select = createSelect({
  items: [
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue' },
    { value: 'svelte', label: 'Svelte' },
    { value: 'solid', label: 'Solid' },
  ],
  value: ['react', 'solid'],
  multiple: true,
  searchable: true,
  multiSelectDisplay: {
    mode: 'horizontal',
    maxHeight: '56px',
    overflowX: 'auto',
    overflowY: 'hidden',
    dragScroll: true,
  },
  selectionConfig: {
    closeOnSelect: false,
    toggleOnTriggerClick: true,
  },
  styles: {
    badgeRemoveIcon: {
      color: '#dc2626',
      transform: 'scale(1.1)',
    },
  },
  removeButtonIcon: '−',
});
```

#### Full `config` passthrough

```typescript
import '@smilodon/core';
import { createSelect } from '@smilodon/vanilla';

const items = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
];

const select = createSelect({
  items,
  multiple: true,
  config: {
    dropdownPlacement: { mode: 'auto' },
    scrollToSelected: {
      enabled: true,
      multiSelectTarget: 'last',
    },
    multiSelectDisplay: {
      mode: 'vertical',
      maxHeight: '120px',
    },
    selection: {
      allowDeselect: true,
      closeOnSelect: false,
    },
    styles: {
      badge: {
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        color: '#1d4ed8',
      },
      badgeRemoveIcon: {
        color: '#1d4ed8',
      },
    },
  },
});
```

#### Global defaults from `@smilodon/vanilla`

```typescript
import '@smilodon/core';
import { configureSelect, createSelect } from '@smilodon/vanilla';

const items = [{ value: 'react', label: 'React' }];

configureSelect({
  searchable: true,
  clearControl: {
    enabled: true,
    clearSelection: true,
    clearSearch: true,
  },
  selection: {
    showSelectedIndicator: false,
    removeButtonIcon: '×',
  },
});

const select = createSelect({ items });
```

#### Expanded helper API

In addition to `open()`, `close()`, `clear()`, `setItems()`, and `setGroupedItems()`, the Vanilla helper layer now exposes:

- `clearSearch(element)`
- `getSelectedItems(element)`
- `updateConfig(element, config)`
- `setError(element, message)`
- `clearError(element)`
- `setRequired(element, required)`
- `validate(element)`
- `getCapabilities(element)` and `getKnownLimitations(element)`
- `getTrackingSnapshot(element)`, `clearTracking(element, source?)`, and `setLimitationPolicies(element, policies)`
- `getValue(element)` and `setValue(element, value)`
- global `configureSelect(config)`, `resetSelectConfig()`, and `selectConfig`

```typescript
import '@smilodon/core';
import {
  createSelect,
  clearSearch,
  updateConfig,
  setError,
  validate,
} from '@smilodon/vanilla';

const select = createSelect({
  items: [{ value: 'choice', label: 'Choice' }],
});
document.body.appendChild(select);

clearSearch(select);
updateConfig(select, { selection: { showSelectedIndicator: false } });
setError(select, 'Please choose at least one option');
console.log(validate(select));
```

### Using the Web Component Directly

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Smilodon Vanilla example</title>
</head>
<body>
  <div id="app">
    <enhanced-select placeholder="Select a language..."></enhanced-select>
  </div>
  <script type="module">
    import '@smilodon/core';
    import { initSelect } from '@smilodon/vanilla';

    await customElements.whenDefined('enhanced-select');
    const select = document.querySelector<HTMLElement>('enhanced-select');
    if (!select) throw new Error('Expected an enhanced-select element');

    initSelect(select, {
      items: [
        { value: 'js', label: 'JavaScript' },
        { value: 'ts', label: 'TypeScript' },
        { value: 'py', label: 'Python' },
      ],
      value: 'js',
      searchable: true,
      placeholder: 'Select a language...'
    });
  </script>
</body>
</html>
```

## Examples

Every standalone helper example below imports `@smilodon/core` before calling `createSelect()`. In an application, one core side-effect import at the browser entry point is sufficient. When initializing an existing host with `initSelect()`, wait for `customElements.whenDefined('enhanced-select')` as shown above.

### Searchable Select

```typescript
import '@smilodon/core';
import { createSelect } from '@smilodon/vanilla';

const select = createSelect({
  items: [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'mx', label: 'Mexico' },
  ],
  searchable: true,
  placeholder: 'Search countries...',
  onChange: (value) => console.log('Country:', value)
});

document.body.appendChild(select);
```

### Multi-Select

```typescript
import '@smilodon/core';
import { createSelect } from '@smilodon/vanilla';

const select = createSelect({
  items: [
    { value: 'js', label: 'JavaScript' },
    { value: 'ts', label: 'TypeScript' },
    { value: 'py', label: 'Python' },
  ],
  multiple: true,
  placeholder: 'Select languages...',
  onChange: (values) => {
    console.log('Selected languages:', values);
  }
});

document.body.appendChild(select);
```

### Grouped Options

Vanilla's adapter input intentionally uses `{ group, items }`. The core runtime's `setGroupedItems()` contract uses `{ label, options }`; the helper converts the Vanilla shape to the core shape internally. Use the Vanilla shape with `createSelect()` / helper `setGroupedItems()` and the core shape only when calling the core element directly.

```typescript
import '@smilodon/core';
import { createSelect } from '@smilodon/vanilla';

const select = createSelect({
  groupedItems: [
    {
      group: 'Fruits',
      items: [
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
      ],
    },
    {
      group: 'Vegetables',
      items: [
        { value: 'carrot', label: 'Carrot' },
        { value: 'potato', label: 'Potato' },
      ],
    },
  ],
  onChange: (value) => console.log('Food:', value)
});

document.body.appendChild(select);
```

### Infinite Scroll

```typescript
import '@smilodon/core';
import { createSelect, setItems } from '@smilodon/vanilla';

const pageSize = 50;
const total = 500;
let items = makeItems(1, pageSize);
let loading = false;

const select = createSelect({
  items,
  infiniteScroll: true,
  pageSize,
  placeholder: 'Scroll to load more...',
  onLoadMore: () => {
    if (loading || items.length >= total) return;

    loading = true;
    const start = items.length + 1;
    const count = Math.min(pageSize, total - items.length);
    items = [...items, ...makeItems(start, count)];
    setItems(select, items);
    loading = false;
  }
});

function makeItems(start: number, count: number) {
  return Array.from({ length: count }, (_, i) => ({
    value: start + i,
    label: `Item ${start + i}`,
  }));
}

document.body.appendChild(select);
```

For remote data, keep the in-flight flag set until the request settles, detect the server's end-of-data response, and report/retry failures in the host application. The helper invokes `onLoadMore`; it does not own the data source or deduplicate asynchronous requests for you.

### Incremental Chunk Rendering (Large Flat Lists)

```typescript
import '@smilodon/core';
import { createSelect } from '@smilodon/vanilla';

// Generate a large flat item set
const items = Array.from({ length: 100000 }, (_, i) => ({
  value: i + 1,
  label: `Item ${i + 1}`,
}));

const select = createSelect({
  items,
  virtualized: true, // Incremental chunks, not viewport windowing
  searchable: true,
  placeholder: 'Large item list'
});

document.body.appendChild(select);
```

### Server-Side Search

```typescript
import '@smilodon/core';
import { createSelect, setItems } from '@smilodon/vanilla';

let searchRequest = 0;
let activeController: AbortController | undefined;

const select = createSelect({
  searchable: true,
  placeholder: 'Type to search...',
  onSearch: async (query) => {
    const requestId = ++searchRequest;
    activeController?.abort();

    if (!query) {
      setItems(select, []);
      return;
    }

    const controller = new AbortController();
    activeController = controller;
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Search failed: ${response.status}`);
      const data = await response.json();
      if (requestId === searchRequest) setItems(select, data.results);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError') && requestId === searchRequest) {
        console.error('Unable to search options', error);
      }
    }
  }
});

document.body.appendChild(select);
```

### Programmatic Control

```typescript
import '@smilodon/core';
import { createSelect, getValue, setValue, clear, open, close } from '@smilodon/vanilla';

const select = createSelect({
  items: [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
  ]
});

// Add to DOM
const buttons = Object.entries({ open: 'Open', close: 'Close', set: 'Set value', get: 'Get value', clear: 'Clear' }).map(([id, label]) => {
  const button = document.createElement('button');
  button.id = `btn-${id}`;
  button.textContent = label;
  return button;
});
document.body.append(select, ...buttons);

// Programmatic API
document.getElementById('btn-open')!.addEventListener('click', () => {
  open(select);
});

document.getElementById('btn-close')!.addEventListener('click', () => {
  close(select);
});

document.getElementById('btn-set')!.addEventListener('click', () => {
  setValue(select, 'published');
});

document.getElementById('btn-get')!.addEventListener('click', () => {
  console.log('Current value:', getValue(select));
});

document.getElementById('btn-clear')!.addEventListener('click', () => {
  clear(select);
});
```

### Clear Control (Reset Selection/Search)

```typescript
import '@smilodon/core';
import { createSelect } from '@smilodon/vanilla';

const select = createSelect({
  items: [
    { value: 'js', label: 'JavaScript' },
    { value: 'py', label: 'Python' },
  ],
  searchable: true,
  clearable: true,
  clearSelectionOnClear: true,
  clearSearchOnClear: true,
  clearAriaLabel: 'Clear selected and searched values',
  clearIcon: '✕',
  onClear: (detail) => console.log('cleared', detail),
  style: {
    '--select-clear-button-bg': 'rgba(0, 0, 0, 0.06)',
    '--select-clear-button-hover-bg': 'rgba(0, 0, 0, 0.12)',
    '--select-clear-button-color': '#374151',
  } as any,
});

document.body.appendChild(select);
```

Styling hooks: `::part(clear-button)`, `::part(clear-icon)`, and `--select-clear-*` CSS variables.

The shared runtime's default `hideWhenEmpty: true` behavior means an empty clearable select reserves no action-area space. A selection or enabled search query reveals the button and coordinated input/arrow layout; clearing both restores the normal layout for single/multi-select and LTR/RTL configurations. This describes the runtime behavior, not exhaustive Vanilla integration certification.

Use full config passthrough when a permanently visible disabled-when-empty action is intentional:

```typescript
import '@smilodon/core';
import { createSelect } from '@smilodon/vanilla';

const items = [{ value: 'selected', label: 'Selected item' }];
const select = createSelect({
  items,
  clearable: true,
  config: { clearControl: { hideWhenEmpty: false } },
});
```

`onClear` reports `clearedSelection` and `clearedSearch`. Prefer the clear-button parts and tokens over adding permanent input padding.

### With Event Listeners

```typescript
import '@smilodon/core';
import { createSelect } from '@smilodon/vanilla';

const select = createSelect({
  items: [
    { value: 'first', label: 'First option' },
    { value: 'second', label: 'Second option' },
  ],
  onChange: (value, items) => {
    console.log('Value changed:', value);
    console.log('Selected items:', items);
  },
  onSelect: (item, index) => {
    console.log('Item selected:', item, 'at index:', index);
  },
  onOpen: () => {
    console.log('Dropdown opened');
  },
  onClose: () => {
    console.log('Dropdown closed');
  },
  onSearch: (query) => {
    console.log('Search query:', query);
  }
});

document.body.appendChild(select);
```

### Custom Styling

```typescript
import '@smilodon/core';
import { createSelect } from '@smilodon/vanilla';

const select = createSelect({
  items: [
    { value: 'custom', label: 'Custom styled option' },
  ],
  className: 'my-custom-select',
  style: {
    width: '300px',
    marginTop: '20px',
  }
});

document.body.appendChild(select);
```

```css
/* Custom CSS variables */
.my-custom-select {
  --select-border-color: #3b82f6;
  --select-focus-border-color: #1d4ed8;
  --select-background: #f9fafb;
  --select-text-color: #111827;
}
```

## API Reference

### `createSelect(options)`

Creates and returns a new select element.

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `items` | `SelectItem[]` | `[]` | Array of selectable items |
| `groupedItems` | `GroupedItem[]` | `undefined` | Grouped items array |
| `value` | `string \| number \| Array` | `undefined` | Initial value |
| `multiple` | `boolean` | `false` | Enable multi-select |
| `searchable` | `boolean` | `false` | Enable search/filter |
| `placeholder` | `string` | `''` | Placeholder text |
| `disabled` | `boolean` | `false` | Disable the select |
| `required` | `boolean` | `false` | Mark as required |
| `error` | `boolean` | `false` | Show error state |
| `infiniteScroll` | `boolean` | `false` | Enable infinite scroll |
| `pageSize` | `number` | `50` | Items per page |
| `virtualized` | `boolean` | `false` | Enable legacy chunked rendering for large flat lists; not viewport windowing |
| `maxSelections` | `number` | `undefined` | Max selections |
| `placement` | `'bottom' \| 'top' \| 'auto'` | `'auto'` | Dropdown placement |
| `className` | `string` | `''` | Custom CSS class |
| `style` | `Partial<CSSStyleDeclaration>` | `{}` | Inline host-element styles |
| `selectionConfig`, `multiSelectDisplay`, `scrollToSelected`, `styles`, `config` | core configuration types | - | Shared runtime configuration groups |
| `direction`, `removeButtonIcon`, `disabledOptionBehavior`, `showSelectedIndicator` | documented values/configs | - | Direction, chip, and option-state settings |
| `clearable`, `clearSelectionOnClear`, `clearSearchOnClear`, `clearAriaLabel`, `clearIcon` | booleans / strings | - | Clear-control configuration |
| `onChange` | `(value, items) => void` | `undefined` | Change callback |
| `onSelect` | `(item, index) => void` | `undefined` | Select callback |
| `onOpen` | `() => void` | `undefined` | Open callback |
| `onClose` | `() => void` | `undefined` | Close callback |
| `onSearch` | `(query) => void` | `undefined` | Search callback |
| `onLoadMore` | `(page) => void` | `undefined` | Load more callback |
| `onCreate` | `(value) => void` | `undefined` | Create callback |
| `onClear` | `(detail) => void` | `undefined` | Clear result callback |
| `onDiagnostic` | `(detail) => void` | `undefined` | Diagnostic callback |
| `trackingEnabled`, `trackEvents`, `trackStyling`, `trackLimitations`, `emitDiagnostics`, `trackingMaxEntries`, `limitationPolicies`, `autoMitigateRuntimeModeSwitch` | tracking/policy types | - | Diagnostic and limitation controls |

**Returns:** `HTMLElement`

### `initSelect(element, options)`

Initialize an existing select element in the DOM.

**Parameters:**
- `element: HTMLElement` - An `enhanced-select` host whose custom-element definition has already loaded and upgraded.
- `options` - `initSelect` accepts `items`, Vanilla-shaped `groupedItems`, `value`, `multiple`, `searchable`, `placeholder`, `disabled`, `infiniteScroll`, `pageSize`, `virtualized`, `maxSelections`, `selectionConfig`, `multiSelectDisplay`, `scrollToSelected`, `styles`, `config`, `clearable`, `clearSelectionOnClear`, `clearSearchOnClear`, `clearAriaLabel`, and `clearIcon`. It does not accept the callbacks, `className`, `style`, or diagnostics options available on `createSelect`.

### `getValue(element)`

Get the selected value(s).

**Returns:** `string | number | (string | number)[]`

### `setValue(element, value)`

Set the selected value(s).

**Parameters:**
- `element: HTMLElement`
- `value: string | number | (string | number)[]`

### `clear(element)`

Clear the selection.

### `open(element)`

Open the dropdown.

### `close(element)`

Close the dropdown.

### `setItems(element, items)`

Update the items.

**Parameters:**
- `element: HTMLElement`
- `items: SelectItem[]`

### `setGroupedItems(element, groups)`

Update the grouped items.

**Parameters:**
- `element: HTMLElement`
- `groups: GroupedItem[]`

### Types

```typescript
interface SelectItem {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
  [key: string]: any;
}

interface GroupedItem {
  group: string;
  items: SelectItem[];
}
```

## Styling

The component uses CSS variables for customization:

```css
enhanced-select {
  --select-border-color: #d1d5db;
  --select-focus-border-color: #3b82f6;
  --select-background: white;
  --select-text-color: #1f2937;
  --select-placeholder-color: #9ca3af;
  --select-option-hover-background: #f3f4f6;
  --select-option-selected-background: #eff6ff;
  --select-border-radius: 0.375rem;
  --select-padding: 0.5rem 0.75rem;
}
```

## Browser Support

The versions listed below are repository compatibility targets, not browser versions certified by the current Phase 4 matrix. The completed scoped matrix uses current pinned Chromium, Firefox, and WebKit builds; see the [browser support policy](../../docs/compliance/BROWSER-SUPPORT.md) for declared targets.

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## License

MIT © [Navid Rezadoost](https://github.com/navidrezadoost)
