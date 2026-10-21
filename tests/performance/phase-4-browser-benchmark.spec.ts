import { execFileSync } from 'node:child_process';
import { cpus, freemem, platform, release, totalmem, arch } from 'node:os';
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const DATASET_SIZES = [1_000, 10_000, 100_000] as const;
// Run the bounded mode first so its 100k observation survives if the legacy
// full-DOM control exhausts the runner's browser memory.
const MODES = ['virtual-window', 'legacy-full'] as const;
const VIEWPORT = { width: 1280, height: 800 };
const LIST_HEIGHT = 320;
const ESTIMATED_ITEM_HEIGHT = 40;
const FULL_RENDER_TIMEOUT_MS = 5 * 60 * 1000;
const SETUP_TIMEOUT_MS = positiveInteger(process.env.PHASE4_BENCHMARK_SETUP_TIMEOUT_MS, 2 * 60 * 1000);
const TRIAL_TIMEOUT_MS = positiveInteger(process.env.PHASE4_BENCHMARK_TRIAL_TIMEOUT_MS, 3 * 60 * 1000);
const REPETITIONS = positiveInteger(process.env.PHASE4_BENCHMARK_REPETITIONS, 1);
const WARMUPS = nonNegativeInteger(process.env.PHASE4_BENCHMARK_WARMUPS, 0);
const OUTPUT_PATH = resolve(
  process.cwd(),
  process.env.PHASE4_BENCHMARK_OUTPUT ?? 'test-results/performance/phase-4.6.2a.json',
);
const PLAYWRIGHT_CORE_PATH = resolve(process.cwd(), 'node_modules/playwright-core');
const playwrightCore = readJson(resolve(PLAYWRIGHT_CORE_PATH, 'package.json'));
const browserManifest = readJson(resolve(PLAYWRIGHT_CORE_PATH, 'browsers.json'));
const expectedChromium = browserManifest.browsers.find((browser: any) => browser.name === 'chromium');

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function nonNegativeInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function readJson(path: string): any {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function quantile(values: number[], percentile: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(percentile * sorted.length) - 1)];
}

function makeScrollTargets(size: number, count: number, repetition: number, itemHeight: number): number[] {
  let state = (size ^ Math.imul(repetition + 1, 0x9e3779b9)) >>> 0;
  const random = () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
  const lastIndex = Math.max(1, size - Math.ceil(LIST_HEIGHT / itemHeight) - 1);
  return Array.from({ length: count }, () => Math.floor(random() * lastIndex));
}

function collectRunnerMetadata(browserVersion: string) {
  let gitSha = 'unknown';
  try {
    gitSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    // Keep the report useful when run from a source archive without .git.
  }

  return {
    generatedAt: new Date().toISOString(),
    commit: gitSha,
    nodeVersion: process.version,
    playwrightVersion: playwrightCore.version,
    browser: {
      engine: 'chromium',
      version: browserVersion,
      expectedRevision: expectedChromium?.revision ?? null,
      expectedVersion: expectedChromium?.browserVersion ?? null,
      executablePath: null,
      resolvedExecutablePath: null,
      actualBrowserCacheRevision: null,
      userAgent: null,
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
    viewport: { ...VIEWPORT, deviceScaleFactor: 1 },
    dataset: {
      sizes: DATASET_SIZES,
      generation: 'Array.from(size, i => ({ id: `option-${i}`, value: `value-${i}`, label: `Option ${i}` })) in the browser',
      estimatedItemHeight: 'Calibrated per browser session from one built-in option before timed trials.',
      listHeight: LIST_HEIGHT,
      scrollWorkloadSamples: { 1_000: 20, 10_000: 50, 100_000: 100 },
    },
    protocol: {
      warmupsPerModeAndSize: WARMUPS,
      measuredRepetitionsPerModeAndSize: REPETITIONS,
      browserSetupTimeoutMs: SETUP_TIMEOUT_MS,
      trialTimeoutMs: TRIAL_TIMEOUT_MS,
      scrolling: 'Deterministic seeded random-access seeks; target indexes are identical between render modes for each size and repetition.',
      gc: 'Chromium CDP Runtime.getHeapUsage snapshots around each trial; HeapProfiler.collectGarbage before baseline and after removing the select and dropping benchmark data references.',
      measurementType: 'Exploratory unless at least one warm-up and five measured repetitions are present; no performance budget is enforced by this harness.',
    },
    completionStatus: 'in-progress',
    currentCase: null,
    cases: [],
  };
}

class BenchmarkStageTimeout extends Error {
  readonly stage: string;
  readonly timeoutMs: number;

  constructor(stage: string, timeoutMs: number) {
    super(`Benchmark stage "${stage}" did not finish within ${timeoutMs} ms.`);
    this.name = 'BenchmarkStageTimeout';
    this.stage = stage;
    this.timeoutMs = timeoutMs;
  }
}

async function withTimeout<T>(promise: Promise<T>, stage: string, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new BenchmarkStageTimeout(stage, timeoutMs)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function withTrialTimeout<T>(
  promise: Promise<T>,
  activeStage: { value: string },
  timeoutMs: number,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new BenchmarkStageTimeout(activeStage.value, timeoutMs)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function waitForRenderSettled(page: Page, size: number, mode: typeof MODES[number]): Promise<void> {
  await page.waitForFunction(({ expectedSize, expectedMode }) => {
    const select = (window as any).__phase4BenchmarkSelect;
    if (!select) return false;
    const options = select.shadowRoot.querySelector('.options-container') as HTMLElement | null;
    if (!options || select._renderPlan?.mode !== expectedMode) return false;
    const mounted = options.querySelectorAll(':scope > [part="option"]').length;
    const pending = select._lifecycleRafs?.size ?? 0;
    return expectedMode === 'legacy-full'
      ? mounted === expectedSize && pending === 0
      : mounted > 0 && mounted <= 64 && pending === 0;
  }, { expectedSize: size, expectedMode: mode }, { timeout: FULL_RENDER_TIMEOUT_MS, polling: 'raf' });
  await page.evaluate(() => new Promise<void>((resolveFrame) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolveFrame()));
  }));
}

async function sampleDom(page: Page) {
  return page.evaluate(() => {
    const select = (window as any).__phase4BenchmarkSelect;
    const options = select.shadowRoot.querySelector('.options-container') as HTMLElement;
    const countDeepNodes = (root: Node): number => {
      let count = 0;
      const pending: Node[] = [root];
      while (pending.length) {
        const node = pending.pop()!;
        count += 1;
        if (node instanceof Element && node.shadowRoot) pending.push(node.shadowRoot);
        for (const child of Array.from(node.childNodes)) pending.push(child);
      }
      return count;
    };
    const firstOption = options.querySelector(':scope > [part="option"]') as HTMLElement | null;
    const firstRect = firstOption?.getBoundingClientRect();
    return {
      deepDocumentNodeCount: countDeepNodes(document),
      mountedOptionCount: options.querySelectorAll(':scope > [part="option"]').length,
      scrollHeight: options.scrollHeight,
      scrollTop: options.scrollTop,
      clientHeight: options.clientHeight,
      firstOptionHeight: firstOption?.offsetHeight ?? null,
      renderMode: select._renderPlan?.mode ?? null,
      guardedWindow: select._guardedVirtualWindow
        ? { ...select._guardedVirtualWindow }
        : null,
    };
  });
}

async function runTrial(
  page: Page,
  cdp: any,
  size: number,
  mode: typeof MODES[number],
  repetition: number,
  calibratedItemHeight: number,
  activeStage: { value: string },
) {
  const scrollCount = size === 1_000 ? 20 : size === 10_000 ? 50 : 100;
  activeStage.value = 'CDP heap baseline';
  await cdp.send('HeapProfiler.collectGarbage');
  const heapBefore = await cdp.send('Runtime.getHeapUsage');
  activeStage.value = 'browser-side dataset generation and setItems registration';
  const setup = await withTimeout(page.evaluate(({ itemCount, renderMode, listHeight, itemHeight }) => {
    const win = window as any;
    const configureSelect = (select: any, itemHeight: number) => {
      select.updateConfig({
        searchable: true,
        estimatedItemHeight: itemHeight,
        selection: { mode: 'single', closeOnSelect: false },
        scrollToSelected: { enabled: false },
      });
      const options = select.shadowRoot.querySelector('.options-container') as HTMLElement;
      const benchmarkRowStyle = document.createElement('style');
      benchmarkRowStyle.textContent = `.options-container > [part="option"] {
        height: ${itemHeight}px !important;
        min-height: ${itemHeight}px;
        max-height: ${itemHeight}px;
        box-sizing: border-box;
      }`;
      select.shadowRoot.appendChild(benchmarkRowStyle);
      options.style.height = `${listHeight}px`;
      options.style.maxHeight = `${listHeight}px`;
      options.style.padding = '0px';
      options.style.overflow = 'auto';
      options.style.scrollBehavior = 'auto';
      return options;
    };

    const select = document.createElement('enhanced-select') as any;
    select.id = 'phase-4-browser-benchmark-select';
    document.body.appendChild(select);
    configureSelect(select, itemHeight);
    if (renderMode === 'virtual-window') select._updateGuardedVirtualWindow(0, listHeight);

    const generatedAt = performance.now();
    const items = Array.from({ length: itemCount }, (_, index) => ({
      id: `option-${index}`,
      value: `value-${index}`,
      label: `Option ${index}`,
    }));
    const datasetGenerationMs = performance.now() - generatedAt;
    const registrationStartedAt = performance.now();
    select.setItems(items);
    const setItemsSyncMs = performance.now() - registrationStartedAt;

    win.__phase4BenchmarkSelect = select;
    win.__phase4BenchmarkItems = items;
    win.__phase4BenchmarkTiming = {
      registrationStartedAt,
      datasetGenerationMs,
      setItemsSyncMs,
      calibratedItemHeight: itemHeight,
    };
    win.__phase4EndKeyEvent = null;
    win.__phase4FilterEvent = null;
    const input = select.shadowRoot.querySelector('input') as HTMLInputElement;
    input.addEventListener('keydown', (event) => {
      if (event.key !== 'End') return;
      const activeId = input.getAttribute('aria-activedescendant');
      const activeTarget = activeId ? select.shadowRoot.getElementById(activeId) : null;
      win.__phase4EndKeyEvent = {
        eventTimeStamp: event.timeStamp,
        handlerObservedAt: performance.now(),
        activeIndex: select._state.activeIndex,
        activeId,
        activeTargetIndex: activeTarget ? Number(activeTarget.getAttribute('data-index')) : null,
      };
    });
    input.addEventListener('input', (event) => {
      if (!win.__phase4MeasureFilter) return;
      win.__phase4FilterEvent = {
        eventTimeStamp: event.timeStamp,
        handlerObservedAt: performance.now(),
        query: select._state.searchQuery,
      };
    });

    return {
      datasetGenerationMs,
      setItemsSyncMs,
      renderMode: select._renderPlan?.mode ?? null,
      calibratedItemHeight: itemHeight,
    };
  }, {
    itemCount: size,
    renderMode: mode,
    listHeight: LIST_HEIGHT,
    itemHeight: calibratedItemHeight,
  }), 'browser-side dataset generation and setItems registration', SETUP_TIMEOUT_MS);

  expect(setup.renderMode).toBe(mode);
  const scrollTargets = makeScrollTargets(size, scrollCount, repetition, calibratedItemHeight);
  activeStage.value = 'initial render settle';
  await waitForRenderSettled(page, size, mode);
  activeStage.value = 'DOM and heap sampling after initial render';
  const heapAfterInitialRender = await cdp.send('Runtime.getHeapUsage');
  const registration = await page.evaluate(() => {
    const win = window as any;
    return {
      registrationToInitialRenderMs: performance.now() - win.__phase4BenchmarkTiming.registrationStartedAt,
    };
  });
  const initialDom = await sampleDom(page);

  activeStage.value = 'open and visible-option timing';
  const openStartedAt = await page.evaluate(() => performance.now());
  await page.evaluate(() => (window as any).__phase4BenchmarkSelect.open());
  await page.waitForFunction(() => {
    const select = (window as any).__phase4BenchmarkSelect;
    const options = select?.shadowRoot?.querySelector('.options-container') as HTMLElement | null;
    const option = options?.querySelector(':scope > [part="option"]') as HTMLElement | null;
    if (!select?._state?.isOpen || !options || !option) return false;
    const viewport = options.getBoundingClientRect();
    const row = option.getBoundingClientRect();
    return row.height > 0 && row.bottom > viewport.top && row.top < viewport.bottom;
  }, undefined, { timeout: 30_000, polling: 'raf' });
  const firstOpen = await page.evaluate((startedAt) => performance.now() - startedAt, openStartedAt);
  await waitForRenderSettled(page, size, mode);
  const openToRenderSettled = await page.evaluate((startedAt) => performance.now() - startedAt, openStartedAt);
  const openedDom = await sampleDom(page);

  const measuredRowHeight = openedDom.firstOptionHeight ?? 0;
  expect(measuredRowHeight).toBeGreaterThan(0);
  expect(Math.abs(measuredRowHeight - setup.calibratedItemHeight)).toBeLessThan(0.05);
  expect(openedDom.renderMode).toBe(mode);
  if (mode === 'legacy-full') expect(openedDom.mountedOptionCount).toBe(size);
  else expect(openedDom.mountedOptionCount).toBeLessThanOrEqual(64);

  activeStage.value = 'End-key materialization';
  const input = page.locator('#phase-4-browser-benchmark-select').locator('input');
  await input.focus();
  await page.evaluate(() => (window as any).__phase4BenchmarkSelect._input.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }),
  ));
  const homeState = await page.evaluate(() => (window as any).__phase4BenchmarkSelect._state.activeIndex);
  // Every trial starts the End key navigation from the deterministic first record.
  if (homeState !== 0) {
    await page.evaluate(() => {
      const select = (window as any).__phase4BenchmarkSelect;
      select._setActive(0, 'keyboard');
    });
  }
  await input.press('End');
  await page.waitForFunction((lastIndex) => {
    const select = (window as any).__phase4BenchmarkSelect;
    const inputElement = select?._input as HTMLInputElement | undefined;
    const activeId = inputElement?.getAttribute('aria-activedescendant');
    const target = activeId ? select.shadowRoot.getElementById(activeId) : null;
    if (select?._state?.activeIndex !== lastIndex || !target) return false;
    const options = select.shadowRoot.querySelector('.options-container') as HTMLElement;
    const viewport = options.getBoundingClientRect();
    const row = target.getBoundingClientRect();
    return row.height > 0 && row.bottom > viewport.top && row.top < viewport.bottom;
  }, size - 1, { timeout: 30_000, polling: 'raf' });
  const keyboard = await page.evaluate(() => {
    const win = window as any;
    const event = win.__phase4EndKeyEvent;
    return {
      handlerLatencyMs: event ? event.handlerObservedAt - event.eventTimeStamp : null,
      endToVisibleTargetMs: event ? performance.now() - event.eventTimeStamp : null,
      activeIndex: win.__phase4BenchmarkSelect._state.activeIndex,
      activeId: win.__phase4BenchmarkSelect._input.getAttribute('aria-activedescendant'),
      activeTargetIndex: event?.activeTargetIndex ?? null,
    };
  });
  expect(keyboard.activeIndex).toBe(size - 1);
  expect(keyboard.activeTargetIndex).toBe(size - 1);

  activeStage.value = 'random-access scroll workload';
  await page.evaluate(() => {
    const win = window as any;
    win.__phase4FrameIntervals = [];
    win.__phase4FrameSamplerActive = true;
    let previousFrame: number | null = null;
    const sampleFrame = (time: number) => {
      if (!win.__phase4FrameSamplerActive) return;
      if (previousFrame !== null) win.__phase4FrameIntervals.push(time - previousFrame);
      previousFrame = time;
      requestAnimationFrame(sampleFrame);
    };
    requestAnimationFrame(sampleFrame);
  });
  const scroll = await page.evaluate(async ({ indices, itemHeight }) => {
    const select = (window as any).__phase4BenchmarkSelect;
    const options = select.shadowRoot.querySelector('.options-container') as HTMLElement;
    const samples: Array<{ index: number; latencyMs: number; resolved: boolean }> = [];
    for (const index of indices) {
      const startedAt = performance.now();
      options.scrollTop = index * itemHeight;
      options.dispatchEvent(new Event('scroll'));
      let resolved = false;
      for (let frame = 0; frame < 60; frame += 1) {
        const target = options.querySelector(`[data-index="${index}"]`) as HTMLElement | null;
        if (target) {
          const viewport = options.getBoundingClientRect();
          const row = target.getBoundingClientRect();
          if (row.bottom > viewport.top && row.top < viewport.bottom) {
            resolved = true;
            break;
          }
        }
        await new Promise<void>((resolveFrame) => requestAnimationFrame(() => resolveFrame()));
      }
      samples.push({ index, latencyMs: performance.now() - startedAt, resolved });
    }
    (window as any).__phase4FrameSamplerActive = false;
    return {
      samples,
      frameIntervalsMs: (window as any).__phase4FrameIntervals as number[],
      scrollHeight: options.scrollHeight,
      mountedOptionCount: options.querySelectorAll(':scope > [part="option"]').length,
    };
  }, { indices: scrollTargets, itemHeight: setup.calibratedItemHeight });
  expect(scroll.samples.every((sample) => sample.resolved)).toBe(true);
  const scrollLatencies = scroll.samples.map((sample) => sample.latencyMs);
  const frameIntervals = scroll.frameIntervalsMs.filter((interval) => Number.isFinite(interval));
  const frameObservations = {
    sampleCount: frameIntervals.length,
    p50Ms: quantile(frameIntervals, 0.50),
    p95Ms: quantile(frameIntervals, 0.95),
    p99Ms: quantile(frameIntervals, 0.99),
    over33ms: frameIntervals.filter((interval) => interval > 33).length,
    over50ms: frameIntervals.filter((interval) => interval > 50).length,
  };
  const afterScrollDom = await sampleDom(page);

  let sustainedScroll: Record<string, unknown> | null = null;
  let afterSustainedScrollDom = afterScrollDom;
  if (size === 10_000) {
    activeStage.value = '10k sustained sequential scrolling';
    await page.evaluate(() => {
      const win = window as any;
      win.__phase4SustainedFrameIntervals = [];
      win.__phase4SustainedFrameSamplerActive = true;
      let previousFrame: number | null = null;
      const sampleFrame = (time: number) => {
        if (!win.__phase4SustainedFrameSamplerActive) return;
        if (previousFrame !== null) win.__phase4SustainedFrameIntervals.push(time - previousFrame);
        previousFrame = time;
        requestAnimationFrame(sampleFrame);
      };
      requestAnimationFrame(sampleFrame);
    });
    const sustained = await page.evaluate(async ({ itemHeight, stepCount, rowsPerStep }) => {
      const win = window as any;
      const select = win.__phase4BenchmarkSelect;
      const options = select.shadowRoot.querySelector('.options-container') as HTMLElement;
      const samples: Array<{ index: number; latencyMs: number; resolved: boolean }> = [];
      for (let step = 1; step <= stepCount; step += 1) {
        const index = step * rowsPerStep;
        const startedAt = performance.now();
        options.scrollTop = index * itemHeight;
        options.dispatchEvent(new Event('scroll'));
        let resolved = false;
        for (let frame = 0; frame < 60; frame += 1) {
          const target = options.querySelector(`[data-index="${index}"]`) as HTMLElement | null;
          if (target) {
            const viewport = options.getBoundingClientRect();
            const row = target.getBoundingClientRect();
            if (row.bottom > viewport.top && row.top < viewport.bottom) {
              resolved = true;
              break;
            }
          }
          await new Promise<void>((resolveFrame) => requestAnimationFrame(() => resolveFrame()));
        }
        samples.push({ index, latencyMs: performance.now() - startedAt, resolved });
        await new Promise<void>((resolveFrame) => requestAnimationFrame(() => resolveFrame()));
      }
      win.__phase4SustainedFrameSamplerActive = false;
      return {
        samples,
        frameIntervalsMs: win.__phase4SustainedFrameIntervals as number[],
        scrollSpanOptions: samples.at(-1)?.index ?? 0,
      };
    }, { itemHeight: setup.calibratedItemHeight, stepCount: 100, rowsPerStep: 8 });
    expect(sustained.samples.every((sample) => sample.resolved)).toBe(true);
    const sustainedLatencies = sustained.samples.map((sample) => sample.latencyMs);
    const sustainedFrameIntervals = sustained.frameIntervalsMs.filter((interval) => Number.isFinite(interval));
    sustainedScroll = {
      pacing: 'monotonic programmatic scrollTop updates, one update per animation-frame-paced iteration',
      stepCount: sustained.samples.length,
      scrollSpanOptions: sustained.scrollSpanOptions,
      samplesMs: sustainedLatencies,
      p50Ms: quantile(sustainedLatencies, 0.50),
      p95Ms: quantile(sustainedLatencies, 0.95),
      p99Ms: quantile(sustainedLatencies, 0.99),
      failedTargets: sustained.samples.filter((sample) => !sample.resolved).map((sample) => sample.index),
      frameObservations: {
        sampleCount: sustainedFrameIntervals.length,
        p50Ms: quantile(sustainedFrameIntervals, 0.50),
        p95Ms: quantile(sustainedFrameIntervals, 0.95),
        p99Ms: quantile(sustainedFrameIntervals, 0.99),
        over33ms: sustainedFrameIntervals.filter((interval) => interval > 33).length,
        over50ms: sustainedFrameIntervals.filter((interval) => interval > 50).length,
      },
    };
    afterSustainedScrollDom = await sampleDom(page);
  }

  let filter: Record<string, unknown> | null = null;
  if (size >= 10_000) {
    activeStage.value = 'filter workload';
    await page.evaluate(() => {
      const select = (window as any).__phase4BenchmarkSelect;
      const options = select.shadowRoot.querySelector('.options-container') as HTMLElement;
      options.scrollTop = 0;
      options.dispatchEvent(new Event('scroll'));
    });
    await page.waitForFunction(() => {
      const select = (window as any).__phase4BenchmarkSelect;
      const options = select?.shadowRoot?.querySelector('.options-container') as HTMLElement | null;
      const first = options?.querySelector(':scope > [part="option"][data-index="0"]') as HTMLElement | null;
      if (!options || !first) return false;
      const viewport = options.getBoundingClientRect();
      const row = first.getBoundingClientRect();
      return row.bottom > viewport.top && row.top < viewport.bottom;
    }, undefined, { timeout: 30_000, polling: 'raf' });
    await page.evaluate(() => {
      const win = window as any;
      win.__phase4MeasureFilter = true;
      win.__phase4FilterEvent = null;
    });
    await input.fill('Option 999');
    const expectedResultCount = size === 10_000 ? 11 : 111;
    await page.waitForFunction((count) => {
      const select = (window as any).__phase4BenchmarkSelect;
      const options = select?.shadowRoot?.querySelector('.options-container') as HTMLElement | null;
      const firstMatch = options?.querySelector(':scope > [part="option"][data-index="999"]') as HTMLElement | null;
      if (select?._state?.searchQuery !== 'Option 999'
        || select?._renderPlan?.filteredKeys?.length !== count
        || !options || !firstMatch) return false;
      const viewport = options.getBoundingClientRect();
      const row = firstMatch.getBoundingClientRect();
      return row.bottom > viewport.top && row.top < viewport.bottom;
    }, expectedResultCount, { timeout: 30_000, polling: 'raf' });
    filter = await page.evaluate(() => {
      const win = window as any;
      const event = win.__phase4FilterEvent;
      win.__phase4MeasureFilter = false;
      return {
        query: win.__phase4BenchmarkSelect._state.searchQuery,
        resultCount: win.__phase4BenchmarkSelect._renderPlan.filteredKeys.length,
        mountedResultCount: win.__phase4BenchmarkSelect.shadowRoot
          .querySelector('.options-container')
          .querySelectorAll(':scope > [part="option"]').length,
        eventToRenderedResultsMs: event ? performance.now() - event.eventTimeStamp : null,
        handlerLatencyMs: event ? event.handlerObservedAt - event.eventTimeStamp : null,
      };
    });
    expect(filter.resultCount).toBe(expectedResultCount);
    expect(filter.mountedResultCount).toBeGreaterThan(0);
    if (mode === 'virtual-window') expect(filter.mountedResultCount).toBeLessThanOrEqual(64);
  }

  activeStage.value = 'cleanup and post-GC heap sampling';
  const heapBeforeCleanup = await cdp.send('Runtime.getHeapUsage');
  await page.evaluate(() => {
    const win = window as any;
    const select = win.__phase4BenchmarkSelect as HTMLElement | null;
    select?.remove();
    win.__phase4BenchmarkSelect = null;
    win.__phase4BenchmarkItems = null;
    win.__phase4BenchmarkTiming = null;
    win.__phase4EndKeyEvent = null;
    win.__phase4FilterEvent = null;
  });
  await cdp.send('HeapProfiler.collectGarbage');
  const heapAfterCleanup = await cdp.send('Runtime.getHeapUsage');

  return {
    datasetSize: size,
    mode,
    repetition,
    datasetGenerationMs: setup.datasetGenerationMs,
    setItemsSyncMs: setup.setItemsSyncMs,
    calibratedItemHeight: setup.calibratedItemHeight,
    registrationToInitialRenderMs: registration.registrationToInitialRenderMs,
    firstVisibleAfterOpenMs: firstOpen,
    openToRenderSettledMs: openToRenderSettled,
    keyboardEndHandlerLatencyMs: keyboard.handlerLatencyMs,
    keyboardEndToVisibleTargetMs: keyboard.endToVisibleTargetMs,
    activeIndexAfterEnd: keyboard.activeIndex,
    activeTargetIndexAfterEnd: keyboard.activeTargetIndex,
    scrollLatency: {
      samplesMs: scrollLatencies,
      p50Ms: quantile(scrollLatencies, 0.50),
      p95Ms: quantile(scrollLatencies, 0.95),
      p99Ms: quantile(scrollLatencies, 0.99),
      failedTargets: scroll.samples.filter((sample) => !sample.resolved).map((sample) => sample.index),
    },
    sustainedScroll,
    frameObservations,
    filter,
    dom: {
      afterInitialRender: initialDom,
      afterFirstOpen: openedDom,
      afterScrolling: afterScrollDom,
      maxObservedDeepDocumentNodeCount: Math.max(
        initialDom.deepDocumentNodeCount,
        openedDom.deepDocumentNodeCount,
        afterScrollDom.deepDocumentNodeCount,
        afterSustainedScrollDom.deepDocumentNodeCount,
      ),
      maxObservedMountedOptionCount: Math.max(
        initialDom.mountedOptionCount,
        openedDom.mountedOptionCount,
        afterScrollDom.mountedOptionCount,
        afterSustainedScrollDom.mountedOptionCount,
      ),
      scrollHeightAfterWorkload: scroll.scrollHeight,
    },
    memory: {
      measurement: 'Chromium CDP Runtime.getHeapUsage',
      beforeDatasetGeneration: heapBefore,
      afterInitialRender: heapAfterInitialRender,
      beforeCleanup: heapBeforeCleanup,
      afterForcedGcCleanup: heapAfterCleanup,
      retainedHeapDeltaBytes: Number.isFinite(heapBefore.usedSize) && Number.isFinite(heapAfterCleanup.usedSize)
        ? heapAfterCleanup.usedSize - heapBefore.usedSize
        : null,
      supported: Number.isFinite(heapBefore.usedSize)
        && Number.isFinite(heapAfterInitialRender.usedSize)
        && Number.isFinite(heapBeforeCleanup.usedSize)
        && Number.isFinite(heapAfterCleanup.usedSize),
    },
    scrollTargets,
  };
}

test.describe('Phase 4 browser performance baseline', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(60 * 60 * 1000);

  test('records real-browser legacy-full and virtual-window workloads at 1k, 10k, and 100k', async ({ page, browser }) => {
    mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
    const metadata: any = collectRunnerMetadata(browser.version());
    const browserMetadata = await page.evaluate(() => navigator.userAgent).catch(() => null);
    metadata.browser.userAgent = browserMetadata;
    const browserDiagnostics = {
      consoleErrorOrWarningCount: 0,
      resizeObserverLoopWarningCount: 0,
      pageErrorCount: 0,
      samples: [] as Array<{ type: string; text: string }>,
    };
    metadata.browserDiagnostics = browserDiagnostics;
    page.on('console', (message) => {
      const type = message.type();
      if (type !== 'error' && type !== 'warning') return;
      const text = message.text();
      browserDiagnostics.consoleErrorOrWarningCount += 1;
      if (text.includes('ResizeObserver loop completed')) browserDiagnostics.resizeObserverLoopWarningCount += 1;
      if (browserDiagnostics.samples.length < 20) browserDiagnostics.samples.push({ type, text });
    });
    page.on('pageerror', (error) => {
      browserDiagnostics.pageErrorCount += 1;
      if (browserDiagnostics.samples.length < 20) {
        browserDiagnostics.samples.push({ type: 'pageerror', text: error.message });
      }
    });
    const browserType = browser.browserType();
    try {
      const executable = browserType.executablePath();
      metadata.browser.executablePath = basename(executable);
      const realExecutable = realpathSync(executable);
      metadata.browser.actualBrowserCacheRevision = realExecutable.match(/chromium-(\d+)/)?.[1] ?? null;
    } catch {
      // Some managed browsers do not expose a local executable path.
    }
    writeFileSync(OUTPUT_PATH, `${JSON.stringify(metadata, null, 2)}\n`);

    await page.goto('http://localhost:5173/vanilla-demo.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.body.replaceChildren());
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('HeapProfiler.enable');
    const calibratedItemHeight = await page.evaluate(({ listHeight, fallbackHeight }) => {
      const probe = document.createElement('enhanced-select') as any;
      document.body.appendChild(probe);
      probe.updateConfig({
        searchable: true,
        estimatedItemHeight: fallbackHeight,
        selection: { mode: 'single', closeOnSelect: false },
        scrollToSelected: { enabled: false },
      });
      const benchmarkRowStyle = document.createElement('style');
      benchmarkRowStyle.textContent = `.options-container > [part="option"] {
        height: ${fallbackHeight}px !important;
        min-height: ${fallbackHeight}px;
        max-height: ${fallbackHeight}px;
        box-sizing: border-box;
      }`;
      probe.shadowRoot.appendChild(benchmarkRowStyle);
      const options = probe.shadowRoot.querySelector('.options-container') as HTMLElement;
      options.style.height = `${listHeight}px`;
      options.style.maxHeight = `${listHeight}px`;
      options.style.padding = '0px';
      options.style.overflow = 'auto';
      probe.setItems([{ id: 'phase-4-height-probe', value: 'probe', label: 'Probe' }]);
      probe.open();
      const option = probe.shadowRoot.querySelector('.options-container > [part="option"]') as HTMLElement | null;
      const height = option?.offsetHeight ?? 0;
      probe.remove();
      return height;
    }, { listHeight: LIST_HEIGHT, fallbackHeight: ESTIMATED_ITEM_HEIGHT });
    expect(calibratedItemHeight).toBeGreaterThan(0);
    metadata.dataset.calibratedItemHeight = calibratedItemHeight;
    await cdp.send('HeapProfiler.collectGarbage');

    for (const size of DATASET_SIZES) {
      for (const mode of MODES) {
        for (let warmup = 0; warmup < WARMUPS; warmup += 1) {
          const warmupStartedAt = new Date().toISOString();
          const stage = { value: 'starting warm-up' };
          try {
            const result = await withTrialTimeout(
              runTrial(page, cdp, size, mode, -(warmup + 1), calibratedItemHeight, stage),
              stage,
              TRIAL_TIMEOUT_MS,
            );
            console.info('[phase-4-benchmark-warmup]', JSON.stringify({ warmup, ...result }));
          } catch (error) {
            const timeout = error instanceof BenchmarkStageTimeout ? error : null;
            const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
            (metadata.cases as unknown[]).push({
              datasetSize: size,
              mode,
              warmup,
              status: timeout ? 'incomplete' : 'failed',
              startedAt: warmupStartedAt,
              endedAt: new Date().toISOString(),
              elapsedMs: Date.now() - Date.parse(warmupStartedAt),
              failureStage: timeout?.stage ?? 'warm-up execution',
              timeoutMs: timeout?.timeoutMs ?? null,
              error: message,
            });
            metadata.currentCase = null;
            metadata.completionStatus = timeout ? 'incomplete' : 'failed';
            metadata.failure = {
              datasetSize: size,
              mode,
              warmup,
              failureStage: timeout?.stage ?? 'warm-up execution',
              error: message,
            };
            writeFileSync(OUTPUT_PATH, `${JSON.stringify(metadata, null, 2)}\n`);
            if (timeout) await browser.close().catch(() => undefined);
            throw error;
          }
        }
        for (let repetition = 0; repetition < REPETITIONS; repetition += 1) {
          const caseStartedAt = new Date().toISOString();
          metadata.currentCase = { datasetSize: size, mode, repetition, startedAt: caseStartedAt };
          writeFileSync(OUTPUT_PATH, `${JSON.stringify(metadata, null, 2)}\n`);
          const stage = { value: 'starting trial' };
          try {
            const result = await withTrialTimeout(
              runTrial(page, cdp, size, mode, repetition, calibratedItemHeight, stage),
              stage,
              TRIAL_TIMEOUT_MS,
            );
            (metadata.cases as unknown[]).push({ status: 'complete', ...result });
            metadata.currentCase = null;
            writeFileSync(OUTPUT_PATH, `${JSON.stringify(metadata, null, 2)}\n`);
            console.info('[phase-4-benchmark-case]', JSON.stringify(result));
          } catch (error) {
            const timeout = error instanceof BenchmarkStageTimeout ? error : null;
            (metadata.cases as unknown[]).push({
              datasetSize: size,
              mode,
              repetition,
              status: timeout ? 'incomplete' : 'failed',
              startedAt: caseStartedAt,
              endedAt: new Date().toISOString(),
              elapsedMs: Date.now() - Date.parse(caseStartedAt),
              failureStage: timeout?.stage ?? 'trial execution',
              timeoutMs: timeout?.timeoutMs ?? null,
              error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
            });
            metadata.currentCase = null;
            metadata.completionStatus = timeout ? 'incomplete' : 'failed';
            metadata.failure = {
              datasetSize: size,
              mode,
              repetition,
              failureStage: timeout?.stage ?? 'trial execution',
              error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
            };
            writeFileSync(OUTPUT_PATH, `${JSON.stringify(metadata, null, 2)}\n`);
            if (timeout) await browser.close().catch(() => undefined);
            throw error;
          }
        }
      }
    }
    metadata.completionStatus = 'complete';
    metadata.completedAt = new Date().toISOString();
    writeFileSync(OUTPUT_PATH, `${JSON.stringify(metadata, null, 2)}\n`);
    await cdp.detach();
  });
});
