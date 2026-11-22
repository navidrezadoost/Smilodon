# Issue #109 — Acknowledged Remote Search Minimum Length

Status: **Independent-review corrections locally qualified; a separate corrective commit is recorded on the isolated branch, not pushed, merged, or published.**

Baseline: `cb8c0623a7de1f97cd17df70368f6e044447de0c` (`origin/main`, verified 2026-11-22)

Branch: `feat/109-min-search-characters`

The corrective commit follows the reviewed candidate commit `4cde0549271e415754bcf2fbbe652c2786fbefca`.

## Contract

`dataLoading.minSearchCharacters` is an optional non-negative safe integer. It defaults to `0`. For acknowledged `remote` and `hybrid` search, Core trims surrounding whitespace and counts Unicode code points with `Array.from(query.trim()).length`. It does not count UTF-16 code units or grapheme clusters. Legacy and local search retain their existing behavior.

The coordinator evaluates eligibility before creating a search request, allocating request identity, or entering requested/loading state. An ineligible query causes no search callback/event or search-owned busy presentation. Configuration validation exists in both the public facade and coordinator so direct internal construction and runtime updates share the same invariant. Invalid updates leave the prior accepted configuration and active request intact.

Browsing and filtered search have independent data/pagination state. Core preserves the unfiltered items, continuation position, cursor history, retry state, and exhaustion while a qualifying search runs. Returning below the threshold restores the browse state. Unfiltered continuation dispatches `loadMore` with an empty request query, while filtered continuation remains associated with its qualifying query. This prevents hosts that use the request query for filtering from applying short presentation text to an unfiltered page. A canceled request's late completion is stale. Hosts still report accepted pages and exhaustion explicitly; item count alone does not define server exhaustion.

An accepted runtime threshold update also reconciles a changed coordinator snapshot into Core's item registry and rendered options. This applies both when the update is immediate and when it is deferred until an acknowledged projection settles; the latter waits for the current projection guard to release and then uses the latest accepted snapshot. Such a transition does not issue a search when the current query becomes ineligible. If the query becomes eligible again, the next search starts at the configured first page.

For page-mode browsing, nonempty initial items are treated as the configured `initialPage` already being present, so continuation starts at `initialPage + 1`. With no initial items, the first unfiltered browse request starts at `initialPage`; this avoids skipping a page in cold-start consumers. Cursor-mode browsing starts at ordinal 1 in either case.

`clearSearch()` routes through the same coordinator transition as query input. React forwards the typed configuration and does not add a callback-side guard. The adapter does not replace Core-owned snapshots during equivalent prop rerenders.

## Changed implementation

- `packages/core/src/data-loading/public-types.ts`: public and resolved configuration types.
- `packages/core/src/data-loading/public-config.ts`: default and atomic validation.
- `packages/core/src/data-loading/request-coordinator.ts`: early eligibility guard, independent browse snapshot/pagination context, and cold-start page selection.
- `packages/core/src/components/enhanced-select.ts`: Core config inventory, transition rendering and snapshot projection, `clearSearch()`, and busy-state reconciliation.
- `packages/react/src/Select.tsx`: typed resolved default; existing config forwarding remains authoritative.

## Regression coverage

- `packages/core/tests/data-loading/min-search-characters.spec.ts`: initial empty query, short input, trim/code-point count, pagination isolation, stale completion, runtime threshold transitions, and invalid atomic update.
- `packages/core/tests/data-loading/public-config.spec.ts`: public defaults and invalid threshold validation.
- `packages/core/tests/phase-2e-acknowledged-data-loading.spec.ts`: Core element callbacks, busy suppression, immediate and deferred threshold-change projection, restored DOM options, pagination/query restoration, stale completion rejection, cold-start browsing, and imperative clear.
- `packages/react/tests/phase-2f-acknowledged-loading.spec.tsx`: React config forwarding and callback suppression/dispatch boundary.

## Qualification record

The pre-fix focused regression failed as expected: all four original coordinator scenarios failed, including an initial empty search request, absent unfiltered page request, short-query request after cancellation, and runtime-threshold change not canceling an active request.

Local qualification on Node `20.20.2` / npm `10.8.2`:

| Gate | Result |
| --- | --- |
| `npm ci` | Passed |
| Core workspace build and React build | Passed |
| Full `npm run build` | Passed; the generated React Native bundle was restored byte-for-byte to its baseline hash |
| Coordinator/data-loading suite | 48 passed, including in-flight unfiltered page completion and rapid browse/search transitions |
| Core unit suite | 659 passed, 1 skipped |
| Data-loading/coordinator suite | 48 passed |
| React integration suite | 47 passed |
| React contracts | 44 passed, 6 skipped |
| Full `npm test` | Passed; includes 659 Core tests (1 skipped), 48 coordinator tests, and 66 contracts (6 skipped) |
| Packed React 18 and Solid 1.9 strict NodeNext/Bundler consumers | Passed |
| `npm run lint` | 0 errors, 6 existing warnings |
| `git diff --check` | Passed |
| Issue #109 Playwright scenario | 1/1 passed on installed Chrome 156, using a temporary executable-path override because pinned Chromium 147 is unavailable; the fixture disables automatic sentinel loading so its explicit pagination assertion is deterministic |
| Existing Core public-facade browser suite | The custom empty-state projection scenario timed out waiting for projection completion on Chrome 156; the other two scenarios passed. Reproduced the same timeout on a clean worktree at the pre-change baseline `cb8c0623a7de1f97cd17df70368f6e044447de0c`, with its own `npm ci`, Core build, and the same browser binary. This is a pre-existing browser failure, not introduced by Issue #109, and is not counted as an Issue #109 pass. |

The targeted browser case covers no request/busy state for short queries, unfiltered `loadMore` continuation, eligible search, filtered pagination, browse snapshot restoration, and stale completion after cancellation. The browser substitution does not certify the pinned Playwright Chromium version. Firefox and WebKit were unavailable and remain unqualified.

### Independent source-review correction

The review of candidate `4cde0549271e415754bcf2fbbe652c2786fbefca` found that an accepted runtime threshold update could restore the coordinator's unfiltered snapshot without projecting it into `EnhancedSelect`'s loaded-item registry and visible options. Core now reconciles a changed snapshot from both the immediate `updateConfig()` path and the deferred projection-settlement path. Component regressions check the coordinator snapshot, `select.loadedItems`, shadow-rendered option labels, no duplicate search request, restored empty-query pagination, renewed eligible search, and rejection of the superseded response.

The review also identified an ambiguous empty-initial-data pagination case. Page-mode cold-start browsing now begins at `initialPage` when there are no initial items; nonempty initial items continue to mean that `initialPage` is already present, so the next request begins at `initialPage + 1`. A component-level cold-start test distinguishes these cases. The browser test fixture now disables its automatic sentinel while retaining manual load-more, preventing an unrelated in-view request from racing the below-threshold busy assertion.

Corrective qualification: full workspace build passed and the generated React Native bundle was restored to its baseline SHA-256 `e221dc43cdf8c5529a76c479ce855af2eb3c608cd6c04fe96f99fdab4dfb3fc1`; `npm test` passed (Core 659 passed/1 skipped, coordinator/data-loading 48 passed, contracts 66 passed/6 skipped); React integration passed 47/47; React contracts passed 44/44 with 6 explicit skips; packed React 18/Solid 1.9 strict NodeNext and Bundler consumers passed; lint reported 0 errors and 6 existing warnings; Issue #109 Chrome 156 scenario passed 1/1. Pinned Chromium 147 remains unavailable. No hosted checks ran.

The React Native adapter build rewrote its tracked generated bundle during the full build. Its original bytes were restored and the baseline SHA-256 verified as `e221dc43cdf8c5529a76c479ce855af2eb3c608cd6c04fe96f99fdab4dfb3fc1`; no generated bundle change is part of this worktree. The locked dependency audit reported 14 findings (1 low, 13 moderate); this feature does not remediate or reclassify them.

Hosted GitHub Actions are intentionally not part of this local maintenance task. No package version, release artifact, merge, npm publication, hosted workflow, or issue closure is authorized by this change. The original development checkout remains untouched. Draft PR creation/push is pending the repository's no-hosted-CI constraint; this worktree contains the qualified local candidate.
