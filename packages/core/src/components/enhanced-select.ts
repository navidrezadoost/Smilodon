/**
 * Enhanced Select Component
 * Implements all advanced features: infinite scroll, load more, busy state, 
 * server-side selection, and full customization
 */

import type { GlobalSelectConfig } from '../config/global-config';
import { selectConfig } from '../config/global-config';
import type { SelectEventName, SelectEventsDetailMap } from '../types';
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
  private _state: SelectState;
  private _pageCache: PageCache = {};
  private _resizeObserver?: ResizeObserver;
  private _intersectionObserver?: IntersectionObserver;
  private _busyTimeout?: number;

  constructor() {
    super();
    this._shadow = this.attachShadow({ mode: 'open' });
    
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
    };
    
    // Create DOM structure
    this._container = this._createContainer();
    this._inputContainer = this._createInputContainer();
    this._input = this._createInput();
    this._dropdown = this._createDropdown();
    this._optionsContainer = this._createOptionsContainer();
    
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

  private _assembleDOM(): void {
    this._inputContainer.appendChild(this._input);
    this._container.appendChild(this._inputContainer);
    
    this._dropdown.appendChild(this._optionsContainer);
    this._container.appendChild(this._dropdown);
    
    this._shadow.appendChild(this._container);
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
      
      .select-input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid var(--select-border-color, #ccc);
        border-radius: var(--select-border-radius, 4px);
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s ease;
      }
      
      .select-input:focus {
        border-color: var(--select-border-focus-color, #1976d2);
        box-shadow: 0 0 0 2px var(--select-shadow-focus-color, rgba(25, 118, 210, 0.1));
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
    `;
    this._shadow.appendChild(style);
  }

  private _attachEventListeners(): void {
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
    
    this._emit('close', {});
    this._config.callbacks.onClose?.();
  }

  private _handleSearch(query: string): void {
    this._emit('search', { query });
    this._config.callbacks.onSearch?.(query);
    // Implement filtering logic here or delegate to parent
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
        this._moveActive(-1);
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
    }
  }

  private _moveActive(delta: number): void {
    const options = Array.from(this._optionsContainer.children) as SelectOption[];
    const next = Math.max(0, Math.min(options.length - 1, this._state.activeIndex + delta));
    
    // Update active state
    if (this._state.activeIndex >= 0 && options[this._state.activeIndex]) {
      options[this._state.activeIndex].setActive(false);
    }
    
    this._state.activeIndex = next;
    
    if (options[next]) {
      options[next].setActive(true);
      options[next].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
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
    this._state.loadedItems = items;
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
      
      // Listen to option events
      option.addEventListener('optionSelect', ((e: CustomEvent<OptionEventDetail>) => {
        this._selectOption(e.detail.index);
      }) as EventListener);
      
      option.addEventListener('optionRemove', ((e: CustomEvent<OptionEventDetail>) => {
        this._handleOptionRemove(e.detail.index);
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
