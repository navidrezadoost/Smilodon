# Angular Wave 2 — S2-R Corrective Increment: Evidence

**Increment:** Angular Wave 2 — **S2-R (corrective: production-qualified packaging,
controlled-value sync, async ordering, real AOT consumer)**
**Starting commit:** `fff2c52d1bb4aa04e744bb9f89ac8825066b8977` (S2 CONDITIONAL ACCEPTANCE)
**Branch:** `codex/w1-p1-3-keyboard-characterization`
**Authorized scope (Lead S2 review → S2-R):** keep the thin component architecture;
correct packaging (S2-F01), controlled-value sync (S2-F02), async handling (S2-F03),
and real-Angular-consumer verification (S2-F04) **in one bounded increment**.

> Addresses the four CONDITIONAL findings from the Lead S2 review at `fff2c52`.
> No event bridge (`@Output()`, S3), no `ControlValueAccessor` (S4), no SSR
> rendering/hydration (S5), no core production change, no API-065/API-075
> remediation.

---

## 0. What S2-R changes

| File | Change |
| --- | --- |
| `packages/angular/src/select.component.ts` | `value` contract (`undefined` = leave alone, `null`/`[]` = clear); generation-guarded async `applySelectedValues()` with rejection capture (`lastValueError`) and latest-wins ordering; `CUSTOM_ELEMENTS_SCHEMA` for AOT. |
| `packages/angular/ng-package.json` | **New** — ng-packagr entry (`src/index.ts`), partial compilation. |
| `packages/angular/tsconfig.lib.json` | **New** — ng-packagr build config (partial mode, strict templates). |
| `packages/angular/package.json` | `build` → `ng-packagr`; `test:consumer`; deps `+tslib`; devDeps `+@angular/compiler-cli`, `+@angular/platform-browser`, `+ng-packagr@21.2.7`, TS `^5.9.3`; peer narrowed `@angular/core >=21 <22`. |
| `packages/angular/tests/select.component.spec.ts` | +8 deterministic tests (S2-F02 clearing, S2-F03 rejection/ordering). |
| `packages/angular/tests/consumer/` | **New** — real AOT consumer fixture + runner (`consumer-app.component.ts`, `tsconfig.consumer.json`, `run-consumer.mjs`). |
| `packages/angular/README.md` | Value contract, packaging, supported-version sections. |
| `.gitignore` | ignore `packages/angular/tests/consumer/.aot-out/`. |

Removed: the S2 Vite build (`vite.config.ts` build path), `scripts/cleanup-types.js`
hand-flattening, and JIT-only assumption for distribution. `vite` remains a
devDependency **only for the Vitest test runner**.

---

## 1. S2-F01 — Production-qualified packaging (PASS)

**Before (S2):** `vite build && tsc --emitDeclarationOnly && cleanup-types.js`. This
produced a plain ESM/CJS bundle that was **not** an Angular-library artifact; it
was only ever loaded JIT in tests.

**Now (S2-R):** `ng-packagr@21.2.7` + `@angular/compiler-cli@21.2.26`, compiled by
`ngc` in **partial (Ivy) compilation mode**:

```
dist/
  fesm2022/smilodon-angular.mjs   # partial-compiled FESM (ɵɵngDeclareComponent)
  types/smilodon-angular.d.ts     # flattened declarations
  package.json                    # ng-packagr-generated manifest
```

Evidence:
- `ɵɵngDeclareComponent` present (partial marker); `minVersion: "14.0.0"`.
- `@angular/core` is a **static external** (`import * as i0 from '@angular/core'`).
- `@smilodon/core` has **zero static imports**; only the browser-deferred
  `import('@smilodon/core')` — SSR import-safety (API-075) preserved.
- FESM ~17.2 kB; no runtime `tslib` import emitted in the linked bundle.

Peer range: narrowed from `>=16.0.0` to **`>=21.0.0 <22.0.0`** because only Angular
`21.2.26` is certified. The partial artifact's `minVersion` is `14.0.0` and the
component uses only APIs available since v14, so widening is possible — but that
requires multi-version AOT-consumer evidence, which S2-R does not claim.

## 2. S2-F02 — Controlled-value clearing (PASS)

**Before (S2):** `if (this.value) { setSelectedValues(this.value) }` — a change
`['a'] → null` sent nothing, leaving the previous selection alive.

**Now (S2-R):** explicit contract:

| `value` | Effect |
| --- | --- |
| `undefined` (default / never bound) | Do **not** touch selection (no spurious clear). |
| `[]` | Explicit empty selection (clears). |
| `null` | Explicit empty selection (clears). |
| `['a', …]` | Apply. |

The input default is `undefined` (not `null`) so an unbound consumer never clears.
Tests cover: `['a']→null` clears; `['a','b']→[]` clears; unbound `undefined` does
NOT call `setSelectedValues`; unbinding `value` while changing an unrelated input
does not clear a live selection; and omitted-vs-explicit-null distinction.

## 3. S2-F03 — Async value application (PASS)

**Before (S2):** `void element.setSelectedValues(...)` — unhandled rejection risk;
overlapping calls uncoordinated.

**Now (S2-R):** `applySelectedValues()` tags each request with a monotonic
`valueGeneration`; the promise is `.catch`-ed (never an unhandled rejection):
- a **stale** rejection (superseded by a newer value) is swallowed;
- a **stale success** cannot clear a genuine newer error;
- only the latest request writes `lastValueError` (null on success).
- synchronous throws are also captured defensively.

Deterministic tests use `mockImplementation` returning controllable
`resolve`/`reject` handles to prove: oldest-first/ newest-first settling orders,
stale rejection ignored, and newest failure recorded after an older success.

## 4. S2-F04 — Real Angular AOT consumer (PASS)

`tests/consumer/` contains a minimal standalone `ConsumerAppComponent` that
imports the **built** `@smilodon/angular` (symlinked to `packages/angular/dist`)
and binds `[items]`, `[value]`, `[multiple]`, `[searchable]`, `placeholder`.
`run-consumer.mjs`:
1. creates the local package links (dist + core), clears `.aot-out`;
2. AOT-compiles the consumer with **`ngc` (compilationMode: full)** — no JIT;
3. brings up jsdom + zone.js, initializes the browser testing platform;
4. boots through the Angular `TestBed` and asserts the bindings reached the real
   `<enhanced-select>` element.

Verified (7/7): element rendered; upgraded+configured; `single` mode; `searchable`;
placeholder; **3 items reached the registry**; `[value]=["b"]` selected `b`.

The compiled output is genuine AOT (`ɵɵdefineComponent`, `ɵɵelement`/`ɵɵproperty`,
static `SmilodonSelectComponent` import), proving a normal Angular app can consume
the partial-compiled library.

---

## 5. Acceptance gates (all PASS)

| # | Criterion | Command | Result |
| --- | --- | --- | --- |
| R1 | Angular jsdom suite | `vitest run --config packages/angular/vitest.config.ts` | **PASS** — 23 (19 component + 4 loader) |
| R2 | Angular SSR import-safety | `vitest run --config packages/angular/vitest.ssr.config.ts` | **PASS** — 3 |
| R3 | Real AOT consumer | `npm run test:consumer -w @smilodon/angular` | **PASS** — 7/7 assertions |
| R4 | Partial-compiled artifact | `ng-packagr` build; grep dist | **PASS** — FESM partial, `ɵɵngDeclareComponent`, only dynamic core import |
| R5 | Angular TSC clean | `tsc -p packages/angular/tsconfig.json --noEmit` | **PASS** — exit 0 |
| R6 | Core jsdom regression | `vitest run --config packages/core/vitest.config.ts` | **PASS** — 1071 passed \| 1 skipped (71 files) |
| R7 | Core SSR regression | `vitest run --config packages/core/vitest.ssr.config.ts` | **PASS** — 10 |
| R8 | Core TSC regression | `tsc -p packages/core/tsconfig.json --noEmit` | **PASS** — 44 pre-existing, none angular |
| R9 | ESLint | `eslint packages/angular/{src,tests}` | **PASS** — exit 0 |
| R10 | Traceability | `verify_traceability.py` | **PASS** — 129/129 reconcile |
| R11 | Lockfile in sync | `npm ci --dry-run` | **PASS** — consistent |

## 6. Dependency/lockfile change

- devDeps **added**: `@angular/compiler-cli@21.2.26`, `@angular/platform-browser@21.2.26`,
  `ng-packagr@21.2.7`; `typescript` `^5.6.2` → `^5.9.3` (ng-packagr 21 requires TS ≥5.9).
- runtime deps **added**: `tslib ^2.3.0` (Angular-linked library).
- peer `@angular/core` narrowed to `>=21.0.0 <22.0.0`.
- Lockfile: `@angular/compiler-cli` pins `@babel/core@7.29.7`, which resolved the
  `@babel/*` family up from 7.29.0-range to 7.29.7 (11 patch/minor nodes — all
  `@babel/*`, all transitive). **Verified runtime-irrelevant**: with the ORIGINAL
  `@babel/core@7.29.0` re-installed, the unrelated React contract suite fails
  **identically** (4 failed) — i.e. those failures are pre-existing at HEAD and not
  caused by the bump or by any S2-R change.
- npm regeneration pruned `lightningcss*`/`detect-libc` optional peers of `vite`
  again; **restored** (same correction as S1-R/S2). No other version drift.

## 7. Non-goals (explicitly NOT in S2-R)

No `@Output()` event bridge (S3), no `ControlValueAccessor` (S4), no SSR
rendering/hydration (S5), no core production change, no API-065/API-075 remediation,
no multi-version Angular matrix (peer narrowed instead).

## 8. Disclosed limitations

- **44 pre-existing `@smilodon/core` TSC errors remain** — unchanged; none reference
  angular; a pre-existing repo condition.
- **Peer range narrowed to `>=21 <22`.** The partial artifact is technically
  linkable by ≥14 (`minVersion 14.0.0`); only 21.2.26 is certified, so the advertised
  range matches the evidence. Widening requires multi-version CI.
- **Pre-existing failing suite (not a gate):** `npm run test:contracts`
  (React/Solid/Vue/Svelte adapter contracts) has 9 failures at HEAD `fff2c52`,
  **reproduced with the original `@babel` versions** — unrelated to S2-R and out of
  this increment's authorized scope.

---

_End of S2-R evidence. Production-qualified partial-compiled Angular library,
controlled-value clearing, generation-guarded async selection, and end-to-end AOT
consumer verification. No core change._
