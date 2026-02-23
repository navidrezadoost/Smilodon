# Enhanced Select Styling Guide

This guide helps you style the `enhanced-select` component to match your application's design system using robust, future-proof methods.

## Styling Hierarchy (Recommended)

1. **CSS Variables**: The fastest way to set the overall theme (colors, spacing).
2. **`::part()` Selectors**: To style inner key elements (Shadow DOM).
3. **State Classes**: `.sm-selected`, `.active`, `.disabled` (with `classMap` override).
4. **Data Attribute Selectors**: `[data-sm-state~="selected"]` as a strong fallback.
5. **Slots**: For custom content like `header`, `footer`, `no-results`.

### Prioritize Styling Methods (Cheat Sheet)

| Priority | Method | When to Use? | Real-World Example (Tailwind-Friendly) |
| :--- | :--- | :--- | :--- |
| **1** | **CSS Variables** | Overall Organizational Theme | `--sm-primary: #3b82f6;` in `:root` or host |
| **2** | **`::part()`** | Style Key Inner Elements | `enhanced-select::part(input) { border-color: blue; }` |
| **3** | **`classMap`** | Override States with Utilities | `classMap: { selected: 'bg-blue-700 text-white' }` |
| **4** | **`[data-sm-state]`** | Strong fallback or complex selectors | `[data-sm-state~="selected"] { font-weight: 600; }` |
| **5** | **Escape hatch** | Very special cases (last resort) | constructable stylesheet only when absolutely necessary |

> **Important**: When using `classMap`, the overridden classes are applied **to the host element of the option** (the same element that has `part="option"`). So you can style it by combining `::part(option)` with your own classes:
>
> ```css
> /* Style the option only when it has the valid Tailwind class applied via classMap */
> enhanced-select::part(option).bg-blue-700 {
>   border-left: 4px solid #2563eb;
> }
> ```

### Practical Tips for Teams


1. **Tailwind + Shadow DOM – Best Practice 2026**

   Since Tailwind is global by default and Shadow DOM is disabled, these patterns are the most commonly used:

   - **Recommended Method A (simplest):** Fill `classMap` with Tailwind classes → no need to generate CSS inside shadow.
     ```js
     select.classMap = {
       selected: 'bg-blue-600 text-white ring-2 ring-blue-300',
       active: 'bg-blue-50 text-blue-900',
       disabled: 'opacity-50 cursor-not-allowed'
     };
     ```

   - **Method B (if you need extensive utilities inside the shadow):** Use tools like Twind or tailwind-merge + constructable styles to build only the classes you need inside the shadow.

   - **Method C (library suggestion):** Combine CSS variables with Tailwind theme:
     ```css
     :root {
       --sm-color-primary: theme('colors.blue.600');
     }
     enhanced-select::part(button) {
       background-color: var(--sm-color-primary);
     }
     ```

2. **Final accessibility tips (for 2026 audit)**

   - Make sure the **focus ring** on `::part(input)` and `::part(option)` complies with WCAG 2.2 (contrast and visible).
   - Test that **aria-live** area is properly announced for search/loading/selections.
   - Run 2026 tools like axe DevTools or Lighthouse (accessibility tab) on the playground and aim for zero violations.


---

## 2. Inner Elements (Shadow Parts)

The component exposes the following parts for styling:

| Part Name | Element | Description |
| :--- | :--- | :--- |
| `button` | Input Container | The main clickable area/container. |
| `input` | `<input>` | The search/display input field. |
| `arrow` | SVG Icon | The dropdown arrow icon. |
| `listbox` | Dropdown | The wrapper for the list of options. |
| `option` | Option | The wrapper for each option. |
| `group-header` | Div | Header element that appears above each group of options. |
| `checkmark` | Icon | Selected check icon (if visible). |
| `chip` | Chip | Selected item chip in multi-select (future). |
| `chip-remove` | Button | Close button on a chip. |
| `clear-button` | Button | Clear control button in input area (optional). |
| `clear-icon` | Span | Icon/text content inside clear button. |
| `no-results` | Div | Message when there are no results. |
| `loading` | Div | The busy state/loader container. |
| `popover` | Wrapper | The main dropdown wrapper. |

> **Tip:** you can target the `group-header` and `no-results` slots just like any other part:
>
> ```css
> enhanced-select::part(group-header) { font-weight: 700; }
> enhanced-select::part(no-results) { color: #a00; }
> ```
>
### Example

```css
enhanced-select::part(input) {
  border: 2px solid #0066cc;
  border-radius: 6px;
  background-color: #f0f8ff;
}

enhanced-select::part(arrow) {
  color: #0066cc;
  width: 1.2em;
}

enhanced-select::part(option) { 
  padding: 10px 16px;
  border-bottom: 1px solid #eee;
}

/* Hover state on part */
enhanced-select::part(option):hover {
  background-color: #f5f5f5;
}
```

---

## 3. State Classes

The component applies specific classes to the option elements based on their state.

| State | Default Class | Namespaced Class | Description |
| :--- | :--- | :--- | :--- |
| Selected | `.selected` | `.sm-selected` | The item is currently selected. |
| Active | `.active` | `.sm-active` | The item is currently focused/navigated to. |
| Disabled | `.disabled` | `.sm-disabled` | The item is disabled. |

### Overriding Classes (`classMap`)

You can provide a `classMap` property to override the default state classes with your own utility classes (e.g., Tailwind). This is the **recommended approach for utility-first frameworks**.

```typescript
const select = document.querySelector('enhanced-select');
select.classMap = {
  selected: 'bg-blue-600 text-white font-bold',
  active: 'bg-blue-100 ring-2 ring-blue-500',
  disabled: 'opacity-50 cursor-not-allowed'
};
```

#### Tailwind + Shadow DOM Strategy

Since Tailwind is global and Shadow DOM encapsulates styles, use one of these patterns:

1.  **Method A (Recommended):** Use `classMap` to inject Tailwind classes into the options. The core ensures these classes are applied where they can be styled by global CSS.
2.  **Method B (Advanced):** Use CSS Variables for theme colors and `::part` for structure.
    ```css
    :root {
      --sm-primary: theme('colors.blue.600');
    }
    enhanced-select::part(button) {
      border: 2px solid var(--sm-primary);
    }
    ```

### Selected vs Active Priority (important)

When a selected option is also active/focused (common with keyboard navigation), use the dedicated selected+active tokens to keep selected styling consistent:

```css
enhanced-select {
  --select-option-selected-bg: #0016d8;
  --select-option-selected-color: #ffffff;
  --select-option-selected-border: 1px solid #00ffbf;

  /* selected + active/focus state */
  --select-option-selected-active-bg: #0016d8;
  --select-option-selected-active-color: #ffffff;
  --select-option-selected-active-border: 1px solid #00ffbf;
}
```

> Border variables use CSS `border` shorthand, so color-only values like `#00ffbf` are not valid by themselves. Use `1px solid #00ffbf`.

---

## 4. Data Attributes API

For robust selectors that don't rely on class names, use the stable data attributes:

- `data-sm-state="selected active"`: Space-separated list of states.
- `data-sm-index="0"`: The index of the option.
- `data-sm-value="my-value"`: The stringified value of the option.
- `data-sm-selectable`: Present on all selectable options.
- `role="option"`: Accessible role.
- `aria-selected="true/false"`: Accessibility state.

### CSS Example

```css
enhanced-select [data-sm-state~="selected"] {
  background-color: navy;
  color: white;
}

enhanced-select [data-sm-state~="selected"]::part(checkmark) {
  opacity: 1;
}
```

---

## 5. Custom Renderers

When using a custom renderer, the Core will automatically apply the standard attributes and classes to your returned element, ensuring it works seamlessly with the styling system and accessibility tools.

```typescript
// Your custom element
const div = document.createElement('div');
div.textContent = item.label;
// Core adds: class="smilodon-option sm-selected ...", data-sm-state="selected", role="option", etc.
return div;
```

---

## 6. Clear Control (Selection/Search Reset)

Enable the clear control from config:

```js
select.updateConfig({
  clearControl: {
    enabled: true,
    clearSelection: true,
    clearSearch: true,
    hideWhenEmpty: true,
    ariaLabel: 'Clear selected and searched values',
    icon: '✕'
  }
});
```

### Style tokens

```css
enhanced-select {
  --select-input-padding-with-clear: 6px 84px 6px 8px;
  --select-separator-position-with-clear: 72px;
  --select-arrow-right-with-clear: 32px;

  --select-clear-button-size: 24px;
  --select-clear-button-right: 6px;
  --select-clear-button-bg: transparent;
  --select-clear-button-color: #6b7280;
  --select-clear-button-hover-bg: rgba(0, 0, 0, 0.08);
  --select-clear-button-hover-color: #111827;
  --select-clear-button-border: none;
  --select-clear-button-radius: 999px;
  --select-clear-button-focus-outline: 2px solid rgba(102, 126, 234, 0.55);

  --select-clear-icon-size: 16px;
  --select-clear-icon-weight: 600;
}
```

### Part selectors

```css
enhanced-select::part(clear-button) {
  backdrop-filter: blur(4px);
}

enhanced-select::part(clear-icon) {
  font-family: inherit;
}
```
