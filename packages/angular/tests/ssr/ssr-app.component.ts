/**
 * S5-V — real Angular SSR/hydration fixture component.
 *
 * This is NOT part of the library build. It is a minimal application component
 * (compiled AOT by ngc against the BUILT `@smilodon/angular` package, resolved
 * via the tests/ssr/node_modules link → packages/angular/dist) used to prove
 * ACTUAL server rendering and browser hydration of `SmilodonSelectComponent`.
 *
 * It intentionally exercises BOTH the standalone (event-bridged) path and the
 * reactive-forms path so the SSR/hydration verification can check:
 *   - the server-serialized light-DOM placeholder,
 *   - absence of server-side core evaluation (no shadow DOM on the server),
 *   - the host custom-element (tag-collision) upgrade observed after hydration,
 *   - inputs / selection / typed events after hydration,
 *   - reactive forms initial `writeValue` with no programmatic echo.
 *
 * The two selects:
 *   - `#plain`   : [items] + (change) — standalone event-bridged select.
 *   - `#reactive`: [formControl] — reactive single select (initial value 'b').
 *
 * The component is STANDALONE so it can be reused by BOTH the server-side
 * `SsrAppModule` (which adds `ServerModule`) and the browser-side
 * `SsrHydrateModule` (which adds `BrowserModule` + client hydration) without
 * being declared by two NgModules (which ngc rejects).
 */
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SmilodonSelectComponent } from '@smilodon/angular';
import type { SmilodonSelectItem, ChangeEventDetail } from '@smilodon/angular';

export const SSR_ITEMS: SmilodonSelectItem[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Bravo' },
  { value: 'c', label: 'Charlie' },
];

@Component({
  selector: 'app-ssr',
  standalone: true,
  imports: [SmilodonSelectComponent, ReactiveFormsModule],
  template: `
    <smilodon-select
      id="plain"
      [items]="items"
      placeholder="Pick one"
      (change)="onChange($event)"
    ></smilodon-select>

    <smilodon-select
      id="reactive"
      [items]="items"
      [formControl]="ctrl"
    ></smilodon-select>
  `,
})
export class SsrAppComponent {
  readonly items: SmilodonSelectItem[] = SSR_ITEMS;
  /** Reactive single-select starting on 'b' (applied via writeValue). */
  readonly ctrl = new FormControl<string | number | null>('b');
  /** Last forwarded (change) detail from `#plain`. */
  lastChange: ChangeEventDetail | null = null;

  onChange(detail: ChangeEventDetail): void {
    this.lastChange = detail;
  }
}
