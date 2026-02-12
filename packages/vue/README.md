# @smilodon/vue

Production-ready, accessible select component for Vue 3 applications.

## 📖 Documentation

**For comprehensive documentation covering all features, styling options, and advanced patterns:**

👉 **[Complete Vue Guide](./COMPLETE-GUIDE.md)** 👈

The complete guide includes:
- ✅ All 60+ CSS variables for complete customization
- ✅ Vue 3-specific patterns (Composition API, v-model, computed)
- ✅ Complete API reference with TypeScript types
- ✅ Pinia store integration examples
- ✅ Custom renderers with h() function and VNodes
- ✅ Theme examples and styling techniques
- ✅ Advanced patterns (dependent selects, async onMounted)
- ✅ Troubleshooting and accessibility information

---

## Features

- New: `optionRenderer` prop mirrors the Web Component Option B API (returns an HTMLElement for full DOM control).

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

---

## 🎯 Two Ways to Specify Options

Smilodon Vue provides **two powerful approaches** for defining select options, each optimized for different use cases:

### Method 1: Data-Driven (Object Arrays) 📊

**Use when**: You have structured data and want simple, declarative option rendering.

**Advantages**:
- ✅ Simple and declarative - Vue-friendly
- ✅ Auto-conversion from strings/numbers
- ✅ Perfect for basic dropdowns
- ✅ Works seamlessly with Vue reactivity
- ✅ Extremely performant (millions of items)
- ✅ Built-in search and filtering
- ✅ Full TypeScript type safety

**Examples**:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

// Example 1: Simple object array
const value = ref('');

const items = [
  { value: '1', label: 'Apple' },
  { value: '2', label: 'Banana' },
  { value: '3', label: 'Cherry' }
];
</script>

<template>
  <Select
    :items="items"
    v-model="value"
    placeholder="Select a fruit..."
  />
</template>
```

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

// Example 2: With metadata and disabled options
const country = ref('');

const countries = [
  { value: 'us', label: 'United States', disabled: false },
  { value: 'ca', label: 'Canada', disabled: false },
  { value: 'mx', label: 'Mexico', disabled: true }
];
</script>

<template>
  <Select
    :items="countries"
    v-model="country"
    placeholder="Select a country..."
  />
</template>
```

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

// Example 3: With grouping
const food = ref('');

const foods = [
  { value: 'apple', label: 'Apple', group: 'Fruits' },
  { value: 'banana', label: 'Banana', group: 'Fruits' },
  { value: 'carrot', label: 'Carrot', group: 'Vegetables' },
  { value: 'broccoli', label: 'Broccoli', group: 'Vegetables' }
];
</script>

<template>
  <Select
    :items="foods"
    v-model="food"
    placeholder="Select food..."
  />
</template>
```

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

// Example 4: Auto-conversion from strings
const color = ref('');
const colors = ['Red', 'Green', 'Blue', 'Yellow'];
</script>

<template>
  <Select
    :items="colors"
    v-model="color"
    placeholder="Select a color..."
  />
</template>
```

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

// Example 5: Auto-conversion from numbers
const size = ref<number | string>('');
const sizes = [10, 20, 30, 40, 50];
</script>

<template>
  <Select
    :items="sizes"
    v-model="size"
    placeholder="Select size..."
  />
</template>
```

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import { Select } from '@smilodon/vue';

// Example 6: Large datasets with computed
const id = ref('');

const items = computed(() =>
  Array.from({ length: 100_000 }, (_, i) => ({
    value: i.toString(),
    label: `Item ${i + 1}`
  }))
);
</script>

<template>
  <Select
    :items="items"
    v-model="id"
    virtualized
    placeholder="Select from 100K items..."
  />
</template>
```

### Method 2: Component-Driven (Custom Renderers) 🎨

**Use when**: You need rich, interactive option content with custom rendering.

**Advantages**:
- ✅ Full control over option rendering
- ✅ Use Vue's render function (h())
- ✅ Rich content (images, icons, badges, multi-line text)
- ✅ Custom styling with scoped CSS
- ✅ Reactive data binding
- ✅ Conditional rendering based on item data
- ✅ Access to Vue's composition API
- ✅ Perfect for complex UIs (user cards, product listings, etc.)

**How it works**: Provide a `customRenderer` function that uses Vue's `h()` function to return a VNode.

**Examples**:

```vue
<script setup lang="ts">
import { ref, h } from 'vue';
import { Select, SelectItem } from '@smilodon/vue';

// Example 1: Simple custom template with icons
interface Language extends SelectItem {
  icon: string;
  description: string;
}

const lang = ref('');

const languages: Language[] = [
  { value: 'js', label: 'JavaScript', icon: '🟨', description: 'Dynamic scripting language' },
  { value: 'py', label: 'Python', icon: '🐍', description: 'General-purpose programming' },
  { value: 'rs', label: 'Rust', icon: '🦀', description: 'Systems programming language' }
];

const languageRenderer = (item: Language, index: number) => {
  return h('div', { style: 'display: flex; align-items: center; gap: 12px;' }, [
    h('span', { style: 'font-size: 24px;' }, item.icon),
    h('div', [
      h('div', { style: 'font-weight: 600;' }, item.label),
      h('div', { style: 'font-size: 12px; color: #6b7280;' }, item.description)
    ])
  ]);
};
</script>

<template>
  <Select
    :items="languages"
    v-model="lang"
    :custom-renderer="languageRenderer"
    placeholder="Select a language..."
  />
</template>
```

```vue
<script setup lang="ts">
import { ref, h } from 'vue';
import { Select, SelectItem } from '@smilodon/vue';

// Example 2: User selection with avatars
interface User extends SelectItem {
  email: string;
  avatar: string;
  role: 'Admin' | 'User' | 'Moderator';
}

const userId = ref('');

const users: User[] = [
  {
    value: '1',
    label: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://i.pravatar.cc/150?img=1',
    role: 'Admin'
  },
  {
    value: '2',
    label: 'Jane Smith',
    email: 'jane@example.com',
    avatar: 'https://i.pravatar.cc/150?img=2',
    role: 'User'
  },
  {
    value: '3',
    label: 'Bob Johnson',
    email: 'bob@example.com',
    avatar: 'https://i.pravatar.cc/150?img=3',
    role: 'Moderator'
  }
];

const userRenderer = (item: User) => {
  return h('div', { style: 'display: flex; align-items: center; gap: 12px; padding: 4px 0;' }, [
    h('img', {
      src: item.avatar,
      alt: item.label,
      style: 'width: 40px; height: 40px; border-radius: 50%; object-fit: cover;'
    }),
    h('div', { style: 'flex: 1;' }, [
      h('div', { style: 'font-weight: 600; color: #1f2937;' }, item.label),
      h('div', { style: 'font-size: 13px; color: #6b7280;' }, item.email)
    ]),
    h('span', {
      style: `
        padding: 4px 8px;
        background: ${item.role === 'Admin' ? '#dbeafe' : '#f3f4f6'};
        color: ${item.role === 'Admin' ? '#1e40af' : '#374151'};
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
      `
    }, item.role)
  ]);
};
</script>

<template>
  <Select
    :items="users"
    v-model="userId"
    :custom-renderer="userRenderer"
    placeholder="Select a user..."
  />
</template>
```

```vue
<script setup lang="ts">
import { ref, h } from 'vue';
import { Select, SelectItem } from '@smilodon/vue';

// Example 3: Product selection with images and pricing
interface Product extends SelectItem {
  price: number;
  stock: number;
  image: string;
  badge?: string;
}

const productId = ref('');

const products: Product[] = [
  {
    value: 'p1',
    label: 'Premium Laptop',
    price: 1299.99,
    stock: 15,
    image: 'https://via.placeholder.com/60',
    badge: 'Best Seller'
  },
  {
    value: 'p2',
    label: 'Wireless Mouse',
    price: 29.99,
    stock: 150,
    image: 'https://via.placeholder.com/60'
  },
  {
    value: 'p3',
    label: 'Mechanical Keyboard',
    price: 89.99,
    stock: 0,
    image: 'https://via.placeholder.com/60',
    badge: 'Out of Stock'
  }
];

const productRenderer = (item: Product) => {
  return h('div', {
    style: `display: flex; align-items: center; gap: 12px; opacity: ${item.stock === 0 ? '0.5' : '1'};`
  }, [
    h('img', {
      src: item.image,
      alt: item.label,
      style: 'width: 60px; height: 60px; border-radius: 8px; object-fit: cover; border: 1px solid #e5e7eb;'
    }),
    h('div', { style: 'flex: 1;' }, [
      h('div', { style: 'display: flex; align-items: center; gap: 8px;' }, [
        h('span', { style: 'font-weight: 600; color: #1f2937;' }, item.label),
        item.badge && h('span', {
          style: `
            padding: 2px 6px;
            background: ${item.badge === 'Best Seller' ? '#dcfce7' : '#fee2e2'};
            color: ${item.badge === 'Best Seller' ? '#166534' : '#991b1b'};
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
          `
        }, item.badge)
      ]),
      h('div', {
        style: 'margin-top: 4px; display: flex; justify-content: space-between; align-items: center;'
      }, [
        h('span', { style: 'font-size: 16px; font-weight: 700; color: #059669;' }, `$${item.price.toFixed(2)}`),
        h('span', { style: 'font-size: 12px; color: #6b7280;' },
          item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'
        )
      ])
    ])
  ]);
};
</script>

<template>
  <Select
    :items="products"
    v-model="productId"
    :custom-renderer="productRenderer"
    placeholder="Select a product..."
  />
</template>
```

```vue
<script setup lang="ts">
import { ref, h } from 'vue';
import { Select, SelectItem } from '@smilodon/vue';

// Example 4: Status indicators with conditional styling
interface Task extends SelectItem {
  status: 'completed' | 'in-progress' | 'pending';
  priority: 'high' | 'medium' | 'low';
  assignee: string;
}

const taskId = ref('');

const tasks: Task[] = [
  { value: 't1', label: 'Design Homepage', status: 'completed', priority: 'high', assignee: 'John' },
  { value: 't2', label: 'API Integration', status: 'in-progress', priority: 'high', assignee: 'Jane' },
  { value: 't3', label: 'Write Documentation', status: 'pending', priority: 'medium', assignee: 'Bob' },
  { value: 't4', label: 'Bug Fixes', status: 'in-progress', priority: 'low', assignee: 'Alice' }
];

const statusConfig = {
  'completed': { bg: '#dcfce7', color: '#166534', icon: '✓' },
  'in-progress': { bg: '#dbeafe', color: '#1e40af', icon: '⟳' },
  'pending': { bg: '#fef3c7', color: '#92400e', icon: '○' }
};

const priorityColors = {
  'high': '#ef4444',
  'medium': '#f59e0b',
  'low': '#10b981'
};

const taskRenderer = (item: Task) => {
  const status = statusConfig[item.status];
  return h('div', { style: 'display: flex; align-items: center; gap: 10px; padding: 4px 0;' }, [
    h('div', {
      style: `
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: ${status.bg};
        color: ${status.color};
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
      `
    }, status.icon),
    h('div', { style: 'flex: 1;' }, [
      h('div', { style: 'font-weight: 600; color: #1f2937;' }, item.label),
      h('div', { style: 'font-size: 12px; color: #6b7280; margin-top: 2px;' }, `Assigned to ${item.assignee}`)
    ]),
    h('div', {
      style: `
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: ${priorityColors[item.priority]};
      `,
      title: `${item.priority} priority`
    })
  ]);
};
</script>

<template>
  <Select
    :items="tasks"
    v-model="taskId"
    :custom-renderer="taskRenderer"
    placeholder="Select a task..."
  />
</template>
```

```vue
<script setup lang="ts">
import { ref, h } from 'vue';
import { Select, SelectItem } from '@smilodon/vue';

// Example 5: Using HTML string (simpler alternative)
interface Tag extends SelectItem {
  color: string;
  count: number;
}

const tag = ref('');

const tags: Tag[] = [
  { value: 'react', label: 'React', color: 'blue', count: 1250 },
  { value: 'vue', label: 'Vue', color: 'green', count: 850 },
  { value: 'angular', label: 'Angular', color: 'red', count: 420 }
];

// Using HTML string renderer (returned from custom prop)
const tagRenderer = (item: Tag) => {
  return `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="width: 12px; height: 12px; border-radius: 50%; background: ${item.color};"></span>
        <span style="font-weight: 600; color: #1f2937;">${item.label}</span>
      </div>
      <span style="font-size: 14px; color: #6b7280;">${item.count} posts</span>
    </div>
  `;
};
</script>

<template>
  <Select
    :items="tags"
    v-model="tag"
    :option-template="tagRenderer"
    placeholder="Select a tag..."
  />
</template>
```

### Comparison: When to Use Each Method

| Feature | Method 1: Object Arrays | Method 2: Custom Renderers |
|---------|------------------------|---------------------------|
| **Setup Complexity** | ⭐ Simple | ⭐⭐ Moderate |
| **Rendering Speed** | ⭐⭐⭐ Fastest | ⭐⭐ Fast |
| **Visual Customization** | ⭐⭐ Limited | ⭐⭐⭐ Unlimited |
| **Vue Integration** | ⭐⭐⭐ Seamless | ⭐⭐⭐ Seamless |
| **Reactivity** | ⭐⭐⭐ Full | ⭐⭐⭐ Full |
| **TypeScript Support** | ⭐⭐⭐ Full | ⭐⭐⭐ Full |
| **Performance (1M items)** | ⭐⭐⭐ Excellent | ⭐⭐ Good |
| **Learning Curve** | ⭐ Easy | ⭐⭐ Medium |

**Best Practices**:

✅ **Use Method 1 (Object Arrays) when**:
- You need simple text-based options
- Performance is critical (millions of items)
- You want minimal code
- Built-in search/filter is sufficient
- Working with external APIs returning plain data

✅ **Use Method 2 (Custom Renderers) when**:
- You need images, icons, or badges
- Options require multiple lines of text
- Custom styling/layout is important
- Conditional rendering based on data
- Rich user experience is priority
- Need reactive computed properties in rendering

### Combining Both Methods

You can start with Method 1 and add Method 2 later as your UI evolves:

```vue
<script setup lang="ts">
import { ref, h } from 'vue';
import { Select } from '@smilodon/vue';

const value = ref('');

// Start simple
const items = ['Option 1', 'Option 2', 'Option 3'];

// Later, add custom rendering without changing items
const customRenderer = (item: any, index: number) => {
  return h('div', {
    style: `padding: 8px; background: ${index % 2 ? '#f9fafb' : 'white'};`
  }, [
    h('strong', item.label || item)
  ]);
};
</script>

<template>
  <Select
    :items="items"
    v-model="value"
    :custom-renderer="customRenderer"
  />
</template>
```

### Performance Tips

**For Method 1**:
- Use `computed` to memoize large item arrays
- Enable `virtualized` prop for 1000+ items
- Enable `infiniteScroll` for dynamic loading

**For Method 2**:
- Keep renderer function pure (no side effects)
- Use `computed` for derived data
- Avoid heavy computations in renderer
- Cache renderer functions when possible

```vue
<script setup lang="ts">
import { ref, computed, h } from 'vue';
import { Select } from '@smilodon/vue';

const value = ref('');

// Memoize items with computed
const items = computed(() =>
  Array.from({ length: 10000 }, (_, i) => ({
    value: i.toString(),
    label: `Item ${i + 1}`,
    description: `Description for item ${i + 1}`
  }))
);

// Pure renderer function
const renderer = (item: any, index: number) => {
  return h('div', [
    h('div', { style: 'font-weight: 600;' }, item.label),
    h('div', { style: 'font-size: 12px; color: #666;' }, item.description)
  ]);
};
</script>

<template>
  <Select
    :items="items"
    v-model="value"
    :custom-renderer="renderer"
    virtualized
    :estimated-item-height="60"
  />
</template>
```

---

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
