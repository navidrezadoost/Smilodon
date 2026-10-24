# Release Quality Gates — Smilodon 1.x

This document separates implementation completion, scoped certification, package publication, and production feature activation. It is the proposed quality contract for 1.11.x work; the actual workflow definitions remain in `.github/workflows/`.

## Evidence levels

| Level | Required evidence | What it does not prove |
| --- | --- | --- |
| Implemented | Source/API exists and focused tests cover the change | Cross-browser or adapter parity |
| Verified | Relevant unit, integration, contract, and browser tests pass | Unmeasured platforms or assistive-technology usability |
| Certified | Named hosted workflows pass on pinned environments with artifacts reviewed | Universal behavior outside tested scope |
| Release approved | Immutable candidate, complete checks, reviewed artifacts/API/docs, and explicit release approval | Authorization for guarded viewport activation |
| Production feature activated | Separate explicit decision after feature-specific gates | Implied by package publication or green CI |

## Gate A — Change-level implementation acceptance

Every runtime change must include a contract statement, source-level ownership, focused tests, and documentation updates. For data-loading changes, tests must cover static/client filtering, remote query behavior, page/cursor ownership, page-size semantics, query reset, end-of-data, cancellation, stale responses, selection persistence, empty/error pages, repeated requests, and teardown with requests pending. When adapters expose the behavior, exercise each affected adapter rather than assuming core coverage is sufficient.

### Which checks are mandatory

The repository's configured branch ruleset is authoritative for merge-blocking checks. The current documentation baseline does not assert that every workflow is a required status check; verify the active ruleset for the target branch rather than inferring enforcement from a workflow being present or green.

For any pull request, required branch-protection checks and reviews must complete successfully on the exact head before merge. In addition, use the following scope-based evidence as the project acceptance baseline:

| Change scope | Required evidence before acceptance |
| --- | --- |
| Documentation-only | Review exact changed files and claims; validate Markdown structure, local links, and `git diff --check`; satisfy the checks actually required by the target-branch ruleset. Runtime/browser/performance matrices are not required solely because text changed unless repository policy or the touched docs' claim requires them. |
| Core or adapter runtime/API | Relevant unit and integration tests, affected adapter contracts, TypeScript, lint, build, and affected browser suites. DOM, focus, scroll, ARIA, renderer, or lifecycle changes require the pinned Chromium/Firefox/WebKit certification scope. |
| Search/pagination/data-loading | Core characterization plus real tests for each affected adapter; include concurrency, query/page reset, stale responses, empty/error pages, repeated requests, end-of-data, selection persistence, and pending-request teardown as applicable. |
| Performance/lifecycle/attribution harness | Harness tests and the pinned Performance Baseline workflow. Controlled Replication is required when a release decision relies on cross-run attribution evidence. Preserve raw reports and review completeness, not only job status. |
| npm release candidate | All checks required by ruleset and the approved release scope; package/version/peer/lockfile review, packed-content and clean-consumer verification, dry runs, registry/auth checks, immutable source tag, and explicit release approval. |

Relevant local/CI commands for runtime work include:

```sh
npm ci
npm run test:unit
npm run test:contracts
npx tsc --noEmit
npm run lint
npm run build
npm run test:e2e
```

For search/pagination changes, add deterministic core tests and real wrapper tests for each affected framework. Preserve `git diff --check` and the CI commit-range whitespace check.

## Gate B — Browser, accessibility, and lifecycle evidence

- Use the committed Playwright version and browser revisions for Chromium, Firefox, and WebKit when DOM, focus, scroll, ARIA, or renderer behavior changes.
- Retain traces, screenshots, failure logs, and structured measurements on failure.
- Assert correctness as part of performance tests: target identity, mounted state, visible geometry, and valid ARIA reference must all hold.
- Test cancellation and disposal across disconnect, query replacement, pagination, and renderer replacement.
- Automated ARIA/browser assertions do not equal manual assistive-technology certification. Record tester, OS/browser/screen-reader versions, behavior, defects, and sign-off.

The Phase 4 certification record documents successful hosted browser checks for its tested scope. Manual NVDA and VoiceOver assessment remains separate and pending; do not claim WCAG conformance from automated results alone.

## Gate C — Performance and memory

Maintain report-only measurement until a release budget is explicitly reviewed and approved. A benchmark must preserve raw attempts, incomplete/failing cases, commit, executable/browser revision, runner metadata, fixture, viewport, warmups, repetitions, and measurement boundaries. Do not convert the historical 100ms End-key candidate or planning figures into a CI failure threshold without separate approval. DOM bounds, memory retention, and browser process measurements must be described accurately; JavaScript heap is not total process memory.

## Gate D — Merge governance

- Required checks and reviews must finish successfully on the exact head commit before merge.
- Configure repository rulesets/branch protection to block merge while required checks are pending or failed.
- Review the exact changed-file list, source diff, artifacts, package versions, peer ranges, lockfile, and release-facing claims.
- A green post-merge run is useful recovery evidence but does not replace the intended pre-merge gate.

### Manual evidence and approval authority

Manual assistive-technology evidence is required before making WCAG/conformance claims or approving public viewport virtualization. It is not inferred from automated ARIA tests. Record the tester, platform and exact OS/browser/screen-reader versions, focus and announcement observations, defects, and sign-off. For this baseline, Windows/NVDA and macOS/VoiceOver assessments remain unassigned and pending.

The repository has no recorded named delegate or standing waiver that can turn a failed/pending gate into approval. A gate exception must be explicitly approved in writing by the repository maintainer/release owner, with assessment from the owner of the affected technical area; record the gate, reason, scope, duration, risks, compensating evidence, and approver. No author may self-approve an exception. Exceptions cannot be inferred from CI, a merge, or a publication request and cannot waive a safety/correctness defect or required legal/security obligation.

Public viewport activation requires a separate explicit written go/no-go decision by the repository maintainer/release owner after all Gate F evidence is reviewed, including manual accessibility sign-off. Package publication, successful CI, and approval of a documentation baseline do not grant that authority. As of this snapshot, no activation approval exists and the decision remains **NO-GO**.

## Gate E — npm release

Before a coordinated workspace publish: verify all seven package manifests and lockfile entries agree; validate peer ranges and packed contents; build from a clean checkout; dry-run each package; install the packed artifacts into clean consumer fixtures; check registry availability and authentication; publish from an immutable reviewed tag; then verify each registry version and package contents. Publish core before adapters whose peer dependency requires it. Do not publish if required checks, package contents, or release approval are unresolved.

## Gate F — Public viewport virtualization (separate NO-GO gate)

Package release does not activate the guarded virtualizer. Public activation requires separate explicit approval after: fixed-height geometry and cross-browser correctness pass; selected/active identity survives window eviction and filtering; bounded mounted DOM is reproducible at target sizes; accessibility relationships remain valid; lifecycle/memory evidence is reviewed; manual AT assessment is completed; variable-height support is either certified or explicitly excluded; and performance budgets are derived from repeated pinned-runner evidence. Keep legacy public rendering defaults until that decision is recorded.

## Phase 0 documentation baseline

Phase 0 is documentation-only. Its exit requires review of:

- [Feature Capability Matrix](./FEATURE-CAPABILITY-MATRIX.md)
- [Public API Compatibility](./PUBLIC-API-COMPATIBILITY.md)
- [Architecture Decisions](./ARCHITECTURE-DECISIONS.md)
- This gate record

The baseline records discrepancies as investigations unless source behavior or a deterministic reproduction establishes a defect. It does not authorize runtime changes, API removals, broad refactors, publishing, or production virtualization activation.
