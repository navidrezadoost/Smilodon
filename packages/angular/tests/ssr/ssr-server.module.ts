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
  bootstrap: [SsrServerShellComponent],
})
export class SsrAppModule {}
