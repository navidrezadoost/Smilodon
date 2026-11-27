/**
 * W1-P1.2 — DEVIATION-04 characterization: setSelectedValues() ordering.
 *
 * Black-box only. State is created exclusively through public APIs
 * (setItems / updateConfig / setSelectedValues). Behavior is asserted through
 * emitted DOM events, registered callbacks, public getters, and Promise
 * settlement. No private projection, _state, or engine internals are read.
 *
 * Contract IDs under test (see W1-P1-TRACEABILITY.json):
 *   API-012  setSelectedValues async ordering
 *   EVENT-007 change payload
 *   EVENT-001 select (asserted ABSENT on programmatic paths)
 *   EVENT-006 error (server failure path)
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select';
import type { ChangeEventDetail } from '../src/types';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

interface TrackedEvent {
  type: string;
  detail: unknown;
  bubbles: boolean;
  composed: boolean;
}

/** Records every named event in dispatch order, capturing key flags. */
function trackEvents(el: EnhancedSelect, names: string[]) {
  const log: TrackedEvent[] = [];
  const handlers = names.map((name) => {
    const handler = (e: Event) => {
      log.push({
        type: e.type,
        detail: (e as CustomEvent).detail,
        bubbles: e.bubbles,
        composed: e.composed,
      });
    };
    el.addEventListener(name, handler);
    return { name, handler };
  });
  return {
    log,
    stop() {
      for (const { name, handler } of handlers) el.removeEventListener(name, handler);
    },
    types() {
      return log.map((e) => e.type);
    },
  };
}

const ITEMS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
];

describe('W1-P1.2 DEVIATION-04 — setSelectedValues ordering (local mode)', () => {
  let select: EnhancedSelect;

  beforeEach(() => {
    select = document.createElement('enhanced-select') as EnhancedSelect;
    select.setItems(ITEMS);
    document.body.appendChild(select);
  });

  afterEach(() => select.remove());

  it('emits exactly one change, never a select, and invokes onChange once', async () => {
    const tracker = trackEvents(select, ['select', 'change']);
    const onChange = vi.fn();
    select.updateConfig({ callbacks: { onChange } });

    await select.setSelectedValues(['b']);

    expect(tracker.types()).toEqual(['change']);
    expect(tracker.log[0].detail).toEqual({
      selectedItems: [{ value: 'b', label: 'Beta' }],
      selectedValues: ['b'],
      selectedIndices: [1],
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([{ value: 'b', label: 'Beta' }], ['b']);
    tracker.stop();
  });

  it('dispatches change as bubbling + composed', async () => {
    const tracker = trackEvents(select, ['change']);
    await select.setSelectedValues(['a']);
    expect(tracker.log[0]).toMatchObject({ type: 'change', bubbles: true, composed: true });
    tracker.stop();
  });

  it('fires the change event before invoking the onChange callback', async () => {
    const order: string[] = [];
    select.addEventListener('change', () => order.push('event'));
    select.updateConfig({ callbacks: { onChange: () => order.push('callback') } });

    await select.setSelectedValues(['c']);

    expect(order).toEqual(['event', 'callback']);
  });

  it('in single mode collapses multiple requested values to the first matching key', async () => {
    // Observed: default selection.mode is 'single'; a REPLACE request keeps
    // only the first eligible key. Characterized here, not approved.
    await select.setSelectedValues(['a', 'c']);
    expect(select.getSelectedValues()).toEqual(['a']);
  });

  it('in multi mode keeps every requested, eligible value in selection order', async () => {
    select.updateConfig({ selection: { mode: 'multi' } });
    await select.setSelectedValues(['a', 'c']);
    expect(select.getSelectedValues()).toEqual(['a', 'c']);
    expect((select.getSelectedItems() as Array<{ value: string }>).map((i) => i.value)).toEqual(['a', 'c']);
  });

  it('ignores unknown values and still emits a change describing the applied state', async () => {
    const tracker = trackEvents(select, ['change']);
    await select.setSelectedValues(['a', 'does-not-exist']);
    expect(select.getSelectedValues()).toEqual(['a']);
    expect(tracker.types()).toEqual(['change']);
    expect((tracker.log[0].detail as ChangeEventDetail).selectedValues).toEqual(['a']);
    tracker.stop();
  });

  it('emits change even when the selection is unchanged (no dedupe on programmatic set)', async () => {
    await select.setSelectedValues(['a']);
    const tracker = trackEvents(select, ['change', 'select']);
    await select.setSelectedValues(['a']);
    expect(tracker.types()).toEqual(['change']);
    tracker.stop();
  });

  it('resolves its Promise after the synchronous change emission', async () => {
    let resolved = false;
    const p = select.setSelectedValues(['b']).then(() => {
      resolved = true;
    });
    // Local path completes synchronously before the microtask queue drains.
    expect(select.getSelectedValues()).toEqual(['b']);
    await p;
    expect(resolved).toBe(true);
  });
});

describe('W1-P1.2 DEVIATION-04 — setSelectedValues ordering (server-fetch: success)', () => {
  let select: EnhancedSelect;

  beforeEach(() => {
    select = document.createElement('enhanced-select') as EnhancedSelect;
    select.setItems(ITEMS);
    document.body.appendChild(select);
  });

  afterEach(() => select.remove());

  it('emits change (not select) and calls onChange once after the fetch resolves', async () => {
    const remoteItem = { id: 'remote', value: 'REMOTE', label: 'Remote item' };
    const fetchSelectedItems = vi.fn(async () => [remoteItem]);
    select.updateConfig({ serverSide: { enabled: true, fetchSelectedItems } });

    const tracker = trackEvents(select, ['select', 'change', 'error']);
    const onChange = vi.fn();
    select.updateConfig({ callbacks: { onChange } });

    await select.setSelectedValues(['REMOTE']);

    expect(fetchSelectedItems).toHaveBeenCalledWith(['REMOTE']);
    expect(tracker.types()).toEqual(['change']);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(select.getSelectedValues()).toEqual(['REMOTE']);
    tracker.stop();
  });

  it('fires change after the awaited fetch, not before', async () => {
    let fetchDone = false;
    const remoteItem = { id: 'r2', value: 'R2', label: 'R2' };
    select.updateConfig({
      serverSide: {
        enabled: true,
        fetchSelectedItems: async () => {
          await Promise.resolve();
          fetchDone = true;
          return [remoteItem];
        },
      },
    });
    select.addEventListener('change', () => {
      expect(fetchDone).toBe(true);
    });

    await select.setSelectedValues(['R2']);
    expect(select.getSelectedValues()).toEqual(['R2']);
  });
});

describe('W1-P1.2 DEVIATION-04 — setSelectedValues ordering (server-fetch: failure)', () => {
  let select: EnhancedSelect;

  beforeEach(() => {
    select = document.createElement('enhanced-select') as EnhancedSelect;
    select.setItems(ITEMS);
    document.body.appendChild(select);
  });

  afterEach(() => select.remove());

  it('emits error (not change/select) and calls onError; the Promise still resolves', async () => {
    const boom = new Error('fetch failed');
    select.updateConfig({
      serverSide: {
        enabled: true,
        fetchSelectedItems: async () => {
          throw boom;
        },
      },
    });

    const tracker = trackEvents(select, ['select', 'change', 'error']);
    const onError = vi.fn();
    select.updateConfig({ callbacks: { onError } });

    // The method swallows the error (handles it internally); it does not reject.
    await expect(select.setSelectedValues(['x'])).resolves.toBeUndefined();

    expect(tracker.types()).toEqual(['error']);
    expect((tracker.log[0].detail as { message: string }).message).toBe('fetch failed');
    expect(onError).toHaveBeenCalledTimes(1);
    // Selection did not change.
    expect(select.getSelectedValues()).toEqual([]);
    tracker.stop();
  });
});

describe('W1-P1.2 DEVIATION-04 — setSelectedValues ordering (superseded / disconnected)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('drops a superseded fetch: no change from the stale call, latest call wins', async () => {
    const select = document.createElement('enhanced-select') as EnhancedSelect;
    select.setItems(ITEMS);
    document.body.appendChild(select);

    const resolvers: Array<(items: unknown[]) => void> = [];
    select.updateConfig({
      serverSide: {
        enabled: true,
        fetchSelectedItems: (values: unknown[]) =>
          new Promise<unknown[]>((resolve) => {
            resolvers.push(() => resolve([{ id: String(values[0]), value: values[0], label: String(values[0]) }]));
          }),
      },
    });

    const tracker = trackEvents(select, ['change']);
    const first = select.setSelectedValues(['first']);
    const second = select.setSelectedValues(['second']);

    // Resolve the first (now stale) fetch, then the second.
    resolvers[0]([]);
    resolvers[1]([]);
    await Promise.all([first, second]);

    // Only the latest generation may publish a change; the stale one is dropped.
    expect(tracker.types()).toEqual(['change']);
    expect(select.getSelectedValues()).toEqual(['second']);
    tracker.stop();
    select.remove();
  });

  it('does not emit change when the element is disconnected before the fetch resolves', async () => {
    const select = document.createElement('enhanced-select') as EnhancedSelect;
    select.setItems(ITEMS);
    document.body.appendChild(select);

    let release: (items: unknown[]) => void = () => {};
    select.updateConfig({
      serverSide: {
        enabled: true,
        fetchSelectedItems: () =>
          new Promise<unknown[]>((resolve) => {
            release = resolve;
          }),
      },
    });

    const tracker = trackEvents(select, ['change', 'error']);
    const promise = select.setSelectedValues(['a']);

    select.remove(); // disconnect while the fetch is in flight
    release([{ id: 'a', value: 'a', label: 'Alpha' }]);

    await expect(promise).resolves.toBeUndefined();
    expect(tracker.types()).toEqual([]);
    tracker.stop();
  });
});
