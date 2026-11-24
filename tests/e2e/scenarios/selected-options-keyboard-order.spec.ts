import { expect, test } from '@playwright/test';

test('selected-first keyboard movement and Shift range follow displayed order @all', async ({ page }) => {
  await page.goto('http://localhost:5173/vanilla-demo.html');
  await page.evaluate(async () => {
    await customElements.whenDefined('enhanced-select');
    const select = document.createElement('enhanced-select') as any;
    select.id = 'selected-options-keyboard-order';
    select.updateConfig({ selectedOptions: { placement: 'selected-first' } });
    select.style.setProperty('--select-dropdown-animation', 'keyboardEntrance 600ms linear forwards');
    select.updateConfig({ selection: { mode: 'multi' }, virtualize: false });
    select.setItems(Array.from({ length: 6 }, (_, index) => ({
      value: `option-${index}`,
      label: `Option ${index}`,
    })));
    const animationStyle = document.createElement('style');
    animationStyle.textContent = '@keyframes keyboardEntrance { from { opacity: 0; } to { opacity: 1; } }';
    select.shadowRoot.append(animationStyle);
    document.body.append(select);
    await select.setSelectedValues(['option-5']);
    select.__cancelCalls = 0;
    const cancelOpenScroll = select._cancelOpenSelectedScroll.bind(select);
    select._cancelOpenSelectedScroll = () => {
      select.__cancelCalls += 1;
      return cancelOpenScroll();
    };
    select.open();
  });

  const select = page.locator('#selected-options-keyboard-order');
  const input = select.locator('[part="input"]');
  await expect(select).toHaveAttribute('data-open', 'true');
  await input.focus();
  await page.keyboard.press('Shift+ArrowDown');
  await page.waitForTimeout(700);

  const firstMove = await select.evaluate((element: any) => {
    const inputEl = element.shadowRoot.querySelector('[part="input"]') as HTMLInputElement;
    const active = element.shadowRoot.getElementById(inputEl.getAttribute('aria-activedescendant') ?? '');
    return {
      activeKey: element._engine.state.activeKey,
      activeSourceIndex: element._state.activeIndex,
      activeValue: active?.getAttribute('data-value'),
      selectedKeys: [...element._engine.state.selectedKeys],
      cancelCalls: element.__cancelCalls,
      displayedValues: [...element.shadowRoot.querySelectorAll('[data-index]')]
        .map((option: Element) => option.getAttribute('data-value')),
    };
  });
  expect(firstMove.displayedValues).toEqual(['option-5', 'option-0', 'option-1', 'option-2', 'option-3', 'option-4']);
  expect(firstMove.activeKey).toBe('option-0');
  expect(firstMove.activeSourceIndex).toBe(0);
  expect(firstMove.activeValue).toBe('option-0');
  expect(new Set(firstMove.selectedKeys)).toEqual(new Set(['option-5', 'option-0']));
  expect(firstMove.cancelCalls).toBeGreaterThan(0);

  await page.keyboard.press('Shift+End');
  const range = await select.evaluate((element: any) => ({
    activeKey: element._engine.state.activeKey,
    selectedKeys: [...element._engine.state.selectedKeys],
    activeDescendantExists: Boolean(element.shadowRoot.getElementById(
      element.shadowRoot.querySelector('[part="input"]').getAttribute('aria-activedescendant'),
    )),
  }));
  expect(range.activeKey).toBe('option-4');
  expect(new Set(range.selectedKeys)).toEqual(new Set(Array.from({ length: 6 }, (_, index) => `option-${index}`)));
  expect(range.activeDescendantExists).toBe(true);
});
