const EXPECTED_SCROLL_SAMPLES = new Map([
  [1_000, 20],
  [10_000, 50],
  [100_000, 100],
]);

const VALID_STATUSES = new Set(['complete', 'incomplete', 'failed']);
const VALID_MODES = new Set(['legacy-full', 'virtual-window']);

function finiteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}
function quantile(values, percentile) {
  const sorted = values.filter(finiteNumber).sort((left, right) => left - right);
  if (sorted.length === 0) return null;
  return sorted[Math.max(0, Math.ceil(percentile * sorted.length) - 1)];
}

function summarize(values) {
  const finite = values.filter(finiteNumber);
  return {
    sampleCount: finite.length,
    p50: quantile(finite, 0.50),
    p95: quantile(finite, 0.95),
    p99: quantile(finite, 0.99),
  };
}

export function expectedFilterMatchCount(datasetSize, query = 'Option 999') {
  if (!Number.isSafeInteger(datasetSize) || datasetSize < 0) {
    throw new TypeError('datasetSize must be a non-negative safe integer');
  }
  const normalizedQuery = query.toLocaleLowerCase('en-US');
  let matches = 0;
  for (let index = 0; index < datasetSize; index += 1) {
    if (`Option ${index}`.toLocaleLowerCase('en-US').includes(normalizedQuery)) matches += 1;
  }
  return matches;
}

function inferKind(result) {
  if (result.kind) return result.kind;
  if (Number.isSafeInteger(result.warmupIndex) || Number.isSafeInteger(result.warmup)) return 'warmup';
  return 'measurement';
}

export function classifyBenchmarkResult(result) {
  if (result.classification) return result.classification;
  if (result.status === 'incomplete'
    && result.datasetSize === 100_000
    && result.mode === 'legacy-full') {
    return 'legacy-scalability-censored';
  }
  if (result.status === 'failed' && result.mode === 'virtual-window') {
    return 'virtual-correctness-or-runtime-failure';
  }
  if (result.status === 'incomplete' && result.mode === 'virtual-window') {
    return 'virtual-workload-incomplete';
  }
  return result.status;
}

function validateCase(result, index) {
  const issues = [];
  const add = (code, message) => issues.push({ caseIndex: index, code, message });

  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    return [{ caseIndex: index, code: 'invalid-case', message: 'Case must be an object.' }];
  }
  if (!VALID_STATUSES.has(result.status)) add('invalid-status', `Unsupported status: ${result.status}`);
  if (!Number.isSafeInteger(result.datasetSize) || !EXPECTED_SCROLL_SAMPLES.has(result.datasetSize)) {
    add('invalid-dataset-size', `Unsupported dataset size: ${result.datasetSize}`);
  }
  if (!VALID_MODES.has(result.mode)) add('invalid-mode', `Unsupported mode: ${result.mode}`);

  if (result.status === 'complete') {
    const hiddenRender = result.registrationToHiddenRenderSettleMs
      ?? result.registrationToInitialRenderMs;
    const requiredMeasurements = [
      ['registration-hidden-render', hiddenRender],
      ['first-visible-after-open', result.firstVisibleAfterOpenMs],
      ['open-render-settlement', result.openToRenderSettledMs],
      ['registration-to-interactive', result.registrationToInteractiveMs],
      ['keyboard-visible-target', result.keyboardEndToVisibleTargetMs],
    ];
    for (const [name, value] of requiredMeasurements) {
      if (!finiteNumber(value) || value < 0) add(`missing-${name}`, `Missing or invalid ${name} measurement.`);
    }

    const expectedScrollSamples = EXPECTED_SCROLL_SAMPLES.get(result.datasetSize);
    const scrollSamples = result.scrollLatency?.samplesMs;
    if (!Array.isArray(scrollSamples)) {
      add('missing-scroll-samples', 'Random-access scroll samples are missing.');
    } else {
      if (scrollSamples.length !== expectedScrollSamples) {
        add('wrong-scroll-sample-count', `Expected ${expectedScrollSamples} scroll samples, found ${scrollSamples.length}.`);
      }
      if (scrollSamples.some((sample) => !finiteNumber(sample) || sample < 0)) {
        add('invalid-scroll-sample', 'Scroll samples must all be finite non-negative numbers.');
      }
    }
    if (!Array.isArray(result.scrollLatency?.failedTargets)) {
      add('missing-scroll-correctness', 'Random-access correctness results are missing.');
    } else if (result.scrollLatency.failedTargets.length > 0) {
      add('failed-scroll-targets', `Unresolved scroll targets: ${result.scrollLatency.failedTargets.join(', ')}.`);
    }

    if (result.activeIndexAfterEnd !== result.datasetSize - 1
      || result.activeTargetIndexAfterEnd !== result.datasetSize - 1) {
      add('failed-end-navigation', 'End-key did not materialize the final active option.');
    }

    const maxMounted = result.dom?.maxObservedMountedOptionCount;
    if (!Number.isSafeInteger(maxMounted) || maxMounted < 1) {
      add('missing-mounted-option-count', 'Maximum mounted option count is missing or invalid.');
    } else if (result.mode === 'virtual-window' && maxMounted > 64) {
      add('virtual-dom-bound-exceeded', `Virtual mode mounted ${maxMounted} options; maximum is 64.`);
    }

    const retainedHeap = result.memory?.retainedHeapDeltaBytes;
    if (!finiteNumber(retainedHeap)) add('missing-heap-sample', 'Retained JavaScript heap delta is missing.');

    if (result.datasetSize >= 10_000) {
      const expectedCount = expectedFilterMatchCount(result.datasetSize);
      if (result.filter?.query !== 'Option 999' || result.filter?.resultCount !== expectedCount) {
        add('filter-correctness-failure', `Expected Option 999 to match ${expectedCount} records in ${result.datasetSize} options.`);
      }
      if (!Number.isSafeInteger(result.filter?.mountedResultCount) || result.filter.mountedResultCount < 1) {
        add('missing-filter-render', 'Filter mounted-result count is missing or invalid.');
      }
      if (result.mode === 'virtual-window' && result.filter?.mountedResultCount > 64) {
        add('virtual-filter-dom-bound-exceeded', 'Virtual filtered result exceeded the 64-option DOM bound.');
      }
    }

    if (result.datasetSize === 10_000) {
      const sustained = result.sustainedScroll;
      if (!Array.isArray(sustained?.samplesMs) || sustained.samplesMs.length !== 100) {
        add('wrong-sustained-scroll-sample-count', 'The 10k sustained workload must contain exactly 100 update samples.');
      } else if (sustained.samplesMs.some((sample) => !finiteNumber(sample) || sample < 0)) {
        add('invalid-sustained-scroll-sample', 'Sustained scroll samples must all be finite non-negative numbers.');
      }
      if (!Array.isArray(sustained?.failedTargets) || sustained.failedTargets.length > 0) {
        add('sustained-scroll-correctness-failure', 'Sustained scroll targets are missing or unresolved.');
      }
    }
  } else {
    if (typeof result.failureStage !== 'string' || result.failureStage.length === 0) {
      add('missing-failure-stage', 'Incomplete and failed cases must record failureStage.');
    }
    if (!finiteNumber(result.elapsedMs) || result.elapsedMs < 0) {
      add('missing-elapsed-time', 'Incomplete and failed cases must record a finite non-negative elapsedMs.');
    }
    if (typeof result.error !== 'string' || result.error.length === 0) {
      add('missing-failure-error', 'Incomplete and failed cases must include an error description.');
    }
    const isKnownLegacyCensor = result.status === 'incomplete'
      && result.datasetSize === 100_000
      && result.mode === 'legacy-full';
    if (result.status === 'failed') {
      add('failed-case', `Attempt failed during ${result.failureStage ?? 'an unknown stage'}.`);
    } else if (!isKnownLegacyCensor) {
      add('unexpected-incomplete-case', `Attempt was incomplete during ${result.failureStage ?? 'an unknown stage'}.`);
    } else if (!finiteNumber(result.timeoutMs) || result.timeoutMs <= 0) {
      add('missing-censor-timeout', 'A censored 100k legacy attempt must record its positive timeout bound.');
    }
  }
  return issues;
}

function measurementKind(result) {
  return inferKind(result) === 'measurement';
}

export function summarizeBenchmarkReport(input, { source = null, generatedAt = new Date().toISOString() } = {}) {
  if (!input || typeof input !== 'object' || !Array.isArray(input.cases)) {
    throw new TypeError('Benchmark report must contain a cases array.');
  }

  const validationIssues = input.cases.flatMap((result, index) => validateCase(result, index));
  const caseIssues = new Map();
  for (const issue of validationIssues) {
    const issues = caseIssues.get(issue.caseIndex) ?? [];
    issues.push(issue);
    caseIssues.set(issue.caseIndex, issues);
  }

  const groups = new Map();
  input.cases.forEach((result, index) => {
    const key = `${result.datasetSize}:${result.mode}`;
    const group = groups.get(key) ?? [];
    group.push({ result, index });
    groups.set(key, group);
  });

  const summarizedCases = Array.from(groups.entries(), ([key, attempts]) => {
    const [datasetSize, mode] = key.split(':');
    const measurements = attempts.filter(({ result }) => measurementKind(result));
    const warmups = attempts.filter(({ result }) => inferKind(result) === 'warmup');
    const completeMeasurements = measurements.filter(({ result, index }) =>
      result.status === 'complete' && !(caseIssues.get(index)?.length));
    const incompleteOrFailed = attempts
      .filter(({ result, index }) => result.status !== 'complete' || caseIssues.get(index)?.length)
      .map(({ result, index }) => ({
        kind: inferKind(result),
        repetition: result.repetition ?? null,
        status: result.status,
        classification: classifyBenchmarkResult(result),
        failureStage: result.failureStage ?? null,
        elapsedMs: result.elapsedMs ?? null,
        timeoutMs: result.timeoutMs ?? null,
        error: result.error ?? null,
        validationIssues: caseIssues.get(index) ?? [],
        artifacts: result.artifacts ?? null,
        diagnostics: result.diagnostics ?? null,
      }));
    const completeResults = completeMeasurements.map(({ result }) => result);
    const pooledScrollSamples = completeResults.flatMap((result) => result.scrollLatency.samplesMs);
    const sustainedResults = completeResults.filter((result) => result.sustainedScroll);
    const warningDiagnostics = attempts.reduce((total, { result }) => {
      const warningCounts = result.diagnostics?.resizeObserverWarnings ?? {};
      return {
        pageConsole: total.pageConsole + (warningCounts.pageConsole ?? 0),
        cdpLog: total.cdpLog + (warningCounts.cdpLog ?? 0),
      };
    }, { pageConsole: 0, cdpLog: 0 });

    return {
      datasetSize: Number(datasetSize),
      mode,
      plannedRepetitions: input.protocol?.measuredRepetitionsPerModeAndSize ?? null,
      attemptedRepetitions: measurements.length,
      completedRepetitions: measurements.filter(({ result }) => result.status === 'complete').length,
      validRepetitions: completeMeasurements.length,
      skippedRepetitions: Number.isSafeInteger(input.protocol?.measuredRepetitionsPerModeAndSize)
        ? Math.max(0, input.protocol.measuredRepetitionsPerModeAndSize - measurements.length)
        : null,
      warmups: {
        planned: input.protocol?.warmupsPerModeAndSize ?? null,
        attempted: warmups.length,
        completed: warmups.filter(({ result }) => result.status === 'complete').length,
        incompleteOrFailed: warmups.filter(({ result }) => result.status !== 'complete').length,
      },
      feasibilityProbes: attempts
        .filter(({ result }) => inferKind(result) === 'feasibility-probe')
        .map(({ result }) => ({
          status: result.status,
          classification: classifyBenchmarkResult(result),
          elapsedMs: result.elapsedMs ?? null,
          failureStage: result.failureStage ?? null,
          artifacts: result.artifacts ?? null,
        })),
      incompleteOrFailed,
      registrationToHiddenRenderSettleAcrossTrialsMs: summarize(
        completeResults.map((result) => result.registrationToHiddenRenderSettleMs
          ?? result.registrationToInitialRenderMs),
      ),
      registrationToInteractiveAcrossTrialsMs: summarize(completeResults.map((result) => result.registrationToInteractiveMs)),
      firstVisibleAfterOpenAcrossTrialsMs: summarize(completeResults.map((result) => result.firstVisibleAfterOpenMs)),
      openToRenderSettledAcrossTrialsMs: summarize(completeResults.map((result) => result.openToRenderSettledMs)),
      keyboardEndToVisibleTargetAcrossTrialsMs: summarize(completeResults.map((result) => result.keyboardEndToVisibleTargetMs)),
      filterToRenderedResultsAcrossTrialsMs: summarize(completeResults.map((result) => result.filter?.eventToRenderedResultsMs)),
      scrollSeekLatencyPooledEventsMs: summarize(pooledScrollSamples),
      scrollSeekPerTrialP95Ms: summarize(completeResults.map((result) => result.scrollLatency.p95Ms)),
      sustainedScrollPooledEventsMs: summarize(sustainedResults.flatMap((result) => result.sustainedScroll.samplesMs)),
      sustainedScrollPerTrialP95Ms: summarize(sustainedResults.map((result) => result.sustainedScroll.p95Ms)),
      frameP95AcrossTrialsMs: summarize(completeResults.map((result) => result.frameObservations?.p95Ms)),
      sustainedFrameP95AcrossTrialsMs: summarize(sustainedResults.map((result) => result.sustainedScroll.frameObservations?.p95Ms)),
      randomScrollFrameIntervalsOver33ms: completeResults.reduce((total, result) => total + (result.frameObservations?.over33ms ?? 0), 0),
      randomScrollFrameIntervalsOver50ms: completeResults.reduce((total, result) => total + (result.frameObservations?.over50ms ?? 0), 0),
      sustainedScrollFrameIntervalsOver33ms: sustainedResults.reduce((total, result) => total + (result.sustainedScroll.frameObservations?.over33ms ?? 0), 0),
      sustainedScrollFrameIntervalsOver50ms: sustainedResults.reduce((total, result) => total + (result.sustainedScroll.frameObservations?.over50ms ?? 0), 0),
      maxMountedOptions: completeResults.length
        ? Math.max(...completeResults.map((result) => result.dom.maxObservedMountedOptionCount))
        : null,
      maxObservedDeepDocumentNodes: completeResults.length
        ? Math.max(...completeResults.map((result) => result.dom.maxObservedDeepDocumentNodeCount))
        : null,
      retainedHeapDeltaBytesAcrossTrials: summarize(completeResults.map((result) => result.memory.retainedHeapDeltaBytes)),
      resizeObserverWarnings: warningDiagnostics,
      validationIssueCount: validationIssues.filter((issue) => attempts.some(({ index }) => index === issue.caseIndex)).length,
    };
  }).sort((left, right) => left.datasetSize - right.datasetSize || left.mode.localeCompare(right.mode));

  return {
    schemaVersion: 2,
    generatedAt,
    source,
    commit: input.commit ?? null,
    completionStatus: input.completionStatus ?? 'unknown',
    failure: input.failure ?? null,
    browser: input.browser ?? null,
    runner: input.runner ?? null,
    viewport: input.viewport ?? null,
    protocol: input.protocol ?? null,
    skippedWorkloads: input.skippedWorkloads ?? [],
    validation: {
      passed: validationIssues.length === 0,
      issueCount: validationIssues.length,
      issues: validationIssues,
    },
    censoredCaseCount: input.cases.filter((result) => classifyBenchmarkResult(result) === 'legacy-scalability-censored').length,
    cases: summarizedCases,
  };
}
