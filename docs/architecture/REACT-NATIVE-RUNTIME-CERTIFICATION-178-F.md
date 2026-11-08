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
| Gradle checksum and failure classification | Exact SHA-256 passed on all completed setup attempts; run `42476146355` reused the checksum-valid Actions cache without downloading Gradle |
| Emulator boot and ADB health evidence | Boot and three-round pre-install and post-install canaries passed on runs `42474841708`, `42475739495`, `42476146355`, `42476956655`, and `42477723912` |
| ADB canaries before and after app interaction | Pre-install, post-install, and post-Open canaries passed on runs `42476146355` and `42476956655`; the emulator and ADB disappeared during later scenarios |
| Continuous logcat and unique-run callback assertions | On `42476956655`, the log verified mount, initial sync, open, close, clear, search, Beta selection, disabled-state toggles, and the first multiple-selection callback with its unique run ID |
| Stage screenshots, hierarchy, and process/crash evidence | Boot, install, mount, WebView-ready, and post-Open screenshots and hierarchies were captured on `42476146355`; failure diagnostics on both latest runs recorded missing ADB device and QEMU process, available host memory, and unavailable device crash buffer |
| Isolated Open canary gates full scenarios | Open callback, post-Open ADB canary, screenshot, and hierarchy passed; disabled-state suppression passed on `42476956655`, then ADB was lost before the second multiple selection and remaining cases |
| Failure-safe evidence on setup/emulator failure | Evidence artifacts uploaded for each hosted attempt, including runs `42475739495`, `42476146355`, `42476956655`, and `42477723912` |
| Standard hosted CI | CI, Tests, Phase 4 Certification, and Phase 4 Performance Baseline passed on `9ec1956c41a04eb547e3059f112024d74ec34728` (runs `42476956626`, `42476956630`, `42476956662`, `42476956620`) |
| Independent authorized review | Pending; PR remains draft and unmerged |

The local host has no Android SDK or emulator. Local verification can cover script syntax, lint, report failure handling, and repository diff integrity, but cannot establish Android runtime behavior. Hosted evidence and the exact tested commit are recorded below as runs complete.

### First hosted 178-F.1 attempt

PR head `861aa7ebe39e5c54080a5080ee4f649a5502187d` (GitHub PR merge checkout `610b4393937bbf779b617ff94438def203862861`), workflow run [42473638178](https://github.com/navidrezadoost/Smilodon/actions/runs/42473638178), produced the first structured 178-F.1 evidence artifact. Gradle 8.10.2 downloaded from the official `downloads.gradle.org` endpoint and passed the pinned SHA-256 check. Android API 35 emulator boot, device metadata, idle-screen UI hierarchy, process/exit-info, last-ANR, and crash-buffer diagnostics were captured. The ADB screenshot call failed with Node `spawnSync adb ENOBUFS` because `execFileSync` retained its 1 MB default output limit. The app was not installed or launched and no bridge scenario ran. This is a test-harness screenshot-capture failure, not an Android adapter result. The original run and its artifact remain failed and preserved at [artifact 13614931185](https://github.com/navidrezadoost/Smilodon/actions/runs/42473638178/artifacts/13614931185). Commit `3a31daa0eee4c115a34c552f41f37a6bcb837584` raises the screenshot output cap to 32 MiB and records this failure as `TEST_HARNESS_SCREENSHOT_BUFFER_LIMIT`.

The checksum-keyed Gradle cache now saves even if a later Android stage fails, so the verified distribution can be reused while runtime harness issues are corrected. Run `42473638178` had a cache miss and its post-job cache save was skipped after the screenshot-stage failure; a later run will establish whether cache reuse succeeds.

### Second hosted 178-F.1 attempt

PR head `3a31daa0eee4c115a34c552f41f37a6bcb837584` (PR merge checkout `8ed47763036557b8945ac8e27bf21dd4fe4e84c8`), workflow run [42474005423](https://github.com/navidrezadoost/Smilodon/actions/runs/42474005423), passed Gradle checksum verification, emulator boot, both pre-install and post-install ADB canaries (three echo/getprop pairs each), packed dependency installation, and the release APK build/install. Its live logcat recorded `APP_MOUNTED`, `SELECT_MOUNTED`, and the initial controlled `CHANGE` synchronization. The emulator process disappeared and ADB became unavailable while capturing the post-mount stage, before the first Open tap. The report records no ADB transport after the stage, no host emulator process, and unavailable device crash/ANR logs. No Open callback or full interaction scenario is certified. The evidence artifact is [13615180713](https://github.com/navidrezadoost/Smilodon/actions/runs/42474005423/artifacts/13615180713). The packed Core, React Native, and fixture lockfile hashes match the previously recorded run values, so the runtime input packages were unchanged.

This observation narrows the immediate failure to emulator/ADB process loss after app mount; it does not establish whether QEMU was killed by host pressure, an emulator crash, or another runner failure. The next harness revision captures the host process/resource state, kernel OOM/termination lines when permitted, and the emulator crash database, and takes the app screenshot before the slower UI hierarchy dump. Logcat now includes Android task manager, native debug, libc, and Chromium error tags. Failure reports distinguish `ANDROID_EMULATOR_ADB_TRANSPORT_LOST` from an unverified bridge callback. The initial `save-always` cache input emitted a deprecation warning and did not save on failure; it is being replaced by separate `actions/cache/restore` and always-run `actions/cache/save` steps.

### Third hosted 178-F.1 attempt

PR head `6124ad91459ad6f0109715a2d3aa01215b4ab2d5` (PR merge checkout `a47f3014ab300f8f03df76965204849c088eb82b`), run [42474841708](https://github.com/navidrezadoost/Smilodon/actions/runs/42474841708), passed the Gradle checksum, emulator boot, all three repeated pre-install and post-install ADB probe pairs, packed package install, release APK build/install, app mount, and WebView accessibility readiness. The continuous logcat verified one `OPEN` callback, and the three-pair post-Open ADB canary also passed. The emulator then became unresponsive during the after-Open UI hierarchy capture; `adb devices` reported the emulator offline and the QEMU process was absent. The full scenario suite did not run, and this remains a failed Android qualification.

This run resolves part of the prior white-frame question. The screenshot immediately after app mount is a valid 1080×1920 PNG showing a white app surface (SHA-256 `f71378fac21bf77e6872d04d3aa2b2c75e0564c5c7fcd336258e97c9f54c0b08`); after WebView readiness, a valid screenshot shows the complete native fixture and the visible `Alpha` WebView control (SHA-256 `bcad6eafb4e4c7542269e160d56db471ce94070aa440fadfb17c09bae80f3941`). Thus the white frame was a real early app-mount frame captured before content became visible, rather than an invalid PNG or a permanently blank rendering. The logcat records the unique-run `OPEN` callback, and the post-Open three-round ADB canary passed with 12–20 ms echo/getprop command latencies while QEMU was still present. The post-Open screenshot is byte-identical to the ready screenshot, so visible expansion after Open remains unverified despite the callback. Subsequent UI capture found the emulator offline and QEMU absent. Diagnostics recorded about 15 GB of host memory available and no captured kernel OOM lines. The crash data was not copied because the Android runner's `emu-crash-37.2.13.db` path is a directory, not a file. The next amendment recursively copies and hashes its contents and waits briefly after Open before taking the post-interaction screenshot. Artifact: [13615341500](https://github.com/navidrezadoost/Smilodon/actions/runs/42474841708/artifacts/13615341500).

### Fourth hosted 178-F.1 attempt

PR head `7effb1de7489489a18456f386501234d7018cc75` (PR merge checkout `954ab4142d00834e21fa57cff1cc6132cf9f972d`), run [42475860539](https://github.com/navidrezadoost/Smilodon/actions/runs/42475860539), verified the Gradle 8.10.2 checksum and reached emulator boot. The after-boot screenshot and Android process/crash/ANR queries succeeded, but `uiautomator dump` returned success and the following `cat /sdcard/smilodon-window.xml` found no file. The emulator and ADB were still healthy, and no app build or runtime scenario started. This is a harness hierarchy-capture race, classified for correction rather than an emulator or adapter failure. The evidence artifact is [13615556890](https://github.com/navidrezadoost/Smilodon/actions/runs/42475860539/artifacts/13615556890).

The verified 136,494,016-byte Gradle archive was successfully saved under its checksum-keyed Actions cache after this later-stage failure. The next hosted run will establish cache-hit reuse. The runner now retries the hierarchy dump/read once, records both command results, and assigns a specific harness failure code if the file remains unavailable.

The standard workflows all passed on this same PR head: CI run `42474841743`, Tests run `42474841776`, Phase 4 Certification run `42474841727`, and Phase 4 Performance Baseline run `42474841758`. Independent review remains absent, PR #62 remains draft, and no merge is authorized.

### Fifth hosted 178-F.1 attempt

PR head `70a3c1c3ec42bf284e177578e48add98a05de588`, run [42475739495](https://github.com/navidrezadoost/Smilodon/actions/runs/42475739495), verified the Gradle checksum, booted the API 35 emulator, passed all three pre-install and post-install ADB echo/getprop probe pairs, installed the packed packages, and built and installed the release APK. Logcat recorded `APP_MOUNTED`, `SELECT_MOUNTED`, and initial `CHANGE` synchronization. The after-mount UI hierarchy command timed out; subsequent diagnostics found no listed ADB device and no QEMU process. The app-launch-and-mount stage therefore failed before WebView readiness or any interaction. Host diagnostics showed about 15.6 GB available memory and no captured kernel emulator-termination lines. The device crash buffer was unavailable and the copied emulator crash database contained only `settings.dat`. The run is classified as `ANDROID_EMULATOR_ADB_TRANSPORT_LOST`; no adapter result is inferred. Failure evidence is preserved in [artifact 13615552852](https://github.com/navidrezadoost/Smilodon/actions/runs/42475739495/artifacts/13615552852). This attempt used head `70a3c1c`; its UI hierarchy retry was followed by the latest attempt below.

### Sixth hosted 178-F.1 attempt

PR head `a7221f65fb27aa9a0a8a6532192d0f464f9af1f9`, run [42476146355](https://github.com/navidrezadoost/Smilodon/actions/runs/42476146355), confirmed checksum-keyed Gradle cache reuse: `cacheCandidate.valid` was true for SHA-256 `31c55713e40233a8303827ceb42ca48a47267a0ad4bab9177123121e71524c26`, and no download attempt was needed. Emulator boot, packed package installation, release APK build/install, and all pre-install, post-install, and post-Open ADB canaries passed. The bounded hierarchy retry also worked: mount, WebView-ready, and post-Open stage screenshots and UI hierarchies were saved.

The unique-run logcat verified `APP_MOUNTED`, `SELECT_MOUNTED`, initial `CHANGE` synchronization, `OPEN`, `CLOSE`, another `OPEN`, `clear` changes, search updates for `beta`, `SELECT "beta"`, and the controlled `CHANGE` to Beta. Search filtering and clear-search checks passed, as did the Open canary. The screenshot at WebView readiness visibly shows the fixture and Alpha control. The post-Open screenshot shows the Select's open indicator but no visible option list, while the corresponding accessibility hierarchy contains the options; visual presentation of the expanded list therefore remains unresolved.

The run then failed in `bridge-full-scenarios` when `tapButton('toggle-disabled')` attempted a UI hierarchy read and `adb` timed out. Failure diagnostics recorded `adb devices` with no device, no QEMU emulator process, about 15.6 GB host memory available, no captured kernel termination lines, and an unavailable device crash buffer. Continuous logcat ended with exit code 255 after the emulator disappeared. This isolates the immediate interruption to emulator/ADB process loss, but does not explain why QEMU exited. The report marks the initialization, search, Beta selection, and callback check as passed; disabled-state, multiple-selection, imperative update/clear, and teardown/reconnect scenarios did not complete. The full native runtime qualification remains failed and no production adapter defect is established. Complete evidence is preserved in [artifact 13615722817](https://github.com/navidrezadoost/Smilodon/actions/runs/42476146355/artifacts/13615722817).

At head `a7221f65fb27aa9a0a8a6532192d0f464f9af1f9`, the standard CI, Tests, Phase 4 Certification, and Phase 4 Performance Baseline workflows all passed (runs `42476146353`, `42476146366`, `42476146372`, and `42476146375`). The Android certification job failed as described above. PR #62 remains open and draft, with no submitted independent review and no merge authorization. `PRODUCTION_NO_GO` remains in effect.

### Seventh hosted 178-F.1 attempt

The evidence-only amendment at PR head `9ec1956c41a04eb547e3059f112024d74ec34728` triggered another Android run, [42476956655](https://github.com/navidrezadoost/Smilodon/actions/runs/42476956655). The checksum-valid Gradle cache was reused, the emulator booted, the packed packages and release APK built and installed, and all pre-install, post-install, and post-Open ADB canaries passed. The run again passed app mount, WebView readiness, the Open bridge canary, and initialization, filtering, clear-search, Beta single-selection, and controlled-state callbacks. The previously incomplete disabled-state scenario also completed and verified that disabled selection emitted no extra change callback.

The multi-select scenario opened and selected Alpha; logcat recorded `SELECT "alpha"` and `CHANGE {"value":["alpha"],"labels":["Alpha"]}`. The next step, locating Beta through the Android UI hierarchy, failed with `spawnSync adb ETIMEDOUT`. Failure diagnostics again found no listed ADB device and no QEMU process, about 15.6 GB host memory available, no captured kernel termination lines, an unavailable device crash buffer, and only `settings.dat` in the emulator crash database. Logcat exited with code 255. This repeat confirms the immediate failure as emulator/ADB process loss during a later interaction; it does not establish why QEMU exited or a production adapter defect. The second multiple-selection callback, imperative update/clear, and teardown/reconnect cases remain unverified. Complete evidence is preserved in [artifact 13615793909](https://github.com/navidrezadoost/Smilodon/actions/runs/42476956655/artifacts/13615793909).

On this same PR head, CI, Tests, Phase 4 Certification, and Phase 4 Performance Baseline passed (runs `42476956626`, `42476956630`, `42476956662`, and `42476956620`). The Android certification job failed. PR #62 remains open and draft with no independent review or merge authorization; `PRODUCTION_NO_GO` remains in effect.

### Eighth hosted 178-F.1 attempt

Run [42477723912](https://github.com/navidrezadoost/Smilodon/actions/runs/42477723912) on PR head `2ed590f3861dca300cec0d9fd3735e7d412a2077` reused the checksum-pinned Gradle cache, booted the emulator, passed the pre-install and post-install ADB canaries, built and installed both packed packages and the APK, and launched the app. Continuous logcat recorded `APP_MOUNTED`, `SELECT_MOUNTED`, and the initial controlled `CHANGE` synchronization. During the after-mount hierarchy capture, ADB timed out; subsequent diagnostics found no connected device or QEMU process, about 15.7 GB host memory available, no captured kernel termination lines, and an unavailable device crash buffer. The run failed at `app-launch-and-mount` before WebView readiness or an interaction. This earlier stop on the same harness revision as the later successful partial interaction runs shows the hosted emulator failure is intermittent; it does not establish an adapter defect. Failure evidence is preserved in [artifact 13615679007](https://github.com/navidrezadoost/Smilodon/actions/runs/42477723912/artifacts/13615679007).

At head `2ed590f3861dca300cec0d9fd3735e7d412a2077`, CI, Tests, Phase 4 Certification, and Phase 4 Performance Baseline all passed (runs `42477723983`, `42477723940`, `42477724013`, and `42477723950`). The Android certification run failed as described above. No PR merge or independent review is recorded.

## 8. Directive 178-F.2 — Controlled emulator comparison

178-F.2 adds a standalone Android control app at `tests/react-native-runtime-control/`. It uses React Native `0.76.9` and React Native WebView `13.12.5`, the same API 35 Pixel 2 emulator profile, and the same pinned Gradle distribution as the Smilodon fixture. The control app has no Smilodon dependency. It presents a small HTML list in WebView with matching native controls for open, search, and selection.

The hosted comparison builds both release APKs, installs them in one emulator session, and runs three alternating trials per app (control, Smilodon, repeated). Each trial waits for app and WebView readiness, captures two screenshots and UI hierarchies at mount, open, filtered search, and selection, performs the same search and Beta selection, runs three ADB shell echo/boot-property probes, and preserves a continuous logcat slice. Per-trial evidence is stored separately. The subject app is built from packed Core and React Native tarballs produced by the checked-out revision. This comparison does not execute the full native bridge certification suite.

The Android executable is wrapped before launch by a process supervisor. The supervisor records its child PID and arguments, one-second host process-tree snapshots, emulator stdout and stderr, signal forwarding, and the child's exit code or terminating signal. A workflow outcome record captures whether the emulator action itself succeeded and whether the lifecycle/comparison reports were written. This is independent of ADB availability. The existing API, image target, architecture, profile, graphics options, and Gradle checksum remain pinned.

### 178-F.2 local validation

| Check | Result |
| --- | --- |
| Comparison and supervisor scripts: `node --check` | Passed |
| Targeted ESLint for comparison/supervisor scripts and control app | Passed |
| Control fixture `npm ci --no-audit --no-fund` | Passed (638 packages installed) |
| Control fixture Metro Android bundle | Passed |
| Workflow YAML parse and `git diff --check` | Passed |
| Local Android execution | Not available; this host has no Android SDK/emulator |

The hosted comparison has not yet run on this revision. Its results, QEMU exit evidence, matched completed trial counts, and platform decision are intentionally pending; no Android runtime or bridge pass is claimed. Previous 178-F and 178-F.1 run statuses and artifacts above remain unchanged. PR #62 remains draft and unmerged, independent review is pending, and `PRODUCTION_NO_GO` remains in effect.
