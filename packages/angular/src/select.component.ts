/**
 * @smilodon/angular — Angular host component over `<enhanced-select>`.
 *
 * A thin Angular host over the `<enhanced-select>` custom element. It owns NO
 * rendering or selection logic: the element (driven by `@smilodon/core`) owns
 * all of that. This component:
 *   1. renders a single `<enhanced-select>` host in its template;
 *   2. after the view initialises (browser only), loads core on demand via a
 *      browser-guarded dynamic `import()` (never a static top-level import, so
 *      SSR bundles do not evaluate the core entry — API-075 safety);
 *   3. applies items / selected values / configuration by calling the element's
 *      imperative API (NOT attributes — only `aria-*` are observed by the
 *      element, so attribute binding would silently no-op);
 *   4. reconciles later @Input() changes once the element is ready;
 *   5. ignores any pending async init after destroy (safe async lifecycle);
 *   6. forwards the element's `CustomEvent`s to typed `@Output()`s via a single
 *      listener set installed before init and removed on destroy (S3 bridge);
 *   7. integrates with Angular forms as a `ControlValueAccessor` (S4): it
 *      adapts itself to `ngModel` / `formControl` / `formControlName`, calling
 *      `onChange` ONLY for genuine user edits (never for `writeValue`/init/
 *      reconciliation) and marking `onTouched` only at a user focus-loss
 *      boundary. See `provenance.ts` for why core's reason signal is not
 *      reachable by an adapter and how provenance is established instead.
 *
 * Out of scope (later slices): SSR rendering/hydration qualification (S5).
 */

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  EventEmitter,
  forwardRef,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import type { ControlValueAccessor } from '@angular/forms';
import type {
  SelectInstanceConfig,
  GroupedItem as CoreGroupedItem,
} from '@smilodon/core';
import type { SmilodonSelectItem } from './types.js';
import {
  ENHANCED_SELECT_TAG,
  ensureEnhancedSelectDefined,
  isBrowserEnvironment,
} from './core-loader.js';
import { SMILODON_SELECT_EVENT_NAMES } from './events.js';
import type { SmilodonSelectOutputs } from './events.js';
import { classifyChange, SELECTION_KEYS } from './provenance.js';

/**
 * The structural subset of the `EnhancedSelect` element that this adapter uses.
 * Declared locally so the adapter never has to `import type { EnhancedSelect }`
 * from core (that type lives in the entry that throws under SSR if value-imported;
 * a type-only import would be safe, but the structural shape keeps the coupling
 * minimal and explicit).
 */
interface EnhancedSelectElement extends HTMLElement {
  setItems(items: unknown[]): void;
  setGroupedItems(groupedItems: CoreGroupedItem[]): void;
  setSelectedValues(values: unknown[]): Promise<void>;
  getSelectedValues(): unknown[];
  updateConfig(config: SelectInstanceConfig): void;
  setError(message: string): void;
  clearError(): void;
  setRequired(required: boolean): void;
}

/**
 * Find the first element nested inside `root` that has its own `shadowRoot`, so
 * provenance probes can follow the shadow-DOM chain under the select host. Core
 * renders into one open shadow root; this handles any future nesting too.
 */
function findShadowRootHost(root: ShadowRoot): Element | null {
  for (const el of Array.from(root.querySelectorAll<HTMLElement>('*'))) {
    if (el.shadowRoot) {
      return el;
    }
  }
  return null;
}

/**
 * Minimal browser-deferred Angular select host.
 *
 * @example
 * ```html
 * <smilodon-angular-select
 *   [items]="items"
 *   [value]="selectedValues"
 *   [multiple]="true"
 *   (change)="onChange($event)">
 * </smilodon-angular-select>
 * ```
 */
@Component({
  // S5-D / F02-R: distinct host tag so the component never collides with core's
  // `smilodon-select` custom element (NativeSelectElement). The old tag collided
  // because full-core import upgraded the Angular host (attachShadow, no <slot>)
  // and suppressed the light-DOM <enhanced-select> widget. The component still
  // renders the real <enhanced-select> in its template (as every sibling adapter
  // does); only the host name diverges.
  selector: 'smilodon-angular-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<enhanced-select #host></enhanced-select>',
  // `<enhanced-select>` is a custom element owned by @smilodon/core (not an
  // Angular component), so the schema must permit unknown elements for AOT.
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styles: [':host { display: block; } :host enhanced-select { display: block; }'],
  // S4: register as an Angular forms value accessor so the component works with
  // `[(ngModel)]`, `[formControl]`, and `formControlName` out of the box.
  // `forwardRef` is required because `SmilodonSelectComponent` is not yet defined
  // when decorator metadata is evaluated.
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SmilodonSelectComponent),
      multi: true,
    },
  ],
})
export class SmilodonSelectComponent
  implements AfterViewInit, OnChanges, OnDestroy, ControlValueAccessor {
  /** Flat list of selectable items (ignored when `groupedItems` is set). */
  @Input() items: SmilodonSelectItem[] | null = null;
  /** Grouped items; takes precedence over `items` when provided. */
  @Input() groupedItems: CoreGroupedItem[] | null = null;
  /**
   * Selected values. Applied via the async `setSelectedValues()`.
   *
   * Contract for controlled value:
   *  - an ARRAY (including `[]`) is an explicit selection request, so `[]`
   *    clears the selection;
   *  - `null` is an EXPLICIT empty selection (clears the selection) once the
   *    input has actually been bound at least once;
   *  - an `undefined` (or never-assigned) value means the adapter should NOT
   *    touch selection — this preserves the distinction between "no value
   *    supplied" and "explicitly clear".
   *
   * The default is `undefined` (not `null`) precisely so a consumer that never
   * binds `[value]` does not get a spurious clear.
   *
   * ## Relationship to Angular forms (S4)
   *
   * This `[value]` input and Angular forms are two ways to set the SAME thing.
   * They never both own selection:
   *  - When the component is used inside a form control (its `writeValue()` has
   *    been called — i.e. `ngModel`/`formControl`/`formControlName` is attached),
   *    the FORM MODEL is the single source of truth. `[value]` is then IGNORED for
   *    reconciliation so a stale `[value]` binding can never fight the form and
   *    create a write/feedback loop. The form model is applied unchanged through
   *    the exact same controlled-value path (`undefined`/`null`/`[]` semantics are
   *    preserved: `null` clears, an array sets).
   *  - Outside a form (no `writeValue()` ever received), `[value]` behaves exactly
   *    as documented above — unchanged from S2/S3.
   *
   * The forms value representation is therefore IDENTICAL to `[value]`: a single
   * select maps to a **scalar** (`string | number | null`), a multi select maps
   * to an **array** (`Array<string | number> | null`). See `README.md`.
   */
  @Input() value: Array<string | number> | null | undefined = undefined;
  /** Multi-select toggle. Maps to `selection.mode`. */
  @Input() multiple = false;
  /** Enable the search box. */
  @Input() searchable = false;
  /** Disable the whole control. Maps to `enabled: !disabled`. */
  @Input() disabled = false;
  /** Mark the field required (adds native `required` on the element input). */
  @Input() required = false;
  /** Error message. Non-empty sets the error; empty clears it. */
  @Input() error: string | null = null;
  /** Placeholder text. */
  @Input() placeholder: string | undefined = undefined;
  /**
   * Full instance configuration passthrough. Layered on top of the flags above
   * via a single `updateConfig()` call, mirroring the other adapters.
   */
  @Input() config: SelectInstanceConfig | null = null;

  // ── S3: typed event bridge ──────────────────────────────────────────────────
  // Every output forwards the element's own `CustomEvent` verbatim: the emitted
  // value is `event.detail` (payload identity preserved) typed by the exact
  // core detail shape. Output names are IDENTICAL to the element wire names —
  // no aliasing — so a consumer's `(change)="…"` maps 1:1 to core's `change`.
  // The adapter does NOT re-emit or reinterpret; it only forwards. In particular
  // a `change` produced by a programmatic `setSelectedValues()` is forwarded
  // as-is and is NEVER written back into the `value` input here (no feedback
  // loop): controlled reconciliation stays parent-driven.
  /** Fired when an option is selected (core `select`). */
  @Output() readonly select: EventEmitter<SmilodonSelectOutputs['select']> = new EventEmitter();
  /** Fired whenever the selection set changes (core `change`). */
  @Output() readonly change: EventEmitter<SmilodonSelectOutputs['change']> = new EventEmitter();
  /** Fired when the listbox opens (core `open`). */
  @Output() readonly open: EventEmitter<SmilodonSelectOutputs['open']> = new EventEmitter();
  /** Fired when the listbox closes (core `close`). */
  @Output() readonly close: EventEmitter<SmilodonSelectOutputs['close']> = new EventEmitter();
  /** Fired on search query change (core `search`). */
  @Output() readonly search: EventEmitter<SmilodonSelectOutputs['search']> = new EventEmitter();
  /** Fired when more data is requested (core `loadMore`). */
  @Output() readonly loadMore: EventEmitter<SmilodonSelectOutputs['loadMore']> = new EventEmitter();
  /** Fired when a selection badge is removed (core `remove`). */
  @Output() readonly remove: EventEmitter<SmilodonSelectOutputs['remove']> = new EventEmitter();
  /** Fired when the control is cleared (core `clear`). */
  @Output() readonly clear: EventEmitter<SmilodonSelectOutputs['clear']> = new EventEmitter();
  /** Fired when a page of items has loaded (core `pageLoaded`). */
  @Output() readonly pageLoaded: EventEmitter<SmilodonSelectOutputs['pageLoaded']> = new EventEmitter();
  /**
   * Fired on an internal error (core `error` event).
   *
   * ALIAS (documented, justified): the output **property** is named
   * `coreError`, but its **template binding / public output name** is the wire
   * name `error` (`@Output('error')`). The property cannot literally be named
   * `error` because the existing `@Input() error` (a validation message string)
   * owns that identifier — a class member cannot be both a string input and an
   * EventEmitter. The alias affects only the TypeScript member name; the emitted
   * event name (`error`) and the payload (`ErrorEventDetail`) are the element's
   * own, unchanged, so a consumer still writes `(error)="onError($event)"` and
   * receives the untouched core detail. This is the only aliased output; every
   * other output's property name equals its wire name.
   */
  @Output('error') readonly coreError: EventEmitter<SmilodonSelectOutputs['error']> = new EventEmitter();
  /** Fired when the terminal empty-state transitions (core `emptyStateChange`). */
  @Output() readonly emptyStateChange: EventEmitter<SmilodonSelectOutputs['emptyStateChange']> = new EventEmitter();
  /** Fired for tracking diagnostics when core tracking emits them (core `diagnostic`). */
  @Output() readonly diagnostic: EventEmitter<SmilodonSelectOutputs['diagnostic']> = new EventEmitter();

  /**
   * The currently-registered `[eventName, handler]` pairs on the element, so
   * `ngOnDestroy()` can remove EXACTLY what `attachEventListeners()` added
   * (identical function references). This is the single-listener authority: the
   * element is (re)bound at most once per install, and every listener is removed
   * on teardown — no duplicate delivery, no leak.
   */
  private eventBindings: Array<[string, EventListener]> = [];

  @ViewChild('host', { static: true })
  private hostRef?: ElementRef<HTMLElement>;

  private destroyed = false;

  /** Bumped on each init attempt; stale attempts compare against it to bail. */
  private initGeneration = 0;
  /** True once core is loaded and the element is upgraded and configured. */
  private ready = false;
  private initPromise: Promise<void> | null = null;
  /** Set when init fails, so we surface it without throwing into Angular. */
  private initError: unknown = null;
  /**
   * Monotonic counter incremented on every selection application AND on destroy.
   * The element's `setSelectedValues()` is async (it may fetch selected items
   * server-side), so a slow earlier call could settle after a later one or after
   * teardown. Each request is tagged; only the LATEST tag on a still-live
   * component is authoritative for adapter error state — a stale rejection cannot
   * clobber the current value error, a stale success cannot resurrect an outdated
   * selection, and a post-destroy settle cannot mutate adapter state.
   */
  private valueGeneration = 0;
  /** Set when the most recent selection application rejected. */
  private valueError: unknown = null;

  // ── S4: ControlValueAccessor + selection provenance ─────────────────────────

  /**
   * The form model's change callback (supplied by Angular via `registerOnChange`).
   * Invoked ONLY for genuine user edits — never for `writeValue`/init/reconcile.
   */
  private onChangeFn: (value: unknown) => void = () => {};
  /** The form model's touch callback (supplied via `registerOnTouched`). */
  private onTouchedFn: () => void = () => {};

  /**
   * The last value delivered by Angular's form machinery (`writeValue`, or
   * mirrored on a user edit). This — not the `[value]` input — is the literal
   * form model value while the component is form-controlled. Kept so a
   * user-edit `onChange` reports the same representation the form supplied.
   */
  private currentFormValue: unknown = null;

  /**
   * True once `writeValue()` has been called at least once — i.e. the component
   * is used inside a form control (`ngModel`/`formControl`/`formControlName`).
   * While form-controlled, the FORM MODEL owns selection and the `[value]` input
   * is ignored for reconciliation (single source of truth — see `value` docs).
   */
  private isFormControlled = false;

  /**
   * A pending `writeValue()` received before the element was ready. Applied at
   * init through the same controlled-value path. `undefined` = none pending (it
   * is never a valid "apply" request because form-init with `undefined` is a
   * no-op that must not clear).
   */
  private pendingFormValue: unknown = undefined;

  /**
   * Why a programmatic application is in progress (see `openProgrammaticChange`).
   * Gates whether it may be adjudicated synchronously (`null` = none).
   */
  private programmaticReason: 'init' | 'write' | null = null;

  /**
   * S4-R (S4-F02): the number of programmatic `setSelectedValues()` applications
   * that are IN FLIGHT — incremented before the call, decremented when its
   * promise settles. For the SYNCHRONOUS path the `change` is emitted inside the
   * call (before the decrement), so it is naturally inside this window. For the
   * ASYNC (server-backed) path the call RETURNS before the fetch resolves, but
   * this counter stays > 0 until the fetch settles — so the programmatic
   * completion `change` still arrives while `pendingProgrammaticApplications > 0`.
   * Any `change` observed while this is > 0 is treated as PROGRAMMATIC (the
   * conservative rule: we never echo a programmatic completion into the form
   * model, even if a stale user gesture was armed in the await gap). This does
   * not affect a genuine user edit made when NO application is in flight.
   */
  private pendingProgrammaticApplications = 0;

  // ── S4-R: touched state (focus-loss boundary) ───────────────────────────────

  /**
   * True once a user edit has been reported to the form model via `onChange`,
   * OR the control has been focused. Angular forms marks a control touched when
   * the user has "interacted and left" — we model that at the focus-loss
   * boundary (see `handleFocusOut`), NOT on selection. This is the S4-F01 fix.
   */
  private focusWithin = false;
  /**
   * True once the current focus SESSION has already fired `onTouched`, so a
   * single focus-loss fires it at most once. Re-armed on the next `focusin`.
   */
  private touchedThisSession = false;

  /** The DOM host (`smilodon-angular-select`) focus-in/out listener references. */
  private focusBindings: Array<[string, EventListener]> = [];

  /**
   * Deepest shadow roots the adapter has attached its capture-phase user-input
   * probes to. Cleared on destroy.
   */
  private patrolRoots: ShadowRoot[] = [];

  private readonly element: ElementRef<HTMLElement> = inject(ElementRef);

  ngAfterViewInit(): void {
    if (!isBrowserEnvironment()) {
      // Server / non-DOM: render the placeholder host only, never touch core.
      return;
    }
    // Attach the event bridge BEFORE any initialization operation that may emit
    // events. The target element exists as soon as the view is initialised
    // (even before core upgrades it): events dispatched later bubble from it, and
    // our listeners are registered on that exact element, so nothing emitted
    // during initialization (e.g. the `change` from an initial `value`) is lost.
    this.attachEventListeners();
    // S4: attach capture-phase user-input probes on the element's shadow root so
    // the adapter can establish provenance (user vs programmatic) independently
    // of core's internal selection reason. Installed per shadow root; see
    // `installProvenanceProbes()`.
    this.installProvenanceProbes();
    // S4-R: attach focus-in/out tracking on the component HOST element so that
    // `onTouched` fires at a real focus-loss boundary of the whole control
    // (shadow DOM + popup included) — not on a selection change.
    this.installFocusTracking();
    this.initialize();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.ready) {
      // Pre-ready changes are captured by the fields above and applied once the
      // element finishes initialising; nothing to do yet.
      return;
    }
    this.applyInputs();
  }

  ngOnDestroy(): void {
    // Invalidate any in-flight init so it does not configure a torn-down view.
    this.destroyed = true;
    this.initGeneration += 1;
    // Invalidate any in-flight selection application too. `setSelectedValues()`
    // may still be pending (e.g. a server-backed fetch); bumping the generation
    // makes every outstanding completion fail its `generation === valueGeneration`
    // check, so a late resolve/reject cannot mutate adapter state after teardown.
    this.valueGeneration += 1;
    // Remove every event listener added by `attachEventListeners()`. Uses the
    // captured function references so removal is exact; idempotent for the
    // never-initialised / already-detached cases.
    this.detachEventListeners();
    // S4: tear down the provenance probes.
    this.removeProvenanceProbes();
    // S4-R: tear down the focus-tracking listeners.
    this.removeFocusTracking();
  }

  /** Exposed for tests/inspection: true once the element is ready. */
  get isReady(): boolean {
    return this.ready;
  }

  /** Exposed for tests/inspection: any initialization error, if one occurred. */
  get initializationError(): unknown {
    return this.initError;
  }

  /**
   * Exposed for tests/inspection: the rejection from the most recent
   * `setSelectedValues()` application, if it failed. Stale rejections (superseded
   * by a newer value) are swallowed rather than surfaced here.
   */
  get lastValueError(): unknown {
    return this.valueError;
  }

  /** Await the in-flight initialization (or resolve immediately once ready). */
  whenReady(): Promise<void> {
    return this.initPromise ?? Promise.resolve();
  }

  private initialize(): void {
    const generation = ++this.initGeneration;
    const element = this.getSelectElement();
    if (!element) {
      return;
    }

    this.initPromise = ensureEnhancedSelectDefined()
      .then(() => {
        if (this.isStale(generation)) {
          return;
        }
        this.ready = true;
        // Apply the latest inputs (which may have changed during loading).
        this.applyInputs();
      })
      .catch((error) => {
        if (this.isStale(generation)) {
          return;
        }
        this.initError = error;
      });
  }

  /** True when this generation is stale (destroyed or superseded). */
  private isStale(generation: number): boolean {
    return this.destroyed || generation !== this.initGeneration;
  }

  private getSelectElement(): EnhancedSelectElement | null {
    // Prefer the template host; fall back to the component host element so the
    // contract still holds in simplified/standalone test setups.
    const host =
      this.hostRef?.nativeElement ??
      (this.element?.nativeElement?.querySelector?.(ENHANCED_SELECT_TAG) as
        | HTMLElement
        | null);
    if (!host) {
      return null;
    }
    if (host.tagName.toLowerCase() === ENHANCED_SELECT_TAG) {
      return host as EnhancedSelectElement;
    }
    return (host.querySelector?.(ENHANCED_SELECT_TAG) as EnhancedSelectElement | null) ?? null;
  }

  /**
   * Register exactly one listener per forwarded event on THIS component's own
   * `<enhanced-select>` element (single-listener authority). Idempotent: a second
   * call (or any post-destroy call) is a no-op when bindings already exist, and
   * is skipped when the component is destroyed. Each handler forwards the
   * element's `CustomEvent.detail` verbatim to the matching `@Output()`.
   */
  private attachEventListeners(): void {
    if (this.destroyed || this.eventBindings.length > 0) {
      return;
    }
    const element = this.getSelectElement();
    if (!element) {
      return;
    }
    for (const name of SMILODON_SELECT_EVENT_NAMES) {
      const handler: EventListener = (event) => {
        // Guard: never deliver to consumers after teardown, even if a listener
        // somehow outlives detach (defensive; detach removes all bindings).
        if (this.destroyed) {
          return;
        }
        // S4: classify a `change` for the ControlValueAccessor BEFORE dispatch.
        // The provenance snapshot is read here, synchronously inside the
        // element's own dispatch, so it is still current for THIS change. See
        // `handleChangeForValueAccessor()`.
        if (name === 'change') {
          this.handleChangeForValueAccessor((event as CustomEvent).detail);
        }
        // Single-delivery guard: the element's events bubble (bubbles + composed)
        // and several of their names (`change`, `select`, `open`, `close`, …)
        // collide with the `@Output()` names on this component's host element.
        // Angular binds `(change)` on the host to BOTH the `@Output()` AND a
        // native DOM listener for a bubbling `change` of that name — which would
        // deliver every event TWICE (once as `detail`, once as the raw event).
        // Stop propagation at the element boundary so the ONLY delivery path is
        // our own `@Output()` forwarding below.
        event.stopPropagation();
        this.emitEvent(name, (event as CustomEvent).detail);
      };
      element.addEventListener(name, handler);
      this.eventBindings.push([name, handler]);
    }
  }

  /** Remove every listener registered by {@link attachEventListeners}. */
  private detachEventListeners(): void {
    if (this.eventBindings.length === 0) {
      return;
    }
    const element = this.getSelectElement();
    if (element) {
      for (const [name, handler] of this.eventBindings) {
        element.removeEventListener(name, handler);
      }
    }
    this.eventBindings = [];
  }

  /**
   * Forward one element event detail to its `@Output()`. The detail is passed
   * through unchanged (payload identity preserved). The switch is exhaustive over
   * `SMILODON_SELECT_EVENT_NAMES`; the default is a defensive no-op.
   */
  private emitEvent(name: string, detail: unknown): void {
    switch (name) {
      case 'select':
        this.select.emit(detail as SmilodonSelectOutputs['select']);
        break;
      case 'change':
        this.change.emit(detail as SmilodonSelectOutputs['change']);
        break;
      case 'open':
        this.open.emit(detail as SmilodonSelectOutputs['open']);
        break;
      case 'close':
        this.close.emit(detail as SmilodonSelectOutputs['close']);
        break;
      case 'search':
        this.search.emit(detail as SmilodonSelectOutputs['search']);
        break;
      case 'loadMore':
        this.loadMore.emit(detail as SmilodonSelectOutputs['loadMore']);
        break;
      case 'remove':
        this.remove.emit(detail as SmilodonSelectOutputs['remove']);
        break;
      case 'clear':
        this.clear.emit(detail as SmilodonSelectOutputs['clear']);
        break;
      case 'pageLoaded':
        this.pageLoaded.emit(detail as SmilodonSelectOutputs['pageLoaded']);
        break;
      case 'error':
        this.coreError.emit(detail as SmilodonSelectOutputs['error']);
        break;
      case 'emptyStateChange':
        this.emptyStateChange.emit(detail as SmilodonSelectOutputs['emptyStateChange']);
        break;
      case 'diagnostic':
        this.diagnostic.emit(detail as SmilodonSelectOutputs['diagnostic']);
        break;
      default:
        break;
    }
  }

  /** Push the current input state into the element via its imperative API. */
  private applyInputs(): void {
    const element = this.getSelectElement();
    if (!element) {
      return;
    }
    // Ensure provenance probes are attached to the (now upgraded) element before
    // ANY selection is applied, so the initial programmatic sync is classified
    // correctly (and is never mistaken for a user edit).
    this.installProvenanceProbes();

    // 1. Items (grouped takes precedence).
    if (this.groupedItems && this.groupedItems.length > 0) {
      element.setGroupedItems(this.groupedItems);
    } else {
      element.setItems(this.items ?? []);
    }

    // 2. Configuration (single reconciled update).
    element.updateConfig(this.buildConfig());

    // 3. Required / error flags.
    element.setRequired(this.required);
    if (this.error) {
      element.setError(this.error);
    } else {
      element.clearError();
    }

    // 4. Selected values. Two mutually-exclusive sources of truth:
    //    (a) FORM-CONTROLLED (`writeValue()` received): the form model owns
    //        selection. `[value]` is ignored so it cannot fight the form.
    //    (b) STANDALONE: the `[value]` input owns selection.
    //    Both apply through the SAME controlled path (`undefined`/`null`/`[]`
    //    semantics preserved): `undefined` leaves selection untouched, `null`
    //    or `[]` clears, an array sets. Applications are generation-guarded.
    let controlledAvailable = false;
    let controlledRequest: unknown[] = [];
    if (this.isFormControlled) {
      if (this.pendingFormValue !== undefined) {
        // A writeValue() arrived before the element was ready.
        controlledAvailable = true;
        controlledRequest = this.moduleValueToRequest(this.pendingFormValue);
        this.pendingFormValue = undefined;
      }
    } else if (this.value !== undefined) {
      controlledAvailable = true;
      controlledRequest = (this.value ?? []) as unknown[];
    }
    if (controlledAvailable) {
      this.applySelectedValues(element, controlledRequest);
      // The apply closed synchronously: consume the synchronous change(s) it may
      // have produced and restore the origin to programmatic until a real gesture.
      this.closeProgrammaticChange();
    }
  }

  /**
   * Apply a controlled selection to the element under a generation guard.
   *
   * `setSelectedValues()` is asynchronous. This method closes three adapter-side
   * hazards (it does NOT re-implement selection ordering — the engine owns that):
   *  1. Rejection: the returned promise is `.catch`-ed so it never becomes an
   *     unhandled rejection; the error is recorded in `valueError`.
   *  2. Destroy-safety: any completion (resolve or reject) that settles after
   *     `ngOnDestroy` is ignored, so a late settle cannot mutate adapter state.
   *  3. Adapter-level error supersession: rapid input changes can start
   *     overlapping async calls. Each call is tagged; only the LATEST live tag
   *     may write `valueError`, so a stale rejection is swallowed and does not
   *     overwrite the current error state.
   *
   * Scope of the "latest wins" guarantee: this method guarantees that the
   * ADAPTER's error state reflects the latest request. SELECTION supersession —
   * which selection ultimately lands in the element — is owned by the engine:
   * the non-server `setSelectedValues()` path applies the replacement
   * synchronously, and the server-backed fetch path guards its own completion
   * with `isConnected` + a private `_asyncGeneration`, so a superseded fetch is
   * discarded. The adapter relies on (and does not duplicate) that behavior.
   */
  private applySelectedValues(element: EnhancedSelectElement, values: unknown[]): void {
    const generation = ++this.valueGeneration;

    // Only the current, non-destroyed generation may mutate adapter state. A
    // completion is stale when the component was destroyed or a newer value
    // was requested; both cases are rejected here so late settle-ups (resolve
    // or reject) after teardown are ignored.
    const isCurrent = (): boolean => !this.destroyed && generation === this.valueGeneration;

    // S4 provenance: open a programmatic-application window around the call. The
    // non-server `setSelectedValues()` path applies synchronously and emits
    // `change` DURING this call; inside the window the origin is
    // `'programmatic'`, so those changes are recorded as programmatic (never a
    // user edit) and consumed by the change budget. `closeProgrammaticChange()`
    // is called by the caller once the synchronous apply has returned.
    this.openProgrammaticChange();

    let result: Promise<void>;
    try {
      result = element.setSelectedValues(values);
    } catch (error) {
      // Defensive: a synchronous throw must not escape into Angular.
      if (isCurrent()) {
        this.valueError = error;
      }
      this.closeProgrammaticChange();
      return;
    }

    // S4-R (S4-F02): mark this application in flight BEFORE its promise can
    // settle, so an ASYNC (server-backed) completion is still covered by the
    // conservative "programmatic while in flight" rule when its `change` arrives
    // after the fetch resolves. Decremented exactly once on settle.
    this.pendingProgrammaticApplications += 1;
    Promise.resolve(result).then(
      () => {
        this.pendingProgrammaticApplications = Math.max(0, this.pendingProgrammaticApplications - 1);
        if (isCurrent()) {
          this.valueError = null;
        }
      },
      (error) => {
        this.pendingProgrammaticApplications = Math.max(0, this.pendingProgrammaticApplications - 1);
        // Only the latest, live application reports its failure; stale or
        // post-destroy ones are ignored.
        if (isCurrent()) {
          this.valueError = error;
        }
      },
    );
  }

  // ── S4: ControlValueAccessor (Angular forms integration) ────────────────────

  /**
   * Angular forms hook: write a model value INTO the component.
   *
   * This is ALWAYS a programmatic sync — it must never call `onChange`, or the
   * form model would echo back into itself. It:
   *  1. marks the component form-controlled (the form model becomes the single
   *     source of truth and the `[value]` input stops being reconciled);
   *  2. records the literal model value (`currentFormValue`) so a later user
   *     edit reports the same representation;
   *  3. applies it through the shared controlled path — but ONLY when the element
   *     is ready; before that it is stored in `pendingFormValue` and applied at
   *     init. This ordering matters: if the model is `undefined` at first write
   *     (form-init) and a real value arrives later, the write is not lost.
   *
   * `undefined` = no value yet → never clears (matches Angular's "uninitialized
   * control" behavior); `null` / `[]` = explicit clear; an array or a scalar
   * selects values.
   */
  writeValue(value: unknown): void {
    // Record form-control ownership + the latest model value unconditionally.
    this.isFormControlled = true;
    this.currentFormValue = value;

    // `undefined` = "no value yet" (Angular's uninitialized control). It must be a
    // true no-op: it must not clear, AND it must not even reach
    // `setSelectedValues([])` (which would, as a trailing application, WIN the
    // race and wipe a selection that another source — e.g. the async init that
    // applies a deferred model value — is about to land). So we NEVER queue
    // `undefined` and never discard a pending real write with it.
    if (value === undefined) {
      return;
    }

    const element = this.getSelectElement();
    if (!this.ready || !element) {
      // Element not ready (or pre-init): defer to init.
      this.pendingFormValue = value;
      return;
    }
    this.installProvenanceProbes();
    this.applySelectedValues(element, this.moduleValueToRequest(value));
    this.closeProgrammaticChange();
  }

  /** Angular forms hook: register the callback fired on a genuine user edit. */
  registerOnChange(fn: (value: unknown) => void): void {
    // Angular passes a no-op during teardown; store it verbatim.
    this.onChangeFn = typeof fn === 'function' ? fn : () => {};
  }

  /** Angular forms hook: register the callback fired at a user focus-loss boundary. */
  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = typeof fn === 'function' ? fn : () => {};
  }

  /**
   * Angular forms hook: enable/disable the control.
   *
   * Reconciles with the `disabled` @Input WITHOUT conflicting config writes.
   * The constructor flag and this method feed ONE derived disabled state:
   *   - `disabled = disabledInput || formDisabled`
   * The form's own disabled state wins while the control is form-controlled
   * (Angular's `ControlValueAccessor` contract: the DISABLED flag is exactly the
   * model-driven disabled state), so `setDisabledState(true/false)` reflects it.
   * The `disabled` input is still honoured for standalone use and still applies
   * when the control is not form-controlled. The resulting state is applied via a
   * single `updateConfig()` — never a second, competing write.
   */
  setDisabledState(isDisabled: boolean): void {
    this.formDisabled = Boolean(isDisabled);
    this.applyDisabledState();
  }

  /** The form-driven disabled state (from `setDisabledState`). */
  private formDisabled = false;

  /** Apply the reconciled disabled state as a single config update. */
  private applyDisabledState(): void {
    const element = this.getSelectElement();
    if (!this.ready || !element) {
      // Pre-ready: `applyInputs()` will fold the derived state in at init.
      return;
    }
    element.updateConfig(this.buildConfig());
  }

  /**
   * Normalise an Angular model / `[value]` input into the array request that
   * `setSelectedValues()` accepts (the ELEMENT always takes an array; the ADAPTER
   * exposes `null`/scalar for single and `null`/array for multi at the value
   * boundary — see `buildModelValue`).
   *
   *  - `null`            → `[]`  (explicit clear)
   *  - array (incl. `[]`)→ as-is
   *  - scalar (string/number) → `[scalar]` (single-select convenience)
   *  - `undefined` / other → `[]` (defensive empty request; callers that must NOT
   *                          clear short-circuit on `undefined` before calling)
   */
  private moduleValueToRequest(value: unknown): unknown[] {
    if (value === null) {
      return [];
    }
    if (Array.isArray(value)) {
      return value.slice();
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return [value];
    }
    return [];
  }

  /**
   * Build the value reported to the FORM MODEL from the element's current
   * selection, in the representation appropriate to the mode (the canonical
   * forms representation documented on `value`):
   *   - single → scalar (`value`) or `null` when empty
   *   - multi  → array of values (`[]` when empty)
   *
   * This is derived from the ELEMENT's authoritative selection (not re-derived
   * in the adapter), so the form and the element can never disagree.
   */
  private buildModelValue(element: EnhancedSelectElement): string | number | Array<string | number> | null {
    const raw = element.getSelectedValues?.() ?? [];
    const values = (raw as Array<string | number>);
    if (this.isMultiSelect()) {
      return values.slice();
    }
    return values.length > 0 ? values[0] : null;
  }

  /**
   * True when the active selection mode is multi. Prefers the explicit
   * `multiple` input; falls back to the element's live config once known (so a
   * `config.selection.mode` override is honoured). Defaults to single, matching
   * core.
   */
  private isMultiSelect(): boolean {
    if (this.multiple) {
      return true;
    }
    const element = this.getSelectElement();
    const mode = (element as unknown as { _config?: { selection?: { mode?: string } } })?._config
      ?.selection?.mode;
    return mode === 'multi';
  }

  /**
   * S4: classify one element `change` and, for a GENUINE user edit, notify the
   * form model exactly once. Programmatic changes (writeValue / init /
   * reconcile / stale async) are structural no-ops: they update nothing here.
   * (Touched is NOT fired here — see `handleFocusOut`, the S4-F01 focus-loss
   * boundary.)
   *
   * Provenance (see `provenance.ts`): the element records the origin of every
   * selection sync via the capture-phase probes in `installProvenanceProbes`.
   * The recorded origin is still current when this runs because we are inside
   * the element's synchronous `dispatchEvent` for this very `change`.
   */
  private handleChangeForValueAccessor(detail: unknown): void {
    const element = this.getSelectElement();
    if (!element) {
      return;
    }

    // (A) CONSERVATIVE RULE (S4-R / S4-F02): while ANY programmatic
    //     `setSelectedValues()` application is in flight (its promise has not yet
    //     settled), treat this `change` as programmatic. This covers BOTH:
    //       - the SYNCHRONOUS path (change emitted inside the call, before the
    //         promise settles), and
    //       - the ASYNC / server-backed path (the call returned, but the fetch is
    //         still pending, so its completion `change` arrives with the counter
    //         still > 0 even if a stale user gesture was armed in the gap).
    //     We consume any armed gesture here so it cannot leak into a later change,
    //     and we never echo the completion into the form model. A genuine user
    //     edit made during a server fetch is (conservatively) NOT reported — see
    //     the documented limitation; this is strictly safer than a false echo.
    if (this.pendingProgrammaticApplications > 0) {
      this.lastUserSeq = this.currentUserSeq;
      this.origin = 'programmatic';
      void detail;
      return;
    }

    // (B) A programmatic application is in progress synchronously (init / the
    //     non-server writeValue path — `programmaticReason !== null`). This is
    //     also caught by (A) via the in-flight counter, but kept for the brief
    //     window between `openProgrammaticChange()` and the counter increment (a
    //     synchronous `change` emitted before `pendingProgrammaticApplications`
    //     is bumped). Adjudicate it programmatically.
    if (this.origin === 'programmatic') {
      this.lastUserSeq = this.currentUserSeq;
      this.programmaticReason = null;
      return;
    }

    // (C) The origin is 'user'. Only a gesture observed AFTER the last consumed
    //     one is a genuine, unconsumed user edit; a stale gesture (already
    //     consumed by a prior change) is not.
    const origin = classifyChange({
      userInputSeq: this.currentUserSeq,
      lastUserSeq: this.lastUserSeq,
      programmaticApplication: false,
    });
    if (origin !== 'user') {
      this.origin = 'programmatic';
      return;
    }

    // Consume this gesture so a follow-up change from the same gesture (e.g.
    // select-all's extra event) is not reported twice.
    this.lastUserSeq = this.currentUserSeq;
    this.origin = 'programmatic';

    // Exactly one user edit → exactly one onChange. Touched is NOT fired here:
    // per the S4-R directive, `onTouched` is a FOCUS-LOSS boundary, established
    // in `handleFocusOut()` (a user can select and keep focus; or focus and leave
    // without selecting — both must touch only at focus loss).
    const modelValue = this.buildModelValue(element);
    this.currentFormValue = modelValue;
    this.onChangeFn(modelValue);

    // Keep the payload available to tests/consumers that inspect the detail.
    void detail;
  }

  /** Fire the form-model touched callback once (guarded by destroy). */
  private fireTouched(): void {
    if (this.destroyed) {
      return;
    }
    this.onTouchedFn();
  }

  // ── S4-R: focus tracking (touched at a real focus-loss boundary) ────────────

  /**
   * Attach `focusin`/`focusout` listeners on the component's HOST element (the
   * `smilodon-angular-select` wrapper). Because the whole control — the combobox input,
   * popup, chips, clear button — lives inside the host's shadow tree, a
   * `focusout` whose `relatedTarget` is still inside the host is an INTERNAL
   * move (must NOT touch), while a `focusout` to anything outside the host is a
   * real focus-loss (must touch, once). Idempotent.
   *
   * `focusin`/`focusout` are used (not `focus`/`blur`) because they BUBBLE and
   * are `composed`, so they cross shadow boundaries and are observable on the
   * host regardless of which internal element held focus.
   */
  private installFocusTracking(): void {
    if (!isBrowserEnvironment() || this.focusBindings.length > 0) {
      return;
    }
    const host = this.getHostElement();
    if (!host) {
      return;
    }
    const onFocusIn: EventListener = () => {
      if (this.destroyed) {
        return;
      }
      this.focusWithin = true;
      // A new focus session re-arms the one-shot touch guard.
      this.touchedThisSession = false;
    };
    const onFocusOut: EventListener = (event) => {
      if (this.destroyed) {
        return;
      }
      this.handleFocusOut(event as FocusEvent);
    };
    host.addEventListener('focusin', onFocusIn);
    host.addEventListener('focusout', onFocusOut);
    this.focusBindings.push(['focusin', onFocusIn], ['focusout', onFocusOut]);
  }

  /** Remove the focus-tracking listeners. */
  private removeFocusTracking(): void {
    if (this.focusBindings.length === 0) {
      return;
    }
    const host = this.getHostElement();
    if (host) {
      for (const [name, handler] of this.focusBindings) {
        host.removeEventListener(name, handler);
      }
    }
    this.focusBindings = [];
  }

  /**
   * Handle a `focusout` on the host. Fire `onTouched` ONCE if focus truly left
   * the control. "Left" means the new focus target (`relatedTarget`) is NOT
   * within the host. When `relatedTarget` is null (focus moved to the document /
   * body, or the browser did not report it), fall back to the document's
   * `activeElement`: if it is still inside the host, the control still has focus;
   * otherwise focus genuinely left.
   */
  private handleFocusOut(event: FocusEvent): void {
    const host = this.getHostElement();
    if (!host) {
      return;
    }
    const related = event.relatedTarget as Node | null;
    if (related) {
      // Internal move (focus went to another element inside the control) → no
      // touch. `contains` crosses shadow boundaries only via the host, so we also
      // accept a related target that is (or is inside) a shadow descendant of the
      // host through the composed path.
      if (this.isWithinControl(host, related)) {
        return;
      }
    } else {
      // relatedTarget unknown (common for programmatic blur / body focus). Consult
      // the document's active element as the authoritative "where did focus go".
      const active = (this.getRootNodeFor(host)?.activeElement as Node | null) ?? null;
      if (active && this.isWithinControl(host, active)) {
        return;
      }
    }

    // Focus left the whole control.
    this.focusWithin = false;
    if (this.touchedThisSession) {
      return;
    }
    this.touchedThisSession = true;
    this.fireTouched();
  }

  /**
   * True if `node` is the host, contained by the host, or reachable from the host
   * through the shadow-DOM chain (i.e. inside the control's composed subtree).
   */
  private isWithinControl(host: HTMLElement, node: Node): boolean {
    if (node === host || host.contains(node)) {
      return true;
    }
    // `node` may be inside a shadow root nested under the host; walk down the
    // host's shadow chain and test containment in each root.
    let current: Element | null = host;
    while (current && current.shadowRoot) {
      const root = current.shadowRoot;
      if (node === root || root.contains(node)) {
        return true;
      }
      current = findShadowRootHost(root);
    }
    return false;
  }

  /** The component host element (the `smilodon-angular-select` wrapper). */
  private getHostElement(): HTMLElement | null {
    return this.element?.nativeElement ?? null;
  }

  /** The root node (document or shadow root) that hosts the given element. */
  private getRootNodeFor(node: Node): Document | ShadowRoot | null {
    const root = node.getRootNode?.();
    if (root && (root.nodeType === 9 /* Document */ || (root as ShadowRoot).host)) {
      return root as Document | ShadowRoot;
    }
    return typeof document !== 'undefined' ? document : null;
  }

  // ── S4: provenance (user-input probes on the element's shadow root) ─────────

  /**
   * The recorded origin of the element's most recent SELECTION SYNC. A user
   * gesture (click / keyboard) that mutates selection sets it to `'user'`; an
   * adapter programmatic application sets it to `'programmatic'`. It starts
   * `'programmatic'` so nothing is ever mistaken for a user edit before the
   * first real gesture.
   */
  private origin: 'user' | 'programmatic' = 'programmatic';

  /**
   * Monotonic counter of user gestures observed (keyboard activation while open,
   * option click, chip-remove click, clear-control click). `currentUserSeq`
   * identifies the most recent gesture; `lastUserSeq` is the last gesture that was
   * CONSUMED by a `change`. A `change` is a user edit iff a user gesture occurred
   * after the last consumed one — this naturally covers single gestures that emit
   * several events (e.g. select-all: one keydown → `select` + `change`) AND
   * ignores stale gestures (a gesture that produced no selection change).
   */
  private currentUserSeq = 0;
  private lastUserSeq = 0;

  /**
   * Attach capture-phase user-input probes to every shadow root of the element
   * (deepest-first), ONCE. Idempotent.
   *
   * The probes record a user gesture on `click` / `keydown` within the shadow
   * tree. Programmatic-vs-user for each `change` is then resolved by the gesture
   * sequence + the programmatic-application window in
   * `handleChangeForValueAccessor` — no `change` sentinel is needed, keeping the
   * S3 event-listener ownership boundary intact.
   */
  private installProvenanceProbes(): void {
    if (!isBrowserEnvironment()) {
      return;
    }
    const element = this.getSelectElement();
    if (!element) {
      return;
    }
    // Walk the shadow DOM chain deepest-first and attach a probe to each shadow
    // root not yet probed, so a click anywhere in the (nested) shadow tree is
    // captured during the capture phase, before any handler.
    let node: Element | null = element;
    while (node && node.shadowRoot) {
      const root = node.shadowRoot;
      if (!this.probedRoots.has(root)) {
        root.addEventListener('click', this.provenanceUserGesture, true);
        root.addEventListener('keydown', this.provenanceUserGesture, true);
        this.probedRoots.add(root);
        this.patrolRoots.push(root);
      }
      node = findShadowRootHost(root);
    }
  }

  /** Shadow roots already probed (prevents duplicate capture listeners). */
  private probedRoots = new Set<ShadowRoot>();

  /** Capture-phase probe: any click/keydown in the shadow tree is a user gesture. */
  private readonly provenanceUserGesture = (event: Event): void => {
    if (this.destroyed) {
      return;
    }
    this.noteUserGesture(event);
  };

  /**
   * Record a user gesture. Only the gestures that can cause a SELECTION mutation
   * count: a `keydown` on an interactive key while the popup is open, a click on
   * an option, or a click on a chip-remove button / the clear control. (A plain
   * `click` that merely opens the list, or an arrow-key navigation, must NOT arm
   * a phantom user edit.) We classify here so `origin` is precise.
   */
  private noteUserGesture(event: Event): void {
    const target = event.target as HTMLElement | null;
    // Correct core part/attribute hooks: clear control = `part="clear-button"`,
    // chip remove = `part="chip-remove"`, option = `[data-index]` / `role=option`.
    const isClearControl = !!target?.closest?.('.clear-control-button, [part~="clear-button"]');
    const isChipRemove = !!target?.closest?.('[part~="chip-remove"], .badge-remove');
    const isOption = !!target?.closest?.('[data-index], [role="option"]');

    if (event.type === 'click') {
      // Option click, chip-remove click, or clear-control click = user edit.
      if (isOption || isChipRemove || isClearControl) {
        this.currentUserSeq += 1;
        this.origin = 'user';
      }
      return;
    }

    // keydown: only selection-performing keys while the listbox is open.
    if (event.type === 'keydown' && this.isOpen()) {
      const key = (event as KeyboardEvent).key;
      if (SELECTION_KEYS.has(key)) {
        this.currentUserSeq += 1;
        this.origin = 'user';
      }
    }
  }

  /**
   * Open a programmatic-application window. Set the origin to `'programmatic'`
   * so a `change` produced synchronously by the application is never a user edit,
   * and record WHY the application is in progress (`'init'` / `'write'`). Only
   * those synchronous reasons are adjudicated synchronously by
   * `handleChangeForValueAccessor`; an asynchronous application leaves
   * `programmaticReason === null` so a real user gesture in the await gap is not
   * swallowed.
   */
  private openProgrammaticChange(): void {
    this.origin = 'programmatic';
    this.programmaticReason = this.ready ? 'write' : 'init';
  }

  /**
   * Close the programmatic-application window once the (synchronous part of the)
   * `setSelectedValues()` call has returned. Because a synchronous application's
   * change(s) are fully delivered before `setSelectedValues()` returns, a still
   * `'programmatic'` origin at this point means no change came from it. We then
   * CONSUME any pending gesture: a no-op writeValue (e.g. current model ===
   * element selection) must not leave a stale gesture armed that would later be
   * mis-attributed to an unrelated programmatic change.
   */
  private closeProgrammaticChange(): void {
    if (this.origin === 'programmatic') {
      this.lastUserSeq = this.currentUserSeq;
    }
    this.programmaticReason = null;
  }

  /** True when the element's popup is open (best-effort, structural + DOM). */
  private isOpen(): boolean {
    const element = this.getSelectElement() as unknown as {
      _state?: { isOpen?: boolean };
      shadowRoot: ShadowRoot | null;
    } | null;
    if (!element) {
      return false;
    }
    if (typeof element._state?.isOpen === 'boolean') {
      return element._state.isOpen;
    }
    // DOM fallback: the combobox is `aria-expanded="true"` while open.
    const input = element.shadowRoot?.querySelector('[role="combobox"]');
    return input?.getAttribute('aria-expanded') === 'true';
  }

  /** Detach every probe added by `installProvenanceProbes`. */
  private removeProvenanceProbes(): void {
    for (const root of this.patrolRoots) {
      root.removeEventListener('click', this.provenanceUserGesture, true);
      root.removeEventListener('keydown', this.provenanceUserGesture, true);
    }
    this.patrolRoots = [];
    this.probedRoots.clear();
  }

  /** Build a single config object from the flags + passthrough config. */
  private buildConfig(): SelectInstanceConfig {
    const base: SelectInstanceConfig = {
      enabled: !this.isDisabled(),
      searchable: this.searchable,
      selection: { mode: this.multiple ? 'multi' : 'single' },
    };
    if (this.placeholder !== undefined) {
      base.placeholder = this.placeholder;
    }
    return this.mergeConfig(base, this.config);
  }

  /**
   * Derived disabled state: form-driven disabled wins when the control is in a
   * form; otherwise the `disabled` input governs. (A single source for the two.)
   */
  private isDisabled(): boolean {
    return this.isFormControlled ? this.formDisabled : this.formDisabled || this.disabled;
  }

  private mergeConfig(
    base: SelectInstanceConfig,
    override: SelectInstanceConfig | null,
  ): SelectInstanceConfig {
    if (!override) {
      return base;
    }
    return {
      ...base,
      ...override,
      selection: { ...base.selection, ...override.selection } as SelectInstanceConfig['selection'],
    };
  }
}
