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

- **Observation.** When a currently-selected item is removed from the loaded set via `setItems()` (the value no longer appears in any loaded record), the selection is **not** cleared. `getSelectedEntries()` falls back to the internal `_selectedRecordsByKey` cache, so `getSelectedValues()` / `getSelectedItems()` continue to report the detached value, even though it no longer renders among options. Re-adding an item with the same value re-associates it (as a new instance) and it renders again.
- **Evidence.** `packages/core/tests/w1-p1-2-identity-policy-matrix.spec.ts` ("detached selected value is RETAINED..." and re-selection tests).
- **Class:** Observed (not previously asserted).
- **Risk.** A consumer that removes an option from `setItems` expecting its selection to be dropped will instead keep a "phantom" selected value that is not visible in the list. Forms bindings must reconcile removed values explicitly (e.g. `setSelectedValues`), not rely on `setItems` to prune selection.
- **Disposition.** Characterized; recorded for P1.2 Task 3 (state/clear API matrix) to confirm whether `clear()`/`setSelectedValues([])` is the intended pruning path. No production change in W1-P2.

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
