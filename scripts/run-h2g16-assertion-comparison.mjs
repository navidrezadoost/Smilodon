import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { CERTIFIED_BASE_COMMIT, provenance } from './h2g16-provenance.mjs';
import { compareInventories, readVitestReport, tapInventory, REPORTER_IDENTITY_EXCEPTIONS } from './compare-h2g16-assertions.mjs';

const root = process.cwd();
const outputRoot = path.resolve(process.argv[2] ?? 'test-results/h2g16/assertions');
const baselineRoot = path.join(path.dirname(outputRoot), 'baseline-worktree');
const reports = [
  ['core-unit', 'packages/core/vitest.config.ts'],
  ['data-loading', 'packages/core/vitest.data-loading.config.ts'],
  ['contracts', 'tests/contracts/vitest.config.ts'],
];
const approvedCandidateChanges = [
  ...[
    'rendersWithGroupedItems',
    'rendersInDisabledState',
    'setsInitialValue',
    'updatesValueProgrammatically',
    'displaysSelectedItem',
    'emitsOpenEvent',
    'emitsCloseEvent',
    'closesViaImperativeAPI',
    'clearsViaImperativeAPI',
    'updatesItemsViaAPI',
  ].map((name) => ({
    baselineIdentity: `contracts :: tests/contracts/react.contract.spec.ts :: React Adapter Contract Tests :: ${name} (not implemented yet)`,
    candidateIdentity: `contracts :: tests/contracts/react.contract.spec.ts :: React Adapter Contract Tests :: ${name}`,
    baselineStatus: 'skipped',
    candidateStatus: 'passed',
    reason: '178 fast-track P1 activates this previously skipped React contract with an individually reported assertion.',
  })),
  {
    candidateIdentity: 'core-unit :: packages/core/tests/enhanced-select-accessibility-integration.spec.ts :: EnhancedSelect combobox accessibility integration :: synchronizes the input disabled property when enabled changes',
    baselineStatus: 'missing',
    candidateStatus: 'passed',
    reason: 'Focused regression coverage for the observable enabled-to-input property synchronization fix.',
  },
  ...[
    'mounts the custom element and synchronizes the provided items',
    'synchronizes controlled values reactively',
    'forwards selection callbacks with the selected item and index',
    'renders grouped items from the groupedItems prop',
    'exposes the ref handle for selection and imperative item updates',
    'removes adapter event listeners when the Solid owner is disposed',
  ].map((name) => ({
    candidateIdentity: `contracts :: tests/contracts/solid.contract.spec.ts :: Solid Adapter Contract Tests :: ${name}`,
    baselineStatus: 'missing',
    candidateStatus: 'passed',
    reason: '178 fast-track P1 adds a direct Solid adapter contract assertion.',
  })),
];
const workspaces = ['@smilodon/core', '@smilodon/react', '@smilodon/vue', '@smilodon/vanilla', '@smilodon/solid', '@smilodon/svelte'];
const failures = [];
const commands = [];
await mkdir(outputRoot, { recursive: true });

async function run(label, cwd, executable, args, logPath) {
  const result = spawnSync(executable, args, { cwd, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, timeout: 20 * 60 * 1000 });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}${result.error ? `\n${result.error.stack ?? result.error.message}` : ''}`;
  if (logPath) await writeFile(logPath, output);
  commands.push({ label, cwd, executable, args, exitCode: result.status, signal: result.signal ?? null, spawnError: result.error?.message ?? null });
  if (result.status !== 0) failures.push({ label, exitCode: result.status, signal: result.signal ?? null, error: result.error?.message ?? null });
  return result.status === 0;
}

async function prepareTree(name, cwd) {
  const dir = path.join(outputRoot, name);
  await mkdir(dir, { recursive: true });
  if (!await run(`${name}:npm-ci`, cwd, 'npm', ['ci', '--no-audit', '--no-fund'], path.join(dir, 'npm-ci.log'))) return false;
  for (const workspace of workspaces) {
    if (!await run(`${name}:build:${workspace}`, cwd, 'npm', ['--workspace', workspace, 'run', 'build'], path.join(dir, `build-${workspace.replaceAll('/', '-')}.log`))) return false;
  }
  if (!await run(`${name}:discovery`, cwd, 'node', ['--test', '--test-reporter=tap', 'tests/vitest-discovery.test.mjs', 'scripts/tests/svelte-runtime-declaration-parity.test.mjs'], path.join(dir, 'discovery.tap'))) return false;
  for (const [suite, config] of reports) {
    if (!await run(`${name}:vitest:${suite}`, cwd, 'npx', ['--no-install', 'vitest', 'run', '--config', config, '--reporter=json', `--outputFile=${path.join(dir, `${suite}.json`)}`], path.join(dir, `${suite}.log`))) {
      // Continue collecting the other suite reports so a failure artifact is complete.
    }
  }
  return true;
}

let summary;
try {
  const existing = spawnSync('git', ['cat-file', '-e', `${CERTIFIED_BASE_COMMIT}^{commit}`], { cwd: root });
  if (existing.status !== 0) throw new Error(`Certified baseline ${CERTIFIED_BASE_COMMIT} is unavailable in this checkout`);
  const add = spawnSync('git', ['worktree', 'add', '--detach', baselineRoot, CERTIFIED_BASE_COMMIT], { cwd: root, encoding: 'utf8' });
  if (add.status !== 0) throw new Error(`Unable to create certified baseline worktree: ${add.stderr}`);
  await prepareTree('baseline', baselineRoot);
  await prepareTree('candidate', root);

  const inventories = {};
  for (const [tree, cwd] of [['baseline', baselineRoot], ['candidate', root]]) {
    inventories[tree] = new Map();
    for (const [suite] of reports) {
      const file = path.join(outputRoot, tree, `${suite}.json`);
      const inventory = await readVitestReport(file, `${tree}/${suite}`, cwd);
      for (const [identity, status] of inventory) inventories[tree].set(`${suite} :: ${identity}`, status);
    }
    const tap = tapInventory(await readFile(path.join(outputRoot, tree, 'discovery.tap'), 'utf8'), `${tree}/discovery`);
    for (const [identity, status] of tap) inventories[tree].set(`node-test :: ${identity}`, status);
  }
  const baselineForComparison = new Map(inventories.baseline);
  const candidateForComparison = new Map(inventories.candidate);
  const acceptedCandidateChanges = [];
  for (const expected of approvedCandidateChanges) {
    const baselineStatus = expected.baselineIdentity ? baselineForComparison.get(expected.baselineIdentity) ?? 'missing' : 'missing';
    const candidateStatus = candidateForComparison.get(expected.candidateIdentity) ?? 'missing';
    if (baselineStatus !== expected.baselineStatus || candidateStatus !== expected.candidateStatus) continue;
    if (expected.baselineIdentity) baselineForComparison.delete(expected.baselineIdentity);
    candidateForComparison.delete(expected.candidateIdentity);
    acceptedCandidateChanges.push({ ...expected, observedBaselineStatus: baselineStatus, observedCandidateStatus: candidateStatus });
  }
  const differences = compareInventories(baselineForComparison, candidateForComparison);
  const prov = await provenance(root);
  const [baselineVitestPackage, candidateVitestPackage] = await Promise.all([
    readFile(path.join(baselineRoot, 'node_modules/vitest/package.json'), 'utf8').then(JSON.parse),
    readFile(path.join(root, 'node_modules/vitest/package.json'), 'utf8').then(JSON.parse),
  ]);
  summary = {
    ...prov,
    baselineCommit: CERTIFIED_BASE_COMMIT,
    baselineLockfileSha256: spawnSync('sha256sum', ['package-lock.json'], { cwd: baselineRoot, encoding: 'utf8' }).stdout.trim().split(/\s+/)[0],
    baselineAssertions: inventories.baseline.size,
    candidateAssertions: inventories.candidate.size,
    toolVersions: {
      baselineVitest: baselineVitestPackage.version,
      candidateVitest: candidateVitestPackage.version,
      baselineNode: process.version,
      candidateNode: process.version,
      baselineNpm: prov.npm,
      candidateNpm: prov.npm,
    },
    reporterFormatHandling: {
      baselineVitest1EmptyRootAncestor: 'remove exactly one leading empty ancestorTitles entry when present in baseline reports',
      explicitIdentityExceptions: REPORTER_IDENTITY_EXCEPTIONS,
      exceptionStatusRule: 'statuses must still match exactly',
    },
    acceptedCandidateChanges,
    acceptedCandidateChangeCount: acceptedCandidateChanges.length,
    expectedCandidateChangeCount: approvedCandidateChanges.length,
    differences,
    commands,
    commandFailures: failures,
    status: differences.length === 0 && failures.length === 0 && acceptedCandidateChanges.length === approvedCandidateChanges.length ? 'PASS' : 'FAIL',
  };
} catch (error) {
  failures.push({ label: 'comparison', error: error.stack ?? error.message });
  summary = { baseCommit: CERTIFIED_BASE_COMMIT, candidateCommit: null, commandFailures: failures, status: 'FAIL' };
} finally {
  const remove = spawnSync('git', ['worktree', 'remove', '--force', baselineRoot], { cwd: root, encoding: 'utf8' });
  if (remove.status !== 0 && remove.error?.code !== 'ENOENT') failures.push({ label: 'baseline-worktree-cleanup', error: remove.stderr || remove.error?.message });
  if (summary) {
    if (failures.length) { summary.commandFailures = failures; summary.status = 'FAIL'; }
    await writeFile(path.join(outputRoot, 'comparison.json'), `${JSON.stringify(summary, null, 2)}\n`);
    console.log(JSON.stringify({ status: summary.status, baselineCommit: summary.baselineCommit, candidateCommit: summary.candidateCommit, candidateTreeHash: summary.candidateTreeHash, baselineAssertions: summary.baselineAssertions, candidateAssertions: summary.candidateAssertions, acceptedCandidateChangeCount: summary.acceptedCandidateChangeCount ?? 0, expectedCandidateChangeCount: summary.expectedCandidateChangeCount ?? 0, differenceCount: summary.differences?.length ?? null, commandFailureCount: summary.commandFailures?.length ?? 0, report: path.join(outputRoot, 'comparison.json') }, null, 2));
  }
}
if (summary?.status !== 'PASS') process.exitCode = 1;
