# Build Tool Integration

This guide explains how to integrate Smilodon through `@smilodon/core` when your framework does not have a first-party adapter.

The key idea is simple:

- Smilodon ships a browser-first custom element runtime.
- Any framework or application shell that can render HTML and run client-side JavaScript can use it.
- Build tools such as Vite, Webpack, and Turbopack are the main integration surface for unsupported frameworks.

This document is for teams using:

- Preact
- Lit
- Astro islands
- Alpine.js
- HTMX + progressive enhancement
- custom in-house frameworks
- server-rendered applications with client-side enhancement
- design systems that want framework-neutral delivery

---

## Executive summary

If your framework can do these five things, it can use Smilodon:

1. load `@smilodon/core` in the browser
2. render `<enhanced-select>` in the page
3. call `setItems()` and `updateConfig()` when needed
4. listen to DOM `CustomEvent`s such as `change`, `search`, and `clear`
5. style the element through CSS variables and `::part()`

That is the full interoperability contract.

---

## Build tool compatibility matrix

| Build tool | Status | Primary integration style | SSR posture | Best fit |
| --- | --- | --- | --- | --- |
| Vite | Excellent | direct ESM import in browser entry | client-only registration in SSR apps | Preact, Lit, Astro client islands, custom browser apps |
| Webpack 5 | Excellent | import from client bootstrap bundle | client-only registration in hybrid apps | enterprise apps, custom stacks, older framework ecosystems |
| Turbopack | Strong | import from explicit client boundary | client-component / browser-boundary registration | Next.js-style shells, React-adjacent unsupported stacks |

Important rule across all tools:

- register the custom element on the client
- keep imperative DOM access out of the server render phase

---

## Universal integration contract

Before looking at build tools individually, use the same core contract everywhere.

### 1. Install the runtime

```bash
npm install @smilodon/core
```

### 2. Register the element in a browser entry

```ts
import '@smilodon/core'
```

### 3. Render the element

```html
<enhanced-select id="framework-picker"></enhanced-select>
```

### 4. Feed items and config

```ts
const select = document.getElementById('framework-picker') as HTMLElement & {
  setItems?: (items: Array<{ value: string; label: string }>) => void
  updateConfig?: (config: unknown) => void
}

select.setItems?.([
  { value: 'preact', label: 'Preact' },
  { value: 'lit', label: 'Lit' },
  { value: 'astro', label: 'Astro' },
])

select.updateConfig?.({
  searchable: true,
  selection: { mode: 'single' },
  clearControl: { enabled: true, clearSelection: true, clearSearch: true },
})
```

### 5. Listen to DOM events

```ts
select.addEventListener('change', (event: Event) => {
  const detail = (event as CustomEvent).detail
  console.log('selected values', detail.selectedValues)
})
```

---

## Universal design rules

### Rule 1: Treat Smilodon as a client-side custom element

Do not assume the server can execute the runtime.

Safe pattern:

- render the tag in HTML if desired
- load `@smilodon/core` only in the browser
- perform imperative updates after the custom element is defined

### Rule 2: Keep data flow outside the element when necessary

Unsupported frameworks can still manage state externally.

Use the framework for:

- data fetching
- page state
- routing
- analytics
- persistence

Use Smilodon for:

- selection UI
- search UI
- virtualization
- keyboard interaction
- grouped rendering

### Rule 3: Use DOM events as the boundary

Smilodon emits browser events, so unsupported frameworks should treat it like any other custom element.

Common events:

- `change`
- `select`
- `open`
- `close`
- `search`
- `loadMore`
- `clear`
- `diagnostic`

### Rule 4: Use browser styling primitives, not private internals

Supported styling surface:

- host classes
- inline style / framework style bindings
- CSS custom properties
- `::part()`
- `classMap`
- custom renderers

Do not rely on private shadow markup.

### Rule 5: Keep SSR and hydration conservative

If your framework has SSR, prefer:

- rendering the host tag in markup
- deferring registration and imperative control until browser lifecycle

---

## Vite integration

Vite is the simplest path because Smilodon is ESM-first and browser-oriented.

### When to choose Vite

Choose Vite when you have:

- Preact apps
- Lit apps
- Astro client islands
- small or medium browser applications
- custom design-system demos
- unsupported frameworks with a modern ESM runtime

### Basic Vite client entry

```ts
// src/main.ts
import '@smilodon/core'
import './style.css'
```

```html
<!-- index.html -->
<div class="app-shell">
  <enhanced-select id="language-select"></enhanced-select>
</div>
<script type="module" src="/src/main.ts"></script>
```

```ts
// src/select.ts
const select = document.getElementById('language-select') as any

await customElements.whenDefined('enhanced-select')

select.setItems([
  { value: 'lit', label: 'Lit' },
  { value: 'preact', label: 'Preact' },
  { value: 'astro', label: 'Astro' },
])

select.updateConfig({
  searchable: true,
  selection: { mode: 'single' },
})
```

### Vite + unsupported framework pattern

For frameworks running on top of Vite, use the framework for mounting but register Smilodon in the same browser bundle.

Example pattern:

```ts
import '@smilodon/core'
import { renderApp } from './app'

renderApp()
```

Then let your framework render:

```html
<enhanced-select id="picker"></enhanced-select>
```

And bind events through the framework lifecycle or a DOM effect.

### Vite SSR rule

If your Vite stack supports SSR, do not execute `@smilodon/core` during server render.

Use one of these approaches:

- dynamic import in `onMount()` / `useEffect()` / browser hook
- a client-only wrapper component
- a browser guard such as `if (typeof window !== 'undefined')`

Example:

```ts
if (typeof window !== 'undefined') {
  await import('@smilodon/core')
}
```

### Vite checklist

- ESM import works directly
- no custom loader is required
- client-only registration is required in SSR mode
- style via CSS variables, `::part()`, and framework classes on the host

---

## Webpack 5 integration

Webpack 5 is a strong option for unsupported frameworks in larger enterprise environments.

### When to choose Webpack

Choose Webpack when you have:

- an established enterprise build pipeline
- custom framework infrastructure
- older but still modernized frontend stacks
- microfrontend shells that already depend on Webpack

### Recommended baseline

Use Webpack 5, not older Webpack generations.

Smilodon is ESM-first and modern-browser-oriented.

### Minimal Webpack setup

```js
// webpack.config.js
const path = require('path')

module.exports = {
  mode: 'development',
  entry: './src/index.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  devServer: {
    static: './dist',
    hot: true,
  },
}
```

### Client bootstrap

```ts
// src/index.ts
import '@smilodon/core'
import './app.css'

window.addEventListener('DOMContentLoaded', async () => {
  await customElements.whenDefined('enhanced-select')

  const select = document.getElementById('team-select') as any
  if (!select) return

  select.setItems([
    { value: 'ops', label: 'Operations' },
    { value: 'sec', label: 'Security' },
    { value: 'plat', label: 'Platform' },
  ])

  select.updateConfig({
    searchable: true,
    selection: { mode: 'multi', maxSelections: 2 },
  })
})
```

### HTML shell

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Smilodon + Webpack</title>
  </head>
  <body>
    <enhanced-select id="team-select"></enhanced-select>
    <script src="./bundle.js"></script>
  </body>
</html>
```

### Webpack rules and principles

- import `@smilodon/core` from the client entry, not a server bundle
- keep the custom element in modern browser targets
- do not rely on legacy transpilation targets that remove required browser features
- use DOM events as the framework boundary
- style the host with your application CSS and Smilodon tokens

### Webpack SSR / hybrid apps

If Webpack is used in a hybrid SSR application:

- keep the tag in rendered HTML if desired
- import `@smilodon/core` only in the browser bundle
- perform `setItems()` / `updateConfig()` after hydration or client mount

---

## Turbopack integration

Turbopack is best treated as a client-boundary integration path.

### When to choose Turbopack

Choose Turbopack when you have:

- a Next.js-style application shell
- unsupported UI layers inside a React-hosted app
- custom browser widgets mounted from a client component

### Core rule for Turbopack

Register Smilodon from a client-only boundary.

### Example client wrapper

```tsx
'use client'

import { useEffect, useRef } from 'react'

export function SmilodonCoreSelect() {
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    let cancelled = false

    async function setup() {
      await import('@smilodon/core')
      await customElements.whenDefined('enhanced-select')
      if (cancelled || !ref.current) return

      const select = ref.current as any
      select.setItems([
        { value: 'turbo', label: 'Turbopack' },
        { value: 'vite', label: 'Vite' },
        { value: 'webpack', label: 'Webpack' },
      ])
      select.updateConfig({
        searchable: true,
        selection: { mode: 'single' },
      })
    }

    setup()
    return () => {
      cancelled = true
    }
  }, [])

  return <enhanced-select ref={ref} />
}
```

### Turbopack rules and principles

- always use a client component or browser-only wrapper
- never access imperative element APIs during server render
- use React state outside the element if you need page-level synchronization
- bridge DOM events back into the host framework with `addEventListener()` in an effect

### Turbopack styling

Use the same browser primitives as elsewhere:

- host `className`
- inline CSS variables
- global CSS `::part()` selectors
- design-system wrappers

---

## Unsupported framework recipes

These patterns work regardless of the framework if it can mount DOM nodes.

### Recipe 1: Preact on Vite

- import `@smilodon/core` in the browser entry
- render `<enhanced-select>` in JSX
- use `useEffect()` with a `ref` to call `setItems()` and `updateConfig()`
- listen to `change` with `addEventListener()` inside the same effect

### Recipe 2: Lit on Vite or Webpack

- import `@smilodon/core` once in the component module or app shell
- render `<enhanced-select>` in the Lit template
- call element APIs in `firstUpdated()`
- set host-level CSS variables from the component stylesheet

### Recipe 3: Astro client island

- render `<enhanced-select>` in a client island
- import `@smilodon/core` only in island/client code
- set items after island mount
- keep server output simple and browser enhancement explicit

### Recipe 4: Alpine.js / HTMX progressive enhancement

- render the tag in server HTML
- import `@smilodon/core` in the client bundle
- use DOM selectors to set data and attach events after page load
- optionally re-run setup after partial page swaps

---

## Event integration patterns

Unsupported frameworks typically need one of these patterns.

### Read selection changes

```ts
select.addEventListener('change', (event: Event) => {
  const detail = (event as CustomEvent).detail
  console.log(detail.selectedValues)
  console.log(detail.selectedItems)
})
```

### Read search input

```ts
select.addEventListener('search', (event: Event) => {
  const detail = (event as CustomEvent).detail
  console.log(detail.query)
})
```

### Handle clear control

```ts
select.addEventListener('clear', (event: Event) => {
  const detail = (event as CustomEvent).detail
  console.log(detail.clearedSelection, detail.clearedSearch)
})
```

### Handle load-more requests

```ts
select.addEventListener('loadMore', async (event: Event) => {
  const detail = (event as CustomEvent).detail
  const nextPage = await fetchPage(detail.page)
  select.setItems(nextPage)
})
```

---

## Styling in unsupported frameworks

Use the same shared styling model documented elsewhere.

### Host-level theme

```css
enhanced-select.framework-shell {
  --select-input-border: 1px solid #d1d5db;
  --select-input-border-radius: 12px;
  --select-input-focus-border: #2563eb;
  --select-shadow-focus: 0 0 0 3px rgba(37, 99, 235, 0.18);
  --select-option-selected-bg: #dbeafe;
  --select-option-selected-color: #1d4ed8;
}
```

### Structural targeting

```css
enhanced-select.framework-shell::part(button) {
  min-height: 48px;
}

enhanced-select.framework-shell::part(listbox) {
  border-radius: 16px;
}
```

### State-class mapping

```ts
select.classMap = {
  selected: 'bg-blue-600 text-white',
  active: 'bg-blue-50 text-slate-900',
  disabled: 'opacity-50 cursor-not-allowed',
}
```

---

## SSR and hydration checklist

Use this checklist for any build tool:

1. render `<enhanced-select>` only as markup during SSR
2. register `@smilodon/core` only on the client
3. wait for `customElements.whenDefined('enhanced-select')`
4. call `setItems()` and `updateConfig()` after client mount
5. attach event listeners after the element is upgraded
6. avoid server-side imperative access to the element instance

---

## Troubleshooting by build tool

### Vite: element renders but is inert

Likely cause:

- `@smilodon/core` was not imported in the browser entry

Fix:

- import `@smilodon/core`
- wait for `customElements.whenDefined('enhanced-select')`

### Webpack: markup appears but methods are undefined

Likely cause:

- code runs before the custom element is upgraded

Fix:

- wait for `customElements.whenDefined('enhanced-select')`
- move setup to `DOMContentLoaded`, framework mount, or client lifecycle

### Turbopack: server error or hydration mismatch

Likely cause:

- the runtime or element API is being accessed during server render

Fix:

- move the integration into a client component
- perform import and setup inside `useEffect()` or an equivalent client lifecycle

### Styles do not match the host framework

Likely cause:

- framework classes were only applied outside the host
- shadow internals were expected to inherit all framework styles

Fix:

- move theme values into CSS variables
- use `::part()` for structural styling
- use `classMap` for option-state utilities

---

## Recommended adoption path

For unsupported frameworks, the recommended order is:

1. start with `@smilodon/core`
2. integrate via your existing build tool
3. keep the custom element client-registered
4. use DOM events and imperative methods as the boundary
5. apply shared styling tokens and parts

This path is stable, framework-neutral, and aligned with the Smilodon architecture.

---

## Related documentation

- [../README.md](../README.md)
- [./API-REFERENCE.md](./API-REFERENCE.md)
- [./STYLING.md](./STYLING.md)
- [./STYLING-TOKENS.md](./STYLING-TOKENS.md)
- [./CSS-FRAMEWORK-COMPATIBILITY.md](./CSS-FRAMEWORK-COMPATIBILITY.md)
- [../packages/core/README.md](../packages/core/README.md)
