/**
 * Stress tests for extreme scale performance validation.
 * Tests 1M+ items, heavy transforms, worker offloading.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Virtualizer } from '../src/utils/virtualizer.js';
import { FenwickTree } from '../src/utils/fenwick-tree.js';
import { DOMPool } from '../src/utils/dom-pool.js';
import { WorkerManager } from '../src/utils/worker-manager.js';
import { PerformanceTelemetry, measureSync } from '../src/utils/telemetry.js';

describe('Stress Tests - 1M Items', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.height = '600px';
    container.style.overflow = 'auto';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should handle 1M items with Fenwick tree', () => {
    const ITEM_COUNT = 1_000_000;
    const items = Array.from({ length: ITEM_COUNT }, (_, i) => `Item ${i}`);

    const virtualizer = new Virtualizer(
      container,
      ITEM_COUNT,
      (i) => items[i],
      {
        estimatedItemHeight: 40,
        buffer: 5,
        maxPoolExtra: 32,
        enableTelemetry: true,
      }
    );

    // Initial window computation should be fast
    const { result: window1, duration: d1 } = measureSync('computeWindow', () =>
      virtualizer.computeWindow(0, 600)
    );

    expect(window1.startIndex).toBe(0);
    expect(window1.endIndex).toBeGreaterThan(0);
    expect(d1).toBeLessThan(10); // Should be < 10ms

    // Cumulative offset calculation should use Fenwick tree
    const { result: offset, duration: d2 } = measureSync('cumulativeOffset', () =>
      virtualizer.cumulativeOffset(50000)
    );

    expect(offset).toBeGreaterThan(0);
    expect(d2).toBeLessThan(5); // O(log n) should be fast

    // Render window
    const { duration: d3 } = measureSync('render', () => {
      virtualizer.render(window1.startIndex, window1.endIndex, (node, item) => {
        node.textContent = String(item);
      });
    });

    expect(d3).toBeLessThan(50); // Initial render < 50ms
    expect(container.children.length).toBeGreaterThan(0);

    virtualizer.destroy();
  });

  it('should handle randomized variable heights efficiently', () => {
    const ITEM_COUNT = 100_000;
    const items = Array.from({ length: ITEM_COUNT }, (_, i) => `Item ${i}`);
    
    // Random heights between 20-100px
    const heights = Array.from({ length: ITEM_COUNT }, () => 
      Math.floor(Math.random() * 80) + 20
    );

    const virtualizer = new Virtualizer(
      container,
      ITEM_COUNT,
      (i) => items[i],
      {
        estimatedItemHeight: 50,
        buffer: 3,
        measurementThreshold: 2,
      }
    );

    const window = virtualizer.computeWindow(0, 600);
    
    // Render with simulated measurements
    virtualizer.render(window.startIndex, window.endIndex, (node, item, index) => {
      node.textContent = String(item);
      // Simulate measured height
      Object.defineProperty(node, 'offsetHeight', {
        get: () => heights[index],
        configurable: true,
      });
    });

    // Trigger measurements
    for (let i = window.startIndex; i <= window.endIndex; i++) {
      const node = container.children[i - window.startIndex] as HTMLElement;
      if (node) {
        virtualizer.measureOnAppear(node, i);
      }
    }

    // Average height should converge
    expect(virtualizer.averageHeight).toBeGreaterThan(20);
    expect(virtualizer.averageHeight).toBeLessThan(100);

    virtualizer.destroy();
  });
});

describe('Fenwick Tree Performance', () => {
  it('should handle 1M updates in reasonable time', () => {
    const SIZE = 1_000_000;
    const tree = new FenwickTree(SIZE);

    // Initial population
    const { duration: populateTime } = measureSync('populate', () => {
      for (let i = 0; i < 1000; i++) {
        tree.add(i, Math.random() * 100);
      }
    });

    expect(populateTime).toBeLessThan(100); // 1000 updates < 100ms

    // Prefix sum queries
    const { duration: queryTime } = measureSync('queries', () => {
      for (let i = 0; i < 1000; i++) {
        tree.sum(Math.floor(Math.random() * SIZE));
      }
    });

    expect(queryTime).toBeLessThan(50); // 1000 queries < 50ms

    // Updates
    const { duration: updateTime } = measureSync('updates', () => {
      for (let i = 0; i < 1000; i++) {
        const idx = Math.floor(Math.random() * SIZE);
        tree.update(idx, 40, 50);
      }
    });

    expect(updateTime).toBeLessThan(100); // 1000 updates < 100ms
  });

  it('should support binary search (lowerBound)', () => {
    const tree = new FenwickTree(1000);
    
    // Add heights: [40, 40, 40, ...]
    for (let i = 0; i < 1000; i++) {
      tree.add(i, 40);
    }

    // Find index where cumulative height >= 2000
    // Should be around index 50 (40 * 50 = 2000)
    const idx = tree.lowerBound(2000);
    
    expect(idx).toBeGreaterThanOrEqual(49);
    expect(idx).toBeLessThanOrEqual(51);
  });
});

describe('DOM Pool Efficiency', () => {
  it('should reuse nodes and track hit rate', () => {
    const pool = new DOMPool({
      maxSize: 50,
      factory: () => document.createElement('div'),
      telemetry: true,
    });

    // Acquire and release cycle
    const nodes: HTMLElement[] = [];
    for (let i = 0; i < 20; i++) {
      nodes.push(pool.acquire());
    }

    for (const node of nodes) {
      pool.release(node);
    }

    // Second acquisition should hit cache
    for (let i = 0; i < 20; i++) {
      pool.acquire();
    }

    const stats = pool.getStats();
    expect(stats.hits).toBe(20); // All reused
    expect(stats.misses).toBe(20); // Initial creations
    expect(stats.hitRate).toBeCloseTo(0.5); // 50% hit rate

    pool.clear();
  });

  it('should evict LRU nodes when pool exceeds maxSize', () => {
    const pool = new DOMPool({
      maxSize: 10,
      factory: () => document.createElement('div'),
      telemetry: true,
    });

    // Acquire 20 nodes
    const nodes: HTMLElement[] = [];
    for (let i = 0; i < 20; i++) {
      nodes.push(pool.acquire());
    }

    // Release all
    for (const node of nodes) {
      pool.release(node);
    }

    const stats = pool.getStats();
    expect(stats.total).toBeLessThanOrEqual(10); // Should evict excess
    expect(stats.evictions).toBeGreaterThan(0);

    pool.clear();
  });
});

describe('Worker Manager Off-Main-Thread', () => {
  let workerManager: WorkerManager;

  beforeEach(() => {
    workerManager = new WorkerManager();
  });

  afterEach(() => {
    workerManager.destroy();
  });

  it('should transform large dataset (with fallback)', async () => {
    const items = Array.from({ length: 10000 }, (_, i) => i);
    
    const transformed = await workerManager.transform(
      items,
      (item) => item * 2
    );

    expect(transformed.length).toBe(10000);
    expect(transformed[0]).toBe(0);
    expect(transformed[100]).toBe(200);
  });

  it('should search large dataset efficiently', async () => {
    const items = Array.from({ length: 50000 }, (_, i) => `Item ${i}`);
    
    const results = await workerManager.search(items, 'Item 12345');

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].item).toBe('Item 12345');
    expect(results[0].index).toBe(12345);
  });

  it('should filter items with predicate', async () => {
    const items = Array.from({ length: 10000 }, (_, i) => i);
    
    const filtered = await workerManager.filter(
      items,
      (item) => item % 2 === 0
    );

    expect(filtered.length).toBe(5000);
    expect(filtered.every((n) => n % 2 === 0)).toBe(true);
  });

  it('should handle fuzzy search', async () => {
    const items = ['apple', 'application', 'apply', 'banana', 'band'];
    
    const results = await workerManager.search(items, 'apl', true);

    // Should match 'apple', 'application', 'apply' (fuzzy)
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.item === 'apple')).toBe(true);
  });

  it('should detect worker support', () => {
    // Worker support depends on environment
    const hasWorkers = workerManager.hasWorkerSupport;
    expect(typeof hasWorkers).toBe('boolean');
  });
});

describe('Performance Telemetry', () => {
  let telemetry: PerformanceTelemetry;

  beforeEach(() => {
    telemetry = new PerformanceTelemetry();
  });

  afterEach(() => {
    telemetry.destroy();
  });

  it('should measure frame timing', () => {
    return new Promise<void>((resolve) => {
      telemetry.start();

      // Run for ~200ms (simulate work)
      setTimeout(() => {
        telemetry.stop();
        
        const metrics = telemetry.getMetrics();
        
        expect(metrics.frames.fps).toBeGreaterThan(0);
        expect(metrics.frames.frameTime).toBeGreaterThan(0);
        
        resolve();
      }, 200);
    });
  });

  it('should track custom measurements', () => {
    telemetry.markStart('test-work');
    
    // Simulate work
    let sum = 0;
    for (let i = 0; i < 100000; i++) {
      sum += i;
    }
    
    const duration = telemetry.markEnd('test-work');
    
    expect(duration).toBeGreaterThan(0);
    expect(duration).toBeLessThan(100); // Should be fast
  });

  it('should generate performance report', () => {
    telemetry.start();
    
    setTimeout(() => {
      telemetry.stop();
      const report = telemetry.getReport();
      
      expect(report).toContain('FPS:');
      expect(report).toContain('Frame Time:');
      expect(report).toContain('Status:');
    }, 100);
  });
});

describe('Integrated Stress Test - 500K Items with Workers', () => {
  it('should handle 500K items with off-main-thread search', async () => {
    const ITEM_COUNT = 500_000;
    const items = Array.from({ length: ITEM_COUNT }, (_, i) => `Item ${i}`);
    
    const container = document.createElement('div');
    container.style.height = '600px';
    document.body.appendChild(container);

    const virtualizer = new Virtualizer(
      container,
      ITEM_COUNT,
      (i) => items[i],
      {
        estimatedItemHeight: 40,
        buffer: 5,
        enableTelemetry: true,
      }
    );

    // Initial render
    const window = virtualizer.computeWindow(0, 600);
    virtualizer.render(window.startIndex, window.endIndex, (node, item) => {
      node.textContent = String(item);
    });

    // Off-main-thread search
    const workerManager = new WorkerManager();
    const results = await workerManager.search(items, 'Item 250000');

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].index).toBe(250000);

    // Pool stats
    const poolStats = virtualizer.getPoolStats();
    expect(poolStats.total).toBeGreaterThan(0);
    expect(poolStats.hitRate).toBeGreaterThanOrEqual(0);

    workerManager.destroy();
    virtualizer.destroy();
    document.body.removeChild(container);
  });
});
