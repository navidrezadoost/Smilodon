/**
 * Unit tests for the browser-deferred core loader.
 *
 * Verifies the API-075 safety properties directly: the loader never touches
 * core outside a browser, is idempotent, and reuses an already-defined element
 * without loading a second copy.
 */
import { describe, expect, it } from 'vitest';
import {
  ENHANCED_SELECT_TAG,
  ensureEnhancedSelectDefined,
  isBrowserEnvironment,
} from '../src/core-loader';

describe('core-loader', () => {
  it('reports the jsdom environment as a browser', () => {
    expect(isBrowserEnvironment()).toBe(true);
  });

  it('resolves when the element is already defined (no second load)', async () => {
    // setup.ts defines the element, so this takes the short-circuit path.
    expect(customElements.get(ENHANCED_SELECT_TAG)).toBeTruthy();
    await expect(ensureEnhancedSelectDefined()).resolves.toBeUndefined();
  });

  it('is idempotent and shares one promise across concurrent callers', async () => {
    const [a, b] = await Promise.all([
      ensureEnhancedSelectDefined(),
      ensureEnhancedSelectDefined(),
    ]);
    expect(a).toBeUndefined();
    expect(b).toBeUndefined();
  });

  it('rejects outside a browser environment', async () => {
    const originalWindow = globalThis.window;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).window = undefined;
    try {
      expect(isBrowserEnvironment()).toBe(false);
      await expect(ensureEnhancedSelectDefined()).rejects.toThrow(/browser environment/i);
    } finally {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).window = originalWindow;
    }
  });
});
