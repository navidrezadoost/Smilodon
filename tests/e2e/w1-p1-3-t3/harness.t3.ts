/**
 * W1-P1.3 Task 3 shared harness helpers.
 *
 * Re-exports the accepted Task-2 harness (real trusted input via Playwright,
 * public-surface-only reads, Chromium AX tree) and adds Task-3-specific readers
 * for keyboard *selection* characterization:
 *   - rendered option DOM order (visual order vs registry index),
 *   - the public `select` / `change` event payloads + their ordering,
 *   - selection indices in the emitted `change` detail.
 *
 * Still strict: no private fields or private methods are touched. Every driver
 * uses genuine Playwright keyboard input; every reader reads public DOM/events
 * or the public getters.
 */
import type { Page } from '@playwright/test';

export * from '../w1-p1-3-t2/harness';

import { DEFAULT_ID } from '../w1-p1-3-t2/harness';

export { DEFAULT_ID, CERTIFIED_CHROMIUM } from '../w1-p1-3-t2/harness';

/**
 * Rendered option DOM order as an array of `data-value`s, reading the live
 * shadow-DOM option elements in DOM order (i.e. visual/presentation order).
 * This is what the user sees/navigates, as opposed to registry index order.
 */
export async function optionDomOrder(page: Page, sel = `#${DEFAULT_ID}`): Promise<string[]> {
  return page.locator(sel).evaluate((el) => {
    const root = (el as HTMLElement).shadowRoot!;
    return Array.from(root.querySelectorAll('[role="option"]')).map(
      (o) => o.getAttribute('data-value') ?? '',
    );
  });
}

/**
 * Install ordered listeners for the public selection surface: `select`,
 * `change`, plus callbacks `onSelect`/`onChange` (via updateConfig). Records
 * `"<name>:<json-detail>"` strings. Call `readEvents` to read, `resetEvents`
 * to clear.
 */
export async function installEventLog(page: Page, sel = `#${DEFAULT_ID}`): Promise<void> {
  await page.locator(sel).evaluate((el: any) => {
    const w = window as any;
    w.__t3Events = [];
    const push = (name: string) => (detail: unknown) =>
      w.__t3Events.push(`${name}:${JSON.stringify(detail ?? null)}`);
    for (const name of ['select', 'change', 'open', 'close']) {
      el.addEventListener(name, (e: Event) => push(name)((e as CustomEvent).detail));
    }
    // Callbacks configured on the instance (prepend to preserve any existing).
    el.updateConfig({
      callbacks: {
        onSelect: push('onSelect'),
        onChange: push('onChange'),
      },
    });
  });
}

/** Read the recorded event log (does not clear). */
export async function readEvents(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as any).__t3Events ?? []);
}

/** Clear the recorded event log. */
export async function resetEvents(page: Page): Promise<void> {
  await page.evaluate(() => { (window as any).__t3Events = []; });
}

/** Parse the `selectedIndices` array from the most recent `change` event. */
export function lastChangeIndices(events: string[]): number[] | null {
  const change = [...events].reverse().find((e) => e.startsWith('change:'));
  if (!change) return null;
  const detail = JSON.parse(change.slice('change:'.length));
  return Array.isArray(detail?.selectedIndices) ? detail.selectedIndices : null;
}

/** Parse the `selectedValues` array from the most recent `change` event. */
export function lastChangeValues(events: string[]): string[] | null {
  const change = [...events].reverse().find((e) => e.startsWith('change:'));
  if (!change) return null;
  const detail = JSON.parse(change.slice('change:'.length));
  return Array.isArray(detail?.selectedValues) ? detail.selectedValues : null;
}

/** Order of event names only (e.g. ['select','onSelect','change','onChange']). */
export function eventNames(events: string[]): string[] {
  return events.map((e) => e.slice(0, e.indexOf(':')));
}
