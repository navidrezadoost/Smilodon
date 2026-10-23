import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'phase-4-end-key-attribution.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60 * 60 * 1000,
  expect: { timeout: 30_000 },
  outputDir: '../../test-results/performance/end-key-attribution-playwright',
  reporter: [
    ['list'],
    ['json', { outputFile: '../../test-results/performance/end-key-attribution-playwright/results.json' }],
  ],
  use: {
    ...devices['Desktop Chrome'],
    headless: true,
    viewport: { width: 1280, height: 800 },
    trace: 'off',
    screenshot: 'off',
    launchOptions: process.env.PHASE4_ENDKEY_EXECUTABLE_PATH
      ? { executablePath: process.env.PHASE4_ENDKEY_EXECUTABLE_PATH }
      : undefined,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev:vanilla -w @smilodon/playground',
    url: 'http://localhost:5173/vanilla-demo.html',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
