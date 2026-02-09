# @smilodon/vue - Complete Guide

**Production-ready, accessible Select component for Vue 3 applications**

This guide provides comprehensive documentation for using Smilodon Select in Vue 3 applications, covering all features, styling options, and advanced use cases.

---

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [Basic Usage](#basic-usage)
3. [Complete Props Reference](#complete-props-reference)
4. [Input Formats](#input-formats)
5. [Single Selection](#single-selection)
6. [Multi-Selection](#multi-selection)
7. [Searchable Select](#searchable-select)
8. [Grouped Options](#grouped-options)
9. [Disabled States](#disabled-states)
10. [Event Handling](#event-handling)
11. [Styling & Theming](#styling--theming)
12. [Custom Renderers](#custom-renderers)
13. [Performance Optimization](#performance-optimization)
14. [TypeScript Integration](#typescript-integration)
15. [Composition API](#composition-api)
16. [Accessibility](#accessibility)
17. [Advanced Patterns](#advanced-patterns)
18. [Troubleshooting](#troubleshooting)

---

## Installation & Setup

### Installation

```bash
npm install @smilodon/vue @smilodon/core
```

or with yarn:

```bash
yarn add @smilodon/vue @smilodon/core
```

or with pnpm:

```bash
pnpm add @smilodon/vue @smilodon/core
```

### Vue Configuration

If you see warnings about `enhanced-select` not being recognized, add this to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'enhanced-select'
        }
      }
    })
  ]
});
```

### Basic Import

```vue
<script setup lang="ts">
import { Select } from '@smilodon/vue';
import type { SelectItem } from '@smilodon/core';
</script>
```

---

## Basic Usage

### Minimal Example (Composition API)

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

const selectedValue = ref<string | number>('');
const items = ['Apple', 'Banana', 'Cherry'];
</script>

<template>
  <Select
    :items="items"
    v-model="selectedValue"
    placeholder="Select a fruit..."
  />
</template>
```

### With Options API

```vue
<script lang="ts">
import { defineComponent } from 'vue';
import { Select } from '@smilodon/vue';
import type { SelectItem } from '@smilodon/core';

export default defineComponent({
  components: { Select },
  data() {
    return {
      selectedValue: '',
      items: [
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
        { value: 'cherry', label: 'Cherry' },
      ] as SelectItem[]
    };
  }
});
</script>

<template>
  <Select
    :items="items"
    v-model="selectedValue"
    placeholder="Select a fruit..."
  />
</template>
```

---

## Complete Props Reference

### All Available Props

```typescript
interface SelectProps {
  // Required
  items: SelectItem[] | string[] | number[];
  
  // v-model binding
  modelValue?: string | number | (string | number)[];
  
  // Behavior
  multiple?: boolean;
  searchable?: boolean;
  disabled?: boolean;
  placeholder?: string;
  
  // Display
  maxHeight?: number;
  estimatedItemHeight?: number;
  
  // Styling
  class?: string;
  style?: Record<string, string | number>;
  
  // Advanced
  virtualization?: boolean;
  customRenderer?: (item: SelectItem, index: number) => VNode;
}
```

### Props Details

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `SelectItem[] \| string[] \| number[]` | **Required** | Array of items to display |
| `modelValue` (`v-model`) | `string \| number \| array` | `undefined` | Current selected value(s) |
| `multiple` | `boolean` | `false` | Enable multi-selection |
| `searchable` | `boolean` | `true` | Enable search functionality |
| `disabled` | `boolean` | `false` | Disable the select |
| `placeholder` | `string` | `'Select...'` | Placeholder text |
| `maxHeight` | `number` | `300` | Max dropdown height (px) |
| `estimatedItemHeight` | `number` | `48` | Estimated item height for virtualization |
| `class` | `string` | `undefined` | CSS class name |
| `style` | `object` | `undefined` | Inline styles (CSS variables) |
| `virtualization` | `boolean` | `true` | Enable virtual scrolling |
| `customRenderer` | `function` | `undefined` | Custom option renderer |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `string \| number \| array` | Emitted when value changes |
| `open` | - | Emitted when dropdown opens |
| `close` | - | Emitted when dropdown closes |
| `search` | `query: string` | Emitted on search input |

---

## Input Formats

Smilodon accepts three input formats for maximum flexibility:

### 1. Object Array (SelectItem[])

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';
import type { SelectItem } from '@smilodon/core';

const selectedValue = ref<string | number>('');

const items: SelectItem[] = [
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'mx', label: 'Mexico' },
];
</script>

<template>
  <Select :items="items" v-model="selectedValue" />
</template>
```

### 2. String Array (Auto-converted)

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

const selectedValue = ref('');
const items = ['Apple', 'Banana', 'Cherry', 'Date'];
</script>

<template>
  <Select :items="items" v-model="selectedValue" />
</template>
```

Automatically converted to:
```typescript
[
  { value: 'Apple', label: 'Apple' },
  { value: 'Banana', label: 'Banana' },
  { value: 'Cherry', label: 'Cherry' },
  { value: 'Date', label: 'Date' },
]
```

### 3. Number Array (Auto-converted)

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

const selectedValue = ref<number>(0);
const items = [1, 2, 3, 5, 8, 13, 21];
</script>

<template>
  <Select :items="items" v-model="selectedValue" />
</template>
```

---

## Single Selection

### Basic Single Select

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';
import type { SelectItem } from '@smilodon/core';

const country = ref<string | number>('');

const countries: SelectItem[] = [
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'au', label: 'Australia' },
];
</script>

<template>
  <div>
    <Select
      :items="countries"
      v-model="country"
      placeholder="Select your country"
    />
    
    <p v-if="country">Selected: {{ country }}</p>
  </div>
</template>
```

### With Form Integration

```vue
<script setup lang="ts">
import { ref, reactive } from 'vue';
import { Select } from '@smilodon/vue';

const formData = reactive({
  name: '',
  country: '',
  language: '',
});

const handleSubmit = () => {
  console.log('Form data:', formData);
};
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <label>Name:</label>
      <input v-model="formData.name" type="text" />
    </div>

    <div>
      <label>Country:</label>
      <Select
        :items="['USA', 'Canada', 'Mexico', 'UK', 'Australia']"
        v-model="formData.country"
        placeholder="Select country"
      />
    </div>

    <div>
      <label>Language:</label>
      <Select
        :items="['English', 'Spanish', 'French', 'German']"
        v-model="formData.language"
        placeholder="Select language"
      />
    </div>

    <button type="submit">Submit</button>
  </form>
</template>
```

---

## Multi-Selection

### Basic Multi-Select

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';
import type { SelectItem } from '@smilodon/core';

const languages = ref<(string | number)[]>([]);

const items: SelectItem[] = [
  { value: 'js', label: 'JavaScript' },
  { value: 'ts', label: 'TypeScript' },
  { value: 'py', label: 'Python' },
  { value: 'rs', label: 'Rust' },
  { value: 'go', label: 'Go' },
];
</script>

<template>
  <div>
    <Select
      :items="items"
      v-model="languages"
      multiple
      placeholder="Select programming languages"
    />
    
    <div v-if="languages.length > 0">
      <strong>Selected ({{ languages.length }}):</strong>
      <ul>
        <li v-for="lang in languages" :key="lang">{{ lang }}</li>
      </ul>
    </div>
    <p v-else>No languages selected</p>
  </div>
</template>
```

### Multi-Select with Limit

```vue
<script setup lang="ts">
import { ref, watch } from 'vue';
import { Select } from '@smilodon/vue';

const selected = ref<(string | number)[]>([]);
const maxSelections = 3;

watch(selected, (newValue) => {
  if (newValue.length > maxSelections) {
    selected.value = newValue.slice(0, maxSelections);
  }
});
</script>

<template>
  <div>
    <Select
      :items="['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange']"
      v-model="selected"
      multiple
      :placeholder="`Select up to ${maxSelections} colors`"
    />
    <p>{{ selected.length }} / {{ maxSelections }} selected</p>
  </div>
</template>
```

---

## Searchable Select

### Basic Search

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';
import type { SelectItem } from '@smilodon/core';

const country = ref<string | number>('');

// Large dataset
const countries: SelectItem[] = [
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'mx', label: 'Mexico' },
  { value: 'br', label: 'Brazil' },
  { value: 'ar', label: 'Argentina' },
  // ... 200+ countries
];
</script>

<template>
  <Select
    :items="countries"
    v-model="country"
    searchable
    placeholder="Search for a country..."
  />
</template>
```

### Search with Event Handler

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

const value = ref('');
const searchQuery = ref('');

const handleSearch = (query: string) => {
  searchQuery.value = query;
  console.log('Searching for:', query);
  // Optionally trigger API call, analytics, etc.
};
</script>

<template>
  <div>
    <Select
      :items="['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry']"
      v-model="value"
      searchable
      @search="handleSearch"
      placeholder="Type to search..."
    />
    <p v-if="searchQuery">Current search: {{ searchQuery }}</p>
  </div>
</template>
```

---

## Grouped Options

### Basic Groups

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';
import type { SelectItem } from '@smilodon/core';

const value = ref<string | number>('');

const items: SelectItem[] = [
  // Fruits group
  { value: 'apple', label: 'Apple', group: 'Fruits' },
  { value: 'banana', label: 'Banana', group: 'Fruits' },
  { value: 'cherry', label: 'Cherry', group: 'Fruits' },
  
  // Vegetables group
  { value: 'carrot', label: 'Carrot', group: 'Vegetables' },
  { value: 'broccoli', label: 'Broccoli', group: 'Vegetables' },
  { value: 'spinach', label: 'Spinach', group: 'Vegetables' },
];
</script>

<template>
  <Select
    :items="items"
    v-model="value"
    placeholder="Select food..."
  />
</template>
```

### Complex Grouped Structure

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import { Select } from '@smilodon/vue';
import type { SelectItem } from '@smilodon/core';

const value = ref<string | number>('');

const technologies = computed<SelectItem[]>(() => [
  // Frontend
  { value: 'react', label: 'React', group: 'Frontend' },
  { value: 'vue', label: 'Vue.js', group: 'Frontend' },
  { value: 'svelte', label: 'Svelte', group: 'Frontend' },
  
  // Backend
  { value: 'node', label: 'Node.js', group: 'Backend' },
  { value: 'django', label: 'Django', group: 'Backend' },
  { value: 'rails', label: 'Ruby on Rails', group: 'Backend' },
  
  // Database
  { value: 'postgres', label: 'PostgreSQL', group: 'Database' },
  { value: 'mongo', label: 'MongoDB', group: 'Database' },
  { value: 'redis', label: 'Redis', group: 'Database' },
]);
</script>

<template>
  <Select
    :items="technologies"
    v-model="value"
    searchable
    placeholder="Select technology..."
  />
</template>
```

---

## Disabled States

### Disabled Select

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

const value = ref('');
</script>

<template>
  <Select
    :items="['Option 1', 'Option 2', 'Option 3']"
    v-model="value"
    disabled
    placeholder="This select is disabled"
  />
</template>
```

### Disabled Options

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';
import type { SelectItem } from '@smilodon/core';

const value = ref<string | number>('');

const items: SelectItem[] = [
  { value: '1', label: 'Available Option 1' },
  { value: '2', label: 'Available Option 2' },
  { value: '3', label: 'Disabled Option', disabled: true },
  { value: '4', label: 'Available Option 3' },
  { value: '5', label: 'Disabled Option 2', disabled: true },
];
</script>

<template>
  <Select
    :items="items"
    v-model="value"
    placeholder="Some options are disabled"
  />
</template>
```

### Conditional Disabling

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

const value = ref('');
const isLoading = ref(false);

const handleChange = async () => {
  isLoading.value = true;
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  isLoading.value = false;
};
</script>

<template>
  <div>
    <Select
      :items="['Option 1', 'Option 2', 'Option 3']"
      v-model="value"
      :disabled="isLoading"
      :placeholder="isLoading ? 'Loading...' : 'Select an option'"
      @update:modelValue="handleChange"
    />
    <p v-if="isLoading">Processing selection...</p>
  </div>
</template>
```

---

## Event Handling

### All Events

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

const value = ref('');
const isOpen = ref(false);
const logs = ref<string[]>([]);

const addLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString();
  logs.value.push(`[${timestamp}] ${message}`);
};

const handleChange = (val: string | number | (string | number)[]) => {
  addLog(`Changed to: ${val}`);
};

const handleOpen = () => {
  isOpen.value = true;
  addLog('Dropdown opened');
};

const handleClose = () => {
  isOpen.value = false;
  addLog('Dropdown closed');
};

const handleSearch = (query: string) => {
  addLog(`Searching for: ${query}`);
};
</script>

<template>
  <div>
    <Select
      :items="['Apple', 'Banana', 'Cherry']"
      v-model="value"
      @update:modelValue="handleChange"
      @open="handleOpen"
      @close="handleClose"
      @search="handleSearch"
      placeholder="Select a fruit"
    />

    <div>
      <p>Current value: {{ value || 'None' }}</p>
      <p>Dropdown is: {{ isOpen ? 'Open' : 'Closed' }}</p>
    </div>

    <div>
      <strong>Event Log:</strong>
      <ul style="max-height: 200px; overflow: auto;">
        <li v-for="(log, i) in logs" :key="i">{{ log }}</li>
      </ul>
    </div>
  </div>
</template>
```

---

## Styling & Theming

### Inline Styles with CSS Variables

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

const value = ref('');

const customStyles = {
  '--select-input-border': '2px solid #3b82f6',
  '--select-input-border-radius': '8px',
  '--select-input-focus-border': '#2563eb',
  '--select-option-hover-bg': '#dbeafe',
  '--select-option-selected-bg': '#3b82f6',
  '--select-option-selected-color': 'white',
  '--select-badge-bg': '#3b82f6',
};
</script>

<template>
  <Select
    :items="['Red', 'Blue', 'Green']"
    v-model="value"
    :style="customStyles"
  />
</template>
```

### Complete CSS Variables Reference

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

const value = ref('');

const allStyles = {
  // Input Container
  '--select-input-gap': '6px',
  '--select-input-padding': '6px 52px 6px 8px',
  '--select-input-min-height': '44px',
  '--select-input-bg': 'white',
  '--select-input-border': '1px solid #d1d5db',
  '--select-input-border-radius': '6px',
  '--select-input-focus-border': '#667eea',
  '--select-input-focus-shadow': '0 0 0 3px rgba(102, 126, 234, 0.1)',

  // Input Field
  '--select-input-min-width': '120px',
  '--select-input-field-padding': '4px',
  '--select-input-font-size': '14px',
  '--select-input-line-height': '1.5',
  '--select-input-color': '#1f2937',
  '--select-input-placeholder-color': '#9ca3af',
  '--select-font-family': 'inherit',

  // Dropdown Arrow
  '--select-arrow-width': '40px',
  '--select-arrow-size': '16px',
  '--select-arrow-color': '#667eea',
  '--select-arrow-hover-color': '#667eea',
  '--select-arrow-hover-bg': 'rgba(102, 126, 234, 0.08)',
  '--select-arrow-border-radius': '0 4px 4px 0',

  // Separator Line
  '--select-separator-position': '40px',
  '--select-separator-width': '1px',
  '--select-separator-height': '60%',
  '--select-separator-gradient': 'linear-gradient(to bottom, transparent, #ccc, transparent)',

  // Selection Badges (Multi-select)
  '--select-badge-gap': '4px',
  '--select-badge-padding': '4px 8px',
  '--select-badge-margin': '2px',
  '--select-badge-bg': '#667eea',
  '--select-badge-color': 'white',
  '--select-badge-border-radius': '4px',
  '--select-badge-font-size': '13px',
  
  // Badge Remove Button
  '--select-badge-remove-size': '16px',
  '--select-badge-remove-bg': 'rgba(255, 255, 255, 0.3)',
  '--select-badge-remove-color': 'white',
  '--select-badge-remove-font-size': '16px',
  '--select-badge-remove-hover-bg': 'rgba(255, 255, 255, 0.5)',

  // Dropdown
  '--select-dropdown-margin-top': '4px',
  '--select-dropdown-max-height': '300px',
  '--select-dropdown-border-radius': '4px',
  '--select-dropdown-bg': 'white',
  '--select-dropdown-border': '1px solid #ccc',
  '--select-dropdown-shadow': '0 4px 6px rgba(0, 0, 0, 0.1)',

  // Options
  '--select-options-bg': 'white',
  '--select-option-padding': '8px 12px',
  '--select-option-color': '#1f2937',
  '--select-option-bg': 'white',
  '--select-option-font-size': '14px',
  '--select-option-hover-bg': '#f3f4f6',
  '--select-option-selected-bg': '#e0e7ff',
  '--select-option-selected-color': '#4338ca',
};
</script>

<template>
  <Select
    :items="['Option 1', 'Option 2', 'Option 3']"
    v-model="value"
    :style="allStyles"
  />
</template>
```

### Theme Examples

#### Bootstrap Theme

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

const value = ref('');

const bootstrapTheme = {
  '--select-input-border': '1px solid #ced4da',
  '--select-input-border-radius': '0.375rem',
  '--select-input-focus-border': '#86b7fe',
  '--select-input-focus-shadow': '0 0 0 0.25rem rgba(13, 110, 253, 0.25)',
  '--select-option-hover-bg': '#e9ecef',
  '--select-option-selected-bg': '#0d6efd',
  '--select-option-selected-color': 'white',
  '--select-badge-bg': '#0d6efd',
};
</script>

<template>
  <Select
    :items="['Option 1', 'Option 2', 'Option 3']"
    v-model="value"
    :style="bootstrapTheme"
  />
</template>
```

#### Material Design Theme

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

const value = ref('');

const materialTheme = {
  '--select-input-border-radius': '4px',
  '--select-input-focus-border': '#1976d2',
  '--select-dropdown-shadow': '0 2px 4px rgba(0,0,0,0.2), 0 4px 5px rgba(0,0,0,0.14)',
  '--select-option-padding': '16px',
  '--select-option-hover-bg': 'rgba(0, 0, 0, 0.04)',
  '--select-option-selected-bg': '#e3f2fd',
  '--select-option-selected-color': '#1976d2',
  '--select-badge-bg': '#1976d2',
  '--select-badge-border-radius': '16px',
};
</script>

<template>
  <Select
    :items="['Option 1', 'Option 2', 'Option 3']"
    v-model="value"
    :style="materialTheme"
  />
</template>
```

#### Dark Mode Theme

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

const value = ref('');

const darkTheme = {
  '--select-input-bg': '#1f2937',
  '--select-input-border': '1px solid #4b5563',
  '--select-input-color': '#f9fafb',
  '--select-dropdown-bg': '#1f2937',
  '--select-options-bg': '#1f2937',
  '--select-option-color': '#f9fafb',
  '--select-option-bg': '#1f2937',
  '--select-option-hover-bg': '#374151',
  '--select-option-selected-bg': '#3730a3',
  '--select-badge-bg': '#4f46e5',
};
</script>

<template>
  <Select
    :items="['Option 1', 'Option 2', 'Option 3']"
    v-model="value"
    class="dark-mode"
    :style="darkTheme"
  />
</template>
```

### External CSS with Scoped Styles

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

const value = ref('');
</script>

<template>
  <Select
    :items="['Option 1', 'Option 2', 'Option 3']"
    v-model="value"
    class="custom-select"
  />
</template>

<style scoped>
.custom-select {
  --select-input-border: 2px solid #10b981;
  --select-input-border-radius: 12px;
  --select-option-hover-bg: #d1fae5;
  --select-option-selected-bg: #10b981;
  --select-option-selected-color: white;
  --select-badge-bg: #10b981;
  --select-separator-gradient: linear-gradient(
    to bottom,
    transparent 0%,
    #10b981 20%,
    #10b981 80%,
    transparent 100%
  );
}
</style>
```

---

## Custom Renderers

### Custom Option Renderer

```vue
<script setup lang="ts">
import { ref, h } from 'vue';
import { Select } from '@smilodon/vue';
import type { SelectItem } from '@smilodon/core';

interface User extends SelectItem {
  value: string;
  label: string;
  email: string;
  avatar: string;
}

const selectedUser = ref<string | number>('');

const users: User[] = [
  { 
    value: '1', 
    label: 'John Doe', 
    email: 'john@example.com',
    avatar: 'https://i.pravatar.cc/150?img=1'
  },
  { 
    value: '2', 
    label: 'Jane Smith', 
    email: 'jane@example.com',
    avatar: 'https://i.pravatar.cc/150?img=2'
  },
];

const customRenderer = (item: SelectItem) => {
  const user = item as User;
  return h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } }, [
    h('img', {
      src: user.avatar,
      alt: user.label,
      style: { width: '32px', height: '32px', borderRadius: '50%' }
    }),
    h('div', {}, [
      h('div', { style: { fontWeight: '500' } }, user.label),
      h('div', { style: { fontSize: '12px', color: '#6b7280' } }, user.email)
    ])
  ]);
};
</script>

<template>
  <Select
    :items="users"
    v-model="selectedUser"
    :customRenderer="customRenderer"
    placeholder="Select a user"
    :estimatedItemHeight="60"
  />
</template>
```

---

## Performance Optimization

### Virtualization for Large Datasets

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import { Select } from '@smilodon/vue';

const value = ref('');

// Generate 100,000 items
const items = computed(() => 
  Array.from({ length: 100_000 }, (_, i) => ({
    value: `item-${i}`,
    label: `Item ${i + 1}`,
  }))
);
</script>

<template>
  <Select
    :items="items"
    v-model="value"
    :virtualization="true"
    :estimatedItemHeight="48"
    placeholder="Search 100k items..."
    searchable
  />
</template>
```

### Computed Items

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import { Select } from '@smilodon/vue';
import type { SelectItem } from '@smilodon/core';

const value = ref('');
const searchFilter = ref('');

const rawItems: SelectItem[] = [
  { value: '1', label: 'Apple' },
  { value: '2', label: 'Banana' },
  { value: '3', label: 'Cherry' },
  // ... many more items
];

// Only recalculate when rawItems or searchFilter changes
const filteredItems = computed(() => {
  if (!searchFilter.value) return rawItems;
  return rawItems.filter(item =>
    item.label.toLowerCase().includes(searchFilter.value.toLowerCase())
  );
});
</script>

<template>
  <Select
    :items="filteredItems"
    v-model="value"
  />
</template>
```

---

## TypeScript Integration

### Full Type Safety

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';
import type { SelectItem } from '@smilodon/core';

// Define your data type
interface Product extends SelectItem {
  value: string;
  label: string;
  price: number;
  category: string;
}

const selectedId = ref<string>('');

const products: Product[] = [
  { value: 'p1', label: 'Laptop', price: 999, category: 'Electronics' },
  { value: 'p2', label: 'Phone', price: 699, category: 'Electronics' },
  { value: 'p3', label: 'Desk', price: 299, category: 'Furniture' },
];

const handleChange = (value: string | number | (string | number)[]) => {
  selectedId.value = value as string;
  const product = products.find(p => p.value === value);
  if (product) {
    console.log('Selected product:', product.label, 'Price:', product.price);
  }
};
</script>

<template>
  <Select
    :items="products"
    v-model="selectedId"
    @update:modelValue="handleChange"
    placeholder="Select a product"
  />
</template>
```

### Generic Component

```vue
<script setup lang="ts" generic="T extends SelectItem">
import { ref, watch } from 'vue';
import { Select } from '@smilodon/vue';
import type { SelectItem } from '@smilodon/core';

interface Props {
  items: T[];
  label: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  select: [item: T];
}>();

const selectedValue = ref<string | number>('');

watch(selectedValue, (newValue) => {
  const selected = props.items.find(item => item.value === newValue);
  if (selected) emit('select', selected);
});
</script>

<template>
  <div>
    <label>{{ label }}</label>
    <Select :items="items" v-model="selectedValue" />
  </div>
</template>
```

---

## Composition API

### Composable for Select Logic

```typescript
// composables/useSelect.ts
import { ref, computed } from 'vue';
import type { SelectItem } from '@smilodon/core';

export function useSelect<T extends SelectItem>(initialItems: T[]) {
  const items = ref<T[]>(initialItems);
  const selectedValue = ref<string | number | (string | number)[]>('');
  const isOpen = ref(false);

  const selectedItem = computed(() => {
    if (Array.isArray(selectedValue.value)) {
      return items.value.filter(item => 
        selectedValue.value.includes(item.value)
      );
    }
    return items.value.find(item => item.value === selectedValue.value);
  });

  const selectItem = (value: string | number | (string | number)[]) => {
    selectedValue.value = value;
  };

  const clearSelection = () => {
    selectedValue.value = Array.isArray(selectedValue.value) ? [] : '';
  };

  return {
    items,
    selectedValue,
    selectedItem,
    isOpen,
    selectItem,
    clearSelection,
  };
}
```

Usage:

```vue
<script setup lang="ts">
import { Select } from '@smilodon/vue';
import { useSelect } from './composables/useSelect';

const { 
  items, 
  selectedValue, 
  selectedItem, 
  selectItem 
} = useSelect([
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
]);
</script>

<template>
  <div>
    <Select
      :items="items"
      v-model="selectedValue"
      @update:modelValue="selectItem"
    />
    <p v-if="selectedItem">Selected: {{ selectedItem.label }}</p>
  </div>
</template>
```

---

## Accessibility

Smilodon is WCAG 2.1 AAA compliant with full keyboard support:

### Keyboard Navigation

- **Tab** - Focus the select
- **Enter/Space** - Open dropdown
- **↑/↓** - Navigate options
- **Home/End** - Jump to first/last option
- **Escape** - Close dropdown
- **Type** - Search options

### ARIA Attributes

The component automatically includes:
- `role="combobox"`
- `aria-expanded`
- `aria-haspopup`
- `aria-label` / `aria-labelledby`
- `aria-activedescendant`
- `aria-multiselectable` (when `multiple`)

### Screen Reader Support

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

const country = ref('');
</script>

<template>
  <div>
    <label id="country-label">Country</label>
    <Select
      :items="['USA', 'Canada', 'Mexico']"
      v-model="country"
      placeholder="Select your country"
      aria-labelledby="country-label"
    />
  </div>
</template>
```

---

## Advanced Patterns

### Dependent Selects

```vue
<script setup lang="ts">
import { ref, watch } from 'vue';
import { Select } from '@smilodon/vue';

const country = ref('');
const state = ref('');
const states = ref<string[]>([]);

const countries = ['USA', 'Canada', 'Mexico'];

watch(country, (newCountry) => {
  // Reset state when country changes
  state.value = '';
  
  // Load states for selected country
  if (newCountry === 'USA') {
    states.value = ['California', 'Texas', 'New York', 'Florida'];
  } else if (newCountry === 'Canada') {
    states.value = ['Ontario', 'Quebec', 'British Columbia'];
  } else if (newCountry === 'Mexico') {
    states.value = ['Mexico City', 'Jalisco', 'Nuevo León'];
  } else {
    states.value = [];
  }
});
</script>

<template>
  <div>
    <Select
      :items="countries"
      v-model="country"
      placeholder="Select country"
    />

    <Select
      :items="states"
      v-model="state"
      :disabled="!country"
      :placeholder="country ? 'Select state' : 'Select country first'"
    />
  </div>
</template>
```

### Async Data Loading

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Select } from '@smilodon/vue';
import type { SelectItem } from '@smilodon/core';

const items = ref<SelectItem[]>([]);
const loading = ref(true);
const value = ref('');

onMounted(async () => {
  loading.value = true;
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  items.value = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3' },
  ];
  
  loading.value = false;
});
</script>

<template>
  <div>
    <div v-if="loading">Loading options...</div>
    <Select
      v-else
      :items="items"
      v-model="value"
      placeholder="Select an option"
    />
  </div>
</template>
```

### With Pinia Store

```typescript
// stores/selectStore.ts
import { defineStore } from 'pinia';
import type { SelectItem } from '@smilodon/core';

export const useSelectStore = defineStore('select', {
  state: () => ({
    items: [] as SelectItem[],
    selectedValue: '' as string | number,
  }),
  
  actions: {
    setItems(newItems: SelectItem[]) {
      this.items = newItems;
    },
    
    selectItem(value: string | number) {
      this.selectedValue = value;
    },
    
    clearSelection() {
      this.selectedValue = '';
    },
  },
});
```

```vue
<script setup lang="ts">
import { Select } from '@smilodon/vue';
import { useSelectStore } from './stores/selectStore';

const store = useSelectStore();

// Initialize items
store.setItems([
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
]);
</script>

<template>
  <Select
    :items="store.items"
    v-model="store.selectedValue"
    @update:modelValue="store.selectItem"
  />
</template>
```

---

## Troubleshooting

### Common Issues

#### Issue: v-model not updating

```vue
<!-- ❌ Wrong - typo in v-model -->
<Select :items="items" v-modal="value" />

<!-- ✅ Correct -->
<Select :items="items" v-model="value" />
```

#### Issue: Multi-select type error

```vue
<script setup lang="ts">
// ❌ Wrong - value should be array for multiple
const value = ref('');

// ✅ Correct
const value = ref<(string | number)[]>([]);
</script>

<template>
  <Select :items="items" v-model="value" multiple />
</template>
```

#### Issue: Warning about custom element

Add to `vite.config.ts`:

```typescript
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'enhanced-select'
        }
      }
    })
  ]
});
```

### Performance Issues

If you experience slow rendering with large datasets:

1. Use `computed` for items array
2. Enable virtualization (enabled by default)
3. Increase `estimatedItemHeight` if items are taller than 48px

```vue
<script setup lang="ts">
import { computed } from 'vue';

const items = computed(() => generateLargeDataset());
</script>

<template>
  <Select
    :items="items"
    v-model="value"
    :virtualization="true"
    :estimatedItemHeight="48"
  />
</template>
```

---

## Additional Resources

- **Core Documentation**: [packages/core/README.md](../core/README.md)
- **API Reference**: [docs/API-REFERENCE.md](../../docs/API-REFERENCE.md)
- **Live Examples**: [Playground](../../playground)
- **GitHub Issues**: [Report a bug](https://github.com/navidrezadoost/smilodon/issues)

---

**Built with ❤️ by the Smilodon team**

*Last updated: February 9, 2026 - v1.3.6*
