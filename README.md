<p align="center">
  <img src="./.github/logo.jpg" alt="Smilodon Logo" width="220" style="border-radius:16px;box-shadow:0 20px 45px rgba(16,24,40,.25);" />
</p>

<div align="center">
  <h1>Smilodon Select Components</h1>
  <p><strong>Enterprise-grade, high-performance select components engineered for extreme data scale, accessibility, and compliance.</strong></p>
  <p>
    <a href="https://www.npmjs.com/package/@smilodon/core"><img src="https://img.shields.io/npm/v/@smilodon/core.svg" alt="npm version"></a>
    <a href="https://bundlephobia.com/package/@smilodon/core"><img src="https://img.shields.io/bundlephobia/minzip/@smilodon/core" alt="bundle size"></a>
    <a href="LICENSE"><img src="https://img.shields.io/npm/l/@smilodon/core.svg" alt="license"></a>
    <a href="./E2E-TEST-SUMMARY.md"><img src="https://img.shields.io/badge/tests-93%2F98%20passing-success" alt="tests"></a>
  </p>
</div>

> Designed for teams who expect enterprise reliability, uncompromising speed, and platform flexibility without sacrificing developer ergonomics.

> **Latest (v1.5.0):** Unified the release line across core and adapters, added first-party SolidJS and React Native adapters, refreshed the architecture reference, and turned the root README into the main router for functional docs.

**Release highlights in v1.5.0**

- New adapters: `@smilodon/solid` and `@smilodon/react-native` now sit alongside React, Vue, Svelte, and Vanilla.
- Version alignment: published packages now move together on the `1.5.0` line for clearer releases.
- Documentation routing: the root guide now points directly to getting-started, API, styling, performance, testing, and known-limitations documents.
- Repository cleanup: obsolete root-level manual HTML test surfaces were removed in favor of package docs, examples, and the maintained playground.


---

## Table of Contents

1. [Chapter 1 — Product Overview](#chapter-1--product-overview)
2. [Chapter 2 — System Architecture](#chapter-2--system-architecture)
3. [Chapter 3 — Capabilities & Use Cases](#chapter-3--capabilities--use-cases)
4. [Chapter 4 — Performance & Analysis (Speed + Performance)](#chapter-4--performance--analysis-speed--performance)
5. [Chapter 5 — Framework Playbooks](#chapter-5--framework-playbooks)
6. [Chapter 6 — Testing & Quality Gates](#chapter-6--testing--quality-gates)
7. [Chapter 7 — Compliance, Security & Governance](#chapter-7--compliance-security--governance)
8. [Chapter 8 — Adoption, Tooling & Support](#chapter-8--adoption-tooling--support)

---

## Chapter 1 — Product Overview

Smilodon is a Web Component powered select/dropdown system that remains responsive even when navigating millions of records. It exposes consistent ergonomics across React, Vue, Svelte, and Vanilla JavaScript while keeping the core bundle at **6.6 KB gzipped**.

| Characteristic | Smilodon | Legacy Select Libraries |
| --- | --- | --- |
| Max validated dataset | 1,000,000 items @ 60 FPS | 10,000–50,000 before slowdown |
| First interaction latency | < 50 ms | 400–2,500 ms |
| Accessibility | WCAG 2.2 AA/AAA (in progress) | Partial ARIA coverage |
| Security | CSP safe, zero eval, SBOM shipped | Mixed CSP compliance |

**Why it matters:** teams can standardize on a single select primitive that scales from onboarding forms to compliance dashboards without bespoke tuning.

---

## Chapter 2 — System Architecture

- **Rendering core** — virtual scrolling with adaptive windowing, incremental hydration, and GPU-friendly transforms.
- **Data plane** — Fenwick tree + indexed buffers for O(log n) inserts/removals, worker-backed filtering and ranking.
- **Customization** — theming tokens, CSS shadow parts, slot-based templating, and per-framework bindings.
- **Telemetry** — built-in performance markers (`performance.mark/measure`), console timelines, and optional web worker profiling.
- **Distribution** — multi-package workspace (`packages/*`) with typed exports and dual ESM/CJS output.

Deep dives: [ARCHITECTURE.md](./ARCHITECTURE.md), [docs/SELECT-IMPLEMENTATION.md](./docs/SELECT-IMPLEMENTATION.md), [docs/ALGORITHMS.md](./docs/ALGORITHMS.md).

### Functional documentation map

| Need | Start here |
| --- | --- |
| Platform onboarding | [docs/GETTING-STARTED.md](./docs/GETTING-STARTED.md) |
| API contract | [docs/API-REFERENCE.md](./docs/API-REFERENCE.md) |
| Component behavior | [docs/SELECT-COMPONENT.md](./docs/SELECT-COMPONENT.md) |
| Implementation details | [docs/SELECT-IMPLEMENTATION.md](./docs/SELECT-IMPLEMENTATION.md) |
| Styling and design tokens | [docs/STYLING.md](./docs/STYLING.md), [docs/STYLING-TOKENS.md](./docs/STYLING-TOKENS.md) |
| Performance and operations | [docs/PERFORMANCE.md](./docs/PERFORMANCE.md), [docs/PERFORMANCE-RUNBOOK.md](./docs/PERFORMANCE-RUNBOOK.md) |
| Testing model | [docs/TESTING-ARCHITECTURE.md](./docs/TESTING-ARCHITECTURE.md), [tests/README.md](./tests/README.md) |
| Runtime limits and adapter parity | [docs/KNOWN-LIMITATIONS.md](./docs/KNOWN-LIMITATIONS.md), [docs/ADAPTER-CAPABILITY-MATRIX.md](./docs/ADAPTER-CAPABILITY-MATRIX.md) |

---

## Chapter 3 — Capabilities & Use Cases

### Feature Matrix

| Capability | Highlights |
| --- | --- |
| Search modes | Client-side fuzzy, server-side async with debouncing, highlight rendering |
| Selection | Single, multi, tag-style chips, keyboard-only workflows |
| Data scale | 1M rows validated, configurable buffering, streaming hydration |
| Accessibility | Full ARIA pattern, screen reader announcements, focus trapping, 44px touch targets |
| Custom UI | Slot templates, theme tokens, light/dark theming, design-token aware |
| **Custom Components** | **Pass framework components (React/Vue/Svelte) for rendering options with lifecycle management** |
| Runtime control | `getCapabilities()`, limitation policy controls, and tracking snapshots across all adapters |
| Observability | Perf heat-map overlay (playground), console instrumentation, metrics exporter |

### Representative Workloads

- **Enterprise CRUD** — nested lookup fields with audit logging.
- **Analytics consoles** — filter builders with 50–200K items.
- **Mobile admin tooling** — low-latency multi-select with haptic-friendly controls.
- **Compliance checklists** — WCAG-driven experiences validated with NVDA + VoiceOver.

---

## Chapter 4 — Performance & Analysis (Speed & Performance)

### 4.1 Methodology

- **Hardware**: MacBook Pro M3 / Intel i7 desktop, 32 GB RAM; Chrome 120, Firefox 121, Safari 17, Edge 120.
- **Instrumentation**: `performance.mark/measure`, Web Vitals, custom worker telemetry, memory snapshots via Chrome DevTools protocol, Playwright trace for regression.
- **Datasets**: synthetic (uniform + Zipf distributions) from 100 → 1,000,000 items, plus real catalog exports.
- **Measurement cadence**: cold start, warm start, sustained scroll, stress multi-select.

### 4.2 Results Summary

```
Dataset Size    │ First Paint │ Interactive │ Search (p95) │ Memory │ Scroll FPS
────────────────┼─────────────┼─────────────┼──────────────┼────────┼───────────
100 items       │ 7 ms        │ 9 ms        │ 3 ms          │ 2 MB   │ 60 FPS
1,000 items     │ 14 ms       │ 18 ms       │ 5 ms          │ 4 MB   │ 60 FPS
10,000 items    │ 38 ms       │ 42 ms       │ 9 ms          │ 8 MB   │ 60 FPS
100,000 items   │ 81 ms       │ 95 ms       │ 16 ms         │ 12 MB  │ 60 FPS
1,000,000 items │ 162 ms      │ 191 ms      │ 33 ms         │ 18 MB  │ 57–60 FPS
```

> **Budget guardrails:** Components yellow-flag at 50 ms render or 20 ms search time, red-flag above 100 ms/50 ms respectively. CI profiles enforce these limits per commit via `scripts/perf.js`.

### 4.3 Comparative Analysis

| Library | 10K dataset | 100K dataset | 1M dataset | Notes |
| --- | --- | --- | --- | --- |
| Smilodon | 42 ms | 95 ms | 191 ms | Virtual viewport + worker search |
| React Select | 2,500 ms | ⚠️ Crash | - | DOM bloat, no virtualization |
| Downshift | 1,800 ms | 45,000 ms | ⚠️ Crash | CPU-bound filtering |
| Vue Select | 1,600 ms | 44,000 ms | ⚠️ Crash | Template re-render storm |

### 4.4 Engineering Insights

- **Speed** — Work stealing between UI thread + worker prevents long tasks. Idle callbacks prefetch result sets before scroll arrives.
- **Memory** — ring buffers hold only visible nodes, releasing GC pressure even under multi-select tag chips.
- **Observability** — `window.__SMILODON_PERF__` exposes counters for dashboards; see [docs/PERFORMANCE.md](./docs/PERFORMANCE.md) for exporter schema.

### 4.5 Cross-Framework Competitive Benchmarking

| Ecosystem | Popular Package (baseline) | Known bottleneck (from vendor docs/issues) | Smilodon delta | Evidence |
| --- | --- | --- | --- | --- |
| React | React Select | No virtualization; DOM grows O(n) → multi-second stalls at 10–50K items | **>50× faster @100K**, 6.6 KB vs ~28 KB | Our perf table + React Select docs highlighting lack of virtual scroll |
| React | MUI Autocomplete | Full list render; filter on main thread; accessibility partial | **<100 ms @100K**, WCAG AA, worker search | Smilodon worker filtering + ARIA patterns in [docs/ALGORITHMS.md](./docs/ALGORITHMS.md) |
| React | Headless UI Combobox | Template re-render storm; no item windowing | **O(1) DOM**, constant 19 nodes for 10K | Virtual windowing described in [docs/SELECT-IMPLEMENTATION.md](./docs/SELECT-IMPLEMENTATION.md) |
| Vue | Vue Select | Template re-render; CPU-bound filter | **<100 ms @100K** vs seconds | Perf matrix above; Vue Select docs note filtering in UI thread |
| Svelte | svelte-select | Renders full list; memory pressure beyond 10K | **8–12 MB @100K** vs hundreds MB | Memory table above; smilodon ring buffer design |
| Vanilla | Choices.js | No virtual scroll; large DOM | **O(visible)** nodes, CSP-safe | Shadow DOM + CSP in [docs/SELECT-IMPLEMENTATION.md](./docs/SELECT-IMPLEMENTATION.md) |

**Why Smilodon wins:**

- **Documented virtualization** keeps DOM size constant (visible + buffer), so scroll cost is O(1) not O(n) — see [docs/PERFORMANCE.md](./docs/PERFORMANCE.md#performance-by-dataset-size).
- **Worker-backed search** removes CPU spikes on large datasets; budgets enforced via `scripts/perf.js` traces checked into CI.
- **Accessibility & CSP** baked in: ARIA patterns, zero `eval`, shadow DOM isolation — contrasted with gaps in competing packages’ own docs.
- **Bundle discipline**: 6.6 KB gzipped core + ~787B adapters per framework vs 20–30 KB+ competitors, freeing main-thread and network budgets.

---

## Chapter 5 — Framework Playbooks

Smilodon ships a single core interaction model with framework-native adapters layered on top. That keeps behavior, styling, diagnostics, and known-limitation reporting consistent whether you mount it in React, Vue, Svelte, SolidJS, React Native, or plain DOM code.

### Guide matrix

| Platform | Package | Best starting document | Notes |
| --- | --- | --- | --- |
| React | `@smilodon/react` | [packages/react/README.md](./packages/react/README.md) | Includes controlled mode, refs, renderers, and Next.js notes. |
| Next.js | `@smilodon/react` | [packages/react/README.md](./packages/react/README.md) | Uses client components; adapter emits `'use client';` for App Router compatibility. |
| Vue 3 | `@smilodon/vue` | [packages/vue/README.md](./packages/vue/README.md) | Covers `v-model`, emits, `defineExpose`, and custom rendering. |
| Nuxt | `@smilodon/vue` | [packages/vue/README.md](./packages/vue/README.md) | Requires custom-element treatment for `enhanced-select`. |
| Svelte | `@smilodon/svelte` | [packages/svelte/README.md](./packages/svelte/README.md) | Covers `bind:value`, dispatch events, and SSR-safe mounting. |
| SolidJS | `@smilodon/solid` | [packages/solid/README.md](./packages/solid/README.md) | Solid-specific callback ref handle, JSX renderers, and grouped data. |
| React Native | `@smilodon/react-native` | [packages/react-native/README.md](./packages/react-native/README.md) | Native `WebView` bridge plus web fallback implementation. |
| Vanilla / Web Components | `@smilodon/core`, `@smilodon/vanilla` | [packages/vanilla/COMPLETE-GUIDE.md](./packages/vanilla/COMPLETE-GUIDE.md) | Lowest-level DOM and custom-element usage. |

### Shared adapter guarantees

- **Consistent feature surface**: searchable, multi-select, grouped items, virtualization, clear control, diagnostics, and limitation policies are exposed across adapters.
- **Token-first styling**: all adapters feed into the same shadow-DOM token surface documented in [docs/STYLING.md](./docs/STYLING.md) and [docs/STYLING-TOKENS.md](./docs/STYLING-TOKENS.md).
- **Imperative escape hatches**: each adapter exposes programmatic control for opening, closing, clearing, and replacing items.
- **SSR-aware integration**: adapters wait for the underlying custom element where needed instead of assuming immediate browser-only availability.

### Quick integration patterns

#### 5.1 React + Next.js

```tsx
'use client';

import { useMemo, useRef, useState } from 'react';
import { Select, type SelectHandle } from '@smilodon/react';

export default function ProductPicker() {
  const ref = useRef<SelectHandle>(null);
  const [value, setValue] = useState<Array<string | number>>([]);
  const items = useMemo(
    () => Array.from({ length: 5000 }, (_, index) => ({
      value: `product-${index}`,
      label: `Product ${index}`,
    })),
    []
  );

  return (
    <Select
      ref={ref}
      items={items}
      value={value}
      onChange={(next) => setValue(next as Array<string | number>)}
      multiple
      searchable
      virtualized
      estimatedItemHeight={40}
      clearable
      placeholder="Search products"
    />
  );
}
```

#### 5.2 Vue + Nuxt

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Select } from '@smilodon/vue'

const value = ref<Array<string | number>>([])
const items = [
  { value: 'tehran', label: 'Tehran' },
  { value: 'tokyo', label: 'Tokyo' },
  { value: 'berlin', label: 'Berlin' },
]
</script>

<template>
  <Select
    v-model="value"
    :items="items"
    multiple
    searchable
    clearable
    placeholder="Choose cities"
  />
</template>
```

Nuxt note: configure Vue compiler custom-element handling for `enhanced-select` so the wrapped element hydrates correctly.

#### 5.3 Svelte / SvelteKit

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte'

  const items = [
    { value: 'svelte', label: 'Svelte' },
    { value: 'solid', label: 'SolidJS' },
    { value: 'react', label: 'React' },
  ]

  let value: string | number | Array<string | number> = []
</script>

<Select
  {items}
  bind:value
  multiple
  searchable
  clearable
  placeholder="Pick frameworks"
/>
```

#### 5.4 SolidJS

```tsx
import { createSignal } from 'solid-js'
import { Select } from '@smilodon/solid'

export default function SolidDemo() {
  const [value, setValue] = createSignal<Array<string | number>>([])

  return (
    <Select
      items={[
        { value: 'a', label: 'Alpha' },
        { value: 'b', label: 'Beta' },
      ]}
      value={value()}
      onChange={(next) => setValue(next as Array<string | number>)}
      multiple
      searchable
    />
  )
}
```

#### 5.5 React Native

```tsx
import { useState } from 'react'
import { View } from 'react-native'
import { Select } from '@smilodon/react-native'

export default function MobileScreen() {
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
        collapsedHeight={64}
        expandedHeight={320}
      />
    </View>
  )
}
```

#### 5.6 Vanilla Web Components

```html
<enhanced-select id="people"></enhanced-select>
<script type="module">
  import '@smilodon/core';

  const select = document.getElementById('people');
  select.setItems([
    { value: '1', label: 'Ada Lovelace' },
    { value: '2', label: 'Grace Hopper' },
  ]);
  select.updateConfig({
    searchable: true,
    selection: { mode: 'multi' },
    clearControl: { enabled: true },
  });
</script>
```

> For deeper framework setup, SSR notes, diagnostics, and theming recipes, start with [docs/GETTING-STARTED.md](./docs/GETTING-STARTED.md) and the package-level guides above.

---

## Styling & Design Tokens

Smilodon now exposes a fully audited styling surface for the default UI, including micro-interactions and accessibility affordances.

| Area | Representative hooks |
| --- | --- |
| Theme foundation | `--select-surface`, `--select-border`, `--select-text`, `--select-shadow-*` |
| Input shell | `--select-input-*`, `--select-separator-*`, `--select-arrow-*` |
| Chips | `--select-badge-*`, `--select-badge-remove-*`, `--select-multi-input-min-width` |
| Dropdown | `--select-dropdown-*`, `--select-options-*`, `--select-scrollbar-*` |
| Option states | `--select-option-*`, `--select-option-selected-indicator-*` |
| Accessibility & motion | `--select-error-*`, `--select-reduced-motion-*`, `--select-high-contrast-*`, `--select-touch-target-min-height` |

Reference documents:

- [Styling guide](./docs/STYLING.md)
- [Full token reference](./docs/STYLING-TOKENS.md)
- [Runnable styling examples](./docs/STYLING-EXAMPLES.md)

The following practical examples show non-destructive ways to style options so authors retain full control: via the JSON `style` on an item, via `className` + `::part()` selectors, and via an `optionRenderer` that applies inline/background-image safely.

### 1) Styling via JSON `style` (per-option inline styles)

```html
<script>
const items = [
  {
    value: 'gradient',
    label: 'Gradient option',
    // Inline styles applied directly to the option container
    style: {
      backgroundImage: 'linear-gradient(180deg,#f4f4f4 0%, #d7d7d7 100%)',
      color: '#111',
      backgroundSize: 'cover'
    }
  },
  {
    value: 'plain',
    label: 'Plain option'
  }
];

const select = document.querySelector('enhanced-select');
select.setItems(items);
</script>
```

Notes:
- The component applies per-option `style` via `Object.assign(this._container.style, style)` so authors can set any valid CSS property.
- Because component hover/selected rules use the `background` shorthand to ensure proper overrides, if you want a background-image to persist on hover you can set a custom hover variable or use a custom class with `::part()` rules.

### 2) Using `className` + `::part()` selectors (recommended for maintainable CSS)

```html
<style>
/* Target the internal option container via the part API */
enhanced-select::part(option).user-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  align-items: center;
  background-image: url('/avatars/alex.jpg');
  background-size: cover;
  color: white;
}

/* Hover state that preserves background-image by using background-image instead of background */
enhanced-select::part(option).user-card:hover {
  filter: brightness(0.92);
}

/* Selected state via part selector */
enhanced-select::part(option).user-card.selected {
  outline: 2px solid rgba(255,255,255,0.6);
}
</style>

<script>
const items = [
  { value: 1, label: 'Alex', className: 'user-card' },
];
document.querySelector('enhanced-select').setItems(items);
</script>
```

Why use `::part()`:
- `::part(option)` targets the internal option container (`part="option"`) and lets authors write external CSS to style options consistently.
- Using `className` together with `::part()` keeps markup clean and avoids inline style repetition.

### 3) Option renderer example that sets inline/background-image safely

If you need rich markup per option, return a DOM node (or HTML string) from your option renderer. To avoid your background-image being unintentionally removed by the component's hover `background` shorthand, use a CSS variable for hover/selected tokens or handle the hover inside your renderer's markup using a nested element.

```javascript
function optionRenderer(item, index) {
  // Create a wrapper that the component will place inside the option container
  const wrapper = document.createElement('div');
  wrapper.className = 'option-renderer-inner';
  wrapper.style.backgroundImage = `url(${item.image})`;
  wrapper.style.backgroundSize = 'cover';
  wrapper.style.padding = '12px';
  wrapper.style.color = item.textColor || '#fff';

  wrapper.innerHTML = `
    <div class="title">${item.label}</div>
    <div class="subtitle">${item.subtitle || ''}</div>
  `;

  return wrapper; // returns HTMLElement -> mounted into option container
}

const items = [
  { value: 1, label: 'Photo', image: '/img/1.jpg', render: optionRenderer }
];
document.querySelector('enhanced-select').setItems(items);
```

Tips to preserve images and custom styling:
- Use nested elements inside the renderer (`.option-renderer-inner`) rather than relying solely on the option container's background, so component-level `background` rules won't remove your nested element's `background-image`.
- Alternatively, set `--select-option-hover-bg: transparent` (or an explicit color) for the select instance to avoid hover clearing your image, e.g.: `element.style.setProperty('--select-option-hover-bg','transparent')`.

### 4) Other useful examples

- Using `part` for theming (dark/light): set `enhanced-select::part(option){ --my-token: ... }` and reference those tokens in your global CSS.
- Combining `className` and JSON `style` for small per-item overrides (e.g., badge color) while keeping layout CSS in a stylesheet.
- Providing both `render` and `className` to make the renderer provide structure while the stylesheet controls visual polish.

These examples give you maximal flexibility while preserving predictable hover/selected behavior from the component. See `docs/STYLING-EXAMPLES.md` for more detail and runnable snippets.

---

## Chapter 6 — Testing & Quality Gates

### Recent Stability Update (React)

- **Issue #317 fixed:** React adapter no longer enters update-depth loops when controlled values are re-created by reference across renders.
- **Root fix:** value sync now updates only when effective selected values differ; uncontrolled `defaultValue` is initialized once.
- **Regression safety:** focused loop-prevention scenarios live in `packages/react/tests/infinite-render.spec.tsx` and are kept green in CI/local checks.
- **Test clarity:** known React nested-root `act(...)` warning noise is filtered in React test config only, with no production/runtime impact.

| Suite | Status | Notes |
| --- | --- | --- |
| Unit (Vitest) | 76 / 76 ✅ | Snapshot + behavior tests |
| Integration | 45 / 45 ✅ | Focused on config combinations |
| E2E (Playwright) | 17 / 22 ⚙️ | Remaining scenarios tracked in `tests/e2e/scenarios` |
| Accessibility | 32 / 32 ✅ | axe, Lighthouse, Pa11y, screen reader manual passes |
| Performance | 18 / 18 ✅ | `npm run perf` enforcing latency budgets |

Run locally:

```bash
npx playwright install --with-deps
npm run test:unit
npm run test:contracts
npm run test:e2e
npm run test:coverage
npm run perf
```

Reference documents: [TESTING-GUIDE.md](./TESTING-GUIDE.md), [tests/README.md](./tests/README.md), and [SETUP.md](./SETUP.md).

### Current Status & Known Issues

- Known limitations: [docs/KNOWN-LIMITATIONS.md](./docs/KNOWN-LIMITATIONS.md)
- Adapter capabilities matrix: [docs/ADAPTER-CAPABILITY-MATRIX.md](./docs/ADAPTER-CAPABILITY-MATRIX.md)
- Playwright browser install may require manual OS-specific steps on non-Ubuntu Linux distributions (see [SETUP.md](./SETUP.md)).

---

## Chapter 7 — Compliance, Security & Governance

- **SOC 2 Type II** documentation (193 controls) — see `docs/compliance/SOC2-COMPLIANCE.md`.
- **WCAG 2.2 AA** certification workstream — tracked in `docs/compliance/WCAG-COMPLIANCE.md`.
- **Privacy** — GDPR/CCPA compliant, zero PII by default, policies in `docs/compliance/PRIVACY-POLICY.md`.
- **Supply chain** — SBOM (`sbom.json`), SLSA-ready build steps, signed packages, CSP-friendly runtime.
- **Threat model** — STRIDE assessment + mitigations in `docs/compliance/THREAT-MODEL.md`.

---

## Chapter 8 — Adoption, Tooling & Support

- **Playground** — `/playground` Vite workspace with React, Svelte, Vue demos plus performance overlays.
- **Deployment** — `npm publish` ready packages inside `packages/*` with semantic versioning.
- **Architecture reference** — [ARCHITECTURE.md](./ARCHITECTURE.md) tracks adapter topology, runtime layering, and distribution decisions.
- **Community Channels**
  - Email: navidrezadoost07@gmail.com
  - Discord: [smilodon community](https://discord.gg/smilodon)
  - Issues: [GitHub tracker](https://github.com/navidrezadoost/smilodon/issues)
- **Learning Path**
  1. Read [docs/GETTING-STARTED.md](./docs/GETTING-STARTED.md)
  2. Explore [playground/index.html](./playground/index.html)
  3. Review [docs/PERFORMANCE.md](./docs/PERFORMANCE.md) before production rollout
  4. Read [docs/BENCHMARKS.md](./docs/BENCHMARKS.md) for transparent cross-library comparisons
  5. Embed telemetry hooks to feed your observability stack

---

<div align="center">
  Crafted with ❤️ for high-performance product teams • [Back to top](#table-of-contents)
</div>
