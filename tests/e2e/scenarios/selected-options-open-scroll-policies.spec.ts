import { expect, test } from '@playwright/test';

const demo = 'http://localhost:5173/vanilla-demo.html';

async function mountSelect(page: import('@playwright/test').Page, id: string, config: Record<string, unknown>, selected: string) {
  await page.evaluate(async ({ id, config, selected }) => {
    await customElements.whenDefined('enhanced-select');
    const select = document.createElement('enhanced-select') as any;
    select.id = id;
    select.style.setProperty('--select-options-max-height', '160px');
    select.updateConfig({ virtualize: false, selection: { mode: 'multi' }, ...config });
    select.setItems(Array.from({ length: 30 }, (_, index) => ({
      value: `item-${index}`,
      label: `Option ${index}`,
    })));
    document.body.append(select);
    await select.setSelectedValues([selected]);
    (window as any)[id] = select;
  }, { id, config, selected });
}

test('public align policies apply start, center, end, and nearest positioning @all', async ({ page }) => {
  await page.goto(demo);
  await page.waitForLoadState('networkidle');
  for (const block of ['start', 'center', 'end'] as const) {
    const id = `scroll-align-${block}`;
    await mountSelect(page, id, {
      scrollToSelected: { enabled: true, onOpen: 'align', multiSelectTarget: 'first', behavior: 'instant', block },
    }, 'item-20');
    const select = page.locator(`#${id}`);
    await page.evaluate((key) => (window as any)[key].open(), id);
    const alignmentError = async () => select.evaluate((element: any, requestedBlock: string) => {
      const option = element.shadowRoot.querySelector('[data-value="item-20"]') as HTMLElement;
      const viewport = element.shadowRoot.querySelector('.options-container') as HTMLElement;
      const optionRect = option.getBoundingClientRect();
      const viewportRect = viewport.getBoundingClientRect();
      if (optionRect.height === 0) return Number.POSITIVE_INFINITY;
      const top = optionRect.top - (viewportRect.top + viewport.clientTop);
      const bottomGap = viewportRect.top + viewport.clientTop + viewport.clientHeight - optionRect.bottom;
      if (requestedBlock === 'start') return Math.abs(top);
      if (requestedBlock === 'center') return Math.abs(top - bottomGap);
      return Math.abs(bottomGap);
    }, block);
    await expect.poll(alignmentError, { timeout: 3_000 }).toBeLessThanOrEqual(block === 'center' ? 3 : 2);
    await page.evaluate((key) => (window as any)[key].remove(), id);
  }

  const nearestId = 'scroll-align-nearest-visible';
  await mountSelect(page, nearestId, {
    scrollToSelected: { enabled: true, onOpen: 'align', multiSelectTarget: 'first', behavior: 'instant', block: 'nearest' },
  }, 'item-0');
  await page.evaluate((key) => (window as any)[key].open(), nearestId);
  const nearestScrollTop = await page.locator(`#${nearestId}`).evaluate((element: any) =>
    (element.shadowRoot.querySelector('.options-container') as HTMLElement).scrollTop);
  expect(nearestScrollTop).toBe(0);
});

test('public reveal preserves an already-visible option and reveals an offscreen target @all', async ({ page }) => {
  await page.goto(demo);
  await mountSelect(page, 'scroll-reveal', {
    scrollToSelected: { enabled: true, onOpen: 'reveal', multiSelectTarget: 'first', behavior: 'instant', block: 'nearest' },
  }, 'item-20');
  const select = page.locator('#scroll-reveal');
  await page.evaluate(() => {
    const instance = (window as any)['scroll-reveal'];
    const scroller = instance.shadowRoot.querySelector('.options-container') as HTMLElement;
    scroller.scrollTop = 0;
    instance.open();
  });
  await expect.poll(() => select.evaluate((element: any) => {
    const scroller = element.shadowRoot.querySelector('.options-container') as HTMLElement;
    const target = element.shadowRoot.querySelector('[data-value="item-20"]') as HTMLElement;
    const a = target.getBoundingClientRect();
    const b = scroller.getBoundingClientRect();
    return a.top >= b.top && a.bottom <= b.top + scroller.clientHeight;
  }), { timeout: 3_000 }).toBe(true);

  const visibleId = 'scroll-reveal-visible';
  await mountSelect(page, visibleId, {
    scrollToSelected: { enabled: true, onOpen: 'reveal', multiSelectTarget: 'first', behavior: 'instant', block: 'nearest' },
  }, 'item-0');
  await page.evaluate((key) => (window as any)[key].open(), visibleId);
  await expect.poll(() => page.locator(`#${visibleId}`).evaluate((element: any) =>
    (element.shadowRoot.querySelector('.options-container') as HTMLElement).scrollTop)).toBe(0);
});

test('public preserve retains scrollTop for stable order and the same visible key across selected-first reorder @all', async ({ page }) => {
  await page.goto(demo);
  const id = 'scroll-preserve-reorder';
  await mountSelect(page, id, {
    selectedOptions: { placement: 'original' },
    scrollToSelected: { enabled: true, onOpen: 'preserve', multiSelectTarget: 'first', behavior: 'instant', block: 'start' },
  }, 'item-0');
  const select = page.locator(`#${id}`);
  await page.evaluate((key) => {
    const instance = (window as any)[key];
    instance.open();
    const scroller = instance.shadowRoot.querySelector('.options-container') as HTMLElement;
    scroller.scrollTop = 240;
    const viewportTop = scroller.getBoundingClientRect().top + scroller.clientTop;
    const visible = [...scroller.querySelectorAll('[data-sm-selectable], [data-selectable]')]
      .map((option: Element) => ({ option: option as HTMLElement, rect: option.getBoundingClientRect() }))
      .find(({ rect }: any) => rect.height > 0 && rect.bottom > viewportTop && rect.top < viewportTop + scroller.clientHeight);
    (window as any).__preserveBefore = {
      scrollTop: scroller.scrollTop,
      anchor: visible?.option.getAttribute('data-value'),
      offset: visible ? visible.rect.top - viewportTop : null,
    };
  }, id);
  await page.locator(`#${id}`).evaluate((element: any) => element.close());
  await page.locator(`#${id}`).evaluate(async (element: any) => {
    await element.setSelectedValues(['item-29']);
    element.updateConfig({ selectedOptions: { placement: 'selected-first' } });
    element.open();
  });

  const before = await page.evaluate(() => (window as any).__preserveBefore);
  expect(before.anchor).toBeTruthy();
  await expect.poll(() => select.evaluate((element: any) => {
    const before = (window as any).__preserveBefore;
    const scroller = element.shadowRoot.querySelector('.options-container') as HTMLElement;
    const anchor = element.shadowRoot.querySelector(`[data-value="${before.anchor}"]`) as HTMLElement;
    const offset = anchor.getBoundingClientRect().top - (scroller.getBoundingClientRect().top + scroller.clientTop);
    return Math.abs(offset - before.offset);
  }), { timeout: 3_000 }).toBeLessThanOrEqual(3);
  const after = await select.evaluate((element: any) => {
    const scroller = element.shadowRoot.querySelector('.options-container') as HTMLElement;
    const anchor = element.shadowRoot.querySelector(`[data-value="${(window as any).__preserveBefore.anchor}"]`) as HTMLElement;
    return {
      scrollTop: scroller.scrollTop,
      offset: anchor.getBoundingClientRect().top - (scroller.getBoundingClientRect().top + scroller.clientTop),
    };
  });
  expect(Math.abs(after.offset - before.offset)).toBeLessThanOrEqual(3);
  expect(after.scrollTop).not.toBe(0);
});

test('disabled automatic positioning suppresses align on open @all', async ({ page }) => {
  await page.goto(demo);
  await mountSelect(page, 'scroll-disabled', {
    scrollToSelected: { enabled: false, onOpen: 'align', multiSelectTarget: 'first', behavior: 'instant', block: 'start' },
  }, 'item-20');
  const select = page.locator('#scroll-disabled');
  await page.evaluate(() => (window as any)['scroll-disabled'].open());
  await page.waitForTimeout(100);
  expect(await select.evaluate((element: any) =>
    (element.shadowRoot.querySelector('.options-container') as HTMLElement).scrollTop)).toBe(0);
});
