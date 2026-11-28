# Angular Wave 2 — S5-P2 Post-Correction Publication Preflight (Read-only)

- **Artifact:** `Angular-Wave2-S5P2-PUBLICATION-PREFLIGHT`
- **Increment:** Angular Wave 2 — Post-Correction Publication Preflight (read-only; **NO** publish)
- **Starting commit:** `88000697faa8dc393e19441fa946e87803024a2a` (S5-P1 / S5-P1R / S5-P1R2 — FULLY ACCEPTED & CLOSED)
- **Branch:** `codex/w1-p1-3-keyboard-characterization`
- **Type:** Read-only release-candidate assessment — **no package metadata edit, no version bump, no runtime change, no registry mutation, no publish.**
- **Published:** No

## Headline — RELEASE DECISION: GO (conditional) — publication remains a separate explicit decision

The `@smilodon/angular` distributable **as built at `8800069` is fully consumable and correct**. A clean
`npm install` of the packed tarball resolves `@smilodon/angular` to the installed artifact, AOT-compiles a
real consumer component against the **installed** declarations (provenance-verified), boots and renders +
configures `<enhanced-select>`, and the peer set (`@smilodon/core@^1.13.0`) is satisfied by the **published**
registry core `1.22.0`. Package metadata, exports, declarations, and the Node.js engine range are correct.
All three accepted limitations (L-01, L-02, L-03) are disclosed in the consumer README.

**The package is publication-ready.** Two *non-blocking* record-only observations are noted (see §7). There
are **no release blockers** that originate in the package artifact. Actual `npm publish` remains a
**separate, explicitly-authorized decision** and was **not** performed.

## Method (all read-only)

1. `npm run build:angular` → ng-packagr partial-compile (PASS).
2. `npm pack` from the **package root**; extract + enumerate tarball contents; inspect the packed root manifest.
3. Install the packed tarball into a **clean** temp project (no symlink to `dist`) with the certified
   Angular 21.2.26 toolchain; confirm `@smilodon/angular` is the installed copy (not a symlink) and that the
   `@smilodon/core` peer resolves from the **registry**.
4. `import.meta.resolve` + runtime `import` against the installed tarball.
5. `ngc -p` AOT compile (full compilation) of a real consumer component **from inside** the clean consumer,
   plus `--traceResolution` to prove declarations resolve from the **installed** package and never repo `dist`.
6. Boot the AOT output via `TestBed` under jsdom; assert `<enhanced-select>` renders and is configured by core.
7. `npm view` registry state for `@smilodon/*`; `semver.satisfies` for peer compatibility.
8. Regression suite (packed-install hardened, angular unit/SSR/tsc/eslint, AOT consumer, core unit/SSR/tsc,
   traceability) re-run read-only.

## 1. Packed tarball resolves + compiles in a clean consumer — PASS

- Tarball: `smilodon-angular-1.13.0.tgz`, 63,592 bytes, SHA-256
  `cb1a0c5a410466cde691faef799eed7f8bfaed0b9dcc898599ceee59f92ee512`.
- Contents (6 files, only what is needed):
  `package/package.json`, `package/README.md`, `package/dist/README.md`,
  `package/dist/fesm2022/smilodon-angular.mjs`(+`.map`), `package/dist/types/smilodon-angular.d.ts`.
- Clean-install (`npm install <tarball> @angular/core@21.2.26 …`): **EXIT 0**; `@smilodon/angular` installed
  **1.13.0** (not a symlink); `@smilodon/core` installed from registry **1.22.0**.
- `import.meta.resolve('@smilodon/angular')` →
  `…/consumer/node_modules/@smilodon/angular/dist/fesm2022/smilodon-angular.mjs` (points at the **installed**
  tarball).
- Runtime `import` under plain Node throws the **known** Angular JIT-unavailable diagnostic (expected without
  a linker/browser); the authoritative success proof is the AOT compile + boot below.
- **AOT compile (full mode): EXIT 0, no diagnostics**; emits `.aot-out/consumer-app.component.js`.
- `ngc --traceResolution`: resolved from **installed** `node_modules/@smilodon/angular` = **true**;
  references installed `.d.ts` = **true**; references repo `/packages/angular/dist` = **false**.
- Boot under jsdom: `<enhanced-select>` rendered + configured by core = **OK** (EXIT 0).

## 2. Metadata / exports / declarations / Node versions — PASS

| Item | Value | Verdict |
|---|---|---|
| `name` / `version` | `@smilodon/angular` / `1.13.0` | OK |
| `type` | `module` (ESM-only) | OK |
| `module` | `./dist/fesm2022/smilodon-angular.mjs` | OK (exists in tarball) |
| `types` | `./dist/types/smilodon-angular.d.ts` | OK (exists in tarball) |
| `exports["."]` | `types` + `import` + `default` → existing paths; **no** `require` (ESM-only) | OK |
| `exports["./package.json"]` | `./package.json` | OK |
| Flattened declarations | 636 lines; exports `SmilodonSelectComponent`, `SMILODON_ANGULAR_ADAPTER`, `SMILODON_SELECT_EVENT_NAMES`, `ENHANCED_SELECT_TAG`, `ensureEnhancedSelectDefined`, `isBrowserEnvironment`, plus type-only re-exports from `@smilodon/core` | OK |
| Peer deps | `@angular/core`, `@angular/forms` `>=21.0.0 <22.0.0` (non-optional); `@smilodon/core ^1.13.0` | OK |
| Runtime dep | `tslib ^2.3.0` | OK |
| `engines.node` | `^20.19.0 \|\| ^22.12.0 \|\| ^24.0.0` | OK — matches Angular 21; current host `v24.13.1` satisfies |
| `sideEffects` / `publishConfig.access` / `license` | `false` / `public` @ registry.npmjs.org / `MIT` | OK |

> Engine-range observation (non-blocking): Angular 21.2.26 declares `^20.19.0 || ^22.12.0 || >=24.0.0`
> (open-ended `>=24`), whereas the adapter caps at `^24.0.0` (`<25`). The adapter is therefore **stricter**
> at the upper bound — a deliberate, safe narrowing. This only means a future Angular-supported Node 25+
> consumer would need this range widened (requires re-qualification); it is **not** a blocker for the
> current Angular 21 release.

## 3. Release version — `1.13.0` evaluated — ACCEPTABLE for first public Angular release

- `@smilodon/angular` is **not yet published** (npm 404) → this is the **first** public Angular release.
- Adapter versions in the family are **independent of core** and do **not** track it:
  core `1.21.0` (repo) / `1.22.0` (registry); vanilla/vue/solid `1.12.0`; svelte `2.2.0`; react `1.13.0`.
- `@smilodon/angular@1.13.0` **matches the repo's committed version** and is consistent with the family's
  non-aligned versioning model (adapters carried their own lines; e.g. react is `1.13.0`, svelte `2.2.0`).
- **Verdict:** `1.13.0` is **acceptable** as the first public Angular release version — it is a valid
  semver initial public version, an unused number on the registry, and internally consistent with the
  monorepo. **Version alignment with core (e.g. bumping to a core-tracking number) is NOT required** and
  would be a separate explicit decision. **No version bump is made here.**

## 4. npm registry state + `@smilodon/core` peer compatibility — PASS

| Package | Registry | Notes |
|---|---|---|
| `@smilodon/core` | **1.22.0** (`dist-tags.latest = 1.22.0`) | peer `^1.13.0` ⇒ `>=1.13.0 <2.0.0`; **satisfies 1.22.0** (`semver.satisfies=true`) |
| `@smilodon/angular` | **404 Not Found** | confirms first public release; no squatting/collision |
| `@smilodon/vanilla` | 1.12.0 | sibling pattern |
| `@smilodon/vue` | 1.12.0 | sibling pattern |
| `@smilodon/svelte` | 2.2.0 | sibling pattern |
| `@smilodon/solid` | 1.12.0 | sibling pattern |
| `@smilodon/react` | 1.14.0 | sibling pattern |
| `@smilodon/react-native` | 1.10.0 | sibling pattern |

- Peer `@smilodon/core ^1.13.0` is satisfied by **both** repo `1.21.0` and registry `1.22.0`. Consumers
  installing `@smilodon/angular` will resolve a compatible published core. **No resolution conflict.**
- Note (non-blocking): the adapter was qualified against repo core `1.21.0`; the registry latest is
  `1.22.0`. Peer range `^1.13.0` accepts `1.22.0`. A pre-publish cross-version smoke against `1.22.0`
  is advisement (see §7) but is not a blocker (same major, additive minor).

## 5. Consumer documentation includes accepted limitations — PASS

`packages/angular/README.md` (345 lines) includes a **Known limitations** section documenting:
- **L-01** — Browser coverage (WebKit unverified on the release host; Chromium + Firefox certified).
- **L-02** — Async provenance (user edit racing an in-flight server-backed fetch conservatively not echoed).
- **L-03** — Initial empty `change` on a multi-select (core behavior; classified programmatic by adapter).
- Plus: ESM-only entry points, generated `dist/` layout, **Supported Angular versions** (`>=21.0.0 <22.0.0`),
  and the `engines.node` range are all documented.

## 6. Regression suite — all green (read-only re-run at `8800069`)

| Gate | Result |
|---|---|
| packed-install (hardened, S5-P1R2) | **PASSED** (resolution provenance + negative control + repeat-pack) |
| AOT consumer (existing) | **PASSED** |
| Angular unit | **62 passed** |
| Angular SSR | **4 passed** |
| Angular tsc | **0 errors** |
| eslint (angular) | **0 errors** |
| Core unit | **1071 passed / 1 skipped** |
| Core SSR | **10 passed** |
| Core tsc | **44 (pre-existing, unchanged — L-04)** |
| Traceability | **129/129 PASS** |

## 7. Record-only observations (non-blocking; NOT edited per read-only directive)

1. **Stale README status banner.** `packages/angular/README.md` opens with `> **Status: S4 (Wave 2).** … The
   remaining slice is SSR rendering/hydration qualification (S5).` S5 is now complete and accepted, so this
   banner is **documentation drift**. It does **not** affect the artifact or installability. Recommended as a
   tiny docs-only follow-up (outside this read-only preflight); not a release blocker.
2. **No `LICENSE` file inside `packages/angular/`.** The repo root has `LICENSE`, but `files: ["dist",
   "README.md"]` means the tarball ships the SPDX `"license": "MIT"` field **without** a bundled LICENSE file.
   This is common and non-blocking (the field is present and correct); bundling a LICENSE into the package is
   an optional polish item, not a blocker.

## 8. Publication-readiness decision

- **Package artifact:** READY. Consumable, correct metadata/exports/declarations, compatible peers, disclosed
  limitations, robust regression evidence (including the S5-P1R2-hardened packed-install gate).
- **Blockers originating in the package:** **NONE.**
- **Non-blocking follow-ups:** (a) refresh the stale README status banner; (b) optional LICENSE-in-package
  polish; (c) advisement: a one-off cross-version smoke against registry core `1.22.0` before publish.

## Recommendation

**GO — release candidate passes the post-correction publication preflight.** The corrected `@smilodon/angular`
package at `8800069` is a valid, consumable, correctly-metadata'd release candidate; `1.13.0` is acceptable
for the first public Angular release. **Actual publication remains a separate, explicitly-authorized
decision** (NO-GO until that authorization) and was **not** performed. No package metadata, version, runtime,
or registry state was modified in this preflight.
