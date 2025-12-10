/**
 * Contract Test Setup
 * 
 * Global test configuration for all contract tests
 */

import { afterEach } from 'vitest';

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
