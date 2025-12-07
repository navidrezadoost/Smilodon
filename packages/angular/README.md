# @native-select/angular

Angular adapter for [@native-select/core](../core) - High-performance select component with virtual scrolling.

## Features

- 🚀 **High Performance**: Virtual scrolling for large datasets (100K+ items)
- 📦 **Tiny Bundle**: Only +892 bytes on top of core (6.6KB)
- 🎯 **Angular Integration**: Full TypeScript support with reactive bindings
- ♿ **Accessible**: WCAG 2.2 Level AA compliant
- 🔒 **Secure**: CSP-compliant, XSS prevention
- 📱 **SSR Compatible**: Works with Angular Universal

## Installation

```bash
npm install @native-select/core @native-select/angular
```

## Quick Start

### Module Import

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { NativeSelectModule } from '@native-select/angular';

@NgModule({
  imports: [NativeSelectModule],
  // ...
})
export class AppModule { }
```

### Standalone Component (Angular 14+)

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
    { id: 2, label: 'Banana' },
    { id: 3, label: 'Cherry' }
  ];
  
  handleSelect(event: any) {
    console.log('Selected:', event.items);
  }
}
```

## Basic Usage

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-example',
  template: `
    <native-select
      [items]="items"
      [multiple]="false"
      [placeholder]="'Select a fruit'"
      (select)="onSelect($event)">
    </native-select>
  `
})
export class ExampleComponent {
  items = [
    { id: 1, label: 'Apple' },
    { id: 2, label: 'Banana' },
    { id: 3, label: 'Cherry' }
  ];
  
  onSelect(event: { indices: number[]; items: any[] }) {
    console.log('Selected indices:', event.indices);
    console.log('Selected items:', event.items);
  }
}
```

## Multi-Select

```typescript
@Component({
  template: `
    <native-select
      [items]="items"
      [multiple]="true"
      [selectedIndices]="selectedIndices"
      (select)="onSelect($event)">
    </native-select>
  `
})
export class MultiSelectComponent {
  items = [/* ... */];
  selectedIndices: number[] = [];
  
  onSelect(event: any) {
    this.selectedIndices = event.indices;
  }
}
```

## Virtual Scrolling (Large Datasets)

```typescript
@Component({
  template: `
    <native-select
      [items]="largeDataset"
      [virtualized]="true"
      [estimatedItemHeight]="48"
      [buffer]="10"
      (select)="onSelect($event)">
    </native-select>
  `
})
export class LargeSelectComponent {
  largeDataset = Array.from({ length: 100000 }, (_, i) => ({
    id: i,
    label: `Item ${i + 1}`
  }));
  
  onSelect(event: any) {
    console.log('Selected from 100K items:', event.items[0]);
  }
}
```

## API

### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `items` | `T[]` | `[]` | Array of items to display |
| `selectedIndices` | `number[]` | `[]` | Currently selected item indices |
| `multiple` | `boolean` | `false` | Enable multi-selection |
| `virtualized` | `boolean` | `false` | Enable virtual scrolling |
| `estimatedItemHeight` | `number` | `48` | Estimated height of each item (px) |
| `buffer` | `number` | `5` | Extra items to render outside viewport |
| `searchable` | `boolean` | `false` | Enable search/filter |
| `placeholder` | `string` | `'Select...'` | Placeholder text |
| `disabled` | `boolean` | `false` | Disable the select |
| `placement` | `'top' \| 'bottom'` | `'bottom'` | Dropdown placement |

### Outputs

| Output | Event Type | Description |
|--------|------------|-------------|
| `select` | `{ indices: number[]; items: T[] }` | Emitted when selection changes |
| `open` | `{ timestamp: number }` | Emitted when dropdown opens |
| `close` | `{ timestamp: number }` | Emitted when dropdown closes |
| `search` | `{ query: string }` | Emitted when search query changes |

### Methods

Access component methods via `@ViewChild`:

```typescript
@ViewChild(NativeSelectComponent) select!: NativeSelectComponent;

// Methods
this.select.open();                      // Open dropdown
this.select.close();                     // Close dropdown
this.select.setSelectedIndices([0, 1]);  // Set selection
this.select.scrollToIndex(100);          // Scroll to item
this.select.focus();                     // Focus element
```

## Advanced Examples

### Reactive Forms Integration

```typescript
import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  template: `
    <form [formGroup]="form">
      <native-select
        [items]="items"
        [selectedIndices]="selectedIndices"
        (select)="onSelect($event)">
      </native-select>
    </form>
  `
})
export class FormComponent {
  form: FormGroup;
  selectedIndices: number[] = [];
  
  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      selection: ['']
    });
  }
  
  onSelect(event: any) {
    this.selectedIndices = event.indices;
    this.form.patchValue({ selection: event.items[0]?.id });
  }
}
```

### TypeScript Generics

```typescript
interface Product {
  id: number;
  name: string;
  price: number;
}

@Component({
  template: `<native-select [items]="products" (select)="onProductSelect($event)"></native-select>`
})
export class ProductSelectComponent {
  @ViewChild(NativeSelectComponent) select!: NativeSelectComponent<Product>;
  
  products: Product[] = [
    { id: 1, name: 'Product 1', price: 99.99 }
  ];
  
  onProductSelect(event: { items: Product[] }) {
    const product = event.items[0];
    console.log(`Selected: ${product.name} - $${product.price}`);
  }
}
```

### OnPush Change Detection

```typescript
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<native-select [items]="items" (select)="onSelect($event)"></native-select>`
})
export class OptimizedComponent {
  items = [/* ... */];
  
  onSelect(event: any) {
    // Component uses OnPush for better performance
  }
}
```

## Styling

### CSS Variables

```scss
native-select {
  --ns-bg-color: #ffffff;
  --ns-text-color: #333333;
  --ns-border-color: #cccccc;
  --ns-hover-bg-color: #f5f5f5;
  --ns-selected-bg-color: #e3f2fd;
  --ns-focus-ring-color: #2196f3;
  --ns-border-radius: 4px;
  --ns-padding: 8px;
}
```

### Component-Specific Styles

```typescript
@Component({
  styles: [`
    native-select {
      --ns-bg-color: #f8f9fa;
      --ns-border-radius: 8px;
    }
  `]
})
```

## Testing

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NativeSelectModule } from '@native-select/angular';

describe('MyComponent', () => {
  let fixture: ComponentFixture<MyComponent>;
  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MyComponent],
      imports: [NativeSelectModule]
    }).compileComponents();
    
    fixture = TestBed.createComponent(MyComponent);
  });
  
  it('should emit select event', () => {
    const component = fixture.componentInstance;
    spyOn(component, 'onSelect');
    
    // Trigger selection
    const event = { indices: [0], items: [component.items[0]] };
    component.onSelect(event);
    
    expect(component.onSelect).toHaveBeenCalledWith(event);
  });
});
```

## SSR (Angular Universal)

Works out of the box with Angular Universal. No special configuration needed.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14.1+
- Edge 90+

## Performance

- **Initial render**: < 50ms (1K items)
- **Virtual scrolling**: 60 FPS @ 100K items
- **Memory**: ~10MB for 100K items
- **Bundle size**: 6.6KB core + 892B adapter

## Resources

- [Full Documentation](../../docs/ANGULAR-SUPPORT.md)
- [API Reference](../../docs/API-REFERENCE.md#angular-adapter)
- [Getting Started](../../docs/GETTING-STARTED.md#angular)
- [GitHub Issues](https://github.com/navidrezadoost/smilodon/issues)

## License

MIT © Smilodon Team
