# @smilodon/svelte

Select component for Svelte applications. The shared core has scoped automated Phase 4 browser coverage; exhaustive Svelte integration parity and manual assistive-technology certification remain unverified. Part of the [Smilodon](https://github.com/navidrezadoost/smilodon) UI toolkit.

> Large-list status: the public `virtualized` prop enables legacy chunked rendering for large flat lists; it does not window rows to the viewport, and all results may eventually be mounted. True viewport virtualization remains guarded by a private test seam and is not a supported production mode. The shared core passed its scoped Phase 4 automated browser matrix in Chromium, Firefox, and WebKit; this does not establish exhaustive Svelte integration parity, minimum-browser-version support, or WCAG conformance. Manual assistive-technology assessment remains pending. See the [current limitation record](../../docs/KNOWN-LIMITATIONS.md#viewport-virtualization-status).

## 📖 Documentation

**Live documentation & interactive examples:** [navidrezadoost.github.io/Smilodon](https://navidrezadoost.github.io/Smilodon/)

**Framework integration (Vue 3, Nuxt 4, React, SSR, Vite):** [`docs/FRAMEWORK-INTEGRATION.md`](../../docs/FRAMEWORK-INTEGRATION.md)

**For comprehensive documentation covering all features, styling options, and advanced patterns:**

👉 **[Complete Svelte Guide](./COMPLETE-GUIDE.md)** 👈

The Quick Start and examples with a complete `<script>` block are intended to stand alone. Short renderer, accessibility, and troubleshooting examples are explicitly identified as fragments when they rely on surrounding component state.

The complete guide includes:
- ✅ Complete styling token coverage for colors, layout, chips, motion, and accessibility
- ✅ Svelte-specific patterns (reactive statements, stores, bind:value)
- ✅ Complete API reference with TypeScript types
- ✅ Svelte stores integration (writable, derived)
- ✅ DOM option renderers returning `HTMLElement` values; do not return HTML strings
- ✅ Theme examples with :global() styling
- ✅ Advanced patterns (Context API, reactive dependencies)
- ✅ Troubleshooting and accessibility information

---

## Features

- `optionRenderer` is the Svelte adapter's DOM renderer prop and must return an `HTMLElement`. There is no HTML-string template prop on this adapter.

### Advanced scenarios (Svelte)
- **Accessibility labels**: use a literal `aria-label` for the internal combobox; host IDREF attributes are not forwarded across the shadow boundary. A neighboring external label is not proof of native label association:
  ```svelte
  <label for="city-picker">City</label>
  <Select id="city-picker" aria-label="City" />
  ```
- **Server-side lookup**:
  ```svelte
  <!-- Fragment: assumes items and handleSearch are declared in this component. -->
  <Select {items} searchable on:search={handleSearch} />
  ```
- **Large flat lists**: the public setting enables chunked rendering, not viewport windowing:
  ```svelte
  <script>
    export let items = Array.from({ length: 100_000 }, (_, i) => ({ value: i, label: `Item ${i}` }));
  </script>
  <Select {items} virtualized />
  ```

- ✨ **Single & Multi-Select** - Choose one or multiple options
- 🔍 **Searchable** - Filter options with built-in or custom search
- ♿ **Accessibility behaviors** - Shared-core scenarios passed in the scoped Chromium/Firefox/WebKit Phase 4 matrix; exhaustive Svelte adapter parity, manual AT, and WCAG conformance are not established
- ⚡ **Large-list chunk rendering** - Incrementally render large flat lists; not viewport windowing
- 📜 **Infinite Scroll** - Load data progressively
- 👥 **Grouped Options** - Organize options into categories
- 🎨 **Customizable** - Style with CSS variables or custom themes
- 📦 **Bundle guidance** - No version-specific bundle-size measurement is claimed; measure your published entry and bundler output if size is a release requirement
- 🔧 **TypeScript** - Full type safety included

## Installation

```bash
npm install @smilodon/svelte @smilodon/core
```

## SvelteKit / SSR Notes

The adapter imports the core package and performs imperative element work from its browser lifecycle. This helps avoid server-only DOM access, but does not by itself certify SSR/hydration behavior across all SvelteKit versions, render modes, or bundler configurations.

### Recommended pattern

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { Select } from '@smilodon/svelte';

  let items = [];
  let value = [];

  onMount(async () => {
    items = await fetch('/api/frameworks').then((response) => response.json());
  });
</script>

<Select {items} bind:value searchable multiple clearable />
```

### SSR guidance

- Avoid direct `window`, `document`, or custom-element access outside `onMount()`.
- Use `bind:value` for regular selection flow and exported instance methods for imperative control.
- Prefer `optionRenderer` when you need DOM-driven custom options and plain markup when you do not.
- If your SSR/hydration setup reports mismatches, keep this interactive control behind the framework's client-only lifecycle boundary and verify the exact production build mode.

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

## Clear Control (Reset Selected/Search Value)

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  let value = '';
  const items = [
    { value: 'js', label: 'JavaScript' },
    { value: 'py', label: 'Python' },
    { value: 'rs', label: 'Rust' },
  ];
</script>

<Select
  {items}
  bind:value
  searchable
  clearable
  clearSelectionOnClear
  clearSearchOnClear
  clearAriaLabel="Clear selected and searched values"
  clearIcon="✕"
  on:clear={(e) => console.log('cleared', e.detail)}
/>
```

Styling hooks: `::part(clear-button)` and `::part(clear-icon)` plus `--select-clear-*` CSS tokens.

An empty clearable field reserves no clear-button space by default. The control and its coordinated input/arrow spacing appear when a selected value or enabled search query can be cleared, then disappear once both targets are empty. This describes the shared runtime's intended behavior across single/multi-select and LTR/RTL configurations, not exhaustive Svelte integration certification.

Use full config passthrough when a permanently visible disabled-when-empty action is required:

```svelte
<Select
  {items}
  bind:value
  clearable
  config={{ clearControl: { hideWhenEmpty: false } }}
/>
```

The `clear` event reports `clearedSelection` and `clearedSearch`. Style the control through its parts and `--select-clear-*` tokens rather than permanent input padding.

## Direction and option-state controls

The Svelte adapter exposes the same runtime controls as the shared core:

```svelte
<Select
  {items}
  bind:value
  direction="rtl"
  removeButtonIcon="−"
  disabledOptionBehavior={{ hoverable: true, focusable: true, selectable: false }}
  showSelectedIndicator={false}
/>
```

- `direction` switches the instance between `ltr` and `rtl`
- `removeButtonIcon` replaces the chip remove icon with text or inline SVG markup
- `disabledOptionBehavior` controls whether dimmed options can still be hovered, focused, or selected
- `showSelectedIndicator` hides or shows the selected side indicator without internal selector overrides

## Core config parity and global defaults

The Svelte adapter now accepts the same advanced runtime configuration model as the shared core.

### Convenience props

Use the Svelte props below for the most common advanced core features:

- `selectionConfig`
- `multiSelectDisplay`
- `scrollToSelected`
- `styles`
- `config`

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  let value: Array<string | number> = ['react', 'solid'];
  const items = [
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue' },
    { value: 'svelte', label: 'Svelte' },
    { value: 'solid', label: 'Solid' },
  ];
</script>

<Select
  {items}
  bind:value
  multiple
  searchable
  multiSelectDisplay={{
    mode: 'horizontal',
    maxHeight: '56px',
    overflowX: 'auto',
    overflowY: 'hidden',
    dragScroll: true,
  }}
  selectionConfig={{
    closeOnSelect: false,
    toggleOnTriggerClick: true,
  }}
  styles={{
    badgeRemoveIcon: {
      color: '#dc2626',
      transform: 'scale(1.1)',
    },
  }}
  removeButtonIcon="−"
  placeholder="Select frameworks"
/>
```

### Full `config` passthrough

```svelte
<Select
  {items}
  bind:value
  multiple
  config={{
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
  }}
/>
```

### Global defaults from `@smilodon/svelte`

```ts
import { configureSelect } from '@smilodon/svelte';

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
```

### `bind:this` runtime methods

The Svelte component exports additional runtime helpers beyond `open()` and `clear()`.

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  let picker: Select;

  function runRuntimeActions() {
    picker?.clearSearch();
    picker?.updateCoreConfig({ selection: { showSelectedIndicator: false } });
    picker?.setError('Please review this field');
    console.log(picker?.validate());
  }
</script>

<Select bind:this={picker} {items} required searchable />
<button on:click={runRuntimeActions}>Run runtime actions</button>
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

  let country: string | number = '';
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

  let languages: Array<string | number> = [];
</script>

<Select
  {items}
  bind:value={languages}
  multiple
  placeholder="Select languages..."
/>
```

### Grouped Options

Svelte uses the core grouped-data contract `{ label, options }`. This differs from the Vanilla helper contract `{ group, items }`; do not copy the Vanilla shape into a Svelte `groupedItems` prop.

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

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

  let food: string | number = '';
</script>

<Select {groupedItems} bind:value={food} />
```

### Infinite Scroll

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  const pageSize = 50;
  const total = 500;
  let items = makeItems(1, pageSize);
  let loading = false;
  const loadedPages = new Set<number>([1]);

  function handleLoadMore(event: CustomEvent<{ page: number }>) {
    const requestedPage = event.detail.page;
    if (loading || loadedPages.has(requestedPage) || items.length >= total) return;
    loading = true;
    const start = items.length + 1;
    const count = Math.min(pageSize, total - items.length);
    items = [...items, ...makeItems(start, count)];
    loadedPages.add(requestedPage);
    loading = false;
  }

  function makeItems(start: number, count: number) {
    return Array.from({ length: count }, (_, i) => ({
      value: start + i,
      label: `Item ${start + i}`,
    }));
  }
</script>

<Select
  {items}
  infiniteScroll
  pageSize={pageSize}
  on:loadMore={handleLoadMore}
  placeholder="Scroll to load more..."
/>
```

This local example guards synchronous repeated callbacks and fills consecutive item ranges (1–50, 51–100, and so on). For remote pagination, keep the guard active until the request settles, handle errors and server end-of-data, and track pages so duplicate events cannot append the same page twice. The component forwards a `loadMore` event; the host owns data transport and state.

### Incremental Chunk Rendering (Large Datasets)

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
  placeholder="100k items with incremental chunk rendering..."
/>
```

### Server-Side Search

```svelte
<script lang="ts">
  import { Select, type SelectItem } from '@smilodon/svelte';
  import { onDestroy } from 'svelte';

  let items: SelectItem[] = [];
  let isLoading = false;
  let searchError = '';
  let controller: AbortController | undefined;
  let requestId = 0;

  async function handleSearch(event: CustomEvent<{ query: string }>) {
    const query = event.detail.query;
    const id = ++requestId;
    controller?.abort();
    
    if (!query) {
      items = [];
      isLoading = false;
      searchError = '';
      return;
    }

    const current = new AbortController();
    controller = current;
    isLoading = true;
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: current.signal });
      if (!response.ok) throw new Error(`Search failed: ${response.status}`);
      const data = await response.json() as { results: SelectItem[] };
      if (id === requestId) { items = data.results; searchError = ''; }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError') && id === requestId) searchError = String(error);
    } finally {
      if (id === requestId) isLoading = false;
    }
  }
  onDestroy(() => controller?.abort());
</script>

<Select
  {items}
  searchable
  on:search={handleSearch}
  placeholder="Type to search..."
/>
{#if isLoading}<p role="status">Searching…</p>{/if}
{#if searchError}<p role="alert">{searchError}</p>{/if}
```

The `search` callback can fire rapidly while typing. Cancellation plus a request sequence check prevents a slower old response from replacing newer results. Render `isLoading` and `searchError` in the host UI as needed; Smilodon does not own the network request.

### Controlled Component

Use `bind:value` when the Svelte component's two-way binding is the intended state contract. Use explicit `value` plus `on:change` when the parent/store owns updates, and pass a changed value back to the component. `defaultValue` is for an initial value that the component then manages; do not mix these models in one example.

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  const items = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
  ];

  let status: string | number = 'draft';

  function handleChange(event: CustomEvent<{ value: string | number | (string | number)[] }>) {
    console.log('Status changed:', event.detail.value);
    const next = event.detail.value;
    status = Array.isArray(next) ? next[0] ?? '' : next;
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

  let selectRef: { open: () => void; clear: () => void } | undefined;
  const items = [{ value: 'alpha', label: 'Alpha' }];

  function programmaticOpen() {
    selectRef?.open();
  }

  function programmaticClear() {
    selectRef?.clear();
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
| `virtualized` | `boolean` | `true` | Enable legacy chunked rendering for large flat lists; not viewport windowing |
| `maxSelections` | `number` | `undefined` | Max selections (multi-select) |
| `placement` | `'bottom' \| 'top' \| 'auto'` | `'auto'` | Dropdown placement |
| `className` | `string` | `''` | Custom CSS class |
| `style` | `string` | `''` | Custom inline styles |
| `selectionConfig`, `multiSelectDisplay`, `scrollToSelected`, `styles`, `config` | core configuration types | - | Shared runtime configuration groups |
| `optionRenderer` | `(item, index, helpers) => HTMLElement` | - | DOM option renderer; must return an element, not an HTML string |
| `clearable`, `clearSelectionOnClear`, `clearSearchOnClear`, `clearAriaLabel`, `clearIcon` | booleans / strings | - | Clear-control configuration |
| `trackingEnabled`, `trackEvents`, `trackStyling`, `trackLimitations`, `emitDiagnostics`, `trackingMaxEntries`, `limitationPolicies`, `autoMitigateRuntimeModeSwitch` | documented tracking/limitation types | - | Runtime diagnostics and limitation policies |

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
| `clear` | `{ clearedSelection, clearedSearch }` | Clear control used |
| `diagnostic` | Diagnostic detail | Runtime diagnostics enabled |

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
| `clearSearch()` | `() => void` | Clear the search query |
| `updateCoreConfig()` | `(config: Partial<GlobalSelectConfig>) => void` | Apply core runtime configuration |
| `setError()` / `clearError()` | message / no arguments | Set or clear validation error state |
| `setRequiredState()` | `(required: boolean) => void` | Change required state |
| `validate()` | `() => boolean` | Validate current state |
| `getCapabilities()` / `getKnownLimitations()` | reports | Read capabilities and current limitations |
| `getTrackingSnapshot()` / `clearTracking(source?)` | snapshot / source | Inspect or clear tracking data |
| `setLimitationPolicies()` | `(policies) => void` | Set limitation-handling policies |

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
  label: string;
  options: SelectItem[];
}
```

---

## 🎯 Two Ways to Specify Options

Smilodon Svelte provides **two powerful approaches** for defining select options, each optimized for different use cases:

### Method 1: Data-Driven (Object Arrays) 📊

**Use when**: You have structured data and want simple, declarative option rendering.

**Advantages**:
- ✅ Simple and declarative - Svelte-friendly
- ✅ Auto-conversion from strings/numbers
- ✅ Perfect for basic dropdowns
- ✅ Works seamlessly with Svelte stores
- ✅ Suitable for host-managed datasets whose scale has been measured in the target application; no millions-of-items or constant-DOM guarantee is made
- ✅ Built-in search and filtering
- ✅ Full TypeScript type safety

**Examples**:

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  // Example 1: Simple object array
  let value = '';

  const items = [
    { value: '1', label: 'Apple' },
    { value: '2', label: 'Banana' },
    { value: '3', label: 'Cherry' }
  ];
</script>

<Select
  items={items}
  bind:value
  placeholder="Select a fruit..."
/>
```

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  // Example 2: With metadata and disabled options
  let country = '';

  const countries = [
    { value: 'us', label: 'United States', disabled: false },
    { value: 'ca', label: 'Canada', disabled: false },
    { value: 'mx', label: 'Mexico', disabled: true }
  ];
</script>

<Select
  items={countries}
  bind:value={country}
  placeholder="Select a country..."
/>
```

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  // Example 3: With grouping
  let food = '';

  const foods = [
    { value: 'apple', label: 'Apple', group: 'Fruits' },
    { value: 'banana', label: 'Banana', group: 'Fruits' },
    { value: 'carrot', label: 'Carrot', group: 'Vegetables' },
    { value: 'broccoli', label: 'Broccoli', group: 'Vegetables' }
  ];
</script>

<Select
  items={foods}
  bind:value={food}
  placeholder="Select food..."
/>
```

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  // Example 4: Auto-conversion from strings
  let color = '';
  const colors = ['Red', 'Green', 'Blue', 'Yellow'];
</script>

<Select
  items={colors}
  bind:value={color}
  placeholder="Select a color..."
/>
```

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  // Example 5: Auto-conversion from numbers
  let size: number | string = '';
  const sizes = [10, 20, 30, 40, 50];
</script>

<Select
  items={sizes}
  bind:value={size}
  placeholder="Select size..."
/>
```

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  // Example 6: Large datasets with reactive statement
  let id = '';

  $: items = Array.from({ length: 100_000 }, (_, i) => ({
    value: i.toString(),
    label: `Item ${i + 1}`
  }));
</script>

<Select
  items={items}
  bind:value={id}
  virtualized
  placeholder="Select from 100K items..."
/>
```

### Method 2: Component-Driven (Custom Renderers) 🎨

**Use when**: You need richer text, images, icons, badges, or multi-line option content with custom styling. The option remains one listbox option: do not put nested buttons, links, or other independently interactive controls inside it.

**Advantages**:
- ✅ Full control over option rendering
- ✅ Rich content (images, icons, badges, multi-line text)
- ✅ Custom HTML and styling
- ✅ Reactive data binding
- ✅ Conditional rendering based on item data
- ✅ Works with Svelte stores
- ✅ Perfect for complex UIs (user cards, product listings, etc.)

**How it works**: Provide the exported `optionRenderer` prop and return an `HTMLElement` for each option. Build nodes with DOM APIs and put labels or other untrusted data in `textContent`; the Svelte adapter does not accept HTML strings as renderer output.

**Examples**:

```svelte
<script lang="ts">
  import { Select, type SelectItem } from '@smilodon/svelte';

  // Example 1: Simple custom template with icons
  interface Language extends SelectItem {
    icon: string;
    description: string;
  }

  let lang = '';

  const languages: Language[] = [
    { value: 'js', label: 'JavaScript', icon: '🟨', description: 'Dynamic scripting language' },
    { value: 'py', label: 'Python', icon: '🐍', description: 'General-purpose programming' },
    { value: 'rs', label: 'Rust', icon: '🦀', description: 'Systems programming language' }
  ];

  const languageRenderer = (item: Language, index: number): HTMLElement => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:12px';
    const icon = document.createElement('span');
    icon.style.fontSize = '24px'; icon.textContent = item.icon;
    const content = document.createElement('div');
    const title = document.createElement('strong'); title.textContent = item.label;
    const description = document.createElement('small');
    description.style.cssText = 'display:block;font-size:12px;color:#6b7280';
    description.textContent = item.description;
    content.append(title, description); row.append(icon, content);
    return row;
  };
</script>

<Select
  items={languages}
  bind:value={lang}
  optionRenderer={languageRenderer}
  placeholder="Select a language..."
/>
```

```svelte
<script lang="ts">
  import { Select, type SelectItem } from '@smilodon/svelte';

  // Example 2: User selection with avatars
  interface User extends SelectItem {
    email: string;
    avatar: string;
    role: 'Admin' | 'User' | 'Moderator';
  }

  let userId = '';

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

  const userRenderer = (item: User): HTMLElement => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:12px;padding:4px 0';
    const image = document.createElement('img');
    // Only use avatar URLs from a trusted/validated source.
    image.src = item.avatar; image.alt = ''; image.setAttribute('aria-hidden', 'true');
    image.style.cssText = 'width:40px;height:40px;border-radius:50%;object-fit:cover';
    const details = document.createElement('div'); details.style.flex = '1';
    const name = document.createElement('strong'); name.style.color = '#1f2937'; name.textContent = item.label;
    const email = document.createElement('div'); email.style.cssText = 'font-size:13px;color:#6b7280'; email.textContent = item.email;
    details.append(name, email);
    const role = document.createElement('span'); role.textContent = item.role;
    role.style.cssText = `padding:4px 8px;border-radius:12px;font-size:11px;font-weight:600;background:${item.role === 'Admin' ? '#dbeafe' : '#f3f4f6'};color:${item.role === 'Admin' ? '#1e40af' : '#374151'}`;
    row.append(image, details, role);
    return row;
  };
</script>

<Select
  items={users}
  bind:value={userId}
  optionRenderer={userRenderer}
  placeholder="Select a user..."
/>
```

```svelte
<script lang="ts">
  import { Select, type SelectItem } from '@smilodon/svelte';

  // Example 3: Product selection with images and pricing
  interface Product extends SelectItem {
    price: number;
    stock: number;
    image: string;
    badge?: string;
  }

  let productId = '';

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

  const productRenderer = (item: Product): HTMLElement => {
    const row = document.createElement('div');
    row.style.cssText = `display:flex;align-items:center;gap:12px;opacity:${item.stock === 0 ? '0.5' : '1'}`;
    const image = document.createElement('img');
    // Only use image URLs from a trusted/validated source.
    image.src = item.image; image.alt = ''; image.setAttribute('aria-hidden', 'true');
    image.style.cssText = 'width:60px;height:60px;border-radius:8px;object-fit:cover;border:1px solid #e5e7eb';
    const content = document.createElement('div'); content.style.flex = '1';
    const heading = document.createElement('div'); heading.style.cssText = 'display:flex;align-items:center;gap:8px';
    const title = document.createElement('strong'); title.style.color = '#1f2937'; title.textContent = item.label;
    heading.append(title);
    if (item.badge) {
      const badge = document.createElement('span'); badge.textContent = item.badge;
      badge.style.cssText = `padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;background:${item.badge === 'Best Seller' ? '#dcfce7' : '#fee2e2'};color:${item.badge === 'Best Seller' ? '#166534' : '#991b1b'}`;
      heading.append(badge);
    }
    const metadata = document.createElement('div');
    metadata.style.cssText = 'margin-top:4px;display:flex;justify-content:space-between;align-items:center';
    const price = document.createElement('strong'); price.style.cssText = 'font-size:16px;color:#059669'; price.textContent = `$${item.price.toFixed(2)}`;
    const stock = document.createElement('span'); stock.style.cssText = 'font-size:12px;color:#6b7280';
    stock.textContent = item.stock > 0 ? `${item.stock} in stock` : 'Out of stock';
    metadata.append(price, stock); content.append(heading, metadata); row.append(image, content);
    return row;
  };
</script>

<Select
  items={products}
  bind:value={productId}
  optionRenderer={productRenderer}
  placeholder="Select a product..."
/>
```

```svelte
<script lang="ts">
  import { Select, type SelectItem } from '@smilodon/svelte';

  // Example 4: Status indicators with conditional styling
  interface Task extends SelectItem {
    status: 'completed' | 'in-progress' | 'pending';
    priority: 'high' | 'medium' | 'low';
    assignee: string;
  }

  let taskId = '';

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

  const taskRenderer = (item: Task): HTMLElement => {
    const status = statusConfig[item.status];
    const row = document.createElement('div'); row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:4px 0';
    const icon = document.createElement('div'); icon.textContent = status.icon;
    icon.style.cssText = `width:24px;height:24px;border-radius:50%;background:${status.bg};color:${status.color};display:flex;align-items:center;justify-content:center;font-weight:bold`;
    const details = document.createElement('div'); details.style.flex = '1';
    const title = document.createElement('strong'); title.style.color = '#1f2937'; title.textContent = item.label;
    const assignee = document.createElement('div'); assignee.style.cssText = 'font-size:12px;color:#6b7280;margin-top:2px';
    assignee.textContent = `Assigned to ${item.assignee}`;
    details.append(title, assignee);
    const priority = document.createElement('span');
    priority.title = `${item.priority} priority`;
    priority.style.cssText = `width:8px;height:8px;border-radius:50%;background:${priorityColors[item.priority]}`;
    row.append(icon, details, priority);
    return row;
  };
</script>

<Select
  items={tasks}
  bind:value={taskId}
  optionRenderer={taskRenderer}
  placeholder="Select a task..."
/>
```

```svelte
<script lang="ts">
  import { Select, type SelectItem } from '@smilodon/svelte';
  import { writable } from 'svelte/store';

  // Example 5: Using Svelte stores
  interface Tag extends SelectItem {
    color: string;
    count: number;
  }

  const tag = writable('');

  const tags: Tag[] = [
    { value: 'react', label: 'React', color: 'blue', count: 1250 },
    { value: 'vue', label: 'Vue', color: 'green', count: 850 },
    { value: 'angular', label: 'Angular', color: 'red', count: 420 }
  ];

  const tagRenderer = (item: Tag): HTMLElement => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px';
    const details = document.createElement('div'); details.style.cssText = 'display:flex;align-items:center;gap:8px';
    const marker = document.createElement('span');
    marker.style.cssText = `width:12px;height:12px;border-radius:50%;background:${item.color}`;
    const label = document.createElement('strong'); label.style.color = '#1f2937'; label.textContent = item.label;
    const count = document.createElement('span'); count.style.cssText = 'font-size:14px;color:#6b7280';
    count.textContent = `${item.count} posts`;
    details.append(marker, label); row.append(details, count);
    return row;
  };
</script>

<Select
  items={tags}
  bind:value={$tag}
  optionRenderer={tagRenderer}
  placeholder="Select a tag..."
/>
```

### Comparison: When to Use Each Method

| Feature | Method 1: Object Arrays | Method 2: Custom Renderers |
|---------|------------------------|---------------------------|
| **Setup** | Pass an array of option data | Provide a renderer callback |
| **Rendering behavior** | Shared runtime renders option labels | Adapter uses the documented HTMLElement renderer |
| **Customization** | Data-driven labels and state | Custom non-interactive content; nested controls are not promised |
| **Svelte integration** | Bound values and Svelte component events | Same adapter API with custom DOM-rendered content |
| **Reactive state** | Bind or control the value using the documented contract | Renderer output follows the adapter's renderer lifecycle |
| **TypeScript** | Typed item data and props | Typed renderer callback and props |
| **Very large datasets** | No 1M-item certification or performance comparison is claimed | No 1M-item certification or performance comparison is claimed |
| **Choosing a method** | Direct for simple options | Use when custom content is required |

**Best Practices**:

✅ **Use Method 1 (Object Arrays) when**:
- You need simple text-based options
- You have a large dataset and will profile the workload and use host-managed pagination or search where appropriate; no millions-of-items guarantee is made
- You want minimal code
- Built-in search/filter is sufficient
- Working with external APIs returning plain data

✅ **Use Method 2 (Custom Renderers) when**:
- You need images, icons, or badges
- Options require multiple lines of text
- Custom styling/layout is important
- Conditional rendering based on data
- Rich user experience is priority
- Need to integrate with Svelte stores in rendering

### Combining Both Methods

You can start with Method 1 and add Method 2 later as your UI evolves:

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  let value = '';

  // Start simple with the documented SelectItem shape
  const items = [
    { value: 'one', label: 'Option 1' },
    { value: 'two', label: 'Option 2' },
    { value: 'three', label: 'Option 3' },
  ];

  // Later, add custom rendering without changing items
  const optionRenderer = (item: (typeof items)[number], index: number): HTMLElement => {
    const row = document.createElement('div');
    row.style.cssText = `padding:8px;background:${index % 2 ? '#f9fafb' : 'white'}`;
    const label = document.createElement('strong'); label.textContent = item.label;
    row.append(label);
    return row;
  };
</script>

<Select
  items={items}
  bind:value
  optionRenderer={optionRenderer}
/>
```

### Performance Tips

**For Method 1**:
- Use reactive statements (`$:`) only when their dependencies and recomputation behavior are understood; `$:` is not a general-purpose memoization mechanism
- `virtualized` enables chunked rendering; it does not bound mounted DOM to the viewport.
- Enable `infiniteScroll` for dynamic loading

**For Method 2**:
- Keep renderer function pure (no side effects)
- Avoid heavy computations in renderer
- Cache renderer functions when possible
- Use DOM APIs and `textContent` in `optionRenderer`; do not interpolate option data into HTML strings

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  let value = '';

  // Stable example data. A Svelte reactive declaration is not a general-purpose memoization cache.
  const items = Array.from({ length: 10000 }, (_, i) => ({
    value: i.toString(),
    label: `Item ${i + 1}`,
    description: `Description for item ${i + 1}`
  }));

  // Pure renderer function
  const renderer = (item: (typeof items)[number]): HTMLElement => {
    const row = document.createElement('div');
    const title = document.createElement('strong'); title.textContent = item.label;
    const description = document.createElement('div');
    description.style.cssText = 'font-size:12px;color:#666';
    description.textContent = item.description;
    row.append(title, description);
    return row;
  };
</script>

<Select
  items={items}
  bind:value
  optionRenderer={renderer}
  virtualized
/>
```

---

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

### Important: Passing inline functions as renderers

If you define `optionRenderer` inline in a template, it may cause unnecessary replacement of generated option content. A stable function reference is usually easier to reason about.

**Highly recommended:** For best performance and to avoid potential issues, always use stable function references:

```svelte
<script>
  const myRenderer = (item, index, helpers) => {
    const element = document.createElement('div');
    element.textContent = item.label;
    return element;
  };
  // or define outside reactive blocks
</script>
```

Adapters are designed to not loop even without memoization, but stability still improves performance.

## Accessibility

Implemented behavior includes selected Arrow/Enter/Escape/Tab paths, ARIA naming/description forwarding, and focus restoration. The shared core passed its scoped Phase 4 automated browser matrix in Chromium, Firefox, and WebKit. This does not establish exhaustive Svelte adapter parity, minimum-browser-version compatibility, or WCAG conformance. Manual Windows/NVDA and macOS/VoiceOver assessments remain pending.

- ✅ Selected keyboard navigation paths (not an exhaustive interaction certification)
- ✅ ARIA naming and selected live-region announcements
- ✅ Focus management
- ✅ High contrast mode support
- ✅ Reduced motion support

## Browser Support

The browser versions listed in repository policy are compatibility targets, not proof that every minimum-version integration has passed certification. The completed Phase 4 browser matrix uses current pinned Chromium, Firefox, and WebKit builds; consult the [browser support policy](../../docs/compliance/BROWSER-SUPPORT.md) for declared compatibility and support details.
- Opera 76+

## License

MIT © [Navid Rezadoost](https://github.com/navidrezadoost)

## Contributing

Contributions are welcome! Please see the [main repository](https://github.com/navidrezadoost/smilodon) for guidelines.
