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

// Polyfill for URL.createObjectURL (needed for Worker tests)
if (typeof URL !== 'undefined' && !URL.createObjectURL) {
  URL.createObjectURL = () => 'blob:mock';
  URL.revokeObjectURL = () => {};
}

// Polyfill for Worker (functional mock that processes messages)
if (typeof Worker === 'undefined') {
  (globalThis as Record<string, unknown>).Worker = class Worker {
    onmessage: ((e: MessageEvent) => void) | null = null;
    onerror: ((e: ErrorEvent) => void) | null = null;
    
    constructor(_url: string) {
      // Mock worker that processes messages synchronously
    }
    
    postMessage(data: any) {
      // Process message synchronously on main thread (simulate worker)
      if (this.onmessage) {
        try {
          const { id, type, payload } = data;
          let result: any;
          
          switch (type) {
            case 'transform': {
              const { items: tItems, transformer } = payload;
              const fn = new Function('item', 'index', `return (${transformer})(item, index)`);
              result = tItems.map((item: any, i: number) => fn(item, i));
              break;
            }
            case 'search': {
              const { items: sItems, query, fuzzy } = payload;
              const lowerQuery = query.toLowerCase();
              result = [];
              sItems.forEach((item: any, index: number) => {
                const itemStr = String(item).toLowerCase();
                if (fuzzy) {
                  let queryIndex = 0;
                  for (let i = 0; i < itemStr.length && queryIndex < lowerQuery.length; i++) {
                    if (itemStr[i] === lowerQuery[queryIndex]) queryIndex++;
                  }
                  if (queryIndex === lowerQuery.length) {
                    result.push({ item, index });
                  }
                } else {
                  if (itemStr.includes(lowerQuery)) {
                    result.push({ item, index });
                  }
                }
              });
              break;
            }
            case 'filter': {
              const { items: fItems, predicate } = payload;
              const filterFn = new Function('item', 'index', `return (${predicate})(item, index)`);
              result = fItems.filter((item: any, i: number) => filterFn(item, i));
              break;
            }
            case 'sort': {
              const { items: sortItems, comparator } = payload;
              const compareFn = new Function('a', 'b', `return (${comparator})(a, b)`) as (a: any, b: any) => number;
              result = [...sortItems].sort(compareFn);
              break;
            }
            default:
              throw new Error(`Unknown operation: ${type}`);
          }
          
          // Send response back immediately
          setTimeout(() => {
            this.onmessage?.({ data: { id, success: true, data: result } } as MessageEvent);
          }, 0);
        } catch (error) {
          setTimeout(() => {
            this.onmessage?.({ 
              data: { id: data.id, success: false, error: String(error) } 
            } as MessageEvent);
          }, 0);
        }
      }
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

// Import and register custom elements
// This ensures all web components are available in tests
import '../src/components/native-select';
import '../src/components/enhanced-select';
import '../src/components/select-option';

