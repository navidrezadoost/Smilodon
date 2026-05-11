# @smilodon/solid - Complete Guide

**Production-ready, accessible Select component for SolidJS applications**

This guide explains how to install, configure, style, optimize, and troubleshoot the SolidJS adapter for Smilodon. It is intended to answer the full lifecycle of questions a Solid user typically has: simple setup, medium-complexity usage, and advanced production concerns.

---

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [How the Solid adapter works](#how-the-solid-adapter-works)
3. [Basic Usage](#basic-usage)
4. [Controlled and Uncontrolled Modes](#controlled-and-uncontrolled-modes)
5. [Complete Props Reference](#complete-props-reference)
6. [Input Formats](#input-formats)
7. [Grouped Data](#grouped-data)
8. [Custom Renderers](#custom-renderers)
9. [Imperative Handle](#imperative-handle)
10. [Styling & Theming](#styling--theming)
11. [Performance Optimization](#performance-optimization)
12. [Accessibility](#accessibility)
13. [Diagnostics & Runtime Policies](#diagnostics--runtime-policies)
14. [Advanced Patterns](#advanced-patterns)
15. [Troubleshooting](#troubleshooting)

---

## Installation & Setup

### Installation

```bash
npm install @smilodon/solid @smilodon/core solid-js
```

or with pnpm:

```bash
pnpm add @smilodon/solid @smilodon/core solid-js
```

or with yarn:

```bash
yarn add @smilodon/solid @smilodon/core solid-js
```

### Vite / SolidStart notes

The adapter wraps the shared `enhanced-select` custom element and waits for the underlying runtime to be ready before syncing items, config, and selection. In most Solid projects, no extra compiler configuration is needed beyond your normal Solid setup.

```ts
import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solid()],
})
```

### When to use `@smilodon/solid`

Use this adapter when you want:

- Solid-first props and callback ergonomics
- a callback `ref` handle for programmatic control
- JSX-based option rendering with Solid
- direct DOM option rendering where needed
- the same runtime behavior and styling model used by other Smilodon adapters

---

## How the Solid adapter works

The Solid adapter does not re-implement selection behavior. Instead, it:

1. mounts an `enhanced-select` element,
2. waits for the custom element upgrade to complete,
3. syncs props into the runtime with `setItems()`, `setGroupedItems()`, `setSelectedValues()`, and `updateConfig()`,
4. forwards runtime events back into Solid callbacks,
5. optionally renders custom option content through Solid or raw DOM.

This design keeps framework wrappers thin and lets the shared runtime carry the complex logic for:

- virtualization
- search behavior
- keyboard navigation
- diagnostics
- limitation reporting
- clear control behavior

---

## Basic Usage

### Minimal example

```tsx
import { render } from 'solid-js/web'
import { createSignal } from 'solid-js'
import { Select } from '@smilodon/solid'

function App() {
  const [value, setValue] = createSignal<string | number>('')

  return (
    <Select
      items={[
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
        { value: 'cherry', label: 'Cherry' },
      ]}
      value={value()}
      onChange={(next) => setValue(next as string)}
      searchable
      placeholder="Choose a fruit"
    />
  )
}

render(() => <App />, document.getElementById('app')!)
```

### Medium-complexity example

```tsx
import { createMemo, createSignal } from 'solid-js'
import { Select } from '@smilodon/solid'

export default function TeamPicker() {
  const [query, setQuery] = createSignal('')
  const [value, setValue] = createSignal<Array<string | number>>([])

  const items = createMemo(() =>
    [
      { value: 'design', label: 'Design' },
      { value: 'engineering', label: 'Engineering' },
      { value: 'security', label: 'Security' },
      { value: 'operations', label: 'Operations' },
    ].filter((item) => item.label.toLowerCase().includes(query().toLowerCase()))
  )

  return (
    <>
      <input
        value={query()}
        onInput={(event) => setQuery(event.currentTarget.value)}
        placeholder="Filter teams"
      />

      <Select
        items={items()}
        value={value()}
        onChange={(next) => setValue(next as Array<string | number>)}
        multiple
        searchable
        clearable
        placeholder="Choose teams"
      />
    </>
  )
}
```

---

## Controlled and Uncontrolled Modes

### Controlled mode

Use controlled mode when your signal or store owns the selected value.

```tsx
const [value, setValue] = createSignal<string | number>('')

<Select
  items={items}
  value={value()}
  onChange={(next) => setValue(next as string)}
/>
```

Choose controlled mode when you need:

- form-state ownership outside the component
- persistence to a store or router state
- validation controlled by the host app
- analytics or synchronized multi-component workflows

### Uncontrolled mode

Use uncontrolled mode when you only need an initial value and want the component to manage selection internally.

```tsx
<Select
  items={items}
  defaultValue="banana"
  searchable
/>
```

Choose uncontrolled mode when you want:

- simpler local setup
- less host-state wiring
- an easier drop-in component for small forms

### Guidance

- Prefer controlled mode for shared application state.
- Prefer uncontrolled mode for isolated local widgets.
- Avoid switching repeatedly between controlled and uncontrolled patterns for the same instance.

---

## Complete Props Reference

### Primary props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `SelectItem[]` | `[]` | Flat item array |
| `groupedItems` | `GroupedItem[]` | `undefined` | Grouped option structure |
| `value` | `SelectValue` | `undefined` | Controlled selection |
| `defaultValue` | `SelectValue` | `undefined` | Uncontrolled initial selection |
| `multiple` | `boolean` | `false` | Multi-select mode |
| `searchable` | `boolean` | `false` | Search input enabled |
| `placeholder` | `string` | `undefined` | Placeholder text |
| `disabled` | `boolean` | `false` | Disable interaction |
| `required` | `boolean` | `false` | Required state |
| `error` | `boolean` | `false` | Error state |
| `infiniteScroll` | `boolean` | `false` | Enable load-more behavior |
| `pageSize` | `number` | `50` | Infinite-scroll page size |
| `virtualized` | `boolean` | `true` | Virtualized option rendering |
| `maxSelections` | `number` | `undefined` | Maximum selection count in multi mode |
| `placement` | `'bottom' \| 'top' \| 'auto'` | `'auto'` | Dropdown placement |
| `clearable` | `boolean` | `false` | Show clear control |
| `clearSelectionOnClear` | `boolean` | `true` | Clear selected values when clear control is used |
| `clearSearchOnClear` | `boolean` | `true` | Clear search text when clear control is used |
| `clearAriaLabel` | `string` | `undefined` | Clear-button ARIA label |
| `clearIcon` | `string` | `undefined` | Clear-button icon text |
| `class` / `className` | `string` | `undefined` | Host class |
| `style` | `JSX.CSSProperties` | `undefined` | Host inline styles / CSS variables |

### Renderer props

| Prop | Type | Description |
| --- | --- | --- |
| `customRenderer` | `(item, index) => JSX.Element` | Render option content with Solid JSX |
| `optionRenderer` | `(item, index, helpers) => HTMLElement` | Render option content with raw DOM |
| `groupHeaderRenderer` | `(group, index) => JSX.Element` | Render grouped header content |

### Diagnostics and runtime-policy props

| Prop | Type | Description |
| --- | --- | --- |
| `trackingEnabled` | `boolean` | Enable runtime tracking |
| `trackEvents` | `boolean` | Track event history |
| `trackStyling` | `boolean` | Track styling updates |
| `trackLimitations` | `boolean` | Track limitation state changes |
| `emitDiagnostics` | `boolean` | Emit `diagnostic` events |
| `trackingMaxEntries` | `number` | Per-channel entry cap |
| `limitationPolicies` | `LimitationPolicyMap` | Apply runtime limitation policies |
| `autoMitigateRuntimeModeSwitch` | `boolean` | Auto-clear selection when switching between single and multi mode |

### Event callbacks

| Callback | Signature | Purpose |
| --- | --- | --- |
| `onChange` | `(value, items) => void` | Selection changed |
| `onSelect` | `(item, index) => void` | Item selected |
| `onOpen` | `() => void` | Dropdown opened |
| `onClose` | `() => void` | Dropdown closed |
| `onSearch` | `(query) => void` | Search changed |
| `onLoadMore` | `(page) => void` | Load more requested |
| `onCreate` | `(value) => void` | New option created |
| `onClear` | `(detail) => void` | Clear control used |
| `onDiagnostic` | `(detail) => void` | Diagnostic event emitted |

---

## Input Formats

### Object array

```tsx
const items = [
  { value: 'ir', label: 'Iran' },
  { value: 'jp', label: 'Japan' },
  { value: 'de', label: 'Germany' },
]
```

### Group-ready flat items

```tsx
const items = [
  { value: 'react', label: 'React', group: 'Frontend' },
  { value: 'solid', label: 'SolidJS', group: 'Frontend' },
  { value: 'android', label: 'Android', group: 'Mobile' },
]
```

The Solid adapter can normalize the `group` field into grouped runtime data automatically.

### Explicit grouped data

```tsx
const groupedItems = [
  {
    label: 'Frontend',
    options: [
      { value: 'react', label: 'React' },
      { value: 'solid', label: 'SolidJS' },
    ],
  },
]
```

---

## Grouped Data

You can use grouped data in two ways:

1. pass `groupedItems` directly, or
2. pass flat `items` with a `group` property.

Use explicit `groupedItems` when your source data is already grouped. Use flat items when grouping is just a display concern.

---

## Custom Renderers

### Simple: JSX renderer

```tsx
<Select
  items={items}
  customRenderer={(item) => (
    <div style={{ display: 'flex', 'justify-content': 'space-between' }}>
      <span>{item.label}</span>
      <strong>{String(item.value)}</strong>
    </div>
  )}
/>
```

### Medium: DOM renderer

```tsx
<Select
  items={items}
  optionRenderer={(item, index, helpers) => {
    const el = document.createElement('div')
    el.style.display = 'flex'
    el.style.justifyContent = 'space-between'
    el.innerHTML = `<span>${item.label}</span><small>#${index + 1}</small>`
    el.onclick = () => helpers?.onSelect(item, index)
    return el
  }}
/>
```

### When to choose each renderer path

- use `customRenderer` when you want Solid JSX and composability
- use `optionRenderer` when you need direct DOM control or integration with non-Solid rendering primitives
- keep renderers lightweight for large datasets

---

## Imperative Handle

The Solid adapter exposes a callback `ref` instead of React-style ref forwarding.

```tsx
let api

<Select
  items={items}
  ref={(handle) => {
    api = handle
  }}
/>

<button onClick={() => api?.open()}>Open</button>
<button onClick={() => api?.clear()}>Clear</button>
```

Available methods:

- `focus()`
- `open()`
- `close()`
- `getSelectedItems()`
- `getSelectedValues()`
- `setItems()`
- `setGroupedItems()`
- `clear()`
- `getCapabilities()`
- `getKnownLimitations()`
- `getTrackingSnapshot()`
- `clearTracking()`
- `setLimitationPolicies()`

Use the imperative handle when you need integration with:

- dialogs and popovers
- external reset buttons
- data refresh flows
- observability dashboards

---

## Styling & Theming

The Solid adapter uses the same styling system as the shared runtime.

### Main styling mechanisms

- CSS variables such as `--select-input-*`, `--select-dropdown-*`, and `--select-option-*`
- shadow parts such as `::part(button)`, `::part(listbox)`, `::part(option)`, `::part(chip)`, and `::part(clear-button)`
- host classes via `class` or `className`
- custom renderers for deeper option markup control

### Example

```tsx
<Select
  items={items}
  style={{
    '--select-accent': '#2563eb',
    '--select-border-focus': '#2563eb',
    '--select-input-min-height': '52px',
  } as JSX.CSSProperties}
/>
```

Reference docs:

- [../../docs/STYLING.md](../../docs/STYLING.md)
- [../../docs/STYLING-TOKENS.md](../../docs/STYLING-TOKENS.md)
- [../../docs/STYLING-EXAMPLES.md](../../docs/STYLING-EXAMPLES.md)

---

## Performance Optimization

### Simple guidance

- leave `virtualized` enabled for medium and large datasets
- keep `items` stable when possible
- avoid heavy per-row DOM in very large lists

### Medium guidance

- if rows have consistent height, keep the visual design consistent so virtualization remains accurate
- avoid rebuilding arrays unnecessarily during unrelated reactivity updates
- keep renderer output minimal for 10K+ item lists

### Advanced guidance

- use plain items with lightweight labels for the fastest path
- prefer DOM renderer or plain runtime rendering over very heavy JSX per option when list size is extreme
- profile host state churn as well as select rendering; Solid reactivity can be fast, but unnecessary signal fan-out still costs time

See [../../docs/PERFORMANCE.md](../../docs/PERFORMANCE.md).

---

## Accessibility

The Solid adapter inherits the shared accessibility model from the runtime.

Support includes:

- ARIA listbox semantics
- keyboard navigation
- active-item announcements
- clear-button labelling
- touch target sizing hooks
- reduced-motion and high-contrast support

Recommended host patterns:

- connect labels with `aria-labelledby` where needed
- provide descriptive placeholder and helper text
- keep custom renderers semantically simple
- test screen-reader flows when using advanced option rendering

---

## Diagnostics & Runtime Policies

Smilodon supports runtime capability inspection and limitation-policy management.

### Example

```tsx
<Select
  items={items}
  trackingEnabled
  emitDiagnostics
  onDiagnostic={(detail) => console.log(detail)}
/>
```

### What you can inspect

- capability reports via `getCapabilities()`
- machine-readable known limitations via `getKnownLimitations()`
- tracking history via `getTrackingSnapshot()`
- policy state via `setLimitationPolicies()`

Use this for:

- QA instrumentation
- support dashboards
- controlled rollouts
- runtime policy enforcement

---

## Advanced Patterns

### 1. External filtering + internal selection

```tsx
const [query, setQuery] = createSignal('')
const filtered = createMemo(() => allItems.filter((item) => item.label.includes(query())))

<Select items={filtered()} searchable />
```

### 2. Large grouped dataset

```tsx
<Select
  groupedItems={groupedItems}
  multiple
  searchable
  virtualized
  maxSelections={10}
/>
```

### 3. Diagnostics-enabled admin picker

```tsx
let api

<Select
  items={items}
  trackingEnabled
  emitDiagnostics
  ref={(handle) => (api = handle)}
/>

<button onClick={() => console.log(api?.getTrackingSnapshot())}>Inspect</button>
```

---

## Troubleshooting

### The dropdown renders but items do not appear

Check that:

- `items` or `groupedItems` are actually populated
- your data shape uses `value` and `label`
- you are not accidentally clearing items during a reactive update

### Custom rendering behaves unexpectedly

Check that:

- `customRenderer` returns lightweight JSX
- `optionRenderer` returns an `HTMLElement`
- renderer logic does not mutate shared external DOM unexpectedly

### Selection does not update as expected

Check that:

- controlled mode writes the new value back into the signal
- uncontrolled mode uses `defaultValue`, not `value`
- multi-select values are arrays

### Large lists feel slow

Check that:

- `virtualized` is still enabled
- renderer output is not too heavy
- item arrays are not being recreated unnecessarily

### Diagnostics are missing

Check that:

- `trackingEnabled` is true
- `emitDiagnostics` is true if you expect runtime `diagnostic` events
- you are listening to `onDiagnostic`

---

## Related documentation

- [../../README.md](../../README.md)
- [../../ARCHITECTURE.md](../../ARCHITECTURE.md)
- [../../docs/ADAPTER-CAPABILITY-MATRIX.md](../../docs/ADAPTER-CAPABILITY-MATRIX.md)
- [../../docs/KNOWN-LIMITATIONS.md](../../docs/KNOWN-LIMITATIONS.md)
- [../../docs/PERFORMANCE.md](../../docs/PERFORMANCE.md)
- [../../docs/STYLING.md](../../docs/STYLING.md)
