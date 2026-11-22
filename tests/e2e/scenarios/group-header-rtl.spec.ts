import { expect, test } from '@playwright/test';

const demo = 'http://localhost:5173/vanilla-demo.html';

async function mount(page: import('@playwright/test').Page, id: string, direction: 'ltr' | 'rtl', custom = false) {
  await page.evaluate(async ({ id, direction, custom }) => {
    await customElements.whenDefined('enhanced-select');
    const select = document.createElement('enhanced-select') as any;
    select.id = id;
    select.style.setProperty('--select-dropdown-animation', 'none');
    select.updateConfig({ direction });
    if (custom) {
      select.groupHeaderRenderer = (group: { label: string }) => {
        const header = document.createElement('div');
        header.textContent = group.label;
        return header;
      };
    }
    document.body.append(select);
    select.setGroupedItems([{ label: 'Fruits', options: [
      { value: 'apple', label: 'Apple' },
      { value: 'pear', label: 'Pear' },
    ] }]);
    select.open();
  }, { id, direction, custom });
  return page.locator(`#${id}`);
}

async function expectAlignment(
  header: import('@playwright/test').Locator,
  direction: 'ltr' | 'rtl',
  alignment: 'left' | 'right' | 'center',
) {
  await expect.poll(() => header.evaluate((node) => getComputedStyle(node).direction)).toBe(direction);
  const geometry = await header.evaluate((node) => {
    const text = node.firstChild;
    if (!text || text.nodeType !== Node.TEXT_NODE) throw new Error('Expected header text node');
    const range = document.createRange();
    range.selectNodeContents(text);
    const rect = range.getBoundingClientRect();
    const box = node.getBoundingClientRect();
    return { textLeft: rect.left, textRight: rect.right, textCenter: (rect.left + rect.right) / 2,
      boxLeft: box.left, boxRight: box.right, boxCenter: (box.left + box.right) / 2,
      position: getComputedStyle(node).position, textAlign: getComputedStyle(node).textAlign };
  });
  expect(geometry.position).toBe('sticky');
  if (alignment === 'left') expect(Math.abs(geometry.textLeft - (geometry.boxLeft + 12))).toBeLessThan(2);
  if (alignment === 'right') expect(Math.abs(geometry.textRight - (geometry.boxRight - 12))).toBeLessThan(2);
  if (alignment === 'center') expect(Math.abs(geometry.textCenter - geometry.boxCenter)).toBeLessThan(1);
}

test.describe('RTL group header alignment (#115)', () => {
  test('default and custom headers follow LTR/RTL direction', async ({ page }) => {
    await page.goto(demo);
    for (const [id, direction, custom, alignment] of [
      ['group-ltr-default', 'ltr', false, 'left'],
      ['group-rtl-default', 'rtl', false, 'right'],
      ['group-ltr-custom', 'ltr', true, 'left'],
      ['group-rtl-custom', 'rtl', true, 'right'],
    ] as const) {
      const select = await mount(page, id, direction, custom);
      const header = select.locator('[part="group-header"]');
      await expect(header).toBeVisible();
      await expectAlignment(header, direction, alignment);
      await select.getByRole('option', { name: 'Apple' }).click();
      await expect.poll(() => select.evaluate((node: any) => node.getSelectedValues())).toEqual(['apple']);
      await select.evaluate((node) => node.remove());
    }
  });

  test('explicit alignment tokens override logical start', async ({ page }) => {
    await page.goto(demo);
    const cases = [
      { id: 'group-rtl-left', direction: 'rtl' as const, token: 'left', expected: 'left' as const },
      { id: 'group-ltr-right', direction: 'ltr' as const, token: 'right', expected: 'right' as const },
      { id: 'group-rtl-center', direction: 'rtl' as const, token: 'center', expected: 'center' as const },
    ];
    for (const scenario of cases) {
      const select = await mount(page, scenario.id, scenario.direction);
      await select.evaluate((node, token) => node.style.setProperty('--select-group-header-text-align', token), scenario.token);
      await expectAlignment(select.locator('[part="group-header"]'), scenario.direction, scenario.expected);
      await select.evaluate((node) => node.remove());
    }
  });

  test('dynamic direction changes update the default alignment', async ({ page }) => {
    await page.goto(demo);
    const select = await mount(page, 'group-dynamic-direction', 'ltr');
    const header = select.locator('[part="group-header"]');
    await expectAlignment(header, 'ltr', 'left');
    await select.evaluate((node: any) => node.updateConfig({ direction: 'rtl' }));
    await expectAlignment(header, 'rtl', 'right');
    await select.evaluate((node: any) => node.updateConfig({ direction: 'ltr' }));
    await expectAlignment(header, 'ltr', 'left');
    await select.evaluate((node) => node.remove());
  });

  test('configuration owns direction when dir is present before connection', async ({ page }) => {
    await page.goto(demo);
    await page.evaluate(async () => {
      await customElements.whenDefined('enhanced-select');
      const select = document.createElement('enhanced-select') as any;
      select.id = 'group-dir-before-connect';
      select.setAttribute('dir', 'rtl');
      document.body.append(select);
      select.setGroupedItems([{ label: 'Fruits', options: [{ value: 'apple', label: 'Apple' }] }]);
      select.open();
    });
    const select = page.locator('#group-dir-before-connect');
    const header = select.locator('[part="group-header"]');
    // connectedCallback mirrors the configured default (LTR) onto the host.
    await expectAlignment(header, 'ltr', 'left');
    await select.evaluate((node: any) => node.updateConfig({ direction: 'rtl' }));
    await expectAlignment(header, 'rtl', 'right');
  });

  test('dir set after connection affects layout until the next config sync', async ({ page }) => {
    await page.goto(demo);
    const select = await mount(page, 'group-dir-after-connect', 'ltr');
    const header = select.locator('[part="group-header"]');
    await select.evaluate((node) => node.setAttribute('dir', 'rtl'));
    await expectAlignment(header, 'rtl', 'right');
    await select.evaluate((node: any) => node.updateConfig({ direction: 'ltr' }));
    await expectAlignment(header, 'ltr', 'left');
    await select.evaluate((node) => node.remove());
  });
});
