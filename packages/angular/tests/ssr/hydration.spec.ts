/**
 * S5-V2 — Real-browser hydration verification of SmilodonSelectComponent.
 *
 * This test loads the SERVER-RENDERED HTML (from `render-server.mjs`) plus the
 * client hydration bundle (from `build-fixture.mjs`) — i.e. the exact
 * framework-SSR → framework-hydration production shape — and verifies in a REAL
 * browser (Chromium, Firefox; WebKit is environmentally blocked, see
 * playwright.ssr.config.ts) that:
 *
 *   H1 (tag collision): hydrating `<smilodon-select>` (Angular host) collides
 *      with core's `customElements.define('smilodon-select', NativeSelectElement)`.
 *      We CHARACTERIZE the resulting foreign host shadow root and assert it
 *      causes NO Angular hydration mismatch and NO missing interactive widget.
 *   H2 (writeValue timing): the reactive select's initial value ('b') is applied
 *      without a programmatic change echo, and the selection is observable after
 *      hydration.
 *   H3 (serialization): the server placeholder shape is what gets hydrated (no
 *      core internals server-side; combobox appears only after hydration).
 *
 * Plus the S5-V2 acceptance behaviors: selection + change forwarding after
 * hydration, reactive-form model preservation (no feedback loop), and
 * focus/touched semantics.
 *
 * @ssr-hydration
 */
import { test, expect } from '@playwright/test';

const PLAIN_ID = '#plain';
const REACTIVE_ID = '#reactive';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window {
    __hydrated?: boolean;
    __hydrateError?: string | null;
    __smilodonChangeEvents?: unknown[];
  }
}

test.beforeEach(async ({ page }) => {
  // Record core `change` CustomEvents bubbling from any select, so we can assert
  // the selection actually emits (which the Angular adapter forwards). The core
  // event's target is the `<enhanced-select>`, which bubbles+composes up to the
  // Angular `<smilodon-select>` host; resolve the owning host's id.
  await page.addInitScript(() => {
    window.__smilodonChangeEvents = [];
    document.addEventListener(
      'change',
      (e) => {
        const t = e.target as (HTMLElement & { closest?: (s: string) => HTMLElement | null }) | null;
        const host = t && typeof t.closest === 'function' ? t.closest('smilodon-select') : null;
        (window.__smilodonChangeEvents as unknown[]).push({
          hostId: host?.id ?? null,
          detail: (e as CustomEvent).detail ?? null,
        });
      },
      true,
    );
  });
});

/**
 * Waits for the client hydrate bundle to finish bootstrapping and surfaces any
 * hydration error explicitly (NG mismatch, bootstrap rejection, etc.).
 */
async function waitForHydration(page: import('@playwright/test').Page): Promise<void> {
  await page.waitForFunction(
    () => window.__hydrated === true || window.__hydrateError != null,
    undefined,
    { timeout: 15000 },
  );
  const err = await page.evaluate(() => window.__hydrateError ?? null);
  expect(err, 'hydration must not throw (Angular mismatch / bootstrap error)').toBeNull();
}

test('@ssr-hydration hydration completes with no mismatch errors and preserves server DOM shape (H1/H3)', async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => consoleErrors.push(`[pageerror] ${e.message}`));

  await page.goto('/');
  await waitForHydration(page);

  // No Angular hydration mismatch / NG0* errors were logged.
  const ngErrors = consoleErrors.filter((t) => /NG0|hydration|mismatch/i.test(t));
  expect(ngErrors, `no Angular hydration/mismatch console errors. Got: ${ngErrors.join(' | ')}`).toEqual([]);

  // Both Angular hosts still exist as single elements (no duplicated/mismatched
  // DOM from hydration).
  await expect(page.locator(PLAIN_ID)).toHaveCount(1);
  await expect(page.locator(REACTIVE_ID)).toHaveCount(1);

  // H1 characterization: the `smilodon-select` host got upgraded by core's
  // NativeSelectElement, which attaches a shadow root — the tag-collision
  // artifact. We assert it exists (characterized) AND that it does NOT hide the
  // real interactive widget (which lives in the `<enhanced-select>` child).
  const h1 = await page.evaluate((id) => {
    const host = document.querySelector(id) as HTMLElement & { shadowRoot: ShadowRoot | null };
    const enh = host.querySelector('enhanced-select') as (HTMLElement & { shadowRoot: ShadowRoot | null }) | null;
    const enhCombobox = enh?.shadowRoot?.querySelector('[role="combobox"]') ?? null;
    return {
      hostHasShadow: !!host.shadowRoot,
      hostShadowChildren: host.shadowRoot ? host.shadowRoot.childElementCount : -1,
      enhancedPresent: !!enh,
      enhancedHasShadow: !!enh?.shadowRoot,
      // The interactive combobox must exist in the enhanced-select shadow.
      comboboxInEnhancedShadow: !!enhCombobox,
      // The light-DOM enhanced-select must still be reachable from the host.
      enhancedReachableInLightDom: !!host.querySelector('enhanced-select'),
    };
  }, PLAIN_ID);

  expect(h1.hostHasShadow, 'H1: host upgraded with a foreign (collision) shadow root').toBe(true);
  expect(h1.enhancedPresent, 'enhanced-select child present & reachable').toBe(true);
  expect(h1.enhancedHasShadow, 'enhanced-select (real widget) has its own shadow root').toBe(true);
  expect(
    h1.comboboxInEnhancedShadow,
    'real interactive combobox lives in enhanced-select shadow (not the collision root)',
  ).toBe(true);
  expect(h1.enhancedReachableInLightDom, 'collision does not detach the light-DOM widget child').toBe(true);
});

test('@ssr-hydration reactive form applies initial value without a programmatic feedback echo (H2)', async ({
  page,
}) => {
  await page.goto('/');
  await waitForHydration(page);

  // Initial writeValue('b') applied: the enhanced-select reflects 'b' as selected
  // shortly after hydration, and the host untouched/pristine (no user input).
  const h2 = await page.evaluate((id) => {
    const host = document.querySelector(id) as HTMLElement;
    const enh = host.querySelector('enhanced-select') as
      | (HTMLElement & { _state?: { selectedItems?: Map<number, unknown> } })
      | null;
    const selected = enh?._state?.selectedItems ? [...enh._state.selectedItems.values()] : [];
    return {
      selectedCount: selected.length,
      selectedValues: selected.map((s) => (s as { value?: unknown })?.value ?? s),
      hostUntouched: host.classList.contains('ng-untouched'),
      hostPristine: host.classList.contains('ng-pristine'),
    };
  }, REACTIVE_ID);

  // The control starts on 'b'.
  expect(h2.selectedValues, 'reactive select hydrated with initial value b').toEqual(['b']);
  // Angular's form-control classes: untouched + pristine means writeValue did
  // NOT masquerade as user interaction (no programmatic feedback into dirty).
  expect(h2.hostUntouched, 'reactive host stays ng-untouched after initial writeValue').toBe(true);
  expect(h2.hostPristine, 'reactive host stays ng-pristine after initial writeValue').toBe(true);
});

test('@ssr-hydration selection works after hydration and forwards change', async ({ page }) => {
  await page.goto('/');
  await waitForHydration(page);

  // Plain select starts empty.
  const before = await page.evaluate((id) => {
    const host = document.querySelector(id) as HTMLElement;
    const enh = host.querySelector('enhanced-select') as
      | (HTMLElement & { _state?: { selectedItems?: Map<number, unknown> } })
      | null;
    return enh?._state?.selectedItems?.size ?? -1;
  }, PLAIN_ID);
  expect(before, 'plain select starts empty').toBe(0);

  // Interact via the real DOM: click the first option's container inside the
  // enhanced-select shadow (the same interaction the core e2e suite uses). This
  // proves the hydrated widget is live and selectable in a real browser.
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

  // After selection, the enhanced-select reflects exactly one selected item.
  const after = await page.evaluate((id) => {
    const host = document.querySelector(id) as HTMLElement;
    const enh = host.querySelector('enhanced-select') as
      | (HTMLElement & { _state?: { selectedItems?: Map<number, unknown> } })
      | null;
    const selected = enh?._state?.selectedItems ? [...enh._state.selectedItems.values()] : [];
    return { count: selected.length, values: selected.map((s) => (s as { value?: unknown })?.value ?? s) };
  }, PLAIN_ID);

  expect(after.count, 'selection selects exactly one option').toBe(1);
  expect(after.values, 'first option (Alpha, value a) is selected').toEqual(['a']);

  // The selection emitted a core `change` CustomEvent from #plain, which the
  // Angular adapter forwards to its (change) output.
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            (window.__smilodonChangeEvents as { hostId: string | null }[]).filter((e) => e.hostId === 'plain')
              .length,
        ),
      { message: 'a change event was emitted from #plain after selection', timeout: 5000 },
    )
    .toBeGreaterThanOrEqual(1);
});

test('@ssr-hydration focus/touched semantics correct after hydration', async ({ page }) => {
  await page.goto('/');
  await waitForHydration(page);

  // Reactive control starts untouched; focusing then losing focus marks it
  // touched. The real widget's combobox input is 0x0 (a hidden trigger) until the
  // popup opens, so we drive the SAME focus-session boundary the adapter listens
  // for: a `focusin` on the host followed by a `focusout` whose `relatedTarget`
  // is outside the host (a real focus-loss). These are real composed FocusEvents
  // on the live hydrated host.
  const host = page.locator(REACTIVE_ID);
  const initialUntouched = await host.evaluate((el) => el.classList.contains('ng-untouched'));
  expect(initialUntouched, 'reactive host initially untouched').toBe(true);

  await page.evaluate((id) => {
    const hostEl = document.querySelector(id) as HTMLElement;
    hostEl.dispatchEvent(new FocusEvent('focusin', { bubbles: true, composed: true }));
    hostEl.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, composed: true, relatedTarget: document.body }),
    );
  }, REACTIVE_ID);

  await expect
    .poll(async () => host.evaluate((el) => el.classList.contains('ng-touched')), {
      message: 'reactive host becomes ng-touched after focus loss',
      timeout: 5000,
    })
    .toBe(true);
});
