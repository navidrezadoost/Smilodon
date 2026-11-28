// @vitest-environment node
/**
 * S2 — API-075 import-safety for `@smilodon/angular`.
 *
 * Runs in a GENUINE Node process (no `document`, `window`, `HTMLElement`, or
 * `customElements`). Excluded from the jsdom suite; run via
 * `vitest.ssr.config.ts`.
 *
 * Contract proven here:
 *   Importing the package ENTRY must NOT evaluate `@smilodon/core`. Core's entry
 *   does `class EnhancedSelect extends HTMLElement` + an unguarded
 *   `customElements.get(...)` at module top-level, which throws under no-DOM
 *   (recorded API-075 Partial). The Angular adapter must therefore only reach
 *   core through a browser-guarded dynamic `import()` (see `core-loader.ts`).
 *
 * If the entry (or the component module) ever acquired a static value import of
 * `@smilodon/core`, the dynamic `import()` below would throw — so a clean import
 * here is direct evidence of the discipline holding.
 */
import { describe, expect, it } from 'vitest';

function assertNoDom(): void {
  expect(typeof document).toBe('undefined');
  expect(typeof window).toBe('undefined');
  expect(typeof HTMLElement).toBe('undefined');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expect(typeof (globalThis as any).customElements).toBe('undefined');
}

describe('@smilodon/angular — SSR import safety (API-075)', () => {
  it('imports the package ENTRY without a DOM and without evaluating core', async () => {
    assertNoDom();
    // A static core import inside the entry would throw here.
    const mod = await import('../src/index.js');
    expect(mod).toBeTruthy();
    // Public surface is present (component class, loader, adapter descriptor).
    expect(typeof mod.SmilodonSelectComponent).toBe('function');
    expect(typeof mod.ensureEnhancedSelectDefined).toBe('function');
    expect(mod.ENHANCED_SELECT_TAG).toBe('enhanced-select');
    expect(mod.SMILODON_ANGULAR_ADAPTER).toBeTruthy();
    // Still no DOM: importing the entry must not have created any globals.
    assertNoDom();
  });

  it('the component module is import-safe on the server', async () => {
    assertNoDom();
    const mod = await import('../src/select.component.js');
    expect(typeof mod.SmilodonSelectComponent).toBe('function');
    assertNoDom();
  });

  it('the core-loader reports a non-browser environment and refuses to load core', async () => {
    assertNoDom();
    const loader = await import('../src/core-loader.js');
    expect(loader.isBrowserEnvironment()).toBe(false);
    await expect(loader.ensureEnhancedSelectDefined()).rejects.toThrow(/browser environment/i);
    // Refusing to load must not have evaluated the core entry.
    assertNoDom();
  });
});
