/**
 * S5-V2 — Playwright global setup: build the SSR/hydration fixture once before
 * the webServer starts serving it. Runs `build-fixture.mjs` (ngc server+client
 * AOT, server render, client esbuild bundle) synchronously.
 *
 * This also fails fast with a clear message if the fixture cannot be built, so
 * environmental/build breakages are distinguished from application defects.
 */
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export default function globalSetup(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  // eslint-disable-next-line no-console
  console.log('[ssr-hydration global-setup] building fixture via build-fixture.mjs …');
  execFileSync(process.execPath, [join(here, 'build-fixture.mjs')], {
    cwd: here,
    stdio: 'inherit',
  });
}
