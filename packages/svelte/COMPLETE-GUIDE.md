# @smilodon/svelte - Complete Guide

**Production-ready, accessible Select component for Svelte applications**

This guide provides comprehensive documentation for using Smilodon Select in Svelte applications, covering all features, styling options, and advanced use cases.

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
15. [Stores Integration](#stores-integration)
16. [Accessibility](#accessibility)
17. [Advanced Patterns](#advanced-patterns)
18. [Troubleshooting](#troubleshooting)

---

## Installation & Setup

### Installation

```bash
npm install @smilodon/svelte @smilodon/core
```

or with yarn:

```bash
yarn add @smilodon/svelte @smilodon/core
```

or with pnpm:

```bash
pnpm add @smilodon/svelte @smilodon/core
```

### Svelte Configuration

For SvelteKit projects, the component should work out of the box. For Vite-based Svelte projects:

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
});
```

### Basic Import

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';
  import type { SelectItem } from '@smilodon/core';
</script>
```

---

## Basic Usage

### Minimal Example

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  let selectedValue: string | number = '';
  const items = ['Apple', 'Banana', 'Cherry'];
</script>

<Select {items} bind:value={selectedValue} placeholder="Select a fruit..." />
```

### With Object Array

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';
  import type { SelectItem } from '@smilodon/core';

  let selectedValue: string | number = '';
  
  const items: SelectItem[] = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
  ];
</script>

<Select {items} bind:value={selectedValue} placeholder="Select a fruit..." />

{#if selectedValue}
  <p>Selected: {selectedValue}</p>
{/if}
```

---

## Complete Props Reference

### All Available Props

```typescript
interface SelectProps {
  // Required
  items: SelectItem[] | string[] | number[];
  
  // Value Management
  value?: string | number | (string | number)[];
  
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
  style?: string;
  
  // Advanced
  virtualization?: boolean;
  customRenderer?: (item: SelectItem, index: number) => string;
}
```

### Props Details

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `SelectItem[] \| string[] \| number[]` | **Required** | Array of items to display |
| `value` | `string \| number \| array` | `undefined` | Current selected value(s) - use `bind:value` |
| `multiple` | `boolean` | `false` | Enable multi-selection |
| `searchable` | `boolean` | `true` | Enable search functionality |
| `disabled` | `boolean` | `false` | Disable the select |
| `placeholder` | `string` | `'Select...'` | Placeholder text |
| `maxHeight` | `number` | `300` | Max dropdown height (px) |
| `estimatedItemHeight` | `number` | `48` | Estimated item height for virtualization |
| `class` | `string` | `undefined` | CSS class name |
| `style` | `string` | `undefined` | Inline styles (CSS variables) |
| `virtualization` | `boolean` | `true` | Enable virtual scrolling |
| `customRenderer` | `function` | `undefined` | Custom option renderer |

### Events

| Event | Detail | Description |
|-------|--------|-------------|
| `change` | `{ value }` | Fired when value changes |
| `open` | - | Fired when dropdown opens |
| `close` | - | Fired when dropdown closes |
| `search` | `{ query }` | Fired on search input |

---

## Input Formats

Smilodon accepts three input formats for maximum flexibility:

### 1. Object Array (SelectItem[])

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';
  import type { SelectItem } from '@smilodon/core';

  let selectedValue: string | number = '';

  const items: SelectItem[] = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'mx', label: 'Mexico' },
  ];
</script>

<Select {items} bind:value={selectedValue} />
```

### 2. String Array (Auto-converted)

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  let selectedValue = '';
  const items = ['Apple', 'Banana', 'Cherry', 'Date'];
</script>

<Select {items} bind:value={selectedValue} />
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

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  let selectedValue: number = 0;
  const items = [1, 2, 3, 5, 8, 13, 21];
</script>

<Select {items} bind:value={selectedValue} />
```

---

## Single Selection

### Basic Single Select

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';
  import type { SelectItem } from '@smilodon/core';

  let country: string | number = '';

  const countries: SelectItem[] = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'au', label: 'Australia' },
  ];
</script>

<Select {items}={countries} bind:value={country} placeholder="Select your country" />

{#if country}
  <p>Selected: {country}</p>
{/if}
```

### With Form Integration

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  let formData = {
    name: '',
    country: '',
    language: '',
  };

  function handleSubmit() {
    console.log('Form data:', formData);
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <label>
    Name:
    <input bind:value={formData.name} type="text" />
  </label>

  <label>
    Country:
    <Select
      items={['USA', 'Canada', 'Mexico', 'UK', 'Australia']}
      bind:value={formData.country}
      placeholder="Select country"
    />
  </label>

  <label>
    Language:
    <Select
      items={['English', 'Spanish', 'French', 'German']}
      bind:value={formData.language}
      placeholder="Select language"
    />
  </label>

  <button type="submit">Submit</button>
</form>
```

---

## Multi-Selection

### Basic Multi-Select

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';
  import type { SelectItem } from '@smilodon/core';

  let languages: (string | number)[] = [];

  const items: SelectItem[] = [
    { value: 'js', label: 'JavaScript' },
    { value: 'ts', label: 'TypeScript' },
    { value: 'py', label: 'Python' },
    { value: 'rs', label: 'Rust' },
    { value: 'go', label: 'Go' },
  ];
</script>

<Select {items} bind:value={languages} multiple placeholder="Select programming languages" />

<div>
  <strong>Selected ({languages.length}):</strong>
  {#if languages.length > 0}
    <ul>
      {#each languages as lang}
        <li>{lang}</li>
      {/each}
    </ul>
  {:else}
    <p>No languages selected</p>
  {/if}
</div>
```

### Multi-Select with Limit

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  let selected: (string | number)[] = [];
  const maxSelections = 3;

  $: if (selected.length > maxSelections) {
    selected = selected.slice(0, maxSelections);
  }
</script>

<Select
  items={['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange']}
  bind:value={selected}
  multiple
  placeholder="Select up to {maxSelections} colors"
/>

<p>{selected.length} / {maxSelections} selected</p>
```

---

## Searchable Select

### Basic Search

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';
  import type { SelectItem } from '@smilodon/core';

  let country: string | number = '';

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

<Select
  {items}={countries}
  bind:value={country}
  searchable
  placeholder="Search for a country..."
/>
```

### Search with Event Handler

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  let value = '';
  let searchQuery = '';

  function handleSearch(event: CustomEvent<{ query: string }>) {
    searchQuery = event.detail.query;
    console.log('Searching for:', searchQuery);
    // Optionally trigger API call, analytics, etc.
  }
</script>

<Select
  items={['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry']}
  bind:value
  searchable
  on:search={handleSearch}
  placeholder="Type to search..."
/>

{#if searchQuery}
  <p>Current search: {searchQuery}</p>
{/if}
```

---

## Grouped Options

### Basic Groups

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';
  import type { SelectItem } from '@smilodon/core';

  let value: string | number = '';

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

<Select {items} bind:value placeholder="Select food..." />
```

### Complex Grouped Structure

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';
  import type { SelectItem } from '@smilodon/core';

  let value: string | number = '';

  const technologies: SelectItem[] = [
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
  ];
</script>

<Select
  {items}={technologies}
  bind:value
  searchable
  placeholder="Select technology..."
/>
```

---

## Disabled States

### Disabled Select

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  let value = '';
</script>

<Select
  items={['Option 1', 'Option 2', 'Option 3']}
  bind:value
  disabled
  placeholder="This select is disabled"
/>
```

### Disabled Options

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';
  import type { SelectItem } from '@smilodon/core';

  let value: string | number = '';

  const items: SelectItem[] = [
    { value: '1', label: 'Available Option 1' },
    { value: '2', label: 'Available Option 2' },
    { value: '3', label: 'Disabled Option', disabled: true },
    { value: '4', label: 'Available Option 3' },
    { value: '5', label: 'Disabled Option 2', disabled: true },
  ];
</script>

<Select {items} bind:value placeholder="Some options are disabled" />
```

### Conditional Disabling

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  let value = '';
  let isLoading = false;

  async function handleChange(event: CustomEvent) {
    isLoading = true;
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    isLoading = false;
  }
</script>

<Select
  items={['Option 1', 'Option 2', 'Option 3']}
  bind:value
  disabled={isLoading}
  placeholder={isLoading ? 'Loading...' : 'Select an option'}
  on:change={handleChange}
/>

{#if isLoading}
  <p>Processing selection...</p>
{/if}
```

---

## Event Handling

### All Events

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  let value = '';
  let isOpen = false;
  let logs: string[] = [];

  function addLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    logs = [...logs, `[${timestamp}] ${message}`];
  }

  function handleChange(event: CustomEvent) {
    addLog(`Changed to: ${event.detail.value}`);
  }

  function handleOpen() {
    isOpen = true;
    addLog('Dropdown opened');
  }

  function handleClose() {
    isOpen = false;
    addLog('Dropdown closed');
  }

  function handleSearch(event: CustomEvent) {
    addLog(`Searching for: ${event.detail.query}`);
  }
</script>

<Select
  items={['Apple', 'Banana', 'Cherry']}
  bind:value
  on:change={handleChange}
  on:open={handleOpen}
  on:close={handleClose}
  on:search={handleSearch}
  placeholder="Select a fruit"
/>

<div>
  <p>Current value: {value || 'None'}</p>
  <p>Dropdown is: {isOpen ? 'Open' : 'Closed'}</p>
</div>

<div>
  <strong>Event Log:</strong>
  <ul style="max-height: 200px; overflow: auto;">
    {#each logs as log}
      <li>{log}</li>
    {/each}
  </ul>
</div>
```

---

## Styling & Theming

### Inline Styles with CSS Variables

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  let value = '';
</script>

<Select
  items={['Red', 'Blue', 'Green']}
  bind:value
  style="
    --select-input-border: 2px solid #3b82f6;
    --select-input-border-radius: 8px;
    --select-input-focus-border: #2563eb;
    --select-option-hover-bg: #dbeafe;
    --select-option-selected-bg: #3b82f6;
    --select-option-selected-color: white;
    --select-badge-bg: #3b82f6;
  "
/>
```

### Complete CSS Variables Reference

```svelte
<Select
  items={['Option 1', 'Option 2', 'Option 3']}
  bind:value
  style="
    --select-input-gap: 6px;
    --select-input-padding: 6px 52px 6px 8px;
    --select-input-min-height: 44px;
    --select-input-bg: white;
    --select-input-border: 1px solid #d1d5db;
    --select-input-border-radius: 6px;
    --select-input-focus-border: #667eea;
    --select-input-focus-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    
    --select-input-min-width: 120px;
    --select-input-field-padding: 4px;
    --select-input-font-size: 14px;
    --select-input-line-height: 1.5;
    --select-input-color: #1f2937;
    --select-input-placeholder-color: #9ca3af;
    
    --select-arrow-width: 40px;
    --select-arrow-size: 16px;
    --select-arrow-color: #667eea;
    --select-arrow-hover-bg: rgba(102, 126, 234, 0.08);
    
    --select-separator-width: 1px;
    --select-separator-height: 60%;
    --select-separator-gradient: linear-gradient(to bottom, transparent, #ccc, transparent);
    
    --select-badge-bg: #667eea;
    --select-badge-color: white;
    --select-badge-border-radius: 4px;
    --select-badge-remove-bg: rgba(255, 255, 255, 0.3);
    --select-badge-remove-hover-bg: rgba(255, 255, 255, 0.5);
    
    --select-dropdown-border-radius: 4px;
    --select-dropdown-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    
    --select-option-padding: 8px 12px;
    --select-option-hover-bg: #f3f4f6;
    --select-option-selected-bg: #e0e7ff;
    --select-option-selected-color: #4338ca;
  "
/>
```

### Theme Examples

#### Bootstrap Theme

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  let value = '';
</script>

<Select
  items={['Option 1', 'Option 2', 'Option 3']}
  bind:value
  style="
    --select-input-border: 1px solid #ced4da;
    --select-input-border-radius: 0.375rem;
    --select-input-focus-border: #86b7fe;
    --select-input-focus-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
    --select-option-hover-bg: #e9ecef;
    --select-option-selected-bg: #0d6efd;
    --select-option-selected-color: white;
    --select-badge-bg: #0d6efd;
  "
/>
```

#### Material Design Theme

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  let value = '';
</script>

<Select
  items={['Option 1', 'Option 2', 'Option 3']}
  bind:value
  style="
    --select-input-border-radius: 4px;
    --select-input-focus-border: #1976d2;
    --select-dropdown-shadow: 0 2px 4px rgba(0,0,0,0.2), 0 4px 5px rgba(0,0,0,0.14);
    --select-option-padding: 16px;
    --select-option-hover-bg: rgba(0, 0, 0, 0.04);
    --select-option-selected-bg: #e3f2fd;
    --select-option-selected-color: #1976d2;
    --select-badge-bg: #1976d2;
    --select-badge-border-radius: 16px;
  "
/>
```

#### Dark Mode Theme

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  let value = '';
</script>

<Select
  items={['Option 1', 'Option 2', 'Option 3']}
  bind:value
  class="dark-mode"
  style="
    --select-input-bg: #1f2937;
    --select-input-border: 1px solid #4b5563;
    --select-input-color: #f9fafb;
    --select-dropdown-bg: #1f2937;
    --select-options-bg: #1f2937;
    --select-option-color: #f9fafb;
    --select-option-bg: #1f2937;
    --select-option-hover-bg: #374151;
    --select-option-selected-bg: #3730a3;
    --select-badge-bg: #4f46e5;
  "
/>
```

### External CSS with Scoped Styles

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  let value = '';
</script>

<Select
  items={['Option 1', 'Option 2', 'Option 3']}
  bind:value
  class="custom-select"
/>

<style>
  :global(.custom-select) {
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

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';
  import type { SelectItem } from '@smilodon/core';

  interface User extends SelectItem {
    value: string;
    label: string;
    email: string;
    avatar: string;
  }

  let selectedUser: string | number = '';

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

  function customRenderer(item: SelectItem): string {
    const user = item as User;
    return `
      <div style="display: flex; align-items: center; gap: 12px;">
        <img 
          src="${user.avatar}" 
          alt="${user.label}"
          style="width: 32px; height: 32px; border-radius: 50%;"
        />
        <div>
          <div style="font-weight: 500;">${user.label}</div>
          <div style="font-size: 12px; color: #6b7280;">${user.email}</div>
        </div>
      </div>
    `;
  }
</script>

<Select
  {items}={users}
  bind:value={selectedUser}
  {customRenderer}
  placeholder="Select a user"
  estimatedItemHeight={60}
/>
```

---

## Performance Optimization

### Virtualization for Large Datasets

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  let value = '';

  // Generate 100,000 items
  const items = Array.from({ length: 100_000 }, (_, i) => ({
    value: `item-${i}`,
    label: `Item ${i + 1}`,
  }));
</script>

<Select
  {items}
  bind:value
  virtualization={true}
  estimatedItemHeight={48}
  placeholder="Search 100k items..."
  searchable
/>
```

### Reactive Statements for Filtering

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';
  import type { SelectItem } from '@smilodon/core';

  let value = '';
  let searchFilter = '';

  const rawItems: SelectItem[] = [
    { value: '1', label: 'Apple' },
    { value: '2', label: 'Banana' },
    { value: '3', label: 'Cherry' },
    // ... many more items
  ];

  // Only recalculate when rawItems or searchFilter changes
  $: filteredItems = searchFilter
    ? rawItems.filter(item =>
        item.label.toLowerCase().includes(searchFilter.toLowerCase())
      )
    : rawItems;
</script>

<Select {items}={filteredItems} bind:value />
```

---

## TypeScript Integration

### Full Type Safety

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';
  import type { SelectItem } from '@smilodon/core';

  // Define your data type
  interface Product extends SelectItem {
    value: string;
    label: string;
    price: number;
    category: string;
  }

  let selectedId: string = '';

  const products: Product[] = [
    { value: 'p1', label: 'Laptop', price: 999, category: 'Electronics' },
    { value: 'p2', label: 'Phone', price: 699, category: 'Electronics' },
    { value: 'p3', label: 'Desk', price: 299, category: 'Furniture' },
  ];

  function handleChange(event: CustomEvent<{ value: string | number }>) {
    selectedId = event.detail.value as string;
    const product = products.find(p => p.value === selectedId);
    if (product) {
      console.log('Selected product:', product.label, 'Price:', product.price);
    }
  }
</script>

<Select
  {items}={products}
  bind:value={selectedId}
  on:change={handleChange}
  placeholder="Select a product"
/>
```

---

## Stores Integration

### With Svelte Stores

```typescript
// stores.ts
import { writable, derived } from 'svelte/store';
import type { SelectItem } from '@smilodon/core';

export const items = writable<SelectItem[]>([
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
]);

export const selectedValue = writable<string | number>('');

export const selectedItem = derived(
  [items, selectedValue],
  ([$items, $selectedValue]) => 
    $items.find(item => item.value === $selectedValue)
);
```

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';
  import { items, selectedValue, selectedItem } from './stores';
</script>

<Select {items}={$items} bind:value={$selectedValue} />

{#if $selectedItem}
  <p>Selected: {$selectedItem.label}</p>
{/if}
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

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  let country = '';
</script>

<label id="country-label">Country</label>
<Select
  items={['USA', 'Canada', 'Mexico']}
  bind:value={country}
  placeholder="Select your country"
/>
```

---

## Advanced Patterns

### Dependent Selects

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  let country = '';
  let state = '';
  let states: string[] = [];

  const countries = ['USA', 'Canada', 'Mexico'];

  // Reactive statement to update states when country changes
  $: {
    state = ''; // Reset state when country changes
    
    if (country === 'USA') {
      states = ['California', 'Texas', 'New York', 'Florida'];
    } else if (country === 'Canada') {
      states = ['Ontario', 'Quebec', 'British Columbia'];
    } else if (country === 'Mexico') {
      states = ['Mexico City', 'Jalisco', 'Nuevo León'];
    } else {
      states = [];
    }
  }
</script>

<Select
  items={countries}
  bind:value={country}
  placeholder="Select country"
/>

<Select
  {items}={states}
  bind:value={state}
  disabled={!country}
  placeholder={country ? 'Select state' : 'Select country first'}
/>
```

### Async Data Loading

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { Select } from '@smilodon/svelte';
  import type { SelectItem } from '@smilodon/core';

  let items: SelectItem[] = [];
  let loading = true;
  let value = '';

  onMount(async () => {
    loading = true;
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    items = [
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2' },
      { value: '3', label: 'Option 3' },
    ];
    
    loading = false;
  });
</script>

{#if loading}
  <div>Loading options...</div>
{:else}
  <Select {items} bind:value placeholder="Select an option" />
{/if}
```

### With Context API

```svelte
<!-- Parent.svelte -->
<script lang="ts">
  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import type { SelectItem } from '@smilodon/core';

  const items = writable<SelectItem[]>([
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
  ]);

  const selectedValue = writable('');

  setContext('select', { items, selectedValue });
</script>

<slot />
```

```svelte
<!-- Child.svelte -->
<script lang="ts">
  import { getContext } from 'svelte';
  import { Select } from '@smilodon/svelte';

  const { items, selectedValue } = getContext('select');
</script>

<Select {items}={$items} bind:value={$selectedValue} />
```

---

## Troubleshooting

### Common Issues

#### Issue: bind:value not updating

```svelte
<!-- ❌ Wrong - missing bind: -->
<Select items={items} value={selectedValue} />

<!-- ✅ Correct -->
<Select items={items} bind:value={selectedValue} />
```

#### Issue: Multi-select type error

```svelte
<script lang="ts">
  // ❌ Wrong - value should be array for multiple
  let value = '';

  // ✅ Correct
  let value: (string | number)[] = [];
</script>

<Select items={items} bind:value multiple />
```

#### Issue: Styles not applying

```svelte
<!-- ❌ Wrong - missing quotes in style -->
<Select items={items} style=--select-input-border: 2px solid red />

<!-- ✅ Correct -->
<Select items={items} style="--select-input-border: 2px solid red;" />
```

### Performance Issues

If you experience slow rendering with large datasets:

1. Enable virtualization (enabled by default)
2. Use reactive statements (`$:`) for computed items
3. Increase `estimatedItemHeight` if items are taller than 48px

```svelte
<script lang="ts">
  $: items = generateLargeDataset();
</script>

<Select
  {items}
  bind:value
  virtualization={true}
  estimatedItemHeight={48}
/>
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
