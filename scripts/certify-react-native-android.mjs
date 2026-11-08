import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import process from 'node:process';
import { createWriteStream } from 'node:fs';
import { cp, mkdir, mkdtemp, open, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

async function main() {
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resultDirectory = path.resolve(
  process.env.NATIVE_CERTIFICATION_RESULTS_DIR ?? path.join(root, 'test-results/react-native-runtime'),
);
const bundlePath = path.join(root, 'packages/react-native/src/generated/coreBundle.ts');
const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'smilodon-rn-android-178f-'));
const fixtureDirectory = path.join(tempDirectory, 'app');
const tarballDirectory = path.join(tempDirectory, 'tarballs');
const gradleOutput = path.join(resultDirectory, 'gradle-install-release.log');
const logcatPath = path.join(resultDirectory, 'device-logcat-live.log');
const emulatorSerial = process.env.ANDROID_SERIAL ?? 'emulator-5554';
const runtimeId = `${Date.now()}-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
let report;
let logcatCollector;
let logcatStream;
let logcatErrorStream;
let currentStage;
let logcatReadOffset = 0;
let logcatText = '';

await mkdir(resultDirectory, { recursive: true });
await mkdir(tarballDirectory, { recursive: true });

function rawCommandOutput(command, args, options = {}) {
  const startedAt = Date.now();
  try {
    const output = execFileSync(command, args, {
      cwd: options.cwd ?? root,
      encoding: 'utf8',
      timeout: options.timeout ?? 20_000,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    }).trim();
    if (command === 'adb' && report) (report.adbCommands ??= []).push({
      command: args.join(' '), durationMs: Date.now() - startedAt, result: 'pass',
    });
    return output;
  } catch (error) {
    if (command === 'adb' && report) (report.adbCommands ??= []).push({
      command: args.join(' '), durationMs: Date.now() - startedAt, result: 'fail',
      timeout: error?.code === 'ETIMEDOUT', error: error?.message,
    });
    throw error;
  }
}

function ensureAdbOnline() {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const devices = rawCommandOutput('adb', ['devices', '-l'], { timeout: 10_000 });
    if (new RegExp(`^${emulatorSerial}\\s+device\\b`, 'm').test(devices)) return;
    console.warn(`[178-F] ADB device ${emulatorSerial} is not online; reconnect attempt ${attempt + 1}/4`);
    try {
      rawCommandOutput('adb', ['start-server'], { timeout: 10_000 });
      rawCommandOutput('adb', ['reconnect', 'offline'], { timeout: 10_000 });
      rawCommandOutput('adb', ['-s', emulatorSerial, 'wait-for-device'], { timeout: 10_000 });
    } catch {
      // Recheck the transport; the next attempt may reconnect after the emulator recovers.
    }
  }
  const devices = rawCommandOutput('adb', ['devices', '-l'], { timeout: 10_000 });
  throw new Error(`ADB device ${emulatorSerial} did not return online after reconnect attempts.\n${devices}`);
}

function commandOutput(command, args, options = {}) {
  if (command !== 'adb') return rawCommandOutput(command, args, options);
  if (args[0] !== 'devices' && args[0] !== 'start-server' && args[0] !== 'reconnect') {
    ensureAdbOnline();
  }
  const targetArgs = args[0] === 'devices' || args[0] === 'start-server' || args[0] === 'reconnect'
    ? args
    : ['-s', emulatorSerial, ...args];
  return rawCommandOutput(command, targetArgs, options);
}

function run(command, args, { cwd = root, logFile, timeoutMs = 20 * 60_000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
    const output = createWriteStream(logFile ?? path.join(resultDirectory, 'certification-commands.log'), {
      flags: logFile ? 'w' : 'a',
    });
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 5_000).unref();
    }, timeoutMs);
    child.stdout.on('data', chunk => {
      process.stdout.write(chunk);
      output.write(chunk);
    });
    child.stderr.on('data', chunk => {
      process.stderr.write(chunk);
      output.write(chunk);
    });
    child.on('error', error => {
      clearTimeout(timeout);
      output.end();
      reject(error);
    });
    child.on('close', code => {
      clearTimeout(timeout);
      output.end();
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited with ${code}${code === null ? ` after ${timeoutMs}ms timeout` : ''}`));
    });
  });
}

function sha256(file) {
  return readFile(file).then(contents => createHash('sha256').update(contents).digest('hex'));
}

function adb(...args) {
  return commandOutput('adb', args);
}

function decodeXml(value) {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}

function nodesFromXml(xml) {
  return [...xml.matchAll(/<node\b[^>]*\/?\s*>/g)].map(([node]) => {
    const attrs = Object.fromEntries(
      [...node.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [key, decodeXml(value)]),
    );
    return attrs;
  });
}

function boundsOf(node) {
  const match = node.bounds?.match(/^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$/);
  if (!match) throw new Error(`Accessibility node has no readable bounds: ${JSON.stringify(node)}`);
  const [, left, top, right, bottom] = match.map(Number);
  return { x: Math.floor((left + right) / 2), y: Math.floor((top + bottom) / 2) };
}

async function dumpUi(label) {
  adb('shell', 'uiautomator', 'dump', '--compressed', '/sdcard/smilodon-window.xml');
  const xml = adb('shell', 'cat', '/sdcard/smilodon-window.xml');
  await writeFile(path.join(resultDirectory, `ui-${label}.xml`), xml);
  return nodesFromXml(xml);
}

async function captureScreen(label) {
  ensureAdbOnline();
  const screenshot = execFileSync('adb', ['-s', emulatorSerial, 'exec-out', 'screencap', '-p'], {
    encoding: null,
    timeout: 30_000,
    maxBuffer: 32 * 1024 * 1024,
  });
  await writeFile(path.join(resultDirectory, `screen-${label}.png`), screenshot);
  return {
    sizeBytes: screenshot.length,
    sha256: createHash('sha256').update(screenshot).digest('hex'),
    pngSignatureValid: screenshot.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    width: screenshot.length >= 24 ? screenshot.readUInt32BE(16) : null,
    height: screenshot.length >= 24 ? screenshot.readUInt32BE(20) : null,
  };
}

async function recordProcessMemory(label) {
  const processId = adb('shell', 'pidof', 'com.smilodonnativeruntime').split(' ')[0];
  if (!processId) throw new Error(`Android fixture process was not found while recording ${label} memory.`);
  const details = adb('shell', 'dumpsys', 'meminfo', processId);
  await writeFile(path.join(resultDirectory, `memory-${label}.txt`), details);
  return details.split('\n').filter(line => /^\s*TOTAL\s/.test(line));
}

async function tapNode(label, selector, { timeoutMs = 15_000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  let nodes = [];
  while (Date.now() < deadline) {
    nodes = await dumpUi(label);
    const node = nodes.find(selector);
    if (node) {
      const { x, y } = boundsOf(node);
      adb('shell', 'input', 'tap', String(x), String(y));
      await delay(500);
      return node;
    }
    await delay(500);
  }
  throw new Error(`Timed out finding accessibility node for ${label}. Last nodes: ${JSON.stringify(nodes)}`);
}

function tapButton(id) {
  return tapNode(`button-${id}`, node => node['content-desc'] === `runtime-${id}`);
}

function textNode(label) {
  return tapNode(`text-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, node =>
    node.text === label || node['content-desc'] === label,
  );
}

async function tapSearchField() {
  return tapNode('search-field', node =>
    node.class === 'android.widget.EditText' ||
    node.text === 'Choose an item' ||
    node['content-desc'] === 'Choose an item',
  );
}

async function waitForLog(predicate, label, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  let logs = '';
  while (Date.now() < deadline) {
    if (logcatCollector && (logcatCollector.exitCode !== null || logcatCollector.signalCode !== null)) {
      throw new Error(`Continuous logcat collector stopped before ${label}; exit=${logcatCollector.exitCode}, signal=${logcatCollector.signalCode}.`);
    }
    logs = await runtimeLogs();
    if (predicate(logs)) return logs;
    await delay(500);
  }
  await writeFile(path.join(resultDirectory, 'logcat-timeout.log'), logs);
  throw new Error(`Timed out waiting for ${label}`);
}

async function runtimeLogs() {
  try {
    const size = (await stat(logcatPath)).size;
    if (size < logcatReadOffset) logcatReadOffset = 0;
    if (size > logcatReadOffset) {
      const handle = await open(logcatPath, 'r');
      try {
        while (logcatReadOffset < size) {
          const buffer = Buffer.alloc(Math.min(256 * 1024, size - logcatReadOffset));
          const { bytesRead } = await handle.read(buffer, 0, buffer.length, logcatReadOffset);
          if (bytesRead === 0) break;
          logcatReadOffset += bytesRead;
          logcatText += buffer.subarray(0, bytesRead).toString('utf8');
          if (logcatText.length > 16 * 1024 * 1024) {
            const tail = logcatText.slice(-12 * 1024 * 1024);
            logcatText = tail.slice(Math.max(0, tail.indexOf('\n') + 1));
          }
        }
      } finally {
        await handle.close();
      }
    }
    return logcatText;
  } catch {
    return logcatText;
  }
}

function eventMarker(name) {
  return `SMILODON_RUNTIME:${runtimeId}:${name}`;
}

async function startLogcatCollector() {
  logcatStream = createWriteStream(logcatPath, { flags: 'w' });
  const errorPath = path.join(resultDirectory, 'device-logcat-collector-error.log');
  logcatErrorStream = createWriteStream(errorPath, { flags: 'w' });
  logcatCollector = spawn('adb', ['-s', emulatorSerial, 'logcat', '-v', 'threadtime',
    'ReactNativeJS:V', 'System.err:V', 'AndroidRuntime:E', 'ActivityManager:E', 'chromium:E', '*:S'],
  { env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
  logcatCollector.stdout.pipe(logcatStream);
  logcatCollector.stderr.pipe(logcatErrorStream);
  logcatCollector.on('error', error => logcatErrorStream.write(`${error.stack ?? error}\n`));
  await delay(500);
  if (logcatCollector.exitCode !== null) throw new Error(`Continuous logcat collector exited early with ${logcatCollector.exitCode}.`);
  report.artifacts.logcat = path.basename(logcatPath);
  report.logcatCollector = { startedAt: new Date().toISOString(), pid: logcatCollector.pid };
}

async function stopLogcatCollector() {
  if (logcatCollector && logcatCollector.exitCode === null) {
    logcatCollector.kill('SIGTERM');
    await Promise.race([new Promise(resolve => logcatCollector.once('close', resolve)), delay(2_000)]);
  }
  if (logcatStream) await new Promise(resolve => logcatStream.end(resolve));
  if (logcatErrorStream) await new Promise(resolve => logcatErrorStream.end(resolve));
  if (report?.logcatCollector) {
    report.logcatCollector.finishedAt = new Date().toISOString();
    report.logcatCollector.exitCode = logcatCollector?.exitCode ?? null;
  }
}

async function adbCanary(stage) {
  const startedAt = Date.now();
  const nonce = `${runtimeId}-${stage}`;
  const snapshot = { stage, startedAt: new Date().toISOString(), serial: emulatorSerial };
  try {
    snapshot.devices = rawCommandOutput('adb', ['devices', '-l'], { timeout: 10_000 });
    if (!new RegExp(`^${emulatorSerial}\\s+device\\b`, 'm').test(snapshot.devices)) {
      throw new Error(`ADB transport is not online for ${emulatorSerial}.`);
    }
    snapshot.probes = [];
    for (let index = 1; index <= 3; index += 1) {
      const echoNonce = `${nonce}-${index}`;
      for (const [probe, args, expected] of [
        ['shell-echo', ['-s', emulatorSerial, 'shell', 'echo', echoNonce], echoNonce],
        ['boot-property', ['-s', emulatorSerial, 'shell', 'getprop', 'sys.boot_completed'], '1'],
      ]) {
        const probeStarted = Date.now();
        const observation = { probe, attempt: index, startedAt: new Date().toISOString() };
        try {
          observation.output = rawCommandOutput('adb', args, { timeout: 8_000 });
          observation.durationMs = Date.now() - probeStarted;
          observation.result = observation.output === expected ? 'pass' : 'fail';
          if (observation.result === 'fail') observation.error = `Expected ${JSON.stringify(expected)}, received ${JSON.stringify(observation.output)}.`;
        } catch (error) {
          observation.durationMs = Date.now() - probeStarted;
          observation.result = 'fail';
          observation.timeout = error?.code === 'ETIMEDOUT';
          observation.error = String(error?.message ?? error);
        }
        snapshot.probes.push(observation);
      }
    }
    const hostProcesses = spawnSync('bash', ['-lc', 'ps -eo pid,stat,etime,args | grep -E "[e]mulator.*-avd|[q]emu-system.*-avd"'],
      { encoding: 'utf8', timeout: 5_000 });
    snapshot.hostEmulatorProcesses = (hostProcesses.stdout ?? '').trim();
    if (hostProcesses.error) snapshot.hostEmulatorProcessesError = hostProcesses.error.message;
    if (snapshot.probes.some(probe => probe.result !== 'pass')) throw new Error('One or more repeated ADB echo/getprop probes failed.');
    snapshot.result = 'pass';
  } catch (error) {
    snapshot.result = 'fail';
    snapshot.error = String(error?.stack ?? error);
    try { snapshot.devicesAfterFailure = rawCommandOutput('adb', ['devices', '-l'], { timeout: 5_000 }); } catch (nested) {
      snapshot.devicesError = nested.message;
    }
  }
  snapshot.durationMs = Date.now() - startedAt;
  snapshot.finishedAt = new Date().toISOString();
  (report.adbCanaries ??= []).push(snapshot);
  await writeFile(path.join(resultDirectory, `adb-canary-${stage}.json`), `${JSON.stringify(snapshot, null, 2)}\n`);
  if (snapshot.result !== 'pass') throw new Error(`ADB canary failed at ${stage}: ${snapshot.error}`);
  return snapshot;
}

async function captureStage(label, { requireWebContent = false } = {}) {
  const result = { label, capturedAt: new Date().toISOString() };
  result.diagnostics = {};
  const errors = [];
  try {
    result.nodes = await dumpUi(label);
    result.diagnostics.uiHierarchy = { result: 'pass', file: `ui-${label}.xml` };
  } catch (error) {
    result.diagnostics.uiHierarchy = { result: 'unavailable', error: String(error?.message ?? error) };
    errors.push(`UI hierarchy: ${error?.message ?? error}`);
  }
  try {
    result.screenshot = `screen-${label}.png`;
    result.screenshotMetadata = await captureScreen(label);
    result.diagnostics.screenshot = { result: result.screenshotMetadata.pngSignatureValid ? 'pass' : 'fail', file: result.screenshot };
    if (!result.screenshotMetadata.pngSignatureValid) errors.push('Screenshot: output did not have a valid PNG signature.');
  } catch (error) {
    result.diagnostics.screenshot = { result: 'unavailable', error: String(error?.message ?? error) };
    errors.push(`Screenshot: ${error?.message ?? error}`);
  }
  if (requireWebContent && result.nodes) {
    result.webContentVisible = result.nodes.some(node => node.text === 'Alpha' || node['content-desc'] === 'Alpha');
    if (!result.webContentVisible) errors.push('WebView readiness: Alpha was not exposed in the Android accessibility hierarchy.');
  }
  try {
    result.runtimeDiagnostics = await captureRuntimeDiagnostics(label);
    result.diagnostics.processCrashAndAnr = { result: 'pass', file: `runtime-diagnostics-${label}.json` };
  } catch (error) {
    result.diagnostics.processCrashAndAnr = { result: 'unavailable', error: String(error?.message ?? error) };
    errors.push(`Process/crash diagnostics: ${error?.message ?? error}`);
  }
  result.result = errors.length ? 'fail' : 'pass';
  if (errors.length) result.errors = errors;
  (report.stageCaptures ??= []).push(result);
  await writeFile(path.join(resultDirectory, `stage-${label}.json`), `${JSON.stringify(result, null, 2)}\n`);
  if (result.result !== 'pass') throw new Error(`Stage capture ${label} failed: ${errors.join('; ')}`);
  return result.nodes;
}

async function captureRuntimeDiagnostics(label) {
  const diagnostics = { label, capturedAt: new Date().toISOString(), commands: {} };
  const commands = {
    appPid: ['shell', 'sh', '-c', 'pidof com.smilodonnativeruntime || true'],
    processExitInfo: ['shell', 'dumpsys', 'activity', 'exit-info', 'com.smilodonnativeruntime'],
    lastAnr: ['shell', 'dumpsys', 'activity', 'lastanr'],
  };
  for (const [name, args] of Object.entries(commands)) {
    const startedAt = Date.now();
    try {
      diagnostics.commands[name] = {
        output: rawCommandOutput('adb', ['-s', emulatorSerial, ...args], { timeout: 10_000 }),
        durationMs: Date.now() - startedAt,
        result: 'pass',
      };
    } catch (error) {
      diagnostics.commands[name] = {
        durationMs: Date.now() - startedAt,
        result: 'unavailable',
        error: String(error?.message ?? error),
      };
    }
  }
  try {
    const hostProcesses = spawnSync('bash', ['-lc', 'ps -eo pid,stat,etime,args | grep -E "[e]mulator.*-avd|[q]emu-system.*-avd"'],
      { encoding: 'utf8', timeout: 5_000 });
    diagnostics.hostEmulatorProcesses = (hostProcesses.stdout ?? '').trim();
    if (hostProcesses.error) diagnostics.hostEmulatorProcessesError = hostProcesses.error.message;
  } catch (error) {
    diagnostics.hostEmulatorProcessesError = String(error?.message ?? error);
  }
  const crashBuffer = spawnSync('adb', ['-s', emulatorSerial, 'logcat', '-b', 'crash', '-d', '-t', '200'],
    { encoding: 'utf8', timeout: 10_000 });
  diagnostics.crashBuffer = crashBuffer.status === 0
    ? { result: 'pass', output: crashBuffer.stdout }
    : { result: 'unavailable', error: crashBuffer.error?.message ?? crashBuffer.stderr ?? String(crashBuffer.status) };
  await writeFile(path.join(resultDirectory, `runtime-diagnostics-${label}.json`), `${JSON.stringify(diagnostics, null, 2)}\n`);
  return diagnostics;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function runtimeEvent(logs, name, matchingText = '') {
  const lines = logs.split('\n').filter(line => line.includes(eventMarker(name)));
  return lines.find(line => line.includes(matchingText));
}

async function tapAndAssertEvent(button, event, expectedText = '', timeoutMs = 20_000) {
  const before = await runtimeLogs();
  const priorCount = before.split('\n').filter(line => line.includes(eventMarker(event))).length;
  await tapButton(button);
  await waitForLog(logs => {
    const lines = logs.split('\n').filter(line => line.includes(eventMarker(event)));
    return lines.length > priorCount && lines.some(line => line.includes(expectedText));
  }, `${event} ${expectedText}`, timeoutMs);
}

function recordCommandFailure(error) {
  const stdout = error?.stdout?.toString?.() ?? '';
  const stderr = error?.stderr?.toString?.() ?? '';
  if (stdout || stderr) {
    writeFile(path.join(resultDirectory, 'command-failure.log'), `${stdout}\n${stderr}`).catch(() => {});
  }
}

const originalBundle = await readFile(bundlePath);
const originalBundleStatus = commandOutput('git', ['status', '--porcelain=v1', '--', 'packages/react-native/src/generated/coreBundle.ts']);
if (originalBundleStatus !== '') {
  throw new Error('Refusing Android certification from a worktree where coreBundle.ts already has local changes.');
}

report = {
  directive: '178-F',
  harnessRevision: '178-F.1',
  baselineCommit: commandOutput('git', ['rev-parse', 'HEAD']),
  startedAt: new Date().toISOString(),
  status: 'running',
  toolchain: {
    node: process.version,
    npm: commandOutput('npm', ['--version']),
    java: commandOutput('java', ['--version']).split('\n').slice(0, 2),
    gradle: null,
    android: {},
    reactNative: '0.76.9',
    react: '18.3.1',
    webview: '13.12.5',
  },
  artifacts: {},
  checks: [],
  runId: runtimeId,
  stages: [],
};
function markStage(name) {
  const previous = report.stages.at(-1);
  if (previous && previous.status === 'running') {
    previous.status = 'pass';
    previous.finishedAt = new Date().toISOString();
  }
  currentStage = name;
  report.stages.push({ name, status: 'running', startedAt: new Date().toISOString() });
}

markStage('android-environment-preflight');

try {
  if (!process.env.ANDROID_HOME && !process.env.ANDROID_SDK_ROOT) {
    throw new Error('Android SDK environment variables are missing; Android runtime infrastructure was not established.');
  }
  if (report.toolchain.npm !== '10.8.2') {
    throw new Error(`Fixture lockfile is pinned to npm 10.8.2; found npm ${report.toolchain.npm}.`);
  }
  const devices = commandOutput('adb', ['devices', '-l']);
  if (!/\bdevice\b/.test(devices.split('\n').slice(1).join('\n'))) {
    throw new Error(`No booted Android emulator/device was found. adb devices output:\n${devices}`);
  }
  const androidSdkRoot = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT;
  const emulatorExecutable = path.join(androidSdkRoot, 'emulator', 'emulator');
  const emulatorPackageXml = await readFile(path.join(androidSdkRoot, 'emulator', 'package.xml'), 'utf8');
  const emulatorRevisionXml = emulatorPackageXml.match(/<revision>([\s\S]*?)<\/revision>/)?.[1];
  const emulatorRevision = emulatorRevisionXml && [...emulatorRevisionXml.matchAll(
    /<(major|minor|micro)>([^<]+)<\/\1>/g,
  )].map(([, field, value]) => `${field}=${value}`).join(', ');
  if (!emulatorRevision) throw new Error('Could not read the installed Android emulator package revision.');

  markStage('android-environment-capture');
  report.toolchain.android = {
    sdkRoot: androidSdkRoot,
    devices,
    apiLevel: adb('shell', 'getprop', 'ro.build.version.sdk'),
    release: adb('shell', 'getprop', 'ro.build.version.release'),
    manufacturer: adb('shell', 'getprop', 'ro.product.manufacturer'),
    model: adb('shell', 'getprop', 'ro.product.model'),
    product: adb('shell', 'getprop', 'ro.product.name'),
    abi: adb('shell', 'getprop', 'ro.product.cpu.abi'),
    fingerprint: adb('shell', 'getprop', 'ro.build.fingerprint'),
    webViewProvider: adb('shell', 'dumpsys', 'webviewupdate')
      .split('\n')
      .filter(line => /Current WebView|WebView package|webview provider/i.test(line)),
    screenSize: adb('shell', 'wm', 'size'),
    screenDensity: adb('shell', 'wm', 'density'),
    emulator: { executable: emulatorExecutable, packageRevision: emulatorRevision },
  };
  if (report.toolchain.android.apiLevel !== '35') {
    throw new Error(`Expected Android API 35, found ${report.toolchain.android.apiLevel}.`);
  }
  await writeFile(path.join(resultDirectory, 'emulator-boot.json'), `${JSON.stringify({
    stage: 'emulator-boot', status: 'pass', finishedAt: new Date().toISOString(),
    apiLevel: report.toolchain.android.apiLevel, release: report.toolchain.android.release,
    model: report.toolchain.android.model, emulator: report.toolchain.android.emulator,
  }, null, 2)}\n`);
  markStage('emulator-boot');
  await captureStage('after-boot');
  markStage('adb-health-pre-install');
  await adbCanary('pre-install');

  const gradleVersion = commandOutput('gradle', ['--version'], {
    cwd: path.join(root, 'tests/react-native-runtime/android'),
  });
  report.toolchain.gradle = gradleVersion.split('\n').filter(line => /Gradle |JVM:|Launcher JVM:/.test(line));
  await writeFile(path.join(resultDirectory, 'android-environment.json'), `${JSON.stringify(report.toolchain, null, 2)}\n`);

  markStage('package-build');
  console.log(`[178-F] ${currentStage}`);
  await run('npm', ['run', 'build', '-w', '@smilodon/core']);
  await run('npm', ['run', 'build', '-w', '@smilodon/react-native']);
  await run('npm', ['pack', '-w', '@smilodon/core', '--pack-destination', tarballDirectory]);
  await run('npm', ['pack', '-w', '@smilodon/react-native', '--pack-destination', tarballDirectory]);

  const packedFiles = await readdir(tarballDirectory);
  const coreTarball = path.join(tarballDirectory, packedFiles.find(file => file.startsWith('smilodon-core-')));
  const nativeTarball = path.join(tarballDirectory, packedFiles.find(file => file.startsWith('smilodon-react-native-')));
  report.artifacts.coreTarballSha256 = await sha256(coreTarball);
  report.artifacts.reactNativeTarballSha256 = await sha256(nativeTarball);

  markStage('packed-dependency-install');
  console.log(`[178-F] ${currentStage}`);
  await cp(path.join(root, 'tests/react-native-runtime'), fixtureDirectory, {
    recursive: true,
    filter: source => !source.split(path.sep).includes('node_modules') && !source.split(path.sep).includes('artifacts'),
  });
  await writeFile(path.join(fixtureDirectory, 'runtime-context.ts'), `export const runtimeId = ${JSON.stringify(runtimeId)};\n`);
  const appArtifactDirectory = path.join(fixtureDirectory, 'artifacts');
  await mkdir(appArtifactDirectory, { recursive: true });
  const fixtureCoreTarball = path.join(appArtifactDirectory, 'smilodon-core-1.10.0.tgz');
  const fixtureNativeTarball = path.join(appArtifactDirectory, 'smilodon-react-native-1.10.0.tgz');
  await cp(coreTarball, fixtureCoreTarball);
  await cp(nativeTarball, fixtureNativeTarball);

  const fixtureLockPath = path.join(fixtureDirectory, 'package-lock.json');
  const fixtureLock = JSON.parse(await readFile(fixtureLockPath, 'utf8'));
  const coreLockEntry = fixtureLock.packages?.['node_modules/@smilodon/core'];
  const nativeLockEntry = fixtureLock.packages?.['node_modules/@smilodon/react-native'];
  if (!coreLockEntry || !nativeLockEntry) {
    throw new Error('Fixture lockfile is missing a packed Core or React Native package entry.');
  }
  coreLockEntry.integrity = `sha512-${createHash('sha512').update(await readFile(fixtureCoreTarball)).digest('base64')}`;
  nativeLockEntry.integrity = `sha512-${createHash('sha512').update(await readFile(fixtureNativeTarball)).digest('base64')}`;
  await writeFile(fixtureLockPath, `${JSON.stringify(fixtureLock, null, 2)}\n`);

  await run('npm', ['ci', '--no-audit', '--no-fund'], { cwd: fixtureDirectory });
  const nativeEntry = commandOutput('node', [
    '--conditions=react-native',
    '--input-type=module',
    '-e',
    "process.stdout.write(import.meta.resolve('@smilodon/react-native'))",
  ], { cwd: fixtureDirectory });
  if (!nativeEntry.endsWith('/dist/index.native.js')) {
    throw new Error(`React Native package did not resolve its native entry: ${nativeEntry}`);
  }
  report.toolchain.installedPackages = Object.fromEntries(await Promise.all([
    '@smilodon/core',
    '@smilodon/react-native',
    'react',
    'react-native',
    'react-native-webview',
  ].map(async name => {
    const packagePath = path.join(fixtureDirectory, 'node_modules', name, 'package.json');
    const packageData = JSON.parse(await readFile(packagePath, 'utf8'));
    return [name, packageData.version];
  })));
  report.artifacts.nativeEntry = nativeEntry;
  report.artifacts.packageLockSha256 = await sha256(path.join(fixtureDirectory, 'package-lock.json'));
  report.checks.push({ name: 'packed-install-and-native-entry-resolution', result: 'pass' });

  markStage('android-build-and-install');
  console.log(`[178-F] ${currentStage} (x86_64 only)`);
  await run('gradle', [
    '--no-daemon',
    '--stacktrace',
    '-PreactNativeArchitectures=x86_64',
    ':app:installRelease',
  ], {
    cwd: path.join(fixtureDirectory, 'android'),
    logFile: gradleOutput,
  });
  report.checks.push({ name: 'android-release-bundle-build-and-install', result: 'pass' });
  markStage('adb-health-post-install');
  await adbCanary('post-install');
  await captureStage('after-install');

  markStage('app-launch-and-mount');
  console.log(`[178-F] ${currentStage}`);
  commandOutput('adb', ['logcat', '-c']);
  await startLogcatCollector();
  adb('shell', 'am', 'start', '-n', 'com.smilodonnativeruntime/.MainActivity');
  await waitForLog(logs => logs.includes(eventMarker('APP_MOUNTED')), 'native fixture app mount');
  await captureStage('after-mount');
  markStage('webview-readiness');
  await waitForLog(logs => logs.includes(eventMarker('SELECT_MOUNTED')), 'Select mount');
  const readinessDeadline = Date.now() + 30_000;
  let readyNodes = [];
  while (Date.now() < readinessDeadline) {
    readyNodes = await dumpUi('webview-readiness');
    if (readyNodes.some(node => node.text === 'Alpha' || node['content-desc'] === 'Alpha')) break;
    await delay(750);
  }
  if (!readyNodes.some(node => node.text === 'Alpha' || node['content-desc'] === 'Alpha')) {
    throw new Error('WebView readiness timed out: the initial Alpha item never appeared in Android accessibility.');
  }
  report.checks.push({ name: 'webview-ready-visible-in-accessibility-hierarchy', result: 'pass' });
  await captureStage('webview-ready', { requireWebContent: true });
  report.artifacts.memoryAfterInitialMount = await recordProcessMemory('initial-mount');
  await delay(4_000);

  markStage('bridge-isolated-canary');
  await tapAndAssertEvent('open', 'OPEN');
  await adbCanary('post-open');
  await captureStage('after-open', { requireWebContent: true });
  report.checks.push({
    name: 'isolated-android-bridge-canary-before-full-scenarios', result: 'pass',
    evidence: 'WebView accessibility readiness, unique-run Open callback, post-Open ADB transport canary, screenshot, hierarchy, process and crash diagnostics.',
  });
  markStage('bridge-full-scenarios');
  await tapAndAssertEvent('close', 'CLOSE');
  await tapAndAssertEvent('open', 'OPEN');
  await tapAndAssertEvent('clear', 'CHANGE', '"value":""');
  await tapSearchField();
  adb('shell', 'input', 'text', 'beta');
  await waitForLog(logs => runtimeEvent(logs, 'SEARCH', 'beta'), 'search callback for beta');
  const filteredNodes = await dumpUi('search-filtered');
  if (filteredNodes.some(node => node.text === 'Alpha' || node['content-desc'] === 'Alpha')) {
    throw new Error('Search for Beta left the Alpha option visible.');
  }
  if (!filteredNodes.some(node => node.text === 'Beta' || node['content-desc'] === 'Beta')) {
    throw new Error('Search for Beta did not expose the matching option to Android accessibility.');
  }
  await tapButton('clear-search');
  let clearedSearchNodes = [];
  for (let attempt = 0; attempt < 10; attempt += 1) {
    clearedSearchNodes = await dumpUi('search-cleared');
    if (clearedSearchNodes.some(node => node.text === 'Alpha' || node['content-desc'] === 'Alpha')) break;
    await delay(300);
  }
  if (!clearedSearchNodes.some(node => node.text === 'Alpha' || node['content-desc'] === 'Alpha')) {
    throw new Error('clearSearch did not restore the filtered Alpha option.');
  }
  await textNode('Beta');
  await waitForLog(logs => runtimeEvent(logs, 'CHANGE', '"value":"beta"'), 'controlled single selection');
  let logs = await runtimeLogs();
  if (!runtimeEvent(logs, 'SELECT', 'beta')) throw new Error('onSelect did not report the selected Beta item.');
  report.checks.push({ name: 'initialization-search-selection-controlled-state-and-callbacks', result: 'pass' });

  await tapButton('toggle-disabled');
  await delay(1_000);
  const disabledChangeCount = (await runtimeLogs())
    .split('\n').filter(line => line.includes(eventMarker('CHANGE'))).length;
  await tapButton('open');
  const disabledNodes = await dumpUi('disabled-state');
  const disabledOption = disabledNodes.find(node => node.text === 'Alpha' || node['content-desc'] === 'Alpha');
  if (disabledOption) {
    const { x, y } = boundsOf(disabledOption);
    adb('shell', 'input', 'tap', String(x), String(y));
    await delay(1_000);
  }
  logs = await runtimeLogs();
  const afterDisabledChangeCount = logs.split('\n').filter(line => line.includes(eventMarker('CHANGE'))).length;
  if (afterDisabledChangeCount !== disabledChangeCount) throw new Error('A disabled Select emitted an unexpected change callback.');
  report.checks.push({ name: 'disabled-state-suppresses-selection-change', result: 'pass' });
  await tapButton('toggle-disabled');
  await tapButton('close');

  await tapButton('toggle-multiple');
  await tapAndAssertEvent('open', 'OPEN');
  await textNode('Alpha');
  await waitForLog(logs => runtimeEvent(logs, 'CHANGE', '"value":["alpha"]'), 'first multiple selection');
  await textNode('Beta');
  await waitForLog(logs => runtimeEvent(logs, 'CHANGE', '"value":["alpha","beta"]'), 'second multiple selection');
  report.checks.push({ name: 'multiple-selection', result: 'pass' });

  await tapButton('close');
  await tapAndAssertEvent('set-items', 'SET_ITEMS');
  await tapAndAssertEvent('set-value', 'SET_VALUE', '["delta","epsilon"]');
  logs = await runtimeLogs();
  if (!runtimeEvent(logs, 'CHANGE', '"labels":["Delta","Epsilon"]')) {
    throw new Error('Imperative setValue did not synchronize the selected values through the bridge.');
  }
  await tapAndAssertEvent('clear', 'CHANGE', '"value":[]');
  await tapButton('clear-search');
  report.checks.push({ name: 'imperative-items-value-clear-and-clear-search', result: 'pass' });

  await tapButton('reconnect');
  await waitForLog(logs => logs.includes(eventMarker('SELECT_UNMOUNTED')), 'Select unmount');
  const bridgeEventCount = logs => logs.split('\n').filter(line =>
    /:(OPEN|CLOSE|SELECT|CHANGE|SEARCH|CLEAR|DIAGNOSTIC)\b/.test(line) && line.includes(`SMILODON_RUNTIME:${runtimeId}:`),
  ).length;
  const eventsAtUnmount = bridgeEventCount(await runtimeLogs());
  await dumpUi('unmounted');
  report.artifacts.memoryAfterUnmount = await recordProcessMemory('unmounted');
  await delay(600);
  logs = await runtimeLogs();
  if (bridgeEventCount(logs) !== eventsAtUnmount) {
    throw new Error('The old WebView emitted a bridge callback after Select teardown.');
  }
  await waitForLog(logs => logs.includes(eventMarker('SELECT_MOUNTED')), 'Select remount');
  await delay(4_000);
  report.artifacts.memoryAfterReconnect = await recordProcessMemory('reconnected');
  await tapAndAssertEvent('open', 'OPEN');
  await tapButton('close');
  report.checks.push({ name: 'teardown-reconnect-and-post-reconnect-bridge', result: 'pass' });

  await writeFile(path.join(resultDirectory, 'react-native-js-logcat.log'), await runtimeLogs());
  await writeFile(path.join(resultDirectory, 'device-ui-final.xml'), (await dumpUi('final')).map(node => JSON.stringify(node)).join('\n'));
  await captureScreen('final');
  report.status = 'pass';
  const completedStage = report.stages.at(-1);
  if (completedStage) {
    completedStage.status = 'pass';
    completedStage.finishedAt = new Date().toISOString();
  }
} catch (error) {
  report.status = 'fail';
  report.failureStage = currentStage;
  const failedStage = report.stages.at(-1);
  if (failedStage) {
    failedStage.status = 'fail';
    failedStage.finishedAt = new Date().toISOString();
    failedStage.error = String(error?.message ?? error);
  }
  report.failureCode = currentStage === 'app-launch-and-bridge-scenarios'
    ? 'ANDROID_RUNTIME_OBSERVABILITY_OR_BRIDGE_UNRESOLVED'
    : error?.code === 'ENOBUFS'
      ? 'TEST_HARNESS_SCREENSHOT_BUFFER_LIMIT'
    : undefined;
  report.failureOwnership = error?.code === 'ENOBUFS'
    ? 'test-harness-screenshot-capture'
    : currentStage.startsWith('android-environment')
    ? 'environment'
    : currentStage === 'emulator-boot'
      ? 'emulator-boot-or-stage-capture; requires evidence review'
    : currentStage === 'package-build'
      ? 'package-build-or-source'
      : currentStage === 'packed-dependency-install'
        ? 'dependency-compatibility-or-test-harness'
        : currentStage === 'android-build-and-install'
          ? 'android-build-environment-or-dependency-compatibility'
          : 'native-runtime-webview-bridge-or-test-harness; requires log review';
  report.failure = String(error?.stack ?? error);
  recordCommandFailure(error);
  try {
    await writeFile(path.join(resultDirectory, 'react-native-js-logcat-failure.log'), await runtimeLogs());
    await captureStage('failure');
  } catch {
    // Preserve the original infrastructure or test failure.
  }
} finally {
  await stopLogcatCollector();
  report.finishedAt = new Date().toISOString();
  await writeFile(path.join(resultDirectory, 'runtime-certification.json'), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(bundlePath, originalBundle);
  await rm(tempDirectory, { recursive: true, force: true });
}

if (report.status !== 'pass') {
  console.error(`Android native certification ${report.status}: ${report.failure ?? 'unknown failure'}`);
  process.exitCode = 1;
} else {
  console.log('Android native runtime certification passed.');
}
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
