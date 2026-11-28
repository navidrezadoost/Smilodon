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

### P1.3-D02 — `aria-busy` reflection: listbox is the target and receives busy when genuinely busy (browser-verified)

- **Observation (Task 1, jsdom).** `attributeChangedCallback('aria-busy', …)` routes to `_syncListboxAccessibility` (637-646), but the jsdom probe observed **no** `aria-busy` written to the listbox when toggling a *legacy host* `aria-busy="true"`→`"false"`.
- **Observation (Task 2, real browser — Chromium 156).** The **listbox is the aria-busy reflection target** and it **does receive `aria-busy="true"` when the component is genuinely busy** (public `.load-more-button` click → `_loadMoreItems('manual')` → `_setBusy(true)`). The **legacy host `aria-busy` attribute is intentionally inert** for listbox semantics (in-code comment in `_syncListboxAccessibility`: legacy host attributes remain inert for listbox semantics; busy is set only when `isBusy || (protocol==='acknowledged' && host aria-busy==='true')`). The Task-1 jsdom observation tested the *inert legacy attribute*, not the genuine busy path. **(T2-F03)** The genuine-busy reflection is verified at **both** the DOM (`aria-busy="true"`) **and** the Chromium accessibility tree (the listbox AX node reports `busy=true`); the AX claim is backed by an explicit AX assertion, not inferred from the DOM.
- **Evidence.** Task 1 ATTR-003 case (jsdom non-effect of legacy attr); Task 2 `keyboard-accessibility.t2.spec.ts` — T2-09 "P1.3-D02: legacy host aria-busy is inert on the listbox; genuine busy reflects to the listbox"; `W1-P1.3-T2-BROWSER-EVIDENCE.json`.
- **Class:** Now **resolved** — reflection target is the listbox; verified at DOM + AX when genuinely busy (not a defect, not a wrong-reflection-target limitation).
- **Disposition.** **Resolved (DOM + AX).** Whether to *also* honor the legacy host attribute for listbox semantics is a deliberate design choice (documented inert), not a defect. The Task-1 Diagnostic guard remains as a regression pin. **No production change; no ADR.**

### P1.3-D03 — popup open pre-activates the first option in a real browser (observation; root-cause attribution withheld)

- **Observation (Task 1, jsdom).** `open` was observed to assign no initial `aria-activedescendant` when there is no selection; the first ArrowDown then materialized the first selectable option.
- **Observation (Task 2, real browser — Chromium 156).** Opening **pre-activates the first selectable option** (`aria-activedescendant` → first) across all three observable open paths: **(a)** focus-triggered open (focusing a never-focused single-mode combobox), **(b)** closed-and-focused keyboard reopen (ArrowDown on a closed+focused combobox), and **(c)** pointer open (clicking the control). **Multi mode opens with NO pre-active option** (also observed). The Task-1 jsdom "no initial active" result does not reproduce in a real browser.
- **Attribution (T2-F02).** The corpus of focus/open sequences differs between the jsdom and browser harnesses (e.g. focus-triggered opening, the closed-then-keyboard reopen path, and pointer effects). This reference does **not** attribute the discrepancy to a single, unproven cause (it is **not** asserted to be "a jsdom artifact" or any specific harness defect). The real-browser result is preserved as the observation of record; the differing sequences are characterized per path above rather than collapsed into one claimed cause.
- **Evidence.** Task 1 KBD-001 open-without-initial-active case; Task 2 `keyboard-accessibility.t2.spec.ts` — T2-02 "ArrowDown on a closed+focused combobox opens it and activates the first option" and T2-09 "P1.3-D03: opening pre-activates the first option across focus-, keyboard-, and pointer-open"; `W1-P1.3-T2-BROWSER-EVIDENCE.json`.
- **Class:** Observation (browser behavior pre-activates the first option; a difference from any particular APG example is not, by itself, nonconformance).
- **Disposition.** **Accepted as an observation, not a defect.** Real-browser behavior is the characterization of record for each open path; no root cause is assigned to the jsdom discrepancy. **No production change; no ADR.**

### P1.3-D04 — (WITHDRAWN) Tab closes the popup but does not advance DOM focus

> **Status: WITHDRAWN (W1-P1.3-T2-R, T2-F01).** This candidate was proposed in the original Task-2 evidence and is **retracted**. It rested on a test that appended its comparison button **before** the select, so `document.activeElement === BODY` was simply the end-of-document Tab fallback, not a focus-transfer defect. The comparison button was never the next sequentially-tabbable element, and the test asserted only inequality with that button's id (never that focus was `BODY`).

- **Corrected observation (real browser — Chromium 156; T2-R).** With a genuinely-tabbable `<button id="after-select">` mounted **after** the select: (1) **control case** — Tab from a **closed** combobox advances focus to the next sequential tabbable (`document.activeElement` = the following button); (2) Tab from an **open** combobox **closes** the popup *and* advances focus to the next tabbable (`document.activeElement` = the following button, **not** `BODY`). Real Tab navigation therefore **works normally**; there is no focus-transfer defect to record.
- **Evidence.** Task 2 `keyboard-accessibility.t2.spec.ts` — T2-03 "Tab from a closed combobox advances to the next tabbable (control case)" and "Tab from an open combobox closes it AND advances to the next tabbable"; `W1-P1.3-T2-BROWSER-EVIDENCE.json` (`deviationReassessment.P1.3-D04` = WITHDRAWN; `t2rCorrections.T2-F01`).
- **Class:** Withdrawn (disproven; not a defect).
- **Disposition.** **WITHDRAWN — not added to the deviation register.** Tab focus transfer is normal in a real browser. **No production change; no ADR.**

| ID | Class | Disposition (T1-R) | Owner of the eventual decision |
| --- | --- | --- | --- |
| P1.3-D01 | Observed public-contract limitation | Characterized; design decision deferred | P1.3 recorded / future public-contract design |
| P1.3-D02 | Diagnostic | Retained as Diagnostic pending browser a11y check | P1.3 / P1.4+ a11y verification |
| P1.3-D03 | Observation (not a defect) | Accepted as observation pending real-browser/APG assessment | P1.3 / future a11y conformance |

---

## W1-P1.3 Task 2 — real-browser reassessment of P1.3-D01/D02/D03 (D04 withdrawn by T2-R)

Recorded during W1-P1.3 Task 2 real-browser keyboard + accessibility verification (Chromium 156.0.8078.4; evidence: `tests/e2e/w1-p1-3-t2/keyboard-accessibility.t2.spec.ts`, `W1-P1.3-T2-BROWSER-EVIDENCE.json`). **No behavior was repaired; no production code changed.** The Task-1 deviation bodies above now carry the reconciled wording; this table records the final status.

| ID | Task-1 status | Task-2 (browser) status | Meaning |
| --- | --- | --- | --- |
| P1.3-D01 | Observed public-contract limitation | **Confirmed** | Close detail is `{}`; Escape and Tab are indistinguishable in Chromium. Design decision still deferred. |
| P1.3-D02 | Diagnostic (pending browser check) | **Resolved (DOM + AX)** | The listbox is the aria-busy target; when genuinely busy it reflects `aria-busy="true"` (DOM) and the listbox AX node reports `busy=true`. The legacy host attribute is intentionally inert. (T2-F03) The AX claim is backed by an explicit AX assertion. |
| P1.3-D03 | Observation (pending browser check) | **Browser observation accepted; cause withheld** | Real browser pre-activates the first option across focus-, keyboard-, and pointer-open. The jsdom discrepancy is characterized per path but is **not** attributed to a single cause (T2-F02). Observation, not a defect; APG difference ≠ nonconformance. |
| P1.3-D04 | — (proposed in original Task-2) | **WITHDRAWN (T2-F01)** | With a correctly-ordered next-tabbable, Tab advances focus normally from closed and open states. The original BODY result was an end-of-document fallback from a mis-ordered comparison button. Not a defect; retracted. |

### W1-P1.3-T2-R note (correction)

Technical Lead review conditionally accepted Task 2 and directed a bounded correction (**T2-R**). **(T2-F01)** The Tab-focus test is rebuilt: the comparison button is now mounted **after** a freshly-mounted select, a closed-combobox control case is added, and the **actual** focus destination is asserted. Real Tab navigation advances focus normally → **P1.3-D04 is withdrawn** (retracted, not carried). **(T2-F02)** The D03 observation is preserved but its root cause is **withheld**; the three observable open paths (focus-triggered, closed+focused keyboard reopen, pointer) are characterized separately and the jsdom discrepancy is not labeled an "artifact". **(T2-F03)** The D02 genuine-busy reflection now carries a supported Chromium **AX** assertion (listbox AX `busy=true`) in addition to the DOM `aria-busy` reflection. **Reproducibility:** T2-01 enforces the recorded Chromium build (`156.0.8078.4`) for certification; an `SMILODON_T2_CHROMIUM` run is explicitly flagged as an override run. **No production code changed; no previously-accepted P1.2 or P1.3 Task 1 test changed; traceability record count (112) unchanged.**

**Screen-reader note.** The accessibility assessments here are based on the **Chromium accessibility (AX) tree** only (roles, names, states, `aria-*` relationships). They establish that the AX *representation* is correct; they do **not** assert screen-reader compatibility (NVDA/JAWS/VoiceOver), which is out of scope for W1-P1.

**Coverage.** No deviation is closed as "defective". D02 is resolved (DOM + AX); D03 is accepted as a browser observation with the jsdom cause withheld; D01 is confirmed; **D04 is withdrawn**. The traceability record count (112) is unchanged; only D01/D02/D03 narrative notes are clarified.

---

## W1-P1.3 Task 3 — keyboard selection edge-case observations (P1.3-D05 / P1.3-D06)

Recorded during W1-P1.3 Task 3 keyboard *selection* characterization (Chromium 156.0.8078.4; evidence: `tests/e2e/w1-p1-3-t3/keyboard-selection.t3.spec.ts`, `W1-P1.3-T3-KEYBOARD-SELECTION-EVIDENCE.json`). **No behavior was repaired; no production code changed; no record was upgraded.** These are new candidate observations raised by Task 3, pending Technical Lead disposition. Neither authorizes a production change during W1-P1; no ADR is opened.

### P1.3-D05 — `Shift+Home` / `Shift+End` selects only the boundary endpoint (not the contiguous range)

- **Observation.** In a multi-select combobox, pressing `Shift+Home` moves the active option to the first selectable option and selects **only that endpoint**; `Shift+End` likewise selects **only the last option**. Neither extends the selection to the full range from the anchor to the boundary. Example (items a..f, active 'b'): `Shift+End` → active 'f', selection `['f']` (**not** `['a'..'f']` or `['b'..'f']`); `Shift+Home` from 'b' → active 'a', selection `['a']`.
- **Contrast.** `Shift+Arrow` *does* extend the contiguous range (T3-01); only the boundary keys collapse to the endpoint. This differs from spreadsheet-style "extend-to-boundary" semantics.
- **Status.** Observation (candidate). Characterized in real Chromium; not classified a defect; design intent to be confirmed. No production change.
- **Evidence.** `keyboard-selection.t3.spec.ts` — T3-02 "Shift+End from a mid option selects only the last option (endpoint-only)", "Shift+Home from a mid option selects only the first option (endpoint-only)", "Shift+Home then Shift+End reports each endpoint".

### P1.3-D06 — `selectedOptions.placement='selected-first'` does not reorder the rendered options or keyboard navigation

- **Observation.** With `selectedOptions.placement:'selected-first'` and a prior selection (e.g. `{e,c}`), the rendered option DOM order remains **registry order** (`a,b,c,d,e,f`) — it is **not** reordered selected-first. Keyboard navigation also follows registry order: open lands on the first selected key in registry order ('c'), then `ArrowDown` → 'd' → 'e'. `placement:'original'` behaves identically (baseline comparison).
- **Scope.** Characterizes the observed configuration only; the `selected-first` projection does not manifest as a DOM reorder or a navigation reorder at this configuration. If a different path (e.g. a distinct projection render) is intended, it is not exercised by keyboard navigation here.
- **Status.** Observation (candidate). Characterized; not repaired; intent to be confirmed before W1-P1 closure. No production change.
- **Evidence.** `keyboard-selection.t3.spec.ts` — T3-05 "selected-first keeps DOM option order at registry order with a selection", "original placement also navigates registry order (baseline comparison)".

| ID | Class | Disposition (Task 3) | Owner |
| --- | --- | --- | --- |
| P1.3-D05 | Observation (candidate) | Endpoint-only boundary range; characterized, design decision deferred | P1.3 recorded / future selection-design |
| P1.3-D06 | Observation (candidate) | selected-first does not reorder DOM/navigation; intent to confirm | P1.3 recorded / future rendering-design |

**Coverage.** Task 3 adds real-Chromium keyboard-selection characterization (T3-01..T3-10). No deviation is closed as "defective"; D05/D06 are new observations pending review. The traceability record count (112) is unchanged.
