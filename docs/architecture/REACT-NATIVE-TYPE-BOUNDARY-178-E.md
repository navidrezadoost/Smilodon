# Directive 178-E — React Native DOM-Free Core Type Boundary

Status: **Locally qualified; hosted checks and independent review pending.** Native runtime certification remains unverified.

## 1. Verified baseline and original failure

The three post-merge workflows for PR #60's merge commit `29c4a0f979489f9fe56bfcf9528153171d30f2fc` completed successfully:

| Workflow | Run | Result |
| --- | ---: | --- |
| CI | `42395691284` | Success |
| Tests | `42395691255` | Success |
| Phase 4 Certification | `42395691290` | Success |

Implementation branch `fix/178-e-react-native-type-boundary` starts at that commit. Its worktree was clean at creation. Local tools were Node.js `v24.13.1` and npm `11.8.0`.

Before the correction, actual packed Core and React Native packages reproduced these six errors in both strict NodeNext and Bundler consumers using React Native `0.76.9`, React `18.3.1`, `react-native-webview` `13.12.5`, TypeScript `5.9.3`, `@types/react` `18.3.18`, `skipLibCheck: false`, and no DOM library:

```text
node_modules/@smilodon/core/dist/types/src/components/enhanced-select.d.ts(11,45): error TS2689: Cannot extend an interface 'HTMLElement'. Did you mean 'implements'?
node_modules/@smilodon/core/dist/types/src/components/native-select.d.ts(2,50): error TS2689: Cannot extend an interface 'HTMLElement'. Did you mean 'implements'?
node_modules/@smilodon/core/dist/types/src/components/select-option.d.ts(46,43): error TS2689: Cannot extend an interface 'HTMLElement'. Did you mean 'implements'?
node_modules/@smilodon/core/dist/types/src/config/global-config.d.ts(12,16): error TS2304: Cannot find name 'ScrollBehavior'.
node_modules/@smilodon/core/dist/types/src/config/global-config.d.ts(14,13): error TS2304: Cannot find name 'ScrollLogicalPosition'.
node_modules/@smilodon/core/dist/types/src/utils/csp-styles.d.ts(66,56): error TS2304: Cannot find name 'ShadowRoot'.
```

The five Core configuration types imported by `packages/react-native/src/Select.tsx` came from Core's browser-facing root declaration barrel. That barrel also exposed Web Component and CSP declarations. `global-config.ts` additionally depended on DOM scroll names, and its limitation types came through the broad `types.ts` file, which includes browser renderer types.

## 2. Implementation

- Added the type-only `@smilodon/core/native-types` subpath. It re-exports the existing authoritative `GlobalSelectConfig`, `SelectionConfig`, `MultiSelectDisplayConfig`, `ScrollToSelectedConfig`, and `StyleConfig` declarations from `config/global-config.ts`.
- Extracted `KnownLimitationId`, `LimitationControlMode`, and `LimitationPolicy` into `types/limitation.ts`. The existing `types.ts` re-exports and consumes those same definitions, preserving the browser-facing Core API. The configuration declaration now imports the leaf module directly, so the native graph does not load browser renderer types from `types.ts`.
- Replaced the two DOM scroll names in `ScrollToSelectedConfig` with structurally identical local literal unions: behavior remains `'auto' | 'instant' | 'smooth'`; block remains `'start' | 'center' | 'end' | 'nearest'`.
- Changed only the type imports in the native `Select.tsx` implementation to use `@smilodon/core/native-types`. The web implementation, runtime JavaScript, component props, callbacks, and handle signatures are unchanged.
- Added the matching `@smilodon/core/native-types` source alias to the root `tsconfig.json`, so the repository's pre-build source check resolves the internal subpath without depending on generated `dist` declarations.
- Added `scripts/test-react-native-native-types.mjs`, the `npm run test:types:react-native` command, and a CI step for repeatable packed-consumer validation.
- No dependency or lockfile changes were made.

## 3. Packed native consumer certification

`npm run test:types:react-native` builds and packs actual Core and React Native workspaces, installs those tarballs into an external temporary consumer with the pinned toolchain above, and runs strict NodeNext and Bundler compilation. The fixture uses `lib: ["ES2022"]`, `types: ["react", "react-native"]`, `customConditions: ["react-native"]`, and `skipLibCheck: false`.

The consumer covers all five shared configuration types, each supported scroll behavior and block value, named native `Select` typing, refs, callback parameter types, and negative assertions against an invalid `searchable` value, invalid scroll behavior, or an `any` searchable prop.

Result: **NodeNext passed; Bundler passed.** The script also inspects TypeScript's resolved file list from the installed tarballs and verifies that:

- React Native resolves to `dist/index.native.d.ts`; `Select.web.d.ts` is not loaded.
- Core resolves to `dist/types/src/native-types.d.ts`, `config/global-config.d.ts`, and `types/limitation.d.ts`; the browser Core `index.d.ts` is not loaded.
- `lib.dom.d.ts` is absent.
- No loaded Smilodon declaration references `HTMLElement`, `ShadowRoot`, `ScrollBehavior`, `ScrollLogicalPosition`, `Document`, or `Window`.
- The packed Core manifest contains the `./native-types` `types` export, and its required declarations are present and resolvable.

## 4. Compatibility and regression results

- `npm run build`: passed for Core, React, React Native, Solid, Svelte, Vanilla, Vue, and the playground. Existing Rollup `eval`, React `use client`, and sourcemap warnings remain non-fatal.
- Strict actual-packed Core browser consumer: NodeNext and Bundler passed with `lib: ["ES2022", "DOM"]`, `skipLibCheck: false`, and Core's existing top-level `EnhancedSelect` plus configuration types.
- `npm test`: passed. Core unit tests: 603 passed, 1 skipped; data-loading tests: 40 passed; adapter contracts: 12 passed, 43 intentionally skipped.
- `npm run test:contracts`: passed (4 files, 12 passed, 43 skipped).
- `npm run lint`: zero errors, six existing warnings.
- `git diff --check`: passed.
- The first hosted Phase 4 run exposed that its source-level TypeScript check runs before package builds and could not resolve the new Core subpath from the existing monorepo path aliases. Added the source alias above; `npx tsc --noEmit` now passes locally. The corrected head is awaiting hosted revalidation.

The React Native build rewrote tracked `packages/react-native/src/generated/coreBundle.ts` during qualification. Its content hash changed from baseline `e221dc43cdf8c5529a76c479ce855af2eb3c608cd6c04fe96f99fdab4dfb3fc1` to generated `dd14fa256fb20a7cbfb3c464390a8500fc53f26bf708d6c0d3ccb074fe095072`. The test script restores the file after its own build; the full workspace build's mutation was also restored manually. No generated bundle change is included in this directive.

## 5. Remaining gates

No Android device or emulator, Android SDK environment, or iOS Simulator tooling is available in this Linux environment. Native runtime behavior remains unverified; browser or React Native Web results are not substituted for a device/simulator run.

PR #60 has no submitted independent review. This remains a process exception and is not approval. This implementation must receive successful hosted checks and independent review before merge. Security findings, adapter coverage gaps, accessibility qualification, native runtime certification, and production release authorization remain open.

`PRODUCTION_NO_GO` remains in effect.
