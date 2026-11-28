/**
 * S5-P1R — Packed-install regression test (hardened).
 *
 * Origin: S5-P0 found the published tarball had NO usable entry points (root
 * manifest lacked module/types/exports; a clean install could not resolve
 * `@smilodon/angular`). S5-P1 fixed the packaging; its packed-install test was
 * accepted as a foundation but the Lead found THREE verification weaknesses
 * (F01/F02 + a weak repeat-pack check) that this S5-P1R revision corrects:
 *
 *   F01 (AOT resolution provenance) — the AOT consumer used to compile the
 *       component FROM THE REPO SOURCE DIR, so compile-time resolution could
 *       pick the workspace `dist` (via the S4 symlink) rather than the
 *       INSTALLED tarball. FIX (P1R-01/P1R-02): copy the consumer component into
 *       the isolated consumer project, put its tsconfig there, and prove via
 *       `ngc --traceResolution` that `@smilodon/angular` declarations come from
 *       the installed consumer's node_modules — not the repo/dist.
 *
 *   F02 (permissive ESM import catch) — ANY import exception other than
 *       ERR_MODULE_NOT_FOUND was treated as success. FIX (P1R-04): separate
 *       RESOLUTION validation (must resolve to the installed tarball, hard
 *       assert) from RUNTIME loading, which must either fully succeed OR fail
 *       with ONLY the known "@angular/compiler JIT unavailable" error — matched
 *       explicitly by message; any other exception fails the gate.
 *
 *   Repeat-pack (P1R-05) — the second tarball only checked 3 manifest fields.
 *       FIX: verify the 2nd tarball's export TARGETS exist inside it AND install
 *       it into a fresh consumer and resolve it (actual consumability).
 *
 *   P1R-03 — a NEGATIVE CONTROL: after a successful AOT against the installed
 *       tarball, sabotage a copy of the installed package (remove its
 *       declarations / break its exports) and prove the AOT gate FAILS — i.e.
 *       the gate is sensitive to losing the package's exports/declarations and
 *       is not a false positive.
 *
 * Everything runs READ-ONLY against the source tree: the only writes are inside
 * an OS temp dir. No production/core/dependency/version change.
 *
 * Prereq: `npm run build -w @smilodon/angular` (dist/ must exist).
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  rmSync,
  copyFileSync,
  statSync,
  lstatSync,
  mkdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(__dirname, '..', '..'); // packages/angular
const distDir = join(pkgRoot, 'dist');
const repoRoot = join(pkgRoot, '..', '..');
const consumerSrcDir = join(__dirname, '..', 'consumer'); // canonical component template
const ngcBin = join(repoRoot, 'node_modules', '@angular', 'compiler-cli', 'bundles', 'src', 'bin', 'ngc.js');

let failures = 0;
function check(name, condition, detail) {
  if (condition) console.log(`  \u2714 ${name}`);
  else {
    console.error(`  \u2716 ${name}${detail ? ' \u2014 ' + detail : ''}`);
    failures += 1;
  }
}
function fatal(msg) {
  console.error(`\n[packed-install] FATAL: ${msg}`);
  process.exit(1);
}
function walkFiles(dir, pre = '') {
  const out = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out.push(...walkFiles(p, pre + f + '/'));
    else out.push(pre + f);
  }
  return out;
}
/**
 * Run a command, return {status, stdout, stderr} without throwing.
 *
 * NOTE: `ngc --traceResolution` emits >1 MB on stdout. spawnSync's default
 * maxBuffer (1 MB) would SIGTERM the child mid-write, so we raise it here.
 */
function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, ...opts });
  return { status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

// ── 0. Preconditions ────────────────────────────────────────────────────────────
if (!existsSync(join(distDir, 'package.json'))) {
  fatal(`Built package missing at ${distDir} — run \`npm run build -w @smilodon/angular\` first.`);
}

const work = mkdtempSync(join(tmpdir(), 'smilodon-packed-'));
const consumerDir = join(work, 'consumer');
const consumerSrc = join(consumerDir, 'src'); // P1R-01: component lives INSIDE the consumer
console.log(`[packed-install] work dir: ${work}`);

// Common tsconfig for AOT (P1R-01: rootDir/file inside the isolated consumer).
function writeConsumerTsconfig(name, { rootDir, outDir, file }) {
  const cfg = {
    compileOnSave: false,
    compilerOptions: {
      baseUrl: '.',
      rootDir,
      outDir,
      declaration: false,
      downlevelIteration: true,
      experimentalDecorators: true,
      module: 'ES2022',
      moduleResolution: 'bundler',
      importHelpers: false,
      target: 'ES2022',
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      skipLibCheck: true,
      esModuleInterop: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      useDefineForClassFields: false,
    },
    angularCompilerOptions: {
      compilationMode: 'full',
      strictInjectionParameters: true,
      strictInputAccessModifiers: true,
      strictTemplates: true,
    },
    files: [file],
  };
  const p = join(consumerDir, name);
  writeFileSync(p, JSON.stringify(cfg, null, 2));
  return p;
}

try {
  // ── 1. Pack the built package ─────────────────────────────────────────────────
  console.log('[packed-install] packing (npm pack from package root)...');
  const packOut = execFileSync('npm', ['pack', '--silent'], { cwd: pkgRoot, encoding: 'utf8' }).trim();
  const producedName = packOut.split('\n').filter(Boolean).pop();
  const producedPath = join(pkgRoot, producedName);
  if (!existsSync(producedPath)) fatal(`npm pack did not produce ${producedPath}`);
  const tarballPath = join(work, 'smilodon-angular.tgz');
  copyFileSync(producedPath, tarballPath);
  rmSync(producedPath, { force: true });

  // ── 2. Inspect the tarball contents (P1-01 / P1-02) ────────────────────────────
  console.log('[packed-install] inspecting tarball contents...');
  const extractDir = join(work, 'extract');
  mkdirSync(extractDir, { recursive: true });
  execFileSync('tar', ['-xzf', tarballPath, '-C', extractDir], { cwd: work });
  const packedRoot = join(extractDir, 'package');
  const packedPkg = JSON.parse(readFileSync(join(packedRoot, 'package.json'), 'utf8'));

  check('packed root manifest declares `exports`', !!packedPkg.exports, JSON.stringify(packedPkg.exports));
  check('packed root manifest declares `module`', typeof packedPkg.module === 'string', packedPkg.module);
  check('packed root manifest declares `types`', typeof packedPkg.types === 'string', packedPkg.types);
  check('packed root manifest does NOT advertise `main` (ESM-only)', !('main' in packedPkg), packedPkg.main);
  const dotExport = packedPkg.exports && packedPkg.exports['.'];
  check('`. ` export has no `require` condition (ESM-only)', !!dotExport && !('require' in dotExport));

  const exportedTargets = new Set();
  if (dotExport && typeof dotExport === 'object') {
    for (const cond of Object.values(dotExport)) if (typeof cond === 'string') exportedTargets.add(cond);
  }
  if (typeof packedPkg.module === 'string') exportedTargets.add(packedPkg.module);
  if (typeof packedPkg.types === 'string') exportedTargets.add(packedPkg.types);
  for (const rel of exportedTargets) {
    const full = join(packedRoot, rel.replace(/^\.\//, ''));
    check(`exported path exists in tarball: ${rel}`, existsSync(full));
  }
  const packedFiles = walkFiles(packedRoot);
  check('tarball ships the FESM runtime bundle', packedFiles.some((f) => f.endsWith('.mjs') && f.includes('fesm')));
  check('tarball ships the flattened declarations', packedFiles.some((f) => f.endsWith('.d.ts')));

  const srcPkg = JSON.parse(readFileSync(join(pkgRoot, 'package.json'), 'utf8'));
  for (const k of ['module', 'types', 'exports', 'engines']) {
    check(`packed metadata agrees with source for \`${k}\``, JSON.stringify(srcPkg[k]) === JSON.stringify(packedPkg[k]));
  }

  // ── 3. Isolated consumer install ───────────────────────────────────────────────
  console.log('[packed-install] installing tarball into an isolated consumer project...');
  mkdirSync(consumerSrc, { recursive: true }); // P1R-01: consumer source dir INSIDE the project
  writeFileSync(
    join(consumerDir, 'package.json'),
    JSON.stringify({ name: 'packed-consumer', version: '0.0.0', type: 'module', private: true }, null, 2),
  );
  execFileSync(
    'npm',
    [
      'install',
      '--no-audit',
      '--no-fund',
      tarballPath,
      '@angular/core@21.2.26',
      '@angular/common@21.2.26',
      '@angular/compiler@21.2.26',
      '@angular/forms@21.2.26',
      '@angular/platform-browser@21.2.26',
      'zone.js@0.16.3',
      'rxjs@7.8.2',
      'jsdom@24.0.0',
    ],
    { cwd: consumerDir, stdio: 'inherit' },
  );

  const consumerCore = join(consumerDir, 'node_modules', '@smilodon', 'core');
  check('@smilodon/core peer is installed in the isolated consumer', existsSync(join(consumerCore, 'package.json')));
  const installedDir = join(consumerDir, 'node_modules', '@smilodon', 'angular');
  check('@smilodon/angular is installed (not symlinked to dist)', existsSync(installedDir) && statSync(installedDir).isDirectory() && !isSymlink(installedDir));

  const installedPkg = JSON.parse(readFileSync(join(installedDir, 'package.json'), 'utf8'));
  check('installed manifest has `module`', typeof installedPkg.module === 'string', installedPkg.module);
  check('installed manifest has `types`', typeof installedPkg.types === 'string', installedPkg.types);
  check('installed manifest has `.` export', !!(installedPkg.exports && installedPkg.exports['.']));

  // ── 4. ESM resolution + runtime loading (P1R-04: explicit, no broad swallow) ────
  // RESOLUTION must hard-succeed and point at the INSTALLED tarball. RUNTIME
  // loading must either fully succeed OR fail with ONLY the known Angular-JIT
  // error (matched by message); any other exception is a failure.
  console.log('[packed-install] verifying ESM resolution + runtime loading against the installed tarball...');
  const resolveScript = `
    const out = { resolved: null, required: null, runtime: null, error: null };
    try {
      out.resolved = import.meta.resolve('@smilodon/angular');
    } catch (e) { out.error = 'RESOLVE:' + (e.code || '') + ':' + e.message; }
    try {
      const { createRequire } = await import('node:module');
      const req = createRequire(process.cwd() + '/');
      out.required = req.resolve('@smilodon/angular');
    } catch (e) { out.error = (out.error ? out.error + ';' : '') + 'REQUIRE:' + (e.code || '') + ':' + e.message; }
    // Runtime load. Expected to succeed on a proper install; if it throws, we
    // classify it explicitly (never swallow arbitrary errors as success).
    if (!out.error) {
      try {
        const m = await import('@smilodon/angular');
        out.runtime = 'IMPORTED_KEYS=' + Object.keys(m || {}).join(',');
      } catch (e) {
        out.runtime = 'THREW:' + (e.code || e.name || 'Error') + ':' + String(e.message).split('\\n')[0];
      }
    }
    process.stdout.write('__RESULT__' + JSON.stringify(out));
  `;
  const esm = run('node', ['--input-type=module', '-e', resolveScript], { cwd: consumerDir });
  const marker = esm.stdout.indexOf('__RESULT__');
  if (marker < 0) fatal(`ESM probe produced no result. stdout=${esm.stdout}\nstderr=${esm.stderr}`);
  const esmResult = JSON.parse(esm.stdout.slice(marker + '__RESULT__'.length));

  // (P1R-04) Resolution: hard success + must point into the INSTALLED consumer.
  check('ESM resolution succeeded (no resolve error)', !esmResult.error, esmResult.error);
  check(
    'ESM resolved path points at the INSTALLED tarball (not repo/dist)',
    !!esmResult.resolved &&
      esmResult.resolved.includes('/consumer/node_modules/@smilodon/angular/') &&
      !esmResult.resolved.includes('/packages/angular/dist/'),
    esmResult.resolved,
  );
  check(
    'require.resolve points at the INSTALLED tarball',
    !!esmResult.required &&
      esmResult.required.includes(consumerDir) &&
      esmResult.required.includes('node_modules/@smilodon/angular'),
    esmResult.required,
  );
  // (P1R-04) Runtime loading: fully succeed, OR fail with ONLY the known JIT error.
  const KNOWN_JIT = /needs to be compiled using the JIT compiler|@angular\/compiler/i;
  const runtimeOk = typeof esmResult.runtime === 'string' && esmResult.runtime.startsWith('IMPORTED_KEYS=');
  const runtimeKnownJit = typeof esmResult.runtime === 'string' && esmResult.runtime.startsWith('THREW:') && KNOWN_JIT.test(esmResult.runtime);
  check(
    'ESM runtime load fully succeeded OR failed ONLY with the known Angular-JIT error (no broad swallow)',
    runtimeOk || runtimeKnownJit,
    esmResult.runtime,
  );

  // ── 5. AOT consumer, compiled FROM INSIDE the isolated project (P1R-01/P1R-02) ──
  // Copy the canonical component into the consumer's src dir so its imports
  // resolve from the consumer's node_modules (not the repo).
  const componentSrc = readFileSync(join(consumerSrcDir, 'consumer-app.component.ts'), 'utf8');
  const aotSourceFile = join(consumerSrc, 'consumer-app.component.ts');
  writeFileSync(aotSourceFile, componentSrc);

  const aotOut = join(consumerDir, '.aot-out');
  mkdirSync(aotOut, { recursive: true });
  const tsconfigPath = writeConsumerTsconfig('tsconfig.aot.json', {
    rootDir: './src',
    outDir: './.aot-out',
    file: './src/consumer-app.component.ts',
  });

  // (P1R-02) First compile WITH --traceResolution and CAPTURE the trace to prove
  // the declarations come from the installed tarball, not the repo.
  console.log('[packed-install] AOT-compiling with --traceResolution (provenance capture)...');
  const traced = run('node', [ngcBin, '-p', tsconfigPath, '--traceResolution'], { cwd: consumerDir });
  const traceBlob = (traced.stdout || '') + '\n' + (traced.stderr || '');
  check('AOT compilation (traced) succeeded', traced.status === 0, (traced.stderr || traced.stdout || '').slice(-600));

  // Find how '@smilodon/angular' was resolved in the trace.
  const installedMarker = join(consumerDir, 'node_modules', '@smilodon', 'angular');
  const repoDistMarker = join(pkgRoot, 'dist');
  const resolvedFromInstalled = traceBlob.includes(installedMarker);
  const resolvedFromRepoDist = traceBlob.includes(repoDistMarker);
  check(
    'traceResolution shows @smilodon/angular resolved from the INSTALLED consumer node_modules',
    resolvedFromInstalled,
    `expected to find ${installedMarker} in trace`,
  );
  check(
    'traceResolution shows @smilodon/angular did NOT resolve from the repo dist/',
    !resolvedFromRepoDist,
    `unexpectedly found repo dist (${repoDistMarker}) in trace`,
  );
  // Also assert the declarations entry the trace points at is the installed .d.ts.
  const installedDts = join(installedDir, 'dist', 'types', 'smilodon-angular.d.ts');
  check(
    'traceResolution references the installed declarations file',
    traceBlob.includes(installedDts),
    `expected to find ${installedDts} in trace`,
  );

  // Boot the AOT output through the TestBed under jsdom (runtime evidence).
  console.log('[packed-install] booting the AOT consumer (installed tarball) under jsdom...');
  const bootScript = `
    import { JSDOM } from 'jsdom';
    const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
    const { window } = dom;
    for (const k of ['window','document','HTMLElement','Element','customElements','Node','Event','CustomEvent','FocusEvent','MouseEvent','KeyboardEvent','MutationObserver','DocumentFragment','ShadowRoot','AbortController','AbortSignal']) globalThis[k] = window[k];
    globalThis.PointerEvent = window.PointerEvent ?? window.MouseEvent;
    globalThis.getComputedStyle = window.getComputedStyle.bind(window);
    globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
    globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
    if (!window.HTMLElement.prototype.scrollIntoView) window.HTMLElement.prototype.scrollIntoView = () => {};
    await import('zone.js');
    const { TestBed } = await import('@angular/core/testing');
    const { BrowserTestingModule, platformBrowserTesting } = await import('@angular/platform-browser/testing');
    const { DOCUMENT } = await import('@angular/common');
    const platform = platformBrowserTesting();
    TestBed.initTestEnvironment(BrowserTestingModule, platform, { teardown: { destroyAfterEach: true } });
    TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: document }] });
    const aotOut = ${JSON.stringify(aotOut)};
    const { ConsumerAppComponent } = await import(aotOut + '/consumer-app.component.js');
    const fixture = TestBed.createComponent(ConsumerAppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise(r => setTimeout(r, 80));
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.nativeElement;
    const reactive = host.querySelector('#reactive');
    const el = reactive && (reactive.tagName.toLowerCase() === 'enhanced-select' ? reactive : reactive.querySelector('enhanced-select'));
    let ok = true;
    if (!el) { console.error('no <enhanced-select> rendered'); ok = false; }
    else if (!el._config) { console.error('<enhanced-select> not configured by core'); ok = false; }
    else console.log('installed-package AOT consumer rendered + configured <enhanced-select> OK');
    fixture.destroy();
    process.exit(ok ? 0 : 1);
  `;
  const boot = run('node', ['--input-type=module', '-e', bootScript], { cwd: consumerDir });
  check('AOT consumer (installed tarball) rendered + configured <enhanced-select>', boot.status === 0, (boot.stderr || '').slice(-600));

  // ── 6. NEGATIVE CONTROL (P1R-03): sabotaging the installed package fails AOT ────
  // Copy the installed package to a scratch consumer, break its declarations +
  // exports, and confirm the SAME AOT compile FAILS — proving the gate is
  // sensitive to losing the package's exports/declarations (not a false positive).
  console.log('[packed-install] negative control: removing installed declarations must fail AOT...');
  const sabotageDir = join(work, 'consumer-sabotage');
  mkdirSync(join(sabotageDir, 'node_modules', '@smilodon'), { recursive: true });
  // Reuse the real node_modules for Angular, but replace @smilodon/angular with a
  // broken copy (declarations removed + exports stripped).
  copyDir(join(consumerDir, 'node_modules', '@angular'), join(sabotageDir, 'node_modules', '@angular'));
  copyDir(join(consumerDir, 'node_modules', 'zone.js'), join(sabotageDir, 'node_modules', 'zone.js'));
  copyDir(join(consumerDir, 'node_modules', 'rxjs'), join(sabotageDir, 'node_modules', 'rxjs'));
  copyDir(join(consumerDir, 'node_modules', 'tslib'), join(sabotageDir, 'node_modules', 'tslib'));
  copyDir(join(consumerDir, 'node_modules', '@smilodon', 'core'), join(sabotageDir, 'node_modules', '@smilodon', 'core'));
  const brokenAngular = join(sabotageDir, 'node_modules', '@smilodon', 'angular');
  copyDir(installedDir, brokenAngular);
  // Strip the declarations + exports to simulate a package that lost them.
  rmSync(join(brokenAngular, 'dist', 'types'), { recursive: true, force: true });
  const brokenPkg = JSON.parse(readFileSync(join(brokenAngular, 'package.json'), 'utf8'));
  delete brokenPkg.exports;
  delete brokenPkg.types;
  delete brokenPkg.module;
  writeFileSync(join(brokenAngular, 'package.json'), JSON.stringify(brokenPkg, null, 2));
  // A minimal package.json for the sabotage consumer + a copy of the source.
  writeFileSync(join(sabotageDir, 'package.json'), JSON.stringify({ name: 'sabotage', version: '0.0.0', type: 'module', private: true }, null, 2));
  mkdirSync(join(sabotageDir, 'src'), { recursive: true });
  writeFileSync(join(sabotageDir, 'src', 'consumer-app.component.ts'), componentSrc);
  const sabotageTsconfig = join(sabotageDir, 'tsconfig.aot.json');
  writeFileSync(
    sabotageTsconfig,
    JSON.stringify(
      {
        compileOnSave: false,
        compilerOptions: {
          baseUrl: '.',
          rootDir: './src',
          outDir: './.aot-out',
          declaration: false,
          downlevelIteration: true,
          experimentalDecorators: true,
          module: 'ES2022',
          moduleResolution: 'bundler',
          target: 'ES2022',
          lib: ['ES2022', 'DOM', 'DOM.Iterable'],
          skipLibCheck: true,
          esModuleInterop: true,
          strict: true,
          forceConsistentCasingInFileNames: true,
          useDefineForClassFields: false,
        },
        angularCompilerOptions: { compilationMode: 'full', strictTemplates: true },
        files: ['./src/consumer-app.component.ts'],
      },
      null,
      2,
    ),
  );
  const sabotage = run('node', [ngcBin, '-p', sabotageTsconfig], { cwd: sabotageDir });
  check(
    'NEGATIVE CONTROL: AOT FAILS against an installed package that lost its exports/declarations (P1R-03)',
    sabotage.status !== 0,
    'expected ngc to fail, but it succeeded',
  );

  // ── 7. Repeatable pack (P1R-05): 2nd tarball is CONSUMABLE, not just present ────
  console.log('[packed-install] repeating npm pack and verifying the 2nd artifact is consumable...');
  const pack2 = execFileSync('npm', ['pack', '--silent'], { cwd: pkgRoot, encoding: 'utf8' }).trim();
  const produced2 = pack2.split('\n').filter(Boolean).pop();
  const produced2Path = join(pkgRoot, produced2);
  const tarball2 = join(work, 'smilodon-angular-2.tgz');
  copyFileSync(produced2Path, tarball2);
  rmSync(produced2Path, { force: true });
  const extract2 = join(work, 'extract2');
  mkdirSync(extract2, { recursive: true });
  execFileSync('tar', ['-xzf', tarball2, '-C', extract2], { cwd: work });
  const packed2Root = join(extract2, 'package');
  const pkg2 = JSON.parse(readFileSync(join(packed2Root, 'package.json'), 'utf8'));
  // Manifest entry fields present.
  check('2nd pack carries entry points (P1R-05)', !!(pkg2.exports && pkg2.module && pkg2.types));
  // Every export target of the 2nd tarball exists physically inside it.
  const targets2 = new Set();
  const dot2 = pkg2.exports && pkg2.exports['.'];
  if (dot2 && typeof dot2 === 'object') for (const cond of Object.values(dot2)) if (typeof cond === 'string') targets2.add(cond);
  if (pkg2.module) targets2.add(pkg2.module);
  if (pkg2.types) targets2.add(pkg2.types);
  for (const rel of targets2) {
    check(`2nd pack exported path exists: ${rel}`, existsSync(join(packed2Root, rel.replace(/^\.\//, ''))));
  }
  // Actual consumability: install the 2nd tarball into a fresh consumer + resolve.
  const consumer2Dir = join(work, 'consumer2');
  mkdirSync(consumer2Dir, { recursive: true });
  writeFileSync(join(consumer2Dir, 'package.json'), JSON.stringify({ name: 'packed-consumer2', version: '0.0.0', type: 'module', private: true }, null, 2));
  execFileSync('npm', ['install', '--no-audit', '--no-fund', tarball2], { cwd: consumer2Dir, stdio: 'inherit' });
  const esm2 = run(
    'node',
    ['--input-type=module', '-e', "let u; try { u = import.meta.resolve('@smilodon/angular'); } catch (e) { console.error('RESOLVE_FAIL', e.code, e.message); process.exit(2);} console.log(u);"],
    { cwd: consumer2Dir },
  );
  check(
    '2nd pack is CONSUMABLE: clean install resolves @smilodon/angular (P1R-05)',
    esm2.status === 0 && esm2.stdout.includes('node_modules/@smilodon/angular/'),
    esm2.stderr || esm2.stdout,
  );
} finally {
  rmSync(work, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\n[packed-install] FAILED — ${failures} assertion(s) failed`);
  process.exit(1);
}
console.log('\n[packed-install] PASSED — packed tarball resolves + imports + serves a real AOT consumer, resolution provenance proven, negative control fails, repeat-pack consumable (P1-01..P1-05, P1-10, P1R-01..P1R-05)');

// ── helpers ─────────────────────────────────────────────────────────────────────
function isSymlink(p) {
  try {
    return lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
}
function copyDir(src, dst) {
  mkdirSync(dst, { recursive: true });
  for (const f of readdirSync(src)) {
    const s = join(src, f);
    const d = join(dst, f);
    if (statSync(s).isDirectory()) copyDir(s, d);
    else copyFileSync(s, d);
  }
}
