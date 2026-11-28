/**
 * Browser-deferred core loader for @smilodon/angular.
 *
 * The `@smilodon/core` package entry cannot be imported in a no-DOM process:
 * the components extend `HTMLElement` and self-register via an unguarded
 * `customElements.get(...)` at module top-level, which throws under SSR/Node
 * (recorded API-075 Partial). We therefore NEVER statically import core here.
 * Instead we `import()` it lazily, only in the browser, and await the custom
 * element definition before the host component touches the element.
 *
 * This module is the single place that is allowed to reference the core
 * runtime. Everything else must consume it through `ensureEnhancedSelectDefined`.
 */

/**
 * The minimal structural surface of the core module that the adapter needs.
 * Kept structural (not `typeof import('@smilodon/core')`) so this file does
 * not create a *value* import edge to core — the type is erased at build.
 */
interface CoreModule {
  EnhancedSelect: CustomElementConstructor;
}

/** Custom element tag this adapter drives. */
export const ENHANCED_SELECT_TAG = 'enhanced-select' as const;

let loadPromise: Promise<void> | null = null;

/** True when a real browser DOM + Custom Elements registry is present. */
export function isBrowserEnvironment(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    typeof customElements !== 'undefined'
  );
}

/**
 * Ensure `<enhanced-select>` is defined, loading `@smilodon/core` on demand in
 * the browser. Idempotent and cached: concurrent callers share one promise.
 *
 * Rejects (without defining anything) when called outside a browser, so callers
 * can stay safe on the server. If the element is already defined (for example
 * by another Smilodon adapter on the same page) we resolve immediately without
 * loading a second copy of core.
 */
export function ensureEnhancedSelectDefined(): Promise<void> {
  if (!isBrowserEnvironment()) {
    return Promise.reject(
      new Error('@smilodon/angular: enhanced-select can only be loaded in a browser environment'),
    );
  }

  if (customElements.get(ENHANCED_SELECT_TAG)) {
    return Promise.resolve();
  }

  if (loadPromise) {
    return loadPromise;
  }

  // Dynamic import is intentionally browser-guarded above; bundlers keep this
  // as a runtime chunk so SSR bundles never evaluate the core entry.
  loadPromise = import('@smilodon/core')
    .then((module) => {
      const core = module as unknown as CoreModule;
      if (!customElements.get(ENHANCED_SELECT_TAG)) {
        customElements.define(ENHANCED_SELECT_TAG, core.EnhancedSelect);
      }
      return customElements.whenDefined(ENHANCED_SELECT_TAG);
    })
    .then(() => undefined)
    .catch((error) => {
      // Allow a later retry after a transient failure.
      loadPromise = null;
      throw error;
    });

  return loadPromise;
}
