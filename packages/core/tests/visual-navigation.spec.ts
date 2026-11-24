import { describe, expect, it } from 'vitest';
import {
  createVisualNavigationModel,
  resolveVisualBoundary,
  resolveVisualMovement,
  resolveVisualRange,
} from '../src/utils/visual-navigation';

describe('visual navigation model', () => {
  const model = createVisualNavigationModel(['e', 'a', 'b', 'c', 'd'], (key) => key !== 'b');

  it('moves by eligible displayed positions across non-monotonic source identity', () => {
    expect(resolveVisualMovement(model, 'e', 1)).toBe('a');
    expect(resolveVisualMovement(model, 'a', 1)).toBe('c');
    expect(resolveVisualMovement(model, 'c', -1)).toBe('a');
    expect(resolveVisualMovement(model, null, 1)).toBe('e');
    expect(resolveVisualMovement(model, null, -1)).toBe('d');
  });

  it('resolves Home and End to the first and last eligible displayed key', () => {
    expect(resolveVisualBoundary(model, 'first')).toBe('e');
    expect(resolveVisualBoundary(model, 'last')).toBe('d');
  });

  it('returns ranges in visual order and excludes non-selectable displayed keys', () => {
    expect(resolveVisualRange(model, 'e', 'd')).toEqual(['e', 'a', 'c', 'd']);
    expect(resolveVisualRange(model, 'd', 'a')).toEqual(['a', 'c', 'd']);
    expect(resolveVisualRange(model, 'missing', 'a')).toEqual([]);
  });

  it('preserves original order when supplied with an original-order model', () => {
    const original = createVisualNavigationModel(['a', 'b', 'c'], () => true);
    expect(resolveVisualMovement(original, 'b', 1)).toBe('c');
    expect(resolveVisualRange(original, 'a', 'c')).toEqual(['a', 'b', 'c']);
  });
});
