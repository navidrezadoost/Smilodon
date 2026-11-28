# Angular Wave 2 — S5-P1R2 Final Assertion Hardening

- **Artifact:** `Angular-Wave2-S5P1R2-ASSERTION-HARDENING`
- **Increment:** Angular Wave 2 — S5-P1R2 Final Assertion Hardening (bounded test-only)
- **Starting commit:** `4463d795c872f5fcdce271431c2b55e85d3bb459` (S5-P1R; Lead: SUBSTANTIALLY VERIFIED)
- **Branch:** `codex/w1-p1-3-keyboard-characterization`
- **Type:** Bounded test-only assertion correction — hardens two remaining false-positive risks.
- **Published:** No.

## Headline

The Lead's S5-P1R review accepted the S5-P1 packaging correction and confirmed S5-P1R as
**substantially verified**, but withheld complete closure pending **two concrete assertion
weaknesses** (F03 negative-control false positive; F04 over-broad JIT matcher). This increment corrects
**only those two assertions** in the packed-install runner. The successful isolated AOT compilation,
trace-resolution provenance checks, repeat-pack installation, and every existing regression gate are
**preserved unchanged**.

## Weaknesses corrected (Lead review of S5-P1R)

| ID | Severity | Weakness in S5-P1R | Correction |
|---|---|---|---|
| F03 | Negative control false positive | `check(..., sabotage.status !== 0, ...)` also passes on a signal termination (`status === null`), a missing compiler executable, or any unrelated failure | Require a **numeric** non-zero exit (`typeof status === 'number' && status > 0`) **AND** a diagnostic implicating the sabotaged package (`TS2307: Cannot find module '@smilodon/angular'`) |
| F04 | Over-broad JIT matcher | `/needs to be compiled using the JIT compiler\|@angular\/compiler/i` — the second alternative passes **any** error mentioning `@angular/compiler` | Match **only** the specific JIT-unavailable clause: `needs to be compiled using the JIT compiler, but '@angular/compiler' is not available` |

## What changed

| File | Change | Authorized area |
|---|---|---|
| `packages/angular/tests/packed-install/run-packed-install.mjs` | F03: numeric-exit + diagnostic-provenance assertions (ANSI-stripped); F04: strict JIT clause matcher; added `stripAnsi()` helper; header doc updated | Packed-install regression test (test-only) |

**No** package metadata change. **No** Angular runtime/component implementation change. **No** core source
change. **No** dependency change. **No** package version change (stays `1.13.0`). **No** registry action.

## F03 — negative control now fails for the RIGHT reason

The sabotage compile is asserted on two conditions, both required:

1. **Numeric non-zero exit** — `typeof sabotage.status === 'number' && sabotage.status > 0`. A signal
   termination (`status === null`), a spawn error, or a missing compiler executable can no longer satisfy
   the gate.
2. **Diagnostic implicating the sabotaged package** — after stripping ngc's ANSI color codes, the output
   must match `TS2307:\s*Cannot find module '@smilodon/angular'`. An unrelated dependency failure
   (e.g. `Cannot find module 'rxjs'`) does not match.

Observed sabotage output (exit `1`, colorized):
```
src/consumer-app.component.ts:26:41 - error TS2307: Cannot find module '@smilodon/angular' or its corresponding type declarations.
src/consumer-app.component.ts:27:60 - error TS2307: Cannot find module '@smilodon/angular' or its corresponding type declarations.
```

> ANSI note: ngc prints `error\x1b[90m TS2307: \x1b[0mCannot find module …`. The `was-ANSI-stripped`
> form is matched, so the literal `TS2307: Cannot find module '@smilodon/angular'` regex matches reliably.

## F04 — JIT predicate narrowed to the exact diagnostic

The genuine runtime diagnostic (captured from the installed tarball import) is:
```
The injectable 'PlatformLocation' needs to be compiled using the JIT compiler, but '@angular/compiler' is not available.
```
The predicate now requires **both** salient clauses anchored together
(`needs to be compiled using the JIT compiler, but '@angular/compiler' is not available`), so an arbitrary
error that merely references `@angular/compiler` is rejected. Verified by discrimination checks:

| Input | Old matcher | New matcher |
|---|---|---|
| Genuine JIT-unavailable message | pass | **pass** |
| Unrelated error mentioning `@angular/compiler` | pass (WRONG) | **reject** |
| Random `ENOENT` | reject | **reject** |
| Partial clause ("… but not really") | pass (WRONG) | **reject** |

## Acceptance criteria results

| ID | Requirement | Verdict | Evidence |
|---|---|---|---|
| P1R2-01 | Negative control requires a numeric non-zero compiler exit (no signal/spawn pass) | PASS | `typeof status === 'number' && status > 0`; observed exit `1` |
| P1R2-02 | Negative-control diagnostic implicates the sabotaged `@smilodon/angular` exports/declarations | PASS | ANSI-stripped match `TS2307: Cannot find module '@smilodon/angular'`; unrelated-dep TS2307 rejected |
| P1R2-03 | JIT predicate narrowed to the specific JIT-unavailable diagnostic | PASS | strict clause matcher; unrelated `@angular/compiler` mention rejected |
| P1R2-04 | Isolated AOT compile + trace-resolution + repeat-pack + regression coverage preserved | PASS | packed-install PASSED (exit 0); all gates green |
| P1R2-05 | No package metadata/runtime/core/dependency/version changes | PASS | diff = only `run-packed-install.mjs`; version `1.13.0` |
| P1R2-06 | Evidence + checksums regenerated | PASS | this artifact + SHA256SUMS regenerated |

## Gate results (regression preserved)

| Gate | Command | Result |
|---|---|---|
| **packed-install (hardened)** | `node tests/packed-install/run-packed-install.mjs` | **PASSED — exit 0, 0 failures** |
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
- Dependencies: **unchanged**.
- Package version: **unchanged** (`1.13.0`).
- npm publication: **not performed**.

## Preserved limitations (unchanged)

- **L-01 WebKit** — unverified on the build host; disclosed in README.
- **L-02 Async provenance** — accepted; disclosed.
- **L-03 Multi init empty change** — core behavior; disclosed.
- **L-04 Core tsc 44** — S6 NO-GO scope, unchanged.
- **L-05 Developer-reported gates** — disclosure retained.

## Recommendation

The two Lead-identified false-positive risks (F03, F04) are **corrected** and demonstrated to discriminate
correctly (the negative control now fails only on a genuine numeric exit with a package-specific
diagnostic; the JIT predicate accepts only the exact JIT-unavailable clause). The approved package
implementation is intact, and every regression gate is green and identical to the prior baseline.

**S5-P1 COMPLETE closure (test-evidence portion) is ready.** Post-correction publication preflight and
npm publication remain PENDING / NO-GO as separate explicitly-gated decisions.
