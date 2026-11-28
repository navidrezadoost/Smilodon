// @vitest-environment node
/**
 * W1-P2 Task 1 — framework independence of the pure selection engine.
 *
 * Runs in a GENUINE Node process (no `document`, no `window`, no `HTMLElement`).
 * This file is EXCLUDED from `vitest.config.ts` (which injects jsdom + the DOM
 * `setup.ts`) and is executed by `vitest.ssr.config.ts` instead.
 *
 * Purpose: prove that the engine modules that carry SELECTION AUTHORITY
 * (`selection-policy`, `select-machine`, `select-state`) import and operate
 * with NO dependency on browser globals. This is the concrete evidence for the
 * Task 1 boundary "do not introduce Angular, React, DOM, network or
 * browser-global dependencies into the pure engine".
 *
 * The engine is imported directly from its module paths (not the package
 * entry, which re-exports web components and throws at import under no-DOM —
 * that is the separate API-075 limitation). This isolates the PURE engine.
 */

import { describe, expect, it } from 'vitest';
import { applySelectionRequest, type SelectionConfig } from '../src/engine/selection-policy';
import { transition } from '../src/engine/select-machine';
import { createInitialSelectState } from '../src/engine/select-state';

function cfg(overrides: Partial<SelectionConfig> = {}): SelectionConfig {
  return {
    multiple: false,
    required: false,
    allowDeselect: false,
    disabledKeys: new Set(),
    maxSelections: 0,
    ...overrides,
  };
}

describe('pure selection engine — framework independence (no DOM)', () => {
  it('runs with no browser globals present', () => {
    expect(typeof document).toBe('undefined');
    expect(typeof window).toBe('undefined');
    expect(typeof HTMLElement).toBe('undefined');
  });

  it('applySelectionRequest is pure Set math with no DOM access', () => {
    const next = applySelectionRequest(
      new Set(['a']),
      { type: 'select', key: 'b', reason: 'programmatic' },
      cfg({ multiple: true, allowDeselect: true }),
    );
    expect([...next]).toEqual(['a', 'b']);
  });

  it('transition drives selection state with no DOM access', () => {
    const initial = createInitialSelectState<string>();
    const { state, effects } = transition(initial, {
      type: 'SELECT_KEY_REQUEST',
      key: 'x',
      reason: 'programmatic',
    });
    expect([...state.selectedKeys]).toEqual(['x']);
    expect(effects.map((e) => e.type)).toContain('SELECTION_CHANGED');
  });

  it('does not touch process.env browser shims or globals during selection', () => {
    // A full multi-select sequence must not require any browser global.
    let state = createInitialSelectState<string>();
    for (const key of ['a', 'b', 'c']) {
      state = transition(state, { type: 'SELECTION_CONFIG_CHANGED', multiple: true, allowDeselect: true }).state;
      state = transition(state, { type: 'TOGGLE_KEY_REQUEST', key, reason: 'programmatic' }).state;
    }
    expect([...state.selectedKeys]).toEqual(['a', 'b', 'c']);
  });
});
