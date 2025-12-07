# Enhanced Select - Quick Reference Card

## 🚀 Quick Install

```bash
npm install @smilodon/core @smilodon/react  # or vue/svelte/angular
```

## 📝 Basic Usage (All Frameworks)

### React
```tsx
import { Select } from '@smilodon/react';

<Select items={items} onOptionSelect={(data) => console.log(data.value)} />
```

### Vue
```vue
<Select :items="items" @select="handleSelect" />
```

### Svelte
```svelte
<Select {items} on:select={handleSelect} />
```

### Angular
```html
<smilodon-select [items]="items" (select)="handleSelect($event)"></smilodon-select>
```

## ⚙️ Global Configuration

```typescript
import { configureSelect } from '@smilodon/core';

configureSelect({
  selection: { mode: 'multi' },
  scrollToSelected: { enabled: true },
  busyBucket: { enabled: true },
});
```

## 🎛️ Common Configurations

### Multi-Select with Remove
```typescript
config: {
  selection: {
    mode: 'multi',
    showRemoveButton: true,
    maxSelections: 10,
  },
}
```

### Server-Side Selection
```typescript
config: {
  serverSide: {
    enabled: true,
    initialSelectedValues: [1, 2, 3],
    fetchSelectedItems: async (values) => {
      const res = await fetch(`/api/items?ids=${values.join(',')}`);
      return res.json();
    },
  },
}
```

### Infinite Scroll
```typescript
config: {
  infiniteScroll: {
    enabled: true,
    pageSize: 20,
    cachePages: true,
  },
}
```

### Load More
```typescript
config: {
  loadMore: {
    enabled: true,
    itemsPerLoad: 3,
  },
}
```

### Scroll to Selected
```typescript
config: {
  scrollToSelected: {
    enabled: true,
    multiSelectTarget: 'first', // or 'last'
  },
}
```

## 🎨 Styling

### CSS Variables
```css
:root {
  --select-border-color: #ccc;
  --select-border-focus-color: #1976d2;
  --select-option-selected-bg: #e3f2fd;
  --select-option-hover-bg: #f0f0f0;
}
```

### Inline Styles
```typescript
config: {
  styles: {
    container: { width: '300px' },
    option: { padding: '12px' },
    selectedOption: { backgroundColor: '#4caf50' },
  },
}
```

## 📞 Callbacks

All callbacks receive: `{ item, index, value, label, selected }`

```typescript
onOptionSelect={(data) => {
  console.log('Value:', data.value);
  console.log('Label:', data.label);
  console.log('Selected:', data.selected);
}}

onChange={(items, values) => {
  console.log('Selected values:', values);
}}

onLoadMore={(page) => {
  // Load next page
}}
```

## 🔧 Public Methods

```typescript
const selectRef = useRef();

selectRef.current.getSelectedValues()  // Get selected values
selectRef.current.setSelectedValues([1, 2])  // Set selected values
selectRef.current.clear()  // Clear all selections
selectRef.current.open()  // Open dropdown
selectRef.current.close()  // Close dropdown
selectRef.current.setItems(items)  // Update items
```

## 💡 Common Patterns

### Pattern 1: Form Integration
```tsx
const [formData, setFormData] = useState({});

<Select
  items={items}
  selectedValues={formData.category}
  onSelectionChange={(items, values) => {
    setFormData({ ...formData, category: values });
  }}
/>
```

### Pattern 2: API Integration
```tsx
<Select
  items={items}
  config={{
    serverSide: {
      enabled: true,
      fetchSelectedItems: fetchByIds,
    },
  }}
  onLoadMore={async (page) => {
    const newItems = await fetchPage(page);
    setItems([...items, ...newItems]);
  }}
/>
```

### Pattern 3: Conditional Features
```tsx
const config = {
  selection: {
    mode: isMulti ? 'multi' : 'single',
  },
  searchable: items.length > 10,
};

<Select items={items} config={config} />
```

## 🎯 Solving Common Challenges

### Challenge 1: Pre-Selected Items Not in Current Page
```typescript
config: {
  serverSide: {
    enabled: true,
    initialSelectedValues: [5, 12, 23],
    fetchSelectedItems: async (values) => {
      return await fetchByIds(values); // Fetch by ID, not page
    },
  },
}
```

### Challenge 2: Selected Item on Distant Page
```typescript
config: {
  infiniteScroll: { enabled: true, pageSize: 20 },
  serverSide: {
    enabled: true,
    fetchSelectedItems: fetchByIds, // Targeted fetch
  },
  scrollToSelected: { enabled: true },
}
```

## 🔑 Configuration Priority

```
Runtime Updates (highest)
    ↓
Component Config
    ↓
Global Config (lowest)
```

Component config always overrides global config!

## 📚 Full Documentation

- **User Guide**: `docs/SELECT-COMPONENT.md`
- **Implementation**: `docs/SELECT-IMPLEMENTATION.md`
- **Migration**: `docs/SELECT-MIGRATION.md`
- **Examples**: `examples/select-examples.html`

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Styles not applying | Check CSS variable names in `:root` |
| Selected items not persisting | Use controlled mode with `selectedValues` |
| Server selection not working | Ensure `fetchSelectedItems` is async |
| Global config ignored | Call `configureSelect()` before rendering |

## 💻 TypeScript Support

```typescript
import type { 
  GlobalSelectConfig,
  SelectEventDetail,
  OptionEventDetail,
} from '@smilodon/core';

const config: GlobalSelectConfig = { /* ... */ };
```

## ⌨️ Keyboard Shortcuts

- **↑/↓**: Navigate options
- **Enter/Space**: Select option
- **Escape**: Close dropdown
- **Home/End**: First/last option
- **Page Up/Down**: Jump 10 options
- **Type**: Type-ahead search

## 🎓 Best Practices

1. ✅ Set global config in app initialization
2. ✅ Use controlled mode for forms
3. ✅ Enable virtualization for large lists (>100 items)
4. ✅ Use server-side selection for pre-selected items
5. ✅ Enable page caching for infinite scroll
6. ✅ Set minimum display time for busy state (200ms+)
7. ✅ Use CSS variables for theming
8. ✅ Provide value/label accessors for custom objects

## 🚦 Quick Decision Guide

**Use NativeSelect when:**
- Simple dropdown needed
- Performance is critical
- Minimal features required

**Use EnhancedSelect when:**
- Need infinite scroll
- Server-side selection required
- Multi-select with advanced features
- Load more functionality needed
- Full customization required

---

**Keep this card handy! 📌**
