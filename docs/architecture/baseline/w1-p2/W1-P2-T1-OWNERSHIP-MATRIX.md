# W1-P2 Task 1 — Selection Authority Extraction: Ownership Matrix & Evidence

**Increment:** W1-P2 (Extraction) — Task 1
**Starting commit:** `b3fb070b9a964cb431fffc7e2f9beb70c948aab8` (W1-P1.6 closed)
**Branch:** `codex/w1-p1-3-keyboard-characterization`
**Nature:** characterization + parity evidence. **No production source changed.**
**Authorized scope:** W1-P2 Task 1 only. Angular Wave 2 remains NO-GO. API-065 / API-075 remediation NOT authorized.

---

## 0. Executive summary

The directive asks to extract **one bounded key-based selection authority path**
from the web component into the existing headless engine, without changing
observable behavior, and to stop after the compatibility harness + report a
blocker if no transition can be safely routed.

**Finding:** the key-based selection **authority path is already fully
engine-owned.** Selection decisions (`select` / `deselect` / `toggle` / `clear`
/ `replace`) are computed exclusively by the pure engine
(`applySelectionRequest` via `transition`) in
`packages/core/src/engine/selection-policy.ts`. The web component dispatches
every selection mutation to the engine (`SelectEngineBridge.dispatch`) and keeps
its legacy `_state.selectedIndices` / `_state.selectedItems` **as a derived
projection only**, guarded at dev-time by `_assertSelectionProjection`.
The authority flip is commit **`e93eaea` "feat(core): flip selection authority to
engine keys"**, which is in the ancestry of `b3fb070`.

Consequently there is **no remaining safe transition to extract** — re-routing an
already-routed transition would be a semantic no-op, and any structural refactor
would risk regression without satisfying the "one bounded authority path"
criterion. Per the directive's explicit fallback, **this task stops after the
compatibility harness and reports the blocker** rather than forcing an unsafe
implementation.

**Delivered (evidence, no production change):**
1. This ownership matrix (§2).
2. A **pure-engine oracle parity harness** —
   `packages/core/tests/enhanced-select-selection-engine-oracle.spec.ts`
   (8 tests) proving the component's observable selection equals an
   independently-computed pure-engine oracle for paths not previously covered by
   oracle parity (maxSelections cap, allowDeselect single toggle-off, required
   guard, replace-drops-disabled, detached selection).
3. A **framework-independence proof** —
   `packages/core/tests/w1-p2-t1-engine-framework-independence.spec.node.ts`
   (4 tests, real Node, no DOM globals) proving the selection engine modules are
   pure and DOM-free.

---

## 1. Authorized transition (as interpreted)

> "Select the simplest verified key-based selection transition currently
> duplicated between the component and the engine. Route that transition through
> the existing engine without changing the component's observable behavior."

The candidate transitions are `SELECT_KEY_REQUEST`, `DESELECT_KEY_REQUEST`,
`TOGGLE_KEY_REQUEST`, `CLEAR_SELECTION_REQUEST`, `REPLACE_SELECTION_REQUEST`.
**All five are already routed through the engine.** See §2.4 for the exact
dispatch call sites.

---

## 2. Ownership matrix

### 2.1 Where each selection concern is decided

| Concern | Decided by (authority) | Mechanism | Component's role |
| --- | --- | --- | --- |
| Selection membership (which keys are selected) | **Engine** `applySelectionRequest` (`selection-policy.ts`) | `selectKey` / `deselectKey` / `toggle` / `clear` / `replaceKeys` | dispatches request; mirrors projection |
| Selection ordering | **Engine** — Set membership is authoritative; reorder of same keys is "no change" (`applySelectionRequest` tail) | `next.size === selected.size && every(has)` short-circuit | reads `_engine.state.selectedKeys` |
| `multiple` mode semantics | **Engine** `SelectionConfig.multiple` | single → replace with `[key]` | passes `mode === 'multi'` via `SELECTION_CONFIG_CHANGED` |
| `required` constraint | **Engine** `SelectionConfig.required` | deselect of last suppressed; `clear` suppressed; `replace([])` preserves a valid selection | passes `input.hasAttribute('required')` |
| `disabled` items | **Engine** `SelectionConfig.disabledKeys` | select/ toggle/ deselect refused for disabled; `replace`/`normalize` drops disabled | supplies `_getBlockedDisabledKeys()` |
| `maxSelections` cap | **Engine** `SelectionConfig.maxSelections` in `selectKey`/`normalizeKeys` | over-cap select is a no-op | additionally pre-checks cap to emit an announcement (read-only; see §5) |
| `allowDeselect` (single) | **Engine** `SelectionConfig.allowDeselect` | toggle of selected single key deselects only when `multiple || allowDeselect` | chooses `TOGGLE_KEY_REQUEST` vs `SELECT_KEY_REQUEST` |
| Detached selection (key absent from registry) | **Engine** — `selectedKeys` survives registry changes; only disabled keys are dropped on `replace` | `selectedKeys` is independent of `registeredKeys` | maintains `_selectedRecordsByKey` cache for display |
| Item identity / keys | **Engine** `ItemRegistry` (`item-registry.ts`) + `createDefaultItemAdapter` | stable key per item; duplicate-key policy throw/warn/first/last | builds registry, resolves index↔key |
| Keyboard range / visual range **computation** | **Platform (component)** — DOM range + visual order is a platform concern | `_selectKeyboardRange` → `_selectVisualRange` → `_selectRange` | computes the set of entry keys, then calls `_requestSelectionReplacement` (→ engine `REPLACE`) |
| Event emission (`select`, `change`, `remove`, callbacks) | **Platform (component)** | `_emit`, `_emitChange`, `_config.callbacks` | emits after engine state settles; distinguishes interaction (`pointer`/`keyboard`) vs programmatic (`programmatic`/`external-value-sync`) reasons |
| Rendering / DOM construction / ARIA | **Platform (component)** | `_renderOptions`, `_syncComboboxAccessibility`, accessibility effects | consumes engine state as the source of truth |

### 2.2 Single authority: engine

`_state.selectedIndices` and `_state.selectedItems` are **derived**, not
authoritative. The only writes to them are inside
`_syncLegacySelectionFromEngine()` (component), which copies from
`this._engine.state.selectedKeys`. There are **no other mutation sites** — verified
by grep for all assignments/adds/deletes to `_state.selectedIndices`/
`_state.selectedItems` (single write site, `_syncLegacySelectionFromEngine`).

A dev-time guard `_assertSelectionProjection(context)` throws if the projection
diverges from `_engine.state.selectedKeys` (non-production). This is the runtime
enforcement of single authority.

### 2.3 State ownership

| State | Owner | Notes |
| --- | --- | --- |
| `_engine.state` (lifecycle, popup, selectedKeys, activeKey, registeredKeys, selection config) | **Engine** (`SelectState`) held by `SelectEngineBridge` | pure, DOM-free |
| `_state.selectedIndices` / `_state.selectedItems` | Derived projection | re-derived from engine on every change; guarded |
| `_state.loadedItems`, rendering, chips, ARIA DOM | Platform component | presentation only |

### 2.4 Dispatch call sites (all selection goes through the engine)

| Component method | Engine event | Reason class |
| --- | --- | --- |
| `_selectOption` (single) | `SELECT_KEY_REQUEST` / `TOGGLE_KEY_REQUEST` | pointer/keyboard |
| `_selectOption` (multi) | `TOGGLE_KEY_REQUEST` | pointer/keyboard |
| `_handleOptionRemove` | `DESELECT_KEY_REQUEST` | pointer |
| `_selectKeyboardRange`/`_selectVisualRange`/`_selectRange`/`_selectAll` | `REPLACE_SELECTION_REQUEST` (via `_requestSelectionReplacement`) | keyboard |
| `clear()` | `CLEAR_SELECTION_REQUEST` | programmatic |
| `setSelectedValues` / initial load | `REPLACE_SELECTION_REQUEST` | external-value-sync |
| item/config changes | `ITEMS_REGISTERED` / `SELECTION_CONFIG_CHANGED` | programmatic |

All route through `_dispatchSelection(event, ctx)` →
`SelectEngineBridge.dispatch` → `transition` → `applySelectionRequest`.

---

## 3. Why no further extraction is safe/needed (the blocker)

- The authority is already a **single** engine-owned path with a dev-time guard.
- The only "duplication" left is **read-only**: `_selectOption`'s `maxSelections`
  pre-check (line ~5616) and existence checks before dispatch. These drive
  **announcements**, not mutations; the engine still makes the final decision.
  Removing them would **change observable behavior** (announcement text) and thus
  violates "without changing the component's observable behavior" — so it must
  NOT be touched.
- Range/visual-order computation is a **platform** concern (DOM/CSS order); it
  correctly delegates the *decision* to the engine. Moving it into the pure engine
  would introduce DOM/visual dependencies, violating the framework-independence
  boundary.
- A structural refactor (e.g., collapsing the projection) is a **wider change**
  than "one bounded transition" and carries regression risk against 1071 green
  tests with no observable-behavior benefit.

**Conclusion:** stop after the harness (per directive) and report the blocker:
*the requested single authority path is already extracted.*

---

## 4. Parity evidence (component vs engine)

### 4.1 Existing parity (pre-existing, retained)

`packages/core/tests/enhanced-select-selection-parity.spec.ts` — 20 tests. Asserts
the component's projection stays in lockstep with its own engine for single/multi
pointer select, deselect, clear, clear-control, mode reconciliation, regroup,
required-clear, programmatic/initial/server-selected, disabled, filter-preserve,
reorder, replacement, duplicate-key rejection, keyboard range, select-all, removal,
and **event ordering** (`select` before `change`, then callbacks).

Gap: those tests compare *component state* to *the same component's engine state*
(internal consistency). They do not compute expected selection with an
independent oracle.

### 4.2 New oracle parity (added)

`packages/core/tests/enhanced-select-selection-engine-oracle.spec.ts` — 8 tests.
Each drives the component through its **public surface** (DOM click / public API)
and computes the expected selection **independently** with the pure engine
(`applySelectionRequest`) from the pre-action selected set.

**W1-P2-T1-R (finding T1-F01) correction:** the result assertion no longer reads
the component's private `_engine` field. It asserts the component's **public
observable** selection — `getSelectedValues()` and `getSelectedItems()` — matches
the result implied by the oracle's selected keys. The oracle still operates on
**selection keys** (`'a'`,`'b'`,`'c'`,`'remote'`); the observable results are
**display values** (`'APL'`,`'BAN'`,`'CHR'`,`'REMOTE'`) and **items**. Keys and
values are deliberately distinct in the fixtures, so a key/value mix-up fails.

| # | Path | Oracle keys | `getSelectedValues()` (observable) | `getSelectedItems()` | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | single select (`select`) | `['b']` | `['BAN']` | `[b:Banana]` | PASS |
| 2 | multi toggle ×2 | `['a','c']` | `['APL','CHR']` | `[a:Apple, c:Cherry]` | PASS |
| 3 | multi toggle same key twice | `[]` | `[]` | `[]` | PASS |
| 4 | maxSelections=2, 3 clicks | `['a','b']` | `['APL','BAN']` | `[a:Apple, b:Banana]` | PASS |
| 5 | allowDeselect single, click-click | `[]` | `[]` | `[]` | PASS |
| 6 | required single, toggle last | `['a']` | `['APL']` | `[a:Apple]` | PASS |
| 7 | replace disables selected key | `[]` (replace drops disabled) | `[]` | `[]` | PASS |
| 8 | detached key via setSelectedValues | `['remote']` | `['REMOTE']` | `[remote:Remote item]` | PASS |

Ordering note (verified empirically): `getSelectedValues()`/`getSelectedItems()`
iterate the engine's `selectedKeys` in insertion order (see `_getSelectedEntries`),
matching the oracle's key array order, so exact-order array assertions are sound.

Note (characterized): engine policy treats `replace` and `deselect` differently
for disabled keys — `replace`/`normalizeKeys` **drops** disabled keys, while an
explicit `deselect` of an already-disabled selected key is **refused** (preserved).
Test 7 pins the `replace` behavior.

### 4.3 Framework independence (added)

`packages/core/tests/w1-p2-t1-engine-framework-independence.spec.node.ts` — 4 tests,
real Node (`// @vitest-environment node`), no DOM:

| # | Assertion | Status |
| --- | --- | --- |
| 1 | `document`/`window`/`HTMLElement` all `undefined` | PASS |
| 2 | `applySelectionRequest` = pure Set math, no DOM | PASS |
| 3 | `transition` drives selection, emits `SELECTION_CHANGED`, no DOM | PASS |
| 4 | full multi-select sequence via `transition`, no browser globals | PASS |

Source audit: `packages/core/src/engine/**` has **zero** references to
`document`/`window`/`HTMLElement`/`navigator` (only `process.env` for the
duplicate-key policy, which is Node-safe).

---

## 5. Boundaries observed

| Boundary | Result |
| --- | --- |
| No production source changed | Yes — `packages/core/src/**` untouched vs `b3fb070` (see §6). |
| No competing component+engine mutation | Yes — single engine authority; projection guarded; only read-only pre-checks remain. |
| Programmatic vs interaction events preserved | Yes — `reason` threaded (`pointer`/`keyboard`/`programmatic`/`external-value-sync`); existing event-ordering test unchanged and green. |
| No contract classification upgraded | Yes — no ledger/matrix change; 129 records, 77/36/13/3 unchanged. |
| No browser globals in headless engine | Yes — proven by §4.3 + source audit. |
| Missing contracts + residuals unchanged | Yes — API-054 / EVENT-005 / CONFIG-023 and all residuals untouched. |
| API-065 / API-075 neither concealed nor worsened | Yes — no source change; both remain open limitations. |

---

## 6. Validation gates

| Gate | Command | Result |
| --- | --- | --- |
| Oracle parity | `vitest run --config packages/core/vitest.config.ts .../enhanced-select-selection-engine-oracle.spec.ts` | 8 passed |
| Full core (jsdom) | `vitest run --config packages/core/vitest.config.ts` | **1071 passed \| 1 skipped** (71 files) |
| Node SSR | `vitest run --config packages/core/vitest.ssr.config.ts` | **10 passed** (6 T3 + 4 framework-independence) |
| TypeScript | `tsc -p packages/core/tsconfig.json --noEmit` | new files clean; 44 pre-existing errors (unchanged vs `b3fb070`) |
| ESLint | `eslint <new files> vitest.ssr.config.ts` | exit 0 (clean) |
| Traceability | `python3 docs/architecture/baseline/w1-p1/verify_traceability.py` | PASS — 129 IDs, unique, locators in bounds |

> Node SSR count grew 6 → 10 because the framework-independence spec (4 tests) is
> added to the isolated Node project (`vitest.ssr.config.ts`). The core jsdom suite
> grew 1063 → 1071 (+8 oracle tests). The new Node spec ends in `.spec.node.ts`
> and is included ONLY by `vitest.ssr.config.ts`, so the jsdom suite never picks it
> up (verified).

---

## 7. Operational note (recovery, disclosed)

During this task a `git stash pop` attempt accidentally applied an unrelated
older-branch WIP stash (`wip-before-t5-r`, from `w1-p0-baseline`) onto the working
tree, introducing merge-conflict markers into several `package*.json` files that
were NOT related to this task. This was immediately detected (config failed to
load) and **fully recovered** by restoring those files to their committed
`b3fb070` state (`git checkout HEAD -- <files>`). The W1-P2-T1 deliverable does not
touch any `package*.json`; the recovery restored them to HEAD. No package files are
part of this task's commit. The pre-existing stash is preserved.

---

_End of W1-P2 Task 1 evidence. Characterization + parity only. No production source
changed. The requested selection authority path is already engine-owned; the task
stops after the compatibility harness and reports this as the blocker, per the
authorized directive's stop condition._
