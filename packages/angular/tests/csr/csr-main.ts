/**
 * S5-Q — Final Angular qualification: CSR (client-side only) browser bootstrap.
 *
 * Compiled AOT (ngc) alongside `csr-app.component.ts` and bundled with esbuild
 * into `.aot-csr/csr-bundle.js`. Loaded in a real browser against a bare HTML
 * document (no server markup) it bootstraps `CsrAppComponent` client-side — the
 * pure-CSR shape (no SSR, no hydration) that Q-01/Q-04..Q-10 exercise.
 *
 * Because the build's partially-compiled @angular/* FESMs reference the JIT-only
 * `_PlatformLocation`, the compiler facade MUST be published before
 * `@angular/platform-browser` is evaluated — hence the first import.
 */
// MUST be the first import (installs globalThis.ng.ɵcompilerFacade).
import '../ssr/publish-facade';

import { Component, NgModule } from '@angular/core';
import { BrowserModule, platformBrowser } from '@angular/platform-browser';

import { CsrAppComponent } from './csr-app.component';

@Component({
  selector: 'app-csr-shell',
  standalone: false,
  template: `<app-csr></app-csr>`,
})
export class CsrShellComponent {}

@NgModule({
  declarations: [CsrShellComponent],
  imports: [BrowserModule, CsrAppComponent],
  bootstrap: [CsrShellComponent],
})
export class CsrModule {}

interface CsrWindow {
  __csrBooted?: boolean;
  __csrBootError?: string;
}

declare const window: CsrWindow;

async function bootstrap(): Promise<void> {
  try {
    await platformBrowser().bootstrapModule(CsrModule, {
      ngZoneEventCoalescing: false,
    });
    window.__csrBooted = true;
  } catch (err) {
    window.__csrBootError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    // eslint-disable-next-line no-console
    console.error('[csr] bootstrap failed', err);
    throw err;
  }
}

void bootstrap();
