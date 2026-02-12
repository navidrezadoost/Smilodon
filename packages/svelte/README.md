# @smilodon/svelte

Production-ready, accessible select component for Svelte applications. Part of the [Smilodon](https://github.com/navidrezadoost/smilodon) UI toolkit.

## 📖 Documentation

**For comprehensive documentation covering all features, styling options, and advanced patterns:**

👉 **[Complete Svelte Guide](./COMPLETE-GUIDE.md)** 👈

The complete guide includes:
- ✅ All 60+ CSS variables for complete customization
- ✅ Svelte-specific patterns (reactive statements, stores, bind:value)
- ✅ Complete API reference with TypeScript types
- ✅ Svelte stores integration (writable, derived)
- ✅ Custom renderers returning HTML strings
- ✅ Theme examples with :global() styling
- ✅ Advanced patterns (Context API, reactive dependencies)
- ✅ Troubleshooting and accessibility information

---

## Features

- New: `optionRenderer` prop (Option B) lets you return an `HTMLElement` for custom DOM-driven option layouts.

- ✨ **Single & Multi-Select** - Choose one or multiple options
- 🔍 **Searchable** - Filter options with built-in or custom search
- ♿ **Fully Accessible** - WCAG 2.1 AAA compliant
- ⚡ **Virtual Scrolling** - Handle 100k+ options smoothly
- 📜 **Infinite Scroll** - Load data progressively
- 👥 **Grouped Options** - Organize options into categories
- 🎨 **Customizable** - Style with CSS variables or custom themes
- 📦 **Tiny Bundle** - ~2KB gzipped
- 🔧 **TypeScript** - Full type safety included

## Installation

```bash
npm install @smilodon/svelte @smilodon/core
```

## Quick Start

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  const items = [
    { value: '1', label: 'Apple' },
    { value: '2', label: 'Banana' },
    { value: '3', label: 'Cherry' },
  ];

  let selectedValue;
</script>

<Select {items} bind:value={selectedValue} placeholder="Select a fruit..." />
```

## Examples

### Searchable Select

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  const items = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'mx', label: 'Mexico' },
  ];

  let country;
</script>

<Select
  {items}
  bind:value={country}
  searchable
  placeholder="Search countries..."
/>
```

### Multi-Select

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  const items = [
    { value: 'js', label: 'JavaScript' },
    { value: 'ts', label: 'TypeScript' },
    { value: 'py', label: 'Python' },
  ];

  let languages = [];
</script>

<Select
  {items}
  bind:value={languages}
  multiple
  placeholder="Select languages..."
/>
```

### Grouped Options

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  const groupedItems = [
    {
      group: 'Fruits',
      items: [
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
      ],
    },
    {
      group: 'Vegetables',
      items: [
        { value: 'carrot', label: 'Carrot' },
        { value: 'potato', label: 'Potato' },
      ],
    },
  ];

  let food;
</script>

<Select {groupedItems} bind:value={food} />
```

### Infinite Scroll

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  let items = generateItems(1, 50);
  let page = 1;

  function handleLoadMore() {
    page++;
    const newItems = generateItems(page * 50 + 1, (page + 1) * 50);
    items = [...items, ...newItems];
  }

  function generateItems(start, end) {
    return Array.from({ length: end - start + 1 }, (_, i) => ({
      value: start + i,
      label: `Item ${start + i}`,
    }));
  }
</script>

<Select
  {items}
  infiniteScroll
  pageSize={50}
  on:loadMore={handleLoadMore}
  placeholder="Scroll to load more..."
/>
```

### Virtual Scrolling (Large Datasets)

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  // Generate 100,000 items
  const items = Array.from({ length: 100000 }, (_, i) => ({
    value: i + 1,
    label: `Item ${i + 1}`,
  }));
</script>

<Select
  {items}
  virtualized
  searchable
  placeholder="100k items with virtual scrolling..."
/>
```

### Server-Side Search

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  let items = [];
  let isLoading = false;

  async function handleSearch(event) {
    const query = event.detail.query;
    
    if (!query) {
      items = [];
      return;
    }

    isLoading = true;
    const response = await fetch(`/api/search?q=${query}`);
    const data = await response.json();
    items = data.results;
    isLoading = false;
  }
</script>

<Select
  {items}
  searchable
  on:search={handleSearch}
  placeholder="Type to search..."
/>
```

### Controlled Component

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  const items = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
  ];

  let status = 'draft';

  function handleChange(event) {
    console.log('Status changed:', event.detail.value);
    status = event.detail.value;
  }
</script>

<Select
  {items}
  value={status}
  on:change={handleChange}
/>

<button on:click={() => status = 'published'}>
  Publish
</button>
```

### Imperative API

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  let selectRef;
  const items = [...];

  function programmaticOpen() {
    selectRef.open();
  }

  function programmaticClear() {
    selectRef.clear();
  }
</script>

<Select bind:this={selectRef} {items} />

<button on:click={programmaticOpen}>Open Select</button>
<button on:click={programmaticClear}>Clear Selection</button>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `SelectItem[]` | `[]` | Array of selectable items |
| `groupedItems` | `GroupedItem[]` | `undefined` | Grouped items array |
| `value` | `string \| number \| Array` | `undefined` | Controlled value |
| `defaultValue` | `string \| number \| Array` | `undefined` | Initial value (uncontrolled) |
| `multiple` | `boolean` | `false` | Enable multi-select |
| `searchable` | `boolean` | `false` | Enable search/filter |
| `placeholder` | `string` | `''` | Placeholder text |
| `disabled` | `boolean` | `false` | Disable the select |
| `required` | `boolean` | `false` | Mark as required |
| `error` | `boolean` | `false` | Show error state |
| `infiniteScroll` | `boolean` | `false` | Enable infinite scroll |
| `pageSize` | `number` | `50` | Items per page (infinite scroll) |
| `virtualized` | `boolean` | `true` | Enable virtual scrolling |
| `maxSelections` | `number` | `undefined` | Max selections (multi-select) |
| `placement` | `'bottom' \| 'top' \| 'auto'` | `'auto'` | Dropdown placement |
| `className` | `string` | `''` | Custom CSS class |
| `style` | `string` | `''` | Custom inline styles |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `change` | `{ value, selectedItems }` | Value changed |
| `select` | `{ item, index }` | Item selected |
| `open` | `void` | Dropdown opened |
| `close` | `void` | Dropdown closed |
| `search` | `{ query }` | Search query changed |
| `loadMore` | `{ page }` | Load more requested |
| `create` | `{ value }` | New item creation |

## Methods

Access these methods using `bind:this`:

| Method | Signature | Description |
|--------|-----------|-------------|
| `open()` | `() => void` | Open the dropdown |
| `close()` | `() => void` | Close the dropdown |
| `focus()` | `() => void` | Focus the select |
| `clear()` | `() => void` | Clear selection |
| `setItems()` | `(items: SelectItem[]) => void` | Update items |
| `setGroupedItems()` | `(groups: GroupedItem[]) => void` | Update grouped items |

## Types

```typescript
interface SelectItem {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
  [key: string]: any;
}

interface GroupedItem {
  group: string;
  items: SelectItem[];
}
```

---

## 🎯 Two Ways to Specify Options

Smilodon Svelte provides **two powerful approaches** for defining select options, each optimized for different use cases:

### Method 1: Data-Driven (Object Arrays) 📊

**Use when**: You have structured data and want simple, declarative option rendering.

**Advantages**:
- ✅ Simple and declarative - Svelte-friendly
- ✅ Auto-conversion from strings/numbers
- ✅ Perfect for basic dropdowns
- ✅ Works seamlessly with Svelte stores
- ✅ Extremely performant (millions of items)
- ✅ Built-in search and filtering
- ✅ Full TypeScript type safety

**Examples**:

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  // Example 1: Simple object array
  let value = '';

  const items = [
    { value: '1', label: 'Apple' },
    { value: '2', label: 'Banana' },
    { value: '3', label: 'Cherry' }
  ];
</script>

<Select
  items={items}
  bind:value
  placeholder="Select a fruit..."
/>
```

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  // Example 2: With metadata and disabled options
  let country = '';

  const countries = [
    { value: 'us', label: 'United States', disabled: false },
    { value: 'ca', label: 'Canada', disabled: false },
    { value: 'mx', label: 'Mexico', disabled: true }
  ];
</script>

<Select
  items={countries}
  bind:value={country}
  placeholder="Select a country..."
/>
```

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  // Example 3: With grouping
  let food = '';

  const foods = [
    { value: 'apple', label: 'Apple', group: 'Fruits' },
    { value: 'banana', label: 'Banana', group: 'Fruits' },
    { value: 'carrot', label: 'Carrot', group: 'Vegetables' },
    { value: 'broccoli', label: 'Broccoli', group: 'Vegetables' }
  ];
</script>

<Select
  items={foods}
  bind:value={food}
  placeholder="Select food..."
/>
```

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  // Example 4: Auto-conversion from strings
  let color = '';
  const colors = ['Red', 'Green', 'Blue', 'Yellow'];
</script>

<Select
  items={colors}
  bind:value={color}
  placeholder="Select a color..."
/>
```

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  // Example 5: Auto-conversion from numbers
  let size: number | string = '';
  const sizes = [10, 20, 30, 40, 50];
</script>

<Select
  items={sizes}
  bind:value={size}
  placeholder="Select size..."
/>
```

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  // Example 6: Large datasets with reactive statement
  let id = '';

  $: items = Array.from({ length: 100_000 }, (_, i) => ({
    value: i.toString(),
    label: `Item ${i + 1}`
  }));
</script>

<Select
  items={items}
  bind:value={id}
  virtualized
  placeholder="Select from 100K items..."
/>
```

### Method 2: Component-Driven (Custom Renderers) 🎨

**Use when**: You need rich, interactive option content with custom HTML/styling.

**Advantages**:
- ✅ Full control over option rendering
- ✅ Rich content (images, icons, badges, multi-line text)
- ✅ Custom HTML and styling
- ✅ Reactive data binding
- ✅ Conditional rendering based on item data
- ✅ Works with Svelte stores
- ✅ Perfect for complex UIs (user cards, product listings, etc.)

**How it works**: Provide an `optionTemplate` function that returns HTML string for each option.

**Examples**:

```svelte
<script lang="ts">
  import { Select, type SelectItem } from '@smilodon/svelte';

  // Example 1: Simple custom template with icons
  interface Language extends SelectItem {
    icon: string;
    description: string;
  }

  let lang = '';

  const languages: Language[] = [
    { value: 'js', label: 'JavaScript', icon: '🟨', description: 'Dynamic scripting language' },
    { value: 'py', label: 'Python', icon: '🐍', description: 'General-purpose programming' },
    { value: 'rs', label: 'Rust', icon: '🦀', description: 'Systems programming language' }
  ];

  const languageRenderer = (item: Language, index: number) => `
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 24px;">${item.icon}</span>
      <div>
        <div style="font-weight: 600;">${item.label}</div>
        <div style="font-size: 12px; color: #6b7280;">${item.description}</div>
      </div>
    </div>
  `;
</script>

<Select
  items={languages}
  bind:value={lang}
  optionTemplate={languageRenderer}
  placeholder="Select a language..."
/>
```

```svelte
<script lang="ts">
  import { Select, type SelectItem } from '@smilodon/svelte';

  // Example 2: User selection with avatars
  interface User extends SelectItem {
    email: string;
    avatar: string;
    role: 'Admin' | 'User' | 'Moderator';
  }

  let userId = '';

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

  const userRenderer = (item: User) => `
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
</script>

<Select
  items={users}
  bind:value={userId}
  optionTemplate={userRenderer}
  placeholder="Select a user..."
/>
```

```svelte
<script lang="ts">
  import { Select, type SelectItem } from '@smilodon/svelte';

  // Example 3: Product selection with images and pricing
  interface Product extends SelectItem {
    price: number;
    stock: number;
    image: string;
    badge?: string;
  }

  let productId = '';

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

  const productRenderer = (item: Product) => `
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
</script>

<Select
  items={products}
  bind:value={productId}
  optionTemplate={productRenderer}
  placeholder="Select a product..."
/>
```

```svelte
<script lang="ts">
  import { Select, type SelectItem } from '@smilodon/svelte';

  // Example 4: Status indicators with conditional styling
  interface Task extends SelectItem {
    status: 'completed' | 'in-progress' | 'pending';
    priority: 'high' | 'medium' | 'low';
    assignee: string;
  }

  let taskId = '';

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

  const taskRenderer = (item: Task) => {
    const status = statusConfig[item.status];
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
</script>

<Select
  items={tasks}
  bind:value={taskId}
  optionTemplate={taskRenderer}
  placeholder="Select a task..."
/>
```

```svelte
<script lang="ts">
  import { Select, type SelectItem } from '@smilodon/svelte';
  import { writable } from 'svelte/store';

  // Example 5: Using Svelte stores
  interface Tag extends SelectItem {
    color: string;
    count: number;
  }

  const tag = writable('');

  const tags: Tag[] = [
    { value: 'react', label: 'React', color: 'blue', count: 1250 },
    { value: 'vue', label: 'Vue', color: 'green', count: 850 },
    { value: 'angular', label: 'Angular', color: 'red', count: 420 }
  ];

  const tagRenderer = (item: Tag) => `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="width: 12px; height: 12px; border-radius: 50%; background: ${item.color};"></span>
        <span style="font-weight: 600; color: #1f2937;">${item.label}</span>
      </div>
      <span style="font-size: 14px; color: #6b7280;">${item.count} posts</span>
    </div>
  `;
</script>

<Select
  items={tags}
  bind:value={$tag}
  optionTemplate={tagRenderer}
  placeholder="Select a tag..."
/>
```

### Comparison: When to Use Each Method

| Feature | Method 1: Object Arrays | Method 2: Custom Renderers |
|---------|------------------------|---------------------------|
| **Setup Complexity** | ⭐ Simple | ⭐⭐ Moderate |
| **Rendering Speed** | ⭐⭐⭐ Fastest | ⭐⭐ Fast |
| **Visual Customization** | ⭐⭐ Limited | ⭐⭐⭐ Unlimited |
| **Svelte Integration** | ⭐⭐⭐ Seamless | ⭐⭐⭐ Seamless |
| **Store Support** | ⭐⭐⭐ Full | ⭐⭐⭐ Full |
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
- Conditional rendering based on data
- Rich user experience is priority
- Need to integrate with Svelte stores in rendering

### Combining Both Methods

You can start with Method 1 and add Method 2 later as your UI evolves:

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  let value = '';

  // Start simple
  const items = ['Option 1', 'Option 2', 'Option 3'];

  // Later, add custom rendering without changing items
  const customRenderer = (item: any, index: number) => `
    <div style="padding: 8px; background: ${index % 2 ? '#f9fafb' : 'white'};">
      <strong>${item.label || item}</strong>
    </div>
  `;
</script>

<Select
  items={items}
  bind:value
  optionTemplate={customRenderer}
/>
```

### Performance Tips

**For Method 1**:
- Use reactive statements (`$:`) to memoize large item arrays
- Enable `virtualized` prop for 1000+ items
- Enable `infiniteScroll` for dynamic loading

**For Method 2**:
- Keep renderer function pure (no side effects)
- Avoid heavy computations in renderer
- Cache renderer functions when possible
- Use template literals for cleaner HTML strings

```svelte
<script lang="ts">
  import { Select } from '@smilodon/svelte';

  let value = '';

  // Memoize items with reactive statement
  $: items = Array.from({ length: 10000 }, (_, i) => ({
    value: i.toString(),
    label: `Item ${i + 1}`,
    description: `Description for item ${i + 1}`
  }));

  // Pure renderer function
  const renderer = (item: any, index: number) => `
    <div>
      <div style="font-weight: 600;">${item.label}</div>
      <div style="font-size: 12px; color: #666;">${item.description}</div>
    </div>
  `;
</script>

<Select
  items={items}
  bind:value
  optionTemplate={renderer}
  virtualized
  estimatedItemHeight={60}
/>
```

---

## Styling

The component uses CSS variables for easy customization:

```css
enhanced-select {
  --select-border-color: #d1d5db;
  --select-focus-border-color: #3b82f6;
  --select-background: white;
  --select-text-color: #1f2937;
  --select-placeholder-color: #9ca3af;
  --select-option-hover-background: #f3f4f6;
  --select-option-selected-background: #eff6ff;
  --select-border-radius: 0.375rem;
  --select-padding: 0.5rem 0.75rem;
}
```

## Accessibility

This component is fully accessible and compliant with WCAG 2.1 AAA standards:

- ✅ Keyboard navigation (Arrow keys, Enter, Escape, Tab)
- ✅ Screen reader support (ARIA labels and live regions)
- ✅ Focus management
- ✅ High contrast mode support
- ✅ Reduced motion support

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## License

MIT © [Navid Rezadoost](https://github.com/navidrezadoost)

## Contributing

Contributions are welcome! Please see the [main repository](https://github.com/navidrezadoost/smilodon) for guidelines.
