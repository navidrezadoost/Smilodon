# Dropdown enter/exit animation — implementation and usage

**Status:** implemented on the `feat/select-dropdown-exit-animation` development branch; local browser and repository-wide qualification pending. Not yet a published API guarantee.

## Problem and contract

Prior to this change, Core applied `--select-dropdown-animation` on opening but immediately set `display: none` when closing. A CSS-only exit could never paint. The closing animation is therefore a presentation-only lifecycle that must **not** keep the popup logically open.

A successful `CLOSE_REQUEST` immediately changes engine state, `data-open`, combobox ARIA, arrow state, and emits exactly one `close` event. The DOM panel can remain displayed for its exit, but has `inert` and `aria-hidden="true"` and `pointer-events: none` so it cannot be interacted with or announced as an open listbox.

Visual states:

- **Closed:** panel `display: none`, engine closed.
- **Open:** engine open, panel displayed and interactive, existing `dropdownEnter` animation runs.
- **Closing:** engine closed, panel displayed and inert, `data-motion="closing"` selects `dropdownExit`; after completion panel is hidden.

Reopening during Closing cancels exit listeners and timers, clears the inert/hidden presentation state, and replays entry. Disconnecting skips exit; this avoids ghost panels and leaked animation timers. The existing sibling-select, keyboard and outside-pointer close paths all use the shared close handler.

## Configurable styles

The defaults mirror the entry timing and support bottom/top placement:

| CSS custom property | Default | Usage |
| --- | --- | --- |
| `--select-dropdown-animation` | `dropdownEnter 200ms cubic-bezier(0.4, 0, 0.2, 1) forwards` | Existing entry animation |
| `--select-dropdown-exit-animation` | `dropdownExit 160ms cubic-bezier(0.4, 0, 1, 1) forwards` | Exit duration/easing, or `none` to disable exit |
| `--select-dropdown-exit-from-opacity` | `1` | Initial exit opacity |
| `--select-dropdown-exit-to-opacity` | `0` | Final exit opacity |
| `--select-dropdown-exit-from-transform` | `translateY(0) scale(1)` | Initial exit transform |
| `--select-dropdown-exit-to-transform` | `translateY(-8px) scale(0.98)` | Final bottom-placement exit transform |
| `--select-dropdown-top-exit-to-transform` | `translateY(8px) scale(0.98)` | Final top-placement exit transform |

```css
enhanced-select {
  --select-dropdown-animation: dropdownEnter 250ms ease-out forwards;
  --select-dropdown-exit-animation: dropdownExit 180ms ease-in forwards;
  --select-dropdown-exit-to-opacity: 0;
  --select-dropdown-exit-to-transform: translateY(-12px) scale(0.97);
  --select-dropdown-top-exit-to-transform: translateY(12px) scale(0.97);
}

/* Disable animation while keeping immediate semantic close. */
enhanced-select.no-motion {
  --select-dropdown-animation: none;
  --select-dropdown-exit-animation: none;
}
```

React consumers can attach a class or custom properties to the `<Select>` host; no adapter-specific API is required. Overrides of the `animation` property **directly inline on the dropdown element** may override the closing selector: prefer the documented CSS variables.

The existing `prefers-reduced-motion: reduce` rule shortens animations. Core also skips waiting for exit when reduced motion is requested. The exit duration is determined from computed CSS, and a bounded timer provides a completion fallback when `animationend` is not delivered.

## Development and review steps

1. **Core styles:** define `dropdownExit`, state selector `[data-motion="closing"]`, placement-aware transforms, and tunable CSS variables without changing existing entry keyframes.
2. **Core lifecycle:** upon close, commit the engine state, ARIA, callbacks and arrow state immediately; keep the visual panel mounted, inert and aria-hidden until the exit finishes. Preserve all legacy close reasons.
3. **Interruption:** cancel timer/listeners and clear `data-motion` when reopening. Ensure disconnect always hides the panel without a delayed task.
4. **Accessibility:** verify `aria-expanded="false"` and no usable `aria-activedescendant` during closing; the panel must be inert and inaccessible. Do not delay the `close` event.
5. **Tests:** Core regression coverage for close, reopen, duplicate-close, descendant animation event, zero-duration, disconnect, and timeout fallback; browser coverage for visual opacity and top/bottom placement.
6. **Qualification:** `npm ci`, `npm run build`, `npm run lint`, `npx vitest run packages/core/tests/dropdown-exit-animation.spec.ts --config packages/core/vitest.config.ts`, existing active/ARIA suites, `npm test`, adapter contracts, and locally available Chrome browser scenarios. Do not invoke hosted CI.
7. **Integration and release:** review Core and adapter behavior in a draft PR; merge normally after local results; publish separately only after package compatibility checks. Update release notes with the package version actually shipped.

### Acceptance checklist

- [ ] Existing entry behavior and CSS controls unchanged
- [ ] Exit lasts for configured duration (or ends immediately for `none` or reduced motion)
- [ ] `close` callback fired once, ARIA closed before exit completes
- [ ] Closing panel inaccessible via pointer, focus and assistive technology
- [ ] Escape, outside click, selection, and programmatic close behave consistently
- [ ] Rapid close→open never hides the newly opened dropdown
- [ ] Disconnect removes all pending exit work
- [ ] Bottom and top placement transforms work
- [ ] Local unit, adapter contracts, full suite, and browser qualification recorded

## Related: React acknowledged items regression (#85)

Issue [#85](https://github.com/navidrezadoost/Smilodon/issues/85) is **separate**. A local fix was reported on branch `fix/85-react-acknowledged-items` (commit `29c67067b3bf345347f74e2dc074095dc9eb2ab9`), but that commit has **not been pushed, merged, or published**. Do not claim this fix is available from npm or from the current main branch.

The fix separates React's item synchronization from configuration changes. In acknowledged mode, an accepted cumulative snapshot (e.g., 12 items) must not be replaced by the initial `items` prop (e.g., 6 items) when `config`, `multiSelectDisplay`, or `disabledOptionBehavior` is recreated. New `items` or `groupedItems` references remain intentional input updates; explicit reset semantics must be defined separately from setting Core's rendered items. The initial uncontrolled `defaultValue` is applied after the initial items are registered.

For application usage, keep input arrays stable where possible and use `completeDataRequest()` with exact request identity. Keep a single mounted Select instance across page completions. These recommendations are **not** a workaround for the adapter bug; the fixed adapter must handle unrelated configuration-only rerenders correctly. Review the React guide on the #85 fix branch after that change is integrated and qualify it independently before release.
