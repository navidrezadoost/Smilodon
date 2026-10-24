# Phase 2E — Private Core Acknowledged Integration

Related records: [Phase 2A search and pagination contract](./PHASE-2A-SEARCH-PAGINATION-CONTRACT.md), [Phase 2D integration readiness and resource policy](./PHASE-2D-INTEGRATION-READINESS.md), and [architecture decisions](./ARCHITECTURE-DECISIONS.md).

## Status and boundary

The private `EnhancedSelect` integration and its deterministic tests are implemented locally. Core unit, coordinator, contract, TypeScript, lint, and workspace-build checks pass. The targeted Playwright suite is discovered for Chromium, Firefox, and WebKit, but it has not executed in a real browser: pinned browser installation timed out at the CDN and the subsequent matrix attempt stopped at browser launch because the pinned executables are absent. Phase 2E therefore remains **pending browser verification**, not certified or closed.

The integration is limited to `packages/core/src/components/enhanced-select.ts` and private component/browser tests. Acknowledged mode is instantiated only through `_enableAcknowledgedDataLoadingForTest`; the private readiness, completion, retry, and projection-failure seams are not exported API. No framework adapter, exported configuration/type, package version, default legacy behavior, or production viewport-virtualization setting is changed. No adapter-parity or production-readiness claim follows from these core tests.

## Implemented behavior

- A deterministic private readiness gate prevents initial acknowledged dispatch until listeners and configuration are installed. Readiness also waits for any interrupted accepted-snapshot recovery and the resulting render cycle.
- Acknowledged remote search and load-more intents are routed through the internal coordinator. The same immutable request identity is supplied to the existing event and callback channels, with event-before-callback ordering and unchanged first arguments. Cancellation is reported through a private-mode `dataRequestCancel` event.
- Completion is accepted by the coordinator before component projection begins. The component stages the accepted item registry and grouping, then publishes from the coordinator's canonical snapshot. Invalid or stale completion does not replace the component registry or settle its busy state.
- Projection remains locked through incremental rendering, ARIA synchronization, and scroll restoration. A superseded or interrupted render keeps the lock and diagnostic; retry reads the accepted coordinator snapshot rather than replaying a host payload. If the user types during that lock, the component retains the latest query as a pending intent while leaving the committed component/coordinator query unchanged. After successful projection or recovery, it dispatches one search for the latest intent; if disconnected, the intent survives until reconnect readiness and is coalesced into that connection's query. This follows Phase 2A's query-generation rule without starting a competing generation before the accepted snapshot is fully projected.
- Manual load-more and observer transitions use the coordinator. The acknowledged observer is rooted at the actual options scroller, filters unrelated/stale targets, and reuses one sentinel. A manual keyboard-accessible button remains available without `IntersectionObserver`.
- Disconnect synchronously invalidates coordinator work and observer ownership. Reconnect creates a fresh observer; readiness recovers an accepted snapshot before reopening dispatch.

## Local verification

Node.js 20.20.2 is available from the local NVM installation. The final local verification record is:

| Gate | Result | Notes |
| --- | --- | --- |
| Phase 2E component tests | 17/17 passed | Covers legacy parity, request identity/readiness, stale and invalid completion, selection persistence, latest-query coalescing during projection, failure recovery, disconnect/reconnect intent retention, scroll snapshots, busy/ARIA state, observer transitions, and manual fallback. |
| Full core unit gate | 580 passed, 1 skipped | Core DOM tests plus the separate DOM-free coordinator suite (25/25 passed). |
| Adapter contract gate | 12 passed, 43 skipped | Existing React, Vue, Svelte, and Vanilla contract scope; skipped cases remain skipped. |
| TypeScript | Passed | `npx tsc --noEmit`. |
| Lint | Passed | 0 errors; 6 existing warnings in unrelated documentation/performance scripts. |
| Workspace build | Passed | `npm run build`; the React Native generated bundle was restored after the build script's expected regeneration. |
| Playwright discovery | Passed | Nine entries discovered: three scenarios in each of Chromium, Firefox, and WebKit, including latest-query coalescing during interrupted chunked projection. |
| Real-browser execution | **Pending — environment blocked** | The official Playwright installer was retried into a fresh temporary cache (without touching existing browser caches). Chromium 1217 download from the primary CDN and fallback storage URL timed out at 0%; installation stopped before Firefox/WebKit downloads. The latest nine-case matrix attempt failed before test setup because the pinned Chromium headless shell (`chromium_headless_shell-1217`), Firefox (`firefox-1511`), and WebKit (`webkit-2272`) executables are absent. No browser assertions ran. Playwright error-context files and traces were retained under the ignored `test-results/phase-2e-acknowledged-data-*` directories. This is an environment limitation, not an application-test result. |
| Whitespace | Passed | `git diff --check`. |

The authored browser scenarios cover remote search event/callback identity, loading and `aria-busy`, selected-value persistence, active-descendant resolution, canonical projection recovery, latest-query coalescing while a 401-item incremental projection is interrupted by disconnect/reconnect, real sentinel exit/re-entry, and observer replacement after reconnect. Remote results with `hasMore: false` use the contract's `exhausted` status; `succeeded` is reserved for results with `hasMore: true`. The latest-query scenario verifies that the visible input retains `Cherry`, the committed query and coordinator generation do not change while projection is locked, and reconnect emits one matching event/callback request for the latest query after canonical projection recovery. The pagination scenario confirms reconnect does not replay an interrupted load-more automatically: it requires a fresh real sentinel exit/re-entry before the retained position is requested. Playwright discovery confirms three scenarios for each of Chromium, Firefox, and WebKit. All browser assertions still require execution against the pinned browser matrix before Phase 2E acceptance.

## Exit criteria and remaining gates

| Requirement | Status |
| --- | --- |
| Legacy default/event/callback behavior | Passed locally; default path remains separate. |
| Readiness and shared request identity | Passed in component tests. |
| Coordinator-accepted atomic projection | Passed in component tests, including injected pre/post-publication failures and canonical retry. |
| Selection persistence and remote query display | Passed in component tests; corresponding browser assertions are authored. |
| Scroll, busy state, and ARIA projection | Passed in component tests; real-browser assertion execution is pending. |
| Manual and observer load-more | Fake-observer and fallback tests pass; real layout transition execution is pending. |
| Search intent during projection | Deterministic tests verify latest-query-wins after successful projection/recovery and query retention across disconnect/reconnect; coordinator generation remains unchanged during the projection lock. |
| Disconnect and reconnect | Deterministic recovery and pending-query tests pass; browser lifecycle scenario is authored and pending execution. |
| Chromium / Firefox / WebKit browser matrix | Pending pinned-browser execution. |
| Public completion/config API and adapter integration | Not authorized. |
| Production viewport virtualization | **NO-GO**. |

Do not close Phase 2E until the targeted real-browser scenarios pass on the required browser engines and the final diff is reviewed. Merging, release, public API exposure, and production activation require separate approval.
