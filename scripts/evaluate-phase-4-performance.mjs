#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, relative, resolve } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const DEFAULT_INPUTS = [
  'tests/performance/results/phase-4.6.2c-run-39720037312.json',
  'tests/performance/results/phase-4.6.2c-run-39905911387.json',
];
const DEFAULT_OUTPUT = 'tests/performance/results/phase-4.6.2c-evaluation.json';
const DATASET_SIZES = [1_000, 10_000, 100_000];
const RENDER_MODES = ['virtual-window', 'legacy-full'];
const SCROLL_SAMPLE_COUNTS = new Map([[1_000, 20], [10_000, 50], [100_000, 100]]);

export function nearestRank(values, percentile) {
  if (!Array.isArray(values) || values.length === 0) return null;
  if (!(percentile >= 0 && percentile <= 1)) throw new RangeError('Percentile must be between 0 and 1.');
  const sorted = values.toSorted((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(percentile * sorted.length) - 1)];
}

export function describeSeries(samples) {
  const valid = samples.filter(({ value }) => Number.isFinite(value));
  if (valid.length === 0) {
    return {
      sampleCount: 0,
      min: null,
      max: null,
      mean: null,
      median: null,
      p95: null,
      p99: null,
      sampleVariance: null,
      sampleStandardDeviation: null,
      coefficientOfVariationPercent: null,
      quartiles: { q1: null, q3: null, interquartileRange: null },
      tukeyOutlierFence: { lower: null, upper: null },
      tukeyOutliers: [],
    };
  }

  const values = valid.map(({ value }) => value);
  const sorted = values.toSorted((left, right) => left - right);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const sampleVariance = values.length > 1
    ? values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / (values.length - 1)
    : null;
  const sampleStandardDeviation = sampleVariance === null ? null : Math.sqrt(sampleVariance);
  const q1 = nearestRank(values, 0.25);
  const q3 = nearestRank(values, 0.75);
  const interquartileRange = q3 - q1;
  const lowerFence = q1 - (1.5 * interquartileRange);
  const upperFence = q3 + (1.5 * interquartileRange);

  return {
    sampleCount: values.length,
    min: sorted[0],
    max: sorted.at(-1),
    mean,
    median: nearestRank(values, 0.5),
    p95: nearestRank(values, 0.95),
    p99: nearestRank(values, 0.99),
    sampleVariance,
    sampleStandardDeviation,
    coefficientOfVariationPercent: mean === 0 || sampleStandardDeviation === null
      ? null
      : (sampleStandardDeviation / Math.abs(mean)) * 100,
    quartiles: { q1, q3, interquartileRange },
    tukeyOutlierFence: { lower: lowerFence, upper: upperFence },
    tukeyOutliers: valid
      .filter(({ value }) => value < lowerFence || value > upperFence)
      .map(({ label, value }) => ({ label, value })),
  };
}

function quantileForTrial(values, percentile) {
  return nearestRank(values, percentile);
}

function summarizeTrialValues(trials, selector, unit, definition) {
  const rawPerTrial = trials.map((trial) => ({
    repetition: trial.repetition,
    value: selector(trial),
  }));
  return {
    unit,
    definition,
    rawPerTrial,
    acrossTrials: describeSeries(rawPerTrial.map(({ repetition, value }) => ({
      label: `repetition-${repetition}`,
      value,
    }))),
  };
}

function summarizeInteractionSamples(trials, readSamples, unit, definition) {
  const rawPerTrial = trials.map((trial) => ({
    repetition: trial.repetition,
    samples: readSamples(trial),
  }));
  const pooled = rawPerTrial.flatMap(({ repetition, samples }) => samples.map((value, sampleIndex) => ({
    label: `repetition-${repetition}-sample-${sampleIndex}`,
    value,
  })));
  const perTrialPercentiles = {};
  for (const [name, percentile] of [['p50', 0.5], ['p95', 0.95], ['p99', 0.99]]) {
    const values = rawPerTrial.map(({ repetition, samples }) => ({
      label: `repetition-${repetition}`,
      value: quantileForTrial(samples, percentile),
    }));
    perTrialPercentiles[name] = describeSeries(values);
  }
  return {
    unit,
    definition,
    perTrialPercentiles,
    pooledInteractions: describeSeries(pooled),
    pooledInteractionSampleCount: pooled.length,
    rawSamplesByTrial: rawPerTrial,
  };
}

function finiteValue(value) {
  return Number.isFinite(value) ? value : null;
}

function sourceFromReport({ filePath, report, runId }) {
  const sourceText = readFileSync(filePath);
  const digest = createHash('sha256').update(sourceText).digest('hex');
  const artifactUrl = `https://github.com/navidrezadoost/Smilodon/actions/runs/${runId}`;
  return {
    runId,
    artifactUrl,
    reportPath: relative(process.cwd(), filePath),
    sha256: digest,
    generatedAt: report.generatedAt,
    commit: report.commit,
    completionStatus: report.completionStatus,
    environment: {
      nodeVersion: report.nodeVersion,
      playwrightVersion: report.playwrightVersion,
      browser: report.browser,
      runner: report.runner,
      viewport: report.viewport,
      calibratedItemHeightPx: report.calibratedItemHeight ?? 40,
    },
    protocol: report.protocol,
  };
}

function validateReport(report, filePath) {
  if (!report || typeof report !== 'object' || !Array.isArray(report.cases)) {
    throw new TypeError(`${filePath}: benchmark report must contain a cases array.`);
  }
  if (!report.cases.every((item) => item && typeof item === 'object')) {
    throw new TypeError(`${filePath}: every benchmark case must be an object.`);
  }
  if (report.browser?.engine !== 'chromium' || report.browser?.version !== '147.0.7727.15'
    || String(report.browser?.expectedRevision) !== '1217') {
    throw new Error(`${filePath}: report is not from the expected pinned Chromium 147 / revision 1217.`);
  }
  if (report.playwrightVersion !== '1.59.1') {
    throw new Error(`${filePath}: unexpected Playwright version ${report.playwrightVersion}.`);
  }
  if (report.protocol?.warmupsPerModeAndSize !== 1
    || report.protocol?.measuredRepetitionsPerModeAndSize !== 5) {
    throw new Error(`${filePath}: expected one warm-up and five measured repetitions.`);
  }
  if (report.protocol?.legacy100kFeasibilityProbeTimeoutMs !== 15_000) {
    throw new Error(`${filePath}: expected the documented 15,000 ms 100k legacy feasibility bound.`);
  }

  const expectedGroups = new Set();
  let hasCensoredLegacyWorkload = false;
  for (const datasetSize of DATASET_SIZES) {
    for (const mode of RENDER_MODES) {
      const context = `${datasetSize}/${mode}`;
      expectedGroups.add(context);
      const attempts = report.cases.filter((item) => item.datasetSize === datasetSize && item.mode === mode);
      if (datasetSize === 100_000 && mode === 'legacy-full' && isCensoredLegacyProbe(attempts)) {
        validateCensoredLegacyProbe(report, attempts, filePath);
        hasCensoredLegacyWorkload = true;
        continue;
      }
      validateFeasibleWorkload(report, attempts, datasetSize, mode, filePath);
    }
  }

  for (const attempt of report.cases) {
    if (!expectedGroups.has(`${attempt.datasetSize}/${attempt.mode}`)) {
      throw new Error(`${filePath}: unexpected benchmark workload ${attempt.datasetSize}/${attempt.mode}.`);
    }
  }
  if (!hasCensoredLegacyWorkload) {
    requireValue(!report.skippedWorkloads?.length, filePath, 'report',
      'skipped workloads are only allowed for the documented 100k legacy censor.');
  }
}

function isCensoredLegacyProbe(attempts) {
  return attempts.length === 1
    && attempts[0].kind === 'feasibility-probe'
    && attempts[0].status === 'incomplete'
    && attempts[0].classification === 'legacy-scalability-censored';
}

function requireValue(condition, filePath, context, message) {
  if (!condition) throw new Error(`${filePath}: ${context}: ${message}`);
}

function requireFinite(value, filePath, context, field, { minimum = 0 } = {}) {
  requireValue(Number.isFinite(value) && (minimum === null || value >= minimum), filePath, context,
    `${field} must be a finite number${minimum === null ? '' : ` >= ${minimum}`}; received ${String(value)}.`);
}

function requireInteger(value, filePath, context, field, { minimum = 0 } = {}) {
  requireValue(Number.isInteger(value) && value >= minimum, filePath, context,
    `${field} must be an integer >= ${minimum}; received ${String(value)}.`);
}

function validateFrameObservations(observations, filePath, context, minimumCount = null) {
  requireValue(observations && typeof observations === 'object', filePath, context,
    'frameObservations must be present.');
  requireInteger(observations.sampleCount, filePath, context, 'frameObservations.sampleCount', { minimum: 1 });
  if (minimumCount !== null) {
    requireValue(observations.sampleCount >= minimumCount, filePath, context,
      `frameObservations.sampleCount must be at least ${minimumCount}.`);
  }
  for (const field of ['p50Ms', 'p95Ms', 'p99Ms']) {
    requireFinite(observations[field], filePath, context, `frameObservations.${field}`);
  }
  for (const field of ['over33ms', 'over50ms']) {
    requireInteger(observations[field], filePath, context, `frameObservations.${field}`);
    requireValue(observations[field] <= observations.sampleCount, filePath, context,
      `frameObservations.${field} cannot exceed sampleCount.`);
  }
}

function validateInteractionSamples(interaction, expectedCount, filePath, context, field) {
  requireValue(interaction && typeof interaction === 'object', filePath, context, `${field} must be present.`);
  requireValue(Array.isArray(interaction.samplesMs) && interaction.samplesMs.length === expectedCount,
    filePath, context, `${field}.samplesMs must contain exactly ${expectedCount} samples.`);
  interaction.samplesMs.forEach((value, index) => requireFinite(value, filePath, context, `${field}.samplesMs[${index}]`));
  for (const percentile of ['p50Ms', 'p95Ms', 'p99Ms']) {
    requireFinite(interaction[percentile], filePath, context, `${field}.${percentile}`);
  }
  requireValue(Array.isArray(interaction.failedTargets), filePath, context,
    `${field}.failedTargets must be an array.`);
  requireValue(interaction.failedTargets.length === 0, filePath, context,
    `${field}.failedTargets must be empty.`);
}

function validateCompletedAttempt(attempt, datasetSize, mode, filePath, context) {
  requireValue(attempt.status === 'complete', filePath, context, 'attempt must have status complete.');
  requireFinite(attempt.elapsedMs, filePath, context, 'elapsedMs');
  requireFinite(attempt.setupElapsedMs, filePath, context, 'setupElapsedMs');
  for (const field of [
    'datasetGenerationMs',
    'setItemsSyncMs',
    'registrationToHiddenRenderSettleMs',
    'registrationToInteractiveMs',
    'firstVisibleAfterOpenMs',
    'openToRenderSettledMs',
    'keyboardEndHandlerLatencyMs',
    'keyboardEndToVisibleTargetMs',
  ]) {
    requireFinite(attempt[field], filePath, context, field);
  }
  requireFinite(attempt.calibratedItemHeight, filePath, context, 'calibratedItemHeight', { minimum: Number.MIN_VALUE });

  const scrollSampleCount = SCROLL_SAMPLE_COUNTS.get(datasetSize);
  requireValue(Array.isArray(attempt.scrollTargets) && attempt.scrollTargets.length === scrollSampleCount,
    filePath, context, `scrollTargets must contain exactly ${scrollSampleCount} targets.`);
  attempt.scrollTargets.forEach((target, index) => {
    requireInteger(target, filePath, context, `scrollTargets[${index}]`);
    requireValue(target < datasetSize, filePath, context, `scrollTargets[${index}] must be below datasetSize.`);
  });
  validateInteractionSamples(attempt.scrollLatency, scrollSampleCount, filePath, context, 'scrollLatency');

  requireInteger(attempt.activeIndexAfterEnd, filePath, context, 'activeIndexAfterEnd');
  requireInteger(attempt.activeTargetIndexAfterEnd, filePath, context, 'activeTargetIndexAfterEnd');
  requireValue(attempt.activeIndexAfterEnd === datasetSize - 1
    && attempt.activeTargetIndexAfterEnd === datasetSize - 1, filePath, context,
  `End-key correctness evidence must identify final index ${datasetSize - 1}.`);

  requireValue(attempt.dom && typeof attempt.dom === 'object', filePath, context, 'dom evidence must be present.');
  requireInteger(attempt.dom.maxObservedDeepDocumentNodeCount, filePath, context,
    'dom.maxObservedDeepDocumentNodeCount', { minimum: 1 });
  requireInteger(attempt.dom.maxObservedMountedOptionCount, filePath, context,
    'dom.maxObservedMountedOptionCount', { minimum: 1 });
  requireFinite(attempt.dom.scrollHeightAfterWorkload, filePath, context, 'dom.scrollHeightAfterWorkload', { minimum: 1 });
  if (mode === 'virtual-window') {
    requireValue(attempt.dom.maxObservedMountedOptionCount <= 64, filePath, context,
      'virtual-window mounted option count must not exceed 64.');
  }

  requireValue(attempt.memory?.supported === true, filePath, context, 'memory measurements must be supported.');
  for (const stage of ['beforeDatasetGeneration', 'afterInitialRender', 'beforeCleanup', 'afterForcedGcCleanup']) {
    requireFinite(attempt.memory?.[stage]?.usedSize, filePath, context, `memory.${stage}.usedSize`);
  }
  requireFinite(attempt.memory?.retainedHeapDeltaBytes, filePath, context, 'memory.retainedHeapDeltaBytes', {
    minimum: null,
  });

  validateFrameObservations(attempt.frameObservations, filePath, context);
  if (datasetSize === 10_000) {
    requireValue(attempt.sustainedScroll?.stepCount === 100, filePath, context,
      '10k sustainedScroll.stepCount must equal 100.');
    validateInteractionSamples(attempt.sustainedScroll, 100, filePath, context, 'sustainedScroll');
    validateFrameObservations(attempt.sustainedScroll.frameObservations, filePath, context, 100);
  } else {
    requireValue(attempt.sustainedScroll === null, filePath, context,
      'sustainedScroll must be null outside the 10k workload.');
  }

  if (datasetSize === 1_000) {
    requireValue(attempt.filter === null, filePath, context, 'filter must be null for the 1k workload.');
  } else {
    const expectedFilterCount = datasetSize === 10_000 ? 11 : 111;
    requireValue(attempt.filter?.query === 'Option 999', filePath, context,
      'filter correctness evidence must use the Option 999 fixture query.');
    requireValue(attempt.filter.resultCount === expectedFilterCount, filePath, context,
      `filter resultCount must equal the fixture-derived ${expectedFilterCount}.`);
    requireInteger(attempt.filter.mountedResultCount, filePath, context, 'filter.mountedResultCount', { minimum: 1 });
    requireValue(attempt.filter.mountedResultCount <= expectedFilterCount, filePath, context,
      'filter.mountedResultCount cannot exceed resultCount.');
    requireFinite(attempt.filter.eventToRenderedResultsMs, filePath, context, 'filter.eventToRenderedResultsMs');
    requireFinite(attempt.filter.handlerLatencyMs, filePath, context, 'filter.handlerLatencyMs');
  }

  requireValue(attempt.diagnostics && typeof attempt.diagnostics === 'object', filePath, context,
    'diagnostics evidence must be present.');
  requireInteger(attempt.diagnostics.pageConsoleWarningOrErrorCount, filePath, context,
    'diagnostics.pageConsoleWarningOrErrorCount');
  requireInteger(attempt.diagnostics.pageErrorCount, filePath, context, 'diagnostics.pageErrorCount');
  requireValue(attempt.diagnostics.pageConsoleWarningOrErrorCount === 0 && attempt.diagnostics.pageErrorCount === 0,
    filePath, context, 'browser console warning/error and page-error counts must be zero.');
  requireValue(Array.isArray(attempt.diagnostics.samples), filePath, context, 'diagnostics.samples must be an array.');
  requireInteger(attempt.diagnostics.resizeObserverWarnings?.pageConsole, filePath, context,
    'diagnostics.resizeObserverWarnings.pageConsole');
  requireInteger(attempt.diagnostics.resizeObserverWarnings?.cdpLog, filePath, context,
    'diagnostics.resizeObserverWarnings.cdpLog');
}

function validateFeasibleWorkload(report, attempts, datasetSize, mode, filePath) {
  const context = `${datasetSize}/${mode}`;
  const warmups = attempts.filter((attempt) => attempt.kind === 'warmup');
  requireValue(warmups.length === 1 && warmups[0].warmupIndex === 0, filePath, context,
    'expected exactly one complete warm-up with warmupIndex 0.');
  validateCompletedAttempt(warmups[0], datasetSize, mode, filePath, `${context}/warmup`);

  const measurements = attempts.filter((attempt) => attempt.kind === 'measurement');
  requireValue(measurements.length === report.protocol.measuredRepetitionsPerModeAndSize,
    filePath, context, 'expected exactly five completed measurements.');
  const repetitions = measurements.map((attempt) => attempt.repetition);
  requireValue(repetitions.every(Number.isInteger) && new Set(repetitions).size === repetitions.length,
    filePath, context, 'measurement repetition IDs must be unique integers.');
  requireValue([...repetitions].toSorted((left, right) => left - right).every((value, index) => value === index),
    filePath, context, 'measurement repetition IDs must be exactly 0 through 4.');
  for (const attempt of measurements) {
    validateCompletedAttempt(attempt, datasetSize, mode, filePath, `${context}/measurement-${attempt.repetition}`);
  }
  requireValue(attempts.length === warmups.length + measurements.length, filePath, context,
    'unexpected extra, failed, or incomplete attempts are not evaluable.');
}

function validateCensoredLegacyProbe(report, attempts, filePath) {
  const context = '100000/legacy-full';
  const [probe] = attempts;
  requireValue(probe.failureStage === 'initial render settle', filePath, context,
    'the only allowed censor stage is initial render settle.');
  requireValue(probe.timeoutMs === report.protocol.legacy100kFeasibilityProbeTimeoutMs, filePath, context,
    'censored feasibility probe must use the documented timeout.');
  requireFinite(probe.elapsedMs, filePath, context, 'feasibility-probe.elapsedMs');
  requireValue(Array.isArray(report.skippedWorkloads) && report.skippedWorkloads.length === 1,
    filePath, context, 'censored feasibility probe must have exactly one skipped-workload record.');
  const [skipped] = report.skippedWorkloads;
  requireValue(skipped.datasetSize === 100_000 && skipped.mode === 'legacy-full'
    && skipped.skippedWarmups === 1
    && skipped.skippedRepetitions === report.protocol.measuredRepetitionsPerModeAndSize,
  filePath, context, 'censored workload must explicitly skip its one warm-up and five measurements.');
}

function buildWorkload(runId, report, datasetSize, mode) {
  const attempts = report.cases.filter((item) => item.datasetSize === datasetSize && item.mode === mode);
  const trials = attempts
    .filter((item) => item.kind === 'measurement' && item.status === 'complete')
    .toSorted((left, right) => left.repetition - right.repetition);
  const warmups = attempts.filter((item) => item.kind === 'warmup');
  const failures = attempts.filter((item) => item.status !== 'complete');
  const expectedMeasurements = report.protocol.measuredRepetitionsPerModeAndSize;
  const metric = (name, selector, unit, definition) => [name, summarizeTrialValues(trials, selector, unit, definition)];
  const random = summarizeInteractionSamples(
    trials,
    (trial) => trial.scrollLatency?.samplesMs ?? [],
    'ms',
    'Elapsed time after setting scrollTop to a seeded target index and dispatching scroll until that target option is mounted and intersects the list viewport. This is synthetic random-access materialization, not wheel/inertial scrolling or a public API call.',
  );
  const frameRows = trials.map((trial) => ({
    repetition: trial.repetition,
    sampleCount: trial.frameObservations?.sampleCount ?? 0,
    p50Ms: finiteValue(trial.frameObservations?.p50Ms),
    p95Ms: finiteValue(trial.frameObservations?.p95Ms),
    p99Ms: finiteValue(trial.frameObservations?.p99Ms),
    over33ms: trial.frameObservations?.over33ms ?? 0,
    over50ms: trial.frameObservations?.over50ms ?? 0,
  }));
  const frameTotals = frameRows.reduce((total, item) => ({
    sampleCount: total.sampleCount + item.sampleCount,
    over33ms: total.over33ms + item.over33ms,
    over50ms: total.over50ms + item.over50ms,
  }), { sampleCount: 0, over33ms: 0, over50ms: 0 });
  const warningTotals = trials.reduce((total, trial) => ({
    pageConsoleWarningsOrErrors: total.pageConsoleWarningsOrErrors
      + (trial.diagnostics?.pageConsoleWarningOrErrorCount ?? 0),
    pageErrors: total.pageErrors + (trial.diagnostics?.pageErrorCount ?? 0),
    resizeObserverPageConsole: total.resizeObserverPageConsole
      + (trial.diagnostics?.resizeObserverWarnings?.pageConsole ?? 0),
    resizeObserverCdpLog: total.resizeObserverCdpLog
      + (trial.diagnostics?.resizeObserverWarnings?.cdpLog ?? 0),
  }), {
    pageConsoleWarningsOrErrors: 0,
    pageErrors: 0,
    resizeObserverPageConsole: 0,
    resizeObserverCdpLog: 0,
  });
  const filters = trials.filter((trial) => trial.filter);
  const maxMounted = trials.map((trial) => trial.dom?.maxObservedMountedOptionCount ?? null);
  const hasCompleteMeasurementSet = trials.length === expectedMeasurements;

  const correctness = {
    allRandomScrollTargetsResolved: hasCompleteMeasurementSet
      ? trials.every((trial) => trial.scrollLatency?.failedTargets?.length === 0)
      : null,
    allEndKeyTargetsCorrect: hasCompleteMeasurementSet
      ? trials.every((trial) => trial.activeIndexAfterEnd === datasetSize - 1
        && trial.activeTargetIndexAfterEnd === datasetSize - 1)
      : null,
    filterResultCounts: filters.map((trial) => ({
      repetition: trial.repetition,
      query: trial.filter.query,
      resultCount: trial.filter.resultCount,
      mountedResultCount: trial.filter.mountedResultCount,
    })),
    filterChecksApplicable: datasetSize === 1_000
      ? false
      : hasCompleteMeasurementSet
        ? filters.length === trials.length
        : null,
    allFilterResultCountsMatchFixture: datasetSize === 1_000
      ? null
      : hasCompleteMeasurementSet && filters.length === trials.length
        ? filters.every((trial) => trial.filter.resultCount
        === (datasetSize === 10_000 ? 11 : datasetSize === 100_000 ? 111 : null))
        : null,
    maximumMountedOptionCount: hasCompleteMeasurementSet && maxMounted.length
      ? Math.max(...maxMounted.filter(Number.isFinite))
      : null,
    virtualMountedWindowWithin64: hasCompleteMeasurementSet
      ? mode !== 'virtual-window' || maxMounted.every((count) => count !== null && count <= 64)
      : null,
    noPageErrors: hasCompleteMeasurementSet ? warningTotals.pageErrors === 0 : null,
    noPageConsoleWarningsOrErrors: hasCompleteMeasurementSet
      ? warningTotals.pageConsoleWarningsOrErrors === 0
      : null,
  };

  const metrics = Object.fromEntries([
    metric('datasetGeneration', (trial) => trial.datasetGenerationMs, 'ms', 'Browser-side deterministic dataset creation before registration.'),
    metric('setItemsSync', (trial) => trial.setItemsSyncMs, 'ms', 'Synchronous setItems registration call duration; does not include render settlement.'),
    metric('registrationToHiddenRenderSettle', (trial) => trial.registrationToHiddenRenderSettleMs, 'ms', 'From registration start until the initial hidden render window is settled.'),
    metric('registrationToInteractive', (trial) => trial.registrationToInteractiveMs, 'ms', 'From registration start until the first option is visible after opening; includes opening.'),
    metric('firstVisibleAfterOpen', (trial) => trial.firstVisibleAfterOpenMs, 'ms', 'From immediately before invoking open() until the first option intersects the list viewport.'),
    metric('openToRenderSettled', (trial) => trial.openToRenderSettledMs, 'ms', 'From immediately before invoking open() until the full mode-specific render-settled condition.'),
    metric('endKeyHandlerLatency', (trial) => trial.keyboardEndHandlerLatencyMs, 'ms', 'Keyboard event timestamp to handler-observed timestamp for End key.'),
    metric('endKeyToVisibleTarget', (trial) => trial.keyboardEndToVisibleTargetMs, 'ms', 'End key event timestamp until the final active option is mounted and intersects the viewport.'),
    metric('retainedHeapDelta', (trial) => trial.memory?.retainedHeapDeltaBytes, 'bytes', 'Chromium CDP JavaScript used-heap delta from pre-dataset baseline to after component/data removal and forced GC; not process memory or component-attributed bytes.'),
    metric('maxDeepDocumentNodeCount', (trial) => trial.dom?.maxObservedDeepDocumentNodeCount, 'nodes', 'Maximum sampled open-shadow-inclusive deep document node count during one measured trial.'),
  ]);

  metrics.randomAccessScroll = random;
  metrics.randomAccessScrollFrameIntervals = {
    unit: 'intervals',
    rawPerTrial: frameRows,
    totals: {
      ...frameTotals,
      over33msPercent: frameTotals.sampleCount
        ? (frameTotals.over33ms / frameTotals.sampleCount) * 100
        : null,
      over50msPercent: frameTotals.sampleCount
        ? (frameTotals.over50ms / frameTotals.sampleCount) * 100
        : null,
    },
  };
  metrics.filterToRenderedResults = filters.length
    ? summarizeTrialValues(
      filters,
      (trial) => trial.filter.eventToRenderedResultsMs,
      'ms',
      'Input event timestamp until the expected result count and first matching option are rendered and visible.',
    )
    : null;
  metrics.sustainedScroll = datasetSize === 10_000
    ? summarizeInteractionSamples(
      trials.filter((trial) => trial.sustainedScroll),
      (trial) => trial.sustainedScroll?.samplesMs ?? [],
      'ms',
      'Per-update elapsed time after a monotonic scrollTop update (eight rows per update) until the target is mounted and visible; each update is animation-frame-paced.',
    )
    : null;
  metrics.sustainedScrollFrameIntervals = datasetSize === 10_000
    ? (() => {
      const rows = trials.filter((trial) => trial.sustainedScroll).map((trial) => ({
        repetition: trial.repetition,
        sampleCount: trial.sustainedScroll.frameObservations?.sampleCount ?? 0,
        p50Ms: finiteValue(trial.sustainedScroll.frameObservations?.p50Ms),
        p95Ms: finiteValue(trial.sustainedScroll.frameObservations?.p95Ms),
        p99Ms: finiteValue(trial.sustainedScroll.frameObservations?.p99Ms),
        over33ms: trial.sustainedScroll.frameObservations?.over33ms ?? 0,
        over50ms: trial.sustainedScroll.frameObservations?.over50ms ?? 0,
      }));
      const totals = rows.reduce((result, item) => ({
        sampleCount: result.sampleCount + item.sampleCount,
        over33ms: result.over33ms + item.over33ms,
        over50ms: result.over50ms + item.over50ms,
      }), { sampleCount: 0, over33ms: 0, over50ms: 0 });
      return {
        unit: 'intervals',
        rawPerTrial: rows,
        totals: {
          ...totals,
          over33msPercent: totals.sampleCount ? (totals.over33ms / totals.sampleCount) * 100 : null,
          over50msPercent: totals.sampleCount ? (totals.over50ms / totals.sampleCount) * 100 : null,
        },
      };
    })()
    : null;

  return {
    runId,
    datasetSize,
    mode,
    attemptedMeasuredRepetitions: attempts.filter((item) => item.kind === 'measurement').length,
    plannedMeasuredRepetitions: expectedMeasurements,
    completedWarmups: warmups.filter((item) => item.status === 'complete').length,
    plannedWarmups: report.protocol.warmupsPerModeAndSize,
    validMeasuredRepetitions: trials.length,
    missingMeasuredRepetitions: Math.max(0, expectedMeasurements - trials.length),
    metrics,
    correctness,
    diagnostics: {
      randomAccessFrameIntervals: metrics.randomAccessScrollFrameIntervals.totals,
      sustainedFrameIntervals: metrics.sustainedScrollFrameIntervals?.totals ?? null,
      warningTotals,
    },
    incompleteAttempts: failures.map((attempt) => ({
      kind: attempt.kind,
      status: attempt.status,
      classification: attempt.classification ?? null,
      failureStage: attempt.failureStage ?? null,
      elapsedMs: finiteValue(attempt.elapsedMs),
      timeoutMs: finiteValue(attempt.timeoutMs),
    })),
  };
}

function evidenceFor(workloads, datasetSize, metricName, statistic = 'p95') {
  return workloads
    .filter((workload) => workload.datasetSize === datasetSize && workload.mode === 'virtual-window')
    .map((workload) => {
      const metric = workload.metrics[metricName];
      let value = metric?.acrossTrials?.[statistic] ?? null;
      let sampleCount = metric?.acrossTrials?.sampleCount ?? 0;
      if (metricName === 'randomAccessScroll') {
        value = metric.pooledInteractions?.[statistic] ?? null;
        sampleCount = metric.pooledInteractionSampleCount;
      }
      return {
        runId: workload.runId,
        sampleCount,
        value,
      };
    });
}

function budget(id, metric, target, evidence, recommendation, rationale, status) {
  return {
    id,
    category: 'candidate-performance-budget',
    metric,
    target,
    evidence,
    status,
    enforcement: 'report-only; no CI threshold added or enabled',
    recommendation,
    rationale,
  };
}

function buildBudgetAssessment(workloads) {
  const perRunSizes = DATASET_SIZES;
  const budgets = [];
  for (const [size, limit] of [[1_000, 500], [10_000, 1_500], [100_000, 5_000]]) {
    const evidence = evidenceFor(workloads, size, 'registrationToHiddenRenderSettle');
    budgets.push(budget(
      `registration-to-hidden-window-${size}`,
      'registrationToHiddenRenderSettle.p95 (per-run distribution of five measured trials)',
      { p95AtOrBelowMs: limit },
      evidence.map((item) => ({ ...item, passes: item.value !== null && item.value <= limit })),
      'Retain as a provisional candidate; defer release gating until a larger, controlled runner sample is approved.',
      'Both pinned runs are comfortably below the size-specific proposal. With five repetitions, nearest-rank p95 is the maximum observed trial, not a stable population-tail estimate.',
      evidence.every((item) => item.value !== null && item.value <= limit) ? 'supported-by-current-baseline' : 'not-supported-by-current-baseline',
    ));
  }

  for (const size of perRunSizes) {
    const evidence = evidenceFor(workloads, size, 'firstVisibleAfterOpen');
    budgets.push(budget(
      `first-visible-after-open-${size}`,
      'firstVisibleAfterOpen.p95 (five measured trials per run)',
      { p95AtOrBelowMs: 150 },
      evidence.map((item) => ({ ...item, passes: item.value !== null && item.value <= 150 })),
      'Retain 150 ms as a candidate without relaxing it; keep this budget uncertified at 100k and collect more controlled runs.',
      size === 100_000
        ? 'The 100k result crosses 150 ms in one run by only 1.76 ms and is 123.495 ms in the other. This is inconsistent across two distinct runner images/CPU models and the per-run p95 is the maximum of five trials; it does not establish a reproducible limitation.'
        : 'Both pinned runs meet the candidate. The boundary measures popup invocation to first visible row, not completion of the full render window.',
      evidence.every((item) => item.value !== null && item.value <= 150) ? 'supported-by-current-baseline' : 'inconclusive-near-or-over-target',
    ));
  }

  for (const size of perRunSizes) {
    const p95Evidence = evidenceFor(workloads, size, 'endKeyToVisibleTarget');
    budgets.push(budget(
      `end-key-visible-p95-${size}`,
      'endKeyToVisibleTarget.p95 (five single End-key trials per run)',
      { p95AtOrBelowMs: 100 },
      p95Evidence.map((item) => ({ ...item, passes: item.value !== null && item.value <= 100 })),
      'Keep the proposed value, but mark it unmet at 100k; do not raise the budget or optimize runtime without separate authorization.',
      size === 100_000
        ? 'Both runs exceed 100 ms p95 at 100k. The five observations per run are insufficient for tail certification but consistently show the proposed p95 is not met in this workload.'
        : 'Both runs meet 100 ms p95 for this dataset size; this is a per-trial interaction boundary, not the handler-only latency.',
      p95Evidence.every((item) => item.value !== null && item.value <= 100) ? 'supported-by-current-baseline' : 'not-met-at-this-size',
    ));
    const p99Evidence = evidenceFor(workloads, size, 'endKeyToVisibleTarget', 'p99');
    budgets.push(budget(
      `end-key-visible-p99-${size}`,
      'endKeyToVisibleTarget.p99 (empirical order statistic from five single End-key trials per run)',
      { p99AtOrBelowMs: 250 },
      p99Evidence.map((item) => ({ ...item, passes: item.value !== null && item.value <= 250 })),
      'Retain as a provisional diagnostic target; require substantially more repetitions before calling it a certified p99 budget.',
      'All measured maxima are below 250 ms, but five trials cannot provide a reliable p99 estimate; the reported nearest-rank p99 is simply the maximum.',
      p99Evidence.every((item) => item.value !== null && item.value <= 250) ? 'observed-within-target-insufficient-sample-for-certification' : 'not-met-at-this-size',
    ));
  }

  for (const size of perRunSizes) {
    const p95Evidence = evidenceFor(workloads, size, 'randomAccessScroll');
    budgets.push(budget(
      `random-access-scroll-p95-${size}`,
      'pooled randomAccessScroll.p95 (seeded programmatic target-visibility events)',
      { p95AtOrBelowMs: 50 },
      p95Evidence.map((item) => ({ ...item, passes: item.value !== null && item.value <= 50 })),
      'Retain 50 ms as a candidate and report the operation under the synthetic name; do not call it a wheel-scroll SLO or enable gating.',
      'This operation sets scrollTop, dispatches scroll, then waits for the indexed option to be mounted and intersect the viewport. The two runner results disagree at 100k (51.63 vs 40.835 ms), while 1k/10k meet the proposal. Pooled interactions are nested within five trials, not independent repetitions.',
      p95Evidence.every((item) => item.value !== null && item.value <= 50) ? 'supported-by-current-baseline' : 'inconclusive-runner-sensitive',
    ));
    const p99Evidence = evidenceFor(workloads, size, 'randomAccessScroll', 'p99');
    budgets.push(budget(
      `random-access-scroll-p99-${size}`,
      'pooled randomAccessScroll.p99 (seeded programmatic target-visibility events)',
      { p99AtOrBelowMs: 100 },
      p99Evidence.map((item) => ({ ...item, passes: item.value !== null && item.value <= 100 })),
      'Retain provisionally; review per-trial distributions on repeated controlled runner sessions before release gating.',
      'The observed pooled p99 values are below 100 ms in both runs, but event samples are clustered within only five trials per run and are not independent host-level replicates.',
      p99Evidence.every((item) => item.value !== null && item.value <= 100) ? 'observed-within-target-not-certified' : 'not-met-at-this-size',
    ));
  }

  for (const size of [10_000, 100_000]) {
    const evidence = evidenceFor(workloads, size, 'filterToRenderedResults');
    const limit = size === 10_000 ? 250 : 1_000;
    budgets.push(budget(
      `filter-to-visible-result-${size}`,
      'filterToRenderedResults.p95 (five measured trials per run)',
      { p95AtOrBelowMs: limit },
      evidence.map((item) => ({ ...item, passes: item.value !== null && item.value <= limit })),
      'Retain as a candidate supported by these two runs; keep report-only pending formal gate approval and repeated hosted evidence.',
      'The timing starts at the filter input event and ends once the expected result count and first matching row are rendered and visible. It includes event/render scheduling, not only the filter function.',
      evidence.every((item) => item.value !== null && item.value <= limit) ? 'supported-by-current-baseline' : 'not-supported-by-current-baseline',
    ));
  }

  return {
    methodology: {
      latencyQuantile: 'Nearest-rank empirical quantile; for five per-trial observations both p95 and p99 equal the maximum observation.',
      dispersion: 'Sample variance and sample standard deviation use n - 1; outlier flags use the 1.5×IQR Tukey fence with nearest-rank Q1/Q3. Flags are reported and never removed.',
      crossRunComparison: 'Runs remain separate because their GitHub runner image versions, kernels, and CPU models differ. No measurements are pooled across runs to estimate a single runner distribution.',
      interactionPooling: 'Random/sustained event observations are pooled only within one run and reported alongside the distribution of per-trial p50/p95/p99. Events within one trial are clustered, not independent repetitions.',
      warmups: 'One complete warm-up per feasible mode/size is recorded in the raw source report and excluded from all numeric estimates.',
      minimumSampleWarning: 'Five trials support a descriptive maximum and range, not a robust p95/p99 release SLO. Two independent hosted runner sessions are a small baseline, not a controlled variance study.',
    },
    budgets,
    nonBudgetMetrics: [
      {
        metric: 'openToRenderSettled',
        classification: 'diagnostic-performance-observation',
        proposedThreshold: null,
        decision: 'Report only; the existing proposal has no numerical target for full render settlement. Do not substitute first-visible latency for this distinct endpoint.',
      },
      {
        metric: 'sustainedScroll',
        classification: 'diagnostic-performance-observation',
        proposedThreshold: null,
        decision: 'Report each update and the frame-interval observations; the existing proposal defines no latency budget for this 10k synthetic monotonic scroll workload.',
      },
      {
        metric: 'retainedHeapDelta',
        classification: 'diagnostic-memory-observation',
        proposedThreshold: 'Investigate repeated post-GC retained JavaScript heap above max(32 MiB, 25%) of baseline; not a pass/fail gate.',
        decision: 'Do not infer a component leak from CDP heap deltas. These browser benchmark deltas include benchmark dataset/state and are distinct from the lifecycle-attribution object-retention investigation.',
      },
      {
        metric: 'frameIntervals',
        classification: 'diagnostic-frame-observation',
        proposedThreshold: 'Report intervals >33 ms and >50 ms; investigate when >50 ms exceeds 10%.',
        decision: 'Report counts and denominator without a frame-rate guarantee or automatic failure.',
      },
    ],
  };
}

export function evaluateReports(sources) {
  if (!Array.isArray(sources) || sources.length < 2) {
    throw new TypeError('At least two independent pinned-browser reports are required.');
  }
  for (const source of sources) validateReport(source.report, source.filePath);
  const runIds = new Set(sources.map(({ runId }) => runId));
  if (runIds.size !== sources.length) throw new Error('Each source must have a distinct hosted run ID.');

  const preparedSources = sources.map((source) => sourceFromReport(source));
  const workloads = [];
  for (const source of sources) {
    for (const datasetSize of DATASET_SIZES) {
      for (const mode of ['virtual-window', 'legacy-full']) {
        workloads.push(buildWorkload(source.runId, source.report, datasetSize, mode));
      }
    }
  }
  const censoredWorkloads = sources.flatMap(({ runId, report }) => report.cases
    .filter((attempt) => attempt.status !== 'complete')
    .map((attempt) => ({
      runId,
      datasetSize: attempt.datasetSize,
      mode: attempt.mode,
      kind: attempt.kind,
      status: attempt.status,
      classification: attempt.classification ?? null,
      failureStage: attempt.failureStage ?? null,
      elapsedMs: finiteValue(attempt.elapsedMs),
      timeoutMs: finiteValue(attempt.timeoutMs),
      excludedFromNumericEstimates: true,
      correspondingSkippedWorkload: report.skippedWorkloads?.find((item) => item.datasetSize === attempt.datasetSize
        && item.mode === attempt.mode) ?? null,
    })));

  return {
    schemaVersion: 1,
    title: 'Phase 4.6.2C pinned-browser performance budget evaluation',
    sourceCount: preparedSources.length,
    sources: preparedSources,
    workloads,
    censoredWorkloads,
    assessment: buildBudgetAssessment(workloads),
    releaseGateClassification: {
      hardCorrectnessInvariants: [
        'Seeded target indexes resolve to mounted options intersecting the scroll viewport.',
        'End key sets the final active index and ARIA target to the final option.',
        'Filtering returns the fixture-derived expected result count.',
        'Test-only virtual-window mode remains within its existing 64-mounted-option ceiling.',
      ],
      certifiedPerformanceBudgets: [],
      candidatePerformanceBudgets: 'All latency targets remain report-only until their measurement definitions, sample sizes, controlled runner protocol, and target approval are accepted.',
      diagnosticObservations: ['JavaScript heap deltas', 'Frame interval tails', 'Browser-native roots and ResizeObserver-named objects'],
      productionActivation: 'NO-GO; this evaluation does not authorize production defaults, APIs, runtime optimization, or public virtualization activation.',
    },
  };
}

function parseRunId(filePath) {
  const match = basename(filePath).match(/run-(\d+)\.json$/);
  if (!match) throw new Error(`Input filename must end with run-<id>.json: ${filePath}`);
  return match[1];
}

function runCli() {
  const inputPaths = process.argv.slice(2).filter((argument) => !argument.startsWith('--'));
  const selectedInputs = inputPaths.length ? inputPaths : DEFAULT_INPUTS;
  const outputPath = resolve(process.cwd(), DEFAULT_OUTPUT);
  const sources = selectedInputs.map((filePath) => {
    const absolutePath = resolve(process.cwd(), filePath);
    return {
      filePath: absolutePath,
      runId: parseRunId(absolutePath),
      report: JSON.parse(readFileSync(absolutePath, 'utf8')),
    };
  });
  const evaluation = evaluateReports(sources);
  writeFileSync(outputPath, `${JSON.stringify(evaluation, null, 2)}\n`);
  console.log(`Phase 4.6.2C evaluation: ${outputPath}`);
  for (const source of evaluation.sources) {
    console.log(`Run ${source.runId}: Chromium ${source.environment.browser.version} / revision ${source.environment.browser.expectedRevision}; ${source.protocol.measuredRepetitionsPerModeAndSize} measured repetitions; SHA-256 ${source.sha256}`);
  }
  console.log(`Censored attempts excluded from numeric estimates: ${evaluation.censoredWorkloads.length}`);
  console.log('Performance budgets remain report-only; no CI enforcement was added.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) runCli();
