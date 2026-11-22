# Issue #109 — Acknowledged Remote Search Minimum Length

Status: **Implementation locally qualified for the recorded scope; Draft PR/push pending; not merged or published.**

Baseline: `cb8c0623a7de1f97cd17df70368f6e044447de0c` (`origin/main`, verified 2026-11-22)

Branch: `feat/109-min-search-characters`

## Contract

`dataLoading.minSearchCharacters` is an optional non-negative safe integer. It defaults to `0`. For acknowledged `remote` and `hybrid` search, Core trims surrounding whitespace and counts Unicode code points with `Array.from(query.trim()).length`. It does not count UTF-16 code units or grapheme clusters. Legacy and local search retain their existing behavior.

The coordinator evaluates eligibility before creating a search request, allocating request identity, or entering requested/loading state. An ineligible query causes no search callback/event or search-owned busy presentation. Configuration validation exists in both the public facade and coordinator so direct internal construction and runtime updates share the same invariant. Invalid updates leave the prior accepted configuration and active request intact.

Browsing and filtered search have independent data/pagination state. Core preserves the unfiltered items, continuation position, cursor history, retry state, and exhaustion while a qualifying search runs. Returning below the threshold restores the browse state. Unfiltered continuation dispatches `loadMore` with an empty request query, while filtered continuation remains associated with its qualifying query. This prevents hosts that use the request query for filtering from applying short presentation text to an unfiltered page. A canceled request's late completion is stale. Hosts still report accepted pages and exhaustion explicitly; item count alone does not define server exhaustion.

`clearSearch()` routes through the same coordinator transition as query input. React forwards the typed configuration and does not add a callback-side guard. The adapter does not replace Core-owned snapshots during equivalent prop rerenders.

## Changed implementation

- `packages/core/src/data-loading/public-types.ts`: public and resolved configuration types.
- `packages/core/src/data-loading/public-config.ts`: default and atomic validation.
- `packages/core/src/data-loading/request-coordinator.ts`: early eligibility guard and independent browse snapshot/pagination context.
- `packages/core/src/components/enhanced-select.ts`: Core config inventory, transition rendering, `clearSearch()`, and busy-state reconciliation.
- `packages/react/src/Select.tsx`: typed resolved default; existing config forwarding remains authoritative.

## Regression coverage

- `packages/core/tests/data-loading/min-search-characters.spec.ts`: initial empty query, short input, trim/code-point count, pagination isolation, stale completion, runtime threshold transitions, and invalid atomic update.
- `packages/core/tests/data-loading/public-config.spec.ts`: public defaults and invalid threshold validation.
- `packages/core/tests/phase-2e-acknowledged-data-loading.spec.ts`: Core element callbacks, busy suppression, unfiltered page restoration, and imperative clear.
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
| Core unit suite | 656 passed, 1 skipped |
| React integration suite | 47 passed |
| React contracts | 44 passed, 6 skipped |
| Full `npm test` | Passed; includes 656 Core tests (1 skipped), 48 coordinator tests, and 66 contracts (6 skipped) |
| Packed React 18 and Solid 1.9 strict NodeNext/Bundler consumers | Passed |
| `npm run lint` | 0 errors, 6 existing warnings |
| `git diff --check` | Passed |
| Issue #109 Playwright scenario | 1/1 passed on installed Chrome 156, using a temporary executable-path override because pinned Chromium 147 is unavailable |
| Existing Core public-facade browser suite | The custom empty-state projection scenario timed out waiting for projection completion on Chrome 156; the other two scenarios passed. Reproduced the same timeout on a clean worktree at the pre-change baseline `cb8c0623a7de1f97cd17df70368f6e044447de0c`, with its own `npm ci`, Core build, and the same browser binary. This is a pre-existing browser failure, not introduced by Issue #109, and is not counted as an Issue #109 pass. |

The targeted browser case covers no request/busy state for short queries, unfiltered `loadMore` continuation, eligible search, filtered pagination, browse snapshot restoration, and stale completion after cancellation. The browser substitution does not certify the pinned Playwright Chromium version. Firefox and WebKit were unavailable and remain unqualified.

The React Native adapter build rewrote its tracked generated bundle during the full build. Its original bytes were restored and the baseline SHA-256 verified as `e221dc43cdf8c5529a76c479ce855af2eb3c608cd6c04fe96f99fdab4dfb3fc1`; no generated bundle change is part of this worktree. The locked dependency audit reported 14 findings (1 low, 13 moderate); this feature does not remediate or reclassify them.

Hosted GitHub Actions are intentionally not part of this local maintenance task. No package version, release artifact, merge, npm publication, hosted workflow, or issue closure is authorized by this change. The original development checkout remains untouched. Draft PR creation/push is pending the repository's no-hosted-CI constraint; this worktree contains the qualified local candidate.
