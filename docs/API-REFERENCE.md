# API Reference

API inventory for `@smilodon` packages. The maintained select API is `EnhancedSelect` in core and `Select` in the React, Vue, Svelte, Solid, and React Native adapters; Vanilla provides `createSelect` helpers for the core element. `@smilodon/react-native` uses a WebView bridge on native platforms and a direct custom-element implementation on React Native Web. `NativeSelectElement` remains exported as a legacy compatibility API; its section below is not the primary component API. Angular is unsupported.

---

## Table of Contents

1. [Core Package](#core-package)
   - [EnhancedSelect](#enhancedselect)
   - [Legacy NativeSelectElement](#legacy-nativeselectelement-compatibility-api)
   - [Virtualizer](#virtualizer)
   - [WorkerManager](#workermanager)
   - [Telemetry](#telemetry)
   - [Security Utilities](#security-utilities)
2. [React Adapter](#react-adapter)
3. [Vue Adapter](#vue-adapter)
4. [Svelte Adapter](#svelte-adapter)
5. [Solid Adapter](#solid-adapter)
6. [React Native Adapter](#react-native-adapter)
7. [Vanilla Adapter](#vanilla-adapter)
8. [TypeScript Types](#typescript-types)

---

## Core Package

### Shared runtime styling and selection config

The current shared runtime exposes styling and chip/remove-button controls through `GlobalSelectConfig`, especially `selection` and `styles`.

#### `selection`

| Field | Type | Description |
| --- | --- | --- |
| `mode` | `'single' \| 'multi'` | Select mode. |
| `showRemoveButton` | `boolean` | Shows chip remove buttons in multi-select. |
| `removeButtonIcon` | `string` | Custom text or SVG markup used for chip and selected-option remove buttons. |
| `closeOnSelect` | `boolean` | Closes after select in single mode. |
| `toggleOnTriggerClick` | `boolean` | Allows trigger clicks to toggle open/closed. |

#### `dropdownPlacement`

| Field | Type | Description |
| --- | --- | --- |
| `mode` | `'bottom' \| 'top' \| 'auto'` | Controls whether the dropdown opens below, above, or automatically based on available room below the select. |

#### `direction`

| Field | Type | Description |
| --- | --- | --- |
| `direction` | `'ltr' \| 'rtl'` | Controls shell and dropdown directionality. Defaults to `ltr`, but can be configured globally or per instance. |

Set it globally:

```ts
configureSelect({
  direction: 'rtl',
});
```

Set it per instance:

```ts
select.updateConfig({
  direction: 'rtl',
});
```

#### `styles`

In addition to `container`, `dropdown`, `option`, `selectedOption`, `hoverOption`, and `input`, the latest runtime styling surface includes:

| Field | Type | Purpose |
| --- | --- | --- |
| `activeOption` | `Partial<CSSStyleDeclaration>` | Keyboard-active option styling. |
| `badge` | `Partial<CSSStyleDeclaration>` | Multi-select chip sizing, spacing, border, radius, background, and typography. |
| `badgeHover` | `Partial<CSSStyleDeclaration>` | Chip hover-state styling. |
| `badgeActive` | `Partial<CSSStyleDeclaration>` | Chip pressed-state styling. |
| `badgeLabel` | `Partial<CSSStyleDeclaration>` | Chip label typography and alignment. |
| `badgeRemove` | `Partial<CSSStyleDeclaration>` | Chip remove-button size, radius, color, and border. |
| `badgeRemoveHover` | `Partial<CSSStyleDeclaration>` | Chip remove-button hover styling. |
| `badgeRemoveActive` | `Partial<CSSStyleDeclaration>` | Chip remove-button pressed styling. |
| `groupHeader` | `Partial<CSSStyleDeclaration>` | Group-header spacing, alignment, border, radius, shadow, and color. |

#### `styles.classNames`

Additional class-name hooks now include:

- `activeOption`
- `badge`
- `badgeLabel`
- `badgeRemove`
- `groupHeader`

#### Related CSS parts and tokens

- Parts: `chip`, `chip-label`, `chip-remove`, `chip-remove-icon`, `group-header`, `option`
- Token families: `--select-badge-*`, `--select-group-header-*`, `--select-option-*`

Alignment-related tokens commonly used together:

- `--select-input-text-align` for the visible selected value in the closed input shell
- `--select-option-text-align` for dropdown option labels
- `--select-input-justify-content` for visible row alignment in multi-select layouts
- `--select-group-header-text-align` for grouped dropdown headers

Placement-related runtime config:

- `dropdownPlacement.mode = 'bottom'`
- `dropdownPlacement.mode = 'top'`
- `dropdownPlacement.mode = 'auto'`

Direction-related runtime config:

- `direction = 'ltr'`
- `direction = 'rtl'`

For the exhaustive latest token inventory, see [STYLING-TOKENS.md](./STYLING-TOKENS.md). For usage patterns and examples, see [STYLING.md](./STYLING.md).

### EnhancedSelect

The maintained core custom element is registered as `<enhanced-select>` and exported as `EnhancedSelect` from `@smilodon/core`. The React, Vue, and Svelte `Select` components wrap this shared runtime. See each package guide for framework-specific controlled-value and event conventions.

```ts
import '@smilodon/core';
import type { EnhancedSelect } from '@smilodon/core';

const select = document.querySelector('enhanced-select') as EnhancedSelect;
select.setItems([
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
]);
select.setError('Choose a fruit.');
select.clearError();
```

#### Core element methods

| Method | Signature | Behavior |
| --- | --- | --- |
| `setItems` | `(items: unknown[]) => void` | Replaces the item set. |
| `setGroupedItems` | `(groups: GroupedItem[]) => void` | Replaces the grouped item set. |
| `getSelectedItems` | `() => unknown[]` | Returns selected item objects. |
| `getSelectedValues` | `() => unknown[]` | Returns selected values. |
| `setSelectedValues` | `(values: unknown[]) => Promise<void>` | Replaces selection by value; can fetch missing selected items when configured. |
| `clear` / `clearSearch` | `() => void` | Clears selection or search query. |
| `open` / `close` | `() => void` | Opens or closes the popup. |
| `updateConfig` | `(config: Partial<GlobalSelectConfig>) => void` | Applies partial runtime configuration. |
| `setError` | `(message: string) => void` | Marks the internal combobox invalid and associates its internal error description. |
| `clearError` | `() => void` | Clears invalid state and the internal error description. |
| `setRequired` / `validate` | `(required: boolean) => void` / `() => boolean` | Sets required state or validates the current selection. |

`setError` and `clearError` are core element methods and are exposed by the React, Vue, Svelte, and Solid handles, the React Native Web handle, and the Vanilla helpers. The native React Native WebView handle does not currently expose them. Host `aria-labelledby` and `aria-describedby` ID strings are not copied into the shadow tree; use the documented literal accessible-name/description fallback instead. `aria-description` and `aria-label` are forwarded by the core component.

The [WICG Reference Target explainer](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/reference-target-explainer.md) is an evolving standards proposal, not a cross-browser production mechanism assumed by this API. Cross-root references remain explicitly unsupported here until platform support and compatibility are independently verified.

#### Core events

`select` fires for an option interaction with `{ item, index, value, label, selected, multi }`, followed by the aggregate `change` event with `{ selectedItems, selectedValues, selectedIndices }`. The selected state is already updated when `select` fires. Host-controlled search and load-more events request work; core does not fetch, cancel, or cache pages.

#### Rendering and virtualization status

The public `virtualize` setting on `EnhancedSelect` enables chunked rendering for large flat lists. It does not implement viewport-windowed virtualization. The `virtual-window` path is guarded by a private test seam, not a supported public mode, and is not production-activated. See [Known Limitations](./KNOWN-LIMITATIONS.md#viewport-virtualization-status).

### Legacy NativeSelectElement (compatibility API)

`NativeSelectElement` remains exported for compatibility with older integrations. The maintained adapters and current examples use `EnhancedSelect`; this legacy API has separate behavior and should not be treated as proof of current `EnhancedSelect` capabilities.

#### Usage

```typescript
import { NativeSelectElement } from '@smilodon/core';

customElements.define('native-select', NativeSelectElement);
```

#### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `items` | `T[]` | `[]` | Array of items to display |
| `selectedIndices` | `number[]` | `[]` | Currently selected item indices |
| `multi` | `boolean` | `false` | Enable multi-selection |
| `estimatedItemHeight` | `number` | `48` | Estimated height of each item (px) |
| `buffer` | `number` | `5` | Number of items to render outside viewport |
| `portal` | `boolean` | `false` | Render dropdown in document portal |
| `strategy` | `'absolute' \| 'fixed'` | `'absolute'` | CSS positioning strategy |
| `optionTemplate` | `(item: T) => string` | `(item) => item.label` | Template function for rendering items |
| `disabled` | `boolean` | `false` | Disable the select component |
| `placeholder` | `string` | `'Select...'` | Placeholder text when nothing selected |

#### Methods

##### `open()`
Opens the dropdown.

```typescript
const select = document.querySelector('native-select');
select.open();
```

##### `close()`
Closes the dropdown.

```typescript
select.close();
```

##### `toggle()`
Toggles dropdown open/closed state.

```typescript
select.toggle();
```

##### `scrollToIndex(index: number, behavior?: ScrollBehavior)`
Scrolls to specific item index.

```typescript
select.scrollToIndex(42, 'smooth');
```

##### `clearSelection()`
Clears all selected items.

```typescript
select.clearSelection();
```

##### `selectAll()`
Selects all items (multi-select only).

```typescript
if (select.multi) {
  select.selectAll();
}
```

#### Events

##### `select`
Fired when selection changes.

```typescript
select.addEventListener('select', (event) => {
  console.log('Selected indices:', event.detail.indices);
  console.log('Selected items:', event.detail.items);
});
```

**Event Detail**:
```typescript
{
  indices: number[];    // Array of selected indices
  items: T[];          // Array of selected items
  source: 'click' | 'keyboard' | 'api'; // How selection occurred
}
```

##### `open`
Fired when dropdown opens.

```typescript
select.addEventListener('open', () => {
  console.log('Dropdown opened');
});
```

##### `close`
Fired when dropdown closes.

```typescript
select.addEventListener('close', () => {
  console.log('Dropdown closed');
});
```

#### Attributes

HTML attributes mapped to properties:

```html
<native-select
  multi
  disabled
  placeholder="Choose an option"
  estimated-item-height="60"
  buffer="10"
  portal
  strategy="fixed"
></native-select>
```

---

### Virtualizer

Core virtualization engine.

#### Constructor

```typescript
import { Virtualizer } from '@smilodon/core';

const virtualizer = new Virtualizer<MyItem>(container, {
  items: myItems,
  estimatedItemHeight: 48,
  buffer: 5,
  renderItem: (item, index) => {
    const el = document.createElement('div');
    el.textContent = item.label;
    return el;
  },
  onScroll: (offset) => {
    console.log('Scrolled to:', offset);
  }
});
```

#### Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `items` | `T[]` | Yes | Items to virtualize |
| `estimatedItemHeight` | `number` | Yes | Estimated item height (px) |
| `buffer` | `number` | No | Items to render outside viewport (default: 5) |
| `renderItem` | `(item: T, index: number) => HTMLElement` | Yes | Item renderer function |
| `onScroll` | `(offset: number) => void` | No | Scroll callback |
| `measureOnce` | `boolean` | No | Only measure items once (default: false) |

#### Methods

##### `setItems(items: T[])`
Update items list.

```typescript
virtualizer.setItems(newItems);
```

##### `scrollToIndex(index: number, behavior?: ScrollBehavior)`
Scroll to specific item.

```typescript
virtualizer.scrollToIndex(100, 'smooth');
```

##### `getVisibleRange(): { start: number; end: number }`
Get currently visible item range.

```typescript
const range = virtualizer.getVisibleRange();
console.log(`Showing items ${range.start} to ${range.end}`);
```

##### `getTotalHeight(): number`
Get total scrollable height.

```typescript
const height = virtualizer.getTotalHeight();
```

##### `destroy()`
Clean up virtualizer.

```typescript
virtualizer.destroy();
```

---

### WorkerManager

Manages background workers for heavy computations.

#### Constructor

```typescript
import { WorkerManager } from '@smilodon/core';

const workerManager = new WorkerManager({
  maxWorkers: 4,
  fallbackToMain: true
});
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxWorkers` | `number` | `navigator.hardwareConcurrency` | Max concurrent workers |
| `fallbackToMain` | `boolean` | `true` | Fall back to main thread if workers unavailable |

#### Methods

##### `filter(items: T[], query: string): Promise<T[]>`
Filter items by query (case-insensitive).

```typescript
const filtered = await workerManager.filter(items, 'apple');
console.log('Matching items:', filtered);
```

##### `sort(items: T[], compareFn: (a: T, b: T) => number): Promise<T[]>`
Sort items using compare function.

```typescript
const sorted = await workerManager.sort(items, (a, b) => 
  a.name.localeCompare(b.name)
);
```

##### `map(items: T[], fn: (item: T) => U): Promise<U[]>`
Map items to new format.

```typescript
const names = await workerManager.map(users, user => user.name);
```

##### `terminate()`
Terminate all workers.

```typescript
workerManager.terminate();
```

#### Example: Complex Filtering

```typescript
const manager = new WorkerManager();

// Heavy processing in worker
const results = await manager.filter(largeDataset, searchQuery);

// Use results
setItems(results);

// Cleanup on unmount
manager.terminate();
```

---

### Telemetry

Performance monitoring and metrics collection.

#### Usage

```typescript
import { getTelemetry } from '@smilodon/core';

const telemetry = getTelemetry();
```

#### Methods

##### `startRecording()`
Start recording metrics.

```typescript
telemetry.startRecording();
```

##### `stopRecording()`
Stop recording metrics.

```typescript
telemetry.stopRecording();
```

##### `getMetrics(): TelemetryMetrics`
Get collected metrics.

```typescript
const metrics = telemetry.getMetrics();
console.log('Render time:', metrics.renderTime);
console.log('Scroll FPS:', metrics.scrollFPS);
```

##### `reset()`
Clear all metrics.

```typescript
telemetry.reset();
```

##### `mark(name: string)`
Create performance mark.

```typescript
telemetry.mark('custom-operation-start');
// ... do work
telemetry.mark('custom-operation-end');
```

##### `measure(name: string, startMark: string, endMark: string): number`
Measure time between marks.

```typescript
const duration = telemetry.measure(
  'custom-operation',
  'custom-operation-start',
  'custom-operation-end'
);
console.log(`Operation took ${duration}ms`);
```

#### TelemetryMetrics Type

```typescript
interface TelemetryMetrics {
  renderTime: number;        // Initial render time (ms)
  scrollFPS: number;         // Average scroll FPS
  memoryUsage: number;       // Memory usage (MB)
  itemCount: number;         // Total items
  renderedItems: number;     // Currently rendered items
  scrollEvents: number;      // Total scroll events
  selectionChanges: number;  // Total selection changes
  workerTasks: number;       // Background tasks executed
}
```

#### Example: Performance Profiling

```typescript
import { getTelemetry } from '@smilodon/core';

function ProfiledSelect() {
  const telemetry = getTelemetry();
  
  useEffect(() => {
    telemetry.startRecording();
    
    return () => {
      const metrics = telemetry.getMetrics();
      console.table(metrics);
      telemetry.stopRecording();
    };
  }, []);
  
  return <NativeSelect items={items} />;
}
```

---

### Security Utilities

CSP-compliant security utilities.

#### setHTMLSanitizer

Configure HTML sanitization for templates.

```typescript
import { setHTMLSanitizer } from '@smilodon/core';
import DOMPurify from 'dompurify';

setHTMLSanitizer({
  sanitize: (html: string) => DOMPurify.sanitize(html)
});
```

**Type**:
```typescript
interface HTMLSanitizer {
  sanitize(html: string): string;
}

function setHTMLSanitizer(sanitizer: HTMLSanitizer): void;
```

#### sanitizeHTML

Sanitize HTML string (uses configured sanitizer).

```typescript
import { sanitizeHTML } from '@smilodon/core';

const clean = sanitizeHTML('<script>alert("XSS")</script>');
// Returns: "" (or sanitized output if DOMPurify configured)
```

#### createElement

Create DOM element safely.

```typescript
import { createElement } from '@smilodon/core';

const div = createElement('div', {
  className: 'my-class',
  textContent: 'Safe text'
});
```

**Signature**:
```typescript
function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  props?: Partial<HTMLElementTagNameMap[K]>
): HTMLElementTagNameMap[K];
```

#### escapeHTML

Escape HTML special characters.

```typescript
import { escapeHTML } from '@smilodon/core';

const safe = escapeHTML('<script>alert("XSS")</script>');
// Returns: "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;"
```

#### detectEnvironment

Detect runtime environment capabilities.

```typescript
import { detectEnvironment } from '@smilodon/core';

const env = detectEnvironment();
console.log('Can use workers:', env.canUseWorkers);
console.log('Has SharedArrayBuffer:', env.hasSharedArrayBuffer);
console.log('Has eval:', env.hasEval);
console.log('Is sandboxed:', env.isSandboxed);
```

**Return Type**:
```typescript
interface Environment {
  canUseWorkers: boolean;
  hasSharedArrayBuffer: boolean;
  hasEval: boolean;
  isSandboxed: boolean;
  cspDirectives: {
    scriptSrc: string[];
    styleSrc: string[];
  };
}
```

#### CSPFeatures

Check specific CSP features.

```typescript
import { CSPFeatures } from '@smilodon/core';

if (CSPFeatures.hasEval()) {
  // Eval available
}

if (CSPFeatures.hasInlineStyles()) {
  // Inline styles allowed
}

if (CSPFeatures.hasWorkers()) {
  // Workers available
}
```

**Methods**:
```typescript
class CSPFeatures {
  static hasEval(): boolean;
  static hasInlineStyles(): boolean;
  static hasWorkers(): boolean;
  static canUseSharedArrayBuffer(): boolean;
}
```

#### setCustomProperties

Set CSS custom properties (CSP-safe).

```typescript
import { setCustomProperties } from '@smilodon/core';

setCustomProperties(element, {
  '--ns-item-height': '50px',
  '--ns-item-bg': '#f0f0f0'
});
```

#### applyClasses

Apply CSS classes (CSP-safe).

```typescript
import { applyClasses } from '@smilodon/core';

applyClasses(element, ['selected', 'active']);
```

#### injectShadowStyles

Inject styles into shadow DOM.

```typescript
import { injectShadowStyles } from '@smilodon/core';

const shadowRoot = element.attachShadow({ mode: 'open' });
injectShadowStyles(shadowRoot);
```

#### hasOverflowHiddenAncestor

Check if element has overflow:hidden ancestor.

```typescript
import { hasOverflowHiddenAncestor } from '@smilodon/core';

if (hasOverflowHiddenAncestor(selectElement)) {
  // Use fixed positioning or portal
  selectElement.setAttribute('strategy', 'fixed');
}
```

---

## React Adapter

`@smilodon/react` is maintained. Its primary component is `Select` from `@smilodon/react`; its `NativeSelect` export below is a compatibility wrapper around `NativeSelectElement`.

### Current `Select` component

The current React adapter wraps the core `EnhancedSelect` runtime. See [`packages/react/README.md`](../packages/react/README.md) for its controlled/uncontrolled props, event callbacks, refs, and current API.

### Legacy `NativeSelect` component

React wrapper for NativeSelectElement.

#### Import

```typescript
import { NativeSelect } from '@smilodon/react';
import type { NativeSelectProps } from '@smilodon/react';
```

#### Props

Extends all properties from NativeSelectElement as React props.

```typescript
interface NativeSelectProps<T = any> {
  // Data
  items: T[];
  selectedIndices?: number[];
  
  // Behavior
  multi?: boolean;
  disabled?: boolean;
  portal?: boolean;
  strategy?: 'absolute' | 'fixed';
  
  // Rendering
  estimatedItemHeight?: number;
  buffer?: number;
  optionTemplate?: (item: T) => string;
  placeholder?: string;
  
  // Events
  onSelect?: (data: { indices: number[]; items: T[] }) => void;
  onOpen?: () => void;
  onClose?: () => void;
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
  
  // Ref
  ref?: React.Ref<NativeSelectElement>;
}
```

#### Example

```tsx
import { NativeSelect } from '@smilodon/react';
import { useRef, useState } from 'react';

function MySelect() {
  const selectRef = useRef<NativeSelectElement>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  
  const items = [
    { id: 1, label: 'Apple' },
    { id: 2, label: 'Banana' }
  ];
  
  return (
    <NativeSelect
      ref={selectRef}
      items={items}
      selectedIndices={selectedIndices}
      multi
      estimatedItemHeight={48}
      buffer={10}
      onSelect={({ indices }) => setSelectedIndices(indices)}
      onOpen={() => console.log('Opened')}
      className="my-select"
      style={{ '--ns-item-height': '48px' }}
    />
  );
}
```

#### Imperative Methods

Access via ref:

```tsx
const selectRef = useRef<NativeSelectElement>(null);

// Open dropdown
selectRef.current?.open();

// Close dropdown
selectRef.current?.close();

// Scroll to item
selectRef.current?.scrollToIndex(42);

// Clear selection
selectRef.current?.clearSelection();
```

---

## Vue Adapter

`@smilodon/vue` is maintained. Its primary component is `Select` from `@smilodon/vue`; its `NativeSelect` export below is a compatibility wrapper around `NativeSelectElement`.

### Current `Select` component

The current Vue adapter wraps the core `EnhancedSelect` runtime. See [`packages/vue/README.md`](../packages/vue/README.md) for `v-model`, events, exposed methods, and current API.

### Legacy `NativeSelect` component

Vue wrapper for NativeSelectElement.

#### Import

```vue
<script setup>
import { NativeSelect } from '@smilodon/vue';
</script>
```

#### Props

```typescript
interface NativeSelectProps<T = any> {
  items: T[];
  selectedIndices?: number[];
  multi?: boolean;
  disabled?: boolean;
  portal?: boolean;
  strategy?: 'absolute' | 'fixed';
  estimatedItemHeight?: number;
  buffer?: number;
  optionTemplate?: (item: T) => string;
  placeholder?: string;
}
```

#### Events

```typescript
{
  select: { indices: number[]; items: T[] };
  open: void;
  close: void;
}
```

#### Example

```vue
<template>
  <NativeSelect
    ref="selectRef"
    :items="items"
    :selectedIndices="selectedIndices"
    :multi="true"
    :estimatedItemHeight="48"
    :buffer="10"
    @select="handleSelect"
    @open="handleOpen"
    class="my-select"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { NativeSelect } from '@smilodon/vue';

const selectRef = ref<InstanceType<typeof NativeSelect>>();
const selectedIndices = ref<number[]>([]);

const items = [
  { id: 1, label: 'Apple' },
  { id: 2, label: 'Banana' }
];

function handleSelect({ indices }: { indices: number[] }) {
  selectedIndices.value = indices;
}

function handleOpen() {
  console.log('Opened');
}

// Imperative methods
function openSelect() {
  selectRef.value?.open();
}
</script>
```

---

## Svelte Adapter

`@smilodon/svelte` is maintained. Its primary component is `Select` from `@smilodon/svelte`; its `NativeSelect` export below is a compatibility wrapper around `NativeSelectElement`.

### Current `Select` component

The current Svelte adapter wraps the core `EnhancedSelect` runtime. See [`packages/svelte/README.md`](../packages/svelte/README.md) for bindable values, dispatched events, component methods, and current API.

### Legacy `NativeSelect` component

Svelte wrapper for NativeSelectElement.

#### Import

```svelte
<script>
  import { NativeSelect } from '@smilodon/svelte';
</script>
```

#### Props

```typescript
interface NativeSelectProps<T = any> {
  items: T[];
  selectedIndices?: number[];
  multi?: boolean;
  disabled?: boolean;
  portal?: boolean;
  strategy?: 'absolute' | 'fixed';
  estimatedItemHeight?: number;
  buffer?: number;
  optionTemplate?: (item: T) => string;
  placeholder?: string;
}
```

#### Events

```typescript
{
  select: CustomEvent<{ indices: number[]; items: T[] }>;
  open: CustomEvent<void>;
  close: CustomEvent<void>;
}
```

#### Example

```svelte
<script lang="ts">
  import { NativeSelect } from '@smilodon/svelte';
  
  let selectRef: any;
  let selectedIndices: number[] = [];
  
  const items = [
    { id: 1, label: 'Apple' },
    { id: 2, label: 'Banana' }
  ];
  
  function handleSelect(event: CustomEvent) {
    selectedIndices = event.detail.indices;
  }
  
  function openSelect() {
    selectRef?.open();
  }
</script>

<NativeSelect
  bind:this={selectRef}
  {items}
  {selectedIndices}
  multi={true}
  estimatedItemHeight={48}
  buffer={10}
  on:select={handleSelect}
  on:open={() => console.log('Opened')}
  class="my-select"
/>
```

---

## Angular Adapter (unsupported)

There is no maintained or supported `@smilodon/angular` package. Angular usage examples and types are intentionally omitted from this current API reference. Use a maintained adapter or integrate the core custom element directly.

## Solid Adapter

`@smilodon/solid` is maintained. Its `Select` component exposes controlled/uncontrolled values, selection and lifecycle callbacks, runtime diagnostics, and an imperative handle. The exact surface is defined by [`packages/solid/src/Select.tsx`](../packages/solid/src/Select.tsx); adapter-wide feature parity is not implied by API presence. See the [feature-contract audit](./architecture/PHASE-4-FEATURE-CONTRACT-AUDIT.md).

## React Native Adapter

`@smilodon/react-native` is maintained with two platform paths: a native WebView bridge and a direct custom-element implementation for React Native Web. Both expose selection callbacks, but their imperative handle surfaces differ; for example, `setError`/`clearError` currently exist only on the web handle. Platform behavior and parity are documented in the [React Native guide](../packages/react-native/README.md) and implemented in [`packages/react-native/src/Select.tsx`](../packages/react-native/src/Select.tsx) and [`Select.web.tsx`](../packages/react-native/src/Select.web.tsx). The current shared adapter contract suite does not cover this package, so API presence is not a platform certification.

## Vanilla Adapter

`@smilodon/vanilla` is maintained. `createSelect(options)` creates the core custom element and accepts item/configuration and event-callback options; the package also exports helper functions including `setError(element, message)` and `clearError(element)`. See [`packages/vanilla/src/index.ts`](../packages/vanilla/src/index.ts) and the [feature-contract audit](./architecture/PHASE-4-FEATURE-CONTRACT-AUDIT.md). Use core element methods such as `setItems`, `setSelectedValues`, `updateConfig`, `setError`, and `clearError`; the legacy Vanilla guide contains older `NativeSelect` examples and is not the current method inventory.

---

## TypeScript Types

### Core Types

```typescript
// Item type (generic)
type Item = any;

// Selection event detail
interface SelectionEvent<T = Item> {
  indices: number[];
  items: T[];
  source: 'click' | 'keyboard' | 'api';
}

// Virtualizer options
interface VirtualizerOptions<T = Item> {
  items: T[];
  estimatedItemHeight: number;
  buffer?: number;
  renderItem: (item: T, index: number) => HTMLElement;
  onScroll?: (offset: number) => void;
  measureOnce?: boolean;
}

// Worker manager options
interface WorkerManagerOptions {
  maxWorkers?: number;
  fallbackToMain?: boolean;
}

// Telemetry metrics
interface TelemetryMetrics {
  renderTime: number;
  scrollFPS: number;
  memoryUsage: number;
  itemCount: number;
  renderedItems: number;
  scrollEvents: number;
  selectionChanges: number;
  workerTasks: number;
}

// Environment detection
interface Environment {
  canUseWorkers: boolean;
  hasSharedArrayBuffer: boolean;
  hasEval: boolean;
  isSandboxed: boolean;
  cspDirectives: {
    scriptSrc: string[];
    styleSrc: string[];
  };
}

// HTML sanitizer
interface HTMLSanitizer {
  sanitize(html: string): string;
}
```

### Framework Types

#### React

```typescript
import type {
  NativeSelectProps,
  NativeSelectElement
} from '@smilodon/react';

// Component props
const props: NativeSelectProps<MyItem> = {
  items: myItems,
  onSelect: ({ indices, items }) => {}
};

// Ref type
const ref = useRef<NativeSelectElement>(null);
```

#### Vue

```typescript
import type { NativeSelectProps } from '@smilodon/vue';

// Component props
interface Props extends NativeSelectProps<MyItem> {
  items: MyItem[];
}
```

#### Svelte

```typescript
import type { NativeSelectProps } from '@smilodon/svelte';

// Component props
let props: NativeSelectProps<MyItem> = {
  items: myItems
};
```

---

## CSS Custom Properties

Complete list of CSS variables for theming:

```css
native-select {
  /* Item sizing */
  --ns-item-height: 48px;
  --ns-item-padding: 8px 16px;
  
  /* Colors */
  --ns-item-bg: #ffffff;
  --ns-item-hover-bg: #f5f5f5;
  --ns-item-selected-bg: #e3f2fd;
  --ns-item-selected-color: #1976d2;
  --ns-item-disabled-color: #9e9e9e;
  
  /* Borders */
  --ns-border-color: #ddd;
  --ns-border-width: 1px;
  --ns-border-radius: 4px;
  
  /* Focus */
  --ns-focus-outline: 2px solid #1976d2;
  --ns-focus-outline-offset: 2px;
  
  /* Typography */
  --ns-font-family: inherit;
  --ns-font-size: 16px;
  --ns-font-weight: 400;
  --ns-line-height: 1.5;
  
  /* Dimensions */
  --ns-max-height: 400px;
  --ns-min-width: 200px;
  
  /* Z-index */
  --ns-z-index: 1000;
  
  /* Transitions */
  --ns-transition-duration: 200ms;
  --ns-transition-timing: ease-in-out;
}
```

---

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Required Features

- Custom Elements v1
- Shadow DOM v1
- Intersection Observer
- CSS Custom Properties
- ES2020+ (optional, uses polyfills)

---

## See Also

- [Getting Started](./GETTING-STARTED.md)
- [Security Guide](../.azure/phase9-security-guide.md)
- [Performance Guide](./PERFORMANCE.md)
- [Migration Guide](./MIGRATION.md)
