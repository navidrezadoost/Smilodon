# W1-P1 Public Behavioral Contract Ledger

**Increment:** W1-P1.1 — Public contract ledger and traceability skeleton
**Correction:** W1-P1.1-R — Inventory and traceability reconciliation (documentation only)
**Branch:** `codex/w1-p1-characterization-7e3adf7`
**Baseline of record:** `7e3adf77545f8e1b2b4f85949684d7d91b84456b`
**Primary source:** `packages/core/src/components/enhanced-select.ts` (**9,109 lines**), plus `select-option.ts` (634), `types.ts` (183), `config/global-config.ts` (528), and the data-loading modules it depends on.
**Status:** inventory + reconciled traceability. This is **not** a compatibility freeze and **not** approval of any behavior. Untested contracts are recorded as gaps, not as certified behavior.

> **W1-P1.1-R note.** This revision reconciles the inventory counts to a single counting convention, completes the configuration-default inventory, and gives **every** contract ID a precise source locator. The machine-readable matrix `W1-P1-TRACEABILITY.json` now carries **one record per ledger ID (100 records)**. See section 11 for the reconciliation counts. No production source was modified.

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
| CONFIG-026 | `callbacks` | `{}` (no default callbacks; `onChange`/`onSelect`/`onOpen`/`onClose`/`onError`/`onClear` are opt-in) | 421 | Documented |

> Data-loading (`dataLoading`) config is validated by `validateDataLoadingConfig` and is **not** part of `defaultConfig`; `_dataLoadingConfig` seeds from `LEGACY_DATA_LOADING_CONFIG = { protocol:'legacy', searchMode:'local', paginationMode:'page', firstPage:1 }`. Characterize in P1.5 (not in the CONFIG-001..026 defaults inventory).

---

## 8. Known deviations

Full detail in `W1-P1-DEVIATIONS.md`. Summary (all six preserved by W1-P1.1-R; DEVIATION-01 extended with the archival note - R-07):

| ID | Finding (short) | Class | Target | Disposition |
| --- | --- | --- | --- | --- |
| DEVIATION-01 | Prior W1-P0 ledger was uncommitted/absent on this branch; archival reference only. | Internal (process) | P1.1 | Superseded; archival note in provenance (section 1, 12). |
| DEVIATION-02 | `pageLoaded` declared in event map but never emitted; omitted from capabilities. | Unknown | P1.5 | Characterize; ADR candidate. |
| DEVIATION-03 | `search` payload shape (local vs acknowledged) not pinned. | Unknown | P1.5 | Pin both payloads. |
| DEVIATION-04 | `setSelectedValues` async ordering not asserted by current tests. | Unknown | P1.2 | Lock via black-box test. |
| DEVIATION-05 | `connectedCallback` forces `style.display='block'`. | Internal (quirk) | P1.4 | Characterize; ADR if blocking. |
| DEVIATION-06 | Dev-only projection asserts can throw if tests manipulate legacy projections directly. | Internal | P1.2 | Drive via public API only. |

---

## 9. Traceability seed for P1.2-P1.6

The machine-readable matrix is `W1-P1-TRACEABILITY.json`. Coverage classes: `Existing` (adequate black-box across the contract's characterized paths) - `Partial` (externally observable test covers some paths; others outstanding) - `Diagnostic` (private/perf only) - `Missing` (no coverage). Every ID in sections 2-7 has exactly one JSON record (R-01). Per-increment rollup:

| Target | Contracts |
| --- | --- |
| P1.1 | API-050..053 |
| P1.2 | API-001, 004, 010, 011, 012, 013, 014, 020, 042, 043, 054; EVENT-001, 007, 010 |
| P1.3 | API-030, 031, 040, 041; EVENT-002, 003; ATTR-001..003, 010, 011, 020; LIFECYCLE-006 |
| P1.4 | API-002, 003, 021, 055; EVENT-009, 011; ATTR-012, 013, 021, 022, 023; PART-001..011; SLOT-001..004; LIFECYCLE-001..004; CONFIG-001..026 |
| P1.5 | API-032, 060, 061, 062; EVENT-004, 005, 006, 008, 012, 020, 021, 022; LIFECYCLE-005 |

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
