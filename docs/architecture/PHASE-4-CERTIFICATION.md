# Phase 4 Certification Record

## Status

Phase 4.6.1 infrastructure and Phase 4.6.1B browser-provisioning recovery are merged. The dedicated certification matrix passed, while the repository-wide framework E2E and independent CI geometry failures remain **open pending Phase 4.6.1C hosted verification**. Guarded virtualization remains test-only and production activation remains blocked.

The implementation baseline accepted for certification is Phase 4.5.3, commit `500731b`.

## Reproducible environment

- CI workflow: `.github/workflows/phase-4-certification.yml`
- Runtime: Node.js 20, following existing repository CI conventions and the core package's Node `>=18` support.
- Package manager: npm `>=9` with `npm ci` from the committed npm lockfile (`package-lock.json`, lockfile version 3).
- Browser engines: Playwright Chromium, Firefox, and WebKit on `ubuntu-latest`.
- Component exercised: the built `@smilodon/core` `enhanced-select` custom element served by the existing vanilla Vite playground.
- Guarded activation: the browser harness calls the existing private `_updateGuardedVirtualWindow` test seam. No public option is added and `legacy-full` remains the default.

## Commands

The regression job runs these gates and saves each command's output as a CI artifact:

```sh
npm ci
npx vitest run packages/core/tests/enhanced-select-virtualization-integration.spec.ts packages/core/tests/enhanced-select-selection-parity.spec.ts packages/core/tests/enhanced-select-active-parity.spec.ts packages/core/tests/enhanced-select-accessibility-integration.spec.ts packages/core/tests/virtualizer.spec.ts packages/core/tests/virtualization-contract.spec.ts packages/core/tests/memory-lifecycle.spec.ts --config packages/core/vitest.config.ts
npm run test:unit
npx tsc --noEmit
npm run lint
npm run build
git diff --check
```

The final command is a local developer check only. CI separately runs `git diff --check` against `origin/<PR-base>...HEAD` for pull requests or the pushed `before`/`after` commit range for pushes, using full git history. It does not treat an empty checkout worktree diff as validation of the submitted commit.

The browser matrix builds packages and runs the actual-component suite once per engine:

```sh
npm ci
npx playwright install --with-deps chromium # or firefox / webkit
npm run build
npx playwright test tests/e2e/phase-4-virtualization-certification.spec.ts --project=chromium # or firefox / webkit
```

Locally, the same browser suite can be launched with `npm run test:e2e:virtualization`; the root Playwright config starts the existing vanilla Vite playground, and the browser binaries must be installed first.

The existing root Playwright configuration captures screenshots on failure and traces on retry. CI allows one retry so a failed first attempt retains a trace; the HTML report, test output, and per-attempt browser-install logs are uploaded even when the browser job fails. Browser installation is retried up to three times with increasing delays to absorb transient download or DNS failures; persistent failures still fail the job.

## Initial browser scenarios

`tests/e2e/phase-4-virtualization-certification.spec.ts` exercises the component in real browser layout and covers:

1. Open 10,000 flat options; inspect physical `scrollHeight`, mounted option DOM count, and option indices/positions at the beginning, midpoint, end, and after scrolling back.
2. Use keyboard navigation to materialize an initially unmounted last option; validate that `aria-activedescendant` resolves to a mounted node.
3. Preserve multiple selected values through window eviction and invoke selected-item positioning after filtering.
4. Filter/reorder while scrolled; exercise custom renderer dimensions and grouped fallback teardown.
5. Disconnect/reconnect and verify bounded mounted nodes remain after further scroll activity.

The scenarios assert browser-observed DOM geometry and counts in addition to checking state used to drive test setup.

## Initial failure classification and recovery evidence

The first CI run after merge (`915b312`) reported 8 focused-test failures, 537 passing tests, and 1 skipped test. The failures were classified and addressed as follows:

- **Implementation defect:** exact viewport-end boundaries included the row beginning at the lower edge. The virtualizer now excludes that non-visible row while retaining configured overscan.
- **Implementation defects found by real-browser execution:** rerendering cleared spacer geometry before restoring the scroll position, and guarded End navigation considered only mounted options. Scroll restoration now happens after the rebuilt rows/spacers are in place; guarded keyboard navigation resolves enabled options across the full filtered data set and materializes the target.
- **Test assumptions/fixtures:** the chunk-supersession test had switched into guarded-window mode; a stale-ID assertion treated a reindexed item as though it retained its former position; several window and overscan expectations counted an exact lower boundary as visible; the reused-renderer observer test mounted multiple rows with one reused DOM node; scroll anchoring selected a row outside the rendered viewport; built-in option text lives in the option's open shadow root; and Playwright's shadow-piercing locator counted both option hosts and nested `part="option"` content. These tests now exercise the intended cases and assert the correct geometry/identity.
- **Test-environment incompatibility:** jsdom lacks `scrollIntoView`; the test setup supplies a no-op only when that API is absent, leaving real browser implementations untouched. The local Playwright web-server probe was also routed through the shell's ambient proxy and received HTTP 400; the local run passed with proxy variables unset for localhost, as a GitHub-hosted runner does.
- **TypeScript defects:** the component's `ResizeObserverEntry.borderBoxSize` access and the new integration/browser-test typings were corrected.
- **Unrelated baseline failures:** root `tsc --noEmit` at pre-Phase-4 commit `5e88cd6` reproduced the React example/config return-path errors, Solid custom-element ref typing, playground Vite/remote-module/DOM typing, and React contract fixture mismatch. After confirming they were baseline failures, the typing issues were corrected with minimal scoped changes so the new root type-check gate can pass; the Solid wrapper uses `display: contents` to preserve the component's layout.

Local Node.js 20 verification on the recovery branch:

| Gate | Result | Evidence |
| --- | --- | --- |
| Focused deferred Vitest suites | PASS | 247 passed across 7 files. |
| Full `test:unit` | PASS | 545 passed, 1 skipped across 25 files. |
| TypeScript check | PASS | `npx tsc --noEmit` passes after the confirmed baseline typing issues were corrected. |
| Lint | PASS | 0 errors; 6 existing warnings. |
| Build all workspaces | PASS | `npm run build` exits 0. |
| Chromium browser certification | PASS LOCALLY | 5/5 actual-component scenarios passed using an already-cached Chromium executable with ambient proxy variables unset for localhost; downloading the repository-pinned build returned a regional HTTP 403. |
| Firefox / WebKit browser certification | PENDING | Must be verified by the recovery PR workflow. |
| Local `git diff --check` | PASS | Developer check only; CI checks the PR commit range. |

These local results do not replace the required hosted PR execution. The local Chromium executable was newer than the browser revision pinned by this checkout, and the local environment denied the pinned download; keep the recovery PR open until the workflow's regression and all three browser jobs have been reviewed. Do not merge on the basis of local checks alone.

## Phase 4.6.1C CI convergence findings

- **Framework E2E web-server failure — root cause established:** the React, Vue, Svelte, and Vanilla scripts select `tests/e2e/playwright.config.ts` explicitly. At merge commit `11c076e`, that nested config still used `npm run dev -w playground`, a workspace name that does not exist, while the root `playwright.config.ts` already used the valid `@smilodon/playground` workspace and vanilla demo URL. The browser preflight passed, then all four web-server launches failed before their test assertions ran. This was configuration drift, not an outdated checkout. The nested config is now aligned to the working root command and URL; the four suites still need a hosted run to prove they execute and pass.
- **Spacer geometry failure — root cause not yet established:** the hosted CI failures reported differences of about 1,448 px and 2,275 px for the invariant `top spacer + mounted option offsetHeights + bottom spacer` versus container `scrollHeight`. These magnitudes are not rounding noise. The test now polls this same geometry difference for up to 8 seconds, retains the strict `< 500` assertion, and logs container geometry, all mounted option rectangles and box metrics, direct presentation children, spacer sizes, measured-height indexes/count, cumulative virtualizer offsets, and available render/measurement pending state. A local Chromium run using the cached browser revision (1234, not the pinned 1217) converged and passed with a 118.5 px midpoint difference; this does not explain or invalidate the larger hosted failures. The cause must be determined from the hosted diagnostics; no production rendering change or assertion relaxation is authorized on the evidence currently available.
- **Failure artifacts:** the root Playwright config retains traces and screenshots on failure. The existing `CI` workflow now tees the full E2E output with `pipefail` and attempts to upload that log plus Playwright `test-results/` and `playwright-report/` on failure. Artifact-upload errors are non-fatal to the job and cannot mask the test command's status.
- **Local verification:** with the cached Chromium revision (1234), all four framework Chromium projects executed: 64 passed and 20 were skipped by the existing project/test filters. The actual-component Phase 4 Chromium suite passed 5/5, and three repeated midpoint geometry runs passed. These local results do not establish the hosted four-framework cross-browser gate or replace the Playwright-pinned browser matrix.

Phase 4.6.1C is not complete until the hosted framework suites actually execute and pass, the geometry invariant passes reproducibly, the dedicated three-engine matrix remains green, and failure artifacts are available. The present local environment lacks the Playwright-pinned browser revision, so its cached-browser Chromium result cannot substitute for those hosted gates.

## Phase 4.6.2 and release risks

Performance and memory benchmarking has **not** started. It requires reliable browser execution first. The benchmark plan must record runner/hardware, browser/runtime versions, dataset shape, repeated-run medians and high percentiles, and distinguish JavaScript heap from browser-process memory. Agree on performance thresholds before using the benchmark to make a release decision.

Accessibility certification and manual assistive-technology assessment have **not** started. The initial browser suite checks active-descendant integrity only; it does not constitute complete accessibility certification.

Production activation is blocked until CI evidence shows passing regression, lint, build, browser-interaction, and accessibility gates and an evidence-backed performance/memory assessment is reviewed.
