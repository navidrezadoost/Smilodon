import { expect, test } from '@playwright/test';

const demo = 'http://localhost:5173/vanilla-demo.html';

test('first and last selected targets use render order after dropdown entrance @all', async ({ page }) => {
  await page.goto(demo);
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await customElements.whenDefined('enhanced-select');
    for (const target of ['first', 'last'] as const) {
      const select = document.createElement('enhanced-select') as any;
      select.id = `selected-target-order-${target}`;
      select.style.setProperty('--select-dropdown-animation', 'targetHeightEntrance 500ms linear forwards');
      select.style.setProperty('--select-options-max-height', '240px');
      select.updateConfig({
        virtualize: false,
        selection: { mode: 'multi' },
        scrollToSelected: {
          enabled: true,
          multiSelectTarget: target,
          behavior: 'instant',
          block: 'start',
        },
      });
      document.body.append(select);
      const style = document.createElement('style');
      style.textContent = `
        @keyframes targetHeightEntrance {
          from { max-height: 0px; }
          to { max-height: 240px; }
        }
      `;
      select.shadowRoot!.append(style);
      select.setItems(Array.from({ length: 40 }, (_, index) => ({
        value: `target-${index + 1}`,
        label: `Target option ${index + 1}`,
      })));
      await select.setSelectedValues(['target-30', 'target-10']);

      const dropdown = select.shadowRoot!.querySelector<HTMLElement>('.select-dropdown')!;
      const scroller = select.shadowRoot!.querySelector<HTMLElement>('.options-container')!;
      const nativeScrollTo = scroller.scrollTo.bind(scroller);
      const commands: Array<{ top: number; time: number }> = [];
      const targetRequests: string[] = [];
      scroller.scrollTo = ((options: ScrollToOptions) => {
        commands.push({ top: Number(options.top ?? scroller.scrollTop), time: performance.now() });
        nativeScrollTo(options);
      }) as typeof scroller.scrollTo;
      const nativePositionSelected = select._scrollOptionWithinOptionsContainer.bind(select);
      select._scrollOptionWithinOptionsContainer = ((option: HTMLElement, ...args: any[]) => {
        targetRequests.push(option.getAttribute('data-value') ?? '');
        return nativePositionSelected(option, ...args);
      }) as typeof select._scrollOptionWithinOptionsContainer;

      (window as any)[`__selectedTargetOrder_${target}`] = { select, dropdown, scroller, commands, targetRequests };
    }
  });

  for (const target of ['first', 'last'] as const) {
    const select = page.locator(`#selected-target-order-${target}`);
    await page.evaluate((which) => (window as any)[`__selectedTargetOrder_${which}`].select.open(), target);
    await expect(select).toHaveAttribute('data-open', 'true');
    await page.waitForTimeout(150);
    expect(await page.evaluate((which) => (window as any)[`__selectedTargetOrder_${which}`].commands.length, target)).toBe(0);

    await expect.poll(() => page.evaluate((which) => {
      return (window as any)[`__selectedTargetOrder_${which}`].commands.length;
    }, target), { timeout: 3_000 }).toBe(1);
  }

  const results = await page.evaluate(() => ['first', 'last'].map((target) => {
    const fixture = (window as any)[`__selectedTargetOrder_${target}`];
    const expectedValue = target === 'first' ? 'target-10' : 'target-30';
    const item = fixture.select.shadowRoot.querySelector(`[data-value="${expectedValue}"]`);
    const optionRect = item.getBoundingClientRect();
    const viewportRect = fixture.scroller.getBoundingClientRect();
    return {
      target,
      requestedValue: fixture.targetRequests[0],
      index: Number(item.getAttribute('data-index')),
      scrollTop: fixture.commands[0].top,
      animationFinished: fixture.dropdown.getAnimations().every((animation: Animation) => animation.playState === 'finished'),
      visible: optionRect.top >= viewportRect.top && optionRect.bottom <= viewportRect.bottom,
    };
  }));

  expect(results[0].requestedValue).toBe('target-10');
  expect(results[0].index).toBe(9);
  expect(results[0].animationFinished).toBe(true);
  expect(results[0].visible).toBe(true);
  expect(results[1].requestedValue).toBe('target-30');
  expect(results[1].index).toBe(29);
  expect(results[1].animationFinished).toBe(true);
  expect(results[1].visible).toBe(true);
  expect(results[1].scrollTop).toBeGreaterThan(results[0].scrollTop);
  expect(await page.evaluate(() => ['first', 'last'].map((target) =>
    (window as any)[`__selectedTargetOrder_${target}`].commands.length,
  ))).toEqual([1, 1]);
});
