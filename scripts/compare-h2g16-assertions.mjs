import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Measured against c1e95d6 (Vitest 1) and this Vitest 4 candidate: test.each
// prints `%s` in the old reporter and `undefined` in the new one for this row.
// Status is still matched exactly, and no other parameterized identity is mapped.
export const REPORTER_IDENTITY_EXCEPTIONS = [{
  baseline: 'data-loading :: packages/core/tests/data-loading/public-config.spec.ts :: public data-loading configuration validation :: rejects non-object candidates (%s)',
  candidate: 'data-loading :: packages/core/tests/data-loading/public-config.spec.ts :: public data-loading configuration validation :: rejects non-object candidates (undefined)',
  reporterOnly: true,
}];

function normalizeStatus(status) {
  if (['passed', 'success'].includes(status)) return 'passed';
  if (['pending', 'skipped', 'todo'].includes(status)) return 'skipped';
  if (status === 'failed') return 'failed';
  throw new Error(`Unsupported assertion status: ${String(status)}`);
}

export function vitestInventory(report, label, root = process.cwd()) {
  if (!report || !Array.isArray(report.testResults) || report.testResults.length === 0) {
    throw new Error(`${label}: missing or empty testResults`);
  }
  const result = new Map();
  for (const file of report.testResults) {
    const filepath = file.name ?? file.filepath;
    if (typeof filepath !== 'string' || !filepath) throw new Error(`${label}: test result has no file path`);
    if (!Array.isArray(file.assertionResults)) throw new Error(`${label}: ${filepath} has no assertionResults array`);
    for (const assertion of file.assertionResults) {
      const ancestors = [...(assertion.ancestorTitles ?? [])];
      // Vitest 1 emits one empty root ancestor; Vitest 4 omits that field.
      // Drop only that one measured legacy reporter sentinel, and only in baseline data.
      if (label.startsWith('baseline/') && ancestors[0] === '') ancestors.shift();
      const title = assertion.title ?? assertion.fullName;
      if (!Array.isArray(ancestors) || ancestors.some((x) => typeof x !== 'string') || typeof title !== 'string' || !title) {
        throw new Error(`${label}: malformed assertion identity in ${filepath}`);
      }
      const relativeFile = path.relative(root, filepath).split(path.sep).join('/');
      if (!relativeFile || relativeFile.startsWith('../')) throw new Error(`${label}: reporter path is outside its source tree: ${filepath}`);
      const identity = `${relativeFile} :: ${[...ancestors, title].join(' :: ')}`;
      if (result.has(identity)) throw new Error(`${label}: duplicate assertion identity ${identity}`);
      result.set(identity, normalizeStatus(assertion.status));
    }
  }
  if (result.size === 0) throw new Error(`${label}: no assertions found`);
  return result;
}

export function tapInventory(text, label) {
  const lines = text.split(/\r?\n/).filter((line) => /^(ok|not ok) \d+ - /.test(line));
  if (lines.length === 0) throw new Error(`${label}: TAP report contains no test results`);
  const result = new Map();
  for (const line of lines) {
    const identity = line.replace(/^(?:ok|not ok) \d+ - /, '').replace(/ # SKIP.*$/, '');
    if (result.has(identity)) throw new Error(`${label}: duplicate TAP identity ${identity}`);
    result.set(identity, line.startsWith('not ok ') ? 'failed' : line.includes('# SKIP') ? 'skipped' : 'passed');
  }
  return result;
}

export function compareInventories(baseline, candidate, exceptions = REPORTER_IDENTITY_EXCEPTIONS) {
  const differences = [];
  const exceptionByBase = new Map(exceptions.map((entry) => [entry.baseline, entry]));
  const consumed = new Set();
  for (const [identity, status] of baseline) {
    const exception = exceptionByBase.get(identity);
    const candidateIdentity = exception?.candidate ?? identity;
    const candidateStatus = candidate.get(candidateIdentity);
    if (candidateStatus === undefined) {
      differences.push({ identity, baseline: status, candidate: 'missing' });
      continue;
    }
    consumed.add(candidateIdentity);
    if (status !== candidateStatus) differences.push({ identity, candidateIdentity, baseline: status, candidate: candidateStatus });
  }
  for (const [identity, status] of candidate) {
    if (!consumed.has(identity) && !baseline.has(identity)) differences.push({ identity, baseline: 'missing', candidate: status });
  }
  for (const [identity, status] of [...baseline, ...candidate]) {
    if (status === 'failed') differences.push({ identity, baseline: baseline.get(identity) ?? 'missing', candidate: candidate.get(identity) ?? 'missing', reason: 'failed assertion present' });
  }
  return differences;
}

export async function readVitestReport(filename, label, root = process.cwd()) {
  let parsed;
  try { parsed = JSON.parse(await readFile(filename, 'utf8')); }
  catch (error) { throw new Error(`${label}: cannot parse ${filename}: ${error.message}`); }
  return vitestInventory(parsed, label, root);
}
