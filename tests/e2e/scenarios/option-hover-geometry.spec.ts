import { expect, test } from '@playwright/test';

type HoverCase = {
  id: string;
  direction?: 'ltr' | 'rtl';
  selected?: boolean;
};

async function addSelect(page: import('@playwright/test').Page, testCase: HoverCase) {
  await page.evaluate(async ({ id, direction, selected }) => {
    await customElements.whenDefined('enhanced-select');
    const select = document.createElement('enhanced-select') as any;
    select.id = id;
    select.setAttribute('dir', direction ?? 'ltr');
    select.style.setProperty('--select-option-hover-border', '3px solid rgb(220, 20, 60)');
    document.body.append(select);
    select.setItems([
      { value: 'target', label: 'Target option' },
      { value: 'other', label: 'Other option' },
    ]);
    if (selected) await select.setSelectedValues(['target']);
  }, testCase);
  return page.locator(`#${testCase.id}`);
}

test.describe('Option hover geometry @all', () => {
  test('keeps stationary edge hover stable for enabled, selected, RTL, and custom-border options', async ({ page }) => {
    await page.goto('http://localhost:5173/vanilla-demo.html');
    await page.waitForLoadState('networkidle');

    const cases: HoverCase[] = [
      { id: 'issue-77-enabled' },
      { id: 'issue-77-selected', selected: true },
      { id: 'issue-77-rtl', direction: 'rtl' },
    ];

    for (const testCase of cases) {
      const select = await addSelect(page, testCase);
      const input = select.getByRole('combobox');
      await input.focus();
      await expect(select).toHaveAttribute('data-open', 'true');

      const option = select.getByRole('option', { name: 'Target option' });
      await expect(option).toBeVisible();
      // Let the dropdown's entrance animation finish before measuring option geometry.
      await page.waitForTimeout(250);
      if (testCase.selected) await expect(option).toHaveAttribute('aria-selected', 'true');
      else await expect(option).toHaveAttribute('aria-selected', 'false');

      const before = await option.boundingBox();
      expect(before).not.toBeNull();
      const edgeX = testCase.direction === 'rtl'
        ? before!.x + before!.width - 1
        : before!.x + 1;
      const edgeY = before!.y + before!.height / 2;
      await page.mouse.move(edgeX, edgeY);
      await expect.poll(() => option.evaluate((element) => element.matches(':hover'))).toBe(true);
      await expect.poll(() => option.evaluate((element) => getComputedStyle(element).outlineWidth))
        .toBe('3px');

      const hovered = await option.boundingBox();
      await page.waitForTimeout(1100);
      await expect.poll(() => option.evaluate((element) => element.matches(':hover'))).toBe(true);
      const after = await option.boundingBox();
      expect(hovered).not.toBeNull();
      expect(after).not.toBeNull();
      expect(Math.abs(after!.x - hovered!.x)).toBeLessThan(0.1);
      expect(Math.abs(after!.y - hovered!.y)).toBeLessThan(0.1);
      expect(Math.abs(after!.width - hovered!.width)).toBeLessThan(0.1);
      expect(Math.abs(after!.height - hovered!.height)).toBeLessThan(0.1);

      await input.press('Escape');
      await expect(select).not.toHaveAttribute('data-open');
      await select.evaluate((element) => element.remove());
    }
  });

  test('preserves pointer selection, keyboard navigation, and disabled-option behavior', async ({ page }) => {
    await page.goto('http://localhost:5173/vanilla-demo.html');
    await page.waitForLoadState('networkidle');

    await page.evaluate(async () => {
      await customElements.whenDefined('enhanced-select');
      const select = document.createElement('enhanced-select') as any;
      select.id = 'issue-77-interactions';
      document.body.append(select);
      select.setItems([
        { value: 'first', label: 'First option' },
        { value: 'disabled', label: 'Disabled option', disabled: true },
        { value: 'second', label: 'Second option' },
      ]);
    });

    const select = page.locator('#issue-77-interactions');
    const input = select.getByRole('combobox');
    await input.focus();
    await select.getByRole('option', { name: 'First option' }).click();
    await expect.poll(() => select.evaluate((element: any) =>
      element._state.selectedItems.values().next().value?.label,
    )).toBe('First option');

    await input.focus();
    await input.press('ArrowDown');
    await expect.poll(() => select.evaluate((element: any) => element._state.activeIndex)).toBe(2);
    const disabled = select.getByRole('option', { name: 'Disabled option' });
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');
    await expect(disabled).toHaveAttribute('aria-selected', 'false');
    await input.press('Enter');
    await expect.poll(() => select.evaluate((element: any) =>
      element._state.selectedItems.values().next().value?.label,
    )).toBe('Second option');
  });
});
