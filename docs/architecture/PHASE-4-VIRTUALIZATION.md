# Phase 4 — True Virtualization

Status: **Phase 4.0–4.3.6 closed locally; Phase 4.4 Component Integration Planning is next. No component integration has started.**

This audit describes the current rendering and identity behavior before a
virtualization migration. “Virtualization” currently refers to two different
mechanisms: chunked rendering in `EnhancedSelect` and a windowed `Virtualizer`
used by `NativeSelectElement`.

## 1. Current Rendering Pipeline

### `EnhancedSelect`

1. `_state.loadedItems` is adapted into an `ItemRegistry` containing a record
   for each loaded input item. The registry maps stable keys to records and
   indexes (`packages/core/src/components/enhanced-select.ts:953–978`,
   `packages/core/src/engine/item-registry.ts:46–113`).
2. `_renderOptions()` clears the options container, filters the loaded array
   from the current query, then calls `_registerShadowItems()` with every
   filtered index (`enhanced-select.ts:5016–5114`).
3. With the default `virtualize: true`, a flat filtered list of more than 300
   items is rendered in chunks of 80 across animation frames. The path still
   renders the complete filtered list; it does not maintain a viewport window
   or remove off-screen options after rendering (`enhanced-select.ts:5127–5185`).
4. Grouped lists and lists at or below the threshold render synchronously.
   `virtualize: false` also renders synchronously.
5. Built-in `SelectOption` instances and custom renderer elements are both
   created for each rendered item. Group headers are separate presentation
   nodes. Search and “searching” states trigger a fresh render cycle; stale
   chunks stop when their render cycle ID no longer matches.

Thus the current `EnhancedSelect` path reduces the size of an individual render
task, but its final DOM node count remains proportional to the number of
matching options.

### `NativeSelectElement`

`NativeSelectElement` creates a `Virtualizer` whenever its `items` setter is
called, using a fixed estimated item height of 48 px and buffer of five. For
ordinary lightweight options, `render()` computes a window and asks the
virtualizer to render only those indexes (`packages/core/src/components/native-select.ts:160–172,
275–336`). If any item has an `optionComponent`, it takes a separate custom
renderer branch that renders all items and bypasses the virtualizer
(`native-select.ts:292–323`).

## 2. Current Virtualizer Responsibilities

`packages/core/src/utils/virtualizer.ts` currently:

- Computes start/end indexes from `scrollTop`, viewport height, average item
  height, and a symmetric item-count buffer (`:66–77`).
- Acquires/reuses nodes from a `DOMPool`, maps active nodes by numeric index,
  updates the visible fragment, and translates the container to the estimated
  cumulative offset (`:95–159`).
- Measures rendered node heights asynchronously and updates a sparse height
  map, running average, and (for lists larger than 5,000) a Fenwick tree
  (`:161–182`).
- Shrinks stale measurements and active indexes when item count decreases, and
  cancels its pending RAF / ignores queued measurement microtasks on destroy
  (`:191–220`, `:222–236`).

There is no `scrollToIndex` or `scrollToKey` API. The Fenwick tree supports
prefix sums, but `Virtualizer.computeWindow()` maps `scrollTop` to an index by
dividing by the average height; it does not use the tree’s `lowerBound()` to
locate an item in a variable-height list. The virtualizer itself also does not
subscribe to scroll events or schedule a new window when scrolling occurs.
The `EnhancedSelect` `estimatedItemHeight` configuration has no consumer in
its current chunked-render path; `NativeSelectElement` uses a hard-coded 48 px
estimate instead of that config value.

## 3. Option Registry Interaction

The `EnhancedSelect` `ItemRegistry` represents all currently loaded input
items, independent of whether an item currently has an option element in the
DOM. It is rebuilt from `_state.loadedItems`, not from rendered nodes.

The engine’s `registeredKeys` has a narrower current meaning. Initial registry
reconciliation registers all loaded records, but `_renderOptions()` later
dispatches `ITEMS_REGISTERED` with the filtered indexes. During a chunked render
this is the entire filtered result set, even though only the first chunks have
DOM nodes so far. Therefore:

- The full component item registry knows filtered-out and not-yet-rendered
  loaded items.
- Engine `registeredKeys` generally represents the current filtered set, not
  the viewport and not the exact set of mounted option nodes.
- A filter can remove the current active key from `registeredKeys`; the engine
  then resolves that `activeKey` to `null`.
- A key in `registeredKeys` can still have no DOM node during an incomplete
  chunked render.

`NativeSelectElement` does not use `ItemRegistry`, `SelectEngine`, or stable
`activeKey` / `selectedKeys`; it tracks active and selected state by numeric
indexes.

## 4. ActiveKey and SelectedKeys Under Virtualization

In `EnhancedSelect`, `activeKey` is engine-owned and projected to the legacy
`activeIndex` through the complete loaded-item registry. `_setActive(index)`
currently requires the option element to exist before it dispatches an active
key change (`enhanced-select.ts:3919–3925`). Keyboard navigation derives its
candidate indexes from currently rendered selectable elements. The component
does not yet support making an arbitrary unmounted item active and then
requesting its render.

`selectedKeys` is independent of the option DOM. Selection is projected to
legacy indices/items through the loaded-item registry, and a hidden option
continues to have its selected key while it remains in the loaded item set
(`enhanced-select.ts:1001–1029`). Filtering does not itself remove selected
keys: `ITEMS_REGISTERED` updates the registered set and normalizes selection
policy, but the selection policy does not intersect the selection with the
registered-key set. Disabled items and selection configuration can still
normalize keys.

In `NativeSelectElement`, `_selectedSet` and `_selectedItems` retain selection
while their option nodes are outside the current virtualizer window. The
identity is the array index, however, so replacing or reordering items can
associate retained indexes with different records. This component has no
Phase 2 stable-key authority model.

## 5. Scroll-to-Active Behavior

`EnhancedSelect._setActive()` calls `scrollIntoView({ block: 'nearest',
behavior: 'smooth' })` directly on the option node after activating it
(`enhanced-select.ts:3919–3965`). Because the option must already be mounted,
this is a DOM-node scroll operation, not a virtualizer request.

On popup open, `_handleOpen()` renders options, chooses the initial active
option, then schedules scroll-to-selected work on two animation frames
(`enhanced-select.ts:3520–3558`). `_scrollToSelected()` chooses the configured
first/last selected index, or for multi-select the selected option closest to
the viewport center; if its DOM node exists, it calls `scrollIntoView()` and
sets it active (`enhanced-select.ts:4312–4365`). The chunk renderer may
fast-forward its first chunk to include a configured selected target plus 20
items, but does not provide random-access windowing.

`NativeSelectElement._setActive()` calls `render()` and then
`_scrollToActive()`. The latter searches for `option-${activeIndex}` in the
shadow root and calls `scrollIntoView()`. If that active index was outside the
window just rendered, the node is absent, so this method cannot scroll to it.
There is no virtualizer scroll-to-index/key API to materialize it first.

## 6. ARIA ActiveDescendant With Unmounted Options

In `EnhancedSelect`, the web accessibility applier maps the engine `activeKey`
through the item registry to an option element, and writes that element’s ID.
When the popup is closed, the key has no rendered option, or the element has no
ID, it removes `aria-activedescendant` (`packages/core/src/components/enhanced-select.ts:3410–3430`,
`packages/core/src/platform/web/accessibility-effects.ts:50–60`). Rendered
option ARIA is synchronized by scanning `[data-index]` targets
(`enhanced-select.ts:3471–3490`). Consequently, during chunked rendering an
active key can exist before its node is mounted; the relationship is temporarily
absent and is restored when a later chunk renders that option.

The current filter path clears active identity when filtering excludes its key.
For future true viewport virtualization, the architectural preference is to
preserve a valid engine `activeKey` even when its DOM node is temporarily
unmounted. The adapter should expose `aria-activedescendant` only while the
active option is rendered and has an ID. The virtualizer/component must then
coordinate scrolling and rendering so that a requested active option becomes
available; this audit does not choose the final transition timing.

`NativeSelectElement.render()` writes `aria-activedescendant="option-N"` before
it computes and renders the current virtualizer window (`native-select.ts:275–
337`). It does not check whether that option exists in the rendered window.
When the active index is outside the current window, the attribute can point to
a missing node. This is a current integration gap, not an expected behavior to
preserve in a true virtualized implementation.

## 7. Custom Renderer / DOM Pool Interaction

`EnhancedSelect` creates either a built-in `SelectOption` or a fresh element
from its option renderer for each rendered item. Its >300-item chunk path also
applies to flat custom-rendered lists; grouping bypasses that path. There is no
windowed DOM pool in this component’s current option rendering path.

`NativeSelectElement` uses its `Virtualizer` / `DOMPool` path only for ordinary
options. If any item declares an `optionComponent`, it renders all items
through `OptionRenderer`, which owns a separate `CustomOptionPool` capped at
100 entries (`native-select.ts:112–157, 292–323`). The custom-component path is
not windowed. The rendered wrapper/component lifecycle therefore needs separate
parity coverage from the lightweight pooled-node path in a future integration.

## 8. Memory and Lifecycle Risks

- `EnhancedSelect` retains the complete loaded item array, registry records and
  maps, selected-key records, and (after chunk rendering finishes) one option
  host per matching item. Chunking limits per-frame work but does not bound
  final DOM or registry memory.
- `NativeSelectElement` also retains its full `_items` array and index-based
  selection structures, even when only a small option window is mounted.
- For more than 5,000 items, `Virtualizer` allocates a Fenwick tree backed by a
  `Float64Array` of `itemsLength + 1` entries (about 8 MB for one million
  entries, excluding object/runtime overhead). Its constructor initializes the
  estimate with one tree update per item. `measuredHeights` grows with every
  measured index and is not bounded by the pool size.
- `measureOnAppear()` recomputes an average by materializing and reducing all
  measured heights after an accepted measurement. Large numbers of measured
  rows can make aggregate measurement work grow quadratically.
- `DOMPool` retains reusable nodes up to its dynamic cap; the virtualizer also
  keeps active index-to-node references until `releaseExcess()` runs in RAF.
  Render calls queue a microtask per rendered row. The destroy path guards those
  callbacks and cancels the recycle RAF; lifecycle tests cover that case.
- A resize/reorder that preserves numeric indexes can invalidate measured
  heights and active-node identity unless the caller updates/reset state
  consistently. Current item length updates prune only indexes beyond the new
  length; same-length reorder semantics are not key-aware.

## 9. Performance Baseline and Constraints

**No measured end-to-end baseline exists for `EnhancedSelect` at 1k, 10k, or
100k options. No browser DOM-node count or retained-memory measurement is
recorded for either component.** Existing tests contain synthetic workload
sizes and timing assertions, not stored benchmark results:

| Dataset / test | Existing evidence | Limitation |
| --- | --- | --- |
| 1k options | `virtualizer.spec.ts` computes a window for 1,000 rows; `stress.spec.ts` has no 1k component benchmark. | No measured `EnhancedSelect` render time, scroll/update timing, or DOM count. |
| 10k options | `virtualizer.spec.ts` exercises the Fenwick-enabled 10,000-row constructor and offset; stress tests also use 10,000-item worker transforms/search. | No integrated component performance or memory result. |
| 100k options | `stress.spec.ts` renders/measures one viewport window from a 100,000-item array with simulated variable heights. | Not a browser benchmark; full list data and random-height array are already allocated. |
| 500k options | A stress case creates a 500,000-item array, renders a virtualizer window, and runs worker search. | Does not exercise `EnhancedSelect`, scroll-window updates, or real browser layout. |
| 1M options | A stress case creates one million strings and asserts test-harness timing budgets for `computeWindow` (<10 ms), `cumulativeOffset` (<5 ms), and initial `render` (<50 ms). It renders a viewport-sized set of nodes. | These are assertions in the current test environment, not captured results or production-browser measurements. Initialization cost and total memory are not benchmarked. |

For a `NativeSelectElement` window, mounted option count is intended to scale
with viewport height / estimated height plus the item-count buffer and pool
headroom, rather than total item count. Actual observed node counts are not
recorded. `EnhancedSelect` currently has no corresponding bounded-DOM guarantee.

## 10. Current Test Coverage

- `packages/core/tests/virtualizer.spec.ts`: average-height window calculation,
  cumulative offset, Fenwick threshold at 10k, dynamic item length, and pool
  stats shape.
- `packages/core/tests/stress.spec.ts`: synthetic 1M, 100k, and 500k virtualizer
  workloads; variable-height measurement simulation; worker search/transform
  sizes; and broad timing thresholds.
- `packages/core/tests/memory-lifecycle.spec.ts`: pool capacity shrinkage,
  custom-option mount rollback/cleanup, and virtualizer callbacks ignored after
  destroy.
- `packages/core/tests/item-registry.spec.ts`: stable key/index/record mapping,
  reorder and duplicate-key behavior independent of virtualization.
- `packages/core/tests/enhanced-select-active-authority.spec.ts` and
  `enhanced-select-active-parity.spec.ts`: engine active identity, filter
  clearing/preservation, rendered option ID mapping, and scroll-to-selected
  parity.
- `packages/core/tests/enhanced-select-selection-parity.spec.ts` and
  `enhanced-select-accessibility-integration.spec.ts`: selection authority and
  rendered option selected ARIA behavior.
- `packages/core/tests/shadow-dom.spec.ts`, `interaction.spec.ts`, and
  `smoke.spec.ts`: basic `NativeSelectElement` behavior and shadow-DOM setup.
  No test currently exercises its virtualizer’s scrolling, active descendant,
  or retained selection across window changes.

## 11. Known Gaps

1. The public `EnhancedSelect` `virtualize` flag enables chunking, not true
   viewport virtualization; every filtered option is eventually mounted.
2. `NativeSelectElement` is the only current caller of `Virtualizer`, but it has
   no scroll listener that recomputes the window, and no scroll-to-index/key
   API. The current element-to-virtualizer integration needs browser validation.
3. The full item registry, filtered engine registration, mounted DOM targets,
   and native index state have distinct scopes that are not yet represented by
   one explicit virtualization contract.
4. `NativeSelectElement` may expose an active-descendant ID for an option that
   is not mounted; its index-based active state does not use stable engine keys.
5. `EnhancedSelect._setActive()` requires an existing option element; it cannot
   request activation of an unmounted item and have a virtualizer materialize
   it first.
6. There are no integrated tests for selected-key persistence and ARIA state
   through viewport unmount/remount, high-index keyboard activation, or
   filtering combined with virtualization.
7. Variable-height window lookup still uses an average-height division rather
   than Fenwick lower-bound lookup. Dynamic measurement/reposition behavior is
   not covered by browser scroll tests.
8. Grouped options and `NativeSelectElement` custom option components bypass
   their respective current chunked/windowed paths.
9. No baseline exists for actual browser node count, render latency, scrolling,
   retained memory, or custom renderer churn at 1k/10k/100k options.
10. The configured `estimatedItemHeight` is not wired into the current
    `EnhancedSelect` path or the `NativeSelectElement` virtualizer setup.

## 12. Phase 4 Migration Plan

1. **4.0 — Baseline audit:** record rendering paths, current identity/ARIA
   behavior, costs, risks, and test gaps. Documentation only.
2. **4.1 — Virtualization contract:** agree on data/filtered/registered/rendered
   key scopes, stable item identity, item measurement, window state, and
   active/selected behavior. Keep implementation unchanged until the contract
   and tests are reviewed.
3. **4.2 — Pure window and identity decisions:** define and test window
   calculation, key-to-index lookup, unmounted active-key preservation, and
   selected-key persistence without DOM dependencies.
4. **4.3 — Virtualizer API and lifecycle:** add explicit key/index scrolling,
   measurement and resize behavior, scroll-driven window updates, and cleanup
   only after contract tests cover those responsibilities.
5. **4.4 — Component integration:** integrate `EnhancedSelect` rendering and
   option registry with bounded windows; preserve full-data selection and
   stable `activeKey`; update `aria-activedescendant` only for mounted options.
6. **4.5 — Renderer parity:** cover built-in, custom element, grouped, and
   renderer-pool lifecycle behavior under window eviction/remount.
7. **4.6 — Performance and accessibility regression gate:** record browser
   node counts, render/update/scroll timings, memory observations, and keyboard,
   active-descendant, selected-state, filtering, and lifecycle results at agreed
   dataset sizes.

## 13. Acceptance Criteria

- The data registry and rendered option window have explicit, separate scopes.
- `selectedKeys` remain authoritative and survive viewport unmount/remount;
  filtering and window eviction do not erase selection.
- A valid `activeKey` can be preserved when unmounted, and its option can be
  rendered on demand before the adapter references its ID.
- `aria-activedescendant` is absent when its target is not mounted and points
  to the correct rendered option ID when it is mounted.
- Scroll-to-key/index works for variable-height items and integrates with
  active navigation and scroll-to-selected behavior.
- Built-in and supported custom renderers recycle/mount/unmount without stale
  identity, ARIA, content, or retained-node state.
- Performance and memory targets are agreed and measured in a browser at
  representative data sizes; synthetic timing assertions are reported
  separately from browser measurements.
- Unit, contract, build, lint, browser accessibility, and lifecycle gates pass
  for each implementation stage. Public APIs remain compatible unless a later
  phase explicitly approves a change.

## 14. Phase 4.0 Verification

| Check | Result |
| --- | --- |
| Source audit | Complete for `EnhancedSelect`, `NativeSelectElement`, `Virtualizer`, item registry, renderer pools, and related tests. |
| `npm run lint` | Passed with zero errors and six existing warnings. |
| `npm run build` | Passed across workspaces; existing Rollup `eval` and React directive warnings remain. |
| `git diff --check` | Passed. |

No runtime source, configuration, or test files were changed for this audit.

## 15. Phase 4.1 Virtualization Contract

This section defines the proposed ownership and identity contract before any
virtualizer or component implementation changes. It is documentation only; it
does not add engine types, selectors, effects, or runtime behavior.

### Identity and Rendering Scopes

| Scope | Contract meaning | Owner / relationship |
| --- | --- | --- |
| `DataKeys` | Stable, unique keys for the current loaded data generation, in source order. | Item adapter and data registry derive keys from records; duplicate source keys follow the registry duplicate-key policy. Reordering changes key-to-index mappings, not key identity. |
| `FilteredKeys` | Ordered keys remaining after the current query/filter. | Filtering layer; subset of `DataKeys` for the current loaded local dataset. |
| `RegisteredKeys` | Keys the engine recognizes as valid candidates for current interaction and active identity. | Engine state; not a DOM inventory. It must not be overwritten with the current viewport or mounted-target set. Disabled eligibility remains a separate policy input. |
| `WindowKeys` | Ordered filtered keys selected for the current viewport plus overscan. | Virtualizer/window calculation. Subset of `FilteredKeys`. |
| `MountedKeys` | Keys whose option targets currently exist in the rendered DOM and can be resolved to IDs. | Component/web adapter observation. Subset of `WindowKeys`; asynchronous rendering may make it temporarily smaller. |
| `SelectedKeys` | Authoritative selected identities. | Engine state, independent of `WindowKeys` and `MountedKeys`; viewport eviction and filtering must not clear selection. Required, disabled, or explicit data-replacement policy may still reconcile it. |
| `ActiveKey` | Authoritative logical active identity. | Engine state. If still valid in the filtered/registered candidate set, it may remain active while outside the current window or unmounted. If filtering invalidates it, the filter/engine policy may clear or replace it. |

For the currently loaded local dataset, the subset relationships are:

```text
FilteredKeys ⊆ DataKeys
RegisteredKeys ⊆ FilteredKeys
WindowKeys ⊆ FilteredKeys
MountedKeys ⊆ WindowKeys
```

`RegisteredKeys` and `MountedKeys` are deliberately distinct. Engine
registration communicates logical key validity; DOM mounting communicates
whether an adapter can resolve an option target. Neither `ActiveKey` nor
`SelectedKeys` is represented by an index as its identity.

### Active, Selected, and ARIA Rules

- Viewport/window eviction must not dispatch a selection clear or remove a key
  from `SelectedKeys`. A selected option receives selected-state projection
  again when it remounts.
- Window eviction alone must not invalidate a still-filtered, enabled
  `ActiveKey`. Active styling and DOM references may be absent while its target
  is unmounted.
- The adapter sets `aria-activedescendant` only when `ActiveKey` resolves to a
  currently mounted option target with a non-empty ID. Otherwise it removes
  the attribute while preserving a valid engine `ActiveKey`.
- On active-key navigation, the system requests that the key be brought into
  the render window. The option must mount and receive its stable ID before
  `aria-activedescendant` points to it.
- Filtering may change the active candidate set. If the active key is no
  longer in `FilteredKeys` / `RegisteredKeys`, a documented engine policy must
  clear it or choose a valid replacement. That is separate from window
  eviction.

### Scrolling and Measurement Intent

Scroll requests use semantic identity (`key`) where available, with an index
request allowed only for an explicitly scoped data generation. The request
contains no DOM node. The component/virtualizer resolves a key to the current
index, updates the window, and reports completion only after the target can be
rendered. The engine does not call DOM APIs or calculate pixel offsets.

The virtualizer owns viewport/window and overscan calculations, item
measurement, offset lookup, and scroll positioning. Measurements should be
associated with stable item identity, or invalidated when content changes under
that identity; index-only measurements must be reconciled on reorder. The
contract must define how estimated heights are updated, how variable-height
measurements affect the current window, and how scroll-to-selected composes
with active navigation before implementation begins.

### Reorder and Renderer Rules

- Reorder preserves active and selected keys when those keys remain valid.
  Current indexes are looked up again from the registry; an old index is never
  treated as identity.
- Replacing an item with the same stable key retains identity, while its label,
  value, disabled state, group, and measurement may be refreshed from the new
  record.
- Renderers receive the current key and index context for each mount. Recycled
  elements must have old IDs, ARIA state, event state, content, and index-derived
  attributes refreshed before becoming a target for a different key.
- Grouped and custom component renderers must either use the same bounded
  window contract or explicitly document a supported fallback and its memory
  limits.

### Contract Decisions Deferred to Implementation Design

The following policy choices remain deferred to later window/virtualizer design:

- Whether a scroll request for a filtered-out or not-yet-loaded key is rejected,
  retained as pending, or resolved by an external data-loading contract.
- Whether an item replacement with the same key invalidates its measured
  height automatically or uses an explicit content-version input.
- The initial active-key policy when a popup opens and the policy when a filter
  removes the active key.
- Exact overscan, measurement batching, scroll anchoring, and browser-specific
  performance targets.

These choices must not collapse the data, filtered, registered, window, and
mounted scopes into one collection.

### Phase 4.1 Documentation Verification

| Check | Result |
| --- | --- |
| `npm run lint` | Passed with zero errors and six existing warnings. |
| `npm run build` | Passed across workspaces; existing Rollup `eval` and React directive warnings remain. |
| `git diff --check` | Passed. |

No engine contract module or test file was added because this stage defines the
contract in documentation only. No runtime source, configuration, or test file
was changed.

## 15. Phase 4.2 Pure Window and Identity Decisions

`packages/core/src/engine/virtualization.ts` defines a DOM-free
`VirtualizationScope<TKey>` with separate data, filtered, registered, window,
mounted, selected, and active identities. It is not exported from the package
root and has no component or virtualizer consumer in this stage.

The pure selectors and intent constructors establish these rules:

- `isSelectedKeyVisible()` means the selected key is present in
  `FilteredKeys`; it does not require a mounted target. Filtering visibility
  is distinct from viewport visibility, and selection persistence is handled
  independently by `preserveSelectionAcrossWindow()`, which copies the full
  selected-key set without pruning it.
- `isActiveKeyMounted()` and
  `getAriaActiveDescendantEligibility()` require the active key to be mounted.
  The latter also requires a non-empty ID supplied by the caller. A registered
  or window key alone cannot make an ARIA target eligible; unavailable targets
  return no option ID while the input scope retains `activeKey` unchanged.
- `computeWindowKeys()` returns an ordered, clamped half-open slice of filtered
  keys. `resolveKeyIndex()` looks up the current index from the current key
  order, so reorder does not retain an old index.
- `createScrollToKeyIntent()` carries a stable key and no DOM reference.
  `createScrollToIndexIntent()` requires a data-generation value so an index
  cannot silently be reused against a different data snapshot.
- `getVirtualizationScopeViolations()` reports violations of the subset
  relationships without mutating or normalizing the supplied scope.

`virtualization-contract.spec.ts` covers selected-key preservation through
window/mount eviction, valid unmounted active identity, ARIA target availability,
window and mounted subset checks, registered-versus-mounted distinction,
reorder lookup, key and generation-scoped scroll intents, and the absence of
browser-global references. The module remains an unused pure contract: no
rendering, scrolling, ARIA applier, component, or public API behavior changed.

### Phase 4.2 Verification

| Check | Result |
| --- | --- |
| Focused `virtualization-contract.spec.ts` | 12 passed. |
| `npm run test:unit` | 391 passed, one skipped. |
| `npm run lint` | Passed with zero errors and six existing warnings. |
| `npm run build` | Passed across workspaces; existing Rollup `eval` and React directive warnings remain. |
| `git diff --check` | Passed. |

No browser tests or package contract suite were run; the new module is not
exported and no component or adapter consumes it.

The first full unit run hit the existing 1M-item stress test's 50 ms timing
threshold at 51.95 ms. The immediate rerun passed the complete unit suite; no
stress-test code was changed. The build regenerated the embedded React Native
Core bundle as a side effect, and that generated file was restored.

## 16. Phase 4.3.1 Virtualizer Scroll API

`Virtualizer.scrollToIndex(index)` clamps a requested index to the current item
range and returns `{ index, offset, scrollTop }`. The offset comes from the
existing `cumulativeOffset()` path, using measured heights and the Fenwick
prefix sum when available. The virtualizer records the returned scroll target
as its intended scroll position; the caller remains responsible for applying
`scrollTop` to a DOM container. The method does not require an option node and
does not mutate container scroll state.

The method returns `null` for an empty item set or after `destroy()`, and does
not change the recorded intended position in those cases. Existing
`computeWindow()` behavior and all component call sites remain unchanged. No
component integration, scroll listener, key resolver, window recomputation,
ARIA change, or performance claim is part of this slice.

`virtualizer.spec.ts` covers negative and over-range clamping, fixed-height
offsets, measured Fenwick offsets, DOM-node independence, post-destroy no-op,
and the existing window calculation coverage. Phase 4.2 contract tests run
alongside it.

### Phase 4.3.1 Verification

| Check | Result |
| --- | --- |
| Focused virtualizer and virtualization contract suites | 23 passed. |
| `npm run test:unit` | 397 passed, one skipped. |
| `npm run lint` | Passed with zero errors and six existing warnings. |
| `npm run build` | Passed across workspaces; existing Rollup `eval` and React directive warnings remain. |
| `git diff --check` | Passed. |

The build regenerated the embedded React Native Core bundle as a side effect;
the generated file was restored. No browser tests were run and no benchmark
claim is made.

## 17. Phase 4.3.2 Scroll-to-Key Resolver

`Virtualizer.scrollToKey(key, resolveIndex)` accepts a caller-owned stable-key
resolver and delegates valid indexes to `scrollToIndex()`. Resolved indexes
must be finite integers within the current item range. Missing, null,
undefined, non-finite, fractional, and out-of-range results return `null`
without clamping to another item's index or changing the intended scroll
position. Calls after destruction or with an empty item set return `null`
without invoking the resolver.

The resolver is supplied per call; no registry or component wiring was added.
The API returns the same `VirtualizerScrollResult` as `scrollToIndex()` and
does not read or mutate DOM nodes. `virtualizer.spec.ts` covers key resolution,
measured Fenwick offsets through the shared index path, missing/invalid/out of
range results, and destroyed-instance behavior. Existing scroll-to-index and
virtualization-contract tests continue to run in the focused suite.

### Phase 4.3.2 Verification

| Check | Result |
| --- | --- |
| Focused virtualizer and virtualization contract suites | 34 passed. |
| `npm run test:unit` | 408 passed, one skipped. |
| `npm run lint` | Passed with zero errors and six existing warnings. |
| `npm run build` | Passed across workspaces; existing Rollup `eval` and React directive warnings remain. |
| `git diff --check` | Passed. |

No component integration, browser test, or benchmark claim is part of this
slice.

The build regenerated the embedded React Native Core bundle as a side effect;
the generated file was restored.

## 18. Phase 4.3.3 Variable-height Window Lookup

`Virtualizer.computeWindow()` keeps its average-height calculation when no
Fenwick tree is active. For Fenwick-backed lists, it uses prefix-sum
`lowerBound()` lookup for the viewport start and end. The start lookup advances
past an exact item boundary so the first visible index is correct; the end
lookup preserves an inclusive end index. Buffer is then applied, and both
bounds are clamped to the available item range. Empty lists retain a zero-size
window, and `windowSize` remains derived from inclusive bounds.

The return shape and `computeWindow()` call sites are unchanged. Tests cover
the average-height path, measured-height shifts, Fenwick lookup, lower and
upper clamping, window-size consistency, and existing `scrollToIndex` and
`scrollToKey` offset behavior. No component integration, scroll listener, DOM
scroll mutation, ARIA behavior, or performance claim was added.

### Phase 4.3.3 Verification

| Check | Result |
| --- | --- |
| Focused virtualizer and virtualization contract suites | 40 passed. |
| `npm run test:unit` | 414 passed, one skipped. |
| `npm run lint` | Passed with zero errors and six existing warnings. |
| `npm run build` | Passed across workspaces; existing Rollup `eval` and React directive warnings remain. |
| `git diff --check` | Passed. |

The build regenerated the embedded React Native Core bundle as a side effect;
the generated file was restored. No browser tests or benchmarks were run.

## 19. Phase 4.3.4 Measurement Lifecycle

`Virtualizer` now tracks the total of measured heights incrementally. A first
measurement adds its height; an accepted remeasurement replaces the prior
contribution; and changes at or below `measurementThreshold` leave the
aggregate unchanged. `averageHeight` is recalculated from the running total
and measured count without materializing the map or reducing all entries. If
all measurements are removed, it returns to the original estimated height.

Fenwick updates use the original estimated item height as the baseline for
each previously unmeasured item, independent of the changing measured average.
When the item count changes, stale measurements are removed from both the map
and aggregate, and an existing Fenwick tree is rebuilt from estimated heights
plus the retained measurements. This avoids carrying prefix sums with an
invalid tree shape across resize. `destroy()` clears the measurements and
aggregate and resets the displayed average to its initial estimate.

`virtualizer.spec.ts` covers average updates, threshold behavior, resize
cleanup, destroy cleanup, Fenwick correctness across first measurements and
remeasurement, and Fenwick rebuild after item-count changes. Existing
`computeWindow`, `scrollToIndex`, and `scrollToKey` cases remain in the suite.
No component, scroll, ARIA, or public behavior integration changed.

### Phase 4.3.4 Verification

| Check | Result |
| --- | --- |
| Focused virtualizer and virtualization contract suites | 47 passed. |
| `npm run test:unit` | 421 passed, one skipped. |
| `npm run lint` | Passed with zero errors and six existing warnings. |
| `npm run build` | Passed across workspaces; existing Rollup `eval` and React directive warnings remain. |
| `git diff --check` | Passed. |

The build regenerated the embedded React Native Core bundle as a side effect;
the generated file was restored. No browser tests or benchmarks were run.

## 20. Phase 4.3.5 Scroll-driven Window Update API

`Virtualizer.updateWindow(scrollTop, viewportHeight)` normalizes non-finite or
negative scroll positions to zero and non-finite or negative viewport heights
to zero. It calls the existing window calculation, stores a defensive snapshot,
and returns that snapshot with normalized inputs and a `changed` flag. The flag
is true only when the start index, end index, or window size differs from the
previous snapshot. `getCurrentWindow()` returns a copy of the last snapshot.

An empty item set returns `{ startIndex: 0, endIndex: -1, windowSize: 0 }` as
its zero-size window. A changed item count invalidates the stored snapshot so
the next update reports a fresh window. Destroying the virtualizer clears the
snapshot, and subsequent update requests return `null`. The API does not
install a scroll listener, schedule rendering, or mutate DOM scroll state; the
caller continues to own those actions.

`virtualizer.spec.ts` covers initial and repeated snapshots, range change
detection, input normalization, empty lists, destruction, and snapshot
invalidation after resize. Existing `computeWindow`, measurement,
`scrollToIndex`, and `scrollToKey` cases continue to pass.

### Phase 4.3.5 Verification

| Check | Result |
| --- | --- |
| Focused virtualizer and virtualization contract suites | 55 passed. |
| `npm run test:unit` | 429 passed, one skipped. |
| `npm run lint` | Passed with zero errors and six existing warnings. |
| `npm run build` | Passed across workspaces; existing Rollup `eval` and React directive warnings remain. |
| `git diff --check` | Passed. |

The build regenerated the embedded React Native Core bundle as a side effect;
the generated file was restored. No browser tests or benchmarks were run.

## 21. Phase 4.3.6 Virtualizer API/Lifecycle Regression Gate

The combined regression suite verifies the APIs and lifecycle work from
Phases 4.3.1–4.3.5. `scrollToIndex()` results remain compatible with
`updateWindow()`; `scrollToKey()` delegates to the index path without changing
DOM scroll state; measured height updates produce consistent cumulative
offsets and window lookup; and shrinking the item count removes stale
measurements, releases pooled active nodes, and invalidates the current window
snapshot. Destroyed instances return `null` from scroll and update APIs.
Existing virtualization contract and memory lifecycle tests also pass.

### Phase 4.3.6 Verification

| Check | Result |
| --- | --- |
| Focused virtualizer, virtualization contract, and memory lifecycle suites | 70 passed. |
| `npm run test:unit` | 434 passed, one skipped. |
| `npm run lint` | Passed with zero errors and six existing warnings. |
| `npm run build` | Passed across workspaces; existing Rollup `eval` and React directive warnings remain. |
| `git diff --check` | Passed. |

No runtime fix was needed. No component integration, DOM scroll mutation,
ARIA behavior, browser test, or benchmark claim was added. The build regenerated
the embedded React Native Core bundle as a side effect; the generated file was
restored. Phase 4.3 is closed locally. Phase 4.4 begins with component
integration planning; no component implementation has started.
