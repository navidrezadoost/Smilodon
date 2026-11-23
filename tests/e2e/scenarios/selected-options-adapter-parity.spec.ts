import { expect, test } from '@playwright/test';

const fixtureUrl = 'http://localhost:5178/adapter-config-qualification.html';
const frameworks = ['react', 'react-native-web', 'vue', 'svelte', 'solid', 'vanilla', 'web-component'];

async function getOrder(select: import('@playwright/test').Locator): Promise<string[]> {
  return select.evaluate((element: any) => [...element.shadowRoot.querySelectorAll<HTMLElement>('[part="option"][data-value]')]
    .map((option) => option.dataset.value ?? ''));
}

test('web adapters and direct Core preserve config siblings and open snapshots @adapter-parity', async ({ page }) => {
  await page.goto(fixtureUrl);
  await expect.poll(() => page.evaluate(() => (window as any).__selectedOptionsFixtureReady)).toBe(true);

  for (const framework of frameworks) {
    const section = page.locator(`section[data-framework="${framework}"]`);
    const select = section.locator('enhanced-select');
    await expect(select).toHaveCount(1);
    await expect.poll(() => select.evaluate((element: any) => element.getSelectedValues())).toEqual(['3']);

    await select.evaluate((element: any) => element.open());
    await expect.poll(() => getOrder(select)).toEqual(['3', '1', '2', '4', '5']);

    await section.locator(`#update-${framework}`).click();
    await expect.poll(() => select.evaluate((element: any) => element._config.selectedOptions.placement))
      .toBe('original');
    await expect.poll(() => select.evaluate((element: any) => element._config.scrollToSelected))
      .toMatchObject({
        enabled: false,
        multiSelectTarget: 'last',
        onOpen: 'align',
        behavior: 'auto',
        block: 'center',
      });
    expect(await getOrder(select)).toEqual(['3', '1', '2', '4', '5']);

    await select.evaluate((element: any) => {
      element.close();
      element.open();
    });
    await expect.poll(() => getOrder(select)).toEqual(['1', '2', '3', '4', '5']);
    await expect.poll(() => select.evaluate((element: any) => element.getSelectedValues())).toEqual(['3']);
    await select.evaluate((element: any) => element.close());
  }
});
