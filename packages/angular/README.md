# @smilodon/angular

Production-ready, accessible select component for Angular applications. Part of the [Smilodon](https://github.com/navidrezadoost/smilodon) UI toolkit.

## Features

- ✨ **Single & Multi-Select** - Choose one or multiple options
- 🔍 **Searchable** - Filter options with built-in or custom search
- ♿ **Fully Accessible** - WCAG 2.1 AAA compliant
- ⚡ **Virtual Scrolling** - Handle 100k+ options smoothly
- 📜 **Infinite Scroll** - Load data progressively
- 👥 **Grouped Options** - Organize options into categories
- 🎨 **Customizable** - Style with CSS variables or custom themes
- 📦 **Small Bundle** - Optimized for production
- 🔧 **TypeScript** - Full type safety included
- 📋 **Angular Forms** - Full ControlValueAccessor support
- 🎯 **Standalone** - Works with or without NgModule

## Installation

```bash
npm install @smilodon/angular @smilodon/core
```

## Quick Start

### Standalone Component (Angular 14+)

```typescript
import { Component } from '@angular/core';
import { SelectComponent } from '@smilodon/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SelectComponent],
  template: `
    <smilodon-select
      [items]="items"
      [(value)]="selectedValue"
      placeholder="Select a fruit..."
    ></smilodon-select>
  `
})
export class AppComponent {
  items = [
    { value: '1', label: 'Apple' },
    { value: '2', label: 'Banana' },
    { value: '3', label: 'Cherry' },
  ];

  selectedValue: string | undefined;
}
```

### With NgModule

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { SmilodonSelectModule } from '@smilodon/angular';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, SmilodonSelectModule],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

## Examples

### Multi-Select

```typescript
@Component({
  selector: 'app-language-select',
  standalone: true,
  imports: [SelectComponent],
  template: `
    <smilodon-select
      [items]="languages"
      [(value)]="selectedLanguages"
      [multiple]="true"
      placeholder="Select languages..."
    ></smilodon-select>

    <p>Selected: {{ selectedLanguages | json }}</p>
  `
})
export class LanguageSelectComponent {
  languages = [
    { value: 'js', label: 'JavaScript' },
    { value: 'ts', label: 'TypeScript' },
    { value: 'py', label: 'Python' },
  ];

  selectedLanguages: string[] = [];
}
```

### Angular Forms Integration

```typescript
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SelectComponent } from '@smilodon/angular';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [ReactiveFormsModule, SelectComponent],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <smilodon-select
        [items]="statuses"
        formControlName="status"
        placeholder="Select status..."
      ></smilodon-select>

      <button type="submit">Submit</button>
    </form>
  `
})
export class FormComponent {
  form: FormGroup;

  statuses = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
  ];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({ status: ['draft'] });
  }

  onSubmit(): void {
    console.log('Form submitted:', this.form.value);
  }
}
```

## API Reference

### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `items` | `SelectItem[]` | `[]` | Array of selectable items |
| `groupedItems` | `GroupedItem[]` | `undefined` | Grouped items array |
| `value` | `string \| number \| Array` | `undefined` | Selected value(s) |
| `multiple` | `boolean` | `false` | Enable multi-select |
| `searchable` | `boolean` | `false` | Enable search/filter |
| `placeholder` | `string` | `''` | Placeholder text |
| `disabled` | `boolean` | `false` | Disable the select |
| `virtualized` | `boolean` | `true` | Enable virtual scrolling |

### Outputs

| Output | Payload | Description |
|--------|---------|-------------|
| `changeEvent` | `{ value, selectedItems }` | Value changed |
| `selectEvent` | `{ item, index }` | Item selected |
| `searchEvent` | `{ query }` | Search query changed |

### Methods

| Method | Description |
|--------|-------------|
| `open()` | Open the dropdown |
| `close()` | Close the dropdown |
| `clear()` | Clear selection |

## Styling

```css
enhanced-select {
  --select-border-color: #d1d5db;
  --select-focus-border-color: #3b82f6;
  --select-background: white;
}
```

## License

MIT © [Navid Rezadoost](https://github.com/navidrezadoost)
