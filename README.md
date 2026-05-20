<p align="center">
  <img src="./.github/logo.jpg" alt="Smilodon Logo" width="220" style="border-radius:16px;box-shadow:0 20px 45px rgba(16,24,40,.25);" />
</p>

<div align="center">
  <h1>Smilodon</h1>
  <p><strong>High-performance select components for Web Components, React, Vue, Svelte, SolidJS, Vanilla JS, and React Native.</strong></p>
  <p>
    <a href="https://www.npmjs.com/package/@smilodon/core"><img src="https://img.shields.io/npm/v/@smilodon/core.svg" alt="npm version"></a>
    <a href="https://bundlephobia.com/package/@smilodon/core"><img src="https://img.shields.io/bundlephobia/minzip/@smilodon/core" alt="bundle size"></a>
    <a href="LICENSE"><img src="https://img.shields.io/npm/l/@smilodon/core.svg" alt="license"></a>
  </p>
  <p>
    <strong><a href="https://navidrezadoost.github.io/Smilodon/">📚 View Documentation & Live Examples</a></strong>
  </p>
</div>

Smilodon is a shared select runtime built around the `enhanced-select` custom element and wrapped by framework-specific adapters. The goal is simple: one behavior model, one styling model, one diagnostics model, and one performance story across every supported platform.

Version `1.9.1-debug.0` is the current debug release for `@smilodon/core`.

---

## Table of contents

1. [What Smilodon provides](#what-smilodon-provides)
2. [Supported packages and platforms](#supported-packages-and-platforms)
3. [Core capabilities](#core-capabilities)
4. [Performance profile](#performance-profile)
5. [Compatibility and environment support](#compatibility-and-environment-support)
6. [Installation](#installation)
7. [Quick start by platform](#quick-start-by-platform)
8. [Styling and customization](#styling-and-customization)
9. [Diagnostics, limits, and runtime control](#diagnostics-limits-and-runtime-control)
10. [Testing, security, and compliance](#testing-security-and-compliance)
11. [Repository layout and documentation map](#repository-layout-and-documentation-map)
12. [Playground, scripts, and support](#playground-scripts-and-support)

---

## What Smilodon provides

Smilodon provides a complete select system for teams that need more than a styled dropdown.

### Functional support

- Single-select and multi-select modes
- Searchable lists
- Grouped options
- Infinite scroll and load-more flows
- Virtualized rendering for large datasets
- Clear control for selected values and search text
- Custom option rendering
- Keyboard-first accessibility behavior
- Runtime diagnostics and limitation reporting

### Engineering support

- Shared Web Component runtime in `@smilodon/core`
- Thin adapters for React, Vue, Svelte, SolidJS, Vanilla JS, and React Native
- Consistent event model across platforms
- Shared CSS token surface and shadow parts
- Programmatic APIs for open, close, clear, set items, diagnostics, and capability inspection
- Monorepo packaging with aligned versions and typed exports

### Operational support

- Performance budgets and profiling scripts
- Unit, contract, and end-to-end test coverage
- Architecture, styling, performance, and compliance documentation
- Known-limitation reporting and policy controls

## Adapter parity and configuration model

All maintained adapters now expose the same major runtime configuration groups that exist in `@smilodon/core`, so teams can stay inside their framework adapter without dropping down to the raw custom element for common advanced behavior.

### Shared advanced config groups

Across the maintained adapters, you can now work with:

- `selectionConfig`
- `multiSelectDisplay`
- `scrollToSelected`
- `styles`
- `config` (full `Partial<GlobalSelectConfig>` passthrough)

This means adapter users can configure:

- horizontal and vertical chip scrolling in multi-select mode
- drag-to-scroll chip behavior
- chip remove icon replacement and icon-only styling
- disabled-option hover/focus/select policies
- dropdown placement behavior
- scroll-to-selected behavior
- full runtime style config for badges, options, group headers, and remove icons

### Global defaults from adapter packages

The web adapters re-export the shared core config helpers so application code can set defaults from the adapter package directly:

- `@smilodon/react`
- `@smilodon/vue`
- `@smilodon/svelte`
- `@smilodon/solid`
- `@smilodon/vanilla`

Example:

```ts
import { configureSelect } from '@smilodon/react';

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
  multiSelectDisplay: {
    mode: 'wrap',
  },
});
```

For React Native, prefer per-instance `config` because the native path runs inside an embedded runtime.

### Example: adapter-level full config passthrough

#### React

```tsx
<Select
  items={items}
  multiple
  config={{
    dropdownPlacement: { mode: 'auto' },
    multiSelectDisplay: {
      mode: 'horizontal',
      maxHeight: '56px',
      dragScroll: true,
    },
    scrollToSelected: {
      enabled: true,
      multiSelectTarget: 'last',
    },
    selection: {
      closeOnSelect: false,
      allowDeselect: true,
    },
    styles: {
      badgeRemoveIcon: {
        color: '#dc2626',
      },
    },
  }}
/>
```

#### Vue

```vue
<Select
  :items="items"
  v-model="value"
  multiple
  :config="{
    multiSelectDisplay: { mode: 'vertical', maxHeight: '120px' },
    selection: { closeOnSelect: false },
    styles: {
      badgeRemoveIcon: { color: '#dc2626' }
    }
  }"
/>
```

#### Vanilla

```ts
const select = createSelect({
  items,
  multiple: true,
  config: {
    multiSelectDisplay: { mode: 'horizontal', dragScroll: true },
    selection: { closeOnSelect: false },
  },
});
```

#### React Native

```tsx
<Select
  items={items}
  multiple
  config={{
    multiSelectDisplay: { mode: 'horizontal', dragScroll: true },
    selection: { closeOnSelect: false },
  }}
  selectStyle={{
    '--select-badge-remove-icon-color': '#dc2626',
  }}
/>
```

### Shared imperative surface

The web adapters also expose more of the shared imperative runtime surface, including combinations of:

- `clearSearch()`
- `updateConfig()` or adapter-equivalent runtime config methods
- `setError()` / `clearError()`
- `setRequired()`
- `validate()`

That keeps framework code closer to the shared runtime model and reduces the gap between adapter usage and direct custom-element usage.

---

## Supported packages and platforms

Smilodon is not a single framework package. It is a system made of one runtime plus adapters.

| Package | Purpose | Primary targets | Status |
| --- | --- | --- | --- |
| `@smilodon/core` | Base custom element runtime (`enhanced-select`) | Browser apps, design systems, direct DOM usage | Primary runtime |
| `@smilodon/react` | React wrapper around the core element | React, Next.js client components | Maintained |
| `@smilodon/vue` | Vue 3 wrapper | Vue 3, Nuxt | Maintained |
| `@smilodon/svelte` | Svelte wrapper | Svelte, SvelteKit | Maintained |
| `@smilodon/solid` | SolidJS wrapper | SolidJS apps | Maintained |
| `@smilodon/vanilla` | Helper utilities for direct DOM setup | Vanilla JS / TS | Maintained |
| `@smilodon/react-native` | React Native adapter with native/web split | React Native, React Native Web | Maintained |

### Support summary by platform

| Platform | Delivery model | SSR / hydration posture | Styling model | Diagnostics support |
| --- | --- | --- | --- | --- |
| Web Components | Native custom element | Browser-first | CSS variables + `::part()` | Full |
| React | Component wrapper | Client-rendered, Next.js App Router compatible | Shared token surface | Full |
| Vue 3 | Component wrapper | Nuxt-compatible with custom-element compiler config | Shared token surface | Full |
| Svelte | Component wrapper | SvelteKit-safe when mounted in browser lifecycle | Shared token surface | Full |
| SolidJS | Component wrapper | Browser/client usage with safe upgrade handling | Shared token surface | Full |
| Vanilla JS | Helper API + custom element | Browser-first | Shared token surface | Full |
| React Native | WebView bridge on native, direct element on web | Native/mobile oriented | CSS tokens via bridged style map | Full |

### Intentionally not provided

- Angular adapter support is not part of the maintained `1.9.1-debug.0` package line.
- Legacy browser shims are not a first-class target.
- Server-rendered HTML replacement for the interactive control is not the primary design goal; adapters focus on safe client hydration around the custom element.

---

## Core capabilities

All maintained adapters are designed to expose the same core behavior set wherever the host platform makes that practical.

| Capability area | Details |
| --- | --- |
| Selection | Single, multi, clearable selections, chip rendering, selection limits |
| Search | Local search, debounced remote search hooks, search event emission |
| Data scale | Virtualization for very large lists, incremental rendering, large-list stress handling |
| Rendering | Plain text, templated output, DOM renderers, framework renderers |
| Grouping | Flat items or grouped sections |
| Accessibility | ARIA listbox semantics, keyboard navigation, screen-reader announcements, touch targets |
| Diagnostics | `diagnostic` events, tracking buckets, capability reports |
| Runtime control | `open()`, `close()`, `clear()`, `setItems()`, `setGroupedItems()`, limitation policies |
| Styling | Shared CSS custom properties, parts, dark mode hooks, high-contrast and reduced-motion hooks |

Representative use cases:

- enterprise forms and admin panels
- analytics filters over large datasets
- compliance and audit workflows
- mobile management tooling via React Native
- design systems that want one runtime across multiple frameworks

---

## Performance profile

Smilodon is designed around keeping work proportional to what the user can actually see.

### Performance approach

- Virtualization keeps DOM size close to visible rows plus buffer rows.
- Search and filtering can move heavy work away from the main thread.
- Selection and re-render behavior are normalized through the shared runtime.
- Adapters avoid re-creating the full interaction model per framework.

### Target profile

The performance docs and benchmarks are structured around these operating targets.

| Dataset size | Typical render target | Typical memory target | Scroll target |
| --- | --- | --- | --- |
| 100 | `<10 ms` | ~2 MB | 60 FPS |
| 1,000 | `<20 ms` | ~4 MB | 60 FPS |
| 10,000 | `<50 ms` | ~8 MB | 60 FPS |
| 100,000 | `<100 ms` | ~12 MB | 60 FPS |
| 1,000,000 | `<200 ms` | ~18 MB | 57–60 FPS |

### Why performance is consistent across adapters

The adapters are intentionally thin. The expensive work lives in the shared runtime, so React, Vue, Svelte, SolidJS, and Vanilla JS all benefit from the same virtualization, option management, diagnostics, and selection logic.

### Performance support you can rely on

- budget-oriented profiling in `scripts/perf.js`
- documented tuning guidance in [docs/PERFORMANCE.md](./docs/PERFORMANCE.md)
- repeatable manual measurement flow in [docs/PERFORMANCE-RUNBOOK.md](./docs/PERFORMANCE-RUNBOOK.md)
- adapter/runtime capability notes in [docs/ADAPTER-CAPABILITY-MATRIX.md](./docs/ADAPTER-CAPABILITY-MATRIX.md)

---

## Compatibility and environment support

Smilodon targets modern environments first.

### Browser compatibility

Tier 1 browser support is documented around the modern evergreen baseline:

| Browser family | Minimum baseline |
| --- | --- |
| Chrome | 90+ |
| Edge | 90+ |
| Firefox | 88+ |
| Safari | 14.1+ |
| iOS Safari | 14.5+ |
| Android Chrome | 90+ |
| Samsung Internet | 14+ |

Best-effort support exists for some older browsers, but the maintained baseline assumes modern support for:

- ES2020 features
- CSS custom properties
- Intersection Observer
- ResizeObserver
- Web Workers
- Shadow DOM

See [docs/compliance/BROWSER-SUPPORT.md](./docs/compliance/BROWSER-SUPPORT.md) for the broader policy.

### Node and package manager compatibility

- Node.js `>=18`
- npm `>=9`
- ESM-first workspace with CJS outputs where packages expose them

### Framework compatibility

| Adapter | Expected host compatibility |
| --- | --- |
| React | React `>=16.8.0`, React DOM `>=16.8.0` |
| Vue | Vue `^3.0.0` |
| Svelte | Svelte `>=3`, `>=4`, or `>=5` |
| SolidJS | SolidJS `^1.9.0` |
| React Native | React `>=18.2.0`, React Native `>=0.74.0`, `react-native-webview >=13.12.0` |

### Compatibility notes by integration style

- **Next.js**: use `@smilodon/react` from client components.
- **Nuxt**: configure `enhanced-select` as a custom element in the Vue compiler path.
- **SvelteKit**: keep browser-only imperative access inside `onMount()`.
- **React Native**: native uses a WebView bridge; web uses the direct element path.
- **Vanilla JS / design systems**: use `@smilodon/core` directly when you want the most control.

### Build tool integration for unsupported frameworks

Frameworks without a first-party Smilodon adapter can still integrate through the shared Web Component runtime in `@smilodon/core`.

| Build tool | Recommended path | Notes |
| --- | --- | --- |
| Vite | Import `@smilodon/core` in the browser entry and render `<enhanced-select>` | Best default for browser-first apps and lightweight custom-element integration |
| Webpack 5 | Import `@smilodon/core` in the client bootstrap and keep the element client-rendered | Good fit for custom enterprise stacks and older framework ecosystems |
| Turbopack | Register `@smilodon/core` from a client boundary and mount the element only on the client | Best for Next.js/Turbopack-style app shells or custom React-adjacent stacks |

Full build-tool guidance lives in [docs/BUILD-TOOL-INTEGRATION.md](./docs/BUILD-TOOL-INTEGRATION.md).

---

## Installation

Install the core runtime plus the adapter for your platform.

```bash
# Core runtime
npm install @smilodon/core

# React
npm install @smilodon/react @smilodon/core

# Vue
npm install @smilodon/vue @smilodon/core

# Svelte
npm install @smilodon/svelte @smilodon/core

# SolidJS
npm install @smilodon/solid @smilodon/core solid-js

# Vanilla helpers
npm install @smilodon/vanilla @smilodon/core

# React Native
npm install @smilodon/react-native react-native-webview
```

---

## Quick start by platform

### Web Component / Vanilla

```html
<enhanced-select id="people"></enhanced-select>
<script type="module">
  import '@smilodon/core';

  const select = document.getElementById('people');
  select.setItems([
    { value: 'ada', label: 'Ada Lovelace' },
    { value: 'grace', label: 'Grace Hopper' },
  ]);
  select.updateConfig({
    searchable: true,
    selection: { mode: 'single' },
  });
</script>
```

### React / Next.js client component

```tsx
'use client';

import { useState } from 'react';
import { Select } from '@smilodon/react';

export default function Example() {
  const [value, setValue] = useState<string | number>('');

  return (
    <Select
      items={[
        { value: 'react', label: 'React' },
        { value: 'vue', label: 'Vue' },
      ]}
      value={value}
      onChange={(next) => setValue(next as string)}
      searchable
      clearable
      placeholder="Choose a framework"
    />
  );
}
```

### Vue 3 / Nuxt

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Select } from '@smilodon/vue'

const value = ref<string | number>('')
</script>

<template>
  <Select
    v-model="value"
    :items="[
      { value: 'vue', label: 'Vue' },
      { value: 'nuxt', label: 'Nuxt' }
    ]"
    searchable
    clearable
    placeholder="Choose a framework"
  />
</template>
```

### Svelte / SvelteKit

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte'
  let value: string | number = ''
  const items = [
    { value: 'svelte', label: 'Svelte' },
    { value: 'kit', label: 'SvelteKit' },
  ]
</script>

<Select
  {items}
  bind:value
  searchable
  clearable
  placeholder="Choose a framework"
/>
```

### SolidJS

```tsx
import { createSignal } from 'solid-js'
import { Select } from '@smilodon/solid'

export default function Example() {
  const [value, setValue] = createSignal<string | number>('')

  return (
    <Select
      items={[
        { value: 'solid', label: 'SolidJS' },
        { value: 'qwik', label: 'Qwik' },
      ]}
      value={value()}
      onChange={(next) => setValue(next as string)}
      searchable
    />
  )
}
```

### React Native

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
        ]}
        value={value}
        onChange={(next) => setValue(next as string)}
        searchable
        clearable
      />
    </View>
  )
}
```

For deeper framework guidance, use the package-level guides:

- [packages/react/README.md](./packages/react/README.md)
- [packages/vue/README.md](./packages/vue/README.md)
- [packages/svelte/README.md](./packages/svelte/README.md)
- [packages/solid/README.md](./packages/solid/README.md)
- [packages/react-native/README.md](./packages/react-native/README.md)
- [packages/core/README.md](./packages/core/README.md)

---

## Styling and customization

Smilodon uses a shared styling surface so every adapter can be themed in the same way.

### Primary styling hooks

- CSS custom properties such as `--select-input-*`, `--select-dropdown-*`, `--select-option-*`, and `--select-badge-*`
- shadow parts such as `::part(button)`, `::part(listbox)`, `::part(option)`, `::part(chip)`, and `::part(clear-button)`
- custom renderers for rich option content
- class-based state mapping where adapters expose it

Recent styling additions are now documented across the shared docs set, including:

- alignment controls for the closed selected value and the open dropdown option list
- dropdown placement modes: `bottom`, `top`, and `auto`
- direction support with `ltr` / `rtl` at both global and per-instance levels
- multi-select chip sizing, spacing, hover, and active states
- multi-select display modes for wrapped, vertical-scroll, and true horizontal drag-scroll chip rows
- chip remove button sizing and custom SVG/text icons via `selection.removeButtonIcon`
- group-header spacing, alignment, color, border, radius, and shadow hooks
- additive later-group separator tokens so every group title keeps the same padding while `--select-group-header-separator-*` adds spacing and dividers between sections
- option border, radius, hover, active, selected, and disabled state hooks
- dedicated selected + active option tokens so keyboard focus on a selected option keeps the selected surface while still showing an active outline/shadow
- runtime `styles` config sections such as `badge`, `badgeRemove`, `badgeLabel`, `groupHeader`, and `activeOption`

### Setting direction

The shared default direction is `ltr`. Switch it globally or per instance with `direction`.

Global:

```ts
configureSelect({
  direction: 'rtl',
});
```

Per instance:

```ts
select.updateConfig({
  direction: 'rtl',
});
```

### Styling support summary

| Need | Smilodon support |
| --- | --- |
| Design-system tokens | Shared CSS variables |
| Cross-framework theming | Same token surface in every adapter |
| Tailwind / utility CSS | `classMap`, host classes, CSS variables, `::part()`, custom renderers |
| Bootstrap / traditional CSS | Host selectors, CSS variables, `::part()`, framework layout classes |
| Material UI / CSS-in-JS | Host `className` / `style`, theme-driven CSS variables, `GlobalStyles`, `sx`, `::part()` |
| Dark mode | Shared dark theme remapping |
| Reduced motion | Dedicated motion tokens and media-query handling |
| High contrast | Dedicated accessibility tokens |
| Custom option UI | DOM renderers and framework renderers |

### CSS framework compatibility

Smilodon is designed to work with browser styling systems rather than compete with them.

- Tailwind CSS can style host layout directly and option states through `classMap`.
- Bootstrap can provide page layout, spacing, forms alignment, and token-driven select theming.
- Material UI can theme the host wrapper through `sx`, `styled()`, or `GlobalStyles`, while Smilodon consumes the resulting CSS variables and `::part()` rules.
- Raw CSS always remains a first-class path through host selectors, CSS custom properties, and shadow parts.

For multi-select chip layouts, prefer `multiSelectDisplay.mode` over raw overflow overrides alone. `wrap` grows naturally, `vertical` adds a constrained chip area with vertical scrolling, and `horizontal` enables the single-row chip contract, drag-scroll handling, and end-of-row spacing for the arrow/clear controls.

In practice that means:

- `wrap` lets the control grow with its chips and does not add an internal chip scrollbar by default
- `vertical` keeps wrapping enabled but constrains the chip area to `maxHeight`, so the scrollbar stays inside the value area and stops before the arrow / clear-control region
- `horizontal` locks the chip row to a single line, keeps the trigger height stable, and lets chips scroll underneath the fixed action area

### Disabled / dimmed options

Items marked with `disabled: true` are dimmed and non-selectable by default.

- they do not select on click or keyboard activation
- they do not receive hover styling by default
- they are skipped by default keyboard navigation and range-selection flows

If you want a dimmed option to remain partially interactive, use `selection.disabledOptionBehavior`:

```ts
select.updateConfig({
  selection: {
    disabledOptionBehavior: {
      hoverable: true,
      focusable: true,
      selectable: false,
    },
  },
});
```

Styling hooks for dimmed options remain:

- `styles.disabledOption`
- `classMap.disabled`
- `--select-option-disabled-*` CSS variables

### Selected indicator and pressed-state control

Smilodon now makes the selected option indicator and click-state styling easier to control without reaching for internal pseudo-element selectors.

- hide the selected side indicator with `selection.showSelectedIndicator = false`
- customize its placement and appearance with `styles.selectedIndicator` or `--select-option-selected-indicator-*`
- the default pressed transform and active outline are now disabled, so options no longer add the old click animation / border unless you opt back in

Example:

```ts
select.updateConfig({
  selection: {
    showSelectedIndicator: false,
  },
  styles: {
    selectedIndicator: {
      width: '4px',
      background: '#2563eb',
      right: '0',
      left: 'auto',
    },
  },
});
```

If you want the older pressed feedback back, set these tokens explicitly:

- `--select-option-pressed-transform`
- `--select-option-selected-pressed-transform`
- `--select-option-active-outline`
- `--select-option-selected-active-outline`

### Chip remove icon control

Selected chips can use a custom remove icon through `selection.removeButtonIcon` in the shared runtime or `removeButtonIcon` in adapter props.

The icon can be plain text or inline SVG markup. To style the icon separately from the remove button shell, use:

- `::part(chip-remove-icon)`
- `styles.badgeRemoveIcon`
- `classNames.badgeRemoveIcon`
- `--select-badge-remove-icon-*` CSS variables

### CSS framework compatibility in `1.5.5`

The `1.5.5` release hardens the custom-renderer path used by Tailwind-style and framework-driven option UIs.

- mirrored document styles are now scoped to the options subtree instead of the entire shadow root, which reduces framework-preflight bleed into the Smilodon shell
- dark framework selectors such as `.dark`, `.dark-mode`, `[data-theme="dark"]`, and similar theme markers are mirrored into the scoped options subtree so dark variants update immediately
- escaped utility selectors such as Tailwind `dark\:*` classes are preserved correctly during selector scoping
- custom-rendered option roots continue to receive Smilodon state classes and data attributes, so hover, active, selected, and disabled visuals can be styled reliably at the rendered root element
- custom renderer accessibility is normalized so nested interactive descendants do not break option semantics or keyboard/screen-reader behavior

For exact recipes and browser-oriented examples, see [docs/CSS-FRAMEWORK-COMPATIBILITY.md](./docs/CSS-FRAMEWORK-COMPATIBILITY.md).

Dropdown placement can be configured globally or per instance through `dropdownPlacement.mode` with `bottom`, `top`, or `auto`.

Reference docs:

- [docs/STYLING.md](./docs/STYLING.md)
- [docs/STYLING-TOKENS.md](./docs/STYLING-TOKENS.md)
- [docs/STYLING-EXAMPLES.md](./docs/STYLING-EXAMPLES.md)
- [docs/API-REFERENCE.md](./docs/API-REFERENCE.md#shared-runtime-styling-and-selection-config)
- [docs/CSS-FRAMEWORK-COMPATIBILITY.md](./docs/CSS-FRAMEWORK-COMPATIBILITY.md)
- [docs/BUILD-TOOL-INTEGRATION.md](./docs/BUILD-TOOL-INTEGRATION.md)

---

## Diagnostics, limits, and runtime control

Smilodon includes runtime inspection APIs so host applications can reason about what the control supports and what limitations apply.

### Runtime APIs exposed by the shared runtime

- `getCapabilities()`
- `getKnownLimitations()`
- `getTrackingSnapshot()`
- `clearTracking(source?)`
- `setLimitationPolicies(policies)`

### Diagnostics support

- optional `diagnostic` event emission
- event tracking bucket
- styling tracking bucket
- limitation tracking bucket
- configurable max tracking entries

### Known limitation controls

The shared runtime tracks known limitation categories such as:

- variable item heights
- built-in fetch transport absence
- small-list virtualization overhead trade-offs
- runtime single/multi mode switching
- legacy browser support gaps
- WebKit-on-Arch Playwright constraints

See [docs/ADAPTER-CAPABILITY-MATRIX.md](./docs/ADAPTER-CAPABILITY-MATRIX.md) and [docs/KNOWN-LIMITATIONS.md](./docs/KNOWN-LIMITATIONS.md).

---

## Testing, security, and compliance

### Quality support

The repository includes:

- unit testing for the shared runtime
- contract testing across adapters
- Playwright end-to-end coverage
- performance profiling support

Useful commands:

```bash
npm run test:unit
npm run test:contracts
npm run test:e2e
npm run perf
```

Testing docs:

- [docs/TESTING-ARCHITECTURE.md](./docs/TESTING-ARCHITECTURE.md)
- [tests/README.md](./tests/README.md)

### Security and compliance support

- SBOM published in [sbom.json](./sbom.json)
- privacy documentation in [docs/compliance/PRIVACY-POLICY.md](./docs/compliance/PRIVACY-POLICY.md)
- threat model in [docs/compliance/THREAT-MODEL.md](./docs/compliance/THREAT-MODEL.md)
- SOC 2 documentation in [docs/compliance/SOC2-COMPLIANCE.md](./docs/compliance/SOC2-COMPLIANCE.md)
- WCAG workstream in [docs/compliance/WCAG-COMPLIANCE.md](./docs/compliance/WCAG-COMPLIANCE.md)
- browser support policy in [docs/compliance/BROWSER-SUPPORT.md](./docs/compliance/BROWSER-SUPPORT.md)

---

## Repository layout and documentation map

### Repository structure

| Path | Purpose |
| --- | --- |
| `packages/core` | Shared runtime and custom element |
| `packages/react` | React adapter |
| `packages/vue` | Vue adapter |
| `packages/svelte` | Svelte adapter |
| `packages/solid` | SolidJS adapter |
| `packages/vanilla` | Vanilla helper layer |
| `packages/react-native` | React Native adapter |
| `docs` | Deep-dive documentation |
| `tests` | Contract and end-to-end test support |
| `playground` | Maintained interactive demo workspace |
| `scripts` | Performance and verification utilities |

### Recommended reading order

1. Start with this `README.md`
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md)
3. Choose your adapter guide from `packages/*/README.md`
4. Review [docs/STYLING.md](./docs/STYLING.md) and [docs/STYLING-TOKENS.md](./docs/STYLING-TOKENS.md)
5. Review [docs/PERFORMANCE.md](./docs/PERFORMANCE.md) before high-scale rollout
6. Review [docs/KNOWN-LIMITATIONS.md](./docs/KNOWN-LIMITATIONS.md) and [docs/ADAPTER-CAPABILITY-MATRIX.md](./docs/ADAPTER-CAPABILITY-MATRIX.md)

### Deep-dive docs retained in the repository

- [docs/API-REFERENCE.md](./docs/API-REFERENCE.md)
- [docs/SELECT-COMPONENT.md](./docs/SELECT-COMPONENT.md)
- [docs/SELECT-IMPLEMENTATION.md](./docs/SELECT-IMPLEMENTATION.md)
- [docs/BUILD-TOOL-INTEGRATION.md](./docs/BUILD-TOOL-INTEGRATION.md)
- [docs/ALGORITHMS.md](./docs/ALGORITHMS.md)
- [docs/BENCHMARKS.md](./docs/BENCHMARKS.md)
- [docs/CUSTOM-OPTION-COMPONENTS.md](./docs/CUSTOM-OPTION-COMPONENTS.md)

---

## Playground, scripts, and support

### Playground

The `playground` workspace is still used and has been trimmed to the maintained entry points:

- `playground/index.html`
- `playground/react-demo.html`
- `playground/vue-demo.html`
- `playground/svelte-demo.html`
- `playground/vanilla-demo.html`
- `playground/sandbox.html`

Run it with:

```bash
npm run dev -w @smilodon/playground
```

### Scripts

The root `scripts` folder is retained for repository-level utilities that are still in use:

- `scripts/perf.js` for performance budgets and profiling
- `scripts/verify-playwright.mjs` for end-to-end preflight checks

### Project support channels

- Issues: <https://github.com/navidrezadoost/smilodon/issues>
- Security policy: [SECURITY.md](./SECURITY.md)
- Contribution guide: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Maintainer contact: `navidrezadoost07@gmail.com`

---

<div align="center">
  Built for teams that need one select system across platforms • <a href="#table-of-contents">Back to top</a>
</div>
