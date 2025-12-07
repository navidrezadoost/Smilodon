#!/usr/bin/env node
/**
 * Performance benchmark script for measuring TTI, scroll FPS, and memory.
 * Run with: node scripts/perf.js
 */

import { performance } from 'perf_hooks';

// Mock DOM for Node.js environment
function setupMockDOM() {
  global.document = {
    createElement: () => ({
      style: {},
      setAttribute: () => {},
      removeAttribute: () => {},
      appendChild: () => {},
      removeChild: () => {},
      replaceChild: () => {},
      cloneNode: () => ({}),
      children: [],
      offsetHeight: 40,
    }),
    createDocumentFragment: () => ({
      appendChild: () => {},
    }),
    body: {
      appendChild: () => {},
      removeChild: () => {},
    },
  };

  global.HTMLElement = class HTMLElement {
    constructor() {
      this.style = {};
      this.children = [];
      this.attributes = [];
      this.offsetHeight = 40;
    }
    setAttribute() {}
    removeAttribute() {}
    appendChild() {}
    removeChild() {}
    replaceChild() {}
    cloneNode() {
      return new HTMLElement();
    }
  };

  global.requestAnimationFrame = (cb) => {
    setTimeout(cb, 16);
    return 0;
  };

  global.cancelAnimationFrame = () => {};
  global.queueMicrotask = (cb) => Promise.resolve().then(cb);
}

async function benchmarkFenwickTree() {
  console.log('\n=== Fenwick Tree Benchmark ===');
  
  const { FenwickTree } = await import('../dist/index.js');
  
  const sizes = [10_000, 100_000, 1_000_000];
  
  for (const size of sizes) {
    const tree = new FenwickTree(size);
    
    // Benchmark add operations
    const addStart = performance.now();
    for (let i = 0; i < 1000; i++) {
      tree.add(Math.floor(Math.random() * size), Math.random() * 100);
    }
    const addTime = performance.now() - addStart;
    
    // Benchmark sum queries
    const sumStart = performance.now();
    for (let i = 0; i < 1000; i++) {
      tree.sum(Math.floor(Math.random() * size));
    }
    const sumTime = performance.now() - sumStart;
    
    // Benchmark updates
    const updateStart = performance.now();
    for (let i = 0; i < 1000; i++) {
      const idx = Math.floor(Math.random() * size);
      tree.update(idx, 40, 50);
    }
    const updateTime = performance.now() - updateStart;
    
    console.log(`\nSize: ${size.toLocaleString()}`);
    console.log(`  Add (1000 ops):    ${addTime.toFixed(2)}ms (${(addTime / 1000).toFixed(3)}ms/op)`);
    console.log(`  Sum (1000 ops):    ${sumTime.toFixed(2)}ms (${(sumTime / 1000).toFixed(3)}ms/op)`);
    console.log(`  Update (1000 ops): ${updateTime.toFixed(2)}ms (${(updateTime / 1000).toFixed(3)}ms/op)`);
    
    // Verify performance targets
    const avgOpTime = (addTime + sumTime + updateTime) / 3000;
    const status = avgOpTime < 0.01 ? '✓ PASS' : '✗ FAIL';
    console.log(`  Avg operation:     ${avgOpTime.toFixed(4)}ms ${status} (target < 0.01ms)`);
  }
}

async function benchmarkDOMPool() {
  console.log('\n=== DOM Pool Benchmark ===');
  
  setupMockDOM();
  const { DOMPool } = await import('../dist/index.js');
  
  const pool = new DOMPool({
    maxSize: 100,
    factory: () => new global.HTMLElement(),
    telemetry: true,
  });
  
  // Benchmark acquire/release cycles
  const cycles = [100, 1000, 10000];
  
  for (const count of cycles) {
    const start = performance.now();
    
    const nodes = [];
    for (let i = 0; i < count; i++) {
      nodes.push(pool.acquire());
    }
    
    for (const node of nodes) {
      pool.release(node);
    }
    
    const duration = performance.now() - start;
    const stats = pool.getStats();
    
    console.log(`\nCycles: ${count.toLocaleString()}`);
    console.log(`  Duration:  ${duration.toFixed(2)}ms (${(duration / count).toFixed(4)}ms/op)`);
    console.log(`  Hit rate:  ${(stats.hitRate * 100).toFixed(1)}%`);
    console.log(`  Pool size: ${stats.total}`);
    console.log(`  Evictions: ${stats.evictions}`);
    
    pool.resetTelemetry();
  }
  
  pool.clear();
}

async function benchmarkWorkerManager() {
  console.log('\n=== Worker Manager Benchmark ===');
  
  // Note: Workers may not work in Node.js without polyfills
  try {
    const { WorkerManager } = await import('../dist/index.js');
    const manager = new WorkerManager();
    
    console.log(`  Worker support: ${manager.hasWorkerSupport ? 'YES' : 'NO (fallback mode)'}`);
    console.log(`  SharedArrayBuffer: ${manager.hasSharedArrayBuffer ? 'YES' : 'NO'}`);
    
    // Benchmark transform
    const items = Array.from({ length: 50000 }, (_, i) => i);
    
    const transformStart = performance.now();
    await manager.transform(items, (item) => item * 2);
    const transformTime = performance.now() - transformStart;
    
    console.log(`\nTransform 50K items:`);
    console.log(`  Duration: ${transformTime.toFixed(2)}ms`);
    console.log(`  Status: ${transformTime < 100 ? '✓ PASS' : '✗ FAIL'} (target < 100ms)`);
    
    // Benchmark search
    const searchItems = Array.from({ length: 100000 }, (_, i) => `Item ${i}`);
    
    const searchStart = performance.now();
    const results = await manager.search(searchItems, 'Item 50000');
    const searchTime = performance.now() - searchStart;
    
    console.log(`\nSearch 100K items:`);
    console.log(`  Duration: ${searchTime.toFixed(2)}ms`);
    console.log(`  Results: ${results.length}`);
    console.log(`  Status: ${searchTime < 100 ? '✓ PASS' : '✗ FAIL'} (target < 100ms)`);
    
    manager.destroy();
  } catch (err) {
    console.log(`  Worker tests skipped (Node.js environment): ${err.message}`);
  }
}

async function benchmarkVirtualizer() {
  console.log('\n=== Virtualizer Benchmark ===');
  
  setupMockDOM();
  const { Virtualizer } = await import('../dist/index.js');
  
  const sizes = [10_000, 100_000, 1_000_000];
  
  for (const size of sizes) {
    const items = Array.from({ length: size }, (_, i) => `Item ${i}`);
    const container = new global.HTMLElement();
    
    const virtualizer = new Virtualizer(
      container,
      size,
      (i) => items[i],
      {
        estimatedItemHeight: 40,
        buffer: 5,
        enableTelemetry: true,
      }
    );
    
    // Benchmark window computation
    const windowStart = performance.now();
    const window = virtualizer.computeWindow(0, 600);
    const windowTime = performance.now() - windowStart;
    
    // Benchmark cumulative offset (tests Fenwick tree)
    const offsetStart = performance.now();
    const offset = virtualizer.cumulativeOffset(Math.floor(size / 2));
    const offsetTime = performance.now() - offsetStart;
    
    console.log(`\nSize: ${size.toLocaleString()}`);
    console.log(`  Window computation: ${windowTime.toFixed(3)}ms ${windowTime < 5 ? '✓' : '✗'}`);
    console.log(`  Cumulative offset:  ${offsetTime.toFixed(3)}ms ${offsetTime < 1 ? '✓' : '✗'}`);
    console.log(`  Window size: ${window.windowSize}`);
    console.log(`  Offset at 50%: ${offset.toFixed(0)}px`);
    
    virtualizer.destroy();
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   Smilodon Performance Benchmark Suite    ║');
  console.log('╚════════════════════════════════════════════╝');
  
  try {
    await benchmarkFenwickTree();
    await benchmarkDOMPool();
    await benchmarkVirtualizer();
    await benchmarkWorkerManager();
    
    console.log('\n' + '='.repeat(48));
    console.log('✓ Benchmark complete');
    console.log('='.repeat(48) + '\n');
  } catch (err) {
    console.error('\n✗ Benchmark failed:', err);
    process.exit(1);
  }
}

main();
