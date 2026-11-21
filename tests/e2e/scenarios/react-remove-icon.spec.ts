import { expect, test } from '@playwright/test';

test('React remove icon portals preserve controls, context, updates, and cleanup @react-adapter', async ({ page }) => {
  await page.goto('http://localhost:5173/react-remove-icon-certification.html');
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
