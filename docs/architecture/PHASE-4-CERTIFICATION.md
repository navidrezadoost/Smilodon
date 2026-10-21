# Phase 4 Certification Record

## Status

Phase 4.6.1 infrastructure has been added. Certification is **pending execution** in a Node-enabled environment. Guarded virtualization remains test-only and production activation remains blocked.

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

The existing root Playwright configuration captures screenshots on failure and traces on retry. CI allows one retry so a failed first attempt retains a trace; the HTML report and test output directory are uploaded even when the browser job fails.

## Initial browser scenarios

`tests/e2e/phase-4-virtualization-certification.spec.ts` exercises the component in real browser layout and covers:

1. Open 10,000 flat options; inspect physical `scrollHeight`, mounted option DOM count, and option indices/positions at the beginning, midpoint, end, and after scrolling back.
2. Use keyboard navigation to materialize an initially unmounted last option; validate that `aria-activedescendant` resolves to a mounted node.
3. Preserve multiple selected values through window eviction and invoke selected-item positioning after filtering.
4. Filter/reorder while scrolled; exercise custom renderer dimensions and grouped fallback teardown.
5. Disconnect/reconnect and verify bounded mounted nodes remain after further scroll activity.

The scenarios assert browser-observed DOM geometry and counts in addition to checking state used to drive test setup.

## Execution evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Focused deferred Vitest suites | NOT RUN locally | Node/npm/npx are unavailable in this workspace shell. CI artifact pending. |
| Full `test:unit` | NOT RUN locally | Node/npm/npx are unavailable in this workspace shell. CI artifact pending. |
| TypeScript check | NOT RUN locally | Node/npm/npx are unavailable in this workspace shell. CI artifact pending. |
| Lint | NOT RUN locally | Node/npm/npx are unavailable in this workspace shell. CI artifact pending. |
| Build | NOT RUN locally | Node/npm/npx are unavailable in this workspace shell. CI artifact pending. |
| Chromium / Firefox / WebKit suite | NOT RUN locally | Node/npm/npx and Playwright launchers are unavailable in this workspace shell. CI artifacts pending. |
| Local working-tree `git diff --check` | PASS | Developer check only; the CI commit-range check is pending workflow execution. |

No failures have yet been classified because executable test results are not available. Any CI failures must be classified as implementation regression, incorrect test assumption, environment incompatibility, or pre-existing failure; do not weaken or skip assertions to obtain a pass.

## Phase 4.6.2 and release risks

Performance and memory benchmarking has **not** started. It requires reliable browser execution first. The benchmark plan must record runner/hardware, browser/runtime versions, dataset shape, repeated-run medians and high percentiles, and distinguish JavaScript heap from browser-process memory. Agree on performance thresholds before using the benchmark to make a release decision.

Accessibility certification and manual assistive-technology assessment have **not** started. The initial browser suite checks active-descendant integrity only; it does not constitute complete accessibility certification.

Production activation is blocked until CI evidence shows passing regression, lint, build, browser-interaction, and accessibility gates and an evidence-backed performance/memory assessment is reviewed.
