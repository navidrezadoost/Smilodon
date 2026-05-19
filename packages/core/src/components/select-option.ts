/**
 * Independent Option Component
 * High cohesion, low coupling - handles its own selection state and events
 */

import type { DisabledOptionBehaviorConfig } from '../config/global-config';
import { ClassMap } from '../types';

export interface OptionConfig {
  /** The data item this option represents */
  item: unknown;
  /** The index of this option */
  index: number;
  /** Optional custom id for aria-activedescendant */
  id?: string;
  /** Whether this option is selected */
  selected: boolean;
  /** Whether this option is disabled */
  disabled?: boolean;
  /** Behavior overrides for visually disabled options */
  disabledBehavior?: DisabledOptionBehaviorConfig;
  /** Whether this option is focused/active */
  active?: boolean;
  /** Custom value accessor */
  getValue?: (item: unknown) => unknown;
  /** Custom label accessor */
  getLabel?: (item: unknown) => string;
  /** Custom renderer */
  render?: (item: unknown, index: number) => HTMLElement | string;
  /** Custom style */
  style?: Partial<CSSStyleDeclaration>;
  /** Custom class names */
  className?: string;
  /** Class map for state classes */
  classMap?: ClassMap;
  /** Show remove button (for multi-select) */
  showRemoveButton?: boolean;
  /** Custom icon/markup for the remove button */
  removeButtonIcon?: string;
}

export interface OptionEventDetail {
  item: unknown;
  index: number;
  value: unknown;
  label: string;
  selected: boolean;
}

export class SelectOption extends HTMLElement {
  private _config: OptionConfig;
  private _shadow: ShadowRoot;
  private _container: HTMLElement;
  private _removeButton?: HTMLButtonElement;

  constructor(config: OptionConfig) {
    super();
    this._config = config;
    this._shadow = this.attachShadow({ mode: 'open' });
    this._container = document.createElement('div');
    this._container.className = 'option-container';
    
    this._initializeStyles();
    this._render();
    this._attachEventListeners();
    
    this._shadow.appendChild(this._container);
  }

  private _initializeStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        position: relative;
        font: inherit;
        color: var(--select-option-color, var(--select-text-color, #1f2937));
        background: var(--select-option-bg, var(--select-dropdown-bg, var(--select-bg, white)));
        border: var(--select-option-border, none);
        border-bottom: var(--select-option-border-bottom, none);
        border-radius: var(--select-option-border-radius, var(--select-radius-sm, 6px));
        box-shadow: var(--select-option-shadow, none);
        transform: var(--select-option-transform, none);
        transition: var(--select-option-transition, background-color 0.2s ease);
      }

      :host(:hover):not(.smilodon-option--disabled):not([aria-disabled="true"]),
      :host(.smilodon-option--disabled-hoverable:hover) {
        background: var(--select-option-hover-bg, #f0f0f0);
        color: var(--select-option-hover-color, var(--select-option-color, var(--select-text-color, #1f2937)));
        border: var(--select-option-hover-border, var(--select-option-border, none));
        border-bottom: var(--select-option-hover-border-bottom, var(--select-option-border-bottom, none));
        box-shadow: var(--select-option-hover-shadow, var(--select-option-shadow, none));
        transform: var(--select-option-hover-transform, var(--select-option-transform, none));
      }

      /* Keep the visual surface on the host so external utility classes applied
         through classMap can override selected/active/disabled styles in both
         light and dark themes. */
      :host([aria-selected="true"]),
      :host(.smilodon-option--selected) {
        background: var(--select-option-selected-bg, #e3f2fd);
        color: var(--select-option-selected-color, #1976d2);
        border: var(--select-option-selected-border, var(--select-option-border, none));
        border-bottom: var(--select-option-selected-border-bottom, var(--select-option-border-bottom, none));
        border-radius: var(--select-option-selected-border-radius, var(--select-option-border-radius, 0));
        box-shadow: var(--select-option-selected-shadow, var(--select-option-shadow, none));
        transform: var(--select-option-selected-transform, var(--select-option-transform, none));
      }

      :host([aria-selected="true"]:hover),
      :host(.smilodon-option--selected:hover) {
        background: var(--select-option-selected-hover-bg, var(--select-option-selected-bg, #e3f2fd));
        color: var(--select-option-selected-hover-color, var(--select-option-selected-color, #1976d2));
        border: var(--select-option-selected-hover-border, var(--select-option-selected-border, var(--select-option-border, none)));
        border-bottom: var(--select-option-selected-hover-border-bottom, var(--select-option-selected-border-bottom, var(--select-option-border-bottom, none)));
        box-shadow: var(--select-option-selected-hover-shadow, var(--select-option-selected-shadow, var(--select-option-shadow, none)));
        transform: var(--select-option-selected-hover-transform, var(--select-option-selected-transform, var(--select-option-transform, none)));
      }

      :host(.smilodon-option--active):not(.smilodon-option--disabled):not([aria-disabled="true"]),
      :host(.smilodon-option--active.smilodon-option--disabled-focusable) {
        background: var(--select-option-active-bg, var(--select-option-hover-bg, #f0f0f0));
        color: var(--select-option-active-color, var(--select-option-hover-color, var(--select-option-color, var(--select-text-color, #1f2937))));
        border: var(--select-option-active-border, var(--select-option-hover-border, var(--select-option-border, none)));
        box-shadow: var(--select-option-active-shadow, var(--select-option-shadow, none));
        transform: var(--select-option-active-transform, var(--select-option-transform, none));
        outline: var(--select-option-active-outline, none);
        outline-offset: var(--select-option-active-outline-offset, -2px);
      }

      :host(.smilodon-option--disabled),
      :host([aria-disabled="true"]) {
        background: var(--select-option-disabled-bg, var(--select-option-bg, var(--select-dropdown-bg, var(--select-bg, white))));
        color: var(--select-option-disabled-color, var(--select-option-color, var(--select-text-color, #1f2937)));
        border: var(--select-option-disabled-border, var(--select-option-border, none));
        border-bottom: var(--select-option-disabled-border-bottom, var(--select-option-border-bottom, none));
        opacity: var(--select-option-disabled-opacity, 0.5);
        cursor: var(--select-option-disabled-cursor, not-allowed);
        pointer-events: none;
      }

      :host(.smilodon-option--disabled-interactive) {
        pointer-events: auto;
      }
      
      .option-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--select-option-padding, 10px 14px);
        cursor: pointer;
        user-select: none;
        color: inherit;
        background: inherit;
        transition: inherit;
        border: inherit;
        border-bottom: inherit;
        border-radius: inherit;
        box-shadow: inherit;
        transform: inherit;
        font: inherit;
      }
      
      .option-container:hover {
        background: inherit;
        color: inherit;
        border: inherit;
        border-bottom: inherit;
        box-shadow: inherit;
        transform: inherit;
      }
      
      .option-container.selected {
        background: inherit;
        color: inherit;
        border: inherit;
        border-bottom: inherit;
        border-radius: inherit;
        box-shadow: inherit;
        transform: inherit;
      }

      .option-container.selected:hover {
        background: inherit;
        color: inherit;
        border: inherit;
        border-bottom: inherit;
        box-shadow: inherit;
        transform: inherit;
      }
      
      .option-container.active:not(.disabled) {
        background: inherit;
        color: inherit;
        border: inherit;
        box-shadow: inherit;
        transform: inherit;
        outline: none;
        outline-offset: 0;
      }
      
      .option-container.disabled {
        background: inherit;
        color: inherit;
        border: inherit;
        border-bottom: inherit;
        opacity: inherit;
        cursor: inherit;
        pointer-events: none;
      }
      
      .option-content {
        flex: 1;
        overflow: var(--select-option-content-overflow, hidden);
        text-overflow: var(--select-option-content-text-overflow, ellipsis);
        white-space: var(--select-option-content-white-space, nowrap);
      }

      .checkmark-icon {
        display: none;
        margin-left: var(--select-checkmark-margin-left, 8px);
        color: var(--select-checkmark-color, currentColor);
      }

      :host([dir="rtl"]) .checkmark-icon,
      :host-context([dir="rtl"]) .checkmark-icon {
        margin-left: 0;
        margin-right: var(--select-checkmark-margin-left, 8px);
      }

      :host([aria-selected="true"]) .checkmark-icon,
      .option-container.selected .checkmark-icon {
        display: inline-flex;
      }
      
      .remove-button {
        margin-left: 8px;
        width: var(--select-badge-remove-size, 18px);
        height: var(--select-badge-remove-size, 18px);
        min-width: var(--select-badge-remove-min-width, var(--select-badge-remove-size, 18px));
        min-height: var(--select-badge-remove-min-height, var(--select-badge-remove-size, 18px));
        padding: 0;
        border: none;
        background-color: var(--select-badge-remove-bg, rgba(255, 255, 255, 0.2));
        color: var(--select-badge-remove-color, currentColor);
        cursor: pointer;
        border-radius: var(--select-badge-remove-radius, 50%);
        font-size: var(--select-badge-remove-font-size, 0.7333em);
        font-weight: var(--select-badge-remove-font-weight, 600);
        line-height: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      :host([dir="rtl"]) .remove-button,
      :host-context([dir="rtl"]) .remove-button {
        margin-left: 0;
        margin-right: 8px;
      }

      .remove-button-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: var(--select-badge-remove-icon-size, 10px);
        height: var(--select-badge-remove-icon-size, 10px);
        color: var(--select-badge-remove-icon-color, currentColor);
        font-size: var(--select-badge-remove-icon-font-size, inherit);
        line-height: var(--select-badge-remove-icon-line-height, 1);
        transform: var(--select-badge-remove-icon-transform, none);
        opacity: var(--select-badge-remove-icon-opacity, 1);
        pointer-events: none;
      }

      .remove-button-icon svg {
        width: 100%;
        height: 100%;
        display: block;
      }
      
      .remove-button:hover {
        background-color: var(--select-badge-remove-hover-bg, #ffebee);
        color: var(--select-badge-remove-hover-color, #c62828);
      }
      
      .remove-button:focus {
        outline: 2px solid var(--select-remove-btn-focus-outline, #1976d2);
        outline-offset: 2px;
      }
    `;
    this._shadow.appendChild(style);
  }

  private _getDisabledBehavior(): Required<DisabledOptionBehaviorConfig> {
    const behavior = this._config.disabledBehavior ?? {};
    return {
      selectable: behavior.selectable === true,
      hoverable: behavior.hoverable === true,
      focusable: behavior.focusable === true,
    };
  }

  private _isDisabledSelectionBlocked(): boolean {
    return Boolean(this._config.disabled) && !this._getDisabledBehavior().selectable;
  }

  private _render(): void {
    const { item, index, selected, disabled, active, render, showRemoveButton, classMap } = this._config;
    const disabledBehavior = this._getDisabledBehavior();
    
    // Clear container
    this._container.innerHTML = '';
    
    // Add part attribute
    this._container.setAttribute('part', 'option');

    // Standard styling hook
    this._container.classList.add('smilodon-option');

    // Apply state classes using classMap or defaults
    const selectedClasses = (classMap?.selected ?? 'selected sm-selected').split(' ').filter(Boolean);
    const activeClasses = (classMap?.active ?? 'active sm-active').split(' ').filter(Boolean);
    const disabledClasses = (classMap?.disabled ?? 'disabled sm-disabled').split(' ').filter(Boolean);

    // Apply classes to both the container (internal styling) and the host (external styling/::part)
    // This ensures that utility classes are visible via ::part selectors
    const toggleClasses = (element: Element, classes: string[], add: boolean) => {
      if (add) {
        element.classList.add(...classes);
      } else {
        element.classList.remove(...classes);
      }
    };

    if (selected) {
      toggleClasses(this._container, [...selectedClasses, 'smilodon-option--selected'], true);
      toggleClasses(this, [...selectedClasses, 'smilodon-option--selected'], true);
    } else {
      toggleClasses(this._container, [...selectedClasses, 'smilodon-option--selected'], false);
      toggleClasses(this, [...selectedClasses, 'smilodon-option--selected'], false);
    }

     if (active && (!disabled || disabledBehavior.focusable)) {
       toggleClasses(this._container, [...activeClasses, 'smilodon-option--active'], true);
       toggleClasses(this, [...activeClasses, 'smilodon-option--active'], true); // Make focus ring visible on host
    } else {
      toggleClasses(this._container, [...activeClasses, 'smilodon-option--active'], false);
      toggleClasses(this, [...activeClasses, 'smilodon-option--active'], false);
    }

    if (disabled) {
       toggleClasses(this._container, [...disabledClasses, 'smilodon-option--disabled'], true);
       toggleClasses(this, [...disabledClasses, 'smilodon-option--disabled'], true);
    } else {
       toggleClasses(this._container, [...disabledClasses, 'smilodon-option--disabled'], false);
       toggleClasses(this, [...disabledClasses, 'smilodon-option--disabled'], false);
    }

    const interactiveDisabled = Boolean(disabled && (disabledBehavior.hoverable || disabledBehavior.selectable));
    const toggleBehaviorClass = (className: string, add: boolean) => {
      toggleClasses(this._container, [className], add);
      toggleClasses(this, [className], add);
    };

    toggleBehaviorClass('smilodon-option--disabled-interactive', interactiveDisabled);
    toggleBehaviorClass('smilodon-option--disabled-hoverable', Boolean(disabled && disabledBehavior.hoverable));
    toggleBehaviorClass('smilodon-option--disabled-focusable', Boolean(disabled && disabledBehavior.focusable));
    toggleBehaviorClass('smilodon-option--disabled-selectable', Boolean(disabled && disabledBehavior.selectable));
    
    // Custom class name
    if (this._config.className) {

      const classes = this._config.className.split(' ').filter(Boolean);
      this._container.classList.add(...classes);
    }
    
    // Apply custom styles
    if (this._config.style) {
      Object.assign(this._container.style, this._config.style);
    }
    
    // Render content
    const contentDiv = document.createElement('div');
    contentDiv.className = 'option-content';
    // contentDiv.setAttribute('part', 'option-content'); // Optional
    
    if (render) {
      const rendered = render(item, index);
      if (typeof rendered === 'string') {
        contentDiv.innerHTML = rendered;
      } else if (rendered instanceof HTMLElement) {
        contentDiv.appendChild(rendered);
      }
    } else {
      const label = this._getLabel();
      contentDiv.textContent = label;
    }
    
    this._container.appendChild(contentDiv);
    
    // Add remove button if needed
    if (showRemoveButton && selected) {
      this._removeButton = document.createElement('button');
      this._removeButton.className = 'remove-button';
      this._removeButton.setAttribute('part', 'chip-remove');
      this._removeButton.setAttribute('aria-label', 'Remove option');
      this._removeButton.setAttribute('type', 'button');

      const removeIcon = document.createElement('span');
      removeIcon.className = 'remove-button-icon';
      removeIcon.setAttribute('part', 'chip-remove-icon');
      const iconMarkup = this._config.removeButtonIcon && this._config.removeButtonIcon.trim()
        ? this._config.removeButtonIcon
        : '×';
      if (iconMarkup.trim().startsWith('<')) {
        removeIcon.innerHTML = iconMarkup;
      } else {
        removeIcon.textContent = iconMarkup;
      }
      this._removeButton.appendChild(removeIcon);

      this._container.appendChild(this._removeButton);
    }
    
    // Set ARIA attributes and State attributes on Host
    this.setAttribute('role', 'option');
    this.setAttribute('aria-selected', String(selected));
    if (disabled && !disabledBehavior.selectable) {
      this.setAttribute('aria-disabled', 'true');
    } else {
      this.removeAttribute('aria-disabled');
    }
    this.id = this._config.id || `select-option-${index}`;

    // Add checkmark (part="checkmark") - standard for object mode
    // Only show if NOT showing remove button (avoid clutter)
    if (!showRemoveButton) {
        const checkmark = document.createElement('div');
        checkmark.setAttribute('part', 'checkmark');
        checkmark.className = 'checkmark-icon';
        checkmark.innerHTML = `
          <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:1em;height:1em;">
            <path d="M4 8.5L6.5 11L12 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
        this._container.appendChild(checkmark);
    }

    // Data Attributes Contract on Host
    const state = [];
    if (selected) state.push('selected');
    if (active && (!disabled || disabledBehavior.focusable)) state.push('active');
    if (state.length) {
      this.dataset.smState = state.join(' ');
    } else {
      delete this.dataset.smState;
    }
    
    this.dataset.smIndex = String(index);
    if (!this.hasAttribute('data-sm-selectable')) {
        this.toggleAttribute('data-sm-selectable', true);
    }
  }

  private _attachEventListeners(): void {
    // Click handler for selection
    this._container.addEventListener('click', (e) => {
      // Don't trigger selection if clicking remove button
      if (e.target === this._removeButton) {
        return;
      }
      
      if (!this._isDisabledSelectionBlocked()) {
        this._handleSelect();
      }
    });
    
    // Remove button handler
    if (this._removeButton) {
      this._removeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this._handleRemove();
      });
    }
    
    // Keyboard handler
    this.addEventListener('keydown', (e) => {
      if (this._isDisabledSelectionBlocked()) return;
      
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this._handleSelect();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (this._config.selected && this._config.showRemoveButton) {
          e.preventDefault();
          this._handleRemove();
        }
      }
    });
  }

  private _handleSelect(): void {
    const detail: OptionEventDetail = {
      item: this._config.item,
      index: this._config.index,
      value: this._getValue(),
      label: this._getLabel(),
      selected: !this._config.selected,
    };
    
    this.dispatchEvent(new CustomEvent('optionSelect', {
      detail,
      bubbles: true,
      composed: true,
    }));
  }

  private _handleRemove(): void {
    const detail: OptionEventDetail = {
      item: this._config.item,
      index: this._config.index,
      value: this._getValue(),
      label: this._getLabel(),
      selected: false,
    };
    
    this.dispatchEvent(new CustomEvent('optionRemove', {
      detail,
      bubbles: true,
      composed: true,
    }));
  }

  private _getValue(): unknown {
    if (this._config.getValue) {
      return this._config.getValue(this._config.item);
    }
    return (this._config.item as any)?.value ?? this._config.item;
  }

  private _getLabel(): string {
    if (this._config.getLabel) {
      return this._config.getLabel(this._config.item);
    }
    return (this._config.item as any)?.label ?? String(this._config.item);
  }

  /**
   * Update option configuration and re-render
   */
  updateConfig(updates: Partial<OptionConfig>): void {
    this._config = { ...this._config, ...updates };
    this._render();
    this._attachEventListeners();
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<OptionConfig> {
    return this._config;
  }

  /**
   * Get option value
   */
  getValue(): unknown {
    return this._getValue();
  }

  /**
   * Get option label
   */
  getLabel(): string {
    return this._getLabel();
  }

  /**
   * Set selected state
   */
  setSelected(selected: boolean): void {
    this._config.selected = selected;
    this._render();
  }

  /**
   * Set active state
   */
  setActive(active: boolean): void {
    this._config.active = active && (!this._config.disabled || this._getDisabledBehavior().focusable);
    this._render();
  }

  /**
   * Set disabled state
   */
  setDisabled(disabled: boolean): void {
    this._config.disabled = disabled;
    this._render();
  }
}

// Register custom element
if (!customElements.get('select-option')) {
  customElements.define('select-option', SelectOption);
}
