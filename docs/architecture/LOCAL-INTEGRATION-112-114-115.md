# Local integration qualification — Issues #112, #114, and #115

Date: 2026-11-22

Branch: `integration/112-114-115`

Baseline: `ab28fcf850ec3044b2655e1f6677040c894462bb` (`origin/main` at worktree creation)

Disposition: **`LOCAL_INTEGRATION_QUALIFIED_FOR_REVIEW — HOSTED_AND_ADDITIONAL_VERSION_QUALIFICATION_PENDING`**

This record covers a local, isolated integration candidate only. No push, PR, hosted workflow, merge to `main`, package publication, or issue closure was performed.

## Integrated commits

The candidate contains the following source commits in order:

| Candidate commit | Source | Purpose |
| --- | --- | --- |
| `de6071c` | #112 `aab5d916318e58b1909a1cbd6123818852a19e83` | Preserve React renderer roots across acknowledged pagination. |
| `9549fd0` | #112 follow-up `83b21aa225151a5d8ed79ed447efd6aeaa3ed251` | Exercise Load More through keyboard input in the browser regression. |
| `011c7e9` | #114 `568b9c945e8b2e40fc9b761c080641d9e16d792d` | Add the arrow-container position token. |
| `5523580` | #115 `b6b4803fedc14826b266c5abf17ca46b12cedd9e` | Align group headers using logical `start`. |
| `cc36851` | #115 `bef1cb6220fd72b3ecf9a2b8a2caa5c21ad6ea56` | Verify and document direction-attribute ownership. |

The two #115 commits remain ordered. Cherry-picks completed without conflicts. The shared Core stylesheet, styling-token reference, Core README, styling-contract tests, and changelog retain both #114 and #115 changes. The #114 worktree's uncommitted generated React Native bundle was not copied. No package versions or lockfiles changed.

## #112 acceptance gate

The controlled multi-select and grouped acknowledged-pagination regressions pass in the candidate. The browser test now uses keyboard activation for the Load More button: Playwright's pointer click timed out because the button node was replaced while the locator waited for a stable target. The existing React browser scenarios continue to cover pointer interactions separately.

Core `1.18.0` is published and was checked through npm. A packed React candidate (`@smilodon/react@1.12.1`, SHA-256 `fecc405b3ea81208b04639551fa8e6dbe332c4eb9429cee87a92ea9b708f5519`) was installed with React `18.3.1` and registry Core `1.18.0` (registry integrity `sha512-RW0JqFLAD/ntLK2L+lqAEcadVj0xF74Q86hN1YXIHgD75kdb/GNSBbumNz3nkqXgEEBVFKDr0XBVTgdrzS+ypA==`). A Chrome browser smoke completed three acknowledged pages, selected two values in controlled multi-select, rerendered equivalent source data, and verified all 18 custom option roots remained mounted.

Core `1.19.0` is not published: `npm view @smilodon/core@1.19.0` returned registry `E404`. Compatibility with Core `1.19.0` is therefore **unverified**, not passed. The regression suite does not include a dedicated delayed custom-element-registration case; that coverage limitation remains open.

## Combined local qualification

Environment: Node `26.10.0`, npm `12.2.0`, Vitest `4.1.12`; system Chrome `133.0.6943.126`. Repository-pinned Chromium, Firefox, and WebKit were not available.

| Gate | Result |
| --- | --- |
| Clean install | `npm ci` completed (738 packages); npm reported 14 audit findings and blocked install scripts for two esbuild entries and `svelte-preprocess`. |
| Core build | Passed. Rollup emitted the existing `eval` warning. |
| React, Vue, Solid, Vanilla, and Svelte builds | Passed. Existing package export-order and React `use client`/source-map warnings remain. React Native was intentionally not built. |
| Full `npm test` | 775 passed, 7 skipped. |
| React acknowledged renderer-cache tests | 4 passed. |
| Lint | 0 errors, 6 existing warnings. |
| Combined browser scenarios | 32/32 passed on system Chrome 133: React adapter, arrow-container positioning, and RTL group-header alignment. |
| `git diff --check` | Passed. |
| Worktree integrity | Clean after qualification; no generated React Native bundle, package version, lockfile, or release artifact changes. |

The browser result is local Chrome 133 evidence only. Chromium 147, Firefox, and WebKit remain unverified. For #114, static arrow positioning with a visible clear control and comprehensive input-text/arrow overlap geometry were not separately tested; the existing arrow matrix and default clear-control interaction passed. The standalone Core 1.18.0 consumer smoke is an additional compatibility datapoint; it does not establish Core 1.19.0 compatibility.

## Integration boundary

The candidate is based on the exact `origin/main` SHA above and contains all source changes for #112, #114, and #115 plus the #112 test interaction correction. It is ready for review as a local combined tree. The original IDE checkout and the separate #114 worktree were left untouched. The branch remains local and unpushed; hosted qualification and all remote integration actions remain pending.
