import { expect, test } from '@playwright/test';

const fixtureUrl = `${process.env.SMILODON_PLAYGROUND_URL ?? 'http://localhost:5173'}/react-remove-icon-certification.html`;

test('React chip portals survive Core updates and retain target identity when earlier chips are removed @react-adapter', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(fixtureUrl);
  const host = page.locator('enhanced-select');
  await expect.poll(() => host.evaluate((element) => (element as any).getSelectedValues())).toEqual(['one']);

  const iconFor = (label: string) => host.locator(`.selection-badge:has(.selection-badge-label:text-is("${label}")) [part="chip-remove-icon"] svg[data-testid="custom-remove-icon"]`);
  const originalOne = iconFor('One');
  const originalOneInstance = await originalOne.getAttribute('data-instance');
  await host.evaluate((element) => (window as any).__issue97.setSelection(['one', 'two']));
  await expect.poll(() => host.evaluate((element) => (element as any).getSelectedValues())).toEqual(['one', 'two']);
  await expect(originalOne).toHaveAttribute('data-instance', originalOneInstance!);

  const originalTwo = iconFor('Two');
  const originalTwoInstance = await originalTwo.getAttribute('data-instance');
  await host.evaluate((element) => (window as any).__issue97.setSelection(['one', 'two', 'three']));
  await expect.poll(() => host.evaluate((element) => (element as any).getSelectedValues())).toEqual(['one', 'two', 'three']);
  await expect(originalOne).toHaveAttribute('data-instance', originalOneInstance!);
  await expect(originalTwo).toHaveAttribute('data-instance', originalTwoInstance!);

  await host.evaluate((element) => {
    (element as HTMLElement).style.setProperty('--select-badge-exit-animation', 'badgeExit 500ms linear both');
    (window as any).__issue97.setSelection(['two', 'three']);
  });
  await expect(host.locator('.selection-badge[data-motion="exiting"] .selection-badge-label')).toHaveText('One');
  await expect(originalOne).toHaveAttribute('data-instance', originalOneInstance!);
  await host.evaluate((element) => (window as any).__issue97.setSelection(['one', 'two', 'three']));
  await expect(originalOne).toHaveAttribute('data-instance', originalOneInstance!);
  await expect(host.locator('.selection-badge[data-motion="exiting"]')).toHaveCount(0);

  // Removing the first chip shifts every later target's list position. The
  // surviving portal must retain its own component identity rather than an index's.
  await host.evaluate((element) => (window as any).__issue97.setSelection(['two', 'three']));
  await expect.poll(() => host.evaluate((element) => (element as any).getSelectedValues())).toEqual(['two', 'three']);
  await expect(iconFor('Two')).toHaveAttribute('data-instance', originalTwoInstance!);

  expect(pageErrors).toEqual([]);

  await page.locator('#use-string-icon').click();
  await expect(host.locator('.selection-badge [part="chip-remove-icon"] [data-smilodon-fallback-icon]')).toHaveText(['!', '!']);
  await expect(host.locator('.selection-badge [part="chip-remove-icon"] svg[data-testid="custom-remove-icon"]')).toHaveCount(0);
  await page.locator('#use-react-icon').click();
  await expect(host.locator('.selection-badge [part="chip-remove-icon"] svg[data-testid="custom-remove-icon"]')).toHaveCount(2);
  await page.locator('#use-default-icon').click();
  await expect(host.locator('.selection-badge [part="chip-remove-icon"] [data-smilodon-fallback-icon]')).toHaveText(['×', '×']);
  await page.locator('#use-react-icon').click();
  await expect(host.locator('.selection-badge [part="chip-remove-icon"] svg[data-testid="custom-remove-icon"]')).toHaveCount(2);
  expect(pageErrors).toEqual([]);
});

test('React remove icon portals preserve controls, context, updates, and cleanup @react-adapter', async ({ page }) => {
  await page.goto(fixtureUrl);
  const host = page.locator('enhanced-select');
  await expect.poll(() => host.evaluate((element) => (element as any).getSelectedValues())).toEqual(['one']);

  const chipIcon = host.locator('.selection-badge [part="chip-remove-icon"] svg[data-testid="custom-remove-icon"]');
  await expect(chipIcon).toHaveAttribute('data-context', 'preserved-context');
  await expect(chipIcon).toHaveAttribute('data-revision', '1');
  const chipButton = host.locator('.selection-badge [part="chip-remove"]');
  await expect(chipButton).toHaveAttribute('aria-label', 'Remove One');
  await expect(chipButton).toHaveAttribute('type', 'button');

  await page.locator('#update-icon').click();
  await expect(chipIcon).toHaveAttribute('data-revision', '2');
  await host.evaluate((element) => (element as any).open());
  const selectedOption = host.locator('select-option[data-index="0"]');
  const optionIcon = selectedOption.locator('[part="chip-remove-icon"] svg[data-testid="custom-remove-icon"]');
  await expect(optionIcon).toHaveAttribute('data-context', 'preserved-context');
  await expect(optionIcon).toHaveAttribute('data-revision', '2');
  await page.evaluate(() => window.__issue97?.refreshItems());
  await expect(selectedOption.locator('[part="chip-remove-icon"] svg[data-testid="custom-remove-icon"]')).toHaveAttribute('data-revision', '2');
  const optionButton = selectedOption.locator('[part="chip-remove"]');
  await expect(optionButton).toHaveAttribute('aria-label', 'Remove option');
  await expect(optionButton).toHaveAttribute('type', 'button');

  await page.evaluate(() => (window as any).__issue97?.clearEvents());
  await optionIcon.locator('path').click();
  await expect.poll(() => page.evaluate(() => (window as any).__issue97?.selection())).toEqual([]);
  await expect.poll(() => page.evaluate(() => (window as any).__issue97?.events)).toEqual(['change']);
  await expect(host.locator('select-option[data-index="0"] [part="chip-remove"]')).toHaveCount(0);

  await page.locator('#reselect').click();
  await expect.poll(() => page.evaluate(() => (window as any).__issue97?.selection())).toEqual(['one']);
  await expect(chipIcon).toBeVisible();
  await page.evaluate(() => (window as any).__issue97?.clearEvents());
  await chipButton.click();
  await expect.poll(() => page.evaluate(() => (window as any).__issue97?.selection())).toEqual([]);
  await expect.poll(() => page.evaluate(() => (window as any).__issue97?.events)).toEqual(['change']);

  await page.evaluate(() => window.__issue97?.unmount());
  await expect(host).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => {
    const api = (window as any).__issue97;
    return api?.lifecycle.mounted === api?.lifecycle.cleaned;
  })).toBe(true);
});
