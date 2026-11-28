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
| API-032 | `updateConfig(config: SelectInstanceConfig): void` - validates `dataLoading`/`selectedOptions`/`scrollToSelected`; may emit `dataLoadingConfigError`; handles mode/enabled changes. | 6747-6950 | `public-config-integration`, `phase-2e-*`, `w1-p1-5-t1-acknowledged-data-loading-api` | Observed | Yes (emission+issues, event-before-callback order, dedup+reset, no-emit for valid/unrelated-invalid) |

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
| API-060 | `startDataLoading(): void` - deferred until connected if needed. | 6960-6991 | `phase-2e-acknowledged-data-loading`, `w1-p1-5-t1-acknowledged-data-loading-api` | Observed | Yes (deferred start, repeated-start idempotence) |
| API-061 | `getDataLoadingState(): DataLoadingStateSnapshot` | 6993-7042 | `phase-2e-*`, `phase-2f-*`, `w1-p1-5-t1-acknowledged-data-loading-api` | Observed | Yes (idle/active/completed, detached snapshot) |
| API-062 | `completeDataRequest(completion): DataRequestCompletionResult` - **sync** return; validates shape; projects accepted snapshots async. | 7044-7120 | `phase-2e-acknowledged-data-loading`, `w1-p1-5-t1-acknowledged-data-loading-api` | Observed | **Partial** (5-status terminal matrix + async projection + token-size resource-limit + rejection non-mutation; **cursor-depth subpath outstanding** — `maxCursorPages` is not publicly configurable) |

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
| EVENT-004 | `search` | `SearchEventDetail` (51) `{ query, results?, count? }` | 5043 (local); 7715 (acknowledged) | - | Observed | **Existing** (both paths + normalizedQuery pinned; P1.5-T2) |
| EVENT-005 | `pageLoaded` | `PageLoadedEventDetail` (56) `{ page, count }` | **none** | - | **Unknown** | **Missing** (bounded runtime negative: not emitted at acknowledged page nor legacy load-more completion; plus source inspection — type declared, no dispatch site; DEVIATION-02) |
| EVENT-006 | `error` | `ErrorEventDetail` (57) `{ message, cause? }` | 6274 | `onError(error)` | Observed | **Partial** (async server-failure shape + error-before-onError; broader error sources outstanding) |
| EVENT-007 | `change` | `ChangeEventDetail` (58) `{ selectedItems, selectedValues, selectedIndices }` | 6494 | `onChange(items, values)` | Observed | Yes (all emit paths) |
| EVENT-008 | `loadMore` | `LoadMoreEventDetail` (63) `{ page, items }` | 6251 | - | Observed | **Existing** (acknowledged: fresh page-mode load-more request at page 2, request identity + queryGeneration pinned; legacy: `{page:2,items:[]}` no envelope; T2-R) |
| EVENT-009 | `remove` | `RemoveEventDetail` (64) `{ item, index }` | 5704 | - | Observed | Yes |
| EVENT-010 | `clear` | `ClearEventDetail` (65) `{ clearedSelection, clearedSearch }` | 7244 | - | Observed | Yes |
| EVENT-011 | `emptyStateChange` | `EmptyStateChangeDetail` (77) `{ context }` | 6468 | - | Observed | Yes |
| EVENT-012 | `diagnostic` | `DiagnosticEventDetail` (132) `{ timestamp, source, name, detail? }` | 7092, 7960 | Observed | **Partial** (resource-limit diagnostic payload pinned + snapshot mirror + per-result boundedness scoped true; `acknowledgedProjectionFailed` diagnostic uncharacterized — no deterministic public trigger; T2-R) |

### 3.2 Acknowledged events (NOT in `SelectEventsDetailMap`)

| Contract ID | Event | Detail | Source (`enhanced-select.ts`) | Status | New test |
| --- | --- | --- | --- | --- | --- |
| EVENT-020 | `dataProjection` | `DataProjectionEventDetail` (`complete` / `failed`) | 7978 | Observed | **Partial** (`complete` + request/generation/attempt pinned; `failed` variant — no deterministic *public* trigger was established in this increment; production has a general projection-exception path that calls `_recordAcknowledgedProjectionFailure`, but existing tests reach it only via a private seam) |
| EVENT-021 | `dataRequestCancel` | `DataRequestCancelNotification { requestId, queryGeneration, reason }` | 7679 | Observed | **Existing** (all three reasons with requestId + queryGeneration; event-before-callback ordering; callback receives the same detail *object* by reference; T2-R) |
| EVENT-022 | `dataLoadingConfigError` | `{ issues }` | 6950, 7130 | Observed | **Existing** (issues array shape + dedup; P1.5-T2) |

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
| LIFECYCLE-005 | Stale async work guarded by `_asyncGeneration` + `isConnected`; superseded/disconnected `setSelectedValues` results and stale/unknown acknowledged completions are dropped (not applied, not projected). | guards in 6668-6695, 7078-7120, etc.; `_loadSelectedItemsByValues` + `completeDataRequest` | `w1-p1-5-t3-lifecycle-stale-async-guard` (6 discriminating tests) | Observed | **Yes** (P1.5 T3; Partial) |
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
| DEVIATION-02 | `pageLoaded` declared in event map but never emitted; omitted from capabilities. | Unknown | P1.5 | **Characterized (W1-P1.5-T2 / T2-R)** — two distinct evidence streams: (1) **bounded runtime observation** — not emitted at acknowledged page completion nor legacy load-more completion; (2) **source inspection** — type declared, no dispatch site in `enhanced-select.ts`. Neither claims the event can never fire on any execution path. Completion is signalled via `dataProjection`/`loadMore`. ADR candidate; matrix `EVENT-005` remains `Missing` (declared-only). |
| DEVIATION-03 | `search` payload shape (local vs acknowledged) not pinned. | Unknown | P1.5 | **Characterized (W1-P1.5-T2)** — local (`{query,results,count}`) and acknowledged (`{query,results:[],count:0,request}`) payloads pinned via public surface; matrix `EVENT-004` = `Existing`. |
| DEVIATION-04 | `setSelectedValues` async ordering not asserted by prior tests. | Unknown | P1.2 | **Characterized** — local + server-fetch success/failure/superseded/disconnected ordering locked by black-box tests (`w1-p1-2-set-selected-values-ordering`, T1-R chronology). Not a defect. |
| DEVIATION-05 | `connectedCallback` forces `style.display='block'`. | Internal (quirk) | P1.4 | **Characterized** (W1-P1.4-T2) — host inline `display:block` forced on connect *and* re-connect re-asserts it (black-box, jsdom + Chromium). Characterized, not endorsed; ADR still open. (matrix `ATTR-013` = Existing.) |
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

Task 2 drives the same public keyboard/focus/ARIA surface as Task 1, but through **real trusted input in Chromium** (Playwright `locator.press`/`focus`, plus CDP `Accessibility.getFullAXTree`), rather than jsdom synthetic events. It characterizes browser behavior; it **does not repair** anything and **does not** change any coverage class (the record count stays **112**).

> **W1-P1.3-T2-R note (correction).** Technical Lead review conditionally accepted Task 2 and directed a bounded correction (**T2-R**) that re-establishes three claims against the corrected evidence. (T2-F01, blocking) The original Tab test appended its reference button **before** the select, so the "no focus advance" result was merely end-of-document fallback and never asserted the destination — it was invalid. The corrected test mounts a genuinely-tabbable button **after** the select (plus a closed-combobox control case) and asserts the actual focus destination; in real Chromium **Tab advances focus normally** (closed → next tabbable; open → closes then advances). **P1.3-D04 is therefore WITHDRAWN** — the real behavior is standard and no deviation exists. (T2-F02) The "jsdom artifact" attribution for D03 is corrected to **withhold the cause**: the browser observation (first-option pre-activation on open) is preserved, but "why jsdom differed" is not asserted. (T2-F03) The D02 AX claim is now backed by an assertion on the Chromium AX tree (`listbox.busy`) — or the claim is narrowed to DOM. (Reproducibility) The suite enforces the recorded browser version for a certification run and distinguishes any override run. Final matrix: **32 tests, all PASS**.

- **Harness.** `tests/e2e/w1-p1-3-t2/playwright.config.ts` (npm script `test:e2e:p13-t2`), spec `keyboard-accessibility.t2.spec.ts` (**32 tests**), helpers `harness.ts`. Deterministic single-project Chromium, workers=1, retries=0, headless. Browser: **Google Chrome for Testing 156.0.8078.4** (Playwright pinned Chromium-1248; the 1.59.1 default Chromium-1217 is geo-blocked on this environment's CDN — recorded in the config and evidence). The suite **enforces** this certified version for a certification run (`CERTIFIED_CHROMIUM`); any override executable is flagged as such in the results.
- **System under test.** The vanilla demo (`http://localhost:5173/vanilla-demo.html`), demo's own static selects purged so the AX tree contains only the suite instances.
- **Input model.** Genuine trusted keyboard events — **not** synthetic `KeyboardEvent` dispatch. Assertions read public-observable DOM (combobox `aria-*`, `aria-activedescendant` resolution, host `data-open`, DOM focus, `open`/`close` events) and the Chromium AX tree.
- **Evidence.** `docs/architecture/baseline/w1-p1/W1-P1.3-T2-BROWSER-EVIDENCE.json`.

### 16.1 Per-matrix outcome (all PASS)

| Matrix | Tests | Result (Chromium 156) |
| --- | --- | --- |
| T2-01 browser harness | 2 | Version reported `156.0.8078.4`; initial mount closed, no active-descendant. |
| T2-02 keyboard navigation | 6 | ArrowDown-open **pre-activates** first option; one-step move skips disabled; clamp (no wrap); Home/End first/last; PageDown/PageUp ±10; Enter/Space activate. |
| T2-03 popup dismissal | 5 | Escape closes; **Tab from a closed combobox advances to the next tabbable** (control); **Tab from an open combobox closes it AND advances focus to the next tabbable** (normal browser behavior; **P1.3-D04 WITHDRAWN**); Escape/Tab both `close:{}` (indistinguishable; **P1.3-D01**); closed-state no-op. |
| T2-04 DOM focus | 3 | DOM focus on host; shadow active = `input(part="input")`; stays on input across move/Escape; active option is not focus. |
| T2-05 ARIA relationships | 3 | `aria-controls` == listbox id; `aria-expanded` reflects state; AX combobox `hasPopup=listbox` + `controls`. |
| T2-06 disabled options | 2 | Disabled option never becomes active; `aria-disabled` + AX `disabled` state. |
| T2-07 selection policies | 4 | Single Enter selects+closes; multi+allowDeselect toggles; `maxSelections` caps; listbox `aria-multiselectable=true`. |
| T2-08 accessibility representation | 3 | Selected option AX `selected=true` (name suffixed `Remove option` — chip affordance); combobox name from host `aria-label`; `aria-activedescendant` reported as idref. |
| T2-09 deviation reassessment | 3 | D01 confirmed; **D02 resolved (DOM + AX)**; **D03 reassessed (observation accepted; cause withheld)**. |
| T2-10 harness integrity | 1 | Full open→move→select cycle via keyboard on public surface only. |

### 16.2 Deviation reassessment (browser evidence)

| ID | Task-1 status | Task-2 (browser) status | Meaning |
| --- | --- | --- | --- |
| P1.3-D01 | Observed public-contract limitation | **Confirmed** | `close` detail is `{}`; Escape and Tab indistinguishable in Chromium. Design decision still deferred. |
| P1.3-D02 | Diagnostic (pending browser check) | **Resolved (DOM + AX; not a defect)** | **Reflection target = the listbox**; it receives `aria-busy="true"` when genuinely busy (public load-more → `_setBusy(true)`), and the Chromium **AX** listbox node reports `busy=true` (T2-F03: DOM and AX both asserted). The legacy host `aria-busy` is intentionally inert. The jsdom "missing" was the inert legacy attribute, **not** a limitation. |
| P1.3-D03 | Observation (pending browser check) | **Observation accepted; cause withheld** | Opening **pre-activates the first option** across all three browser paths (focus-open, closed-and-focused keyboard reopen, pointer-open). The behavior observation is preserved; *why* jsdom previously showed no initial active is **not** attributed (T2-F02). Observation, not a defect. |
| P1.3-D04 | — (new) | **Withdrawn (T2-F01)** | The original "Tab closes but does not advance focus" was an **invalid test** (reference button mounted before the select → BODY was end-of-document fallback). With a correctly-ordered next tabbable, Tab **advances focus normally** (closed → next; open → closes then advances). No deviation exists. |

**Scope note (screen readers).** These assessments rest on the **Chromium AX tree** only; they establish that the AX *representation* (roles/names/states/relationships) is correct and do **not** assert screen-reader (NVDA/JAWS/VoiceOver) compatibility, which remains out of scope for W1-P1.

**Browser finding vs. jsdom (T2-F02).** A real keyboard open **pre-activates the first selectable option** (single mode) across all observed open paths. The earlier Task-2 wording that labeled this a "jsdom artifact" is **corrected**: the browser observation stands, but the *cause* of the differing jsdom reading is **not** attributed. This is a characterization-basis clarification, not a behavior change.

**Tab focus correction (T2-F01).** The original P1.3-D04 Tab observation is **withdrawn**; with a correctly-ordered next tabbable, Tab advances focus normally in Chromium (see 16.2 and `W1-P1-DEVIATIONS.md`).

_End of W1-P1.3 Task 2 (T2-R). No production source was modified. The 32-test browser matrix passes on Chrome-for-Testing 156.0.8078.4. P1.3-P2 remain NO-GO until T2-R is independently reviewed._

---

## 17. W1-P1.3 Task 3 — keyboard selection edge cases and accessibility contract reconciliation

Task 3 extends the accepted real-Chromium harness (Task 2) to keyboard **selection** edges: range selection (Shift+Arrow, Shift+Home/End, Ctrl/Cmd+Shift), Select-All (Ctrl/Cmd+A), selected-first ordering, disabled-in-range, maxSelections, and the ARIA + event chronology of range interactions. It **does not repair** anything and **does not** change the coverage distribution (the record count stays **112**). Two new **observation candidates** (P1.3-D05, P1.3-D06) are recorded; neither authorizes a production change.

- **Harness.** `tests/e2e/w1-p1-3-t3/playwright.config.ts` (npm script `test:e2e:p13-t3`), spec `keyboard-selection.t3.spec.ts` (**23 tests**), helpers `harness.t3.ts` (re-exports the Task-2 harness + adds option-DOM-order, event-log, and `change`-payload readers). Deterministic single-project Chromium, workers=1, retries=0, headless. Browser: **Google Chrome for Testing 156.0.8078.4** (same pinned build as Task 2; version **enforced** for a certification run, override flagged).
- **Input model.** Genuine trusted keyboard events (`Shift+`/`Control+`/`Meta+` chords), **not** synthetic dispatch. Assertions read public DOM (combobox `aria-*`, `aria-activedescendant` resolution, option `aria-selected`, rendered option DOM order) and public `select`/`change` events + `onSelect`/`onChange` callbacks. No private methods invoked directly; no private state read.
- **Evidence.** `docs/architecture/baseline/w1-p1/W1-P1.3-T3-KEYBOARD-SELECTION-EVIDENCE.json`.

### 17.1 Per-matrix outcome (all PASS)

| Matrix | Tests | Result (Chromium 156) |
| --- | --- | --- |
| T3-00 browser harness | 1 | Certified version `156.0.8078.4` recorded and enforced. |
| T3-01 Shift+Arrow range | 3 | Empty multi opens no-active; 1st Shift+Down selects landing option + anchor; each step extends contiguous range; order ascending registry; plain Arrow moves active without selecting. |
| T3-02 Shift+Home/End | 3 | **Endpoint-only**: Shift+End → `['f']`, Shift+Home → `['a']` (not a contiguous range). **P1.3-D05.** |
| T3-03 Ctrl/Cmd+Shift | 3 | Additive (Ctrl or Meta); plain Shift **replaces** a pre-existing selection. |
| T3-04 Ctrl/Cmd+A | 3 | Select-all emits **only `change`** (no `select`), payload `[a..f]` / `[0..5]`; ignored in single mode. |
| T3-05 selected-first | 2 | DOM order and navigation stay **registry order** (not reordered). **P1.3-D06.** |
| T3-06 disabled in range | 2 | Disabled excluded from range fill by default; included when `disabledOptionBehavior.selectable=true`. |
| T3-07 maxSelections | 1 | Range clamps at the cap. |
| T3-08 ARIA chronology | 2 | `aria-expanded` stays true; `aria-activedescendant` tracks the moving endpoint; filled options expose `aria-selected=true`. |
| T3-09 event chronology | 2 | Range emits `select → change → onChange → onSelect`; no `open`/`close`. |
| T3-10 harness integrity | 1 | Full range flow via public surface only. |

### 17.2 New observation candidates (browser evidence)

| ID | Observation | Meaning |
| --- | --- | --- |
| P1.3-D05 | Shift+Home/End selects only the endpoint | Not a contiguous extend-to-boundary range (contrast Shift+Arrow). Characterized; design decision deferred; not repaired. |
| P1.3-D06 | selected-first does not reorder DOM/navigation | Both remain registry order at this configuration. Characterized; intent to confirm; not repaired. |

**Scope note (screen readers).** These assessments rest on the DOM + public events only; they do **not** assert screen-reader compatibility, which is out of scope for W1-P1.

_End of W1-P1.3 Task 3. No production source was modified. The 23-test browser matrix passes on Chrome-for-Testing 156.0.8078.4. Follow-on P1.3 tasks and P1.4+ remain NO-GO until Task 3 is independently reviewed._

---

## 18. W1-P1.3 closure — keyboard, focus, and accessibility characterization

Task 4 closes W1-P1.3 by reconciling Tasks 1/1-R/2/2-R/3 into one statement of the keyboard/focus/accessibility contract for `EnhancedSelect`. **No production source changed; no accepted behavioral test was modified.** The authoritative closure is `W1-P1.3-CLOSURE-REPORT.md` + `W1-P1.3-CLOSURE-EVIDENCE.json`; this section is the ledger-side summary.

- **Increments reconciled.** Addendum `0859ea9` · Task 1 `242a262` (jsdom, 45 tests) · Task 1-R `5ad506c` · Task 2 `a4c9e26` (Chromium, 31→32) · Task 2-R `b15b71f` · Task 3 `0236512` (Chromium, 23). Lineage linear.
- **Test inventory.** 100 P1.3 characterization tests: 45 jsdom (`w1-p1-3-t1-keyboard-navigation.spec.ts`), 32 Chromium (`keyboard-accessibility.t2.spec.ts`), 23 Chromium (`keyboard-selection.t3.spec.ts`). Public surface only.
- **Bases.** jsdom (dispatched `keydown`) vs certified Chromium 156.0.8078.4 (genuine trusted input + CDP AX tree). The initial-active-on-open and `aria-busy` differences between the two bases are documented; the jsdom/Chromium cause is withheld (P1.3-D03).

### 18.1 Consolidated behavior (observed; not normative)

| Area | Observed contract | Evidence |
| --- | --- | --- |
| Open/close | Keyboard opens; `open:{}`/`onOpen`; Escape/Tab close; Chromium Tab advances focus; `close:{}` (no reason). | KBD-001/006/007; T2-02/03 |
| Navigation | One selectable step; disabled skipped; clamp (no wrap); Home/End; Page ±10; type-ahead; Ctrl/Cmd+A guarded. | KBD-002..010; T2-02; T3-04 |
| Range | Shift+Arrow contiguous (anchor=landing); Shift+Home/End **endpoint-only** (D05); Ctrl/Cmd+Shift additive, plain Shift replaces; disabled excluded unless selectable; maxSelections clamps. | T3-01/02/03/06/07 |
| Payloads | Ctrl/Cmd+A `change`-only; Shift range `select→change→onChange→onSelect`, no open/close. | T3-04/09 |
| Focus/ARIA | Focus stays on input; active via `aria-activedescendant`; `aria-expanded` reflects state; `aria-busy` reflects on listbox (DOM+AX); selected-first does not reorder (D06). | KBD-011/012; T2-04/05/09; T3-05/08 |

### 18.2 Deviation finalization (P1.3-D01..D06)

| ID | Final status | Future design owner |
| --- | --- | --- |
| P1.3-D01 | Confirmed public-contract limitation (no close reason) | Future public-contract (event-detail) design |
| P1.3-D02 | Resolved (DOM + AX; not a defect) | Closed |
| P1.3-D03 | Browser observation accepted; cause unassigned | Future a11y conformance review |
| P1.3-D04 | Withdrawn (invalid comparison) | Closed |
| P1.3-D05 | Accepted observed, mode-specific; intent open | Future selection-semantics design |
| P1.3-D06 | Accepted bounded observation (tested configuration) | Future rendering/projection design |

No deviation authorizes a production change or an ADR during W1-P1.

### 18.3 Traceability & limitations

- **112 records unchanged**; coverage **Existing 38 · Partial 29 · Diagnostic 41 · Missing 4**. KBD-001..012 remain **`Partial`** (real-browser conformance, pointer parity, and cross-browser outstanding) — **not** upgraded to `Existing`. API-040/041 remain deferred to P1.2-T3-R evidence.
- **Preserved limitations:** Chromium-only real-browser evidence (no Firefox/WebKit/mobile parity claimed); AX-tree-only accessibility findings (NVDA/JAWS/VoiceOver out of scope); Ctrl/Cmd+A callback-count and D06 configuration generality are explicit coverage boundaries.

_End of W1-P1.3 (Task 4 closure). W1-P1.3 remains open until Task 4 is independently accepted. No production source modified; integrity gates: jsdom 45 (carried), Chromium 55/55, core 922+1 skipped, traceability PASS (112), production isolation empty, SHA256SUMS refreshed._

---

## 19. W1-P1.4 closure — contract-wiring characterization

Task 4 closes W1-P1.4 by reconciling Tasks 1/1-R/2/2-R/3/3-R into one statement of the wiring-completeness contract for `EnhancedSelect`. **No production source changed; no accepted behavioral test was modified; no test added by this closure.** The authoritative closure is `W1-P1.4-CLOSURE-REPORT.md` + `W1-P1.4-CLOSURE-EVIDENCE.json`; this section is the ledger-side summary.

- **Increments reconciled.** Task 1 `0cbb58b` · Task 1-R `c174876` · Task 2 `7ae3193` · Task 2-R `9b10f0b` · Task 3 `5b31f44` · Task 3-R `490cb77`. Lineage linear.
- **Test inventory.** 52 P1.4 characterization tests: 40 jsdom (`w1-p1-4-t1-contract-wiring.spec.ts` 16, `w1-p1-4-t2-attribute-state.spec.ts` 9, `w1-p1-4-t3-api-event-lifecycle.spec.ts` 15) and 12 Chromium (`attribute-state.t2.spec.ts` 5, `contract-wiring.t2.spec.ts` 7). Public surface only.
- **Bases.** jsdom (dispatched public-input events) + certified Chromium 156.0.8078.4 (genuine trusted input). ATTR-021 (motion) and ATTR-013 (override) are Chromium-confirmed; ATTR-023 spacer is Chromium-negative-only.

### 19.1 The 21 targeted contracts — final classification

| Group | Contracts | Final class |
| --- | --- | --- |
| Part tokens | PART-001/002/003/005/006/007/008/010/011 | Existing (9) |
| Part tokens | PART-009 (chip) | **Partial** — 4 stable tokens characterized; `chip-exiting` unobserved |
| Attributes | ATTR-012/013/021/022 | Existing (4) |
| Attributes | ATTR-023 (virtual spacer) | **Diagnostic** — not publicly reachable |
| API / Event | API-002, EVENT-011 | Existing (2) |
| Lifecycle | LIFECYCLE-002/003/004 | Existing (3) — observable behavior |
| Config | CONFIG-023 (`expandable`) | **Missing** — declared/defaulted, not consumed |

**21-target disposition: Existing 18 · Partial 1 · Diagnostic 1 · Missing 1.**

### 19.2 Gap dispositions (preserved)

| Contract | Class | Disposition | Owner |
| --- | --- | --- | --- |
| **PART-009** | `Partial` | 4 stable chip tokens characterized; `chip-exiting` transient not publicly reachable — **unobserved transient, not a confirmed defect**. Upgrade deferred to a future increment that can observe the exit deterministically. | Future chip-exit observation design |
| **ATTR-023** | `Diagnostic` | Public 2,000-item list renders 0 `data-virtual-spacer` at tested checkpoints; spacer reachable only via private seams. **Characterization gap** — positive behavior not forced with a private stub. | Future virtualization public-API design |
| **CONFIG-023** | `Missing` | `expandable` declared/defaulted but not consumed; no public effect. **Future Product Decision required:** (a) implement in a separately authorized production increment, **or** (b) deprecate/remove via a separately authorized API-contract decision. | Future product/API-contract decision |

None authorizes a production change, removal, or ADR during W1-P1.

### 19.3 Traceability & limitations

- **112 records.** Distribution **Existing 56 · Partial 30 · Diagnostic 22 · Missing 4**. `verify_traceability.py` PASS (112, unique, locators in bounds). All 21 P1.4-targeted `testId` references resolve to literal `it()` titles. 52 concrete-ref records all cite existing files; 15 pre-existing P1.2 label-style records are unchanged since before P1.4 and out of Task 4 scope (not rewritten).
- **Deferred out of upgrade scope:** EVENT-009, CONFIG-001, CONFIG-003, CONFIG-004, CONFIG-026 remain `Partial`.
- **Preserved limitations:** Chromium-only real-browser evidence (no Firefox/WebKit/mobile parity claimed); LIFECYCLE results are observable-only (no internal listener-cardinality/cleanup claim); no implementation-completeness claim.

_End of W1-P1.4 (Task 4 closure). W1-P1.4 remains open until Task 4 is independently accepted. No production source modified; integrity gates: jsdom P1.4 40 (carried), Chromium P1.4 12/12, core 962+1 skipped, traceability PASS (112), production isolation empty, SHA256SUMS refreshed._

---

## 20. W1-P1.5 Task 2 — async data-loading public event characterization

Task 2 characterizes the eight **P1.5 event contracts** (EVENT-004/005/006/008/012/020/021/022) through the **public surface only** — public `dataLoading` config, public methods, public `search` event / `[part="input"]` input, the `callbacks` map, and rendered shadow DOM. No private seam (`_state`, `_dataRequestCoordinator`, `_handleSearch`, `_loadMoreItems`, `*ForTest`) is touched (harness-integrity verified by grep). No production source changed; no accepted prior test was modified.

- **Spec:** `packages/core/tests/w1-p1-5-t2-async-data-loading-events.spec.ts` (**17 tests**), jsdom, public surface only.
- **Public load-more trigger:** without an `IntersectionObserver` (jsdom) the acknowledged/legacy `.load-more-button` is the public fallback trigger; acknowledged load-more is exercised by completing a `succeeded` first page then clicking the button; legacy load-more requires `infiniteScroll:false` + `searchable:false` so the button (not the sentinel) renders.
- **Determinism:** all assertions synchronize on the public `getDataLoadingState()` predicate and awaited public promises/events via `vi.waitFor`; no fixed sleeps.

### 20.1 Per-contract outcome

| ID | Characterized (public surface) | Coverage move |
| --- | --- | --- |
| EVENT-004 | Acknowledged `{query,results:[],count:0,request}`; acknowledged typed `{normalizedQuery}`; local `{query,results,count}` filtered count | Diagnostic → **Existing** |
| EVENT-005 | Negative: not emitted on acknowledged page completion nor legacy load-more; completion via `dataProjection`/`loadMore` | Missing → **Missing** (confirmed declared-only; DEVIATION-02) |
| EVENT-006 | Async server-failure `error` `{message,cause}` emitted before `onError` | Partial → **Partial** (broader error sources outstanding) |
| EVENT-008 | Acknowledged `{page,items:[],request.kind:'loadMore'}`; legacy `{page:2,items:[]}` (no request envelope) | Diagnostic → **Existing** |
| EVENT-012 | Single bounded `diagnostic` `{source:'event',name:'acknowledgedDataLoadingResourceLimit',timestamp}` | Diagnostic → **Existing** |
| EVENT-020 | `dataProjection` `{status:'complete',requestId,queryGeneration,attempt}`; one per accepted completion | Diagnostic → **Partial** (`failed` projection only via private seam; outstanding) |
| EVENT-021 | `dataRequestCancel` `{requestId,queryGeneration,reason}` for `query-changed`/`config-changed`/`disconnected`; callback detail parity | Diagnostic → **Existing** |
| EVENT-022 | `dataLoadingConfigError` `{issues:[{path,code,message}]}`; no-emit-on-valid; dedup | Diagnostic → **Existing** |

### 20.2 Outstanding (not forced)

- **EVENT-020 `failed` projection** — the `dataProjection` `'failed'` variant (and its `acknowledgedProjectionFailed` diagnostic) is only reachable via `_failNextAcknowledgedProjectionForTest`; no public trigger exists. Recorded as **public-unobservable** (plan §7 risk 2); EVENT-020 conservatively **Partial**.
- **EVENT-005** stays **Missing** — `pageLoaded` is declared-only; the negative is now proven (DEVIATION-02 ADR candidate).

### 20.3 Distribution & integrity

- **112 records.** Distribution **Existing 63 · Partial 32 · Diagnostic 13 · Missing 4 = 112** (from 58/31/19/4 after T1-R; six event rows upgraded, none silently). `verify_traceability.py` **PASS** (112 unique, locators in bounds, all 6 new `testId` literals resolved).
- Production isolation: **0** files changed in `packages/core/src` (or engine/adapters) vs the corrective base; accepted prior tests unchanged; no probe files remain.

_End of W1-P1.5 Task 2 (original submission, `3dff949`). Superseded for classification by §21 (T2-R): EVENT-012 moved Existing → Partial; distribution now 62/33/13/4. Tasks 3–4, P1.6, P1-P2, Angular Wave 2 remain NO-GO until T2-R is independently accepted._

---

## 21. W1-P1.5 Task 2 — corrective increment (T2-R)

T2-R responds to the independent review of `3dff949` (CONDITIONALLY ACCEPTED; findings T2-F01..T2-F05). It **strengthens** the existing 17 T2 tests (no prior test deleted); the spec grows to **19 tests** (EVENT-012 split into three bounded cases; EVENT-021 callback test gains ordering + reference identity). Same public surface only, no private seam, no fixed sleeps. No production source changed; no accepted prior test modified.

### 21.1 Findings and resolutions

| Finding | Severity | Resolution |
| --- | --- | --- |
| **T2-F01** EVENT-008 vacuous self-comparison | Medium | Acknowledged load-more now establishes the active request explicitly: `kind='loadMore'`, `position.mode='page'`, `page=2`, request id ≠ initial search id, and the emitted `detail.page`/`detail.request.position`/`requestId`/`queryGeneration` are pinned to that request. The `? :` self-fallback is removed — the test fails if no page-mode load-more request exists. |
| **T2-F02** EVENT-012 boundedness overstated | Medium | Asserts the resource-limit diagnostic **payload** (`detail.{reason:'cursor-token-size',maxCursorTokenBytes:1024,actualCursorTokenBytes:50000,requestId}`) and the snapshot `resourceLimit` mirror. Proves boundedness is **per-result, not global** — a replayed completion re-emits (2 diagnostics). A healthy-success test documents that the `acknowledgedProjectionFailed` diagnostic is **not** characterized. **EVENT-012 reclassified Existing → Partial** (no private failure injection used). |
| **T2-F03** EVENT-021 evidence/assertion mismatch | Low | Callback test now uses `toBe()` (reference identity — probe-confirmed true) and asserts event-before-callback ordering. `config-changed` and `disconnected` now assert `queryGeneration` in addition to `requestId` + `reason`, plus exact key set `{queryGeneration,reason,requestId}` and cardinality 1. |
| **T2-F04** EVENT-020 unreachability overstated | Low (evidence) | Ledger + evidence now state: *no deterministic public trigger for the `failed`-projection variant was established in this increment*; production's general projection-exception path (`_recordAcknowledgedProjectionFailure`) is acknowledged, but existing coverage reaches it only via private seam. EVENT-020 stays **Partial**; absolute "only reachable via this seam" claim removed. |
| **T2-F05** EVENT-005 negative boundary | Low (evidence) | Tests renamed to `(bounded runtime observation)` and an in-spec boundary note added: the runtime negative is distinct from the source-inspection "declared, no dispatch site" finding; neither over-claims. EVENT-005 stays **Missing**; DEVIATION-02 ADR candidate. |

### 21.2 Reconciliation & integrity

- **112 records** (no ID added/removed). Distribution **Existing 62 · Partial 33 · Diagnostic 13 · Missing 4 = 112** — from 63/32/13/4 after T2 (EVENT-012 only, Existing → Partial). Matches the Lead's expected conservative distribution.
- `verify_traceability.py` **PASS** (112 unique; locators in bounds; testIds resolve to existing spec files). Changed `testId`s: EVENT-008 (renamed title), EVENT-012 (new title), EVENT-021 (config-changed title).
- Production isolation **0** files in `packages/core/src` (or engine/adapters) vs `3dff949`; accepted prior tests unchanged; no probe files remain.

_End of W1-P1.5 Task 2 (T2-R). Tasks 3–4, P1.6, P1-P2, Angular Wave 2 remain NO-GO until T2-R is independently accepted._

## 22. W1-P1.5 Task 3 — lifecycle stale async result guard (LIFECYCLE-005)

Task 3 characterizes the single authorized contract **LIFECYCLE-005** (stale asynchronous result guard) on the public surface only: **6** new jsdom tests in `w1-p1-5-t3-lifecycle-stale-async-guard.spec.ts`. No production source changed; no prior test modified; no private seam; no fixed sleeps.

### 22.1 Discriminating scenarios

Every superseded/disconnected/unknown operation is resolved with a **non-benign payload that would change observable state/events if the guard were absent**, and supersession resolves **newer-before-older** so a missing guard would visibly overwrite the current result or emit an unintended follow-on event.

| # | Scenario | Public surface | Non-benign result |
| --- | --- | --- | --- |
| 1 | Two overlapping `setSelectedValues` server fetches; stale resolves last | `setSelectedValues`, `getSelectedValues`, `change` | stale `'first'` must not overwrite newer `'second'`; exactly one `change` |
| 2 | Stale success resolving after a newer success | value + `change` non-mutation | stale distinct item dropped |
| 3 | Stale **failure** after newer success | `error` absent; selection retained | stale rejection swallowed |
| 4 | Disconnect mid-flight with a real resolved item | remove before resolve | detached non-benign item dropped; 0 events |
| 5 | Acknowledged stale completion after supersession | `startDataLoading`, `completeDataRequest`, `getDataLoadingState`, `dataProjection` | stale returns `'stale'`; no projection; status stays `loading`; current then `'accepted'` + single `complete` |
| 6 | Acknowledged completion with unknown request identity | `completeDataRequest`, `getDataLoadingState` | not `'accepted'`; no projection; status stays `loading` |

### 22.2 Discriminator proof

The production guards (`_loadSelectedItemsByValues` generation/disconnect guard; `completeDataRequest` inactive/unknown routing to `classifyInactiveRequest`) were **temporarily neutralized locally**: **all 6 tests FAIL** with the guards broken and **all 6 PASS** with them intact. Production source was restored (0 remnants; `git diff` vs `bc30c0f` on `packages/core/src` empty). This empirically demonstrates the tests discriminate a working guard from one that applies obsolete results; no benign "nothing changed" observation is used as evidence.

### 22.3 Reconciliation & integrity

- **112 records** (no ID added/removed). Distribution **Existing 62 · Partial 34 · Diagnostic 13 · Missing 3 = 112** — from 62/33/13/4 after T2-R (LIFECYCLE-005 only, Missing → Partial). LIFECYCLE-005 is classified **Partial**, not Existing, because cursor/page concurrency and load-more interleavings are not exhaustively characterized.
- `verify_traceability.py` **PASS** (112 unique; locators in bounds; LIFECYCLE-005 testId resolves to the first scenario title).
- Core regression **1012 passed | 1 skipped** (1006 + 6 new); ESLint clean.
- Production isolation **0** files in `packages/core/src` (or engine/adapters) vs `bc30c0f`; accepted prior tests unchanged; no probe files remain.
- Note: the pre-existing P1.2 supersession test resolves its stale fetch to an **empty** array (benign) and cannot by itself distinguish a working guard; T3 closes that gap with non-benign stale payloads.

_End of W1-P1.5 Task 3. Task 4, P1.6, P1-P2, Angular Wave 2 remain NO-GO until Task 3 is independently accepted._

## 23. W1-P1.5 Task 4 — increment closure (acknowledged / asynchronous data-loading)

Task 4 is the **documentation-only** closure of W1-P1.5: it consolidates Tasks 1–3 into a single closure report (`W1-P1.5-CLOSURE-REPORT.md`) and machine-readable evidence (`W1-P1.5-CLOSURE-EVIDENCE.json`). **No production source changed; no behavioral test added or modified; no classification changed beyond what Tasks 1–3 already committed.**

### 23.1 Lineage (ancestry-verified, linear)

`73cd954` (T1) → `84b760a` (T1-R) → `3dff949` (T2) → `6682c83` (T2-R) → `bc30c0f` (T2-R1) → `693aaca` (T3) → this (T4).

### 23.2 Final coverage of the 13 P1.5 contracts

| Contract | Final class | Contract | Final class |
| --- | --- | --- | --- |
| API-032 | Existing | EVENT-008 | Existing |
| API-060 | Existing | EVENT-012 | **Partial** |
| API-061 | Existing | EVENT-020 | **Partial** |
| API-062 | **Partial** | EVENT-021 | Existing |
| EVENT-004 | Existing | EVENT-022 | Existing |
| EVENT-005 | **Missing** | LIFECYCLE-005 | **Partial** |
| EVENT-006 | **Partial** | | |

**13-target disposition: Existing 7 · Partial 5 · Missing 1.** Preserved gaps: API-062 (cursor-depth), EVENT-005 (declared-only, DEVIATION-02), EVENT-006 (broader error sources), EVENT-012 (`acknowledgedProjectionFailed`), EVENT-020 (`failed`-projection), LIFECYCLE-005 (concurrency interleavings).

### 23.3 Reconciliation & integrity

- **112 records** (no ID added/removed). Distribution **Existing 62 · Partial 34 · Diagnostic 13 · Missing 3 = 112** — unchanged by this closure (Tasks 1–3 already set it; T4 does not reclassify).
- `verify_traceability.py` **PASS** (112 unique; locators in bounds; testIds resolve).
- Core regression **1012 passed | 1 skipped**; P1.5 specs **50 passing** (25 + 19 + 6). All jsdom (async `detail`/snapshot contracts are DOM-independent).
- Production isolation **0** files in `packages/core/src` (or engine/adapters) vs `693aaca`; accepted prior tests unchanged; no test files touched.
- Deferred residuals **not absorbed** (unchanged prior classes): EVENT-009, CONFIG-001/003/004/026 (P1.4 residuals); PART-009, ATTR-023, CONFIG-023 (P1.4 gaps); KBD-001..012, P1.3-D01 (P1.3 residuals).
- **Limitations preserved:** no browser-parity claim; no comprehensive async-safety claim; no implementation-completeness claim.

_End of W1-P1.5 Task 4 closure. W1-P1.5 remains open until this closure commit is independently accepted. W1-P1.6, W1-P2 Extraction, Angular Wave 2 remain NO-GO until then._

---

## 24. W1-P1.6 Task 1 — Security utilities (public surface) characterization

W1-P1.6 is the SSR/security increment named in §10 (line 353, "SSR/security … P1.6") and §12 (line 469, security/CSP utilities "Documented-only per section 10; not certified"). These surfaces carried **zero** contract IDs; this section defines and certifies them through the **public package import only** (`packages/core/src/index.ts`). The utilities are imported by no component — they are a standalone public utility surface.

**Family mapping:** the `security.ts` HTML-safety helpers are encoded as `API-0xx` (package API); the `CSPFeatures`/`detectEnvironment` capability surface as `CONFIG-0xx`.

**Public-boundary finding (API-063):** `resetHTMLSanitizer` exists in `security.ts` but is **NOT** re-exported from the package entry; only `setHTMLSanitizer` is public. Tests restore identity behavior through the public setter. The genuine default `NoOpSanitizer` is a private, unexported class and cannot be recreated; the pristine-default assertions (API-063 identity, API-064 warning) therefore run before any setter call. **T1-R isolation bound (T1-F02):** the sanitizer registry is process-global module state; Reset is not public and the private `NoOpSanitizer` cannot be recreated, so isolation is bounded by **ordering** (pristine-default tests consolidated first). After the spec file runs, the process-global sanitizer is left as the identity-behaviour sanitizer, **not** the pristine default — a documented limitation; future pristine-default tests must use a separate module/worker boundary. A post-condition test (`T1-F02: process-global sanitizer is identity-behaviour …`) pins the end-of-file state. **T1-R1 (T1-R-F01):** the prior final test only proved a sanitizer existed; the preceding API-064 test left an `html.toUpperCase()` sanitizer installed, so the claimed identity end-state was wrong. T1-R1 rewrites the final step to explicitly `setHTMLSanitizer(identitySanitizer)` via the public setter and verify reference identity, `sanitizeHTML` passthrough (`<b>MixedCase</b>` unchanged), and that `validateTemplate` emits no pristine-default warning. Identity **behaviour** is restored; the private `NoOpSanitizer` **instance** is not.

| Contract ID | Behavior | Source (`security.ts`) | Coverage | testId |
| --- | --- | --- | --- | --- |
| API-063 | Sanitizer registry: default no-op identity; set→get round-trip; sanitizeHTML delegates; `resetHTMLSanitizer` NOT a public export | 19-69 | Existing | `w1-p1-6-t1-security-utilities.spec.ts#API-063: default sanitizer is a no-op identity that returns input unchanged` |
| API-064 | `validateTemplate` warns only under pristine default no-op (message names source) and returns sanitized output; silent under custom sanitizer | 248-259 | Existing | `...#API-064: warns and returns sanitized output under the pristine default no-op sanitizer` |
| API-065 | `createElement` applies safe attrs + textContent; blocks **only** names STARTing with lowercase `on` or **exactly** `style` (case-sensitive) with a warn per blocked attr. **Partial:** mixed-case `ONCLICK`/`OnLoad`/`Style`/`STYLE` bypass the filter and are applied (`ONCLICK` installs a **live** handler). Not an XSS defense (default sanitizer is a no-op). *(Reclassified Existing→Partial under T1-R / T1-F01.)* | 99-128 | **Partial** | `...#API-065: blocks lowercase on* and exact "style" attributes (not set) and warns once per blocked attribute` (+3 mixed-case supplementary tests) |
| API-066 | `setCSSProperties` sets only `--` custom properties; non-`--` keys skipped with warn, never applied | 130-138 | Existing | `...#API-066: warns and skips non-custom properties without applying them` |
| API-067 | `createTextNode`/`setTextContent` build/assign literal text without HTML parsing | 76-95 | Existing | `...#API-067: setTextContent assigns literal text (no element parsing)` |
| API-068 | `escapeHTML` encodes via textContent; `escapeAttribute` encodes `& " ' < >` | 279-295 | Existing | `...#API-068: escapeAttribute encodes & " ' < >` |
| API-069 | `containsSuspiciousPatterns` flags `<script`/`javascript:`/`on*=`/`eval(`/`Function(`/`setTimeout(`/`setInterval(`; false for safe markup | 262-274 | Existing | `...#API-069: flags <script>, javascript:, on*=, eval(, Function(, setTimeout(, setInterval( patterns` |
| CONFIG-027 | `CSPFeatures` family: capability predicates return boolean without throwing; `getCSPDirectives` reads CSP meta-tag content, `[]` when none | 143-216 | Existing | `...#CONFIG-027: getCSPDirectives reads content values from CSP meta tags` |
| CONFIG-028 | `detectEnvironment` returns 6-field `EnvironmentCapabilities` agreeing with individual predicates | 233-242 | Existing | `...#CONFIG-028: fields agree with the individual CSPFeatures predicates` |

**Totals:** 9 new P1.6 contracts: **8 Existing + 1 Partial** (API-065) (public-import, deterministic, negative paths included). Distribution after T1-R: **Existing 70 · Partial 35 · Diagnostic 13 · Missing 3 = 121** (was 62/34/13/3 = 112 at P1.5; T1 alone gave 71/34/13/3, then T1-R moved API-065 Existing→Partial). API 27→34; CONFIG 26→28; P1.6 = 9.

**Out of scope for T1 (deferred to T2/T3 within P1.6):** `utils/csp-styles.ts` helpers (applyClasses/toggleClass/custom-property family/defaultTheme/shadowDOMStyles/injectShadowStyles/hasOverflowHiddenAncestor/warnCSPViolation) and SSR import-time/deferred-DOM safety.

**Non-absorption:** no P1.3/P1.4/P1.5 residual or DEVIATION-09 is absorbed; those remain with their owners.

_End of W1-P1.6 Task 1 (original, `116707f`). W1-P1.6-T1-R (`7183165`) reclassified API-065 Existing→Partial (T1-F01) and bounded sanitizer isolation (T1-F02). W1-P1.6-T1-R1 fixes the sanitizer end-state test to explicitly restore+verify identity behaviour (T1-R-F01). Tasks 2–4 remain NO-GO pending independent acceptance; P1.6 closure not yet claimed._

---

## 25. W1-P1.6 Task 2 — CSP-compliant styling utilities (public surface) characterization

W1-P1.6 Task 2 certifies the `packages/core/src/utils/csp-styles.ts` public surface through the **public package import only** (`packages/core/src/index.ts`), continuing the §24 approach. These six contracts were previously documented-only (plan §1.1: zero contract IDs; the frozen `csp.spec.ts` imports the utils modules directly and pins no W1-P1 contract). Family mapping follows the Task 2 workstreams: class/style/theme/shadow/overflow/warning helpers as `API-0xx` (package API); the theme/config-shaped surface (`defaultTheme`/`applyDefaultTheme`/`shadowDOMStyles`) as `CONFIG-0xx` (per plan §2.2 CONF-z).

**Environment note (conservative jsdom):** the runner sets `NODE_ENV=test`, so the development-only warning branches execute. Production-**conditioned** source behavior is verified by `vi.stubEnv('NODE_ENV','production')` — this exercises the SOURCE under a controlled environment; it does NOT certify a compiled production artifact, nor compatibility with an enforced browser CSP (T2-F04). jsdom reflects **inline** custom properties and **inline** `overflow` in `getComputedStyle`; layout-/stylesheet-derived computed styles are NOT claimed.

| Contract ID | Behavior | Source (`csp-styles.ts`) | Coverage | testId |
| --- | --- | --- | --- | --- |
| API-070 | `applyClasses` joins non-empty (truthy) names into `className` (REPLACES, not additive); `toggleClass` toggles with optional force (true=add/false=remove), idempotent under force | 10-19 | Existing | `w1-p1-6-t2-csp-styles.spec.ts#API-070: applyClasses joins non-empty class names in order, dropping falsy entries` |
| API-071 | Custom-property family: `setCustomProperties` sets only `--` keys (dev warn+skip others; silent+skip under production) — **prefix enforced**; `getCustomProperty` reads trimmed computed value (empty string when unset) and `removeCustomProperty` removes — **prefix NOT enforced** (getter/remover also act on ordinary CSS properties like `color`/`display`; asymmetry characterized, T2-F02) | 31-61 | Existing | `...#API-071: setCustomProperties applies --prefixed custom properties` |
| CONFIG-029 | `defaultTheme` stable **13-entry** `--ns-*` map (pinned vs independent expected object; not frozen); `applyDefaultTheme` applies every entry; `shadowDOMStyles` static string with `:host`/`.ns-*`/`var(--ns-*)`, no `<script>` | 66-201 | Existing | `...#CONFIG-029: defaultTheme is a stable 13-entry map matching the expected pinned values` |
| API-072 | `injectShadowStyles` appends a single `<style>` (text = static `shadowDOMStyles`) to a ShadowRoot; additive on repeat (no dedupe) | 205-209 | Existing | `...#API-072: injectShadowStyles appends one <style> whose text is the static shadowDOMStyles` |
| API-073 | `hasOverflowHiddenAncestor` **traverses the `parentElement` chain**, **excluding `document.body`**, and returns `true` if a traversed ancestor has computed overflow `hidden`/`clip`; otherwise returns `false`. Connection is not required: a detached subtree may return `true`, while a **parentless** element returns `false` (T2-F01) | 214-226 | Existing | `...#API-073: detects an overflow:hidden ancestor` |
| API-074 | `warnCSPViolation` warns ONLY in non-production naming feature+fallback; silent under `NODE_ENV=production` | 231-238 | Existing | `...#API-074: warns in development naming both the feature and the fallback` |

**Totals:** 6 new P1.6 contracts, all **Existing** (public-import, deterministic, positive+negative paths; production branch stubbed). Distribution after T2: **Existing 76 · Partial 35 · Diagnostic 13 · Missing 3 = 127** (was 70/35/13/3 = 121 after T1-R1). API 34→39; CONFIG 28→29; P1.6 9→15.

**Characterized limitations (documented, not defects):** (1) `getCustomProperty` and `hasOverflowHiddenAncestor` rest on jsdom reflection of inline styles; stylesheet-/layout-derived computed values are out of scope. (2) **Prefix asymmetry (T2-F02):** only `setCustomProperties` enforces `--`; `getCustomProperty`/`removeCustomProperty` also read/remove ordinary CSS properties. (3) **Parent-chain, not connection (T2-F01):** `hasOverflowHiddenAncestor` returns true iff a traversed ancestor has overflow hidden/clip (excluding body); connection is not required — a detached subtree may return true and a parentless element returns false. (4) `injectShadowStyles` does not dedupe (callers must guard).

**Out of scope for T2:** SSR / import-time / deferred-DOM safety (`security.ts`/`csp-styles.ts` import in a no-DOM Node env) — that is Task 3.

**Non-absorption:** no P1.3/P1.4/P1.5 residual or DEVIATION-09 absorbed; production source and the frozen `csp.spec.ts` unchanged.

_End of W1-P1.6 Task 2. W1-P1.6-T2-R (T2-F01..F04) strengthened characterization (API-071 prefix asymmetry, API-073 parent-chain/detached, CONFIG-029 full 13-entry map) and evidence precision; coverage counts unchanged (127; 76/35/13/3). Tasks 3–4 remain NO-GO pending independent T2-R acceptance; P1.6 closure not yet claimed._

---

## 26. W1-P1.6 Task 3 — SSR / import-time safety (no-DOM Node) characterization

W1-P1.6 Task 3 characterizes the core package's behavior in a **genuine Node process with no `document`/`window`/`HTMLElement`**. It runs via `packages/core/vitest.ssr.config.ts` (`environment: 'node'`, **no** shared setup) — the shared `tests/setup.ts` imports the web components, which `extend HTMLElement` at class-declaration time and throw on import without a DOM, so it is intentionally not run here. The SSR spec is **excluded** from `vitest.config.ts` so the jsdom suite never picks it up. This is the plan §2.3 pair of contracts (SEC/API-m → API-075, SEC/API-n → API-076), both previously **Missing**. The package entry is the mandatory target (boundary #3); a caught import-time exception is recorded as a limitation, not claimed as safety (boundary #7).

**Environment (proven, not assumed):** a shared `assertNoDom()` helper asserts `typeof document === 'undefined'`, `typeof window === 'undefined'`, `typeof HTMLElement === 'undefined'` and is called immediately before **every** dynamic import in every test (T3-F02). No DOM globals are fabricated or deleted.

**Key observed finding:** the **utility modules** (`security.ts`, `csp-styles.ts`) import without a DOM and defer `document` access to **call time** — but the **package entry** (`index.ts`) **throws** `ReferenceError: HTMLElement is not defined` at import, because it re-exports components whose class declarations `extends HTMLElement` (e.g. `native-select.ts:17`). Package-entry import-safety is therefore **not satisfied today** (recorded limitation; fixing it is a production change and out of scope for this characterization).

| Contract ID | Behavior | Source | Coverage | testId |
| --- | --- | --- | --- | --- |
| API-075 | Import-time safety (no-DOM Node): utility modules import without top-level `document`/`window` access; package ENTRY **throws** `ReferenceError` (HTMLElement) because exported components `extend HTMLElement` at import. Import-safety only partially satisfied — **entry limitation recorded, not claimed safe** | `index.ts:1-92`; `components/native-select.ts:17`; `security.ts:1-295`; `csp-styles.ts:1-238` | Partial | `w1-p1-6-t3-ssr-import-safety.spec.ts#API-075: the package ENTRY import THROWS in no-DOM Node (limitation recorded, not claimed safe)` |
| API-076 | Deferred DOM access: utility modules import successfully; calling DOM-dependent helpers (`escapeHTML`, `createElement`) throws `ReferenceError: document is not defined` at **call time**, not import; non-DOM helpers (`escapeAttribute`, `containsSuspiciousPatterns`, `defaultTheme`/`shadowDOMStyles`) and duck-typed `applyClasses`/`hasOverflowHiddenAncestor` work without a global DOM | `security.ts:78-169`; `csp-styles.ts:10-226` | Existing | `w1-p1-6-t3-ssr-import-safety.spec.ts#API-076: DOM-dependent helpers throw ReferenceError at CALL time (deferred, not import)` |

**Totals:** 2 new P1.6 contracts: **1 Existing (API-076) + 1 Partial (API-075)**. Distribution after T3: **Existing 77 · Partial 36 · Diagnostic 13 · Missing 3 = 129** (was 76/35/13/3 = 127 after T2-R1). API 39→41; P1.6 15→17. The three pre-existing **Missing** records (API-054/P1.2, EVENT-005/P1.5, CONFIG-023/P1.4) are **unchanged** — API-075 and API-076 are **new** records, not reclassifications. (The two SSR contracts were previously *planned* but not *registered*, so registering them does not reduce the Missing count. Prior 'Missing 3→1' text was incorrect — T3-F01.)

**Characterized limitations (documented, not defects):** (1) **Package-entry import-safety is NOT satisfied** — `index.ts` import throws in a no-DOM process because web-component classes extend `HTMLElement` at module-evaluation time (API-075). Consumers needing SSR import-safety must import the utility modules directly, not the entry. (2) The deferred-access proof (API-076) is exercised via the utility modules reachable without the entry.

**Test harness note:** the SSR spec is run separately (`npx vitest run --config packages/core/vitest.ssr.config.ts`, 6 tests) and excluded from the jsdom config; the main core suite remains **1063 passed | 1 skipped** unchanged. **Verifier scope (T3-F03):** `python3 docs/architecture/baseline/w1-p1/verify_traceability.py` prints `ledger IDs=129 json records=129 unique json=129` / `PASS: ledger/matrix reconcile; IDs unique; targets valid; locators in bounds` (exit 0). It checks ID-set equality, uniqueness, target validity, coverage-label validity, testId file existence, and locator bounds — but it does **NOT** recompute `reconciliation.byCoverage`. A passing run is therefore not proof the coverage summary reconciles; the summary was reconciled manually in T3-R. The verifier validation gap is identified for a separate decision and not fixed here.

**Out of scope for T3:** Task 4 (reconciliation + closure docs + checksums) and any production fix of the package-entry import failure. No adapter hydration, no Angular integration, no production CSP remediation, no DEVIATION-09.

**Non-absorption:** no P1.3/P1.4/P1.5 residual or DEVIATION-09 absorbed; production source and the frozen `csp.spec.ts` unchanged.

_End of W1-P1.6 Task 3. W1-P1.6-T3 characterizes SSR import-time safety (API-075, Partial — package-entry limitation recorded) and deferred DOM access (API-076, Existing). Coverage 76/35/13/3 → 77/36/13/3 = 129. W1-P1.6-T3-R corrects the coverage summary (T3-F01: 77/36/13/3, not 77/36/13/1), adds no-DOM guards before every import in the API-076 tests (T3-F02), and corrects the verifier-evidence claim (T3-F03). Task 4 (closure) and P1.6 closure remain NO-GO pending independent T3-R acceptance._

---

## 27. W1-P1.6 Task 4 — Closure (reconciliation & closure evidence, documentation only)

W1-P1.6 Task 4 consolidates the accepted P1.6 increments (Tasks 1, 1-R, 1-R1, 2, 2-R, 2-R1, 3, 3-R) into the final closure package. **Documentation only:** no production source changed, no behavioral test added or modified, no reclassification beyond what Tasks 1–3 committed, no verifier change. This section adds no contract ID and preserves the **129-record** inventory; it records the final P1.6 coverage, the reconciliation, and the outstanding limitations. Machine-readable detail is in `W1-P1.6-CLOSURE-EVIDENCE.json`; narrative in `W1-P1.6-CLOSURE-REPORT.md`. **This section does not claim W1-P1.6 is formally closed** — that is gated on independent Task 4 acceptance.

**Lineage (linear):** `116707f` (T1) → `7183165` (T1-R) → `e598e5c` (T1-R1) → `dc1131f` (T2) → `61ebba0` (T2-R) → `44dc148` (T2-R1) → `98935ca` (T3) → `e6b89fa` (T3-R) → this Task 4 closure.

### 27.1 P1.6 test inventory

| Harness | Spec | Tests | Contracts |
| --- | --- | --- | --- |
| jsdom | `w1-p1-6-t1-security-utilities.spec.ts` | 26 | API-063..069, CONFIG-027..028 |
| jsdom | `w1-p1-6-t2-csp-styles.spec.ts` | 25 | API-070..074, CONFIG-029 |
| Node | `w1-p1-6-t3-ssr-import-safety.spec.ts` | 6 | API-075, API-076 |
| **Total** | | **57** | 17 P1.6 contracts |

### 27.2 Final P1.6 coverage (17 contracts)

**Existing 15 · Partial 2 (API-065, API-075) · Diagnostic 0 · Missing 0 = 17.** All 17 `testId`s resolve to real `it()` titles; all source locators within bounds.

| Contract | Coverage | Note |
| --- | --- | --- |
| API-063, API-064, API-066, API-067, API-068, API-069 | Existing | security utilities (sanitizer, construction, escaping, detection) |
| **API-065** | **Partial** | `createElement` blocks `on*`/`style` **case-sensitively** (mixed-case bypass) — open production security limitation |
| CONFIG-027, CONFIG-028 | Existing | `CSPFeatures`, `detectEnvironment` |
| API-070, API-071, API-072, API-073, API-074 | Existing | csp-styles (classes, custom-props w/ prefix asymmetry, shadow inject, overflow ancestor, CSP warn) |
| CONFIG-029 | Existing | `defaultTheme`/`applyDefaultTheme`/`shadowDOMStyles` |
| **API-075** | **Partial** | SSR import-time safety: utils import-safe, **package entry throws** (`HTMLElement` undefined) — open production compatibility limitation |
| API-076 | Existing | Deferred DOM access — certified **only for the tested utility functions** |

### 27.3 Matrix reconciliation (whole matrix)

| Stage | Existing | Partial | Diagnostic | Missing | Total |
| --- | --- | --- | --- | --- | --- |
| P1.5 closure | 62 | 34 | 13 | 3 | 112 |
| after T1-R1 | 70 | 35 | 13 | 3 | 121 |
| after T2-R1 | 76 | 35 | 13 | 3 | 127 |
| **final (T3-R)** | **77** | **36** | **13** | **3** | **129** |

P1.6 added 17 contracts (API +14, CONFIG +3); Existing +15, Partial +2 (API-065 reclassified in T1-R; API-075 new). **The three pre-existing Missing records — API-054 (P1.2), EVENT-005 (P1.5), CONFIG-023 (P1.4) — are unchanged.**

### 27.4 Outstanding limitations (disclosed, not remediated)

- **API-065** — case-sensitive `on*`/`style` filtering: **open production security limitation.**
- **API-075** — package-entry SSR import failure: **open production compatibility limitation.**
- **API-076** — deferred DOM access: **certified only for the tested utility functions.**
- **Traceability verifier summary-validation gap** — `verify_traceability.py` does not recompute `reconciliation.byCoverage`: **open tooling improvement** (summary reconciled manually; verifier change not authorized).
- **Browser CSP enforcement** — **not certified** (source-conditioned behavior only).
- **Framework hydration / adapters** — **not certified** (out of W1-P1 scope).

### 27.5 Findings resolved (all CLOSED)

T1-F01, T1-F02, T1-R-F01, T2-F01, T2-F02, T2-F03, T2-F04, T2-R-F01, T3-F01, T3-F02, T3-F03. The API-065 and API-075 deficiencies remain **open production limitations** (recorded, not remediated).

### 27.6 Disposition / non-absorption

No P1.3/P1.4/P1.5 residual or DEVIATION-09 absorbed; the three Missing records and all residuals retain their original owners. **DEVIATION-09** ("P1.6 / forms") is a forms/validation decision, **excluded** from the security/SSR scope.

_End of W1-P1.6 Task 4 (closure preparation). Documentation only; 129-record inventory preserved; P1.6 coverage 15 Existing / 2 Partial = 17; whole-matrix 77/36/13/3 = 129. W1-P1.6 overall closure and W1-P2/Angular remain NO-GO pending independent Task 4 acceptance. No production source, behavioral test, verifier, adapter, or previously-accepted artifact changed._
