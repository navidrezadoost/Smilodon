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
    await expect(clearButton).toHaveAccessibleName('Clear selection and search');

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
    await page.evaluate(() => {
      const next = document.createElement('button');
      next.id = 'after-select';
      next.textContent = 'Continue';
      document.body.appendChild(next);
    });

    await input.focus();
    await input.press('Escape');
    await expect.poll(() => select.evaluate((element: any) => element._state.isOpen)).toBe(false);

    await select.evaluate((element: any) => element.open());
    await expect.poll(() => select.evaluate((element: any) => element._state.isOpen)).toBe(true);
    await input.focus();
    await input.press('Tab');
    await expect.poll(() => select.evaluate((element: any) => element._state.isOpen)).toBe(false);
    await expect(page.locator('#after-select')).toBeFocused();
  });

  test('exposes the host accessible name and description on the combobox', async ({ page }) => {
    const select = page.locator('#accessibility-focus-select');
    await select.evaluate((element: any) => {
      element.setAttribute('aria-label', 'Favorite fruit');
      element.setAttribute('aria-description', 'Choose a fruit for the order.');
    });

    const combobox = select.getByRole('combobox', { name: 'Favorite fruit' });
    await expect(combobox).toHaveAccessibleDescription('Choose a fruit for the order.');

    await select.evaluate((element: any) => element.open());
    await expect(combobox).toHaveAttribute('aria-expanded', 'true');
    await expect(select.getByRole('listbox')).toHaveAccessibleName('Favorite fruit');
  });

  test('associates validation text with the invalid combobox', async ({ page }) => {
    const select = page.locator('#accessibility-focus-select');
    const input = select.getByRole('combobox');

    await select.evaluate((element: any) => element.setError('Choose a fruit before continuing.'));

    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAccessibleDescription('Choose a fruit before continuing.');

    await select.evaluate((element: any) => element.clearError());
    await expect(input).toHaveAttribute('aria-invalid', 'false');
    await expect(input).toHaveAccessibleDescription('');
  });

  test('skips disabled options and clears the active descendant on Escape', async ({ page }) => {
    const select = page.locator('#accessibility-focus-select');
    await select.evaluate((element: any) => element.setItems([
      { id: 'apple', value: 'APL', label: 'Apple' },
      { id: 'blocked', value: 'BLK', label: 'Blocked', disabled: true },
      { id: 'cherry', value: 'CHR', label: 'Cherry' },
    ]));
    const input = select.getByRole('combobox');
    const options = select.locator('[part="option"][data-index]');

    await expect(options).toHaveCount(3);
    await input.focus();
    await input.press('Home');
    const firstOptionId = await options.nth(0).getAttribute('id');
    const lastOptionId = await options.nth(2).getAttribute('id');
    expect(firstOptionId).toBeTruthy();
    expect(lastOptionId).toBeTruthy();
    await expect(input).toHaveAttribute('aria-activedescendant', firstOptionId!);
    await input.press('ArrowDown');
    await expect(options.nth(1)).toHaveAttribute('aria-disabled', 'true');
    await expect(input).toHaveAttribute('aria-activedescendant', lastOptionId!);
    await input.press('End');
    await expect(input).toHaveAttribute('aria-activedescendant', lastOptionId!);

    await input.press('Escape');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/);
    await expect.poll(() => select.evaluate((element: any) => element.shadowRoot.activeElement === element._input)).toBe(true);
  });

  test('keeps multi-select ARIA state aligned with selected option values', async ({ page }) => {
    const select = page.locator('#accessibility-focus-select');
    await select.evaluate(async (element: any) => {
      element.updateConfig({ selection: { mode: 'multi', closeOnSelect: false } });
      await element.setSelectedValues(['APL']);
      element.open();
    });
    const listbox = select.getByRole('listbox');
    const apple = select.locator('[part="option"][data-value="APL"]');
    const banana = select.locator('[part="option"][data-value="BAN"]');

    await expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
    await expect(apple).toHaveAttribute('aria-selected', 'true');
    await expect(banana).toHaveAttribute('aria-selected', 'false');
  });

  test('keeps keyboard focus on a remaining chip remove button after removal', async ({ page }) => {
    const select = page.locator('#accessibility-focus-select');
    await select.evaluate(async (element: any) => {
      element.updateConfig({ selection: { mode: 'multi', closeOnSelect: false } });
      await element.setSelectedValues(['APL', 'BAN']);
    });
    const removeButtons = select.locator('[part="chip-remove"].badge-remove');
    await expect(removeButtons).toHaveCount(2);
    await removeButtons.nth(0).focus();
    await removeButtons.nth(0).press('Enter');

    await expect.poll(() => select.evaluate((element: any) => element.getSelectedValues())).toEqual(['BAN']);
    await expect(select.locator('[part="chip-remove"].badge-remove')).toHaveCount(1);
    await expect(select.getByRole('button', { name: 'Remove Banana' })).toBeFocused();

    await select.getByRole('button', { name: 'Remove Banana' }).press('Enter');
    await expect.poll(() => select.evaluate((element: any) => element.getSelectedValues())).toEqual([]);
    await expect(select.locator('[part="input"]')).toBeFocused();
  });
});
