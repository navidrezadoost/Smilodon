# Directive 178-D — React Native Native-Entry Qualification

Status: **Diagnostic qualification complete; native runtime blocked by infrastructure.** No production code or dependency changes are included in this record.

## 1. Vue post-merge closure

PR [#59](https://github.com/navidrezadoost/Smilodon/pull/59) merged at `6ce40418848bd4b2a90a0e309a6405fb1ef127bc` on 2026-11-07. The following push workflows completed successfully on that exact merge commit:

| Workflow | Run | Result |
| --- | ---: | --- |
| CI | `42394141126` | Success |
| Tests | `42394141105` | Success |
| Phase 4 Certification | `42394141169` | Success |

PR #59 has no submitted reviews (`reviews: []`). The implementation is post-merge qualified by its PR checks and the successful main workflows above, but the missing independent approval remains a process exception; passing CI does not satisfy the review gate retroactively.

## 2. Baseline and reproducibility

- Branch: `test/178-d-react-native-native-qualification`
- Baseline: `6ce40418848bd4b2a90a0e309a6405fb1ef127bc` (`origin/main`)
- Worktree: `/tmp/smilodon-178-d`; it was clean at creation and is clean of source changes after the package build cleanup.
- Toolchain: Node.js `v24.13.1`, npm `11.8.0`.
- `npm ci` completed from the repository lockfile. The repository audit reported 45 existing dependency vulnerabilities; no audit fix or dependency change was made.
- Actual `@smilodon/core@1.10.0` and `@smilodon/react-native@1.10.0` packages were built and packed, then installed as tarballs in the external fixture `/tmp/smilodon-178-d-consumer`.

The external fixture pinned React Native `0.76.9`, React `18.3.1`, `react-native-webview` `13.12.5`, TypeScript `5.9.3`, and `@types/react` `18.3.18`. This is within the adapter's declared peer ranges. Its TS configs set `strict: true`, `skipLibCheck: false`, `jsx: "react-jsx"`, `lib: ["ES2022"]`, and `types: ["react", "react-native"]`; both set `customConditions: ["react-native"]`. No DOM library was included.

The NodeNext trace confirms that the package condition resolves `@smilodon/react-native` to the packed `dist/index.native.d.ts`, then resolves its `@smilodon/core` import to the packed `dist/types/src/index.d.ts`. The same React Native condition was used for Bundler resolution.

## 3. Strict packed-consumer reproduction

The fixture imports the packaged `Select`, `SelectProps`, `SelectHandle`, `SelectItem`, and `SelectValue`; renders it inside React Native's `View`; checks callback and ref types; and includes a negative assertion that rejects a string for the boolean `searchable` prop.

Commands:

```bash
./node_modules/.bin/tsc -p tsconfig.nodenext.json
./node_modules/.bin/tsc -p tsconfig.bundler.json
```

Both commands fail with the same six diagnostics. Complete output from each mode:

```text
node_modules/@smilodon/core/dist/types/src/components/enhanced-select.d.ts(11,45): error TS2689: Cannot extend an interface 'HTMLElement'. Did you mean 'implements'?
node_modules/@smilodon/core/dist/types/src/components/native-select.d.ts(2,50): error TS2689: Cannot extend an interface 'HTMLElement'. Did you mean 'implements'?
node_modules/@smilodon/core/dist/types/src/components/select-option.d.ts(46,43): error TS2689: Cannot extend an interface 'HTMLElement'. Did you mean 'implements'?
node_modules/@smilodon/core/dist/types/src/config/global-config.d.ts(12,16): error TS2304: Cannot find name 'ScrollBehavior'.
node_modules/@smilodon/core/dist/types/src/config/global-config.d.ts(14,13): error TS2304: Cannot find name 'ScrollLogicalPosition'.
node_modules/@smilodon/core/dist/types/src/utils/csp-styles.d.ts(66,56): error TS2304: Cannot find name 'ShadowRoot'.
```

## 4. Diagnostic ownership

All diagnostics are owned by published Smilodon Core declarations:

| Diagnostics | Ownership | Reason |
| --- | --- | --- |
| Three `TS2689` errors in `components/*.d.ts` | Smilodon Core declarations | The top-level Core declaration barrel loads Web Component classes that extend the browser-only global `HTMLElement`. |
| `ScrollBehavior` and `ScrollLogicalPosition` `TS2304` errors | Smilodon Core declarations | The public global configuration declarations refer to DOM library names. |
| `ShadowRoot` `TS2304` error | Smilodon Core declarations | The public CSP-style declarations refer to the browser-only global. |
| React Native framework declarations | No diagnostics | React Native `0.76.9` declarations type-check in the selected native environment. |
| React/Node/DOM global collisions | None observed | The fixture excludes `lib.dom.d.ts`; there are no duplicate or conflicting global declarations. |
| Fixture configuration or adapter-owned declarations | No diagnostics | The package exports, adapter declarations, JSX, props, callbacks, and ref all resolve/type-check up to Core's browser-only declaration graph. |

This is not a NodeNext-versus-Bundler resolution failure: both modes resolve the native adapter entry and reach the same Core type graph. The native package entry itself introduces no diagnostic in this fixture.

### Proposed minimal correction (not implemented)

Provide a native-safe Core type entry that contains the platform-neutral configuration types consumed by React Native and does not export Web Component classes or CSP helpers requiring DOM globals. Express the two scrolling fields with equivalent platform-neutral literal unions or move those fields behind web-only types. Point the React Native declaration path at that native-safe type surface. Keep the current browser Core entry and behavior intact. Add a packed native consumer check with the same no-DOM, strict, `skipLibCheck: false` configuration as a regression guard.

This is a proposal only. No source, package manifest, lockfile, or generated artifact change is part of Directive 178-D.

## 5. Build side effect observed

Building the React Native package runs `scripts/embed-core.mjs`, which rewrote the tracked `packages/react-native/src/generated/coreBundle.ts` in this worktree. Its SHA-256 changed from `e221dc43cdf8c5529a76c479ce855af2eb3c608cd6c04fe96f99fdab4dfb3fc1` at baseline to `dd14fa256fb20a7cbfb3c464390a8500fc53f26bf708d6c0d3ccb074fe095072` after the build. The file was restored after recording this observation; the evidence branch contains no generated source mutation. This is a build-side worktree mutation, separate from the TypeScript ownership finding.

## 6. Native runtime feasibility

Native runtime qualification is blocked by available infrastructure:

- `adb`: unavailable
- Android `emulator`: unavailable
- `ANDROID_HOME` / `ANDROID_SDK_ROOT`: unset
- `xcrun` / iOS Simulator tooling: unavailable in this Linux environment

No Android device/emulator or iOS simulator run was performed. Browser tests, including React Native Web, are not substituted for native runtime evidence.

## 7. Scope and disposition

This branch contains this evidence document only. It does not modify production code, dependencies, or integrity rules. The Vue merge commit's post-merge workflows are successful; PR #59's missing independent review remains documented as a process exception. React Native's packed strict type checks reproduce a Core-owned DOM declaration incompatibility, and native runtime qualification remains infrastructure-blocked.

Directive 178-D is evidence-complete for the available environment. The proposed Core type-entry correction requires a separately authorized implementation directive. `PRODUCTION_NO_GO` remains in effect.
