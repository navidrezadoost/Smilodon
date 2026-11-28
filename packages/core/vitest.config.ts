import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [resolve(__dirname, './tests/setup.ts')],
    include: ['packages/core/tests/**/*.spec.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'packages/core/tests/data-loading/**/*.spec.ts',
      // SSR import-time safety runs in an isolated real-Node project WITHOUT
      // the jsdom/`setup.ts` (which imports web components that extend
      // HTMLElement and throw at import in a no-DOM process). Run it with
      // `packages/core/vitest.ssr.config.ts` instead.
      'packages/core/tests/w1-p1-6-t3-ssr-import-safety.spec.ts',
      '**/tests/e2e/**',
      '**/tests/contracts/**',
    ],
  },
});
