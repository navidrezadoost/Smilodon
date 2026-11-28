/**
 * @smilodon/angular — S2 minimal standalone component (CSR).
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
 *   5. ignores any pending async init after destroy (safe async lifecycle); and
 *   6. forwards the element's `CustomEvent`s to typed `@Output()`s via a single
 *      listener set installed before init and removed on destroy (S3 bridge).
 *
 * Out of scope (later slices): ControlValueAccessor (S4), SSR rendering/
 * hydration qualification (S5).
 */

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
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
 * Minimal browser-deferred Angular select host.
 *
 * @example
 * ```html
 * <smilodon-select
 *   [items]="items"
 *   [value]="selectedValues"
 *   [multiple]="true"
 *   (change)="onChange($event)">
 * </smilodon-select>
 * ```
 */
@Component({
  selector: 'smilodon-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<enhanced-select #host></enhanced-select>',
  // `<enhanced-select>` is a custom element owned by @smilodon/core (not an
  // Angular component), so the schema must permit unknown elements for AOT.
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styles: [':host { display: block; } :host enhanced-select { display: block; }'],
})
export class SmilodonSelectComponent implements AfterViewInit, OnChanges, OnDestroy {
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

    // 4. Selected values (async in core). This is a CONTROLLED input:
    //    - `undefined`  → no selection binding supplied; leave selection alone.
    //    - array / `[]` → apply as-is (empty array clears).
    //    - `null`       → explicit clear (empty selection).
    //    The async promise is awaited under a generation guard so a stale
    //    rejection can't surface and a stale success can't win a race.
    if (this.value !== undefined) {
      this.applySelectedValues(element, (this.value ?? []) as unknown[]);
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

    let result: Promise<void>;
    try {
      result = element.setSelectedValues(values);
    } catch (error) {
      // Defensive: a synchronous throw must not escape into Angular.
      if (isCurrent()) {
        this.valueError = error;
      }
      return;
    }

    Promise.resolve(result).then(
      () => {
        if (isCurrent()) {
          this.valueError = null;
        }
      },
      (error) => {
        // Only the latest, live application reports its failure; stale or
        // post-destroy ones are ignored.
        if (isCurrent()) {
          this.valueError = error;
        }
      },
    );
  }

  /** Build a single config object from the flags + passthrough config. */
  private buildConfig(): SelectInstanceConfig {
    const base: SelectInstanceConfig = {
      enabled: !this.disabled,
      searchable: this.searchable,
      selection: { mode: this.multiple ? 'multi' : 'single' },
    };
    if (this.placeholder !== undefined) {
      base.placeholder = this.placeholder;
    }
    return this.mergeConfig(base, this.config);
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
