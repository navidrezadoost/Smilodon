import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { aggregateReplicationReports } from '../../scripts/aggregate-phase-4-endkey-replication.mjs';

const REPORT_NAME = 'phase-4.6.2c3b-frame-attribution.json';
const COMMIT = 'a'.repeat(40);

function makeReport({
  replicationId = 1,
  runId = 10_000 + replicationId,
  cpuModel = 'AMD EPYC 7763 64-Core Processor',
  imageVersion = '20261018.339.1',
  latency = 50,
  sampleLatencies,
  start = 'minimal',
} = {}) {
  const warmupPairs = 1;
  const measuredPairs = 5;
  const pairOrders = Array.from({ length: warmupPairs + measuredPairs }, (_, pair) => (
    pair % 2 === 0
      ? [start, start === 'minimal' ? 'instrumented' : 'minimal']
      : [start === 'minimal' ? 'instrumented' : 'minimal', start]
  ));
  const attempts = [];
  for (let pair = 0; pair < pairOrders.length; pair += 1) {
    for (let orderIndex = 0; orderIndex < pairOrders[pair].length; orderIndex += 1) {
      const arm = pairOrders[pair][orderIndex];
      const value = pair < warmupPairs ? latency : (sampleLatencies?.[pair - warmupPairs] ?? latency);
      const eventAt = 100 + (pair * 20) + (orderIndex * 5);
      const handlerReturnAt = eventAt + 0.2;
      const targetMountedAt = eventAt + 0.4;
      const firstEligibleFrameAt = eventAt + value;
      const stableGeometryObservedAt = firstEligibleFrameAt + 1;
      const playwrightConfirmedAt = stableGeometryObservedAt + 1;
      const metrics = {
        eventToHandlerReturnMs: 0.2,
        firstEligibleFrameLatencyMs: value,
        firstFrameToPlaywrightConfirmationMs: 2,
        observedEndToVisibleMs: value + 2,
      };
      attempts.push({
        pair,
        warmup: pair < warmupPairs,
        orderIndex,
        arm,
        status: 'complete',
        metrics,
        timestamps: {
          browserPerformanceNowMs: {
            endEventAt: eventAt,
            handlerReturnAt,
            targetMountedAt,
            firstEligibleFrameAt,
            stableGeometryObservedAt,
            playwrightConfirmedAt,
          },
        },
        correctness: {
          expectedTargetIndex: 99_999,
          targetKey: 'option-99999',
          activeKey: 'option-99999',
          endKeyEventCount: 1,
          itemCount: 100_000,
          activeIndex: 99_999,
          ariaTargetIndex: 99_999,
          ariaTargetKey: 'option-99999',
          ariaActiveDescendant: 'phase4-option-99999',
          targetVisible: true,
          mountedOptionCount: 12,
          browserErrors: [],
          instrumentationVerification: arm === 'instrumented' ? {
            handlerIntercepted: true,
            activeStateTransition: true,
            targetScrollCalculated: true,
            targetWindowUpdated: true,
            targetMaterialized: true,
            targetRendered: true,
          } : null,
        },
        browserFrameObservation: {
          status: 'observed',
          firstEligibleFrameAt,
          firstEligibleFrame: {
            observedAt: firstEligibleFrameAt,
            targetMounted: true,
            visible: true,
            active: true,
            ariaReferenced: true,
            activeIndex: 99_999,
            activeKey: 'option-99999',
            targetKey: 'option-99999',
          },
        },
      });
    }
  }

  return {
    schemaVersion: 2,
    phase: '4.6.2C.3B',
    completionStatus: 'complete-pinned-browser',
    environment: {
      commit: COMMIT,
      workingTreeDirty: false,
      generatedAt: '2026-10-23T00:00:00.000Z',
      nodeVersion: 'v20.20.2',
      playwrightVersion: '1.59.1',
      browser: {
        engine: 'chromium',
        actualVersion: '147.0.7727.15',
        expectedVersion: '147.0.7727.15',
        expectedRevision: '1217',
        pinnedVersionMatch: true,
      },
      runner: {
        platform: 'linux',
        release: '7.0.0-1017-azure',
        architecture: 'x64',
        cpuCount: 4,
        cpuModel,
        totalMemoryBytes: 16_000_000_000,
        githubActions: true,
        githubImageOS: 'ubuntu24',
        githubImageVersion: imageVersion,
      },
    },
    replication: {
      workflowRunId: String(runId),
      workflowRunAttempt: '1',
      workflowSha: COMMIT,
      replicationId: String(replicationId),
      sourceRunKey: `${runId}.1.${replicationId}`,
    },
    protocol: {
      warmupPairs,
      measuredPairs,
      arms: ['minimal', 'instrumented'],
      startingArm: start,
      pairOrders,
      viewport: { width: 1280, height: 800, deviceScaleFactor: 1 },
      listViewportHeight: 320,
      itemCount: 100_000,
      itemHeightPx: 40,
      datasetSha256: 'b'.repeat(64),
      datasetRecipe: 'fixture-v1',
      navigationSequence: ['open', 'focus', 'Home', 'End'],
    },
    attempts,
    summary: { measuredPairCount: measuredPairs },
  };
}

function withInputDirectory(callback) {
  const root = mkdtempSync(join(tmpdir(), 'phase4-c5a-'));
  const inputDirectory = join(root, 'sources');
  mkdirSync(inputDirectory, { recursive: true });
  const writeReport = (report, folder = `${report.replication.workflowRunId}-${report.replication.replicationId}`) => {
    const directory = join(inputDirectory, folder);
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, REPORT_NAME), `${JSON.stringify(report)}\n`);
  };
  try {
    callback({ inputDirectory, writeReport });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function aggregate(inputDirectory, expectedCount, extra = {}) {
  return aggregateReplicationReports({
    inputDirectory,
    expectedCount,
    expectedCommit: COMMIT,
    bootstrapReplicates: 200,
    ...extra,
  });
}

test('excludes warm-ups, retains every measured raw pair, and labels a one-run study inconclusive', () => {
  withInputDirectory(({ inputDirectory, writeReport }) => {
    writeReport(makeReport());
    const result = aggregate(inputDirectory, 1);
    assert.equal(result.integrity.validForAnalysis, true);
    assert.equal(result.strata.length, 1);
    assert.equal(result.strata[0].independentRunCount, 1);
    assert.equal(result.strata[0].completeMeasuredPairCount, 5);
    assert.equal(result.strata[0].rawSamples[0].pairs.length, 5);
    assert.ok(result.strata[0].rawSamples[0].pairs.every((pair) => pair.pair > 0));
    assert.equal(result.strata[0].metrics.firstEligibleFrameLatencyMs.distribution.sampleCount, 5);
    assert.equal(result.strata[0].metrics.firstEligibleFrameLatencyMs.classification.classification, 'inconclusive');
    assert.match(result.strata[0].metrics.firstEligibleFrameLatencyMs.classification.reason, /No decision threshold/);
  });
});

test('keeps different CPU and hosted-image profiles in separate hardware strata', () => {
  withInputDirectory(({ inputDirectory, writeReport }) => {
    writeReport(makeReport({ replicationId: 1, cpuModel: 'CPU A' }));
    writeReport(makeReport({ replicationId: 2, cpuModel: 'CPU B', imageVersion: '20261019.1' }));
    const result = aggregate(inputDirectory, 2);
    assert.equal(result.integrity.validForAnalysis, true);
    assert.equal(result.strata.length, 2);
    assert.deepEqual(new Set(result.strata.map((stratum) => stratum.hardwareProfile.cpuModel)), new Set(['CPU A', 'CPU B']));
  });
});

test('reports missing artifacts and missing replication indices without inventing samples', () => {
  withInputDirectory(({ inputDirectory, writeReport }) => {
    writeReport(makeReport({ replicationId: 1, runId: 10_001 }));
    const result = aggregate(inputDirectory, 2, { expectedWorkflowRunId: '10001' });
    assert.equal(result.integrity.validForAnalysis, false);
    assert.deepEqual(result.integrity.missingReplicationIds, ['2']);
    assert.equal(result.integrity.discoveredSourceCount, 1);
    assert.equal(result.strata[0].completeMeasuredPairCount, 5);
  });
});

test('treats matrix jobs from one dispatch as one independent workflow cluster', () => {
  withInputDirectory(({ inputDirectory, writeReport }) => {
    for (let index = 1; index <= 5; index += 1) {
      writeReport(makeReport({ replicationId: index, runId: 22_222, latency: 50 }), `replication-${index}`);
    }
    const result = aggregate(inputDirectory, 5, { expectedWorkflowRunId: '22222' });
    const metric = result.strata[0].metrics.firstEligibleFrameLatencyMs;
    assert.equal(result.integrity.validForAnalysis, true);
    assert.equal(result.strata[0].sourceReplicationCount, 5);
    assert.equal(result.strata[0].independentWorkflowRunCount, 1);
    assert.equal(metric.independentRunCount, 1);
    assert.equal(metric.measuredPairCount, 25);
    assert.equal(metric.classification.classification, 'inconclusive');
  });
});

test('aggregates one source artifact from each explicitly selected workflow run', () => {
  withInputDirectory(({ inputDirectory, writeReport }) => {
    writeReport(makeReport({ replicationId: 1, runId: 31_001, latency: 48 }));
    writeReport(makeReport({ replicationId: 1, runId: 31_002, latency: 52 }));
    const result = aggregateReplicationReports({
      inputDirectory,
      expectedWorkflowRunIds: ['31001', '31002'],
      expectedCommit: COMMIT,
      bootstrapReplicates: 100,
    });
    assert.equal(result.integrity.validForAnalysis, true);
    assert.equal(result.integrity.discoveredSourceCount, 2);
    assert.equal(result.integrity.validSourceCount, 2);
    assert.deepEqual(result.integrity.errors, []);
    assert.ok(result.sources.every((source) => source.validationErrors.length === 0));
    assert.deepEqual(result.integrity.missingWorkflowRunIds, []);
    assert.equal(result.strata[0].independentWorkflowRunCount, 2);
    assert.equal(result.strata[0].completeMeasuredPairCount, 10);
  });
});

test('accepts target mounting during the End-key handler', () => {
  withInputDirectory(({ inputDirectory, writeReport }) => {
    const report = makeReport();
    const attempt = report.attempts[1];
    const times = attempt.timestamps.browserPerformanceNowMs;
    times.targetMountedAt = times.handlerReturnAt - 0.05;
    writeReport(report);

    const result = aggregate(inputDirectory, 1);
    assert.equal(result.integrity.validForAnalysis, true);
    assert.deepEqual(result.sources[0].validationErrors, []);
  });
});

test('rejects target mounting before the End-key event', () => {
  withInputDirectory(({ inputDirectory, writeReport }) => {
    const report = makeReport();
    const attempt = report.attempts[1];
    const times = attempt.timestamps.browserPerformanceNowMs;
    times.targetMountedAt = times.endEventAt - 0.01;
    writeReport(report);

    const result = aggregate(inputDirectory, 1);
    assert.equal(result.integrity.validForAnalysis, false);
    assert.ok(result.sources[0].validationErrors.some((error) => /target mounting precedes the End-key event/.test(error)));
  });
});

test('rejects first-frame eligibility before target mounting', () => {
  withInputDirectory(({ inputDirectory, writeReport }) => {
    const report = makeReport();
    const attempt = report.attempts[1];
    const times = attempt.timestamps.browserPerformanceNowMs;
    times.targetMountedAt = times.firstEligibleFrameAt + 0.01;
    writeReport(report);

    const result = aggregate(inputDirectory, 1);
    assert.equal(result.integrity.validForAnalysis, false);
    assert.ok(result.sources[0].validationErrors.some((error) => /first eligible frame precedes target mounting/.test(error)));
  });
});

test('rejects first-frame eligibility before handler return', () => {
  withInputDirectory(({ inputDirectory, writeReport }) => {
    const report = makeReport();
    const attempt = report.attempts[1];
    const times = attempt.timestamps.browserPerformanceNowMs;
    times.handlerReturnAt = times.firstEligibleFrameAt + 0.01;
    attempt.metrics.eventToHandlerReturnMs = times.handlerReturnAt - times.endEventAt;
    writeReport(report);

    const result = aggregate(inputDirectory, 1);
    assert.equal(result.integrity.validForAnalysis, false);
    assert.ok(result.sources[0].validationErrors.some((error) => /first eligible frame precedes handler return/.test(error)));
  });
});

test('keeps geometry stabilization and Playwright confirmation causally ordered', () => {
  withInputDirectory(({ inputDirectory, writeReport }) => {
    const report = makeReport();
    const attempt = report.attempts[1];
    const times = attempt.timestamps.browserPerformanceNowMs;
    times.stableGeometryObservedAt = times.firstEligibleFrameAt - 0.01;
    writeReport(report);

    const result = aggregate(inputDirectory, 1);
    assert.equal(result.integrity.validForAnalysis, false);
    assert.ok(result.sources[0].validationErrors.some((error) => /stable geometry precedes the first eligible frame/.test(error)));
  });

  withInputDirectory(({ inputDirectory, writeReport }) => {
    const report = makeReport();
    const attempt = report.attempts[1];
    const times = attempt.timestamps.browserPerformanceNowMs;
    times.playwrightConfirmedAt = times.stableGeometryObservedAt - 0.01;
    attempt.metrics.firstFrameToPlaywrightConfirmationMs = times.playwrightConfirmedAt - times.firstEligibleFrameAt;
    attempt.metrics.observedEndToVisibleMs = times.playwrightConfirmedAt - times.endEventAt;
    writeReport(report);

    const result = aggregate(inputDirectory, 1);
    assert.equal(result.integrity.validForAnalysis, false);
    assert.ok(result.sources[0].validationErrors.some((error) => /Playwright confirmation precedes stable geometry/.test(error)));
  });
});

test('rejects a cross-run selection when any requested workflow run has no artifact', () => {
  withInputDirectory(({ inputDirectory, writeReport }) => {
    writeReport(makeReport({ replicationId: 1, runId: 31_001 }));
    const result = aggregateReplicationReports({
      inputDirectory,
      expectedWorkflowRunIds: ['31001', '31002'],
      expectedCommit: COMMIT,
      bootstrapReplicates: 100,
    });
    assert.equal(result.integrity.validForAnalysis, false);
    assert.deepEqual(result.integrity.missingWorkflowRunIds, ['31002']);
  });
});

test('rejects cross-run aggregation when a selected workflow has more than one source artifact', () => {
  withInputDirectory(({ inputDirectory, writeReport }) => {
    writeReport(makeReport({ replicationId: 1, runId: 32_001 }), 'replication-1');
    writeReport(makeReport({ replicationId: 2, runId: 32_001 }), 'replication-2');
    const result = aggregateReplicationReports({
      inputDirectory,
      expectedWorkflowRunIds: ['32001'],
      expectedCommit: COMMIT,
      bootstrapReplicates: 100,
    });
    assert.equal(result.integrity.validForAnalysis, false);
    assert.equal(result.integrity.duplicatedExpectedWorkflowRunIds.length, 1);
    assert.ok(result.sources.every((source) => source.validationErrors.some((error) => /exactly one source artifact/.test(error))));
  });
});

test('rejects duplicate workflow replication artifacts rather than double-counting them', () => {
  withInputDirectory(({ inputDirectory, writeReport }) => {
    const report = makeReport({ replicationId: 1 });
    writeReport(report, 'copy-a');
    writeReport(structuredClone(report), 'copy-b');
    const result = aggregate(inputDirectory, 2);
    assert.equal(result.integrity.validForAnalysis, false);
    assert.equal(result.integrity.rejectedSourceCount, 2);
    assert.equal(result.strata.length, 0);
    assert.ok(result.sources.every((source) => source.validationErrors.some((error) => /duplicate/.test(error))));
  });
});

test('rejects non-finite or negative latency samples instead of silently filtering them', () => {
  withInputDirectory(({ inputDirectory, writeReport }) => {
    const report = makeReport();
    report.attempts.find((attempt) => !attempt.warmup && attempt.arm === 'minimal').metrics.firstEligibleFrameLatencyMs = -1;
    writeReport(report);
    const result = aggregate(inputDirectory, 1);
    assert.equal(result.integrity.validForAnalysis, false);
    assert.match(result.sources[0].validationErrors.join('\n'), /finite non-negative number/);
    assert.equal(result.strata.length, 0);
    assert.equal(result.sources[0].rawAttempts.length, 12);
  });
});

test('rejects a latency attempt with failed End-key correctness evidence', () => {
  withInputDirectory(({ inputDirectory, writeReport }) => {
    const report = makeReport();
    report.attempts.find((attempt) => !attempt.warmup && attempt.arm === 'minimal').correctness.endKeyEventCount = 2;
    writeReport(report);
    const result = aggregate(inputDirectory, 1);
    assert.equal(result.integrity.validForAnalysis, false);
    assert.match(result.sources[0].validationErrors.join('\n'), /exactly one End-key event/);
    assert.equal(result.strata.length, 0);
  });
});

test('excludes incomplete pairs and retains their raw failure record', () => {
  withInputDirectory(({ inputDirectory, writeReport }) => {
    const report = makeReport();
    report.completionStatus = 'failed';
    report.attempts.pop();
    writeReport(report);
    const result = aggregate(inputDirectory, 1);
    assert.equal(result.integrity.validForAnalysis, false);
    assert.equal(result.strata.length, 0);
    assert.equal(result.sources[0].rawAttempts.length, 11);
    assert.ok(result.sources[0].validationErrors.some((error) => /incomplete|expected .* arm attempts|not complete/.test(error)));
  });
});

test('classifies an explicit threshold only with the run and pair evidence plan', () => {
  withInputDirectory(({ inputDirectory, writeReport }) => {
    for (let index = 1; index <= 20; index += 1) writeReport(makeReport({ replicationId: index, latency: 50 }));
    const result = aggregate(inputDirectory, 20, { thresholdMs: 100 });
    const metric = result.strata[0].metrics.firstEligibleFrameLatencyMs;
    assert.equal(metric.classification.classification, 'supported');
    assert.equal(metric.independentRunCount, 20);
    assert.equal(metric.measuredPairCount, 100);
  });
});

test('classifies an explicit threshold as unsupported when the clustered interval is above it', () => {
  withInputDirectory(({ inputDirectory, writeReport }) => {
    for (let index = 1; index <= 20; index += 1) writeReport(makeReport({ replicationId: index, latency: 110 }));
    const result = aggregate(inputDirectory, 20, { thresholdMs: 100 });
    assert.equal(result.strata[0].metrics.firstEligibleFrameLatencyMs.classification.classification, 'unsupported');
  });
});

test('classifies an overlapping run-cluster confidence interval as inconclusive', () => {
  withInputDirectory(({ inputDirectory, writeReport }) => {
    for (let index = 1; index <= 20; index += 1) {
      writeReport(makeReport({ replicationId: index, latency: index <= 18 ? 90 : 110 }));
    }
    const result = aggregate(inputDirectory, 20, { thresholdMs: 100 });
    const metric = result.strata[0].metrics.firstEligibleFrameLatencyMs;
    assert.equal(metric.classification.classification, 'inconclusive');
    assert.equal(metric.runClusteredConfidenceInterval.lower, 90);
    assert.equal(metric.runClusteredConfidenceInterval.upper, 110);
  });
});
