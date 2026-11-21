import { expect, test } from '@playwright/test';

const url = 'http://localhost:5173/vanilla-demo.html';

test('custom slotted arrow uses hover token, then transparent fallback (#104)', async ({ page }) => {
  await page.goto(url);
  await page.evaluate(async () => {
    await customElements.whenDefined('enhanced-select');
    const select = document.createElement('enhanced-select');
    select.id = 'issue104-custom';
    const arrow = document.createElement('span');
    arrow.slot = 'arrow';
    arrow.textContent = 'Custom arrow';
    select.appendChild(arrow);
    document.body.appendChild(select);
  });

  const host = page.locator('#issue104-custom');
  const arrowContainer = host.locator('.dropdown-arrow-container');
  await expect(host).toHaveAttribute('data-custom-arrow', 'true');
  await arrowContainer.hover();
  await expect.poll(() => arrowContainer.evaluate((el) => getComputedStyle(el).backgroundColor))
    .toBe('rgba(0, 0, 0, 0)');

  await host.evaluate((element: HTMLElement) =>
    element.style.setProperty('--select-arrow-hover-bg', 'rgb(12, 34, 56)'));
  await expect.poll(() => arrowContainer.evaluate((el) => getComputedStyle(el).backgroundColor))
    .toBe('rgb(12, 34, 56)');

  await host.evaluate((element: HTMLElement) =>
    element.style.removeProperty('--select-arrow-hover-bg'));
  await expect.poll(() => arrowContainer.evaluate((el) => getComputedStyle(el).backgroundColor))
    .toBe('rgba(0, 0, 0, 0)');
});

test('default arrow retains its old hover fallback and honors the token (#104)', async ({ page }) => {
  await page.goto(url);
  await page.evaluate(async () => {
    await customElements.whenDefined('enhanced-select');
    const select = document.createElement('enhanced-select');
    select.id = 'issue104-default';
    document.body.appendChild(select);
  });
  const host = page.locator('#issue104-default');
  const arrowContainer = host.locator('.dropdown-arrow-container');
  await expect(host).not.toHaveAttribute('data-custom-arrow', 'true');
  await arrowContainer.hover();
  await expect.poll(() => arrowContainer.evaluate((el) => getComputedStyle(el).backgroundColor))
    .toBe('rgba(15, 52, 96, 0.05)');

  await host.evaluate((element: HTMLElement) =>
    element.style.setProperty('--select-arrow-hover-bg', 'rgb(44, 55, 66)'));
  await expect.poll(() => arrowContainer.evaluate((el) => getComputedStyle(el).backgroundColor))
    .toBe('rgb(44, 55, 66)');
});

test('removing custom arrow restores the built-in hover fallback (#104)', async ({ page }) => {
  await page.goto(url);
  await page.evaluate(async () => {
    await customElements.whenDefined('enhanced-select');
    const select = document.createElement('enhanced-select');
    select.id = 'issue104-transition';
    const arrow = document.createElement('span');
    arrow.slot = 'arrow';
    arrow.textContent = 'Custom arrow';
    select.appendChild(arrow);
    document.body.appendChild(select);
  });
  const host = page.locator('#issue104-transition');
  const arrowContainer = host.locator('.dropdown-arrow-container');
  await expect(host).toHaveAttribute('data-custom-arrow', 'true');
  await arrowContainer.hover();
  await expect.poll(() => arrowContainer.evaluate((el) => getComputedStyle(el).backgroundColor))
    .toBe('rgba(0, 0, 0, 0)');

  await host.evaluate((element: HTMLElement) => {
    element.querySelector('[slot="arrow"]')?.remove();
  });
  await expect(host).not.toHaveAttribute('data-custom-arrow', 'true');
  await expect.poll(() => arrowContainer.evaluate((el) => getComputedStyle(el).backgroundColor))
    .toBe('rgba(15, 52, 96, 0.05)');
});
