import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = join(root, 'tests/consumers/svelte-v5');
const temp = mkdtempSync(join(tmpdir(), 'smilodon-svelte-v5-consumer-'));

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} exited ${result.status}`);
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

run('npm', ['run', 'build', '--workspace=@smilodon/core']);
run('npm', ['run', 'build', '--workspace=@smilodon/svelte']);
run('npm', ['pack', './packages/core', '--pack-destination', temp]);
run('npm', ['pack', './packages/svelte', '--pack-destination', temp]);

const archives = readdirSync(temp).filter((name) => name.endsWith('.tgz'));
const coreArchive = archives.find((name) => name.startsWith('smilodon-core-'));
const svelteArchive = archives.find((name) => name.startsWith('smilodon-svelte-'));
if (!coreArchive || !svelteArchive) throw new Error(`Expected Core and Svelte tarballs; found: ${archives.join(', ')}`);

const consumer = join(temp, 'consumer');
mkdirSync(consumer);
cpSync(fixture, consumer, { recursive: true });
const packageJson = {
  name: 'smilodon-svelte-v5-packed-consumer',
  private: true,
  type: 'module',
  scripts: { build: 'vite build', typecheck: 'tsc -p tsconfig.json' },
  dependencies: {
    '@smilodon/core': `file:${join(temp, coreArchive)}`,
    '@smilodon/svelte': `file:${join(temp, svelteArchive)}`,
    svelte: '5.57.3',
  },
  devDependencies: {
    '@sveltejs/vite-plugin-svelte': '5.1.1',
    typescript: '5.9.3',
    vite: '6.4.6',
  },
};
writeFileSync(join(consumer, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);
run('npm', ['install', '--no-audit', '--no-fund'], consumer);
run('npm', ['run', 'typecheck'], consumer);
run('npm', ['run', 'build'], consumer);

const lockPath = join(consumer, 'package-lock.json');
const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
const installedSveltePackage = JSON.parse(readFileSync(join(consumer, 'node_modules/@smilodon/svelte/package.json'), 'utf8'));
if (installedSveltePackage.version !== '2.0.0') throw new Error(`Expected @smilodon/svelte 2.0.0, got ${installedSveltePackage.version}`);
if (installedSveltePackage.peerDependencies?.svelte !== '^5.0.0') {
  throw new Error(`Packed Svelte peer range must be ^5.0.0, got ${installedSveltePackage.peerDependencies?.svelte}`);
}
const result = {
  outcome: 'passed',
  node: process.version,
  npm: spawnSync('npm', ['--version'], { cwd: consumer, encoding: 'utf8' }).stdout.trim(),
  svelte: lock.packages['node_modules/svelte'].version,
  packageVersions: {
    '@smilodon/core': lock.packages['node_modules/@smilodon/core'].version,
    '@smilodon/svelte': lock.packages['node_modules/@smilodon/svelte'].version,
  },
  declaredSveltePeer: installedSveltePackage.peerDependencies.svelte,
  tarballs: {
    core: { file: coreArchive, sha256: sha256(join(temp, coreArchive)) },
    svelte: { file: svelteArchive, sha256: sha256(join(temp, svelteArchive)) },
  },
  consumerLockSha256: sha256(lockPath),
  productionBundleFiles: readdirSync(join(consumer, 'dist')).sort(),
};
mkdirSync(join(root, 'test-results/svelte'), { recursive: true });
writeFileSync(join(root, 'test-results/svelte/packed-consumer.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
