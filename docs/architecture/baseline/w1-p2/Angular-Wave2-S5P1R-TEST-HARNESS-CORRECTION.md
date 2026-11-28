# Angular Wave 2 — S5-P1R Test-Harness Correction

- **Artifact:** `Angular-Wave2-S5P1R-TEST-HARNESS-CORRECTION`
- **Increment:** Angular Wave 2 — S5-P1R Packed-Install Test-Harness Correction
- **Starting commit:** `d65c4d80cbee32de61e519b7399261a864b135f9` (S5-P1 packaging correction accepted)
- **Branch:** `codex/w1-p1-3-keyboard-characterization`
- **Type:** Bounded test-only correction — hardens the S5-P1 packed-install regression test.
- **Published:** No.

## Headline

The Lead's review of S5-P1 (`d65c4d8`) accepted the **production packaging fix** but found **three
verification weaknesses** in the packed-install regression test (F01/F02 + a weak repeat-pack check).
This increment corrects **only the test harness** — the production metadata, runtime, core, and version
are untouched (P1R-07). The hardened test now:

- Compiles the AOT consumer **from inside the isolated consumer project** (P1R-01).
- Proves with `ngc --traceResolution` that `@smilodon/angular` declarations resolve from the **installed
  tarball** in the consumer's `node_modules`, **not** the repo `dist` (P1R-02).
- Runs a **negative control**: sabotaging a copy of the installed package (removing its declarations +
  exports) makes the very same AOT compile **FAIL** — proving the gate is sensitive, not a false positive
  (P1R-03).
- Distinguishes **resolution** (hard-asserted success against the installed tarball) from **runtime
  loading** (must fully succeed OR fail with ONLY the known Angular-JIT error, matched explicitly — no
  broad exception swallowing) (P1R-04).
- Verifies a **second `npm pack`** is genuinely **consumable**: installed into a fresh consumer and
  resolved, not merely field-inspected (P1R-05).
- Keeps the original packaging fix and every prior regression gate intact (P1R-06).

All three Lead-identified verification weaknesses are repaired. The hardened runner passes **38/38
assertions** and every regression gate is green and identical to the S5-P1 baseline.

## Weaknesses corrected (Lead review of S5-P1)

| ID | Severity | Weakness in S5-P1 test | Correction |
|---|---|---|---|
| F01 | HIGH | AOT compiled the component from the **repo** source dir, so compile-time resolution could pick the workspace `dist` (via the S4 symlink) rather than the installed tarball | Copy component into the isolated consumer's `src/`; add `--traceResolution` and assert resolution provenance (installed vs repo`dist`) |
| F02 | MEDIUM | ESM import catch swallowed **any** exception (only `ERR_MODULE_NOT_FOUND` flagged) | Separate resolution (hard assert) from runtime; runtime must be full success or a **specific** known JIT error |
| Repeat-pack | LOW | 2nd tarball only checked 3 manifest fields, not actual consumability | Install 2nd tarball into a fresh consumer and resolve it; also assert each export target exists inside it |

## What changed

| File | Change | Authorized area |
|---|---|---|
| `packages/angular/tests/packed-install/run-packed-install.mjs` | Hardened runner: in-consumer AOT source (P1R-01), `--traceResolution` provenance proof (P1R-02), negative-control sabotage gate (P1R-03), explicit resolution-vs-runtime classification (P1R-04), consumable repeat-pack (P1R-05), `maxBuffer` fix for the >1 MB trace | Packed-install regression test (test-only) |

**No** production `package.json` change. **No** Angular runtime/component implementation change. **No**
core source change. **No** package version change (stays `1.13.0`). **No** registry action.

> Harness fix note (implementation detail): `ngc --traceResolution` emits **>1 MB** on stdout. Node's
> `spawnSync` default `maxBuffer` (1 MB) SIGTERM-killed the child mid-write, producing a spurious
> non-zero status and a missing output file (which cascaded into a boot failure). The `run()` helper now
> sets `maxBuffer` to 256 MB so the traced compile completes deterministically. This was confirmed by
> isolating the child process (status `null` / `SIGTERM` at the default buffer; status `0` with the raised
> buffer).

## How provenance is proven (F01 / P1R-01 / P1R-02)

1. The consumer component is copied **into** `<work>/consumer/src/consumer-app.component.ts`, and the
   tsconfig (`rootDir: './src'`, `files: ['./src/...']`) lives **inside** the consumer directory.
2. `ngc -p <consumer>/tsconfig.aot.json --traceResolution` is run with `cwd` = the consumer directory.
3. The captured trace is asserted to **contain** the installed marker
   `<work>/consumer/node_modules/@smilodon/angular` and the installed declarations file
   `.../node_modules/@smilodon/angular/dist/types/smilodon-angular.d.ts`, and to **NOT contain** the repo
   `packages/angular/dist` path.

Because the tsconfig and source live inside the consumer and the trace demonstrably resolves from the
consumer's own `node_modules`, the AOT evidence can no longer be supplied by the repo `dist`.

## Negative control (P1R-03)

After a successful AOT against the installed tarball, the test copies the installed package to a scratch
consumer, **removes `dist/types`** and **deletes `exports`/`types`/`module`** from its manifest (simulating
a package that lost them), then runs the identical `ngc` compile. The gate asserts this **FAILS**
(`status !== 0`). This proves the AOT gate is sensitive to losing the package's exports/declarations and
is not a false positive.

## Resolution vs runtime, no broad swallow (F02 / P1R-04)

- **Resolution** (hard assertions): `import.meta.resolve` and `require.resolve` must both succeed and
  point at the **installed** tarball (`.../consumer/node_modules/@smilodon/angular/...`, never repo `dist`).
- **Runtime loading**: the ESM probe returns a structured result. Runtime must be either
  `IMPORTED_KEYS=…` (full success) **or** `THREW:…` whose message matches **explicitly** the known Angular
  JIT-unavailable error (`needs to be compiled using the JIT compiler` / `@angular/compiler`). Any other
  exception fails the gate.

## Consumable repeat-pack (P1R-05)

The second `npm pack` is verified three ways: (a) the second manifest carries `exports`/`module`/`types`;
(b) every export target physically exists inside the second tarball; (c) the second tarball is installed
into a **fresh** consumer and `import.meta.resolve('@smilodon/angular')` succeeds against it.

## Acceptance criteria results

| ID | Requirement | Verdict | Evidence |
|---|---|---|---|
| P1R-01 | AOT source resides INSIDE the isolated consumer project | PASS | component copied to `<consumer>/src/`; tsconfig inside consumer; `rootDir './src'` |
| P1R-02 | `ngc --traceResolution` proves declarations come from installed tarball (not repo/dist) | PASS | trace contains installed node_modules + installed `.d.ts`; does NOT contain repo `dist` |
| P1R-03 | Removing installed exports/declarations makes the AOT gate FAIL (negative control) | PASS | sabotage copy (declarations removed, exports stripped) → `ngc` status ≠ 0 |
| P1R-04 | ESM success/failure distinguished without broad exception suppression | PASS | resolution hard-asserted; runtime = full success OR specific JIT error only |
| P1R-05 | Repeated packing produces verified CONSUMABLE artifact (install + resolve) | PASS | 2nd pack: entry points + targets exist + fresh install resolves |
| P1R-06 | Original packaging fix + regression gates remain intact | PASS | see Gate results (identical to S5-P1 baseline) |
| P1R-07 | No production/core/dependency/version changes | PASS | `git diff --stat` = only `run-packed-install.mjs` (348+/201−); version `1.13.0`; no `src/`/core `.ts` |

## Gate results (P1R-06)

| Gate | Command | Result |
|---|---|---|
| **packed-install (hardened)** | `node tests/packed-install/run-packed-install.mjs` | **PASSED — 38/38 assertions** |
| AOT consumer (existing) | `npm run test:consumer` | **PASSED** |
| Angular unit | `vitest run --config packages/angular/vitest.config.ts` | **62 passed** |
| Angular SSR | `vitest run --config packages/angular/vitest.ssr.config.ts` | **4 passed** |
| Angular tsc | `tsc -p packages/angular/tsconfig.json --noEmit` | **0 errors** |
| eslint | `eslint packages/angular` | **0 errors** |
| Core unit | `vitest run --config packages/core/vitest.config.ts` | **1071 passed / 1 skipped** |
| Core SSR | `vitest run --config packages/core/vitest.ssr.config.ts` | **10 passed** |
| Core tsc | `tsc -p packages/core/tsconfig.json --noEmit` | **44 (pre-existing, unchanged)** |
| Traceability | `verify_traceability.py` | **129/129 PASS** |

## Scope guardrails honoured

- **Test-only** change (single file: `run-packed-install.mjs`).
- Angular runtime/component implementation: **untouched**.
- Core source: **untouched**.
- Package version: **unchanged** (`1.13.0`).
- Dependencies: **unchanged** (no `package.json` dependency edits).
- npm publication: **not performed**.

## Preserved limitations (unchanged)

- **L-01 WebKit** — unverified on the build host; disclosed in README.
- **L-02 Async provenance** — accepted; disclosed.
- **L-03 Multi init empty change** — core behavior; disclosed.
- **L-04 Core tsc 44** — S6 NO-GO scope, unchanged.
- **L-05 Developer-reported gates** — disclosure retained.

## Recommendation

The three Lead-identified verification weaknesses (F01, F02, repeat-pack) in the S5-P1 packed-install
test are **corrected**, and the gate is now demonstrated to be both **provenance-correct** (compiles from
the installed tarball) and **sensitive** (negative control fails). The production packaging fix is
untouched and every regression gate is green and identical to the S5-P1 baseline.

**S5-P1 COMPLETE acceptance (test-evidence portion) is ready.** Post-correction publication preflight and
npm publication remain PENDING / NO-GO as separate explicitly-gated decisions.
