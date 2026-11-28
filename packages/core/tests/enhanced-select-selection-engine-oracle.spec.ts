/**
 * W1-P2 Task 1 — component-vs-engine selection parity (pure-engine oracle).
 *
 * The existing `enhanced-select-selection-parity.spec.ts` asserts that the
 * component's derived legacy projection (`_state.selectedIndices`) stays in
 * lockstep with the component's own engine (`_engine.state.selectedKeys`).
 * That proves *internal consistency* but not that the component's observable
 * selection matches the pure selection POLICY computed independently.
 *
 * This spec closes that gap: for each characterized selection path it
 *   (1) drives the component through its public surface (DOM interaction or
 *       public API), and
 *   (2) computes the expected selection independently with the pure engine
 *       (`applySelectionRequest`) as an ORACLE — starting from the pre-action
 *       selected key set and applying the same request the component should
 *       issue,
 * then asserts the component's engine `selectedKeys` EXACTLY equals the oracle.
 *
 * This is real component-vs-engine equivalence evidence, not an isolation test.
 * No browser-global behavior is assumed; the oracle is deterministic Set math.
 *
 * Paths covered here that were previously uncertified by parity:
 *   - maxSelections cap (multi)
 *   - allowDeselect toggle-off (single)
 *   - required guard on deselect (single)
 *   - replace that disables a selected key (replace normalizes away disabled keys)
 *   - detached selection (selected key absent from registry) survives replace
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { SelectKey } from '../src/engine/contracts';
import {
  applySelectionRequest,
  type SelectionConfig,
  type SelectionRequest,
} from '../src/engine/selection-policy';
import { EnhancedSelect } from '../src/components/enhanced-select';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

type TestItem = { id: string; value: string; label: string; disabled?: boolean };

const makeItems = (): TestItem[] => [
  { id: 'a', value: 'APL', label: 'Apple' },
  { id: 'b', value: 'BAN', label: 'Banana' },
  { id: 'c', value: 'CHR', label: 'Cherry' },
];

function engineSelectedKeys(select: EnhancedSelect): SelectKey[] {
  return [...(select as unknown as { _engine: { state: { selectedKeys: ReadonlySet<SelectKey> } } })
    ._engine.state.selectedKeys];
}

function clickOption(select: EnhancedSelect, index: number): void {
  const option = select.shadowRoot?.querySelector<HTMLElement>(`[data-index="${index}"]`);
  expect(option, `expected option at index ${index}`).toBeTruthy();
  option!.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

/** Build a pure-engine SelectionConfig matching the component's config. */
function cfg(overrides: Partial<SelectionConfig> = {}): SelectionConfig {
  return {
    multiple: false,
    required: false,
    allowDeselect: false,
    disabledKeys: new Set<SelectKey>(),
    maxSelections: 0,
    ...overrides,
  };
}

/** Run a sequence of requests through the pure engine to derive the expected set. */
function oracle(
  start: Iterable<SelectKey>,
  requests: readonly SelectionRequest[],
  config: SelectionConfig,
): SelectKey[] {
  let keys: ReadonlySet<SelectKey> = new Set(start);
  for (const req of requests) {
    keys = applySelectionRequest(keys, req, config);
  }
  return [...keys];
}

describe('EnhancedSelect selection — pure-engine oracle parity', () => {
  let select: EnhancedSelect;

  beforeEach(() => {
    select = document.createElement('enhanced-select') as EnhancedSelect;
    document.body.appendChild(select);
  });

  afterEach(() => {
    select.remove();
  });

  it('single select: component matches oracle of a select request', () => {
    select.setItems(makeItems());

    clickOption(select, 1);

    const expected = oracle([], [{ type: 'select', key: 'b', reason: 'pointer' }], cfg());
    expect(engineSelectedKeys(select)).toEqual(expected);
    expect(expected).toEqual(['b']);
  });

  it('multi toggle: component matches oracle of two toggles', () => {
    select.updateConfig({ selection: { mode: 'multi' } });
    select.setItems(makeItems());

    clickOption(select, 0);
    clickOption(select, 2);

    const expected = oracle(
      [],
      [
        { type: 'toggle', key: 'a', reason: 'pointer' },
        { type: 'toggle', key: 'c', reason: 'pointer' },
      ],
      cfg({ multiple: true, allowDeselect: true }),
    );
    expect(engineSelectedKeys(select)).toEqual(expected);
    expect(expected).toEqual(['a', 'c']);
  });

  it('multi toggle-off: component matches oracle toggle of the same key twice', () => {
    select.updateConfig({ selection: { mode: 'multi' } });
    select.setItems(makeItems());

    clickOption(select, 1);
    clickOption(select, 1);

    const expected = oracle(
      [],
      [
        { type: 'toggle', key: 'b', reason: 'pointer' },
        { type: 'toggle', key: 'b', reason: 'pointer' },
      ],
      cfg({ multiple: true, allowDeselect: true }),
    );
    expect(engineSelectedKeys(select)).toEqual(expected);
    expect(expected).toEqual([]);
  });

  it('maxSelections cap: component matches oracle that drops the over-cap key', () => {
    select.updateConfig({ selection: { mode: 'multi', maxSelections: 2 } });
    select.setItems(makeItems());

    clickOption(select, 0);
    clickOption(select, 1);
    clickOption(select, 2); // should be refused by the cap

    const expected = oracle(
      [],
      [
        { type: 'toggle', key: 'a', reason: 'pointer' },
        { type: 'toggle', key: 'b', reason: 'pointer' },
        { type: 'toggle', key: 'c', reason: 'pointer' },
      ],
      cfg({ multiple: true, allowDeselect: true, maxSelections: 2 }),
    );
    expect(engineSelectedKeys(select)).toEqual(expected);
    expect(expected).toEqual(['a', 'b']);
  });

  it('allowDeselect single: component matches oracle toggle-off', () => {
    select.updateConfig({ selection: { mode: 'single', allowDeselect: true } });
    select.setItems(makeItems());

    clickOption(select, 0);
    clickOption(select, 0);

    // Single mode with allowDeselect uses the toggle request; component issues TOGGLE.
    const expected = oracle(
      [],
      [
        { type: 'toggle', key: 'a', reason: 'pointer' },
        { type: 'toggle', key: 'a', reason: 'pointer' },
      ],
      cfg({ multiple: false, allowDeselect: true }),
    );
    expect(engineSelectedKeys(select)).toEqual(expected);
    expect(expected).toEqual([]);
  });

  it('required single: component matches oracle that refuses the last deselect', () => {
    select.updateConfig({ selection: { mode: 'single', allowDeselect: true } });
    select.setItems(makeItems());
    clickOption(select, 0);
    select.setRequired(true);

    clickOption(select, 0); // required: refused

    const expected = oracle(
      ['a'],
      [{ type: 'toggle', key: 'a', reason: 'pointer' }],
      cfg({ multiple: false, allowDeselect: true, required: true }),
    );
    expect(engineSelectedKeys(select)).toEqual(expected);
    expect(expected).toEqual(['a']);
  });

  it('replace that disables a selected key: component matches oracle (replace drops disabled)', () => {
    select.updateConfig({ selection: { mode: 'single', allowDeselect: true } });
    select.setItems(makeItems());
    clickOption(select, 0); // select 'a'

    // Replacing items so the selected key 'a' becomes disabled runs the selected
    // set through the engine's `replace` request. The engine policy normalizes
    // away disabled keys on replace (unlike `deselect`, which preserves them),
    // so the expected selection is empty.
    select.setItems([
      { id: 'a', value: 'APL', label: 'Apple', disabled: true },
      { id: 'b', value: 'BAN', label: 'Banana' },
      { id: 'c', value: 'CHR', label: 'Cherry' },
    ]);

    const expected = oracle(
      ['a'],
      [{ type: 'replace', keys: ['a'], reason: 'programmatic' }],
      cfg({ multiple: false, allowDeselect: true, disabledKeys: new Set<SelectKey>(['a']) }),
    );
    expect(expected).toEqual([]);
    expect(engineSelectedKeys(select)).toEqual(expected);
  });

  it('detached selection survives a programmatic replace (external-value-sync)', async () => {
    const remoteItem = { id: 'remote', value: 'REMOTE', label: 'Remote item' };
    select.updateConfig({
      serverSide: {
        enabled: true,
        fetchSelectedItems: async (values: unknown[]) => (values.includes('REMOTE') ? [remoteItem] : []),
      },
    });

    await select.setSelectedValues(['REMOTE']);

    // A detached key (not in the visible registry) is retained by the engine.
    const expected = oracle(
      [],
      [{ type: 'replace', keys: ['remote'], reason: 'external-value-sync' }],
      cfg(),
    );
    expect(engineSelectedKeys(select)).toEqual(expected);
    expect(expected).toEqual(['remote']);
  });
});
