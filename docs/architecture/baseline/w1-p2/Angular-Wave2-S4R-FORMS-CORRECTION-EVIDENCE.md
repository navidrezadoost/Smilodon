# Angular Wave 2 — S4-R Forms Correction (touched + async provenance): Evidence

**Increment:** Angular Wave 2 — **S4-R (correction to S4 forms integration)**
**Starting commit:** `b4444e445dbac1a27b40c9f87ee734cf56f869ec` (S4, CONDITIONALLY ACCEPTED)
**Branch:** `codex/w1-p1-3-keyboard-characterization`
**Authorized scope (Lead S4-R directive):** correct TWO defects in S4 in ONE
bounded commit:

- **S4-F01 (Medium) — touched tied to selection, not focus loss.** A selection
  currently marks the control touched; touched must instead fire at a real
  focus-loss boundary of the WHOLE control (shadow DOM + popup aware), never
  merely because `onChange` ran; internal focus moves must not prematurely touch.
- **S4-F02 (Medium) — gesture-based provenance cannot distinguish delayed
  programmatic changes.** A `writeValue()`-started server-backed fetch can
  complete AFTER the programmatic window closed and after a user gesture was
  armed in the gap; the completion `change` must NOT be misclassified as a user
  edit (never echoed). Conservative rule: never echo a known programmatic
  completion into forms; document any limitation if exact provenance is not
  establishable.

> No core changes, no new event payloads, no package restructuring, no dependency
> upgrades, no SSR remediation (S5 remains NO-GO). Must not duplicate core's
> selection authority.

---

## 0. The two defects

### S4-F01 — touched on selection instead of focus loss
S4 fired `onTouched` from inside `handleChangeForValueAccessor()` on every user
selection (`markTouched()`). Angular forms semantics mark a control touched when
the user *interacts and leaves* — i.e. at focus loss of the whole control. Tying
touched to selection means:
- selecting a value while keeping focus marks it touched too early;
- focusing and leaving WITHOUT selecting does NOT mark it touched (wrong);
- each internal focus move would be indistinguishable from a real leave.

### S4-F02 — delayed programmatic `change` misclassified
The S4 provenance window (`openProgrammaticChange`/`closeProgrammaticChange`)
covered only the SYNCHRONOUS portion of `setSelectedValues()`. With
`serverSide.fetchSelectedItems`, `setSelectedValues(values)` is ASYNC: it sets
busy, awaits the fetch, and only THEN `_requestSelectionReplacement(..., 
'external-value-sync', ...)` + `_emitChange()`. In the await gap the window has
already closed. If a user gesture arms `currentUserSeq` in that gap, the late
programmatic completion `change` satisfies `currentUserSeq > lastUserSeq` and is
misclassified as a **user edit** → echoed into the form model (a false write).

---

## 1. The fixes

### S4-F01 — touched = focus loss of the whole control

| Element | Detail |
| --- | --- |
| `installFocusTracking()` | Adds `focusin`/`focusout` listeners on the component **host** (`this.element.nativeElement`, the `smilodon-select` wrapper) in `ngAfterViewInit` (after the provenance probes, before `initialize`). Idempotent via `focusBindings.length`. `focusin`/`focusout` are used because they **bubble and are composed** → observable on the host regardless of which shadow-internal element holds focus. |
| `handleFocusOut(event)` | Fires `onTouched` ONCE **only when focus truly left the control**. Uses `event.relatedTarget` when present; falls back to the document/shadow `activeElement` when `relatedTarget` is null (programmatic blur / body focus). If the new target is still **within** the control → internal move → **no touch**. |
| `isWithinControl(host, node)` | True if `node` is the host, `host.contains(node)`, or reachable through the host's shadow-DOM chain (walks `host.shadowRoot` and nested shadow hosts). The popup/chips/clear button live inside the host's shadow tree, so internal moves stay "within". |
| `touchedThisSession` | One-shot guard: a single focus session fires `onTouched` at most once; re-armed on the next `focusin`. |
| `handleChangeForValueAccessor()` | **No longer** calls `onTouched` — the user-edit branch only calls `onChangeFn`. |
| `markTouched()` → `fireTouched()` | Renamed; destroy-guarded. Only `handleFocusOut` calls it. |
| `removeFocusTracking()` | Called in `ngOnDestroy` to remove both listeners exactly. |

### S4-F02 — conservative in-flight programmatic counter

| Element | Detail |
| --- | --- |
| `pendingProgrammaticApplications` | New counter. Incremented **before** the async `setSelectedValues()` promise can settle and decremented exactly once on settle (resolve or reject), in `applySelectedValues()`. |
| Sync path | The non-server `setSelectedValues()` emits `change` **inside** the call, before the promise settles → caught by branch (B) (`origin === 'programmatic'`). |
| Async path | The server-backed call returns before the fetch resolves, but the counter stays `> 0` until the fetch settles → the completion `change` arrives while the counter is `> 0` → caught by branch (A). |
| `handleChangeForValueAccessor()` branch (A) | `if (pendingProgrammaticApplications > 0)` → treat as programmatic: consume any armed gesture (`lastUserSeq = currentUserSeq`), set `origin='programmatic'`, return. **Never** echoes the completion into the form model, even if a stale user gesture was armed in the await gap. |
| Branch (B) | `if (origin === 'programmatic')` → programmatic (covers the brief synchronous window before the counter is bumped). |
| Branch (C) | user-origin → `classifyChange`; if genuinely 'user' → consume gesture, build the model value, call `onChangeFn` (no touched). Unchanged S4 logic. |

This is the Lead-mandated **conservative rule**: while ANY programmatic
application is in flight, a `change` is programmatic. It NEVER echoes a known
programmatic completion. The cost is a disclosed limitation (below): a genuine
user edit that races an in-flight server fetch is conservatively not reported.

## 2. What S4-R changes

| File | Change |
| --- | --- |
| `packages/angular/src/select.component.ts` | S4-F01: focus tracking (`installFocusTracking`/`removeFocusTracking`/`handleFocusOut`/`isWithinControl`/`getHostElement`/`getRootNodeFor`), `fireTouched()`, removed touched-on-selection. S4-F02: `pendingProgrammaticApplications` counter + branch (A) in `handleChangeForValueAccessor`. |
| `packages/angular/tests/touched-and-async-provenance.spec.ts` | **New** — focused regression tests reproducing each defect (5 for S4-F01, 1 for S4-F02). |
| `packages/angular/tests/control-value-accessor.spec.ts` | Rewrote the touched test: a bare user edit does NOT touch; a subsequent focus-loss touches once (old expectation was the S4-F01 defect). |
| `packages/angular/tests/consumer/run-consumer.mjs` | Touched assertions now: click alone → NOT touched; `focusout` to outside → touched once (all three form mechanisms). Added `FocusEvent` global + `focusOut()` helper. +5 assertions net (25 → 30). |
| `packages/angular/README.md` | Touched semantics documented as focus-loss boundary; async in-flight rule + disclosed limitation documented; status header updated. |

No core files, no event payloads, no dependency changes, no package restructuring.

---

## 3. Regression coverage (defect-focused)

### S4-F01 — `tests/touched-and-async-provenance.spec.ts` (5 tests, all pass)
1. **focus enter+leave with NO value change marks touched** — a `focusin` then a
   `focusout` to an outside element fires `onTouched` exactly once (the case S4
   missed entirely).
2. **internal move does NOT touch** — a `focusout` whose `relatedTarget` is inside
   the host does not fire `onTouched`.
3. **a selection alone does NOT touch** — clicking an option without leaving focus
   leaves touched at 0 (the S4-F01 defect).
4. **one-shot guard** — two `focusout`s in one focus session fire `onTouched`
   once; a re-`focusin` re-arms it.
5. **select + focus-loss touches exactly once** — realistic select-then-leave
   flow.

### S4-F02 — `tests/touched-and-async-provenance.spec.ts` (1 test, passes)
Uses `config: { serverSide: { enabled: true, fetchSelectedItems } }` with a
manually-resolved fetch promise. Sequence: `writeValue(['b','c'])` → settle →
open + `keydown 'a'` (arm a stale user gesture during the in-flight fetch) →
settle → `resolveFetch([{b},{c}])` → settle → **asserts `changes === []`** (the
delayed programmatic completion is NOT echoed). This reproduces the exact
S4-F02 scenario.

### AOT consumer — `run-consumer.mjs` (30/30 assertions, all pass)
Per form mechanism (`FormControl`, `formControlName`, `ngModel`):
- initial `writeValue` reaches the element with **no** echo (unchanged);
- a user click updates the model exactly once (unchanged);
- **(S4-R)** the click alone does **NOT** mark touched;
- **(S4-R)** a `focusout` to an outside element marks touched, and does NOT
  re-emit `onChange`.

---

## 4. Acceptance gates (all PASS)

| # | Criterion | Command | Result |
| --- | --- | --- | --- |
| R1 | Angular jsdom suite | `vitest run --config packages/angular/vitest.config.ts` | **PASS** — 62 (22 component + 10 events + 4 loader + 6 provenance + 14 CVA + 6 S4-R) |
| R2 | Angular SSR import-safety | `vitest run --config packages/angular/vitest.ssr.config.ts` | **PASS** — 4 |
| R3 | Real AOT consumer (forms + S4-R) | `node packages/angular/tests/consumer/run-consumer.mjs` | **PASS** — 30/30 |
| R4 | ng-packagr build | `npm run build:angular` | **PASS** — exit 0; no static core import; forms external |
| R5 | Angular TSC clean | `tsc -p packages/angular/tsconfig.json --noEmit` | **PASS** — exit 0 |
| R6 | Core jsdom regression | `vitest run --config packages/core/vitest.config.ts` | **PASS** — 1071 passed \| 1 skipped |
| R7 | Core SSR regression | `vitest run --config packages/core/vitest.ssr.config.ts` | **PASS** — 10 |
| R8 | Core TSC regression | `tsc -p packages/core/tsconfig.json --noEmit` | **PASS** — 44 pre-existing, none angular |
| R9 | ESLint | `eslint packages/angular/src packages/angular/tests` | **PASS** — exit 0 |
| R10 | Traceability | `verify_traceability.py` | **PASS** — 129/129 reconcile |

S2/S3/S4 tests preserved (the one S4 touched test rewritten to the corrected
semantics). No new regressions.

## 5. Disclosed limitation (S4-F02)

The conservative in-flight rule means: **a genuine user edit made WHILE a
server-backed programmatic selection fetch is in flight is treated as
programmatic and is therefore NOT reported to the form model.** This is a
deliberate, safer trade-off — never a false echo into the model, at the cost of
potentially dropping a user edit that races an in-flight programmatic load. A
value subsequently written by the form (or the element's own selection) remains
authoritative. Without core exposing its private `SelectionReason` (a core change,
out of scope), exact attribution of a `change` that arrives in the await gap is
not establishable; the conservative rule is the correct choice given that.

Other limitations unchanged from S4:
- DOM-gesture provenance for keyboard paths outside the armed gesture set (needs
  core `SelectionReason` to complete — out of scope).
- 44 pre-existing `@smilodon/core` TSC errors (none angular).
- Peer range `>=21 <22`; `@angular/forms` within range.
- Pre-existing unrelated contract-suite failures.

---

_End of S4-R evidence. Two S4 defects corrected in one bounded commit: touched now
fires only at a whole-control focus-loss boundary (internal moves and plain
selections never touch; one-shot per focus session), and server-backed
programmatic completions are never echoed into the form model via a conservative
in-flight-application rule. Regression tests reproduce each defect; the AOT
consumer re-verifies all three form mechanisms; core/packaging/SSR gates are
unchanged. S4 closes; next gate is S5 SSR/hydration (still NO-GO)._
