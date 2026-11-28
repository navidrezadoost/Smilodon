import { defineConfig, devices } from '@playwright/test';

/**
 * S5-Q — Playwright config for the CSR (client-side rendered, non-SSR) Angular
 * qualification. Runs `qualification.spec.ts` against a bare document that
 * bootstraps the CSR bundle entirely in the browser.
 *
 * Runs in real Chromium and Firefox. WebKit is wired for completeness but is
 * EXPECTED to be unavailable on this build host (missing system libraries); when
 * it cannot launch, that is recorded as an environmental coverage limitation —
 * NOT an application defect or an assumed pass. See S5Q evidence.
 *
 * Global setup runs `build-csr.mjs` (ngc AOT + esbuild bundle) so the webServer
 * always serves freshly built output.
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
  testMatch: /qualification\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 60_000,
  reporter: [['list']],
  globalSetup: './global-setup.ts',
  use: {
    baseURL: 'http://localhost:5175',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node csr-server.mjs',
    url: 'http://localhost:5175/',
    reuseExistingServer: false,
    timeout: 60 * 1000,
    env: { CSR_PORT: '5175' },
  },
  projects: [
    {
      name: 'csr-chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath:
            process.env.SMILODON_CHROMIUM_PATH ||
            `${process.env.HOME}/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome`,
        },
      },
    },
    {
      name: 'csr-firefox',
      use: {
        ...devices['Desktop Firefox'],
        launchOptions: {
          executablePath:
            process.env.SMILODON_FIREFOX_PATH ||
            `${process.env.HOME}/.cache/ms-playwright/firefox-1511/firefox/firefox`,
        },
      },
    },
    {
      name: 'csr-webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
