# @smilodon/angular

Angular adapter for [Smilodon Select](https://github.com/navidrezadoost/smilodon).

> **Status: S2 (Wave 2).** This package now ships a **minimal standalone
> component** (`SmilodonSelectComponent`) that hosts `<enhanced-select>` with
> browser-deferred core loading and imperative input binding. The remaining
> slices are still pending: event bridge (`@Output()`, S3), `ControlValueAccessor`
> (S4), and SSR rendering/hydration qualification (S5). APIs may change before
> S5.

## Usage (S2)

```ts
import { Component } from '@angular/core';
import { SmilodonSelectComponent, type SmilodonSelectItem } from '@smilodon/angular';

@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [SmilodonSelectComponent],
  template: `
    <smilodon-select
      [items]="items"
      [value]="selected"
      [multiple]="true"
      [searchable]="true"
      placeholder="Pick one or more">
    </smilodon-select>
  `,
})
export class DemoComponent {
  items: SmilodonSelectItem[] = [
    { value: 'a', label: 'Apple' },
    { value: 'b', label: 'Banana' },
  ];
  selected: Array<string | number> = [];
}
```

### Inputs

| Input | Maps to |
| --- | --- |
| `items` | `setItems()` |
| `groupedItems` | `setGroupedItems()` (takes precedence over `items`) |
| `value` | `setSelectedValues()` (async) |
| `multiple` | `updateConfig({ selection: { mode } })` |
| `searchable` | `updateConfig({ searchable })` |
| `disabled` | `updateConfig({ enabled: !disabled })` |
| `required` | `setRequired()` |
| `error` | `setError()` / `clearError()` |
| `placeholder` | `updateConfig({ placeholder })` |
| `config` | layered into the single `updateConfig()` call |

Inputs are applied through the element's **imperative API**, never as HTML
attributes — only `aria-*` are observed by the element, so attribute binding
would silently no-op.

### Lifecycle

`ngAfterViewInit` (browser only) → `ensureEnhancedSelectDefined()` (dynamic
`import('@smilodon/core')`) → `customElements.whenDefined('enhanced-select')` →
apply inputs. Later input changes reconcile via `ngOnChanges` once ready. A
pending init is ignored after `ngOnDestroy`.

### Tests

```bash
npm test -w @smilodon/angular        # jsdom integration (component + loader)
npm run test:ssr -w @smilodon/angular # no-DOM Node: entry import-safety (API-075)
```

## Design (adopted Wave 2 architecture)

- **Framework:** Angular standalone components (no NgModule required).
- **Integration:** hosts the native `<enhanced-select>` custom element.
- **Core dependency:** reuses `@smilodon/core` unchanged (peer dependency).
- **Selection authority:** the existing headless engine (no extraction).
- **Execution:** CSR-first.
- **Runtime loading:** `@smilodon/core` is loaded **browser-deferred** (dynamic
  `import()` guarded by a platform check), beginning in S2 — never statically at
  module top level, so the API-075 server-import limitation is not triggered.
- **SSR:** hydration/SSR compatibility is a separate, later qualification gate
  (S5), not claimed by this scaffold.
- **Forms:** `ControlValueAccessor` is a dedicated later slice (S4).
- **API-075 core remediation:** out of scope / not authorized.

## Import-safety discipline

Every re-export of `@smilodon/core` in this package is **type-only**
(`export type`). Type imports are erased at build time, so the runtime bundle
contains **no** `require`/`import` of `@smilodon/core`. This is deliberate and
enforced: it is what allows S2 to introduce browser-deferred runtime loading
without reintroducing the no-DOM import throw. Do not add a value import of
`@smilodon/core` to S1 sources.

## Build

```bash
npm run build -w @smilodon/angular
```

Produces `dist/index.js` (ESM), `dist/index.cjs` (CJS), and `dist/types/index.d.ts`.
`@smilodon/core` and `@angular/core` are externalized (peer dependencies).

## License

MIT
