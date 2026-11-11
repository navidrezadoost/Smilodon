import { spawnSync } from 'node:child_process';
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

async function main() {
  const root = process.cwd();
  const results = path.resolve(process.env.NATIVE_CERTIFICATION_RESULTS_DIR ?? path.join(root, 'test-results/react-native-runtime-comparison'));
  const lifecyclePath = path.join(results, 'emulator-lifecycle.jsonl');
  await mkdir(results, { recursive: true });
  const readEvents = async () => (await readFile(lifecyclePath, 'utf8').catch(() => ''))
    .split('\n').filter(Boolean).map(line => { try { return JSON.parse(line); } catch { return null; } }).filter(Boolean);
  let events = await readEvents();
  const launch = events.find(event => event.event === 'child-start' && event.args?.includes('-avd'));
  if (launch) {
    const deadline = Date.now() + 20_000;
    while (Date.now() < deadline && !events.some(event => event.event === 'child-exit' && event.pid === launch.pid)) {
      await new Promise(resolve => setTimeout(resolve, 250));
      events = await readEvents();
    }
  }
  const exit = launch && events.find(event => event.event === 'child-exit' && event.pid === launch.pid);
  const ps = spawnSync('ps', ['-eo', 'pid,ppid,pgid,stat,etime,args'], { encoding: 'utf8', timeout: 10_000 });
  const processTree = ps.stdout ?? '';
  await writeFile(path.join(results, 'emulator-process-tree-final.txt'), processTree);
  const qemuRows = processTree.split('\n').filter(line => /qemu-system|supervise-emulator-process/.test(line));
  const result = {
    finalizedAt: new Date().toISOString(),
    runnerOutcome: process.env.EMULATOR_OUTCOME ?? 'unknown',
    emulatorStarted: Boolean(launch),
    emulatorPid: launch?.pid ?? null,
    emulatorArgs: launch?.args ?? null,
    exitEventCaptured: Boolean(exit),
    exitCode: exit?.exitCode ?? null,
    signal: exit?.signal ?? null,
    remainingEmulatorProcesses: qemuRows,
    lifecycleEventCount: events.length,
    limitation: exit ? null : launch ? 'The supervised emulator child did not emit an exit event within the 20 second finalization window.' : 'No main emulator child-start event was recorded.',
  };
  await writeFile(path.join(results, 'emulator-termination.json'), `${JSON.stringify(result, null, 2)}\n`);
  await appendFile(lifecyclePath, `${JSON.stringify({ at: result.finalizedAt, event: 'workflow-finalized', ...result })}\n`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
