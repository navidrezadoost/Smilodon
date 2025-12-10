/**
 * Enhanced Select Component
 * Implements all advanced features: infinite scroll, load more, busy state, 
 * server-side selection, and full customization
 */

import type { GlobalSelectConfig } from '../config/global-config';
import { selectConfig } from '../config/global-config';
import type { SelectEventName, SelectEventsDetailMap, GroupedItem } from '../types';
import { SelectOption, OptionConfig, OptionEventDetail } from './select-option';

interface PageCache {
  [page: number]: unknown[];
}

interface SelectState {
  isOpen: boolean;
  isBusy: boolean;
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
}

export class EnhancedSelect extends HTMLElement {
  private _config: GlobalSelectConfig;
  private _shadow: ShadowRoot;
  private _container: HTMLElement;
  private _inputContainer: HTMLElement;
  private _input: HTMLInputElement;
  private _dropdown: HTMLElement;
  private _optionsContainer: HTMLElement;
  private _loadMoreButton?: HTMLButtonElement;
  private _busyBucket?: HTMLElement;
  private _liveRegion?: HTMLElement;
  private _state: SelectState;
  private _pageCache: PageCache = {};
  private _resizeObserver?: ResizeObserver;
  private _intersectionObserver?: IntersectionObserver;
  private _busyTimeout?: number;
  private _typeBuffer = '';
  private _typeTimeout?: number;
  private _uniqueId: string;
  private _hasError = false;
  private _errorMessage = '';
  private _boundArrowClick: ((e: Event) => void) | null = null;
  private _arrowContainer?: HTMLElement;

  constructor() {
    super();
    this._shadow = this.attachShadow({ mode: 'open' });
    this._uniqueId = `enhanced-select-${Math.random().toString(36).substr(2, 9)}`;
    
    // Merge global config with component-level config
    this._config = selectConfig.getConfig() as GlobalSelectConfig;
    
    // Initialize state
    this._state = {
      isOpen: false,
      isBusy: false,
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
    };
    
    // Create DOM structure
    this._container = this._createContainer();
    this._inputContainer = this._createInputContainer();
    this._input = this._createInput();
    this._arrowContainer = this._createArrowContainer();
    this._dropdown = this._createDropdown();
    this._optionsContainer = this._createOptionsContainer();
    this._liveRegion = this._createLiveRegion();
    
    this._assembleDOM();
    this._initializeStyles();
    this._attachEventListeners();
    this._initializeObservers();
  }

  connectedCallback(): void {
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
    
    // Cleanup arrow click listener
    if (this._boundArrowClick && this._arrowContainer) {
      this._arrowContainer.removeEventListener('click', this._boundArrowClick);
    }
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
    return container;
  }

  private _createInput(): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'select-input';
    input.placeholder = this._config.placeholder || 'Select an option...';
    input.disabled = !this._config.enabled;
    input.readOnly = !this._config.searchable;
    
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
    dropdown.style.display = 'none';
    
    if (this._config.styles.classNames?.dropdown) {
      dropdown.className += ' ' + this._config.styles.classNames.dropdown;
    }
    
    if (this._config.styles.dropdown) {
      Object.assign(dropdown.style, this._config.styles.dropdown);
    }
    
    dropdown.setAttribute('role', 'listbox');
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
      <svg class="dropdown-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    return container;
  }

  private _assembleDOM(): void {
    this._inputContainer.appendChild(this._input);
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
      }
      
      /* Gradient separator before arrow */
      .input-container::after {
        content: '';
        position: absolute;
        top: 50%;
        right: 40px;
        transform: translateY(-50%);
        width: 1px;
        height: 60%;
        background: linear-gradient(
          to bottom,
          transparent 0%,
          rgba(0, 0, 0, 0.1) 20%,
          rgba(0, 0, 0, 0.1) 80%,
          transparent 100%
        );
        pointer-events: none;
      }
      
      .dropdown-arrow-container {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background-color 0.2s ease;
        border-radius: 0 4px 4px 0;
      }
      
      .dropdown-arrow-container:hover {
        background-color: rgba(102, 126, 234, 0.08);
      }
      
      .dropdown-arrow {
        width: 16px;
        height: 16px;
        color: #667eea;
        transition: transform 0.2s ease, color 0.2s ease;
        transform: translateY(0);
      }
      
      .dropdown-arrow-container:hover .dropdown-arrow {
        color: #667eea;
      }
      
      .dropdown-arrow.open {
        transform: rotate(180deg);
      }
      
      .select-input {
        width: 100%;
        padding: 8px 52px 8px 12px;
        min-height: 44px;
        border: 1px solid var(--select-border-color, #ccc);
        border-radius: var(--select-border-radius, 4px);
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s ease;
      }
      
      .select-input:focus {
        border-color: var(--select-border-focus-color, #1976d2);
        box-shadow: 0 0 0 2px var(--select-shadow-focus-color, rgba(25, 118, 210, 0.1));
        outline: 2px solid var(--select-border-focus-color, #1976d2);
        outline-offset: 2px;
      }
      
      .select-input:disabled {
        background-color: var(--select-disabled-bg, #f5f5f5);
        cursor: not-allowed;
      }
      
      .select-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: 4px;
        max-height: 300px;
        overflow-y: auto;
        background: var(--select-dropdown-bg, white);
        border: 1px solid var(--select-dropdown-border, #ccc);
        border-radius: var(--select-border-radius, 4px);
        box-shadow: var(--select-dropdown-shadow, 0 4px 6px rgba(0,0,0,0.1));
        z-index: var(--select-dropdown-z-index, 1000);
      }
      
      .options-container {
        position: relative;
      }
      
      .load-more-container {
        padding: 12px;
        text-align: center;
        border-top: 1px solid var(--select-divider-color, #e0e0e0);
      }
      
      .load-more-button {
        padding: 8px 16px;
        border: 1px solid var(--select-button-border, #1976d2);
        background: var(--select-button-bg, white);
        color: var(--select-button-color, #1976d2);
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
      }
      
      .load-more-button:hover {
        background: var(--select-button-hover-bg, #1976d2);
        color: var(--select-button-hover-color, white);
      }
      
      .load-more-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .busy-bucket {
        padding: 16px;
        text-align: center;
        color: var(--select-busy-color, #666);
      }
      
      .spinner {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 2px solid var(--select-spinner-color, #ccc);
        border-top-color: var(--select-spinner-active-color, #1976d2);
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .empty-state {
        padding: 24px;
        text-align: center;
        color: var(--select-empty-color, #999);
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
      
      /* Accessibility: Dark mode */
      @media (prefers-color-scheme: dark) {
        .select-input {
          background: var(--select-dark-bg, #1f2937);
          color: var(--select-dark-text, #f9fafb);
          border-color: var(--select-dark-border, #4b5563);
        }
        
        .select-dropdown {
          background: var(--select-dark-dropdown-bg, #1f2937);
          border-color: var(--select-dark-dropdown-border, #4b5563);
          color: var(--select-dark-text, #f9fafb);
        }
        
        .busy-bucket {
          color: var(--select-dark-busy-color, #9ca3af);
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
    this._shadow.appendChild(style);
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
    
    // Input focus/blur
    this._input.addEventListener('focus', () => this._handleOpen());
    this._input.addEventListener('blur', (e) => {
      // Delay to allow option click
      setTimeout(() => {
        if (!this._dropdown.contains(document.activeElement)) {
          this._handleClose();
        }
      }, 200);
    });
    
    // Input search
    if (this._config.searchable) {
      this._input.addEventListener('input', (e) => {
        this._state.searchQuery = (e.target as HTMLInputElement).value;
        this._handleSearch(this._state.searchQuery);
      });
    }
    
    // Keyboard navigation
    this._input.addEventListener('keydown', (e) => this._handleKeydown(e));
    
    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!this._container.contains(e.target as Node)) {
        this._handleClose();
      }
    });
  }

  private _initializeObservers(): void {
    // Intersection observer for infinite scroll
    if (this._config.infiniteScroll.enabled) {
      this._intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !this._state.isBusy) {
              this._loadMoreItems();
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
    
    this._state.isOpen = true;
    this._dropdown.style.display = 'block';
    this._input.setAttribute('aria-expanded', 'true');
    this._updateArrowRotation();
    
    this._emit('open', {});
    this._config.callbacks.onOpen?.();
    
    // Scroll to selected if configured
    if (this._config.scrollToSelected.enabled) {
      this._scrollToSelected();
    }
  }

  private _handleClose(): void {
    if (!this._state.isOpen) return;
    
    this._state.isOpen = false;
    this._dropdown.style.display = 'none';
    this._input.setAttribute('aria-expanded', 'false');
    this._updateArrowRotation();
    
    this._emit('close', {});
    this._config.callbacks.onClose?.();
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

  private _handleSearch(query: string): void {
    // Get filtered items based on search query
    const filteredItems = query 
      ? this._state.loadedItems.filter((item: any) => {
          const label = item?.label || String(item);
          return label.toLowerCase().includes(query.toLowerCase());
        })
      : this._state.loadedItems;
    
    const count = filteredItems.length;
    
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
          this._moveActive(1);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!this._state.isOpen) {
          this._handleOpen();
        } else {
          this._moveActive(-1);
        }
        break;
      case 'Home':
        e.preventDefault();
        if (this._state.isOpen) {
          this._setActive(0);
        }
        break;
      case 'End':
        e.preventDefault();
        if (this._state.isOpen) {
          const options = Array.from(this._optionsContainer.children) as SelectOption[];
          this._setActive(options.length - 1);
        }
        break;
      case 'PageDown':
        e.preventDefault();
        if (this._state.isOpen) {
          this._moveActive(10);
        }
        break;
      case 'PageUp':
        e.preventDefault();
        if (this._state.isOpen) {
          this._moveActive(-10);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (this._state.activeIndex >= 0) {
          this._selectOption(this._state.activeIndex);
        }
        break;
      case 'Escape':
        e.preventDefault();
        this._handleClose();
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

  private _moveActive(delta: number): void {
    const options = Array.from(this._optionsContainer.children) as SelectOption[];
    const next = Math.max(0, Math.min(options.length - 1, this._state.activeIndex + delta));
    this._setActive(next);
  }

  private _setActive(index: number): void {
    const options = Array.from(this._optionsContainer.children) as SelectOption[];
    
    // Clear previous active state
    if (this._state.activeIndex >= 0 && options[this._state.activeIndex]) {
      options[this._state.activeIndex].setActive(false);
    }
    
    this._state.activeIndex = index;
    
    // Set new active state
    if (options[index]) {
      options[index].setActive(true);
      options[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      
      // Announce position for screen readers
      const total = options.length;
      this._announce(`Item ${index + 1} of ${total}`);
      
      // Update aria-activedescendant
      const optionId = `${this._uniqueId}-option-${index}`;
      this._input.setAttribute('aria-activedescendant', optionId);
    }
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
    
    const options = Array.from(this._optionsContainer.children) as SelectOption[];
    const maxSelections = this._config.selection.maxSelections || 0;
    
    options.forEach((option, index) => {
      if (maxSelections > 0 && this._state.selectedIndices.size >= maxSelections) {
        return;
      }
      
      if (!this._state.selectedIndices.has(index)) {
        const config = option.getConfig();
        this._state.selectedIndices.add(index);
        this._state.selectedItems.set(index, config.item);
        option.setSelected(true);
      }
    });
    
    this._updateInputDisplay();
    this._emitChange();
    this._announce(`Selected all ${options.length} items`);
  }

  private _announce(message: string): void {
    if (this._liveRegion) {
      this._liveRegion.textContent = message;
      setTimeout(() => {
        if (this._liveRegion) this._liveRegion.textContent = '';
      }, 1000);
    }
  }

  private _selectOption(index: number): void {
    const option = this._optionsContainer.children[index] as SelectOption;
    if (!option) return;
    
    const config = option.getConfig();
    const isCurrentlySelected = this._state.selectedIndices.has(index);
    
    if (this._config.selection.mode === 'single') {
      // Single select: clear previous and select new
      this._state.selectedIndices.clear();
      this._state.selectedItems.clear();
      
      if (!isCurrentlySelected || this._config.selection.allowDeselect) {
        const newSelected = !isCurrentlySelected;
        
        if (newSelected) {
          this._state.selectedIndices.add(index);
          this._state.selectedItems.set(index, config.item);
        }
        
        option.setSelected(newSelected);
      }
      
      if (this._config.selection.closeOnSelect) {
        this._handleClose();
      }
    } else {
      // Multi select
      const maxSelections = this._config.selection.maxSelections || 0;
      
      if (isCurrentlySelected) {
        this._state.selectedIndices.delete(index);
        this._state.selectedItems.delete(index);
        option.setSelected(false);
      } else {
        if (maxSelections > 0 && this._state.selectedIndices.size >= maxSelections) {
          return; // Max selections reached
        }
        
        this._state.selectedIndices.add(index);
        this._state.selectedItems.set(index, config.item);
        option.setSelected(true);
      }
    }
    
    this._updateInputDisplay();
    this._emitChange();
    
    // Call user callback
    const getValue = this._config.serverSide.getValueFromItem || ((item) => (item as any)?.value ?? item);
    const getLabel = this._config.serverSide.getLabelFromItem || ((item) => (item as any)?.label ?? String(item));
    
    this._config.callbacks.onSelect?.({
      item: config.item,
      index,
      value: getValue(config.item),
      label: getLabel(config.item),
      selected: this._state.selectedIndices.has(index),
    });
  }

  private _handleOptionRemove(index: number): void {
    const option = this._optionsContainer.children[index] as SelectOption;
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
    } else if (this._config.selection.mode === 'single') {
      this._input.value = getLabel(selectedItems[0]);
    } else {
      this._input.value = `${selectedItems.length} selected`;
    }
  }

  private _scrollToSelected(): void {
    if (this._state.selectedIndices.size === 0) return;
    
    const target = this._config.scrollToSelected.multiSelectTarget;
    const indices = Array.from(this._state.selectedIndices).sort((a, b) => a - b);
    const targetIndex = target === 'first' ? indices[0] : indices[indices.length - 1];
    
    const option = this._optionsContainer.children[targetIndex] as SelectOption;
    if (option) {
      option.scrollIntoView({
        block: this._config.scrollToSelected.block || 'nearest',
        behavior: this._config.scrollToSelected.behavior || 'smooth',
      });
    }
  }

  private async _loadMoreItems(): Promise<void> {
    if (this._state.isBusy) return;
    
    this._setBusy(true);
    
    // Save scroll position before loading
    if (this._dropdown) {
      console.log('[InfiniteScroll] loadMore: before render', {
        scrollTop: this._dropdown.scrollTop,
        scrollHeight: this._dropdown.scrollHeight,
        clientHeight: this._dropdown.clientHeight
      });
      
      // Remember the exact scrollTop so we can restore it
      // after new items are appended.
      this._state.lastScrollPosition = this._dropdown.scrollTop;
      this._state.preserveScrollPosition = true;
      
      // Update dropdown to show loading indicator but keep the
      // same scrollTop so the visible items don't move.
      this._renderOptions();
      this._dropdown.scrollTop = this._state.lastScrollPosition;
      
      console.log('[InfiniteScroll] loadMore: after render (with loader)', {
        scrollTop: this._dropdown.scrollTop,
        scrollHeight: this._dropdown.scrollHeight,
        clientHeight: this._dropdown.clientHeight
      });
    }
    
    try {
      // Simulate loading more items (replace with actual data fetching)
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const itemsToLoad = this._config.loadMore.itemsPerLoad;
      // const newItems = await fetchItems(this._state.currentPage + 1, itemsToLoad);
      
      // For now, just emit event for parent to handle
      this._state.currentPage++;
      
      this._emit('loadMore', { page: this._state.currentPage, items: [] });
      this._config.callbacks.onLoadMore?.(this._state.currentPage);
    } catch (error) {
      this._handleError(error as Error);
    } finally {
      this._setBusy(false);
    }
  }

  private _setBusy(busy: boolean): void {
    this._state.isBusy = busy;
    
    if (!this._config.busyBucket.enabled) return;
    
    if (busy) {
      const minDisplay = this._config.busyBucket.minDisplayTime || 200;
      
      this._busyTimeout = window.setTimeout(() => {
        this._showBusyBucket();
      }, 0);
    } else {
      if (this._busyTimeout) {
        clearTimeout(this._busyTimeout);
        this._busyTimeout = undefined;
      }
      
      setTimeout(() => {
        this._hideBusyBucket();
      }, this._config.busyBucket.minDisplayTime || 200);
    }
  }

  private _showBusyBucket(): void {
    if (!this._busyBucket) {
      this._busyBucket = document.createElement('div');
      this._busyBucket.className = 'busy-bucket';
      
      if (this._config.busyBucket.showSpinner) {
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        this._busyBucket.appendChild(spinner);
      }
      
      if (this._config.busyBucket.message) {
        const message = document.createElement('div');
        message.textContent = this._config.busyBucket.message;
        this._busyBucket.appendChild(message);
      }
    }
    
    this._dropdown.appendChild(this._busyBucket);
  }

  private _hideBusyBucket(): void {
    if (this._busyBucket && this._busyBucket.parentNode) {
      this._busyBucket.parentNode.removeChild(this._busyBucket);
    }
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
      
      console.log('[InfiniteScroll] setItems: before render', {
        previousLength,
        newLength,
        lastScrollPosition: this._state.lastScrollPosition,
        scrollTop: this._dropdown.scrollTop,
        scrollHeight: this._dropdown.scrollHeight,
        clientHeight: this._dropdown.clientHeight
      });
      
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
          
          console.log('[InfiniteScroll] setItems: after render', {
            newLength,
            lastScrollPosition: this._state.lastScrollPosition,
            scrollTop: this._dropdown.scrollTop,
            scrollHeight: this._dropdown.scrollHeight,
            clientHeight: this._dropdown.clientHeight
          });
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
    this._renderOptions();
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
    this._optionsContainer.innerHTML = '';
    
    if (this._state.loadedItems.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No options available';
      this._optionsContainer.appendChild(empty);
      return;
    }
    
    const getValue = this._config.serverSide.getValueFromItem || ((item) => (item as any)?.value ?? item);
    const getLabel = this._config.serverSide.getLabelFromItem || ((item) => (item as any)?.label ?? String(item));
    
    this._state.loadedItems.forEach((item, index) => {
      const isSelected = this._state.selectedIndices.has(index);
      
      const optionConfig: OptionConfig = {
        item,
        index,
        selected: isSelected,
        getValue,
        getLabel,
        showRemoveButton: this._config.selection.showRemoveButton && this._config.selection.mode === 'multi',
        style: isSelected ? this._config.styles.selectedOption : this._config.styles.option,
        className: isSelected 
          ? this._config.styles.classNames?.selectedOption 
          : this._config.styles.classNames?.option,
      };
      
      const option = new SelectOption(optionConfig);
      
      // Set unique ID for aria-activedescendant
      option.id = `${this._uniqueId}-option-${index}`;
      
      // Listen to option events
      option.addEventListener('optionSelect', ((e: CustomEvent<OptionEventDetail>) => {
        this._selectOption(e.detail.index);
        this._announce(`Selected ${getLabel(item)}`);
      }) as EventListener);
      
      option.addEventListener('optionRemove', ((e: CustomEvent<OptionEventDetail>) => {
        this._handleOptionRemove(e.detail.index);
        this._announce(`Removed ${getLabel(item)}`);
      }) as EventListener);
      
      this._optionsContainer.appendChild(option);
    });
    
    // Add load more button if configured
    if (this._config.loadMore.enabled && this._state.loadedItems.length > 0) {
      this._addLoadMoreButton();
    }
  }

  private _addLoadMoreButton(): void {
    const container = document.createElement('div');
    container.className = 'load-more-container';
    
    this._loadMoreButton = document.createElement('button');
    this._loadMoreButton.className = 'load-more-button';
    this._loadMoreButton.textContent = `Load ${this._config.loadMore.itemsPerLoad} more`;
    this._loadMoreButton.addEventListener('click', () => this._loadMoreItems());
    
    container.appendChild(this._loadMoreButton);
    this._dropdown.appendChild(container);
    
    // Setup intersection observer for auto-load
    if (this._intersectionObserver) {
      this._intersectionObserver.observe(this._loadMoreButton);
    }
  }
}

// Register custom element
if (!customElements.get('enhanced-select')) {
  customElements.define('enhanced-select', EnhancedSelect);
}
