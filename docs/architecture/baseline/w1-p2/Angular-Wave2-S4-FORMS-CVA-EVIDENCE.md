# Angular Wave 2 — S4 Forms Integration (ControlValueAccessor): Evidence

**Increment:** Angular Wave 2 — **S4 (Angular forms / `ControlValueAccessor`)**
**Starting commit:** `e9ecd45c1dd78525df9b7fb0da6dd02af7fac444` (S3 CLOSED, pushed)
**Branch:** `codex/w1-p1-3-keyboard-characterization`
**Authorized scope (Lead S4 directive):** implement `ControlValueAccessor`
(`writeValue`, `registerOnChange`, `registerOnTouched`, `setDisabledState`),
integrate reactive + template-driven forms with NO separate selection authority,
call `onChange` for GENUINE user-driven selection changes only, mark touched on a
user focus-loss boundary, reconcile `setDisabledState` with the `disabled` input,
and prove it through a real compiled Angular consumer. Preserve the S3 event
bridge + cleanup and the browser-deferred loading. One atomic commit.

> No SSR rendering/hydration certification (S5), no core refactor, no
> API-065/API-075 remediation, no core event-contract change.

---

## 0. The central problem: provenance of a `change`

The Lead's highest-risk watchpoint: **core's `change` event cannot by itself be
interpreted as a user edit.** Verified in core:

- `EnhancedSelect._emitChange()` fires `change` with `{selectedItems,
  selectedValues, selectedIndices}` on BOTH interaction AND programmatic
  (`setSelectedValues`, `clear`, config-driven pruning) paths.
- Core DOES track a `SelectionReason` (`'pointer' | 'keyboard' |
  'programmatic' | 'form-reset' | 'external-value-sync'`) but it is **private**:
  it reaches only `_effectRunner` via the internal `SELECTION_CHANGED` effect. It
  is **not** in the change payload, not on the DOM, and not on any callback.

Therefore **an out-of-tree adapter cannot read core's reason**, and exposing it
would be a core change (out of S4 scope). S4 establishes provenance **in the
adapter**, from the DOM, without touching core:

- **Capture-phase user-gesture probes** on the element's shadow root(s): a click
  on an option / chip-remove / clear button, or a selection key
  (`Enter`/`Space`/`a`) while the listbox is open, increments a monotonic
  `currentUserSeq`. (Probes are capture-phase listeners on the shadow root — they
  add **no** new `change` listener and do not alter the S3 single-listener
  authority.)
- **Programmatic windows** wrap every adapter-initiated `setSelectedValues`
  (`init`/`write`), setting `origin = 'programmatic'`.
- **Classification** (`provenance.ts` `classifyChange` + the synchronous
  programmatic-window adjudication in `handleChangeForValueAccessor`): a `change`
  is a USER edit **iff** the origin is `'user'` **and** a gesture occurred after
  the last consumed one (`currentUserSeq > lastUserSeq`). Everything else is
  programmatic. One user gesture → at most one classified user edit (the gesture
  sequence is consumed), so a gesture that emits several events (e.g. select-all:
  one keydown → `select` + `change`) is reported once.

The pure decision function is unit-tested independently of Angular/DOM
(`provenance.spec.ts`, 6 tests).

## 1. What S4 changes

| File | Change |
| --- | --- |
| `packages/angular/src/provenance.ts` | **New** — pure provenance model: `classifyChange`, `ChangeProvenance`, `ChangeOrigin`, `SELECTION_KEYS`. No Angular/core imports. |
| `packages/angular/src/select.component.ts` | `implements ControlValueAccessor`; `NG_VALUE_ACCESSOR` provider (`forwardRef`); `writeValue`/`registerOnChange`/`registerOnTouched`/`setDisabledState`; DOM-gesture provenance probes; `handleChangeForValueAccessor`; reconciled disabled state; form-control precedence over `[value]`. |
| `packages/angular/tests/provenance.spec.ts` | **New** — 6 pure-model tests. |
| `packages/angular/tests/control-value-accessor.spec.ts` | **New** — 14 focused accessor tests against the real element (no form directive). |
| `packages/angular/tests/consumer/consumer-app.component.ts` | Extended to a real forms consumer: `[formControl]`, `formControlName` in a `FormGroup`, `[(ngModel)]`, and a non-form `[value]`+(change) select. |
| `packages/angular/tests/consumer/run-consumer.mjs` | +16 assertions — form write→element (no echo), user edit→model exactly once, touched, single/multi representation, plus the S3 output check. |
| `packages/angular/tests/setup.ssr.ts` | **New** — SSR-only setup: loads `@angular/compiler` so the partial-compiled `@angular/*` FESMs pulled by `@angular/forms` can JIT-fallback (no DOM/core). |
| `packages/angular/vitest.ssr.config.ts` | Wire `setup.ssr.ts`. |
| `packages/angular/package.json` | `@angular/forms` added as a **non-optional peer** (`>=21.0.0 <22.0.0`) + dev dependency. |
| `package-lock.json` | Manual merge of the `@angular/forms` node + the angular devDep (preserves optional `lightningcss*` peers). |

`@smilodon/core` remains reachable **only** via the browser-guarded dynamic
`import('@smilodon/core')`; the built FESM has **no static core import** and
imports `@angular/forms` as a proper external (verified by grep).

---

## 2. ControlValueAccessor semantics (PASS)

### `writeValue` — never echoes (HIGHEST-RISK item)
- Marks the component form-controlled and records the literal model value; applies
  it through the **same** controlled path as `[value]` (so `undefined`/`null`/`[]`
  semantics are identical: `undefined` = no-op, `null`/`[]` = clear, array/scalar
  = select).
- **Never** calls `onChange` (the change it produces is classified programmatic).
  Asserted: `writeValue(['b'])` applies but `changes === []`; a value applied
  during init also produces no `onChange`; the AOT consumer proves the reactive
  `valueChanges` receives **zero** entries from init `writeValue`.
- `writeValue(undefined)` is a hard no-op — it neither clears nor queues a
  trailing empty apply (which would race and win over a deferred real value).

### `onChange` — genuine user edits only, exactly once
- Fired only when the provenance model classifies the `change` as a USER edit.
- Representation: **single → scalar** (`string | number | null`), **multi →
  array** (`[]` when empty) — the identical representation to `[value]`,
  documented on the `value` input and in `README.md`.
- AOT consumer asserts exactly one `valueChanges` per user click, with the
  correct representation, for `FormControl`, `formControlName`, and `ngModel`.

### `onTouched` — user focus-loss boundary only
- `markTouched()` (which calls `onTouched`) runs inside the user-edit branch of
  `handleChangeForValueAccessor` — i.e. only for a genuine user edit. NEVER on
  init render or `writeValue`.
- Asserted: touched on a user click; NOT touched on init / `writeValue`. AOT
  consumer asserts `control.touched === true` after a user edit for all three
  form mechanisms.

### `setDisabledState` — reconciled, single config write
- Maintains a single derived state: `disabled = formDisabled || disabledInput`
  (form-driven state wins while form-controlled). Applied via ONE
  `updateConfig()` (no competing second write).
- Asserted: `setDisabledState(true/false)` toggles `_config.enabled`; an initial
  disabled control sets `input.disabled`; toggling disabled does NOT emit
  `onChange`.

## 3. Selection authority — no second authority (PASS)

- The form model and the `[value]` input are two writers of the SAME thing and
  never both own selection:
  - While form-controlled (`writeValue` seen), the **form model is the single
    source of truth**; `[value]` is ignored for reconciliation (asserted: a later
    `[value]` change is ignored).
  - Standalone (no `writeValue` ever), `[value]` behaves exactly as in S2/S3.
- User edits report the element's **authoritative** selection
  (`getSelectedValues()`), never a re-derived copy, so the form and the element
  cannot disagree.
- No feedback loop: `[value]` is never written back from a forwarded `change`.

## 4. S3 boundary preserved (PASS)

- Classification runs **inside the existing `change` listener, before**
  `stopPropagation()`/emit — no new event-listener ownership, no new `change`
  subscription. The provenance probes are capture-phase `click`/`keydown`
  listeners on the shadow root, not `change` listeners.
- The event bridge, single-delivery guard, and destroy-cleanup are unchanged; the
  S3 tests remain green (22 component + 10 events).

## 5. Packaging + SSR (PASS)

- ng-packagr partial compilation unchanged; build succeeds; FESM: no static
  `@smilodon/core` import (only the dynamic one), `@angular/forms` external.
- The `@angular/forms` import transitively pulls `@angular/common`'s partial FESM;
  the SSR import-safety spec originally failed with a spurious "needs JIT compiler"
  Linker error unrelated to this spec's contract. Fixed by loading
  `@angular/compiler` in an SSR-only setup (`setup.ssr.ts`) so the Linker can
  JIT-fallback. This defines NO DOM global and does NOT import core — the spec's
  `assertNoDom()` guard and "core is not evaluated" evidence still hold (4/4 SSR).

---

## 6. Acceptance gates (all PASS)

| # | Criterion | Command | Result |
| --- | --- | --- | --- |
| R1 | Angular jsdom suite | `vitest run --config packages/angular/vitest.config.ts` | **PASS** — 56 (22 component + 10 events + 4 loader + 6 provenance + 14 CVA) |
| R2 | Angular SSR import-safety | `vitest run --config packages/angular/vitest.ssr.config.ts` | **PASS** — 4 |
| R3 | Real AOT consumer (forms) | `node packages/angular/tests/consumer/run-consumer.mjs` | **PASS** — 25/25 |
| R4 | ng-packagr build | `npm run build:angular` | **PASS** — exit 0; no static core import; forms external |
| R5 | Angular TSC clean | `tsc -p packages/angular/tsconfig.json --noEmit` | **PASS** — exit 0 |
| R6 | Core jsdom regression | `vitest run --config packages/core/vitest.config.ts` | **PASS** — 1071 passed \| 1 skipped (71 files) |
| R7 | Core SSR regression | `vitest run --config packages/core/vitest.ssr.config.ts` | **PASS** — 10 |
| R8 | Core TSC regression | `tsc -p packages/core/tsconfig.json --noEmit` | **PASS** — 44 pre-existing, none angular |
| R9 | ESLint | `eslint packages/angular/src packages/angular/tests` | **PASS** — exit 0 |
| R10 | Traceability | `verify_traceability.py` | **PASS** — 129/129 reconcile |

S2/S3 tests preserved unchanged (22 component + 10 events + 4 loader). No new
regressions.

## 7. AOT consumer evidence (the Lead-mandated "real form" proof)

`run-consumer.mjs` bootstraps an AOT-compiled component using the BUILT partial
artifact and asserts (25 checks, all pass):

- Init `writeValue` reaches the element for `FormControl('b')`,
  `FormGroup.multi(['a'])`, and `ngModel('c')` — WITHOUT echoing into the model
  (`valueChanges` length 0 for the reactive control).
- A real option click updates `FormControl.value` → `'a'` with **exactly one**
  `valueChanges` and `touched === true`.
- A real option click accumulates `FormGroup.multi` to `['a','b']` and marks it
  touched.
- A real option click sets `ngModel` to `'a'` and marks the `NgModel` control
  touched.
- The non-form `[value]`+(change) select still forwards interaction changes.

## 8. Disclosed limitations

- Evidence is by DOM-gesture provenance (clicks + selection keys while open). A
  keyboard selection that mutates selection WITHOUT one of those gestures (e.g. a
  home/end/typeahead path that selects without `Enter`/`Space`/`a`) would be
  classified programmatic. The gesture set covers the core interaction paths
  exercised (pointer click, `Enter`/`Space`/`a`, chip-remove, clear); a full
  keyboard-reason mapping would require exposing core's `SelectionReason` (a core
  change, out of S4 scope).
- 44 pre-existing `@smilodon/core` TSC errors (none angular) — unchanged.
- Peer range `>=21 <22` (unchanged; forms added within that range).
- Pre-existing unrelated contract-suite failures (`test:contracts`) — unchanged.

---

_End of S4 evidence. ControlValueAccessor with DOM-gesture provenance: `writeValue`
never echoes, `onChange` fires only for genuine user edits (exactly once, correct
single=scalar / multi=array representation), `onTouched` only at a user edit
boundary, disabled reconciled in a single config write, single selection authority
(form model wins over `[value]`), S3 boundary + packaging + browser-deferred
loading all preserved, proven through a real AOT forms consumer._
