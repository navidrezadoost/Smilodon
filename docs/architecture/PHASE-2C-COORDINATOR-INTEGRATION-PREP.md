# Phase 2C — Coordinator Hardening and Integration Preparation

Related records: [approved Phase 2A search/pagination contract](./PHASE-2A-SEARCH-PAGINATION-CONTRACT.md), [Phase 1 characterization tests](../../packages/core/tests/phase-1-search-pagination-characterization.spec.ts), and [coordinator contract tests](../../packages/core/tests/data-loading/request-coordinator.spec.ts).

## Status and scope

Phase 2C hardens the DOM-independent `DataRequestCoordinator` and records a future integration design. The coordinator remains internal and is not re-exported from the package entry point.

This document does not authorize connecting it to `EnhancedSelect`, adding a public completion method, changing framework adapters, changing legacy search/pagination behavior, or activating viewport virtualization. Those changes require a separate implementation directive.

## F01 — Request identity and invalidation retention

Request IDs now encode the coordinator instance, query generation, and monotonically increasing request sequence:

```text
data-{instance}-generation-{generation}-request-{sequence}-{check}
```

This replaces the per-instance set of every invalidated request ID. An ID's generation supplies the historical fact needed to reject late work; a compact per-instance check distinguishes IDs minted by this coordinator from malformed/forged strings without retaining a request registry. The check is an identity-integrity aid, not an authorization or security token.

Completion classification is:

| Condition | Result | State mutation |
| --- | --- | --- |
| Exact active request ID and matching generation, with a valid payload | `accepted` | Commit atomically after all validation succeeds. |
| A well-formed ID issued by this coordinator whose encoded generation is older than the current generation, with a matching completion generation | `stale` | None. |
| A previously settled ID in the current generation, a foreign/malformed ID, or a sequence not issued by this coordinator | `unknown-request` | None. |
| A recognized ID whose envelope generation contradicts its encoded generation, or a malformed completion | `invalid` | None. |

Thus a duplicate from a settled *older* generation is classified as `stale`; a duplicate from the current generation is `unknown-request`. This follows the contract's older-generation stale rule and keeps the exact active ID as the only identity that can commit. Request IDs remain opaque to hosts; consumers must not parse or construct them.

Disconnect invalidates an active request and advances the generation immediately, so a late completion is stale even before reconnection. Reconnection continues to establish a newer generation. Request identity is not an authorization token: only equality with the current active ID and generation can authorize a state transition.

Deterministic tests cover query supersession, disconnect/reconnect, settled duplicate classification, 512 repeated supersessions, and unchanged coordinator state after stale completion. They also verify that cursor history survives a same-query reconnect and is cleared for a new query. The test suite checks that no `invalidatedRequests` collection is retained.

## F02 — Cursor-history retention

Cursor pagination keeps exact committed continuation tokens in a `Set` for the current pagination epoch. A token is retained only after an accepted completion advances to it (`succeeded`, or `empty` with `advance: 'next'`). The set is cleared when a new query or protocol-defining configuration resets pagination. A disconnect/reconnect that preserves the accepted query snapshot and continuation position also preserves its cursor history.

The memory cost is `O(k + Σ token bytes)`, where `k` is the number of accepted cursor advances in the current pagination epoch. Phase 2D adds internal finite limits without LRU eviction: exact history is retained for every accepted cursor, and the coordinator never silently treats a resource limit as server exhaustion. Defaults and hard bounds are specified in [Phase 2D — Integration Readiness and Resource Policy](./PHASE-2D-INTEGRATION-READINESS.md). Those settings are internal coordinator configuration only; they are not public component or adapter options.

## Future `EnhancedSelect` integration map

The coordinator owns request lifecycle and accepted continuation state. `EnhancedSelect` remains the presentation/data-registry facade, `SelectEngineBridge` remains the selected/active-key authority, and the host remains the transport owner.

| Coordinator concept | Existing component state/surface | Future projection rule |
| --- | --- | --- |
| Exact query | `_state.searchQuery` and `_input.value` | Preserve exact user text for requests and legacy callbacks; keep normalized text separate. |
| Accepted item snapshot | `_state.loadedItems`, rebuilt through `_rebuildItemRegistry()` and rendered by `_renderOptions()` | Apply only a matching accepted full snapshot. Use an acknowledged commit helper rather than blindly routing through legacy `setItems()`, whose busy/scroll behavior has legacy-specific growth conditions. Do not append implicitly or clear selected keys because a row is absent. |
| Busy/requested state | `_state.isBusy`; `_setBusy()` updates rendering and listbox accessibility | Project coordinator request status into presentation. Do not allow coordinator and component to maintain independent busy truths. |
| Search presentation | `_state.isSearching` and `_renderOptions()` | Derive loading/empty/results view from the active query mode and coordinator status; leave legacy rendering unchanged. |
| Page/ordinal | `_state.currentPage` and `_state.totalPages` | Preserve legacy counter semantics. In cursor mode, the legacy numeric callback/detail remains the 1-based ordinal; the request context carries the actual cursor. |
| More-data/sentinel state | No authoritative `hasMore` field; observer/button use current config and loaded rows | In acknowledged mode, use coordinator `hasMore`, pending status, and sentinel rearm state. Do not infer exhaustion from item count. |
| Scroll preservation | `_state.preserveScrollPosition`, `_state.lastScrollPosition`, `_dropdown.scrollTop` | Capture before load-more notification; restore only after an accepted snapshot is rendered. Rejected completions must not clear or rewrite scroll state. |
| Selected/active identities | `_engine.state.selectedKeys`, `_engine.state.activeKey`, compatibility projections `_state.selectedItems` / `activeIndex` | Keep independent of the current result window and preserve across query replacement unless explicit selection policy says otherwise. |
| Configuration | `_config`, initialized from `selectConfig` and updated by `updateConfig()` | Resolve existing defaults/props/config precedence before constructing a per-request snapshot. Do not reinterpret legacy configuration. |
| Transport/cancellation | Host callback/event consumer | Host owns fetch, abort controllers, retries, and accumulation; cancellation notifications are best-effort only. |

### Event and lifecycle boundaries

The following are future dispatch points, not changes made in Phase 2C:

1. **Initial connection:** `connectedCallback()` currently registers the instance, synchronizes accessibility, renders retained data, and handles initial-selected-item loading. A future initial remote request must not fire until effective configuration and both notification channels are installed. Framework wrappers that attach listeners after DOM insertion require an explicit deferred/adapter-ready boundary; a synchronous `connectedCallback()` dispatch must not race listener installation.
2. **Search input:** `_handleSearch(query)` updates `_state.searchQuery`, renders, and defers the legacy `search` event/callback with `_setLifecycleTimeout()`. A future acknowledged path will pass the exact query to the coordinator once per distinct query, process cancellation before new-request notification, and preserve existing event/callback order. The current legacy branch remains untouched.
3. **Load-more intent:** `_loadMoreItems()` is reached by the manual button and the intersection observer. It currently sets busy, saves scroll position, increments `currentPage`, emits `loadMore`, then invokes `onLoadMore`. A future acknowledged path will ask the coordinator for one request after capturing scroll state; it must not independently increment legacy page state before a completion commits.
4. **Configuration update:** `updateConfig()` merges current core configuration and rebuilds item registration. A future path will submit only the effective protocol configuration to `updateConfig()` on the coordinator and dispatch returned cancellation/request actions after validation. Invalid protocol configuration must not partially update either owner.
5. **Disconnection:** `disconnectedCallback()` closes the popup, dispatches engine disconnect, aborts connection-scoped listeners, cancels scheduled work, and disconnects observers. A future coordinator disconnect/invalidation must occur synchronously before teardown/cancellation notification can race a late response.
6. **Completion:** no public component completion method exists in this phase. A later facade must validate/accept through the coordinator first, then atomically project its accepted snapshot/status to the item registry and presentation. A matching terminal completion clears the projected busy state; successful snapshot replacement uses acknowledged-specific scroll handling so same-size, smaller, empty, and exhausted results cannot remain busy. `setItems()` remains the existing immediate replacement API in legacy mode and must not become an implicit acknowledgement.

## Legacy and acknowledged integration fixtures

The coordinator's Node-only tests remain the deterministic state-machine fixture. When a separately authorized component-integration increment begins, add distinct fixtures rather than overloading legacy tests:

| Fixture | Setup and assertions |
| --- | --- |
| Legacy component fixture | Default configuration; capture actual `search`/`loadMore` event details and callback arguments/order; verify first load-more page, `setItems()` busy/scroll behavior (including same-or-smaller snapshots), and post-mount config updates. Assert no request metadata is present and no coordinator action is required. |
| Acknowledged coordinator fixture | Pure Node coordinator; hold request handles, complete them deterministically, and assert query/page/cursor progression, retry, empty-page sentinel rearm, cancellation, stale/unknown no-mutation, and atomic full-snapshot replacement. |
| Acknowledged component fixture | Real custom element plus explicit test seam only after integration authorization; assert one request ID is shared by event/callback channels, only accepted completion changes rows/busy/scroll, selected keys survive filtering/replacement, and stale completion cannot disturb a newer active request. |
| Adapter parity fixtures | Add one contract case per adapter for config precedence, request metadata round-trip, legacy first arguments/payloads, callback order where defined, cursor ordinal mapping, and React Native bridge serialization. Do not infer untested parity. |

## Adapter metadata-forwarding design

No adapter is changed in Phase 2C. The approved opt-in mapping for a later phase is additive:

- Existing event detail fields stay intact; acknowledged events may add an optional `request` field containing the same immutable request object for that logical intent.
- Existing callback arguments remain in their current positions and retain their legacy values. Request metadata is an optional trailing context, after any adapter-specific existing arguments (for example, React's current search query/results/count arguments). Legacy mode does not add the context.
- When event and callback channels are both enabled, both receive the same request ID exactly once; core order remains event first, callback second. The host must designate one channel as transport owner or deduplicate by request ID.
- In cursor mode, the existing numeric page argument/detail remains the 1-based ordinal. Cursor-aware hosts read `request.position.cursor`.
- React Native forwards only the JSON-safe request fields through its WebView bridge; it does not invent a second request identity or settle requests independently.
- Effective config precedence remains core defaults → global config → adapter convenience props → explicit adapter `config` → later imperative instance `updateConfig`, subject to existing adapter-specific reapplication behavior. The coordinator receives the already-resolved effective snapshot; it is not a new precedence layer.

## Exit status

The coordinator remains DOM-independent and is still not imported by `EnhancedSelect`, adapter source, or the public package entry point. Phase 2C hardening and the Phase 2D internal resource/sentinel transitions are covered by deterministic tests; component and adapter integration remain separate authorization gates. Cursor cycle detection remains exact, with its per-pagination-epoch retention cost and hard bounds recorded above.
