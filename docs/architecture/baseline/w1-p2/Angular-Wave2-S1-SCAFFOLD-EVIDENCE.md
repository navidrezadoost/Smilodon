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
| A10 | No unintended manifest/lock changes | `git status package-lock.json` | **PASS** — untouched |
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

_End of S1 evidence. Scaffold + public type surface only. No Angular behavior, no core change, no SSR remediation. Ready for S2 (browser-deferred standalone component) upon separate authorization._
