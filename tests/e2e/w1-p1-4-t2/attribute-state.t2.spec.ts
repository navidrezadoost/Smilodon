import { test, expect } from '@playwright/test';
import {
  FOUR, assignCustomArrow, countPart, countVirtualSpacers, dropdownDisplay,
  dropdownMotion, gotoDemo, hostCustomArrow, hostDisplay, mount, open, reconnect,
  setHostDisplay,
} from './harness';

/**
 * W1-P1.4 Task 2 — Attribute & state-marker behavior in a real browser
 * (ATTR-012 / ATTR-013 / ATTR-021 / ATTR-023-negative).
 *
 * The jsdom Task-2 spec covers ATTR-012/013/022 against the open shadow tree.
 * This browser spec covers the subset whose oracle is real layout / real
 * computed animation:
 *   ATTR-021  `data-motion="closing"` set on the popup during the exit
 *             transition and removed once it completes. jsdom resolves no
 *             animation-name (duration 0), so this is only observable with a
 *             real computed `dropdownExit` animation — hence Chromium;
 *   ATTR-012  custom-arrow marker confirmed under real slot flattening;
 *   ATTR-013  forced host display:block confirmed on connect, and reconnect
 *             overwrites a conflicting caller-set inline display;
 *   ATTR-023  NEGATIVE, bounded to a 2,000-item + virtualize:true public
 *             configuration: `[data-virtual-spacer]` is absent at a settled
 *             completed-render checkpoint (documented gap — the guarded
 *             virtualizer is only reachable via a private seam).
 *
 * Public surface only. No private fields/methods.
 */

const BIG = Array.from({ length: 2000 }, (_, i) => ({
  id: `i${i}`,
  value: `v${i}`,
  label: `Item ${i}`,
}));

test.describe('W1-P1.4 T2 — attribute & state markers in a real browser', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDemo(page);
  });

  test('ATTR-021: close() sets data-motion="closing" during exit then removes it', async ({ page }) => {
    await mount(page);
    await open(page);
    await expect.poll(() => countPart(page, 'option')).toBe(FOUR.length);
    expect(await dropdownMotion(page)).toBeNull();

    // Capture the transient marker synchronously inside the close() turn.
    const motionAtClose = await page.locator('#p14-select').evaluate((el: any) => {
      el.close();
      const dropdown = el.shadowRoot?.querySelector('[part="listbox"]');
      return dropdown?.getAttribute('data-motion') ?? null;
    });
    expect(motionAtClose).toBe('closing');

    // Once the exit animation completes the marker and panel are cleared.
    await expect.poll(() => dropdownMotion(page)).toBeNull();
    expect(await dropdownDisplay(page)).toBe('none');
  });

  test('ATTR-021: opening does not carry data-motion="closing" (negative)', async ({ page }) => {
    await mount(page);
    await open(page);
    await expect.poll(() => countPart(page, 'option')).toBe(FOUR.length);
    expect(await dropdownMotion(page)).toBeNull();
  });

  test('ATTR-012: custom arrow assignment via real slots toggles data-custom-arrow', async ({ page }) => {
    await mount(page);
    expect(await hostCustomArrow(page)).toBeNull();
    await assignCustomArrow(page, true);
    await expect.poll(() => hostCustomArrow(page)).toBe('true');
    await assignCustomArrow(page, false);
    await expect.poll(() => hostCustomArrow(page)).toBeNull();
  });

  test('ATTR-013: host display:block is forced on connect and re-asserted on reconnect', async ({ page }) => {
    await mount(page);
    expect(await hostDisplay(page)).toBe('block');

    // Write a conflicting caller value between lives, then force a re-connection.
    // The reconnect must overwrite that value back to "block" (DEVIATION-05).
    await setHostDisplay(page, 'inline-block');
    expect(await hostDisplay(page)).toBe('inline-block');
    await reconnect(page);
    await expect.poll(() => hostDisplay(page)).toBe('block');
  });

  test('ATTR-023: no data-virtual-spacer renders on the public surface for a large list (gap)', async ({ page }) => {
    // Bounded to this exact public configuration: 2,000 items + virtualize:true,
    // driven only through public methods. This asserts ABSENCE at a settled
    // checkpoint; it does not claim universal unreachability (see evidence gap).
    await mount(page, { items: BIG, config: { virtualize: true } });
    await open(page);

    // Observable synchronization (no arbitrary sleep): the public render path
    // is non-windowing and settles only after every item is rendered. Wait for
    // that completed-render state — exactly BIG.length options — then read.
    await expect.poll(() => countPart(page, 'option'), { timeout: 10_000 }).toBe(BIG.length);
    expect(await countVirtualSpacers(page)).toBe(0);

    // Drive a full scroll cycle on the options container (public DOM gesture),
    // then synchronize on the render still being complete and stable.
    const listbox = page.locator('#p14-select');
    await listbox.evaluate((el) => {
      const dropdown = el.shadowRoot?.querySelector('[part="listbox"]') as HTMLElement | null;
      if (dropdown) dropdown.scrollTop = 2000;
    });
    await expect.poll(() => countPart(page, 'option'), { timeout: 10_000 }).toBe(BIG.length);
    expect(await countVirtualSpacers(page)).toBe(0);
  });
});
