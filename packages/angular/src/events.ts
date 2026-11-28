/**
 * @smilodon/angular — typed event bridge contract (S3).
 *
 * The `<enhanced-select>` custom element (driven by `@smilodon/core`) emits a
 * fixed set of bubbling, composed `CustomEvent`s — one per selection/interaction
 * behavior. This module is the SINGLE source of truth mapping those core event
 * names to the Angular `@Output()` payload types the `SmilodonSelectComponent`
 * exposes.
 *
 * Design principles (S3 directive):
 *  1. **No second state machine.** The bridge forwards the element's own
 *     `CustomEvent`s verbatim — the element detail (`event.detail`) IS the output
 *     payload. No reinterpretation, no re-derivation, no aliasing of names.
 *  2. **Type-only core coupling.** Every reference to `@smilodon/core` here is a
 *     `import type` / `export type`. Type imports are erased at build time, so
 *     this module adds NO runtime value edge to core and preserves the API-075
 *     SSR import-safety that S1/S2 established. The mapping table below is a
 *     plain `const` string array — it never touches core at runtime.
 *  3. **Exact names.** `SMILODON_SELECT_EVENT_NAMES` uses the element's wire
 *     names unchanged (`select`, `change`, `emptyStateChange`, …). The bridge
 *     does not rename events; the only deviation is at the component's
 *     TypeScript member level: the `error` output's property is `coreError`
 *     (because `@Input() error` owns the `error` identifier) but its binding
 *     name is the wire name `error`. See `select.component.ts` and the S3
 *     evidence for the documented justification.
 *
 * @packageDocumentation
 */

// ── Event-detail payload types (TYPE-ONLY import from core) ───────────────────
// These are the exact shapes the element places in `CustomEvent.detail`. The
// Angular outputs are typed with them directly, so a consumer subscribing to
// `(change)` receives a `ChangeEventDetail` with full field fidelity. Imported
// (not re-exported) so `SmilodonSelectOutputs` below can reference them; the
// public entry re-exports the ones consumers need from `@smilodon/core` directly.
import type {
  SelectEventDetail,
  ChangeEventDetail,
  SearchEventDetail,
  LoadMoreEventDetail,
  ClearEventDetail,
  OpenEventDetail,
  CloseEventDetail,
  RemoveEventDetail,
  DiagnosticEventDetail,
  EmptyStateChangeDetail,
  ErrorEventDetail,
  PageLoadedEventDetail,
} from '@smilodon/core';

// ── Wire-event names (exact, unchanged from the element) ──────────────────────
/**
 * The element's emitted event names, in the order they are documented by core
 * (`SelectCapabilitiesReport.events.emitted`). These are the literal
 * `CustomEvent` `type`s the adapter listens for — NOT altered.
 *
 * `diagnostic` is included: it is emitted only when core tracking has
 * `emitDiagnostics` enabled, but it is a first-class member of
 * `SelectEventsDetailMap`, so the bridge forwards it like the rest.
 */
export const SMILODON_SELECT_EVENT_NAMES = [
  'select',
  'change',
  'open',
  'close',
  'search',
  'loadMore',
  'remove',
  'clear',
  'pageLoaded',
  'error',
  'emptyStateChange',
  'diagnostic',
] as const;

/** Union of the forwarded event names. */
export type SmilodonSelectEventName = (typeof SMILODON_SELECT_EVENT_NAMES)[number];

/**
 * Typed map from Angular `@Output()` name → payload type. The output names are
 * IDENTICAL to the wire names (no aliasing). This interface exists so the
 * component's `@Output()` declarations and consumer subscriptions share one
 * authoritative type source.
 */
export interface SmilodonSelectOutputs {
  select: SelectEventDetail;
  change: ChangeEventDetail;
  open: OpenEventDetail;
  close: CloseEventDetail;
  search: SearchEventDetail;
  loadMore: LoadMoreEventDetail;
  remove: RemoveEventDetail;
  clear: ClearEventDetail;
  pageLoaded: PageLoadedEventDetail;
  error: ErrorEventDetail;
  emptyStateChange: EmptyStateChangeDetail;
  diagnostic: DiagnosticEventDetail;
}
