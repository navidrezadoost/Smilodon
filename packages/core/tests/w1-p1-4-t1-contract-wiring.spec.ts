/**
 * W1-P1.4 Task 1 — Public Part-Token Characterization (PART-001/002/003/005/006/
 * 007/008/009/010/011).
 *
 * Public-surface-only characterization of the `part="…"` CSS-parts the element
 * exposes inside its OPEN shadow root. Ten contracts are covered:
 *   PART-001 button        PART-002 input          PART-003 listbox
 *   PART-005 clear-button  PART-006 clear-icon     PART-007 option
 *   PART-008 group-header  PART-009 chip/chip-label/chip-remove/
 *                          chip-remove-icon/chip-exiting
 *   PART-010 no-results    PART-011 loading/loading-content/loading-icon/
 *                          loading-message/loading-spinner
 *
 * Driving surface (NO private methods, NO private fields):
 *   - public methods: setItems / setGroupedItems / setSelectedValues /
 *     updateConfig / open / close;
 *   - public config: via updateConfig({...});
 *   - serverSide.fetchSelectedItems returning a pending promise to hold the
 *     genuine public busy state (loading parts) WITHOUT calling _setBusy.
 *
 * Observation surface (NO private state):
 *   - shadowRoot.querySelector('[part="…"]') element presence, tag, and nesting.
 *
 * T1-04 (light vs shadow ownership) is asserted: these parts live in the shadow
 * root and are NOT reachable as light-DOM children of the host.
 *
 * Negative / removal paths (T1-03):
 *   - PART-005/006 clear-button/-icon absent unless clearControl.enabled;
 *   - PART-008 group-header absent for a flat (non-grouped) list;
 *   - PART-009 chip family absent for a single-select;
 *   - PART-010 no-results absent while options render, present when empty;
 *   - PART-011 loading family absent while not busy.
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
  { id: 'a', value: 'a', label: 'Alpha' },
  { id: 'b', value: 'b', label: 'Bravo', disabled: true },
  { id: 'c', value: 'c', label: 'Charlie' },
  { id: 'd', value: 'd', label: 'Delta' },
];

let el: EnhancedSelect | undefined;

function mount(config: Record<string, unknown> = {}): EnhancedSelect {
  const node = document.createElement('enhanced-select') as EnhancedSelect;
  if (Object.keys(config).length) node.updateConfig(config as never);
  node.setItems(FOUR);
  document.body.appendChild(node);
  el = node;
  return node;
}

afterEach(() => {
  el?.remove();
  el = undefined;
  document.body.innerHTML = '';
});

// --- shadow-only readers (T1-04: parts live in the shadow root) -------------

function shadow(node: EnhancedSelect, part: string): HTMLElement | null {
  return node.shadowRoot!.querySelector<HTMLElement>(`[part="${part}"]`);
}

function shadowAll(node: EnhancedSelect, part: string): HTMLElement[] {
  return Array.from(node.shadowRoot!.querySelectorAll<HTMLElement>(`[part="${part}"]`));
}

// ===========================================================================

describe('W1-P1.4 T1 — PART-001 button / PART-002 input / PART-003 listbox (structural defaults)', () => {
  it('PART-001: the input container carries part="button" and lives in the shadow root', () => {
    const node = mount();
    const button = shadow(node, 'button');
    expect(button, 'part="button" present').toBeTruthy();
    // T1-04 ownership: present in shadow DOM, absent as a light-DOM child of host.
    expect(node.shadowRoot!.contains(button!)).toBe(true);
    expect(node.querySelector('[part="button"]')).toBeNull();
  });

  it('PART-002: the text field carries part="input"', () => {
    const node = mount();
    const input = shadow(node, 'input') as HTMLInputElement | null;
    expect(input, 'part="input" present').toBeTruthy();
    expect(input!.tagName).toBe('INPUT');
    expect(node.shadowRoot!.contains(input!)).toBe(true);
    expect(node.querySelector('[part="input"]')).toBeNull();
  });

  it('PART-003: the popup carries part="listbox" and is distinct from the input', () => {
    const node = mount();
    const listbox = shadow(node, 'listbox');
    expect(listbox, 'part="listbox" present').toBeTruthy();
    expect(listbox).not.toBe(shadow(node, 'input'));
    expect(node.shadowRoot!.contains(listbox!)).toBe(true);
    expect(node.querySelector('[part="listbox"]')).toBeNull();
  });

  it('T1-04: none of the three structural parts are reachable from the host light DOM', () => {
    const node = mount();
    for (const part of ['button', 'input', 'listbox']) {
      expect(shadow(node, part), `part="${part}" in shadow`).toBeTruthy();
      expect(node.querySelector(`[part="${part}"]`), `part="${part}" NOT in light DOM`).toBeNull();
    }
    // The host exposes no light-DOM children beyond slotted content.
    expect(node.children.length).toBe(0);
  });
});

// ===========================================================================

describe('W1-P1.4 T1 — PART-007 option / PART-008 group-header', () => {
  it('PART-007: each rendered option carries part="option" when the popup is open', () => {
    const node = mount();
    node.open();
    const options = shadowAll(node, 'option');
    expect(options.length).toBe(FOUR.length);
    for (const opt of options) {
      expect(opt.getAttribute('part')).toBe('option');
      expect(node.shadowRoot!.contains(opt)).toBe(true);
      expect(node.querySelector('[part="option"]')).toBeNull();
    }
  });

  it('PART-008: grouped items render one part="group-header" per group (flat list renders none — T1-03)', () => {
    const node = mount();
    // Flat list first: no group headers.
    node.open();
    expect(shadowAll(node, 'group-header').length).toBe(0);

    node.setGroupedItems([
      { label: 'Fruit', options: [{ id: 'f1', value: 'f1', label: 'Apple' }, { id: 'f2', value: 'f2', label: 'Pear' }] },
      { label: 'Veg', options: [{ id: 'v1', value: 'v1', label: 'Kale' }] },
    ] as never);
    node.open();
    const headers = shadowAll(node, 'group-header');
    expect(headers.length).toBe(2);
    expect(headers.map((h) => h.textContent)).toEqual(['Fruit', 'Veg']);
    for (const h of headers) {
      expect(h.getAttribute('part')).toBe('group-header');
      expect(node.shadowRoot!.contains(h)).toBe(true);
      expect(node.querySelector('[part="group-header"]')).toBeNull();
    }
  });
});

// ===========================================================================

describe('W1-P1.4 T1 — PART-005 clear-button / PART-006 clear-icon', () => {
  it('PART-005/006: the clear button (with nested icon) carries its parts in the shadow root', () => {
    const node = mount({ clearControl: { enabled: true } });
    const button = shadow(node, 'clear-button');
    const icon = shadow(node, 'clear-icon');
    expect(button, 'part="clear-button" present').toBeTruthy();
    expect(icon, 'part="clear-icon" present').toBeTruthy();
    expect(button!.tagName).toBe('BUTTON');
    // icon is nested inside the clear button.
    expect(button!.contains(icon!)).toBe(true);
    // T1-04 ownership.
    expect(node.querySelector('[part="clear-button"]')).toBeNull();
    expect(node.querySelector('[part="clear-icon"]')).toBeNull();
  });

  it('PART-005/006: the clear button is structurally present (hidden) even when disabled — visibility is the observable contract', () => {
    // The clear control node is always created; `hidden`/`aria-hidden` reflect
    // whether it is actionable. With clearControl disabled it exists but is
    // hidden — an observable, negative-path fact.
    const node = mount();
    const button = shadow(node, 'clear-button');
    expect(button, 'part="clear-button" structurally present').toBeTruthy();
    expect(button!.hidden, 'hidden when clearControl disabled').toBe(true);
    expect(button!.getAttribute('aria-hidden')).toBe('true');
  });

  it('PART-005/006: enabling clearControl + a selection makes the clear button visible (negative path removed)', async () => {
    const node = mount({ clearControl: { enabled: true }, selection: { mode: 'multi' } });
    // Before any selection the control is hidden (hideWhenEmpty default true).
    expect(shadow(node, 'clear-button')!.hidden).toBe(true);
    await node.setSelectedValues(['a']);
    const button = shadow(node, 'clear-button')!;
    expect(button.hidden, 'visible once there is something to clear').toBe(false);
    expect(button.getAttribute('aria-hidden')).toBe('false');
  });
});

// ===========================================================================

describe('W1-P1.4 T1 — PART-009 chip family (multi-select badges)', () => {
  it('PART-009: a selected multi value renders chip + chip-label + chip-remove + chip-remove-icon', async () => {
    const node = mount({
      selection: { mode: 'multi', showRemoveButton: true },
      multiSelectDisplay: { mode: 'horizontal' },
    });
    // Public selection surface only (no private methods).
    await node.setSelectedValues(['a']);

    const chip = shadow(node, 'chip');
    expect(chip, 'part="chip" present after multi selection').toBeTruthy();
    expect(chip!.getAttribute('part')).toBe('chip');
    expect(chip!.querySelector('[part="chip-label"]'), 'chip-label').toBeTruthy();
    expect(chip!.querySelector('[part="chip-remove"]'), 'chip-remove').toBeTruthy();
    expect(chip!.querySelector('[part="chip-remove-icon"]'), 'chip-remove-icon').toBeTruthy();
    // T1-04 ownership: chip parts live in the shadow root, not host light DOM.
    for (const part of ['chip', 'chip-label', 'chip-remove', 'chip-remove-icon']) {
      expect(node.querySelector(`[part="${part}"]`), `${part} NOT in light DOM`).toBeNull();
    }
  });

  it('T1-03 (negative): a single-select never renders chip parts', async () => {
    const node = mount({ selection: { mode: 'single' } });
    await node.setSelectedValues(['a']);
    expect(shadow(node, 'chip')).toBeNull();
    expect(shadow(node, 'chip-label')).toBeNull();
  });

  it('PART-009: part="chip-exiting" is not lingering at rest (transient exit-animation token)', () => {
    // The chip-exiting token is applied transiently during the removal
    // animation. At rest no exiting chip exists — a stable observable fact that
    // would break if the token were ever left behind.
    const node = mount({
      selection: { mode: 'multi', showRemoveButton: true },
      multiSelectDisplay: { mode: 'horizontal' },
    });
    expect(shadowAll(node, 'chip-exiting').length).toBe(0);
  });
});

// ===========================================================================

describe('W1-P1.4 T1 — PART-010 no-results', () => {
  it('PART-010: an empty result set renders part="no-results"', () => {
    // Deterministic public trigger: mount with an empty item list.
    const node = document.createElement('enhanced-select') as EnhancedSelect;
    node.setItems([]);
    document.body.appendChild(node);
    el = node;

    const empty = shadow(node, 'no-results');
    expect(empty, 'part="no-results" present on empty result').toBeTruthy();
    expect(empty!.getAttribute('part')).toBe('no-results');
    expect(node.shadowRoot!.contains(empty!)).toBe(true);
    // T1-04 ownership.
    expect(node.querySelector('[part="no-results"]')).toBeNull();
  });

  it('T1-03 (negative): no-results is absent while a populated list renders', () => {
    const node = mount();
    node.open();
    expect(shadow(node, 'no-results')).toBeNull();
  });
});

// ===========================================================================

describe('W1-P1.4 T1 — PART-011 loading family (public busy via pending fetch)', () => {
  it('PART-011: an active busy state renders loading + loading-icon/loading-message/loading-content/loading-spinner', () => {
    // Public trigger: serverSide initial-selected fetch that never resolves keeps
    // the element genuinely busy (isBusy=true) WITHOUT private methods.
    const never = new Promise<unknown[]>(() => { /* pending forever */ });
    const node = document.createElement('enhanced-select') as EnhancedSelect;
    node.updateConfig({
      busyBucket: { enabled: true },
      serverSide: {
        enabled: true,
        initialSelectedValues: ['a'],
        fetchSelectedItems: () => never,
      },
    } as never);
    node.setItems(FOUR);
    document.body.appendChild(node);
    el = node;

    node.open();
    const loading = shadow(node, 'loading');
    expect(loading, 'part="loading" present while busy').toBeTruthy();
    expect(shadow(node, 'loading-icon'), 'loading-icon').toBeTruthy();
    expect(shadow(node, 'loading-message'), 'loading-message').toBeTruthy();
    expect(shadow(node, 'loading-content'), 'loading-content').toBeTruthy();
    expect(shadow(node, 'loading-spinner'), 'loading-spinner').toBeTruthy();
    for (const p of ['loading', 'loading-icon', 'loading-message', 'loading-content', 'loading-spinner']) {
      expect(node.querySelector(`[part="${p}"]`), `${p} NOT in light DOM`).toBeNull();
    }
  });

  it('T1-03 (negative): loading family is absent when the element is idle', () => {
    const node = mount({ busyBucket: { enabled: true } });
    node.open();
    for (const p of ['loading', 'loading-icon', 'loading-message', 'loading-content', 'loading-spinner']) {
      expect(shadow(node, p), `${p} absent when idle`).toBeNull();
    }
  });
});
