/**
 * S4-R — regression tests for the two S4 defects flagged by independent review.
 *
 *   S4-F01  Touched state must be established on FOCUS LOSS of the whole control,
 *           not on a selection change. Focus entering/leaving with no value change
 *           must mark touched; moving focus between internal controls must NOT.
 *
 *   S4-F02  An async programmatic `writeValue()` completion (server-backed fetch)
 *           must never be classified as a user edit, even if a user gesture was
 *           armed in the await gap.
 *
 * These are written to REPRODUCE each defect (they fail before the S4-R fix) and
 * then lock in the corrected behavior. They drive the real `<enhanced-select>`
 * through the genuine ControlValueAccessor hooks.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ElementRef, Injector, runInInjectionContext } from '@angular/core';
import { SmilodonSelectComponent } from '../src/select.component';

interface Harness {
  wrap: HTMLElement;
  el: HTMLElement & {
    _config: any;
    open(): void;
    close(): void;
    getSelectedValues(): unknown[];
  };
  cmp: SmilodonSelectComponent;
  changes: unknown[];
  touched(): number;
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 16));
const settle = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await flush();
};

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

  return { wrap, el, cmp, changes, touched: () => touchedCount };
}

/** Simulate a real focus transition: `focusout` on the host with a relatedTarget. */
function dispatchFocusOut(hostEl: HTMLElement, relatedTarget: EventTarget | null): void {
  hostEl.dispatchEvent(new FocusEvent('focusout', { bubbles: true, composed: true, relatedTarget }));
}

function dispatchFocusIn(hostEl: HTMLElement, relatedTarget: EventTarget | null): void {
  hostEl.dispatchEvent(new FocusEvent('focusin', { bubbles: true, composed: true, relatedTarget }));
}

function clickOption(h: Harness, index: number): void {
  const option = h.el.shadowRoot?.querySelector(`[data-index="${index}"]`);
  if (!option) throw new Error(`option ${index} not found`);
  option.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

// ─────────────────────────────────────────────────────────────────────────────
// S4-F01 — touched on focus loss
// ─────────────────────────────────────────────────────────────────────────────
describe('S4-F01 — touched on focus loss of the whole control', () => {
  let h: Harness | undefined;

  afterEach(() => {
    h?.cmp.ngOnDestroy();
    h?.wrap.remove();
    h = undefined;
    vi.restoreAllMocks();
  });

  it('marks touched when focus leaves the control (no value change)', async () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    h = await createHarness({ items: ITEMS });

    // Focus in, then out to an element outside the control — no selection change.
    dispatchFocusIn(h.wrap, null);
    expect(h.touched()).toBe(0);
    dispatchFocusOut(h.wrap, outside);
    await settle();

    expect(h.touched()).toBe(1);
    expect(h.changes).toEqual([]); // no onChange from focus alone
    outside.remove();
  });

  it('does NOT mark touched when focus moves between internal controls', async () => {
    h = await createHarness({ items: ITEMS });
    // An element INSIDE the host shadow tree (represented by a node contained in
    // the host) — moving focus to it must not count as leaving the control.
    const internal = document.createElement('span');
    h.wrap.appendChild(internal);

    dispatchFocusIn(h.wrap, null);
    dispatchFocusOut(h.wrap, internal); // relatedTarget still inside the host
    await settle();

    expect(h.touched()).toBe(0);
  });

  it('a user selection alone does NOT mark touched (only focus loss does)', async () => {
    h = await createHarness({ items: ITEMS, multiple: true });
    h.el.open();
    await flush();
    clickOption(h, 0);
    await settle();

    // onChange fired for the genuine edit …
    expect(h.changes).toEqual([['a']]);
    // … but touched has NOT fired yet (focus has not left the control).
    expect(h.touched()).toBe(0);
  });

  it('once touched, repeated focus-loss without re-focus does not double-fire', async () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    h = await createHarness({ items: ITEMS });

    dispatchFocusIn(h.wrap, null);
    dispatchFocusOut(h.wrap, outside);
    await settle();
    expect(h.touched()).toBe(1);

    // A stray second focusout with no intervening focusin must not fire again.
    dispatchFocusOut(h.wrap, outside);
    await settle();
    expect(h.touched()).toBe(1);

    // Re-focusing arms the next focus-loss.
    dispatchFocusIn(h.wrap, null);
    dispatchFocusOut(h.wrap, outside);
    await settle();
    expect(h.touched()).toBe(2);
    outside.remove();
  });

  it('a user selection followed by focus loss touches exactly once', async () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    h = await createHarness({ items: ITEMS, multiple: true });

    dispatchFocusIn(h.wrap, null);
    h.el.open();
    await flush();
    clickOption(h, 0);
    await settle();
    expect(h.changes).toEqual([['a']]);
    expect(h.touched()).toBe(0);

    dispatchFocusOut(h.wrap, outside);
    await settle();
    expect(h.touched()).toBe(1); // touched exactly once, at focus loss
    outside.remove();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// S4-F02 — async programmatic writeValue completion is never a user edit
// ─────────────────────────────────────────────────────────────────────────────
describe('S4-F02 — async programmatic writeValue never echoes as a user edit', () => {
  let h: Harness | undefined;

  afterEach(() => {
    h?.cmp.ngOnDestroy();
    h?.wrap.remove();
    h = undefined;
    vi.restoreAllMocks();
  });

  /**
   * Build a harness with a server-backed `fetchSelectedItems` that resolves on
   * demand (so we can interleave a user gesture while it is in flight).
   */
  async function createAsyncHarness(): Promise<{
    h: Harness;
    resolveFetch: (items: unknown[]) => void;
  }> {
    let resolveFetch: (items: unknown[]) => void = () => {};
    const fetchSelectedItems = (values: unknown[]) =>
      new Promise<unknown[]>((resolve) => {
        resolveFetch = (items) => resolve(items);
        void values;
      });

    const wrap = document.createElement('div');
    const el = document.createElement('enhanced-select') as Harness['el'];
    wrap.appendChild(el);
    document.body.appendChild(wrap);
    const injector = Injector.create({
      providers: [{ provide: ElementRef, useValue: new ElementRef<HTMLElement>(wrap) }],
    });
    const cmp = runInInjectionContext(injector, () => new SmilodonSelectComponent());
    Object.assign(cmp as unknown as Record<string, unknown>, {
      items: ITEMS,
      multiple: true,
      config: { serverSide: { enabled: true, fetchSelectedItems } },
    });
    const changes: unknown[] = [];
    let touchedCount = 0;
    cmp.registerOnChange((v) => changes.push(v));
    cmp.registerOnTouched(() => {
      touchedCount += 1;
    });
    cmp.ngAfterViewInit();
    await cmp.whenReady();
    await flush();
    return { h: { wrap, el, cmp, changes, touched: () => touchedCount }, resolveFetch: (items) => resolveFetch(items) };
  }

  it('a server-backed writeValue that completes after a stale user gesture does NOT fire onChange', async () => {
    const { h: hh, resolveFetch } = await createAsyncHarness();
    h = hh;
    h.changes.length = 0;

    // 1. writeValue starts an async server fetch; the programmatic window closes
    //    synchronously (before the fetch resolves).
    h.cmp.writeValue(['b', 'c']);
    await settle();

    // 2. The user performs a recognized gesture that produces NO selection change
    //    (open the listbox, then click the (empty) container — a bare click that
    //    arms nothing that changes selection). Simulate the raw gesture the adapter
    //    counts: a click on an option-like element that does not mutate selection
    //    is hard to produce; instead we exercise the specific hazard path — a
    //    selection key while open, which the adapter records as a gesture.
    h.el.open();
    await flush();
    const input = h.el.shadowRoot?.querySelector('[role="combobox"]') as HTMLElement | null;
    input?.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    await settle();

    // 3. The programmatic fetch now completes and emits `change`. It must NOT be
    //    reported to the form model (the gesture was stale / unrelated).
    resolveFetch([
      { value: 'b', label: 'Bravo' },
      { value: 'c', label: 'Charlie' },
    ]);
    await settle();

    expect(h.changes).toEqual([]);
  });
});
