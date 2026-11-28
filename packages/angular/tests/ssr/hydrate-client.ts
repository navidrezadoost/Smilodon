/**
 * S5-V — real-browser hydration bootstrap (client entry).
 *
 * Compiled AOT (ngc) alongside the SSR fixture and bundled with esbuild into
 * `.aot-out/client-bundle.js`. Loaded in the browser AFTER the server-rendered
 * HTML (from `render-server.mjs`) is present in the document, it bootstraps the
 * SAME `SsrAppComponent` with client hydration enabled so we can verify ACTUAL
 * browser hydration of `SmilodonSelectComponent` — including the
 * `smilodon-select` host custom-element (tag-collision) upgrade.
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

import { Component, NgModule } from '@angular/core';
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
}
declare const window: HydrationWindow;

/**
 * Bootstraps the hydrated app onto the server-rendered document. Exposed state
 * on `window` so the Playwright test can deterministically await it and surface
 * any bootstrap rejection.
 */
async function bootstrap(): Promise<void> {
  try {
    await platformBrowser().bootstrapModule(SsrHydrateModule, {
      // Dev mode so Angular emits NG hydration-mismatch diagnostics we capture.
      ngZoneEventCoalescing: false,
    });
    window.__hydrated = true;
    window.__hydrateError = undefined;
  } catch (err) {
    window.__hydrateError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    throw err;
  }
}

void bootstrap();
