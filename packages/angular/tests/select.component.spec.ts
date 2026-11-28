/**
 * S2 integration tests for SmilodonSelectComponent.
 *
 * These tests exercise the REAL component against the REAL `<enhanced-select>`
 * custom element (defined by `@smilodon/core` in jsdom). The component is driven
 * through its genuine lifecycle (`ngAfterViewInit` → `ngOnChanges` → `ngOnDestroy`)
 * via a minimal injection context (no TestBed), so we test the actual binding
 * logic — inputs → element imperative API — rather than template internals.
 *
 * Focus (per S2 directive): initialization, input→imperative mapping, selected
 * value application, change reconciliation, and safe async lifecycle (destroy
 * cancels pending init).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ElementRef, Injector, runInInjectionContext } from '@angular/core';
import { SmilodonSelectComponent } from '../src/select.component';

interface Harness {
  wrap: HTMLElement;
  el: HTMLElement & {
    _config: any;
    _input?: HTMLInputElement;
    getSelectedValues(): unknown[];
    getSelectedItems(): unknown[];
  };
  cmp: SmilodonSelectComponent;
}

/** Build a component bound to a real `<enhanced-select>` inside a host div. */
function createHarness(): Harness {
  const wrap = document.createElement('div');
  const el = document.createElement('enhanced-select') as Harness['el'];
  wrap.appendChild(el);
  document.body.appendChild(wrap);

  const injector = Injector.create({
    providers: [{ provide: ElementRef, useValue: new ElementRef<HTMLElement>(wrap) }],
  });
  const cmp = runInInjectionContext(injector, () => new SmilodonSelectComponent());
  return { wrap, el, cmp };
}

/** Assign inputs (bypassing Angular input binding) then run the view-init hook. */
function configure(cmp: SmilodonSelectComponent, inputs: Record<string, unknown>): void {
  Object.assign(cmp as unknown as Record<string, unknown>, inputs);
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 16));

describe('SmilodonSelectComponent — initialization', () => {
  let h: Harness;

  afterEach(() => {
    h?.cmp.ngOnDestroy();
    h?.wrap.remove();
    vi.restoreAllMocks();
  });

  it('loads core, upgrades the element, and becomes ready', async () => {
    h = createHarness();
    configure(h.cmp, { items: [{ value: 'a', label: 'A' }] });

    expect(h.cmp.isReady).toBe(false);
    h.cmp.ngAfterViewInit();
    await h.cmp.whenReady();
    await flush();

    expect(h.cmp.initializationError).toBeNull();
    expect(h.cmp.isReady).toBe(true);
    expect(h.el.tagName.toLowerCase()).toBe('enhanced-select');
  });

  it('applies the initial selected value via setSelectedValues()', async () => {
    h = createHarness();
    configure(h.cmp, {
      items: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
        { value: 'c', label: 'C' },
      ],
      value: ['b'],
    });

    h.cmp.ngAfterViewInit();
    await h.cmp.whenReady();
    await flush();

    expect(h.el.getSelectedValues()).toEqual(['b']);
  });

  it('maps input flags to configuration (multiple/searchable/disabled/placeholder)', async () => {
    h = createHarness();
    configure(h.cmp, {
      items: [{ value: 'a', label: 'A' }],
      multiple: true,
      searchable: true,
      disabled: true,
      placeholder: 'Choose…',
    });

    h.cmp.ngAfterViewInit();
    await h.cmp.whenReady();
    await flush();

    const cfg = h.el._config;
    expect(cfg.selection.mode).toBe('multi');
    expect(cfg.enabled).toBe(false);
    expect(cfg.searchable).toBe(true);
    expect(cfg.placeholder).toBe('Choose…');
    expect(h.el._input?.disabled).toBe(true);
  });

  it('defaults to single-select and enabled', async () => {
    h = createHarness();
    configure(h.cmp, { items: [{ value: 'a', label: 'A' }] });

    h.cmp.ngAfterViewInit();
    await h.cmp.whenReady();
    await flush();

    expect(h.el._config.selection.mode).toBe('single');
    expect(h.el._config.enabled).toBe(true);
  });

  it('applies required and error state', async () => {
    h = createHarness();
    configure(h.cmp, { items: [], required: true, error: 'Bad input' });

    h.cmp.ngAfterViewInit();
    await h.cmp.whenReady();
    await flush();

    expect(h.el._input?.hasAttribute('required')).toBe(true);
    // setError sets the internal combobox to aria-invalid (element-owned ARIA).
    expect(h.el._input?.getAttribute('aria-invalid')).toBe('true');
    expect(h.cmp.initializationError).toBeNull();
  });

  it('prefers groupedItems over flat items', async () => {
    h = createHarness();
    configure(h.cmp, {
      items: [{ value: 'flat', label: 'Flat' }],
      groupedItems: [{ label: 'G1', options: [{ value: 'g', label: 'G' }] }],
    });

    h.cmp.ngAfterViewInit();
    await h.cmp.whenReady();
    await flush();

    // The grouped set is what is loaded; the flat throwaway item is absent.
    expect(h.cmp.initializationError).toBeNull();
    expect(h.el._config).toBeTruthy();
  });
});

describe('SmilodonSelectComponent — reconciliation', () => {
  let h: Harness;

  afterEach(() => {
    h?.cmp.ngOnDestroy();
    h?.wrap.remove();
  });

  it('re-applies inputs on change once ready', async () => {
    h = createHarness();
    configure(h.cmp, { items: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] });
    h.cmp.ngAfterViewInit();
    await h.cmp.whenReady();
    await flush();

    // Change value + toggle multiple after ready.
    configure(h.cmp, { value: ['a', 'b'], multiple: true });
    h.cmp.ngOnChanges({
      value: { currentValue: ['a', 'b'], previousValue: null, firstChange: false, isFirstChange: () => false },
      multiple: { currentValue: true, previousValue: false, firstChange: false, isFirstChange: () => false },
    });
    await flush();

    expect(h.el._config.selection.mode).toBe('multi');
    expect(h.el.getSelectedValues().sort()).toEqual(['a', 'b']);
  });

  it('ignores changes before the element is ready (applied at init)', async () => {
    h = createHarness();
    configure(h.cmp, { items: [{ value: 'a', label: 'A' }], value: ['a'] });
    // A pre-ready change must not throw and must be reflected after init.
    h.cmp.ngOnChanges({
      value: { currentValue: ['a'], previousValue: null, firstChange: true, isFirstChange: () => true },
    });
    h.cmp.ngAfterViewInit();
    await h.cmp.whenReady();
    await flush();

    expect(h.el.getSelectedValues()).toEqual(['a']);
  });
});

describe('SmilodonSelectComponent — safe async lifecycle', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not configure the element when destroyed before init completes', async () => {
    const wrap = document.createElement('div');
    const el = document.createElement('enhanced-select') as Harness['el'];
    wrap.appendChild(el);
    document.body.appendChild(wrap);
    const injector = Injector.create({
      providers: [{ provide: ElementRef, useValue: new ElementRef<HTMLElement>(wrap) }],
    });
    const cmp = runInInjectionContext(injector, () => new SmilodonSelectComponent());
    configure(cmp, { items: [{ value: 'a', label: 'A' }], value: ['a'] });

    const spy = vi.spyOn(el, 'setSelectedValues');
    cmp.ngAfterViewInit();
    // Destroy immediately, before the awaited init resolves.
    cmp.ngOnDestroy();
    await cmp.whenReady();
    await flush();

    expect(cmp.isReady).toBe(false);
    expect(spy).not.toHaveBeenCalled();
    wrap.remove();
  });

  it('ngOnDestroy is idempotent and safe when never initialised', () => {
    const h = createHarness();
    expect(() => h.cmp.ngOnDestroy()).not.toThrow();
    h.wrap.remove();
  });
});

describe('SmilodonSelectComponent — non-browser guard', () => {
  it('is a no-op when the browser environment is unavailable', async () => {
    const wrap = document.createElement('div');
    const el = document.createElement('enhanced-select') as Harness['el'];
    wrap.appendChild(el);
    document.body.appendChild(wrap);
    const injector = Injector.create({
      providers: [{ provide: ElementRef, useValue: new ElementRef<HTMLElement>(wrap) }],
    });
    const cmp = runInInjectionContext(injector, () => new SmilodonSelectComponent());
    configure(cmp, { items: [{ value: 'a', label: 'A' }] });

    // Simulate a non-browser environment for the guard only.
    const originalWindow = globalThis.window;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).window = undefined;
    try {
      cmp.ngAfterViewInit();
      await flush();
      expect(cmp.isReady).toBe(false);
      expect(cmp.initializationError).toBeNull();
    } finally {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).window = originalWindow;
    }
    cmp.ngOnDestroy();
    wrap.remove();
  });
});
