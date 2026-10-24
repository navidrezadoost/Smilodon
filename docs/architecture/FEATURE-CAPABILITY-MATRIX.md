# Feature Capability Matrix — Smilodon 1.10.0 Baseline

Snapshot: `main` tree at `b0216e6ed7356cfb2e8236767cd3694061449c79` (2026-10-24). This is a source-and-evidence inventory for planning 1.11.x work, not a claim that every behavior is bug-free or fully certified.

## Status vocabulary

- **Implemented** — source exposes the capability.
- **Verified (scoped)** — named tests exercise specified behavior; this does not imply exhaustive coverage.
- **Certified (scoped)** — the recorded hosted/release gate passed for the scenarios and environments named in the certification record.
- **Experimental** — available only behind an internal/private test seam.
- **Host-owned** — the component emits a request or callback; the application owns transport or policy.
- **Unsupported / not certified** — no supported public guarantee is established.
- **Investigation** — a discrepancy or risk needs targeted reproduction before it is called a defect.

“Implemented”, “verified”, and “certified” are separate columns because source presence and passing automation are not interchangeable.

## Capability inventory

| Capability | Implementation/API evidence | Verification evidence and boundary | Baseline status |
| --- | --- | --- | --- |
| Single selection, deselection, disabled options, limits | `packages/core/src/engine/selection-policy.ts`; `GlobalSelectConfig.selection` | Core selection policy and component-parity tests; adapter behavior is not equally covered | Implemented; partially verified across adapters |
| Multi-select, chips, clear and remove | Core selection policy and `EnhancedSelect` chip/clear paths | Core parity and browser scenarios cover selected cases; full removal, keyboard, limit, and rapid-interaction matrix is not exhaustive | Implemented; partial coverage |
| Stable identity and selection persistence | `engine/item-adapter.ts`, `engine/item-registry.ts`, `EnhancedSelect` selected-record projection | Unit/integration tests cover stable keys, replacement, filtering, and selection projection; mutation and cross-adapter identity cases remain | Implemented; scoped verification |
| Local search | `EnhancedSelect` filters loaded items through `_filterItemsByQuery`, emits `search` with query/results/count, and renders against the query | `tests/e2e/scenarios/search.spec.ts` has active interaction coverage, but several exact-filter assertions are skipped and contain stale comments claiming filtering is absent. Replace those with affirmative result-set assertions in the data-loading workstream | Implemented; verification gap/inconsistent test commentary |
| Remote search transport | Core `search` event/callback signals; an internal `utils/data-source.ts` contains source/cache classes but is not exported from the core package entry point or wired into `EnhancedSelect` | No integrated core request/cancellation contract; host code owns fetching and stale-response handling | Host-owned; no supported built-in transport contract |
| Load-more / infinite-scroll signal | `loadMore` event and `onLoadMore(page)` callback; component increments current page and enters busy state | No integrated page fetch, error/retry/end-of-data policy, or request cancellation in `EnhancedSelect`; host must update the dataset | Host-owned; contract needs characterization |
| Fetch size / maximum fetched items | Adapter props and `InfiniteScrollConfig.pageSize`; `LoadMoreConfig.itemsPerLoad` | `EnhancedSelect` does not use `pageSize` to fetch or limit items, and has no public maximum-fetch/count limit. `itemsPerLoad` currently supplies button text; the separate unexported data-source utility has independent page-size logic but is not connected to the component | No integrated fetch limit; host-owned data bounds |
| Pagination configuration | `InfiniteScrollConfig` declares `pageSize`, `initialPage`, `cachePages`, `maxCachedPages`, `preloadAdjacent`, and `scrollRestoration`; `LoadMoreConfig` declares presentation/threshold fields | `initialPage` initializes `currentPage`; `_loadMoreItems()` increments it before emitting/calling `loadMore`, so the default first request is page 2. `itemsPerLoad` is used in button text. The integrated `EnhancedSelect` runtime has no read sites for `pageSize`, cache/preload/restoration fields, `threshold`, or `showLoader` beyond declarations/defaults. The separate, unexported `utils/data-source.ts` utility does use its own page-size setting, but is not wired to `EnhancedSelect`. Adapter convenience defaults also differ; see the API baseline. These are compatibility/investigation items, not authorization to remove configuration | Declared surface; semantics partly unverified |
| Selected-item lookup for values absent from current results | `serverSide.fetchSelectedItems`; async `EnhancedSelect.setSelectedValues()` | Focused identity/async tests and Phase 4 record cover selected-value persistence paths; this does not provide general search/pagination cancellation | Implemented; scoped verification |
| Grouped options | Core `GroupedItem` uses `{ label, options }`; Vanilla helper separately accepts `{ group, items }` and normalizes it | Core grouped/fallback browser scenarios exist; wrapper-specific behavior is not equally covered | Implemented; adapter-specific contract must be preserved |
| Custom option and group-header rendering | Core renderer contracts and adapter bridges | Browser evidence covers selected core renderer/layout cases; renderer lifecycle parity across all adapters is incomplete | Implemented; partial parity evidence |
| Public large-list rendering | `virtualized`/core `virtualize` selects incremental chunk rendering for large flat lists; all results may ultimately mount | Tests and docs distinguish this from viewport windowing | Public chunk rendering; no bounded-DOM guarantee |
| Viewport windowing | `Virtualizer`, Fenwick tree, geometry/measurement support, guarded component seam | Phase 4 hosted Chromium/Firefox/WebKit matrix passed for the tested private activation scenarios; this does not certify public activation or variable-height support | Experimental; production activation **NO-GO** |
| Dynamic-height options | Measurement infrastructure exists in guarded path | Known limitation says dynamic heights are not certified | Unsupported as a production guarantee |
| Keyboard, focus, ARIA effects | Core engine accessibility contracts and Web platform effects | Phase 4 automated browser matrix passed for scoped scenarios; external shadow-root IDREF forwarding remains unsupported | Implemented and scoped automated certification; manual AT pending |
| Manual screen-reader behavior / WCAG conformance | No source implementation alone can establish this | Windows/NVDA and macOS/VoiceOver assessments remain unassigned in the certification record | Not certified; no WCAG claim |
| Styling tokens, parts, class maps | Core config, shadow styles, adapter props | Tests cover selected styling and state hooks; exhaustive visual override compatibility is absent | Implemented; partial verification |
| Diagnostics and limitation policy | `getCapabilities`, `getKnownLimitations`, tracking snapshot/clear, limitation policy, `diagnostic` | Unit/contract coverage exists, but adapter surfaces differ | Implemented; parity partial |
| React, Vue, Svelte, Vanilla wrappers | Maintained packages adapt the shared core | CI has real contract/E2E jobs, but framework E2E project names have historically shared the Vanilla playground; wrapper parity needs wrapper-mounted tests | Maintained; evidence is not uniform |
| Solid and React Native parity | Maintained Solid wrapper; RN native WebView and RN Web paths | Equivalent comprehensive contracts/device/browser evidence is not established; RN native and web handles differ | Implemented surfaces; parity not certified |
| SSR/hydration | Browser-first custom-element runtime with adapter-specific client mounting | No universal interactive SSR guarantee established | Client-oriented; framework-specific constraints |
| Angular | No maintained `@smilodon/angular` package | Direct custom-element use is distinct from a supported adapter | Unsupported adapter |
| Runtime single/multi switching | Limitation policy and compatibility handling exist | Known limitation recommends reset/recreate where needed; no exhaustive transition parity evidence | Limited; follow documented limitation |

## Search and pagination evidence to carry into Phase 3

The current contracts distinguish three things that must not be conflated:

1. Local filtering over the items currently loaded in the component.
2. Host-owned remote search and load-more requests signaled by callbacks/events.
3. Selected-record lookup through the specific `serverSide.fetchSelectedItems` hook.

Only the first is a core filtering path. The second is not a built-in remote query service. The internal `data-source.ts` utility is not a public integrated `EnhancedSelect` data-source API. The default `initialPage` is 1, but the load-more path increments before emitting, making its first default request page 2; characterize whether callers rely on this before proposing compatible changes. The adapter `pageSize` defaults are not uniform, and the current core load-more handler does not read that field. Phase 3 must inventory the existing `pageSize`, `initialPage`, `loadMore`, and `infiniteScroll` declarations and characterize their actual use before proposing compatible changes.

The search E2E file contains skipped assertions with outdated explanatory comments. Treat this as a test-maintenance discrepancy; the implementation path exists, but the skipped tests do not currently prove exact result membership, query reset behavior, or stale-response handling.

## Evidence sources

- [Phase 4 feature-contract audit](./PHASE-4-FEATURE-CONTRACT-AUDIT.md)
- [Phase 4 certification record](./PHASE-4-CERTIFICATION.md)
- [Known limitations](../KNOWN-LIMITATIONS.md)
- [Adapter capability matrix](../ADAPTER-CAPABILITY-MATRIX.md)
- Core source: `packages/core/src/components/enhanced-select.ts`, `packages/core/src/config/global-config.ts`, `packages/core/src/engine/`, `packages/core/src/utils/data-source.ts`
- Search E2E: `tests/e2e/scenarios/search.spec.ts`
