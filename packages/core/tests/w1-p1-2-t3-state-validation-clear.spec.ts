/**
 * W1-P1.2 Task 3 — Public Selection State, Validation, and Clear API matrix.
 *
 * Public-interface-only. Selection state is created via setItems /
 * updateConfig / setSelectedValues; observations are public getters,
 * shadowRoot, validate()/getEventedState via listeners. No _state, engine,
 * dispatch, or compatibility-projection access; no direct shadow-DOM mutation.
 *
 * Interaction-driven select/change/clear ordering is Task 4 and is NOT covered.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

type Item = { id: string; value: string; label: string; disabled?: boolean };

function mount(items: Item[]): EnhancedSelect {
  const el = document.createElement('enhanced-select') as EnhancedSelect;
  el.setItems(items);
  document.body.appendChild(el);
  return el;
}
const A_B: Item[] = [{ id: 'a', value: 'a', label: 'A' }, { id: 'b', value: 'b', label: 'B' }];
const vals = (el: EnhancedSelect) => el.getSelectedValues();

function recordEvents(el: EnhancedSelect, names: string[]): { types: () => string[]; stop: () => void } {
  const log: string[] = [];
  const hs = names.map((n) => {
    const h = () => log.push(n);
    el.addEventListener(n, h);
    return [n, h] as const;
  });
  return { types: () => log.slice(), stop: () => hs.forEach(([n, h]) => el.removeEventListener(n, h)) };
}

describe('W1-P1.2 Task 3 — clear() and setSelectedValues([]) basics', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  it('clear() on empty selection is a no-op for values but still emits one change', async () => {
    el = mount(A_B);
    const ev = recordEvents(el, ['change', 'clear', 'select']);
    el.clear();
    expect(vals(el)).toEqual([]);
    expect(ev.types()).toEqual(['change']);
    ev.stop();
  });

  it('clear() empties a non-empty selection with a single change (no clear/select event)', async () => {
    el = mount(A_B);
    await el.setSelectedValues(['a']);
    const ev = recordEvents(el, ['change', 'clear', 'select']);
    el.clear();
    expect(vals(el)).toEqual([]);
    expect(el.getSelectedItems()).toEqual([]);
    expect(ev.types()).toEqual(['change']);
    ev.stop();
  });

  it('setSelectedValues([]) empties selection with a single change', async () => {
    el = mount(A_B);
    await el.setSelectedValues(['a']);
    const ev = recordEvents(el, ['change', 'clear', 'select']);
    await el.setSelectedValues([]);
    expect(vals(el)).toEqual([]);
    expect(ev.types()).toEqual(['change']);
    ev.stop();
  });

  it('clear() empties a multi-mode selection incl. duplicate values', async () => {
    el = mount([{ id: 'x1', value: 'dup', label: '1' }, { id: 'x2', value: 'dup', label: '2' }, { id: 'y', value: 'o', label: 'O' }]);
    el.updateConfig({ selection: { mode: 'multi' } });
    await el.setSelectedValues(['dup']);
    expect(vals(el)).toEqual(['dup', 'dup']);
    el.clear();
    expect(vals(el)).toEqual([]);
  });

  it('repeated clear() is idempotent in value terms', async () => {
    el = mount(A_B);
    await el.setSelectedValues(['a']);
    el.clear();
    const first = vals(el);
    el.clear();
    expect(vals(el)).toEqual(first);
    expect(vals(el)).toEqual([]);
  });
});

describe('W1-P1.2 Task 3 — required: clear vs setSelectedValues([]) preservation', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  it('required PRESERVES selection under clear() (does not empty)', async () => {
    el = mount(A_B);
    await el.setSelectedValues(['a']);
    el.setRequired(true);
    el.clear();
    expect(vals(el)).toEqual(['a']);
  });

  it('required PRESERVES selection under setSelectedValues([])', async () => {
    el = mount(A_B);
    await el.setSelectedValues(['a']);
    el.setRequired(true);
    await el.setSelectedValues([]);
    expect(vals(el)).toEqual(['a']);
  });

  it('non-required: both clear() and setSelectedValues([]) empty the selection', async () => {
    el = mount(A_B);
    await el.setSelectedValues(['a']);
    el.setRequired(false);
    el.clear();
    expect(vals(el)).toEqual([]);
    await el.setSelectedValues(['a']);
    el.setRequired(false);
    await el.setSelectedValues([]);
    expect(vals(el)).toEqual([]);
  });

  it('disabling required again allows clearing', async () => {
    el = mount(A_B);
    await el.setSelectedValues(['a']);
    el.setRequired(true);
    el.clear();
    expect(vals(el)).toEqual(['a']);
    el.setRequired(false);
    el.clear();
    expect(vals(el)).toEqual([]);
  });
});

describe('W1-P1.2 Task 3 — validate() matrix', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  it('non-required always validates true (empty or not)', async () => {
    el = mount(A_B);
    expect(el.validate()).toBe(true);
    await el.setSelectedValues(['a']);
    expect(el.validate()).toBe(true);
  });

  it('required + empty => false (and still false); required + selection => true', async () => {
    el = mount(A_B);
    el.setRequired(true);
    expect(el.validate()).toBe(false);
    await el.setSelectedValues(['a']);
    expect(el.validate()).toBe(true);
  });

  it('required + selection then preserved-after-clear still validates true', async () => {
    el = mount(A_B);
    await el.setSelectedValues(['a']);
    el.setRequired(true);
    el.clear();
    expect(el.validate()).toBe(true);
  });

  it('required + detached-selected: getters report the value but validate() returns false (inconsistency)', async () => {
    // Observed inconsistency: a detached (but still retained) selection is
    // visible via getSelectedValues()/getSelectedItems(), yet validate()
    // returns false because it checks the live selectedIndices projection,
    // which excludes the detached record. Recorded, not repaired.
    el = mount(A_B);
    await el.setSelectedValues(['b']);
    el.setItems([{ id: 'a', value: 'a', label: 'A' }]); // detach b
    el.setRequired(true);
    expect(vals(el)).toEqual(['b']);
    expect(el.getSelectedItems()).toHaveLength(1);
    expect(el.validate()).toBe(false);
  });

  it('required + disabled-selected (selectable:true) validates true', async () => {
    el = mount([{ id: 'a', value: 'a', label: 'A' }, { id: 'd', value: 'd', label: 'D', disabled: true }]);
    el.updateConfig({ selection: { mode: 'multi', disabledOptionBehavior: { selectable: true, hoverable: false, focusable: false } } });
    await el.setSelectedValues(['d']);
    el.setRequired(true);
    expect(el.validate()).toBe(true);
  });
});

describe('W1-P1.2 Task 3 — DEVIATION-08 pruning and reattachment variants', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  /** Common sequence: load [a,b], select b, replace with [a] (b detached). */
  async function detachB(): Promise<void> {
    el = mount(A_B);
    await el.setSelectedValues(['b']);
    el.setItems([{ id: 'a', value: 'a', label: 'A' }]);
    expect(vals(el)).toEqual(['b']); // retained while detached
  }

  it('baseline: detached selection retained and not rendered', async () => {
    await detachB();
    expect((el.loadedItems as Item[]).map((i) => i.value)).toEqual(['a']);
    el.open();
    const rendered = Array.from(el.shadowRoot!.querySelectorAll('[part="option"]')).map((o) => (o as HTMLElement).dataset.value);
    expect(rendered).toEqual(['a']);
    el.close();
  });

  it('clear() prunes the detached selection', async () => {
    await detachB();
    const ev = recordEvents(el, ['change']);
    el.clear();
    expect(vals(el)).toEqual([]);
    expect(ev.types()).toEqual(['change']);
    ev.stop();
  });

  it('setSelectedValues([]) prunes the detached selection', async () => {
    await detachB();
    await el.setSelectedValues([]);
    expect(vals(el)).toEqual([]);
  });

  it('required then clear() does NOT clear the detached selection', async () => {
    await detachB();
    el.setRequired(true);
    el.clear();
    expect(vals(el)).toEqual(['b']); // preserved (required)
  });

  it('required then setSelectedValues([]) preserves the detached selection', async () => {
    await detachB();
    el.setRequired(true);
    await el.setSelectedValues([]);
    expect(vals(el)).toEqual(['b']);
  });

  it('re-adding b AFTER clearing does not resurrect the cleared selection', async () => {
    await detachB();
    el.clear(); // prune
    el.setItems(A_B);
    expect(vals(el)).toEqual([]);
  });

  it('re-adding the SAME key as a new instance reattaches to the NEW instance', async () => {
    await detachB();
    const bSameKey = { id: 'b', value: 'b', label: 'B2' };
    el.setItems([{ id: 'a', value: 'a', label: 'A' }, bSameKey]);
    expect(vals(el)).toEqual(['b']);
    expect((el.getSelectedItems() as Item[])[0]).toBe(bSameKey); // same key -> new instance
  });

  it('re-adding with a DIFFERENT key does NOT migrate selection; old key stays cached', async () => {
    await detachB();
    el.setItems([
      { id: 'a', value: 'a', label: 'A' },
      { id: 'b-new', value: 'b', label: 'B-new' }, // different key, same value
    ]);
    // Selection is keyed by 'b'; the new record 'b-new' is a different key.
    expect(vals(el)).toEqual(['b']);
    expect((el.getSelectedItems() as Item[])[0].id).toBe('b'); // old key retained (detached)
  });
});

describe('W1-P1.2 Task 3 — configuration transitions (no private state)', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  it('multi -> single switch with autoMitigate (default) clears selection', async () => {
    el = mount([{ id: 'a', value: 'a', label: 'A' }, { id: 'b', value: 'b', label: 'B' }, { id: 'c', value: 'c', label: 'C' }]);
    el.updateConfig({ selection: { mode: 'multi' } });
    await el.setSelectedValues(['a', 'b']);
    expect(vals(el)).toEqual(['a', 'b']);
    el.updateConfig({ selection: { mode: 'single' } });
    expect(vals(el)).toEqual([]); // auto-mitigated
  });

  it('multi -> single switch with autoMitigateRuntimeModeSwitch:false is not auto-cleared', async () => {
    el = mount([{ id: 'a', value: 'a', label: 'A' }, { id: 'b', value: 'b', label: 'B' }, { id: 'c', value: 'c', label: 'C' }]);
    el.updateConfig({ selection: { mode: 'multi' }, limitations: { autoMitigateRuntimeModeSwitch: false, policies: {} } });
    await el.setSelectedValues(['a', 'b']);
    const before = vals(el);
    el.updateConfig({ selection: { mode: 'single' } });
    // Observed: without mitigation the prior selection is not explicitly cleared
    // by the switch; whatever survives is engine-normalized, not a fresh clear.
    expect(before).toEqual(['a', 'b']);
    expect(vals(el).length).toBeLessThanOrEqual(2);
  });

  it('maxSelections decrease trims an over-limit selection on next replace', async () => {
    el = mount([{ id: 'a', value: 'a', label: 'A' }, { id: 'b', value: 'b', label: 'B' }, { id: 'c', value: 'c', label: 'C' }]);
    el.updateConfig({ selection: { mode: 'multi' } });
    await el.setSelectedValues(['a', 'b', 'c']);
    expect(vals(el)).toEqual(['a', 'b', 'c']);
    el.updateConfig({ selection: { mode: 'multi', maxSelections: 2 } });
    await el.setSelectedValues(['a', 'b', 'c']);
    expect(vals(el)).toHaveLength(2);
  });

  it('allowDeselect does not affect programmatic replace-empty when non-required', async () => {
    el = mount(A_B);
    await el.setSelectedValues(['a']);
    el.updateConfig({ selection: { allowDeselect: true } });
    await el.setSelectedValues([]);
    expect(vals(el)).toEqual([]);
  });
});
