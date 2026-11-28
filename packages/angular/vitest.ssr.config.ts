import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

/**
 * Isolated real-Node project for S2 SSR import-safety.
 *
 * Mirrors `packages/core/vitest.ssr.config.ts`:
 *  - `environment: 'node'` — a genuine Node process with NO `document` /
 *    `window` / `HTMLElement` / `customElements`.
 *  - NO jsdom setup. The point is to prove that importing the @smilodon/angular
 *    entry does NOT evaluate `@smilodon/core` (which throws on import without a
 *    DOM — API-075). The core must only be reachable through the browser-guarded
 *    dynamic `import()` inside `core-loader.ts`.
 *  - `setup.ssr.ts` loads `@angular/compiler` so the partially compiled
 *    `@angular/*` library FESMs (pulled in transparently by the S4
 *    `@angular/forms` import) can JIT-fallback. It defines NO DOM global and does
 *    NOT import core, so the spec's no-DOM / no-core evidence still holds.
 *
 * Run with: `npx vitest run --config packages/angular/vitest.ssr.config.ts`.
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: [resolve(__dirname, './tests/setup.ssr.ts')],
    include: ['packages/angular/tests/**/*.ssr.spec.ts'],
  },
  resolve: {
    alias: {
      '@smilodon/core': resolve(__dirname, '../core/src/index.ts'),
    },
  },
});
