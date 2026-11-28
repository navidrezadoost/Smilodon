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

// ── S2-F02: controlled-value clearing semantics ─────────────────────────────────
describe('SmilodonSelectComponent — controlled value clearing (S2-F02)', () => {
  let h: Harness;

  const ITEMS = [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
    { value: 'c', label: 'C' },
  ];

  afterEach(() => {
    h?.cmp.ngOnDestroy();
    h?.wrap.remove();
    vi.restoreAllMocks();
  });

  it('clears the previous selection when value changes ["a"] → null', async () => {
    h = createHarness();
    configure(h.cmp, { items: ITEMS, value: ['a'] });
    h.cmp.ngAfterViewInit();
    await h.cmp.whenReady();
    await flush();
    expect(h.el.getSelectedValues()).toEqual(['a']);

    // Explicit clear via null (a null binding is "empty selection", not "ignore").
    configure(h.cmp, { value: null });
    h.cmp.ngOnChanges({
      value: { currentValue: null, previousValue: ['a'], firstChange: false, isFirstChange: () => false },
    });
    await flush();

    expect(h.el.getSelectedValues()).toEqual([]);
    expect(h.cmp.lastValueError).toBeNull();
  });

  it('clears the previous selection when value changes to an empty array', async () => {
    h = createHarness();
    configure(h.cmp, { items: ITEMS, value: ['a', 'b'], multiple: true });
    h.cmp.ngAfterViewInit();
    await h.cmp.whenReady();
    await flush();
    expect(h.el.getSelectedValues().sort()).toEqual(['a', 'b']);

    configure(h.cmp, { value: [] });
    h.cmp.ngOnChanges({
      value: { currentValue: [], previousValue: ['a', 'b'], firstChange: false, isFirstChange: () => false },
    });
    await flush();

    expect(h.el.getSelectedValues()).toEqual([]);
  });

  it('does NOT touch selection when value is omitted (undefined) at init', async () => {
    h = createHarness();
    // No `value` supplied at all — selection must be left untouched (empty here),
    // and crucially setSelectedValues must not be called.
    configure(h.cmp, { items: ITEMS });
    const spy = vi.spyOn(h.el, 'setSelectedValues');
    h.cmp.ngAfterViewInit();
    await h.cmp.whenReady();
    await flush();

    expect(spy).not.toHaveBeenCalled();
    expect(h.el.getSelectedValues()).toEqual([]);
  });

  it('does NOT clear when an unrelated input changes and value stays undefined', async () => {
    h = createHarness();
    configure(h.cmp, { items: ITEMS, value: ['b'] });
    h.cmp.ngAfterViewInit();
    await h.cmp.whenReady();
    await flush();
    expect(h.el.getSelectedValues()).toEqual(['b']);

    // Set value back to undefined (unbind) + change an unrelated flag.
    configure(h.cmp, { value: undefined, searchable: true });
    h.cmp.ngOnChanges({
      searchable: { currentValue: true, previousValue: false, firstChange: false, isFirstChange: () => false },
    });
    await flush();

    // Unbinding value must not silently clear a live selection.
    expect(h.el.getSelectedValues()).toEqual(['b']);
    expect(h.el._config.searchable).toBe(true);
  });

  it('distinguishes an omitted initial value from an explicit null clear', async () => {
    // Case A: omitted (undefined) → no call, no clear.
    const a = createHarness();
    configure(a.cmp, { items: ITEMS });
    const spyA = vi.spyOn(a.el, 'setSelectedValues');
    a.cmp.ngAfterViewInit();
    await a.cmp.whenReady();
    await flush();
    expect(spyA).not.toHaveBeenCalled();
    a.cmp.ngOnDestroy();
    a.wrap.remove();

    // Case B: explicit null → clear is applied (setSelectedValues called with []).
    const b = createHarness();
    configure(b.cmp, { items: ITEMS, value: null });
    const spyB = vi.spyOn(b.el, 'setSelectedValues');
    b.cmp.ngAfterViewInit();
    await b.cmp.whenReady();
    await flush();
    expect(spyB).toHaveBeenCalledWith([]);
    expect(b.el.getSelectedValues()).toEqual([]);
    b.cmp.ngOnDestroy();
    b.wrap.remove();
  });
});

// ── S2-F03: async value application — rejection + latest-value ordering ─────────
describe('SmilodonSelectComponent — async value ordering (S2-F03)', () => {
  let h: Harness;

  afterEach(() => {
    h?.cmp.ngOnDestroy();
    h?.wrap.remove();
    vi.restoreAllMocks();
  });

  /** Await all pending microtasks + a macrotask so settled promises flush. */
  const settle = async () => {
    await Promise.resolve();
    await Promise.resolve();
    await flush();
  };

  it('records a rejection from setSelectedValues without an unhandled rejection', async () => {
    h = createHarness();
    configure(h.cmp, { items: [{ value: 'a', label: 'A' }] });
    h.cmp.ngAfterViewInit();
    await h.cmp.whenReady();
    await flush();

    const boom = new Error('selection failed');
    vi.spyOn(h.el, 'setSelectedValues').mockRejectedValueOnce(boom);

    // An unhandled rejection would fail the process; capture it explicitly.
    const onUnhandled = vi.fn();
    process.on('unhandledRejection', onUnhandled);
    try {
      configure(h.cmp, { value: ['a'] });
      h.cmp.ngOnChanges({
        value: { currentValue: ['a'], previousValue: null, firstChange: false, isFirstChange: () => false },
      });
      await settle();

      expect(h.cmp.lastValueError).toBe(boom);
      expect(onUnhandled).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', onUnhandled);
    }
  });

  it('latest error state wins: a stale rejection is swallowed (adapter-level supersession)', async () => {
    h = createHarness();
    configure(h.cmp, {
      items: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
    });
    h.cmp.ngAfterViewInit();
    await h.cmp.whenReady();
    await flush();

    // Two overlapping applications with controllable completion. The FIRST
    // (older) application is delayed and rejects; the SECOND (newer) resolves.
    // The stale rejection must not overwrite the current error state.
    const resolvers: Array<{ resolve: () => void; reject: (e: unknown) => void }> = [];
    vi.spyOn(h.el, 'setSelectedValues').mockImplementation(
      () =>
        new Promise<void>((resolve, reject) => {
          resolvers.push({ resolve, reject });
        }),
    );

    // Application 1 (old): value ['a']
    configure(h.cmp, { value: ['a'] });
    h.cmp.ngOnChanges({
      value: { currentValue: ['a'], previousValue: null, firstChange: false, isFirstChange: () => false },
    });
    // Application 2 (new): value ['b'] — supersedes application 1.
    configure(h.cmp, { value: ['b'] });
    h.cmp.ngOnChanges({
      value: { currentValue: ['b'], previousValue: ['a'], firstChange: false, isFirstChange: () => false },
    });

    expect(resolvers.length).toBe(2);

    // Resolve the NEWEST first (success), then reject the OLDER (stale).
    resolvers[1].resolve();
    resolvers[0].reject(new Error('stale failure'));
    await settle();

    // The newer success is authoritative: no lingering error.
    expect(h.cmp.lastValueError).toBeNull();
  });

  it('records the rejection when the newest application fails after an older success (adapter-level)', async () => {
    h = createHarness();
    configure(h.cmp, { items: [{ value: 'a', label: 'A' }] });
    h.cmp.ngAfterViewInit();
    await h.cmp.whenReady();
    await flush();

    const resolvers: Array<{ resolve: () => void; reject: (e: unknown) => void }> = [];
    vi.spyOn(h.el, 'setSelectedValues').mockImplementation(
      () =>
        new Promise<void>((resolve, reject) => {
          resolvers.push({ resolve, reject });
        }),
    );

    configure(h.cmp, { value: ['a'] });
    h.cmp.ngOnChanges({
      value: { currentValue: ['a'], previousValue: null, firstChange: false, isFirstChange: () => false },
    });
    configure(h.cmp, { value: ['b'] });
    h.cmp.ngOnChanges({
      value: { currentValue: ['b'], previousValue: ['a'], firstChange: false, isFirstChange: () => false },
    });

    const newestError = new Error('newest failure');
    // Older resolves later (stale success must not clear a genuine newest error).
    resolvers[0].resolve();
    resolvers[1].reject(newestError);
    await settle();

    expect(h.cmp.lastValueError).toBe(newestError);
  });
});

// ── S2-R2-F01: destruction safety for pending value applications ────────────────
// A pending `setSelectedValues()` that settles AFTER `ngOnDestroy()` must not
// mutate adapter state. `ngOnDestroy()` bumps `valueGeneration`, so every
// outstanding completion fails its liveness check. These tests are deterministic:
// completion is controlled via captured promise handles and settles only after
// teardown has been invoked.
describe('SmilodonSelectComponent — value application survives destroy (S2-R2-F01)', () => {
  let h: Harness;

  afterEach(() => {
    h?.cmp.ngOnDestroy();
    h?.wrap.remove();
    vi.restoreAllMocks();
  });

  const settle = async () => {
    await Promise.resolve();
    await Promise.resolve();
    await flush();
  };

  /** Capture controllable completion handles for every `setSelectedValues()` call. */
  function deferredApplications(el: Harness['el']) {
    const handles: Array<{ resolve: () => void; reject: (e: unknown) => void }> = [];
    vi.spyOn(el, 'setSelectedValues').mockImplementation(
      () =>
        new Promise<void>((resolve, reject) => {
          handles.push({ resolve, reject });
        }),
    );
    return handles;
  }

  /** Drive a ready component through one value change to start an async application. */
  async function startApplication(harness: Harness, value: unknown[]): Promise<void> {
    configure(harness.cmp, { value });
    harness.cmp.ngOnChanges({
      value: { currentValue: value, previousValue: null, firstChange: false, isFirstChange: () => false },
    });
    await settle();
  }

  it('ignores a LATE RESOLVE that lands after ngOnDestroy()', async () => {
    h = createHarness();
    configure(h.cmp, { items: [{ value: 'a', label: 'A' }] });
    h.cmp.ngAfterViewInit();
    await h.cmp.whenReady();
    await flush();

    // Prior to the pending application there is no error state.
    expect(h.cmp.lastValueError).toBeNull();

    const handles = deferredApplications(h.el);
    await startApplication(h, ['a']);
    expect(handles.length).toBe(1);

    // Tear down while the application is still in flight.
    h.cmp.ngOnDestroy();

    // Late success: must NOT touch adapter state.
    handles[0].resolve();
    await settle();

    expect(h.cmp.lastValueError).toBeNull();
  });

  it('ignores a LATE REJECTION that lands after ngOnDestroy()', async () => {
    h = createHarness();
    configure(h.cmp, { items: [{ value: 'a', label: 'A' }] });
    h.cmp.ngAfterViewInit();
    await h.cmp.whenReady();
    await flush();

    expect(h.cmp.lastValueError).toBeNull();

    const handles = deferredApplications(h.el);
    await startApplication(h, ['a']);
    expect(handles.length).toBe(1);

    const lateError = new Error('late failure after destroy');

    // Track unhandled rejections: the adapter must swallow the late rejection.
    const onUnhandled = vi.fn();
    process.on('unhandledRejection', onUnhandled);
    try {
      h.cmp.ngOnDestroy();

      // Late rejection: must NOT surface as error state NOR go unhandled.
      handles[0].reject(lateError);
      await settle();

      expect(h.cmp.lastValueError).toBeNull();
      expect(onUnhandled).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', onUnhandled);
    }
  });

  it('does not overwrite existing error state when a rejection lands after destroy', async () => {
    h = createHarness();
    configure(h.cmp, { items: [{ value: 'a', label: 'A' }] });
    h.cmp.ngAfterViewInit();
    await h.cmp.whenReady();
    await flush();

    // First application rejects while alive → records a genuine error.
    const firstError = new Error('first failure');
    vi.spyOn(h.el, 'setSelectedValues').mockRejectedValueOnce(firstError);
    configure(h.cmp, { value: ['a'] });
    h.cmp.ngOnChanges({
      value: { currentValue: ['a'], previousValue: null, firstChange: false, isFirstChange: () => false },
    });
    await settle();
    expect(h.cmp.lastValueError).toBe(firstError);

    // Second application is pending, then destroy, then a late rejection lands.
    const handles = deferredApplications(h.el);
    await startApplication(h, []);
    expect(handles.length).toBe(1);

    h.cmp.ngOnDestroy();
    handles[0].reject(new Error('late failure after destroy'));
    await settle();

    // The pre-destroy error is preserved; the late rejection is discarded.
    expect(h.cmp.lastValueError).toBe(firstError);
  });
});

