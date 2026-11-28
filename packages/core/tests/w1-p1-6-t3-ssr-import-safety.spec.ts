// @vitest-environment node
/**
 * W1-P1.6 Task 3 — SSR / import-time safety characterization.
 *
 * Runs in a GENUINE Node process (no `document`, no `window`, no `HTMLElement`).
 * This file is EXCLUDED from `vitest.config.ts` (which injects jsdom + the DOM
 * `setup.ts`) and is executed by `vitest.ssr.config.ts` instead. See that
 * config for why the shared setup cannot run here.
 *
 * Contracts (plan §2.3): API-075 (import-time safety), API-076 (deferred DOM
 * access). Public surface only — the package entry `../src/index.js` and, to
 * characterize *which* modules are import-safe, the two utility modules it
 * re-exports (`../src/utils/security.js`, `../src/utils/csp-styles.js`). No
 * `as any`, no private access, no fabricated globals, no jsdom substitute.
 *
 * IMPORTANT (plan §7 boundary #7): a caught import-time browser-access
 * exception is NOT evidence of SSR safety. Where the import throws, the test
 * RECORDS the failure as a limitation — it does not claim safety. Coverage
 * classification for these contracts reflects the OBSERVED behavior.
 *
 * Environment guard: every test calls `assertNoDom()` immediately BEFORE each
 * dynamic import, asserting `typeof document === 'undefined'`,
 * `typeof window === 'undefined'`, and `typeof HTMLElement === 'undefined'`, so
 * the no-DOM precondition is proven (not assumed) at each import site. No DOM
 * globals are fabricated or deleted to make assertions pass.
 */
import { describe, expect, it } from 'vitest';

/**
 * Assert the genuine no-DOM precondition. Called immediately before every
 * dynamic import so each import is guarded at its own call site.
 */
function assertNoDom(): void {
  expect(typeof document).toBe('undefined');
  expect(typeof window).toBe('undefined');
  expect(typeof HTMLElement).toBe('undefined');
}

/** Dynamically import a module, capturing success or the thrown error. */
type ImportResult = {
  ok: boolean;
  error?: Error;
  // Public module namespace; accessed via named members only (no `any`, no
  // private access). Callers narrow to the specific public shape they use.
  module?: Record<string, unknown>;
};

/** The public shape of `utils/security.ts` members exercised here. */
type SecurityModule = {
  escapeHTML: (s: string) => string;
  sanitizeHTML: (s: string) => string;
  createElement: (tag: string) => unknown;
  escapeAttribute: (s: string) => string;
  containsSuspiciousPatterns: (s: string) => boolean;
};

/** The public shape of `utils/csp-styles.ts` members exercised here. */
type CspStylesModule = {
  applyClasses: (el: { className: string }, classes: string[]) => void;
  hasOverflowHiddenAncestor: (el: { parentElement: unknown }) => boolean;
  shadowDOMStyles: string;
  defaultTheme: Record<string, string>;
};

async function importModule(specifier: string): Promise<ImportResult> {
  // The no-DOM precondition is asserted by callers immediately before this.
  try {
    const module = (await import(/* @vite-ignore */ specifier)) as Record<string, unknown>;
    return { ok: true, module };
  } catch (error) {
    return { ok: false, error: error as Error };
  }
}

/**
 * API-075 — Import-time safety.
 *
 * OBSERVED: the pure utility modules (`utils/security.ts`, `utils/csp-styles.ts`)
 * import without touching `document`/`window` at module-evaluation time. BUT
 * the package ENTRY (`src/index.ts`) re-exports the web components, whose class
 * declarations `extend HTMLElement` — evaluated at import — and therefore THROW
 * (`ReferenceError: HTMLElement is not defined`) in a no-DOM process. The
 * package entry is thus NOT import-safe for bare Node today; this is recorded
 * as a limitation (contract coverage Partial), not claimed as safe.
 */
describe('API-075: import-time safety (no-DOM Node)', () => {
  it('API-075: runs without document/window before any import (precondition)', () => {
    // Proven, not assumed: no DOM is present in this project.
    assertNoDom();
  });

  it('API-075: the security utility module imports without a DOM (no top-level browser access)', async () => {
    assertNoDom();
    const result = await importModule('../src/utils/security.js');
    expect(result.ok).toBe(true);
    expect(result.error).toBeUndefined();
    // A representative export is present and callable-shaped.
    const security = result.module as SecurityModule;
    expect(typeof security.escapeHTML).toBe('function');
    expect(typeof security.sanitizeHTML).toBe('function');
  });

  it('API-075: the csp-styles utility module imports without a DOM (no top-level browser access)', async () => {
    assertNoDom();
    const result = await importModule('../src/utils/csp-styles.js');
    expect(result.ok).toBe(true);
    expect(result.error).toBeUndefined();
    const csp = result.module as CspStylesModule;
    expect(typeof csp.applyClasses).toBe('function');
    // Static data (no DOM) is available immediately at import.
    expect(typeof csp.shadowDOMStyles).toBe('string');
    expect(csp.defaultTheme).toBeTypeOf('object');
  });

  it('API-075: the package ENTRY import THROWS in no-DOM Node (limitation recorded, not claimed safe)', async () => {
    assertNoDom();
    const result = await importModule('../src/index.js');
    // The entry re-exports web components that `extend HTMLElement` at
    // class-declaration time; without a DOM the import fails observably.
    expect(result.ok).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
    // The failure is a ReferenceError on the missing DOM global (HTMLElement),
    // i.e. a genuine import-time browser dependency — NOT a silent success.
    expect(result.error?.name).toBe('ReferenceError');
    expect(String(result.error?.message)).toMatch(/HTMLElement|document|customElements/);
  });
});

/**
 * API-076 — Deferred DOM access.
 *
 * OBSERVED: DOM-dependent functions access `document`/`getComputedStyle` at
 * CALL time, not import time. Importing the utility modules succeeds (see
 * API-075); invoking a DOM-dependent helper in this no-DOM process throws a
 * `ReferenceError` (document is not defined) at the call, while non-DOM
 * helpers and duck-typed element operations work normally.
 */
describe('API-076: DOM access is deferred to call time (not import time)', () => {
  it('API-076: DOM-dependent helpers throw ReferenceError at CALL time (deferred, not import)', async () => {
    // Import succeeds (deferred) — proven by .ok === true ...
    assertNoDom();
    const security = await importModule('../src/utils/security.js');
    expect(security.ok).toBe(true);
    const sec = security.module as SecurityModule;
    // ... yet CALLING a document-dependent helper fails observably at call time.
    expect(() => sec.escapeHTML('<b>x</b>')).toThrow(ReferenceError);
    expect(() => sec.createElement('div')).toThrow(/document is not defined/);
  });

  it('API-076: non-DOM helpers operate normally in a no-DOM process (facilities they need are present)', async () => {
    assertNoDom();
    const security = await importModule('../src/utils/security.js');
    assertNoDom();
    const csp = await importModule('../src/utils/csp-styles.js');
    expect(security.ok && csp.ok).toBe(true);
    const sec = security.module as SecurityModule;
    const styles = csp.module as CspStylesModule;
    // Pure string/logic helpers need no DOM and work here.
    expect(sec.escapeAttribute('a"b')).toContain('&quot;');
    expect(sec.containsSuspiciousPatterns('<script>alert(1)</script>')).toBe(true);
    // Static styling data structures are usable without a DOM.
    expect(Object.keys(styles.defaultTheme)).toHaveLength(13);
    // Duck-typed element operations (caller-supplied object) need no global DOM.
    const fakeEl = { className: '', style: { setProperty: () => {} } };
    expect(() => styles.applyClasses(fakeEl, ['a', 'b'])).not.toThrow();
    expect(fakeEl.className).toBe('a b');
    // A parentless duck-typed node yields false without touching any global DOM.
    expect(styles.hasOverflowHiddenAncestor({ parentElement: null })).toBe(false);
  });
});
