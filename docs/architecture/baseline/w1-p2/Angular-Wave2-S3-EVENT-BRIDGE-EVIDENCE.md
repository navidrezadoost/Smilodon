# Angular Wave 2 — S3 Typed Event Bridge: Evidence

**Increment:** Angular Wave 2 — **S3 (typed event-output bridge)**
**Starting commit:** `b22e9595b2b4e9a8dae046d8aafb38e57c3ef87c` (S2/S2-R/S2-R2 CLOSED)
**Branch:** `codex/w1-p1-3-keyboard-characterization`
**Authorized scope (Lead S3 directive):** a single bounded increment exposing the
element's `CustomEvent` contract through typed Angular `@Output()`s — no second
event state machine, single-listener authority, lifecycle correctness, preserved
event semantics, no controlled-value feedback loop, Angular packaging intact.

> No `ControlValueAccessor` (S4), no forms validation, no SSR hydration
> certification, no core refactor, no API-065/API-075 remediation. No peer-range
> change.

---

## 0. What S3 changes

| File | Change |
| --- | --- |
| `packages/angular/src/events.ts` | **New** — single source of truth: `SMILODON_SELECT_EVENT_NAMES` (wire names), `SmilodonSelectEventName`, `SmilodonSelectOutputs` payload map. Core referenced **type-only**. |
| `packages/angular/src/select.component.ts` | 12 typed `@Output()`s; `attachEventListeners()` (installed before init) + `detachEventListeners()` (on destroy); `emitEvent()` forwarder; `stopPropagation` at element boundary (single-delivery guard). |
| `packages/angular/src/index.ts` | Export `SMILODON_SELECT_EVENT_NAMES`, `SmilodonSelectEventName`, `SmilodonSelectOutputs`; re-export `EmptyStateChangeDetail`, `ErrorEventDetail`, `PageLoadedEventDetail` (type-only). |
| `packages/angular/tests/events.spec.ts` | **New** — 10 focused S3 tests (payload parity, ordering, programmatic-vs-interaction, single-listener, destruction cleanup, double-delivery guard, alias). |
| `packages/angular/tests/ssr-import-safety.ssr.spec.ts` | +1 test — `events.ts` import-safe on the server (type-only core). |
| `packages/angular/tests/consumer/consumer-app.component.ts` | Subscribe to `(change)`; record last payload. |
| `packages/angular/tests/consumer/run-consumer.mjs` | +2 assertions — initial and interaction `change` delivered to the AOT consumer; expose `Element`/`MouseEvent` globals. |
| `packages/angular/README.md` | Outputs table, `error` alias note, event-bridge guarantees, lifecycle/tests. |

Diff: `+325 / −21` across 6 tracked files, plus 2 new files
(`events.ts`, `events.spec.ts`). `@smilodon/core` remains external; only the
browser-deferred dynamic import reaches it at runtime.

---

## 1. Typed outputs — exact names + payload parity (PASS)

The bridge forwards the element's own `CustomEvent.detail` **verbatim**; the
output value **is** the core detail object (payload identity — asserted in
`events.spec.ts` via reference equality against the object placed on the
element's event). Output **names equal the wire names** — no aliasing — for 11
of 12 outputs. The single exception (`error`) is documented and justified below.

`SMILODON_SELECT_EVENT_NAMES` (12, matching `SelectCapabilitiesReport.events.emitted`):
`select`, `change`, `open`, `close`, `search`, `loadMore`, `remove`, `clear`,
`pageLoaded`, `error`, `emptyStateChange`, `diagnostic`.

### Documented alias — `error` → `coreError`

**Aliased output:** yes (one). **Justification:** the component already exposes
`@Input() error` (a validation-message `string`). A class member cannot be both
a `string` input and an `EventEmitter`; the TypeScript compiler rejects the
duplicate. The output is therefore declared `@Output('error') readonly coreError`
— property name `coreError`, **binding/public name `error`**, payload
`ErrorEventDetail` unchanged. Consumers write `(error)="onError($event)"` and
receive the untouched core detail. No other output is aliased.

`pageLoaded` note: it is a member of `SelectEventsDetailMap` but
`enhanced-select` does not currently `_emit('pageLoaded')` (no dispatch site in
core). The output is exposed for contract completeness; it simply never fires
until core emits it. Documented, not a defect.

## 2. Single-listener authority (PASS — with double-delivery fix)

Listeners are registered **once** per component instance on its own
`<enhanced-select>` element (`attachEventListeners()` is idempotent via
`eventBindings.length > 0` guard). Exactly one `addEventListener('change')` per
mount is asserted (`events.spec.ts`).

**Critical finding during S3 verification:** the consumer run initially revealed
**double delivery** — because the element's events are `bubbles:true, composed:true`
and several names collide with native DOM event names, Angular binds a template
`(change)` on the host to **both** the `@Output()` **and** a native bubbling DOM
`change` listener. The consumer's handler received the raw `CustomEvent` (no
`selectedValues`) in addition to the correct `detail`. Fixed by calling
`event.stopPropagation()` at the element boundary inside the bridge handler so
the `@Output()` is the only delivery path. A regression test
(`stops native bubbling so an event cannot be delivered twice`) asserts a wrapper
listener sees nothing while the output fires once. **Negative control:** removing
`stopPropagation` makes that test fail (1 failed); restoring it passes.

## 3. Lifecycle correctness (PASS)

- `ngAfterViewInit` → `attachEventListeners()` runs **before** `initialize()`, so
  events emitted during initialization (e.g. the `change` from applying an
  initial controlled `value`) are captured. Asserted: a `change` fired during init
  reaches subscribers; a `change` listener is registered synchronously at
  view-init.
- `ngOnDestroy` → `detachEventListeners()` removes **every** captured listener
  (exact function references). Asserted: one `removeEventListener('change')`, and
  no delivery after teardown (both by listener removal and a `destroyed` guard).
- A destroyed component never attaches listeners (`attachEventListeners` returns
  early when `destroyed`).

## 4. Event semantics (PASS)

- **Ordering preserved:** `select` then `change` forwarded in dispatch order
  (asserted `['select','change']`).
- **Payload identity:** the forwarded value is the same object as
  `CustomEvent.detail`.
- **Programmatic vs interaction:** both are forwarded. A programmatic
  `change` (from `element.setSelectedValues()` called directly) is forwarded but
  the component does **not** write it back into the `value` input (asserted:
  `cmp.value` is unchanged — no feedback loop). Interaction-driven events
  (`open`/`select`/`change`/`close`) forward through the same single path.

## 5. Angular packaging (PASS)

- ng-packagr partial compilation unchanged; build succeeds; FESM has **no static
  `@smilodon/core` import** (verified by grep).
- `events.ts` references core **type-only**, so the SSR import-safety discipline
  is preserved (new SSR test imports `events.ts` in a no-DOM process).
- Real AOT consumer subscribes to `(change)` and receives **both** the initial
  change and a subsequent interaction change — end-to-end through the built
  partial artifact (9/9 consumer assertions).

---

## 6. Acceptance gates (all PASS)

| # | Criterion | Command | Result |
| --- | --- | --- | --- |
| R1 | Angular jsdom suite | `vitest run --config packages/angular/vitest.config.ts` | **PASS** — 36 (22 component + 10 events + 4 loader) |
| R2 | Angular SSR import-safety | `vitest run --config packages/angular/vitest.ssr.config.ts` | **PASS** — 4 (was 3; +1 events module) |
| R3 | Real AOT consumer (output subscription) | `node packages/angular/tests/consumer/run-consumer.mjs` | **PASS** — 9/9 |
| R4 | ng-packagr build | `npm run build:angular` | **PASS** — exit 0; no static core import |
| R5 | Angular TSC clean | `tsc -p packages/angular/tsconfig.json --noEmit` | **PASS** — exit 0 |
| R6 | Core jsdom regression | `vitest run --config packages/core/vitest.config.ts` | **PASS** — 1071 passed \| 1 skipped (71 files) |
| R7 | Core SSR regression | `vitest run --config packages/core/vitest.ssr.config.ts` | **PASS** — 10 |
| R8 | Core TSC regression | `tsc -p packages/core/tsconfig.json --noEmit` | **PASS** — 44 pre-existing, none angular |
| R9 | ESLint | `eslint packages/angular/{src,tests}` | **PASS** — exit 0 |
| R10 | Traceability | `verify_traceability.py` | **PASS** — 129/129 reconcile |

S2 tests preserved unchanged (22 in `select.component.spec.ts`). No new
regressions.

## 7. Non-goals (explicitly NOT in S3)

No `ControlValueAccessor` (S4); no Angular forms validation; no SSR
rendering/hydration certification (S5); no core refactor; no API-065/API-075
remediation; no peer-range change; no re-emission/state-machine duplication.

## 8. Disclosed limitations (carried forward + S3-specific)

- 44 pre-existing `@smilodon/core` TSC errors (none angular) — unchanged.
- Peer range `>=21 <22` (unchanged; peer expansion DEFERRED per Lead).
- Pre-existing unrelated contract-suite failures (`test:contracts`) — unchanged.
- `pageLoaded` output exposed but core does not currently emit `pageLoaded`
  (no dispatch site) — contract completeness, documented above.
- `error` output uses the documented `coreError` property/`error` binding alias.

---

_End of S3 evidence. Typed event bridge with exact names, verbatim payloads,
single-listener authority (double-delivery fixed via stopPropagation), lifecycle
correctness, no feedback loop, and end-to-end AOT output subscription. No core or
packaging change._
