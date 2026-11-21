import { expect, test } from '@playwright/test';

test('opt-in horizontal chips reveal latest addition without jumping on removal', async ({ page }) => {
  await page.goto('http://localhost:5173/vanilla-demo.html');
  await page.evaluate(async () => {
    await customElements.whenDefined('enhanced-select');
    const select = document.createElement('enhanced-select') as any;
    select.id = 'issue-100-horizontal-select';
    select.style.width = '260px';
    select.updateConfig({
      selection: { mode: 'multi' },
      multiSelectDisplay: {
        mode: 'horizontal',
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollToLatestChip: true,
        scrollToLatestChipBehavior: 'auto',
      },
    });
    document.body.appendChild(select);
    select.setItems(Array.from({ length: 12 }, (_, index) => ({
      value: String(index), label: `Selected option number ${index}`,
    })));
    await select.setSelectedValues(['0', '1', '2', '3']);
  });
  const result = await page.locator('#issue-100-horizontal-select').evaluate(async (select: any) => {
    const viewport = select._inputContent as HTMLElement;
    const first = viewport.scrollLeft;
    await select.setSelectedValues(['0', '1', '2', '3', '4']);
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const latest = viewport.querySelectorAll<HTMLElement>('.selection-badge')[4];
    await Promise.all(latest.getAnimations().map((animation) => animation.finished.catch(() => undefined)));
    const scrollAfterAdd = viewport.scrollLeft;
    const bounds = latest.getBoundingClientRect();
    const container = viewport.getBoundingClientRect();
    const latestVisible = bounds.left >= container.left - 1 && bounds.right <= container.right + 1;
    await select.setSelectedValues(['0', '1', '2', '4']);
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    return {
      first,
      scrollAfterAdd,
      scrollAfterRemove: viewport.scrollLeft,
      visible: latestVisible,
    };
  });
  expect(result.scrollAfterAdd).toBeGreaterThan(result.first);
  expect(result.visible).toBe(true);
  // Removing an earlier chip should not force a new scroll-to-end.
  // Browser-native overflow clamping is permitted if content shrinks.
  expect(result.scrollAfterRemove).toBeLessThanOrEqual(result.scrollAfterAdd + 1);
});

test('disabled latest-chip scrolling does not move the horizontal viewport on addition', async ({ page }) => {
  await page.goto('http://localhost:5173/vanilla-demo.html');
  await page.evaluate(async () => {
    await customElements.whenDefined('enhanced-select');
    const select = document.createElement('enhanced-select') as any;
    select.id = 'issue-100-disabled-select';
    select.style.width = '260px';
    select.updateConfig({
      selection: { mode: 'multi' },
      multiSelectDisplay: { mode: 'horizontal', overflowX: 'auto', scrollToLatestChip: false },
    });
    document.body.appendChild(select);
    select.setItems(Array.from({ length: 12 }, (_, index) => ({
      value: String(index), label: `Selected option number ${index}`,
    })));
    await select.setSelectedValues(['0', '1', '2', '3']);
  });
  const before = await page.locator('#issue-100-disabled-select').evaluate((s: any) => s._inputContent.scrollLeft);
  await page.locator('#issue-100-disabled-select').evaluate(async (s: any) => {
    await s.setSelectedValues(['0', '1', '2', '3', '4']);
  });
  await page.waitForTimeout(50);
  const after = await page.locator('#issue-100-disabled-select').evaluate((s: any) => s._inputContent.scrollLeft);
  expect(after).toBe(before);
});

test('latest-chip scrolling reveals the new chip in RTL layout', async ({ page }) => {
  await page.goto('http://localhost:5173/vanilla-demo.html');
  const visible = await page.evaluate(async () => {
    await customElements.whenDefined('enhanced-select');
    const select = document.createElement('enhanced-select') as any;
    select.id = 'issue-100-rtl-select';
    select.style.width = '260px';
    select.updateConfig({
      direction: 'rtl',
      selection: { mode: 'multi' },
      multiSelectDisplay: {
        mode: 'horizontal', overflowX: 'auto', overflowY: 'hidden',
        scrollToLatestChip: true, scrollToLatestChipBehavior: 'auto',
      },
    });
    document.body.appendChild(select);
    select.setItems(Array.from({ length: 8 }, (_, index) => ({
      value: String(index), label: `Selected option number ${index}`,
    })));
    await select.setSelectedValues(['0', '1', '2', '3']);
    const viewport = select._inputContent as HTMLElement;
    await select.setSelectedValues(['0', '1', '2', '3', '4']);
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const latestChip = viewport.querySelectorAll<HTMLElement>('.selection-badge')[4];
    await Promise.all(latestChip.getAnimations().map((animation) => animation.finished.catch(() => undefined)));
    const latest = latestChip.getBoundingClientRect();
    const bounds = viewport.getBoundingClientRect();
    return latest.left >= bounds.left - 1 && latest.right <= bounds.right + 1;
  });
  const host = page.locator('#issue-100-rtl-select');
  await expect(host).toHaveAttribute('dir', 'rtl');
  const direction = await host.evaluate((select) => {
    const viewport = select.shadowRoot!.querySelector('.input-content')!;
    return getComputedStyle(viewport).direction;
  });
  expect(direction).toBe('rtl');
  expect(visible).toBe(true);
});

test('reduced motion uses non-animated scrolling', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://localhost:5173/vanilla-demo.html');
  const behavior = await page.evaluate(async () => {
    await customElements.whenDefined('enhanced-select');
    const select = document.createElement('enhanced-select') as any;
    select.id = 'issue-100-reduced-motion-select';
    select.style.width = '260px';
    select.updateConfig({
      selection: { mode: 'multi' },
      multiSelectDisplay: {
        mode: 'horizontal', overflowX: 'auto',
        scrollToLatestChip: true, scrollToLatestChipBehavior: 'smooth',
      },
    });
    document.body.appendChild(select);
    select.setItems(Array.from({ length: 8 }, (_, index) => ({
      value: String(index), label: `Selected option number ${index}`,
    })));
    await select.setSelectedValues(['0', '1', '2', '3']);
    const viewport = select._inputContent as HTMLElement;
    const nativeScrollBy = viewport.scrollBy.bind(viewport);
    let actualBehavior: ScrollBehavior | undefined;
    viewport.scrollBy = ((options: ScrollToOptions) => {
      actualBehavior = options.behavior;
      nativeScrollBy(options);
    }) as typeof viewport.scrollBy;
    await select.setSelectedValues(['0', '1', '2', '3', '4']);
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    return actualBehavior;
  });
  expect(behavior).toBe('auto');
});

test('keyboard selection still activates the option and reveals the new chip', async ({ page }) => {
  await page.goto('http://localhost:5173/vanilla-demo.html');
  const result = await page.evaluate(async () => {
    await customElements.whenDefined('enhanced-select');
    const select = document.createElement('enhanced-select') as any;
    select.id = 'issue-100-keyboard-select';
    select.style.width = '260px';
    select.updateConfig({
      selection: { mode: 'multi' },
      multiSelectDisplay: {
        mode: 'horizontal', overflowX: 'auto', scrollToLatestChip: true,
        scrollToLatestChipBehavior: 'auto',
      },
    });
    document.body.appendChild(select);
    select.setItems(Array.from({ length: 8 }, (_, index) => ({
      value: String(index), label: `Selected option number ${index}`,
    })));
    await select.setSelectedValues(['0', '1', '2', '3']);
    select._input.focus();
    select.open();
    return select.id;
  });
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  const selectedAndScrolled = await page.locator(`#${result}`).evaluate((select: any) => ({
    selected: select._getSelectedEntries().some((entry: any) => entry.key === '7'),
    scrollLeft: select._inputContent.scrollLeft,
  }));
  expect(selectedAndScrolled.selected).toBe(true);
  expect(selectedAndScrolled.scrollLeft).toBeGreaterThan(0);
});

test('manual drag scrolling remains available with auto-scroll enabled', async ({ page }) => {
  await page.goto('http://localhost:5173/vanilla-demo.html');
  const rect = await page.evaluate(async () => {
    await customElements.whenDefined('enhanced-select');
    const select = document.createElement('enhanced-select') as any;
    select.id = 'issue-100-drag-select';
    select.style.width = '260px';
    select.updateConfig({
      selection: { mode: 'multi' },
      multiSelectDisplay: {
        mode: 'horizontal', overflowX: 'auto', scrollToLatestChip: true,
      },
    });
    document.body.appendChild(select);
    select.setItems(Array.from({ length: 8 }, (_, index) => ({
      value: String(index), label: `Selected option number ${index}`,
    })));
    await select.setSelectedValues(['0', '1', '2', '3', '4', '5', '6', '7']);
    const viewport = select._inputContent as HTMLElement;
    viewport.scrollLeft = 0;
    const bounds = viewport.getBoundingClientRect();
    return { id: select.id, x: bounds.left + bounds.width - 12, y: bounds.top + bounds.height / 2 };
  });
  await page.mouse.move(rect.x, rect.y);
  await page.mouse.down();
  await page.mouse.move(rect.x - 120, rect.y, { steps: 6 });
  await page.mouse.up();
  const scrollLeft = await page.locator(`#${rect.id}`).evaluate((select: any) => select._inputContent.scrollLeft);
  expect(scrollLeft).toBeGreaterThan(0);
});
