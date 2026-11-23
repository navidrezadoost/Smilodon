import { expect, test } from '@playwright/test';

const demo = 'http://localhost:5173/vanilla-demo.html';

test('selected option scroll waits for dropdown entrance geometry and runs once @all', async ({ page }) => {
  await page.goto(demo);
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await customElements.whenDefined('enhanced-select');
    const select = document.createElement('enhanced-select') as any;
    select.id = 'open-selected-scroll';
    select.style.setProperty('--select-dropdown-animation', 'testHeightEntrance 600ms linear forwards');
    select.style.setProperty('--select-options-max-height', '320px');
    select.updateConfig({
      virtualize: false,
      scrollToSelected: {
        enabled: true,
        multiSelectTarget: 'first',
        behavior: 'instant',
        block: 'center',
      },
    });
    document.body.append(select);
    const style = document.createElement('style');
    style.textContent = `
      @keyframes testHeightEntrance {
        from { max-height: 0px; }
        to { max-height: 320px; }
      }
    `;
    select.shadowRoot!.append(style);
    select.setItems(Array.from({ length: 30 }, (_, index) => ({
      value: `item-${index + 1}`,
      label: `Option ${index + 1}`,
    })));
    await select.setSelectedValues(['item-24']);

    const dropdown = select.shadowRoot!.querySelector<HTMLElement>('.select-dropdown')!;
    const scroller = select.shadowRoot!.querySelector<HTMLElement>('.options-container')!;
    const commands: Array<{ type: string; time: number }> = [];
    const nativeScrollTo = scroller.scrollTo.bind(scroller);
    scroller.scrollTo = ((...args: Parameters<typeof scroller.scrollTo>) => {
      commands.push({ type: 'scrollTo', time: performance.now() });
      return nativeScrollTo(...args);
    }) as typeof scroller.scrollTo;
    const nativeScrollIntoView = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = function (...args) {
      if (this.getAttribute('data-value') === 'item-24') {
        commands.push({ type: 'scrollIntoView', time: performance.now() });
      }
      return nativeScrollIntoView.apply(this, args);
    };
    (window as any).__openSelectedScroll = { select, dropdown, scroller, commands };
  });

  const select = page.locator('#open-selected-scroll');
  await page.evaluate(() => (window as any).__openSelectedScroll.select.open());
  await expect(select).toHaveAttribute('data-open', 'true');
  await expect.poll(() => page.evaluate(() => {
    const fixture = (window as any).__openSelectedScroll;
    return fixture.commands.length;
  })).toBe(0);

  await page.waitForTimeout(120);
  expect(await page.evaluate(() => (window as any).__openSelectedScroll.commands.length)).toBe(0);

  await expect.poll(() => page.evaluate(() => {
    const fixture = (window as any).__openSelectedScroll;
    const selected = fixture.select.shadowRoot.querySelector('[data-value="item-24"]');
    const rect = selected.getBoundingClientRect();
    const viewport = fixture.scroller.getBoundingClientRect();
    return rect.top >= viewport.top && rect.bottom <= viewport.bottom;
  }), { timeout: 2_000 }).toBe(true);

  const commands = await page.evaluate(() => (window as any).__openSelectedScroll.commands);
  expect(commands).toHaveLength(1);
  expect(commands[0].type).toBe('scrollTo');
  const animationState = await page.evaluate(() => {
    const fixture = (window as any).__openSelectedScroll;
    const animations = fixture.dropdown.getAnimations();
    return animations.every((animation: Animation) => animation.playState === 'finished');
  });
  expect(animationState).toBe(true);
});
