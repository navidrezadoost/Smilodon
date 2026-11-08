# Directive 178-F — React Native Android Runtime Certification

Status: **Android runtime qualification blocked. The packed APK builds and installs, and the app mounts, but the hosted emulator loses ADB/logcat responsiveness around the first bridge interaction. No native bridge pass is claimed.** `PRODUCTION_NO_GO` remains in effect.

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

The Android workflow is `.github/workflows/react-native-runtime-certification.yml`. It downloads the pinned Gradle 8.10.2 `bin` distribution from `downloads.gradle.org` and verifies SHA-256 `31c55713e40233a8303827ceb42ca48a47267a0ad4bab9177123121e71524c26` before use. This avoids the hosted 504 responses from the Gradle GitHub release redirect.

## 6. Hosted execution and failure classification

178-E post-merge workflows passed on `5a407954302a5152c94d5dcaf900ee4adc71785c` as recorded above. On PR #62 head `8bfd71e0a82ea9d03294770747c53e9bf7d207f6`, CI, Tests, Phase 4 Certification, and Phase 4 Performance Baseline passed. The Android certification job did not pass.

The hosted Android attempts exposed and resolved several certification-infrastructure issues before reaching the runtime boundary: emulator executable discovery, emulator package-version discovery without invoking its binary, packed tarball lockfile integrity, and using a release APK with its JavaScript bundle embedded. Earlier attempts also hit Gradle distribution 504s and ADB transport failures. These setup failures were not adapter results.

| Run | Result | Evidence and classification |
| --- | --- | --- |
| [42465963200](https://github.com/navidrezadoost/Smilodon/actions/runs/42465963200) | Failed before package build | `./gradlew --version` received HTTP 504 fetching Gradle 8.10.2 through `services.gradle.org` to the GitHub release. Environment/download failure. |
| [42466389565](https://github.com/navidrezadoost/Smilodon/actions/runs/42466389565) | Failed before emulator scenarios | Gradle setup action retried twice and received HTTP 504 for the same distribution. Environment/download failure. |
| [42466778011](https://github.com/navidrezadoost/Smilodon/actions/runs/42466778011) | Packed install and release APK build/install passed; runtime interaction failed | Direct checksum-verified Gradle download worked. ADB `logcat -d` timed out before the first Open tap could be attempted. |
| [42467522390](https://github.com/navidrezadoost/Smilodon/actions/runs/42467522390) | Packed install and release APK build/install passed; bridge callback unverified | Direct Gradle download worked. `APP_MOUNTED` and `SELECT_MOUNTED` were observed; the Open control was found and tapped. The subsequent React Native JS logcat query timed out, and emulator teardown reported connection refused on port 5554. The report has no verified bridge callback. |
| [42470002719](https://github.com/navidrezadoost/Smilodon/actions/runs/42470002719) | Failed before emulator setup | The direct Gradle CDN returned HTTP 504 on all six curl attempts. Environment/download failure. |
| [42470104127](https://github.com/navidrezadoost/Smilodon/actions/runs/42470104127) | Failed before emulator setup | The direct Gradle CDN again returned HTTP 504 on all six curl attempts. Environment/download failure. |
| [42470311789](https://github.com/navidrezadoost/Smilodon/actions/runs/42470311789) | Failed before emulator setup | The direct Gradle CDN again returned HTTP 504 on all six curl attempts. Environment/download failure; this remains a failed run and is not reclassified. |

Run `42467522390` recorded this environment: Node `20.20.2`, npm `10.8.2`, Temurin Java `17.0.21`, Gradle `8.10.2`, Android API 35 / Android 15, Google API x86_64 emulator `sdk_gphone64_x86_64`, emulator package `37.2.13`, WebView `124.0.6367.219`, React Native `0.76.9`, React `18.3.1`, and `react-native-webview` `13.12.5`. Its report records packed Core SHA-256 `1af2a7b7cf844d228d5dd2ff55197bc28d1589e80e9fe9da7040da9f615ac27f`, React Native SHA-256 `0f46d29ff74d3283d2996697ce0a9a898d141c6980d72c0e3ca0592e98ef9210`, and fixture lockfile SHA-256 `1435cc4eecdb3981211e4bcd97fb1bab8f09c94ec82b82f83a35345f6f2d2627`.

The saved UI hierarchy contains the React Native controls and an embedded WebView field showing `Alpha`. The saved initial screenshot is blank white. This visual discrepancy is unresolved. Together with the ADB/logcat timeout after the Open tap, it prevents distinguishing an emulator/transport failure from a runtime rendering or bridge failure. No defect in the production adapter is established, and no interaction, callback, controlled-state, imperative-method, or teardown/reconnect scenario is certified.

Disposition: **`BLOCKED_HOSTED_ANDROID_RUNTIME_INFRASTRUCTURE — REVIEW_PENDING`**. The report is evidence of a successful packed install and APK build, followed by an incomplete runtime attempt; repeated runs also failed to download Gradle. It is not a native qualification pass. PR #62 remains open and draft; no independent review has been submitted, no production adapter changes were made, and `PRODUCTION_NO_GO` remains in effect.

`PRODUCTION_NO_GO` remains in effect.

## 7. Directive 178-F.1 — Infrastructure stabilization amendment

Directive 178-F.1 is implemented on the existing PR #62 branch. It changes only the Android certification workflow, its runner, the Android-only fixture event correlation, and this evidence document. No production adapter code or package API was changed. Existing failed runs, artifacts, and package hashes above remain intact.

The Gradle setup now records `gradle-setup.json`, verifies the pinned 8.10.2 distribution against SHA-256 `31c55713e40233a8303827ceb42ca48a47267a0ad4bab9177123121e71524c26`, restores a reusable archive cache keyed by that checksum, then tries the two official Gradle distribution endpoints with bounded retries and timeouts. If neither produces the verified archive, the setup report uses `INFRA_GRADLE_UNAVAILABLE` and the required workflow fails.

The Android runner records explicit bounded stages for emulator boot, pre-install and post-install ADB health, app launch/mount, WebView readiness, an isolated bridge canary, and the remaining bridge scenarios. ADB canaries use a unique echoed nonce and `sys.boot_completed`, and record latency, device listing, and host emulator processes. A dedicated continuous logcat process starts before app launch and appends directly to an evidence file. Callback checks read that file and match the per-run identifier. The first Open callback plus a post-Open ADB canary gates entry into the rest of the interaction suite.

Stage captures now attempt UI hierarchy, screenshot, app process, Android exit/crash buffer, and emulator process diagnostics independently, recording unavailable diagnostics when the ADB transport fails. The workflow writes a pending emulator-boot record before invoking the emulator action, finalizes it afterward, and uploads all available evidence on failure. A successful infrastructure canary alone is not a runtime certification pass; all existing bridge scenarios must pass on the Android emulator.

### 178-F.1 validation record

| Gate | Result |
| --- | --- |
| Gradle checksum and failure classification | Implemented; hosted execution pending |
| Emulator boot and ADB health evidence | Implemented; hosted execution pending |
| ADB canaries before and after app interaction | Implemented; hosted execution pending |
| Continuous logcat and unique-run callback assertions | Implemented; hosted execution pending |
| Stage screenshots, hierarchy, and process/crash evidence | Implemented; hosted execution pending |
| Isolated Open canary gates full scenarios | Implemented; hosted execution pending |
| Failure-safe evidence on setup/emulator failure | Implemented; hosted execution pending |
| Standard hosted CI | Pending on the 178-F.1 head |
| Independent authorized review | Pending; PR remains draft and unmerged |

The local host has no Android SDK or emulator. Local verification can cover script syntax, lint, report failure handling, and repository diff integrity, but cannot establish Android runtime behavior. Hosted workflow run IDs, the exact 178-F.1 commit, and resulting evidence will be added here after the branch update.
