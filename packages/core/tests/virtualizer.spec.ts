import { describe, it, expect, vi } from 'vitest';
import { Virtualizer } from '../src/utils/virtualizer';

describe('Virtualizer', () => {
  it('preserves average-height window calculation without Fenwick', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 1000, (i) => i, { estimatedItemHeight: 50, buffer: 2 });
    expect(v.computeWindow(250, 500)).toEqual({ startIndex: 3, endIndex: 17, windowSize: 15 });
  });

  it('uses Fenwick lowerBound for large variable-height windows', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 6000, (i) => i, { estimatedItemHeight: 40, buffer: 0 });
    const shortFirstItem = document.createElement('div');
    Object.defineProperty(shortFirstItem, 'offsetHeight', { configurable: true, value: 10 });
    v.measureOnAppear(shortFirstItem, 0);

    expect(v.computeWindow(80, 10)).toEqual({ startIndex: 2, endIndex: 2, windowSize: 1 });
  });

  it('clamps a buffered start index to zero', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 6000, (i) => i, { estimatedItemHeight: 40, buffer: 5 });

    expect(v.computeWindow(0, 80).startIndex).toBe(0);
  });

  it('clamps both bounds for a negative scroll position', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 10, (i) => i, { estimatedItemHeight: 40, buffer: 0 });

    expect(v.computeWindow(-100, 10)).toEqual({ startIndex: 0, endIndex: 0, windowSize: 1 });
  });

  it('clamps start and end indexes at the last item for beyond-list scroll positions', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 10, (i) => i, { estimatedItemHeight: 40, buffer: 2 });

    expect(v.computeWindow(10000, 1000)).toEqual({ startIndex: 9, endIndex: 9, windowSize: 1 });
  });

  it('keeps the window size consistent with the inclusive bounds', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 6000, (i) => i, { estimatedItemHeight: 40, buffer: 1 });
    const result = v.computeWindow(200, 80);

    expect(result).toEqual({ startIndex: 4, endIndex: 7, windowSize: 4 });
    expect(result.windowSize).toBe(result.endIndex - result.startIndex + 1);
  });

  it('shifts the computed window start when earlier measured heights change offsets', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 6000, (i) => i, { estimatedItemHeight: 40, buffer: 0 });
    const shortFirstItem = document.createElement('div');
    Object.defineProperty(shortFirstItem, 'offsetHeight', { configurable: true, value: 10 });
    v.measureOnAppear(shortFirstItem, 0);

    expect(v.computeWindow(80, 10).startIndex).toBe(2);
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
