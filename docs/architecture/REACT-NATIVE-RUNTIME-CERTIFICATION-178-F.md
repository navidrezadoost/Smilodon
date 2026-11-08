# Directive 178-F — React Native Android Runtime Certification

Status: **Implementation in progress; Android runtime evidence pending. No native runtime pass is claimed.** `PRODUCTION_NO_GO` remains in effect.

## 1. 178-E post-merge integrity

The verified `main` merge commit is `5a407954302a5152c94d5dcaf900ee4adc71785c`. All three required workflows completed successfully on that exact commit:

| Workflow | Run | Result |
| --- | ---: | --- |
| CI | `42398060624` | Success |
| Tests | `42398060693` | Success |
| Phase 4 Certification | `42398060634` | Success |

PR #61 reports 23 successful PR checks. GitHub recorded no submitted independent review before merge. This is a process exception, not approval; 178-F still requires independent review before merge.

## 2. Isolated baseline

Branch: `test/178-f-react-native-runtime-certification`.

Worktree: `/tmp/smilodon-178-f`, created from `origin/main` at the exact merge commit above. The worktree was clean at creation. The existing IDE worktree was left untouched because it contained unrelated edits and was behind `origin/main`.

Local host: Node.js `v26.10.0`, npm `12.2.0`, OpenJDK `21.0.12.1`. It has no `adb` or `sdkmanager`; it cannot execute an Android device test. The hosted workflow therefore pins Node.js `20.20.2`, npm `10.8.2`, Temurin JDK `17`, and an Android API 35 Google APIs x86_64 Pixel 2 emulator. The fixture's React Native baseline is `0.76.9`, React `18.3.1`, and `react-native-webview` `13.12.5`; its Android Gradle wrapper is `8.10.2`.

## 3. Qualification design

The small bare React Native app in `tests/react-native-runtime/` is Android-only. The workflow builds the Core and React Native workspaces from the checked-out revision, packs each workspace, installs those tarballs into the fixture with its committed npm lockfile, confirms the `react-native` package condition resolves to `dist/index.native.js`, builds and installs the APK, then launches the app on the emulator.

The app drives the real native adapter and WebView bridge. Android UI accessibility automation operates the native controls and visible options. Callback output is collected from Android logcat. The scenarios cover initial WebView readiness through a successful `open` callback, open and close callbacks, item synchronization, searchable option filtering and `clearSearch`, controlled single selection, disabled state, multiple selection, `setItems`, `setValue`, `clear`, and unmount/reconnect. A callback-free interval after teardown is checked before reconnecting.

The test runner records Node/npm/Java/Gradle versions; Android API, release, emulator model, product, ABI, fingerprint, screen size/density, emulator and WebView provider; installed package versions; both tarball SHA-256 values; the fixture lockfile hash; Android build logs; UI hierarchy snapshots; screenshots; and device logcat.

`packages/react-native/src/generated/coreBundle.ts` is rewritten by the existing adapter build. The runner refuses to start if that tracked file is already modified, snapshots its clean bytes before building, and restores that exact snapshot in a `finally` block. This avoids overwriting caller changes and keeps generated build output out of the evidence patch.

## 4. Current local checks

- `npm ci` at the repository root completed on the isolated worktree.
- Core and React Native workspace builds completed locally. The generated bundle was restored to the checked-in version afterward.
- Both built workspaces were packed using npm `10.8.2`; the resulting tarballs installed into the fixture using its committed lockfile and `npm ci`.
- The fixture's Metro Android bundle completed successfully with React Native `0.76.9`.
- `node --check scripts/certify-react-native-android.mjs`, targeted ESLint for the runner and fixture, and `git diff --check` passed.
- No Android SDK or emulator is installed locally, so no local Android build or runtime interaction was performed.
- Invoking the runner with `ANDROID_HOME` and `ANDROID_SDK_ROOT` unset produced an explicit `environment` failure record in `test-results/react-native-runtime/runtime-certification.json`; the generated bundle remained unchanged. This exercised failure reporting only, not Android qualification.

Local package tarball hashes from the locked fixture setup:

| Package | SHA-256 |
| --- | --- |
| Core | `2a9b93bba93581b677ff817a65bfd10a937497caaeaa04b95183a27f00558bac` |
| React Native | `ea72712c25bd884ef29f85cc1daf3da790986e44b462d7c4511e8d0fcaea8483` |

The hosted run records the hashes it actually installs; those are the authoritative runtime artifacts.

## 5. Qualification boundaries and failure ownership

The evidence is specific to Android API 35, the pinned emulator image, and the React Native/WebView dependency versions above. It does not establish iOS parity, accessibility certification, broad device coverage, or production readiness. A single emulator cycle cannot establish long-run memory behavior; memory-retention claims will remain limited to captured process observations and the exercised teardown/reconnect scenario.

If hosted execution fails, the runner records the failing stage and a provisional ownership category. The Android build logs, runtime logcat, UI hierarchy, and screenshot must be reviewed before assigning the final category among environment, dependency compatibility, test harness, native runtime, or WebView bridge. No production adapter changes are authorized by 178-F.

The Android workflow is `.github/workflows/react-native-runtime-certification.yml`. Hosted run outcome, exact emulator metadata, installed tarball hashes, scenario results, and final failure classification will be added here before the evidence-only PR is finalized. Independent review is required before merge.

`PRODUCTION_NO_GO` remains in effect.
