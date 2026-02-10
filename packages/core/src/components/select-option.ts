/**
 * Independent Option Component
 * High cohesion, low coupling - handles its own selection state and events
 */

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
  /** Show remove button (for multi-select) */
  showRemoveButton?: boolean;
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
      }
      
      .option-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        cursor: pointer;
        user-select: none;
        transition: background-color 0.2s ease;
      }
      
      .option-container:hover {
        background-color: var(--select-option-hover-bg, #f0f0f0);
      }
      
      .option-container.selected {
        background-color: var(--select-option-selected-bg, #e3f2fd);
        color: var(--select-option-selected-color, #1976d2);
      }
      
      .option-container.active {
        outline: 2px solid var(--select-option-active-outline, #1976d2);
        outline-offset: -2px;
      }
      
      .option-container.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
      }
      
      .option-content {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .remove-button {
        margin-left: 8px;
        padding: 2px 6px;
        border: none;
        background-color: var(--select-remove-btn-bg, transparent);
        color: var(--select-remove-btn-color, #666);
        cursor: pointer;
        border-radius: 3px;
        font-size: 16px;
        line-height: 1;
        transition: all 0.2s ease;
      }
      
      .remove-button:hover {
        background-color: var(--select-remove-btn-hover-bg, #ffebee);
        color: var(--select-remove-btn-hover-color, #c62828);
      }
      
      .remove-button:focus {
        outline: 2px solid var(--select-remove-btn-focus-outline, #1976d2);
        outline-offset: 2px;
      }
    `;
    this._shadow.appendChild(style);
  }

  private _render(): void {
    const { item, index, selected, disabled, active, render, showRemoveButton } = this._config;
    
    // Clear container
    this._container.innerHTML = '';
    
    // Apply state classes
    this._container.classList.toggle('selected', selected);
    this._container.classList.toggle('disabled', disabled || false);
    this._container.classList.toggle('active', active || false);
    
    // Custom class name
    if (this._config.className) {
      this._container.className += ' ' + this._config.className;
    }
    
    // Apply custom styles
    if (this._config.style) {
      Object.assign(this._container.style, this._config.style);
    }
    
    // Render content
    const contentDiv = document.createElement('div');
    contentDiv.className = 'option-content';
    
    if (render) {
      const rendered = render(item, index);
      if (typeof rendered === 'string') {
        contentDiv.innerHTML = rendered;
      } else {
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
      this._removeButton.innerHTML = '×';
      this._removeButton.setAttribute('aria-label', 'Remove option');
      this._removeButton.setAttribute('type', 'button');
      this._container.appendChild(this._removeButton);
    }
    
    // Set ARIA attributes
    this.setAttribute('role', 'option');
    this.setAttribute('aria-selected', String(selected));
    if (disabled) this.setAttribute('aria-disabled', 'true');
    this.id = this._config.id || `select-option-${index}`;
  }

  private _attachEventListeners(): void {
    // Click handler for selection
    this._container.addEventListener('click', (e) => {
      // Don't trigger selection if clicking remove button
      if (e.target === this._removeButton) {
        return;
      }
      
      if (!this._config.disabled) {
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
      if (this._config.disabled) return;
      
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
    this._config.active = active;
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
