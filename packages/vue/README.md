# @smilodon/vue

Select component for Vue 3 applications. Its underlying shared core has scoped automated Phase 4 browser coverage; complete Vue/Nuxt integration parity and manual assistive-technology certification remain unverified.

> Large-list status: the public `virtualized` prop enables legacy chunked rendering for large flat lists; it does not window rows to the viewport, and all results may eventually be mounted. True viewport virtualization remains guarded by a private test seam and is not a supported production mode. The shared core's scoped Phase 4 automated browser matrix passed in Chromium, Firefox, and WebKit; this does not certify every Vue/Nuxt integration, minimum browser versions, or WCAG conformance. Manual assistive-technology assessment remains pending. See the [current limitation record](../../docs/KNOWN-LIMITATIONS.md#viewport-virtualization-status).

## Acknowledged data-loading adapter status

The Phase 2F-D development candidate currently integrates acknowledged data loading through the core API and React adapter only. This Vue adapter does not publish a typed props/emits/exposed-method contract for request identity, completion, cancellation, and projection lifecycle. Passing `dataLoading` via casts or relying on the underlying element is undocumented and unsupported for this adapter. Vue adapter parity is a separate, pending work package; the existing legacy Vue data-loading behavior remains its supported path.

## 📖 Documentation

**Live documentation & interactive examples:** [navidrezadoost.github.io/Smilodon](https://navidrezadoost.github.io/Smilodon/)

**Framework integration (Vue 3, Nuxt 4, React, SSR, Vite):** [`docs/FRAMEWORK-INTEGRATION.md`](../../docs/FRAMEWORK-INTEGRATION.md)

**For comprehensive documentation covering all features, styling options, and advanced patterns:**

👉 **[Complete Vue Guide](./COMPLETE-GUIDE.md)** 👈

The complete guide includes:
- ✅ Complete styling token coverage for colors, layout, chips, motion, and accessibility
- ✅ Vue 3-specific patterns (Composition API, v-model, computed)
- ✅ Complete API reference with TypeScript types
- ✅ Pinia store integration examples
- ✅ Custom renderers with h() function and VNodes
- ✅ Theme examples and styling techniques
- ✅ Advanced patterns (dependent selects, async onMounted)
- ✅ Troubleshooting and accessibility information

The Quick Start and examples with complete `<script setup>` blocks are intended to stand alone. Longer tutorial excerpts may be focused fragments; when they use host-owned `items`, `value`, or request functions, provide those declarations in the surrounding Vue component.

---

## Features

- New: `optionRenderer` prop mirrors the Web Component Option B API (returns an HTMLElement for full DOM control).

### Advanced scenarios (Vue)
- **Accessibility labels**: use a literal `aria-label` for the internal combobox; host IDREF attributes are not forwarded across the shadow boundary:
  ```vue
  <label for="team-picker">Team</label>
  <Select id="team-picker" aria-label="Team" />
  ```
- **Server-side lookup**: the host owns transport, loading/error state, stale-request protection, and `setItems`; a minimal race-safe pattern is:
  ```vue
  <script setup lang="ts">
  import { ref } from 'vue';
  import { Select } from '@smilodon/vue';
  import type { SelectItem } from '@smilodon/core';
  const items = ref<SelectItem[]>([]);
  const loading = ref(false);
  const searchError = ref('');
  let requestId = 0;
  let controller: AbortController | undefined;
  async function onSearch(query: string) {
    const id = ++requestId;
    controller?.abort();
    if (!query) { items.value = []; loading.value = false; searchError.value = ''; return; }
    const current = new AbortController(); controller = current; loading.value = true;
    try {
      const response = await fetch(`/api/teams?q=${encodeURIComponent(query)}`, { signal: current.signal });
      if (!response.ok) throw new Error(`Search failed: ${response.status}`);
      const result = await response.json() as SelectItem[];
      if (id === requestId) { items.value = result; searchError.value = ''; }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError') && id === requestId) searchError.value = String(error);
    } finally { if (id === requestId) loading.value = false; }
  }
  </script>
  <template>
    <Select :items="items" searchable @search="onSearch" />
    <p v-if="loading" role="status">Searching…</p>
    <p v-if="searchError" role="alert">{{ searchError }}</p>
  </template>
  ```
- **Large flat lists**: the public setting enables chunked rendering, not viewport windowing:
  ```vue
  <Select :items="bigList" virtualized />
  ```

- ✅ **Vue 3 Native** - Built for Vue 3 with Composition API and `<script setup>` support
- ✅ **v-model Support** - Two-way binding that feels natural in Vue
- ✅ **Fully Typed** - Complete TypeScript support with detailed type definitions
- ✅ **Single & Multi-select** - One prop to switch modes
- ✅ **Searchable** - Built-in filtering with customizable behavior
- ✅ **Infinite Scroll** - Emit load-more requests so the host can page data; the adapter does not implement transport or automatically deduplicate async requests
- ✅ **Large-list chunk rendering** - Incrementally render large flat lists; not viewport windowing
- ✅ **Grouped Options** - Organize items into categories
- 🎨 **Dark Mode** - apply `class="dark-mode"` or `data-theme="dark"` to the component or an ancestor; styles are scoped inside the shadow DOM.
- ✅ **Accessibility behaviors** - Shared-core scenarios passed in the scoped Chromium/Firefox/WebKit Phase 4 matrix; exhaustive Vue/Nuxt parity, manual AT, and WCAG conformance are not established
- ✅ **Flexible Input** - Accepts SelectItem objects, string arrays, or number arrays
- ✅ **Customizable** - Custom renderers, styles, and behaviors
- ✅ **Bundle guidance** - No version-specific bundle-size claim is made; measure the emitted artifact for your app and bundler if bundle budget matters

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

## Nuxt Integration

Nuxt works well with `@smilodon/vue`, but the underlying `enhanced-select` custom element must be treated as a custom element by the Vue compiler.

The compiler setting below prevents Vue from treating the core host tag as an unresolved Vue component; it does not itself register the custom element or certify SSR/hydration behavior. The Vue adapter waits for the core element upgrade from its browser mount lifecycle. Keep imperative DOM work client-only, verify the integration in the Nuxt version/build mode you ship, and use `<ClientOnly>` when your application needs to avoid rendering this interactive control during SSR.

### `nuxt.config.ts`

```ts
export default defineNuxtConfig({
  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag === 'enhanced-select',
    },
  },
})
```

### Client usage in Nuxt

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Select } from '@smilodon/vue'

const value = ref<string | number>('')
const items = [
  { value: 'nuxt', label: 'Nuxt' },
  { value: 'vite', label: 'Vite' },
  { value: 'astro', label: 'Astro' },
]
</script>

<template>
  <Select
    v-model="value"
    :items="items"
    searchable
    clearable
    placeholder="Choose a stack"
  />
</template>
```

### Nuxt notes

- Keep browser-only imperative access inside `onMounted()`.
- Pass plain objects/arrays through props when data originates from server routes.
- If you style globally, target `::part()` hooks or CSS variables rather than internal markup.

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

## Clear Control (Reset Selected/Search Value)

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

const value = ref('');
const items = [
  { value: 'js', label: 'JavaScript' },
  { value: 'py', label: 'Python' },
  { value: 'rs', label: 'Rust' },
];
</script>

<template>
  <Select
    :items="items"
    v-model="value"
    searchable
    clearable
    :clear-selection-on-clear="true"
    :clear-search-on-clear="true"
    clear-aria-label="Clear selected and searched values"
    clear-icon="✕"
    @clear="(detail) => console.log('cleared', detail)"
  />
</template>
```

Styling hooks: `::part(clear-button)` and `::part(clear-icon)` plus `--select-clear-*` CSS tokens.

An empty clearable field reserves no clear-button space by default. Selecting a value—or typing search text when search clearing is enabled—reveals the button and adjusts the input, separator, and arrow as one layout. Clearing all enabled targets restores the shared runtime's intended layout across single/multi-select and LTR/RTL configurations; this is not exhaustive Vue integration certification.

Use the full core config only when the action should remain visible but disabled while empty:

```vue
<Select
  v-model="value"
  :items="items"
  clearable
  :config="{ clearControl: { hideWhenEmpty: false } }"
/>
```

The `clear` event detail contains `clearedSelection` and `clearedSearch`. Prefer the exposed parts and tokens for styling; permanent input padding would recreate an empty gap.

## Direction and option-state controls

The Vue adapter now exposes the same option-surface controls as the React adapter:

```vue
<Select
  v-model="value"
  :items="items"
  direction="rtl"
  remove-button-icon="−"
  :disabled-option-behavior="{ hoverable: true, focusable: true, selectable: false }"
  :show-selected-indicator="false"
/>
```

- `direction` switches the instance between `ltr` and `rtl`
- `removeButtonIcon` replaces the chip remove icon with text or inline SVG markup
- `disabledOptionBehavior` controls whether dimmed options can still be hovered, focused, or selected
- `showSelectedIndicator` hides or shows the selected side indicator without custom pseudo-element overrides

## Core config parity and global defaults

The Vue adapter now accepts the shared core config model directly, so Vue consumers can use either adapter-friendly props or the complete `GlobalSelectConfig` shape.

### Convenience props

Use these props when you want the most common advanced core features with Vue-friendly prop names:

- `selectionConfig`
- `multiSelectDisplay`
- `scrollToSelected`
- `styles`
- `config`

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

const value = ref<Array<string | number>>(['react', 'solid']);
const items = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'solid', label: 'Solid' },
];
</script>

<template>
  <Select
    v-model="value"
    :items="items"
    multiple
    searchable
    :multi-select-display="{
      mode: 'horizontal',
      maxHeight: '56px',
      overflowX: 'auto',
      overflowY: 'hidden',
      dragScroll: true,
    }"
    :selection-config="{
      closeOnSelect: false,
      toggleOnTriggerClick: true,
    }"
    :styles="{
      badgeRemoveIcon: {
        color: '#dc2626',
        transform: 'scale(1.1)',
      },
    }"
    remove-button-icon="−"
    placeholder="Select frameworks"
  />
</template>
```

### Full `config` passthrough

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

const value = ref<Array<string | number>>([]);
</script>

<template>
  <Select
    v-model="value"
    :items="items"
    multiple
    :config="{
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
    }"
  />
</template>
```

### Global defaults from `@smilodon/vue`

The Vue adapter re-exports `configureSelect()`, `resetSelectConfig()`, and `selectConfig`.

```ts
import { configureSelect } from '@smilodon/vue';

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
  multiSelectDisplay: {
    mode: 'wrap',
  },
});
```

### Template ref methods

The exposed Vue instance now includes additional core-style helpers alongside diagnostics methods.

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

const selectRef = ref<InstanceType<typeof Select> | null>(null);

function applyRuntimeChanges() {
  selectRef.value?.clearSearch();
  selectRef.value?.updateConfig({ selection: { showSelectedIndicator: false } });
  selectRef.value?.setError('Please review this field');
  console.log(selectRef.value?.getSelectedValues());
  console.log(selectRef.value?.validate());
}
</script>

<template>
  <Select ref="selectRef" :items="items" required searchable />
  <button @click="applyRuntimeChanges">Run runtime actions</button>
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

### Large Dataset with Incremental Chunk Rendering (1000 items)

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
    virtualized
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
<script setup lang="ts">
import { onUnmounted, ref } from 'vue';
import { Select } from '@smilodon/vue';

type Item = { value: string; label: string };
const value = ref('');
const items = ref<Item[]>([]);
const isLoading = ref(false);
const searchError = ref('');
let requestId = 0;
let controller: AbortController | undefined;
onUnmounted(() => controller?.abort());

async function handleSearch(query: string) {
  const id = ++requestId;
  controller?.abort();
  if (!query) {
    items.value = [];
    isLoading.value = false;
    searchError.value = '';
    return;
  }
  const current = new AbortController();
  controller = current;
  isLoading.value = true;
  searchError.value = '';
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: current.signal });
    if (!response.ok) throw new Error(`Search failed: ${response.status}`);
    const data = await response.json() as { results: Item[] };
    if (id === requestId) { items.value = data.results; searchError.value = ''; }
  } catch (error) {
    if (!(error instanceof DOMException && error.name === 'AbortError') && id === requestId) searchError.value = String(error);
  } finally {
    if (id === requestId) isLoading.value = false;
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
  <p v-if="isLoading" role="status">Searching…</p>
  <p v-if="searchError" role="alert">{{ searchError }}</p>
</template>
```

### Grouped Options

The Vue wrapper also accepts a flat `items` array where each object may include a `group` string.  The adapter auto‑converts these to `groupedItems` when it detects the property, so you can use whichever format feels more natural.

```vue
<script setup>
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

const value = ref('');
// flat list with `group` property (auto-converted)
const items = [
  { value: 'apple', label: 'Apple', group: 'Fruits' },
  { value: 'banana', label: 'Banana', group: 'Fruits' },
  { value: 'carrot', label: 'Carrot', group: 'Vegetables' },
];
</script>

<template>
  <Select
    :items="items"
    v-model="value"
    searchable
  />
</template>
```

You can also pass explicit `groupedItems` if you prefer:

```vue
<script setup>
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

const value = ref('');
const groupedItems = [
  {
    label: 'Fruits',
    options: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
    ],
  },
  {
    label: 'Vegetables',
    options: [
      { value: 'carrot', label: 'Carrot' },
      { value: 'potato', label: 'Potato' },
    ],
  },
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

**Custom group header renderer**
You can provide a Vue render function to customize how headers are displayed.  The returned VNode will receive `.group-header` and a `part` attribute automatically.

```vue
<script setup>
import { ref, h } from 'vue';
import { Select } from '@smilodon/vue';

const value = ref('');
const groups = [/* ... */];
</script>

<template>
  <Select
    :groupedItems="groups"
    :groupHeaderRenderer="(grp) => h('div', { class: 'text-xs uppercase' }, grp.label)"
    v-model="value"
  />
</template>
```

### Infinite Scroll

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Select } from '@smilodon/vue';

type Item = { value: string; label: string };
const value = ref('');
const items = ref<Item[]>([]);
const pageSize = 50;
const total = 500;
const loading = ref(false);
const hasMore = ref(true);
const loadError = ref('');
const loadedPages = new Set<number>();

async function loadMore(page: number) {
  if (loading.value || loadedPages.has(page) || !hasMore.value) return;
  loading.value = true;
  try {
    const response = await fetch(`/api/items?page=${page}`);
    if (!response.ok) throw new Error(`Page request failed: ${response.status}`);
    const newItems = await response.json() as Item[];
    items.value = [...items.value, ...newItems];
    loadedPages.add(page);
    hasMore.value = newItems.length === pageSize && items.value.length < total;
    loadError.value = '';
  } catch (error) {
    loadError.value = String(error);
    console.error('Unable to load more options', error);
  } finally {
    loading.value = false;
  }
}

// Load initial page
onMounted(() => loadMore(1));
</script>

<template>
  <Select
    :items="items"
    v-model="value"
    infiniteScroll
    :pageSize="pageSize"
    @loadMore="loadMore"
  />
  <p v-if="loading" role="status">Loading more options…</p>
  <p v-if="loadError" role="alert">{{ loadError }}</p>
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
- ✅ Can render datasets whose size has been measured in the target application; no millions-of-items or constant-DOM guarantee is made
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
import { Select } from '@smilodon/vue';
import type { SelectItem } from '@smilodon/core';

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
import { Select } from '@smilodon/vue';
import type { SelectItem } from '@smilodon/core';

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
import { Select } from '@smilodon/vue';
import type { SelectItem } from '@smilodon/core';

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
import { Select } from '@smilodon/vue';
import type { SelectItem } from '@smilodon/core';

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
import { Select } from '@smilodon/vue';
import type { SelectItem } from '@smilodon/core';

// Example 5: DOM-driven option content (the declared optionRenderer contract)
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

// Build nodes with DOM APIs and assign untrusted text with textContent; do not
// interpolate item data into HTML strings.
const tagRenderer = (item: Tag): HTMLElement => {
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px';
  const details = document.createElement('div');
  details.style.cssText = 'display:flex;align-items:center;gap:8px';
  const color = document.createElement('span');
  color.style.cssText = `width:12px;height:12px;border-radius:50%;background:${item.color}`;
  const label = document.createElement('strong');
  label.style.color = '#1f2937';
  label.textContent = item.label;
  const count = document.createElement('span');
  count.style.cssText = 'font-size:14px;color:#6b7280';
  count.textContent = `${item.count} posts`;
  details.append(color, label);
  row.append(details, count);
  return row;
};
</script>

<template>
  <Select
    :items="tags"
    v-model="tag"
    :option-renderer="tagRenderer"
    placeholder="Select a tag..."
  />
</template>
```

### Comparison: When to Use Each Method

| Feature | Method 1: Object Arrays | Method 2: Custom Renderers |
|---------|------------------------|---------------------------|
| **Setup** | Pass an array of option data | Provide a renderer callback |
| **Rendering behavior** | Shared runtime renders option labels | Adapter accepts the documented Vue VNode renderer |
| **Customization** | Data-driven labels and state | Custom non-interactive content; nested controls are not promised |
| **Vue integration** | Controlled/bound values and component events | Same adapter API with custom-rendered content |
| **Reactivity** | Item/value changes use adapter props | Renderer output follows the adapter's renderer lifecycle |
| **TypeScript** | Typed item data and props | Typed renderer callback and props |
| **Very large datasets** | No 1M-item certification or performance comparison is claimed | No 1M-item certification or performance comparison is claimed |
| **Choosing a method** | Direct for simple options | Use when custom content is required |

**Best Practices**:

✅ **Use Method 1 (Object Arrays) when**:
- You need simple text-based options
- You have a large dataset and will profile the specific workload and use host-managed search/pagination where appropriate; no millions-of-items guarantee is made
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
- `virtualized` enables chunked rendering; it does not bound mounted DOM to the viewport.
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
  />
</template>
```

`estimatedItemHeight` is not a declared Vue adapter prop. Do not add it to Vue examples as a production tuning control; the core's estimate is an internal/guarded-path detail.

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
| `virtualized` | `boolean` | `true` | Enable legacy chunked rendering for large flat lists; not viewport windowing |
| `maxSelections` | `number` | - | Maximum selections (for multi-select) |
| `placement` | `'bottom' \| 'top' \| 'auto'` | `'auto'` | Dropdown placement |
| `selectionConfig`, `multiSelectDisplay`, `scrollToSelected`, `styles`, `config` | core configuration types | - | Shared runtime configuration groups |
| `optionRenderer` | `(item, index, helpers) => HTMLElement` | - | DOM-driven option renderer; create nodes safely and return an HTMLElement |
| `customRenderer` | `(item, index) => VNode` | - | Vue VNode renderer created with `h()` |
| `groupHeaderRenderer` | `(group, index) => VNode` | - | Vue VNode group-header renderer |
| `removeButtonIcon`, `disabledOptionBehavior`, `showSelectedIndicator`, `direction`, `classMap` | documented config types | - | Selection, direction, and option-state customization |
| `clearable`, `clearSelectionOnClear`, `clearSearchOnClear`, `clearAriaLabel`, `clearIcon` | booleans / strings | - | Clear-control configuration |
| `trackingEnabled`, `trackEvents`, `trackStyling`, `trackLimitations`, `emitDiagnostics`, `trackingMaxEntries`, `limitationPolicies`, `autoMitigateRuntimeModeSwitch` | documented tracking/limitation types | - | Runtime diagnostics and limitation policies |
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
| `clear` | `{ clearedSelection, clearedSearch }` | Emitted when the clear control is used |
| `diagnostic` | Diagnostic detail object | Emitted when runtime diagnostics are enabled |

### Exposed Methods (Template Ref)

| Method | Description |
|--------|-------------|
| `open()` | Open the dropdown |
| `close()` | Close the dropdown |
| `focus()` | Focus the select |
| `setItems(items)` | Set items programmatically |
| `setGroupedItems(groups)` | Set grouped items programmatically |
| `clear()` | Clear selection |
| `getSelectedItems()` / `getSelectedValues()` | Read selected items or values |
| `clearSearch()` | Clear the current search query |
| `updateConfig(config)` | Apply partial core config at runtime |
| `setError(message)` / `clearError()` | Set or clear validation error state |
| `setRequired(required)` / `validate()` | Change required state or validate |
| `getCapabilities()` / `getKnownLimitations()` | Read runtime capability and limitation reports |
| `getTrackingSnapshot()` / `clearTracking(source?)` | Inspect or clear diagnostic tracking buckets |
| `setLimitationPolicies(policies)` | Set runtime limitation policies |

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
  label: string;
  options: SelectItem[];
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

Implemented behavior includes selected Arrow/Enter/Escape/Tab paths, ARIA naming/description forwarding, and focus restoration. This is not exhaustive keyboard or screen-reader certification.

- ✅ ARIA naming and descriptions support literal host `aria-label` / `aria-description`; host ID references are not forwarded across the shadow boundary
- ✅ Focus restoration behavior is covered in focused tests
- ✅ High-contrast styling hooks are available; conformance is not certified
- The shared core passed its scoped Phase 4 automated browser matrix in Chromium, Firefox, and WebKit. This does not establish exhaustive Vue/Nuxt integration parity, minimum-browser-version support, manual assistive-technology usability, or WCAG conformance. Manual Windows/NVDA and macOS/VoiceOver assessments remain pending.

### Important: Passing inline functions as renderers

If you define `optionRenderer` or `customRenderer` inline (like arrow function inside template), it may cause unnecessary re-creation in some frameworks.

**Highly recommended:** For best performance and to avoid potential issues, always use memoization or define functions outside the template:

```vue
<script setup>
// Define outside template
const myRenderer = (item, index, helpers) => {
  return document.createElement('div');
};
// Or computed if reactivity is required
</script>
```

Adapters are designed to not loop even without memoization, but stability still improves performance.

## Performance

- Incremental rendering is available for large flat lists; no production viewport-windowing guarantee is made
- Efficient DOM updates with Vue's reactivity
- Lazy loading with infinite scroll
- Optimized re-renders with computed values

## Browser Support

The current Phase 4 matrix uses pinned Chromium, Firefox, and WebKit builds; it does not certify every Vue/Nuxt integration or repository minimum version. See the [browser support policy](../../docs/compliance/BROWSER-SUPPORT.md) for declared compatibility targets.

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## License

MIT

## Contributing

See the main [repository](https://github.com/yourusername/smilodon) for contribution guidelines.
