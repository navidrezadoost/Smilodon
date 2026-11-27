/**
 * W1-P1.2-T2-R — bounded evidence corrections for Task 2 findings.
 *
 * Public-interface-only. Adds identity (T2-F01), grouped/selected-first DOM
 * (T2-F02), and detached-reattachment (T2-F03) assertions using getters,
 * updateConfig/setItems/setGroupedItems, and shadowRoot inspection. No private
 * state or engine access. Does not touch the Task 1 ordering spec.
 *
 * Observed (recorded as behavior, not approved API):
 *  - Duplicate value selects the RECORD(s) by key; multi selects both, single
 *    selects the first in registry order.
 *  - Re-adding a removed item as a new instance AUTO-REATTACHES selection by
 *    key; getSelectedItems() returns the NEW instance. No explicit reselect
 *    required (refines DEVIATION-08).
 *  - selected-first is snapshotted at open(); detached selected values are
 *    retained in getters but do not render among options.
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

function renderedOptionValues(el: EnhancedSelect): string[] {
  return Array.from(el.shadowRoot!.querySelectorAll('[part="option"]'))
    .map((o) => (o as HTMLElement).dataset.value ?? '');
}

function renderedSelectedFlags(el: EnhancedSelect): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  el.shadowRoot!.querySelectorAll('[part="option"]').forEach((o) => {
    const el2 = o as HTMLElement;
    out[el2.dataset.value ?? ''] = el2.getAttribute('aria-selected');
  });
  return out;
}

describe('W1-P1.2-T2-R F01 — duplicate value: identity vs value equality', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  const items: Item[] = [
    { id: 'x1', value: 'dup', label: 'First' },
    { id: 'x2', value: 'dup', label: 'Second' },
    { id: 'y', value: 'other', label: 'Other' },
  ];

  it('multi mode selects BOTH records sharing a value (by key, not deduped by value)', async () => {
    el = mount(items);
    el.updateConfig({ selection: { mode: 'multi' } });
    await el.setSelectedValues(['dup']);
    const ids = (el.getSelectedItems() as Item[]).map((i) => i.id);
    expect(ids).toEqual(['x1', 'x2']);
    expect(el.getSelectedValues()).toEqual(['dup', 'dup']);
  });

  it('single mode selects only the FIRST record in registry order', async () => {
    el = mount(items);
    await el.setSelectedValues(['dup']);
    const ids = (el.getSelectedItems() as Item[]).map((i) => i.id);
    expect(ids).toEqual(['x1']);
  });

  it('single mode with reversed registry selects the first of the reversed order', async () => {
    el = mount([
      { id: 'x2', value: 'dup', label: 'Second' },
      { id: 'x1', value: 'dup', label: 'First' },
      { id: 'y', value: 'other', label: 'Other' },
    ]);
    await el.setSelectedValues(['dup']);
    expect((el.getSelectedItems() as Item[]).map((i) => i.id)).toEqual(['x2']);
  });
});

describe('W1-P1.2-T2-R F02 — grouped replacement and selected-first DOM order', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  it('setGroupedItems renders grouped options and retains selection by value', async () => {
    el = mount([{ id: 'a', value: 'a', label: 'A' }, { id: 'b', value: 'b', label: 'B' }, { id: 'c', value: 'c', label: 'C' }]);
    el.updateConfig({ selection: { mode: 'multi' } });
    await el.setSelectedValues(['a']);
    el.setGroupedItems([
      { label: 'G1', options: [{ id: 'a', value: 'a', label: 'A' }] },
      { label: 'G2', options: [{ id: 'b', value: 'b', label: 'B' }] },
    ]);
    expect(el.getSelectedValues()).toEqual(['a']);
    el.open();
    expect(renderedOptionValues(el)).toEqual(['a', 'b']);
    expect(renderedSelectedFlags(el).a).toBe('true');
    el.close();
  });

  it('selected-first places selected options before unselected in rendered DOM at open', async () => {
    el = mount([{ id: 'a', value: 'a', label: 'A' }, { id: 'b', value: 'b', label: 'B' }, { id: 'c', value: 'c', label: 'C' }]);
    el.updateConfig({ selection: { mode: 'multi' }, selectedOptions: { placement: 'selected-first' } as never });
    await el.setSelectedValues(['c']);
    el.open();
    const order = renderedOptionValues(el);
    // Selected 'c' renders first, ahead of a, b.
    expect(order[0]).toBe('c');
    expect(order.slice(1).sort()).toEqual(['a', 'b']);
    expect(renderedSelectedFlags(el).c).toBe('true');
    el.close();
  });

  it('detached selected value is retained in getters but NOT rendered after grouped replacement drops it', async () => {
    el = mount([{ id: 'a', value: 'a', label: 'A' }, { id: 'c', value: 'c', label: 'C' }]);
    el.updateConfig({ selection: { mode: 'multi' } });
    await el.setSelectedValues(['c']);
    el.setGroupedItems([{ label: 'G1', options: [{ id: 'a', value: 'a', label: 'A' }] }]); // drops 'c'
    expect(el.getSelectedValues()).toEqual(['c']); // retained (DEVIATION-08)
    el.open();
    expect(renderedOptionValues(el)).toEqual(['a']);
    expect('c' in renderedSelectedFlags(el)).toBe(false);
    el.close();
  });
});

describe('W1-P1.2-T2-R F03 — detached reattachment vs explicit reselection', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  it('re-adding a removed item as a NEW instance auto-reattaches; getSelectedItems returns the new instance', async () => {
    el = document.createElement('enhanced-select') as EnhancedSelect;
    document.body.appendChild(el);
    const bOrig = { id: 'b', value: 'b', label: 'B' };
    el.setItems([{ id: 'a', value: 'a', label: 'A' }, bOrig]);
    await el.setSelectedValues(['b']);
    expect(el.getSelectedItems()[0]).toBe(bOrig); // original reference

    el.setItems([{ id: 'a', value: 'a', label: 'A' }]); // remove 'b'
    const bNew = { id: 'b', value: 'b', label: 'B' };
    el.setItems([{ id: 'a', value: 'a', label: 'A' }, bNew]); // re-add, NO explicit reselect

    const cur = el.getSelectedItems();
    expect(cur).toHaveLength(1);
    expect(cur[0]).toBe(bNew);        // auto-reattached to the NEW instance
    expect(cur[0]).not.toBe(bOrig);
    el.open();
    expect(renderedSelectedFlags(el).b).toBe('true'); // renders as selected again
    el.close();
  });

  it('explicit reselection of a detached value is unnecessary but does not change identity outcome', async () => {
    el = document.createElement('enhanced-select') as EnhancedSelect;
    document.body.appendChild(el);
    el.setItems([{ id: 'a', value: 'a', label: 'A' }, { id: 'b', value: 'b', label: 'B' }]);
    await el.setSelectedValues(['b']);
    el.setItems([{ id: 'a', value: 'a', label: 'A' }]);
    const bNew = { id: 'b', value: 'b', label: 'B' };
    el.setItems([{ id: 'a', value: 'a', label: 'A' }, bNew]);
    await el.setSelectedValues(['b']); // explicit reselect after auto-reattach
    expect(el.getSelectedItems()[0]).toBe(bNew);
    expect(el.getSelectedValues()).toEqual(['b']);
  });
});
