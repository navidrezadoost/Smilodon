# Angular Wave 2 — S1 Package Scaffold: Evidence

**Increment:** Angular Wave 2 — **S1 (package scaffold only)**
**Starting commit:** `8cf634d96c48e120014398efb78d79edfd748689` (W1-P2 Task 2 closed)
**Branch:** `codex/w1-p1-3-keyboard-characterization`
**Authorized scope (Lead directive):** S1 scaffold only. Package manifest, TypeScript config, build entry point, public export surface, minimum reproducible build. `@smilodon/core` as existing dependency contract (peer), no second runtime copy. **No** standalone wrapper, ControlValueAccessor, event bridge, demo, or SSR production remediation.

---

## 0. What S1 delivers

A minimal, reproducible `packages/angular` workspace scaffold consistent with the existing monorepo per-framework package conventions (modeled on the thinnest adapter, `@smilodon/vanilla`):

```
packages/angular/
  package.json            # manifest: @smilodon/angular, peer @smilodon/core + @angular/core, build scripts
  tsconfig.json           # extends root; declaration emit to dist/types
  vite.config.ts          # lib build (ESM+CJS), external @smilodon/core + @angular/core
  scripts/cleanup-types.js# flatten tsc declarations to dist/types/index.d.ts (vanilla-style)
  src/index.ts            # PUBLIC EXPORT SURFACE — type-only core re-exports + adapter-owned exports
  src/types.ts            # adapter-owned types + frozen descriptor (no core/Angular runtime import)
  README.md               # scope + import-safety discipline
```

Root wiring: `package.json` adds `build:angular`; `tsconfig.json` adds the `@smilodon/angular` path mapping. (Root `build` uses `--workspaces --if-present`, so the package is picked up automatically.)

---

## 1. Public export surface

`src/index.ts` exposes, as the intended **type entry points** for S2+:

**Type-only re-exports from `@smilodon/core`** (erased at build → no runtime core import):
`GroupedItem`, `SelectEventDetail`, `ChangeEventDetail`, `SearchEventDetail`, `LoadMoreEventDetail`, `ClearEventDetail`, `OpenEventDetail`, `CloseEventDetail`, `RemoveEventDetail`, `DiagnosticEventDetail`, `EmptyStateContext`, `SelectInstanceConfig`.

**Adapter-owned exports** (dependency-free):
`SmilodonSelectItem` (item type), `SmilodonAngularAdapterInfo` (descriptor type), `SMILODON_ANGULAR_ADAPTER` (frozen constant).

No Angular component/directive/CVA/event bridge exists in S1 — by design.

---

## 2. Import-safety discipline (enforced from S1)

Every `@smilodon/core` re-export is **type-only** (`export type`). Type imports are erased at build, so the emitted runtime chunk contains **no** `require`/`import` of `@smilodon/core`. This is the property that lets S2 add **browser-deferred dynamic `import('@smilodon/core')`** without a static top-level value import re-introducing the API-075 no-DOM import throw.

**Rule:** no value import of `@smilodon/core` may be added to S1 sources (documented in `src/index.ts` and `README.md`).

---

## 3. Acceptance gates

| # | S1 acceptance criterion | Command | Result |
| --- | --- | --- | --- |
| A1 | Package builds successfully (reproducible, from clean) | `rm -rf dist && npm run build:angular` | **PASS** — vite ES+CJS + declarations |
| A2 | Exposes intended type entry points | inspect `dist/types/index.d.ts` + `types.d.ts` | **PASS** — all listed types present |
| A3 | Avoids unintended runtime imports of core | `grep @smilodon/core dist/index.js dist/index.cjs` | **PASS** — no match (CLEAN) |
| A4 | No `@angular/*` runtime import in S1 | `grep @angular src/` | **PASS** — only a doc comment, no code import |
| A5 | Angular package `tsc` clean | `tsc -p packages/angular/tsconfig.json --noEmit` | **PASS** — exit 0, 0 errors |
| A6 | Core TSC regression unchanged | `tsc -p packages/core/tsconfig.json --noEmit \| wc` | **PASS** — 44 pre-existing errors (unchanged; none reference angular) |
| A7 | Core automated regression unchanged | `vitest run --config packages/core/vitest.config.ts` | **PASS** — 1071 passed \| 1 skipped (71 files) |
| A8 | ESLint clean on new sources | `eslint packages/angular/src …` | **PASS** — exit 0 |
| A9 | Traceability unchanged | `python3 …/verify_traceability.py` | **PASS** — 129 IDs reconcile |
| A10 | No unintended manifest/lock changes | `git status package-lock.json` | **PASS at S1 commit (`b972cd7`)** — untouched; **CORRECTED in S1-R** (see §7: the lockfile *required* the angular workspace record that S1 omitted; S1-F01) |
| A11 | Build output not committed | `git check-ignore packages/angular/dist` | **PASS** — dist ignored |

### Build artifacts (not committed; dist gitignored)
- `dist/index.js` (ESM, 0.28 kB) — contains only `SMILODON_ANGULAR_ADAPTER`; no core import.
- `dist/index.cjs` (CJS, 0.39 kB) — same; no core import.
- `dist/types/index.d.ts`, `dist/types/types.d.ts` — flat declaration layout.

---

## 4. Peer-dependency contract

| Peer | Range | Rationale |
| --- | --- | --- |
| `@smilodon/core` | `^1.13.0` | matches other adapters; single runtime copy; externalized |
| `@angular/core` | `>=16.0.0` | standalone components (S2); not used at runtime in S1 |

`@smilodon/core` is **externalized** in `vite.config.ts` (plus `@angular/core`), so no second copy of core is bundled. Build tooling (`vite`, `typescript`) is devDependency only, matching `@smilodon/vanilla`.

---

## 5. Non-goals (explicitly NOT in S1)

Per directive: no standalone wrapper implementation, no ControlValueAccessor, no event bridge, no application demo, no SSR production remediation, no core changes. No `@angular/*` runtime dependency installed or required for the S1 build.

---

## 6. Disclosed limitation

The repository's **44 pre-existing `@smilodon/core` TypeScript errors remain**. They are unchanged by S1 and none reference the angular package; they are a pre-existing repo condition, not attributable to S1.

---

## 7. S1-R correction — lockfile workspace metadata (S1-F01)

**Authorization:** Lead directive "GO — lockfile correction only." Scope: correct the lockfile metadata omitted from the S1 commit; no API-surface, no core-production, no prior-test, no package-architecture change.

### Finding (S1-F01, Medium — build reproducibility)
Root `workspaces: ["packages/*", "playground"]` makes `packages/angular` a workspace member, but the committed `package-lock.json` at `b972cd7` had **no** `packages/angular` record and **no** `node_modules/@smilodon/angular` link. A fresh `npm ci` from clean therefore could not reproduce the workspace (`npm query .workspace` listed 8 members, omitting `@smilodon/angular`; `npm ci --dry-run` failed with `Missing: @angular/core@21.2.26 from lock file`).

### Correction
`package-lock.json` now contains **only** the records required for the angular workspace, with **no unrelated dependency changes**:

| Added / changed | Why |
| --- | --- |
| `node_modules/@smilodon/angular` (`link:true → packages/angular`) | workspace link |
| `packages/angular` record (`@smilodon/angular@1.13.0`, devDeps `typescript`/`vite`, engines, peerDeps + meta) | workspace manifest record |
| `node_modules/@angular/core@21.2.26` (`peer:true`) | concrete resolution for the `@angular/core >=16` **non-optional** peer; npm pins it even though it is never installed as a devDep |
| `rxjs` / `tslib`: removed `"dev": true` | `@angular/core` depends on them at runtime; they must be non-dev so they install for production |

**Preservation guarantees (verified by diffing every package's `version`+`resolved` against `b972cd7`):**
- **ADDED:** exactly 3 angular nodes.
- **REMOVED:** none — the earlier broad `npm install` regeneration pruned `lightningcss*`/`detect-libc` (optional peers of `vite`); those nodes are **restored** so nothing from the S1 commit is dropped.
- **VERSION/RESOLVED CHANGED:** none (zero dependency-version changes; no broad upgrade).
- **Only non-version delta:** `rxjs`/`tslib` `dev` flag (required for the angular peer, above).

Net diff: **52 insertions, 2 deletions.**

### S1-R verification gates

| Gate | Command | Result |
| --- | --- | --- |
| R1 clean-install reproducibility | `npm ci` in pristine copy of `b972cd7` + corrected lock | **PASS** — exit 0, 744 packages; `@smilodon/angular` symlinked; `@angular/core@21.2.26` installed; `rxjs 7.8.2`/`tslib 2.8.1` resolvable |
| R2 lockfile validity | `python3 -c "json.load(...)"` | **PASS** |
| R3 no version drift | full package `version`+`resolved` diff vs `b972cd7` | **PASS** — none |
| R4 build from clean | `npm run build -w @smilodon/angular` in clean copy | **PASS** — vite ES+CJS + declarations |
| R5 no eager core runtime import | `grep @smilodon/core dist/index.js dist/index.cjs` | **PASS** — no match (ESM/CJS contain only `SMILODON_ANGULAR_ADAPTER`) |
| R6 Angular TSC | `tsc -p packages/angular/tsconfig.json --noEmit` | **PASS** — exit 0 |
| R7 Core TSC regression | `tsc -p packages/core/tsconfig.json --noEmit` | **PASS** — 44 pre-existing, none angular |
| R8 Core jsdom regression | `vitest run --config packages/core/vitest.config.ts` | **PASS** — 1071 passed \| 1 skipped (71 files) |
| R9 ESLint | `eslint packages/angular/src packages/angular/scripts packages/angular/vite.config.ts` | **PASS** — exit 0 |
| R10 Traceability | `verify_traceability.py` | **PASS** — 129 IDs reconcile |

### Non-goals honored in S1-R
No change to Angular API surface, `src/` sources, root `package.json`/`tsconfig.json` (already committed at `b972cd7`), core production code, or prior tests. The S1 commit's workspace scaffold artifacts are unchanged; only the lockfile metadata was corrected.

**Effect on A10:** the S1 conclusion "lock untouched" is superseded for reproducibility reasons — the lock *must* carry the angular workspace record. The S1-F01 condition is resolved.

---

_End of S1 evidence (including S1-R correction). Scaffold + public type surface only. No Angular behavior, no core change, no SSR remediation. Ready for S2 (browser-deferred standalone component) upon separate authorization._
