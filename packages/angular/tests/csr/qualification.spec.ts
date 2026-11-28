/**
 * S5-Q — FINAL Angular qualification: CSR (client-side rendered, non-SSR) gates.
 *
 * STARTING COMMIT: 74fc5fc (F02-R accepted baseline).
 *
 * This spec exercises the standalone `SmilodonSelectComponent` in a REAL browser
 * driven ENTIRELY client-side (no server-rendered markup), against the AOT/esbuild
 * CSR fixture (`csr-app.component.ts` + `csr-main.ts`). It is the deliberate
 * contrast to the SSR/hydration fixture: here EVERYTHING is built in the browser.
 *
 * Gates covered here:
 *   Q-01 Standalone CSR consumer works without SSR
 *   Q-04 Chromium + Firefox pointer AND keyboard interaction
 *   Q-05 selection / clearing / event forwarding preserve S3 contracts
 *   Q-06 reactive + template-driven forms preserve S4 contracts
 *   Q-07 real focus transitions + touched callbacks
 *   Q-08 disabled-state + programmatic updates reconciled
 *   Q-09 deferred initialization + destruction remain safe
 *   Q-10 full-core import cannot revive the host collision
 *
 * Q-02 / Q-03 (genuine SSR + hydration) are proven by the SSR fixture
 * (`../ssr/hydration.spec.ts`). Q-11 is the regression-gate run recorded in the
 * evidence; Q-12 is the publication-readiness matrix.
 *
 * Runs in real Chromium and Firefox. WebKit is wired but environmentally
 * unavailable on this host (missing system libraries) — a coverage limitation,
 * never an assumed pass.
 *
 * @csr-qualification
 */
import { test, expect, type Page } from '@playwright/test';

type CsrState = {
  plainChangeCount: number;
  plainLastChange: { selectedValues?: unknown[]; selectedItems?: unknown[] } | null;
  multiChangeCount: number;
  multiLastChange: { selectedValues?: unknown[] } | null;
  clearCount: number;
  reactiveValue: string | number | null;
  reactiveValueChanges: Array<string | number | null>;
  reactiveTouched: boolean;
  groupValue: string | number | Array<string | number> | null;
  groupChanges: number;
  templateValue: string | number | null;
  lateItemsBound: boolean;
  removableMounted: boolean;
  removedOnce: boolean;
  toggledDisabled: boolean;
  ready: boolean;
};

declare global {
  interface Window {
    __csr?: CsrState;
    __csrBooted?: boolean;
    __csrBootError?: string | null;
  }
}

/** Boot the CSR app and wait until the fixture has published its state. */
async function bootCsr(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(
    () => window.__csrBooted === true || window.__csrBootError != null,
    undefined,
    { timeout: 15000 },
  );
  const bootErr = await page.evaluate(() => window.__csrBootError ?? null);
  expect(bootErr, 'CSR bootstrap must not throw').toBeNull();
  await page.waitForFunction(() => window.__csr?.ready === true, undefined, { timeout: 15000 });
}

/** Read the current published CSR state. */
async function readState(page: Page): Promise<CsrState> {
  return page.evaluate(() => {
    const s = window.__csr;
    if (!s) throw new Error('window.__csr missing');
    return s;
  });
}

/** Read the AUTHORITATIVE live Angular form state (never a stale snapshot). */
async function readLive(page: Page): Promise<{
  reactiveValue: string | number | null;
  reactiveTouched: boolean;
  reactivePristine: boolean;
  templateValue: string | number | null;
  templateTouched: boolean;
  groupValue: string | number | Array<string | number> | null;
}> {
  return page.evaluate(() =>
    (window as unknown as { __csrApi: { live: () => never } }).__csrApi.live(),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Q-01 — standalone CSR consumer works without SSR
// ─────────────────────────────────────────────────────────────────────────────

test.describe('@csr-qualification Q-01 — standalone CSR consumer', () => {
  test('app bootstraps entirely client-side and renders every control', async ({ page }) => {
    await bootCsr(page);

    // Every fixture control is present and its real widget is visible.
    const ids = ['plain', 'multi', 'reactive', 'formgroup', 'template', 'disabled', 'toggled', 'late'];
    for (const id of ids) {
      await expect(page.locator(`#${id}`), `#${id} host present`).toBeVisible();
      await expect(
        page.locator(`#${id} enhanced-select`),
        `#${id} real <enhanced-select> widget visible`,
      ).toBeVisible();
    }

    // Confirmed: no SSR markup was ever present — the document is bare and the
    // app mounted a fresh tree client-side.
    const rendered = await page.evaluate(() => ({
      hostCount: document.querySelectorAll('smilodon-angular-select').length,
      hasSsrMarker: document.documentElement.outerHTML.includes('<!--nghm-->'),
    }));
    expect(rendered.hostCount, 'all Angular select hosts rendered client-side').toBeGreaterThanOrEqual(8);
    expect(rendered.hasSsrMarker, 'no SSR hydration marker present (pure CSR)').toBe(false);

    // The initial models are exactly what the fixture declared.
    const s = await readState(page);
    expect(s.reactiveValue, 'reactive initial value').toBe('b');
    expect(s.templateValue, 'template-driven initial value').toBe('c');
    expect(s.groupValue, 'formgroup initial value').toEqual(['a']);
    expect(s.lateItemsBound, 'late items bound after a tick').toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Q-04 — pointer and keyboard interaction
// ─────────────────────────────────────────────────────────────────────────────

test.describe('@csr-qualification Q-04 — pointer & keyboard interaction', () => {
  test('POINTER: clicking the combobox opens the listbox; clicking an option selects', async ({ page }) => {
    await bootCsr(page);

    const widget = page.locator('#plain enhanced-select');
    const combobox = widget.locator('input[role="combobox"]').first();

    await combobox.click({ timeout: 5000 });
    const firstOption = widget.locator('select-option').first();
    await expect(firstOption, 'pointer open renders options').toBeVisible({ timeout: 5000 });
    await firstOption.click({ timeout: 5000 });

    await expect
      .poll(async () => (await readState(page)).plainChangeCount, {
        message: 'one change fired for the pointer selection',
        timeout: 5000,
      })
      .toBe(1);
    const s = await readState(page);
    expect(s.plainLastChange?.selectedValues, 'pointer selection reported value a').toEqual(['a']);
  });

  test('KEYBOARD: open with ArrowDown, navigate, commit with Enter', async ({ page }) => {
    await bootCsr(page);

    const widget = page.locator('#plain enhanced-select');
    const combobox = widget.locator('input[role="combobox"]').first();
    await combobox.focus();
    await page.keyboard.press('ArrowDown'); // opens
    await page.keyboard.press('ArrowDown'); // move active to first option
    await page.keyboard.press('Enter'); // commit

    await expect
      .poll(async () => (await readState(page)).plainChangeCount, {
        message: 'one change fired for the keyboard selection',
        timeout: 5000,
      })
      .toBe(1);
    const s = await readState(page);
    const val = s.plainLastChange?.selectedValues?.[0];
    expect(['a', 'b', 'c'], 'keyboard committed a concrete value').toContain(val);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Q-05 — selection / clearing / event forwarding (S3 contracts)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('@csr-qualification Q-05 — selection, clearing, event forwarding', () => {
  test('multi select accumulates then clears; (change) + (clear) forwarded', async ({ page }) => {
    await bootCsr(page);

    const widget = page.locator('#multi enhanced-select');
    const combobox = widget.locator('input[role="combobox"]').first();

    // Select two options in multi mode.
    await combobox.click({ timeout: 5000 });
    await expect(widget.locator('select-option').nth(0)).toBeVisible({ timeout: 5000 });
    await widget.locator('select-option').nth(0).click();
    await widget.locator('select-option').nth(1).click();

    // The value is an ARRAY in multi mode (S3 contract).
    await expect
      .poll(
        async () => {
          const s = await readState(page);
          const last = s.multiLastChange?.selectedValues;
          return Array.isArray(last) ? last.length : -1;
        },
        { message: 'multi selection reported an array of >= 2 values', timeout: 5000 },
      )
      .toBeGreaterThanOrEqual(2);

    // Clear via the element's REAL clear control (an actual user path). The
    // fixture enables `clearControl` via [config]; the button becomes visible
    // once something is selected. Playwright pierces the shadow root.
    const clearButton = widget.locator('[part~="clear-button"]').first();
    await expect(clearButton, 'clear control is visible once selections exist').toBeVisible({ timeout: 5000 });
    await clearButton.click({ timeout: 5000 });

    // (clear) output forwarded; selection emptied.
    await expect
      .poll(async () => (await readState(page)).clearCount, {
        message: '(clear) output forwarded',
        timeout: 5000,
      })
      .toBeGreaterThanOrEqual(1);
    await expect
      .poll(
        async () => {
          const s = await readState(page);
          const last = s.multiLastChange?.selectedValues;
          return Array.isArray(last) ? last.length : -1;
        },
        { message: 'selection emptied after clear (multi reports [])', timeout: 5000 },
      )
      .toBe(0);
  });

  test('every forwarded (change) detail carries the S3 shape', async ({ page }) => {
    await bootCsr(page);

    const widget = page.locator('#plain enhanced-select');
    await widget.locator('input[role="combobox"]').first().click({ timeout: 5000 });
    await widget.locator('select-option').nth(2).click({ timeout: 5000 }); // "c"

    const detail = await page.evaluate(() => window.__csr?.plainLastChange ?? null);
    expect(detail, '(change) detail captured').not.toBeNull();
    expect(detail, 'detail has selectedValues').toHaveProperty('selectedValues');
    expect(detail, 'detail has selectedItems').toHaveProperty('selectedItems');
    expect((detail as { selectedValues?: unknown[] }).selectedValues, 'detail.selectedValues = [c]').toEqual(['c']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Q-06 — reactive + template-driven forms (S4 contracts)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('@csr-qualification Q-06 — forms integration', () => {
  test('reactive formControl: initial write produces ZERO echo', async ({ page }) => {
    await bootCsr(page);
    const s = await readState(page);
    const live = await readLive(page);
    expect(live.reactiveValue, 'reactive model value fed from FormControl').toBe('b');
    expect(s.reactiveValueChanges, 'initial writeValue produced NO valueChanges').toEqual([]);
    expect(live.reactiveTouched, 'control is untouched at init').toBe(false);
    expect(live.reactivePristine, 'control is pristine at init').toBe(true);
  });

  test('reactive user edit updates the model EXACTLY once', async ({ page }) => {
    await bootCsr(page);
    const widget = page.locator('#reactive enhanced-select');
    await widget.locator('input[role="combobox"]').first().click({ timeout: 5000 });
    await widget.locator('select-option').nth(2).click({ timeout: 5000 }); // "c"

    await expect
      .poll(async () => (await readState(page)).reactiveValue, {
        message: 'reactive model updated to c',
        timeout: 5000,
      })
      .toBe('c');
    const s = await readState(page);
    expect(s.reactiveValueChanges, 'exactly one valueChanges emission for the edit').toEqual(['c']);
  });

  test('template-driven ngModel updates the model on user edit', async ({ page }) => {
    await bootCsr(page);
    const initial = await readLive(page);
    expect(initial.templateValue, 'template initial value from ngModel').toBe('c');

    const widget = page.locator('#template enhanced-select');
    await widget.locator('input[role="combobox"]').first().click({ timeout: 5000 });
    await widget.locator('select-option').nth(0).click({ timeout: 5000 }); // "a"

    await expect
      .poll(async () => (await readLive(page)).templateValue, {
        message: 'ngModel value updated to a',
        timeout: 5000,
      })
      .toBe('a');
  });

  test('formControlName (multi) writes an array to the FormGroup', async ({ page }) => {
    await bootCsr(page);
    const widget = page.locator('#formgroup enhanced-select');
    await widget.locator('input[role="combobox"]').first().click({ timeout: 5000 });
    await widget.locator('select-option').nth(1).click({ timeout: 5000 }); // "b" (a already selected)

    await expect
      .poll(
        async () => {
          const g = (await readLive(page)).groupValue;
          return Array.isArray(g) ? [...g].sort() : g;
        },
        { message: 'FormGroup multi value is an array containing a and b', timeout: 5000 },
      )
      .toEqual(['a', 'b']);
    const s = await readState(page);
    expect(s.groupChanges, 'at least one valueChanges for the group edit').toBeGreaterThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Q-07 — real focus transitions + touched callbacks
// ─────────────────────────────────────────────────────────────────────────────

test.describe('@csr-qualification Q-07 — focus & touched', () => {
  test('shadow-aware real focus lands inside the widget', async ({ page }) => {
    await bootCsr(page);
    const combobox = page.locator('#reactive enhanced-select input[role="combobox"]').first();
    await combobox.focus();

    const reach = await page.evaluate(() => {
      const host = document.querySelector('#reactive') as HTMLElement;
      const enh = host.querySelector('enhanced-select') as HTMLElement;
      const cb = enh.shadowRoot?.querySelector('input[role="combobox"]') as HTMLElement | null;
      let active: Element | null = document.activeElement;
      while (active && (active as HTMLElement).shadowRoot?.activeElement) {
        active = (active as HTMLElement).shadowRoot!.activeElement;
      }
      return { hasCombobox: !!cb, activeIsCombobox: active === cb };
    });
    expect(reach.hasCombobox, 'widget exposes a combobox').toBe(true);
    expect(reach.activeIsCombobox, 'composed active element IS the widget combobox').toBe(true);
  });

  test('REAL focus-loss marks the reactive control touched exactly once', async ({ page }) => {
    await bootCsr(page);

    // A real external focus target.
    await page.evaluate(() => {
      const b = document.createElement('button');
      b.id = 'focus-sink';
      b.textContent = 'sink';
      b.style.cssText = 'display:block;width:120px;height:32px;margin-top:8px;';
      document.body.appendChild(b);
    });

    const host = page.locator('#reactive');
    await host.locator('enhanced-select input[role="combobox"]').first().focus();
    expect((await readLive(page)).reactiveTouched, 'not touched while focused').toBe(false);
    await page.locator('#focus-sink').focus();

    await expect
      .poll(async () => (await readLive(page)).reactiveTouched, {
        message: 'control touched after genuine focus-loss',
        timeout: 5000,
      })
      .toBe(true);
    await expect(host, 'host reflects ng-touched class').toHaveClass(/ng-touched/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Q-08 — disabled-state + programmatic updates reconciled
// ─────────────────────────────────────────────────────────────────────────────

test.describe('@csr-qualification Q-08 — disabled & programmatic updates', () => {
  test('statically disabled control is disabled on the element', async ({ page }) => {
    await bootCsr(page);
    const disabled = await page.evaluate(() => {
      const host = document.querySelector('#disabled') as HTMLElement;
      const enh = host.querySelector('enhanced-select') as unknown as { _config?: { enabled?: boolean } };
      const input = (host.querySelector('enhanced-select') as HTMLElement).shadowRoot?.querySelector(
        'input[role="combobox"]',
      ) as HTMLInputElement | null;
      return { enabled: enh._config?.enabled, inputDisabled: input?.disabled ?? null };
    });
    expect(disabled.enabled, 'declaratively disabled control is not enabled').toBe(false);
    expect(disabled.inputDisabled, 'combobox input is disabled').toBe(true);
  });

  test('programmatic setValue updates the element with NO echo', async ({ page }) => {
    await bootCsr(page);
    const before = (await readState(page)).reactiveValueChanges.length;
    await page.evaluate(() =>
      (window as unknown as { __csrApi: { setReactiveValue: (v: string) => void } }).__csrApi.setReactiveValue('c'),
    );

    await expect
      .poll(async () => (await readLive(page)).reactiveValue, { message: 'setValue applied', timeout: 5000 })
      .toBe('c');
    // writeValue path: the model already holds 'c', so the desired==current →
    // zero additional valueChanges beyond the model's own single emission.
    const after = await readState(page);
    expect(after.reactiveValueChanges.length, 'setValue produced no programmatic echo beyond the model update').toBe(
      before + 1,
    );
    expect(after.reactiveValueChanges.slice(-1)[0], 'the single change was the setValue itself').toBe('c');
  });

  test('programmatic enable/disable toggles the element config', async ({ page }) => {
    await bootCsr(page);
    expect((await readState(page)).toggledDisabled, 'toggled control starts enabled').toBe(false);

    await page.evaluate(() =>
      (window as unknown as { __csrApi: { toggleToggledDisabled: () => void } }).__csrApi.toggleToggledDisabled(),
    );
    await expect
      .poll(async () => (await readState(page)).toggledDisabled, { message: 'control disabled', timeout: 5000 })
      .toBe(true);

    const cfg = await page.evaluate(() => {
      const host = document.querySelector('#toggled') as HTMLElement;
      const enh = host.querySelector('enhanced-select') as unknown as { _config?: { enabled?: boolean } };
      return enh._config?.enabled;
    });
    expect(cfg, 'element config reconciled to disabled').toBe(false);

    await page.evaluate(() =>
      (window as unknown as { __csrApi: { toggleToggledDisabled: () => void } }).__csrApi.toggleToggledDisabled(),
    );
    await expect
      .poll(async () => (await readState(page)).toggledDisabled, { message: 'control re-enabled', timeout: 5000 })
      .toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Q-09 — deferred init + destruction safety
// ─────────────────────────────────────────────────────────────────────────────

test.describe('@csr-qualification Q-09 — deferred init & destruction', () => {
  test('items bound AFTER init are applied to the element', async ({ page }) => {
    await bootCsr(page);
    const s = await readState(page);
    expect(s.lateItemsBound, 'late items were bound').toBe(true);

    // The late-bound select actually has options once opened.
    const widget = page.locator('#late enhanced-select');
    await widget.locator('input[role="combobox"]').first().click({ timeout: 5000 });
    await expect(widget.locator('select-option').first(), 'late-bound items rendered').toBeVisible({
      timeout: 5000,
    });
  });

  test('destroy then recreate the select keeps the app healthy', async ({ page }) => {
    await bootCsr(page);
    await expect(page.locator('#removable')).toBeVisible();

    await page.evaluate(() =>
      (window as unknown as { __csrApi: { recreateRemovable: () => void } }).__csrApi.recreateRemovable(),
    );

    await expect
      .poll(async () => (await readState(page)).removedOnce, {
        message: 'destroy/recreate cycle completed',
        timeout: 5000,
      })
      .toBe(true);
    await expect(page.locator('#removable'), 'recreated select is visible').toBeVisible();

    // Recreated control is interactive (deferred init after re-mount works).
    const widget = page.locator('#removable enhanced-select');
    await widget.locator('input[role="combobox"]').first().click({ timeout: 5000 });
    await expect(widget.locator('select-option').first(), 'recreated widget opens').toBeVisible({
      timeout: 5000,
    });
  });

  test('no errors surface after teardown (late async settles ignored)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error' && !/favicon/i.test(m.text())) errors.push(m.text());
    });

    await bootCsr(page);
    await page.evaluate(() =>
      (window as unknown as { __csrApi: { recreateRemovable: () => void } }).__csrApi.recreateRemovable(),
    );
    await expect
      .poll(async () => (await readState(page)).removedOnce, { timeout: 5000 })
      .toBe(true);

    // Allow any late async completions to settle; nothing should error.
    await page.waitForTimeout(500);
    expect(errors, `no console/page errors after teardown. Got: ${errors.join(' | ')}`).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Q-10 — full-core import cannot revive the host collision
// ─────────────────────────────────────────────────────────────────────────────

test.describe('@csr-qualification Q-10 — full-core host collision', () => {
  test('full core is loaded yet Angular hosts are NOT upgraded by it', async ({ page }) => {
    await bootCsr(page);

    const coreState = await page.evaluate(() => ({
      smilodonSelect: !!customElements.get('smilodon-select'),
      enhancedSelect: !!customElements.get('enhanced-select'),
      selectOption: !!customElements.get('select-option'),
    }));
    expect(coreState.smilodonSelect, 'full core loaded (smilodon-select defined)').toBe(true);
    expect(coreState.enhancedSelect, 'enhanced-select defined').toBe(true);
    expect(coreState.selectOption, 'select-option defined').toBe(true);

    const hosts = await page.evaluate(() =>
      ['plain', 'reactive', 'multi'].map((id) => {
        const host = document.querySelector(`#${id}`) as HTMLElement;
        const enh = host.querySelector('enhanced-select') as HTMLElement | null;
        const r = enh?.getBoundingClientRect();
        return {
          id,
          tag: host.tagName.toLowerCase(),
          hasForeignShadow: host.shadowRoot !== null,
          widgetW: r?.width ?? 0,
          widgetH: r?.height ?? 0,
        };
      }),
    );

    for (const h of hosts) {
      expect(h.tag, `${h.id} uses remediated selector`).toBe('smilodon-angular-select');
      expect(h.hasForeignShadow, `${h.id} NOT upgraded by core`).toBe(false);
      expect(h.widgetW, `${h.id} widget has width`).toBeGreaterThan(0);
      expect(h.widgetH, `${h.id} widget has height`).toBeGreaterThan(0);
    }

    // One widget still opens under full-core presence.
    const widget = page.locator('#plain enhanced-select');
    await widget.locator('input[role="combobox"]').first().click({ timeout: 5000 });
    await expect(widget.locator('select-option').first(), 'widget opens under full core').toBeVisible({
      timeout: 5000,
    });
  });
});
