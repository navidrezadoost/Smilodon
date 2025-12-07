/**
 * Angular Adapter for Enhanced Select Component
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { GlobalSelectConfig } from '../../core/src/config/global-config';

export interface SelectChangeEvent {
  items: unknown[];
  values: unknown[];
}

export interface SelectOptionEvent {
  item: unknown;
  index: number;
  value: unknown;
  label: string;
  selected: boolean;
}

@Component({
  selector: 'smilodon-select',
  template: '<div #container [class]="className" [ngStyle]="style"></div>',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
})
export class SelectComponent implements OnInit, OnDestroy, OnChanges, ControlValueAccessor {
  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  @Input() items: unknown[] = [];
  @Input() initialSelectedValues?: unknown[];
  @Input() config: Partial<GlobalSelectConfig> = {};
  @Input() className: string = '';
  @Input() style: { [key: string]: string } = {};

  @Output() change = new EventEmitter<SelectChangeEvent>();
  @Output() select = new EventEmitter<SelectOptionEvent>();
  @Output() open = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
  @Output() search = new EventEmitter<string>();
  @Output() loadMore = new EventEmitter<number>();
  @Output() error = new EventEmitter<Error>();

  private selectElement: any = null;
  private onChange: (value: unknown[]) => void = () => {};
  private onTouched: () => void = () => {};

  async ngOnInit(): Promise<void> {
    // Dynamically import the enhanced select component
    const { EnhancedSelect } = await import('../../core/src/components/enhanced-select');

    const select = document.createElement('enhanced-select') as any;
    this.containerRef.nativeElement.appendChild(select);
    this.selectElement = select;

    // Apply configuration
    select.updateConfig({
      ...this.config,
      callbacks: {
        onSelect: (data: any) => this.select.emit(data),
        onOpen: () => this.open.emit(),
        onClose: () => {
          this.close.emit();
          this.onTouched();
        },
        onSearch: (query: string) => this.search.emit(query),
        onLoadMore: (page: number) => this.loadMore.emit(page),
        onError: (error: Error) => this.error.emit(error),
        onChange: (items: unknown[], values: unknown[]) => {
          this.change.emit({ items, values });
          this.onChange(values);
        },
      },
    });

    // Set initial items
    if (this.items.length > 0) {
      select.setItems(this.items);
    }

    // Set initial selected values
    if (this.initialSelectedValues) {
      await select.setSelectedValues(this.initialSelectedValues);
    }
  }

  ngOnDestroy(): void {
    if (this.selectElement && this.containerRef) {
      this.containerRef.nativeElement.removeChild(this.selectElement);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.selectElement) return;

    if (changes['items'] && !changes['items'].firstChange) {
      this.selectElement.setItems(this.items);
    }

    if (changes['config'] && !changes['config'].firstChange) {
      this.selectElement.updateConfig(this.config);
    }
  }

  // ControlValueAccessor implementation
  writeValue(values: unknown[]): void {
    if (this.selectElement && values !== undefined && values !== null) {
      this.selectElement.setSelectedValues(values);
    }
  }

  registerOnChange(fn: (value: unknown[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (this.selectElement) {
      this.selectElement.updateConfig({
        enabled: !isDisabled,
      });
    }
  }

  // Public API methods
  getSelectedItems(): unknown[] {
    return this.selectElement?.getSelectedItems() || [];
  }

  getSelectedValues(): unknown[] {
    return this.selectElement?.getSelectedValues() || [];
  }

  async setSelectedValues(values: unknown[]): Promise<void> {
    await this.selectElement?.setSelectedValues(values);
  }

  clear(): void {
    this.selectElement?.clear();
  }

  openDropdown(): void {
    this.selectElement?.open();
  }

  closeDropdown(): void {
    this.selectElement?.close();
  }

  updateConfiguration(config: Partial<GlobalSelectConfig>): void {
    this.selectElement?.updateConfig(config);
  }

  setItems(items: unknown[]): void {
    this.items = items;
    this.selectElement?.setItems(items);
  }
}
