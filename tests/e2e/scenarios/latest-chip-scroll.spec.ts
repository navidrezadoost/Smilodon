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
    const scrollAfterAdd = viewport.scrollLeft;
    const bounds = latest.getBoundingClientRect();
    const container = viewport.getBoundingClientRect();
    await select.setSelectedValues(['0', '1', '2', '4']);
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    return {
      first,
      scrollAfterAdd,
      scrollAfterRemove: viewport.scrollLeft,
      visible: bounds.left >= container.left - 1 && bounds.right <= container.right + 1,
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
