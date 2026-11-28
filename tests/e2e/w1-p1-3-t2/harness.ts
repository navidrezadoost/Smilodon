import type { Page } from '@playwright/test';

/**
 * W1-P1.3 Task 2 shared harness helpers.
 *
 * All drivers use PLAYWRIGHT's real user-input APIs (`locator.press`,
 * `locator.focus`, `page.keyboard.*`) which deliver genuine trusted keyboard
 * events to Chromium — not synthetic `KeyboardEvent` dispatch. All assertions
 * read only public-observable DOM: the combobox input, its ARIA attributes, the
 * active option resolved via `aria-activedescendant`, host `data-open`, and the
 * Chrome accessibility tree (via CDP `Accessibility.getFullAXTree`).
 *
 * The element is mounted onto the vanilla-demo page (which already defines
 * `enhanced-select` / `select-option`). We never reach into private fields.
 */

export const VANILLA_URL = 'http://localhost:5173/vanilla-demo.html';

/**
 * Certification browser version. A run whose engine version does NOT match this
 * is treated as an override run and is flagged (not silently certified). This
 * keeps re-certification reproducible against the recorded Chromium build.
 */
export const CERTIFIED_CHROMIUM = '156.0.8078.4';

export type Item = {
  id: string;
  value: string;
  label: string;
  disabled?: boolean;
};

export type MountOptions = {
  items?: Item[];
  config?: Record<string, unknown>;
  hostAttrs?: Record<string, string>;
  id?: string;
  /**
   * Append a genuinely-tabbable `<button id="after-select">` AFTER the host so
   * Tab-order assertions observe the real next-tabbable destination (T2-F01).
   * The button is appended to the document body after the host element.
   */
  withNextButton?: boolean;
};

export const FOUR: Item[] = [
  { id: 'a', value: 'a', label: 'Alpha' },
  { id: 'b', value: 'b', label: 'Bravo', disabled: true },
  { id: 'c', value: 'c', label: 'Charlie' },
  { id: 'd', value: 'd', label: 'Delta' },
];

export const DEFAULT_ID = 't2-select';

/** Navigate to the demo page and wait until the custom element is defined. */
export async function gotoDemo(page: Page): Promise<void> {
  await page.goto(VANILLA_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(async () => {
    await customElements.whenDefined('enhanced-select');
    await customElements.whenDefined('select-option');
    // Purge the demo page's own static select(s) so the accessibility tree and
    // DOM contain ONLY the instances this suite mounts (deterministic AX scoping).
    document.body.innerHTML = '';
  });
}

/**
 * Mount one `enhanced-select`, apply config + host attributes, and return its
 * selector. Removes any prior instance with the same id first.
 */
export async function mount(page: Page, opts: MountOptions = {}): Promise<string> {
  const id = opts.id ?? DEFAULT_ID;
  const items = opts.items ?? FOUR;
  const config = opts.config ?? {};
  const hostAttrs = opts.hostAttrs ?? {};
  const withNextButton = opts.withNextButton ?? false;
  await page.evaluate(
    ({ id, items, config, hostAttrs, withNextButton }) => {
      const prior = document.getElementById(id);
      if (prior) prior.remove();
      const el = document.createElement('enhanced-select') as any;
      el.id = id;
      for (const [k, v] of Object.entries(hostAttrs)) el.setAttribute(k, v);
      document.body.appendChild(el);
      if (typeof el.updateConfig === 'function' && Object.keys(config).length) {
        el.updateConfig(config);
      }
      el.setItems(items);
      // Append a tabbable control strictly AFTER the host so Tab order is
      // deterministic and the next destination is a real element (T2-F01).
      if (withNextButton) {
        document.getElementById('after-select')?.remove();
        const btn = document.createElement('button');
        btn.id = 'after-select';
        btn.textContent = 'After';
        document.body.appendChild(btn);
      }
    },
    { id, items, config, hostAttrs, withNextButton },
  );
  return `#${id}`;
}

// ---------------------------------------------------------------------------
// Public-surface readers (shadow-DOM reads only; no private state)
// ---------------------------------------------------------------------------

/** The combobox input element inside the shadow root. */
export function input(page: Page, sel = `#${DEFAULT_ID}`) {
  return page.locator(`${sel} [part="input"]`);
}

/** Read an ARIA attribute from the combobox input. */
export async function comboboxAttr(
  page: Page,
  name: string,
  sel = `#${DEFAULT_ID}`,
): Promise<string | null> {
  return input(page, sel).getAttribute(name);
}

/** Host `data-open` presence — the primary open/close signal. */
export async function isOpen(page: Page, sel = `#${DEFAULT_ID}`): Promise<boolean> {
  return page.locator(sel).evaluate((el) => el.hasAttribute('data-open'));
}

/** Selected values via the public getter. */
export async function selectedValues(page: Page, sel = `#${DEFAULT_ID}`): Promise<string[]> {
  return page.locator(sel).evaluate((el: any) => el.getSelectedValues());
}

/**
 * The value (`data-value`) of the currently active option, resolved from
 * `aria-activedescendant` inside the shadow root. `null` when unset.
 */
export async function activeValue(page: Page, sel = `#${DEFAULT_ID}`): Promise<string | null> {
  return page.locator(sel).evaluate((el) => {
    const root = (el as HTMLElement).shadowRoot!;
    const cb = root.querySelector('[role="combobox"]');
    const ad = cb?.getAttribute('aria-activedescendant');
    if (!ad) return null;
    const opt = root.getElementById(ad);
    return opt ? opt.getAttribute('data-value') : null;
  });
}

/** The active option's id (aria-activedescendant) — for ARIA relationship checks. */
export async function activeOptionId(page: Page, sel = `#${DEFAULT_ID}`): Promise<string | null> {
  return input(page, sel).getAttribute('aria-activedescendant');
}

/** Role description of the option referenced by aria-activedescendant. */
export async function activeOptionInfo(
  page: Page,
  sel = `#${DEFAULT_ID}`,
): Promise<{ id: string; role: string | null; value: string | null; selected: string | null } | null> {
  return page.locator(sel).evaluate((el) => {
    const root = (el as HTMLElement).shadowRoot!;
    const cb = root.querySelector('[role="combobox"]');
    const ad = cb?.getAttribute('aria-activedescendant');
    if (!ad) return null;
    const opt = root.getElementById(ad);
    if (!opt) return null;
    return {
      id: opt.id,
      role: opt.getAttribute('role'),
      value: opt.getAttribute('data-value'),
      selected: opt.getAttribute('aria-selected'),
    };
  });
}

/** Actual DOM focus inside the shadow root (tagName + part) and in the document. */
export async function focusSnapshot(page: Page, sel = `#${DEFAULT_ID}`) {
  return page.locator(sel).evaluate((el) => {
    const host = el as HTMLElement;
    const root = host.shadowRoot!;
    const shadowActive = root.activeElement as HTMLElement | null;
    return {
      documentActiveIsHost: document.activeElement === host,
      documentActiveTag: document.activeElement?.tagName ?? null,
      documentActivePart: (document.activeElement as HTMLElement)?.getAttribute?.('part') ?? null,
      shadowActiveTag: shadowActive?.tagName ?? null,
      shadowActivePart: shadowActive?.getAttribute?.('part') ?? null,
      shadowActiveIsInput: !!shadowActive && shadowActive === root.querySelector('[part="input"]'),
    };
  });
}

/** Whether the combobox input inside the shadow root is the shadow active element. */
export async function shadowInputFocused(page: Page, sel = `#${DEFAULT_ID}`): Promise<boolean> {
  return page.locator(sel).evaluate((el) => {
    const root = (el as HTMLElement).shadowRoot!;
    return root.activeElement === root.querySelector('[part="input"]');
  });
}

/**
 * Actual document focus destination (tag + id). Used by Tab-order assertions to
 * record where focus really lands (T2-F01) rather than asserting inequality
 * with a guessed element.
 */
export async function focusDestination(page: Page): Promise<{ tag: string; id: string }> {
  return page.evaluate(() => ({
    tag: document.activeElement?.tagName ?? '',
    id: (document.activeElement as HTMLElement | null)?.id ?? '',
  }));
}

// ---------------------------------------------------------------------------
// Keyboard drivers (real trusted input)
// ---------------------------------------------------------------------------

/** Focus the combobox input (shadow-aware via Playwright's focus). */
export async function focusInput(page: Page, sel = `#${DEFAULT_ID}`): Promise<void> {
  await input(page, sel).focus();
}

/** Press a key on the focused combobox input. */
export async function press(page: Page, key: string, sel = `#${DEFAULT_ID}`): Promise<void> {
  await input(page, sel).press(key);
}

/**
 * Focus the combobox input, then programmatically close the popup.
 *
 * Rationale: in a real browser, focusing a never-focused combobox opens the
 * popup (and pre-activates the first option). To characterize the keyboard-OPEN
 * path from a genuinely closed state we first focus, then close, leaving a
 * focused-but-closed combobox. Observed 2026-11 (Chrome 156): a subsequent
 * `ArrowDown` reopens it.
 */
export async function focusThenClose(page: Page, sel = `#${DEFAULT_ID}`): Promise<void> {
  await input(page, sel).focus();
  await page.locator(sel).evaluate((el: any) => el.close());
}

/** Programmatically open via the public method (no keyboard). */
export async function openProgrammatic(page: Page, sel = `#${DEFAULT_ID}`): Promise<void> {
  await page.locator(sel).evaluate((el: any) => el.open());
}

/** Programmatically close via the public method. */
export async function closeProgrammatic(page: Page, sel = `#${DEFAULT_ID}`): Promise<void> {
  await page.locator(sel).evaluate((el: any) => el.close());
}

/** Focus the combobox input (which, in a real browser, opens the popup). */
export async function focusFresh(page: Page, sel = `#${DEFAULT_ID}`): Promise<void> {
  await input(page, sel).focus();
}

// ---------------------------------------------------------------------------
// Chromium accessibility-tree helpers (CDP)
// ---------------------------------------------------------------------------

export type AxNode = {
  nodeId: string;
  role: string | null;
  name: string | null;
  properties: Record<string, string | boolean | null>;
  ignored: boolean;
};

/**
 * Full Chrome accessibility tree (flat list of non-ignored nodes with role,
 * accessible name, and selected aria/state properties). Uses the CDP
 * `Accessibility.getFullAXTree` command on a fresh session per call.
 */
export async function axTree(page: Page): Promise<AxNode[]> {
  const client = await page.context().newCDPSession(page);
  const { nodes } = (await client.send('Accessibility.getFullAXTree')) as { nodes: any[] };
  await client.detach().catch(() => {});
  const val = (p: any): any => (p?.value?.value !== undefined ? p.value.value : p?.value ?? null);
  return nodes
    .filter((n) => !n.ignored)
    .map((n) => {
      const properties: Record<string, string | boolean | null> = {};
      for (const p of n.properties ?? []) properties[p.name] = val(p);
      return {
        nodeId: n.nodeId,
        role: n.role ? val(n.role) : null,
        name: n.name ? val(n.name) : null,
        properties,
        ignored: !!n.ignored,
      };
    });
}

/** Find accessibility nodes by role (e.g. 'combobox', 'listbox', 'option'). */
export async function axByRole(page: Page, role: string): Promise<AxNode[]> {
  return (await axTree(page)).filter((n) => n.role === role);
}

// ---------------------------------------------------------------------------
// Event chronology (public open/close CustomEvents)
// ---------------------------------------------------------------------------

/** Install listeners recording ordered `open`/`close` events with JSON detail. */
export async function installTimeline(page: Page, sel = `#${DEFAULT_ID}`): Promise<void> {
  await page.locator(sel).evaluate((el) => {
    const w = window as any;
    w.__t2Timeline = [];
    const record = (name: 'open' | 'close') => (e: Event) => {
      w.__t2Timeline.push(`${name}:${JSON.stringify((e as CustomEvent).detail)}`);
    };
    (el as any).__t2OnOpen = record('open');
    (el as any).__t2OnClose = record('close');
    el.addEventListener('open', (el as any).__t2OnOpen);
    el.addEventListener('close', (el as any).__t2OnClose);
  });
}

/** Read the recorded timeline (does not clear it). */
export async function readTimeline(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as any).__t2Timeline ?? []);
}

/** Clear the recorded timeline. */
export async function resetTimeline(page: Page): Promise<void> {
  await page.evaluate(() => { (window as any).__t2Timeline = []; });
}
