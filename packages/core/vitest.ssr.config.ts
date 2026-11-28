import { defineConfig } from 'vitest/config';

/**
 * Isolated real-Node project for W1-P1.6 Task 3 (SSR import-time safety).
 *
 * This project intentionally differs from `vitest.config.ts`:
 *  - `environment: 'node'` — a genuine Node process with NO `document` /
 *    `window` / `HTMLElement`.
 *  - NO `setupFiles` — the shared `tests/setup.ts` imports the web components,
 *    which `extend HTMLElement` at class-declaration time and therefore throw
 *    `ReferenceError: HTMLElement is not defined` when imported without a DOM.
 *    Running that setup here would mask the very behavior we must observe.
 *
 * Only the SSR spec is included. The main package config EXCLUDES this spec so
 * the jsdom suite never picks it up. Run it with:
 *   npx vitest run --config packages/core/vitest.ssr.config.ts
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['packages/core/tests/w1-p1-6-t3-ssr-import-safety.spec.ts'],
  },
});
