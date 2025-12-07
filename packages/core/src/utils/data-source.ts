export type Transformer<T = unknown> = (resp: unknown) => T[] | Promise<T[]>;

export interface RemoteConfig {
  endpoint: string;
  pageSize?: number;
  headers?: Record<string, string>;
  transformer?: Transformer;
  cacheTTL?: number; // ms
}

export interface FetchResult<T> {
  items: T[];
  fromCache: boolean;
}

export class TTLCache<T> {
  private store = new Map<string, { ts: number; ttl: number; items: T[] }>();
  constructor(private defaultTTL = 30000) {}
  get(key: string): T[] | null {
    const v = this.store.get(key);
    if (!v) return null;
    if (Date.now() - v.ts > v.ttl) return null;
    return v.items;
  }
  set(key: string, items: T[], ttl?: number) {
    this.store.set(key, { ts: Date.now(), ttl: ttl ?? this.defaultTTL, items });
  }
}

export class LocalSource<T = unknown> {
  private items: T[];
  constructor(items: T[]) {
    this.items = items;
  }
  search(query: string): T[] {
    if (!query) return this.items;
    const q = query.toLowerCase();
    return this.items.filter((x) => String(x).toLowerCase().includes(q));
  }
  fetchPage(query: string, page: number, pageSize = 50): Promise<FetchResult<T>> {
    const results = this.search(query);
    const start = page * pageSize;
    return Promise.resolve({ items: results.slice(start, start + pageSize), fromCache: false });
  }
}

export class RemoteSource<T = unknown> {
  private cfg: RemoteConfig;
  private cache: TTLCache<T>;
  private controller: AbortController | null = null;
  private pageMap = new Map<number, T[]>();

  constructor(cfg: RemoteConfig) {
    this.cfg = cfg;
    this.cache = new TTLCache<T>(cfg.cacheTTL ?? 30000);
  }

  private key(query: string, page: number) {
    return `${this.cfg.endpoint}|q=${query}|p=${page}|ps=${this.cfg.pageSize ?? ''}`;
  }

  async fetchPage(query: string, page: number): Promise<FetchResult<T>> {
    const pageSize = this.cfg.pageSize ?? 50;
    const k = this.key(query, page);
    const cached = this.cache.get(k);
    if (cached) {
      // stale-while-revalidate
      this.refresh(query, page).catch(() => void 0);
      return { items: cached, fromCache: true };
    }
    await this.refresh(query, page);
    const after = this.cache.get(k) ?? [];
    return { items: after, fromCache: false };
  }

  async refresh(query: string, page: number): Promise<void> {
    // cancel inflight
    this.controller?.abort();
    this.controller = new AbortController();
    const { signal } = this.controller;
    const pageSize = this.cfg.pageSize ?? 50;
    const url = new URL(this.cfg.endpoint, window.location.origin);
    url.searchParams.set('q', query);
    url.searchParams.set('page', String(page));
    url.searchParams.set('pageSize', String(pageSize));
    const resp = await fetch(url.toString(), { headers: this.cfg.headers, signal });
    const json = await resp.json();
    const transform = this.cfg.transformer ?? ((r: unknown) => (r as any).items ?? (r as any));
    const items = await transform(json);
    this.pageMap.set(page, items as T[]);
    this.cache.set(this.key(query, page), items as T[], this.cfg.cacheTTL);
  }

  getPage(page: number): T[] | null {
    return this.pageMap.get(page) ?? null;
  }
}

export function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let t: number | undefined;
  return (...args: Parameters<T>) => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), ms);
  };
}
