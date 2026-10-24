# Phase 2E — Private Core Acknowledged Integration

Related records: [Phase 2A search and pagination contract](./PHASE-2A-SEARCH-PAGINATION-CONTRACT.md), [Phase 2D integration readiness and resource policy](./PHASE-2D-INTEGRATION-READINESS.md), and [architecture decisions](./ARCHITECTURE-DECISIONS.md).

## Status and boundary

Phase 2E's private `EnhancedSelect` integration and deterministic tests are technically certified for the scoped core behavior. The corrected pinned-browser run [40101198670](https://github.com/navidrezadoost/Smilodon/actions/runs/40101198670) passed all nine Phase 2E cases across Chromium, Firefox, and WebKit. The earlier [run 40098885751](https://github.com/navidrezadoost/Smilodon/actions/runs/40098885751) had 3 passes and 6 failures; review and the successful rerun established that the failures were test-precondition/synchronization errors, not evidence of a production runtime defect. PR #46 merged the two corrective commits `a3b55cf` and `23beef5` to `main` as `cf024c0eb2283a812ee705332435ab50f42469f2`. It was merged before engineering sign-off, which is recorded below as a process nonconformance. Phase 2E is **technically accepted for administrative closeout**; this does not authorize Phase 2F or production activation.

The integration is limited to `packages/core/src/components/enhanced-select.ts` and private component/browser tests. Acknowledged mode is instantiated only through `_enableAcknowledgedDataLoadingForTest`; the private readiness, completion, retry, and projection-failure seams are not exported API. No framework adapter, exported configuration/type, package version, default legacy behavior, or production viewport-virtualization setting is changed. No adapter-parity or production-readiness claim follows from these core tests.

## Implemented behavior

- A deterministic private readiness gate prevents initial acknowledged dispatch until listeners and configuration are installed. Readiness also waits for any interrupted accepted-snapshot recovery and the resulting render cycle.
- Acknowledged remote search and load-more intents are routed through the internal coordinator. The same immutable request identity is supplied to the existing event and callback channels, with event-before-callback ordering and unchanged first arguments. Cancellation is reported through a private-mode `dataRequestCancel` event.
- Completion is accepted by the coordinator before component projection begins. The component stages the accepted item registry and grouping, then publishes from the coordinator's canonical snapshot. Invalid or stale completion does not replace the component registry or settle its busy state.
- Projection remains locked through incremental rendering, ARIA synchronization, and scroll restoration. A superseded or interrupted render keeps the lock and diagnostic; retry reads the accepted coordinator snapshot rather than replaying a host payload. If the user types during that lock, the component retains the latest query as a pending intent while leaving the committed component/coordinator query unchanged. After successful projection or recovery, it dispatches one search for the latest intent; if disconnected, the intent survives until reconnect readiness and is coalesced into that connection's query. This follows Phase 2A's query-generation rule without starting a competing generation before the accepted snapshot is fully projected.
- Manual load-more and observer transitions use the coordinator. The acknowledged observer is rooted at the actual options scroller, filters unrelated/stale targets, and reuses one sentinel. A manual keyboard-accessible button remains available without `IntersectionObserver`.
- Disconnect synchronously invalidates coordinator work and observer ownership. Reconnect creates a fresh observer; readiness recovers an accepted snapshot before reopening dispatch.

## Local verification

The previously reported local verification was run with Node.js 20.20.2 from the local NVM installation. Node.js/npm are unavailable in the current execution environment, so the correction on this branch has not been run locally. The earlier local verification record is:

| Gate | Result | Notes |
| --- | --- | --- |
| Phase 2E component tests | 17/17 passed | Covers legacy parity, request identity/readiness, stale and invalid completion, selection persistence, latest-query coalescing during projection, failure recovery, disconnect/reconnect intent retention, scroll snapshots, busy/ARIA state, observer transitions, and manual fallback. |
| Full core unit gate | 580 passed, 1 skipped | Core DOM tests plus the separate DOM-free coordinator suite (25/25 passed). |
| Adapter contract gate | 12 passed, 43 skipped | Existing React, Vue, Svelte, and Vanilla contract scope; skipped cases remain skipped. |
| TypeScript | Passed | `npx tsc --noEmit`. |
| Lint | Passed | 0 errors; 6 existing warnings in unrelated documentation/performance scripts. |
| Workspace build | Passed | `npm run build`; the React Native generated bundle was restored after the build script's expected regeneration. |
| Playwright discovery | Passed | Nine entries discovered: three scenarios in each of Chromium, Firefox, and WebKit, including latest-query coalescing during interrupted chunked projection. |
| Initial pinned browser run | **3/9 passed; 6 failed** | CI run [40098885751](https://github.com/navidrezadoost/Smilodon/actions/runs/40098885751) installed the locked Playwright browsers and executed all nine cases. The latest-query/reconnect scenario passed in all engines; projection-recovery and sentinel-lifecycle tests failed in all engines. Screenshots, error contexts, traces, and logs are in the [failure artifact](https://github.com/navidrezadoost/Smilodon/actions/runs/40098885751/artifacts/12561074961). Review classified these as test assumptions: the projection test expected an old option to remain mounted during the remote searching state; the sentinel test lacked a measured exit before re-entry and assumed the old scroll position survived disconnect/reconnect. |
| Corrected pinned browser run | **9/9 passed** | CI run [40101198670](https://github.com/navidrezadoost/Smilodon/actions/runs/40101198670) executed all three Phase 2E scenarios in Chromium, Firefox, and WebKit; all passed. The complete hosted E2E suite reported 117 passed and 15 skipped. The passing browser run confirms the test corrections; no production runtime change was made. |
| Whitespace | Passed | `git diff --check`. |

The browser scenarios cover remote search event/callback identity, loading and `aria-busy`, selected-value persistence, active-descendant resolution, canonical projection recovery, latest-query coalescing while a 401-item incremental projection is interrupted by disconnect/reconnect, real sentinel exit/re-entry, and observer replacement after reconnect. Remote results with `hasMore: false` use the contract's `exhausted` status; `succeeded` is reserved for results with `hasMore: true`. The initial run's six failures were corrected in test setup/assertions only: the projection test now compares the current searching presentation across an injected pre-publication failure, while the sentinel test verifies actual list/sentinel geometry and coordinator state through exit, re-entry, and reconnect. The corrected scenarios passed in all three engines in run 40101198670.

## Final hosted certification and governance record

The final pull-request verification for [PR #46](https://github.com/navidrezadoost/Smilodon/pull/46) reported successful CI, Tests, Phase 4 Certification, and Performance Baseline workflows: [CI run 40101198670](https://github.com/navidrezadoost/Smilodon/actions/runs/40101198670), [Tests run 40101198671](https://github.com/navidrezadoost/Smilodon/actions/runs/40101198671), [Phase 4 Certification run 40101198676](https://github.com/navidrezadoost/Smilodon/actions/runs/40101198676), and [Performance Baseline run 40101198678](https://github.com/navidrezadoost/Smilodon/actions/runs/40101198678). The CI E2E log contains explicit passing entries for each of the three Phase 2E scenarios under Chromium, Firefox, and WebKit; it also reports 117 passed and 15 skipped across the full E2E run.

PR #46 merged two commits (`a3b55cf` and `23beef5`) to `main` as `cf024c0eb2283a812ee705332435ab50f42469f2`. The merge occurred before engineering sign-off, contrary to the required review sequence. This is a **process nonconformance**, not a newly identified runtime defect. No revert is indicated by the passing results. Future verification PRs must remain drafts, with auto-merge disabled, until an authorized reviewer approves the final diff and required checks.

This Phase 2E closeout does not resolve the separate Phase 4 replication working-tree-integrity issue, does not certify public completion/configuration APIs or framework-adapter parity, and does not authorize Phase 2F. Acknowledged loading remains private/test-seam-only. Production viewport virtualization remains **NO-GO**.

## Exit criteria and remaining gates

| Requirement | Status |
| --- | --- |
| Legacy default/event/callback behavior | Passed locally; default path remains separate. |
| Readiness and shared request identity | Passed in component tests. |
| Coordinator-accepted atomic projection | Passed in component tests, including injected pre/post-publication failures and canonical retry. |
| Selection persistence and remote query display | Passed in component tests and the corrected remote-search browser scenario in all three engines. |
| Scroll, busy state, and ARIA projection | Passed in component tests and the corrected browser matrix in all three engines. |
| Manual and observer load-more | Fake-observer/fallback tests and real sentinel layout transitions passed; see the corrected three-engine matrix. |
| Search intent during projection | Deterministic tests verify latest-query-wins after successful projection/recovery and query retention across disconnect/reconnect; coordinator generation remains unchanged during the projection lock. |
| Disconnect and reconnect | Deterministic recovery and pending-query tests pass; latest-query and sentinel reconnect scenarios passed all engines. |
| Chromium / Firefox / WebKit browser matrix | **Passed: 9/9 Phase 2E cases** in CI run 40101198670. |
| Phase 2E technical certification | **Accepted for administrative closeout** after final evidence review. |
| Public completion/config API and adapter integration | Not authorized. |
| Production viewport virtualization | **NO-GO**. |

Phase 2E is technically certified and accepted for administrative closeout. Public acknowledged-loading APIs, framework-adapter integration, Phase 2F, release changes, and production viewport-virtualization activation each require separate scope and authorization. The Phase 4 replication integrity issue remains an independent unresolved workstream.
