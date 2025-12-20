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
    if (this._searchTimeout) clearTimeout(this._searchTimeout);
    
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
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
        padding: 6px 52px 6px 8px;
        min-height: 44px;
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        box-sizing: border-box;
        transition: all 0.2s ease;
      }
      
      .input-container:focus-within {
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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
        z-index: 1;
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
        z-index: 2;
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
        flex: 1;
        min-width: 120px;
        padding: 4px;
        border: none;
        font-size: 14px;
        line-height: 1.5;
        color: #1f2937;
        background: transparent;
        box-sizing: border-box;
        outline: none;
      }
      
      .select-input::placeholder {
        color: #9ca3af;
      }
      
      .selection-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        margin: 2px;
        background: #667eea;
        color: white;
        border-radius: 4px;
        font-size: 13px;
        line-height: 1;
      }
      
      .badge-remove {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        padding: 0;
        margin-left: 4px;
        background: rgba(255, 255, 255, 0.3);
        border: none;
        border-radius: 50%;
        color: white;
        font-size: 16px;
        line-height: 1;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .badge-remove:hover {
        background: rgba(255, 255, 255, 0.5);
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
        transition: opacity 0.2s ease-in-out;
      }

      .option {
        padding: 8px 12px;
        cursor: pointer;
        color: inherit;
        transition: background-color 0.15s ease;
        user-select: none;
      }

      .option:hover {
        background-color: #f3f4f6;
      }

      .option.selected {
        background-color: #e0e7ff;
        color: #4338ca;
        font-weight: 500;
      }

      .option.active {
        background-color: #f3f4f6;
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
      
      .searching-state {
        padding: 24px;
        text-align: center;
        color: #667eea;
        font-style: italic;
        animation: pulse 1.5s ease-in-out infinite;
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
        
        .option:hover {
          background-color: var(--select-dark-option-hover-bg, #374151);
        }
        
        .option.selected {
          background-color: var(--select-dark-option-selected-bg, #3730a3);
          color: var(--select-dark-option-selected-text, #e0e7ff);
        }
        
        .option.active {
          background-color: var(--select-dark-option-active-bg, #374151);
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
    
    // Input container click - prevent event from reaching document listener
    this._container.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
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
    this._input.addEventListener('input', (e) => {
      if (!this._config.searchable) return;
      const query = (e.target as HTMLInputElement).value;
      this._handleSearch(query);
    });
    
    // Keyboard navigation
    this._input.addEventListener('keydown', (e) => this._handleKeydown(e));
    
    // Click outside to close
    document.addEventListener('click', (e) => {
      const target = e.target as Node;
      // Check if click is outside shadow root
      if (!this._shadow.contains(target) && !this._container.contains(target)) {
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
    
    this._emit('open', {});
    this._config.callbacks.onOpen?.();
    
    // Scroll to selected if configured
    if (this._config.scrollToSelected.enabled) {
      // Use setTimeout to allow render to complete
      setTimeout(() => this._scrollToSelected(), 0);
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
    this._state.searchQuery = query;
    
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
    // FIX: Do not rely on this._optionsContainer.children[index] because filtering changes the children
    // Instead, use the index to update state directly
    
    const item = this._state.loadedItems[index];
    if (!item) return;
    
    const config = { item }; // Minimal config needed
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
    
    this._updateInputDisplay();
    this._emitChange();
    
    // Call user callback
    const getValue = this._config.serverSide.getValueFromItem || ((item) => (item as any)?.value ?? item);
    const getLabel = this._config.serverSide.getLabelFromItem || ((item) => (item as any)?.label ?? String(item));
    
    this._config.callbacks.onSelect?.({
      item: item,
      index,
      value: getValue(item),
      label: getLabel(item),
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
        badge.textContent = getLabel(item);
        
        // Add remove button to badge
        const removeBtn = document.createElement('button');
        removeBtn.className = 'badge-remove';
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
    const targetIndex = target === 'first' ? indices[0] : indices[indices.length - 1];
    
    // FIX: Find the option element by ID instead of index in children
    // because children list might be filtered or reordered
    const optionId = `${this._uniqueId}-option-${targetIndex}`;
    // We need to search in shadow root or options container
    // Since options are custom elements, we can find them by ID if we set it (we do)
    // But wait, we set ID on the element instance, but is it in the DOM?
    // If filtered out, it won't be in the DOM.
    
    // If we are searching, we might not want to scroll to selected if it's not visible
    // But if we just opened the dropdown, we usually want to see the selected item.
    // If the selected item is filtered out, we can't scroll to it.
    
    // Try to find the element in the options container
    // Note: querySelector on shadowRoot works if we set the ID attribute
    // In _renderOptions we set: option.id = ...
    
    const option = this._optionsContainer.querySelector(`[id="${optionId}"]`);
    
    if (option) {
      option.scrollIntoView({
        block: this._config.scrollToSelected.block || 'center',
        behavior: 'smooth',
      });
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
    
    // Trigger re-render to show/hide busy indicator
    // We use _renderOptions to handle the UI update
    this._renderOptions();
  }

  private _showBusyBucket(): void {
    // Deprecated: Logic moved to _renderOptions
  }

  private _hideBusyBucket(): void {
    // Deprecated: Logic moved to _renderOptions
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
    }
    
    // Re-initialize observers in case infinite scroll was enabled/disabled
    this._initializeObservers();
    
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
          this._renderSingleOption(item, getValue, getLabel);
        });
      });
    } else {
      // Normal rendering (flat list or filtered)
      const itemsToRender = query
        ? this._state.loadedItems.filter((item) => {
            try {
              const label = String(getLabel(item)).toLowerCase();
              return label.includes(query);
            } catch (e) {
              return false;
            }
          })
        : this._state.loadedItems;
      
      if (itemsToRender.length === 0 && !this._state.isBusy) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        if (query) {
          empty.textContent = `No results found for "${this._state.searchQuery}"`;
        } else {
          empty.textContent = 'No options available';
        }
        this._optionsContainer.appendChild(empty);
      } else {
        itemsToRender.forEach((item) => {
          this._renderSingleOption(item, getValue, getLabel);
        });
      }
    }
    
    // Append Busy Indicator if busy
    if (this._state.isBusy && this._config.busyBucket.enabled) {
      const busyBucket = document.createElement('div');
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
  }

  private _renderSingleOption(item: any, getValue: (item: any) => any, getLabel: (item: any) => string) {
    const option = document.createElement('div');
    option.className = 'option';
    const value = getValue(item);
    const label = getLabel(item);
    
    option.textContent = label;
    option.dataset.value = String(value);
    
    // Check if selected using selectedItems map
    const isSelected = Array.from(this._state.selectedItems.values()).some(selectedItem => {
        const selectedValue = getValue(selectedItem);
        return selectedValue === value;
    });
    
    if (isSelected) {
      option.classList.add('selected');
    }
    
    option.addEventListener('click', () => {
      const index = this._state.loadedItems.indexOf(item);
      if (index !== -1) {
        this._selectOption(index);
      }
    });
    
    this._optionsContainer.appendChild(option);
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
