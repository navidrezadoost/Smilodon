# W1-P1 Public Behavioral Contract Ledger

**Increment:** W1-P1.1 — Public contract ledger and traceability skeleton
**Branch:** `codex/w1-p1-characterization-7e3adf7`
**Baseline of record:** `7e3adf77545f8e1b2b4f85949684d7d91b84456b`
**Primary source:** `packages/core/src/components/enhanced-select.ts` (9,109 lines), plus the engine, config, data-loading, and type modules it depends on.
**Status:** inventory + traceability skeleton. This is **not** a compatibility freeze and **not** approval of any behavior. Untested contracts are recorded as gaps, not as certified behavior.

## 0. Purpose and reading rules

This ledger is a source-grounded inventory of every externally observable contract of the `EnhancedSelect` custom element and the public surfaces around it. It lets W1-P1.2–P1.6 write black-box characterization tests against a known list.

1. **Documenting behavior is not approving it.** A row marked `Observed` describes current code. A defect/quirk is recorded in `W1-P1-DEVIATIONS.md` and **must not** become a normative test without a decision.
2. **Black-box is the primary authority.** Drive the component through public methods, rendered DOM (shadow root), emitted events, and real consumer interfaces. Private-state assertions support diagnosis only.
3. **Engine ownership is authoritative.** The headless engine owns selected keys and active key. Compatibility projections (`selectedIndices`, `selectedItems`, `activeIndex`) are **internal** and must never become state authorities in tests.
4. **Certification ≠ discovery.** Passing characterization tests do not constitute full W1-P1 approval.

Contract classes: `Documented` (intended surface in docs/types/tests) · `Observed` (evident in source/tests, not guaranteed) · `Internal` (implementation detail, not public) · `Unknown` (unestablished/contradictory).
New test required: `Yes` (no adequate black-box coverage) · `No` (adequate existing coverage) · `Diagnostic` (only private/perf coverage).

---

## 1. Provenance and source locations

| Item | Location |
| --- | --- |
| Component class | `packages/core/src/components/enhanced-select.ts` — `class EnhancedSelect extends HTMLElement` |
| Event map | `packages/core/src/types.ts` — `SelectEventsDetailMap` (~139), `SelectEventName` (~154), `SelectEventDetail` (40) |
| Other event details | `types.ts` — `OpenEventDetail`, `CloseEventDetail`, `SearchEventDetail`, `PageLoadedEventDetail`, `ErrorEventDetail`, `ChangeEventDetail`, `LoadMoreEventDetail`, `RemoveEventDetail`, `ClearEventDetail`, `EmptyStateChangeDetail`, `DiagnosticEventDetail` |
| Global config + defaults | `packages/core/src/config/global-config.ts` — `GlobalSelectConfig` (281), `defaultConfig` (~339) |
| Data-loading types | `packages/core/src/data-loading/public-types.ts` |
| Engine | `packages/core/src/engine/*` |
| Registration | `packages/core/src/index.ts` / component modules (browser-only) |

> **Prior-art reference, not a dependency.** A `docs/architecture/W1-P0-CONTRACT-LEDGER.md` existed as an **uncommitted, untracked** file in a different worktree, anchored to `c49d5ad`. It is **not present on this branch at `7e3adf7`**. This ledger supersedes it and is self-contained. See DEVIATION-01.

---

## 2. Public methods and properties

### 2.1 Configuration & renderer properties

| Contract ID | Behavior | Source | Existing evidence | Status | New test |
| --- | --- | --- | --- | --- | --- |
| API-001 | `classMap` get/set; changed map re-renders when connected; equal maps no-op. | 473–491 | `custom-active-class-map`, `styling-contract` | Observed | No |
| API-002 | `groupHeaderRenderer` get/set; re-renders when connected. | 497–508 | `styling-contract` | Observed | Diagnostic |
| API-003 | `optionRenderer` get/set (~6500); custom per-option DOM. | 6500–6513 | `enhanced-option-renderer` | Observed | No |
| API-004 | `loadedItems` getter (~6628). | 6628 | widely used | Observed | No |

### 2.2 Selection API

| Contract ID | Behavior | Source | Existing evidence | Status | New test |
| --- | --- | --- | --- | --- | --- |
| API-010 | `getSelectedItems(): unknown[]` (selected order). | 6620 | `select-selection`, `selected-options-*` | Observed | No |
| API-011 | `getSelectedValues(): unknown[]` (via value extractor or `.value ?? item`). | 6635, 6490 | `select-selection` | Observed | No |
| API-012 | `async setSelectedValues(values): Promise<void>` — async; local replaces matches then renders + emits `change`; server sets busy, awaits fetch, guards stale gen. | 6642–6663 | `select-selection`, `phase-1-search-pagination-characterization` | Observed | **Yes** (ordering + stale-gen + error; P1.2) |
| API-013 | `clear(): void` — clears selection (not search); emits `change`. | 6697–6705 | `select-selection` | Observed | **Yes** (event set/order; P1.2) |
| API-014 | `clearSearch(): void` — resets query, re-renders; acknowledged remote/hybrid routes via `_handleSearch('')`. | 6709–6726 | `search-ctrl-a`, `search-space-input` | Observed | **Yes** (local + acknowledged; P1.2) |

### 2.3 Items API

| Contract ID | Behavior | Source | Existing evidence | Status | New test |
| --- | --- | --- | --- | --- | --- |
| API-020 | `setItems(items): void` — replaces items, rebuilds registry, re-renders. | 6517 | `smoke`, many | Observed | No |
| API-021 | `setGroupedItems(groupedItems): void` | 6609 | grouping tests | Observed | No |

### 2.4 Popup API

| Contract ID | Behavior | Source | Existing evidence | Status | New test |
| --- | --- | --- | --- | --- | --- |
| API-030 | `open(): void` | 6733 | `interaction`, `dropdown-open-scroll` | Observed | No |
| API-031 | `close(): void` | 6740 | `interaction` | Observed | No |
| API-032 | `updateConfig(config)` — validates dataLoading/selectedOptions/scrollToSelected; may emit `dataLoadingConfigError`. | 6747+ | `public-config-integration`, `phase-2e-*` | Observed | **Yes** (invalid emission timing) |

### 2.5 Error / validation API

| Contract ID | Behavior | Source | Existing evidence | Status | New test |
| --- | --- | --- | --- | --- | --- |
| API-040 | `setError(message)` | 7281 | partial | Observed | Yes |
| API-041 | `clearError()` | 7292 | partial | Observed | Yes |
| API-042 | `setRequired(required)` — dispatches required config. | 7302 | `select-selection` | Observed | Yes |
| API-043 | `validate(): boolean` | 7315 | `select-selection` | Observed | Yes |

### 2.6 Introspection / capability API

| Contract ID | Behavior | Source | Existing evidence | Status | New test |
| --- | --- | --- | --- | --- | --- |
| API-050 | `getKnownLimitations()` | 6373 | `capabilities-tracking` | Observed | No |
| API-051 | `setLimitationPolicies(policies)` | 6384 | `capabilities-tracking` | Observed | No |
| API-052 | `getTrackingSnapshot()` | 6400 | `capabilities-tracking` | Observed | No |
| API-053 | `clearTracking(source?)` | 6408 | `capabilities-tracking` | Observed | No |
| API-054 | `getCapabilities()` — emitted list **omits `pageLoaded`** (DEVIATION-02). | 6421–6441 | `capabilities-tracking` | Observed | **Yes** (truthfulness) |
| API-055 | `getEmptyStateContext()` | 6451+ | `empty-state-slot` | Observed | No |

### 2.7 Data-loading (acknowledged) API

| Contract ID | Behavior | Source | Existing evidence | Status | New test |
| --- | --- | --- | --- | --- | --- |
| API-060 | `startDataLoading()` — deferred until connected. | 6960 | `phase-2e-acknowledged-data-loading` | Observed | Yes |
| API-061 | `getDataLoadingState()` | 6993 | `phase-2e-*`, `phase-2f-*` | Observed | No |
| API-062 | `completeDataRequest(completion)` — **sync** return; validates; projects async. | 7044+ | `phase-2e-acknowledged-data-loading` | Observed | **Yes** (return matrix) |

> `setSelectedValues` ordering is a high-risk forms boundary (DEVIATION-04). P1.2 locks it before any extraction.

---

## 3. Events

All component events dispatched via `_emit` (6279) as `new CustomEvent(name, { detail, bubbles: true, composed: true })`; acknowledged via `_dispatchAcknowledgedEvent` (7741), same options. **bubbles + composed guaranteed.**

### 3.1 Events in `SelectEventsDetailMap`

| Contract ID | Event | Declared detail | Emission site(s) | Callback | Status | New test |
| --- | --- | --- | --- | --- | --- | --- |
| EVENT-001 | `select` | `{ item, index, value, label, selected, multi? }` | 5296, 5504, 5633 | `onSelect` | Observed | Yes |
| EVENT-002 | `open` | `{}` | 4399 | `onOpen()` | Observed | Yes |
| EVENT-003 | `close` | `{}` | 4424 | `onClose()` | Observed | Yes |
| EVENT-004 | `search` | `{ query, results?, count? }` | 5043 (local), 7715 (acknowledged) | — | Observed | Yes (DEVIATION-03) |
| EVENT-005 | `pageLoaded` | `{ page, count }` | **none** | — | **Unknown** | Yes (DEVIATION-02) |
| EVENT-006 | `error` | `{ message, cause? }` | 6274 | `onError` | Observed | Yes |
| EVENT-007 | `change` | `{ selectedItems, selectedValues, selectedIndices }` | 6494 | `onChange(items, values)` | Observed | Yes |
| EVENT-008 | `loadMore` | `{ page, items }` | 6251 | — | Observed | Yes |
| EVENT-009 | `remove` | `{ item, index }` | 5704 | — | Observed | Yes |
| EVENT-010 | `clear` | `{ clearedSelection, clearedSearch }` | 7244 | — | Observed | Yes |
| EVENT-011 | `emptyStateChange` | `{ context }` | 6468 | — | Observed | Yes |
| EVENT-012 | `diagnostic` | `{ timestamp, source, name, detail? }` | 6314, 7092, 7960 | — | Observed | Yes |

### 3.2 Acknowledged events (NOT in `SelectEventsDetailMap`)

| Contract ID | Event | Detail | Source | Status | New test |
| --- | --- | --- | --- | --- | --- |
| EVENT-020 | `dataProjection` | `DataProjectionEventDetail` (`complete`\|`failed`) | 7978 | Observed | Yes |
| EVENT-021 | `dataRequestCancel` | `DataRequestCancelNotification` | 7679 | Observed | Yes |
| EVENT-022 | `dataLoadingConfigError` | `{ issues }` | 6950, 7130 | Observed | Yes |

> `pageLoaded` is declared in the map but not emitted nor in capabilities — DEVIATION-02.

---

## 4. Attributes

### 4.1 Observed attributes

| Contract ID | Attribute | Behavior | Status | New test |
| --- | --- | --- | --- | --- |
| ATTR-001 | `aria-label` | Re-sync combobox + listbox a11y. | Observed | Yes |
| ATTR-002 | `aria-description` | Re-sync combobox a11y. | Observed | Yes |
| ATTR-003 | `aria-busy` | Re-sync listbox a11y only. | Observed | Yes |

Equal values ignored (LIFECYCLE-006).

### 4.2 Host attributes written by the component

| Contract ID | Attribute | When | Status | New test |
| --- | --- | --- | --- | --- |
| ATTR-010 | `dir` (`ltr`/`rtl`) | connect from `config.direction`. | Observed | Yes |
| ATTR-011 | `data-open="true"` | while open; removed on close. | Observed | Yes |
| ATTR-012 | `data-custom-arrow="true"` | custom arrow slotted. | Observed | Yes |
| ATTR-013 | `style.display='block'` | forced on connect (DEVIATION-05). | Observed | No |

### 4.3 Element-level `data-*` (shadow DOM, observable)

| Contract ID | Attribute | Target | Status |
| --- | --- | --- | --- |
| ATTR-020 | `data-placement` | dropdown | Observed |
| ATTR-021 | `data-motion="closing"` | dropdown/badge | Observed |
| ATTR-022 | `data-multi-scroll-mode`, `data-drag-scroll` | input-container | Observed |
| ATTR-023 | `data-virtual-spacer` | spacer | Observed |

---

## 5. CSS parts and slots

### 5.1 Shadow parts

| Contract ID | Part | Element |
| --- | --- | --- |
| PART-001 | `button` | `.input-container` |
| PART-002 | `input` | `<input>` |
| PART-003 | `listbox` | `.select-dropdown` |
| PART-004 | `arrow` | arrow svg |
| PART-005 | `clear-button` | clear button |
| PART-006 | `clear-icon` | clear icon |
| PART-007 | `option` | option element |
| PART-008 | `group-header` | group header |
| PART-009 | `chip`, `chip-label`, `chip-remove`, `chip-remove-icon`, `chip-exiting` | chips |
| PART-010 | `no-results` | empty view |
| PART-011 | `loading`, `loading-content`, `loading-icon`, `loading-message`, `loading-spinner` | busy bucket |

Status: all `Observed`. P1.4 confirms reachability in rendered DOM (some are literal `part="..."` strings vs typed helpers) and pins only what parts expose.

### 5.2 Named slots

| Contract ID | Slot | Purpose |
| --- | --- | --- |
| SLOT-001 | `arrow` | Custom arrow (sets `data-custom-arrow`). |
| SLOT-002 | `empty-state` | Custom empty state. |
| SLOT-003 | `loading-content` | Custom busy-bucket content. |
| SLOT-004 | `loading-icon` | Custom busy-bucket icon. |

Existing evidence: `custom-arrow-slot`, `empty-state-slot`, `busy-bucket-customization`. P1.4 tests content replacement + `slotchange`.

---

## 6. Lifecycle contracts

| Contract ID | Behavior | Source | Status | New test |
| --- | --- | --- | --- | --- |
| LIFECYCLE-001 | Constructor builds DOM/styles/listeners/observers/ARIA; **must not** set host attributes. | constructor | Documented | No |
| LIFECYCLE-002 | `connectedCallback`: register, CONNECT dispatch, **create AbortController**, attach document `pointerdown` (signal) **and `_inputContent` scroll listener** (W1-P0.2B), sync direction, re-render if items, emit `onOpen`. | 572–636 | Observed | **Yes** |
| LIFECYCLE-003 | `disconnectedCallback`: coordinator disconnect, unregister, close, DISCONNECT, **abort controller**, **remove scroll listener**, bump `_asyncGeneration`, cancel rafs/timers, destroy virtualizer, remove children, disconnect observers, teardown mirroring. | 648–710 | Observed | **Yes** |
| LIFECYCLE-004 | Reconnection restores connection-scoped resources; disconnection releases them. | connect/disconnect | Observed | **Yes** (W1-P0.2B invariant) |
| LIFECYCLE-005 | Stale async guarded by `_asyncGeneration` + `isConnected`. | many guards | Observed | Yes (P1.5) |
| LIFECYCLE-006 | `attributeChangedCallback` early-returns on equal values. | 637–646 | Observed | Yes |

> **Invariant to preserve (accepted W1-P0.2B):** a connected component owns its connection-scoped resources; disconnection releases them deterministically. Binding on all future extraction.

---

## 7. Configuration defaults

Source: `defaultConfig` (~339). Defaults are public where serialized behavior depends on them.

| Contract ID | Key | Default |
| --- | --- | --- |
| CONFIG-001 | `selection.mode` | `'single'` |
| CONFIG-002 | `selection.allowDeselect` | `false` |
| CONFIG-003 | `selection.disabledOptionBehavior` | `{ selectable:false, hoverable:false, focusable:false }` |
| CONFIG-004 | `selection.maxSelections` | `0` (unbounded) |
| CONFIG-005 | `selection.showRemoveButton` | `true` |
| CONFIG-006 | `selection.showSelectedIndicator` | `true` |
| CONFIG-007 | `selection.closeOnSelect` | `true` |
| CONFIG-008 | `selection.toggleOnTriggerClick` | `true` |
| CONFIG-009 | `direction` | `'ltr'` |
| CONFIG-010 | `dropdownPlacement.mode` | `'bottom'` (`top`, auto) |
| CONFIG-011 | `multiSelectDisplay` | `{ mode:'wrap', maxHeight:'160px', overflowX:'hidden', overflowY:'auto', dragScroll:true, scrollToLatestChip:false, scrollToLatestChipBehavior:'smooth' }` |
| CONFIG-012 | `scrollToSelected` | `{ enabled:true, multiSelectTarget:'first', onOpen:'reveal', behavior:'smooth', block:'nearest' }` |
| CONFIG-013 | `selectedOptions` | `{ placement:'original', groupedPlacement:'within-group' }` |
| CONFIG-014 | `loadMore` | `{ enabled:false, itemsPerLoad:3, threshold:100, showLoader:true }` |
| CONFIG-015 | `busyBucket` | `{ enabled:true, showSpinner:true, showMessage:true, message:'Loading...', minDisplayTime:200, contentMode:'append' }` |
| CONFIG-016 | `serverSide` | `{ enabled:false, getValueFromItem, getLabelFromItem }` |
| CONFIG-017 | `infiniteScroll` | `{ enabled:false, pageSize:20, initialPage:1, cachePages:true, maxCachedPages:10, preloadAdjacent:true, scrollRestoration:'auto' }` |
| CONFIG-018 | `clearControl` | `{ enabled:false, clearSelection:true, clearSearch:true, hideWhenEmpty:true, ariaLabel:'Clear selection and search', icon:'×' }` |
| CONFIG-019 | `tracking` | `{ enabled:false, events:true, styling:true, limitations:true, emitDiagnostics:false, maxEntries:200 }` |
| CONFIG-020 | `limitations` | `{ policies:{}, autoMitigateRuntimeModeSwitch:true }` |
| CONFIG-021 | top-level | `{ enabled:true, searchable:false, placeholder:'Select an option...', virtualize:true, estimatedItemHeight:48 }` |

> Data-loading config validated by `validateDataLoadingConfig`. `LEGACY_DATA_LOADING_CONFIG = { protocol:'legacy', searchMode:'local', paginationMode:'page', firstPage:1 }`. Characterize in P1.5.

---

## 8. Known deviations

Full detail in `W1-P1-DEVIATIONS.md`. Summary:

| ID | Finding (short) | Class | Target |
| --- | --- | --- | --- |
| DEVIATION-01 | Prior W1-P0 ledger uncommitted/absent on this branch; this ledger supersedes it. | Internal (process) | P1.1 |
| DEVIATION-02 | `pageLoaded` declared but never emitted; omitted from capabilities. | Unknown | P1.5 |
| DEVIATION-03 | `search` payload shape (local vs acknowledged) not pinned. | Unknown | P1.5 |
| DEVIATION-04 | `setSelectedValues` async ordering not asserted. | Unknown | P1.2 |
| DEVIATION-05 | `connectedCallback` forces `style.display='block'`. | Internal (quirk) | P1.4 |
| DEVIATION-06 | Dev-only projection asserts can throw. | Internal | P1.2 |

---

## 9. Traceability matrix

Machine-readable seed: `W1-P1-TRACEABILITY.json` (74 contracts). Human summary by increment:

| Target increment | Contract IDs (count) |
| --- | --- |
| P1.1 | API-050..053 (existing coverage verified) |
| P1.2 — Selection/identity/events ordering | API-001,004,010,011,012,013,014,020,042,043,054; EVENT-001,007,010; CONFIG-001..010 |
| P1.3 — Keyboard/focus/popup/ARIA | API-030,031,040,041; EVENT-002,003; ATTR-001,002,003,010,011,020; LIFECYCLE-006 |
| P1.4 — Rendering/renderers/virtualization/lifecycle | API-002,003,021,055; EVENT-009,011; ATTR-012,013,021,022,023; PART-001..011; SLOT-001..004; LIFECYCLE-001,002,003,004 |
| P1.5 — Async/adapters | API-032,060,061,062; EVENT-004,005,006,008,012,020,021,022; LIFECYCLE-005; CONFIG-015..021 |
| P1.6 — SSR/security/traceability closeout | Final matrix, failure register, gap register, W1-P2 proposals |

---

## 10. Coverage summary and gaps

| Area | Existing coverage | Notable gaps |
| --- | --- | --- |
| Selection/identity | `select-selection`, `selected-options-*`, `*-parity`, `*-authority` | `setSelectedValues` ordering; duplicate identity; reorder/filter preservation; disabled matrix; selected-first ordering — **black-box** (current is parity/projection-internal) |
| Keyboard/focus/popup/ARIA | `interaction`, `keyboard-page-boundary`, `select-accessibility`, `enhanced-select-accessibility-integration`, `web-accessibility-effects` | Real-browser combobox checks after filter/reorder/disable/reconnect; active-descendant; focus restoration |
| Rendering/renderers/virtualization | `enhanced-option-renderer`, `virtualization-contract`, `selected-options-render-plan`, `custom-arrow-slot`, `empty-state-slot`, `busy-bucket-customization` | Renderer mount order; option replacement; mounted-option bound; legacy-incremental vs guarded-viewport distinction; CSS part reachability |
| Lifecycle | `lifecycle`, `memory-lifecycle`, phase-4 lifecycle (browser) | **Black-box** resource cleanup; reconnect; stale async (Phase 4 is jsdom/diagnostic + pinned container) |
| Async/adapters | `phase-2e-*`, `phase-2f-*`, `phase-1-*`, contracts | Request generations/cancellation/acknowledged completion black-box; real framework adapter fixtures (P1.5) |
| SSR/security | `csp.spec`, `security.ts` | Import-time browser deps; sanitizer boundary; SSR (P1.6, documented only) |

Existing tests are largely **jsdom + private/projection-level**. W1-P1 adds **black-box** characterization (public API + rendered DOM + events) and real-browser coverage where behavior is DOM-dependent. Passing existing suites is necessary but not sufficient for any gate.
