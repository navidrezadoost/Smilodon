import { expect, test, type Page } from '@playwright/test';

type SelectOptions = {
  id: string;
  mode?: 'single' | 'multi';
  multiMode?: 'wrap' | 'vertical' | 'horizontal';
  direction?: 'ltr' | 'rtl';
  clearControl?: boolean;
  slottedArrow?: boolean;
};

async function addSelect(page: Page, options: SelectOptions) {
  await page.evaluate(async ({ id, mode, multiMode, direction, clearControl, slottedArrow }) => {
    await customElements.whenDefined('enhanced-select');
    const host = document.createElement('enhanced-select') as any;
    host.id = id;
    host.style.cssText = 'display:block;width:360px;margin:12px 0;';
    if (slottedArrow) {
      const icon = document.createElement('span');
      icon.slot = 'arrow';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = '⌄';
      host.append(icon);
    }
    document.body.append(host);
    host.updateConfig({
      selection: { mode: mode ?? 'single' },
      direction: direction ?? 'ltr',
      clearControl: {
        enabled: clearControl === true,
        clearSelection: true,
        clearSearch: true,
        hideWhenEmpty: true,
      },
      multiSelectDisplay: { mode: multiMode ?? 'wrap', overflowX: 'auto', overflowY: 'auto' },
    });
    host.setItems([
      { value: 'alpha', label: 'Alpha' },
      { value: 'beta', label: 'Beta' },
      { value: 'gamma', label: 'Gamma' },
    ]);
    if (clearControl) await host.setSelectedValues(['alpha']);
  }, options);
  const host = page.locator(`#${options.id}`);
  await expect(host.locator('.input-content')).toBeAttached();
  await expect(host.locator('.dropdown-arrow-container')).toBeAttached();
  return host;
}

async function padding(host: ReturnType<Page['locator']>) {
  return host.evaluate((element) => {
    const root = element.shadowRoot!;
    const sides = (selector: string) => {
      const target = root.querySelector<HTMLElement>(selector)!;
      const style = getComputedStyle(target);
      const rect = target.getBoundingClientRect();
      return {
        top: style.paddingTop,
        right: style.paddingRight,
        bottom: style.paddingBottom,
        left: style.paddingLeft,
        width: rect.width,
        height: rect.height,
      };
    };
    return {
      content: sides('.input-content'),
      arrow: sides('.dropdown-arrow-container'),
      scrollPaddingEnd: getComputedStyle(root.querySelector('.input-content')!).scrollPaddingInlineEnd,
    };
  });
}

test.describe('Independent input and arrow padding tokens @all', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/vanilla-demo.html');
  });

  test('keeps defaults and applies independent shorthand values dynamically per instance', async ({ page }) => {
    const first = await addSelect(page, { id: 'issue120-first' });
    const second = await addSelect(page, { id: 'issue120-second' });
    expect(await padding(first)).toMatchObject({
      content: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
      arrow: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
    });

    await first.evaluate((element) => element.style.setProperty('--select-input-content-padding', '4px'));
    expect((await padding(first)).content).toMatchObject({ top: '4px', right: '4px', bottom: '4px', left: '4px' });
    expect((await padding(first)).arrow).toMatchObject({ top: '0px', right: '0px', bottom: '0px', left: '0px' });
    expect((await padding(second)).content).toMatchObject({ top: '0px', right: '0px', bottom: '0px', left: '0px' });

    await first.evaluate((element) => element.style.setProperty('--select-dropdown-arrow-container-padding', '8px 4px'));
    expect((await padding(first)).arrow).toMatchObject({ top: '8px', right: '4px', bottom: '8px', left: '4px' });
    expect((await padding(first)).content).toMatchObject({ top: '4px', right: '4px', bottom: '4px', left: '4px' });
    await first.evaluate((element) => element.style.setProperty('--select-input-content-padding', '1px 2px 3px 4px'));
    expect((await padding(first)).content).toMatchObject({ top: '1px', right: '2px', bottom: '3px', left: '4px' });

    await first.evaluate((element) => element.style.setProperty('--select-input-content-padding', '6px 10px'));
    expect((await padding(first)).content).toMatchObject({ top: '6px', right: '10px', bottom: '6px', left: '10px' });
    await first.evaluate((element) => element.style.removeProperty('--select-input-content-padding'));
    expect((await padding(first)).content).toMatchObject({ top: '0px', right: '0px', bottom: '0px', left: '0px' });
    expect((await padding(first)).arrow).toMatchObject({ top: '8px', right: '4px', bottom: '8px', left: '4px' });

    await first.evaluate((element) => {
      element.style.setProperty('--select-input-content-padding', '4px');
      element.style.setProperty('--select-dropdown-arrow-container-padding', '1px 2px 3px 4px');
    });
    expect((await padding(first)).arrow).toMatchObject({ top: '1px', right: '2px', bottom: '3px', left: '4px' });
    expect((await padding(second)).content).toMatchObject({ top: '0px', right: '0px', bottom: '0px', left: '0px' });
    expect((await padding(second)).arrow).toMatchObject({ top: '0px', right: '0px', bottom: '0px', left: '0px' });
    await first.evaluate((element) => element.style.removeProperty('--select-dropdown-arrow-container-padding'));
    expect((await padding(first)).arrow).toMatchObject({ top: '0px', right: '0px', bottom: '0px', left: '0px' });
    expect((await padding(first)).content).toMatchObject({ top: '4px', right: '4px', bottom: '4px', left: '4px' });
  });

  test('preserves wrap and vertical 12px logical end gap while explicit shorthand takes precedence', async ({ page }) => {
    await page.addStyleTag({ content: '.issue120-css-direction-rtl { direction: rtl; }' });
    for (const [index, multiMode] of (['wrap', 'vertical'] as const).entries()) {
      const ltr = await addSelect(page, { id: `issue120-${multiMode}-ltr-${index}`, mode: 'multi', multiMode });
      const rtl = await addSelect(page, { id: `issue120-${multiMode}-rtl-${index}`, mode: 'multi', multiMode, direction: 'rtl' });
      expect((await padding(ltr)).content).toMatchObject({ top: '0px', right: '12px', bottom: '0px', left: '0px' });
      expect((await padding(rtl)).content).toMatchObject({ top: '0px', right: '0px', bottom: '0px', left: '12px' });
      for (const [host, expected] of [[ltr, 'ltr'], [rtl, 'rtl']] as const) {
        await host.evaluate((element) => element.style.setProperty('--select-multi-input-end-gap', '24px'));
        expect((await padding(host)).content).toMatchObject(expected === 'ltr'
          ? { top: '0px', right: '24px', bottom: '0px', left: '0px' }
          : { top: '0px', right: '0px', bottom: '0px', left: '24px' });
        await host.evaluate((element) => element.style.setProperty('--select-input-content-padding', '8px 4px'));
        expect((await padding(host)).content).toMatchObject({ top: '8px', right: '4px', bottom: '8px', left: '4px' });
        await host.evaluate((element) => element.style.removeProperty('--select-input-content-padding'));
        expect((await padding(host)).content).toMatchObject(expected === 'ltr'
          ? { top: '0px', right: '24px', bottom: '0px', left: '0px' }
          : { top: '0px', right: '0px', bottom: '0px', left: '24px' });
        await host.evaluate((element) => element.style.removeProperty('--select-multi-input-end-gap'));
        expect((await padding(host)).content).toMatchObject(expected === 'ltr'
          ? { top: '0px', right: '12px', bottom: '0px', left: '0px' }
          : { top: '0px', right: '0px', bottom: '0px', left: '12px' });
      }
      await ltr.evaluate((element) => element.classList.add('issue120-css-direction-rtl'));
      expect(await ltr.getAttribute('dir')).toBe('ltr');
      expect(await ltr.locator('.input-content').evaluate((element) => getComputedStyle(element).direction)).toBe('rtl');
      expect((await padding(ltr)).content).toMatchObject({ top: '0px', right: '0px', bottom: '0px', left: '12px' });
      await ltr.evaluate((element) => element.style.setProperty('--select-multi-input-end-gap', '24px'));
      expect((await padding(ltr)).content).toMatchObject({ top: '0px', right: '0px', bottom: '0px', left: '24px' });
      await ltr.evaluate((element) => element.style.setProperty('--select-input-content-padding', '8px 4px'));
      expect((await padding(ltr)).content).toMatchObject({ top: '8px', right: '4px', bottom: '8px', left: '4px' });
      await ltr.evaluate((element) => element.style.removeProperty('--select-input-content-padding'));
      expect((await padding(ltr)).content).toMatchObject({ top: '0px', right: '0px', bottom: '0px', left: '24px' });
      await ltr.evaluate((element) => element.style.removeProperty('--select-multi-input-end-gap'));
      expect((await padding(ltr)).content).toMatchObject({ top: '0px', right: '0px', bottom: '0px', left: '12px' });
      await ltr.evaluate((element) => element.classList.remove('issue120-css-direction-rtl'));
      expect((await padding(ltr)).content).toMatchObject({ top: '0px', right: '12px', bottom: '0px', left: '0px' });
      await rtl.evaluate((element) => element.style.setProperty('--select-input-content-padding', '8px 4px'));
      expect((await padding(rtl)).content).toMatchObject({ top: '8px', right: '4px', bottom: '8px', left: '4px' });
    }
  });

  test('keeps horizontal scroll spacing and custom content padding independent', async ({ page }) => {
    for (const direction of ['ltr', 'rtl'] as const) {
      const host = await addSelect(page, { id: `issue120-horizontal-${direction}`, mode: 'multi', multiMode: 'horizontal', direction });
      expect((await padding(host)).content).toMatchObject({ top: '0px', right: '0px', bottom: '0px', left: '0px' });
      expect((await padding(host)).scrollPaddingEnd).toBe('42px');
      await host.evaluate((element) => {
        element.style.setProperty('--select-input-content-padding', '3px 7px');
        element.style.setProperty('--select-dropdown-arrow-container-padding', '2px 5px');
      });
      expect((await padding(host)).content).toMatchObject({ top: '3px', right: '7px', bottom: '3px', left: '7px' });
      expect((await padding(host)).arrow).toMatchObject({ top: '2px', right: '5px', bottom: '2px', left: '5px' });
      expect((await padding(host)).scrollPaddingEnd).toBe('42px');
      await host.evaluate((element) => element.remove());
    }
  });

  test('keeps the clear control operable when both padding tokens are set', async ({ page }) => {
    for (const mode of ['single', 'horizontal'] as const) {
      for (const direction of ['ltr', 'rtl'] as const) {
        const host = await addSelect(page, {
          id: `issue120-controls-${mode}-${direction}`,
          mode: mode === 'single' ? 'single' : 'multi',
          multiMode: mode === 'horizontal' ? 'horizontal' : 'wrap',
          clearControl: true,
          direction,
        });
        await host.evaluate((element) => {
          element.style.setProperty('--select-input-content-padding', '4px');
          element.style.setProperty('--select-dropdown-arrow-container-padding', '8px 4px');
        });
        const arrowRect = await host.locator('.dropdown-arrow-container').boundingBox();
        const clearRect = await host.locator('[part="clear-button"]').boundingBox();
        expect(arrowRect?.width).toBeGreaterThan(0);
        expect(arrowRect?.height).toBeGreaterThan(0);
        expect(clearRect?.width).toBeGreaterThan(0);
        expect(clearRect?.height).toBeGreaterThan(0);
        const overlap = arrowRect!.x < clearRect!.x + clearRect!.width
          && arrowRect!.x + arrowRect!.width > clearRect!.x
          && arrowRect!.y < clearRect!.y + clearRect!.height
          && arrowRect!.y + arrowRect!.height > clearRect!.y;
        console.log('ISSUE120_CONTROL_GEOMETRY', JSON.stringify({ mode, direction, arrowRect, clearRect, overlap }));
        expect(overlap).toBe(false);
        await host.locator('[part="clear-button"]').click();
        await expect(host.locator('[part="clear-button"]')).toBeHidden();
        await expect(host.locator('input')).toHaveValue('');
        await expect.poll(() => host.evaluate((element: any) => element.getSelectedValues())).toEqual([]);
        await host.evaluate((element) => element.remove());
      }
    }
  });

  test('keeps the arrow target operable when its container is padded', async ({ page }) => {
    for (const mode of ['single', 'horizontal'] as const) {
      for (const direction of ['ltr', 'rtl'] as const) {
        const host = await addSelect(page, {
          id: `issue120-padded-arrow-${mode}-${direction}`,
          mode: mode === 'single' ? 'single' : 'multi',
          multiMode: mode === 'horizontal' ? 'horizontal' : 'wrap',
          clearControl: true,
          direction,
        });
        await host.evaluate((element) => {
          element.style.setProperty('--select-input-content-padding', '4px');
          element.style.setProperty('--select-dropdown-arrow-container-padding', '8px 4px');
        });
        const arrow = host.locator('.dropdown-arrow-container');
        const arrowRect = await arrow.boundingBox();
        expect(arrowRect?.width).toBeGreaterThan(0);
        expect(arrowRect?.height).toBeGreaterThan(0);
        await arrow.click();
        await expect(host).toHaveAttribute('data-open', 'true');
        await arrow.click();
        await expect(host).not.toHaveAttribute('data-open');
        await host.evaluate((element) => element.remove());
      }
    }
  });

  test('applies arrow padding to the container around custom slotted content', async ({ page }) => {
    const host = await addSelect(page, { id: 'issue120-slotted-arrow', slottedArrow: true });
    await host.evaluate((element) => element.style.setProperty('--select-dropdown-arrow-container-padding', '6px 3px'));
    const result = await padding(host);
    expect(result.arrow).toMatchObject({ top: '6px', right: '3px', bottom: '6px', left: '3px' });
    await expect(host.locator('[slot="arrow"]')).toBeAttached();
  });
});
