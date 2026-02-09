# @smilodon/react - Complete Guide

**Production-ready, accessible Select component for React applications**

This guide provides comprehensive documentation for using Smilodon Select in React applications, covering all features, styling options, and advanced use cases.

---

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [Basic Usage](#basic-usage)
3. [Complete Props Reference](#complete-props-reference)
4. [Input Formats](#input-formats)
5. [Single Selection](#single-selection)
6. [Multi-Selection](#multi-selection)
7. [Searchable Select](#searchable-select)
8. [Grouped Options](#grouped-options)
9. [Disabled States](#disabled-states)
10. [Event Handling](#event-handling)
11. [Styling & Theming](#styling--theming)
12. [Custom Renderers](#custom-renderers)
13. [Performance Optimization](#performance-optimization)
14. [TypeScript Integration](#typescript-integration)
15. [Accessibility](#accessibility)
16. [Advanced Patterns](#advanced-patterns)
17. [Troubleshooting](#troubleshooting)

---

## Installation & Setup

### Installation

```bash
npm install @smilodon/react @smilodon/core
```

or with yarn:

```bash
yarn add @smilodon/react @smilodon/core
```

or with pnpm:

```bash
pnpm add @smilodon/react @smilodon/core
```

### Basic Import

```tsx
import { Select } from '@smilodon/react';
import type { SelectItem } from '@smilodon/core';
```

---

## Basic Usage

### Minimal Example

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';

function App() {
  const [value, setValue] = useState('');

  return (
    <Select
      items={['Apple', 'Banana', 'Cherry']}
      value={value}
      onChange={(newValue) => setValue(newValue as string)}
    />
  );
}
```

### Controlled Component

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';
import type { SelectItem } from '@smilodon/core';

function ControlledSelect() {
  const [value, setValue] = useState<string | number>('');

  const items: SelectItem[] = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
  ];

  return (
    <div>
      <Select
        items={items}
        value={value}
        onChange={(newValue) => setValue(newValue as string | number)}
        placeholder="Select a fruit..."
      />
      
      {value && <p>Selected: {value}</p>}
    </div>
  );
}
```

---

## Complete Props Reference

### All Available Props

```tsx
interface SelectProps {
  // Required
  items: SelectItem[] | string[] | number[];
  
  // Value Management
  value?: string | number | (string | number)[];
  onChange?: (value: string | number | (string | number)[]) => void;
  
  // Behavior
  multiple?: boolean;
  searchable?: boolean;
  disabled?: boolean;
  placeholder?: string;
  
  // Display
  maxHeight?: number;
  estimatedItemHeight?: number;
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
  
  // Advanced
  virtualization?: boolean;
  customRenderer?: (item: SelectItem, index: number) => React.ReactNode;
  
  // Events
  onOpen?: () => void;
  onClose?: () => void;
  onSearch?: (query: string) => void;
}
```

### Props Details

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `SelectItem[] \| string[] \| number[]` | **Required** | Array of items to display |
| `value` | `string \| number \| array` | `undefined` | Current selected value(s) |
| `onChange` | `(value) => void` | `undefined` | Called when selection changes |
| `multiple` | `boolean` | `false` | Enable multi-selection |
| `searchable` | `boolean` | `true` | Enable search functionality |
| `disabled` | `boolean` | `false` | Disable the select |
| `placeholder` | `string` | `'Select...'` | Placeholder text |
| `maxHeight` | `number` | `300` | Max dropdown height (px) |
| `estimatedItemHeight` | `number` | `48` | Estimated item height for virtualization |
| `className` | `string` | `undefined` | CSS class name |
| `style` | `React.CSSProperties` | `undefined` | Inline styles (CSS variables) |
| `virtualization` | `boolean` | `true` | Enable virtual scrolling |
| `customRenderer` | `function` | `undefined` | Custom option renderer |
| `onOpen` | `() => void` | `undefined` | Called when dropdown opens |
| `onClose` | `() => void` | `undefined` | Called when dropdown closes |
| `onSearch` | `(query) => void` | `undefined` | Called on search input |

---

## Input Formats

Smilodon accepts three input formats for maximum flexibility:

### 1. Object Array (SelectItem[])

```tsx
const items: SelectItem[] = [
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'mx', label: 'Mexico' },
];

<Select items={items} value={value} onChange={setValue} />
```

### 2. String Array (Auto-converted)

```tsx
const items = ['Apple', 'Banana', 'Cherry', 'Date'];

<Select items={items} value={value} onChange={setValue} />
```

Automatically converted to:
```tsx
[
  { value: 'Apple', label: 'Apple' },
  { value: 'Banana', label: 'Banana' },
  { value: 'Cherry', label: 'Cherry' },
  { value: 'Date', label: 'Date' },
]
```

### 3. Number Array (Auto-converted)

```tsx
const items = [1, 2, 3, 5, 8, 13, 21];

<Select items={items} value={value} onChange={setValue} />
```

Automatically converted to:
```tsx
[
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  // ...
]
```

---

## Single Selection

### Basic Single Select

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';

function SingleSelect() {
  const [country, setCountry] = useState('');

  const countries = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'au', label: 'Australia' },
  ];

  return (
    <Select
      items={countries}
      value={country}
      onChange={(val) => setCountry(val as string)}
      placeholder="Select your country"
    />
  );
}
```

### With Form Integration

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';

function UserForm() {
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    language: '',
  });

  const handleCountryChange = (value: string | number) => {
    setFormData(prev => ({ ...prev, country: value as string }));
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      console.log('Form data:', formData);
    }}>
      <label>
        Name:
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        />
      </label>

      <label>
        Country:
        <Select
          items={['USA', 'Canada', 'Mexico', 'UK', 'Australia']}
          value={formData.country}
          onChange={handleCountryChange}
          placeholder="Select country"
        />
      </label>

      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## Multi-Selection

### Basic Multi-Select

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';

function MultiSelect() {
  const [languages, setLanguages] = useState<(string | number)[]>([]);

  const items = [
    { value: 'js', label: 'JavaScript' },
    { value: 'ts', label: 'TypeScript' },
    { value: 'py', label: 'Python' },
    { value: 'rs', label: 'Rust' },
    { value: 'go', label: 'Go' },
  ];

  return (
    <div>
      <Select
        items={items}
        value={languages}
        onChange={(val) => setLanguages(val as (string | number)[])}
        multiple
        placeholder="Select programming languages"
      />
      
      <div>
        <strong>Selected ({languages.length}):</strong>
        {languages.length > 0 ? (
          <ul>
            {languages.map(lang => (
              <li key={lang}>{lang}</li>
            ))}
          </ul>
        ) : (
          <p>No languages selected</p>
        )}
      </div>
    </div>
  );
}
```

### Multi-Select with Limit

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';

function LimitedMultiSelect() {
  const [selected, setSelected] = useState<(string | number)[]>([]);
  const maxSelections = 3;

  const handleChange = (value: string | number | (string | number)[]) => {
    const newValue = value as (string | number)[];
    if (newValue.length <= maxSelections) {
      setSelected(newValue);
    }
  };

  return (
    <div>
      <Select
        items={['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange']}
        value={selected}
        onChange={handleChange}
        multiple
        placeholder={`Select up to ${maxSelections} colors`}
      />
      <p>{selected.length} / {maxSelections} selected</p>
    </div>
  );
}
```

---

## Searchable Select

### Basic Search

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';

function SearchableSelect() {
  const [value, setValue] = useState('');

  // Large dataset
  const countries = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'mx', label: 'Mexico' },
    { value: 'br', label: 'Brazil' },
    { value: 'ar', label: 'Argentina' },
    // ... 200+ countries
  ];

  return (
    <Select
      items={countries}
      value={value}
      onChange={(val) => setValue(val as string)}
      searchable
      placeholder="Search for a country..."
    />
  );
}
```

### Search with Callback

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';

function SearchWithCallback() {
  const [value, setValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    console.log('Searching for:', query);
    // Optionally trigger API call, analytics, etc.
  };

  return (
    <div>
      <Select
        items={['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry']}
        value={value}
        onChange={(val) => setValue(val as string)}
        searchable
        onSearch={handleSearch}
        placeholder="Type to search..."
      />
      {searchQuery && <p>Current search: {searchQuery}</p>}
    </div>
  );
}
```

---

## Grouped Options

### Basic Groups

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';
import type { SelectItem } from '@smilodon/core';

function GroupedSelect() {
  const [value, setValue] = useState('');

  const items: SelectItem[] = [
    // Fruits group
    { value: 'apple', label: 'Apple', group: 'Fruits' },
    { value: 'banana', label: 'Banana', group: 'Fruits' },
    { value: 'cherry', label: 'Cherry', group: 'Fruits' },
    
    // Vegetables group
    { value: 'carrot', label: 'Carrot', group: 'Vegetables' },
    { value: 'broccoli', label: 'Broccoli', group: 'Vegetables' },
    { value: 'spinach', label: 'Spinach', group: 'Vegetables' },
  ];

  return (
    <Select
      items={items}
      value={value}
      onChange={(val) => setValue(val as string)}
      placeholder="Select food..."
    />
  );
}
```

### Complex Grouped Structure

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';
import type { SelectItem } from '@smilodon/core';

function ComplexGroupedSelect() {
  const [value, setValue] = useState('');

  const items: SelectItem[] = [
    // Frontend
    { value: 'react', label: 'React', group: 'Frontend' },
    { value: 'vue', label: 'Vue.js', group: 'Frontend' },
    { value: 'svelte', label: 'Svelte', group: 'Frontend' },
    
    // Backend
    { value: 'node', label: 'Node.js', group: 'Backend' },
    { value: 'django', label: 'Django', group: 'Backend' },
    { value: 'rails', label: 'Ruby on Rails', group: 'Backend' },
    
    // Database
    { value: 'postgres', label: 'PostgreSQL', group: 'Database' },
    { value: 'mongo', label: 'MongoDB', group: 'Database' },
    { value: 'redis', label: 'Redis', group: 'Database' },
  ];

  return (
    <Select
      items={items}
      value={value}
      onChange={(val) => setValue(val as string)}
      searchable
      placeholder="Select technology..."
    />
  );
}
```

---

## Disabled States

### Disabled Select

```tsx
import { Select } from '@smilodon/react';

function DisabledSelect() {
  return (
    <Select
      items={['Option 1', 'Option 2', 'Option 3']}
      value=""
      onChange={() => {}}
      disabled
      placeholder="This select is disabled"
    />
  );
}
```

### Disabled Options

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';
import type { SelectItem } from '@smilodon/core';

function DisabledOptions() {
  const [value, setValue] = useState('');

  const items: SelectItem[] = [
    { value: '1', label: 'Available Option 1' },
    { value: '2', label: 'Available Option 2' },
    { value: '3', label: 'Disabled Option', disabled: true },
    { value: '4', label: 'Available Option 3' },
    { value: '5', label: 'Disabled Option 2', disabled: true },
  ];

  return (
    <Select
      items={items}
      value={value}
      onChange={(val) => setValue(val as string)}
      placeholder="Some options are disabled"
    />
  );
}
```

### Conditional Disabling

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';

function ConditionalDisabled() {
  const [isLoading, setIsLoading] = useState(false);
  const [value, setValue] = useState('');

  const handleChange = async (val: string | number | (string | number)[]) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setValue(val as string);
    setIsLoading(false);
  };

  return (
    <div>
      <Select
        items={['Option 1', 'Option 2', 'Option 3']}
        value={value}
        onChange={handleChange}
        disabled={isLoading}
        placeholder={isLoading ? 'Loading...' : 'Select an option'}
      />
      {isLoading && <p>Processing selection...</p>}
    </div>
  );
}
```

---

## Event Handling

### All Events

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';

function EventHandling() {
  const [value, setValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  return (
    <div>
      <Select
        items={['Apple', 'Banana', 'Cherry']}
        value={value}
        onChange={(val) => {
          setValue(val as string);
          addLog(`Changed to: ${val}`);
        }}
        onOpen={() => {
          setIsOpen(true);
          addLog('Dropdown opened');
        }}
        onClose={() => {
          setIsOpen(false);
          addLog('Dropdown closed');
        }}
        onSearch={(query) => {
          addLog(`Searching for: ${query}`);
        }}
        placeholder="Select a fruit"
      />

      <div>
        <p>Current value: {value || 'None'}</p>
        <p>Dropdown is: {isOpen ? 'Open' : 'Closed'}</p>
      </div>

      <div>
        <strong>Event Log:</strong>
        <ul style={{ maxHeight: '200px', overflow: 'auto' }}>
          {logs.map((log, i) => (
            <li key={i}>{log}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

---

## Styling & Theming

### Inline Styles with CSS Variables

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';

function StyledSelect() {
  const [value, setValue] = useState('');

  return (
    <Select
      items={['Red', 'Blue', 'Green']}
      value={value}
      onChange={(val) => setValue(val as string)}
      style={{
        '--select-input-border': '2px solid #3b82f6',
        '--select-input-border-radius': '8px',
        '--select-input-focus-border': '#2563eb',
        '--select-option-hover-bg': '#dbeafe',
        '--select-option-selected-bg': '#3b82f6',
        '--select-option-selected-color': 'white',
        '--select-badge-bg': '#3b82f6',
      } as React.CSSProperties}
    />
  );
}
```

### Complete CSS Variables Reference

All available CSS variables for styling:

```tsx
<Select
  style={{
    // Input Container
    '--select-input-gap': '6px',
    '--select-input-padding': '6px 52px 6px 8px',
    '--select-input-min-height': '44px',
    '--select-input-bg': 'white',
    '--select-input-border': '1px solid #d1d5db',
    '--select-input-border-radius': '6px',
    '--select-input-focus-border': '#667eea',
    '--select-input-focus-shadow': '0 0 0 3px rgba(102, 126, 234, 0.1)',

    // Input Field
    '--select-input-min-width': '120px',
    '--select-input-field-padding': '4px',
    '--select-input-font-size': '14px',
    '--select-input-line-height': '1.5',
    '--select-input-color': '#1f2937',
    '--select-input-placeholder-color': '#9ca3af',
    '--select-font-family': 'inherit',

    // Dropdown Arrow
    '--select-arrow-width': '40px',
    '--select-arrow-size': '16px',
    '--select-arrow-color': '#667eea',
    '--select-arrow-hover-color': '#667eea',
    '--select-arrow-hover-bg': 'rgba(102, 126, 234, 0.08)',
    '--select-arrow-border-radius': '0 4px 4px 0',

    // Separator Line
    '--select-separator-position': '40px',
    '--select-separator-width': '1px',
    '--select-separator-height': '60%',
    '--select-separator-gradient': 'linear-gradient(to bottom, transparent, #ccc, transparent)',

    // Selection Badges (Multi-select)
    '--select-badge-gap': '4px',
    '--select-badge-padding': '4px 8px',
    '--select-badge-margin': '2px',
    '--select-badge-bg': '#667eea',
    '--select-badge-color': 'white',
    '--select-badge-border-radius': '4px',
    '--select-badge-font-size': '13px',
    
    // Badge Remove Button
    '--select-badge-remove-size': '16px',
    '--select-badge-remove-bg': 'rgba(255, 255, 255, 0.3)',
    '--select-badge-remove-color': 'white',
    '--select-badge-remove-font-size': '16px',
    '--select-badge-remove-hover-bg': 'rgba(255, 255, 255, 0.5)',

    // Dropdown
    '--select-dropdown-margin-top': '4px',
    '--select-dropdown-max-height': '300px',
    '--select-dropdown-border-radius': '4px',
    '--select-dropdown-bg': 'white',
    '--select-dropdown-border': '1px solid #ccc',
    '--select-dropdown-shadow': '0 4px 6px rgba(0, 0, 0, 0.1)',

    // Options
    '--select-options-bg': 'white',
    '--select-option-padding': '8px 12px',
    '--select-option-color': '#1f2937',
    '--select-option-bg': 'white',
    '--select-option-font-size': '14px',
    '--select-option-hover-bg': '#f3f4f6',
    '--select-option-selected-bg': '#e0e7ff',
    '--select-option-selected-color': '#4338ca',
  } as React.CSSProperties}
/>
```

### Theme Examples

#### Bootstrap Theme

```tsx
<Select
  items={items}
  value={value}
  onChange={setValue}
  style={{
    '--select-input-border': '1px solid #ced4da',
    '--select-input-border-radius': '0.375rem',
    '--select-input-focus-border': '#86b7fe',
    '--select-input-focus-shadow': '0 0 0 0.25rem rgba(13, 110, 253, 0.25)',
    '--select-option-hover-bg': '#e9ecef',
    '--select-option-selected-bg': '#0d6efd',
    '--select-option-selected-color': 'white',
    '--select-badge-bg': '#0d6efd',
  } as React.CSSProperties}
/>
```

#### Material Design Theme

```tsx
<Select
  items={items}
  value={value}
  onChange={setValue}
  style={{
    '--select-input-border-radius': '4px',
    '--select-input-focus-border': '#1976d2',
    '--select-dropdown-shadow': '0 2px 4px rgba(0,0,0,0.2), 0 4px 5px rgba(0,0,0,0.14)',
    '--select-option-padding': '16px',
    '--select-option-hover-bg': 'rgba(0, 0, 0, 0.04)',
    '--select-option-selected-bg': '#e3f2fd',
    '--select-option-selected-color': '#1976d2',
    '--select-badge-bg': '#1976d2',
    '--select-badge-border-radius': '16px',
  } as React.CSSProperties}
/>
```

#### Dark Mode Theme

```tsx
<Select
  items={items}
  value={value}
  onChange={setValue}
  className="dark-mode"
  style={{
    '--select-input-bg': '#1f2937',
    '--select-input-border': '1px solid #4b5563',
    '--select-input-color': '#f9fafb',
    '--select-dropdown-bg': '#1f2937',
    '--select-options-bg': '#1f2937',
    '--select-option-color': '#f9fafb',
    '--select-option-bg': '#1f2937',
    '--select-option-hover-bg': '#374151',
    '--select-option-selected-bg': '#3730a3',
    '--select-badge-bg': '#4f46e5',
  } as React.CSSProperties}
/>
```

### External CSS

```css
/* styles.css */
.custom-select {
  --select-input-border: 2px solid #10b981;
  --select-input-border-radius: 12px;
  --select-option-hover-bg: #d1fae5;
  --select-option-selected-bg: #10b981;
  --select-option-selected-color: white;
  --select-badge-bg: #10b981;
  --select-separator-gradient: linear-gradient(
    to bottom,
    transparent 0%,
    #10b981 20%,
    #10b981 80%,
    transparent 100%
  );
}
```

```tsx
import './styles.css';

function CustomStyledSelect() {
  return (
    <Select
      className="custom-select"
      items={['Option 1', 'Option 2', 'Option 3']}
      value={value}
      onChange={setValue}
    />
  );
}
```

---

## Custom Renderers

### Custom Option Renderer

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';
import type { SelectItem } from '@smilodon/core';

interface User {
  value: string;
  label: string;
  email: string;
  avatar: string;
}

function CustomRendererSelect() {
  const [value, setValue] = useState('');

  const users: User[] = [
    { 
      value: '1', 
      label: 'John Doe', 
      email: 'john@example.com',
      avatar: 'https://i.pravatar.cc/150?img=1'
    },
    { 
      value: '2', 
      label: 'Jane Smith', 
      email: 'jane@example.com',
      avatar: 'https://i.pravatar.cc/150?img=2'
    },
  ];

  const customRenderer = (item: SelectItem, index: number) => {
    const user = item as User;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img 
          src={user.avatar} 
          alt={user.label}
          style={{ width: '32px', height: '32px', borderRadius: '50%' }}
        />
        <div>
          <div style={{ fontWeight: '500' }}>{user.label}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>{user.email}</div>
        </div>
      </div>
    );
  };

  return (
    <Select
      items={users}
      value={value}
      onChange={(val) => setValue(val as string)}
      customRenderer={customRenderer}
      placeholder="Select a user"
      estimatedItemHeight={60}
    />
  );
}
```

---

## Performance Optimization

### Virtualization for Large Datasets

```tsx
import { Select } from '@smilodon/react';
import { useState, useMemo } from 'react';

function LargeDataset() {
  const [value, setValue] = useState('');

  // Generate 100,000 items
  const items = useMemo(() => 
    Array.from({ length: 100_000 }, (_, i) => ({
      value: `item-${i}`,
      label: `Item ${i + 1}`,
    })),
    []
  );

  return (
    <Select
      items={items}
      value={value}
      onChange={(val) => setValue(val as string)}
      virtualization={true}
      estimatedItemHeight={48}
      placeholder="Search 100k items..."
      searchable
    />
  );
}
```

### Memoization

```tsx
import { Select } from '@smilodon/react';
import { useState, useMemo, useCallback } from 'react';

function OptimizedSelect() {
  const [value, setValue] = useState('');

  // Memoize items
  const items = useMemo(() => [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3' },
  ], []);

  // Memoize handler
  const handleChange = useCallback((val: string | number | (string | number)[]) => {
    setValue(val as string);
  }, []);

  return (
    <Select
      items={items}
      value={value}
      onChange={handleChange}
    />
  );
}
```

---

## TypeScript Integration

### Full Type Safety

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';
import type { SelectItem } from '@smilodon/core';

// Define your data type
interface Product extends SelectItem {
  value: string;
  label: string;
  price: number;
  category: string;
}

function TypeSafeSelect() {
  const [selectedId, setSelectedId] = useState<string>('');

  const products: Product[] = [
    { value: 'p1', label: 'Laptop', price: 999, category: 'Electronics' },
    { value: 'p2', label: 'Phone', price: 699, category: 'Electronics' },
    { value: 'p3', label: 'Desk', price: 299, category: 'Furniture' },
  ];

  const handleChange = (value: string | number | (string | number)[]) => {
    setSelectedId(value as string);
  };

  return (
    <Select
      items={products}
      value={selectedId}
      onChange={handleChange}
      placeholder="Select a product"
    />
  );
}
```

### Generic Component

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';
import type { SelectItem } from '@smilodon/core';

interface GenericSelectProps<T extends SelectItem> {
  items: T[];
  onSelect: (item: T) => void;
  label: string;
}

function GenericSelect<T extends SelectItem>({ 
  items, 
  onSelect, 
  label 
}: GenericSelectProps<T>) {
  const [value, setValue] = useState<string | number>('');

  const handleChange = (val: string | number | (string | number)[]) => {
    setValue(val as string | number);
    const selected = items.find(item => item.value === val);
    if (selected) onSelect(selected);
  };

  return (
    <div>
      <label>{label}</label>
      <Select
        items={items}
        value={value}
        onChange={handleChange}
      />
    </div>
  );
}
```

---

## Accessibility

Smilodon is WCAG 2.1 AAA compliant with full keyboard support:

### Keyboard Navigation

- **Tab** - Focus the select
- **Enter/Space** - Open dropdown
- **↑/↓** - Navigate options
- **Home/End** - Jump to first/last option
- **Escape** - Close dropdown
- **Type** - Search options

### ARIA Attributes

The component automatically includes:
- `role="combobox"`
- `aria-expanded`
- `aria-haspopup`
- `aria-label` / `aria-labelledby`
- `aria-activedescendant`
- `aria-multiselectable` (when `multiple={true}`)

### Screen Reader Support

```tsx
function AccessibleSelect() {
  return (
    <div>
      <label id="country-label">Country</label>
      <Select
        items={['USA', 'Canada', 'Mexico']}
        value={value}
        onChange={setValue}
        placeholder="Select your country"
        // Component automatically uses the label via aria-labelledby
      />
    </div>
  );
}
```

---

## Advanced Patterns

### Dependent Selects

```tsx
import { Select } from '@smilodon/react';
import { useState, useEffect } from 'react';

function DependentSelects() {
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [states, setStates] = useState<string[]>([]);

  const countries = ['USA', 'Canada', 'Mexico'];

  useEffect(() => {
    // Reset state when country changes
    setState('');
    
    // Load states for selected country
    if (country === 'USA') {
      setStates(['California', 'Texas', 'New York', 'Florida']);
    } else if (country === 'Canada') {
      setStates(['Ontario', 'Quebec', 'British Columbia']);
    } else if (country === 'Mexico') {
      setStates(['Mexico City', 'Jalisco', 'Nuevo León']);
    } else {
      setStates([]);
    }
  }, [country]);

  return (
    <div>
      <Select
        items={countries}
        value={country}
        onChange={(val) => setCountry(val as string)}
        placeholder="Select country"
      />

      <Select
        items={states}
        value={state}
        onChange={(val) => setState(val as string)}
        disabled={!country}
        placeholder={country ? 'Select state' : 'Select country first'}
      />
    </div>
  );
}
```

### Async Data Loading

```tsx
import { Select } from '@smilodon/react';
import { useState, useEffect } from 'react';
import type { SelectItem } from '@smilodon/core';

function AsyncSelect() {
  const [items, setItems] = useState<SelectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState('');

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setItems([
        { value: '1', label: 'Option 1' },
        { value: '2', label: 'Option 2' },
        { value: '3', label: 'Option 3' },
      ]);
      
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading options...</div>;
  }

  return (
    <Select
      items={items}
      value={value}
      onChange={(val) => setValue(val as string)}
      placeholder="Select an option"
    />
  );
}
```

### With React Hook Form

```tsx
import { Select } from '@smilodon/react';
import { useForm, Controller } from 'react-hook-form';

interface FormData {
  country: string;
  language: string;
}

function FormWithSelect() {
  const { control, handleSubmit } = useForm<FormData>();

  const onSubmit = (data: FormData) => {
    console.log('Form data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="country"
        control={control}
        rules={{ required: 'Country is required' }}
        render={({ field, fieldState }) => (
          <div>
            <Select
              items={['USA', 'Canada', 'Mexico']}
              value={field.value}
              onChange={field.onChange}
              placeholder="Select country"
            />
            {fieldState.error && (
              <span style={{ color: 'red' }}>{fieldState.error.message}</span>
            )}
          </div>
        )}
      />

      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## Troubleshooting

### Common Issues

#### Issue: Value not updating

```tsx
// ❌ Wrong - missing onChange
<Select items={items} value={value} />

// ✅ Correct
<Select items={items} value={value} onChange={setValue} />
```

#### Issue: Multi-select not working

```tsx
// ❌ Wrong - value should be array
const [value, setValue] = useState('');

// ✅ Correct
const [value, setValue] = useState<(string | number)[]>([]);

<Select items={items} value={value} onChange={setValue} multiple />
```

#### Issue: Styles not applying

```tsx
// ❌ Wrong - missing 'as React.CSSProperties'
<Select style={{ '--select-input-border': '2px solid red' }} />

// ✅ Correct
<Select style={{ '--select-input-border': '2px solid red' } as React.CSSProperties} />
```

### Performance Issues

If you experience slow rendering with large datasets:

1. Enable virtualization (enabled by default)
2. Use `useMemo` for items array
3. Use `useCallback` for event handlers
4. Increase `estimatedItemHeight` if items are taller than 48px

```tsx
const items = useMemo(() => generateLargeDataset(), []);
const handleChange = useCallback((val) => setValue(val), []);

<Select
  items={items}
  value={value}
  onChange={handleChange}
  virtualization={true}
  estimatedItemHeight={48}
/>
```

---

## Additional Resources

- **Core Documentation**: [packages/core/README.md](../core/README.md)
- **API Reference**: [docs/API-REFERENCE.md](../../docs/API-REFERENCE.md)
- **Live Examples**: [Playground](../../playground)
- **GitHub Issues**: [Report a bug](https://github.com/navidrezadoost/smilodon/issues)

---

**Built with ❤️ by the Smilodon team**

*Last updated: February 9, 2026 - v1.3.6*
