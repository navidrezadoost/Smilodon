#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import process from 'node:process';

const inputPath = resolve(
  process.cwd(),
  process.argv[2] ?? process.env.PHASE4_BENCHMARK_OUTPUT ?? 'test-results/performance/phase-4.6.2a.json',
);
const input = JSON.parse(readFileSync(inputPath, 'utf8'));

function quantile(values, percentile) {
  const finite = values.filter((value) => Number.isFinite(value)).sort((left, right) => left - right);
  if (finite.length === 0) return null;
  return finite[Math.max(0, Math.ceil(percentile * finite.length) - 1)];
}

function summarize(values) {
  return {
    samples: values.filter((value) => Number.isFinite(value)).length,
    p50: quantile(values, 0.50),
    p95: quantile(values, 0.95),
    p99: quantile(values, 0.99),
  };
}

const groups = new Map();
for (const result of input.cases) {
  const key = `${result.datasetSize}:${result.mode}`;
  const group = groups.get(key) ?? [];
  group.push(result);
  groups.set(key, group);
}

const summary = {
  generatedAt: new Date().toISOString(),
  source: relative(process.cwd(), inputPath),
  commit: input.commit,
  completionStatus: input.completionStatus ?? 'unknown',
  failure: input.failure ?? null,
  browser: input.browser,
  runner: input.runner,
  protocol: input.protocol,
  cases: Array.from(groups.entries(), ([key, results]) => {
    const [datasetSize, mode] = key.split(':');
    const completed = results.filter((result) => result.status === 'complete');
    const incomplete = results.filter((result) => result.status !== 'complete');
    const scrollSamples = completed.flatMap((result) => result.scrollLatency.samplesMs);
    const frameP95Samples = completed
      .map((result) => result.frameObservations.p95Ms)
      .filter((value) => Number.isFinite(value));
    return {
      datasetSize: Number(datasetSize),
      mode,
      attemptedRepetitions: results.length,
      completedRepetitions: completed.length,
      incompleteCases: incomplete.map(({ status, failureStage, timeoutMs, elapsedMs, error }) => ({
        status,
        failureStage,
        timeoutMs,
        elapsedMs,
        error,
      })),
      registrationToInitialRenderMs: summarize(completed.map((result) => result.registrationToInitialRenderMs)),
      firstVisibleAfterOpenMs: summarize(completed.map((result) => result.firstVisibleAfterOpenMs)),
      openToRenderSettledMs: summarize(completed.map((result) => result.openToRenderSettledMs)),
      keyboardEndHandlerLatencyMs: summarize(completed.map((result) => result.keyboardEndHandlerLatencyMs)),
      keyboardEndToVisibleTargetMs: summarize(completed.map((result) => result.keyboardEndToVisibleTargetMs)),
      scrollSeekLatencyMs: summarize(scrollSamples),
      sustainedScrollSeekLatencyMs: summarize(
        completed.flatMap((result) => result.sustainedScroll?.samplesMs ?? []),
      ),
      sustainedScrollFrameP95PerTrialMs: summarize(
        completed
          .map((result) => result.sustainedScroll?.frameObservations?.p95Ms)
          .filter((value) => Number.isFinite(value)),
      ),
      sustainedScrollFramesOver50ms: completed.reduce(
        (total, result) => total + (result.sustainedScroll?.frameObservations?.over50ms ?? 0),
        0,
      ),
      sustainedScrollFrameSampleCount: completed.reduce(
        (total, result) => total + (result.sustainedScroll?.frameObservations?.sampleCount ?? 0),
        0,
      ),
      filterToRenderedResultsMs: summarize(completed.map((result) => result.filter?.eventToRenderedResultsMs)),
      maxMountedOptions: completed.length
        ? Math.max(...completed.map((result) => result.dom.maxObservedMountedOptionCount))
        : null,
      maxObservedDeepDocumentNodes: completed.length
        ? Math.max(...completed.map((result) => result.dom.maxObservedDeepDocumentNodeCount))
        : null,
      retainedHeapDeltaBytes: summarize(completed.map((result) => result.memory.retainedHeapDeltaBytes)),
      frameP95PerTrialMs: summarize(completed.flatMap((result) => result.frameObservations.p95Ms === null ? [] : [result.frameObservations.p95Ms])),
      frameIntervalsOver50ms: completed.reduce((total, result) => total + result.frameObservations.over50ms, 0),
      failedScrollTargets: completed.flatMap((result) => result.scrollLatency.failedTargets),
      // A full raw frame series is stored per case; this field only summarizes each case's frame p95.
      frameSampleCount: completed.reduce((total, result) => total + result.frameObservations.sampleCount, 0),
      // Keeps deterministic access to each case's raw scroll latency distribution.
      scrollLatencySamplesMs: scrollSamples,
      frameP95SamplesMs: frameP95Samples,
    };
  }).sort((left, right) => left.datasetSize - right.datasetSize || left.mode.localeCompare(right.mode)),
};

const outputPath = inputPath.replace(/\.json$/i, '.summary.json');
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(`Phase 4 browser benchmark summary: ${outputPath}`);
console.log(`Commit: ${summary.commit}; browser: ${summary.browser.engine} ${summary.browser.version}; Playwright ${input.playwrightVersion}; expected revision ${summary.browser.expectedRevision}`);
for (const result of summary.cases) {
  const formatMs = (value, digits = 1) => Number.isFinite(value) ? value.toFixed(digits) : 'n/a';
  console.log([
    `${result.datasetSize.toLocaleString()} ${result.mode}`,
    `completed=${result.completedRepetitions}/${result.attemptedRepetitions}`,
    `register p50/p95=${formatMs(result.registrationToInitialRenderMs.p50)}/${formatMs(result.registrationToInitialRenderMs.p95)} ms`,
    `open p50/p95=${formatMs(result.firstVisibleAfterOpenMs.p50)}/${formatMs(result.firstVisibleAfterOpenMs.p95)} ms`,
    `scroll p50/p95/p99=${formatMs(result.scrollSeekLatencyMs.p50, 2)}/${formatMs(result.scrollSeekLatencyMs.p95, 2)}/${formatMs(result.scrollSeekLatencyMs.p99, 2)} ms`,
    `DOM options max=${result.maxMountedOptions}`,
    `retained heap p50=${result.retainedHeapDeltaBytes.p50 === null ? 'n/a' : `${(result.retainedHeapDeltaBytes.p50 / (1024 * 1024)).toFixed(1)}MiB`}`,
  ].join(' | '));
  for (const incomplete of result.incompleteCases) {
    console.log(`  incomplete: ${incomplete.failureStage ?? 'unknown stage'} after ${incomplete.elapsedMs ?? 'unknown'}ms — ${incomplete.error ?? incomplete.status}`);
  }
  if (result.sustainedScrollSeekLatencyMs.samples > 0) {
    console.log([
      `  sustained scroll samples=${result.sustainedScrollSeekLatencyMs.samples}`,
      `update p50/p95/p99=${formatMs(result.sustainedScrollSeekLatencyMs.p50, 2)}/${formatMs(result.sustainedScrollSeekLatencyMs.p95, 2)}/${formatMs(result.sustainedScrollSeekLatencyMs.p99, 2)} ms`,
      `frame p95=${formatMs(result.sustainedScrollFrameP95PerTrialMs.p95, 2)} ms`,
      `frames >50ms=${result.sustainedScrollFramesOver50ms}`,
    ].join(' | '));
  }
}
if ((input.protocol?.measuredRepetitionsPerModeAndSize ?? 0) < 5 || (input.protocol?.warmupsPerModeAndSize ?? 0) < 1) {
  console.warn('Exploratory baseline only: use at least one warm-up and five measured repetitions per mode/size before release-gating claims.');
}
