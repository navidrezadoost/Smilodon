# W1-P1.1 — Known Deviations and Ambiguous Behavior

**Baseline of record:** `7e3adf77545f8e1b2b4f85949684d7d91b84456b`
**Branch:** `codex/w1-p1-characterization-7e3adf7`
**Reconciled under:** W1-P1.1-R (documentation only; all six deviations preserved unchanged)

W1-P1 is a characterization phase. **Discovering a defect or quirk is not permission to repair production code.** Each item below records evidence and a disposition. Reproducers and any ADR candidates are produced in the target increment; none authorize a production change during W1-P1.

---

## DEVIATION-01 — Prior W1-P0 ledger was uncommitted and absent at the baseline

- **Observation.** A `docs/architecture/W1-P0-CONTRACT-LEDGER.md` and related `W1-P0-*` files existed only as **untracked** files in a separate worktree, anchored to baseline `c49d5ad`. They are not present on this branch at `7e3adf7`.
- **Evidence.** `git cat-file -e 7e3adf7:docs/architecture/W1-P0-CONTRACT-LEDGER.md` fails; the files are untracked in the main worktree only.
- **Class:** Internal (process).
- **Disposition.** This W1-P1 ledger is self-contained and supersedes the prior artifact. The P1.6 provenance ledger records that the accepted baseline did not contain a committed component contract ledger.
- **No production impact.**
- **Archival status (W1-P1.1-R).** The historical W1-P0 contract ledger, baseline inventory, and ownership maps are now available as **archival reference material** and are crosswalked in the contract ledger, section 12 (Package Boundary and Historical Crosswalk). They remain **absent from the committed canonical W1-P1 baseline** and are not a dependency of any W1-P1 increment. Their W1-P0 line numbers and ownership classifications must not be applied directly to the current 9,109-line source.

---

## DEVIATION-02 — `pageLoaded` declared but never emitted; omitted from capabilities

- **Observation.** `SelectEventsDetailMap` (`packages/core/src/types.ts:144`) declares `pageLoaded: PageLoadedEventDetail` with detail `{ page: number; count: number }`. However:
  - A source-wide search finds **no** `_emit('pageLoaded', …)` or `dispatchEvent(new CustomEvent('pageLoaded', …))` in `packages/core/src/`.
  - `getCapabilities().events.emitted` (`enhanced-select.ts:6421–6441`) lists `select, open, close, search, change, loadMore, remove, clear, emptyStateChange, error, diagnostic` — **11 events, no `pageLoaded`**.
- **Evidence.** `grep -rn "pageLoaded" packages/core/src/` returns only the type declaration.
- **Class:** Unknown (declared-but-unrealized event).
- **Risk.** Consumers relying on the declared type may subscribe to an event that never fires; the capabilities report and the type map disagree.
- **Disposition.**
  - P1.5: characterize whether pagination completion is signaled by another channel (`loadMore`, `search`, or acknowledged `dataProjection`).
  - ADR candidate: either **(a)** remove `pageLoaded` from the public event map (breaking a declared-but-unused contract) or **(b)** implement emission at pagination completion. Deferred out of W1-P1.
  - **Do not silently fix during W1-P1.**

---

## DEVIATION-03 — `search` payload shape (local vs acknowledged) not pinned

- **Observation.** `SearchEventDetail` declares `{ query: string; results?: unknown[]; count?: number }`. The local emission (`enhanced-select.ts:5043`) sends `{ query, results, count }`. The acknowledged path (`_dispatchAcknowledgedEvent('search', detail)` at 7715) sends a detail built from the coordinator, which may differ in shape.
- **Evidence.** Two distinct emission sites with different detail construction.
- **Class:** Unknown.
- **Disposition.** P1.5 pins the exact runtime payload for both local and acknowledged `search` and reconciles against the declared type. No production change in W1-P1.

---

## DEVIATION-04 — `setSelectedValues` async ordering not asserted

- **Observation.** `setSelectedValues(values): Promise<void>` (`enhanced-select.ts:6642–6663`) has two paths:
  - Local: replace selection → `_renderOptions()` → `_updateInputDisplay()` → `_emitChange()`.
  - Server (`serverSide.enabled && fetchSelectedItems`): `_setBusy(true)` → await fetch → stale-gen guard → replace → render → `_emitChange()` → optional scroll → `finally` `_setBusy(false)`; on error `_handleError`.
- The relative order of `select` vs `change`, and Promise-resolution timing, are **not asserted** by existing tests.
- **Evidence.** `select-selection.spec.ts` exercises the API but not emitted-event ordering or Promise-resolution ordering.
- **Class:** Unknown.
- **Disposition.** P1.2 adds a black-box test that records the exact sequence of emitted events and callbacks across both paths and asserts Promise resolution ordering. Prerequisite for any selection extraction. No production change in W1-P1.

---

## DEVIATION-05 — `connectedCallback` forces `style.display='block'`

- **Observation.** `connectedCallback` sets `this.style.display = 'block'` as an explicit Angular compatibility workaround.
- **Evidence.** `enhanced-select.ts` connectedCallback body (with in-code comment).
- **Class:** Internal (quirk).
- **Disposition.** P1.4 characterizes this side effect. Leave as-is; ADR candidate only if it blocks a real use case. No production change in W1-P1.

---

## DEVIATION-06 — Dev-only projection asserts can throw

- **Observation.** `_assertSelectionProjection` / `_assertActiveProjection` run only when `NODE_ENV !== 'production'` and **throw** when legacy projections (`selectedIndices`, `selectedItems`, `activeIndex`) diverge from engine authority. Tests that manipulate legacy projections directly can trigger dev-only throws.
- **Evidence.** `_isPhase2DevRuntime()` gate + `throw new Error('[Smilodon Phase2] …')`.
- **Class:** Internal.
- **Disposition.** W1-P1 tests drive state via public API and assert via public getters / rendered DOM / events. Projection-level tests from earlier phases remain diagnostics only. No production change in W1-P1.

---

## DEVIATION-07 — `setSelectedValues` in single mode collapses to the first matching value

- **Observation.** In the default `selection.mode: 'single'`, `setSelectedValues(values)` replaces selection through the engine `REPLACE_SELECTION_REQUEST` path. `normalizeKeys()` (`engine/selection-policy.ts`) breaks after the first eligible key when `!multiple`, so a call such as `setSelectedValues(['a','c'])` yields only `['a']`. In `multi` mode both eligible values are kept, capped by `maxSelections`.
- **Evidence.** `packages/core/tests/w1-p1-2-set-selected-values-ordering.spec.ts` (W1-P1.2) characterizes both modes; `W1-P1.2-DEVIATION-04-EVIDENCE.json`.
- **Class:** Unknown (mode-dependent replace semantics; not previously asserted).
- **Risk:** Forms integrations that push multiple values expecting single-mode to store them all will silently lose values. Adapters must not assume multi semantics in single mode.
- **Disposition.** Characterized, **not** approved as normative. P1.2 (task 2, identity/selection matrix) determines whether this is intended replace semantics or a defect; if a defect, record a minimal reproducer and proposed disposition. No production change in W1-P2.

- **Confirmed investigation (W1-P1.2 Task 2).** Using only public APIs (`setItems`/`setSelectedValues`), the surviving value in single mode was established to depend on **registry order, not request order**. `setSelectedValues()` filters `_itemRegistry.records` (registry order) before forwarding keys to the engine, and the engine keeps the first eligible key.

  | Registry order | Requested values | Surviving selection | Conclusion |
  | --- | --- | --- | --- |
  | a, b, c | `['a','c']` | `a` | — |
  | a, b, c | `['c','a']` | `a` | request order has no effect |
  | c, b, a | `['a','c']` | `c` | registry order governs |
  | c, b, a | `['c','a']` | `c` | registry order governs |

  Evidence: `packages/core/tests/w1-p1-2-identity-policy-matrix.spec.ts` (`DEVIATION-07` describe block, 4 cases).
- **Compatibility implication.** In single mode the result is the first *eligible* value in loaded-item order, independent of the order the caller supplied. A consumer that reorders loaded items changes which value survives a multi-value `setSelectedValues`. This is recorded as observed behavior; it is **not** classified as a defect and its design disposition stays open.

---

## DEVIATION-08 — detached selected items are retained after removal from loaded data

- **Observation.** When a currently-selected item is removed from the loaded set via `setItems()` (the value no longer appears in any loaded record), the selection is **not** cleared. `getSelectedEntries()` falls back to the internal `_selectedRecordsByKey` cache, so `getSelectedValues()` / `getSelectedItems()` continue to report the detached value, even though it no longer renders among options.
  - **Reattachment — SUPERSEDED (T5-F02).** The original primary observation concluded that re-adding an item with the same **value** re-associates it as a new instance. That clause is **superseded** by the later key-based characterization below (W1-P1.2-T2-R and Task 3): reattachment is matched by the **registry key**, not by value equality. Same value under a *different* key does **not** migrate the selection. Read reattachment semantics from the key-based characterization, not from this historical clause.
  - **Retention — unchanged and still authoritative.** The retention half of this observation (a detached selection is retained and remains visible to the getters) stands as accepted.
- **Evidence.** `packages/core/tests/w1-p1-2-identity-policy-matrix.spec.ts` ("detached selected value is RETAINED..." and re-selection tests).
- **Class:** Observed (not previously asserted).
- **Risk.** A consumer that removes an option from `setItems` expecting its selection to be dropped will instead keep a "phantom" selected value that is not visible in the list. Forms bindings must reconcile removed values explicitly (e.g. `setSelectedValues`), not rely on `setItems` to prune selection.
- **Refined (W1-P1.2-T2-R).** Reattachment is **automatic by key**, not by object reference: re-adding an item with the same `key`/value as a *new object instance* re-attaches the existing selection without any explicit reselection, and `getSelectedItems()` then returns the **new** instance (not the stale original). This upgrade is observable through public getters and the rendered `aria-selected` state.
- **Key-based reattachment (W1-P1.2 Task 3).** Reattachment is matched by the item **key** (default key = `id`). Re-adding the *same* key as a new instance reattaches to the new instance; re-adding the same *value* under a **different** key does **not** migrate the selection — the old key remains cached/detached and the new record is not selected. Clearing first prevents reattachment entirely.
- **Duplicate-value note.** With two distinct keys sharing one value, identity is per-record: multi mode selects BOTH records (`getSelectedValues()` == `['dup','dup']`), single mode selects the first in registry order. Value equality alone is not the identity unit; the registry key is.
- **Evidence (T2-R).** `packages/core/tests/w1-p1-2-t2r-identity-evidence.spec.ts` (F01/F02/F03).
- **Disposition.** Characterized; recorded for P1.2 Task 3 (state/clear API matrix) to confirm whether `clear()`/`setSelectedValues([])` is the intended pruning path. No production change in W1-P2.

---

## DEVIATION-09 — detached selection is visible to getters but not to validate()

- **Observation.** After a selected item is detached (removed from loaded data; see DEVIATION-08), `getSelectedValues()` and `getSelectedItems()` still report the value, but `validate()` under `required` returns **false**, because `validate()` inspects the live `selectedIndices` projection which excludes the detached record. The result is an internally inconsistent public view: the component both "has" and "lacks" the selection depending on which public API is consulted.
- **Evidence.** `packages/core/tests/w1-p1-2-t3-state-validation-clear.spec.ts` ("required + detached-selected: getters report the value but validate() returns false").
- **Class:** Observed (getter/validator inconsistency; not previously asserted).
- **Risk.** A required form can show a selected value to the user (input displays the label) yet fail validation, or vice-versa, leading to confusing submission states. Adapters that derive form validity from `validate()` must reconcile detached selections explicitly (prune via `clear()`/`setSelectedValues([])` when not required, or re-add the item).
- **Disposition.** Characterized, **not** repaired. Whether detached selections should count toward `required` validity is a design decision deferred out of W1-P1; recorded as an ADR candidate for the eventual validation/reporting work. No production change in W1-P2.

---

## DEVIATION-10 — clear-control reports `clearedSelection: true` while `required` preserves the selection

- **Observation.** `_handleClearControlClick()` (`enhanced-select.ts:7229`) computes `hadSelection` **before** delegating to `clear()` and then reports `clearedSelection: shouldClearSelection && hadSelection`. In a `required` configuration, `clear()` does **not** empty the selection (Task 3 characterization), so the selection is preserved — yet the `clear` event and `onClear` callback still report `clearedSelection: true`. The paired `change` event (emitted by `clear()`) still carries the **preserved** selection. Result: three mutually inconsistent public signals for one interaction — the actual state (preserved), the `clear` event (claims cleared), and the `change` event (reports preserved).
- **Also confirmed.** An **empty** clear-control activation is a genuine no-op: the button is `disabled` when there is nothing to clear, the `click` handler does not run, and **no** `clear`/`change` event or callback fires. (The `clearedSelection: false` branch of `_handleClearControlClick` is therefore only reachable when selection existed but `clearSelection` was configured off — not verified here.)
- **Evidence.** `packages/core/tests/w1-p1-2-t4-interaction-events.spec.ts` — T4-06 "required + selection: clear-control PRESERVES selection but clear.detail.clearedSelection is TRUE (DEVIATION-10)"; empty-activation and selection-only cases in the same block.
- **Class:** Observed (event/state inconsistency; not previously asserted).
- **Risk.** A consumer that treats `clear.detail.clearedSelection === true` as "the form is now empty" will be wrong under `required`, while a listener on `change` correctly sees the preserved value. Adapters must rely on the subsequent `change`/`getSelectedValues()` state, not on the `clear` payload's `clearedSelection` flag, to determine whether a clear-control activation actually emptied the selection.
- **Disposition.** Characterized, **not** repaired. Whether `clearedSelection` should report the *attempted* vs *effected* clear (or whether `clear()` should refuse earlier under `required`) is a design decision deferred out of W1-P1; recorded as an ADR candidate. No production change.

---

## Summary

| ID | Class | Blocking for later increments? | Owner increment |
| --- | --- | --- | --- |
| DEVIATION-01 | Internal (process) | No | P1.6 (provenance) |
| DEVIATION-02 | Unknown | Yes — characterize before pagination extraction | P1.5 |
| DEVIATION-03 | Unknown | Yes — pin before async extraction | P1.5 |
| DEVIATION-04 | Unknown | Yes — pin before selection extraction | P1.2 |
| DEVIATION-05 | Internal (quirk) | No | P1.4 |
| DEVIATION-06 | Internal | Guidance only | P1.2 |
| DEVIATION-07 | Unknown (mode-dependent) | Characterized in P1.2; disposition pending | P1.2 |
| DEVIATION-08 | Observed (detached retention) | Recorded; pruning path confirmed in P1.2 Task 3 | P1.2 |
| DEVIATION-09 | Observed (getter/validator inconsistency) | ADR candidate; validation design decision deferred past W1-P1 | P1.6 / forms |
| DEVIATION-10 | Observed (clear-control payload/state inconsistency) | ADR candidate; clear-control reporting design decision deferred past W1-P1 | W1-P1.2 Task 4 recorded / forms |

---

## W1-P1.2 Task 5 — deviation disposition reconciliation

Reconciliation of DEVIATION-04 and 06–10 at P1.2 closure (the specific items the Technical Lead assigned to Task 5). **No disposition here repairs production code**; it records, per deviation, what evidence exists, whether it is resolved for P1.2, and who owns the eventual decision.

> **T5-R note (T5-F02).** DEVIATION-08's reattachment semantics are **key-based**. The original value-based reattachment clause is marked **SUPERSEDED** in the DEVIATION-08 body; the historical evidence is preserved and the key-based characterization (T2-R F03, Task 3) is authoritative. Retention of a detached selection is unchanged. This supersession is a wording correction only — no test, behavior, or disposition changes.

| ID | Evidence (spec) | Status at P1.2 closure | Owner of the eventual decision |
| --- | --- | --- | --- |
| DEVIATION-04 | `w1-p1-2-set-selected-values-ordering.spec.ts` (local + server-fetch success/failure/superseded/disconnected; T1-R chronology) | **Resolved-for-P1.2** — ordering fully characterized; not a defect. | P1.2 (closed) — extraction may proceed. |
| DEVIATION-06 | All P1.2 specs (public-API-only drivers) | **Honored** — no test manipulates legacy projections; guidance upheld. | P1.2 (closed) — no behavioral finding. |
| DEVIATION-07 | `w1-p1-2-identity-policy-matrix.spec.ts` (registry vs request order; 4 cases) | **Characterized** — registry order governs single mode. Design disposition (intended vs defect) still **open**. | P1.2 recorded / P1.4+ owner for any semantics change. |
| DEVIATION-08 | `w1-p1-2-identity-policy-matrix.spec.ts`, `w1-p1-2-t2r-identity-evidence.spec.ts` (F03), `w1-p1-2-t3-state-validation-clear.spec.ts` | **Characterized** — retention, key-based reattachment, and pruning (clear/`setSelectedValues([])`) confirmed. Design disposition **open**. | P1.2 recorded / forms integration. |
| DEVIATION-09 | `w1-p1-2-t3-state-validation-clear.spec.ts` (required + detached → `validate()` false) | **Characterized; ADR candidate** — getter/validator inconsistency recorded. | P1.6 / forms (validation design). |
| DEVIATION-10 | `w1-p1-2-t4-interaction-events.spec.ts` (T4-06 required-preservation case) | **Characterized; ADR candidate** — clear-control payload/state inconsistency recorded. | W1-P1.2 Task 4 recorded / forms (clear-control reporting design). |

**No deviation is closed by this reconciliation except DEVIATION-04 and DEVIATION-06, which are P1.2-owned and fully resolved/honored.** DEVIATION-07/08 remain characterized with open *design* dispositions; DEVIATION-09/10 are ADR candidates deferred past W1-P1. None authorizes a production change during W1-P1.

---

## W1-P1.3 Task 1 — deviation candidates (T1-R disposition)

Recorded during W1-P1.3 Task 1 keyboard/focus characterization (evidence: `packages/core/tests/w1-p1-3-t1-keyboard-navigation.spec.ts`, `W1-P1.3-T1-KEYBOARD-EVIDENCE.json`, ledger §15.4). Per Technical Lead T1-R review: **P1.3-D01 is promoted here** as an *observed public-contract limitation*; **P1.3-D02** is retained as a `Diagnostic` guard (not a defect) pending a browser-level accessibility check; **P1.3-D03** is accepted as an *observation, not a defect*, pending a real-browser/APG assessment. **None authorizes a production change during W1-P1; no ADR is opened.**

### P1.3-D01 — public `close` event detail is empty (`{}`); no close reason is surfaced

- **Observation.** The public `close` event detail is `{}`: `CloseEventDetail` (`types.ts:50`) is an empty interface. The engine carries a `CloseReason` (`engine/contracts.ts:3`, values `escape`/`outside-pointer`/`selection`/`blur`/`programmatic`/`disabled`/`disconnect`) but it is **never surfaced** on the public `close` event. Keyboard Escape and Tab therefore emit an indistinguishable `close:{}` (asserted in Task 1: "Escape emits an indistinguishable close detail from Tab (both {})").
- **Evidence.** `packages/core/tests/w1-p1-3-t1-keyboard-navigation.spec.ts` — KBD-006/KBD-007 indistinguishable-detail case and EVENT-003 detail-is-`{}` case; `W1-P1.3-T1-KEYBOARD-EVIDENCE.json`.
- **Class:** Observed public-contract limitation.
- **Risk.** Consumers cannot distinguish keyboard-close from selection-close (or any other close path) from the event alone; `EVENT-003` was historically described as carrying "close reasons" but reasons are not publicly observable.
- **Disposition.** **Characterized; design decision deferred.** Promotion to this file records the limitation as an accepted observation of the public contract. Whether to surface a close reason in `detail` is a deliberate design decision **deferred** past W1-P1; characterization/tests must not assume a reason is present. **No production change; no ADR.**

### P1.3-D02 — `aria-busy` host resync has no confirmed observable effect on the listbox (retained as `Diagnostic`)

- **Observation.** `attributeChangedCallback('aria-busy', …)` routes to `_syncListboxAccessibility` (637-646), but the jsdom probe observed **no** `aria-busy` written to the listbox element and no change when toggling `aria-busy="true"`→`"false"`. The resync is wired; the observable effect is unconfirmed at baseline.
- **Evidence.** Task 1 ATTR-003 case (asserts the observed non-effect); `W1-P1.3-T1-KEYBOARD-EVIDENCE.json`.
- **Class:** Diagnostic (jsdom-observed; pending browser a11y confirmation).
- **Disposition.** **Retained as `Diagnostic`, not a defect.** A real-browser accessibility check may confirm or refute the effect; the Task-1 assertion pins the observed baseline (non-)effect so a future change is caught. **No production change; no ADR.**

### P1.3-D03 — opening with no selection assigns no initial `aria-activedescendant` (observation, not a defect)

- **Observation.** `open` assigns no initial `aria-activedescendant` when there is no selection (by design, per `_setInitialActiveOption` 5536-5540); the first ArrowDown then materializes the first selectable option. This differs from some APG examples that pre-activate the first option on open.
- **Evidence.** Task 1 KBD-001 open-without-initial-active case; `W1-P1.3-T1-KEYBOARD-EVIDENCE.json`.
- **Class:** Observation (intentional, per source comment).
- **Disposition.** **Accepted as an observation, not a defect**, pending a real-browser/APG assessment. Task 1 locks the *observed* behavior without asserting any APG default. **No production change; no ADR.**

| ID | Class | Disposition (T1-R) | Owner of the eventual decision |
| --- | --- | --- | --- |
| P1.3-D01 | Observed public-contract limitation | Characterized; design decision deferred | P1.3 recorded / future public-contract design |
| P1.3-D02 | Diagnostic | Retained as Diagnostic pending browser a11y check | P1.3 / P1.4+ a11y verification |
| P1.3-D03 | Observation (not a defect) | Accepted as observation pending real-browser/APG assessment | P1.3 / future a11y conformance |
