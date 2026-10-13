import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  computeAccessibilityEffects,
  computeComboboxAccessibility,
  computeOptionAccessibility,
  deriveAccessibilityState,
} from '../src/engine/accessibility';
import { transition } from '../src/engine/select-machine';
import { createInitialSelectState } from '../src/engine/select-state';

describe('engine accessibility decisions', () => {
  it('derives expanded intent after the popup opens', () => {
    const initial = { ...createInitialSelectState(), lifecycle: 'connected' as const };
    const result = transition(initial, { type: 'OPEN_REQUEST' });

    expect(result.effects).toContainEqual({ type: 'POPUP_OPENED' });
    expect(computeComboboxAccessibility(deriveAccessibilityState(result.state)).expanded).toBe(true);
  });

  it('derives collapsed intent after the popup closes', () => {
    const initial = { ...createInitialSelectState(), lifecycle: 'connected' as const, popup: 'open' as const };
    const result = transition(initial, { type: 'CLOSE_REQUEST', reason: 'escape' });

    expect(result.effects).toContainEqual({ type: 'POPUP_CLOSED', reason: 'escape' });
    expect(computeComboboxAccessibility(deriveAccessibilityState(result.state)).expanded).toBe(false);
  });

  it('derives active identity from the transition activeKey', () => {
    const initial = {
      ...createInitialSelectState<string>(),
      registeredKeys: new Set(['item-a', 'item-b']),
    };
    const result = transition(initial, { type: 'ACTIVE_KEY_CHANGED', key: 'item-b', reason: 'keyboard' });

    expect(deriveAccessibilityState(result.state).activeKey).toBe('item-b');
  });

  it('derives selected identity from the transition selectedKeys', () => {
    const result = transition(createInitialSelectState<string>(), {
      type: 'SELECT_KEY_REQUEST', key: 'item-a', reason: 'pointer',
    });

    expect(deriveAccessibilityState(result.state).selectedKeys).toEqual(new Set(['item-a']));
  });

  it('includes disabled option identity after registration reconciliation', () => {
    const result = transition(createInitialSelectState<string>(), {
      type: 'ITEMS_REGISTERED', keys: ['item-a'], disabledKeys: ['item-a'],
    });

    expect(computeOptionAccessibility(deriveAccessibilityState(result.state), 'item-a'))
      .toMatchObject({ key: 'item-a', disabled: true });
  });

  it('derives required state from engine selection configuration', () => {
    const result = transition(createInitialSelectState<string>(), {
      type: 'SELECTION_CONFIG_CHANGED', required: true,
    });

    expect(computeComboboxAccessibility(deriveAccessibilityState(result.state)).required).toBe(true);
  });

  it('derives multiple state from engine selection configuration', () => {
    const result = transition(createInitialSelectState<string>(), {
      type: 'SELECTION_CONFIG_CHANGED', multiple: true,
    });

    expect(deriveAccessibilityState(result.state).multiple).toBe(true);
  });

  it('maps loading data status to busy intent', () => {
    const state = { ...createInitialSelectState(), dataStatus: 'loading' as const };
    expect(deriveAccessibilityState(state).busy).toBe(true);
  });

  it('emits keys in semantic effects without indexes or DOM targets', () => {
    const state = {
      ...createInitialSelectState<string>(),
      activeKey: 'item-a',
      selectedKeys: new Set(['item-b']),
      registeredKeys: new Set(['item-a', 'item-b']),
    };
    const effects = computeAccessibilityEffects(deriveAccessibilityState(state), {
      optionKeys: ['item-a', 'item-b'],
    });
    const options = effects.filter((effect) => effect.type === 'SYNC_OPTION_ARIA');

    expect(options).toMatchObject([
      { key: 'item-a', active: true, selected: false },
      { key: 'item-b', active: false, selected: true },
    ]);
    for (const effect of effects) {
      expect(effect).not.toHaveProperty('index');
      expect(effect).not.toHaveProperty('element');
      expect(effect).not.toHaveProperty('node');
    }
  });

  it('keeps focus intent as a semantic target without calling focus', () => {
    const effects = computeAccessibilityEffects(deriveAccessibilityState(createInitialSelectState()), {
      optionKeys: [],
      focusIntents: [{ target: 'active-option', reason: 'renderer-request' }],
    });

    expect(effects.find((effect) => effect.type === 'FOCUS_INTENT')).toEqual({
      type: 'FOCUS_INTENT', target: 'active-option', reason: 'renderer-request',
    });
  });

  it('keeps announcement intent as data without a live-region operation', () => {
    const effects = computeAccessibilityEffects(deriveAccessibilityState(createInitialSelectState()), {
      optionKeys: [],
      announcements: [{ politeness: 'assertive', message: 'Selection unavailable' }],
    });

    expect(effects.find((effect) => effect.type === 'ANNOUNCE')).toEqual({
      type: 'ANNOUNCE', politeness: 'assertive', message: 'Selection unavailable',
    });
  });

  it('keeps browser globals out of the engine accessibility module', () => {
    const source = readFileSync(resolve(process.cwd(), 'packages/core/src/engine/accessibility.ts'), 'utf8');
    expect(source).not.toMatch(/\b(document|window|HTMLElement)\b/);
  });
});
