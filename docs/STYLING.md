# Enhanced Select Styling Guide

This guide helps you style the `enhanced-select` component to match your application's design system using robust, future-proof methods.

For the exhaustive token table with default values, value types, and purposes, see [docs/STYLING-TOKENS.md](./STYLING-TOKENS.md).

For concrete Tailwind CSS, Bootstrap, Material UI, and raw-CSS integration recipes, see [docs/CSS-FRAMEWORK-COMPATIBILITY.md](./CSS-FRAMEWORK-COMPATIBILITY.md).

## Customization Coverage Checklist

- ✅ Theme colors, surfaces, borders, typography, radii, and elevation
- ✅ Multi-select chips, chip remove controls, and badge motion
- ✅ Input shell sizing, hover/focus states, separator, arrow, and clear control
- ✅ Dropdown panel spacing, animation, scrolling, and scrollbar styling
- ✅ Option hover, active, selected, pressed, and selected-indicator states
- ✅ Empty, loading, searching, error, reduced-motion, high-contrast, and touch-target behavior
- ✅ Dark mode using the same token surface rather than a separate styling API

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

  Since Tailwind is global by default and Smilodon renders inside Shadow DOM, these patterns are the most commonly used:

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
       --select-accent: theme('colors.blue.600');
       --select-border-focus: theme('colors.blue.600');
     }
     enhanced-select::part(button) {
       border-color: var(--select-border-focus);
     }
     ```

2. **CSS framework compatibility strategy**

   Smilodon is compatible with utility-first CSS, component-library theming, and raw CSS when you use the right level of the styling API:

   - use host classes for layout, spacing, and wrapper-level framework utilities
   - use CSS custom properties for colors, radii, focus rings, spacing, and density
   - use `::part()` for internal structural elements like the trigger, listbox, options, and chips
   - use `classMap` when you want framework utility classes to control selected, active, or disabled option states
   - use custom renderers when you want framework classes on rich content inside an option

3. **Final accessibility tips (for 2026 audit)**

   - Make sure the **focus ring** on `::part(input)` and `::part(option)` complies with WCAG 2.2 (contrast and visible).
   - Test that **aria-live** area is properly announced for search/loading/selections.
   - Run 2026 tools like axe DevTools or Lighthouse (accessibility tab) on the playground and aim for zero violations.

4. **Dark mode token compatibility**

  Smilodon uses the shared `--select-*` token surface for dark mode, but also accepts these dark aliases in dark mode contexts for compatibility:

  - `--select-dark-bg`
  - `--select-dark-text`
  - `--select-dark-border`
  - `--select-dark-dropdown-bg`
  - `--select-dark-option-color`
  - `--select-dark-option-bg`
  - `--select-dark-option-hover-bg`
  - `--select-dark-option-hover-color`
  - `--select-dark-option-selected-bg`
  - `--select-dark-option-selected-color`
  - `--select-dark-option-selected-hover-bg`
  - `--select-dark-option-selected-hover-color`

5. **Selected-value alignment**

  You can control alignment in both places that users visually inspect most often:

  - the **selected value inside the closed input shell**
  - the **option labels inside the open dropdown list**

  This makes it easy to switch between left/start, centered, and right/end layouts and verify that the closed state and open state stay visually aligned.

  Primary tokens:

  - `--select-input-text-align`: `start | center | end | left | right`
  - `--select-input-justify-content`: useful for multi-select badge rows and visible selection layout
  - `--select-option-text-align`: align option labels inside the dropdown

  Supporting layout tokens:

  - `--select-input-align-items`
  - `--select-input-align-content`
  - `--select-input-align-self`

  Recommended inspection workflow:

  1. switch alignment to `center` or `right`
  2. check the selected value while the control is closed
  3. open the dropdown and confirm the option rows follow the same visual alignment
  4. if you are in multi-select mode, also inspect chip-row alignment with `--select-input-justify-content`

  Example:

  ```css
  enhanced-select.align-center {
    --select-input-text-align: center;
    --select-option-text-align: center;
  }

  enhanced-select.align-right {
    --select-input-text-align: right;
    --select-option-text-align: right;
  }
  ```

  Runtime config example:

  ```typescript
  select.updateConfig({
    styles: {
      input: {
        textAlign: 'center',
      },
      option: {
        textAlign: 'center',
      },
    },
  });
  ```

  For grouped dropdowns, you can align headers independently with `--select-group-header-text-align` or `styles.groupHeader.textAlign`.

6. **Multi-select height and scroll direction**

  Multi-select chip rows can be configured for wrapped, vertical-scroll, or horizontal-scroll layouts.

  Useful hooks:

  - `--select-multi-input-max-height`
  - `--select-multi-input-overflow-x`
  - `--select-multi-input-overflow-y`
  - `--select-multi-input-flex-wrap`
  - `--select-multi-input-horizontal-cursor`

  `wrap` grows naturally without an internal chip scrollbar. `vertical` keeps wrapping but constrains the chip area to `maxHeight` and scrolls vertically. `horizontal` keeps chips on one row and scrolls sideways.

  For true horizontal chip scrolling, configure `multiSelectDisplay.mode = 'horizontal'`. That mode does more than flip overflow values: it keeps chips on one row, preserves drag-scroll behavior, and reserves space for the arrow / clear controls.

  When an option is both selected and active, customize the combined surface with:

  - `--select-option-selected-active-bg`
  - `--select-option-selected-active-color`
  - `--select-option-selected-active-border`
  - `--select-option-selected-active-shadow`
  - `--select-option-selected-active-outline`

7. **Dropdown placement mode**

  The dropdown can now open in three placement modes:

  - `bottom` — always open below the input shell
  - `top` — always open above the input shell
  - `auto` — open below when there is enough room below; otherwise open above

  This can be configured globally or per select instance.

  Per-instance example:

  ```typescript
  select.updateConfig({
    dropdownPlacement: {
      mode: 'auto',
    },
  });
  ```

  Global default example:

  ```typescript
  configureSelect({
    dropdownPlacement: {
      mode: 'top',
    },
  });
  ```

  Related tokens:

  - `--select-dropdown-top`
  - `--select-dropdown-bottom`
  - `--select-dropdown-transform-origin`
  - `--select-dropdown-top-transform-origin`
  - `--select-dropdown-enter-from-transform`
  - `--select-dropdown-top-enter-from-transform`

  In `auto` mode, Smilodon checks the available viewport space below the select. If the dropdown's needed height fits below, it opens below; otherwise it opens above.

8. **Direction: LTR / RTL**

  The select now supports both `ltr` and `rtl` direction modes.

  Default behavior:

  - global default is `ltr`
  - consumers can override direction globally
  - consumers can also override direction per select instance

  Global example:

  ```typescript
  configureSelect({
    direction: 'rtl',
  });
  ```

  Per-instance example:

  ```typescript
  select.updateConfig({
    direction: 'rtl',
  });
  ```

  What changes automatically in RTL:

  - the input shell direction
  - arrow and clear-control anchoring
  - separator placement
  - selected indicator stripe position in options
  - chip remove-button spacing

  Useful related hooks:

  - `--select-input-padding-rtl`
  - `--select-input-padding-with-clear-rtl`
  - `--select-arrow-border-radius-rtl`
  - `--select-option-selected-indicator-right`
  - `--select-option-selected-indicator-radius-rtl`

  Multi-select chip scrolling should be configured with `multiSelectDisplay.mode` instead of raw overflow variables alone:

  - `wrap`: grows naturally with chips and does not add an internal chip scrollbar by default
  - `vertical`: keeps wrapping enabled but constrains the chip area to `maxHeight`, with vertical scrolling before the fixed arrow / clear-control area
  - `horizontal`: keeps chips on one row, preserves the closed-control height, and scrolls horizontally under the fixed action area

  Example:

  ```typescript
  select.updateConfig({
    multiSelectDisplay: {
      mode: 'horizontal',
      maxHeight: '54px',
      dragScroll: true,
    },
  });
  ```

9. **Disabled / dimmed options**

  Items marked with `disabled: true` are non-selectable and non-hoverable by default.

  If you want dimmed options to keep some interaction, use:

  ```typescript
  select.updateConfig({
    selection: {
      disabledOptionBehavior: {
        hoverable: true,
        focusable: true,
        selectable: false,
      },
    },
  });
  ```

  Styling hooks:

  - `styles.disabledOption`
  - `classMap.disabled`
  - `--select-option-disabled-*`

10. **Selected indicator and pressed state**

  If you want to hide or move the selected side indicator, do not target internal pseudo-elements directly. Use the supported controls:

  ```typescript
  select.updateConfig({
    selection: {
      showSelectedIndicator: false,
    },
    styles: {
      selectedIndicator: {
        width: '4px',
        background: '#2563eb',
        right: '0',
        left: 'auto',
      },
    },
  });
  ```

  Relevant tokens:

  - `--select-option-selected-indicator-display`
  - `--select-option-selected-indicator-width`
  - `--select-option-selected-indicator-height`
  - `--select-option-selected-indicator-bg`
  - `--select-option-selected-indicator-left`
  - `--select-option-selected-indicator-right`

  Smilodon also removes the older option pressed animation and active outline by default. To keep the option surface flat explicitly:

  ```css
  enhanced-select {
    --select-option-pressed-transform: none;
    --select-option-selected-pressed-transform: none;
    --select-option-active-outline: none;
    --select-option-selected-active-outline: none;
  }
  ```

7. **Dropdown layering priority**

  If surrounding layout elements overlap the open listbox, control stacking with:

  - `--select-host-z-index`: base host stacking level
  - `--select-host-open-z-index`: host stacking level while open
  - `--select-ancestor-open-z-index`: stacking level for lifted ancestor stacking contexts while open
  - `--select-dropdown-z-index`: dropdown panel stacking level

  Example:

  ```css
  enhanced-select {
    --select-host-z-index: 1;
    --select-host-open-z-index: 4000;
    --select-ancestor-open-z-index: 4000;
    --select-dropdown-z-index: 4001;
  }
  ```

8. **CSS Modules targeting reminder**

  If you style the host with CSS Modules, make sure selectors targeting `enhanced-select` are global so they can match the real custom-element tag:

  ```css
  :global(enhanced-select.dark-mode) {
    --select-dark-bg: #1f2937;
    --select-dark-text: #f9fafb;
  }
  ```


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
| `chip` | Chip | Selected item chip in multi-select. |
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

enhanced-select::part(chip) {
  background: #f8fafc;
  color: #0f172a;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
}

enhanced-select::part(chip-remove) {
  background: #e2e8f0;
  color: #334155;
}
```

### Multi-select chip defaults

Multi-select chips now ship with a quieter default pill style so custom option renderers do not look noisy out of the box. You can still override them with either CSS variables or `::part()` selectors.

Useful variables:

- `--select-badge-bg`
- `--select-badge-color`
- `--select-badge-border`
- `--select-badge-border-radius`
- `--select-badge-width`
- `--select-badge-height`
- `--select-badge-min-width`
- `--select-badge-padding`
- `--select-badge-margin`
- `--select-badge-font-size`
- `--select-badge-shadow`
- `--select-badge-hover-bg`
- `--select-badge-active-bg`
- `--select-badge-remove-bg`
- `--select-badge-remove-color`
- `--select-badge-remove-size`
- `--select-badge-remove-icon-size`
- `--select-badge-remove-hover-bg`
- `--select-badge-remove-focus-outline`
- `--select-multi-input-min-width`

Motion-related chip hooks are also available:

- `--select-badge-animation`
- `--select-badge-hover-transform`
- `--select-badge-active-transform`
- `--select-badge-remove-hover-transform`
- `--select-badge-remove-active-transform`

You can also replace the default chip remove mark with custom markup:

```typescript
select.updateConfig({
  selection: {
    removeButtonIcon: '<svg viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>'
  }
});
```

### Runtime style config for badges and groups

In addition to CSS variables, the runtime `styles` config now supports these sections:

- `badge`
- `badgeHover`
- `badgeActive`
- `badgeLabel`
- `badgeRemove`
- `badgeRemoveHover`
- `badgeRemoveActive`
- `groupHeader`
- `activeOption`

Example:

```typescript
select.updateConfig({
  styles: {
    badge: {
      borderRadius: '8px',
      height: '32px',
      background: '#0f172a',
      color: '#fff',
      border: '1px solid #334155'
    },
    badgeRemove: {
      width: '20px',
      height: '20px',
      fontSize: '12px'
    },
    groupHeader: {
      textAlign: 'center',
      color: '#7c3aed',
      margin: '6px 0 0',
      borderBottom: '1px solid #e5e7eb'
    },
    option: {
      border: '1px solid #e2e8f0',
      borderRadius: '10px'
    },
    activeOption: {
      border: '1px solid #6366f1',
      outline: '2px solid rgba(99, 102, 241, 0.25)'
    }
  }
});
```

See [docs/STYLING-TOKENS.md](./STYLING-TOKENS.md#selection-badges--chips) for the full chip table.

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
