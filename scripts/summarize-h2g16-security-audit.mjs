import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { validAuditCounts, validateAuditReport } from './h2g16-audit-validation.mjs';
import { provenance } from './h2g16-provenance.mjs';

async function capture(outputDirectory) {
  await mkdir(outputDirectory, { recursive: true });
  const items = [];
  for (const [name, args] of [['full', ['audit', '--json']], ['production', ['audit', '--omit=dev', '--json']]]) {
    const result = spawnSync(process.env.H2G16_NPM_BIN ?? 'npm', args, { cwd: process.cwd(), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 5 * 60 * 1000 });
    const stdoutPath = path.join(outputDirectory, `${name}-audit.stdout.json`);
    const stderrPath = path.join(outputDirectory, `${name}-audit.stderr.txt`);
    await writeFile(stdoutPath, result.stdout ?? '');
    await writeFile(stderrPath, result.stderr ?? result.error?.stack ?? result.error?.message ?? '');
    let report;
    let validation;
    try { report = JSON.parse(result.stdout ?? ''); validation = validateAuditReport(report, name); }
    catch (error) { validation = { valid: false, error: `${name}: stdout is missing or malformed JSON: ${error.message}` }; }
    items.push({ name, invocation: [process.env.H2G16_NPM_BIN ?? 'npm', ...args], exitCode: result.status, signal: result.signal ?? null, spawnError: result.error?.message ?? null, stdoutPath: path.basename(stdoutPath), stderrPath: path.basename(stderrPath), ...validation });
  }
  const full = items.find((item) => item.name === 'full');
  const production = items.find((item) => item.name === 'production');
  const exitConsistent = (entry) => entry.valid && ((entry.exitCode === 0 && entry.counts.total === 0) || (entry.exitCode === 1 && entry.counts.total > 0));
  const status = {
    ...await provenance(process.cwd(), { invocation: ['node', 'scripts/summarize-h2g16-security-audit.mjs', '--capture', outputDirectory] }),
    auditReportsValid: items.every((item) => item.valid),
    auditExitCodesConsistent: items.every(exitConsistent),
    full: full?.counts ?? null,
    production: production?.counts ?? null,
    auditReportPaths: { full: full?.stdoutPath ?? null, production: production?.stdoutPath ?? null },
    auditExitCodes: { full: full?.exitCode ?? null, production: production?.exitCode ?? null },
    commands: items,
    disposition: items.every(exitConsistent) ? 'BLOCKED_OR_CLEAN' : 'FAILED_EVIDENCE',
    policy: 'zero critical, zero high, zero production findings',
  };
  await writeFile(path.join(outputDirectory, 'security-status.json'), `${JSON.stringify(status, null, 2)}\n`);
  console.log(JSON.stringify(status, null, 2));
  return status;
}

async function readJson(filename) {
  try { return JSON.parse(await readFile(filename, 'utf8')); }
  catch (error) { throw new Error(`Cannot read valid JSON at ${filename}: ${error.message}`); }
}

function sameCounts(left, right) {
  return validAuditCounts(left) && validAuditCounts(right)
    && ['critical', 'high', 'moderate', 'low', 'info', 'total'].every((key) => left[key] === right[key]);
}

async function gate(statusPath) {
  const status = await readJson(statusPath);
  const evidenceErrors = [];
  if (!status.auditReportsValid || !status.auditExitCodesConsistent
    || !validAuditCounts(status.full) || !validAuditCounts(status.production)
    || !status.auditReportPaths || !status.auditExitCodes) {
    evidenceErrors.push('summary is missing valid counts, raw-report paths, or exit-code status');
  } else {
    for (const name of ['full', 'production']) {
      try {
        const rawPath = status.auditReportPaths[name];
        if (typeof rawPath !== 'string' || !rawPath) throw new Error('raw report path is missing');
        const resolved = path.isAbsolute(rawPath) ? rawPath : path.resolve(path.dirname(statusPath), rawPath);
        const parsed = validateAuditReport(await readJson(resolved), name);
        if (!parsed.valid) throw new Error(parsed.error);
        if (!sameCounts(parsed.counts, status[name])) throw new Error('summary counts do not match raw report');
        const exitCode = status.auditExitCodes[name];
        if (!((exitCode === 0 && parsed.counts.total === 0) || (exitCode === 1 && parsed.counts.total > 0))) {
          throw new Error(`audit exit code ${exitCode} is inconsistent with raw report`);
        }
      } catch (error) { evidenceErrors.push(`${name}: ${error.message}`); }
    }
  }
  if (evidenceErrors.length) {
    console.error(JSON.stringify({ gate: 'FAILED_EVIDENCE', evidenceErrors, ...status }, null, 2));
    process.exitCode = 2;
  } else if (status.full.critical > 0 || status.full.high > 0 || status.production.total > 0) {
    console.error(JSON.stringify({ gate: 'BLOCKED', ...status }, null, 2));
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify({ gate: 'PASS', ...status }, null, 2));
  }
}

const args = process.argv.slice(2);
if (args[0] === '--capture') {
  const status = await capture(args[1] ?? 'test-results/h2g16/security');
  if (!status.auditReportsValid || !status.auditExitCodesConsistent) process.exitCode = 2;
} else if (args[0] === '--gate') {
  await gate(args[1]);
} else {
  const [fullPath, productionPath, outputPath, fullExitArg, productionExitArg] = args;
  if (!fullPath || !productionPath || !outputPath || fullExitArg === undefined || productionExitArg === undefined) {
    throw new Error('Usage: summarize-h2g16-security-audit.mjs <full.json> <production.json> <output.json> <full-exit> <production-exit>');
  }
  const fullReport = await readJson(fullPath);
  const productionReport = await readJson(productionPath);
  const full = validateAuditReport(fullReport, 'full');
  const production = validateAuditReport(productionReport, 'production');
  const fullExit = Number(fullExitArg);
  const productionExit = Number(productionExitArg);
  const exitMatches = (exitCode, entry) => entry.valid && Number.isInteger(exitCode)
    && ((exitCode === 0 && entry.counts.total === 0) || (exitCode === 1 && entry.counts.total > 0));
  const status = {
    ...await provenance(process.cwd(), { invocation: ['node', ...process.argv.slice(1)] }),
    auditReportsValid: full.valid && production.valid,
    auditExitCodesConsistent: exitMatches(fullExit, full) && exitMatches(productionExit, production),
    full: full.valid ? full.counts : null,
    production: production.valid ? production.counts : null,
    auditReportPaths: { full: path.resolve(fullPath), production: path.resolve(productionPath) },
    errors: [full.error, production.error].filter(Boolean),
    auditExitCodes: { full: fullExit, production: productionExit },
    disposition: full.valid && production.valid ? 'BLOCKED_OR_CLEAN' : 'FAILED_EVIDENCE',
    policy: 'zero critical, zero high, zero production findings',
  };
  await writeFile(outputPath, `${JSON.stringify(status, null, 2)}\n`);
  console.log(JSON.stringify(status, null, 2));
  if (!status.auditReportsValid || !status.auditExitCodesConsistent) process.exitCode = 2;
}
