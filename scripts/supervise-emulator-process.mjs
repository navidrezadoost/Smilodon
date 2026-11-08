import { spawn } from 'node:child_process';
import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

async function main() {
const [executable, ...args] = process.argv.slice(2);
const results = process.env.NATIVE_CERTIFICATION_RESULTS_DIR ?? path.join(process.env.GITHUB_WORKSPACE ?? process.cwd(), 'test-results/react-native-runtime-comparison');
await mkdir(results, { recursive: true });
const lifecyclePath = path.join(results, 'emulator-lifecycle.jsonl');
const stdoutPath = path.join(results, 'emulator-stdout.log');
const stderrPath = path.join(results, 'emulator-stderr.log');
const record = async event => appendFile(lifecyclePath, `${JSON.stringify({ at: new Date().toISOString(), supervisorPid: process.pid, ...event })}\n`);
const out = await import('node:fs').then(({ createWriteStream }) => createWriteStream(stdoutPath, { flags: 'a' }));
const err = await import('node:fs').then(({ createWriteStream }) => createWriteStream(stderrPath, { flags: 'a' }));
const child = spawn(executable, args, { stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
child.stdout.pipe(out);
child.stderr.pipe(err);
await record({ event: 'child-start', pid: child.pid, executable, args });
await writeFile(path.join(results, 'emulator-supervisor.json'), JSON.stringify({ supervisorPid: process.pid, childPid: child.pid, executable, args, startedAt: new Date().toISOString() }, null, 2) + '\n');
let stoppingSignal = null;
for (const signal of ['SIGTERM', 'SIGINT', 'SIGHUP']) process.on(signal, () => {
  stoppingSignal = signal;
  void record({ event: 'supervisor-signal', signal });
  if (child.pid) child.kill(signal);
});
const sample = async () => {
  const ps = spawn('ps', ['-eo', 'pid,ppid,pgid,stat,etime,args'], { stdio: ['ignore', 'pipe', 'ignore'] });
  let output = '';
  ps.stdout.on('data', chunk => { output += chunk; });
  ps.on('close', async code => {
    const rows = output.split('\n').filter(line => /qemu|emulator.*avd|emulator\.178f2-real/.test(line));
    await writeFile(path.join(results, 'emulator-process-tree-latest.txt'), output);
    await record({ event: 'process-sample', psExitCode: code, qemuRows: rows });
  });
};
const interval = setInterval(() => { void sample(); }, 1000);
child.on('error', async error => { await record({ event: 'child-error', error: String(error) }); });
child.on('close', async (exitCode, signal) => {
  clearInterval(interval);
  await record({ event: 'child-exit', pid: child.pid, exitCode, signal, stoppingSignal });
  process.exitCode = exitCode ?? (signal ? 1 : 0);
  out.end();
  err.end();
});
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
