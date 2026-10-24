import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['packages/core/tests/data-loading/**/*.spec.ts'],
  },
});
