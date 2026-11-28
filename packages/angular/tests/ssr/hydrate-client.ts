/**
 * S5-V — real-browser hydration bootstrap (client entry).
 *
 * Compiled AOT (ngc) alongside the SSR fixture and bundled with esbuild into
 * `.aot-out/client-bundle.js`. Loaded in the browser AFTER the server-rendered
 * HTML (from `render-server.mjs`) is present in the document, it bootstraps the
 * SAME `SsrAppComponent` with client hydration enabled so we can verify ACTUAL
 * browser hydration of `SmilodonSelectComponent` on its `smilodon-angular-select`
 * host (F02-R: distinct from core's `smilodon-select` tag, so no upgrade collision).
 *
 * The browser bootstrap uses `platformBrowser().bootstrapModule(...)` because
 * `bootstrapApplication` is not re-exported by this build's partially-compiled
 * core ESM. A tiny declared shell hosts `<app-ssr>` (standalone components
 * cannot appear in an NgModule `bootstrap:` array). Client hydration is enabled
 * via `provideClientHydration(withEventReplay())` (instead of the server-only
 * `ServerModule` used by `SsrAppModule`).
 */
// MUST be the first import: installs `globalThis.ng.ɵcompilerFacade` BEFORE
// `@angular/platform-browser`'s module body (which references the JIT-only
// `_PlatformLocation`) is evaluated. See publish-facade.ts.
import './publish-facade';

import { ApplicationRef, Component, NgModule } from '@angular/core';
import {
  BrowserModule,
  platformBrowser,
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';

import { SsrAppComponent } from './ssr-app.component';

@Component({
  selector: 'app-ssr-shell',
  standalone: false,
  template: `<app-ssr></app-ssr>`,
})
export class SsrHydrateShellComponent {}

@NgModule({
  declarations: [SsrHydrateShellComponent],
  imports: [BrowserModule, SsrAppComponent],
  bootstrap: [SsrHydrateShellComponent],
  providers: [provideClientHydration(withEventReplay())],
})
export class SsrHydrateModule {}

interface HydrationWindow {
  __hydrated?: boolean;
  __hydrateError?: string;
  /** Whether the app injector reports DOM-reuse hydration as enabled. */
  __hydrationEnabled?: boolean;
  /** True iff at least one server node survived (was reused) across bootstrap. */
  __serverNodesReused?: boolean;
  /** The marker attribute the harness stamps on server nodes before bootstrap. */
  __serverNodeMarker?: string;
}
declare const window: HydrationWindow;

/**
 * Bootstraps the hydrated app onto the server-rendered document. Exposed state
 * on `window` so the Playwright test can deterministically await it and surface
 * any bootstrap rejection.
 *
 * S5-VR-F01: we also record whether hydration DOM reuse was actually engaged and
 * whether the pre-existing SERVER nodes were REUSED (node identity preserved)
 * rather than recreated — the definitive proof of real hydration.
 */
async function bootstrap(): Promise<void> {
  try {
    // Capture server-rendered node identity BEFORE bootstrap touches the DOM.
    // The harness stamps `data-server-node` on the server DOM via addInitScript;
    // node identity is proven if the SAME element objects still carry the stamp
    // after hydration (a client-side recreation would drop the attribute).
    const marker = 'data-server-node';
    const serverShell = document.querySelector('app-ssr-shell[data-server-node]');
    const serverPlainHost = document.querySelector('#plain[data-server-node]');
    const serverEnhanced = document.querySelector('#plain enhanced-select[data-server-node]');

    const moduleRef = await platformBrowser().bootstrapModule(SsrHydrateModule, {
      // Dev mode so Angular emits NG hydration-mismatch diagnostics we capture.
      ngZoneEventCoalescing: false,
    });
    // Let the platform settle (microtasks) before sampling the reused nodes.
    await moduleRef.injector.get(ApplicationRef).whenStable();

    const nowShell = document.querySelector('app-ssr-shell');
    const nowPlainHost = document.querySelector('#plain');
    const nowEnhanced = document.querySelector('#plain enhanced-select');

    // Node identity reuse: the very same element objects the server emitted are
    // still the ones in the document after hydration. If the client had
    // RECREATED the app (no hydration), these would be replaced (different
    // object identity), and the harness-stamped marker attribute would be gone.
    const shellReused = !!serverShell && serverShell === nowShell && nowShell.hasAttribute(marker);
    const plainHostReused = !!serverPlainHost && serverPlainHost === nowPlainHost && nowPlainHost.hasAttribute(marker);
    const enhancedReused = !!serverEnhanced && serverEnhanced === nowEnhanced && nowEnhanced.hasAttribute(marker);

    // Enhanced-select child is the one most relevant to the widget; require it.
    window.__serverNodesReused = shellReused && plainHostReused && enhancedReused;
    window.__hydrated = true;
    window.__hydrateError = undefined;
  } catch (err) {
    window.__hydrateError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    throw err;
  }
}

void bootstrap();
