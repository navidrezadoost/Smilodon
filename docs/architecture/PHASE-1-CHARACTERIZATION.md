# Phase 1 — Architecture Characterization and Risk Inventory

Status: **Closed — Phase 1 characterization and risk assessment approved on 2026-10-24.** Approval accepts the investigation evidence and conclusions; it does not approve a runtime change or a public API. Phase 2A contract design is authorized separately; implementation is not authorized.

This record characterizes the v1.10.0 source baseline at `b0216e6ed7356cfb2e8236767cd3694061449c79`. The Phase 0 documentation is preserved separately in commit `3ac4c95` (`docs(core): record Phase 0 modernization baseline`). Findings below separate source-confirmed behavior from defects, compatibility questions, host responsibilities, and unverified risks.

The Phase 1 characterization suite is `packages/core/tests/phase-1-search-pagination-characterization.spec.ts`; environment-risk cases are in `packages/core/tests/phase-1-environment-risk-characterization.spec.ts`. Node.js 20.20.2 and npm 10.8.2 were found in the local NVM installation and used for focused execution. The characterization suite and environment-risk cases pass, and targeted Node/Chromium probes reproduce the SSR and CSP boundaries described below. Source-only findings remain explicitly distinguished from runtime evidence. The final engineering review accepted this evidence as satisfying the Phase 1 investigation exit criteria.

## Search and pagination behavior matrix

| Scenario | Observed 1.10.0 behavior | Surface / evidence | Assessment |
| --- | --- | --- | --- |
| Static items, single selection | Core selection uses stable item keys. Search filters the currently loaded flat items; clearing the query restores the collection. A selected item remains selected while filtered out. | `EnhancedSelect._handleSearch`, `_filterItemsByQuery`, `setItems`; `engine/select-machine.ts`; characterization tests | Implemented; characterize before changing selection/filter contracts. |
| Static items, multiple selection | Same local filter path; multiple selected keys survive while their rows are absent from the rendered result set. | Core selection policy and `enhanced-select-selection-parity.spec.ts`; characterization test | Implemented; scoped core evidence, not cross-adapter parity certification. |
| Empty/whitespace search | An empty query restores all items. For non-empty text with surrounding whitespace, event results use a trimmed query while rendering uses the original untrimmed query. For example, `" Apple "` can report Apple in `search.detail.results` while mounting no option. | `EnhancedSelect._filterItemsByQuery` trims; `_renderOptions` does not. A focused characterization test records the discrepancy. | **P1 confirmed implementation inconsistency**, runtime-reproduced in the focused jsdom suite. A normalization correction requires a separate approved implementation contract. |
| Search event/callback | Core emits a bubbling, composed `search` event with `{ query, results, count }` asynchronously on a lifecycle-managed zero-delay timer and calls `callbacks.onSearch(query)`. It does not fetch remote results. The notification de-duplication compares query and result count, not result identities. | `EnhancedSelect._handleSearch`; `types.ts`; `GlobalSelectConfig.callbacks` | Local search is implemented; remote search transport and stale-response policy are host-owned. Same-query/same-count result replacement deserves a focused follow-up if consumers depend on repeated notification. |
| Selected values not on current page | The specific `serverSide.fetchSelectedItems` hook may resolve records for `setSelectedValues`; it is not a general remote-search or page-fetch interface. A generation counter and connection check guard that selected-record lookup. | `EnhancedSelect.setSelectedValues`, `_loadSelectedItemsByValues` | Implemented for selected-record resolution only. |
| Search while a page request is pending | Search updates the local query but does not cancel or invalidate a host request, reset the page number, or attach a query generation to `loadMore`. A later host `setItems()` replaces the current dataset and is filtered by whatever query is current at that time. | `_handleSearch`, `_loadMoreItems`, `setItems`; characterization test | Host owns request identity, cancellation, stale-response rejection, and query/page reset. No built-in remote concurrency contract exists. |
| Infinite-scroll signal | If enabled, the component observes a sentinel and calls the same `_loadMoreItems` transition when intersecting and not busy. The IntersectionObserver threshold is hard-coded to `0.1`. | `_initializeObservers`, `_addLoadMoreTrigger` | Signal only; no transport or automatic append. |
| Initial page and emitted page | `currentPage` initializes as `initialPage || 1`; `_loadMoreItems()` increments before emitting/calling. With default `initialPage: 1`, the first signal is page `2`. A custom initial page `4` signals page `5`. | Constructor and `_loadMoreItems`; characterization test | **P1 compatibility question**, high source confidence. It may mean “last loaded page” or an off-by-one; preserve until consumer expectations are established. |
| Page size and cache fields | Core config declares `pageSize`, `cachePages`, `maxCachedPages`, `preloadAdjacent`, and `scrollRestoration`; the integrated `EnhancedSelect` load-more path does not read them. Adapters forward `pageSize`, but core emits only the page and an empty `items` array. | `GlobalSelectConfig`; adapter config forwarding; `_loadMoreItems` | **P1 declared-surface mismatch**, high source confidence. No integrated fetch-size, cache, preload, or page-restoration guarantee. Do not remove fields in 1.x without a compatibility decision. |
| Manual load-more settings | `loadMore.itemsPerLoad` changes the button label (for example, “Load 7 more”); it does not fetch or append seven items. `LoadMoreConfig.threshold` and `showLoader` have no active read in the component. The component's busy bucket determines the loading UI. | `_addLoadMoreTrigger`, `_loadMoreItems`, config source | Configuration names overstate integrated behavior; decide field by field whether to implement, deprecate, or define them. |
| Repeated request while busy | `_loadMoreItems()` returns while `isBusy` is true, suppressing repeated sentinel/button requests until the host updates data or a synchronous callback throws. | `_loadMoreItems`; characterization test | Implemented guard; no deduplication key exists beyond this single busy flag. |
| Host result and append | `setItems(items)` replaces the full loaded collection. The host must accumulate prior pages and pass the desired combined list if append behavior is wanted. | `EnhancedSelect.setItems`; characterization test | Host-owned accumulation; no implicit append. |
| Busy state after a page | The component sets busy before signaling. A larger `setItems()` response clears busy and restores the saved scroll position. While preserving scroll position, a same-size or smaller `setItems()` result does not clear busy/preservation; `setItems([])` can leave the list busy indefinitely. `setGroupedItems()` renders replacement groups but does not clear this busy state. | `_loadMoreItems`, `setItems`, `setGroupedItems`; characterization test for empty result | **P1 likely terminal-state defect/contract gap**, high source confidence. There is no explicit end-of-data acknowledgement. Define a compatible success/empty/error/exhaustion acknowledgement before runtime correction. |
| Load-more failure | A synchronously thrown core callback is caught, emits `error`, and clears busy. Callback return values are not awaited. React's adapter type permits `Promise<void>` for `onLoadMore`, but its event listener also discards the return value; an asynchronous rejection is not routed through the core error path. | Core callback type/`_loadMoreItems`; React `SelectProps` and `handleLoadMore`; other wrapper event handlers | **P1 async failure-handling gap**, high source confidence. Keep transport/error ownership explicit; define behavior before changing callbacks. |
| Runtime configuration | Core `updateConfig()` deep-merges nested fields and updates input/search/observer behavior, but changing `initialPage` after construction does not reset the separate `currentPage` state. Adapters reapply convenience-derived config when relevant props change; supplied `config` is applied after convenience props in the reviewed paths. | `EnhancedSelect.updateConfig`; React/Vue/Svelte/Solid/RN/Vanilla source; characterization test | Source-traced precedence is recorded in [Public API Compatibility](./PUBLIC-API-COMPATIBILITY.md). Runtime page-reset semantics remain undefined. |

### Adapter-specific search and pagination surface

The values below are source-declared convenience defaults, not proof of equivalent effective behavior. All adapters ultimately rely on the core host-request signal for integrated load-more behavior.

| Surface | `pageSize` convenience default | `virtualized` default / meaning | Search callback/event surface | Load-more surface |
| --- | ---: | --- | --- | --- |
| Core | `20` | `virtualize: true`, legacy chunking | `onSearch(query)` plus core event `{ query, results, count }` | callback `onLoadMore(page)` plus event `{ page, items: [] }` |
| React | `20` | `false`, legacy chunking | callback receives `(query, results?, count?)` | callback receives page; declared return permits `Promise<void>`, but return is ignored |
| Vue | `50` | `true`, legacy chunking | component event emits query string | component event emits page number |
| Svelte | `50` | `true`, legacy chunking | component event detail `{ query }` | component event detail `{ page }` |
| Solid | `50` | `true`, legacy chunking | callback receives query string | callback receives page number |
| Vanilla | no helper default | `false`, legacy chunking | helper callback receives query string | helper callback receives page number |
| React Native native/web | `50` | `true`, legacy chunking | callback receives query string | callback receives page number |

`virtualized` is not viewport-windowed rendering on any public adapter. The Vanilla helper's grouped input remains `{ group, items }`, while the core and other framework adapters use `{ label, options }`; this is a separate intentional adapter contract.

The dedicated core characterization test does not establish wrapper-specific event parity. Existing contract tests provide selected React, Vue, Svelte, and Vanilla wrapper evidence; no comparable Solid or React Native contract suite was found in the repository inventory.

## Current authority and lifecycle map

```text
Host application
  owns remote transport, query/page identity, stale-response policy,
  accumulation, end-of-data, retry, and remote cancellation
          │ search / loadMore events and callbacks; setItems replacement
          ▼
Framework adapter
  owns controlled/uncontrolled framework value and renderer roots/listeners
          │ props/config/event synchronization
          ▼
EnhancedSelect (public browser facade and main data/render owner)
  owns loadedItems/groupedItems, item registry/render plan, query, currentPage,
  busy/scroll-preservation state, DOM, local filtering, observers and virtualizer
          │ semantic events/effects
          ▼
SelectEngineBridge
  owns selectedKeys, activeKey, selection policy, popup, focus, disabled,
  lifecycle and registered-key state
          │
          ▼
Web effect/accessibility runners
  apply focus, popup, ARIA and browser-facing effects
```

| Concept | Current owner | Compatibility projection / finding |
| --- | --- | --- |
| Selected identity | `SelectEngineBridge.state.selectedKeys` | `EnhancedSelect._state.selectedIndices` and `selectedItems` are legacy projections; `_selectedRecordsByKey` retains last known selected records when missing from the current registry. |
| Active identity | Engine `activeKey` | Component `activeIndex` is a projection through the current registry/render set. |
| Item identity and visible result set | `EnhancedSelect`'s `ItemRegistry`, loaded item list, and render plan | Rendering synchronizes registered keys back to the engine. Adapters may independently retain a controlled value and reconcile it through imperative calls. |
| Search query | `EnhancedSelect._state.searchQuery` | Engine `SelectState.query` exists but no query transition/update path was found in the component. Query is not currently engine authority. |
| Loading status | `EnhancedSelect._state.isBusy` | Engine `dataStatus` exists but is not synchronized; source comment explicitly says busy remains component-owned. |
| Page and dataset | Component owns `currentPage`, loaded arrays, and replacement rendering | Host owns network page semantics, append, cursor, exhaustion, and errors. `_pageCache` and `totalPages` are declared in the component but no active use was found in the reviewed path. |
| Browser effects | `DefaultSelectEffectRunner` and accessibility effect functions | The engine returns semantic effects; DOM/focus/ARIA execution remains Web-specific. |

### Async resource ownership

| Resource | Owner and cleanup observed | Gap / follow-up |
| --- | --- | --- |
| Document-level pointer listener | `EnhancedSelect` creates a connection `AbortController`; disconnect aborts it. | No issue identified in this path. |
| Timers and animation frames | Component lifecycle timer/RAF sets are cleared on disconnect; render-cycle tokens guard later work. | Characterize each newly added async flow against disconnect before implementation. |
| Resize/intersection observers and guarded virtualizer | Component disconnects observers, cancels scheduled guarded updates, removes the guarded scroll listener, and destroys the private virtualizer. | This is not permission to enable the guarded path publicly. |
| Custom-option style/theme observers | Component disconnects both mutation observers and removes mirrored style nodes. Async style-copy completion checks its current container/token. | Keep this lifecycle evidence separate from framework-renderer root cleanup. |
| Missing selected-item lookup | Component uses `_asyncGeneration`, `isConnected`, and `finally` to reject stale/disconnected results and clear busy. | This protection is specific to selected-item resolution; it does not cover search or load-more. |
| Search and page requests | Host application owns them; the component has no transport controller or request generation for them. | Define host/API cancellation and stale-result policy in the data-loading workstream. |
| Internal `LocalSource` / `RemoteSource` | `packages/core/src/utils/data-source.ts` has its own cache and one `AbortController`; `destroy()` aborts and clears maps. | Not exported from the core barrel and not wired into `EnhancedSelect`. `RemoteSource` does not check `response.ok`; one controller means a new refresh aborts the prior request. Treat as internal utility, not public data-source support. |
| Worker manager / telemetry singleton | Exported `getWorkerManager()` and `getTelemetry()` create singleton resources. Worker manager clears pending timers/rejects requests on explicit `destroy()`; telemetry stops RAF/observer on `stop()`/`destroy()`. | No component owner or automatic lifecycle binding found. Document explicit disposal requirements or establish an owner if these utilities are adopted by runtime code. |
| Framework renderer roots/listeners | React/Vue/Svelte/Solid wrappers mount framework renderers and generally remove listeners/dispose roots in their own lifecycle hooks. | Real-browser wrapper parity and React Native native/Web lifecycle coverage are incomplete. |

## Prioritized findings and next-step classification

Severity refers to user/integration impact if the finding is confirmed in the intended contract. Confidence distinguishes source certainty from unexecuted runtime verification.

Unless stated otherwise, findings apply to the v1.10.0 source baseline named at the top of this document; they do not assert behavior for later versions.

| ID / priority | Finding and affected surface | Classification / confidence | Recommended next action |
| --- | --- | --- | --- |
| P1-01 | Search event result set and rendered set diverge for whitespace-padded queries; core and adapters consuming the results/rendering. | Runtime-reproduced by the focused jsdom characterization test; high confidence for the v1.10.0 path. | Decide normalization contract and retain event, rendered-row, clear, and keyboard assertions when a compatible correction is separately authorized. |
| P1-02 | An empty/smaller page or grouped replacement can leave `isBusy` and scroll-preservation active; load-more consumers cannot explicitly report exhaustion. | Empty `setItems([])` behavior runtime-reproduced in jsdom; grouped replacement and same/smaller non-empty cases remain source-traced. | Define a backward-compatible acknowledgement for success, empty result, exhaustion, failure, and cancellation; then implement only after review. |
| P1-03 | `pageSize`, cache/preload/restoration fields and several `loadMore` fields are declared/forwarded but not consumed by integrated core loading. | Confirmed source reference inventory; high confidence. | Produce a field-by-field compatibility decision: implement, deprecate/document, or reserve removal for 2.0. |
| P1-04 | Async `onLoadMore` return/rejection is not observed; React explicitly allows a promise, while component busy is still host-cleared. | Confirmed source path; high confidence. | Decide whether adapters own promise/error handling or core gains a compatible async acknowledgement; test resolve/reject/unmount. |
| P1-05 | Default page signal is `2`, because the current page starts at `1` then increments before emission. | Confirmed source behavior; high confidence, intended page convention unknown. | Search examples/consumer use and maintainers' expected page convention before changing. |
| P2-01 | Search/page requests are not tied to query generations; stale host results and page reset are host responsibilities. | Confirmed ownership boundary; high confidence. | Define query/page identity and cancellation/append policy in a follow-on data-source/API decision. |
| P2-02 | `selectConfig.mergeWithComponentConfig()` clones via JSON and drops function values, although the normal global update path preserves assigned functions and the component reads the global config directly. | Source-confirmed limited clone behavior; high confidence; public exposure/consumer impact unverified. | Keep the characterization test; find actual external callers before treating as a release defect. Avoid claiming all `configureSelect` callbacks are broken. |
| P1-06 | Browser-only core module evaluation extends `HTMLElement` and references `customElements` unguarded; framework package entry points also expose runtime core values/imports. | Plain Node v20.20.2 imports reproduced `ReferenceError: HTMLElement is not defined` for core, React, Vue, Svelte, and Vanilla. Solid failed first because Node resolved `solid-js/web` to `dist/server.js`, which does not export the imported client helper `use`. React Native's web entry imported; its native-condition failure is explained by Node parsing React Native's Flow `import typeof` source, not by a Metro/device runtime. | Define supported SSR/import boundaries per package and test with each framework's actual SSR/bundler conditions. Do not assume `use client` or compiler recognition alone solves module evaluation. |
| P1-07 | Strict CSP can block `new Function` in WorkerManager serialization/fallback and React Native Web's generated core bundle loader; blob workers may also be blocked by `worker-src`. | Runtime-reproduced against the built core bundle in isolated Chromium 143.0.7499.4: `script-src 'self'` blocked `new Function`; disallowing `blob:` blocked Worker creation, while allowing `blob:` still left worker transforms blocked by `unsafe-eval`. | Document exact CSP requirements. Prefer static/serializable operations if strict CSP is a support target; no CSP workaround was implemented. |
| P1-08 | HTML-string templates/custom render results and markup icon config reach `innerHTML`; `validateTemplate()` warns/sanitizes only when explicitly called and is not wired into those paths. Default plain labels use `textContent`. | Runtime DOM characterization confirms the default label path remains text and legacy `NativeSelectElement.optionTemplate` inserts markup, retaining an `onerror` attribute. Script execution was not tested; impact depends on untrusted markup and policy. | Treat renderer/template/icon strings as trusted input unless a separately reviewed sanitizer contract is adopted; retain hostile-string coverage. |
| P2-03 | No form-associated custom element contract (`formAssociated`, `attachInternals`, `setFormValue`, or name-to-form submission path) was found. Host shadow-root `aria-labelledby`/`aria-describedby` references are also unsupported and already documented. | Runtime characterization confirmed a selected value is absent from native `FormData` and host `aria-labelledby` is not copied to the internal input. | Clarify form submission integration (host hidden input/adapter state) and retain the cross-shadow IDREF limitation pending interoperable design and browser tests. |
| P2-04 | “React/Vue/Svelte/Vanilla E2E” Playwright projects all launch the Vanilla playground and current scenario specs are tagged `@all`; named projects repeat those Vanilla scenarios rather than mount each wrapper. | Confirmed by config/spec inspection. Contract specs import and mount the actual React, Vue, and Svelte wrappers with their respective Testing Library `render()` helpers; Vanilla tests call its helper directly. `npm run test:contracts` passed 12 selected assertions with 43 React assertions skipped. No Solid or React Native contract suite was found. | Separate real-wrapper browser fixtures from shared core/Vanilla scenarios; add Solid, RN Web, and native-device tests according to supported claims. Do not interpret project labels as wrapper parity. |
| P2-05 | Public `virtualized` flags control legacy chunk rendering, while viewport-windowing remains behind the private guarded seam. | Confirmed and already documented/certified for scoped test cases; high confidence. | Keep public mode unchanged and production viewport activation **NO-GO**. Variable-height and manual AT coverage remain separate. |
| P2-06 | Exported WorkerManager/PerformanceTelemetry singleton helpers have explicit disposal methods but no component-level lifecycle owner or automatic disposal path. | Source-confirmed ownership risk; high confidence; no leak reproduction. | Document explicit `destroy()`/`stop()` responsibility or establish a clear owner if runtime code starts using them. |

### Reproduction and evidence routes

| ID | Reproduction or source evidence | Result/status in this review |
| --- | --- | --- |
| P1-01 | In the new core test, enter `" Apple "`; compare `search.detail.results/count` with `.options-container [data-index]`. | Passed in jsdom: the event reports one Apple result while the rendered option set is empty. This reproduces the source inconsistency in the tested v1.10.0 build. |
| P1-02 | Start load-more, then call `setItems([])` or a same/smaller result; inspect `isBusy`, `preserveScrollPosition`, and the loading part. Also check `setGroupedItems()` after load-more. | Passed for the empty `setItems([])` case: busy and scroll-preservation remain set and the loading part remains present. Same/smaller non-empty and grouped replacement remain source-traced, not separately executed. |
| P1-03 | Set `pageSize`, cache/preload/restoration, threshold, and loader fields; trace reads in `EnhancedSelect` and inspect the load-more signal. | Source inventory complete: among the pagination fields, active reads include `enabled`, `initialPage`, and `itemsPerLoad`; the advanced fields listed in P1-03 have no component read sites. |
| P1-04 | Supply an async/rejecting `onLoadMore` through React or a core callback and inspect returned-promise handling, `error` events, and busy state. | Not executed. Source listeners discard callback returns; core catches only synchronous throws. |
| P1-05 | Set `initialPage: 1`, trigger load-more, and inspect the event/callback page; set `initialPage: 4` and repeat. | Passed in jsdom: after changing `initialPage` post-mount, first event is page 2; a configured initial page 4 emits page 5. |
| P2-01 | Hold a host page response, change the search query, then deliver the old response through `setItems()` and inspect current query and data. | Passed in jsdom: the later host dataset replaces the old collection while the newer query remains; there is no component request token. This characterizes the host-owned stale-response boundary. |
| P2-02 | `configureSelect({ callbacks: { onSearch } })`; compare `selectConfig.getConfig().callbacks.onSearch` with `selectConfig.mergeWithComponentConfig({}).callbacks.onSearch`. | Passed in jsdom: normal global assignment retains the callback, while the JSON-clone helper drops it. This does not imply all global callbacks are broken. |
| P1-06 | In plain Node v20.20.2 without DOM globals, dynamically import the built entrypoints for core and each maintained adapter. Also inspect Node's resolved `solid-js/web` condition and the React Native condition separately. | Runtime import outcomes: core, React, Vue, Svelte, and Vanilla fail with `ReferenceError: HTMLElement is not defined`; Solid fails because Node resolves `solid-js/web` to `dist/server.js` without the imported `use`; React Native web entry imports; `--conditions=react-native` reaches Flow syntax in `node_modules/react-native/index.js`, which Node cannot parse. |
| P1-07 | Serve the built core module from an isolated localhost fixture with `script-src 'self'`; run WorkerManager transform once with `worker-src 'self'` and once with `worker-src blob:`. | Runtime-reproduced in Chromium 143.0.7499.4 / Playwright 1.59.1. `new Function` is blocked by `unsafe-eval`; without `blob:` Worker startup is blocked and the manager reports a worker crash; with `blob:` the worker starts but the transform still fails on `unsafe-eval`. No external origin is contacted. |
| P1-08 | In an isolated jsdom fixture, render a hostile-looking string as a plain EnhancedSelect label and through legacy `NativeSelectElement.optionTemplate`. | Passed: the default label remains text; the legacy template path inserts an `img` and retains its `onerror` attribute. jsdom does not execute the handler, so this confirms the unsanitized DOM sink, not script execution. |
| P2-03 | Add `<enhanced-select name="choice">` to a native form, select a value, inspect `new FormData(form)`; set host `aria-labelledby` and inspect the internal input. | Passed in jsdom: selected value is present in component state but absent from `FormData`; the internal input has no forwarded `aria-labelledby`. |
| P2-04 | Run each named framework Playwright project and inspect the loaded URL/DOM; inspect `tests/e2e/scenarios/*.spec.ts` and contract-test directories. | Inspected the nested Playwright config and current `@all` specs: projects use the Vanilla demo. Inspected contract specs: React/Vue/Svelte Testing Library mounts and Vanilla helper mounts are real wrapper tests; 12 selected contract cases pass, while 43 React cases are skipped. No Solid or RN contract suite was found. |
| P2-05 | Compare adapter `virtualized` mapping with `EnhancedSelect` render modes; inspect the private guarded test seam and Phase 4 certification record. | Source/docs inspection completed. Public flags map to chunk rendering; guarded viewport mode remains test-only. |
| P2-06 | Create each exported singleton with its getter, start work, remove the consuming UI without calling `destroy()`/`stop()`, then inspect worker/RAF/observer ownership. | Not executed. Component does not call these getters; explicit cleanup methods exist. This is an ownership risk, not an observed leak. |

The SSR import failures, CSP restrictions, form boundary, and unsanitized legacy template DOM insertion now have targeted runtime evidence. Their product severity still depends on the published SSR, CSP, renderer trust, and form-integration contracts; this investigation does not change those contracts or implement fixes. The React Native native-condition import failure is a plain-Node/toolchain mismatch, not evidence from Metro or a device runtime.

## Test inventory and execution status

`phase-1-search-pagination-characterization.spec.ts` adds 12 core cases:

1. Case-insensitive local filtering and query clear.
2. Single-selection persistence while filtered out.
3. Multi-selection persistence while filtering.
4. Search-event/render mismatch with padded whitespace.
5. Host result arriving after query change, with no component request-generation guard.
6. Initial-page increment, host-owned data, page-size field, and `itemsPerLoad` button text.
7. `initialPage` update after mount does not reset current page.
8. Repeated load-more signal suppression while busy.
9. Synchronous callback exception event and busy reset.
10. `setItems()` replacement and larger-result busy clear.
11. Empty result leaves current busy/preservation state set.
12. Normal global callback assignment versus JSON clone-helper function loss.

These cases are intentionally characterization assertions where current behavior is questionable; comments identify mismatches rather than declaring them desired API. They must be reviewed before converting them into normative contract tests.

`phase-1-environment-risk-characterization.spec.ts` adds two deterministic DOM cases:

1. Compare a plain `EnhancedSelect` label with the legacy `NativeSelectElement.optionTemplate` HTML-string path.
2. Verify selected values are not submitted through native `FormData` and host `aria-labelledby` does not cross into the internal input.

The SSR imports use the built package entrypoints in separate plain Node processes. The CSP fixture served only localhost modules and exercised the built `WorkerManager`; it used the local Playwright Chromium cache, not the repository-pinned CI revision. These probes are investigative evidence, not release certification.

### Verification record

| Gate / probe | Command or environment | Result |
| --- | --- | --- |
| Locked dependency installation | Node `20.20.2`, npm `10.8.2`; `npm ci --no-audit --fetch-timeout=30000 --fetch-retries=0 --progress=false --loglevel=info` | Passed; 959 packages added in 5 seconds. A first plain `npm ci` attempt remained silent for over four minutes and was interrupted; the cause of that stall was not established. The successful retry skipped npm's audit request but used the committed lockfile. |
| Search/pagination plus environment-risk characterization | `./node_modules/.bin/vitest run packages/core/tests/phase-1-search-pagination-characterization.spec.ts packages/core/tests/phase-1-environment-risk-characterization.spec.ts --config packages/core/vitest.config.ts` | Passed: 14/14 tests across two files. |
| TypeScript | `./node_modules/.bin/tsc --noEmit` | Passed after correcting one test-only `ErrorEvent`/`CustomEvent` cast. |
| Lint | `npm run lint` | Passed: 0 errors, 6 warnings in existing docs-site/benchmark files. |
| Adapter contract tests | `npm run test:contracts` | Passed: 12 passed, 43 skipped. React emitted existing `act(...)` warnings; no assertion failed. |
| Plain Node SSR entrypoint probe | Node `20.20.2`, package exports from the current v1.10.0 workspace build | Core/React/Vue/Svelte/Vanilla fail at `HTMLElement`; Solid fails at the Node server condition for `solid-js/web`; React Native web entry imports; Node's React Native condition is not a Metro/device validation. Exact outcomes are recorded under P1-06. |
| CSP runtime probe | Playwright `1.59.1`, cached Chromium `143.0.7499.4`, strict localhost-only policies | Confirmed `unsafe-eval` and `worker-src blob:` dependencies in the exercised WorkerManager path. The cached browser differs from the pinned CI baseline. |
| Markdown links and whitespace | `git diff --check` plus `git diff --no-index --check /dev/null <added-file>` for each untracked file; inspected the document heading hierarchy and local Markdown link. | Passed: no whitespace diagnostics; the only relative Markdown link resolves to `PUBLIC-API-COMPATIBILITY.md`; heading levels are H1 → H2 → H3. |

Test isolation was reviewed with execution: the search/pagination suite resets global configuration before and after each case and removes its mounted element; the environment suite removes mounted elements/forms; custom-element registration is guarded and also supplied by the shared Vitest setup. The padded-query case waits for the actual `search` event rather than an arbitrary delay. In the exercised paths, item changes render synchronously; component disconnect cleanup owns any outstanding lifecycle tasks.

The focused command in a prepared Node/npm-enabled checkout is:

```sh
./node_modules/.bin/vitest run \
  packages/core/tests/phase-1-search-pagination-characterization.spec.ts \
  packages/core/tests/phase-1-environment-risk-characterization.spec.ts \
  --config packages/core/vitest.config.ts
```

The SSR and CSP findings are scoped to the exact entrypoints, built bundle, browser, and policies above. They do not establish minimum-browser compatibility, every framework's SSR behavior, or WCAG conformance. Test-harness failures were classified and corrected: the environment suite initially tried to register `NativeSelectElement` a second time under a noncanonical tag (the shared setup already registers it as `smilodon-select`); the first TypeScript run needed an explicit test-only `ErrorEvent`/`CustomEvent` cast; and the first CSP probe used an inline bootstrap/string-based Playwright wait, then an invalid `worker-src blob` token. The strict policy correctly blocked those fixtures. The final probe uses an external same-origin module, a DOM readiness marker, and the valid `blob:` source. These were fixture/tooling errors, not application results. The initial unbounded `npm ci` stall is separately recorded with unknown cause.

## Search and pagination contract proposal

The final Phase 1 review accepted the nine proposed directions below as input to Phase 2A architecture design, with the management dispositions recorded in `docs/architecture/PHASE-2A-SEARCH-PAGINATION-CONTRACT.md`. This table is not itself an approved API contract or implementation authorization. Its compatibility target is to preserve v1.10.0 observable payloads and defaults in 1.11.x while considering explicit opt-in behavior. Breaking renames/removals or different default semantics should be evaluated for 2.0.0.

| Decision | Proposed disposition | Compatibility note |
| --- | --- | --- |
| Search mode | Keep local search over currently loaded data as the default. Add an explicit remote/hybrid mode only through a separately reviewed API: remote mode sends a query request to the host; hybrid mode may locally filter the host-supplied result page. Do not imply built-in fetch transport. | Preserve current `search` event/callback payloads and local behavior by default. Remote request identity must be additive. |
| Pagination ownership | Keep network requests, retries, accumulation, and end-of-data host-managed in 1.x. Consider an integrated data-source adapter separately; the internal `RemoteSource` is not current public `EnhancedSelect` transport. | Preserve `setItems()` replacement semantics; no implicit append. |
| Page size | Split remote fetch limit from local reveal count. Propose a new explicit `fetchLimit` on a request contract and a distinct `revealCount` only if local incremental reveal needs it. Existing `pageSize` and `itemsPerLoad` require field-specific compatibility review because current code declares them but does not enforce the apparent batch semantics. | Do not silently make existing no-op cache/preload/threshold fields change runtime behavior in a maintenance release. `itemsPerLoad` currently affects button text, not the amount requested or revealed. |
| Page numbering | Treat `initialPage` as the last page already loaded; the first request increments it. Preserve default first signal page 2 and custom `initialPage + 1` in 1.x unless consumer evidence disproves that convention. | Keep existing numeric callback/event payload unchanged. |
| Cursor support | Add optional cursor support through a new request object containing `requestId`, `page`, optional `cursor`, query identity, and fetch limit. | Do not replace or reshape the legacy numeric `loadMore` event in 1.x. Avoid putting non-serializable `AbortSignal` objects in cross-adapter event payloads. |
| Completion acknowledgement | Add an explicit host acknowledgement keyed by `requestId` with statuses `success`, `empty`, `exhausted`, `failed`, or `cancelled`; it must settle busy/scroll state even when no rows are added. | Keep current larger-`setItems()` busy clear as legacy implicit success while defining how old callers recover from empty pages. Failure details should use existing error conventions. |
| Query replacement | Assign each remote query/request a generation or request ID. Host remains responsible for aborting work and rejecting stale responses; the response/acknowledgement must carry the same identity so the component can reject obsolete completion. | Static local search remains synchronous with current semantics. Do not reset page state or accept stale network results implicitly without a documented policy. |
| Configuration precedence | Preserve core defaults < global configuration < adapter convenience props < explicit adapter `config` overrides. Treat declarative props/config as authoritative for fields they own; imperative `updateConfig()` changes remain instance-local until the next corresponding declarative update. | Document the precedence per adapter; do not claim identical prop defaults where the source differs. |
| Selection persistence | Keep selected identity independent of the currently loaded/filtered page, using stable item keys and cached selected records. Removing/clearing remains explicit; a page replacement must not silently clear a selected value merely because it is absent. | Controlled adapter values remain the host's canonical value. Duplicate-value/key behavior must follow the existing duplicate-key policy and receive parity tests. |

The versioned Phase 2A design record now carries these dispositions forward. Before any implementation, maintainers must approve the proposed semantics and scope, then add core and real-wrapper contract tests for local/remote query changes, pending and stale results, empty/exhausted/error/cancelled completion, cursor requests, selected identity across page replacement, and declarative-versus-imperative config precedence.

## Phase 1 exit assessment and next phase

The source inventory, ownership map, prioritized issue list, 14 passing characterization cases, targeted SSR/CSP/form/HTML evidence, and contract proposal are assembled. The final engineering review approved Phase 1 closure based on this evidence. The limitations and unverified paths above remain open engineering risks; closure does not imply they are fixed or certified.

| Phase 1 exit condition | Evidence | Status |
| --- | --- | --- |
| Focused characterization suite executes or failures are classified | 14/14 focused cases pass; the one initial TypeScript failure was a test-only event cast and was corrected. The first default `npm ci` stall is recorded separately; locked installation passed with audit disabled. | Recorded |
| TypeScript, relevant lint, and whitespace checks | `tsc --noEmit` passes; lint has 0 errors and 6 warnings in unchanged files; tracked and added-file whitespace checks pass. | Recorded |
| SSR and CSP mechanisms have targeted runtime evidence | Plain Node package-entry imports and isolated Chromium WorkerManager policy probes produced the outcomes recorded above. | Recorded with environment limits |
| Search/pagination questions have proposed dispositions | The 9-row compatibility proposal below covers search mode, ownership, limits, numbering, cursors, completion, query replacement, precedence, and selection persistence. | Accepted as Phase 2A design input; not an approved public API |
| Findings are ranked by severity, compatibility impact, and confidence | Prioritized findings table includes affected surface, classification/confidence, and recommended action. | Recorded |
| No unauthorized runtime/API/release/activation changes | Only Phase 1 documentation and characterization tests changed; production runtime, package versions, release state, and public virtualization default are untouched. | Recorded |

Disposition after the closure review:

1. Phase 1 is closed. The unresolved defects, compatibility questions, and environment risks remain tracked in this evidence record.
2. Phase 2A — Search/Pagination Contract Design and Semantic Ownership Specification — is authorized as design/specification work only. Its deliverables and explicit boundaries are in [Phase 2A contract design](./PHASE-2A-SEARCH-PAGINATION-CONTRACT.md).
3. Phase 2 implementation, Phase 3 implementation, package/version changes, and public API activation are not authorized by Phase 1 closure.
4. SSR, CSP/security, form/accessibility, adapter parity, and singleton-disposal investigations remain separately scoped. Guarded viewport-windowing remains private and production activation remains **NO-GO**.

No runtime/API changes, version changes, release actions, Phase 2/3 implementation, or production virtualization activation were included in Phase 1 characterization.
