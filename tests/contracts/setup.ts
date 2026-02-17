/**
 * Contract Test Setup
 * 
 * Global test configuration for all contract tests
 */

import { afterEach, vi } from 'vitest';

// JSDOM does not implement scrollIntoView
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}

// Suppress console errors/warnings during tests unless debugging
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    error: () => {},
    warn: () => {},
  };
}

// Clean up after each test
afterEach(() => {
  // Clean up DOM
  document.body.innerHTML = '';
});
