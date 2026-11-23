import { expect, test } from '@playwright/test';

test('selected-first guarded virtualization keeps visual and source indices aligned at 10,000 items @all', async ({ page }) => {
  await page.goto('http://localhost:5173/vanilla-demo.html');
  await page.evaluate(async () => {
    await customElements.whenDefined('enhanced-select');
    const select = document.createElement('enhanced-select') as any;
    select.id = 'selected-options-virtualization-e1';
    select.updateConfig({ selectedOptions: { placement: 'selected-first' } });
    select._guardedVirtualizationRequested = true;
    select.updateConfig({
      estimatedItemHeight: 24,
      selection: { mode: 'multi', closeOnSelect: false },
    });
    select.setItems(Array.from({ length: 10_000 }, (_, index) => ({
      id: `option-${index}`,
      value: `option-${index}`,
      label: `Option ${index}`,
    })));
    await select.setSelectedValues(['option-9999']);
    document.body.append(select);

    const scroller = select.shadowRoot.querySelector('.options-container') as HTMLElement;
    Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: 120 });
    select.open();
    (window as any).__selectedOptionsVirtualization = { select, scroller };
  });

  const select = page.locator('#selected-options-virtualization-e1');
  await expect(select).toHaveAttribute('data-open', 'true');
  const result = await select.evaluate(() => {
    const { select: instance, scroller } = (window as any).__selectedOptionsVirtualization;
    const plan = instance._renderPlan;
    const virtualizer = instance._guardedVirtualizer;
    const itemCount = plan.filteredKeys.length;
    const initialMounted = scroller.querySelectorAll('[part="option"]').length;
    const materialized = instance._materializeGuardedVirtualKey('option-5000');
    instance._setActive(5000);
    const option = scroller.querySelector('[data-value="option-5000"]') as HTMLElement | null;
    const input = instance.shadowRoot.querySelector('[part="input"]') as HTMLInputElement;
    const windowRange = instance._guardedVirtualWindow;
    const topSpacer = Number((scroller.querySelector('[data-virtual-spacer="top"]') as HTMLElement).style.height.replace('px', ''));
    const bottomSpacer = Number((scroller.querySelector('[data-virtual-spacer="bottom"]') as HTMLElement).style.height.replace('px', ''));
    return {
      itemCount,
      initialMounted,
      materialized,
      selectedFirstKey: plan.filteredKeys[0],
      selectedSourceIndex: plan.sourceIndexByKey.get('option-9999'),
      activeSourceIndex: Number(option?.getAttribute('data-sm-index') ?? option?.getAttribute('data-index')),
      activeDisplayIndex: plan.displayIndexByKey.get('option-5000'),
      activeKey: instance._engine.state.activeKey,
      activeDescendantMatches: input.getAttribute('aria-activedescendant') === option?.id,
      mountedCount: scroller.querySelectorAll('[part="option"]').length,
      mountedKeys: instance._virtualizationScope.mountedKeys,
      windowRange,
      topSpacer,
      bottomSpacer,
      totalHeight: virtualizer.cumulativeOffset(itemCount),
      windowHeight: virtualizer.cumulativeOffset(windowRange.endIndex) - virtualizer.cumulativeOffset(windowRange.startIndex),
    };
  });

  expect(result.itemCount).toBe(10_000);
  expect(result.selectedFirstKey).toBe('option-9999');
  expect(result.selectedSourceIndex).toBe(9_999);
  expect(result.initialMounted).toBeLessThanOrEqual(10);
  expect(result.materialized).toBe(true);
  expect(result.activeSourceIndex).toBe(5_000);
  expect(result.activeDisplayIndex).toBe(5_001);
  expect(result.activeKey).toBe('option-5000');
  expect(result.activeDescendantMatches).toBe(true);
  expect(result.mountedCount).toBeLessThanOrEqual(10);
  expect(result.mountedKeys).toContain('option-5000');
  // The render window includes overscan, so its first index can vary with
  // browser viewport measurements. The active display index must be covered.
  expect(result.windowRange.startIndex).toBeLessThanOrEqual(result.activeDisplayIndex);
  expect(result.windowRange.endIndex).toBeGreaterThan(result.activeDisplayIndex);
  expect(result.topSpacer + result.windowHeight + result.bottomSpacer).toBe(result.totalHeight);
});
