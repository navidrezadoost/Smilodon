# Angular Wave 2 — S5-P0 Publication Preflight (Read-only)

- **Artifact:** `Angular-Wave2-S5P0-PUBLICATION-PREFLIGHT`
- **Increment:** Angular Wave 2 — Publication Preflight (read-only; **NO** publish)
- **Starting commit:** `8ba05ada2d22ffb9f4bbc1edd4c3641192256878` (S5-Q accepted/closed)
- **Branch:** `codex/w1-p1-3-keyboard-characterization`
- **Type:** Read-only prepublication assessment — **no production source change, no registry action.**
- **Published:** No

## Headline — RELEASE DECISION: NO-GO

The `@smilodon/angular` distributable **as currently built cannot be consumed**: a clean
`npm install` of the packed tarball yields a package with **no entry points**, and
`require.resolve('@smilodon/angular')` fails with `MODULE_NOT_FOUND`. This is a release-blocking
packaging defect (P0-01/P0-02). A second blocking finding is the P01 Node.js engine-metadata mismatch
(P0-03). Two additional items (P0-06 partial disclosure) require documentation corrections.

**No package may be published until P0-01, P0-02, P0-03 (and P0-06) are remediated in a separate,
explicitly-authorized correction increment.** S5-P0 does NOT modify production metadata (per directive).

## Method

All checks performed read-only against a freshly built `dist/`:

1. `npm run build:angular` → ng-packagr partial-compile (PASS).
2. Inspect `packages/angular/dist/package.json` and `packages/angular/package.json`.
3. `npm pack` from the **package root**; extract tarball; enumerate contents.
4. Install the packed tarball into a **clean** temp project; `require.resolve`.
5. Compare entry-point pattern against every other `@smilodon/*` sibling.
6. `npm view` for `@smilodon/core` and `@smilodon/angular` registry state.
7. `semver.satisfies` for peer-range compatibility.

## Acceptance criteria results

| ID | Requirement | Verdict | Finding |
|---|---|---|---|
| P0-01 | Built npm package contains all required runtime + declaration files | **FAIL** | Tarball's root `package.json` has **no** `main`/`module`/`types`/`exports`; the generated `dist/package.json` (which has them) is **excluded** by `dist/.npmignore` (`**/package.json`). FESM + `.d.ts` are physically present in the tarball but **unreachable** without entry points. |
| P0-02 | Export paths resolve from the packed distribution | **FAIL** | Clean install → `require.resolve('@smilodon/angular')` = `MODULE_NOT_FOUND`. The AOT consumer test masks this by symlinking `tests/consumer/node_modules → dist` (points at `dist/`, bypassing the broken root manifest). |
| P0-03 | Angular peer and Node.js engine ranges accurately represent supported configs | **FAIL (P01)** | Angular peer `>=21.0.0 <22.0.0` is correct, but `engines.node` = `>=18` advertises unsupported Node. Angular 21 requires `^20.19.0 \|\| ^22.12.0 \|\| ^24.0.0`. |
| P0-04 | `@smilodon/core` version availability and compatibility confirmed | **PASS** | Registry has `@smilodon/core@1.22.0`; local `v1.21.0`. Peer `^1.13.0` (=> `>=1.13.0 <2.0.0`) satisfies both `1.21.0` and `1.22.0` (`semver.satisfies` = true). |
| P0-05 | `smilodon-angular-select` documented as the public selector | **PASS** | Component selector `smilodon-angular-select` (`select.component.ts:112`); documented in README usage examples (lines 31-39, 149-156). |
| P0-06 | L-01, L-02, L-03 limitations visible to consumers | **PARTIAL** | **L-02** (async provenance) documented (README lines 168-184, "Disclosed limitation"). **L-01 (WebKit unverified)** and **L-03 (initial empty multi-select change)** are **absent** from the consumer README. |
| P0-07 | Release version and registry destination identified | **PASS** | `@smilodon/angular@1.13.0`, `publishConfig.registry = https://registry.npmjs.org/`, `access: public`. `@smilodon/angular` returns 404 on the registry → this is a **first public release**. Note: version `1.13.0` is out-of-step with the family (core `1.22.0`, siblings `1.12.0`) — confirm intended version at the release decision. |
| P0-08 | Final GO/NO-GO record produced without publishing | **PASS** | This document + JSON. **NO-GO.** No registry action taken. |

## Root-cause analysis — P0-01 / P0-02 (release-blocking)

`packages/angular` is built by **ng-packagr**, which emits a *complete* manifest at
`dist/package.json` (with `module`, `typings`, `exports`) and places all code under `dist/`.
The source `packages/angular/package.json` declares only `files: ["dist", "README.md"]` and **no
entry-point fields**.

On publish from the package root:
- npm **always** includes the root `package.json` (the *source* one — no entry points),
- the generated `dist/package.json` is **excluded** by `dist/.npmignore` (`**/package.json`),
- therefore the published manifest has **no** `main`/`module`/`types`/`exports`,
- and the physically-present `dist/fesm2022/*.mjs` + `dist/types/*.d.ts` are **unreachable**.

Every other `@smilodon/*` package avoids this by declaring entry points in the **source**
`package.json` pointing into `./dist/...` and NOT relying on a nested manifest:

| Package | source `main`/`module`/`types`/`exports` | nested `dist/package.json`? |
|---|---|---|
| core | `./dist/index.cjs` / `./dist/index.js` / `./dist/types/src/index.d.ts` / yes | no |
| vanilla | `./dist/index.cjs` / `./dist/index.mjs` / `./dist/types/index.d.ts` / yes | no |
| vue | `./dist/index.cjs` / `./dist/index.js` / `./dist/types/index.d.ts` / yes | no |
| svelte | `./dist/index.cjs` / `./dist/index.mjs` / `./dist/types/index.d.ts` / yes | no |
| solid | (entry points present) | no |
| react-native | (entry points present) | no |
| **angular** | **NONE** | **yes (excluded on publish)** |

`@smilodon/angular` is the sole outlier. The AOT consumer test (`tests/consumer/run-consumer.mjs`)
hides the defect because it symlinks `tests/consumer/node_modules/@smilodon/angular → dist`, so it
imports `dist/package.json` directly, never exercising real package resolution.

### Recommended remediation (for a separate, authorized correction increment — NOT done here)

Two valid options; option A matches the sibling convention:

- **Option A (preferred, consistency):** add `main`, `module`, `typings`/`types`, and `exports` to the
  **source** `packages/angular/package.json` pointing into `./dist/...`
  (`./dist/fesm2022/smilodon-angular.mjs`, `./dist/types/smilodon-angular.d.ts`), and re-run
  `npm pack` to confirm `require.resolve` succeeds in a clean install. Also update the consumer test
  to resolve via a real packed install (not a dist symlink) so this cannot regress silently.
- **Option B (ng-packagr-idiomatic):** set `"publishConfig": { "directory": "dist" }` and publish via
  the workspace (`npm publish -w @smilodon/angular`), so `dist/package.json` becomes the published
  manifest. Verify `files` is adjusted so `dist/` is not double-nested.

Either way, add a **packed-install smoke gate** to CI that runs `require.resolve` (or `import`)
against the tarball.

## P0-03 (P01) — engine range remediation (NOT done here)

Change `packages/angular/package.json` `engines.node` from `>=18` to the Angular 21 matrix
`"^20.19.0 || ^22.12.0 || ^24.0.0"` (and consider aligning `engines.npm`). This is a production
metadata edit and is therefore **deferred** to the authorized correction increment. (S5-P0 starting
commit already surfaced this as P01 in the S5-Q review.)

## P0-06 — documentation remediation (NOT done here)

Add to the **consumer-facing** `packages/angular/README.md` a "Known limitations" section covering:
- **L-01** WebKit not verified on the release build host (Chromium + Firefox qualified only).
- **L-02** (already present; keep) async provenance / pending-fetch suppression.
- **L-03** initial empty `change` emitted on multi-select init (core `updateConfig()→clear()`).

## Preserved limitations (from S5-Q, still in force)

- **L-01 WebKit** — coverage gap, not certified.
- **L-02 Async provenance** — accepted known limitation; genuine edits during pending fetches may be suppressed.
- **L-03 Multi init empty change** — documented behavior.
- **L-04 Core tsc 44** — separate scope (S6 NO-GO).
- **L-05 Developer-reported execution** — disclosure retained.

## Not done here

No `npm publish` · no production source change · no package.json edit · no registry action ·
no selector redesign · no unrelated dependency changes.

## Recommendation

**NO-GO for publication.** Resolve P0-01/P0-02 (packaging entry points), P0-03 (engine range =
P01), and P0-06 (L-01/L-03 consumer disclosure) in a separate bounded, explicitly-authorized
correction increment, then re-run S5-P0 preflight. Publication remains a distinct, explicitly-gated
decision.
