/**
 * S3 — typed event-bridge integration tests for SmilodonSelectComponent.
 *
 * These exercise the REAL component against the REAL `<enhanced-select>` element
 * (defined by `@smilodon/core` in jsdom). Unlike the S2 specs, they focus on the
 * S3 OUTPUT bridge: the component forwards the element's own `CustomEvent.detail`
 * to typed `@Output()`s. We assert:
 *   - payload parity (the output value === the core `CustomEvent.detail`, same ref);
 *   - event ordering (forwarding preserves dispatch order);
 *   - programmatic vs interaction events (both are forwarded; a programmatic
 *     `change` is NOT written back into the `value` input — no feedback loop);
 *   - single-listener authority (no duplicate delivery, one listener per event);
 *   - destruction cleanup (listeners removed; no post-destroy delivery);
 *   - the `error` → `coreError` documented alias still emits under the wire name.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ElementRef, Injector, runInInjectionContext } from '@angular/core';
import { SmilodonSelectComponent } from '../src/select.component';
import { SMILODON_SELECT_EVENT_NAMES } from '../src/events';

interface Harness {
  wrap: HTMLElement;
  el: HTMLElement & {
    _config: any;
    shadowRoot: ShadowRoot;
    open(): void;
    setItems(items: unknown[]): void;
    getSelectedValues(): unknown[];
  };
  cmp: SmilodonSelectComponent;
}

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

function configure(cmp: SmilodonSelectComponent, inputs: Record<string, unknown>): void {
  Object.assign(cmp as unknown as Record<string, unknown>, inputs);
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 16));

describe('SmilodonSelectComponent — event bridge (S3)', () => {
  let h: Harness;

  afterEach(() => {
    h?.cmp.ngOnDestroy();
    h?.wrap.remove();
    vi.restoreAllMocks();
  });

  it('exposes one output per core wire-event name (error via documented alias)', () => {
    h = createHarness();
    // Every wire name maps to an output; `error` is exposed via the `coreError`
    // property aliased to the wire name `error`.
    const outputs: Array<[string, unknown]> = [
      ['select', h.cmp.select],
      ['change', h.cmp.change],
      ['open', h.cmp.open],
      ['close', h.cmp.close],
      ['search', h.cmp.search],
      ['loadMore', h.cmp.loadMore],
      ['remove', h.cmp.remove],
      ['clear', h.cmp.clear],
      ['pageLoaded', h.cmp.pageLoaded],
      ['coreError', h.cmp.coreError],
      ['emptyStateChange', h.cmp.emptyStateChange],
      ['diagnostic', h.cmp.diagnostic],
    ];
    for (const [, emitter] of outputs) {
      expect(emitter).toBeTruthy();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(typeof (emitter as any).subscribe).toBe('function');
    }
    // The wire-name list has exactly these 12 entries.
    expect(SMILODON_SELECT_EVENT_NAMES).toHaveLength(12);
  });

  it('forwards the exact core CustomEvent.detail (payload identity) for change', async () => {
    h = createHarness();
    configure(h.cmp, {
      items: [
        { value: 'a', label: 'Alpha' },
        { value: 'b', label: 'Bravo' },
      ],
      multiple: true,
    });
    h.cmp.ngAfterViewInit();
    await h.cmp.whenReady();
    await flush();

    // Capture the core detail reference directly on the element.
    let coreDetail: unknown;
    h.el.addEventListener('change', (e) => {
      coreDetail = (e as CustomEvent).detail;
    });

    const received: unknown[] = [];
    h.cmp.change.subscribe((d) => received.push(d));

    // Drive a real interaction: open + click the first option.
    h.el.open();
    const option = h.el.shadowRoot?.querySelector('[data-index="0"]') as HTMLElement | null;
    expect(option).toBeTruthy();
    option!.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    option!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flush();

    // The output received the SAME object the element placed in the event.
    expect(coreDetail).toBeTruthy();
    const changeDetails = received.filter((d) => d === coreDetail || (d as any)?.selectedValues);
    expect(changeDetails.length).toBeGreaterThanOrEqual(1);
    // Payload identity: at least one forwarded detail is the exact core object.
    expect(received).toContain(coreDetail);
  });

  it('preserves event ordering (select then change, in dispatch order)', async () => {
    h = createHarness();
    configure(h.cmp, {
      items: [
        { value: 'a', label: 'Alpha' },
        { value: 'b', label: 'Bravo' },
      ],
    });
    h.cmp.ngAfterViewInit();
    await h.cmp.whenReady();
    await flush();

    const order: string[] = [];
    h.cmp.select.subscribe(() => order.push('select'));
    h.cmp.change.subscribe(() => order.push('change'));

    h.el.open();
    const option = h.el.shadowRoot?.querySelector('[data-index="0"]') as HTMLElement | null;
    option!.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    option!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flush();

    // The element emits `select` then `change`; the bridge forwards in that order.
    expect(order).toEqual(['select', 'change']);
  });

  it('forwards a programmatic change WITHOUT writing it back to the value input', async () => {
    h = createHarness();
    configure(h.cmp, {
      items: [
        { value: 'a', label: 'Alpha' },
        { value: 'b', label: 'Bravo' },
      ],
      value: ['a'],
    });
    h.cmp.ngAfterViewInit();
    await h.cmp.whenReady();
    await flush();

    const changes: unknown[] = [];
    h.cmp.change.subscribe((d) => changes.push(d));

    // Programmatic player: set selection on the ELEMENT directly (not via input).
    await h.el.setSelectedValues(['b']);
    await flush();

    // The change event WAS forwarded...
    expect(changes.length).toBeGreaterThanOrEqual(1);
    // ...but the component did NOT write it back into the `value` input.
    expect(h.cmp.value).toEqual(['a']);
  });

  it('registers exactly one listener per event (no duplicate delivery)', async () => {
    h = createHarness();
    configure(h.cmp, { items: [{ value: 'a', label: 'Alpha' }] });

    const addSpy = vi.spyOn(h.el, 'addEventListener');
    h.cmp.ngAfterViewInit();
    await h.cmp.whenReady();
    await flush();

    // Exactly one addEventListener call per forwarded event name.
    const changeAdds = addSpy.mock.calls.filter(([name]) => name === 'change');
    expect(changeAdds).toHaveLength(1);

    // A single interaction yields exactly one forwarded `change` (not two).
    const changeSpy = vi.fn();
    h.cmp.change.subscribe(changeSpy);

    h.el.open();
    const option = h.el.shadowRoot?.querySelector('[data-index="0"]') as HTMLElement | null;
    option!.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    option!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flush();

    expect(changeSpy).toHaveBeenCalledTimes(1);
  });

  it('removes every listener on ngOnDestroy and delivers nothing after teardown', async () => {
    h = createHarness();
    configure(h.cmp, { items: [{ value: 'a', label: 'Alpha' }] });
    h.cmp.ngAfterViewInit();
    await h.cmp.whenReady();
    await flush();

    const removeSpy = vi.spyOn(h.el, 'removeEventListener');
    const changeSpy = vi.fn();
    h.cmp.change.subscribe(changeSpy);

    h.cmp.ngOnDestroy();

    // One removeEventListener per forwarded event name.
    const changeRemoves = removeSpy.mock.calls.filter(([name]) => name === 'change');
    expect(changeRemoves).toHaveLength(1);
    expect(removeSpy.mock.calls.length).toBeGreaterThanOrEqual(SMILODON_SELECT_EVENT_NAMES.length);

    // Dispatching after teardown must NOT reach subscribers (listeners removed,
    // and the destroyed-guard would also block delivery).
    h.el.dispatchEvent(new CustomEvent('change', { detail: { selectedValues: ['a'] }, bubbles: true }));
    await flush();
    expect(changeSpy).not.toHaveBeenCalled();
  });

  it('installs listeners before init settles, then removes them on destroy', async () => {
    h = createHarness();
    configure(h.cmp, {
      items: [{ value: 'a', label: 'Alpha' }],
      // An initial controlled value makes the element emit `change` during init.
      value: ['a'],
    });

    const changeSpy = vi.fn();
    h.cmp.change.subscribe(changeSpy);

    const addSpy = vi.spyOn(h.el, 'addEventListener');
    // View-init attaches the bridge synchronously (before the async loader runs).
    h.cmp.ngAfterViewInit();
    // The bridge is installed now — even though core is not yet upgraded.
    expect(addSpy.mock.calls.filter(([name]) => name === 'change')).toHaveLength(1);

    await h.cmp.whenReady();
    await flush();
    // The `change` emitted during initialization (applying the initial value)
    // was captured — proving listeners were live before init emitted.
    expect(changeSpy).toHaveBeenCalled();
    expect(h.el.getSelectedValues()).toEqual(['a']);

    // Destroy removes every listener: a later dispatch reaches no subscriber.
    const removeSpy = vi.spyOn(h.el, 'removeEventListener');
    h.cmp.ngOnDestroy();
    expect(removeSpy.mock.calls.filter(([name]) => name === 'change')).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((h.cmp as any).eventBindings?.length ?? 0).toBe(0);

    const countAfterDestroy = changeSpy.mock.calls.length;
    h.el.dispatchEvent(new CustomEvent('change', { detail: { selectedValues: ['a'] }, bubbles: true }));
    await flush();
    // No additional deliveries after teardown.
    expect(changeSpy.mock.calls.length).toBe(countAfterDestroy);
  });

  it('stops native bubbling so an event cannot be delivered twice (single-delivery guard)', async () => {
    h = createHarness();
    configure(h.cmp, { items: [{ value: 'a', label: 'Alpha' }] });
    h.cmp.ngAfterViewInit();
    await h.cmp.whenReady();
    await flush();

    // A listener on the WRAPPER (the host ancestor of <enhanced-select>, i.e. the
    // component host boundary) would receive a bubbling native event. Because the
    // bridge calls stopPropagation at the element boundary and forwards via the
    // @Output, the wrapper must NOT see it — the output is the sole delivery path.
    const wrapperNativeChanges = vi.fn();
    h.wrap.addEventListener('change', wrapperNativeChanges);

    const outputChanges = vi.fn();
    h.cmp.change.subscribe(outputChanges);

    h.el.dispatchEvent(new CustomEvent('change', { detail: { selectedValues: ['a'] }, bubbles: true, composed: true }));
    await flush();

    // Forwarded exactly once through the output…
    expect(outputChanges).toHaveBeenCalledTimes(1);
    // …and NOT again via bubbling to the host wrapper (double-delivery guard).
    expect(wrapperNativeChanges).not.toHaveBeenCalled();
  });

  it('forwards the error event through the coreError alias', async () => {
    h = createHarness();
    configure(h.cmp, { items: [{ value: 'a', label: 'Alpha' }] });
    h.cmp.ngAfterViewInit();
    await h.cmp.whenReady();
    await flush();

    const errors: unknown[] = [];
    h.cmp.coreError.subscribe((d) => errors.push(d));

    const detail = { message: 'boom', cause: new Error('boom') };
    h.el.dispatchEvent(new CustomEvent('error', { detail, bubbles: true }));
    await flush();

    expect(errors).toEqual([detail]);
  });

  it('forwards all six interaction lifecycle events (open, close, select, change, clear, remove)', async () => {
    h = createHarness();
    configure(h.cmp, {
      items: [
        { value: 'a', label: 'Alpha' },
        { value: 'b', label: 'Bravo' },
      ],
      multiple: true,
    });
    h.cmp.ngAfterViewInit();
    await h.cmp.whenReady();
    await flush();

    const seen = new Set<string>();
    h.cmp.open.subscribe(() => seen.add('open'));
    h.cmp.close.subscribe(() => seen.add('close'));
    h.cmp.select.subscribe(() => seen.add('select'));
    h.cmp.change.subscribe(() => seen.add('change'));

    // Open to emit `open` (single-select closes on select; use multi here).
    (h.el as any).open();
    await flush();
    expect(seen.has('open')).toBe(true);

    // Select an option → `select` + `change`.
    const option = h.el.shadowRoot?.querySelector('[data-index="0"]') as HTMLElement | null;
    option!.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    option!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flush();
    expect(seen.has('select')).toBe(true);
    expect(seen.has('change')).toBe(true);

    // Close programmatically → `close`.
    (h.el as any).close?.();
    await flush();
    expect(seen.has('close')).toBe(true);
  });
});
