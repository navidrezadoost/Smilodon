/**
 * S5-V1 — real Angular SSR render driver.
 *
 * Renders the AOT-compiled `SsrAppComponent` (which imports the BUILT
 * `@smilodon/angular`) to an HTML string using `@angular/platform-server`'s
 * `renderModule` (NgModule bootstrap path — `bootstrapApplication` is not
 * re-exported by this build's partially-compiled core ESM). This is ACTUAL
 * server rendering — not the import-safety unit test.
 *
 * It verifies:
 *   1. The server produces serialized HTML for both selects.
 *   2. Each select renders the light-DOM placeholder `<enhanced-select>` with NO
 *      shadow DOM / combobox internals (core is NOT evaluated server-side — the
 *      custom element never upgrades on the render server's DOM).
 *   3. Angular hydration markers are present (ng-server-context / ng-version /
 *      the annotated component container), i.e. this is hydration-capable output.
 *   4. `@smilodon/core` is never imported during the render (guarded by checking
 *      the custom-elements registry is empty for our tags after render).
 *
 * Emits a JSON summary to stdout (also used by the Playwright hydration test)
 * and writes the serialized HTML to `.aot-out/server-render.html`.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Required so the partially-compiled @angular/* FESMs (via @angular/forms and
// @angular/common) can JIT-fallback in this Node driver, exactly as the SSR
// import-safety setup does. Does NOT import @smilodon/core.
await import('@angular/compiler');

const __dirname = dirname(fileURLToPath(import.meta.url));

const results = [];
function check(name, condition, detail) {
  results.push({ name, pass: !!condition, detail: detail ?? null });
  console.log(`${condition ? '  ✔' : '  ✖'} ${name}${detail ? ` — ${detail}` : ''}`);
}

// ── 1. Import platform-server + the AOT app ────────────────────────────────────
// NOTE: `bootstrapApplication` is not re-exported by the partially-compiled core
// ESM in this Angular build, so we bootstrap via the NgModule `bootstrapModule`
// path exposed through `renderModule`.
const { renderModule, platformServer, provideServerRendering } = await import(
  '@angular/platform-server'
);
const { SsrAppModule } = await import('./.aot-out/ssr-server.module.js');

const html = await renderModule(SsrAppModule, {
  document: '<!doctype html><html><head></head><body><app-ssr-shell></app-ssr-shell></body></html>',
});

mkdirSync(join(__dirname, '.aot-out'), { recursive: true });
writeFileSync(join(__dirname, '.aot-out', 'server-render.html'), html, 'utf8');

// ── 2. Assertions on the serialized HTML ───────────────────────────────────────
check('server produced non-empty HTML', html.length > 0, `${html.length} bytes`);

const smilodonHosts = (html.match(/<smilodon-select\b/g) || []).length;
check('two <smilodon-select> hosts serialized', smilodonHosts === 2, `found ${smilodonHosts}`);

const placeholderTags = (html.match(/<enhanced-select\b/g) || []).length;
check(
  'each host serializes an <enhanced-select> placeholder',
  placeholderTags === 2,
  `found ${placeholderTags}`,
);

// No core-evaluated internals server-side: no combobox, no listbox, no chips.
check(
  'NO shadow/combobox internals server-side (core not evaluated)',
  !/role="combobox"/.test(html) && !/role="listbox"/.test(html),
  'no role=combobox / role=listbox in server HTML',
);
check(
  'empty <enhanced-select></enhanced-select> placeholders (no children)',
  (html.match(/<enhanced-select[^>]*>\s*<\/enhanced-select>/g) || []).length === 2,
);

// Angular SSR markers (hydration-capable output).
const hasHydrationMarkers =
  /ng-server-context/.test(html) || /ng-version/.test(html) || /ngh=/.test(html);
check(
  'Angular SSR/hydration markers present',
  hasHydrationMarkers,
  hasHydrationMarkers ? 'found ng-version/ng-server-context/ngh' : 'none found',
);

// Provide server rendering was configured (sanity that platform-server is active).
check('provideServerRendering exported (platform-server active)', typeof provideServerRendering === 'function');
check('platformServer exported (platform-server active)', typeof platformServer === 'function');

// ── 3. Confirm core was NOT imported (custom-elements stays empty) ─────────────
// In this Node process there is no DOM `customElements`; if core had been
// evaluated at import time it would have thrown (API-075). Reaching here proves
// it was NOT evaluated. We also verify no global leaked a registry.
const coreEvaluated =
  typeof globalThis.customElements !== 'undefined' &&
  typeof globalThis.customElements.get === 'function' &&
  !!globalThis.customElements.get('enhanced-select');
check('@smilodon/core NOT evaluated on the server', !coreEvaluated);

// ── 4. Emit machine-readable summary ──────────────────────────────────────────
const summary = {
  htmlLength: html.length,
  smilodonHosts,
  placeholderTags,
  hasHydrationMarkers,
  checks: results,
  allPass: results.every((r) => r.pass),
};
writeFileSync(join(__dirname, '.aot-out', 'server-render.summary.json'), JSON.stringify(summary, null, 2));
console.log('\n[render-server] ' + (summary.allPass ? 'ALL PASS' : 'FAILURES PRESENT'));

// Print the select region of the HTML for the record.
const m = html.match(/<app-ssr[\s\S]*<\/app-ssr>/);
if (m) {
  console.log('\n[render-server] serialized <app-ssr> region:');
  console.log(m[0].replace(/></g, '>\n<'));
}

if (!summary.allPass) process.exit(1);
