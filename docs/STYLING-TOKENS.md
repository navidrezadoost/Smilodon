# Styling Token Reference

This reference documents the current `enhanced-select` styling surface exposed by the Shadow DOM stylesheet in `packages/core/src/components/enhanced-select.ts`.

## Audit checklist

- ✅ Colors, surfaces, text, borders, and accents are tokenized.
- ✅ Layout and sizing for the host, input shell, badges, arrow, dropdown, options, and feedback states are tokenized.
- ✅ Badge/chip visuals and remove-button micro-interactions are tokenized.
- ✅ Clear-control placement, focus treatment, and hover/active motion are tokenized.
- ✅ Dropdown panel elevation, animation, and internal scrolling affordances are tokenized.
- ✅ Option hover, active, selected, pressed, and selected-indicator states are tokenized.
- ✅ Motion controls include transitions, indicator animations, spinner motion, and reduced-motion fallbacks.
- ✅ Accessibility hooks include error styles, high-contrast behavior, and touch targets.
- ✅ Dark mode remaps the same token surface instead of using a separate styling path.

## Core theme

| Token | Default | Type | Purpose |
| --- | --- | --- | --- |
| `--select-width` | `100%` | layout | Host width. |
| `--select-height` | `auto` | layout | Host height. |
| `--select-font-family` | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` | font | Component font stack. |
| `--select-primary` | `#1a1a2e` | color | Reserved primary palette anchor. |
| `--select-primary-light` | `#16213e` | color | Secondary dark accent used in gradients. |
| `--select-accent` | `#0f3460` | color | Main interactive accent. |
| `--select-accent-hover` | `#e94560` | color | Hover and destructive accent. |
| `--select-surface` | `#ffffff` | color | Base surface color. |
| `--select-surface-elevated` | `#fafbfc` | color | Elevated surface color for hover/active layers. |
| `--select-border` | `#e1e5eb` | color | Shared border and divider color. |
| `--select-border-focus` | `#0f3460` | color | Focused border color. |
| `--select-text` | `#1a1a2e` | color | Primary text color. |
| `--select-text-muted` | `#6b7280` | color | Muted text and icon color. |
| `--select-text-placeholder` | `#9ca3af` | color | Placeholder text color. |
| `--select-shadow-sm` | `0 1px 2px rgba(0, 0, 0, 0.04)` | shadow | Low-elevation shadow. |
| `--select-shadow-md` | `0 4px 12px rgba(0, 0, 0, 0.08)` | shadow | Medium-elevation shadow. |
| `--select-shadow-lg` | `0 8px 24px rgba(0, 0, 0, 0.12)` | shadow | Floating panel shadow. |
| `--select-shadow-focus` | `0 0 0 3px rgba(15, 52, 96, 0.12)` | shadow | Focus glow. |
| `--select-radius-sm` | `6px` | radius | Small radius. |
| `--select-radius-md` | `10px` | radius | Medium radius. |
| `--select-radius-lg` | `14px` | radius | Large radius. |
| `--select-transition-fast` | `150ms cubic-bezier(0.4, 0, 0.2, 1)` | timing | Fast transition timing. |
| `--select-transition-smooth` | `250ms cubic-bezier(0.4, 0, 0.2, 1)` | timing | Smooth transition timing. |
| `--select-transition-bounce` | `350ms cubic-bezier(0.34, 1.56, 0.64, 1)` | timing | Springy interaction timing. |

## Selection badges / chips

| Token | Default | Type | Purpose |
| --- | --- | --- | --- |
| `--select-badge-gap` | `6px` | spacing | Space between badge label and remove control. |
| `--select-badge-width` | `auto` | size | Explicit badge width. |
| `--select-badge-min-width` | `0` | size | Minimum badge width. |
| `--select-badge-height` | `auto` | size | Explicit badge height. |
| `--select-badge-min-height` | `26px` | size | Minimum badge height. |
| `--select-badge-padding` | `4px 10px 4px 12px` | spacing | Badge interior spacing. |
| `--select-badge-margin` | `3px` | spacing | Outer badge spacing in wrapped layouts. |
| `--select-badge-bg` | `linear-gradient(135deg, var(--select-accent) 0%, var(--select-primary-light) 100%)` | paint | Badge background. |
| `--select-badge-dark-bg` | `linear-gradient(135deg, var(--select-accent) 0%, #4f46e5 100%)` | paint | Dark-theme badge background. |
| `--select-badge-color` | `#ffffff` | color | Badge text color. |
| `--select-badge-border` | `none` | border | Badge border. |
| `--select-badge-border-radius` | `999px` | radius | Badge pill radius. |
| `--select-badge-shadow` | `var(--select-shadow-sm), inset 0 1px 0 rgba(255, 255, 255, 0.1)` | shadow | Badge resting shadow. |
| `--select-badge-hover-shadow` | `var(--select-shadow-md), inset 0 1px 0 rgba(255, 255, 255, 0.15)` | shadow | Badge hover shadow. |
| `--select-badge-font-size` | `13px` | typography | Badge text size. |
| `--select-badge-font-weight` | `500` | typography | Badge text weight. |
| `--select-badge-line-height` | `1.2` | typography | Badge line height. |
| `--select-badge-letter-spacing` | `0.01em` | typography | Badge text tracking. |
| `--select-badge-max-width` | `100%` | size | Maximum badge width before truncation. |
| `--select-badge-animation` | `badgeEnter 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards` | animation | Badge entry motion. |
| `--select-badge-enter-from-opacity` | `0` | opacity | Badge entry start opacity. |
| `--select-badge-enter-from-transform` | `scale(0.8) translateY(-4px)` | transform | Badge entry start transform. |
| `--select-badge-enter-to-opacity` | `1` | opacity | Badge entry end opacity. |
| `--select-badge-enter-to-transform` | `scale(1) translateY(0)` | transform | Badge entry end transform. |
| `--select-badge-hover-transform` | `scale(1.02)` | transform | Badge hover transform. |
| `--select-badge-hover-bg` | `var(--select-badge-bg)` | color | Badge hover background. |
| `--select-badge-hover-color` | `var(--select-badge-color)` | color | Badge hover text color. |
| `--select-badge-hover-border` | `var(--select-badge-border)` | border | Badge hover border. |
| `--select-badge-active-bg` | `var(--select-badge-hover-bg)` | color | Badge pressed background. |
| `--select-badge-active-color` | `var(--select-badge-hover-color)` | color | Badge pressed text color. |
| `--select-badge-active-border` | `var(--select-badge-hover-border)` | border | Badge pressed border. |
| `--select-badge-active-shadow` | `var(--select-badge-hover-shadow)` | shadow | Badge pressed shadow. |
| `--select-badge-active-transform` | `scale(0.98)` | transform | Badge pressed transform. |
| `--select-badge-label-color` | `inherit` | color | Badge label text color. |
| `--select-badge-label-font-size` | `inherit` | typography | Badge label font size. |
| `--select-badge-label-font-weight` | `inherit` | typography | Badge label font weight. |
| `--select-badge-label-line-height` | `var(--select-badge-line-height)` | typography | Badge label line height. |
| `--select-badge-label-letter-spacing` | `inherit` | typography | Badge label letter spacing. |
| `--select-badge-label-text-align` | `start` | layout | Badge label alignment. |

### Badge remove control

| Token | Default | Type | Purpose |
| --- | --- | --- | --- |
| `--select-badge-remove-size` | `18px` | size | Remove button size. |
| `--select-badge-remove-min-width` | `var(--select-badge-remove-size)` | size | Minimum remove button width. |
| `--select-badge-remove-min-height` | `var(--select-badge-remove-size)` | size | Minimum remove button height. |
| `--select-badge-remove-icon-size` | `10px` | size | Remove icon wrapper size for text or SVG icons. |
| `--select-badge-remove-margin-left` | `2px` | spacing | Gap before remove button. |
| `--select-badge-remove-bg` | `rgba(255, 255, 255, 0.2)` | color | Remove button background. |
| `--select-badge-remove-border` | `none` | border | Remove button border. |
| `--select-badge-remove-radius` | `50%` | radius | Remove button shape. |
| `--select-badge-remove-color` | `#ffffff` | color | Remove icon/text color. |
| `--select-badge-remove-font-size` | `11px` | typography | Remove icon/text size. |
| `--select-badge-remove-font-weight` | `600` | typography | Remove icon/text weight. |
| `--select-badge-remove-hover-bg` | `rgba(233, 69, 96, 0.9)` | color | Remove button hover background. |
| `--select-badge-remove-hover-color` | `var(--select-badge-remove-color)` | color | Remove button hover icon/text color. |
| `--select-badge-remove-hover-border` | `var(--select-badge-remove-border)` | border | Remove button hover border. |
| `--select-badge-remove-hover-shadow` | `none` | shadow | Remove button hover shadow. |
| `--select-badge-remove-hover-transform` | `scale(1.15) rotate(90deg)` | transform | Remove button hover motion. |
| `--select-badge-remove-focus-outline` | `2px solid rgba(255, 255, 255, 0.5)` | outline | Keyboard focus outline. |
| `--select-badge-remove-focus-offset` | `1px` | spacing | Focus outline offset. |
| `--select-badge-remove-active-bg` | `var(--select-badge-remove-hover-bg)` | color | Remove button pressed background. |
| `--select-badge-remove-active-color` | `var(--select-badge-remove-hover-color)` | color | Remove button pressed icon/text color. |
| `--select-badge-remove-active-border` | `var(--select-badge-remove-hover-border)` | border | Remove button pressed border. |
| `--select-badge-remove-active-shadow` | `var(--select-badge-remove-hover-shadow)` | shadow | Remove button pressed shadow. |
| `--select-badge-remove-active-transform` | `scale(0.95) rotate(90deg)` | transform | Remove button pressed motion. |

## Input shell and text field

| Token | Default | Type | Purpose |
| --- | --- | --- | --- |
| `--select-input-gap` | `6px` | spacing | Gap between inline content in the shell. |
| `--select-input-padding` | `10px 52px 10px 14px` | spacing | Standard input shell padding. |
| `--select-input-padding-with-clear` | `10px 84px 10px 14px` | spacing | Shell padding when the clear control is shown. |
| `--select-input-height` | `auto` | layout | Shell height. |
| `--select-input-min-height` | `48px` | size | Minimum shell height. |
| `--select-input-max-height` | `160px` | size | Maximum shell height before internal scroll. |
| `--select-input-overflow-y` | `auto` | layout | Vertical overflow behavior. |
| `--select-input-bg` | `var(--select-surface)` | color | Shell background. |
| `--select-input-border` | `1.5px solid var(--select-border)` | border | Shell border. |
| `--select-input-border-radius` | `var(--select-radius-md)` | radius | Shell radius. |
| `--select-input-hover-border` | `var(--select-border-focus)` | color | Hover border color. |
| `--select-input-hover-shadow` | `var(--select-shadow-sm), 0 0 0 1px rgba(15, 52, 96, 0.05)` | shadow | Hover shadow. |
| `--select-input-focus-border` | `var(--select-border-focus)` | color | Focus border color. |
| `--select-input-width` | `100%` | layout | Input width in single-select mode. |
| `--select-input-min-width` | `0` | size | Minimum text input width. |
| `--select-multi-input-min-width` | `96px` | size | Minimum text input width in multi-select mode. |
| `--select-multi-input-max-height` | `160px` | size | Maximum visible height of the selected-chip area in multi-select mode. |
| `--select-multi-input-overflow-x` | `hidden` | layout | Horizontal overflow behavior for the multi-select chip area. |
| `--select-multi-input-overflow-y` | `auto` | layout | Vertical overflow behavior for the multi-select chip area. |
| `--select-multi-input-flex-wrap` | `wrap` | layout | Wrapping behavior for selected chips in multi-select mode. |
| `--select-multi-input-align-content` | `flex-start` | layout | Cross-row alignment for wrapped multi-select chips. |
| `--select-multi-input-horizontal-input-flex` | `0 0 var(--select-multi-input-min-width)` | layout | Search-input flex basis in horizontal chip-scroll mode. |
| `--select-multi-input-horizontal-cursor` | `grab` | cursor | Cursor shown in horizontal drag-scroll mode. |
| `--select-multi-input-horizontal-active-cursor` | `grabbing` | cursor | Cursor shown while dragging in horizontal chip-scroll mode. |
| `--select-multi-separator-inset-block` | `10px` | spacing | Top and bottom inset for the separator line when the multi-select shell grows taller. |
| `--select-multi-action-surface-bg` | `var(--select-input-bg)` | color | Background used to protect the right-side action area in horizontal chip-scroll mode. |
| `--select-multi-action-divider` | `1px solid var(--select-border)` | border | Divider used between horizontal chip content and the right-side action area. |
| `--select-input-align-items` | `center` | layout | Cross-axis alignment for content inside the input shell. |
| `--select-input-align-content` | `center` | layout | Wrapped-row alignment inside the input shell. |
| `--select-input-align-self` | `center` | layout | Alignment of the actual text input within the shell. |
| `--select-input-justify-content` | `flex-start` | layout | Horizontal alignment strategy for the visible selection row. |
| `--select-input-text-align` | `start` | typography | Text alignment for the visible selected value inside the input shell. |
| `--select-input-padding-rtl` | `10px 14px 10px 52px` | spacing | Input shell padding override for RTL layout. |
| `--select-input-padding-with-clear-rtl` | `10px 14px 10px 84px` | spacing | Input shell padding override for RTL layout when the clear control is visible. |
| `--select-input-field-padding` | `0` | spacing | Actual text input padding. |
| `--select-input-font-size` | `15px` | typography | Input text size. |
| `--select-input-font-family` | `inherit` | typography | Input text family. |
| `--select-input-font-style` | `normal` | typography | Input text style. |
| `--select-input-line-height` | `1.5` | typography | Input text line height. |
| `--select-input-font-weight` | `450` | typography | Input text weight. |
| `--select-input-letter-spacing` | `0.01em` | typography | Input text tracking. |
| `--select-input-color` | `var(--select-text)` | color | Input text color. |
| `--select-input-placeholder-color` | `var(--select-text-placeholder)` | color | Placeholder color. |
| `--select-disabled-bg` | `#f5f5f5` | color | Disabled input background. |
| `--select-input-disabled-opacity` | `0.6` | opacity | Disabled input opacity. |

## Arrow, separator, and clear control

| Token | Default | Type | Purpose |
| --- | --- | --- | --- |
| `--select-separator-position` | `var(--select-arrow-width)` | spacing | Separator offset from the right edge; defaults to the arrow hit-area width. |
| `--select-separator-width` | `1px` | size | Separator width. |
| `--select-separator-height` | `50%` | size | Separator height. |
| `--select-separator-bg` | `linear-gradient(to bottom, transparent 0%, var(--select-border) 20%, var(--select-border) 80%, transparent 100%)` | paint | Separator background. |
| `--select-separator-dark-bg` | `linear-gradient(to bottom, transparent 0%, var(--select-border) 20%, var(--select-border) 80%, transparent 100%)` | paint | Dark-theme separator background. |
| `--select-separator-opacity` | `0.6` | opacity | Separator resting opacity. |
| `--select-separator-active-opacity` | `1` | opacity | Separator hover/focus opacity. |
| `--select-separator-position-with-clear` | `calc(var(--select-arrow-right-with-clear) + var(--select-arrow-width))` | spacing | Separator offset when clear control is visible. |
| `--select-arrow-width` | `42px` | size | Arrow hit area width. |
| `--select-arrow-height` | `auto` | layout | Arrow container height. |
| `--select-arrow-border-radius` | `0 var(--select-radius-md) var(--select-radius-md) 0` | radius | Arrow-side corner radius. |
| `--select-arrow-border-radius-rtl` | `var(--select-radius-md) 0 0 var(--select-radius-md)` | radius | Arrow-side corner radius in RTL layout. |
| `--select-arrow-size` | `18px` | size | Arrow icon size. |
| `--select-arrow-color` | `var(--select-text-muted)` | color | Arrow icon color. |
| `--select-arrow-stroke-width` | `1.5` | size | Arrow icon stroke width. |
| `--select-arrow-hover-bg` | `rgba(15, 52, 96, 0.05)` | color | Arrow hover background. |
| `--select-arrow-hover-color` | `var(--select-accent)` | color | Arrow hover color. |
| `--select-arrow-open-transform` | `rotate(180deg)` | transform | Open-state arrow transform. |
| `--select-arrow-right-with-clear` | `34px` | spacing | Arrow offset when clear control is present. |
| `--select-clear-button-right` | `8px` | spacing | Clear button offset from the right. |
| `--select-clear-button-size` | `26px` | size | Clear button size. |
| `--select-clear-button-border` | `none` | border | Clear button border. |
| `--select-clear-button-radius` | `50%` | radius | Clear button radius. |
| `--select-clear-button-bg` | `transparent` | color | Clear button background. |
| `--select-clear-button-color` | `var(--select-text-muted)` | color | Clear button icon color. |
| `--select-clear-button-hover-bg` | `rgba(233, 69, 96, 0.1)` | color | Clear button hover background. |
| `--select-clear-button-hover-color` | `var(--select-accent-hover)` | color | Clear button hover color. |
| `--select-clear-button-hover-transform` | `translateY(-50%) scale(1.1)` | transform | Clear button hover motion. |
| `--select-clear-button-active-transform` | `translateY(-50%) scale(0.95)` | transform | Clear button pressed motion. |
| `--select-clear-button-focus-outline` | `2px solid var(--select-border-focus)` | outline | Clear button focus outline. |
| `--select-clear-button-focus-offset` | `2px` | spacing | Clear button outline offset. |
| `--select-clear-icon-size` | `14px` | size | Clear icon size. |

## Dropdown and scrolling surface

| Token | Default | Type | Purpose |
| --- | --- | --- | --- |
| `--select-host-z-index` | `auto` | layout | Base stacking level of the host custom element. |
| `--select-host-open-z-index` | `var(--select-dropdown-z-index)` | layout | Host stacking level while the dropdown is open. |
| `--select-ancestor-open-z-index` | `var(--select-host-open-z-index)` | layout | Temporary stacking level applied to lifted ancestor stacking contexts while the dropdown is open. |
| `--select-dropdown-top` | `calc(100% + 6px)` | layout | Dropdown offset below the shell. |
| `--select-dropdown-bottom` | `calc(100% + 6px)` | layout | Dropdown offset above the shell when top placement is active. |
| `--select-dropdown-max-height` | `320px` | size | Dropdown max height. |
| `--select-dropdown-bg` | `var(--select-surface)` | color | Dropdown background. |
| `--select-dropdown-border` | `var(--select-border)` | color | Dropdown border color. |
| `--select-dropdown-border-radius` | `var(--select-radius-lg)` | radius | Dropdown radius. |
| `--select-dropdown-shadow` | `var(--select-shadow-lg)` | shadow | Dropdown shadow. |
| `--select-dropdown-padding` | `6px` | spacing | Outer spacing between the dropdown edge and option rows when `--select-options-padding` is not set. |
| `--select-dropdown-z-index` | `1000` | layout | Dropdown stacking order. |
| `--select-dropdown-scroll-behavior` | `smooth` | layout | Dropdown scroll behavior. |
| `--select-dropdown-transform-origin` | `top center` | layout | Dropdown transform origin. |
| `--select-dropdown-top-transform-origin` | `bottom center` | layout | Dropdown transform origin when top placement is active. |
| `--select-dropdown-animation` | `dropdownEnter 200ms cubic-bezier(0.4, 0, 0.2, 1) forwards` | animation | Dropdown enter animation. |
| `--select-dropdown-enter-from-opacity` | `0` | opacity | Dropdown entry start opacity. |
| `--select-dropdown-enter-from-transform` | `translateY(-8px) scale(0.98)` | transform | Dropdown entry start transform. |
| `--select-dropdown-top-enter-from-transform` | `translateY(8px) scale(0.98)` | transform | Dropdown entry start transform when top placement is active. |
| `--select-dropdown-enter-to-opacity` | `1` | opacity | Dropdown entry end opacity. |
| `--select-dropdown-enter-to-transform` | `translateY(0) scale(1)` | transform | Dropdown entry end transform. |
| `--select-options-max-height` | `320px` | size | Internal options scroller max height. |
| `--select-options-padding` | `6px` | spacing | Options container padding. |
| `--select-options-bg` | `var(--select-surface)` | color | Options container background. |
| `--select-scrollbar-width` | `6px` | size | WebKit scrollbar width. |
| `--select-scrollbar-thumb-radius` | `3px` | radius | WebKit scrollbar thumb radius. |

## Group headers and options

| Token | Default | Type | Purpose |
| --- | --- | --- | --- |
| `--select-group-header-padding` | `10px 12px 6px` | spacing | Group header padding. |
| `--select-group-header-margin` | `0` | spacing | Group header margin. |
| `--select-group-header-weight` | `600` | typography | Group header weight. |
| `--select-group-header-color` | `var(--select-text-muted)` | color | Group header text color. |
| `--select-group-header-bg` | `transparent` | color | Group header background. |
| `--select-group-header-text-align` | `left` | layout | Group header alignment. |
| `--select-group-header-font-size` | `11px` | typography | Group header size. |
| `--select-group-header-text-transform` | `uppercase` | transform | Group header text casing. |
| `--select-group-header-letter-spacing` | `0.08em` | typography | Group header tracking. |
| `--select-group-header-border` | `none` | border | Group header border. |
| `--select-group-header-border-bottom` | `none` | border | Group header bottom border. |
| `--select-group-header-border-radius` | `0` | radius | Group header radius. |
| `--select-group-header-shadow` | `none` | shadow | Group header shadow. |
| `--select-group-header-separator-margin-top` | `8px` | spacing | Gap before later groups. |
| `--select-group-header-separator-padding-top` | `14px` | spacing | Top padding before later groups. |
| `--select-group-header-separator-border-top` | `1px solid var(--select-border)` | border | Divider above later groups. |
| `--select-option-padding` | `10px 14px` | spacing | Option padding. |
| `--select-option-margin` | `2px 0` | spacing | Option spacing. |
| `--select-option-color` | `var(--select-text)` | color | Option text color. |
| `--select-option-bg` | `transparent` | color | Resting option background. |
| `--select-option-border` | `none` | border | Resting option border. |
| `--select-option-font-size` | `14px` | typography | Option text size. |
| `--select-option-font-weight` | `450` | typography | Resting option weight. |
| `--select-option-line-height` | `1.5` | typography | Option line height. |
| `--select-option-text-align` | `start` | typography | Text alignment for option labels in the dropdown. |
| `--select-option-border-radius` | `var(--select-radius-sm)` | radius | Option corner radius. |
| `--select-option-hover-bg` | `var(--select-surface-elevated)` | color | Option hover background. |
| `--select-option-hover-border` | `var(--select-option-border)` | border | Option hover border. |
| `--select-option-hover-border-bottom` | `var(--select-option-border-bottom)` | border | Option hover bottom border. |
| `--select-option-hover-color` | `var(--select-text)` | color | Option hover color. |
| `--select-option-hover-shadow` | `var(--select-option-shadow)` | shadow | Option hover shadow. |
| `--select-option-hover-transform` | `translateX(2px)` | transform | Option hover motion. |
| `--select-option-active-bg` | `var(--select-surface-elevated)` | color | Keyboard-active background. |
| `--select-option-active-color` | `var(--select-option-hover-color)` | color | Keyboard-active text color. |
| `--select-option-active-border` | `var(--select-option-hover-border)` | border | Keyboard-active border. |
| `--select-option-active-outline` | `2px solid rgba(15, 52, 96, 0.3)` | outline | Keyboard-active outline. |
| `--select-option-active-outline-offset` | `-2px` | spacing | Keyboard-active outline offset. |
| `--select-option-active-shadow` | `none` | shadow | Keyboard-active shadow. |
| `--select-option-active-transform` | `none` | transform | Keyboard-active transform. |
| `--select-option-selected-bg` | `linear-gradient(135deg, rgba(15, 52, 96, 0.08) 0%, rgba(15, 52, 96, 0.04) 100%)` | paint | Selected option background. |
| `--select-option-selected-border` | `var(--select-option-border)` | border | Selected option border. |
| `--select-option-selected-color` | `var(--select-accent)` | color | Selected option text color. |
| `--select-option-selected-weight` | `550` | typography | Selected option weight. |
| `--select-option-selected-hover-bg` | `linear-gradient(135deg, rgba(15, 52, 96, 0.12) 0%, rgba(15, 52, 96, 0.06) 100%)` | paint | Selected + hover background. |
| `--select-option-selected-hover-border-bottom` | `var(--select-option-selected-border-bottom)` | border | Selected + hover bottom border. |
| `--select-option-selected-hover-shadow` | `var(--select-option-selected-shadow)` | shadow | Selected + hover shadow. |
| `--select-option-selected-hover-transform` | `var(--select-option-selected-transform)` | transform | Selected + hover transform. |
| `--select-option-selected-hover-border` | `var(--select-option-selected-border)` | border | Selected + hover border. |
| `--select-option-selected-hover-color` | `var(--select-option-selected-color)` | color | Selected + hover text color. |
| `--select-option-selected-active-outline` | `2px solid rgba(15, 52, 96, 0.4)` | outline | Selected + active outline. |
| `--select-option-selected-active-outline-offset` | `-2px` | spacing | Selected + active outline offset. |
| `--select-option-pressed-bg` | `rgba(15, 52, 96, 0.08)` | color | Pressed option background. |
| `--select-option-pressed-transform` | `translateX(2px) scale(0.99)` | transform | Pressed motion for unselected options. |
| `--select-option-selected-pressed-transform` | `scale(0.99)` | transform | Pressed motion for selected options. |
| `--select-option-disabled-bg` | `var(--select-option-bg)` | color | Disabled option background. |
| `--select-option-disabled-color` | `var(--select-text-muted)` | color | Disabled option text color. |
| `--select-option-disabled-border` | `var(--select-option-border)` | border | Disabled option border. |
| `--select-option-disabled-border-bottom` | `var(--select-option-border-bottom)` | border | Disabled option bottom border. |
| `--select-option-disabled-opacity` | `0.5` | opacity | Disabled option opacity. |
| `--select-option-disabled-cursor` | `not-allowed` | cursor | Disabled option cursor. |

### Selected indicator stripe

| Token | Default | Type | Purpose |
| --- | --- | --- | --- |
| `--select-option-selected-indicator-left` | `0` | layout | Horizontal anchor for the selected stripe. |
| `--select-option-selected-indicator-right` | `var(--select-option-selected-indicator-left)` | layout | Horizontal anchor for the selected stripe in RTL layout. |
| `--select-option-selected-indicator-top` | `50%` | layout | Vertical anchor for the selected stripe. |
| `--select-option-selected-indicator-transform` | `translateY(-50%)` | transform | Centering transform for the selected stripe. |
| `--select-option-selected-indicator-width` | `3px` | size | Selected stripe width. |
| `--select-option-selected-indicator-height` | `60%` | size | Selected stripe height. |
| `--select-option-selected-indicator-bg` | `var(--select-accent)` | color | Selected stripe color. |
| `--select-option-selected-indicator-radius` | `0 2px 2px 0` | radius | Selected stripe radius. |
| `--select-option-selected-indicator-radius-rtl` | `2px 0 0 2px` | radius | Selected stripe radius in RTL layout. |
| `--select-option-selected-indicator-animation` | `selectedIndicator 200ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards` | animation | Selected stripe entry animation. |
| `--select-option-selected-indicator-from-height` | `0` | size | Selected stripe animation start height. |
| `--select-option-selected-indicator-to-height` | `60%` | size | Selected stripe animation end height. |
| `--select-option-selected-indicator-from-opacity` | `0` | opacity | Selected stripe animation start opacity. |
| `--select-option-selected-indicator-to-opacity` | `1` | opacity | Selected stripe animation end opacity. |

## Buttons and feedback states

| Token | Default | Type | Purpose |
| --- | --- | --- | --- |
| `--select-load-more-padding` | `12px` | spacing | Load-more container padding. |
| `--select-button-padding` | `10px 20px` | spacing | Load-more button padding. |
| `--select-button-border` | `1.5px solid var(--select-border)` | border | Load-more button border. |
| `--select-button-bg` | `transparent` | color | Load-more button background. |
| `--select-button-color` | `var(--select-accent)` | color | Load-more button text color. |
| `--select-button-border-radius` | `var(--select-radius-md)` | radius | Load-more button radius. |
| `--select-button-font-size` | `13px` | typography | Load-more button size. |
| `--select-button-font-weight` | `550` | typography | Load-more button weight. |
| `--select-button-letter-spacing` | `0.02em` | typography | Load-more button tracking. |
| `--select-button-hover-bg` | `var(--select-accent)` | color | Load-more button hover background. |
| `--select-button-hover-color` | `white` | color | Load-more button hover color. |
| `--select-button-hover-transform` | `translateY(-1px)` | transform | Load-more button hover motion. |
| `--select-button-active-transform` | `translateY(0) scale(0.98)` | transform | Load-more button pressed motion. |
| `--select-button-disabled-opacity` | `0.5` | opacity | Disabled load-more button opacity. |
| `--select-busy-padding` | `20px` | spacing | Busy state padding. |
| `--select-busy-color` | `var(--select-text-muted)` | color | Busy state text color. |
| `--select-busy-bg` | `transparent` | color | Busy state background. |
| `--select-busy-font-size` | `13px` | typography | Busy state text size. |
| `--select-spinner-size` | `22px` | size | Spinner diameter. |
| `--select-spinner-border` | `2px solid var(--select-border)` | border | Spinner ring border. |
| `--select-spinner-active-color` | `var(--select-accent)` | color | Spinner active segment color. |
| `--select-spinner-animation` | `spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite` | animation | Spinner motion. |
| `--select-empty-padding` | `32px 24px` | spacing | Empty-state padding. |
| `--select-empty-color` | `var(--select-text-muted)` | color | Empty-state text color. |
| `--select-empty-font-size` | `14px` | typography | Empty-state text size. |
| `--select-empty-bg` | `transparent` | color | Empty-state background. |
| `--select-empty-gap` | `8px` | spacing | Empty-state child gap. |
| `--select-searching-padding` | `32px 24px` | spacing | Searching-state padding. |
| `--select-searching-color` | `var(--select-accent)` | color | Searching-state text color. |
| `--select-searching-font-size` | `14px` | typography | Searching-state text size. |
| `--select-searching-bg` | `transparent` | color | Searching-state background. |
| `--select-searching-gap` | `8px` | spacing | Searching-state child gap. |
| `--select-searching-spinner-size` | `24px` | size | Searching indicator diameter. |
| `--select-searching-spinner-border` | `2px solid var(--select-border)` | border | Searching indicator ring border. |
| `--select-searching-spinner-active-color` | `var(--select-accent)` | color | Searching indicator active segment color. |
| `--select-searching-spinner-animation` | `var(--select-spinner-animation)` | animation | Searching indicator motion. |

## Error, accessibility, and motion

| Token | Default | Type | Purpose |
| --- | --- | --- | --- |
| `--select-error-border` | `#e94560` | color | Invalid-state border color. |
| `--select-error-shadow` | `rgba(233, 69, 96, 0.15)` | color | Invalid-state focus glow color. |
| `--select-reduced-motion-duration` | `0.01ms` | timing | Reduced-motion duration override. |
| `--select-reduced-motion-iteration-count` | `1` | number | Reduced-motion animation iteration override. |
| `--select-high-contrast-border-width` | `2px` | size | High-contrast border width. |
| `--select-high-contrast-indicator-width` | `4px` | size | High-contrast selected indicator width. |
| `--select-high-contrast-focus-outline-width` | `3px` | size | High-contrast focus outline width. |
| `--select-high-contrast-focus-outline-color` | `Highlight` | color | High-contrast focus outline color. |
| `--select-touch-target-min-height` | `44px` | size | Minimum touch target height. |

## Dark mode

Dark mode is activated through host and ancestor selectors such as `.dark`, `.dark-mode`, `data-theme="dark"`, and `theme="dark"`.

Instead of switching to a second styling API, dark mode re-seeds the same token surface:

- Palette and elevation tokens: `--select-primary`, `--select-primary-light`, `--select-accent`, `--select-accent-hover`, `--select-surface`, `--select-surface-elevated`, `--select-border`, `--select-border-focus`, `--select-text`, `--select-text-muted`, `--select-text-placeholder`, `--select-shadow-sm`, `--select-shadow-md`, `--select-shadow-lg`, `--select-shadow-focus`
- State tokens: `--select-option-bg`, `--select-option-color`, `--select-option-hover-bg`, `--select-option-hover-color`, `--select-option-selected-bg`, `--select-option-selected-color`, `--select-option-selected-hover-bg`, `--select-option-selected-hover-color`, `--select-badge-dark-bg`, `--select-separator-dark-bg`

## Example overrides

```css
enhanced-select.brand-theme {
  --select-accent: #1d4ed8;
  --select-border-focus: #1d4ed8;
  --select-badge-bg: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
  --select-badge-remove-hover-bg: rgba(29, 78, 216, 0.22);
  --select-dropdown-shadow: 0 20px 45px rgba(37, 99, 235, 0.18);
  --select-option-selected-bg: rgba(37, 99, 235, 0.12);
  --select-option-selected-color: #1d4ed8;
}

enhanced-select.motion-light {
  --select-transition-fast: 120ms ease;
  --select-transition-bounce: 160ms ease;
  --select-badge-animation: none;
  --select-dropdown-animation: none;
  --select-option-hover-transform: none;
}

enhanced-select.comfortable {
  --select-input-min-height: 56px;
  --select-badge-min-height: 30px;
  --select-option-padding: 12px 16px;
  --select-touch-target-min-height: 48px;
}
```
