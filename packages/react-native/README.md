# @smilodon/react-native

React Native adapter for Smilodon.

The shared core passed its scoped Phase 4 automated browser matrix in Chromium, Firefox, and WebKit. That does not certify the native WebView bridge or React Native Web as complete platform integrations, and it does not establish WCAG conformance. Manual native assistive-technology assessments (iOS VoiceOver and Android TalkBack) remain outstanding; Windows/NVDA and macOS/VoiceOver web assessments are also pending assignment.

This package provides two implementations behind one import:

- **Native mobile**: renders Smilodon inside a `react-native-webview` bridge
- **Web**: mounts the same core custom element directly for React Native Web environments

The package shares many props and callbacks across these paths, but it does not expose one identical runtime or imperative API surface. Native WebView and React Native Web behavior, event timing, styling, and accessibility require separate verification.

## Acknowledged data-loading adapter status

The Phase 2F-D development candidate currently integrates acknowledged data loading through the core API and React web adapter only. This React Native package does not publish a typed contract for request identity, host completion, cancellation, or projection results across its WebView bridge or React Native Web path. Do not use the React web adapter example as a React Native API contract. Native and web adapter parity remain separate, pending work packages.

Examples below the self-contained quick start that refer to `items`, `value`, `setValue`, or refs from outside their snippet are focused fragments; they assume those application values are declared in the host component.

## 📖 Documentation

**Live documentation & interactive examples:** [navidrezadoost.github.io/Smilodon](https://navidrezadoost.github.io/Smilodon/)

For native setup, start with the [React Native-specific complete guide](./COMPLETE-GUIDE.md), then use the web framework guide only for the React Native Web/browser integration path.

**Framework integration (Vue 3, Nuxt 4, React, SSR, Vite):** [`docs/FRAMEWORK-INTEGRATION.md`](../../docs/FRAMEWORK-INTEGRATION.md)

**For comprehensive documentation covering installation, Expo and bare setup, native/web architecture, styling, grouped items, diagnostics, performance, and troubleshooting:**

👉 **[Complete React Native Guide](./COMPLETE-GUIDE.md)** 👈

The complete guide includes:
- ✅ Native and React Native Web setup flows
- ✅ Simple, medium, advanced, and production usage patterns
- ✅ WebView bridge architecture and styling model
- ✅ Controlled and uncontrolled data flows
- ✅ Performance and diagnostics guidance
- ✅ Detailed troubleshooting notes

## Installation

```bash
npm install @smilodon/react-native react-native-webview
```

If your app does not already depend on React Native Web, install the packages required by your platform stack as usual.

## When to use this adapter

Choose `@smilodon/react-native` if you want:

- one select abstraction shared between native mobile and web targets
- searchable, grouped, multi-select behavior backed by the same core runtime
- clear imperative control over opening, closing, replacing data, and resetting values
- access to diagnostic and limitation-policy hooks from React Native screens

## Quick start

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

## Architecture

### Native path

On iOS and Android, the adapter:

1. embeds the built core bundle into an HTML document,
2. loads that document inside `WebView`,
3. synchronizes items, value, config, and styling through a bridge payload,
4. forwards events like `change`, `search`, `open`, `close`, `clear`, and `diagnostic` back to React Native.

### Web path

On web, the adapter:

- loads the core custom element bundle directly,
- creates an `enhanced-select` element in the DOM,
- forwards props through `updateConfig()`, `setItems()`, and `setSelectedValues()`,
- exposes additional DOM-backed imperative methods beyond the native WebView handle (listed below).

## Important props

### Data and selection

- `items`
- `groupedItems`
- `value`
- `defaultValue`
- `multiple`
- `maxSelections`

### Interaction

- `searchable`
- `direction`
- `clearable`
- `clearSelectionOnClear`
- `clearSearchOnClear`
- `clearAriaLabel`
- `clearIcon`
- `infiniteScroll`
- `pageSize`
- `virtualized`
- `disabledOptionBehavior`
- `showSelectedIndicator`

The `virtualized` prop enables legacy incremental chunk rendering for large flat lists. It does not window rows to the viewport or guarantee bounded mounted DOM. Guarded viewport-windowing remains private and is not approved for production.

### Clear control visibility

The shared core is intended not to reserve an empty action area for `clearable`. The control appears only when an enabled target—a selected value or search query—can be cleared, and the input/arrow layout returns to normal afterward. This behavior is implemented by the common runtime; exhaustive native WebView versus React Native Web parity for all selection, direction, and timing combinations has not been certified.

```tsx
<Select
	items={items}
	value={value}
	onChange={setValue}
	searchable
	clearable
	clearSelectionOnClear
	clearSearchOnClear
	onClear={({ clearedSelection, clearedSearch }) => {
		console.log({ clearedSelection, clearedSearch })
	}}
/>
```

For an always-present disabled-when-empty action, pass `config={{ clearControl: { hideWhenEmpty: false } }}`. On web, style it with `::part(clear-button)`, `::part(clear-icon)`, and `--select-clear-*` tokens rather than permanent padding.

Example:

```tsx
<Select
	items={items}
	direction="rtl"
	removeButtonIcon="−"
	disabledOptionBehavior={{ hoverable: true, focusable: true, selectable: false }}
	showSelectedIndicator={false}
/>
```

## Core config parity

The React Native adapter accepts the same major runtime behavior groups as the shared core through adapter props and the full `config` prop.

### Supported advanced config props

- `selectionConfig`
- `multiSelectDisplay`
- `scrollToSelected`
- `styles`
- `config`

These configuration groups are sent in the native bridge payload and forwarded through `updateConfig()` on React Native Web. Their presence in both type paths is not proof that all advanced behaviors are equivalent across platforms.

### Example: multi-select chip layout and icon styling

```tsx
<Select
	items={items}
	value={value}
	onChange={setValue}
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
	selectStyle={{
		'--select-badge-bg': '#eff6ff',
		'--select-badge-remove-icon-font-size': '14px',
	}}
/>
```

### Example: full `config` prop

```tsx
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

### Global defaults note

For React Native, prefer per-instance `config` and convenience props. The native implementation runs inside its own embedded runtime, so app-level `configureSelect()` globals are not the recommended integration point here.

### Native layout control

- `collapsedHeight`
- `expandedHeight`
- `containerStyle`
- `selectStyle`

`containerStyle` uses React Native layout/style semantics for the host view. `selectStyle` is a separate map of CSS properties forwarded into the embedded select element and is the main place to set Smilodon CSS variables. These are different styling systems and should not be expected to accept the same values.

```tsx
<Select
	items={items}
	selectStyle={{
		'--select-accent': '#2563eb',
		'--select-border-focus': '#2563eb',
		'--select-input-min-height': '52px',
	}}
/>
```

## Imperative handle

Native WebView and React Native Web expose different handles. The following table reflects the current source interfaces; method availability is not a certification of equal runtime behavior.

| Method | Native WebView | React Native Web |
| --- | --- | --- |
| `open()`, `close()` | Yes | Yes |
| `clear()`, `clearSearch()` | Yes | Yes |
| `setItems()`, `setGroupedItems()`, `setValue()` | Yes | Yes |
| `updateConfig()` | Yes | Yes |
| `getSelectedItems()`, `getSelectedValues()` | Not exposed | Yes |
| `setError()`, `clearError()` | Not exposed | Yes |
| `setRequired()`, `validate()` | Not exposed | Yes |

Do not assume browser DOM capabilities are available from the native WebView handle. The common native/Web imperative methods are:

- `open()`
- `close()`
- `clear()`
- `clearSearch()`
- `setItems()`
- `setGroupedItems()`
- `setValue()`
- `updateConfig()`

```tsx
import { useRef } from 'react'
import { Button } from 'react-native'
import { Select, type SelectHandle } from '@smilodon/react-native'

const ref = useRef<SelectHandle>(null)

<>
	<Select ref={ref} items={items} />
	<Button title="Open" onPress={() => ref.current?.open()} />
	<Button title="Clear Search" onPress={() => ref.current?.clearSearch()} />
</>
```

React Native Web additionally benefits from the underlying DOM runtime. It exposes the extra handle methods in the table below, but web-adapter behavior parity is not implied by the common props alone.

## Events

The adapter implements forwarding of the core event model into React Native callbacks:

- `onChange`
- `onSelect`
- `onOpen`
- `onClose`
- `onSearch`
- `onLoadMore`
- `onCreate`
- `onClear`
- `onDiagnostic`

For controlled usage, `onChange` is the main callback to mirror back into state. Event ordering, bridge latency, error behavior, and timing have not been fully platform-certified as identical.

## Grouped items

Use `groupedItems` when you want native and web targets to render stable category sections.

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

## Diagnostics and tracking

The React Native adapter forwards the core tracking switches:

- `trackingEnabled`
- `trackEvents`
- `trackStyling`
- `trackLimitations`
- `emitDiagnostics`
- `trackingMaxEntries`
- `limitationPolicies`
- `autoMitigateRuntimeModeSwitch`

Use these when you need runtime observability during QA or production debugging.

## Practical limitations

- Native rendering depends on `WebView`, so your UX and performance characteristics are still ultimately powered by an embedded web runtime.
- `selectStyle` customizes the internal select through CSS variables, not React Native style props.
- Browser-only DOM hooks should not be assumed from native code; use the exported handle and callbacks instead.
- The Phase 4 browser matrix does not exercise iOS/Android WebView or assistive technology; no native or React Native Web accessibility parity claim is made here.

## Related docs

- [Root overview](../../README.md)
- [Styling guide](../../docs/STYLING.md)
- [Known limitations](../../docs/KNOWN-LIMITATIONS.md)
- [Feature-contract audit](../../docs/architecture/PHASE-4-FEATURE-CONTRACT-AUDIT.md)
- [Browser support policy](../../docs/compliance/BROWSER-SUPPORT.md)
