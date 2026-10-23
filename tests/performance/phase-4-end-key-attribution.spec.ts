import { execFileSync } from 'node:child_process';
import { arch, cpus, freemem, platform, release, totalmem } from 'node:os';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { devices, expect, test, type Browser, type Page } from '@playwright/test';

const ITEM_COUNT = 100_000;
const VIEWPORT = { width: 1280, height: 800 };
const LIST_HEIGHT = 320;
const ITEM_HEIGHT = 40;
const TARGET_INDEX = ITEM_COUNT - 1;
const TIMEOUT_MS = 30_000;
const WARMUP_PAIRS = nonNegativeInteger(process.env.PHASE4_ENDKEY_WARMUPS, 1);
const MEASURED_PAIRS = positiveInteger(process.env.PHASE4_ENDKEY_REPETITIONS, 5);
const OUTPUT_PATH = resolve(
  process.cwd(),
  process.env.PHASE4_ENDKEY_ATTRIBUTION_OUTPUT
    ?? 'test-results/performance/phase-4.6.2c2-end-key-attribution.json',
);
const BROWSER_MANIFEST = JSON.parse(readFileSync(
  resolve(process.cwd(), 'node_modules/playwright-core/browsers.json'), 'utf8',
));
const EXPECTED_CHROMIUM = BROWSER_MANIFEST.browsers.find((item: any) => item.name === 'chromium');

type Arm = 'minimal' | 'instrumented';

interface FinalConfirmation {
  activeIndex: number;
  activeId: string;
  targetIndex: number;
  mountedCount: number;
  visible: boolean;
  now: number;
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
      definition: 'Paired instrumented observed event-to-visible-confirmation latency minus minimally instrumented observed latency; includes condition-polling and browser/Playwright observation overhead, and signed values are retained.',
      pairedDifferencesMs: paired.map((item) => item.instrumentationOverheadMs),
      distribution: describe(paired.map((item) => item.instrumentationOverheadMs)),
      pairs: paired,
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
      endEventCount: 0,
      eventKey: null,
      eventTargetMatchesInput: null,
      handlerEntryAt: null,
      handlerKey: null,
      handlerExitAt: null,
      handlerReturnAt: null,
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
  try {
    const browserDiagnostics = await setupAttempt(page, arm);
    errors = browserDiagnostics.errors;
    warnings = browserDiagnostics.warnings;
    stage = 'initial virtual window settlement';
    await expect.poll(async () => page.evaluate((expectedCount) => {
      const select = (window as any).__phase4EndKeySelect;
      const options = select?.shadowRoot?.querySelector('.options-container') as HTMLElement | null;
      return Boolean(select && options && select._renderPlan?.mode === 'virtual-window'
        && select._renderPlan.filteredKeys.length === expectedCount
        && options.querySelectorAll(':scope > [part="option"]').length > 0
        && options.querySelectorAll(':scope > [part="option"]').length <= 64
        && (select._lifecycleRafs?.size ?? 0) === 0);
    }, ITEM_COUNT), { timeout: TIMEOUT_MS, intervals: [10, 20, 50, 100] }).toBe(true);
    stage = 'open and deterministic Home navigation';
    await page.evaluate(() => (window as any).__phase4EndKeySelect.open());
    const input = page.locator('#phase-4-endkey-attribution-select').locator('input');
    await input.focus();
    await input.press('Home');
    await expect.poll(async () => page.evaluate(() => (window as any).__phase4EndKeySelect._state.activeIndex), {
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

    stage = 'End-key event and handler';
    await input.press('End');
    stage = 'stable rendered target geometry';
    let previousGeometry = '';
    let stablePolls = 0;
    let layoutObservationCount = 0;
    let layoutStableAt: number | null = null;
    await expect.poll(async () => {
      layoutObservationCount += 1;
      const observation = await page.evaluate((targetIndex) => {
        const win = window as any;
        const select = win.__phase4EndKeySelect;
        const options = select?.shadowRoot?.querySelector('.options-container') as HTMLElement | null;
        const target = options?.querySelector(`[data-index="${targetIndex}"]`) as HTMLElement | null;
        if (!options || !target) return { mounted: false, signature: '', now: null };
        const row = target.getBoundingClientRect();
        const viewport = options.getBoundingClientRect();
        const visible = row.height > 0 && row.bottom > viewport.top && row.top < viewport.bottom;
        const signature = [row.top, row.bottom, row.width, row.height, options.scrollTop]
          .map((value) => Math.round(value * 100) / 100).join(':');
        return { mounted: true, visible, signature, now: performance.now() };
      }, TARGET_INDEX);
      if (!observation.mounted || !observation.visible) {
        previousGeometry = '';
        stablePolls = 0;
        return false;
      }
      stablePolls = observation.signature === previousGeometry ? stablePolls + 1 : 1;
      previousGeometry = observation.signature;
      if (stablePolls >= 2) layoutStableAt = observation.now;
      return stablePolls >= 2;
    }, { timeout: TIMEOUT_MS, intervals: [5, 10, 20, 50] }).toBe(true);
    await page.evaluate((observedAt) => {
      (window as any).__phase4EndKeyEvidence.layoutStableObservationAt = observedAt;
    }, layoutStableAt);

    stage = 'final visible and ARIA target confirmation';
    let ariaConfirmationObservationCount = 0;
    await expect.poll(async () => {
      ariaConfirmationObservationCount += 1;
      const observation = await page.evaluate((targetIndex) => {
        const win = window as any;
        const select = (window as any).__phase4EndKeySelect;
        const inputElement = select?._input as HTMLInputElement | undefined;
        const options = select?.shadowRoot?.querySelector('.options-container') as HTMLElement | null;
        const activeId = inputElement?.getAttribute('aria-activedescendant') ?? null;
        const target = activeId ? select.shadowRoot.getElementById(activeId) as HTMLElement | null : null;
        const row = target?.getBoundingClientRect();
        const viewport = options?.getBoundingClientRect();
        const visible = Boolean(row && viewport && row.height > 0
          && row.bottom > viewport.top && row.top < viewport.bottom);
        const confirmed = select?._state?.activeIndex === targetIndex
            && Number(target?.getAttribute('data-index')) === targetIndex
            && visible;
        if (confirmed) win.__phase4EndKeyEvidence.finalVisibleAriaObservationAt = performance.now();
        const now = performance.now();
        if (confirmed && activeId && target) {
          win.__phase4EndKeyEvidence.finalVisibleAriaConfirmation = {
            activeIndex: Number(select._state.activeIndex),
            activeId,
            targetIndex: Number(target.getAttribute('data-index')),
            mountedCount: options?.querySelectorAll(':scope > [part="option"]').length ?? 0,
            visible,
            now,
          };
        }
        return {
          confirmed,
          activeIndex: select?._state?.activeIndex ?? null,
          activeId,
          targetIndex: target ? Number(target.getAttribute('data-index')) : null,
          mountedCount: options?.querySelectorAll(':scope > [part="option"]').length ?? null,
          visible,
          now,
        };
      }, TARGET_INDEX);
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
        targetKey: select._renderPlan.filteredKeys[select._renderPlan.filteredKeys.length - 1],
        itemCount: select._renderPlan.filteredKeys.length,
        renderCycleId: select._renderCycleId,
        pendingLifecycleRafs: select._lifecycleRafs?.size ?? null,
        optionCount: options.querySelectorAll(':scope > [part="option"]').length,
      };
    });
    const evidence = browserEvidence.evidence;
    const eventStart = evidence.eventCaptureAt;
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
      renderToStableLayoutMs: endKeyRender && Number.isFinite(layoutStableAt)
        ? layoutStableAt! - endKeyRender.endedAt : null,
      layoutStableFromEventMs: Number.isFinite(layoutStableAt) ? layoutStableAt! - eventStart : null,
      observedEndToVisibleMs: finalConfirmation && Number.isFinite(finalConfirmation.now)
        ? finalConfirmation.now - eventStart : null,
    };
    expect(browserEvidence.activeIndex).toBe(TARGET_INDEX);
    expect(finalConfirmation.activeIndex).toBe(TARGET_INDEX);
    expect(finalConfirmation.activeId).toBeTruthy();
    expect(finalConfirmation.targetIndex).toBe(TARGET_INDEX);
    expect(finalConfirmation.visible).toBe(true);
    expect(browserEvidence.optionCount).toBeLessThanOrEqual(64);
    expect(browserEvidence.scrollHeight).toBeGreaterThan(browserEvidence.clientHeight);
    expect(evidence.eventCaptureAt).toEqual(expect.any(Number));
    expect(evidence.endEventCount).toBe(1);
    expect(evidence.handlerReturnAt).toEqual(expect.any(Number));
    expect(evidence.eventKey).toBe('End');
    expect(evidence.eventTargetMatchesInput).toBe(true);
    expect(evidence.layoutStableObservationAt).toEqual(expect.any(Number));
    expect(evidence.finalVisibleAriaObservationAt).toEqual(expect.any(Number));
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
        },
      },
      correctness: {
        expectedTargetIndex: TARGET_INDEX,
        targetKey,
        endKeyEventCount: evidence.endEventCount,
        itemCount: browserEvidence.itemCount,
        activeIndex: browserEvidence.activeIndex,
        ariaTargetIndex: finalConfirmation?.targetIndex,
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
      instrumentation: arm === 'instrumented' ? evidence : null,
    };
  } catch (error) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    const artifactDir = resolve(process.cwd(), 'test-results/performance/end-key-attribution');
    mkdirSync(artifactDir, { recursive: true });
    const screenshotPath = resolve(artifactDir, `pair-${pair}-${arm}-failure.png`);
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
      failure: { stage, error: message, screenshot: screenshotPath, evidence, tracedReplay },
      browserErrors: errors,
      browserWarnings: warnings,
    };
  } finally {
    await context.close().catch(() => undefined);
  }
}

test('Phase 4.6.2C.2 attributes 100k End-key latency', async ({ browser }, testInfo) => {
  test.setTimeout(60 * 60 * 1000);
  const browserVersion = browser.version();
  const metadata = runnerMetadata(browserVersion);
  const pinned = browserVersion === EXPECTED_CHROMIUM?.browserVersion;
  const pairOrders = Array.from({ length: WARMUP_PAIRS + MEASURED_PAIRS }, (_, pair) => (
    pair % 2 === 0 ? ['minimal', 'instrumented'] : ['instrumented', 'minimal']
  ));
  const report: Record<string, any> = {
    schemaVersion: 1,
    phase: '4.6.2C.2',
    completionStatus: 'in-progress',
    environment: metadata,
    protocol: {
      warmupPairs: WARMUP_PAIRS,
      measuredPairs: MEASURED_PAIRS,
      arms: ['minimal', 'instrumented'],
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
        handlerEntry: 'Instrumented arm only: entry into the instance-wrapped component _handleKeydown for the single captured End key event targeting the input.',
        handlerExecution: 'Instrumented arm only: _handleKeydown entry through synchronous method return.',
        activeStateDispatch: 'Instrumented arm only: duration of _dispatchActiveKey, including engine effects and compatibility/ARIA synchronization; records before/after active indexes and target key.',
        windowCalculation: 'Instrumented arm only: Virtualizer.scrollToKey and updateWindow method durations during End dispatch, with returned target index and virtual window bounds.',
        targetMounting: 'Instrumented arm only: confirms the component materialization method returns true and both it and _renderOptions observe option 99,999 mounted in the reported virtual window.',
        synchronousRenderRebuild: 'Instrumented arm only: summed synchronous _renderOptions method duration; includes render bookkeeping as well as DOM creation/mounting.',
        layoutSettlement: 'Target is mounted and visible with an unchanged bounding-box/scrollTop signature across two bounded expect.poll observations.',
        finalVisibleAriaConfirmation: 'Observed confirmation: final active index is 99999, aria-activedescendant resolves to that option, and its rectangle intersects the 320px options viewport; poll/communication delay is included.',
      },
      instrumentationComparison: 'Each paired arm uses identical deterministic data, browser revision, viewport, configuration, and open/focus/Home/End sequence. Arm order alternates by pair. Minimal instrumentation uses only common event-boundary listeners and condition polling; the instrumented arm additionally wraps the named private methods. Observed event-to-visible-confirmation latency includes poll cadence and browser/Playwright observation overhead. Paired latency difference is reported as diagnostic probe overhead, not subtracted from phase timings.',
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
        await testInfo.attach('phase-4.6.2c2-end-key-attribution.json', {
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
    await testInfo.attach('phase-4.6.2c2-end-key-attribution.json', {
      path: OUTPUT_PATH,
      contentType: 'application/json',
    }).catch(() => undefined);
    expect(report.summary.measuredPairCount).toBe(MEASURED_PAIRS);
  }
  report.completionStatus = pinned ? 'complete-pinned-browser' : 'complete-non-pinned-diagnostic';
  writeReport(report);
  await testInfo.attach('phase-4.6.2c2-end-key-attribution.json', {
    path: OUTPUT_PATH,
    contentType: 'application/json',
  });
});
