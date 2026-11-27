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

## Summary

| ID | Class | Blocking for later increments? | Owner increment |
| --- | --- | --- | --- |
| DEVIATION-01 | Internal (process) | No | P1.6 (provenance) |
| DEVIATION-02 | Unknown | Yes — characterize before pagination extraction | P1.5 |
| DEVIATION-03 | Unknown | Yes — pin before async extraction | P1.5 |
| DEVIATION-04 | Unknown | Yes — pin before selection extraction | P1.2 |
| DEVIATION-05 | Internal (quirk) | No | P1.4 |
| DEVIATION-06 | Internal | Guidance only | P1.2 |
