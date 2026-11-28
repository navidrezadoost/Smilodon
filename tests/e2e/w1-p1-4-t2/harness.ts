import type { Page } from '@playwright/test';

/**
 * W1-P1.4 Task 2 shared harness — Part-Token rendering in a real browser.
 *
 * Mirrors the accepted W1-P1.3-T2 harness: mounts real `<enhanced-select>` on
 * the vanilla demo page, drives it ONLY through public methods/DOM, and reads
 * ONLY the open shadow root's `[part="…"]` elements. No private fields or
 * private methods are touched.
 *
 * Scope of this browser task (T1-05): rendered behavior jsdom cannot establish
 * reliably — real layout/ownership of parts in an actual shadow tree.
 */

export const VANILLA_URL = 'http://localhost:5173/vanilla-demo.html';

export const DEFAULT_ID = 'p14-select';

export type Item = { id: string; value: string; label: string; disabled?: boolean };

export const FOUR: Item[] = [
  { id: 'a', value: 'a', label: 'Alpha' },
  { id: 'b', value: 'b', label: 'Bravo', disabled: true },
  { id: 'c', value: 'c', label: 'Charlie' },
  { id: 'd', value: 'd', label: 'Delta' },
];

export async function gotoDemo(page: Page): Promise<void> {
  await page.goto(VANILLA_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(async () => {
    await customElements.whenDefined('enhanced-select');
    await customElements.whenDefined('select-option');
    document.body.innerHTML = '';
  });
}

/** Mount one element, apply config, items, then return its selector. */
export async function mount(
  page: Page,
  opts: { items?: Item[]; config?: Record<string, unknown>; id?: string } = {},
): Promise<string> {
  const id = opts.id ?? DEFAULT_ID;
  const items = opts.items ?? FOUR;
  const config = opts.config ?? {};
  await page.evaluate(
    ({ id, items, config }) => {
      document.getElementById(id)?.remove();
      const el = document.createElement('enhanced-select') as any;
      el.id = id;
      document.body.appendChild(el);
      if (typeof el.updateConfig === 'function' && Object.keys(config).length) el.updateConfig(config);
      el.setItems(items);
    },
    { id, items, config },
  );
  return `#${id}`;
}

/** Open the popup via the public method. */
export async function open(page: Page, sel = `#${DEFAULT_ID}`): Promise<void> {
  await page.locator(sel).evaluate((el: any) => el.open());
}

/** Select values via the public method (multi support). */
export async function setSelectedValues(
  page: Page,
  values: unknown[],
  sel = `#${DEFAULT_ID}`,
): Promise<void> {
  await page.locator(sel).evaluate((el: any, v) => el.setSelectedValues(v), values);
}

/** Set grouped items via the public method. */
export async function setGroupedItems(
  page: Page,
  groups: Array<{ label: string; options: Item[] }>,
  sel = `#${DEFAULT_ID}`,
): Promise<void> {
  await page.locator(sel).evaluate((el: any, g) => el.setGroupedItems(g), groups);
}

/** Whether a `[part="…"]` element exists inside the open shadow root. */
export async function hasPart(page: Page, part: string, sel = `#${DEFAULT_ID}`): Promise<boolean> {
  return page.locator(sel).evaluate(
    (el, p) => !!el.shadowRoot?.querySelector(`[part="${p}"]`),
    part,
  );
}

/** Count of `[part="…"]` elements inside the open shadow root. */
export async function countPart(page: Page, part: string, sel = `#${DEFAULT_ID}`): Promise<number> {
  return page.locator(sel).evaluate(
    (el, p) => el.shadowRoot?.querySelectorAll(`[part="${p}"]`).length ?? 0,
    part,
  );
}

/** Whether a `[part="…"]` element exists in the host light DOM (should be false). */
export async function hasLightPart(page: Page, part: string, sel = `#${DEFAULT_ID}`): Promise<boolean> {
  return page.locator(sel).evaluate((el, p) => !!el.querySelector(`[part="${p}"]`), part);
}

/** True when the shadow root of the host is a real, populated shadow tree. */
export async function hasShadowRoot(page: Page, sel = `#${DEFAULT_ID}`): Promise<boolean> {
  return page.locator(sel).evaluate((el) => {
    const sr = el.shadowRoot;
    return !!sr && sr.childElementCount > 0;
  });
}
