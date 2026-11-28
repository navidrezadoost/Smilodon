/**
 * S5-Q — Final Angular qualification: CSR (client-side rendered, non-SSR) fixture.
 *
 * This is NOT part of the library build. It is a standalone Angular application
 * compiled AOT by ngc against the BUILT `@smilodon/angular` package and bundled
 * with esbuild into a browser bundle. It bootstraps entirely CLIENT-SIDE (no
 * server markup) so the final qualification can exercise the adapter in a REAL
 * browser for the CSR gates:
 *
 *   Q-01 standalone CSR consumer works without SSR
 *   Q-04 Chromium/Firefox pointer + keyboard interaction
 *   Q-05 selection / clearing / event forwarding preserve S3 contracts
 *   Q-06 reactive + template-driven forms preserve S4 contracts
 *   Q-07 real focus transitions + touched callbacks
 *   Q-08 disabled-state + programmatic updates reconciled
 *   Q-09 deferred initialization + destruction remain safe
 *   Q-10 full-core import cannot revive the host collision
 *
 * The component exposes observable state on `window.__csr` so the Playwright
 * qualification spec can assert genuine Angular behavior (form model writes,
 * event counts, provenance) rather than only DOM capture.
 *
 * Controls:
 *   #plain     [items] + (change)            — standalone event-bridged single
 *   #multi     [items][multiple] + (change)  — standalone multi
 *   #reactive  [formControl]                 — reactive single, initial 'b'
 *   #formgroup formControlName (multi)       — reactive multi in FormGroup, ['a']
 *   #template  [(ngModel)]                   — template-driven, initial 'c'
 *   #disabled  [disabled]="true"             — statically disabled (declarative)
 *   #toggled   [formControl] (FormControl)   — disabled toggled programmatically
 *   #late      [items] bound AFTER a tick     — deferred input binding (Q-09)
 *   #removable rendered behind *ngIf         — destroy/recreate safety (Q-09)
 *
 * `window.__csr` carries:
 *   - plainChangeCount / plainLastChange : forwarded (change) output from #plain
 *   - multiChangeCount / multiLastChange : forwarded (change) output from #multi
 *   - clearCount                         : forwarded (clear) output from #multi
 *   - reactiveValue / reactiveValueChanges[] / reactiveTouched : #reactive model
 *   - groupValue / groupChanges          : FormGroup multi value + valueChanges count
 *   - templateValue                      : ngModel value
 *   - lateItemsBound                     : true once #late got its items (deferred)
 *   - removableMounted                   : *ngIf state for #removable
 *   - removedOnce                        : true after one destroy/recreate cycle
 *   - toggledDisabled                    : current #toggled FormControl disabled
 *
 * NOTE on init events: core's `updateConfig()` emits a `change` when a control's
 * selection MODE changes at init (`single`→`multi`) as a runtime-mitigation
 * `clear()`. That lands on #multi (multi) and #formgroup (multi), NOT on #plain
 * (single→single). The per-control counters above make that distinction explicit.
 */
import { Component, inject, ViewChild, ChangeDetectorRef, ApplicationRef } from '@angular/core';
import { FormControl, FormGroup, FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SmilodonSelectComponent } from '@smilodon/angular';
import type { SmilodonSelectItem, ChangeEventDetail } from '@smilodon/angular';
import type { SelectInstanceConfig } from '@smilodon/core';

export const CSR_ITEMS: SmilodonSelectItem[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Bravo' },
  { value: 'c', label: 'Charlie' },
];

export interface CsrState {
  /** #plain `(change)` — standalone single. Kept SEPARATE from #multi. */
  plainChangeCount: number;
  plainLastChange: ChangeEventDetail | null;
  /** #multi `(change)` — standalone multi. */
  multiChangeCount: number;
  multiLastChange: ChangeEventDetail | null;
  /** #multi `(clear)` output. */
  clearCount: number;
  reactiveValue: string | number | null;
  reactiveValueChanges: Array<string | number | null>;
  reactiveTouched: boolean;
  groupValue: string | number | Array<string | number> | null;
  groupChanges: number;
  templateValue: string | number | null;
  lateItemsBound: boolean;
  removableMounted: boolean;
  removedOnce: boolean;
  toggledDisabled: boolean;
  ready: boolean;
}

@Component({
  selector: 'app-csr',
  standalone: true,
  imports: [SmilodonSelectComponent, ReactiveFormsModule, FormsModule, CommonModule],
  template: `
    <smilodon-angular-select
      id="plain"
      [items]="items"
      placeholder="Pick one"
      (change)="onPlainChange($event)"
    ></smilodon-angular-select>

    <smilodon-angular-select
      id="multi"
      [items]="items"
      [multiple]="true"
      [config]="multiConfig"
      (change)="onMultiChange($event)"
      (clear)="onClear($event)"
    ></smilodon-angular-select>

    <smilodon-angular-select
      id="reactive"
      [items]="items"
      [formControl]="reactiveCtrl"
      placeholder="Reactive"
    ></smilodon-angular-select>

    <form [formGroup]="group">
      <smilodon-angular-select
        id="formgroup"
        [items]="items"
        [multiple]="true"
        formControlName="multi"
        placeholder="Many"
      ></smilodon-angular-select>
    </form>

    <smilodon-angular-select
      id="template"
      [items]="items"
      [(ngModel)]="templateValue"
      [ngModelOptions]="{ standalone: true }"
      #templateModel="ngModel"
      placeholder="Template"
    ></smilodon-angular-select>

    <smilodon-angular-select id="disabled" [items]="items" [disabled]="true"></smilodon-angular-select>

    <smilodon-angular-select id="toggled" [items]="items" [formControl]="toggledCtrl"></smilodon-angular-select>

    <smilodon-angular-select id="late" [items]="lateItems" placeholder="Late"></smilodon-angular-select>

    <smilodon-angular-select
      *ngIf="removableMounted"
      id="removable"
      [items]="items"
      placeholder="Removable"
    ></smilodon-angular-select>
  `,
})
export class CsrAppComponent {
  readonly items: SmilodonSelectItem[] = CSR_ITEMS;

  // Angular 21 defaults to ZONELESS change detection, so async host-state
  // mutations (the deferred items binding / *ngIf recreations below) do NOT
  // schedule CD on their own. We drive CD explicitly after those mutations so
  // the `[items]`/`*ngIf` bindings actually re-evaluate in the fixture.
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly appRef = inject(ApplicationRef);

  /**
   * Fixture config enabling the element's clear control so Q-05 can exercise the
   * REAL clear-button user path (core emits `(clear)` only from that control, and
   * the clear control is disabled by default). This is TEST-ONLY config passed
   * through the adapter's documented `[config]` input — no production change.
   */
  readonly multiConfig: SelectInstanceConfig = {
    clearControl: { enabled: true },
  };

  // Standalone outputs (#plain and #multi tracked independently)
  plainChangeCount = 0;
  plainLastChange: ChangeEventDetail | null = null;
  multiChangeCount = 0;
  multiLastChange: ChangeEventDetail | null = null;
  clearCount = 0;

  // Reactive single (initial 'b')
  readonly reactiveCtrl = new FormControl<string | number | null>('b');
  reactiveValueChanges: Array<string | number | null> = [];

  // Reactive multi in a FormGroup (initial ['a'])
  readonly group = new FormGroup({
    multi: new FormControl<Array<string | number> | null>(['a']),
  });
  groupChanges = 0;

  // Template-driven (initial 'c')
  templateValue: string | number | null = 'c';
  @ViewChild('templateModel') templateModel?: NgModel;

  // Programmatically-toggled disabled (FormControl)
  readonly toggledCtrl = new FormControl<string | number | null>(null);

  // Deferred input binding (Q-09): items arrive after one macrotask.
  lateItems: SmilodonSelectItem[] | null = null;
  lateItemsBound = false;

  // Destroy/recreate safety (Q-09)
  removableMounted = true;
  removedOnce = false;

  constructor() {
    this.reactiveCtrl.valueChanges.subscribe((v) => {
      this.reactiveValueChanges.push(v);
      this.publish();
    });
    this.group.get('multi')!.valueChanges.subscribe(() => {
      this.groupChanges += 1;
      this.publish();
    });
    // Defer the late-items binding past the first change detection cycle.
    setTimeout(() => {
      this.lateItems = CSR_ITEMS;
      this.lateItemsBound = true;
      this.runChangeDetection();
      this.publish();
    }, 0);
    // Expose imperative test controls + LIVE state getters on `window.__csrApi`
    // so the Playwright qualification reads the AUTHORITATIVE Angular state
    // (FormControl value/touched, ngModel value) rather than a stale snapshot.
    // `__csr` continues to hold event counters (which only change on events).
    (window as unknown as { __csrApi?: unknown }).__csrApi = {
      setReactiveValue: (v: string | number | null) => this.setReactiveValue(v),
      toggleToggledDisabled: () => this.toggleToggledDisabled(),
      recreateRemovable: () => this.recreateRemovable(),
      live: () => ({
        reactiveValue: this.reactiveCtrl.value,
        reactiveTouched: this.reactiveCtrl.touched,
        reactivePristine: this.reactiveCtrl.pristine,
        templateValue: this.templateModel?.value ?? this.templateValue,
        templateTouched: this.templateModel?.touched ?? false,
        groupValue: this.group.get('multi')!.value,
      }),
    };
    this.publish();
  }

  onPlainChange(detail: ChangeEventDetail): void {
    this.plainLastChange = detail;
    this.plainChangeCount += 1;
    this.publish();
  }

  onMultiChange(detail: ChangeEventDetail): void {
    this.multiLastChange = detail;
    this.multiChangeCount += 1;
    this.publish();
  }

  onClear(detail: unknown): void {
    this.clearCount += 1;
    void detail;
    this.publish();
  }

  /** Programmatically toggle the #toggled control's disabled state (Q-08). */
  toggleToggledDisabled(): void {
    if (this.toggledCtrl.disabled) this.toggledCtrl.enable();
    else this.toggledCtrl.disable();
    this.runChangeDetection();
    this.publish();
  }

  /** Programmatically set the #reactive control's value (Q-08). */
  setReactiveValue(value: string | number | null): void {
    this.reactiveCtrl.setValue(value);
    this.runChangeDetection();
    this.publish();
  }

  /** Destroy then recreate the #removable select (Q-09). */
  recreateRemovable(): void {
    this.removableMounted = false;
    this.runChangeDetection();
    this.publish();
    setTimeout(() => {
      this.removableMounted = true;
      this.removedOnce = true;
      this.runChangeDetection();
      this.publish();
    }, 0);
  }

  /**
   * Drive change detection explicitly (zoneless: async mutations do not schedule
   * it). Marks this view for check then ticks the whole app so `[items]` / `*ngIf`
   * bindings re-evaluate and the adapter's ngOnChanges → applyInputs runs.
   */
  private runChangeDetection(): void {
    this.cdr.markForCheck();
    this.appRef.tick();
  }

  private publish(): void {
    if (typeof window !== 'undefined') {
      const state: CsrState = {
        plainChangeCount: this.plainChangeCount,
        plainLastChange: this.plainLastChange,
        multiChangeCount: this.multiChangeCount,
        multiLastChange: this.multiLastChange,
        clearCount: this.clearCount,
        reactiveValue: this.reactiveCtrl.value,
        reactiveValueChanges: [...this.reactiveValueChanges],
        reactiveTouched: this.reactiveCtrl.touched,
        groupValue: this.group.get('multi')!.value,
        groupChanges: this.groupChanges,
        templateValue: this.templateValue,
        lateItemsBound: this.lateItemsBound,
        removableMounted: this.removableMounted,
        removedOnce: this.removedOnce,
        toggledDisabled: this.toggledCtrl.disabled,
        ready: true,
      };
      (window as unknown as { __csr?: CsrState }).__csr = state;
    }
  }
}
