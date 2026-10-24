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
      '**/tests/e2e/**',
      '**/tests/contracts/**',
    ],
  },
});
