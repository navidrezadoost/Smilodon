/**
 * S2-F04 / S4 — AOT consumer verification runner.
 *
 * Proves that a NORMAL Angular application can consume the BUILT
 * `@smilodon/angular` artifact (partial-compiled by ng-packagr) with full AOT
 * compilation — no JIT — and that:
 *
 *   - (S2/S3) template input bindings + the typed `(change)` output reach the
 *     real `<enhanced-select>` element, and the built package loads core via the
 *     browser-deferred dynamic import;
 *   - (S4) the component works as a real Angular `ControlValueAccessor` with
 *     `FormControl`, `formControlName` (in a `FormGroup`), and `[(ngModel)]`:
 *     values applied by the form (via `writeValue`) reach the element WITHOUT
 *     echoing back into the model, and a genuine user edit updates the form
 *     model EXACTLY once. (S4-R) Touched is the focus-loss boundary of the
 *     whole control, NOT the selection change: a bare user edit does NOT mark
 *     the control touched; moving focus out of the control marks it touched
 *     exactly once.
 *
 * Flow:
 *   1. Compile `consumer-app.component.ts` with `ngc` (AOT, compilationMode: full)
 *      → `.aot-out/consumer-app.component.js`.
 *   2. Bring up jsdom, load zone.js, provide the browser APIs core needs.
 *   3. Dynamically import the AOT output (ESM) — it imports the BUILT
 *      `@smilodon/angular` (resolved via tests/consumer/node_modules → dist).
 *   4. Boot the component through the Angular TestBed, run change detection, and
 *      assert the S2/S3/S4 behaviors end-to-end.
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
globalThis.Element = window.Element;
globalThis.customElements = window.customElements;
globalThis.Node = window.Node;
globalThis.Event = window.Event;
globalThis.CustomEvent = window.CustomEvent;
globalThis.FocusEvent = window.FocusEvent;
globalThis.MouseEvent = window.MouseEvent;
globalThis.KeyboardEvent = window.KeyboardEvent;
globalThis.PointerEvent = window.PointerEvent ?? window.MouseEvent;
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

const wait = (ms = 50) => new Promise((r) => setTimeout(r, ms));

/** Select the element by its host `id` and return the inner `<enhanced-select>`. */
function selectById(root, id) {
  const host = root.querySelector(`#${id}`);
  if (!host) return null;
  if (host.tagName.toLowerCase() === 'enhanced-select') return host;
  return host.querySelector('enhanced-select');
}

/**
 * Drive a real user selection: open the listbox and click the option at `index`
 * inside the component's shadow DOM. (Click-only works for selection under
 * jsdom; the core selection path fires exactly one `change` per click.)
 */
function clickOption(selectEl, index) {
  selectEl.open?.();
  const option = selectEl.shadowRoot?.querySelector(`[data-index="${index}"]`);
  if (!option) return false;
  option.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  return true;
}

const selected = (el) => el?.getSelectedValues?.() ?? [];

/**
 * Simulate the user moving focus OUT of a form control to elsewhere on the page
 * (S4-R touched boundary). We build a fresh outside element as the focus
 * destination and dispatch a bubbling `focusout` on the control's HOST (the
 * `<smilodon-select>` element, which is where core listens for focus changes).
 * The `relatedTarget` points OUTSIDE the control → the accessor treats this as a
 * whole-control focus-loss and fires `onTouched` exactly once.
 */
function focusOut(selectEl) {
  const outside = document.createElement('button');
  document.body.appendChild(outside);
  selectEl.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }));
  outside.remove();
}

// Initialize the app fixture (this runs `writeValue` for forms controls during
// the first change detection; `ngAfterViewInit` installs listeners + probes).
TestBed.runInInjectionContext(() => {});
const fixture = TestBed.createComponent(ConsumerAppComponent);
const cmp = fixture.componentInstance;
fixture.detectChanges();
await fixture.whenStable();
await wait(50);
fixture.detectChanges();
await fixture.whenStable();

const hostEl = fixture.nativeElement;
const reactiveEl = selectById(hostEl, 'reactive');
const groupedEl = selectById(hostEl, 'grouped');
const templateEl = selectById(hostEl, 'template');
const eventedEl = selectById(hostEl, 'evented');

// ── A. Element rendering + core upgrade ────────────────────────────────────────
check('a real <enhanced-select> element is rendered', !!reactiveEl);
check(
  'all four selects were upgraded & configured by core',
  [reactiveEl, groupedEl, templateEl, eventedEl].every((el) => !!(el && el._config)),
);

// ── B. S2 input bindings ────────────────────────────────────────────────────────
if (reactiveEl && reactiveEl._config) {
  const cfg = reactiveEl._config;
  check('[searchable]=true → config.searchable true (reactive)', cfg.searchable === true);
  check('placeholder applied (reactive)', cfg.placeholder === 'Pick one');
  const itemCount = reactiveEl._itemRegistry?.records?.length ?? -1;
  check('[items] reached the element (3 options)', itemCount === 3);
  check('[multiple]=false → single-select (reactive)', cfg.selection?.mode === 'single');
  check('[multiple]=true → multi-select (evented)', eventedEl?._config?.selection?.mode === 'multi');
}

// ── C. S4 — form WRITE reaches the element without echoing into the model ──────
// FormControl initial value 'b' must be applied to the element via writeValue.
check('[formControl] initial "b" applied to element', JSON.stringify(selected(reactiveEl)) === '["b"]');
check('[formControl] model value still "b" (writeValue did not echo)', cmp.singleControl.value === 'b');
// The key anti-echo proof: NO valueChanges entry was emitted for the initial
// writeValue — the reactive model is unchanged by programmatic init.
check(
  '[formControl] init writeValue produced NO valueChanges (no echo)',
  cmp.singleValueChanges.length === 0,
);

// formControlName in a FormGroup: multi initial ['a'] applied.
check(
  '[formControlName] group.multi initial ["a"] applied to element',
  JSON.stringify(selected(groupedEl)) === '["a"]',
);
check('[formControlName] group.multi model still ["a"]', JSON.stringify(cmp.group.get('multi').value) === '["a"]');

// Template-driven ngModel initial 'c' applied to element.
check('[ngModel] initial "c" applied to element', JSON.stringify(selected(templateEl)) === '["c"]');
check('[ngModel] model value still "c" (no echo)', cmp.ngModelValue === 'c');

// ── D. S4 — a genuine user edit updates the form model exactly once ────────────
// Reactive single: click option 0 ("a"). single-select defaults closeOnSelect,
// so the single click selects "a" and closes.
cmp.singleValueChanges.length = 0;
clickOption(reactiveEl, 0);
await fixture.whenStable();
await wait(50);
fixture.detectChanges();
await fixture.whenStable();

check('[formControl] user click → model becomes "a"', cmp.singleControl.value === 'a');
check(
  '[formControl] user click → valueChanges emitted EXACTLY once with "a"',
  cmp.singleValueChanges.length === 1 && cmp.singleValueChanges[0] === 'a',
);
check('[formControl] user click → element shows "a"', JSON.stringify(selected(reactiveEl)) === '["a"]');
// S4-R: a selection alone does NOT mark the control touched.
check('[formControl] user click alone does NOT mark touched (S4-R)', cmp.singleControl.touched === false);
// Focus-loss of the whole control marks it touched exactly once.
focusOut(reactiveEl);
await fixture.whenStable();
fixture.detectChanges();
await fixture.whenStable();
check('[formControl] focus-loss marks control TOUCHED (S4-R)', cmp.singleControl.touched === true);
check('[formControl] focus-loss does NOT re-emit onChange', cmp.singleValueChanges.length === 1);

// formControlName in FormGroup: multi click option 1 ("b") → model ['a','b'].
const groupedBefore = JSON.stringify(cmp.group.get('multi').value);
clickOption(groupedEl, 1);
await fixture.whenStable();
await wait(50);
fixture.detectChanges();
await fixture.whenStable();

check(
  '[formControlName] user click → group.multi accumulates ["a","b"]',
  JSON.stringify(cmp.group.get('multi').value) === '["a","b"]',
);
check(
  '[formControlName] group.multi model changed from its initial value',
  groupedBefore === '["a"]',
);
// S4-R: selection alone does NOT touch; focus-loss of the whole control does.
check('[formControlName] user click alone does NOT mark touched (S4-R)', cmp.group.get('multi').touched === false);
focusOut(groupedEl);
await fixture.whenStable();
fixture.detectChanges();
await fixture.whenStable();
check('[formControlName] focus-loss marks control TOUCHED (S4-R)', cmp.group.get('multi').touched === true);

// Template-driven ngModel: click option 0 ("a") → ngModelValue becomes "a".
clickOption(templateEl, 0);
await fixture.whenStable();
await wait(50);
fixture.detectChanges();
await fixture.whenStable();

check('[ngModel] user click → ngModelValue becomes "a"', cmp.ngModelValue === 'a');
// S4-R: selection alone does NOT touch; focus-loss of the whole control does.
check('[ngModel] user click alone does NOT mark touched (S4-R)', cmp.templateModel?.touched === false);
focusOut(templateEl);
await fixture.whenStable();
fixture.detectChanges();
await fixture.whenStable();
check('[ngModel] focus-loss marks control TOUCHED (S4-R)', cmp.templateModel?.touched === true);

// ── E. S3 — typed (change) output on a NON-form controlled component ───────────
// The `#evented` component is controlled via [value]="['b']" and forwards (change).
check('[value] selected "b" on #evented', JSON.stringify(selected(eventedEl)) === '["b"]');
cmp.lastChange = null;
clickOption(eventedEl, 0); // select "a" (multi → ['b','a'])
await fixture.whenStable();
await wait(50);
fixture.detectChanges();
await fixture.whenStable();

check(
  '(change) output forwarded a real interaction to the AOT consumer',
  !!cmp.lastChange &&
    Array.isArray(cmp.lastChange.selectedValues) &&
    cmp.lastChange.selectedValues.length === 2 &&
    cmp.lastChange.selectedValues.includes('a') &&
    cmp.lastChange.selectedValues.includes('b'),
);

fixture.destroy();

if (failures > 0) {
  console.error(`\n[consumer] FAILED — ${failures} assertion(s) failed`);
  process.exit(1);
}
console.log(
  '\n[consumer] PASSED — AOT consumer verified the built package end-to-end (S2 inputs, S3 output, S4 forms + S4-R focus-loss touched)',
);
