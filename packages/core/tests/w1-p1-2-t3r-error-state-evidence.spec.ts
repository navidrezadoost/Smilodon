/**
 * W1-P1.2-T3-R — bounded corrective evidence for Task 3 findings.
 *
 * Public-interface-only. Asserts observable error-state and accessibility
 * surfaces via shadowRoot (input aria-invalid, aria-describedby, and the
 * error-description element's textContent/id) — never _hasError/_errorMessage.
 * Also asserts exact mode-switch selection state. No production changes.
 *
 * Findings addressed: T3-F01 (setError/clearError observable state),
 * T3-F02 (exact autoMitigate=false resulting selection), T3-F03 (traceability
 * note — corrected in the matrix, not here).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

type Item = { id: string; value: string; label: string };

function mount(items: Item[]): EnhancedSelect {
  const el = document.createElement('enhanced-select') as EnhancedSelect;
  el.setItems(items);
  document.body.appendChild(el);
  return el;
}
const A_B: Item[] = [{ id: 'a', value: 'a', label: 'A' }, { id: 'b', value: 'b', label: 'B' }];

function input(el: EnhancedSelect): HTMLInputElement {
  return el.shadowRoot!.querySelector('[part="input"]') as HTMLInputElement;
}
function errorEl(el: EnhancedSelect): HTMLElement | null {
  return el.shadowRoot!.querySelector('div[id$="-error"]') as HTMLElement | null;
}

describe('W1-P1.2-T3-R F01 — setError()/clearError() observable error state', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  it('setError() sets aria-invalid, wires aria-describedby to the error element, and writes its text', () => {
    el = mount(A_B);
    expect(input(el).getAttribute('aria-invalid')).toBe('false');
    expect(input(el).getAttribute('aria-describedby')).toBeNull();

    el.setError('Boom');

    const ed = errorEl(el);
    expect(ed).not.toBeNull();
    expect(ed!.textContent).toBe('Boom');
    expect(input(el).getAttribute('aria-invalid')).toBe('true');
    expect(input(el).getAttribute('aria-describedby')).toContain(ed!.id);
  });

  it('clearError() removes aria-invalid, drops aria-describedby, and empties the error text', () => {
    el = mount(A_B);
    el.setError('Boom');
    el.clearError();

    expect(input(el).getAttribute('aria-invalid')).toBe('false');
    expect(input(el).getAttribute('aria-describedby')).toBeNull();
    expect(errorEl(el)!.textContent).toBe('');
  });

  it('setError() twice replaces the message; clearError() is idempotent', () => {
    el = mount(A_B);
    el.setError('first');
    el.setError('second');
    expect(errorEl(el)!.textContent).toBe('second');
    el.clearError();
    el.clearError();
    expect(input(el).getAttribute('aria-invalid')).toBe('false');
    expect(errorEl(el)!.textContent).toBe('');
  });
});

describe('W1-P1.2-T3-R F01 — validate()-driven error transitions', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  it('required-empty failure sets error presentation; a valid selection clears it', async () => {
    el = mount(A_B);
    el.setRequired(true);

    // Failure state.
    expect(el.validate()).toBe(false);
    expect(input(el).getAttribute('aria-invalid')).toBe('true');
    expect(errorEl(el)!.textContent).toBe('Selection is required');
    expect(input(el).getAttribute('aria-describedby')).toContain(errorEl(el)!.id);

    // Transition to success clears the previous error presentation.
    await el.setSelectedValues(['a']);
    expect(el.validate()).toBe(true);
    expect(input(el).getAttribute('aria-invalid')).toBe('false');
    expect(input(el).getAttribute('aria-describedby')).toBeNull();
    expect(errorEl(el)!.textContent).toBe('');
  });

  it('validate() success after a prior setError() clears that user error too', () => {
    el = mount(A_B);
    el.setError('manual error');
    expect(el.validate()).toBe(true); // not required -> true, and clears
    expect(input(el).getAttribute('aria-invalid')).toBe('false');
    expect(errorEl(el)!.textContent).toBe('');
  });
});

describe('W1-P1.2-T3-R F02 — exact mode-switch selection state', () => {
  let el: EnhancedSelect;
  afterEach(() => { el?.remove(); document.body.innerHTML = ''; });

  const THREE: Item[] = [
    { id: 'a', value: 'a', label: 'A' },
    { id: 'b', value: 'b', label: 'B' },
    { id: 'c', value: 'c', label: 'C' },
  ];

  it('mitigation ENABLED: multi [a,b] -> single clears to []', async () => {
    el = mount(THREE);
    el.updateConfig({ selection: { mode: 'multi' } });
    await el.setSelectedValues(['a', 'b']);
    expect(el.getSelectedValues()).toEqual(['a', 'b']);
    el.updateConfig({ selection: { mode: 'single' } });
    expect(el.getSelectedValues()).toEqual([]);
  });

  it('mitigation DISABLED: multi [a,b] -> single yields the exact resulting state', async () => {
    el = mount(THREE);
    el.updateConfig({
      selection: { mode: 'multi' },
      limitations: { autoMitigateRuntimeModeSwitch: false, policies: {} },
    });
    await el.setSelectedValues(['a', 'b']);
    const before = el.getSelectedValues();
    expect(before).toEqual(['a', 'b']);

    el.updateConfig({ selection: { mode: 'single' } });
    // Record the EXACT result (not a <= bound). With mitigation disabled the
    // switch itself does not call clear(); the engine still enforces single
    // cardinality, so exactly one eligible value survives (registry order).
    expect(el.getSelectedValues()).toEqual(['a']);
  });

  it('enabled and disabled paths are directly comparable from the same initial selection', async () => {
    const enabled = mount(THREE);
    enabled.updateConfig({ selection: { mode: 'multi' } });
    await enabled.setSelectedValues(['a', 'b']);
    enabled.updateConfig({ selection: { mode: 'single' } });
    const enabledAfter = enabled.getSelectedValues();
    enabled.remove();

    el = mount(THREE);
    el.updateConfig({
      selection: { mode: 'multi' },
      limitations: { autoMitigateRuntimeModeSwitch: false, policies: {} },
    });
    await el.setSelectedValues(['a', 'b']);
    el.updateConfig({ selection: { mode: 'single' } });
    const disabledAfter = el.getSelectedValues();

    expect(enabledAfter).toEqual([]);       // mitigated: cleared
    expect(disabledAfter).toEqual(['a']);   // not mitigated: engine-normalized
  });
});
