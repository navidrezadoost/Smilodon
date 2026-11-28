/**
 * S2-F04 / S4 — real Angular AOT consumer app component.
 *
 * This is NOT part of the library build. It is a minimal application component
 * that imports `@smilodon/angular` from the BUILT package (resolved via the
 * `@smilodon/angular` node_modules link → packages/angular → dist) and uses
 * `SmilodonSelectComponent` in its template with real input bindings, the S3
 * typed `(change)` output, AND (S4) real Angular forms integration:
 *
 *   - `#reactive`    : single-select bound via `[formControl]`         (reactive)
 *   - `#grouped`     : multi-select bound via `formControlName` in a   (reactive)
 *                      `FormGroup`
 *   - `#template`    : single-select bound via `[(ngModel)]`           (template-driven)
 *   - `#evented`     : plain component, controlled via `[value]` and the
 *                      S3 `(change)` output (NOT a form control)
 *
 * It is compiled AOT by `ngc` (see `tsconfig.consumer.json` + `run-consumer.mjs`)
 * to prove that a normal Angular application can consume the partial-compiled
 * library artifact without JIT, including the `NG_VALUE_ACCESSOR` provider, and
 * that form values round-trip end-to-end through the real
 * `<enhanced-select>` element. The compiled output is then bootstrapped with the
 * Angular TestBed under jsdom by `run-consumer.mjs`.
 */
import { Component, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { SmilodonSelectComponent } from '@smilodon/angular';
import type { SmilodonSelectItem, ChangeEventDetail } from '@smilodon/angular';

export const CONSUMER_ITEMS: SmilodonSelectItem[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Bravo' },
  { value: 'c', label: 'Charlie' },
];

@Component({
  selector: 'app-consumer',
  standalone: true,
  imports: [SmilodonSelectComponent, ReactiveFormsModule, FormsModule],
  template: `
    <smilodon-angular-select
      id="reactive"
      [items]="items"
      [formControl]="singleControl"
      [searchable]="true"
      placeholder="Pick one"
    ></smilodon-angular-select>

    <form [formGroup]="group">
      <smilodon-angular-select
        id="grouped"
        [items]="items"
        [multiple]="true"
        formControlName="multi"
        placeholder="Pick many"
      ></smilodon-angular-select>
    </form>

    <smilodon-angular-select
      id="template"
      [items]="items"
      [(ngModel)]="ngModelValue"
      [ngModelOptions]="{ standalone: true }"
      placeholder="Template driven"
      #templateModel="ngModel"
    ></smilodon-angular-select>

    <smilodon-angular-select
      id="evented"
      [items]="items"
      [value]="eventedValue"
      [multiple]="true"
      (change)="onChange($event)"
    ></smilodon-angular-select>
  `,
})
export class ConsumerAppComponent {
  readonly items: SmilodonSelectItem[] = CONSUMER_ITEMS;

  // ── Reactive forms ────────────────────────────────────────────────────────
  /** Single-select reactive control, starting on "b". */
  readonly singleControl = new FormControl<string | number | null>('b');
  /** Group holding a multi-select reactive control, starting on ['a']. */
  readonly group = new FormGroup({
    multi: new FormControl<Array<string | number> | null>(['a']),
  });

  // ── Template-driven form ──────────────────────────────────────────────────
  /** `[(ngModel)]` target, starting on "c". */
  ngModelValue: string | number | null = 'c';

  // ── S3 event bridge (non-form, controlled via [value]) ────────────────────
  eventedValue: Array<string | number> | null = ['b'];
  /** The last forwarded `change` payload from the `#evented` select. */
  lastChange: ChangeEventDetail | null = null;

  // ── S4 evidence bookkeeping ───────────────────────────────────────────────
  /**
   * Every value the reactive `singleControl` reports through `valueChanges`.
   * The runner asserts this does NOT contain an entry produced by the initial
   * `writeValue()` (i.e. programmatic init never echoes into the form model).
   */
  readonly singleValueChanges: Array<string | number | null> = [];
  /** Number of `ngModel` writes (each is a user-driven change to the control). */
  ngModelWrites = 0;

  /**
   * The template-driven `NgModel` directive instance on `#template`, exposed so
   * the runner can assert the control's touched state after a user edit.
   */
  @ViewChild('templateModel') templateModel?: NgModel;

  constructor() {
    this.singleControl.valueChanges.subscribe((v) => {
      this.singleValueChanges.push(v);
    });
  }

  onChange(detail: ChangeEventDetail): void {
    this.lastChange = detail;
  }
}
