# Phase 4 Certification Record

## Status

Phase 4.6.1 functional CI certification is accepted based on the reported results for [PR #29](https://github.com/navidrezadoost/Smilodon/pull/29), reported merged at `8b86ad6`. The review reports 16/16 successful checks, including unit and contract suites, all four framework E2E suites, keyboard navigation, the dedicated Chromium/Firefox/WebKit matrix, TypeScript, lint, build, and the independent CI geometry check. Independent GitHub verification was unavailable during review, so both the merge details and check results are recorded as review-reported.

The earlier spacer-geometry failures did not recur in the reported PR #29 run. Their historical root cause is still undetermined; retain the strict geometry assertion and its failure diagnostics. Phase 4.6.2A browser baselining is authorized. Guarded virtualization remains test-only and public production activation remains **NO-GO**.

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

Phase 4.6.1C's prior acceptance gates were reported green in PR #29. The local Chromium results documented above remain supplementary and do not substitute for that hosted run. Preserve the diagnostics even though the geometry failure did not recur.

## Phase 4.6.1D keyboard regression findings

- **Root cause — deferred selected-item scrolling overrode keyboard intent:** PR #28's critical-path trace records focus followed by Enter and three ArrowDown presses. The input's focus handler opens the popup and makes Apple active; Enter therefore selects Apple and closes it. The next ArrowDown reopens the popup and schedules a double-`requestAnimationFrame` selected-item scroll. If subsequent keyboard navigation reaches Banana before that callback runs, `_scrollToSelected()` calls `_setActive(..., 'programmatic')`, restoring Apple and replacing the active descendant. A deterministic browser regression reproduced the exact state change: active index/key and `aria-activedescendant` changed from Banana/index 1 back to Apple/index 0 when the deferred callback was flushed. This explains the hosted `Banana` result without changing the Cherry contract.
- **Correction:** the component now captures a keyboard-active generation when opening and skips the deferred restore if keyboard navigation has since changed the active option. The base keyboard test now synchronizes on focus-open and the active option, moves from Apple to Cherry with two ArrowDown presses, and retains the expected Cherry selection. A separate regression exercises the close/reopen/keyboard-move sequence and verifies deferred work cannot replace the active option or its ARIA reference.
- **Local verification:** both keyboard cases and the deterministic deferred-scroll regression pass in cached Chromium 1234. The corrected Cherry scenario passed 20/20 repetitions with one worker and 20/20 with two workers; the five-test Chromium critical subset passed. Installing the pinned Playwright Chromium 1217 (Chrome 147.0.7727.15) was attempted but the browser CDN returned a regional HTTP 403, so this is not pinned-browser certification. Hosted verification is required.

The keyboard regression correction was merged in PR #29 and is included in the review-reported 16/16 green checks. Its historical root cause was deterministically reproduced and fixed as documented above. Performance and production activation were not implied by that functional certification.

## Phase 4.6.2A — Browser benchmark methodology and proposed budgets

Phase 4.6.2A is authorized. The benchmark harness is report-only: it measures the real built `EnhancedSelect` in Chromium for both `legacy-full` and test-only `virtual-window` modes at 1,000, 10,000, and 100,000 deterministic flat options. It does not change runtime defaults, expose a public virtualization option, or enforce performance budgets in CI.

Run it after building the workspace packages and installing the Playwright-pinned Chromium:

```sh
npm run build
PHASE4_BENCHMARK_WARMUPS=1 PHASE4_BENCHMARK_REPETITIONS=5 \
  PHASE4_BENCHMARK_OUTPUT=test-results/performance/phase-4.6.2a.json \
  npm run benchmark:phase4
npm run benchmark:phase4:summary
```

The manual `Phase 4 Performance Baseline` workflow runs the same harness on a clean Node 20 GitHub-hosted runner and preserves the raw measurements and Playwright diagnostics. The locked Playwright package supplies the browser revision. The report records the actual browser version/cache revision, Playwright version, OS/runner and CPU metadata, viewport, commit, deterministic data-generation recipe, repetitions, and warm-up policy. The initial matrix is serial at a 1280×800 viewport, 1× device scale factor, and 320 px list viewport. The harness injects a benchmark-only 40 px option-host rule inside the component's shadow root, measures a built-in option, and configures the virtualizer to the measured height in both modes; this isolates dataset-size effects from variable row geometry without changing production CSS. The test-only guarded mode uses the existing private integration seam; `legacy-full` remains the public default.

Each measured trial captures browser-side dataset generation, synchronous `setItems`, time until the mode's initial render settles, first visible option after opening, full open/render settlement, End-key navigation to the final active option, seeded random-access scroll-to-index latency, scroll-frame intervals, DOM/option counts, filter application for 10k and 100k, and Chromium CDP `Runtime.getHeapUsage` snapshots before dataset generation, after initial render, before cleanup, and after component removal plus explicit `HeapProfiler.collectGarbage`. The 10k case additionally runs 100 monotonic sequential `scrollTop` updates, advancing eight rows per update and pacing updates at one animation frame, in both modes. Random-access and sustained scroll results retain raw samples and p50/p95/p99; frame observations count intervals over 33 ms and 50 ms without claiming a frame-rate guarantee. The End-key measurement exercises the component's user-facing active-key materialization path; the component does not expose a public `scrollToKey` API. CDP heap values are JavaScript heap observations, not total browser-process memory. Filter and DOM-count probes are not included in the scroll-latency samples. Lifecycle memory here is one measured mount/unmount cleanup per trial; the separate 100-cycle stress matrix belongs to the later lifecycle stage.

### Proposed budget classes

These are proposed review targets, not accepted release gates. First collect repeatable pinned-runner baselines; confirm or revise targets before using them to fail a release workflow.

| Class | Proposed criterion | Rationale |
| --- | --- | --- |
| Hard correctness | All seeded scroll targets resolve visibly; the final End-key active descendant resolves to the final option; filtering `Option 999` returns 11 options; no JavaScript/test errors. | A fast benchmark that compares different data or silently misses an option is invalid. |
| Hard virtualization invariant | `virtual-window` mounts no more than 64 option hosts at each dataset size. | Bounds option DOM against the fixed 320 px viewport plus overscan without asserting constant total memory. |
| Performance target | Virtual mode's registration-to-initial-window p95 ≤ 500 ms (1k), 1.5 s (10k), and 5 s (100k). | Allows linear registry construction while setting a clear upper bound on initial usable output. |
| Performance target | First visible option after open p95 ≤ 150 ms at each size. | Aims for prompt interaction while excluding dataset construction from open latency. |
| Performance target | End-key-to-visible-target p95 ≤ 100 ms and p99 ≤ 250 ms. | Allows a few rendered frames for far-index materialization while catching visibly stale navigation. |
| Performance target | Random scroll-to-index p95 ≤ 50 ms and p99 ≤ 100 ms. | Leaves room for one or a few browser frames without claiming a fixed frame rate. |
| Performance target | Filter-to-render p95 ≤ 250 ms at 10k and ≤ 1 s at 100k. | Search necessarily inspects the dataset; the larger budget accounts for O(n) filtering and registration. |
| Diagnostic warning | Report frame intervals >33 ms and >50 ms; investigate if >50 ms exceeds 10% of samples. | This is an observation threshold, not a 60 FPS guarantee or a failure by itself. |
| Diagnostic warning | Investigate post-GC retained JS heap above baseline by `max(32 MiB, 25%)` across repeated runs. | Browser GC and heap accounting vary; a single delta is not proof of a leak. |

`legacy-full` is the comparison control and is not required to meet the virtual-mode targets. The item registry and index maps remain O(n), so virtualization only bounds mounted option DOM; it does not imply constant total memory. The first local run is exploratory (`n=1`, no warm-up) and cannot validate p95/p99 budgets. A release review should use at least one warm-up plus five measured repetitions on the same pinned runner/browser, retain raw samples, and review workload-level quantiles alongside the control results. The `100k` legacy full-DOM case may be limited by runner memory; an incomplete case must remain visibly incomplete, not be reported as a passing performance result.

### Initial exploratory local run

The initial run is recorded in [`phase-4.6.2a-initial.json`](../../tests/performance/results/phase-4.6.2a-initial.json) with a machine-readable aggregation in [`phase-4.6.2a-initial.summary.json`](../../tests/performance/results/phase-4.6.2a-initial.summary.json). It used one measured repetition, zero warm-ups, Node `20.20.2`, Playwright `1.59.1`, Linux Manjaro 6.12, an AMD Ryzen 9 7845HX runner, a 1280×800 viewport, 320 px list viewport, and calibrated 40 px rows. This is not pinned-browser certification: the checkout expects Chromium revision `1217` / `147.0.7727.15`, but the local cache resolved revision `1234` and `browser.version()` reported `151.0.7922.34`. The browser context's Desktop Chrome user-agent override reports `147.0.7727.15`; the executable/browser version is the relevant runtime version here.

| Dataset | Mode | Initial render settles (ms) | First visible after open (ms) | Random seek p95 (ms) | 10k sustained update p95 (ms) | Max mounted options | Post-GC JS heap delta |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1,000 | legacy-full | 425.5 | 292.4 | 0.02 | — | 1,000 | +3.4 MiB |
| 1,000 | virtual-window | 46.9 | 16.0 | 16.78 | — | 12 | +1.5 MiB |
| 10,000 | legacy-full | 4,892.4 | 744.6 | 0.11 | 0.08 | 10,000 | +0.0 MiB |
| 10,000 | virtual-window | 30.0 | 23.9 | 16.83 | 0.06 | 12 | −1.3 MiB |
| 100,000 | legacy-full | **Incomplete** — initial render did not settle within 180,000 ms | — | — | — | — | — |
| 100,000 | virtual-window | 107.0 | 75.8 | 28.46 | — | 12 | +17.6 MiB |

The 10k sequential workload completed 100 updates in both modes; its frame-interval p95 was about 16.67 ms, with one interval over 50 ms in legacy-full and none in virtual-window. In the 100k virtual random-seek workload, 54 of 99 sampled frame intervals exceeded 33 ms and none exceeded 50 ms, so these observations do not support a 60 FPS claim. Frame samples are diagnostic and sensitive to this single run. The 10k virtual filter returned all 11 model matches while mounting 8 rows; the 100k virtual filter returned all 111 matches while mounting 8 rows. No seeded scroll target failed in completed cases. These are individual observations, not p95 release results; negative or positive post-GC deltas are especially noisy at `n=1`. The 100k legacy case timed out specifically while waiting for the initial full render to settle. During that case Chromium repeatedly emitted `ResizeObserver loop completed with undelivered notifications`; page-level console/page-error counters remained zero, so the process diagnostics' source and rendering/observer interaction remain undiagnosed. Playwright's teardown also reported a browser-log string overflow, but the raw JSON preserves the stage-specific 180-second timeout and the failure trace is available from the local Playwright artifact directory. No production behavior was changed in response.

This run therefore establishes a useful bounded-DOM observation for virtual mode through 100k, but it does not establish a complete three-size legacy comparison or validate any proposed budget. Re-run the matrix on the Playwright-pinned GitHub runner with at least one warm-up and five measured repetitions before drawing release conclusions. Phase 4.6.2B lifecycle stress and production activation remain unauthorized/NO-GO until the full certification review is complete.

Phase 4.6.2B's 100-cycle 10k lifecycle stress matrix and Phase 4.6.2C's final release budgets remain future certification work. Accessibility certification and manual assistive-technology assessment also remain pending. Production activation remains **NO-GO** until performance, memory/lifecycle, accessibility, and release gates are separately reviewed.
