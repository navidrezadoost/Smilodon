/**
 * S4 — ControlValueAccessor unit tests against the REAL `<enhanced-select>`.
 *
 * These drive the component through the genuine `ControlValueAccessor` hooks
 * (writeValue / registerOnChange / registerOnTouched / setDisabledState) and the
 * real element, WITHOUT a form directive — proving the accessor mechanics in
 * isolation. The compiled-Angular `FormControl` / `ngModel` / `formControlName`
 * integration is exercised separately (see the AOT consumer runner), which is the
 * Lead-mandated "real form" evidence.
 *
 * The central S4 guarantee under test: `onChange` fires ONLY for genuine user
 * edits; `writeValue`/init/reconcile are NEVER echoed back into the form model;
 * `onTouched` fires only at a user edit boundary; single/multi value
 * representations are documented and honoured; disabled reconciles without a
 * competing config write.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ElementRef, Injector, runInInjectionContext } from '@angular/core';
import { SmilodonSelectComponent } from '../src/select.component';

interface Harness {
  wrap: HTMLElement;
  el: HTMLElement & {
    _config: any;
    _input?: HTMLInputElement;
    open(): void;
    close(): void;
    getSelectedValues(): unknown[];
  };
  cmp: SmilodonSelectComponent;
  changes: unknown[];
  touched(): number;
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 16));

const ITEMS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Bravo' },
  { value: 'c', label: 'Charlie' },
];

async function createHarness(inputs: Record<string, unknown>): Promise<Harness> {
  const wrap = document.createElement('div');
  const el = document.createElement('enhanced-select') as Harness['el'];
  wrap.appendChild(el);
  document.body.appendChild(wrap);

  const injector = Injector.create({
    providers: [{ provide: ElementRef, useValue: new ElementRef<HTMLElement>(wrap) }],
  });
  const cmp = runInInjectionContext(injector, () => new SmilodonSelectComponent());
  Object.assign(cmp as unknown as Record<string, unknown>, inputs);

  const changes: unknown[] = [];
  let touchedCount = 0;
  cmp.registerOnChange((v) => changes.push(v));
  cmp.registerOnTouched(() => {
    touchedCount += 1;
  });

  cmp.ngAfterViewInit();
  await cmp.whenReady();
  await flush();

  return {
    wrap,
    el,
    cmp,
    changes,
    touched: () => touchedCount,
  };
}

/** Dispatch a real user click on the option at `index` in the open listbox. */
function clickOption(h: Harness, index: number): void {
  const option = h.el.shadowRoot?.querySelector(`[data-index="${index}"]`);
  if (!option) throw new Error(`option ${index} not found`);
  option.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

const settle = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await flush();
};

describe('SmilodonSelectComponent — ControlValueAccessor: writeValue never echoes', () => {
  let h: Harness | undefined;

  afterEach(() => {
    h?.cmp.ngOnDestroy();
    h?.wrap.remove();
    h = undefined;
    vi.restoreAllMocks();
  });

  it('writeValue() applies the value but does NOT call onChange', async () => {
    h = await createHarness({ items: ITEMS, multiple: true });
    expect(h.changes).toEqual([]);

    h.cmp.writeValue(['b']);
    await settle();

    expect(h.el.getSelectedValues()).toEqual(['b']);
    // Programmatic sync must NOT reach the form model.
    expect(h.changes).toEqual([]);
    expect(h.touched()).toBe(0);
  });

  it('an initial value applied during init does NOT call onChange', async () => {
    // Form model written BEFORE the element is ready → deferred, applied at init.
    // The change emitted during that init sync must not leak to onChange.
    h?.cmp.ngOnDestroy();
    h?.wrap.remove();
    h = undefined;

    const wrap = document.createElement('div');
    const el = document.createElement('enhanced-select') as Harness['el'];
    wrap.appendChild(el);
    document.body.appendChild(wrap);
    const injector = Injector.create({
      providers: [{ provide: ElementRef, useValue: new ElementRef<HTMLElement>(wrap) }],
    });
    const cmp = runInInjectionContext(injector, () => new SmilodonSelectComponent());
    Object.assign(cmp as unknown as Record<string, unknown>, { items: ITEMS, multiple: true });
    const changes: unknown[] = [];
    cmp.registerOnChange((v) => changes.push(v));
    // writeValue BEFORE ngAfterViewInit (element not ready).
    cmp.writeValue(['a', 'c']);
    cmp.ngAfterViewInit();
    await cmp.whenReady();
    await settle();

    expect(el.getSelectedValues().sort()).toEqual(['a', 'c']);
    expect(changes).toEqual([]);
    cmp.ngOnDestroy();
    wrap.remove();
  });

  it('writeValue(undefined) never clears; writeValue(null) clears', async () => {
    h = await createHarness({ items: ITEMS, multiple: true, value: ['a'] });
    expect(h.el.getSelectedValues()).toEqual(['a']);

    // undefined = "no value yet" → must NOT clear.
    h.cmp.writeValue(undefined);
    await settle();
    expect(h.el.getSelectedValues()).toEqual(['a']);

    // null = explicit clear.
    h.cmp.writeValue(null);
    await settle();
    expect(h.el.getSelectedValues()).toEqual([]);
    expect(h.changes).toEqual([]);
  });

  it('a controlled [value] input is IGNORED once the control is form-controlled', async () => {
    // Form model owns selection; a stale [value] must not fight it.
    h = await createHarness({ items: ITEMS, multiple: true, value: ['a'] });
    expect(h.el.getSelectedValues()).toEqual(['a']);

    h.cmp.writeValue(['b']); // form takes over
    await settle();
    expect(h.el.getSelectedValues()).toEqual(['b']);

    // A later ngOnChanges (as if [value] changed) must be ignored.
    (h.cmp as unknown as Record<string, unknown>).value = ['c'];
    h.cmp.ngOnChanges({
      value: { currentValue: ['c'], previousValue: ['a'], firstChange: false, isFirstChange: () => false },
    });
    await settle();
    expect(h.el.getSelectedValues()).toEqual(['b']);
  });
});

describe('SmilodonSelectComponent — ControlValueAccessor: user edits', () => {
  let h: Harness | undefined;

  afterEach(() => {
    h?.cmp.ngOnDestroy();
    h?.wrap.remove();
    h = undefined;
  });

  it('multi: a user click calls onChange exactly once with an ARRAY', async () => {
    h = await createHarness({ items: ITEMS, multiple: true });
    h.changes.length = 0;

    h.el.open();
    await flush();
    clickOption(h, 0);
    await settle();

    expect(h.changes).toEqual([['a']]);
    expect(h.el.getSelectedValues()).toEqual(['a']);
  });

  it('multi: successive clicks report accumulating arrays, one change each', async () => {
    h = await createHarness({ items: ITEMS, multiple: true });
    h.changes.length = 0;

    h.el.open();
    await flush();
    clickOption(h, 0);
    await settle();
    h.el.open();
    await flush();
    clickOption(h, 1);
    await settle();

    expect(h.changes).toEqual([['a'], ['a', 'b']]);
  });

  it('single: a user click calls onChange exactly once with a SCALAR', async () => {
    h = await createHarness({ items: ITEMS, multiple: false });
    h.changes.length = 0;

    h.el.open();
    await flush();
    clickOption(h, 1);
    await settle();

    // Single-select canonical value is a scalar (documented).
    expect(h.changes).toEqual(['b']);
    expect(h.el.getSelectedValues()).toEqual(['b']);
  });

  it('marks the control touched on a user edit (focus-loss boundary)', async () => {
    h = await createHarness({ items: ITEMS, multiple: true });
    h.el.open();
    await flush();
    clickOption(h, 0);
    await settle();

    // Touched exactly once (the user edit boundary).
    expect(h.touched()).toBe(1);
  });

  it('does NOT mark touched on init / writeValue', async () => {
    h = await createHarness({ items: ITEMS, multiple: true, value: ['a'] });
    h.cmp.writeValue(['b']);
    await settle();
    expect(h.touched()).toBe(0);
  });

  it('a multi chip-remove click is a user edit (reports the reduced array)', async () => {
    h = await createHarness({ items: ITEMS, multiple: true, value: ['a', 'b'] });
    expect(h.el.getSelectedValues().sort()).toEqual(['a', 'b']);
    h.changes.length = 0;

    const removeBtn = h.el.shadowRoot?.querySelector('[part~="chip-remove"]');
    expect(removeBtn).toBeTruthy();
    removeBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await settle();

    expect(h.changes.length).toBe(1);
    const reported = h.changes[0] as string[];
    expect(Array.isArray(reported)).toBe(true);
    expect(reported.length).toBe(1);
  });

  it('a clear-control click is a user edit even though core clears programmatically', async () => {
    h = await createHarness({
      items: ITEMS,
      multiple: true,
      value: ['a'],
      config: { clearControl: { enabled: true } },
    });
    await settle();

    const clearBtn = h.el.shadowRoot?.querySelector('[part~="clear-button"]');
    expect(clearBtn).toBeTruthy();
    h.changes.length = 0;
    clearBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await settle();

    expect(h.el.getSelectedValues()).toEqual([]);
    expect(h.changes.length).toBe(1);
    expect(h.changes[0]).toEqual([]);
  });
});

describe('SmilodonSelectComponent — ControlValueAccessor: disabled reconciliation', () => {
  let h: Harness | undefined;

  afterEach(() => {
    h?.cmp.ngOnDestroy();
    h?.wrap.remove();
    h = undefined;
  });

  it('setDisabledState(true/false) toggles the element enabled state', async () => {
    h = await createHarness({ items: ITEMS });
    expect(h.el._config.enabled).toBe(true);

    h.cmp.setDisabledState(true);
    await settle();
    expect(h.el._config.enabled).toBe(false);

    h.cmp.setDisabledState(false);
    await settle();
    expect(h.el._config.enabled).toBe(true);
  });

  it('an initial disabled form control (setDisabledState true) disables the element', async () => {
    h = await createHarness({ items: ITEMS });
    h.cmp.setDisabledState(true);
    await settle();
    expect(h.el._config.enabled).toBe(false);
    expect(h.el._input?.disabled).toBe(true);
  });

  it('does NOT emit onChange when disabled state changes', async () => {
    h = await createHarness({ items: ITEMS, multiple: true });
    h.changes.length = 0;
    h.cmp.setDisabledState(true);
    await settle();
    expect(h.changes).toEqual([]);
  });
});
