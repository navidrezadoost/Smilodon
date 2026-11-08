import { createHash } from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import process from 'node:process';
import { createWriteStream } from 'node:fs';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
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
const emulatorSerial = process.env.ANDROID_SERIAL ?? 'emulator-5554';

await mkdir(resultDirectory, { recursive: true });
await mkdir(tarballDirectory, { recursive: true });

function rawCommandOutput(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd ?? root,
    encoding: 'utf8',
    timeout: options.timeout ?? 30_000,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  }).trim();
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

function run(command, args, { cwd = root, logFile } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
    const output = createWriteStream(logFile ?? path.join(resultDirectory, 'certification-commands.log'), {
      flags: logFile ? 'w' : 'a',
    });
    child.stdout.on('data', chunk => {
      process.stdout.write(chunk);
      output.write(chunk);
    });
    child.stderr.on('data', chunk => {
      process.stderr.write(chunk);
      output.write(chunk);
    });
    child.on('error', error => {
      output.end();
      reject(error);
    });
    child.on('close', code => {
      output.end();
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
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
  });
  await writeFile(path.join(resultDirectory, `screen-${label}.png`), screenshot);
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
    logs = commandOutput('adb', ['logcat', '-d', '-v', 'brief']);
    if (predicate(logs)) return logs;
    await delay(500);
  }
  await writeFile(path.join(resultDirectory, 'logcat-timeout.log'), logs);
  throw new Error(`Timed out waiting for ${label}`);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function runtimeEvent(logs, name, matchingText = '') {
  const lines = logs.split('\n').filter(line => line.includes(`SMILODON_RUNTIME:${name}`));
  return lines.find(line => line.includes(matchingText));
}

async function tapAndAssertEvent(button, event, expectedText = '', timeoutMs = 20_000) {
  const before = commandOutput('adb', ['logcat', '-d', '-v', 'brief']);
  const priorCount = before.split('\n').filter(line => line.includes(`SMILODON_RUNTIME:${event}`)).length;
  await tapButton(button);
  await waitForLog(logs => {
    const lines = logs.split('\n').filter(line => line.includes(`SMILODON_RUNTIME:${event}`));
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

let report = {
  directive: '178-F',
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
};
let currentStage = 'android-environment-preflight';

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

  currentStage = 'android-environment-capture';
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

  const gradleVersion = commandOutput('./gradlew', ['--version'], {
    cwd: path.join(root, 'tests/react-native-runtime/android'),
  });
  report.toolchain.gradle = gradleVersion.split('\n').filter(line => /Gradle |JVM:|Launcher JVM:/.test(line));
  await writeFile(path.join(resultDirectory, 'android-environment.json'), `${JSON.stringify(report.toolchain, null, 2)}\n`);

  currentStage = 'package-build';
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

  currentStage = 'packed-dependency-install';
  console.log(`[178-F] ${currentStage}`);
  await cp(path.join(root, 'tests/react-native-runtime'), fixtureDirectory, {
    recursive: true,
    filter: source => !source.split(path.sep).includes('node_modules') && !source.split(path.sep).includes('artifacts'),
  });
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

  currentStage = 'android-build-and-install';
  console.log(`[178-F] ${currentStage} (x86_64 only)`);
  await run('./gradlew', [
    '--no-daemon',
    '--stacktrace',
    '-PreactNativeArchitectures=x86_64',
    ':app:installRelease',
  ], {
    cwd: path.join(fixtureDirectory, 'android'),
    logFile: gradleOutput,
  });
  report.checks.push({ name: 'android-release-bundle-build-and-install', result: 'pass' });

  currentStage = 'app-launch-and-bridge-scenarios';
  console.log(`[178-F] ${currentStage}`);
  await writeFile(path.join(resultDirectory, 'logcat-before-launch.log'), commandOutput('adb', ['logcat', '-c']));
  adb('shell', 'am', 'start', '-n', 'com.smilodonnativeruntime/.MainActivity');
  await waitForLog(logs => logs.includes('SMILODON_RUNTIME:APP_MOUNTED'), 'native fixture app mount');
  await waitForLog(logs => logs.includes('SMILODON_RUNTIME:SELECT_MOUNTED'), 'Select mount');
  await captureScreen('initial');
  report.artifacts.memoryAfterInitialMount = await recordProcessMemory('initial-mount');
  await delay(4_000);

  await tapAndAssertEvent('open', 'OPEN');
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
  let logs = commandOutput('adb', ['logcat', '-d', '-v', 'brief']);
  if (!runtimeEvent(logs, 'SELECT', 'beta')) throw new Error('onSelect did not report the selected Beta item.');
  report.checks.push({ name: 'initialization-search-selection-controlled-state-and-callbacks', result: 'pass' });

  await tapButton('toggle-disabled');
  await delay(1_000);
  const disabledChangeCount = commandOutput('adb', ['logcat', '-d', '-v', 'brief'])
    .split('\n').filter(line => line.includes('SMILODON_RUNTIME:CHANGE')).length;
  await tapButton('open');
  const disabledNodes = await dumpUi('disabled-state');
  const disabledOption = disabledNodes.find(node => node.text === 'Alpha' || node['content-desc'] === 'Alpha');
  if (disabledOption) {
    const { x, y } = boundsOf(disabledOption);
    adb('shell', 'input', 'tap', String(x), String(y));
    await delay(1_000);
  }
  logs = commandOutput('adb', ['logcat', '-d', '-v', 'brief']);
  const afterDisabledChangeCount = logs.split('\n').filter(line => line.includes('SMILODON_RUNTIME:CHANGE')).length;
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
  logs = commandOutput('adb', ['logcat', '-d', '-v', 'brief']);
  if (!runtimeEvent(logs, 'CHANGE', '"labels":["Delta","Epsilon"]')) {
    throw new Error('Imperative setValue did not synchronize the selected values through the bridge.');
  }
  await tapAndAssertEvent('clear', 'CHANGE', '"value":[]');
  await tapButton('clear-search');
  report.checks.push({ name: 'imperative-items-value-clear-and-clear-search', result: 'pass' });

  await tapButton('reconnect');
  await waitForLog(logs => logs.includes('SMILODON_RUNTIME:SELECT_UNMOUNTED'), 'Select unmount');
  const bridgeEventCount = logs => logs.split('\n').filter(line =>
    /SMILODON_RUNTIME:(OPEN|CLOSE|SELECT|CHANGE|SEARCH|CLEAR|DIAGNOSTIC)\b/.test(line),
  ).length;
  const eventsAtUnmount = bridgeEventCount(commandOutput('adb', ['logcat', '-d', '-v', 'brief']));
  await dumpUi('unmounted');
  report.artifacts.memoryAfterUnmount = await recordProcessMemory('unmounted');
  await delay(600);
  logs = commandOutput('adb', ['logcat', '-d', '-v', 'brief']);
  if (bridgeEventCount(logs) !== eventsAtUnmount) {
    throw new Error('The old WebView emitted a bridge callback after Select teardown.');
  }
  await waitForLog(logs => logs.includes('SMILODON_RUNTIME:SELECT_MOUNTED'), 'Select remount');
  await delay(4_000);
  report.artifacts.memoryAfterReconnect = await recordProcessMemory('reconnected');
  await tapAndAssertEvent('open', 'OPEN');
  await tapButton('close');
  report.checks.push({ name: 'teardown-reconnect-and-post-reconnect-bridge', result: 'pass' });

  await writeFile(path.join(resultDirectory, 'device-logcat.log'), commandOutput('adb', ['logcat', '-d', '-v', 'threadtime']));
  await writeFile(path.join(resultDirectory, 'device-ui-final.xml'), (await dumpUi('final')).map(node => JSON.stringify(node)).join('\n'));
  await captureScreen('final');
  report.status = 'pass';
} catch (error) {
  report.status = 'fail';
  report.failureStage = currentStage;
  report.failureOwnership = currentStage.startsWith('android-environment')
    ? 'environment'
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
    await writeFile(path.join(resultDirectory, 'device-logcat-failure.log'), commandOutput('adb', ['logcat', '-d', '-v', 'threadtime']));
    await captureScreen('failure');
  } catch {
    // Preserve the original infrastructure or test failure.
  }
} finally {
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
