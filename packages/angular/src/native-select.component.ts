import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
} from '@angular/core';

/**
 * Selection event detail
 */
export interface SelectEventDetail {
  indices: number[];
  items: any[];
  source: 'click' | 'keyboard' | 'api';
}

/**
 * Open event detail
 */
export interface OpenEventDetail {
  timestamp: number;
}

/**
 * Close event detail
 */
export interface CloseEventDetail {
  timestamp: number;
}

/**
 * Search event detail
 */
export interface SearchEventDetail {
  query: string;
  timestamp: number;
}

/**
 * Native Select Component for Angular
 * 
 * A high-performance select component with virtual scrolling support.
 * Wraps the @native-select/core web component for Angular integration.
 * 
 * @example
 * ```typescript
 * <native-select
 *   [items]="items"
 *   [multiple]="true"
 *   (select)="handleSelect($event)">
 * </native-select>
 * ```
 */
@Component({
  selector: 'native-select',
  template: `<div #container></div>`,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NativeSelectComponent<T = any> implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('container', { static: true }) container!: ElementRef<HTMLDivElement>;

  /** Array of items to display */
  @Input() items: T[] = [];

  /** Currently selected item indices */
  @Input() selectedIndices: number[] = [];

  /** Enable multi-select */
  @Input() multiple = false;

  /** Enable virtual scrolling */
  @Input() virtualized = false;

  /** Estimated height of each item in pixels */
  @Input() estimatedItemHeight = 48;

  /** Number of items to render outside viewport */
  @Input() buffer = 5;

  /** Enable search/filter functionality */
  @Input() searchable = false;

  /** Placeholder text */
  @Input() placeholder = 'Select...';

  /** Disable the select */
  @Input() disabled = false;

  /** Popup placement */
  @Input() placement: 'top' | 'bottom' = 'bottom';

  /** Emitted when selection changes */
  @Output() select = new EventEmitter<SelectEventDetail>();

  /** Emitted when dropdown opens */
  @Output() open = new EventEmitter<OpenEventDetail>();

  /** Emitted when dropdown closes */
  @Output() close = new EventEmitter<CloseEventDetail>();

  /** Emitted when search query changes */
  @Output() search = new EventEmitter<SearchEventDetail>();

  private element?: any;
  private listeners: Array<() => void> = [];

  ngAfterViewInit(): void {
    this.initializeElement();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.element) return;

    if (changes['items'] && !changes['items'].firstChange) {
      this.element.items = this.items;
    }

    if (changes['selectedIndices'] && !changes['selectedIndices'].firstChange) {
      this.element.selectedIndices = this.selectedIndices;
    }

    if (changes['multiple']) {
      this.element.multi = this.multiple;
    }

    if (changes['virtualized']) {
      this.element.virtualized = this.virtualized;
    }

    if (changes['estimatedItemHeight']) {
      this.element.estimatedItemHeight = this.estimatedItemHeight;
    }

    if (changes['buffer']) {
      this.element.buffer = this.buffer;
    }

    if (changes['searchable']) {
      this.element.searchable = this.searchable;
    }

    if (changes['placeholder']) {
      this.element.placeholder = this.placeholder;
    }

    if (changes['disabled']) {
      this.element.disabled = this.disabled;
    }

    if (changes['placement']) {
      this.element.placement = this.placement;
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  /**
   * Open the dropdown programmatically
   */
  public open(): void {
    this.element?.open();
  }

  /**
   * Close the dropdown programmatically
   */
  public close(): void {
    this.element?.close();
  }

  /**
   * Set selected indices programmatically
   */
  public setSelectedIndices(indices: number[]): void {
    if (this.element) {
      this.element.selectedIndices = indices;
      this.selectedIndices = indices;
    }
  }

  /**
   * Scroll to a specific item index
   */
  public scrollToIndex(index: number): void {
    this.element?.scrollToIndex(index);
  }

  /**
   * Focus the select element
   */
  public focus(): void {
    this.element?.focus();
  }

  /**
   * Get current selected indices
   */
  public getSelectedIndices(): number[] {
    return this.element?.selectedIndices || [];
  }

  /**
   * Get current selected items
   */
  public getSelectedItems(): T[] {
    return this.element?.selectedItems || [];
  }

  private async initializeElement(): Promise<void> {
    // Dynamically import and register the custom element
    if (typeof window !== 'undefined' && !customElements.get('native-select')) {
      const module = await import('@native-select/core');
      if (!customElements.get('native-select')) {
        customElements.define('native-select', module.NativeSelectElement);
      }
    }

    // Create the element
    this.element = document.createElement('native-select');
    
    // Set initial properties
    this.element.items = this.items;
    this.element.selectedIndices = this.selectedIndices;
    this.element.multi = this.multiple;
    this.element.virtualized = this.virtualized;
    this.element.estimatedItemHeight = this.estimatedItemHeight;
    this.element.buffer = this.buffer;
    this.element.searchable = this.searchable;
    this.element.placeholder = this.placeholder;
    this.element.disabled = this.disabled;
    this.element.placement = this.placement;

    // Attach event listeners
    this.attachEventListeners();

    // Append to container
    this.container.nativeElement.appendChild(this.element);
  }

  private attachEventListeners(): void {
    if (!this.element) return;

    const handleSelect = (e: CustomEvent<SelectEventDetail>) => {
      this.select.emit(e.detail);
    };

    const handleOpen = (e: CustomEvent<OpenEventDetail>) => {
      this.open.emit(e.detail);
    };

    const handleClose = (e: CustomEvent<CloseEventDetail>) => {
      this.close.emit(e.detail);
    };

    const handleSearch = (e: CustomEvent<SearchEventDetail>) => {
      this.search.emit(e.detail);
    };

    this.element.addEventListener('select', handleSelect);
    this.element.addEventListener('open', handleOpen);
    this.element.addEventListener('close', handleClose);
    this.element.addEventListener('search', handleSearch);

    // Store cleanup functions
    this.listeners.push(
      () => this.element?.removeEventListener('select', handleSelect),
      () => this.element?.removeEventListener('open', handleOpen),
      () => this.element?.removeEventListener('close', handleClose),
      () => this.element?.removeEventListener('search', handleSearch)
    );
  }

  private cleanup(): void {
    this.listeners.forEach((fn) => fn());
    this.listeners = [];
    
    if (this.element && this.container?.nativeElement.contains(this.element)) {
      this.container.nativeElement.removeChild(this.element);
    }
    
    this.element = undefined;
  }
}
