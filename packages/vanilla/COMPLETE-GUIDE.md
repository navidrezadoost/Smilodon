# @smilodon/vanilla - Complete Guide

**Production-ready, accessible Select component for Vanilla JavaScript applications**

This guide provides comprehensive documentation for using Smilodon Select with Vanilla JavaScript (no framework), covering all features, styling options, and advanced use cases.

---

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [Basic Usage](#basic-usage)
3. [Complete API Reference](#complete-api-reference)
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
14. [DOM Manipulation](#dom-manipulation)
15. [Accessibility](#accessibility)
16. [Advanced Patterns](#advanced-patterns)
17. [Troubleshooting](#troubleshooting)

---

## Installation & Setup

### Installation

```bash
npm install @smilodon/core
```

or with yarn:

```bash
yarn add @smilodon/core
```

or with pnpm:

```bash
pnpm add @smilodon/core
```

### CDN Usage (No Build Step)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Smilodon Select</title>
</head>
<body>
  <enhanced-select id="my-select"></enhanced-select>

  <script type="module">
    import '@smilodon/core';
    
    const select = document.getElementById('my-select');
    select.items = ['Apple', 'Banana', 'Cherry'];
    
    select.addEventListener('change', (e) => {
      console.log('Selected:', e.detail);
    });
  </script>
</body>
</html>
```

### Module Import

```javascript
import '@smilodon/core';

// Component is now registered as <enhanced-select>
const select = document.querySelector('enhanced-select');
```

---

## Basic Usage

### Minimal Example

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import '@smilodon/core';
  </script>
</head>
<body>
  <enhanced-select id="my-select"></enhanced-select>

  <script type="module">
    const select = document.getElementById('my-select');
    select.items = ['Apple', 'Banana', 'Cherry'];
    
    select.addEventListener('change', (event) => {
      console.log('Selected:', event.detail.value);
    });
  </script>
</body>
</html>
```

### With Object Array

```javascript
import '@smilodon/core';

const select = document.querySelector('enhanced-select');

select.items = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];

select.placeholder = 'Select a fruit...';

select.addEventListener('change', (event) => {
  document.getElementById('result').textContent = 
    `Selected: ${event.detail.value}`;
});
```

---

## Complete API Reference

### Properties

```javascript
// Get/Set items
select.items = [{ value: '1', label: 'Option 1' }];
console.log(select.items); // Array of items

// Get/Set value
select.value = 'apple';
console.log(select.value); // 'apple'

// Get/Set multiple values (multi-select)
select.selectedValues = ['apple', 'banana'];
console.log(select.selectedValues); // ['apple', 'banana']

// Behavior properties
select.multiple = true;           // Enable multi-select
select.searchable = true;          // Enable search (default: true)
select.disabled = false;           // Disable select
select.placeholder = 'Select...';  // Placeholder text

// Display properties
select.maxHeight = 300;           // Max dropdown height (px)
select.estimatedItemHeight = 48;  // Item height for virtualization

// Advanced properties
select.virtualization = true;      // Enable virtual scrolling (default: true)
```

### Methods

```javascript
// Open/close dropdown
select.open();
select.close();
select.toggle();

// Check if open
const isOpen = select.isOpen();

// Clear selection
select.clearSelection();

// Select all (multi-select only)
if (select.multiple) {
  select.selectAll();
}

// Scroll to specific index
select.scrollToIndex(10, 'smooth');

// Get selected items (returns array)
const selectedItems = select.getSelectedItems();

// Set selected values
select.setSelectedValues(['apple', 'banana']);
```

### Events

```javascript
// Selection changed
select.addEventListener('change', (event) => {
  console.log('Value:', event.detail.value);
  console.log('Label:', event.detail.label);
  console.log('Selected items:', event.detail.selectedItems);
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
select.addEventListener('search', (event) => {
  console.log('Search query:', event.detail.query);
});
```

### Attributes

```html
<!-- Use HTML attributes for initial configuration -->
<enhanced-select
  placeholder="Choose an option"
  searchable
  multiple
  disabled
  max-height="400"
  estimated-item-height="60"
></enhanced-select>
```

---

## Input Formats

Smilodon accepts three input formats for maximum flexibility:

### 1. Object Array (SelectItem[])

```javascript
select.items = [
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'mx', label: 'Mexico' },
];
```

### 2. String Array (Auto-converted)

```javascript
select.items = ['Apple', 'Banana', 'Cherry', 'Date'];

// Automatically converted to:
// [
//   { value: 'Apple', label: 'Apple' },
//   { value: 'Banana', label: 'Banana' },
//   { value: 'Cherry', label: 'Cherry' },
//   { value: 'Date', label: 'Date' },
// ]
```

### 3. Number Array (Auto-converted)

```javascript
select.items = [1, 2, 3, 5, 8, 13, 21];

// Automatically converted to:
// [
//   { value: 1, label: '1' },
//   { value: 2, label: '2' },
//   { value: 3, label: '3' },
//   ...
// ]
```

---

## Single Selection

### Basic Single Select

```html
<div>
  <label for="country-select">Country:</label>
  <enhanced-select id="country-select"></enhanced-select>
  <p id="result"></p>
</div>

<script type="module">
  import '@smilodon/core';

  const select = document.getElementById('country-select');
  
  select.items = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'au', label: 'Australia' },
  ];
  
  select.placeholder = 'Select your country';
  
  select.addEventListener('change', (event) => {
    document.getElementById('result').textContent = 
      `Selected: ${event.detail.value}`;
  });
</script>
```

### With Form Integration

```html
<form id="user-form">
  <div>
    <label for="name">Name:</label>
    <input type="text" id="name" name="name" />
  </div>

  <div>
    <label for="country">Country:</label>
    <enhanced-select id="country" name="country"></enhanced-select>
  </div>

  <div>
    <label for="language">Language:</label>
    <enhanced-select id="language" name="language"></enhanced-select>
  </div>

  <button type="submit">Submit</button>
</form>

<script type="module">
  import '@smilodon/core';

  const countrySelect = document.getElementById('country');
  const languageSelect = document.getElementById('language');
  const form = document.getElementById('user-form');

  countrySelect.items = ['USA', 'Canada', 'Mexico', 'UK', 'Australia'];
  languageSelect.items = ['English', 'Spanish', 'French', 'German'];

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = {
      name: document.getElementById('name').value,
      country: countrySelect.value,
      language: languageSelect.value,
    };
    
    console.log('Form data:', formData);
  });
</script>
```

---

## Multi-Selection

### Basic Multi-Select

```html
<div>
  <enhanced-select id="languages-select" multiple></enhanced-select>
  <div id="selected-list"></div>
</div>

<script type="module">
  import '@smilodon/core';

  const select = document.getElementById('languages-select');
  
  select.items = [
    { value: 'js', label: 'JavaScript' },
    { value: 'ts', label: 'TypeScript' },
    { value: 'py', label: 'Python' },
    { value: 'rs', label: 'Rust' },
    { value: 'go', label: 'Go' },
  ];
  
  select.placeholder = 'Select programming languages';
  
  select.addEventListener('change', (event) => {
    const values = event.detail.selectedValues || [];
    const listEl = document.getElementById('selected-list');
    
    if (values.length > 0) {
      listEl.innerHTML = `
        <strong>Selected (${values.length}):</strong>
        <ul>${values.map(v => `<li>${v}</li>`).join('')}</ul>
      `;
    } else {
      listEl.innerHTML = '<p>No languages selected</p>';
    }
  });
</script>
```

### Multi-Select with Limit

```html
<div>
  <enhanced-select id="colors-select" multiple></enhanced-select>
  <p id="count-display"></p>
</div>

<script type="module">
  import '@smilodon/core';

  const select = document.getElementById('colors-select');
  const maxSelections = 3;
  
  select.items = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange'];
  select.placeholder = `Select up to ${maxSelections} colors`;
  
  select.addEventListener('change', (event) => {
    const values = event.detail.selectedValues || [];
    
    if (values.length > maxSelections) {
      // Trim to max selections
      select.setSelectedValues(values.slice(0, maxSelections));
    }
    
    document.getElementById('count-display').textContent = 
      `${values.length} / ${maxSelections} selected`;
  });
</script>
```

---

## Searchable Select

### Basic Search

```html
<enhanced-select id="country-search" searchable></enhanced-select>

<script type="module">
  import '@smilodon/core';

  const select = document.getElementById('country-search');
  
  // Large dataset (200+ countries)
  select.items = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'mx', label: 'Mexico' },
    { value: 'br', label: 'Brazil' },
    { value: 'ar', label: 'Argentina' },
    // ... 200+ more
  ];
  
  select.placeholder = 'Search for a country...';
</script>
```

### Search with Event Handler

```html
<div>
  <enhanced-select id="fruit-search" searchable></enhanced-select>
  <p id="search-query"></p>
</div>

<script type="module">
  import '@smilodon/core';

  const select = document.getElementById('fruit-search');
  
  select.items = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];
  select.placeholder = 'Type to search...';
  
  select.addEventListener('search', (event) => {
    const query = event.detail.query;
    document.getElementById('search-query').textContent = 
      query ? `Current search: ${query}` : '';
    
    // Optionally trigger API call, analytics, etc.
    console.log('Searching for:', query);
  });
</script>
```

---

## Grouped Options

### Basic Groups

```html
<enhanced-select id="food-select"></enhanced-select>

<script type="module">
  import '@smilodon/core';

  const select = document.getElementById('food-select');
  
  select.items = [
    // Fruits group
    { value: 'apple', label: 'Apple', group: 'Fruits' },
    { value: 'banana', label: 'Banana', group: 'Fruits' },
    { value: 'cherry', label: 'Cherry', group: 'Fruits' },
    
    // Vegetables group
    { value: 'carrot', label: 'Carrot', group: 'Vegetables' },
    { value: 'broccoli', label: 'Broccoli', group: 'Vegetables' },
    { value: 'spinach', label: 'Spinach', group: 'Vegetables' },
  ];
  
  select.placeholder = 'Select food...';
</script>
```

### Complex Grouped Structure

```html
<enhanced-select id="tech-select" searchable></enhanced-select>

<script type="module">
  import '@smilodon/core';

  const select = document.getElementById('tech-select');
  
  select.items = [
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
  
  select.placeholder = 'Select technology...';
</script>
```

---

## Disabled States

### Disabled Select

```html
<enhanced-select id="disabled-select" disabled></enhanced-select>

<script type="module">
  import '@smilodon/core';

  const select = document.getElementById('disabled-select');
  select.items = ['Option 1', 'Option 2', 'Option 3'];
  select.placeholder = 'This select is disabled';
</script>
```

### Disabled Options

```html
<enhanced-select id="partial-disabled"></enhanced-select>

<script type="module">
  import '@smilodon/core';

  const select = document.getElementById('partial-disabled');
  
  select.items = [
    { value: '1', label: 'Available Option 1' },
    { value: '2', label: 'Available Option 2' },
    { value: '3', label: 'Disabled Option', disabled: true },
    { value: '4', label: 'Available Option 3' },
    { value: '5', label: 'Disabled Option 2', disabled: true },
  ];
  
  select.placeholder = 'Some options are disabled';
</script>
```

### Conditional Disabling

```html
<div>
  <enhanced-select id="loading-select"></enhanced-select>
  <p id="loading-status"></p>
</div>

<script type="module">
  import '@smilodon/core';

  const select = document.getElementById('loading-select');
  const statusEl = document.getElementById('loading-status');
  
  select.items = ['Option 1', 'Option 2', 'Option 3'];
  select.placeholder = 'Select an option';
  
  select.addEventListener('change', async (event) => {
    select.disabled = true;
    select.placeholder = 'Loading...';
    statusEl.textContent = 'Processing selection...';
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    select.disabled = false;
    select.placeholder = 'Select an option';
    statusEl.textContent = '';
  });
</script>
```

---

## Event Handling

### All Events

```html
<div>
  <enhanced-select id="event-select"></enhanced-select>
  <div>
    <p>Current value: <span id="current-value">None</span></p>
    <p>Dropdown is: <span id="dropdown-status">Closed</span></p>
  </div>
  <div>
    <strong>Event Log:</strong>
    <ul id="event-log" style="max-height: 200px; overflow: auto;"></ul>
  </div>
</div>

<script type="module">
  import '@smilodon/core';

  const select = document.getElementById('event-select');
  const logEl = document.getElementById('event-log');
  
  select.items = ['Apple', 'Banana', 'Cherry'];
  select.placeholder = 'Select a fruit';
  
  function addLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    const li = document.createElement('li');
    li.textContent = `[${timestamp}] ${message}`;
    logEl.appendChild(li);
    logEl.scrollTop = logEl.scrollHeight;
  }
  
  select.addEventListener('change', (event) => {
    const value = event.detail.value;
    document.getElementById('current-value').textContent = value || 'None';
    addLog(`Changed to: ${value}`);
  });
  
  select.addEventListener('open', () => {
    document.getElementById('dropdown-status').textContent = 'Open';
    addLog('Dropdown opened');
  });
  
  select.addEventListener('close', () => {
    document.getElementById('dropdown-status').textContent = 'Closed';
    addLog('Dropdown closed');
  });
  
  select.addEventListener('search', (event) => {
    addLog(`Searching for: ${event.detail.query}`);
  });
</script>
```

---

## Styling & Theming

### Inline Styles with CSS Variables

```html
<enhanced-select
  id="styled-select"
  style="
    --select-input-border: 2px solid #3b82f6;
    --select-input-border-radius: 8px;
    --select-input-focus-border: #2563eb;
    --select-option-hover-bg: #dbeafe;
    --select-option-selected-bg: #3b82f6;
    --select-option-selected-color: white;
    --select-badge-bg: #3b82f6;
  "
></enhanced-select>

<script type="module">
  import '@smilodon/core';

  const select = document.getElementById('styled-select');
  select.items = ['Red', 'Blue', 'Green'];
</script>
```

### Dynamic Styling with JavaScript

```html
<enhanced-select id="dynamic-select"></enhanced-select>

<script type="module">
  import '@smilodon/core';

  const select = document.getElementById('dynamic-select');
  select.items = ['Option 1', 'Option 2', 'Option 3'];
  
  // Set CSS variables dynamically
  select.style.setProperty('--select-input-border', '2px solid #10b981');
  select.style.setProperty('--select-input-border-radius', '12px');
  select.style.setProperty('--select-option-hover-bg', '#d1fae5');
  select.style.setProperty('--select-option-selected-bg', '#10b981');
  select.style.setProperty('--select-option-selected-color', 'white');
  select.style.setProperty('--select-badge-bg', '#10b981');
  select.style.setProperty('--select-separator-gradient', 
    'linear-gradient(to bottom, transparent 0%, #10b981 20%, #10b981 80%, transparent 100%)'
  );
</script>
```

### Complete CSS Variables Reference

```css
/* styles.css */
enhanced-select {
  /* Input Container */
  --select-input-gap: 6px;
  --select-input-padding: 6px 52px 6px 8px;
  --select-input-min-height: 44px;
  --select-input-bg: white;
  --select-input-border: 1px solid #d1d5db;
  --select-input-border-radius: 6px;
  --select-input-focus-border: #667eea;
  --select-input-focus-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);

  /* Input Field */
  --select-input-min-width: 120px;
  --select-input-field-padding: 4px;
  --select-input-font-size: 14px;
  --select-input-line-height: 1.5;
  --select-input-color: #1f2937;
  --select-input-placeholder-color: #9ca3af;
  --select-font-family: inherit;

  /* Dropdown Arrow */
  --select-arrow-width: 40px;
  --select-arrow-size: 16px;
  --select-arrow-color: #667eea;
  --select-arrow-hover-color: #667eea;
  --select-arrow-hover-bg: rgba(102, 126, 234, 0.08);
  --select-arrow-border-radius: 0 4px 4px 0;

  /* Separator Line */
  --select-separator-position: 40px;
  --select-separator-width: 1px;
  --select-separator-height: 60%;
  --select-separator-gradient: linear-gradient(to bottom, transparent, #ccc, transparent);

  /* Selection Badges (Multi-select) */
  --select-badge-gap: 4px;
  --select-badge-padding: 4px 8px;
  --select-badge-margin: 2px;
  --select-badge-bg: #667eea;
  --select-badge-color: white;
  --select-badge-border-radius: 4px;
  --select-badge-font-size: 13px;
  
  /* Badge Remove Button */
  --select-badge-remove-size: 16px;
  --select-badge-remove-bg: rgba(255, 255, 255, 0.3);
  --select-badge-remove-color: white;
  --select-badge-remove-font-size: 16px;
  --select-badge-remove-hover-bg: rgba(255, 255, 255, 0.5);

  /* Dropdown */
  --select-dropdown-margin-top: 4px;
  --select-dropdown-max-height: 300px;
  --select-dropdown-border-radius: 4px;
  --select-dropdown-bg: white;
  --select-dropdown-border: 1px solid #ccc;
  --select-dropdown-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  /* Options */
  --select-options-bg: white;
  --select-option-padding: 8px 12px;
  --select-option-color: #1f2937;
  --select-option-bg: white;
  --select-option-font-size: 14px;
  --select-option-hover-bg: #f3f4f6;
  --select-option-selected-bg: #e0e7ff;
  --select-option-selected-color: #4338ca;
}
```

### Theme Examples

#### Bootstrap Theme

```css
.bootstrap-select {
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

```html
<enhanced-select class="bootstrap-select"></enhanced-select>
```

#### Material Design Theme

```css
.material-select {
  --select-input-border-radius: 4px;
  --select-input-focus-border: #1976d2;
  --select-dropdown-shadow: 0 2px 4px rgba(0,0,0,0.2), 0 4px 5px rgba(0,0,0,0.14);
  --select-option-padding: 16px;
  --select-option-hover-bg: rgba(0, 0, 0, 0.04);
  --select-option-selected-bg: #e3f2fd;
  --select-option-selected-color: #1976d2;
  --select-badge-bg: #1976d2;
  --select-badge-border-radius: 16px;
}
```

#### Dark Mode Theme

```css
.dark-mode {
  --select-input-bg: #1f2937;
  --select-input-border: 1px solid #4b5563;
  --select-input-color: #f9fafb;
  --select-dropdown-bg: #1f2937;
  --select-options-bg: #1f2937;
  --select-option-color: #f9fafb;
  --select-option-bg: #1f2937;
  --select-option-hover-bg: #374151;
  --select-option-selected-bg: #3730a3;
  --select-badge-bg: #4f46e5;
}
```

---

## Custom Renderers

### Custom Option Renderer

```html
<enhanced-select id="user-select"></enhanced-select>

<script type="module">
  import '@smilodon/core';

  const select = document.getElementById('user-select');
  
  const users = [
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
  
  select.items = users;
  select.placeholder = 'Select a user';
  select.estimatedItemHeight = 60;
  
  // Set custom renderer
  select.optionTemplate = (item) => `
    <div style="display: flex; align-items: center; gap: 12px;">
      <img 
        src="${item.avatar}" 
        alt="${item.label}"
        style="width: 32px; height: 32px; border-radius: 50%;"
      />
      <div>
        <div style="font-weight: 500;">${item.label}</div>
        <div style="font-size: 12px; color: #6b7280;">${item.email}</div>
      </div>
    </div>
  `;
</script>
```

---

## Performance Optimization

### Virtualization for Large Datasets

```html
<enhanced-select id="large-dataset"></enhanced-select>

<script type="module">
  import '@smilodon/core';

  const select = document.getElementById('large-dataset');
  
  // Generate 100,000 items
  const items = Array.from({ length: 100_000 }, (_, i) => ({
    value: `item-${i}`,
    label: `Item ${i + 1}`,
  }));
  
  select.items = items;
  select.virtualization = true;
  select.estimatedItemHeight = 48;
  select.searchable = true;
  select.placeholder = 'Search 100k items...';
</script>
```

### Debounced Search

```html
<enhanced-select id="debounced-search" searchable></enhanced-select>

<script type="module">
  import '@smilodon/core';

  const select = document.getElementById('debounced-search');
  select.items = generateLargeDataset();
  
  let searchTimeout;
  
  select.addEventListener('search', (event) => {
    clearTimeout(searchTimeout);
    
    searchTimeout = setTimeout(() => {
      const query = event.detail.query;
      // Perform expensive search operation
      console.log('Searching for:', query);
    }, 300); // 300ms debounce
  });
</script>
```

---

## DOM Manipulation

### Dynamic Item Updates

```html
<div>
  <button id="add-item">Add Item</button>
  <button id="remove-item">Remove Last Item</button>
  <enhanced-select id="dynamic-select"></enhanced-select>
</div>

<script type="module">
  import '@smilodon/core';

  const select = document.getElementById('dynamic-select');
  let items = ['Item 1', 'Item 2', 'Item 3'];
  
  select.items = items;
  
  document.getElementById('add-item').addEventListener('click', () => {
    const newItem = `Item ${items.length + 1}`;
    items = [...items, newItem];
    select.items = items;
  });
  
  document.getElementById('remove-item').addEventListener('click', () => {
    if (items.length > 0) {
      items = items.slice(0, -1);
      select.items = items;
    }
  });
</script>
```

### Programmatic Control

```html
<div>
  <button id="open-btn">Open Dropdown</button>
  <button id="close-btn">Close Dropdown</button>
  <button id="clear-btn">Clear Selection</button>
  <button id="select-all-btn">Select All</button>
  <enhanced-select id="controlled-select" multiple></enhanced-select>
</div>

<script type="module">
  import '@smilodon/core';

  const select = document.getElementById('controlled-select');
  select.items = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];
  
  document.getElementById('open-btn').addEventListener('click', () => {
    select.open();
  });
  
  document.getElementById('close-btn').addEventListener('click', () => {
    select.close();
  });
  
  document.getElementById('clear-btn').addEventListener('click', () => {
    select.clearSelection();
  });
  
  document.getElementById('select-all-btn').addEventListener('click', () => {
    select.selectAll();
  });
</script>
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
- `aria-multiselectable` (when `multiple`)

### Screen Reader Support

```html
<label id="country-label">Country</label>
<enhanced-select
  aria-labelledby="country-label"
  placeholder="Select your country"
></enhanced-select>
```

---

## Advanced Patterns

### Dependent Selects

```html
<div>
  <label>Country:</label>
  <enhanced-select id="country-select"></enhanced-select>

  <label>State:</label>
  <enhanced-select id="state-select" disabled></enhanced-select>
</div>

<script type="module">
  import '@smilodon/core';

  const countrySelect = document.getElementById('country-select');
  const stateSelect = document.getElementById('state-select');
  
  countrySelect.items = ['USA', 'Canada', 'Mexico'];
  countrySelect.placeholder = 'Select country';
  
  countrySelect.addEventListener('change', (event) => {
    const country = event.detail.value;
    
    // Reset state selection
    stateSelect.clearSelection();
    
    // Load states for selected country
    if (country === 'USA') {
      stateSelect.items = ['California', 'Texas', 'New York', 'Florida'];
      stateSelect.disabled = false;
      stateSelect.placeholder = 'Select state';
    } else if (country === 'Canada') {
      stateSelect.items = ['Ontario', 'Quebec', 'British Columbia'];
      stateSelect.disabled = false;
      stateSelect.placeholder = 'Select state';
    } else if (country === 'Mexico') {
      stateSelect.items = ['Mexico City', 'Jalisco', 'Nuevo León'];
      stateSelect.disabled = false;
      stateSelect.placeholder = 'Select state';
    } else {
      stateSelect.items = [];
      stateSelect.disabled = true;
      stateSelect.placeholder = 'Select country first';
    }
  });
</script>
```

### Async Data Loading

```html
<div id="loading-container">
  <p>Loading options...</p>
</div>
<enhanced-select id="async-select" style="display: none;"></enhanced-select>

<script type="module">
  import '@smilodon/core';

  const container = document.getElementById('loading-container');
  const select = document.getElementById('async-select');
  
  // Simulate API call
  async function loadData() {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return [
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2' },
      { value: '3', label: 'Option 3' },
    ];
  }
  
  loadData().then(items => {
    select.items = items;
    select.placeholder = 'Select an option';
    container.style.display = 'none';
    select.style.display = 'block';
  });
</script>
```

### With Local Storage

```html
<enhanced-select id="persistent-select"></enhanced-select>

<script type="module">
  import '@smilodon/core';

  const select = document.getElementById('persistent-select');
  const STORAGE_KEY = 'selected-value';
  
  select.items = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];
  
  // Load saved value
  const savedValue = localStorage.getItem(STORAGE_KEY);
  if (savedValue) {
    select.value = savedValue;
  }
  
  // Save on change
  select.addEventListener('change', (event) => {
    localStorage.setItem(STORAGE_KEY, event.detail.value);
  });
</script>
```

---

## Troubleshooting

### Common Issues

#### Issue: Items not displaying

```javascript
// ❌ Wrong - typo in property name
select.item = ['Option 1', 'Option 2'];

// ✅ Correct
select.items = ['Option 1', 'Option 2'];
```

#### Issue: Event handler not firing

```javascript
// ❌ Wrong - incorrect event name
select.addEventListener('onChange', handler);

// ✅ Correct
select.addEventListener('change', handler);
```

#### Issue: Value not updating

```javascript
// ❌ Wrong - missing value property
select.selectedValue = 'apple';

// ✅ Correct
select.value = 'apple';
// or for multi-select:
select.selectedValues = ['apple', 'banana'];
```

### Performance Issues

If you experience slow rendering with large datasets:

1. Enable virtualization (enabled by default)
2. Increase `estimatedItemHeight` if items are taller than 48px
3. Use debouncing for search events

```javascript
select.virtualization = true;
select.estimatedItemHeight = 60;

// Debounce search
let searchTimeout;
select.addEventListener('search', (event) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    // Handle search
  }, 300);
});
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
