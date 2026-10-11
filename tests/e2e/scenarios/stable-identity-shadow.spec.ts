import { expect, test } from '@playwright/test';

test.describe('Stable identity shadow parity', () => {
  test('keeps selection through reorder and clears a filtered active descendant', async ({ page }) => {
    await page.goto('http://localhost:5173/vanilla-demo.html');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      const select = document.createElement('enhanced-select');
      select.setAttribute('data-testid', 'stable-identity-shadow-select');
      document.body.appendChild(select);
    });

    const select = page.locator('[data-testid="stable-identity-shadow-select"]');
    await expect(select).toBeVisible();

    await select.evaluate((element: any) => {
      element.updateConfig({
        searchable: true,
        selection: { mode: 'single', closeOnSelect: false },
      });
      element.setItems([
        { id: 'apple', value: 'APL', label: 'Apple' },
        { id: 'banana', value: 'BAN', label: 'Banana' },
        { id: 'cherry', value: 'CHR', label: 'Cherry' },
      ]);
    });

      await select.evaluate((element: any) => element.setSelectedValues(['CHR']));
    await expect.poll(() => select.evaluate((element: any) => [...element._engine.state.selectedKeys]))
      .toEqual(['cherry']);

    await select.evaluate((element: any) => {
      element.setItems([
        { id: 'cherry', value: 'CHR', label: 'Cherry' },
        { id: 'apple', value: 'APL', label: 'Apple' },
        { id: 'banana', value: 'BAN', label: 'Banana' },
      ]);
    });
    await expect.poll(() => select.evaluate((element: any) => [...element._engine.state.selectedKeys]))
      .toEqual(['cherry']);
    await expect.poll(() => select.evaluate((element: any) => element._state.selectedIndices.has(0)))
      .toBe(true);

    const input = select.locator('input[part="input"]');
    await select.evaluate((element: any) => element.open());
    await expect.poll(() => select.evaluate((element: any) => element._state.isOpen)).toBe(true);
    await expect.poll(() => select.evaluate((element: any) => element._engine.state.activeKey))
      .toBe('cherry');
    await expect.poll(() => select.evaluate((element: any) => element.shadowRoot.activeElement === element._input))
      .toBe(true);
    await expect.poll(() => select.evaluate((element: any) => element._input.readOnly)).toBe(false);
    await input.press('ArrowDown');
    await expect.poll(() => select.evaluate((element: any) => element._engine.state.activeKey))
      .toBe('apple');
    await expect.poll(() => select.evaluate((element: any) => {
      const input = element.shadowRoot.querySelector('[part="input"]');
      const active = element.shadowRoot.querySelector('[data-index="1"]');
      return input?.getAttribute('aria-activedescendant') === active?.id;
    })).toBe(true);

    await input.fill('erry');
    await expect.poll(() => select.evaluate((element: any) => element._engine.state.activeKey))
      .toBeNull();
    await expect(select.locator('input[part="input"]')).not.toHaveAttribute('aria-activedescendant', /.+/);
    await expect.poll(() => select.evaluate((element: any) => [...element._engine.state.selectedKeys]))
      .toEqual(['cherry']);
    await expect.poll(() => select.evaluate((element: any) => element.getSelectedValues()))
      .toEqual(['CHR']);
  });
});