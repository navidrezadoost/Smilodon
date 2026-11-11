import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const version = '8.10.2';
const expectedSha256 = '31c55713e40233a8303827ceb42ca48a47267a0ad4bab9177123121e71524c26';
const runnerTemp = process.env.RUNNER_TEMP ?? os.tmpdir();
const archive = process.env.GRADLE_ARCHIVE_PATH ?? path.join(runnerTemp, `gradle-${version}-bin.zip`);
const reportPath = path.resolve(process.env.GRADLE_SETUP_REPORT ?? 'test-results/react-native-runtime/gradle-setup.json');
const outputPath = process.env.GITHUB_OUTPUT;
const installPath = path.join(runnerTemp, `gradle-${version}`);
const sources = [
  `https://downloads.gradle.org/distributions/gradle-${version}-bin.zip`,
  `https://services.gradle.org/distributions/gradle-${version}-bin.zip`,
];

async function sha256(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex');
}

async function setOutput(key, value) {
  if (outputPath) await appendFile(outputPath, `${key}=${value}\n`);
}

async function main() {
  const report = { directive: '178-F.1', version, expectedSha256, archive, installPath, startedAt: new Date().toISOString(), attempts: [] };
  await mkdir(path.dirname(reportPath), { recursive: true });
  try {
    let archiveReady = false;
    try {
      const found = await sha256(archive);
      archiveReady = found === expectedSha256;
      report.cacheCandidate = { sha256: found, valid: archiveReady };
    } catch {
      report.cacheCandidate = { present: false };
    }

    if (!archiveReady) {
      for (const url of sources) {
        const attempt = { url, startedAt: new Date().toISOString() };
        report.attempts.push(attempt);
        const result = spawnSync('curl', [
          '--fail', '--location', '--silent', '--show-error', '--retry', '1', '--retry-all-errors',
          '--retry-delay', '3', '--connect-timeout', '20', '--max-time', '120', '--output', archive, url,
        ], { encoding: 'utf8', timeout: 270_000 });
        attempt.exitCode = result.status;
        attempt.signal = result.signal ?? null;
        attempt.error = result.error?.message ?? null;
        attempt.stderr = result.stderr?.slice(-4000) ?? '';
        attempt.finishedAt = new Date().toISOString();
        if (result.status !== 0) continue;
        attempt.sha256 = await sha256(archive);
        if (attempt.sha256 === expectedSha256) {
          archiveReady = true;
          break;
        }
        attempt.error = `Checksum mismatch: received ${attempt.sha256}`;
      }
    }

    if (!archiveReady) {
      const error = new Error('No Gradle distribution source produced the expected checksum.');
      error.code = 'INFRA_GRADLE_UNAVAILABLE';
      throw error;
    }

    const unzip = spawnSync('unzip', ['-q', '-o', archive, '-d', runnerTemp], { encoding: 'utf8', timeout: 120_000 });
    if (unzip.status !== 0) throw new Error(`Gradle archive extraction failed: ${unzip.stderr ?? unzip.error?.message ?? unzip.status}`);
    const versionResult = spawnSync(path.join(installPath, 'bin/gradle'), ['--version'], { encoding: 'utf8', timeout: 30_000 });
    if (versionResult.status !== 0) throw new Error(`Gradle version check failed: ${versionResult.stderr ?? versionResult.error?.message}`);
    report.sha256 = await sha256(archive);
    report.versionOutput = versionResult.stdout.split('\n').filter(line => /Gradle |JVM:|Launcher JVM:/.test(line));
    report.status = 'pass';
    await setOutput('archive_ready', 'true');
    if (process.env.GITHUB_PATH) await appendFile(process.env.GITHUB_PATH, `${path.join(installPath, 'bin')}\n`);
  } catch (error) {
    report.status = 'fail';
    report.failureCode = error.code ?? 'GRADLE_SETUP_FAILED';
    report.failure = String(error?.stack ?? error);
    await setOutput('archive_ready', 'false');
    process.exitCode = 1;
  } finally {
    report.finishedAt = new Date().toISOString();
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify(report, null, 2));
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
