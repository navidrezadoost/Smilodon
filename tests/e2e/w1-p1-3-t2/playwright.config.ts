import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

// Local Playwright web-server probes must not be sent through the developer's
// outbound HTTP proxy; proxy responses can make an unopened port look ready.
const localProxyBypass = ['localhost', '127.0.0.1', '::1'];
const existingProxyBypass = [process.env.NO_PROXY, process.env.no_proxy]
  .filter(Boolean)
  .flatMap((value) => value!.split(','));
const noProxy = [...new Set([...existingProxyBypass, ...localProxyBypass])].join(',');
process.env.NO_PROXY = noProxy;
process.env.no_proxy = noProxy;

/**
 * W1-P1.3 Task 2 — Real-Browser Keyboard and Accessibility Verification.
 *
 * Deterministic Chromium-only harness. The repo pins @playwright/test 1.59.1,
 * whose default Chromium build (revision 1217) is not downloadable in this
 * environment (geo-restricted CDN). The cache already carries a full Chrome
 * for Testing build (chromium-1248); we point Playwright at it explicitly so
 * the run is reproducible and the browser version is recorded in evidence.
 *
 * Override with SMILODON_T2_CHROMIUM=/abs/path/to/chrome if needed.
 */
const DEFAULT_CHROMIUM = join(
  homedir(),
  '.cache/ms-playwright/chromium-1248/chrome-linux64/chrome',
);
const executablePath = process.env.SMILODON_T2_CHROMIUM
  ?? (existsSync(DEFAULT_CHROMIUM) ? DEFAULT_CHROMIUM : undefined);

export default defineConfig({
  testDir: '.',
  testMatch: /.*\.t2\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/w1-p1-3-t2/results.json' }],
  ],
  use: {
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev:vanilla -w @smilodon/playground',
    url: 'http://localhost:5173/vanilla-demo.html',
    reuseExistingServer: true,
    timeout: 120 * 1000,
    env: { NO_PROXY: noProxy, no_proxy: noProxy },
  },
});
