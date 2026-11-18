import { chmod, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

async function main() {
const sdk = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT;
if (!sdk) throw new Error('ANDROID_HOME and ANDROID_SDK_ROOT are both unset.');
const executable = path.join(sdk, 'emulator', 'emulator');
const realExecutable = `${executable}.178f2-real`;
const workspace = process.env.GITHUB_WORKSPACE ?? process.cwd();
const results = process.env.NATIVE_CERTIFICATION_RESULTS_DIR ?? path.join(workspace, 'test-results/react-native-runtime-comparison');
await mkdir(results, { recursive: true });
await copyFile(executable, realExecutable);
await chmod(realExecutable, 0o755);
const shim = `#!/bin/sh\nexec >> "${results}/emulator-supervisor-launch.log" 2>&1\nexec node "${workspace}/scripts/supervise-emulator-process.mjs" "${realExecutable}" "$@"\n`;
await writeFile(executable, shim);
await chmod(executable, 0o755);
const version = await readFile(path.join(sdk, 'emulator', 'package.xml'), 'utf8');
await writeFile(path.join(results, 'emulator-supervisor-install.json'), JSON.stringify({
  installedAt: new Date().toISOString(), executable, realExecutable,
  packageRevision: version.match(/<major>\s*(\d+)/)?.[1] ?? null,
  workspace, results,
}, null, 2) + '\n');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
