# Known Limitations

This document tracks current limitations and trade-offs in Smilodon.

## Runtime Visibility and Control

Known limitations are also exposed at runtime through the core component API:

- `getKnownLimitations()`
- `setLimitationPolicies(policies)`

Tracking can be enabled through `updateConfig({ tracking: ... })` and inspected with `getTrackingSnapshot()`.

## Variable Item Height
Smilodon assumes fixed or estimated item heights for virtualization. Fully dynamic row heights are not yet supported. If your options have variable heights, you may see inaccurate scroll positions.

**Workaround:** Use consistent heights or set `estimatedItemHeight` to the most common height.

## Built-in Fetch/Pagination API
There is no built-in `fetchUrl`/`searchUrl` prop or pagination adapter in core. Server-side search and infinite scroll are implemented by the host app.

**Workaround:** Use `onSearch`/`onLoadMore` callbacks and call `setItems` when new data arrives.

## Virtualization Overhead for Small Lists
Virtualization provides major wins for large datasets but adds minor overhead for very small lists.

**Recommendation:** For tiny datasets (e.g., < 50 items), consider disabling virtualization if latency is critical.

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
