# Directive 178-A — Consolidated Consumer Certification

Date: 2026-11-07
Baseline: `7d84cc6c4eb3eec8b263465c5b962084703ddd6f`
Branch: `test/178-a-consumer-certification`

## Disposition

`CONSOLIDATED_CERTIFICATION_INCOMPLETE — PACKAGE_CONTRACT_FINDINGS`

All seven packages build from the integrated baseline. Core, React, Svelte, Solid, and the React Native web entry compile as packed consumers in both strict NodeNext and Bundler modes with `skipLibCheck: false`. Vanilla’s package tarball has no declarations at its declared type path. Vue’s declarations fail strict NodeNext resolution. The React Native native condition fails strict type checking in this environment because its native, Node, React, and DOM global definitions conflict. The available Chromium browser checks pass; Firefox, WebKit, and native device execution could not be completed here.

This is a local qualification of the fetched main commit, not a performance or accessibility certification. It does not authorize publication or production use. Security remediation remains a separate workstream.

## Environment and method

- Fresh worktree created at `/tmp/smilodon-178-a` from `origin/main` at the baseline above; initially clean.
- Node.js `v24.13.1`, npm `11.8.0`.
- Installed locked dependencies with `npm ci --strict-ssl=true`.
- Built all workspaces with `npm run build`.
- Packed all seven packages and tested the published tarball contents from an external consumer fixture.
- TypeScript consumer fixtures used strict mode and `skipLibCheck: false`.
- Browser tests used system Google Chrome `133.0.6943.126`. Playwright-managed Chromium, Firefox, and WebKit were unavailable; the CDN download returned HTTP 403. No `adb` or `xcrun` executable was available for native device execution.

## Package matrix

| Package | Build | Packed Bundler | Strict NodeNext | Runtime/browser |
| --- | --- | --- | --- | --- |
| Core | Pass | Pass | Pass | Shared Chromium E2E passed |
| Vanilla | Pass | **Fail** | **Fail** | Chromium E2E passed |
| React | Pass | Pass | Pass | Chromium E2E passed |
| Vue | Pass | Pass | **Fail** | Chromium E2E passed |
| Svelte | Pass | Pass | Pass | Chromium E2E passed |
| Solid | Pass | Pass | Pass | Packed Chromium smoke passed |
| React Native — web entry | Pass | Pass | Pass | Packed Chromium smoke passed |
| React Native — native entry | Pass | **Fail** | **Fail** | Not run: no native simulator/device |

### Package findings

- **Vanilla:** The tarball omits `dist/types/index.d.ts`, although `package.json` points both `types` and the `exports["."].types` condition at that file. `npm run build` exits successfully but does not emit the declared file. Both consumer modes report TS7016 for `@smilodon/vanilla`.
- **Vue:** Bundler resolution succeeds. NodeNext reports TS2307 for `./Select.vue` imported by `dist/types/index.d.ts`. This is an external consumer declaration-resolution failure.
- **React Native web:** The default web entry passes strict NodeNext and Bundler type checks. Its packed browser smoke rendered the Core custom element, displayed the configured placeholder, exposed `open()`, and produced no page errors.
- **React Native native:** With the `react-native` export condition and `skipLibCheck: false`, the consumer check reports conflicts among React Native, React, Node, and DOM global declarations. The native runtime is unqualified because no simulator or device was available. Keep this result distinct from the web-entry pass.
- All package manifests remain at version `1.10.0`; the adapters’ Core peer ranges accept the packed Core version. Package export maps were not changed during qualification.

## Test results

- `npm run build`: all seven packages and the playground built successfully.
- `npm run test:unit`: discovery 4 passed; Core 603 passed and 1 skipped; data loading 40 passed.
- `npm run test:contracts`: 12 passed and 43 skipped.
- Chromium E2E: 88 passed and 20 skipped across React, Vue, Svelte, and Vanilla. The first high-parallelism run had two page-load timeouts; rerunning the relevant projects with two workers completed without failures.
- Packed Solid and React Native web smoke: both adapters rendered and exposed their expected Core element behavior in system Chrome.
- `git diff --check`: passed.

### Contract skip classification

All 43 skipped contract cases are in `tests/contracts/react.contract.spec.ts`. The suite lists them in `pendingTests` and labels each generated skip “not implemented yet.” The names cover rendering and prop states, selection and reactive updates, search and keyboard behavior, accessibility and focus, grouping, imperative methods, loading events, virtualization, and large-dataset behavior. These are **incomplete coverage**, not documented compatibility exclusions or outdated tests. The passing contract total does not include those behaviors.

## Build worktree integrity observation

The full workspace build modified exactly one tracked file: `packages/react-native/src/generated/coreBundle.ts`. The change is the generated embedded Core bundle written by the React Native build. It remains present in this qualification worktree as evidence of the build side effect; it was not reset or hidden. No other tracked file was changed by the build, and no package source or manifest remediation was made in this certification branch.

This observation is separate from the hosted Phase 4 workflow qualification. It should be considered when designing any future local evidence-capture sequence that requires a clean tracked worktree.

## Follow-up gates

1. Correct Vanilla declaration emission or its published type target, then repeat both packed consumer modes.
2. Make Vue declarations resolvable by strict NodeNext consumers, then repeat both modes.
3. Resolve or explicitly scope the React Native native type environment and run native validation on an available simulator/device.
4. Add or select browser coverage for the Solid and React Native native paths beyond the bounded smoke performed here.
5. Assess the 45 vulnerability findings reported during dependency installation in the separate security workstream; this certification did not run remediation.

Until these gates are addressed, consolidated consumer certification is not a pass and `PRODUCTION_NO_GO` remains in effect.
