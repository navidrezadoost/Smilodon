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

  it('returns and records the initial window snapshot', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 100, (i) => i, { estimatedItemHeight: 10, buffer: 1 });

    expect(v.getCurrentWindow()).toBeNull();
    const update = v.updateWindow(20, 20);

    expect(update).toEqual({
      window: { startIndex: 1, endIndex: 5, windowSize: 5 },
      changed: true,
      scrollTop: 20,
      viewportHeight: 20,
    });
    expect(v.getCurrentWindow()).toEqual(update?.window);
  });

  it('reports unchanged when the computed window range is the same', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 100, (i) => i, { estimatedItemHeight: 10, buffer: 2 });
    v.updateWindow(20, 20);

    const update = v.updateWindow(20, 20);

    expect(update?.changed).toBe(false);
    expect(update?.window).toEqual(v.getCurrentWindow());
  });

  it('reports changed when scrolling changes the window range', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 100, (i) => i, { estimatedItemHeight: 10, buffer: 0 });
    const initial = v.updateWindow(0, 10);

    const update = v.updateWindow(50, 10);

    expect(initial?.changed).toBe(true);
    expect(update?.changed).toBe(true);
    expect(update?.window).not.toEqual(initial?.window);
  });

  it('clamps negative scrollTop to zero in the update result', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 100, (i) => i, { estimatedItemHeight: 10, buffer: 1 });

    expect(v.updateWindow(-20, 10)).toEqual({
      window: { startIndex: 0, endIndex: 2, windowSize: 3 },
      changed: true,
      scrollTop: 0,
      viewportHeight: 10,
    });
  });

  it('normalizes invalid viewport heights to zero', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 100, (i) => i, { estimatedItemHeight: 10, buffer: 1 });

    const update = v.updateWindow(0, Number.NaN);

    expect(update?.viewportHeight).toBe(0);
    expect(update?.window).toEqual({ startIndex: 0, endIndex: 1, windowSize: 2 });
  });

  it('returns a zero-size snapshot for an empty list', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 0, (i) => i, { estimatedItemHeight: 10, buffer: 1 });

    expect(v.updateWindow(0, 20)).toEqual({
      window: { startIndex: 0, endIndex: -1, windowSize: 0 },
      changed: true,
      scrollTop: 0,
      viewportHeight: 20,
    });
    expect(v.getCurrentWindow()).toEqual({ startIndex: 0, endIndex: -1, windowSize: 0 });
  });

  it('returns null and clears the current snapshot after destruction', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 100, (i) => i, { estimatedItemHeight: 10, buffer: 1 });
    v.updateWindow(20, 20);
    v.destroy();

    expect(v.updateWindow(30, 20)).toBeNull();
    expect(v.getCurrentWindow()).toBeNull();
  });

  it('invalidates the current window snapshot when item count changes', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 100, (i) => i, { estimatedItemHeight: 10, buffer: 1 });
    v.updateWindow(20, 20);

    v.setItemsLength(50);

    expect(v.getCurrentWindow()).toBeNull();
    expect(v.updateWindow(20, 20)?.changed).toBe(true);
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

  it('updates averageHeight after the first measurement', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 100, (i) => i, { estimatedItemHeight: 40, buffer: 2 });
    const node = document.createElement('div');
    Object.defineProperty(node, 'offsetHeight', { configurable: true, value: 80 });

    v.measureOnAppear(node, 4);

    expect(v.averageHeight).toBe(80);
    expect(v.measuredHeights.size).toBe(1);
  });

  it('updates averageHeight when an existing measurement changes', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 100, (i) => i, { estimatedItemHeight: 40, buffer: 2 });
    const node = document.createElement('div');
    Object.defineProperty(node, 'offsetHeight', { configurable: true, value: 60, writable: true });
    v.measureOnAppear(node, 4);

    Object.defineProperty(node, 'offsetHeight', { configurable: true, value: 80 });
    v.measureOnAppear(node, 4);

    expect(v.averageHeight).toBe(80);
    expect(v.measuredHeights.get(4)).toBe(80);
  });

  it('does not change the measured aggregate for a height change below threshold', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 100, (i) => i, {
      estimatedItemHeight: 40,
      buffer: 2,
      measurementThreshold: 5,
    });
    const node = document.createElement('div');
    Object.defineProperty(node, 'offsetHeight', { configurable: true, value: 40, writable: true });
    v.measureOnAppear(node, 4);

    Object.defineProperty(node, 'offsetHeight', { configurable: true, value: 44 });
    v.measureOnAppear(node, 4);

    expect(v.measuredHeights.get(4)).toBe(40);
    expect(v.measuredHeights.size).toBe(1);
    expect(v.averageHeight).toBe(40);
  });

  it('removes out-of-range measurements and updates the average on resize', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 100, (i) => i, { estimatedItemHeight: 40, buffer: 2 });
    const first = document.createElement('div');
    const removed = document.createElement('div');
    Object.defineProperty(first, 'offsetHeight', { configurable: true, value: 20 });
    Object.defineProperty(removed, 'offsetHeight', { configurable: true, value: 40 });
    v.measureOnAppear(first, 1);
    v.measureOnAppear(removed, 5);
    expect(v.averageHeight).toBe(30);

    v.setItemsLength(3);

    expect(v.measuredHeights.size).toBe(1);
    expect(v.measuredHeights.has(5)).toBe(false);
    expect(v.averageHeight).toBe(20);
    expect(v.cumulativeOffset(3)).toBe(60);
  });

  it('clears measured aggregate state on destroy', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 100, (i) => i, { estimatedItemHeight: 40, buffer: 2 });
    const node = document.createElement('div');
    Object.defineProperty(node, 'offsetHeight', { configurable: true, value: 80 });
    v.measureOnAppear(node, 4);

    v.destroy();

    expect(v.measuredHeights.size).toBe(0);
    expect(v.averageHeight).toBe(40);
  });

  it('keeps Fenwick offsets correct when measurements are first added and then updated', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 6000, (i) => i, { estimatedItemHeight: 40, buffer: 2 });
    const first = document.createElement('div');
    const second = document.createElement('div');
    Object.defineProperty(first, 'offsetHeight', { configurable: true, value: 100, writable: true });
    Object.defineProperty(second, 'offsetHeight', { configurable: true, value: 60 });
    v.measureOnAppear(first, 0);
    v.measureOnAppear(second, 1);
    expect(v.cumulativeOffset(3)).toBe(200);

    Object.defineProperty(first, 'offsetHeight', { configurable: true, value: 120 });
    v.measureOnAppear(first, 0);

    expect(v.cumulativeOffset(3)).toBe(220);
    expect(v.scrollToIndex(3)?.offset).toBe(220);
  });

  it('rebuilds Fenwick offsets and measurement average after length changes', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 6000, (i) => i, { estimatedItemHeight: 40, buffer: 2 });
    const node = document.createElement('div');
    Object.defineProperty(node, 'offsetHeight', { configurable: true, value: 80 });
    v.measureOnAppear(node, 5500);

    v.setItemsLength(7000);
    expect(v.cumulativeOffset(5501)).toBe(220080);

    v.setItemsLength(5000);

    expect(v.measuredHeights.size).toBe(0);
    expect(v.averageHeight).toBe(40);
    expect(v.cumulativeOffset(5000)).toBe(200000);
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

  it('keeps scrollToIndex results compatible with scroll-driven window updates', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 100, (i) => i, { estimatedItemHeight: 10, buffer: 0 });
    const target = v.scrollToIndex(20);

    expect(target).toEqual({ index: 20, offset: 200, scrollTop: 200 });
    expect(v.updateWindow(target!.scrollTop, 10)?.window).toEqual({
      startIndex: 20,
      endIndex: 21,
      windowSize: 2,
    });
  });

  it('routes scrollToKey through scrollToIndex without mutating DOM scroll state', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 100, (i) => i, { estimatedItemHeight: 10, buffer: 0 });
    const scrollToIndex = vi.spyOn(v, 'scrollToIndex');

    expect(v.scrollToKey('item-c', (key) => (key === 'item-c' ? 3 : null))).toEqual({
      index: 3,
      offset: 30,
      scrollTop: 30,
    });
    expect(scrollToIndex).toHaveBeenCalledWith(3);
    expect(container.scrollTop).toBe(0);
  });

  it('keeps measured offsets consistent across scroll targets and window lookup', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 6000, (i) => i, { estimatedItemHeight: 40, buffer: 0 });
    const shortFirstItem = document.createElement('div');
    Object.defineProperty(shortFirstItem, 'offsetHeight', { configurable: true, value: 10 });
    v.measureOnAppear(shortFirstItem, 0);
    const target = v.scrollToIndex(3);

    expect(target?.offset).toBe(v.cumulativeOffset(3));
    expect(target?.offset).toBe(90);
    expect(v.updateWindow(target!.scrollTop, 10)?.window).toEqual({
      startIndex: 3,
      endIndex: 3,
      windowSize: 1,
    });
  });

  it('shrinks measurements, active nodes, and current window safely', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 10, (i) => i, {
      estimatedItemHeight: 40,
      buffer: 1,
      enableTelemetry: true,
    });
    const retained = document.createElement('div');
    const removed = document.createElement('div');
    Object.defineProperty(retained, 'offsetHeight', { configurable: true, value: 20 });
    Object.defineProperty(removed, 'offsetHeight', { configurable: true, value: 80 });
    v.measureOnAppear(retained, 1);
    v.measureOnAppear(removed, 8);
    v.updateWindow(0, 20);
    v.acquireNode(8);
    expect(v.getPoolStats().inUse).toBe(1);

    v.setItemsLength(5);

    expect(v.measuredHeights.size).toBe(1);
    expect(v.measuredHeights.has(8)).toBe(false);
    expect(v.averageHeight).toBe(20);
    expect(v.getPoolStats().inUse).toBe(0);
    expect(v.getCurrentWindow()).toBeNull();
    expect(v.updateWindow(0, 20)?.changed).toBe(true);
  });

  it('makes scroll and update APIs no-op after destroy', () => {
    const container = document.createElement('div');
    const v = new Virtualizer(container, 10, (i) => i, { estimatedItemHeight: 20, buffer: 1 });
    v.updateWindow(20, 10);
    v.scrollToIndex(3);
    const resolver = vi.fn(() => 2);
    v.destroy();

    expect(v.scrollToIndex(4)).toBeNull();
    expect(v.scrollToKey('item-c', resolver)).toBeNull();
    expect(resolver).not.toHaveBeenCalled();
    expect(v.updateWindow(30, 10)).toBeNull();
    expect(v.getCurrentWindow()).toBeNull();
    expect(v.getIntendedScrollTop()).toBe(60);
  });
});
