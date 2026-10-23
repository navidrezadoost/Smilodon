# Phase 4 Certification Record

## Status

Phase 4.6.1 functional CI certification is accepted based on the reported results for [PR #29](https://github.com/navidrezadoost/Smilodon/pull/29), reported merged at `8b86ad6`. The review reports 16/16 successful checks, including unit and contract suites, all four framework E2E suites, keyboard navigation, the dedicated Chromium/Firefox/WebKit matrix, TypeScript, lint, build, and the independent CI geometry check. Independent GitHub verification was unavailable during review, so both the merge details and check results are recorded as review-reported.

The earlier spacer-geometry failures did not recur in the reported PR #29 run. Their historical root cause is still undetermined; retain the strict geometry assertion and its failure diagnostics. Phase 4.6.2A is accepted as benchmark evidence. Phase 4.6.2B lifecycle certification is accepted with a memory-attribution limitation: pinned Chromium showed no progressive leak in the tested cycles, but ownership and post-disposal lifetime of eight observer-named native candidates remain unresolved. Phase 4.6.2C statistical performance-budget evaluation is recorded below; proposed latency targets remain report-only and are not certified release gates. Guarded virtualization remains test-only and public production activation remains **NO-GO**.

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

The `Phase 4 Performance Baseline` workflow runs on pushes to the benchmark branch, pull requests targeting `main`, or manual dispatch, and preserves the raw measurements and Playwright diagnostics. Its default protocol is one warm-up plus five measured repetitions; the locked Playwright package supplies the browser revision. The report records the actual browser version/cache revision, Playwright version, OS/runner and CPU metadata, viewport, commit, deterministic data-generation recipe, repetitions, and warm-up policy. The initial matrix is serial at a 1280×800 viewport, 1× device scale factor, and 320 px list viewport. The harness injects a benchmark-only 40 px option-host rule inside the component's shadow root, measures a built-in option, and configures the virtualizer to the measured height in both modes; this isolates dataset-size effects from variable row geometry without changing production CSS. The test-only guarded mode uses the existing private integration seam; `legacy-full` remains the public default.

Each measured trial captures browser-side dataset generation, synchronous `setItems`, time until the mode's initial render settles, first visible option after opening, full open/render settlement, End-key navigation to the final active option, seeded random-access scroll-to-index latency, scroll-frame intervals, DOM/option counts, filter application for 10k and 100k, and Chromium CDP `Runtime.getHeapUsage` snapshots before dataset generation, after initial render, before cleanup, and after component removal plus explicit `HeapProfiler.collectGarbage`. The 10k case additionally runs 100 monotonic sequential `scrollTop` updates, advancing eight rows per update and pacing updates at one animation frame, in both modes. Random-access and sustained scroll results retain raw samples and p50/p95/p99; frame observations count intervals over 33 ms and 50 ms without claiming a frame-rate guarantee. The End-key measurement exercises the component's user-facing active-key materialization path; the component does not expose a public `scrollToKey` API. CDP heap values are JavaScript heap observations, not total browser-process memory. Filter and DOM-count probes are not included in the scroll-latency samples. Lifecycle memory here is one measured mount/unmount cleanup per trial; the separate 100-cycle stress matrix belongs to the later lifecycle stage.

### Proposed budget classes

These are proposed review targets, not accepted release gates. First collect repeatable pinned-runner baselines; confirm or revise targets before using them to fail a release workflow.

| Class | Proposed criterion | Rationale |
| --- | --- | --- |
| Hard correctness | All seeded scroll targets resolve visibly; the final End-key active descendant resolves to the final option; filtering `Option 999` returns the fixture-derived 11 matches at 10k or 111 matches at 100k; no JavaScript/test errors. | A fast benchmark that compares different data or silently misses an option is invalid. |
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

### Phase 4.6.2A.1 — Benchmark completeness and reporting hardening

The accepted Phase 4.6.2A.1 changes make each attempt independently bounded and diagnosable. The harness runs virtual mode first for the 1k and 10k comparisons, then performs a separately bounded 100k `legacy-full` feasibility probe before starting 100k virtual measurements. If the legacy probe does not settle within 15 seconds, it is recorded as `status: incomplete`, `classification: legacy-scalability-censored`, with its stage, elapsed/timeout values, screenshot, trace, and error-context JSON. Its remaining legacy repetitions are marked skipped, it is excluded from numeric estimates, and the other workloads continue. If the feasibility probe settles, each 100k legacy warm-up/repetition still has the same 15-second cap; the remainder is skipped if one is censored. A non-legacy timeout or runtime/correctness failure remains fatal after the remaining cases have had a chance to record evidence.

The filter's expected `Option 999` result count is computed from the deterministic `Option ${index}` fixture labels (11 at 10k and 111 at 100k), rather than embedded as a workload constant. Timings distinguish registration-to-hidden-render settlement, registration-to-interactive, first visible option after opening, and open-to-render-settled. The summary reports pooled event-level scroll percentiles separately from the distribution of per-repetition p95 values; these answer different questions. Warm-ups do not enter numeric estimates, and incomplete, failed, or validation-invalid repetitions contribute no numeric estimates. Memory fields explicitly describe Chromium JavaScript heap snapshots from CDP, not total process or system memory. Page-console and Chromium CDP ResizeObserver warning counts are collected and summarized per attempt/workload; the Playwright log remains available alongside the structured evidence.

Four deterministic Node built-in tests cover fixture-derived filter counts, censored and incomplete cases, warm-up exclusion, and correctness-validation failures. Run them with `npm run test:benchmark:phase4`. The benchmark Playwright config disables runner-managed tracing because the harness owns tracing per isolated attempt; this avoids double-starting traces and lets setup/trial failures preserve a trace for the exact attempt. A local-only `PHASE4_BENCHMARK_EXECUTABLE_PATH` override exists for diagnostics; CI does not set it and continues to use the browser revision pinned by the committed Playwright dependency.

Local smoke verification on Node `20.20.2`, Playwright `1.59.1`, and cached Chromium revision `1234` completed 1k/10k in both modes and 100k virtual mode. The 100k legacy probe was censored at the configured 15-second initial-render-settle bound and preserved its screenshot, trace, and error-context JSON; the other attempts completed, all generated summary validation passed, and no page-console or CDP ResizeObserver warnings were observed. This was harness validation only (`n=1`, zero warm-ups), not a performance conclusion. Installing the pinned Chromium revision `1217` locally returned a regional HTTP 403; the pinned run has since completed on GitHub Actions as documented below.

#### Hosted pinned-browser baseline

The push-triggered [Phase 4 Performance Baseline run #1](https://github.com/navidrezadoost/Smilodon/actions/runs/39720037312) completed successfully on commit `5d3da775d0b2ef8c7eccb7be29c82c2ae909d374`. The job used Node `20.20.2`, Playwright `1.59.1`, and pinned Chromium `147.0.7727.15` (revision `1217`) on `ubuntu24`. Package install, pinned-browser install, build, benchmark, summary validation, and artifact upload all passed. The uploaded [benchmark artifact](https://github.com/navidrezadoost/Smilodon/actions/runs/39720037312) contains raw and summarized JSON, the browser-install and Playwright logs, and the 100k legacy censor's trace/error context. Its raw report records 31 attempts: 25 valid measurements across the five feasible workload groups, five completed warm-ups, and one bounded 100k legacy feasibility probe. Summary validation passed with zero issues.

| Dataset | Mode | Hidden settle p50/p95 ms | Registration→interactive p50/p95 ms | First visible p50/p95 ms | Open settled p50/p95 ms | Pooled scroll-event p95 ms | Per-trial scroll p95 distribution p50/p95 ms | Max mounted options |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1,000 | legacy-full | 692.5 / 711.5 | 1,389.0 / 1,510.9 | 363.0 / 499.5 | 878.9 / 926.2 | 0.08 | 0.05 / 0.08 | 1,000 |
| 1,000 | virtual-window | 61.3 / 64.7 | 102.4 / 123.6 | 30.2 / 49.4 | 77.7 / 92.6 | 16.82 | 16.77 / 16.83 | 12 |
| 10,000 | legacy-full | 7,325.0 / 7,343.3 | 9,980.2 / 10,152.0 | 1,267.8 / 1,278.4 | 9,021.3 / 9,106.7 | 0.22 | 0.22 / 0.30 | 10,000 |
| 10,000 | virtual-window | 77.4 / 82.4 | 129.1 / 130.7 | 36.3 / 37.7 | 79.8 / 94.5 | 16.79 | 16.79 / 17.40 | 12 |
| 100,000 | legacy-full | — | — | — | — | — | — | — |
| 100,000 | virtual-window | 185.2 / 193.7 | 347.9 / 356.5 | 150.4 / 151.8 | 195.2 / 208.6 | 51.63 | 51.38 / 51.97 | 12 |

At 100k, `legacy-full` was censored during `initial render settle` at the configured 15,000 ms bound (15,671 ms elapsed including teardown). Its one feasibility attempt retained the stage-specific failure record and diagnostics; its one warm-up and five measurements were skipped and no numeric estimates were emitted. Virtual mode completed all five measurements and its warm-up while keeping the maximum mounted option count at 12. The legacy-control scroll samples are not directly comparable to virtual-mode samples because legacy targets are already mounted while virtual mode may materialize the target. The pinned run captured zero ResizeObserver warnings through both the page-console and Chromium CDP Log channels; this does not make claims about uncaptured browser-process diagnostics.

These are report-only results from one hosted run with five repetitions per feasible workload, not accepted performance budgets or a production-readiness decision. The 100k virtual first-visible p95 (`151.8 ms`) and pooled random-seek p95 (`51.63 ms`) are slightly above the currently proposed `150 ms` and `50 ms` targets, respectively; proposed targets remain non-gating and require review across repeated pinned runs. Phase 4.6.2A.1 does not authorize lifecycle stress or production activation; production remains **NO-GO**.

Phase 4.6.2B's hosted lifecycle certification is accepted with the residual memory-attribution limitation recorded below. Phase 4.6.2C has analyzed two pinned-browser baselines, but no latency target is yet approved for release enforcement. Accessibility certification and manual assistive-technology assessment remain pending. Production activation remains **NO-GO** until performance, memory/lifecycle, accessibility, and release gates are separately reviewed.

## Phase 4.6.2A.2 — Test isolation and stress timing decision

The engineering review supplied one hosted `1M items with Fenwick tree` render observation of `75.48 ms` against the test's single-sample `< 50 ms` assertion. Repeated local samples on the same Phase 4.6.2A.1 source revision provide context, but do not recreate the hosted runner: the local environment was Node `20.20.2` on Manjaro `6.12.94-1`, AMD Ryzen 9 7845HX, 24 logical CPUs. The render-stage samples were:

| Run group | Samples | Minimum | Median | Maximum |
| --- | ---: | ---: | ---: | ---: |
| Isolated 1M render test | 15 | 3.50 ms | 11.84 ms | 18.92 ms |
| Full unit suite, repeated | 8 | 5.91 ms | 13.45 ms | 24.41 ms |
| Earlier local full-suite outlier | 1 | 50.13 ms | — | 50.13 ms |

The latest retrievable hosted PR run passed all 15 tests in `stress.spec.ts` and failed unit-suite collection only when Vitest attempted to load the Playwright benchmark. That later run does not erase the review-supplied `75.48 ms` failure; it confirms the stress timing failure was not consistent across attempts. `stress.spec.ts` and the virtualizer implementation were unchanged by PR #30. The available evidence therefore does not establish a PR-caused regression. A single `performance.now()` interval on a shared runner can include scheduler contention, garbage collection, and other host activity; it cannot distinguish those effects from a repeatable workload regression. The timing result is scheduling-sensitive with root cause unconfirmed.

The old stress suite contains these per-invocation elapsed-time assertions/targets: `computeWindow` `< 10 ms`, `cumulativeOffset` `< 5 ms`, initial 1M render `< 50 ms`, 1,000 Fenwick population updates `< 100 ms`, 1,000 prefix queries `< 50 ms`, 1,000 Fenwick updates `< 100 ms`, and telemetry duration `< 100 ms`. The deterministic workload and correctness assertions remain in the unit suite. Timing samples move to a separate, explicit stress benchmark command: one warm-up plus five measured complete stress-suite runs by default, with raw per-stage samples and runner metadata retained as JSON. The historical limits stay attached to that controlled benchmark; its pass/fail assessment uses the median of measured samples so a single outlier does not fail the general unit gate. These are diagnostic regression targets, not certified universal SLOs. A repeatable median over-target is still surfaced as a performance-target failure in the dedicated benchmark job, with its artifact retained.

Run the separate Node stress benchmark with `npm run benchmark:core-stress`; tune repetitions with `PHASE4_CORE_STRESS_WARMUPS` and `PHASE4_CORE_STRESS_REPETITIONS`, and select an output path with `PHASE4_CORE_STRESS_BENCHMARK_OUTPUT`. The `Phase 4 Performance Baseline` workflow runs it in its own runner/job and retains the report and command log as a separate artifact, so it does not contend with the browser benchmark. The browser benchmark and its existing raw evidence are unchanged.

Local verification on Node `20.20.2` completed the full stress suite (`15/15`) and the separate default protocol (one warm-up plus five measurements). All median targets passed. Local median/p95 observations in milliseconds were: `computeWindow` `0.113/0.143`, `cumulativeOffset` `0.010/0.014`, initial 1M render `3.80/5.71`, Fenwick population `0.095/0.108`, prefix queries `0.513/0.654`, Fenwick updates `0.069/0.072`, and telemetry measurement `0.727/1.071`. These local numbers validate the harness and deterministic assertions; hosted verification on the separate GitHub Actions runner is still required.

The root Vitest config now has an explicit `packages/core/tests/**/*.spec.ts` discovery boundary. The repository's other Vitest suites live under `tests/contracts/`, while Playwright suites live under `tests/e2e/` and `tests/performance/`; those runners continue to use their own configs and commands. A regression check uses Vitest's own file discovery API to assert that core stress/integration suites are collected and Playwright performance specs are not. The browser benchmark remains explicitly runnable through `npm run benchmark:phase4` and its dedicated workflow. No production runtime, public configuration, or activation default changes are part of this stage.

## Phase 4.6.2B — Lifecycle and memory certification

The lifecycle stress harness exercises the built `EnhancedSelect` in pinned Chromium on the existing vanilla playground, selecting guarded `virtual-window` behavior only through the private integration seam. It does not change the public API or production default. `npm run test:phase4:lifecycle` runs the dedicated suite after `npm run build` and Playwright-pinned Chromium installation.

The workload performs 100 mount/unmount cycles at 1,000 items, 100 cycles at 10,000 items with scrolling and rapid filtering (`Option 999` → `Option 9999` → clear), and 10 repeated lifecycle samples at 100,000 items. It checks a 64-option mounted ceiling, ArrowDown keyboard activation, renderer replacement and a one-shot renderer-failure recovery, rapid disconnect/reconnect, and cancellation of pending lifecycle animation frames, timers, scroll updates, and search notifications. Final-item keyboard materialization remains covered by the dedicated Phase 4 browser regression. Browser-side counters track the custom element's scroll-listener and `ResizeObserver` ownership without holding strong component references. Cleanup also verifies that renderer-created custom-element roots disconnect, component-owned observers/listeners/tasks are gone, and the page's deep DOM count returns to its pre-scenario baseline.

At each workload baseline, intermediate cycle checkpoints, and post-cleanup, the harness requests three Chromium CDP garbage collections and records `Runtime.getHeapUsage` separately from an open-shadow-root-inclusive browser DOM count. It records Node, Playwright, actual and expected Chromium versions/revision, commit, runner OS/CPU/memory metadata, raw per-cycle resource results, checkpoint deltas, and the entry count/limit of the built component's existing mirrored-stylesheet cache. Heap growth is diagnostic only: there is no arbitrary heap cutoff and no leak classification from a positive delta alone. A leak conclusion still requires repeatable retention plus a reproducible ownership/reference path.

The `Phase 4 Performance Baseline` workflow now runs lifecycle certification in a separate pinned-Chromium job and uploads the structured measurements, Playwright JSON report, install/test logs, screenshots, and failure traces. A local-only `PHASE4_LIFECYCLE_EXECUTABLE_PATH` override supports harness diagnostics when the pinned browser cannot be downloaded; CI does not set it, and any overridden run records its actual browser version/path and is not pinned-browser certification.

#### Local non-pinned harness diagnostic

The complete local matrix passed on Node `20.20.2`, Playwright `1.59.1`, Manjaro `6.12.94-1`, and cached Chromium `151.0.7922.34` (revision `1234`). This checkout pins Chromium `147.0.7727.15` (revision `1217`), so the run validates harness behavior only. All 100 1k cycles, 100 10k cycles, and 10 100k cycles passed; filtering yielded the expected `11 → 1 → 10,000` model counts, each mounted window stayed ≤64 options, renderer replacement/failure recovery passed, and all 10 rapid reconnect cycles completed. At every disconnect, instrumented scroll-listener, ResizeObserver, and observed-target counts returned to zero; renderer-created nodes disconnected; no stale callback/observer mutation was recorded; and the deep document DOM count returned to the 126-node baseline.

| Dataset | Cycles | Post-GC JavaScript heap delta vs scenario baseline | Intermediate deltas | Interpretation |
| ---: | ---: | ---: | ---: | --- |
| 1,000 | 100 | +897,968 bytes | +707,212 / +794,228 / +822,764 bytes | Diagnostic growth; no listener, observer, renderer, or document-DOM retention path observed. |
| 10,000 | 100 | +66,912 bytes | +24,500 / +35,536 / +51,344 bytes | Diagnostic growth; deterministic resource and DOM checks returned to baseline. |
| 100,000 | 10 | +12,212 bytes | +5,660 bytes | Diagnostic growth; no resource or DOM retention observed. |

The mirrored-stylesheet cache was measured at `0/32` entries at every local checkpoint, so it does not explain those heap deltas. The deltas remain diagnostic rather than leak findings: no heap threshold is applied, and positive CDP heap values alone do not establish a retained reference path. PR #32's hosted pinned-browser lifecycle run and required checks were subsequently accepted as documented in the opening status; Phase 4.6.2B.2 then investigated the residual heap signal. This local diagnostic did not authorize a runtime refactor or production activation; production remains **NO-GO**.

## Phase 4.6.2B.2 — Memory-retention attribution

The diagnostic suite is isolated in `tests/performance/phase-4-lifecycle-attribution.spec.ts` and is included by the lifecycle Playwright configuration. It does not change component code, production defaults, or public APIs. The existing 210-cycle functional stress test remains unchanged and runs in the same lifecycle job.

For each of 1,000 and 10,000 deterministic options, the suite executes two independent browser-context sessions for each of three arms: an allocation/DOM negative control without an `EnhancedSelect`, the component without resource instrumentation, and the same component workload with counter-only scroll-listener/`ResizeObserver` instrumentation. Every session runs 10 warm-up cycles followed by 100 measured cycles; it records four successive 25-cycle heap windows from the post-warm-up baseline. The 10k workload applies the same `Option 999` → `Option 9999` → clear filter sequence in both component arms and allocation control. Renderer replacement is exercised once during 1k warm-up, matching the separate lifecycle functional coverage rather than repeating renderer/style setup on every measured cycle.

The report records JavaScript heap separately from CDP DOM node/listener counts, deep open-shadow DOM counts, `EnhancedSelect._instances`, item-registry cardinalities at disconnect, component-owned cleanup fields, renderer connect/disconnect counts, instrumentation-map size and active resource counters, and mirrored stylesheet-cache occupancy. A test-only sentinel is attached to each component host; after cleanup, captured heap graphs count sentinel instances and record a shortest strong retaining path when one is reachable. The instrumented arm's intentional root is also recorded explicitly as `window.__phase4AttributionProbe.stateById → counter-only records`; those records contain IDs and counters, never host references. Heap deltas have no threshold and do not fail the job by themselves. Reports with retained markers are labeled `completed-with-findings`, so diagnostic evidence is preserved without treating a measurement as a runtime defect.

The lifecycle artifact now includes `phase-4.6.2b2-attribution.json` and raw Chrome DevTools `.heapsnapshot` files captured after warm-up and after cleanup for the first repeat of each arm/workload. The JSON includes browser revision/version, executable override, Node/Playwright versions, OS/CPU/memory/runner metadata, commit and working-tree state, per-window deltas, candidate object counts, and sample retaining paths. CI uses the repository-pinned Playwright Chromium; local `PHASE4_ATTRIBUTION_*` controls support reduced harness smoke runs and are not certification evidence. The existing job uploads the entire lifecycle artifact directory, including profiles and failure diagnostics.

#### Local non-pinned attribution run

The complete two-repeat local protocol passed its deterministic cleanup checks on Node `20.20.2`, Playwright `1.59.1`, Manjaro `6.12.94-1`, and cached Chromium `143.0.7499.4` (revision `1200`), rather than the pinned Chromium `147.0.7727.15` (revision `1217`). It completed 12 isolated sessions. In all component sessions, deep document DOM counts returned to their pre-warm-up baseline, `_instances` and connected host counts were zero at cleanup, active listener/observer counters were zero, renderer connections balanced, and the mirrored stylesheet cache remained `0/32`. The instrumented arm intentionally retained 110 numeric-ID counter records after its 10 warm-up plus 100 measured cycles; no active resource count remained.

The post-warm-up heap windows did not show a consistent monotonic slope. At 1k, both no-probe repeats showed a similar pattern of approximately `+63 KiB`, `+40 KiB`, `+46 KiB`, then `+37 KiB` per 25-cycle window; the instrumented repeats were of comparable magnitude. At 10k, the two arms and repeats had noisier early windows, including both positive and negative intervals, with later windows ranging roughly from `+11 KiB` to `+147 KiB`. Final component-arm post-GC deltas ranged from about `+174 KiB` to `+270 KiB`, while the allocation-control deltas ranged from about `−60 KiB` to `+26 KiB`. These small-sample local readings are descriptive only and do not establish a leak or a plateau.

The four component profiles each found one test sentinel on the final measured cycle. Its shortest strong path was:

```text
Chromium C++ Persistent root
  → detached native <input>
  → its ShadowRoot
  → detached <enhanced-select id="phase4-attribution-…-109">
  → Phase4RetentionSentinel
```

The same one-marker path appeared in the no-probe and instrumented arms at both sizes, while the allocation controls had no sentinel. The component host/list/resource counters were otherwise at baseline, and focus had been handed back to `body` before teardown. The snapshot therefore establishes a repeatable browser-level root to one detached host, but it does not yet identify whether that C++ persistent root is caused by Chromium/Playwright inspection, a browser lifecycle reference, or component-owned behavior. The earlier snapshot experiments also exposed Playwright's trace `Streamer._staleStyleSheets` path retaining stylesheet wrappers; the suite now limits renderer replacement to warm-up and reports that tooling root separately. Do not modify production rendering in response to these paths without pinned-runner reproduction and attribution.

#### Hosted pinned-Chromium attribution decision

The hosted attribution matrix completed all 12 sessions on Chromium `147.0.7727.15`, revision `1217`. Each session ran 10 warm-up and 100 measured cycles. DOM, instance, and observable resource counters returned to baseline; final 25-cycle heap-window changes were approximately `+1.7–3.8 KB`. The detached-host sentinel seen in the earlier non-pinned local profiles did not reproduce. Eight `ResizeObserver`-named candidate objects remained constant across measured cycles. Their retaining path included a Chromium C++ persistent root, Blink `ScriptState`, and `ResizeObserverSize`; object ownership and behavior after page/browser-context disposal were not established.

**B.2 status:** lifecycle cleanup is accepted for the tested workloads; no progressive leak was demonstrated. This is not proof that every object is released or that the component is entirely leak-free. Preserve the eight-candidate observation and its unresolved ownership/post-disposal lifetime. It does not currently justify a production correction or block report-only performance-budget analysis. Accessibility work remains pending and production activation remains **NO-GO**.

#### Separate CI maintenance follow-up

The Node.js 20 GitHub Action-runtime and `ubuntu-latest` image-transition warnings are tracked separately from lifecycle attribution. They are maintenance follow-ups, not evidence against the successful PR #32 browser certification and not a reason to broaden this diagnostic change.

## Phase 4.6.2C — Statistical performance-budget evaluation

### Inputs and reproducibility

This evaluation analyzes two hosted reports from the `Phase 4 Performance Baseline` workflow:

| Run | Hosted run and report commit | Runner image / CPU | Browser protocol | Source |
| --- | --- | --- | --- | --- |
| `39720037312` | [run #39720037312](https://github.com/navidrezadoost/Smilodon/actions/runs/39720037312), `5d3da775d0b2ef8c7eccb7be29c82c2ae909d374` | `ubuntu24` image `20261018.339.1`; AMD EPYC 7763; Linux `7.0.0-1017-azure` | Node `20.20.2`, Playwright `1.59.1`, Chromium `147.0.7727.15` / revision `1217`; one warm-up plus five measured repetitions | [Raw report](../../tests/performance/results/phase-4.6.2c-run-39720037312.json) |
| `39905911387` | [run #39905911387](https://github.com/navidrezadoost/Smilodon/actions/runs/39905911387), report commit `89203b6ab3bb0da130bea725823ffc866b54a6f4` (PR validation merge ref) | `ubuntu24` image `20261012.334.1`; AMD EPYC 9V74; Linux `6.17.0-1022-azure` | Node `20.20.2`, Playwright `1.59.1`, Chromium `147.0.7727.15` / revision `1217`; one warm-up plus five measured repetitions | [Raw report](../../tests/performance/results/phase-4.6.2c-run-39905911387.json) |

Both used a 1280×800 viewport, 1× device scale factor, 320 px list viewport, and calibrated 40 px option hosts. The runner images, kernel versions, and CPU models differ, so each run is summarized independently; their samples are not pooled into one purportedly controlled runner distribution. The full original reports, including per-trial and per-interaction measurements, protocol, environment metadata, censored attempts, and browser diagnostics, are committed above. Their SHA-256 digests are recorded in [`phase-4.6.2c-evaluation.json`](../../tests/performance/results/phase-4.6.2c-evaluation.json).

Reproduce the analysis and its deterministic tests with Node 20 or later:

```sh
node scripts/evaluate-phase-4-performance.mjs
node --test tests/performance/evaluate-phase-4-performance.test.mjs
```

The evaluator uses nearest-rank empirical percentiles (matching the benchmark harness), sample variance/standard deviation (`n−1`), and Tukey 1.5×IQR outlier flags using nearest-rank quartiles. It retains flagged values and never removes them. For per-trial distributions with `n=5`, nearest-rank p95 and p99 are both the maximum; they are descriptive maxima, not statistically reliable population-tail estimates. Pooled scroll events are reported separately from the five per-trial percentile values; events within a trial are clustered and are not independent hosted-run repetitions. Warm-ups are excluded from numeric estimates. The machine-readable evaluation keeps each run separate and includes raw per-trial values, raw interaction arrays, dispersion, outlier flags, correctness results, decision rationale, and the full 100k legacy censor records.

Examples of Tukey-flagged per-trial observations, retained without trimming, include the 1k run-2 registration-to-hidden-settle sample at `111.92 ms` (sample SD `25.00 ms`), the 1k run-1 first-visible sample at `49.35 ms` (sample SD `9.52 ms`), and the 1k run-2 registration-to-interactive sample at `144.39 ms` (sample SD `25.88 ms`). These flags identify observations for review; with five samples they do not establish erroneous measurements or a stable outlier process.

### Virtual-window observations

The following cells show `median / per-run p95` in milliseconds. With five measured repetitions, p95 is the maximum of those five values. End-key latency is one observation per trial. Operations have different start/end boundaries and must not be compared as interchangeable user-visible latency.

| Run | Items | Registration → hidden window | Registration → interactive | First visible after open | Open → render settled | End key → target visible |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 39720037312 | 1,000 | 61.29 / 64.68 | 102.44 / 123.60 | 30.25 / 49.35 | 77.69 / 92.60 | 32.53 / 40.18 |
| 39720037312 | 10,000 | 77.44 / 82.41 | 129.12 / 130.70 | 36.28 / 37.67 | 79.85 / 94.54 | 45.78 / 49.64 |
| 39720037312 | 100,000 | 185.24 / 193.67 | 347.91 / 356.51 | 150.37 / 151.76 | 195.16 / 208.64 | 194.68 / 201.39 |
| 39905911387 | 1,000 | 58.51 / 111.92 | 89.35 / 144.39 | 20.73 / 27.88 | 61.66 / 62.23 | 21.57 / 24.85 |
| 39905911387 | 10,000 | 68.91 / 86.18 | 108.14 / 126.36 | 30.15 / 31.30 | 77.97 / 83.02 | 35.56 / 42.72 |
| 39905911387 | 100,000 | 145.75 / 157.03 | 279.52 / 289.23 | 122.50 / 123.49 | 162.02 / 163.23 | 157.33 / 164.98 |

The evaluator also retains direct `setItems()` call duration and browser-side dataset-generation timing; neither is substituted for registration-to-render settlement. `registration → interactive` includes opening and waiting for a visible row. `first visible after open` begins immediately before `open()` and ends at the first row intersecting the list viewport. `open → render settled` waits for the mode-specific full rendered-window condition. End-key timing starts at the keyboard event timestamp and ends only once the final active row is mounted and visible; handler-only latency is recorded separately.

| Run | Items | Random-access pooled p95 / p99 | Per-trial random-access p95 distribution, median / p95 | Filter-to-visible p95 | 10k sustained update pooled p95 | Max mounted options | Post-cleanup JS heap delta, median / p95 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 39720037312 | 1,000 | 16.82 / 19.04 | 16.77 / 16.83 | — | — | 12 | 1,611,504 / 1,611,832 B |
| 39720037312 | 10,000 | 16.79 / 17.54 | 16.79 / 17.40 | 22.07 ms | 0.075 ms | 12 | 3,653,268 / 3,653,692 B |
| 39720037312 | 100,000 | 51.63 / 82.78 | 51.38 / 51.97 | 59.13 ms | — | 12 | 21,839,284 / 21,839,960 B |
| 39905911387 | 1,000 | 17.13 / 17.76 | 16.70 / 17.72 | — | — | 12 | 1,611,440 / 1,623,060 B |
| 39905911387 | 10,000 | 16.73 / 17.79 | 16.74 / 17.02 | 25.51 ms | 0.045 ms | 12 | 3,652,272 / 3,654,268 B |
| 39905911387 | 100,000 | 40.83 / 64.47 | 40.31 / 43.48 | 48.43 ms | — | 12 | 21,839,536 / 21,841,372 B |

Random-access “scroll” is a deterministic synthetic seek: the harness assigns `scrollTop` to a seeded target offset, dispatches `scroll`, and waits for the indexed option to mount and intersect the viewport. It is not a wheel/inertial-scroll measurement, nor a public `scrollToIndex` API. The 10k sustained workload performs 100 monotonic eight-row updates per trial and paces updates by animation frames; it is reported separately from random seeks. Filter timing starts at the input event and ends when the expected fixture-derived result count and first matching row are rendered and visible. CDP heap deltas measure Chromium JavaScript heap after data/component cleanup and forced GC, not browser-process or system memory and not component-attributed bytes.

### Correctness and diagnostic observations

Across both runs, all 1,700 seeded random-access targets resolved visibly, all 30 final End-key targets matched the final active index, and all 20 filter-result checks returned the fixture-derived counts (11 at 10k, 111 at 100k). The maximum mounted virtual option count was 12, below the existing 64-option invariant. No page errors, page-console warning/error events, or captured page/CDP `ResizeObserver` warnings were reported. These correctness checks remain hard invariants; they are independent of latency-budget decisions.

At 100k, the random-access frame sampler recorded intervals above 33 ms for about 99% of observed intervals in both runs, while intervals above 50 ms were about 6.01% and 4.44%, respectively—below the proposed 10% investigation trigger for >50 ms. The >33 ms frequency is still a notable diagnostic observation; it is not a frame-rate guarantee or a test failure. At 1k and 10k, no sampled random-access frame interval exceeded either 33 ms or 50 ms. The 10k sustained workload recorded no >33 ms or >50 ms intervals in either run.

The largest post-cleanup retained JavaScript heap delta was 21,841,372 bytes (about 20.83 MiB), below the proposed 32 MiB absolute component of the diagnostic warning heuristic. Heap results are stable within each workload across repetitions, but positive values and growth with dataset size do not identify a component-owned retaining path. Keep heap data diagnostic and separate from the Phase 4.6.2B native-root attribution issue.

Both 100k `legacy-full` feasibility probes were censored at the bounded 15,000 ms initial-render-settle limit (15,671 ms and 15,644 ms elapsed including teardown). Each was classified `legacy-scalability-censored`; the one feasibility probe produced no numeric latency, and the planned legacy warm-up plus five measurements were skipped. The censored cases remain explicit in the machine-readable report and are not zeros, successes, or comparison samples. The 1k/10k legacy control data is retained in the raw reports and evaluation.

### Candidate budget decisions — report-only

| Proposed metric | Evidence and decision | Recommendation |
| --- | --- | --- |
| Registration → initial hidden window p95: ≤500 ms (1k), ≤1.5 s (10k), ≤5 s (100k) | Both runs are comfortably within all three proposed bounds. | Retain as a provisional candidate; evidence supports it, but `n=5` per run does not justify a certified population p95 or CI gate. |
| First visible after open p95: ≤150 ms at each size | 1k and 10k meet the proposal in both runs. At 100k, results are 151.76 ms and 123.495 ms. The 1.76 ms exceedance is not reproduced; runner images and CPUs differ, and per-run p95 is the maximum of five trials. | Keep 150 ms unchanged as a candidate. Do not certify it at 100k; obtain more controlled pinned-runner repeats. Do not raise the limit to force a pass. |
| End key → visible target p95 ≤100 ms; p99 ≤250 ms | The p95 candidate is met at 1k/10k but is exceeded at 100k in both runs (201.39 ms and 164.98 ms). Every observed value is below 250 ms, but five trials cannot certify a p99. | Keep the 100 ms p95 as an unmet 100k candidate; do not relax it or optimize without authorization. Treat 250 ms p99 as observed-within-target only, not certified. |
| Random-access target-visibility p95 ≤50 ms; p99 ≤100 ms | Pooled 100k p95 differs across runs: 51.63 ms versus 40.83 ms; 1k/10k pass. Both runs' pooled p99 values are below 100 ms. Pooled events are nested within five trials and the operation is synthetic programmatic access, not user wheel scrolling. | Retain provisionally with the precise synthetic operation name. The 100k p95 is runner-sensitive/inconclusive; no target revision or gate is justified. Reconfirm the interaction contract and repeat on controlled runners before certification. |
| Filter-to-visible result p95: ≤250 ms (10k), ≤1 s (100k) | Both runs are well inside the proposals: 10k p95 22.07/25.51 ms; 100k p95 59.13/48.43 ms. | Retain as a candidate supported by this baseline; keep report-only pending formal approval and additional hosted evidence. |
| Full open → render settled | Captured separately, but no numerical target was previously proposed. | Diagnostic only. Do not substitute first-visible latency for full settlement. |
| 10k sustained-scroll update latency | 500 pooled updates per run have p95 0.075 ms and 0.045 ms; the test's per-trial p95 distribution is also retained. No release target was proposed for this synthetic workload. | Diagnostic only; not a user input/frame-time guarantee. |
| Heap/frame observations | Heap remains below the proposed 32 MiB warning level in these trials. 100k >50 ms frame intervals remain below the proposed 10% trigger, while >33 ms intervals are frequent. | Diagnostics only; report and investigate, with no automatic failure or leak conclusion. |

No proposed latency target was promoted to a certified release budget. The existing performance workflow now tests the evaluator and checks deterministic regeneration of the checked-in analysis; it does not enforce any latency threshold. Existing correctness expectations remain distinct and mandatory. Future performance enforcement requires an explicitly approved measurement contract, adequate repeated pinned-runner samples, and a documented budget decision. Phase 4.6.2C produces an evidence-backed proposal, not authorization for optimization, production defaults/API changes, lifecycle-criterion relaxation, or public virtualization activation. Phase 4.6.3 accessibility certification remains pending; production remains **NO-GO**.

## Phase 4.6.2C.2 — 100k End-key latency attribution

The paired diagnostic is implemented in `tests/performance/phase-4-end-key-attribution.spec.ts` and runs with `npm run benchmark:phase4:endkey` after the workspace build and Playwright-pinned Chromium installation. The performance workflow runs one warm-up pair followed by five measured pairs at 100,000 deterministic options. Each pair has a minimally instrumented arm and an instrumented arm; order alternates between pairs. Each arm uses a fresh browser context, the same dataset recipe and SHA-256 fingerprint, 1280×800 viewport, 320 px list viewport, 40 px option hosts, guarded virtual-window test seam, and identical `open → focus → Home → End` navigation. CI asserts the browser version matches the committed Playwright Chromium revision.

Both arms retain browser timestamps for the End event, event-handler return, stable-geometry observation, and final visible/ARIA confirmation, plus Playwright-side attempt and polling counts. The End event is captured at the input and must be exactly one `End` event targeting that input. The instrumented arm additionally wraps `_handleKeydown`, `_dispatchActiveKey`, `Virtualizer.scrollToKey`, `Virtualizer.updateWindow`, `_materializeGuardedVirtualKey`, and synchronous `_renderOptions` calls. It asserts that the instance wrapper intercepted this actual event, active state moved from index 0 to 99,999, virtualizer scrolling and window calculation included the final target, materialization/render mounted it, and the final ARIA reference resolves to the visible option. The arrow listener dynamically calls `this._handleKeydown(e)`, so the instance wrapper is installed before the input event and its entry/exit timestamps are required evidence of interception. The method timings are nested stages and are not additive. `_renderOptions` duration includes render bookkeeping as well as DOM work, so it is reported as synchronous render/rebuild time rather than pure DOM insertion time. Layout settlement requires the final option to be visible with an unchanged geometry/scroll signature across two bounded `expect.poll()` observations; final confirmation separately requires active index and `aria-activedescendant` to resolve to option 99,999 and its rectangle to intersect the list viewport.

The final event-to-visible duration is labeled `observedEndToVisibleMs`: it ends when bounded Playwright polling observes stable layout and valid visible/ARIA state, so it includes poll cadence and browser/Playwright observation/communication overhead. It is not a claim about the exact first-paint instant or pure component latency. Paired instrumentation overhead is retained as the signed difference between instrumented and minimally instrumented observed confirmation latency. It is a diagnostic comparison, not a correction subtracted from measured phase durations. Nested method timings must not be summed to infer total component work. Warm-ups are excluded from summaries; raw per-stage timestamps, attempt order, individual timings, browser/runner metadata, fixture fingerprint, explicit interception evidence, and correctness observations are written to `test-results/performance/phase-4.6.2c2-end-key-attribution.json` and uploaded with the performance workflow artifact. Incomplete pairs are excluded from paired latency and instrumentation-overhead distributions. Timed attempts keep tracing off; if either arm fails, the harness preserves the partial report and screenshot, then performs a separate unmeasured replay with Playwright tracing enabled and stores that replay trace, screenshot, stage/error context, browser logs, and report under the uploaded artifact directory.

The Phase 4.6.2C.1 gate is cleared on the reported PR #34 run: the previously pending Vue E2E job completed and the Tests workflow reports success. The diagnostic implementation does not alter component runtime code, public APIs, defaults, latency budgets, or production activation. Hosted C.2 measurements still require review before attribution conclusions; this phase remains diagnostic only. Accessibility certification remains pending and production virtualization remains **NO-GO**.

## Phase 4.6.2C.3B — Browser-resident first-frame attribution

C.3B extends the paired 100k End-key diagnostic without changing production code. The existing one-warm-up/five-measured-pair protocol, deterministic 100,000-option fixture, pinned Playwright Chromium, 1280×800 viewport, 320 px list, 40 px options, identical `open → focus → Home → End` sequence, and alternating minimal/instrumented arm order are retained. The minimal and instrumented arms both use the same browser-resident frame observer; only the instrumented arm wraps the component's private methods. Latency budgets remain report-only.

Before dispatching `End`, each attempt arms a `MutationObserver` in the component shadow root and a bounded `requestAnimationFrame` observer. `targetMountedAt` is the browser `performance.now()` timestamp when the mutation observer first observes option 99,999 inserted. On each animation frame, the observer checks that the target is mounted, intersects the options viewport geometrically, is the active option by both index and key, and is the element resolved by `aria-activedescendant`. The first callback satisfying all four conditions records `firstEligibleFrameAt` and its frame/state snapshot. The observer stops on that result or after 30 seconds; teardown explicitly cancels any outstanding animation frame and disconnects the mutation observer. A missing eligible-frame observation fails the attempt and contributes no numeric sample.

Each completed attempt retains the browser-clock timestamps `endEventAt`, `handlerReturnAt`, `targetMountedAt`, `firstEligibleFrameAt`, `stableGeometryObservedAt`, and `playwrightConfirmedAt`. Every `expect.poll()` evaluation also records its phase and result, browser observation timestamp when available, host start/end timestamps, and host round-trip duration. The report names the browser-side event-to-first-eligible-frame duration `firstEligibleFrameLatencyMs`. It is a requestAnimationFrame observation, not proof of paint, compositing, or pixel presentation. `playwrightConfirmedAt` remains a separate condition-poll observation and can include polling cadence and browser/Playwright communication delay. The gap between those observations is diagnostic and is not treated as component execution time.

Summary output reports each arm's first-eligible-frame distribution and signed paired differences between instrumented and minimal first-frame latency. It separately retains the signed paired differences for Playwright-confirmed `observedEndToVisibleMs`; no instrumentation difference is subtracted from any phase. The frame-observer measurement itself is common to both arms, so the paired difference isolates the additional named-method wrappers only approximately and does not estimate observer overhead. Nested component method timings remain non-additive.

The performance workflow writes the raw report to `test-results/performance/phase-4.6.2c3b-frame-attribution.json`, alongside Playwright output, browser/runner metadata, and failure diagnostics. Failed attempts preserve per-poll observations, browser evidence, screenshots, and a separate unmeasured traced replay. The pinned-browser job completed successfully in [Performance Baseline run #39921962487](https://github.com/navidrezadoost/Smilodon/actions/runs/39921962487), including the paired attribution test. The downloaded report and its analysis are recorded below. This accepts the C.3B benchmark execution, not the historical PR gate: PR #37's Phase 4 Certification and Performance Baseline passed, while its CI and Tests runs remained in progress at the latest check. All three post-merge workflows—[CI](https://github.com/navidrezadoost/Smilodon/actions/runs/39922336711), [Tests](https://github.com/navidrezadoost/Smilodon/actions/runs/39922336678), and [Phase 4 Certification](https://github.com/navidrezadoost/Smilodon/actions/runs/39922336628)—are now green. C.3B does not authorize runtime optimization, threshold changes, public virtualization, or production activation. Accessibility certification and the feature-contract audit remain pending; production remains **NO-GO**.

## Phase 4.6.2C.3C — Hosted frame-attribution analysis

### Evidence and protocol validation

The raw report `phase-4.6.2c3b-frame-attribution.json` is in the [artifact for Performance Baseline run #39921962487](https://github.com/navidrezadoost/Smilodon/actions/runs/39921962487#artifacts). Its SHA-256 is `9e09f51881473c42e645307bb5ab3928d09cff1f5122b99ac40f03b007260706`. The report records schema version 2, `completionStatus: complete-pinned-browser`, and benchmark checkout commit `1ad432e353d5813428151b41efa3bcf16ad3f33c`; GitHub associates the artifact with PR head `7f5d272acd2f972e3c739384e055639896fb7550`, which was merged as `682b255b9441169bb948d2e2afd6d40babf6c499`. These identifiers are retained separately rather than treated as interchangeable.

The hosted environment was Node `20.20.2`, Playwright `1.59.1`, Chromium `147.0.7727.15` at expected revision `1217`, on GitHub Actions `ubuntu24` image `20261012.334.1` (Linux `6.17.0-1022-azure`, AMD EPYC 7763, four reported CPUs). The protocol used one warm-up pair and five measured pairs. Both warm-up arms and all ten measured attempts completed; there were no incomplete or unpaired measured arms. Measured arm order alternated: instrumented/minimal, minimal/instrumented, instrumented/minimal, minimal/instrumented, instrumented/minimal.

Each arm used the same deterministic 100,000-item fixture (`id=option-${i}`, `value=value-${i}`, `label=Option ${i}`, `i` from 0 through 99,999; SHA-256 `8af62649687989e4457926bea5f5bf1dd8a0a6676d833362ec29a696256048ca`), Chromium revision, 1280×800 viewport, 1× device scale factor, 320 px list viewport, 40 px option height, and `open → focus → Home → End` sequence. Every measured attempt recorded one End key event; the final active index/key and ARIA target resolved to option 99,999, the target was visible, mounted option count was at most 10 (well below the 64 ceiling), and no browser errors were recorded. All five instrumented attempts verified handler interception, active-state transition, target scroll calculation, virtual-window update, target materialization, and target rendering. Every measured browser-frame observation was eligible, active, visible, mounted, and ARIA-referenced. The End event, target-mount, handler-return, first-frame, stable-geometry, and confirmation timestamps were present; durations were nonnegative, event/mount/handler observations preceded the eligible frame, and that frame preceded stable geometry and final confirmation. The two-observation stable-geometry poll and separate final visible/ARIA confirmation completed in every attempt.

### Latency observations

Values below are milliseconds. For each arm, “frame → confirmation” is `firstFrameToPlaywrightConfirmationMs`; “End → visible” is `observedEndToVisibleMs`. The frame boundary is the first browser `requestAnimationFrame` callback that observed the required mounted/visible/active/ARIA state.

| Arm | First eligible frame, p50 / p95 | End → handler return, p50 / p95 | Playwright confirmation, p50 / p95 | Frame → confirmation, p50 / p95 |
| --- | ---: | ---: | ---: | ---: |
| Minimal | 61.060 / 64.235 | 60.220 / 63.375 | 213.045 / 217.670 | 148.810 / 157.800 |
| Instrumented | 59.540 / 62.575 | 58.750 / 61.740 | 201.090 / 215.450 | 140.825 / 155.520 |

With five measured pairs, each reported p95 is the sample maximum, not a stable population-tail estimate. Per-pair values and signed differences are retained here; the artifact contains the full-precision timestamps and every poll observation.

| Pair (execution order) | Minimal: frame / frame→confirmation / End→visible | Instrumented: frame / frame→confirmation / End→visible | Δ frame | Δ frame→confirmation | Δ End→visible |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 (instrumented → minimal) | 64.235 / 148.810 / 213.045 | 62.575 / 140.735 / 203.310 | −1.660 | −8.075 | −9.735 |
| 2 (minimal → instrumented) | 59.870 / 157.800 / 217.670 | 58.970 / 137.655 / 196.625 | −0.900 | −20.145 | −21.045 |
| 3 (instrumented → minimal) | 62.570 / 150.510 / 213.080 | 59.540 / 140.825 / 200.365 | −3.030 | −9.685 | −12.715 |
| 4 (minimal → instrumented) | 61.060 / 146.735 / 207.795 | 59.930 / 155.520 / 215.450 | −1.130 | +8.785 | +7.655 |
| 5 (instrumented → minimal) | 58.705 / 141.765 / 200.470 | 59.220 / 141.870 / 201.090 | +0.515 | +0.105 | +0.620 |

The instrumented arm's synchronous handler execution was 57.915–61.460 ms across measured attempts; synchronous `_renderOptions` rebuild time was 44.360–48.125 ms (p50 45.120 ms). That rebuild is nested inside handler execution, includes render bookkeeping as well as DOM work, and must not be added to other phase durations. The method samples also show `scrollToKey` and window calculation each below 0.14 ms; these narrow calculations do not account for the approximately 60 ms synchronous handler interval.

### Interpretation and limits

The approximately 100 ms candidate is exceeded by the later Playwright-confirmed `observedEndToVisibleMs` in both arms, but not by first-frame eligibility: all ten measured first-frame values were 58.705–64.235 ms. The corresponding first-frame-to-confirmation gaps were 137.655–157.800 ms. This evidence indicates that the prior approximately 200 ms result is not a measure of component work through first eligible frame; most of its additional elapsed time occurs after that frame boundary in the harness's stability and confirmation path.

That gap is not isolated pure Playwright transport overhead: it includes the bounded two-observation geometry-stability condition, final visible/ARIA polling, poll cadence, and browser/Playwright communication. Likewise, `firstEligibleFrameLatencyMs` records frame-boundary eligibility, not actual paint, compositing, or pixel presentation. The run therefore does not prove that the option was physically presented within 100 ms, and it does not certify the 100 ms candidate as met. It does establish that the old confirmation measurement alone should not be attributed to approximately 200 ms of component rendering. Instrumentation's paired End-to-visible differences ranged from −21.045 to +7.655 ms, while paired first-frame differences ranged from −3.030 to +0.515 ms; neither is a deterministic correction, and no overhead is subtracted from the measurements.

This is one hosted run with five measured pairs on one runner. The observed p95/p99 for each five-sample distribution is its maximum; independent repeated runs are required before any release-budget decision. The result is diagnostic only: no threshold or runtime behavior changed, and C.3C does not authorize optimization. PR #37 had already merged before all PR checks completed; the successful benchmark job and post-merge checks do not erase that process exception. At the latest review, PR #37's CI and Tests runs remained incomplete (8/10 Tests jobs passed, with critical-path and Vue E2E still running), while its Phase 4 and Performance Baseline workflows passed 4/4. Post-merge CI, Tests (11/11), and Phase 4 Certification (4/4) all passed. Production virtualization remains **NO-GO**.

## Phase 4.6.2C.5 — Performance measurement contract and budget proposal

### Proposed release measurement contract

This section is an analysis proposal only. It does not change benchmark code, production behavior, or any proposed threshold. The current report-only End-key candidates remain unapproved and must not become CI failures without a separate decision.

The only C.3B frame-attribution run analyzed to date is [run #39921962487](https://github.com/navidrezadoost/Smilodon/actions/runs/39921962487). A controlled multi-run replication series has not yet been collected; the run counts below are proposed evidence requirements, not completed certification.

| Measure | Operational definition | Contract role |
| --- | --- | --- |
| `eventToHandlerReturnMs` | Browser `performance.now()` at the single End keydown capture through the input bubble observation after synchronous key handlers return. | Synchronous main-thread diagnostic; not a paint or end-to-end metric. |
| `firstEligibleFrameLatencyMs` | End keydown capture through the first `requestAnimationFrame` callback that verifies option 99,999 is mounted, intersects the list viewport, is active by index and key, and is the valid `aria-activedescendant`. | Recommended primary metric for a specifically named **render-ready frame** requirement, subject to owner acceptance. It is not proof of paint or pixel presentation. |
| `targetMountedAt` | First `MutationObserver` callback timestamp that observes the target inserted beneath the component shadow root. | Attribution diagnostic only; callback time is not exact insertion time. |
| Stable-geometry completion | First point at which the target remains visible with the same scroll/rectangle signature across two bounded poll observations. | Correctness/settling evidence; not a component-latency SLO. |
| `observedEndToVisibleMs` | End keydown capture through Playwright's successful stable-layout and final visible/ARIA condition poll. | End-to-end test confirmation diagnostic. Includes poll cadence and browser/Playwright communication; do not label it pure component latency. |
| Future presentation latency | End event through a validated browser presentation/compositor or pixel-observation boundary, if the product requirement promises pixels on screen. | Not currently measured. Do not substitute the rAF eligibility timestamp; validate a presentation method before defining a visual-presentation release gate. |

Recommendation: if the product requirement is that keyboard navigation has made the target render-ready for the browser's next frame, use `firstEligibleFrameLatencyMs` as the primary candidate metric and name it accordingly. Report handler return and stable-geometry/Playwright confirmation separately. If the product promise is that pixels are visibly presented, no current metric in this harness is sufficient to certify that promise; add and validate a presentation measure first. The existing 100 ms End-to-visible candidate must not be silently reassigned to the first-frame boundary. Until a product owner explicitly accepts the semantic mapping and budget, all latency criteria remain report-only.

Minimal and instrumented arms must use the same browser revision, deterministic fixture and hash, viewport, item dimensions, interaction sequence, fresh-context policy, and polling protocol. Alternate arm order across pairs and alternate the starting order across independent workflow runs. Use the minimally instrumented arm for the primary latency distribution; retain method wrappers only for attribution. Keep paired differences signed and report them as instrumentation diagnostics—never subtract them as a correction. Method-level phases are nested/overlapping and are not summed.

### Controlled replication and statistical plan

The C.3C report is one hosted run with five measured pairs. It establishes useful measurement semantics, not between-run stability. For the next controlled study, keep the fixture fingerprint, Node/Playwright/browser versions, viewport, test commit, and interaction sequence fixed. Record each workflow run ID, tested commit, runner image/version, OS/kernel, CPU model and available cores, memory, browser revision, warm-up policy, raw per-trial data, and correctness outcome. Report each run separately and compare between-run distributions. Stratify by actual runner/hardware profile; do not pool materially different CPUs or runner images into a single homogeneous percentile.

Proposed minimum evidence before considering a p95 budget: 100 measured pairs per runner/browser profile across at least 20 independent hosted workflow runs (five measured pairs per run, plus one excluded warm-up pair). Report per-run results and a 95% run-clustered bootstrap interval for the primary metric's p95; if the interval is too wide to support the decision, gather more independent runs. A screening calculation under independent sampling gives a 99.4% chance that 100 observations include at least one sample from the slowest 5% of the population, but this is not by itself a precise p95 estimate; clustering and between-run variability must be represented.

Do not certify a p99 from the current five-pair evidence or from the p95 study alone. A p99 proposal should have at least 300 measured observations per profile across at least 30 independent hosted runs, with run-clustered uncertainty reported; under independent sampling, 300 observations provide about a 95.1% chance of reaching at least one observation from the slowest 1%. This remains a minimum screening target, not a guarantee of narrow confidence bounds. If a confidence interval cannot distinguish pass, fail, or inconclusive, collect more independent runs rather than treating the point estimate as decisive. Warm-ups and incomplete/correctness-invalid pairs do not enter latency percentiles; their outcomes remain visible in the report and any correctness failure remains a hard failure.

### Candidate disposition and independent correctness gates

| Existing proposal | Current evidence | C.5 disposition |
| --- | --- | --- |
| End → visible p95 ≤100 ms | The historical `observedEndToVisibleMs` confirmation p95 was 217.670 ms minimal / 215.450 ms instrumented at n=5. C.3C measured first-frame eligibility separately at 64.235 / 62.575 ms p95, but that boundary is not paint. | Preserve as an unapproved report-only candidate. Do not call it passed, failed as a component-render budget, or transfer it to the frame metric without explicit semantic approval and adequate replication. |
| End → visible p99 ≤250 ms | Five trials cannot support a population p99 claim. | Preserve as an unapproved report-only candidate; no certification decision. |
| Any future first-eligible-frame budget | The first run is below 100 ms, but one runner and five pairs do not establish population behavior, and rAF eligibility is not presentation. | Candidate metric only; no threshold is assigned or enforced by this proposal. |

Latency evidence never compensates for correctness failure. Each measured navigation must independently preserve: exactly one intended End event; correct final option identity and active state; valid `aria-activedescendant` resolving to the mounted target; target intersection with the list viewport; the existing mounted-option ceiling; no uncaught browser errors; and the separately certified lifecycle/resource-cleanup guarantees. Any invalid correctness attempt remains reported, contributes no latency sample, and blocks acceptance of that run's correctness gate.

The C.5 decision requested from reviewers is whether to adopt the render-ready-frame contract for a future performance requirement or require a separately validated presentation metric, and whether to approve the proposed replication/sample plan. No threshold is accepted or changed here, no CI performance budget is enabled, and Phase 4.6.2C.4 optimization remains unauthorized. Accessibility certification, the feature-completeness audit, and production activation remain pending; production virtualization remains **NO-GO**.

## Phase 4.6.2C.5A — Controlled replication and aggregation infrastructure

The C.5A implementation adds a manually dispatched, report-only workflow at `.github/workflows/phase-4-endkey-replication.yml`. Its default is one pinned-Chromium source job; a dispatch may explicitly request up to five hosted runner jobs. The PR preflight also runs one source job when these scoped benchmark files change. No schedule or larger measurement matrix is configured. Every source job checks out the exact workflow SHA, installs from `package-lock.json`, uses the Playwright-pinned Chromium build, and records Node/Playwright/browser versions, fixture SHA-256, viewport, commit, runner image and CPU metadata, workflow run/attempt, and replication index. The existing one warm-up and five measured pairs are retained. Pair order alternates, and the starting arm is derived from workflow-run and replication-index parity so adjacent dispatches and jobs alternate without treating the two arms as independent fixtures.

`scripts/aggregate-phase-4-endkey-replication.mjs` recursively consumes the source JSON reports, checks their schema, pinned browser, commit, fixture and viewport metadata, complete alternating pair plan, timestamps, instrumentation interception, final visible/ARIA correctness, browser errors, and finite non-negative measurements. It retains each source SHA and all raw attempts, including warm-ups and failures, while excluding warm-ups from estimates and excluding an invalid or partial source from latency calculations. Expected missing artifacts or invalid reports make the integrity result fail and leave a diagnostic analysis artifact; there is no latency threshold in the workflow.

Valid results are split by exact software/fixture/viewport compatibility and runner hardware/image profile; no heterogeneous stratum is pooled. Matrix reports from a single GitHub workflow run are combined as one statistical cluster, not misrepresented as independent workflow runs. `.github/workflows/phase-4-endkey-replication-analysis.yml` retrieves selected source artifacts by run ID and regenerates the analysis without manual artifact merging; it requires one source report per selected workflow run. The analysis reports pooled raw distributions, per-run percentiles, and a deterministic two-stage run-cluster bootstrap interval. An optional threshold can be supplied to the CLI for an explicitly labeled analysis (`supported`, `unsupported`, or `inconclusive`); none is supplied by CI, so current output remains `inconclusive` and report-only. The p95 and p99 run/pair counts remain study-planning requirements, not automatic certification criteria.

Deterministic cases are covered by `npm run test:benchmark:phase4:replication`, including mixed hardware, missing artifacts, duplicate source runs, invalid measurements, incomplete pairs, one dispatch with multiple matrix jobs, and all three classification outcomes. C.5A hosted acceptance remains pending until the PR test job and initial pinned-browser workflow artifact are reviewed. No result from this infrastructure authorizes threshold enforcement, runtime changes, accessibility sign-off, or public virtualization; production remains **NO-GO**.
