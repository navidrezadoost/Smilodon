import { execFileSync } from 'node:child_process';
import { arch, cpus, freemem, platform, release, totalmem } from 'node:os';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium, expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test';

const OUTPUT_PATH = resolve(
  process.cwd(),
  process.env.PHASE4_LIFECYCLE_ATTRIBUTION_OUTPUT
    ?? 'test-results/performance/lifecycle/phase-4.6.2b2-attribution.json',
);
const SNAPSHOT_DIRECTORY = resolve(OUTPUT_PATH, '..', 'heap-snapshots');
const WORKLOADS = [1_000, 10_000];
const WARMUP_CYCLES = Number(process.env.PHASE4_ATTRIBUTION_WARMUP_CYCLES ?? 10);
const MEASURED_CYCLES = Number(process.env.PHASE4_ATTRIBUTION_MEASURED_CYCLES ?? 100);
const REPEATS = Number(process.env.PHASE4_ATTRIBUTION_REPEATS ?? 2);
const CAPTURE_PROFILES = process.env.PHASE4_ATTRIBUTION_CAPTURE_PROFILES !== 'false';
const OPEN_COMPONENT = process.env.PHASE4_ATTRIBUTION_OPEN_COMPONENT !== 'false';
const LIST_HEIGHT = 320;
const ROW_HEIGHT = 32;
const PAGE_URL = 'http://localhost:5173/vanilla-demo.html';

type Arm = 'allocation-control' | 'component-no-probe' | 'component-instrumented';

function getGitMetadata(): { commit: string; branch: string; workingTreeDirty: boolean } {
  const read = (args: string[]) => {
    try { return execFileSync('git', args, { encoding: 'utf8' }).trim(); } catch { return 'unknown'; }
  };
  return {
    commit: read(['rev-parse', 'HEAD']),
    branch: read(['branch', '--show-current']),
    workingTreeDirty: read(['status', '--porcelain']) !== '',
  };
}

function deepNodeCount(): number {
  let count = 0;
  const pending: Node[] = [document];
  while (pending.length) {
    const node = pending.pop()!;
    count += 1;
    if (node instanceof Element && node.shadowRoot) pending.push(node.shadowRoot);
    for (const child of Array.from(node.childNodes)) pending.push(child);
  }
  return count;
}

async function installAttributionProbe(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const phase = window as any;
    const hostIds = new WeakMap<Element, number>();
    // This Map intentionally retains counter-only records, never host/component references.
    const stateById = new Map<number, { scrollListeners: number; resizeObservers: number; resizeTargets: number }>();
    const listenerRecords = new WeakMap<EventTarget, Map<EventListenerOrEventListenerObject, Set<boolean>>>();
    let nextId = 0;
    const ensure = (host: Element) => {
      let id = hostIds.get(host);
      if (id === undefined) {
        id = ++nextId;
        hostIds.set(host, id);
        stateById.set(id, { scrollListeners: 0, resizeObservers: 0, resizeTargets: 0 });
      }
      return { id, state: stateById.get(id)! };
    };
    const ownerHost = (target: EventTarget): Element | null => {
      if (!(target instanceof Node)) return null;
      if (target instanceof Element && target.localName === 'enhanced-select') return target;
      const root = target.getRootNode();
      return root instanceof ShadowRoot && root.host.localName === 'enhanced-select' ? root.host : null;
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
        ensure(host).state.scrollListeners += 1;
      }
      records.set(listener, captures);
      listenerRecords.set(this, records);
    } as typeof EventTarget.prototype.addEventListener;
    EventTarget.prototype.removeEventListener = function (this: EventTarget, type: string, listener: any, options?: any) {
      originalRemove.call(this, type, listener, options);
      if (type !== 'scroll' || !listener) return;
      const host = ownerHost(this);
      const captures = listenerRecords.get(this)?.get(listener);
      const capture = typeof options === 'boolean' ? options : Boolean(options?.capture);
      if (!host || !captures?.has(capture)) return;
      captures.delete(capture);
      ensure(host).state.scrollListeners -= 1;
    } as typeof EventTarget.prototype.removeEventListener;

    const NativeResizeObserver = window.ResizeObserver;
    if (NativeResizeObserver) {
      class AttributionResizeObserver extends NativeResizeObserver {
        private readonly targets = new Map<Element, number>();
        private readonly hostCounts = new Map<number, number>();

        constructor(callback: ResizeObserverCallback) {
          super((entries, observer) => callback(entries, observer));
        }

        observe(target: Element, options?: ResizeObserverOptions): void {
          if (!this.targets.has(target)) {
            const host = ownerHost(target);
            if (host) {
              const { id, state } = ensure(host);
              const count = this.hostCounts.get(id) ?? 0;
              this.targets.set(target, id);
              this.hostCounts.set(id, count + 1);
              state.resizeTargets += 1;
              if (count === 0) state.resizeObservers += 1;
            }
          }
          super.observe(target, options);
        }

        unobserve(target: Element): void {
          this.release(target);
          super.unobserve(target);
        }

        disconnect(): void {
          for (const target of this.targets.keys()) this.release(target);
          super.disconnect();
        }

        private release(target: Element): void {
          const id = this.targets.get(target);
          if (id === undefined) return;
          this.targets.delete(target);
          const count = this.hostCounts.get(id) ?? 0;
          const state = stateById.get(id);
          if (state) {
            state.resizeTargets -= 1;
            if (count <= 1) state.resizeObservers -= 1;
          }
          if (count <= 1) this.hostCounts.delete(id);
          else this.hostCounts.set(id, count - 1);
        }
      }
      window.ResizeObserver = AttributionResizeObserver;
    }

    phase.__phase4AttributionProbe = {
      ensure: (host: Element) => ensure(host).id,
      stateById,
      read: (host: Element) => ({ ...ensure(host).state }),
      records: () => stateById.size,
      activeResources: () => Array.from(stateById.values()).reduce((sum, state) => ({
        scrollListeners: sum.scrollListeners + state.scrollListeners,
        resizeObservers: sum.resizeObservers + state.resizeObservers,
        resizeTargets: sum.resizeTargets + state.resizeTargets,
      }), { scrollListeners: 0, resizeObservers: 0, resizeTargets: 0 }),
    };
  });
}

async function preparePage(page: Page, instrumented: boolean): Promise<void> {
  if (instrumented) await installAttributionProbe(page);
  await page.goto(PAGE_URL);
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() => customElements.get('enhanced-select') !== undefined);
  await page.evaluate(() => {
    const phase = window as any;
    phase.__phase4RendererCounts = { created: 0, connected: 0, disconnected: 0 };
    if (!customElements.get('phase4-attribution-renderer')) {
      customElements.define('phase4-attribution-renderer', class extends HTMLElement {
        connectedCallback(): void { phase.__phase4RendererCounts.connected += 1; }
        disconnectedCallback(): void { phase.__phase4RendererCounts.disconnected += 1; }
      });
    }
    phase.__Phase4RetentionSentinel = class Phase4RetentionSentinel {
      constructor(readonly cycleIndex: number) {}
    };
    document.querySelectorAll('enhanced-select').forEach((host) => host.remove());
  });
}

async function runAllocationControl(page: Page, itemCount: number, cycle: number, baselineNodes: number): Promise<any> {
  return page.evaluate(async ({ size, cycleIndex, expectedNodes }) => {
    const waitFrame = () => new Promise<void>((resolveFrame) => requestAnimationFrame(() => resolveFrame()));
    const waitSettled = async () => { await waitFrame(); await waitFrame(); };
    const items = Array.from({ length: size }, (_, index) => ({
      id: `lifecycle-${size}-${index}`,
      value: `value-${index}`,
      label: `Option ${index}`,
    }));
    if (size === 10_000) {
      const counts = ['Option 999', 'Option 9999', ''].map((query) =>
        query ? items.filter((item) => item.label.includes(query)).length : items.length);
      if (counts[0] !== 11 || counts[1] !== 1 || counts[2] !== size) throw new Error(`Control filter mismatch: ${counts}`);
    }
    const transient = document.createElement('div');
    for (let index = 0; index < 12; index += 1) {
      const node = document.createElement('div');
      node.textContent = items[(cycleIndex * 137 + index) % size].label;
      transient.appendChild(node);
    }
    document.body.appendChild(transient);
    await waitSettled();
    transient.remove();
    await waitSettled();
    const deepNodes = (() => {
      let count = 0;
      const pending: Node[] = [document];
      while (pending.length) {
        const node = pending.pop()!;
        count += 1;
        if (node instanceof Element && node.shadowRoot) pending.push(node.shadowRoot);
        for (const child of Array.from(node.childNodes)) pending.push(child);
      }
      return count;
    })();
    if (deepNodes !== expectedNodes) throw new Error(`Allocation-control DOM did not return to baseline: ${deepNodes} !== ${expectedNodes}`);
    return { deepDocumentNodeCount: deepNodes, filterMatchCounts: size === 10_000 ? [11, 1, 10_000] : [], activeInstances: 0 };
  }, { size: itemCount, cycleIndex: cycle, expectedNodes: baselineNodes });
}

async function runComponentCycle(
  page: Page,
  itemCount: number,
  cycle: number,
  baselineNodes: number,
  instrumented: boolean,
  openComponent: boolean,
): Promise<any> {
  return page.evaluate(async ({ size, cycleIndex, expectedNodes, hasProbe, shouldOpen, listHeight, rowHeight }) => {
    const phase = window as any;
    const probe = phase.__phase4AttributionProbe;
    const waitFrame = () => new Promise<void>((resolveFrame) => requestAnimationFrame(() => resolveFrame()));
    const waitSettled = async () => { await waitFrame(); await waitFrame(); };
    const host = document.createElement('enhanced-select') as any;
    host.id = `phase4-attribution-${size}-${cycleIndex}`;
    host.__phase4AttributionSentinel = new phase.__Phase4RetentionSentinel(cycleIndex);
    const rendererBaseline = { ...phase.__phase4RendererCounts };
    if (probe) probe.ensure(host);
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
    const items = Array.from({ length: size }, (_, index) => ({
      id: `lifecycle-${size}-${index}`,
      value: `value-${index}`,
      label: `Option ${index}`,
    }));
    host.setItems(items);
    host._updateGuardedVirtualWindow(0, listHeight);
    host._renderOptions();
    // Exercise renderer replacement once during the warm-up, matching the separate
    // functional lifecycle gate. Repeating it every measured cycle would create
    // per-cycle stylesheet instrumentation noise unrelated to ordinary mount/cleanup.
    if (size === 1_000 && cycleIndex === 0) {
      const renderer = (kind: 'a' | 'b') => (item: { label: string }) => {
        const node = document.createElement('phase4-attribution-renderer');
        node.dataset.renderer = kind;
        node.textContent = item.label;
        phase.__phase4RendererCounts.created += 1;
        return node;
      };
      host.optionRenderer = renderer('a');
      await waitSettled();
      host.optionRenderer = renderer('b');
      await waitSettled();
    }
    document.body.appendChild(host);
    if (shouldOpen) host.open();
    await waitSettled();
    const focusAfterOpen = {
      document: document.activeElement instanceof HTMLElement ? `${document.activeElement.tagName}#${document.activeElement.id}` : null,
      shadow: host.shadowRoot.activeElement instanceof HTMLElement ? `${host.shadowRoot.activeElement.tagName}#${host.shadowRoot.activeElement.id}` : null,
    };

    let filterMatchCounts: number[] = [];
    if (size === 10_000) {
      const input = host.shadowRoot.querySelector('[part="input"]') as HTMLInputElement;
      for (const query of ['Option 999', 'Option 9999', '']) {
        input.value = query;
        input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        filterMatchCounts.push(host._renderPlan.filteredKeys.length);
      }
    }
    const activeIndex = (cycleIndex * 137) % size;
    list.scrollTop = Math.min(activeIndex * rowHeight, size * rowHeight - listHeight);
    list.dispatchEvent(new Event('scroll'));
    await waitFrame();

    (host.shadowRoot.activeElement as HTMLElement | null)?.blur();
    const focusAfterBlur = {
      document: document.activeElement instanceof HTMLElement ? `${document.activeElement.tagName}#${document.activeElement.id}` : null,
      shadow: host.shadowRoot.activeElement instanceof HTMLElement ? `${host.shadowRoot.activeElement.tagName}#${host.shadowRoot.activeElement.id}` : null,
    };
    host.close();
    const focusAfterClose = {
      document: document.activeElement instanceof HTMLElement ? `${document.activeElement.tagName}#${document.activeElement.id}` : null,
      shadow: host.shadowRoot.activeElement instanceof HTMLElement ? `${host.shadowRoot.activeElement.tagName}#${host.shadowRoot.activeElement.id}` : null,
    };
    const priorBodyTabIndex = document.body.getAttribute('tabindex');
    document.body.tabIndex = -1;
    document.body.focus({ preventScroll: true });
    if (priorBodyTabIndex === null) document.body.removeAttribute('tabindex');
    else document.body.setAttribute('tabindex', priorBodyTabIndex);
    const focusAfterBodyHandoff = {
      document: document.activeElement instanceof HTMLElement ? `${document.activeElement.tagName}#${document.activeElement.id}` : null,
      shadow: host.shadowRoot.activeElement instanceof HTMLElement ? `${host.shadowRoot.activeElement.tagName}#${host.shadowRoot.activeElement.id}` : null,
    };
    host.remove();
    await waitSettled();
    const probeResources = probe ? probe.read(host) : null;
    const cleanupState = {
      staticInstanceCount: (customElements.get('enhanced-select') as any)._instances?.size ?? null,
      scrollListenerAttached: host._guardedScrollListenerAttached,
      resizeObserverPresent: Boolean(host._guardedOptionResizeObserver),
      resizeTargetCount: host._guardedObservedOptions?.size ?? null,
      pendingAnimationFrames: host._lifecycleRafs?.size ?? null,
      pendingTimers: host._lifecycleTimers?.size ?? null,
      connectionAborted: !host._connectionController || host._connectionController.signal.aborted,
      rendererConnected: phase.__phase4RendererCounts.connected,
      rendererDisconnected: phase.__phase4RendererCounts.disconnected,
      rendererConnectedDelta: phase.__phase4RendererCounts.connected - rendererBaseline.connected,
      rendererDisconnectedDelta: phase.__phase4RendererCounts.disconnected - rendererBaseline.disconnected,
      registryState: {
        loadedItems: host._state.loadedItems.length,
        records: host._itemRegistry.records.length,
        keyToRecord: host._itemRegistry.keyToRecord.size,
        indexToKey: host._itemRegistry.indexToKey.size,
        keyToIndex: host._itemRegistry.keyToIndex.size,
        filteredKeys: host._renderPlan.filteredKeys.length,
        selectedItems: host._state.selectedItems.size,
      },
      focusedElementAfterCleanup: document.activeElement instanceof HTMLElement
        ? { tagName: document.activeElement.tagName, id: document.activeElement.id }
        : null,
      focusTransitions: { focusAfterOpen, focusAfterBlur, focusAfterClose, focusAfterBodyHandoff },
    };
    let deepNodes = 0;
    const pending: Node[] = [document];
    while (pending.length) {
      const node = pending.pop()!;
      deepNodes += 1;
      if (node instanceof Element && node.shadowRoot) pending.push(node.shadowRoot);
      for (const child of Array.from(node.childNodes)) pending.push(child);
    }
    const mountedAfterDisconnect = host.shadowRoot.querySelectorAll('.options-container > [part="option"]').length;
    const result = {
      deepDocumentNodeCount: deepNodes,
      filterMatchCounts,
      mountedAfterDisconnect,
      cleanupState,
      probeResources,
      activeInstances: cleanupState.staticInstanceCount,
      rendererCreated: phase.__phase4RendererCounts.created,
      rendererConnected: phase.__phase4RendererCounts.connected,
      rendererDisconnected: phase.__phase4RendererCounts.disconnected,
      probeRecordCount: hasProbe ? probe.records() : 0,
    };
    // Drop local references before returning so the cycle's component/data graph can be collected.
    if (deepNodes !== expectedNodes) throw new Error(`Component DOM did not return to baseline: ${deepNodes} !== ${expectedNodes}`);
    if (cleanupState.staticInstanceCount !== 0) throw new Error(`EnhancedSelect._instances retained ${cleanupState.staticInstanceCount} instances after cleanup.`);
    if (cleanupState.scrollListenerAttached || cleanupState.resizeObserverPresent || cleanupState.resizeTargetCount !== 0
      || cleanupState.pendingAnimationFrames !== 0 || cleanupState.pendingTimers !== 0 || !cleanupState.connectionAborted) {
      throw new Error(`Component-owned resources remain after cleanup: ${JSON.stringify(cleanupState)}`);
    }
    if (mountedAfterDisconnect !== 0) throw new Error(`Disconnected host retained ${mountedAfterDisconnect} option nodes.`);
    if (cleanupState.rendererConnectedDelta !== cleanupState.rendererDisconnectedDelta) {
      throw new Error(`Renderer lifecycle counts did not balance: ${JSON.stringify(result)}`);
    }
    if (probeResources && (probeResources.scrollListeners !== 0 || probeResources.resizeObservers !== 0 || probeResources.resizeTargets !== 0)) {
      throw new Error(`Instrumented resources did not return to zero: ${JSON.stringify(probeResources)}`);
    }
    if (size === 10_000 && JSON.stringify(filterMatchCounts) !== '[11,1,10000]') {
      throw new Error(`Component filter mismatch: ${JSON.stringify(filterMatchCounts)}`);
    }
    return result;
  }, {
    size: itemCount,
    cycleIndex: cycle,
    expectedNodes: baselineNodes,
    hasProbe: instrumented,
    shouldOpen: openComponent,
    listHeight: LIST_HEIGHT,
    rowHeight: ROW_HEIGHT,
  });
}

async function sample(page: Page, cdp: any, label: string): Promise<any> {
  for (let index = 0; index < 3; index += 1) {
    await cdp.send('HeapProfiler.collectGarbage');
    await page.waitForTimeout(20);
  }
  const [heap, dom, appState] = await Promise.all([
    cdp.send('Runtime.getHeapUsage'),
    cdp.send('Memory.getDOMCounters'),
    page.evaluate(() => {
      const phase = window as any;
      const constructor = customElements.get('enhanced-select') as any;
      return {
        deepDocumentNodeCount: (() => {
          let count = 0;
          const pending: Node[] = [document];
          while (pending.length) {
            const node = pending.pop()!;
            count += 1;
            if (node instanceof Element && node.shadowRoot) pending.push(node.shadowRoot);
            for (const child of Array.from(node.childNodes)) pending.push(child);
          }
          return count;
        })(),
        enhancedSelectHosts: document.querySelectorAll('enhanced-select').length,
        staticInstanceCount: constructor?._instances?.size ?? null,
        registryEntryPresent: customElements.get('enhanced-select') !== undefined,
        probeRecordCount: phase.__phase4AttributionProbe?.records() ?? 0,
        probeActiveResources: phase.__phase4AttributionProbe?.activeResources() ?? null,
        rendererCounts: { ...phase.__phase4RendererCounts },
        mirroredStylesheetCache: {
          entries: constructor?._mirroredStylesheetTextCache?.size ?? null,
          limit: constructor?._MIRRORED_STYLESHEET_CACHE_LIMIT ?? null,
        },
      };
    }),
  ]);
  return {
    label,
    timestamp: new Date().toISOString(),
    forcedGarbageCollections: 3,
    javascriptHeap: {
      usedSizeBytes: heap.usedSize,
      totalSizeBytes: heap.totalSize,
      embedderHeapUsedSizeBytes: heap.embedderHeapUsedSize,
      backingStorageSizeBytes: heap.backingStorageSize,
      source: 'Chromium CDP Runtime.getHeapUsage after three HeapProfiler.collectGarbage calls; this is JavaScript heap, not browser-process memory.',
    },
    browserDom: { ...dom, ...appState },
  };
}

function analyzeHeapSnapshot(serialized: string): any {
  const snapshot = JSON.parse(serialized);
  const { meta } = snapshot.snapshot;
  const nodeStride = meta.node_fields.length;
  const edgeStride = meta.edge_fields.length;
  const nodeField = Object.fromEntries(meta.node_fields.map((field: string, index: number) => [field, index]));
  const edgeField = Object.fromEntries(meta.edge_fields.map((field: string, index: number) => [field, index]));
  const nodeTypes = meta.node_types[nodeField.type];
  const edgeTypes = meta.edge_types[edgeField.type];
  const nodeCount = snapshot.nodes.length / nodeStride;
  const edgeStarts = new Uint32Array(nodeCount);
  let edgeCursor = 0;
  for (let index = 0; index < nodeCount; index += 1) {
    edgeStarts[index] = edgeCursor;
    edgeCursor += snapshot.nodes[index * nodeStride + nodeField.edge_count] * edgeStride;
  }
  const nodeName = (index: number) => snapshot.strings[snapshot.nodes[index * nodeStride + nodeField.name]] as string;
  const nodeType = (index: number) => nodeTypes[snapshot.nodes[index * nodeStride + nodeField.type]] as string;
  const parent = new Int32Array(nodeCount).fill(-2);
  const incomingEdge = new Array<string>(nodeCount);
  const pending = [0];
  parent[0] = -1;
  let probeNode: number | null = null;

  for (let cursor = 0; cursor < pending.length; cursor += 1) {
    const source = pending[cursor];
    const start = edgeStarts[source];
    const count = snapshot.nodes[source * nodeStride + nodeField.edge_count];
    for (let offset = 0; offset < count; offset += 1) {
      const edge = start + offset * edgeStride;
      const type = edgeTypes[snapshot.edges[edge + edgeField.type]] as string;
      if (type === 'weak') continue;
      const edgeNameOrIndex = snapshot.edges[edge + edgeField.name_or_index];
      const edgeName = type === 'element'
        ? `[${edgeNameOrIndex}]`
        : String(snapshot.strings[edgeNameOrIndex] ?? edgeNameOrIndex);
      const target = snapshot.edges[edge + edgeField.to_node] / nodeStride;
      if (edgeName === '__phase4AttributionProbe') probeNode = target;
      if (parent[target] !== -2) continue;
      parent[target] = source;
      incomingEdge[target] = `${type}:${edgeName}`;
      pending.push(target);
    }
  }

  const pathTo = (target: number): string[] => {
    const path: string[] = [];
    for (let index = target; index !== -1; index = parent[index]) {
      const incoming = incomingEdge[index] ? ` via ${incomingEdge[index]}` : '';
      path.push(`${nodeType(index)}:${nodeName(index)}${incoming}`);
    }
    return path.reverse();
  };
  const patterns: Record<string, { pattern: RegExp; types: string[] }> = {
    enhancedSelectConstructorClosures: { pattern: /^EnhancedSelect$/, types: ['closure'] },
    retentionSentinelInstances: { pattern: /^Phase4RetentionSentinel$/, types: ['object'] },
    stylePropertyMapObjects: { pattern: /StylePropertyMap/, types: ['native'] },
    cssStyleSheetObjects: { pattern: /CSSStyleSheet/, types: ['native'] },
    resizeObserverObjects: { pattern: /ResizeObserver/, types: ['object', 'native'] },
    mutationObserverObjects: { pattern: /MutationObserver/, types: ['object', 'native'] },
    abortControllerObjects: { pattern: /AbortController/, types: ['object', 'native'] },
  };
  const objectCounts: Record<string, number> = Object.fromEntries(Object.keys(patterns).map((key) => [key, 0]));
  const targets: Record<string, number | null> = Object.fromEntries(Object.keys(patterns).map((key) => [key, null]));
  for (let index = 0; index < nodeCount; index += 1) {
    const name = nodeName(index);
    for (const [key, candidate] of Object.entries(patterns)) {
      if (!candidate.types.includes(nodeType(index)) || !candidate.pattern.test(name)) continue;
      objectCounts[key] += 1;
      if (targets[key] === null && parent[index] !== -2) targets[key] = index;
    }
  }

  let stateMapNode: number | null = null;
  if (probeNode !== null) {
    const start = edgeStarts[probeNode];
    const count = snapshot.nodes[probeNode * nodeStride + nodeField.edge_count];
    for (let offset = 0; offset < count; offset += 1) {
      const edge = start + offset * edgeStride;
      if (snapshot.strings[snapshot.edges[edge + edgeField.name_or_index]] === 'stateById') {
        stateMapNode = snapshot.edges[edge + edgeField.to_node] / nodeStride;
        break;
      }
    }
  }

  const retainingPaths: Record<string, string[] | null> = {};
  for (const [key, target] of Object.entries(targets)) retainingPaths[key] = target === null ? null : pathTo(target);
  retainingPaths.instrumentationStateMap = stateMapNode === null ? null : pathTo(stateMapNode);
  return {
    totalNodes: nodeCount,
    candidateObjectCounts: objectCounts,
    sampleStrongRetainingPaths: retainingPaths,
    pathNote: 'Paths come from the captured Chromium heap graph and include browser/Playwright roots. A root through Playwright Streamer._staleStyleSheets is diagnostic tooling retention, not an EnhancedSelect ownership path.',
  };
}

async function captureHeapSnapshot(cdp: any, filePath: string): Promise<any> {
  const chunks: string[] = [];
  const onChunk = (event: { chunk: string }) => chunks.push(event.chunk);
  cdp.on('HeapProfiler.addHeapSnapshotChunk', onChunk);
  try {
    await cdp.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false, captureNumericValue: true });
  } finally {
    cdp.off('HeapProfiler.addHeapSnapshotChunk', onChunk);
  }
  const serialized = chunks.join('');
  mkdirSync(resolve(filePath, '..'), { recursive: true });
  writeFileSync(filePath, serialized);
  // Keep profile files as the source of truth for DevTools retaining-path review.
  return {
    file: filePath,
    bytes: Buffer.byteLength(serialized),
    format: 'Chrome DevTools HeapProfiler .heapsnapshot JSON; inspect retained objects and retaining paths in DevTools Memory panel.',
    analysis: analyzeHeapSnapshot(serialized),
  };
}

async function runSession(browser: Browser, arm: Arm, itemCount: number, repeat: number, captureProfiles: boolean): Promise<any> {
  const context: BrowserContext = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const instrumented = arm === 'component-instrumented';
  const baseName = `${arm}-${itemCount}-${repeat + 1}`;
  let cdp: any;
  try {
    await preparePage(page, instrumented);
    cdp = await context.newCDPSession(page);
    await cdp.send('HeapProfiler.enable');
    const baseline = await page.evaluate(() => ({
      deepDocumentNodeCount: (window as any).__phase4AttributionProbe
        ? (() => {
          let count = 0;
          const pending: Node[] = [document];
          while (pending.length) {
            const node = pending.pop()!;
            count += 1;
            if (node instanceof Element && node.shadowRoot) pending.push(node.shadowRoot);
            for (const child of Array.from(node.childNodes)) pending.push(child);
          }
          return count;
        })()
        : (() => {
          let count = 0;
          const pending: Node[] = [document];
          while (pending.length) {
            const node = pending.pop()!;
            count += 1;
            if (node instanceof Element && node.shadowRoot) pending.push(node.shadowRoot);
            for (const child of Array.from(node.childNodes)) pending.push(child);
          }
          return count;
        })(),
      enhancedSelectHosts: document.querySelectorAll('enhanced-select').length,
    }));
    const report: Record<string, any> = {
      arm,
      itemCount,
      repeat: repeat + 1,
      session: 'isolated Playwright BrowserContext; separate page heap and custom-element registry',
      baseline,
      preWarmup: null,
      afterWarmup: null,
      measuredCheckpoints: [],
      windows: [],
      cleanup: null,
      profiles: [],
      cycles: { warmup: [], measured: [] },
      probeRetentionInterpretation: instrumented
        ? 'The global attribution Map intentionally retains counter-only numeric-ID records. Its count is reported separately; records never contain component references. The known root path is window.__phase4AttributionProbe.stateById → counter record.'
        : 'No attribution resource probe is installed.',
    };

    report.preWarmup = await sample(page, cdp, `${baseName}-pre-warmup`);
    for (let cycle = 0; cycle < WARMUP_CYCLES; cycle += 1) {
      const result = arm === 'allocation-control'
        ? await runAllocationControl(page, itemCount, cycle, baseline.deepDocumentNodeCount)
        : await runComponentCycle(page, itemCount, cycle, baseline.deepDocumentNodeCount, instrumented, OPEN_COMPONENT);
      report.cycles.warmup.push(result);
    }
    if (captureProfiles) {
      const filename = resolve(SNAPSHOT_DIRECTORY, `${baseName}-after-warmup.heapsnapshot`);
      report.profiles.push({ stage: 'after-warmup', ...(await captureHeapSnapshot(cdp, filename)) });
    }
    report.afterWarmup = await sample(page, cdp, `${baseName}-after-warmup`);
    let prior = report.afterWarmup.javascriptHeap.usedSizeBytes;

    for (let cycle = 0; cycle < MEASURED_CYCLES; cycle += 1) {
      const cycleIndex = WARMUP_CYCLES + cycle;
      const result = arm === 'allocation-control'
        ? await runAllocationControl(page, itemCount, cycleIndex, baseline.deepDocumentNodeCount)
        : await runComponentCycle(page, itemCount, cycleIndex, baseline.deepDocumentNodeCount, instrumented, OPEN_COMPONENT);
      report.cycles.measured.push(result);
      if ((cycle + 1) % 25 === 0) {
        const checkpoint = await sample(page, cdp, `${baseName}-after-${cycle + 1}-measured-cycles`);
        report.measuredCheckpoints.push(checkpoint);
        report.windows.push({
          fromMeasuredCycle: cycle + 1 - 25,
          throughMeasuredCycle: cycle + 1,
          heapDeltaBytes: checkpoint.javascriptHeap.usedSizeBytes - prior,
          domNodeDelta: checkpoint.browserDom.nodes - (report.measuredCheckpoints.length === 1
            ? report.afterWarmup.browserDom.nodes
            : report.measuredCheckpoints[report.measuredCheckpoints.length - 2].browserDom.nodes),
          listenerDelta: checkpoint.browserDom.jsEventListeners - (report.measuredCheckpoints.length === 1
            ? report.afterWarmup.browserDom.jsEventListeners
            : report.measuredCheckpoints[report.measuredCheckpoints.length - 2].browserDom.jsEventListeners),
          probeRecordCount: checkpoint.browserDom.probeRecordCount,
          activeProbeResources: checkpoint.browserDom.probeActiveResources,
        });
        prior = checkpoint.javascriptHeap.usedSizeBytes;
      }
    }
    let cleanupProfile: any = null;
    if (captureProfiles) {
      const filename = resolve(SNAPSHOT_DIRECTORY, `${baseName}-after-cleanup.heapsnapshot`);
      cleanupProfile = { stage: 'after-cleanup', ...(await captureHeapSnapshot(cdp, filename)) };
      report.profiles.push(cleanupProfile);
      report.retainedSentinelInstancesAfterCleanup = cleanupProfile.analysis.candidateObjectCounts.retentionSentinelInstances;
    }
    report.cleanup = await sample(page, cdp, `${baseName}-after-cleanup`);
    report.heapDeltas = {
      warmupBytes: report.afterWarmup.javascriptHeap.usedSizeBytes - report.preWarmup.javascriptHeap.usedSizeBytes,
      measuredBytes: report.cleanup.javascriptHeap.usedSizeBytes - report.afterWarmup.javascriptHeap.usedSizeBytes,
      measuredWindowBytes: report.windows.map((window: any) => window.heapDeltaBytes),
      interpretation: 'Descriptive only. No absolute or percentage heap threshold is applied; compare repeated windows and arms alongside DOM, ownership counters, and retained-path profiles.',
    };
    report.domAndOwnership = {
      domReturnedToPreWarmupBaseline: report.cleanup.browserDom.deepDocumentNodeCount === baseline.deepDocumentNodeCount,
      activeInstanceCountAtCleanup: report.cleanup.browserDom.staticInstanceCount,
      connectedHostCountAtCleanup: report.cleanup.browserDom.enhancedSelectHosts,
      customElementRegistryEntryPresent: report.cleanup.browserDom.registryEntryPresent,
      probeRecordsAtCleanup: report.cleanup.browserDom.probeRecordCount,
      activeProbeResourcesAtCleanup: report.cleanup.browserDom.probeActiveResources,
      mirroredStylesheetCache: report.cleanup.browserDom.mirroredStylesheetCache,
      rendererCounts: report.cleanup.browserDom.rendererCounts,
    };
    expect(report.cycles.warmup).toHaveLength(WARMUP_CYCLES);
    expect(report.cycles.measured).toHaveLength(MEASURED_CYCLES);
    expect(report.measuredCheckpoints).toHaveLength(Math.floor(MEASURED_CYCLES / 25));
    expect(report.domAndOwnership.domReturnedToPreWarmupBaseline).toBe(true);
    expect(report.domAndOwnership.activeInstanceCountAtCleanup).toBe(0);
    expect(report.domAndOwnership.connectedHostCountAtCleanup).toBe(0);
    expect(report.domAndOwnership.activeProbeResourcesAtCleanup ?? { scrollListeners: 0, resizeObservers: 0, resizeTargets: 0 })
      .toEqual({ scrollListeners: 0, resizeObservers: 0, resizeTargets: 0 });
    return report;
  } finally {
    if (cdp) await cdp.detach().catch(() => undefined);
    await context.close();
  }
}

test('Phase 4.6.2B.2: isolate warm-up, instrumentation, and retained references', async ({ browser }, testInfo) => {
  test.setTimeout(90 * 60 * 1000);
  mkdirSync(SNAPSHOT_DIRECTORY, { recursive: true });
  const browserManifest = JSON.parse(readFileSync(resolve(process.cwd(), 'node_modules/playwright-core/browsers.json'), 'utf8'));
  const expectedChromium = browserManifest.browsers.find((entry: any) => entry.name === 'chromium');
  const playwrightPackage = JSON.parse(readFileSync(resolve(process.cwd(), 'node_modules/playwright-core/package.json'), 'utf8'));
  const report: Record<string, any> = {
    schemaVersion: 1,
    status: 'running',
    generatedAt: new Date().toISOString(),
    ...getGitMetadata(),
    githubSha: process.env.GITHUB_SHA ?? null,
    nodeVersion: process.version,
    playwrightVersion: playwrightPackage.version,
    browser: {
      engine: 'chromium',
      actualVersion: browser.version(),
      expectedRevision: expectedChromium?.revision ?? null,
      expectedBrowserVersion: expectedChromium?.browserVersion ?? null,
      expectedExecutablePath: chromium.executablePath(),
      resolvedExecutablePath: process.env.PHASE4_LIFECYCLE_EXECUTABLE_PATH ?? chromium.executablePath(),
      executableOverride: process.env.PHASE4_LIFECYCLE_EXECUTABLE_PATH ?? null,
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
      workloads: WORKLOADS.map((itemCount) => ({ itemCount, warmupCycles: WARMUP_CYCLES, measuredCycles: MEASURED_CYCLES, independentRepeats: REPEATS })),
      arms: [
        { name: 'allocation-control', description: 'Creates/releases the identical deterministic item records, filter passes, and 12 transient DOM nodes without mounting EnhancedSelect.' },
        { name: 'component-no-probe', description: 'Runs the same actual EnhancedSelect workload without listener/ResizeObserver instrumentation; the 1k warm-up includes one renderer replacement like the functional lifecycle gate.' },
        { name: 'component-instrumented', description: 'Runs the identical component workload with counter-only listener/ResizeObserver instrumentation matching the existing lifecycle probe design; the 1k warm-up includes one renderer replacement.' },
      ],
      windowComparison: 'Four consecutive 25-cycle post-warm-up windows; first and later windows are reported independently.',
      componentOpenBeforeCleanup: OPEN_COMPONENT,
      snapshots: 'Raw Chrome DevTools heap snapshots after warm-up and after final cleanup, captured on repeat 1 of each arm and workload. Snapshot object summaries are in the .heapsnapshot profile; inspect retaining paths in DevTools Memory panel.',
      heap: 'Three forced Chromium garbage collections before each reported Runtime.getHeapUsage sample; JavaScript heap is not total browser memory.',
      noThresholds: 'No absolute or percentage heap threshold and no leak classification from heap deltas alone.',
      knownProbeOwnershipPath: 'window.__phase4AttributionProbe.stateById → counter-only record (numeric ID and listener/observer counts); it intentionally persists for the page and never points to component hosts.',
      attributionSignals: ['deep open-shadow DOM node count', 'CDP DOM node and listener counts', 'EnhancedSelect._instances', 'item-registry cardinalities after disconnect', 'component-owned listener/observer/task fields at disconnect', 'renderer connect/disconnect counts', 'probe active resource counters and record count', 'mirrored stylesheet cache occupancy', 'raw heap snapshots for retained-object and root-path inspection'],
    },
    sessions: [],
  };
  const writeReport = () => {
    mkdirSync(resolve(OUTPUT_PATH, '..'), { recursive: true });
    writeFileSync(OUTPUT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  };
  writeReport();
  try {
    for (const itemCount of WORKLOADS) {
      for (const repeat of Array.from({ length: REPEATS }, (_, index) => index)) {
        for (const arm of ['allocation-control', 'component-no-probe', 'component-instrumented'] as Arm[]) {
          const session = await runSession(browser, arm, itemCount, repeat, CAPTURE_PROFILES && repeat === 0);
          report.sessions.push(session);
          writeReport();
          console.info(`[phase-4.6.2b2] ${arm} ${itemCount} repeat ${repeat + 1}: ${JSON.stringify({
            warmupBytes: session.heapDeltas.warmupBytes,
            measuredWindows: session.heapDeltas.measuredWindowBytes,
            measuredBytes: session.heapDeltas.measuredBytes,
            dom: session.domAndOwnership,
          })}`);
        }
      }
    }
    report.openFindings = report.sessions
      .filter((session: any) => Number(session.retainedSentinelInstancesAfterCleanup) > 0)
      .map((session: any) => ({
        arm: session.arm,
        itemCount: session.itemCount,
        repeat: session.repeat,
        detachedSentinelInstances: session.retainedSentinelInstancesAfterCleanup,
        sampleRootPath: session.profiles.find((profile: any) => profile.stage === 'after-cleanup')
          ?.analysis.sampleStrongRetainingPaths.retentionSentinelInstances ?? null,
        classification: 'retained component marker detected; root-path interpretation remains under review; no runtime change or heap threshold applied',
      }));
    report.status = report.openFindings.length > 0 ? 'completed-with-findings' : 'passed';
    report.completedAt = new Date().toISOString();
    writeReport();
  } catch (error) {
    report.status = 'failed';
    report.completedAt = new Date().toISOString();
    report.failure = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : String(error);
    writeReport();
    throw error;
  } finally {
    await testInfo.attach('phase-4.6.2b2-attribution.json', { path: OUTPUT_PATH, contentType: 'application/json' }).catch(() => undefined);
  }
});
