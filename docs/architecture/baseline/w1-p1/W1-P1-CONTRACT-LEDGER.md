# W1-P1 Public Behavioral Contract Ledger

**Increment:** W1-P1.1 — Public contract ledger and traceability skeleton
**Correction:** W1-P1.1-R — Inventory and traceability reconciliation (documentation only)
**Branch:** `codex/w1-p1-characterization-7e3adf7`
**Baseline of record:** `7e3adf77545f8e1b2b4f85949684d7d91b84456b`
**Primary source:** `packages/core/src/components/enhanced-select.ts` (**9,109 lines**), plus `select-option.ts` (634), `types.ts` (183), `config/global-config.ts` (528), and the data-loading modules it depends on.
**Status:** inventory + reconciled traceability. This is **not** a compatibility freeze and **not** approval of any behavior. Untested contracts are recorded as gaps, not as certified behavior.

> **W1-P1.1-R note.** This revision reconciles the inventory counts to a single counting convention, completes the configuration-default inventory, and gives **every** contract ID a precise source locator. The machine-readable matrix `W1-P1-TRACEABILITY.json` now carries **one record per ledger ID (100 records)**. See section 11 for the reconciliation counts. No production source was modified.

> **W1-P1.2-R note (Task 5 closure).** Sections 3-9 carry the accumulated W1-P1.2 coverage annotations. Section 8 now summarizes **all ten** deviations with owner + status; sections 13-14 consolidate the accepted Task 1-4 selection characterization into a single reviewable contract and record the W1-P1.2 closure summary (including the T4-F01/T4-F02 errata corrections). The coverage distribution is unchanged at Existing 38 · Partial 17 · Diagnostic 41 · Missing 4 = **100**; no `Partial` was upgraded without full path coverage, and no production source was modified.

> **W1-P1.2-T5-R note (documentation-only).** The final closure review required three corrections. (T5-F03) The programmatic-vs-interaction statements in §13.1 and §13.4 are now **scoped to the characterized `setSelectedValues()` and `clear()` paths and the characterized interaction surfaces**; they are no longer phrased as a universal guarantee. (T5-F02) DEVIATION-08's value-based reattachment claim is marked superseded in `W1-P1-DEVIATIONS.md`; key-based reattachment is authoritative. (T5-F01) The closure report's increment-to-commit table now carries complete, ancestry-verified SHAs. Follow-up review amendments (T5-R-F01/F02) further bound the §13.1 consolidated rules to the characterized operations and synchronize the evidence JSON lineage with the closure report. No executable code, test, or contract ID changed.

> **W1-P1.3 Addendum note (documentation-only; addendum precedes characterization tests).** W1-P1.3 is split into two tasks. **Task 1** is *keyboard navigation and focus/ARIA chronology*; it is scoped to the thirteen existing **P1.3-owned** contract IDs (API-030, 031, 040, 041; EVENT-002, 003; ATTR-001..003, 010, 011, 020; LIFECYCLE-006) **plus** the new **KBD-001..012** contract IDs introduced in §15. Per the Technical Lead's directive this Addendum is committed **before** any W1-P1.3 characterization test is written, so the ledger matches the planned test surface. This increment **does not** modify production source, does **not** repair any observed behavior, and does **not** upgrade any coverage class (all new KBD IDs enter as `Diagnostic`). §15 records the Task-1 scope, the KBD contract table, the empirically observed baseline behavior captured during authoring, and the resulting deviation candidates (P1.3-D01..D03).

> **W1-P1.3-T1-R note (documentation/comment-only reconciliation).** Technical Lead review conditionally accepted Task 1 and directed a narrow evidence reconciliation (**T1-R**). (T1-F01) Task 1 exercised **eleven** of the thirteen existing P1.3-owned IDs; **API-040 (`setError`) / API-041 (`clearError`) were deliberately NOT exercised** — their error-state behavior is already characterized by the P1.2-T3-R error-state evidence, and no duplicate assertions were added. §15.2, §15.5, and §15.6 are reconciled accordingly. (T1-F02) The `LIFECYCLE-006` case asserts **observable equal-value stability**, not proof of the internal `attributeChangedCallback` early-return branch (no private-state instrumentation). (Deviations) **P1.3-D01** is promoted into `W1-P1-DEVIATIONS.md` as an *observed public-contract limitation* (characterized; design decision deferred); **P1.3-D02** is retained as `Diagnostic` pending a browser a11y check; **P1.3-D03** is accepted as an **observation, not a defect**, pending a real-browser/APG assessment. No assertion logic, production source, or traceability distribution (112 records) changed; the 45 characterization tests and all P1.2 specs remain intact.

## 0. Purpose and reading rules

This ledger is a source-grounded inventory of every externally observable contract of the `EnhancedSelect` custom element and the public surfaces that surround it. It lets W1-P1.2-P1.6 write black-box characterization tests against a known list instead of re-discovering the surface each time.

Rules used throughout:

1. **Documenting behavior is not approving it.** A row marked `Observed` describes what the code does today. A defect or quirk observed here is recorded in section 8 / `W1-P1-DEVIATIONS.md` and **must not** be locked into a normative test without an explicit decision.
2. **Black-box is the primary authority.** Tests in later increments must drive the component through public methods, rendered DOM (shadow root), emitted events, and real adapter consumers. Private-state assertions may support diagnosis but must not define architecture.
3. **Engine ownership is authoritative.** The headless engine owns selected keys and the active key. Compatibility projections (`selectedIndices`, `selectedItems`, `activeIndex`) are **internal implementation detail** and must never become independent state authorities in tests.
4. **Certification is not discovery.** Passing characterization tests do not constitute full W1-P1 approval.
5. **One row = one contract ID = one JSON record.** Every row in sections 2-7 has exactly one matching record in `W1-P1-TRACEABILITY.json`, and vice-versa (R-01).

**Contract classes:**

| Class | Meaning |
| --- | --- |
| `Documented` | Described in committed docs / public types / tests as an intended surface. |
| `Observed` | Evident in source and/or existing tests, but not formally guaranteed. |
| `Internal` | Implementation detail; listed for ownership clarity only. **Not** a public contract. |
| `Unknown` | Unestablished or contradictory in available evidence. Needs a characterization test. |

**New test required:** `Yes` (no adequate black-box coverage yet) - `No` (existing coverage adequate; referenced) - `Diagnostic` (only private/perf coverage exists; a black-box test is still needed).

**Coverage class (matrix):** `Existing` - `Partial` (some contract paths covered by an external test, remaining paths outstanding) - `Diagnostic` - `Missing`. `Partial` was introduced in W1-P1.2-T1-R so partial black-box evidence is not overstated as full contract coverage.

---

## 1. Provenance and source locations

| Item | Location |
| --- | --- |
| Component class | `packages/core/src/components/enhanced-select.ts` - `class EnhancedSelect extends HTMLElement` |
| Component registration | `enhanced-select.ts:9107-9108` - `customElements.define('enhanced-select', EnhancedSelect)` |
| Event map | `packages/core/src/types.ts:139` - `SelectEventsDetailMap`; `:154` - `SelectEventName`; `:40` - `SelectEventDetail` |
| Other event details | `types.ts` - `OpenEventDetail:49`, `CloseEventDetail:50`, `SearchEventDetail:51`, `PageLoadedEventDetail:56`, `ErrorEventDetail:57`, `ChangeEventDetail:58`, `LoadMoreEventDetail:63`, `RemoveEventDetail:64`, `ClearEventDetail:65`, `EmptyStateChangeDetail:77`, `DiagnosticEventDetail:132` |
| Global config interface | `packages/core/src/config/global-config.ts:281` - `GlobalSelectConfig` |
| Global config defaults | `packages/core/src/config/global-config.ts:335-439` - `defaultConfig` |
| Data-loading types | `packages/core/src/data-loading/public-types.ts` |
| Engine | `packages/core/src/engine/*` |
| Registration / exports | `packages/core/src/index.ts` / component modules (browser-only registration) |

> **Line numbers are pinned to the baseline of record** (`7e3adf7`). `enhanced-select.ts` contains multiple near-identical emission/part sites (see 11.4); each locator below was verified at baseline.

> **Prior-art reference, not a dependency.** `docs/architecture/W1-P0-CONTRACT-LEDGER.md`, `W1-P0-BASELINE.md`, `W1-P0-OWNERSHIP-MAP.json`, and `W1-P0-OWNERSHIP-MAP.md` exist as **uncommitted, untracked** files in the main worktree, anchored to a different baseline (`c49d5add`, `enhanced-select.ts` = 7,284 lines). They are **not present on this branch at `7e3adf7`**. This ledger supersedes them and is self-contained. See DEVIATION-01 and section 12 (Package Boundary and Historical Crosswalk).

---
## 2. Public methods and properties

All members reachable on an `EnhancedSelect` instance unless noted. `HTMLElement` lifecycle callbacks are in section 6.

### 2.1 Configuration & renderer properties

| Contract ID | Behavior | Source (`enhanced-select.ts`) | Existing evidence | Status | New test |
| --- | --- | --- | --- | --- | --- |
| API-001 | `classMap: ClassMap \| undefined` get/set. Changed map re-renders when connected; equal maps are no-ops. | 473-491 | `custom-active-class-map`, `styling-contract` | Observed | No (verify round-trip + re-render) |
| API-002 | `groupHeaderRenderer` get/set. Setting re-renders when connected. | 497-508 | `styling-contract` | Observed | Diagnostic |
| API-003 | `optionRenderer: OptionRendererFn \| undefined` get/set. Custom per-option DOM. | 6500-6513 | `enhanced-option-renderer` | Observed | No |
| API-004 | `loadedItems: unknown[]` getter. Current loaded items. | 6628-6630 | widely used | Observed | No |

### 2.2 Selection API

| Contract ID | Behavior | Source | Existing evidence | Status | New test |
| --- | --- | --- | --- | --- | --- |
| API-010 | `getSelectedItems(): unknown[]` - in selected order. | 6620-6623 | `select-selection`, `selected-options-*` | Observed | No |
| API-011 | `getSelectedValues(): unknown[]` - via `_getItemValue` (`serverSide.getValueFromItem` or `.value ?? item`). | 6635-6637 (helper 1271-1273) | `select-selection` | Observed | No |
| API-012 | `async setSelectedValues(values): Promise<void>` - **async**; local path replaces selection (unblocked matches) then renders + emits `change`; server path sets busy, awaits `fetchSelectedItems`, guards stale generation. | 6642-6663 (`_loadSelectedItemsByValues` 6668-6695) | `select-selection`, `phase-1-search-pagination-characterization` | Observed | **Yes** (exact ordering + stale-gen + error; P1.2) |
| API-013 | `clear(): void` - clears selection (not search). Emits `change`. | 6697-6706 | `select-selection` | Observed | **Yes** (emitted-event set/order; P1.2) |
| API-014 | `clearSearch(): void` - resets query, re-renders; acknowledged remote/hybrid routes through `_handleSearch('')`. | 6709-6728 | `search-ctrl-a`, `search-space-input` | Observed | **Yes** (local + acknowledged; P1.2) |

### 2.3 Items API

| Contract ID | Behavior | Source | Existing evidence | Status | New test |
| --- | --- | --- | --- | --- | --- |
| API-020 | `setItems(items): void` - replaces loaded items, rebuilds registry, re-renders. | 6517-6549 | `smoke`, many | Observed | No |
| API-021 | `setGroupedItems(groupedItems): void` | 6609-6618 | grouping tests | Observed | No |

### 2.4 Popup API

| Contract ID | Behavior | Source | Existing evidence | Status | New test |
| --- | --- | --- | --- | --- | --- |
| API-030 | `open(): void` - opens popup. | 6733-6735 | `interaction`, `dropdown-open-scroll` | Observed | No (verify idempotency + emit) |
| API-031 | `close(): void` | 6740-6742 | `interaction` | Observed | No |
| API-032 | `updateConfig(config: SelectInstanceConfig): void` - validates `dataLoading`/`selectedOptions`/`scrollToSelected`; may emit `dataLoadingConfigError`; handles mode/enabled changes. | 6747-6950 | `public-config-integration`, `phase-2e-*` | Observed | **Yes** (invalid-config emission timing) |

### 2.5 Error / validation API

| Contract ID | Behavior | Source | Existing evidence | Status | New test |
| --- | --- | --- | --- | --- | --- |
| API-040 | `setError(message): void` - sets error state, reflected to accessible description. | 7281-7290 | partial | Observed | Yes |
| API-041 | `clearError(): void` | 7292-7300 | partial | Observed | Yes |
| API-042 | `setRequired(required): void` - dispatches SELECTION_CONFIG_CHANGED required. | 7302-7313 | `select-selection` | Observed | Yes |
| API-043 | `validate(): boolean` | 7315-7325 | `select-selection` | Observed | Yes |

### 2.6 Introspection / capability API

| Contract ID | Behavior | Source | Existing evidence | Status | New test |
| --- | --- | --- | --- | --- | --- |
| API-050 | `getKnownLimitations(): LimitationState[]` | 6373-6382 | `capabilities-tracking` | Observed | No |
| API-051 | `setLimitationPolicies(policies)` | 6384-6398 | `capabilities-tracking` | Observed | No |
| API-052 | `getTrackingSnapshot(): TrackingSnapshot` | 6400-6406 | `capabilities-tracking` | Observed | No |
| API-053 | `clearTracking(source?)` | 6408-6419 | `capabilities-tracking` | Observed | No |
| API-054 | `getCapabilities(): SelectCapabilitiesReport` - emitted list (`6433`, 11 events) **omits `pageLoaded`** (DEVIATION-02). | 6421-6448 | `capabilities-tracking` | Observed | **Yes** (truthfulness) |
| API-055 | `getEmptyStateContext(): EmptyStateContext \| null` | 6451-6454 | `empty-state-slot` | Observed | No |

### 2.7 Data-loading (acknowledged) API

| Contract ID | Behavior | Source | Existing evidence | Status | New test |
| --- | --- | --- | --- | --- | --- |
| API-060 | `startDataLoading(): void` - deferred until connected if needed. | 6960-6991 | `phase-2e-acknowledged-data-loading` | Observed | Yes (deferred start) |
| API-061 | `getDataLoadingState(): DataLoadingStateSnapshot` | 6993-7042 | `phase-2e-*`, `phase-2f-*` | Observed | No |
| API-062 | `completeDataRequest(completion): DataRequestCompletionResult` - **sync** return; validates shape; projects accepted snapshots async. | 7044-7120 | `phase-2e-acknowledged-data-loading` | Observed | **Yes** (return matrix + async projection) |

> Request/response payload types for the acknowledged path live in `data-loading/public-types.ts`: `SearchDataRequest:70`, `LoadMoreDataRequest:75`, `DataRequestCompletion:97`, `DataRequestCompletionResult:134`, `DataLoadingStateSnapshot:161`.

> `setSelectedValues` ordering is a high-risk forms boundary. The canonical local path is `_requestSelectionReplacement()` (`1357`) -> `_renderOptions()` / `_updateInputDisplay()` -> `_emitChange()` (`6487-6495`). `_emitChange` emits `change` **before** invoking `callbacks.onChange`; **no `select` event is emitted** on that programmatic path. P1.2 must lock this observed event set/order and also assert the events that do **not** occur (see section 6, P1.2 watchpoint).

---

## 3. Events

All component events are dispatched via `_emit` (`6278`) as `new CustomEvent(name, { detail, bubbles: true, composed: true })`. Acknowledged events use `_dispatchAcknowledgedEvent` (`7740`) with the same options. **bubbles + composed is guaranteed by source.** `_emit` records to tracking (except `diagnostic`).

### 3.1 Events in `SelectEventsDetailMap`

| Contract ID | Event | Declared detail (`types.ts`) | Emission site(s) | Callback | Status | New test |
| --- | --- | --- | --- | --- | --- | --- |
| EVENT-001 | `select` | `SelectEventDetail` (40) `{ item, index, value, label, selected, multi? }` | 5296, 5504, 5633 | `onSelect(detail)` | Observed | Yes (payload + order vs `change`) |
| EVENT-002 | `open` | `OpenEventDetail` (49) `{}` | 4399 | `onOpen()` | Observed | Yes |
| EVENT-003 | `close` | `CloseEventDetail` (50) `{}` | 4424 | `onClose()` | Observed | Yes (reasons) |
| EVENT-004 | `search` | `SearchEventDetail` (51) `{ query, results?, count? }` | 5043 (local); 7715 (acknowledged) | - | Observed | Yes (both paths; DEVIATION-03) |
| EVENT-005 | `pageLoaded` | `PageLoadedEventDetail` (56) `{ page, count }` | **none** | - | **Unknown** | Yes (DEVIATION-02) |
| EVENT-006 | `error` | `ErrorEventDetail` (57) `{ message, cause? }` | 6274 | `onError(error)` | Observed | Yes |
| EVENT-007 | `change` | `ChangeEventDetail` (58) `{ selectedItems, selectedValues, selectedIndices }` | 6494 | `onChange(items, values)` | Observed | Yes (all emit paths) |
| EVENT-008 | `loadMore` | `LoadMoreEventDetail` (63) `{ page, items }` | 6251 | - | Observed | Yes |
| EVENT-009 | `remove` | `RemoveEventDetail` (64) `{ item, index }` | 5704 | - | Observed | Yes |
| EVENT-010 | `clear` | `ClearEventDetail` (65) `{ clearedSelection, clearedSearch }` | 7244 | - | Observed | Yes |
| EVENT-011 | `emptyStateChange` | `EmptyStateChangeDetail` (77) `{ context }` | 6468 | - | Observed | Yes |
| EVENT-012 | `diagnostic` | `DiagnosticEventDetail` (132) `{ timestamp, source, name, detail? }` | 7092, 7960 | - | Observed | Yes |

### 3.2 Acknowledged events (NOT in `SelectEventsDetailMap`)

| Contract ID | Event | Detail | Source (`enhanced-select.ts`) | Status | New test |
| --- | --- | --- | --- | --- | --- |
| EVENT-020 | `dataProjection` | `DataProjectionEventDetail` (`complete` / `failed`) | 7978 | Observed | Yes |
| EVENT-021 | `dataRequestCancel` | `DataRequestCancelNotification { requestId, queryGeneration, reason }` | 7679 | Observed | Yes |
| EVENT-022 | `dataLoadingConfigError` | `{ issues }` | 6950, 7130 | Observed | Yes |

> `pageLoaded` is declared in the event map but neither `getCapabilities().events.emitted` (`6433`) nor runtime source emits it. Characterize (DEVIATION-02); do not silently fix.

---
## 4. Attributes

### 4.1 Observed attributes (`static get observedAttributes`)

Registered at `enhanced-select.ts:219-221` - `['aria-label', 'aria-description', 'aria-busy']`.

| Contract ID | Attribute | Behavior | Source | Status | New test |
| --- | --- | --- | --- | --- | --- |
| ATTR-001 | `aria-label` | Re-sync combobox + listbox a11y. | 219-221; `attributeChangedCallback` 637-646 | Observed | Yes |
| ATTR-002 | `aria-description` | Re-sync combobox a11y. | 219-221; `attributeChangedCallback` 637-646 | Observed | Yes |
| ATTR-003 | `aria-busy` | Re-sync listbox a11y only. | 219-221; `attributeChangedCallback` 637-646 | Observed | Yes |

Equal old/new values are ignored (LIFECYCLE-006).

### 4.2 Host attributes written by the component

| Contract ID | Attribute | When | Source | Status | New test |
| --- | --- | --- | --- | --- | --- |
| ATTR-010 | `dir` (`ltr`/`rtl`) | `connectedCallback` via `_syncDirectionConfig` from `config.direction`. | 1733 (`setAttribute('dir', ...)`); 1730-1735 | Observed | Yes |
| ATTR-011 | `data-open="true"` | Present while open; removed on close. | set 4389; removed 4416 | Observed | Yes |
| ATTR-012 | `data-custom-arrow="true"` | Set when a custom arrow is slotted (via `slot[name="arrow"]` `slotchange`). | 2046 / 2048 (handler 2041-2049) | Observed | Yes |
| ATTR-013 | `style.display='block'` | Forced on connect (Angular workaround; DEVIATION-05). | 598 | Observed | No |

### 4.3 Element-level `data-*` attributes (shadow DOM, observable)

| Contract ID | Attribute | Target | Source | Status |
| --- | --- | --- | --- | --- |
| ATTR-020 | `data-placement` (`bottom`/`top`) | dropdown | 1728 (`_dropdown`), 4418 | Observed |
| ATTR-021 | `data-motion="closing"` | dropdown (and badge `data-motion="exiting"`) | 4719 (dropdown); 5802 (`chip-exiting`) | Observed |
| ATTR-022 | `data-multi-scroll-mode`, `data-drag-scroll` | input-container | 1807-1808 (removed 1776-1777) | Observed |
| ATTR-023 | `data-virtual-spacer` | spacer element | 7505 (`_createGuardedSpacer`) | Observed |

Observable but weaker than parts; classify `Observed`. Treat names as testable but not a formal freeze.

---

## 5. CSS parts and slots

### 5.1 Shadow parts (`::part()`)

**Grouped contract IDs (11).** Each grouped ID is one contract row; the JSON record additionally lists every distinct part token and its source site. **Distinct part tokens: 19** (see 11.3).

| Contract ID | Part token(s) | Element | Source (`enhanced-select.ts` unless noted) |
| --- | --- | --- | --- |
| PART-001 | `button` | `.input-container` (control shell) | 1185 |
| PART-002 | `input` | `<input>` text layer | 1908 |
| PART-003 | `listbox` | `.select-dropdown` | 1995 |
| PART-004 | `arrow` | arrow svg container | 2036 |
| PART-005 | `clear-button` | clear control button | 2058 |
| PART-006 | `clear-icon` | clear icon span | 2062 |
| PART-007 | `option` | option element | 8829, 8898 (also `select-option.ts:336`) |
| PART-008 | `group-header` | group header | 8541 |
| PART-009 | `chip`, `chip-label`, `chip-remove`, `chip-remove-icon`, `chip-exiting` | multi-select chips | chip 5752/5834/5851; chip-label 5837; chip-remove 5894; chip-remove-icon 5883; chip-exiting 5802 |
| PART-010 | `no-results` | empty/no-results element | 6473 |
| PART-011 | `loading`, `loading-content`, `loading-icon`, `loading-message`, `loading-spinner` | busy bucket / searching state | loading 8363 & 8467; loading-icon 8369; loading-spinner 8376; loading-message 8385; loading-content 8392 |

Status: all `Observed`. P1.4 must confirm each is reachable in rendered DOM and pin internal DOM structure only insofar as parts expose it. Note: `select-option.ts` additionally sets `part="checkmark"` (`460`) and `part="option"` (`336`); `checkmark` is out of the current grouping and flagged in 11.3 as a candidate future token, not a certified W1-P1 part.

### 5.2 Named slots

| Contract ID | Slot | Purpose | Source |
| --- | --- | --- | --- |
| SLOT-001 | `arrow` | Custom dropdown arrow (presence sets `data-custom-arrow`). | 2035 (fallback svg 2036-2038; slotchange 2041-2049) |
| SLOT-002 | `empty-state` | Custom empty state content. | 6474-6479 |
| SLOT-003 | `loading-content` | Custom busy-bucket content. | 8393-8395 |
| SLOT-004 | `loading-icon` | Custom busy-bucket icon. | 8371-8379 |

Status: `Observed`. Existing evidence: `custom-arrow-slot`, `empty-state-slot`, `busy-bucket-customization`. P1.4 to test content replacement + `slotchange`.

---

## 6. Lifecycle contracts

| Contract ID | Behavior | Source | Existing evidence | Status | New test |
| --- | --- | --- | --- | --- | --- |
| LIFECYCLE-001 | Constructor builds shadow DOM, styles, DOM, listeners, observers, ARIA. **Must not** set host attributes. | constructor (414-470) | `shadow-dom`, `lifecycle` | Documented | No |
| LIFECYCLE-002 | `connectedCallback`: register instance, CONNECT dispatch, **create `AbortController`**, attach document `pointerdown` (via signal) **and `_inputContent` scroll + window resize/scroll listeners** (W1-P0.2B fix), sync direction, re-render if items present, emit `onOpen` if configured. | 572-635 | `lifecycle`, `memory-lifecycle`, phase-4 lifecycle | Observed | **Yes** (black-box reconnect + listener ownership) |
| LIFECYCLE-003 | `disconnectedCallback`: coordinator disconnect, unregister, close if open, DISCONNECT dispatch, **abort connection controller**, **remove scroll listener**, bump `_asyncGeneration`, cancel rafs/timers, destroy guarded virtualizer, remove option/spacer children, disconnect observers, teardown global-style mirroring. | 648-768 | `memory-lifecycle`, phase-4 lifecycle | Observed | **Yes** (resource cleanup) |
| LIFECYCLE-004 | Reconnection restores connection-scoped resources deterministically; disconnection releases them. | connect/disconnect | phase-4 lifecycle | Observed | **Yes** (the W1-P0.2B invariant) |
| LIFECYCLE-005 | Stale async work guarded by `_asyncGeneration` + `isConnected`. | guards in 6668-6695, 7078-7120, etc. | partial | Observed | Yes (P1.5) |
| LIFECYCLE-006 | `attributeChangedCallback` early-returns on equal values. | 637-646 | - | Observed | Yes |

> **Invariant to preserve (accepted W1-P0.2B):** a connected component owns its connection-scoped resources; disconnection releases them deterministically. Binding constraint on all future extraction (LIFECYCLE-004).

> **P1.2 watchpoint.** For programmatic selection via `setSelectedValues()` the working path is `_requestSelectionReplacement()` -> render -> `_emitChange()`. `_emitChange()` emits `change` **before** invoking `callbacks.onChange`, and **no `select` event** is emitted on that path. P1.2 must characterize both the events that occur (which, order, payload) and the events that do **not** occur, where they differ from user interaction; and it must verify Promise settlement ordering separately for successful, failed, and stale async operations.

---
## 7. Configuration defaults

Source: `defaultConfig` - `packages/core/src/config/global-config.ts:335-439`. Defaults are public contract where serialized behavior depends on them.

**Coverage:** the **entire** `defaultConfig` object is now represented. 26 grouped CONFIG IDs complete the inventory, including the previously-missing `selection.removeButtonIcon`, `styles`/`styles.classNames`, `expandable`, and `callbacks` (see 11.2). Every sub-default has an explicit source line range.

| Contract ID | Key | Default | Source (`global-config.ts`) | Status |
| --- | --- | --- | --- | --- |
| CONFIG-001 | `selection.mode` | `'single'` | 337 | Documented |
| CONFIG-002 | `selection.allowDeselect` | `false` | 338 | Documented |
| CONFIG-003 | `selection.disabledOptionBehavior` | `{ selectable:false, hoverable:false, focusable:false }` | 339-343 | Documented |
| CONFIG-004 | `selection.maxSelections` | `0` (unbounded) | 344 | Documented |
| CONFIG-005 | `selection.showRemoveButton` | `true` | 345 | Documented |
| CONFIG-006 | `selection.showSelectedIndicator` | `true` | 346 | Documented |
| CONFIG-007 | `selection.closeOnSelect` | `true` | 348 | Documented |
| CONFIG-008 | `selection.toggleOnTriggerClick` | `true` | 349 | Documented |
| CONFIG-009 | `direction` | `'ltr'` | 351 | Documented |
| CONFIG-010 | `dropdownPlacement.mode` | `'bottom'` (`top`, auto) | 352-354 | Documented |
| CONFIG-011 | `multiSelectDisplay` | `{ mode:'wrap', maxHeight:'160px', overflowX:'hidden', overflowY:'auto', dragScroll:true, scrollToLatestChip:false, scrollToLatestChipBehavior:'smooth' }` | 355-363 | Documented |
| CONFIG-012 | `scrollToSelected` | `{ enabled:true, multiSelectTarget:'first', onOpen:'reveal', behavior:'smooth', block:'nearest' }` | 364-370 | Documented |
| CONFIG-013 | `selectedOptions` | `{ placement:'original', groupedPlacement:'within-group' }` | 371-374 | Documented |
| CONFIG-014 | `loadMore` | `{ enabled:false, itemsPerLoad:3, threshold:100, showLoader:true }` | 375-380 | Documented |
| CONFIG-015 | `busyBucket` | `{ enabled:true, showSpinner:true, showMessage:true, message:'Loading...', minDisplayTime:200, contentMode:'append' }` | 381-388 | Documented |
| CONFIG-016 | `serverSide` | `{ enabled:false, getValueFromItem, getLabelFromItem }` | 392-396 | Documented |
| CONFIG-017 | `infiniteScroll` | `{ enabled:false, pageSize:20, initialPage:1, cachePages:true, maxCachedPages:10, preloadAdjacent:true, scrollRestoration:'auto' }` | 397-405 | Documented |
| CONFIG-018 | `clearControl` | `{ enabled:false, clearSelection:true, clearSearch:true, hideWhenEmpty:true, ariaLabel:'Clear selection and search', icon:'×' }` | 413-420 | Documented |
| CONFIG-019 | `tracking` | `{ enabled:false, events:true, styling:true, limitations:true, emitDiagnostics:false, maxEntries:200 }` | 422-429 | Documented |
| CONFIG-020 | `limitations` | `{ policies:{}, autoMitigateRuntimeModeSwitch:true }` | 430-433 | Documented |
| CONFIG-021 | top-level scalars | `{ enabled:true, searchable:false, placeholder:'Select an option...', virtualize:true, estimatedItemHeight:48 }` | 434-438 | Documented |
| CONFIG-022 | `selection.removeButtonIcon` | `'×'` (chip remove icon; consumed near `enhanced-select.ts:4658`; also `select-option.ts:435`) | 347 | Documented |
| CONFIG-023 | `expandable` | `{ enabled:false, collapsedHeight:'300px', expandedHeight:'500px', expandLabel:'Show more', collapseLabel:'Show less' }` | 406-412 | Documented |
| CONFIG-024 | `styles` | `{ classNames:{} }` (grouped styles object; see CONFIG-025 for the leaf) | 389-391 | Documented |
| CONFIG-025 | `styles.classNames` | `{}` (empty class->token map) | 390 | Documented |
| CONFIG-026 | `callbacks` | `{}` (no default callbacks; `onChange`/`onSelect`/`onOpen`/`onClose`/`onError`/`onClear` are opt-in) | 421 | Documented — **Partial** (`w1-p1-2-t4-interaction-events`: onSelect/onChange/onClear argument shape+ordering characterized; onOpen/onClose/onSearch/onLoadMore/onError outstanding) |

> Data-loading (`dataLoading`) config is validated by `validateDataLoadingConfig` and is **not** part of `defaultConfig`; `_dataLoadingConfig` seeds from `LEGACY_DATA_LOADING_CONFIG = { protocol:'legacy', searchMode:'local', paginationMode:'page', firstPage:1 }`. Characterize in P1.5 (not in the CONFIG-001..026 defaults inventory).

---

## 8. Known deviations

Full detail in `W1-P1-DEVIATIONS.md`. Summary (**all ten** — 01-10 — reconciled at W1-P1.2 Task 5; DEVIATION-01 extended with the archival note - R-07). **Status** is the disposition state at P1.2 closure; **Owner** is the increment that must eventually resolve it.

| ID | Finding (short) | Class | Owner | Status at P1.2 closure |
| --- | --- | --- | --- | --- |
| DEVIATION-01 | Prior W1-P0 ledger was uncommitted/absent on this branch; archival reference only. | Internal (process) | P1.6 | Closed-for-P1.1; archival note in provenance (section 1, 12). |
| DEVIATION-02 | `pageLoaded` declared in event map but never emitted; omitted from capabilities. | Unknown | P1.5 | Open — characterize; ADR candidate. (matrix `EVENT-005`/`API-054` = Missing.) |
| DEVIATION-03 | `search` payload shape (local vs acknowledged) not pinned. | Unknown | P1.5 | Open — pin both payloads. (matrix `EVENT-004` = Diagnostic.) |
| DEVIATION-04 | `setSelectedValues` async ordering not asserted by prior tests. | Unknown | P1.2 | **Characterized** — local + server-fetch success/failure/superseded/disconnected ordering locked by black-box tests (`w1-p1-2-set-selected-values-ordering`, T1-R chronology). Not a defect. |
| DEVIATION-05 | `connectedCallback` forces `style.display='block'`. | Internal (quirk) | P1.4 | Open — characterize; ADR if blocking. (matrix `ATTR-013` = Diagnostic.) |
| DEVIATION-06 | Dev-only projection asserts can throw if tests manipulate legacy projections directly. | Internal | P1.2 | **Guidance-only, honored** — all P1.2 tests drive public API only; no legacy projection is manipulated. Not a behavioral finding to repair. |
| DEVIATION-07 | `setSelectedValues` in single mode collapses to first registry-eligible value. | Unknown (mode-dependent) | P1.2 | **Characterized** — registry-order governs (not request order); recorded, not classified a defect; design disposition open. |
| DEVIATION-08 | Detached selected items are retained after removal from loaded data; reattach is key-based. | Observed | P1.2 | **Characterized** — pruning (clear/`setSelectedValues([])`) and key-based reattachment confirmed; design disposition open. |
| DEVIATION-09 | Detached selection visible to getters but not to `validate()`. | Observed | P1.6 / forms | **Characterized; ADR candidate** — getter/validator inconsistency; validation design decision deferred past W1-P1. |
| DEVIATION-10 | Clear-control reports `clearedSelection: true` while `required` preserves the selection. | Observed | W1-P1.2 Task 4 / forms | **Characterized; ADR candidate** — clear-control reporting design decision deferred past W1-P1. |

---

## 9. Traceability seed for P1.2-P1.6

The machine-readable matrix is `W1-P1-TRACEABILITY.json`. Coverage classes: `Existing` (adequate black-box across the contract's characterized paths) - `Partial` (externally observable test covers some paths; others outstanding) - `Diagnostic` (private/perf only) - `Missing` (no coverage). Every ID in sections 2-7 has exactly one JSON record (R-01). Per-increment rollup:

| Target | Contracts |
| --- | --- |
| P1.1 | API-050..053 |
| P1.2 | API-001, 004, 010, 011, 012, 013, 014, 020, 042, 043, 054; EVENT-001, 007, 010 |
| P1.3 | API-030, 031, 040, 041; EVENT-002, 003; ATTR-001..003, 010, 011, 020; LIFECYCLE-006; **KBD-001..012** (§15) |
| P1.4 | API-002, 003, 021, 055; EVENT-009, 011; ATTR-012, 013, 021, 022, 023; PART-001..011; SLOT-001..004; LIFECYCLE-001..004; CONFIG-001..026 |
| P1.5 | API-032, 060, 061, 062; EVENT-004, 005, 006, 008, 012, 020, 021, 022; LIFECYCLE-005 |

**P1.2 closure view (W1-P1.2 Task 5).** The 14 P1.2-owned contracts and their coverage class at closure. `Partial` is retained where interaction/state paths are characterized but other contract paths remain outstanding — **no `Partial` is upgraded to `Existing`** without full path coverage.

| ID | Coverage | Characterized by |
| --- | --- | --- |
| API-001, API-004 | Existing | (pre-existing round-trip; `verify`) |
| API-010, API-011 | Partial | identity matrix (single/multi/reorder/detached; grouping left to P1.4) |
| API-012 | Existing | `setSelectedValues` local + server-fetch ordering (DEVIATION-04) |
| API-013 | Partial | `clear()` change-only; acknowledged path → P1.5 |
| API-014 | Diagnostic | `clearSearch` local via `search-ctrl-a`; acknowledged → P1.5 |
| API-020 | Partial | `setItems` replace/reorder/detached/duplicate-key; grouping → P1.4 |
| API-042, API-043 | Partial | `setRequired` + `validate()` matrix; detached-selection edge (DEVIATION-09) |
| API-054 | Missing | capabilities truthfulness (`pageLoaded`; DEVIATION-02) → P1.5 |
| EVENT-001, EVENT-007 | Partial | payload + order (pointer/keyboard/remove/clear/programmatic); full APG nav → P1.3 |
| EVENT-010 | Partial | clear-control active-selection paths; active-search clear semantics outstanding |

---

## 10. Coverage summary and gaps

| Area | Existing black-box coverage | Notable gaps |
| --- | --- | --- |
| Selection/identity | `select-selection`, `selected-options-*`, `enhanced-select-selection-parity`, `*-authority` | `setSelectedValues` ordering; duplicate identity; reorder/filter preservation; disabled matrix; selected-first projection ordering; **black-box** (most current coverage is parity/projection-internal) |
| Keyboard/focus/popup/ARIA | `interaction`, `keyboard-page-boundary`, `select-accessibility`, `enhanced-select-accessibility-integration`, `web-accessibility-effects` | Real-browser WAI-ARIA combobox verifications after filter/reorder/disable/reconnect; active-descendant; focus restoration |
| Rendering/renderers/virtualization | `enhanced-option-renderer`, `virtualization-contract`, `selected-options-render-plan`, `custom-arrow-slot`, `empty-state-slot`, `busy-bucket-customization` | Renderer mount/unmount order; option replacement; 64-mounted-option bound; legacy-incremental vs guarded-viewport distinction; CSS part reachability |
| Lifecycle | `lifecycle`, `memory-lifecycle`, phase-4 lifecycle (browser) | **Black-box** resource cleanup; reconnect; stale async in Chromium (Phase 4 is jsdom/diagnostic + pinned container) |
| Async/adapters | `phase-2e-*`, `phase-2f-*`, `phase-1-*`, contracts | Request generations/cancellation/acknowledged completion ordering black-box; real framework adapter fixtures (P1.5) |
| SSR/security | `csp.spec`, `security.ts` | Import-time browser deps; sanitizer boundary; SSR - documented only (P1.6) |

Existing tests are largely **jsdom + private/projection-level**. W1-P1 must add **black-box** characterization (public API + rendered DOM + emitted events) and real-browser coverage where behavior is DOM-dependent. Passing existing suites is necessary but not sufficient for any increment's gate.

---
## 11. Reconciliation counts (W1-P1.1-R)

All counts below are for the baseline source at `7e3adf7` and use one convention: **a contract ID is the granularity unit of the ledger and the JSON matrix.** Sub-items that belong to one logical surface (e.g. a getter/setter pair, several `data-*` attributes, several `::part` tokens) are one grouped ID; their individual tokens are listed inside the record, not as separate IDs.

### 11.1 API (27 IDs, 30 callable/accessor signatures)

| Sub-area | IDs | Count |
| --- | --- | --- |
| Configuration & renderer properties | API-001..004 | 4 (API-001, API-002, API-003 each a get/set pair = 6 signatures; API-004 getter = 1) |
| Selection | API-010..014 | 5 (one callable each) |
| Items | API-020..021 | 2 |
| Popup | API-030..032 | 3 (all callables) |
| Error/validation | API-040..043 | 4 |
| Introspection/capability | API-050..055 | 6 (one callable each) |
| Data-loading | API-060..062 | 3 |
| **Total** | **27 IDs** | **30 signatures** (27 callables + 3 extra for API-001/002/003 getters) |

Distribution of the +3 difference: the four property IDs (API-001..004) contain 7 accessor signatures among them (001 get+set, 002 get+set, 003 get+set, 004 get). The 23 method IDs are exactly 23 callables. **23 + 7 = 30 signatures** across **27 IDs**.

### 11.2 Configuration (26 IDs; full `defaultConfig`)

The 21 grouped IDs from the original P1.1 (CONFIG-001..021) cover every non-`selection`/non-`styles`/non-`expandable`/non-`callbacks` group and the top-level scalars. Four gaps are now explicit per-leaf granular IDs:

| New ID | Represents | Reason split out |
| --- | --- | --- |
| CONFIG-022 | `selection.removeButtonIcon` (`'×'`) | Selection sub-default that was missing from grouped `selection` members (CONFIG-001..008 cover the others). |
| CONFIG-023 | `expandable` group (disabled; height + label defaults) | Whole group was absent from the inventory. |
| CONFIG-024 | `styles` (`{ classNames:{} }`) | Whole group absent. |
| CONFIG-025 | `styles.classNames` (`{}`) | Leaf of CONFIG-024; given its own locator because it is directly consumer-set. |
| CONFIG-026 | `callbacks` (`{}`, all opt-in) | Whole group absent. |

Total CONFIG IDs = **26**. Groups represented = 21 original + 5 granular = 26; every leaf of `defaultConfig` (lines 335-439) maps to exactly one CONFIG ID.

### 11.3 CSS parts (11 grouped IDs, 19 distinct part tokens)

| Grouped ID | Distinct part tokens | Token count |
| --- | --- | --- |
| PART-001 | `button` | 1 |
| PART-002 | `input` | 1 |
| PART-003 | `listbox` | 1 |
| PART-004 | `arrow` | 1 |
| PART-005 | `clear-button` | 1 |
| PART-006 | `clear-icon` | 1 |
| PART-007 | `option` | 1 |
| PART-008 | `group-header` | 1 |
| PART-009 | `chip`, `chip-label`, `chip-remove`, `chip-remove-icon`, `chip-exiting` | 5 |
| PART-010 | `no-results` | 1 |
| PART-011 | `loading`, `loading-content`, `loading-icon`, `loading-message`, `loading-spinner` | 5 |
| **Total** | | **19** |

(9 single-token IDs × 1) + (2 five-token groups × 5) = 9 + 10 = **19 distinct part tokens** across **11 grouped IDs** (PART-001..008 and PART-010 are single-token; PART-009 and PART-011 each hold five tokens). Candidate but not counted: `select-option.ts` `part="checkmark"` (line 460) and `part="option"` (line 336) are `SelectOption` internals; `checkmark` is flagged for P1.4, not certified here.

### 11.4 Attributes (11 IDs: 7 host-related + 4 shadow-DOM groups)

| Category | IDs | Count |
| --- | --- | --- |
| Observed (`observedAttributes`) | ATTR-001..003 | 3 |
| Host attributes written by component | ATTR-010..013 | 4 |
| **Host-related subtotal** | ATTR-001..003, 010..013 | **7** |
| Element-level `data-*` (shadow DOM) | ATTR-020..023 | 4 |
| **Total** | | **11** |

### 11.5 Other families

| Family | IDs | Count |
| --- | --- | --- |
| Events (declared map) | EVENT-001..012 | 12 |
| Events (acknowledged) | EVENT-020..022 | 3 |
| Slots | SLOT-001..004 | 4 |
| Lifecycle | LIFECYCLE-001..006 | 6 |

### 11.6 Grand total

| Family | IDs |
| --- | --- |
| API | 27 |
| EVENT | 15 |
| ATTR | 11 |
| PART | 11 |
| SLOT | 4 |
| LIFECYCLE | 6 |
| CONFIG | 26 |
| **Total** | **100** |

Arithmetic: 27 + 15 + 11 + 11 + 4 + 6 + 26 = **100**. This equals the **95** distinct IDs the original P1.1 Markdown ledger already contained (27+15+11+11+4+6+21 = 95) plus the **5** new granular CONFIG IDs (CONFIG-022..026) added here. The original JSON matrix reported only **74** records; the 21-record shortfall was exactly the CONFIG-001..021 block. Reconciliation:

- Markdown-to-JSON gap (R-01 root cause): **95 - 74 = 21**, exactly the CONFIG-001..021 rows absent from the original JSON. All 21 are now present.
- +5 new CONFIG granular IDs (CONFIG-022..026) added by this correction to close the configuration-completeness gap (R-03).

Net: original **95** Markdown IDs - 0 removed + 5 new granular CONFIG IDs = **100** distinct contract IDs. The JSON now has **one record per ID: 100 records** (up from 74). Every ID in sections 2-7 is present and unique (R-01, R-02).

> **Cardinality note:** the W1-P1.1 review inspected a ledger with 95 IDs (it predates the configuration-completeness fix). After adding CONFIG-022..026 the authoritative total is **100**. Downstream increments must cite **100**.

### 11.7 Source-reference precision (R-05)

Every record in `W1-P1-TRACEABILITY.json` carries a `sourceLocators` array of `{ file, lines }` objects. Section-level references were replaced with line ranges for attributes, parts, slots, and configuration defaults; `select-option.ts` and `types.ts` are cited explicitly where an ID's contract spans those files.

---

## 12. Package Boundary and Historical Crosswalk

The historical `W1-P0-CONTRACT-LEDGER.md` (baseline `c49d5add`, 7,284-line component) identified public surfaces beyond `EnhancedSelect`. None of them were silently certified here. This table maps each historical package surface to its current owner increment. **No historical ownership classification is carried forward automatically; line numbers from W1-P0 must not be applied to the current 9,109-line source.**

| Historical surface (W1-P0) | Covered by EnhancedSelect contract IDs? | Owner increment | Notes |
| --- | --- | --- | --- |
| `EnhancedSelect` class members & DOM | Yes (API/EVENT/ATTR/PART/SLOT/LIFECYCLE/CONFIG) | P1.1-R / P1.2-P1.5 | This ledger. |
| Custom-element registration (`enhanced-select`, `select-option`, `smilodon-select`) | Partially (registration cited in section 1) | P1.4 (EnhancedSelect) / P1.6 (package) | Registration timing contracts characterized with lifecycle; NativeSelect/SelectOption tag registration is package-level. |
| `NativeSelectElement` | No | Delegated to later Wave 1 certification (out of W1-P1 scope) | Not examined for behavior in W1-P1; registration only noted. |
| `SelectOption` | Partially (PART-007 `option`, PART-009 chip parts cite `select-option.ts`) | P1.4 | Only its emitted `::part` surface is in scope here. |
| Global configuration APIs (`configureSelect`, `resetSelectConfig`, `selectConfig`) | Yes (CONFIG-001..026 defaults) | P1.4 (defaults) | API functions themselves are package-level; the default *values* are inventoried. |
| Renderer / engine exports (`OptionRenderer`, `Virtualizer`, `FenwickTree`, `DOMPool`, engine state) | Internal only (engine authority noted in section 0.3) | Out of W1-P1 (P1.4 rendering internals only) | Public utility exports not characterized as `EnhancedSelect` contracts. |
| Security / CSP utilities (`setHTMLSanitizer`, `sanitizeHTML`, `CSPFeatures`, etc.) | No | P1.6 (SSR/security) | Documented-only per section 10; not certified. |
| Data-loading public types & acknowledged surface | Yes (API-060..062, EVENT-020..022) | P1.5 | Validated shapes characterized in P1.5. |
| Framework adapter packages (React, Vue, Svelte, Solid, Vanilla, React Native) | No | P1.5 (async/adapters) or later | No Angular package exists; not certified. |

> Surfaces marked **No** are explicitly **outside** the W1-P1 characterization scope. They are not certified, and they must not be cited as covered by the W1-P1 contract ledger. A package export that is not examined must not be silently classified as certified.

---

_End of ledger. Reconciled under W1-P1.1-R; one record per ID in `W1-P1-TRACEABILITY.json`._

---

## 13. W1-P1.2 consolidated selection contract (Task 5 closure)

This section consolidates the accepted Task 1-4 characterization into a single reviewable statement of the **public selection contract** as observed at baseline `7e3adf7`. It is a consolidation, **not** an approval of normative behavior: quirks and inconsistencies remain recorded as deviations. All statements are evidenced through public surface only (public methods, rendered shadow DOM, emitted `CustomEvent.detail`, registered callbacks, and public getters `getSelectedValues()`/`getSelectedItems()`/`validate()`).

### 13.1 Event and callback chronology (interaction vs. programmatic)

All events are `CustomEvent(name, { detail, bubbles: true, composed: true })`. Callbacks are registered via `updateConfig({ callbacks })`. The consolidated chronology per operation:

| Operation | Emitted events (order) | Callbacks (order) | Full sequence | Detail notes |
| --- | --- | --- | --- | --- |
| Pointer/Enter select (single or multi) | `select` → `change` | `onChange` → `onSelect` | `select → change → onChange → onSelect` | `select.detail = { item, index, value, label, selected, multi }` (post-dispatch state); `change.detail = { selectedItems, selectedValues, selectedIndices }` |
| Multi toggle off | `select` → `change` | `onChange` → `onSelect` | same | `select.detail.selected = false`, `multi = true` |
| Single deselect (allowDeselect) | `select` → `change` | `onChange` → `onSelect` | same | `select.detail.selected = false`; `change.detail` reports emptied selection |
| Chip / option-level remove | `change` → `remove` | `onChange` (no `onSelect`) | `change → onChange → remove` | `remove.detail = { item, index }`, `index` = **source registry index**; **no `select`** |
| Clear-control activation (selection present) | `change` → `clear` | `onChange` → `onClear` | `change → onChange → clear → onClear` | `clear.detail = { clearedSelection, clearedSearch }`; **DEVIATION-10** under `required` |
| Programmatic `setSelectedValues()` | `change` | `onChange` | `change → onChange` | **no `select`**, no `onSelect`; local and server-fetch paths; Promise settles after `change` |
| Programmatic `clear()` | `change` | `onChange` | `change → onChange` | **no `clear`**, no `onClear` |
| Rejected (disabled-blocked / `maxSelections`) | none | none | — | no state change; no event/callback |
| Single re-select, `allowDeselect:false` | `select` → `change` | `onChange` → `onSelect` | same | **no state change but events STILL fire** (compatibility finding) |

**Consolidated rules.** All rules below are **bounded to the characterized operations in the chronology table above** (the interaction surfaces and the programmatic `setSelectedValues()` / `clear()` paths exercised in P1.2); they are not universal guarantees for every public method, asynchronous path, or configuration.

- On the characterized operations, `change` carries exactly three keys and preserves **selection insertion order** (not registry order) in `selectedValues`/`selectedItems`/`selectedIndices` — verified: selecting `c` then `a` yields `['c','a']` / indices `[2,0]`.
- `select` fires only on user-driven activation. On the **characterized** programmatic operations — `setSelectedValues()` (local and server-fetch) and `clear()` (local), plus chip/option-level removal — no `select` is emitted. This is asserted only for those operations; it is **not** a universal guarantee for every public method, asynchronous path, or configuration (uncovered programmatic paths remain owned by later increments — see §13.4).
- `onSelect` receives the **same detail object** as the `select` event, **including `multi`** (T4-F02 errata: earlier title mis-worded this as "without `multi`"; assertion and behavior were always correct).
- Interaction sequences bubble and are `composed` (observable on a light-DOM ancestor).
- `select`/`change`/`clear`/`remove` payload shapes are exactly as tabled; exact-key assertions live in `w1-p1-2-t4-interaction-events.spec.ts` (T4-04).

### 13.2 Selection identity, required, and validation contract

| Aspect | Observed contract | Evidence |
| --- | --- | --- |
| Identity unit | Registry **key** (default `= id`), not value equality. Two records with the same value but distinct keys are two identities. | identity matrix; T2-R F01 |
| Single-mode replace | `setSelectedValues([v1,v2,…])` keeps the **first eligible value in registry order** (not request order). | identity matrix (DEVIATION-07) |
| Multi-mode replace | Keeps all eligible values (capped by `maxSelections`); order = selection insertion order. | ordering spec; T4-04 |
| Detached retention | Removing a selected item from `setItems()` retains the selection (getters still report it). | identity matrix; DEVIATION-08 |
| Key-based reattachment | Re-adding an item with the same **key** (new instance) re-attaches (getters return the new instance); same **value** under a different key does **not** migrate. | T2-R F03; DEVIATION-08 |
| Pruning path | `clear()` / `setSelectedValues([])` prunes detached selections. | T3 spec; DEVIATION-08 |
| `required` + `clear()` | `clear()` **preserves** the selection when `required`; `setSelectedValues([])` also preserves. | T3 spec |
| `validate()` | Returns false for empty-required and for a **detached** selection (getters report it but `validate()` rejects it). | T3 spec; DEVIATION-09 |
| Disabled-option policy | `selectable:false` blocks selection (no event); `selectable:true` allows full selection sequence. | identity matrix; T4-08 |
| `maxSelections` | Additional selection beyond the cap is rejected with no state/event. | T4-08 |

### 13.3 Error and validation surface (characterized, not repaired)

`setError(message)` sets error state reflected to `aria-invalid`/`aria-describedby` and error text; `clearError()` removes them and is idempotent. Mode-switch selection state is deterministic. These are `Partial` (P1.3 owns full a11y/error coverage). See `w1-p1-2-t3r-error-state-evidence.spec.ts`.

### 13.4 Programmatic vs interaction — authoritative distinction

The single most important P1.2 boundary, **scoped to the characterized paths**: on the programmatic paths exercised in P1.2 — `setSelectedValues()` (local, server-fetch success/failure/superseded/disconnected) and `clear()` (local) — the component emits only `change` (+`onChange`) and **no `select`/`remove`/`clear`**. On the characterized interaction surfaces (pointer/Enter select, multi toggle off, single deselect, chip/option remove, clear-control), interaction adds the driving event (`select`, `remove`, `clear`) and its dedicated callback.

**Scope limitation (T5-F03).** This is a characterization of the paths tested in P1.2, not a universal guarantee. It does **not** certify every public method, every asynchronous path, or every configuration (for example the acknowledged/`dataProjection` path, active-search clear semantics, and keyboard/APG-driven selection remain outstanding — see §9 and the closure report §8). Later extraction (engine/adapter) must preserve this behavior on the characterized paths and must extend characterization before relying on the same boundary elsewhere.

## 14. W1-P1.2 closure summary (Task 5)

| Item | Statement |
| --- | --- |
| Increments reconciled | Task 1 (DEVIATION-04 ordering) · Task 2 + T2-R (identity) · Task 3 + T3-R (state/validation/error) · Task 4 (interaction events) — all accepted, all re-verified consistent. |
| P1.2 test inventory | 6 specs, **116** interaction/characterization tests (19+21+8+26+8+34). |
| Coverage distribution | Existing 38 · Partial 17 · Diagnostic 41 · Missing 4 = **100**. Unchanged in count by reconciliation; class assignments audited, `Partial` retained where paths remain outstanding. |
| Deviations | DEVIATION-04, 07, 08, 10 characterized in P1.2; 06 guidance honored; 09 ADR candidate; 01/02/03/05 owned by later increments. |
| Outstanding (P1.3-P1.5) | Full select-all/range paths, acknowledged/server events, active-search clear-control semantics, post-removal animation/focus ownership, comprehensive keyboard/APG navigation — **not** silently upgraded. |
| Production source | **Byte-identical** to baseline `7e3adf7` (verified `git diff 7e3adf7 -- packages/core/src packages/core/engine packages/core/adapters` = empty). |
| Errata | T4-F01 (full-suite count 876→**877**) and T4-F02 (`onSelect` title now "including `multi`") corrected; no accepted assertions changed. |

_End of W1-P1.2. Next: P1.2 final closure review._

---

## 15. W1-P1.3 Addendum — Keyboard Navigation and Focus/ARIA Chronology (Task 1 scope)

This addendum, committed **before** any W1-P1.3 characterization test, defines Task 1 of W1-P1.3. It (a) fixes the Task-1 scope, (b) enumerates the thirteen existing **P1.3-owned** contract IDs Task 1 must characterize, (c) introduces the new **KBD-001..012** contract IDs for keyboard/APG behavior together with their source locators and their empirically observed baseline behavior, and (d) records the deviation candidates the authoring probe surfaced. All behavior below is **`Observed`** at baseline `7e3adf7`; nothing here is approved, repaired, or locked as normative. Every KBD ID enters the matrix at coverage **`Diagnostic`** and target **`P1.3`** (test `unassigned`) until the Task-1 specs are written and accepted.

> **Provenance of the "observed behavior" column.** Recorded during authoring from a throwaway jsdom probe (deleted before this commit) that drove the component through public surface only — dispatching `keydown` on the `[part="input"]` element, reading rendered shadow DOM (`role="combobox"`, `role="listbox"`, `aria-expanded`, `aria-activedescendant`), and listening for `open`/`close` `CustomEvent`s. No production code was touched. These observations seed the Task-1 assertions; they are **characterization targets, not certifications**.

### 15.1 Task-1 scope

- **In scope (Task 1).** Keyboard-driven open/close and active-option movement; Enter/Space/Escape/Tab/Home/End/PageDown/PageUp/Ctrl-Cmd-A/type-ahead; the resulting **focus model** (where DOM focus stays, how `aria-activedescendant` tracks the active option); the **ARIA chronology** of `aria-expanded` and `aria-activedescendant` across open→move→close; `open`/`close` event chronology and their empty `detail`; the observed interaction and effect of `ARIA-*` attribute resync, `dir`, `data-open`, and `data-placement` **as they pertain to the keyboard flow**; and the `attributeChangedCallback` equal-value early-return. Disabled-option skipping and selection-policy interaction (single/multi) are exercised **only** to the extent the keyboard path reaches them.
- **Out of scope (deferred to a later W1-P1.3 task or increment).** Real-browser (Chromium) WAI-ARIA combobox conformance; pointer-driven movement parity; full APG verbatim conformance where it diverges from observed behavior; `maxSelections`/`allowDeselect` policy matrices beyond the minimal keyboard-path checks; acknowledged/`dataProjection` keyboard interactions (P1.5).
- **Constraints.** No production change; no speculative remediation; preserve all P1.2 tests; any observed inconsistency is recorded as a deviation (see §15.4), not fixed.

### 15.2 Existing P1.3-owned contracts exercised by Task 1

These thirteen IDs already exist in the matrix (§9). Task 1 characterizes **eleven** of them **through the keyboard path** (API-030/031, EVENT-002/003, ATTR-001/002/003/010/011/020, LIFECYCLE-006); **API-040/041 are deferred** to their existing P1.2-T3-R error-state evidence (see below). All remain `Diagnostic`/`Partial` as recorded until the Task-1 specs are accepted (no silent upgrade).

| ID | Behavior (ledger §) | Task-1 keyboard relevance |
| --- | --- | --- |
| API-030 | `open()` idempotency + emit (§2.4) | Programmatic-open parity for KBD-001; double-`open()` emits once (observed). |
| API-031 | `close()` (§2.4) | Programmatic-close parity for KBD-006/007; double-`close()` emits once (observed). |
| API-040 | `setError()` (§2.5) | **Deferred (T1-R / T1-F01).** Error-state behavior is characterized by the P1.2-T3-R error-state evidence; Task 1 adds no duplicate assertions. Remains `Partial`. |
| API-041 | `clearError()` (§2.5) | **Deferred (T1-R / T1-F01).** As above; characterized in P1.2-T3-R evidence; no new Task-1 assertions. Remains `Partial`. |
| EVENT-002 | `open` event + `{}` detail (§3.1) | Emitted **before** `onOpen`, detail empty (observed: `open:{}`). |
| EVENT-003 | `close` event + `{}` detail (§3.1) | Emitted **before** `onClose`, detail empty — **no reason** in public detail (observed: `close:{}`); see P1.3-D01. |
| ATTR-001 | `aria-label` resync (§4.1) | Observed applied to combobox + listbox. |
| ATTR-002 | `aria-description` resync (§4.1) | Observed applied to combobox. |
| ATTR-003 | `aria-busy` resync (§4.1) | Observed on host → `_syncListboxAccessibility`; **`aria-busy` not observed on the listbox element** in the probe — see P1.3-D02. |
| ATTR-010 | `dir` reflection (§4.2) | Observed `dir="ltr"` on host after connect. |
| ATTR-011 | `data-open"true"` reflection (§4.3) | `true` while open, absent when closed (observed). |
| ATTR-020 | `data-placement` on dropdown (§4.3) | Observed `bottom` on the listbox/dropdown. |
| LIFECYCLE-006 | `attributeChangedCallback` equal-value early-return (§6) | Equal `aria-*` set is a no-op (not re-synced). |

### 15.3 New KBD contracts (KBD-001..012)

All KBD contracts target **P1.3**, coverage **`Diagnostic`**, status **`Observed`**, test **`unassigned`**. `sourceLocators` are pinned to baseline `7e3adf7`; `_handleKeydown` is `enhanced-select.ts:5049-5159`.

| ID | Behavior | Primary source locator(s) | Observed baseline behavior (probe) |
| --- | --- | --- | --- |
| KBD-001 | Keyboard-open triggers: ArrowDown/ArrowUp/Enter (and Space when enabled & not searchable-input) open the popup when closed; opening assigns **no** active-descendant from keyboard alone when there is no existing selection. | `_handleKeydown` 5059-5074, 5121-5136; `_handleOpen` 4359-4404; `_setInitialActiveOption` 5524-5552 | ArrowDown-on-closed → `data-open="true"`, `aria-expanded="true"`, `aria-activedescendant=null`; `open:{}` then `onOpen`. Enter-on-closed → opens, no selection, no active-descendant. |
| KBD-002 | ArrowDown/ArrowUp move the active option by one **selectable** step; movement clamps at the first/last selectable option (no wrap). | `_handleKeydown` 5059-5074; `_moveActive` 5163-5221 | Items `a,b(disabled),c,d`: down sequence `a→c→d→d→d` (from null first move lands on `a`, skips `b`); up sequence `c→a→a→a`. No wrap. |
| KBD-003 | Home/End move the active option to the first/last **selectable** option (selected-first projection deferred to visual-boundary path). | `_handleKeydown` 5075-5119 (Home 5075, End 5092) | From active `c`: End→`d`, Home→`a`. |
| KBD-004 | PageDown/PageUp move the active option by ±10 selectable steps (clamped). | `_handleKeydown` `PageDown`/`PageUp` (between 5119 and 5140); `_moveActive` 5163-5221 | Delegates to `_moveActive(±10)`; clamps like KBD-002 (not separately re-probed beyond ±1). |
| KBD-005 | Enter/Space activate: when closed they open (KBD-001); when open they select the active option; **Space is ignored when `searchable` and the event target is the input**. | `_handleKeydown` 5121-5136; `_selectOption` via engine | Open + Enter on active `a` → selects `a` (`getSelectedValues()=['a']`), closes. Searchable + Space on input → **no selection** (0 `select` events). |
| KBD-006 | Escape: first dismisses the selected-label tooltip if visible; otherwise closes an open popup with engine reason `'escape'`. | `_handleKeydown` 5050-5057 (tooltip), 5137-5139 (close); `_handleClose` 4406-4427 | Escape-on-open → `close:{}`, `data-open` removed, `aria-expanded="false"`. Public `close` detail carries **no reason** (P1.3-D01). |
| KBD-007 | Tab: closes the popup when open (does not otherwise change selection). | `_handleKeydown` 5141-5144 | Tab-on-open → `close:{}`, popup closed. |
| KBD-008 | Ctrl/Cmd+A selects all **only** when `selection.mode==='multi'` and **not** `searchable`; otherwise ignored. | `_handleKeydown` 5145-5152; `_selectAll` 5466 | Guarded by mode + `!searchable`; default suppress; delegate to `_selectAll`. |
| KBD-009 | Disabled options are skipped by active movement (KBD-002..004) and cannot become active via keyboard. | `_getSelectableOptionIndices` 5403-5430; `_moveActive` 5182-5209 | Confirmed: disabled `b` never becomes active in either direction. |
| KBD-010 | A printable single character (no Ctrl/Alt/Meta) with no earlier match delegates to type-ahead search. | `_handleKeydown` default case 5154-5158; `_handleTypeAhead` 5433 | Single-char no-modifier keys route to `_handleTypeAhead(char)`. |
| KBD-011 | Focus model: DOM focus stays on the combobox `<input>`; option elements are not focus targets; the active option is expressed via `aria-activedescendant` referencing the active option element id. | input `part="input"` (1908); `activeKey` derived in `_handleKeydown`; `web/accessibility-effects.ts` 60 | After open+move, `shadowRoot.activeElement` is the input; the active element is the option with `id === aria-activedescendant`. |
| KBD-012 | Combobox ARIA chronology: `aria-expanded` and `aria-activedescendant` transition consistently across open→move→close (`expanded=true` + activedescendant on move; `expanded=false` + activedescendant cleared on close). | `web/accessibility-effects.ts` 45, 60 (`setBooleanAttribute` expanded, `setOptionalAttribute` activedescendant); `_handleOpen`/`_handleClose` | Open: `expanded=true`, `ad=null`; move: `ad=<option id>`; close: `expanded=false`, `ad=null`. |

### 15.4 Deviation candidates surfaced while authoring the addendum (not repaired)

These are **recorded for the Technical Lead**, not fixed. If accepted they will be promoted to `W1-P1-DEVIATIONS.md` in the corresponding Task-1 characterization increment; if not, they remain observations only.

| Candidate | Observation | Risk |
| --- | --- | --- |
| **P1.3-D01** | The public `close` event detail is `{}` (`CloseEventDetail` is an empty interface, `types.ts:50`). The engine carries a `CloseReason` (`engine/contracts.ts:3`, values `escape`/`outside-pointer`/`selection`/`blur`/`programmatic`/`disabled`/`disconnect`) but it is **not** surfaced on the public event. Keyboard Escape and Tab therefore emit an indistinguishable `close:{}`. | Consumers cannot distinguish keyboard-close vs selection-close from the event alone; `EVENT-003` was described as "close reasons" but reasons are not publicly observable. Characterization must not assume a reason is present in `detail`. |
| **P1.3-D02** | `attributeChangedCallback('aria-busy', …)` routes to `_syncListboxAccessibility` (637-646), but the authoring probe observed **no** `aria-busy` attribute written to the listbox element and no change when toggling `aria-busy="true"`→`"false"`. The resync is wired but the observable effect is unconfirmed at baseline. | `ATTR-003` may be a no-op in jsdom; Task 1 must characterize the **actual** observable effect rather than the wiring intent. |
| **P1.3-D03** | `open` assigns no initial `aria-activedescendant` when there is no selection (by design, per `_setInitialActiveOption` 5536-5540); the first ArrowDown then materializes the first selectable option. This differs from some APG examples that pre-activate the first option on open. | It is intentional (code comment) but a conformance nuance; recorded so Task 1 locks the **observed** behavior without asserting the APG default. |

### 15.5 Task-1 acceptance gate (planned)

1. Addendum committed **before** any Task-1 test (this commit).
2. Task-1 specs drive the public surface only (keydown on `[part="input"]`, shadow-DOM reads, event listeners) and cover KBD-001..012 plus the keyboard path of the thirteen existing P1.3 IDs.
3. KBD IDs remain `Diagnostic` until their spec is accepted; on acceptance each moves to `Partial` (keyboard paths only) — never `Existing` without real-browser coverage.
4. Production source stays byte-identical to `7e3adf7`; the full core suite stays green (carried forward: 877 passed + 1 skipped).

_End of W1-P1.3 Addendum. Task-1 characterization tests are written only after this addendum is accepted._

### 15.6 Task-1 characterization outcome (W1-P1.3 Task 1 tests)

Task 1 is characterized by `packages/core/tests/w1-p1-3-t1-keyboard-navigation.spec.ts` (**45 tests**), driving only the public surface listed in §15 header. Outcome:

| Area | Tests | Result |
| --- | --- | --- |
| KBD-001 (open triggers) | 5 | Open on ArrowDown/ArrowUp/Enter; `open:{}`→`onOpen`; no initial active-descendant; no duplicate open. |
| KBD-002 / KBD-009 (movement + disabled skip) | 4 | One-step movement, disabled `b` skipped in both directions, clamp at boundaries, disabled never active. |
| KBD-003 (Home/End) | 2 | End→last selectable, Home→first selectable. |
| KBD-004 (PageDown/PageUp) | 3 | ±10 selectable steps; clamp at end. |
| KBD-005 (Enter/Space) | 3 | Enter/Space activate; searchable-Space-on-input is a no-op. |
| KBD-006 / KBD-007 (Escape/Tab) | 5 | Escape & Tab close; `close:{}`→`onClose`; indistinguishable close detail (**P1.3-D01**); closed-state no-op. |
| KBD-008 (Ctrl/Cmd+A) | 4 | Select-all only in multi && !searchable; Ctrl and Meta. |
| KBD-010 (type-ahead) | 2 | Unmodified char moves active; modified char does not. |
| KBD-011 (focus model) | 2 | Focus stays on the input; active option via `aria-activedescendant`, not focus. |
| KBD-012 (ARIA chronology) | 3 | `aria-expanded` false/true/false; `aria-activedescendant` null→set→cleared; tracks movement. |
| Existing P1.3 contracts via keyboard | 11 | API-030/031 idempotency; EVENT-002/003 `{}` detail; ATTR-010 dir, ATTR-011 data-open, ATTR-020 data-placement, ATTR-001/002 aria resync, ATTR-003 aria-busy no observable listbox effect (**P1.3-D02**), LIFECYCLE-006 equal-value **observable stability** (not proof of the internal early-return; **T1-F02**). API-040/041 **deferred** to P1.2-T3-R evidence (**T1-F01**). |

All 45 pass; the full core suite is **922 passed + 1 skipped** (877 + 45 new; no regressions). The 12 KBD contracts move **Diagnostic → Partial** (keyboard paths characterized; real-browser WAI-ARIA conformance and pointer-movement parity remain outstanding — **not** upgraded to `Existing`). Coverage distribution across the **112** records is **Existing 38 · Partial 29 · Diagnostic 41 · Missing 4 = 112** (unchanged by T1-R). Deviation disposition after T1-R review: **P1.3-D01** promoted to `W1-P1-DEVIATIONS.md` as an *observed public-contract limitation* (characterized; design decision deferred); **P1.3-D02** retained as `Diagnostic` pending a browser a11y check; **P1.3-D03** accepted as an *observation, not a defect*, pending a real-browser/APG assessment. Production source remains **byte-identical** to baseline `7e3adf7`.

_End of W1-P1.3 Task 1._

---

## 16. W1-P1.3 Task 2 — real-browser keyboard and accessibility verification

Task 2 drives the same public keyboard/focus/ARIA surface as Task 1, but through **real trusted input in Chromium** (Playwright `locator.press`/`focus`, plus CDP `Accessibility.getFullAXTree`), rather than jsdom synthetic events. It characterizes browser behavior; it **does not repair** anything and **does not** change any coverage class (the record count stays **112**; only P1.3-D01/D02/D03 narrative is clarified and P1.3-D04 is added).

- **Harness.** `tests/e2e/w1-p1-3-t2/playwright.config.ts` (npm script `test:e2e:p13-t2`), spec `keyboard-accessibility.t2.spec.ts` (**31 tests**), helpers `harness.ts`. Deterministic single-project Chromium, workers=1, retries=0, headless. Browser: **Google Chrome for Testing 156.0.8078.4** (Playwright pinned Chromium-1248; the 1.59.1 default Chromium-1217 is geo-blocked on this environment's CDN — recorded in the config and evidence).
- **System under test.** The vanilla demo (`http://localhost:5173/vanilla-demo.html`), demo's own static selects purged so the AX tree contains only the suite instances.
- **Input model.** Genuine trusted keyboard events — **not** synthetic `KeyboardEvent` dispatch. Assertions read public-observable DOM (combobox `aria-*`, `aria-activedescendant` resolution, host `data-open`, DOM focus, `open`/`close` events) and the Chromium AX tree.
- **Evidence.** `docs/architecture/baseline/w1-p1/W1-P1.3-T2-BROWSER-EVIDENCE.json`.

### 16.1 Per-matrix outcome (all PASS)

| Matrix | Tests | Result (Chromium 156) |
| --- | --- | --- |
| T2-01 browser harness | 2 | Version reported `156.0.8078.4`; initial mount closed, no active-descendant. |
| T2-02 keyboard navigation | 6 | ArrowDown-open **pre-activates** first option; one-step move skips disabled; clamp (no wrap); Home/End first/last; PageDown/PageUp ±10; Enter/Space activate. |
| T2-03 popup dismissal | 4 | Escape closes; **Tab closes but does not advance focus** (→BODY; **P1.3-D04**); Escape/Tab both `close:{}` (indistinguishable; **P1.3-D01**); closed-state no-op. |
| T2-04 DOM focus | 3 | DOM focus on host; shadow active = `input(part="input")`; stays on input across move/Escape; active option is not focus. |
| T2-05 ARIA relationships | 3 | `aria-controls` == listbox id; `aria-expanded` reflects state; AX combobox `hasPopup=listbox` + `controls`. |
| T2-06 disabled options | 2 | Disabled option never becomes active; `aria-disabled` + AX `disabled` state. |
| T2-07 selection policies | 4 | Single Enter selects+closes; multi+allowDeselect toggles; `maxSelections` caps; listbox `aria-multiselectable=true`. |
| T2-08 accessibility representation | 3 | Selected option AX `selected=true` (name suffixed `Remove option` — chip affordance); combobox name from host `aria-label`; `aria-activedescendant` reported as idref. |
| T2-09 deviation reassessment | 3 | D01 confirmed; **D02 resolved**; **D03 reassessed (jsdom artifact)**. |
| T2-10 harness integrity | 1 | Full open→move→select cycle via keyboard on public surface only. |

### 16.2 Deviation reassessment (browser evidence)

| ID | Task-1 status | Task-2 (browser) status | Meaning |
| --- | --- | --- | --- |
| P1.3-D01 | Observed public-contract limitation | **Confirmed** | `close` detail is `{}`; Escape and Tab indistinguishable in Chromium. Design decision still deferred. |
| P1.3-D02 | Diagnostic (pending browser check) | **Resolved (not a defect)** | **Reflection target = the listbox**; it receives `aria-busy="true"` when genuinely busy (public load-more → `_setBusy(true)`). The legacy host `aria-busy` is intentionally inert. The jsdom "missing" was the inert legacy attribute, **not** a limitation. |
| P1.3-D03 | Observation (pending browser check) | **Reassessed — jsdom artifact** | Real browser **pre-activates the first option on keyboard open**; the jsdom "no initial active" does not reproduce. Multi mode opens with no pre-active. Observation, not a defect; APG difference ≠ nonconformance. |
| P1.3-D04 | — (new) | **Observation (new)** | Tab closes the popup but does **not** advance DOM focus (`document.activeElement` → BODY). Characterized, not repaired. |

**Scope note (screen readers).** These assessments rest on the **Chromium AX tree** only; they establish that the AX *representation* (roles/names/states/relationships) is correct and do **not** assert screen-reader (NVDA/JAWS/VoiceOver) compatibility, which remains out of scope for W1-P1.

**Chrome-156 finding vs. jsdom.** The principal reconciliation is that the P1.3-D03 "opening assigns no initial `aria-activedescendant`" is a **jsdom artifact**: a real keyboard open pre-activates the first selectable option (single mode). This is a characterization-basis correction, not a behavior change.

End of W1-P1.3 Task 2. No production source was modified. P1.3-P2 are NO-GO until Task 2 is independently reviewed.
