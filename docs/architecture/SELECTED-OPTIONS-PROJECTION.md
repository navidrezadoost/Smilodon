# Selected-Options Projection — Architecture and Qualification

Date: 2026-11-23

Worktree: `/tmp/smilodon-selected-projection`

Base candidate: `b1dc563c1e405239634a1354c1f211fb984610d6`

Disposition: **`E3.4.2_WEB_RELEASE_PUBLISHED — CHROME156_AND_FIREFOX148_PASS — CHROMIUM_147_AND_WEBKIT_UNVERIFIED — REACT_NATIVE_FEATURE_EXCLUDED`**

This is the implementation and qualification record. The web release version mapping, package provenance, and registry results are recorded in [WEB-1.20.0-RELEASE.md](../releases/WEB-1.20.0-RELEASE.md). No native runtime qualification is represented here. The source commit remains local and has not been merged to GitHub `main`.

## Contract and boundaries

Selected-first is a presentation-only stable partition. It does not reorder or mutate the caller's option array, selection data, group membership, or registry source indices. The default remains original order. For grouped lists, selected items are promoted only within their existing group; group order and group identity remain stable. Group headers are structural, nonselectable nodes. Flat and grouped options use the same flattened visual key order for keyboard navigation and selected-target resolution.

Selected-first is activated through the public Core configuration. Each opening snapshots the resolved `selectedOptions` policy, selected-key membership, and `scrollToSelected` policy. The projection snapshot drives the render plan and visual keyboard-navigation path. The private test activation gate has been removed. Updating configuration or selection while open does not reorder that opening; the next opening captures current values. Flat and grouped projection use the same render plan, preserve original source indices, and retain original order by default. The existing Issue #116 coordinator now implements all three `scrollToSelected.onOpen` policies: `preserve`, `reveal`, and `align`.

React Native Web is exercised as a web adapter. For the native React Native entry, the typed config is forwarded over the existing WebView bridge into the embedded Core runtime; the Core native type entry exposes `SelectedOptionsConfig` and partial `SelectConfigUpdate` members. This establishes a code-path/type compatibility decision only. No physical Android or iOS runtime was available, so native behavior is not runtime-qualified and must not be represented as certified.

## Phase E1 — Flat selected-first projection

Disposition: **`E1_FUNCTIONAL_AND_CHROME_AUTOMATION_PASS — CROSS_BROWSER_UNVERIFIED — FEATURE_PRIVATE`**

The E1 regression suite exercises selected-first through the private test seam. It verifies source/display identity, stable selected and unselected partitions, open-session ordering, keyboard behavior, selected target resolution, and guarded virtualization. The 10,000-option browser test verified selected source index 9,999 at display position 0, active source index 5,000 at display position 5,001, a mounted active descendant, five mounted options, and spacer/window geometry summing to total virtual height.

The first Playwright stall was a temporary local config missing localhost proxy bypass. Adding the committed config's `NO_PROXY`/`no_proxy` setup returned HTTP 200 for the local readiness request and allowed the test worker to launch. The E1 browser case passed 1/1 on Chrome for Testing `156.0.8078.4`, Playwright `1.59.1`, Node `26.10.0`. The repository-pinned Chromium, Firefox, and WebKit were not run.

At E1 close, Core had 713 passed/1 skipped, data-loading 48/48, contracts 66 passed/6 skipped, lint 0 errors/6 existing warnings, and aggregate workspace build passed. The generated React Native bundle baseline SHA-256 was restored to `e221dc43cdf8c5529a76c479ce855af2eb3c608cd6c04fe96f99fdab4dfb3fc1`.

## Phase E2 — Grouped within-group projection

Disposition: **`E2_WITHIN_GROUP_PROJECTION_LOCALLY_QUALIFIED — FEATURE_PRIVATE — CROSS_BROWSER_UNVERIFIED`**

E2 added the pure `projectSelectedOptionGroups` helper and integrated its output into the existing render plan. Group order, group object identity, source keys/indices, selected-item order, and unselected-item order remain intact. Duplicate labels are not treated as identity, and empty groups remain represented. Group headers are not selectable and are rendered by the existing header-renderer path.

Tests cover duplicate group labels and group identity, empty groups, selected/unselected partitions, source-index preservation, default and custom group headers, disabled traversal, Arrow/Home/End/Page movement, Shift range membership across group boundaries, type-ahead, filtering, and stability during an open session with recomputation on reopen. Browser coverage checks rendered header and option order, ARIA header semantics, source identity, active-descendant ownership, and keyboard traversal.

Local qualification: aggregate workspace build passed for Core, React, React Native, Solid, Svelte, Vanilla, Vue, and Playground; full `npm test` passed with Core 721 passed/1 skipped, data-loading 48/48, and contracts 66 passed/6 skipped; lint had 0 errors and 6 existing warnings. Grouped projection, E1 10,000-option virtualization, and Issue #116 animation/selected-scroll browser scenarios passed 3/3 on Google Chrome `133.0.6943.126`. Pinned Chromium was unavailable; Firefox and WebKit were not run. The React Native generated bundle was restored to the same baseline hash above.

## Phase E3.1 — Public Core configuration contract

Disposition: **`E3.1_CORE_CONFIGURATION_QUALIFIED — RENDERING_NOT_YET_CONNECTED`**

Core now exports:

```ts
interface SelectedOptionsConfig {
  placement: 'original' | 'selected-first';
  groupedPlacement: 'within-group';
}

interface ScrollToSelectedConfig {
  enabled: boolean;
  multiSelectTarget: 'first' | 'last';
  onOpen: 'preserve' | 'reveal' | 'align';
  behavior?: 'auto' | 'instant' | 'smooth';
  block?: 'start' | 'center' | 'end' | 'nearest';
}
```

Resolved defaults are `selectedOptions: { placement: 'original', groupedPlacement: 'within-group' }` and `scrollToSelected.onOpen: 'reveal'`. Global configuration and per-instance updates accept partial nested values. A valid partial update preserves sibling settings; reset restores these defaults. Caller-owned objects are copied, not mutated.

The exported validators reject non-plain objects, unsupported enum values, invalid `enabled` types, and unknown fields. At runtime, an invalid `selectedOptions` or `scrollToSelected` section is ignored while unrelated valid configuration fields in the same update still apply. The section-level update is atomic: one invalid field rejects that entire section patch and leaves its prior resolved value intact.

Each dropdown opening snapshots the resolved selected-options policy. Updating the policy while open leaves that snapshot unchanged; the next open captures the new values. E3.2 connects that policy and the selection membership at open to flat/grouped projection and visual navigation, replacing the private test-only activation gate. Current selected state still drives selection styling, events, and target resolution. E3.3 implements `preserve`/`reveal`/`align` in the existing Issue #116 coordinator, as detailed below.

E3.1 qualification on the current local tree:

- E3.1 targeted public-config and projection tests: **16/16 passed**.
- Public configuration type fixture passed strict TypeScript checking with `npx tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution Bundler --lib ES2022,DOM,DOM.Iterable --skipLibCheck --types node,vitest packages/core/tests/selected-options-public-config.types.ts`.
- E3.1 full `npm test`: Core **727 passed, 1 skipped**; data-loading **48/48**; contracts **66 passed, 6 skipped**.
- Core build passed. The existing Rollup `eval` warning from `src/utils/security.ts` remains.
- Lint: **0 errors, 6 existing warnings**.
- No adapter implementation or package version changed. E3.1 did not run a new browser matrix because it did not yet connect the public configuration to rendering or scrolling.

## Phase E3.2 — Public Core projection activation

Disposition: **`E3.2_PUBLIC_CORE_PROJECTION_LOCALLY_QUALIFIED — CROSS_BROWSER_UNVERIFIED`**

The render plan now consumes the public `selectedOptions` policy snapshot. At open, Core captures both the resolved policy and selected-key membership. Flat and grouped ordering, initial selected-active resolution, keyboard movement, type-ahead, Shift-range selection, virtualization, and selected-target ordering consult that opening policy. The selection membership used for ordering remains fixed for the open session, while current selection continues to control styling and callbacks. Closing discards the membership snapshot. A subsequent opening captures current configuration and selection. The private `_selectedFirstProjectionForTesting` production authority and all test/browser dependencies on it were removed.

Coverage includes default and explicit original order; flat and within-group stable projection; group order and identity; global and instance configuration; configuration updates while open and while closed; selection changes while open and reopen; filtered eligible keys; source/display index identity; keyboard and range order; selected-target lookup; virtualization windows; and legacy consumers that omit the setting. Browser tests now activate the public configuration directly.

E3.2 local qualification:

- Targeted projection/config/navigation/virtualization/target unit set: **62/62 passed** with a 60-second test timeout. The first invocation used Vitest's 5-second default and timed out on two 10,000-item cases without assertion failures; the rerun passed those same cases. The per-case timeout for this large-list test is now 60 seconds; its assertions are unchanged.
- Full `npm test`: Core **727 passed, 1 skipped**; data-loading **48/48**; contracts **66 passed, 6 skipped**. The full Core run also used the test's 60-second per-case timeout.
- Core build passed. Rollup continues to emit the existing `eval` warning from `src/utils/security.ts`.
- Lint passed with **0 errors and 6 existing warnings**. `git diff --check` passed.
- Public-config browser activation, grouped projection, keyboard/range order, 10,000-option virtualization, and the Issue #116 open-scroll scenario passed **4/4** on system Google Chrome `133.0.6943.126` via `/usr/bin/google-chrome-stable` (Node `v26.10.0`, npm `12.2.0`). An initial attempt against stale Core `dist` failed three projection checks while the Issue #116 scroll scenario passed; after rebuilding Core, all four passed. Repository-pinned Chromium, Firefox, and WebKit were unavailable and remain unverified.
- The temporary local Playwright config used to point at installed Chrome was removed. The React Native generated bundle SHA-256 matched the baseline before and after: `e221dc43cdf8c5529a76c479ce855af2eb3c608cd6c04fe96f99fdab4dfb3fc1`. No React Native build was run in E3.2. Native configuration type exposure and behavior remain an E3.4 decision.

## Phase E3.3 — Open-time scroll policies and viewport preservation

Disposition: **`E3.3_PUBLIC_CORE_PROJECTION_AND_OPEN_SCROLL_POLICIES_LOCALLY_QUALIFIED — CROSS_BROWSER_UNVERIFIED`**

The opening coordinator snapshots `scrollToSelected` policy when the dropdown opens. `reveal` remains the default and scrolls only when the selected target is not fully visible. `align` always applies the requested `block` alignment where scroll bounds permit; `nearest` makes no movement for an already-visible target. All physical movement is clamped to the options scroller's valid range. `enabled: false` prevents automatic positioning and immediately cancels pending work. The coordinator still waits for finite entrance animations and cancels on keyboard changes, user pointer/wheel/touch input, actual user scrolling, close, disconnect, and a newer opening.

`preserve` leaves the current scroll position alone when the displayed key order is unchanged. If an ordering change between openings moves existing keys, Core captures the first visible stable key and its viewport-relative offset, then restores that anchor after the new render plan is applied. If the key is no longer available, it falls back to the previous numeric `scrollTop`, clamped to the current valid range. Anchor restoration does not change selection or active-key state. The existing coordinator is the sole physical-scroll owner for the restoration; the virtualizer may update its rendered window in response but does not perform a second correction.

E3.3 local qualification on the current worktree:

- Full `npm test`: Core **734 passed, 1 skipped**; data-loading **48/48**; contracts **66 passed, 6 skipped**.
- The first full-suite attempt exposed an existing Issue #116 unit fixture with zero scrollable height and a partial virtualizer mock without `computeWindow`. The fixture now supplies realistic scroll bounds, and viewport-anchor capture falls back safely when a test double lacks the virtualizer method; the full suite passed on rerun.
- Full workspace `npm run build` passed for Core, React, React Native, Solid, Svelte, Vanilla, Vue, and Playground. Existing Rollup `eval`, package export-condition, source-map, and React `use client` warnings were emitted. The build rewrote the tracked React Native generated bundle; its original checked-in bytes were restored and SHA-256 verified as `e221dc43cdf8c5529a76c479ce855af2eb3c608cd6c04fe96f99fdab4dfb3fc1`.
- Lint passed with **0 errors and 6 existing warnings**. `git diff --check` passed.
- Browser regressions passed **8/8** on system Google Chrome `133.0.6943.126` via `/usr/bin/google-chrome-stable`, using the repository Playwright setup with a temporary local executable override. The run covered all public policies, `align` start/center/end/nearest, visible and offscreen reveal, preserve across selected-first reorder, disabled suppression, grouped projection, keyboard visual order, 10,000-option virtualization, and Issue #116 entrance-animation coordination. The temporary config is not part of the intended changes.
- Repository-pinned Chromium, Firefox, and WebKit remain unverified. Browser evidence is local Chrome-only and does not establish cross-browser certification.
- No package version or adapter implementation was changed. E3.3 does not qualify React Native runtime behavior.

## Phase E3.4 — Adapter configuration parity

Disposition: **`E3.4_WEB_ADAPTER_PARITY_LOCALLY_QUALIFIED — NATIVE_RUNTIME_UNVERIFIED — CROSS_BROWSER_UNVERIFIED`**

The adapter audit found that all five web adapters can carry the Core `selectedOptions` and `scrollToSelected` settings through their existing configuration model; no redundant top-level `selectedOptions` prop was added. `SelectInstanceConfig` now expresses partial nested updates so consumers can provide, for example, only `selectedOptions.placement` or `scrollToSelected.onOpen` without supplying unrelated required fields. Public adapter entry points expose the relevant config types. Vanilla factory and imperative update helpers use the same instance-update type.

Reactive/lifecycle corrections ensure configuration changes reach Core: Vue watches `config`, `scrollToSelected`, `selectionConfig`, and `multiSelectDisplay`; Svelte's reactive block explicitly reads every config input; React retains its existing semantic configuration comparison; Solid's effect tracks the config inputs; Vanilla applies explicit factory and update-helper input. Adapter-generated `scrollToSelected` configuration is now omitted when its convenience prop is absent, preventing a partial unrelated update from replacing a config-owned `enabled: false` or other sibling values.

The native React Native entry uses the existing WebView bridge and passes Core configuration into the embedded Core runtime. Its public native types include the partial selected-options update shape. This is supported by source/type-path inspection, not by a device execution. Android physical-device qualification and iOS runtime qualification remain unverified; no native runtime pass is claimed.

E3.4 local qualification on this combined worktree:

- Full `npm test`: Core **734 passed, 1 skipped**; data-loading **48/48**; contracts **72 passed, 6 skipped**. The adapter parity contract is included in the contract total.
- Strict adapter type fixture passed with `npx tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution Bundler --lib ES2022,DOM,DOM.Iterable --jsx react-jsx --skipLibCheck --types node tests/contracts/selected-options-adapter-types.ts`.
- Full `npm run build` passed for Core, React, React Native, Solid, Svelte, Vanilla, Vue, and Playground. Existing Rollup `eval`, export-condition, source-map, and React `use client` warnings remain. The build-generated React Native bundle was restored to baseline SHA-256 `e221dc43cdf8c5529a76c479ce855af2eb3c608cd6c04fe96f99fdab4dfb3fc1`.
- `npm run lint` passed with **0 errors and 6 existing warnings**. `git diff --check` passed.
- Real-browser adapter parity passed **1/1** on system Google Chrome `156.0.8078.4` via `/usr/bin/google-chrome-stable`. It exercised React, React Native Web, Vue, Svelte, Solid, Vanilla, and direct Core. Each case checks selected-first opening order, a partial config update while open, preservation of the remaining `scrollToSelected` settings and the open-session snapshot, and original order on the next opening. The repository-pinned Chromium, Firefox, and WebKit were unavailable and remain unverified.
- React contract coverage exercises controlled updates under `StrictMode` and an uncontrolled `defaultValue`; both retain the selection across a config update/reopen, frozen source items remain unchanged, and config-only updates do not emit `onChange`.
- Update-before-mount and adapter unmount during entrance animation were not separately exercised for every framework. The Core coordinator's cancellation behavior has unit coverage, but adapter-specific cleanup and duplicate physical scroll-command instrumentation remain open qualification items.
- Package versions, lockfile, and published package metadata remain unchanged; the source API/type updates described here are not yet published. No publication, commit, push, PR, hosted workflow, or merge was performed.

## Phase E3.4.1 — Adapter lifecycle and packed-consumer qualification

Disposition: **`E3.4.1_WEB_LIFECYCLE_AND_PACKED_TYPES_LOCALLY_QUALIFIED — NATIVE_RUNTIME_UNVERIFIED — CROSS_BROWSER_UNVERIFIED — RELEASE_NOT_READY`**

E3.4.1 adds adapter lifecycle cases for all seven browser integrations: React, React Native Web, Vue, Svelte, Solid, Vanilla, and direct Core. The detached-mount case applies two configuration changes and a selection change through each integration's own update path, waits for reactive frameworks to commit while their element is disconnected, asserts the element remains disconnected, then mounts and verifies the latest configuration and selection on first open. This specifically exercises React's `flushSync`, Vue's `nextTick`, Svelte's `tick`, Solid's synchronous signal updates, and the imperative Vanilla/Core paths.

The open-session case changes only `selectedOptions.placement` through the adapter API while the dropdown is open. It verifies the current opening retains its original order, the next opening uses the new order, and all `scrollToSelected` siblings—including `enabled: false`—remain intact. This prevents adapter forwarding from manufacturing an unrelated scroll update or prematurely changing an open-session snapshot.

Animation lifecycle tests set a finite 600 ms entrance animation and an offscreen selected option, open the dropdown, then invoke the relevant integration's disposer before the animation completes. Instrumentation around the actual options scrollport records `scrollTo`, `scrollIntoView`, and changes to the `scrollTop` property independently. No subsequent physical movement was observed during the 750 ms post-disposal interval for any of the seven paths. The wheel-interaction case likewise produced no deferred physical movement after user input cancelled the scheduled positioning. A successful offscreen-target case confirms that an enabled `align` policy produces physical positioning through no more than one `scrollTo`/`scrollIntoView` API call and no more than one immediate `scrollTop` movement per opening. Fully visible targets and `preserve` are not required to move.

E3.4.1 local qualification:

- The adapter parity and lifecycle Playwright set passed **6/6** on system Google Chrome `156.0.8078.4` via `/usr/bin/google-chrome-stable` (the existing parity scenario plus five lifecycle cases). Repository-pinned Chromium, Firefox, and WebKit remain unverified.
- The full `npm test` passed after the final browser-fixture refinement: Core **734 passed, 1 skipped**; data-loading **48/48**; contracts **72 passed, 6 skipped**.
- Full `npm run lint` passed after the final browser-fixture refinement with **0 errors and 6 existing warnings**.
- Full `npm run build` passed after the final browser-fixture refinement for all workspaces. Existing Rollup `eval`, package export-condition, source-map, and React `use client` warnings remain. The build-generated React Native bundle was restored to the exact base SHA-256 `e221dc43cdf8c5529a76c479ce855af2eb3c608cd6c04fe96f99fdab4dfb3fc1`.
- `scripts/test-selected-options-packed-consumers.mjs` packed Core, React, Vue, Svelte, Solid, and Vanilla from the candidate and passed strict `skipLibCheck: false` NodeNext and Bundler consumer checks for public adapter types and partial nested settings. The first run exposed two candidate declaration mismatches: Vue's cleaned `updateConfig` type used stale `GlobalSelectConfig`, and Svelte's committed `src/index.d.ts` omitted type exports that its runtime `src/index.ts` exposed. The candidate now aligns Vue cleanup output to `SelectInstanceConfig` and Svelte declaration re-exports to the runtime entry; the packed matrix passed after those fixes. This is candidate declaration correction evidence, not proof of compatibility across every framework-major version.
- The packed Solid entry also passed both modes in this fixture; the previously noted strict NodeNext limitation did not reproduce for this package graph and selected-options consumer. This does not establish compatibility for every downstream Solid/toolchain version.
- For native React Native types, the actual Core and React Native tarballs were built and extracted into a clean temporary consumer. Strict DOM-free NodeNext and Bundler checks passed for the `react-native` entry and partial selected-options update types. The repository's native-consumer script could not complete its `npm install` because the environment could not fetch uncached dependencies; its offline retry also lacked a transitive package. Thus native type resolution from the actual packed artifacts was checked, but the scripted install path was not fully reproduced.
- Android and iOS runtime were not exercised. Native bridge behavior, platform lifecycle, and native physical scrolling remain explicitly unverified. React Native Web is covered only as a browser integration.
- The React Native generated bundle remains byte-identical to the base file after the final workspace build. No package version, release metadata, workflow, or lockfile change was made. No commit, push, PR, hosted workflow, merge, or publication occurred.

The E3.4.1 browser/lifecycle and packed type scopes are locally qualified for the configurations exercised above. E3.4.2 records the browser-engine and native feature dispositions below; no release readiness is inferred from these local checks.

## Phase E3.4.2 — Browser matrix and native feature disposition

Disposition: **`E3.4.2_CHROME156_AND_PINNED_FIREFOX_PASS — PINNED_CHROMIUM_CDN_BLOCKED — WEBKIT_HOST_DEPENDENCIES_MISSING — NATIVE_RUNTIME_EXCLUDED_FROM_THIS_FEATURE_CLAIM — RELEASE_NOT_READY`**

The selected-options browser matrix contains 14 tests spanning flat/grouped projection, visual keyboard order and ARIA active descendant, selected-target ordering, 10,000-item guarded virtualization, `preserve`/`reveal`/`align`, all seven web integrations, pre-connection configuration, partial updates while open, animation disposal, wheel cancellation, and physical scroll ownership.

| Engine / runtime | Result | Classification |
| --- | --- | --- |
| System Chrome `156.0.8078.4` | **14/14 passed** | Tested and passed. This is not the repository-pinned Chromium build. |
| Playwright Firefox `148.0.2` (Playwright `1.59.1`, build `1511`) | **14/14 passed** | Tested and passed. |
| Playwright Chromium `147.0.7727.15` (build `1217`) | Not run | Playwright CDN returned HTTP 403 with “service is not available in your location.” The browser binary could not be obtained; system Chrome was not substituted for this pinned result. |
| Playwright WebKit `26.4` (build `2272`) | Browser launch failed before scenarios | Tested but not executable on this host. Playwright reports missing `libicu74`, `libxml2`, and `libflite1`; Manjaro has ICU 78 and does not supply the required Ubuntu 24.04 runtime libraries. No WebKit scenario result is claimed. |

Firefox initially exposed an over-specific test assertion: it expected the virtual render window's `startIndex` to equal the active option's display index. Firefox included one preceding option in the overscan window (`startIndex: 5000`, active display index `5001`); the target was mounted, its source/display identity and ARIA state were correct, and spacer geometry remained valid. The test now asserts that the render window covers the active display index (`startIndex <= activeDisplayIndex < endIndex`) while retaining the mounted-key, index, active-descendant, virtualization bound, and total-height assertions. This records the actual render-window contract without engine-specific exact-start assumptions. The suite then passed 14/14 on Firefox and 14/14 on Chrome 156. No browser-specific product code or tolerance was introduced.

### Native platform decision

The current documentation describes native WebView and React Native Web as separate execution paths, says shared types and bridge forwarding do not establish equivalent advanced runtime behavior, and explicitly says the selected-options bridge has not been exercised on Android or iOS. It does not promise selected-first projection parity on native platforms. The package remains a maintained React Native integration for its documented existing scope; this decision does not change its overall peer compatibility or make a general React Native support-policy change.

For this candidate, **selected-options projection and open-time positioning are excluded from the certified React Native Android/iOS feature claim**. The native declarations and source forwarding exist, but the checked-in embedded Core bundle remains at its exact baseline bytes and no Android or iOS runtime has been exercised. Therefore, the native package must not be described as providing this new feature until the embedded runtime is updated under separate authorization and the bridge is tested on both platforms. React Native Web remains covered by the browser matrix above. This is an explicit feature-specific exclusion, not a native pass.

Android runtime was not executable here: `ANDROID_HOME` and `ANDROID_SDK_ROOT` are unset and `adb` is absent. `/dev/kvm` exists, but no emulator run was started; prior certification directives prohibit more emulator experiments without a physical device. iOS runtime was not executable because this host is Linux and has no `xcrun` or iOS simulator/device environment. The DOM-free native packed-type check remains type evidence only. The scripted native consumer installation is still incomplete due unavailable npm dependencies.

### E3.4.2 final qualification gates

- `npm test`: **734 Core passed, 1 skipped; data-loading 48/48; contracts 72 passed, 6 skipped**.
- `npm run lint`: **0 errors, 6 existing warnings**.
- `npm run build`: passed for all workspaces. Existing build warnings remain; the generated React Native bundle was restored to base SHA-256 `e221dc43cdf8c5529a76c479ce855af2eb3c608cd6c04fe96f99fdab4dfb3fc1`.
- Packed web consumers: Core, React, Vue, Svelte, Solid, and Vanilla passed strict NodeNext and Bundler checks with `skipLibCheck: false`, including partial nested settings. Solid passed in this tested graph; universal consumer compatibility is not inferred.
- Browser suite: Chrome 156 **14/14** and pinned Firefox **14/14**. Pinned Chromium is blocked by the CDN 403; WebKit is blocked before test execution by host shared-library dependencies.
- Native Android/iOS runtime: explicitly excluded from this feature's certification claim, not passed.
- Package versions, lockfile, and workflows remain unchanged. No commit, push, PR, hosted workflow, merge, or publication occurred.

E3.4.2 has an explicit evidence-backed disposition for native platforms and unavailable browsers. Chrome 156 and pinned Firefox passed; pinned Chromium and WebKit remain uncertified for the stated environment reasons. The web-only release decision retains these limitations and does not advertise selected-options native runtime parity.
