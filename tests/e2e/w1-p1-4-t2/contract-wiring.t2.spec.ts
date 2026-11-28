import { test, expect } from '@playwright/test';
import {
  FOUR, countPart, gotoDemo, hasLightPart, hasPart, hasShadowRoot, mount, open,
  setGroupedItems, setSelectedValues,
} from './harness';

/**
 * W1-P1.4 Task 2 — Part-token rendering in a real browser (T1-05).
 *
 * Complements the jsdom Task-1 spec for the subset where a real browser layout
 * is the meaningful oracle: the parts live in a genuine OPEN shadow tree, are
 * NOT mirrored into the host light DOM, and the rendered counts (one option per
 * item, one header per group, chips for multi) hold under real rendering.
 *
 * Public surface only. No private fields/methods.
 */

test.describe('W1-P1.4 T2 — part tokens in a real shadow tree', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDemo(page);
  });

  test('the host exposes a populated, open shadow root', async ({ page }) => {
    await mount(page);
    expect(await hasShadowRoot(page)).toBe(true);
  });

  test('PART-001/002/003 structural parts render in the shadow root and not in light DOM', async ({ page }) => {
    await mount(page);
    for (const part of ['button', 'input', 'listbox']) {
      expect(await hasPart(page, part), `part="${part}" in shadow`).toBe(true);
      expect(await hasLightPart(page, part), `part="${part}" not in light DOM`).toBe(false);
    }
  });

  test('PART-007 one rendered option carries part="option" per item when open', async ({ page }) => {
    await mount(page);
    await open(page);
    await expect.poll(() => countPart(page, 'option')).toBe(FOUR.length);
    expect(await hasLightPart(page, 'option')).toBe(false);
  });

  test('PART-008 one rendered part="group-header" per group when open', async ({ page }) => {
    await mount(page);
    await setGroupedItems(page, [
      { label: 'Fruit', options: [{ id: 'f1', value: 'f1', label: 'Apple' }, { id: 'f2', value: 'f2', label: 'Pear' }] },
      { label: 'Veg', options: [{ id: 'v1', value: 'v1', label: 'Kale' }] },
    ]);
    await open(page);
    await expect.poll(() => countPart(page, 'group-header')).toBe(2);
    expect(await hasLightPart(page, 'group-header')).toBe(false);
  });

  test('PART-009 a selected multi value renders chip + chip-label + chip-remove + chip-remove-icon', async ({ page }) => {
    await mount(page, {
      config: { selection: { mode: 'multi', showRemoveButton: true }, multiSelectDisplay: { mode: 'horizontal' } },
    });
    await setSelectedValues(page, ['a']);
    await expect.poll(() => countPart(page, 'chip')).toBe(1);
    expect(await hasPart(page, 'chip-label')).toBe(true);
    expect(await hasPart(page, 'chip-remove')).toBe(true);
    expect(await hasPart(page, 'chip-remove-icon')).toBe(true);
    expect(await hasLightPart(page, 'chip')).toBe(false);
  });

  test('PART-010 an empty data set renders part="no-results"', async ({ page }) => {
    await mount(page, { items: [] });
    await expect.poll(() => countPart(page, 'no-results')).toBe(1);
    expect(await hasLightPart(page, 'no-results')).toBe(false);
  });

  test('T1-04 ownership: no part token is duplicated into the host light DOM across states', async ({ page }) => {
    await mount(page, { items: [] });
    await open(page);
    for (const part of ['button', 'input', 'listbox', 'option', 'no-results']) {
      expect(await hasLightPart(page, part), `${part} absent from light DOM`).toBe(false);
    }
    expect(await hasPart(page, 'input')).toBe(true);
  });
});
