import { expect, test, type Page } from '@playwright/test';

const fixtureUrl = 'http://localhost:5173/vanilla-demo.html';
const items = [
  { value: 'alpha', label: 'Alpha' },
  { value: 'beta', label: 'Beta' },
  { value: 'gamma', label: 'Gamma' },
];

type SelectOptions = {
  id: string;
  mode?: 'single' | 'multi';
  direction?: 'ltr' | 'rtl';
  position?: 'absolute' | 'static' | 'relative';
  clearControl?: boolean;
  horizontal?: boolean;
  slottedArrow?: boolean;
  width?: number;
};

async function addSelect(page: Page, options: SelectOptions) {
  await page.evaluate(async ({ id, mode, direction, position, clearControl, horizontal, slottedArrow, width, selectItems }) => {
    await customElements.whenDefined('enhanced-select');
    const host = document.createElement('enhanced-select') as any;
    host.id = id;
    host.style.cssText = `display:block;width:${width ?? 360}px;margin:12px 0;`;
    if (position) host.style.setProperty('--select-arrow-container-position', position);
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
      clearControl: { enabled: clearControl === true, hideWhenEmpty: true },
      multiSelectDisplay: horizontal
        ? { mode: 'horizontal', overflowX: 'auto', overflowY: 'hidden', dragScroll: true }
        : { mode: 'wrap' },
    });
    host.setItems(selectItems);
    return host.id;
  }, { ...options, selectItems: items });

  const host = page.locator(`#${options.id}`);
  await expect(host.locator('.dropdown-arrow-container')).toBeAttached();
  return host;
}

async function arrowMetrics(host: ReturnType<Page['locator']>) {
  return host.evaluate((element) => {
    const shadow = element.shadowRoot;
    const arrow = shadow?.querySelector<HTMLElement>('.dropdown-arrow-container');
    const shell = shadow?.querySelector<HTMLElement>('.input-container');
    const input = shadow?.querySelector<HTMLElement>('.select-input');
    if (!arrow || !shell || !input) return null;
    const arrowRect = arrow.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();
    return {
      position: getComputedStyle(arrow).position,
      arrow: { left: arrowRect.left, right: arrowRect.right, top: arrowRect.top, bottom: arrowRect.bottom, width: arrowRect.width, height: arrowRect.height },
      shell: { left: shellRect.left, right: shellRect.right, top: shellRect.top, bottom: shellRect.bottom, width: shellRect.width, height: shellRect.height },
      input: { left: inputRect.left, right: inputRect.right, width: inputRect.width, height: inputRect.height },
    };
  });
}

test.describe('Arrow container positioning CSS token @all', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(fixtureUrl);
  });

  const matrix = [
    { mode: 'single', direction: 'ltr', position: undefined, expected: 'absolute' },
    { mode: 'single', direction: 'ltr', position: 'static', expected: 'static' },
    { mode: 'single', direction: 'rtl', position: undefined, expected: 'absolute' },
    { mode: 'single', direction: 'rtl', position: 'static', expected: 'static' },
    { mode: 'multi', direction: 'ltr', position: undefined, expected: 'absolute' },
    { mode: 'multi', direction: 'ltr', position: 'static', expected: 'static' },
    { mode: 'multi', direction: 'rtl', position: undefined, expected: 'absolute' },
    { mode: 'multi', direction: 'rtl', position: 'static', expected: 'static' },
  ] as const;

  for (const [index, scenario] of matrix.entries()) {
    test(`matrix ${index + 1}: ${scenario.mode} ${scenario.direction}, ${scenario.position ?? 'unset'} @all`, async ({ page }) => {
      const host = await addSelect(page, {
        id: `issue114-matrix-${index}`,
        mode: scenario.mode,
        direction: scenario.direction,
        position: scenario.position,
      });
      const metrics = await arrowMetrics(host);
      expect(metrics?.position).toBe(scenario.expected);
      expect(metrics?.arrow.width).toBeGreaterThan(0);
      expect(metrics?.arrow.height).toBeGreaterThan(0);
      expect(metrics!.arrow.left).toBeGreaterThanOrEqual(metrics!.shell.left - 1);
      expect(metrics!.arrow.right).toBeLessThanOrEqual(metrics!.shell.right + 1);
      expect(metrics!.input.width).toBeGreaterThan(0);
      if (scenario.position === undefined) {
        if (scenario.direction === 'rtl') {
          expect(Math.abs(metrics!.arrow.left - metrics!.shell.left)).toBeLessThanOrEqual(1.5);
        } else {
          expect(Math.abs(metrics!.arrow.right - metrics!.shell.right)).toBeLessThanOrEqual(1.5);
        }
      } else {
        // Static flex layout keeps the arrow on its directional side.
        const midpoint = (metrics!.shell.left + metrics!.shell.right) / 2;
        if (scenario.direction === 'rtl') expect(metrics!.arrow.right).toBeLessThan(midpoint);
        else expect(metrics!.arrow.left).toBeGreaterThan(midpoint);
      }

      const arrow = host.locator('.dropdown-arrow-container');
      const beforeHover = await arrow.boundingBox();
      await arrow.hover();
      const afterHover = await arrow.boundingBox();
      expect(afterHover).not.toBeNull();
      expect(afterHover!.x).toBeCloseTo(beforeHover!.x, 1);
      expect(afterHover!.y).toBeCloseTo(beforeHover!.y, 1);
      expect(afterHover!.width).toBeCloseTo(beforeHover!.width, 1);
      expect(afterHover!.height).toBeCloseTo(beforeHover!.height, 1);
      await arrow.click();
      await expect(host).toHaveAttribute('data-open', 'true');
      await arrow.click();
      await expect(host).not.toHaveAttribute('data-open');
    });
  }

  test('relative works and a host override stays isolated to that instance', async ({ page }) => {
    await page.addStyleTag({ content: '.issue114-relative { --select-arrow-container-position: relative; }' });
    const first = await addSelect(page, { id: 'issue114-relative', position: 'relative' });
    await first.evaluate((element) => element.classList.add('issue114-relative'));
    await first.evaluate((element) => element.style.removeProperty('--select-arrow-container-position'));
    const second = await addSelect(page, { id: 'issue114-default' });
    await expect.poll(async () => (await arrowMetrics(first))?.position).toBe('relative');
    await expect.poll(async () => (await arrowMetrics(second))?.position).toBe('absolute');
  });

  test('dynamic set, change, and removal update computed style without rebuilding the select', async ({ page }) => {
    const host = await addSelect(page, { id: 'issue114-dynamic' });
    const position = () => arrowMetrics(host).then((metrics) => metrics?.position);
    await expect.poll(position).toBe('absolute');
    await host.evaluate((element) => element.style.setProperty('--select-arrow-container-position', 'static'));
    await expect.poll(position).toBe('static');
    await host.evaluate((element) => element.style.setProperty('--select-arrow-container-position', 'relative'));
    await expect.poll(position).toBe('relative');
    await host.evaluate((element) => element.style.removeProperty('--select-arrow-container-position'));
    await expect.poll(position).toBe('absolute');
  });

  test('clear control and horizontal multi-select keep their default action geometry and interactions', async ({ page }) => {
    const host = await addSelect(page, {
      id: 'issue114-horizontal-clear', mode: 'multi', clearControl: true, horizontal: true, width: 240,
    });
    await host.locator('.dropdown-arrow-container').click();
    await host.getByRole('option', { name: 'Alpha' }).click();
    await expect.poll(() => host.evaluate((element: any) => element.getSelectedValues())).toEqual(['alpha']);
    await expect(host).not.toHaveAttribute('data-open');
    const arrowRect = await host.locator('.dropdown-arrow-container').boundingBox();
    const clearRect = await host.locator('.clear-control-button').boundingBox();
    expect(arrowRect).not.toBeNull();
    expect(clearRect).not.toBeNull();
    expect(arrowRect!.x + arrowRect!.width).toBeLessThanOrEqual(clearRect!.x + 1.5);
    await host.locator('.clear-control-button').click();
    await expect.poll(() => host.evaluate((element: any) => element.getSelectedValues())).toEqual([]);
    await host.locator('.dropdown-arrow-container').click();
    await expect(host).not.toHaveAttribute('data-open');
  });

  test('a slotted arrow inherits the token and keeps Core arrow click behavior', async ({ page }) => {
    const host = await addSelect(page, { id: 'issue114-slotted', position: 'static', slottedArrow: true });
    await expect(host).toHaveAttribute('data-custom-arrow', 'true');
    await expect.poll(async () => (await arrowMetrics(host))?.position).toBe('static');
    await host.locator('[slot="arrow"]').click();
    await expect(host).toHaveAttribute('data-open', 'true');
  });
});
