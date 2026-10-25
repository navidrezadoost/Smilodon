# @smilodon/react

Select component for React applications. The shared core has scoped automated Phase 4 browser coverage; complete React integration parity and manual assistive-technology certification remain unverified.

> Large-list status: the public `virtualized` prop enables legacy chunked rendering for large flat lists; it does not window rows to the viewport, and all results may eventually be mounted. True viewport virtualization remains guarded by a private test seam and is not a supported production mode. The shared core passed its scoped Phase 4 automated browser matrix in Chromium, Firefox, and WebKit; this does not certify every React integration, minimum browser versions, or WCAG conformance. Manual assistive-technology assessment remains pending. See the [current limitation record](../../docs/KNOWN-LIMITATIONS.md#viewport-virtualization-status).

## 📖 Documentation

**Live documentation & interactive examples:** [navidrezadoost.github.io/Smilodon](https://navidrezadoost.github.io/Smilodon/)

**Framework integration (Vue 3, Nuxt 4, React, SSR, Vite):** [`docs/FRAMEWORK-INTEGRATION.md`](../../docs/FRAMEWORK-INTEGRATION.md)

**For comprehensive documentation covering all features, styling options, and advanced patterns:**

👉 **[Complete React Guide](./COMPLETE-GUIDE.md)** 👈

The complete guide includes:
- ✅ Complete styling token coverage for colors, layout, chips, motion, and accessibility
- ✅ React-specific patterns (hooks, controlled components, refs)
- ✅ Complete API reference with TypeScript types
- ✅ React Hook Form integration examples
- ✅ Performance optimization with useMemo/useCallback
- ✅ Custom renderers and theme examples
- ✅ Advanced patterns (dependent selects, async loading)
- ✅ Troubleshooting and accessibility information

---

## Features

- ✅ **Simple API** - Clean, intuitive props that feel natural in React
- ✅ **Fully Typed** - Complete TypeScript support with detailed type definitions
- ✅ **Controlled & Uncontrolled** - Works both ways, your choice
- ✅ **Single & Multi-select** - One prop to switch modes
- ✅ **Searchable** - Built-in filtering with customizable behavior
- ✅ **Infinite Scroll** - Emit host-managed load-more requests; this adapter does not own data transport, deduplication, or server pagination
- ✅ **Large-list chunk rendering** - Incrementally render large flat lists; not viewport windowing
- ✅ **Grouped Options** - Organize items into categories
- 🎨 **Dark Mode** - add `className="dark-mode"` or `data-theme="dark"` to the `<Select>` or any ancestor; styles are applied inside the shadow DOM via `:host-context`.
- ✅ **Accessibility behaviors** - Shared-core scenarios passed in the scoped Chromium/Firefox/WebKit Phase 4 matrix; exhaustive React integration, manual AT, and WCAG conformance are not established
- ✅ **Customizable** - Custom renderers, styles, and behaviors
- ✅ **Bundle guidance** - No version-specific bundle measurement is claimed; measure the published package output in your own bundler if bundle size is a release requirement

The Quick Start examples are self-contained. Longer feature snippets below are focused examples rather than one compilable module; names explicitly described as application-provided (for example, API endpoints or fetch functions) must be supplied by the host app. The package's [Complete React Guide](./COMPLETE-GUIDE.md) provides broader patterns and should be read with the same public-API and limitation notes above.

In focused JSX examples, `items`, `groups`, `bigItems`, and similar values are component-local application data unless the snippet declares them; imports and hook state should be added in the containing component as needed.

## Acknowledged data loading (Phase 2F-D development candidate)

The current local Phase 2F-D candidate integrates the core acknowledged-loading facade with the React adapter. It is not part of the published `1.10.0` package, and Firefox/WebKit certification, independent review, and remaining contract coverage are pending. Treat the following as implementation guidance for this candidate, not a release-readiness or cross-browser compatibility claim.

Acknowledged loading is opt-in through per-instance `config.dataLoading`; there is no global acknowledged-loading default. If the config is omitted, the adapter keeps the legacy protocol and existing callback behavior. The host owns fetch, cancellation, and retry policy; the core owns request identity, stale-completion rejection, canonical acceptance, and subsequent DOM projection.

### Remote cursor search with cancellation and failures

This illustrative component handles remote search and load-more requests through one host function. It sends the exact query (including an empty string), passes page/cursor position and fetch limit to the server, echoes request identity on completion, aborts cancelled requests, and reports failures without an automatic retry.

```tsx
import { useEffect, useRef } from 'react'
import {
  Select,
  type DataRequest,
  type DataRequestCompletion,
  type SelectHandle,
  type SelectItem,
} from '@smilodon/react'

type SearchPage = {
  items: SelectItem[]
  hasMore: boolean
  nextCursor?: string | number
}

export function RemoteSelect() {
  const selectRef = useRef<SelectHandle>(null)
  const controllers = useRef(new Map<string, AbortController>())

  useEffect(() => () => {
    for (const controller of controllers.current.values()) controller.abort()
    controllers.current.clear()
  }, [])

  async function load(request: DataRequest) {
    const controller = new AbortController()
    controllers.current.set(request.requestId, controller)

    try {
      const params = new URLSearchParams({ q: request.query, limit: String(request.fetchLimit) })
      if (request.position.mode === 'page') {
        params.set('page', String(request.position.page))
      } else if (request.position.cursor !== undefined) {
        params.set('cursor', String(request.position.cursor))
      }

      const response = await fetch(`/api/options?${params}`, { signal: controller.signal })
      if (!response.ok) throw new Error(`Search failed: ${response.status}`)

      const page = await response.json() as SearchPage
      if (!Array.isArray(page.items) || typeof page.hasMore !== 'boolean') {
        throw new Error('The options endpoint returned an invalid page.')
      }
      if (request.position.mode === 'cursor' && page.hasMore && page.nextCursor === undefined) {
        throw new Error('A non-terminal cursor page must include nextCursor.')
      }

      const completion: DataRequestCompletion = page.hasMore
        ? {
            requestId: request.requestId,
            queryGeneration: request.queryGeneration,
            status: 'succeeded',
            items: page.items,
            hasMore: true,
            ...(page.nextCursor === undefined ? {} : { nextCursor: page.nextCursor }),
          }
        : {
            requestId: request.requestId,
            queryGeneration: request.queryGeneration,
            status: 'exhausted',
            items: page.items,
            hasMore: false,
          }

      const result = selectRef.current?.completeDataRequest(completion)
      if (result !== 'accepted') {
        // Stale, unknown, invalid, or resource-limited completions are not projected.
        console.info('Response not accepted:', result)
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        selectRef.current?.completeDataRequest({
          requestId: request.requestId,
          queryGeneration: request.queryGeneration,
          status: 'failed',
          error: { message: error instanceof Error ? error.message : String(error), retryable: true },
        })
      }
    } finally {
      controllers.current.delete(request.requestId)
    }
  }

  return (
    <Select
      ref={selectRef}
      searchable
      config={{
        dataLoading: {
          protocol: 'acknowledged',
          searchMode: 'remote',
          paginationMode: 'cursor',
          fetchLimit: 25,
        },
      }}
      onSearch={(_query, _results, _count, request) => {
        if (request) void load(request)
      }}
      onLoadMore={(_page, request) => {
        if (request) void load(request)
      }}
      onDataRequestCancel={({ requestId }) => {
        controllers.current.get(requestId)?.abort()
        controllers.current.delete(requestId)
      }}
      onDataProjection={(detail) => {
        if (detail.status === 'failed') console.error(detail.error.message)
      }}
      onDataLoadingConfigError={({ issues }) => {
        console.error('Rejected data-loading config:', issues)
      }}
    />
  )
}
```

The coordinator rejects stale responses by request ID and query generation; the host should still abort cancelled network work to save resources. An accepted response does not mean projection is finished: observe `onDataProjection` for the projection result. A failed request remains failed until a new explicit request is made; the sample deliberately does not retry automatically.

### Other useful scenarios

- **Empty query:** clearing search still invokes `onSearch` with `request.query === ''`. `URLSearchParams` serializes it as an explicit empty `q` parameter; do not omit it if the endpoint treats an empty query specially.
- **Page-based pagination:** change `paginationMode` to `'page'`; the request's `position.page` is the page to request. Keep the API's page numbering consistent with `firstPage`.
- **Hybrid search:** use `searchMode: 'hybrid'` only when the host intends the runtime's hybrid search behavior; the host still answers the remote request with its identity and generation.
- **React Strict Mode:** the adapter owns readiness and initial request setup. Do not call a second manual request from an effect; keep each host response keyed by the request ID supplied in the callback. Browser certification for this scenario remains pending outside the reported Chromium run.
- **External busy state:** the React `loading` prop and consumer `aria-busy` remain presentation inputs. The adapter composes them with core busy state; the acknowledged request snapshot's `busy` does not include external presentation loading.
- **Legacy compatibility:** omit `config.dataLoading` to retain the legacy protocol. Existing `onSearch(query, results, count)` and `onLoadMore(page)` calls remain usable; the new request argument is optional in those callback signatures.
- **Controlled selection:** keep `value` in application state and update it through `onChange`. Replacing remote result pages does not transfer ownership of the selected value from the application to the transport layer.

## Infinite Render Loop: Root-Cause Review (No External Dependencies)

If you see `Maximum update depth exceeded`, follow this checklist before shipping:

1. **Controlled sync effects**
  - Review every `useEffect` that syncs `value` into the custom element.
  - Only call `setSelectedValues` when incoming values are actually different from current selected values.

2. **Uncontrolled default sync**
  - Apply `defaultValue` once on initialization.
  - Do not re-apply default selection on every re-render.

3. **Renderer stability**
  - `customRenderer` / `optionRenderer` may be inline.
  - Adapter logic must avoid re-initializing selection state just because function references changed.

4. **Parent computed arrays**
  - For multi-select, memoize computed arrays in parent code when possible:

```tsx
const selectedIds = useMemo(() => items.map(i => i.id), [items]);
<Select multiple value={selectedIds} onChange={...} />
```

### Minimum Regression Test Matrix

Run and keep these scenarios green in `packages/react/tests/infinite-render.spec.tsx`:

- Controlled single-select + inline `customRenderer` + `onChange` state update.
- Controlled multi-select with a new array reference every render.
- Uncontrolled mode with `defaultValue` and repeated parent re-renders.
- Inline DOM `optionRenderer` under repeated parent renders.

Run focused tests:

```bash
npx vitest run packages/react/tests/infinite-render.spec.tsx --config packages/react/vitest.config.ts
```

## Installation

```bash
npm install @smilodon/react @smilodon/core
```

or

```bash
yarn add @smilodon/react @smilodon/core
```

or

```bash
pnpm add @smilodon/react @smilodon/core
```

## Next.js Integration

`@smilodon/react` is built for client-side React rendering and already includes `'use client';` so it can be imported from Next.js App Router client components without extra wrapper files.

### App Router checklist

1. Put the consuming component behind `'use client';`.
2. Import `Select` directly from `@smilodon/react`.
3. Keep large `items` arrays memoized.
4. `virtualized` enables incremental chunk rendering for large flat lists; it does not provide bounded DOM or viewport windowing.

```tsx
'use client';

import { useMemo, useState } from 'react';
import { Select } from '@smilodon/react';

export default function CountrySelect() {
  const [value, setValue] = useState<string | number>('');
  const items = useMemo(
    () => [
      { value: 'de', label: 'Germany' },
      { value: 'jp', label: 'Japan' },
      { value: 'ir', label: 'Iran' },
    ],
    []
  );

  return (
    <Select
      items={items}
      value={value}
      onChange={(next) => setValue(next as string)}
      searchable
      clearable
      placeholder="Choose a country"
    />
  );
}
```

### When using server components

- Fetch data in a server component if desired.
- Pass plain serializable arrays into a client component that renders `Select`.
- Do not render `Select` directly in a server component.

## Quick Start

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';

function MyApp() {
  const [value, setValue] = useState('');

  return (
    <Select
      items={[
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
        { value: 'cherry', label: 'Cherry' },
      ]}
      value={value}
      onChange={(newValue) => setValue(newValue as string)}
      placeholder="Select a fruit..."
    />
  );
}
```

## Clear Control (Reset Selected/Search Value)

Use the built-in clear control in the input area and style it freely:

```tsx
<Select
  items={items}
  value={value}
  onChange={(next) => setValue(next as string)}
  searchable
  clearable
  clearSelectionOnClear
  clearSearchOnClear
  clearAriaLabel="Clear selected and searched values"
  clearIcon="✕"
  onClear={(detail) => console.log('cleared', detail)}
  style={{
    '--select-clear-button-bg': 'rgba(0,0,0,0.06)',
    '--select-clear-button-hover-bg': 'rgba(0,0,0,0.12)',
    '--select-clear-button-color': '#374151',
    '--select-clear-icon-size': '14px',
  } as React.CSSProperties}
/>
```

Available parts for advanced styling: `::part(clear-button)`, `::part(clear-icon)`.

By default, an empty clearable select does not reserve clear-button space. The button and adjusted input/arrow layout appear after a value is selected or, when search clearing is enabled, after search text is entered. They disappear again when both targets are empty. This describes intended shared-runtime behavior across single/multi-select and LTR/RTL configurations; it is not exhaustive React integration certification.

For a permanently visible disabled-when-empty control, use the full core configuration:

```tsx
<Select
  items={items}
  clearable
  config={{ clearControl: { hideWhenEmpty: false } }}
/>
```

`onClear` receives `{ clearedSelection, clearedSearch }`, so controlled state can distinguish which target changed. The core manages action-area spacing automatically; custom styles should target the exposed parts and `--select-clear-*` tokens instead of adding permanent padding.

## Examples

### Basic Single Select

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';

function BasicExample() {
  const [value, setValue] = useState('');

  return (
    <Select
      items={[
        { value: '1', label: 'Option 1' },
        { value: '2', label: 'Option 2' },
        { value: '3', label: 'Option 3' },
      ]}
      value={value}
      onChange={(val) => setValue(val as string)}
      placeholder="Choose an option"
    />
  );
}
```

### String Array Input (Auto-converted)

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';

function StringArrayExample() {
  const [values, setValues] = useState<Array<string | number>>([]);

  return (
    <Select
      items={['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry']}
      value={values}
      onChange={(val) => setValues(val as Array<string | number>)}
      multiple
      placeholder="Select fruits..."
    />
  );
}
```

> **Note:** String arrays are automatically converted to `SelectItem` format internally. Each string becomes `{ value: string, label: string }`.

### Number Array Input (Auto-converted)

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';

function NumberArrayExample() {
  const [value, setValue] = useState<string | number>('');

  return (
    <Select
      items={[1, 2, 3, 5, 8, 13, 21, 34, 55, 89]}
      value={value}
      onChange={(val) => setValue(val)}
      placeholder="Select a Fibonacci number..."
    />
  );
}
```

> **Note:** Number arrays are automatically converted to `SelectItem` format internally. Each number becomes `{ value: number, label: string }`.

### Multi-Select with Object Array

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';

function MultiSelectExample() {
  const [values, setValues] = useState<Array<string | number>>([]);

  return (
    <Select
      items={[
        { value: 'react', label: 'React' },
        { value: 'vue', label: 'Vue' },
        { value: 'angular', label: 'Angular' },
        { value: 'svelte', label: 'Svelte' },
      ]}
      value={values}
      onChange={(val) => setValues(val as Array<string | number>)}
      multiple
      placeholder="Select frameworks..."
    />
  );
}
```

### Searchable Select

```tsx
import { useState } from 'react';
import { Select } from '@smilodon/react';

function SearchableExample() {
  const [value, setValue] = useState('');
  const countries = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'mx', label: 'Mexico' },
  ];

  return (
    <Select
      items={countries}
      value={value}
      onChange={(val) => setValue(val as string)}
      searchable
      placeholder="Search countries..."
    />
  );
}
```

### Grouped Options

Smilodon supports both native `groupedItems` and a flat `items` array where each object includes a `group` property.  The React wrapper will automatically convert the latter for you (added in v1.4.9) so the following two configurations behave identically:

```tsx
// flat list with `group` property (auto-converted)
<Select
  items={[
    { value: 'apple', label: 'Apple', group: 'Fruits' },
    { value: 'banana', label: 'Banana', group: 'Fruits' },
    { value: 'carrot', label: 'Carrot', group: 'Vegetables' },
  ]}
  value={value}
  onChange={(val) => setValue(val as string)}
  placeholder="Select food..."
/>
```

```tsx
// explicit groupedItems structure
<Select
  groupedItems={[
    {
      label: 'Fruits',
      options: [
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
      ],
    },
    {
      label: 'Vegetables',
      options: [
        { value: 'carrot', label: 'Carrot' },
        { value: 'tomato', label: 'Tomato' },
      ],
    },
  ]}
  value={value}
  onChange={(val) => setValue(val as string)}
  placeholder="Select food..."
/>
```

**Customizing the group header**
You can supply a `groupHeaderRenderer` to render arbitrary React content for the header element.  The returned element receives `.group-header` and `part="group-header"` automatically.

```tsx
<Select
  groupedItems={groups}
  groupHeaderRenderer={(grp) => <div className="text-sm uppercase">{grp.label}</div>}
  value={value}
  onChange={(v) => setValue(v as string)}
/>
```

### Infinite Scroll

```tsx
import { useRef, useState } from 'react';
import { Select } from '@smilodon/react';

function InfiniteScrollExample() {
  const pageSize = 20;
  // Page 1 is already loaded; the component's first load-more event requests page 2.
  const [items, setItems] = useState(
    Array.from({ length: pageSize }, (_, index) => ({
      value: String(index + 1),
      label: `Item ${index + 1}`,
    }))
  );
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [loadingPages, setLoadingPages] = useState<number[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const inFlight = useRef(new Set<number>());
  const loadedPages = useRef(new Set<number>());

  const handleLoadMore = async (page: number) => {
    if (!hasMore || inFlight.current.has(page) || loadedPages.current.has(page)) return;
    inFlight.current.add(page);
    setLoadingPages((previous) => [...previous, page]);
    try {
      const response = await fetch(`/api/items?page=${page}`);
      if (!response.ok) throw new Error(`Page request failed: ${response.status}`);
      const newItems = await response.json() as Array<{ value: string; label: string }>;
      setItems((previous) => [...previous, ...newItems]);
      loadedPages.current.add(page);
      if (newItems.length < pageSize) setHasMore(false);
      setError('');
    } catch (reason) {
      setError(String(reason));
    } finally {
      inFlight.current.delete(page);
      setLoadingPages((previous) => previous.filter((entry) => entry !== page));
    }
  };

  return (
    <>
      <Select
        items={items}
        value={value}
        onChange={(val) => setValue(val as string)}
        infiniteScroll
        pageSize={pageSize}
        onLoadMore={handleLoadMore}
      />
      {loadingPages.length > 0 && <p role="status">Loading more options…</p>}
      {error && <p role="alert">{error}</p>}
    </>
  );
}
```

The adapter calls `onLoadMore(page)` but does not await the returned Promise. The application owns transport, duplicate-page guards, loading/error UI, and server end-of-data detection; keep that logic in the host component even if the callback is declared `async`.

### Large Lists (Performance Baseline)

For high-volume datasets, start with the built-in lightweight option rendering and then add custom renderers only if needed for UX.

```tsx
<Select
  items={bigItems}
  virtualized
  searchable
/>
```

Notes:
- `estimatedItemHeight` is an exposed prop for the guarded viewport-windowing test path; it is not a production tuning control while viewport-windowing remains private.
- Complex `optionRenderer` DOM can add interaction cost on large lists; profile before shipping.

### With Validation

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';
import type { FormEvent } from 'react';

function ValidationExample() {
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const items = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
  ];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    const message = value ? '' : 'This field is required';
    setError(message);
    if (!message) console.log('Submit value:', value);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Select
        items={items}
        value={value}
        onChange={(next) => {
          const selected = Array.isArray(next) ? next[0] : next;
          setValue(selected == null ? '' : String(selected));
          if (submitted) setError(selected == null ? 'This field is required' : '');
        }}
        required
        error={!!error}
        errorMessage={error}
        placeholder="Required field"
      />
      {error && <p role="alert">{error}</p>}
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Using Ref for Imperative Actions

```tsx
import { Select, type SelectHandle } from '@smilodon/react';
import { useRef, useState } from 'react';

function RefExample() {
  const items = [
    { value: 'alpha', label: 'Alpha' },
    { value: 'beta', label: 'Beta' },
  ];
  const selectRef = useRef<SelectHandle>(null);
  const [value, setValue] = useState('');

  const handleOpen = () => {
    selectRef.current?.open();
  };

  const handleClear = () => {
    selectRef.current?.clear();
  };

  return (
    <div>
      <Select
        ref={selectRef}
        items={items}
        value={value}
        onChange={(val) => setValue(val as string)}
      />
      <button onClick={handleOpen}>Open Dropdown</button>
      <button onClick={handleClear}>Clear Selection</button>
    </div>
  );
}
```

---

## 🎯 Two Ways to Specify Options

Smilodon React provides **two powerful approaches** for defining select options, each optimized for different use cases:

### Method 1: Data-Driven (Object Arrays) 📊

**Use when**: You have structured data and want simple, declarative option rendering.

**Advantages**:
- ✅ Simple and declarative - React-friendly
- ✅ Auto-conversion from strings/numbers
- ✅ Perfect for basic dropdowns
- ✅ Works seamlessly with React state
- ✅ Can render the datasets exercised in your application; no millions-of-items or constant-DOM guarantee is made
- ✅ Built-in search and filtering
- ✅ Full TypeScript type safety

**Examples**:

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';

// Example 1: Simple object array
function SimpleExample() {
  const [value, setValue] = useState('');

  const items = [
    { value: '1', label: 'Apple' },
    { value: '2', label: 'Banana' },
    { value: '3', label: 'Cherry' }
  ];

  return (
    <Select
      items={items}
      value={value}
      onChange={(val) => setValue(val as string)}
      placeholder="Select a fruit..."
    />
  );
}

// Example 2: With metadata and disabled options
function MetadataExample() {
  const [country, setCountry] = useState('');

  const countries = [
    { value: 'us', label: 'United States', disabled: false },
    { value: 'ca', label: 'Canada', disabled: false },
    { value: 'mx', label: 'Mexico', disabled: true }
  ];

  return (
    <Select
      items={countries}
      value={country}
      onChange={(val) => setCountry(val as string)}
      placeholder="Select a country..."
    />
  );
}

// Example 3: With grouping
function GroupedExample() {
  const [food, setFood] = useState('');

  const foods = [
    { value: 'apple', label: 'Apple', group: 'Fruits' },
    { value: 'banana', label: 'Banana', group: 'Fruits' },
    { value: 'carrot', label: 'Carrot', group: 'Vegetables' },
    { value: 'broccoli', label: 'Broccoli', group: 'Vegetables' }
  ];

  return (
    <Select
      items={foods}
      value={food}
      onChange={(val) => setFood(val as string)}
      placeholder="Select food..."
    />
  );
}

// Example 4: Auto-conversion from strings
function StringArrayExample() {
  const [color, setColor] = useState('');

  const colors = ['Red', 'Green', 'Blue', 'Yellow'];

  return (
    <Select
      items={colors}
      value={color}
      onChange={(val) => setColor(val as string)}
      placeholder="Select a color..."
    />
  );
}

// Example 5: Auto-conversion from numbers
function NumberArrayExample() {
  const [size, setSize] = useState<number | string>('');

  const sizes = [10, 20, 30, 40, 50];

  return (
    <Select
      items={sizes}
      value={size}
      onChange={(val) => setSize(val as number)}
      placeholder="Select size..."
    />
  );
}

// Example 6: Large datasets with useMemo
function LargeDatasetExample() {
  const [id, setId] = useState('');

  const items = useMemo(
    () =>
      Array.from({ length: 100_000 }, (_, i) => ({
        value: i.toString(),
        label: `Item ${i + 1}`
      })),
    []
  );

  return (
    <Select
      items={items}
      value={id}
      onChange={(val) => setId(val as string)}
      virtualized // Enable incremental chunk rendering; not viewport windowing
      placeholder="Select from 100K items..."
    />
  );
}
```

### Method 2: Component-Driven (Custom Renderers) 🎨

Now also supports the native `optionRenderer` hook (Option B) that returns an `HTMLElement` for maximum control (e.g., non-React DOM fragments). Pass `optionRenderer={(item, index, helpers) => { const el = document.createElement('div'); el.textContent = item.label; return el; }}` to mirror the Web Component API.

#### Advanced scenarios (React)
- **Accessibility labels**: use a literal `aria-label` for the internal combobox; host IDREF attributes are not forwarded across the shadow boundary:
  ```tsx
  <span>Pick a user</span>
  <Select id="user-picker" aria-label="Pick a user" onChange={(v, items) => {
    console.log('Selected', items);
  }}/>
  ```
- **Server-side lookup**: cancellation and request sequencing prevent an old response from overwriting newer results; the host also handles HTTP and transport errors:
  ```tsx
  import { useEffect, useRef, useState } from 'react';
  import { Select, type SelectItem } from '@smilodon/react';

  function RemoteSearchExample() {
    const [items, setItems] = useState<SelectItem[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const requestId = useRef(0);
    const controller = useRef<AbortController | null>(null);
    useEffect(() => () => controller.current?.abort(), []);
    async function handleSearch(query: string) {
      const id = ++requestId.current;
      controller.current?.abort();
      if (!query) { setItems([]); setError(''); setLoading(false); return; }
      const current = new AbortController(); controller.current = current;
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/users?q=${encodeURIComponent(query)}`, { signal: current.signal });
        if (!response.ok) throw new Error(`Search failed: ${response.status}`);
        const next = await response.json() as SelectItem[];
        if (id === requestId.current) { setItems(next); setError(''); }
      } catch (reason) {
        if (!(reason instanceof DOMException && reason.name === 'AbortError') && id === requestId.current) setError(String(reason));
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }
    return <><Select items={items} searchable onSearch={handleSearch} />{loading && <p role="status">Searching…</p>}{error && <p role="alert">{error}</p>}</>;
  }
  ```
- **Heavy lists (100k+)**: `virtualized` does not guarantee bounded DOM; true viewport windowing is not a public production mode:
  ```tsx
  const big = useMemo(() => Array.from({ length: 100_000 }, (_, i) => ({ value: i, label: `Row ${i}` })), []);
  <Select items={big} virtualized />
  ```

**Use when**: You need rich option content composed with React. Each rendered row remains one listbox option; arbitrary nested buttons, links, or other separately interactive controls are not a supported assumption.

**Advantages**:
- ✅ Full control over option rendering
- ✅ Render React-node content through the adapter's custom renderer
- ✅ Rich content (images, icons, badges, multi-line text)
- ✅ Custom styling with CSS-in-JS or Tailwind
- ✅ Rich non-interactive option content; keep selection and keyboard interaction on the option itself
- ✅ Conditional rendering based on item data
- ✅ Renderer lifecycle and context boundaries are documented below
- ✅ Perfect for complex UIs (user cards, product listings, etc.)

**How it works**: Provide a `customRenderer` function that returns `React.ReactNode` for each option.

The adapter renders returned content in separate React roots and schedules cleanup when renderer content is replaced or the adapter unmounts. The `customRenderer` callback itself is not a React component and must not call hooks. A component returned by the callback may use its own hooks, but it does not inherit context providers above `<Select>` because its root is separate.

**Examples**:

```tsx
import { Select, type SelectItem } from '@smilodon/react';
import { useState } from 'react';

// Example 1: Simple custom template with icons
interface Language extends SelectItem {
  icon: string;
  description: string;
}

function LanguageSelect() {
  const [lang, setLang] = useState('');

  const languages: Language[] = [
    { value: 'js', label: 'JavaScript', icon: '🟨', description: 'Dynamic scripting language' },
    { value: 'py', label: 'Python', icon: '🐍', description: 'General-purpose programming' },
    { value: 'rs', label: 'Rust', icon: '🦀', description: 'Systems programming language' }
  ];

  return (
    <Select
      items={languages}
      value={lang}
      onChange={(val) => setLang(val as string)}
      customRenderer={(item: Language, index) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>{item.icon}</span>
          <div>
            <div style={{ fontWeight: 600 }}>{item.label}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{item.description}</div>
          </div>
        </div>
      )}
      placeholder="Select a language..."
    />
  );
}

// Example 2: User selection with avatars
interface User extends SelectItem {
  email: string;
  avatar: string;
  role: 'Admin' | 'User' | 'Moderator';
}

function UserSelect() {
  const [userId, setUserId] = useState('');

  const users: User[] = [
    {
      value: '1',
      label: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://i.pravatar.cc/150?img=1',
      role: 'Admin'
    },
    {
      value: '2',
      label: 'Jane Smith',
      email: 'jane@example.com',
      avatar: 'https://i.pravatar.cc/150?img=2',
      role: 'User'
    },
    {
      value: '3',
      label: 'Bob Johnson',
      email: 'bob@example.com',
      avatar: 'https://i.pravatar.cc/150?img=3',
      role: 'Moderator'
    }
  ];

  return (
    <Select
      items={users}
      value={userId}
      onChange={(val) => setUserId(val as string)}
      customRenderer={(item: User) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}>
          <img
            src={item.avatar}
            alt={item.label}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: '#1f2937' }}>{item.label}</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>{item.email}</div>
          </div>
          <span
            style={{
              padding: '4px 8px',
              background: item.role === 'Admin' ? '#dbeafe' : '#f3f4f6',
              color: item.role === 'Admin' ? '#1e40af' : '#374151',
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 600
            }}
          >
            {item.role}
          </span>
        </div>
      )}
      placeholder="Select a user..."
    />
  );
}

// Example 3: Product selection with images and pricing
interface Product extends SelectItem {
  price: number;
  stock: number;
  image: string;
  badge?: string;
}

function ProductSelect() {
  const [productId, setProductId] = useState('');

  const products: Product[] = [
    {
      value: 'p1',
      label: 'Premium Laptop',
      price: 1299.99,
      stock: 15,
      image: 'https://via.placeholder.com/60',
      badge: 'Best Seller'
    },
    {
      value: 'p2',
      label: 'Wireless Mouse',
      price: 29.99,
      stock: 150,
      image: 'https://via.placeholder.com/60'
    },
    {
      value: 'p3',
      label: 'Mechanical Keyboard',
      price: 89.99,
      stock: 0,
      image: 'https://via.placeholder.com/60',
      badge: 'Out of Stock'
    }
  ];

  return (
    <Select
      items={products}
      value={productId}
      onChange={(val) => setProductId(val as string)}
      customRenderer={(item: Product) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            opacity: item.stock === 0 ? 0.5 : 1
          }}
        >
          <img
            src={item.image}
            alt={item.label}
            style={{
              width: 60,
              height: 60,
              borderRadius: 8,
              objectFit: 'cover',
              border: '1px solid #e5e7eb'
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, color: '#1f2937' }}>{item.label}</span>
              {item.badge && (
                <span
                  style={{
                    padding: '2px 6px',
                    background: item.badge === 'Best Seller' ? '#dcfce7' : '#fee2e2',
                    color: item.badge === 'Best Seller' ? '#166534' : '#991b1b',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 600
                  }}
                >
                  {item.badge}
                </span>
              )}
            </div>
            <div
              style={{
                marginTop: 4,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 700, color: '#059669' }}>
                ${item.price.toFixed(2)}
              </span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>
                {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
              </span>
            </div>
          </div>
        </div>
      )}
      placeholder="Select a product..."
    />
  );
}

// Example 4: Status indicators with conditional styling
interface Task extends SelectItem {
  status: 'completed' | 'in-progress' | 'pending';
  priority: 'high' | 'medium' | 'low';
  assignee: string;
}

function TaskSelect() {
  const [taskId, setTaskId] = useState('');

  const tasks: Task[] = [
    { value: 't1', label: 'Design Homepage', status: 'completed', priority: 'high', assignee: 'John' },
    { value: 't2', label: 'API Integration', status: 'in-progress', priority: 'high', assignee: 'Jane' },
    { value: 't3', label: 'Write Documentation', status: 'pending', priority: 'medium', assignee: 'Bob' },
    { value: 't4', label: 'Bug Fixes', status: 'in-progress', priority: 'low', assignee: 'Alice' }
  ];

  const statusConfig = {
    'completed': { bg: '#dcfce7', color: '#166534', icon: '✓' },
    'in-progress': { bg: '#dbeafe', color: '#1e40af', icon: '⟳' },
    'pending': { bg: '#fef3c7', color: '#92400e', icon: '○' }
  };

  const priorityColors = {
    'high': '#ef4444',
    'medium': '#f59e0b',
    'low': '#10b981'
  };

  return (
    <Select
      items={tasks}
      value={taskId}
      onChange={(val) => setTaskId(val as string)}
      customRenderer={(item: Task) => {
        const status = statusConfig[item.status];
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: status.bg,
                color: status.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}
            >
              {status.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: '#1f2937' }}>{item.label}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                Assigned to {item.assignee}
              </div>
            </div>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: priorityColors[item.priority]
              }}
              title={`${item.priority} priority`}
            />
          </div>
        );
      }}
      placeholder="Select a task..."
    />
  );
}

// Example 5: Using Tailwind CSS (if available)
// Note: Tailwind/CSS classes in customRenderer are supported inside Select options.
// Map dynamic values to literal class names so Tailwind's static scanner can include them.
// Core mirrors document stylesheets into shadow DOM for custom option rendering.
interface Tag extends SelectItem {
  color: string;
  count: number;
}

function TailwindExample() {
  const [tag, setTag] = useState('');

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
  } as const;

  const tags: Tag[] = [
    { value: 'react', label: 'React', color: 'blue', count: 1250 },
    { value: 'vue', label: 'Vue', color: 'green', count: 850 },
    { value: 'angular', label: 'Angular', color: 'red', count: 420 }
  ];

  return (
    <Select
      items={tags}
      value={tag}
      onChange={(val) => setTag(val as string)}
      customRenderer={(item: Tag) => (
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${colorClasses[item.color]}`} />
            <span className="font-semibold text-gray-900">{item.label}</span>
          </div>
          <span className="text-sm text-gray-500">{item.count} posts</span>
        </div>
      )}
      placeholder="Select a tag..."
    />
  );
}

// Example 6: With React components
import { Badge } from './Badge'; // Your custom component

function ComponentExample() {
  const [value, setValue] = useState('');

  const items = [
    { value: '1', label: 'Feature', type: 'success', count: 12 },
    { value: '2', label: 'Bug', type: 'error', count: 5 },
    { value: '3', label: 'Enhancement', type: 'info', count: 8 }
  ];

  return (
    <Select
      items={items}
      value={value}
      onChange={(val) => setValue(val as string)}
      customRenderer={(item: any) => (
        <div className="flex items-center justify-between">
          <span>{item.label}</span>
          <Badge type={item.type}>{item.count}</Badge>
        </div>
      )}
    />
  );
}
```

### Comparison: When to Use Each Method

| Feature | Method 1: Object Arrays | Method 2: Custom Renderers |
|---------|------------------------|---------------------------|
| **Setup** | Pass an array of option data | Provide a renderer callback |
| **Rendering behavior** | Shared runtime renders option labels | Adapter renders React-node option content |
| **Customization** | Data-driven labels and state | Custom non-interactive content; nested controls are not promised |
| **React integration** | Controlled/uncontrolled values and callbacks | Same adapter API with custom-rendered content |
| **Component reuse** | Reuse data definitions | Return components; separate-root context limits apply |
| **TypeScript** | Typed item data and props | Typed renderer callback and props |
| **Very large datasets** | No 1M-item certification or performance comparison is claimed | No 1M-item certification or performance comparison is claimed |
| **Choosing a method** | Direct for simple options | Use when custom content is required |

**Best Practices**:

✅ **Use Method 1 (Object Arrays) when**:
- You need simple text-based options
- You have a large dataset and will profile the workload and use host-managed search or pagination where appropriate; no millions-of-items guarantee is made
- You want minimal code
- Built-in search/filter is sufficient
- Working with external APIs returning plain data

✅ **Use Method 2 (Custom Renderers) when**:
- You need images, icons, or badges
- Options require multiple lines of text
- Custom styling/layout is important
- Reusing existing React components
- Conditional rendering based on data
- Rich user experience is priority
- Using CSS-in-JS or Tailwind CSS

### Combining Both Methods

You can start with Method 1 and add Method 2 later as your UI evolves:

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';

function EvolvingComponent() {
  const [value, setValue] = useState('');

  // Start simple
  const items = ['Option 1', 'Option 2', 'Option 3'];

  return (
    <Select
      items={items}
      value={value}
      onChange={(val) => setValue(val as string)}
      // Later, add custom rendering without changing items
      customRenderer={(item, index) => (
        <div style={{ padding: 8, background: index % 2 ? '#f9fafb' : 'white' }}>
          <strong>{item.label || item}</strong>
        </div>
      )}
    />
  );
}
```

### Performance Tips

**For Method 1**:
- Use `useMemo` to memoize large item arrays
- The `virtualized` prop enables incremental chunk rendering, not viewport-windowed rendering.
- Enable `infiniteScroll` for dynamic loading

**For Method 2**:
- Use `useCallback` to memoize renderer function
- Keep renderer pure (no side effects)
- Avoid heavy computations in renderer
- Use React.memo for complex nested components

```tsx
import { Select } from '@smilodon/react';
import { useState, useMemo, useCallback } from 'react';

function OptimizedExample() {
  const [value, setValue] = useState('');

  // Memoize items
  const items = useMemo(
    () =>
      Array.from({ length: 10000 }, (_, i) => ({
        value: i.toString(),
        label: `Item ${i + 1}`,
        description: `Description for item ${i + 1}`
      })),
    []
  );

  // Memoize renderer
  const renderer = useCallback((item: any, index: number) => (
    <div>
      <div style={{ fontWeight: 600 }}>{item.label}</div>
      <div style={{ fontSize: 12, color: '#666' }}>{item.description}</div>
    </div>
  ), []);

  return (
    <Select
      items={items}
      value={value}
      onChange={(val) => setValue(val as string)}
      customRenderer={renderer}
      virtualized // Enable incremental chunk rendering, not viewport windowing
    />
  );
}
```

---

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `SelectItem[]` | `[]` | Array of items to display |
| `groupedItems` | `GroupedItem[]` | - | Grouped items (alternative to flat array) |
| `value` | `string \| number \| Array<string \| number>` | - | Current value (controlled) |
| `defaultValue` | `string \| number \| Array<string \| number>` | - | Default value (uncontrolled) |
| `multiple` | `boolean` | `false` | Enable multi-select mode |
| `searchable` | `boolean` | `false` | Enable search/filter |
| `placeholder` | `string` | `"Select an option..."` | Placeholder text |
| `disabled` | `boolean` | `false` | Disable the select |
| `required` | `boolean` | `false` | Mark as required field |
| `error` | `boolean` | `false` | Show error state |
| `errorMessage` | `string` | - | Error message to display |
| `infiniteScroll` | `boolean` | `false` | Enable infinite scroll |
| `pageSize` | `number` | `20` | Items per page (infinite scroll) |
| `virtualized` | `boolean` | `false` | Enable legacy chunked rendering for large flat lists; not viewport windowing |
| `estimatedItemHeight` | `number` | `48` | Exposed estimate used only by the guarded viewport-windowing test path; not a production tuning control |
| `maxSelections` | `number` | - | Max selections (multi-select) |
| `toggleOnTriggerClick` | `boolean` | `true` | Allow repeated trigger clicks to toggle the dropdown |
| `placement` | `string` | `"bottom-start"` | Dropdown placement |
| `className` | `string` | - | Custom CSS class |
| `style` | `CSSProperties` | - | Inline styles |
| `selectionConfig`, `multiSelectDisplay`, `scrollToSelected`, `styles`, `config` | core configuration types | - | Shared runtime configuration groups |
| `optionRenderer` | `(item, index, helpers) => HTMLElement` | - | DOM renderer; return safe DOM nodes and retain the single-option interaction model |
| `customRenderer` | `(item, index) => React.ReactNode` | - | React-node option content; nested interactive controls are not promised |
| `groupHeaderRenderer` | `(group, index) => React.ReactNode` | - | React-node grouped-header content |
| `clearable`, `clearSelectionOnClear`, `clearSearchOnClear`, `clearAriaLabel`, `clearIcon` | booleans / strings | - | Clear-control configuration |
| `onClear` | `(detail) => void` | - | Reports which selection/search state was cleared |
| `onDiagnostic` | `(detail) => void` | - | Runtime diagnostic callback |
| `trackingEnabled`, `trackEvents`, `trackStyling`, `trackLimitations`, `emitDiagnostics`, `trackingMaxEntries`, `limitationPolicies`, `autoMitigateRuntimeModeSwitch` | documented tracking/limitation types | - | Runtime tracking and limitation-policy configuration |
| `onChange` | `(value, items) => void` | - | Selection change callback |
| `onSelect` | `(item, index) => void` | - | Item select callback |
| `onOpen` | `() => void` | - | Dropdown open callback |
| `onClose` | `() => void` | - | Dropdown close callback |
| `onSearch` | `(query, results, count) => void` | - | Search callback |
| `onLoadMore` | `(page) => void \| Promise<void>` | - | Load more callback |
| `creatable` | `boolean` | `false` | Allow creating new options |
| `onCreate` | `(label) => void` | - | Create option callback |

### Multi-select chip styling

Selected chips in multi-select mode use softer default pill styles and remain fully customizable. Target them with `::part(chip)`, `::part(chip-label)`, `::part(chip-remove)`, and `::part(chip-remove-icon)`, or override CSS variables such as `--select-badge-bg`, `--select-badge-border`, `--select-badge-color`, `--select-badge-shadow`, `--select-badge-width`, `--select-badge-height`, `--select-badge-remove-size`, `--select-badge-remove-icon-size`, and `--select-multi-input-min-width`.

Group headers and option states now expose a matching styling surface as well, including `--select-group-header-*`, `--select-option-border-radius`, `--select-option-active-*`, and `--select-option-disabled-*`.

If you prefer runtime config over raw CSS variables, the shared `styles` config now supports `badge`, `badgeHover`, `badgeActive`, `badgeLabel`, `badgeRemove`, `badgeRemoveHover`, `badgeRemoveActive`, `groupHeader`, and `activeOption`. Custom chip remove icons are available through `selection.removeButtonIcon`.

### Alignment in closed input and dropdown options

To switch alignment and inspect both the selected value in the closed control and the option labels in the dropdown, use the shared alignment tokens together:

- `--select-input-text-align`
- `--select-option-text-align`
- `--select-input-justify-content`
- `--select-group-header-text-align`

Example:

```tsx
<Select
  items={items}
  style={{
    '--select-input-text-align': 'center',
    '--select-option-text-align': 'center',
  } as React.CSSProperties}
/>
```

When testing alignment, inspect the closed selected value first, then open the dropdown and verify the option rows follow the same alignment.

### Direction

The shared default direction is `ltr`, and you can switch a React select to `rtl` through the `direction` prop.

```tsx
<Select
  items={items}
  direction="rtl"
/>
```

This mirrors the shell and dropdown layout automatically, including arrow placement, clear-button placement, separator side, and selected indicator side.

### Disabled / dimmed options

Items with `disabled: true` are dimmed and non-selectable by default.

If you want a dimmed option to remain hoverable or keyboard-focusable while still looking disabled:

```tsx
<Select
  items={items}
  disabledOptionBehavior={{
    hoverable: true,
    focusable: true,
    selectable: false,
  }}
/>
```

### Selected indicator

To hide the selected side indicator without targeting internal pseudo-elements:

```tsx
<Select
  items={items}
  showSelectedIndicator={false}
/>
```

If you want to restyle the indicator instead of hiding it, set the related CSS variables through the component `style` prop.

### Chip remove icon

You can replace the default chip remove icon with the `removeButtonIcon` prop:

```tsx
<Select
  items={items}
  multiple
  removeButtonIcon="−"
/>
```

Markup strings are supported too, so inline SVG icons work.

To style the icon separately from the round remove button, use the host `style` prop with these tokens:

- `--select-badge-remove-icon-size`
- `--select-badge-remove-icon-color`
- `--select-badge-remove-icon-font-size`
- `--select-badge-remove-icon-line-height`
- `--select-badge-remove-icon-transform`
- `--select-badge-remove-icon-opacity`

You can also target the icon directly with `::part(chip-remove-icon)`.

## Core config parity and global defaults

The React adapter now exposes the same runtime configuration surface as `@smilodon/core` through both convenience props and the full `config` prop.

### Convenience props for the most common core features

Use these when you want adapter-friendly props without building the full config object yourself:

- `selectionConfig`
- `multiSelectDisplay`
- `scrollToSelected`
- `styles`
- `config`

Example: horizontal chip scrolling with a custom remove icon style.

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';

function HorizontalChipExample() {
  const [values, setValues] = useState<Array<string | number>>(['react', 'vue']);

  return (
    <Select
      multiple
      items={[
        { value: 'react', label: 'React' },
        { value: 'vue', label: 'Vue' },
        { value: 'svelte', label: 'Svelte' },
        { value: 'solid', label: 'Solid' },
      ]}
      value={values}
      onChange={(next) => setValues(next as Array<string | number>)}
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
      searchable
      clearable
      placeholder="Select frameworks"
    />
  );
}
```

### Full core config passthrough with `config`

Use `config` when you want to pass the same shape you would send directly to `enhanced-select.updateConfig()`.

```tsx
import { Select } from '@smilodon/react';

<Select
  items={items}
  multiple
  config={{
    dropdownPlacement: { mode: 'auto' },
    multiSelectDisplay: {
      mode: 'vertical',
      maxHeight: '120px',
      overflowY: 'auto',
    },
    scrollToSelected: {
      enabled: true,
      multiSelectTarget: 'last',
      behavior: 'smooth',
      block: 'nearest',
    },
    selection: {
      closeOnSelect: false,
      allowDeselect: true,
      disabledOptionBehavior: {
        hoverable: true,
        focusable: true,
      },
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

### Global defaults from the adapter package

The React package now re-exports the shared global config helpers, so React apps can set runtime defaults without importing from `@smilodon/core` directly.

```tsx
import { configureSelect, resetSelectConfig, Select } from '@smilodon/react';

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

function App() {
  return <Select items={items} placeholder="Inherited defaults" />;
}

// Later, if you need to clear the global defaults:
resetSelectConfig();
```

### Runtime control from refs

`SelectHandle` now includes the common core-style imperative helpers in addition to the existing diagnostics APIs.

```tsx
import { useRef } from 'react';
import { Select, type SelectHandle } from '@smilodon/react';

function RuntimeControlExample() {
  const ref = useRef<SelectHandle>(null);

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => ref.current?.open()}>Open</button>
        <button onClick={() => ref.current?.clearSearch()}>Clear Search</button>
        <button onClick={() => ref.current?.updateConfig({ selection: { showSelectedIndicator: false } })}>
          Hide Indicator
        </button>
        <button onClick={() => ref.current?.setError('Selection is required')}>Set Error</button>
        <button onClick={() => ref.current?.clearError()}>Clear Error</button>
        <button onClick={() => console.log(ref.current?.validate())}>Validate</button>
      </div>

      <Select ref={ref} items={items} required searchable />
    </>
  );
}
```

### Types

#### SelectItem

```typescript
interface SelectItem {
  value: string | number;
  label: string;
  disabled?: boolean;
  [key: string]: unknown; // Additional custom properties
}
```

#### SelectHandle

```typescript
interface SelectHandle {
  focus: () => void;
  open: () => void;
  close: () => void;
  getSelectedItems: () => SelectItem[];
  getSelectedValues: () => Array<string | number>;
  setItems: (items: SelectItem[]) => void;
  setGroupedItems: (groups: GroupedItem[]) => void;
  clear: () => void;
  clearSearch: () => void;
  updateConfig: (config: Partial<GlobalSelectConfig>) => void;
  setError: (message: string) => void;
  clearError: () => void;
  setRequired: (required: boolean) => void;
  validate: () => boolean;
  getCapabilities: () => SelectCapabilitiesReport | undefined;
  getKnownLimitations: () => LimitationState[];
  getTrackingSnapshot: () => TrackingSnapshot;
  clearTracking: (source?: 'event' | 'style' | 'limitation' | 'all') => void;
  setLimitationPolicies: (policies: LimitationPolicyMap) => void;
}
```

## Styling

The component uses Shadow DOM for style encapsulation. You can customize it using CSS custom properties:

```css
enhanced-select {
  --select-border-color: #e2e8f0;
  --select-border-focus-color: #3b82f6;
  --select-bg: white;
  --select-text-color: #1f2937;
  --select-placeholder-color: #9ca3af;
  --select-dropdown-bg: white;
  --select-dropdown-border: #e2e8f0;
  --select-dropdown-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --select-option-hover-bg: #f3f4f6;
  --select-option-selected-bg: #eff6ff;
  --select-option-selected-color: #3b82f6;
  --select-option-selected-border: 1px solid #3b82f6;
  --select-option-selected-hover-bg: #dbeafe;
  --select-option-selected-hover-border: 1px solid #2563eb;
}
```

## Accessibility

Implemented keyboard and ARIA behaviors include:

- ✅ Tested keyboard paths include Arrow keys, Enter, Escape, and Tab; this is not an exhaustive interaction certification
- ✅ ARIA attributes and selected live-region announcements
- ✅ Focus management
- ✅ High contrast mode support
- ✅ Reduced motion support
- Touch-target sizing is themeable; WCAG touch-target conformance has not been certified.
- The shared core passed its scoped Phase 4 automated browser matrix in Chromium, Firefox, and WebKit. This does not establish every React integration pattern, minimum-browser-version compatibility, or WCAG conformance. Manual Windows/NVDA and macOS/VoiceOver assessments remain pending.

### Important: Passing inline functions as renderers

If you define `optionRenderer` or `customRenderer` inline (like arrow function inside template/JSX), it may cause unnecessary re-creation in some frameworks.

**Highly recommended:** For best performance and to avoid potential issues, always use memoization:

```tsx
const myRenderer = useCallback((item, index, helpers) => {
  return document.createElement('div');
}, []);
```

Adapters are designed to not loop even without memoization, but memoization still improves performance.

## Performance

- Incremental chunk rendering for large flat datasets; viewport windowing is not public/production-activated
- Lazy loading with infinite scroll
- React state and renderer stability guidance; the adapter does not promise an internal `React.memo` wrapper
- Tree-shakeable exports
- Bundle output depends on the consuming app and bundler; no version-specific size claim is made here

## Browser Support

The minimum versions listed by repository policy are compatibility targets, not versions proven by the current Phase 4 matrix. The completed automated matrix uses current pinned Chromium, Firefox, and WebKit builds; consult the [browser support policy](../../docs/compliance/BROWSER-SUPPORT.md) for declared compatibility details.

## TypeScript

Full TypeScript support with comprehensive type definitions included.

```tsx
import { Select, type SelectProps, type SelectHandle, type SelectItem, type GroupedItem, type GlobalSelectConfig, type SelectCapabilitiesReport, type LimitationState, type TrackingSnapshot, type LimitationPolicyMap } from '@smilodon/react';
```

## License

MIT © Smilodon

## Related Packages


- `@smilodon/core` - Core web component
- `@smilodon/vue` - Vue 3 adapter
- `@smilodon/svelte` - Svelte adapter
