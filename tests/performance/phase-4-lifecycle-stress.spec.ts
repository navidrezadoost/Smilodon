import { execFileSync } from 'node:child_process';
import { arch, cpus, freemem, platform, release, totalmem } from 'node:os';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium, expect, test, type Page } from '@playwright/test';

const LIST_HEIGHT = 320;
const ESTIMATED_ITEM_HEIGHT = 32;
const OUTPUT_PATH = resolve(
  process.cwd(),
  process.env.PHASE4_LIFECYCLE_OUTPUT ?? 'test-results/performance/lifecycle/phase-4.6.2b-lifecycle.json',
);
const playwrightPackage = JSON.parse(readFileSync(resolve(process.cwd(), 'node_modules/playwright-core/package.json'), 'utf8'));
const browserManifest = JSON.parse(readFileSync(resolve(process.cwd(), 'node_modules/playwright-core/browsers.json'), 'utf8'));
const expectedChromium = browserManifest.browsers.find((entry: any) => entry.name === 'chromium');

type CycleResult = {
  mountedOptionCount: number;
  filterMatchCounts: number[];
  activeIndexAfterKeyboard: number | null;
  connectedResources: ResourceSnapshot;
  disconnectedResources: ResourceSnapshot;
  disconnectedInternals: Record<string, unknown>;
  staleCallbackMutations: number;
  detachedMutations: number;
  rendererResources: Record<string, { created: number; connected: number; disconnected: number }>;
  documentNodeCountAfterCleanup: number;
  fixtureHostCountAfterCleanup: number;
  reconnected: boolean;
  disconnectedSearchEvent: boolean;
  failureInjectionRecovered: boolean;
};

type ResourceSnapshot = {
  scrollListeners: number;
  resizeObservers: number;
  resizeTargets: number;
  resizeCallbacksAfterDisconnect: number;
};

function getCommitSha(): string {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

async function installResourceProbe(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const phase = window as any;
    const hostIds = new WeakMap<Element, number>();
    const stateById = new Map<number, ResourceSnapshot & { connected: boolean }>();
    const listenerRecords = new WeakMap<EventTarget, Map<EventListenerOrEventListenerObject, Set<boolean>>>();
    let nextId = 0;

    const ensureState = (host: Element): { id: number; state: ResourceSnapshot & { connected: boolean } } => {
      let id = hostIds.get(host);
      if (id === undefined) {
        id = ++nextId;
        hostIds.set(host, id);
        stateById.set(id, {
          connected: false,
          scrollListeners: 0,
          resizeObservers: 0,
          resizeTargets: 0,
          resizeCallbacksAfterDisconnect: 0,
        });
      }
      return { id, state: stateById.get(id)! };
    };

    const ownerHost = (target: EventTarget | Element): Element | null => {
      if (!(target instanceof Node)) return null;
      if (target instanceof Element && target.localName === 'enhanced-select') return target;
      const root = target.getRootNode();
      if (root instanceof ShadowRoot && root.host.localName === 'enhanced-select') return root.host;
      return null;
    };

    const resourceState = (host: Element) => ensureState(host).state;
    const countDeepDocumentNodes = (): number => {
      let count = 0;
      const pending: Node[] = [document];
      while (pending.length) {
        const node = pending.pop()!;
        count += 1;
        if (node instanceof Element && node.shadowRoot) pending.push(node.shadowRoot);
        for (const child of Array.from(node.childNodes)) pending.push(child);
      }
      return count;
    };
    const originalAdd = EventTarget.prototype.addEventListener;
    const originalRemove = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function (this: EventTarget, type: string, listener: any, options?: any) {
      originalAdd.call(this, type, listener, options);
      if (type !== 'scroll' || !listener) return;
      const host = ownerHost(this);
      if (!host) return;
      const records = listenerRecords.get(this) ?? new Map<EventListenerOrEventListenerObject, Set<boolean>>();
      const captures = records.get(listener) ?? new Set<boolean>();
      const capture = typeof options === 'boolean' ? options : Boolean(options?.capture);
      if (!captures.has(capture)) {
        captures.add(capture);
        resourceState(host).scrollListeners += 1;
      }
      records.set(listener, captures);
      listenerRecords.set(this, records);
    } as typeof EventTarget.prototype.addEventListener;

    EventTarget.prototype.removeEventListener = function (this: EventTarget, type: string, listener: any, options?: any) {
      originalRemove.call(this, type, listener, options);
      if (type !== 'scroll' || !listener) return;
      const host = ownerHost(this);
      const records = listenerRecords.get(this);
      const captures = records?.get(listener);
      const capture = typeof options === 'boolean' ? options : Boolean(options?.capture);
      if (!host || !captures?.has(capture)) return;
      captures.delete(capture);
      resourceState(host).scrollListeners -= 1;
      if (captures.size === 0) records!.delete(listener);
    } as typeof EventTarget.prototype.removeEventListener;

    const NativeResizeObserver = window.ResizeObserver;
    if (NativeResizeObserver) {
      class LifecycleResizeObserver extends NativeResizeObserver {
        private readonly phaseTargets = new Map<Element, number>();
        private readonly phaseHostTargetCounts = new Map<number, number>();

        constructor(callback: ResizeObserverCallback) {
          super((entries, observer) => {
            for (const entry of entries) {
              const host = ownerHost(entry.target);
              if (!host) continue;
              const { state } = ensureState(host);
              if (!state.connected) state.resizeCallbacksAfterDisconnect += 1;
            }
            callback(entries, observer);
          });
        }

        observe(target: Element, options?: ResizeObserverOptions): void {
          if (!this.phaseTargets.has(target)) {
            const host = ownerHost(target);
            if (host) {
              const { id, state } = ensureState(host);
              const hostTargetCount = this.phaseHostTargetCounts.get(id) ?? 0;
              this.phaseHostTargetCounts.set(id, hostTargetCount + 1);
              this.phaseTargets.set(target, id);
              state.resizeTargets += 1;
              if (hostTargetCount === 0) state.resizeObservers += 1;
            }
          }
          super.observe(target, options);
        }

        unobserve(target: Element): void {
          this.releaseTarget(target);
          super.unobserve(target);
        }

        disconnect(): void {
          for (const target of this.phaseTargets.keys()) this.releaseTarget(target);
          super.disconnect();
        }

        private releaseTarget(target: Element): void {
          const id = this.phaseTargets.get(target);
          if (id === undefined) return;
          this.phaseTargets.delete(target);
          const state = stateById.get(id);
          const hostTargetCount = this.phaseHostTargetCounts.get(id) ?? 0;
          if (state) {
            state.resizeTargets -= 1;
            if (hostTargetCount <= 1) state.resizeObservers -= 1;
          }
          if (hostTargetCount <= 1) this.phaseHostTargetCounts.delete(id);
          else this.phaseHostTargetCounts.set(id, hostTargetCount - 1);
        }
      }
      window.ResizeObserver = LifecycleResizeObserver;
    }

    phase.__phase4LifecycleProbe = {
      ensure: (host: Element) => ensureState(host).id,
      markConnected: (host: Element, connected: boolean) => { ensureState(host).state.connected = connected; },
      read: (host: Element): ResourceSnapshot => {
        const { state } = ensureState(host);
        return {
          scrollListeners: state.scrollListeners,
          resizeObservers: state.resizeObservers,
          resizeTargets: state.resizeTargets,
          resizeCallbacksAfterDisconnect: state.resizeCallbacksAfterDisconnect,
        };
      },
      deepDocumentNodeCount: countDeepDocumentNodes,
      rendererResources: {
        a: { created: 0, connected: 0, disconnected: 0 },
        b: { created: 0, connected: 0, disconnected: 0 },
      },
    };

    customElements.define('phase4-lifecycle-renderer', class extends HTMLElement {
      connectedCallback(): void {
        const kind = this.dataset.renderer as 'a' | 'b' | undefined;
        if (kind) phase.__phase4LifecycleProbe.rendererResources[kind].connected += 1;
      }

      disconnectedCallback(): void {
        const kind = this.dataset.renderer as 'a' | 'b' | undefined;
        if (kind) phase.__phase4LifecycleProbe.rendererResources[kind].disconnected += 1;
      }
    });
  });
}

async function createAndRunCycle(
  page: Page,
  size: number,
  cycle: number,
  baselineNodes: number,
  baselineHosts: number,
): Promise<CycleResult> {
  return page.evaluate(async ({ itemCount, cycleIndex, listHeight, rowHeight, pageBaselineNodes, pageBaselineHosts }) => {
    const phase = window as any;
    const probe = phase.__phase4LifecycleProbe;
    const host = document.createElement('enhanced-select') as any;
    host.id = `phase4-lifecycle-${itemCount}-${cycleIndex}`;
    const id = probe.ensure(host);
    host.updateConfig({
      searchable: true,
      estimatedItemHeight: rowHeight,
      selection: { mode: 'single', closeOnSelect: false },
      scrollToSelected: { enabled: false },
    });
    const list = host.shadowRoot.querySelector('.options-container') as HTMLElement;
    list.style.height = `${listHeight}px`;
    list.style.maxHeight = `${listHeight}px`;
    list.style.overflowY = 'auto';
    const items = Array.from({ length: itemCount }, (_, index) => ({
      id: `lifecycle-${itemCount}-${index}`,
      value: `value-${index}`,
      label: `Option ${index}`,
    }));
    host.setItems(items);
    host._updateGuardedVirtualWindow(0, listHeight);
    host._renderOptions();
    probe.markConnected(host, true);
    document.body.appendChild(host);
    host.open();

    const searchEvents: string[] = [];
    host.addEventListener('search', (event: CustomEvent) => searchEvents.push(event.detail?.query ?? ''));
    const waitFrame = () => new Promise<void>((resolveFrame) => requestAnimationFrame(() => resolveFrame()));
    const waitSettled = async () => { await waitFrame(); await waitFrame(); };
    await waitSettled();

    const renderer = (kind: 'a' | 'b') => (item: { label: string }) => {
      const node = document.createElement('phase4-lifecycle-renderer') as HTMLElement;
      node.dataset.renderer = kind;
      node.textContent = item.label;
      probe.rendererResources[kind].created += 1;
      return node;
    };
    let failureInjectionRecovered = false;
    if (itemCount === 1_000 && cycleIndex === 0) {
      host.optionRenderer = renderer('a');
      await waitSettled();
      host.optionRenderer = renderer('b');
      await waitSettled();
      const rendererA = probe.rendererResources.a;
      if (rendererA.connected !== rendererA.disconnected) {
        throw new Error(`Renderer A retained mounted nodes after replacement: ${JSON.stringify(rendererA)}`);
      }

      let failureMessage = '';
      try {
        host.optionRenderer = () => { throw new Error('phase4-lifecycle-injected-renderer-failure'); };
      } catch (error) {
        failureMessage = error instanceof Error ? error.message : String(error);
      }
      host.optionRenderer = renderer('b');
      host._updateGuardedVirtualWindow(list.scrollTop, listHeight);
      host._renderOptions();
      await waitSettled();
      failureInjectionRecovered = failureMessage === 'phase4-lifecycle-injected-renderer-failure'
        && host._renderPlan?.mode === 'virtual-window'
        && list.querySelectorAll(':scope > [part="option"]').length <= 64;
      if (!failureInjectionRecovered) throw new Error(`Injected renderer failure did not recover: ${failureMessage}`);
    }

    const filterMatchCounts: number[] = [];
    if (itemCount === 10_000) {
      const input = host.shadowRoot.querySelector('[part="input"]') as HTMLInputElement;
      for (const query of ['Option 999', 'Option 9999', '']) {
        input.value = query;
        input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        filterMatchCounts.push(host._renderPlan.filteredKeys.length);
      }
      if (filterMatchCounts[0] !== 11 || filterMatchCounts[1] !== 1 || filterMatchCounts[2] !== itemCount) {
        throw new Error(`Rapid filter replacement returned unexpected counts: ${filterMatchCounts.join(', ')}`);
      }
    }

    host.close();
    host.open();
    const targetIndex = (cycleIndex * 137) % itemCount;
    list.scrollTop = Math.max(0, Math.min(targetIndex * rowHeight, itemCount * rowHeight - listHeight));
    list.dispatchEvent(new Event('scroll'));
    if (cycleIndex % 10 === 0) {
      const input = host.shadowRoot.querySelector('[part="input"]') as HTMLInputElement;
      input.focus();
      await waitSettled();
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true, cancelable: true }));
      await waitSettled();
      const keyboardActiveOption = host._getOptionElementByIndex(host._state.activeIndex);
      if (host._state.activeIndex < 0 || !keyboardActiveOption) {
        throw new Error(`ArrowDown did not leave a mounted active option (active index ${host._state.activeIndex}).`);
      }
    } else {
      await waitFrame();
    }

    const mountedOptionCount = list.querySelectorAll(':scope > [part="option"]').length;
    if (mountedOptionCount > 64) throw new Error(`Virtual mounted option count exceeded 64: ${mountedOptionCount}`);
    const input = host.shadowRoot.querySelector('[part="input"]') as HTMLInputElement;
    const activeIndexAfterKeyboard = cycleIndex % 10 === 0 ? host._state.activeIndex : null;
    const connectedResources = probe.read(host) as ResourceSnapshot;
    if (connectedResources.scrollListeners !== 1 || connectedResources.resizeObservers < 1 || connectedResources.resizeTargets < 1) {
      throw new Error(`Expected guarded resources were not active: ${JSON.stringify(connectedResources)}`);
    }

    let staleCallbackMutations = 0;
    const staleMarker = `phase4-stale-${itemCount}-${cycleIndex}`;
    const pendingSearch = host.shadowRoot.querySelector('[part="input"]') as HTMLInputElement;
    pendingSearch.value = 'phase4-disconnect-pending';
    pendingSearch.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    host._requestLifecycleFrame(() => {
      staleCallbackMutations += 1;
      host.setAttribute('data-stale-lifecycle-callback', staleMarker);
    });
    host._setLifecycleTimeout(() => {
      staleCallbackMutations += 1;
      host.setAttribute('data-stale-lifecycle-callback', staleMarker);
    }, 0);
    list.dispatchEvent(new Event('scroll'));
    const pendingBeforeDisconnect = host._lifecycleRafs.size > 0 && host._lifecycleTimers.size > 0;
    if (!pendingBeforeDisconnect) throw new Error('Lifecycle failure-injection callbacks were not pending before disconnect.');

    host.remove();
    probe.markConnected(host, false);
    const disconnectedResources = probe.read(host) as ResourceSnapshot;
    const controller = host._connectionController;
    const disconnectedInternals = {
      connected: host.isConnected,
      scrollListenerAttached: host._guardedScrollListenerAttached,
      hasGuardedResizeObserver: Boolean(host._guardedOptionResizeObserver),
      observedOptionCount: host._guardedObservedOptions?.size ?? null,
      hasVirtualizer: Boolean(host._guardedVirtualizer),
      pendingLifecycleRafs: host._lifecycleRafs?.size ?? null,
      pendingLifecycleTimers: host._lifecycleTimers?.size ?? null,
      connectionSignalAborted: !controller || controller.signal.aborted,
      hasGlobalStylesObserver: Boolean(host._globalStylesObserver),
      hasThemeContextObserver: Boolean(host._themeContextObserver),
      renderedOptionCount: host.shadowRoot.querySelectorAll('.options-container > [part="option"]').length,
    };
    if (
      disconnectedResources.scrollListeners !== 0
      || disconnectedResources.resizeObservers !== 0
      || disconnectedResources.resizeTargets !== 0
      || disconnectedInternals.scrollListenerAttached
      || disconnectedInternals.hasGuardedResizeObserver
      || disconnectedInternals.observedOptionCount !== 0
      || disconnectedInternals.hasVirtualizer
      || disconnectedInternals.pendingLifecycleRafs !== 0
      || disconnectedInternals.pendingLifecycleTimers !== 0
      || !disconnectedInternals.connectionSignalAborted
      || disconnectedInternals.hasGlobalStylesObserver
      || disconnectedInternals.hasThemeContextObserver
      || disconnectedInternals.renderedOptionCount !== 0
    ) {
      throw new Error(`Disconnected component retained owned resources: ${JSON.stringify({ disconnectedResources, disconnectedInternals })}`);
    }

    const reconnected = cycleIndex % 20 === 19;
    if (reconnected) {
      probe.markConnected(host, true);
      document.body.appendChild(host);
      host.open();
      await waitSettled();
      if (staleCallbackMutations !== 0 || host.hasAttribute('data-stale-lifecycle-callback')) {
        throw new Error(`A pre-disconnect callback mutated a rapidly reconnected instance (${staleCallbackMutations}).`);
      }
      if (searchEvents.includes('phase4-disconnect-pending')) {
        throw new Error('A superseded search notification fired after rapid disconnect/reconnect.');
      }
      if (list.querySelectorAll(':scope > [part="option"]').length > 64) {
        throw new Error('Rapid reconnect lost the bounded virtual window.');
      }
      host.remove();
      probe.markConnected(host, false);
    }

    let detachedMutations = 0;
    const watcher = new MutationObserver((records) => { detachedMutations += records.length; });
    watcher.observe(host.shadowRoot, { attributes: true, childList: true, characterData: true, subtree: true });
    await new Promise<void>((resolveTask) => setTimeout(resolveTask, 0));
    await waitFrame();
    watcher.disconnect();
    if (staleCallbackMutations !== 0 || detachedMutations !== 0) {
      throw new Error(`Asynchronous work mutated a disconnected instance: callbacks=${staleCallbackMutations}, mutations=${detachedMutations}`);
    }

    const rendererResources = JSON.parse(JSON.stringify(probe.rendererResources));
    for (const rendererState of Object.values(rendererResources) as Array<{ created: number; connected: number; disconnected: number }>) {
      if (rendererState.connected !== rendererState.disconnected) {
        throw new Error(`Renderer-owned DOM remained connected after cleanup: ${JSON.stringify(rendererResources)}`);
      }
    }
    if (searchEvents.includes('phase4-disconnect-pending')) {
      throw new Error('A superseded search notification fired after component disconnection.');
    }
    const documentNodeCountAfterCleanup = probe.deepDocumentNodeCount();
    const fixtureHostCountAfterCleanup = document.querySelectorAll('enhanced-select').length;
    if (documentNodeCountAfterCleanup !== pageBaselineNodes || fixtureHostCountAfterCleanup !== pageBaselineHosts) {
      throw new Error(`DOM did not return to the established page baseline: ${JSON.stringify({ documentNodeCountAfterCleanup, pageBaselineNodes, fixtureHostCountAfterCleanup, pageBaselineHosts })}`);
    }
    return {
      mountedOptionCount,
      filterMatchCounts,
      activeIndexAfterKeyboard,
      connectedResources,
      disconnectedResources,
      disconnectedInternals,
      staleCallbackMutations,
      detachedMutations,
      rendererResources,
      documentNodeCountAfterCleanup,
      fixtureHostCountAfterCleanup,
      reconnected,
      disconnectedSearchEvent: searchEvents.includes('phase4-disconnect-pending'),
      failureInjectionRecovered,
    };
  }, {
    itemCount: size,
    cycleIndex: cycle,
    listHeight: LIST_HEIGHT,
    rowHeight: ESTIMATED_ITEM_HEIGHT,
    pageBaselineNodes: baselineNodes,
    pageBaselineHosts: baselineHosts,
  });
}

async function collectGarbageAndSample(page: Page, cdp: any, label: string) {
  for (let index = 0; index < 3; index += 1) {
    await cdp.send('HeapProfiler.collectGarbage');
    await page.waitForTimeout(20);
  }
  const heap = await cdp.send('Runtime.getHeapUsage');
  const dom = await page.evaluate(() => ({
    deepDocumentNodeCount: (window as any).__phase4LifecycleProbe.deepDocumentNodeCount(),
    enhancedSelectCount: document.querySelectorAll('enhanced-select').length,
    knownCaches: (() => {
      const EnhancedSelectConstructor = customElements.get('enhanced-select') as any;
      return {
        mirroredStylesheetText: {
          entries: EnhancedSelectConstructor?._mirroredStylesheetTextCache?.size ?? null,
          limit: EnhancedSelectConstructor?._MIRRORED_STYLESHEET_CACHE_LIMIT ?? null,
        },
      };
    })(),
  }));
  return {
    label,
    sampledAt: new Date().toISOString(),
    gcCheckpoints: 3,
    javascriptHeap: {
      usedSizeBytes: heap.usedSize,
      totalSizeBytes: heap.totalSize,
      embedderHeapUsedSizeBytes: heap.embedderHeapUsedSize,
      backingStorageSizeBytes: heap.backingStorageSize,
      source: 'Chromium CDP Runtime.getHeapUsage after three HeapProfiler.collectGarbage calls; JavaScript heap, not browser-process memory.',
    },
    browserDom: dom,
  };
}

test('Phase 4.6.2B: repeated guarded lifecycle cleanup and memory sampling', async ({ page, browser }, testInfo) => {
  test.setTimeout(30 * 60 * 1000);
  await installResourceProbe(page);
  const report: Record<string, any> = {
    schemaVersion: 1,
    status: 'running',
    generatedAt: new Date().toISOString(),
    commit: getCommitSha(),
    nodeVersion: process.version,
    playwrightVersion: playwrightPackage.version,
    browser: {
      engine: 'chromium',
      version: browser.version(),
      expectedRevision: expectedChromium?.revision ?? null,
      expectedVersion: expectedChromium?.browserVersion ?? null,
      expectedExecutablePath: chromium.executablePath(),
      resolvedExecutablePath: process.env.PHASE4_LIFECYCLE_EXECUTABLE_PATH ?? chromium.executablePath(),
      explicitExecutableOverride: process.env.PHASE4_LIFECYCLE_EXECUTABLE_PATH ?? null,
    },
    runner: {
      platform: platform(),
      release: release(),
      architecture: arch(),
      cpuCount: cpus().length,
      cpuModel: cpus()[0]?.model ?? null,
      totalMemoryBytes: totalmem(),
      freeMemoryAtStartBytes: freemem(),
      githubActions: process.env.GITHUB_ACTIONS === 'true',
      githubRunnerName: process.env.RUNNER_NAME ?? null,
      githubImageOS: process.env.ImageOS ?? null,
      githubImageVersion: process.env.ImageVersion ?? null,
      viewport: { width: 1280, height: 800, deviceScaleFactor: 1 },
    },
    protocol: {
      mode: 'private guarded virtual-window integration seam; no public activation option',
      workloads: [
        { itemCount: 1_000, mountUnmountCycles: 100 },
        { itemCount: 10_000, mountUnmountCycles: 100, perCycle: ['scroll', 'rapid filter replacement (11 → 1 → all)'] },
        { itemCount: 100_000, mountUnmountCycles: 10, purpose: 'bounded-window operation and repeated lifecycle sampling' },
      ],
      mountedOptionCeiling: 64,
      gc: 'Three Chromium HeapProfiler.collectGarbage checkpoints before each baseline/intermediate/final sample, followed by Runtime.getHeapUsage.',
      dom: 'Deep count of document nodes including accessible open shadow roots; compared to the page baseline after each disconnect.',
      resourceInstrumentation: 'Counter-only instrumentation for custom-element scroll listeners and ResizeObserver ownership; counters retain numeric IDs only, not component references.',
      memoryInterpretation: 'Positive JavaScript heap deltas are diagnostic only. No heap threshold or leak classification is applied; require repeated retention and a reproducible ownership/reference path.',
      knownCaches: 'Where exposed by the built test component, each GC checkpoint records the entry count and configured bound for the mirrored stylesheet text cache. This is contextual evidence, not permission to classify other heap growth as a cache.',
      failureInjection: 'A one-shot throwing custom option renderer is replaced with a functioning renderer and the guarded instance must recover.',
      keyboard: 'Dispatch ArrowDown through the component input and verify the resulting active option is mounted; far-index End materialization remains covered by the dedicated Phase 4 browser regression.',
      staleWork: 'Queue lifecycle RAF, timeout, scroll update, and search notification immediately before disconnect; verify cancellation through detached and rapid reconnect windows.',
    },
    scenarios: [],
  };

  const writeReport = () => {
    mkdirSync(resolve(OUTPUT_PATH, '..'), { recursive: true });
    writeFileSync(OUTPUT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  };
  writeReport();
  let cdp: any;
  try {
    await page.goto('http://localhost:5173/vanilla-demo.html');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => customElements.get('enhanced-select') !== undefined);
    cdp = await page.context().newCDPSession(page);
    await cdp.send('HeapProfiler.enable');
    const baseline = await page.evaluate(() => ({
      deepDocumentNodeCount: (window as any).__phase4LifecycleProbe.deepDocumentNodeCount(),
      enhancedSelectCount: document.querySelectorAll('enhanced-select').length,
    }));
    report.pageBaseline = baseline;

    const workloads = [
      { itemCount: 1_000, cycles: 100, checkpointEvery: 25 },
      { itemCount: 10_000, cycles: 100, checkpointEvery: 25 },
      { itemCount: 100_000, cycles: 10, checkpointEvery: 5 },
    ];
    for (const workload of workloads) {
      const scenario: Record<string, any> = {
        itemCount: workload.itemCount,
        plannedCycles: workload.cycles,
        completedCycles: 0,
        baseline: await collectGarbageAndSample(page, cdp, `${workload.itemCount}-baseline`),
        intermediate: [],
        postCleanup: null,
        cycles: [],
      };
      report.scenarios.push(scenario);
      writeReport();

      for (let cycle = 0; cycle < workload.cycles; cycle += 1) {
        const result = await createAndRunCycle(page, workload.itemCount, cycle, baseline.deepDocumentNodeCount, baseline.enhancedSelectCount);
        scenario.cycles.push(result);
        scenario.completedCycles = cycle + 1;
        writeReport();
        expect(result.mountedOptionCount, `${workload.itemCount} options, cycle ${cycle}: mounted option bound`).toBeLessThanOrEqual(64);
        expect(result.disconnectedResources).toEqual({
          scrollListeners: 0,
          resizeObservers: 0,
          resizeTargets: 0,
          resizeCallbacksAfterDisconnect: 0,
        });
        expect(result.staleCallbackMutations).toBe(0);
        expect(result.detachedMutations).toBe(0);
        expect(result.documentNodeCountAfterCleanup).toBe(baseline.deepDocumentNodeCount);
        if (workload.itemCount === 10_000) expect(result.filterMatchCounts).toEqual([11, 1, 10_000]);
        if (workload.itemCount === 1_000 && cycle === 0) expect(result.failureInjectionRecovered).toBe(true);
        if (cycle % 20 === 19) expect(result.reconnected).toBe(true);

        if ((cycle + 1) % workload.checkpointEvery === 0 && cycle + 1 < workload.cycles) {
          scenario.intermediate.push(await collectGarbageAndSample(page, cdp, `${workload.itemCount}-after-${cycle + 1}-cycles`));
          writeReport();
        }
      }

      scenario.postCleanup = await collectGarbageAndSample(page, cdp, `${workload.itemCount}-post-cleanup`);
      const heapBase = scenario.baseline.javascriptHeap.usedSizeBytes;
      scenario.heapTrend = {
        baselineUsedBytes: heapBase,
        intermediateDeltasBytes: scenario.intermediate.map((sample: any) => sample.javascriptHeap.usedSizeBytes - heapBase),
        postCleanupDeltaBytes: scenario.postCleanup.javascriptHeap.usedSizeBytes - heapBase,
        leakClassification: 'not inferred from heap delta alone',
      };
      scenario.resourceSummary = {
        cycles: scenario.cycles.length,
        allDisconnectedResourcesReturnedToZero: scenario.cycles.every((cycleResult: CycleResult) =>
          cycleResult.disconnectedResources.scrollListeners === 0
          && cycleResult.disconnectedResources.resizeObservers === 0
          && cycleResult.disconnectedResources.resizeTargets === 0
          && cycleResult.disconnectedResources.resizeCallbacksAfterDisconnect === 0),
        allRendererNodesDisconnected: scenario.cycles.every((cycleResult: CycleResult) =>
          Object.values(cycleResult.rendererResources).every((rendererState) => rendererState.connected === rendererState.disconnected)),
        reconnectedCycles: scenario.cycles.filter((cycleResult: CycleResult) => cycleResult.reconnected).length,
      };
      expect(scenario.resourceSummary.allDisconnectedResourcesReturnedToZero).toBe(true);
      expect(scenario.resourceSummary.allRendererNodesDisconnected).toBe(true);
      writeReport();
    }

    report.status = 'passed';
    report.completedAt = new Date().toISOString();
    writeReport();
    console.info(`[phase-4.6.2b-lifecycle] report: ${OUTPUT_PATH}`);
    console.info(`[phase-4.6.2b-lifecycle] summary: ${JSON.stringify(report.scenarios.map((scenario: any) => ({
      itemCount: scenario.itemCount,
      cycles: scenario.completedCycles,
      heapDeltaBytes: scenario.heapTrend.postCleanupDeltaBytes,
      reconnectedCycles: scenario.resourceSummary.reconnectedCycles,
      resourcesClean: scenario.resourceSummary.allDisconnectedResourcesReturnedToZero,
    })))}`);
  } catch (error) {
    report.status = 'failed';
    report.completedAt = new Date().toISOString();
    report.failure = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : String(error);
    writeReport();
    throw error;
  } finally {
    if (cdp) await cdp.detach();
    await testInfo.attach('phase-4.6.2b-lifecycle-report.json', { path: OUTPUT_PATH, contentType: 'application/json' }).catch(() => undefined);
  }
});
