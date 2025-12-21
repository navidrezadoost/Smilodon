import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    name: 'contracts',
    include: ['tests/contracts/**/*.contract.spec.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/e2e/**',
    ],
    environment: 'jsdom',
    globals: true,
    setupFiles: [resolve(__dirname, './setup.ts')],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['packages/*/src/**'],
      exclude: [
        '**/node_modules/**',
        '**/tests/**',
        '**/*.spec.ts',
        '**/*.d.ts',
      ],
    },
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@smilodon/react': resolve(__dirname, '../../packages/react/dist/index.js'),
      '@smilodon/vue': resolve(__dirname, '../../packages/vue/dist/index.js'),
      '@smilodon/svelte': resolve(__dirname, '../../packages/svelte/dist/index.mjs'),
      '@smilodon/vanilla': resolve(__dirname, '../../packages/vanilla/dist/index.mjs'),
      '@smilodon/core': resolve(__dirname, '../../packages/core/src/index.ts'),
    },
  },
});
