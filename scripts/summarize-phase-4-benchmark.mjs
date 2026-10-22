#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import process from 'node:process';
import { summarizeBenchmarkReport } from './phase-4-benchmark-summary.mjs';

const inputPath = resolve(
  process.cwd(),
  process.argv[2] ?? process.env.PHASE4_BENCHMARK_OUTPUT ?? 'test-results/performance/phase-4.6.2a.json',
);
const input = JSON.parse(readFileSync(inputPath, 'utf8'));
const summary = summarizeBenchmarkReport(input, {
  source: relative(process.cwd(), inputPath),
});
const outputPath = inputPath.replace(/\.json$/i, '.summary.json');
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);

console.log(`Phase 4 browser benchmark summary: ${outputPath}`);
console.log(`Commit: ${summary.commit}; browser: ${summary.browser?.engine ?? 'unknown'} ${summary.browser?.version ?? 'unknown'}; Playwright ${input.playwrightVersion ?? 'unknown'}; expected revision ${summary.browser?.expectedRevision ?? 'unknown'}`);
console.log(`Summary validation: ${summary.validation.passed ? 'passed' : 'FAILED'} (${summary.validation.issueCount} issues); censored legacy cases: ${summary.censoredCaseCount}`);

const formatMs = (value, digits = 1) => Number.isFinite(value) ? value.toFixed(digits) : 'n/a';
for (const result of summary.cases) {
  console.log([
    `${result.datasetSize.toLocaleString()} ${result.mode}`,
    `valid repetitions=${result.validRepetitions}/${result.plannedRepetitions ?? 'unknown'}`,
    `hidden render p50/p95=${formatMs(result.registrationToHiddenRenderSettleAcrossTrialsMs.p50)}/${formatMs(result.registrationToHiddenRenderSettleAcrossTrialsMs.p95)} ms`,
    `registration-to-interactive p50/p95=${formatMs(result.registrationToInteractiveAcrossTrialsMs.p50)}/${formatMs(result.registrationToInteractiveAcrossTrialsMs.p95)} ms`,
    `open-visible p50/p95=${formatMs(result.firstVisibleAfterOpenAcrossTrialsMs.p50)}/${formatMs(result.firstVisibleAfterOpenAcrossTrialsMs.p95)} ms`,
    `scroll-event pooled p95=${formatMs(result.scrollSeekLatencyPooledEventsMs.p95, 2)} ms`,
    `per-trial scroll p95 distribution=${formatMs(result.scrollSeekPerTrialP95Ms.p50, 2)}/${formatMs(result.scrollSeekPerTrialP95Ms.p95, 2)} ms`,
    `DOM options max=${result.maxMountedOptions}`,
  ].join(' | '));
  for (const attempt of result.incompleteOrFailed) {
    console.log(`  ${attempt.kind} ${attempt.classification}: ${attempt.status} at ${attempt.failureStage ?? 'unknown stage'} after ${attempt.elapsedMs ?? 'unknown'}ms; artifacts=${JSON.stringify(attempt.artifacts)}`);
  }
  if (result.sustainedScrollPerTrialP95Ms.sampleCount > 0) {
    console.log(`  sustained scroll per-trial p95 p50/p95=${formatMs(result.sustainedScrollPerTrialP95Ms.p50, 2)}/${formatMs(result.sustainedScrollPerTrialP95Ms.p95, 2)} ms; >50ms frames=${result.sustainedScrollFrameIntervalsOver50ms}`);
  }
  if (result.resizeObserverWarnings.pageConsole > 0 || result.resizeObserverWarnings.cdpLog > 0) {
    console.log(`  ResizeObserver warnings: page console=${result.resizeObserverWarnings.pageConsole}, CDP Log=${result.resizeObserverWarnings.cdpLog}`);
  }
}
for (const issue of summary.validation.issues) console.error(`validation case ${issue.caseIndex}: ${issue.code} — ${issue.message}`);
if (!summary.validation.passed) process.exitCode = 1;
