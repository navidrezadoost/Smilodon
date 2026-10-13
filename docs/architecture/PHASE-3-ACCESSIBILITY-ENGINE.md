# Phase 3 — Accessibility Engine

Status: **Phase 3.0–3.4.3 closed; Phase 3.4.4 live-region integration implemented and verified locally.**
This document records the current accessibility surface and staged engine,
web adapter, and component integration contracts.

## 1. Current Accessibility Surface

Audit scope for this first slice: roles and ARIA attributes written or queried
by `EnhancedSelect` and `SelectOption`. Line references point to the current
Phase 3 branch baseline.

| Attribute / Role | Current owner | Current source state | Applied where | Problem / Risk | Target owner |
| --- | --- | --- | --- | --- | --- |
| `role="combobox"` | `EnhancedSelect` | Static component structure; input is a text input, optionally writable for search. | Internal shadow input, `enhanced-select.ts:1533–1609`. | The role is present, but the input has no explicit accessible name wiring in this component. | Engine defines combobox semantics; web adapter applies role to the input target. |
| `role="listbox"` | `EnhancedSelect` | Static popup structure. | Dropdown element, `enhanced-select.ts:1620–1631`. | Popup is hidden with CSS while closed; role remains in the DOM. | Engine defines popup/listbox intent; web adapter applies it to the popup. |
| `role="option"` | `SelectOption` or custom option normalizer | Each rendered item; custom renderer role is preserved if already set. | `SelectOption` host, `select-option.ts:449–454`; custom renderer host, `enhanced-select.ts:5364–5372`. | A custom renderer can supply a non-option role, which the normalizer preserves. | Engine defines item role intent; web adapter applies role; component supplies option target and ID. |
| `role="status"` | `EnhancedSelect` | A persistent polite announcement region; message text is written by `_announce()`. | Hidden live-region node, `enhanced-select.ts:1642–1646`. | Announcement messages and timing are authored by the component rather than emitted as accessibility effects. | Engine emits announcement intent; web adapter owns the live-region DOM and text update. |
| `role="presentation"` | `EnhancedSelect` | Group headers and nested focusable controls in custom option render output. | Group header, `enhanced-select.ts:5021–5023`; custom option descendants, `enhanced-select.ts:772–790`. | The normalizer changes nested roles and tab stops unless a keep-role marker is supplied; custom content may have its semantics flattened. | Engine supplies semantic intent; web adapter applies it. Component/renderer owns the DOM subtree boundary. |
| `aria-expanded` | `EnhancedSelect` | Engine popup state is exposed through `_state.isOpen`; open/close transitions and popup sync update the value. | Combobox input at creation and lifecycle transitions, `enhanced-select.ts:1605–1608`, `3433–3515`. | State is written from several component paths, creating multiple DOM synchronization sites. | Engine owns expanded state; web adapter applies it on the combobox. |
| `aria-haspopup="listbox"` | `EnhancedSelect` | Static popup type. | Combobox input, `enhanced-select.ts:1605–1608`. | Currently fixed to listbox; no issue identified for this component's present popup. | Engine declares popup type; web adapter applies it. |
| `aria-autocomplete` | `EnhancedSelect` | `config.searchable` (`list` when searchable, otherwise `none`). | Combobox input at creation and config update, `enhanced-select.ts:1605–1609`, `4774`. | The value tracks component config directly rather than an accessibility state contract. | Engine derives autocomplete intent from search mode; web adapter applies it. |
| `aria-controls` | `EnhancedSelect` | Stable per-instance listbox ID. | Combobox input points to dropdown ID, `enhanced-select.ts:1712–1715`. | Relationship is authored in DOM assembly; shadow-tree ID reference support should be included in browser/AT validation. | Web adapter resolves and applies the relationship using component-provided IDs. |
| `aria-owns` | `EnhancedSelect` | Same listbox ID as `aria-controls`. | Combobox input, `enhanced-select.ts:1712–1715`. | Redundant with `aria-controls`; ownership semantics across the shadow tree need review. | Web adapter applies only the relationship required by the agreed combobox contract. |
| `aria-activedescendant` | `EnhancedSelect` | Engine `activeKey`, mapped through the registry to a rendered option ID; compatibility `activeIndex` supplies the DOM lookup. | Combobox input in `_syncLegacyActiveAria()` and open/close/render paths, `enhanced-select.ts:1136–1138`, `3433–3495`. | Several paths synchronize the attribute; correctness depends on the mapped option being present in the current rendered subset. | Engine owns active identity; web adapter maps the key to the DOM ID and applies/removes the attribute. |
| `aria-selected` | `EnhancedSelect` and `SelectOption` | Engine `selectedKeys` projected to compatibility selection state, then passed as the rendered option's `selected` value. | Option host during render, `enhanced-select.ts:5150–5190`, `5364–5368`; component updates it during removal at `4118`. | Selection ARIA is written by both option rendering and an imperative removal path. | Engine owns selected state; web adapter applies it to option targets. |
| `aria-disabled` | `SelectOption` and `EnhancedSelect` | Item disabled state plus `disabledBehavior.selectable`. | Option host, `select-option.ts:449–454`; custom option host, `enhanced-select.ts:5364–5372`. | Selectable-disabled options omit `aria-disabled`; combobox disabled state uses native `input.disabled` rather than `aria-disabled`. | Engine decides disabled eligibility; web adapter applies option/combobox disabled semantics. |
| `aria-required` | `EnhancedSelect` | `setRequired(required)` argument and native `required` state. | Combobox input, `enhanced-select.ts:4923–4931`. | Set imperatively through a component method; not part of engine accessibility state today. | Engine owns required state; web adapter applies `aria-required` and the appropriate native state. |
| `aria-invalid` | `EnhancedSelect` | Component error flag set by `setError()` and cleared by `clearError()`. | Combobox input, `enhanced-select.ts:4905–4920`. | Error text is announced, but no `aria-describedby` association is created here. | Engine owns invalid state; web adapter applies it and links any rendered error description. |
| `aria-multiselectable` | `EnhancedSelect` | `config.selection.mode === 'multi'`. | Listbox at creation/config update, `enhanced-select.ts:1627–1631`, `4795–4800`. | Initial setup and later config update are separate write paths. | Engine selection mode determines intent; web adapter applies it to the listbox. |
| `aria-labelledby` | `EnhancedSelect` | Generated input ID. | Listbox references the combobox input, `enhanced-select.ts:1627–1629`. | No explicit input `aria-label` or `aria-labelledby` is written by these components, so the referenced input may not provide a useful listbox name. | Web adapter resolves an accessible name from provided labeling targets; component provides IDs. |
| `aria-describedby` | Not currently assigned by either component | No description state or ID association found. | No assignment in `enhanced-select.ts` or `select-option.ts`. | Required/invalid guidance and descriptions cannot be programmatically associated through this attribute. | Engine exposes description intent/IDs; web adapter applies the relationship. |
| `aria-live="polite"`, `aria-atomic="true"` | `EnhancedSelect` | Static live-region settings; message content comes from component interaction paths. | Status region, `enhanced-select.ts:1642–1646`. | The engine does not currently emit announcement effects; timing and message policy are component-owned. | Engine emits announcement effects; web adapter writes them to the live region. |
| `aria-busy` | `EnhancedSelect` | `_state.isBusy`, updated by asynchronous/loading paths. | Listbox, `enhanced-select.ts:4325–4331`. | Busy state is directly coupled to the current loading implementation. | Engine owns busy intent if included in the accessibility state model; web adapter applies it. |
| `aria-label` | `EnhancedSelect` / `SelectOption` | Configured clear label, selected item's label for badge removal, default option-removal label, or fallback custom-option label. | Clear button `enhanced-select.ts:1679`; badge remove button `4194`; option remove button `select-option.ts:429`; custom renderer fallback `enhanced-select.ts:758–760`. | The option remove button's default name is generic; label fallback for custom options is useful but does not name the combobox itself. | Engine can provide label intent where state-derived; web adapter applies labels; component supplies IDs and localized text. |
| `aria-hidden` | `EnhancedSelect` | Clear-control visibility and custom-option disabled/focusable descendants. | Clear button `enhanced-select.ts:4900`; custom option descendants `785–790`. | Hiding nested interactive descendants may discard content semantics; needs explicit custom-renderer contract review. | Web adapter applies hidden state from engine intent; component owns rendered visibility. |

This table records the current implementation only. The target-owner column is
the Phase 3 design direction, not a claim that these responsibilities have
already moved out of `EnhancedSelect`.

## 2. Current Keyboard Surface

The component installs its `keydown` listener on the internal input
(`enhanced-select.ts:3363`). It does not install that listener on the listbox or
option hosts. Normal keyboard navigation keeps DOM focus on the input and
changes logical active identity.

| Key / input | Current behavior | State touched | ARIA effect | Selection effect | Gap |
| --- | --- | --- | --- | --- | --- |
| ArrowDown | Opens the popup if closed; otherwise advances to the next selectable rendered index. | Engine popup and `activeKey`; projected `activeIndex`; range anchor when extending a multi-selection. | Updates `aria-expanded` on open and `aria-activedescendant` on active change; announces position. | None by itself; Shift+ArrowDown can replace a multi-select range. | Key movement code is component-owned; tests should assert on the input focus owner and resulting ARIA state. |
| ArrowUp | Opens if closed; otherwise moves to the previous selectable rendered index. | Same as ArrowDown. | Same as ArrowDown. | None by itself; Shift+ArrowUp can replace a multi-select range. | Same as ArrowDown. |
| Home | When open, moves active identity to the first selectable item; Shift in multi mode extends a range. | Engine `activeKey`, projected index, optionally range anchor and `selectedKeys`. | Updates active descendant and may announce position. | Only with Shift in multi mode. | No recorded test verifies Home key ARIA or selection outcomes. |
| End | When open, moves active identity to the last selectable item; Shift in multi mode extends a range. | Engine `activeKey`, projected index, optionally range anchor and `selectedKeys`. | Updates active descendant and may announce position. | Only with Shift in multi mode. | No recorded test verifies End key ARIA or selection outcomes. |
| Enter | Opens if closed; otherwise activates the active item. | Engine popup, active identity, and selection; legacy snapshots are projected. | Expanded/active descendant update; option `aria-selected` updates; popup may close for single mode. | Single selection replaces (or toggles if allowed); multi selection toggles. | Existing E2E covers selection, but not the complete focus/ARIA transition contract. |
| Space | Shares Enter handling on the input: opens if closed; otherwise activates the active item. | Same as Enter. | Same as Enter. | Same as Enter. | Space behavior is not separately covered through the input in current component tests; a stale interaction test dispatches keydown on the listbox instead. |
| Escape | Prevents the default action and requests popup close with reason `escape`. | Engine popup state. Search text and selection are not cleared by this handler. | Sets expanded false and removes active descendant on close. | None. | E2E covers close/search behavior but does not assert focus ownership or active-descendant cleanup together. |
| Tab | If open, requests close and allows the browser's default Tab traversal. | Engine popup state. | Expanded becomes false; active descendant is removed by close handling. | None. | No explicit test covers the destination of focus or close behavior from internal controls. |
| Type-ahead characters | Appends lowercase characters to a 500 ms buffer, finds the first loaded item whose label starts with it, then makes that item active. | Type buffer, engine `activeKey`, projected active index. | Active descendant changes; position announcement is emitted. | None. | No multi-character or repeated-character cycling tests; type-ahead overlaps with searchable input typing. |
| Search input typing | For searchable config, the `input` event stores the query, renders filtered options, updates registered keys, announces result count, and emits `search` asynchronously. | Component `searchQuery`/search flags and rendered registration; engine registered keys and active key can reconcile. | Active descendant can clear when the active key is filtered out; live region announces result count. | Existing selected keys are preserved through filtering. | Keydown type-ahead also receives ordinary characters, so its active movement can race/interact with filtering. No dedicated test distinguishes searchable typing from type-ahead. |
| Multi-select remove (Enter/Space on remove button; click handler) | The badge remove button dispatches a deselect request for its key; option-local removal uses the same component removal path. | Engine `selectedKeys`, record cache, projected selection state; focus may remain on a button that is then re-rendered. | Option `aria-selected` updates; remove button has an accessible name, though the `SelectOption` default is generic. | Deselects the key subject to required-selection policy. | No keyboard test verifies focus after removing a badge or option, or behavior when the removed button is recreated. |
| Clear button (Enter/Space activation; click handler) | Clears selection and/or search according to config, emits clear notifications, then calls `input.focus()`. | Engine selection, component query, clear-control state. | Option selection and clear-button hidden/disabled state update; focus is returned to the input. | Clears selected keys when configured. | No keyboard test verifies that focus return and ARIA state remain correct when only search or only selection is cleared. |

## 3. Current Focus Ownership

| Focus concept | Current owner / behavior | Evidence and audit finding |
| --- | --- | --- |
| Host element | The component does not assign the custom-element host a role or `tabindex`, and does not call host `.focus()`. | DOM construction and focus-call inventory in `enhanced-select.ts`. |
| Internal input | Primary DOM focus target. Pointer activation, input-container activation, engine `FOCUS_TRIGGER`, and clear-control completion focus it. Input focus dispatches `FOCUS_GAINED` and opens the popup; blur dispatches `FOCUS_LOST` and schedules close unless focus remains inside or option pointer interaction suppresses it. | `enhanced-select.ts:3201`, `3245`, `3279–3310`, `3421–3425`, `4878–4881`. |
| Popup/listbox | Not programmatically focused and not assigned `tabindex`. | `_createDropdown()` and `_assembleDOM()`. |
| Normal option | Rendered with `tabindex="-1"`; normal Arrow navigation does not move DOM focus to it. The input remains the focus owner while `aria-activedescendant` communicates logical active identity. | `enhanced-select.ts:5364–5375`, `_setActive()`. |
| Renderer option helper | `keyboardFocus(index)` first sets engine active identity, then directly calls `.focus()` on the rendered option. | `_buildRendererHelpers()` in `enhanced-select.ts:3900–3908`. This creates a second focus model and may leave `aria-activedescendant` on the input while focus is on the option. |
| Multi-select badge remove button | Native focusable button inside the input display; pointerdown prevents default, and click removes the item. Re-rendering the display can replace the focused button. | `_updateInputDisplay()` around `enhanced-select.ts:4180–4210`. |
| Option remove button | Native focusable button nested inside a `role="option"` host in `SelectOption`; default accessible name is `Remove option`. | `select-option.ts:420–454`. Nested interactive content inside an option needs a deliberate interaction/focus contract. |
| Clear button | Native focusable button; activation eventually focuses the internal input. | `_createClearControl()` and `_handleClearControlClick()` in `enhanced-select.ts:1670–1682`, `4850–4881`. |

These are distinct concepts in the current implementation:

- **DOM focus:** normally the internal input; exception paths include the
  renderer's `keyboardFocus` helper and native clear/remove buttons.
- **Logical active item:** engine `activeKey`, projected to `activeIndex` for
  option lookup and rendering.
- **`aria-activedescendant`:** an ID written on the internal input from the
  current projected index when the popup is open.
- **Visual active styling:** driven by the projected index and passed into
  `SelectOption` or custom renderer metadata.
- **Scroll-to-active:** `_setActive()` calls `scrollIntoView({ block: 'nearest' })`;
  opening may separately scroll to a selected option.

## 4. Current ARIA Ownership

The DOM owner today is `EnhancedSelect`: it creates the input, listbox, live
region, and clear control; writes their attributes; synchronizes expanded and
active-descendant state; and updates option ARIA during rendering. `SelectOption`
writes `role="option"`, `aria-selected`, and `aria-disabled` on its host. Custom
renderer output is normalized by `EnhancedSelect`. The headless engine owns
selection keys, active key, popup state, disabled state, and selection required
configuration, but it does not produce an ARIA intent object. `DefaultSelectEffectRunner`
only handles focus-trigger, popup callbacks, and a generic ARIA sync callback;
the callback currently returns to the component to mutate the DOM.

## 5. Accessibility State Model

| State / intent | Current source | Current status in engine | Phase 3 direction |
| --- | --- | --- | --- |
| Active item | `engine.activeKey`; `activeIndex` is a compatibility projection. | Present and authoritative. | Preserve key identity; adapter resolves it to rendered option ID. |
| Selected items | `engine.selectedKeys`; legacy item/index collections are projections. | Present and authoritative. | Engine emits selected-state intent; adapter applies option ARIA. |
| Expanded | `engine.state.popup` via `_state.isOpen`. | Present. | Keep popup transition intent in engine; adapter applies `aria-expanded` and visibility/focus effects. |
| Disabled | Engine disabled state and per-key disabled selection policy; config and item registry supply inputs. | Present in part. | Make component/adapter inputs explicit; engine decides availability, adapter applies native/ARIA state. |
| Required | `engine.state.selection.required`, synchronized from input/config. | Present for selection policy. | Engine owns required accessibility/selection intent; adapter applies native `required` and `aria-required`. |
| Invalid | Component `_hasError` / `_errorMessage`. | Absent. | Add an engine accessibility state/event only after contract and ownership are agreed; adapter applies invalid state and description relationship. |
| Multi-select | Component selection config, synchronized to engine `selection.multiple`. | Present as selection policy. | Engine exposes listbox multiplicity intent; adapter applies `aria-multiselectable`. |
| Query/results | Component search query and filtered render; engine has a query field but current filtering is component-owned. | Query field exists; integration is partial. | Decide whether query and result count are engine state or adapter effect inputs; keep filtering algorithm out of accessibility state. |
| Busy/loading | Component `_state.isBusy`; engine also has `dataStatus`. | Two representations are not yet shown as a single synchronized contract. | Define whether accessibility busy state derives from engine data status; adapter applies `aria-busy`. |
| Announcement | Component calls `_announce(message)` directly. | No announcement effect contract. | Engine emits semantic announcement intent; web adapter owns live-region DOM and timing. |
| Label/description | Generated IDs and component config labels for buttons; no input naming/description state. | Absent as an engine model. | Define labeling/description inputs and IDs; adapter applies the corresponding relationships. |

## 6. Engine Responsibilities

The Phase 3 target is for the engine to own accessibility state decisions,
including `activeKey`, `selectedKeys`, expanded/collapsed, disabled, required,
invalid, and multi-select intent. It should compute semantic intent and emit
effects for focus, announcements, and state changes. It should not read or
mutate DOM nodes, generate DOM IDs, call focus APIs, or write ARIA attributes.

The engine contract must make invalid state and announcements explicit before
they are migrated. It must preserve the Phase 2 authority model and avoid
reintroducing index-based identity.

## 7. Web Adapter Responsibilities

The web adapter applies engine intent to DOM targets. It owns ARIA attribute
writes, `aria-activedescendant` synchronization from key-to-rendered-ID lookup,
focus side effects, and live-region updates. It translates engine effects into
browser actions and reports the resulting effects without making selection or
active identity decisions of its own.

The adapter receives element references or target callbacks from the component;
DOM IDs and shadow-root lookup remain platform concerns rather than engine
state.

## 8. Component Rendering Responsibilities

`EnhancedSelect` and option rendering provide the host, internal input, popup,
option elements, generated IDs, and renderer integration points. The component
continues to render content and layout. It should stop independently deciding
accessibility state or directly writing dynamic ARIA once the engine/adapter
contract replaces those paths. Static structural markup can remain in the
component if its semantic intent is declared by the contract.

## 9. Known Gaps

- The internal combobox input has no explicit accessible-name attribute or
  association. The listbox's `aria-labelledby` points at the input ID, which
  does not itself guarantee a useful human-readable name.
- No `aria-describedby` relationship is created for validation or help text;
  `setError()` only sets `aria-invalid` and announces a generic error message.
- Expanded, active-descendant, selected, required, and multiselect attributes
  have several direct component write paths rather than one adapter boundary.
- A renderer-provided option role is preserved even if it conflicts with the
  listbox option contract; custom option descendants may also have roles and
  tab stops flattened.
- Group headings have `role="presentation"` and are not represented as named
  option groups in the accessibility tree.
- The no-results element is a plain `div`; result count is announced separately
  through the generic status region.
- Disabled options are skipped by active navigation, but disabled behavior is
  spread across engine keys, config overrides, classes, and `aria-disabled`.
- The renderer `keyboardFocus` helper moves DOM focus to an option while the
  regular combobox model keeps focus on the input.
- The listbox uses both `aria-controls` and `aria-owns`; their need and behavior
  across the shadow boundary have not been validated with assistive technology.
- Badge and option remove buttons are nested in selection/option structures;
  focus behavior after removal and accessible names need a consistent contract.
- Searchable input typing also enters the type-ahead keydown path.

## 10. Test Gap List

| Existing test | Covers | Missing / follow-up gap |
| --- | --- | --- |
| `interaction.spec.ts` — “sets ARIA attributes correctly” | Listbox role and multiselectable expectation. | Does not verify the combobox role, accessible name, `aria-controls`, or expanded lifecycle; it expects `aria-label` on the listbox while current code writes `aria-labelledby`. |
| `interaction.spec.ts` — “sets aria-selected on options”; `styling-contract.spec.ts` custom renderer assertions | Selected state on rendered options. | No focused assertion that multi-select selection keeps every option's `aria-selected` aligned with engine keys through deselection/reorder. |
| `enhanced-select-active-authority.spec.ts`, `enhanced-select-active-parity.spec.ts` | Active key, option ID mapping, filter clear/preserve, replacement, empty registration. | Does not cover every close/reopen path, Home/End, or focus-owner mismatch through renderer `keyboardFocus`. |
| `stable-identity-shadow.spec.ts` | Cross-browser active descendant through reorder/navigation/filter; selected key retention. | One scenario only; broader failure/fallback and popup lifecycle states are not covered. |
| `enhanced-select-active-authority.spec.ts` | Direct disabled activation prevention. | Add explicit Arrow navigation across disabled options with ARIA and visual active assertions. |
| `select-selection.spec.ts`, `enhanced-select-selection-parity.spec.ts`, `enhanced-select-active-parity.spec.ts` | Required selection policy and required-config synchronization. | No component assertion for `aria-required`; no `setError()` / `clearError()` assertion for `aria-invalid` or error description linkage. |
| `styling-contract.spec.ts` — group header and no-results cases | Group/header and empty-state rendering hooks. | No role/group naming or screen-reader announcement assertions for grouped options and no-results state. |
| `basic-selection.spec.ts`, `search.spec.ts` | Escape closes popup; search Escape behavior. | No assertion for expanded false, active-descendant cleanup, focus return, or whether Escape clears search versus closes only. |
| `interaction.spec.ts` — arrow click focus; `multi-select.spec.ts` | Input focus after trigger and multi-select interaction. | No keyboard test for Tab traversal, badge removal focus, option remove focus, or clear-button keyboard focus return. |
| No direct naming/description contract test found. | Clear and remove controls have labels in implementation. | No accessible-name or `aria-describedby` wiring test for combobox, listbox, error text, or help text. |

The interaction tests currently dispatch some keyboard events on the listbox,
while the implementation's keyboard listener is attached to the internal
input. The ARIA baseline should treat those assertions as incomplete until the
fixtures target the actual focus owner.

## 11. Phase 3 Migration Plan

1. **3.0 — Baseline and contract audit:** record current role/ARIA, keyboard,
   focus, ownership, and test gaps. No runtime behavior changes.
2. **3.1 — Accessibility state contract:** define state and effect types for
   expanded, disabled, required, invalid, active/selected identity, labeling,
   announcements, and focus intent. Add pure contract tests without DOM.
3. **3.2 — Engine decisions:** move accessibility decisions into the engine
   while preserving `selectedKeys` and `activeKey` authority. Keep DOM and
   browser APIs out of engine modules.
4. **3.3 — Web adapter effects:** apply ARIA attributes, active-descendant IDs,
   focus actions, and live-region announcements through adapter effects.
5. **3.4 — Component integration:** make `EnhancedSelect` and `SelectOption`
   provide rendering targets and IDs while removing duplicated state decisions
   only after parity tests cover them.
6. **3.5 — Final accessibility regression gate:** test keyboard/focus/ARIA
   behavior in unit, contract, and browser suites before considering later
   phases.

## 12. Acceptance Criteria

- Current roles, ARIA attributes, keyboard paths, focus targets, and test gaps
  are documented.
- Engine contracts contain semantic accessibility state and effects only; no
  DOM or browser-global dependencies are introduced into engine modules.
- The web adapter owns ARIA writes, active-descendant DOM mapping, focus side
  effects, and live-region updates.
- The component provides rendering targets and IDs without independently
  deciding dynamic accessibility state.
- Existing public and adapter APIs remain compatible unless a later phase is
  explicitly approved to change them.
- Unit, lint, build, contract, and applicable browser gates pass for each
  implementation stage.

Phase 3.0 itself is complete when the baseline sections above are reviewed and
the documentation-only regression gates pass. No behavior or API change is
part of this audit.

## 13. Phase 3.1 Accessibility State Contract

`packages/core/src/engine/accessibility.ts` defines the pure accessibility
state, intent, and effect contracts. The selectors accept semantic state and
caller-provided IDs/option keys; they do not read or mutate DOM, generate IDs,
or execute focus and announcement effects. This module is not added to the
package root exports, so the stage does not change the public package API.

`AccessibilityComboboxState` includes expanded, disabled, readonly, searchable,
multiple, required, invalid, and busy state; the authoritative Phase 2
`activeKey` and `selectedKeys`; disabled keys; popup role; labels/descriptions;
and validation details. The top-level `required` and `invalid` values are the
combobox intent inputs and should match the corresponding validation flags.
Option state is computed by key. A disabled combobox disables its option
intents, and a disabled option cannot be marked active.

The selectors are `computeComboboxAccessibility`,
`computeListboxAccessibility`, `computeOptionAccessibility`, and
`computeAccessibilityEffects`. The effect union describes combobox/listbox/
option synchronization, semantic announcements, and focus targets. The
`controlsId`, label IDs, description IDs, and rendered option keys are inputs
from the caller. `activeKey` stays a key in the contract; mapping it to a
rendered option ID remains a web adapter responsibility.

Announcements and focus effects are represented as data supplied to
`computeAccessibilityEffects`. That function returns effects and performs no
announcement or focus action. `accessibility-contract.spec.ts` checks these
rules and verifies that the engine contract source has no `document`, `window`,
or `HTMLElement` dependency.

## 14. Phase 3.2 Engine Accessibility Decisions

`deriveAccessibilityState(state, context?)` projects the current headless
`SelectState` into the Phase 3.1 accessibility model. It derives expanded from
popup state; multiple and required from selection configuration; active and
selected identity from `activeKey` and `selectedKeys`; disabled option identity
from the configured disabled-key set; and busy from `dataStatus === 'loading'`.
No index or DOM ID is generated.

The current engine does not own searchable, readonly, invalid, or labeling
configuration. `AccessibilityStateContext` supplies those values when a caller
needs to derive a complete snapshot. Defaults are non-searchable, writable,
valid, and unnamed. Required and invalid values in validation details mirror
the corresponding top-level intent values.

`transition()` retains its existing effect arrays and emits its existing
semantic popup, active-key, and selection-key effects. Callers derive the
accessibility snapshot from the resulting engine state with
`deriveAccessibilityState()` and can pass it to `computeAccessibilityEffects()`
for semantic ARIA, announcement, and focus intents. This composes accessibility
decisions with transitions without changing existing effect contracts. No web
effect runner or component consumes these intents in this stage. The effects
contain keys and semantic targets, not DOM references. Transition-specific
message and focus policy is not introduced here.

`select-accessibility.spec.ts` covers popup open/close, active and selected key
changes, disabled registration, required and multiple configuration, loading
to busy projection, key-only effects, and data-only focus/announcement intent.

### Phase 3.2 Verification (2026-10-13)

| Check | Result |
| --- | --- |
| Focused accessibility contract and engine decision suites | 27 passed. |
| `npm run test:unit` | 334 passed, one skipped. |
| `npm run lint` | Passed with zero errors and six existing warnings. |
| `npm run build` | Passed across workspaces. |
| `npm run test:contracts` | Six passed, 44 skipped. |
| `git diff --check` | Passed. |

No component, option component, web platform, framework adapter, or generated
bundle changed. Existing transition effect arrays remain compatible; the
accessibility snapshot and semantic effects are derived from the resulting
engine state without a DOM consumer.

### Phase 3.0 and 3.0a Verification (2026-10-13)

| Check | Result |
| --- | --- |
| `npm run test:unit` | 307 passed, one skipped. |
| `npm run lint` | Passed with zero errors and six existing warnings after excluding `docs-site/lib/**` and resolving the five adapter/contract lint findings. |
| `npm run build` | Passed across workspaces. |
| `npm run test:contracts` | Six passed, 44 skipped. |
| `git diff --check` | Passed. |
| E2E | Not run; this slice contains audit documentation and lint/test-helper cleanup only. |

The initial clean-branch lint run found 11 errors in the generated
`docs-site/lib/smilodon.min.js`, three adapter-source lint findings, and two
contract-test findings. The exact generated path is excluded in `.eslintrc.json`.
Adapter cleanup removes an unnecessary string escape, a redundant boolean cast,
and an obsolete suppression comment. Contract assertions now safely inspect an
optional tracking snapshot. No generated React Native bundle was changed by the
build.

No accessibility behavior, adapter API, or runtime behavior changed.

### Phase 3.1 Contract Verification (2026-10-13)

| Check | Result |
| --- | --- |
| Focused `accessibility-contract.spec.ts` | 15 passed. |
| `npm run test:unit` | 322 passed, one skipped. |
| `npm run lint` | Passed with zero errors and six existing warnings. |
| `npm run build` | Passed across workspaces. |
| `npm run test:contracts` | Six passed, 44 skipped. |
| `git diff --check` | Passed. |

The contract module and its pure tests are the only engine/test additions. The
component, option component, web platform, framework adapters, and generated
React Native bundle are unchanged. Phase 3.1 defines intent only; no runtime
consumer or DOM effect runner was added.

## 15. Phase 3.3 Web Adapter Accessibility Effects

`packages/core/src/platform/web/accessibility-effects.ts` applies semantic
`AccessibilityEffect` values to caller-provided DOM targets. It handles
combobox, listbox, and option ARIA attributes; resolves `activeKey` through
`getOptionByKey` and uses the rendered option ID for
`aria-activedescendant`; writes announcement intent to a supplied live region;
and treats missing targets as no-ops. Missing active options or options without
IDs clear any stale active-descendant attribute.

Focus intents are inert by default. A caller must pass `{ applyFocus: true }`
to call the resolved target's `focus()` method. The applier and its target types
remain inside `platform/web`; they are not re-exported from the web barrel or
package root, so this stage adds no public package API. `EnhancedSelect`,
`SelectOption`, framework adapters, and generated bundles are not connected to
the new applier.

`web-accessibility-effects.spec.ts` covers combobox role/expanded and
autocomplete state, controls ID cleanup, active-key-to-option-ID mapping,
missing active option behavior, listbox and option semantics, live-region
updates, opt-in focus, safe missing targets, and the engine/web DOM boundary.

### Phase 3.3 Verification (2026-10-13)

| Check | Result |
| --- | --- |
| Focused accessibility contract, engine decision, and web applier suites | 39 passed. |
| `npm run test:unit` | 346 passed, one skipped. |
| `npm run lint` | Passed with zero errors and six existing warnings. |
| `npm run build` | Passed across workspaces; existing Rollup `eval` and React directive warnings remain. |
| `npm run test:contracts` | Six passed, 44 skipped. |
| `git diff --check` | Passed. |
| E2E | Not run; no component/runtime path was connected. |

The first build attempt caught two generic type mismatches in private applier
helpers. Their signatures were corrected without changing runtime semantics;
the final build passed. The applier is not exported through
`platform/web/index.ts` because that barrel is re-exported from the package
root and the Phase 3.3 boundary does not authorize a public API change.

## 16. Phase 3.4.1 Combobox ARIA Integration

`EnhancedSelect._syncComboboxAccessibility()` derives the accessibility state
from the current engine state, computes semantic effects, and applies only the
combobox effect to the internal input through the web applier. The caller
provides the stable listbox ID and resolves `activeKey` to the currently
rendered option; a closed popup or missing rendered option clears
`aria-activedescendant`. Popup open/close engine ARIA syncs, configuration
updates, required changes, validation changes, and active-key projection now
reach the combobox through this boundary. Initial static role/default
attributes remain in DOM construction and are synchronized once assembly is
complete.

This slice integrates only the combobox target. Listbox and option effects,
announcements, and focus intents are not applied by the component. The existing
native `required` property remains for form validation. `SelectOption`,
framework adapters, public exports, and generated bundles are unchanged.
Keyboard, focus, and selection behavior are unchanged; the public item and
value APIs remain covered by the integration suite.

`enhanced-select-accessibility-integration.spec.ts` covers the combobox role,
open/close expanded state, searchable and non-searchable autocomplete values,
required and invalid state, stable controls/listbox linkage, absent label and
description attributes, and public item/value API behavior.

### Phase 3.4.1 Verification (2026-10-13)

| Check | Result |
| --- | --- |
| Focused accessibility contract, engine, web applier, and component integration suites | 49 passed. |
| `npm run test:unit` | 356 passed, one skipped. |
| `npm run lint` | Passed with zero errors and six existing warnings. |
| `npm run build` | Passed across workspaces; existing Rollup `eval` and React directive warnings remain. |
| `npm run test:contracts` | Six passed, 44 skipped. |
| `git diff --check` | Passed. |
| E2E | Not run; this slice changes only ARIA synchronization and adds component unit coverage. |

The build regenerated the embedded React Native Core bundle as a side effect;
that generated file was restored and is not part of this slice. No keyboard,
focus, selection, adapter API, or public API behavior changed.

## 17. Phase 3.4.2 Listbox ARIA Integration

`EnhancedSelect._syncListboxAccessibility()` derives listbox intent from the
engine selection configuration and supplies the existing input ID as the
listbox label relationship. It applies only `SYNC_LISTBOX_ARIA` to the dropdown
through the web applier. Configuration updates synchronize role,
`aria-multiselectable`, and label state. The component's existing busy lifecycle
is not currently mirrored into engine `dataStatus`, so the integration overlays
the current `_state.isBusy` snapshot onto the derived accessibility state;
`_setBusy()` then synchronizes `aria-busy` through the same listbox effect path.

The applier now removes `aria-multiselectable` in single mode and `aria-busy`
when not busy, preserving the component's existing DOM semantics. Its adapter
regression test covers those false-state removals. Option ARIA, live-region
announcements, focus intents, keyboard behavior, popup behavior, framework
adapters, and public APIs are unchanged.

The integration tests cover the listbox role, multi/single mode, busy/non-busy
state, non-empty label relationship, and the existing selection/value behavior.
All Phase 3.4.1 combobox integration tests continue to run in the same suite.

### Phase 3.4.2 Verification (2026-10-13)

| Check | Result |
| --- | --- |
| Focused accessibility contract, engine, web applier, and component integration suites | 56 passed. |
| `npm run test:unit` | 363 passed, one skipped. |
| `npm run lint` | Passed with zero errors and six existing warnings. |
| `npm run build` | Passed across workspaces; existing Rollup `eval` and React directive warnings remain. |
| `npm run test:contracts` | Six passed, 44 skipped. |
| `git diff --check` | Passed. |
| E2E | Not run; this slice changes listbox ARIA synchronization and adds unit coverage. |

The build regenerated the embedded React Native Core bundle as a side effect;
that generated file was restored and is not part of this slice. No public API,
keyboard, focus, selection, or popup behavior changed.

## 18. Phase 3.4.3 Option ARIA Integration

`EnhancedSelect._syncRenderedOptionAccessibility()` derives option intent from
the current engine state after rendered option hosts have been appended. It
maps each rendered compatibility index through the registry to its stable key,
computes option effects from the accessibility state, and applies only
`SYNC_OPTION_ARIA` through the web applier. This covers built-in `SelectOption`
hosts and custom renderer hosts. A filtered or otherwise unrendered key has no
target and is not mutated. The option's active and selected meaning still comes
from engine `activeKey` and `selectedKeys`; this integration does not move DOM
focus or change visual active styling.

The custom renderer normalizer no longer writes option role, selected, or
disabled ARIA directly. The applier owns those writes after render. Enabled
options have stale `aria-disabled` removed, matching the existing DOM
convention. `SelectOption`'s initialization writes remain, with the rendered
engine projection applied afterward. The component's option-removal path also
relies on the render synchronization instead of directly resetting
`aria-selected`. No framework adapter, public export, keyboard behavior, focus
behavior, selection policy, or public item/value API changed.

`enhanced-select-accessibility-integration.spec.ts` covers built-in option role,
selected and disabled state, multi-selection alignment, key-safe reorder,
filtered selection, and custom renderer option semantics. The web applier suite
also verifies removal of stale `aria-disabled` for enabled options.

### Phase 3.4.3 Verification (2026-10-13)

| Check | Result |
| --- | --- |
| Focused accessibility contract, engine, web applier, and component integration suites | 64 passed. |
| `npm run test:unit` | 371 passed, one skipped. |
| `npm run lint` | Passed with zero errors and six existing warnings. |
| `npm run build` | Passed across workspaces; existing Rollup `eval` and React directive warnings remain. |
| `npm run test:contracts` | Six passed, 44 skipped. |
| `git diff --check` | Passed. |
| E2E | Not run; this slice changes option ARIA synchronization and adds unit coverage. |

The build regenerated the embedded React Native Core bundle as a side effect;
that generated file was restored and is not part of this slice.

## 19. Phase 3.4.4 Live-region Announcement Integration

`EnhancedSelect._announce()` now turns its existing message and polite
politeness into a semantic `ANNOUNCE` effect and passes it to the web applier.
The applier writes `aria-live`, `aria-atomic`, and message `textContent` to the
provided live-region target. The component still creates the region with
`role="status"`; the applier does not change that role. The existing
one-second clearing update also passes through an empty-message `ANNOUNCE`
effect. Missing live-region targets remain safe no-ops in the applier.

All announcement call sites retain their existing message text and timing,
including open/close, search results, type-ahead position, selection limits,
selection changes, and validation errors. Clear still does not add an
announcement. Focus intents are not connected, and keyboard, search, popup,
selection policy, framework adapters, and public APIs are unchanged.

The integration suite checks the status role, message text, polite live
setting, atomic setting, no-results search announcement, and selection/clear
compatibility. The web applier suite checks that announcements with no live
region do nothing safely. Existing combobox, listbox, and option integration
assertions continue to run in the same suites.

### Phase 3.4.4 Verification (2026-10-13)

| Check | Result |
| --- | --- |
| Focused accessibility contract, engine, web applier, and component integration suites | 69 passed. |
| `npm run test:unit` | 376 passed, one skipped. |
| `npm run lint` | Passed with zero errors and six existing warnings. |
| `npm run build` | Passed across workspaces; existing Rollup `eval` and React directive warnings remain. |
| `npm run test:contracts` | Six passed, 44 skipped. |
| `git diff --check` | Passed. |
| E2E | Not run; announcement behavior is covered by unit integration tests. |

The build regenerated the embedded React Native Core bundle as a side effect;
that generated file was restored and is not part of this slice.
