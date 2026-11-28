/**
 * W1-P1.3 Task 1 — Keyboard Navigation and Focus/ARIA Chronology.
 *
 * Public-interface-only characterization of keyboard-driven open/close,
 * active-option movement, activation, dismissal, the focus model, and the
 * combobox ARIA chronology. Governed by the ledger §15 addendum (KBD-001..012)
 * plus the keyboard path of the thirteen existing P1.3-owned contracts
 * (API-030/031/040/041, EVENT-002/003, ATTR-001/002/003/010/011/020,
 * LIFECYCLE-006).
 *
 * Driving surface (NO private methods invoked directly):
 *   - Keyboard: `KeyboardEvent('keydown', { key, ... })` dispatched on the
 *     public `[part="input"]` element (the combobox).
 *   - Programmatic comparison: public `open()` / `close()` and host
 *     `setAttribute('aria-label'|'aria-description'|'aria-busy', ...)`.
 *
 * Observation surface (NO private state):
 *   - roles `combobox` / `listbox` / `option`;
 *   - `aria-expanded` and `aria-activedescendant` on the combobox;
 *   - the active option resolved by `shadowRoot.getElementById(aria-activedescendant)`;
 *   - `data-open` on the host, `data-placement` on the dropdown, `dir` on the host;
 *   - emitted `open` / `close` `CustomEvent.detail` and `onOpen` / `onClose`;
 *   - `shadowRoot.activeElement` for the focus model.
 *
 * No arbitrary sleeps, no engine dispatch, no CSS-animation dependence. Panel
 * visibility (`display`) is asserted only as a secondary signal; the primary
 * open/close signal is `data-open` + `aria-expanded`.
 *
 * Findings recorded, not repaired (see §15.4):
 *   - P1.3-D01: public `close` detail is `{}`; Escape vs Tab are indistinguishable
 *     from the event alone.
 *   - P1.3-D02: `aria-busy` host resync has no confirmed observable effect on
 *     the listbox element at baseline.
 *   - P1.3-D03: opening with no selection assigns NO initial active descendant;
 *     the first ArrowDown materializes the first selectable option.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select';
import { SelectOption } from '../src/components/select-option';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}
if (!customElements.get('select-option')) {
  customElements.define('select-option', SelectOption);
}

type Item = { id: string; value: string; label: string; disabled?: boolean };

const FOUR: Item[] = [
  { id: 'a', value: 'a', label: 'A' },
  { id: 'b', value: 'b', label: 'B', disabled: true },
  { id: 'c', value: 'c', label: 'C' },
  { id: 'd', value: 'd', label: 'D' },
];

function mount(items: Item[] = FOUR): EnhancedSelect {
  const el = document.createElement('enhanced-select') as EnhancedSelect;
  el.setItems(items);
  document.body.appendChild(el);
  return el;
}

// ---------------------------------------------------------------------------
// Public-surface drivers and readers
// ---------------------------------------------------------------------------

function input(el: EnhancedSelect): HTMLInputElement {
  return el.shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')!;
}

function combobox(el: EnhancedSelect): HTMLElement {
  const cb = el.shadowRoot!.querySelector<HTMLElement>('[role="combobox"]');
  expect(cb, 'combobox element present').toBeTruthy();
  return cb!;
}

function listbox(el: EnhancedSelect): HTMLElement | null {
  return el.shadowRoot!.querySelector<HTMLElement>('[role="listbox"]');
}

/**
 * Dispatch a keydown on the combobox input. `opts` allows modifiers and a
 * custom target (used for the searchable-Space-on-input case).
 */
function key(
  el: EnhancedSelect,
  k: string,
  opts: { target?: HTMLElement; ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean; altKey?: boolean } = {},
): void {
  const tgt = opts.target ?? input(el);
  tgt.dispatchEvent(new KeyboardEvent('keydown', {
    key: k,
    bubbles: true,
    cancelable: true,
    ctrlKey: opts.ctrlKey,
    metaKey: opts.metaKey,
    shiftKey: opts.shiftKey,
    altKey: opts.altKey,
  }));
}

function ariaActiveDescendant(el: EnhancedSelect): string | null {
  return combobox(el).getAttribute('aria-activedescendant');
}

/** Value of the currently active option, resolved from aria-activedescendant. */
function activeValue(el: EnhancedSelect): string | null {
  const ad = ariaActiveDescendant(el);
  if (!ad) return null;
  const opt = el.shadowRoot!.getElementById(ad);
  return opt ? opt.getAttribute('data-value') : null;
}

function ariaExpanded(el: EnhancedSelect): string | null {
  return combobox(el).getAttribute('aria-expanded');
}

function isOpen(el: EnhancedSelect): boolean {
  return el.hasAttribute('data-open');
}

interface Timeline {
  order: () => string[];
  reset: () => void;
  stop: () => void;
}

/** Record ordered open/close events interleaved with onOpen/onClose callbacks. */
function recordOpenClose(el: EnhancedSelect, timeline: string[] = []): Timeline {
  const handlers: Array<[string, EventListener]> = [];
  const add = (name: 'open' | 'close') => {
    const h = (e: Event) => timeline.push(`${name}:${JSON.stringify((e as CustomEvent).detail)}`);
    el.addEventListener(name, h);
    handlers.push([name, h]);
  };
  add('open');
  add('close');
  el.updateConfig({
    callbacks: {
      onOpen: () => timeline.push('onOpen'),
      onClose: () => timeline.push('onClose'),
    },
  });
  return {
    order: () => timeline.slice(),
    reset: () => { timeline.length = 0; },
    stop: () => handlers.forEach(([n, h]) => el.removeEventListener(n, h)),
  };
}

// ===========================================================================
// KBD-001 — Keyboard-open triggers
// ===========================================================================
describe('W1-P1.3 Task 1 (KBD-001) — keyboard-open triggers', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  it('ArrowDown on a closed popup opens it (data-open + aria-expanded=true) with no initial active descendant', () => {
    el = mount();
    expect(isOpen(el)).toBe(false);
    key(el, 'ArrowDown');
    expect(isOpen(el)).toBe(true);
    expect(ariaExpanded(el)).toBe('true');
    // KBD-001 / P1.3-D03: no selection => opening assigns no active descendant.
    expect(ariaActiveDescendant(el)).toBeNull();
  });

  it('ArrowUp on a closed popup opens it', () => {
    el = mount();
    key(el, 'ArrowUp');
    expect(isOpen(el)).toBe(true);
    expect(ariaExpanded(el)).toBe('true');
  });

  it('Enter on a closed popup opens it without selecting or activating', () => {
    el = mount();
    key(el, 'Enter');
    expect(isOpen(el)).toBe(true);
    expect(el.getSelectedValues()).toEqual([]);
    expect(ariaActiveDescendant(el)).toBeNull();
  });

  it('open emits `open` (detail {}) then onOpen, in that order', () => {
    el = mount();
    const tl = recordOpenClose(el);
    key(el, 'ArrowDown');
    expect(tl.order()).toEqual(['open:{}', 'onOpen']);
    tl.stop();
  });

  it('keyboard open when already open does not re-open (no duplicate open event)', () => {
    el = mount();
    key(el, 'ArrowDown'); // open
    const tl = recordOpenClose(el);
    key(el, 'Enter'); // already open -> treated as activation, not a fresh open
    expect(tl.order()).not.toContain('open:{}');
    tl.stop();
  });
});

// ===========================================================================
// KBD-002 / KBD-009 — Arrow movement + disabled skipping + clamping
// ===========================================================================
describe('W1-P1.3 Task 1 (KBD-002/KBD-009) — active-option movement', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  it('ArrowDown moves to the first selectable option, skipping the disabled `b`', () => {
    el = mount();
    el.open();
    key(el, 'ArrowDown');
    expect(activeValue(el)).toBe('a');
    key(el, 'ArrowDown');
    expect(activeValue(el)).toBe('c'); // skipped disabled b
  });

  it('ArrowDown skips disabled options and clamps at the last selectable option (no wrap)', () => {
    el = mount();
    el.open();
    key(el, 'ArrowDown'); // a
    key(el, 'ArrowDown'); // c
    key(el, 'ArrowDown'); // d
    expect(activeValue(el)).toBe('d');
    key(el, 'ArrowDown'); // clamp
    expect(activeValue(el)).toBe('d');
    key(el, 'ArrowDown'); // still clamp
    expect(activeValue(el)).toBe('d');
  });

  it('ArrowUp skips disabled options and clamps at the first selectable option (no wrap)', () => {
    el = mount();
    el.open();
    key(el, 'ArrowDown'); // a
    key(el, 'ArrowDown'); // c
    key(el, 'ArrowUp');   // back to a (skips disabled b)
    expect(activeValue(el)).toBe('a');
    key(el, 'ArrowUp');   // clamp
    expect(activeValue(el)).toBe('a');
  });

  it('a disabled option can never become active via keyboard', () => {
    el = mount();
    el.open();
    const seen = new Set<string | null>();
    for (let i = 0; i < 6; i++) { key(el, 'ArrowDown'); seen.add(activeValue(el)); }
    for (let i = 0; i < 6; i++) { key(el, 'ArrowUp'); seen.add(activeValue(el)); }
    expect(seen.has('b')).toBe(false);
  });
});

// ===========================================================================
// KBD-003 — Home / End
// ===========================================================================
describe('W1-P1.3 Task 1 (KBD-003) — Home / End', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  it('End moves the active option to the last selectable option', () => {
    el = mount();
    el.open();
    key(el, 'ArrowDown'); // a
    key(el, 'ArrowDown'); // c
    key(el, 'End');
    expect(activeValue(el)).toBe('d');
  });

  it('Home moves the active option to the first selectable option', () => {
    el = mount();
    el.open();
    key(el, 'End');    // d
    key(el, 'Home');
    expect(activeValue(el)).toBe('a');
  });
});

// ===========================================================================
// KBD-004 — PageDown / PageUp
// ===========================================================================
describe('W1-P1.3 Task 1 (KBD-004) — PageDown / PageUp', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  function wide(): Item[] {
    return Array.from({ length: 25 }, (_, i) => ({ id: `i${i}`, value: `v${i}`, label: `L${i}` }));
  }

  it('PageDown advances by 10 selectable options (from the first, lands on the 11th)', () => {
    el = mount(wide());
    el.open();
    key(el, 'ArrowDown'); // v0
    expect(activeValue(el)).toBe('v0');
    key(el, 'PageDown');
    expect(activeValue(el)).toBe('v10');
  });

  it('PageUp retreats by 10 selectable options', () => {
    el = mount(wide());
    el.open();
    key(el, 'ArrowDown'); // v0
    key(el, 'End');       // v24
    key(el, 'PageUp');
    expect(activeValue(el)).toBe('v14');
  });

  it('PageDown clamps at the last selectable option when fewer than 10 remain', () => {
    el = mount(wide());
    el.open();
    key(el, 'End'); // v24
    key(el, 'PageDown');
    expect(activeValue(el)).toBe('v24');
  });
});

// ===========================================================================
// KBD-005 — Enter/Space activation (and searchable-Space skip)
// ===========================================================================
describe('W1-P1.3 Task 1 (KBD-005) — Enter / Space activation', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  it('Enter on an open popup selects the active option and closes', () => {
    el = mount();
    el.open();
    key(el, 'ArrowDown'); // active a
    key(el, 'Enter');
    expect(el.getSelectedValues()).toEqual(['a']);
    expect(isOpen(el)).toBe(false);
    expect(ariaExpanded(el)).toBe('false');
  });

  it('Space on an open popup selects the active option (non-searchable)', () => {
    el = mount();
    el.open();
    key(el, 'ArrowDown'); // active a
    key(el, ' ');
    expect(el.getSelectedValues()).toEqual(['a']);
  });

  it('Space in a searchable popup, targeted at the input, does NOT select or open-toggle', () => {
    el = mount();
    el.updateConfig({ searchable: true });
    el.open();
    key(el, 'ArrowDown'); // active a
    key(el, ' ', { target: input(el) }); // Space typed into the search input
    expect(el.getSelectedValues()).toEqual([]);
    expect(isOpen(el)).toBe(true); // still open; Space did not activate
  });
});

// ===========================================================================
// KBD-006 / KBD-007 — Escape and Tab dismissal
// ===========================================================================
describe('W1-P1.3 Task 1 (KBD-006/KBD-007) — Escape / Tab dismissal', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  it('Escape closes an open popup (data-open removed, aria-expanded=false)', () => {
    el = mount();
    el.open();
    key(el, 'Escape');
    expect(isOpen(el)).toBe(false);
    expect(ariaExpanded(el)).toBe('false');
  });

  it('Escape close emits `close` (detail {}) then onClose; the public detail carries no reason (P1.3-D01)', () => {
    el = mount();
    el.open();
    const tl = recordOpenClose(el);
    key(el, 'Escape');
    expect(tl.order()).toEqual(['close:{}', 'onClose']);
    tl.stop();
  });

  it('Tab closes an open popup', () => {
    el = mount();
    el.open();
    key(el, 'Tab');
    expect(isOpen(el)).toBe(false);
  });

  it('Escape emits an indistinguishable close detail from Tab (both {} — P1.3-D01)', () => {
    el = mount();
    const tl = recordOpenClose(el);
    el.open();
    tl.reset(); // observe only the close, not the preceding open
    key(el, 'Escape');
    const escClose = tl.order();
    tl.reset();
    el.open();
    tl.reset(); // observe only the close, not the preceding open
    key(el, 'Tab');
    const tabClose = tl.order();
    expect(escClose).toEqual(['close:{}', 'onClose']);
    expect(tabClose).toEqual(['close:{}', 'onClose']);
    // The close detail itself carries no reason, so Escape and Tab are indistinguishable.
    expect(escClose).toEqual(tabClose);
    tl.stop();
  });

  it('Escape / Tab while closed is a no-op (no close event)', () => {
    el = mount();
    const tl = recordOpenClose(el);
    key(el, 'Escape');
    key(el, 'Tab');
    expect(tl.order()).toEqual([]);
    tl.stop();
  });
});

// ===========================================================================
// KBD-008 — Ctrl/Cmd+A select-all guard
// ===========================================================================
describe('W1-P1.3 Task 1 (KBD-008) — Ctrl/Cmd+A select-all', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  it('Ctrl+A in multi (non-searchable) selects all selectable options', () => {
    el = mount();
    el.updateConfig({ selection: { mode: 'multi' } });
    el.open();
    key(el, 'a', { ctrlKey: true });
    // disabled `b` is not selectable; a, c, d are selected.
    expect(new Set(el.getSelectedValues())).toEqual(new Set(['a', 'c', 'd']));
  });

  it('Ctrl+A in single mode does not select all', () => {
    el = mount();
    el.open();
    key(el, 'a', { ctrlKey: true });
    expect(el.getSelectedValues()).toEqual([]);
  });

  it('Ctrl+A in searchable mode does not select all', () => {
    el = mount();
    el.updateConfig({ selection: { mode: 'multi' }, searchable: true });
    el.open();
    key(el, 'a', { ctrlKey: true });
    expect(el.getSelectedValues()).toEqual([]);
  });

  it('Ctrl+A also works with Meta (cmd) modifier', () => {
    el = mount();
    el.updateConfig({ selection: { mode: 'multi' } });
    el.open();
    key(el, 'a', { metaKey: true });
    expect(new Set(el.getSelectedValues())).toEqual(new Set(['a', 'c', 'd']));
  });
});

// ===========================================================================
// KBD-010 — Type-ahead delegation
// ===========================================================================
describe('W1-P1.3 Task 1 (KBD-010) — type-ahead delegation', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  it('a printable single character with no modifiers moves the active option (type-ahead)', () => {
    el = mount();
    el.open();
    // Type 'c' -> the active option should jump to the option matching 'c'.
    key(el, 'c');
    expect(activeValue(el)).toBe('c');
  });

  it('a modifier-bearing single character is NOT treated as type-ahead', () => {
    el = mount();
    el.open();
    key(el, 'ArrowDown'); // active a
    expect(activeValue(el)).toBe('a');
    key(el, 'c', { ctrlKey: true }); // Ctrl+C must not jump to 'c'
    expect(activeValue(el)).toBe('a');
  });
});

// ===========================================================================
// KBD-011 — Focus model
// ===========================================================================
describe('W1-P1.3 Task 1 (KBD-011) — focus model', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  it('DOM focus stays on the combobox input across open + movement', () => {
    el = mount();
    input(el).focus();
    el.open();
    key(el, 'ArrowDown');
    key(el, 'ArrowDown');
    expect(el.shadowRoot!.activeElement).toBe(input(el));
  });

  it('the active option is expressed via aria-activedescendant (input, not option, holds focus)', () => {
    el = mount();
    input(el).focus();
    el.open();
    key(el, 'ArrowDown');
    const ad = ariaActiveDescendant(el);
    expect(ad).toBeTruthy();
    const activeEl = el.shadowRoot!.getElementById(ad!);
    // The referenced element is an option, and it is NOT the focused element.
    expect(activeEl?.getAttribute('role')).toBe('option');
    expect(activeEl?.getAttribute('part')).toBe('option');
    expect(el.shadowRoot!.activeElement).not.toBe(activeEl);
    expect(el.shadowRoot!.activeElement).toBe(input(el));
  });
});

// ===========================================================================
// KBD-012 — Combobox ARIA chronology across open -> move -> close
// ===========================================================================
describe('W1-P1.3 Task 1 (KBD-012) — ARIA chronology', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  it('aria-expanded is false when closed and true when open', () => {
    el = mount();
    expect(ariaExpanded(el)).toBe('false');
    el.open();
    expect(ariaExpanded(el)).toBe('true');
    el.close();
    expect(ariaExpanded(el)).toBe('false');
  });

  it('aria-activedescendant is null on open, set on move, and cleared on close', () => {
    el = mount();
    el.open();
    expect(ariaActiveDescendant(el)).toBeNull();      // open (no selection)
    key(el, 'ArrowDown');
    expect(ariaActiveDescendant(el)).toBeTruthy();     // move sets it
    key(el, 'Escape');
    expect(ariaActiveDescendant(el)).toBeNull();       // close clears it
  });

  it('aria-activedescendant tracks the moving active option', () => {
    el = mount();
    el.open();
    key(el, 'ArrowDown');
    const ad1 = ariaActiveDescendant(el);
    key(el, 'ArrowDown');
    const ad2 = ariaActiveDescendant(el);
    expect(ad1).toBeTruthy();
    expect(ad2).toBeTruthy();
    expect(ad2).not.toBe(ad1); // moved to a different option element
  });
});

// ===========================================================================
// Existing P1.3-owned contracts via the keyboard path
// ===========================================================================
describe('W1-P1.3 Task 1 — existing P1.3 contracts via keyboard', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  // API-030 / API-031 — programmatic open/close parity + idempotency
  it('API-030: open() is idempotent — double open emits `open` once', () => {
    el = mount();
    const tl = recordOpenClose(el);
    el.open();
    el.open();
    expect(tl.order()).toEqual(['open:{}', 'onOpen']);
    tl.stop();
  });

  it('API-031: close() is idempotent — double close emits `close` once', () => {
    el = mount();
    el.open();
    const tl = recordOpenClose(el);
    el.close();
    el.close();
    expect(tl.order()).toEqual(['close:{}', 'onClose']);
    tl.stop();
  });

  // EVENT-002 / EVENT-003 — detail shape
  it('EVENT-002: open event detail is exactly {}', () => {
    el = mount();
    let detail: unknown = undefined;
    el.addEventListener('open', (e) => { detail = (e as CustomEvent).detail; }, { once: true });
    el.open();
    expect(detail).toEqual({});
  });

  it('EVENT-003: close event detail is exactly {} (no reason; P1.3-D01)', () => {
    el = mount();
    el.open();
    let detail: unknown = undefined;
    el.addEventListener('close', (e) => { detail = (e as CustomEvent).detail; }, { once: true });
    key(el, 'Escape');
    expect(detail).toEqual({});
  });

  // ATTR-010 — dir reflection
  it('ATTR-010: dir defaults to ltr on the host after connect', () => {
    el = mount();
    expect(el.getAttribute('dir')).toBe('ltr');
  });

  it('ATTR-010: dir reflects config.direction (rtl) after connect', () => {
    const elRtl = document.createElement('enhanced-select') as EnhancedSelect;
    elRtl.updateConfig({ direction: 'rtl' });
    elRtl.setItems(FOUR);
    document.body.appendChild(elRtl);
    expect(elRtl.getAttribute('dir')).toBe('rtl');
    elRtl.remove();
  });

  // ATTR-011 — data-open reflection
  it('ATTR-011: data-open is "true" while open and absent when closed', () => {
    el = mount();
    expect(el.hasAttribute('data-open')).toBe(false);
    el.open();
    expect(el.getAttribute('data-open')).toBe('true');
    el.close();
    expect(el.hasAttribute('data-open')).toBe(false);
  });

  // ATTR-020 — data-placement on the dropdown/listbox
  it('ATTR-020: dropdown/listbox carries data-placement (bottom by default)', () => {
    el = mount();
    el.open();
    const lb = listbox(el);
    expect(lb, 'listbox present when open').toBeTruthy();
    expect(lb!.getAttribute('data-placement')).toBe('bottom');
  });

  // ATTR-001 / ATTR-002 — aria-label / aria-description resync
  it('ATTR-001: aria-label set on the host is reflected to the combobox', () => {
    el = mount();
    el.setAttribute('aria-label', 'Colors');
    expect(combobox(el).getAttribute('aria-label')).toBe('Colors');
  });

  it('ATTR-002: aria-description set on the host is reflected to the combobox', () => {
    el = mount();
    el.setAttribute('aria-description', 'Pick one');
    expect(combobox(el).getAttribute('aria-description')).toBe('Pick one');
  });

  // ATTR-003 — aria-busy host resync (observable effect recorded as P1.3-D02)
  it('ATTR-003: setting aria-busy on the host does not disrupt the combobox (baseline: no observable listbox aria-busy; P1.3-D02)', () => {
    el = mount();
    el.open();
    const lb = listbox(el);
    expect(lb, 'listbox present when open').toBeTruthy();
    el.setAttribute('aria-busy', 'true');
    // Baseline observation (P1.3-D02): the wiring routes to listbox a11y sync, but
    // no aria-busy is observed on the listbox element in jsdom. Assert the
    // observed (non-)effect so a future change is caught.
    expect(lb!.getAttribute('aria-busy')).toBeNull();
    el.setAttribute('aria-busy', 'false');
    expect(lb!.getAttribute('aria-busy')).toBeNull();
  });

  // LIFECYCLE-006 — attributeChanged equal-value observable stability.
  // T1-R / T1-F02: this is an *observable equal-value stability* check only. It
  // does NOT prove the internal attributeChangedCallback early-return branch was
  // taken (that would require private-state instrumentation, not authorized).
  it('LIFECYCLE-006: re-setting an equal aria-label value leaves the reflected value stable', () => {
    el = mount();
    el.setAttribute('aria-label', 'Same');
    expect(combobox(el).getAttribute('aria-label')).toBe('Same');
    // Setting the identical value again must not throw and must keep the value
    // (observable stability; not proof of an internal early-return).
    el.setAttribute('aria-label', 'Same');
    expect(combobox(el).getAttribute('aria-label')).toBe('Same');
  });
});
