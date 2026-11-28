/**
 * W1-P1.3 Task 3 — Keyboard Selection Edge Cases and Accessibility Contract
 * Reconciliation (real Chromium, genuine trusted input).
 *
 * Characterizes range selection (Shift+Arrow / Shift+Home/End / Ctrl+Shift),
 * Select-All (Ctrl/Cmd+A), selected-first ordering, disabled-in-range and
 * maxSelections behavior, plus the ARIA + event chronology of keyboard range
 * interactions. Observed behavior is recorded as-is; unusual semantics are
 * noted as deviation candidates, NOT normalized to a presumed WAI-ARIA model,
 * and NOT repaired.
 *
 * Discovery basis: live probe in Chrome-for-Testing 156.0.8078.4 (2026-11-28).
 */
import { test, expect } from '@playwright/test';
import {
  gotoDemo,
  mount,
  input,
  isOpen,
  selectedValues,
  activeValue,
  comboboxAttr,
  focusThenClose,
  CERTIFIED_CHROMIUM,
  optionDomOrder,
  installEventLog,
  readEvents,
  resetEvents,
  lastChangeIndices,
  lastChangeValues,
  eventNames,
  type Item,
} from './harness.t3';

const SIX: Item[] = [
  { id: 'a', value: 'a', label: 'Alpha' },
  { id: 'b', value: 'b', label: 'Bravo' },
  { id: 'c', value: 'c', label: 'Charlie' },
  { id: 'd', value: 'd', label: 'Delta' },
  { id: 'e', value: 'e', label: 'Echo' },
  { id: 'f', value: 'f', label: 'Foxtrot' },
];

const MULTI = { selection: { mode: 'multi' } } as const;

test.beforeEach(async ({ page }) => {
  await gotoDemo(page);
});

/** Open a focused-but-closed multi combobox and press ArrowDown so it is open
 *  (in a real browser this pre-activates the first selectable option). */
async function openMulti(page: any, opts: { items?: Item[]; config?: any } = {}) {
  const sel = await mount(page, { items: opts.items ?? SIX, config: opts.config ?? MULTI });
  await focusThenClose(page, sel);
  await input(page, sel).press('ArrowDown');
  return sel;
}

test.describe('T3-00 browser harness (version certification)', () => {
  test('records and enforces the certified Chromium engine for T3', async ({ page }) => {
    const version = page.context().browser()?.version() ?? '';
    const override = process.env.SMILODON_T2_CHROMIUM;
    // eslint-disable-next-line no-console
    console.log(`[T3-00] Chromium engine version: ${version}${override ? ` (override: ${override})` : ''}`);
    expect(version).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
    if (!override) {
      expect(version, 'certification requires the recorded Chromium build').toBe(CERTIFIED_CHROMIUM);
    } else {
      expect(version.startsWith('1'), 'override run reuses a Chromium-family build').toBe(true);
    }
  });
});

test.describe('T3-01 Shift+Arrow range selection', () => {
  test('Shift+Down from no active selects the landing option, then extends by one', async ({ page }) => {
    const sel = await openMulti(page);
    expect(await activeValue(page, sel)).toBeNull(); // empty multi opens with no active
    await input(page, sel).press('Shift+ArrowDown');
    expect(await activeValue(page, sel)).toBe('a');
    expect(await selectedValues(page, sel)).toEqual(['a']);
    await input(page, sel).press('Shift+ArrowDown');
    expect(await activeValue(page, sel)).toBe('b');
    expect(await selectedValues(page, sel)).toEqual(['a', 'b']);
    await input(page, sel).press('Shift+ArrowDown');
    expect(await selectedValues(page, sel)).toEqual(['a', 'b', 'c']);
  });

  test('Shift+Up extends upward; selection is reported in registry (ascending) order', async ({ page }) => {
    const sel = await openMulti(page);
    // move to c first (plain arrows), then shift-select up
    await input(page, sel).press('ArrowDown'); // a
    await input(page, sel).press('ArrowDown'); // b
    await input(page, sel).press('ArrowDown'); // c
    await input(page, sel).press('Shift+ArrowUp'); // c..b
    expect(await selectedValues(page, sel)).toEqual(['b', 'c']);
    await input(page, sel).press('Shift+ArrowUp'); // c..a
    expect(await selectedValues(page, sel)).toEqual(['a', 'b', 'c']);
  });

  test('plain (non-Shift) Arrow does not change selection', async ({ page }) => {
    const sel = await openMulti(page);
    await input(page, sel).press('ArrowDown');
    await input(page, sel).press('ArrowDown');
    expect(await selectedValues(page, sel)).toEqual([]);
    expect(await activeValue(page, sel)).toBe('b');
  });
});

test.describe('T3-02 Shift+Home / Shift+End boundary semantics', () => {
  // Observed (Chrome 156): Shift+Home/End selects ONLY the boundary endpoint,
  // it does NOT select the full contiguous range to the boundary. Recorded as
  // deviation candidate P1.3-D05 (endpoint-only boundary range), NOT repaired.
  test('Shift+End from a mid option selects only the last option (endpoint-only)', async ({ page }) => {
    const sel = await openMulti(page);
    await input(page, sel).press('ArrowDown'); // a
    await input(page, sel).press('ArrowDown'); // b
    expect(await activeValue(page, sel)).toBe('b');
    await input(page, sel).press('Shift+End');
    expect(await activeValue(page, sel)).toBe('f');
    expect(await selectedValues(page, sel)).toEqual(['f']); // endpoint only, NOT a..f
  });

  test('Shift+Home from a mid option selects only the first option (endpoint-only)', async ({ page }) => {
    const sel = await openMulti(page);
    await input(page, sel).press('ArrowDown'); // a
    await input(page, sel).press('ArrowDown'); // b
    await input(page, sel).press('Shift+Home');
    expect(await activeValue(page, sel)).toBe('a');
    expect(await selectedValues(page, sel)).toEqual(['a']); // endpoint only
  });

  test('Shift+Home then Shift+End reports each endpoint (documented sequence)', async ({ page }) => {
    const sel = await openMulti(page);
    await input(page, sel).press('ArrowDown'); // a
    await input(page, sel).press('ArrowDown'); // b
    await input(page, sel).press('ArrowDown'); // c
    await input(page, sel).press('Shift+Home');
    expect(await selectedValues(page, sel)).toEqual(['a']);
    await input(page, sel).press('Shift+End');
    expect(await selectedValues(page, sel)).toEqual(['f']);
  });
});

test.describe('T3-03 Ctrl/Cmd+Shift additive range', () => {
  test('Ctrl+Shift+Down extends the range additively (preserves prior)', async ({ page }) => {
    const sel = await openMulti(page);
    await input(page, sel).press('Shift+ArrowDown'); // [a]
    expect(await selectedValues(page, sel)).toEqual(['a']);
    await input(page, sel).press('Control+Shift+ArrowDown');
    expect(await selectedValues(page, sel)).toEqual(['a', 'b']);
    await input(page, sel).press('Control+Shift+ArrowDown');
    expect(await selectedValues(page, sel)).toEqual(['a', 'b', 'c']);
  });

  test('Cmd+Shift+Down behaves like Ctrl+Shift+Down (Meta additive)', async ({ page }) => {
    const sel = await openMulti(page);
    await input(page, sel).press('Shift+ArrowDown'); // [a]
    await input(page, sel).press('Meta+Shift+ArrowDown');
    expect(await selectedValues(page, sel)).toEqual(['a', 'b']);
  });

  test('plain Shift replaces a pre-existing selection (clear=on)', async ({ page }) => {
    // Pre-existing selection {e}; open lands active on e (selected-first-off default keeps registry order)
    const sel = await mount(page, { items: SIX, config: MULTI });
    await page.locator(sel).evaluate((el: any) => el.setSelectedValues(['e']));
    await focusThenClose(page, sel);
    await input(page, sel).press('ArrowDown'); // active e
    await input(page, sel).press('ArrowDown'); // active f
    await input(page, sel).press('Shift+ArrowDown'); // shift from f -> {f} replaces {e}
    expect(await selectedValues(page, sel)).toEqual(['f']);
  });
});

test.describe('T3-04 Ctrl/Cmd+A select-all payload', () => {
  test('Ctrl+A selects all and emits only change (no select) with registry-ordered payload', async ({ page }) => {
    const sel = await mount(page, { items: SIX, config: MULTI });
    await installEventLog(page, sel);
    await focusThenClose(page, sel);
    await input(page, sel).press('ArrowDown');
    await resetEvents(page);
    await input(page, sel).press('Control+a');
    expect(await selectedValues(page, sel)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    const events = await readEvents(page);
    const names = eventNames(events);
    expect(names).not.toContain('select'); // select-all is change-only
    expect(names).toContain('change');
    expect(lastChangeValues(events)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    expect(lastChangeIndices(events)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  test('Cmd+A selects all (Meta)', async ({ page }) => {
    const sel = await openMulti(page);
    await input(page, sel).press('Meta+a');
    expect(await selectedValues(page, sel)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  });

  test('Ctrl+A is ignored in single mode', async ({ page }) => {
    const sel = await mount(page, { items: SIX, config: { selection: { mode: 'single' } } });
    await focusThenClose(page, sel);
    await input(page, sel).press('ArrowDown');
    await input(page, sel).press('Control+a');
    expect(await selectedValues(page, sel)).toEqual([]);
  });
});

test.describe('T3-05 selected-first projection ordering', () => {
  // Observed (Chrome 156): selectedOptions.placement='selected-first' does NOT
  // reorder the DOM option list (stays registry order) and keyboard navigation
  // follows registry order (open lands on the selected key, then moves through
  // registry order). Recorded as observation P1.3-D06; NOT a visual reorder.
  test('selected-first keeps DOM option order at registry order with a selection', async ({ page }) => {
    const sel = await mount(page, {
      items: SIX,
      config: { selection: { mode: 'multi' }, selectedOptions: { placement: 'selected-first' } },
    });
    await page.locator(sel).evaluate((el: any) => el.setSelectedValues(['e', 'c']));
    await focusThenClose(page, sel);
    await input(page, sel).press('ArrowDown');
    expect(await optionDomOrder(page, sel)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    // navigation is registry order: open on c (first selected in registry order), then d, e
    expect(await activeValue(page, sel)).toBe('c');
    await input(page, sel).press('ArrowDown');
    expect(await activeValue(page, sel)).toBe('d');
    await input(page, sel).press('ArrowDown');
    expect(await activeValue(page, sel)).toBe('e');
  });

  test('original placement also navigates registry order (baseline comparison)', async ({ page }) => {
    const sel = await mount(page, {
      items: SIX,
      config: { selection: { mode: 'multi' }, selectedOptions: { placement: 'original' } },
    });
    await page.locator(sel).evaluate((el: any) => el.setSelectedValues(['e', 'c']));
    await focusThenClose(page, sel);
    await input(page, sel).press('ArrowDown');
    expect(await optionDomOrder(page, sel)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    expect(await activeValue(page, sel)).toBe('c');
  });
});

test.describe('T3-06 disabled options in ranges', () => {
  const withDisabledB: Item[] = [
    { id: 'a', value: 'a', label: 'Alpha' },
    { id: 'b', value: 'b', label: 'Bravo', disabled: true },
    { id: 'c', value: 'c', label: 'Charlie' },
    { id: 'd', value: 'd', label: 'Delta' },
  ];

  test('Shift range skips disabled (non-selectable) options in the fill', async ({ page }) => {
    const sel = await openMulti(page, { items: withDisabledB });
    await input(page, sel).press('Shift+ArrowDown'); // a
    expect(await selectedValues(page, sel)).toEqual(['a']);
    await input(page, sel).press('Shift+ArrowDown'); // b disabled -> lands c, fill a..c excludes b
    expect(await activeValue(page, sel)).toBe('c');
    expect(await selectedValues(page, sel)).toEqual(['a', 'c']);
    await input(page, sel).press('Shift+ArrowDown'); // d
    expect(await selectedValues(page, sel)).toEqual(['a', 'c', 'd']);
  });

  test('Shift range includes disabled options when disabledOptionBehavior.selectable=true', async ({ page }) => {
    const sel = await openMulti(page, {
      items: withDisabledB,
      config: {
        selection: {
          mode: 'multi',
          disabledOptionBehavior: { selectable: true, hoverable: true, focusable: true },
        },
      },
    });
    await input(page, sel).press('Shift+ArrowDown'); // a
    await input(page, sel).press('Shift+ArrowDown'); // b (now selectable) -> a,b
    expect(await selectedValues(page, sel)).toEqual(['a', 'b']);
  });
});

test.describe('T3-07 maxSelections during keyboard range', () => {
  test('Shift range clamps at maxSelections', async ({ page }) => {
    const sel = await openMulti(page, { config: { selection: { mode: 'multi', maxSelections: 2 } } });
    await input(page, sel).press('Shift+ArrowDown'); // [a]
    await input(page, sel).press('Shift+ArrowDown'); // [a,b]
    expect(await selectedValues(page, sel)).toEqual(['a', 'b']);
    await input(page, sel).press('Shift+ArrowDown'); // clamp at 2
    expect(await selectedValues(page, sel)).toEqual(['a', 'b']);
    await input(page, sel).press('Shift+End'); // still clamp
    expect(await selectedValues(page, sel)).toEqual(['a', 'b']);
  });
});

test.describe('T3-08 ARIA chronology during range selection', () => {
  test('aria-expanded stays true; aria-activedescendant tracks the moving endpoint', async ({ page }) => {
    const sel = await openMulti(page);
    expect(await comboboxAttr(page, 'aria-expanded', sel)).toBe('true');
    await input(page, sel).press('Shift+ArrowDown');
    const ad1 = await comboboxAttr(page, 'aria-activedescendant', sel);
    expect(ad1).toBeTruthy();
    expect(await activeValue(page, sel)).toBe('a');
    await input(page, sel).press('Shift+ArrowDown');
    const ad2 = await comboboxAttr(page, 'aria-activedescendant', sel);
    expect(ad2).toBeTruthy();
    expect(ad2).not.toBe(ad1);
    expect(await comboboxAttr(page, 'aria-expanded', sel)).toBe('true');
    expect(await isOpen(page, sel)).toBe(true);
  });

  test('selected options reflect aria-selected=true after a range', async ({ page }) => {
    const sel = await openMulti(page);
    await input(page, sel).press('Shift+ArrowDown'); // a
    await input(page, sel).press('Shift+ArrowDown'); // a,b
    const ariaSelected = await page.locator(sel).evaluate((el) => {
      const root = (el as HTMLElement).shadowRoot!;
      const map: Record<string, string | null> = {};
      for (const o of Array.from(root.querySelectorAll('[role="option"]'))) {
        map[o.getAttribute('data-value') ?? ''] = o.getAttribute('aria-selected');
      }
      return map;
    });
    expect(ariaSelected.a).toBe('true');
    expect(ariaSelected.b).toBe('true');
    expect(ariaSelected.c).toBe('false');
  });
});

test.describe('T3-09 event chronology during keyboard range', () => {
  test('each Shift extension emits select, then change (+onChange), then onSelect', async ({ page }) => {
    const sel = await mount(page, { items: SIX, config: MULTI });
    await installEventLog(page, sel);
    await focusThenClose(page, sel);
    await input(page, sel).press('ArrowDown');
    await resetEvents(page);
    await input(page, sel).press('Shift+ArrowDown'); // select a
    let events = await readEvents(page);
    // Observed order: select -> change -> onChange -> onSelect (the range path
    // emits select first, then _emitChange triggers change+onChange, then the
    // range handler invokes onSelect last).
    expect(eventNames(events)).toEqual(['select', 'change', 'onChange', 'onSelect']);
    await resetEvents(page);
    await input(page, sel).press('Shift+ArrowDown'); // extend to b
    events = await readEvents(page);
    expect(eventNames(events)).toEqual(['select', 'change', 'onChange', 'onSelect']);
    // select detail is the moving endpoint (b), selected true, multi true
    const selectLine = events.find((e) => e.startsWith('select:'))!;
    const detail = JSON.parse(selectLine.slice('select:'.length));
    expect(detail.value).toBe('b');
    expect(detail.selected).toBe(true);
    expect(detail.multi).toBe(true);
  });

  test('range does not emit open/close (popup stays open through the range)', async ({ page }) => {
    const sel = await mount(page, { items: SIX, config: MULTI });
    await installEventLog(page, sel);
    await focusThenClose(page, sel);
    await input(page, sel).press('ArrowDown');
    await resetEvents(page);
    await input(page, sel).press('Shift+ArrowDown');
    await input(page, sel).press('Shift+ArrowDown');
    const names = eventNames(await readEvents(page));
    expect(names).not.toContain('open');
    expect(names).not.toContain('close');
  });
});

test.describe('T3-10 harness integrity', () => {
  test('a full keyboard range flow drives state through public surface only', async ({ page }) => {
    const sel = await openMulti(page);
    // open (empty) -> build a range a..d -> verify getter + DOM aria-selected
    await input(page, sel).press('Shift+ArrowDown');
    await input(page, sel).press('Shift+ArrowDown');
    await input(page, sel).press('Shift+ArrowDown');
    await input(page, sel).press('Shift+ArrowDown');
    expect(await selectedValues(page, sel)).toEqual(['a', 'b', 'c', 'd']);
    expect(await activeValue(page, sel)).toBe('d');
    expect(await isOpen(page, sel)).toBe(true);
  });
});
