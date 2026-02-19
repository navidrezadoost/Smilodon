# Practical Styling Examples

This document demonstrates several non-destructive ways to style options so authors retain full control: via the JSON `style` on an item, via `className` + `::part()` selectors, and via an `optionRenderer` that applies inline/background-image safely.

## 1) Styling via JSON `style` (per-option inline styles)

```html
<script>
const items = [
  {
    value: 'gradient',
    label: 'Gradient option',
    // Inline styles applied directly to the option container
    style: {
      backgroundImage: 'linear-gradient(180deg,#f4f4f4 0%, #d7d7d7 100%)',
      color: '#111',
      backgroundSize: 'cover'
    }
  },
  {
    value: 'plain',
    label: 'Plain option'
  }
];

const select = document.querySelector('enhanced-select');
select.setItems(items);
</script>
```

Notes:
- The component applies per-option `style` via `Object.assign(this._container.style, style)` so authors can set any valid CSS property.
- Because component hover/selected rules use the `background` shorthand to ensure proper overrides, if you want a background-image to persist on hover you can set a custom hover variable (see example 3) or use a custom class with `::part()` rules.

## 2) Using `className` + `::part()` selectors (recommended for maintainable CSS)

```html
<style>
/* Target the internal option container via the part API */
enhanced-select::part(option).user-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  align-items: center;
  background-image: url('/avatars/alex.jpg');
  background-size: cover;
  color: white;
}

/* Hover state that preserves background-image by using background-image instead of background */
enhanced-select::part(option).user-card:hover {
  filter: brightness(0.92);
}

/* Selected state via part selector */
enhanced-select::part(option).user-card.selected {
  outline: 2px solid rgba(255,255,255,0.6);
}
</style>

<script>
const items = [
  { value: 1, label: 'Alex', className: 'user-card' },
];
document.querySelector('enhanced-select').setItems(items);
</script>
```

Why use `::part()`:
- `::part(option)` targets the internal option container (`part="option"`) and lets authors write external CSS to style options consistently.
- Using `className` together with `::part()` keeps markup clean and avoids inline style repetition.

## 3) Option renderer example that sets inline/background-image safely

If you need rich markup per option, return a DOM node (or HTML string) from your option renderer. To avoid your background-image being unintentionally removed by the component's hover `background` shorthand, use a CSS variable for hover/selected tokens or handle the hover inside your renderer's markup using a nested element.

```javascript
function optionRenderer(item, index) {
  // Create a wrapper that the component will place inside the option container
  const wrapper = document.createElement('div');
  wrapper.className = 'option-renderer-inner';
  wrapper.style.backgroundImage = `url(${item.image})`;
  wrapper.style.backgroundSize = 'cover';
  wrapper.style.padding = '12px';
  wrapper.style.color = item.textColor || '#fff';

  wrapper.innerHTML = `
    <div class="title">${item.label}</div>
    <div class="subtitle">${item.subtitle || ''}</div>
  `;

  return wrapper; // returns HTMLElement -> mounted into option container
}

const items = [
  { value: 1, label: 'Photo', image: '/img/1.jpg', render: optionRenderer }
];
document.querySelector('enhanced-select').setItems(items);
```

Tips to preserve images and custom styling:
- Use nested elements inside the renderer (`.option-renderer-inner`) rather than relying solely on the option container's background, so component-level `background` rules won't remove your nested element's `background-image`.
- Alternatively, set `--select-option-hover-bg: transparent` (or an explicit color) for the select instance to avoid hover clearing your image, e.g.: `element.style.setProperty('--select-option-hover-bg','transparent')`.

## 4) Other useful examples

- Using `part` for theming (dark/light): set `enhanced-select::part(option){ --my-token: ... }` and reference those tokens in your global CSS.
- Combining `className` and JSON `style` for small per-item overrides (e.g., badge color) while keeping layout CSS in a stylesheet.
- Providing both `render` and `className` to make the renderer provide structure while the stylesheet controls visual polish.

These examples give you maximal flexibility while preserving predictable hover/selected behavior from the component. If you'd like, I can add runnable demos under `examples/` showing each approach (plain JS + React + Vue) and update `docs/SELECT-COMPONENT.md` with a condensed reference.
