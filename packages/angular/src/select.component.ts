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
 *   4. reconciles later @Input() changes once the element is ready; and
 *   5. ignores any pending async init after destroy (safe async lifecycle).
 *
 * Out of scope for S2 (later slices): @Output() event bridge (S3),
 * ControlValueAccessor (S4), SSR rendering/hydration qualification (S5).
 */

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
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
  styles: [':host { display: block; } :host enhanced-select { display: block; }'],
})
export class SmilodonSelectComponent implements AfterViewInit, OnChanges, OnDestroy {
  /** Flat list of selectable items (ignored when `groupedItems` is set). */
  @Input() items: SmilodonSelectItem[] | null = null;
  /** Grouped items; takes precedence over `items` when provided. */
  @Input() groupedItems: CoreGroupedItem[] | null = null;
  /** Selected values. Applied via `setSelectedValues()`. */
  @Input() value: Array<string | number> | null = null;
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

  private readonly element: ElementRef<HTMLElement> = inject(ElementRef);

  ngAfterViewInit(): void {
    if (!isBrowserEnvironment()) {
      // Server / non-DOM: render the placeholder host only, never touch core.
      return;
    }
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
  }

  /** Exposed for tests/inspection: true once the element is ready. */
  get isReady(): boolean {
    return this.ready;
  }

  /** Exposed for tests/inspection: any initialization error, if one occurred. */
  get initializationError(): unknown {
    return this.initError;
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

    // 4. Selected values (async in core). Fire-and-forget; core guards against
    //    post-disconnect application internally.
    if (this.value) {
      void element.setSelectedValues(this.value as unknown[]);
    }
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
