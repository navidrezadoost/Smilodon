# @smilodon/vanilla

Vanilla JavaScript/TypeScript helpers for Smilodon Select. Part of the [Smilodon](https://github.com/navidrezadoost/smilodon) UI toolkit.

## Features

- ✨ **Simple API** - Easy-to-use helper functions for vanilla JS
- 🔍 **Zero Dependencies** - Only requires @smilodon/core
- ♿ **Fully Accessible** - WCAG 2.1 AAA compliant
- ⚡ **Tiny Bundle** - < 1KB gzipped
- 🔧 **TypeScript** - Full type safety included
- 📦 **Tree-Shakeable** - Import only what you need
- 🎯 **Web Standards** - Built on native Web Components

## Installation

```bash
npm install @smilodon/vanilla @smilodon/core
```

## Quick Start

### Using the Helper Function

```typescript
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

### Using the Web Component Directly

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import '@smilodon/core';
    import { initSelect } from '@smilodon/vanilla';

    const select = document.querySelector('enhanced-select');
    
    initSelect(select, {
      items: [
        { value: 'js', label: 'JavaScript' },
        { value: 'ts', label: 'TypeScript' },
        { value: 'py', label: 'Python' },
      ],
      value: 'js'
    });
  </script>
</head>
<body>
  <enhanced-select placeholder="Select a language..."></enhanced-select>
</body>
</html>
```

## Examples

### Searchable Select

```typescript
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

document.getElementById('app').appendChild(select);
```

### Multi-Select

```typescript
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

document.getElementById('app').appendChild(select);
```

### Grouped Options

```typescript
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

document.getElementById('app').appendChild(select);
```

### Infinite Scroll

```typescript
import { createSelect, setItems } from '@smilodon/vanilla';

let items = generateItems(1, 50);
let page = 1;

const select = createSelect({
  items,
  infiniteScroll: true,
  pageSize: 50,
  placeholder: 'Scroll to load more...',
  onLoadMore: (pageNum) => {
    page++;
    const newItems = generateItems(page * 50 + 1, (page + 1) * 50);
    items = [...items, ...newItems];
    setItems(select, items);
  }
});

function generateItems(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => ({
    value: start + i,
    label: `Item ${start + i}`,
  }));
}

document.getElementById('app').appendChild(select);
```

### Virtual Scrolling (Large Datasets)

```typescript
import { createSelect } from '@smilodon/vanilla';

// Generate 100,000 items
const items = Array.from({ length: 100000 }, (_, i) => ({
  value: i + 1,
  label: `Item ${i + 1}`,
}));

const select = createSelect({
  items,
  virtualized: true,
  searchable: true,
  placeholder: '100k items with virtual scrolling...'
});

document.getElementById('app').appendChild(select);
```

### Server-Side Search

```typescript
import { createSelect, setItems } from '@smilodon/vanilla';

const select = createSelect({
  searchable: true,
  placeholder: 'Type to search...',
  onSearch: async (query) => {
    if (!query) {
      setItems(select, []);
      return;
    }

    const response = await fetch(`/api/search?q=${query}`);
    const data = await response.json();
    setItems(select, data.results);
  }
});

document.getElementById('app').appendChild(select);
```

### Programmatic Control

```typescript
import { createSelect, getValue, setValue, clear, open, close } from '@smilodon/vanilla';

const select = createSelect({
  items: [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
  ]
});

// Add to DOM
document.getElementById('app').appendChild(select);

// Programmatic API
document.getElementById('btn-open').addEventListener('click', () => {
  open(select);
});

document.getElementById('btn-close').addEventListener('click', () => {
  close(select);
});

document.getElementById('btn-set').addEventListener('click', () => {
  setValue(select, 'published');
});

document.getElementById('btn-get').addEventListener('click', () => {
  console.log('Current value:', getValue(select));
});

document.getElementById('btn-clear').addEventListener('click', () => {
  clear(select);
});
```

### With Event Listeners

```typescript
import { createSelect } from '@smilodon/vanilla';

const select = createSelect({
  items: [...],
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

document.getElementById('app').appendChild(select);
```

### Custom Styling

```typescript
import { createSelect } from '@smilodon/vanilla';

const select = createSelect({
  items: [...],
  className: 'my-custom-select',
  style: {
    width: '300px',
    marginTop: '20px',
  }
});

document.getElementById('app').appendChild(select);
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
| `virtualized` | `boolean` | `true` | Enable virtual scrolling |
| `maxSelections` | `number` | `undefined` | Max selections |
| `placement` | `'bottom' \| 'top' \| 'auto'` | `'auto'` | Dropdown placement |
| `className` | `string` | `''` | Custom CSS class |
| `style` | `CSSStyleDeclaration` | `{}` | Inline styles |
| `onChange` | `(value, items) => void` | `undefined` | Change callback |
| `onSelect` | `(item, index) => void` | `undefined` | Select callback |
| `onOpen` | `() => void` | `undefined` | Open callback |
| `onClose` | `() => void` | `undefined` | Close callback |
| `onSearch` | `(query) => void` | `undefined` | Search callback |
| `onLoadMore` | `(page) => void` | `undefined` | Load more callback |
| `onCreate` | `(value) => void` | `undefined` | Create callback |

**Returns:** `HTMLElement`

### `initSelect(element, options)`

Initialize an existing select element in the DOM.

**Parameters:**
- `element: HTMLElement` - The select element
- `options: { items?, groupedItems?, value? }` - Initialization options

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

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## License

MIT © [Navid Rezadoost](https://github.com/navidrezadoost)
