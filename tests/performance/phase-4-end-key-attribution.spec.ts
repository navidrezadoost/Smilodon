import { execFileSync } from 'node:child_process';
import { arch, cpus, freemem, platform, release, totalmem } from 'node:os';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { performance as hostPerformance } from 'node:perf_hooks';
import process from 'node:process';
import { devices, expect, test, type Browser, type Page } from '@playwright/test';

type Arm = 'minimal' | 'instrumented';

const ITEM_COUNT = 100_000;
const VIEWPORT = { width: 1280, height: 800 };
const LIST_HEIGHT = 320;
const ITEM_HEIGHT = 40;
const TARGET_INDEX = ITEM_COUNT - 1;
const TIMEOUT_MS = 30_000;
const WARMUP_PAIRS = nonNegativeInteger(process.env.PHASE4_ENDKEY_WARMUPS, 1);
const MEASURED_PAIRS = positiveInteger(process.env.PHASE4_ENDKEY_REPETITIONS, 5);
const STARTING_ARM: Arm = (() => {
  const configuredArm = process.env.PHASE4_ENDKEY_START_ORDER;
  if (configuredArm === 'minimal' || configuredArm === 'instrumented') return configuredArm;
  const workflowRunId = process.env.GITHUB_RUN_ID;
  const replicationId = process.env.PHASE4_ENDKEY_REPLICATION_ID;
  if (workflowRunId && /^\d+$/.test(workflowRunId) && replicationId && /^\d+$/.test(replicationId)) {
    const parity = (Number(workflowRunId.slice(-1)) + Number(replicationId)) % 2;
    return parity === 0 ? 'minimal' : 'instrumented';
  }
  return 'minimal';
})();
const OUTPUT_PATH = resolve(
  process.cwd(),
  process.env.PHASE4_ENDKEY_ATTRIBUTION_OUTPUT
    ?? 'test-results/performance/phase-4.6.2c3b-frame-attribution.json',
);
const BROWSER_MANIFEST = JSON.parse(readFileSync(
  resolve(process.cwd(), 'node_modules/playwright-core/browsers.json'), 'utf8',
));
const EXPECTED_CHROMIUM = BROWSER_MANIFEST.browsers.find((item: any) => item.name === 'chromium');

interface FinalConfirmation {
  activeIndex: number;
  activeKey: string | null;
  activeId: string;
  targetKey: string | null;
  targetIndex: number;
  mountedCount: number;
  visible: boolean;
  now: number;
}

interface FrameEligibilityObservation {
  frameNumber: number;
  frameTimestamp: number;
  observedAt: number;
  targetMounted: boolean;
  visible: boolean;
  active: boolean;
  ariaReferenced: boolean;
  activeIndex: number | null;
  activeKey: string | null;
  targetKey: string | null;
  activeId: string | null;
  targetId: string | null;
  mountedCount: number;
}

interface FrameObserverSnapshot {
  status: 'observing' | 'observed' | 'timed-out' | 'cancelled';
  armedAt: number;
  stoppedAt: number | null;
  targetMountedAt: number | null;
  targetMountedId: string | null;
  frameObservationCount: number;
  firstEligibleFrameAt: number | null;
  firstEligibleFrame: FrameEligibilityObservation | null;
  lastFrameObservation: FrameEligibilityObservation | null;
}

function positiveInteger(raw: string | undefined, fallback: number): number {
  const value = Number(raw);
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

function nonNegativeInteger(raw: string | undefined, fallback: number): number {
  const value = Number(raw);
  return Number.isSafeInteger(value) && value >= 0 ? value : fallback;
}

function quantile(values: number[], p: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(p * sorted.length) - 1)];
}

function describe(values: number[]) {
  return {
    sampleCount: values.length,
    min: values.length ? Math.min(...values) : null,
    max: values.length ? Math.max(...values) : null,
    p50: quantile(values, 0.5),
    p95: quantile(values, 0.95),
    p99: quantile(values, 0.99),
    samples: values,
  };
}

function fixtureFingerprint(): string {
  const hash = createHash('sha256');
  hash.update(`phase-4-end-key-attribution-v1\n${ITEM_COUNT}\n`);
  for (let index = 0; index < ITEM_COUNT; index += 1) {
    hash.update(`option-${index}\tvalue-${index}\tOption ${index}\n`);
  }
  return hash.digest('hex');
}

function gitMetadata() {
  let commit = 'unknown';
  let dirty = null;
  try {
    commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    dirty = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim().length > 0;
  } catch {
    // Keep diagnostics usable from source archives without Git metadata.
  }
  return { commit, workingTreeDirty: dirty };
}

function runnerMetadata(browserVersion: string) {
  return {
    generatedAt: new Date().toISOString(),
    ...gitMetadata(),
    nodeVersion: process.version,
    playwrightVersion: JSON.parse(readFileSync(
      resolve(process.cwd(), 'node_modules/playwright-core/package.json'), 'utf8',
    )).version,
    browser: {
      engine: 'chromium',
      actualVersion: browserVersion,
      expectedVersion: EXPECTED_CHROMIUM?.browserVersion ?? null,
      expectedRevision: EXPECTED_CHROMIUM?.revision ?? null,
      pinnedVersionMatch: browserVersion === EXPECTED_CHROMIUM?.browserVersion,
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
    },
  };
}

function writeReport(report: Record<string, any>) {
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(report, null, 2)}\n`);
}

function summarize(report: Record<string, any>) {
  const complete = report.attempts.filter((item: any) => item.status === 'complete' && !item.warmup);
  const minimal = complete.filter((item: any) => item.arm === 'minimal');
  const instrumented = complete.filter((item: any) => item.arm === 'instrumented');
  const byPair = new Map<number, Record<Arm, any>>();
  for (const attempt of complete) {
    const pair = byPair.get(attempt.pair) ?? {} as Record<Arm, any>;
    pair[attempt.arm as Arm] = attempt;
    byPair.set(attempt.pair, pair);
  }
  const paired = [...byPair.entries()]
    .filter(([, pair]) => pair.minimal && pair.instrumented)
    .sort(([left], [right]) => left - right)
    .map(([pair, values]) => ({
      pair,
      order: report.protocol.pairOrders[pair],
      minimalObservedEndToVisibleMs: values.minimal.metrics.observedEndToVisibleMs,
      instrumentedObservedEndToVisibleMs: values.instrumented.metrics.observedEndToVisibleMs,
      instrumentationOverheadMs: values.instrumented.metrics.observedEndToVisibleMs
        - values.minimal.metrics.observedEndToVisibleMs,
      minimalFirstEligibleFrameLatencyMs: values.minimal.metrics.firstEligibleFrameLatencyMs,
      instrumentedFirstEligibleFrameLatencyMs: values.instrumented.metrics.firstEligibleFrameLatencyMs,
      firstEligibleFrameInstrumentationDifferenceMs: values.instrumented.metrics.firstEligibleFrameLatencyMs
        - values.minimal.metrics.firstEligibleFrameLatencyMs,
      minimalFirstFrameToPlaywrightConfirmationMs: values.minimal.metrics.firstFrameToPlaywrightConfirmationMs,
      instrumentedFirstFrameToPlaywrightConfirmationMs: values.instrumented.metrics.firstFrameToPlaywrightConfirmationMs,
      playwrightConfirmationInstrumentationDifferenceMs: values.instrumented.metrics.observedEndToVisibleMs
        - values.minimal.metrics.observedEndToVisibleMs,
    }));
  const metric = (items: any[], selector: (item: any) => number | null) => describe(
    items.map(selector).filter((value): value is number => Number.isFinite(value)),
  );

  return {
    measuredPairCount: paired.length,
    unpairedCompletedArmCount: complete.length - (paired.length * 2),
    pairedSamplePolicy: 'Only non-warmup pair indexes with both arms status=complete contribute to paired latency and overhead distributions.',
    incompletePairIndexes: [...new Set(report.attempts
      .filter((item: any) => !item.warmup)
      .map((item: any) => item.pair))]
      .filter((pair) => !paired.some((item) => item.pair === pair)),
    minimalObservedEndToVisibleMs: metric(minimal, (item) => item.metrics.observedEndToVisibleMs),
    instrumentedObservedEndToVisibleMs: metric(instrumented, (item) => item.metrics.observedEndToVisibleMs),
    firstEligibleFrameLatencyMs: {
      minimal: metric(minimal, (item) => item.metrics.firstEligibleFrameLatencyMs),
      instrumented: metric(instrumented, (item) => item.metrics.firstEligibleFrameLatencyMs),
    },
    firstFrameToPlaywrightConfirmationMs: {
      minimal: metric(minimal, (item) => item.metrics.firstFrameToPlaywrightConfirmationMs),
      instrumented: metric(instrumented, (item) => item.metrics.firstFrameToPlaywrightConfirmationMs),
    },
    instrumentedPhases: {
      eventToHandlerEntryMs: metric(instrumented, (item) => item.metrics.eventToHandlerEntryMs),
      handlerExecutionMs: metric(instrumented, (item) => item.metrics.handlerExecutionMs),
      activeStateDispatchMs: metric(instrumented, (item) => item.metrics.activeStateDispatchMs),
      materializationTotalMs: metric(instrumented, (item) => item.metrics.materializationTotalMs),
      scrollToKeyCalculationMs: metric(instrumented, (item) => item.metrics.scrollToKeyCalculationMs),
      virtualizerWindowUpdateMs: metric(instrumented, (item) => item.metrics.virtualizerWindowUpdateMs),
      synchronousRenderRebuildMs: metric(instrumented, (item) => item.metrics.synchronousRenderRebuildMs),
      renderToStableLayoutMs: metric(instrumented, (item) => item.metrics.renderToStableLayoutMs),
    },
    eventToComponentHandlerReturnMs: {
      minimal: metric(minimal, (item) => item.metrics.eventToHandlerReturnMs),
      instrumented: metric(instrumented, (item) => item.metrics.eventToHandlerReturnMs),
    },
    instrumentationOverhead: {
      definition: 'Paired instrumented Playwright-confirmed event-to-visible latency minus minimally instrumented Playwright-confirmed latency; includes condition-polling and browser/Playwright observation overhead, and signed values are retained.',
      pairedDifferencesMs: paired.map((item) => item.instrumentationOverheadMs),
      distribution: describe(paired.map((item) => item.instrumentationOverheadMs)),
      pairs: paired,
    },
    firstEligibleFrameInstrumentationDifference: {
      definition: 'Paired instrumented firstEligibleFrameLatencyMs minus minimally instrumented firstEligibleFrameLatencyMs; signed differences are retained. The shared requestAnimationFrame observer itself is present in both arms.',
      pairedDifferencesMs: paired.map((item) => item.firstEligibleFrameInstrumentationDifferenceMs),
      distribution: describe(paired.map((item) => item.firstEligibleFrameInstrumentationDifferenceMs)),
    },
  };
}

async function setupAttempt(page: Page, arm: Arm) {
  const errors: string[] = [];
  const warnings: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
    if (message.type() === 'warning') warnings.push(message.text());
  });
  await page.goto('http://localhost:5173/vanilla-demo.html');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.body.replaceChildren());
  await page.evaluate(({ itemCount, listHeight, itemHeight, instrumented }) => {
    const targetIndex = itemCount - 1;
    const win = window as any;
    const select = document.createElement('enhanced-select') as any;
    select.id = 'phase-4-endkey-attribution-select';
    document.body.appendChild(select);
    select.updateConfig({
      searchable: true,
      estimatedItemHeight: itemHeight,
      selection: { mode: 'single', closeOnSelect: false },
      scrollToSelected: { enabled: false },
    });
    const options = select.shadowRoot.querySelector('.options-container') as HTMLElement;
    const style = document.createElement('style');
    style.textContent = `.options-container > [part="option"] {
      height: ${itemHeight}px !important;
      min-height: ${itemHeight}px;
      max-height: ${itemHeight}px;
      box-sizing: border-box;
    }`;
    select.shadowRoot.appendChild(style);
    options.style.height = `${listHeight}px`;
    options.style.maxHeight = `${listHeight}px`;
    options.style.padding = '0px';
    options.style.overflow = 'auto';
    options.style.scrollBehavior = 'auto';
    select._updateGuardedVirtualWindow(0, listHeight);
    const items = Array.from({ length: itemCount }, (_, index) => ({
      id: `option-${index}`,
      value: `value-${index}`,
      label: `Option ${index}`,
    }));
    select.setItems(items);
    win.__phase4EndKeySelect = select;
    win.__phase4EndKeyEvidence = {
      arm: instrumented ? 'instrumented' : 'minimal',
      inEndKey: false,
      eventCaptureAt: null,
      endEventAt: null,
      endEventCount: 0,
      eventKey: null,
      eventTargetMatchesInput: null,
      handlerEntryAt: null,
      handlerKey: null,
      handlerExitAt: null,
      handlerReturnAt: null,
      frameObserverArmedAt: null,
      targetMountedAt: null,
      firstEligibleFrameAt: null,
      stableGeometryObservedAt: null,
      playwrightConfirmedAt: null,
      layoutStableObservationAt: null,
      finalVisibleAriaObservationAt: null,
      dispatches: [],
      materializations: [],
      scrollToKeyCalls: [],
      windowUpdateCalls: [],
      renderCalls: [],
    };

    const evidence = win.__phase4EndKeyEvidence;
    const input = select.shadowRoot.querySelector('input') as HTMLInputElement;
    input.addEventListener('keydown', (event) => {
      if (event.key !== 'End') return;
      evidence.endEventCount += 1;
      evidence.eventCaptureAt = performance.now();
      evidence.endEventAt = evidence.eventCaptureAt;
      evidence.eventKey = event.key;
      evidence.eventTargetMatchesInput = event.target === input;
      evidence.eventTimeStamp = event.timeStamp;
      evidence.inEndKey = true;
    }, true);
    input.addEventListener('keydown', (event) => {
      if (event.key !== 'End') return;
      evidence.handlerReturnAt = performance.now();
      evidence.inEndKey = false;
    });

    if (!instrumented) return;
    const wrap = (
      target: any,
      method: string,
      callback: (started: number, ended: number, args: any[], result: any, receiver: any, activeIndexBefore: number | null) => void,
    ) => {
      const original = target?.[method];
      if (typeof original !== 'function') throw new Error(`Expected instrumentation method ${method}.`);
      target[method] = function (this: any, ...args: any[]) {
        const active = evidence.inEndKey;
        const started = active ? performance.now() : 0;
        const activeIndexBefore = method === '_dispatchActiveKey'
          ? this._state?.activeIndex ?? null
          : null;
        if (method === '_handleKeydown' && args[0]?.key === 'End') {
          evidence.handlerEntryAt = started;
          evidence.handlerKey = args[0].key;
        }
        let result: any;
        try {
          result = original.apply(this, args);
          return result;
        } finally {
          if (active) callback(started, performance.now(), args, result, this, activeIndexBefore);
          if (method === '_handleKeydown' && args[0]?.key === 'End') evidence.handlerExitAt = performance.now();
        }
      };
    };
    wrap(select, '_handleKeydown', () => {});
    wrap(select, '_dispatchActiveKey', (started, ended, args, _result, receiver, activeIndexBefore) => {
      evidence.dispatches.push({
        startedAt: started,
        endedAt: ended,
        durationMs: ended - started,
        key: args[0],
        reason: args[1],
        activeIndexBefore,
        activeIndexAfter: receiver._state?.activeIndex ?? null,
      });
    });
    wrap(select, '_materializeGuardedVirtualKey', (started, ended, args, result, receiver) => {
      const targetIndex = receiver._renderPlan?.filteredIndexByKey?.get(args[0]) ?? null;
      const options = receiver.shadowRoot?.querySelector('.options-container') as HTMLElement | null;
      evidence.materializations.push({
        startedAt: started,
        endedAt: ended,
        durationMs: ended - started,
        key: args[0],
        targetIndex,
        succeeded: result === true,
        window: receiver._guardedVirtualWindow ? { ...receiver._guardedVirtualWindow } : null,
        targetMounted: Boolean(options?.querySelector(`[data-index="${targetIndex}"]`)),
      });
    });
    wrap(select, '_renderOptions', (started, ended, _args, _result, receiver) => {
      const options = receiver.shadowRoot?.querySelector('.options-container') as HTMLElement | null;
      evidence.renderCalls.push({
        startedAt: started,
        endedAt: ended,
        durationMs: ended - started,
        window: receiver._guardedVirtualWindow ? { ...receiver._guardedVirtualWindow } : null,
        targetMounted: Boolean(options?.querySelector(`[data-index="${targetIndex}"]`)),
      });
    });
    const virtualizer = select._guardedVirtualizer;
    wrap(virtualizer, 'scrollToKey', (started, ended, args, result) => {
      evidence.scrollToKeyCalls.push({
        startedAt: started,
        endedAt: ended,
        durationMs: ended - started,
        key: args[0],
        result: result ? { ...result } : null,
      });
    });
    wrap(virtualizer, 'updateWindow', (started, ended, args, result) => {
      evidence.windowUpdateCalls.push({
        startedAt: started,
        endedAt: ended,
        durationMs: ended - started,
        scrollTop: args[0],
        window: result?.window ? { ...result.window } : null,
      });
    });
  }, { itemCount: ITEM_COUNT, listHeight: LIST_HEIGHT, itemHeight: ITEM_HEIGHT, instrumented: arm === 'instrumented' });
  return { errors, warnings };
}

async function captureFailureReplay(
  browser: Browser,
  arm: Arm,
  pair: number,
  orderIndex: number,
): Promise<Record<string, any>> {
  const artifactDir = resolve(process.cwd(), 'test-results/performance/end-key-attribution');
  mkdirSync(artifactDir, { recursive: true });
  const tracePath = resolve(artifactDir, `pair-${pair}-${arm}-failure-replay.zip`);
  const screenshotPath = resolve(artifactDir, `pair-${pair}-${arm}-failure-replay.png`);
  const context = await browser.newContext({
    ...devices['Desktop Chrome'],
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(TIMEOUT_MS);
  let stage = 'start failure-only traced replay';
  let succeeded = false;
  let replayErrors: string[] = [];
  let traceError: string | null = null;
  try {
    await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
    stage = 'replay fixture setup';
    const diagnostics = await setupAttempt(page, arm);
    replayErrors = diagnostics.errors;
    stage = 'replay initial virtual window settlement';
    await expect.poll(() => page.evaluate((expectedCount) => {
      const select = (window as any).__phase4EndKeySelect;
      const options = select?.shadowRoot?.querySelector('.options-container') as HTMLElement | null;
      return Boolean(select && options && select._renderPlan?.mode === 'virtual-window'
        && select._renderPlan.filteredKeys.length === expectedCount
        && options.querySelectorAll(':scope > [part="option"]').length > 0
        && options.querySelectorAll(':scope > [part="option"]').length <= 64
        && (select._lifecycleRafs?.size ?? 0) === 0);
    }, ITEM_COUNT), { timeout: TIMEOUT_MS, intervals: [10, 20, 50, 100] }).toBe(true);
    stage = 'replay open, Home, End sequence';
    await page.evaluate(() => (window as any).__phase4EndKeySelect.open());
    const input = page.locator('#phase-4-endkey-attribution-select').locator('input');
    await input.focus();
    await input.press('Home');
    await expect.poll(() => page.evaluate(() => (window as any).__phase4EndKeySelect._state.activeIndex), {
      timeout: TIMEOUT_MS,
      intervals: [10, 20, 50, 100],
    }).toBe(0);
    await input.press('End');
    stage = 'replay final visible ARIA confirmation';
    await expect.poll(() => page.evaluate((targetIndex) => {
      const select = (window as any).__phase4EndKeySelect;
      const options = select?.shadowRoot?.querySelector('.options-container') as HTMLElement | null;
      const activeId = select?._input?.getAttribute('aria-activedescendant');
      const target = activeId ? select.shadowRoot.getElementById(activeId) as HTMLElement | null : null;
      const row = target?.getBoundingClientRect();
      const viewport = options?.getBoundingClientRect();
      return select?._state?.activeIndex === targetIndex
        && Number(target?.getAttribute('data-index')) === targetIndex
        && Boolean(row && viewport && row.height > 0 && row.bottom > viewport.top && row.top < viewport.bottom);
    }, TARGET_INDEX), { timeout: TIMEOUT_MS, intervals: [5, 10, 20, 50] }).toBe(true);
    succeeded = replayErrors.length === 0;
    if (replayErrors.length) stage = 'replay browser error check';
  } catch (error) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    stage = `${stage}: ${message}`;
  } finally {
    if (!succeeded) {
      await page.screenshot({ path: screenshotPath, fullPage: true, timeout: 5_000 }).catch(() => undefined);
    }
    await context.tracing.stop({ path: tracePath }).catch((error) => {
      traceError = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    });
    await context.close().catch(() => undefined);
  }
  return {
    measured: false,
    pair,
    orderIndex,
    arm,
    succeeded,
    stage,
    trace: tracePath,
    traceCreated: existsSync(tracePath),
    traceError,
    screenshot: succeeded ? null : screenshotPath,
    screenshotCreated: !succeeded && existsSync(screenshotPath),
    browserErrors: replayErrors,
  };
}

async function captureFailureEvidence(page: Page): Promise<Record<string, any> | null> {
  return page.evaluate(() => {
    const win = window as any;
    const select = win.__phase4EndKeySelect;
    const options = select?.shadowRoot?.querySelector('.options-container') as HTMLElement | null;
    return {
      browserPerformanceNowMs: performance.now(),
      evidence: win.__phase4EndKeyEvidence ?? null,
      browserFrameObservation: win.__phase4EndKeyFrameObserver?.snapshot?.() ?? null,
      component: select ? {
        activeIndex: select._state?.activeIndex ?? null,
        targetKey: select._renderPlan?.filteredKeys?.at(-1) ?? null,
        renderMode: select._renderPlan?.mode ?? null,
        window: select._guardedVirtualWindow ? { ...select._guardedVirtualWindow } : null,
        renderCycleId: select._renderCycleId ?? null,
      } : null,
      options: options ? {
        scrollTop: options.scrollTop,
        scrollHeight: options.scrollHeight,
        clientHeight: options.clientHeight,
        mountedIndexes: Array.from(options.querySelectorAll(':scope > [part="option"]'))
          .map((item) => Number((item as HTMLElement).getAttribute('data-index'))),
      } : null,
    };
  }).catch(() => null);
}

async function armBrowserFrameObserver(page: Page, targetIndex: number) {
  return page.evaluate(({ targetIndex, timeoutMs }) => {
    const win = window as any;
    const select = win.__phase4EndKeySelect;
    const options = select?.shadowRoot?.querySelector('.options-container') as HTMLElement | null;
    const evidence = win.__phase4EndKeyEvidence;
    if (!select || !options || !evidence) throw new Error('Cannot arm frame observer before the select is ready.');
    if (evidence.endEventCount !== 0 || evidence.eventCaptureAt !== null) {
      throw new Error('Frame observer must be armed before the End-key event.');
    }
    if (options.querySelector(`[data-index="${targetIndex}"]`)) {
      throw new Error('Frame observer requires the target option to be initially unmounted.');
    }
    if (win.__phase4EndKeyFrameObserver) throw new Error('Frame observer was already armed for this attempt.');

    const armedAt = performance.now();
    const record: FrameObserverSnapshot = {
      status: 'observing',
      armedAt,
      stoppedAt: null,
      targetMountedAt: null,
      targetMountedId: null,
      frameObservationCount: 0,
      firstEligibleFrameAt: null,
      firstEligibleFrame: null,
      lastFrameObservation: null,
    };
    const targetSelector = `[data-index="${targetIndex}"]`;
    const targetKey = select._renderPlan?.filteredKeys?.[targetIndex] ?? null;
    let animationFrameId: number | null = null;
    let timeoutId: number | null = null;

    const mutationObserver = new MutationObserver((mutations) => {
      if (record.targetMountedAt !== null) return;
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (!(node instanceof Element)) continue;
          const target = node.matches(targetSelector) ? node : node.querySelector(targetSelector);
          if (!target) continue;
          record.targetMountedAt = performance.now();
          record.targetMountedId = target.id || null;
          return;
        }
      }
    });
    mutationObserver.observe(select.shadowRoot, { childList: true, subtree: true });

    const cleanup = () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      mutationObserver.disconnect();
    };
    const finish = (status: FrameObserverSnapshot['status']) => {
      if (record.status !== 'observing') return;
      record.status = status;
      record.stoppedAt = performance.now();
      cleanup();
    };
    const inspectFrame = (frameTimestamp: number) => {
      animationFrameId = null;
      if (record.status !== 'observing') return;

      const target = options.querySelector(targetSelector) as HTMLElement | null;
      const input = select.shadowRoot.querySelector('input') as HTMLInputElement | null;
      const activeId = input?.getAttribute('aria-activedescendant') ?? null;
      const referencedOption = activeId ? select.shadowRoot.getElementById(activeId) : null;
      const row = target?.getBoundingClientRect();
      const viewportRect = options.getBoundingClientRect();
      const viewportLeft = viewportRect.left + options.clientLeft;
      const viewportTop = viewportRect.top + options.clientTop;
      const viewportRight = viewportLeft + options.clientWidth;
      const viewportBottom = viewportTop + options.clientHeight;
      const visible = Boolean(row && row.width > 0 && row.height > 0
        && row.right > viewportLeft && row.left < viewportRight
        && row.bottom > viewportTop && row.top < viewportBottom);
      const activeIndex = Number.isFinite(select._state?.activeIndex)
        ? Number(select._state.activeIndex)
        : null;
      const activeKey = select._engine?.state?.activeKey ?? null;
      const active = activeIndex === targetIndex && activeKey === targetKey;
      const ariaReferenced = Boolean(target && activeId && referencedOption === target);
      const observedAt = performance.now();
      const observation: FrameEligibilityObservation = {
        frameNumber: record.frameObservationCount + 1,
        frameTimestamp,
        observedAt,
        targetMounted: target !== null,
        visible,
        active,
        ariaReferenced,
        activeIndex,
        activeKey,
        targetKey,
        activeId,
        targetId: target?.id || null,
        mountedCount: options.querySelectorAll(':scope > [part="option"]').length,
      };
      record.frameObservationCount += 1;
      record.lastFrameObservation = observation;

      if (observation.targetMounted && visible && active && ariaReferenced) {
        record.firstEligibleFrameAt = observedAt;
        record.firstEligibleFrame = observation;
        finish('observed');
        return;
      }
      if (observedAt - armedAt >= timeoutMs) {
        finish('timed-out');
        return;
      }
      animationFrameId = requestAnimationFrame(inspectFrame);
    };

    animationFrameId = requestAnimationFrame(inspectFrame);
    timeoutId = window.setTimeout(() => finish('timed-out'), timeoutMs);
    win.__phase4EndKeyFrameObserver = {
      record,
      snapshot: () => ({ ...record }),
      cancel: () => {
        if (record.status === 'observing') finish('cancelled');
        else cleanup();
      },
    };
    return { armedAt, initialStatus: record.status };
  }, { targetIndex, timeoutMs: TIMEOUT_MS });
}

async function cancelBrowserFrameObserver(page: Page) {
  await page.evaluate(() => (window as any).__phase4EndKeyFrameObserver?.cancel?.()).catch(() => undefined);
}

async function runArm(browser: Browser, arm: Arm, pair: number, warmup: boolean, orderIndex: number) {
  const startedAt = new Date().toISOString();
  const context = await browser.newContext({
    ...devices['Desktop Chrome'],
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(TIMEOUT_MS);
  let stage = 'playground setup';
  let errors: string[] = [];
  let warnings: string[] = [];
  const playwrightPollObservations: Array<Record<string, any>> = [];
  const pollCounts = new Map<string, number>();
  const observePlaywrightPoll = async <T>(phase: string, read: () => Promise<T>): Promise<T> => {
    const observationIndex = (pollCounts.get(phase) ?? 0) + 1;
    pollCounts.set(phase, observationIndex);
    const hostStartedAt = new Date().toISOString();
    const hostStarted = hostPerformance.now();
    try {
      const result = await read();
      const hostFinished = hostPerformance.now();
      const hostFinishedAt = new Date().toISOString();
      const resultRecord = result && typeof result === 'object'
        ? result as unknown as Record<string, any>
        : null;
      playwrightPollObservations.push({
        phase,
        observationIndex,
        hostStartedAt,
        hostFinishedAt,
        hostRoundTripMs: hostFinished - hostStarted,
        browserObservedAtMs: resultRecord?.browserObservedAtMs
          ?? resultRecord?.observedAt
          ?? resultRecord?.now
          ?? null,
        outcome: 'observed',
        result,
      });
      return result;
    } catch (error) {
      playwrightPollObservations.push({
        phase,
        observationIndex,
        hostStartedAt,
        hostFinishedAt: new Date().toISOString(),
        hostRoundTripMs: hostPerformance.now() - hostStarted,
        browserObservedAtMs: null,
        outcome: 'error',
        error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
      });
      throw error;
    }
  };
  try {
    const browserDiagnostics = await setupAttempt(page, arm);
    errors = browserDiagnostics.errors;
    warnings = browserDiagnostics.warnings;
    stage = 'initial virtual window settlement';
    await expect.poll(async () => {
      const observation = await observePlaywrightPoll('initial-virtual-window', () => page.evaluate((expectedCount) => {
        const select = (window as any).__phase4EndKeySelect;
        const options = select?.shadowRoot?.querySelector('.options-container') as HTMLElement | null;
        const settled = Boolean(select && options && select._renderPlan?.mode === 'virtual-window'
          && select._renderPlan.filteredKeys.length === expectedCount
          && options.querySelectorAll(':scope > [part="option"]').length > 0
          && options.querySelectorAll(':scope > [part="option"]').length <= 64
          && (select._lifecycleRafs?.size ?? 0) === 0);
        return { browserObservedAtMs: performance.now(), settled };
      }, ITEM_COUNT));
      return observation.settled;
    }, { timeout: TIMEOUT_MS, intervals: [10, 20, 50, 100] }).toBe(true);
    stage = 'open and deterministic Home navigation';
    await page.evaluate(() => (window as any).__phase4EndKeySelect.open());
    const input = page.locator('#phase-4-endkey-attribution-select').locator('input');
    await input.focus();
    await input.press('Home');
    await expect.poll(async () => {
      const observation = await observePlaywrightPoll('home-active-state', () => page.evaluate(() => {
        const select = (window as any).__phase4EndKeySelect;
        return { browserObservedAtMs: performance.now(), activeIndex: select._state.activeIndex };
      }));
      return observation.activeIndex;
    }, {
      timeout: TIMEOUT_MS,
      intervals: [10, 20, 50, 100],
    }).toBe(0);
    const beforeEnd = await page.evaluate((targetIndex) => {
      const select = (window as any).__phase4EndKeySelect;
      return {
        activeIndex: select._state.activeIndex,
        targetMounted: Boolean(select.shadowRoot.querySelector(`[data-index="${targetIndex}"]`)),
      };
    }, TARGET_INDEX);
    expect(beforeEnd.activeIndex).toBe(0);
    expect(beforeEnd.targetMounted).toBe(false);

    stage = 'arm browser requestAnimationFrame observer';
    const frameObserverArm = await armBrowserFrameObserver(page, TARGET_INDEX);
    await page.evaluate((armedAt) => {
      (window as any).__phase4EndKeyEvidence.frameObserverArmedAt = armedAt;
    }, frameObserverArm.armedAt);
    stage = 'End-key event and handler';
    await input.press('End');
    stage = 'first eligible browser animation frame';
    await expect.poll(async () => {
      const observation = await observePlaywrightPoll('browser-frame-observer', () => page.evaluate(() => {
        const observer = (window as any).__phase4EndKeyFrameObserver;
        const snapshot = observer?.snapshot?.() as FrameObserverSnapshot | undefined;
        return {
          browserObservedAtMs: performance.now(),
          status: snapshot?.status ?? 'missing',
          terminal: !snapshot || snapshot.status !== 'observing',
          targetMountedAt: snapshot?.targetMountedAt ?? null,
          firstEligibleFrameAt: snapshot?.firstEligibleFrameAt ?? null,
          frameObservationCount: snapshot?.frameObservationCount ?? 0,
          lastFrameObservation: snapshot?.lastFrameObservation ?? null,
        };
      }));
      return observation.terminal;
    }, { timeout: TIMEOUT_MS, intervals: [5, 10, 20, 50] }).toBe(true);
    const frameObserverSnapshot: FrameObserverSnapshot | null = await page.evaluate(() => {
      const observer = (window as any).__phase4EndKeyFrameObserver;
      return observer?.snapshot?.() ?? null;
    });
    if (frameObserverSnapshot === null) throw new Error('Browser requestAnimationFrame observer did not retain a result.');
    await page.evaluate((snapshot) => {
      const evidence = (window as any).__phase4EndKeyEvidence;
      evidence.targetMountedAt = snapshot.targetMountedAt;
      evidence.firstEligibleFrameAt = snapshot.firstEligibleFrameAt;
      evidence.firstEligibleFrame = snapshot.firstEligibleFrame;
      evidence.frameObserverStatus = snapshot.status;
    }, frameObserverSnapshot);
    expect(frameObserverSnapshot.status, 'bounded browser frame observer reached an eligible frame').toBe('observed');
    expect(frameObserverSnapshot.armedAt).toBe(frameObserverArm.armedAt);
    expect(frameObserverSnapshot.targetMountedAt).toEqual(expect.any(Number));
    expect(frameObserverSnapshot.firstEligibleFrameAt).toEqual(expect.any(Number));
    expect(frameObserverSnapshot.firstEligibleFrame?.targetMounted).toBe(true);
    expect(frameObserverSnapshot.firstEligibleFrame?.visible).toBe(true);
    expect(frameObserverSnapshot.firstEligibleFrame?.active).toBe(true);
    expect(frameObserverSnapshot.firstEligibleFrame?.ariaReferenced).toBe(true);
    expect(frameObserverSnapshot.firstEligibleFrame?.mountedCount).toBeLessThanOrEqual(64);
    const targetMountedAt = frameObserverSnapshot.targetMountedAt;
    const firstEligibleFrameAt = frameObserverSnapshot.firstEligibleFrameAt;
    if (targetMountedAt === null || firstEligibleFrameAt === null) {
      throw new Error('Eligible frame observation is missing its required mount/frame timestamp.');
    }
    stage = 'stable rendered target geometry';
    let previousGeometry = '';
    let stablePolls = 0;
    let layoutObservationCount = 0;
    let stableGeometryObservedAt: number | null = null;
    await expect.poll(async () => {
      layoutObservationCount += 1;
      const observation = await observePlaywrightPoll('stable-geometry', async () => {
        const browserObservation = await page.evaluate((targetIndex) => {
          const win = window as any;
          const select = win.__phase4EndKeySelect;
          const options = select?.shadowRoot?.querySelector('.options-container') as HTMLElement | null;
          const target = options?.querySelector(`[data-index="${targetIndex}"]`) as HTMLElement | null;
          if (!options || !target) return { mounted: false, visible: false, signature: '', now: performance.now() };
          const row = target.getBoundingClientRect();
          const viewport = options.getBoundingClientRect();
          const visible = row.height > 0 && row.bottom > viewport.top && row.top < viewport.bottom;
          const signature = [row.top, row.bottom, row.width, row.height, options.scrollTop]
            .map((value) => Math.round(value * 100) / 100).join(':');
          return { mounted: true, visible, signature, now: performance.now() };
        }, TARGET_INDEX);
        if (!browserObservation.mounted || !browserObservation.visible) {
          previousGeometry = '';
          stablePolls = 0;
        } else {
          stablePolls = browserObservation.signature === previousGeometry ? stablePolls + 1 : 1;
          previousGeometry = browserObservation.signature;
        }
        return {
          ...browserObservation,
          browserObservedAtMs: browserObservation.now,
          stablePollCount: stablePolls,
          stable: browserObservation.mounted && browserObservation.visible && stablePolls >= 2,
        };
      });
      if (observation.stable) stableGeometryObservedAt = observation.now;
      return observation.stable;
    }, { timeout: TIMEOUT_MS, intervals: [5, 10, 20, 50] }).toBe(true);
    await page.evaluate((observedAt) => {
      const evidence = (window as any).__phase4EndKeyEvidence;
      evidence.stableGeometryObservedAt = observedAt;
      evidence.layoutStableObservationAt = observedAt;
    }, stableGeometryObservedAt);

    stage = 'final visible and ARIA target confirmation';
    let ariaConfirmationObservationCount = 0;
    await expect.poll(async () => {
      ariaConfirmationObservationCount += 1;
      const observation = await observePlaywrightPoll('final-visible-aria', () => page.evaluate((targetIndex) => {
        const win = window as any;
        const select = win.__phase4EndKeySelect;
        const inputElement = select?._input as HTMLInputElement | undefined;
        const options = select?.shadowRoot?.querySelector('.options-container') as HTMLElement | null;
        const activeId = inputElement?.getAttribute('aria-activedescendant') ?? null;
        const target = activeId ? select.shadowRoot.getElementById(activeId) as HTMLElement | null : null;
        const row = target?.getBoundingClientRect();
        const viewport = options?.getBoundingClientRect();
        const visible = Boolean(row && viewport && row.height > 0
          && row.bottom > viewport.top && row.top < viewport.bottom);
        const targetKey = select?._renderPlan?.filteredKeys?.[targetIndex] ?? null;
        const activeKey = select?._engine?.state?.activeKey ?? null;
        const confirmed = select?._state?.activeIndex === targetIndex
            && activeKey === targetKey
            && Number(target?.getAttribute('data-index')) === targetIndex
            && visible;
        const now = performance.now();
        if (confirmed) {
          win.__phase4EndKeyEvidence.finalVisibleAriaObservationAt = now;
          win.__phase4EndKeyEvidence.playwrightConfirmedAt = now;
        }
        if (confirmed && activeId && target) {
          win.__phase4EndKeyEvidence.finalVisibleAriaConfirmation = {
            activeIndex: Number(select._state.activeIndex),
            activeKey,
            activeId,
            targetKey,
            targetIndex: Number(target.getAttribute('data-index')),
            mountedCount: options?.querySelectorAll(':scope > [part="option"]').length ?? 0,
            visible,
            now,
          };
        }
        return {
          confirmed,
          activeIndex: select?._state?.activeIndex ?? null,
          activeKey,
          activeId,
          targetKey,
          targetIndex: target ? Number(target.getAttribute('data-index')) : null,
          mountedCount: options?.querySelectorAll(':scope > [part="option"]').length ?? null,
          visible,
          browserObservedAtMs: now,
        };
      }, TARGET_INDEX));
      return observation.confirmed;
    }, { timeout: TIMEOUT_MS, intervals: [5, 10, 20, 50] }).toBe(true);
    const finalConfirmation: FinalConfirmation | null = await page.evaluate(() => {
      const win = window as Window & {
        __phase4EndKeyEvidence?: {
          finalVisibleAriaConfirmation?: FinalConfirmation;
        };
      };
      return win.__phase4EndKeyEvidence?.finalVisibleAriaConfirmation ?? null;
    });
    if (finalConfirmation === null) {
      throw new Error('Final visible and ARIA confirmation was not retained after successful polling.');
    }

    const browserEvidence = await page.evaluate(() => {
      const win = window as any;
      const select = win.__phase4EndKeySelect;
      const options = select.shadowRoot.querySelector('.options-container') as HTMLElement;
      return {
        evidence: win.__phase4EndKeyEvidence,
        scrollHeight: options.scrollHeight,
        clientHeight: options.clientHeight,
        scrollTop: options.scrollTop,
        activeIndex: select._state.activeIndex,
        activeKey: select._engine?.state?.activeKey ?? null,
        targetKey: select._renderPlan.filteredKeys[select._renderPlan.filteredKeys.length - 1],
        itemCount: select._renderPlan.filteredKeys.length,
        renderCycleId: select._renderCycleId,
        pendingLifecycleRafs: select._lifecycleRafs?.size ?? null,
        optionCount: options.querySelectorAll(':scope > [part="option"]').length,
      };
    });
    const evidence = browserEvidence.evidence;
    const eventStart = evidence.endEventAt;
    const eventReturn = evidence.handlerReturnAt;
    const endKeyRender = evidence.renderCalls.at(-1) ?? null;
    const targetKey = browserEvidence.targetKey;
    const sumDuration = (calls: Array<{ durationMs: number }>) => calls.reduce((sum, call) => sum + call.durationMs, 0);
    const metrics = {
      eventToHandlerEntryMs: Number.isFinite(evidence.handlerEntryAt) ? evidence.handlerEntryAt - eventStart : null,
      handlerExecutionMs: Number.isFinite(evidence.handlerEntryAt) && Number.isFinite(evidence.handlerExitAt)
        ? evidence.handlerExitAt - evidence.handlerEntryAt : null,
      eventToHandlerReturnMs: Number.isFinite(eventReturn) ? eventReturn - eventStart : null,
      activeStateDispatchMs: arm === 'instrumented' ? sumDuration(evidence.dispatches) : null,
      materializationTotalMs: arm === 'instrumented' ? sumDuration(evidence.materializations) : null,
      scrollToKeyCalculationMs: arm === 'instrumented' ? sumDuration(evidence.scrollToKeyCalls) : null,
      virtualizerWindowUpdateMs: arm === 'instrumented' ? sumDuration(evidence.windowUpdateCalls) : null,
      synchronousRenderRebuildMs: arm === 'instrumented' ? sumDuration(evidence.renderCalls) : null,
      renderToStableLayoutMs: endKeyRender && Number.isFinite(stableGeometryObservedAt)
        ? stableGeometryObservedAt! - endKeyRender.endedAt : null,
      layoutStableFromEventMs: Number.isFinite(stableGeometryObservedAt)
        ? stableGeometryObservedAt! - eventStart : null,
      firstEligibleFrameLatencyMs: Number.isFinite(firstEligibleFrameAt)
        ? firstEligibleFrameAt - eventStart : null,
      firstFrameToPlaywrightConfirmationMs: Number.isFinite(finalConfirmation.now)
        && Number.isFinite(firstEligibleFrameAt)
        ? finalConfirmation.now - firstEligibleFrameAt : null,
      observedEndToVisibleMs: finalConfirmation && Number.isFinite(finalConfirmation.now)
        ? finalConfirmation.now - eventStart : null,
    };
    expect(frameObserverArm.armedAt).toBeLessThanOrEqual(evidence.endEventAt);
    expect(targetMountedAt).toBeGreaterThanOrEqual(evidence.endEventAt);
    expect(targetMountedAt).toBeLessThanOrEqual(firstEligibleFrameAt);
    expect(firstEligibleFrameAt).toBeGreaterThanOrEqual(evidence.endEventAt);
    expect(browserEvidence.activeIndex).toBe(TARGET_INDEX);
    expect(browserEvidence.activeKey).toBe(targetKey);
    expect(finalConfirmation.activeIndex).toBe(TARGET_INDEX);
    expect(finalConfirmation.activeKey).toBe(targetKey);
    expect(finalConfirmation.targetKey).toBe(targetKey);
    expect(finalConfirmation.activeId).toBeTruthy();
    expect(finalConfirmation.targetIndex).toBe(TARGET_INDEX);
    expect(finalConfirmation.visible).toBe(true);
    expect(browserEvidence.optionCount).toBeLessThanOrEqual(64);
    expect(browserEvidence.scrollHeight).toBeGreaterThan(browserEvidence.clientHeight);
    expect(evidence.eventCaptureAt).toEqual(expect.any(Number));
    expect(evidence.endEventAt).toEqual(expect.any(Number));
    expect(evidence.endEventCount).toBe(1);
    expect(evidence.handlerReturnAt).toEqual(expect.any(Number));
    expect(evidence.eventKey).toBe('End');
    expect(evidence.eventTargetMatchesInput).toBe(true);
    expect(evidence.layoutStableObservationAt).toEqual(expect.any(Number));
    expect(evidence.stableGeometryObservedAt).toEqual(expect.any(Number));
    expect(evidence.finalVisibleAriaObservationAt).toEqual(expect.any(Number));
    expect(evidence.playwrightConfirmedAt).toEqual(expect.any(Number));
    if (arm === 'instrumented') {
      const handlerIntercepted = evidence.handlerKey === 'End'
        && Number.isFinite(evidence.handlerEntryAt)
        && Number.isFinite(evidence.handlerExitAt)
        && evidence.handlerEntryAt <= evidence.handlerExitAt;
      const activeStateTransition = evidence.dispatches.some((call: any) => (
        call.key === targetKey && call.activeIndexBefore === 0 && call.activeIndexAfter === TARGET_INDEX
      ));
      const targetMaterialized = evidence.materializations.some((call: any) => (
        call.key === targetKey
        && call.targetIndex === TARGET_INDEX
        && call.succeeded
        && call.targetMounted
        && call.window?.startIndex <= TARGET_INDEX
        && TARGET_INDEX < call.window?.endIndex
      ));
      const targetWindowUpdated = evidence.windowUpdateCalls.some((call: any) => (
        call.window?.startIndex <= TARGET_INDEX && TARGET_INDEX <= call.window?.endIndex
      ));
      const targetRendered = evidence.renderCalls.some((call: any) => (
        call.targetMounted
        && call.window?.startIndex <= TARGET_INDEX
        && TARGET_INDEX < call.window?.endIndex
      ));
      const targetScrollCalculated = evidence.scrollToKeyCalls.some((call: any) => (
        call.key === targetKey && call.result?.index === TARGET_INDEX
      ));
      const interceptionEvidence = {
        handlerIntercepted,
        activeStateTransition,
        targetScrollCalculated,
        targetWindowUpdated,
        targetMaterialized,
        targetRendered,
      };
      expect(interceptionEvidence.handlerIntercepted, 'instance wrapper intercepted the actual End event handler').toBe(true);
      expect(interceptionEvidence.activeStateTransition, 'End dispatch changed active index from first to final option').toBe(true);
      expect(interceptionEvidence.targetScrollCalculated, 'virtualizer calculated a scroll target for the final key').toBe(true);
      expect(interceptionEvidence.targetWindowUpdated, 'virtualizer window update includes the final option').toBe(true);
      expect(interceptionEvidence.targetMaterialized, 'component materialized and mounted the final option').toBe(true);
      expect(interceptionEvidence.targetRendered, 'render method recorded the final option in its window').toBe(true);
      (browserEvidence as any).instrumentationVerification = interceptionEvidence;
    }
    expect(errors).toEqual([]);

    return {
      pair,
      warmup,
      orderIndex,
      arm,
      status: 'complete',
      startedAt,
      endedAt: new Date().toISOString(),
      metrics,
      timestamps: {
        browserPerformanceNowMs: {
          endEventAt: evidence.endEventAt,
          handlerReturnAt: evidence.handlerReturnAt,
          targetMountedAt: frameObserverSnapshot.targetMountedAt,
          firstEligibleFrameAt: frameObserverSnapshot.firstEligibleFrameAt,
          stableGeometryObservedAt,
          playwrightConfirmedAt: finalConfirmation.now,
          endEventCapture: evidence.eventCaptureAt,
          componentHandlerEntry: evidence.handlerEntryAt,
          componentHandlerExit: evidence.handlerExitAt,
          eventTargetHandlerReturn: evidence.handlerReturnAt,
          stableGeometryObservation: evidence.layoutStableObservationAt,
          visibleAriaConfirmationObservation: evidence.finalVisibleAriaObservationAt,
        },
        playwrightSide: {
          attemptStartedAt: startedAt,
          attemptEndedAt: new Date().toISOString(),
          layoutPollObservations: layoutObservationCount,
          ariaPollObservations: ariaConfirmationObservationCount,
          pollObservationCount: playwrightPollObservations.length,
          pollObservations: playwrightPollObservations,
        },
      },
      correctness: {
        expectedTargetIndex: TARGET_INDEX,
        targetKey,
        activeKey: browserEvidence.activeKey,
        endKeyEventCount: evidence.endEventCount,
        itemCount: browserEvidence.itemCount,
        activeIndex: browserEvidence.activeIndex,
        ariaTargetIndex: finalConfirmation?.targetIndex,
        ariaTargetKey: finalConfirmation?.targetKey,
        ariaActiveDescendant: finalConfirmation?.activeId,
        targetVisible: finalConfirmation?.visible,
        mountedOptionCount: browserEvidence.optionCount,
        virtualScrollHeight: browserEvidence.scrollHeight,
        viewportHeight: browserEvidence.clientHeight,
        scrollTop: browserEvidence.scrollTop,
        pendingLifecycleRafs: browserEvidence.pendingLifecycleRafs,
        renderCycleId: browserEvidence.renderCycleId,
        browserErrors: errors,
        browserWarnings: warnings,
        instrumentationVerification: (browserEvidence as any).instrumentationVerification ?? null,
      },
      browserFrameObservation: frameObserverSnapshot,
      instrumentation: arm === 'instrumented' ? evidence : null,
    };
  } catch (error) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    const artifactDir = resolve(process.cwd(), 'test-results/performance/end-key-attribution');
    mkdirSync(artifactDir, { recursive: true });
    const screenshotPath = resolve(artifactDir, `pair-${pair}-${arm}-failure.png`);
    await cancelBrowserFrameObserver(page);
    const evidence = await captureFailureEvidence(page);
    await page.screenshot({ path: screenshotPath, fullPage: true, timeout: 5_000 }).catch(() => undefined);
    const tracedReplay = await captureFailureReplay(browser, arm, pair, orderIndex).catch((replayError) => ({
      measured: false,
      pair,
      orderIndex,
      arm,
      succeeded: false,
      stage: 'failure-only traced replay setup failed',
      error: replayError instanceof Error ? `${replayError.name}: ${replayError.message}` : String(replayError),
      trace: null,
      screenshot: null,
    }));
    return {
      pair,
      warmup,
      orderIndex,
      arm,
      status: 'failed',
      startedAt,
      endedAt: new Date().toISOString(),
      failure: {
        stage,
        error: message,
        screenshot: screenshotPath,
        evidence,
        playwrightPollObservations,
        tracedReplay,
      },
      browserErrors: errors,
      browserWarnings: warnings,
    };
  } finally {
    await cancelBrowserFrameObserver(page);
    await context.close().catch(() => undefined);
  }
}

test('Phase 4.6.2C.3B attributes 100k End-key latency to browser-frame and Playwright observations', async ({ browser }, testInfo) => {
  test.setTimeout(60 * 60 * 1000);
  const browserVersion = browser.version();
  const metadata = runnerMetadata(browserVersion);
  const pinned = browserVersion === EXPECTED_CHROMIUM?.browserVersion;
  const pairOrders = Array.from({ length: WARMUP_PAIRS + MEASURED_PAIRS }, (_, pair) => (
    pair % 2 === 0
      ? [STARTING_ARM, STARTING_ARM === 'minimal' ? 'instrumented' : 'minimal']
      : [STARTING_ARM === 'minimal' ? 'instrumented' : 'minimal', STARTING_ARM]
  ));
  const report: Record<string, any> = {
    schemaVersion: 2,
    phase: '4.6.2C.3B',
    completionStatus: 'in-progress',
    environment: metadata,
    replication: {
      workflowRunId: process.env.GITHUB_RUN_ID ?? null,
      workflowRunAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
      workflowSha: process.env.GITHUB_SHA ?? null,
      replicationId: process.env.PHASE4_ENDKEY_REPLICATION_ID ?? null,
      sourceRunKey: process.env.GITHUB_RUN_ID && process.env.GITHUB_RUN_ATTEMPT && process.env.PHASE4_ENDKEY_REPLICATION_ID
        ? `${process.env.GITHUB_RUN_ID}.${process.env.GITHUB_RUN_ATTEMPT}.${process.env.PHASE4_ENDKEY_REPLICATION_ID}`
        : null,
    },
    protocol: {
      warmupPairs: WARMUP_PAIRS,
      measuredPairs: MEASURED_PAIRS,
      arms: ['minimal', 'instrumented'],
      startingArm: STARTING_ARM,
      pairOrders,
      viewport: { ...VIEWPORT, deviceScaleFactor: 1 },
      listViewportHeight: LIST_HEIGHT,
      itemCount: ITEM_COUNT,
      itemHeightPx: ITEM_HEIGHT,
      datasetRecipe: 'id=option-${i}, value=value-${i}, label=Option ${i}; i in [0, 99999]',
      datasetSha256: fixtureFingerprint(),
      navigationSequence: ['create and configure EnhancedSelect', 'set 100000 deterministic items', 'open', 'focus input', 'Home', 'End'],
      renderMode: 'private guarded virtual-window test seam; public default unchanged',
      phaseBoundaries: {
        endEventAt: 'Browser performance.now timestamp in the input capture listener for the single End keydown.',
        handlerEntry: 'Instrumented arm only: entry into the instance-wrapped component _handleKeydown for the single captured End key event targeting the input.',
        handlerExecution: 'Instrumented arm only: _handleKeydown entry through synchronous method return.',
        handlerReturnAt: 'Browser performance.now timestamp in the input bubble listener after synchronous End-key target handlers return.',
        activeStateDispatch: 'Instrumented arm only: duration of _dispatchActiveKey, including engine effects and compatibility/ARIA synchronization; records before/after active indexes and target key.',
        windowCalculation: 'Instrumented arm only: Virtualizer.scrollToKey and updateWindow method durations during End dispatch, with returned target index and virtual window bounds.',
        targetMounting: 'Instrumented arm only: confirms the component materialization method returns true and both it and _renderOptions observe option 99,999 mounted in the reported virtual window.',
        synchronousRenderRebuild: 'Instrumented arm only: summed synchronous _renderOptions method duration; includes render bookkeeping as well as DOM creation/mounting.',
        targetMountedAt: 'First MutationObserver callback timestamp that observes option 99,999 inserted beneath the component shadow root; this is an observed insertion timestamp, not a paint timestamp.',
        firstEligibleFrameLatencyMs: 'endEventAt to the browser requestAnimationFrame callback that first observes the final option mounted, geometrically intersecting the list viewport, active by index and key, and referenced by aria-activedescendant. This is a frame observation, not paint or pixel-presentation time.',
        layoutSettlement: 'Target is mounted and visible with an unchanged bounding-box/scrollTop signature across two bounded expect.poll observations.',
        stableGeometryObservedAt: 'Browser performance.now timestamp returned by the Playwright poll observation that completes the two-sample stable-geometry condition.',
        playwrightConfirmedAt: 'Browser performance.now timestamp inside the successful Playwright poll evaluation confirming final active index/key, visible target, and valid aria-activedescendant; host round-trip timestamps are also retained for every poll observation.',
        finalVisibleAriaConfirmation: 'Observed confirmation: final active index/key are 99999/option-99999, aria-activedescendant resolves to that option, and its rectangle intersects the 320px options viewport; poll/communication delay is included.',
      },
      instrumentationComparison: 'Each paired arm uses identical deterministic data, browser revision, viewport, configuration, and open/focus/Home/End sequence. Arm order alternates by pair. Both arms use the same browser-resident requestAnimationFrame/MutationObserver and Playwright polling observations; the instrumented arm additionally wraps the named private methods. Signed paired differences are reported for firstEligibleFrameLatencyMs and Playwright-confirmed observedEndToVisibleMs; instrumentation differences are diagnostics, not corrections subtracted from phase timings.',
      pollObservationProtocol: 'Every expect.poll evaluation in a measured attempt records its phase, per-phase observation index, host start/end timestamps, host round-trip duration, browser performance.now timestamp when available, and observed result/outcome. The bounded frame observer stops after the first eligible callback or a 30-second timeout and is explicitly cancelled during attempt teardown.',
      measurementTerminology: 'firstEligibleFrameLatencyMs ends at the first eligible requestAnimationFrame observation. It does not establish actual paint, compositing, or pixel presentation. playwrightConfirmedAt is a later Playwright condition-observation boundary and may include poll cadence and protocol/communication delay.',
      tracing: 'Disabled during timed attempts. If an arm fails, a separate unmeasured replay runs with Playwright tracing enabled; partial report, original failure screenshot/evidence, replay trace and screenshot, logs, and stage/error context are retained.',
      decisionUse: 'Diagnostic attribution only; no latency budget, pass threshold, runtime optimization, or production activation is applied.',
    },
    attempts: [],
    summary: null,
  };
  writeReport(report);
  if (process.env.CI === 'true' && !pinned) {
    report.completionStatus = 'failed-browser-version-mismatch';
    report.failure = {
      expectedVersion: EXPECTED_CHROMIUM?.browserVersion ?? null,
      actualVersion: browserVersion,
    };
    writeReport(report);
    expect(pinned, 'CI must use the Playwright-pinned Chromium build').toBe(true);
  }

  for (let pair = 0; pair < pairOrders.length; pair += 1) {
    const warmup = pair < WARMUP_PAIRS;
    const order = pairOrders[pair] as Arm[];
    for (let orderIndex = 0; orderIndex < order.length; orderIndex += 1) {
      const attempt = await runArm(browser, order[orderIndex], pair, warmup, orderIndex);
      report.attempts.push(attempt);
      report.summary = summarize(report);
      if (attempt.status !== 'complete') report.completionStatus = 'failed';
      writeReport(report);
      if (attempt.status !== 'complete') {
        await testInfo.attach('phase-4.6.2c3b-frame-attribution.json', {
          path: OUTPUT_PATH,
          contentType: 'application/json',
        }).catch(() => undefined);
        throw new Error(`End-key attribution failed in pair ${pair}, arm ${attempt.arm}.`);
      }
    }
  }

  report.summary = summarize(report);
  if (report.summary.measuredPairCount !== MEASURED_PAIRS) {
    report.completionStatus = 'incomplete-paired-distribution';
    report.failure = {
      expectedMeasuredPairCount: MEASURED_PAIRS,
      actualMeasuredPairCount: report.summary.measuredPairCount,
      incompletePairIndexes: report.summary.incompletePairIndexes,
    };
    writeReport(report);
    await testInfo.attach('phase-4.6.2c3b-frame-attribution.json', {
      path: OUTPUT_PATH,
      contentType: 'application/json',
    }).catch(() => undefined);
    expect(report.summary.measuredPairCount).toBe(MEASURED_PAIRS);
  }
  report.completionStatus = pinned ? 'complete-pinned-browser' : 'complete-non-pinned-diagnostic';
  writeReport(report);
  await testInfo.attach('phase-4.6.2c3b-frame-attribution.json', {
    path: OUTPUT_PATH,
    contentType: 'application/json',
  });
});
