/**
 * S2-F04 — real Angular AOT consumer app component.
 *
 * This is NOT part of the library build. It is a minimal application component
 * that imports `@smilodon/angular` from the BUILT package (resolved via the
 * `@smilodon/angular` node_modules link → packages/angular → dist) and uses
 * `SmilodonSelectComponent` in its template with real input bindings.
 *
 * It is compiled AOT by `ngc` (see `tsconfig.consumer.json` + `run-consumer.mjs`)
 * to prove that a normal Angular application can consume the partial-compiled
 * library artifact without JIT. The compiled output is then bootstrapped with
 * the Angular TestBed under jsdom to verify the bindings actually reach the
 * `<enhanced-select>` element.
 */
import { Component } from '@angular/core';
import { SmilodonSelectComponent } from '@smilodon/angular';
import type { SmilodonSelectItem } from '@smilodon/angular';

@Component({
  selector: 'app-consumer',
  standalone: true,
  imports: [SmilodonSelectComponent],
  template: `
    <smilodon-select
      [items]="items"
      [value]="selected"
      [multiple]="false"
      [searchable]="true"
      placeholder="Pick one"
    ></smilodon-select>
  `,
})
export class ConsumerAppComponent {
  readonly items: SmilodonSelectItem[] = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Bravo' },
    { value: 'c', label: 'Charlie' },
  ];
  selected: Array<string | number> | null = ['b'];
}
