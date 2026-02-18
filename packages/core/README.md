# @smilodon/core

<div align="center">
  <img src="https://raw.githubusercontent.com/navidrezadoost/smilodon/main/.github/logo.jpg" alt="Smilodon Logo" width="220" style="border-radius:16px;" />
  <p><strong>High-performance native select component with extreme-scale virtualization</strong></p>
  <p>
    <a href="https://www.npmjs.com/package/@smilodon/core"><img src="https://img.shields.io/npm/v/@smilodon/core.svg" alt="npm version"></a>
    <a href="https://github.com/navidrezadoost/smilodon"><img src="https://img.shields.io/github/stars/navidrezadoost/smilodon.svg" alt="GitHub stars"></a>
    <a href="https://github.com/navidrezadoost/smilodon/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@smilodon/core.svg" alt="license"></a>
  </p>
</div>

## 📖 Documentation

**For comprehensive documentation covering all features, styling options, and advanced patterns:**

👉 **[Complete Vanilla JS Guide](../vanilla/COMPLETE-GUIDE.md)** 👈

Additional references:
- **Performance Runbook**: [`docs/PERFORMANCE-RUNBOOK.md`](../../docs/PERFORMANCE-RUNBOOK.md)
- **Performance Guide**: [`docs/PERFORMANCE.md`](../../docs/PERFORMANCE.md)
- **Known Limitations**: [`docs/KNOWN-LIMITATIONS.md`](../../docs/KNOWN-LIMITATIONS.md)

The complete guide includes:
- ✅ All 60+ CSS variables for complete customization
- ✅ Vanilla JavaScript patterns (DOM manipulation, event listeners)
- ✅ Complete API reference with all properties and methods
- ✅ CDN usage and module bundler integration
- ✅ Custom renderers with HTML templates
- ✅ Theme examples and dynamic styling
- ✅ Advanced patterns (async loading, local storage, dependent selects)
- ✅ Troubleshooting and accessibility information

> **WebKit e2e note (Linux/Arch)**: WebKit Playwright binaries depend on older system libraries; on Arch-based distros we recommend running WebKit tests via the Playwright Docker image.

---

## Why Smilodon?

Smilodon is a Web Component that renders **1,000,000+ items at 60 FPS** with constant DOM size, sub-millisecond search, and zero framework lock-in. Built for extreme-scale data applications where legacy libraries crash or lag.

### Performance Comparison

| Library | 10K Items | 100K Items | 1M Items | Memory | FPS |
|---------|-----------|------------|----------|---------|-----|
| **Smilodon** | 38ms | 81ms | 162ms | 18 MB | 60 |
| React Select | 1200ms | ❌ Crash | ❌ Crash | 200+ MB | 10-25 |
| Vue Select | 890ms | ❌ Crash | ❌ Crash | 180+ MB | 15-30 |
| ng-select | 1100ms | ❌ Crash | ❌ Crash | 220+ MB | 12-28 |

See [full benchmarks](https://github.com/navidrezadoost/smilodon/blob/main/docs/BENCHMARKS.md) for methodology and reproducibility.

## Installation

```bash
npm install @smilodon/core
```

## Quick Start

### Vanilla JavaScript / Web Components

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import '@smilodon/core';
  </script>
</head>
<body>
  <smilodon-select id="my-select"></smilodon-select>

  <script type="module">
    const select = document.getElementById('my-select');
    
    // Generate 1 million items
    const items = Array.from({ length: 1_000_000 }, (_, i) => ({
      label: `Item ${i + 1}`,
      value: i + 1
    }));

    select.items = items;
    
    select.addEventListener('change', (e) => {
      console.log('Selected:', e.detail);
    });
  </script>
</body>
</html>
```

### Framework Usage

**`@smilodon/core` works directly in all frameworks** as a Web Component - no adapters needed!

Simply import and use `<smilodon-select>` in React, Vue, Svelte, or any framework:

```jsx
// React, Vue, Svelte - all work the same way
import '@smilodon/core';
<smilodon-select ref={selectRef} />
```

**Optional Framework Adapters** (for enhanced developer experience):
- **React**: `npm install @smilodon/react` - React hooks and components
- **Vue**: `npm install @smilodon/vue` - Vue composables and components  
- **Svelte**: `npm install @smilodon/svelte` - Svelte stores and components
- **Vanilla**: `npm install @smilodon/vanilla` - Vanilla JS helpers

These adapters provide framework-native APIs (hooks, composables) for enhanced developer experience, but are **not required** - the core package works everywhere!

**Note:** Angular support has been discontinued as of December 2025.

See the [main documentation](https://github.com/navidrezadoost/smilodon#readme) for framework-specific examples.

## Key Features

### 🚀 Extreme Performance
- **Constant DOM**: Only 10-15 elements rendered regardless of dataset size
- **Work Stealing**: Background search workers with automatic cancellation
- **Sub-millisecond Search**: Fenwick tree indexing for O(log n) queries
- **60 FPS Scrolling**: Hardware-accelerated virtualization

### 🎯 Production Ready
- **TypeScript First**: Complete type definitions included
- **Zero Dependencies**: 6.6 KB gzipped runtime
- **Framework Agnostic**: Works with React, Vue, Svelte, or vanilla JS
- **Accessibility**: WCAG 2.2 AA compliant with ARIA 1.2

### 🔒 Enterprise Grade
- **SOC2 Compliant**: Audit-ready security controls
- **CSP Compatible**: No eval(), no inline scripts
- **SBOM Included**: Full dependency transparency
- **99.8% Test Coverage**: Unit, integration, and E2E tests

## API Reference

### Properties

```typescript
interface SmilodonSelectElement extends HTMLElement {
  items: SelectItem[] | string[] | number[];  // Dataset (can be millions of items)
  value: any;                    // Current selected value
  placeholder?: string;          // Placeholder text
  searchable?: boolean;          // Enable search (default: true)
  disabled?: boolean;            // Disable the select
  multiple?: boolean;            // Multiple selection mode
  virtualization?: boolean;      // Enable virtualization (default: true)
  maxHeight?: number;            // Max dropdown height in pixels
}

interface SelectItem {
  label: string;                 // Display text
  value: any;                    // Value (can be any type)
  disabled?: boolean;            // Disable this option
  group?: string;                // Optgroup name
}
```

> **Flexible Input Formats:**
> - **Object arrays**: `[{ value: '1', label: 'Option 1' }, ...]`
> - **String arrays**: `['Apple', 'Banana', 'Cherry']` - automatically converted to `SelectItem` format
> - **Number arrays**: `[1, 2, 3, 5, 8]` - automatically converted to `SelectItem` format

### Examples with Different Input Types

#### Object Array (Traditional)
```javascript
select.items = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' }
];
```

#### String Array (Auto-converted)
```javascript
select.items = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];
// Automatically becomes:
// [
//   { value: 'Apple', label: 'Apple' },
//   { value: 'Banana', label: 'Banana' },
//   ...
// ]
```

#### Number Array (Auto-converted)
```javascript
select.items = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
// Automatically becomes:
// [
//   { value: 1, label: '1' },
//   { value: 2, label: '2' },
//   ...
// ]
```

---

## 🎯 Two Ways to Specify Options

Smilodon provides **two powerful approaches** for defining select options, each optimized for different use cases:

### Method 1: Data-Driven (Object Arrays) 📊

**Use when**: You have structured data and want simple, declarative option rendering.

**Advantages**:
- ✅ Simple and declarative
- ✅ Auto-conversion from strings/numbers
- ✅ Perfect for basic dropdowns
- ✅ Zero boilerplate code
- ✅ Extremely performant (millions of items)
- ✅ Built-in search and filtering
- ✅ TypeScript type safety

**Examples**:

```javascript
// Simple object array
const select = document.querySelector('enhanced-select');

select.items = [
  { value: '1', label: 'Apple' },
  { value: '2', label: 'Banana' },
  { value: '3', label: 'Cherry' }
];

// With additional metadata
select.items = [
  { value: 'us', label: 'United States', disabled: false },
  { value: 'ca', label: 'Canada', disabled: false },
  { value: 'mx', label: 'Mexico', disabled: true }  // Disabled option
];

// With grouping
select.items = [
  { value: 'apple', label: 'Apple', group: 'Fruits' },
  { value: 'banana', label: 'Banana', group: 'Fruits' },
  { value: 'carrot', label: 'Carrot', group: 'Vegetables' },
  { value: 'broccoli', label: 'Broccoli', group: 'Vegetables' }
];

// Auto-conversion from strings
select.items = ['Red', 'Green', 'Blue', 'Yellow'];

// Auto-conversion from numbers
select.items = [10, 20, 30, 40, 50];

// Large datasets (millions of items)
select.items = Array.from({ length: 1_000_000 }, (_, i) => ({
  value: i,
  label: `Item ${i + 1}`
}));
```

### Method 2: Component-Driven (Custom Renderers) 🎨

**Use when**: You need rich, interactive option content with custom HTML/styling.

**Advantages**:
- ✅ Full control over option rendering
- ✅ Rich content (images, icons, badges, multi-line text)
- ✅ Custom HTML and styling
- ✅ Interactive elements within options
- ✅ Conditional rendering based on item data
- ✅ Perfect for complex UIs (user cards, product listings, etc.)

**How it works**: Provide an `optionTemplate` function that returns HTML string for each option.

**Examples**:

```javascript
const select = document.querySelector('enhanced-select');

// Example 1: Simple custom template with icons
const items = [
  { value: 'js', label: 'JavaScript', icon: '🟨', description: 'Dynamic scripting language' },
  { value: 'py', label: 'Python', icon: '🐍', description: 'General-purpose programming' },
  { value: 'rs', label: 'Rust', icon: '🦀', description: 'Systems programming language' }
];

select.items = items;
select.optionTemplate = (item, index) => `
  <div style="display: flex; align-items: center; gap: 12px;">
    <span style="font-size: 24px;">${item.icon}</span>
    <div>
      <div style="font-weight: 600;">${item.label}</div>
      <div style="font-size: 12px; color: #6b7280;">${item.description}</div>
    </div>
  </div>
`;

// Example 2: User selection with avatars
const users = [
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

select.items = users;
select.optionTemplate = (item, index) => `
  <div style="display: flex; align-items: center; gap: 12px; padding: 4px 0;">
    <img 
      src="${item.avatar}" 
      alt="${item.label}"
      style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;"
    />
    <div style="flex: 1;">
      <div style="font-weight: 600; color: #1f2937;">${item.label}</div>
      <div style="font-size: 13px; color: #6b7280;">${item.email}</div>
    </div>
    <span style="
      padding: 4px 8px;
      background: ${item.role === 'Admin' ? '#dbeafe' : '#f3f4f6'};
      color: ${item.role === 'Admin' ? '#1e40af' : '#374151'};
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    ">${item.role}</span>
  </div>
`;

// Example 3: Product selection with images and pricing
const products = [
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
    image: 'https://via.placeholder.com/60',
    badge: null
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

select.items = products;
select.optionTemplate = (item, index) => `
  <div style="display: flex; align-items: center; gap: 12px; opacity: ${item.stock === 0 ? '0.5' : '1'};">
    <img 
      src="${item.image}" 
      alt="${item.label}"
      style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover; border: 1px solid #e5e7eb;"
    />
    <div style="flex: 1;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-weight: 600; color: #1f2937;">${item.label}</span>
        ${item.badge ? `
          <span style="
            padding: 2px 6px;
            background: ${item.badge === 'Best Seller' ? '#dcfce7' : '#fee2e2'};
            color: ${item.badge === 'Best Seller' ? '#166534' : '#991b1b'};
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
          ">${item.badge}</span>
        ` : ''}
      </div>
      <div style="margin-top: 4px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 16px; font-weight: 700; color: #059669;">$${item.price.toFixed(2)}</span>
        <span style="font-size: 12px; color: #6b7280;">${item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}</span>
      </div>
    </div>
  </div>
`;

// Example 4: Status indicators with conditional styling
const tasks = [
  { value: 't1', label: 'Design Homepage', status: 'completed', priority: 'high', assignee: 'John' },
  { value: 't2', label: 'API Integration', status: 'in-progress', priority: 'high', assignee: 'Jane' },
  { value: 't3', label: 'Write Documentation', status: 'pending', priority: 'medium', assignee: 'Bob' },
  { value: 't4', label: 'Bug Fixes', status: 'in-progress', priority: 'low', assignee: 'Alice' }
];

const statusColors = {
  'completed': { bg: '#dcfce7', color: '#166534', icon: '✓' },
  'in-progress': { bg: '#dbeafe', color: '#1e40af', icon: '⟳' },
  'pending': { bg: '#fef3c7', color: '#92400e', icon: '○' }
};

const priorityColors = {
  'high': '#ef4444',
  'medium': '#f59e0b',
  'low': '#10b981'
};

select.items = tasks;
select.optionTemplate = (item, index) => {
  const status = statusColors[item.status];
  return `
    <div style="display: flex; align-items: center; gap: 10px; padding: 4px 0;">
      <div style="
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: ${status.bg};
        color: ${status.color};
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
      ">${status.icon}</div>
      <div style="flex: 1;">
        <div style="font-weight: 600; color: #1f2937;">${item.label}</div>
        <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">
          Assigned to ${item.assignee}
        </div>
      </div>
      <div style="
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: ${priorityColors[item.priority]};
      " title="${item.priority} priority"></div>
    </div>
  `;
};
```

### Comparison: When to Use Each Method

| Feature | Method 1: Object Arrays | Method 2: Custom Renderers |
|---------|------------------------|---------------------------|
| **Setup Complexity** | ⭐ Simple | ⭐⭐ Moderate |
| **Rendering Speed** | ⭐⭐⭐ Fastest | ⭐⭐ Fast |
| **Visual Customization** | ⭐⭐ Limited | ⭐⭐⭐ Unlimited |
| **Use Case** | Standard dropdowns | Rich, complex UIs |
| **Code Amount** | Minimal | More code |
| **TypeScript Support** | ⭐⭐⭐ Full | ⭐⭐⭐ Full |
| **Performance (1M items)** | ⭐⭐⭐ Excellent | ⭐⭐ Good |
| **Learning Curve** | ⭐ Easy | ⭐⭐ Medium |

**Best Practices**:

✅ **Use Method 1 (Object Arrays) when**:
- You need simple text-based options
- Performance is critical (millions of items)
- You want minimal code
- Built-in search/filter is sufficient

✅ **Use Method 2 (Custom Renderers) when**:
- You need images, icons, or badges
- Options require multiple lines of text
- Custom styling/layout is important
- Conditional rendering based on data
- Rich user experience is priority

### Combining Both Methods

You can start with Method 1 and add Method 2 later as your UI evolves:

```javascript
// Start simple
select.items = ['Option 1', 'Option 2', 'Option 3'];

// Later, add custom rendering without changing items
select.optionTemplate = (item, index) => `
  <div style="padding: 8px; background: ${index % 2 ? '#f9fafb' : 'white'};">
    <strong>${item.label || item}</strong>
  </div>
`;
```

---

### Events

```typescript
// Selection changed
select.addEventListener('change', (event: CustomEvent) => {
  console.log(event.detail); // { value, label }
});

// Dropdown opened
select.addEventListener('open', () => {
  console.log('Dropdown opened');
});

// Dropdown closed
select.addEventListener('close', () => {
  console.log('Dropdown closed');
});

// Search query changed
select.addEventListener('search', (event: CustomEvent) => {
  console.log(event.detail.query);
});
```

### Methods

```typescript
// Programmatically open/close
select.open();
select.close();

// Clear selection
select.clear();

// Focus the select
select.focus();

// Get filtered items (useful for debugging)
const filtered = select.getFilteredItems();
```

## Advanced Usage

### Custom Styling

Smilodon uses CSS custom properties (CSS variables) for easy theming and customization. The default theme is **light mode** with a clean white background.

#### Basic Customization

```css
enhanced-select {
  /* Options styling */
  --select-option-bg: #ffffff;
  --select-option-color: #1f2937;
  --select-option-padding: 8px 12px;
  
  /* Hover state */
  --select-option-hover-bg: #f3f4f6;
  --select-option-hover-color: #1f2937;
  
  /* Selected state */
  --select-option-selected-bg: #e0e7ff;
  --select-option-selected-color: #4338ca;
  --select-option-selected-border: 1px solid #4338ca;
  --select-option-selected-hover-bg: #c7d2fe;
  --select-option-selected-hover-border: 1px solid #3730a3;
  
  /* Active/focused state */
  --select-option-active-bg: #f3f4f6;
  --select-option-active-color: #1f2937;
  
  /* Dropdown */
  --select-dropdown-bg: white;
  --select-dropdown-border: #ccc;
  --select-dropdown-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
```

#### Dark Mode (Opt-in)

Dark mode is **opt-in only** and can be enabled by adding a class or data attribute:

```html
<!-- Using class -->
<enhanced-select class="dark-mode"></enhanced-select>

<!-- Using data attribute -->
<enhanced-select data-theme="dark"></enhanced-select>
```

```css
/* Custom dark mode colors */
enhanced-select.dark-mode {
  --select-dark-bg: #1f2937;
  --select-dark-text: #f9fafb;
  --select-dark-border: #4b5563;
  --select-dark-dropdown-bg: #1f2937;
  --select-dark-option-color: #f9fafb;
  --select-dark-option-bg: #1f2937;
  --select-dark-option-hover-bg: #374151;
  --select-dark-option-selected-bg: #3730a3;
}
```

#### Available CSS Variables

**Light Mode (Default)**
```css
--select-options-bg           /* Options container background (white) */
--select-option-color          /* Option text color (#1f2937) */
--select-option-bg             /* Option background (white) */
--select-option-padding        /* Option padding (8px 12px) */
--select-option-hover-bg       /* Hover background (#f3f4f6) */
--select-option-hover-color    /* Hover text color (#1f2937) */
--select-option-selected-bg    /* Selected background (#e0e7ff) */
--select-option-selected-color /* Selected text color (#4338ca) */
--select-option-selected-border /* Selected border (inherits option border by default) */
--select-option-selected-hover-bg /* Selected+hover background (inherits selected bg by default) */
--select-option-selected-hover-border /* Selected+hover border (inherits selected border by default) */
--select-option-active-bg      /* Active background (#f3f4f6) */
--select-option-active-color   /* Active text color (#1f2937) */
--select-dropdown-bg           /* Dropdown background (white) */
--select-dropdown-border       /* Dropdown border color (#ccc) */
--select-dropdown-shadow       /* Dropdown shadow */
```

**Dark Mode (Opt-in)**
```css
--select-dark-bg               /* Dark input background (#1f2937) */
--select-dark-text             /* Dark text color (#f9fafb) */
--select-dark-border           /* Dark border color (#4b5563) */
--select-dark-dropdown-bg      /* Dark dropdown background (#1f2937) */
--select-dark-options-bg       /* Dark options container bg (#1f2937) */
--select-dark-option-color     /* Dark option text (#f9fafb) */
--select-dark-option-bg        /* Dark option background (#1f2937) */
--select-dark-option-hover-bg  /* Dark hover background (#374151) */
--select-dark-option-selected-bg /* Dark selected bg (#3730a3) */
```

**Complete CSS Variables List (60+ variables)**

See the [full CSS variables reference](https://github.com/navidrezadoost/smilodon/blob/main/CHANGELOG.md#135---2026-02-09) for all 60+ customizable properties including:
- Input container (gap, padding, height, borders, focus states)
- Input field (width, padding, font, colors)
- Arrow/icon (size, color, hover states, position)
- **Separator line** (width, height, gradient, position)
- **Selection badges** (padding, colors, **remove/delete button**)
- Dropdown (margins, max-height, borders, shadows)
- Options (font size, line height, borders, transitions)
- Load more button (padding, borders, colors, hover states)
- Loading/empty states (padding, colors, backgrounds, spinner)

#### Highlighted Customization Features

**Separator Line Between Input and Arrow**
The vertical separator line that appears between the input area and the dropdown arrow is fully customizable:

```css
enhanced-select {
  /* Customize the separator line */
  --select-separator-width: 2px;           /* Line thickness */
  --select-separator-height: 80%;          /* Line height */
  --select-separator-position: 40px;       /* Distance from right edge */
  --select-separator-gradient: linear-gradient(
    to bottom,
    transparent 0%,
    #3b82f6 20%,
    #3b82f6 80%,
    transparent 100%
  );
}
```

**Badge Remove/Delete Button (Multi-Select)**
The × button that removes selected items in multi-select mode is fully customizable:

```css
enhanced-select {
  /* Customize badge appearance */
  --select-badge-bg: #10b981;              /* Badge background */
  --select-badge-color: white;             /* Badge text color */
  --select-badge-padding: 6px 10px;        /* Badge spacing */
  
  /* Customize the × (remove/delete) button */
  --select-badge-remove-size: 18px;        /* Button size */
  --select-badge-remove-bg: rgba(255, 255, 255, 0.3);  /* Button background */
  --select-badge-remove-color: white;      /* × symbol color */
  --select-badge-remove-font-size: 18px;   /* × symbol size */
  --select-badge-remove-hover-bg: rgba(255, 255, 255, 0.6);  /* Hover state */
}
```

#### Real-World Customization Examples

**Example 1: Bootstrap-style Select**
```css
enhanced-select {
  --select-input-border: 1px solid #ced4da;
  --select-input-border-radius: 0.375rem;
  --select-input-focus-border: #86b7fe;
  --select-input-focus-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  --select-option-hover-bg: #e9ecef;
  --select-option-selected-bg: #0d6efd;
  --select-option-selected-color: white;
  --select-badge-bg: #0d6efd;
}
```

**Example 2: Material Design**
```css
enhanced-select {
  --select-input-border-radius: 4px;
  --select-input-focus-border: #1976d2;
  --select-input-focus-shadow: none;
  --select-option-padding: 16px;
  --select-option-hover-bg: rgba(0, 0, 0, 0.04);
  --select-option-selected-bg: #e3f2fd;
  --select-option-selected-color: #1976d2;
  --select-badge-bg: #1976d2;
  --select-badge-border-radius: 16px;
}
```

**Example 3: Tailwind-style**
```css
enhanced-select {
  --select-input-border: 1px solid #e5e7eb;
  --select-input-border-radius: 0.5rem;
  --select-input-focus-border: #3b82f6;
  --select-input-focus-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  --select-option-padding: 0.5rem 0.75rem;
  --select-option-hover-bg: #f3f4f6;
  --select-option-selected-bg: #dbeafe;
  --select-option-selected-color: #1e40af;
}
```

**Example 4: Custom Brand Colors**
```css
enhanced-select {
  /* Your brand colors */
  --select-input-focus-border: #ff6b6b;
  --select-arrow-color: #ff6b6b;
  --select-badge-bg: #ff6b6b;
  --select-option-selected-bg: #ffe0e0;
  --select-option-selected-color: #c92a2a;
  --select-button-border: 1px solid #ff6b6b;
  --select-button-color: #ff6b6b;
  --select-button-hover-bg: #ff6b6b;
}
```

#### Framework-Specific Examples

**React - Customizing Separator & Badge Remove Button**
```jsx
import { Select } from '@smilodon/react';

function App() {
  return (
    <Select
      items={items}
      multiple
      style={{
        '--select-option-hover-bg': '#2563eb',
        '--select-option-padding': '12px 16px',
        '--select-badge-bg': '#3b82f6',
        '--select-badge-remove-bg': 'rgba(255, 255, 255, 0.4)',
        '--select-badge-remove-hover-bg': 'rgba(255, 255, 255, 0.7)',
        '--select-separator-gradient': 'linear-gradient(to bottom, transparent 0%, #3b82f6 20%, #3b82f6 80%, transparent 100%)'
      }}
    />
  );
}
```

**Vue - Complete Customization**
```vue
<template>
  <Select
    :items="items"
    multiple
    :style="{
      '--select-option-hover-bg': '#2563eb',
      '--select-option-padding': '12px 16px',
      '--select-badge-bg': '#3b82f6',
      '--select-badge-remove-size': '20px',
      '--select-badge-remove-bg': 'rgba(255, 255, 255, 0.4)',
      '--select-separator-width': '2px',
      '--select-separator-height': '70%'
    }"
  />
</template>
```

**Svelte - Themed Components**
```svelte
<script>
  import { Select } from '@smilodon/svelte';
</script>

<Select
  items={items}
  multiple
  style="
    --select-badge-bg: #10b981;
    --select-badge-remove-bg: rgba(255, 255, 255, 0.3);
    --select-badge-remove-hover-bg: rgba(255, 255, 255, 0.6);
    --select-separator-gradient: linear-gradient(to bottom, transparent, #10b981, transparent);
  "
/>
```

**Vanilla JS - Dynamic Styling**
```javascript
const select = document.querySelector('enhanced-select');

// Apply custom separator and badge styles
select.style.setProperty('--select-separator-width', '2px');
select.style.setProperty('--select-separator-gradient', 'linear-gradient(to bottom, transparent, #ff6b6b, transparent)');
select.style.setProperty('--select-badge-bg', '#ff6b6b');
select.style.setProperty('--select-badge-remove-size', '18px');
select.style.setProperty('--select-badge-remove-bg', 'rgba(255, 255, 255, 0.3)');
```

### Server-Side Rendering (SSR)

Smilodon gracefully handles SSR environments:

```javascript
// Check if running in browser
if (typeof window !== 'undefined') {
  import('@smilodon/core').then(() => {
    // Initialize after hydration
  });
}
```

### Performance Monitoring

Enable telemetry to monitor performance:

```javascript
select.enableTelemetry = true;

select.addEventListener('telemetry', (event) => {
  console.log('Performance metrics:', event.detail);
  // { renderTime, searchTime, scrollFPS, memoryUsage }
});
```

## Architecture

Smilodon's performance comes from three core optimizations:

1. **Virtual Scrolling**: Only renders visible items (10-15 DOM nodes for any dataset size)
2. **Work Stealing Scheduler**: Search operations run in background workers with automatic cancellation
3. **Fenwick Tree Indexing**: O(log n) search queries instead of O(n) array scans

Read the [full architecture guide](https://github.com/navidrezadoost/smilodon/blob/main/ARCHITECTURE.md) for implementation details.

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14.1+ |
| Edge | 90+ |

Requires browsers with native Web Components support (custom elements v1).

## Bundle Size

- **Runtime**: 6.6 KB gzipped (ESM)
- **Full Package**: 365 KB (includes 5 formats + source maps + types)
- **Tree-shakeable**: Import only what you need

## TypeScript

Full TypeScript definitions included. No need for `@types/*` packages.

```typescript
import type { SmilodonSelectElement, SelectItem } from '@smilodon/core';

const items: SelectItem[] = [
  { label: 'Option 1', value: 1 },
  { label: 'Option 2', value: 2 }
];

const select = document.querySelector('smilodon-select') as SmilodonSelectElement;
select.items = items;
```

## Documentation

- **Main README**: [Complete guide with framework examples](https://github.com/navidrezadoost/smilodon#readme)
- **Benchmarks**: [Transparent performance comparisons](https://github.com/navidrezadoost/smilodon/blob/main/docs/BENCHMARKS.md)
- **API Reference**: [Full API documentation](https://github.com/navidrezadoost/smilodon/blob/main/docs/API-REFERENCE.md)
- **Architecture**: [Technical deep-dive](https://github.com/navidrezadoost/smilodon/blob/main/ARCHITECTURE.md)
- **Migration Guide**: [Migrate from React Select, Vue Select, etc.](https://github.com/navidrezadoost/smilodon/blob/main/docs/MIGRATION.md)

## Examples

Visit the [interactive playground](https://github.com/navidrezadoost/smilodon/tree/main/playground) to see Smilodon in action with:
- 1M item datasets
- Real-time search
- Framework integrations
- Custom styling

## Contributing

Contributions are welcome! Please read our [Contributing Guide](https://github.com/navidrezadoost/smilodon/blob/main/CONTRIBUTING.md) for details.

## License

MIT © [Navid Rezadoost](https://github.com/navidrezadoost)

## Support

- **Issues**: [GitHub Issues](https://github.com/navidrezadoost/smilodon/issues)
- **Discussions**: [GitHub Discussions](https://github.com/navidrezadoost/smilodon/discussions)
- **Security**: [Security Policy](https://github.com/navidrezadoost/smilodon/blob/main/SECURITY.md)

---

<div align="center">
  <p>Made with ⚡ by the Smilodon team</p>
  <p>
    <a href="https://github.com/navidrezadoost/smilodon">GitHub</a> •
    <a href="https://www.npmjs.com/package/@smilodon/core">npm</a> •
    <a href="https://github.com/navidrezadoost/smilodon/blob/main/docs/BENCHMARKS.md">Benchmarks</a>
  </p>
</div>
