# Smilodon Select - Two Ways to Specify Options

## 📖 Overview

Smilodon provides **two powerful methods** for specifying select options, giving you flexibility based on your use case:

1. **📦 Array of Objects** - Simple, declarative data (recommended for most use cases)
2. **⚛️ Array of Components** - Custom rendering with framework components (for advanced UIs)

This guide provides comprehensive examples for all frameworks showing both methods, their use cases, and the full potential of each approach.

---

## Table of Contents

1. [Method 1: Array of Objects (Data-Driven)](#method-1-array-of-objects-data-driven)
2. [Method 2: Array of Components (Custom Rendering)](#method-2-array-of-components-custom-rendering)
3. [Comparison & When to Use Each](#comparison--when-to-use-each)
4. [Framework-Specific Examples](#framework-specific-examples)

---

## Method 1: Array of Objects (Data-Driven)

### 🎯 Best For
- Standard dropdowns with text/icons
- Large datasets (10K+ items)
- Simple, maintainable code
- Maximum performance

### 📋 Basic Structure

```typescript
interface SelectItem {
  value: string | number;      // Unique identifier
  label: string;                // Display text
  group?: string;               // Optional grouping
  disabled?: boolean;           // Disable specific options
  [key: string]: any;          // Any custom properties
}
```

### ✨ Features

**1. Auto-Conversion**
- String arrays → SelectItem objects
- Number arrays → SelectItem objects
- Mixed arrays → Normalized SelectItem objects

**2. Simple Template Customization**
- HTML template strings
- Access to all item properties
- CSS styling via variables

**3. Performance**
- Virtual scrolling enabled by default
- Handles 1M+ items smoothly
- Minimal memory footprint

---

### 🚀 Examples - Array of Objects

#### Vanilla JavaScript / Core

```html
<enhanced-select id="fruits-select"></enhanced-select>

<script type="module">
  import '@smilodon/core';
  
  const select = document.getElementById('fruits-select');
  
  // Method 1A: Array of objects (full control)
  select.items = [
    { value: '1', label: 'Apple 🍎', category: 'Fruit', price: '$2.99' },
    { value: '2', label: 'Banana 🍌', category: 'Fruit', price: '$1.99' },
    { value: '3', label: 'Carrot 🥕', category: 'Vegetable', price: '$1.49' },
  ];
  
  // Method 1B: Simple string array (auto-converted)
  select.items = ['Apple', 'Banana', 'Cherry'];
  // Auto-converts to: [{ value: 'Apple', label: 'Apple' }, ...]
  
  // Method 1C: Number array (auto-converted)
  select.items = [1, 2, 3, 5, 8, 13];
  // Auto-converts to: [{ value: 1, label: '1' }, ...]
  
  // Custom HTML template for rich display
  select.optionTemplate = (item) => `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-weight: 600;">${item.label}</div>
        <div style="font-size: 12px; color: #666;">${item.category}</div>
      </div>
      <div style="color: #10b981; font-weight: 600;">${item.price}</div>
    </div>
  `;
</script>
```

#### React

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';

interface Product {
  value: string;
  label: string;
  category: string;
  price: string;
  inStock: boolean;
}

function ProductSelect() {
  const [value, setValue] = useState('');
  
  // Method 1A: Typed array of objects
  const products: Product[] = [
    { value: '1', label: 'Apple 🍎', category: 'Fruit', price: '$2.99', inStock: true },
    { value: '2', label: 'Banana 🍌', category: 'Fruit', price: '$1.99', inStock: true },
    { value: '3', label: 'Carrot 🥕', category: 'Vegetable', price: '$1.49', inStock: false },
  ];
  
  // Method 1B: Simple string array
  const simpleItems = ['Apple', 'Banana', 'Cherry'];
  
  return (
    <>
      {/* Rich object array with custom template */}
      <Select
        items={products}
        value={value}
        onChange={(e) => setValue(e.detail.value)}
        optionTemplate={(item: Product) => `
          <div style="display: flex; justify-content: space-between; padding: 8px;">
            <div>
              <div style="font-weight: 600; color: ${item.inStock ? '#000' : '#999'}">
                ${item.label}
              </div>
              <div style="font-size: 12px; color: #666;">${item.category}</div>
            </div>
            <div>
              <div style="color: #10b981; font-weight: 600;">${item.price}</div>
              <div style="font-size: 11px; color: ${item.inStock ? '#10b981' : '#ef4444'}">
                ${item.inStock ? 'In Stock' : 'Out of Stock'}
              </div>
            </div>
          </div>
        `}
      />
      
      {/* Simple string array (auto-converted) */}
      <Select
        items={simpleItems}
        value={value}
        onChange={(e) => setValue(e.detail.value)}
      />
    </>
  );
}
```

#### Vue 3

```vue
<template>
  <div>
    <!-- Rich object array with custom template -->
    <Select
      :items="products"
      v-model="selectedValue"
      :option-template="productTemplate"
      searchable
      placeholder="Select a product..."
    />
    
    <!-- Simple string array -->
    <Select
      :items="simpleItems"
      v-model="selectedValue"
      placeholder="Select a fruit..."
    />
  </div>
</template>

<script setup lang="ts">
import { Select } from '@smilodon/vue';
import { ref } from 'vue';

interface Product {
  value: string;
  label: string;
  category: string;
  price: string;
  inStock: boolean;
}

const selectedValue = ref('');

// Method 1A: Typed array of objects
const products = ref<Product[]>([
  { value: '1', label: 'Apple 🍎', category: 'Fruit', price: '$2.99', inStock: true },
  { value: '2', label: 'Banana 🍌', category: 'Fruit', price: '$1.99', inStock: true },
  { value: '3', label: 'Carrot 🥕', category: 'Vegetable', price: '$1.49', inStock: false },
]);

// Method 1B: Simple string array (auto-converted)
const simpleItems = ref(['Apple', 'Banana', 'Cherry']);

// Custom template function
const productTemplate = (item: Product) => `
  <div style="display: flex; justify-content: space-between; padding: 8px;">
    <div>
      <div style="font-weight: 600; color: ${item.inStock ? '#000' : '#999'}">
        ${item.label}
      </div>
      <div style="font-size: 12px; color: #666;">${item.category}</div>
    </div>
    <div>
      <div style="color: #10b981; font-weight: 600;">${item.price}</div>
      <div style="font-size: 11px; color: ${item.inStock ? '#10b981' : '#ef4444'}">
        ${item.inStock ? 'In Stock' : 'Out of Stock'}
      </div>
    </div>
  </div>
`;
</script>
```

#### Svelte

```svelte
<script lang="ts">
  import Select from '@smilodon/svelte';
  
  interface Product {
    value: string;
    label: string;
    category: string;
    price: string;
    inStock: boolean;
  }
  
  let selectedValue = '';
  
  // Method 1A: Typed array of objects
  const products: Product[] = [
    { value: '1', label: 'Apple 🍎', category: 'Fruit', price: '$2.99', inStock: true },
    { value: '2', label: 'Banana 🍌', category: 'Fruit', price: '$1.99', inStock: true },
    { value: '3', label: 'Carrot 🥕', category: 'Vegetable', price: '$1.49', inStock: false },
  ];
  
  // Method 1B: Simple string array (auto-converted)
  const simpleItems = ['Apple', 'Banana', 'Cherry'];
  
  // Custom template function
  const productTemplate = (item: Product) => `
    <div style="display: flex; justify-content: space-between; padding: 8px;">
      <div>
        <div style="font-weight: 600; color: ${item.inStock ? '#000' : '#999'}">
          ${item.label}
        </div>
        <div style="font-size: 12px; color: #666;">${item.category}</div>
      </div>
      <div>
        <div style="color: #10b981; font-weight: 600;">${item.price}</div>
        <div style="font-size: 11px; color: ${item.inStock ? '#10b981' : '#ef4444'}">
          ${item.inStock ? 'In Stock' : 'Out of Stock'}
        </div>
      </div>
    </div>
  `;
</script>

<!-- Rich object array with custom template -->
<Select
  items={products}
  bind:value={selectedValue}
  optionTemplate={productTemplate}
  searchable
  placeholder="Select a product..."
/>

<!-- Simple string array -->
<Select
  items={simpleItems}
  bind:value={selectedValue}
  placeholder="Select a fruit..."
/>
```

---

## Method 2: Array of Components (Custom Rendering)

### 🎯 Best For
- Complex interactive options (buttons, checkboxes, actions)
- Framework component reuse
- State management within options
- Dynamic, real-time data in options

### 📋 Basic Structure

```typescript
interface CustomOptionContract {
  mountOption(container: HTMLElement, context: CustomOptionContext): void;
  unmountOption(): void;
  updateSelected(selected: boolean): void;
  updateFocused(focused: boolean): void;
  getElement(): HTMLElement;
}

type CustomOptionFactory = (item: any, index: number) => CustomOptionContract;
```

### ✨ Features

**1. Full Framework Integration**
- Use React/Vue/Svelte components
- Access to component lifecycle
- State management (useState, reactive, stores)
- Event handling

**2. Component Pooling**
- Automatic instance recycling
- Memory efficient
- Performance optimized
- Lifecycle managed

**3. Advanced Interactions**
- Custom event handlers
- Nested interactions
- Real-time updates
- Complex UI patterns

---

### 🚀 Examples - Array of Components

#### Vanilla JavaScript / Core

```html
<enhanced-select id="users-select"></enhanced-select>

<script type="module">
  import '@smilodon/core';
  
  // Define custom option component
  class UserOptionComponent {
    constructor(item, index) {
      this.item = item;
      this.index = index;
      this.element = document.createElement('div');
      this.element.className = 'user-option';
    }
    
    mountOption(container, context) {
      this.context = context;
      
      // Build complex UI
      this.element.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px;">
          <img 
            src="${this.item.avatar}" 
            style="width: 40px; height: 40px; border-radius: 50%;"
            alt="${this.item.name}"
          />
          <div style="flex: 1;">
            <div style="font-weight: 600;">${this.item.name}</div>
            <div style="font-size: 12px; color: #666;">${this.item.email}</div>
            <div style="font-size: 11px; color: #999;">
              ${this.item.role} • ${this.item.department}
            </div>
          </div>
          <button 
            class="info-btn"
            style="padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;"
          >
            Info
          </button>
        </div>
      `;
      
      // Attach event handlers
      const infoBtn = this.element.querySelector('.info-btn');
      infoBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent selection
        context.onCustomEvent?.('info', { user: this.item });
      });
      
      container.appendChild(this.element);
      this.updateSelected(context.isSelected);
    }
    
    unmountOption() {
      this.element.remove();
    }
    
    updateSelected(selected) {
      this.element.style.backgroundColor = selected ? '#e0e7ff' : 'white';
    }
    
    updateFocused(focused) {
      this.element.style.outline = focused ? '2px solid #667eea' : 'none';
    }
    
    getElement() {
      return this.element;
    }
  }
  
  // Factory function
  function createUserOption(item, index) {
    return new UserOptionComponent(item, index);
  }
  
  // Use with select
  const select = document.getElementById('users-select');
  
  select.items = [
    {
      value: '1',
      label: 'John Doe',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Developer',
      department: 'Engineering',
      avatar: 'https://i.pravatar.cc/150?img=1',
      optionComponent: createUserOption
    },
    {
      value: '2',
      label: 'Jane Smith',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'Designer',
      department: 'Design',
      avatar: 'https://i.pravatar.cc/150?img=2',
      optionComponent: createUserOption
    },
  ];
  
  // Handle custom events
  select.addEventListener('customEvent', (e) => {
    if (e.detail.eventName === 'info') {
      console.log('Show info for:', e.detail.data.user);
    }
  });
</script>
```

#### React

```tsx
import { Select } from '@smilodon/react';
import { useState } from 'react';
import type { CustomOptionContract, CustomOptionContext } from '@smilodon/core';

interface User {
  value: string;
  label: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar: string;
}

// React-based option component
class ReactUserOption implements CustomOptionContract {
  private element: HTMLElement;
  private item: User;
  private context?: CustomOptionContext;
  
  constructor(item: User, index: number) {
    this.item = item;
    this.element = document.createElement('div');
    this.element.className = 'user-option';
  }
  
  mountOption(container: HTMLElement, context: CustomOptionContext): void {
    this.context = context;
    
    // Create React-like structure
    this.element.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; padding: 12px;">
        <img 
          src="${this.item.avatar}" 
          style="width: 40px; height: 40px; border-radius: 50%;"
          alt="${this.item.name}"
        />
        <div style="flex: 1;">
          <div style="font-weight: 600;">${this.item.name}</div>
          <div style="font-size: 12px; color: #666;">${this.item.email}</div>
          <div style="font-size: 11px; color: #999;">
            ${this.item.role} • ${this.item.department}
          </div>
        </div>
        <div style="display: flex; gap: 4px;">
          <button class="email-btn" style="padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer; font-size: 12px;">
            📧
          </button>
          <button class="info-btn" style="padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer; font-size: 12px;">
            ℹ️
          </button>
        </div>
      </div>
    `;
    
    // Event handlers
    this.element.querySelector('.email-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      window.location.href = `mailto:${this.item.email}`;
    });
    
    this.element.querySelector('.info-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      context.onCustomEvent?.('showInfo', { user: this.item });
    });
    
    container.appendChild(this.element);
    this.updateSelected(context.isSelected);
  }
  
  unmountOption(): void {
    this.element.remove();
  }
  
  updateSelected(selected: boolean): void {
    this.element.style.backgroundColor = selected ? '#e0e7ff' : 'white';
  }
  
  updateFocused(focused: boolean): void {
    this.element.style.outline = focused ? '2px solid #667eea' : 'none';
  }
  
  getElement(): HTMLElement {
    return this.element;
  }
}

function UserSelect() {
  const [value, setValue] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const createUserOption = (item: User, index: number) => {
    return new ReactUserOption(item, index);
  };
  
  const users: User[] = [
    {
      value: '1',
      label: 'John Doe',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Developer',
      department: 'Engineering',
      avatar: 'https://i.pravatar.cc/150?img=1',
      optionComponent: createUserOption
    },
    {
      value: '2',
      label: 'Jane Smith',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'Designer',
      department: 'Design',
      avatar: 'https://i.pravatar.cc/150?img=2',
      optionComponent: createUserOption
    },
  ];
  
  const handleCustomEvent = (event: CustomEvent) => {
    if (event.detail.eventName === 'showInfo') {
      setSelectedUser(event.detail.data.user);
      setShowModal(true);
    }
  };
  
  return (
    <>
      <Select
        items={users}
        value={value}
        onChange={(e) => setValue(e.detail.value)}
        onCustomEvent={handleCustomEvent}
        searchable
        placeholder="Select a user..."
      />
      
      {showModal && selectedUser && (
        <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px', marginTop: '20px' }}>
          <h3>{selectedUser.name}</h3>
          <p>Email: {selectedUser.email}</p>
          <p>Role: {selectedUser.role}</p>
          <p>Department: {selectedUser.department}</p>
          <button onClick={() => setShowModal(false)}>Close</button>
        </div>
      )}
    </>
  );
}
```

#### Vue 3

```vue
<template>
  <div>
    <Select
      :items="users"
      v-model="selectedValue"
      @custom-event="handleCustomEvent"
      searchable
      placeholder="Select a user..."
    />
    
    <div v-if="showModal && selectedUser" class="modal">
      <h3>{{ selectedUser.name }}</h3>
      <p>Email: {{ selectedUser.email }}</p>
      <p>Role: {{ selectedUser.role }}</p>
      <p>Department: {{ selectedUser.department }}</p>
      <button @click="showModal = false">Close</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Select } from '@smilodon/vue';
import { ref } from 'vue';
import type { CustomOptionContract, CustomOptionContext } from '@smilodon/core';

interface User {
  value: string;
  label: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar: string;
  optionComponent?: any;
}

const selectedValue = ref('');
const showModal = ref(false);
const selectedUser = ref<User | null>(null);

// Vue-based option component
class VueUserOption implements CustomOptionContract {
  private element: HTMLElement;
  private item: User;
  private context?: CustomOptionContext;
  
  constructor(item: User, index: number) {
    this.item = item;
    this.element = document.createElement('div');
    this.element.className = 'user-option';
  }
  
  mountOption(container: HTMLElement, context: CustomOptionContext): void {
    this.context = context;
    
    this.element.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; padding: 12px;">
        <img 
          src="${this.item.avatar}" 
          style="width: 40px; height: 40px; border-radius: 50%;"
          alt="${this.item.name}"
        />
        <div style="flex: 1;">
          <div style="font-weight: 600;">${this.item.name}</div>
          <div style="font-size: 12px; color: #666;">${this.item.email}</div>
          <div style="font-size: 11px; color: #999;">
            ${this.item.role} • ${this.item.department}
          </div>
        </div>
        <button class="info-btn" style="padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;">
          Info
        </button>
      </div>
    `;
    
    this.element.querySelector('.info-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      context.onCustomEvent?.('showInfo', { user: this.item });
    });
    
    container.appendChild(this.element);
    this.updateSelected(context.isSelected);
  }
  
  unmountOption(): void {
    this.element.remove();
  }
  
  updateSelected(selected: boolean): void {
    this.element.style.backgroundColor = selected ? '#e0e7ff' : 'white';
  }
  
  updateFocused(focused: boolean): void {
    this.element.style.outline = focused ? '2px solid #667eea' : 'none';
  }
  
  getElement(): HTMLElement {
    return this.element;
  }
}

const createUserOption = (item: User, index: number) => {
  return new VueUserOption(item, index);
};

const users = ref<User[]>([
  {
    value: '1',
    label: 'John Doe',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Developer',
    department: 'Engineering',
    avatar: 'https://i.pravatar.cc/150?img=1',
    optionComponent: createUserOption
  },
  {
    value: '2',
    label: 'Jane Smith',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Designer',
    department: 'Design',
    avatar: 'https://i.pravatar.cc/150?img=2',
    optionComponent: createUserOption
  },
]);

const handleCustomEvent = (event: CustomEvent) => {
  if (event.detail.eventName === 'showInfo') {
    selectedUser.value = event.detail.data.user;
    showModal.value = true;
  }
};
</script>

<style scoped>
.modal {
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
  margin-top: 20px;
}
</style>
```

#### Svelte

```svelte
<script lang="ts">
  import Select from '@smilodon/svelte';
  import type { CustomOptionContract, CustomOptionContext } from '@smilodon/core';
  
  interface User {
    value: string;
    label: string;
    name: string;
    email: string;
    role: string;
    department: string;
    avatar: string;
    optionComponent?: any;
  }
  
  let selectedValue = '';
  let showModal = false;
  let selectedUser: User | null = null;
  
  // Svelte-based option component
  class SvelteUserOption implements CustomOptionContract {
    private element: HTMLElement;
    private item: User;
    private context?: CustomOptionContext;
    
    constructor(item: User, index: number) {
      this.item = item;
      this.element = document.createElement('div');
      this.element.className = 'user-option';
    }
    
    mountOption(container: HTMLElement, context: CustomOptionContext): void {
      this.context = context;
      
      this.element.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px;">
          <img 
            src="${this.item.avatar}" 
            style="width: 40px; height: 40px; border-radius: 50%;"
            alt="${this.item.name}"
          />
          <div style="flex: 1;">
            <div style="font-weight: 600;">${this.item.name}</div>
            <div style="font-size: 12px; color: #666;">${this.item.email}</div>
            <div style="font-size: 11px; color: #999;">
              ${this.item.role} • ${this.item.department}
            </div>
          </div>
          <button class="info-btn" style="padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;">
            Info
          </button>
        </div>
      `;
      
      this.element.querySelector('.info-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        context.onCustomEvent?.('showInfo', { user: this.item });
      });
      
      container.appendChild(this.element);
      this.updateSelected(context.isSelected);
    }
    
    unmountOption(): void {
      this.element.remove();
    }
    
    updateSelected(selected: boolean): void {
      this.element.style.backgroundColor = selected ? '#e0e7ff' : 'white';
    }
    
    updateFocused(focused: boolean): void {
      this.element.style.outline = focused ? '2px solid #667eea' : 'none';
    }
    
    getElement(): HTMLElement {
      return this.element;
    }
  }
  
  const createUserOption = (item: User, index: number) => {
    return new SvelteUserOption(item, index);
  };
  
  const users: User[] = [
    {
      value: '1',
      label: 'John Doe',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Developer',
      department: 'Engineering',
      avatar: 'https://i.pravatar.cc/150?img=1',
      optionComponent: createUserOption
    },
    {
      value: '2',
      label: 'Jane Smith',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'Designer',
      department: 'Design',
      avatar: 'https://i.pravatar.cc/150?img=2',
      optionComponent: createUserOption
    },
  ];
  
  const handleCustomEvent = (event: CustomEvent) => {
    if (event.detail.eventName === 'showInfo') {
      selectedUser = event.detail.data.user;
      showModal = true;
    }
  };
</script>

<Select
  items={users}
  bind:value={selectedValue}
  on:custom-event={handleCustomEvent}
  searchable
  placeholder="Select a user..."
/>

{#if showModal && selectedUser}
  <div class="modal">
    <h3>{selectedUser.name}</h3>
    <p>Email: {selectedUser.email}</p>
    <p>Role: {selectedUser.role}</p>
    <p>Department: {selectedUser.department}</p>
    <button on:click={() => showModal = false}>Close</button>
  </div>
{/if}

<style>
  .modal {
    padding: 20px;
    background: #f9fafb;
    border-radius: 8px;
    margin-top: 20px;
  }
</style>
```

---

## Comparison & When to Use Each

| Feature | Array of Objects | Array of Components |
|---------|------------------|---------------------|
| **Complexity** | ⭐ Simple | ⭐⭐⭐ Complex |
| **Performance** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Very Good |
| **Customization** | ⭐⭐⭐ HTML Templates | ⭐⭐⭐⭐⭐ Full Control |
| **Interactions** | Basic | Advanced |
| **Memory** | Minimal | Managed |
| **Setup Time** | Minutes | Hours |
| **Learning Curve** | Easy | Moderate |

### Use Array of Objects When:
- ✅ Standard dropdowns with text/icons
- ✅ Large datasets (10K+ items)
- ✅ Quick implementation needed
- ✅ Performance is critical
- ✅ Simple templates suffice

### Use Array of Components When:
- ✅ Complex interactive options needed
- ✅ Buttons, checkboxes, or controls in options
- ✅ Framework component reuse required
- ✅ Real-time data updates in options
- ✅ Advanced state management needed

---

## Best Practices

### For Array of Objects
1. **Use TypeScript interfaces** for type safety
2. **Keep templates simple** - avoid heavy DOM manipulation
3. **Leverage CSS variables** for styling
4. **Use auto-conversion** for simple arrays
5. **Add groups** for organization

### For Array of Components
1. **Implement cleanup** in `unmountOption()`
2. **Use event delegation** - `e.stopPropagation()` for nested actions
3. **Pool components** - reuse instances when possible
4. **Keep components lightweight** - avoid heavy computations
5. **Test thoroughly** - ensure memory doesn't leak

---

## Performance Tips

### Array of Objects
```typescript
// ✅ Good: Virtual scrolling handles large lists
const items = generateItems(100000); // Works smoothly

// ✅ Good: Simple templates are fast
optionTemplate: (item) => `<div>${item.label}</div>`

// ❌ Bad: Heavy DOM manipulation in template
optionTemplate: (item) => {
  // Don't do complex calculations here
  const result = heavyComputation();
  return `<div>${result}</div>`;
}
```

### Array of Components
```typescript
// ✅ Good: Reuse component instances
class MyOption implements CustomOptionContract {
  updateSelected(selected: boolean) {
    // Just update state, don't recreate
    this.element.classList.toggle('selected', selected);
  }
}

// ❌ Bad: Creating new elements on every update
updateSelected(selected: boolean) {
  this.element.innerHTML = `...`; // Triggers full re-render
}
```

---

## Migration Guide

### From Array of Objects to Components

```typescript
// Before (Objects)
const items = [
  { value: '1', label: 'Item 1', extra: 'data' }
];

select.items = items;
select.optionTemplate = (item) => `<div>${item.label}</div>`;

// After (Components)
class MyOption implements CustomOptionContract {
  constructor(item, index) {
    this.item = item;
    this.element = document.createElement('div');
  }
  
  mountOption(container, context) {
    this.element.textContent = this.item.label;
    container.appendChild(this.element);
  }
  
  unmountOption() {
    this.element.remove();
  }
  
  updateSelected(selected) {
    this.element.style.background = selected ? '#blue' : 'white';
  }
  
  updateFocused(focused) {}
  
  getElement() {
    return this.element;
  }
}

const items = [
  { 
    value: '1', 
    label: 'Item 1', 
    extra: 'data',
    optionComponent: (item, idx) => new MyOption(item, idx)
  }
];

select.items = items;
```

---

## Troubleshooting

### Array of Objects Issues

**Q: My template doesn't show**
```typescript
// ❌ Wrong
select.optionTemplate = `<div>${item.label}</div>`;

// ✅ Correct - Must be a function
select.optionTemplate = (item) => `<div>${item.label}</div>`;
```

**Q: String array not working**
```typescript
// ✅ Works - Auto-converts
select.items = ['A', 'B', 'C'];

// ✅ Equivalent to
select.items = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' }
];
```

### Array of Components Issues

**Q: Memory leak**
```typescript
// ❌ Wrong - No cleanup
unmountOption() {
  // Component still has event listeners
}

// ✅ Correct
unmountOption() {
  this.removeEventListeners();
  this.element.remove();
}
```

**Q: Option selects when clicking button**
```typescript
// ❌ Wrong
button.addEventListener('click', () => {
  doAction();
});

// ✅ Correct - Stop propagation
button.addEventListener('click', (e) => {
  e.stopPropagation(); // Prevent selection
  doAction();
});
```

---

## Additional Resources

- **API Reference**: [docs/API-REFERENCE.md](../../docs/API-REFERENCE.md)
- **Custom Components Guide**: [docs/CUSTOM-OPTION-COMPONENTS.md](../../docs/CUSTOM-OPTION-COMPONENTS.md)
- **Performance Guide**: [docs/PERFORMANCE.md](../../docs/PERFORMANCE.md)
- **Complete Framework Guides**:
  - [React Guide](../packages/react/COMPLETE-GUIDE.md)
  - [Vue Guide](../packages/vue/COMPLETE-GUIDE.md)
  - [Svelte Guide](../packages/svelte/COMPLETE-GUIDE.md)
  - [Vanilla Guide](../packages/vanilla/COMPLETE-GUIDE.md)

---

**Built with ❤️ by the Smilodon team**

*Last updated: February 9, 2026 - v1.3.8*
