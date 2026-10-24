# Public API Compatibility Baseline — Smilodon 1.10.0

Snapshot: `main` tree at `b0216e6ed7356cfb2e8236767cd3694061449c79` (2026-10-24). This inventory identifies compatibility obligations for 1.x modernization. It is not a promise that all adapters expose identical APIs.

## Package set

All seven maintained package manifests and lockfile workspace entries are at `1.10.0`. Each of the six adapter packages declares `@smilodon/core: ^1.10.0` as a peer dependency; the package-specific peer ranges are:

| Package | Current surface | Declared peer dependencies | Compatibility note |
| --- | --- | --- | --- |
| `@smilodon/core` | `EnhancedSelect` custom element, engine contracts, configuration, renderers, diagnostics and utilities | None | `NativeSelectElement` remains a separate legacy compatibility API |
| `@smilodon/react` | React `Select`, controlled/uncontrolled values, callbacks, ref handle | Core `^1.10.0`; React and React DOM `>=16.8.0` | Props/events must retain React conventions |
| `@smilodon/vue` | Vue `Select`, `modelValue`/`v-model`, emitted events, exposed methods | Core `^1.10.0`; Vue `^3.0.0` | Grouped items use the core `{ label, options }` shape |
| `@smilodon/svelte` | Svelte `Select`, bindable value, component events/methods | Core `^1.10.0`; Svelte `>=3.0.0` OR `>=4.0.0` OR `>=5.0.0` (manifest range) | Events are Svelte component events; not raw DOM events in every consumer path |
| `@smilodon/solid` | Solid `Select`, signals/callbacks/ref handle | Core `^1.10.0`; Solid `^1.9.0` | Contract coverage is shallower than React/Vue/Svelte |
| `@smilodon/vanilla` | `createSelect`, `initSelect`, imperative helpers | Core `^1.10.0` | Requires core custom-element registration; grouped helper input is `{ group, items }`, normalized internally to core groups |
| `@smilodon/react-native` | Native WebView bridge and separate React Native Web path | Core `^1.10.0`; React `>=18.2.0`; React Native `>=0.74.0`; WebView `>=13.12.0` | Treat native and web as separate platforms; handle/API parity is not certified |

## Core custom-element API

The current maintained core element is registered as `<enhanced-select>` when the core browser entry executes. Its documented imperative surface includes:

| Method | Contract |
| --- | --- |
| `setItems(items)` | Replace the loaded flat item collection |
| `setGroupedItems(groups)` | Replace grouped data (`{ label, options }`) |
| `setSelectedValues(values)` | Replace selection by values; returns `Promise<void>` because configured missing-item resolution may be asynchronous |
| `getSelectedValues()` / `getSelectedItems()` | Read selected values or item records |
| `open()` / `close()` / `clear()` / `clearSearch()` | Control popup, selection, or query |
| `updateConfig(partial)` | Apply partial per-instance configuration |
| `setError()` / `clearError()` / `setRequired()` / `validate()` | Local validation and error state |
| `getCapabilities()` / `getKnownLimitations()` | Runtime introspection |
| `getTrackingSnapshot()` / `clearTracking()` / `setLimitationPolicies()` | Runtime diagnostics and limitation controls |

Core emits bubbling, composed custom events. The maintained element's event details are defined in `packages/core/src/types.ts`:

| Event | Detail |
| --- | --- |
| `select` | `{ item, index, value, label, selected, multi? }` |
| `change` | `{ selectedItems, selectedValues, selectedIndices }` |
| `search` | `{ query, results?, count? }` |
| `loadMore` | `{ page, items }` (currently emitted with an empty `items` array as a host request) |
| `open`, `close` | Empty detail object |
| `remove` | `{ item, index }` |
| `clear` | `{ clearedSelection, clearedSearch }` |
| `error` | `{ message, cause? }` |
| `diagnostic` | Timestamp, source channel, name, optional detail |

Selection state is updated before `select` is emitted; `select` precedes aggregate `change` in the documented maintained-core path. `pageLoaded` exists in the exported event-detail map; a corresponding emitter was not found in `EnhancedSelect` during this inventory. Verify before claiming it as a live 1.x event.

## Configuration defaults and precedence

Source of truth: `packages/core/src/config/global-config.ts`. Selected defaults relevant to consumer behavior:

| Setting | 1.10.0 default / behavior |
| --- | --- |
| Selection mode | `single`; `allowDeselect: false`; `closeOnSelect: true`; `maxSelections: 0` means no positive cap is enforced |
| Disabled options | Not selectable, hoverable, or focusable by default |
| Direction / placement | `ltr` / `bottom` |
| Search | `searchable: false` |
| Clear control | Disabled; when enabled, selection and search are both clearable and it hides when empty by default |
| Load-more | Disabled; button label count `itemsPerLoad: 3`; configured threshold `100`; loader shown by config default |
| Infinite scroll config | Disabled; `pageSize: 20`; `initialPage: 1`; declared cache/preload fields default on, maximum cache pages `10`, scroll restoration `auto` |
| Busy indicator | Enabled; spinner shown; “Loading…”; minimum display time `200ms` |
| Tracking | Disabled; tracking channels enabled when master switch is on; diagnostics emission off; `maxEntries: 200` |
| `virtualize` | `true`; this enables legacy chunk rendering for large flat lists, not viewport windowing |
| Guarded estimated row height | `48`; used only by the guarded viewport-windowing test path |

### Adapter wrapper defaults that differ from core

The following are source-declared wrapper defaults for selected props, not a claim of identical effective behavior across every adapter. `virtualized` maps to the legacy `virtualize` chunk-rendering setting; it does not enable viewport windowing. The core `pageSize` setting is currently not consumed by the integrated `EnhancedSelect` load-more transition. A separate internal utility has its own page-size implementation but is not exported through the core package entry point or wired into this component.

| Surface | `virtualized` / chunk rendering | `pageSize` prop/config default | Placement default | Placeholder wrapper value |
| --- | --- | --- | --- | --- |
| Core custom element | `virtualize: true` | `20` | `bottom` | `Select an option...` |
| React | `false` | `20` | `bottom-start` | `Select an option...` |
| Vue | `true` | `50` | `auto` | Unset; core default is retained when `undefined` is ignored by the element config merge |
| Svelte | `true` | `50` | `auto` | Empty string (`''`) |
| Solid | `true` | `50` | `auto` | Unset; core default is retained when `undefined` is ignored by the element config merge |
| React Native native and web paths | `true` | `50` | `auto` | Unset; core default is retained when `undefined` is ignored by the element config merge |
| Vanilla helpers | `false` | No helper default; omitted value remains unset | `auto` | Unset; core default is retained when `undefined` is ignored by the element config merge |

Across these wrappers, `multiple`, `searchable`, and `infiniteScroll` default to `false`. Vanilla's `createSelect()` and `initSelect()` call the element's imperative API immediately, so `@smilodon/core` must be registered first. The helper's grouped input remains `{ group, items }`, unlike the core/framework `{ label, options }` shape.

These wrapper-level differences matter when preserving compatibility. In the current wrappers, explicit convenience defaults are applied as per-instance config and can override global values set by `configureSelect()`. Where implemented, a supplied `config` passthrough is applied after convenience props and wins for overlapping fields. Do not assume global configuration overrides adapter defaults or that unprovided props have the same effects in every adapter.

Configuration precedence established by source:

1. Core defaults initialize the global `selectConfig`.
2. `configureSelect(partial)` deep-merges global defaults.
3. Core instance `updateConfig(partial)` deep-merges values over its current instance config; `undefined` source values are ignored.
4. Adapters apply their convenience-prop-derived config after element initialization. Their explicit defaults can therefore override global values.
5. React, Vue, Svelte, Solid, React Native, and Vanilla apply a supplied `config` passthrough after convenience-derived config, so the passthrough wins where both provide a value.
6. A later imperative `updateConfig(partial)` updates that instance and can override adapter-provided values until another adapter update reapplies its props.

These orders are based on the 1.10.0 source paths reviewed here; add characterization tests before changing or promising them as a cross-version contract. The global config manager deep-clones with JSON serialization; preservation of function-valued global callbacks is an identified source-level investigation, not a reproduced defect.

Several pagination fields are declared but the core source-reference inventory did not find runtime reads for all of them. Do not remove or silently reinterpret them in 1.x; first decide whether to implement, deprecate, or formally define them.

## Search, pagination, and infinite-scroll compatibility

- Local search filters the currently loaded items and emits query/results/count.
- Remote fetch, request cancellation, stale response rejection, query/page reset, end-of-data signaling, and append/deduplication are host responsibilities today.
- `_loadMoreItems()` increments `currentPage`, emits `loadMore` and calls `onLoadMore(page)`, then relies on a host data update to clear busy state. `setItems()` replaces the data set; callers that page data must provide the desired accumulated items.
- `currentPage` starts from `initialPage || 1` and is incremented before `_loadMoreItems()` emits/calls the callback. With defaults, the first load-more signal is therefore page `2`; whether this is intentional or an off-by-one compatibility hazard needs a targeted contract test before any change.
- `pageSize` is part of config/adapter props, but the current core load-more path does not read it and passes the page number, not a page-size value, into the callback. React defaults it to 20; Vue, Svelte, Solid, and both React Native paths default it to 50; Vanilla has no helper default; core config defaults it to 20.
- Selected-record lookup through `serverSide.fetchSelectedItems` is a separate hook and must not be described as general remote search support.

This workstream must preserve existing callbacks/events and defaults, and should extend their behavior compatibly wherever possible. The Phase 0 inventory does not authorize an API redesign.

## Adapter-specific contracts to preserve

- Vanilla grouped helper input is `{ group, items }`; core and framework `GroupedItem` is `{ label, options }`.
- React uses `value`/`defaultValue` and callbacks; Vue uses `modelValue`/`defaultValue` and emits; Svelte uses its component value/event surface; Solid uses Solid props/callbacks; React Native has bridge-specific behavior.
- `virtualized` in adapters maps to the legacy chunk-rendering feature. It must not be described as bounded-DOM viewport virtualization.
- The Vanilla helper calls element methods during creation; consumers should import/register `@smilodon/core` before calling helper creation unless registration-before-use is separately guaranteed by an integration test.
- `setError`/`clearError` are not exposed by the native React Native WebView handle, although corresponding core/web surfaces exist.

See [API Reference](../API-REFERENCE.md), [Adapter Capability Matrix](../ADAPTER-CAPABILITY-MATRIX.md), and [Feature Contract Audit](./PHASE-4-FEATURE-CONTRACT-AUDIT.md) for package-level details.

## 1.x compatibility obligations

For 1.11.x, preserve package names, existing public exports, defaults, event names/details/order, adapter value conventions, grouped-data shapes, and documented limitations. New options should be additive and have explicit behavior under global defaults, per-instance config, and runtime updates. Do not turn private test seams into public APIs by accident. Breaking removals or semantic changes require an explicitly scoped 2.0.0 plan and migration guide.
