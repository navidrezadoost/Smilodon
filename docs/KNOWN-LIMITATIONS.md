# Known Limitations

This document tracks current limitations and trade-offs in Smilodon.

## Runtime Visibility and Control

Known limitations are also exposed at runtime through the core component API:

- `getKnownLimitations()`
- `setLimitationPolicies(policies)`

Tracking can be enabled through `updateConfig({ tracking: ... })` and inspected with `getTrackingSnapshot()`.

## Variable Item Height
The guarded viewport-windowing implementation assumes fixed or estimated item heights. Fully dynamic row heights are not certified; varying row sizes may produce inaccurate scroll positions in that guarded path.

**Workaround:** Use consistent heights or set `estimatedItemHeight` to the most common height when evaluating the guarded test implementation.

## Viewport Virtualization Status

The public `virtualize` configuration on `EnhancedSelect` enables chunked rendering for large flat lists, not viewport-windowed rendering. Rows are eventually all mounted, so this setting does not guarantee DOM size proportional to the visible window. The actual `virtual-window` integration is guarded by a private test seam and is not a supported or production-certified public mode. The public default remains legacy rendering.

The separate `NativeSelectElement` API has its own virtualizer implementation and compatibility surface; its behavior must not be inferred from the `EnhancedSelect` setting. See the [Phase 4 virtualization architecture record](./architecture/PHASE-4-VIRTUALIZATION.md) and [certification record](./architecture/PHASE-4-CERTIFICATION.md).

## Built-in Fetch/Pagination API
There is no built-in `fetchUrl`/`searchUrl` prop, page store/cache, request-cancellation policy, or pagination adapter in core. Server-side search and infinite scroll are host-controlled. Core emits search/load-more signals and presents busy state; the host fetches and replaces/appends data with `setItems`.

**Workaround:** Use `onSearch`/`onLoadMore` callbacks and call `setItems` when new data arrives. The host should cancel or ignore stale responses so an older request cannot overwrite newer results.

## Chunked Rendering for Large Lists
The public `virtualize` setting may render large flat lists in chunks, but still mounts the complete result set when rendering finishes. It is not a production viewport-virtualization feature.

**Recommendation:** Do not use `virtualize: true` as evidence of bounded DOM or viewport virtualization. The guarded windowed path is test-only pending final certification and activation approval.

## Runtime Switching Between Single/Multi
Switching between single-select and multi-select modes at runtime is limited. Some UI state (badges, selection set) may require a full reset.

**Recommendation:** Recreate the component or clear selection when toggling modes.

## Supported Browsers
Smilodon targets modern evergreen browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+

Older browsers may work but are not officially supported.

## Playwright WebKit on Arch-based Linux
The Playwright WebKit bundle depends on older system libraries (e.g., ICU 74, libvpx9, libxml2 ABI). These are not available in standard Arch/Manjaro repos.

**Workaround:** Run WebKit e2e tests inside the Playwright Docker image instead of native execution.
