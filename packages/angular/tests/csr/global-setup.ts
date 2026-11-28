/**
 * S5-Q — Playwright global setup for the CSR qualification fixture: build the
 * CSR bundle once before the webServer starts serving it. Runs `build-csr.mjs`
 * (ngc AOT + esbuild) synchronously and fails fast with a clear message on a
 * build breakage, distinguishing environmental/build issues from app defects.
 */
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export default function globalSetup(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  // eslint-disable-next-line no-console
  console.log('[csr global-setup] building CSR fixture via build-csr.mjs …');
  execFileSync(process.execPath, [join(here, 'build-csr.mjs')], {
    cwd: here,
    stdio: 'inherit',
  });
}
