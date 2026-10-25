# @smilodon/solid

SolidJS adapter for Smilodon's core custom-element select engine.

This package gives Solid applications a wrapper around the shared `enhanced-select` runtime. Its public `virtualized` option enables legacy chunked rendering for large flat lists, not viewport-windowed rendering; true viewport virtualization remains guarded and is not a supported production mode.

The shared `EnhancedSelect` runtime passed its scoped Phase 4 automated accessibility scenarios in Chromium, Firefox, and WebKit. Solid-specific adapter parity and browser integration are not comprehensively certified, and manual Windows/NVDA and macOS/VoiceOver assessments remain pending. This is not a WCAG conformance claim.

## Acknowledged data-loading adapter status

The Phase 2F-D development candidate currently integrates acknowledged data loading through the core API and React adapter only. This Solid adapter does not publish a typed props or imperative-handle contract for request identity, completion, cancellation, and projection lifecycle. Passing `dataLoading` through casts or relying on the underlying element is undocumented and unsupported for this adapter. Solid parity remains a separate, pending work package; use the existing legacy host-managed data-loading path.

## 📖 Documentation

**Live documentation & interactive examples:** [navidrezadoost.github.io/Smilodon](https://navidrezadoost.github.io/Smilodon/)

**Framework integration (Vue 3, Nuxt 4, React, SSR, Vite):** [`docs/FRAMEWORK-INTEGRATION.md`](../../docs/FRAMEWORK-INTEGRATION.md)

**For comprehensive documentation covering installation, setup, controlled and uncontrolled usage, renderers, performance, SSR posture, diagnostics, and troubleshooting:**

👉 **[Complete SolidJS Guide](./COMPLETE-GUIDE.md)** 👈

The Quick Start and examples with a local component/data declaration are standalone. Short prop snippets that depend on the surrounding Solid component are marked as fragments and should be placed inside that component.

The complete guide includes:
- ✅ Solid-specific setup and custom-element lifecycle guidance
- ✅ Simple, medium, and advanced usage patterns
- ✅ Full prop and callback coverage
- ✅ JSX renderer and DOM renderer strategies
- ✅ Performance and large-list guidance
- ✅ Diagnostics, limitations, and troubleshooting

## Installation

```bash
npm install @smilodon/solid @smilodon/core solid-js
```

## What this adapter adds

- Solid-friendly prop API for controlled and uncontrolled usage
- Callback `ref` handle exposing `open()`, `close()`, `clear()`, `setItems()`, and diagnostics helpers
- Two renderer paths:
  - `customRenderer` for JSX content rendered through Solid
  - `optionRenderer` for direct `HTMLElement` output when you want full DOM control
- Automatic conversion of flat `items` with a `group` field into grouped data
- Safe custom-element upgrade handling before imperative syncing begins

## Quick start

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
      clearable
      placeholder="Pick a fruit"
    />
  )
}

render(() => <App />, document.getElementById('app')!)
```

## Clear control visibility

With `clearable`, the shared core is intended not to reserve empty space for the clear action. The button and its input/arrow spacing appear only when a selected value or enabled search query can be cleared, then disappear after both targets are empty. The runtime behavior supports single/multi-select and LTR/RTL configuration; this description is not a claim of exhaustive Solid-specific parity certification.

```tsx
import { createSignal } from 'solid-js'
import { Select } from '@smilodon/solid'

function ClearControlExample() {
  const [value, setValue] = createSignal<string | number>('')
  const items = [{ value: 'alpha', label: 'Alpha' }]

  return (
    <Select
      items={items}
      value={value()}
      onChange={(next) => setValue(next as string)}
      searchable
      clearable
      clearSelectionOnClear
      clearSearchOnClear
      onClear={(detail) => console.log(detail)}
    />
  )
}
```

To keep a disabled clear action visible while empty, pass `config={{ clearControl: { hideWhenEmpty: false } }}`. Style through `::part(clear-button)`, `::part(clear-icon)`, and `--select-clear-*`; avoid permanent input padding.

## Controlled and uncontrolled modes

### Controlled

Use `value` plus `onChange` when your store or signal owns the selection.

```tsx
import { createSignal } from 'solid-js'
import { Select } from '@smilodon/solid'

function ControlledSelect() {
  const [value, setValue] = createSignal<Array<string | number>>([])
  const items = [{ value: 'alpha', label: 'Alpha' }, { value: 'beta', label: 'Beta' }]

  return (
    <Select
      items={items}
      value={value()}
      onChange={(next) => setValue(next as Array<string | number>)}
      multiple
      searchable
    />
  )
}
```

### Uncontrolled

Use `defaultValue` when the component should manage its own internal state after initial mount.

```tsx
import { Select } from '@smilodon/solid'

function UncontrolledSelect() {
  const items = [
    { value: 'alpha', label: 'Alpha' },
    { value: 'beta', label: 'Beta' },
  ]

  return <Select items={items} defaultValue="alpha" searchable />
}
```

## Grouped data

You can supply either `groupedItems` directly or pass flat `items` with a `group` property.

```tsx
import { Select } from '@smilodon/solid'

function GroupedDataExample() {
  return (
    <Select
      items={[
        { value: 'tehran', label: 'Tehran', group: 'Asia' },
        { value: 'tokyo', label: 'Tokyo', group: 'Asia' },
        { value: 'berlin', label: 'Berlin', group: 'Europe' },
      ]}
      searchable
    />
  )
}
```

If you already have grouped data, pass `groupedItems` and optionally render headers with `groupHeaderRenderer`.

## Direction and option-state controls

```tsx
import { Select } from '@smilodon/solid'

// Fragment: place this Select expression in a component's returned JSX.
<Select
  items={[{ value: 'tehran', label: 'Tehran' }, { value: 'tokyo', label: 'Tokyo' }]}
  direction="rtl"
  removeButtonIcon="−"
  disabledOptionBehavior={{ hoverable: true, focusable: true, selectable: false }}
  showSelectedIndicator={false}
/>
```

- `direction` switches the instance between `ltr` and `rtl`
- `removeButtonIcon` replaces the chip remove icon with text or inline SVG markup
- `disabledOptionBehavior` controls whether dimmed options can still be hovered, focused, or selected
- `showSelectedIndicator` hides or shows the selected side indicator without custom pseudo-element rules

## Core config parity and global defaults

The Solid adapter accepts the shared core configuration model through convenience props and a full `config` prop. These declarations establish supported inputs, not exhaustive behavioral parity: adapter contract and browser coverage remain incomplete. See the [feature-contract audit](../../docs/architecture/PHASE-4-FEATURE-CONTRACT-AUDIT.md) for current verification boundaries.

### Convenience props

Use these adapter props for the most common advanced core features:

- `selectionConfig`
- `multiSelectDisplay`
- `scrollToSelected`
- `styles`
- `config`

```tsx
import { Select } from '@smilodon/solid'
import { createSignal } from 'solid-js'

function HorizontalChipExample() {
  const [value, setValue] = createSignal<Array<string | number>>(['react', 'solid'])

  return (
    <Select
      items={[
        { value: 'react', label: 'React' },
        { value: 'vue', label: 'Vue' },
        { value: 'svelte', label: 'Svelte' },
        { value: 'solid', label: 'Solid' },
      ]}
      value={value()}
      onChange={(next) => setValue(next as Array<string | number>)}
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
    />
  )
}
```

### Full `config` passthrough

```tsx
import { Select } from '@smilodon/solid'

const items = [{ value: 'alpha', label: 'Alpha' }]

// Fragment: place this Select expression in a component's returned JSX.
<Select
  items={items}
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

### Global defaults from `@smilodon/solid`

```tsx
import { configureSelect } from '@smilodon/solid'

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
})
```

## Renderers

### `customRenderer`

Use `customRenderer` when you want JSX-based option content driven by Solid rendering.

```tsx
import { Select } from '@smilodon/solid'

// Fragment: place this Select expression in a component's returned JSX.
<Select
  items={[{ value: 'alpha', label: 'Alpha' }]}
  customRenderer={(item) => (
    <div style={{ display: 'flex', 'justify-content': 'space-between' }}>
      <span>{item.label}</span>
      <strong>{String(item.value)}</strong>
    </div>
  )}
/>
```

The adapter mounts this JSX through Solid's renderer and retains a disposer for replacement and teardown. Renderer roots are cleaned up by the adapter when its corresponding content is replaced or the component is disposed. This lifecycle handling is implementation behavior, not a claim that every Solid renderer edge case has contract coverage. Keep each option semantically one selectable option; do not place nested interactive controls inside its listbox option content.

### `optionRenderer`

Use `optionRenderer` when you want to return an `HTMLElement` directly.

```tsx
import { Select } from '@smilodon/solid'

// Fragment: place this Select expression in a component's returned JSX.
<Select
  items={[{ value: 'alpha', label: 'Alpha' }]}
  optionRenderer={(item, index) => {
    const el = document.createElement('div')
    el.textContent = `${index + 1}. ${item.label}`
    return el
  }}
/>
```

The renderer supplies option content only. Leave click, keyboard, and selection handling to the shared select runtime instead of adding another click handler to the returned node.

### `groupHeaderRenderer`

Group headers can be rendered with Solid JSX. The adapter mounts each returned JSX root and disposes the prior root when it is replaced and when the component is cleaned up.

```tsx
import { Select } from '@smilodon/solid'

// Fragment: place this Select expression in a component's returned JSX.
const groupedItems = [
  { label: 'Frontend', options: [{ value: 'solid', label: 'SolidJS' }] },
  { label: 'Backend', options: [{ value: 'node', label: 'Node.js' }] },
]

<Select
  groupedItems={groupedItems}
  groupHeaderRenderer={(group) => (
    <div class="group-title">{group.label}</div>
  )}
/>
```

## Imperative handle

The Solid adapter uses a callback `ref` rather than React-style `useRef` forwarding.

```tsx
import { createSignal } from 'solid-js'
import { Select, type SelectHandle } from '@smilodon/solid'

function ImperativeExample() {
  const [api, setApi] = createSignal<SelectHandle | undefined>()

  return (
    <>
      <Select
        items={[{ value: 'a', label: 'Alpha' }]}
        ref={(handle) => setApi(handle)}
      />
      <button type="button" onClick={() => api()?.open()}>Open</button>
      <button type="button" onClick={() => api()?.clear()}>Clear</button>
    </>
  )
}
```

The callback handle is made available after the wrapper has upgraded and mounted the custom element; guard calls until the handle exists.

The handle provides:

- `focus()`, `open()`, `close()`
- `getSelectedItems()`, `getSelectedValues()`
- `setItems()`, `setGroupedItems()`, `clear()`, `clearSearch()`
- `updateConfig()`, `setError()`, `clearError()`, `setRequired()`, `validate()`
- `getCapabilities()`, `getKnownLimitations()`, `getTrackingSnapshot()`, `clearTracking()`, `setLimitationPolicies()`

### Host-owned async data

The examples below are separate components; do not use a module-level untyped handle variable. The `SelectHandle` type is exported by the adapter and the callback is invoked after custom-element setup.

```tsx
import { createSignal } from 'solid-js'
import { Select, type SelectHandle } from '@smilodon/solid'

function MoreImperativeActions() {
  const [api, setApi] = createSignal<SelectHandle | undefined>()
  const items = [{ value: 'required', label: 'Required choice' }]
  return (
    <>
      <Select items={items} ref={(handle) => setApi(handle)} required />
      <button type="button" onClick={() => api()?.clearSearch()}>Clear Search</button>
      <button type="button" onClick={() => api()?.updateConfig({ selection: { showSelectedIndicator: false } })}>Hide Indicator</button>
      <button type="button" onClick={() => api()?.setError('Selection required')}>Set Error</button>
      <button type="button" onClick={() => console.log(api()?.validate())}>Validate</button>
    </>
  )
}
```

## Diagnostics and limitation policies

Like the audited web adapters, Solid can emit diagnostic payloads and expose runtime capability reports.

```tsx
import { Select } from '@smilodon/solid'

const items = [{ value: 'alpha', label: 'Alpha' }]

// Fragment: place this Select expression in a component's returned JSX.
<Select
  items={items}
  trackingEnabled
  emitDiagnostics
  onDiagnostic={(detail) => console.log(detail)}
/>
```

Use `limitationPolicies` or `setLimitationPolicies()` when you want to suppress or tighten runtime behavior around known limitations.

## Styling

The Solid adapter does not invent a separate styling model. Use the shared token surface and `::part()` hooks documented in:

- `../../docs/STYLING.md`
- `../../docs/STYLING-TOKENS.md`

Common hooks:

- `--select-input-*`
- `--select-badge-*`
- `--select-dropdown-*`
- `--select-option-*`
- `::part(button)`
- `::part(listbox)`
- `::part(option)`
- `::part(chip)`
- `::part(clear-button)`

## Performance guidance

- `virtualized` enables chunked rendering, not viewport-windowed rendering or bounded DOM.
- Provide stable `items` references when possible.
- Use `optionRenderer` carefully for very large datasets; heavier DOM per row increases layout cost.
- Prefer flat text or lightweight JSX when minimizing per-row DOM and layout complexity matters; profile the actual workload rather than assuming a fixed speed advantage.

## Related docs

- [Root overview](../../README.md)
- [Core styling guide](../../docs/STYLING.md)
- [Known limitations](../../docs/KNOWN-LIMITATIONS.md)
- [Performance guide](../../docs/PERFORMANCE.md)
- [Browser support policy](../../docs/compliance/BROWSER-SUPPORT.md) (declared compatibility targets are distinct from versions exercised by the current test matrix)
