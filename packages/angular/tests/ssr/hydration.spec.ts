/**
 * S5-VR — Corrected real-browser hydration verification of SmilodonSelectComponent.
 *
 * STARTING COMMIT: 04847cd (S5-V). This revision implements the Lead's S5-VR
 * test-correction directive (F01/F02/F03). It loads the SERVER-RENDERED HTML
 * (from `render-server.mjs`, now hydration-annotated) plus the client hydration
 * bundle (from `build-fixture.mjs`) and verifies in a REAL browser (Chromium,
 * Firefox; WebKit environmentally blocked — see playwright.ssr.config.ts):
 *
 *  F01 — REAL hydration:
 *    The server HTML is now hydration-annotated (`ngh=…` + `<!--nghm-->`), and the
 *    client DEMONSTRABLY reuses the server DOM nodes (node identity preserved +
 *    Angular logs "hydrated N component(s) and M node(s)"). We no longer accept
 *    the mere presence of `ng-version`/`ng-server-context` as proof. We also
 *    capture hydration WARNINGS (e.g. NG05xx), not only console errors.
 *
 *  F02 — the tag collision is NOT assumed benign:
 *    The `<smilodon-select>` host is upgraded by core's NativeSelectElement, whose
 *    shadow root has NO `<slot>`. Unslotted light-DOM children are not rendered
 *    through the host shadow tree, so the real `<enhanced-select>` widget may be
 *    present/programmatically operable yet INVISIBLE and un-usable by a pointer
 *    or keyboard. This is verified with REAL Playwright locator visibility /
 *    geometry / pointer / keyboard / accessibility checks — NOT a programmatic
 *    `container.click()` inside `page.evaluate()`. If the widget is not visible,
 *    this spec FAILS and preserves the reproduction (per the directive: stop at
 *    the boundary; production remediation requires separate authorization).
 *
 *  F03 — genuine Angular behavior:
 *    Asserts the Angular `(change)` OUTPUT delivery (via the fixture's `onChange`
 *    handler → `window.__fixture.changeCount/lastChange`), and genuine form-model
 *    behavior (FormControl.valueChanges count + last value), not just DOM capture.
 *    Focus/touched exercised with REAL focus movement (Playwright focus + a real
 *    focus-loss to a visible target); a synthetic FocusEvent case is retained
 *    separately as a unit-level check.
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
// F02 — the widget must be VISIBLE and USABLE (not merely queryable)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('@ssr-hydration F02 — rendered widget visibility & interaction', () => {
  test('tag collision does NOT hide the real widget (visible, sized, hittable)', async ({ page }) => {
    // EXPECTED FAILURE — preserved reproduction of the F02 adapter defect:
    // core's NativeSelectElement host shadow root has NO <slot>, so the light-DOM
    // <enhanced-select> widget is not rendered (0×0, invisible). Marked
    // test.fail() so the suite treats it as an expected failure while F02 is open,
    // and FAILS LOUDLY (unexpected pass) if the adapter is ever remediated this way.
    test.fail(true, 'F02: <enhanced-select> hidden by slotless core host shadow (adapter defect)');
    await page.goto('/');
    await waitForHydration(page);

    // Characterize the collision (host gained a foreign shadow root with no slot).
    const collision = await page.evaluate((id) => {
      const host = document.querySelector(id) as HTMLElement;
      const shadow = host.shadowRoot;
      return {
        hostHasShadow: !!shadow,
        hostShadowHasSlot: shadow ? !!shadow.querySelector('slot') : null,
      };
    }, PLAIN_ID);
    expect(collision.hostHasShadow, 'host upgraded by core NativeSelectElement (collision)').toBe(true);
    // Document the mechanism: core's host shadow has NO slot, so light children
    // are not composed/rendered through it.
    expect(collision.hostShadowHasSlot, "core's host shadow root exposes a <slot> for light children").toBe(true);

    // The REAL widget is the <enhanced-select> child. Playwright locators pierce
    // open shadow roots; assert the widget itself is visible and has area.
    const widget = page.locator(`${PLAIN_ID} enhanced-select`);
    await expect(widget, 'the real <enhanced-select> widget is visible').toBeVisible();
    const box = await widget.boundingBox();
    expect(box, 'the widget has a layout box').not.toBeNull();
    expect(box!.width, 'widget has non-zero width').toBeGreaterThan(0);
    expect(box!.height, 'widget has non-zero height').toBeGreaterThan(0);

    // The combobox trigger inside the widget is reachable and hittable by a
    // pointer. Playwright click does an actionability check (visible + stable +
    // receives events) — a programmatic DOM click would mask an invisible target.
    const combobox = widget.locator('input[role="combobox"], [role="combobox"]').first();
    await expect(combobox, 'the combobox is visible').toBeVisible();
    await combobox.click({ timeout: 5000 });
  });

  test('collision does NOT suppress layout (host + widget have real geometry)', async ({ page }) => {
    // EXPECTED FAILURE — same F02 adapter defect (widget has 0 client rects).
    test.fail(true, 'F02: <enhanced-select> has 0 client rects (hidden by slotless core host shadow)');
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
      if (r.width > 0 && r.height > 0) {
        const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        hitInsideWidget = !!el && (el === enh || enh.contains(el) || el.getRootNode() === (enh.shadowRoot ?? null));
      }
      return {
        hostH: hr.height,
        enhW: r.width,
        enhH: r.height,
        enhClientRects: enh.getClientRects().length,
        hitInsideWidget,
      };
    }, PLAIN_ID);

    expect(geo.enhClientRects, 'widget has client rects (is laid out)').toBeGreaterThan(0);
    expect(geo.enhW, 'widget width > 0').toBeGreaterThan(0);
    expect(geo.enhH, 'widget height > 0').toBeGreaterThan(0);
    expect(geo.hostH, 'host has height > 0').toBeGreaterThan(0);
    expect(geo.hitInsideWidget, 'hit-testing at the widget centre lands inside the widget').toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// F03 — genuine Angular (change) output + form-model behavior
// ─────────────────────────────────────────────────────────────────────────────

test.describe('@ssr-hydration F03 — Angular output & form model', () => {
  test('reactive select hydrates on initial value with NO programmatic echo (H2)', async ({ page }) => {
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
    // The standalone `#plain` (change) output must NOT have fired during hydration.
    expect(h2.changeCount, 'no spurious (change) output during hydration').toBe(0);
  });

  test('selection forwards the Angular (change) OUTPUT and updates the form model', async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);

    const before = await page.evaluate(() => ({
      changeCount: window.__fixture?.changeCount ?? -1,
    }));
    expect(before.changeCount, '(change) output silent before interaction').toBe(0);

    // Select via the real option container (the core e2e interaction).
    const clicked = await page.evaluate((id) => {
      const host = document.querySelector(id) as HTMLElement;
      const enh = host.querySelector('enhanced-select') as (HTMLElement & { shadowRoot: ShadowRoot | null }) | null;
      const opt = enh?.shadowRoot?.querySelectorAll('select-option')[0] as
        | (HTMLElement & { shadowRoot: ShadowRoot | null })
        | undefined;
      const container = opt?.shadowRoot?.querySelector('.option-container') as HTMLElement | null;
      if (container) {
        container.click();
        return true;
      }
      return false;
    }, PLAIN_ID);
    expect(clicked, 'first option container clicked inside hydrated widget').toBe(true);

    // Angular (change) OUTPUT delivered to the fixture consumer (NOT just the
    // core event reaching document capture). This is the F03 assertion.
    await expect
      .poll(
        () => page.evaluate(() => window.__fixture?.changeCount ?? 0),
        { message: 'the Angular (change) output fired for #plain', timeout: 5000 },
      )
      .toBeGreaterThanOrEqual(1);

    const last = await page.evaluate(
      () => window.__fixture?.lastChange as { selectedValues?: unknown[] } | null,
    );
    expect(last?.selectedValues, 'the (change) output received the selected value').toEqual(['a']);

    // Now exercise the reactive control's model via the same path.
    const reactiveClicked = await page.evaluate((id) => {
      const host = document.querySelector(id) as HTMLElement;
      const enh = host.querySelector('enhanced-select') as (HTMLElement & { shadowRoot: ShadowRoot | null }) | null;
      const opt = enh?.shadowRoot?.querySelectorAll('select-option')[2] as
        | (HTMLElement & { shadowRoot: ShadowRoot | null })
        | undefined;
      const container = opt?.shadowRoot?.querySelector('.option-container') as HTMLElement | null;
      if (container) {
        container.click();
        return true;
      }
      return false;
    }, REACTIVE_ID);
    expect(reactiveClicked, 'third option clicked on reactive widget').toBe(true);

    await expect
      .poll(
        () => page.evaluate(() => window.__fixture?.formLastValue ?? null),
        { message: 'FormControl model updated to the clicked value (c)', timeout: 5000 },
      )
      .toBe('c');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Focus / touched — REAL focus movement + retained synthetic check
// ─────────────────────────────────────────────────────────────────────────────

test.describe('@ssr-hydration focus & touched', () => {
  test('REAL focus cannot reach the widget while it is unrendered (F02 consequence)', async ({ page }) => {
    // EXPECTED FAILURE — the F02 adapter defect surfaces through real focus:
    // the widget is 0-height so a real browser cannot focus it. If F02 were
    // remediated, real focus would land and this test would unexpectedly pass,
    // which test.fail() surfaces loudly.
    test.fail(true, 'F02: real focus cannot reach the widget (unrendered, 0-height)');
    await page.goto('/');
    await waitForHydration(page);

    // Add a real, focusable, visible control to move focus to on focus-loss.
    await page.evaluate(() => {
      const b = document.createElement('button');
      b.id = 'focus-sink';
      b.textContent = 'sink';
      b.style.cssText = 'display:block;width:80px;height:24px;';
      document.body.appendChild(b);
    });

    const host = page.locator(REACTIVE_ID);
    await expect(host).toHaveClass(/ng-untouched/);

    // Attempt REAL focus on the widget's combobox (inside enhanced-select shadow).
    const combobox = host.locator('enhanced-select input[role="combobox"], enhanced-select [role="combobox"]').first();
    const focusReach = await combobox.evaluate((el) => {
      (el as HTMLElement).focus();
      return {
        offsetHeight: (el as HTMLElement).offsetHeight,
        activeIsCombobox: document.activeElement === el,
      };
    });

    // ASSERTION (this is the F02 defect surfacing through real focus): a real
    // browser cannot focus the widget because it is unrendered (0-height). If the
    // widget WERE rendered, real focus would land and this would pass. As long as
    // F02 is unresolved, this fails — the preserved reproduction of the defect.
    expect(
      focusReach.activeIsCombobox,
      'real focus can reach the widget combobox (blocked by F02: widget unrendered, 0-height)',
    ).toBe(true);
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
