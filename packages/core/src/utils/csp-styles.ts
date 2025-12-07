/**
 * CSP-compliant styling utilities.
 * No inline styles or runtime style tag injection.
 * Uses CSS custom properties and class names only.
 */

/**
 * Apply CSS classes to an element (CSP-safe).
 */
export function applyClasses(element: HTMLElement, classes: string[]): void {
  element.className = classes.filter(Boolean).join(' ');
}

/**
 * Toggle a CSS class (CSP-safe).
 */
export function toggleClass(element: HTMLElement, className: string, force?: boolean): void {
  element.classList.toggle(className, force);
}

/**
 * Set CSS custom properties (CSP-safe dynamic styling).
 * All properties must start with -- (CSS variables).
 * 
 * @example
 * setCustomProperties(element, {
 *   '--item-height': '48px',
 *   '--selected-bg': '#0066cc'
 * });
 */
export function setCustomProperties(
  element: HTMLElement,
  properties: Record<string, string>
): void {
  for (const [key, value] of Object.entries(properties)) {
    if (!key.startsWith('--')) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `[NativeSelect CSP] Custom property must start with --: "${key}". Skipping.`
        );
      }
      continue;
    }
    element.style.setProperty(key, value);
  }
}

/**
 * Get a CSS custom property value.
 */
export function getCustomProperty(element: HTMLElement, propertyName: string): string {
  return getComputedStyle(element).getPropertyValue(propertyName).trim();
}

/**
 * Remove a CSS custom property.
 */
export function removeCustomProperty(element: HTMLElement, propertyName: string): void {
  element.style.removeProperty(propertyName);
}

/**
 * Predefined theme as CSS custom properties.
 * Can be overridden by consumers via CSS.
 */
export const defaultTheme = {
  '--ns-item-height': '40px',
  '--ns-item-padding': '8px 12px',
  '--ns-item-bg': 'transparent',
  '--ns-item-hover-bg': 'rgba(0, 0, 0, 0.05)',
  '--ns-item-selected-bg': 'rgba(0, 102, 204, 0.1)',
  '--ns-item-active-bg': 'rgba(0, 102, 204, 0.2)',
  '--ns-item-color': 'inherit',
  '--ns-item-selected-color': '#0066cc',
  '--ns-border-color': '#ccc',
  '--ns-border-radius': '4px',
  '--ns-focus-outline': '2px solid #0066cc',
  '--ns-font-size': '14px',
  '--ns-font-family': 'system-ui, -apple-system, sans-serif'
};

/**
 * Apply the default theme to an element.
 */
export function applyDefaultTheme(element: HTMLElement): void {
  setCustomProperties(element, defaultTheme);
}

/**
 * Static CSS for shadow DOM (no runtime injection).
 * This CSS is CSP-safe because it's defined at build time as a string constant,
 * not generated at runtime.
 */
export const shadowDOMStyles = `
:host {
  display: block;
  box-sizing: border-box;
  font-family: var(--ns-font-family, system-ui, -apple-system, sans-serif);
  font-size: var(--ns-font-size, 14px);
}

* {
  box-sizing: border-box;
}

.ns-list {
  position: relative;
  overflow: auto;
  max-height: var(--ns-max-height, 300px);
  border: 1px solid var(--ns-border-color, #ccc);
  border-radius: var(--ns-border-radius, 4px);
  background: var(--ns-bg, white);
  outline: none;
}

.ns-list:focus {
  outline: var(--ns-focus-outline, 2px solid #0066cc);
  outline-offset: -2px;
}

.ns-item {
  padding: var(--ns-item-padding, 8px 12px);
  min-height: var(--ns-item-height, 40px);
  color: var(--ns-item-color, inherit);
  background: var(--ns-item-bg, transparent);
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  transition: background-color 0.15s ease;
}

.ns-item:hover {
  background: var(--ns-item-hover-bg, rgba(0, 0, 0, 0.05));
}

.ns-item[aria-selected="true"] {
  background: var(--ns-item-selected-bg, rgba(0, 102, 204, 0.1));
  color: var(--ns-item-selected-color, #0066cc);
}

.ns-item[data-active="true"] {
  background: var(--ns-item-active-bg, rgba(0, 102, 204, 0.2));
}

.ns-item[aria-disabled="true"] {
  opacity: 0.5;
  cursor: not-allowed;
}

.ns-viewport {
  position: relative;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.ns-spacer {
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  pointer-events: none;
}

/* Screen reader only */
.ns-sr-only {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

/* Portal mode (teleported outside shadow DOM) */
.ns-portal {
  position: fixed;
  z-index: var(--ns-portal-z-index, 9999);
}

/* CSP warning banner (only shown in development) */
.ns-csp-warning {
  padding: 8px;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  color: #856404;
  font-size: 12px;
  margin-bottom: 8px;
}
`;

/**
 * Inject static styles into shadow root (CSP-safe).
 * Only called once during component initialization.
 */
export function injectShadowStyles(shadowRoot: ShadowRoot): void {
  const style = document.createElement('style');
  style.textContent = shadowDOMStyles;
  shadowRoot.appendChild(style);
}

/**
 * Check if element has overflow:hidden ancestors (portal fallback detection).
 */
export function hasOverflowHiddenAncestor(element: HTMLElement): boolean {
  let current: HTMLElement | null = element.parentElement;
  
  while (current && current !== document.body) {
    const overflow = getComputedStyle(current).overflow;
    if (overflow === 'hidden' || overflow === 'clip') {
      return true;
    }
    current = current.parentElement;
  }
  
  return false;
}

/**
 * Runtime warning for CSP violations (development only).
 */
export function warnCSPViolation(feature: string, fallback: string): void {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `[NativeSelect CSP] Feature "${feature}" blocked by Content Security Policy. ` +
      `Falling back to "${fallback}".`
    );
  }
}
