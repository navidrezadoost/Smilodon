import { createHash } from 'node:crypto';
import { readFile, readdir, mkdir, writeFile, lstat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { CERTIFIED_BASE_COMMIT, provenance } from './h2g16-provenance.mjs';

const [tarballDirectory, fixtureDirectory, outputPath, rootLockPath] = process.argv.slice(2);
if (!tarballDirectory || !fixtureDirectory || !outputPath || !rootLockPath) {
  throw new Error('Usage: run-core-node18-consumer-check.mjs <tarball-directory> <fixture-directory> <output-json> <root-lockfile>');
}

const outputDirectory = path.dirname(outputPath);
await mkdir(outputDirectory, { recursive: true });
const tarballs = (await readdir(tarballDirectory))
  .filter((file) => file.endsWith('.tgz'))
  .map((file) => path.join(tarballDirectory, file));
if (tarballs.length !== 1) throw new Error(`Expected exactly one packed Core tarball, found ${tarballs.length}`);
const tarball = tarballs[0];

const commands = [
  ['fixture-install', ['ci', '--prefix', fixtureDirectory, '--no-audit', '--no-fund']],
  ['packed-core-install', ['install', '--prefix', fixtureDirectory, '--no-save', '--package-lock=false', tarball]],
  ['nodenext-consumer', ['run', '--prefix', fixtureDirectory, 'typecheck:nodenext']],
  ['bundler-consumer', ['run', '--prefix', fixtureDirectory, 'typecheck:bundler']],
];
const results = [];
let canContinue = true;
for (const [name, args] of commands) {
  if (!canContinue) {
    results.push({ name, exitCode: null, signal: null, skippedBecause: 'prerequisite command failed' });
    continue;
  }
  const result = spawnSync('npm', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 120_000,
    maxBuffer: 16 * 1024 * 1024,
  });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  await writeFile(path.join(outputDirectory, `${name}.log`), output);
  results.push({ name, exitCode: result.status, signal: result.signal ?? null, spawnError: result.error?.message ?? null, invocation: ['npm', ...args] });
  if (result.status !== 0) canContinue = false;
  if (name === 'packed-core-install' && result.status === 0) {
    const installedPath = path.join(fixtureDirectory, 'node_modules', '@smilodon', 'core');
    try {
      const installedStat = await lstat(installedPath);
      if (installedStat.isSymbolicLink()) {
        results[results.length - 1].artifactVerification = 'failed: installed package is a symlink';
        canContinue = false;
      } else {
        const installedPackage = JSON.parse(await readFile(path.join(installedPath, 'package.json'), 'utf8'));
        if (installedPackage.name !== '@smilodon/core') throw new Error(`unexpected installed package name ${installedPackage.name}`);
        results[results.length - 1].artifactVerification = 'passed: extracted package from packed tarball; not a workspace symlink';
      }
    } catch (error) {
      results[results.length - 1].artifactVerification = `failed: ${error.message}`;
      canContinue = false;
    }
  }
}

const hash = (buffer) => createHash('sha256').update(buffer).digest('hex');
const inputErrors = [];
const readOptional = async (filename, label) => {
  try { return await readFile(filename); }
  catch (error) { inputErrors.push(`${label}: ${error.message}`); return null; }
};
const [rootLock, fixtureLock, tarballBytes] = await Promise.all([
  readOptional(rootLockPath, 'root lockfile'),
  readOptional(path.join(fixtureDirectory, 'package-lock.json'), 'fixture lockfile'),
  readOptional(tarball, 'package tarball'),
]);
const prov = await provenance(process.cwd());
const result = {
  status: results.every(({ exitCode }) => exitCode === 0) && inputErrors.length === 0 ? 'passed' : 'failed',
  ...prov,
  baseCommit: CERTIFIED_BASE_COMMIT,
  candidateCommit: prov.candidateCommit,
  rootLockSha256: rootLock ? hash(rootLock) : null,
  fixtureLockSha256: fixtureLock ? hash(fixtureLock) : null,
  packageTarballSha256: tarballBytes ? hash(tarballBytes) : null,
  packageTarballFilename: path.basename(tarball),
  packageTarballPath: path.resolve(tarball),
  fixtureDirectory: path.resolve(fixtureDirectory),
  inputErrors,
  invocation: ['node', 'scripts/run-core-node18-consumer-check.mjs', path.resolve(tarballDirectory), path.resolve(fixtureDirectory), path.resolve(outputPath), path.resolve(rootLockPath)],
  commands: results,
};
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
if (result.status !== 'passed') process.exitCode = 1;
