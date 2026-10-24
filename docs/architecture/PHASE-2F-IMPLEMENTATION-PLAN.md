# Phase 2F — Public Acknowledged Data-Loading Implementation Plan

## Status and authority

**Status: Approved — implementation pending authorization (Phase 2F Implementation Plan Review 001, 2026-10-24).** The Phase 2F contract is ratified as the frozen design baseline in [PHASE-2F-PUBLIC-API-CONTRACT-PROPOSAL.md](./PHASE-2F-PUBLIC-API-CONTRACT-PROPOSAL.md) and was incorporated into `main` by PR #48 from `codex/phase-2f-contract-ratification` at source commit `acf33981780eb4b082808b3d2400274360279b4e`, merge commit `1544faf2ed4db8fc7c66f1bba0e7ecef65ad7ad7` (repository state and CI counts are management-reported). This plan does not authorize implementation, public exports, adapter changes, package/version updates, release, or production activation.

| Workstream | Status |
| --- | --- |
| Phase 0–2E | Closed within their approved scopes. |
| Phase 2F contract design | Ratified and frozen. |
| Phase 2F implementation plan | Approved by Review 001; readiness prerequisites remain open. |
| Phase 2F implementation | Not authorized; requires readiness closure and a separate explicit implementation directive. |
| Repository merge governance | Open and unenforced; administrator action and enforcement verification remain outstanding. PR #48's premature merge is a governance deviation, not a contract defect. |
| Phase 4 replication integrity | Open and separate; this plan neither diagnoses nor closes it. |
| Production viewport virtualization | **NO-GO.** |

At the reported PR #48 verification snapshot, CI and Tests had 12/12 successful jobs and Phase 4 Certification had 4/4 successful jobs. Performance Baseline had three successful jobs while its Chromium benchmark was still running; that workflow was not yet fully certified in that snapshot. These are contract-documentation PR results, not execution of the future C1–C9 implementation gates. The separate Phase 4 replication working-tree-integrity issue remains unresolved. Manual assistive-technology work, performance-budget decisions, and that replication issue are not implied by this plan.

## Implementation-readiness register

The plan review is approved, but Phase A is not ready to start. The following prerequisites must be closed and evidenced before implementation authorization:

| ID | Prerequisite | Required evidence / decision | Status |
| --- | --- | --- | --- |
| GOV-001 | Enforceable merge protection | Administrator verifies an active `main` ruleset requiring pull requests, independent approval, stale-approval dismissal, review-conversation resolution, required status checks, and force-push/deletion blocking. Verify blocking with a disposable PR, including stale-approval invalidation. If enforcement cannot be enabled, obtain a documented management exception with equivalent safeguards before implementation. | **Open — administrator/management action required.** |
| OWN-001 | Named accountability | Record individual names for core API/coordinator owner; React, Vue, Svelte, and Vanilla owners; test/browser-certification owner; API-documentation owner; and an authorized reviewer independent of the author. Record each person's approval responsibility. | **Open — assignments pending.** |
| CI-001 | Required CI contexts | Confirm exact GitHub check names and matrix expansion for `CI / build-and-test`; `Tests / Unit Tests`, `Contract Tests - {react, vue, svelte, vanilla}`, `E2E Tests - {react, vue, svelte, vanilla}`, `E2E Critical Path`, and `Test Summary`; plus `Phase 4 Certification / Regression, lint, and build (Node 20)` and `Guarded virtualization ({chromium, firefox, webkit})`. Check names above are derived from workflow definitions and are candidates, not proof they are currently required/enforced. | **Open — administrator must verify and require the exact contexts.** |
| CI-002 | Performance workflow applicability | The implementation directive must explicitly include or exclude `Phase 4 Performance Baseline` from blocking checks. The feature plan makes no new performance-budget claim, so this workflow is not presumed mandatory; if policy requires it, record its exact check contexts and terminal result. Its PR #48 snapshot had three jobs complete and Chromium still running, not a terminal green result. | **Conditional — resolve scope in the implementation directive; not an implicit blocker.** |
| CONTRACT-001 | Frozen contract revision | Pin `docs/architecture/PHASE-2F-PUBLIC-API-CONTRACT-PROPOSAL.md` at source commit `acf33981780eb4b082808b3d2400274360279b4e`, incorporated by merge commit `1544faf2ed4db8fc7c66f1bba0e7ecef65ad7ad7`. The implementation PR must verify the file content on its base and reference this revision; any contract change requires renewed review. | **Recorded — verify against the implementation base before coding.** |

The reported PR #48 merge before controlled review is recorded as a governance deviation. It does not invalidate the ratified contract, and it does not satisfy GOV-001.

## Objectives and non-goals

Deliver the ratified acknowledged data-loading API in the core and the four in-scope adapters—React, Vue, Svelte, and Vanilla—without changing legacy behavior for consumers who do not opt in. Keep one authoritative core request lifecycle, while adapters translate framework-native conventions.

This plan does not authorize or design new behavior beyond the frozen contract. In particular, it does not include Solid or React Native integration, grouped remote pagination, built-in network transport, automatic retries, caching, implicit page append/deduplication, global acknowledged defaults, cursor-limit overrides, public viewport windowing, performance thresholds, or a release/version decision.

## Binding compatibility invariants

Every implementation work package must preserve these contract requirements:

- `legacy` remains the default. No metadata or behavior changes for legacy requests unless a consumer opts in through per-instance `config.dataLoading.protocol: 'acknowledged'`.
- `GlobalSelectConfig` and `configureSelect()` do not gain global `dataLoading` defaults in this increment. Resolve per-instance settings in the ratified order and validate the merged data-loading subconfiguration atomically.
- Keep source-traced callback/event names, existing leading arguments and payload fields, callback/event ordering, adapter defaults, controlled-value behavior, and `setItems()` replacement semantics.
- Request identity, generation, pagination position, settlement, cancellation, stale-response rejection, and busy state have one core authority. Hosts own transport, abort controllers, transformation, accumulation, and deduplication.
- `completeDataRequest()` synchronously accepts the canonical full snapshot; projection completion/failure is reported separately. A projection interruption after acceptance cannot retroactively cancel that settled request. Recovery preserves its original ID/generation, does not re-emit the request notification, and does not re-accept completion; any separate active request follows the cancellation contract.
- Do not infer acknowledgment from callback return values/promises. Do not make `setItems()` settle an acknowledged request.
- Keep accessibility claims scoped to the tested implementation. This work does not establish WCAG conformance or production virtualization readiness.

## Repository boundaries

The paths below are planned boundaries, not present authorization to edit. A later implementation directive may refine them, but must keep work in the named package and test surface for each checkpoint.

| Area | Planned source boundary | Planned test/documentation boundary |
| --- | --- | --- |
| Core contract types/config | New `packages/core/src/data-loading/public-types.ts` and `packages/core/src/data-loading/public-config.ts`; narrowly adapt `packages/core/src/config/global-config.ts` for instance-level typing/validation without adding `dataLoading` to `GlobalSelectConfig`. | New focused files under `packages/core/tests/data-loading/` for public validation, resolution, and type/API behavior. |
| Core component facade | `packages/core/src/components/enhanced-select.ts`; existing private authority stays in `packages/core/src/data-loading/request-coordinator.ts`; expose only the ratified public methods/events through `packages/core/src/index.ts`. | Existing `packages/core/tests/data-loading/request-coordinator.spec.ts`, `packages/core/tests/phase-2e-acknowledged-data-loading.spec.ts`, and a public-facade test under `packages/core/tests/data-loading/`. |
| React | `packages/react/src/Select.tsx` and `packages/react/src/index.tsx`. | `tests/contracts/react.contract.spec.ts`; add only the needed fixture/setup in `tests/contracts/`. |
| Vue | `packages/vue/src/Select.vue`, `packages/vue/src/index.ts`, and `packages/vue/src/Select.vue.d.ts` where declaration maintenance is required by the build. | `tests/contracts/vue.contract.spec.ts`; Vue SFC/type tests belong in the existing contract harness. |
| Svelte | `packages/svelte/src/Select.svelte`, `packages/svelte/src/index.ts`, and `packages/svelte/src/Select.svelte.d.ts`. | `tests/contracts/svelte.contract.spec.ts`; verify emitted event details and exposed instance methods. |
| Vanilla | `packages/vanilla/src/index.ts`; preserve explicit core registration expectations and the adapter-specific `{ group, items }` grouped input. | `tests/contracts/vanilla.contract.spec.ts`; cover listener replacement, disposal, and reinitialization. |
| Cross-adapter browser verification | Prefer existing root/framework Playwright setup; add a dedicated Phase 2F spec/fixture only if current scenarios cannot exercise the public APIs. | `tests/e2e/phase-2e-acknowledged-data-loading.spec.ts` as the private-core reference; new public-path browser coverage under `tests/e2e/` if required. Preserve screenshots, traces, reports, and logs on failure. |
| Public documentation | Update `docs/API-REFERENCE.md`, `docs/SELECT-COMPONENT.md`, `docs/KNOWN-LIMITATIONS.md`, `docs/ADAPTER-CAPABILITY-MATRIX.md`, and the four maintained package READMEs only where needed to describe shipped behavior accurately. | C9 documentation/export audit; link and example validation. |

Do not change `packages/solid`, `packages/react-native`, virtualization runtime behavior, package versions, lockfile dependencies, or release workflows under this scope. Touch package manifests only if the authorized public entry point cannot be represented through the existing package exports; explain and review any such exception separately. CI workflow changes are likewise exceptional: first use the existing required workflows, and propose a narrowly scoped workflow update only if an acceptance gate is otherwise unexecutable.

## Phased work packages

Each phase is a separately reviewable checkpoint. A phase may begin only after the previous phase's acceptance evidence is reviewed. No phase is authorized until the implementation directive explicitly authorizes it.

### Phase A — Entry gate and compatibility fixtures

**Purpose:** establish the implementation baseline before changing the public surface.

**Work:** pin the exact `main` commit and contract document hash in the implementation PR; assign named core, adapter, test, and documentation owners; make the required review/check policy enforceable or obtain an explicit administrator-approved exception; turn Phase 1 characterization into assertions for the legacy event/callback/default/page-numbering behavior that the contract protects.

**Files:** test-only updates in `packages/core/tests/phase-1-search-pagination-characterization.spec.ts` and `tests/contracts/{react,vue,svelte,vanilla}.contract.spec.ts` if existing assertions do not already cover the required oracle. No runtime/API edits in this phase.

**Acceptance:** a reviewer can run the baseline against current `main`; all legacy expectations pass unchanged; named owners and required check contexts are recorded; an unapproved PR cannot merge under verified repository policy. If repository settings remain unenforceable, stop for management direction rather than treating successful CI as an equivalent control.

### Phase B — Core public types, config resolution, and validation

**Purpose:** define one public core type/config boundary before adapters consume it.

**Work:** add the ratified data-loading and request/completion/notification/state types; define the per-instance `SelectInstanceConfig` without widening `GlobalSelectConfig`; implement the pure validator and documented precedence/fetch-limit resolution; make invalid subconfiguration updates atomic and diagnostics transition-scoped. Export only the contract-approved core names.

**Files:** planned core type/config boundaries in the table above, plus `packages/core/src/index.ts` and narrowly scoped config typing changes. Do not expose the internal coordinator class as a public standalone API.

**Tests:** validator cases for unknown fields, type/value errors, protocol dependencies, positive safe integers, initial-invalid readiness, active-request invalid updates, mixed valid/invalid config, duplicate-invalid rerenders, and reset after valid config. Type-level tests must prove old callback handlers remain assignable and global config does not accept `dataLoading`.

**Acceptance gate:** C1 and C2 pass at the core boundary; generated declarations match the ratified signatures; existing core unit/contract/type/lint/build checks remain green; no legacy defaults or global configuration behavior change.

### Phase C — Core request lifecycle, completion, and projection facade

**Purpose:** connect the public facade to the already-private coordinator without creating a second lifecycle.

**Work:** implement public readiness and completion methods, request notifications, cancellation notifications, data-loading state snapshots, and projection notifications as specified. Keep the coordinator authoritative; test the full projection transition table, including interruption and recovery. Ensure request-completion validation is atomic and selection identity survives snapshot replacement.

**Files:** `packages/core/src/components/enhanced-select.ts`, the existing private `packages/core/src/data-loading/request-coordinator.ts` only where integration gaps require it, and core public types/config/exports from Phase B.

**Tests:** extend `packages/core/tests/phase-2e-acknowledged-data-loading.spec.ts` with public behavior or create a separate public-facade suite under `packages/core/tests/data-loading/`. Preserve the existing private test seam as test support only; do not export it. Extend `tests/e2e/phase-2e-acknowledged-data-loading.spec.ts` or add a public-path spec for actual browser lifecycle, scrolling/sentinel, focus/ARIA, projection failure/recovery, and reconnect.

**Acceptance gate:** C3–C7 pass for the core; explicitly verify R05 (no cancellation for an accepted/settled request after projection interruption, stable original ID/generation, no duplicate request event/completion acceptance, separate active request cancellation); the pinned Chromium/Firefox/WebKit suite passes; traces and failure artifacts remain available. Phase C cannot be declared complete from unit tests alone.

### Phase D — React adapter conformance

**Purpose:** map the core contract onto React's current prop/callback/ref conventions.

**Files:** `packages/react/src/Select.tsx`, `packages/react/src/index.tsx`, and `tests/contracts/react.contract.spec.ts`.

**Tests and acceptance:** verify config forwarding, optional request context appended after the current React callback arguments (including `results`/`count` and the existing load-more promise return type), explicit completion forwarding, cancellation callback mapping, controlled/uncontrolled values, and unmount/remount readiness. C1–C8 apply to this adapter. Callback promise settlement must not acknowledge a request.

### Phase E — Vue adapter conformance

**Purpose:** map the shared contract to Vue props, emits, model updates, and lifecycle.

**Files:** `packages/vue/src/Select.vue`, `packages/vue/src/index.ts`, `packages/vue/src/Select.vue.d.ts`, and `tests/contracts/vue.contract.spec.ts`.

**Tests and acceptance:** verify unchanged `v-model` behavior and legacy emits; append request context as the next emit argument without wrapping existing query/page payloads; validate cancel/projection/config diagnostics; test scope disposal and reconnect/readiness ordering. C1–C8 apply to Vue. The Vue source and declaration output must agree.

### Phase F — Svelte adapter conformance

**Purpose:** map the shared contract to Svelte props, event details, bindable values, and component lifecycle.

**Files:** `packages/svelte/src/Select.svelte`, `packages/svelte/src/index.ts`, `packages/svelte/src/Select.svelte.d.ts`, and `tests/contracts/svelte.contract.spec.ts`.

**Tests and acceptance:** preserve existing `{ query }` / `{ page }` details and add optional `request` fields; verify explicit completion and cancellation/projection details, config validation, binding parity, and teardown/reconnect behavior. C1–C8 apply to Svelte. Svelte's component declarations and runtime event details must agree.

### Phase G — Vanilla helper conformance and cleanup

**Purpose:** adapt the callback/helper surface while making listener ownership explicit.

**Files:** `packages/vanilla/src/index.ts` and `tests/contracts/vanilla.contract.spec.ts`.

**Tests and acceptance:** preserve helper signatures and explicit core registration; append optional request context after current callback arguments; support config and explicit completion without taking transport ownership. Verify `initSelect()` replaces helper-owned listeners, `disposeSelect()` is idempotent and does not remove the element or settle/cancel core work, and reinitialization installs exactly one fresh listener set. C1–C8 apply to Vanilla.

### Phase H — Cross-adapter closure, documentation, and release-candidate review

**Purpose:** demonstrate end-to-end parity and accurately scope the feature before any release decision.

**Work:** run all core and adapter suites together, compare each adapter against the same deterministic request fixtures, run the applicable pinned browser matrix, review emitted package declarations/entry points, and update only documentation that describes the now-implemented behavior. Preserve incomplete or skipped work as such; do not infer adapter parity from a core-only pass.

**Acceptance:** C1–C9 all have evidence and named reviewers; the existing CI, Tests, and applicable cross-browser certification workflows pass on the exact candidate commit; API docs and package artifacts expose only the ratified surface; legacy checks remain green. Any failed or unavailable gate blocks completion. Phase H is not release approval: semver, publication, accessibility sign-off, performance claims, and production virtualization each require their own authorization.

## C1–C9 traceability and evidence ownership

The normative acceptance oracle is the C1–C9 text in the frozen contract. The table below identifies where evidence is produced; it does not weaken or replace those criteria.

| Gate | Primary work package | Test/evidence owner | Required evidence |
| --- | --- | --- | --- |
| C1 — Legacy isolation | A–G | Core maintainer plus each adapter maintainer | Phase 1 characterization and each adapter's existing contract test prove payloads, leading callback args/order, defaults, page-2 legacy signal, grouped shapes, and replacement `setItems()` behavior remain unchanged. |
| C2 — Config/validation | B, D–G | Core config owner; adapter owner for each wrapper | Pure-validator and precedence tests; typed rejection of global `dataLoading`; invalid config preserves prior valid subconfig, emits one diagnostic, and dispatches no request. |
| C3 — Request identity/order | C–G | Core coordinator owner; adapter owners | One immutable ID/generation/position per intent; core event-before-callback order; same ID in channels; duplicate pending trigger creates no request. |
| C4 — Completion/projection | C–G | Core component owner and browser QA owner | Synchronous result codes, atomic canonical commit, projection event timing/failure, correct busy/ARIA order, no double application, and R05 recovery identity/no-duplicate guarantees. |
| C5 — Pagination/resource limits | B–C and D–G | Core coordinator owner; adapter test owner | Page/cursor progression, empty/retry/no-progress, exhaustion, cursor history/token/depth bounds, terminality, and truthful `hasMore`. |
| C6 — Search/selection | C–G | Core semantic-state owner; adapter owners | Out-of-order stale response rejection, exact empty-query request, remote/hybrid semantics, and selected identity retained when rows are absent. |
| C7 — Lifecycle/cleanup | C–G | Core lifecycle owner; adapter owners; browser QA | Listener readiness, disconnect invalidation of active work, no cancel of accepted settled work for projection interruption, reconnect recovery with same identity, latest-query coalescing, and idempotent adapter cleanup. |
| C8 — Adapter parity | D–G | One named maintainer per adapter plus cross-adapter QA | Real mounted wrapper tests prove native event/callback mapping, controlled/uncontrolled values, config precedence, fetch-limit fallback, completion forwarding, and legacy parity. |
| C9 — Scope/documentation | H | API-doc owner and release reviewer | Docs accurately describe per-instance opt-in, page numbering, host accumulation, no built-in transport/grouped pages, four-adapter limit, and Solid/RN/viewport/accessibility exclusions; package exports match the frozen design. |

Named people are not assigned by this plan. The implementation authorization must name an accountable owner and reviewer for each gate, specify exact required CI contexts and browser revisions, and state who may accept exceptions. Role labels in the contract are not a substitute for assignment.

## Verification and review policy

At minimum, the eventual implementation PR must run and record results for:

```sh
npm run test:unit
npm run test:contracts
npx tsc --noEmit
npm run lint
npm run build
npm run test:e2e:critical
```

It must additionally run the explicit core public data-loading suites and applicable Playwright tests across the browser engines required by the release-quality policy. The browser install must use the committed Playwright dependency and its pinned revisions. Each adapter's contract suite must execute—not merely be discovered. CI must preserve traces, screenshots, reports, command logs, and environment/browser metadata on failure. `git diff --check` is required for the submitted commit range. Tests and summaries must identify skipped cases and must not treat infrastructure failures as assertion passes.

Merge requires successful required checks and independent approval under an enforced repository policy. If governance remains unenforced, do not merge based solely on a written instruction or green CI; stop for administrator/management action. Do not bypass protections or enable auto-merge as a workaround.

## Decision checkpoints and stop conditions

1. **Plan review:** approved by Phase 2F Implementation Plan Review 001. This approval accepts the planning baseline only; no source edits begin at this checkpoint.
2. **Implementation authorization:** separately approve exact phases/files, owners, test contexts, branch/review controls, and any exclusions. Until then all phases above are planning only.
3. **Core checkpoint:** review Phases B–C evidence before authorizing adapter integration.
4. **Per-adapter checkpoints:** review each adapter's source diff and C1–C8 evidence before accepting that adapter.
5. **Candidate checkpoint:** require all C1–C9 gates and exact-commit hosted evidence before discussing release. This does not authorize merge, publication, accessibility claims, or production activation by itself.

Stop and request a new decision if preserving the frozen signatures requires a public compatibility break, a global config change, a second request authority, automatic retries, new resource-limit policy, adapter expansion, package/version changes, or any runtime/virtualization change outside the approved contract. Do not weaken an acceptance criterion to clear a failed gate.

## Final planning disposition

This plan decomposes the ratified contract into an ordered, reviewable implementation program. It is documentation only. Phase 2F implementation, public exports, React/Vue/Svelte/Vanilla changes, release, and production viewport virtualization remain unauthorized until the readiness prerequisites are evidenced and a separate explicit implementation directive is issued. Repository governance and Phase 4 replication integrity remain open independent workstreams.
