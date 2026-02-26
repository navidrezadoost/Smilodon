import { chromium, firefox, webkit } from 'playwright';

const targets = [
  { name: 'chromium', launcher: chromium },
  { name: 'firefox', launcher: firefox },
  { name: 'webkit', launcher: webkit },
];

const results = [];

for (const target of targets) {
  try {
    const browser = await target.launcher.launch({ headless: true });
    await browser.close();
    results.push({ name: target.name, ok: true });
  } catch (error) {
    results.push({
      name: target.name,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

const failed = results.filter((item) => !item.ok);

if (failed.length === 0) {
  console.log('Playwright preflight passed: all browser engines are launchable.');
  process.exit(0);
}

console.error('Playwright preflight failed: one or more browser engines are unavailable.');
for (const item of failed) {
  console.error(`- ${item.name}: ${item.error}`);
}

console.error('\nHow to fix:');
console.error('1) Try: npm run playwright:install');
console.error('2) If downloads are geo-blocked, set PLAYWRIGHT_DOWNLOAD_HOST to an accessible mirror and retry.');
console.error('3) Or run E2E in Docker: mcr.microsoft.com/playwright and execute npm run test:e2e:critical inside container.');

process.exit(1);
