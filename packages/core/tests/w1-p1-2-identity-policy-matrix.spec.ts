/**
 * W1-P1.2 Task 2 — Selection Identity and Policy Matrix.
 *
 * Public-interface-only. State is created only via setItems / updateConfig /
 * setSelectedValues; observations come from public getters, rendered DOM
 * (shadow root), and dispatched events. No _state, engine, or legacy
 * projection access.
 *
 * Contract IDs (see W1-P1-TRACEABILITY.json):
 *   API-010 getSelectedItems, API-011 getSelectedValues, API-012 setSelectedValues,
 *   API-020 setItems, CONFIG-001..008 selection policy, ATTR/DEVIATION-07.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

type Item = { id: string; value: string; label: string; disabled?: boolean };

function mk(...specs: Array<[string, string] | [string, string, boolean]>): Item[] {
  return specs.map(([value, label, disabled]) => ({ id: `id-${value}`, value, label, disabled }));
}

function mount(items: Item[]): EnhancedSelect {
  const el = document.createElement('enhanced-select') as EnhancedSelect;
  el.setItems(items);
  document.body.appendChild(el);
  return el;
}

function val(el: EnhancedSelect): unknown[] {
  return el.getSelectedValues();
}

describe('W1-P1.2 Task 2 — single vs multi selection and limits', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  it('single mode: empty request yields empty; one value yields that value', async () => {
    el = mount(mk(['a', 'Alpha'], ['b', 'Beta']));
    await el.setSelectedValues([]);
    expect(val(el)).toEqual([]);
    await el.setSelectedValues(['a']);
    expect(val(el)).toEqual(['a']);
  });

  it('single mode: multiple-value request keeps exactly one eligible value', async () => {
    el = mount(mk(['a', 'Alpha'], ['b', 'Beta'], ['c', 'Gamma']));
    await el.setSelectedValues(['a', 'b', 'c']);
    expect(val(el)).toHaveLength(1);
  });

  it('multi mode: keeps every requested eligible value in selection order', async () => {
    el = mount(mk(['a', 'Alpha'], ['b', 'Beta'], ['c', 'Gamma']));
    el.updateConfig({ selection: { mode: 'multi' } });
    await el.setSelectedValues(['a', 'b', 'c']);
    expect(val(el)).toEqual(['a', 'b', 'c']);
  });

  it('maxSelections=1 in multi mode limits to one value', async () => {
    el = mount(mk(['a', 'Alpha'], ['b', 'Beta'], ['c', 'Gamma']));
    el.updateConfig({ selection: { mode: 'multi', maxSelections: 1 } });
    await el.setSelectedValues(['a', 'b', 'c']);
    expect(val(el)).toHaveLength(1);
  });

  it('maxSelections=2 in multi mode keeps two values', async () => {
    el = mount(mk(['a', 'Alpha'], ['b', 'Beta'], ['c', 'Gamma']));
    el.updateConfig({ selection: { mode: 'multi', maxSelections: 2 } });
    await el.setSelectedValues(['a', 'b', 'c']);
    expect(val(el)).toHaveLength(2);
  });

  it('maxSelections=0 means unbounded', async () => {
    el = mount(mk(['a', 'Alpha'], ['b', 'Beta'], ['c', 'Gamma']));
    el.updateConfig({ selection: { mode: 'multi', maxSelections: 0 } });
    await el.setSelectedValues(['a', 'b', 'c']);
    expect(val(el)).toEqual(['a', 'b', 'c']);
  });
});

describe('W1-P1.2 Task 2 — DEVIATION-07: request vs registry order (single mode)', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  const ask = async (items: Item[], requested: string[]) => {
    el = mount(items);
    await el.setSelectedValues(requested);
    return val(el);
  };

  it('registry [a,b,c], request [a,c] -> which survives', async () => {
    const survived = await ask(mk(['a', 'Alpha'], ['b', 'Beta'], ['c', 'Gamma']), ['a', 'c']);
    expect(survived).toEqual(['a']);
  });

  it('registry [a,b,c], request [c,a] -> request order effect', async () => {
    const survived = await ask(mk(['a', 'Alpha'], ['b', 'Beta'], ['c', 'Gamma']), ['c', 'a']);
    // If registry order governs, 'a' survives regardless of request order.
    expect(survived).toEqual(['a']);
  });

  it('registry [c,b,a], request [a,c] -> registry order effect', async () => {
    const survived = await ask(mk(['c', 'Gamma'], ['b', 'Beta'], ['a', 'Alpha']), ['a', 'c']);
    // Reversed registry: 'c' is first -> 'c' survives.
    expect(survived).toEqual(['c']);
  });

  it('registry [c,b,a], request [c,a] -> reversed request on reversed registry', async () => {
    const survived = await ask(mk(['c', 'Gamma'], ['b', 'Beta'], ['a', 'Alpha']), ['c', 'a']);
    expect(survived).toEqual(['c']);
  });
});

describe('W1-P1.2 Task 2 — identity: duplicate values vs duplicate keys', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  it('same value in different records with distinct ids/keys selects by value', async () => {
    el = mount([
      { id: 'x1', value: 'dup', label: 'First' },
      { id: 'x2', value: 'dup', label: 'Second' },
      { id: 'y', value: 'other', label: 'Other' },
    ]);
    await el.setSelectedValues(['dup']);
    expect(val(el)).toEqual(['dup']);
  });

  it('repeated setItems with fresh object instances preserves value-based selection', async () => {
    el = mount(mk(['a', 'Alpha'], ['b', 'Beta']));
    await el.setSelectedValues(['b']);
    // Replace with new object instances (same values).
    el.setItems([
      { id: 'new-b', value: 'b', label: 'Beta v2' },
      { id: 'new-a', value: 'a', label: 'Alpha v2' },
    ]);
    expect(val(el)).toEqual(['b']);
  });

  it('duplicate keys: development runtime throws on setItems (policy is env-dependent)', () => {
    // NODE_ENV is 'test' here (not 'production'), so duplicateKeyPolicy='throw'.
    // Production uses 'warn'; that path is documented, not asserted here.
    const el2 = document.createElement('enhanced-select') as EnhancedSelect;
    expect(() => el2.setItems([
      { id: 'same', value: 'a', label: 'A' },
      { id: 'same', value: 'b', label: 'B' },
    ])).toThrow(/Duplicate item key/);
    el2.remove();
  });
});

describe('W1-P1.2 Task 2 — disabled-option policy', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  it('default: disabled option is not selectable via setSelectedValues', async () => {
    el = mount(mk(['a', 'Alpha'], ['b', 'Beta', true]));
    await el.setSelectedValues(['a', 'b']);
    expect(val(el)).toEqual(['a']);
  });

  it('disabledOptionBehavior.selectable=true allows selecting a disabled option', async () => {
    el = mount(mk(['a', 'Alpha'], ['b', 'Beta', true]));
    el.updateConfig({
      selection: { mode: 'multi', disabledOptionBehavior: { selectable: true, hoverable: false, focusable: false } },
    });
    await el.setSelectedValues(['a', 'b']);
    expect(val(el).sort()).toEqual(['a', 'b']);
  });
});

describe('W1-P1.2 Task 2 — reorder, replacement, grouping, detached items', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  it('reordering items retains value-based selection', async () => {
    el = mount(mk(['a', 'Alpha'], ['b', 'Beta'], ['c', 'Gamma']));
    el.updateConfig({ selection: { mode: 'multi' } });
    await el.setSelectedValues(['a', 'c']);
    el.setItems(mk(['c', 'Gamma'], ['b', 'Beta'], ['a', 'Alpha']));
    expect(val(el).sort()).toEqual(['a', 'c']);
  });

  it('detached selected value is RETAINED after removal from loaded data (cached record)', async () => {
    // Observed: removing a selected item from setItems does not drop the
    // selection; the last-known record is cached and getSelectedValues() keeps
    // reporting it, while it no longer renders among loaded options.
    el = mount(mk(['a', 'Alpha'], ['b', 'Beta']));
    await el.setSelectedValues(['b']);
    el.setItems(mk(['a', 'Alpha'])); // drop 'b' from loaded data
    expect(val(el)).toEqual(['b']);
    // It is detached: not present among currently loaded items.
    expect((el.loadedItems as Array<{ value: string }>).map((i) => i.value)).toEqual(['a']);
    expect(el.getSelectedItems()).toHaveLength(1);
  });

  it('a detached selected value can be re-selected when it returns', async () => {
    el = mount(mk(['a', 'Alpha'], ['b', 'Beta']));
    await el.setSelectedValues(['b']);
    el.setItems(mk(['a', 'Alpha']));
    el.setItems(mk(['a', 'Alpha'], ['b', 'Beta v2'])); // returns as new instance
    await el.setSelectedValues(['b']);
    expect(val(el)).toEqual(['b']);
  });

  it('selected-first presentation differs from logical selection (multi)', async () => {
    el = mount(mk(['a', 'Alpha'], ['b', 'Beta'], ['c', 'Gamma']));
    el.updateConfig({ selection: { mode: 'multi' }, selectedOptions: { placement: 'selected-first' } as never });
    await el.setSelectedValues(['c']);
    // Logical selection is 'c' regardless of where it renders.
    expect(val(el)).toEqual(['c']);
    expect(el.getSelectedItems().length).toBe(1);
  });
});

describe('W1-P1.2 Task 2 — required and explicit deselection', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  it('required preserves a single selection against setSelectedValues([])', async () => {
    el = mount(mk(['a', 'Alpha'], ['b', 'Beta']));
    await el.setSelectedValues(['a']);
    el.setRequired(true);
    await el.setSelectedValues([]);
    // Observed: required + replace-with-empty keeps the prior valid selection.
    expect(val(el)).toEqual(['a']);
  });

  it('non-required allows explicit clear via setSelectedValues([])', async () => {
    el = mount(mk(['a', 'Alpha'], ['b', 'Beta']));
    await el.setSelectedValues(['a']);
    await el.setSelectedValues([]);
    expect(val(el)).toEqual([]);
  });
});
