/**
 * @smilodon/angular — Angular Wave 2 adapter (S1 scaffold).
 *
 * S1 establishes only the package foundation and the PUBLIC TYPE SURFACE that
 * the browser-deferred standalone adapter (S2) will consume. There is no
 * Angular component, directive, ControlValueAccessor, event bridge, or runtime
 * behavior in S1.
 *
 * SSR / import-safety note (discipline enforced from S1):
 * every re-export of `@smilodon/core` here is TYPE-ONLY (`export type`). Type
 * imports are erased at build time, so the emitted runtime chunk contains NO
 * `require`/`import` of `@smilodon/core`. This is what lets S2 add runtime
 * loading via a browser-guarded dynamic `import('@smilodon/core')` without a
 * static top-level import that would re-introduce the API-075 SSR import throw.
 *
 * Do NOT add a value import of `@smilodon/core` to this entry (or any S1 file).
 *
 * @packageDocumentation
 */

// ── Public type surface (type-only; erased at build → no runtime core import) ──
export type {
  // Item / data model
  GroupedItem,
  // Core event detail shapes (mirrored to Angular `@Output()` payloads in S3)
  SelectEventDetail,
  ChangeEventDetail,
  SearchEventDetail,
  LoadMoreEventDetail,
  ClearEventDetail,
  OpenEventDetail,
  CloseEventDetail,
  RemoveEventDetail,
  DiagnosticEventDetail,
  // Terminal empty-state context (mirrored to a renderer/slot in S2+)
  EmptyStateContext,
  // Per-instance configuration passed through `updateConfig()` in S2
  SelectInstanceConfig,
} from '@smilodon/core';

// ── Adapter-owned types (no Angular, no core runtime) ─────────────────────────
export type {
  SmilodonSelectItem,
  SmilodonAngularAdapterInfo,
} from './types.js';
export { SMILODON_ANGULAR_ADAPTER } from './types.js';

// ── S2: browser-deferred standalone component (CSR) ───────────────────────────
// The component itself has NO static value import of `@smilodon/core`; core is
// loaded on demand in the browser via `core-loader.ts`. Importing this entry on
// the server is therefore side-effect-free (API-075 safe).
export { SmilodonSelectComponent } from './select.component.js';
export {
  ENHANCED_SELECT_TAG,
  ensureEnhancedSelectDefined,
  isBrowserEnvironment,
} from './core-loader.js';
