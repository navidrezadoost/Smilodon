import { expect, test } from '@playwright/test';

const demo = 'http://localhost:5173/vanilla-demo.html';

async function mount(page: import('@playwright/test').Page, id: string, placement: 'top' | 'bottom' = 'bottom') {
  await page.goto(demo);
  await page.waitForLoadState('networkidle');
  await page.evaluate(async ({ id, placement }) => {
    await customElements.whenDefined('enhanced-select');
    const select = document.createElement('enhanced-select') as any;
    select.id = id;
    select.style.setProperty('--select-dropdown-animation', 'none');
    select.style.setProperty('--select-dropdown-exit-animation', 'dropdownExit 450ms linear forwards');
    select.updateConfig({ dropdownPlacement: { mode: placement } });
    document.body.append(select);
    select.setItems([{ value: 'a', label: 'Apple' }, { value: 'b', label: 'Banana' }]);
  }, { id, placement });
  return page.locator(`#${id}`);
}

test.describe('Dropdown exit animation @all', () => {
  test('closes ARIA immediately, fades out, then hides the panel', async ({ page }) => {
    const select = await mount(page, 'exit-bottom');
    const input = select.getByRole('combobox');
    await select.evaluate((node: any) => node.open());
    await expect(select).toHaveAttribute('data-open', 'true');

    await select.evaluate((node: any) => node.close());
    await expect(select).not.toHaveAttribute('data-open');
    await expect(input).toHaveAttribute('aria-expanded', 'false');

    const panel = select.locator('.select-dropdown');
    await expect(panel).toHaveAttribute('data-motion', 'closing');
    await expect(panel).toHaveAttribute('inert', '');
    await expect(panel).toHaveAttribute('aria-hidden', 'true');
    await expect.poll(() => panel.evaluate((node) => Number(getComputedStyle(node).opacity)))
      .toBeLessThan(0.95);
    await expect.poll(() => panel.evaluate((node: HTMLElement) => node.style.display))
      .toBe('none');
    await expect(panel).not.toHaveAttribute('data-motion');
  });

  test('rapid reopen prevents the previous close from hiding the new panel', async ({ page }) => {
    const select = await mount(page, 'exit-reopen');
    await select.evaluate((node: any) => { node.open(); node.close(); node.open(); });
    const panel = select.locator('.select-dropdown');
    await expect(panel).not.toHaveAttribute('data-motion');
    await expect(panel).not.toHaveAttribute('inert');
    await expect(select).toHaveAttribute('data-open', 'true');
    await page.waitForTimeout(520);
    await expect(panel).toBeVisible();
  });

  test('top placement exits in the opposite vertical direction', async ({ page }) => {
    const select = await mount(page, 'exit-top', 'top');
    await select.evaluate((node: any) => { node.open(); node.close(); });
    const panel = select.locator('.select-dropdown');
    await expect(panel).toHaveAttribute('data-placement', 'top');
    await expect(panel).toHaveAttribute('data-motion', 'closing');
    await expect.poll(() => panel.evaluate((node) => getComputedStyle(node).transform))
      .not.toBe('none');
    await expect.poll(() => panel.evaluate((node: HTMLElement) => node.style.display))
      .toBe('none');
  });

  test('reduced motion closes immediately', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const select = await mount(page, 'exit-reduced');
    await select.evaluate((node: any) => { node.open(); node.close(); });
    const panel = select.locator('.select-dropdown');
    await expect(panel).not.toHaveAttribute('data-motion');
    await expect.poll(() => panel.evaluate((node: HTMLElement) => node.style.display))
      .toBe('none');
  });
});
