import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const OUTPUT_PATH = resolve(
  process.cwd(),
  process.env.PHASE4_LIFECYCLE_OWNER_ATTRIBUTION_OUTPUT
    ?? 'test-results/performance/lifecycle/listener-ownership-attribution.json',
);

test('attribute component scroll listeners across construction and connection lifecycle', async ({ page, browser }) => {
  await page.addInitScript(() => {
    const phase = window as any;
    const hosts = new WeakMap<Element, number>();
    const listenerIds = new WeakMap<object, number>();
    const registrations: any[] = [];
    const active = new Map<string, any>();
    let nextHost = 0;
    let nextListener = 0;
    const describeTarget = (target: EventTarget): string => {
      if (target === window) return 'window';
      if (target === document) return 'document';
      if (target instanceof Element) {
        const owner = target.getRootNode() as ShadowRoot;
        const host = owner instanceof ShadowRoot ? owner.host : null;
        const rootName = host?.localName === 'enhanced-select' ? `enhanced-select#${hosts.get(host)}` : 'other';
        return `${rootName} ${target.localName}${target.className ? `.${String(target.className).replaceAll(' ', '.')}` : ''}`;
      }
      return Object.prototype.toString.call(target);
    };
    const hostId = (target: EventTarget): number | null => {
      if (!(target instanceof Node)) return null;
      const root = target instanceof Element ? target.getRootNode() : target.getRootNode();
      const host = target instanceof Element && target.localName === 'enhanced-select'
        ? target
        : root instanceof ShadowRoot ? root.host : null;
      if (!host || host.localName !== 'enhanced-select') return null;
      let id = hosts.get(host);
      if (id === undefined) { id = ++nextHost; hosts.set(host, id); }
      return id;
    };
    const callbackId = (listener: object): number => {
      let id = listenerIds.get(listener);
      if (id === undefined) { id = ++nextListener; listenerIds.set(listener, id); }
      return id;
    };
    const originalAdd = EventTarget.prototype.addEventListener;
    const originalRemove = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function(this: EventTarget, type: string, listener: any, options?: any) {
      originalAdd.call(this, type, listener, options);
      if (type !== 'scroll' || !listener) return;
      const owner = hostId(this);
      const signal = typeof options === 'object' ? options?.signal : undefined;
      const key = `${describeTarget(this)}|${callbackId(listener)}|${typeof options === 'boolean' ? options : Boolean(options?.capture)}`;
      const record = {
        phase: 'add', owner, target: describeTarget(this), callbackId: callbackId(listener),
        capture: typeof options === 'boolean' ? options : Boolean(options?.capture),
        passive: typeof options === 'object' ? Boolean(options?.passive) : false,
        hasSignal: Boolean(signal), signalAborted: Boolean(signal?.aborted),
        stack: new Error().stack?.split('\n').slice(2, 7), key,
      };
      registrations.push(record);
      active.set(key, { ...record, listener, signal });
    } as typeof EventTarget.prototype.addEventListener;
    EventTarget.prototype.removeEventListener = function(this: EventTarget, type: string, listener: any, options?: any) {
      originalRemove.call(this, type, listener, options);
      if (type !== 'scroll' || !listener) return;
      const key = `${describeTarget(this)}|${callbackId(listener)}|${typeof options === 'boolean' ? options : Boolean(options?.capture)}`;
      const entry = active.get(key);
      if (!entry) return;
      registrations.push({ phase: 'remove', owner: entry.owner, target: entry.target, callbackId: entry.callbackId, key, stack: new Error().stack?.split('\n').slice(2, 7) });
      active.delete(key);
    } as typeof EventTarget.prototype.removeEventListener;
    const nativeAbort = AbortController.prototype.abort;
    AbortController.prototype.abort = function(reason?: any) {
      for (const [key, entry] of active) {
        if (entry.signal !== this.signal) continue;
        registrations.push({ phase: 'signal-abort', owner: entry.owner, target: entry.target, callbackId: entry.callbackId, key, stack: new Error().stack?.split('\n').slice(2, 7) });
        active.delete(key);
      }
      return nativeAbort.call(this, reason);
    };
    phase.__ownerAttribution = {
      registrations,
      snapshot: (owner: number) => Array.from(active.values()).filter((entry: any) => entry.owner === owner).map(({ listener, signal, ...entry }: any) => entry),
      idFor: (host: Element) => {
        let id = hosts.get(host);
        if (id === undefined) { id = ++nextHost; hosts.set(host, id); }
        return id;
      },
    };
  });

  await page.goto('http://localhost:5173/vanilla-demo.html');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => customElements.get('enhanced-select') !== undefined);
  const result = await page.evaluate(async () => {
    const phase = (window as any).__ownerAttribution;
    const host = document.createElement('enhanced-select') as any;
    const id = phase.idFor(host);
    const constructed = phase.snapshot(id);
    host.updateConfig({ searchable: true, scrollToSelected: { enabled: false } });
    host.setItems([{ value: 'a', label: 'A' }]);
    document.body.appendChild(host);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const connected = phase.snapshot(id);
    host._updateGuardedVirtualWindow(0, 320);
    const connectedWithVirtualizer = phase.snapshot(id);
    host.remove();
    const disconnected = phase.snapshot(id);
    document.body.appendChild(host);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const reconnected = phase.snapshot(id);
    host.remove();
    const reconnectedCleanup = phase.snapshot(id);
    return {
      ownerId: id, constructed, connected, connectedWithVirtualizer, disconnected, reconnected, reconnectedCleanup,
      registrations: phase.registrations,
      internals: { controllerAbortedAfterDisconnect: host._connectionController === undefined || host._connectionController.signal.aborted },
      userAgent: navigator.userAgent,
    };
  });
  const readGit = (args: string[]) => {
    try { return execFileSync('git', args, { encoding: 'utf8' }).trim(); } catch { return 'unknown'; }
  };
  const report = {
    capturedAt: new Date().toISOString(),
    metadata: {
      commit: readGit(['rev-parse', 'HEAD']),
      branch: readGit(['branch', '--show-current']),
      workingTreeDirty: readGit(['status', '--porcelain']) !== '',
      node: process.version,
      playwright: JSON.parse(readFileSync(resolve(process.cwd(), 'node_modules/playwright/package.json'), 'utf8')).version,
      browser: browser.version(),
    },
    scenario: {
      selectedScrollPolicy: 'disabled; temporary open-selected-scroll callback is excluded from this ownership comparison',
      listenerCategories: ['input-content tooltip', 'options-container guarded virtualizer', 'window tooltip with connection AbortSignal'],
    },
    ...result,
  };
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`OWNER_ATTRIBUTION ${JSON.stringify({ output: OUTPUT_PATH, ownerId: result.ownerId, constructed: result.constructed.length, connected: result.connected.length, guarded: result.connectedWithVirtualizer.length, disconnected: result.disconnected.length, reconnected: result.reconnected.length, reconnectedCleanup: result.reconnectedCleanup.length, browser: report.metadata.browser })}`);
  const byTarget = (entries: any[], target: string) => entries.filter((entry) => entry.target.includes(target));
  expect(byTarget(result.constructed, 'input-content')).toHaveLength(0);
  expect(byTarget(result.connected, 'input-content')).toHaveLength(1);
  expect(byTarget(result.connectedWithVirtualizer, 'input-content')).toHaveLength(1);
  expect(byTarget(result.connectedWithVirtualizer, 'options-container')).toHaveLength(1);
  expect(result.disconnected).toHaveLength(0);
  expect(result.internals.controllerAbortedAfterDisconnect).toBe(true);
  expect(byTarget(result.reconnected, 'input-content')).toHaveLength(1);
  expect(byTarget(result.reconnected, 'options-container')).toHaveLength(1);
  expect(result.reconnectedCleanup).toHaveLength(0);
  const tooltipRegistrations = result.registrations.filter((entry: any) =>
    entry.phase === 'add' && entry.owner === result.ownerId && entry.target.includes('input-content'));
  expect(tooltipRegistrations).toHaveLength(2);
  expect(tooltipRegistrations.map((entry: any) => entry.callbackId)).toEqual([
    tooltipRegistrations[0]?.callbackId,
    tooltipRegistrations[0]?.callbackId,
  ]);
  expect(tooltipRegistrations.every((entry: any) => entry.passive && !entry.capture && !entry.hasSignal)).toBe(true);
  const tooltipCallbackId = tooltipRegistrations[0].callbackId;
  const windowTooltipAdds = result.registrations.filter((entry: any) =>
    entry.phase === 'add' && entry.target === 'window' && entry.callbackId === tooltipCallbackId);
  expect(windowTooltipAdds).toHaveLength(2);
  expect(windowTooltipAdds.every((entry: any) => entry.passive && entry.capture && entry.hasSignal)).toBe(true);
  expect(result.registrations.filter((entry: any) =>
    entry.phase === 'signal-abort' && entry.target === 'window' && entry.callbackId === tooltipCallbackId)).toHaveLength(2);
  const virtualizerRegistrations = result.registrations.filter((entry: any) =>
    entry.phase === 'add' && entry.owner === result.ownerId && entry.target.includes('options-container'));
  expect(virtualizerRegistrations).toHaveLength(2);
  expect(virtualizerRegistrations[0].callbackId).toBe(virtualizerRegistrations[1].callbackId);
  expect(virtualizerRegistrations.every((entry: any) => entry.stack.some((frame: string) => frame.includes('_ensureGuardedVirtualizer')))).toBe(true);
  expect(result.registrations.some((entry: any) =>
    entry.phase === 'add' && entry.owner === result.ownerId && entry.stack.some((frame: string) => frame.includes('_performOpenSelectedScroll')))).toBe(false);
});
