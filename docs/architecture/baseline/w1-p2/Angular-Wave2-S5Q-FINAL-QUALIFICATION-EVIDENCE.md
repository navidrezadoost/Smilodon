# Angular Wave 2 — S5-Q Final Angular Qualification (Consolidated)

- **Artifact:** `Angular-Wave2-S5Q-FINAL-QUALIFICATION-EVIDENCE`
- **Increment:** Angular Wave 2 — Final Angular Qualification (publication-readiness)
- **Starting commit:** `74fc5fc` (`74fc5fce2d1bd5dae3a27c8b30676f451d8b2230`, F02-R accepted)
- **Accepted production baseline:** `2a9bd99`
- **Branch:** `codex/w1-p1-3-keyboard-characterization`
- **Type:** Qualification only — **no production source change, no core change, no selector redesign, no dependency changes.**
- **Published:** No (this increment does NOT publish)

## Headline

The Angular adapter is **QUALIFIED for publication with documented limitations**. In real **Chromium + Firefox**
it passes: standalone CSR render + pointer/keyboard interaction, S3 event forwarding (array-vs-scalar),
S4 forms (reactive / template / FormControlName) with **zero initial echo** and **exactly one change per edit**,
real focus transitions with **focus-loss touched (once)**, disabled/ programmatic reconciliation, deferred-init
durability, destroy/recreate safety, and **full-core import not reviving the host collision**. SSR/hydration is
proven by the SSR fixture (annotated + node reuse + zero mismatch diagnostics). WebKit is **environmentally
unavailable** on this host (coverage limitation, never an assumed pass).

## What changed (test-only)

Added `packages/angular/tests/csr/` — a standalone-Angular CSR fixture (AOT via ngc + esbuild bundle) and a
Playwright suite (`qualification.spec.ts`, 18 tests) covering Q-01, Q-04, Q-05, Q-06, Q-07, Q-08, Q-09, Q-10.
Modified **only** `packages/angular/vitest.config.ts` — added an `exclude` for `tests/csr/**` so the Playwright
suite is not collected by vitest (mirrors the existing `tests/ssr/**` exclusion). No production source touched.

> Design note: Angular 21 boots **zoneless**, so the fixture drives CD explicitly (`ChangeDetectorRef` /
> `ApplicationRef.tick`) after async host-state mutations; and it reads **authoritative live form state** via
> `window.__csrApi.live()` rather than a publish-time snapshot.

## Acceptance criteria

| Gate | Title | Verdict | Evidence |
|---|---|---|---|
| Q-01 | Standalone CSR consumer without SSR | PASS (chr+ff) | boot client-side, all widgets visible, no `<!--nghm-->`, exact initial models |
| Q-02 | Genuine SSR placeholder preserved | PASS (chr+ff) | SSR fixture F01: `ngh` + `<!--nghm-->`, 2 hosts w/ placeholders, no server combobox, core not evaluated |
| Q-03 | Hydration reuse, no mismatch | PASS (chr+ff) | serverNodesReused=true; "hydrated 4 component(s) and 9 node(s), 0 skipped"; no NG05xx |
| Q-04 | Chromium+Firefox pointer+keyboard | PASS (chr+ff) | real clicks + ArrowDown/Enter |
| Q-05 | Selection/clearing/event forwarding (S3) | PASS (chr+ff) | multi array, real clear control → `(clear)` + emptied; detail S3 shape |
| Q-06 | Reactive+template forms (S4) | PASS (chr+ff) | zero initial echo, one change/edit, ngModel, FormGroup array |
| Q-07 | Focus transitions + touched | PASS (chr+ff) | composed active = combobox; real focus-loss → touched once + `ng-touched` |
| Q-08 | Disabled + programmatic reconciled | PASS (chr+ff) | static disabled, setValue no echo, enable/disable reconciles `_config.enabled` |
| Q-09 | Deferred init + destruction | PASS (chr+ff) | late items render; destroy/recreate healthy; zero teardown errors |
| Q-10 | Full-core can't revive collision | PASS (chr+ff) | core defined; hosts `smilodon-angular-select`, no foreign shadow, visible/openable |
| Q-11 | Regression gates + traceability | PASS | see below |
| Q-12 | Publication-readiness matrix | PASS | `Angular-Wave2-S5Q-PUBLICATION-READINESS-MATRIX.{md,json}` |

## Gate results (Q-11)

| Gate | Command | Result |
|---|---|---|
| build:angular | `npm run build:angular` | PASS |
| CSR chromium | `--project=csr-chromium` | **18 passed** |
| CSR firefox | `--project=csr-firefox` | **18 passed** |
| CSR webkit | `--project=csr-webkit` | ENVIRONMENTAL-UNAVAILABLE (launch deps) |
| SSR chromium | `--project=ssr-hydration-chromium` | **10 passed** |
| SSR firefox | `--project=ssr-hydration-firefox` | **10 passed** |
| Angular unit | `vitest run --config packages/angular/vitest.config.ts` | **62 passed** |
| Angular SSR | `vitest run --config packages/angular/vitest.ssr.config.ts` | **4 passed** |
| AOT consumer | `node ./tests/consumer/run-consumer.mjs` | **PASSED** |
| Angular tsc | `tsc -p packages/angular/tsconfig.json --noEmit` | **0 errors** |
| eslint | `eslint packages/angular/src packages/angular/tests` | **0 errors** |
| Core unit | `vitest run --config packages/core/vitest.config.ts` | **1071 passed / 1 skipped** |
| Core SSR | `vitest run --config packages/core/vitest.ssr.config.ts` | **10 passed** |
| Core tsc | `tsc -p packages/core/tsconfig.json --noEmit` | **44 (pre-existing)** |
| Traceability | `python3 docs/.../w1-p1/verify_traceability.py` | **129/129 PASS** |

## Preserved limitations (see matrix)

- **L-01 WebKit** — unverified-environmental (missing libicu74/libxml2/libflite1). Not an app defect, not an assumed pass.
- **L-02 S4 async provenance** — conservative classification during server-backed fetch windows. **Preserved, NOT silently resolved.**
- **L-03 Multi init empty change** — core `updateConfig()→clear()` mitigation. Genuine core behavior; single selects unaffected; correctly classified programmatic.
- **L-04 Core tsc 44** — pre-existing, out of Angular scope (S6 NO-GO).
- **L-05 Developer-reported gates** — disclosed; traceability independently recomputed.

## Recommendation

**QUALIFIED FOR PUBLICATION — WITH DOCUMENTED LIMITATIONS.** No production/core source changed. Pending Lead
acceptance and an explicit publish decision (not performed here).
