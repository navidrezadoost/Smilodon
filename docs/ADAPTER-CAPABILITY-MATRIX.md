# Adapter Capability Matrix

This document inventories declared API surface, not feature parity or release certification. Coverage depth varies by adapter; the [Phase 4 feature-contract audit](./architecture/PHASE-4-FEATURE-CONTRACT-AUDIT.md) is the current status record. Do not infer browser-verified behavior from a checkmark in this table.

## Core Runtime Contract (all adapters)

The `enhanced-select` web component now exposes user-controllable runtime inspection APIs:

- `getCapabilities()`
- `getKnownLimitations()`
- `setLimitationPolicies(policies)`
- `getTrackingSnapshot()`
- `clearTracking(source?)`

New diagnostic event:

- `diagnostic` (enabled through `tracking.emitDiagnostics`)

## Capability Matrix

| Area | Core Web Component | React | Vue | Svelte | Solid | React Native | Vanilla |
|---|---|---|---|---|---|---|---|
| Class-based styling (`classMap`) | API | API | API | API | API | Platform-specific | API |
| Custom option renderer | API | API (React + DOM bridge) | API (VNode + DOM bridge) | API (DOM bridge) | API | WebView/web path | API |
| Group header renderer | API | API | API | Partial (grouped API) | API | API | Core element API |
| CSS custom properties / parts | API | forwarded | forwarded | forwarded | forwarded | bridged style map / web | Core element API |
| Search + open/close/select/change events | API | callbacks | emits | component events | callbacks | callbacks | callbacks/events |
| Clear-control event (`clear`) | API | callback | emit | component event | callback | callback | callback/event |
| Diagnostic event (`diagnostic`) | API | callback | emit | component event | callback | callback | callback/event |
| Infinite scroll/load-more hooks | host signal | callback | emit | component event | callback | callback | callback/event |
| Runtime capability report | API | imperative handle | exposed method | exported method | handle | handle | helper function |
| Runtime limitation policy control | API | prop/handle | prop/method | prop/method | prop/handle | config/handle | helper function |
| Runtime tracking snapshot control | API | prop/handle | prop/method | prop/method | prop/handle | config/handle | helper function |
| Busy-bucket custom content (Issue #90; Core `1.13.0`) | Native Core slots | `loadingIcon` / `loadingContent` props | `#loadingIcon` / `#loadingContent` slots | Svelte 5 `Snippet` props | JSX props | Not exposed; separate decision | Native slotted DOM nodes |

`API` means the source exposes the corresponding surface; it does not mean every branch is comprehensively tested. Issue #90 adapter contract tests cover Core, React, Vue, Svelte, Solid, and Vanilla locally. The browser layout assertion has been run against the React adapter fixture on local Chrome 133; Vue, Svelte, and Solid have build and DOM-contract results, not separate real-browser qualification. React Native's native WebView and React Native Web paths are excluded from this web feature. The configured framework Playwright projects filter shared scenarios that boot the Vanilla playground; their project names do not constitute browser tests of each wrapper.

## Known Limitations (Tracked + User-Controllable)

The following limitations are now available as machine-readable records from `getKnownLimitations()` and can be controlled by `setLimitationPolicies()`:

- `variableItemHeight`
- `builtInFetchPaginationApi`
- `virtualizationOverheadSmallLists`
- `runtimeModeSwitching`
- `legacyBrowserSupport`
- `webkitArchLinux`

Policy modes:

- `default`: keep normal behavior and tracking
- `suppress`: suppress limitation state visibility in status
- `strict`: mark limitation as strict-policy controlled (host app can enforce additional restrictions)

## Runtime Tracking Controls

Configure from user-side with `updateConfig({ tracking: ... })`:

- `tracking.enabled`
- `tracking.events`
- `tracking.styling`
- `tracking.limitations`
- `tracking.emitDiagnostics`
- `tracking.maxEntries`

Tracking buckets returned by `getTrackingSnapshot()`:

- `events`
- `styles`
- `limitations`

## Limitation Mitigation Controls

Configure from user-side with `updateConfig({ limitations: ... })`:

- `limitations.policies`
- `limitations.autoMitigateRuntimeModeSwitch`

When `autoMitigateRuntimeModeSwitch` is enabled, mode changes (`single` ↔ `multi`) auto-clear selection state to avoid stale UI state.

## Adapter Usage Notes

### React

Use `SelectHandle` methods:

- `getCapabilities()`
- `getKnownLimitations()`
- `getTrackingSnapshot()`
- `clearTracking(source?)`
- `setLimitationPolicies(policies)`

And props:

- `trackingEnabled`, `trackEvents`, `trackStyling`, `trackLimitations`
- `emitDiagnostics`, `trackingMaxEntries`
- `limitationPolicies`, `autoMitigateRuntimeModeSwitch`
- `onDiagnostic`

### Vue

Use component props matching the same tracking/limitation keys and consume:

- `@diagnostic`

Use exposed methods through template ref:

- `getCapabilities()`, `getKnownLimitations()`
- `getTrackingSnapshot()`, `clearTracking(source?)`
- `setLimitationPolicies(policies)`

### Svelte

Use exported props/events and methods with the same names as Vue/React runtime controls.

### Vanilla

Use helper APIs:

- `getCapabilities(element)`
- `getKnownLimitations(element)`
- `getTrackingSnapshot(element)`
- `clearTracking(element, source?)`
- `setLimitationPolicies(element, policies)`
