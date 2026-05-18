# CSS Framework Compatibility

Smilodon is designed to remain styleable in real browser applications, regardless of whether the host application uses utility-first CSS, classic stylesheet frameworks, CSS-in-JS, or plain authored CSS.

This document explains how to use Smilodon with Tailwind CSS, Bootstrap, Material UI, and raw CSS without fighting the component.

---

## Compatibility promise

Smilodon supports the browser styling primitives that modern frameworks build on:

- host-level classes and inline styles
- CSS custom properties
- `::part()` selectors for key internal elements
- state-class mapping through `classMap`
- custom renderers for rich option content
- mirrored document stylesheets for class-based custom option content

That means Smilodon can participate in:

- Tailwind utility styling
- Bootstrap layout and theme styling
- Material UI theme tokens and `sx`-driven wrappers
- raw CSS, CSS Modules, and design-system stylesheets

### What changed in `1.5.5`

The `1.5.5` release hardens the custom-renderer path used by Tailwind-style and CSS-framework-heavy integrations.

- mirrored document styles are scoped to the options subtree instead of the full shadow root
- dark theme markers are mirrored into that scoped subtree so `.dark`, `.dark-mode`, and data-theme-driven variants react immediately
- escaped Tailwind-style selectors such as `dark\:text-white` remain intact during selector scoping
- custom option roots keep Smilodon state classes and `data-sm-state` attributes so the rendered root can show hover, active, selected, and disabled visuals directly
- custom renderer accessibility is normalized so nested focusable descendants do not break listbox semantics by default

---

## The styling layers

Use the right hook for the right job.

### 1. Host classes

Use host classes for page layout and wrapper styling.

Examples:

- width
- margin
- grid / flex positioning
- responsive layout classes

```html
<enhanced-select class="w-full max-w-xl"></enhanced-select>
```

### 2. CSS custom properties

Use CSS variables to theme the control itself.

```css
enhanced-select {
  --select-input-border: 1px solid #d1d5db;
  --select-input-border-radius: 0.75rem;
  --select-input-focus-border: #2563eb;
  --select-shadow-focus: 0 0 0 3px rgba(37, 99, 235, 0.18);
  --select-option-selected-bg: #dbeafe;
  --select-option-selected-color: #1d4ed8;
}
```

### 3. Shadow parts

Use `::part()` when you need structural targeting.

```css
enhanced-select::part(button) {
  min-height: 3rem;
}

enhanced-select::part(listbox) {
  border-radius: 1rem;
}

enhanced-select::part(option) {
  font-size: 0.95rem;
}
```

### 4. `classMap`

Use `classMap` when selected, active, and disabled states should be driven by framework utility classes.

```ts
select.classMap = {
  selected: 'bg-blue-600 text-white font-semibold',
  active: 'bg-blue-50 text-blue-900 ring-2 ring-blue-200',
  disabled: 'opacity-50 cursor-not-allowed'
}
```

### 5. Custom renderers

Use custom renderers when your options contain badges, icons, avatars, or richer layouts.

This is also the best route when you want your framework's utility classes inside option content.

---

## Tailwind CSS

### What works well

Tailwind works especially well with Smilodon when you split responsibilities cleanly:

- Tailwind classes on the host for layout
- CSS variables for shared theming
- `classMap` for state styling
- custom renderers for rich utility-class-driven option content

### Recommended pattern

```tsx
<Select
  className="w-full max-w-xl"
  style={{
    '--select-input-border': '1px solid rgb(229 231 235)',
    '--select-input-border-radius': '0.75rem',
    '--select-input-focus-border': 'rgb(59 130 246)',
    '--select-shadow-focus': '0 0 0 3px rgb(59 130 246 / 0.18)',
    '--select-option-selected-bg': 'rgb(219 234 254)',
    '--select-option-selected-color': 'rgb(30 64 175)',
  } as React.CSSProperties}
  classMap={{
    selected: 'bg-blue-600 text-white',
    active: 'bg-blue-50 text-blue-900 ring-2 ring-blue-200',
    disabled: 'opacity-50 cursor-not-allowed',
  }}
/>
```

### Notes

- Tailwind does not automatically pierce Shadow DOM. Use `classMap`, CSS variables, and `::part()`.
- Custom option content can still use Tailwind utility classes because Smilodon mirrors document stylesheets when class-based rendering paths are active.
- Mirrored framework styles are now limited to the options subtree, so utility-framework resets do not restyle the closed input shell, badges, or dropdown chrome.
- Tailwind dark variants continue to work inside custom-rendered option content because Smilodon mirrors host dark markers into the scoped options subtree.
- When `optionRenderer` returns the option root element, style the root directly for stateful visuals instead of assuming Smilodon will wrap the rendered content in an extra child.
- Prefer stable utility strings over dynamically constructed class names when using Tailwind JIT/purge workflows.

---

## Bootstrap

### What works well

Bootstrap is a strong fit for:

- forms layout
- spacing utilities
- responsive container behavior
- token-style theming using Bootstrap palette values

### Recommended pattern

```html
<div class="container py-4">
  <label class="form-label fw-semibold">Team</label>
  <enhanced-select class="d-block w-100"></enhanced-select>
</div>
```

```css
enhanced-select {
  --select-input-border: 1px solid #ced4da;
  --select-input-border-radius: 0.375rem;
  --select-input-focus-border: #86b7fe;
  --select-shadow-focus: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  --select-option-hover-bg: #e9ecef;
  --select-option-selected-bg: #0d6efd;
  --select-option-selected-color: #ffffff;
  --select-badge-bg: #0d6efd;
}
```

### Notes

- Bootstrap form classes do not restyle the shadow internals automatically.
- Use Bootstrap on the outer layout and Smilodon tokens for the inner control.
- `::part(button)` and `::part(listbox)` are the best hooks when you want the control to feel visually closer to Bootstrap form controls.

---

## Material UI

Material UI is not a plain CSS framework; it is a React component library with theme and CSS-in-JS tooling. Smilodon remains compatible by letting MUI control the host and the token values.

### Recommended MUI pattern

```tsx
import { Box, GlobalStyles } from '@mui/material'
import { Select } from '@smilodon/react'

export function MuiExample() {
  return (
    <>
      <GlobalStyles
        styles={{
          'enhanced-select': {
            '--select-input-border': '1px solid rgba(0,0,0,0.23)',
            '--select-input-border-radius': '12px',
            '--select-input-focus-border': '#1976d2',
            '--select-shadow-focus': '0 0 0 3px rgba(25, 118, 210, 0.18)',
            '--select-option-hover-bg': 'rgba(25, 118, 210, 0.08)',
            '--select-option-selected-bg': 'rgba(25, 118, 210, 0.14)',
            '--select-option-selected-color': '#1565c0',
          },
        }}
      />

      <Box sx={{ width: 420, maxWidth: '100%' }}>
        <Select items={[{ value: 'a', label: 'Alpha' }]} />
      </Box>
    </>
  )
}
```

### Notes

- Use `Box`, `Stack`, `Grid`, or `sx` for layout.
- Use `GlobalStyles`, `styled()`, or theme-aware wrappers to define Smilodon CSS variables.
- Use `::part()` selectors from a global stylesheet when you want deeper structural styling.
- When rich option content is required, use `customRenderer` and MUI-compatible markup patterns inside the option body.

---

## Raw CSS

Raw CSS remains the most direct and lowest-friction styling path.

```css
enhanced-select.brand-select {
  --select-input-border: 1px solid #d4d4d8;
  --select-input-border-radius: 14px;
  --select-input-focus-border: #7c3aed;
  --select-shadow-focus: 0 0 0 3px rgba(124, 58, 237, 0.16);
  --select-dropdown-border-radius: 18px;
  --select-option-selected-bg: rgba(124, 58, 237, 0.12);
  --select-option-selected-color: #6d28d9;
}

enhanced-select.brand-select::part(chip) {
  font-weight: 600;
}

enhanced-select.brand-select::part(clear-button) {
  color: #6d28d9;
}
```

Use raw CSS when you want:

- exact control
- framework-neutral theming
- long-lived design-system stylesheets
- straightforward browser debugging

---

## Adapter-level support

The browser-facing adapters expose the same styling model:

- React: `className`, `style`, `classMap`, custom renderers
- Vue: `className`, `style`, `classMap`, custom renderers
- Svelte: `className`, `style`, `classMap`, custom renderers
- Solid: `class` / `className`, `style`, `classMap`, custom renderers
- Vanilla / core element: direct CSS variables, `::part()`, `classMap`, renderers

---

## Browser usage checklist

Use this checklist when integrating Smilodon into a CSS framework stack:

1. apply framework layout classes to the host or wrapper
2. define Smilodon tokens with your framework palette values
3. use `::part()` only for structural/internal styling
4. use `classMap` for selected, active, and disabled utility classes
5. use custom renderers for framework-specific rich option content
6. style the custom-renderer root directly when your renderer returns the root option element
7. verify focus ring contrast, keyboard states, and dark-mode text contrast after theming

---

## Related documents

- [./STYLING.md](./STYLING.md)
- [./STYLING-TOKENS.md](./STYLING-TOKENS.md)
- [./STYLING-EXAMPLES.md](./STYLING-EXAMPLES.md)
- [../examples/styling/README.md](../examples/styling/README.md)
