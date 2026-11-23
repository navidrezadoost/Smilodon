import { expect, test } from '@playwright/test';

test('grouped selected-first projection preserves groups and keyboard visual order @all', async ({ page }) => {
  await page.goto('http://localhost:5173/vanilla-demo.html');
  await page.evaluate(async () => {
    await customElements.whenDefined('enhanced-select');
    const select = document.createElement('enhanced-select') as any;
    select.id = 'selected-options-grouped-order-e2';
    select.updateConfig({ selectedOptions: { placement: 'selected-first' } });
    select.updateConfig({ selection: { mode: 'multi' }, virtualize: false });
    const firstGroup = {
      label: 'Repeated',
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B', disabled: true },
      ],
    };
    const secondGroup = {
      label: 'Repeated',
      options: [
        { value: 'c', label: 'C' },
        { value: 'd', label: 'D' },
      ],
    };
    select.setGroupedItems([firstGroup, secondGroup]);
    select.groupHeaderRenderer = (group: { label: string }, index: number) => {
      const header = document.createElement('h3');
      header.dataset.headerIndex = String(index);
      header.textContent = `${index}:${group.label}`;
      return header;
    };
    document.body.append(select);
    await select.setSelectedValues(['d']);
    select.open();
    (window as any).__groupedSelectedProjection = { select, firstGroup, secondGroup };
  });

  const select = page.locator('#selected-options-grouped-order-e2');
  const input = select.locator('[part="input"]');
  await expect(select).toHaveAttribute('data-open', 'true');
  await expect(select.locator('.group-header')).toHaveText(['0:Repeated', '1:Repeated']);

  const initial = await select.evaluate((element: any) => ({
    planOrder: element._renderPlan.filteredKeys,
    groupIndices: element._renderPlan.groupedPresentation.map((group: any) => group.groupIndex),
    renderedValues: [...element.shadowRoot.querySelectorAll('[data-sm-selectable], [data-selectable]')]
      .map((option: Element) => option.getAttribute('data-value')),
    groupHeaderIndices: [...element.shadowRoot.querySelectorAll('.group-header')]
      .map((header: HTMLElement) => header.dataset.headerIndex),
    headerRoles: [...element.shadowRoot.querySelectorAll('.group-header')]
      .map((header: HTMLElement) => header.getAttribute('role')),
  }));
  expect(initial.planOrder).toEqual(['a', 'b', 'd', 'c']);
  expect(initial.groupIndices).toEqual([0, 1]);
  expect(initial.renderedValues).toEqual(['a', 'b', 'd', 'c']);
  expect(initial.groupHeaderIndices).toEqual(['0', '1']);
  expect(initial.headerRoles).toEqual(['presentation', 'presentation']);

  await input.focus();
  await page.keyboard.press('End');
  await expect.poll(() => select.evaluate((element: any) => element._engine.state.activeKey)).toBe('c');
  await page.keyboard.press('ArrowUp');
  await expect.poll(() => select.evaluate((element: any) => element._engine.state.activeKey)).toBe('d');
  await page.keyboard.press('ArrowUp');
  await expect.poll(() => select.evaluate((element: any) => element._engine.state.activeKey)).toBe('a');

  const activeState = await select.evaluate((element: any) => {
    const inputEl = element.shadowRoot.querySelector('[part="input"]') as HTMLInputElement;
    const active = element.shadowRoot.getElementById(inputEl.getAttribute('aria-activedescendant') ?? '');
    return {
      value: active?.getAttribute('data-value'),
      sourceIndex: Number(active?.getAttribute('data-sm-index') ?? active?.getAttribute('data-index')),
      activeDescendantMatches: Boolean(active) && inputEl.getAttribute('aria-activedescendant') === active?.id,
    };
  });
  expect(activeState.value).toBe('a');
  expect(activeState.sourceIndex).toBe(0);
  expect(activeState.activeDescendantMatches).toBe(true);
});
