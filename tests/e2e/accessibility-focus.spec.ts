import { expect, test } from '@playwright/test';

test.describe('Accessibility focus intent integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/vanilla-demo.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(async () => {
      await customElements.whenDefined('enhanced-select');
      const select = document.createElement('enhanced-select') as any;
      select.id = 'accessibility-focus-select';
      document.body.appendChild(select);
      select.updateConfig({
        searchable: true,
        clearControl: { enabled: true },
        selection: { mode: 'single', closeOnSelect: false },
      });
      select.setItems([
        { id: 'apple', value: 'APL', label: 'Apple' },
        { id: 'banana', value: 'BAN', label: 'Banana' },
      ]);
    });
  });

  test('trigger activation focuses the internal input', async ({ page }) => {
    const select = page.locator('#accessibility-focus-select');

    await select.locator('.input-container').click();

    await expect.poll(() => select.evaluate((element: any) =>
      element.shadowRoot.activeElement === element._input
    )).toBe(true);
    await expect(select.locator('[part="input"]')).toHaveAttribute('aria-expanded', 'true');
  });

  test('clear activation returns focus to the internal input', async ({ page }) => {
    const select = page.locator('#accessibility-focus-select');
    await select.evaluate((element: any) => element.setSelectedValues(['APL']));
    const clearButton = select.locator('[part="clear-button"]');
    await expect(clearButton).toBeVisible();

    await clearButton.click();

    await expect.poll(() => select.evaluate((element: any) =>
      element.shadowRoot.activeElement === element._input
    )).toBe(true);
    await expect.poll(() => select.evaluate((element: any) => element.getSelectedValues()))
      .toEqual([]);
  });

  test('renderer keyboardFocus focuses its option and keeps active descendant aligned', async ({ page }) => {
    const select = page.locator('#accessibility-focus-select');
    await select.evaluate((element: any) => {
      element.optionRenderer = (item: any) => {
        const option = document.createElement('div');
        option.textContent = item.label;
        return option;
      };
      element.open();
    });
    await expect.poll(() => select.evaluate((element: any) => element._state.isOpen)).toBe(true);

    await select.evaluate((element: any) => element._buildRendererHelpers().keyboardFocus(1));

    await expect.poll(() => select.evaluate((element: any) => {
      const option = element.shadowRoot.querySelector('[data-index="1"]');
      return element.shadowRoot.activeElement === option;
    })).toBe(true);
    await expect.poll(() => select.evaluate((element: any) => {
      const input = element.shadowRoot.querySelector('[part="input"]');
      const option = element.shadowRoot.querySelector('[data-index="1"]');
      return input?.getAttribute('aria-activedescendant') === option?.id;
    })).toBe(true);
  });

  test('Escape and Tab still close the popup from the input', async ({ page }) => {
    const select = page.locator('#accessibility-focus-select');
    const input = select.locator('[part="input"]');

    await input.focus();
    await input.press('Escape');
    await expect.poll(() => select.evaluate((element: any) => element._state.isOpen)).toBe(false);

    await select.evaluate((element: any) => element.open());
    await expect.poll(() => select.evaluate((element: any) => element._state.isOpen)).toBe(true);
    await input.focus();
    await input.press('Tab');
    await expect.poll(() => select.evaluate((element: any) => element._state.isOpen)).toBe(false);
  });
});
