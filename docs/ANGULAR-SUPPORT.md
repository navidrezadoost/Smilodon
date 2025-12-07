# Angular Support Documentation

**Status:** ✅ Fully Supported  
**Package:** `@native-select/angular`  
**Version:** 1.0.0+  
**Angular Compatibility:** 14.0.0+

---

## Overview

Smilodon provides first-class support for Angular with a dedicated Angular module that wraps the core Web Component. The Angular adapter provides full TypeScript support, reactive bindings, and follows Angular best practices.

---

## Installation

```bash
npm install @native-select/core @native-select/angular
```

or with yarn:

```bash
yarn add @native-select/core @native-select/angular
```

---

## Module Setup

### Import the Module

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NativeSelectModule } from '@native-select/angular';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    NativeSelectModule  // Add this
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### Standalone Components (Angular 14+)

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { NativeSelectComponent } from '@native-select/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NativeSelectComponent],
  template: `
    <native-select
      [items]="items"
      (select)="handleSelect($event)">
    </native-select>
  `
})
export class AppComponent {
  items = [
    { id: 1, label: 'Apple' },
    { id: 2, label: 'Banana' }
  ];
  
  handleSelect(event: any) {
    console.log(event);
  }
}
```

---

## Basic Usage

### Simple Select

```typescript
import { Component } from '@angular/core';

interface Fruit {
  id: number;
  label: string;
}

@Component({
  selector: 'app-fruit-select',
  template: `
    <native-select
      [items]="fruits"
      [placeholder]="'Select a fruit'"
      (select)="onFruitSelect($event)">
    </native-select>
  `
})
export class FruitSelectComponent {
  fruits: Fruit[] = [
    { id: 1, label: 'Apple' },
    { id: 2, label: 'Banana' },
    { id: 3, label: 'Cherry' },
    { id: 4, label: 'Date' },
    { id: 5, label: 'Elderberry' }
  ];
  
  selectedFruit: Fruit | null = null;
  
  onFruitSelect(event: { indices: number[]; items: Fruit[] }) {
    this.selectedFruit = event.items[0];
    console.log('Selected fruit:', this.selectedFruit);
  }
}
```

### Multi-Select

```typescript
@Component({
  selector: 'app-multi-select',
  template: `
    <native-select
      [items]="items"
      [multiple]="true"
      [selectedIndices]="selectedIndices"
      (select)="onSelect($event)">
    </native-select>
    
    <div *ngIf="selectedItems.length > 0">
      <h3>Selected Items:</h3>
      <ul>
        <li *ngFor="let item of selectedItems">{{ item.label }}</li>
      </ul>
    </div>
  `
})
export class MultiSelectComponent {
  items = [
    { id: 1, label: 'Option 1' },
    { id: 2, label: 'Option 2' },
    { id: 3, label: 'Option 3' }
  ];
  
  selectedIndices: number[] = [];
  selectedItems: any[] = [];
  
  onSelect(event: any) {
    this.selectedIndices = event.indices;
    this.selectedItems = event.items;
  }
}
```

### Large Dataset with Virtualization

```typescript
@Component({
  selector: 'app-large-select',
  template: `
    <native-select
      [items]="largeDataset"
      [virtualized]="true"
      [estimatedItemHeight]="48"
      [buffer]="10"
      [searchable]="true"
      (select)="onSelect($event)">
    </native-select>
  `
})
export class LargeSelectComponent implements OnInit {
  largeDataset: any[] = [];
  
  ngOnInit() {
    // Generate 100,000 items
    this.largeDataset = Array.from({ length: 100000 }, (_, i) => ({
      id: i,
      label: `Item ${i + 1}`
    }));
  }
  
  onSelect(event: any) {
    console.log('Selected from 100K items:', event.items[0]);
  }
}
```

---

## Component API

### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `items` | `T[]` | `[]` | Array of items to display |
| `selectedIndices` | `number[]` | `[]` | Currently selected item indices |
| `multiple` | `boolean` | `false` | Enable multi-selection |
| `virtualized` | `boolean` | `false` | Enable virtual scrolling for large lists |
| `estimatedItemHeight` | `number` | `48` | Estimated height of each item (px) |
| `buffer` | `number` | `5` | Number of extra items to render outside viewport |
| `searchable` | `boolean` | `false` | Enable search/filter functionality |
| `placeholder` | `string` | `'Select...'` | Placeholder text |
| `disabled` | `boolean` | `false` | Disable the select |

### Outputs

| Output | Event Type | Description |
|--------|------------|-------------|
| `select` | `{ indices: number[]; items: T[] }` | Emitted when selection changes |
| `open` | `void` | Emitted when dropdown opens |
| `close` | `void` | Emitted when dropdown closes |

### Methods

Access component methods via `@ViewChild`:

```typescript
@ViewChild(NativeSelectComponent) select!: NativeSelectComponent;

// Programmatic control
this.select.open();
this.select.close();
this.select.setSelectedIndices([0, 1, 2]);
this.select.scrollToIndex(100);
```

---

## Advanced Examples

### Reactive Forms Integration

```typescript
import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-form-select',
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <native-select
        [items]="countries"
        [selectedIndices]="selectedCountryIndices"
        (select)="onCountrySelect($event)">
      </native-select>
      
      <button type="submit" [disabled]="!form.valid">Submit</button>
    </form>
  `
})
export class FormSelectComponent {
  form: FormGroup;
  countries = [
    { id: 'us', label: 'United States' },
    { id: 'uk', label: 'United Kingdom' },
    { id: 'ca', label: 'Canada' }
  ];
  
  selectedCountryIndices: number[] = [];
  
  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      country: ['']
    });
  }
  
  onCountrySelect(event: any) {
    this.selectedCountryIndices = event.indices;
    const country = event.items[0];
    this.form.patchValue({ country: country?.id });
  }
  
  onSubmit() {
    console.log('Form value:', this.form.value);
  }
}
```

### Template Reference Variable

```typescript
@Component({
  selector: 'app-template-ref',
  template: `
    <native-select
      #mySelect
      [items]="items"
      (select)="onSelect($event)">
    </native-select>
    
    <button (click)="mySelect.open()">Open Dropdown</button>
    <button (click)="mySelect.close()">Close Dropdown</button>
  `
})
export class TemplateRefComponent {
  items = [/* ... */];
  
  onSelect(event: any) {
    console.log(event);
  }
}
```

### Custom Item Template

```typescript
@Component({
  selector: 'app-custom-template',
  template: `
    <native-select
      [items]="users"
      (select)="onUserSelect($event)">
      <ng-template #itemTemplate let-item>
        <div class="user-item">
          <img [src]="item.avatar" [alt]="item.name">
          <div>
            <div class="user-name">{{ item.name }}</div>
            <div class="user-email">{{ item.email }}</div>
          </div>
        </div>
      </ng-template>
    </native-select>
  `,
  styles: [`
    .user-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .user-item img {
      width: 32px;
      height: 32px;
      border-radius: 50%;
    }
    .user-name {
      font-weight: 500;
    }
    .user-email {
      font-size: 0.875rem;
      color: #666;
    }
  `]
})
export class CustomTemplateComponent {
  users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', avatar: '/avatars/john.jpg' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', avatar: '/avatars/jane.jpg' }
  ];
  
  onUserSelect(event: any) {
    console.log('Selected user:', event.items[0]);
  }
}
```

---

## TypeScript Support

### Type Definitions

```typescript
import { NativeSelectComponent } from '@native-select/angular';

// Generic typing
interface Product {
  id: number;
  name: string;
  price: number;
}

@Component({
  template: `
    <native-select
      [items]="products"
      (select)="onProductSelect($event)">
    </native-select>
  `
})
export class ProductSelectComponent {
  @ViewChild(NativeSelectComponent) 
  selectRef!: NativeSelectComponent<Product>;
  
  products: Product[] = [
    { id: 1, name: 'Product 1', price: 99.99 },
    { id: 2, name: 'Product 2', price: 149.99 }
  ];
  
  onProductSelect(event: { indices: number[]; items: Product[] }) {
    const selectedProduct: Product = event.items[0];
    console.log(`Selected: ${selectedProduct.name} - $${selectedProduct.price}`);
  }
}
```

---

## Performance Optimization

### OnPush Change Detection

```typescript
import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-optimized-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <native-select
      [items]="items"
      [selectedIndices]="selectedIndices"
      (select)="onSelect($event)">
    </native-select>
  `
})
export class OptimizedSelectComponent {
  items = [/* ... */];
  selectedIndices: number[] = [];
  
  onSelect(event: any) {
    // Immutable update for OnPush
    this.selectedIndices = [...event.indices];
  }
}
```

### Lazy Loading Module

```typescript
// feature.module.ts
import { NgModule } from '@angular/core';
import { NativeSelectModule } from '@native-select/angular';

@NgModule({
  imports: [NativeSelectModule],
  declarations: [/* your components */]
})
export class FeatureModule { }

// app-routing.module.ts
const routes: Routes = [
  {
    path: 'feature',
    loadChildren: () => import('./feature/feature.module').then(m => m.FeatureModule)
  }
];
```

---

## SSR Support (Angular Universal)

Smilodon works seamlessly with Angular Universal:

```typescript
// No special configuration needed
// The component automatically detects SSR environment
// and renders appropriately
```

---

## Styling

### Global Styles

```scss
// styles.scss
native-select {
  --ns-bg-color: #ffffff;
  --ns-text-color: #333333;
  --ns-border-color: #cccccc;
  --ns-hover-bg-color: #f5f5f5;
  --ns-selected-bg-color: #e3f2fd;
  --ns-focus-ring-color: #2196f3;
}
```

### Component-Specific Styles

```typescript
@Component({
  selector: 'app-styled-select',
  template: `
    <native-select
      [items]="items"
      class="custom-select">
    </native-select>
  `,
  styles: [`
    .custom-select {
      --ns-bg-color: #f8f9fa;
      --ns-border-radius: 8px;
      --ns-padding: 12px;
    }
  `]
})
export class StyledSelectComponent {
  // ...
}
```

---

## Testing

### Unit Testing

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NativeSelectModule } from '@native-select/angular';
import { MyComponent } from './my.component';

describe('MyComponent', () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;
  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MyComponent],
      imports: [NativeSelectModule]
    }).compileComponents();
    
    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  
  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it('should emit select event', () => {
    spyOn(component, 'onSelect');
    
    // Simulate selection
    const selectEvent = { indices: [0], items: [component.items[0]] };
    component.onSelect(selectEvent);
    
    expect(component.onSelect).toHaveBeenCalledWith(selectEvent);
  });
});
```

---

## Migration from Other Libraries

### From ng-select

```typescript
// Before (ng-select)
<ng-select
  [items]="items"
  bindLabel="label"
  [(ngModel)]="selectedItem">
</ng-select>

// After (Smilodon)
<native-select
  [items]="items"
  [selectedIndices]="selectedIndices"
  (select)="onSelect($event)">
</native-select>
```

### From Angular Material Select

```typescript
// Before (Material)
<mat-select [(value)]="selected">
  <mat-option *ngFor="let item of items" [value]="item">
    {{ item.label }}
  </mat-option>
</mat-select>

// After (Smilodon)
<native-select
  [items]="items"
  [selectedIndices]="selectedIndices"
  (select)="onSelect($event)">
</native-select>
```

---

## Best Practices

1. **Use Type Safety**: Always type your item arrays
2. **Immutable Updates**: Use immutable patterns for OnPush strategy
3. **Virtualization**: Enable for lists > 100 items
4. **Lazy Loading**: Load the module only when needed
5. **Accessibility**: Provide meaningful labels and ARIA attributes
6. **Testing**: Write unit tests for selection logic

---

## Troubleshooting

### Common Issues

**Issue:** Component not rendering  
**Solution:** Ensure `NativeSelectModule` is imported in your module

**Issue:** TypeScript errors  
**Solution:** Update to Angular 14+ and ensure `@native-select/angular` is installed

**Issue:** Styles not applying  
**Solution:** Check ViewEncapsulation and CSS variable inheritance

---

## Resources

- [API Reference](./API-REFERENCE.md#angular-adapter)
- [Getting Started Guide](./GETTING-STARTED.md#angular)
- [Migration Guide](./MIGRATION.md)
- [GitHub Issues](https://github.com/navidrezadoost/smilodon/issues)

---

## Browser Support

Same as Smilodon core:
- Chrome 90+
- Firefox 88+
- Safari 14.1+
- Edge 90+

See [Browser Support Matrix](./compliance/BROWSER-SUPPORT.md) for details.

---

**Questions or feedback?** Open an issue on [GitHub](https://github.com/navidrezadoost/smilodon/issues)!
