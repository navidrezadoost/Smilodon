/**
 * Enhanced Select Component
 * Implements all advanced features: infinite scroll, load more, busy state, 
 * server-side selection, and full customization
 */

import type { GlobalSelectConfig } from '../config/global-config';
import { selectConfig } from '../config/global-config';
import type { SelectEventName, SelectEventsDetailMap, GroupedItem, RendererHelpers, ClassMap } from '../types';
import type { OptionRenderer as OptionRendererFn } from '../renderers/contracts';
import { SelectOption } from './select-option';

interface PageCache {
  [page: number]: unknown[];
}

interface SelectState {
  isOpen: boolean;
  isBusy: boolean;
  isSearching: boolean;
  currentPage: number;
  totalPages: number;
  selectedIndices: Set<number>;
  selectedItems: Map<number, unknown>;
  activeIndex: number;
  searchQuery: string;
  loadedItems: unknown[];
  groupedItems: GroupedItem[];
  preserveScrollPosition: boolean;
  lastScrollPosition: number;
  lastNotifiedQuery: string | null;
  lastNotifiedResultCount: number;
  isExpanded: boolean;
}

export class EnhancedSelect extends HTMLElement {
  private _config: GlobalSelectConfig;
  private _shadow: ShadowRoot;
  private _container: HTMLElement;
  private _inputContainer: HTMLElement;
  private _input: HTMLInputElement;
  private _dropdown: HTMLElement;
  private _optionsContainer: HTMLElement;
  private _loadMoreTrigger?: HTMLElement;
  private _busyBucket?: HTMLElement;
  private _liveRegion?: HTMLElement;
  private _state: SelectState;
  private _pageCache: PageCache = {};
  private _resizeObserver?: ResizeObserver;
  private _intersectionObserver?: IntersectionObserver;
  private _busyTimeout?: number;
  private _searchTimeout?: number;
  private _typeBuffer = '';
  private _typeTimeout?: number;
  private _uniqueId: string;
  private _hasError = false;
  private _errorMessage = '';
  private _boundArrowClick: ((e: Event) => void) | null = null;
  private _arrowContainer?: HTMLElement;
  private _clearControl?: HTMLButtonElement;
  private _clearControlIcon?: HTMLElement;
  private _pendingFirstRenderMark = false;
  private _pendingSearchRenderMark = false;
  private _rangeAnchorIndex: number | null = null;
  private _optionRenderer?: OptionRendererFn;
  private _classMap?: ClassMap;
  private _rendererHelpers: RendererHelpers;
  private _customOptionBoundElements = new WeakSet<HTMLElement>();
  private _mirrorGlobalStylesForCustomOptions = false;
  private _globalStylesObserver: MutationObserver | null = null;
  private _globalStylesContainer: HTMLElement | null = null;

  get classMap(): ClassMap | undefined {
    return this._classMap;
  }

  set classMap(map: ClassMap | undefined) {
    this._classMap = map;
    this._setGlobalStylesMirroring(Boolean(this._optionRenderer || map));

    if (!this.isConnected) return;
    this._renderOptions();
  }

  constructor() {
    super();
    
    this._shadow = this.attachShadow({ mode: 'open' });
    this._uniqueId = `enhanced-select-${Math.random().toString(36).substr(2, 9)}`;
    this._rendererHelpers = this._buildRendererHelpers();
    
    // Merge global config with component-level config
    this._config = selectConfig.getConfig() as GlobalSelectConfig;
    
    // Initialize state
    this._state = {
      isOpen: false,
      isBusy: false,
      isSearching: false,
      currentPage: this._config.infiniteScroll.initialPage || 1,
      totalPages: 1,
      selectedIndices: new Set(),
      selectedItems: new Map(),
      activeIndex: -1,
      searchQuery: '',
      loadedItems: [],
      groupedItems: [],
      preserveScrollPosition: false,
      lastScrollPosition: 0,
      lastNotifiedQuery: null,
      lastNotifiedResultCount: 0,
      isExpanded: false,
    };
    
    // Create DOM structure
    this._container = this._createContainer();
    this._inputContainer = this._createInputContainer();
    this._input = this._createInput();
    this._arrowContainer = this._createArrowContainer();
    this._clearControl = this._createClearControl();
    this._dropdown = this._createDropdown();
    this._optionsContainer = this._createOptionsContainer();
    this._liveRegion = this._createLiveRegion();
    
    // Initialize styles BEFORE assembling DOM (order matters in shadow DOM)
    this._initializeStyles();
    this._assembleDOM();
    this._attachEventListeners();
    this._initializeObservers();
  }

  connectedCallback(): void {
    
    // WORKAROUND: Force display style on host element for Angular compatibility
    // Angular's rendering seems to not apply :host styles correctly in some cases
    // Must be done in connectedCallback when element is attached to DOM
    this.style.display = 'block';
    this.style.width = '100%';

    if (this._optionRenderer) {
      this._setGlobalStylesMirroring(true);
    }
    
    // Load initial data if server-side is enabled
    if (this._config.serverSide.enabled && this._config.serverSide.initialSelectedValues) {
      this._loadInitialSelectedItems();
    }
    
    // Emit open event if configured to start open
    if (this._config.callbacks.onOpen) {
      this._config.callbacks.onOpen();
    }
  }

  disconnectedCallback(): void {
    // Cleanup observers
    this._resizeObserver?.disconnect();
    this._intersectionObserver?.disconnect();
    if (this._busyTimeout) clearTimeout(this._busyTimeout);
    if (this._typeTimeout) clearTimeout(this._typeTimeout);
    if (this._searchTimeout) clearTimeout(this._searchTimeout);
    
    // Cleanup arrow click listener
    if (this._boundArrowClick && this._arrowContainer) {
      this._arrowContainer.removeEventListener('click', this._boundArrowClick);
    }

    this._teardownGlobalStylesMirroring();
  }

  private _setGlobalStylesMirroring(enabled: boolean): void {
    if (this._mirrorGlobalStylesForCustomOptions === enabled) {
      if (enabled) {
        this._mirrorDocumentStylesIntoShadow();
      }
      return;
    }

    this._mirrorGlobalStylesForCustomOptions = enabled;

    if (enabled) {
      this._setupGlobalStylesMirroring();
    } else {
      this._teardownGlobalStylesMirroring();
    }
  }

  private _setupGlobalStylesMirroring(): void {
    if (typeof document === 'undefined') return;
    if (!this._mirrorGlobalStylesForCustomOptions) return;

    this._mirrorDocumentStylesIntoShadow();

    if (this._globalStylesObserver) return;

    this._globalStylesObserver = new MutationObserver(() => {
      this._mirrorDocumentStylesIntoShadow();
    });

    this._globalStylesObserver.observe(document.head, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
  }

  private _teardownGlobalStylesMirroring(): void {
    if (this._globalStylesObserver) {
      this._globalStylesObserver.disconnect();
      this._globalStylesObserver = null;
    }

    if (this._globalStylesContainer) {
      this._globalStylesContainer.remove();
      this._globalStylesContainer = null;
    }
  }

  private _mirrorDocumentStylesIntoShadow(): void {
    if (typeof document === 'undefined') return;
    if (!this._mirrorGlobalStylesForCustomOptions) return;

    if (!this._globalStylesContainer) {
      this._globalStylesContainer = document.createElement('div');
      this._globalStylesContainer.setAttribute('data-smilodon-global-styles', '');
      this._shadow.appendChild(this._globalStylesContainer);
    }

    const container = this._globalStylesContainer;
    container.innerHTML = '';

    const styleNodes = Array.from(document.querySelectorAll('style,link[rel="stylesheet"]'));

    styleNodes.forEach((node, index) => {
      if (node instanceof HTMLStyleElement) {
        const clonedStyle = document.createElement('style');
        clonedStyle.setAttribute('data-smilodon-global-style', String(index));
        clonedStyle.textContent = node.textContent || '';
        container.appendChild(clonedStyle);
        return;
      }

      if (node instanceof HTMLLinkElement && node.href) {
        const clonedLink = document.createElement('link');
        clonedLink.rel = 'stylesheet';
        clonedLink.href = node.href;
        if (node.media) clonedLink.media = node.media;
        if (node.crossOrigin) clonedLink.crossOrigin = node.crossOrigin;
        if (node.referrerPolicy) clonedLink.referrerPolicy = node.referrerPolicy;
        if (node.integrity) clonedLink.integrity = node.integrity;
        if (node.type) clonedLink.type = node.type;
        if (node.nonce) clonedLink.nonce = node.nonce;
        clonedLink.setAttribute('data-smilodon-global-link', String(index));
        container.appendChild(clonedLink);
      }
    });
  }

  private _createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'select-container';
    
    if (this._config.styles.classNames?.container) {
      container.className += ' ' + this._config.styles.classNames.container;
    }
    
    if (this._config.styles.container) {
      Object.assign(container.style, this._config.styles.container);
    }
    
    return container;
  }

  private _createInputContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'input-container';
    container.setAttribute('part', 'button');
    return container;
  }

  private _createInput(): HTMLInputElement {
    const input = document.createElement('input');
    input.setAttribute('part', 'input');
    input.type = 'text';
    input.className = 'select-input';
    input.id = `${this._uniqueId}-input`;
    input.placeholder = this._config.placeholder || 'Select an option...';
    input.disabled = !this._config.enabled;
    input.readOnly = !this._config.searchable;
    
    // Update readonly when input is focused if searchable
    input.addEventListener('focus', () => {
      if (this._config.searchable) {
        input.readOnly = false;
      }
    });
    
    if (this._config.styles.classNames?.input) {
      input.className += ' ' + this._config.styles.classNames.input;
    }
    
    if (this._config.styles.input) {
      Object.assign(input.style, this._config.styles.input);
    }
    
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-haspopup', 'listbox');
    input.setAttribute('aria-autocomplete', this._config.searchable ? 'list' : 'none');
    
    return input;
  }

  private _createDropdown(): HTMLElement {
    const dropdown = document.createElement('div');
    dropdown.className = 'select-dropdown';
    dropdown.setAttribute('part', 'listbox');
    dropdown.style.display = 'none';
    
    if (this._config.styles.classNames?.dropdown) {
      dropdown.className += ' ' + this._config.styles.classNames.dropdown;
    }
    
    if (this._config.styles.dropdown) {
      Object.assign(dropdown.style, this._config.styles.dropdown);
    }
    
    dropdown.setAttribute('role', 'listbox');
    dropdown.setAttribute('aria-labelledby', `${this._uniqueId}-input`);
    if (this._config.selection.mode === 'multi') {
      dropdown.setAttribute('aria-multiselectable', 'true');
    }
    
    return dropdown;
  }

  private _createOptionsContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'options-container';
    return container;
  }

  private _createLiveRegion(): HTMLElement {
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0;';
    return liveRegion;
  }

  private _createArrowContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'dropdown-arrow-container';
    container.innerHTML = `
      <svg class="dropdown-arrow" part="arrow" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    return container;
  }

  private _createClearControl(): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'clear-control-button';
    button.setAttribute('part', 'clear-button');

    const icon = document.createElement('span');
    icon.className = 'clear-control-icon';
    icon.setAttribute('part', 'clear-icon');
    icon.textContent = this._config.clearControl.icon || '×';

    button.setAttribute('aria-label', this._config.clearControl.ariaLabel || 'Clear selection and search');
    button.appendChild(icon);

    this._clearControlIcon = icon;
    return button;
  }

  private _assembleDOM(): void {
    
    this._inputContainer.appendChild(this._input);

    if (this._clearControl) {
      this._inputContainer.appendChild(this._clearControl);
    }
    
    if (this._arrowContainer) {
      this._inputContainer.appendChild(this._arrowContainer);
    }
    
    this._container.appendChild(this._inputContainer);
    
    this._dropdown.appendChild(this._optionsContainer);
    
    this._container.appendChild(this._dropdown);
    
    this._shadow.appendChild(this._container);
    
    if (this._liveRegion) {
      this._shadow.appendChild(this._liveRegion);
    }
    
    
    // Set ARIA relationships
    const listboxId = `${this._uniqueId}-listbox`;
    this._dropdown.id = listboxId;
    this._input.setAttribute('aria-controls', listboxId);
    this._input.setAttribute('aria-owns', listboxId);

    this._syncClearControlState();
  }

  private _initializeStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        position: relative;
        width: 100%;
      }
      
      .select-container {
        position: relative;
        width: 100%;
      }
      
      .input-container {
        position: relative;
        width: 100%;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--select-input-gap, 6px);
        padding: var(--select-input-padding, 6px 52px 6px 8px);
        min-height: var(--select-input-min-height, 44px);
        max-height: var(--select-input-max-height, 160px);
        overflow-y: var(--select-input-overflow-y, auto);
        align-content: flex-start;
        background: var(--select-input-bg, var(--select-bg, white));
        border: var(--select-input-border, 1px solid var(--select-border-color, #d1d5db));
        border-radius: var(--select-input-border-radius, 6px);
        box-sizing: border-box;
        transition: all 0.2s ease;
      }
      
      .input-container:focus-within {
        border-color: var(--select-input-focus-border, var(--select-border-focus-color, #667eea));
        box-shadow: var(--select-input-focus-shadow, 0 0 0 3px rgba(102, 126, 234, 0.1));
      }
      
      /* Gradient separator before arrow */
      .input-container::after {
        content: '';
        position: absolute;
        top: 50%;
        right: var(--select-separator-position, 40px);
        transform: translateY(-50%);
        width: var(--select-separator-width, 1px);
        height: var(--select-separator-height, 60%);
        background: var(--select-separator-bg, var(--select-separator-gradient, linear-gradient(
          to bottom,
          transparent 0%,
          rgba(0, 0, 0, 0.1) 20%,
          rgba(0, 0, 0, 0.1) 80%,
          transparent 100%
        )));
        pointer-events: none;
        z-index: 1;
      }
      
      .dropdown-arrow-container {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: var(--select-arrow-width, 40px);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background-color 0.2s ease;
        border-radius: var(--select-arrow-border-radius, 0 4px 4px 0);
        z-index: 2;
      }

      .input-container.has-clear-control {
        padding: var(--select-input-padding-with-clear, 6px 84px 6px 8px);
      }

      .input-container.has-clear-control::after {
        right: var(--select-separator-position-with-clear, 72px);
      }

      .dropdown-arrow-container.with-clear-control {
        right: var(--select-arrow-right-with-clear, 32px);
      }

      .clear-control-button {
        position: absolute;
        top: 50%;
        right: var(--select-clear-button-right, 6px);
        transform: translateY(-50%);
        width: var(--select-clear-button-size, 24px);
        height: var(--select-clear-button-size, 24px);
        border: var(--select-clear-button-border, none);
        border-radius: var(--select-clear-button-radius, 999px);
        background: var(--select-clear-button-bg, transparent);
        color: var(--select-clear-button-color, #6b7280);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 3;
        transition: var(--select-clear-button-transition, all 0.2s ease);
      }

      .clear-control-button:hover {
        background: var(--select-clear-button-hover-bg, rgba(0, 0, 0, 0.06));
        color: var(--select-clear-button-hover-color, #111827);
      }

      .clear-control-button:focus-visible {
        outline: var(--select-clear-button-focus-outline, 2px solid rgba(102, 126, 234, 0.55));
        outline-offset: 1px;
      }

      .clear-control-button[hidden] {
        display: none;
      }

      .clear-control-icon {
        font-size: var(--select-clear-icon-size, 16px);
        line-height: 1;
        font-weight: var(--select-clear-icon-weight, 500);
        pointer-events: none;
      }
      
      .dropdown-arrow-container:hover {
        background-color: var(--select-arrow-hover-bg, rgba(102, 126, 234, 0.08));
      }
      
      .dropdown-arrow {
        width: var(--select-arrow-size, 16px);
        height: var(--select-arrow-size, 16px);
        color: var(--select-arrow-color, #667eea);
        transition: transform 0.2s ease, color 0.2s ease;
        transform: translateY(0);
      }
      
      .dropdown-arrow path {
        stroke-width: var(--select-arrow-stroke-width, 2);
      }
      
      .dropdown-arrow-container:hover .dropdown-arrow {
        color: var(--select-arrow-hover-color, #667eea);
      }
      
      .dropdown-arrow.open {
        transform: rotate(180deg);
      }
      
      .select-input {
        flex: 1;
        min-width: var(--select-input-min-width, 120px);
        padding: var(--select-input-field-padding, 4px);
        border: none;
        font-size: var(--select-input-font-size, 14px);
        line-height: var(--select-input-line-height, 1.5);
        color: var(--select-input-color, var(--select-text-color, #1f2937));
        background: transparent;
        box-sizing: border-box;
        outline: none;
        font-family: var(--select-font-family, inherit);
      }
      
      .select-input::placeholder {
        color: var(--select-input-placeholder-color, var(--select-placeholder-color, #9ca3af));
      }
      
      .selection-badge {
        display: inline-flex;
        align-items: center;
        gap: var(--select-badge-gap, 4px);
        padding: var(--select-badge-padding, 4px 8px);
        margin: var(--select-badge-margin, 2px);
        background: var(--select-badge-bg, #667eea);
        color: var(--select-badge-color, white);
        border-radius: var(--select-badge-border-radius, 4px);
        font-size: var(--select-badge-font-size, 13px);
        line-height: 1;
        max-width: var(--select-badge-max-width, 100%);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .badge-remove {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: var(--select-badge-remove-size, 16px);
        height: var(--select-badge-remove-size, 16px);
        padding: 0;
        margin-left: 4px;
        background: var(--select-badge-remove-bg, rgba(255, 255, 255, 0.3));
        border: none;
        border-radius: 50%;
        color: var(--select-badge-remove-color, white);
        font-size: var(--select-badge-remove-font-size, 16px);
        line-height: 1;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .badge-remove:hover {
        background: var(--select-badge-remove-hover-bg, rgba(255, 255, 255, 0.5));
      }

      .badge-remove:focus-visible {
        outline: 2px solid var(--select-badge-remove-focus-outline, rgba(255, 255, 255, 0.8));
        outline-offset: 2px;
      }
      
      .select-input:disabled {
        background-color: var(--select-disabled-bg, #f5f5f5);
        cursor: not-allowed;
      }
      
      .select-dropdown {
        position: absolute;
        scroll-behavior: smooth;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: var(--select-dropdown-margin-top, 4px);
        max-height: var(--select-dropdown-max-height, 300px);
        overflow: hidden;
        background: var(--select-dropdown-bg, var(--select-bg, white));
        border: 1px solid var(--select-dropdown-border, #ccc);
        border-radius: var(--select-dropdown-border-radius, 4px);
        box-shadow: var(--select-dropdown-shadow, 0 4px 6px rgba(0,0,0,0.1));
        z-index: var(--select-dropdown-z-index, 1000);
      }
      
      .options-container {
        position: relative;
        max-height: var(--select-options-max-height, 300px);
        overflow: auto;
        transition: opacity 0.2s ease-in-out;
        background: var(--select-options-bg, var(--select-dropdown-bg, var(--select-bg, white)));
      }

      .option {
        padding: var(--select-option-padding, 8px 12px);
        cursor: pointer;
        color: var(--select-option-color, var(--select-text-color, #1f2937));
        background: var(--select-option-bg, var(--select-dropdown-bg, var(--select-bg, white)));
        transition: var(--select-option-transition, background-color 0.15s ease);
        user-select: none;
        font-size: var(--select-option-font-size, 14px);
        line-height: var(--select-option-line-height, 1.5);
        border: var(--select-option-border, none);
        border-bottom: var(--select-option-border-bottom, none);
        border-radius: var(--select-option-border-radius, 0);
        box-shadow: var(--select-option-shadow, none);
        transform: var(--select-option-transform, none);
      }

      .option:hover {
        background: var(--select-option-hover-bg, #f3f4f6);
        color: var(--select-option-hover-color, #1f2937);
      }

      .option.selected {
        background: var(--select-option-selected-bg, #e0e7ff);
        color: var(--select-option-selected-color, #4338ca);
        font-weight: var(--select-option-selected-weight, 500);
        border: var(--select-option-selected-border, var(--select-option-border, none));
        border-bottom: var(--select-option-selected-border-bottom, var(--select-option-border-bottom, none));
        border-radius: var(--select-option-selected-border-radius, var(--select-option-border-radius, 0));
        box-shadow: var(--select-option-selected-shadow, var(--select-option-shadow, none));
        transform: var(--select-option-selected-transform, var(--select-option-transform, none));
      }

      .option.selected:hover {
        background: var(--select-option-selected-hover-bg, var(--select-option-selected-bg, #e0e7ff));
        color: var(--select-option-selected-hover-color, var(--select-option-selected-color, #4338ca));
        border: var(--select-option-selected-hover-border, var(--select-option-selected-border, var(--select-option-border, none)));
        border-bottom: var(--select-option-selected-hover-border-bottom, var(--select-option-selected-border-bottom, var(--select-option-border-bottom, none)));
        box-shadow: var(--select-option-selected-hover-shadow, var(--select-option-selected-shadow, var(--select-option-shadow, none)));
        transform: var(--select-option-selected-hover-transform, var(--select-option-selected-transform, var(--select-option-transform, none)));
      }

      .option.active:not(.selected) {
        background: var(--select-option-active-bg, #f3f4f6);
        color: var(--select-option-active-color, #1f2937);
        outline: var(--select-option-active-outline, 2px solid rgba(99, 102, 241, 0.45));
        outline-offset: -2px;
      }

      .option.selected.active {
        background: var(--select-option-selected-active-bg, var(--select-option-selected-bg, #e0e7ff));
        color: var(--select-option-selected-active-color, var(--select-option-selected-color, #4338ca));
        border: var(--select-option-selected-active-border, var(--select-option-selected-border, var(--select-option-border, none)));
        border-bottom: var(--select-option-selected-active-border-bottom, var(--select-option-selected-border-bottom, var(--select-option-border-bottom, none)));
        box-shadow: var(--select-option-selected-active-shadow, var(--select-option-selected-shadow, var(--select-option-shadow, none)));
        transform: var(--select-option-selected-active-transform, var(--select-option-selected-transform, var(--select-option-transform, none)));
        outline: var(--select-option-selected-active-outline, var(--select-option-active-outline, 2px solid rgba(99, 102, 241, 0.45)));
        outline-offset: -2px;
      }

      .option:active:not(.selected) {
        background: var(--select-option-pressed-bg, #e5e7eb);
      }

      .option.selected:active {
        background: var(--select-option-selected-pressed-bg, var(--select-option-selected-hover-bg, var(--select-option-selected-bg, #e0e7ff)));
      }
      
      .load-more-container {
        padding: var(--select-load-more-padding, 12px);
        text-align: center;
        border-top: var(--select-divider-border, 1px solid #e0e0e0);
        background: var(--select-load-more-bg, white);
      }
      
      .load-more-button {
        padding: var(--select-button-padding, 8px 16px);
        border: var(--select-button-border, 1px solid #1976d2);
        background: var(--select-button-bg, white);
        color: var(--select-button-color, #1976d2);
        border-radius: var(--select-button-border-radius, 4px);
        cursor: pointer;
        font-size: var(--select-button-font-size, 14px);
        font-family: var(--select-font-family, inherit);
        transition: all 0.2s ease;
      }
      
      .load-more-button:hover {
        background: var(--select-button-hover-bg, #1976d2);
        color: var(--select-button-hover-color, white);
      }
      
      .load-more-button:disabled {
        opacity: var(--select-button-disabled-opacity, 0.5);
        cursor: not-allowed;
      }
      
      .busy-bucket {
        padding: var(--select-busy-padding, 16px);
        text-align: center;
        color: var(--select-busy-color, #666);
        background: var(--select-busy-bg, white);
        font-size: var(--select-busy-font-size, 14px);
      }
      
      .spinner {
        display: inline-block;
        width: var(--select-spinner-size, 20px);
        height: var(--select-spinner-size, 20px);
        border: var(--select-spinner-border, 2px solid #ccc);
        border-top-color: var(--select-spinner-active-color, #1976d2);
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .empty-state {
        padding: var(--select-empty-padding, 24px);
        text-align: center;
        color: var(--select-empty-color, #6b7280);
        font-size: var(--select-empty-font-size, 14px);
        background: var(--select-empty-bg, white);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-height: var(--select-empty-min-height, 72px);
      }
      
      .searching-state {
        padding: var(--select-searching-padding, 24px);
        text-align: center;
        color: var(--select-searching-color, #667eea);
        font-size: var(--select-searching-font-size, 14px);
        font-style: italic;
        background: var(--select-searching-bg, white);
        animation: pulse 1.5s ease-in-out infinite;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-height: var(--select-searching-min-height, 72px);
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      /* Error states */
      .select-input[aria-invalid="true"] {
        border-color: var(--select-error-border, #dc2626);
      }
      
      .select-input[aria-invalid="true"]:focus {
        border-color: var(--select-error-border, #dc2626);
        box-shadow: 0 0 0 2px var(--select-error-shadow, rgba(220, 38, 38, 0.1));
        outline-color: var(--select-error-border, #dc2626);
      }
      
      /* Accessibility: Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
      
      /* Dark mode - Opt-in via class or data attribute */
      :host(.dark-mode),
      :host([data-theme="dark"]) {
        .input-container {
          background: var(--select-dark-bg, #1f2937);
          border-color: var(--select-dark-border, #4b5563);
        }
        
        .select-input {
          color: var(--select-dark-text, #f9fafb);
        }
        
        .select-input::placeholder {
          color: var(--select-dark-placeholder, #6b7280);
        }
        
        .select-dropdown {
          background: var(--select-dark-dropdown-bg, #1f2937);
          border-color: var(--select-dark-dropdown-border, #4b5563);
        }
        
        .options-container {
          background: var(--select-dark-options-bg, #1f2937);
        }
        
        .option {
          color: var(--select-dark-option-color, #f9fafb);
          background: var(--select-dark-option-bg, #1f2937);
        }
        
        .option:hover {
          background: var(--select-dark-option-hover-bg, #374151);
          color: var(--select-dark-option-hover-color, #f9fafb);
        }
        
        .option.selected {
          background: var(--select-dark-option-selected-bg, #3730a3);
          color: var(--select-dark-option-selected-text, #e0e7ff);
          border: var(--select-dark-option-selected-border, var(--select-option-selected-border, var(--select-option-border, none)));
          border-bottom: var(--select-dark-option-selected-border-bottom, var(--select-option-selected-border-bottom, var(--select-option-border-bottom, none)));
          box-shadow: var(--select-dark-option-selected-shadow, var(--select-option-selected-shadow, var(--select-option-shadow, none)));
          transform: var(--select-dark-option-selected-transform, var(--select-option-selected-transform, var(--select-option-transform, none)));
        }

        .option.selected:hover {
          background: var(--select-dark-option-selected-hover-bg, var(--select-dark-option-selected-bg, #3730a3));
          color: var(--select-dark-option-selected-hover-color, var(--select-dark-option-selected-text, #e0e7ff));
          border: var(--select-dark-option-selected-hover-border, var(--select-dark-option-selected-border, var(--select-option-selected-hover-border, var(--select-option-selected-border, var(--select-option-border, none)))));
          border-bottom: var(--select-dark-option-selected-hover-border-bottom, var(--select-dark-option-selected-border-bottom, var(--select-option-selected-hover-border-bottom, var(--select-option-selected-border-bottom, var(--select-option-border-bottom, none)))));
          box-shadow: var(--select-dark-option-selected-hover-shadow, var(--select-dark-option-selected-shadow, var(--select-option-selected-hover-shadow, var(--select-option-selected-shadow, var(--select-option-shadow, none)))));
          transform: var(--select-dark-option-selected-hover-transform, var(--select-dark-option-selected-transform, var(--select-option-selected-hover-transform, var(--select-option-selected-transform, var(--select-option-transform, none)))));
        }
        
        .option.active:not(.selected) {
          background-color: var(--select-dark-option-active-bg, #374151);
          color: var(--select-dark-option-active-color, #f9fafb);
          outline: var(--select-dark-option-active-outline, 2px solid rgba(129, 140, 248, 0.55));
        }

        .option.selected.active {
          background-color: var(--select-dark-option-selected-active-bg, var(--select-dark-option-selected-bg, #3730a3));
          color: var(--select-dark-option-selected-active-color, var(--select-dark-option-selected-text, #e0e7ff));
          border: var(--select-dark-option-selected-active-border, var(--select-dark-option-selected-border, var(--select-option-selected-active-border, var(--select-option-selected-border, var(--select-option-border, none)))));
          border-bottom: var(--select-dark-option-selected-active-border-bottom, var(--select-dark-option-selected-border-bottom, var(--select-option-selected-active-border-bottom, var(--select-option-selected-border-bottom, var(--select-option-border-bottom, none)))));
          box-shadow: var(--select-dark-option-selected-active-shadow, var(--select-dark-option-selected-shadow, var(--select-option-selected-active-shadow, var(--select-option-selected-shadow, var(--select-option-shadow, none)))));
          transform: var(--select-dark-option-selected-active-transform, var(--select-dark-option-selected-transform, var(--select-option-selected-active-transform, var(--select-option-selected-transform, var(--select-option-transform, none)))));
          outline: var(--select-dark-option-selected-active-outline, var(--select-dark-option-active-outline, var(--select-option-selected-active-outline, var(--select-option-active-outline, 2px solid rgba(129, 140, 248, 0.55)))));
          outline-offset: -2px;
        }

        .selection-badge {
          background: var(--select-dark-badge-bg, #4f46e5);
          color: var(--select-dark-badge-color, #eef2ff);
        }

        .badge-remove {
          background: var(--select-dark-badge-remove-bg, rgba(255, 255, 255, 0.15));
          color: var(--select-dark-badge-remove-color, #e5e7eb);
        }

        .badge-remove:hover {
          background: var(--select-dark-badge-remove-hover-bg, rgba(255, 255, 255, 0.3));
        }
        
        .busy-bucket,
        .empty-state {
          color: var(--select-dark-busy-color, #9ca3af);
          background: var(--select-dark-empty-bg, #111827);
        }

        .searching-state {
          background: var(--select-dark-searching-bg, #111827);
        }
        
        .input-container::after {
          background: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(255, 255, 255, 0.1) 20%,
            rgba(255, 255, 255, 0.1) 80%,
            transparent 100%
          );
        }
      }
      
      /* Accessibility: High contrast mode */
      @media (prefers-contrast: high) {
        .select-input:focus {
          outline-width: 3px;
          outline-color: Highlight;
        }
        
        .select-input {
          border-width: 2px;
        }
      }
      
      /* Touch targets (WCAG 2.5.5) */
      .load-more-button,
      select-option {
        min-height: 44px;
      }
    `;
    
    // Insert as first child to ensure styles are processed first
    if (this._shadow.firstChild) {
      this._shadow.insertBefore(style, this._shadow.firstChild);
    } else {
      this._shadow.appendChild(style);
    }
    
  }

  private _attachEventListeners(): void {
    // Arrow click handler
    if (this._arrowContainer) {
      this._boundArrowClick = (e: Event) => {
        e.stopPropagation();
        e.preventDefault();
        
        const wasOpen = this._state.isOpen;
        this._state.isOpen = !this._state.isOpen;
        this._updateDropdownVisibility();
        this._updateArrowRotation();
        
        if (this._state.isOpen && this._config.callbacks.onOpen) {
          this._config.callbacks.onOpen();
        } else if (!this._state.isOpen && this._config.callbacks.onClose) {
          this._config.callbacks.onClose();
        }
        
        // Scroll to selected when opening
        if (!wasOpen && this._state.isOpen && this._state.selectedIndices.size > 0) {
          setTimeout(() => this._scrollToSelected(), 50);
        }
      };
      this._arrowContainer.addEventListener('click', this._boundArrowClick);
    }

    if (this._clearControl) {
      this._clearControl.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        e.preventDefault();
      });

      this._clearControl.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this._handleClearControlClick();
      });
    }

    // Input container click - focus input and open dropdown
    this._inputContainer.addEventListener('pointerdown', (e) => {
      const target = e.target as HTMLElement | null;
      if (!this._config.enabled) return;
      if (target && target.closest('.dropdown-arrow-container')) return;
      if (target && target.closest('.clear-control-button')) return;
      if (!this._state.isOpen) {
        this._handleOpen();
      }
      this._input.focus();
    });
    
    // Input container click - prevent event from reaching document listener
    this._container.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // Input focus/blur
    this._input.addEventListener('focus', () => this._handleOpen());
    this._input.addEventListener('blur', (e) => {
      const related = (e as FocusEvent).relatedTarget as Node | null;
      if (related && (this._shadow.contains(related) || this._container.contains(related))) {
        return;
      }

      // Delay to allow option click/focus transitions
      setTimeout(() => {
        const active = document.activeElement as Node | null;
        if (active && (this._shadow.contains(active) || this._container.contains(active))) {
          return;
        }
        this._handleClose();
      }, 0);
    });
    
    // Input search
    this._input.addEventListener('input', (e) => {
      if (!this._config.searchable) return;
      const query = (e.target as HTMLInputElement).value;
      this._handleSearch(query);
    });

    // Delegated click listener for improved event handling (smart fallback)
    this._optionsContainer.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      // Handle option clicks
      const option = target.closest('[data-sm-selectable], [data-selectable], [data-sm-state]');
      if (option && !option.hasAttribute('aria-disabled')) {
        const indexStr = option.getAttribute('data-sm-index') ?? option.getAttribute('data-index');
        const index = Number(indexStr);
        if (!Number.isNaN(index)) {
             this._selectOption(index, {
                shiftKey: (e as MouseEvent).shiftKey,
                toggleKey: (e as MouseEvent).ctrlKey || (e as MouseEvent).metaKey,
             });
        }
      }
    });
    
    // Keyboard navigation
    this._input.addEventListener('keydown', (e) => this._handleKeydown(e));
    
    // Click outside to close
    document.addEventListener('pointerdown', (e) => {
      const path = (e.composedPath && e.composedPath()) || [];
      const clickedInside = path.includes(this) || path.includes(this._container) || this._shadow.contains(e.target as Node);
      if (!clickedInside) {
        this._handleClose();
      }
    });
  }

  private _initializeObservers(): void {
    // Disconnect existing observer if any
    if (this._intersectionObserver) {
      this._intersectionObserver.disconnect();
      this._intersectionObserver = undefined;
    }

    // Intersection observer for infinite scroll
    if (this._config.infiniteScroll.enabled) {
      this._intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              if (!this._state.isBusy) {
                this._loadMoreItems();
              }
            }
          });
        },
        { threshold: 0.1 }
      );
    }
  }

  private async _loadInitialSelectedItems(): Promise<void> {
    if (!this._config.serverSide.fetchSelectedItems || !this._config.serverSide.initialSelectedValues) {
      return;
    }
    
    this._setBusy(true);
    
    try {
      const items = await this._config.serverSide.fetchSelectedItems(
        this._config.serverSide.initialSelectedValues
      );
      
      // Add to state
      items.forEach((item, index) => {
        this._state.selectedItems.set(index, item);
        this._state.selectedIndices.add(index);
      });
      
      this._updateInputDisplay();
    } catch (error) {
      this._handleError(error as Error);
    } finally {
      this._setBusy(false);
    }
  }

  private _handleOpen(): void {
    if (!this._config.enabled || this._state.isOpen) return;
    
    this._markOpenStart();
    this._state.isOpen = true;
    this._dropdown.style.display = 'block';
    this._input.setAttribute('aria-expanded', 'true');
    this._updateArrowRotation();
    
    // Clear search query when opening to show all options
    // This ensures we can scroll to selected item
    if (this._config.searchable) {
        this._state.searchQuery = '';
        // Don't clear input value if it represents selection
        // But if we want to search, we might want to clear it?
        // Standard behavior: input keeps value (label), but dropdown shows all options
        // until user types.
        // However, our filtering logic uses _state.searchQuery.
        // So clearing it here resets the filter.
    }

    // Render options when opening
    this._renderOptions();
  this._setInitialActiveOption();
    
    this._emit('open', {});
    this._config.callbacks.onOpen?.();
  this._announce('Options expanded');
    
    // Scroll to selected if configured
    if (this._config.scrollToSelected.enabled) {
      // Use requestAnimationFrame for better timing after render
      requestAnimationFrame(() => {
        // Double RAF to ensure layout is complete
        requestAnimationFrame(() => {
          this._scrollToSelected();
        });
      });
    }
  }

  private _handleClose(): void {
    if (!this._state.isOpen) return;
    
    this._state.isOpen = false;
    this._dropdown.style.display = 'none';
    this._input.setAttribute('aria-expanded', 'false');
    this._input.removeAttribute('aria-activedescendant');
    this._updateArrowRotation();
    
    this._emit('close', {});
    this._config.callbacks.onClose?.();
    this._announce('Options collapsed');
  }

  private _updateDropdownVisibility(): void {
    if (this._state.isOpen) {
      this._dropdown.style.display = 'block';
      this._input.setAttribute('aria-expanded', 'true');
    } else {
      this._dropdown.style.display = 'none';
      this._input.setAttribute('aria-expanded', 'false');
    }
  }

  private _updateArrowRotation(): void {
    if (this._arrowContainer) {
      const arrow = this._arrowContainer.querySelector('.dropdown-arrow');
      if (arrow) {
        if (this._state.isOpen) {
          arrow.classList.add('open');
        } else {
          arrow.classList.remove('open');
        }
      }
    }
  }

  private _isPerfEnabled(): boolean {
    return typeof globalThis !== 'undefined'
      && (globalThis as any).__SMILODON_DEV__ === true
      && typeof performance !== 'undefined'
      && typeof performance.mark === 'function'
      && typeof performance.measure === 'function';
  }

  private _perfMark(name: string): void {
    if (!this._isPerfEnabled()) return;
    performance.mark(name);
  }

  private _perfMeasure(name: string, start: string, end: string): void {
    if (!this._isPerfEnabled()) return;
    performance.measure(name, start, end);
  }

  private _markOpenStart(): void {
    if (!this._isPerfEnabled()) return;
    this._pendingFirstRenderMark = true;
    this._perfMark('smilodon-dropdown-open-start');
  }

  private _finalizePerfMarks(): void {
    if (!this._isPerfEnabled()) {
      this._pendingFirstRenderMark = false;
      this._pendingSearchRenderMark = false;
      return;
    }

    if (this._pendingFirstRenderMark) {
      this._pendingFirstRenderMark = false;
      this._perfMark('smilodon-first-render-complete');
      this._perfMeasure(
        'smilodon-dropdown-to-first-render',
        'smilodon-dropdown-open-start',
        'smilodon-first-render-complete'
      );
    }

    if (this._pendingSearchRenderMark) {
      this._pendingSearchRenderMark = false;
      this._perfMark('smilodon-search-render-complete');
      this._perfMeasure(
        'smilodon-search-to-render',
        'smilodon-search-input-last',
        'smilodon-search-render-complete'
      );
    }
  }

  private _handleSearch(query: string): void {
    this._state.searchQuery = query;
    this._syncClearControlState();

    if (query.length > 0) {
      this._perfMark('smilodon-search-input-last');
      this._pendingSearchRenderMark = true;
    } else {
      this._pendingSearchRenderMark = false;
    }
    
    // Clear previous search timeout
    if (this._searchTimeout) {
      clearTimeout(this._searchTimeout);
    }
    
    // Search immediately - no debouncing for better responsiveness
    // Users expect instant feedback as they type
    this._state.isSearching = false;
    
    // Ensure dropdown is open when searching
    if (!this._state.isOpen) {
      this._handleOpen();
    } else {
      // Filter and render options immediately
      this._renderOptions();
    }
    
    // Get filtered items based on search query - searches ENTIRE phrase
    const getLabel = this._config.serverSide.getLabelFromItem || ((item) => (item as any)?.label ?? String(item));
    // FIX: Do not trim query to allow searching for phrases with spaces
    const searchQuery = query.toLowerCase();
    
    const filteredItems = searchQuery
      ? this._state.loadedItems.filter((item: any) => {
          try {
            const label = String(getLabel(item)).toLowerCase();
            // Match the entire search phrase
            return label.includes(searchQuery);
          } catch (e) {
            return false;
          }
        })
      : this._state.loadedItems;
    
    const count = filteredItems.length;
    
    // Announce search results for accessibility
    if (searchQuery) {
      this._announce(`${count} result${count !== 1 ? 's' : ''} found for "${query}"`);
    }
    
    // Only notify if query or result count changed to prevent infinite loops
    if (query !== this._state.lastNotifiedQuery || count !== this._state.lastNotifiedResultCount) {
      this._state.lastNotifiedQuery = query;
      this._state.lastNotifiedResultCount = count;
      
      // Use setTimeout to avoid synchronous state updates during render
      setTimeout(() => {
        this._emit('search', { query, results: filteredItems, count });
        this._config.callbacks.onSearch?.(query);
      }, 0);
    }
  }

  private _handleKeydown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!this._state.isOpen) {
          this._handleOpen();
        } else {
          this._moveActive(1, { shiftKey: e.shiftKey, toggleKey: e.ctrlKey || e.metaKey });
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!this._state.isOpen) {
          this._handleOpen();
        } else {
          this._moveActive(-1, { shiftKey: e.shiftKey, toggleKey: e.ctrlKey || e.metaKey });
        }
        break;
      case 'Home':
        e.preventDefault();
        if (this._state.isOpen) {
          this._setActive(0);
          if (this._config.selection.mode === 'multi' && e.shiftKey) {
            this._selectRange(this._rangeAnchorIndex ?? 0, 0, { clear: !(e.ctrlKey || e.metaKey) });
          }
        }
        break;
      case 'End':
        e.preventDefault();
        if (this._state.isOpen) {
          const options = Array.from(this._optionsContainer.children) as SelectOption[];
          const lastIndex = Math.max(0, options.length - 1);
          this._setActive(lastIndex);
          if (this._config.selection.mode === 'multi' && e.shiftKey) {
            this._selectRange(this._rangeAnchorIndex ?? lastIndex, lastIndex, { clear: !(e.ctrlKey || e.metaKey) });
          }
        }
        break;
      case 'PageDown':
        e.preventDefault();
        if (this._state.isOpen) {
          this._moveActive(10, { shiftKey: e.shiftKey, toggleKey: e.ctrlKey || e.metaKey });
        }
        break;
      case 'PageUp':
        e.preventDefault();
        if (this._state.isOpen) {
          this._moveActive(-10, { shiftKey: e.shiftKey, toggleKey: e.ctrlKey || e.metaKey });
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (this._state.activeIndex >= 0) {
          this._selectOption(this._state.activeIndex, { shiftKey: e.shiftKey, toggleKey: e.ctrlKey || e.metaKey });
        }
        break;
      case 'Escape':
        e.preventDefault();
        this._handleClose();
        break;
      case 'Tab':
        if (this._state.isOpen) {
          this._handleClose();
        }
        break;
      case 'a':
      case 'A':
        if ((e.ctrlKey || e.metaKey) && this._config.selection.mode === 'multi') {
          e.preventDefault();
          this._selectAll();
        }
        break;
      default:
        // Type-ahead search
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
          this._handleTypeAhead(e.key);
        }
        break;
    }
  }

  private _moveActive(delta: number, opts?: { shiftKey?: boolean; toggleKey?: boolean }): void {
    const options = Array.from(this._optionsContainer.children) as SelectOption[];
    const next = Math.max(0, Math.min(options.length - 1, this._state.activeIndex + delta));
    this._setActive(next);

    if (this._config.selection.mode === 'multi' && opts?.shiftKey) {
      const anchor = this._rangeAnchorIndex ?? this._state.activeIndex;
      const anchorIndex = anchor >= 0 ? anchor : next;
      if (this._rangeAnchorIndex === null) {
        this._rangeAnchorIndex = anchorIndex;
      }
      this._selectRange(anchorIndex, next, { clear: !opts?.toggleKey });
    }
  }

  private _setActive(index: number): void {
    const options = Array.from(this._optionsContainer.children);
    
    // Clear previous active state
    if (this._state.activeIndex >= 0 && options[this._state.activeIndex]) {
      const prevOption = options[this._state.activeIndex];
      // Check if it's a custom SelectOption or a lightweight DOM element
      if ('setActive' in prevOption && typeof (prevOption as any).setActive === 'function') {
        (prevOption as SelectOption).setActive(false);
      } else {
        // Lightweight option - remove active class
        (prevOption as HTMLElement).classList.remove('smilodon-option--active');
        (prevOption as HTMLElement).setAttribute('aria-selected', 'false');
      }
    }
    
    this._state.activeIndex = index;
    
    // Set new active state
    if (options[index]) {
      const option = options[index];
      
      // Check if it's a custom SelectOption or a lightweight DOM element
      if ('setActive' in option && typeof (option as any).setActive === 'function') {
        (option as SelectOption).setActive(true);
      } else {
        // Lightweight option - add active class
        (option as HTMLElement).classList.add('smilodon-option--active');
        (option as HTMLElement).setAttribute('aria-selected', 'true');
      }
      
      if (typeof (option as HTMLElement).scrollIntoView === 'function') {
        (option as HTMLElement).scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
      
      // Announce position for screen readers
      const total = options.length;
      this._announce(`Item ${index + 1} of ${total}`);
      
      // Update aria-activedescendant using the actual option id when available
      const optionId = (option as HTMLElement).id || `${this._uniqueId}-option-${index}`;
      this._input.setAttribute('aria-activedescendant', optionId);
    }
  }

  private _getOptionElementByIndex(index: number): HTMLElement | null {
    return this._optionsContainer.querySelector(`[data-index="${index}"]`) as HTMLElement | null;
  }

  private _buildRendererHelpers(): RendererHelpers {
    return {
      onSelect: (_item: unknown, index: number) => this._selectOption(index),
      getIndex: (node: Element | null) => {
        const el = node?.closest?.('[data-selectable]') as HTMLElement | null;
        if (!el) return null;
        const idx = Number(el.dataset.index);
        return Number.isFinite(idx) ? idx : null;
      },
      keyboardFocus: (index: number) => {
        this._setActive(index);
        const el = this._getOptionElementByIndex(index);
        el?.focus?.();
      },
    };
  }

  private _handleTypeAhead(char: string): void {
    if (this._typeTimeout) clearTimeout(this._typeTimeout);
    
    this._typeBuffer += char.toLowerCase();
    this._typeTimeout = window.setTimeout(() => {
      this._typeBuffer = '';
    }, 500);
    
    // Find first matching option
    const getValue = this._config.serverSide.getLabelFromItem || ((item) => (item as any)?.label ?? String(item));
    const matchIndex = this._state.loadedItems.findIndex((item) =>
      getValue(item).toLowerCase().startsWith(this._typeBuffer)
    );
    
    if (matchIndex >= 0) {
      this._setActive(matchIndex);
    }
  }

  private _selectAll(): void {
    if (this._config.selection.mode !== 'multi') return;
    
    const options = Array.from(this._optionsContainer.children);
    const maxSelections = this._config.selection.maxSelections || 0;
    
    options.forEach((option, index) => {
      if (maxSelections > 0 && this._state.selectedIndices.size >= maxSelections) {
        return;
      }
      
      if (!this._state.selectedIndices.has(index)) {
        // Check if it's a custom SelectOption or a lightweight DOM element
        if ('getConfig' in option && typeof (option as any).getConfig === 'function') {
          const config = (option as SelectOption).getConfig();
          this._state.selectedIndices.add(index);
          this._state.selectedItems.set(index, config.item);
          (option as SelectOption).setSelected(true);
        } else {
          // Lightweight option - get item from data attribute or state
          const item = this._state.loadedItems[index];
          if (item) {
            this._state.selectedIndices.add(index);
            this._state.selectedItems.set(index, item);
            (option as HTMLElement).classList.add('smilodon-option--selected');
            (option as HTMLElement).setAttribute('aria-selected', 'true');
          }
        }
      }
    });
    
    this._updateInputDisplay();
    this._emitChange();
    this._announce(`Selected all ${options.length} items`);
  }

  private _selectRange(start: number, end: number, opts?: { clear?: boolean }): void {
    if (this._config.selection.mode !== 'multi') return;
    const maxSelections = this._config.selection.maxSelections || 0;
    const [min, max] = start < end ? [start, end] : [end, start];

    if (opts?.clear) {
      this._state.selectedIndices.clear();
      this._state.selectedItems.clear();
    }

    for (let i = min; i <= max; i += 1) {
      if (maxSelections > 0 && this._state.selectedIndices.size >= maxSelections) break;
      const item = this._state.loadedItems[i];
      if (!item) continue;
      this._state.selectedIndices.add(i);
      this._state.selectedItems.set(i, item);
    }

    this._renderOptions();
    this._updateInputDisplay();
    this._emitChange();
    this._announce(`${this._state.selectedIndices.size} items selected`);
  }

  private _setInitialActiveOption(): void {
    const options = Array.from(this._optionsContainer.children);
    if (options.length === 0) return;
    const selected = Array.from(this._state.selectedIndices).sort((a, b) => a - b);
    if (this._config.selection.mode === 'multi' && selected.length === 0) {
      this._state.activeIndex = -1;
      this._input.removeAttribute('aria-activedescendant');
      return;
    }
    const target = selected.length > 0 ? selected[0] : 0;
    this._setActive(Math.min(target, options.length - 1));
  }

  private _announce(message: string): void {
    if (this._liveRegion) {
      this._liveRegion.textContent = message;
      setTimeout(() => {
        if (this._liveRegion) this._liveRegion.textContent = '';
      }, 1000);
    }
  }

  private _selectOption(index: number, opts?: { shiftKey?: boolean; toggleKey?: boolean }): void {
    // FIX: Do not rely on this._optionsContainer.children[index] because filtering changes the children
    // Instead, use the index to update state directly
    
    const item = this._state.loadedItems[index];
    if (!item) return;

    // Keep active/focus styling aligned with the most recently interacted option.
    // Without this, a previously selected item may retain active classes/styles
    // after selecting a different option.
    this._state.activeIndex = index;
    
    const isCurrentlySelected = this._state.selectedIndices.has(index);
    
    if (this._config.selection.mode === 'single') {
      // Single select: clear previous and select new
      const wasSelected = this._state.selectedIndices.has(index);
      this._state.selectedIndices.clear();
      this._state.selectedItems.clear();
      
      if (!wasSelected) {
        // Select this option
        this._state.selectedIndices.add(index);
        this._state.selectedItems.set(index, item);
      }
      
      // Re-render to update all option styles
      this._renderOptions();
      
      if (this._config.selection.closeOnSelect) {
        this._handleClose();
      }
    } else {
      const toggleKey = Boolean(opts?.toggleKey);
      const shiftKey = Boolean(opts?.shiftKey);

      if (shiftKey) {
        const anchor = this._rangeAnchorIndex ?? index;
        this._selectRange(anchor, index, { clear: !toggleKey });
        this._rangeAnchorIndex = anchor;
        return;
      }

      // Multi select with toggle
      const maxSelections = this._config.selection.maxSelections || 0;
      
      if (isCurrentlySelected) {
        // Deselect (toggle off)
        this._state.selectedIndices.delete(index);
        this._state.selectedItems.delete(index);
      } else {
        // Select (toggle on)
        if (maxSelections > 0 && this._state.selectedIndices.size >= maxSelections) {
          this._announce(`Maximum ${maxSelections} selections allowed`);
          return; // Max selections reached
        }
        
        this._state.selectedIndices.add(index);
        this._state.selectedItems.set(index, item);
      }
      
      // Re-render to update styles (safer than trying to find the element in filtered list)
      this._renderOptions();
    }

    this._rangeAnchorIndex = index;
    
    this._updateInputDisplay();
    this._emitChange();
    
    const getValue = this._config.serverSide.getValueFromItem || ((item) => (item as any)?.value ?? item);
    const getLabel = this._config.serverSide.getLabelFromItem || ((item) => (item as any)?.label ?? String(item));
    const label = getLabel(item);
    if (this._config.selection.mode === 'single') {
      this._announce(`Selected ${label}`);
    } else {
      const selectedCount = this._state.selectedIndices.size;
      const action = isCurrentlySelected ? 'Deselected' : 'Selected';
      this._announce(`${action} ${label}. ${selectedCount} selected`);
    }
    
    this._config.callbacks.onSelect?.({
      item: item,
      index,
      value: getValue(item),
      label: getLabel(item),
      selected: this._state.selectedIndices.has(index),
    });
  }

  private _handleOptionRemove(index: number): void {
    const option = this._getOptionElementByIndex(index) as SelectOption | null;
    if (!option) return;
    
    this._state.selectedIndices.delete(index);
    this._state.selectedItems.delete(index);
    option.setSelected(false);
    
    this._updateInputDisplay();
    this._emitChange();
    
    const config = option.getConfig();
    this._emit('remove', { item: config.item, index });
  }

  private _updateInputDisplay(): void {
    const selectedItems = Array.from(this._state.selectedItems.values());
    const getLabel = this._config.serverSide.getLabelFromItem || ((item) => (item as any)?.label ?? String(item));
    
    if (selectedItems.length === 0) {
      this._input.value = '';
      this._input.placeholder = this._config.placeholder || 'Select an option...';
      // Clear any badges
      const existingBadges = this._inputContainer.querySelectorAll('.selection-badge');
      existingBadges.forEach(badge => badge.remove());
    } else if (this._config.selection.mode === 'single') {
      this._input.value = getLabel(selectedItems[0]);
    } else {
      // Multi-select: show badges instead of text in input
      this._input.value = '';
      this._input.placeholder = '';
      
      // Clear existing badges
      const existingBadges = this._inputContainer.querySelectorAll('.selection-badge');
      existingBadges.forEach(badge => badge.remove());
      
      // Create badges for each selected item
      const selectedEntries = Array.from(this._state.selectedItems.entries());
      selectedEntries.forEach(([index, item]) => {
        const badge = document.createElement('span');
        badge.className = 'selection-badge';
        badge.setAttribute('part', 'chip');
        badge.textContent = getLabel(item);
        
        // Add remove button to badge
        const removeBtn = document.createElement('button');
        removeBtn.className = 'badge-remove';
        removeBtn.setAttribute('part', 'chip-remove');
        removeBtn.innerHTML = '×';
        removeBtn.setAttribute('aria-label', `Remove ${getLabel(item)}`);
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this._state.selectedIndices.delete(index);
          this._state.selectedItems.delete(index);
          this._updateInputDisplay();
          this._renderOptions();
          this._emitChange();
        });
        
        badge.appendChild(removeBtn);
        this._inputContainer.insertBefore(badge, this._input);
      });
    }

    this._syncClearControlState();
  }

  private _renderOptionsWithAnimation(): void {
    // Add fade-out animation
    this._optionsContainer.style.opacity = '0';
    this._optionsContainer.style.transition = 'opacity 0.15s ease-out';
    
    setTimeout(() => {
      this._renderOptions();
      // Fade back in
      this._optionsContainer.style.opacity = '1';
      this._optionsContainer.style.transition = 'opacity 0.2s ease-in';
    }, 150);
  }

  private _scrollToSelected(): void {
    if (this._state.selectedIndices.size === 0) return;
    
    const target = this._config.scrollToSelected.multiSelectTarget;
    const indices = Array.from(this._state.selectedIndices).sort((a, b) => a - b);
    
    // For multi-select, find the closest selected item to the current scroll position
    let targetIndex: number;
    
    if (this._config.selection.mode === 'multi' && indices.length > 1) {
      // Calculate which selected item is closest to the center of the viewport
      const dropdownRect = this._dropdown.getBoundingClientRect();
      const viewportCenter = this._dropdown.scrollTop + (dropdownRect.height / 2);
      
      // Find the selected item closest to viewport center
      let closestIndex = indices[0];
      let closestDistance = Infinity;
      
      for (const index of indices) {
  const option = this._getOptionElementByIndex(index);
        
        if (option) {
          const optionTop = option.offsetTop;
          const distance = Math.abs(optionTop - viewportCenter);
          
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
          }
        }
      }
      
      targetIndex = closestIndex;
    } else {
      // For single select or only one selected item, use the configured target
      targetIndex = target === 'first' ? indices[0] : indices[indices.length - 1];
    }
    
    // Find and scroll to the target option
  const option = this._getOptionElementByIndex(targetIndex);
    
    if (option) {
      // Use smooth scrolling with center alignment for better UX
      option.scrollIntoView({
        block: this._config.scrollToSelected.block || 'center',
        behavior: 'smooth',
      });
      
      // Also set it as active for keyboard navigation
      this._setActive(targetIndex);
    }
  }

  private async _loadMoreItems(): Promise<void> {
    if (this._state.isBusy) return;
    
    this._setBusy(true);
    
    // Save scroll position before loading
    if (this._dropdown) {
      this._state.lastScrollPosition = this._dropdown.scrollTop;
      this._state.preserveScrollPosition = true;
      
      // Update dropdown to show loading indicator but keep the
      // same scrollTop so the visible items don't move.
      this._renderOptions();
      this._dropdown.scrollTop = this._state.lastScrollPosition;
    }
    
    try {
      // Emit event for parent to handle
      this._state.currentPage++;
      
      this._emit('loadMore', { page: this._state.currentPage, items: [] });
      this._config.callbacks.onLoadMore?.(this._state.currentPage);
      
      // NOTE: We do NOT set isBusy = false here.
      // The parent component MUST call setItems() or similar to clear the busy state.
      // This prevents the sentinel from reappearing before new items are loaded.
    } catch (error) {
      this._handleError(error as Error);
      this._setBusy(false); // Only clear on error
    }
  }

  private _setBusy(busy: boolean): void {
    this._state.isBusy = busy;
    if (busy) {
      this._dropdown.setAttribute('aria-busy', 'true');
    } else {
      this._dropdown.removeAttribute('aria-busy');
    }
    
    // Trigger re-render to show/hide busy indicator
    // We use _renderOptions to handle the UI update
    this._renderOptions();
  }

  private _handleError(error: Error): void {
    this._emit('error', { message: error.message, cause: error });
    this._config.callbacks.onError?.(error);
  }

  private _emit<K extends SelectEventName>(name: K, detail: SelectEventsDetailMap[K]): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private _emitChange(): void {
    const selectedItems = Array.from(this._state.selectedItems.values());
    const getValue = this._config.serverSide.getValueFromItem || ((item) => (item as any)?.value ?? item);
    const selectedValues = selectedItems.map(getValue);
    const selectedIndices = Array.from(this._state.selectedIndices);
    
    this._emit('change', { selectedItems, selectedValues, selectedIndices });
    this._config.callbacks.onChange?.(selectedItems, selectedValues);
  }

  // Public API

  get optionRenderer(): OptionRendererFn | undefined {
    return this._optionRenderer;
  }

  set optionRenderer(renderer: OptionRendererFn | undefined) {
    this._optionRenderer = renderer;
    this._setGlobalStylesMirroring(Boolean(renderer || this._classMap));
    this._renderOptions();
  }
  
  /**
   * Set items to display in the select
   */
  setItems(items: unknown[]): void {
    
    const previousLength = this._state.loadedItems.length;
    this._state.loadedItems = items;
    
    // If grouped items exist, flatten them to items
    if (this._state.groupedItems.length > 0) {
      this._state.loadedItems = this._state.groupedItems.flatMap(group => group.options);
    }
    
    const newLength = this._state.loadedItems.length;
    
    // When infinite scroll is active (preserveScrollPosition = true),
    // we need to maintain scroll position during the update
    if (this._state.preserveScrollPosition && this._dropdown) {
      const targetScrollTop = this._state.lastScrollPosition;
      
      // Only clear loading if we actually got more items
      if (newLength > previousLength) {
        this._state.isBusy = false;
      }
      
      this._renderOptions();
      
      // Restore the exact scrollTop we had before loading
      // so the previously visible items stay in place and
      // new ones simply appear below.
      this._dropdown.scrollTop = targetScrollTop;
      
      // Ensure it sticks after layout
      requestAnimationFrame(() => {
        if (this._dropdown) {
          this._dropdown.scrollTop = targetScrollTop;
        }
      });
      
      // Only clear preserveScrollPosition if we got new items
      if (newLength > previousLength) {
        this._state.preserveScrollPosition = false;
      }
    } else {
      // Normal update - just render normally
      this._state.isBusy = false;
      this._renderOptions();
    }
    
  }

  /**
   * Set grouped items
   */
  setGroupedItems(groupedItems: GroupedItem[]): void {
    this._state.groupedItems = groupedItems;
    this._state.loadedItems = groupedItems.flatMap(group => group.options);
    this._renderOptions();
  }

  /**
   * Get currently selected items
   */
  getSelectedItems(): unknown[] {
    return Array.from(this._state.selectedItems.values());
  }

  /**
   * Get all loaded items
   */
  get loadedItems(): unknown[] {
    return this._state.loadedItems;
  }

  /**
   * Get currently selected values
   */
  getSelectedValues(): unknown[] {
    const getValue = this._config.serverSide.getValueFromItem || ((item) => (item as any)?.value ?? item);
    return this.getSelectedItems().map(getValue);
  }

  /**
   * Set selected items by value
   */
  async setSelectedValues(values: unknown[]): Promise<void> {
    if (this._config.serverSide.enabled && this._config.serverSide.fetchSelectedItems) {
      await this._loadSelectedItemsByValues(values);
    } else {
      // Select from loaded items
      const getValue = this._config.serverSide.getValueFromItem || ((item) => (item as any)?.value ?? item);
      
      this._state.selectedIndices.clear();
      this._state.selectedItems.clear();
      
      this._state.loadedItems.forEach((item, index) => {
        if (values.includes(getValue(item))) {
          this._state.selectedIndices.add(index);
          this._state.selectedItems.set(index, item);
        }
      });
      
      this._renderOptions();
      this._updateInputDisplay();
      this._emitChange();
    }
  }

  /**
   * Load and select items by their values (for infinite scroll scenario)
   */
  private async _loadSelectedItemsByValues(values: unknown[]): Promise<void> {
    if (!this._config.serverSide.fetchSelectedItems) return;
    
    this._setBusy(true);
    
    try {
      const items = await this._config.serverSide.fetchSelectedItems(values);
      
      this._state.selectedIndices.clear();
      this._state.selectedItems.clear();
      
      items.forEach((item, index) => {
        this._state.selectedIndices.add(index);
        this._state.selectedItems.set(index, item);
      });
      
      this._renderOptions();
      this._updateInputDisplay();
      this._emitChange();
      
      // Scroll to selected if configured
      if (this._config.scrollToSelected.enabled) {
        this._scrollToSelected();
      }
    } catch (error) {
      this._handleError(error as Error);
    } finally {
      this._setBusy(false);
    }
  }

  /**
   * Clear all selections
   */
  clear(): void {
    this._state.selectedIndices.clear();
    this._state.selectedItems.clear();
    this._renderOptions();
    this._updateInputDisplay();
    this._emitChange();
    this._syncClearControlState();
  }

  /**
   * Clear search query and restore full option list
   */
  clearSearch(): void {
    this._state.searchQuery = '';
    if (this._config.searchable) {
      this._input.value = '';
      if (this._state.selectedIndices.size > 0) {
        this._updateInputDisplay();
      }
    }
    this._renderOptions();
    this._syncClearControlState();
  }

  /**
   * Open dropdown
   */
  open(): void {
    this._handleOpen();
  }

  /**
   * Close dropdown
   */
  close(): void {
    this._handleClose();
  }

  /**
   * Update component configuration
   */
  updateConfig(config: Partial<GlobalSelectConfig>): void {
    this._config = selectConfig.mergeWithComponentConfig(config);
    
    // Update input state based on new config
    if (this._input) {
      this._input.readOnly = !this._config.searchable;
      this._input.setAttribute('aria-autocomplete', this._config.searchable ? 'list' : 'none');
      if (this._state.selectedIndices.size === 0) {
        this._input.placeholder = this._config.placeholder || 'Select an option...';
      }
    }

    if (this._clearControl) {
      this._clearControl.setAttribute('aria-label', this._config.clearControl.ariaLabel || 'Clear selection and search');
    }

    if (this._clearControlIcon) {
      this._clearControlIcon.textContent = this._config.clearControl.icon || '×';
    }

    if (this._dropdown) {
      if (this._config.selection.mode === 'multi') {
        this._dropdown.setAttribute('aria-multiselectable', 'true');
      } else {
        this._dropdown.removeAttribute('aria-multiselectable');
      }
    }
    
    // Re-initialize observers in case infinite scroll was enabled/disabled
    this._initializeObservers();

    this._syncClearControlState();
    
    this._renderOptions();
  }

  private _handleClearControlClick(): void {
    const shouldClearSelection = this._config.clearControl.clearSelection !== false;
    const shouldClearSearch = this._config.clearControl.clearSearch !== false;

    const hadSelection = this._state.selectedIndices.size > 0;
    const hadSearch = this._state.searchQuery.length > 0;

    if (shouldClearSelection && hadSelection) {
      this.clear();
    }

    if (shouldClearSearch && hadSearch) {
      this.clearSearch();
    }

    this._emit('clear', {
      clearedSelection: shouldClearSelection && hadSelection,
      clearedSearch: shouldClearSearch && hadSearch,
    });

    this._config.callbacks.onClear?.({
      clearedSelection: shouldClearSelection && hadSelection,
      clearedSearch: shouldClearSearch && hadSearch,
    });

    this._input.focus();
  }

  private _syncClearControlState(): void {
    if (!this._clearControl || !this._inputContainer || !this._arrowContainer) return;

    const enabled = this._config.clearControl.enabled === true;
    const hasSelection = this._state.selectedIndices.size > 0;
    const hasSearch = this._state.searchQuery.length > 0;
    const clearSelection = this._config.clearControl.clearSelection !== false;
    const clearSearch = this._config.clearControl.clearSearch !== false;
    const hasSomethingToClear = (clearSelection && hasSelection) || (clearSearch && hasSearch);
    const hideWhenEmpty = this._config.clearControl.hideWhenEmpty !== false;
    const visible = enabled && (!hideWhenEmpty || hasSomethingToClear);

    this._inputContainer.classList.toggle('has-clear-control', enabled);
    this._arrowContainer.classList.toggle('with-clear-control', enabled);
    this._clearControl.hidden = !visible;
    this._clearControl.disabled = !hasSomethingToClear;
    this._clearControl.setAttribute('aria-hidden', String(!visible));
  }

  /**
   * Set error state
   */
  setError(message: string): void {
    this._hasError = true;
    this._errorMessage = message;
    this._input.setAttribute('aria-invalid', 'true');
    this._announce(`Error: ${message}`);
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this._hasError = false;
    this._errorMessage = '';
    this._input.removeAttribute('aria-invalid');
  }

  /**
   * Set required state
   */
  setRequired(required: boolean): void {
    if (required) {
      this._input.setAttribute('aria-required', 'true');
      this._input.setAttribute('required', '');
    } else {
      this._input.removeAttribute('aria-required');
      this._input.removeAttribute('required');
    }
  }

  /**
   * Validate selection (for required fields)
   */
  validate(): boolean {
    const isRequired = this._input.hasAttribute('required');
    if (isRequired && this._state.selectedIndices.size === 0) {
      this.setError('Selection is required');
      return false;
    }
    this.clearError();
    return true;
  }

  /**
   * Render options based on current state
   */
  private _renderOptions(): void {
    
    // Cleanup observer
    if (this._loadMoreTrigger && this._intersectionObserver) {
      this._intersectionObserver.unobserve(this._loadMoreTrigger);
    }
    
    // Clear options container
    this._optionsContainer.innerHTML = '';
    
    // Ensure dropdown only contains options container (cleanup legacy direct children)
    // We need to preserve optionsContainer, so we can't just clear dropdown.innerHTML
    // But we can check if there are other children and remove them
    Array.from(this._dropdown.children).forEach(child => {
      if (child !== this._optionsContainer) {
        this._dropdown.removeChild(child);
      }
    });
    
    // Ensure dropdown is visible if we are rendering options
    if (this._state.isOpen && this._dropdown.style.display === 'none') {
      this._dropdown.style.display = 'block';
    }
    
    // Show searching state (exclusive state)
    if (this._state.isSearching) {
      const searching = document.createElement('div');
      searching.className = 'searching-state';
      searching.setAttribute('part', 'loading');
      searching.textContent = 'Searching...';
      this._optionsContainer.appendChild(searching);
      return;
    }
    
    const getValue = this._config.serverSide.getValueFromItem || ((item) => (item as any)?.value ?? item);
    const getLabel = this._config.serverSide.getLabelFromItem || ((item) => (item as any)?.label ?? String(item));
    
    // Filter items by search query
    const query = this._state.searchQuery.toLowerCase();
    
    // Handle Grouped Items Rendering (when no search query)
    if (this._state.groupedItems.length > 0 && !query) {
      this._state.groupedItems.forEach(group => {
        const header = document.createElement('div');
        header.className = 'group-header';
        header.textContent = group.label;
        Object.assign(header.style, {
          padding: '8px 12px',
          fontWeight: '600',
          color: '#6b7280',
          backgroundColor: '#f3f4f6',
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          position: 'sticky',
          top: '0',
          zIndex: '1',
          borderBottom: '1px solid #e5e7eb'
        });
        this._optionsContainer.appendChild(header);
        
        group.options.forEach(item => {
          // Find original index for correct ID generation and selection
          const index = this._state.loadedItems.indexOf(item);
          if (index !== -1) {
            this._renderSingleOption(item, index, getValue, getLabel);
          }
        });
      });
    } else {
      // Normal rendering (flat list or filtered)
      let hasRenderedItems = false;
      
      this._state.loadedItems.forEach((item, index) => {
        // Apply filter if query exists
        if (query) {
          try {
            const label = String(getLabel(item)).toLowerCase();
            if (!label.includes(query)) return;
          } catch (e) {
            return;
          }
        }
        
        hasRenderedItems = true;
        this._renderSingleOption(item, index, getValue, getLabel);
      });
      
      
      if (!hasRenderedItems && !this._state.isBusy) {
        const empty = document.createElement('div');
        empty.setAttribute('part', 'no-results');
        empty.className = 'empty-state';
        if (query) {
          empty.textContent = `No results found for "${this._state.searchQuery}"`;
        } else {
          empty.textContent = 'No options available';
        }
        this._optionsContainer.appendChild(empty);
      }
    }
    
    // Append Busy Indicator if busy
    if (this._state.isBusy && this._config.busyBucket.enabled) {
      const busyBucket = document.createElement('div');
      busyBucket.setAttribute('part', 'loading');
      busyBucket.className = 'busy-bucket';
      
      if (this._config.busyBucket.showSpinner) {
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        busyBucket.appendChild(spinner);
      }
      
      if (this._config.busyBucket.message) {
        const message = document.createElement('div');
        message.textContent = this._config.busyBucket.message;
        busyBucket.appendChild(message);
      }
      
      this._optionsContainer.appendChild(busyBucket);
    }
    // Append Load More Trigger (Button or Sentinel) if enabled and not busy
    else if ((this._config.loadMore.enabled || this._config.infiniteScroll.enabled) && this._state.loadedItems.length > 0) {
      this._addLoadMoreTrigger();
    }

    this._finalizePerfMarks();
    
  }

  private _renderSingleOption(item: any, index: number, getValue: (item: any) => any, getLabel: (item: any) => string) {
    const isSelected = this._state.selectedIndices.has(index);
    const isDisabled = Boolean((item as any)?.disabled);
    const optionId = `${this._uniqueId}-option-${index}`;

    if (this._optionRenderer) {
      const rendered = this._optionRenderer(item, index, this._rendererHelpers);
      // Ensure the returned element has the correct classes and listeners
      const optionElement = this._normalizeCustomOptionElement(rendered, {
        index,
        value: getValue(item),
        label: getLabel(item),
        selected: isSelected,
        active: this._state.activeIndex === index,
        disabled: isDisabled,
        id: optionId,
      });
      this._optionsContainer.appendChild(optionElement);
      return;
    }

    const option = new SelectOption({
      item,
      index,
      id: optionId,
      selected: isSelected,
      disabled: isDisabled,
      active: this._state.activeIndex === index,
      getValue,
      getLabel,
      showRemoveButton: this._config.selection.mode === 'multi' && this._config.selection.showRemoveButton,
      classMap: this.classMap,
    });

    // Valid part attribute on the web component host itself
    option.setAttribute('part', 'option');

    option.dataset.index = String(index);
    option.dataset.value = String(getValue(item));
    // New standard attributes on Host
    option.dataset.smIndex = String(index);
    if (!option.hasAttribute('data-sm-selectable')) {
        option.toggleAttribute('data-sm-selectable', true);
    }
    const val = getValue(item);
    if (val != null) {
        option.dataset.smValue = String(val);
    }

    option.id = option.id || optionId;

    option.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent duplicate handling by delegation
      const mouseEvent = e as MouseEvent;
      this._selectOption(index, {
        shiftKey: mouseEvent.shiftKey,
        toggleKey: mouseEvent.ctrlKey || mouseEvent.metaKey,
      });
    });

    option.addEventListener('optionRemove', (event: Event) => {
      const detail = (event as CustomEvent).detail as { index?: number } | undefined;
      const targetIndex = detail?.index ?? index;
      this._handleOptionRemove(targetIndex);
    });

    this._optionsContainer.appendChild(option);
  }

  private _normalizeCustomOptionElement(element: HTMLElement | null | undefined, meta: {
    index: number;
    value: unknown;
    label: string;
    selected: boolean;
    active: boolean;
    disabled: boolean;
    id: string;
  }): HTMLElement {
    const optionEl = element instanceof HTMLElement ? element : document.createElement('div');

    // Add part attribute for styling
    if (!optionEl.hasAttribute('part')) {
      optionEl.setAttribute('part', 'option');
    }

    // Add both semantic namespaced classes and the legacy internal classes that CSS uses
    optionEl.classList.add('smilodon-option', 'option');
    
    // Toggle state classes using classMap if available
    const isSelected = meta.selected;
    const isActive = meta.active;
    const isDisabled = meta.disabled;

    // Resolve classes from classMap or defaults
    const selectedClasses = (this.classMap?.selected ?? 'selected sm-selected').split(' ').filter(Boolean);
    const activeClasses = (this.classMap?.active ?? 'active sm-active').split(' ').filter(Boolean);
    const disabledClasses = (this.classMap?.disabled ?? 'disabled sm-disabled').split(' ').filter(Boolean);

    if (isSelected) {
      optionEl.classList.add(...selectedClasses);
      optionEl.classList.add('smilodon-option--selected');
    } else {
      optionEl.classList.remove(...selectedClasses);
      optionEl.classList.remove('smilodon-option--selected');
    }

    if (isActive) {
      optionEl.classList.add(...activeClasses);
      optionEl.classList.add('smilodon-option--active');
    } else {
      optionEl.classList.remove(...activeClasses);
      optionEl.classList.remove('smilodon-option--active');
    }

    if (isDisabled) {
      optionEl.classList.add(...disabledClasses);
      optionEl.classList.add('smilodon-option--disabled');
    } else {
      optionEl.classList.remove(...disabledClasses);
      optionEl.classList.remove('smilodon-option--disabled');
    }

    // Data Attributes Contract
    const state = [];
    if (isSelected) state.push('selected');
    if (isActive) state.push('active');
    if (state.length) {
      optionEl.dataset.smState = state.join(' ');
    } else {
      delete optionEl.dataset.smState;
    }

    // Legacy data attribute support
    if (!optionEl.hasAttribute('data-selectable')) {
      optionEl.setAttribute('data-selectable', '');
    }
    // New delegation attribute
    if (!optionEl.hasAttribute('data-sm-selectable')) {
        optionEl.setAttribute('data-sm-selectable', '');
    }

    optionEl.dataset.index = String(meta.index);
    optionEl.dataset.value = String(meta.value);
    // New standard attributes
    optionEl.dataset.smIndex = String(meta.index);
    if (meta.value != null) {
        optionEl.dataset.smValue = String(meta.value);
    }
    
    optionEl.id = optionEl.id || meta.id;

    if (!optionEl.getAttribute('role')) {
      optionEl.setAttribute('role', 'option');
    }
    if (!optionEl.getAttribute('aria-label')) {
      optionEl.setAttribute('aria-label', meta.label);
    }
    optionEl.setAttribute('aria-selected', String(meta.selected));
    if (meta.disabled) {
      optionEl.setAttribute('aria-disabled', 'true');
    } else {
      optionEl.removeAttribute('aria-disabled');
    }

    if (!optionEl.hasAttribute('tabindex')) {
      optionEl.tabIndex = -1;
    }

    if (!this._customOptionBoundElements.has(optionEl)) {
      optionEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const current = e.currentTarget as HTMLElement;
        if (current.getAttribute('aria-disabled') === 'true') return;
        const parsedIndex = Number(current.dataset.index);
        if (!Number.isFinite(parsedIndex)) return;
        const mouseEvent = e as MouseEvent;
        this._selectOption(parsedIndex, {
          shiftKey: mouseEvent.shiftKey,
          toggleKey: mouseEvent.ctrlKey || mouseEvent.metaKey,
        });
      });

      optionEl.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const current = e.currentTarget as HTMLElement;
        if (current.getAttribute('aria-disabled') === 'true') return;
        const parsedIndex = Number(current.dataset.index);
        if (!Number.isFinite(parsedIndex)) return;
        e.preventDefault();
        this._selectOption(parsedIndex, {
          shiftKey: e.shiftKey,
          toggleKey: e.ctrlKey || e.metaKey,
        });
      });

      this._customOptionBoundElements.add(optionEl);
    }

    return optionEl;
  }

  private _addLoadMoreTrigger(): void {
    const container = document.createElement('div');
    container.className = 'load-more-container';
    
    if (this._config.infiniteScroll.enabled) {
      // Infinite Scroll: Render an invisible sentinel
      // It must have some height to be intersected
      const sentinel = document.createElement('div');
      sentinel.className = 'infinite-scroll-sentinel';
      sentinel.style.height = '10px';
      sentinel.style.width = '100%';
      sentinel.style.opacity = '0'; // Invisible
      
      this._loadMoreTrigger = sentinel;
      container.appendChild(sentinel);
    } else {
      // Manual Load More: Render a button
      const button = document.createElement('button');
      button.className = 'load-more-button';
      button.textContent = `Load ${this._config.loadMore.itemsPerLoad} more`;
      button.addEventListener('click', () => this._loadMoreItems());
      
      this._loadMoreTrigger = button;
      container.appendChild(button);
    }
    
    this._optionsContainer.appendChild(container);
    
    // Setup intersection observer for auto-load
    if (this._intersectionObserver && this._loadMoreTrigger) {
      this._intersectionObserver.observe(this._loadMoreTrigger);
    }
  }
}

// Register custom element
if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}
