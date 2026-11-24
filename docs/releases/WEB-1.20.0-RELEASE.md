# Web release — Core 1.20.0 and adapter updates

Release date: 2026-11-23
Status: **Published to npm; registry metadata and clean consumer verified**
Source branch: `feat/selected-options-projection`
Base candidate: `b1dc563c1e405239634a1354c1f211fb984610d6`
Versioned source commit: `85811fcdafb4b72bdf1fb73e498168b3719f40d3` (package artifacts built from this tree)

## Features

This release combines two user-facing capabilities:

- **Selected-first option presentation:** Core's `selectedOptions.placement` adds an opt-in stable selected-first order. Grouped items remain within their source groups; source arrays, group identity, source indices, selected values, and caller-owned data are not reordered or mutated. The default remains original order.
- **Selected-option open positioning:** `scrollToSelected` supports `preserve`, `reveal`, and `align`, with target, behavior, and block options. The opening snapshot coordinates positioning with finite dropdown entrance animations, uses the internal options viewport, skips unnecessary movement, and cancels stale work on user interaction or lifecycle changes.

## Package matrix

| Package | Previous | Release | Reason |
| --- | ---: | ---: | --- |
| `@smilodon/core` | 1.19.0 | 1.20.0 | Owns the new configuration, projection, keyboard, and scroll behavior. |
| `@smilodon/react` | 1.12.2 | 1.13.0 | Exposes the shared Core configuration. |
| `@smilodon/vue` | 1.11.0 | 1.12.0 | Exposes the shared Core configuration. |
| `@smilodon/solid` | 1.11.0 | 1.12.0 | Exposes the shared Core configuration. |
| `@smilodon/vanilla` | 1.11.0 | 1.12.0 | Exposes the shared Core configuration through helpers. |
| `@smilodon/svelte` | 2.1.0 | 2.2.0 | Exposes the shared Core configuration; Svelte 5 only. |
| `@smilodon/react-native` | 1.10.0 | unchanged | Excluded: embedded Core bundle is unchanged and Android/iOS runtime behavior is not qualified. |

Adapter peer ranges already accept Core `1.20.0`; no peer-range change is required. React Native type/source forwarding is not a claim that the published native adapter implements or certifies this feature.

## Qualification

- Node.js `26.10.0`, npm `12.2.0`; clean `npm ci` completed. npm reported 14 audit findings (1 low, 13 moderate) and blocked install scripts for two esbuild entries and `svelte-preprocess`.
- All workspaces built. Existing Rollup `eval`, export-condition, source-map, and React `use client` warnings remain. The generated React Native Core bundle was restored to baseline SHA-256 `e221dc43cdf8c5529a76c479ce855af2eb3c608cd6c04fe96f99fdab4dfb3fc1`.
- Unit tests: Core 734 passed, 1 skipped; data-loading 48/48. Contracts: 72 passed, 6 skipped. Total: 854 passed, 7 skipped.
- Lint: 0 errors, 6 existing warnings. `git diff --check` passed.
- Strict packed consumer checks for Core, React, Vue, Svelte, Solid, and Vanilla passed in NodeNext and Bundler modes with `skipLibCheck: false`.
- Selected-options browser matrix: Chrome for Testing `156.0.8078.4` 14/14; pinned Playwright Firefox `148.0.2` 14/14. Pinned Chromium `147.0.7727.15` was unavailable because the Playwright CDN returned HTTP 403. WebKit `26.4` could not launch because this Manjaro host lacks `libicu74`, `libxml2`, and `libflite1`. No results are claimed for those engines.
- Android/iOS runtime was not tested. The selected-options feature is excluded from the React Native runtime claim.
- All six npm publishes completed. Registry version, shasum, and SRI matched the six local tarballs exactly. The published tarball SHA-256 and npm metadata are listed below.
- A clean temporary consumer installed all six exact versions from npm. Strict TypeScript checks passed in NodeNext and Bundler modes with `skipLibCheck: false`; ESM imports passed for all six packages with a DOM environment and the browser export condition. This import smoke is not a substitute for a real-browser integration run.
- Repository root and React README data-loading status text was corrected after publication because it still described the earlier Phase 2F-D candidate as unreleased. The package README snapshots in the already-published tarballs cannot be replaced; no extra React patch release was created solely for this documentation correction.

## Package contents and provenance

The workspace `files` allowlists limit each tarball to its `dist` directory, package README, and (for adapters) `COMPLETE-GUIDE.md`. Source tests, playground files, workflows, and architecture records are not included. Source maps under `dist` are retained, consistent with the current package build output.

Exact tarball SHA-256, npm shasum, and registry SRI are recorded below. The source commit is local and has not been pushed or merged to GitHub `main`; no hosted Actions run or GitHub source merge is implied by this npm release. React Native is not part of the publication set.

| Package | Version | Tarball SHA-256 | npm shasum | Registry SRI |
| --- | ---: | --- | --- | --- |
| `@smilodon/core` | 1.20.0 | `406092ae0610cdc39368418ca7101ef9e409d5605dcf7d3788da20b1a0c8e392` | `00c655dd2c1c4d63b6cab9d54746cb851be51e8d` | `sha512-/I+5ewSQXKfdvBu1hvE4hSmPLVuQyS4whnmeOaKy3YhJBalTFvCnBEzARDz0lu18Bm0/gpHT0T2qpjriU9B1ng==` |
| `@smilodon/react` | 1.13.0 | `27a86a7461aca426e2909aa1622af628ce50d2c42a1ee772dbd678980fd74604` | `a005073efe42b9cfd7937899b854bb9b723089e3` | `sha512-2TMlmqT9VcmjLh6mptCIXwPcANe5BPaZk1Jo6qsgfCHhtA3a5VXgGJFjsGCuNU9FhiQN5UvRmGqMrdg3I+FRSg==` |
| `@smilodon/vue` | 1.12.0 | `8b306f04dca703ffa989879d041bad2b091cbf9df923eee71e00f33914160199` | `7a4c53d5123460f78443095899925ab63ea9a1d7` | `sha512-roZD84P2zzJYx3w9Y7r46bwYoI/TxULDk/ZUUl6OHEPNQ+162ig1+OvAxDLtXQfnbSYFZSCQ71ELWV3h2m3u7A==` |
| `@smilodon/solid` | 1.12.0 | `58c9e217769f2c0d5377db578f41a2d83959cbe7cdc56f8d95031d685016cc63` | `aee4c96ef882afa4f3eb94c18df4276c3c321773` | `sha512-Pn+O4wA6kYLV1SZKdfMI7enl2bD5GKzMyVII0v9VSGsVWtD7q8EX04KUz/ExAVXZU719trOQ/PFm4TCc6K+8Zw==` |
| `@smilodon/vanilla` | 1.12.0 | `dc780e150c3695bd3ac06f295eb2af0e19dc98da17c6044f3e8ac1354b96946a` | `f52bc7af30fb0b13c8efa8d2ffd618045517a01c` | `sha512-3YKtUYQLbWnC2G6W6S1Po+OoYXx+UwEXqZtebNAyeIb2vl3PNkhOFmSAb8Xr3qR34/trAAjZMkPAlJFgrVNO2Q==` |
| `@smilodon/svelte` | 2.2.0 | `bfd260e42e2fe73c1711b4a82851f49471f4ac00ac80712bb1651fa1d3ffa11e` | `3d77c33cfda2cf29610c2849c55827faced7c6b5` | `sha512-MHzS6EPJiRT3XOfmGC7qqWkucwp6pAOhGy5qadbanVCxFDoB72Gr+/7+aIRf3MBUEPqM69BTMQyMPHfRILyS6g==` |
