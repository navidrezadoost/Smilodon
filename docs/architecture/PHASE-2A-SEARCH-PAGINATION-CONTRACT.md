# Phase 2A — Search and Pagination Contract Design

Status: **Approved — Phase 2A contract design closed on 2026-10-24.** The request lifecycle, candidate API names, and 1.11.x compatibility semantics below are the accepted implementation target. Phase 2B authorizes only a DOM-independent internal coordinator and its deterministic tests. Public component and adapter integration, package/version changes, and production viewport virtualization remain unauthorized.

Compatibility baseline: Smilodon `1.10.0`, source commit `b0216e6ed7356cfb2e8236767cd3694061449c79`. The source observations below are bounded to that baseline and the characterization evidence in [Phase 1](./PHASE-1-CHARACTERIZATION.md) and the [public API compatibility record](./PUBLIC-API-COMPATIBILITY.md).

This approved design turns the accepted Phase 1 directions into a field-by-field compatibility contract, a transport-neutral request lifecycle, additive TypeScript shapes, an ownership model, and an acceptance-test matrix. Material changes to its names or semantics require another contract review. Approval does not mean the functionality has been implemented, tested, or certified.

Naming boundary: “Phase 2A” and “Phase 2B” here are search/pagination workstream increments, not status updates to the stable-identity milestones in [Phase 2 — Stable Identity and Selection Model](./PHASE-2-STABLE-IDENTITY.md). Phase 2B authorizes an internal coordinator only; it does not advance that implementation sequence or authorize public component, adapter, or Phase 2/3 runtime integration.

## Goals and non-goals

The contract should make local search, host-backed search, page/cursor requests, completion, stale-response handling, and selected identity understandable and testable without taking transport ownership away from applications.

It must preserve existing 1.x defaults and event/callback conventions in the default legacy mode. Any new request metadata or completion path must be opt-in and additive. Breaking semantic changes belong in a separately approved 2.0.0 plan.

This phase does not implement search normalization, fetch transport, caching, append behavior, automatic retry, or a public virtualization mode. It also does not make the existing internal `RemoteSource` an integrated `EnhancedSelect` data source.

## Compatibility principles

1. Local search over the currently loaded data remains the default. Search callbacks are request notifications, not built-in network transport.
2. The host continues to own network transport, cancellation controllers, retry/backoff, response transformation, accumulation, and server-specific deduplication.
3. `setItems(items)` continues to mean replacement of the complete loaded collection. The component does not append pages implicitly.
4. Existing `search` and `loadMore` event names and their existing fields remain present. Existing callback signatures remain valid for callers that consume only their current arguments.
5. The default legacy numeric page sequence remains unchanged: `initialPage` is the last page considered loaded, and the first load-more signal is `initialPage + 1` (normally page `2`). Whether existing consumers intended page `1` is a 1.x compatibility question, not grounds for silently changing the sequence.
6. Selection identity is independent of the current query and loaded page. Filtering, page replacement, and stale responses must not clear a selected key merely because its record is temporarily absent.
7. Adapter-specific defaults, event conventions, and configuration precedence are preserved. A core contract does not imply that every adapter has equal coverage.
8. The public `virtualized` option continues to mean legacy chunk rendering. Guarded viewport-windowing stays private and production activation remains **NO-GO**.
9. In the v1.10.0 core path, `search`/`loadMore` events are dispatched before their corresponding configured callbacks. Legacy event fields, callback arguments, timing, and order remain compatibility assertions; adapter-level conventions are tested separately.

## Versioned configuration compatibility decisions

The first column records current 1.10.0 behavior. The 1.11.x column is the approved compatibility disposition and implementation target; it does not claim that behavior has shipped. “Preserve inert” means the declaration remains accepted for compatibility, but docs must not promise behavior the integrated runtime does not perform. No field is removed by this contract.

| Declared field / surface | 1.10.0 observed behavior | Approved 1.11.x disposition | 2.0.0 consideration |
| --- | --- | --- | --- |
| `loadMore.enabled` | Enables the manual button; it also participates in whether a load-more trigger is rendered. Default `false`. | Preserve the existing trigger behavior and default. An explicit completion result controls whether another request is available in the opt-in protocol. | Retain unless a replacement interaction contract is approved. |
| `loadMore.itemsPerLoad` | Changes the manual button label (for example, “Load 7 more”); it does not control a fetch size or reveal count. Default `3`. | Preserve label semantics. Do not alias it to `fetchLimit` or to a new local `revealCount`. | Deprecate or rename only with consumer evidence and a migration path. |
| `loadMore.threshold` | Declared with a pixel-distance description; no active read was found in the integrated `EnhancedSelect` path. Default `100`. The observer currently uses its own hard-coded intersection threshold. | Preserve as inert/reserved and document the absence of an effect. Do not reinterpret it as an `IntersectionObserver` ratio or root margin. | Either define one precise pixel-distance meaning or remove after a breaking-change review. |
| `loadMore.showLoader` | Declared with default `true`, but no active read was found. Loading content is controlled by `busyBucket`. | Preserve as inert/reserved. Keep `busyBucket` as the current presentation control; do not add a second loading-state owner. | Consider removing or defining it as an alias only if a single loading presentation authority is established. |
| `infiniteScroll.enabled` | Enables the sentinel observer and load-more request path. Default `false`. | Preserve existing behavior and default. A sentinel may request only when the opt-in coordinator says more data is available and no request is pending. | Retain as the trigger toggle unless replaced by an explicitly versioned API. |
| `infiniteScroll.pageSize` and adapter `pageSize` props | Core default is `20`; React default is `20`; Vue, Svelte, Solid, and React Native native/web defaults are `50`; Vanilla has no helper default. Adapters forward the value, but integrated core load-more does not read it or include it in the legacy event. | Preserve each existing default and legacy behavior. In the proposed acknowledged protocol only, resolve `fetchLimit` from explicit `dataLoading.fetchLimit` first, then the effective `infiniteScroll.pageSize` value. This makes the old value meaningful only after explicit opt-in; it does not change legacy mode. | Consolidate or remove duplicate names only with a migration plan. |
| `infiniteScroll.initialPage` | Core default is `1`; state initializes with `initialPage || 1` and increments before the first request. Post-mount `updateConfig()` does not reset the current page. | In legacy mode preserve the observed sequence. In acknowledged local pagination over an already-loaded dataset, treat it as the last committed page seed, so the next eligible page is `initialPage + 1`. A new acknowledged remote/hybrid query instead starts from `dataLoading.firstPage` (default `1`); it must not use the legacy increment and skip the first server page. A later config update never rewrites an in-flight request. | A zero-based/first-page reinterpretation of the legacy field would be breaking and needs explicit migration. |
| `infiniteScroll.cachePages` | Defaults to `true`; no active read was found in integrated loading. It does not establish a component page cache. | Preserve as inert/reserved. Do not claim page caching. | Remove or implement only after a separately reviewed cache owner and eviction contract. |
| `infiniteScroll.maxCachedPages` | Defaults to `10`; no active read was found in integrated loading. | Preserve as inert/reserved. | Remove or define only with an approved cache implementation and observable eviction rules. |
| `infiniteScroll.preloadAdjacent` | Defaults to `true`; no active read was found in integrated loading. | Preserve as inert/reserved. Do not prefetch implicitly. | Remove or define only after request concurrency and cancellation semantics are approved. |
| `infiniteScroll.scrollRestoration` | Defaults to `auto`; no active read was found for this setting. The current component separately restores the saved `scrollTop` after a larger `setItems()` result during a pending load-more. | Preserve as inert/reserved. Keep the existing growth-related restoration behavior in legacy mode; do not claim this field selects a strategy. Acknowledged mode restores the prior position after accepted page completion unless a later explicit UX contract says otherwise. | Define exact restoration targets and modes or remove after review. |
| `busyBucket.enabled`, `showSpinner`, `message`, `minDisplayTime` | `enabled`, spinner, and message are read when rendering the current busy bucket; `minDisplayTime` has no active read in the load-more lifecycle identified here. | Preserve presentation behavior. The request coordinator owns request status; the component owns rendering it. Keep `minDisplayTime` as currently declared until separately characterized; do not use it as an acknowledgement timeout. | Decide whether to implement minimum-display timing or deprecate it; never let visual delay hold request completion open. |
| `callbacks.onSearch(query)` / adapter search props | Notifies on query/result-count changes; local filtering remains core behavior. No transport is invoked. Adapter argument/event conventions differ. | Preserve existing first argument and event payload. In the acknowledged mode, add optional request context as an additional argument/optional event-detail field. | Any replacement event or argument shape requires a migration plan. |
| `callbacks.onLoadMore(page)` / adapter load-more props | Receives the incremented numeric page. Core also emits `loadMore` with `{ page, items: [] }`. Callback returns are not awaited; only synchronous throws enter the core error path. | Preserve page and legacy event fields. Add optional request context without requiring existing handlers to consume it. Explicit completion is authoritative only when opted in; do not infer completion from a returned promise. | Promise-returning lifecycle semantics require explicit adapter-wide review. |
| Exported `RemoteConfig.pageSize` and `NativeSelectOptions.remote` | Belong to the legacy `NativeSelectElement` type surface. The legacy element does not implement the EnhancedSelect request lifecycle. A separate internal `RemoteSource` has a structurally similar config but is not wired into `EnhancedSelect`. | Keep these surfaces distinct. Do not map them automatically to `infiniteScroll.pageSize` or new `fetchLimit`. Audit separately before claiming integrated remote pagination. | Consolidate only after legacy package usage and compatibility are assessed. |
| `NativeSelectOptions.loadMode` / `infinite` | Declared on the legacy options type; no active use was found in the reviewed `NativeSelectElement` path. | Preserve declarations without claiming they enable the `EnhancedSelect` host-request lifecycle. | Remove or define only after a legacy API audit. |
| `serverSide.fetchSelectedItems` | Resolves missing selected records for value synchronization; it is not general remote search or page loading. | Preserve as a separate selected-record lookup capability. It does not participate in request IDs, query generations, or pagination acknowledgements. | Could be unified only through a separately reviewed data-source contract. |
| `pageLoaded` event detail | A type is declared, but no live emitter was found in the integrated component. | Do not repurpose it as an acknowledgement event in 1.x. Use the proposed request-completion method or a separately named additive event. | Decide whether to implement or remove only after consumer search. |

### `fetchLimit`, `itemsPerLoad`, and local reveal are distinct

The proposed `fetchLimit` is the number of records the host should request for one remote search/page operation. In acknowledged mode, explicit `dataLoading.fetchLimit` wins; if omitted, the effective existing `infiniteScroll.pageSize` value is used, retaining current adapter defaults. A request records the resolved limit at dispatch time.

`itemsPerLoad` remains a button-label value only. It is not sent as a remote limit. A possible `revealCount` for locally revealing already-loaded records is outside this contract and requires separate design; the existing public `virtualized` option is not a reveal-count API.

`RemoteConfig.pageSize` remains part of the separate legacy/internal source surface. It is not a fallback for the integrated EnhancedSelect request limit.

For a fresh acknowledged remote/hybrid query in page mode, `dataLoading.firstPage` is the explicit first server page and defaults to `1`. Cursor mode starts with no cursor and ordinal `1`; `firstPage` is page-mode only. The setting is separate from the legacy `infiniteScroll.initialPage`, whose existing meaning is preserved. For acknowledged local pagination against a preloaded dataset in page mode, `infiniteScroll.initialPage` seeds the last page already committed by the host; the first eligible load-more position remains seed + 1.

## Approved search semantics

### Modes

| Mode | Approved behavior | Network owner |
| --- | --- | --- |
| `local` (default) | Search the currently loaded flat items case-insensitively. Empty or whitespace-only input matches the full loaded set. Filtering does not clear selected identity. | No network request. |
| `remote` (opt-in) | Each distinct query generation notifies the host. While its request is pending, prior-generation result rows are not presented as matches for the new query; the result view is empty/loading while selected identity is retained. Accepted response items replace the current snapshot and are not locally filtered. | Host performs transport and decides server query semantics. |
| `hybrid` (opt-in) | Query notifies the host. While pending, prior-generation rows are not presented as matches for the new query. After a matching response is accepted, local filtering is applied to that response snapshot. An explicit ordinary `setItems()` replacement is also locally filtered but does not acknowledge a pending request. | Host fetches; component filters the accepted response snapshot. |

The approved correction for P1-01 is to use one canonical local-search interpretation for both rendered rows and `search.detail.results/count`: trim surrounding whitespace and compare labels case-insensitively. To preserve callback compatibility, the legacy `query` field/callback argument remains the exact user-entered string. A future request context may carry both `query` and `normalizedQuery`; the host can choose which server semantics to apply. This normalization is an accepted semantic target, not yet implemented.

No built-in debounce is approved. Existing immediate query behavior and notification timing remain the default; any opt-in debounce requires its own explicit value, event timing rule, and cancellation tests.

### Initial, empty, and changing remote queries

- On connection, `remote` and `hybrid` modes create a query generation from the component's current query, including the empty string, and issue its first request at `dataLoading.firstPage` (default `1`) in page mode, or at the initial cursor position (no cursor, ordinal `1`) in cursor mode. Initial config, callback props, and adapter event listeners must be installed before that notification is dispatched, and the initial request is emitted exactly once for the connection. If an adapter or pre-connect setup has supplied a non-empty current query, that exact query is requested; this does not add a new `initialQuery` public prop. The default current query remains empty. This prevents page 2 from being mistaken for the first remote page.
- In `remote` mode, an empty query is still sent to the host as `query: ''`; it is not interpreted as “show the old local dataset.” The host defines what an empty server query means. Local mode keeps its current behavior: an empty query restores all locally loaded items.
- When a query changes during a request, invalidate the old request, notify cancellation, increment the generation, reset that generation's page/cursor state, and request the new exact query. Only a completion matching the new active request can replace the current query result snapshot.
- The legacy `search` event keeps its `query`, `results`, and `count` fields. In remote/hybrid mode, those result fields describe the current result view; for a new generation they are empty until a matching completion is accepted, rather than a local filter of the previous query's dataset. In hybrid mode the accepted response is filtered before becoming the current result view; remote mode exposes the accepted response as provided by the host.
- A matching `exhausted` completion with `items: []` is the successful zero-result terminal case. A zero-record nonterminal page uses `empty` and must declare whether to advance or retry the same position. The old snapshot is never partially overwritten by a stale or malformed completion.
- Switching `local` ↔ `remote`/`hybrid`, or `remote` ↔ `hybrid`, invalidates pending work and starts a new generation. Remote mode never locally filters the loaded snapshot. Hybrid local filtering applies to the data currently supplied for the hybrid query; a matching acknowledged response replaces that snapshot atomically.
- A host call to `setItems()` outside `completeDataRequest()` remains an intentional immediate replacement. It does not acknowledge, settle, or advance a pending acknowledged request, and it does not change that request's ID, generation, query, or position. In remote mode the replacement is not locally filtered. In hybrid mode ordinary local filtering applies to the current replacement, but the host must use `completeDataRequest()` for a response that is meant to be accepted as the result of an identified request. A later matching completion may replace the interim `setItems()` snapshot.
- In legacy mode, `setItems()` retains its current replacement and busy-clear behavior, including the existing same-or-smaller/empty-result limitation. No acknowledged-mode rule changes the legacy contract.

## Authority and ownership model

This table distinguishes ownership at the 1.10.0 baseline from the approved target. The data coordinator is a transport-neutral component-scoped responsibility; Phase 2B implements it internally, while making it a public component service remains a later decision.

| Concern | Current owner at the 1.10.0 baseline | Approved target authority after the authorized internal implementation and any later public integration |
| --- | --- | --- |
| HTTP/GraphQL/custom transport, credentials, retry/backoff | Host application | Remains the host application's responsibility. |
| `AbortController`, request cancellation, response transformation | Host application | Host owns actual transport cancellation and transformation. It maps the coordinator's request ID to its controller. |
| Query input as stored state | `EnhancedSelect` | Semantic/search boundary owns canonical query and monotonically increasing generation; the engine may become its state authority only through a separate tested extraction. |
| Request ID, pending request, page/cursor progression, `hasMore`, completion acceptance, stale rejection | Split between host conventions and component busy/page fields; no complete coordinator | Component-scoped data coordinator owns transport-neutral lifecycle and current request identity. It never performs fetch. |
| Loaded data and append | `EnhancedSelect` stores a replaceable snapshot; host accumulates pages | Host accumulates/deduplicates according to application policy and submits the complete snapshot. Coordinator applies it atomically only for a current request. |
| Selected and active identity | `SelectEngineBridge` (`selectedKeys`, `activeKey`) | Semantic engine remains authoritative and independent of the visible page. A missing row cannot itself delete selected identity. |
| DOM, busy presentation, sentinel/button, scroll restoration | `EnhancedSelect` | Web Component remains the presentation/facade owner, rendering coordinator status and accepted data. |
| Framework controlled values, callbacks, renderer roots, prop/config precedence | Individual adapters | Adapters translate the shared contract into React callbacks, Vue emits, Svelte events, Solid callbacks, Vanilla helpers, or React Native bridge messages; they do not own network policy. |
| Global defaults and instance overrides | Core config manager plus adapters | Preserve current precedence: core defaults → global config → adapter convenience props → explicit adapter `config` → later imperative instance `updateConfig`; a subsequent declarative adapter update can reapply its props. Exact behavior remains adapter-specific and must be tested. |

The request coordinator and selection engine have separate authorities: the coordinator governs whether a data response is current; the semantic engine governs selected/active keys. Neither coordinator nor adapter may silently clear selection because a record is not in the current result snapshot.

## Approved additive TypeScript contract

The following is the approved design shape, not a source declaration or public API in Phase 2A. Phase 2B may implement these types in an internal module; implementations must preserve the observable legacy fields described below.

```ts
export type DataRequestId = string;
export type QueryGeneration = number;
/** JSON-safe scalar continuation token; absent means the initial cursor position. */
export type PageCursor = string | number;

export interface DataLoadingConfig {
  /** `legacy` is the 1.x default; `acknowledged` enables request IDs/completions. */
  protocol?: 'legacy' | 'acknowledged';
  /** Local is the default. Remote/hybrid require the acknowledged protocol. */
  searchMode?: 'local' | 'remote' | 'hybrid';
  /** Page is the default. Cursor requires the acknowledged protocol. */
  paginationMode?: 'page' | 'cursor';
  /** First page for page-mode remote/hybrid queries; acknowledged mode only. Defaults to 1. */
  firstPage?: number;
  /** Host fetch count; acknowledged mode falls back to effective infiniteScroll.pageSize. */
  fetchLimit?: number;
}

export interface DataRequestBase {
  requestId: DataRequestId;
  queryGeneration: QueryGeneration;
  /** Exact user input, preserved for host compatibility. */
  query: string;
  /** Trimmed form used for local search; host semantics remain host-owned. */
  normalizedQuery: string;
  fetchLimit: number;
  /** Position is snapshotted for both initial search and load-more requests. */
  position: PagePosition;
}

export interface SearchDataRequest extends DataRequestBase {
  kind: 'search';
  mode: 'remote' | 'hybrid';
}

export type PagePosition =
  | { mode: 'page'; page: number }
  | {
      mode: 'cursor';
      cursor?: PageCursor;
      /** 1-based logical position; advances only with accepted continuation. */
      ordinal: number;
    };

export interface LoadMoreDataRequest extends DataRequestBase {
  kind: 'loadMore';
}

export type DataRequest = SearchDataRequest | LoadMoreDataRequest;

export interface DataRequestError {
  message: string;
  code?: string;
  retryable?: boolean;
}

export interface DataRequestCancelNotification {
  requestId: DataRequestId;
  queryGeneration: QueryGeneration;
  reason: 'query-changed' | 'config-changed' | 'disconnected';
}

export type DataRequestCompletion =
  | {
      requestId: DataRequestId;
      queryGeneration: QueryGeneration;
      status: 'succeeded';
      /** Complete accumulated replacement snapshot, not only the new page. */
      items: readonly unknown[];
      /** This response contained records and another position is available. */
      hasMore: true;
      nextCursor?: PageCursor;
    }
  | {
      requestId: DataRequestId;
      queryGeneration: QueryGeneration;
      /** Zero new records, but the host says another request position is valid. */
      status: 'empty';
      hasMore: true;
      /** `next` commits/advances this position; `retry` leaves it eligible unchanged. */
      advance: 'next' | 'retry';
      nextCursor?: PageCursor;
    }
  | {
      requestId: DataRequestId;
      queryGeneration: QueryGeneration;
      /** Terminal for this query; includes the final accumulated snapshot. */
      status: 'exhausted';
      /** Complete accumulated replacement snapshot, including [] for a zero-result query. */
      items: readonly unknown[];
      hasMore: false;
    }
  | {
      requestId: DataRequestId;
      queryGeneration: QueryGeneration;
      status: 'failed';
      error: DataRequestError;
    }
  | {
      requestId: DataRequestId;
      queryGeneration: QueryGeneration;
      status: 'cancelled';
      reason?: 'host-cancelled';
    };

export type DataRequestCompletionResult = 'accepted' | 'stale' | 'unknown-request' | 'invalid';

// Approved future facade method name; public component integration is not authorized here.
completeDataRequest(
  completion: DataRequestCompletion,
): DataRequestCompletionResult;
```

Approved `DataLoadingConfig` defaults are `protocol: 'legacy'`, `searchMode: 'local'`, and `paginationMode: 'page'`. `firstPage` defaults to `1` and applies only to page-mode remote/hybrid queries; cursor mode begins with no token and ordinal `1`. `fetchLimit` is unset unless supplied; acknowledged mode resolves it from the effective existing `infiniteScroll.pageSize` when omitted. `fetchLimit` and `firstPage` must be positive safe integers. Remote/hybrid search and cursor pagination require `protocol: 'acknowledged'`; invalid combinations should produce a development diagnostic and must not silently fall back to a different request model. The accepted configuration must be snapshotted per request.

Approved additive adapter mapping: the existing `onSearch(query)` and `onLoadMore(page)` remain callable with their present first argument, with an optional second request context when the acknowledged protocol is enabled. Existing core `search` and `loadMore` events keep their existing fields and may add an optional `request` field. For one logical intent, the coordinator creates exactly one request and one `requestId`; if both event and callback channels are active, both receive that same immutable context exactly once. Core dispatch order remains event first, then callback, matching the current core order. Registering both channels does not create a second coordinator request. Applications must designate one channel as the transport owner or deduplicate transport by `requestId`; adapters preserve and test their existing mapping/order rather than claiming a universal cross-adapter order. In acknowledged cursor mode, the legacy numeric `page` callback/detail is the request position's 1-based `ordinal`; cursor-aware code reads `request.position.cursor`. This mapping is opt-in and does not change legacy page numbering.

For cursor mode, `PagePosition.cursor` is the server continuation token and `ordinal` is the 1-based logical position number, incremented only when an accepted completion advances to a new token. A retry at the same token retains the ordinal but always receives a new `requestId`. The existing numeric page argument/detail remains a legacy ordinal for compatibility; cursor-aware hosts must read the additive request context. Cursor values are restricted to finite numbers or strings in this proposal so React Native bridge behavior is deterministic; missing represents the initial position and cannot be a continuation token. More complex cursors must be encoded by the host.

No `AbortSignal` crosses the event or adapter boundary. The host stores controllers by `requestId`. The approved additive cancellation notification (`dataRequestCancel` event / adapter-equivalent callback with `DataRequestCancelNotification`) asks the host to abort; cancellation remains best-effort, and stale completion rejection is still required if transport cannot be stopped. Coordinator-driven query/config/disconnect cancellation invalidates the request before notification; a host-originated accepted `cancelled` completion is only valid while its request is still active and uses `reason: 'host-cancelled'`.

`completeDataRequest()` is deliberately atomic: it validates request identity and the full status-specific payload before applying any snapshot or terminal status. For `succeeded` and `exhausted`, `items` always means the complete accumulated replacement set, preserving `setItems()` semantics. It does not append, deduplicate, or infer `hasMore` from item count. Unknown or stale completions do not mutate data, selection, page position, or busy state for a newer request.

### Position, completion, and validation invariants

The coordinator keeps, per query generation, `lastCommittedPage`, the single `requestedPage` (when page mode has a pending request), and `nextEligiblePosition`. A request snapshots its position when created. For page mode, a fresh remote/hybrid query requests `firstPage` (default `1`); after an accepted record-bearing page at `p`, `lastCommittedPage = p` and the next eligible page is `p + 1`. Cursor mode begins with no cursor and ordinal `1`; an accepted continuation advances to a new `nextCursor` and increments the ordinal. In acknowledged local pagination over preloaded data in page mode, `infiniteScroll.initialPage` seeds `lastCommittedPage`, so the first eligible position is `initialPage + 1`. These new rules do not alter the legacy mode's existing first signal of `initialPage + 1`.

A page/cursor position is committed only by an accepted, matching completion that declares advancement: `succeeded`, `exhausted`, or `empty` with `advance: 'next'`. `failed`, `cancelled`, stale, unknown, malformed, and `empty` with `advance: 'retry'` do not consume a position. After a failure/cancellation/retry-empty, the same position remains eligible, but automatic retry is disarmed as described below. At most one request is pending per query generation.

Before any mutation, `completeDataRequest()` validates the entire completion and its request snapshot. The accepted validation rules are:

- `requestId` is a non-empty string generated uniquely by the component and never reused during that element instance's lifetime. Only the matching active ID and generation can be accepted. A repeated completion for a settled ID returns `unknown-request`; a completion known to belong to an older generation returns `stale`. Neither changes state.
- `queryGeneration` is a non-negative safe integer that increases monotonically for each new generation. Page numbers, cursor ordinals, `firstPage`, and `fetchLimit` are positive safe integers. Cursor tokens are finite numbers or strings. A `nextCursor` equal to the current token or any previously committed token in this generation is rejected as no forward progress.
- `succeeded` requires a non-empty response page (the host reports records were returned), the full accumulated `items` array, and `hasMore: true`. In cursor mode it also requires a valid, previously unseen `nextCursor`. `exhausted` requires the full accumulated `items` array and `hasMore: false`; it carries no continuation. `empty` is only valid for zero newly returned records with `hasMore: true`; `advance: 'next'` requires a progressing page/cursor position, while `advance: 'retry'` must not supply a new cursor. Mode-incompatible fields and contradictory status/payload combinations are invalid.
- `failed` requires a plain error detail with a non-empty string `message`; optional `code` must be a string and `retryable` a boolean. `cancelled` may include only a defined cancellation reason. Object/function cursor state is invalid; hosts encode complex tokens themselves.
- Completion for a disconnected/disposed request is stale/unknown and can never be accepted. An accepted completion is applied atomically: no item snapshot, page/cursor, `hasMore`, busy, scroll, selection, or active-key state is changed until every validation and identity check succeeds.

An invalid completion returns `invalid`, emits no success/failure transition, and leaves the active request and all component data/selection/page state untouched. The host may submit a corrected completion for the same still-active `requestId`, or submit a valid `failed` completion to settle it. This avoids partial corruption while making the recovery path explicit. Implementations may emit a diagnostic, but that diagnostic cannot mutate request state.

## Request lifecycle and state transitions

The request coordinator exposes one authoritative active status per component instance. `requested` is the synchronous dispatch transition; `loading` begins immediately before notifications are delivered. A pending search/page request suppresses duplicate sentinel/button requests. Network state remains host-owned. `lastCommittedPage`/cursor state advances only when an accepted completion explicitly commits or advances the request position.

| From | Trigger / condition | To | Required behavior |
| --- | --- | --- | --- |
| `idle` | Opt-in remote/hybrid query changes, or eligible load-more trigger fires | `requested` → `loading` | Allocate unique `requestId`; snapshot query generation, position, and resolved `fetchLimit`; expose request context; set component busy state. |
| `loading` | Current request contains records and more data remains | `succeeded` | Accept only matching ID/generation; apply the full accumulated item snapshot; commit the requested page/cursor; install the next position; clear busy and scroll-preservation state. |
| `loading` | Current request returns zero new records while more data remains | `empty` | Keep current snapshot and selection; clear busy; `advance: 'next'` commits/advances to an explicit next position, while `advance: 'retry'` leaves the same position eligible. Apply the sentinel rearm rule below. |
| `loading` | Host reports no further pages, with or without final records | `exhausted` | Require/apply the final full snapshot (including `[]` for zero results); commit the completed position; set `hasMore: false`; clear busy; disable further requests for this generation. |
| `loading` | Current transport fails | `failed` | Preserve accepted data and selection; do not commit the requested position; clear busy; emit existing `error` convention once; do not retry automatically. An explicit retry uses the same position and a new request ID. |
| `loading` | Host submits a valid cancellation for the current request | `cancelled` | Invalidate the ID permanently and do not commit its position; clear busy without treating cancellation as an error; retain accepted data and selection. Retry requires a new request ID after an explicit trigger. |
| `loading` | Query changes or protocol-defining mode changes | prior request becomes `cancelled`/stale; new generation starts | Notify host cancellation; increment generation; reset page/cursor position for the new query. A response from the old generation is rejected. |
| `loading` | Component disconnects | `cancelled` | Permanently invalidate the pending ID before attempting cancellation notification; clear local busy/scroll-preservation state. Host abort is best-effort; any later completion is ignored. Reconnect rules below apply. |
| Any state | Malformed completion, duplicate completion, or completion for unknown ID | unchanged | Return `invalid` for malformed payloads or `unknown-request` for duplicate/unknown IDs; do not clear busy for another request. |
| newer generation active | Completion from older generation arrives | unchanged; old request is stale | Return `stale`; do not apply stale items, emit a second error, or alter selection/current query. |

### Empty, exhausted, failure, and retry rules

- `empty` is nonterminal for pagination: the response adds no rows but the host explicitly says another request may be made (`hasMore: true`). For page mode, `advance: 'next'` consumes the requested page and makes the following page eligible; `advance: 'retry'` keeps that page eligible. For cursor mode, `advance: 'next'` requires a new valid `nextCursor`; `advance: 'retry'` keeps the same cursor and omits `nextCursor`. Both clear loading and require a later trigger; no automatic empty-page loop is allowed.
- `exhausted` is terminal for the current query generation and always carries the final complete item snapshot, including an empty snapshot. A later query generation resets exhaustion.
- `failed` preserves the last accepted data, selection, `hasMore`, and continuation position. The component does not retry automatically. An explicit user retry uses a new request ID and the same current page/cursor unless a new query resets it.
- `cancelled` is not failure and must not emit an error. A host-cancelled request preserves the last accepted data, selection, `hasMore`, and continuation position. A canceled request cannot later become accepted by reusing its ID. When the coordinator itself cancels because of query/mode change or disconnect, it invalidates the request before attempting the cancellation notification; no completion for that ID can then be accepted.
- A stale completion is rejected even when the host's network cancellation loses the race. Query generation and request ID, not abort success, establish acceptance.
- Only one page/cursor request may be pending per query generation. A new query request supersedes older search/page requests. If product requirements later need concurrent page fetches, that needs a separate ordering/merge design.

### Sentinel and retry rearming

Completing an `empty`, `failed`, or host-cancelled request disarms automatic sentinel loading for that position. Clearing busy or receiving another observer callback while the sentinel remains continuously visible is not a new trigger. Automatic loading rearms only after the observer reports a non-intersecting state and then a later intersecting state; an explicit user activation of the manual load-more control is also a new trigger. Each rearm may create at most one request. This rule applies even when an empty page advances to a later page/cursor, so an empty intermediate page cannot cause an observer loop. A successful record-bearing page may use the normal sentinel policy to fill the viewport, still subject to the one-pending-request guard.

No programmatic retry method is proposed here. An explicit user action or a genuine sentinel exit/re-entry can retry the still-eligible position. If product requirements need host-triggered retry without either interaction, that API must be designed and reviewed separately before implementation.

### Disconnect and reconnect

Disconnection invalidates every in-flight request synchronously before any cancellation notification is attempted. The request ID is never reusable and late completion cannot be accepted even if no host listener receives the cancellation notification. The accepted item snapshot and semantic selection/active identities are retained; an uncommitted page/cursor position is not consumed. On reconnect, the component establishes a strictly newer query generation. If a remote/hybrid search was pending without any accepted result for that generation, it issues a fresh initial query at `firstPage` in page mode, or with no cursor/ordinal `1` in cursor mode, using the current query and a new request ID. If a load-more request was pending, the same uncommitted position is eligible under a new ID only after a fresh explicit/manual or sentinel re-entry trigger. If there was no pending request, the last accepted snapshot and continuation state are retained for the same query/mode. Old-generation completion is always stale.

## Query, pagination, and configuration update rules

| Change while active | Approved behavior |
| --- | --- |
| Query changes | Increment `queryGeneration`; cancel/invalidate pending request(s); clear current query's `hasMore`/cursor state; start remote/hybrid search at `firstPage` (default `1`) in page mode or no cursor/ordinal `1` in cursor mode if enabled, including when the query is now empty. Legacy mode preserves existing notifications and host behavior without adding cancellation guarantees. |
| `fetchLimit` / effective `pageSize` changes | Snapshot already-dispatched request unchanged. New value applies to the next request; no request is resized or restarted. |
| `initialPage` / `firstPage` changes | Does not rewrite a pending/current page sequence. `initialPage` seeds a future acknowledged local-pagination reset; `firstPage` seeds a future acknowledged remote/hybrid query. In legacy mode, preserve the observed behavior: post-mount `initialPage` update does not reset `currentPage`. |
| Page ↔ cursor mode or local ↔ remote/hybrid mode changes | Cancel pending request, increment generation, reset continuation state for the new mode, and start a remote/hybrid initial query when applicable. Keep the accepted items and selected identity unless the host supplies a matching snapshot. |
| Other presentation/selection config changes | Do not cancel a data request unless they change query or request protocol identity. Apply existing `updateConfig()` and adapter precedence rules. |
| Adapter prop and `config` both change | Preserve adapter source order: convenience props are applied first and explicit `config` wins on overlapping keys. A later adapter prop update may reapply convenience values as today. |
| `setItems()` outside acknowledgement | In legacy mode, preserve replacement behavior and the observed implicit busy-clear rule (growth clears; empty/same-or-smaller result may remain busy). In acknowledged mode, preserve immediate replacement semantics but do not settle or advance an identified pending request; remote never locally filters it, and hybrid applies its local filter. The host uses a matching completion for request-owned results. |
| `completeDataRequest()` in acknowledged mode | Is the single authoritative completion path for an identified request. It atomically applies the full snapshot for `succeeded`/`exhausted`, retains the current snapshot for `empty`/`failed`/`cancelled`, and settles busy/scroll state only after validation. A plain `setItems()` does not acknowledge an identified pending request. |

The last two rows intentionally preserve old behavior in default mode while defining the explicit opt-in path. This avoids treating every ordinary `setItems()` call as an acknowledgement and avoids two independent loading-state owners. It also means the legacy empty-page busy defect remains until a separately approved correction or consumer migration is completed.

## Existing API compatibility map

| Existing surface | 1.10.0 contract | Approved acknowledged-mode extension |
| --- | --- | --- |
| Local search | `search` event carries `{ query, results, count }`; configured `onSearch` receives `query`. Search filters current loaded data. | Keep current fields and callback first argument. Optional request context is present only for remote/hybrid mode. Local mode remains request-free. |
| Host search | Host commonly fetches from `onSearch` and later calls `setItems()`. No built-in transport or stale guard. | Same host ownership; add request ID/generation context and atomic completion. A matching accepted result replaces the complete data snapshot. |
| Load more | `loadMore` event carries `{ page, items: [] }`; callback receives page number. Busy starts before notification. | Preserve existing page and items fields. Add optional request context; callback return values still do not settle loading. Host calls `completeDataRequest()`. |
| `setItems(items)` | Replaces loaded flat data. Host accumulates pages. Larger data can clear legacy busy state. | Remains replacement-only. In acknowledged mode use it inside/through the atomic completion path or as a data update that does not settle the active request. |
| `setGroupedItems(groups)` | Replaces grouped data; group shape is `{ label, options }`. Current path does not settle load-more busy state. | No pagination-specific meaning proposed. Add grouped-response completion only if grouped remote data is separately specified. |
| `updateConfig(partial)` | Deep-merges instance config; current page is separate state and is not reset by `initialPage` update. | New request metadata snapshots values at dispatch. Config-update rules above govern cancellation/reset. |
| `configureSelect(partial)` | Sets global defaults; wrappers may apply convenience props after them. | Preserve current source-traced precedence; do not make global config silently override explicit adapter defaults. |
| `serverSide.fetchSelectedItems(values)` | Resolves records for selected values not in current items. | Remains separate from search/page requests; selected-item lookup needs its own cancellation/error contract if later unified. |
| `pageLoaded` | Declared type but no integrated emitter found. | Do not use as acknowledgement without a separate event/API review. |

Adapter surface mapping remains intentionally asymmetric: React callbacks; Vue component emits; Svelte custom event details; Solid callbacks; Vanilla helper callbacks; React Native callback/JSON bridge. The Vanilla grouped-input shape remains `{ group, items }`, unlike core/framework `{ label, options }`. See the [compatibility baseline](./PUBLIC-API-COMPATIBILITY.md); the existing contract run had 43 skipped assertions and no Solid or React Native adapter-contract suite, so those surfaces require their own evidence.

## Acceptance-test matrix for implementation review

These are proposed acceptance tests, not tests implemented by Phase 2A. Each row must run at core level and through the adapters named for the supported claim. A core-only pass is not adapter parity evidence.

| Scenario | Required assertions | Core | Real adapter coverage |
| --- | --- | --- | --- |
| Static items and local search | Case-insensitive match; clear restores all loaded items; whitespace-padded query produces identical event results/count and rendered rows; no network request is issued. | Vitest component/engine integration | React, Vue, Svelte, Vanilla first; Solid and React Native Web in dedicated suites; RN native/WebView behavior on device/emulator before claiming native parity. |
| Controlled/uncontrolled values | Search/filter does not drop selected key; framework-controlled updates remain authoritative; deselection/clear remain explicit. | Core selection invariant tests | React, Vue, Svelte, Solid, Vanilla; separate RN Web and native checks. |
| Remote query race | Query A then B; A resolves after B; A completion returns stale and does not mutate rows, query, busy state, or selected keys. | Deterministic deferred-promise tests | Each adapter's event/callback mapping; RN bridge must round-trip request ID/generation. |
| Initial query and query clearing | Mount remote/hybrid with a preconfigured non-empty query and verify one page-mode request at `firstPage` (default 1) or cursor-mode request with no cursor/ordinal 1; mount with no query and verify the documented empty-query request; clearing a non-empty remote query issues `query: ''` rather than locally restoring an old dataset; zero-result terminal response accepts an empty snapshot. | Core lifecycle tests for mount, clear, empty response, and query generation | React, Vue, Svelte, Vanilla; Solid and React Native only when dedicated suites exist. |
| Remote and hybrid semantics | Remote mode does not display old-query filtered results as current; hybrid filters only the accepted response snapshot; raw query is preserved and canonical local query is consistent. | Core search/request tests | React, Vue, Svelte, Vanilla; Solid/RN once suites exist. |
| Page-number compatibility | Default first legacy signal is page 2; `initialPage: 4` emits 5; current `loadMore` detail remains `{ page, items: [] }`; legacy mode remains unchanged after config update. | Focused core contract test | Wrapper props/callback payloads, including each effective `pageSize` default. |
| Acknowledged page progression | New page-mode remote query requests `firstPage` (default 1); cursor-mode query starts with no token/ordinal 1; accepted page `p` makes `p + 1` eligible; failed/cancelled and `empty: retry` do not consume `p`; `empty: next` explicitly commits `p` and advances; retries keep position but use a new request ID. | Core coordinator state-machine tests | At least one real adapter per framework family; per-adapter page defaults and payload translation before parity claims. |
| Fetch-limit resolution | Explicit `fetchLimit` wins; otherwise effective `infiniteScroll.pageSize` is snapshotted; changing it while a request is pending affects only the next request; `itemsPerLoad` never changes fetch limit. | Core unit + config tests | Verify prop/config precedence per wrapper and JSON-safe RN bridge metadata. |
| Cursor paging | First cursor request omits cursor; next request uses accepted `nextCursor`; ordinal increases; stale/duplicate cursors are not applied; host retains accumulation ownership. | Core cursor coordinator tests | React/Vue/Svelte/Vanilla metadata mapping; RN scalar cursor serialization. |
| Empty and exhausted pages | Empty nonterminal response clears busy without changing selection and waits for another trigger; exhausted response disables further requests; empty terminal snapshot is supported. | Core completion lifecycle tests | At least one end-to-end wrapper path per supported framework family; all adapters before parity claim. |
| Visible-sentinel rearm | Keep the sentinel continuously intersecting across empty/nonterminal completion and assert no second request; rearm only after a non-intersecting then intersecting transition or an explicit manual load-more action; verify one request per rearm even when successive pages are empty. | Deterministic observer-state integration test | Browser test for the Web Component and at least one adapter integration. |
| Configuration and malformed-completion validation | Configuration tests reject invalid `fetchLimit`/`firstPage`; completion tests reject invalid page/cursor positions, repeated continuation tokens, duplicate/unknown IDs, invalid errors, and status/payload contradictions. Assert no item, selection, page, active-request, or busy-state partial mutation; a corrected completion with the same still-pending ID can then be accepted. | Separate config and completion validation suites | Adapter/bridge serialization coverage, especially React Native cursor/error payloads. |
| Disconnect and reconnect | Disconnect while search and while load-more are pending; old IDs remain permanently invalid, accepted data/selection remain, generation increases on reconnect, canceled position is not consumed, page-mode remote search restarts at `firstPage` and cursor mode at no token/ordinal 1, and load-more waits for a fresh trigger. | Core lifecycle test with deferred completions | React/Vue/Svelte/Solid/Vanilla teardown; RN WebView disposal and native-device behavior. |
| Dual notification channels | One intent allocates one request ID; event and callback each receive that exact context once; core preserves event-before-callback ordering; two registered channels do not cause two coordinator requests; document/test host single-owner or request-ID dedup guidance. | Core spy/ordering test | Verify each adapter's actual event/callback mapping and ordering independently. |
| Legacy/acknowledged isolation | Run the same trigger/config fixture in both protocols; assert legacy event detail, callback arguments/order, page-2 first signal, busy transitions, adapter defaults, and `setItems()` replacement behavior remain unchanged; acknowledged mode alone adds IDs, completion validation, and commit-on-accept progression. | Paired core compatibility tests | Mounted contract tests for every maintained adapter; React Native Web/native separately. |
| Failure and retry | Failure emits one error, preserves data/selection, clears busy, and does not auto-retry; retry uses a new ID and same page/cursor. | Core deterministic rejection tests | Callback/event error propagation in React/Vue/Svelte/Vanilla; bridge error encoding in RN. |
| Cancellation and disconnect | Query change/config mode change/unmount invalidates old IDs, notifies host cancellation, and ignores late completion. | Core lifecycle test with deferred transport | React/Vue/Svelte/Solid/Vanilla teardown; RN WebView disposal and native-device behavior. |
| Duplicate records and selection persistence | Host policy for duplicate records is deterministic; component does not silently dedupe; selected identity persists when record is absent and reappears with same stable key. | Core item-registry/selection tests | Adapter controlled-value parity; Vanilla grouped conversion remains covered separately. |
| Global/instance/adapter precedence | Effective values follow documented source order; runtime updates do not rewrite pending request snapshots. | Core config/coordinator tests | One real mounted test per adapter, including defaults and explicit `config` override. |
| Static local reveal/chunk rendering | Public `virtualized` behavior remains legacy chunking; no viewport-bounded-DOM assumption enters data-loading contracts. | Existing core regression | Existing browser matrix; no new public virtualization claim. |

## Phase 2A exit checklist

- [x] Current 1.10.0 search/pagination ownership and observed compatibility boundary are linked to the Phase 1 evidence.
- [x] Every declared integrated load-more/infinite-scroll field has a versioned disposition; adjacent legacy/internal fields are explicitly separated.
- [x] The host, approved data-coordinator target, semantic engine, Web Component, and adapters each have an authority boundary.
- [x] Requested/loading/succeeded/empty/exhausted/failed/cancelled/stale transitions are specified.
- [x] Additive page/cursor request and explicit completion acknowledgement shapes are approved as the implementation target.
- [x] Runtime updates, pending page-size changes, query replacement, duplicate records, retry, and disconnect are addressed.
- [x] Existing events, callbacks, `setItems()`, `updateConfig()`, defaults, and adapter differences are mapped.
- [x] Static/local/remote/infinite-scroll/selection/real-adapter acceptance cases are listed.
- [x] Maintainer approval of the 1.11.x semantics and names is recorded by the Phase 2A final engineering decision.
- [x] Phase 2B is authorized for the internal DOM-independent coordinator and deterministic tests only; public component and adapter integration remain unauthorized.

Production viewport virtualization remains **NO-GO**. This contract design makes no WCAG, manual assistive-technology, performance-budget, package-release, or production-readiness claim.
