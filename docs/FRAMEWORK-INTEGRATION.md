# Framework Integration Guide

This guide covers proper setup and troubleshooting for using Smilodon with popular JavaScript frameworks.

## Table of Contents

- [Vue 3 + Nuxt](#vue-3--nuxt)
- [React + Next.js](#react--nextjs)
- [Svelte + SvelteKit](#svelte--sveltekit)
- [SolidJS](#solidjs)
- [Common Issues](#common-issues)
- [Performance Recommendations](#performance-recommendations)

---

## Vue 3 + Nuxt

### Why Custom Element Configuration is Required

Smilodon uses Web Components (`enhanced-select`, `select-option`) which Vue needs to recognize as custom elements to avoid treating them as Vue components.

### Step-by-Step Setup

#### 1. Configure Custom Element Recognition

**For Vite-based Vue projects:**

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => 
            tag === 'enhanced-select' || tag === 'select-option'
        }
      }
    })
  ]
})
```

**For Nuxt 3:**

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  vue: {
    compilerOptions: {
      isCustomElement: (tag) => 
        tag === 'enhanced-select' || tag === 'select-option'
    }
  }
})
```

#### 2. Ensure Early Registration (Nuxt)

Create a client-side plugin to guarantee custom elements are registered before component mounting:

```ts
// plugins/smilodon.client.ts
import '@smilodon/core'

export default defineNuxtPlugin(() => {
  // Side-effect import above registers the custom elements
  console.log('✅ Smilodon custom elements registered')
})
```

> **💡 Important Note:** In Nuxt, it is recommended to place this plugin in the `plugins/` directory. If you're encountering SSR issues, you can explicitly configure the plugin with `ssr: false`:
>
> ```ts
> // plugins/smilodon.client.ts
> import '@smilodon/core'
>
> export default defineNuxtPlugin({
>   name: 'smilodon',
>   parallel: true,
>   setup() {
>     console.log('✅ Smilodon custom elements registered')
>   },
>   env: {
>     islands: false
>   }
> })
> ```

#### 3. Use ClientOnly for SSR Apps

Wrap Smilodon components in `<ClientOnly>` to prevent server-side rendering issues:

```vue
<template>
  <ClientOnly>
    <Select
      v-model="selectedValue"
      :items="items"
      searchable
      clearable
      placeholder="Choose an option"
    />
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Select } from '@smilodon/vue'

const selectedValue = ref('')
const items = ref([
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' }
])
</script>
```

#### 4. Optional: Eager Adapter Registration

For better control, register the adapter explicitly in your Vue app:

```ts
// main.ts or app setup
import { createApp } from 'vue'
import '@smilodon/core' // Register custom elements first
import App from './App.vue'

const app = createApp(App)
app.mount('#app')
```

---

## React + Next.js

React integration is more straightforward since it doesn't require custom element compiler configuration.

### App Router (Next.js 13+)

#### 1. Use Client Components

```tsx
'use client'

import { useState } from 'react'
import { Select } from '@smilodon/react'

export default function MyComponent() {
  const [value, setValue] = useState('')

  return (
    <Select
      items={[
        { value: 'a', label: 'Option A' },
        { value: 'b', label: 'Option B' }
      ]}
      value={value}
      onChange={(next) => setValue(next as string)}
      searchable
      clearable
    />
  )
}
```

#### 2. Dynamic Import for SSR-Heavy Pages

If you need to avoid loading Smilodon on the server:

```tsx
import dynamic from 'next/dynamic'

const Select = dynamic(
  () => import('@smilodon/react').then((mod) => mod.Select),
  { ssr: false }
)

export default function Page() {
  return <Select items={items} {...props} />
}
```

### Pages Router (Next.js 12)

Use dynamic imports with `ssr: false`:

```tsx
import dynamic from 'next/dynamic'

const Select = dynamic(() => import('@smilodon/react').then(m => m.Select), {
  ssr: false
})
```

---

## Svelte + SvelteKit

### Configuration

#### 1. Configure Custom Elements

```js
// svelte.config.js
export default {
  compilerOptions: {
    customElement: true
  },
  kit: {
    // ... your SvelteKit config
  }
}
```

#### 2. Browser-Only Registration

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte'
  import { onMount } from 'svelte'
  import { browser } from '$app/environment'
  
  let value = ''
  let ready = false
  
  onMount(async () => {
    if (browser) {
      await import('@smilodon/core')
      ready = true
    }
  })
</script>

{#if ready}
  <Select
    bind:value
    items={[
      { value: 'svelte', label: 'Svelte' },
      { value: 'kit', label: 'SvelteKit' }
    ]}
    searchable
  />
{/if}
```

---

## SolidJS

SolidJS has excellent custom element support out of the box.

### Basic Setup

```tsx
import { createSignal } from 'solid-js'
import { Select } from '@smilodon/solid'

export default function App() {
  const [value, setValue] = createSignal('')

  return (
    <Select
      items={[
        { value: 'solid', label: 'SolidJS' },
        { value: 'qwik', label: 'Qwik' }
      ]}
      value={value()}
      onChange={(next) => setValue(next as string)}
      searchable
    />
  )
}
```

### With SSR

```tsx
import { onMount, createSignal, Show } from 'solid-js'

export default function App() {
  const [mounted, setMounted] = createSignal(false)

  onMount(() => {
    import('@smilodon/core').then(() => setMounted(true))
  })

  return (
    <Show when={mounted()}>
      <Select {...props} />
    </Show>
  )
}
```

---

## Common Issues

### Issue: "Failed to execute 'createElement' on 'Document': The result must not have attributes"

**Symptoms:**
- Error occurs when mounting component in Vue/Nuxt
- Appears in modals, teleports, or dynamic components
- Component crashes before rendering

**Root Cause:**
Custom element constructors should NOT mutate the host element (set attributes, classes, or dataset) during construction. This violates the Web Components specification.

**Solution:**
Upgrade to `@smilodon/core@1.9.1-debug.0` or later. Constructor safety has been fixed:
- Host mutations moved from constructor to `connectedCallback()`
- Applies to both `enhanced-select` and `select-option` elements

```bash
npm update @smilodon/core @smilodon/vue
```

---

### Issue: Custom Element Not Registered

**Symptoms:**
- "Failed to construct 'HTMLElement'" errors
- Component appears as undefined
- Vue warns about unknown custom element

**Causes:**
1. Lazy import causing registration timing issues
2. Missing `isCustomElement` configuration in Vue
3. SSR trying to render custom element

**Solutions:**

1. **Add client plugin (Nuxt):**
```ts
// plugins/smilodon.client.ts
import '@smilodon/core'

export default defineNuxtPlugin(() => {})
```

2. **Configure Vue compiler:**
```ts
// nuxt.config.ts or vite.config.ts
{
  vue: {
    compilerOptions: {
      isCustomElement: tag => tag.startsWith('enhanced-') || tag === 'select-option'
    }
  }
}
```

3. **Wrap in ClientOnly:**
```vue
<ClientOnly>
  <Select :items="items" />
</ClientOnly>
```

---

### Issue: Vite Serving Stale Code

**Symptoms:**
- Changes not reflecting after `npm install` or patching
- Old errors persisting after fixes
- Inconsistent behavior between dev/prod

**Cause:**
Vite's dependency pre-bundling caches compiled modules aggressively.

**Solution:**

1. **Clear cache manually:**
```bash
rm -rf node_modules/.vite
npm run dev
```

2. **Exclude from optimization (dev only):**
```ts
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    exclude: ['@smilodon/core', '@smilodon/vue']
  }
})
```

3. **Force rebuild:**
```bash
npm run build
```

---

### Issue: Teleport/Modal Mounting Breaks

**Symptoms:**
- Component works normally but breaks in modals
- Errors when dynamically shown/hidden
- Works on initial render, fails on subsequent mounts

**Root Cause:**
Framework re-creates custom element DOM during teleportation, which can trigger constructor issues if host mutations happen too early.

**Solution:**
Upgrade to `@smilodon/core@1.9.1-debug.0+` which defers all host mutations to `connectedCallback()`.

---

### Issue: Hydration Mismatch in SSR

**Symptoms:**
- Vue/Nuxt hydration warnings in console
- Mismatch between server-rendered HTML and client-side rendering
- Component appears broken or re-renders after page load
- "Hydration completed but contains mismatches" warnings

**Root Cause:**
Custom elements (Web Components) cannot be rendered on the server. When Nuxt/Vue attempts to hydrate server-rendered content containing `<enhanced-select>` or `<select-option>`, it encounters a mismatch because these elements don't exist during SSR.

**Solutions:**

1. **Always wrap in `<ClientOnly>` (Recommended):**
```vue
<template>
  <ClientOnly>
    <Select :items="items" v-model="value" />
  </ClientOnly>
</template>
```

2. **Use `v-if` with client-side flag:**
```vue
<template>
  <Select v-if="mounted" :items="items" v-model="value" />
</template>

<script setup>
import { ref, onMounted } from 'vue'

const mounted = ref(false)

onMounted(() => {
  mounted.value = true
})
</script>
```

3. **Configure plugin with explicit client-only mode:**
```ts
// plugins/smilodon.client.ts
export default defineNuxtPlugin({
  name: 'smilodon',
  parallel: true,
  setup() {
    import('@smilodon/core')
  },
  env: {
    islands: false  // Prevent island rendering
  }
})
```

**Best Practice:**
Always use `<ClientOnly>` wrapper for any component that uses Smilodon selects in SSR applications (Nuxt, Next.js with SSR, SvelteKit with SSR).

---

## Performance Recommendations

### Vite Optimization Strategy

**Option 1: Exclude from pre-bundling (recommended for development):**
```ts
export default defineConfig({
  optimizeDeps: {
    exclude: ['@smilodon/core', '@smilodon/vue']
  }
})
```

**Option 2: Include but configure properly:**
```ts
export default defineConfig({
  optimizeDeps: {
    include: ['@smilodon/core', '@smilodon/vue'],
    esbuildOptions: {
      target: 'es2020'
    }
  }
})
```

### Bundle Size Optimization

**Tree-shake unused features:**
```ts
// Only import what you need
import { Select } from '@smilodon/vue'
// Don't import the entire core if using adapter
```

**Dynamic imports for large datasets:**
```ts
// Load large item arrays lazily
const loadItems = async () => {
  const data = await import('./large-dataset.json')
  return data.default
}
```

---

## Testing Recommendations

### Vue Test Utils

```ts
import { mount } from '@vue/test-utils'
import { Select } from '@smilodon/vue'

// Mock custom element registration
beforeAll(() => {
  if (!customElements.get('enhanced-select')) {
    customElements.define('enhanced-select', class extends HTMLElement {})
  }
})

test('renders select', () => {
  const wrapper = mount(Select, {
    props: {
      items: [{ value: '1', label: 'One' }]
    }
  })
  expect(wrapper.exists()).toBe(true)
})
```

### Vitest + jsdom

```ts
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts']
  }
})
```

```ts
// test/setup.ts
import '@smilodon/core'

// Ensure custom elements are registered before tests
```

---

## Migration from Previous Versions

### From 1.8.x to 1.9.x

**Breaking changes:**
- Constructor safety: host mutations moved to `connectedCallback()`
- No code changes required in your app
- Update dependency versions

```bash
npm update @smilodon/core @smilodon/vue
```

**Verification:**
```bash
# Check versions
npm list @smilodon/core @smilodon/vue

# Expected: 1.9.1-debug.0 or later
```

---

## Additional Resources

- [Vue Package README](../packages/vue/README.md)
- [Core Package README](../packages/core/README.md)
- [React Package README](../packages/react/README.md)
- [Known Limitations](./KNOWN-LIMITATIONS.md)
- [Performance Guide](./PERFORMANCE.md)
- [API Reference](./API-REFERENCE.md)

---

## Getting Help

If you encounter issues not covered here:

1. **Check package versions**: Ensure `@smilodon/core@1.9.1+`
2. **Review console errors**: Look for custom element registration failures
3. **Verify configuration**: Double-check `isCustomElement` setup
4. **Clear caches**: `rm -rf node_modules/.vite && npm install`
5. **Report bugs**: Open an issue with reproduction steps

**Common debug checklist:**
- [ ] `isCustomElement` configured in Vue compiler
- [ ] Custom elements registered before component mount
- [ ] Using `<ClientOnly>` for SSR
- [ ] `@smilodon/core@1.9.1+` installed
- [ ] Vite cache cleared
- [ ] No constructor mutations (fixed in 1.9.1+)
