# Phase 2D — Integration Readiness and Resource Policy

Related records: [approved Phase 2A search/pagination contract](./PHASE-2A-SEARCH-PAGINATION-CONTRACT.md), [Phase 2C coordinator hardening](./PHASE-2C-COORDINATOR-INTEGRATION-PREP.md), [Phase 1 characterization](../../packages/core/tests/phase-1-search-pagination-characterization.spec.ts), and [coordinator contract tests](../../packages/core/tests/data-loading/request-coordinator.spec.ts).

## Status and boundary

Phase 2D is accepted and closed. The internal coordinator has deterministic cursor resource-limit and sentinel-transition behavior, and this document records the reviewed readiness, projection, and sentinel contracts. Phase 2D itself did not change `EnhancedSelect`, framework adapters, public types, or package exports. Phase 2E separately authorizes a private, test-gated integration in the core component only.

No legacy behavior, public API, package version, production virtualization setting, or adapter is changed by Phase 2D. The resource settings below remain internal coordinator controls and must not be advertised as 1.x component configuration unless a later public API decision explicitly maps and tests them.

## 1. Bounded exact cursor history

The coordinator retains every accepted cursor exactly for the active pagination epoch. It does not use LRU eviction or a lossy hash in place of token identity. A new query or protocol-defining configuration change clears the epoch; disconnect/reconnect with the same accepted query preserves it.

The internal policy is:

| Setting | Default | Allowed internal range | Definition |
| --- | ---: | ---: | --- |
| `maxCursorPages` | 256 | 1–4,096 | Maximum cursor request ordinal in one query epoch. The initial remote request is ordinal 1 and counts toward the limit. |
| `maxCursorTokenBytes` | 1,024 | 1–4,096 | Maximum UTF-8 byte length of one string or finite-number cursor, measured after `String(cursor)`. |

Both values are validated as positive safe integers. The hard maxima cap retained token payload at 16 MiB UTF-8 per coordinator (`4,096 × 4,096` bytes), across at most 4,096 exact set entries. Even with two-byte UTF-16 storage, cursor character data is at most 32 MiB; string headers and `Set` bookkeeping add engine-dependent overhead per entry, with the entry count itself bounded. This is a per-coordinator bound, not a process-wide budget. Defaults are deliberately lower than the hard maxima and can be adjusted only within those maxima.

An empty page with `advance: 'retry'` does not advance the ordinal or add history. Retrying the same cursor therefore does not consume another page slot. A valid `succeeded` completion or `empty` completion with `advance: 'next'` adds exactly one new cursor only after request identity, generation, payload, size, and exact-cycle checks pass.

### Observable limit outcomes and recovery

| Limit | Completion/request result | State effect | Recovery |
| --- | --- | --- | --- |
| Next cursor exceeds `maxCursorTokenBytes` | `completeDataRequest()` returns `resource-limit`; snapshot reason is `cursor-token-size` | The current request stays active and busy. Items, `hasMore`, eligible position, and exact history do not change. Only diagnostic `resourceLimit` metadata is added. It is not accepted as success or exhaustion. | The host may resubmit a corrected shorter cursor against the same active request ID; increase `maxCursorTokenBytes` within the hard maximum and resubmit; or report `exhausted` only if the server actually confirmed exhaustion. A valid later completion clears the diagnostic. |
| The accepted next position would exceed `maxCursorPages` | Current completion returns `accepted`; snapshot status is `resource-limited` with reason `cursor-depth` | The current page and exact next cursor are committed, the active request settles, `hasMore` remains `true`, and no further cursor request is emitted at the cap. The server is not reported exhausted and history is not discarded. | Raise `maxCursorPages` to include the next ordinal, then explicitly request manually or observe a genuine sentinel exit/re-entry. Raising the cap does not automatically dispatch. |

The token-size limit is checked on each completion using the current effective local policy. A non-protocol policy update does not cancel or replace the active request. A depth limit prevents creation of a new over-limit cursor request; a request already dispatched before a policy reduction may settle, after which the next position remains visibly resource-limited. A depth-policy increase re-enables an eligible position without clearing cursor history. Repeated invalid/oversized completion attempts do not commit data or grow the cursor set.

These resource outcomes are not host completion statuses. Hosts continue to report only the actual transport result (`succeeded`, `empty`, `exhausted`, `failed`, or `cancelled`). In particular, `hasMore: false` is reserved for an actual exhaustion completion.

## 2. Dispatch readiness and initial-request uniqueness

The coordinator's `connect()` is idempotent while connected, but it cannot know when a framework has installed its listeners or resolved adapter props. A future facade must therefore provide a readiness boundary and must not use custom-element connection alone as permission to emit the initial acknowledged request.

The integration contract is:

1. Construct/upgrade the element and resolve the existing precedence chain: core defaults → global configuration → adapter convenience props → explicit adapter `config` → later imperative updates.
2. Install the event listener and callback channels that will receive requests. At least one host transport channel must be ready before remote mode can dispatch.
3. Publish one complete effective acknowledged configuration snapshot to the coordinator.
4. Open the component's private dispatch gate and call `connect()` once. Initial search is an intent held behind that gate, not work sent from an early `connectedCallback()`.
5. Route each returned request through the already-installed channels, using the same immutable request ID for event and callback. One designated host channel owns transport; the other channel is notification only or deduplicates by request ID.

For framework adapters, readiness is established only after adapter props/config and event/callback wiring are installed for the mounted custom element. A synchronous render/commit must not allow the element's `connectedCallback()` to race wrapper listener setup. For direct custom-element use, the eventual public integration must provide an explicit documented start/readiness operation; callers must not be asked to depend on undocumented microtask timing.

Before the first dispatch gate opens, rapid prop/config updates are coalesced into the latest effective snapshot and produce at most one initial request. `connect()` and the facade's activation key are idempotent per connection/query generation. A genuine query or protocol-defining config change after dispatch invalidates the old request before one replacement is announced; older responses are stale. A same-value update is a no-op. Disconnect invalidates pending work synchronously; reconnect may reissue an interrupted initial request once, with a new generation/request ID, but must not duplicate a settled initial result.

Phase 2D added no readiness method, direct-consumer start operation, or adapter wiring. Phase 2E now authorizes a private readiness gate for the core-only test integration; any public start method and adapter wiring remain future decisions.

## 3. Atomic accepted-snapshot projection

Coordinator acceptance is the sole authority for whether a host snapshot may replace acknowledged data. The future component projection must be synchronous, ordered, and idempotent:

1. Validate and accept the completion in the coordinator. A rejected, stale, unknown, invalid, or resource-limited completion cannot start projection.
2. Read the accepted coordinator snapshot and stage a complete next item registry from its full item snapshot. Do not append implicitly or route through legacy `setItems()` behavior.
3. Reconcile selected and active state by semantic item identity against the staged registry. Selection is independent of the current result window and is preserved when an item is merely absent from search/page results; only the existing explicit selection policy may remove it. Resolve an active key that is absent/disabled according to the approved selection contract.
4. Publish the staged registry and reconciled semantic state as one component-state transaction.
5. Render the option window/results from the published snapshot.
6. Synchronize option IDs, listbox relationships, active descendant, selected/disabled ARIA state, and live announcements against the rendered nodes.
7. Restore the captured scroll position after rows and spacers are committed. Scroll-to-selected behavior may run only under its existing explicit policy and must not override a newer keyboard intent.
8. Clear presentation busy/projection-pending state last, after successful render, ARIA synchronization, and scroll restoration. The coordinator remains the authority for transport busy state; projection-pending is a separate local rendering lock, never a second request lifecycle.

### Projection error policy

The coordinator has already accepted a valid host snapshot before component projection starts. If staging, registry publication, rendering, ARIA synchronization, or scroll restoration throws, the facade must not resubmit the completion, fabricate a transport failure, or roll back the coordinator to an older generation. It must:

- retain the accepted coordinator snapshot as canonical and record a projection diagnostic tied to that query generation/request ID;
- keep the last successfully rendered DOM/ARIA view intact when failure occurs before publication; if failure occurs after publication, prevent new sentinel/manual requests and expose a safe projection-pending/error state rather than announcing mismatched rows as settled;
- retain enough accepted snapshot/scroll/identity information to retry projection idempotently from the canonical snapshot, not from a stale host payload;
- clear projection-pending only after the full ordered projection succeeds; and
- never clear selection or active identity as a generic error-recovery shortcut.

The implementation phase must add a deterministic seam for projection-failure injection and a browser test proving recovery from the accepted snapshot. The coordinator's internal unit suite alone cannot validate DOM atomicity.

## 4. Sentinel and manual load-more contract

The future component owns one stable sentinel node per rendered list and one `IntersectionObserver` per connected lifecycle. The observer root is the actual list scroll container; unrelated entries and detached/stale sentinels are ignored. Observer setup occurs after the list root and dispatch configuration exist. Disconnect unobserves the sentinel and disconnects the observer before component teardown; reconnect creates a fresh observer and re-establishes the readiness sequence.

Observer notifications are state transitions, not a stream of repeated requests:

- `false` records exit and rearms the coordinator's blocked sentinel state.
- Only a `false → true` intersection transition is a new automatic load intent. Duplicate `true` callbacks while already intersecting do nothing.
- A pending request prevents concurrent work. An empty/no-progress completion blocks another automatic request until an actual exit/re-entry; a manual retry remains available according to the completion contract.
- A successful page does not allow duplicate notifications to request again while the sentinel remains continuously intersecting. After rows/layout change, a browser-observed exit/re-entry can request the next position.
- A cursor resource-depth limit suppresses both automatic and manual dispatch until policy recovery. Raising the cap alone does not synthesize an observer transition or automatically request.
- Manual load-more remains an independent, keyboard-accessible path and does not require an `IntersectionObserver` implementation. Observer failure/unavailability must leave that path usable.

Required later tests: fake-observer unit/browser seam for registration, root, target filtering, duplicate `true`, `false → true`, empty-page rearm, observer replacement on reconnect, stale callback after disconnect, policy-limit suppression/recovery, and manual loading with observer absent. At least one real-browser test must verify the actual observer lifecycle and layout transition; a pure state-machine test is not sufficient for browser wiring.

## 5. Sequenced implementation and verification gates

The policy/transition step is complete and accepted. Phase 2E authorizes only the core-only facade integration (step B), under the tests and restrictions below; adapter and cross-adapter steps remain unauthorized.

| Future step | Scope | Minimum verification |
| --- | --- | --- |
| A. Internal policy and transition model | DOM-independent coordinator config, resource outcomes, exact history, sentinel transition inputs | Coordinator unit tests: bounds/defaults, Unicode byte sizing, rejected completion no-mutation, cap/exhaustion distinction, recovery, query/reconnect history, duplicate observer events, manual trigger. TypeScript, lint, build, focused and full core unit/regression tests. |
| B. Core-only facade integration | `EnhancedSelect` acknowledged branch and private readiness/projection seams; legacy branch remains structurally separate | Legacy characterization unchanged; deterministic component tests for listener readiness, initial uniqueness, request/cancel order, projection failure/retry, selection identity, busy/scroll semantics; real browser observer, ARIA, keyboard, and rendering tests. No adapter code. |
| C. Adapter integration | One adapter at a time, additive opt-in forwarding only | The adapter's real contract suite and mounted browser tests; prove listener-before-dispatch, same request ID across channels, config precedence, request metadata serialization (especially React Native WebView), and reconnect/update behavior. Core tests remain green. |
| D. Cross-adapter compatibility | Only after each individual adapter passes | Full adapter contract matrix and required framework E2E jobs, including native/WebView-specific verification where supported. Do not infer untested platform parity. |

For every step, legacy mode must be proven independently: default configuration emits no acknowledged request metadata, existing search/load-more event payloads and callback order remain unchanged, existing page numbering/config precedence remain intact, and `setItems()` keeps its current immediate-replacement semantics. An acknowledged fixture must not replace, weaken, or reinterpret those legacy tests.

Core-only deterministic tests and static checks are sufficient for coordinator-only changes. Browser verification becomes mandatory once component DOM, rendering, ARIA, observer, or focus behavior changes. Real adapter verification becomes mandatory only for each adapter whose source/contract is changed; a passing core test does not establish framework parity. Browser engine matrices and manual AT remain governed by the release-quality policy for the actual changed scope.

## Exit criteria and current status

Phase 2D's exit criteria are accepted: the resource policy is implemented and deterministic tests pass; the readiness, projection, and sentinel contracts are consistent with Phase 2A/2C; and the documented hard bound is preserved. The accepted Phase 2D changes remain confined to `request-coordinator.ts`, its Node-only tests, and architecture documentation. Phase 2E may add the separately authorized private core integration; adapters and public API changes remain out of scope.

### Local verification record

On Node.js 20.20.2, the coordinator suite passed 25/25. The full core unit gate passed 563 tests with 1 existing skip; adapter contracts passed 12 with 43 existing skips. TypeScript and the full workspace build passed. Lint passed with 0 errors and 6 existing warnings in `docs-site/js/navigation.js`, `docs-site/js/playground.js`, and `scripts/benchmark.js`. `git diff --check`, local-link existence checks for this document, and trailing-whitespace checks passed. These are local results, not hosted certification. Browser or real-adapter tests are not claimed because Phase 2D does not change component or adapter integration.

| Milestone | Status |
| --- | --- |
| Phase 2A — contract | Closed |
| Phase 2B — internal coordinator | Closed |
| Phase 2C — identity/history hardening | Closed |
| Phase 2D — integration readiness/resource policy | Accepted and closed |
| Phase 2E — private core integration | Authorized; test-gated |
| Public completion/config API and adapter integration | Not authorized |
| Public viewport virtualization | NO-GO |
