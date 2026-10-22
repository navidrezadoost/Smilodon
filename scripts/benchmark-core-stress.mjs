import { execFileSync, spawnSync } from 'node:child_process';
import { arch, cpus, freemem, platform, release, tmpdir, totalmem } from 'node:os';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const DEFAULT_WARMUPS = 1;
const DEFAULT_REPETITIONS = 5;
const OUTPUT_PATH = resolve(
  process.cwd(),
  process.env.PHASE4_CORE_STRESS_BENCHMARK_OUTPUT
    ?? 'test-results/performance/phase-4.6.2a2-core-stress.json',
);
const TARGETS_MS = {
  computeWindow: 10,
  cumulativeOffset: 5,
  initialRender: 50,
  fenwickPopulate1000: 100,
  fenwickPrefixQueries1000: 50,
  fenwickUpdates1000: 100,
  telemetryMeasurement: 100,
};
const EXPECTED_STAGES = Object.keys(TARGETS_MS);

function readCount(name, fallback, allowZero = false) {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < (allowZero ? 0 : 1)) {
    throw new Error(`${name} must be a ${allowZero ? 'non-negative' : 'positive'} integer`);
  }
  return value;
}

function quantile(values, percentile) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(percentile * sorted.length) - 1)];
}

function getCommit() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function getRunnerMetadata() {
  const cpu = cpus()[0];
  return {
    nodeVersion: process.version,
    platform: platform(),
    release: release(),
    architecture: arch(),
    cpuCount: cpus().length,
    cpuModel: cpu?.model ?? null,
    totalMemoryBytes: totalmem(),
    freeMemoryAtStartBytes: freemem(),
    githubActions: process.env.GITHUB_ACTIONS === 'true',
    githubRunnerName: process.env.RUNNER_NAME ?? null,
    githubImageOS: process.env.ImageOS ?? null,
    githubImageVersion: process.env.ImageVersion ?? null,
  };
}

function runStressSuite(outputPath) {
  const args = [
    resolve('node_modules/vitest/vitest.mjs'),
    'run',
    '--config',
    'packages/core/vitest.config.ts',
    'packages/core/tests/stress.spec.ts',
  ];
  const result = spawnSync(process.execPath, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    env: {
      ...process.env,
      PHASE4_CORE_STRESS_SAMPLE_OUTPUT: outputPath,
    },
    timeout: 10 * 60 * 1000,
  });

  return {
    exitCode: result.status ?? 1,
    error: result.error?.message ?? null,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function readTimings(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

const warmups = readCount('PHASE4_CORE_STRESS_WARMUPS', DEFAULT_WARMUPS, true);
const repetitions = readCount('PHASE4_CORE_STRESS_REPETITIONS', DEFAULT_REPETITIONS);
const runnerMetadata = getRunnerMetadata();
const temporaryDirectory = mkdtempSync(resolve(tmpdir(), 'smilodon-core-stress-'));
const attempts = [];
let failedAttempt = null;

try {
  for (let index = 0; index < warmups + repetitions; index += 1) {
    const isWarmup = index < warmups;
    const output = resolve(temporaryDirectory, `attempt-${index + 1}.ndjson`);
    const result = runStressSuite(output);
    const timings = readTimings(output);
    const missingStages = EXPECTED_STAGES.filter(
      (stage) => timings.filter((sample) => sample.stage === stage).length !== 1,
    );
    const unexpectedStages = timings
      .filter((sample) => !EXPECTED_STAGES.includes(sample.stage))
      .map((sample) => sample.stage);
    const invalidSamples = timings
      .filter((sample) => !Number.isFinite(sample.durationMs) || sample.durationMs < 0)
      .map((sample) => sample.stage);

    attempts.push({
      index: index + 1,
      kind: isWarmup ? 'warmup' : 'measured',
      exitCode: result.exitCode,
      timings,
      missingStages,
      unexpectedStages,
      invalidSamples,
      stdoutTail: result.stdout.slice(-4_000),
      stderrTail: result.stderr.slice(-4_000),
    });

    console.log(`[core-stress] ${isWarmup ? 'warmup' : 'measured'} ${isWarmup ? index + 1 : index - warmups + 1}/${isWarmup ? warmups : repetitions}: exit=${result.exitCode}, stages=${timings.length}`);

    if (
      result.exitCode !== 0
      || missingStages.length > 0
      || unexpectedStages.length > 0
      || invalidSamples.length > 0
    ) {
      failedAttempt = {
        index: index + 1,
        kind: isWarmup ? 'warmup' : 'measured',
        exitCode: result.exitCode,
        missingStages,
        unexpectedStages,
        invalidSamples,
        error: result.error,
        stdout: result.stdout.slice(-20_000),
        stderr: result.stderr.slice(-20_000),
      };
      break;
    }
  }
} finally {
  // This is the exact temporary directory created for this invocation.
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

const measuredAttempts = attempts.filter((attempt) => attempt.kind === 'measured');
const stageResults = Object.fromEntries(EXPECTED_STAGES.map((stage) => {
  const samples = measuredAttempts
    .flatMap((attempt) => attempt.timings)
    .filter((sample) => sample.stage === stage)
    .map((sample) => sample.durationMs);
  const medianMs = quantile(samples, 0.5);
  const targetMs = TARGETS_MS[stage];
  return [stage, {
    targetMs,
    samplesMs: samples,
    medianMs,
    p95Ms: quantile(samples, 0.95),
    targetExceeded: medianMs === null || medianMs > targetMs,
  }];
}));

const targetFailures = Object.entries(stageResults)
  .filter(([, result]) => result.targetExceeded)
  .map(([stage, result]) => ({ stage, medianMs: result.medianMs, targetMs: result.targetMs }));
const complete = failedAttempt === null && measuredAttempts.length === repetitions;
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  commit: getCommit(),
  workload: 'packages/core/tests/stress.spec.ts complete suite; includes 1M-item virtualizer and Fenwick workloads',
  protocol: {
    warmups,
    repetitions,
    aggregation: 'Targets are compared against the median of measured runs; warm-ups are excluded.',
    timingSource: 'performance.now() through the existing measureSync helper',
    targetClassification: 'historical diagnostic regression targets, not certified universal SLOs',
  },
  runner: runnerMetadata,
  attempts,
  stages: stageResults,
  failedAttempt,
  targetFailures,
  complete,
  status: !complete ? 'incomplete' : targetFailures.length > 0 ? 'target-exceeded' : 'passed',
};

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Core stress benchmark report: ${OUTPUT_PATH}`);
console.log(JSON.stringify({ status: report.status, stages: stageResults, targetFailures }, null, 2));

if (!complete || targetFailures.length > 0) process.exitCode = 1;
