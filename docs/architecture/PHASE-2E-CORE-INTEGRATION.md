# Phase 2E — Private Core Acknowledged Integration

Related records: [Phase 2A search and pagination contract](./PHASE-2A-SEARCH-PAGINATION-CONTRACT.md), [Phase 2D integration readiness and resource policy](./PHASE-2D-INTEGRATION-READINESS.md), and [architecture decisions](./ARCHITECTURE-DECISIONS.md).

## Status and boundary

The private `EnhancedSelect` integration and its deterministic tests are implemented. Core unit, coordinator, contract, TypeScript, lint, and workspace-build checks passed locally before the hosted browser run. The pinned browsers installed in [CI run 40098885751](https://github.com/navidrezadoost/Smilodon/actions/runs/40098885751), and all nine Phase 2E cases executed: the latest-query/reconnect scenario passed in Chromium, Firefox, and WebKit; the remote projection-recovery and sentinel lifecycle scenarios failed in all three engines (3 passed, 6 failed). Initial triage identified two test-precondition errors, not an established runtime defect: the recovery test assumed an old option remained mounted while remote search was showing its searching state, and the sentinel test did not establish an observed non-intersection before expecting a new intersection; after reconnect, it also assumed scroll position remained at the end when disconnect closes and re-renders the popup. A test-only correction now compares failed-projection presentation with its actual pre-failure baseline and verifies real sentinel geometry/state transitions. That correction still requires a fresh pinned-browser run. Phase 2E remains **open and uncertified**.

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
| Real-browser execution | **3/9 passed; correction pending rerun** | CI run [40098885751](https://github.com/navidrezadoost/Smilodon/actions/runs/40098885751) installed its locked Playwright browsers and executed all nine cases. The latest-query/reconnect scenario passed in all three engines. The other two scenarios failed in all three engines; screenshots, error contexts, traces, and the full E2E log are in the [failure artifact](https://github.com/navidrezadoost/Smilodon/actions/runs/40098885751/artifacts/12561074961). The projection failure was an incorrect expectation that a prior option remained mounted after remote query rendering had already replaced the list with its searching state. The sentinel failure exposed missing test synchronization: it scrolled back to the end without first asserting an actual exit, and after disconnect/reconnect assumed the prior end position was retained. The current corrective test revision checks the pre-failure presentation against itself, records list-root/sentinel geometry, explicitly waits for a real false intersection before re-entry, and verifies reconnect from its actual top-of-list position. No production runtime defect has been established from these failures; the corrected assertions must pass on the pinned matrix before acceptance. |
| Whitespace | Passed | `git diff --check`. |

The browser scenarios cover remote search event/callback identity, loading and `aria-busy`, selected-value persistence, active-descendant resolution, canonical projection recovery, latest-query coalescing while a 401-item incremental projection is interrupted by disconnect/reconnect, real sentinel exit/re-entry, and observer replacement after reconnect. Remote results with `hasMore: false` use the contract's `exhausted` status; `succeeded` is reserved for results with `hasMore: true`. In CI run 40098885751, the latest-query scenario passed all three engines. The projection-recovery and sentinel scenarios reached browser assertions but failed as described above. Their test corrections now assert that an injected pre-publication failure leaves the actual searching presentation unchanged, require a measured false-intersection before re-entry, and treat reconnect scroll geometry as observed rather than assumed. The nine corrected assertions remain pending pinned Chromium, Firefox, and WebKit rerun; no Phase 2E acceptance is implied by the three passing cases.

## Exit criteria and remaining gates

| Requirement | Status |
| --- | --- |
| Legacy default/event/callback behavior | Passed locally; default path remains separate. |
| Readiness and shared request identity | Passed in component tests. |
| Coordinator-accepted atomic projection | Passed in component tests, including injected pre/post-publication failures and canonical retry. |
| Selection persistence and remote query display | Passed in component tests; partial remote browser assertions ran before the projection-recovery scenario's test-precondition failure. |
| Scroll, busy state, and ARIA projection | Passed in component tests; real-browser scenario requires corrected pinned rerun. |
| Manual and observer load-more | Fake-observer and fallback tests pass; real layout transition execution is pending. |
| Search intent during projection | Deterministic tests verify latest-query-wins after successful projection/recovery and query retention across disconnect/reconnect; coordinator generation remains unchanged during the projection lock. |
| Disconnect and reconnect | Deterministic recovery and pending-query tests pass; latest-query browser scenario passed all engines. Sentinel lifecycle correction awaits rerun. |
| Chromium / Firefox / WebKit browser matrix | First pinned run: 3/9 passed, 6 failed in two scenarios; corrected test revision pending rerun. |
| Public completion/config API and adapter integration | Not authorized. |
| Production viewport virtualization | **NO-GO**. |

Do not close Phase 2E until the targeted real-browser scenarios pass on the required browser engines and the final diff is reviewed. Merging, release, public API exposure, and production activation require separate approval.
