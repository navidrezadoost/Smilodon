/**
 * @smilodon/angular — selection-change provenance (S4).
 *
 * ## The problem S4 must solve
 *
 * The `<enhanced-select>` element emits a `change` `CustomEvent` for EVERY
 * selection mutation, whether it came from the user (a pointer click on an
 * option, a keyboard selection, removing a chip, clicking the clear control) or
 * from code (applying an initial `value`, a parent writing the Angular form
 * model, or the adapter reconciling an input). The payload is
 * `{ selectedItems, selectedValues, selectedIndices }` — it does NOT carry the
 * reason.
 *
 * A `ControlValueAccessor` must call `onChange` ONLY for GENUINE user edits. If
 * the adapter forwarded every `change` to `onChange`, `writeValue()`/init would
 * echo straight back into the form model — a feedback loop, and a spurious
 * "value changed" on a pristine control. So the adapter needs a reliable way to
 * tell the two apart.
 *
 * ## Why core's internal reason is not reachable here
 *
 * Inside core every mutation flows through the engine as a `SelectionReason`
 * (`packages/core/src/engine/selection-policy.ts`): `pointer`, `keyboard`,
 * `programmatic`, `form-reset`, `external-value-sync`. That reason reaches only
 * core's private `_effectRunner` (`SELECTION_CHANGED` effect); it is NOT exposed
 * on the DOM, on a public callback, or on the `change` payload. An out-of-tree
 * adapter therefore cannot read it. (Exposing it is a core change and is
 * explicitly out of S4 scope per the directive.)
 *
 * ## The provenance model (established by the adapter)
 *
 * The adapter establishes provenance from the DOM, in two layers that combine
 * into a single origin per selection sync:
 *
 *  1. **User-gesture probes** (capture-phase `click`/`keydown` listeners on the
 *     element's shadow root) bump a monotonic user-gesture sequence
 *     (`currentUserSeq`) for every gesture that CAN mutate selection (an option
 *     click, a chip-remove click, a clear-control click, or a selection key while
 *     the listbox is open).
 *
 *  2. **A `change` sentinel** (a delegated, non-bubbling listener on the host)
 *     consumes a pending gesture when a `change` lands: it records that gesture
 *     as consumed (`lastUserSeq`).
 *
 * A `change` is a **user edit** iff a user gesture was observed AFTER the last
 * consumed one (`currentUserSeq > lastUserSeq`). Programmatic applications
 * (writeValue / init / reconcile) happen with NO pending gesture, so
 * `currentUserSeq === lastUserSeq` → `programmatic`. This model naturally handles
 * (a) a single gesture emitting several events (select-all: one keydown →
 * `select` + `change`), and (b) stale gestures that produced no selection change
 * (an arrow key that only moved the active option), because only the gesture
 * immediately preceding the change is consumed.
 *
 * The user-initiated **clear control** is a special case: core's
 * `_handleClearControlClick` calls `clear()` with reason `programmatic`, but the
 * action IS a user click. The clear-control click is a tracked gesture, so the
 * standard model already classifies it as a user edit — no special-casing needed.
 *
 * ## Pure, testable core
 *
 * This module contains NO Angular and NO core runtime import — only the
 * classification logic. It is unit-tested directly (`provenance.spec.ts`) and
 * consumed by `select.component.ts`.
 *
 * @packageDocumentation
 */

/**
 * Keys that perform a selection while the listbox is open. A `keydown` on one of
 * these, with the popup open, is a user gesture that can mutate the selection.
 * (Escape/Arrow keys only move or close and are excluded.)
 */
export const SELECTION_KEYS: ReadonlySet<string> = new Set([
  'Enter',
  ' ',
  'Spacebar', // legacy browsers
  'a', // Ctrl/Cmd+A select-all
]);

/** The provenance facts observed for one `change`. */
export interface ChangeProvenance {
  /** Most recent user-gesture sequence observed (`0` = none yet). */
  userInputSeq: number;
  /** The gesture sequence already consumed by a prior `change`. */
  lastUserSeq: number;
  /**
   * True while the adapter is applying a controlled value programmatically
   * (writeValue / init / reconcile). A hard veto — never a user edit.
   */
  programmaticApplication?: boolean;
}

/** The classified origin of a `change` event. */
export type ChangeOrigin = 'user' | 'programmatic';

/**
 * Classify a `change` as a user edit or a programmatic mutation.
 *
 * Rules (in order):
 *   1. Inside a programmatic application → `programmatic` (hard veto).
 *   2. A user gesture occurred after the last consumed gesture
 *      (`userInputSeq > lastUserSeq`) → `user`.
 *   3. Otherwise → `programmatic` (safe default: suppression).
 *
 * The default is suppression because wrongly forwarding a programmatic change to
 * `onChange` corrupts the form model, whereas wrongly suppressing a user change
 * merely delays a write the user caused (recoverable).
 */
export function classifyChange(provenance: ChangeProvenance): ChangeOrigin {
  if (provenance.programmaticApplication) {
    return 'programmatic';
  }
  if (provenance.userInputSeq > provenance.lastUserSeq) {
    return 'user';
  }
  return 'programmatic';
}
