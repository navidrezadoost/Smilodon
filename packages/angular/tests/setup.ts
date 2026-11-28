/**
 * Test setup for @smilodon/angular integration tests.
 *
 * 1. Load the Angular JIT compiler FIRST. `@angular/core` and `@angular/common`
 *    ship partially compiled and will throw "needs JIT compiler" if a decorator
 *    factory is touched before `@angular/compiler` is present.
 * 2. Polyfill the handful of browser APIs core needs in jsdom (mirrors the core
 *    test setup) so real `<enhanced-select>` instantiates cleanly.
 * 3. Register the custom element so tests exercise the real element without
 *    relying on the dynamic loader (the loader itself is unit-tested too).
 */
import '@angular/compiler';

// ── Minimal jsdom polyfills (same as packages/core/tests/setup.ts) ─────────────
if (typeof HTMLElement !== 'undefined' && typeof HTMLElement.prototype.scrollIntoView !== 'function') {
  HTMLElement.prototype.scrollIntoView = () => {};
}
if (typeof requestAnimationFrame === 'undefined') {
  (globalThis as Record<string, unknown>).requestAnimationFrame = (cb: () => void) => {
    setTimeout(cb, 16);
    return 0;
  };
  (globalThis as Record<string, unknown>).cancelAnimationFrame = () => {};
}
if (typeof queueMicrotask === 'undefined') {
  (globalThis as Record<string, unknown>).queueMicrotask = (cb: () => void) => Promise.resolve().then(cb);
}
if (typeof URL !== 'undefined' && !URL.createObjectURL) {
  URL.createObjectURL = () => 'blob:mock';
  URL.revokeObjectURL = () => {};
}
if (typeof PerformanceObserver === 'undefined') {
  (globalThis as Record<string, unknown>).PerformanceObserver = class PerformanceObserver {
    constructor(_callback: unknown) {}
    observe(_options: unknown) {}
    disconnect() {}
  };
}

// Register the custom element for the happy-path tests. jsdom has a DOM, so the
// core entry imports cleanly here (the API-075 throw only happens in no-DOM
// Node). Importing core in setup also guarantees the element is defined before
// each spec, so the component's loader resolves immediately.
import { EnhancedSelect } from '@smilodon/core';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}
