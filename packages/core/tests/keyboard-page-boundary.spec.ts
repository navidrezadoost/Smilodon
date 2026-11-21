import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select.js';
import { resetSelectConfig } from '../src/config/global-config.js';
import type { DataRequest } from '../src/data-loading/public-types.js';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

function makeSelect(infiniteScroll = true): EnhancedSelect {
  const select = document.createElement('enhanced-select') as EnhancedSelect;
  select.updateConfig({
    selection: { mode: 'multi' },
    infiniteScroll: { enabled: infiniteScroll, pageSize: 6 },
    dataLoading: { protocol: 'acknowledged', searchMode: 'remote', paginationMode: 'page', fetchLimit: 6 },
  });
  document.body.appendChild(select);
  return select;
}

function arrowDown(select: EnhancedSelect): void {
  const input = select.shadowRoot!.querySelector('input')!;
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
}

async function completeAndWait(select: EnhancedSelect, completion: Parameters<EnhancedSelect['completeDataRequest']>[0]): Promise<void> {
  expect(await (select as any)._completeDataRequestForTest(completion)).toBe('accepted');
}

async function startAndWait(select: EnhancedSelect): Promise<void> {
  select.startDataLoading();
  const readinessTask = (select as any)._acknowledgedStartTask as Promise<void> | null;
  if (readinessTask) await readinessTask;
}

describe('keyboard-triggered acknowledged pagination (#96)', () => {
  beforeEach(() => resetSelectConfig());
  afterEach(() => {
    document.body.replaceChildren();
    resetSelectConfig();
  });

  it('requests page 2 once at the final selectable option and continues after projection', async () => {
    const select = makeSelect();
    const searches: DataRequest[] = [];
    const loadMore: DataRequest[] = [];
    select.addEventListener('search', (event) => searches.push((event as CustomEvent).detail.request));
    select.addEventListener('loadMore', (event) => loadMore.push((event as CustomEvent).detail.request));
    await startAndWait(select);
    const initial = searches[0];

    await completeAndWait(select, {
      requestId: initial.requestId,
      queryGeneration: initial.queryGeneration,
      status: 'succeeded',
      items: Array.from({ length: 6 }, (_, i) => ({ value: String(i), label: `Item ${i}` })),
      hasMore: true,
    });
    select.open();
    for (let i = 0; i < 6; i += 1) arrowDown(select);
    expect((select as any)._state.activeIndex).toBe(5);
    const initialSelection = select.getSelectedValues();

    arrowDown(select);
    expect(loadMore).toHaveLength(1);
    expect(loadMore[0]).toMatchObject({
      kind: 'loadMore',
      position: { mode: 'page', page: 2 },
      queryGeneration: initial.queryGeneration,
    });
    expect((select as any)._state.activeIndex).toBe(5);
    expect(select.getSelectedValues()).toEqual(initialSelection);
    arrowDown(select);
    arrowDown(select);
    expect(loadMore).toHaveLength(1);

    const next = loadMore[0];
    await completeAndWait(select, {
      requestId: next.requestId,
      queryGeneration: next.queryGeneration,
      status: 'exhausted',
      items: Array.from({ length: 8 }, (_, i) => ({ value: String(i), label: `Item ${i}` })),
      hasMore: false,
    });
    arrowDown(select);
    expect((select as any)._state.activeIndex).toBe(6);
    arrowDown(select);
    expect((select as any)._state.activeIndex).toBe(7);
    arrowDown(select);
    expect(loadMore).toHaveLength(1);
  });

  it('does not request at non-boundary positions or after exhaustion', async () => {
    const select = makeSelect();
    const searches: DataRequest[] = [];
    const loadMore: DataRequest[] = [];
    select.addEventListener('search', (event) => searches.push((event as CustomEvent).detail.request));
    select.addEventListener('loadMore', (event) => loadMore.push((event as CustomEvent).detail.request));
    await startAndWait(select);
    const initial = searches[0];
    await completeAndWait(select, {
      requestId: initial.requestId,
      queryGeneration: initial.queryGeneration,
      status: 'exhausted',
      items: [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }],
      hasMore: false,
    });
    select.open();
    arrowDown(select);
    expect(loadMore).toHaveLength(0);
    arrowDown(select);
    arrowDown(select);
    expect((select as any)._state.activeIndex).toBe(1);
    expect(loadMore).toHaveLength(0);
  });

  it('does not request more pages when infinite scroll is disabled', async () => {
    const select = makeSelect(false);
    const searches: DataRequest[] = [];
    const loadMore: DataRequest[] = [];
    select.addEventListener('search', (event) => searches.push((event as CustomEvent).detail.request));
    select.addEventListener('loadMore', (event) => loadMore.push((event as CustomEvent).detail.request));
    await startAndWait(select);
    const initial = searches[0];
    await completeAndWait(select, {
      requestId: initial.requestId,
      queryGeneration: initial.queryGeneration,
      status: 'succeeded',
      items: [{ value: 'a', label: 'Alpha' }],
      hasMore: true,
    });
    select.open();
    arrowDown(select);
    arrowDown(select);
    expect(loadMore).toHaveLength(0);
  });
});
