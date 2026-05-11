# @smilodon/react-native

React Native adapter for Smilodon.

This package provides two implementations behind one import:

- **Native mobile**: renders Smilodon inside a `react-native-webview` bridge
- **Web**: mounts the same core custom element directly for React Native Web environments

That split lets you keep one API surface while still using the DOM-based Smilodon core on native platforms.

## 📖 Documentation

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
- exposes the same imperative handle as the native variant.

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
- `clearable`
- `clearSelectionOnClear`
- `clearSearchOnClear`
- `clearAriaLabel`
- `clearIcon`
- `infiniteScroll`
- `pageSize`
- `virtualized`

### Native layout control

- `collapsedHeight`
- `expandedHeight`
- `containerStyle`
- `selectStyle`

`selectStyle` is forwarded into the embedded select element and is the main place to set Smilodon CSS variables from React Native.

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

The component exposes a `ref` handle with these methods:

- `open()`
- `close()`
- `clear()`
- `setItems()`
- `setGroupedItems()`
- `setValue()`

```tsx
import { useRef } from 'react'
import { Button } from 'react-native'
import { Select, type SelectHandle } from '@smilodon/react-native'

const ref = useRef<SelectHandle>(null)

<>
	<Select ref={ref} items={items} />
	<Button title="Open" onPress={() => ref.current?.open()} />
</>
```

## Events

The adapter forwards the core event model into React Native callbacks:

- `onChange`
- `onSelect`
- `onOpen`
- `onClose`
- `onSearch`
- `onLoadMore`
- `onCreate`
- `onClear`
- `onDiagnostic`

For controlled usage, `onChange` is the main callback to mirror back into state.

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

## Related docs

- [Root overview](../../README.md)
- [Styling guide](../../docs/STYLING.md)
- [Known limitations](../../docs/KNOWN-LIMITATIONS.md)
