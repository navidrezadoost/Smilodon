# H.2G.21 — Metro `image-size` Security Remediation

Status: **Local qualification passed; hosted qualification rerun pending.** This is an isolated toolchain remediation branch based on candidate commit `e2733eb2a4bc826e2cdf0023afd852c3c01ffb5c`. It does not change the React Native adapter's published peer ranges or runtime source.

## Change

The repository's React Native workspace development toolchain now uses React Native `^0.81.5`, React `^19.1.0`, and `@types/react` `^19.1.0`. npm resolves React Native `0.81.6` and Metro `0.83.8`. Metro `0.83.8` no longer declares `image-size`; `npm explain image-size` reports no matching package. The previous Metro `0.81.5` dependency on `image-size@1.2.1` is removed from the root lockfile.

The lockfile was regenerated with npm `10.8.2` using a normal `npm dedupe`; no override, patch, forced dependency, or Metro fork was used. The `@smilodon/react-native` published peers remain `react >=18.2.0`, `react-native >=0.74.0`, and `react-native-webview >=13.12.0`. This repository lock audit does not audit peer graphs independently resolved by downstream applications; those graphs remain application-owned and may use older React Native/Metro versions.

The first hosted run exposed existing root TypeScript errors after the H.2G.20 toolchain update and React 19 type adoption: custom-element JSX declarations were global rather than merged into the React module, and React/Vue/Solid Vite configs passed a DOM `URL` object to Node's `fileURLToPath` type. The React declaration now uses module augmentation and preserves its existing custom-element props. The three configs derive their directory from `dirname(fileURLToPath(import.meta.url))`. These are type/build configuration corrections; they do not change runtime behavior or package exports.

## Local qualification

Local host: Node `26.10.0`, npm `12.2.0`; lock/install/audit commands were also invoked with npm `10.8.2`. The host is not the hosted Node 20/22 qualification environment.

| Check | Result |
| --- | --- |
| Locked full audit | 0 Critical, 0 High, 13 Moderate, 5 Low (18 entries) |
| Production omission audit | 0 findings |
| Metro graph | React Native `0.81.6`, Metro `0.83.8`, no `image-size` package |
| Lint | 0 errors; 6 pre-existing warnings |
| Workspace build | Passed; tracked `packages/react-native/src/generated/coreBundle.ts` restored and verified byte-identical |
| Unit and data-loading tests | 643 passed, 1 skipped |
| Contract tests | 12 passed, 43 skipped, unchanged from candidate baseline |
| Packed React Native declarations | NodeNext and Bundler passed with strict mode, `skipLibCheck: false`, and no DOM library; consumer fixture remains React Native `0.76.9` |
| Root TypeScript check | Passed after the hosted failure correction (`npx tsc --noEmit`) |
| Full build and tests after correction | Passed: all workspaces built; 603 unit, 40 data-loading, and 12 contract assertions passed; 1 unit and 43 pre-existing contract cases remain skipped |
| Diff integrity | `git diff --check` passed |

The first local `npm test` invocation was made before adapter workspaces were built and failed on unresolved workspace package outputs. The authorized full workspace build then passed, and the complete test command was rerun successfully. This setup failure is not counted as a test pass.

## Scope and remaining qualification

The H.2G.20 hosted qualification on PR #65 confirmed its security gate fails only because the root lock still contained the Metro High; the other candidate checks passed on commit `e2733eb2a4bc826e2cdf0023afd852c3c01ffb5c`. The initial PR #66 hosted run's Node 20 Phase 4 job failed at `npx tsc --noEmit` on the type issues described above; lint and workspace build passed, and the hosted audit plus Node 22 qualification passed. The correction is locally verified. The updated PR must rerun all hosted checks on its new exact head, including the audit, full suite, and browser jobs.

The React Native runtime fixture and downstream peer-resolved graphs are not claimed as Android/iOS certified by this lockfile update. Android physical-device certification remains blocked by device availability; iOS runtime remains unqualified. This security change does not close those runtime gates.
