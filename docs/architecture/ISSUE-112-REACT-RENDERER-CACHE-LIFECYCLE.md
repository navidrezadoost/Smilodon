# Issue #112 — React renderer cache lifecycle

Status: **Review corrections locally qualified for the exercised source and browser scenarios; cross-version runtime verification and integration remain pending.** No hosted workflow, push, PR, merge, tag, or publication was performed.

Worktree: `/tmp/smilodon-issue112`
Branch: `fix/112-react-acknowledged-renderer-cache`
Baseline: `origin/main` at `ab28fcf850ec3044b2655e1f6677040c894462bb`

## Defect and ownership rule

The React adapter kept custom option and group-header roots in index-keyed caches, then truncated them using `items.length` or `groupedItems.length`. Those props describe the consumer's source input. With acknowledged pagination, Core may own and render a larger accepted cumulative dataset than the current source props describe. A controlled selection or equivalent source-prop rerender could therefore dispose roots for still-visible later-page options, leaving blank but selectable options.

The ownership rule is: **React disposes a cached renderer root when its rendered container is no longer part of Core's options container, not when the source props have fewer entries.** This keeps the fix inside the React adapter and adds no public API.

## Implementation

`packages/react/src/Select.tsx` now observes direct child-list changes on Core's `.options-container` and reconciles both option and group-header renderer caches after DOM mutations settle. A root is retained while its container remains attached, including a container temporarily detached and reattached during one Core projection. A removed container is deleted from the cache synchronously before its root is scheduled for unmount, so a later item at the same index cannot reuse a root already queued for disposal. Existing renderer-removal and component-unmount cleanup remains in place.

The observer watches direct children rather than the subtree so React updates inside a renderer container do not trigger unnecessary cache reconciliation. It is installed after the adapter reports the custom element ready. The React Vitest setup pre-registers the custom element, so the suite does not claim an isolated delayed-registration test.

## Regression coverage

`packages/react/tests/renderer-cache-acknowledged.spec.tsx` covers:

- Flat acknowledged pages growing from 6 to 12 to 18, followed by controlled **multi-select** selection of a later-page item while retaining the initial selection, then fresh equivalent six-item props, under React StrictMode.
- Grouped cumulative pages with controlled multi-select, later option content, and group headers retained after controlled rerender.
- Genuine dataset shrink, unmount of removed React content, correct content for replacement items at reused indices, and component unmount disposal.
- Removal of the React renderer, including disposal of its roots.

`playground/react-certification.tsx` and `tests/e2e/scenarios/react-adapter.spec.ts` add an Issue #112 browser scenario. It verifies actual custom DOM content for all 18 accepted options, selects a later-page option in controlled multi-select while preserving the initial selection, rerenders equivalent initial source props, and checks both selected values and later-page custom content again.

## Qualification record

| Check | Result |
| --- | --- |
| Failing reproduction before the fix | Passed as a regression check: later-page custom content for item 7 disappeared after controlled selection and equivalent source props. |
| Focused React renderer-cache integration | 4/4 passed after the fix. |
| Root unit, data-loading, and contract suites | 659 Core unit passed, 1 skipped; 48 data-loading passed; 66 contracts passed, 6 skipped. |
| React integration suite | 51 passed on the final source, including renderer-removal and replacement-content assertions. |
| Controlled multi-select regression | Flat and grouped integration coverage passed; the Chrome scenario selected a later-page item while retaining the initial selected item. |
| All-workspace build | Passed on Node 20.20.2 / npm 10.8.2; the final React-specific build also passed after the observer-readiness adjustment. Existing Rollup `eval`, `use client`, and package export-condition warnings were emitted. The all-workspace build rewrote the tracked React Native generated bundle; it was restored to the exact baseline bytes before final status. |
| Lint | Passed with 0 errors and 6 existing warnings in documentation-site and benchmark JavaScript. |
| Packed React/Solid strict consumer check | Passed using the repository's packed-consumer script. |
| Browser regression | 1/1 passed on Chrome for Testing 156.0.8078.4. Pinned Chromium 147 was unavailable; Firefox and WebKit were not run. |
| Preliminary cross-version install probe | npm offline installation succeeded for Core 1.18.0 and the local Core 1.19.0 candidate paired with an earlier packed React 1.12.1 build. Its browser smoke did not reach the acknowledged-data readiness handshake (`_acknowledgedReady` remained false and no coordinator was created). This predates the final observer-readiness refinement and is not qualification evidence for the final adapter candidate or either Core version. |
| Delayed custom-element registration | Not independently tested: the React Vitest setup pre-registers the element. The cache observer is readiness-gated in the adapter, but this lifecycle case remains a coverage limitation. |
| Hosted Actions | Not run, per the active restriction. |

The Core 1.18.0 registry version was confirmed available. The Core 1.19.0 tarball came from the separate local Issue #111 candidate. The preliminary installation probe verifies package resolution only; no adapter behavior is inferred from its unsuccessful standalone smoke setup.

## Scope and release boundary

The fix does not change Core pagination, source data synchronization, package APIs, or public configuration. Issue #107's accepted-data synchronization remains separate and unchanged. This change has not been assigned a published React version, merged, or released. The existing no-hosted-Actions restriction remains in effect; GitHub integration and publication are outside this local qualification record.
