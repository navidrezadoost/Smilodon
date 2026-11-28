import { defineConfig, devices } from '@playwright/test';

/**
 * S5-V2 — Playwright config for REAL-browser hydration verification of the
 * Angular SSR/hydration fixture (independent of the cross-framework e2e config).
 *
 * Scope: loads the server-rendered HTML + client hydration bundle and runs
 * `hydration.spec.ts` in Chromium and Firefox. WebKit is configured but
 * EXPECTED to be unavailable on this host (missing system libraries:
 * libicu74/libxml2/libflite1, requiring `sudo playwright install-deps`). When
 * WebKit cannot launch, its project fails to launch — that environmental failure
 * is recorded as "unverified-due-to-environmental-limitations" in the S5-V
 * evidence, NOT as an application defect. See S5V-VERIFICATION-EVIDENCE.md.
 *
 * Global setup runs `build-fixture.mjs` (ngc server+client AOT, server render,
 * client esbuild bundle) so the webServer always serves freshly built output.
 */
const localProxyBypass = ['localhost', '127.0.0.1', '::1'];
const existingProxyBypass = [process.env.NO_PROXY, process.env.no_proxy]
  .filter(Boolean)
  .flatMap((value) => value!.split(','));
const noProxy = [...new Set([...existingProxyBypass, ...localProxyBypass])].join(',');
process.env.NO_PROXY = noProxy;
process.env.no_proxy = noProxy;

export default defineConfig({
  testDir: '.',
  testMatch: /hydration\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 60_000,
  reporter: [['list']],
  globalSetup: './global-setup.ts',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node hydrate-server.mjs',
    url: 'http://localhost:5174/',
    reuseExistingServer: false,
    timeout: 60 * 1000,
    env: { SSR_HYDRATE_PORT: '5174' },
  },
  projects: [
    {
      name: 'ssr-hydration-chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use the full Chromium build matching the installed 1248 binaries
        // (the default headless-shell expects a different revision on this host).
        launchOptions: {
          executablePath:
            process.env.SMILODON_CHROMIUM_PATH ||
            `${process.env.HOME}/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome`,
        },
      },
    },
    {
      name: 'ssr-hydration-firefox',
      use: {
        ...devices['Desktop Firefox'],
        launchOptions: {
          executablePath:
            process.env.SMILODON_FIREFOX_PATH ||
            `${process.env.HOME}/.cache/ms-playwright/firefox-1511/firefox/firefox`,
        },
      },
    },
    // WebKit project exists for completeness; on this host it cannot launch
    // (missing system libs). Teammates/CI with `playwright install-deps` can run
    // it. It is NOT part of the passing gate here — see evidence doc.
    {
      name: 'ssr-hydration-webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
