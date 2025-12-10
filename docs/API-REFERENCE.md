# API Reference

Complete API documentation for `@smilodon` packages.

---

## Table of Contents

1. [Core Package](#core-package)
   - [NativeSelectElement](#nativeselectelement)
   - [Virtualizer](#virtualizer)
   - [WorkerManager](#workermanager)
   - [Telemetry](#telemetry)
   - [Security Utilities](#security-utilities)
2. [React Adapter](#react-adapter)
3. [Vue Adapter](#vue-adapter)
4. [Svelte Adapter](#svelte-adapter)
5. [Angular Adapter](#angular-adapter)
6. [TypeScript Types](#typescript-types)

---

## Core Package

### NativeSelectElement

Web Component providing the base select functionality.

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

### NativeSelect Component

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

### NativeSelect Component

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

### NativeSelect Component

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

## Angular Adapter

Angular component wrapper for `@smilodon/core`.

### Installation

```bash
npm install @smilodon/core @smilodon/angular
```

### Module Import

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { NativeSelectModule } from '@smilodon/angular';

@NgModule({
  imports: [
    NativeSelectModule
  ]
})
export class AppModule { }
```

### Basic Usage

```typescript
// app.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <native-select
      [items]="items"
      [placeholder]="'Select an item'"
      [multiple]="false"
      [virtualized]="true"
      (select)="handleSelect($event)">
    </native-select>
  `
})
export class AppComponent {
  items = [
    { id: 1, label: 'Apple' },
    { id: 2, label: 'Banana' },
    { id: 3, label: 'Cherry' }
  ];
  
  handleSelect(event: any) {
    console.log('Selected:', event.items);
  }
}
```

### Component API

#### Inputs

```typescript
@Input() items: T[] = [];
@Input() selectedIndices: number[] = [];
@Input() multi: boolean = false;
@Input() virtualized: boolean = false;
@Input() estimatedItemHeight: number = 48;
@Input() buffer: number = 5;
@Input() searchable: boolean = false;
@Input() placeholder: string = 'Select...';
@Input() disabled: boolean = false;
```

#### Outputs

```typescript
@Output() select = new EventEmitter<{ indices: number[]; items: T[] }>();
@Output() open = new EventEmitter<void>();
@Output() close = new EventEmitter<void>();
```

#### Methods

```typescript
// Access via ViewChild
@ViewChild(NativeSelectComponent) selectRef!: NativeSelectComponent;

// Programmatic control
this.selectRef.open();
this.selectRef.close();
this.selectRef.setSelectedIndices([0, 1]);
this.selectRef.scrollToIndex(10);
```

#### Example with Template Reference

```typescript
// app.component.ts
import { Component, ViewChild } from '@angular/core';
import { NativeSelectComponent } from '@smilodon/angular';

@Component({
  selector: 'app-root',
  template: `
    <native-select
      #mySelect
      [items]="items"
      [selectedIndices]="selectedIndices"
      [multiple]="true"
      [virtualized]="true"
      [estimatedItemHeight]="48"
      [buffer]="10"
      (select)="handleSelect($event)"
      (open)="handleOpen()"
      class="my-select">
    </native-select>
    
    <button (click)="openSelect()">Open Programmatically</button>
  `
})
export class AppComponent {
  @ViewChild('mySelect') selectRef!: NativeSelectComponent;
  
  items = [
    { id: 1, label: 'Apple' },
    { id: 2, label: 'Banana' },
    { id: 3, label: 'Cherry' }
  ];
  
  selectedIndices: number[] = [];
  
  handleSelect(event: any) {
    this.selectedIndices = event.indices;
    console.log('Selected items:', event.items);
  }
  
  handleOpen() {
    console.log('Select opened');
  }
  
  openSelect() {
    this.selectRef.open();
  }
}
```

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

#### Angular

```typescript
import type { NativeSelectComponent } from '@smilodon/angular';

// Component reference
@ViewChild(NativeSelectComponent) select!: NativeSelectComponent<MyItem>;

// Component inputs
interface NativeSelectInputs<T> {
  items: T[];
  placeholder?: string;
  multiple?: boolean;
  virtualized?: boolean;
  searchable?: boolean;
}
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
