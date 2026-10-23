import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { describeSeries, evaluateReports, nearestRank } from '../../scripts/evaluate-phase-4-performance.mjs';

const sourceReports = [
  {
    runId: '39720037312',
    filePath: fileURLToPath(new URL('./results/phase-4.6.2c-run-39720037312.json', import.meta.url)),
  },
  {
    runId: '39905911387',
    filePath: fileURLToPath(new URL('./results/phase-4.6.2c-run-39905911387.json', import.meta.url)),
  },
].map((source) => ({
  ...source,
  report: JSON.parse(readFileSync(source.filePath, 'utf8')),
}));

function clonedSources() {
  return sourceReports.map((source) => ({ ...source, report: structuredClone(source.report) }));
}

function findAttempt(report, { datasetSize = 100_000, mode = 'virtual-window', kind = 'measurement', repetition = 0 } = {}) {
  return report.cases.find((attempt) => attempt.datasetSize === datasetSize
    && attempt.mode === mode
    && attempt.kind === kind
    && (kind !== 'measurement' || attempt.repetition === repetition));
}

test('uses nearest-rank percentiles and sample dispersion without discarding outliers', () => {
  assert.equal(nearestRank([5, 1, 3, 2, 4], 0.5), 3);
  assert.equal(nearestRank([5, 1, 3, 2, 4], 0.95), 5);

  const summary = describeSeries([1, 2, 3, 4, 100].map((value, index) => ({
    label: `sample-${index}`,
    value,
  })));

  assert.equal(summary.sampleCount, 5);
  assert.equal(summary.mean, 22);
  assert.equal(summary.median, 3);
  assert.equal(summary.p95, 100);
  assert.equal(summary.sampleVariance, 1_902.5);
  assert.deepEqual(summary.tukeyOutliers, [{ label: 'sample-4', value: 100 }]);
});

test('keeps the two hosted runs separate and records per-trial and pooled interaction samples', () => {
  const result = evaluateReports(sourceReports);
  const runOne100k = result.workloads.find((workload) => workload.runId === '39720037312'
    && workload.datasetSize === 100_000 && workload.mode === 'virtual-window');
  const randomScroll = runOne100k.metrics.randomAccessScroll;

  assert.equal(result.sourceCount, 2);
  assert.equal(result.sources[0].environment.browser.expectedRevision, '1217');
  assert.equal(result.sources[1].environment.browser.version, '147.0.7727.15');
  assert.equal(randomScroll.pooledInteractionSampleCount, 500);
  assert.equal(randomScroll.perTrialPercentiles.p95.sampleCount, 5);
  assert.equal(randomScroll.rawSamplesByTrial.length, 5);
  assert.equal(randomScroll.rawSamplesByTrial[0].samples.length, 100);
});

test('preserves both 100k legacy censored probes without creating numeric latency samples', () => {
  const result = evaluateReports(sourceReports);
  assert.equal(result.censoredWorkloads.length, 2);

  for (const runId of ['39720037312', '39905911387']) {
    const workload = result.workloads.find((item) => item.runId === runId
      && item.datasetSize === 100_000 && item.mode === 'legacy-full');
    const censor = result.censoredWorkloads.find((item) => item.runId === runId);

    assert.equal(workload.validMeasuredRepetitions, 0);
    assert.equal(workload.missingMeasuredRepetitions, 5);
    assert.equal(workload.metrics.setItemsSync.acrossTrials.sampleCount, 0);
    assert.equal(censor.classification, 'legacy-scalability-censored');
    assert.equal(censor.excludedFromNumericEstimates, true);
    assert.equal(censor.correspondingSkippedWorkload.skippedRepetitions, 5);
    assert.equal(workload.correctness.allRandomScrollTargetsResolved, null);
    assert.equal(workload.correctness.allEndKeyTargetsCorrect, null);
    assert.equal(workload.correctness.virtualMountedWindowWithin64, null);
  }
});

test('rejects feasible workloads with missing measurements', () => {
  const sources = clonedSources();
  const report = sources[0].report;
  const missingIndex = report.cases.indexOf(findAttempt(report, { repetition: 4 }));
  report.cases.splice(missingIndex, 1);

  assert.throws(() => evaluateReports(sources), /expected exactly five completed measurements/);
});

test('rejects duplicate measurement repetition IDs', () => {
  const sources = clonedSources();
  const report = sources[0].report;
  findAttempt(report, { repetition: 1 }).repetition = 0;

  assert.throws(() => evaluateReports(sources), /measurement repetition IDs must be unique integers/);
});

test('rejects a missing expected warm-up', () => {
  const sources = clonedSources();
  const report = sources[0].report;
  const warmupIndex = report.cases.indexOf(findAttempt(report, { kind: 'warmup' }));
  report.cases.splice(warmupIndex, 1);

  assert.throws(() => evaluateReports(sources), /expected exactly one complete warm-up/);
});

test('rejects malformed and nonfinite required measurements', async (t) => {
  for (const value of [Number.NaN, 'not-a-number']) {
    await t.test(`rejects ${String(value)}`, () => {
      const sources = clonedSources();
      findAttempt(sources[0].report).firstVisibleAfterOpenMs = value;

      assert.throws(() => evaluateReports(sources), /firstVisibleAfterOpenMs must be a finite number/);
    });
  }
});

test('rejects missing random-access correctness evidence', () => {
  const sources = clonedSources();
  delete findAttempt(sources[0].report).scrollLatency.failedTargets;

  assert.throws(() => evaluateReports(sources), /scrollLatency.failedTargets must be an array/);
});

test('marks candidate budgets report-only and retains the 100k disagreements', () => {
  const result = evaluateReports(sourceReports);
  const firstVisible = result.assessment.budgets.find((item) => item.id === 'first-visible-after-open-100000');
  const randomScroll = result.assessment.budgets.find((item) => item.id === 'random-access-scroll-p95-100000');
  const endKey = result.assessment.budgets.find((item) => item.id === 'end-key-visible-p95-100000');

  assert.equal(firstVisible.status, 'inconclusive-near-or-over-target');
  assert.deepEqual(firstVisible.evidence.map((item) => item.passes), [false, true]);
  assert.equal(randomScroll.status, 'inconclusive-runner-sensitive');
  assert.deepEqual(randomScroll.evidence.map((item) => item.passes), [false, true]);
  assert.equal(endKey.status, 'not-met-at-this-size');
  assert.match(endKey.enforcement, /report-only/);
  assert.deepEqual(result.releaseGateClassification.certifiedPerformanceBudgets, []);
});
