# @smilodon/svelte

Production-ready, accessible select component for Svelte applications. Part of the [Smilodon](https://github.com/navidrezadoost/smilodon) UI toolkit.

## Features

- ✨ **Single & Multi-Select** - Choose one or multiple options
- 🔍 **Searchable** - Filter options with built-in or custom search
- ♿ **Fully Accessible** - WCAG 2.1 AAA compliant
- ⚡ **Virtual Scrolling** - Handle 100k+ options smoothly
- 📜 **Infinite Scroll** - Load data progressively
- 👥 **Grouped Options** - Organize options into categories
- 🎨 **Customizable** - Style with CSS variables or custom themes
- 📦 **Tiny Bundle** - ~2KB gzipped
- 🔧 **TypeScript** - Full type safety included

## Installation

```bash
npm install @smilodon/svelte @smilodon/core
```

## Quick Start

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  const items = [
    { value: '1', label: 'Apple' },
    { value: '2', label: 'Banana' },
    { value: '3', label: 'Cherry' },
  ];

  let selectedValue;
</script>

<Select {items} bind:value={selectedValue} placeholder="Select a fruit..." />
```

## Examples

### Searchable Select

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  const items = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'mx', label: 'Mexico' },
  ];

  let country;
</script>

<Select
  {items}
  bind:value={country}
  searchable
  placeholder="Search countries..."
/>
```

### Multi-Select

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  const items = [
    { value: 'js', label: 'JavaScript' },
    { value: 'ts', label: 'TypeScript' },
    { value: 'py', label: 'Python' },
  ];

  let languages = [];
</script>

<Select
  {items}
  bind:value={languages}
  multiple
  placeholder="Select languages..."
/>
```

### Grouped Options

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  const groupedItems = [
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
  ];

  let food;
</script>

<Select {groupedItems} bind:value={food} />
```

### Infinite Scroll

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  let items = generateItems(1, 50);
  let page = 1;

  function handleLoadMore() {
    page++;
    const newItems = generateItems(page * 50 + 1, (page + 1) * 50);
    items = [...items, ...newItems];
  }

  function generateItems(start, end) {
    return Array.from({ length: end - start + 1 }, (_, i) => ({
      value: start + i,
      label: `Item ${start + i}`,
    }));
  }
</script>

<Select
  {items}
  infiniteScroll
  pageSize={50}
  on:loadMore={handleLoadMore}
  placeholder="Scroll to load more..."
/>
```

### Virtual Scrolling (Large Datasets)

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  // Generate 100,000 items
  const items = Array.from({ length: 100000 }, (_, i) => ({
    value: i + 1,
    label: `Item ${i + 1}`,
  }));
</script>

<Select
  {items}
  virtualized
  searchable
  placeholder="100k items with virtual scrolling..."
/>
```

### Server-Side Search

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  let items = [];
  let isLoading = false;

  async function handleSearch(event) {
    const query = event.detail.query;
    
    if (!query) {
      items = [];
      return;
    }

    isLoading = true;
    const response = await fetch(`/api/search?q=${query}`);
    const data = await response.json();
    items = data.results;
    isLoading = false;
  }
</script>

<Select
  {items}
  searchable
  on:search={handleSearch}
  placeholder="Type to search..."
/>
```

### Controlled Component

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  const items = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
  ];

  let status = 'draft';

  function handleChange(event) {
    console.log('Status changed:', event.detail.value);
    status = event.detail.value;
  }
</script>

<Select
  {items}
  value={status}
  on:change={handleChange}
/>

<button on:click={() => status = 'published'}>
  Publish
</button>
```

### Imperative API

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  let selectRef;
  const items = [...];

  function programmaticOpen() {
    selectRef.open();
  }

  function programmaticClear() {
    selectRef.clear();
  }
</script>

<Select bind:this={selectRef} {items} />

<button on:click={programmaticOpen}>Open Select</button>
<button on:click={programmaticClear}>Clear Selection</button>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `SelectItem[]` | `[]` | Array of selectable items |
| `groupedItems` | `GroupedItem[]` | `undefined` | Grouped items array |
| `value` | `string \| number \| Array` | `undefined` | Controlled value |
| `defaultValue` | `string \| number \| Array` | `undefined` | Initial value (uncontrolled) |
| `multiple` | `boolean` | `false` | Enable multi-select |
| `searchable` | `boolean` | `false` | Enable search/filter |
| `placeholder` | `string` | `''` | Placeholder text |
| `disabled` | `boolean` | `false` | Disable the select |
| `required` | `boolean` | `false` | Mark as required |
| `error` | `boolean` | `false` | Show error state |
| `infiniteScroll` | `boolean` | `false` | Enable infinite scroll |
| `pageSize` | `number` | `50` | Items per page (infinite scroll) |
| `virtualized` | `boolean` | `true` | Enable virtual scrolling |
| `maxSelections` | `number` | `undefined` | Max selections (multi-select) |
| `placement` | `'bottom' \| 'top' \| 'auto'` | `'auto'` | Dropdown placement |
| `className` | `string` | `''` | Custom CSS class |
| `style` | `string` | `''` | Custom inline styles |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `change` | `{ value, selectedItems }` | Value changed |
| `select` | `{ item, index }` | Item selected |
| `open` | `void` | Dropdown opened |
| `close` | `void` | Dropdown closed |
| `search` | `{ query }` | Search query changed |
| `loadMore` | `{ page }` | Load more requested |
| `create` | `{ value }` | New item creation |

## Methods

Access these methods using `bind:this`:

| Method | Signature | Description |
|--------|-----------|-------------|
| `open()` | `() => void` | Open the dropdown |
| `close()` | `() => void` | Close the dropdown |
| `focus()` | `() => void` | Focus the select |
| `clear()` | `() => void` | Clear selection |
| `setItems()` | `(items: SelectItem[]) => void` | Update items |
| `setGroupedItems()` | `(groups: GroupedItem[]) => void` | Update grouped items |

## Types

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

The component uses CSS variables for easy customization:

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

## Accessibility

This component is fully accessible and compliant with WCAG 2.1 AAA standards:

- ✅ Keyboard navigation (Arrow keys, Enter, Escape, Tab)
- ✅ Screen reader support (ARIA labels and live regions)
- ✅ Focus management
- ✅ High contrast mode support
- ✅ Reduced motion support

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## License

MIT © [Navid Rezadoost](https://github.com/navidrezadoost)

## Contributing

Contributions are welcome! Please see the [main repository](https://github.com/navidrezadoost/smilodon) for guidelines.
