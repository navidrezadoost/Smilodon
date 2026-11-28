# Angular Wave 2 — S5-P1 Packaging & Metadata Correction

- **Artifact:** `Angular-Wave2-S5P1-PACKAGING-CORRECTION`
- **Increment:** Angular Wave 2 — S5-P1 Packaging and Publication-Metadata Correction (Option A)
- **Starting commit:** `8f22492b021a0a1893ce1ae6cd3a06dde2df8952` (S5-P0 accepted/closed, NO-GO release)
- **Branch:** `codex/w1-p1-3-keyboard-characterization`
- **Type:** Bounded correction — package metadata + consumer docs + packed-install regression test only.
- **Published:** No (publication remains a separate, explicitly-gated decision)

## Headline

The S5-P0 release-blocking packaging defect is **fixed**. The published tarball now carries valid
**ESM-only** entry points (`exports` + `module` + `types`) in its root manifest, every exported path
resolves inside the tarball, a clean `npm install` resolves and imports `@smilodon/angular`, and a real
**AOT consumer** compiles and runs **against the installed tarball** (no `dist` symlink). The Node.js
engine range is corrected to Angular 21's supported matrix, and the consumer README now discloses
**L-01, L-02, and L-03**.

A new **packed-install regression test** closes the S4 test blind spot (which had masked the defect by
symlinking `node_modules/@smilodon/angular → dist`). The test was **proven to fail** when entry points
are removed (see Validation of the guard), so it guards against regression.

## What changed

| File | Change | Authorized area |
|---|---|---|
| `packages/angular/package.json` | Added `module`, `types`, `exports` (ESM-only, `./dist/...` paths); fixed `engines.node` → `^20.19.0 \|\| ^22.12.0 \|\| ^24.0.0`; added `test:packed-install` script | Source `package.json` exports · engines · (test wiring) |
| `packages/angular/README.md` | New **Known limitations** section (L-01/L-02/L-03); documented ESM-only entry points + Node engine range | Consumer README disclosures |
| `packages/angular/tests/packed-install/run-packed-install.mjs` | New packed-install regression runner (build→pack→install→resolve+import+AOT) | Packed-install regression tests |
| `packages/angular/tests/packed-install/.gitignore` | Ignores stray temp artifacts | (support) |

**No** Angular runtime/component implementation change. **No** core source change. **No** package version
change (stays `1.13.0`). **No** registry action.

> ng-packagr note: because the source manifest now declares `exports`, ng-packagr prints benign
> "conflicting export condition … would be overridden by ng-packagr" **warnings** while writing the
> *generated* `dist/package.json`. That generated manifest is **excluded from the published tarball**
> (`dist/.npmignore` = `**/package.json`); the **published** root manifest is the source one and carries
> the correct `./dist/...` entry points. The warnings do not affect the artifact (verified: build exits 0,
> tarball resolves + imports + serves an AOT consumer).

## Root cause (fixed)

ng-packagr writes a complete manifest to `dist/package.json`, but the **source** package.json had no
`main`/`module`/`types`/`exports`. Publishing from the package root included the source manifest (no
entry points) and excluded the generated one (via `dist/.npmignore`), so the published package had **no
usable entry points** and `require.resolve`/`import` failed.

**Fix (Option A):** declare the entry points in the **source** package.json pointing into `./dist/...`,
matching the convention used by every other `@smilodon/*` package (core/vanilla/vue/svelte/solid all put
entry points in their source manifest). ESM-only — no `main`/`require` advertising a nonexistent CJS
bundle.

## Validation of the guard (test fails for the right reason)

The packed-install test was run with entry points deliberately removed from the manifest (simulating the
S5-P0 defect) and **correctly FAILED (exit 1)**:

```
✖ packed root manifest declares `exports`
✖ packed root manifest declares `module`
✖ packed root manifest declares `types`
✖ installed manifest has `module`/`types`/`.` export
import.meta.resolve FAILED: ERR_MODULE_NOT_FOUND ...
require.resolve FAILED: MODULE_NOT_FOUND Cannot find module '@smilodon/angular'
```

With the fix restored it **PASSES (exit 0)**. This satisfies the directive: "The test must fail when the
packed package loses its entry points, not merely when the original build fails."

## Acceptance criteria results

| ID | Requirement | Verdict | Evidence |
|---|---|---|---|
| P1-01 | Packed root manifest has valid runtime and type entry points | PASS | packed-install: root manifest declares `exports`/`module`/`types`; no `main`; `.` export has no `require` |
| P1-02 | Every exported path exists in the packed tarball | PASS | packed-install: each `./dist/...` export target EXISTS; FESM + `.d.ts` shipped |
| P1-03 | Clean-install ESM resolution and import succeed under a supported env | PASS | clean `npm install` → `import.meta.resolve` + `require.resolve` → `dist/fesm2022/smilodon-angular.mjs`; `import` resolves |
| P1-04 | AOT consumer compiles against the installed tarball | PASS | ngc full-compile against installed tarball; TestBed boots; `<enhanced-select>` rendered + configured |
| P1-05 | Source and packed metadata agree | PASS | packed-install: `module`/`types`/`exports`/`engines` agree byte-for-byte |
| P1-06 | Node.js engine range matches Angular 21 | PASS | `engines.node = ^20.19.0 \|\| ^22.12.0 \|\| ^24.0.0`; peer range unchanged |
| P1-07 | L-01, L-02, L-03 appear in consumer documentation | PASS | README "Known limitations" (L-01 WebKit, L-02 async provenance, L-03 multi init change) |
| P1-08 | No Angular/core runtime behavior changes | PASS | only `package.json`, `README.md`, `tests/packed-install/*` changed; no `src/`/core `.ts` |
| P1-09 | Existing regression and traceability gates remain unchanged or pass | PASS | see Gate results |
| P1-10 | Repeated `npm pack` yields a usable artifact without the dist symlink workaround | PASS | packed-install: 2nd `npm pack` still carries entry points; consumer installs the tarball (not a symlink) |

## Gate results (P1-09)

| Gate | Command | Result |
|---|---|---|
| build:angular | `ng-packagr -p ng-package.json` | PASS (warnings benign, see note) |
| **packed-install** | `node tests/packed-install/run-packed-install.mjs` | **PASSED** (P1-01..P1-05, P1-10) |
| AOT consumer (existing) | `npm run test:consumer` | **PASSED** |
| Angular unit | `vitest run --config packages/angular/vitest.config.ts` | **62 passed** |
| Angular SSR | `vitest run --config packages/angular/vitest.ssr.config.ts` | **4 passed** |
| Angular tsc | `tsc -p packages/angular/tsconfig.json --noEmit` | **0 errors** |
| eslint | `eslint packages/angular/src packages/angular/tests` | **0 errors** |
| Core unit | `vitest run --config packages/core/vitest.config.ts` | **1071 passed / 1 skipped** |
| Core SSR | `vitest run --config packages/core/vitest.ssr.config.ts` | **10 passed** |
| Core tsc | `tsc -p packages/core/tsconfig.json --noEmit` | **44 (pre-existing, unchanged)** |
| Traceability | `verify_traceability.py` | **129/129 PASS** |

## Scope guardrails honoured

- Option A only (publish from package root, source-manifest entry points into `dist/`).
- ESM-only; no CommonJS `main`/`require` advertised (the ng-packagr output has no CJS bundle).
- Angular runtime/component implementation: **untouched** (NO-GO, respected).
- Core source: **untouched** (NO-GO, respected).
- Package version: **unchanged** (`1.13.0`) — version alignment is a separate explicit decision.
- npm publication: **not performed** (NO-GO).

## Preserved limitations (disclosure unchanged in intent; L-01/L-03 now consumer-visible)

- **L-01 WebKit** — unverified on the build host (missing libicu74/libxml2/libflite1); now disclosed in README.
- **L-02 Async provenance** — accepted known limitation; disclosed in README (and Provenance section).
- **L-03 Multi init empty change** — core behavior, adapted as programmatic; now disclosed in README.
- **L-04 Core tsc 44** — separate scope (S6 NO-GO).
- **L-05 Developer-reported gates** — disclosure retained.

## Recommendation

The packaging defect (P0-01/P0-02), engine mismatch (P0-03 = P01), and consumer-disclosure gap (P0-06) from
S5-P0 are **remediated** within the authorized scope. The distributable now resolves, imports, and serves a
real AOT consumer. Package version and final registry/publication remain **explicitly-gated decisions** not
made here.

**Ready for independent acceptance of S5-P1.** Post-correction publication preflight remains PENDING.
