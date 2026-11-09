import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { execFileSync, spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

async function main() {
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const results = path.resolve(process.env.NATIVE_CERTIFICATION_RESULTS_DIR ?? path.join(root, 'test-results/react-native-runtime-comparison'));
const temp = await mkdtemp(path.join(os.tmpdir(), 'smilodon-178f2-'));
const originalBundlePath = path.join(root, 'packages/react-native/src/generated/coreBundle.ts');
const originalBundle = await readFile(originalBundlePath);
const serial = process.env.ANDROID_SERIAL ?? 'emulator-5554';
const subjectId = `${Date.now()}-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const controlId = `control-${subjectId}`;
const prefix = { subject: 'SMILODON_RUNTIME', control: 'SMILODON_CONTROL' };
const packages = {
  subject: { id: 'com.smilodonnativeruntime', activity: 'com.smilodonnativeruntime/.MainActivity', fixture: 'react-native-runtime' },
  control: { id: 'com.smilonativecontrol', activity: 'com.smilonativecontrol/.MainActivity', fixture: 'react-native-runtime-control' },
};
const report = {
  directive: '178-F.2', status: 'running', startedAt: new Date().toISOString(),
  condition: 'Same API 35 emulator session; alternating control and packed Smilodon fixture; three matched trials planned per app.',
  environment: {}, packageArtifacts: {}, plannedTrialsPerApp: 3, trials: [], adb: [],
};
let collector;
let logPath = path.join(results, 'comparison-logcat-live.txt');

await mkdir(results, { recursive: true });
const exec = (cmd, args, opts = {}) => execFileSync(cmd, args, {
  cwd: opts.cwd ?? root, env: process.env, encoding: 'utf8', timeout: opts.timeout ?? 30_000,
  maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
}).trim();
const hash = async file => createHash('sha256').update(await readFile(file)).digest('hex');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const adb = (...args) => {
  const started = Date.now();
  try {
    const output = exec('adb', ['-s', serial, ...args], { timeout: args.includes('uiautomator') ? 35_000 : 20_000 });
    report.adb.push({ args, result: 'pass', durationMs: Date.now() - started });
    return output;
  } catch (error) {
    report.adb.push({ args, result: 'fail', durationMs: Date.now() - started, error: String(error.message), code: error.code });
    throw error;
  }
};
const run = (cmd, args, cwd, logfile, timeout = 20 * 60_000) => new Promise((resolve, reject) => {
  const child = spawn(cmd, args, { cwd, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
  const chunks = [];
  const stream = requireWriteStream(logfile);
  const timer = setTimeout(() => { child.kill('SIGTERM'); setTimeout(() => child.kill('SIGKILL'), 5000).unref(); }, timeout);
  for (const channel of [child.stdout, child.stderr]) channel.on('data', chunk => { chunks.push(chunk); stream.write(chunk); });
  child.on('error', error => { clearTimeout(timer); stream.end(); reject(error); });
  child.on('close', code => {
    clearTimeout(timer); stream.end();
    if (code === 0) resolve(); else reject(new Error(`${cmd} ${args.join(' ')} exited ${code}: ${Buffer.concat(chunks).toString('utf8').slice(-5000)}`));
  });
});
function requireWriteStream(file) { return createWriteStream(file); }
function xmlDecode(s) { return s.replaceAll('&quot;', '"').replaceAll('&apos;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&'); }
function xmlNodes(xml) {
  return [...xml.matchAll(/<node\b[^>]*\/?\s*>/g)].map(([tag]) => Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, k, v]) => [k, xmlDecode(v)]),
  ));
}
async function hierarchy(label, directory) {
  adb('shell', 'uiautomator', 'dump', '--compressed', '/sdcard/178f2-window.xml');
  const xml = adb('shell', 'cat', '/sdcard/178f2-window.xml');
  await writeFile(path.join(directory, `ui-${label}.xml`), xml);
  return xmlNodes(xml);
}
async function waitForNode(label, selector, directory, timeout = 30_000) {
  const deadline = Date.now() + timeout;
  let nodes = [];
  while (Date.now() < deadline) {
    nodes = await hierarchy(`wait-${label}-${Date.now()}`, directory);
    if (nodes.some(selector)) return nodes;
    await delay(500);
  }
  throw new Error(`Timed out waiting for UI node ${label}; last hierarchy had ${nodes.length} nodes.`);
}
async function screenshot(label, directory) {
  const bytes = execFileSync('adb', ['-s', serial, 'exec-out', 'screencap', '-p'], { encoding: null, timeout: 30_000, maxBuffer: 32 * 1024 * 1024 });
  const file = path.join(directory, `screen-${label}.png`);
  await writeFile(file, bytes);
  return { file: path.basename(file), sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length };
}
async function capture(label, directory) {
  const started = Date.now();
  const ui = await hierarchy(label, directory);
  const screen = await screenshot(label, directory);
  return { label, elapsedMs: Date.now() - started, hierarchyNodeCount: ui.length, screenshot: screen };
}
async function tapNode(label, selector, directory, timeout = 15_000) {
  const deadline = Date.now() + timeout;
  let nodes = [];
  while (Date.now() < deadline) {
    nodes = await hierarchy(`lookup-${label}-${Date.now()}`, directory);
    const found = nodes.find(selector);
    if (found?.bounds) {
      const m = found.bounds.match(/^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$/);
      if (!m) throw new Error(`Unparseable bounds for ${label}: ${found.bounds}`);
      adb('shell', 'input', 'tap', String(Math.floor((Number(m[1]) + Number(m[3])) / 2)), String(Math.floor((Number(m[2]) + Number(m[4])) / 2)));
      await delay(500);
      return found;
    }
    await delay(300);
  }
  throw new Error(`Could not find ${label}; last hierarchy had ${nodes.length} nodes`);
}
async function waitFor(marker, offset, timeout = 25_000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const text = await readFile(logPath, 'utf8').catch(() => '');
    if (text.slice(offset).includes(marker)) return text.slice(offset);
    await delay(250);
  }
  throw new Error(`Timed out waiting for logcat marker: ${marker}`);
}
async function canary(label) {
  const startedAt = new Date().toISOString();
  const results = [];
  for (let index = 0; index < 3; index += 1) {
    const nonce = `178f2-${label}-${index}-${Date.now()}`;
    const started = Date.now();
    const output = adb('shell', 'sh', '-c', `echo ${nonce}; getprop sys.boot_completed`);
    results.push({ nonce, output, durationMs: Date.now() - started });
  }
  return { startedAt, results };
}
async function prepareSubject(tarballs) {
  const fixture = path.join(temp, 'subject');
  await cp(path.join(root, 'tests/react-native-runtime'), fixture, { recursive: true, filter: source => !source.split(path.sep).includes('node_modules') && !source.split(path.sep).includes('artifacts') });
  await writeFile(path.join(fixture, 'runtime-context.ts'), `export const runtimeId = ${JSON.stringify(subjectId)};\n`);
  const artifactDir = path.join(fixture, 'artifacts');
  await mkdir(artifactDir, { recursive: true });
  const core = path.join(artifactDir, 'smilodon-core-1.10.0.tgz');
  const native = path.join(artifactDir, 'smilodon-react-native-1.10.0.tgz');
  await cp(tarballs.core, core); await cp(tarballs.native, native);
  const lockPath = path.join(fixture, 'package-lock.json');
  const lock = JSON.parse(await readFile(lockPath, 'utf8'));
  lock.packages['node_modules/@smilodon/core'].integrity = `sha512-${createHash('sha512').update(await readFile(core)).digest('base64')}`;
  lock.packages['node_modules/@smilodon/react-native'].integrity = `sha512-${createHash('sha512').update(await readFile(native)).digest('base64')}`;
  await writeFile(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
  return fixture;
}
async function prepareControl() {
  const fixture = path.join(temp, 'control');
  await cp(path.join(root, 'tests/react-native-runtime-control'), fixture, { recursive: true, filter: source => !source.split(path.sep).includes('node_modules') && !source.split(path.sep).includes('artifacts') });
  const pkg = JSON.parse(await readFile(path.join(fixture, 'package.json'), 'utf8'));
  if (pkg.dependencies?.['@smilodon/core'] || pkg.dependencies?.['@smilodon/react-native']) {
    throw new Error('Control fixture must not depend on either Smilodon package.');
  }
  await writeFile(path.join(fixture, 'runtime-context.ts'), `export const runtimeId = ${JSON.stringify(controlId)};\n`);
  return fixture;
}
async function packageVersions(fixture, names) {
  const versions = {};
  for (const name of names) {
    const data = JSON.parse(await readFile(path.join(fixture, 'node_modules', name, 'package.json'), 'utf8'));
    versions[name] = data.version;
  }
  return versions;
}
async function buildPackageArtifacts() {
  const status = exec('git', ['status', '--porcelain=v1', '--', 'packages/react-native/src/generated/coreBundle.ts']);
  if (status) throw new Error('Refusing to build because packages/react-native/src/generated/coreBundle.ts was already modified.');
  await run('npm', ['run', 'build', '-w', '@smilodon/core'], root, path.join(results, 'core-build.log'));
  await run('npm', ['run', 'build', '-w', '@smilodon/react-native'], root, path.join(results, 'react-native-build.log'));
  const packed = path.join(temp, 'tarballs'); await mkdir(packed, { recursive: true });
  await run('npm', ['pack', '-w', '@smilodon/core', '--pack-destination', packed], root, path.join(results, 'package-pack.log'));
  await run('npm', ['pack', '-w', '@smilodon/react-native', '--pack-destination', packed], root, path.join(results, 'package-pack.log'));
  const files = await readdir(packed);
  return { core: path.join(packed, files.find(x => x.startsWith('smilodon-core-'))), native: path.join(packed, files.find(x => x.startsWith('smilodon-react-native-'))) };
}
async function runTrial(kind, index) {
  const trialId = `${kind}-${index}`;
  const directory = path.join(results, 'trials', trialId);
  await mkdir(directory, { recursive: true });
  const trialStarted = Date.now();
  const markerPrefix = `${prefix[kind]}:${kind === 'subject' ? subjectId : controlId}:`;
  const app = packages[kind];
  const record = { kind, index, startedAt: new Date().toISOString(), result: 'running', operations: [] };
  report.trials.push(record);
  const baseOffset = (await stat(logPath)).size;
  adb('shell', 'am', 'force-stop', app.id);
  adb('shell', 'am', 'start', '-n', app.activity);
  await waitFor(`${markerPrefix}APP_MOUNTED`, baseOffset);
  await waitFor(`${markerPrefix}${kind === 'subject' ? 'SELECT_MOUNTED' : 'WEBVIEW_READY'}`, baseOffset);
  await waitForNode('initial-webview-control', kind === 'subject'
    ? n => n.text === 'Alpha' || n['content-desc'] === 'Alpha'
    : n => n.text === 'Choose an item' || n['content-desc'] === 'Choose an item', directory);
  record.operations.push(await capture('mounted-1', directory));
  record.operations.push(await capture('mounted-2', directory));

  let offset = (await stat(logPath)).size;
  await tapNode('open', n => n['content-desc'] === 'runtime-open', directory);
  await waitFor(`${markerPrefix}OPEN`, offset);
  await waitForNode('search-field-after-open', n => n.class === 'android.widget.EditText', directory);
  record.operations.push(await capture('opened-1', directory));
  record.operations.push(await capture('opened-2', directory));

  offset = (await stat(logPath)).size;
  await tapNode('search', n => n.class === 'android.widget.EditText', directory);
  adb('shell', 'input', 'text', 'beta');
  await waitFor(`${markerPrefix}SEARCH "beta"`, offset);
  const filteredNodes = await hierarchy('filtered-options-check', directory);
  if (filteredNodes.some(n => n.text === 'Alpha' || n['content-desc'] === 'Alpha')) throw new Error(`${kind} WebView did not filter out Alpha after searching Beta.`);
  if (!filteredNodes.some(n => n.text === 'Beta' || n['content-desc'] === 'Beta')) throw new Error(`${kind} WebView did not expose Beta after searching.`);
  record.operations.push(await capture('filtered-1', directory));
  record.operations.push(await capture('filtered-2', directory));

  offset = (await stat(logPath)).size;
  await tapNode('beta-option', n => n.text === 'Beta' || n['content-desc'] === 'Beta', directory);
  await waitFor(`${markerPrefix}SELECT "beta"`, offset);
  record.operations.push(await capture('selected-1', directory));
  record.operations.push(await capture('selected-2', directory));
  record.operations.push({ label: 'adb-canary', ...await canary(trialId) });
  await writeFile(path.join(directory, 'logcat-trial.txt'), (await readFile(logPath, 'utf8')).slice(baseOffset));
  record.finishedAt = new Date().toISOString(); record.durationMs = Date.now() - trialStarted; record.result = 'pass';
  return record;
}

try {
  const generatedStatus = exec('git', ['status', '--porcelain=v1', '--', 'packages/react-native/src/generated/coreBundle.ts']);
  if (generatedStatus) throw new Error('Tracked generated Core bundle is dirty before comparison.');
  const gradleVersion = exec('gradle', ['--version']);
  const android = exec('adb', ['-s', serial, 'shell', 'getprop', 'ro.build.version.sdk']);
  report.environment = {
    node: process.version, npm: exec('npm', ['--version']), java: exec('java', ['--version']),
    gradle: gradleVersion.split('\n').filter(x => /Gradle |JVM:|Launcher JVM:/.test(x)), androidApi: android,
    emulatorModel: exec('adb', ['-s', serial, 'shell', 'getprop', 'ro.product.model']),
    emulatorFingerprint: exec('adb', ['-s', serial, 'shell', 'getprop', 'ro.build.fingerprint']),
  };
  collector = spawn('adb', ['-s', serial, 'logcat', '-v', 'time'], { stdio: ['ignore', 'pipe', 'pipe'] });
  const out = createWriteStream(logPath, { flags: 'w' });
  collector.stdout.pipe(out); collector.stderr.pipe(out);
  const tarballs = await buildPackageArtifacts();
  report.packageArtifacts.coreSha256 = await hash(tarballs.core);
  report.packageArtifacts.reactNativeSha256 = await hash(tarballs.native);
  const subject = await prepareSubject(tarballs);
  const control = await prepareControl();
  for (const [kind, fixture] of [['subject', subject], ['control', control]]) {
    await run('npm', ['ci', '--no-audit', '--no-fund'], fixture, path.join(results, `${kind}-npm-ci.log`));
    report.packageArtifacts[`${kind}DependencyVersions`] = await packageVersions(fixture, [
      'react', 'react-native', 'react-native-webview',
      ...(kind === 'subject' ? ['@smilodon/core', '@smilodon/react-native'] : []),
    ]);
    report.packageArtifacts[`${kind}LockfileSha256`] = await hash(path.join(fixture, 'package-lock.json'));
    await run('gradle', ['--no-daemon', '--stacktrace', '-PreactNativeArchitectures=x86_64', ':app:assembleRelease'], path.join(fixture, 'android'), path.join(results, `${kind}-assemble-release.log`));
    const apk = path.join(fixture, 'android/app/build/outputs/apk/release/app-release.apk');
    report.packageArtifacts[`${kind}ApkSha256`] = await hash(apk);
    exec('adb', ['-s', serial, 'install', '-r', apk], { timeout: 180_000 });
  }
  const sequence = ['control', 'subject', 'control', 'subject', 'control', 'subject'];
  for (const kind of sequence) {
    if (exec('adb', ['devices'], { timeout: 10_000 }).includes(`${serial}\tdevice`) === false) throw new Error(`ADB transport lost before ${kind} trial.`);
    await runTrial(kind, report.trials.filter(t => t.kind === kind).length + 1);
  }
  report.status = 'comparison-complete';
  report.assessment = 'All planned matched workloads completed; this comparison does not certify the full native bridge suite.';
} catch (error) {
  report.status = 'comparison-incomplete';
  report.failure = String(error.stack ?? error);
  const unfinishedTrial = report.trials.findLast(trial => trial.result === 'running');
  if (unfinishedTrial) {
    unfinishedTrial.result = 'fail';
    unfinishedTrial.finishedAt = new Date().toISOString();
    unfinishedTrial.durationMs = Date.now() - Date.parse(unfinishedTrial.startedAt);
    unfinishedTrial.failure = String(error.message ?? error);
  }
  try { report.adbAtFailure = execFileSync('adb', ['devices', '-l'], { encoding: 'utf8', timeout: 10_000, maxBuffer: 2_000_000 }); }
  catch (adbError) { report.adbAtFailure = `adb devices failed: ${String(adbError.message)}`; }
  report.emulatorSupervisorTail = await readFile(path.join(results, 'emulator-lifecycle.jsonl'), 'utf8').catch(() => 'supervisor lifecycle file unavailable');
  console.error(error);
} finally {
  collector?.kill('SIGTERM');
  report.finishedAt = new Date().toISOString();
  await writeFile(path.join(results, 'comparison.json'), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(originalBundlePath, originalBundle);
  await rm(temp, { recursive: true, force: true });
}
if (report.status !== 'comparison-complete') process.exitCode = 1;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
