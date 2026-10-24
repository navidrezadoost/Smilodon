# Phase 2F — Public Acknowledged Data-Loading Contract

**Status: Ratified design baseline — Contract Review 003 (2026-10-24). D01–D09 are ratified and C1–C9 are accepted as implementation gates. This freezes the contract design only; no public API implementation, adapter change, package export, version change, release, or production activation is authorized.**

This ratified contract follows the approved [Phase 2A search and pagination contract](./PHASE-2A-SEARCH-PAGINATION-CONTRACT.md), [Phase 2D resource/readiness contract](./PHASE-2D-INTEGRATION-READINESS.md), and technically closed [Phase 2E private core integration](./PHASE-2E-CORE-INTEGRATION.md). It addresses the public facade and the first adapter set in scope: React, Vue, Svelte, and Vanilla.

The compatibility baseline is Smilodon 1.10.0 at `b0216e6ed7356cfb2e8236767cd3694061449c79`, as recorded in the [public API compatibility inventory](./PUBLIC-API-COMPATIBILITY.md). The present repository contains private coordinator/core integration evidence; it does not expose the acknowledged protocol as a supported public API. Ratification freezes the design target and does not change that implementation status.

## Contract Review 003 ratification record

The authorized final review ratified this document as the Phase 2F public acknowledged data-loading design baseline. It resolved all five review findings without adding API surface beyond the signatures already specified here:

| Finding | Ratified disposition |
| --- | --- |
| P2F-R01 — Legacy callback compatibility | Resolved; preserve each source-traced core, React, Vue, Svelte, and Vanilla signature and append optional request context only as specified. |
| P2F-R02 — Configuration transitions | Resolved; retain the documented validation transition table, atomic data-loading subconfiguration rejection, and transition-scoped diagnostics. |
| P2F-R03 — Projection lifecycle and recovery | Resolved; accepted canonical state, asynchronous projection, interruption, and readiness-driven recovery remain distinct. |
| P2F-R04 — Cursor-depth terminality | Resolved; exhaustion/resource-limit terminality, reset conditions, manual triggers, and observer behavior follow the specified contract. |
| P2F-R05 — Cancellation after acceptance | Resolved; disconnect does not cancel an already accepted/settled request solely due to interrupted projection. Recovery retains its request ID/generation and never repeats the original request notification or completion acceptance; any separate active request follows the cancellation contract. |

D01–D09 are ratified design decisions. C1–C9 are accepted observable implementation gates, not evidence that those gates have already been executed. The approved API signatures, compatibility requirements, exclusions, and acceptance criteria below are the frozen design baseline.

## Decision vocabulary and authority

The labels below prevent proposed public behavior from being mistaken for shipped behavior.

| Label | Meaning |
| --- | --- |
| **Normative carry-forward** | An already-approved requirement in Phase 2A/2D or a boundary accepted at Phase 2E. It is the implementation target unless formally revised. It does not claim public implementation. |
| **Proposal (historical label)** | A public-facing shape or observable rule originally submitted for review. Contract Review 003 ratifies the D01–D09 design target recorded here; this label does not imply implementation or shipment. |
| **Open decision** | A compatibility or API choice that must be resolved before implementation is authorized. |

This is the ratified contract design, not an implementation plan. It authorizes no source/type/export changes, adapter work, package/version updates, release, or production activation. Production viewport virtualization remains **NO-GO**. Repository merge governance remains open pending administrator enforcement; Phase 4 replication integrity remains a separate open workstream.

| Workstream | Status |
| --- | --- |
| Phase 0–2E | Closed within their approved scopes; this does not imply product-wide release readiness. |
| Phase 2F contract design | Ratified and frozen as the design baseline; documentation closeout is authorized. |
| Phase 2F implementation and adapter integration | Not authorized. |
| Repository merge governance | Blocked pending administrator enforcement. |
| Phase 4 replication integrity | Open, separate workstream. |
| Production viewport virtualization | **NO-GO.** |

## Goals and non-goals

The public design should let an application opt into one acknowledged, transport-neutral lifecycle while preserving the existing 1.x API for all consumers who do not opt in. The core owns request identity, progression, validation, stale rejection, and accepted-snapshot projection. The application owns transport, cancellation controllers, response transformation, accumulation, and deduplication. Adapters translate framework conventions and do not create a second request lifecycle.

The ratified design does not add built-in fetch/GraphQL transport, automatic retries, caching, implicit page append, a grouped-remote-data contract, or public viewport windowing. Existing `setItems()` remains replacement-only. Solid and React Native are not part of the first four-adapter implementation scope; their parity is not implied by this contract.

## 1. Configuration precedence and compatibility

### Normative carry-forward

- Preserve the existing default protocol and legacy behavior. Acknowledged loading is opt-in; omitting its configuration must not add request metadata, change page numbering, alter callback/event order or payloads, or change `setItems()` semantics.
- Preserve the source-traced precedence: core defaults → `configureSelect()` global defaults → adapter convenience props → the adapter's explicit `config` passthrough → later imperative instance `updateConfig()`. A subsequent declarative adapter update may reapply convenience props as it does today.
- Preserve each adapter's existing effective defaults, including different `pageSize`, `virtualized`, placement, placeholder, value/event conventions, and grouped-item input shape. Do not normalize those defaults as a side effect of this feature.
- In acknowledged mode, resolve `fetchLimit` from explicit `dataLoading.fetchLimit`, otherwise the effective existing `infiniteScroll.pageSize`. Snapshot the resolved value into each dispatched request. `itemsPerLoad` remains a button-label setting, not a fetch limit.
- A request already dispatched is immutable with respect to later configuration changes. Query/protocol-defining mode changes invalidate pending work and start a new generation according to Phase 2A; changing a future request's limit does not resize the active request.

### Ratified design: per-instance configuration first; global acknowledged defaults deferred

Use one shared `dataLoading` object in the existing per-instance `config` passthrough for the core and all four adapters. Do **not** add adapter-specific `remote`, `cursor`, or `acknowledged` props. Keep `configureSelect()` typed and implemented for the existing `GlobalSelectConfig` without `dataLoading` in the first public increment. Global acknowledged defaults are **deferred** until a focused characterization proves the current global clone/merge path safely preserves all existing config values; this explicitly resolves D03 without assuming JSON serialization is safe. If later enabled, the global value will be the lowest-precedence source.

The ratified design's acknowledged-only fields are the Phase 2A set: `protocol`, `searchMode`, `paginationMode`, `firstPage`, and `fetchLimit`. The internal cursor bound controls (`maxCursorPages`, `maxCursorTokenBytes`) are not automatically promoted to public settings. Their accepted Phase 2D defaults and hard caps remain enforced internally; public overrides are deferred.

The ratified per-instance precedence is: component/core defaults → existing `configureSelect()` values for legacy fields only → adapter convenience props → explicit adapter `config` (including `config.dataLoading`) → later imperative `updateConfig()`. A later declarative adapter update may reapply convenience props as today. For acknowledged settings, the default is legacy unless the effective per-instance config opts in; there is no global acknowledged default in this initial contract. An explicit `dataLoading.fetchLimit` wins over the effective `infiniteScroll.pageSize`; otherwise the latter is snapshotted.

Validate a merged candidate `dataLoading` object before changing that subconfiguration. If invalid, retain the last valid data-loading config, do not cancel an active request, do not dispatch remote work, and emit one typed `dataLoadingConfigError` event/callback for the transition; repeated equal invalid candidates during framework rerenders do not repeat the diagnostic. Unrelated valid legacy/presentation fields in the same `updateConfig()` call may still apply. Export a pure `validateDataLoadingConfig()` function for preflight validation. Do not throw from adapter render/update hooks. The exact validation error types and event are specified below.

| Source | Ratified design behavior | Compatibility constraint |
| --- | --- | --- |
| Core default | `protocol: legacy`, `searchMode: local`, `paginationMode: page`; no acknowledged request without opt-in | Existing behavior remains default. |
| Global `configureSelect()` | Continues to provide defaults for current `GlobalSelectConfig`; acknowledged `dataLoading` is deferred in the first increment | Do not assume current global clone/merge safely supports the new feature. |
| Adapter convenience props | Continue to configure only their already-defined fields | No new per-adapter special meaning for `pageSize` or `virtualized`. |
| Adapter `config.dataLoading` | Explicit shared per-instance protocol configuration; wins over overlapping convenience-derived values | Same typed shape and semantics in all four adapters. |
| Imperative `updateConfig()` | Applies a partial update using current core semantics; snapshots affect future requests | Does not rewrite an in-flight request. A later declarative update may reapply adapter props as today. |

Remote/hybrid search and cursor pagination require `protocol: acknowledged`. `firstPage` and `fetchLimit` must be positive safe integers; the complete validation set is inherited from Phase 2A/2D. Invalid combinations produce the typed observable error and no request. Legacy declarations retained for compatibility but known to be inert remain inert; this feature must not silently activate cache/preload settings or reinterpret legacy page fields.

## 2. Completion, notification, and request-identity contracts

### Normative carry-forward

- The coordinator is the sole authority for request ID, query generation, pending status, page/cursor progression, completion acceptance, stale rejection, and acknowledged busy lifecycle. The host is the sole owner of network transport, `AbortController`s, transformation, accumulation, and deduplication.
- A request has one immutable `requestId`, generation, exact query, normalized query, resolved fetch limit, and snapshotted page/cursor position. A request ID is never reused during an element instance's lifetime.
- Only one pagination request may be pending in a generation. Query/mode changes invalidate prior work before notifying cancellation. Late responses are rejected by identity/generation even if transport cancellation fails.
- `completeDataRequest()` is the only settlement path for an identified acknowledged request. A callback's return value or promise is not an implicit acknowledgment. `setItems()` outside completion remains an immediate replacement but does not settle or advance an active identified request.
- Completion validation is atomic. Invalid, stale, and unknown results do not mutate data, selection, continuation, or a newer request's busy state. For success/exhaustion, `items` is the host's complete accumulated replacement snapshot; the component does not append or deduplicate.
- Core legacy `search`/`loadMore` event fields and callback first arguments remain unchanged. In core, request notification retains event-before-callback order. Event and callback channels for one intent carry the same request identity; the host designates one transport owner or deduplicates by request ID.
- Cancellation is best-effort transport advice. The coordinator invalidates first. Cancellation is not an error; stale completion rejection remains mandatory.

### Source-traced 1.10.0 callback baseline

The extension signatures below are based on the 1.10.0 source baseline recorded above, not inferred. The current leading arguments differ by surface and must remain in their current positions:

| Surface | Current callback/event contract in source | Ratified acknowledged extension |
| --- | --- | --- |
| Core `CallbackConfig` | `onSearch(query: string): void`; `onLoadMore(page: number): void` in `packages/core/src/config/global-config.ts`. The core DOM events separately carry `search: { query, results?, count? }` and `loadMore: { page, items }` from `packages/core/src/components/enhanced-select.ts`. | Core callbacks become `(query, request?)` and `(page, request?)`; event fields remain and the optional `request` field is added to each event detail. Do not add React's `results`/`count` callback arguments to core callbacks. |
| React props | `onSearch(query, results?, count?)`; `onLoadMore(page): void | Promise<void>` in `packages/react/src/Select.tsx`. | Append `request?` after `count?` for search and after `page` for load-more. Preserve the React load-more promise return type, but never treat its settlement as acknowledgment. |
| Vue component emits | `search(query)` and `loadMore(page)` in `SelectEmits` in `packages/vue/src/Select.vue`. | Append optional request metadata as the next emitted argument; do not wrap the legacy query/page in a new object. |
| Svelte component events | `search` detail `{ query }` and `loadMore` detail `{ page }` in `packages/svelte/src/Select.svelte`. | Add optional `request` fields to those existing detail objects; keep event names and old fields. |
| Vanilla helper callbacks | `onSearch(query)` and `onLoadMore(page)` in `packages/vanilla/src/index.ts`. | Append optional request metadata as the second callback argument. |

These signatures are the single compatibility inventory for the ratified contract. Any future source-baseline change must update this table and the adapter declarations together; no framework's signature is a substitute for another's.

### Ratified design signatures: public core types and methods

The following declarations are the ratified design signatures, not current exports. They use one instance-config extension so `configureSelect()` can remain unchanged while the global serialization path is characterized separately.

```ts
export type DataRequestId = string;
export type QueryGeneration = number;
export type PageCursor = string | number;

export interface DataLoadingConfig {
  protocol?: 'legacy' | 'acknowledged';
  searchMode?: 'local' | 'remote' | 'hybrid';
  paginationMode?: 'page' | 'cursor';
  firstPage?: number;
  fetchLimit?: number;
}

export interface ResolvedDataLoadingConfig {
  readonly protocol: 'legacy' | 'acknowledged';
  readonly searchMode: 'local' | 'remote' | 'hybrid';
  readonly paginationMode: 'page' | 'cursor';
  readonly firstPage: number;
  readonly fetchLimit?: number;
}

// Preserve all existing core callback fields, replacing only these two
// declarations with source-compatible optional request-context extensions.
export type AcknowledgedCoreCallbacks =
  Omit<Partial<CallbackConfig>, 'onSearch' | 'onLoadMore'> & {
    onSearch?: (query: string, request?: SearchDataRequest) => void;
    onLoadMore?: (page: number, request?: LoadMoreDataRequest) => void;
  } & AcknowledgedCallbackAdditions;

// Existing GlobalSelectConfig remains the global-default surface in this increment.
export type SelectInstanceConfig = Omit<Partial<GlobalSelectConfig>, 'callbacks'> & {
  callbacks?: AcknowledgedCoreCallbacks;
  dataLoading?: Partial<DataLoadingConfig>;
};

export type DataLoadingConfigIssueCode =
  | 'unknown-field'
  | 'invalid-type'
  | 'invalid-value'
  | 'invalid-positive-integer'
  | 'requires-acknowledged-protocol';

export interface DataLoadingConfigIssue {
  path: string;
  code: DataLoadingConfigIssueCode;
  message: string;
}

export type DataLoadingConfigValidationResult =
  | { valid: true; value: ResolvedDataLoadingConfig }
  | { valid: false; issues: readonly DataLoadingConfigIssue[] };

export function validateDataLoadingConfig(
  candidate: unknown,
): DataLoadingConfigValidationResult;

export interface DataRequestBase {
  readonly requestId: DataRequestId;
  readonly queryGeneration: QueryGeneration;
  readonly query: string;
  readonly normalizedQuery: string;
  readonly fetchLimit: number;
  readonly position: PagePosition;
}

export interface SearchDataRequest extends DataRequestBase {
  readonly kind: 'search';
  readonly mode: 'remote' | 'hybrid';
}

export interface LoadMoreDataRequest extends DataRequestBase {
  readonly kind: 'loadMore';
}

export type PagePosition =
  | Readonly<{ mode: 'page'; page: number }>
  | Readonly<{ mode: 'cursor'; cursor?: PageCursor; ordinal: number }>;

export type DataRequest = SearchDataRequest | LoadMoreDataRequest;

export interface DataRequestError {
  readonly message: string;
  readonly code?: string;
  readonly retryable?: boolean;
}

export interface DataRequestCancelNotification {
  readonly requestId: DataRequestId;
  readonly queryGeneration: QueryGeneration;
  readonly reason: 'query-changed' | 'config-changed' | 'disconnected';
}

export type DataRequestCompletion =
  | Readonly<{
      requestId: DataRequestId; queryGeneration: QueryGeneration;
      status: 'succeeded'; items: readonly unknown[]; hasMore: true;
      nextCursor?: PageCursor;
    }>
  | Readonly<{
      requestId: DataRequestId; queryGeneration: QueryGeneration;
      status: 'empty'; hasMore: true; advance: 'next' | 'retry';
      nextCursor?: PageCursor;
    }>
  | Readonly<{
      requestId: DataRequestId; queryGeneration: QueryGeneration;
      status: 'exhausted'; items: readonly unknown[]; hasMore: false;
    }>
  | Readonly<{
      requestId: DataRequestId; queryGeneration: QueryGeneration;
      status: 'failed'; error: DataRequestError;
    }>
  | Readonly<{
      requestId: DataRequestId; queryGeneration: QueryGeneration;
      status: 'cancelled'; reason?: 'host-cancelled';
    }>;

export type DataRequestCompletionResult =
  | 'accepted' | 'stale' | 'unknown-request' | 'invalid' | 'resource-limit';

export type DataLoadingStatus =
  | 'idle' | 'requested' | 'loading' | 'succeeded' | 'empty'
  | 'exhausted' | 'failed' | 'cancelled' | 'resource-limited';

export type DataLoadingResourceLimit =
  | Readonly<{ reason: 'cursor-depth'; maxCursorPages: number; requestId?: DataRequestId }>
  | Readonly<{
      reason: 'cursor-token-size'; maxCursorTokenBytes: number;
      actualCursorTokenBytes: number; requestId: DataRequestId;
    }>;

export interface DataLoadingStateSnapshot {
  readonly status: DataLoadingStatus;
  readonly connected: boolean;
  /** Core request or accepted-snapshot projection is still pending; excludes external presentation loading. */
  readonly busy: boolean;
  readonly projectionPending: boolean;
  readonly queryGeneration: QueryGeneration;
  readonly activeRequest: DataRequest | null;
  readonly hasMore: boolean;
  readonly nextEligiblePosition: PagePosition;
  readonly error: DataRequestError | null;
  readonly resourceLimit: DataLoadingResourceLimit | null;
}

export type DataProjectionEventDetail =
  | Readonly<{
      requestId: DataRequestId; queryGeneration: QueryGeneration;
      attempt: number; status: 'complete';
    }>
  | Readonly<{
      requestId: DataRequestId; queryGeneration: QueryGeneration;
      attempt: number; status: 'failed'; error: { readonly message: string };
    }>;

export interface DataLoadingConfigErrorDetail {
  readonly issues: readonly DataLoadingConfigIssue[];
}

export type DataLoadingConfigErrorEventDetail = DataLoadingConfigErrorDetail;

export interface SearchEventDetail {
  query: string; results?: unknown[]; count?: number;
  request?: SearchDataRequest;
}

export interface LoadMoreEventDetail {
  page: number; items: unknown[];
  request?: LoadMoreDataRequest;
}

export interface SelectEventsDetailMap {
  search: SearchEventDetail;
  loadMore: LoadMoreEventDetail;
  dataRequestCancel: DataRequestCancelNotification;
  dataProjection: DataProjectionEventDetail;
  dataLoadingConfigError: DataLoadingConfigErrorEventDetail;
}

// New notification callbacks; request callbacks are declared in AcknowledgedCoreCallbacks above.
export interface AcknowledgedCallbackAdditions {
  onDataRequestCancel?: (detail: DataRequestCancelNotification) => void;
  onDataProjection?: (detail: DataProjectionEventDetail) => void;
  onDataLoadingConfigError?: (detail: DataLoadingConfigErrorEventDetail) => void;
}

export interface EnhancedSelectAcknowledgedSurface {
  updateConfig(config: SelectInstanceConfig): void;
  startDataLoading(): void;
  getDataLoadingState(): DataLoadingStateSnapshot;
  completeDataRequest(
    completion: DataRequestCompletion,
  ): DataRequestCompletionResult;
}
```

`validateDataLoadingConfig()` accepts a complete effective candidate (the caller merges current instance values and defaults first); it applies the defaults (`legacy`, `local`, `page`, and `firstPage: 1`) and cross-field rules and returns a `ResolvedDataLoadingConfig`. It rejects unknown fields rather than silently ignoring misspelled protocol settings. `fetchLimit` may remain unset and is resolved from the effective `infiniteScroll.pageSize` when a request is made. The validator is pure, does not inspect component/global state, and performs no mutation or dispatch. The public validator does not validate internal cursor resource-policy fields because those are not public configuration.

`dataRequestCancel`, `dataProjection`, and `dataLoadingConfigError` are proposed as bubbling, composed core custom events whose `detail` is exactly the corresponding type above. Request metadata is optional in declarations so existing handlers remain assignable; at runtime it is present only on acknowledged request notifications. `getDataLoadingState()` returns a fresh detached snapshot of coordinator status, active identity, next position, core-owned busy/projection state, error, and resource-limit outcome; `busy` is true while either a request or accepted-snapshot projection remains pending, and `projectionPending` identifies the latter. External presentation loading is excluded from this snapshot. The snapshot does not expose item storage or mutable coordinator-owned objects. `readonly` is a TypeScript constraint, not a runtime `Object.freeze()` promise. Nested request/position/error/resource-limit records are copied, so mutating a returned object cannot mutate coordinator state; a later call returns the authoritative state. No `AbortSignal` is included in request/event payloads.

`startDataLoading()` is the explicit readiness boundary required by Phase 2D. Direct custom-element consumers install event listeners, apply effective config, then call it. Repeated calls while ready are no-ops and cannot duplicate the initial request; repeated calls before connection coalesce to one deferred readiness request, dispatched only after connection and listener/config setup. Disconnect closes readiness; a call made while disconnected does not dispatch and the consumer must call again after reconnect and listener setup. A call made while the effective acknowledged config is invalid does not open or latch readiness; correcting the config requires another call. Framework adapters invoke it only after props/config and listeners are installed, and repeat that sequence on reconnect. It is a no-op for unchanged legacy operation and never creates a second request lifecycle.

**D01 proposed resolution — synchronous canonical acceptance, separate projection notification.** `completeDataRequest()` returns synchronously. `accepted` means the coordinator has validated the active identity/payload and committed the canonical snapshot; it does **not** mean the DOM has finished rendering. The accepted Phase 2E implementation projects the canonical coordinator snapshot after every accepted completion, including statuses whose item snapshot is unchanged; rejected completions (`stale`, `unknown-request`, `invalid`, or token-size `resource-limit`) do not start projection. The proposed public `dataProjection` event therefore reports the result of each accepted completion's projection attempt, with the same request ID and query generation. A successful event is emitted only after registry/render/ARIA/scroll work completes, core-owned busy is cleared, and the effective `aria-busy` value has been synchronized. If adapter-supplied external loading remains true, `aria-busy` may remain true; the event means projection completed, not that all presentation loading ended. A failed event is emitted after the canonical snapshot is retained, the projection lock/core busy state is preserved while connected, and the current `aria-busy` value is synchronized. Projection failure is not transport failure and does not ask the host to resubmit or re-accept the completion.

| Projection transition | Canonical/request state | `dataProjection` and ordering |
| --- | --- | --- |
| Host completion validates | Coordinator commits once; request is settled; projection begins from that canonical snapshot | `completeDataRequest()` returns `accepted` synchronously. No projection event is emitted before the attempt resolves. Core-owned `busy` remains true and `projectionPending` is true. |
| Projection succeeds | Canonical state is unchanged; no second acceptance occurs | Publish rows, finish render/ARIA/scroll sync, clear core-owned busy, synchronize effective `aria-busy`, then emit `complete` with the accepted request ID/generation and attempt. External loading may keep effective `aria-busy` true. |
| Projection fails | Keep canonical snapshot; do not restore the host payload or classify it as transport failure; keep projection lock and core busy while connected | Synchronize current effective `aria-busy`, then emit `failed` with the same request ID/generation and attempt. `getDataLoadingState()` reports projection pending. |
| Disconnect interrupts an in-flight projection | Already-accepted request remains settled and accepted; do not emit `dataRequestCancel` for it solely because projection was interrupted. Ordinary disconnect still invalidates any separate active request under the cancellation contract. Retain canonical snapshot and pending latest query intent. | If the attempt resolves as failed, report that attempt's failure; do not report success for an incomplete projection. Reconnect readiness must recover canonical state before opening request readiness, using the original accepted request ID and generation. Recovery does not re-emit the original search/load-more request notification or accept its completion again. |
| New query arrives while projection is pending | Retain/coalesce only the latest query intent; do not change the accepted request's generation or start a competing search | Finish or recover the accepted projection first. On success, emit its `complete` event after busy/ARIA synchronization, then dispatch exactly one request for the latest query. |
| A not-ready readiness invocation recovers the pending projection | Project from the canonical snapshot; do not re-accept/re-commit completion | Increment attempt. If successful, clear projection pending/core busy, synchronize effective `aria-busy`, emit `complete` for the same accepted identity, then allow latest-query dispatch. If it fails, leave readiness closed; no loop is scheduled. A subsequent explicit readiness call while still not ready may try again. |

The public notification must follow the Phase 2E recovery behavior, not add an automatic retry policy: Phase 2E retains the accepted canonical snapshot and pending projection lock after failure. It does not schedule a retry. Actual disconnect closes readiness; after reconnect, the readiness operation waits for the interrupted task and, if projection remains pending, invokes recovery from the canonical snapshot. If that recovery fails, readiness remains closed; another explicit readiness invocation while not ready may try again. Repeated `startDataLoading()` while the same connection is already ready is a no-op and is not a projection retry; therefore a failure during an already-ready projection needs disconnect/reconnect before public readiness can attempt recovery. Each actual projection attempt increments `attempt`; a successful recovery may emit `complete` for the same already-accepted ID/generation with a higher attempt, but it never re-applies the host completion or commits the canonical snapshot twice. A query typed while the lock is pending is coalesced as latest pending intent; it does not supersede the accepted snapshot projection or advance the coordinator generation until recovery succeeds. Then the projection-complete notification precedes dispatch of the one latest query. Disconnect during projection may interrupt that attempt; if it resolves as failed, notify failure for that attempt, keep the accepted snapshot, and do not notify success until a not-ready readiness recovery succeeds. A disconnect after canonical acceptance does not retroactively cancel that accepted request. Consumers needing rendered-DOM confirmation observe `dataProjection`, not the method's return value.

**D02 proposed resolution — typed validation, atomic subconfiguration rejection, transition-scoped diagnostic.** `updateConfig()` retains its existing `void` return type. Validation is performed on the merged candidate before the `dataLoading` subconfiguration is committed. On invalid input, preserve the last valid `dataLoading` config and any active request; do not cancel, replace, or dispatch a fallback request. Other valid non-data-loading fields in the same update may apply. The standalone validator remains pure and adapters must not throw from render/update hooks.

| Transition | Required observable outcome |
| --- | --- |
| Initial candidate is invalid and requests acknowledged/remote behavior | Reject the full `dataLoading` candidate; keep readiness closed; `startDataLoading()` does not dispatch or latch readiness; do not fall back to a legacy request. Emit one config-error notification for this transition. After a valid candidate is accepted, the consumer/adapter must establish readiness again. |
| A valid acknowledged config and request are already active; a later `dataLoading` candidate is invalid | Retain the previous valid config and allow the active request to continue with its immutable dispatch snapshot. Do not cancel it, close established readiness, or dispatch a replacement. Emit one config-error notification for the transition. |
| A config update combines valid legacy/presentation fields with invalid `dataLoading` | Apply the valid unrelated fields; reject only `dataLoading`. Preserve the previously accepted protocol config. If no valid acknowledged config has ever been accepted, readiness remains closed and no legacy fallback request is generated. |
| `infiniteScroll.pageSize` changes in the same update as invalid `dataLoading.fetchLimit` | Apply the valid page-size change but reject the invalid data-loading candidate. Existing request limits remain snapshotted. Future requests use the retained valid explicit `fetchLimit`, if present; otherwise they resolve against the newly effective page size. |
| Framework rerenders repeat a deep-value-equal invalid candidate (object identity is irrelevant) | Emit no repeated diagnostic for the same consecutive invalid candidate. Emit exactly one event on transition to a different invalid candidate; accepting any valid candidate clears the suppression latch, so a later invalid transition is reported again. |

`dataLoadingConfigError` therefore means a new invalid configuration transition was rejected, not that an active valid request failed. Its detail contains the validator's issues for that transition. Initial invalid acknowledged config stays unready until corrected; an invalid update after a valid config does not unnecessarily block the active protocol. The standalone validator lets applications preflight the same candidate before render/mount.

Request/completion statuses remain those defined in Phase 2A: `succeeded`, `empty`, `exhausted`, `failed`, and `cancelled`; local outcomes such as stale, invalid, unknown, or resource-limited are not server statuses. Failure maps to one core `error` notification while preserving accepted data and selection. Host cancellation does not emit an error. A duplicate completion is never applied twice. A corrected payload may be submitted against the same still-active ID only when the prior payload was invalid and the request remains active.

The current public `pageLoaded` type is not repurposed as a completion signal. Existing callback promise behavior remains unchanged in legacy mode and is never treated as acknowledgment. Cancellation notification is emitted only for coordinator cancellation; disconnect invalidation happens even if no listener is attached.

### Required observable ordering

For the core element, one intent must follow this order: install request and config-error listeners → apply/validate effective config → call `startDataLoading()` → allocate request ID and snapshot → set acknowledged busy/requested state → dispatch the existing request event → invoke its configured callback with the same request context → accept/validate one host completion → commit the canonical snapshot and synchronously return `accepted` → project the canonical snapshot → clear core-owned busy and synchronize effective `aria-busy` → emit `dataProjection: complete`. Projection failure retains the accepted canonical snapshot and busy/projection lock, synchronizes the busy state, then emits `dataProjection: failed`; it is not recast as transport failure. Projection retry occurs only through the verified not-ready readiness-recovery path; no automatic loop or public `retryProjection()` is proposed.

Framework adapter ordering is adapter-specific and must preserve its current conventions. Do not claim that React callback ordering equals Vue/Svelte event ordering. Within each adapter, configuration and listeners must be ready before the initial remote request can be emitted, and an adapter must deliver each core request exactly once to its documented host-facing channel(s).

## 3. Resource outcomes, pagination, exhaustion, and retries

### Normative carry-forward

- Page and cursor pagination are mutually exclusive per generation. Page mode starts a remote/hybrid query at `firstPage` (default `1`); cursor mode starts with no cursor and ordinal `1`. Legacy mode keeps its existing first `loadMore` signal of `initialPage + 1` (normally page 2).
- The host accumulates pages and supplies a full replacement snapshot. The component does not infer page size, append, cache, preload, or deduplicate.
- `succeeded` means a record-bearing nonterminal response (`hasMore: true`); `exhausted` means the server confirmed termination (`hasMore: false`) and includes the final full snapshot, even when empty. `empty` is nonterminal and must explicitly say whether the position advances or is retried.
- Failed, cancelled, stale, malformed, and retry-empty completions do not consume the current page/cursor position. Retry is a fresh request ID at the same eligible position, with no automatic retry loop.
- Empty, failed, and host-cancelled requests disarm a continuously visible sentinel. Automatic retry requires a real non-intersecting → intersecting transition; explicit manual activation is a separate trigger.
- Bounded exact cursor history and token-size limits are part of the accepted internal Phase 2D policy. Resource-limit outcomes are not server exhaustion and must not be translated into `hasMore: false`.

### Ratified design: preserve the accepted Phase 2D bounds without broadening public policy

The first public implementation should use the accepted Phase 2D defaults and hard caps unless review explicitly changes them: maximum cursor ordinal defaults to 256 with a hard cap of 4,096; string cursor tokens default to 1,024 UTF-8 bytes with a hard cap of 4,096. Cursor values remain finite numbers or strings; applications encode compound tokens themselves. Exact history is retained for the active pagination epoch—no LRU eviction or lossy hash substitutes for token identity.

Two resource-limit outcomes stay distinct:

| Condition | Proposed observable result | Data/request effect |
| --- | --- | --- |
| Next cursor exceeds token byte limit | Completion result `resource-limit`, plus `cursor-token-size` diagnostic | Keep request active/busy and all data/position/history unchanged; host can correct the token on the same active ID or report true server exhaustion only if confirmed. |
| Accepted continuation reaches the fixed public cursor-depth boundary | Completion can be accepted, snapshot/position committed, then status becomes `resource-limited` with `cursor-depth` reason | Settle current request but do not dispatch beyond the bound; retain `hasMore: true`. Since cursor-policy overrides are not in the first public config, this is terminal for that query epoch; a new query resets history but does not claim server exhaustion. |

Cursor-depth `resource-limited` is terminal for public load-more requests in the current query generation, not evidence of server exhaustion. `hasMore` remains `true`, the accepted continuation and exact cursor history remain committed, and the current request is settled. A manual load-more attempt after the limit creates no request and leaves the state `resource-limited`. An observer attempt while the sentinel remains visible is blocked; an actual exit/re-entry rearms the observer state but still cannot create an over-limit request. Reconnect alone does not clear the condition. Under this proposal no public cursor-limit override exists, so a consumer-visible reset requires a new query or an accepted mode/protocol transition that Phase 2A defines as starting a new query generation; that generation resets its pagination history and can begin at the initial position. Phase 2D permits a local policy increase followed by a fresh explicit trigger; that remains an internal/administrative policy operation, not a public escape hatch in this contract. Any future public limit adjustment requires a separate contract decision. Neither reset changes the meaning of server `hasMore` for the old generation or converts the old resource-limit outcome into `exhausted`.

The API must make retry explicit and bounded. No retry/backoff policy is owned by Smilodon. After transport failure, cancellation, or `empty: retry`, a genuine manual trigger or eligible observer transition may create a new request at the unchanged position. There is no public `retry()` method in this proposal. Cursor-depth `resource-limited` is distinct: the first public increment has no policy-override method, so it cannot be manually bypassed. Any later host-controlled retry/limit-override trigger needs a separate contract and cannot introduce a second request authority.

Grouped remote completion is intentionally unspecified. The proposed completion accepts the flat item snapshots used by the Phase 2A contract. If grouped pages are a requirement, define whether group boundaries merge/replace and how stable identity and selection reconcile before extending the completion type.

## 4. Readiness, lifecycle, projection, and cleanup

### Normative carry-forward

- Initial acknowledged dispatch waits for an explicit readiness boundary after effective adapter props/config and listeners are installed. Custom-element `connectedCallback()` alone is not proof that framework listeners are ready. One initial request is emitted per connection/generation; repeated same-value config updates are no-ops.
- Disconnect synchronously invalidates active IDs before cancellation notification, tears down observer ownership, and releases component-owned references/listeners. A late response cannot be accepted.
- On reconnect, the same accepted snapshot and selection identity are retained. A pending initial remote search is reissued with a fresh generation/ID at the initial page/cursor; a pending load-more position is not consumed and waits for a fresh explicit trigger or sentinel exit/re-entry.
- Coordinator acceptance precedes projection. The accepted coordinator snapshot is canonical. Staging, registry publication, rendering, ARIA synchronization, and scroll restoration follow the Phase 2D order. A projection failure does not roll back accepted data or fabricate transport failure; retry reads canonical state and is idempotent.
- During an interrupted projection, the latest user query is retained as pending intent, not silently discarded. It is dispatched once after projection recovery; repeated typing coalesces to the last query, and disconnect/reconnect preserves that intent.
- Selection and active identity are semantic state and do not disappear solely because records are absent from one query/page snapshot.

### Ratified design: ownership and controlled-state rules

**D04 proposed resolution — coordinator owns request busy; external loading is additive presentation.** The coordinator is authoritative for acknowledged request status and projection lock. An adapter-provided `loading` prop cannot settle/cancel a request or clear the coordinator's busy state. The effective accessibility busy flag is `coordinatorBusy || externalLoading`; visual loading may reflect either source, but only coordinator transitions affect the request lifecycle. Legacy-mode behavior for `loading` remains unchanged.

On React unmount, Vue scope disposal, and Svelte component destruction, adapters close readiness and detach adapter-owned listeners as part of teardown. Where the element remains connected because a framework moved rather than destroyed a node, the adapter must not synthesize disconnect or duplicate initial requests. Reconnect semantics follow the custom element's actual lifecycle and the accepted Phase 2E contract. Core invalidates pending identity on actual disconnect even if adapter listeners have already detached; cancellation notification is best-effort and is not the only host cleanup mechanism. Host applications should abort their own outstanding controllers on their owner/component teardown and must tolerate late stale completion. Vanilla currently returns the element from `createSelect()` and has no helper disposer. **D09 proposed resolution:** add `disposeSelect(element): void`, idempotently detaching only listeners installed by `createSelect()`/`initSelect()` and preventing subsequent helper callbacks. The helper owns only the listeners and callback closures it registered for that element; it does not own the element's unrelated listeners or the core coordinator. Repeated `initSelect(element, options)` replaces the previous helper-owned listener set before installing one set for the latest options, rather than stacking duplicate handlers. `disposeSelect(element)` removes that set and releases its callback references; repeated disposal is a no-op. A later `initSelect()` may install a fresh single set. Neither operation removes the element, settles/cancels a core request, nor changes item/selection state. If the caller wants core disconnect cancellation, the caller removes the element separately; the custom element's normal disconnected lifecycle invalidates the request. No public core `dispose()` is proposed.

No adapter may retain request controllers, completion state, or duplicate page/cursor history as an alternate source of truth. Host application code may retain its own `AbortController` per ID; cancellation removes that mapping idempotently. Late callback/bridge replies after unmount or disconnect are ignored by the core identity check.

## 5. Adapter mapping and conformance

### Shared parity rule

The public core request/completion types and semantics are authoritative. Each adapter must preserve current leading arguments, payload conventions, controlled-value behavior, and `config` precedence while adding the same request ID, generation, position, completion, and cancellation semantics. An adapter cannot independently infer `hasMore`, advance a cursor, settle loading from a promise, or accept stale responses.

| Surface | Existing convention to preserve | Proposed additive mapping |
| --- | --- | --- |
| Core custom element | `CallbackConfig.onSearch(query)` and `onLoadMore(page)`; bubbling/composed `search` and `loadMore` `CustomEvent`s have `{query, results?, count?}` and `{page, items}` respectively; core event precedes configured callback | Core callback types become `(query, request?)` and `(page, request?)` (both return `void`); events keep every existing field and add `request?`; events `dataRequestCancel`, `dataProjection`, `dataLoadingConfigError`; methods `updateConfig(SelectInstanceConfig): void`, `startDataLoading(): void`, `getDataLoadingState(): DataLoadingStateSnapshot`, and `completeDataRequest(completion): DataRequestCompletionResult`. |
| React | `onSearch(query, results?, count?)`, `onLoadMore(page): void | Promise<void>` callbacks; `ref` handle; controlled `value` / uncontrolled `defaultValue` | `config?: SelectInstanceConfig`; callbacks `onSearch(query, results?, count?, request?)`, `onLoadMore(page, request?): void | Promise<void>`, `onDataRequestCancel(detail)`, `onDataProjection(detail)`, `onDataLoadingConfigError(detail)`; handle exposes `updateConfig(config)`, `getDataLoadingState()`, and `completeDataRequest(completion)`. |
| Vue 3 | `modelValue`/`v-model`; emits `search(query)` and `loadMore(page)` as component events; `defineExpose` methods | `config?: SelectInstanceConfig`; emits `search(query, request?)`, `loadMore(page, request?)`, and each of `dataRequestCancel(detail)`, `dataProjection(detail)`, `dataLoadingConfigError(detail)`; `defineExpose` includes `updateConfig(config)`, `getDataLoadingState()`, and `completeDataRequest(completion)`. These are Vue emits, not raw DOM event objects. |
| Svelte | `bind:value`; component events whose payload is in `event.detail`; current search/load-more details are `{query}` and `{page}` | `config?: SelectInstanceConfig`; add `request?` to those exact detail objects; dispatch remaining event details with the exact core types; export `updateConfig(config)`, `getDataLoadingState()`, and `completeDataRequest(completion)`. |
| Vanilla | `createSelect`/`initSelect` helpers and callbacks `onSearch(query)`, `onLoadMore(page)`; requires core registration first; grouped helper input is `{group, items}` | Options `config?: SelectInstanceConfig`; append callbacks `onSearch(query, request?)`, `onLoadMore(page, request?)`, plus cancellation/projection/config-error callbacks; helpers `updateConfig(element, config)`, `startDataLoading(element)`, `getDataLoadingState(element)`, `completeDataRequest(element, completion)`, and idempotent `disposeSelect(element)`. `createSelect()`/`initSelect()` invoke readiness only after helper callbacks are installed. Preserve Vanilla's grouped-input conversion boundary. |

The callback and imperative signatures below make the mapping explicit. `SelectItem` is the existing adapter item type; the core request/result/event types are proposed exports from `@smilodon/core`.

```ts
// React props additions; source baseline is query/results/count and page.
interface ReactAcknowledgedProps {
  config?: SelectInstanceConfig;
  onSearch?: (
    query: string,
    results?: SelectItem[],
    count?: number,
    request?: SearchDataRequest,
  ) => void;
  onLoadMore?: (page: number, request?: LoadMoreDataRequest) => void | Promise<void>;
  onDataRequestCancel?: (detail: DataRequestCancelNotification) => void;
  onDataProjection?: (detail: DataProjectionEventDetail) => void;
  onDataLoadingConfigError?: (detail: DataLoadingConfigErrorDetail) => void;
}
interface ReactAcknowledgedHandle {
  updateConfig(config: SelectInstanceConfig): void;
  getDataLoadingState(): DataLoadingStateSnapshot;
  completeDataRequest(completion: DataRequestCompletion): DataRequestCompletionResult;
}

// Core callbacks are different from Vue emits. Vue's source baseline is
// search(query) and loadMore(page), so metadata is appended to each emit.
interface VueAcknowledgedEmits {
  search: (query: string, request?: SearchDataRequest) => void;
  loadMore: (page: number, request?: LoadMoreDataRequest) => void;
  dataRequestCancel: (detail: DataRequestCancelNotification) => void;
  dataProjection: (detail: DataProjectionEventDetail) => void;
  dataLoadingConfigError: (detail: DataLoadingConfigErrorDetail) => void;
}
interface VueAcknowledgedExposed {
  updateConfig(config: SelectInstanceConfig): void;
  getDataLoadingState(): DataLoadingStateSnapshot;
  completeDataRequest(completion: DataRequestCompletion): DataRequestCompletionResult;
}

// Svelte's source baseline uses detail objects; preserve each old field and add
// optional request metadata rather than changing event argument positions.
type SvelteSearchDetail = { query: string; request?: SearchDataRequest };
type SvelteLoadMoreDetail = { page: number; request?: LoadMoreDataRequest };
type SvelteDataRequestCancelDetail = DataRequestCancelNotification;
type SvelteDataProjectionDetail = DataProjectionEventDetail;
type SvelteDataLoadingConfigErrorDetail = DataLoadingConfigErrorDetail;
// Svelte component instance exports:
export function updateConfig(config: SelectInstanceConfig): void;
export function getDataLoadingState(): DataLoadingStateSnapshot;
export function completeDataRequest(
  completion: DataRequestCompletion,
): DataRequestCompletionResult;

// Vanilla's helper callbacks are query/page only today; append metadata second.
// Core must be registered before use.
interface VanillaAcknowledgedOptions {
  config?: SelectInstanceConfig;
  onSearch?: (query: string, request?: SearchDataRequest) => void;
  onLoadMore?: (page: number, request?: LoadMoreDataRequest) => void;
  onDataRequestCancel?: (detail: DataRequestCancelNotification) => void;
  onDataProjection?: (detail: DataProjectionEventDetail) => void;
  onDataLoadingConfigError?: (detail: DataLoadingConfigErrorDetail) => void;
}
interface CreateSelectOptions extends VanillaAcknowledgedOptions { /* existing create options */ }
interface InitSelectOptions extends VanillaAcknowledgedOptions { /* existing init options */ }
declare function updateConfig(element: HTMLElement, config: SelectInstanceConfig): void;
declare function startDataLoading(element: HTMLElement): void;
declare function getDataLoadingState(element: HTMLElement): DataLoadingStateSnapshot;
declare function completeDataRequest(
  element: HTMLElement,
  completion: DataRequestCompletion,
): DataRequestCompletionResult;
declare function disposeSelect(element: HTMLElement): void;
```

Vue's template listener spelling should be documented in kebab case for events that include camel case (`@data-request-cancel`, `@data-projection`, `@data-loading-config-error`), while the declared emitted names remain camel case. Svelte uses `on:dataRequestCancel`, `on:dataProjection`, and `on:dataLoadingConfigError`; each handler reads the typed value from `event.detail`. These exact casing rules must be confirmed against the supported framework versions in real adapter tests.

When both an adapter event and callback are subscribed for one logical request, both may receive the same immutable identity, but one is transport owner. Documentation must show a single-channel example and a deduplication pattern for consumers intentionally using both. Request notification is not itself acknowledgment. Promise returns from existing callbacks remain ignored for compatibility; only explicit completion settles.

**D05 proposed resolution — one core cancellation shape, framework-native names.** Core emits `dataRequestCancel` with exactly `DataRequestCancelNotification`. React calls `onDataRequestCancel(detail)`. Vue emits `dataRequestCancel(detail)` (documented template listener spelling `@data-request-cancel`). Svelte dispatches `dataRequestCancel` with that detail as `event.detail`. Vanilla calls `onDataRequestCancel(detail)` and leaves the core DOM event available. No adapter changes the reason vocabulary or creates another cancellation ID.

**D06 proposed resolution — optional request context.** Request metadata is optional in TypeScript on every legacy-capable callback/event because protocol selection is runtime configuration and must not break existing function assignability. In acknowledged mode it is present for request-bearing notifications. Preserve the source-traced per-surface contract: core appends after `query` or `page` (core callbacks do not have React's result/count args); React search appends after `query, results, count` and React load-more after `page` while retaining its promise return type; Vue appends an optional emit argument after `query`/`page`; Svelte adds an optional `request` field to the existing `{query}`/`{page}` detail; Vanilla appends after `query`/`page`. Completion is typed and explicit; no callback-return inference is allowed.

**D07 proposed resolution — grouped remote pagination deferred.** The first public completion accepts flat `items` only. `setGroupedItems()` remains unchanged and is not an acknowledgment. No group merge, page boundary, or grouped stable-identity behavior is promised until a separate contract defines atomic grouped snapshots.

**D08 proposed resolution — initial support claim is four adapters only.** React, Vue, Svelte, and Vanilla are the proposed first adapter set. Solid and React Native (including WebView/native parity) are explicitly deferred and must not receive a support/parity claim from these tests. Supporting either requires a separate design/scope and platform evidence.

**D09 proposed resolution — Vanilla cleanup is additive and non-destructive.** `disposeSelect(element): void` is idempotent, detaches helper-installed listeners and releases their callback closures, and does not remove the element, call `completeDataRequest`, or cancel the core request. The helper owns only its own registrations, not unrelated listeners or the custom element's coordinator. Repeated `initSelect(element, options)` replaces the helper's prior listener set with exactly one set for the latest options; after disposal, a later `initSelect()` can install a fresh single set. Neither initialization nor disposal changes item/selection state or removes the element. The caller removes the element separately when it intends to trigger normal custom-element disconnect cleanup.

The first authorized implementation, if later approved, should proceed one adapter at a time: core public facade/types; React; Vue; Svelte; Vanilla; then a cross-adapter conformance pass. This ordering is a proposal, not current implementation authorization. Solid and React Native require separate scope and compatibility evidence; no parity statement covers them here.

### Minimum conformance evidence per adapter

Each adapter must demonstrate: listener-before-initial-dispatch readiness; one initial request; preservation of current first callback/event arguments; identical request identity across channels; completion forwarding; stale/duplicate rejection; cancellation and unmount cleanup; existing global legacy-config/prop/instance-config/runtime precedence; per-instance `config.dataLoading` precedence; controlled/uncontrolled selected-value parity; page-size defaults; and unchanged legacy-mode behavior. No test should imply that global acknowledged defaults are supported in this increment. Browser tests are required for actual lifecycle/render/ARIA effects. React Native bridge serialization and native-device behavior are outside this proposal's four-adapter scope.

## Observable acceptance criteria

These are proposed gates for a future implementation authorization. They are not tests claimed to have run as part of this design-only work.

| ID | Observable criterion |
| --- | --- |
| C1 — Legacy isolation | Default config produces no acknowledged request metadata. Source-traced callback positions/returns and event fields in the compatibility inventory remain unchanged: core `(query)` / `(page)`, React `(query, results?, count?)` / `(page)` with its existing `void | Promise<void>` load-more return, Vue `search(query)` / `loadMore(page)`, Svelte `{query}` / `{page}` details, Vanilla `(query)` / `(page)`. Preserve defaults, event/callback order, page-2 first legacy signal, `setItems()` replacement, and adapter value/grouped conventions. |
| C2 — Atomic config | Existing global config precedence remains unchanged, but global `dataLoading` is unavailable. Per-instance precedence resolves exactly as documented. Cover every D02 transition: invalid initial acknowledged config keeps readiness closed/no fallback; invalid update after valid active config preserves that config/request; unrelated valid fields still apply; page-size changes affect only future fallback limits; repeated equal invalid rerenders emit no duplicate error, while a changed invalid transition emits exactly one. `validateDataLoadingConfig()` returns typed issues. |
| C3 — Identity/order | One intent creates one unique ID/generation/position snapshot. Core event precedes callback; both have the same immutable context once. Duplicate triggers while pending create no second request. |
| C4 — Completion | Correct current completion synchronously returns `accepted` after canonical commit. Stale, unknown, duplicate, malformed, contradictory, and cursor-token-size-limited completions do not mutate protected data/request state. Cursor-depth completion is accepted, commits its valid snapshot/position, and `getDataLoadingState()` exposes terminal-for-generation `resource-limited`. Every accepted completion projects from canonical coordinator state; the notification retains request ID/generation and distinguishes failed then successful recovery attempts without re-accepting data. If disconnect interrupts projection after acceptance, it emits no `dataRequestCancel` for that settled request solely for projection interruption; any separate active request follows the cancellation contract. Recovery preserves the accepted request ID/generation and never re-emits its original request notification or accepts its completion again. Success notification follows core busy clearing and effective `aria-busy` synchronization; external loading may keep ARIA busy true. A malformed completion leaves a corrected retry possible only while that ID remains active. Returned state snapshots are detached; mutation cannot affect later snapshots/coordinator state. |
| C5 — Pagination | Page and cursor modes start/progress exactly per Phase 2A. Failure/cancel/retry-empty do not consume position; exhaustion alone ends server data; repeated cursors and no-progress pages cannot loop. Cursor-depth and token-size limits match Phase 2D and preserve truthful `hasMore`. At depth limit, manual and sentinel triggers create no request in the same generation; reconnect does not clear it; new query resets history; any policy increase remains outside the public API and requires a later explicit eligible trigger. |
| C6 — Search and selection | A→B out-of-order completion rejects A. Remote/hybrid semantics match Phase 2A. Filtering/page absence does not erase selected identity. Query clear dispatches the documented empty remote query. |
| C7 — Lifecycle/projection | Listener readiness prevents lost initial requests; repeated calls before/while connected do not duplicate; invalid config cannot latch readiness; after disconnect, start must be called again after reconnection/listener setup; disconnect invalidates each still-active request before its cancellation notification, but does not emit `dataRequestCancel` for a request already accepted and settled merely because its projection was interrupted. Reconnect recovers canonical accepted projection before readiness opens, with the original accepted request ID/generation; recovery does not re-emit the original search/load-more request notification or accept its completion again. A query entered during the lock does not advance generation until projection recovery; only the latest query dispatches once, after the old request's projection notification. Adapter cleanup is idempotent, including Vanilla listener replacement/disposal/reinitialization. |
| C8 — Adapter parity | React, Vue, Svelte, and Vanilla real-wrapper tests use the source-traced signature inventory and append request context without replacing arguments or detail fields. Their conventions remain framework-native while shared protocol semantics and request identity agree. |
| C9 — Scope claims | No built-in transport, cache, implicit append, grouped pagination, Solid/RN parity, viewport-windowing, WCAG, or production-readiness claim is made without separate evidence. |

The core matrix must include deterministic concurrency and malformed-input tests. Adapter tests must use real wrappers, not only manually constructed core events. Browser verification must cover disconnect/reconnect, readiness, visible sentinel rearm, mounted target/ARIA synchronization, and projection recovery. A full cross-browser matrix is selected by the release-quality policy for the implementation's changed scope; a core-only pass cannot certify adapter parity.

## Compatibility risks requiring explicit review

| Risk | Why it matters | Mitigation/decision gate |
| --- | --- | --- |
| Existing global config is cloned through JSON serialization | Function-bearing values can be lost; new serializable config may mask or expose this behavior | Global `dataLoading` is deferred; characterize before exposing it. Do not bundle an unrelated config-manager rewrite into Phase 2F. |
| Different adapter defaults and precedence | An identical config can have different effective `pageSize`, placeholder, placement, and rendering behavior | Preserve defaults and assert each adapter's resolved request limit. Explicit `config` remains above convenience props. |
| Existing callback return types vary | React permits `onLoadMore` promises; other adapters do not share that contract | Promise resolution remains non-authoritative. Explicit completion is the only acknowledgment. |
| Existing event payload conventions differ | Vue/Svelte expose component events; Vanilla and React callbacks have different shapes | Add request metadata without replacing current payload or first args; document per-adapter mapping. |
| Legacy page numbering is surprising | Default legacy load-more first emits page 2 | Keep in legacy mode; acknowledged remote first-page uses `firstPage` and starts at 1. Never unify by silently changing old behavior. |
| Remote result snapshots replace, not append | Hosts may expect the component to append or dedupe pages | Require full accumulated snapshots and test replacement/selection reconciliation. |
| `setItems()` historically influences busy state | Reinterpreting it globally as completion would affect existing applications | Acknowledged completions use the explicit method; legacy `setItems()` remains unchanged. |
| `loading` exists in adapter props | It can compete with component request busy state | Coordinator owns request status; external loading is presentation-only and composes into `aria-busy` with logical OR. Test this in each adapter. |
| Public export and semver implications | New types/methods are public support obligations; 1.11.x is the accepted target direction, not a released authorization | Keep this contract separate from release/version decisions; require package-entry and API-doc review. |
| Vanilla registration and grouped input differ | Helper creation invokes custom-element methods immediately; its group shape differs | Preserve explicit core registration requirement and `{group, items}` helper input. |

## D01–D09 design decisions ratified at Contract Review 003

The table incorporates the Contract Review 001 direction and Review 002 corrections. Contract Review 003 ratified all nine decisions as the design baseline; the rationale remains recorded so implementation can follow the accepted behavior without silently inheriting an assumption.

| ID | Topic | Ratified design decision | Rationale / observable rule |
| --- | --- | --- | --- |
| D01 | Completion timing | Synchronous `completeDataRequest()` reports canonical coordinator acceptance; `getDataLoadingState()` exposes current lifecycle/resource outcome; separate `dataProjection` event reports projection completion/failure for each accepted completion. | Match Phase 2E: accepted snapshot is canonical; all accepted outcomes use canonical projection; readiness recovery, not a scheduled automatic retry loop, retries after failure. The event preserves request ID/generation and attempt. `complete` follows core-busy clearing and final effective ARIA synchronization. |
| D02 | Invalid configuration | Export pure typed `validateDataLoadingConfig()`. Reject only the invalid merged `dataLoading` subconfiguration; keep `updateConfig()` void; emit one `dataLoadingConfigError` on transition to each distinct invalid candidate, deduplicating equal framework rerenders until a valid candidate is accepted. | Initial invalid acknowledged config keeps readiness closed with no legacy fallback. A prior valid protocol/request remains active on later invalid updates. Valid unrelated config fields apply; active request snapshots stay immutable. Table above specifies page-size fallback and diagnostic reset cases. |
| D03 | Global configuration | Defer global `dataLoading` in the first public increment. Support it only in per-instance `config`; characterize the global clone/merge path before any later global exposure. | The present global config path uses JSON serialization and has a known function-preservation risk. Do not claim global acknowledged defaults until a focused test proves preservation/precedence. |
| D04 | Busy-state ownership | Coordinator owns request/projection busy. External adapter `loading` is presentation-only; effective `aria-busy` is the logical OR of coordinator busy and external loading. | External presentation cannot settle or clear a request; legacy loading behavior remains unchanged. |
| D05 | Cancellation notification | Standard core event `dataRequestCancel` with exact `DataRequestCancelNotification`; map to React/Vanilla callbacks, Vue emit, and Svelte event using the same reason values. | One typed identity and cancellation vocabulary across all surfaces; cancellation stays best-effort and never implies error. |
| D06 | Request-context typing | Keep request context optional in legacy-capable callbacks and event payloads; provide it only when acknowledged protocol creates a request. Preserve exact source-traced signature per surface and append metadata after every current argument/field. | Existing handlers remain assignable and legacy events remain unchanged. Core is query/page only; React search retains query/results/count and load-more's promise return; Vue emits query/page; Svelte retains detail shapes; Vanilla callbacks remain query/page. |
| D07 | Grouped remote data | Defer grouped pagination. The first completion accepts flat full-snapshot `items` only; `setGroupedItems()` is not acknowledgment. | Avoids inventing group merge/boundary semantics without atomic identity and selection rules. |
| D08 | Initial adapter scope | Limit first support claim to React, Vue, Svelte, and Vanilla. Solid and React Native are explicitly deferred pending separate scope and certification. | Prevents core/four-adapter tests from being generalized to untested adapters or RN WebView/native behavior. |
| D09 | Vanilla cleanup | Add idempotent `disposeSelect(element)`: detach and release only helper-owned listeners/callbacks; do not remove the element or settle/cancel core requests. Repeated `initSelect()` replaces the prior helper listener set; initialization after disposal installs exactly one fresh set. | Makes ownership explicit: helper listeners cannot accumulate, unrelated/core listeners remain untouched, and disposal does not add a second request lifecycle. |

### Ratified migration guarantees

- Existing consumers remain in `legacy` mode unless they set `config.dataLoading.protocol: 'acknowledged'`; no automatic opt-in based on `searchable`, `infiniteScroll`, callbacks, or returned promises.
- Existing callback leading arguments, event names/details, callback/event order, adapter defaults, controlled-value conventions, and `setItems()` replacement semantics remain unchanged in legacy mode.
- Existing callbacks that return promises continue to work as before, but those promises never acknowledge either legacy or acknowledged requests. Migrating consumers explicitly call `completeDataRequest()` with a request ID/generation.
- Legacy `initialPage` numbering stays as characterized (default first load-more page is `2`). Acknowledged remote page search starts at `firstPage` (default `1`); this is an opt-in semantic difference and must be highlighted in migration docs.
- Hosts provide the full accumulated snapshot on `succeeded`/`exhausted`; changing from legacy `setItems()` calls to acknowledgment does not imply that the component starts appending or deduplicating.
- The first public increment has per-instance `config.dataLoading`, not `configureSelect()` global data-loading defaults. Existing adapter `pageSize` defaults still determine fallback `fetchLimit`; the resolved value is recorded in every request.
- Consumers listening through both event and callback channels choose one as transport owner or deduplicate using `requestId`.
- The first release claim is limited to React, Vue, Svelte, and Vanilla. Grouped remote results, Solid, React Native Web, and RN native WebView are deferred and documented as such.

### Conformance and compatibility matrix with accountable roles

Accountability is assigned by engineering role because no individual maintainers/testers were named in the directive. Named assignees must be recorded in the later implementation authorization; role ownership does not imply that anyone has already been assigned.

| ID | Accountable role | Applies to | Required evidence and pass oracle |
| --- | --- | --- | --- |
| C1 — Legacy isolation | Core maintainer + each adapter maintainer | Core, React, Vue, Svelte, Vanilla | Paired legacy fixture confirms exact existing payloads/leading callback args/order, defaults, page-2 first signal, grouped shapes, and `setItems()` behavior; no acknowledged metadata is present. |
| C2 — Config/validation | Core config maintainer; adapter maintainer per wrapper | Core and all four adapters | Precedence fixture matches documented source order; global `dataLoading` is rejected/not typed in this increment; invalid config returns validator issues, emits one error notification, leaves previous dataLoading config intact, and emits no request. |
| C3 — Request identity/order | Core coordinator maintainer; adapter maintainer per wrapper | Core and all four adapters | One intent has one immutable ID/generation/position; core event precedes callback; callback/event channels carry same ID once; duplicate trigger while pending creates no second request. |
| C4 — Completion/projection | Core component maintainer; test/QA owner | Core browser path and adapter completion handles | Synchronous method result distinguishes accepted/stale/unknown/invalid/resource-limit; `dataProjection` event occurs only after snapshot projection or reports failure; completion and projection attempt do not double-apply items. |
| C5 — Pagination/resource limits | Core coordinator maintainer; test/QA owner | Core plus each adapter's request forwarding | Page/cursor transitions, retry/no-progress, exhaustion, exact cursor history, token-size/depth outcomes, and truthful `hasMore` match Phase 2A/2D. |
| C6 — Search/selection | Core semantic-state maintainer; adapter maintainers | Core and all four adapters | A→B late A response is stale; remote/hybrid semantics match Phase 2A; absent rows do not clear selected identity; query clear requests exact empty query. |
| C7 — Lifecycle/cleanup | Core lifecycle maintainer; one adapter maintainer per wrapper | Core and all four adapters | Listener-ready initial dispatch once; disconnect invalidates before notify; reconnect fresh generation; recovery and latest-query coalescing pass; adapter cleanup is idempotent; Vanilla `disposeSelect()` detaches without removing element. |
| C8 — Adapter parity | Maintainer for each named adapter; cross-adapter test owner | React, Vue, Svelte, Vanilla | Real mounted adapter tests prove native event/callback mapping, controlled/uncontrolled values, config precedence, page-size fallback, completion forwarding, and unchanged legacy behavior. |
| C9 — Scope/documentation | API-doc owner + release reviewer | Public exports/docs and release candidate | Docs identify per-instance opt-in, page-number difference, host accumulation, no built-in transport/grouped pages, four-adapter scope, and separate Solid/RN/viewport/accessibility limits; package exports match the frozen contract. |

The matrix's expected automated evidence is deterministic coordinator/component tests plus each adapter's real contract suite; browser runs cover readiness, disconnect/reconnect, sentinel rearm, projection, ARIA, and cleanup. Named human owners, concrete workflow contexts, and manual/accessibility responsibilities remain to be assigned by the later implementation directive; this contract does not claim those assignments or sign-offs have occurred.

### Contract ratification and implementation-handoff status

Contract design is ratified. This tracker records that disposition separately from the still-gated implementation work.

| Work item | Status |
| --- | --- |
| D01–D09 decisions and rationale | Ratified by Contract Review 003; frozen design baseline. |
| Public config/types and core signatures | Ratified as design signatures; not current exports or implementation. |
| Four-adapter event/callback mapping | Ratified for React, Vue, Svelte, and Vanilla; implementation and framework tests remain unauthorized/pending. |
| Resource limits, retry, and busy ownership | Ratified, including projection recovery and cancellation boundaries. |
| Migration guarantees and compatibility criteria | Ratified; C1–C9 are accepted implementation gates. |
| Named implementation owners and concrete CI contexts | Pending a separate implementation directive; role ownership is not an assignment. |
| Contract review and freeze | Complete — Contract Review 003. |

## Phase 2F contract-design exit decision

Contract Review 003 satisfies the design-ratification gate: it accepts D01–D09, the exact proposed core signatures and four-adapter mappings, invalid-configuration behavior, resource-limit semantics, compatibility/migration requirements, and C1–C9 as observable implementation gates. Named owners, concrete CI contexts, and manual evidence assignments remain implementation-planning work, not outstanding contract-ratification findings.

The contract is ratified and frozen as a design target; it does not itself authorize implementation. A separate directive must define permitted files, sequence, verification gates, named owners, review controls, and any adapter exclusions. Phase 2F implementation and public API changes remain **not authorized**; repository governance remains **open** pending administrator enforcement; Phase 4 replication integrity remains separate and open; production viewport virtualization remains **NO-GO**.
