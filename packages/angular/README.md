# @smilodon/angular

Angular adapter for [Smilodon Select](https://github.com/navidrezadoost/smilodon).

> **Status: S1 scaffold (Wave 2).** This package currently provides only the
> package foundation and public **type** surface. The Angular standalone
> component, event bridge, forms integration, and browser-deferred runtime
> loading arrive in subsequent, separately reviewed slices (S2–S6). Do not
> depend on runtime behavior yet.

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
