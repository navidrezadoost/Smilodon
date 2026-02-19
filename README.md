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

> **Latest (v1.4.4):** Full selected-state styling control (including selected border/hover states), reactive classMap styling updates, and corrected active-style transition when selecting a new option.

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

Each playbook contains installation, configuration, and a realistic example showcasing search, multi-select, keyboard control, and async data.

### 📚 Complete Framework-Specific Guides

For **comprehensive, unambiguous documentation** covering all features, styling options, and framework-specific patterns:

- **React**: [packages/react/COMPLETE-GUIDE.md](./packages/react/COMPLETE-GUIDE.md) - Hooks, controlled components, React Hook Form integration
- **Vue**: [packages/vue/COMPLETE-GUIDE.md](./packages/vue/COMPLETE-GUIDE.md) - Composition API, v-model, Pinia integration
- **Svelte**: [packages/svelte/COMPLETE-GUIDE.md](./packages/svelte/COMPLETE-GUIDE.md) - Reactive statements, stores, Context API
- **Vanilla JS**: [packages/vanilla/COMPLETE-GUIDE.md](./packages/vanilla/COMPLETE-GUIDE.md) - Web Components, DOM manipulation, no framework

Each guide includes:
- ✅ All 60+ CSS variables for complete customization
- ✅ Framework-native patterns and best practices
- ✅ TypeScript integration examples
- ✅ Performance optimization techniques
- ✅ Accessibility information (WCAG 2.1 AAA)
- ✅ Real-world advanced patterns
- ✅ Troubleshooting sections

---

### Quick Start Examples

### 5.1 React (hooks + refs)

```bash
npm install @smilodon/react
```

```tsx
import { useMemo, useRef, useState } from 'react';
import { Select } from '@smilodon/react';

const products = Array.from({ length: 5000 }).map((_, i) => ({
  value: `product-${i}`,
  label: `Product ${i}`,
  tags: i % 2 ? ['hardware'] : ['software']
}));

export function ProductSelect() {
  const selectRef = useRef(null);
  const [selection, setSelection] = useState([]);
  const items = useMemo(() => products, []);

  return (
    <Select
      ref={selectRef}
      items={items}
      searchable
      multiSelect
      placeholder="Search 5K products"
      onSearch={(term) => console.log('debounced server query', term)}
      onChange={(selectedItems, values) => setSelection(values)}
      config={{
        selection: { mode: 'multi', showChips: true },
        keyboard: { loop: true, typeAhead: true },
        metrics: { enabled: true }
      }}
    />
  );
}
```

**Highlights**: supports Suspense/SSR, controlled mode via refs (`selectRef.current.setSelectedValues`), compatibility with React 18 concurrent rendering.

### 5.2 Vue (Composition API)

```bash
npm install @smilodon/vue
```

```vue
<template>
  <Select
    :items="cities"
    searchable
    multi-select
    placeholder="Filter cities"
    @search="handleSearch"
    @change="handleChange"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Select } from '@smilodon/vue';

const cities = ref([
  { value: 'nyc', label: 'New York City' },
  { value: 'ams', label: 'Amsterdam' },
  { value: 'tok', label: 'Tokyo' }
]);

const handleSearch = (term: string) => {
  // plug into Pinia/Query clients for server filtering
  console.log('search', term);
};

const handleChange = (_event, payload) => {
  console.log('values', payload.selectedValues);
};
</script>
```

### 5.3 Svelte (stores + reactivity)

```bash
npm install @smilodon/svelte
```

```svelte
<script lang="ts">
  import Select from '@smilodon/svelte';
  import { writable } from 'svelte/store';

  const items = writable([]);
  const selected = writable([]);

  onMount(async () => {
    const response = await fetch('/api/countries');
    items.set(await response.json());
  });
</script>

<Select
  {items}
  bind:selectedValues={$selected}
  searchable
  multiSelect
  placeholder="Choose countries"
/>
```

### 5.4 Vanilla Web Components

```bash
npm install @smilodon/core
```

```html
<enhanced-select id="people" placeholder="Search directory"></enhanced-select>
<script type="module">
  import '@smilodon/core';

  const select = document.getElementById('people');
  select.setItems(await (await fetch('/directory.json')).json());
  select.configure({ searchable: true, selection: { mode: 'multi' } });
  select.addEventListener('change', (event) => {
    console.log(event.detail.selectedItems);
  });
</script>
```

> Visit [docs/GETTING-STARTED.md](./docs/GETTING-STARTED.md) for additional platform nuances, SSR guidance, and theming recipes.

---

## Styling Examples

The following practical examples show non-destructive ways to style options so authors retain full control: via the JSON `style` on an item, via `className` + `::part()` selectors, and via an `optionRenderer` that applies inline/background-image safely. These examples are also included in `docs/STYLING-EXAMPLES.md` for more detail.

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
- **Community Channels**
  - Email: navidrezadoost07@gmail.com
  - Discord: [smilodon community](https://discord.gg/smilodon)
  - Issues: [GitHub tracker](https://github.com/navidrezadoost/smilodon/issues)
- **Learning Path**
  1. Read [docs/GETTING-STARTED.md](./docs/GETTING-STARTED.md)
  2. Explore [playground/index.html](./playground/index.html)
  3. Review [docs/PERFORMANCE.md](./docs/PERFORMANCE.md) before production rollout
    4. Read [docs/BENCHMARKS.md](./docs/BENCHMARKS.md) for transparent cross-library comparisons
  4. Embed telemetry hooks to feed your observability stack

---

<div align="center">
  Crafted with ❤️ for high-performance product teams • [Back to top](#table-of-contents)
</div>
