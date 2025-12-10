import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  
  // Reporting
  reporter: [
    ['html', { outputFolder: './playwright-report' }],
    ['list'],
  ],
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.spec\.ts/,
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /.*\.spec\.ts/,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: /.*\.spec\.ts/,
    },
  ],
  
  // Web server for vanilla demo
  webServer: {
    command: 'npm run dev:vanilla -w @smilodon/playground',
    url: 'http://localhost:5173/vanilla-demo.html',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
