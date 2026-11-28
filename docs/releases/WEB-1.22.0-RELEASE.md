# Web release candidate — Core 1.22.0 and React 1.14.0

Status: **Locally qualified candidate; PR and merge pending; unpublished**

Baseline: `origin/main` at `995a4fc1a21e40cf821f0a57e977d093b457816e`

Candidate branch: `release/web-1.22.0-1.14.0`

## Scope

This release candidate combines the locally reviewed Issue #128 and #129 changes:

- **Issue #128 — React remove-icon configuration and portal ownership:** preserve Core/global and per-instance icon precedence, and isolate React portal-owned icon children from Core fallback updates in selected chips and selected dropdown options.
- **Issue #129 — Truncated search-query tooltip:** show the full current query when it overflows the searchable input, using the existing tooltip and without mutating input value, caret, selection, or scroll state.

Issue #128 contains two separately documented corrections (configuration precedence and portal-root ownership); together with Issue #129 these are the three changes in this candidate. Earlier releases such as #121's selected-value tooltip remain in Core 1.21.0 and are not new changes in this release.

## Package version plan

| Package | Published version checked | Candidate version | Action and reason |
| --- | ---: | ---: | --- |
| `@smilodon/core` | `1.21.0` | `1.22.0` | Publish: contains the shared icon-root capability and search-query tooltip. |
| `@smilodon/react` | `1.13.0` | `1.14.0` | Publish: contains the React icon ownership/configuration fix; peer minimum becomes `@smilodon/core: ^1.22.0`. |
| `@smilodon/vue` | `1.12.0` | unchanged | No Vue source/API change; existing Core peer range accepts Core 1.22.x. |
| `@smilodon/solid` | `1.12.0` | unchanged | No Solid source/API change; existing Core peer range accepts Core 1.22.x. |
| `@smilodon/vanilla` | `1.12.0` | unchanged | No Vanilla source/API change; existing Core peer range accepts Core 1.22.x. |
| `@smilodon/svelte` | `2.2.0` | unchanged | No Svelte source/API change; existing Core peer range accepts Core 1.22.x. |
| `@smilodon/react-native` | `1.10.0` | excluded | No native bundle update; Android/iOS runtime qualification is incomplete. |

The root private workspace version follows Core `1.22.0`. The React release uses a minor increment because it adds the corrected React-node icon integration and establishes the required Core capability floor. The versions were unoccupied when checked against npm on 2026-11-28; confirm immediately before publication.

## Package contents and ignored files

Core's package `files` allowlist includes only `dist` and `README.md`. React's allowlist includes `dist`, `README.md`, and `COMPLETE-GUIDE.md`. Tests, playground fixtures, architecture/release evidence, local browser configuration, coverage, logs, and `node_modules` are not published. Repository `.gitignore` excludes generated `dist`, test results, coverage, dependencies, and local environment files; the package allowlist intentionally includes the generated `dist` created by the package build. No `.npmignore` or broad ignore-rule change is needed.

The eventual packed tarballs must be inspected with `npm pack --dry-run --workspace @smilodon/core` and `npm pack --dry-run --workspace @smilodon/react`; compare their file lists against the allowlists above before publication.

## Source provenance

The two reviewed source commits were based on `e39d96345c75391d9633939c378c7b37ff538cab`. They were replayed on the current main baseline in this order:

1. Issue #128: `e05598537ceae2927bf5f33bac8c2746092cb26f`
2. Issue #129: `f8f9d3121499968070816091b5f4b837ad3b0f0b`

The release candidate contains both changes on top of the later main baseline. The React icon observer also uses synchronous React reconciliation when Core's observed DOM is replaced, preventing a transient portal gap during Core option refresh.

## Qualification and publication record

| Gate | Status |
| --- | --- |
| Issue #128 and #129 source review | Accepted on their original candidate commits |
| Combined rebase/cherry-pick and source review | Complete; candidate source commits `9b5118bc` (#128) and `eda084c` (#129) are on baseline `995a4fc1a21e40cf821f0a57e977d093b457816e` |
| Core/React version metadata and peer range | Prepared in candidate |
| Web workspace builds | Passed on Node `20.20.2` / npm `10.8.2`: Core, React, Vue, Solid, Vanilla, and Svelte |
| Unit tests | Passed: discovery 4/4; Core 982 passed, 1 skipped; data-loading 48/48 |
| Adapter contracts | Passed: 72 passed, 6 skipped |
| Lint | Passed with 0 errors and 6 existing warnings |
| Packed consumer types | Passed strict React 18 and Solid 1.9 fixtures in NodeNext and Bundler modes |
| Browser regressions | Passed 21/21 on system Google Chrome `133.0.6943.126`: React remove-icon 2/2 and selected-label/search-query tooltip 19/19 |
| Pinned Playwright Chromium | Not run: required cached Chromium `1217` executable is unavailable. Chrome 133 was selected explicitly through a temporary local Playwright config; no config file is included in the candidate. |
| Packed artifact content | `npm pack --dry-run` confirmed Core 1.22.0 (56 files; only `dist`, `README.md`, `package.json`; integrity `sha512-hMBmZ5bm9YTmhrwjnILpAFFkMQ5M2OW96HLig8zhhAXxdTMUZAhVIm2yPaB/eacCfzgqWarE4ryujs8Qtr/STg==`) and React 1.14.0 (11 files; only `dist`, `README.md`, `COMPLETE-GUIDE.md`, `package.json`; integrity `sha512-BhuTQAXlEkEzwA4IFOzDkXQSKoQKp+Psq4vbZtbOoK3J8PnTAaIC2gD43isElbwWBeY0HPFXBc2J5b51ciaE0Q==`) |
| Packed consumer checks | Passed React/Solid strict NodeNext and Bundler checks on the built tarballs |
| Diff and generated artifacts | `git diff --check` passed; no generated React Native bundle or build output is in the Git diff |
| npm version availability | `1.22.0` Core and `1.14.0` React returned no matching published version on 2026-11-28; recheck before publish |
| npm identity | Authenticated maintainer identity available locally; do not publish before merge and final artifact verification |
| GitHub PR | Not created yet |
| npm publication / registry install | Not performed |

The combined local command was run with Node `20.20.2` and npm `10.8.2`. The React context-aware remove-icon contract that initially exposed a portal refresh regression passed after the synchronous observer reconciliation was added; it is included in the passing 72-contract result. No test was suppressed or reclassified. The local Chrome run used the candidate server on port 5174; the query-tooltip fixture was explicitly pointed to that server.

The original Issue #128 review recorded a Chrome 133 baseline/candidate differential of 4/8 for the unrelated Issue #125 animation suite; those four failures reproduced identically on baseline and candidate. Do not claim that suite is Chrome 133 qualified. The combined candidate's relevant React remove-icon and search-query-tooltip suites passed 21/21 on Chrome 133. Pinned Chromium 147, Firefox, and WebKit remain unverified.

React Native is excluded. No Android or iOS runtime qualification is claimed.
