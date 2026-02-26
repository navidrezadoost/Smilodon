# Adapter Capability Matrix

This document provides a project-wide analysis of styling, functionality, eventing, and runtime limitations control across adapters.

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

| Area | Core Web Component | React | Vue | Svelte | Vanilla |
|---|---|---|---|---|---|
| Class-based styling (`classMap`) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Custom option renderer | ✅ | ✅ (React + DOM bridge) | ✅ (VNode + DOM bridge) | ✅ (DOM bridge) | ✅ |
| Group header renderer | ✅ | ✅ | ✅ | ⚠️ via grouped API only | ✅ via core element |
| CSS custom properties / parts | ✅ | ✅ | ✅ | ✅ | ✅ |
| Search + open/close/select/change events | ✅ | ✅ | ✅ | ✅ | ✅ |
| Clear-control event (`clear`) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Diagnostic event (`diagnostic`) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Infinite scroll/load-more hooks | ✅ | ✅ | ✅ | ✅ | ✅ |
| Runtime capability report | ✅ | ✅ (imperative handle) | ✅ (`defineExpose`) | ✅ (exported methods) | ✅ (helper functions) |
| Runtime limitation policy control | ✅ | ✅ | ✅ | ✅ | ✅ |
| Runtime tracking snapshot control | ✅ | ✅ | ✅ | ✅ | ✅ |

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
