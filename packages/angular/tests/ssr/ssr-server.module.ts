/**
 * S5-V — server bootstrap module for the SSR render fixture.
 *
 * `bootstrapApplication` is not re-exported by this build's partially-compiled
 * core ESM, so the fixture bootstraps via `@angular/platform-server`'s
 * `renderModule()` (NgModule bootstrap path). Because a standalone component
 * cannot appear in an NgModule `bootstrap:` array, we use a tiny declared shell
 * that hosts `<app-ssr>`; the shell imports the standalone `SsrAppComponent`.
 */
import { Component, NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';
import { provideClientHydration } from '@angular/platform-browser';
import { SsrAppComponent } from './ssr-app.component';

@Component({
  selector: 'app-ssr-shell',
  standalone: false,
  template: `<app-ssr></app-ssr>`,
})
export class SsrServerShellComponent {}

@NgModule({
  declarations: [SsrServerShellComponent],
  imports: [ServerModule, SsrAppComponent],
  // S5-VR-F01: hydration must be enabled on the SERVER as well as the client.
  // `provideClientHydration()` sets the server-side
  // `ɵIS_HYDRATION_DOM_REUSE_ENABLED` flag that causes platform-server to run
  // `ɵannotateForHydration` during serialization, emitting `ngh` node
  // annotations + the `<!--nghm-->` SSR content-integrity marker. Without it the
  // server HTML is NOT hydration-annotated and the client silently recreates the
  // app instead of reusing the server DOM (the F01 defect).
  //
  // NOTE: the server deliberately does NOT add `withEventReplay()` — event replay
  // is a client-only concern; its providers are client-specific and interfere
  // with server-side annotation. The CLIENT entry (`hydrate-client.ts`) uses
  // `provideClientHydration(withEventReplay())` as the real hydration shape.
  providers: [provideClientHydration()],
  bootstrap: [SsrServerShellComponent],
})
export class SsrAppModule {}
