import { expect, test } from '@playwright/test';

test.describe('Custom arrow slot @all', () => {
  test('nested slotted SVG pointer clicks produce exactly one open/close transition (#119)', async ({ page }) => {
    await page.goto('http://localhost:5173/vanilla-demo.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(async () => {
      await customElements.whenDefined('enhanced-select');
      const select = document.createElement('enhanced-select');
      select.id = 'issue-119-custom-arrow';
      const icon = document.createElement('span');
      icon.slot = 'arrow';
      icon.innerHTML = '<svg data-testid="issue119-icon" viewBox="0 0 16 16" width="24" height="24"><path d="M4 6L8 10L12 6" /></svg>';
      select.append(icon);
      (select as any).setItems([{ value: 'alpha', label: 'Alpha' }]);
      const transitions: string[] = [];
      select.addEventListener('open', () => transitions.push('open'));
      select.addEventListener('close', () => transitions.push('close'));
      (window as any).__issue119Transitions = transitions;
      document.body.append(select);
    });

    const select = page.locator('#issue-119-custom-arrow');
    const nestedPath = select.locator('[slot="arrow"] svg path');
    await expect(select).toHaveAttribute('data-custom-arrow', 'true');

    await nestedPath.click();
    await expect(select).toHaveAttribute('data-open', 'true');
    await expect.poll(() => page.evaluate(() => (window as any).__issue119Transitions)).toEqual(['open']);

    await nestedPath.click();
    await expect(select).not.toHaveAttribute('data-open');
    await expect.poll(() => page.evaluate(() => (window as any).__issue119Transitions))
      .toEqual(['open', 'close']);
    await page.waitForTimeout(200);
    await expect(select).not.toHaveAttribute('data-open');
    await expect.poll(() => page.evaluate(() => (window as any).__issue119Transitions))
      .toEqual(['open', 'close']);

    await nestedPath.click();
    await expect(select).toHaveAttribute('data-open', 'true');
    await expect.poll(() => page.evaluate(() => (window as any).__issue119Transitions))
      .toEqual(['open', 'close', 'open']);
  });

  test('keeps the fallback default and leaves custom rotation and appearance to the consumer', async ({ page }) => {
    await page.goto('http://localhost:5173/vanilla-demo.html');
    await page.waitForLoadState('networkidle');
    await page.addStyleTag({
      content: `
        #issue-76-custom > [slot="arrow"] {
          display: inline-flex;
          transform: rotate(0deg);
          transition: none;
        }
        #issue-76-custom[data-open="true"] > [slot="arrow"] {
          transform: rotate(180deg);
        }
        #issue-76-static > [slot="arrow"],
        #issue-76-static[data-open="true"] > [slot="arrow"] {
          transform: none;
          transition: none;
        }
      `,
    });
    await page.evaluate(async () => {
      await customElements.whenDefined('enhanced-select');
      const custom = document.createElement('enhanced-select');
      custom.id = 'issue-76-custom';
      const icon = document.createElement('span');
      icon.slot = 'arrow';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = '⌄';
      custom.append(icon);
      document.body.append(custom);
      custom.setItems([{ value: 'a', label: 'Alpha' }]);

      const fallback = document.createElement('enhanced-select');
      fallback.id = 'issue-76-default';
      document.body.append(fallback);
      fallback.setItems([{ value: 'a', label: 'Alpha' }]);

      const staticCustom = document.createElement('enhanced-select');
      staticCustom.id = 'issue-76-static';
      const staticIcon = document.createElement('span');
      staticIcon.slot = 'arrow';
      staticIcon.textContent = '◆';
      staticCustom.append(staticIcon);
      document.body.append(staticCustom);
      staticCustom.setItems([{ value: 'a', label: 'Alpha' }]);
    });

    const custom = page.locator('#issue-76-custom');
    const icon = custom.locator('[slot="arrow"]');
    const customArrowContainer = custom.locator('.dropdown-arrow-container');
    await expect.poll(() => custom.getAttribute('data-custom-arrow')).toBe('true');
    await expect(custom.locator('slot[name="arrow"] [part="arrow"]')).toBeAttached();
    await expect.poll(() => icon.evaluate((node) => getComputedStyle(node).transform))
      .toBe('matrix(1, 0, 0, 1, 0, 0)');

    await customArrowContainer.hover();
    await expect.poll(() => customArrowContainer.evaluate((node) => getComputedStyle(node).backgroundColor))
      .toBe('rgba(0, 0, 0, 0)');

    await customArrowContainer.click();
    await expect(custom).toHaveAttribute('data-open', 'true');
    await expect.poll(() => icon.evaluate((node) => getComputedStyle(node).transform))
      .toBe('matrix(-1, 0, 0, -1, 0, 0)');
    await custom.getByRole('option', { name: 'Alpha' }).click();
    await expect(custom).not.toHaveAttribute('data-open');
    await expect.poll(() => icon.evaluate((node) => getComputedStyle(node).transform))
      .toBe('matrix(1, 0, 0, 1, 0, 0)');
    await customArrowContainer.click();
    await expect(custom).toHaveAttribute('data-open', 'true');
    await customArrowContainer.click();
    await expect(custom).not.toHaveAttribute('data-open');

    const fallback = page.locator('#issue-76-default');
    const defaultArrow = fallback.locator('[part="arrow"]');
    await expect(defaultArrow).toBeAttached();
    await fallback.locator('.dropdown-arrow-container').click();
    await expect(defaultArrow).toHaveClass(/open/);
    await fallback.getByRole('option', { name: 'Alpha' }).click();
    await expect(fallback).not.toHaveAttribute('data-open');

    const staticCustom = page.locator('#issue-76-static');
    const staticIcon = staticCustom.locator('[slot="arrow"]');
    await staticCustom.locator('.dropdown-arrow-container').click();
    await expect(staticCustom).toHaveAttribute('data-open', 'true');
    await expect.poll(() => staticIcon.evaluate((node) => getComputedStyle(node).transform))
      .toBe('none');
  });
});
