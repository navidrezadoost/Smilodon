# Phase 2 - Stable Identity & Selection Model

Status: **Phase 2C accepted and committed; Phase 2D.1 and 2D.2 authority flips complete.**
Engine exports remain experimental, as documented in Phase 1. The Phase 2D.1
selection flip and Phase 2D.2 active-key flip are complete inside
`EnhancedSelect`; adapter migration remains out of scope.

## 1. Problem

The legacy runtime can treat array indexes as item identity. Indexes are presentation positions, so they become unstable when items are sorted, filtered, grouped, loaded asynchronously, or replaced.

If `items = [A, B, C]` and index `2` is selected, the user selected `C`. After reorder to `[C, A, B]`, index `2` now points at `B`. That is not acceptable for enterprise selection state.

## 2. Goal

Move selection ownership from index-based state to key-based state:

- `selectedKeys` owns selection.
- `activeKey` owns active item identity.
- Indexes remain presentation positions for rendering, keyboard movement, virtualization windows, scroll positioning, and ARIA positional metadata.

## 3. Non-goals

- No virtualization migration.
- No async loading redesign.
- No keyboard rewrite except active-key parity.
- No public API breaking change.
- No framework adapter API redesign.
- No CSS or design-token migration.

## 4. Current Legacy State

The web component currently contains both engine-backed synchronization and
legacy mutations of:

- `selectedIndices`
- `selectedItems`
- `activeIndex`

`activeIndex` also supplies the highlighted navigation position. These fields
must become derived compatibility snapshots after migration; they are not yet
exclusively derived. Phases 2A and 2B leave `EnhancedSelect` unchanged.

Public value behavior remains value-based through:

- `getSelectedValues()`
- `setSelectedValues(values)`
- `change.detail.selectedValues`
- framework `value` / `modelValue` props

## 5. Target Model

After the authority flip, the engine will own:

- `selectedKeys`
- `activeKey`
- registered item keys
- disabled keys
- selection policy configuration

The registry supplies lookup snapshots:

- `keyToRecord`
- `keyToIndex`
- `indexToKey`
- `records` in input order, with extracted key, item, index, label, value, disabled state, and group key

The registry never owns or prunes selection. A visible subset can omit a selected
key. Later runtime integration must retain the selected record separately to
resolve its value and label while absent from the current registry. Re-registering
the same explicit key resolves to the replacement item and its current fields.

## 6. ItemAdapter Contract

`ItemAdapter` extracts identity and display fields from user items:

- `getKey(item, index)` returns stable internal identity.
- `getValue(item, index)` returns outward business value.
- `getLabel(item, index)` returns display text.
- `isDisabled(item, index)` returns disabled state.
- `getGroupKey(item, index)` returns a grouping key.

Key, value, and label are intentionally separate. For example:

```ts
{
  id: "row-8d7a", // key
  code: "IR-THR", // value
  name: "Tehran", // label
}
```

The pure contract is:

```ts
type SelectKey = string | number;

interface ItemAdapter<TItem, TKey extends SelectKey = SelectKey, TValue = unknown> {
  getKey(item: TItem, index: number): TKey;
  getValue(item: TItem, index: number): TValue;
  getLabel(item: TItem, index: number): string;
  isDisabled?(item: TItem, index: number): boolean;
  getGroupKey?(item: TItem, index: number): string | null;
}
```

`index` is supplied for compatibility and presentation. Stable `getKey`
implementations must not depend on it. `createDefaultItemAdapter` supports an
explicit `getKey` override as well as field and extraction callbacks.

### Default identity strategy

An explicit `getKey` wins. Otherwise, reference items use the first usable key:

1. `item.id`
2. `item.key`
3. `item.value`
4. configured `valueField`
5. configured `getValue` callback
6. generated object identity from a `WeakMap`

String and number fields retain their types (`1` and `"1"` are distinct keys).
Boolean, bigint, and symbol fields are converted to strings; nullish or reference
fields fall through. Primitive items use `String(item)`, including `null` and
`undefined`. Consequently, primitive `1` and `"1"`, repeated primitives, and
symbols with identical descriptions collide and follow the duplicate policy.
Supply a custom adapter or `getKey` when these need distinct identities.

The same keyless object reference keeps its generated key through reorder and
filtering. A new object without an explicit key gets a new identity, even if its
fields match. Generated keys are local to the runtime, not durable server IDs.
The `__smilodon-object-` and `__smilodon-index-` prefixes are reserved for fallback
keys; explicit collisions are diagnosed by the registry.

`keyFallback: 'index'` opts keyless reference items into compatibility fallback.
It is never selected automatically and warns outside production (or reports to
`onIndexFallback`). Provide `getKey` or `valueField` for durable identity instead.

### Registry and duplicate keys

`createItemRegistry(items, adapter, options?)` extracts a new snapshot without
mutating items or an earlier registry. Optional adapter methods default to
`disabled: false` and `groupKey: null`. Record fields and lookup collections are
readonly in TypeScript; the registry does not deep-freeze user items.

| Policy | Behavior |
| --- | --- |
| `throw` | Reject duplicates with the key and both input indexes. |
| `warn` | Report each duplicate through `onDuplicateKey`, or `console.warn` when no callback is supplied; the first record wins. |
| `first-wins` | Keep the first record without logging. |
| `last-wins` | Resolve lookups to the last record without logging. |

All successful policies preserve every input position in `records` and
`indexToKey`; `keyToRecord` and `keyToIndex` resolve the winning record. Never use
`records[keyToIndex.get(key)]` after filtering the records independently. Every
collision is available in `duplicateKeys`, whose `firstIndex` always means the
first occurrence, even under `last-wins`.

The default is `throw` unless `globalThis.process?.env?.NODE_ENV` is
`'production'`, which selects `warn`. Browsers without that environment value
default to strict behavior; a browser production caller can explicitly set
`duplicateKeyPolicy: 'warn'`. The registry has no DOM or component dependency.

## 7. Backward Compatibility

Existing component and framework value APIs must remain valid. Key extraction
does not change business value extraction: a custom `getValue` wins, then
`valueField`, then `item.value`, then the item itself. Labels use `getLabel`,
`labelField`, `item.label`, `item.text`, then `String(item)`.

Later migration must map external values to keys and resolve selected keys back
to records for single values, multi values, selected items, and change events.
The core component's `getSelectedValues()` / `setSelectedValues(values)` and
framework `value` / `modelValue` / default-value behavior must stay compatible.
Phases 2A and 2B introduce no framework API changes.

The package root continues to export the existing global `SelectionConfig`.
The experimental engine policy type is exported there as `EngineSelectionConfig`
to avoid a name collision; the engine module retains its own `SelectionConfig`.

## 8. Migration Plan

1. **2A:** Design, adapter contract/default strategy, registry, duplicate and
   reorder tests. Leave `EnhancedSelect` unchanged.
2. **2B:** Pure key selection events, independent selection policy, disabled
   and required rules, active-key behavior, and tests (see section 12).
3. **2C:** Connect `EnhancedSelect` in shadow mode. Mirror selection mutations
   and compare legacy selected items/indices converted to keys against engine
   state after each mutation; throw on parity failures in development/tests.
4. **2D:** After parity is green, make `selectedKeys` and `activeKey`
   authoritative. Derive legacy snapshots and map external values to keys.
5. **2E:** Integration/E2E coverage, final documentation, and regression baseline.

Partial later-stage work already present in a checkout does not bypass the
shadow-mode parity gate or justify claiming the authority flip is complete.

## 9. Test Plan

Phase 2A tests cover default/custom key extraction, key/value separation,
keyless object identity, duplicate policies and diagnostics, registry lookups,
and selection-key resolution through reorder/filter/replacement. They exercise
the adapter and registry directly without constructing a component.

```bash
npx vitest run packages/core/tests/item-adapter.spec.ts packages/core/tests/item-registry.spec.ts --config packages/core/vitest.config.ts
npm run lint
npm run build
npm run test:unit
npm run test:contracts
```

Later stages must additionally prove:

- Single select replaces the selected key.
- Multi select toggles selected keys.
- Disabled keys cannot become active or selected.
- Required single selection cannot be emptied by toggling the selected key.
- Reorder preserves selection by key.
- Filter preserves selection by key.
- Item replacement preserves selection when keys match.
- Duplicate keys are rejected or diagnosed according to policy.
- Legacy value output remains unchanged.
- Browser E2E verifies reorder-safe single and multi selection.

The Phase 2B policy and engine tests now cover the key-level rules from this
list. Runtime parity, legacy value output, and browser behavior still require
the later integration gates.

At the end of the full phase, run the Playwright suite in the prescribed
`mcr.microsoft.com/playwright:v1.59.1-jammy` container and audit remaining
`selectedIndices` / `activeIndex` references as derived compatibility or
presentation/navigation positions.

## 10. Acceptance Criteria

Phase 2 is complete when:

- `ItemAdapter` exists.
- `ItemRegistry` exists.
- Duplicate key policy exists.
- `selectedKeys` is authoritative in the engine.
- `activeKey` is authoritative in the engine.
- Selection ownership no longer depends on index.
- Remaining `selectedIndices` and `activeIndex` usages are derived compatibility or presentation/navigation state.
- Reorder and filter do not break selection.
- Multi-select is reorder-safe.
- External value behavior is not broken.
- Unit, integration, contract, build, lint, and E2E gates pass.

## 11. Phase 2A Verification (2026-10-09)

| Check | Result |
| --- | --- |
| Adapter and registry unit tests | 48 passed. |
| Core TypeScript check (`npx tsc --noEmit -p packages/core/tsconfig.json`) | Passed, including the new tests. |
| `npm run lint` | Passed with six existing warnings. |
| `npm run build` | Passed across workspaces. |
| `npm run test:unit` | 187 passed, one skipped, one existing failure. |
| `npm run test:contracts` | Six passed, 44 skipped. |

The full unit suite fails at
`packages/core/tests/enhanced-option-renderer.spec.ts:137`: selecting a new option
leaves `activeIndex` at `-1` instead of `1`. The same failure was reproduced
before the Phase 2A changes (139 passed, one skipped, one failed). No additional
unit failures were introduced. `EnhancedSelect` was left byte-for-byte unchanged.

Two type-only integration fixes retain the generic selection key through the
event conversion and disambiguate the root configuration export. They do not
change selection behavior. Browser E2E and runtime parity remain gates for the
later migration stages; this verification does not claim full Phase 2 completion.

## 12. Phase 2B Selection and Active-Key Policy

`applySelectionRequest(selectedKeys, request, config)` is independent of the
registry and platform. It never mutates its input sets, request arrays, or
configuration. The engine routes selection events through this function and
owns `selectedKeys` and `activeKey` within the pure state machine. This does not
flip ownership in the legacy component.

### Selection requests

| Request | Rule |
| --- | --- |
| `SELECT_KEY_REQUEST` | Select one key in single mode; add a key in multi mode. Repeating selection of the same key is always a no-op, including when `allowDeselect` is true. |
| `TOGGLE_KEY_REQUEST` | Add an unselected enabled key. Remove a selected key in multi mode; single mode requires `allowDeselect: true`. `required` prevents removal of the last valid key. |
| `DESELECT_KEY_REQUEST` | Explicitly remove a selected enabled key unless it is the last required key. This explicit operation does not depend on `allowDeselect`. |
| `REPLACE_SELECTION_REQUEST` | Deduplicate requested keys, remove disabled keys, and enforce single mode or the existing multi `maxSelections` limit. An empty eligible replacement retains the previous valid selection when required. |
| `CLEAR_SELECTION_REQUEST` | Clear optional selection. Preserve a nonempty required selection. |

Requests targeting a disabled key are ignored. Selection does not require
membership in the currently registered keys: an enabled key can be selected
while absent from the visible set. Registration alone never invents a selected
key. The existing optional `maxSelections` limit is retained; zero or omission
means unlimited multi selection.

Selection identity is Set membership. A replacement containing the same keys in
a different order is a no-op and retains the existing selection insertion order.
Key comparison matches JavaScript Map/Set behavior: numeric and string keys are
distinct; signed zero and `NaN` obey SameValueZero equality.

### Registration and configuration changes

`ITEMS_REGISTERED` replaces the current registered keys and disabled-key
snapshot. Omitting `disabledKeys` means the new snapshot has no disabled keys.
`SELECTION_CONFIG_CHANGED` patches only supplied configuration fields; omitting
its `disabledKeys` retains the existing disabled set, while `[]` clears it.

The explicit item-change policy is:

```text
selectedKeys survives absence from the registered/visible set.
activeKey requires presence in the registered set and an enabled key.
```

Reordering or re-registering the same enabled keys preserves both identities and
emits no identity-change effect. If a selected key disappears, its selection
remains; if the active key disappears, active identity becomes `null`. Bringing
that item back does not automatically restore active identity. The platform will
later retain records for hidden selected keys to resolve values and labels.

An explicitly newly disabled key is different from an absent key: registration
or configuration updates remove it from selection and clear it if active.
Disabled eligibility takes precedence over `required`, so disabling the last
selected key can leave required selection empty. The engine does not select a
replacement automatically. Switching to single mode or reducing `maxSelections`
retains the earliest eligible keys in selection order, independent of item index.

### Active requests and effects

`ACTIVE_KEY_CHANGED` accepts a registered, enabled key or `null`. Requests for
disabled or unregistered keys are ignored and preserve the current active key.
Selection requests do not implicitly move active identity, and active requests
do not select items. A later platform interaction can dispatch both requests.

Identity effects contain only keys and reasons:

```ts
{ type: 'SELECTION_CHANGED', selectedKeys: readonly TKey[], reason: SelectionReason }
{ type: 'ACTIVE_KEY_CHANGED', activeKey: TKey | null, reason: ActiveReason }
```

They never contain values, labels, indexes, or resolved items. Effects preserve
the request reason; reconciliation effects use `programmatic`. No-op requests
emit no effects. A reconciliation changing both identities emits one effect for
each, followed by one existing `SYNC_ARIA` effect. The engine emits descriptions
of work; it performs no DOM, focus, event-dispatch, or ARIA operations.

The Phase 2B state, policy, transitions, events, effects, and selectors introduce
no DOM or platform-global dependencies. The Phase 2A adapter/registry diagnostic
behavior is unchanged. In addition to the requested shared unit-test command,
the headless configuration runs adapter, registry, lifecycle, and selection tests
in Node without the component setup or browser globals:

```bash
npx vitest run --config packages/core/vitest.engine.config.ts
npx vitest run packages/core/tests/item-adapter.spec.ts packages/core/tests/item-registry.spec.ts packages/core/tests/select-selection.spec.ts --config packages/core/vitest.config.ts
```

### Historical active-index failure: LEGACY-ACTIVE-001

**Historical (2026-10-09):** `activeIndex` remained `-1` after selecting a newly
rendered custom option, where
`packages/core/tests/enhanced-option-renderer.spec.ts` expects `1`. This was
reproduced before Phase 2A and again before Phase 2B; it was not a pure-engine
regression. The test now passes in the current worktree after its fixture seeds
matching engine selection and active identity. That result includes the current
uncommitted shadow-integration code and does not establish a clean legacy-only
baseline or complete Phase 2C migration.

Keep this test as a Phase 2C regression check; do not skip it or weaken its
assertion. Pure active-key tests separately cover activation, disabled keys,
re-registration, disappearance, and duplicate-effect suppression. Phase 2B's
accepted scope leaves the component, index state, framework adapters, external
value synchronization, async item resolution, and E2E scenarios unchanged.

## 13. Phase 2B Verification (2026-10-09)

| Check | Result |
| --- | --- |
| `select-selection.spec.ts` | 74 new pure policy, transition, active-key, effect, and selector tests passed. |
| Requested adapter/registry/selection command | 122 passed across three files. |
| Node-only engine configuration | 136 passed across four files, including existing lifecycle tests; no browser setup. |
| Core TypeScript check (`npx tsc --noEmit -p packages/core/tsconfig.json`) | Passed. |
| `npm run lint` | Passed with the same six existing warnings. |
| `npm run build` | Passed across workspaces. |
| `npm run test:unit` | 261 passed, one skipped, only `LEGACY-ACTIVE-001` failed. |
| `npm run test:contracts` | Six passed, 44 skipped. |

The pre-change full unit run contained 187 passes, one skip, and the same
`enhanced-option-renderer.spec.ts:137` failure. Phase 2B adds 74 passing tests
and introduces no new failures. The known defect remains visible and open for
the first Phase 2C runtime task described above.

Hash checks confirm that `EnhancedSelect`, the Phase 2A item adapter/registry,
and the web bridge/effect runner remain unchanged. The React Native source
bundle regenerated by the build was restored to its pre-build contents. No
framework adapter or E2E changes were made for this slice. An audit of the
Phase 2B state/policy/transition/event/effect/selector files found no DOM or
platform-global references.

Phase 2B pure tests passed. The full unit suite still has the known pre-existing
`activeIndex` failure. Full Phase 2 acceptance still requires the runtime,
shadow-mode parity, authority-flip, and browser gates.

## 14. Pre-2C Runtime Failure Triage (2026-10-12)

The current worktree contains uncommitted `EnhancedSelect` registry rebuilding,
selection mirroring, and parity assertions. These are partial Phase 2C runtime
changes, not part of the accepted pure Phase 2B slice. The diffs establish that
these changes are present in the worktree; they do not establish who introduced
them or when.

The five failures previously observed in the full unit suite were classified:

| Failure | Classification | Resolution |
| --- | --- | --- |
| `enhanced-option-renderer.spec.ts`: active styling moves to the newly selected option | Partial Phase 2C parity assertion met a test fixture that manually seeded legacy selection and active index without mirroring either into the engine. | Fixture now initializes matching selected and active engine state. The test passes and still verifies `activeIndex === 1` after selecting the second option. |
| `styling-contract.spec.ts`: class-map default state classes | Partial Phase 2C registry reconciliation met a fixture that set only `selectedIndices`, without `selectedItems` or engine selection. | Fixture now seeds consistent legacy and engine selection. |
| `styling-contract.spec.ts`: class-map classes with `::part` | Same incomplete synthetic selection fixture as above. | Fixture now seeds consistent legacy and engine selection. |
| `styling-contract.spec.ts`: class-map update and mirrored styles | Same incomplete synthetic selection fixture as above. | Fixture now seeds consistent legacy and engine selection. |
| `styling-contract.spec.ts`: global styles for custom renderer | Cascaded failure: the preceding failed class-map test stopped before removing its temporary document stylesheet. This test passes in isolation. | Passes in the complete styling suite after the fixture corrections. |

No production runtime code was changed during this triage. The affected tests now
pass, and the complete unit suite reports 262 passed and one skipped. This only
clears the observed failure baseline; it does not certify the partial
`EnhancedSelect` integration or claim Phase 2C completion. Review and dedicated
runtime parity coverage remain required before proceeding with Phase 2C work.

## Phase 2C.1 — Shadow Selection Parity

Status: Complete for selection-only shadow parity.

This stage formalizes the existing EnhancedSelect shadow-integration residue.
Legacy selection remains authoritative. The engine mirrors selection state and
asserts parity in development/test only.

Not an authority flip.
Not adapter migration.
Not public API change.

Active-key shadow parity is deferred to Phase 2C.2 and is not part of this slice.

### Phase 2C.1 Verification (2026-10-12)

| Check | Result |
| --- | --- |
| `enhanced-select-selection-parity.spec.ts` | 13 passed. |
| Full unit suite | 275 passed, one skipped. |
| Core TypeScript check | Passed. |
| `npm run lint` | Passed with six existing warnings. |
| `npm run build` | Passed across workspaces; existing Rollup `eval` and React directive warnings remain. |
| `npm run test:contracts` | Six passed, 44 skipped. |

These checks formalize the current shadow selection mirror only. They do not
make `selectedKeys` authoritative, change adapters or public APIs, or complete
Phase 2C. Active-key parity remains deferred to Phase 2C.2.

### Unrelated worktree formatting note

`git diff --check` reports eight trailing-whitespace lines in the already
modified `packages/core/src/themes/variables.css`. This is an unrelated
pre-existing worktree formatting issue, not part of Phase 2C.2; the file remains
untouched.

## Phase 2C.2 — ActiveKey Shadow Parity

Status: Complete for active-key shadow parity.

This stage formalizes and tests the existing active-key shadow mirror. Legacy
`activeIndex` and highlighted option state remain authoritative. The engine
mirrors the corresponding `activeKey` and asserts parity in development/test
only. Selection parity remains covered by Phase 2C.1.

Not an authority flip.
Not adapter migration.
Not public API change.

Coverage is limited to active-key parity, disabled-option prevention,
filter/re-registration reconciliation, and `aria-activedescendant` sync. Active
identity moves only through existing navigation/selection/focus paths; no new
pointer-hover behavior is introduced. Phase 2D remains deferred.

### Phase 2C.2 Verification (2026-10-12)

| Check | Result |
| --- | --- |
| `enhanced-select-active-parity.spec.ts` | 12 passed. |
| Phase 2C.1 selection plus Phase 2C.2 active parity suites | 25 passed. |
| Full unit suite | 287 passed, one skipped. |
| Core TypeScript check | Passed. |
| `npm run lint` | Passed with six existing warnings. |
| `npm run build` | Passed across workspaces; existing Rollup `eval` and React directive warnings remain. |
| `npm run test:contracts` | Six passed, 44 skipped. |

The tests cover supported pointer selection, keyboard navigation, disabled
prevention, filtering/re-registration, replacement identity, and ARIA sync.
There is no option-hover-to-active handler in the current component, so no new
hover behavior is claimed or introduced. `activeIndex` remains authoritative;
this slice does not complete Phase 2C or start the Phase 2D authority flip.

## Phase 2C.3 — Shadow Integration Hardening & Final Gate

Status: Gate passed; Phase 2D remains blocked pending worktree reconciliation.

This stage audits the existing shadow integration and validates it without
adding runtime behavior or changing legacy authority.

| Mutation path | Legacy mutation | Engine mirror | Assertion | Component test coverage | Gap |
| --- | --- | --- | --- | --- | --- |
| Registry rebuild, `setItems`, `setGroupedItems`, and selection-config update | Rebase `selectedIndices`/`selectedItems` by key; remap or clear `activeIndex`. | `ITEMS_REGISTERED`, `SELECTION_CONFIG_CHANGED`, active mirror. | Selection parity after reconcile; active parity after active sync. | Selection parity covers reorder, same-key replacement, grouped items, and multi-to-single reconciliation; active parity covers same/missing-key replacement and required-config resync. | None identified. |
| Filter/render registration | Does not prune selection; clears `activeIndex` only when its key leaves the visible registration. | `ITEMS_REGISTERED` with visible keys; active mirror. | Both selection and active parity. | Filter tests prove hidden selection retention and active clear/preserve; E2E smoke covers hidden active and selected items. | None for the selected/filter paths in this slice. |
| `_selectOption` pointer and keyboard paths | Updates active index and legacy selected indices/items. | `ACTIVE_KEY_CHANGED`, then select/toggle request. | Active and selection parity at each mirror. | Single/multi/deselect, Enter, pointer selection, and combined interaction chain. | No option-hover path exists in the component. |
| `_selectRange` and `_selectAll` | Replace legacy selected entries from visible options. | `REPLACE_SELECTION_REQUEST`. | Selection parity in `_replaceLegacySelection`. | Keyboard range and select-all tests, including disabled filtering. | None identified. |
| `_handleOptionRemove`, `clear`, clear control, required/config changes, and runtime mode mitigation | Delete, clear, or rebase legacy selected entries where policy permits. | Deselect/clear request or config reconciliation through shared mirror. | Selection parity after dispatch; active parity is reasserted during config sync. | Option removal, public and control clear, required clear, mode reconciliation, and active config synchronization. | None identified. |
| `setSelectedValues`, fetched values, and initial server-selected items | Rebase resolved records, retaining detached entries where not registered. | Replace request with `external-value-sync`. | Selection parity after each resolution path. | Direct, fetched-unregistered, and initial-fetched selection tests. | No new async behavior introduced. |
| Open, `_setActive`, type-ahead, renderer focus helper, scroll-to-selected, and option selection | Writes or remaps `activeIndex`. | `ACTIVE_KEY_CHANGED` with the corresponding reason. | Active parity after each mirror. | Open, ArrowUp/Down, type-ahead, renderer helper, scroll-to-selected, pointer/Enter selection, and re-registration tests. | None identified for current active mutation paths. |
| Active-descendant synchronization | No authority mutation; projects active legacy index to the option ID or removes the attribute. | No separate selection event; follows active reconciliation/render. | Active parity plus DOM ID assertion. | Active option ID, filter clear/preserve, item removal, empty registration, and browser smoke. | None identified. |

The E2E smoke runs against the vanilla demo in Chromium, Firefox, and WebKit.
It selects Cherry through the public value API, reorders items, moves active
identity with ArrowDown, filters out that active option, and verifies that
selection survives while `aria-activedescendant` clears.

At the time of this Phase 2C.3 report, the Phase 2D authority flip was blocked
pending gate acceptance and worktree reconciliation. The Phase 2C checkpoint
was subsequently accepted and committed before Phase 2D.1 began.

### Phase 2C.3 Verification (2026-10-12)

| Check | Result |
| --- | --- |
| Combined selection and active parity suites | 36 passed. |
| Full unit suite | 298 passed, one skipped. |
| Core TypeScript check | Passed. |
| `npm run lint` | Passed with six existing warnings. |
| `npm run build` | Passed across workspaces; existing Rollup `eval` and React directive warnings remain. |
| `npm run test:contracts` | Six passed, 44 skipped. |
| Playwright shadow smoke | Passed in Chromium, Firefox, and WebKit. |
| `git diff --check` | Passed after removing the eight trailing spaces in `variables.css`. |

The tracked diff snapshot is `/tmp/smilodon-phase2c3-before.patch`; as with
`git diff`, it excludes untracked paths. The worktree contained broad
modified/deleted documentation and workflow files, modified adapter sources,
the generated React Native core bundle, Phase 2 engine/platform files, and
untracked `publish.sh`. These were preserved outside the Phase 2C checkpoint.
Phase 2D.1 began on a separate branch and kept its source edits within the
approved authority-flip scope; unrelated dirty paths remain outside this stage.

## Phase 2D.1 — Selection Authority Flip

Status: **Complete.**

Scope is limited to selection authority in `EnhancedSelect`. The engine's
`selectedKeys` is the source of truth for selection mutations. The
`_syncLegacySelectionFromEngine` helper projects keys that have current registry
records into `selectedIndices` and `selectedItems`; selected keys absent from the
registry remain selected in the engine and retain a cached record for value APIs
and change events. Active navigation continues to use legacy `activeIndex` and
the engine's `activeKey` remains a shadow.

This stage flips option selection, range/select-all replacement, removal, clear,
programmatic value updates, required/config reconciliation, and item registry
replacement. Existing Phase 2C parity coverage remains, with parity now meaning
that the registered legacy projection agrees with engine selection. The new
`enhanced-select-authority.spec.ts` verifies engine-first dispatch, derived
snapshots, detached selection retention, duplicate-key handling, and compatible
`change.detail.selectedValues` behavior.

### Phase 2D.1 Verification (2026-10-12)

| Check | Result |
| --- | --- |
| Focused selection parity and authority suites | 29 passed. |
| Full unit suite | 308 passed, one skipped. |
| `npm run lint` | Passed with six existing warnings. |
| `npm run build` | Passed across workspaces; regenerated the embedded Core bundle. |
| `npm run test:contracts` | Six passed, 44 skipped. |
| Playwright shadow smoke | Passed in Chromium, Firefox, and WebKit. |
| `git diff --check` | Passed. |

The selection mutation audit leaves legacy snapshot assignment only in
`_syncLegacySelectionFromEngine`; no selection path directly mutates the
compatibility `selectedIndices` or `selectedItems` collections. Active-key
ownership remains in shadow mode, and no adapter source was changed for this
stage.

## Phase 2D.2 — ActiveKey Authority Flip

Status: **Complete.**

The engine's `activeKey` is now the source of truth for navigation and
activation. `_syncLegacyActiveFromEngine` derives the compatibility
`activeIndex` through the current registry and synchronizes
`aria-activedescendant`. Arrow navigation resolves its current position from
`activeKey`; Enter resolves the selected option from that key. Open, Home/End,
type-ahead, renderer focus, scroll-to-selected, selection activation, filter
registration, item replacement, and disabled/config reconciliation dispatch or
reconcile engine active state before projecting the legacy index. Disabled
options cannot become the engine active key.

The existing `enhanced-select-active-parity.spec.ts` remains. The new
`enhanced-select-active-authority.spec.ts` covers engine-first ArrowUp/ArrowDown,
disabled prevention, filter and replacement behavior, ARIA projection,
selection activation, and navigation after deliberate legacy-index corruption.

### Phase 2D.2 Verification (2026-10-12)

| Check | Result |
| --- | --- |
| Focused active parity, active authority, and selection authority suites | 37 passed. |
| Full unit suite | 318 passed, one skipped. |
| `npm run lint` | Passed with six existing warnings. |
| `npm run build` | Passed across workspaces; regenerated the embedded Core bundle. |
| `npm run test:contracts` | Six passed, 44 skipped. |
| Playwright shadow smoke | Passed in Chromium, Firefox, and WebKit. |
| `git diff --check` | Passed. |

The active-index mutation audit leaves assignment only in
`_syncLegacyActiveFromEngine`. All remaining `activeIndex` reads are projection,
rendering, ARIA, or compatibility styling; navigation and activation use the
engine key. No adapter source was changed for this stage.
