import { expect, test, type Locator, type Page } from '@playwright/test';

const fixtureUrl = process.env.SMILODON_VANILLA_FIXTURE_URL ?? 'http://localhost:5173/vanilla-demo.html';
const longLabel = 'International Pharmaceutical Distribution Company — Central Branch';

async function addSelect(page: Page, id: string, mode: 'single' | 'multi' = 'single', width = 220) {
  await page.evaluate(async ({ id, mode, width, longLabel }) => {
    await customElements.whenDefined('enhanced-select');
    const select = document.createElement('enhanced-select') as any;
    select.id = id;
    select.style.cssText = `display:block;width:${width}px;margin:12px 0;`;
    document.body.append(select);
    select.updateConfig({
      searchable: true,
      direction: 'ltr',
      selection: { mode, showRemoveButton: true },
      multiSelectDisplay: { mode: 'wrap' },
    });
    await select.setItems([
      { value: 'long-a', label: longLabel },
      { value: 'long-b', label: 'Northern Regional Distribution Company — West District' },
      { value: 'short', label: 'Short' },
    ]);
    await select.setSelectedValues(mode === 'single' ? ['long-a'] : ['long-a', 'long-b']);
  }, { id, mode, width, longLabel });
  return page.locator(`#${id}`);
}

function tooltip(host: Locator): Locator {
  return host.locator('[role="tooltip"]');
}

test.describe('Selected label and search query tooltip #121 #129 @all', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(fixtureUrl);
  });

  test('shows only a truncated selected single label on hover and keeps it hoverable', async ({ page }) => {
    const host = await addSelect(page, 'issue121-single-hover');
    const input = host.locator('[part="input"]');
    const popup = tooltip(host);
    await expect(popup).toBeHidden();

    await input.hover();
    await expect(popup).toBeVisible();
    await expect(popup).toHaveText(longLabel);
    await expect(input).toHaveAttribute('aria-describedby', new RegExp(await popup.getAttribute('id') ?? '$^'));
    await popup.hover();
    await expect(popup).toBeVisible();
    await host.evaluate(async (element) => { await (element as any).setSelectedValues(['short']); });
    await expect(popup).toBeHidden();
  });

  test('keyboard focus reveals the selected label and Escape dismisses without moving focus', async ({ page }) => {
    const host = await addSelect(page, 'issue121-single-keyboard');
    const input = host.locator('[part="input"]');
    const popup = tooltip(host);
    await input.focus();
    await expect(popup).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(popup).toBeHidden();
    await expect(input).toBeFocused();
  });

  test('shows the full truncated query rather than the selected label', async ({ page }) => {
    const host = await addSelect(page, 'issue129-search-query');
    const input = host.locator('[part="input"]');
    const popup = tooltip(host);
    await input.hover();
    await expect(popup).toBeVisible();
    const query = 'A very long live search query that is clipped inside the narrow input field';
    await input.fill(query);
    await expect(popup).toBeVisible();
    await expect(popup).toHaveText(query);
    await expect(popup).not.toHaveText(longLabel);
    await expect(input).toHaveAttribute('aria-describedby', new RegExp(await popup.getAttribute('id') ?? '$^'));
  });

  test('shows a truncated query in multi-select and hides it when the query fits', async ({ page }) => {
    const host = await addSelect(page, 'issue129-multi-query', 'multi', 250);
    const input = host.locator('[part="input"]');
    const popup = tooltip(host);
    const query = 'A long multi-select query that cannot fit in its search input';
    await input.focus();
    await input.fill(query);
    await expect(popup).toBeVisible();
    await expect(popup).toHaveText(query);

    await host.evaluate((element) => {
      const input = (element as HTMLElement).shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')!;
      input.style.width = '240px';
    });
    await input.fill('Short');
    await expect(popup).toBeHidden();
    await expect(input).not.toHaveAttribute('aria-describedby', new RegExp(await popup.getAttribute('id') ?? '$^'));
  });

  test('updates the current query tooltip through edits, resize, RTL, Escape, and clear', async ({ page }) => {
    const host = await addSelect(page, 'issue129-query-lifecycle', 'single', 190);
    const input = host.locator('[part="input"]');
    const popup = tooltip(host);
    const firstQuery = 'A long search query that is clipped by the narrow input';
    const updatedQuery = 'The newer query must replace the tooltip content immediately';

    await input.focus();
    await input.fill(firstQuery);
    await expect(popup).toBeVisible();
    await expect(popup).toHaveText(firstQuery);
    await input.fill(updatedQuery);
    await expect(popup).toHaveText(updatedQuery);

    await host.evaluate((element) => { (element as HTMLElement).style.width = '900px'; });
    await expect(popup).toBeHidden();
    await host.evaluate((element) => { (element as HTMLElement).style.width = '190px'; });
    await expect(popup).toBeVisible();

    await host.evaluate((element) => { (element as any).updateConfig({ direction: 'rtl' }); });
    await expect(popup).toBeVisible();
    await expect(popup).toHaveCSS('direction', 'rtl');
    const bounds = await popup.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual((await page.evaluate(() => innerWidth)) + 1);

    await page.keyboard.press('Escape');
    await expect(popup).toBeHidden();
    await expect(input).toBeFocused();
    await input.fill(firstQuery);
    await expect(popup).toBeVisible();

    await input.fill('');
    await expect(popup).toBeHidden();
    await expect(input).not.toHaveAttribute('aria-describedby', new RegExp(await popup.getAttribute('id') ?? '$^'));
    await expect(input).toHaveValue('');

    await input.fill(firstQuery);
    await expect(popup).toHaveText(firstQuery);
    await host.evaluate(async (element) => { await (element as any).setSelectedValues(['long-b']); });
    await expect(input).toHaveValue('Northern Regional Distribution Company — West District');
    await expect(popup).toHaveText('Northern Regional Distribution Company — West District');
  });

  test('disconnect and reconnect removes the query tooltip and restores selected-label behavior', async ({ page }) => {
    const host = await addSelect(page, 'issue129-query-reconnect', 'single', 190);
    const input = host.locator('[part="input"]');
    const popup = tooltip(host);
    const query = 'A long pending query that is clipped by the input field';
    await input.focus();
    await input.fill(query);
    await expect(popup).toHaveText(query);

    await host.evaluate((element) => {
      element.remove();
      document.body.append(element);
    });
    await expect(popup).toBeHidden();
    await expect(input).not.toHaveAttribute('aria-describedby', new RegExp(await popup.getAttribute('id') ?? '$^'));

    await page.mouse.move(1, 1);
    await input.hover();
    await expect(popup).toBeVisible();
    await expect(popup).toHaveText(longLabel);
  });

  test('updates truncation availability when the host width changes', async ({ page }) => {
    const host = await addSelect(page, 'issue121-resize', 'single', 190);
    const input = host.locator('[part="input"]');
    const popup = tooltip(host);
    await input.hover();
    await expect(popup).toBeVisible();
    await host.evaluate((element) => { (element as HTMLElement).style.width = '900px'; });
    await expect(popup).toBeHidden();
    await host.evaluate((element) => { (element as HTMLElement).style.width = '190px'; });
    await expect(popup).toBeVisible();
  });

  test('shows the current truncated chip label on hover and keyboard focus', async ({ page }) => {
    const host = await addSelect(page, 'issue121-multi-label', 'multi', 250);
    const labels = host.locator('.selection-badge-label');
    const firstLabel = labels.nth(0);
    const popup = tooltip(host);
    await firstLabel.hover();
    await expect(popup).toBeVisible();
    await expect(popup).toHaveText(longLabel);
    await expect(firstLabel).toHaveAttribute('tabindex', '0');

    await firstLabel.focus();
    await expect(popup).toBeVisible();
    await expect(firstLabel).toHaveAttribute('aria-describedby', new RegExp(await popup.getAttribute('id') ?? '$^'));
    await host.locator('.selection-badge-label').nth(1).hover();
    await expect(popup).toHaveText('Northern Regional Distribution Company — West District');
  });

  test('restores focus and refreshed tooltip text when the selected record rerenders with the same key', async ({ page }) => {
    const host = await addSelect(page, 'issue121-same-key-rerender', 'multi', 250);
    const original = host.locator('.selection-badge-label').first();
    const popup = tooltip(host);
    await original.focus();
    await expect(popup).toHaveText(longLabel);

    const updatedLabel = 'International Pharmaceutical Distribution Company — Updated Branch';
    await host.evaluate(async (element, updatedLabel) => {
      await (element as any).setItems([
        { value: 'long-a', label: updatedLabel },
        { value: 'long-b', label: 'Northern Regional Distribution Company — West District' },
        { value: 'short', label: 'Short' },
      ]);
    }, updatedLabel);

    const replacement = host.locator('.selection-badge-label').first();
    await expect(replacement).toBeFocused();
    await expect(replacement).toHaveAttribute('tabindex', '0');
    await expect(popup).toBeVisible();
    await expect(popup).toHaveText(updatedLabel);
  });

  test('moves focus to a surviving chip control when the focused selection is removed', async ({ page }) => {
    const host = await addSelect(page, 'issue121-focused-chip-removed', 'multi', 250);
    const firstLabel = host.locator('.selection-badge-label').first();
    await firstLabel.focus();
    await host.evaluate(async (element) => {
      await (element as any).setSelectedValues(['long-b']);
    });
    await expect(host.locator('.selection-badge-label')).toHaveCount(1);
    await expect(host.locator('[part="chip-remove"]').first()).toBeFocused();
  });

  test('restores a focused chip tooltip after hover and Escape dismissal remains stable', async ({ page }) => {
    const host = await addSelect(page, 'issue121-pointer-focus-coordination', 'multi', 250);
    const popup = tooltip(host);
    const labels = host.locator('.selection-badge-label');
    const labelA = labels.nth(0);
    const labelB = labels.nth(1);

    await labelA.focus();
    await expect(popup).toHaveText(longLabel);
    await labelB.hover();
    await expect(popup).toHaveText('Northern Regional Distribution Company — West District');
    await page.mouse.move(1, 1);
    await expect(popup).toHaveText(longLabel);
    await expect(labelA).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(popup).toBeHidden();
    await page.waitForTimeout(220);
    await expect(popup).toBeHidden();

    await labelB.focus();
    await expect(popup).toBeVisible();
    await expect(popup).toHaveText('Northern Regional Distribution Company — West District');
  });

  test('hides a hovered chip tooltip after horizontal scrolling moves its trigger fully out of view', async ({ page }) => {
    const host = await addSelect(page, 'issue121-horizontal-offscreen', 'multi', 205);
    await host.evaluate((element) => {
      (element as any).updateConfig({
        multiSelectDisplay: { mode: 'horizontal', overflowX: 'auto', overflowY: 'hidden' },
      });
    });
    const label = host.locator('.selection-badge-label').first();
    const popup = tooltip(host);
    await label.hover();
    await expect(popup).toBeVisible();

    const movedOutside = await host.evaluate((element) => {
      const root = (element as HTMLElement).shadowRoot!;
      const viewport = root.querySelector<HTMLElement>('.input-content')!;
      const chip = root.querySelector<HTMLElement>('.selection-badge-label')!;
      viewport.scrollLeft = viewport.scrollWidth;
      const chipRect = chip.getBoundingClientRect();
      const viewportRect = viewport.getBoundingClientRect();
      return chipRect.right <= viewportRect.left + viewport.clientLeft
        || chipRect.left >= viewportRect.left + viewport.clientLeft + viewport.clientWidth;
    });
    expect(movedOutside).toBe(true);
    await expect(popup).toBeHidden();

    await host.evaluate((element) => {
      const viewport = (element as HTMLElement).shadowRoot!.querySelector<HTMLElement>('.input-content')!;
      viewport.scrollLeft = 0;
    });
    await label.hover();
    await expect(popup).toBeVisible();
    await expect(popup).toHaveText(longLabel);
  });

  test('short multi-select labels have no tooltip or sequential label tab stop', async ({ page }) => {
    const before = await page.evaluate(() => {
      const button = document.createElement('button');
      button.id = 'issue121-tab-before';
      button.textContent = 'Before';
      document.body.prepend(button);
      return button.id;
    });
    const host = await addSelect(page, 'issue121-short-chip-tab-order', 'multi', 250);
    await host.evaluate(async (element) => {
      await (element as any).setSelectedValues(['short']);
    });
    const afterId = await page.evaluate(() => {
      const button = document.createElement('button');
      button.id = 'issue121-tab-after';
      button.textContent = 'After';
      document.body.append(button);
      return button.id;
    });
    const label = host.locator('.selection-badge-label').first();
    const popup = tooltip(host);
    await expect(label).toHaveAttribute('tabindex', '-1');
    await label.hover();
    await expect(popup).toBeHidden();

    await page.locator(`#${before}`).focus();
    let reachedAfter = false;
    for (let index = 0; index < 8; index += 1) {
      await page.keyboard.press('Tab');
      const focusState = await page.evaluate((hostId) => {
        const host = document.getElementById(hostId);
        const active = host?.shadowRoot?.activeElement as HTMLElement | null;
        return {
          isChipLabel: active?.classList.contains('selection-badge-label') ?? false,
          isAfter: document.activeElement?.id === 'issue121-tab-after',
        };
      }, 'issue121-short-chip-tab-order');
      expect(focusState.isChipLabel).toBe(false);
      if (focusState.isAfter) {
        reachedAfter = true;
        break;
      }
    }
    expect(reachedAfter).toBe(true);
  });

  test('first Escape dismisses the tooltip and the next Escape closes the dropdown', async ({ page }) => {
    const host = await addSelect(page, 'issue121-escape-order');
    const input = host.locator('[part="input"]');
    const popup = tooltip(host);
    const dropdown = host.locator('[part="listbox"]');
    await input.focus();
    await host.evaluate((element) => { (element as any).open(); });
    await expect(dropdown).toBeVisible();
    await expect(popup).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(popup).toBeHidden();
    await expect(dropdown).toBeVisible();
    await expect(input).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dropdown).toBeHidden();
  });

  test('keeps chip removal separate from tooltip hover', async ({ page }) => {
    const host = await addSelect(page, 'issue121-remove', 'multi', 250);
    const popup = tooltip(host);
    await host.locator('.badge-remove').first().hover();
    await expect(popup).toBeHidden();
    await host.locator('.badge-remove').first().click();
    await expect(host.locator('.selection-badge')).toHaveCount(1);
    await expect(popup).toBeHidden();
  });

  test('keeps horizontal chip scrolling intact and positions the tooltip within the viewport in RTL', async ({ page }) => {
    const host = await addSelect(page, 'issue121-horizontal-rtl', 'multi', 205);
    await host.evaluate((element) => {
      const select = element as any;
      select.updateConfig({
        direction: 'rtl',
        multiSelectDisplay: { mode: 'horizontal', overflowX: 'auto', overflowY: 'hidden' },
      });
    });
    const firstLabel = host.locator('.selection-badge-label').first();
    const viewport = host.locator('.input-content');
    const geometry = await host.evaluate((element) => {
      const root = element.shadowRoot!;
      const label = root.querySelector<HTMLElement>('.selection-badge-label')!;
      const container = root.querySelector<HTMLElement>('.input-content')!;
      const labelRect = label.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const left = Math.max(labelRect.left, containerRect.left);
      const right = Math.min(labelRect.right, containerRect.right);
      return {
        scrollLeft: container.scrollLeft,
        x: (left + right) / 2,
        y: (Math.max(labelRect.top, containerRect.top) + Math.min(labelRect.bottom, containerRect.bottom)) / 2,
        visible: right > left,
      };
    });
    expect(geometry.visible).toBe(true);
    const popup = tooltip(host);
    await page.mouse.move(geometry.x, geometry.y);
    await expect(popup).toBeVisible();
    const bounds = await popup.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual((await page.evaluate(() => innerWidth)) + 1);
    expect(await viewport.evaluate((element) => element.scrollLeft)).toBe(geometry.scrollLeft);
  });

  test('flips above a selected label near the lower viewport edge', async ({ page }) => {
    const host = await addSelect(page, 'issue121-viewport-edge', 'single', 220);
    await host.evaluate((element) => {
      const host = element as HTMLElement;
      host.style.position = 'fixed';
      host.style.left = '8px';
      host.style.bottom = '0';
      host.style.margin = '0';
    });
    const input = host.locator('[part="input"]');
    const popup = tooltip(host);
    await input.hover();
    await expect(popup).toBeVisible();
    const inputBox = await input.boundingBox();
    const popupBox = await popup.boundingBox();
    expect(inputBox).not.toBeNull();
    expect(popupBox).not.toBeNull();
    expect(popupBox!.y + popupBox!.height).toBeLessThanOrEqual(inputBox!.y + 1);
    expect(popupBox!.y).toBeGreaterThanOrEqual(0);
  });

  test('removes stale tooltip and description when the single selection changes', async ({ page }) => {
    const host = await addSelect(page, 'issue121-selection-change');
    const input = host.locator('[part="input"]');
    const popup = tooltip(host);
    await input.hover();
    await expect(popup).toBeVisible();
    await host.evaluate(async (element) => {
      await (element as any).setSelectedValues(['short']);
    });
    await expect(popup).toBeHidden();
    await expect(input).not.toHaveAttribute('aria-describedby', new RegExp(await popup.getAttribute('id') ?? '$^'));
  });

  test('disconnect and reconnect clears stale tooltip state and can show it again', async ({ page }) => {
    const host = await addSelect(page, 'issue121-reconnect');
    const input = host.locator('[part="input"]');
    const popup = tooltip(host);
    await input.hover();
    await expect(popup).toBeVisible();
    await host.evaluate((element) => {
      element.remove();
      document.body.append(element);
    });
    await expect(popup).toBeHidden();
    await page.mouse.move(1, 1);
    await input.hover();
    await expect(popup).toBeVisible();
  });
});
