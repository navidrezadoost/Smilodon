# Smilodon Web Release 1.17.0 — Release Record

Status: **Published to npm; registry tarball and consumer verification passed. GitHub Release creation remains pending.**

Source baseline: `main` at `8daaf642d382c7bc8129d51ebd4a4d79c07951b8` (includes PR #102 / Issue #100).

This is a cumulative web-package release. All six packages were published on 2026-11-21. Registry integrity and consumer results are recorded in [registry verification](./WEB-1.17.0-REGISTRY-VERIFICATION.json).

## Published package versions

| Package | Published version | Previous npm latest | Current npm latest |
| --- | --- | --- | --- |
| `@smilodon/core` | `1.17.0` | `1.13.0` | Published; `latest` is `1.17.0` |
| `@smilodon/react` | `1.12.0` | `1.11.0` | Published; `latest` is `1.12.0` |
| `@smilodon/vue` | `1.11.0` | `1.10.1` | Published; `latest` is `1.11.0` |
| `@smilodon/solid` | `1.11.0` | `1.10.1` | Published; `latest` is `1.11.0` |
| `@smilodon/vanilla` | `1.11.0` | `1.10.1` | Published; `latest` is `1.11.0` |
| `@smilodon/svelte` | `2.1.0` | `2.0.0` | Published; `latest` is `2.1.0` |

Core moved from the published `1.13.0` to `1.17.0` because this release contains the accumulated Core changes through Issue #100. React Native is excluded. Svelte `2.1.0` supports Svelte 5 only; this release does not restore Svelte 3 or 4 compatibility.

## Included merged changes

- Issue #90: Core busy-bucket slots and web-adapter presentation APIs.
- Issue #92: render the terminal empty state after accepted remote-search results settle.
- Issue #93: custom empty-state content through the Core slot and adapter APIs.
- Issue #96: keyboard request for the next acknowledged infinite-scroll page.
- Issue #97: accept React nodes for the React `removeButtonIcon` prop.
- Issue #100: opt-in horizontal selected-chip auto-scroll, including reduced-motion and RTL handling.

Issue #85 is not merged into this baseline and is excluded. Android and iOS React Native runtime qualification is also excluded and remains outstanding.

## Qualification record

Qualification below is local evidence on the source baseline at `8daaf642d382c7bc8129d51ebd4a4d79c07951b8` and release packages built from the exact merged tree at `6c2e0f17d9cc0139081f75495d7871ec045a0e6b`.

| Gate | Result |
| --- | --- |
| Node/npm version and clean install | Passed: Node `20.20.2`, npm `10.8.2`; `npm ci` added 742 packages. Audit summary: 1 low and 13 moderate findings. |
| Full workspace build | Passed; all workspaces built. Existing Rollup/Vite warnings only. Generated React Native bundle was restored to baseline SHA-256 `e221dc43cdf8c5529a76c479ce855af2eb3c608cd6c04fe96f99fdab4dfb3fc1`. |
| Lint | Passed: 0 errors, 6 existing warnings. |
| Unit and contract suites | Passed: 4 discovery, 654 Core unit (1 skipped), 40 data-loading, 66 contracts (6 skipped). No new skips reported. |
| Packed Core Node 18 consumer | Passed on Node `18.20.6` / npm `10.8.2`; strict NodeNext and Bundler, `skipLibCheck: false`. |
| Packed React/Solid consumer | Passed: React `18.3.1` and Solid `1.9`, strict NodeNext and Bundler. |
| Packed Vue/Vanilla consumer | Passed: Vue `3.5.45`, TypeScript `5.9.3`, strict NodeNext and Bundler. |
| Packed Svelte consumer | Passed: Svelte `5.57.3`, strict declaration check and production Vite build. Declared Svelte peer range is `^5.0.0`. |
| Issue #100 browser regression | Passed: all 6 scenarios in installed Google Chrome `133`; includes visibility after entrance animation, RTL, reduced motion, keyboard selection, and manual drag. Pinned Chromium 147, Firefox, and WebKit were unavailable and are not certified. |
| Tarball contents and integrity | Packed all six released versions; SHA-256 values are in [`WEB-1.17.0-SHA256SUMS.txt`](./WEB-1.17.0-SHA256SUMS.txt), with SHA-1 shasum, size, and SRI in [`WEB-1.17.0-ARTIFACTS.json`](./WEB-1.17.0-ARTIFACTS.json). Core: 52 files; React: 11; Vue: 11; Solid: 11; Vanilla: 8; Svelte: 10. |
| Registry package installation | Passed in a clean consumer using npm’s cached registry metadata and tarballs fetched from npm; the lock resolves the six exact registry URLs and SRI values. A separate online install attempt stalled behind the environment proxy and was stopped. |
| Registry consumer type checks | Passed NodeNext and Bundler with `strict: true` and `skipLibCheck: false` for Core/React/Vue/Solid/Vanilla; Svelte 5 consumer check also passed against the exact archive, which matched the registry tarball byte-for-byte. |
| Registry browser runtime smoke | Passed Vite production build and Chrome 133 module-load smoke for all six published packages; this imported entry points but did not mount every framework component. |
| GitHub release and attached provenance | Pending |

For Issue #100 specifically, all six browser regression scenarios passed on the release package source in installed Chrome 133, covering post-animation visibility, unchanged geometry when disabled, RTL, reduced motion, keyboard selection, and drag scrolling. Pinned Playwright Chromium 147, Firefox, and WebKit were unavailable and remain unverified.

## Post-publication verification

1. PR #103 merged into `main` at `6c2e0f17d9cc0139081f75495d7871ec045a0e6b`; its tree matches the qualified release tree.
2. Published Core first, then React, Vue, Solid, Vanilla, and Svelte from the exact checksum-verified archives. All six npm `latest` tags point to the intended versions.
3. Downloaded each package with `npm pack` from the public registry and compared the archive byte-for-byte with the pre-publication archive. Registry `dist.integrity` and `dist.shasum` also match.
4. Installed all six exact versions in a clean consumer using npm's cache after fetching the registry metadata and tarballs. The lockfile records the public registry URLs and matching integrity values. A separate online install attempt stalled behind the environment proxy and did not complete.
5. Strict NodeNext and Bundler consumer checks passed with `strict: true` and `skipLibCheck: false` for Core, React, Vue, Solid, and Vanilla. The Svelte 5 consumer type/build check passed against the exact Svelte archive. Vite production bundling and a Chrome 133 headless import smoke passed for all six packages; this smoke imports entry points but does not mount every adapter component.
6. GitHub Release creation and attaching the provenance files remain pending; no GitHub Release was created as part of npm publication.

The first Svelte fixture install stalled when the environment's npm proxy connections closed without completing the install. Rerunning the same fixture in npm offline mode using the populated local cache passed typecheck and production build. This is recorded as a transient registry-path issue; the package check itself passed.

Publication status: **all six packages were published on 2026-11-21** after PR #103 merged. npm reports each target version as the `latest` dist-tag; all registry tarballs match the locally qualified archives by SHA-256, shasum, and SRI. The published package README snapshots retain the candidate-status wording that was present when those archives were built; repository documentation has been corrected after publication. npm does not allow changing README content for an existing version. No credentials or registry tokens are recorded here.
