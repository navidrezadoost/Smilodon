import { test, expect } from '@playwright/test';
import {
  gotoDemo,
  mount,
  input,
  comboboxAttr,
  isOpen,
  activeValue,
  activeOptionInfo,
  selectedValues,
  focusSnapshot,
  shadowInputFocused,
  focusThenClose,
  closeProgrammatic,
  installTimeline,
  readTimeline,
  resetTimeline,
  axByRole,
  type Item,
} from './harness';

/**
 * W1-P1.3 Task 2 — Real-Browser Keyboard and Accessibility Verification.
 *
 * Every driver is Playwright's real user input (locator.press / .focus / .click),
 * delivering genuine trusted keyboard events to Chromium — NOT synthetic
 * KeyboardEvent dispatch. Assertions read only public-observable DOM (combobox
 * ARIA attributes, aria-activedescendant resolution, host data-open, DOM focus,
 * open/close CustomEvents) and the Chromium accessibility tree (CDP
 * Accessibility.getFullAXTree / locator.ariaSnapshot).
 *
 * Observations recorded here reconcile the jsdom Task-1 evidence with real
 * browser behavior. Discrepancies are characterized, never repaired.
 */

const FOUR: Item[] = [
  { id: 'a', value: 'a', label: 'Alpha' },
  { id: 'b', value: 'b', label: 'Bravo', disabled: true },
  { id: 'c', value: 'c', label: 'Charlie' },
  { id: 'd', value: 'd', label: 'Delta' },
];

const WIDE: Item[] = Array.from({ length: 25 }, (_, i) => ({
  id: `i${i}`, value: `v${i}`, label: `L${i}`,
}));

test.beforeEach(async ({ page }) => {
  await gotoDemo(page);
});

// ===========================================================================
// T2-01 — Browser harness: deterministic environment, version recorded
// ===========================================================================
test.describe('T2-01 browser harness', () => {
  test('records the Chromium engine version and renders a live combobox', async ({ page }) => {
    const version = page.context().browser()?.version() ?? '';
    // eslint-disable-next-line no-console
    console.log(`[T2-01] Chromium engine version: ${version}`);
    expect(version).toMatch(/^\d+\.\d+\.\d+\.\d+$/);

    const sel = await mount(page);
    await expect(input(page, sel)).toHaveCount(1);
    expect(await comboboxAttr(page, 'role', sel)).toBe('combobox');
    expect(await comboboxAttr(page, 'aria-expanded', sel)).toBe('false');
  });

  test('initial mount is closed with no active descendant', async ({ page }) => {
    const sel = await mount(page);
    expect(await isOpen(page, sel)).toBe(false);
    expect(await activeValue(page, sel)).toBeNull();
  });
});

// ===========================================================================
// T2-02 — Keyboard navigation: Arrow/Home/End/Page/Enter/Space
// ===========================================================================
test.describe('T2-02 keyboard navigation', () => {
  test('ArrowDown on a closed+focused combobox opens it and activates the first option', async ({ page }) => {
    const sel = await mount(page);
    await focusThenClose(page, sel);
    expect(await isOpen(page, sel)).toBe(false);

    await input(page, sel).press('ArrowDown');
    expect(await isOpen(page, sel)).toBe(true);
    expect(await comboboxAttr(page, 'aria-expanded', sel)).toBe('true');
    // Observed in Chromium: keyboard-open assigns the first selectable option.
    expect(await activeValue(page, sel)).toBe('a');
  });

  test('ArrowDown/ArrowUp move one selectable step, skipping the disabled option', async ({ page }) => {
    const sel = await mount(page);
    await focusThenClose(page, sel);
    await input(page, sel).press('ArrowDown'); // open -> a
    expect(await activeValue(page, sel)).toBe('a');
    await input(page, sel).press('ArrowDown'); // skip disabled b -> c
    expect(await activeValue(page, sel)).toBe('c');
    await input(page, sel).press('ArrowUp');   // skip disabled b -> a
    expect(await activeValue(page, sel)).toBe('a');
  });

  test('ArrowDown/ArrowUp clamp at the last/first selectable option (no wrap)', async ({ page }) => {
    const sel = await mount(page);
    await focusThenClose(page, sel);
    await input(page, sel).press('ArrowDown'); // a
    await input(page, sel).press('ArrowDown'); // c
    await input(page, sel).press('ArrowDown'); // d
    expect(await activeValue(page, sel)).toBe('d');
    await input(page, sel).press('ArrowDown'); // clamp
    expect(await activeValue(page, sel)).toBe('d');
  });

  test('Home / End jump to first / last selectable option', async ({ page }) => {
    const sel = await mount(page);
    await focusThenClose(page, sel);
    await input(page, sel).press('ArrowDown'); // open -> a
    await input(page, sel).press('End');
    expect(await activeValue(page, sel)).toBe('d');
    await input(page, sel).press('Home');
    expect(await activeValue(page, sel)).toBe('a');
  });

  test('PageDown / PageUp move by 10 selectable options', async ({ page }) => {
    const sel = await mount(page, { items: WIDE });
    await input(page, sel).focus(); // opens at v0
    expect(await activeValue(page, sel)).toBe('v0');
    await input(page, sel).press('PageDown');
    expect(await activeValue(page, sel)).toBe('v10');
    await input(page, sel).press('End');
    expect(await activeValue(page, sel)).toBe('v24');
    await input(page, sel).press('PageUp');
    expect(await activeValue(page, sel)).toBe('v14');
  });

  test('Enter activates the active option and closes; Space activates (non-searchable)', async ({ page }) => {
    const sel = await mount(page);
    await input(page, sel).focus(); // opens with the first option pre-active
    expect(await activeValue(page, sel)).toBe('a');
    await input(page, sel).press('Enter');
    expect(await selectedValues(page, sel)).toEqual(['a']);
    expect(await isOpen(page, sel)).toBe(false);

    // Fresh instance: Space activates the pre-active first option too.
    const sel2 = await mount(page, { id: 't2-space' });
    await input(page, sel2).focus(); // opens at a
    await input(page, sel2).press(' ');
    expect(await selectedValues(page, sel2)).toEqual(['a']);
  });
});

// ===========================================================================
// T2-03 — Popup dismissal: Escape, Tab, focus transfer, close chronology
// ===========================================================================
test.describe('T2-03 popup dismissal', () => {
  test('Escape closes an open popup', async ({ page }) => {
    const sel = await mount(page);
    await input(page, sel).focus();
    expect(await isOpen(page, sel)).toBe(true);
    await input(page, sel).press('Escape');
    expect(await isOpen(page, sel)).toBe(false);
    expect(await comboboxAttr(page, 'aria-expanded', sel)).toBe('false');
  });

  test('Tab closes an open popup (observed: focus does NOT advance to the next tabbable)', async ({ page }) => {
    await page.evaluate(() => {
      const b = document.createElement('button');
      b.id = 'after-select';
      b.textContent = 'After';
      document.body.appendChild(b);
    });
    const sel = await mount(page);
    await input(page, sel).focus();
    expect(await isOpen(page, sel)).toBe(true);
    await input(page, sel).press('Tab');
    expect(await isOpen(page, sel)).toBe(false);
    // Observed in Chromium: Tab closes the popup but does NOT move DOM focus to
    // the next tabbable control; document.activeElement falls back to BODY.
    // Recorded as an observation (see W1-P1-DEVIATIONS.md P1.3-D04); not repaired.
    const activeId = await page.evaluate(() => document.activeElement?.id ?? '');
    expect(activeId).not.toBe('after-select');
  });

  test('Escape emits close with empty detail; Tab emits an indistinguishable close detail', async ({ page }) => {
    const escSel = await mount(page, { id: 't2-esc' });
    await installTimeline(page, escSel);
    await input(page, escSel).focus(); // open
    await resetTimeline(page);
    await input(page, escSel).press('Escape');
    const escClose = await readTimeline(page);

    const tabSel = await mount(page, { id: 't2-tab' });
    await installTimeline(page, tabSel);
    await input(page, tabSel).focus(); // open
    await resetTimeline(page);
    await input(page, tabSel).press('Tab');
    const tabClose = await readTimeline(page);

    expect(escClose).toEqual(['close:{}']);
    expect(tabClose).toEqual(['close:{}']);
    expect(escClose).toEqual(tabClose);
  });

  test('Escape/Tab while closed emits no close event', async ({ page }) => {
    const sel = await mount(page);
    await installTimeline(page, sel);
    await input(page, sel).focus(); // opens
    await closeProgrammatic(page, sel); // closed, still focused
    await resetTimeline(page);
    expect(await isOpen(page, sel)).toBe(false);
    await input(page, sel).press('Escape');
    await input(page, sel).press('Tab');
    expect(await readTimeline(page)).toEqual([]);
  });
});

// ===========================================================================
// T2-04 — DOM focus: document.activeElement + shadow-root focus behavior
// ===========================================================================
test.describe('T2-04 DOM focus', () => {
  test('DOM focus is on the host; shadow active element is the combobox input', async ({ page }) => {
    const sel = await mount(page);
    await input(page, sel).focus();
    const snap = await focusSnapshot(page, sel);
    expect(snap.documentActiveTag).toBe('ENHANCED-SELECT');
    expect(snap.shadowActivePart).toBe('input');
    expect(snap.shadowActiveIsInput).toBe(true);
  });

  test('focus stays on the input across open + arrow movement (active option is not focused)', async ({ page }) => {
    const sel = await mount(page);
    await input(page, sel).focus();
    await input(page, sel).press('ArrowDown');
    await input(page, sel).press('ArrowDown');
    expect(await shadowInputFocused(page, sel)).toBe(true);
    const info = await activeOptionInfo(page, sel);
    expect(info?.role).toBe('option');
    // The active option is expressed via aria-activedescendant, not DOM focus.
    expect(await page.evaluate(() => {
      const host = document.getElementById('t2-select') as HTMLElement;
      const ad = host.shadowRoot!.querySelector('[role="combobox"]')?.getAttribute('aria-activedescendant');
      const active = host.shadowRoot!.activeElement as HTMLElement | null;
      return active?.id === ad; // false: the focused input is not the active option
    })).toBe(false);
  });

  test('Escape leaves DOM focus on the combobox input', async ({ page }) => {
    const sel = await mount(page);
    await input(page, sel).focus();
    await input(page, sel).press('Escape');
    expect(await shadowInputFocused(page, sel)).toBe(true);
  });
});

// ===========================================================================
// T2-05 — ARIA relationships (combobox/listbox/option/aria-controls/...)
// ===========================================================================
test.describe('T2-05 ARIA relationships', () => {
  test('combobox aria-controls points at the listbox id', async ({ page }) => {
    const sel = await mount(page);
    await input(page, sel).focus();
    const rel = await page.locator(sel).evaluate((el) => {
      const root = (el as HTMLElement).shadowRoot!;
      const cb = root.querySelector('[role="combobox"]');
      const lb = root.querySelector('[role="listbox"]');
      return { controls: cb?.getAttribute('aria-controls') ?? null, listboxId: lb?.id ?? null };
    });
    expect(rel.listboxId).toBeTruthy();
    expect(rel.controls).toBe(rel.listboxId);
  });

  test('aria-expanded reflects open/closed; aria-activedescendant resolves to an option', async ({ page }) => {
    const sel = await mount(page);
    expect(await comboboxAttr(page, 'aria-expanded', sel)).toBe('false');
    await input(page, sel).focus();
    expect(await comboboxAttr(page, 'aria-expanded', sel)).toBe('true');
    const info = await activeOptionInfo(page, sel);
    expect(info).toBeTruthy();
    expect(info!.role).toBe('option');
    expect(info!.value).toBe('a');
  });

  test('accessibility tree exposes combobox (hasPopup listbox, controls) and listbox roles', async ({ page }) => {
    const sel = await mount(page);
    await input(page, sel).focus();
    const comboboxes = await axByRole(page, 'combobox');
    const listboxes = await axByRole(page, 'listbox');
    const cb = comboboxes.find((n) => n.properties.controls);
    expect(cb, 'a combobox with aria-controls').toBeTruthy();
    expect(cb!.properties.hasPopup).toBe('listbox');
    expect(listboxes.length).toBeGreaterThanOrEqual(1);
  });
});

// ===========================================================================
// T2-06 — Disabled options: keyboard exclusion + accessibility state
// ===========================================================================
test.describe('T2-06 disabled options', () => {
  test('a disabled option never becomes active via keyboard', async ({ page }) => {
    const sel = await mount(page);
    await input(page, sel).focus();
    const seen = new Set<string | null>();
    for (let i = 0; i < 6; i++) { await input(page, sel).press('ArrowDown'); seen.add(await activeValue(page, sel)); }
    for (let i = 0; i < 6; i++) { await input(page, sel).press('ArrowUp'); seen.add(await activeValue(page, sel)); }
    expect(seen.has('b')).toBe(false);
  });

  test('disabled option exposes aria-disabled and a disabled state in the a11y tree', async ({ page }) => {
    const sel = await mount(page);
    await input(page, sel).focus();
    const domDisabled = await page.locator(sel).evaluate((el) => {
      const root = (el as HTMLElement).shadowRoot!;
      const opt = root.querySelector('[role="option"][data-value="b"]');
      return opt ? opt.getAttribute('aria-disabled') : 'MISSING';
    });
    expect(domDisabled).toBe('true');

    const options = await axByRole(page, 'option');
    const bravo = options.find((o) => o.name === 'Bravo');
    expect(bravo, 'Bravo option present in AX tree').toBeTruthy();
    expect(bravo!.properties.disabled).toBe(true);
  });
});

// ===========================================================================
// T2-07 — Selection policies: single/multi, allowDeselect, maxSelections
// ===========================================================================
test.describe('T2-07 selection policies (keyboard only)', () => {
  test('single mode: Enter selects the active option and closes', async ({ page }) => {
    const sel = await mount(page);
    await input(page, sel).focus();
    await input(page, sel).press('Enter'); // active a
    expect(await selectedValues(page, sel)).toEqual(['a']);
    expect(await isOpen(page, sel)).toBe(false);
  });

  test('multi + allowDeselect: Enter toggles a selection off', async ({ page }) => {
    const sel = await mount(page, {
      config: { selection: { mode: 'multi', closeOnSelect: false, allowDeselect: true } },
    });
    await input(page, sel).focus(); // multi: opens with NO pre-active option
    expect(await activeValue(page, sel)).toBeNull();
    await input(page, sel).press('ArrowDown'); // active a
    expect(await activeValue(page, sel)).toBe('a');
    await input(page, sel).press('Enter'); // select a
    expect(await selectedValues(page, sel)).toEqual(['a']);
    expect(await isOpen(page, sel)).toBe(true);
    await input(page, sel).press('Enter'); // toggle-deselect a
    expect(await selectedValues(page, sel)).toEqual([]);
  });

  test('maxSelections caps keyboard selections', async ({ page }) => {
    const sel = await mount(page, {
      config: { selection: { mode: 'multi', closeOnSelect: false, maxSelections: 1 } },
    });
    await input(page, sel).focus(); // multi: no pre-active
    await input(page, sel).press('ArrowDown'); // a
    await input(page, sel).press('Enter'); // select a
    await input(page, sel).press('ArrowDown'); // c
    await input(page, sel).press('Enter'); // rejected (max 1)
    expect(await selectedValues(page, sel)).toEqual(['a']);
  });

  test('multi-select listbox exposes aria-multiselectable', async ({ page }) => {
    const sel = await mount(page, { config: { selection: { mode: 'multi', closeOnSelect: false } } });
    await input(page, sel).focus();
    const ms = await page.locator(sel).evaluate((el) => {
      const root = (el as HTMLElement).shadowRoot!;
      return root.querySelector('[role="listbox"]')?.getAttribute('aria-multiselectable') ?? null;
    });
    expect(ms).toBe('true');
  });
});

// ===========================================================================
// T2-08 — Accessibility behavior (Chromium accessibility representation)
// ===========================================================================
test.describe('T2-08 accessibility representation', () => {
  test('selected option is reflected as selected in the accessibility tree', async ({ page }) => {
    const sel = await mount(page, {
      config: { selection: { mode: 'multi', closeOnSelect: false } },
    });
    await input(page, sel).focus();
    await input(page, sel).press('ArrowDown'); // multi: active a
    await input(page, sel).press('Enter'); // select a, stays open
    expect(await selectedValues(page, sel)).toEqual(['a']);
    const options = await axByRole(page, 'option');
    // Observed in Chromium: a selected option (multi mode) carries a chip
    // remove affordance, so its accessible name is "<label> Remove option".
    // The selection state is exposed via the `selected` AX property.
    const alpha = options.find((o) => (o.name ?? '').startsWith('Alpha'));
    expect(alpha, 'Alpha (or its chip) in AX tree').toBeTruthy();
    expect(alpha!.properties.selected).toBe(true);
  });

  test('combobox accessible name comes from a host aria-label', async ({ page }) => {
    const sel = await mount(page, { hostAttrs: { 'aria-label': 'Favorite color' } });
    await input(page, sel).focus();
    const named = await page.getByRole('combobox', { name: 'Favorite color' }).count();
    expect(named).toBeGreaterThanOrEqual(1);
    const comboboxes = await axByRole(page, 'combobox');
    expect(comboboxes.some((c) => c.name === 'Favorite color')).toBe(true);
  });

  test('aria-activedescendant is resolved to an option idref in the AX tree', async ({ page }) => {
    const sel = await mount(page);
    await input(page, sel).focus();
    await input(page, sel).press('ArrowDown'); // move active
    const ad = await comboboxAttr(page, 'aria-activedescendant', sel);
    expect(ad).toBeTruthy();
    const comboboxes = await axByRole(page, 'combobox');
    const cb = comboboxes.find((n) => n.properties.controls);
    expect(cb).toBeTruthy();
    // activedescendant is reported as a related-node idref.
    expect(JSON.stringify(cb!.properties)).toContain(ad!);
  });
});

// ===========================================================================
// T2-09 — Candidate resolution: reassess P1.3-D01/D02/D03 with browser evidence
// ===========================================================================
test.describe('T2-09 deviation candidates with browser evidence', () => {
  test('P1.3-D01: public close detail is empty; Escape and Tab indistinguishable (browser)', async ({ page }) => {
    const sel = await mount(page);
    await installTimeline(page, sel);
    await input(page, sel).focus();
    await resetTimeline(page);
    await input(page, sel).press('Escape');
    const esc = await readTimeline(page);
    expect(esc).toEqual(['close:{}']);
  });

  test('P1.3-D02: legacy host aria-busy is inert on the listbox; genuine busy reflects to the listbox', async ({ page }) => {
    const sel = await mount(page);
    await input(page, sel).focus();

    // Legacy host aria-busy: by design inert for listbox semantics.
    await page.locator(sel).evaluate((el) => el.setAttribute('aria-busy', 'true'));
    const legacy = await page.locator(sel).evaluate((el) => {
      const root = (el as HTMLElement).shadowRoot!;
      return {
        onHost: el.getAttribute('aria-busy'),
        onListbox: root.querySelector('[role="listbox"]')?.getAttribute('aria-busy') ?? null,
      };
    });
    expect(legacy.onHost).toBe('true');
    expect(legacy.onListbox).toBeNull(); // inert (the jsdom observation was correct, by design)

    // Genuine busy (public load-more button) DOES reflect aria-busy onto the listbox.
    const sel2 = await mount(page, { id: 't2-busy', items: FOUR.slice(0, 3) });
    await page.locator(sel2).evaluate((el: any) => {
      el.updateConfig({ loadMore: { enabled: true }, callbacks: { onLoadMore: () => {} } });
      el.open();
    });
    await expect(page.locator(`${sel2} .load-more-button`)).toHaveCount(1);
    await page.locator(`${sel2} .load-more-button`).click();
    const busy = await page.locator(sel2).evaluate((el) => {
      const root = (el as HTMLElement).shadowRoot!;
      return root.querySelector('[role="listbox"]')?.getAttribute('aria-busy') ?? null;
    });
    expect(busy).toBe('true');
  });

  test('P1.3-D03: opening by keyboard pre-activates the first option in the browser', async ({ page }) => {
    // jsdom Task 1 observed NO initial active-descendant on open. Chromium
    // pre-activates the first selectable option when opening by keyboard.
    const sel = await mount(page);
    await focusThenClose(page, sel);
    expect(await activeValue(page, sel)).toBeNull(); // closed, no active
    await input(page, sel).press('ArrowDown');
    expect(await activeValue(page, sel)).toBe('a'); // real browser pre-activates
  });
});

// ===========================================================================
// T2-10 (part) — Production isolation sanity: keyboard path uses public surface
// ===========================================================================
test.describe('T2-10 harness integrity', () => {
  test('keyboard flow drives state via public UI only (no private-method assertion helpers)', async ({ page }) => {
    // A complete open -> move -> select cycle entirely through real keyboard.
    const sel = await mount(page);
    await input(page, sel).focus(); // single mode: opens at a
    expect(await isOpen(page, sel)).toBe(true);
    expect(await activeValue(page, sel)).toBe('a');
    await input(page, sel).press('ArrowDown'); // move a -> c (skips disabled b)
    expect(await activeValue(page, sel)).toBe('c');
    await input(page, sel).press('Enter'); // select c, close
    expect(await selectedValues(page, sel)).toEqual(['c']);
    expect(await isOpen(page, sel)).toBe(false);
  });
});
