# Web package release — Core 1.19.0 and React 1.12.2

Publication date: 2026-11-22
Status: **Published to npm; GitHub source integration remains pending**
Published source commit: `dfe52cf6ccf51aa93d8b9ea36c47ba8b11cbfa4f` (`integration/112-114-115`)
Integration baseline: `ab28fcf850ec3044b2655e1f6677040c894462bb`

This release contains the combined Issues #109, #112, #114, and #115 work. Core and React were published separately; other adapter versions were unchanged. The candidate source commit is local and has not been merged to GitHub `main`. The npm packages are published and installable; this record preserves that source-integration limitation explicitly.

## Published packages and registry integrity

| Package | Version | Registry shasum | Registry integrity (SRI) | Downloaded tarball SHA-256 |
| --- | --- | --- | --- | --- |
| `@smilodon/core` | `1.19.0` | `4cd1c62dad87259f6b9eb1136baed10b00f1fd4a` | `sha512-1ktqzOLOVZKwwsZdDjUuuxC4E6ic8mYf7HTfEmS3ck3lR0TgySX7g5iAE8R1SWFiaVR4hK8Jrt6VDcPxtPmLWw==` | `a6bb0cc02f3f747de282d1643de53e249bf4c48b02130ff0676059d68fb303bf` |
| `@smilodon/react` | `1.12.2` | `dd5aee7e9ce3baa9baed43c5cd19095072b4d3e9` | `sha512-dmRpFv75hpRj8lHzKcw/s6F5reyuFMoFtsX+k2sjDCHELmm3RwPiKkvJiAnKCs1dY3Og2WtpEs1077RwCtedxw==` | `37b071e5a5838b047a67b05a6a740a0e74c37af64461502a2e3164f3b9fe03b4` |

The downloaded registry tarballs match the local packed artifacts by SHA-256. `npm view` reported the same shasum and SRI values. React retains its existing Core peer range `^1.13.0`, which includes Core `1.19.0`.

## Changes for developers

- **Core — Issue #109:** `dataLoading.minSearchCharacters` suppresses acknowledged remote/hybrid searches below the configured threshold while preserving independent browse data and pagination. Default `0` preserves existing behavior. See the [acknowledged data-loading guide](../../packages/core/README.md#acknowledged-data-loading) and [Issue #109 qualification record](../architecture/ISSUE-109-MIN-SEARCH-CHARACTERS.md).
- **Core — Issue #114:** `--select-arrow-container-position` controls the arrow container's CSS `position`; the default remains `absolute`. See the [styling token reference](../STYLING-TOKENS.md#arrow-separator-and-clear-control) and [Core README](../../packages/core/README.md#custom-arrow-slot).
- **Core — Issue #115:** Group headers use logical `start` alignment by default, follow Core's effective direction, and preserve explicit `left`, `right`, and `center` overrides. See the [group-header tokens](../STYLING-TOKENS.md#group-headers-and-options) and [Core README](../../packages/core/README.md).
- **React — Issue #112:** React preserves custom option and group-header renderer roots while Core retains cumulative accepted pages across acknowledged requests and equivalent controlled rerenders. See the [React README](../../packages/react/README.md#react-item-synchronization-and-acknowledged-pagination) and [lifecycle design record](../architecture/ISSUE-112-REACT-RENDERER-CACHE-LIFECYCLE.md).

React Native is excluded. Android runtime qualification remains blocked by physical-device availability, and iOS runtime qualification remains outstanding.

## Qualification and registry consumer verification

The versioned local candidate was qualified with Node `26.10.0` and npm `12.2.0`. All workspace builds passed; the generated React Native bundle was restored to its exact committed bytes. `npm test` passed 775 tests with 7 skips. Strict packed React/Solid TypeScript consumers passed in NodeNext and Bundler modes. Lint passed with zero errors and six existing warnings. The combined browser suite passed 32/32 on system Chrome `133.0.6943.126`.

A clean temporary project installed Core `1.19.0` and React `1.12.2` from the public npm registry with React `18.3.1`. Strict TypeScript checks passed for NodeNext and Bundler resolution with `skipLibCheck: false`. ESM imports and a React server-render smoke passed; it rendered the `<enhanced-select>` host. Registry metadata and downloaded tarball hashes matched the records above.

Browser limits remain: pinned Chromium 147, Firefox, and WebKit were not verified. The Load More browser regression uses keyboard activation after pointer targeting timed out on a replaced button; this does not establish pointer activation for that scenario. Core arrow `static` positioning with a visible clear control and exhaustive input/arrow overlap geometry were not separately tested. Delayed custom-element registration lacks a dedicated regression. The 14 npm audit findings and blocked install scripts for two esbuild entries and `svelte-preprocess` were observed during install; they were not classified as regressions caused by this release.

No GitHub Release was created as part of the npm publication.

## Published README snapshot limitation

The registry tarballs were inspected after publication. Their embedded `package/README.md` files predate the final documentation correction: Core still labels `1.19.0` unpublished, and React still labels `1.12.2` a candidate while listing earlier package versions. npm does not permit replacing the contents of an already-published version. The repository README files now reflect the release accurately, but those corrected README snapshots are not inside the published tarballs. A later package version would be required to update the package-page README content; no additional version is authorized or published by this record.
