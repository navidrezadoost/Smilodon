# @smilodon/vue

Production-ready, accessible select component for Vue 3 applications.

## Features

- ✨ **Single & Multi-Select** - Flexible selection modes
- 🔍 **Searchable** - Built-in search with client or server-side filtering
- ♿ **Fully Accessible** - WCAG 2.1 AAA compliant with complete keyboard navigation
- 🚀 **Virtual Scrolling** - Handle thousands of items efficiently
- ∞ **Infinite Scroll** - Load more items on demand
- 📦 **Grouped Options** - Organize items with group headers
- 🎨 **Themeable** - Multiple built-in themes or custom styles
- 💪 **TypeScript** - Full type safety and intellisense
- 🪶 **Lightweight** - Only 2.0KB gzipped
- 🎯 **Vue 3 Composition API** - Modern Vue patterns with v-model support

## Installation

```bash
npm install @smilodon/vue @smilodon/core
```

## Quick Start

```vue
<script setup>
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

const selectedValue = ref('');
const items = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];
</script>

<template>
  <Select
    :items="items"
    v-model="selectedValue"
    placeholder="Select a fruit..."
    searchable
  />
</template>
```

## Examples

### Basic Single Select

```vue
<script setup>
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

const value = ref('');
const items = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
];
</script>

<template>
  <div>
    <Select
      :items="items"
      v-model="value"
      placeholder="Choose an option..."
    />
    <p>Selected: {{ value }}</p>
  </div>
</template>
```

### Multi-Select

```vue
<script setup>
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

const selectedValues = ref([]);
const colors = [
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
  { value: 'yellow', label: 'Yellow' },
];
</script>

<template>
  <Select
    :items="colors"
    v-model="selectedValues"
    placeholder="Select colors..."
    multiple
    searchable
  />
</template>
```

### Searchable with Server-Side Filtering

```vue
<script setup>
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

const value = ref('');
const items = ref([]);
const isLoading = ref(false);

async function handleSearch(query) {
  if (!query) {
    items.value = [];
    return;
  }
  
  isLoading.value = true;
  try {
    const response = await fetch(`/api/search?q=${query}`);
    const data = await response.json();
    items.value = data.results;
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <Select
    :items="items"
    v-model="value"
    searchable
    placeholder="Search..."
    @search="handleSearch"
  />
</template>
```

### Grouped Options

```vue
<script setup>
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

const value = ref('');
const groupedItems = [
  {
    groupLabel: 'Fruits',
    items: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
    ]
  },
  {
    groupLabel: 'Vegetables',
    items: [
      { value: 'carrot', label: 'Carrot' },
      { value: 'potato', label: 'Potato' },
    ]
  }
];
</script>

<template>
  <Select
    :groupedItems="groupedItems"
    v-model="value"
    searchable
  />
</template>
```

### Infinite Scroll

```vue
<script setup>
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

const value = ref('');
const items = ref([]);
const currentPage = ref(1);

async function loadMore(page) {
  const response = await fetch(`/api/items?page=${page}`);
  const newItems = await response.json();
  items.value = [...items.value, ...newItems];
  currentPage.value = page;
}

// Load initial page
onMounted(() => loadMore(1));
</script>

<template>
  <Select
    :items="items"
    v-model="value"
    infiniteScroll
    :pageSize="50"
    @loadMore="loadMore"
  />
</template>
```

### Form Validation

```vue
<script setup>
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

const value = ref('');
const error = ref(false);
const items = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

function handleSubmit() {
  if (!value.value) {
    error.value = true;
    return;
  }
  error.value = false;
  // Submit form...
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <Select
      :items="items"
      v-model="value"
      placeholder="Select size..."
      required
      :error="error"
    />
    <p v-if="error" class="error">Please select a size</p>
    <button type="submit">Submit</button>
  </form>
</template>
```

### Using Template Ref

```vue
<script setup>
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

const selectRef = ref(null);
const value = ref('');
const items = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
];

function openSelect() {
  selectRef.value?.open();
}

function clearSelection() {
  selectRef.value?.clear();
}
</script>

<template>
  <div>
    <Select
      ref="selectRef"
      :items="items"
      v-model="value"
    />
    <button @click="openSelect">Open</button>
    <button @click="clearSelection">Clear</button>
  </div>
</template>
```

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `SelectItem[]` | `[]` | Array of items to display |
| `groupedItems` | `GroupedItem[]` | - | Grouped items (alternative to items) |
| `modelValue` | `string \| number \| (string \| number)[]` | - | Selected value(s) for v-model |
| `defaultValue` | `string \| number \| (string \| number)[]` | - | Default value for uncontrolled mode |
| `multiple` | `boolean` | `false` | Enable multi-select mode |
| `searchable` | `boolean` | `false` | Enable search functionality |
| `placeholder` | `string` | - | Placeholder text |
| `disabled` | `boolean` | `false` | Disable the select |
| `required` | `boolean` | `false` | Mark as required |
| `error` | `boolean` | `false` | Show error state |
| `infiniteScroll` | `boolean` | `false` | Enable infinite scroll |
| `pageSize` | `number` | `50` | Items per page (for infinite scroll) |
| `virtualized` | `boolean` | `true` | Enable virtual scrolling |
| `maxSelections` | `number` | - | Maximum selections (for multi-select) |
| `placement` | `'bottom' \| 'top' \| 'auto'` | `'auto'` | Dropdown placement |
| `className` | `string` | - | Custom CSS class |
| `style` | `object` | - | Custom inline styles |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `value: string \| number \| (string \| number)[]` | Emitted when selection changes (v-model) |
| `change` | `value, selectedItems: SelectItem[]` | Emitted with full selection details |
| `select` | `item: SelectItem, index: number` | Emitted when an item is selected |
| `open` | - | Emitted when dropdown opens |
| `close` | - | Emitted when dropdown closes |
| `search` | `query: string` | Emitted when search query changes |
| `loadMore` | `page: number` | Emitted when more items requested |
| `create` | `value: string` | Emitted when user creates new item |

### Exposed Methods (Template Ref)

| Method | Description |
|--------|-------------|
| `open()` | Open the dropdown |
| `close()` | Close the dropdown |
| `focus()` | Focus the select |
| `setItems(items)` | Set items programmatically |
| `setGroupedItems(groups)` | Set grouped items programmatically |
| `clear()` | Clear selection |

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
  groupLabel: string;
  items: SelectItem[];
}
```

## Styling

The component uses web components from `@smilodon/core` and comes with built-in themes.

### Built-in Themes

- Apple/macOS style
- Windows style
- Material Design
- Default

### Custom Styling

```vue
<template>
  <Select
    :items="items"
    v-model="value"
    className="my-custom-select"
    :style="{ '--border-radius': '8px' }"
  />
</template>

<style>
.my-custom-select {
  --primary-color: #007bff;
  --border-color: #ced4da;
  --focus-color: #80bdff;
}
</style>
```

## Accessibility

- ✅ Full keyboard navigation (Arrow keys, Enter, Escape, Tab)
- ✅ Screen reader support with ARIA labels
- ✅ Focus management and trap
- ✅ High contrast mode support
- ✅ WCAG 2.1 AAA compliant

## Performance

- Virtual scrolling handles 100,000+ items smoothly
- Efficient DOM updates with Vue's reactivity
- Lazy loading with infinite scroll
- Optimized re-renders with computed values

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## License

MIT

## Contributing

See the main [repository](https://github.com/yourusername/smilodon) for contribution guidelines.
