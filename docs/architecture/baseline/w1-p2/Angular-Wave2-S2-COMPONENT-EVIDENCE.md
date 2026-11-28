# Angular Wave 2 — S2 Minimal Standalone Component: Evidence

**Increment:** Angular Wave 2 — **S2 (minimal browser-deferred standalone component, CSR)**
**Starting commit:** `4daffa0fb23c916040f872588a4be775eeee6702` (S1/S1-R closed)
**Branch:** `codex/w1-p1-3-keyboard-characterization`
**Authorized scope (Lead directive):** browser-deferred Angular standalone component: Angular-compatible compilation, imperative bindings for items/configuration/selected values, safe asynchronous initialization, destruction cleanup, focused integration tests. No event bridge (`@Output()`, S3), no `ControlValueAccessor` (S4), no SSR rendering/hydration qualification (S5), no core production change, no API-065/API-075 remediation.

---

## 0. What S2 delivers

A single minimal standalone component, `SmilodonSelectComponent`, plus a small
browser-deferred core loader. The component owns **no** rendering or selection
logic — the `<enhanced-select>` element (driven by `@smilodon/core`) owns all of
it. The component is a thin imperative host binding, consistent with the other
adapters.

```
packages/angular/
  src/select.component.ts   # SmilodonSelectComponent (standalone, OnPush)
  src/core-loader.ts        # browser-guarded dynamic import('@smilodon/core') + whenDefined
  src/index.ts              # now also exports the component + loader helpers
  src/types.ts              # (unchanged from S1)
  tests/setup.ts            # JIT compiler + jsdom polyfills + element registration
  tests/select.component.spec.ts     # 11 integration tests (real element)
  tests/core-loader.spec.ts          # 4 loader unit tests
  tests/ssr-import-safety.ssr.spec.ts# 3 no-DOM Node import-safety tests (API-075)
  vitest.config.ts          # jsdom + legacy decorators
  vitest.ssr.config.ts      # node (no DOM) import-safety
  vite.config.ts            # (unchanged; @angular/core + @smilodon/core external)
  tsconfig.json             # + experimentalDecorators / emitDecoratorMetadata
  package.json              # + Angular dev toolchain, test scripts
```

---

## 1. Browser-deferred loading (API-075 discipline)

- `core-loader.ts` is the **only** module allowed to reference the core runtime.
  It exposes `ensureEnhancedSelectDefined()`, which:
  1. refuses outside a browser (`isBrowserEnvironment()`),
  2. short-circuits if `<enhanced-select>` is already defined (no second copy),
  3. otherwise performs a **dynamic `import('@smilodon/core')`**, defines the
     element, and awaits `customElements.whenDefined(...)`, caching one promise.
- The ESM/CJS bundles contain **only a dynamic `import("@smilodon/core")`** — no
  static top-level import/require (verified; see §3 A3/R5). `@angular/core` is
  externalized (peer), not bundled.

## 2. Component behavior

- **Template:** `<enhanced-select #host>` — the element, nothing else.
- **Inputs → imperative API** (never attributes; only `aria-*` are observed):
  `items`→`setItems`, `groupedItems`→`setGroupedItems` (precedence), `value`→
  `setSelectedValues` (async), `multiple`→`selection.mode`, `searchable`,
  `disabled`→`enabled:!disabled`, `required`→`setRequired`, `error`→`setError`/
  `clearError`, `placeholder`, and a `config` passthrough layered into a single
  `updateConfig()` call.
- **Lifecycle:** `ngAfterViewInit` (browser only) → `ensureEnhancedSelectDefined()`
  → apply latest inputs. Later changes reconcile via `ngOnChanges` once ready.
- **Safe async lifecycle:** each init carries a generation; `ngOnDestroy` sets a
  destroyed flag and bumps the generation, so a pending init is ignored and never
  configures a torn-down view. `ngOnDestroy` is idempotent.

## 3. Acceptance gates (all PASS)

| # | Criterion | Command | Result |
| --- | --- | --- | --- |
| A1 | Component tests (real element) | `vitest run --config packages/angular/vitest.config.ts` | **PASS** — 15 (11 component + 4 loader) |
| A2 | SSR import-safety (no DOM) | `vitest run --config packages/angular/vitest.ssr.config.ts` | **PASS** — 3 |
| A3 | No eager core runtime import in bundle | grep static `import/require @smilodon/core` in `dist/index.{js,cjs}` | **PASS** — none; only dynamic `import()` |
| A4 | Angular TSC clean | `tsc -p packages/angular/tsconfig.json --noEmit` | **PASS** — exit 0 |
| A5 | Build from clean | `npm run build -w @smilodon/angular` | **PASS** — vite ES+CJS + declarations |
| A6 | Clean install reproducible | `npm ci` in pristine copy + build + both suites | **PASS** — 747 pkgs; build ok; 15 + 3 tests |
| A7 | Core TSC regression | `tsc -p packages/core/tsconfig.json --noEmit` | **PASS** — 44 pre-existing; none angular |
| A8 | Core jsdom regression | `vitest run --config packages/core/vitest.config.ts` | **PASS** — 1071 passed \| 1 skipped (71 files) |
| A9 | Core SSR regression | `vitest run --config packages/core/vitest.ssr.config.ts` | **PASS** — 10 |
| A10 | ESLint | `eslint packages/angular/{src,tests,...}` | **PASS** — exit 0 |
| A11 | Traceability | `verify_traceability.py` | **PASS** — 129 IDs reconcile |

### Build artifacts (not committed; dist gitignored)
- `dist/index.js` (ESM, ~6.75 kB) — component + loader; core only via dynamic `import()`.
- `dist/index.cjs` (CJS, ~8.24 kB) — same.
- `dist/types/*.d.ts` — flat declarations; `@smilodon/core` only as `import type`.

## 4. Angular-compatible compilation

- Legacy Angular decorators (`experimentalDecorators`, `emitDecoratorMetadata`,
  `useDefineForClassFields:false`) in `tsconfig.json`, so `@Component`/`@Input`
  compile as Angular expects.
- Tests JIT-compile via `import '@angular/compiler'` in `tests/setup.ts` before
  any partially compiled `@angular/*` package is evaluated (Angular 21.2.26).
- Toolchain pinned to Angular `21.2.26` as devDependencies; peer remains
  `@angular/core >=16.0.0`.

## 5. Dependency/lockfile change (minimal, no version drift)

- Added devDependencies: `@angular/core`, `@angular/compiler`, `@angular/common`
  (21.2.26), `zone.js` (0.16.3), `rxjs` (7.8.2), `jsdom`, `vitest`.
- Lockfile: only the new Angular nodes were **added**; **zero** version/resolved
  changes for any existing package. The npm regeneration again pruned the
  optional `lightningcss*`/`detect-libc` peers of `vite`; those nodes were
  **restored** (same correction as S1-R) so nothing from prior commits is
  dropped. `rxjs`/`tslib` are now `dev:true` because `@angular/core` is a
  devDependency here (its deps may be dev). No source/version drift.

## 6. Non-goals (explicitly NOT in S2)

No `@Output()` event bridge (S3), no `ControlValueAccessor` (S4), no SSR
rendering/hydration rendering of the element (S5), no core production change,
no API-075/API-065 remediation, no custom renderer/slot bridging.

## 7. Disclosed limitation

- The repository's **44 pre-existing `@smilodon/core` TypeScript errors remain**
  — unchanged by S2 and none reference angular; a pre-existing repo condition.
- S2 is **CSR-first**. The component renders the `<enhanced-select>` host in its
  template; on the server the init hook is a no-op (no core import/instantiation),
  which is the documented API-075-safe placeholder path. Full SSR
  rendering/hydration qualification is S5.

---

_End of S2 evidence. Minimal browser-deferred standalone component with imperative
input binding, safe async lifecycle, and focused integration + import-safety tests.
No core change. Ready for S3 (event bridge) upon separate authorization._
