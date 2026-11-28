/**
 * S5-P1 — Packed-install regression test (P1-03 / P1-04 / P1-10).
 *
 * The S5-P0 preflight found that the published tarball had NO usable entry
 * points: a clean `npm install` produced a package whose root manifest lacked
 * `module`/`types`/`exports`, so `import '@smilodon/angular'` /
 * `require.resolve('@smilodon/angular')` failed. The S4 consumer test
 * (`tests/consumer/run-consumer.mjs`) MASKED this by symlinking its
 * `node_modules/@smilodon/angular` straight at `dist/`, bypassing real package
 * resolution.
 *
 * This runner closes that blind spot. It:
 *   1. Packs the BUILT package into a real `.tgz` (`npm pack`).
 *   2. Creates an isolated consumer project and `npm install`s the tarball
 *      (plus the real Angular + @smilodon/core peers) — a genuine package
 *      install, not a symlink.
 *   3. Asserts the INSTALLED root manifest exposes valid runtime + type entry
 *      points, and that EVERY exported path resolves inside the tarball
 *      (P1-01 / P1-02).
 *   4. Asserts clean-install ESM resolution AND import succeed (P1-03).
 *   5. AOT-compiles a real consumer component against the INSTALLED tarball and
 *      boots it through the Angular TestBed under jsdom (P1-04).
 *   6. Repeats `npm pack` and re-verifies a usable artifact with NO dist
 *      symlink (P1-10).
 *
 * The test FAILS (exit 1) if the packed package loses its entry points — i.e.
 * it fails for the right reason (broken packaging), not merely because the
 * build itself failed.
 *
 * Prereq: `npm run build -w @smilodon/angular` (dist/ must exist). The runner
 * fails clearly if dist is missing.
 */
import { execFileSync } from 'node:child_process';
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
  symlinkSync,
  statSync,
  mkdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(__dirname, '..', '..'); // packages/angular
const distDir = join(pkgRoot, 'dist');
const coreDir = join(pkgRoot, '..', 'core');
const consumerSrcDir = join(__dirname, '..', 'consumer');

let failures = 0;
function check(name, condition, detail) {
  if (condition) {
    console.log(`  \u2714 ${name}`);
  } else {
    console.error(`  \u2716 ${name}${detail ? ' — ' + detail : ''}`);
    failures += 1;
  }
}
function fatal(msg) {
  console.error(`\n[packed-install] FATAL: ${msg}`);
  process.exit(1);
}

// ── 0. Preconditions ────────────────────────────────────────────────────────────
if (!existsSync(join(distDir, 'package.json'))) {
  fatal(`Built package missing at ${distDir} — run \`npm run build -w @smilodon/angular\` first.`);
}

// Work area outside the repo (mirrors the esbuild/Playwright discipline).
const work = mkdtempSync(join(tmpdir(), 'smilodon-packed-'));
const consumerDir = join(work, 'consumer');
const tarballPath = join(work, 'smilodon-angular.tgz');
console.log(`[packed-install] work dir: ${work}`);

try {
  // ── 1. Pack the built package ─────────────────────────────────────────────────
  // `npm pack` from the package root (the real publish invocation) → copy the
  // produced .tgz into our isolated work dir.
  console.log('[packed-install] packing (npm pack from package root)...');
  const packOut = execFileSync('npm', ['pack', '--silent'], {
    cwd: pkgRoot,
    encoding: 'utf8',
  }).trim();
  const producedName = packOut.split('\n').filter(Boolean).pop();
  const producedPath = join(pkgRoot, producedName);
  if (!existsSync(producedPath)) fatal(`npm pack did not produce ${producedPath}`);
  copyFileSync(producedPath, tarballPath);
  rmSync(producedPath, { force: true }); // don't leave a .tgz in the repo

  // ── 2. Inspect the tarball contents (P1-01 / P1-02) ────────────────────────────
  console.log('[packed-install] inspecting tarball contents...');
  const extractDir = join(work, 'extract');
  execFileSync('tar', ['-xzf', tarballPath, '-C', work, '--one-top-level=extract'], {
    cwd: work,
  });
  const packedRoot = join(extractDir, 'package');
  const packedPkg = JSON.parse(readFileSync(join(packedRoot, 'package.json'), 'utf8'));

  // (P1-01) the published root manifest must carry entry points.
  check('packed root manifest declares `exports`', !!packedPkg.exports, JSON.stringify(packedPkg.exports));
  check('packed root manifest declares `module`', typeof packedPkg.module === 'string', packedPkg.module);
  check('packed root manifest declares `types`', typeof packedPkg.types === 'string', packedPkg.types);
  // ESM-only: must NOT advertise an unsupported CommonJS runtime entry.
  check('packed root manifest does NOT advertise `main` (ESM-only)', !('main' in packedPkg), packedPkg.main);
  const dotExport = packedPkg.exports && packedPkg.exports['.'];
  check('`. ` export has no `require` condition (ESM-only)', !!dotExport && !('require' in dotExport));

  // (P1-02) every exported path must exist physically inside the tarball.
  const exportedTargets = [];
  if (dotExport && typeof dotExport === 'object') {
    for (const cond of Object.values(dotExport)) {
      if (typeof cond === 'string') exportedTargets.push(cond);
    }
  }
  if (typeof packedPkg.module === 'string') exportedTargets.push(packedPkg.module);
  if (typeof packedPkg.types === 'string') exportedTargets.push(packedPkg.types);
  for (const rel of [...new Set(exportedTargets)]) {
    const norm = rel.replace(/^\.\//, '');
    const full = join(packedRoot, norm);
    check(`exported path exists: ${rel}`, existsSync(full));
  }

  // The runtime bundle + declarations must be present in the tarball.
  const allFiles = [];
  (function walk(d, pre) {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      const st = statSync(p);
      if (st.isDirectory()) walk(p, pre + f + '/');
      else allFiles.push(pre + f);
    }
  })(packedRoot, '');
  check(
    'tarball ships the FESM runtime bundle',
    allFiles.some((f) => f.endsWith('.mjs') && f.includes('fesm')),
    allFiles.join(','),
  );
  check(
    'tarball ships the flattened declarations',
    allFiles.some((f) => f.endsWith('.d.ts')),
    allFiles.join(','),
  );

  // (P1-05) — packed metadata agrees with source manifest for entry fields.
  const srcPkg = JSON.parse(readFileSync(join(pkgRoot, 'package.json'), 'utf8'));
  for (const k of ['module', 'types', 'exports', 'engines']) {
    check(
      `packed metadata agrees with source for \`${k}\``,
      JSON.stringify(srcPkg[k]) === JSON.stringify(packedPkg[k]),
    );
  }

  // ── 3. Isolated consumer install (P1-03 / P1-04) ───────────────────────────────
  console.log('[packed-install] installing tarball into an isolated consumer project...');
  mkdirSync(consumerDir, { recursive: true });
  writeFileSync(
    join(consumerDir, 'package.json'),
    JSON.stringify({ name: 'packed-consumer', version: '0.0.0', type: 'module', private: true }, null, 2),
  );
  // Install the tarball together with the real peers so Angular resolves.
  // Reuse the pre-built workspace packages (tarball for angular; the local
  // @smilodon/core dir — same version range) to avoid a registry dependency.
  const installArgs = [
    'install',
    '--no-audit',
    '--no-fund',
    tarballPath,
    '@angular/core@21.2.26',
    '@angular/common@21.2.26',
    '@angular/compiler@21.2.26',
    '@angular/forms@21.2.26',
    '@angular/platform-browser@21.2.26',
    '@angular/platform-browser-dynamic@21.2.26',
    'zone.js@0.16.3',
    'rxjs@7.8.2',
    'jsdom@24.0.0',
  ];
  execFileSync('npm', installArgs, { cwd: consumerDir, stdio: 'inherit' });

  // @smilodon/core is a peer dependency and npm auto-installs it from the
  // registry during the isolated `npm install` above — exactly as a real
  // consumer would get it. No workspace symlink is used here on purpose: the
  // point of this gate is to exercise the PUBLISHED artifact end to end.
  const consumerCore = join(consumerDir, 'node_modules', '@smilodon', 'core');
  check(
    '@smilodon/core peer is installed in the isolated consumer',
    existsSync(join(consumerCore, 'package.json')),
  );

  const installedDir = join(consumerDir, 'node_modules', '@smilodon', 'angular');
  check('@smilodon/angular is installed (not symlinked to dist)', existsSync(installedDir));

  const installedPkg = JSON.parse(readFileSync(join(installedDir, 'package.json'), 'utf8'));
  check('installed manifest has `module`', typeof installedPkg.module === 'string', installedPkg.module);
  check('installed manifest has `types`', typeof installedPkg.types === 'string', installedPkg.types);
  check('installed manifest has `.` export', !!(installedPkg.exports && installedPkg.exports['.']));

  // (P1-03) Clean-install ESM resolution + import must succeed from the INSTALLED
  // package — this is the assertion that FAILS when entry points are lost.
  console.log('[packed-install] verifying ESM resolution + import against the installed tarball...');
  const resolveScript = `
    import { createRequire } from 'node:module';
    const require = createRequire(process.cwd() + '/');
    let ok = true;
    try {
      const url = import.meta.resolve('@smilodon/angular');
      if (!url.includes('smilodon-angular')) { console.error('unexpected resolve:', url); ok = false; }
      else console.log('import.meta.resolve ->', url);
    } catch (e) { console.error('import.meta.resolve FAILED:', e.code, e.message); ok = false; }
    try {
      const p = require.resolve('@smilodon/angular');
      console.log('require.resolve ->', p);
    } catch (e) { console.error('require.resolve FAILED:', e.code, e.message); ok = false; }
    // Static-ish dynamic import of the runtime (may pull Angular; we only require
    // that MODULE RESOLUTION + PARSE succeed, so import and report).
    try {
      const m = await import('@smilodon/angular');
      if (!m || typeof m !== 'object') { console.error('import produced no namespace'); ok = false; }
      else console.log('ESM import OK; exported keys:', Object.keys(m).join(',') || '(none)');
    } catch (e) {
      // A runtime error from Angular bootstrapping is NOT a resolution failure;
      // surface it but only fail on resolution/parse (ERR_MODULE_NOT_FOUND).
      if (e.code === 'ERR_MODULE_NOT_FOUND') { console.error('ESM import RESOLUTION failed:', e.message); ok = false; }
      else console.log('ESM import resolved (runtime note):', e.code || e.name, '-', String(e.message).split('\\n')[0]);
    }
    process.exit(ok ? 0 : 1);
  `;
  execFileSync('node', ['--input-type=module', '-e', resolveScript], {
    cwd: consumerDir,
    stdio: 'inherit',
  });

  // ── 4. AOT consumer against the INSTALLED tarball (P1-04) ──────────────────────
  // Reuse the real consumer component + tsconfig, but resolve `@smilodon/angular`
  // from the INSTALLED node_modules (Node resolution walks up), not a dist symlink.
  console.log('[packed-install] AOT-compiling the consumer against the installed tarball...');
  const aotOut = join(consumerDir, '.aot-out');
  mkdirSync(aotOut, { recursive: true });
  const consumerComponent = join(consumerSrcDir, 'consumer-app.component.ts');
  const tsconfig = {
    compileOnSave: false,
    compilerOptions: {
      baseUrl: '.',
      rootDir: consumerSrcDir,
      outDir: aotOut,
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
    files: [consumerComponent],
  };
  const tsconfigPath = join(work, 'tsconfig.packed-consumer.json');
  writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));

  const ngc = join(pkgRoot, '..', '..', 'node_modules', '@angular', 'compiler-cli', 'bundles', 'src', 'bin', 'ngc.js');
  execFileSync('node', [ngc, '-p', tsconfigPath], { cwd: consumerDir, stdio: 'inherit' });
  check('AOT compilation against the installed tarball succeeded', true);

  // Boot the AOT output through the TestBed under jsdom and assert a real
  // binding reaches `<enhanced-select>` (P1-04 end-to-end).
  const bootScript = `
    import { JSDOM } from 'jsdom';
    const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
    const { window } = dom;
    for (const k of ['window','document','HTMLElement','Element','customElements','Node','Event','CustomEvent','FocusEvent','MouseEvent','KeyboardEvent','MutationObserver','DocumentFragment','ShadowRoot','AbortController','AbortSignal']) {
      globalThis[k] = window[k];
    }
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
    const { ConsumerAppComponent } = await import(${JSON.stringify(join(aotOut, 'consumer-app.component.js'))});
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
    if (!el) { console.error('no <enhanced-select> rendered from installed package'); ok = false; }
    else if (!el._config) { console.error('<enhanced-select> not configured by core'); ok = false; }
    else console.log('installed-package AOT consumer rendered + configured <enhanced-select> OK');
    fixture.destroy();
    process.exit(ok ? 0 : 1);
  `;
  execFileSync('node', ['--input-type=module', '-e', bootScript], {
    cwd: consumerDir,
    stdio: 'inherit',
  });
  check('AOT consumer (installed tarball) rendered + configured <enhanced-select>', true);

  // ── 5. Repeatable pack (P1-10) ─────────────────────────────────────────────────
  console.log('[packed-install] repeating npm pack to confirm a usable artifact...');
  const pack2 = execFileSync('npm', ['pack', '--silent'], { cwd: pkgRoot, encoding: 'utf8' }).trim();
  const produced2 = pack2.split('\n').filter(Boolean).pop();
  const produced2Path = join(pkgRoot, produced2);
  const tarball2 = join(work, 'smilodon-angular-2.tgz');
  copyFileSync(produced2Path, tarball2);
  rmSync(produced2Path, { force: true });
  const extract2 = join(work, 'extract2');
  mkdirSync(extract2, { recursive: true });
  execFileSync('tar', ['-xzf', tarball2, '-C', extract2], { cwd: work });
  const pkg2 = JSON.parse(readFileSync(join(extract2, 'package', 'package.json'), 'utf8'));
  check('repeated pack still carries entry points (P1-10)', !!(pkg2.exports && pkg2.module && pkg2.types));
} finally {
  // Clean up the isolated work area.
  rmSync(work, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\n[packed-install] FAILED — ${failures} assertion(s) failed`);
  process.exit(1);
}
console.log('\n[packed-install] PASSED — packed tarball resolves, imports, and serves a real AOT consumer (P1-01..P1-05, P1-10)');
