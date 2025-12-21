# Migration Guide: Enhanced Select Component

## Overview

This guide helps you migrate from basic select implementations to the enhanced select component with all its advanced features.

## Quick Migration Checklist

- [ ] Install `@smilodon/core` and framework adapter
- [ ] Replace old select imports
- [ ] Update configuration to use new config system
- [ ] Migrate event handlers to new callback format
- [ ] (Optional) Set up global configuration
- [ ] (Optional) Enable advanced features (infinite scroll, server-side, etc.)
- [ ] Test all scenarios
- [ ] Update styles/themes

## Installation

```bash
# Core library (required)
npm install @smilodon/core

# Framework adapters (choose one or more)
npm install @smilodon/react
npm install @smilodon/vue
npm install @smilodon/svelte
```

**Note:** Angular support has been discontinued. Smilodon now supports React, Vue, Svelte, and Vanilla JavaScript only.

## Migration by Framework

### React Migration

**Before:**
```tsx
import Select from 'react-select';

<Select
  options={options}
  value={selectedOption}
  onChange={handleChange}
  isMulti={true}
/>
```

**After:**
```tsx
import { Select } from '@smilodon/react';

<Select
  items={items}
  selectedValues={selectedValues}
  onSelectionChange={(items, values) => setSelectedValues(values)}
  onOptionSelect={(data) => {
    console.log('Selected:', data.value, data.label);
  }}
  config={{
    selection: { mode: 'multi' },
  }}
/>
```

**Key Changes:**
- `options` → `items`
- `value` → `selectedValues`
- `onChange` → `onSelectionChange`
- `isMulti` → `config.selection.mode`
- New: `onOptionSelect` callback receives `{ item, index, value, label, selected }`

### Vue Migration

**Before:**
```vue
<template>
  <vue-select
    v-model="selected"
    :options="options"
    :multiple="true"
  />
</template>
```

**After:**
```vue
<template>
  <Select
    :items="items"
    v-model="selectedValues"
    :config="{ selection: { mode: 'multi' } }"
    @select="handleSelect"
  />
</template>

<script setup>
import Select from '@smilodon/vue';

function handleSelect(data) {
  console.log('Selected:', data.value, data.label);
}
</script>
```

### Svelte Migration

**Before:**
```svelte
<Select
  bind:value={selected}
  items={options}
  multiple={true}
/>
```

**After:**
```svelte
<script>
import Select from '@smilodon/svelte';

const config = {
  selection: { mode: 'multi' },
};

function handleSelect(event) {
  console.log('Selected:', event.detail.value, event.detail.label);
}
</script>

<Select
  {items}
  bind:selectedValues
  {config}
  on:select={handleSelect}
/>
```

### Vanilla JavaScript Migration

**Before:**
```html
<select id="my-select" multiple>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</select>
```

**After:**
```html
<enhanced-select id="my-select"></enhanced-select>
<script type="module">
  import '@smilodon/core';
  
  const select = document.getElementById('my-select');
  select.setItems([
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' }
  ]);
  select.configure({ 
    selection: { mode: 'multi' } 
  });
</script>
```

## Configuration Migration

### Basic Configuration

**Before:**
```typescript
{
  isMulti: true,
  isDisabled: false,
  isSearchable: true,
  closeMenuOnSelect: true,
  placeholder: 'Select...',
}
```

**After:**
```typescript
{
  selection: {
    mode: 'multi',
    closeOnSelect: true,
  },
  enabled: true,
  searchable: true,
  placeholder: 'Select...',
}
```

### Styling Migration

**Before:**
```typescript
{
  styles: {
    control: (provided) => ({ ...provided, borderColor: 'blue' }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? 'blue' : 'white',
    }),
  },
}
```

**After:**
```typescript
{
  styles: {
    container: {
      border: '1px solid blue',
    },
    selectedOption: {
      backgroundColor: 'blue',
    },
    option: {
      backgroundColor: 'white',
    },
  },
}
```

Or use CSS variables:
```css
:root {
  --select-border-color: blue;
  --select-option-selected-bg: blue;
}
```

## Feature Migration

### Infinite Scroll

**Before (custom implementation):**
```typescript
const [page, setPage] = useState(1);
const loadMore = () => {
  fetchItems(page + 1).then(items => {
    setOptions([...options, ...items]);
    setPage(page + 1);
  });
};
```

**After:**
```typescript
<Select
  items={items}
  config={{
    infiniteScroll: {
      enabled: true,
      pageSize: 20,
      cachePages: true,
    },
  }}
  onLoadMore={(page) => {
    fetchItems(page).then(newItems => {
      setItems([...items, ...newItems]);
    });
  }}
/>
```

### Server-Side Selection

**Before (manual fetching):**
```typescript
useEffect(() => {
  if (selectedIds.length > 0) {
    Promise.all(selectedIds.map(id => fetchItem(id)))
      .then(items => setSelectedItems(items));
  }
}, [selectedIds]);
```

**After:**
```typescript
<Select
  items={currentPageItems}
  config={{
    serverSide: {
      enabled: true,
      initialSelectedValues: selectedIds,
      fetchSelectedItems: async (values) => {
        const response = await fetch(`/api/items?ids=${values.join(',')}`);
        return response.json();
      },
    },
  }}
/>
```

### Multi-Select with Remove

**Before (custom chips):**
```tsx
{selectedItems.map(item => (
  <Chip
    key={item.id}
    label={item.label}
    onDelete={() => handleRemove(item.id)}
  />
))}
```

**After:**
```tsx
<Select
  items={items}
  config={{
    selection: {
      mode: 'multi',
      showRemoveButton: true, // Built-in remove buttons
    },
  }}
/>
```

## Global Configuration Setup

Set defaults once for all select instances:

```typescript
// In your app initialization (e.g., main.ts, App.tsx)
import { configureSelect } from '@smilodon/core';

configureSelect({
  selection: {
    mode: 'single',
    closeOnSelect: true,
  },
  scrollToSelected: {
    enabled: true,
  },
  busyBucket: {
    enabled: true,
    showSpinner: true,
  },
  styles: {
    classNames: {
      container: 'custom-select',
      dropdown: 'custom-dropdown',
    },
  },
});
```

Then use without config in components:
```tsx
<Select items={items} /> // Uses global config
```

Override when needed:
```tsx
<Select
  items={items}
  config={{ selection: { mode: 'multi' } }} // Overrides global
/>
```

## Event Handler Migration

### Before (various formats)

```typescript
// React Select
onChange={(option) => {
  console.log(option.value, option.label);
}}

// Material UI
onChange={(event, value) => {
  console.log(value);
}}

// Custom
onSelect={(item) => {
  console.log(item);
}}
```

### After (unified format)

All frameworks receive the same structure:

```typescript
onOptionSelect={(data) => {
  console.log('Item:', data.item);
  console.log('Index:', data.index);
  console.log('Value:', data.value);
  console.log('Label:', data.label);
  console.log('Selected:', data.selected);
}}
```

## Advanced Features

### 1. Scroll to Selected on Open

```typescript
config: {
  scrollToSelected: {
    enabled: true,
    multiSelectTarget: 'first', // or 'last'
    behavior: 'smooth',
  },
}
```

### 2. Load More Functionality

```typescript
config: {
  loadMore: {
    enabled: true,
    itemsPerLoad: 3,
    showLoader: true,
  },
}
```

### 3. Busy State Management

```typescript
config: {
  busyBucket: {
    enabled: true,
    showSpinner: true,
    message: 'Loading...',
    minDisplayTime: 200, // Prevents flashing
  },
}
```

### 4. Maximum Selections

```typescript
config: {
  selection: {
    mode: 'multi',
    maxSelections: 5,
  },
}
```

### 5. Custom Value/Label Accessors

```typescript
config: {
  serverSide: {
    getValueFromItem: (item) => item.id,
    getLabelFromItem: (item) => item.name,
  },
}
```

## Testing Migration

### Before
```typescript
it('should select option', () => {
  const { getByText } = render(<Select options={options} />);
  fireEvent.click(getByText('Option 1'));
  expect(onChange).toHaveBeenCalledWith({ value: 1, label: 'Option 1' });
});
```

### After
```typescript
it('should select option', () => {
  const { getByText } = render(<Select items={items} />);
  fireEvent.click(getByText('Option 1'));
  expect(onOptionSelect).toHaveBeenCalledWith({
    item: { value: 1, label: 'Option 1' },
    index: 0,
    value: 1,
    label: 'Option 1',
    selected: true,
  });
});
```

## Performance Optimization

Enable virtualization for large lists:

```typescript
config: {
  virtualize: true,
  estimatedItemHeight: 48,
}
```

Enable page caching for infinite scroll:

```typescript
config: {
  infiniteScroll: {
    enabled: true,
    cachePages: true,
    maxCachedPages: 10,
  },
}
```

## Troubleshooting

### Issue: Styles not applying

**Solution:** Check CSS variable names and ensure they're defined in `:root` or on a parent element.

### Issue: Selected items not persisting

**Solution:** Use controlled mode with `selectedValues` prop and `onSelectionChange` handler.

### Issue: Server-side selection not working

**Solution:** Ensure `fetchSelectedItems` is async and returns items in the correct format.

### Issue: Global config not being applied

**Solution:** Call `configureSelect()` before rendering any select components.

### Issue: Component override not working

**Solution:** Ensure you're passing `config` prop to the component.

## Common Patterns

### Pattern 1: Form Integration

```tsx
const [formData, setFormData] = useState({ category: [] });

<Select
  items={categories}
  selectedValues={formData.category}
  onSelectionChange={(items, values) => {
    setFormData({ ...formData, category: values });
  }}
/>
```

### Pattern 2: API Integration

```tsx
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  setLoading(true);
  fetchItems().then(data => {
    setItems(data);
    setLoading(false);
  });
}, []);

<Select
  items={items}
  config={{
    busyBucket: { enabled: loading },
  }}
/>
```

### Pattern 3: Conditional Features

```tsx
const config = useMemo(() => ({
  selection: {
    mode: isMulti ? 'multi' : 'single',
    showRemoveButton: isMulti,
  },
  searchable: items.length > 10,
  loadMore: {
    enabled: items.length > 20,
  },
}), [isMulti, items.length]);

<Select items={items} config={config} />
```

## Next Steps

1. ✅ Install packages
2. ✅ Update imports
3. ✅ Migrate configuration
4. ✅ Update event handlers
5. ✅ Test all scenarios
6. ✅ Enable advanced features as needed
7. ✅ Customize styles
8. ✅ Set up global configuration

## Resources

- [Complete Documentation](./SELECT-COMPONENT.md)
- [Implementation Details](./SELECT-IMPLEMENTATION.md)
- [Interactive Examples](../examples/select-examples.html)
- [API Reference](./API-REFERENCE.md)

## Support

For issues or questions:
- Check documentation first
- Review examples
- Open an issue on GitHub
- Contact support

---

**Happy migrating! 🚀**
