import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPORT_NAME = 'phase-4.6.2c3b-frame-attribution.json';
const EXPECTED_TARGET_INDEX = 99_999;
const DEFAULT_BOOTSTRAP_REPLICATES = 2_000;
const PERCENTILE_REQUIREMENTS = {
  p95: { probability: 0.95, minimumRuns: 20, minimumPairs: 100 },
  p99: { probability: 0.99, minimumRuns: 30, minimumPairs: 300 },
};
const REQUIRED_METRICS = [
  'eventToHandlerReturnMs',
  'firstEligibleFrameLatencyMs',
  'firstFrameToPlaywrightConfirmationMs',
  'observedEndToVisibleMs',
];

function finiteNonNegative(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function sameNumber(left, right, tolerance = 0.02) {
  return Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) <= tolerance;
}

function collectJsonFiles(directory) {
  try {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) return collectJsonFiles(path);
      return entry.isFile() && entry.name === REPORT_NAME ? [path] : [];
    }).sort();
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

function sourceRunKey(report) {
  return report?.replication?.sourceRunKey ?? null;
}

function sourceReplicationId(report) {
  const value = report?.replication?.replicationId;
  return value == null ? null : String(value);
}

function validateSourceReport(report, { expectedCommit } = {}) {
  const errors = [];
  const add = (condition, message) => { if (!condition) errors.push(message); };
  add(isRecord(report), 'source report must be a JSON object');
  if (!isRecord(report)) return errors;

  add(report.schemaVersion === 2, 'schemaVersion must be 2');
  add(report.phase === '4.6.2C.3B', 'phase must be 4.6.2C.3B');
  add(report.completionStatus === 'complete-pinned-browser', 'source report must have complete-pinned-browser completionStatus');

  const environment = report.environment;
  add(isRecord(environment), 'environment metadata is required');
  if (!isRecord(environment)) return errors;
  const commit = environment.commit;
  add(typeof commit === 'string' && /^[0-9a-f]{40}$/i.test(commit), 'environment.commit must be a full 40-character Git revision');
  add(environment.workingTreeDirty === false, 'workingTreeDirty must be false');
  if (expectedCommit) add(commit === expectedCommit, `source commit ${commit ?? '(missing)'} does not match expected commit ${expectedCommit}`);

  const replication = report.replication;
  add(isRecord(replication), 'replication provenance metadata is required');
  if (!isRecord(replication)) return errors;
  const workflowRunId = String(replication.workflowRunId ?? '');
  const workflowRunAttempt = String(replication.workflowRunAttempt ?? '');
  const replicationId = sourceReplicationId(report);
  add(/^\d+$/.test(workflowRunId) && Number(workflowRunId) > 0, 'replication.workflowRunId must be a positive numeric GitHub Actions run ID');
  add(/^\d+$/.test(workflowRunAttempt) && Number(workflowRunAttempt) > 0, 'replication.workflowRunAttempt must be a positive integer');
  add(replicationId !== null && /^\d+$/.test(replicationId) && Number(replicationId) > 0, 'replication.replicationId must be a positive numeric matrix index');
  const expectedRunKey = workflowRunId && workflowRunAttempt && replicationId
    ? `${workflowRunId}.${workflowRunAttempt}.${replicationId}`
    : null;
  add(replication.sourceRunKey === expectedRunKey, 'replication.sourceRunKey must match workflow run, attempt, and replication index');
  add(replication.workflowSha === commit, 'replication.workflowSha must match the checked-out commit');

  add(typeof environment.nodeVersion === 'string' && environment.nodeVersion.length > 0, 'Node.js version metadata is required');
  add(typeof environment.playwrightVersion === 'string' && environment.playwrightVersion.length > 0, 'Playwright version metadata is required');
  const browser = environment.browser;
  add(isRecord(browser), 'browser metadata is required');
  if (isRecord(browser)) {
    add(browser.engine === 'chromium', 'browser engine must be chromium');
    add(typeof browser.actualVersion === 'string' && browser.actualVersion.length > 0, 'actual Chromium version is required');
    add(typeof browser.expectedVersion === 'string' && browser.expectedVersion.length > 0, 'Playwright-pinned Chromium version is required');
    add(String(browser.expectedRevision ?? '').length > 0, 'Playwright-pinned Chromium revision is required');
    add(browser.actualVersion === browser.expectedVersion && browser.pinnedVersionMatch === true, 'actual Chromium must match the Playwright-pinned version');
  }

  const runner = environment.runner;
  add(isRecord(runner), 'runner metadata is required');
  if (isRecord(runner)) {
    for (const key of ['platform', 'release', 'architecture', 'cpuModel']) {
      add(typeof runner[key] === 'string' && runner[key].length > 0, `runner.${key} is required`);
    }
    add(Number.isSafeInteger(runner.cpuCount) && runner.cpuCount > 0, 'runner.cpuCount must be a positive integer');
    add(Number.isFinite(runner.totalMemoryBytes) && runner.totalMemoryBytes > 0, 'runner.totalMemoryBytes must be positive');
    add(typeof runner.githubImageOS === 'string' && runner.githubImageOS.length > 0, 'runner.githubImageOS is required');
    add(typeof runner.githubImageVersion === 'string' && runner.githubImageVersion.length > 0, 'runner.githubImageVersion is required');
    add(runner.githubActions === true, 'source must run on GitHub Actions');
  }

  const protocol = report.protocol;
  add(isRecord(protocol), 'protocol metadata is required');
  if (!isRecord(protocol)) return errors;
  add(Number.isSafeInteger(protocol.warmupPairs) && protocol.warmupPairs >= 0, 'protocol.warmupPairs must be a non-negative integer');
  add(Number.isSafeInteger(protocol.measuredPairs) && protocol.measuredPairs > 0, 'protocol.measuredPairs must be a positive integer');
  add(protocol.arms?.length === 2 && protocol.arms[0] === 'minimal' && protocol.arms[1] === 'instrumented', 'protocol arms must be minimal and instrumented');
  add(protocol.startingArm === 'minimal' || protocol.startingArm === 'instrumented', 'protocol.startingArm is required');
  add(protocol.itemCount === 100_000, 'protocol.itemCount must be 100000');
  add(protocol.itemHeightPx === 40, 'protocol.itemHeightPx must be 40');
  add(protocol.listViewportHeight === 320, 'protocol.listViewportHeight must be 320');
  add(typeof protocol.datasetSha256 === 'string' && /^[0-9a-f]{64}$/i.test(protocol.datasetSha256), 'protocol.datasetSha256 must be a SHA-256 fingerprint');
  add(isRecord(protocol.viewport)
    && protocol.viewport.width === 1280
    && protocol.viewport.height === 800
    && protocol.viewport.deviceScaleFactor === 1,
  'protocol viewport must be 1280x800 at device scale factor 1');
  add(Array.isArray(protocol.pairOrders)
    && protocol.pairOrders.length === protocol.warmupPairs + protocol.measuredPairs,
  'protocol.pairOrders must cover every warm-up and measured pair');
  if (Array.isArray(protocol.pairOrders)) {
    for (let pair = 0; pair < protocol.pairOrders.length; pair += 1) {
      const expectedOrder = pair % 2 === 0
        ? [protocol.startingArm, protocol.startingArm === 'minimal' ? 'instrumented' : 'minimal']
        : [protocol.startingArm === 'minimal' ? 'instrumented' : 'minimal', protocol.startingArm];
      add(JSON.stringify(protocol.pairOrders[pair]) === JSON.stringify(expectedOrder), `protocol.pairOrders[${pair}] does not alternate from the declared starting arm`);
    }
  }

  const attempts = report.attempts;
  add(Array.isArray(attempts), 'attempts must be an array');
  if (!Array.isArray(attempts)) return errors;
  const expectedAttemptCount = (protocol.warmupPairs + protocol.measuredPairs) * 2;
  add(attempts.length === expectedAttemptCount, `expected ${expectedAttemptCount} arm attempts, found ${attempts.length}`);

  const attemptIds = new Set();
  const attemptsByPair = new Map();
  for (const attempt of attempts) {
    if (!isRecord(attempt)) {
      errors.push('every attempt must be an object');
      continue;
    }
    const pair = attempt.pair;
    const arm = attempt.arm;
    const id = `${pair}:${arm}`;
    add(Number.isSafeInteger(pair) && pair >= 0 && pair < protocol.warmupPairs + protocol.measuredPairs, `attempt pair ${pair} is outside the planned protocol`);
    add(arm === 'minimal' || arm === 'instrumented', `attempt ${id} has an unknown arm`);
    add(!attemptIds.has(id), `attempt ${id} is duplicated`);
    attemptIds.add(id);
    const pairAttempts = attemptsByPair.get(pair) ?? [];
    pairAttempts.push(attempt);
    attemptsByPair.set(pair, pairAttempts);
    add(attempt.status === 'complete', `attempt ${id} is not complete`);
    add(attempt.warmup === (pair < protocol.warmupPairs), `attempt ${id} has inconsistent warm-up classification`);
    add(attempt.orderIndex === protocol.pairOrders[pair]?.indexOf(arm), `attempt ${id} has an orderIndex inconsistent with protocol.pairOrders`);

    if (attempt.status !== 'complete') continue;
    const correctness = attempt.correctness;
    add(isRecord(correctness), `attempt ${id} lacks correctness evidence`);
    if (isRecord(correctness)) {
      add(correctness.expectedTargetIndex === EXPECTED_TARGET_INDEX, `attempt ${id} expected target index is incorrect`);
      add(correctness.itemCount === 100_000, `attempt ${id} did not contain 100000 items`);
      add(correctness.endKeyEventCount === 1, `attempt ${id} must observe exactly one End-key event`);
      add(correctness.activeIndex === EXPECTED_TARGET_INDEX, `attempt ${id} final active index is incorrect`);
      add(correctness.ariaTargetIndex === EXPECTED_TARGET_INDEX, `attempt ${id} ARIA target index is incorrect`);
      add(typeof correctness.targetKey === 'string' && correctness.targetKey === `option-${EXPECTED_TARGET_INDEX}`, `attempt ${id} final target key is incorrect`);
      add(correctness.activeKey === correctness.targetKey, `attempt ${id} active key does not match its target`);
      add(correctness.ariaTargetKey === correctness.targetKey, `attempt ${id} ARIA target key does not match its target`);
      add(typeof correctness.ariaActiveDescendant === 'string' && correctness.ariaActiveDescendant.length > 0, `attempt ${id} lacks a valid aria-activedescendant`);
      add(correctness.targetVisible === true, `attempt ${id} final target is not visible`);
      add(Number.isSafeInteger(correctness.mountedOptionCount) && correctness.mountedOptionCount > 0 && correctness.mountedOptionCount <= 64, `attempt ${id} violates the mounted-option ceiling`);
      add(Array.isArray(correctness.browserErrors) && correctness.browserErrors.length === 0, `attempt ${id} has browser errors or missing browser error evidence`);
    }

    const frame = attempt.browserFrameObservation;
    add(isRecord(frame) && frame.status === 'observed', `attempt ${id} lacks a successful browser-frame observation`);
    const observation = frame?.firstEligibleFrame;
    add(isRecord(observation), `attempt ${id} lacks first eligible frame details`);
    if (isRecord(observation)) {
      add(observation.targetMounted === true && observation.visible === true && observation.active === true && observation.ariaReferenced === true,
        `attempt ${id} first eligible frame did not satisfy all render-ready conditions`);
      add(observation.activeIndex === EXPECTED_TARGET_INDEX
        && observation.activeKey === `option-${EXPECTED_TARGET_INDEX}`
        && observation.targetKey === `option-${EXPECTED_TARGET_INDEX}`,
        `attempt ${id} first eligible frame observed the wrong target`);
    }

    const metrics = attempt.metrics;
    add(isRecord(metrics), `attempt ${id} lacks metrics`);
    if (isRecord(metrics)) {
      for (const key of REQUIRED_METRICS) add(finiteNonNegative(metrics[key]), `attempt ${id} metric ${key} must be a finite non-negative number`);
    }

    const browserTimes = attempt.timestamps?.browserPerformanceNowMs;
    const orderedTimes = [
      browserTimes?.endEventAt,
      browserTimes?.handlerReturnAt,
      browserTimes?.targetMountedAt,
      browserTimes?.firstEligibleFrameAt,
      browserTimes?.stableGeometryObservedAt,
      browserTimes?.playwrightConfirmedAt,
    ];
    add(orderedTimes.every(Number.isFinite), `attempt ${id} lacks finite browser timestamps`);
    if (orderedTimes.every(Number.isFinite)) {
      add(orderedTimes.every((time, index) => index === 0 || time >= orderedTimes[index - 1]), `attempt ${id} browser timestamps are not monotonic`);
      add(sameNumber(frame?.firstEligibleFrameAt, browserTimes.firstEligibleFrameAt), `attempt ${id} frame-observer timestamp does not match the retained browser timestamp`);
      add(sameNumber(observation?.observedAt, browserTimes.firstEligibleFrameAt), `attempt ${id} first-frame observation time is inconsistent`);
      add(sameNumber(metrics?.eventToHandlerReturnMs, browserTimes.handlerReturnAt - browserTimes.endEventAt), `attempt ${id} handler-return metric does not match its timestamps`);
      add(sameNumber(metrics?.firstEligibleFrameLatencyMs, browserTimes.firstEligibleFrameAt - browserTimes.endEventAt), `attempt ${id} first-frame metric does not match its timestamps`);
      add(sameNumber(metrics?.firstFrameToPlaywrightConfirmationMs, browserTimes.playwrightConfirmedAt - browserTimes.firstEligibleFrameAt), `attempt ${id} frame-to-confirmation metric does not match its timestamps`);
      add(sameNumber(metrics?.observedEndToVisibleMs, browserTimes.playwrightConfirmedAt - browserTimes.endEventAt), `attempt ${id} End-to-visible metric does not match its timestamps`);
    }

    if (arm === 'instrumented') {
      const verification = correctness?.instrumentationVerification;
      add(isRecord(verification), `attempt ${id} lacks instrumentation interception evidence`);
      for (const key of ['handlerIntercepted', 'activeStateTransition', 'targetScrollCalculated', 'targetWindowUpdated', 'targetMaterialized', 'targetRendered']) {
        add(verification?.[key] === true, `attempt ${id} instrumentation evidence ${key} is not true`);
      }
    }
  }

  for (let pair = 0; pair < protocol.warmupPairs + protocol.measuredPairs; pair += 1) {
    const pairAttempts = attemptsByPair.get(pair) ?? [];
    add(pairAttempts.length === 2, `pair ${pair} is incomplete`);
    add(new Set(pairAttempts.map((attempt) => attempt.arm)).size === 2, `pair ${pair} does not contain exactly one attempt per arm`);
  }
  add(report.summary?.measuredPairCount === protocol.measuredPairs, 'summary measuredPairCount does not match the planned number of complete measured pairs');
  return errors;
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (isRecord(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

function compatibilityProfile(report) {
  const { environment, protocol } = report;
  return {
    commit: environment.commit,
    nodeVersion: environment.nodeVersion,
    playwrightVersion: environment.playwrightVersion,
    browser: {
      engine: environment.browser.engine,
      actualVersion: environment.browser.actualVersion,
      expectedVersion: environment.browser.expectedVersion,
      expectedRevision: String(environment.browser.expectedRevision),
    },
    fixture: {
      datasetSha256: protocol.datasetSha256,
      itemCount: protocol.itemCount,
      itemHeightPx: protocol.itemHeightPx,
      listViewportHeight: protocol.listViewportHeight,
      datasetRecipe: protocol.datasetRecipe,
      navigationSequence: protocol.navigationSequence,
    },
    viewport: protocol.viewport,
    warmupPairs: protocol.warmupPairs,
    measuredPairs: protocol.measuredPairs,
  };
}

function hardwareProfile(report) {
  const runner = report.environment.runner;
  return {
    platform: runner.platform,
    release: runner.release,
    architecture: runner.architecture,
    cpuModel: runner.cpuModel,
    cpuCount: runner.cpuCount,
    totalMemoryBytes: runner.totalMemoryBytes,
    githubImageOS: runner.githubImageOS,
    githubImageVersion: runner.githubImageVersion,
  };
}

function nearestRank(values, probability) {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(probability * sorted.length) - 1)];
}

function describe(values) {
  if (!values.length) return { sampleCount: 0, min: null, median: null, mean: null, p95: null, p99: null, max: null };
  return {
    sampleCount: values.length,
    min: Math.min(...values),
    median: nearestRank(values, 0.5),
    mean: values.reduce((total, value) => total + value, 0) / values.length,
    p95: nearestRank(values, 0.95),
    p99: nearestRank(values, 0.99),
    max: Math.max(...values),
  };
}

function seededRandom(seed) {
  let state = Number.parseInt(sha256(String(seed)).slice(0, 8), 16) || 0x6d2b79f5;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function clusterBootstrapInterval(clusters, probability, replicates, seed) {
  if (clusters.length < 2 || replicates < 1) return null;
  const random = seededRandom(seed);
  const values = [];
  for (let iteration = 0; iteration < replicates; iteration += 1) {
    const sample = [];
    for (let clusterIndex = 0; clusterIndex < clusters.length; clusterIndex += 1) {
      const cluster = clusters[Math.floor(random() * clusters.length)];
      for (let sampleIndex = 0; sampleIndex < cluster.length; sampleIndex += 1) {
        sample.push(cluster[Math.floor(random() * cluster.length)]);
      }
    }
    values.push(nearestRank(sample, probability));
  }
  return {
    confidenceLevel: 0.95,
    lower: nearestRank(values, 0.025),
    upper: nearestRank(values, 0.975),
    bootstrapReplicates: replicates,
    method: 'Two-stage run-cluster bootstrap: resample independent source runs, then measured pairs within each selected run.',
  };
}

function classify({ thresholdMs, confidenceInterval, runCount, pairCount, percentile }) {
  const requirement = PERCENTILE_REQUIREMENTS[percentile];
  const base = { thresholdMs: thresholdMs ?? null, classification: 'inconclusive' };
  if (!Number.isFinite(thresholdMs)) return { ...base, reason: 'No decision threshold was configured; all latency criteria remain report-only.' };
  if (runCount < requirement.minimumRuns || pairCount < requirement.minimumPairs) {
    return {
      ...base,
      reason: `Insufficient independent-run evidence for ${percentile}: requires at least ${requirement.minimumRuns} runs and ${requirement.minimumPairs} measured pairs.`,
    };
  }
  if (!confidenceInterval) return { ...base, reason: 'A run-clustered confidence interval could not be estimated.' };
  if (confidenceInterval.upper <= thresholdMs) {
    return { ...base, classification: 'supported', reason: 'The run-clustered 95% interval is entirely at or below the configured threshold.' };
  }
  if (confidenceInterval.lower > thresholdMs) {
    return { ...base, classification: 'unsupported', reason: 'The run-clustered 95% interval is entirely above the configured threshold.' };
  }
  return { ...base, reason: 'The run-clustered 95% interval overlaps the configured threshold.' };
}

function metricValues(runRecords, metric, arm = 'minimal') {
  return runRecords.map((run) => run.pairs
    .map((pair) => pair.arms[arm]?.metrics?.[metric])
    .filter(finiteNonNegative));
}

function analyzeMetric(runRecords, metric, { percentile, thresholdMs, bootstrapReplicates, seed, arm = 'minimal' }) {
  const clusters = metricValues(runRecords, metric, arm);
  const values = clusters.flat();
  const requirement = PERCENTILE_REQUIREMENTS[percentile];
  const confidenceInterval = clusterBootstrapInterval(clusters, requirement.probability, bootstrapReplicates, `${seed}:${metric}`);
  const runPercentiles = runRecords.map((run, index) => ({
    workflowRunKey: run.workflowRunKey,
    workflowRunId: run.workflowRunId,
    sourceRunKeys: run.sourceRunKeys,
    pairCount: clusters[index].length,
    percentileValueMs: nearestRank(clusters[index], requirement.probability),
  }));
  return {
    arm,
    percentile,
    distribution: describe(values),
    independentRunCount: clusters.filter((cluster) => cluster.length > 0).length,
    measuredPairCount: values.length,
    runPercentiles,
    runClusteredConfidenceInterval: confidenceInterval,
    classification: classify({
      thresholdMs,
      confidenceInterval,
      runCount: clusters.filter((cluster) => cluster.length > 0).length,
      pairCount: values.length,
      percentile,
    }),
  };
}

function analyzePairedDifference(runRecords, metric, { percentile, bootstrapReplicates, seed }) {
  const clusters = runRecords.map((run) => run.pairs
    .map((pair) => {
      const minimal = pair.arms.minimal?.metrics?.[metric];
      const instrumented = pair.arms.instrumented?.metrics?.[metric];
      return Number.isFinite(minimal) && Number.isFinite(instrumented) ? instrumented - minimal : null;
    })
    .filter((value) => typeof value === 'number' && Number.isFinite(value)));
  const values = clusters.flat();
  const requirement = PERCENTILE_REQUIREMENTS[percentile];
  const confidenceInterval = clusterBootstrapInterval(clusters, requirement.probability, bootstrapReplicates, `${seed}:${metric}:paired-difference`);
  return {
    definition: `Signed paired instrumented minus minimally instrumented ${metric}; it is diagnostic and is not subtracted as a correction.`,
    percentile,
    distribution: describe(values),
    independentWorkflowRunCount: clusters.filter((cluster) => cluster.length > 0).length,
    pairedSampleCount: values.length,
    runClusteredConfidenceInterval: confidenceInterval,
    classification: {
      classification: 'inconclusive',
      reason: 'Paired instrumentation differences are diagnostic, not a release budget.',
    },
  };
}

function rawPairs(report) {
  const measured = report.attempts.filter((attempt) => attempt.status === 'complete' && attempt.warmup === false);
  const pairs = new Map();
  for (const attempt of measured) {
    const pair = pairs.get(attempt.pair) ?? { pair: attempt.pair, order: report.protocol.pairOrders[attempt.pair], arms: {} };
    pair.arms[attempt.arm] = {
      metrics: attempt.metrics,
      timestamps: attempt.timestamps,
      correctness: attempt.correctness,
      browserFrameObservation: attempt.browserFrameObservation,
    };
    pairs.set(attempt.pair, pair);
  }
  return [...pairs.values()].sort((left, right) => left.pair - right.pair);
}

export function aggregateReplicationReports({
  inputDirectory,
  expectedCount,
  expectedWorkflowRunId,
  expectedWorkflowRunIds,
  expectedCommit,
  thresholdMs,
  percentile = 'p95',
  bootstrapReplicates = DEFAULT_BOOTSTRAP_REPLICATES,
  seed = 'phase-4-c5a-bootstrap-v1',
}) {
  if (!PERCENTILE_REQUIREMENTS[percentile]) throw new Error('percentile must be p95 or p99');
  if (expectedCount !== undefined && (!Number.isSafeInteger(expectedCount) || expectedCount < 1)) {
    throw new Error('expectedCount must be a positive integer when supplied');
  }
  if (expectedCount === undefined && !expectedWorkflowRunId && !expectedWorkflowRunIds?.length) {
    throw new Error('expectedCount or at least one expected workflow run ID is required');
  }
  if (!Number.isSafeInteger(bootstrapReplicates) || bootstrapReplicates < 1) throw new Error('bootstrapReplicates must be a positive integer');
  if (thresholdMs !== undefined && (!Number.isFinite(thresholdMs) || thresholdMs <= 0)) throw new Error('thresholdMs must be positive when supplied');

  const files = collectJsonFiles(resolve(inputDirectory));
  const entries = files.map((filePath) => {
    let rawText = '';
    let report = null;
    let parseError = null;
    try {
      rawText = readFileSync(filePath, 'utf8');
      report = JSON.parse(rawText);
    } catch (error) {
      parseError = `could not parse source JSON: ${error instanceof Error ? error.message : String(error)}`;
    }
    return { filePath, rawText, report, parseError };
  });

  const keyCounts = new Map();
  const workflowReplicationCounts = new Map();
  const attemptsByWorkflow = new Map();
  const sourceCountsByWorkflow = new Map();
  for (const entry of entries) {
    const key = sourceRunKey(entry.report);
    if (key) keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
    const workflowId = String(entry.report?.replication?.workflowRunId ?? '');
    if (workflowId) sourceCountsByWorkflow.set(workflowId, (sourceCountsByWorkflow.get(workflowId) ?? 0) + 1);
    const replicationId = sourceReplicationId(entry.report);
    const uniqueReplicationKey = `${workflowId}.${replicationId}`;
    if (workflowId && replicationId) workflowReplicationCounts.set(uniqueReplicationKey, (workflowReplicationCounts.get(uniqueReplicationKey) ?? 0) + 1);
    const attempt = String(entry.report?.replication?.workflowRunAttempt ?? '');
    if (workflowId && attempt) {
      const attempts = attemptsByWorkflow.get(workflowId) ?? new Set();
      attempts.add(attempt);
      attemptsByWorkflow.set(workflowId, attempts);
    }
  }
  const sources = entries.map((entry) => {
    const report = entry.report;
    let errors = entry.parseError ? [entry.parseError] : validateSourceReport(report, { expectedCommit });
    const key = sourceRunKey(report);
    const replicationId = sourceReplicationId(report);
    const workflowId = String(report?.replication?.workflowRunId ?? '');
    const uniqueReplicationKey = `${workflowId}.${replicationId}`;
    if (key && keyCounts.get(key) > 1) errors.push(`duplicate sourceRunKey ${key}`);
    if (workflowId && replicationId && workflowReplicationCounts.get(uniqueReplicationKey) > 1) {
      errors.push(`duplicate replication index ${replicationId} for workflow run ${workflowId}`);
    }
    if (workflowId && attemptsByWorkflow.get(workflowId)?.size > 1) {
      errors.push(`workflow run ${workflowId} contains multiple attempts; select one complete attempt only`);
    }
    if (expectedWorkflowRunId && String(report?.replication?.workflowRunId) !== String(expectedWorkflowRunId)) {
      errors.push(`source workflow run ${report?.replication?.workflowRunId ?? '(missing)'} does not match expected workflow run ${expectedWorkflowRunId}`);
    }
    if (expectedWorkflowRunIds?.length && !expectedWorkflowRunIds.includes(workflowId)) {
      errors.push(`source workflow run ${workflowId || '(missing)'} is not in the requested workflow run list`);
    }
    if (expectedWorkflowRunIds?.length && workflowId && sourceCountsByWorkflow.get(workflowId) !== 1) {
      errors.push(`cross-run analysis requires exactly one source artifact per workflow run; found ${sourceCountsByWorkflow.get(workflowId)} for ${workflowId}`);
    }
    return {
      sourceFile: relative(resolve(inputDirectory), entry.filePath),
      sourceSha256: sha256(entry.rawText),
      sourceRunKey: key,
      replicationId,
      included: errors.length === 0,
      validationErrors: [...new Set(errors)],
      environment: report?.environment ?? null,
      protocol: report?.protocol ?? null,
      rawAttempts: Array.isArray(report?.attempts) ? report.attempts : [],
    };
  });

  const sameDispatchEntries = expectedWorkflowRunId
    ? entries.filter((entry) => String(entry.report?.replication?.workflowRunId) === String(expectedWorkflowRunId))
    : [];
  const foundIds = new Set(sameDispatchEntries.map((entry) => sourceReplicationId(entry.report)).filter(Boolean));
  const missingReplicationIds = expectedWorkflowRunId
    ? Array.from({ length: expectedCount }, (_, index) => String(index + 1)).filter((id) => !foundIds.has(id))
    : [];
  const observedWorkflowIds = new Set(entries.map((entry) => String(entry.report?.replication?.workflowRunId ?? '')).filter(Boolean));
  const missingWorkflowRunIds = (expectedWorkflowRunIds ?? [])
    .filter((workflowId) => !observedWorkflowIds.has(String(workflowId)));
  const duplicatedExpectedWorkflowRunIds = (expectedWorkflowRunIds ?? [])
    .filter((workflowId) => sourceCountsByWorkflow.get(String(workflowId)) > 1);
  const expectedArtifactCountMissing = expectedCount === undefined ? 0 : Math.max(0, expectedCount - entries.length);

  const strataMap = new Map();
  for (const source of sources) {
    if (!source.included) continue;
    const report = entries.find((entry) => relative(resolve(inputDirectory), entry.filePath) === source.sourceFile).report;
    const compatibility = compatibilityProfile(report);
    const hardware = hardwareProfile(report);
    const key = sha256(`${stableJson(compatibility)}\n${stableJson(hardware)}`);
    const stratum = strataMap.get(key) ?? {
      stratumKey: key,
      compatibilityProfile: compatibility,
      hardwareProfile: hardware,
      sourceRunKeys: [],
      runs: [],
    };
    const workflowRunKey = String(report.replication.workflowRunId);
    const pairs = rawPairs(report).map((pair) => ({ ...pair, sourceReplicationId: source.replicationId }));
    let run = stratum.runs.find((item) => item.workflowRunKey === workflowRunKey);
    if (!run) {
      run = {
        workflowRunKey,
        workflowRunId: report.replication.workflowRunId,
        workflowRunAttempts: [],
        sourceRunKeys: [],
        replications: [],
        pairs: [],
      };
      stratum.runs.push(run);
    }
    if (!run.workflowRunAttempts.includes(report.replication.workflowRunAttempt)) {
      run.workflowRunAttempts.push(report.replication.workflowRunAttempt);
    }
    run.sourceRunKeys.push(source.sourceRunKey);
    run.replications.push({ replicationId: source.replicationId, generatedAt: report.environment.generatedAt, pairs });
    run.pairs.push(...pairs);
    source.stratumKey = key;
    stratum.sourceRunKeys.push(source.sourceRunKey);
    strataMap.set(key, stratum);
  }

  const requirement = PERCENTILE_REQUIREMENTS[percentile];
  const strata = [...strataMap.values()].map((stratum) => {
    const runRecords = stratum.runs;
    const primary = analyzeMetric(runRecords, 'firstEligibleFrameLatencyMs', {
      percentile,
      thresholdMs,
      bootstrapReplicates,
      seed: `${seed}:${stratum.stratumKey}`,
    });
    return {
      stratumKey: stratum.stratumKey,
      compatibilityProfile: stratum.compatibilityProfile,
      hardwareProfile: stratum.hardwareProfile,
      sourceRunKeys: stratum.sourceRunKeys,
      independentRunCount: runRecords.length,
      independentWorkflowRunCount: runRecords.length,
      sourceReplicationCount: runRecords.reduce((sum, run) => sum + run.replications.length, 0),
      completeMeasuredPairCount: runRecords.reduce((sum, run) => sum + run.pairs.length, 0),
      studyPlanningRequirement: {
        percentile,
        minimumIndependentRuns: requirement.minimumRuns,
        minimumMeasuredPairs: requirement.minimumPairs,
        acceptedAsAutomaticCertification: false,
      },
      metrics: {
        firstEligibleFrameLatencyMs: primary,
        instrumentedFirstEligibleFrameLatencyMs: analyzeMetric(runRecords, 'firstEligibleFrameLatencyMs', {
          percentile,
          bootstrapReplicates,
          seed: `${seed}:${stratum.stratumKey}:instrumented-first-frame`,
          arm: 'instrumented',
        }),
        firstEligibleFrameInstrumentationDifferenceMs: analyzePairedDifference(runRecords, 'firstEligibleFrameLatencyMs', {
          percentile,
          bootstrapReplicates,
          seed: `${seed}:${stratum.stratumKey}:first-frame-difference`,
        }),
        observedEndToVisibleMs: analyzeMetric(runRecords, 'observedEndToVisibleMs', {
          percentile,
          bootstrapReplicates,
          seed: `${seed}:${stratum.stratumKey}:confirmation`,
        }),
        instrumentedObservedEndToVisibleMs: analyzeMetric(runRecords, 'observedEndToVisibleMs', {
          percentile,
          bootstrapReplicates,
          seed: `${seed}:${stratum.stratumKey}:instrumented-confirmation`,
          arm: 'instrumented',
        }),
        observedEndToVisibleInstrumentationDifferenceMs: analyzePairedDifference(runRecords, 'observedEndToVisibleMs', {
          percentile,
          bootstrapReplicates,
          seed: `${seed}:${stratum.stratumKey}:confirmation-difference`,
        }),
        firstFrameToPlaywrightConfirmationMs: analyzeMetric(runRecords, 'firstFrameToPlaywrightConfirmationMs', {
          percentile,
          bootstrapReplicates,
          seed: `${seed}:${stratum.stratumKey}:confirmation-gap`,
        }),
      },
      rawSamples: runRecords,
    };
  });

  const integrityErrors = [];
  if (expectedArtifactCountMissing > 0) integrityErrors.push(`expected ${expectedCount} source artifacts but discovered ${entries.length}`);
  if (missingReplicationIds.length) integrityErrors.push(`missing replication IDs: ${missingReplicationIds.join(', ')}`);
  if (missingWorkflowRunIds.length) integrityErrors.push(`missing workflow run artifacts: ${missingWorkflowRunIds.join(', ')}`);
  if (duplicatedExpectedWorkflowRunIds.length) integrityErrors.push(`expected one source report per workflow run; duplicates: ${duplicatedExpectedWorkflowRunIds.join(', ')}`);
  if (sources.some((source) => !source.included)) integrityErrors.push('one or more source reports failed integrity validation and were excluded from latency estimates');
  if (expectedCount !== undefined && entries.length !== expectedCount) integrityErrors.push(`source artifact count ${entries.length} does not equal expected count ${expectedCount}`);

  return {
    schemaVersion: 1,
    phase: '4.6.2C.5A',
    analysisPurpose: 'Controlled replication integrity and report-only run-clustered analysis; no latency budget is enforced.',
    protocol: {
      expectedSourceArtifactCount: expectedCount ?? null,
      expectedWorkflowRunId: expectedWorkflowRunId ?? null,
      expectedWorkflowRunIds: expectedWorkflowRunIds ?? null,
      expectedCommit: expectedCommit ?? null,
      percentile,
      thresholdMs: thresholdMs ?? null,
      bootstrapReplicates,
      bootstrapSeed: seed,
      fixture: '100000 deterministic options; fixture hash is validated and retained per source report.',
      browserAndViewport: 'Pinned Chromium, Playwright package lock, 1280x800 viewport, deviceScaleFactor 1, 320px list viewport.',
      sourceReportsMustBeComplete: true,
      warmupsExcluded: true,
      failedOrIncorrectAttemptsExcluded: true,
      incompletePairsExcluded: true,
      incompatibleCompatibilityOrHardwareProfilesAreNeverPooled: true,
    },
    integrity: {
      discoveredSourceCount: entries.length,
      validSourceCount: sources.filter((source) => source.included).length,
      rejectedSourceCount: sources.filter((source) => !source.included).length,
      missingReplicationIds,
      missingWorkflowRunIds,
      duplicatedExpectedWorkflowRunIds,
      errors: integrityErrors,
      validForAnalysis: integrityErrors.length === 0,
    },
    sources,
    strata,
  };
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) throw new Error(`unexpected argument ${token}`);
    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`missing value for --${key}`);
    options[key] = value;
    index += 1;
  }
  if (!options['input-dir'] || !options.output || (!options['expected-count'] && !options['expected-workflow-run-ids'])) {
    throw new Error('usage: node scripts/aggregate-phase-4-endkey-replication.mjs --input-dir DIR --output FILE (--expected-count N | --expected-workflow-run-ids JSON) [--expected-workflow-run-id ID] [--expected-commit SHA] [--percentile p95|p99] [--threshold-ms N]');
  }
  let expectedWorkflowRunIds;
  if (options['expected-workflow-run-ids']) {
    expectedWorkflowRunIds = JSON.parse(options['expected-workflow-run-ids']).map(String);
    if (!expectedWorkflowRunIds.length
      || expectedWorkflowRunIds.some((workflowId) => !/^\d+$/.test(workflowId) || Number(workflowId) < 1)
      || new Set(expectedWorkflowRunIds).size !== expectedWorkflowRunIds.length) {
      throw new Error('--expected-workflow-run-ids must be a non-empty JSON array of numeric run IDs');
    }
  }
  return {
    inputDirectory: options['input-dir'],
    outputPath: options.output,
    expectedCount: options['expected-count'] === undefined ? undefined : Number(options['expected-count']),
    expectedWorkflowRunId: options['expected-workflow-run-id'],
    expectedWorkflowRunIds,
    expectedCommit: options['expected-commit'],
    percentile: options.percentile ?? 'p95',
    thresholdMs: options['threshold-ms'] === undefined ? undefined : Number(options['threshold-ms']),
    bootstrapReplicates: options['bootstrap-replicates'] === undefined
      ? DEFAULT_BOOTSTRAP_REPLICATES
      : Number(options['bootstrap-replicates']),
    seed: options.seed ?? 'phase-4-c5a-bootstrap-v1',
  };
}

function runCli() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const report = aggregateReplicationReports(options);
    mkdirSync(dirname(resolve(options.outputPath)), { recursive: true });
    writeFileSync(resolve(options.outputPath), `${JSON.stringify(report, null, 2)}\n`);
    process.stdout.write(`C.5A aggregation: ${report.integrity.validSourceCount}/${report.integrity.discoveredSourceCount} valid source reports, ${report.strata.length} separate hardware/compatibility strata.\n`);
    for (const error of report.integrity.errors) process.stderr.write(`Integrity: ${error}\n`);
    if (!report.integrity.validForAnalysis) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href
  && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  runCli();
}
