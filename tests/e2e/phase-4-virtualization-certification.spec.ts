import { expect, test, type Locator, type Page } from '@playwright/test';

const itemCount = 10_000;
const viewportHeight = 240;

async function createGuardedSelect(page: Page): Promise<Locator> {
  await page.goto('http://localhost:5173/vanilla-demo.html');
  await page.waitForLoadState('networkidle');
  await page.evaluate(async ({ itemCount: count, viewportHeight: height }) => {
    await customElements.whenDefined('enhanced-select');
    const select = document.createElement('enhanced-select') as any;
    select.id = 'phase-4-virtualization-select';
    document.body.appendChild(select);
    select.updateConfig({
      searchable: true,
      estimatedItemHeight: 32,
      selection: { mode: 'multi', closeOnSelect: false },
      scrollToSelected: { enabled: true, multiSelectTarget: 'last' },
    });
    const options = select.shadowRoot.querySelector('.options-container') as HTMLElement;
    options.style.height = `${height}px`;
    options.style.maxHeight = `${height}px`;
    options.style.overflowY = 'auto';
    select.setItems(Array.from({ length: count }, (_, index) => ({
      id: `option-${index}`,
      value: `value-${index}`,
      label: `Option ${index}`,
    })));
    select.open();
    // Test-only use of the component's private integration seam; no public
    // option or production default is changed to enable guarded rendering.
    select._updateGuardedVirtualWindow(0, height);
    select._renderOptions();
  }, { itemCount, viewportHeight });

  const select = page.locator('#phase-4-virtualization-select');
  await expect(select.locator('[part="listbox"]')).toBeVisible();
  await expect.poll(() => select.locator('[part="option"]').count()).toBeLessThan(30);
  // Opening can schedule deferred scroll-to-selection work. Let that lifecycle
  // settle before the scenario starts issuing its own scroll or keyboard input.
  await expect.poll(() => select.evaluate((element: any) => element._lifecycleRafs.size)).toBe(0);
  return select;
}

async function scrollOptions(select: Locator, top: number) {
  await select.evaluate((element: any, scrollTop: number) => {
    const options = element.shadowRoot.querySelector('.options-container') as HTMLElement;
    options.scrollTop = scrollTop;
    options.dispatchEvent(new Event('scroll'));
  }, top);
}

test.describe('Phase 4 actual-component guarded virtualization certification', () => {
  test('opens 10,000 options with bounded DOM and tracks real positions through forward/back scrolling', async ({ page }) => {
    const select = await createGuardedSelect(page);
    const metrics = async () => select.evaluate((element: any) => {
      const options = element.shadowRoot.querySelector('.options-container') as HTMLElement;
      const mounted = Array.from(options.querySelectorAll<HTMLElement>('[part="option"]'));
      const containerRect = options.getBoundingClientRect();
      const indexed = mounted.map((option) => ({
        index: Number(option.getAttribute('data-index')),
        rect: option.getBoundingClientRect(),
        height: option.offsetHeight,
      }));
      const visible = indexed.filter(({ rect }) => rect.bottom > containerRect.top && rect.top < containerRect.bottom);
      const visibleIndices = visible.map(({ index }) => index);
      const mountedIndices = indexed.map(({ index }) => index);
      const topSpacer = options.querySelector('[data-virtual-spacer="top"]') as HTMLElement | null;
      const bottomSpacer = options.querySelector('[data-virtual-spacer="bottom"]') as HTMLElement | null;
      return {
        scrollHeight: options.scrollHeight,
        scrollTop: options.scrollTop,
        viewportHeight: containerRect.height,
        mountedCount: indexed.length,
        firstMountedIndex: mountedIndices[0],
        lastMountedIndex: mountedIndices[mountedIndices.length - 1],
        firstVisibleIndex: visibleIndices[0],
        lastVisibleIndex: visibleIndices[visibleIndices.length - 1],
        visibleCount: visible.length,
        visibleIndexSpan: visibleIndices.length ? Math.max(...visibleIndices) - Math.min(...visibleIndices) + 1 : 0,
        mountedOptionHeight: indexed.reduce((sum, option) => sum + option.height, 0),
        topSpacerHeight: topSpacer?.getBoundingClientRect().height ?? 0,
        bottomSpacerHeight: bottomSpacer?.getBoundingClientRect().height ?? 0,
      };
    });

    const initial = await metrics();
    expect(initial.scrollHeight).toBeGreaterThan(300_000);
    expect(initial.mountedCount).toBeLessThan(30);
    expect(initial.firstMountedIndex).toBe(0);
    expect(initial.visibleCount).toBeGreaterThan(0);
    expect(initial.firstVisibleIndex).toBe(0);

    await scrollOptions(select, Math.floor(initial.scrollHeight / 2));
    await expect.poll(async () => (await metrics()).firstVisibleIndex).toBeGreaterThan(4_000);
    const middle = await metrics();
    expect(middle.scrollTop).toBeGreaterThan(100_000);
    expect(middle.mountedCount).toBeLessThan(30);
    expect(middle.visibleCount).toBeGreaterThan(4);
    expect(middle.visibleIndexSpan).toBe(middle.visibleCount);
    expect(middle.firstMountedIndex).toBeLessThanOrEqual(middle.firstVisibleIndex);
    expect(middle.lastMountedIndex).toBeGreaterThanOrEqual(middle.lastVisibleIndex);
    expect(middle.topSpacerHeight).toBeGreaterThan(0);
    expect(middle.bottomSpacerHeight).toBeGreaterThan(0);
    expect(Math.abs(middle.topSpacerHeight + middle.mountedOptionHeight + middle.bottomSpacerHeight - middle.scrollHeight))
      .toBeLessThan(500);

    await scrollOptions(select, initial.scrollHeight);
    await expect.poll(async () => (await metrics()).firstVisibleIndex).toBeGreaterThan(9_900);
    const end = await metrics();
    expect(end.mountedCount).toBeLessThan(30);
    expect(end.visibleCount).toBeGreaterThan(0);
    expect(end.topSpacerHeight).toBeGreaterThan(0);

    await scrollOptions(select, 0);
    await expect.poll(async () => (await metrics()).firstVisibleIndex).toBe(0);
    const back = await metrics();
    expect(back.visibleCount).toBeGreaterThan(0);
    expect(back.topSpacerHeight).toBe(0);
  });

  test('keyboard navigation materializes unmounted options and keeps the active descendant valid after remount', async ({ page }) => {
    const select = await createGuardedSelect(page);
    const input = select.locator('[part="input"]');
    await input.focus();
    await input.press('End');

    await expect.poll(() => select.evaluate((element: any) => {
      const activeId = element._input.getAttribute('aria-activedescendant');
      return activeId ? element.shadowRoot.getElementById(activeId)?.getAttribute('data-index') : null;
    })).toBe('9999');
    await expect.poll(() => select.evaluate((element: any) => {
      const activeId = element._input.getAttribute('aria-activedescendant');
      return Boolean(activeId && element.shadowRoot.getElementById(activeId));
    })).toBe(true);
  });

  test('preserves multiple selected keys through window eviction and scrolls to a high filtered selection', async ({ page }) => {
    const select = await createGuardedSelect(page);
    await select.evaluate((element: any) => {
      element.setSelectedValues(['value-111', 'value-9876']);
      element._scrollToSelected();
    });
    const options = select.locator('[part="listbox"]');
    await expect.poll(() => select.evaluate((element: any) => element.getSelectedValues())).toEqual(['value-111', 'value-9876']);
    await scrollOptions(select, 280_000);
    await expect.poll(() => select.evaluate((element: any) => element.getSelectedValues())).toEqual(['value-111', 'value-9876']);

    const input = select.locator('[part="input"]');
    await input.fill('Option');
    await select.evaluate((element: any) => {
      element.setSelectedValues(['value-9876']);
      element._scrollToSelected();
    });
    const highIndex = await select.evaluate((element: any) => {
      const options = element.shadowRoot.querySelector('.options-container') as HTMLElement;
      return {
        scrollTop: options.scrollTop,
        scrollHeight: options.scrollHeight,
        selectedMounted: Boolean(options.querySelector('[data-index="9876"]')),
      };
    });
    expect(highIndex.scrollTop).toBeGreaterThan(100_000);
    expect(highIndex.scrollHeight).toBeGreaterThan(300_000);
    expect(highIndex.selectedMounted).toBe(true);
    await expect.poll(() => select.evaluate((element: any) => element.shadowRoot.querySelectorAll('[part="option"]').length)).toBeLessThan(30);
    await expect.poll(() => select.evaluate((element: any) => {
      const shadowRoot = element.shadowRoot as ShadowRoot;
      const mounted = Array.from(shadowRoot.querySelectorAll<HTMLElement>('[part="option"]'));
      return mounted.some((option) => Number(option.getAttribute('data-index')) >= 9_800);
    })).toBe(true);
    await expect(options).toBeVisible();
  });

  test('reorders and filters while scrolled, then handles renderer height changes and grouped fallback cleanly', async ({ page }) => {
    const select = await createGuardedSelect(page);
    await scrollOptions(select, 180_000);
    await expect.poll(() => select.evaluate((element: any) => {
      const options = element.shadowRoot.querySelector('.options-container') as HTMLElement;
      return options.scrollTop;
    })).toBeGreaterThan(100_000);
    await select.evaluate((element: any) => {
      element.setItems(Array.from({ length: 10_000 }, (_, index) => {
        const originalIndex = 10_000 - index - 1;
        return {
          id: `option-${originalIndex}`,
          value: `value-${originalIndex}`,
          label: `Option ${originalIndex}`,
        };
      }));
    });
    await expect.poll(() => select.locator('[part="option"]').count()).toBeLessThan(30);
    await expect.poll(() => select.evaluate((element: any) => {
      const options = element.shadowRoot.querySelector('.options-container') as HTMLElement;
      const first = options.querySelector('[part="option"]') as HTMLElement | null;
      const builtInLabel = first?.shadowRoot?.querySelector('.option-content')?.textContent?.trim();
      return builtInLabel || first?.textContent?.trim() || '';
    })).toMatch(/Option 4[0-9]{3}/);
    await select.locator('[part="input"]').fill('Option 9999');
    const mountedOptionHosts = select.locator('.options-container > [part="option"]');
    await expect(mountedOptionHosts).toHaveCount(1);
    await expect(mountedOptionHosts).toContainText('Option 9999');

    await select.locator('[part="input"]').fill('');
    await select.evaluate((element: any) => {
      element.optionRenderer = (item: any) => {
        const root = document.createElement('div');
        root.textContent = item.label;
        root.style.height = item.id === 'option-9999' ? '54px' : '32px';
        return root;
      };
      element._updateGuardedVirtualWindow(0, 240);
      element._renderOptions();
    });
    await expect.poll(() => select.evaluate((element: any) => {
      const option = element.shadowRoot.querySelector('[part="option"]') as HTMLElement | null;
      return option?.textContent?.trim();
    })).toBeTruthy();
    await expect.poll(() => select.evaluate((element: any) => {
      const option = element.shadowRoot.querySelector('[part="option"]') as HTMLElement | null;
      return option?.getBoundingClientRect().height ?? 0;
    })).toBeGreaterThanOrEqual(50);
    await select.evaluate((element: any) => {
      element.setGroupedItems([{ label: 'Group', options: [{ id: 'grouped', value: 'grouped', label: 'Grouped option' }] }]);
    });
    await expect(select.locator('[part="group-header"]')).toBeVisible();
    await expect.poll(() => select.evaluate((element: any) => element._guardedVirtualizer)).toBeNull();
  });

  test('disconnects and reconnects without stale mounted nodes or duplicate guarded scroll handling', async ({ page }) => {
    const select = await createGuardedSelect(page);
    await select.evaluate((element: any) => {
      const parent = element.parentElement!;
      element.remove();
      parent.appendChild(element);
    });
    await select.evaluate((element: any) => element.open());
    await expect.poll(() => select.evaluate((element: any) => element._lifecycleRafs.size)).toBe(0);
    await expect.poll(() => select.locator('.options-container > [part="option"]').count()).toBeLessThan(30);
    const before = await select.evaluate((element: any) => element.shadowRoot.querySelectorAll('[part="option"]').length);
    await scrollOptions(select, 240_000);
    await expect.poll(() => select.evaluate((element: any) => {
      const options = element.shadowRoot.querySelector('.options-container') as HTMLElement;
      const first = options.querySelector('[part="option"]') as HTMLElement | null;
      return Number(first?.getAttribute('data-index'));
    })).toBeGreaterThan(7_000);
    const after = await select.evaluate((element: any) => {
      const options = element.shadowRoot.querySelector('.options-container') as HTMLElement;
      const first = options.querySelector('[part="option"]') as HTMLElement | null;
      return {
        count: options.querySelectorAll('[part="option"]').length,
        firstIndex: Number(first?.getAttribute('data-index')),
        scrollTop: options.scrollTop,
      };
    });
    expect(before).toBeLessThan(30);
    expect(after.count).toBeLessThan(30);
    expect(after.firstIndex).toBeGreaterThan(7_000);
    expect(after.scrollTop).toBeGreaterThan(200_000);
  });
});
