import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'phase-4-browser-benchmark.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60 * 60 * 1000,
  expect: { timeout: 30_000 },
  outputDir: '../../test-results/performance/playwright-artifacts',
  reporter: [
    ['list'],
    ['json', { outputFile: '../../test-results/performance/playwright-results.json' }],
  ],
  use: {
    ...devices['Desktop Chrome'],
    headless: true,
    viewport: { width: 1280, height: 800 },
    // The benchmark creates and closes isolated contexts per attempt, so it
    // owns tracing directly and writes one trace per failed attempt.
    trace: 'off',
    screenshot: 'only-on-failure',
    launchOptions: process.env.PHASE4_BENCHMARK_EXECUTABLE_PATH
      ? { executablePath: process.env.PHASE4_BENCHMARK_EXECUTABLE_PATH }
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
