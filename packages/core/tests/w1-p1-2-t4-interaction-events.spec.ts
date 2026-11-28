/**
 * W1-P1.2 Task 4 — User Interaction vs. Programmatic Event Ordering.
 *
 * Public-interface-only characterization of the externally observable event and
 * callback contract for user-driven selection and removal, compared against the
 * accepted programmatic behavior from Tasks 1-3.
 *
 * Driving surface (NO private methods invoked directly):
 *   - Pointer selection: dispatched DOM `MouseEvent('click')` on rendered
 *     `[part="option"]` elements inside the open listbox.
 *   - Keyboard selection: dispatched `KeyboardEvent('keydown')` on the public
 *     `[part="input"]` element (Enter/ArrowDown only; interaction-triggered
 *     select events, not full APG navigation — that is P1.3).
 *   - Clear control: `.click()` on the rendered `[part="clear-button"]`.
 *   - Chip removal: `.click()` on the rendered `[part="chip-remove"]`.
 *   - Programmatic comparison: public `setSelectedValues()` / `clear()`.
 *
 * Observation surface (NO private state):
 *   - emitted `CustomEvent.detail` for `select`/`change`/`clear`/`remove`;
 *   - registered `onSelect`/`onChange`/`onClear` callbacks;
 *   - public getters `getSelectedValues()` / `getSelectedItems()` and rendered
 *     `aria-selected` attributes.
 *
 * Event chronology is captured in a single ordered timeline per test.
 * No arbitrary sleeps, no engine dispatch, no CSS-animation dependence (chip
 * exit motion is not awaited; selection state and events are synchronous).
 *
 * Findings of note (recorded, not repaired):
 *   - Clear-control activation while `required` PRESERVES the selection yet
 *     emits `clear.detail.clearedSelection === true` (and the paired `change`
 *     still reports the preserved value). Recorded as DEVIATION-10.
 *   - Re-selecting the already-selected option in single mode with
 *     `allowDeselect: false` performs NO state change but STILL emits
 *     `select`+`change` (callbacks fire with `selected: true`). See T4-08.
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

const THREE: Item[] = [
  { id: 'a', value: 'a', label: 'A' },
  { id: 'b', value: 'b', label: 'B' },
  { id: 'c', value: 'c', label: 'C' },
];

function mount(items: Item[] = THREE): EnhancedSelect {
  const el = document.createElement('enhanced-select') as EnhancedSelect;
  el.setItems(items);
  document.body.appendChild(el);
  return el;
}

// ---------------------------------------------------------------------------
// Interaction drivers (public surface only)
// ---------------------------------------------------------------------------

function renderedOptions(el: EnhancedSelect): HTMLElement[] {
  return Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('[part="option"]'));
}

/** Rendered-position -> source index (options render in registry order for a plain list). */
function renderedOptionByValue(el: EnhancedSelect, value: string): HTMLElement {
  const found = renderedOptions(el).find((o) => o.getAttribute('data-value') === value);
  expect(found, `option with value ${value} rendered`).toBeTruthy();
  return found!;
}

function clickOption(el: EnhancedSelect, value: string): void {
  renderedOptionByValue(el, value).dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

function dispatchKey(el: EnhancedSelect, key: string): void {
  const input = el.shadowRoot!.querySelector<HTMLInputElement>('[part="input"]')!;
  input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

function clearButton(el: EnhancedSelect): HTMLButtonElement {
  return el.shadowRoot!.querySelector<HTMLButtonElement>('[part="clear-button"]')!;
}

function chipRemoveButtons(el: EnhancedSelect): HTMLButtonElement[] {
  return Array.from(el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="chip-remove"]'));
}

function clickChipRemove(el: EnhancedSelect, chipPosition: number): void {
  const buttons = chipRemoveButtons(el);
  expect(buttons.length, 'chip remove buttons present').toBeGreaterThan(chipPosition);
  buttons[chipPosition].click();
}

// ---------------------------------------------------------------------------
// Ordered timeline + callback recorder
// ---------------------------------------------------------------------------

type TimelineEntry =
  | { kind: 'event'; name: 'select' | 'change' | 'clear' | 'remove'; detail: any }
  | { kind: 'callback'; name: 'onSelect' | 'onChange' | 'onClear'; args: any[] };

interface Recorder {
  timeline: TimelineEntry[];
  /** Ordered names of events AND callbacks interleaved, e.g. ['select','change','onChange','onSelect']. */
  order: () => string[];
  /** Ordered emitted-event names only. */
  events: () => string[];
  /** First timeline entry matching an event name. */
  event: (name: string) => TimelineEntry | undefined;
  lastEvent: (name: string) => TimelineEntry | undefined;
  reset: () => void;
  stop: () => void;
}

const EVENT_NAMES = ['select', 'change', 'clear', 'remove'] as const;

function record(el: EnhancedSelect): Recorder {
  const timeline: TimelineEntry[] = [];
  const eventHandlers: Array<[string, (e: Event) => void]> = [];
  for (const name of EVENT_NAMES) {
    const h = (e: Event) => timeline.push({ kind: 'event', name, detail: (e as CustomEvent).detail });
    el.addEventListener(name, h);
    eventHandlers.push([name, h]);
  }

  // Register callbacks that push into the SAME timeline via `updateConfig`.
  el.updateConfig({
    callbacks: {
      onSelect: (detail: any) => timeline.push({ kind: 'callback', name: 'onSelect', args: [detail] }),
      onChange: (items: any[], values: any[]) => timeline.push({ kind: 'callback', name: 'onChange', args: [items, values] }),
      onClear: (detail: any) => timeline.push({ kind: 'callback', name: 'onClear', args: [detail] }),
    },
  });

  const nameOf = (entry: TimelineEntry) => (entry.kind === 'event' ? entry.name : entry.name);

  return {
    timeline,
    order: () => timeline.map(nameOf),
    events: () => timeline.filter((t): t is Extract<TimelineEntry, { kind: 'event' }> => t.kind === 'event').map((t) => t.name),
    event: (name) => timeline.find((t) => t.kind === 'event' && t.name === name),
    lastEvent: (name) => [...timeline].reverse().find((t) => t.kind === 'event' && t.name === name),
    reset: () => { timeline.length = 0; },
    stop: () => eventHandlers.forEach(([n, h]) => el.removeEventListener(n, h)),
  };
}

function cbEntry(rec: Recorder, name: 'onSelect' | 'onChange' | 'onClear'): Extract<TimelineEntry, { kind: 'callback' }> {
  const entry = rec.timeline.find((t) => t.kind === 'callback' && t.name === name);
  expect(entry, `callback ${name} recorded`).toBeTruthy();
  return entry as Extract<TimelineEntry, { kind: 'callback' }>;
}

function evEntry(rec: Recorder, name: 'select' | 'change' | 'clear' | 'remove'): Extract<TimelineEntry, { kind: 'event' }> {
  const entry = rec.lastEvent(name);
  expect(entry, `event ${name} recorded`).toBeTruthy();
  return entry as Extract<TimelineEntry, { kind: 'event' }>;
}

function vals(el: EnhancedSelect): unknown[] {
  return el.getSelectedValues();
}

// ===========================================================================
// T4-01 — Pointer-driven selection/event matrix
// ===========================================================================
describe('W1-P1.2 Task 4 (T4-01) — pointer selection/event matrix', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  it('single-mode pointer select emits select -> change -> onChange -> onSelect', () => {
    el = mount();
    el.open();
    const rec = record(el);
    clickOption(el, 'b');
    expect(rec.order()).toEqual(['select', 'change', 'onChange', 'onSelect']);
    expect(vals(el)).toEqual(['b']);
    rec.stop();
  });

  it('single-mode pointer selection of a different option replaces the prior selection', () => {
    el = mount();
    el.open();
    const rec = record(el);
    clickOption(el, 'a');
    clickOption(el, 'c');
    // Two full sequences, one per activation.
    expect(rec.order()).toEqual([
      'select', 'change', 'onChange', 'onSelect',
      'select', 'change', 'onChange', 'onSelect',
    ]);
    expect(vals(el)).toEqual(['c']);
    rec.stop();
  });

  it('multi-mode pointer select then separate select (accumulation) emits a pair per activation', () => {
    el = mount();
    el.updateConfig({ selection: { mode: 'multi' } });
    el.open();
    const rec = record(el);
    clickOption(el, 'a');
    clickOption(el, 'c');
    expect(rec.events()).toEqual(['select', 'change', 'select', 'change']);
    expect(vals(el)).toEqual(['a', 'c']);
    rec.stop();
  });
});

// ===========================================================================
// T4-02 — Keyboard-driven selection/event matrix
// ===========================================================================
describe('W1-P1.2 Task 4 (T4-02) — keyboard selection/event matrix', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  it('Enter opens the listbox then Enter selects the active option (select -> change -> onChange -> onSelect)', () => {
    el = mount();
    const rec = record(el);
    dispatchKey(el, 'Enter');        // open; no selection yet
    expect(rec.events()).toEqual([]);
    dispatchKey(el, 'ArrowDown');    // establish active = first option
    dispatchKey(el, 'Enter');        // select active
    expect(rec.order()).toEqual(['select', 'change', 'onChange', 'onSelect']);
    expect(vals(el)).toEqual(['a']);
    rec.stop();
  });

  it('keyboard deselect in single mode with allowDeselect (reopen -> active is the selected option -> Enter toggles it off)', () => {
    el = mount();
    el.updateConfig({ selection: { allowDeselect: true } });
    const rec = record(el);
    dispatchKey(el, 'Enter');        // open
    dispatchKey(el, 'ArrowDown');    // active = a
    dispatchKey(el, 'Enter');        // select a (single-mode closeOnSelect closes the listbox)
    expect(vals(el)).toEqual(['a']);
    rec.reset();
    // Reopen: active defaults to the currently selected option, so Enter on it deselects.
    dispatchKey(el, 'Enter');        // reopen (was closed by closeOnSelect)
    dispatchKey(el, 'Enter');        // deselect active a
    expect(rec.order()).toEqual(['select', 'change', 'onChange', 'onSelect']);
    expect((evEntry(rec, 'select') as any).detail.selected).toBe(false);
    expect(vals(el)).toEqual([]);
    rec.stop();
  });

  it('keyboard selection payload matches pointer selection payload shape', () => {
    el = mount();
    const rec = record(el);
    dispatchKey(el, 'Enter');
    dispatchKey(el, 'ArrowDown');
    dispatchKey(el, 'Enter');
    const d = (evEntry(rec, 'select') as any).detail;
    expect(d).toEqual({ item: THREE[0], index: 0, value: 'a', label: 'A', selected: true, multi: false });
    rec.stop();
  });
});

// ===========================================================================
// T4-03 — Single/multi selection and deselection flags
// ===========================================================================
describe('W1-P1.2 Task 4 (T4-03) — selection/deselection `selected` flags', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  it('single: select sets select.detail.selected=true; re-select with allowDeselect=true sets selected=false', () => {
    el = mount();
    el.updateConfig({ selection: { allowDeselect: true } });
    el.open();
    const rec = record(el);
    clickOption(el, 'a');
    expect((evEntry(rec, 'select') as any).detail.selected).toBe(true);
    clickOption(el, 'a');
    expect((evEntry(rec, 'select') as any).detail.selected).toBe(false);
    expect(vals(el)).toEqual([]);
    rec.stop();
  });

  it('multi: select sets selected=true, deselect sets selected=false; both still multi=true', () => {
    el = mount();
    el.updateConfig({ selection: { mode: 'multi' } });
    el.open();
    const rec = record(el);
    clickOption(el, 'b');
    let d = (evEntry(rec, 'select') as any).detail;
    expect(d.selected).toBe(true);
    expect(d.multi).toBe(true);
    clickOption(el, 'b'); // toggle off
    d = (evEntry(rec, 'select') as any).detail;
    expect(d.selected).toBe(false);
    expect(d.multi).toBe(true);
    rec.stop();
  });

  it('multi: repeated activation toggles deterministically (on, off, on)', () => {
    el = mount();
    el.updateConfig({ selection: { mode: 'multi' } });
    el.open();
    const rec = record(el);
    clickOption(el, 'b');
    clickOption(el, 'b');
    clickOption(el, 'b');
    const flags = rec.timeline
      .filter((t): t is Extract<TimelineEntry, { kind: 'event' }> => t.kind === 'event' && t.name === 'select')
      .map((t) => t.detail.selected);
    expect(flags).toEqual([true, false, true]);
    expect(vals(el)).toEqual(['b']);
    rec.stop();
  });

  it('multi flag is false in single mode', () => {
    el = mount();
    el.open();
    const rec = record(el);
    clickOption(el, 'a');
    expect((evEntry(rec, 'select') as any).detail.multi).toBe(false);
    rec.stop();
  });
});

// ===========================================================================
// T4-04 — Exact select and change payloads
// ===========================================================================
describe('W1-P1.2 Task 4 (T4-04) — exact select and change payloads', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  it('select.detail has exactly { item, index, value, label, selected, multi }', () => {
    el = mount();
    el.open();
    const rec = record(el);
    clickOption(el, 'c');
    const d = (evEntry(rec, 'select') as any).detail;
    expect(Object.keys(d).sort()).toEqual(['index', 'item', 'label', 'multi', 'selected', 'value']);
    expect(d).toEqual({ item: THREE[2], index: 2, value: 'c', label: 'C', selected: true, multi: false });
    rec.stop();
  });

  it('change.detail has { selectedItems, selectedValues, selectedIndices } agreeing with final selection', () => {
    el = mount();
    el.open();
    const rec = record(el);
    clickOption(el, 'b');
    const d = (evEntry(rec, 'change') as any).detail;
    expect(Object.keys(d).sort()).toEqual(['selectedIndices', 'selectedItems', 'selectedValues']);
    expect(d.selectedItems).toEqual([THREE[1]]);
    expect(d.selectedValues).toEqual(['b']);
    expect(d.selectedIndices).toEqual([1]);
    // Agreements with public getters.
    expect(d.selectedValues).toEqual(vals(el));
    expect(d.selectedItems).toEqual(el.getSelectedItems());
    rec.stop();
  });

  it('multi: change order follows selection insertion order (not registry order)', () => {
    el = mount();
    el.updateConfig({ selection: { mode: 'multi' } });
    el.open();
    const rec = record(el);
    clickOption(el, 'c'); // select c first
    clickOption(el, 'a'); // then a
    const d = (evEntry(rec, 'change') as any).detail;
    expect(d.selectedValues).toEqual(['c', 'a']);
    expect(d.selectedIndices).toEqual([2, 0]);
    expect(d.selectedValues).toEqual(vals(el));
    rec.stop();
  });

  it('onSelect callback receives the select detail (including `multi`); onChange receives (items, values)', () => {
    el = mount();
    el.open();
    const rec = record(el);
    clickOption(el, 'a');
    const onSel = cbEntry(rec, 'onSelect');
    // onSelect is passed the SAME detail object as the select event (which includes multi).
    expect(onSel.args[0]).toEqual((evEntry(rec, 'select') as any).detail);
    const onChg = cbEntry(rec, 'onChange');
    expect(onChg.args[0]).toEqual([THREE[0]]);
    expect(onChg.args[1]).toEqual(['a']);
    rec.stop();
  });

  it('change follows every select on select/deselect (single deselect reports the emptied selection)', () => {
    el = mount();
    el.updateConfig({ selection: { allowDeselect: true } });
    el.open();
    const rec = record(el);
    clickOption(el, 'a');
    clickOption(el, 'a'); // deselect
    const d = (evEntry(rec, 'change') as any).detail;
    expect(d.selectedValues).toEqual([]);
    expect(d.selectedIndices).toEqual([]);
    rec.stop();
  });
});

// ===========================================================================
// T4-05 — Deterministic callback/event ordering
// ===========================================================================
describe('W1-P1.2 Task 4 (T4-05) — deterministic callback/event ordering', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  it('option activation order is select -> change -> onChange -> onSelect (change before onSelect)', () => {
    el = mount();
    el.open();
    const rec = record(el);
    clickOption(el, 'a');
    expect(rec.order()).toEqual(['select', 'change', 'onChange', 'onSelect']);
    rec.stop();
  });

  it('ordering is stable across repeated identical interactions', () => {
    el = mount();
    el.updateConfig({ selection: { mode: 'multi' } });
    el.open();
    const rec = record(el);
    clickOption(el, 'a');
    clickOption(el, 'b');
    clickOption(el, 'c');
    expect(rec.order()).toEqual([
      'select', 'change', 'onChange', 'onSelect',
      'select', 'change', 'onChange', 'onSelect',
      'select', 'change', 'onChange', 'onSelect',
    ]);
    rec.stop();
  });

  it('events bubble (composed) to a light-DOM ancestor listener', () => {
    el = mount();
    el.open();
    const bubbled: string[] = [];
    const outer = (e: Event) => { if ((e as CustomEvent).detail) bubbled.push(e.type); };
    document.addEventListener('select', outer);
    document.addEventListener('change', outer);
    clickOption(el, 'a');
    document.removeEventListener('select', outer);
    document.removeEventListener('change', outer);
    expect(bubbled).toEqual(['select', 'change']);
  });
});

// ===========================================================================
// T4-06 — Clear-control event and callback semantics
// ===========================================================================
describe('W1-P1.2 Task 4 (T4-06) — clear-control semantics', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  it('clear-control with a selection emits change -> onChange -> clear -> onClear and empties', async () => {
    el = mount();
    el.updateConfig({ clearControl: { enabled: true, hideWhenEmpty: false } });
    await el.setSelectedValues(['a']);
    const rec = record(el);
    clearButton(el).click();
    expect(rec.order()).toEqual(['change', 'onChange', 'clear', 'onClear']);
    expect((evEntry(rec, 'clear') as any).detail).toEqual({ clearedSelection: true, clearedSearch: false });
    expect((evEntry(rec, 'change') as any).detail.selectedValues).toEqual([]);
    expect(vals(el)).toEqual([]);
    rec.stop();
  });

  it('empty clear-control activation: button disabled, no event, no callback, no state change', () => {
    el = mount();
    el.updateConfig({ clearControl: { enabled: true, hideWhenEmpty: false } });
    const rec = record(el);
    const btn = clearButton(el);
    expect(btn.disabled).toBe(true);
    btn.click();
    expect(rec.order()).toEqual([]);
    expect(vals(el)).toEqual([]);
    rec.stop();
  });

  it('selection-only clear-control (clearSearch=false) does not touch search and reports clearedSearch=false', async () => {
    el = mount();
    el.updateConfig({ clearControl: { enabled: true, hideWhenEmpty: false, clearSearch: false } });
    await el.setSelectedValues(['b']);
    const rec = record(el);
    clearButton(el).click();
    expect((evEntry(rec, 'clear') as any).detail).toEqual({ clearedSelection: true, clearedSearch: false });
    expect(vals(el)).toEqual([]);
    rec.stop();
  });

  it('required + selection: clear-control PRESERVES selection but clear.detail.clearedSelection is TRUE (DEVIATION-10)', async () => {
    el = mount();
    el.updateConfig({ clearControl: { enabled: true, hideWhenEmpty: false } });
    await el.setSelectedValues(['a']);
    el.setRequired(true);
    const rec = record(el);
    clearButton(el).click();
    // Actual selection is preserved (required blocks clearing)...
    expect(vals(el)).toEqual(['a']);
    // ...yet the clear event/callback claim it was cleared, and the paired
    // change still reports the preserved selection.
    expect((evEntry(rec, 'clear') as any).detail.clearedSelection).toBe(true);
    expect((cbEntry(rec, 'onClear')).args[0].clearedSelection).toBe(true);
    expect((evEntry(rec, 'change') as any).detail.selectedValues).toEqual(['a']);
    expect(rec.order()).toEqual(['change', 'onChange', 'clear', 'onClear']);
    rec.stop();
  });
});

// ===========================================================================
// T4-07 — Chip/option removal event semantics
// ===========================================================================
describe('W1-P1.2 Task 4 (T4-07) — chip removal semantics', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  it('chip removal emits change -> onChange -> remove (no select), and does not invoke onSelect', async () => {
    el = mount();
    el.updateConfig({ selection: { mode: 'multi' } });
    await el.setSelectedValues(['a', 'c']);
    const rec = record(el);
    clickChipRemove(el, 0); // remove the first rendered chip (value a)
    expect(rec.order()).toEqual(['change', 'onChange', 'remove']);
    expect(rec.order()).not.toContain('onSelect');
    expect(rec.events()).not.toContain('select');
    expect(vals(el)).toEqual(['c']);
    rec.stop();
  });

  it('remove.detail is { item, index } where index is the source registry index', async () => {
    el = mount();
    el.updateConfig({ selection: { mode: 'multi' } });
    await el.setSelectedValues(['a', 'c']);
    const rec = record(el);
    clickChipRemove(el, 1); // second rendered chip (value c, source index 2)
    const d = (evEntry(rec, 'remove') as any).detail;
    expect(Object.keys(d).sort()).toEqual(['index', 'item']);
    expect(d).toEqual({ item: THREE[2], index: 2 });
    expect(vals(el)).toEqual(['a']);
    rec.stop();
  });

  it('change emitted by removal reflects the post-removal selection', async () => {
    el = mount();
    el.updateConfig({ selection: { mode: 'multi' } });
    await el.setSelectedValues(['a', 'b', 'c']);
    const rec = record(el);
    clickChipRemove(el, 1); // remove b
    const d = (evEntry(rec, 'change') as any).detail;
    expect(d.selectedValues).toEqual(['a', 'c']);
    rec.stop();
  });

  it('option-level remove control (SelectOption [part="chip-remove"]) mirrors chip removal: change -> onChange -> remove, no select', async () => {
    el = mount();
    el.updateConfig({ selection: { mode: 'multi' } });
    el.open(); // renders SelectOption hosts, each with its own shadow-root remove button
    await el.setSelectedValues(['a', 'c']);
    const rec = record(el);
    // The option-level remove button lives inside the SelectOption's shadow root
    // (not the enhanced-select shadow root), so resolve it per-option.
    const selectedOption = Array.from(el.shadowRoot!.querySelectorAll('select-option'))
      .find((o) => o.getAttribute('data-value') === 'a') as HTMLElement & { shadowRoot: ShadowRoot | null };
    expect(selectedOption, 'rendered SelectOption for value a').toBeTruthy();
    const removeBtn = selectedOption.shadowRoot!.querySelector<HTMLButtonElement>('[part="chip-remove"]');
    expect(removeBtn, 'option-level remove button').toBeTruthy();
    removeBtn!.click();

    expect(rec.order()).toEqual(['change', 'onChange', 'remove']);
    expect(rec.events()).not.toContain('select');
    expect((evEntry(rec, 'remove') as any).detail).toEqual({ item: THREE[0], index: 0 });
    expect(vals(el)).toEqual(['c']);
    rec.stop();
  });
});

// ===========================================================================
// T4-08 — Disabled, limited, and no-op cases
// ===========================================================================
describe('W1-P1.2 Task 4 (T4-08) — rejected and no-op actions', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  it('disabled option (blocked): no state change AND no event', () => {
    el = mount([{ id: 'a', value: 'a', label: 'A' }, { id: 'd', value: 'd', label: 'D', disabled: true }]);
    el.open();
    const rec = record(el);
    clickOption(el, 'd');
    expect(rec.order()).toEqual([]);
    expect(vals(el)).toEqual([]);
    rec.stop();
  });

  it('disabled option (explicitly selectable): selection IS allowed and emits events', async () => {
    el = mount([{ id: 'a', value: 'a', label: 'A' }, { id: 'd', value: 'd', label: 'D', disabled: true }]);
    el.updateConfig({ selection: { mode: 'multi', disabledOptionBehavior: { selectable: true, hoverable: false, focusable: false } } });
    el.open();
    const rec = record(el);
    clickOption(el, 'd');
    expect(rec.order()).toEqual(['select', 'change', 'onChange', 'onSelect']);
    expect(vals(el)).toEqual(['d']);
    rec.stop();
  });

  it('maxSelections limit: additional selection is rejected with no state change AND no event', async () => {
    el = mount();
    el.updateConfig({ selection: { maxSelections: 2 } });
    el.updateConfig({ selection: { mode: 'multi' } });
    el.open();
    await el.setSelectedValues(['a', 'b']);
    const rec = record(el);
    clickOption(el, 'c'); // would exceed max
    expect(rec.order()).toEqual([]);
    expect(vals(el)).toEqual(['a', 'b']);
    rec.stop();
  });

  it('single re-select with allowDeselect=false: NO state change BUT select+change events still fire', () => {
    el = mount(); // allowDeselect defaults to false
    el.open();
    const rec = record(el);
    clickOption(el, 'a');
    rec.reset();
    clickOption(el, 'a'); // re-select same option
    // Selection unchanged, but a full event sequence is still emitted.
    expect(rec.order()).toEqual(['select', 'change', 'onChange', 'onSelect']);
    expect((evEntry(rec, 'select') as any).detail.selected).toBe(true);
    expect(vals(el)).toEqual(['a']);
    rec.stop();
  });

  it('allowDeselect transition: same re-select now deselects (state change WITH events)', () => {
    el = mount();
    el.updateConfig({ selection: { allowDeselect: true } });
    el.open();
    const rec = record(el);
    clickOption(el, 'a');
    rec.reset();
    clickOption(el, 'a');
    expect(rec.order()).toEqual(['select', 'change', 'onChange', 'onSelect']);
    expect((evEntry(rec, 'select') as any).detail.selected).toBe(false);
    expect(vals(el)).toEqual([]);
    rec.stop();
  });
});

// ===========================================================================
// T4-09 — Programmatic versus interaction-driven differences
// ===========================================================================
describe('W1-P1.2 Task 4 (T4-09) — programmatic vs interaction', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  it('programmatic setSelectedValues emits only change -> onChange (no select, no onSelect)', async () => {
    el = mount();
    const rec = record(el);
    await el.setSelectedValues(['a']);
    expect(rec.order()).toEqual(['change', 'onChange']);
    expect(vals(el)).toEqual(['a']);
    rec.stop();
  });

  it('programmatic clear() emits only change -> onChange (no clear/onClear)', async () => {
    el = mount();
    await el.setSelectedValues(['a']);
    const rec = record(el);
    el.clear();
    expect(rec.order()).toEqual(['change', 'onChange']);
    expect(rec.events()).not.toContain('clear');
    expect(vals(el)).toEqual([]);
    rec.stop();
  });

  it('interaction-driven selection and remove use the interaction sequences (contrast with programmatic)', async () => {
    el = mount();
    el.updateConfig({ selection: { mode: 'multi' }, clearControl: { enabled: true, hideWhenEmpty: false } });
    el.open();
    const rec = record(el);
    clickOption(el, 'a');
    expect(rec.order()).toEqual(['select', 'change', 'onChange', 'onSelect']);
    rec.reset();
    clickChipRemove(el, 0);
    expect(rec.order()).toEqual(['change', 'onChange', 'remove']);
    rec.reset();
    clearButton(el).click(); // nothing to clear after removal -> disabled, no events
    expect(rec.order()).toEqual([]);
    rec.stop();
  });
});
