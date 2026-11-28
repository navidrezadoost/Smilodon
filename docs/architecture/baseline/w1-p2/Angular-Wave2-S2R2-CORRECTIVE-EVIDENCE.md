# Angular Wave 2 — S2-R2 Corrective Increment: Evidence

**Increment:** Angular Wave 2 — **S2-R2 (corrective: destruction-safe value
generations + latest-wins evidence precision)**
**Starting commit:** `b5941c34051168ae77e8855561bcd52353f8f90b` (S2-R, CONDITIONAL ACCEPTANCE)
**Branch:** `codex/w1-p1-3-keyboard-characterization`
**Authorized scope (Lead S2-R review → S2-R2):** close the two remaining
CONDITIONAL findings from the Lead's S2-R review of `b5941c3`:

- **S2-R2-F01 (Medium — Async lifecycle):** pending value applications outlive
  destruction. `ngOnDestroy()` only bumped `initGeneration`; a pending
  `setSelectedValues()` settling after teardown could still mutate `valueError`.
- **S2-R2-F02 (Low — Evidence accuracy):** "latest-wins" tests proved **adapter-level
  error-state supersession**, not end-to-end selected-value ordering. Wording must
  distinguish adapter-level supersession from core-level selection supersession.

> Scope is strictly bounded. **No engine/core change, no packaging/version/peer
> change, no API change, no S3 event bridge, no S4 `ControlValueAccessor`, no S5 SSR.**
> No previously-accepted S2 tests were altered in behavior — only two test *titles*
> were made precise (see §2).

---

## 0. What S2-R2 changes

| File | Change |
| --- | --- |
| `packages/angular/src/select.component.ts` | `ngOnDestroy()` now also bumps `valueGeneration`; `applySelectedValues()` uses an `isCurrent()` predicate (`!destroyed && generation === valueGeneration`) for all three completion paths; JSDoc rewritten to scope "latest wins" to **adapter error state** and state selection supersession is engine-owned. |
| `packages/angular/tests/select.component.spec.ts` | **+3** deterministic destruction-safety tests (late resolve / late reject / reject-preserves-prior-error); two S2-F03 test titles retitled for precision. |

Net: +170 / −19 lines across the two files. No other file changed.

---

## 1. S2-R2-F01 — Destruction-safe value generations (PASS)

**Before (S2-R at `b5941c3`):** `ngOnDestroy()` set `destroyed = true` and bumped
`initGeneration` only. A `setSelectedValues()` started before teardown would settle
its `.then(resolve/reject)` **after** destroy; the completion guarded only on
`generation === this.valueGeneration`, which was untouched by destroy — so a late
resolve could clear `valueError` and a late reject could set it, mutating adapter
state on a torn-down component.

**Now (S2-R2):**
1. `ngOnDestroy()` increments `valueGeneration` in addition to `initGeneration`, so
   every outstanding application's `generation` becomes stale the moment the
   component is destroyed.
2. `applySelectedValues()` uses a single liveness predicate:
   ```ts
   const isCurrent = (): boolean => !this.destroyed && generation === this.valueGeneration;
   ```
   All three completion paths (synchronous catch, resolve, reject) consult
   `isCurrent()` instead of the bare `generation === valueGeneration` check. The
   `!this.destroyed` term is defense-in-depth: even if a future refactor forgot to
   bump the generation on destroy, post-teardown completions are still ignored.

**Proof (deterministic tests):** each test captures the `resolve`/`reject` handles
from a mocked `setSelectedValues()`, calls `ngOnDestroy()`, and *then* settles:

- **I fixed the bug, verified the tests catch it.** With the pre-fix logic restored
  (no `valueGeneration` bump on destroy, no `destroyed` term in the guard), 2 of
  the 3 new tests fail — the late rejection overwrites adapter state. With the fix,
  all 3 pass.

Tests added (describe: `value application survives destroy (S2-R2-F01)`):
- `ignores a LATE RESOLVE that lands after ngOnDestroy()` — `lastValueError` stays `null`.
- `ignores a LATE REJECTION that lands after ngOnDestroy()` — `lastValueError` stays
  `null` **and** the rejection is not unhandled (tracked via `process.on('unhandledRejection')`).
- `does not overwrite existing error state when a rejection lands after destroy()` —
  a genuine pre-destroy error is preserved; the late rejection is discarded.

**Engine untouched:** the adapter does not re-implement selection ordering; destroy
only invalidates the adapter's *own* error bookkeeping.

## 2. S2-R2-F02 — Latest-wins scope precision (PASS)

The earlier tests demonstrated that the **adapter** keeps `lastValueError` in sync
with the newest request (a stale rejection cannot clobber the current error). They
did **not** demonstrate that the element's final *selected value* is always the
newest — that is the engine's responsibility.

**Wording correction (source JSDoc in `applySelectedValues`):** now states three
adapter-side hazards (rejection / destroy-safety / **adapter-level error
supersession**) and explicitly scopes the "latest wins" guarantee:

> This method guarantees that the **ADAPTER's error state** reflects the latest
> request. **SELECTION** supersession — which selection ultimately lands in the
> element — is owned by the engine: the non-server `setSelectedValues()` path
> applies the replacement synchronously, and the server-backed fetch path guards
> its own completion with `isConnected` + a private `_asyncGeneration`, so a
> superseded fetch is discarded. The adapter relies on (and does not duplicate)
> that behavior.

**Test-title correction (behavior unchanged):**
- `latest value wins and a stale rejection is swallowed (deterministic ordering)`
  → `latest error state wins: a stale rejection is swallowed (adapter-level supersession)`.
- `records the rejection when the newest application fails after an older success`
  → `... (adapter-level)`.

Implementation note: the `valueGeneration` field comment now also documents the
destroy bump and post-destroy settle safety.

**Why no new end-to-end selection-ordering test:** the adapter deliberately does
not own selection ordering, and (per the S2-R architecture) `setSelectedValues()`
applies the replacement synchronously on the non-server path. Asserting engine-level
selection supersession through the adapter would require driving the server-fetch
path (`_asyncGeneration`) via the engine's internals, which is out of this
increment's authorized scope and would test the engine, not the adapter. The
capability is instead documented precisely, and the adapter-level guarantee (which
it *does* own) is what the tests assert.

---

## 3. Acceptance gates (all PASS)

| # | Criterion | Command | Result |
| --- | --- | --- | --- |
| R1 | Angular jsdom suite | `vitest run --config packages/angular/vitest.config.ts` | **PASS** — 26 (22 component + 4 loader) |
| R2 | Angular SSR import-safety | `vitest run --config packages/angular/vitest.ssr.config.ts` | **PASS** — 3 |
| R3 | Real AOT consumer | `node packages/angular/tests/consumer/run-consumer.mjs` | **PASS** — 7/7 assertions |
| R4 | ng-packagr build | `npm run build:angular` | **PASS** — exit 0 |
| R5 | Angular TSC clean | `tsc -p packages/angular/tsconfig.json --noEmit` | **PASS** — exit 0 |
| R6 | Core jsdom regression | `vitest run --config packages/core/vitest.config.ts` | **PASS** — 1071 passed \| 1 skipped (71 files) |
| R7 | Core SSR regression | `vitest run --config packages/core/vitest.ssr.config.ts` | **PASS** — 10 |
| R8 | Core TSC regression | `tsc -p packages/core/tsconfig.json --noEmit` | **PASS** — 44 pre-existing, none angular |
| R9 | ESLint | `eslint packages/angular/src packages/angular/tests` | **PASS** — exit 0 |
| R10 | Traceability | `verify_traceability.py` | **PASS** — 129/129 reconcile |

Angular jsdom went from **23** (at `b5941c3`) to **26** (+3 S2-R2-F01 tests).

## 4. Negative-control verification (bug-catch proof)

Temporarily restored the pre-fix logic (removed the `valueGeneration` bump in
`ngOnDestroy` and the `!this.destroyed` term from `isCurrent`), then ran
`vitest ... -t "S2-R2-F01"`:

```
Test Files  1 failed (1)  | 1 skipped
     Tests  2 failed | 1 passed | 23 skipped
```

2 of 3 destruction tests fail without the fix; 3/3 pass with it. Source restored
byte-identical to the fix (verified by `diff`).

---

## 5. Non-goals (explicitly NOT in S2-R2)

No engine/core change; no packaging/version/peer-range change; no API change; no
S3 `@Output()` event bridge; no S4 `ControlValueAccessor`; no S5 SSR
rendering/hydration; no change to previously-accepted S2 test *behavior* (two
titles retitled only). No API-065/API-075 remediation.

## 6. Disclosed limitations (inherited from S2-R, unchanged)

- **44 pre-existing `@smilodon/core` TSC errors remain** — unchanged; none reference
  angular.
- **Peer range remains `>=21 <22`** (narrowed at S2-R; not revisited here).
- **Pre-existing failing contract suite** (`test:contracts`) unrelated to this work.

---

_End of S2-R2 evidence. Destruction-safe value generations and precise latest-wins
scoping. No engine, packaging, version, or API change._
