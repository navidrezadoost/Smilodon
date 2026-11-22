# React Data Synchronization Ownership — Issue #107

Status: merged into `main` by PR #108; shipped in `@smilodon/react@1.12.1`. See the [release record](../releases/REACT-1.12.1-RELEASE.md) for package qualification and registry verification.

## Ownership contract

- The React consumer owns source records, controlled selection, and configuration props.
- The React adapter sends a source-data operation to Core only when the supplied source snapshot changes semantically.
- Core's acknowledged data coordinator owns accepted response snapshots, request identity, query generation, and pagination position.
- Core's selection engine owns selected-key continuity; Core's presentation layer owns chip layout and latest-chip scrolling.

The adapter compares source props with its last successfully synchronized React snapshot. It must not compare those props with Core's current accepted snapshot: Core may contain cumulative pages that are intentionally absent from the consumer's original source array. A React render, selection update, or presentation update is not a data replacement.

Core's public `setItems()` and `setGroupedItems()` replacement behavior is unchanged. A consumer that intentionally needs to restart a semantically identical source must establish a new acknowledged search/generation; an incidental rerender is not a reset signal.

## Semantic comparison

Arrays compare by length and ordered enumerable own properties. Plain objects compare recursively by enumerable own string and symbol keys. Nested arrays and plain-object metadata are included, so a changed supported field is not silently omitted. Cyclic plain data is supported by pair tracking. Accessor properties compare by getter/setter identity without invoking them.

Functions and non-plain objects (including `Date`, `Map`, `Set`, DOM nodes, and class instances) compare by identity. Consumers should keep those values referentially stable when using them as metadata. The adapter's fast path treats an identical array/object reference as unchanged, so consumers must use immutable-props discipline and replace a record when changing its contents.

This comparison is linear in ordinary arrays and their enumerable properties, with bounded pair-tracking storage for nested/cyclic records. Fresh equivalent arrays need not be memoized to preserve acknowledged pages.

## Lifecycle order

The single configuration synchronization path applies initial configuration and later semantic configuration changes. The single data synchronization path then registers flat, automatically grouped, or explicitly grouped source data. Controlled-value synchronization follows source registration. An uncontrolled `defaultValue` is applied once after initial data registration. Acknowledged listeners and readiness ordering remain in place so the initial request is not opened before configuration, data, selection, and event subscriptions are ready.

An explicit empty `items` or `groupedItems` array is a valid source update. Omitted `items` uses a module-level stable empty array. Automatic flat-item grouping preserves the existing first-item `group` detection and group ordering.

Configuration equality includes the effective Core configuration. React `removeButtonIcon` nodes are rendered through the existing portal and are not passed as Core string-icon configuration. Function-valued Core configuration fields compare by identity so changed callbacks are not ignored.

## Latest-chip scroll interaction

Issue #100's `scrollToLatestChip` behavior is separately checked under a controlled multi-select update with newly allocated equivalent items, inline configuration objects, and an inline remove icon. The adapter should not call `updateConfig()` for equivalent configuration; this prevents an unrelated refresh from canceling the pending scroll. Core's cancellation rules remain responsible for canceling when the selected target is removed, layout is incompatible, or the custom element disconnects.

## Qualification record

The React integration regression reproduces against baseline `65eff03b747482e3859511defe2f9770c3e29384`: one equivalent-props rerender called `setItems()` twice. The regression asserts zero data/config writes for equivalent fresh props, then one write for a changed item field and one for an explicit empty dataset. Grouped-data, controlled-value, acknowledged-request, Strict Mode, stale-response, and browser scroll assertions passed in the qualification recorded below.

The browser fixture drives cumulative 6 → 12 → 18 acknowledged snapshots, rerenders the controlled multi-select with fresh equivalent source/config/icon values, selects an item from the third page, and checks that its chip remains visible and pagination state remains at page 4.

Local qualification on Node `20.20.2` / npm `10.8.2` passed: `npm ci`; Core and React builds; all React source integration tests (46/46); React contracts (44 passed, 6 documented skips); root `npm test` (655 Core tests passed, 1 skipped; 40 data-loading tests passed; 66 contracts passed, 6 skipped); full workspace build; packed React 18 and Solid 1.9 strict NodeNext/Bundler consumers; lint (0 errors, 6 existing warnings); and `git diff --check`. The React browser project passed 14/14 scenarios on system Google Chrome `133.0.6943.126`. The pinned Playwright Chromium executable and Firefox/WebKit binaries were unavailable, so this is not pinned-browser certification. The full build rewrote the tracked React Native Core bundle; its original bytes were restored and SHA-256 verified as `e221dc43cdf8c5529a76c479ce855af2eb3c608cd6c04fe96f99fdab4dfb3fc1`.

Issue #85's historical candidate at `29c67067b3bf345347f74e2dc074095dc9eb2ab9` was not integrated. Issue #107 covers the still-present source synchronization defect and strengthens the contract beyond reference-identity detection. Do not report the historical candidate as shipped.

## Release boundary

This change is React adapter behavior. It does not alter Core request protocol semantics or public peer ranges. It is included in the React `1.12.1` release candidate; package publication status and exact registry integrity are recorded in the release record. It does not republish Core or change Core's `1.18.0` artifact.

The investigation baseline declares workspace React `1.12.0` and Core `1.17.0`. A direct npm registry query confirms `@smilodon/core@1.18.0` exists with integrity `sha512-RW0JqFLAD/ntLK2L+lqAEcadVj0xF74Q86hN1YXIHgD75kdb/GNSBbumNz3nkqXgEEBVFKDr0XBVTgdrzS+ypA==`; registry React `1.12.0` declares Core peer range `^1.13.0`, which permits Core `1.18.0`. The reporter's exact installed package pair remains unverified because no consumer lockfile or `npm ls` output was supplied. This repository's regression tests run against the checked-out workspace source, not an inferred reporter installation.
