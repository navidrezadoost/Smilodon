# Web release candidate — Core 1.19.0 and React 1.12.2

Status: **Locally qualified integration candidate; not merged or published**

Source integration: `9cfa8f29dcc664ffff9095c2e800ccf89b776ccc` plus a release-prep correction to the #114 clear-control test
Baseline: `ab28fcf850ec3044b2655e1f6677040c894462bb`

This record covers the combined Issues #112, #114, and #115 changes. It is preparation evidence, not evidence of npm publication or registry-installed qualification for these candidate versions.

## Candidate package versions

| Package | Candidate version | Registry state checked 2026-11-22 |
| --- | --- | --- |
| `@smilodon/core` | `1.19.0` | Version query returned `E404`; available to publish at check time. |
| `@smilodon/react` | `1.12.2` | Version query returned `E404`; available to publish at check time. |

Published versions remain Core `1.18.0` and React `1.12.1`. Core `1.19.0` is a minor release for the additive arrow positioning token and React `1.12.2` is a patch release for renderer lifecycle behavior. The root private workspace version follows Core; Vue, Solid, Vanilla, and Svelte versions are unchanged. React's existing Core peer range `^1.13.0` includes Core `1.19.0` by semver, but the React consumer smoke was run against the published Core `1.18.0`; compatibility against `1.19.0` is not claimed by that smoke.

## Changes for developers

- **Core — Issue #114:** `--select-arrow-container-position` controls the arrow container's CSS `position`; the default remains `absolute`. See the [styling token reference](../STYLING-TOKENS.md#arrow-separator-and-clear-control) and [Core README custom-arrow section](../../packages/core/README.md#custom-arrow-slot).
- **Core — Issue #115:** group headers use logical `start` alignment by default, follow Core's effective direction, and preserve explicit `left`, `right`, and `center` overrides. See the [group-header tokens](../STYLING-TOKENS.md#group-headers-and-options) and the group-header guidance in the [Core README](../../packages/core/README.md).
- **React — Issue #112:** React retains custom option and group-header renderer roots while controlled rerenders preserve Core-accepted acknowledged pages. See the [React README](../../packages/react/README.md#react-item-synchronization-and-acknowledged-pagination) and [lifecycle design record](../architecture/ISSUE-112-REACT-RENDERER-CACHE-LIFECYCLE.md).

React Native is excluded. Android runtime certification remains blocked by physical-device availability, and iOS runtime qualification remains outstanding.

## Local qualification evidence

On the unversioned integration source `9cfa8f29dcc664ffff9095c2e800ccf89b776ccc`, the report records Core/React/Vue/Solid/Vanilla/Svelte builds passed, 775 tests passed and 7 skipped, four focused React renderer-cache tests passed, lint with zero errors and six existing warnings, and 32/32 combined browser scenarios on system Chrome 133. A packed React `1.12.1` consumer smoke with registry Core `1.18.0` retained 18 custom option roots over three acknowledged pages and a controlled rerender.

The versioned candidate was requalified locally with Node `26.10.0` and npm `12.2.0`. All workspace builds passed; the generated React Native bundle was restored to its exact committed bytes afterward. `npm test` passed 775 tests with 7 skips. The React/Solid packed-consumer script passed strict NodeNext and Bundler checks. Lint passed with zero errors and six existing warnings. `git diff --check` passed.

The combined browser regression passed 32/32 on system Chrome `133.0.6943.126`: 27 React/arrow scenarios and 5 group-header scenarios. During this rerun, the #114 clear-control scenario exposed an incorrect expectation that multi-select stays open after a selection, contrary to Core's default `closeOnSelect: true`. The assertion now checks the documented default close behavior; the follow-up arrow and clear interactions passed. Repository-pinned Chromium 147, Firefox, and WebKit remain unverified. Core `1.19.0` consumer compatibility and delayed custom-element registration coverage are unverified. The Load More browser regression uses keyboard activation after pointer targeting timed out on a replaced button; this is not a pointer-activation result. Core arrow `static` positioning with a visible clear control and exhaustive input/arrow overlap geometry were not separately tested.

Candidate npm-pack artifacts:

| Package | File | SHA-256 | npm shasum | npm SRI |
| --- | --- | --- | --- | --- |
| Core `1.19.0` | `smilodon-core-1.19.0.tgz` | `a6bb0cc02f3f747de282d1643de53e249bf4c48b02130ff0676059d68fb303bf` | `4cd1c62dad87259f6b9eb1136baed10b00f1fd4a` | `sha512-1ktqzOLOVZKwwsZdDjUuuxC4E6ic8mYf7HTfEmS3ck3lR0TgySX7g5iAE8R1SWFiaVR4hK8Jrt6VDcPxtPmLWw==` |
| React `1.12.2` | `smilodon-react-1.12.2.tgz` | `37b071e5a5838b047a67b05a6a740a0e74c37af64461502a2e3164f3b9fe03b4` | `dd5aee7e9ce3baa9baed43c5cd19095072b4d3e9` | `sha512-dmRpFv75hpRj8lHzKcw/s6F5reyuFMoFtsX+k2sjDCHELmm3RwPiKkvJiAnKCs1dY3Og2WtpEs1077RwCtedxw==` |

Both packed packages installed together in a temporary consumer with React `18.3.1`; ESM package imports resolved and the strict packed consumer checks passed. This is local-tarball evidence, not registry installation or a full browser runtime test of the published packages. The failed first Playwright invocation using the nonexistent project name `chromium` was a command-selection error; the Chrome 133 runs used the configured React Chromium project and a temporary config pointing to the system browser.

The install reported 14 npm audit findings and blocked install scripts for two esbuild entries and `svelte-preprocess`. These are retained as environment observations, not classified as regressions introduced by this candidate.

## Publication sequence

1. Integrate the versioned candidate through the repository's normal protected-branch process; keep hosted Actions disabled per the active local-qualification policy.
2. On the exact approved source commit, run the applicable builds, tests, lint, browser checks, and packed consumer qualification. Pack Core and React separately and record SHA-256, npm shasum, and SRI values.
3. Recheck that Core `1.19.0` and React `1.12.2` remain unused immediately before publication. Publish Core first, then React.
4. Install both packages from npm in a clean consumer and verify package versions, integrity metadata, TypeScript declarations, runtime imports, and the three issue scenarios. Do not substitute local tarballs for registry-installed results.
5. Only after those checks, update this record with publication date, source commit, tarball hashes, registry integrity values, and consumer results.

No package has been published by this candidate-preparation change.
