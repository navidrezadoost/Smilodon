import { defineConfig } from '@playwright/test';

const existingProxyBypass = [process.env.NO_PROXY, process.env.no_proxy]
  .filter(Boolean)
  .flatMap((value) => value!.split(','));
const localProxyBypass = ['localhost', '127.0.0.1', '::1'];
const noProxy = [...new Set([...existingProxyBypass, ...localProxyBypass])].join(',');
process.env.NO_PROXY = noProxy;
process.env.no_proxy = noProxy;

const browserName = process.env.SMILODON_PLAYWRIGHT_BROWSER === 'firefox'
  ? 'firefox'
  : process.env.SMILODON_PLAYWRIGHT_BROWSER === 'webkit'
    ? 'webkit'
    : 'chromium';
const executablePath = browserName === 'firefox'
  ? process.env.PLAYWRIGHT_FIREFOX_EXECUTABLE_PATH
  : browserName === 'webkit'
    ? process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE_PATH
    : process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: './scenarios',
  testMatch: /(?:selected-options-(?:adapter-(?:parity|lifecycle)|grouped-order|keyboard-order|open-scroll-policies|virtualization)|selected-target-order)\.spec\.ts/,
  fullyParallel: false,
  reporter: 'list',
  use: {
    browserName,
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  webServer: [
    {
      command: 'npm run dev:react -w @smilodon/playground',
      cwd: '../..',
      url: 'http://localhost:5173/vanilla-demo.html',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npm run dev:adapter-parity --workspace @smilodon/playground',
      cwd: '../..',
      url: 'http://localhost:5178/adapter-config-qualification.html',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
