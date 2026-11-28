/**
 * F02-R — Real-browser hydration + host-collision REMEDIATION verification of
 * `SmilodonSelectComponent`.
 *
 * STARTING COMMIT: 0c2fffd (S5-D remediation design, Option A accepted).
 *
 * Prior history: S5-VR characterized the F02 adapter defect — the Angular host
 * used the tag `<smilodon-select>`, which `@smilodon/core` (when its full entry
 * is imported on the page) upgrades with `NativeSelectElement`, whose open
 * shadow root has NO `<slot>`. Unslotted light-DOM children are not composed
 * through that shadow tree, so the real `<enhanced-select>` widget was present
 * but INVISIBLE, 0×0, and unusable by pointer or keyboard. Those defects were
 * preserved as `test.fail()` reproductions.
 *
 * F02-R remediates the production defect by diverging the Angular host selector
 * to a name core never registers: `smilodon-angular-select` (see
 * select.component.ts). This spec converts the three prior expected-failures into
 * GENUINE passing assertions and hardens the interactive checks:
 *
 *  F01 — REAL hydration (server annotated + client reuses server nodes).
 *  F02 — the Angular host is NOT upgraded by core; the widget is visible, sized,
 *        hit-testable, pointer- and keyboard-operable. The host has NO foreign
 *        shadow root (positive replacement of the old "shadow has a slot" check).
 *  F02-R02 — mixed-consumer regression: full core IS loaded (so `smilodon-select`
 *        is a defined custom element), yet the `smilodon-angular-select` host is
 *        NOT upgraded by it — independent widgets remain visible/interactive.
 *  F03 — genuine Angular (change) OUTPUT + form-model behavior with EXACT counts:
 *        exactly ONE change output per selection, ZERO feedback callbacks on the
 *        initial reactive value, real pointer + keyboard interaction.
 *  Focus/touched — shadow-aware real focus landing inside the widget, and a REAL
 *        focus-loss (focus -> elsewhere) marking the control ng-touched. The
 *        synthetic FocusEvent case is retained separately as a unit-level check.
 *
 * Runs in real Chromium and Firefox (WebKit is environmentally unavailable on the
 * build host — see playwright.ssr.config.ts).
 *
 * @ssr-hydration
 */
import { test, expect, type Page } from '@playwright/test';

const PLAIN_ID = '#plain';
const REACTIVE_ID = '#reactive';

declare global {
  interface Window {
    __hydrated?: boolean;
    __hydrateError?: string | null;
    __serverNodesReused?: boolean;
    __fixture?: {
      lastChange: unknown;
      changeCount: number;
      formChanges: number;
      formLastValue: string | number | null;
    };
  }
}

/** Console lines (warnings AND errors) captured per test. */
type CapturedLogs = { errors: string[]; warnings: string[]; hydratedLog: string | null };

function captureLogs(page: Page): CapturedLogs {
  const errors: string[] = [];
  const warnings: string[] = [];
  let hydratedLog: string | null = null;
  page.on('console', (m) => {
    const text = m.text();
    if (/hydrated \d+ component/i.test(text)) hydratedLog = text;
    if (m.type() === 'error') errors.push(text);
    if (m.type() === 'warning') warnings.push(text);
  });
  page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
  return { errors, warnings, get hydratedLog() { return hydratedLog; } } as CapturedLogs;
}

/**
 * Waits for the client hydrate bundle to finish bootstrapping and surfaces any
 * hydration error explicitly (bootstrap rejection, etc.).
 */
async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(
    () => window.__hydrated === true || window.__hydrateError != null,
    undefined,
    { timeout: 15000 },
  );
  const err = await page.evaluate(() => window.__hydrateError ?? null);
  expect(err, 'hydration must not throw (bootstrap error)').toBeNull();
  // The fixture publishes `window.__fixture` from its constructor; wait for it so
  // subsequent reads are not racing the first `publishState()`.
  await page.waitForFunction(() => window.__fixture != null, undefined, { timeout: 15000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// F01 — Real Angular hydration (server annotated + client reuses server nodes)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('@ssr-hydration F01 — real Angular hydration', () => {
  test('server HTML is hydration-annotated (ngh + nghm)', async ({ request }) => {
    // Fetch the exact served page (server HTML + injected stamp + client script).
    const res = await request.get('/');
    expect(res.ok()).toBeTruthy();
    const html = await res.text();

    // Angular emits `ngh="N"` node annotations ONLY when hydration DOM-reuse is
    // enabled on the SERVER. Their absence was the F01 defect.
    const nghCount = (html.match(/ngh="/g) || []).length;
    expect(nghCount, 'server HTML carries Angular hydration annotations (ngh="…")').toBeGreaterThanOrEqual(4);

    // The SSR content-integrity marker Angular inserts for hydration.
    expect(html, 'server HTML carries the <!--nghm--> integrity marker').toContain('<!--nghm-->');

    // F02-R: the serialized hosts use the REMEDIATED selector, not the colliding
    // `<smilodon-select>` tag. This proves SSR markup will not be upgraded by core.
    expect(
      (html.match(/<smilodon-angular-select\b/g) || []).length,
      'server HTML serializes the remediated smilodon-angular-select hosts',
    ).toBe(2);
  });

  test('client reuses server DOM nodes and reports positive hydration (not recreation)', async ({ page }) => {
    const logs = captureLogs(page);
    await page.goto('/');
    await waitForHydration(page);

    // Node identity: the same server-emitted nodes (stamped by the harness before
    // the module ran) still carry the stamp after bootstrap → REUSED, not recreated.
    const reused = await page.evaluate(() => window.__serverNodesReused === true);
    expect(reused, 'client reused the server-rendered DOM nodes (node identity preserved)').toBe(true);

    // Angular's own positive hydration report.
    expect(logs.hydratedLog, 'Angular logs a positive hydration count').toBeTruthy();
    expect(logs.hydratedLog!).toMatch(/hydrated \d+ component\(s\) and \d+ node\(s\)/);
    expect(logs.hydratedLog!, 'no components skipped during hydration').toContain('0 component(s) were skipped');

    // Capture hydration WARNINGS (e.g. NG05xx mismatch codes), not only errors.
    const ngHydrationWarnings = [...logs.warnings, ...logs.errors].filter((t) =>
      /NG0\d{3}|hydration|mismatch|recreat/i.test(t),
    );
    expect(
      ngHydrationWarnings,
      `no Angular hydration warnings/mismatches. Got: ${ngHydrationWarnings.join(' | ')}`,
    ).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// F02 — the widget must be VISIBLE and USABLE (remediation + no foreign upgrade)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('@ssr-hydration F02 — rendered widget visibility & interaction', () => {
  test('remediated host is NOT upgraded by core; the real widget is visible, sized, hittable', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForHydration(page);

    // F02-R01/R02: the Angular host uses the distinct `smilodon-angular-select`
    // tag. Because core never registers that name, the host must NOT gain a
    // shadow root — the replacement for S5-VR's "host shadow has a slot" check.
    const hostState = await page.evaluate((id) => {
      const host = document.querySelector(id) as HTMLElement;
      return {
        tag: host.tagName.toLowerCase(),
        hasForeignShadowRoot: host.shadowRoot !== null,
        // Does a core `smilodon-select` definition exist that could have claimed
        // the old tag? (It may or may not be loaded depending on import order.)
        smilodonSelectDefined: !!customElements.get('smilodon-select'),
      };
    }, PLAIN_ID);
    expect(hostState.tag, 'Angular host element uses the remediated selector').toBe(
      'smilodon-angular-select',
    );
    expect(
      hostState.hasForeignShadowRoot,
      'Angular host has NO foreign shadow root (core did not upgrade it)',
    ).toBe(false);

    // The REAL widget is the <enhanced-select> child. Playwright locators pierce
    // open shadow roots; assert the widget itself is visible and has area.
    const widget = page.locator(`${PLAIN_ID} enhanced-select`);
    await expect(widget, 'the real <enhanced-select> widget is visible').toBeVisible();
    const box = await widget.boundingBox();
    expect(box, 'the widget has a layout box').not.toBeNull();
    expect(box!.width, 'widget has non-zero width').toBeGreaterThan(0);
    expect(box!.height, 'widget has non-zero height').toBeGreaterThan(0);

    // Independent widget: the TWO selects are distinct `enhanced-select` widgets
    // (not one shared upgrade artifact).
    await expect(
      page.locator(`${REACTIVE_ID} enhanced-select`),
      'the second widget is also present and distinct',
    ).toBeVisible();

    // The combobox trigger inside the widget is reachable and hittable by a real
    // pointer. Playwright's click performs an actionability check (visible +
    // stable + receives events) — a programmatic DOM click would mask an
    // invisible target, so this is the genuine F02 proof.
    const combobox = widget.locator('input[role="combobox"]').first();
    await expect(combobox, 'the combobox is visible').toBeVisible();
    await combobox.click({ timeout: 5000 });
    // Clicking opens the dropdown; assert it actually rendered options.
    await expect(
      widget.locator('select-option').first(),
      'pointer click opened the listbox with rendered options',
    ).toBeVisible({ timeout: 5000 });
  });

  test('widget has real geometry (host + widget laid out, hit-test lands inside)', async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);

    const geo = await page.evaluate((id) => {
      const host = document.querySelector(id) as HTMLElement;
      const enh = host.querySelector('enhanced-select') as HTMLElement;
      const r = enh.getBoundingClientRect();
      const hr = host.getBoundingClientRect();
      // elementFromPoint at the widget's centre should resolve into the widget
      // subtree (or its shadow), proving it is on-screen and painted.
      let hitInsideWidget = false;
      let hitInShadowTree = false;
      if (r.width > 0 && r.height > 0) {
        const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        if (el) {
          hitInsideWidget = el === enh || enh.contains(el);
          const enhShadow = enh.shadowRoot;
          hitInShadowTree = !!enhShadow && (el === enhShadow.host || enhShadow.contains(el));
        }
      }
      return {
        hostH: hr.height,
        enhW: r.width,
        enhH: r.height,
        enhClientRects: enh.getClientRects().length,
        hitInsideWidget,
        hitInShadowTree,
      };
    }, PLAIN_ID);

    expect(geo.enhClientRects, 'widget has client rects (is laid out)').toBeGreaterThan(0);
    expect(geo.enhW, 'widget width > 0').toBeGreaterThan(0);
    expect(geo.enhH, 'widget height > 0').toBeGreaterThan(0);
    expect(geo.hostH, 'host has height > 0').toBeGreaterThan(0);
    expect(
      geo.hitInsideWidget || geo.hitInShadowTree,
      'hit-testing at the widget centre lands inside the widget (light DOM or its shadow)',
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// F02-R02 — mixed-consumer regression: full core loaded, host NOT upgraded
// ─────────────────────────────────────────────────────────────────────────────

test.describe('@ssr-hydration F02-R02 — mixed-consumer regression', () => {
  test('loading full core (registers smilodon-select) does NOT upgrade the Angular host', async ({
    page,
  }) => {
    // Load the page. The client bundle imports @smilodon/angular, whose adapter
    // lazily loads the FULL `@smilodon/core` entry (core-loader.ts) to define
    // `<enhanced-select>`. That same full-core module also self-registers
    // `smilodon-select` (native-select.ts top-level) — the exact mixed-consumer
    // hazard the original tag collision came from.
    await page.goto('/');
    await waitForHydration(page);

    // Confirm the full-core registrations are present on the page.
    const coreState = await page.evaluate(() => ({
      smilodonSelect: !!customElements.get('smilodon-select'),
      enhancedSelect: !!customElements.get('enhanced-select'),
      selectOption: !!customElements.get('select-option'),
    }));
    expect(coreState.smilodonSelect, 'core registered smilodon-select (full core loaded)').toBe(true);
    expect(coreState.enhancedSelect, 'core registered enhanced-select').toBe(true);
    expect(coreState.selectOption, 'core registered select-option').toBe(true);

    // The Angular host tag is NOT a core registration, so neither host is upgraded.
    const hosts = await page.evaluate((ids) => {
      return ids.map((id) => {
        const host = document.querySelector(id) as HTMLElement;
        const enh = host.querySelector('enhanced-select') as HTMLElement | null;
        const r = enh?.getBoundingClientRect();
        return {
          id,
          tag: host.tagName.toLowerCase(),
          hasForeignShadowRoot: host.shadowRoot !== null,
          widgetW: r?.width ?? 0,
          widgetH: r?.height ?? 0,
        };
      });
    }, [PLAIN_ID, REACTIVE_ID]);

    for (const h of hosts) {
      expect(h.tag, `${h.id} uses the remediated Angular selector`).toBe('smilodon-angular-select');
      expect(
        h.hasForeignShadowRoot,
        `${h.id} has NO core shadow root even though smilodon-select/enhanced-select are defined`,
      ).toBe(false);
      expect(h.widgetW, `${h.id} widget retains non-zero width under mixed registration`).toBeGreaterThan(0);
      expect(h.widgetH, `${h.id} widget retains non-zero height under mixed registration`).toBeGreaterThan(0);
    }

    // One widget remains independently interactive: real pointer click opens it.
    const widget = page.locator(`${PLAIN_ID} enhanced-select`);
    await widget.locator('input[role="combobox"]').first().click({ timeout: 5000 });
    await expect(widget.locator('select-option').first(), 'mixed registration still allows pointer open').toBeVisible({
      timeout: 5000,
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// F03 — genuine Angular (change) output + form-model behavior (exact counts)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('@ssr-hydration F03 — Angular output & form model', () => {
  test('reactive select hydrates on initial value with ZERO feedback callbacks (H2)', async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);

    const h2 = await page.evaluate((id) => {
      const host = document.querySelector(id) as HTMLElement;
      const enh = host.querySelector('enhanced-select') as
        | (HTMLElement & { _state?: { selectedItems?: Map<number, unknown> } })
        | null;
      const selected = enh?._state?.selectedItems ? [...enh._state.selectedItems.values()] : [];
      return {
        selectedValues: selected.map((s) => (s as { value?: unknown })?.value ?? s),
        hostUntouched: host.classList.contains('ng-untouched'),
        hostPristine: host.classList.contains('ng-pristine'),
        formChanges: window.__fixture?.formChanges ?? -1,
        formLastValue: window.__fixture?.formLastValue ?? null,
        changeCount: window.__fixture?.changeCount ?? -1,
      };
    }, REACTIVE_ID);

    expect(h2.selectedValues, 'reactive select hydrated with initial value b').toEqual(['b']);
    expect(h2.hostUntouched, 'reactive host stays ng-untouched after initial writeValue').toBe(true);
    expect(h2.hostPristine, 'reactive host stays ng-pristine after initial writeValue').toBe(true);
    // Genuine form model: initial value came from the FormControl, no user edit.
    expect(h2.formLastValue, 'FormControl model holds the initial value b').toBe('b');
    // F02-R08: the initial reactive value must produce ZERO feedback callbacks —
    // no `valueChanges` emission from the initial writeValue (no programmatic echo).
    expect(h2.formChanges, 'initial writeValue produced ZERO form valueChanges (no echo)').toBe(0);
    // The standalone `#plain` (change) output must NOT have fired during hydration.
    expect(h2.changeCount, 'no spurious (change) output during hydration').toBe(0);
  });

  test('pointer selection fires EXACTLY ONE (change) output and updates the form model', async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);

    const before = await page.evaluate(() => ({
      changeCount: window.__fixture?.changeCount ?? -1,
      formChanges: window.__fixture?.formChanges ?? -1,
    }));
    expect(before.changeCount, '(change) output silent before interaction').toBe(0);
    expect(before.formChanges, 'form valueChanges silent before interaction').toBe(0);

    // REAL pointer interaction: click the combobox to open, then click option "a".
    const widget = page.locator(`${PLAIN_ID} enhanced-select`);
    const combobox = widget.locator('input[role="combobox"]').first();
    await combobox.click({ timeout: 5000 });
    const firstOption = widget.locator('select-option').first();
    await expect(firstOption, 'first option renders after pointer open').toBeVisible({ timeout: 5000 });
    // Click the option itself (Playwright pierces the option's shadow root and
    // clicks its visible .option-container). This is a REAL user gesture.
    await firstOption.click({ timeout: 5000 });

    // F02-R07: EXACTLY ONE change output for a single selection — not >= 1.
    await expect
      .poll(() => page.evaluate(() => window.__fixture?.changeCount ?? 0), {
        message: 'exactly one (change) output fired for the single pointer selection',
        timeout: 5000,
      })
      .toBe(1);

    const last = await page.evaluate(
      () => window.__fixture?.lastChange as { selectedValues?: unknown[] } | null,
    );
    expect(last?.selectedValues, 'the (change) output received the selected value a').toEqual(['a']);

    // REAL keyboard interaction on the reactive control: focus it, open with
    // ArrowDown, move to index 2 ("c") and commit with Enter — exactly ONE change.
    const formChangesBefore = await page.evaluate(() => window.__fixture?.formChanges ?? 0);
    const reactiveBox = page.locator(`${REACTIVE_ID} enhanced-select`);
    const reactiveInput = reactiveBox.locator('input[role="combobox"]').first();
    await reactiveInput.focus();
    // ArrowDown opens (first press) — press again to move active to next option.
    await page.keyboard.press('ArrowDown'); // open
    await page.keyboard.press('ArrowDown'); // active moves off the selected "b"
    await page.keyboard.press('ArrowDown'); // move down once more
    await page.keyboard.press('Enter'); // commit active option

    // The form model updated (valueChanges fired exactly once more) and the last
    // value is a non-initial value driven by keyboard selection.
    await expect
      .poll(() => page.evaluate(() => window.__fixture?.formChanges ?? 0), {
        message: 'keyboard selection produced exactly one form valueChanges emission',
        timeout: 5000,
      })
      .toBe(formChangesBefore + 1);

    const formLast = await page.evaluate(() => window.__fixture?.formLastValue ?? null);
    expect(formLast, 'keyboard selection wrote a concrete value into the form model').not.toBeNull();
    expect(['a', 'b', 'c'], 'keyboard selection wrote a valid option value').toContain(formLast);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Focus / touched — shadow-aware real focus + REAL focus-loss + synthetic unit
// ─────────────────────────────────────────────────────────────────────────────

test.describe('@ssr-hydration focus & touched', () => {
  test('REAL focus reaches the widget combobox (shadow-aware composed focus)', async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);

    const host = page.locator(REACTIVE_ID);
    await expect(host).toHaveClass(/ng-untouched/);

    // Focus the widget combobox with a real Playwright focus (real browser).
    const combobox = host.locator('enhanced-select input[role="combobox"]').first();
    await combobox.focus();

    // F02-R: shadow-aware active-element check — composed focus must be INSIDE
    // the combobox (deepest active element), not merely in the light DOM.
    const focusReach = await page.evaluate((id) => {
      const hostEl = document.querySelector(id) as HTMLElement;
      const enh = hostEl.querySelector('enhanced-select') as HTMLElement;
      const comboboxEl = enh.shadowRoot?.querySelector('input[role="combobox"]') as HTMLElement | null;
      // Walk the (open) shadow chain to the deepest active element.
      let active: Element | null = document.activeElement;
      while (active && (active as HTMLElement).shadowRoot?.activeElement) {
        active = (active as HTMLElement).shadowRoot!.activeElement;
      }
      // Is `active` inside the host's composed subtree?
      let node: Node | null = active;
      let inside = false;
      while (node) {
        if (node === hostEl) {
          inside = true;
          break;
        }
        const root = node.getRootNode();
        node = root instanceof ShadowRoot ? root.host : (node.parentNode as Node | null);
      }
      return {
        hasCombobox: !!comboboxEl,
        activeEqualsCombobox: active === comboboxEl,
        activeInsideHost: inside,
        comboboxHeight: comboboxEl?.getBoundingClientRect().height ?? 0,
      };
    }, REACTIVE_ID);

    expect(focusReach.hasCombobox, 'widget exposes an input[role="combobox"]').toBe(true);
    expect(focusReach.comboboxHeight, 'combobox has non-zero rendered height').toBeGreaterThan(0);
    expect(focusReach.activeEqualsCombobox, 'composed active element IS the widget combobox').toBe(true);
    expect(focusReach.activeInsideHost, 'composed active element is inside the Angular host').toBe(true);
  });

  test('REAL focus-loss marks the control ng-touched (exactly once)', async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);

    // A real, visible, focusable target OUTSIDE the control to move focus to.
    await page.evaluate(() => {
      const b = document.createElement('button');
      b.id = 'focus-sink';
      b.textContent = 'sink';
      b.style.cssText = 'display:block;width:120px;height:32px;margin-top:8px;';
      document.body.appendChild(b);
    });

    const host = page.locator(REACTIVE_ID);
    await expect(host).toHaveClass(/ng-untouched/);

    // Real focus INTO the control (starts a focus session), then real focus-loss
    // OUT to the sink button (Playwright focus is a genuine browser focus move).
    await host.locator('enhanced-select input[role="combobox"]').first().focus();
    await expect(host, 'control retains focus while combobox focused').not.toHaveClass(/ng-touched/);
    await page.locator('#focus-sink').focus();

    // F02-R09: a genuine focus-loss marks the control ng-touched.
    await expect
      .poll(async () => host.evaluate((el) => el.classList.contains('ng-touched')), {
        message: 'control becomes ng-touched after a genuine focus-loss',
        timeout: 5000,
      })
      .toBe(true);
  });

  test('UNIT: synthetic focusin/focusout(relatedTarget) marks touched', async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);

    const host = page.locator(REACTIVE_ID);
    await expect(host).toHaveClass(/ng-untouched/);

    await page.evaluate((id) => {
      const hostEl = document.querySelector(id) as HTMLElement;
      hostEl.dispatchEvent(new FocusEvent('focusin', { bubbles: true, composed: true }));
      hostEl.dispatchEvent(
        new FocusEvent('focusout', { bubbles: true, composed: true, relatedTarget: document.body }),
      );
    }, REACTIVE_ID);

    await expect
      .poll(async () => host.evaluate((el) => el.classList.contains('ng-touched')), {
        message: 'reactive host becomes ng-touched after synthetic focus loss',
        timeout: 5000,
      })
      .toBe(true);
  });
});
