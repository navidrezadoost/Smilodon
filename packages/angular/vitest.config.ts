import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

// S2 integration-test configuration for @smilodon/angular.
//
// - jsdom provides a real DOM + Custom Elements registry so the browser-
//   deferred loader can define and drive `<enhanced-select>` from real core.
// - esbuild is told to use legacy (Angular) decorators + emit metadata so the
//   `@Component`/`@Input` decorators compile the way Angular expects.
// - The setup file imports `@angular/compiler` (JIT) before any partially
//   compiled `@angular/*` package is evaluated, and defines the element.
export default defineConfig({
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        useDefineForClassFields: false,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [resolve(__dirname, './tests/setup.ts')],
    include: ['packages/angular/tests/**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', 'packages/angular/tests/**/*.ssr.spec.ts'],
  },
  resolve: {
    alias: {
      '@smilodon/core': resolve(__dirname, '../core/src/index.ts'),
    },
  },
});
