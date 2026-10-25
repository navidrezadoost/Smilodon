import { defineConfig, devices } from '@playwright/test';

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
 * Cross-Framework E2E Testing Configuration
 * 
 * This configuration runs the same test scenarios across all framework implementations
 * to ensure consistent behavior and catch framework-specific regressions.
 */

export default defineConfig({
  testDir: './scenarios',
  
  // Test execution
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Reporting
  reporter: [
    ['html', { outputFolder: '../../playwright-report/frameworks' }],
    ['json', { outputFile: '../../test-results/e2e/results.json' }],
    ['junit', { outputFile: '../../test-results/e2e/junit.xml' }],
    process.env.CI ? ['github'] : ['list'],
  ],
  
  // Global test configuration
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  // Framework-specific test projects
  projects: [
    // React
    {
      name: 'react-chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.spec\.ts/,
      grep: /@react|@all/,
    },
    {
      name: 'react-firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /.*\.spec\.ts/,
      grep: /@react|@all/,
    },
    {
      name: 'react-webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: /.*\.spec\.ts/,
      grep: /@react|@all/,
    },
    // Real React adapter certification fixture (not the shared Vanilla demo).
    ...(['chromium', 'firefox', 'webkit'] as const).map((browserName) => ({
      name: `react-adapter-${browserName}`,
      use: { ...devices[
        browserName === 'chromium'
          ? 'Desktop Chrome'
          : browserName === 'firefox'
            ? 'Desktop Firefox'
            : 'Desktop Safari'
      ] },
      testMatch: /.*react-adapter\.spec\.ts/,
      grep: /@react-adapter/,
    })),
    
    // Vue
    {
      name: 'vue-chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.spec\.ts/,
      grep: /@vue|@all/,
    },
    {
      name: 'vue-firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /.*\.spec\.ts/,
      grep: /@vue|@all/,
    },
    
    // Svelte
    {
      name: 'svelte-chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.spec\.ts/,
      grep: /@svelte|@all/,
    },
    {
      name: 'svelte-firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /.*\.spec\.ts/,
      grep: /@svelte|@all/,
    },
    
    // Angular
    {
      name: 'angular-chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.spec\.ts/,
      grep: /@angular|@all/,
    },
    {
      name: 'angular-firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /.*\.spec\.ts/,
      grep: /@angular|@all/,
    },
    
    // Vanilla
    {
      name: 'vanilla-chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.spec\.ts/,
      grep: /@vanilla|@all/,
    },
    {
      name: 'vanilla-firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /.*\.spec\.ts/,
      grep: /@vanilla|@all/,
    },
    
    // Mobile testing (critical paths only)
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
      testMatch: /.*\.spec\.ts/,
      grep: /@mobile|@critical/,
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: /.*\.spec\.ts/,
      grep: /@mobile|@critical/,
    },
  ],
  
  // Web server configuration for local testing
  webServer: [
    {
      // The React playground's Vite root serves both the shared Vanilla demo
      // and the dedicated React adapter fixture from one deterministic server.
      command: 'npm run dev:react -w @smilodon/playground',
      cwd: '../..',
      url: 'http://localhost:5173/vanilla-demo.html',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});
