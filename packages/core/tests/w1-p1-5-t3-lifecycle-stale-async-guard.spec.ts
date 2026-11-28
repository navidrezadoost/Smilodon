import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select.js';
import { resetSelectConfig } from '../src/config/global-config.js';
import type { DataRequest } from '../src/data-loading/public-types.js';

if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}

type SelectUpdate = Parameters<EnhancedSelect['updateConfig']>[0];

interface Item {
  id: string;
  value: string;
  label: string;
}

function item(value: string): Item {
  return { id: value, value, label: value.toUpperCase() };
}

function mount(overrides?: Partial<SelectUpdate>): EnhancedSelect {
  const select = document.createElement('enhanced-select') as EnhancedSelect;
  select.updateConfig({
    searchable: true,
    loadMore: { enabled: true, itemsPerLoad: 3 },
    infiniteScroll: { enabled: true, pageSize: 5 },
    dataLoading: { protocol: 'acknowledged', searchMode: 'remote', fetchLimit: 5 },
    ...overrides,
  } as SelectUpdate);
  document.body.appendChild(select);
  return select;
}

/** A manually-resolved promise, giving full control over async resolution order. */
interface Controlled<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

function controlled<T>(): Controlled<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Install a server-side loader that hands back one controlled promise per call. */
function installControlledLoader(select: EnhancedSelect): Controlled<unknown[]>[] {
  const pending: Controlled<unknown[]>[] = [];
  select.updateConfig({
    serverSide: {
      enabled: true,
      fetchSelectedItems: () => {
        const c = controlled<unknown[]>();
        pending.push(c);
        return c.promise;
      },
    },
  });
  return pending;
}

function record(select: EnhancedSelect, names: string[]): unknown[] {
  const seen: unknown[] = [];
  for (const name of names) {
    select.addEventListener(name, (event) => seen.push({ name, detail: (event as CustomEvent).detail }));
  }
  return seen;
}

async function waitAckLoading(select: EnhancedSelect): Promise<DataRequest> {
  await vi.waitFor(() => {
    const state = select.getDataLoadingState();
    if (state.projectionPending || state.status !== 'loading') throw new Error('waiting loading');
    return true;
  }, { timeout: 2000 });
  const request = select.getDataLoadingState().activeRequest;
  if (!request) throw new Error('no active request');
  return request;
}

async function waitAckSettled(select: EnhancedSelect, expectedStatus?: string): Promise<void> {
  await vi.waitFor(() => {
    const state = select.getDataLoadingState();
    if (state.projectionPending) throw new Error('projectionPending');
    if (expectedStatus !== undefined && state.status !== expectedStatus) {
      throw new Error(`status ${state.status} != ${expectedStatus}`);
    }
    return true;
  }, { timeout: 2000 });
}

function typeQuery(select: EnhancedSelect, value: string): void {
  const input = select.shadowRoot!.querySelector('input[part="input"]') as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * W1-P1.5 Task 3 — LIFECYCLE-005: stale asynchronous result guard.
 *
 * Public surface only (methods, config, events, rendered state). Every scenario
 * is a DISCRIMINATOR: the stale (obsolete) operation resolves with a
 * deliberately NON-BENIGN payload that WOULD visibly change the outcome if the
 * guard were missing. A benign "nothing changed" observation is therefore not
 * used as evidence — each assertion would fail on an implementation that
 * applied obsolete results.
 */
describe('W1-P1.5-T3 LIFECYCLE-005 stale async result guard', () => {
  beforeEach(() => {
    resetSelectConfig();
  });

  afterEach(() => {
    document.body.replaceChildren();
    resetSelectConfig();
    vi.useRealTimers();
  });

  describe('setSelectedValues supersession (server-side fetch)', () => {
    it('applies only the newest of two superseded fetches even when the stale fetch resolves last', async () => {
      const select = mount();
      const pending = installControlledLoader(select);
      const events = record(select, ['change', 'select']);

      // Two overlapping operations; each will resolve to a DIFFERENT selection.
      const first = select.setSelectedValues(['first']);
      const second = select.setSelectedValues(['second']);
      expect(pending).toHaveLength(2);

      // Resolve the NEWER operation first, then the OLDER (stale) one.
      pending[1].resolve([item('second')]);
      pending[0].resolve([item('first')]);
      await Promise.all([first, second]);

      // The stale 'first' result must NOT overwrite the newer 'second'.
      expect(select.getSelectedValues()).toEqual(['second']);
      // Non-vacuity: if both results had been applied, the value would be
      // 'first' (the last-resolved) — or contain both; it is exactly 'second'.
      expect(select.getSelectedValues()).not.toContain('first');

      // Exactly one change (the newest); no select event from a programmatic path.
      const names = (events as { name: string }[]).map((e) => e.name);
      expect(names.filter((n) => n === 'change')).toHaveLength(1);
      expect(names).not.toContain('select');
      const changeDetail = (events as { name: string; detail: { selectedValues: string[] } }[])
        .find((e) => e.name === 'change')!.detail;
      expect(changeDetail.selectedValues).toEqual(['second']);
    });

    it('does not apply a stale success that resolves after a newer success (value and event non-mutation)', async () => {
      const select = mount();
      const pending = installControlledLoader(select);
      const changes: string[][] = [];
      select.addEventListener('change', (e) => {
        changes.push((e as CustomEvent).detail.selectedValues);
      });

      const first = select.setSelectedValues(['old']);
      const second = select.setSelectedValues(['new']);
      // Newer completes cleanly first.
      pending[1].resolve([item('new')]);
      await second;
      expect(select.getSelectedValues()).toEqual(['new']);
      expect(changes).toEqual([['new']]);

      // Now the stale one completes with a distinct, non-benign value.
      pending[0].resolve([item('old')]);
      await first;

      // No further change, no overwrite.
      expect(select.getSelectedValues()).toEqual(['new']);
      expect(changes).toEqual([['new']]);
    });

    it('drops a stale failure so it cannot surface an error after a newer success', async () => {
      const select = mount();
      const pending = installControlledLoader(select);
      const errors: unknown[] = [];
      const changes: string[][] = [];
      select.addEventListener('error', (e) => errors.push((e as CustomEvent).detail));
      select.addEventListener('change', (e) => changes.push((e as CustomEvent).detail.selectedValues));

      const first = select.setSelectedValues(['first']);
      const second = select.setSelectedValues(['second']);
      // Newer succeeds; older (stale) then FAILS.
      pending[1].resolve([item('second')]);
      await second;
      pending[0].reject(new Error('stale boom'));
      await first;

      // The stale failure must be swallowed: no error, selection is the newer one.
      expect(errors).toHaveLength(0);
      expect(select.getSelectedValues()).toEqual(['second']);
      expect(changes).toEqual([['second']]);
    });
  });

  describe('setSelectedValues disconnect during an unresolved async operation', () => {
    it('drops a non-benign fetch result when the element is disconnected mid-flight', async () => {
      const select = mount();
      const pending = installControlledLoader(select);
      const events = record(select, ['change', 'error', 'select']);

      const promise = select.setSelectedValues(['a']);
      expect(pending).toHaveLength(1);

      // Disconnect while the fetch is unresolved, then resolve with a real item.
      const selectedBefore = select.getSelectedValues();
      select.remove();
      pending[0].resolve([item('a')]);

      await expect(promise).resolves.toBeUndefined();
      // No event of any tracked kind; selection did not change via the detached op.
      expect((events as { name: string }[]).map((e) => e.name)).toEqual([]);
      expect(select.getSelectedValues()).toEqual(selectedBefore);
      // Non-vacuity: the resolved payload was 'a'; a missing guard would have
      // selected it (or emitted a change) despite the disconnect.
      expect(select.getSelectedValues()).not.toContain('a');
    });
  });

  describe('acknowledged stale completion guard', () => {
    it('rejects a stale completion after the request is superseded; only the current request is projected', async () => {
      const select = mount();
      const projections: { status: string; requestId: string }[] = [];
      select.addEventListener('dataProjection', (event) => {
        projections.push((event as CustomEvent).detail);
      });

      select.startDataLoading();
      const staleRequest = await waitAckLoading(select);

      // Supersede with a new (typed) query, producing a fresh request.
      typeQuery(select, 'new');
      await vi.waitFor(() => {
        const active = select.getDataLoadingState().activeRequest;
        if (!active || active.requestId === staleRequest.requestId) throw new Error('waiting for new request');
      }, { timeout: 2000 });
      const currentRequest = select.getDataLoadingState().activeRequest!;
      expect(currentRequest.requestId).not.toBe(staleRequest.requestId);

      // Completing the STALE request is rejected and NOT projected.
      const staleResult = select.completeDataRequest({
        requestId: staleRequest.requestId,
        queryGeneration: staleRequest.queryGeneration,
        status: 'succeeded',
        items: [item('STALE')],
        hasMore: true,
      } as never);
      expect(staleResult).toBe('stale');
      expect(projections).toHaveLength(0);
      // State is still awaiting the current request — the stale success did not
      // advance it to succeeded (a missing guard would have flipped the status).
      expect(select.getDataLoadingState().status).toBe('loading');

      // Completing the CURRENT request is accepted and projected exactly once.
      const currentResult = select.completeDataRequest({
        requestId: currentRequest.requestId,
        queryGeneration: currentRequest.queryGeneration,
        status: 'succeeded',
        items: [item('CURRENT')],
        hasMore: true,
      } as never);
      expect(currentResult).toBe('accepted');
      await waitAckSettled(select, 'succeeded');
      expect(projections.map((p) => p.status)).toEqual(['complete']);
      expect(projections[0].requestId).toBe(currentRequest.requestId);
    });

    it('treats a completion from an unknown request identity as rejected (no projection, no state advance)', async () => {
      const select = mount();
      const projections: unknown[] = [];
      select.addEventListener('dataProjection', (event) => projections.push((event as CustomEvent).detail));

      select.startDataLoading();
      const request = await waitAckLoading(select);

      const unknownResult = select.completeDataRequest({
        requestId: 'data-unknown-request-id',
        queryGeneration: request.queryGeneration,
        status: 'succeeded',
        items: [item('GHOST')],
        hasMore: true,
      } as never);
      // Not the active request identity -> rejected, not projected.
      expect(unknownResult).not.toBe('accepted');
      expect(projections).toHaveLength(0);
      expect(select.getDataLoadingState().status).toBe('loading');
    });
  });
});
