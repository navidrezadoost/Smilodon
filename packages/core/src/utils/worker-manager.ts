/**
 * Web Worker protocol types for off-main-thread processing.
 * Supports heavy transforms, fuzzy search, and data processing.
 */

export interface WorkerRequest {
  id: string;
  type: 'transform' | 'search' | 'filter' | 'sort';
  payload: unknown;
}

export interface WorkerResponse<T = unknown> {
  id: string;
  success: boolean;
  data?: T;
  error?: string;
  duration?: number; // milliseconds
}

export interface TransformRequest {
  items: unknown[];
  transformer: string; // serialized function
}

export interface SearchRequest {
  items: unknown[];
  query: string;
  fuzzy?: boolean;
  maxResults?: number;
}

export interface FilterRequest {
  items: unknown[];
  predicate: string; // serialized function
}

export interface SortRequest {
  items: unknown[];
  comparator: string; // serialized function
}

/**
 * Worker manager for handling off-main-thread processing.
 * Automatically falls back if workers not available or blocked by COOP/COEP.
 */
export class WorkerManager {
  private worker: Worker | null = null;
  private pending = new Map<string, {
    resolve: (data: any) => void;
    reject: (error: Error) => void;
    timeout: number;
  }>();
  private supportsWorkers = false;
  private supportsSharedArrayBuffer = false;
  private nextId = 0;

  constructor() {
    this.detectFeatures();
    this.initWorker();
  }

  /**
   * Detect browser capabilities
   */
  private detectFeatures(): void {
    this.supportsWorkers = typeof Worker !== 'undefined';
    this.supportsSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
  }

  /**
   * Initialize worker (inline blob URL for simplicity)
   */
  private initWorker(): void {
    if (!this.supportsWorkers) return;

    try {
      const workerCode = this.generateWorkerCode();
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      
      this.worker = new Worker(url);
      this.worker.onmessage = this.handleMessage.bind(this);
      this.worker.onerror = this.handleError.bind(this);
      
      // Cleanup blob URL after worker loads
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('Worker initialization failed, falling back to main thread', err);
      this.worker = null;
    }
  }

  /**
   * Generate worker code as string
   */
  private generateWorkerCode(): string {
    return `
      // Worker code
      self.onmessage = function(e) {
        const start = performance.now();
        const { id, type, payload } = e.data;
        
        try {
          let result;
          
          switch (type) {
            case 'transform':
              result = handleTransform(payload);
              break;
            case 'search':
              result = handleSearch(payload);
              break;
            case 'filter':
              result = handleFilter(payload);
              break;
            case 'sort':
              result = handleSort(payload);
              break;
            default:
              throw new Error('Unknown operation: ' + type);
          }
          
          const duration = performance.now() - start;
          self.postMessage({
            id,
            success: true,
            data: result,
            duration,
          });
        } catch (error) {
          self.postMessage({
            id,
            success: false,
            error: error.message,
          });
        }
      };
      
      function handleTransform({ items, transformer }) {
        const fn = new Function('item', 'index', 'return (' + transformer + ')(item, index)');
        return items.map((item, i) => fn(item, i));
      }
      
      function handleSearch({ items, query, fuzzy, maxResults }) {
        const lowerQuery = query.toLowerCase();
        const results = [];
        
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const text = String(item).toLowerCase();
          
          if (fuzzy) {
            if (fuzzyMatch(text, lowerQuery)) {
              results.push({ item, index: i, score: fuzzyScore(text, lowerQuery) });
            }
          } else {
            if (text.includes(lowerQuery)) {
              results.push({ item, index: i });
            }
          }
          
          if (maxResults && results.length >= maxResults) break;
        }
        
        if (fuzzy) {
          results.sort((a, b) => b.score - a.score);
        }
        
        return results;
      }
      
      function handleFilter({ items, predicate }) {
        const fn = new Function('item', 'index', 'return (' + predicate + ')(item, index)');
        return items.filter((item, i) => fn(item, i));
      }
      
      function handleSort({ items, comparator }) {
        const fn = new Function('a', 'b', 'return (' + comparator + ')(a, b)');
        return [...items].sort(fn);
      }
      
      // Simple fuzzy matching (Levenshtein-inspired)
      function fuzzyMatch(text, query) {
        let qi = 0;
        for (let ti = 0; ti < text.length && qi < query.length; ti++) {
          if (text[ti] === query[qi]) qi++;
        }
        return qi === query.length;
      }
      
      function fuzzyScore(text, query) {
        let score = 0;
        let qi = 0;
        for (let ti = 0; ti < text.length && qi < query.length; ti++) {
          if (text[ti] === query[qi]) {
            score += 100 - ti; // Earlier matches score higher
            qi++;
          }
        }
        return score;
      }
    `;
  }

  /**
   * Handle worker message
   */
  private handleMessage(e: MessageEvent<WorkerResponse>): void {
    const { id, success, data, error } = e.data;
    const pending = this.pending.get(id);
    
    if (!pending) return;
    
    clearTimeout(pending.timeout);
    this.pending.delete(id);
    
    if (success) {
      pending.resolve(data);
    } else {
      pending.reject(new Error(error || 'Worker error'));
    }
  }

  /**
   * Handle worker error
   */
  private handleError(err: ErrorEvent): void {
    console.error('Worker error:', err);
    // Reject all pending requests
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Worker crashed'));
    }
    this.pending.clear();
  }

  /**
   * Execute operation (worker or fallback)
   */
  async execute<T = unknown>(
    type: WorkerRequest['type'],
    payload: unknown,
    timeout = 5000
  ): Promise<T> {
    // Fallback to main thread if no worker
    if (!this.worker) {
      return this.executeFallback<T>(type, payload);
    }

    const id = `req_${this.nextId++}`;
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('Worker timeout'));
      }, timeout) as unknown as number;

      this.pending.set(id, { resolve, reject, timeout: timeoutId });

      this.worker!.postMessage({ id, type, payload });
    });
  }

  /**
   * Fallback to main thread execution
   */
  private async executeFallback<T>(type: string, payload: any): Promise<T> {
    // Simple synchronous fallback implementations
    switch (type) {
      case 'transform': {
        const { items, transformer } = payload as TransformRequest;
        const fn = new Function('item', 'index', `return (${transformer})(item, index)`);
        return items.map((item, i) => fn(item, i)) as T;
      }
      case 'search': {
        const { items, query } = payload as SearchRequest;
        const lowerQuery = query.toLowerCase();
        return items.filter(item => 
          String(item).toLowerCase().includes(lowerQuery)
        ) as T;
      }
      case 'filter': {
        const { items, predicate } = payload as FilterRequest;
        const fn = new Function('item', 'index', `return (${predicate})(item, index)`);
        return items.filter((item, i) => fn(item, i)) as T;
      }
      case 'sort': {
        const { items, comparator } = payload as SortRequest;
        const fn = new Function('a', 'b', `return (${comparator})(a, b)`) as (a: any, b: any) => number;
        return [...items].sort(fn) as T;
      }
      default:
        throw new Error(`Unknown operation: ${type}`);
    }
  }

  /**
   * Transform items with custom function
   */
  async transform<T, R>(items: T[], transformer: (item: T, index: number) => R): Promise<R[]> {
    return this.execute<R[]>('transform', {
      items,
      transformer: transformer.toString(),
    });
  }

  /**
   * Search items with optional fuzzy matching
   */
  async search<T>(items: T[], query: string, fuzzy = false): Promise<{ item: T; index: number }[]> {
    return this.execute('search', { items, query, fuzzy });
  }

  /**
   * Filter items with predicate
   */
  async filter<T>(items: T[], predicate: (item: T, index: number) => boolean): Promise<T[]> {
    return this.execute<T[]>('filter', {
      items,
      predicate: predicate.toString(),
    });
  }

  /**
   * Sort items with comparator
   */
  async sort<T>(items: T[], comparator: (a: T, b: T) => number): Promise<T[]> {
    return this.execute<T[]>('sort', {
      items,
      comparator: comparator.toString(),
    });
  }

  /**
   * Check if workers are supported
   */
  get hasWorkerSupport(): boolean {
    return this.supportsWorkers && this.worker !== null;
  }

  /**
   * Check if SharedArrayBuffer is supported
   */
  get hasSharedArrayBuffer(): boolean {
    return this.supportsSharedArrayBuffer;
  }

  /**
   * Terminate worker
   */
  destroy(): void {
    if (this.worker) {
      // Reject all pending
      for (const [id, pending] of this.pending) {
        clearTimeout(pending.timeout);
        pending.reject(new Error('Worker terminated'));
      }
      this.pending.clear();
      
      this.worker.terminate();
      this.worker = null;
    }
  }
}

/**
 * Singleton instance
 */
let workerManager: WorkerManager | null = null;

export function getWorkerManager(): WorkerManager {
  if (!workerManager) {
    workerManager = new WorkerManager();
  }
  return workerManager;
}
