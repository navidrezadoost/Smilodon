# @smilodon/react-native - Complete Guide

**Production-ready, accessible Select component for React Native and React Native Web applications**

This guide covers the React Native adapter in detail: installation, native and web setup, architecture, styling, data flow, diagnostics, performance, and troubleshooting. It is written to answer simple, medium, advanced, and production-level questions in one place.

---

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [How the React Native adapter works](#how-the-react-native-adapter-works)
3. [Basic Usage](#basic-usage)
4. [Controlled and Uncontrolled Modes](#controlled-and-uncontrolled-modes)
5. [Complete Props Reference](#complete-props-reference)
6. [Grouped Items](#grouped-items)
7. [Styling the Native and Web Implementations](#styling-the-native-and-web-implementations)
8. [Imperative Handle](#imperative-handle)
9. [Performance Optimization](#performance-optimization)
10. [Diagnostics & Runtime Policies](#diagnostics--runtime-policies)
11. [React Native Web Notes](#react-native-web-notes)
12. [Advanced Patterns](#advanced-patterns)
13. [Practical Limitations](#practical-limitations)
14. [Troubleshooting](#troubleshooting)

---

## Installation & Setup

### Installation

```bash
npm install @smilodon/react-native react-native-webview
```

### Peer dependencies

The adapter expects:

- `react >= 18.2.0`
- `react-native >= 0.74.0`
- `react-native-webview >= 13.12.0`

### Expo / bare workflow notes

The adapter can fit both Expo and bare React Native projects as long as `react-native-webview` is available in the app runtime.

Use it when you want:

- one select abstraction for mobile and web targets
- Smilodon behavior parity in a React Native product
- WebView-backed native behavior with a matching web implementation
- access to the same grouping, diagnostics, and limitation-policy model used in the rest of the ecosystem

### Installation checklist

1. install `@smilodon/react-native`
2. install `react-native-webview`
3. ensure your platform setup supports WebView
4. keep CSS-token customization inside `selectStyle`
5. test both native and web targets when your product ships cross-platform

---

## How the React Native adapter works

The adapter has two internal implementations.

### Native iOS / Android path

On native mobile:

1. the core Smilodon bundle is embedded into an HTML document,
2. the HTML is loaded inside `react-native-webview`,
3. props are serialized and sent through a bridge payload,
4. runtime events are posted back to React Native,
5. height changes are synchronized when the dropdown opens or closes.

### React Native Web path

On web:

1. the adapter loads the same core custom element runtime,
2. it mounts `enhanced-select` directly in the DOM,
3. it keeps the same public props and imperative handle,
4. it updates runtime config with `updateConfig()`, `setItems()`, and `setSelectedValues()`.

### Why this matters

This split gives you one adapter API while preserving platform-appropriate delivery:

- native uses WebView because the core runtime is DOM-based
- web uses the direct runtime to avoid an unnecessary embedded document

---

## Basic Usage

### Simple example

```tsx
import { useState } from 'react'
import { View } from 'react-native'
import { Select } from '@smilodon/react-native'

export default function ExampleScreen() {
  const [value, setValue] = useState<string | number>('')

  return (
    <View style={{ padding: 16 }}>
      <Select
        items={[
          { value: 'ios', label: 'iOS' },
          { value: 'android', label: 'Android' },
          { value: 'web', label: 'Web' },
        ]}
        value={value}
        onChange={(next) => setValue(next as string)}
        searchable
        clearable
        placeholder="Choose a platform"
      />
    </View>
  )
}
```

### Medium-complexity example

```tsx
import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { Select } from '@smilodon/react-native'

export default function TeamPicker() {
  const [value, setValue] = useState<Array<string | number>>([])

  const items = useMemo(
    () => [
      { value: 'design', label: 'Design' },
      { value: 'engineering', label: 'Engineering' },
      { value: 'security', label: 'Security' },
      { value: 'ops', label: 'Operations' },
    ],
    []
  )

  return (
    <View style={{ padding: 16 }}>
      <Select
        items={items}
        value={value}
        onChange={(next) => setValue(next as Array<string | number>)}
        multiple
        searchable
        clearable
        maxSelections={3}
        collapsedHeight={64}
        expandedHeight={320}
      />
    </View>
  )
}
```

### Production-style example with style tokens

```tsx
<Select
  items={items}
  value={value}
  onChange={(next) => setValue(next as string)}
  searchable
  clearable
  selectStyle={{
    '--select-accent': '#2563eb',
    '--select-border-focus': '#2563eb',
    '--select-input-min-height': '52px',
    '--select-dropdown-max-height': '280px',
  }}
/>
```

---

## Controlled and Uncontrolled Modes

### Controlled mode

Use controlled mode when React state should own the selected value.

```tsx
const [value, setValue] = useState<string | number>('')

<Select
  items={items}
  value={value}
  onChange={(next) => setValue(next as string)}
/>
```

Use controlled mode for:

- form state integration
- navigation or screen-state synchronization
- analytics and logging
- multi-component coordination

### Uncontrolled mode

Use uncontrolled mode when you only need an initial value.

```tsx
<Select
  items={items}
  defaultValue="android"
  searchable
/>
```

Use uncontrolled mode for:

- simple standalone screens
- drop-in admin tools
- quick prototypes where external state ownership is unnecessary

---

## Complete Props Reference

### Primary data and behavior props

| Prop | Type | Description |
| --- | --- | --- |
| `items` | `SelectItem[]` | Flat item list |
| `groupedItems` | `GroupedItem[]` | Grouped option list |
| `value` | `SelectValue` | Controlled selection |
| `defaultValue` | `SelectValue` | Initial uncontrolled selection |
| `multiple` | `boolean` | Enable multi-select |
| `searchable` | `boolean` | Enable search |
| `placeholder` | `string` | Placeholder text |
| `disabled` | `boolean` | Disable interaction |
| `infiniteScroll` | `boolean` | Enable load-more behavior |
| `pageSize` | `number` | Load-more page size |
| `virtualized` | `boolean` | Enable virtualization |
| `maxSelections` | `number` | Selection cap |
| `clearable` | `boolean` | Show clear control |
| `clearSelectionOnClear` | `boolean` | Clear selected values when clear control is pressed |
| `clearSearchOnClear` | `boolean` | Clear search text when clear control is pressed |
| `clearAriaLabel` | `string` | ARIA label for clear control |
| `clearIcon` | `string` | Icon text for clear control |
| `expandable` | `boolean` | Forward expandable config to the runtime |

### Native layout props

| Prop | Type | Description |
| --- | --- | --- |
| `containerStyle` | `StyleProp<ViewStyle>` | Outer React Native container styling |
| `selectStyle` | `Record<string, string>` | CSS variable map applied inside the embedded runtime |
| `collapsedHeight` | `number` | Height while closed |
| `expandedHeight` | `number` | Height while open |

### Diagnostics and runtime-policy props

| Prop | Type | Description |
| --- | --- | --- |
| `trackingEnabled` | `boolean` | Enable runtime tracking |
| `trackEvents` | `boolean` | Track event history |
| `trackStyling` | `boolean` | Track styling changes |
| `trackLimitations` | `boolean` | Track limitation state |
| `emitDiagnostics` | `boolean` | Emit diagnostic payloads |
| `trackingMaxEntries` | `number` | Per-channel tracking cap |
| `limitationPolicies` | `LimitationPolicyMap` | Runtime limitation policy map |
| `autoMitigateRuntimeModeSwitch` | `boolean` | Auto-clear selection on single/multi mode transition |

### Callback props

| Callback | Signature | Purpose |
| --- | --- | --- |
| `onChange` | `(value, items) => void` | Selection changed |
| `onSelect` | `(item, index) => void` | Item selected |
| `onOpen` | `() => void` | Dropdown opened |
| `onClose` | `() => void` | Dropdown closed |
| `onSearch` | `(query) => void` | Search changed |
| `onLoadMore` | `(page) => void` | Load-more requested |
| `onCreate` | `(value) => void` | New item creation |
| `onClear` | `(detail) => void` | Clear control used |
| `onDiagnostic` | `(detail) => void` | Diagnostic payload emitted |

---

## Grouped Items

Use `groupedItems` when you want clear section boundaries.

```tsx
<Select
  groupedItems={[
    {
      label: 'Frontend',
      options: [
        { value: 'react', label: 'React' },
        { value: 'solid', label: 'SolidJS' },
      ],
    },
    {
      label: 'Mobile',
      options: [
        { value: 'ios', label: 'iOS' },
        { value: 'android', label: 'Android' },
      ],
    },
  ]}
  multiple
/>
```

Use grouped items when:

- your dataset naturally has categories
- you want parity between native and web target rendering
- you need clearer scanning behavior for long lists

---

## Styling the Native and Web Implementations

### Important concept

`containerStyle` styles the outer React Native wrapper.

`selectStyle` styles the internal Smilodon runtime through CSS variables.

This distinction is critical.

### Outer React Native wrapper

```tsx
<Select
  items={items}
  containerStyle={{
    marginTop: 16,
    marginBottom: 24,
  }}
/>
```

### Internal runtime style tokens

```tsx
<Select
  items={items}
  selectStyle={{
    '--select-accent': '#7c3aed',
    '--select-border-focus': '#7c3aed',
    '--select-input-min-height': '56px',
    '--select-badge-bg': 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
  }}
/>
```

### Styling guidance

- use `containerStyle` for layout in React Native space
- use `selectStyle` for the internal select appearance
- keep token names aligned with the shared styling docs
- avoid expecting React Native style props to affect the internal HTML runtime directly

Reference docs:

- [../../docs/STYLING.md](../../docs/STYLING.md)
- [../../docs/STYLING-TOKENS.md](../../docs/STYLING-TOKENS.md)

---

## Imperative Handle

The adapter exposes a `ref` handle:

```tsx
import { useRef } from 'react'
import { Button } from 'react-native'
import { Select, type SelectHandle } from '@smilodon/react-native'

export default function Screen() {
  const ref = useRef<SelectHandle>(null)

  return (
    <>
      <Select ref={ref} items={items} />
      <Button title="Open" onPress={() => ref.current?.open()} />
    </>
  )
}
```

Available methods:

- `open()`
- `close()`
- `clear()`
- `setItems()`
- `setGroupedItems()`
- `setValue()`

Use the imperative API when you need:

- external action buttons
- screen transitions that open the picker programmatically
- live dataset replacement
- reset workflows after submit

---

## Performance Optimization

### Simple guidance

- keep `virtualized` enabled for large data
- memoize `items` in React screens when practical
- avoid rebuilding grouped data on unrelated renders

### Medium guidance

- prefer lightweight labels for very large datasets
- use `pageSize` sensibly for infinite scroll
- keep `expandedHeight` realistic for the device layout

### Advanced guidance

- remember that native performance still depends on an embedded web runtime in the WebView path
- keep `selectStyle` focused and avoid large amounts of bridged style churn during interaction
- for production QA, use diagnostics and tracking to observe event flow and styling churn

---

## Diagnostics & Runtime Policies

The React Native adapter forwards the runtime tracking model.

### Example

```tsx
<Select
  items={items}
  trackingEnabled
  emitDiagnostics
  onDiagnostic={(detail) => {
    console.log('diagnostic', detail)
  }}
/>
```

### What you can control

- event tracking
- styling tracking
- limitation tracking
- maximum tracking entries
- runtime limitation policies

Use this for:

- QA instrumentation
- field debugging
- support tooling
- progressive rollout control

---

## React Native Web Notes

On web, the adapter mounts the real `enhanced-select` runtime directly.

That means:

- browser behavior is closer to the web adapters than the native WebView path
- the public API remains aligned with the native path
- `selectStyle` still uses CSS variables, which is natural on web as well

Use React Native Web when you want:

- one component API for web and mobile
- shared selection logic across platforms
- a gradual path from web to native screens

---

## Advanced Patterns

### 1. Remote search

```tsx
<Select
  items={items}
  searchable
  onSearch={async (query) => {
    const next = await fetchItems(query)
    setItems(next)
  }}
/>
```

### 2. Screen-size-aware expanded height

```tsx
import { Dimensions } from 'react-native'

const screenHeight = Dimensions.get('window').height

<Select
  items={items}
  collapsedHeight={64}
  expandedHeight={Math.min(420, Math.round(screenHeight * 0.5))}
/>
```

### 3. Diagnostics-enabled admin workflow

```tsx
<Select
  items={items}
  trackingEnabled
  emitDiagnostics
  limitationPolicies={{
    runtimeModeSwitching: { mode: 'strict' },
  }}
/>
```

---

## Practical Limitations

The adapter is powerful, but it is important to understand its trade-offs.

- Native iOS and Android rendering depends on `WebView` because the Smilodon core runtime is DOM-based.
- Styling of the embedded select is token-driven, not React Native style-driven.
- The native path is not a pure native listbox; it is a bridged HTML runtime.
- Web and native targets share API shape, but their underlying rendering environments are different.

These limitations are not hidden; they are part of the design trade-off that enables shared behavior across platforms.

---

## Troubleshooting

### Nothing renders on native

Check that:

- `react-native-webview` is installed
- your app runtime supports WebView correctly
- the surrounding view gives the component enough visible space

### Styling does not change

Check that:

- you are using `selectStyle`, not just `containerStyle`
- the token names are valid Smilodon CSS variables
- style values are strings such as `'52px'`, not raw numbers for CSS-only tokens

### Selection does not update

Check that:

- controlled mode writes back the next value from `onChange`
- multi-select values are arrays
- your screen state is not resetting the value on every render

### Dropdown height feels wrong

Check that:

- `collapsedHeight` is large enough for the closed control
- `expandedHeight` is large enough for your expected list usage
- the parent layout is not clipping the wrapper unexpectedly

### Diagnostics do not appear

Check that:

- `trackingEnabled` is true
- `emitDiagnostics` is true
- `onDiagnostic` is provided

---

## Related documentation

- [../../README.md](../../README.md)
- [../../ARCHITECTURE.md](../../ARCHITECTURE.md)
- [../../docs/ADAPTER-CAPABILITY-MATRIX.md](../../docs/ADAPTER-CAPABILITY-MATRIX.md)
- [../../docs/KNOWN-LIMITATIONS.md](../../docs/KNOWN-LIMITATIONS.md)
- [../../docs/PERFORMANCE.md](../../docs/PERFORMANCE.md)
- [../../docs/STYLING.md](../../docs/STYLING.md)
