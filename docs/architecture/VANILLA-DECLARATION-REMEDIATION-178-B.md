# Directive 178-B — Vanilla Published Declaration Remediation

Date: 2026-11-07
Branch: `fix/178-b-vanilla-declarations`
Baseline: `4f8605196320af89d5a78d749cd248a6fb18fa94`

## Disposition

`VANILLA_DECLARATION_CONTRACT_PASS — REVIEW_AND_HOSTED_CI_PENDING`

The Vanilla package now emits its real TypeScript declaration after Vite has cleaned the output directory, and normalizes TypeScript’s monorepo output path to the package manifest’s declared entry. The generated package tarball includes `dist/types/index.d.ts`. Packed consumers compile in strict NodeNext and Bundler modes with `skipLibCheck: false`. CommonJS and ESM entry points load in a DOM environment, and the existing Vanilla contract and Chromium regression checks pass.

This remediation addresses only the Vanilla published declaration contract. Vue NodeNext, React Native native typing/runtime, the skipped contract cases, and security findings remain open. `PRODUCTION_NO_GO` remains in effect.

## Diagnosis

The existing Vanilla build ran `tsc` before Vite. TypeScript resolved `@smilodon/core` through the inherited root `paths` alias to Core source files, so it emitted the real Vanilla declaration at `dist/types/vanilla/src/index.d.ts` along with intermediate Core declarations. Vite’s `emptyOutDir: true` then removed the entire `dist` directory, including those declarations. The script exited successfully while the manifest’s `dist/types/index.d.ts` was absent.

## Change

- Reordered the Vanilla build so Vite writes JavaScript first, then TypeScript emits declarations.
- Added a Vanilla-scoped cleanup step that moves the compiler-generated `vanilla/src/index.d.ts` to `dist/types/index.d.ts` and removes intermediate Core/compiler output. The declaration is generated from `src/index.ts`; no placeholder declaration is used.
- No runtime source, public API, package export map, dependency version, or other package was changed.

## Qualification evidence

- `npm run build -w @smilodon/vanilla`: passed from a fresh dependency install.
- `test -s packages/vanilla/dist/types/index.d.ts`: passed. The declaration contains the generated `createSelect`, `initSelect`, and helper signatures and re-exports Core types.
- The output directory contains only `dist/types/index.d.ts` after cleanup; no generated declarations were left under Core source.
- `npm pack -w @smilodon/vanilla --dry-run --json`: lists `dist/types/index.d.ts` (5,931 bytes) at the declared package path.
- Packed Core and Vanilla 1.10.0 tarballs were installed in a clean external consumer fixture. The fixture used `strict: true` and `skipLibCheck: false`:
  - NodeNext (`module` and `moduleResolution` both `NodeNext`): pass.
  - Bundler (`module: ESNext`, `moduleResolution: Bundler`): pass.
- Packed ESM and CommonJS entry points each loaded in a JSDOM DOM environment and exposed the expected nine functions: `createSelect`, `initSelect`, `getValue`, `setValue`, `clear`, `open`, `close`, `setItems`, and `configureSelect`.
- `npm run test:contracts:vanilla`: 2 passed.
- Existing Vanilla Chromium E2E project, using system Google Chrome 133.0.6943.126: 17 passed, 5 skipped. Skips are existing pending search/multi-select cases. Playwright’s Firefox and WebKit binaries were unavailable because browser downloads return HTTP 403 in this environment; the Vanilla Chromium suite completed.
- `git diff --check`: passed.

## Scope and remaining gates

The patch changes only `packages/vanilla/package.json`, adds `packages/vanilla/scripts/cleanup-types.js`, and adds this evidence document. Hosted CI has not yet run for this branch. PR merge is not authorized by this directive; merge remains pending required checks and review. No security remediation was attempted.
