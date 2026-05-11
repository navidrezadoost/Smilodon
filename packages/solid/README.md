# @smilodon/solid

SolidJS adapter for Smilodon's core custom-element select engine.

This package gives Solid applications a native-feeling wrapper around the shared `enhanced-select` runtime while preserving the same capabilities available in the other adapters: grouped data, multi-select, search, virtualization, clear control, diagnostics, and limitation-policy APIs.

## 📖 Documentation

**For comprehensive documentation covering installation, setup, controlled and uncontrolled usage, renderers, performance, SSR posture, diagnostics, and troubleshooting:**

👉 **[Complete SolidJS Guide](./COMPLETE-GUIDE.md)** 👈

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

## Controlled and uncontrolled modes

### Controlled

Use `value` plus `onChange` when your store or signal owns the selection.

```tsx
const [value, setValue] = createSignal<Array<string | number>>([])

<Select
  items={items}
  value={value()}
  onChange={(next) => setValue(next as Array<string | number>)}
  multiple
  searchable
/>
```

### Uncontrolled

Use `defaultValue` when the component should manage its own internal state after initial mount.

```tsx
<Select
  items={items}
  defaultValue="banana"
  searchable
/>
```

## Grouped data

You can supply either `groupedItems` directly or pass flat `items` with a `group` property.

```tsx
<Select
  items={[
    { value: 'tehran', label: 'Tehran', group: 'Asia' },
    { value: 'tokyo', label: 'Tokyo', group: 'Asia' },
    { value: 'berlin', label: 'Berlin', group: 'Europe' },
  ]}
  searchable
/>
```

If you already have grouped data, pass `groupedItems` and optionally render headers with `groupHeaderRenderer`.

## Renderers

### `customRenderer`

Use `customRenderer` when you want JSX-based option content driven by Solid rendering.

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

### `optionRenderer`

Use `optionRenderer` when you want to return an `HTMLElement` directly.

```tsx
<Select
  items={items}
  optionRenderer={(item, index, helpers) => {
    const el = document.createElement('div')
    el.textContent = `${index + 1}. ${item.label}`
    el.onclick = () => helpers?.onSelect(item, index)
    return el
  }}
/>
```

## Imperative handle

The Solid adapter uses a callback `ref` rather than React-style `useRef` forwarding.

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

Available handle methods include:

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

## Diagnostics and limitation policies

Like the audited web adapters, Solid can emit diagnostic payloads and expose runtime capability reports.

```tsx
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

- Leave `virtualized` enabled for large lists.
- Provide stable `items` references when possible.
- Use `optionRenderer` carefully for very large datasets; heavier DOM per row increases layout cost.
- Prefer flat text or lightweight JSX for the fastest scrolling path.

## Related docs

- [Root overview](../../README.md)
- [Core styling guide](../../docs/STYLING.md)
- [Known limitations](../../docs/KNOWN-LIMITATIONS.md)
- [Performance guide](../../docs/PERFORMANCE.md)
