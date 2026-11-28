/**
 * S2-F04 — AOT consumer verification runner.
 *
 * Proves that a NORMAL Angular application can consume the BUILT
 * `@smilodon/angular` artifact (partial-compiled by ng-packagr) with full AOT
 * compilation — no JIT — and that template input bindings actually reach the
 * real `<enhanced-select>` element.
 *
 * Flow:
 *   1. Compile `consumer-app.component.ts` with `ngc` (AOT, compilationMode: full)
 *      → `.aot-out/consumer-app.component.js`.
 *   2. Bring up jsdom, load zone.js, provide the browser APIs core needs.
 *   3. Dynamically import the AOT output (ESM) — it imports the BUILT
 *      `@smilodon/angular` (resolved via tests/consumer/node_modules → dist).
 *   4. Boot the component through the Angular TestBed, run change detection, and
 *      assert: (a) a real `<enhanced-select>` element is rendered, (b) `[items]`
 *      reached the element, (c) `[value]` selected the expected item, and (d) the
 *      placeholder/config flags applied.
 *
 * Exits non-zero on any assertion failure so it can be used as a CI gate.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, mkdirSync, rmSync, symlinkSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── 0. Local package links ─────────────────────────────────────────────────────
// Resolve `@smilodon/angular` to the BUILT dist (not the source) and
// `@smilodon/core` to its package, mimicking a real install so the consumer
// compiles/runs against the published artifact. `.aot-out` is cleared for a
// clean deterministic compile.
const consumerNodeModules = join(__dirname, 'node_modules', '@smilodon');
mkdirSync(consumerNodeModules, { recursive: true });
const distDir = join(__dirname, '..', '..', 'dist');
const coreDir = join(__dirname, '..', '..', '..', 'core');
if (!existsSync(join(distDir, 'package.json'))) {
  console.error('[consumer] Built package missing at packages/angular/dist — run `npm run build` first.');
  process.exit(1);
}
for (const [name, target] of [
  ['angular', distDir],
  ['core', coreDir],
]) {
  const link = join(consumerNodeModules, name);
  if (existsSync(link)) rmSync(link, { force: true });
  symlinkSync(target, link, 'dir');
}
rmSync(join(__dirname, '.aot-out'), { recursive: true, force: true });

// ── 1. AOT compile ─────────────────────────────────────────────────────────────
execFileSync(
  process.execPath,
  [join(__dirname, '../../../../node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js'), '-p', join(__dirname, 'tsconfig.consumer.json')],
  { stdio: 'inherit', cwd: __dirname },
);
console.log('[consumer] AOT compilation OK');

// ── 2. jsdom environment ───────────────────────────────────────────────────────
const { JSDOM } = await import('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});
const { window } = dom;
globalThis.window = window;
globalThis.document = window.document;
globalThis.HTMLElement = window.HTMLElement;
globalThis.customElements = window.customElements;
globalThis.Node = window.Node;
globalThis.Event = window.Event;
globalThis.CustomEvent = window.CustomEvent;
globalThis.MutationObserver = window.MutationObserver;
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
globalThis.DocumentFragment = window.DocumentFragment;
globalThis.ShadowRoot = window.ShadowRoot;
// Use the jsdom realm's AbortController/AbortSignal so `addEventListener(...,
// { signal })` accepts the signal (Node's global AbortSignal is a different
// realm and jsdom rejects it as "not of type AbortSignal").
globalThis.AbortController = window.AbortController;
globalThis.AbortSignal = window.AbortSignal;
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = () => {};
}

// ── 3. zone.js (Angular TestBed requires it) ────────────────────────────────────
// Load the core zone patches only. We intentionally skip `zone.js/testing`:
// its fake-async timer patching does not compose with the raw jsdom timer
// globals in this standalone runner, and we use real async (`whenStable()`),
// not `fakeAsync`/`waitForAsync`, so the testing helpers are not required.
await import('zone.js');

// ── 4. Boot through the Angular TestBed ─────────────────────────────────────────
const { TestBed } = await import('@angular/core/testing');
const { BrowserTestingModule, platformBrowserTesting } = await import('@angular/platform-browser/testing');
const { DOCUMENT } = await import('@angular/common');
const { ConsumerAppComponent } = await import('./.aot-out/consumer-app.component.js');

// Initialize the browser testing PLATFORM and hand it to the TestBed as the
// platform argument, so the platform injector (and its DOM `DOCUMENT`) exists
// when the test module is created.
const platform = platformBrowserTesting();

TestBed.initTestEnvironment(BrowserTestingModule, platform, {
  teardown: { destroyAfterEach: true },
});

// In this standalone (non-Karma) host, the platform's default document provider
// does not see the jsdom document, so provide `DOCUMENT` explicitly to the test
// module. This mirrors what `TestBed` would get from a real browser platform.
TestBed.configureTestingModule({
  providers: [{ provide: DOCUMENT, useValue: document }],
});

let failures = 0;
function check(name, condition) {
  if (condition) {
    console.log(`  ✔ ${name}`);
  } else {
    console.error(`  ✖ ${name}`);
    failures += 1;
  }
}

TestBed.runInInjectionContext(() => {});
const fixture = TestBed.createComponent(ConsumerAppComponent);
fixture.detectChanges();
// Allow the browser-deferred core load + async setSelectedValues to settle.
await fixture.whenStable();
await new Promise((r) => setTimeout(r, 50));
fixture.detectChanges();
await fixture.whenStable();

const hostEl = fixture.nativeElement;
const selectEl = hostEl.querySelector('enhanced-select');

check('a real <enhanced-select> element is rendered', !!selectEl);
check('the element was upgraded & configured by core', !!(selectEl && selectEl._config));

if (selectEl && selectEl._config) {
  const cfg = selectEl._config;
  check('[multiple]=false → selection.mode "single"', cfg.selection?.mode === 'single');
  check('[searchable]=true → config.searchable true', cfg.searchable === true);
  check('placeholder applied', cfg.placeholder === 'Pick one');

  // Items: core stores them in the item registry.
  const itemCount = selectEl._itemRegistry?.records?.length ?? -1;
  check('[items] reached the element (3 options)', itemCount === 3);

  // Value: the [value]="['b']" binding selected "b".
  const selected = selectEl.getSelectedValues?.() ?? [];
  check('[value]=["b"] selected value "b"', Array.isArray(selected) && selected.length === 1 && selected[0] === 'b');
}

fixture.destroy();

if (failures > 0) {
  console.error(`\n[consumer] FAILED — ${failures} assertion(s) failed`);
  process.exit(1);
}
console.log('\n[consumer] PASSED — AOT consumer verified the built package end-to-end');
