# Issue #116 — Dropdown entrance and selected-option scrolling

Status: **Published in Core `1.20.0`; native runtime excluded**

Issue: [#116](https://github.com/navidrezadoost/Smilodon/issues/116)

Worktree: `/tmp/smilodon-issue116`
Branch: `fix/116-animated-dropdown-scroll`
Base: local integration/release candidate `95d569e2c6722b7cfd621f9fd8614234d68e10d4`

## Behavior change

Core now keeps active-option state, styling, and ARIA synchronization immediate when a selected option is activated on open, while suppressing the activation-time physical scroll. A per-open coordinator waits for finite animations on the dropdown panel, then schedules one selected-position pass. The default `scrollToSelected.onOpen: 'reveal'` uses the `.options-container` as its scrollport and skips fully visible options. `align` applies the requested `block` alignment even for visible targets, clamped to valid scroll bounds. `preserve` leaves an unchanged ordering alone and restores a stable visible-key anchor when displayed ordering changes between openings. It does not call `scrollIntoView()` on the option (which could move an outer page scroller).

Keyboard activation, wheel/touch/pointer input, actual options-scroll movement, close, disconnect, a newer opening, or disabling `scrollToSelected` invalidates the pending restoration. Guarded virtualization still materializes the selected key before final visibility measurement; if materialization already brought it into view, the coordinator issues no second scroll. Selected-item positioning outside the open transaction also uses the internal scroller and avoids a second scroll through active-state synchronization.

The bounded animation fallback is 10 seconds. When `Element.getAnimations()` is unavailable, Core derives a wait from the panel's computed animation and transition durations. Infinite animations are not awaited; geometric layout driven only by an infinite animation is not certified by this change.

## Qualification record

- Core build passed. Rollup emitted its existing `eval` warning from `src/utils/security.ts`.
- Core unit and data-loading suites passed: 665 + 48 tests; one Core unit skip.
- Framework contract suites passed: 66 passed, 6 skipped.
- Full `npm test`: **779 passed, 7 skipped** after building the React, Vue, Solid, Svelte, and Vanilla workspaces. The first contract attempt before those builds failed to resolve workspace `dist` entries; no contract tests ran in that attempt.
- Lint: zero errors, six existing warnings.
- Focused new Core tests: 4/4 passed for immediate active/ARIA state, one post-animation off-screen scroll with configured behavior, no movement for an already-visible option, keyboard cancellation, and disabled scrolling.
- Browser regression: 1/1 passed on Google Chrome for Testing `156.0.8078.4`. It used a 600 ms dropdown `max-height` entrance, verified no scroll command at 120 ms, then observed one internal `scrollTo` after animation completion and confirmed the selected option became visible.
- Repository-pinned Chromium, Firefox, and WebKit were not run. The configured Playwright binary was missing; the browser test was run using the locally cached Chrome for Testing executable with a temporary local Playwright config, which was removed afterward.
- `git diff --check` passed. No package versions were changed, no React Native build was run, and no generated bundle was modified.

## Remaining coverage limits

The local browser scenario covers an off-screen selected option and finite height animation. Reduced-motion, multi-effect animation, rapid close/reopen, explicit pointer/wheel cancellation, guarded virtualization, top placement, and page-scroll isolation have deterministic source/unit coverage or remain limitations. The follow-on selected-options configuration and adapter work is qualified separately in [SELECTED-OPTIONS-PROJECTION.md](./SELECTED-OPTIONS-PROJECTION.md). The combined web release scope and package versions are in [WEB-1.20.0-RELEASE.md](../releases/WEB-1.20.0-RELEASE.md); no React Native runtime behavior is claimed.

## Related work

Selected-options projection is tracked separately in [SELECTED-OPTIONS-PROJECTION.md](./SELECTED-OPTIONS-PROJECTION.md). That record includes its E1/E2 local qualification and E3 Core configuration work. It does not change the scope or release status of Issue #116.
