import { describe, expect, it } from 'vitest';
import type { SelectKey } from '../src/engine/contracts';
import type { SelectEvent } from '../src/engine/select-events';
import { transition } from '../src/engine/select-machine';
import { createInitialSelectState, type SelectState } from '../src/engine/select-state';
import {
  applySelectionRequest,
  type ActiveReason,
  type SelectionConfig,
  type SelectionReason,
  type SelectionRequest,
} from '../src/engine/selection-policy';
import {
  getActiveKey, getSelectedKeys, hasSelection, isRegisteredKey, isSelected,
} from '../src/engine/selectors';

function config(overrides: Partial<SelectionConfig> = {}): SelectionConfig {
  return {
    multiple: false,
    required: false,
    allowDeselect: false,
    disabledKeys: new Set<SelectKey>(),
    ...overrides,
  };
}

function state(overrides: Partial<SelectionConfig> = {}): SelectState {
  return {
    ...createInitialSelectState(),
    lifecycle: 'connected',
    registeredKeys: new Set(['a', 'b', 'c']),
    selection: config(overrides),
  };
}

const selectA = { type: 'SELECT_KEY_REQUEST', key: 'a', reason: 'programmatic' } as const;
const activeA = { type: 'ACTIVE_KEY_CHANGED', key: 'a', reason: 'keyboard' } as const;

describe('pure selection policy', () => {
  it('selects a single key and replaces it with another without mutating the previous set', () => {
    const empty = new Set<SelectKey>();
    const first = applySelectionRequest(empty, { type: 'select', key: 'a', reason: 'pointer' }, config());
    const second = applySelectionRequest(first, { type: 'select', key: 'b', reason: 'keyboard' }, config());

    expect(empty).toEqual(new Set());
    expect(first).toEqual(new Set(['a']));
    expect(second).toEqual(new Set(['b']));
  });

  it.each([false, true])('SELECT is idempotent with allowDeselect=%s', (allowDeselect) => {
    const selected = new Set<SelectKey>(['a']);
    expect(applySelectionRequest(selected, { type: 'select', key: 'a', reason: 'pointer' }, config({ allowDeselect })))
      .toBe(selected);
  });

  it('toggles multiple keys independently of allowDeselect', () => {
    const selection = config({ multiple: true, allowDeselect: false });
    let selected: ReadonlySet<SelectKey> = new Set();
    selected = applySelectionRequest(selected, { type: 'toggle', key: 'a', reason: 'pointer' }, selection);
    expect(selected).toEqual(new Set(['a']));
    selected = applySelectionRequest(selected, { type: 'toggle', key: 'b', reason: 'keyboard' }, selection);
    expect(selected).toEqual(new Set(['a', 'b']));
    selected = applySelectionRequest(selected, { type: 'toggle', key: 'a', reason: 'pointer' }, selection);
    expect(selected).toEqual(new Set(['b']));
  });

  it.each([false, true])('single TOGGLE obeys allowDeselect=%s', (allowDeselect) => {
    const selected = new Set<SelectKey>(['a']);
    const result = applySelectionRequest(selected, { type: 'toggle', key: 'a', reason: 'pointer' }, config({ allowDeselect }));
    expect(result).toEqual(new Set(allowDeselect ? [] : ['a']));
  });

  it('allows explicit deselect when single toggle deselection is disabled', () => {
    const result = applySelectionRequest(new Set(['a']), { type: 'deselect', key: 'a', reason: 'programmatic' }, config());
    expect(result.size).toBe(0);
  });

  it.each(['select', 'toggle', 'deselect'] as const)('ignores %s targeting a disabled key', (type) => {
    const selected = new Set<SelectKey>(type === 'deselect' ? ['a', 'b'] : ['b']);
    const result = applySelectionRequest(selected, { type, key: 'a', reason: 'pointer' }, config({
      multiple: true, disabledKeys: new Set(['a']),
    }));
    expect(result).toBe(selected);
  });

  it.each([
    { type: 'toggle', key: 'a', reason: 'pointer' },
    { type: 'deselect', key: 'a', reason: 'programmatic' },
    { type: 'clear', reason: 'form-reset' },
    { type: 'replace', keys: [], reason: 'external-value-sync' },
  ] satisfies SelectionRequest[])('required single preserves the last valid key for $type', (request) => {
    const selected = new Set<SelectKey>(['a']);
    expect(applySelectionRequest(selected, request, config({ required: true, allowDeselect: true }))).toBe(selected);
  });

  it('required multi permits removal until only one key remains', () => {
    const selection = config({ multiple: true, required: true });
    const first = applySelectionRequest(new Set(['a', 'b']), { type: 'toggle', key: 'a', reason: 'keyboard' }, selection);
    expect(first).toEqual(new Set(['b']));
    expect(applySelectionRequest(first, { type: 'toggle', key: 'b', reason: 'keyboard' }, selection)).toBe(first);
    expect(applySelectionRequest(first, { type: 'clear', reason: 'programmatic' }, selection)).toBe(first);
  });

  it.each([false, true])('clear empties optional selection with multiple=%s', (multiple) => {
    expect(applySelectionRequest(new Set(['a']), { type: 'clear', reason: 'form-reset' }, config({ multiple })).size).toBe(0);
  });

  it('required does not invent a key when selection starts empty', () => {
    const selected = new Set<SelectKey>();
    expect(applySelectionRequest(selected, { type: 'clear', reason: 'programmatic' }, config({ required: true }))).toBe(selected);
    expect(applySelectionRequest(selected, { type: 'replace', keys: [], reason: 'programmatic' }, config({ required: true }))).toBe(selected);
  });

  it.each([false, true])('replace filters disabled and duplicate keys with multiple=%s', (multiple) => {
    const selected = applySelectionRequest(new Set(['old']), {
      type: 'replace', keys: ['a', 'b', 'b', 'c'], reason: 'external-value-sync',
    }, config({ multiple, disabledKeys: new Set(['a']) }));
    expect([...selected]).toEqual(multiple ? ['b', 'c'] : ['b']);
  });

  it('required retains enabled old selection when a replacement has no eligible keys', () => {
    const selected = new Set<SelectKey>(['a']);
    expect(applySelectionRequest(selected, {
      type: 'replace', keys: ['b'], reason: 'external-value-sync',
    }, config({ required: true, disabledKeys: new Set(['b']) }))).toBe(selected);
  });

  it('required cannot retain newly disabled keys during reconciliation', () => {
    const selected = applySelectionRequest(new Set(['a']), {
      type: 'replace', keys: ['a'], reason: 'programmatic',
    }, config({ required: true, disabledKeys: new Set(['a']) }));
    expect(selected.size).toBe(0);
  });

  it('respects the existing multi-selection limit for select, toggle, and replace', () => {
    const selection = config({ multiple: true, maxSelections: 2 });
    const selected = new Set<SelectKey>(['a', 'b']);
    for (const type of ['select', 'toggle'] as const) {
      expect(applySelectionRequest(selected, { type, key: 'c', reason: 'pointer' }, selection)).toBe(selected);
    }
    expect([...applySelectionRequest(new Set<SelectKey>(), {
      type: 'replace', keys: ['c', 'c', 'b', 'a'], reason: 'programmatic',
    }, selection)]).toEqual(['c', 'b']);
    expect(applySelectionRequest(selected, { type: 'deselect', key: 'a', reason: 'pointer' }, selection)).toEqual(new Set(['b']));
  });

  it('preserves membership and insertion order for a no-op replacement', () => {
    const selected = new Set<SelectKey>(['a', 'b']);
    const result = applySelectionRequest(selected, {
      type: 'replace', keys: ['b', 'a', 'b'], reason: 'external-value-sync',
    }, config({ multiple: true }));
    expect(result).toBe(selected);
    expect([...result]).toEqual(['a', 'b']);
  });

  it('does not mutate the input keys, disabled set, or configuration', () => {
    const selected = new Set<SelectKey>(['a']);
    const disabledKeys = new Set<SelectKey>(['b']);
    const selection = Object.freeze(config({ multiple: true, disabledKeys }));
    const keys = Object.freeze(['b', 'c', 'c']);
    const request = Object.freeze({ type: 'replace' as const, keys, reason: 'programmatic' as const });
    expect(applySelectionRequest(selected, request, selection)).toEqual(new Set(['c']));
    expect(selected).toEqual(new Set(['a']));
    expect(disabledKeys).toEqual(new Set(['b']));
    expect(keys).toEqual(['b', 'c', 'c']);
    expect(selection.multiple).toBe(true);
  });
});

describe('engine selection events and effects', () => {
  it('selects and replaces a single key without changing active ownership', () => {
    const first = transition(state(), selectA).state;
    const result = transition(first, { type: 'SELECT_KEY_REQUEST', key: 'b', reason: 'pointer' });
    expect(first.selectedKeys).toEqual(new Set(['a']));
    expect(result.state.selectedKeys).toEqual(new Set(['b']));
    expect(result.state.activeKey).toBeNull();
    expect(result.effects).toEqual([
      { type: 'SELECTION_CHANGED', selectedKeys: ['b'], reason: 'pointer' },
      { type: 'SYNC_ARIA' },
    ]);
  });

  it('multi toggle adds and removes keys through engine events', () => {
    let current = state({ multiple: true });
    for (const [key, expected] of [['a', ['a']], ['b', ['a', 'b']], ['a', ['b']]] as const) {
      const result = transition(current, { type: 'TOGGLE_KEY_REQUEST', key, reason: 'keyboard' });
      expect([...result.state.selectedKeys]).toEqual(expected);
      expect(result.effects).toEqual([
        { type: 'SELECTION_CHANGED', selectedKeys: expected, reason: 'keyboard' },
        { type: 'SYNC_ARIA' },
      ]);
      current = result.state;
    }
  });

  it.each(['pointer', 'keyboard', 'programmatic', 'form-reset', 'external-value-sync'] satisfies SelectionReason[])(
    'preserves selection reason %s and emits only keys',
    (reason) => {
      const result = transition(state(), { ...selectA, reason });
      expect(result.effects).toEqual([
        { type: 'SELECTION_CHANGED', selectedKeys: ['a'], reason },
        { type: 'SYNC_ARIA' },
      ]);
    },
  );

  it.each([
    { type: 'DESELECT_KEY_REQUEST', key: 'a', reason: 'programmatic' },
    { type: 'CLEAR_SELECTION_REQUEST', reason: 'form-reset' },
    { type: 'REPLACE_SELECTION_REQUEST', keys: [], reason: 'external-value-sync' },
    { type: 'TOGGLE_KEY_REQUEST', key: 'a', reason: 'pointer' },
  ] satisfies SelectEvent[])('handles $type with a single change effect', (event) => {
    const current = transition(state({ allowDeselect: true }), selectA).state;
    const result = transition(current, event);
    expect(result.state.selectedKeys.size).toBe(0);
    expect(result.effects).toEqual([
      { type: 'SELECTION_CHANGED', selectedKeys: [], reason: event.reason },
      { type: 'SYNC_ARIA' },
    ]);
  });

  it.each([false, true])('does not emit duplicate SELECT effects with allowDeselect=%s', (allowDeselect) => {
    const current = transition(state({ allowDeselect }), selectA).state;
    for (let i = 0; i < 20; i += 1) {
      const result = transition(current, selectA);
      expect(result.state).toBe(current);
      expect(result.effects).toEqual([]);
    }
  });

  it.each([
    { type: 'SELECT_KEY_REQUEST', key: 'b', reason: 'pointer' },
    { type: 'TOGGLE_KEY_REQUEST', key: 'b', reason: 'keyboard' },
    { type: 'DESELECT_KEY_REQUEST', key: 'missing', reason: 'programmatic' },
    { type: 'TOGGLE_KEY_REQUEST', key: 'a', reason: 'pointer' },
  ] satisfies SelectEvent[])('emits nothing for ignored $type on $key', (event) => {
    const current = transition(state({ disabledKeys: new Set(['b']) }), selectA).state;
    const result = transition(current, event);
    expect(result.state).toBe(current);
    expect(result.effects).toEqual([]);
  });

  it.each([
    { type: 'TOGGLE_KEY_REQUEST', key: 'a', reason: 'keyboard' },
    { type: 'DESELECT_KEY_REQUEST', key: 'a', reason: 'programmatic' },
    { type: 'CLEAR_SELECTION_REQUEST', reason: 'form-reset' },
    { type: 'REPLACE_SELECTION_REQUEST', keys: [], reason: 'external-value-sync' },
  ] satisfies SelectEvent[])('required prevents $type from removing the last key', (event) => {
    const current = transition(state({ required: true, allowDeselect: true }), selectA).state;
    const result = transition(current, event);
    expect(result.state).toBe(current);
    expect(result.effects).toEqual([]);
  });

  it('filters disabled keys during replacement and suppresses equivalent replacement effects', () => {
    const initial = state({ multiple: true, disabledKeys: new Set(['b']) });
    const result = transition(initial, {
      type: 'REPLACE_SELECTION_REQUEST', keys: ['a', 'b', 'a', 'c'], reason: 'external-value-sync',
    });
    expect(result.state.selectedKeys).toEqual(new Set(['a', 'c']));
    expect(result.effects).toEqual([
      { type: 'SELECTION_CHANGED', selectedKeys: ['a', 'c'], reason: 'external-value-sync' },
      { type: 'SYNC_ARIA' },
    ]);
    const repeated = transition(result.state, {
      type: 'REPLACE_SELECTION_REQUEST', keys: ['c', 'a', 'b'], reason: 'external-value-sync',
    });
    expect(repeated.state).toBe(result.state);
    expect(repeated.effects).toEqual([]);
  });

  it('does not emit an effect for clearing an already empty selection', () => {
    const current = state();
    const result = transition(current, { type: 'CLEAR_SELECTION_REQUEST', reason: 'programmatic' });
    expect(result.state).toBe(current);
    expect(result.effects).toEqual([]);
  });

  it('preserves selection across registration reorder', () => {
    const current = transition(state(), { ...selectA, key: 'c' }).state;
    const result = transition(current, { type: 'ITEMS_REGISTERED', keys: ['c', 'a', 'b'] });
    expect(result.state.selectedKeys).toBe(current.selectedKeys);
    expect(getSelectedKeys(result.state)).toEqual(['c']);
    expect([...result.state.registeredKeys]).toEqual(['c', 'a', 'b']);
    expect(result.effects).toEqual([]);
  });

  it('preserves multi selection across filtering, empty registration, and restoration', () => {
    let current = transition(state({ multiple: true }), {
      type: 'REPLACE_SELECTION_REQUEST', keys: ['a', 'c'], reason: 'programmatic',
    }).state;
    const selected = current.selectedKeys;
    for (const keys of [['b'], [], ['c', 'b', 'a']]) {
      const result = transition(current, { type: 'ITEMS_REGISTERED', keys });
      expect(result.state.selectedKeys).toBe(selected);
      expect(getSelectedKeys(result.state)).toEqual(['a', 'c']);
      expect(result.effects).toEqual([]);
      current = result.state;
    }
  });

  it('accepts selection of an absent enabled key without requiring a visible item', () => {
    const result = transition(state(), { ...selectA, key: 'hidden' });
    expect(isSelected(result.state, 'hidden')).toBe(true);
    expect(isRegisteredKey(result.state, 'hidden')).toBe(false);
    expect(result.state.activeKey).toBeNull();
  });

  it('keeps numeric and string identities distinct, including zero', () => {
    const initial = transition(state({ multiple: true }), { type: 'ITEMS_REGISTERED', keys: [0, '0'] }).state;
    const result = transition(initial, { type: 'REPLACE_SELECTION_REQUEST', keys: [0, '0'], reason: 'programmatic' });
    expect(getSelectedKeys(result.state)).toEqual([0, '0']);
    expect(transition(result.state, { type: 'DESELECT_KEY_REQUEST', key: 0, reason: 'pointer' }).state.selectedKeys)
      .toEqual(new Set(['0']));
  });
});

describe('active key policy', () => {
  it.each(['keyboard', 'pointer', 'search', 'open', 'programmatic'] satisfies ActiveReason[])(
    'activates a registered enabled key with reason %s without selecting it',
    (reason) => {
      const result = transition(state(), { ...activeA, reason });
      expect(getActiveKey(result.state)).toBe('a');
      expect(hasSelection(result.state)).toBe(false);
      expect(result.effects).toEqual([
        { type: 'ACTIVE_KEY_CHANGED', activeKey: 'a', reason },
        { type: 'SYNC_ARIA' },
      ]);
    },
  );

  it.each(['b', 'absent'])('ignores disabled or unregistered active key %s', (key) => {
    const current = transition(state({ disabledKeys: new Set(['b']) }), activeA).state;
    const result = transition(current, { ...activeA, key });
    expect(result.state).toBe(current);
    expect(result.effects).toEqual([]);
    expect(getActiveKey(result.state)).toBe('a');
  });

  it('clears active identity explicitly and suppresses repeated active effects', () => {
    const current = transition(state(), activeA).state;
    expect(transition(current, activeA)).toEqual({ state: current, effects: [] });
    const clear = { type: 'ACTIVE_KEY_CHANGED', key: null, reason: 'search' } as const;
    const result = transition(current, clear);
    expect(result.state.activeKey).toBeNull();
    expect(result.effects).toEqual([
      { type: 'ACTIVE_KEY_CHANGED', activeKey: null, reason: 'search' },
      { type: 'SYNC_ARIA' },
    ]);
    expect(transition(result.state, clear).effects).toEqual([]);
  });

  it.each([['a', 'b', 'c'], ['c', 'a', 'b']])('keeps active identity on harmless re-registration %j', (...keys) => {
    const current = transition(state(), activeA).state;
    const result = transition(current, { type: 'ITEMS_REGISTERED', keys });
    expect(result.state.activeKey).toBe('a');
    expect(result.effects).toEqual([]);
  });

  it('clears absent active identity while preserving selection of that same key', () => {
    const selected = transition(state(), selectA).state;
    const current = transition(selected, activeA).state;
    const result = transition(current, { type: 'ITEMS_REGISTERED', keys: ['b', 'c'] });
    expect(getActiveKey(result.state)).toBeNull();
    expect(getSelectedKeys(result.state)).toEqual(['a']);
    expect(result.effects).toEqual([
      { type: 'ACTIVE_KEY_CHANGED', activeKey: null, reason: 'programmatic' },
      { type: 'SYNC_ARIA' },
    ]);
    const restored = transition(result.state, { type: 'ITEMS_REGISTERED', keys: ['a', 'b', 'c'] });
    expect(restored.state.activeKey).toBeNull();
    expect(restored.effects).toEqual([]);
  });

  it('clears active identity when the registry becomes empty', () => {
    const current = transition(state(), activeA).state;
    const result = transition(current, { type: 'ITEMS_REGISTERED', keys: [] });
    expect(result.state.activeKey).toBeNull();
    expect(result.effects).toHaveLength(2);
    expect(transition(result.state, { type: 'ITEMS_REGISTERED', keys: [] }).effects).toEqual([]);
  });

  it('accepts zero as an active key and distinguishes it from the string zero', () => {
    const initial = transition(state(), { type: 'ITEMS_REGISTERED', keys: [0, '0'] }).state;
    const first = transition(initial, { ...activeA, key: 0 });
    expect(first.state.activeKey).toBe(0);
    const result = transition(first.state, { ...activeA, key: '0' });
    expect(result.state.activeKey).toBe('0');
    expect(result.effects[0]).toEqual({ type: 'ACTIVE_KEY_CHANGED', activeKey: '0', reason: 'keyboard' });
  });

  it('uses Set key equality for NaN and signed zero when suppressing active effects', () => {
    for (const [first, repeated] of [[NaN, NaN], [0, -0], [-0, 0]]) {
      const initial = transition(state(), { type: 'ITEMS_REGISTERED', keys: [first] }).state;
      const current = transition(initial, { ...activeA, key: first }).state;
      expect(transition(current, { ...activeA, key: repeated }).effects).toEqual([]);
      expect(transition(current, { type: 'ITEMS_REGISTERED', keys: [repeated] }).effects).toEqual([]);
      expect(transition(current, { type: 'SELECTION_CONFIG_CHANGED', required: true }).effects).toEqual([]);
    }
  });
});

describe('configuration reconciliation and purity', () => {
  it.each([
    { type: 'ITEMS_REGISTERED', keys: ['a', 'b', 'c'], disabledKeys: ['a'] },
    { type: 'SELECTION_CONFIG_CHANGED', disabledKeys: ['a'] },
  ] satisfies SelectEvent[])('$type clears newly disabled selection and active identity even when required', (event) => {
    const selected = transition(state({ required: true }), selectA).state;
    const current = transition(selected, activeA).state;
    const result = transition(current, event);
    expect(result.state.selectedKeys.size).toBe(0);
    expect(result.state.activeKey).toBeNull();
    expect(result.state.selection.required).toBe(true);
    expect(result.effects).toEqual([
      { type: 'ACTIVE_KEY_CHANGED', activeKey: null, reason: 'programmatic' },
      { type: 'SELECTION_CHANGED', selectedKeys: [], reason: 'programmatic' },
      { type: 'SYNC_ARIA' },
    ]);
    expect(transition(result.state, event).effects).toEqual([]);
    expect(current.selectedKeys).toEqual(new Set(['a']));
    expect(current.activeKey).toBe('a');
  });

  it('removes only explicitly disabled keys and retains absent enabled selection', () => {
    const current = transition(state({ multiple: true, required: true }), {
      type: 'REPLACE_SELECTION_REQUEST', keys: ['a', 'c'], reason: 'programmatic',
    }).state;
    const result = transition(current, { type: 'ITEMS_REGISTERED', keys: ['b'], disabledKeys: ['a'] });
    expect(getSelectedKeys(result.state)).toEqual(['c']);
    expect(result.effects).toEqual([
      { type: 'SELECTION_CHANGED', selectedKeys: ['c'], reason: 'programmatic' },
      { type: 'SYNC_ARIA' },
    ]);
  });

  it('normalizes existing selection when the mode or maximum changes', () => {
    const current = transition(state({ multiple: true }), {
      type: 'REPLACE_SELECTION_REQUEST', keys: ['c', 'a', 'b'], reason: 'programmatic',
    }).state;
    const limited = transition(current, { type: 'SELECTION_CONFIG_CHANGED', maxSelections: 2 });
    expect(getSelectedKeys(limited.state)).toEqual(['c', 'a']);
    expect(limited.effects[0]).toEqual({ type: 'SELECTION_CHANGED', selectedKeys: ['c', 'a'], reason: 'programmatic' });
    const single = transition(limited.state, { type: 'SELECTION_CONFIG_CHANGED', multiple: false });
    expect(getSelectedKeys(single.state)).toEqual(['c']);
    expect(single.effects[0]).toEqual({ type: 'SELECTION_CHANGED', selectedKeys: ['c'], reason: 'programmatic' });
  });

  it('updates policy flags without emitting identity effects when membership is unchanged', () => {
    const current = transition(state(), selectA).state;
    const result = transition(current, { type: 'SELECTION_CONFIG_CHANGED', required: true, allowDeselect: true });
    expect(result.state.selection).toMatchObject({ required: true, allowDeselect: true });
    expect(result.state.selectedKeys).toBe(current.selectedKeys);
    expect(result.effects).toEqual([]);
    const optional = transition(result.state, { type: 'SELECTION_CONFIG_CHANGED', required: false });
    expect(optional.state.selection.required).toBe(false);
    expect(transition(optional.state, { type: 'TOGGLE_KEY_REQUEST', key: 'a', reason: 'pointer' }).state.selectedKeys.size).toBe(0);
  });

  it('treats registered disabled keys as a complete snapshot and config disabled keys as an optional patch', () => {
    const initial = state({ disabledKeys: new Set(['b']) });
    const patched = transition(initial, { type: 'SELECTION_CONFIG_CHANGED', required: true }).state;
    expect(patched.selection.disabledKeys).toEqual(new Set(['b']));
    const registered = transition(patched, { type: 'ITEMS_REGISTERED', keys: ['a', 'b'] }).state;
    expect(registered.selection.disabledKeys.size).toBe(0);
    expect(transition(registered, { ...selectA, key: 'b' }).state.selectedKeys).toEqual(new Set(['b']));
    const cleared = transition(initial, { type: 'SELECTION_CONFIG_CHANGED', disabledKeys: [] }).state;
    expect(cleared.selection.disabledKeys.size).toBe(0);
  });

  it('copies event arrays so later caller mutation cannot change engine state or effects', () => {
    const keys: SelectKey[] = ['a', 'b'];
    const disabledKeys: SelectKey[] = ['b'];
    const registered = transition(state({ multiple: true }), { type: 'ITEMS_REGISTERED', keys, disabledKeys });
    keys.push('c');
    disabledKeys.push('a');
    expect([...registered.state.registeredKeys]).toEqual(['a', 'b']);
    expect([...registered.state.selection.disabledKeys]).toEqual(['b']);

    const requested: SelectKey[] = ['a'];
    const result = transition(registered.state, { type: 'REPLACE_SELECTION_REQUEST', keys: requested, reason: 'programmatic' });
    requested.push('c');
    expect(getSelectedKeys(result.state)).toEqual(['a']);
    expect(result.effects[0]).toEqual({ type: 'SELECTION_CHANGED', selectedKeys: ['a'], reason: 'programmatic' });
  });

  it('exposes selection through selectors without leaking a mutable selected-key array', () => {
    const initial = state();
    expect(hasSelection(initial)).toBe(false);
    const selected = transition(initial, selectA).state;
    const current = Object.freeze(transition(selected, activeA).state);
    expect(hasSelection(current)).toBe(true);
    expect(isSelected(current, 'a')).toBe(true);
    expect(isSelected(current, 'b')).toBe(false);
    expect(isRegisteredKey(current, 'b')).toBe(true);
    expect(isRegisteredKey(current, 'missing')).toBe(false);
    expect(getActiveKey(current)).toBe('a');
    const keys = getSelectedKeys(current);
    keys.push('mutated');
    expect(getSelectedKeys(current)).toEqual(['a']);

    const result = transition(current, { ...selectA, key: 'b' });
    expect(current.selectedKeys).toEqual(new Set(['a']));
    expect(result.state.selectedKeys).toEqual(new Set(['b']));
    expect(initial.selectedKeys.size).toBe(0);
    expect(createInitialSelectState().selectedKeys.size).toBe(0);
  });
});
