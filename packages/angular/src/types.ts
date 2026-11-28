/**
 * Adapter-owned types and metadata for @smilodon/angular (S1 scaffold).
 *
 * This module is intentionally free of any `@angular/*` or `@smilodon/core`
 * runtime import. It contains only:
 *   - a framework-neutral item type the adapter will accept, and
 *   - a frozen descriptor identifying the adapter (used by S2+ and by tests to
 *     assert the package shape without importing Angular or core).
 *
 * Keeping this module dependency-free means the S1 runtime bundle has no
 * value import of `@smilodon/core` (see src/index.ts and the S1 gate).
 */

/**
 * Item shape accepted by the Angular adapter.
 *
 * Framework-neutral and structurally compatible with the plain-object items the
 * `enhanced-select` custom element consumes via `setItems()`. `value`/`label`
 * are the user-facing identity; any extra metadata is passed through unchanged
 * (the element reads item metadata, including `group`/`disabled`, directly).
 */
export interface SmilodonSelectItem {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
  [key: string]: unknown;
}

/**
 * Static descriptor of the Angular adapter.
 *
 * Deliberately a plain frozen object (no getters, no imports) so it can be
 * read from a pure-Node context without triggering the API-075 import throw.
 */
export interface SmilodonAngularAdapterInfo {
  /** Package name published to npm. */
  readonly packageName: '@smilodon/angular';
  /** Adapter delivery model: a thin host over the native custom element. */
  readonly integration: 'custom-element';
  /** Angular execution model targeted by the adapter. */
  readonly framework: 'angular';
  /** Scoped-rule: runtime core loading is deferred to the browser (S2+). */
  readonly coreLoading: 'browser-deferred';
  /** Wave 2 implementation phase this scaffold corresponds to. */
  readonly stage: 'S1-scaffold';
}

/**
 * Frozen adapter descriptor. Safe to import in any environment (no runtime
 * dependency on Angular or the core web components).
 */
export const SMILODON_ANGULAR_ADAPTER: SmilodonAngularAdapterInfo = Object.freeze({
  packageName: '@smilodon/angular',
  integration: 'custom-element',
  framework: 'angular',
  coreLoading: 'browser-deferred',
  stage: 'S1-scaffold',
} as const);
