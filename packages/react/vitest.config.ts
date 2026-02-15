import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    // Use core setup for now as it polyfills custom elements
    setupFiles: [resolve(__dirname, '../core/tests/setup.ts')],
    include: ['packages/react/tests/**/*.spec.tsx'],
  },
});
