import { afterEach, describe, expect, it, vi } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select.js';
import { CustomOptionPool } from '../src/utils/custom-option-pool.js';
import { DOMPool } from '../src/utils/dom-pool.js';
import { OptionRenderer } from '../src/utils/option-renderer.js';
import { TTLCache } from '../src/utils/data-source.js';
import { PerformanceTelemetry } from '../src/utils/telemetry.js';
import { Virtualizer } from '../src/utils/virtualizer.js';
import type { CustomOptionContract } from '../src/types/custom-option.js';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

const flushAsync = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('memory lifecycle invariants', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
    document.head.querySelectorAll('[data-memory-lifecycle-test]').forEach((node) => node.remove());
  });

  it('ignores stale server-side selected-item responses', async () => {
    const select = document.createElement('enhanced-select') as EnhancedSelect;
    document.body.appendChild(select);

    const pending = new Map<string, (items: unknown[]) => void>();
    select.updateConfig({
      serverSide: {
        enabled: true,
        fetchSelectedItems: (values) => new Promise((resolve) => {
          pending.set(String(values[0]), resolve);
        }),
        getValueFromItem: (item) => (item as any).value,
        getLabelFromItem: (item) => (item as any).label,
      },
    });

    const first = select.setSelectedValues(['a']);
    const second = select.setSelectedValues(['b']);

    pending.get('b')?.([{ value: 'b', label: 'B' }]);
    await second;
    expect(select.getSelectedValues()).toEqual(['b']);

    pending.get('a')?.([{ value: 'a', label: 'A' }]);
    await first;
    expect(select.getSelectedValues()).toEqual(['b']);
  });

  it('ignores server-side selected-item responses after disconnect', async () => {
    const select = document.createElement('enhanced-select') as EnhancedSelect;
    document.body.appendChild(select);

    let resolveFetch!: (items: unknown[]) => void;
    select.updateConfig({
      serverSide: {
        enabled: true,
        fetchSelectedItems: () => new Promise((resolve) => {
          resolveFetch = resolve;
        }),
      },
    });

    const request = select.setSelectedValues(['late']);
    select.remove();
    resolveFetch([{ value: 'late', label: 'Late' }]);
    await request;

    expect(select.getSelectedValues()).toEqual([]);
  });

  it('rolls back failed custom-option mounts without poisoning the pool', () => {
    const pool = new CustomOptionPool(5);
    let unmounted = 0;

    const badFactory = (): CustomOptionContract => ({
      mountOption: () => {
        throw new Error('boom');
      },
      unmountOption: () => {
        unmounted += 1;
      },
      updateSelected: () => undefined,
      getElement: () => document.createElement('div'),
    });

    for (let index = 0; index < 100; index += 1) {
      expect(() => pool.acquire(
        badFactory,
        { value: index },
        index,
        {
          item: { value: index },
          index,
          value: index,
          label: String(index),
          isSelected: false,
          isFocused: false,
          isDisabled: false,
          onSelect: () => undefined,
        },
        document.createElement('div')
      )).toThrow('boom');
    }

    expect(pool.getStats()).toEqual({
      totalPooled: 0,
      activeComponents: 0,
      availableComponents: 0,
    });
    expect(unmounted).toBe(100);

    const goodFactory = (): CustomOptionContract => ({
      mountOption: () => undefined,
      unmountOption: () => undefined,
      updateSelected: () => undefined,
      getElement: () => document.createElement('div'),
    });
    pool.acquire(
      goodFactory,
      { value: 'ok' },
      0,
      {
        item: { value: 'ok' },
        index: 0,
        value: 'ok',
        label: 'ok',
        isSelected: false,
        isFocused: false,
        isDisabled: false,
        onSelect: () => undefined,
      },
      document.createElement('div')
    );
    expect(pool.getStats().activeComponents).toBe(1);
  });

  it('balances custom option mounts and unmounts across replacement paths', () => {
    let mounted = 0;
    let unmounted = 0;

    const factory = (): CustomOptionContract => ({
      mountOption: () => {
        mounted += 1;
      },
      unmountOption: () => {
        unmounted += 1;
      },
      updateSelected: () => undefined,
      getElement: () => document.createElement('div'),
    });

    const renderer = new OptionRenderer({
      enableRecycling: true,
      maxPoolSize: 5,
      getValue: (item) => (item as any).value,
      getLabel: (item) => (item as any).label,
      onSelect: () => undefined,
    });

    const item = { value: 'a', label: 'A', optionComponent: factory };
    renderer.render(item, 0, false, false, 'select-a');
    renderer.render(item, 0, true, false, 'select-a');
    renderer.unmountAll();

    expect(mounted).toBe(2);
    expect(unmounted).toBe(2);

    renderer.render(item, 0, false, false, 'select-a');
    renderer.unmount(0);
    renderer.unmountAll();
    expect(mounted).toBe(unmounted);
  });

  it('shrinks DOMPool retained capacity after active overflow is released', () => {
    const pool = new DOMPool({
      maxSize: 10,
      factory: () => document.createElement('div'),
    });

    const nodes = Array.from({ length: 10 }, () => pool.acquire());
    pool.setMaxSize(3);
    expect(pool.getStats().inUse).toBe(10);

    nodes.forEach((node) => pool.release(node));
    expect(pool.getStats().total).toBeLessThanOrEqual(3);
    expect(pool.getStats().available).toBeLessThanOrEqual(3);
  });

  it('disconnects telemetry observer while stopped and supports restart', () => {
    const originalObserver = globalThis.PerformanceObserver;
    const instances: Array<{ callback: PerformanceObserverCallback; disconnected: boolean }> = [];

    class FakePerformanceObserver {
      callback: PerformanceObserverCallback;
      disconnected = false;

      constructor(callback: PerformanceObserverCallback) {
        this.callback = callback;
        instances.push(this);
      }

      observe() {
        return undefined;
      }

      disconnect() {
        this.disconnected = true;
      }
    }

    vi.stubGlobal('PerformanceObserver', FakePerformanceObserver);

    const telemetry = new PerformanceTelemetry();
    telemetry.start();
    instances[0].callback({ getEntries: () => [{ entryType: 'measure', duration: 10 } as PerformanceEntry] } as PerformanceObserverEntryList, instances[0] as unknown as PerformanceObserver);
    expect(telemetry.getMetrics().mainThreadWork).toBe(10);

    telemetry.stop();
    expect(instances[0].disconnected).toBe(true);
    instances[0].callback({ getEntries: () => [{ entryType: 'measure', duration: 100 } as PerformanceEntry] } as PerformanceObserverEntryList, instances[0] as unknown as PerformanceObserver);
    expect(telemetry.getMetrics().mainThreadWork).toBe(10);

    telemetry.start();
    instances[1].callback({ getEntries: () => [{ entryType: 'measure', duration: 20 } as PerformanceEntry] } as PerformanceObserverEntryList, instances[1] as unknown as PerformanceObserver);
    telemetry.stop();
    expect(telemetry.getMetrics().mainThreadWork).toBe(20);
    expect(instances).toHaveLength(2);

    telemetry.destroy();
    if (originalObserver) {
      vi.stubGlobal('PerformanceObserver', originalObserver);
    }
  });

  it('clears user timing entries after telemetry measurements', () => {
    const telemetry = new PerformanceTelemetry();

    for (let index = 0; index < 100; index += 1) {
      const label = `memory-lifecycle-${index}`;
      telemetry.markStart(label);
      telemetry.markEnd(label);
    }

    expect(performance.getEntriesByType('measure').filter((entry) => entry.name.startsWith('memory-lifecycle-'))).toHaveLength(0);
    telemetry.destroy();
  });

  it('retries failed mirrored stylesheet fetches and evicts least-recently-used entries', async () => {
    const firstHref = 'https://example.test/memory-lifecycle-first.css';
    const firstLink = document.createElement('link');
    firstLink.rel = 'stylesheet';
    firstLink.href = firstHref;
    firstLink.setAttribute('data-memory-lifecycle-test', '');
    document.head.appendChild(firstLink);

    const fetchMock = vi.fn(async (url: string) => {
      if (String(url) === firstLink.href && fetchMock.mock.calls.filter(([calledUrl]) => String(calledUrl) === firstLink.href).length === 1) {
        throw new Error('temporary failure');
      }
      return {
        ok: true,
        text: async () => '.memory-lifecycle { color: red; }',
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    const failed = document.createElement('enhanced-select') as EnhancedSelect;
    document.body.appendChild(failed);
    failed.classMap = { selected: 'memory-lifecycle' };
    await flushAsync();

    const retried = document.createElement('enhanced-select') as EnhancedSelect;
    document.body.appendChild(retried);
    retried.classMap = { selected: 'memory-lifecycle' };
    await flushAsync();

    expect(fetchMock.mock.calls.filter(([url]) => String(url) === firstLink.href)).toHaveLength(2);

    for (let index = 0; index < 40; index += 1) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://example.test/memory-lifecycle-${index}.css`;
      link.setAttribute('data-memory-lifecycle-test', '');
      document.head.appendChild(link);
    }

    const fill = document.createElement('enhanced-select') as EnhancedSelect;
    document.body.appendChild(fill);
    fill.classMap = { selected: 'memory-lifecycle' };
    await flushAsync();

    const afterEviction = document.createElement('enhanced-select') as EnhancedSelect;
    document.body.appendChild(afterEviction);
    afterEviction.classMap = { selected: 'memory-lifecycle' };
    await flushAsync();

    expect(fetchMock.mock.calls.filter(([url]) => String(url) === firstLink.href).length).toBeGreaterThanOrEqual(3);
  });

  it('ignores virtualizer microtasks and RAF callbacks after destroy', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const rafCallbacks: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    });
    vi.stubGlobal('cancelAnimationFrame', () => undefined);

    const virtualizer = new Virtualizer(container, 5, (index) => ({ index }), {
      estimatedItemHeight: 20,
      buffer: 1,
    });

    const measureSpy = vi.spyOn(virtualizer, 'measureOnAppear');
    const releaseSpy = vi.spyOn(virtualizer, 'releaseExcess');

    virtualizer.render(0, 2, (node, item) => {
      node.textContent = String((item as any).index);
    });
    virtualizer.destroy();

    await Promise.resolve();
    rafCallbacks.forEach((callback) => callback(0));

    expect(measureSpy).not.toHaveBeenCalled();
    expect(releaseSpy).not.toHaveBeenCalled();
  });

  it('physically evicts expired and over-capacity TTL cache entries', () => {
    let now = 1_000;
    const nowSpy = vi.spyOn(Date, 'now').mockImplementation(() => now);
    const cache = new TTLCache<string>(10, 2);

    cache.set('a', ['a']);
    cache.set('b', ['b']);
    cache.set('c', ['c']);
    expect(cache.get('a')).toBeNull();
    expect(cache.get('b')).toEqual(['b']);

    now += 20;
    expect(cache.get('b')).toBeNull();
    expect(cache.get('c')).toBeNull();

    nowSpy.mockRestore();
  });
});
