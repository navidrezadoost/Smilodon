import { expect, test, type Locator, type Page } from '@playwright/test';

const fixtureUrl = 'http://localhost:5173/vanilla-demo.html';
const itemData = [
  { value: 'alpha', label: 'Alpha Pharmaceutical Company' },
  { value: 'beta', label: 'Beta Medical Group' },
  { value: 'gamma', label: 'Gamma Health Services' },
];

async function mountSelect(page: Page, values: string[] = ['alpha', 'beta'], css = '') {
  await page.goto(fixtureUrl, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async ({ selected, styleText }) => {
    if (styleText) {
      const style = document.createElement('style');
      style.textContent = styleText;
      document.head.append(style);
    }
    const host = document.createElement('enhanced-select') as any;
    host.id = 'issue125-select';
    host.style.width = '240px';
    host.style.setProperty('--select-badge-max-width', '150px');
    host.updateConfig({
      selection: { mode: 'multi', showRemoveButton: true },
      multiSelectDisplay: { mode: 'horizontal', overflowX: 'auto', scrollToLatestChip: false },
    });
    host.setItems([
      { value: 'alpha', label: 'Alpha Pharmaceutical Company' },
      { value: 'beta', label: 'Beta Medical Group' },
      { value: 'gamma', label: 'Gamma Health Services' },
    ]);
    document.body.append(host);
    host.__changeCount = 0;
    host.addEventListener('change', () => { host.__changeCount += 1; });
    await host.setSelectedValues(selected);
    host.__changeCount = 0;
  }, { selected: values, styleText: css });
  return page.locator('#issue125-select');
}

function chipByLabel(host: Locator, text: string) {
  return host.locator('[part="chip"]').filter({ hasText: text });
}

test.describe('Core selected chip enter and exit motion', () => {
  test('keeps keyed chip DOM and manual scroll stable across unrelated updates', async ({ page }) => {
    const host = await mountSelect(page, ['alpha', 'beta'], `
      @keyframes issue125StableEntry { from { opacity: 0; } to { opacity: 1; } }
      enhanced-select::part(chip) { animation: issue125StableEntry 300ms linear both; }
    `);
    await page.waitForTimeout(350);
    const result = await host.evaluate((element: any) => {
      const root = element.shadowRoot;
      const content = root.querySelector('.input-content');
      const before = Array.from(root.querySelectorAll('.selection-badge')) as HTMLElement[];
      let animationStarts = 0;
      before.forEach((badge: HTMLElement) => badge.addEventListener('animationstart', () => { animationStarts += 1; }));
      content.scrollLeft = 27;
      element.updateConfig({ placeholder: 'Unrelated refresh' });
      const afterConfig = Array.from(root.querySelectorAll('.selection-badge')) as HTMLElement[];
      element.setItems([
        { value: 'alpha', label: 'Alpha updated' },
        { value: 'beta', label: 'Beta updated' },
        { value: 'gamma', label: 'Gamma' },
      ]);
      return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => {
        const afterItems = Array.from(root.querySelectorAll('.selection-badge')) as HTMLElement[];
        resolve({
          sameAfterConfig: before.every((badge, index) => badge === afterConfig[index]),
          sameAfterItems: before.every((badge, index) => badge === afterItems[index]),
          labels: afterItems.map((badge: HTMLElement) => badge.querySelector('.selection-badge-label')?.textContent),
          scrollLeft: content.scrollLeft,
          animationStarts,
        });
      })));
    });
    expect(result).toEqual({
      sameAfterConfig: true,
      sameAfterItems: true,
      labels: ['Alpha updated', 'Beta updated'],
      scrollLeft: 27,
      animationStarts: 0,
    });
  });

  test('runs consumer keyframes through ::part and removes selection before visual exit completes', async ({ page }) => {
    const host = await mountSelect(page, ['alpha', 'beta'], `
      @keyframes issue125ChipEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      @keyframes issue125ChipExit { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateY(-8px); } }
      @keyframes issue125ChipExitSecondary { from { filter: blur(0); } to { filter: blur(1px); } }
      enhanced-select::part(chip) { animation: issue125ChipEnter 160ms linear both; }
      enhanced-select::part(chip-exiting) { animation: issue125ChipExit 220ms linear both, issue125ChipExitSecondary 90ms linear both; }
    `);
    const alpha = chipByLabel(host, 'Alpha Pharmaceutical');
    const entered = await alpha.evaluate((chip: HTMLElement) => chip.getAnimations().map((animation) => (animation as CSSAnimation).animationName));
    expect(entered).toContain('issue125ChipEnter');

    await alpha.locator('[part="chip-remove"]').click();
    const exiting = host.locator('[part="chip-exiting"]');
    await expect(exiting).toHaveCount(1);
    await expect(exiting).toHaveAttribute('aria-hidden', 'true');
    await expect(exiting).toHaveAttribute('inert');
    await expect(exiting.locator('[part="chip-remove"]')).toBeDisabled();
    expect(await host.evaluate((element: any) => element.getSelectedValues())).toEqual(['beta']);
    expect(await host.evaluate((element: any) => element.__changeCount)).toBe(1);
    const runningExit = await exiting.evaluate((chip: HTMLElement) => chip.getAnimations().map((animation) => (animation as CSSAnimation).animationName));
    expect(runningExit).toContain('issue125ChipExit');
    expect(runningExit).toContain('issue125ChipExitSecondary');
    await page.waitForTimeout(120);
    await expect(exiting).toBeAttached();
    await expect(exiting).toHaveCount(0, { timeout: 1000 });
  });

  test('supports the built-in exit keyframe token and preserves legacy entry-token fallback', async ({ page }) => {
    const host = await mountSelect(page, ['alpha'], '');
    await host.evaluate(async (element: any) => {
      element.style.setProperty('--select-badge-animation', 'badgeEnter 900ms linear both');
      await element.setSelectedValues([]);
      await element.setSelectedValues(['alpha']);
    });
    const alpha = chipByLabel(host, 'Alpha Pharmaceutical');
    expect(await alpha.evaluate((chip: HTMLElement) => getComputedStyle(chip).animationDuration)).toBe('0.9s');

    await host.evaluate(async (element: any) => {
      element.style.setProperty('--select-badge-enter-animation', 'badgeEnter 120ms linear both');
      element.style.setProperty('--select-badge-exit-animation', 'badgeExit 180ms linear both');
      await element.setSelectedValues(['alpha', 'beta']);
    });
    const beta = chipByLabel(host, 'Beta Medical');
    expect(await beta.evaluate((chip: HTMLElement) => chip.getAnimations().some((animation) => (animation as CSSAnimation).animationName === 'badgeEnter'))).toBe(true);
    expect(await beta.evaluate((chip: HTMLElement) => getComputedStyle(chip).animationDuration)).toBe('0.12s');

    await chipByLabel(host, 'Alpha Pharmaceutical').locator('[part="chip-remove"]').click();
    const exiting = host.locator('[part="chip-exiting"]');
    await expect(exiting).toBeAttached();
    expect(await exiting.evaluate((chip: HTMLElement) => chip.getAnimations().some((animation) => (animation as CSSAnimation).animationName === 'badgeExit'))).toBe(true);
    await expect(exiting).toHaveCount(0, { timeout: 1000 });
  });

  test('immediately removes exiting nodes when motion is disabled or reduced', async ({ page }) => {
    const host = await mountSelect(page);
    await host.evaluate((element: HTMLElement) => element.style.setProperty('--select-badge-exit-animation', 'none'));
    await chipByLabel(host, 'Alpha Pharmaceutical')
      .locator('[part="chip-remove"]').click();
    await expect(host.locator('[part="chip-exiting"]')).toHaveCount(0);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await host.evaluate((element: HTMLElement) => element.style.setProperty('--select-badge-exit-animation', 'badgeExit 2s linear both'));
    await chipByLabel(host, 'Beta Medical')
      .locator('[part="chip-remove"]').click();
    await expect(host.locator('[part="chip-exiting"]')).toHaveCount(0);
  });

  test('reselection cancels a pending exit and restores the same single chip', async ({ page }) => {
    const host = await mountSelect(page, ['alpha', 'beta'], `
      @keyframes issue125SlowExit { from { opacity: 1; } to { opacity: 0; } }
      enhanced-select::part(chip-exiting) { animation: issue125SlowExit 2s linear both; }
    `);
    const alpha = chipByLabel(host, 'Alpha Pharmaceutical');
    const identity = await alpha.evaluate((chip: HTMLElement) => { (window as any).__issue125Alpha = chip; return true; });
    expect(identity).toBe(true);
    await alpha.locator('[part="chip-remove"]').click();
    await expect(host.locator('[part="chip-exiting"]')).toHaveCount(1);

    await host.evaluate(async (element: any) => element.setSelectedValues(['alpha', 'beta']));

    const restored = chipByLabel(host, 'Alpha Pharmaceutical');
    expect(await restored.evaluate((chip: HTMLElement) => chip === (window as any).__issue125Alpha)).toBe(true);
    await expect(host.locator('[part="chip"]')).toHaveCount(2);
    await expect(host.locator('[part="chip-exiting"]')).toHaveCount(0);
    expect(await host.evaluate((element: any) => element.getSelectedValues())).toEqual(['alpha', 'beta']);
  });

  test('bulk clear gives each chip an independent exit and disconnect cleans pending exits', async ({ page }) => {
    const host = await mountSelect(page, ['alpha', 'beta'], `
      @keyframes issue125BulkExit { from { opacity: 1; } to { opacity: 0; } }
      enhanced-select::part(chip-exiting) { animation: issue125BulkExit 350ms linear both; }
    `);
    await host.evaluate((element: any) => element.setSelectedValues([]));
    const exits = host.locator('[part="chip-exiting"]');
    await expect(exits).toHaveCount(2);
    expect(await host.evaluate((element: any) => element.getSelectedValues())).toEqual([]);
    await expect(exits.nth(0)).toHaveAttribute('inert');
    await expect(exits.nth(1)).toHaveAttribute('inert');

    await host.evaluate((element) => element.remove());
    await expect(exits).toHaveCount(0);
  });

  test('keeps selected-label tooltip and focus on a retained chip through unrelated updates', async ({ page }) => {
    const host = await mountSelect(page, ['alpha'], '');
    await host.evaluate(async (element: any) => {
      element.style.setProperty('--select-badge-max-width', '72px');
      await new Promise(requestAnimationFrame);
    });
    const label = host.locator('[part="chip-label"]');
    await expect.poll(() => label.getAttribute('tabindex')).toBe('0');
    await label.focus();
    const tooltip = host.locator('[role="tooltip"]');
    await expect(tooltip).toBeVisible();
    const sameAfter = await host.evaluate((element: any) => {
      const labelBefore = element.shadowRoot.querySelector('[part="chip-label"]');
      element.updateConfig({ placeholder: 'unrelated tooltip refresh' });
      return labelBefore === element.shadowRoot.querySelector('[part="chip-label"]');
    });
    expect(sameAfter).toBe(true);
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText('Alpha Pharmaceutical Company');
    await expect(label).toBeFocused();
  });

  test('uses per-instance animation configuration without affecting sibling selects', async ({ page }) => {
    const host = await mountSelect(page, ['alpha'], `
      @keyframes issue125IsolatedExit { from { opacity: 1; } to { opacity: 0; } }
      enhanced-select.isolated-motion::part(chip-exiting) { animation: issue125IsolatedExit 250ms linear both; }
    `);
    const secondId = await host.evaluate(async (element: any) => {
      const sibling = document.createElement('enhanced-select') as any;
      sibling.id = 'issue125-sibling';
      sibling.updateConfig({ selection: { mode: 'multi', showRemoveButton: true } });
      sibling.setItems([{ value: 'alpha', label: 'Alpha Pharmaceutical Company' }]);
      document.body.append(sibling);
      await sibling.setSelectedValues(['alpha']);
      return sibling.id;
    });
    expect(secondId).toBe('issue125-sibling');
    const sibling = page.locator('#issue125-sibling');
    await host.evaluate((element) => element.classList.add('isolated-motion'));
    await chipByLabel(host, 'Alpha Pharmaceutical').locator('[part="chip-remove"]').click();
    await expect(host.locator('[part="chip-exiting"]')).toHaveCount(1);
    await chipByLabel(sibling, 'Alpha Pharmaceutical').locator('[part="chip-remove"]').click();
    await expect(sibling.locator('[part="chip"]')).toHaveCount(0);
    await expect(host.locator('[part="chip-exiting"]')).toHaveCount(0, { timeout: 1000 });
  });
});
