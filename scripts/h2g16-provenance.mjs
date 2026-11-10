import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

export const CERTIFIED_BASE_COMMIT = 'c1e95d637ddbdda426448e8944c7bfe766e6b7fa';
const SNAPSHOT_EXCLUDES = [
  /^\.git\//,
  /(^|\/)node_modules\//,
  /(^|\/)(?:dist|coverage|test-results|\.cache)\//,
  /^docs\/architecture\/(?:178-h2g14-evidence|178-h2g16-evidence)\//,
  /^docs\/architecture\/(?:SECURITY-REMEDIATION-178-H2G14|SECURITY-RECONCILIATION-178-H2G1[5-7]|178-H2G16-qualification-manifest)\.md?$/,
];

function git(args, cwd) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${result.stderr || result.error?.message}`);
  return result.stdout;
}

export async function candidateTreeHash(root = process.cwd()) {
  const names = new Set([
    ...git(['ls-files', '-z'], root).split('\0').filter(Boolean),
    ...git(['ls-files', '--others', '--exclude-standard', '-z'], root).split('\0').filter(Boolean),
  ]);
  const included = [...names].filter((name) => !SNAPSHOT_EXCLUDES.some((pattern) => pattern.test(name))).sort();
  const hash = createHash('sha256');
  for (const name of included) {
    const bytes = await readFile(path.join(root, name));
    hash.update(name).update('\0').update(String(bytes.length)).update('\0').update(bytes).update('\0');
  }
  return { sha256: hash.digest('hex'), fileCount: included.length, algorithm: 'sha256(path NUL byteLength NUL bytes NUL; UTF-8 path sort)', exclusions: SNAPSHOT_EXCLUDES.map(String) };
}

export async function provenance(root = process.cwd(), extra = {}) {
  const head = git(['rev-parse', 'HEAD'], root).trim();
  const baseCommit = CERTIFIED_BASE_COMMIT;
  const declaredCandidate = process.env.CANDIDATE_COMMIT;
  const candidate = await candidateTreeHash(root);
  return {
    baseCommit,
    candidateCommit: declaredCandidate && /^[0-9a-f]{40}$/i.test(declaredCandidate)
      ? declaredCandidate
      : head === baseCommit ? null : head,
    checkoutCommit: head,
    candidateTreeHash: candidate.sha256,
    candidateTreeFileCount: candidate.fileCount,
    candidateTreeHashAlgorithm: candidate.algorithm,
    candidateTreeHashExclusions: candidate.exclusions,
    lockfileSha256: createHash('sha256').update(await readFile(path.join(root, 'package-lock.json'))).digest('hex'),
    node: process.version,
    npm: (() => {
      const result = spawnSync('npm', ['--version'], { cwd: root, encoding: 'utf8' });
      return result.status === 0 ? result.stdout.trim() : null;
    })(),
    ...extra,
  };
}
