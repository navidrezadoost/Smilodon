# Issue #128 — React remove-icon DOM ownership

## Scope

React can render a `ReactNode` through a portal for a selected chip's or
selected dropdown option's `[part="chip-remove-icon"]`. The bug was that Core
updated chips by clearing that target's children, even though React was
reconciling them. A later selection update could erase the visible icon and
leave React's virtual tree inconsistent with the DOM.

## Ownership contract

- Core owns the remove button, outer icon target, fallback icon subtree, event
  behavior, and accessibility labels.
- React owns only the child subtree mounted into Core's dedicated
  `data-smilodon-react-icon-root`.
- Core updates the fallback under `data-smilodon-fallback-icon`; it never
  clears the outer target or React portal root.
- React marks the outer icon target as React-presented while a React-node icon
  portal is active. Core's fallback is hidden during that interval.
- When a portal target is replaced during a Core option refresh, the adapter
  observes the new root and synchronously reconciles the portal so the new
  target does not remain empty for a render. Portal keys are stable per root
  identity, not array position.
- A string/default icon transition unmounts the portal and reveals or updates
  Core's fallback. Selection, remove handlers, and ARIA labels remain Core
  owned.

## Compatibility boundary

React-node `removeButtonIcon` requires Core's isolated-root capability. The
adapter checks Core's internal portal-capability marker and emits a clear error rather
than mounting into an older Core-owned target. Existing older Core versions
remain compatible with Core-owned string/markup icons. This release candidate
assigns the capability to Core `1.22.0` and sets React `1.14.0`'s minimum Core
peer to `^1.22.0`; consumers of the updated React adapter must install the
paired Core version.

## Regression evidence

The browser regression starts with one custom React icon, selects two more
options, removes the first chip, and verifies that the surviving component
identity remains attached to its original target without browser errors. It
also exercises React-node/string/default transitions, selected-option refresh
and removal, StrictMode, and unmount cleanup.

Combined local qualification and release-version decisions are recorded in
[`WEB-1.22.0-RELEASE.md`](../releases/WEB-1.22.0-RELEASE.md). That record keeps
the candidate unpublished until the PR is merged and the final package
artifacts are verified.

## Review follow-up — configuration precedence and Chrome 133 comparison

The adapter reads the global Core icon only after its existing asynchronous Core
module load resolves. This keeps the module-load path unchanged and avoids
replacing a configured global icon with a hard-coded `×`. Instance precedence
is preserved: a string `removeButtonIcon` prop wins over `selectionConfig`,
`selectionConfig.removeButtonIcon` wins over the global fallback, and the
separately applied `config.selection.removeButtonIcon` remains the final Core
configuration layer. Removing a local string or React-node override restores
the selected configuration fallback. An undefined Core configuration entry
cannot perform that reset because Core intentionally ignores undefined values.

### Configuration regression results

On Node 20.20.2/npm 10.8.2, the React integration file passed **22/22**. The new
case exercises a global `configureSelect()` value (`−`), `selectionConfig`, an
explicit `config.selection` value, a string prop, a React-node portal, and
removal of the prop returning to `−`. Core and React builds passed. The packed
React/Solid consumer checks and broader unit/contract results recorded before
this review remain applicable; the new integration case was rerun after the
correction.

### Issue #125 browser differential

Both the exact review base `e39d96345c75391d9633939c378c7b37ff538cab` and the
Issue #128 candidate were built with Node 20.20.2/npm 10.8.2 and tested with
Playwright 1.59.1 and system Google Chrome 133.0.6943.126, using the same
fixture, server setup, and eight `chip-enter-exit-animation.spec.ts` scenarios.
The baseline and candidate each produced **4 passed / 4 failed**, with identical
failure identities and assertion results:

- `runs consumer keyframes through ::part and removes selection before visual exit completes`:
  `getAnimations()` did not contain `issue125ChipEnter` (received `[]`).
- `reselection cancels a pending exit and restores the same single chip`:
  expected one `[part="chip-exiting"]`, received zero.
- `bulk clear gives each chip an independent exit and disconnect cleans pending exits`:
  expected two `[part="chip-exiting"]` nodes, received zero.
- `uses per-instance animation configuration without affecting sibling selects`:
  expected one `[part="chip-exiting"]`, received zero.

The other four scenarios passed on both trees. These are reproducible Chrome
133 baseline findings in the Issue #125 animation suite, not regressions from
Issue #128. Their underlying cause is still unclassified; do not claim Chrome
133 animation qualification. The earlier Chrome 156 run remains separate and
does not substitute for this differential.

### Older-Core guard

The candidate React adapter was run against the exact baseline Core 1.21.0 build
from the review base. The old Core has no isolated-root capability marker. The
adapter emitted its compatibility error once, did not mount the React node,
and left the Core-owned `×` icon usable. Switching to the string prop displayed
`!`; removing it restored `×`. The browser recorded no page exception. This is
local pairing evidence for the guard. The release candidate sets React's peer
minimum to Core `^1.22.0`; that peer-range change remains unpublished until the
candidate is merged and released.

## Remaining limits

Pinned Chromium, Firefox, and WebKit are not covered by this local comparison.
The 4/8 Chrome 133 Issue #125 animation result is explained as baseline versus
candidate parity, but its browser-specific cause remains open. No package version
or peer range was changed in the original Issue #128 implementation commit.
The release candidate now assigns Core `1.22.0` and React `1.14.0` with peer
`@smilodon/core: ^1.22.0`; combined-release qualification is recorded in
[`WEB-1.22.0-RELEASE.md`](../releases/WEB-1.22.0-RELEASE.md).
