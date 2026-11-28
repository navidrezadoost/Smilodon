# @smilodon/angular

Angular adapter for [Smilodon Select](https://github.com/navidrezadoost/smilodon).

> **Status: S3 (Wave 2).** This package ships a **minimal standalone component**
> (`SmilodonSelectComponent`) that hosts `<enhanced-select>` with
> browser-deferred core loading, imperative input binding, and a **typed event
> bridge** (S3 `@Output()`s forwarding the element's `CustomEvent`s). The
> remaining slices are still pending: `ControlValueAccessor` (S4) and SSR
> rendering/hydration qualification (S5). APIs may change before S5.

## Usage (S3)

```ts
import { Component } from '@angular/core';
import {
  SmilodonSelectComponent,
  type SmilodonSelectItem,
  type ChangeEventDetail,
} from '@smilodon/angular';

@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [SmilodonSelectComponent],
  template: `
    <smilodon-select
      [items]="items"
      [multiple]="true"
      [searchable]="true"
      placeholder="Pick one or more"
      (change)="onChange($event)"
      (select)="onSelect($event)"
      (search)="onSearch($event)">
    </smilodon-select>
  `,
})
export class DemoComponent {
  items: SmilodonSelectItem[] = [
    { value: 'a', label: 'Apple' },
    { value: 'b', label: 'Banana' },
  ];
  onChange(detail: ChangeEventDetail) {
    console.log(detail.selectedValues, detail.selectedItems);
  }
  onSelect(detail: unknown) {}
  onSearch(detail: unknown) {}
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

### Outputs (S3 event bridge)

Every output forwards the element's own `CustomEvent.detail` **verbatim** — the
emitted value IS the core detail object (payload identity preserved) — typed by
the exact `@smilodon/core` detail shape. Output names equal the element wire
names, so a consumer's `(change)="…"` maps 1:1 to core's `change`.

| Output | Core `CustomEvent` | Payload type |
| --- | --- | --- |
| `(select)` | `select` | `SelectEventDetail` |
| `(change)` | `change` | `ChangeEventDetail` |
| `(open)` | `open` | `OpenEventDetail` |
| `(close)` | `close` | `CloseEventDetail` |
| `(search)` | `search` | `SearchEventDetail` |
| `(loadMore)` | `loadMore` | `LoadMoreEventDetail` |
| `(remove)` | `remove` | `RemoveEventDetail` |
| `(clear)` | `clear` | `ClearEventDetail` |
| `(pageLoaded)` | `pageLoaded` | `PageLoadedEventDetail` |
| `(error)` | `error` | `ErrorEventDetail` |
| `(emptyStateChange)` | `emptyStateChange` | `EmptyStateChangeDetail` |
| `(diagnostic)` | `diagnostic` | `DiagnosticEventDetail` |

**Documented alias — `error`.** The `error` event is exposed as the
component property `coreError` bound to the **wire name** `error`
(`@Output('error')`). The property cannot be named `error` because the
`@Input() error` (validation message string) already owns that identifier — a
class member cannot be both a string input and an `EventEmitter`. The alias
affects only the TypeScript member name: consumers write `(error)="onError($event)"`
and receive the untouched `ErrorEventDetail`. This is the **only** aliased
output.

### Event-bridge guarantees

- **Single-listener authority.** Exactly one listener per event is registered on
  this component's own `<enhanced-select>` element (idempotent), and it is
  removed on `ngOnDestroy`. Events are `stopPropagation`-ed at the element
  boundary so an event whose name collides with a native DOM event (`change`,
  `select`, …) is delivered **once**, via the `@Output()` — never twice via
  bubbling to the host.
- **No feedback loop.** A programmatic `change` (e.g. from the controlled
  `value` reconciliation) is forwarded as-is and is **never** written back into
  the `value` input. Parent-driven reconciliation stays parent-driven.
- **Lifecycle.** Listeners are installed at `ngAfterViewInit` **before** any
  initialization that may emit; nothing is delivered after teardown.

### Controlled `value` semantics

`setSelectedValues()` is async, so `value` has an explicit contract:

| `value` | Effect |
| --- | --- |
| `undefined` (default / never bound) | Do **not** touch selection (no spurious clear). |
| `[]` | Explicit empty selection (clears). |
| `null` | Explicit empty selection (clears). |
| `['a', 'b']` | Apply that selection. |

This preserves the distinction between "no value supplied" and "explicitly
clear". Async applications are **generation-guarded**: a stale `setSelectedValues`
rejection (superseded by a newer value) is swallowed and never surfaces, and the
latest value always wins. Rejections from the current selection are exposed via
`lastValueError` rather than becoming unhandled promise rejections.

### Lifecycle

`ngAfterViewInit` (browser only) attaches the event-bridge listeners, then
`ensureEnhancedSelectDefined()` (dynamic `import('@smilodon/core')`) →
`customElements.whenDefined('enhanced-select')` → apply inputs. Later input
changes reconcile via `ngOnChanges` once ready. A pending init is ignored after
`ngOnDestroy`, and every event listener is removed on destroy.

### Tests

```bash
npm test -w @smilodon/angular         # jsdom integration (component + loader + events)
npm run test:ssr -w @smilodon/angular # no-DOM Node: entry import-safety (API-075)
npm run test:consumer -w @smilodon/angular # real AOT consumer vs the built dist
```

The jsdom suite includes focused S3 event-bridge tests (`tests/events.spec.ts`):
payload parity (output value === core `CustomEvent.detail`), ordering,
programmatic-vs-interaction, single-listener/no-double-delivery, destruction
cleanup, and the `error`→`coreError` alias.

`test:consumer` is the packaging qualification gate: it AOT-compiles a minimal
application component (`ngc`, full compilation) that imports the **built**
`@smilodon/angular` artifact, boots it through the Angular `TestBed` under
jsdom, and verifies that `[items]`, `[value]`, and config bindings actually
reach the real `<enhanced-select>` element.

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

The package is built by **ng-packagr** in **partial (Ivy) compilation mode**
(`ngc`). It produces an Angular-library layout:

```
dist/
  fesm2022/smilodon-angular.mjs   # partial-compiled ESM (FESM) bundle
  types/smilodon-angular.d.ts     # flattened declarations
  package.json                    # generated manifest (exports/types/main)
```

`@angular/core` and `@smilodon/core` are externalized (peer dependencies), so a
consuming application links the partial artifact with its own Angular version
(AOT). `@smilodon/core` is only ever reached through the browser-deferred
dynamic `import()`, never a static import.

### Supported Angular versions

The partial-compiled artifact declares an Ivy `minVersion` of `14.0.0`, and the
component uses only APIs available since Angular 14 (standalone components,
`inject`, `CUSTOM_ELEMENTS_SCHEMA`). CI currently certifies consumption against
**Angular 21.2.26** only; the peer range is therefore narrowed to
`>=21.0.0 <22.0.0` until additional versions are verified in CI. Widening the
range requires multi-version AOT-consumer evidence.

## License

MIT
