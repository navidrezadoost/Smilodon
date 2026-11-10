import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, chmod, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { compareInventories, readVitestReport, REPORTER_IDENTITY_EXCEPTIONS, vitestInventory } from '../compare-h2g16-assertions.mjs';
import { validateAuditReport } from '../h2g16-audit-validation.mjs';

const fixture = (status = 'passed', title = 'selects item') => ({
  testResults: [{
    name: '/repo/tests/contracts/core.contract.spec.ts',
    assertionResults: [{ ancestorTitles: ['Core contract'], title, status }],
  }],
});

test('assertion inventory compares file, full identity, and status', () => {
  const base = vitestInventory(fixture(), 'base', '/repo');
  assert.deepEqual(compareInventories(base, vitestInventory(fixture(), 'candidate', '/repo')), []);
  assert.equal(compareInventories(base, vitestInventory(fixture('skipped'), 'candidate', '/repo')).length, 1);
  assert.equal(compareInventories(base, vitestInventory(fixture('passed', 'selects chosen item'), 'candidate', '/repo')).length, 2);
});

test('reporter exception maps exactly one identity and does not normalize siblings', () => {
  const base = vitestInventory(fixture('passed', 'selects item with value "alpha"'), 'base', '/repo');
  const candidate = vitestInventory(fixture('passed', 'selects item with value alpha'), 'candidate', '/repo');
  const exception = [{
    baseline: 'tests/contracts/core.contract.spec.ts :: Core contract :: selects item with value "alpha"',
    candidate: 'tests/contracts/core.contract.spec.ts :: Core contract :: selects item with value alpha',
  }];
  assert.deepEqual(compareInventories(base, candidate, exception), []);
  const extra = new Map(candidate);
  extra.set('tests/contracts/core.contract.spec.ts :: Core contract :: unrelated renamed assertion', 'passed');
  assert.equal(compareInventories(base, extra, exception).length, 1);
  assert.equal(REPORTER_IDENTITY_EXCEPTIONS.length, 1);
  const measuredBase = new Map([[REPORTER_IDENTITY_EXCEPTIONS[0].baseline, 'passed']]);
  const measuredCandidate = new Map([[REPORTER_IDENTITY_EXCEPTIONS[0].candidate, 'passed']]);
  assert.deepEqual(compareInventories(measuredBase, measuredCandidate), []);
  measuredCandidate.set(`${REPORTER_IDENTITY_EXCEPTIONS[0].candidate} renamed`, 'passed');
  assert.equal(compareInventories(measuredBase, measuredCandidate).length, 1);
});

test('malformed assertion reports and failed outcomes are rejected', () => {
  assert.throws(() => vitestInventory({ testResults: [] }, 'bad'), /missing or empty/);
  const failed = vitestInventory(fixture('failed'), 'failed', '/repo');
  assert.ok(compareInventories(failed, failed).some((entry) => entry.reason === 'failed assertion present'));
});

test('missing assertion report fails closed', async () => {
  await assert.rejects(readVitestReport('/definitely/missing-h2g17-report.json', 'missing report'), /cannot parse/);
});

function audit({ critical = 0, high = 0, moderate = 0, low = 0, info = 0 } = {}) {
  const total = critical + high + moderate + low + info;
  return {
    auditReportVersion: 2,
    vulnerabilities: total ? { example: { name: 'example' } } : {},
    metadata: { vulnerabilities: { critical, high, moderate, low, info, total }, dependencies: { total: 1 } },
  };
}

test('audit parser distinguishes clean graph from valid findings', () => {
  assert.deepEqual(validateAuditReport(audit(), 'clean').counts.total, 0);
  const high = validateAuditReport(audit({ high: 1 }), 'high');
  assert.equal(high.valid, true);
  assert.equal(high.counts.high, 1);
});

test('audit parser fails closed for absent, malformed, and inconsistent results', () => {
  assert.equal(validateAuditReport({}, 'missing').valid, false);
  assert.equal(validateAuditReport({ error: { code: 'ENOTFOUND' } }, 'command-error').valid, false);
  assert.equal(validateAuditReport({ metadata: { vulnerabilities: { critical: 0, high: 0, moderate: 0, low: 0, info: 0, total: 1 } }, vulnerabilities: {} }, 'bad-total').valid, false);
});

test('audit CLI preserves malformed command output and exits nonzero', async () => {
  const temp = await mkdtemp(path.join(tmpdir(), 'h2g17-audit-failure-'));
  try {
    const fakeNpm = path.join(temp, 'npm-fails');
    await writeFile(fakeNpm, '#!/bin/sh\nprintf "not json\\n"\nprintf "network unavailable\\n" >&2\nexit 127\n');
    await chmod(fakeNpm, 0o755);
    const output = path.join(temp, 'raw');
    const result = spawnSync(process.execPath, ['scripts/summarize-h2g16-security-audit.mjs', '--capture', output], {
      cwd: process.cwd(), env: { ...process.env, H2G16_NPM_BIN: fakeNpm }, encoding: 'utf8',
    });
    assert.notEqual(result.status, 0);
    const status = JSON.parse(await readFile(path.join(output, 'security-status.json'), 'utf8'));
    assert.equal(status.auditReportsValid, false);
    assert.match(await readFile(path.join(output, 'full-audit.stdout.json'), 'utf8'), /not json/);
    assert.match(await readFile(path.join(output, 'full-audit.stderr.txt'), 'utf8'), /network unavailable/);
  } finally { await rm(temp, { recursive: true, force: true }); }
});

test('audit gate treats a simulated High as blocked and missing evidence as failed', async () => {
  const temp = await mkdtemp(path.join(tmpdir(), 'h2g17-audit-gate-'));
  try {
    const fullPath = path.join(temp, 'full.json');
    const productionPath = path.join(temp, 'production.json');
    const highPath = path.join(temp, 'high-status.json');
    await writeFile(fullPath, JSON.stringify(audit({ high: 1 })));
    await writeFile(productionPath, JSON.stringify(audit()));
    const summarize = spawnSync(process.execPath, ['scripts/summarize-h2g16-security-audit.mjs', fullPath, productionPath, highPath, '1', '0'], { cwd: process.cwd() });
    assert.equal(summarize.status, 0);
    const blocked = spawnSync(process.execPath, ['scripts/summarize-h2g16-security-audit.mjs', '--gate', highPath], { cwd: process.cwd() });
    assert.equal(blocked.status, 1);
    await writeFile(fullPath, '{corrupted');
    const corrupted = spawnSync(process.execPath, ['scripts/summarize-h2g16-security-audit.mjs', '--gate', highPath], { cwd: process.cwd() });
    assert.equal(corrupted.status, 2);
    const missing = spawnSync(process.execPath, ['scripts/summarize-h2g16-security-audit.mjs', '--gate', path.join(temp, 'missing.json')], { cwd: process.cwd() });
    assert.notEqual(missing.status, 0);
    const malformedPath = path.join(temp, 'malformed-status.json');
    await writeFile(malformedPath, JSON.stringify({ auditReportsValid: true, auditExitCodesConsistent: true, full: {}, production: {}, auditReportPaths: {}, auditExitCodes: {} }));
    const malformed = spawnSync(process.execPath, ['scripts/summarize-h2g16-security-audit.mjs', '--gate', malformedPath], { cwd: process.cwd() });
    assert.equal(malformed.status, 2);
  } finally { await rm(temp, { recursive: true, force: true }); }
});

test('packed consumer runner records missing fixture failure and exits nonzero', async () => {
  const temp = await mkdtemp(path.join(tmpdir(), 'h2g17-node18-missing-'));
  try {
    const tarballs = path.join(temp, 'tarballs');
    await mkdir(tarballs);
    await writeFile(path.join(tarballs, 'smilodon-core.tgz'), 'synthetic packed input');
    const fixture = path.join(temp, 'missing-fixture');
    const output = path.join(temp, 'result.json');
    const result = spawnSync(process.execPath, ['scripts/run-core-node18-consumer-check.mjs', tarballs, fixture, output, 'package-lock.json'], {
      cwd: process.cwd(), encoding: 'utf8', timeout: 30_000,
    });
    assert.notEqual(result.status, 0);
    const evidence = JSON.parse(await readFile(output, 'utf8'));
    assert.equal(evidence.status, 'failed');
    assert.ok(evidence.commands.some((entry) => entry.name === 'fixture-install' && entry.exitCode !== 0));
    assert.ok(evidence.commands.some((entry) => entry.name === 'bundler-consumer' && entry.skippedBecause));
  } finally { await rm(temp, { recursive: true, force: true }); }
});
