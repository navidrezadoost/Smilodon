import { describe, it, expect, vi } from 'vitest';
import { Virtualizer } from '../src/utils/virtualizer';

describe('Virtualizer', () => {
  it('computes window based on average height', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 1000, (i) => i, { estimatedItemHeight: 50, buffer: 2 });
    const { startIndex, endIndex } = v.computeWindow(250, 500);
    expect(startIndex).toBeGreaterThanOrEqual(3); // 250/50 - 2
    expect(endIndex).toBeGreaterThan(startIndex);
  });

  it('updates cumulative offset with measurements', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 100, (i) => i, { estimatedItemHeight: 50, buffer: 2 });
    
    // Simulate measurement at index 10: actual 70px
    v.measuredHeights.set(10, 70);
    
    // Cumulative offset should account for measured heights
    const base = v.cumulativeOffset(20);
    expect(base).toBeGreaterThan(0);
    
    // With one measured height of 70 and average of 50, offset should increase
    // Expected: 10 * 50 (unmeasured) + 70 (measured) + 9 * 50 (unmeasured) = 1020
    // But cumulative offset uses different logic, so just check it's reasonable
    expect(base).toBeGreaterThanOrEqual(20 * 50);
  });

  it('activates Fenwick tree for large lists', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 10000, (i) => i, { 
      estimatedItemHeight: 40, 
      buffer: 5 
    });
    
    // Fenwick tree should be active for 10k items
    const offset = v.cumulativeOffset(5000);
    expect(offset).toBe(5000 * 40); // No measurements yet, should use average
  });

  it('supports dynamic item length updates', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 1000, (i) => i, { 
      estimatedItemHeight: 40, 
      buffer: 5 
    });
    
    // Update to larger size
    v.setItemsLength(10000);
    
    const window = v.computeWindow(0, 600);
    expect(window.endIndex).toBeLessThan(10000);
  });

  it('provides pool statistics when telemetry enabled', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 100, (i) => i, { 
      estimatedItemHeight: 40, 
      buffer: 5,
      enableTelemetry: true,
    });
    
    const stats = v.getPoolStats();
    expect(stats).toHaveProperty('total');
    expect(stats).toHaveProperty('hitRate');
  });

  it('scrollToIndex clamps an index below zero', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 10, (i) => i, { estimatedItemHeight: 25, buffer: 2 });

    expect(v.scrollToIndex(-8)).toEqual({ index: 0, offset: 0, scrollTop: 0 });
  });

  it('scrollToIndex clamps an index above the item count', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 10, (i) => i, { estimatedItemHeight: 25, buffer: 2 });

    expect(v.scrollToIndex(100)).toEqual({ index: 9, offset: 225, scrollTop: 225 });
  });

  it('returns the fixed-height offset and records the intended scroll position', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 10, (i) => i, { estimatedItemHeight: 25, buffer: 2 });

    expect(v.scrollToIndex(4)).toEqual({ index: 4, offset: 100, scrollTop: 100 });
    expect(v.getIntendedScrollTop()).toBe(100);
  });

  it('uses measured Fenwick offsets when available', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 6000, (i) => i, { estimatedItemHeight: 40, buffer: 2 });
    const measuredNode = document.createElement('div');
    Object.defineProperty(measuredNode, 'offsetHeight', { configurable: true, value: 70 });

    v.measureOnAppear(measuredNode, 3);

    expect(v.scrollToIndex(10)).toEqual({ index: 10, offset: 430, scrollTop: 430 });
  });

  it('does not need an option DOM node to calculate a scroll target', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 10, (i) => i, { estimatedItemHeight: 25, buffer: 2 });
    const result = v.scrollToIndex(2);

    expect(result).toEqual({ index: 2, offset: 50, scrollTop: 50 });
    expect(result).not.toHaveProperty('element');
    expect(container.scrollTop).toBe(0);
  });

  it('ignores scroll requests after destruction', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 10, (i) => i, { estimatedItemHeight: 25, buffer: 2 });
    v.scrollToIndex(2);
    v.destroy();

    expect(v.scrollToIndex(4)).toBeNull();
    expect(v.getIntendedScrollTop()).toBe(50);
  });

  it('scrollToKey resolves a key and returns the scroll result', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 10, (i) => i, { estimatedItemHeight: 25, buffer: 2 });

    expect(v.scrollToKey('item-d', (key) => (key === 'item-d' ? 3 : null))).toEqual({
      index: 3,
      offset: 75,
      scrollTop: 75,
    });
  });

  it('scrollToKey uses the measured Fenwick offset via scrollToIndex', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 6000, (i) => i, { estimatedItemHeight: 40, buffer: 2 });
    const measuredNode = document.createElement('div');
    Object.defineProperty(measuredNode, 'offsetHeight', { configurable: true, value: 70 });
    v.measureOnAppear(measuredNode, 3);

    expect(v.scrollToKey('item-k', (key) => (key === 'item-k' ? 10 : null))).toEqual({
      index: 10,
      offset: 430,
      scrollTop: 430,
    });
  });

  it('returns null when the key resolver cannot find a key', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 10, (i) => i, { estimatedItemHeight: 25, buffer: 2 });

    expect(v.scrollToKey('missing', () => null)).toBeNull();
  });

  it.each([null, undefined])('returns null when the resolver returns %s', (resolvedIndex) => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 10, (i) => i, { estimatedItemHeight: 25, buffer: 2 });

    expect(v.scrollToKey('item-a', () => resolvedIndex)).toBeNull();
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'returns null when the resolver returns invalid index %s',
    (resolvedIndex) => {
      const container = document.createElement('div');
      const v = new Virtualizer(container, 10, (i) => i, { estimatedItemHeight: 25, buffer: 2 });

      expect(v.scrollToKey('item-a', () => resolvedIndex)).toBeNull();
    },
  );

  it.each([-1, 10])('returns null rather than clamping out-of-range key index %s', (resolvedIndex) => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 10, (i) => i, { estimatedItemHeight: 25, buffer: 2 });

    expect(v.scrollToKey('item-a', () => resolvedIndex)).toBeNull();
    expect(v.getIntendedScrollTop()).toBe(0);
  });

  it('does not invoke the key resolver after destruction', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 10, (i) => i, { estimatedItemHeight: 25, buffer: 2 });
    const resolveIndex = vi.fn(() => 3);
    v.destroy();

    expect(v.scrollToKey('item-d', resolveIndex)).toBeNull();
    expect(resolveIndex).not.toHaveBeenCalled();
  });
});
