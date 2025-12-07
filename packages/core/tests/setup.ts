/**
 * Test setup - runs before all tests
 */

// Polyfill for performance.now if missing
if (typeof performance === 'undefined') {
  (globalThis as Record<string, unknown>).performance = {
    now: () => Date.now(),
  };
}

// Polyfill for requestAnimationFrame
if (typeof requestAnimationFrame === 'undefined') {
  (globalThis as Record<string, unknown>).requestAnimationFrame = (cb: () => void) => {
    setTimeout(cb, 16);
    return 0;
  };
  (globalThis as Record<string, unknown>).cancelAnimationFrame = () => {};
}

// Polyfill for queueMicrotask
if (typeof queueMicrotask === 'undefined') {
  (globalThis as Record<string, unknown>).queueMicrotask = (cb: () => void) => {
    Promise.resolve().then(cb);
  };
}

// Polyfill for Worker (basic mock)
if (typeof Worker === 'undefined') {
  (globalThis as Record<string, unknown>).Worker = class Worker {
    onmessage: ((e: unknown) => void) | null = null;
    onerror: ((e: unknown) => void) | null = null;
    
    constructor(_url: string) {
      // Mock worker - will use fallback mode
    }
    
    postMessage(_data: unknown) {
      // No-op
    }
    
    terminate() {
      // No-op
    }
  };
}

// Polyfill for PerformanceObserver
if (typeof PerformanceObserver === 'undefined') {
  (globalThis as Record<string, unknown>).PerformanceObserver = class PerformanceObserver {
    constructor(_callback: unknown) {}
    observe(_options: unknown) {}
    disconnect() {}
  };
}

