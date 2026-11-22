# React 1.12.1 — Release and Registry Verification

Status: **locally qualified; npm publication and registry-consumer verification pending**

This is a React-only patch release for Issue #107. The source correction was merged in PR #108. The package version is advanced from `1.12.0` to `1.12.1`; the public peer ranges and all other package versions are unchanged.

## Fixes available to users

The three related fixes span two packages and are available through these exact npm versions:

| Issue | Package and version | Behavior |
| --- | --- | --- |
| [#100](https://github.com/navidrezadoost/Smilodon/issues/100) | `@smilodon/core@1.17.0` | Opt-in `multiSelectDisplay.scrollToLatestChip` reveals newly selected chips in horizontal multi-select mode. |
| [#104](https://github.com/navidrezadoost/Smilodon/issues/104) | `@smilodon/core@1.18.0` | Custom slotted arrows honor `--select-arrow-hover-bg`; fallback SVG content does not keep the custom-arrow marker set. |
| [#107](https://github.com/navidrezadoost/Smilodon/issues/107) | `@smilodon/react@1.12.1` | Equivalent fresh React source/configuration props no longer replace Core-accepted acknowledged pages during rerenders. |

The Core `1.17.0` and `1.18.0` versions are already published. This release publishes only React `1.12.1`; it does not republish an existing Core version. React `1.12.1` retains the peer dependency `@smilodon/core: ^1.13.0`, which admits Core `1.18.0`.

## Source and package identity

- Merged source PR: [#108](https://github.com/navidrezadoost/Smilodon/pull/108)
- Source commit on `main`: `01378ea18ec56dac7fac18803e1384c6cf729114`
- Source tree: `dd2ca396d6ebbce9edd8159a6b15a3538bd9b052`
- Release-preparation branch: `release/react-1.12.1-issues-100-104-107`
- Package: `@smilodon/react@1.12.1`
- Registry: `https://registry.npmjs.org/`

The release package is built from the source tree above with only the React package version and workspace lock entry changed for this release. Documentation records the release map and user-facing behavior. React Native is outside this web package release; Android and iOS runtime qualification remain incomplete.

## Local qualification

Qualification on this versioned tree used Node `20.20.2` and npm `10.8.2`:

- `npm ci`
- React and Core builds; full workspace build
- `npm test`, lint, and packed React/Solid consumer checks
- React browser suite: 14/14 passed on system Chrome `133.0.6943.126`; pinned Playwright Chromium 147, Firefox, and WebKit were unavailable
- `npm pack --workspace @smilodon/react`: 11 files, 90.5 kB compressed, 378.1 kB unpacked; SHA-256 `d901a4724513aa2090b781abd4f8f8d9198e39609bb83c50ed5484498eda86ab`, SHA-1 `21db455b37498b75810a5ace8c2c896d133188fa`
- Packed React installed in a clean consumer alongside registry Core `1.18.0`, React/React DOM `18.3.1`; strict NodeNext and Bundler type checks passed with `skipLibCheck: false`
- JSDOM runtime import smoke passed for Core and React; the `Select` export produced a valid React element
- `npm ci` reported 14 existing lockfile audit findings (1 low, 13 moderate); no dependency changes were made

Test results: React integration tests 46/46; React contracts 44 passed, 6 skipped; the full suite passed with 655 Core tests and 40 data-loading tests plus 66 contracts, with 7 skipped total; packed React/Solid strict NodeNext/Bundler checks passed; full workspace build passed; lint passed with zero errors and six existing warnings; `git diff --check` passed. The full build rewrote the tracked React Native bundle; its baseline SHA-256 `e221dc43cdf8c5529a76c479ce855af2eb3c608cd6c04fe96f99fdab4dfb3fc1` was restored and verified.

Hosted GitHub Actions are not part of this qualification. Preserve test output, the exact tarball, lockfile integrity, and generated-artifact hash evidence locally.

## npm publication record

Publication has not yet been recorded. After publishing, add the registry-returned version, `dist.integrity`, shasum, local SHA-256, publication timestamp, and the result of installing `@smilodon/react@1.12.1` with `@smilodon/core@1.18.0` in a clean consumer. Do not claim registry verification based on a local tarball install.

## Limitations

- This patch does not change Core's request coordinator or imperative `setItems()` semantics.
- Functions and non-plain metadata are compared by identity; immutable updates are required for nested record changes.
- The reporter's exact original React/Core lockfile was unavailable; the consumer check validates the release pair, not that specific installation.
- This is not React Native runtime qualification or a manual accessibility certification.
