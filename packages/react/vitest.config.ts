import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [
      resolve(__dirname, '../core/tests/setup.ts'),
      resolve(__dirname, './tests/setup.ts'),
    ],
    include: ['packages/react/tests/**/*.spec.tsx'],
    onConsoleLog(log) {
      if (
        log.includes('An update to Root inside a test was not wrapped in act(...)') ||
        log.includes('Attempted to synchronously unmount a root while React was already rendering')
      ) {
        return false;
      }
    },
  },
});
