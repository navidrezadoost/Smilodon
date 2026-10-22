import test from 'node:test';
import assert from 'node:assert/strict';
import {
  expectedFilterMatchCount,
  summarizeBenchmarkReport,
} from '../../scripts/phase-4-benchmark-summary.mjs';

function complete10kCase(overrides = {}) {
  return {
    kind: 'measurement',
    status: 'complete',
    datasetSize: 10_000,
    mode: 'virtual-window',
    repetition: 0,
    registrationToHiddenRenderSettleMs: 35,
    registrationToInteractiveMs: 60,
    firstVisibleAfterOpenMs: 20,
    openToRenderSettledMs: 40,
    keyboardEndToVisibleTargetMs: 15,
    activeIndexAfterEnd: 9_999,
    activeTargetIndexAfterEnd: 9_999,
    scrollLatency: {
      samplesMs: Array.from({ length: 50 }, (_, index) => index + 1),
      failedTargets: [],
      p95Ms: 48,
    },
    sustainedScroll: {
      samplesMs: Array.from({ length: 100 }, () => 2),
      failedTargets: [],
      p95Ms: 2,
      frameObservations: { p95Ms: 16.7, over33ms: 0, over50ms: 0 },
    },
    frameObservations: { p95Ms: 16.7, over33ms: 0, over50ms: 0 },
    filter: {
      query: 'Option 999',
      resultCount: 11,
      mountedResultCount: 8,
      eventToRenderedResultsMs: 5,
    },
    dom: {
      maxObservedMountedOptionCount: 12,
      maxObservedDeepDocumentNodeCount: 200,
    },
    memory: { retainedHeapDeltaBytes: 1024 },
    diagnostics: { resizeObserverWarnings: { pageConsole: 0, cdpLog: 0 } },
    ...overrides,
  };
}

function report(cases, protocol = { warmupsPerModeAndSize: 1, measuredRepetitionsPerModeAndSize: 5 }) {
  return {
    commit: 'fixture-commit',
    completionStatus: 'partial',
    playwrightVersion: 'fixture-playwright',
    browser: { engine: 'chromium', version: 'fixture' },
    protocol,
    cases,
  };
}

test('derives deterministic Option 999 match counts from each dataset fixture', () => {
  assert.equal(expectedFilterMatchCount(1_000), 1);
  assert.equal(expectedFilterMatchCount(10_000), 11);
  assert.equal(expectedFilterMatchCount(100_000), 111);
});

test('keeps a censored legacy attempt visible and excludes it from numeric percentiles', () => {
  const censored = {
    kind: 'feasibility-probe',
    datasetSize: 100_000,
    mode: 'legacy-full',
    status: 'incomplete',
    failureStage: 'initial render settle',
    elapsedMs: 15_000,
    timeoutMs: 15_000,
    error: 'BenchmarkStageTimeout',
  };
  const summary = summarizeBenchmarkReport(report([complete10kCase(), censored]));
  const tenK = summary.cases.find((result) => result.datasetSize === 10_000);
  const legacy = summary.cases.find((result) => result.datasetSize === 100_000);

  assert.equal(summary.validation.passed, true);
  assert.equal(summary.censoredCaseCount, 1);
  assert.equal(tenK.validRepetitions, 1);
  assert.equal(tenK.scrollSeekLatencyPooledEventsMs.sampleCount, 50);
  assert.equal(tenK.scrollSeekLatencyPooledEventsMs.p95, 48);
  assert.equal(legacy.scrollSeekLatencyPooledEventsMs.sampleCount, 0);
  assert.equal(legacy.scrollSeekLatencyPooledEventsMs.p95, null);
  assert.equal(legacy.incompleteOrFailed[0].classification, 'legacy-scalability-censored');
});

test('does not turn an incomplete-only workload into a numeric latency', () => {
  const incomplete = {
    kind: 'measurement',
    datasetSize: 100_000,
    mode: 'legacy-full',
    status: 'incomplete',
    repetition: 0,
    failureStage: 'initial render settle',
    elapsedMs: 15_000,
    timeoutMs: 15_000,
    error: 'BenchmarkStageTimeout',
  };
  const summary = summarizeBenchmarkReport(report([incomplete]));
  const workload = summary.cases[0];

  assert.equal(summary.validation.passed, true);
  assert.equal(workload.attemptedRepetitions, 1);
  assert.equal(workload.validRepetitions, 0);
  assert.equal(workload.registrationToHiddenRenderSettleAcrossTrialsMs.p95, null);
  assert.equal(workload.scrollSeekPerTrialP95Ms.p95, null);
});

test('marks unexpected incomplete or failed attempts as validation issues', () => {
  const incompleteVirtual = {
    kind: 'measurement',
    datasetSize: 100_000,
    mode: 'virtual-window',
    status: 'incomplete',
    repetition: 0,
    failureStage: 'scroll workload',
    elapsedMs: 15_000,
    timeoutMs: 15_000,
    error: 'BenchmarkStageTimeout',
  };
  const summary = summarizeBenchmarkReport(report([incompleteVirtual]));

  assert.equal(summary.validation.passed, false);
  assert.ok(summary.validation.issues.some((issue) => issue.code === 'unexpected-incomplete-case'));
  assert.equal(summary.cases[0].scrollSeekLatencyPooledEventsMs.p95, null);
});

test('excludes warm-up samples and validates filter and scroll correctness', () => {
  const warmup = complete10kCase({ kind: 'warmup', warmupIndex: 0, registrationToHiddenRenderSettleMs: 5 });
  const measurement = complete10kCase({ repetition: 0, registrationToHiddenRenderSettleMs: 30 });
  const summary = summarizeBenchmarkReport(report([warmup, measurement]));
  const workload = summary.cases[0];

  assert.equal(summary.validation.passed, true);
  assert.equal(workload.warmups.attempted, 1);
  assert.equal(workload.warmups.completed, 1);
  assert.equal(workload.validRepetitions, 1);
  assert.equal(workload.registrationToHiddenRenderSettleAcrossTrialsMs.p50, 30);

  const invalid = complete10kCase({
    filter: { query: 'Option 999', resultCount: 11, mountedResultCount: 8 },
    scrollLatency: { samplesMs: [1, Number.NaN], failedTargets: [999] },
  });
  const invalidSummary = summarizeBenchmarkReport(report([invalid]));
  assert.equal(invalidSummary.validation.passed, false);
  assert.ok(invalidSummary.validation.issues.some((issue) => issue.code === 'wrong-scroll-sample-count'));
  assert.ok(invalidSummary.validation.issues.some((issue) => issue.code === 'failed-scroll-targets'));
  assert.equal(invalidSummary.validation.issues.some((issue) => issue.code === 'filter-correctness-failure'), false);

  const wrongFilter = complete10kCase({
    filter: { query: 'Option 999', resultCount: 111, mountedResultCount: 8 },
  });
  const wrongFilterSummary = summarizeBenchmarkReport(report([wrongFilter]));
  assert.ok(wrongFilterSummary.validation.issues.some((issue) => issue.code === 'filter-correctness-failure'));
  assert.equal(wrongFilterSummary.cases[0].validRepetitions, 0);
  assert.equal(wrongFilterSummary.cases[0].scrollSeekPerTrialP95Ms.p95, null);
});
