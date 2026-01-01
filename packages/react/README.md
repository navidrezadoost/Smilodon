# @smilodon/react

Production-ready, accessible Select component for React applications.

## Features

- ✅ **Simple API** - Clean, intuitive props that feel natural in React
- ✅ **Fully Typed** - Complete TypeScript support with detailed type definitions
- ✅ **Controlled & Uncontrolled** - Works both ways, your choice
- ✅ **Single & Multi-select** - One prop to switch modes
- ✅ **Searchable** - Built-in filtering with customizable behavior
- ✅ **Infinite Scroll** - Handle massive datasets efficiently
- ✅ **Virtual Scrolling** - Render only visible items for performance
- ✅ **Grouped Options** - Organize items into categories
- ✅ **Accessible** - WCAG 2.1 AAA compliant, full keyboard navigation
- ✅ **Customizable** - Custom renderers, styles, and behaviors
- ✅ **Tiny Bundle** - Optimized for production

## Installation

```bash
npm install @smilodon/react @smilodon/core
```

or

```bash
yarn add @smilodon/react @smilodon/core
```

or

```bash
pnpm add @smilodon/react @smilodon/core
```

## Quick Start

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';

function MyApp() {
  const [value, setValue] = useState('');

  return (
    <Select
      items={[
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
        { value: 'cherry', label: 'Cherry' },
      ]}
      value={value}
      onChange={(newValue) => setValue(newValue as string)}
      placeholder="Select a fruit..."
    />
  );
}
```

## Examples

### Basic Single Select

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';

function BasicExample() {
  const [value, setValue] = useState('');

  return (
    <Select
      items={[
        { value: '1', label: 'Option 1' },
        { value: '2', label: 'Option 2' },
        { value: '3', label: 'Option 3' },
      ]}
      value={value}
      onChange={(val) => setValue(val as string)}
      placeholder="Choose an option"
    />
  );
}
```

### String Array Input (Auto-converted)

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';

function StringArrayExample() {
  const [values, setValues] = useState<Array<string | number>>([]);

  return (
    <Select
      items={['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry']}
      value={values}
      onChange={(val) => setValues(val as Array<string | number>)}
      multiple
      placeholder="Select fruits..."
    />
  );
}
```

> **Note:** String arrays are automatically converted to `SelectItem` format internally. Each string becomes `{ value: string, label: string }`.

### Number Array Input (Auto-converted)

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';

function NumberArrayExample() {
  const [value, setValue] = useState<string | number>('');

  return (
    <Select
      items={[1, 2, 3, 5, 8, 13, 21, 34, 55, 89]}
      value={value}
      onChange={(val) => setValue(val)}
      placeholder="Select a Fibonacci number..."
    />
  );
}
```

> **Note:** Number arrays are automatically converted to `SelectItem` format internally. Each number becomes `{ value: number, label: string }`.

### Multi-Select with Object Array

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';

function MultiSelectExample() {
  const [values, setValues] = useState<Array<string | number>>([]);

  return (
    <Select
      items={[
        { value: 'react', label: 'React' },
        { value: 'vue', label: 'Vue' },
        { value: 'angular', label: 'Angular' },
        { value: 'svelte', label: 'Svelte' },
      ]}
      value={values}
      onChange={(val) => setValues(val as Array<string | number>)}
      multiple
      placeholder="Select frameworks..."
    />
  );
}
```

### Searchable Select

```tsx
import { Select } from '@smilodon/react';

function SearchableExample() {
  const [value, setValue] = useState('');

  return (
    <Select
      items={countries}
      value={value}
      onChange={(val) => setValue(val as string)}
      searchable
      placeholder="Search countries..."
    />
  );
}
```

### Grouped Options

```tsx
import { Select } from '@smilodon/react';

function GroupedExample() {
  const [value, setValue] = useState('');

  return (
    <Select
      groupedItems={[
        {
          label: 'Fruits',
          options: [
            { value: 'apple', label: 'Apple' },
            { value: 'banana', label: 'Banana' },
          ],
        },
        {
          label: 'Vegetables',
          options: [
            { value: 'carrot', label: 'Carrot' },
            { value: 'tomato', label: 'Tomato' },
          ],
        },
      ]}
      value={value}
      onChange={(val) => setValue(val as string)}
      placeholder="Select food..."
    />
  );
}
```

### Infinite Scroll

```tsx
import { Select } from '@smilodon/react';

function InfiniteScrollExample() {
  const [items, setItems] = useState(initialItems);
  const [value, setValue] = useState('');

  const handleLoadMore = async (page: number) => {
    const newItems = await fetchItems(page);
    setItems([...items, ...newItems]);
  };

  return (
    <Select
      items={items}
      value={value}
      onChange={(val) => setValue(val as string)}
      infiniteScroll
      pageSize={20}
      onLoadMore={handleLoadMore}
    />
  );
}
```

### With Validation

```tsx
import { Select } from '@smilodon/react';

function ValidationExample() {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleChange = (val: string | number) => {
    setValue(val as string);
    if (!val) {
      setError('This field is required');
    } else {
      setError('');
    }
  };

  return (
    <Select
      items={items}
      value={value}
      onChange={handleChange}
      required
      error={!!error}
      errorMessage={error}
      placeholder="Required field"
    />
  );
}
```

### Using Ref for Imperative Actions

```tsx
import { Select, SelectHandle } from '@smilodon/react';
import { useRef } from 'react';

function RefExample() {
  const selectRef = useRef<SelectHandle>(null);
  const [value, setValue] = useState('');

  const handleOpen = () => {
    selectRef.current?.open();
  };

  const handleClear = () => {
    selectRef.current?.clear();
  };

  return (
    <div>
      <Select
        ref={selectRef}
        items={items}
        value={value}
        onChange={(val) => setValue(val as string)}
      />
      <button onClick={handleOpen}>Open Dropdown</button>
      <button onClick={handleClear}>Clear Selection</button>
    </div>
  );
}
```

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `SelectItem[]` | `[]` | Array of items to display |
| `groupedItems` | `GroupedItem[]` | - | Grouped items (alternative to flat array) |
| `value` | `string \| number \| Array<string \| number>` | - | Current value (controlled) |
| `defaultValue` | `string \| number \| Array<string \| number>` | - | Default value (uncontrolled) |
| `multiple` | `boolean` | `false` | Enable multi-select mode |
| `searchable` | `boolean` | `false` | Enable search/filter |
| `placeholder` | `string` | `"Select an option..."` | Placeholder text |
| `disabled` | `boolean` | `false` | Disable the select |
| `required` | `boolean` | `false` | Mark as required field |
| `error` | `boolean` | `false` | Show error state |
| `errorMessage` | `string` | - | Error message to display |
| `infiniteScroll` | `boolean` | `false` | Enable infinite scroll |
| `pageSize` | `number` | `20` | Items per page (infinite scroll) |
| `virtualized` | `boolean` | `false` | Enable virtual scrolling |
| `estimatedItemHeight` | `number` | `48` | Item height for virtualization |
| `maxSelections` | `number` | - | Max selections (multi-select) |
| `placement` | `string` | `"bottom-start"` | Dropdown placement |
| `className` | `string` | - | Custom CSS class |
| `style` | `CSSProperties` | - | Inline styles |
| `onChange` | `(value, items) => void` | - | Selection change callback |
| `onSelect` | `(item, index) => void` | - | Item select callback |
| `onOpen` | `() => void` | - | Dropdown open callback |
| `onClose` | `() => void` | - | Dropdown close callback |
| `onSearch` | `(query, results, count) => void` | - | Search callback |
| `onLoadMore` | `(page) => void \| Promise<void>` | - | Load more callback |
| `creatable` | `boolean` | `false` | Allow creating new options |
| `onCreate` | `(label) => void` | - | Create option callback |

### Types

#### SelectItem

```typescript
interface SelectItem {
  value: string | number;
  label: string;
  disabled?: boolean;
  [key: string]: unknown; // Additional custom properties
}
```

#### SelectHandle

```typescript
interface SelectHandle {
  focus: () => void;
  open: () => void;
  close: () => void;
  getSelectedItems: () => SelectItem[];
  getSelectedValues: () => Array<string | number>;
  setItems: (items: SelectItem[]) => void;
  setGroupedItems: (groups: GroupedItem[]) => void;
  clear: () => void;
}
```

## Styling

The component uses Shadow DOM for style encapsulation. You can customize it using CSS custom properties:

```css
enhanced-select {
  --select-border-color: #e2e8f0;
  --select-border-focus-color: #3b82f6;
  --select-bg: white;
  --select-text-color: #1f2937;
  --select-placeholder-color: #9ca3af;
  --select-dropdown-bg: white;
  --select-dropdown-border: #e2e8f0;
  --select-dropdown-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --select-option-hover-bg: #f3f4f6;
  --select-option-selected-bg: #eff6ff;
  --select-option-selected-color: #3b82f6;
}
```

## Accessibility

This component is built with accessibility in mind:

- ✅ Full keyboard navigation (Arrow keys, Enter, Escape, Tab)
- ✅ Screen reader support with ARIA attributes
- ✅ Focus management
- ✅ High contrast mode support
- ✅ Reduced motion support
- ✅ 44px minimum touch targets (WCAG 2.5.5)
- ✅ WCAG 2.1 AAA compliant

## Performance

- Virtual scrolling for large datasets (1000+ items)
- Lazy loading with infinite scroll
- Optimized re-renders with React.memo internally
- Tree-shakeable exports
- Minimal bundle size impact

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14+
- Samsung Internet 14+

## TypeScript

Full TypeScript support with comprehensive type definitions included.

```tsx
import { Select, SelectProps, SelectHandle, SelectItem } from '@smilodon/react';
```

## License

MIT © Smilodon

## Related Packages


- `@smilodon/core` - Core web component
- `@smilodon/vue` - Vue 3 adapter
- `@smilodon/svelte` - Svelte adapter

