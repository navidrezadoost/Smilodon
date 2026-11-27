# Core 1.21.0 — Release Candidate

Status: **Versioned and locally qualified; npm publication pending**

Candidate source: Issue #125 commit `c4b2cd472972cf518967bc158c262a6cce7cb861` on top of merged web release `057115b681d0c73688ae37fb98e5955a3ccb9709`

Previous published Core version: `1.20.0` (verified against the npm registry on 2026-11-27)

Proposed version: `1.21.0` (registry lookup confirmed this version is unoccupied)

## Release scope

This is a **Core-only** release. The candidate includes the reviewed changes from Issues #119–123 and #125:

- **#120 — Independent input and arrow padding tokens:** separate styling controls for the input-content wrapper and dropdown arrow container.
- **#121 — Selected-label tooltip:** show the resolved full label on hover/focus only when the selected value or chip is truncated.
- **#125 — Multi-select chip enter/exit animations:** keyed chip presentation preserves identity; logical selection and events remain immediate while opt-in exit animation runs. Reduced motion, interruption, accessibility, and cleanup are handled by Core.
- **#119, #122, #123 fixes:** prevent custom slotted-arrow double toggles, preserve native Ctrl/Cmd+A behavior in searchable inputs, and allow Space to edit a searchable query.

## Package matrix

| Package | Current npm version | Candidate action | Reason |
| --- | ---: | --- | --- |
| `@smilodon/core` | `1.20.0` | `1.21.0` | Owns all changed runtime code and public CSS tokens. The additive public styling features justify a minor release. |
| `@smilodon/react` | `1.13.0` | No version change | No adapter source or package export changes. Its `@smilodon/core: ^1.13.0` peer range accepts Core 1.21.x. |
| `@smilodon/vue` | `1.12.0` | No version change | No adapter source or package export changes. Its Core peer range accepts Core 1.21.x. |
| `@smilodon/solid` | `1.12.0` | No version change | No adapter source or package export changes. Its Core peer range accepts Core 1.21.x. |
| `@smilodon/vanilla` | `1.12.0` | No version change | No adapter source or package export changes. Its Core peer range accepts Core 1.21.x. |
| `@smilodon/svelte` | `2.2.0` | No version change | No adapter source or package export changes. Its Core peer range accepts Core 1.21.x. |
| `@smilodon/react-native` | `1.10.0` | Excluded | It embeds a generated Core bundle and Android/iOS runtime qualification is incomplete. This candidate does not update or qualify that bundle. |

Registry lookups also confirmed the currently published adapter versions and that `@smilodon/core@1.21.0` was not occupied at preparation time. Recheck immediately before publication.

## Documentation and package contents

The developer-facing entry points are the root [README](../../README.md), the [Core README](../../packages/core/README.md), the [styling guide](../STYLING.md), and the [styling token reference](../STYLING-TOKENS.md). The detailed changelog entry is under Core 1.21.0 in [`CHANGELOG.md`](../../CHANGELOG.md).

Core's npm `files` allowlist includes `dist` and `README.md`. Tests, Playwright scenarios, playground files, architecture/release records, local browser configuration, coverage, and `node_modules` are not part of the tarball. `dist` is generated build output and remains ignored by Git; the package build creates it for packing. No `.gitignore` or npm package inclusion rule change is needed for this candidate.

## Qualification record

The exact versioned candidate was qualified locally with Node.js `26.10.0` and npm `12.2.0`:

- Clean `npm ci` passed. npm reported 14 audit findings (1 low, 13 moderate) and blocked install scripts for two esbuild packages and `svelte-preprocess`; no dependencies were changed.
- All workspace builds passed. Existing Rollup `eval`, package export-condition, sourcemap, React `use client`, and playground `eval` warnings remain.
- `npm test` passed: 761 Core tests (1 skipped), 48 data-loading tests, and 72 contracts (6 skipped).
- Focused chip lifecycle tests passed 8/8.
- Chrome for Testing 156 browser scenarios passed 44/44, including 8/8 chip animation scenarios.
- Lint passed with six existing warnings.
- TypeScript comparison produced 59 diagnostics, matching the baseline; no new diagnostic identities were reported.
- Packed Core plus React, Vue, Svelte, Solid, and Vanilla consumer checks passed strict NodeNext and Bundler modes. A clean temporary consumer also installed the Core tarball and imported its `EnhancedSelect` export under JSDOM.
- Firefox could not reach assertions because of a local fixture transport error. Firefox, pinned Chromium, and WebKit are not qualified by this candidate.
- Consumer-defined keyframes were demonstrated through `::part(chip)` and `::part(chip-exiting)` in Chrome. Document-defined keyframes supplied only through internal Shadow DOM animation tokens are not claimed as portable.

The packed artifact contains 56 files (package manifest, Core README, generated `dist` JavaScript, source maps, and declarations), with size 1,553,071 bytes and unpacked size 7,561,846 bytes. Tests, Playwright scenarios, playground files, architecture/release records, local browser configuration, coverage, and `node_modules` are absent from the tarball.

| Artifact field | Candidate value |
| --- | --- |
| Tarball | `smilodon-core-1.21.0.tgz` |
| SHA-256 | `6ecf83c8764a22e6e48c4fbe86537f5331d7e1810e4be401f6b361a53a47b328` |
| npm shasum | `742d24c386bb729e2b229bcf3182e49f3066050b` |
| npm SRI | `sha512-MS9k8+LfX4BbM3EderOJgXOFhkQdC12csi0no9w900bKAMR/9avgR6nSleupn+9S4m2kYK2xZCdbA9Y4evNdWg==` |

The artifact is preserved at `/tmp/smilodon-core-1.21.0-artifacts/smilodon-core-1.21.0.tgz`. Recheck that `1.21.0` remains unoccupied immediately before publishing. After publication, record registry integrity and verify a clean consumer install directly from npm. This candidate does not claim that the branch is merged to GitHub `main`, or that a GitHub release exists.

## Release gates

| Gate | Status |
| --- | --- |
| Source review and local source qualification | Accepted for Issue #125 source candidate |
| Core/root version metadata | Updated to `1.21.0` in release branch |
| Release documentation | Candidate record prepared; registry evidence pending |
| Versioned build, package contents, and tarball integrity | Passed locally |
| Main integration / release PR | Pending |
| npm publication and registry consumer verification | Pending |
| React Native runtime | Excluded; still unqualified |
