# @smilodon/react

Production-ready, accessible Select component for React applications.

## 📖 Documentation

**For comprehensive documentation covering all features, styling options, and advanced patterns:**

👉 **[Complete React Guide](./COMPLETE-GUIDE.md)** 👈

The complete guide includes:
- ✅ All 60+ CSS variables for complete customization
- ✅ React-specific patterns (hooks, controlled components, refs)
- ✅ Complete API reference with TypeScript types
- ✅ React Hook Form integration examples
- ✅ Performance optimization with useMemo/useCallback
- ✅ Custom renderers and theme examples
- ✅ Advanced patterns (dependent selects, async loading)
- ✅ Troubleshooting and accessibility information

---

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

---

## 🎯 Two Ways to Specify Options

Smilodon React provides **two powerful approaches** for defining select options, each optimized for different use cases:

### Method 1: Data-Driven (Object Arrays) 📊

**Use when**: You have structured data and want simple, declarative option rendering.

**Advantages**:
- ✅ Simple and declarative - React-friendly
- ✅ Auto-conversion from strings/numbers
- ✅ Perfect for basic dropdowns
- ✅ Works seamlessly with React state
- ✅ Extremely performant (millions of items)
- ✅ Built-in search and filtering
- ✅ Full TypeScript type safety

**Examples**:

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';

// Example 1: Simple object array
function SimpleExample() {
  const [value, setValue] = useState('');

  const items = [
    { value: '1', label: 'Apple' },
    { value: '2', label: 'Banana' },
    { value: '3', label: 'Cherry' }
  ];

  return (
    <Select
      items={items}
      value={value}
      onChange={(val) => setValue(val as string)}
      placeholder="Select a fruit..."
    />
  );
}

// Example 2: With metadata and disabled options
function MetadataExample() {
  const [country, setCountry] = useState('');

  const countries = [
    { value: 'us', label: 'United States', disabled: false },
    { value: 'ca', label: 'Canada', disabled: false },
    { value: 'mx', label: 'Mexico', disabled: true }
  ];

  return (
    <Select
      items={countries}
      value={country}
      onChange={(val) => setCountry(val as string)}
      placeholder="Select a country..."
    />
  );
}

// Example 3: With grouping
function GroupedExample() {
  const [food, setFood] = useState('');

  const foods = [
    { value: 'apple', label: 'Apple', group: 'Fruits' },
    { value: 'banana', label: 'Banana', group: 'Fruits' },
    { value: 'carrot', label: 'Carrot', group: 'Vegetables' },
    { value: 'broccoli', label: 'Broccoli', group: 'Vegetables' }
  ];

  return (
    <Select
      items={foods}
      value={food}
      onChange={(val) => setFood(val as string)}
      placeholder="Select food..."
    />
  );
}

// Example 4: Auto-conversion from strings
function StringArrayExample() {
  const [color, setColor] = useState('');

  const colors = ['Red', 'Green', 'Blue', 'Yellow'];

  return (
    <Select
      items={colors}
      value={color}
      onChange={(val) => setColor(val as string)}
      placeholder="Select a color..."
    />
  );
}

// Example 5: Auto-conversion from numbers
function NumberArrayExample() {
  const [size, setSize] = useState<number | string>('');

  const sizes = [10, 20, 30, 40, 50];

  return (
    <Select
      items={sizes}
      value={size}
      onChange={(val) => setSize(val as number)}
      placeholder="Select size..."
    />
  );
}

// Example 6: Large datasets with useMemo
function LargeDatasetExample() {
  const [id, setId] = useState('');

  const items = useMemo(
    () =>
      Array.from({ length: 100_000 }, (_, i) => ({
        value: i.toString(),
        label: `Item ${i + 1}`
      })),
    []
  );

  return (
    <Select
      items={items}
      value={id}
      onChange={(val) => setId(val as string)}
      virtualized // Enable virtual scrolling for performance
      placeholder="Select from 100K items..."
    />
  );
}
```

### Method 2: Component-Driven (Custom Renderers) 🎨

Now also supports the native `optionRenderer` hook (Option B) that returns an `HTMLElement` for maximum control (e.g., non-React DOM fragments). Pass `optionRenderer={(item, index, helpers) => { const el = document.createElement('div'); el.textContent = item.label; return el; }}` to mirror the Web Component API.

**Use when**: You need rich, interactive option content with custom React components.

**Advantages**:
- ✅ Full control over option rendering
- ✅ Render any React component
- ✅ Rich content (images, icons, badges, multi-line text)
- ✅ Custom styling with CSS-in-JS or Tailwind
- ✅ Interactive elements within options
- ✅ Conditional rendering based on item data
- ✅ Access to React hooks and context
- ✅ Perfect for complex UIs (user cards, product listings, etc.)

**How it works**: Provide a `customRenderer` function that returns `React.ReactNode` for each option.

**Examples**:

```tsx
import { Select, SelectItem } from '@smilodon/react';
import { useState } from 'react';

// Example 1: Simple custom template with icons
interface Language extends SelectItem {
  icon: string;
  description: string;
}

function LanguageSelect() {
  const [lang, setLang] = useState('');

  const languages: Language[] = [
    { value: 'js', label: 'JavaScript', icon: '🟨', description: 'Dynamic scripting language' },
    { value: 'py', label: 'Python', icon: '🐍', description: 'General-purpose programming' },
    { value: 'rs', label: 'Rust', icon: '🦀', description: 'Systems programming language' }
  ];

  return (
    <Select
      items={languages}
      value={lang}
      onChange={(val) => setLang(val as string)}
      customRenderer={(item: Language, index) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>{item.icon}</span>
          <div>
            <div style={{ fontWeight: 600 }}>{item.label}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{item.description}</div>
          </div>
        </div>
      )}
      placeholder="Select a language..."
    />
  );
}

// Example 2: User selection with avatars
interface User extends SelectItem {
  email: string;
  avatar: string;
  role: 'Admin' | 'User' | 'Moderator';
}

function UserSelect() {
  const [userId, setUserId] = useState('');

  const users: User[] = [
    {
      value: '1',
      label: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://i.pravatar.cc/150?img=1',
      role: 'Admin'
    },
    {
      value: '2',
      label: 'Jane Smith',
      email: 'jane@example.com',
      avatar: 'https://i.pravatar.cc/150?img=2',
      role: 'User'
    },
    {
      value: '3',
      label: 'Bob Johnson',
      email: 'bob@example.com',
      avatar: 'https://i.pravatar.cc/150?img=3',
      role: 'Moderator'
    }
  ];

  return (
    <Select
      items={users}
      value={userId}
      onChange={(val) => setUserId(val as string)}
      customRenderer={(item: User) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}>
          <img
            src={item.avatar}
            alt={item.label}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: '#1f2937' }}>{item.label}</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>{item.email}</div>
          </div>
          <span
            style={{
              padding: '4px 8px',
              background: item.role === 'Admin' ? '#dbeafe' : '#f3f4f6',
              color: item.role === 'Admin' ? '#1e40af' : '#374151',
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 600
            }}
          >
            {item.role}
          </span>
        </div>
      )}
      placeholder="Select a user..."
    />
  );
}

// Example 3: Product selection with images and pricing
interface Product extends SelectItem {
  price: number;
  stock: number;
  image: string;
  badge?: string;
}

function ProductSelect() {
  const [productId, setProductId] = useState('');

  const products: Product[] = [
    {
      value: 'p1',
      label: 'Premium Laptop',
      price: 1299.99,
      stock: 15,
      image: 'https://via.placeholder.com/60',
      badge: 'Best Seller'
    },
    {
      value: 'p2',
      label: 'Wireless Mouse',
      price: 29.99,
      stock: 150,
      image: 'https://via.placeholder.com/60'
    },
    {
      value: 'p3',
      label: 'Mechanical Keyboard',
      price: 89.99,
      stock: 0,
      image: 'https://via.placeholder.com/60',
      badge: 'Out of Stock'
    }
  ];

  return (
    <Select
      items={products}
      value={productId}
      onChange={(val) => setProductId(val as string)}
      customRenderer={(item: Product) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            opacity: item.stock === 0 ? 0.5 : 1
          }}
        >
          <img
            src={item.image}
            alt={item.label}
            style={{
              width: 60,
              height: 60,
              borderRadius: 8,
              objectFit: 'cover',
              border: '1px solid #e5e7eb'
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, color: '#1f2937' }}>{item.label}</span>
              {item.badge && (
                <span
                  style={{
                    padding: '2px 6px',
                    background: item.badge === 'Best Seller' ? '#dcfce7' : '#fee2e2',
                    color: item.badge === 'Best Seller' ? '#166534' : '#991b1b',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 600
                  }}
                >
                  {item.badge}
                </span>
              )}
            </div>
            <div
              style={{
                marginTop: 4,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 700, color: '#059669' }}>
                ${item.price.toFixed(2)}
              </span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>
                {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
              </span>
            </div>
          </div>
        </div>
      )}
      placeholder="Select a product..."
    />
  );
}

// Example 4: Status indicators with conditional styling
interface Task extends SelectItem {
  status: 'completed' | 'in-progress' | 'pending';
  priority: 'high' | 'medium' | 'low';
  assignee: string;
}

function TaskSelect() {
  const [taskId, setTaskId] = useState('');

  const tasks: Task[] = [
    { value: 't1', label: 'Design Homepage', status: 'completed', priority: 'high', assignee: 'John' },
    { value: 't2', label: 'API Integration', status: 'in-progress', priority: 'high', assignee: 'Jane' },
    { value: 't3', label: 'Write Documentation', status: 'pending', priority: 'medium', assignee: 'Bob' },
    { value: 't4', label: 'Bug Fixes', status: 'in-progress', priority: 'low', assignee: 'Alice' }
  ];

  const statusConfig = {
    'completed': { bg: '#dcfce7', color: '#166534', icon: '✓' },
    'in-progress': { bg: '#dbeafe', color: '#1e40af', icon: '⟳' },
    'pending': { bg: '#fef3c7', color: '#92400e', icon: '○' }
  };

  const priorityColors = {
    'high': '#ef4444',
    'medium': '#f59e0b',
    'low': '#10b981'
  };

  return (
    <Select
      items={tasks}
      value={taskId}
      onChange={(val) => setTaskId(val as string)}
      customRenderer={(item: Task) => {
        const status = statusConfig[item.status];
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: status.bg,
                color: status.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}
            >
              {status.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: '#1f2937' }}>{item.label}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                Assigned to {item.assignee}
              </div>
            </div>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: priorityColors[item.priority]
              }}
              title={`${item.priority} priority`}
            />
          </div>
        );
      }}
      placeholder="Select a task..."
    />
  );
}

// Example 5: Using Tailwind CSS (if available)
interface Tag extends SelectItem {
  color: string;
  count: number;
}

function TailwindExample() {
  const [tag, setTag] = useState('');

  const tags: Tag[] = [
    { value: 'react', label: 'React', color: 'blue', count: 1250 },
    { value: 'vue', label: 'Vue', color: 'green', count: 850 },
    { value: 'angular', label: 'Angular', color: 'red', count: 420 }
  ];

  return (
    <Select
      items={tags}
      value={tag}
      onChange={(val) => setTag(val as string)}
      customRenderer={(item: Tag) => (
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full bg-${item.color}-500`} />
            <span className="font-semibold text-gray-900">{item.label}</span>
          </div>
          <span className="text-sm text-gray-500">{item.count} posts</span>
        </div>
      )}
      placeholder="Select a tag..."
    />
  );
}

// Example 6: With React components
import { Badge } from './Badge'; // Your custom component

function ComponentExample() {
  const [value, setValue] = useState('');

  const items = [
    { value: '1', label: 'Feature', type: 'success', count: 12 },
    { value: '2', label: 'Bug', type: 'error', count: 5 },
    { value: '3', label: 'Enhancement', type: 'info', count: 8 }
  ];

  return (
    <Select
      items={items}
      value={value}
      onChange={(val) => setValue(val as string)}
      customRenderer={(item: any) => (
        <div className="flex items-center justify-between">
          <span>{item.label}</span>
          <Badge type={item.type}>{item.count}</Badge>
        </div>
      )}
    />
  );
}
```

### Comparison: When to Use Each Method

| Feature | Method 1: Object Arrays | Method 2: Custom Renderers |
|---------|------------------------|---------------------------|
| **Setup Complexity** | ⭐ Simple | ⭐⭐ Moderate |
| **Rendering Speed** | ⭐⭐⭐ Fastest | ⭐⭐ Fast |
| **Visual Customization** | ⭐⭐ Limited | ⭐⭐⭐ Unlimited |
| **React Integration** | ⭐⭐⭐ Seamless | ⭐⭐⭐ Seamless |
| **Component Reuse** | ⭐ Limited | ⭐⭐⭐ Full |
| **TypeScript Support** | ⭐⭐⭐ Full | ⭐⭐⭐ Full |
| **Performance (1M items)** | ⭐⭐⭐ Excellent | ⭐⭐ Good |
| **Learning Curve** | ⭐ Easy | ⭐⭐ Medium |

**Best Practices**:

✅ **Use Method 1 (Object Arrays) when**:
- You need simple text-based options
- Performance is critical (millions of items)
- You want minimal code
- Built-in search/filter is sufficient
- Working with external APIs returning plain data

✅ **Use Method 2 (Custom Renderers) when**:
- You need images, icons, or badges
- Options require multiple lines of text
- Custom styling/layout is important
- Reusing existing React components
- Conditional rendering based on data
- Rich user experience is priority
- Using CSS-in-JS or Tailwind CSS

### Combining Both Methods

You can start with Method 1 and add Method 2 later as your UI evolves:

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';

function EvolvingComponent() {
  const [value, setValue] = useState('');

  // Start simple
  const items = ['Option 1', 'Option 2', 'Option 3'];

  return (
    <Select
      items={items}
      value={value}
      onChange={(val) => setValue(val as string)}
      // Later, add custom rendering without changing items
      customRenderer={(item, index) => (
        <div style={{ padding: 8, background: index % 2 ? '#f9fafb' : 'white' }}>
          <strong>{item.label || item}</strong>
        </div>
      )}
    />
  );
}
```

### Performance Tips

**For Method 1**:
- Use `useMemo` to memoize large item arrays
- Enable `virtualized` prop for 1000+ items
- Enable `infiniteScroll` for dynamic loading

**For Method 2**:
- Use `useCallback` to memoize renderer function
- Keep renderer pure (no side effects)
- Avoid heavy computations in renderer
- Use React.memo for complex nested components

```tsx
import { Select } from '@smilodon/react';
import { useState, useMemo, useCallback } from 'react';

function OptimizedExample() {
  const [value, setValue] = useState('');

  // Memoize items
  const items = useMemo(
    () =>
      Array.from({ length: 10000 }, (_, i) => ({
        value: i.toString(),
        label: `Item ${i + 1}`,
        description: `Description for item ${i + 1}`
      })),
    []
  );

  // Memoize renderer
  const renderer = useCallback((item: any, index: number) => (
    <div>
      <div style={{ fontWeight: 600 }}>{item.label}</div>
      <div style={{ fontSize: 12, color: '#666' }}>{item.description}</div>
    </div>
  ), []);

  return (
    <Select
      items={items}
      value={value}
      onChange={(val) => setValue(val as string)}
      customRenderer={renderer}
      virtualized // Enable virtual scrolling
      estimatedItemHeight={60}
    />
  );
}
```

---

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

