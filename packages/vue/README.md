# @smilodon/vue

Production-ready, accessible select component for Vue 3 applications.

## Features

- ✅ **Vue 3 Native** - Built for Vue 3 with Composition API and `<script setup>` support
- ✅ **v-model Support** - Two-way binding that feels natural in Vue
- ✅ **Fully Typed** - Complete TypeScript support with detailed type definitions
- ✅ **Single & Multi-select** - One prop to switch modes
- ✅ **Searchable** - Built-in filtering with customizable behavior
- ✅ **Infinite Scroll** - Handle massive datasets efficiently
- ✅ **Virtual Scrolling** - Render only visible items for performance
- ✅ **Grouped Options** - Organize items into categories
- ✅ **Accessible** - WCAG 2.1 AAA compliant, full keyboard navigation
- ✅ **Flexible Input** - Accepts SelectItem objects, string arrays, or number arrays
- ✅ **Customizable** - Custom renderers, styles, and behaviors
- ✅ **Tiny Bundle** - Optimized for production

## Installation

```bash
npm install @smilodon/vue @smilodon/core
```

or

```bash
yarn add @smilodon/vue @smilodon/core
```

or

```bash
pnpm add @smilodon/vue @smilodon/core
```

## Quick Start

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';
import type { SelectItem } from '@smilodon/core';

const selectedValue = ref<string | number>('');

const items: SelectItem[] = [
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
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';
import type { SelectItem } from '@smilodon/core';

const selectedValue = ref<string | number>('');

const items: SelectItem[] = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
];
</script>

<template>
  <Select
    :items="items"
    v-model="selectedValue"
    placeholder="Choose an option"
  />
  
  <div v-if="selectedValue">
    Selected: {{ selectedValue }}
  </div>
</template>
```

### String Array Input (Auto-converted)

The Select component accepts string arrays and automatically converts them to the SelectItem format:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

const selectedFruits = ref<Array<string | number>>([]);

const fruits = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig', 'Grape', 'Honeydew'];
</script>

<template>
  <Select
    :items="fruits"
    v-model="selectedFruits"
    placeholder="Select fruits..."
    searchable
    multiple
  />
  
  <div v-if="selectedFruits.length">
    Selected: {{ selectedFruits.join(', ') }}
  </div>
</template>
```

**Note:** String arrays are automatically converted to `SelectItem` objects where both `value` and `label` equal the string:
- `"Apple"` becomes `{ value: "Apple", label: "Apple" }`

### Number Array Input (Auto-converted)

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

const selectedNumber = ref<string | number>(0);

const fibonacciNumbers = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55];
</script>

<template>
  <Select
    :items="fibonacciNumbers"
    v-model="selectedNumber"
    placeholder="Select a Fibonacci number"
  />
  
  <div v-if="selectedNumber">
    Selected: {{ selectedNumber }}
  </div>
</template>
```

**Note:** Number arrays are automatically converted to `SelectItem` objects:
- `42` becomes `{ value: 42, label: "42" }`

## Complete Examples

## Complete Examples

### Multi-Select with Groups

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';
import type { SelectItem } from '@smilodon/core';

const selectedValues = ref<Array<string | number>>([]);

const groupedItems: SelectItem[] = [
  { value: 'apple', label: 'Apple', group: 'Fruits' },
  { value: 'banana', label: 'Banana', group: 'Fruits' },
  { value: 'carrot', label: 'Carrot', group: 'Vegetables' },
  { value: 'broccoli', label: 'Broccoli', group: 'Vegetables' },
];
</script>

<template>
  <Select
    :items="groupedItems"
    v-model="selectedValues"
    placeholder="Select items..."
    searchable
    multiple
  />
  
  <div v-if="selectedValues.length">
    Selected ({{ selectedValues.length }}): {{ selectedValues.join(', ') }}
  </div>
</template>
```

### Searchable Multi-Select (50 items)

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';
import type { SelectItem } from '@smilodon/core';

const selectedValues = ref<Array<string | number>>([]);

// Generate 50 items
const items: SelectItem[] = Array.from({ length: 50 }, (_, i) => ({
  value: `item-${i + 1}`,
  label: `Item ${i + 1}`,
}));
</script>

<template>
  <Select
    :items="items"
    v-model="selectedValues"
    placeholder="Search and select..."
    searchable
    multiple
  />
  
  <div v-if="selectedValues.length">
    Selected: {{ selectedValues.length }} items
  </div>
</template>
```

### Large Dataset with Virtual Scrolling (1000 items)

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';
import type { SelectItem } from '@smilodon/core';

const selectedValue = ref<string | number>('');

// Generate 1000 items
const largeDataset: SelectItem[] = Array.from({ length: 1000 }, (_, i) => ({
  value: `item-${i + 1}`,
  label: `Item ${i + 1} - Large Dataset`,
}));
</script>

<template>
  <Select
    :items="largeDataset"
    v-model="selectedValue"
    placeholder="Select from 1000 items..."
    searchable
    :virtualScroll="true"
  />
  
  <div v-if="selectedValue">
    Selected: {{ selectedValue }}
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
