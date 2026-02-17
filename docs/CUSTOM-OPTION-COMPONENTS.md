# Custom Option Components Guide

This guide demonstrates how to use custom framework components for rendering select options, enabling deep customization while maintaining high performance.

## Overview

Smilodon now supports two rendering modes for options:

1. **Lightweight Mode** (Traditional): `{ label: string, value: any }`
2. **Custom Component Mode**: `{ label: string, value: any, optionComponent: CustomOptionFactory }`

The custom component mode allows you to render complex, interactive components within select options while maintaining performance through component pooling and lifecycle management.

## Architecture

### Key Concepts

- **CustomOptionContract**: Interface that custom components must implement
- **CustomOptionFactory**: Factory function that creates component instances
- **Component Pooling**: Automatic recycling of component instances for performance
- **Event Delegation**: Unified click handling for both lightweight and custom options

### Component Lifecycle

```
1. Factory creates component instance
2. Component mounts into DOM container
3. Component receives context (item data, selection state, callbacks)
4. User interactions trigger callbacks
5. Selection state updates trigger component updates
6. Component unmounts and returns to pool for reuse
```

## Basic Usage

### Step 1: Implement the Custom Option Contract

```typescript
import type { CustomOptionContract, CustomOptionContext } from '@smilodon/core';

class MyCustomOption implements CustomOptionContract {
  private _element: HTMLElement;
  private _context?: CustomOptionContext;
  
  constructor(private _item: any, private _index: number) {
    // Create your custom element structure
    this._element = document.createElement('div');
    this._element.className = 'my-custom-option';
  }
  
  mountOption(container: HTMLElement, context: CustomOptionContext): void {
    this._context = context;
    
    // Build your custom UI
    this._element.innerHTML = `
      <div class="option-content">
        <div class="option-title">${context.label}</div>
        <div class="option-description">${this._item.description || ''}</div>
        <button class="option-action" data-action="preview">Preview</button>
      </div>
    `;
    
    // Attach custom event handlers
    const previewBtn = this._element.querySelector('[data-action="preview"]');
    previewBtn?.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent selection
      context.onCustomEvent?.('preview', { item: this._item });
    });
    
    // Mount into container
    container.appendChild(this._element);
    
    // Apply initial state
    this.updateSelected(context.isSelected);
  }
  
  unmountOption(): void {
    // Cleanup
    this._element.remove();
  }
  
  updateSelected(selected: boolean): void {
    this._element.classList.toggle('selected', selected);
  }
  
  updateFocused(focused: boolean): void {
    this._element.classList.toggle('focused', focused);
  }
  
  getElement(): HTMLElement {
    return this._element;
  }
}
```

### Step 2: Create a Factory Function

```typescript
import type { CustomOptionFactory } from '@smilodon/core';

const myOptionFactory: CustomOptionFactory = (item, index) => {
  return new MyCustomOption(item, index);
};
```

### Step 3: Use with Select Component

```typescript
import { EnhancedSelect } from '@smilodon/core';

const select = document.querySelector('enhanced-select') as EnhancedSelect;

const items = [
  {
    value: 1,
    label: 'Standard Option',
    // No optionComponent = uses lightweight mode
  },
  {
    value: 2,
    label: 'Custom Option',
    description: 'This uses a custom component',
    optionComponent: myOptionFactory, // Uses custom component mode
  },
  {
    value: 3,
    label: 'Another Custom',
    description: 'With different data',
    thumbnail: '/path/to/image.jpg',
    optionComponent: richOptionFactory, // Different factory
  }
];

select.setItems(items);

// Listen for custom events
select.addEventListener('option:custom-event', (e: CustomEvent) => {
  const { index, eventName, data } = e.detail;
  console.log(`Option ${index} emitted ${eventName}:`, data);
});
```

## React Integration Example

```tsx
import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import type { CustomOptionContract, CustomOptionContext } from '@smilodon/core';

// Your React component for the option
const CustomOptionComponent: React.FC<{
  item: any;
  context: CustomOptionContext;
  onUpdate: (callback: Function) => void;
}> = ({ item, context, onUpdate }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    context.onCustomEvent?.('preview', { item });
  };
  
  return (
    <div 
      className={`custom-option ${context.isSelected ? 'selected' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="option-header">
        <img src={item.avatar} alt="" className="option-avatar" />
        <div>
          <div className="option-title">{context.label}</div>
          <div className="option-subtitle">{item.email}</div>
        </div>
      </div>
      {isHovered && (
        <button onClick={handlePreview} className="option-preview-btn">
          View Profile
        </button>
      )}
    </div>
  );
};

// Wrapper class that bridges React to the CustomOptionContract
class ReactOptionBridge implements CustomOptionContract {
  private _container?: HTMLElement;
  private _reactRoot?: ReturnType<typeof ReactDOM.createRoot>;
  private _updateCallbacks: Function[] = [];
  
  constructor(private _item: any, private _index: number) {}
  
  mountOption(container: HTMLElement, context: CustomOptionContext): void {
    this._container = container;
    const mountPoint = document.createElement('div');
    container.appendChild(mountPoint);
    
    this._reactRoot = ReactDOM.createRoot(mountPoint);
    this._render(context);
  }
  
  unmountOption(): void {
    if (this._reactRoot) {
      this._reactRoot.unmount();
    }
    if (this._container) {
      this._container.innerHTML = '';
    }
  }
  
  updateSelected(selected: boolean): void {
    // Trigger re-render with updated context
    this._updateCallbacks.forEach(cb => cb());
  }
  
  updateFocused(focused: boolean): void {
    this._updateCallbacks.forEach(cb => cb());
  }
  
  getElement(): HTMLElement {
    return this._container!;
  }
  
  private _render(context: CustomOptionContext): void {
    if (!this._reactRoot) return;
    
    this._reactRoot.render(
      <CustomOptionComponent
        item={this._item}
        context={context}
        onUpdate={(cb) => this._updateCallbacks.push(cb)}
      />
    );
  }
}

// Factory for React components
const reactOptionFactory = (item: any, index: number) => {
  return new ReactOptionBridge(item, index);
};

// Usage with @smilodon/react
import { Select } from '@smilodon/react';

function UserPicker() {
  const users = [
    {
      value: 1,
      label: 'John Doe',
      email: 'john@example.com',
      avatar: '/avatars/john.jpg',
      optionComponent: reactOptionFactory
    },
    // ... more users
  ];
  
  return (
    <Select
      items={users}
      placeholder="Select a user..."
      onChange={(value) => console.log('Selected:', value)}
    />
  );
}
```

## Vue Integration Example

```typescript
import { createApp, h } from 'vue';
import type { CustomOptionContract, CustomOptionContext } from '@smilodon/core';

// Your Vue component
const VueOptionComponent = {
  props: ['item', 'context'],
  emits: ['preview'],
  template: `
    <div :class="['vue-custom-option', { selected: context.isSelected }]">
      <div class="option-icon">{{ item.icon }}</div>
      <div class="option-details">
        <div class="option-name">{{ context.label }}</div>
        <div class="option-description">{{ item.description }}</div>
      </div>
      <button @click.stop="$emit('preview', item)" class="preview-btn">
        View
      </button>
    </div>
  `
};

// Bridge for Vue components
class VueOptionBridge implements CustomOptionContract {
  private _container?: HTMLElement;
  private _app?: ReturnType<typeof createApp>;
  
  constructor(private _item: any, private _index: number) {}
  
  mountOption(container: HTMLElement, context: CustomOptionContext): void {
    this._container = container;
    const mountPoint = document.createElement('div');
    container.appendChild(mountPoint);
    
    this._app = createApp({
      render: () => h(VueOptionComponent, {
        item: this._item,
        context: context,
        onPreview: (item: any) => {
          context.onCustomEvent?.('preview', { item });
        }
      })
    });
    
    this._app.mount(mountPoint);
  }
  
  unmountOption(): void {
    if (this._app) {
      this._app.unmount();
    }
  }
  
  updateSelected(selected: boolean): void {
    // Vue's reactivity will handle updates
  }
  
  getElement(): HTMLElement {
    return this._container!;
  }
}

const vueOptionFactory = (item: any, index: number) => {
  return new VueOptionBridge(item, index);
};
```

## Performance Considerations

### Component Pooling

Components are automatically pooled and reused:

```typescript
// The system automatically manages a pool of up to 100 components
// Components are reused when scrolling through large lists
// No need to manually manage component lifecycle
```

### Optimization Tips

1. **Minimize DOM Operations**: Build your component structure once in constructor
2. **Use Event Delegation**: Attach listeners to parent elements when possible
3. **Lazy Load Heavy Resources**: Only load images/data when component is visible
4. **Implement updateSelected/updateFocused**: Avoid full re-renders for state changes

```typescript
class OptimizedOption implements CustomOptionContract {
  private _element: HTMLElement;
  private _titleEl: HTMLElement;
  private _statusEl: HTMLElement;
  
  constructor(item: any, index: number) {
    // Build structure once
    this._element = document.createElement('div');
    this._titleEl = document.createElement('div');
    this._statusEl = document.createElement('div');
    
    this._element.append(this._titleEl, this._statusEl);
  }
  
  mountOption(container: HTMLElement, context: CustomOptionContext): void {
    // Just update content, structure already exists
    this._titleEl.textContent = context.label;
    container.appendChild(this._element);
  }
  
  updateSelected(selected: boolean): void {
    // Efficient: only update class, no DOM rebuilding
    this._element.classList.toggle('selected', selected);
    this._statusEl.textContent = selected ? '✓ Selected' : '';
  }
  
  // ... rest of implementation
}
```

## Advanced Patterns

### Mixed Mode (Lightweight + Custom)

```typescript
const items = [
  { value: 1, label: 'Simple Option' }, // Lightweight
  { value: 2, label: 'Rich Option', optionComponent: customFactory }, // Custom
  { value: 3, label: 'Another Simple' }, // Lightweight
];

// The system automatically handles both types efficiently
```

### Conditional Components

```typescript
const adaptiveFactory = (item: any, index: number) => {
  // Use different components based on item data
  if (item.type === 'premium') {
    return new PremiumOption(item, index);
  } else {
    return new StandardOption(item, index);
  }
};
```

### Component Communication

```typescript
class InteractiveOption implements CustomOptionContract {
  mountOption(container: HTMLElement, context: CustomOptionContext): void {
    const button = document.createElement('button');
    button.textContent = 'Quick Action';
    button.onclick = (e) => {
      e.stopPropagation(); // Don't select
      
      // Emit custom event
      context.onCustomEvent?.('quick-action', {
        itemId: context.value,
        timestamp: Date.now()
      });
    };
    
    container.appendChild(button);
  }
  
  // ... rest of implementation
}

// Listen for custom events
select.addEventListener('option:custom-event', (e: CustomEvent) => {
  if (e.detail.eventName === 'quick-action') {
    performQuickAction(e.detail.data);
  }
});
```

## Styling Custom Options

When using `optionRenderer`/custom option components, Smilodon mirrors document stylesheets into the component shadow root so class-based styling (Tailwind and regular CSS) applies to custom option content.

```css
/* Style lightweight options */
.option {
  padding: 12px;
  cursor: pointer;
}

.option.selected {
  background: #e3f2fd;
}

/* Style custom component options */
.option-custom {
  /* Wrapper for custom components */
  padding: 0; /* Let component handle padding */
}

.my-custom-option {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.my-custom-option.selected {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.my-custom-option .option-action {
  margin-left: auto;
  opacity: 0;
  transition: opacity 0.2s;
}

.my-custom-option:hover .option-action {
  opacity: 1;
}
```

## Error Handling

```typescript
class RobustOption implements CustomOptionContract {
  mountOption(container: HTMLElement, context: CustomOptionContext): void {
    try {
      // Your rendering logic
      const element = this._buildElement(context);
      container.appendChild(element);
    } catch (error) {
      console.error('Failed to mount option:', error);
      // Fallback to simple rendering
      container.innerHTML = `<div class="option-error">${context.label}</div>`;
    }
  }
  
  // ... rest of implementation
}

// Listen for mount errors
select.addEventListener('option:mount-error', (e: CustomEvent) => {
  console.error(`Option ${e.detail.index} failed to mount:`, e.detail.error);
  // Could show toast notification to user
});
```

## Best Practices

1. **Always provide a label**: Required for accessibility and fallback rendering
2. **Keep components lightweight**: Avoid heavy computations in constructor
3. **Use memoization**: Cache expensive calculations
4. **Implement all lifecycle methods**: Even if they're empty
5. **Test with large datasets**: Ensure pooling works efficiently
6. **Handle errors gracefully**: Provide fallbacks for failed renders
7. **Use semantic HTML**: Maintain accessibility standards
8. **Debounce expensive operations**: Rate-limit API calls or animations

## Migration from Lightweight to Custom

```typescript
// Before (Lightweight)
const items = [
  { value: 1, label: 'User 1' },
  { value: 2, label: 'User 2' },
];

// After (Custom Components)
const items = [
  { 
    value: 1, 
    label: 'User 1',
    optionComponent: userOptionFactory // Add factory
  },
  { 
    value: 2, 
    label: 'User 2',
    optionComponent: userOptionFactory
  },
];

// Or create an adapter
function enhanceItems(items: any[]) {
  return items.map(item => ({
    ...item,
    optionComponent: item.needsCustomRender ? customFactory : undefined
  }));
}
```

## Conclusion

Custom option components provide unlimited flexibility for complex UI requirements while maintaining the performance characteristics of lightweight options through intelligent pooling and lifecycle management.

The architecture is designed with high cohesion (each component is self-contained) and low coupling (components communicate through well-defined contracts), making it easy to build, test, and maintain custom option implementations.
