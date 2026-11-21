# Smilodon Web Release 1.17.0 — Candidate Checklist

Status: **Release candidate prepared; local qualification and npm publication are pending.**

Source baseline: `main` at `8daaf642d382c7bc8129d51ebd4a4d79c07951b8` (includes PR #102 / Issue #100).

This is a cumulative web-package release. Do not treat candidate versions as available until npm publication and clean registry-consumer verification are recorded here.

## Candidate package versions

| Package | Candidate version | npm latest at preflight | Candidate version preflight |
| --- | --- | --- | --- |
| `@smilodon/core` | `1.17.0` | `1.13.0` | Not present (2026-11-21) |
| `@smilodon/react` | `1.12.0` | `1.11.0` | Not present (2026-11-21) |
| `@smilodon/vue` | `1.11.0` | `1.10.1` | Not present (2026-11-21) |
| `@smilodon/solid` | `1.11.0` | `1.10.1` | Not present (2026-11-21) |
| `@smilodon/vanilla` | `1.11.0` | `1.10.1` | Not present (2026-11-21) |
| `@smilodon/svelte` | `2.1.0` | `2.0.0` | Not present (2026-11-21) |

Core moves from the published `1.13.0` to `1.17.0` because this candidate contains the accumulated Core changes through Issue #100. React Native is excluded. Svelte `2.1.0` supports Svelte 5 only; this release does not restore Svelte 3 or 4 compatibility.

## Included merged changes

- Issue #90: Core busy-bucket slots and web-adapter presentation APIs.
- Issue #92: render the terminal empty state after accepted remote-search results settle.
- Issue #93: custom empty-state content through the Core slot and adapter APIs.
- Issue #96: keyboard request for the next acknowledged infinite-scroll page.
- Issue #97: accept React nodes for the React `removeButtonIcon` prop.
- Issue #100: opt-in horizontal selected-chip auto-scroll, including reduced-motion and RTL handling.

Issue #85 is not merged into this baseline and is excluded. Android and iOS React Native runtime qualification is also excluded and remains outstanding.

## Qualification record

Qualification below is local evidence on the source candidate at `8daaf642d382c7bc8129d51ebd4a4d79c07951b8`, plus the exact release-version packages built from this release branch. The package version and README/changelog changes are the only source-tree changes beyond that baseline. npm publication and registry-installed smoke tests remain pending.

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
| Tarball contents and integrity | Packed all six candidate versions; SHA-256 values are in [`WEB-1.17.0-SHA256SUMS.txt`](./WEB-1.17.0-SHA256SUMS.txt), with SHA-1 shasum, size, and SRI in [`WEB-1.17.0-ARTIFACTS.json`](./WEB-1.17.0-ARTIFACTS.json). Core: 52 files; React: 11; Vue: 11; Solid: 11; Vanilla: 8; Svelte: 10. |
| Clean install from npm after publication | Pending publication. |
| Registry-installed import, TypeScript, and runtime smoke tests | Pending publication. |
| GitHub release and attached provenance | Pending |

For Issue #100 specifically, the local isolated-worktree qualification on commit `91bf39280b15e8a82d26a4d09ac6ab8d8075a497` passed the Core build, full `npm test`, strict packed React/Solid NodeNext and Bundler checks, lint, and six system-Chrome 133 browser scenarios. Pinned Playwright Chromium 147, Firefox, and WebKit were not available. The release-branch suite must be rerun after the version and documentation changes; this earlier result is scoped evidence, not a pass for the complete candidate.

## Publication sequence

1. Merge the release-preparation change through the repository's normal protected-branch process. Do not publish from a branch that is not integrated into `main`.
2. On the exact merged commit, run the gates above and build/package the six versions from the workspace lockfile.
3. Before each `npm publish`, confirm that the exact target version remains unoccupied. Publish Core first, then React, Vue, Solid, Vanilla, and Svelte.
4. Record each published package's `dist.integrity`, `dist.shasum`, and downloaded tarball SHA-256. Compare these with the locally qualified archives.
5. In a clean consumer project, install the actual registry versions and run package import, strict TypeScript (`skipLibCheck: false`), and runtime smoke checks. Keep Svelte 5 and all other peer versions explicit.
6. Create the GitHub Release only after all six registry-installed consumer checks pass. Attach the checksums and qualification evidence; state that React Native is excluded and that pinned browser gaps remain.

The first Svelte fixture install stalled when the environment's npm proxy connections closed without completing the install. Rerunning the same fixture in npm offline mode using the populated local cache passed typecheck and production build. This is recorded as a transient registry-path issue; the package check itself passed.

Publication status: **not performed by this candidate preparation.** npm authentication is available to the local maintainer account, but packages must not be published until this release commit is integrated into `main`. No credentials or registry tokens are recorded in this document.
