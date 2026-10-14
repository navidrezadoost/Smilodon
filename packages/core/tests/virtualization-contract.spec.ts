import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  computeWindowKeys,
  createScrollToIndexIntent,
  createScrollToKeyIntent,
  getAriaActiveDescendantEligibility,
  getVirtualizationScopeViolations,
  isActiveKeyMounted,
  isSelectedKeyVisible,
  preserveSelectionAcrossWindow,
  resolveKeyIndex,
  type VirtualizationScope,
} from '../src/engine/virtualization';

function makeScope(overrides: Partial<VirtualizationScope<string>> = {}): VirtualizationScope<string> {
  return {
    dataKeys: ['a', 'b', 'c'],
    filteredKeys: ['a', 'b', 'c'],
    registeredKeys: ['a', 'b', 'c'],
    windowKeys: ['b', 'c'],
    mountedKeys: ['b'],
    selectedKeys: new Set(['a', 'b']),
    activeKey: 'a',
    ...overrides,
  };
}

describe('pure virtualization contract', () => {
  it('preserves selected keys through window eviction', () => {
    const selected = new Set(['a', 'b']);
    const preserved = preserveSelectionAcrossWindow(selected, ['c']);

    expect([...preserved]).toEqual(['a', 'b']);
    expect(preserved).not.toBe(selected);
  });

  it('preserves selected keys when their mounted targets are evicted', () => {
    const scope = makeScope({ mountedKeys: ['b'], windowKeys: ['b'] });

    expect(isSelectedKeyVisible(scope, 'a')).toBe(true);
    expect(preserveSelectionAcrossWindow(scope.selectedKeys, scope.mountedKeys)).toEqual(new Set(['a', 'b']));
  });

  it('keeps a registered active key valid outside the current window', () => {
    const scope = makeScope();

    expect(scope.registeredKeys).toContain(scope.activeKey);
    expect(scope.windowKeys).not.toContain(scope.activeKey);
    expect(scope.activeKey).toBe('a');
    expect(isActiveKeyMounted(scope)).toBe(false);
  });

  it('does not expose an active descendant for an unmounted active key', () => {
    expect(getAriaActiveDescendantEligibility(makeScope(), new Map([['a', 'option-a']]))).toEqual({
      available: false,
      key: 'a',
      optionId: null,
    });
  });

  it('exposes an active descendant after the active key is mounted with an ID', () => {
    const scope = makeScope({ windowKeys: ['a', 'b'], mountedKeys: ['a', 'b'] });

    expect(getAriaActiveDescendantEligibility(scope, new Map([['a', 'option-a']]))).toEqual({
      available: true,
      key: 'a',
      optionId: 'option-a',
    });
  });

  it('keeps window keys within the filtered key set', () => {
    const scope = makeScope({ filteredKeys: ['a', 'b'], windowKeys: ['a', 'c'] });

    expect(getVirtualizationScopeViolations(scope)).toContain('viewport-key-not-filtered');
    expect(computeWindowKeys(['a', 'b', 'c'], 1, 3)).toEqual(['b', 'c']);
  });

  it('requires mounted keys to be a subset of window keys', () => {
    const scope = makeScope({ mountedKeys: ['a'] });

    expect(getVirtualizationScopeViolations(scope)).toContain('mounted-key-not-in-viewport');
  });

  it('does not treat registered keys as mounted targets', () => {
    const scope = makeScope();

    expect(scope.registeredKeys).toContain('a');
    expect(scope.mountedKeys).not.toContain('a');
    expect(isActiveKeyMounted(scope)).toBe(false);
    expect(getAriaActiveDescendantEligibility(scope, new Map([['a', 'option-a']])).available).toBe(false);
  });

  it('resolves an index from the current key order after reorder', () => {
    expect(resolveKeyIndex(['b', 'a', 'c'], 'a')).toBe(1);
  });

  it('creates a key scroll intent without a DOM target', () => {
    expect(createScrollToKeyIntent('b')).toEqual({ type: 'SCROLL_TO_KEY', key: 'b' });
    expect(createScrollToKeyIntent('b')).not.toHaveProperty('element');
  });

  it('scopes index scroll intent to a data generation', () => {
    expect(createScrollToIndexIntent(12, 'generation-4')).toEqual({
      type: 'SCROLL_TO_INDEX',
      index: 12,
      dataGeneration: 'generation-4',
    });
  });

  it('keeps browser globals out of the virtualization engine module', () => {
    const source = readFileSync(resolve(process.cwd(), 'packages/core/src/engine/virtualization.ts'), 'utf8');
    expect(source).not.toMatch(/\b(document|window|HTMLElement|Element)\b/);
  });
});
