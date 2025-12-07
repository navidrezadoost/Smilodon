import { Component } from '@angular/core';
import { NativeSelectComponent } from '../src/native-select.component';

/**
 * Example component demonstrating basic usage
 */
@Component({
  selector: 'app-basic-example',
  standalone: true,
  imports: [NativeSelectComponent],
  template: `
    <div class="example-container">
      <h2>Basic Select</h2>
      <native-select
        [items]="fruits"
        [placeholder]="'Select a fruit'"
        (select)="onFruitSelect($event)">
      </native-select>
      
      <div *ngIf="selectedFruit">
        Selected: {{ selectedFruit.label }}
      </div>
    </div>
  `,
  styles: [`
    .example-container {
      max-width: 400px;
      margin: 20px auto;
      padding: 20px;
    }
  `]
})
export class BasicExampleComponent {
  fruits = [
    { id: 1, label: 'Apple' },
    { id: 2, label: 'Banana' },
    { id: 3, label: 'Cherry' },
    { id: 4, label: 'Date' },
    { id: 5, label: 'Elderberry' }
  ];

  selectedFruit: any = null;

  onFruitSelect(event: any) {
    this.selectedFruit = event.items[0];
    console.log('Selected fruit:', this.selectedFruit);
  }
}

/**
 * Example component demonstrating multi-select
 */
@Component({
  selector: 'app-multi-select-example',
  standalone: true,
  imports: [NativeSelectComponent],
  template: `
    <div class="example-container">
      <h2>Multi-Select</h2>
      <native-select
        [items]="items"
        [multiple]="true"
        [selectedIndices]="selectedIndices"
        (select)="onSelect($event)">
      </native-select>
      
      <div *ngIf="selectedItems.length > 0">
        <h3>Selected Items ({{ selectedItems.length }}):</h3>
        <ul>
          <li *ngFor="let item of selectedItems">{{ item.label }}</li>
        </ul>
      </div>
    </div>
  `
})
export class MultiSelectExampleComponent {
  items = [
    { id: 1, label: 'Option 1' },
    { id: 2, label: 'Option 2' },
    { id: 3, label: 'Option 3' },
    { id: 4, label: 'Option 4' },
    { id: 5, label: 'Option 5' }
  ];

  selectedIndices: number[] = [];
  selectedItems: any[] = [];

  onSelect(event: any) {
    this.selectedIndices = event.indices;
    this.selectedItems = event.items;
    console.log('Selected items:', this.selectedItems);
  }
}

/**
 * Example component demonstrating virtual scrolling
 */
@Component({
  selector: 'app-virtual-scroll-example',
  standalone: true,
  imports: [NativeSelectComponent],
  template: `
    <div class="example-container">
      <h2>Virtual Scrolling ({{ largeDataset.length }} items)</h2>
      <native-select
        [items]="largeDataset"
        [virtualized]="true"
        [estimatedItemHeight]="48"
        [buffer]="10"
        [searchable]="true"
        (select)="onSelect($event)">
      </native-select>
      
      <div *ngIf="selectedItem">
        Selected: {{ selectedItem.label }}
      </div>
    </div>
  `
})
export class VirtualScrollExampleComponent {
  largeDataset: any[] = [];
  selectedItem: any = null;

  constructor() {
    // Generate 100,000 items
    this.largeDataset = Array.from({ length: 100000 }, (_, i) => ({
      id: i,
      label: `Item ${i + 1}`
    }));
  }

  onSelect(event: any) {
    this.selectedItem = event.items[0];
    console.log('Selected from 100K items:', this.selectedItem);
  }
}
