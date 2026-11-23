import { describe, expect, it } from 'vitest';
import { resolveSelectedTargetKey } from '../src/utils/selected-target-resolver';

describe('resolveSelectedTargetKey', () => {
  const sourceKeys = ['a', 'b', 'c', 'd', 'e', 'f'];

  it('returns null when there are no selected keys', () => {
    expect(resolveSelectedTargetKey(sourceKeys, new Set(), 'first')).toBeNull();
    expect(resolveSelectedTargetKey(sourceKeys, new Set(), 'last')).toBeNull();
  });

  it('returns the only selected key for either target', () => {
    const selected = new Set(['d']);
    expect(resolveSelectedTargetKey(sourceKeys, selected, 'first')).toBe('d');
    expect(resolveSelectedTargetKey(sourceKeys, selected, 'last')).toBe('d');
  });

  it('uses the requested edge of the supplied display order, not selection insertion order', () => {
    const selectedInReverseClickOrder = new Set(['f', 'c']);
    expect(resolveSelectedTargetKey(sourceKeys, selectedInReverseClickOrder, 'first')).toBe('c');
    expect(resolveSelectedTargetKey(sourceKeys, selectedInReverseClickOrder, 'last')).toBe('f');

    const projected = ['c', 'f', 'a', 'b', 'd', 'e'];

    expect(resolveSelectedTargetKey(projected, selectedInReverseClickOrder, 'first')).toBe('c');
    expect(resolveSelectedTargetKey(projected, selectedInReverseClickOrder, 'last')).toBe('f');
  });

  it('ignores selected keys that are absent from the eligible projection', () => {
    const selected = new Set(['a', 'f']);
    const filtered = ['b', 'c', 'd'];

    expect(resolveSelectedTargetKey(filtered, selected, 'first')).toBeNull();
    expect(resolveSelectedTargetKey(filtered, selected, 'last')).toBeNull();
  });

  it('uses stable object identity without inspecting source positions', () => {
    const sourceA = { id: 'a' };
    const selectedC = { id: 'c' };
    const selectedF = { id: 'f' };
    const projected = [selectedC, selectedF, sourceA];

    expect(resolveSelectedTargetKey(projected, new Set([selectedF, selectedC]), 'first')).toBe(selectedC);
    expect(resolveSelectedTargetKey(projected, new Set([selectedF, selectedC]), 'last')).toBe(selectedF);
  });
});
