/**
 * Enhanced Select Component
 * Implements all advanced features: infinite scroll, load more, busy state, 
 * server-side selection, and full customization
 * 
 * ✨ Redesigned with formal elegance, refined microinteractions, and polished UX
 */

import type { GlobalSelectConfig } from '../config/global-config';
import { selectConfig } from '../config/global-config';
import type {
  SelectEventName,
  SelectEventsDetailMap,
  GroupedItem,
  RendererHelpers,
  ClassMap,
  SelectCapabilitiesReport,
  LimitationState,
  LimitationPolicyMap,
  KnownLimitationId,
  TrackingSnapshot,
  TrackingEntry,
} from '../types';
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
  /** live set of all connected instances; used to auto-close siblings */
  private static _instances: Set<EnhancedSelect> = new Set();

  private _config: GlobalSelectConfig;
  private _shadow: ShadowRoot;
  private _container: HTMLElement;
  private _inputContainer: HTMLElement;
  private _inputContent: HTMLElement;
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
  private _groupHeaderRenderer?: import('../types').GroupHeaderRenderer;
  private _classMap?: ClassMap;
  private _rendererHelpers: RendererHelpers;
  private _customOptionBoundElements = new WeakSet<HTMLElement>();
  private _mirrorGlobalStylesForCustomOptions = false;
  private _globalStylesObserver: MutationObserver | null = null;
  private _globalStylesContainer: HTMLElement | null = null;
  private _tracking: TrackingSnapshot = { events: [], styles: [], limitations: [] };
  private _suppressBlurClose = false;
  private _renderCycleId = 0;
  private _suppressNextOpenClick = false;
  private _resolvedDropdownPlacement: 'bottom' | 'top' = 'bottom';
  private _multiScrollDrag = {
    active: false,
    moved: false,
    pointerId: -1,
    startX: 0,
    startScrollLeft: 0,
  };
  private _liftedAncestors: Array<{
    element: HTMLElement;
    position: string;
    zIndex: string;
    hadMarker: boolean;
  }> = [];

  get classMap(): ClassMap | undefined {
    return this._classMap;
  }

  set classMap(map: ClassMap | undefined) {
    this._classMap = map;
    this._setGlobalStylesMirroring(Boolean(this._optionRenderer || map || this._groupHeaderRenderer));
    this._track('style', 'classMapChanged', {
      hasClassMap: Boolean(map),
      keys: map ? Object.keys(map) : [],
    });

    if (!this.isConnected) return;
    this._renderOptions();
  }

  /**
   * DOM-based renderer for group headers.  When provided, the component will
   * call this function for each group during rendering.  The returned element
   * will receive `.group-header` and `part="group-header"` automatically.
   */
  get groupHeaderRenderer(): import('../types').GroupHeaderRenderer | undefined {
    return this._groupHeaderRenderer;
  }

  set groupHeaderRenderer(renderer: import('../types').GroupHeaderRenderer | undefined) {
    this._groupHeaderRenderer = renderer;
    this._setGlobalStylesMirroring(Boolean(this._optionRenderer || this._classMap || renderer));
    this._track('style', 'groupHeaderRendererChanged', { enabled: Boolean(renderer) });

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
    this._inputContent = this._createInputContent();
    this._input = this._createInput();
    this._arrowContainer = this._createArrowContainer();
    this._clearControl = this._createClearControl();
    this._dropdown = this._createDropdown();
    this._optionsContainer = this._createOptionsContainer();
    this._liveRegion = this._createLiveRegion();
    
    // Initialize styles BEFORE assembling DOM (order matters in shadow DOM)
    this._initializeStyles();
    this._syncStyleConfigVariables();
    this._syncDirectionConfig();
    this._assembleDOM();
    this._attachEventListeners();
    this._initializeObservers();
  }

  connectedCallback(): void {
    // register instance
    EnhancedSelect._instances.add(this);

    // WORKAROUND: Force display style on host element for Angular compatibility
    // Angular's rendering seems to not apply :host styles correctly in some cases
    // Must be done in connectedCallback when element is attached to DOM
    this.style.display = 'block';

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
    // unregister instance
    EnhancedSelect._instances.delete(this);

    // Cleanup observers
    this._resizeObserver?.disconnect();
    this._intersectionObserver?.disconnect();
    if (this._busyTimeout) clearTimeout(this._busyTimeout);
    if (this._typeTimeout) clearTimeout(this._typeTimeout);
    if (this._searchTimeout) clearTimeout(this._searchTimeout);
    this._endMultiScrollDrag();
    
    // Cleanup arrow click listener
    if (this._boundArrowClick && this._arrowContainer) {
      this._arrowContainer.removeEventListener('click', this._boundArrowClick);
    }

    this._renderCycleId += 1;

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
    this._track('style', 'globalStylesMirroringChanged', { enabled });

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

    const inputStyles = this._config.styles.input;
    if (inputStyles && !this._config.styles.container) {
      const shellStyleKeys = [
        'background',
        'backgroundColor',
        'border',
        'borderColor',
        'borderStyle',
        'borderWidth',
        'borderRadius',
        'boxShadow',
        'padding',
        'height',
        'minHeight',
        'maxHeight',
      ] as const;

      for (const key of shellStyleKeys) {
        const value = (inputStyles as any)[key];
        if (value != null && value !== '') {
          (container.style as any)[key] = value;
        }
      }
    }

    return container;
  }

  private _createInputContent(): HTMLElement {
    const content = document.createElement('div');
    content.className = 'input-content';
    return content;
  }

  private _setCssVariable(name: string, value: unknown): void {
    if (value == null || value === '') {
      this.style.removeProperty(name);
      return;
    }

    this.style.setProperty(name, String(value));
  }

  private _applyStyleVariableMap(
    styleConfig: Partial<CSSStyleDeclaration> | undefined,
    variableMap: Record<string, string>,
  ): void {
    Object.entries(variableMap).forEach(([styleKey, variableName]) => {
      this._setCssVariable(variableName, (styleConfig as Record<string, unknown> | undefined)?.[styleKey]);
    });
  }

  private _syncStyleConfigVariables(): void {
    const styles = this._config.styles;

    this._applyStyleVariableMap(styles.option, {
      background: '--select-option-bg',
      backgroundColor: '--select-option-bg',
      color: '--select-option-color',
      border: '--select-option-border',
      borderBottom: '--select-option-border-bottom',
      borderRadius: '--select-option-border-radius',
      boxShadow: '--select-option-shadow',
      transform: '--select-option-transform',
      padding: '--select-option-padding',
      margin: '--select-option-margin',
      fontSize: '--select-option-font-size',
      fontWeight: '--select-option-font-weight',
      lineHeight: '--select-option-line-height',
      textAlign: '--select-option-text-align',
    });

    this._applyStyleVariableMap(styles.selectedOption, {
      background: '--select-option-selected-bg',
      backgroundColor: '--select-option-selected-bg',
      color: '--select-option-selected-color',
      border: '--select-option-selected-border',
      borderBottom: '--select-option-selected-border-bottom',
      borderRadius: '--select-option-selected-border-radius',
      boxShadow: '--select-option-selected-shadow',
      transform: '--select-option-selected-transform',
      fontWeight: '--select-option-selected-weight',
    });

    this._applyStyleVariableMap(styles.hoverOption, {
      background: '--select-option-hover-bg',
      backgroundColor: '--select-option-hover-bg',
      color: '--select-option-hover-color',
      border: '--select-option-hover-border',
      borderBottom: '--select-option-hover-border-bottom',
      boxShadow: '--select-option-hover-shadow',
      transform: '--select-option-hover-transform',
    });

    this._applyStyleVariableMap(styles.activeOption, {
      background: '--select-option-active-bg',
      backgroundColor: '--select-option-active-bg',
      color: '--select-option-active-color',
      border: '--select-option-active-border',
      outline: '--select-option-active-outline',
      outlineOffset: '--select-option-active-outline-offset',
      boxShadow: '--select-option-active-shadow',
      transform: '--select-option-active-transform',
    });

    this._applyStyleVariableMap(styles.disabledOption, {
      background: '--select-option-disabled-bg',
      backgroundColor: '--select-option-disabled-bg',
      color: '--select-option-disabled-color',
      border: '--select-option-disabled-border',
      borderBottom: '--select-option-disabled-border-bottom',
      opacity: '--select-option-disabled-opacity',
      cursor: '--select-option-disabled-cursor',
    });

    this._applyStyleVariableMap(styles.badge, {
      width: '--select-badge-width',
      minWidth: '--select-badge-min-width',
      maxWidth: '--select-badge-max-width',
      height: '--select-badge-height',
      minHeight: '--select-badge-min-height',
      padding: '--select-badge-padding',
      margin: '--select-badge-margin',
      gap: '--select-badge-gap',
      background: '--select-badge-bg',
      backgroundColor: '--select-badge-bg',
      color: '--select-badge-color',
      border: '--select-badge-border',
      borderRadius: '--select-badge-border-radius',
      boxShadow: '--select-badge-shadow',
      fontSize: '--select-badge-font-size',
      fontWeight: '--select-badge-font-weight',
      lineHeight: '--select-badge-line-height',
      letterSpacing: '--select-badge-letter-spacing',
    });

    this._applyStyleVariableMap(styles.badgeHover, {
      background: '--select-badge-hover-bg',
      backgroundColor: '--select-badge-hover-bg',
      color: '--select-badge-hover-color',
      border: '--select-badge-hover-border',
      boxShadow: '--select-badge-hover-shadow',
      transform: '--select-badge-hover-transform',
    });

    this._applyStyleVariableMap(styles.badgeActive, {
      background: '--select-badge-active-bg',
      backgroundColor: '--select-badge-active-bg',
      color: '--select-badge-active-color',
      border: '--select-badge-active-border',
      boxShadow: '--select-badge-active-shadow',
      transform: '--select-badge-active-transform',
    });

    this._applyStyleVariableMap(styles.badgeLabel, {
      color: '--select-badge-label-color',
      fontSize: '--select-badge-label-font-size',
      fontWeight: '--select-badge-label-font-weight',
      lineHeight: '--select-badge-label-line-height',
      letterSpacing: '--select-badge-label-letter-spacing',
      textAlign: '--select-badge-label-text-align',
    });

    this._applyStyleVariableMap(styles.badgeRemove, {
      width: '--select-badge-remove-size',
      height: '--select-badge-remove-size',
      minWidth: '--select-badge-remove-min-width',
      minHeight: '--select-badge-remove-min-height',
      marginLeft: '--select-badge-remove-margin-left',
      background: '--select-badge-remove-bg',
      backgroundColor: '--select-badge-remove-bg',
      border: '--select-badge-remove-border',
      borderRadius: '--select-badge-remove-radius',
      color: '--select-badge-remove-color',
      fontSize: '--select-badge-remove-font-size',
      fontWeight: '--select-badge-remove-font-weight',
    });

    this._applyStyleVariableMap(styles.badgeRemoveHover, {
      background: '--select-badge-remove-hover-bg',
      backgroundColor: '--select-badge-remove-hover-bg',
      color: '--select-badge-remove-hover-color',
      border: '--select-badge-remove-hover-border',
      boxShadow: '--select-badge-remove-hover-shadow',
      transform: '--select-badge-remove-hover-transform',
    });

    this._applyStyleVariableMap(styles.badgeRemoveActive, {
      background: '--select-badge-remove-active-bg',
      backgroundColor: '--select-badge-remove-active-bg',
      color: '--select-badge-remove-active-color',
      border: '--select-badge-remove-active-border',
      boxShadow: '--select-badge-remove-active-shadow',
      transform: '--select-badge-remove-active-transform',
    });

    this._applyStyleVariableMap(styles.groupHeader, {
      padding: '--select-group-header-padding',
      margin: '--select-group-header-margin',
      color: '--select-group-header-color',
      background: '--select-group-header-bg',
      backgroundColor: '--select-group-header-bg',
      border: '--select-group-header-border',
      borderBottom: '--select-group-header-border-bottom',
      borderRadius: '--select-group-header-border-radius',
      boxShadow: '--select-group-header-shadow',
      textAlign: '--select-group-header-text-align',
      fontSize: '--select-group-header-font-size',
      fontWeight: '--select-group-header-weight',
      textTransform: '--select-group-header-text-transform',
      letterSpacing: '--select-group-header-letter-spacing',
    });
  }

  private _resolveDropdownPlacement(): 'bottom' | 'top' {
    const placementMode = this._config.dropdownPlacement?.mode ?? 'bottom';
    if (placementMode === 'bottom' || placementMode === 'top') {
      return placementMode;
    }

    const hostRect = this._container.getBoundingClientRect();
    const availableBelow = window.innerHeight - hostRect.bottom;
    const computedDropdown = window.getComputedStyle(this._dropdown);
    const maxHeight = Number.parseFloat(computedDropdown.maxHeight || '0');
    const desiredHeight = Number.isFinite(maxHeight) && maxHeight > 0
      ? Math.min(this._dropdown.scrollHeight, maxHeight)
      : this._dropdown.scrollHeight;

    return availableBelow >= desiredHeight ? 'bottom' : 'top';
  }

  private _syncDropdownPlacement(): void {
    if (!this._dropdown) return;

    this._resolvedDropdownPlacement = this._resolveDropdownPlacement();
    this._dropdown.setAttribute('data-placement', this._resolvedDropdownPlacement);
  }

  private _syncDirectionConfig(): void {
    this.setAttribute('dir', this._config.direction ?? 'ltr');
  }

  private _setIconContent(target: HTMLElement, markup: string | undefined, fallback: string): void {
    const content = markup && markup.trim() ? markup : fallback;
    target.innerHTML = '';

    if (content.trim().startsWith('<')) {
      target.innerHTML = content;
      return;
    }

    target.textContent = content;
  }

  private _syncInputContainerMode(): void {
    if (!this._inputContainer || !this._input) return;

    const isMulti = this._config.selection.mode === 'multi';
    this._inputContainer.classList.toggle('input-container--multi', isMulti);
    this._inputContainer.classList.toggle('input-container--single', !isMulti);

    if (isMulti) {
      this._input.style.flex = '1 0 var(--select-multi-input-min-width, 96px)';
      this._input.style.width = 'auto';
      this._input.style.minWidth = 'var(--select-multi-input-min-width, 96px)';
    } else {
      this._input.style.flex = '1 1 auto';
      this._input.style.width = '100%';
      this._input.style.minWidth = '0';
    }

    this._syncMultiSelectDisplayConfig();
  }

  private _syncMultiSelectDisplayConfig(): void {
    if (!this._inputContainer || !this._input) return;

    const isMulti = this._config.selection.mode === 'multi';
    const mode = this._config.multiSelectDisplay?.mode ?? 'wrap';
    const dragEnabled = this._config.multiSelectDisplay?.dragScroll !== false;

    if (!isMulti) {
      this._inputContainer.removeAttribute('data-multi-scroll-mode');
      this._inputContainer.removeAttribute('data-drag-scroll');
      this._inputContainer.classList.remove('is-dragging-scroll');
      this._inputContainer.style.removeProperty('--select-multi-input-max-height');
      this._inputContainer.style.removeProperty('--select-multi-input-overflow-x');
      this._inputContainer.style.removeProperty('--select-multi-input-overflow-y');
      this._inputContainer.style.removeProperty('--select-multi-input-flex-wrap');
      this._inputContainer.style.removeProperty('--select-multi-input-align-content');
      return;
    }

    const maxHeight = this._config.multiSelectDisplay?.maxHeight ?? '160px';
    const overflowX = this._config.multiSelectDisplay?.overflowX ?? (mode === 'horizontal' ? 'auto' : 'hidden');
    const overflowY = this._config.multiSelectDisplay?.overflowY ?? (mode === 'horizontal' ? 'hidden' : 'auto');
    const flexWrap = mode === 'horizontal' ? 'nowrap' : 'wrap';
    const alignContent = mode === 'horizontal' ? 'center' : 'flex-start';

    this._inputContainer.setAttribute('data-multi-scroll-mode', mode);
    this._inputContainer.setAttribute('data-drag-scroll', String(dragEnabled && mode === 'horizontal'));
    this._inputContainer.style.setProperty('--select-multi-input-max-height', maxHeight);
    this._inputContainer.style.setProperty('--select-multi-input-overflow-x', overflowX);
    this._inputContainer.style.setProperty('--select-multi-input-overflow-y', overflowY);
    this._inputContainer.style.setProperty('--select-multi-input-flex-wrap', flexWrap);
    this._inputContainer.style.setProperty('--select-multi-input-align-content', alignContent);
  }

  private _canUseHorizontalMultiScroll(target: HTMLElement | null): boolean {
    if (this._config.selection.mode !== 'multi') return false;
    if ((this._config.multiSelectDisplay?.mode ?? 'wrap') !== 'horizontal') return false;
    if (this._config.multiSelectDisplay?.dragScroll === false) return false;
    if (!target) return true;
    if (target.closest('.dropdown-arrow-container, .clear-control-button, .badge-remove')) return false;
    if (target.matches('.select-input')) return false;
    return true;
  }

  private _isScrollableMultiSelectMode(): boolean {
    if (this._config.selection.mode !== 'multi') return false;
    const mode = this._config.multiSelectDisplay?.mode ?? 'wrap';
    return mode === 'vertical' || mode === 'horizontal';
  }

  private _isPointerOnInputScrollbar(event: Pick<MouseEvent, 'clientX' | 'clientY'>): boolean {
    if (!this._isScrollableMultiSelectMode()) return false;

    const rect = this._inputContent.getBoundingClientRect();
    const verticalScrollbarWidth = this._inputContent.offsetWidth - this._inputContent.clientWidth;
    const horizontalScrollbarHeight = this._inputContent.offsetHeight - this._inputContent.clientHeight;

    if (
      verticalScrollbarWidth > 0
      && event.clientX >= rect.right - verticalScrollbarWidth
      && event.clientX <= rect.right
      && event.clientY >= rect.top
      && event.clientY <= rect.bottom
    ) {
      return true;
    }

    if (
      horizontalScrollbarHeight > 0
      && event.clientY >= rect.bottom - horizontalScrollbarHeight
      && event.clientY <= rect.bottom
      && event.clientX >= rect.left
      && event.clientX <= rect.right
    ) {
      return true;
    }

    return false;
  }

  private _beginMultiScrollDrag(e: PointerEvent): void {
    const scrollHost = this._inputContent;
    this._multiScrollDrag.active = true;
    this._multiScrollDrag.moved = false;
    this._multiScrollDrag.pointerId = e.pointerId;
    this._multiScrollDrag.startX = e.clientX;
    this._multiScrollDrag.startScrollLeft = scrollHost.scrollLeft;
    this._inputContainer.classList.add('is-dragging-scroll');

    try {
      scrollHost.setPointerCapture(e.pointerId);
    } catch (_error) {
      // ignore pointer capture issues
    }
  }

  private _updateMultiScrollDrag(e: PointerEvent): void {
    if (!this._multiScrollDrag.active || this._multiScrollDrag.pointerId !== e.pointerId) return;

    const deltaX = e.clientX - this._multiScrollDrag.startX;
    if (Math.abs(deltaX) > 3) {
      this._multiScrollDrag.moved = true;
    }

    this._inputContent.scrollLeft = this._multiScrollDrag.startScrollLeft - deltaX;
  }

  private _endMultiScrollDrag(pointerId?: number): void {
    if (!this._multiScrollDrag.active) return;
    if (pointerId != null && this._multiScrollDrag.pointerId !== pointerId) return;

    try {
      if (this._multiScrollDrag.pointerId >= 0) {
        this._inputContent.releasePointerCapture(this._multiScrollDrag.pointerId);
      }
    } catch (_error) {
      // ignore pointer capture issues
    }

    this._multiScrollDrag.active = false;
    this._multiScrollDrag.pointerId = -1;
    this._inputContainer.classList.remove('is-dragging-scroll');
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

    // Apply a direct inline reset so the input is only the writable text layer,
    // while the `.input-container` remains the sole visible control shell.
    input.style.all = 'unset';
    input.style.display = 'block';
    input.style.flex = '1 1 auto';
    input.style.width = '100%';
    input.style.maxWidth = '100%';
    input.style.minWidth = '0';
    input.style.minInlineSize = '0';
    input.style.minHeight = '0';
    input.style.padding = '0';
    input.style.margin = '0';
    input.style.border = '0';
    input.style.background = 'transparent';
    input.style.boxSizing = 'border-box';
    input.style.outline = 'none';
    input.style.font = 'inherit';
    input.style.fontFamily = 'inherit';
    input.style.lineHeight = 'inherit';
    input.style.color = 'inherit';
    input.style.alignSelf = 'center';
    input.style.appearance = 'none';
    input.style.webkitAppearance = 'none';
    input.style.boxShadow = 'none';
    input.style.borderRadius = '0';
    input.style.overflow = 'hidden';
    input.style.textOverflow = 'ellipsis';
    input.style.whiteSpace = 'nowrap';
    input.style.cursor = this._config.searchable ? 'text' : 'default';
    
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
      const inputStyles = { ...this._config.styles.input } as Partial<CSSStyleDeclaration> & Record<string, unknown>;

      // Route shell-like styling to .input-container so the control appears as
      // a single styled input instead of two visually separate layers.
      delete inputStyles.background;
      delete inputStyles.backgroundColor;
      delete inputStyles.border;
      delete inputStyles.borderColor;
      delete inputStyles.borderStyle;
      delete inputStyles.borderWidth;
      delete inputStyles.borderRadius;
      delete inputStyles.boxShadow;
      delete inputStyles.padding;
      delete inputStyles.height;
      delete inputStyles.minHeight;
      delete inputStyles.maxHeight;

      Object.assign(input.style, inputStyles);
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
        <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
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
    icon.innerHTML = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    button.setAttribute('aria-label', this._config.clearControl.ariaLabel || 'Clear selection and search');
    button.appendChild(icon);

    this._clearControlIcon = icon;
    return button;
  }

  private _assembleDOM(): void {
    this._inputContent.appendChild(this._input);
    this._inputContainer.appendChild(this._inputContent);

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

    this._syncInputContainerMode();
    this._syncClearControlState();
  }

  private _initializeStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      /* ═══════════════════════════════════════════════════════════════════════════
         ELEGANT SELECT COMPONENT — Refined Design System
         Formal aesthetics with sophisticated microinteractions
       ═══════════════════════════════════════════════════════════════════════════ */
      
      :host {
        --select-primary: #1a1a2e;
        --select-primary-light: #16213e;
        --select-accent: #0f3460;
        --select-accent-hover: #e94560;
        --select-surface: #ffffff;
        --select-surface-elevated: #fafbfc;
        --select-border: #e1e5eb;
        --select-border-focus: #0f3460;
        --select-text: #1a1a2e;
        --select-text-muted: #6b7280;
        --select-text-placeholder: #9ca3af;
        --select-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
        --select-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
        --select-shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
        --select-shadow-focus: 0 0 0 3px rgba(15, 52, 96, 0.12);
        --select-radius-sm: 6px;
        --select-radius-md: 10px;
        --select-radius-lg: 14px;
        --select-transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
        --select-transition-smooth: 250ms cubic-bezier(0.4, 0, 0.2, 1);
        --select-transition-bounce: 350ms cubic-bezier(0.34, 1.56, 0.64, 1);
        --select-badge-animation: badgeEnter 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        --select-badge-enter-from-opacity: 0;
        --select-badge-enter-from-transform: scale(0.8) translateY(-4px);
        --select-badge-enter-to-opacity: 1;
        --select-badge-enter-to-transform: scale(1) translateY(0);
        --select-badge-active-transform: scale(0.98);
        --select-badge-hover-transform: scale(1.02);
        --select-badge-letter-spacing: 0.01em;
        --select-badge-hover-shadow: var(--select-shadow-md), inset 0 1px 0 rgba(255, 255, 255, 0.15);
        --select-badge-remove-icon-size: 10px;
        --select-badge-remove-focus-outline: 2px solid rgba(255, 255, 255, 0.5);
        --select-badge-remove-focus-offset: 1px;
        --select-badge-remove-hover-transform: scale(1.15) rotate(90deg);
        --select-badge-remove-active-transform: scale(0.95) rotate(90deg);
        --select-input-hover-border: var(--select-border-focus);
        --select-input-hover-shadow: var(--select-shadow-sm), 0 0 0 1px rgba(15, 52, 96, 0.05);
        --select-input-font-weight: 450;
        --select-input-letter-spacing: 0.01em;
        --select-input-disabled-opacity: 0.6;
        --select-input-overflow-x: hidden;
        --select-input-align-items: center;
        --select-input-align-content: center;
        --select-input-align-self: center;
        --select-multi-input-max-height: 160px;
        --select-multi-input-overflow-x: hidden;
        --select-multi-input-overflow-y: auto;
        --select-multi-input-flex-wrap: wrap;
        --select-multi-input-align-content: flex-start;
        --select-multi-input-horizontal-input-flex: 0 0 var(--select-multi-input-min-width, 96px);
        --select-multi-input-horizontal-cursor: grab;
        --select-multi-input-horizontal-active-cursor: grabbing;
        --select-multi-separator-inset-block: 10px;
        --select-multi-action-surface-bg: var(--select-input-bg, var(--select-surface));
        --select-multi-action-divider: 1px solid var(--select-border);
        --select-separator-opacity: 0.6;
        --select-separator-active-opacity: 1;
        --select-separator-position: var(--select-arrow-width, 42px);
        --select-separator-position-with-clear: calc(var(--select-arrow-right-with-clear, 34px) + var(--select-arrow-width, 42px));
        --select-separator-dark-bg: linear-gradient(
          to bottom,
          transparent 0%,
          var(--select-border) 20%,
          var(--select-border) 80%,
          transparent 100%
        );
        --select-arrow-open-transform: rotate(180deg);
        --select-clear-button-hover-transform: translateY(-50%) scale(1.1);
        --select-clear-button-active-transform: translateY(-50%) scale(0.95);
        --select-clear-button-focus-offset: 2px;
        --select-clear-icon-size: 14px;
        --select-dropdown-top: calc(100% + 6px);
        --select-dropdown-bottom: calc(100% + 6px);
        --select-dropdown-animation: dropdownEnter 200ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
        --select-dropdown-enter-from-opacity: 0;
        --select-dropdown-enter-from-transform: translateY(-8px) scale(0.98);
        --select-dropdown-enter-to-opacity: 1;
        --select-dropdown-enter-to-transform: translateY(0) scale(1);
        --select-dropdown-top-transform-origin: bottom center;
        --select-dropdown-top-enter-from-transform: translateY(8px) scale(0.98);
        --select-dropdown-padding: 6px;
        --select-dropdown-scroll-behavior: smooth;
        --select-dropdown-transform-origin: top center;
        --select-scrollbar-width: 6px;
        --select-scrollbar-thumb-radius: 3px;
        --select-option-hover-transform: translateX(2px);
        --select-option-font-weight: 450;
        --select-option-margin: 2px 0;
        --select-option-disabled-opacity: 0.5;
        --select-option-disabled-cursor: not-allowed;
        --select-option-active-outline-offset: -2px;
        --select-option-selected-active-outline-offset: -2px;
        --select-option-selected-indicator-width: 3px;
        --select-option-selected-indicator-height: 60%;
        --select-option-selected-indicator-bg: var(--select-accent);
        --select-option-selected-indicator-radius: 0 2px 2px 0;
        --select-option-selected-indicator-left: 0;
        --select-option-selected-indicator-top: 50%;
        --select-option-selected-indicator-transform: translateY(-50%);
        --select-option-selected-indicator-animation: selectedIndicator 200ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        --select-option-selected-indicator-from-height: 0;
        --select-option-selected-indicator-to-height: 60%;
        --select-option-selected-indicator-from-opacity: 0;
        --select-option-selected-indicator-to-opacity: 1;
        --select-option-pressed-transform: translateX(2px) scale(0.99);
        --select-option-selected-pressed-transform: scale(0.99);
        --select-button-hover-transform: translateY(-1px);
        --select-button-active-transform: translateY(0) scale(0.98);
        --select-button-font-weight: 550;
        --select-button-letter-spacing: 0.02em;
        --select-spinner-animation: spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        --select-searching-spinner-active-color: var(--select-accent);
        --select-badge-remove-margin-left: 2px;
        --select-badge-remove-radius: 50%;
        --select-badge-remove-font-weight: 600;
        --select-empty-gap: 8px;
        --select-searching-gap: 8px;
        --select-searching-spinner-size: 24px;
        --select-searching-spinner-border: 2px solid var(--select-border);
        --select-searching-spinner-animation: var(--select-spinner-animation);
        --select-group-header-separator-margin-top: 8px;
        --select-group-header-separator-padding-top: 14px;
        --select-group-header-separator-border-top: 1px solid var(--select-border);
        --select-reduced-motion-duration: 0.01ms;
        --select-reduced-motion-iteration-count: 1;
        --select-high-contrast-border-width: 2px;
        --select-high-contrast-indicator-width: 4px;
        --select-high-contrast-focus-outline-width: 3px;
        --select-high-contrast-focus-outline-color: Highlight;
        --select-touch-target-min-height: 44px;
        --select-badge-dark-bg: linear-gradient(135deg, var(--select-accent) 0%, #4f46e5 100%);
        --select-host-z-index: auto;
        --select-host-open-z-index: var(--select-dropdown-z-index, 1000);
        --select-ancestor-open-z-index: var(--select-host-open-z-index, var(--select-dropdown-z-index, 1000));
        
        display: block;
        position: relative;
        z-index: var(--select-host-z-index, auto);
        width: var(--select-width, 100%);
        height: var(--select-height, auto);
        font-family: var(--select-font-family, inherit);
        font-size: var(--select-font-size, inherit);
        line-height: var(--select-line-height, inherit);
        color: var(--select-color, inherit);
      }

      :host([data-open="true"]) {
        z-index: var(--select-host-open-z-index, var(--select-dropdown-z-index, 1000));
      }

      :host([dir="ltr"]) {
        direction: ltr;
      }

      :host([dir="rtl"]) {
        direction: rtl;
      }

      /* ─────────────────────────────────────────────────────────────────────────
         Selection Badges — Refined pill design with elegant interactions
       ───────────────────────────────────────────────────────────────────────── */
      
      .selection-badge {
        display: inline-flex;
        align-items: center;
        gap: var(--select-badge-gap, 6px);
        flex: 0 1 auto;
        width: var(--select-badge-width, auto);
        min-width: var(--select-badge-min-width, 0);
        height: var(--select-badge-height, auto);
        min-height: var(--select-badge-min-height, 26px);
        padding: var(--select-badge-padding, 4px 10px 4px 12px);
        margin: var(--select-badge-margin, 3px);
        background: var(--select-badge-bg, linear-gradient(135deg, var(--select-accent) 0%, var(--select-primary-light) 100%));
        color: var(--select-badge-color, #ffffff);
        border: var(--select-badge-border, none);
        border-radius: var(--select-badge-border-radius, 999px);
        box-shadow: var(--select-badge-shadow, var(--select-shadow-sm), inset 0 1px 0 rgba(255, 255, 255, 0.1));
        box-sizing: border-box;
        font-size: var(--select-badge-font-size, 0.8667em);
        font-weight: var(--select-badge-font-weight, 500);
        line-height: var(--select-badge-line-height, 1.2);
        letter-spacing: var(--select-badge-letter-spacing);
        max-width: var(--select-badge-max-width, 100%);
        overflow: hidden;
        transform: scale(1);
        transition: 
          transform var(--select-transition-bounce),
          box-shadow var(--select-transition-fast),
          background var(--select-transition-fast);
        animation: var(--select-badge-animation);
      }
      
      @keyframes badgeEnter {
        0% {
          opacity: var(--select-badge-enter-from-opacity);
          transform: var(--select-badge-enter-from-transform);
        }
        100% {
          opacity: var(--select-badge-enter-to-opacity);
          transform: var(--select-badge-enter-to-transform);
        }
      }
      
      .selection-badge:hover {
        background: var(--select-badge-hover-bg, var(--select-badge-bg, linear-gradient(135deg, var(--select-accent) 0%, var(--select-primary-light) 100%)));
        color: var(--select-badge-hover-color, var(--select-badge-color, #ffffff));
        border: var(--select-badge-hover-border, var(--select-badge-border, none));
        box-shadow: var(--select-badge-hover-shadow);
        transform: var(--select-badge-hover-transform);
      }

      .selection-badge:active {
        background: var(--select-badge-active-bg, var(--select-badge-hover-bg, var(--select-badge-bg, linear-gradient(135deg, var(--select-accent) 0%, var(--select-primary-light) 100%))));
        color: var(--select-badge-active-color, var(--select-badge-hover-color, var(--select-badge-color, #ffffff)));
        border: var(--select-badge-active-border, var(--select-badge-hover-border, var(--select-badge-border, none)));
        box-shadow: var(--select-badge-active-shadow, var(--select-badge-hover-shadow));
        transform: var(--select-badge-active-transform);
      }

      .selection-badge-label {
        display: block;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--select-badge-label-color, inherit);
        font-size: var(--select-badge-label-font-size, inherit);
        font-weight: var(--select-badge-label-font-weight, inherit);
        line-height: var(--select-badge-label-line-height, var(--select-badge-line-height, 1.2));
        letter-spacing: var(--select-badge-label-letter-spacing, inherit);
        text-align: var(--select-badge-label-text-align, start);
      }

      .badge-remove {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: var(--select-badge-remove-size, 18px);
        height: var(--select-badge-remove-size, 18px);
        min-width: var(--select-badge-remove-min-width, var(--select-badge-remove-size, 18px));
        min-height: var(--select-badge-remove-min-height, var(--select-badge-remove-size, 18px));
        padding: 0;
        margin-left: var(--select-badge-remove-margin-left);
        background: var(--select-badge-remove-bg, rgba(255, 255, 255, 0.2));
        border: var(--select-badge-remove-border, none);
        border-radius: var(--select-badge-remove-radius);
        color: var(--select-badge-remove-color, #ffffff);
        font-size: var(--select-badge-remove-font-size, 0.7333em);
        font-weight: var(--select-badge-remove-font-weight);
        line-height: 1;
        cursor: pointer;
        flex: 0 0 auto;
        transition: 
          background var(--select-transition-fast),
          color var(--select-transition-fast),
          border-color var(--select-transition-fast),
          box-shadow var(--select-transition-fast),
          transform var(--select-transition-bounce);
      }

      .badge-remove-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: var(--select-badge-remove-icon-size, 10px);
        height: var(--select-badge-remove-icon-size, 10px);
        pointer-events: none;
      }

      .badge-remove-icon svg {
        width: 100%;
        height: 100%;
        display: block;
      }
      
      .badge-remove:hover {
        background: var(--select-badge-remove-hover-bg, rgba(233, 69, 96, 0.9));
        color: var(--select-badge-remove-hover-color, var(--select-badge-remove-color, #ffffff));
        border: var(--select-badge-remove-hover-border, var(--select-badge-remove-border, none));
        box-shadow: var(--select-badge-remove-hover-shadow, none);
        transform: var(--select-badge-remove-hover-transform);
      }

      .badge-remove:focus-visible {
        outline: var(--select-badge-remove-focus-outline);
        outline-offset: var(--select-badge-remove-focus-offset);
      }
      
      .badge-remove:active {
        background: var(--select-badge-remove-active-bg, var(--select-badge-remove-hover-bg, rgba(233, 69, 96, 0.9)));
        color: var(--select-badge-remove-active-color, var(--select-badge-remove-hover-color, var(--select-badge-remove-color, #ffffff)));
        border: var(--select-badge-remove-active-border, var(--select-badge-remove-hover-border, var(--select-badge-remove-border, none)));
        box-shadow: var(--select-badge-remove-active-shadow, var(--select-badge-remove-hover-shadow, none));
        transform: var(--select-badge-remove-active-transform);
      }

      :host([dir="rtl"]) .badge-remove {
        margin-left: 0;
        margin-right: var(--select-badge-remove-margin-left);
      }
      
      /* ─────────────────────────────────────────────────────────────────────────
         Input Container — Sophisticated control shell
       ───────────��───────────────────────────────────────────────────────────── */
      
      .select-container {
        position: relative;
        width: 100%;
      }
      
      .input-container {
        position: relative;
        width: 100%;
        display: flex;
        align-items: var(--select-input-align-items, center);
        flex-wrap: nowrap;
        justify-content: var(--select-input-justify-content, flex-start);
        gap: var(--select-input-gap, 6px);
        padding: var(--select-input-padding, 10px 52px 10px 14px);
        height: var(--select-input-height, auto);
        min-height: var(--select-input-min-height, 48px);
        max-height: var(--select-input-max-height, 160px);
        overflow: hidden;
        align-content: var(--select-input-align-content, center);
        text-align: var(--select-input-text-align, start);
        background: var(--select-input-bg, var(--select-surface));
        border: var(--select-input-border, 1.5px solid var(--select-border));
        border-radius: var(--select-input-border-radius, var(--select-radius-md));
        box-shadow: var(--select-shadow-sm);
        box-sizing: border-box;
        transition: 
          border-color var(--select-transition-fast),
          box-shadow var(--select-transition-smooth),
          transform var(--select-transition-fast);
      }

      .input-content {
        position: relative;
        display: flex;
        flex: 1 1 auto;
        width: 100%;
        min-width: 0;
        min-height: 0;
        align-self: stretch;
        align-items: var(--select-input-align-items, center);
        align-content: var(--select-input-align-content, center);
        justify-content: var(--select-input-justify-content, flex-start);
        flex-wrap: nowrap;
        gap: var(--select-input-gap, 6px);
        overflow-x: var(--select-input-overflow-x, hidden);
        overflow-y: var(--select-input-overflow-y, hidden);
        scrollbar-width: thin;
        box-sizing: border-box;
      }
      
      .input-container:hover {
        border-color: var(--select-input-hover-border);
        box-shadow: var(--select-input-hover-shadow);
      }

      .input-container.input-container--single {
        flex-wrap: nowrap;
        align-content: center;
      }

      .input-container.input-container--multi {
        max-height: var(--select-multi-input-max-height, var(--select-input-max-height, 160px));
      }

      .input-container.input-container--multi .input-content {
        flex-wrap: var(--select-multi-input-flex-wrap, wrap);
        align-content: var(--select-multi-input-align-content, flex-start);
        overflow-x: var(--select-multi-input-overflow-x, hidden);
        overflow-y: var(--select-multi-input-overflow-y, auto);
      }

      .input-container.input-container--multi::after {
        top: var(--select-multi-separator-inset-block, 10px);
        bottom: var(--select-multi-separator-inset-block, 10px);
        height: auto;
        transform: none;
      }

      .input-container.input-container--multi[data-multi-scroll-mode="horizontal"] {
        align-items: stretch;
      }

      .input-container.input-container--multi[data-multi-scroll-mode="horizontal"] .input-content {
        cursor: var(--select-multi-input-horizontal-cursor, grab);
        overflow-y: hidden;
        overscroll-behavior-x: contain;
      }

      .input-container.input-container--multi[data-multi-scroll-mode="horizontal"]::after {
        display: none;
      }

      .input-container.input-container--multi[data-multi-scroll-mode="horizontal"].is-dragging-scroll .input-content {
        cursor: var(--select-multi-input-horizontal-active-cursor, grabbing);
        user-select: none;
      }

      .input-container.input-container--multi[data-multi-scroll-mode="horizontal"] .input-content .selection-badge {
        flex: 0 0 auto;
      }

      .input-container.input-container--multi[data-multi-scroll-mode="horizontal"] .input-content > .select-input,
      .input-container.input-container--multi[data-multi-scroll-mode="horizontal"] .input-content > input.select-input,
      .input-container.input-container--multi[data-multi-scroll-mode="horizontal"] .input-content > .select-input[type="text"] {
        flex: var(--select-multi-input-horizontal-input-flex, 0 0 var(--select-multi-input-min-width, 96px));
      }

      .input-container.input-container--multi[data-multi-scroll-mode="horizontal"] .dropdown-arrow-container {
        background: var(--select-multi-action-surface-bg, var(--select-input-bg, var(--select-surface)));
        border-left: var(--select-multi-action-divider, 1px solid var(--select-border));
        z-index: 4;
      }

      .input-container.input-container--multi[data-multi-scroll-mode="horizontal"] .dropdown-arrow-container.with-clear-control {
        right: var(--select-arrow-right-with-clear, 34px);
      }

      :host([dir="rtl"]) .input-container.input-container--multi[data-multi-scroll-mode="horizontal"] .dropdown-arrow-container {
        border-left: none;
        border-right: var(--select-multi-action-divider, 1px solid var(--select-border));
      }

      :host([dir="rtl"]) .input-container.input-container--multi[data-multi-scroll-mode="horizontal"] .dropdown-arrow-container.with-clear-control {
        right: auto;
        left: var(--select-arrow-right-with-clear, 34px);
      }

      .input-container.input-container--multi[data-multi-scroll-mode="horizontal"] .clear-control-button {
        background: var(--select-multi-action-surface-bg, var(--select-input-bg, var(--select-surface)));
        z-index: 4;
      }
      
      .input-container:focus-within {
        border-color: var(--select-input-focus-border, var(--select-border-focus));
        box-shadow: var(--select-shadow-focus), var(--select-shadow-sm);
      }
      
      /* Elegant separator line before arrow */
      .input-container::after {
        content: '';
        position: absolute;
        top: 50%;
        right: var(--select-separator-position, var(--select-arrow-width, 42px));
        transform: translateY(-50%);
        width: var(--select-separator-width, 1px);
        height: var(--select-separator-height, 50%);
        background: var(--select-separator-bg, linear-gradient(
          to bottom,
          transparent 0%,
          var(--select-border) 20%,
          var(--select-border) 80%,
          transparent 100%
        ));
        pointer-events: none;
        z-index: 1;
        opacity: var(--select-separator-opacity);
        transition: opacity var(--select-transition-fast);
      }
      
      .input-container:hover::after,
      .input-container:focus-within::after {
        opacity: var(--select-separator-active-opacity);
      }

      :host([dir="rtl"]) .input-container::after {
        right: auto;
        left: var(--select-separator-position, var(--select-arrow-width, 42px));
      }
      
      /* ─────────────────────────────────────────────────────────────────────────
         Dropdown Arrow — Smooth rotation with refined styling
       ───────────────────────────────────────────────────────────────────────── */
      
      .dropdown-arrow-container {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: var(--select-arrow-width, 42px);
        height: var(--select-arrow-height, auto);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border-radius: var(--select-arrow-border-radius, 0 var(--select-radius-md) var(--select-radius-md) 0);
        z-index: 2;
        transition: background-color var(--select-transition-fast);
      }

      .input-container.has-clear-control {
        padding: var(--select-input-padding-with-clear, 10px 84px 10px 14px);
      }

      .input-container.has-clear-control::after {
        right: var(--select-separator-position-with-clear, calc(var(--select-arrow-right-with-clear, 34px) + var(--select-arrow-width, 42px)));
      }

      .dropdown-arrow-container.with-clear-control {
        right: var(--select-arrow-right-with-clear, 34px);
      }

      :host([dir="rtl"]) .dropdown-arrow-container {
        right: auto;
        left: 0;
        border-radius: var(--select-arrow-border-radius-rtl, var(--select-radius-md) 0 0 var(--select-radius-md));
      }

      :host([dir="rtl"]) .input-container.has-clear-control::after {
        right: auto;
        left: var(--select-separator-position-with-clear, calc(var(--select-arrow-right-with-clear, 34px) + var(--select-arrow-width, 42px)));
      }

      :host([dir="rtl"]) .dropdown-arrow-container.with-clear-control {
        right: auto;
        left: var(--select-arrow-right-with-clear, 34px);
      }

      /* ─────────────────────────────────────────────────────────────────────────
         Clear Control — Minimal and elegant dismiss button
       ───────────────────────────────────────────────────────────────────────── */

      .clear-control-button {
        position: absolute;
        top: 50%;
        right: var(--select-clear-button-right, 8px);
        transform: translateY(-50%);
        width: var(--select-clear-button-size, 26px);
        height: var(--select-clear-button-size, 26px);
        border: var(--select-clear-button-border, none);
        border-radius: var(--select-clear-button-radius, 50%);
        background: var(--select-clear-button-bg, transparent);
        color: var(--select-clear-button-color, var(--select-text-muted));
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 3;
        transition: 
          background var(--select-transition-fast),
          color var(--select-transition-fast),
          transform var(--select-transition-bounce);
      }

      .clear-control-button:hover {
        background: var(--select-clear-button-hover-bg, rgba(233, 69, 96, 0.1));
        color: var(--select-clear-button-hover-color, var(--select-accent-hover));
        transform: var(--select-clear-button-hover-transform);
      }
      
      .clear-control-button:active {
        transform: var(--select-clear-button-active-transform);
      }

      .clear-control-button:focus-visible {
        outline: var(--select-clear-button-focus-outline, 2px solid var(--select-border-focus));
        outline-offset: var(--select-clear-button-focus-offset);
      }

      .clear-control-button[hidden] {
        display: none;
      }

      :host([dir="rtl"]) .clear-control-button {
        right: auto;
        left: var(--select-clear-button-right, 8px);
      }

      .clear-control-icon {
        width: var(--select-clear-icon-size);
        height: var(--select-clear-icon-size);
        pointer-events: none;
      }
      
      .clear-control-icon svg {
        width: 100%;
        height: 100%;
      }
      
      .dropdown-arrow-container:hover {
        background-color: var(--select-arrow-hover-bg, rgba(15, 52, 96, 0.05));
      }
      
      .dropdown-arrow {
        width: var(--select-arrow-size, 18px);
        height: var(--select-arrow-size, 18px);
        color: var(--select-arrow-color, var(--select-text-muted));
        transition: 
          transform var(--select-transition-smooth),
          color var(--select-transition-fast);
        transform-origin: center;
      }
      
      .dropdown-arrow path {
        stroke-width: var(--select-arrow-stroke-width, 1.5);
      }
      
      .dropdown-arrow-container:hover .dropdown-arrow {
        color: var(--select-arrow-hover-color, var(--select-accent));
      }
      
      .dropdown-arrow.open {
        transform: var(--select-arrow-open-transform);
      }
      
      /* ─────────────────────────────────────────────────────────────────────────
         Input Field — Clean text entry
       ───────────────────────────────────────────────────────────────────────── */
      
      .input-container > .select-input,
      input.select-input,
      .select-input[type="text"] {
        display: block;
        flex: 1 1 auto;
        width: var(--select-input-width, 100%);
        max-width: 100%;
        min-width: var(--select-input-min-width, 0);
        min-inline-size: 0;
        min-height: 0;
        padding: var(--select-input-field-padding, 0) !important;
        margin: 0 !important;
        border: 0 !important;
        font-size: var(--select-input-font-size, inherit);
        line-height: var(--select-input-line-height, 1.5);
        color: var(--select-input-color, var(--select-text));
        background: transparent !important;
        box-sizing: border-box;
        outline: none !important;
        font-weight: var(--select-input-font-weight);
        letter-spacing: var(--select-input-letter-spacing);
        font-family: var(--select-input-font-family, inherit);
        font-style: var(--select-input-font-style, normal);
        align-self: var(--select-input-align-self, center);
        appearance: none !important;
        -webkit-appearance: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        overflow: hidden;
        text-overflow: ellipsis;
        text-align: var(--select-input-text-align, inherit);
        white-space: nowrap;
      }
      
      .select-input::placeholder {
        color: var(--select-input-placeholder-color, var(--select-text-placeholder));
        font-weight: 400;
      }

      :host([dir="rtl"]) .input-container {
        padding: var(--select-input-padding-rtl, 10px 14px 10px 52px);
      }

      :host([dir="rtl"]) .input-container.has-clear-control {
        padding: var(--select-input-padding-with-clear-rtl, 10px 14px 10px 84px);
      }

      .input-container.input-container--multi > .select-input,
      .input-container.input-container--multi > input.select-input,
      .input-container.input-container--multi > .select-input[type="text"] {
        width: auto;
        min-width: var(--select-multi-input-min-width, 96px);
        flex: 1 0 var(--select-multi-input-min-width, 96px);
      }

      .input-container.input-container--single > .select-input,
      .input-container.input-container--single > input.select-input,
      .input-container.input-container--single > .select-input[type="text"] {
        width: var(--select-input-width, 100%);
        min-width: 0;
        flex: 1 1 auto;
      }
      
      .select-input:disabled {
        background-color: var(--select-disabled-bg, #f5f5f5);
        cursor: not-allowed;
        opacity: var(--select-input-disabled-opacity);
      }
      
      /* ─────────────────────────────────────────────────────────────────────────
         Dropdown Panel — Elegant floating container
       ───────────────────────────────────────────────────────────────────────── */
      
      .select-dropdown {
        position: absolute;
        scroll-behavior: var(--select-dropdown-scroll-behavior);
        top: var(--select-dropdown-top);
        bottom: auto;
        left: 0;
        right: 0;
        max-height: var(--select-dropdown-max-height, 320px);
        overflow: hidden;
        box-sizing: border-box;
        background: var(--select-dropdown-bg, var(--select-surface));
        border: 1px solid var(--select-dropdown-border, var(--select-border));
        border-radius: var(--select-dropdown-border-radius, var(--select-radius-lg));
        box-shadow: var(--select-dropdown-shadow, var(--select-shadow-lg));
        z-index: var(--select-dropdown-z-index, 1000);
        transform-origin: var(--select-dropdown-transform-origin);
        animation: var(--select-dropdown-animation);
      }

      .select-dropdown[data-placement="top"] {
        top: auto;
        bottom: var(--select-dropdown-bottom, calc(100% + 6px));
        transform-origin: var(--select-dropdown-top-transform-origin, bottom center);
      }

      .select-dropdown[data-placement="top"] {
        --select-dropdown-enter-from-transform: var(--select-dropdown-top-enter-from-transform, translateY(8px) scale(0.98));
      }
      
      @keyframes dropdownEnter {
        0% {
          opacity: var(--select-dropdown-enter-from-opacity);
          transform: var(--select-dropdown-enter-from-transform);
        }
        100% {
          opacity: var(--select-dropdown-enter-to-opacity);
          transform: var(--select-dropdown-enter-to-transform);
        }
      }
      
      .options-container {
        position: relative;
        max-height: var(--select-options-max-height, 320px);
        overflow: auto;
        box-sizing: border-box;
        padding: var(--select-options-padding, var(--select-dropdown-padding, 6px));
        background: var(--select-options-bg, var(--select-dropdown-bg, var(--select-surface)));
        
        /* Custom scrollbar styling */
        scrollbar-width: thin;
        scrollbar-color: var(--select-border) transparent;
      }
      
      .options-container::-webkit-scrollbar {
        width: var(--select-scrollbar-width);
      }
      
      .options-container::-webkit-scrollbar-track {
        background: transparent;
      }
      
      .options-container::-webkit-scrollbar-thumb {
        background: var(--select-border);
        border-radius: var(--select-scrollbar-thumb-radius);
      }
      
      .options-container::-webkit-scrollbar-thumb:hover {
        background: var(--select-text-muted);
      }

      /* ─────────────────────────────────────────────────────────────────────────
         Group Headers — Refined section dividers
       ───────────────────────────────────────────────────────────────────────── */

      .group-header {
        padding: var(--select-group-header-padding, 10px 12px 8px 12px);
        margin: var(--select-group-header-margin, 0);
        font-weight: var(--select-group-header-weight, 600);
        color: var(--select-group-header-color, var(--select-text-muted));
        background: var(--select-group-header-bg, #ffffff);
        text-align: var(--select-group-header-text-align, left);
        font-size: var(--select-group-header-font-size, 0.7333em);
        text-transform: var(--select-group-header-text-transform, uppercase);
        letter-spacing: var(--select-group-header-letter-spacing, 0.08em);
        position: sticky;
        top: 0;
        z-index: 100;
        border: var(--select-group-header-border, none);
        border-bottom: var(--select-group-header-border-bottom, 1px solid rgba(0, 0, 0, 0.08));
        border-radius: var(--select-group-header-border-radius, 0);
        box-shadow: var(--select-group-header-shadow, 0 1px 2px rgba(0, 0, 0, 0.04));
        /* Force solid background to prevent option bleed-through */
        isolation: isolate;
      }
      
      .group-header:not(:first-child) {
        margin-top: var(--select-group-header-separator-margin-top);
        padding-top: var(--select-group-header-separator-padding-top);
        border-top: var(--select-group-header-separator-border-top);
      }

      /* ─────────────────────────────────────────────────────────────────────────
         Options — Elegant hover and selection states
       ───────────────────────────────────────────────────────────────────────── */

      .option {
        position: relative;
        padding: var(--select-option-padding, 10px 14px);
        cursor: pointer;
        color: var(--select-option-color, var(--select-text));
        background: var(--select-option-bg, transparent);
        border: var(--select-option-border, none);
        text-align: var(--select-option-text-align, start);
        transition: 
          background var(--select-transition-fast),
          color var(--select-transition-fast),
          border-color var(--select-transition-fast),
          transform var(--select-transition-fast),
          box-shadow var(--select-transition-fast);
        user-select: none;
        font-size: var(--select-option-font-size, inherit);
        font-weight: var(--select-option-font-weight);
        line-height: var(--select-option-line-height, 1.5);
        border-radius: var(--select-option-border-radius, var(--select-radius-sm));
        margin: var(--select-option-margin);
      }

      .option:hover {
        background: var(--select-option-hover-bg, var(--select-surface-elevated));
        border: var(--select-option-hover-border, var(--select-option-border, none));
        color: var(--select-option-hover-color, var(--select-text));
        transform: var(--select-option-hover-transform);
      }

      .option.selected {
        background: var(--select-option-selected-bg, linear-gradient(135deg, rgba(15, 52, 96, 0.08) 0%, rgba(15, 52, 96, 0.04) 100%));
        border: var(--select-option-selected-border, var(--select-option-border, none));
        color: var(--select-option-selected-color, var(--select-accent));
        font-weight: var(--select-option-selected-weight, 550);
      }
      
      .option.selected::before {
        content: '';
        position: absolute;
        left: var(--select-option-selected-indicator-left);
        top: var(--select-option-selected-indicator-top);
        transform: var(--select-option-selected-indicator-transform);
        width: var(--select-option-selected-indicator-width);
        height: var(--select-option-selected-indicator-height);
        background: var(--select-option-selected-indicator-bg);
        border-radius: var(--select-option-selected-indicator-radius);
        animation: var(--select-option-selected-indicator-animation);
      }

      :host([dir="rtl"]) .option.selected::before {
        left: auto;
        right: var(--select-option-selected-indicator-right, var(--select-option-selected-indicator-left));
        border-radius: var(--select-option-selected-indicator-radius-rtl, 2px 0 0 2px);
      }
      
      @keyframes selectedIndicator {
        0% {
          height: var(--select-option-selected-indicator-from-height);
          opacity: var(--select-option-selected-indicator-from-opacity);
        }
        100% {
          height: var(--select-option-selected-indicator-to-height);
          opacity: var(--select-option-selected-indicator-to-opacity);
        }
      }

      .option.selected:hover {
        background: var(--select-option-selected-hover-bg, var(--select-option-selected-bg, linear-gradient(135deg, rgba(15, 52, 96, 0.12) 0%, rgba(15, 52, 96, 0.06) 100%)));
        border: var(--select-option-selected-hover-border, var(--select-option-selected-border, var(--select-option-hover-border, var(--select-option-border, none))));
        color: var(--select-option-selected-hover-color, var(--select-option-selected-color, var(--select-accent)));
      }

      .option.active:not(.selected) {
        background: var(--select-option-active-bg, var(--select-surface-elevated));
        color: var(--select-option-active-color, var(--select-option-hover-color, var(--select-option-color, var(--select-text))));
        border: var(--select-option-active-border, var(--select-option-hover-border, var(--select-option-border, none)));
        outline: var(--select-option-active-outline, 2px solid rgba(15, 52, 96, 0.3));
        outline-offset: var(--select-option-active-outline-offset);
        box-shadow: var(--select-option-active-shadow, none);
        transform: var(--select-option-active-transform, none);
      }

      .option.selected.active {
        outline: var(--select-option-selected-active-outline, 2px solid rgba(15, 52, 96, 0.4));
        outline-offset: var(--select-option-selected-active-outline-offset);
      }

      .option.disabled {
        background: var(--select-option-disabled-bg, var(--select-option-bg, transparent));
        color: var(--select-option-disabled-color, var(--select-text-muted));
        border: var(--select-option-disabled-border, var(--select-option-border, none));
        opacity: var(--select-option-disabled-opacity, 0.5);
        cursor: var(--select-option-disabled-cursor, not-allowed);
      }

      .option:active:not(.selected) {
        background: var(--select-option-pressed-bg, rgba(15, 52, 96, 0.08));
        transform: var(--select-option-pressed-transform);
      }

      .option.selected:active {
        transform: var(--select-option-selected-pressed-transform);
      }
      
      /* ─────────────────────────────────────────────────────────────────────────
         Load More & Busy States — Refined feedback indicators
       ───────────────────────────────────────────────────────────────────────── */
      
      .load-more-container {
        padding: var(--select-load-more-padding, 12px);
        text-align: center;
      }
      
      .load-more-button {
        padding: var(--select-button-padding, 10px 20px);
        border: var(--select-button-border, 1.5px solid var(--select-border));
        background: var(--select-button-bg, transparent);
        color: var(--select-button-color, var(--select-accent));
        border-radius: var(--select-button-border-radius, var(--select-radius-md));
        cursor: pointer;
        font-size: var(--select-button-font-size, 0.8667em);
        font-weight: var(--select-button-font-weight);
        letter-spacing: var(--select-button-letter-spacing);
        transition: 
          background var(--select-transition-fast),
          border-color var(--select-transition-fast),
          color var(--select-transition-fast),
          transform var(--select-transition-bounce);
      }
      
      .load-more-button:hover {
        background: var(--select-button-hover-bg, var(--select-accent));
        border-color: var(--select-accent);
        color: var(--select-button-hover-color, white);
        transform: var(--select-button-hover-transform);
      }
      
      .load-more-button:active {
        transform: var(--select-button-active-transform);
      }
      
      .load-more-button:disabled {
        opacity: var(--select-button-disabled-opacity, 0.5);
        cursor: not-allowed;
        transform: none;
      }
      
      .busy-bucket {
        padding: var(--select-busy-padding, 20px);
        text-align: center;
        color: var(--select-busy-color, var(--select-text-muted));
        background: var(--select-busy-bg, transparent);
        font-size: var(--select-busy-font-size, 0.8667em);
      }
      
      .spinner {
        display: inline-block;
        width: var(--select-spinner-size, 22px);
        height: var(--select-spinner-size, 22px);
        border: var(--select-spinner-border, 2px solid var(--select-border));
        border-top-color: var(--select-spinner-active-color, var(--select-accent));
        border-radius: 50%;
        animation: var(--select-spinner-animation);
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .empty-state {
        padding: var(--select-empty-padding, 32px 24px);
        text-align: center;
        color: var(--select-empty-color, var(--select-text-muted));
        font-size: var(--select-empty-font-size, 0.9333em);
        background: var(--select-empty-bg, transparent);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--select-empty-gap);
      }
      
      .searching-state {
        padding: var(--select-searching-padding, 32px 24px);
        text-align: center;
        color: var(--select-searching-color, var(--select-accent));
        font-size: var(--select-searching-font-size, 0.9333em);
        background: var(--select-searching-bg, transparent);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--select-searching-gap);
      }
      
      .searching-state::before {
        content: '';
        width: var(--select-searching-spinner-size);
        height: var(--select-searching-spinner-size);
        border: var(--select-searching-spinner-border);
        border-top-color: var(--select-searching-spinner-active-color);
        border-radius: 50%;
        animation: var(--select-searching-spinner-animation);
      }
      
      /* ─────────────────────────────────────────────────────────────────────────
         Error States — Clear visual feedback
       ───────────────────────────────────────────────────────────────────────── */
      
      .select-input[aria-invalid="true"] {
        border-color: var(--select-error-border, #e94560);
      }
      
      .select-input[aria-invalid="true"]:focus {
        border-color: var(--select-error-border, #e94560);
        box-shadow: 0 0 0 3px var(--select-error-shadow, rgba(233, 69, 96, 0.15));
      }
      
      /* ──────────────────────────────────────────────────��──────────────────────
         Accessibility — Reduced motion & High contrast
       ───────────────────────────────────────────────────────────────────────── */
      
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: var(--select-reduced-motion-duration) !important;
          animation-iteration-count: var(--select-reduced-motion-iteration-count) !important;
          transition-duration: var(--select-reduced-motion-duration) !important;
        }
        
        .dropdown-arrow.open {
          transform: var(--select-arrow-open-transform);
        }
      }
      
      @media (prefers-contrast: high) {
        .select-input:focus {
          outline-width: var(--select-high-contrast-focus-outline-width);
          outline-color: var(--select-high-contrast-focus-outline-color);
        }
        
        .input-container {
          border-width: var(--select-high-contrast-border-width);
        }
        
        .option.selected::before {
          width: var(--select-high-contrast-indicator-width);
        }
      }
      
      /* Touch targets (WCAG 2.5.5) */
      .load-more-button,
      select-option {
        min-height: var(--select-touch-target-min-height);
      }
      
      /* ─────────────────────────────────────────────────────────────────────────
         Dark Mode — Elegant dark theme
       ───────────────────────────────────────────────────────────────────────── */
      
      :host(.dark-mode),
      :host([dark-mode]),
      :host([darkmode]),
      :host([data-theme="dark"]),
      :host([theme="dark"]),
      :host-context(.dark-mode),
      :host-context(.dark),
      :host-context([dark-mode]),
      :host-context([darkmode]),
      :host-context([data-theme="dark"]),
      :host-context([theme="dark"]) {
        --select-primary: #e5e5e5;
        --select-primary-light: #2a2a3e;
        --select-accent: #6366f1;
        --select-accent-hover: #f43f5e;
        --select-surface: var(--select-dark-bg, #1a1a2e);
        --select-surface-elevated: #252540;
        --select-border: var(--select-dark-border, #3f3f5a);
        --select-border-focus: #6366f1;
        --select-text: var(--select-dark-text, #f5f5f5);
        --select-text-muted: #9ca3af;
        --select-text-placeholder: #6b7280;
        --select-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2);
        --select-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.3);
        --select-shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.4);
        --select-shadow-focus: 0 0 0 3px rgba(99, 102, 241, 0.25);

        --select-dropdown-bg: var(--select-dark-dropdown-bg, var(--select-surface));
        
        --select-option-bg: var(--select-dark-option-bg, transparent);
        --select-option-color: var(--select-dark-option-color, var(--select-text));
        --select-option-hover-bg: var(--select-dark-option-hover-bg, var(--select-surface-elevated));
        --select-option-hover-color: var(--select-dark-option-hover-color, var(--select-text));
        --select-option-selected-bg: var(--select-dark-option-selected-bg, linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.08) 100%));
        --select-option-selected-color: var(--select-dark-option-selected-color, #a5b4fc);
        --select-option-selected-hover-bg: var(--select-dark-option-selected-hover-bg, var(--select-option-selected-bg));
        --select-option-selected-hover-color: var(--select-dark-option-selected-hover-color, var(--select-option-selected-color));
      }

      :host(.dark-mode) .input-container,
      :host([dark-mode]) .input-container,
      :host([darkmode]) .input-container,
      :host([data-theme="dark"]) .input-container,
      :host([theme="dark"]) .input-container,
      :host-context(.dark-mode) .input-container,
      :host-context(.dark) .input-container,
      :host-context([dark-mode]) .input-container,
      :host-context([darkmode]) .input-container,
      :host-context([data-theme="dark"]) .input-container,
      :host-context([theme="dark"]) .input-container {
        background: var(--select-surface);
        border-color: var(--select-border);
      }

      :host(.dark-mode) .input-container::after,
      :host([dark-mode]) .input-container::after,
      :host([darkmode]) .input-container::after,
      :host([data-theme="dark"]) .input-container::after,
      :host([theme="dark"]) .input-container::after,
      :host-context(.dark-mode) .input-container::after,
      :host-context(.dark) .input-container::after,
      :host-context([dark-mode]) .input-container::after,
      :host-context([darkmode]) .input-container::after,
      :host-context([data-theme="dark"]) .input-container::after,
      :host-context([theme="dark"]) .input-container::after {
        background: var(--select-separator-dark-bg);
      }

      :host(.dark-mode) .select-dropdown,
      :host([dark-mode]) .select-dropdown,
      :host([darkmode]) .select-dropdown,
      :host([data-theme="dark"]) .select-dropdown,
      :host([theme="dark"]) .select-dropdown,
      :host-context(.dark-mode) .select-dropdown,
      :host-context(.dark) .select-dropdown,
      :host-context([dark-mode]) .select-dropdown,
      :host-context([darkmode]) .select-dropdown,
      :host-context([data-theme="dark"]) .select-dropdown,
      :host-context([theme="dark"]) .select-dropdown {
        background: var(--select-dropdown-bg, var(--select-surface));
        border-color: var(--select-border);
      }

      :host(.dark-mode) .options-container,
      :host([dark-mode]) .options-container,
      :host([darkmode]) .options-container,
      :host([data-theme="dark"]) .options-container,
      :host([theme="dark"]) .options-container,
      :host-context(.dark-mode) .options-container,
      :host-context(.dark) .options-container,
      :host-context([dark-mode]) .options-container,
      :host-context([darkmode]) .options-container,
      :host-context([data-theme="dark"]) .options-container,
      :host-context([theme="dark"]) .options-container {
        background: var(--select-dropdown-bg, var(--select-surface));
        scrollbar-color: var(--select-border) transparent;
      }

      :host(.dark-mode) .selection-badge,
      :host([dark-mode]) .selection-badge,
      :host([darkmode]) .selection-badge,
      :host([data-theme="dark"]) .selection-badge,
      :host([theme="dark"]) .selection-badge,
      :host-context(.dark-mode) .selection-badge,
      :host-context(.dark) .selection-badge,
      :host-context([dark-mode]) .selection-badge,
      :host-context([darkmode]) .selection-badge,
      :host-context([data-theme="dark"]) .selection-badge,
      :host-context([theme="dark"]) .selection-badge {
        background: var(--select-badge-dark-bg);
      }

      :host(.dark-mode) .group-header:not(:first-child),
      :host([dark-mode]) .group-header:not(:first-child),
      :host([darkmode]) .group-header:not(:first-child),
      :host([data-theme="dark"]) .group-header:not(:first-child),
      :host([theme="dark"]) .group-header:not(:first-child),
      :host-context(.dark-mode) .group-header:not(:first-child),
      :host-context(.dark) .group-header:not(:first-child),
      :host-context([dark-mode]) .group-header:not(:first-child),
      :host-context([darkmode]) .group-header:not(:first-child),
      :host-context([data-theme="dark"]) .group-header:not(:first-child),
      :host-context([theme="dark"]) .group-header:not(:first-child) {
        border-top-color: var(--select-border);
      }

      :host(.dark-mode) .group-header,
      :host([dark-mode]) .group-header,
      :host([darkmode]) .group-header,
      :host([data-theme="dark"]) .group-header,
      :host([theme="dark"]) .group-header,
      :host-context(.dark-mode) .group-header,
      :host-context(.dark) .group-header,
      :host-context([dark-mode]) .group-header,
      :host-context([darkmode]) .group-header,
      :host-context([data-theme="dark"]) .group-header,
      :host-context([theme="dark"]) .group-header {
        background: var(--select-group-header-bg, #1a1a2e);
        border-bottom: var(--select-group-header-border-bottom, 1px solid rgba(255, 255, 255, 0.08));
        box-shadow: var(--select-group-header-shadow, 0 1px 2px rgba(0, 0, 0, 0.3));
      }

      :host(.dark-mode) .option.selected::before,
      :host([dark-mode]) .option.selected::before,
      :host([darkmode]) .option.selected::before,
      :host([data-theme="dark"]) .option.selected::before,
      :host([theme="dark"]) .option.selected::before,
      :host-context(.dark-mode) .option.selected::before,
      :host-context(.dark) .option.selected::before,
      :host-context([dark-mode]) .option.selected::before,
      :host-context([darkmode]) .option.selected::before,
      :host-context([data-theme="dark"]) .option.selected::before,
      :host-context([theme="dark"]) .option.selected::before {
        background: var(--select-accent);
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

        // delegate to the existing open/close helpers so we don't accidentally
        // drift out of sync with the logic in those methods (focus, events,
        // scroll-to-selected, etc.)
        if (this._state.isOpen && this._config.selection.toggleOnTriggerClick !== false) {
          this._handleClose();
        } else if (!this._state.isOpen) {
          this._handleOpen();
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
    // Prevent the original pointer event from bubbling/causing default focus behavior
    // which can interfere with option click handling when opening the dropdown
    this._inputContainer.addEventListener('pointerdown', (e) => {
      // Prevent propagation to document click listener but do NOT preventDefault.
      // Allow default so browser events (click) on newly opened options still fire.
      // e.stopPropagation(); // BUG: By stopping propagation here, the document click listener doesn't see it, which is fine for not closing it. But be very careful.

      const target = e.target as HTMLElement | null;
      if (!this._config.enabled) return;
      if (target && target.closest('.dropdown-arrow-container')) return;
      if (target && target.closest('.clear-control-button')) return;
      if (this._isPointerOnInputScrollbar(e)) {
        this._suppressNextOpenClick = true;
        return;
      }

      const isHorizontalMultiMode = this._config.selection.mode === 'multi'
        && (this._config.multiSelectDisplay?.mode ?? 'wrap') === 'horizontal';
      const enableHorizontalDrag = this._canUseHorizontalMultiScroll(target);

      if (enableHorizontalDrag && e.button === 0) {
        this._beginMultiScrollDrag(e);
        this._suppressNextOpenClick = false;
        e.preventDefault();
        return;
      }
      
      // If we clicked the container, but not the input itself, we must prevent default
      // otherwise the browser moves focus from our input to the body, immediately triggering blur.
      if (target && !target.matches('.select-input')) {
        e.preventDefault();
      }

      const clickedInput = Boolean(target && target.matches('.select-input'));

      if (
        this._state.isOpen &&
        this._config.selection.toggleOnTriggerClick !== false &&
        !isHorizontalMultiMode &&
        !enableHorizontalDrag &&
        !(clickedInput && this._config.searchable)
      ) {
        this._handleClose();
        return;
      }

      const wasClosed = !this._state.isOpen;
      if (wasClosed) {
        this._handleOpen();
      }

      // Focus the input (do not prevent default behavior for input itself)
      this._input.focus();

      // If we just opened the dropdown, transfer pointer capture to the
      // options container so the subsequent pointerup lands there instead of
      // staying with the input container (which would swallow the event).
      if (wasClosed && this._optionsContainer && typeof e.pointerId === 'number') {
        try {
          this._optionsContainer.setPointerCapture(e.pointerId);
        } catch (_err) {
          // Some browsers may throw if element is not yet "connected"; ignore
        }
      }
    });

    this._inputContainer.addEventListener('click', (e) => {
      const target = e.target as HTMLElement | null;
      const isHorizontalMultiMode = this._config.selection.mode === 'multi'
        && (this._config.multiSelectDisplay?.mode ?? 'wrap') === 'horizontal';

      if (!this._config.enabled || !isHorizontalMultiMode) {
        this._suppressNextOpenClick = false;
        this._multiScrollDrag.moved = false;
        return;
      }

      if (target && target.closest('.dropdown-arrow-container, .clear-control-button')) {
        this._suppressNextOpenClick = false;
        this._multiScrollDrag.moved = false;
        return;
      }

      if (this._suppressNextOpenClick || this._multiScrollDrag.moved || this._isPointerOnInputScrollbar(e)) {
        this._suppressNextOpenClick = false;
        this._multiScrollDrag.moved = false;
        return;
      }

      this._suppressNextOpenClick = false;
      this._multiScrollDrag.moved = false;

      if (!this._state.isOpen) {
        this._handleOpen();
      }

      this._input.focus();
    });

    this._inputContent.addEventListener('pointermove', (e) => {
      this._updateMultiScrollDrag(e);
    });

    this._inputContent.addEventListener('pointerup', (e) => {
      this._endMultiScrollDrag(e.pointerId);
    });

    this._inputContent.addEventListener('pointercancel', (e) => {
      this._endMultiScrollDrag(e.pointerId);
    });

    this._inputContent.addEventListener('wheel', (e) => {
      if (
        this._config.selection.mode === 'multi'
        && (this._config.multiSelectDisplay?.mode ?? 'wrap') === 'horizontal'
      ) {
        e.preventDefault();
      }
    }, { passive: false });
    
    // Input container click - prevent event from reaching document listener
    this._container.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // Input focus/blur
    this._input.addEventListener('focus', () => this._handleOpen());
    // When the input loses focus we normally close the dropdown, but
    // clicking an option will blur the input before the option's click
    // handler executes. To avoid the blur timer closing the dropdown
    // prematurely we use a short-lived flag that is set whenever we start
    // interacting with the options container. The close callback checks this
    // flag and skips closing if the user is about to click an option.
    this._input.addEventListener('blur', (e) => {
      const related = (e as FocusEvent).relatedTarget as Node | null;
      if (related && (this._shadow.contains(related) || this._container.contains(related))) {
        return;
      }

      // Delay to allow option click/focus transitions
      setTimeout(() => {
        if (this._suppressBlurClose) {
          // another pointerdown inside options is in progress; keep open
          return;
        }

        const active = document.activeElement as Node | null;
        if (active && (this._shadow.contains(active) || this._container.contains(active))) {
          return;
        }

        this._handleClose();
      }, 150);
    });
    
    // Input search
    this._input.addEventListener('input', (e) => {
      if (!this._config.searchable) return;
      const query = (e.target as HTMLInputElement).value;
      this._handleSearch(query);
    });

    // If the user presses down inside the options container we should
    // temporarily suppress blur-based closing until after the click has
    // been handled. Setting a flag that gets cleared in the next tick is
    // sufficient.
    this._optionsContainer.addEventListener('pointerdown', () => {
      this._suppressBlurClose = true;
      setTimeout(() => {
        this._suppressBlurClose = false;
      }, 150); // Increased timeout to ensure click finishes before blur checks
    });

    // Delegated click listener for improved event handling (robust across shadow DOM)
    const handleOptionEvent = (e: MouseEvent | PointerEvent) => {

      const path = (e.composedPath && e.composedPath()) || [e.target];
      let option: Element | null = null;

      for (const node of path as any[]) {
        if (!(node instanceof Element)) continue;
        try {
          if (node.matches('[data-sm-selectable], [data-selectable], [data-sm-state]')) {
            option = node;
            break;
          }
        } catch (err) {
          continue;
        }
      }

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
    };

    this._optionsContainer.addEventListener('click', handleOptionEvent);
    
    // Keyboard navigation
    this._input.addEventListener('keydown', (e) => this._handleKeydown(e));
    
    // Click outside to close — robust detection across shadow DOM and custom renderers
    document.addEventListener('pointerdown', (e) => {
      const path = (e.composedPath && e.composedPath()) || [];
      let clickedInside = false;

      for (const node of path as any[]) {
        if (node === this || node === this._container) {
          clickedInside = true;
          break;
        }

        if (node instanceof Node) {
          try {
            if (this._shadow && this._shadow.contains(node as Node)) {
              clickedInside = true;
              break;
            }
          } catch (err) {
            // ignore
          }
        }

        if (node instanceof Element) {
          try {
            if (node.matches('[data-sm-selectable], [data-selectable], [data-sm-state], .input-container, .select-container, .dropdown-arrow-container, .clear-control-button')) {
              clickedInside = true;
              break;
            }
          } catch (err) {
            // ignore
          }
        }
      }

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

    // close any other open selects before proceeding
    EnhancedSelect._instances.forEach(inst => {
      if (inst !== this) inst._handleClose();
    });

    // Always focus the input when opening so callers (arrow click,
    // programmatic `open()`, etc.) get the keyboard cursor.  This was a
    // frequent source of confusion in #14 where people opened the dropdown
    // but the text field never received focus.
    this._input.focus();

    this._markOpenStart();
    this._state.isOpen = true;
    this.setAttribute('data-open', 'true');
    this._liftStackingAncestors();
    this._dropdown.style.display = 'block';
    this._input.setAttribute('aria-expanded', 'true');
    this._updateArrowRotation();

    // Render options when opening
    this._renderOptions();
    this._syncDropdownPlacement();
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
    this.removeAttribute('data-open');
    this._restoreLiftedAncestors();
    this._dropdown.style.display = 'none';
    this._dropdown.setAttribute('data-placement', this._resolvedDropdownPlacement);
    this._input.setAttribute('aria-expanded', 'false');
    this._input.removeAttribute('aria-activedescendant');
    this._updateArrowRotation();
    
    this._emit('close', {});
    this._config.callbacks.onClose?.();
    this._announce('Options collapsed');
  }

  private _updateDropdownVisibility(): void {
    if (this._state.isOpen) {
      this.setAttribute('data-open', 'true');
      this._liftStackingAncestors();
      this._dropdown.style.display = 'block';
      this._syncDropdownPlacement();
      this._input.setAttribute('aria-expanded', 'true');
    } else {
      this.removeAttribute('data-open');
      this._restoreLiftedAncestors();
      this._dropdown.style.display = 'none';
      this._input.setAttribute('aria-expanded', 'false');
    }
  }

  private _liftStackingAncestors(): void {
    this._restoreLiftedAncestors();

    let ancestor = this.parentElement;
    while (ancestor && ancestor !== document.body) {
      if (this._createsStackingContext(ancestor)) {
        const hadMarker = ancestor.hasAttribute('data-smilodon-open-ancestor');
        this._liftedAncestors.push({
          element: ancestor,
          position: ancestor.style.position,
          zIndex: ancestor.style.zIndex,
          hadMarker,
        });

        if (getComputedStyle(ancestor).position === 'static') {
          ancestor.style.position = 'relative';
        }

        ancestor.style.zIndex = 'var(--select-ancestor-open-z-index, var(--select-host-open-z-index, var(--select-dropdown-z-index, 1000)))';
        ancestor.setAttribute('data-smilodon-open-ancestor', 'true');
      }

      ancestor = ancestor.parentElement;
    }
  }

  private _restoreLiftedAncestors(): void {
    for (const lifted of this._liftedAncestors) {
      lifted.element.style.position = lifted.position;
      lifted.element.style.zIndex = lifted.zIndex;

      if (!lifted.hadMarker) {
        lifted.element.removeAttribute('data-smilodon-open-ancestor');
      }
    }

    this._liftedAncestors = [];
  }

  private _createsStackingContext(element: HTMLElement): boolean {
    const style = getComputedStyle(element);

    if (style.position === 'fixed' || style.position === 'sticky') return true;
    if (style.zIndex !== 'auto' && style.position !== 'static') return true;
    if (style.opacity !== '1') return true;
    if (style.transform !== 'none') return true;
    if (style.filter !== 'none') return true;
    if ((style as CSSStyleDeclaration & { backdropFilter?: string }).backdropFilter && (style as CSSStyleDeclaration & { backdropFilter?: string }).backdropFilter !== 'none') return true;
    if (style.perspective !== 'none') return true;
    if (style.mixBlendMode !== 'normal') return true;
    if (style.isolation === 'isolate') return true;
    if (style.contain.includes('paint') || style.contain.includes('layout')) return true;
    if (style.willChange.includes('transform') || style.willChange.includes('opacity') || style.willChange.includes('filter')) return true;

    return false;
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
    // Clear previous active state
    if (this._state.activeIndex >= 0) {
      const prevOption = this._getOptionElementByIndex(this._state.activeIndex);
      if (prevOption) {
        // Check if it's a custom SelectOption or a lightweight DOM element
        if ('setActive' in prevOption && typeof (prevOption as any).setActive === 'function') {
          (prevOption as SelectOption).setActive(false);
        } else {
          // Lightweight option - remove active class
          prevOption.classList.remove('smilodon-option--active');
        }
      }
    }
    
    this._state.activeIndex = index;
    
    // Set new active state
    const option = this._getOptionElementByIndex(index);
    if (option) {
      // Check if it's a custom SelectOption or a lightweight DOM element
      if ('setActive' in option && typeof (option as any).setActive === 'function') {
        (option as SelectOption).setActive(true);
      } else {
        // Lightweight option - add active class
        option.classList.add('smilodon-option--active');
      }
      
      if (typeof option.scrollIntoView === 'function') {
        // Don't scroll wildly when just opening with pre-selections
        option.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
      
      // Announce position for screen readers
      const total = this._state.loadedItems.length;
      this._announce(`Item ${index + 1} of ${total}`);
      
      // Update aria-activedescendant using the actual option id when available
      const optionId = option.id || `${this._uniqueId}-option-${index}`;
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
    if (!item) {
      return;
    }
    const isCurrentlySelected = this._state.selectedIndices.has(index);

    // Keep active/focus styling aligned with the most recently interacted option.
    // Without this, a previously selected item may retain active classes/styles
    // after selecting a different option.
    this._state.activeIndex = index;
    
    
    
    if (this._config.selection.mode === 'single') {
      // Single select: clear previous and select new
      const wasSelected = this._state.selectedIndices.has(index);
      this._state.selectedIndices.clear();
      this._state.selectedItems.clear();
      
      if (!wasSelected || !this._config.selection.allowDeselect) {
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
    const item = this._state.selectedItems.get(index);
    const option = this._getOptionElementByIndex(index);

    this._state.selectedIndices.delete(index);
    this._state.selectedItems.delete(index);

    if (option && 'setSelected' in option && typeof (option as SelectOption).setSelected === 'function') {
      (option as SelectOption).setSelected(false);
    } else if (option) {
      option.classList.remove('selected', 'sm-selected', 'smilodon-option--selected');
      option.setAttribute('aria-selected', 'false');

      const stateTokens = (option.dataset.smState || '')
        .split(' ')
        .map(token => token.trim())
        .filter(token => token && token !== 'selected');

      if (stateTokens.length > 0) {
        option.dataset.smState = stateTokens.join(' ');
      } else {
        delete option.dataset.smState;
      }
    }
    
    this._updateInputDisplay();
    this._renderOptions();
    this._emitChange();
    
    const config = option && 'getConfig' in option && typeof (option as SelectOption).getConfig === 'function'
      ? (option as SelectOption).getConfig()
      : undefined;
    this._emit('remove', { item: config?.item ?? item, index });
  }

  private _updateInputDisplay(): void {
    const selectedItems = Array.from(this._state.selectedItems.values());
    const getLabel = this._config.serverSide.getLabelFromItem || ((item) => (item as any)?.label ?? String(item));
    
    if (selectedItems.length === 0) {
      this._input.value = '';
      this._input.placeholder = this._config.placeholder || 'Select an option...';
      // Clear any badges
      const existingBadges = this._inputContent.querySelectorAll('.selection-badge');
      existingBadges.forEach(badge => badge.remove());
    } else if (this._config.selection.mode === 'single') {
      this._input.value = getLabel(selectedItems[0]);
    } else {
      // Multi-select: show badges instead of text in input
      this._input.value = '';
      this._input.placeholder = '';
      
      // Clear existing badges
      const existingBadges = this._inputContent.querySelectorAll('.selection-badge');
      existingBadges.forEach(badge => badge.remove());
      
      // Create badges for each selected item
      const selectedEntries = Array.from(this._state.selectedItems.entries());
      selectedEntries.forEach(([index, item]) => {
        const badge = document.createElement('span');
        badge.className = 'selection-badge';
        if (this._config.styles.classNames?.badge) {
          badge.classList.add(...this._config.styles.classNames.badge.split(' ').filter(Boolean));
        }
        badge.setAttribute('part', 'chip');

        const badgeLabel = document.createElement('span');
        badgeLabel.className = 'selection-badge-label';
        if (this._config.styles.classNames?.badgeLabel) {
          badgeLabel.classList.add(...this._config.styles.classNames.badgeLabel.split(' ').filter(Boolean));
        }
        badgeLabel.setAttribute('part', 'chip-label');
        badgeLabel.textContent = getLabel(item);
        badge.appendChild(badgeLabel);
        
        // Add remove button to badge
        if (this._config.selection.showRemoveButton !== false) {
          const removeBtn = document.createElement('button');
          removeBtn.type = 'button';
          removeBtn.className = 'badge-remove';
          if (this._config.styles.classNames?.removeButton) {
            removeBtn.classList.add(...this._config.styles.classNames.removeButton.split(' ').filter(Boolean));
          }
          if (this._config.styles.classNames?.badgeRemove) {
            removeBtn.classList.add(...this._config.styles.classNames.badgeRemove.split(' ').filter(Boolean));
          }
          removeBtn.setAttribute('part', 'chip-remove');
          removeBtn.setAttribute('aria-label', `Remove ${getLabel(item)}`);

          const removeIcon = document.createElement('span');
          removeIcon.className = 'badge-remove-icon';
          removeIcon.setAttribute('part', 'chip-remove-icon');
          this._setIconContent(removeIcon, this._config.selection.removeButtonIcon, '×');
          removeBtn.appendChild(removeIcon);

          removeBtn.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            e.preventDefault();
          });
          removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this._handleOptionRemove(index);
          });

          badge.appendChild(removeBtn);
        }
        this._inputContent.insertBefore(badge, this._input);
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
      if (typeof option.scrollIntoView === 'function') {
        option.scrollIntoView({
          block: this._config.scrollToSelected.block || 'center',
          behavior: 'smooth',
        });
      }
      
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
    if (name !== 'diagnostic') {
      this._track('event', String(name), detail);
    }
  }

  private _track(source: 'event' | 'style' | 'limitation', name: string, detail?: unknown): void {
    const cfg = this._config.tracking;
    if (!cfg?.enabled) return;

    if (source === 'event' && !cfg.events) return;
    if (source === 'style' && !cfg.styling) return;
    if (source === 'limitation' && !cfg.limitations) return;

    const entry: TrackingEntry = {
      timestamp: Date.now(),
      source,
      name,
      detail,
    };

    const bucket = source === 'event'
      ? this._tracking.events
      : source === 'style'
        ? this._tracking.styles
        : this._tracking.limitations;

    bucket.push(entry);

    const maxEntries = Math.max(10, cfg.maxEntries || 200);
    if (bucket.length > maxEntries) {
      bucket.splice(0, bucket.length - maxEntries);
    }

    if (cfg.emitDiagnostics) {
      this.dispatchEvent(new CustomEvent('diagnostic', {
        detail: entry,
        bubbles: true,
        composed: true,
      }));
    }
  }

  private _getKnownLimitationDefinitions(): Omit<LimitationState, 'mode' | 'status'>[] {
    return [
      {
        id: 'variableItemHeight',
        title: 'Variable item height',
        description: 'Virtualization assumes fixed or estimated item heights; fully dynamic heights are not yet supported.',
        workaround: 'Use consistent item heights or set estimatedItemHeight to your dominant row size.',
      },
      {
        id: 'builtInFetchPaginationApi',
        title: 'Built-in fetch/pagination API',
        description: 'Core does not include a built-in fetchUrl/searchUrl pagination transport.',
        workaround: 'Use onSearch/onLoadMore callbacks and update data via setItems().',
      },
      {
        id: 'virtualizationOverheadSmallLists',
        title: 'Virtualization overhead for small lists',
        description: 'Virtualization can add slight overhead on very small lists.',
        workaround: 'Disable virtualization for tiny datasets when micro-latency is critical.',
      },
      {
        id: 'runtimeModeSwitching',
        title: 'Runtime single/multi mode switching',
        description: 'Switching between single and multi mode can require state reset for consistency.',
        workaround: 'Enable autoMitigateRuntimeModeSwitch or recreate/reset component state when toggling modes.',
      },
      {
        id: 'legacyBrowserSupport',
        title: 'Legacy browser support',
        description: 'Official support targets modern evergreen browsers.',
      },
      {
        id: 'webkitArchLinux',
        title: 'Playwright WebKit on Arch-based Linux',
        description: 'Native WebKit Playwright bundle depends on unavailable legacy system libraries on Arch-based distros.',
        workaround: 'Run WebKit E2E tests via Playwright Docker image.',
      },
    ];
  }

  private _evaluateLimitationStatus(id: KnownLimitationId): 'active' | 'mitigated' | 'suppressed' {
    const policyMode = this._config.limitations?.policies?.[id]?.mode ?? 'default';
    if (policyMode === 'suppress') return 'suppressed';

    if (id === 'runtimeModeSwitching' && this._config.limitations?.autoMitigateRuntimeModeSwitch) {
      return 'mitigated';
    }

    return 'active';
  }

  getKnownLimitations(): LimitationState[] {
    return this._getKnownLimitationDefinitions().map((limitation) => {
      const mode = this._config.limitations?.policies?.[limitation.id]?.mode ?? 'default';
      return {
        ...limitation,
        mode,
        status: this._evaluateLimitationStatus(limitation.id),
      };
    });
  }

  setLimitationPolicies(policies: LimitationPolicyMap): void {
    const next = {
      ...(this._config.limitations?.policies || {}),
      ...policies,
    };

    this.updateConfig({
      limitations: {
        ...(this._config.limitations || { autoMitigateRuntimeModeSwitch: true, policies: {} }),
        policies: next,
      },
    });

    this._track('limitation', 'policiesUpdated', { policies: next });
  }

  getTrackingSnapshot(): TrackingSnapshot {
    return {
      events: [...this._tracking.events],
      styles: [...this._tracking.styles],
      limitations: [...this._tracking.limitations],
    };
  }

  clearTracking(source?: 'event' | 'style' | 'limitation' | 'all'): void {
    if (!source || source === 'all') {
      this._tracking.events = [];
      this._tracking.styles = [];
      this._tracking.limitations = [];
      return;
    }

    if (source === 'event') this._tracking.events = [];
    if (source === 'style') this._tracking.styles = [];
    if (source === 'limitation') this._tracking.limitations = [];
  }

  getCapabilities(): SelectCapabilitiesReport {
    return {
      styling: {
        classMap: true,
        optionRenderer: true,
        groupHeaderRenderer: true,
        cssCustomProperties: true,
        shadowParts: true,
        globalStyleMirroring: true,
      },
      events: {
        emitted: ['select', 'open', 'close', 'search', 'change', 'loadMore', 'remove', 'clear', 'error', 'diagnostic'],
        diagnosticEvent: true,
      },
      functionality: {
        multiSelect: true,
        searchable: true,
        infiniteScroll: true,
        loadMore: true,
        clearControl: true,
        groupedItems: true,
        serverSideSelection: true,
        runtimeModeSwitchMitigation: Boolean(this._config.limitations?.autoMitigateRuntimeModeSwitch),
      },
      limitations: this.getKnownLimitations(),
    };
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
    this._track('style', 'optionRendererChanged', { enabled: Boolean(renderer) });
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
    const previousMode = this._config.selection.mode;
    this._config = this._mergeConfig(this._config, config);

    if (
      previousMode !== this._config.selection.mode &&
      this._config.limitations?.autoMitigateRuntimeModeSwitch
    ) {
      this.clear();
      this._track('limitation', 'runtimeModeSwitchMitigated', {
        from: previousMode,
        to: this._config.selection.mode,
      });
    } else if (previousMode !== this._config.selection.mode) {
      this._track('limitation', 'runtimeModeSwitchDetected', {
        from: previousMode,
        to: this._config.selection.mode,
      });
    }
    
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
      this._clearControlIcon.innerHTML = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }

    this._syncStyleConfigVariables();

    if (this._dropdown) {
      if (this._config.selection.mode === 'multi') {
        this._dropdown.setAttribute('aria-multiselectable', 'true');
      } else {
        this._dropdown.removeAttribute('aria-multiselectable');
      }
    }

    this._syncDirectionConfig();
    this._syncInputContainerMode();
    this._syncMultiSelectDisplayConfig();
    this._syncDropdownPlacement();
    
    // Re-initialize observers in case infinite scroll was enabled/disabled
    this._initializeObservers();

    this._syncClearControlState();
    this._updateInputDisplay();
    
    this._renderOptions();
  }

  private _mergeConfig<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const result = { ...target };

    for (const key in source) {
      if (!Object.prototype.hasOwnProperty.call(source, key)) continue;

      const sourceValue = source[key];
      const targetValue = result[key];

      if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
        result[key] = this._mergeConfig(
          targetValue && typeof targetValue === 'object' ? targetValue : {},
          sourceValue as any
        ) as any;
      } else {
        result[key] = sourceValue as any;
      }
    }

    return result;
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
    this._renderCycleId += 1;
    const renderCycleId = this._renderCycleId;
    
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
      this._state.groupedItems.forEach((group, groupIndex) => {
        let header: HTMLElement;
        if (this.groupHeaderRenderer) {
          header = this.groupHeaderRenderer(group, groupIndex);
          // make sure the returned element has the correct semantics so
          // people can style it. we add the class/part even if the renderer
          // returned something else to ensure backward compatibility.
          if (!(header instanceof HTMLElement)) {
            // fall back to default if API is misused
            header = document.createElement('div');
            header.textContent = String(group.label);
          }
        } else {
          header = document.createElement('div');
          header.textContent = group.label;
        }

        header.classList.add('group-header');
        if (this._config.styles.classNames?.groupHeader) {
          header.classList.add(...this._config.styles.classNames.groupHeader.split(' ').filter(Boolean));
        }
        header.setAttribute('part', 'group-header');
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
      const filteredIndices: number[] = [];
      this._state.loadedItems.forEach((item, index) => {
        if (query) {
          try {
            const label = String(getLabel(item)).toLowerCase();
            if (!label.includes(query)) return;
          } catch (_e) {
            return;
          }
        }

        filteredIndices.push(index);
      });

      if (filteredIndices.length === 0 && !this._state.isBusy) {
        const empty = document.createElement('div');
        empty.setAttribute('part', 'no-results');
        empty.className = 'empty-state';
        if (query) {
          empty.textContent = `No results found for "${this._state.searchQuery}"`;
        } else {
          empty.textContent = 'No options available';
        }
        this._optionsContainer.appendChild(empty);
      } else {
        const shouldIncrementalRender =
          this._config.virtualize !== false
          && this._state.groupedItems.length === 0
          && filteredIndices.length > 300;

        if (shouldIncrementalRender) {
          const chunkSize = 80;
          let cursor = 0;
          let maxRenderTarget = 0;

          if (this._state.selectedIndices.size > 0 && this._config.scrollToSelected.enabled) {
            const indices = Array.from(this._state.selectedIndices).sort((a, b) => a - b);
            const targetIndex = this._config.scrollToSelected.multiSelectTarget === 'first' ? indices[0] : indices[indices.length - 1];
            const filteredPos = filteredIndices.indexOf(targetIndex);
            if (filteredPos !== -1) {
              maxRenderTarget = filteredPos + 20; // Ensure we render up to the selection
            }
          }

          const renderChunk = () => {
            if (renderCycleId !== this._renderCycleId) return;

            const fragment = document.createDocumentFragment();
            const chunkEnd = Math.min(Math.max(cursor + chunkSize, maxRenderTarget), filteredIndices.length);
            maxRenderTarget = 0; // Reset after fast-forwarding

            for (; cursor < chunkEnd; cursor += 1) {
              const itemIndex = filteredIndices[cursor];
              const item = this._state.loadedItems[itemIndex];
              this._renderSingleOption(item, itemIndex, getValue, getLabel, fragment);
            }

            this._optionsContainer.appendChild(fragment);

            if (cursor < filteredIndices.length) {
              requestAnimationFrame(renderChunk);
            } else {
              if (renderCycleId !== this._renderCycleId) return;

              if (!this._state.isBusy && (this._config.loadMore.enabled || this._config.infiniteScroll.enabled) && this._state.loadedItems.length > 0) {
                this._addLoadMoreTrigger();
              }

              this._finalizePerfMarks();
            }
          };

          renderChunk();
          return;
        }

        filteredIndices.forEach((itemIndex) => {
          const item = this._state.loadedItems[itemIndex];
          this._renderSingleOption(item, itemIndex, getValue, getLabel);
        });
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

  private _renderSingleOption(
    item: any,
    index: number,
    getValue: (item: any) => any,
    getLabel: (item: any) => string,
    targetContainer: Node = this._optionsContainer,
  ) {
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
      optionElement.setAttribute('dir', this._config.direction ?? 'ltr');
      targetContainer.appendChild(optionElement);
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
      removeButtonIcon: this._config.selection.removeButtonIcon,
      classMap: this.classMap,
      className: this._config.styles.classNames?.option,
    });

    if (this._config.styles.classNames?.option) {
      option.classList.add(...this._config.styles.classNames.option.split(' ').filter(Boolean));
    }
    option.setAttribute('dir', this._config.direction ?? 'ltr');
    if (isSelected && this._config.styles.classNames?.selectedOption) {
      option.classList.add(...this._config.styles.classNames.selectedOption.split(' ').filter(Boolean));
    }
    if (this._state.activeIndex === index && this._config.styles.classNames?.activeOption) {
      option.classList.add(...this._config.styles.classNames.activeOption.split(' ').filter(Boolean));
    }
    if (isDisabled && this._config.styles.classNames?.disabledOption) {
      option.classList.add(...this._config.styles.classNames.disabledOption.split(' ').filter(Boolean));
    }

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

    // Do NOT bind a native click listener here for SelectOption elements.
    // Like custom rendered options, they are fully handled by the `handleOptionEvent` delegator 
    // on `this._optionsContainer` (line 1221).
    // Adding this listener causes the double-click toggle bug since both fire on selection!
    
    option.addEventListener('optionRemove', (event: Event) => {
      const detail = (event as CustomEvent).detail as { index?: number } | undefined;
      const targetIndex = detail?.index ?? index;
      this._handleOptionRemove(targetIndex);
    });

    targetContainer.appendChild(option);
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
    if (this._config.styles.classNames?.option) {
      optionEl.classList.add(...this._config.styles.classNames.option.split(' ').filter(Boolean));
    }
    
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
      if (this._config.styles.classNames?.selectedOption) {
        optionEl.classList.add(...this._config.styles.classNames.selectedOption.split(' ').filter(Boolean));
      }
    } else {
      optionEl.classList.remove(...selectedClasses);
      optionEl.classList.remove('smilodon-option--selected');
      if (this._config.styles.classNames?.selectedOption) {
        optionEl.classList.remove(...this._config.styles.classNames.selectedOption.split(' ').filter(Boolean));
      }
    }

    if (isActive) {
      optionEl.classList.add(...activeClasses);
      optionEl.classList.add('smilodon-option--active');
      if (this._config.styles.classNames?.activeOption) {
        optionEl.classList.add(...this._config.styles.classNames.activeOption.split(' ').filter(Boolean));
      }
    } else {
      optionEl.classList.remove(...activeClasses);
      optionEl.classList.remove('smilodon-option--active');
      if (this._config.styles.classNames?.activeOption) {
        optionEl.classList.remove(...this._config.styles.classNames.activeOption.split(' ').filter(Boolean));
      }
    }

    if (isDisabled) {
      optionEl.classList.add(...disabledClasses);
      optionEl.classList.add('smilodon-option--disabled');
      if (this._config.styles.classNames?.disabledOption) {
        optionEl.classList.add(...this._config.styles.classNames.disabledOption.split(' ').filter(Boolean));
      }
    } else {
      optionEl.classList.remove(...disabledClasses);
      optionEl.classList.remove('smilodon-option--disabled');
      if (this._config.styles.classNames?.disabledOption) {
        optionEl.classList.remove(...this._config.styles.classNames.disabledOption.split(' ').filter(Boolean));
      }
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
      // Intentionally NOT binding native option click listeners for custom options! 
      // All option interactions are globally handled by _optionsContainer.addEventListener('click', handleOptionEvent);
      // Re-attaching here causes the double-click toggle bug if a child component fails to stopPropagation.
      
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