import type { NativeSelectOptions, SelectEventName, SelectEventsDetailMap, RendererHelpers } from '../types';
import { createRendererHelpers, OptionRenderer, OptionTemplate, renderTemplate } from '../renderers/contracts';
import { Virtualizer } from '../utils/virtualizer';

export class NativeSelectElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['placement', 'strategy', 'portal'];
  }

  private _options: NativeSelectOptions = {};
  private _shadow: ShadowRoot;
  private _listRoot: HTMLElement;
  private _items: unknown[] = [];
  private _helpers: RendererHelpers;
  private _virtualizer?: Virtualizer;
  
  // Multi-select & interaction state
  private _selectedSet = new Set<number>(); // indices
  private _selectedItems = new Map<number, unknown>(); // index -> item
  private _activeIndex = -1;
  private _multi = false;
  private _typeBuffer = '';
  private _typeTimeout?: number;
  private _liveRegion?: HTMLElement;

  constructor() {
    super();
    this._shadow = this.attachShadow({ mode: 'open' });
    this._listRoot = document.createElement('div');
    this._listRoot.setAttribute('role', 'listbox');
    this._listRoot.setAttribute('tabindex', '0');
    this._shadow.appendChild(this._listRoot);

    // Live region for screen reader announcements
    this._liveRegion = document.createElement('div');
    this._liveRegion.setAttribute('role', 'status');
    this._liveRegion.setAttribute('aria-live', 'polite');
    this._liveRegion.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;';
    this._shadow.appendChild(this._liveRegion);

    this._helpers = createRendererHelpers((item, index) => this._onSelect(item, index));
    
    // Delegated click
    this._listRoot.addEventListener('click', (e) => {
      const el = (e.target as HTMLElement).closest('[data-selectable]') as HTMLElement | null;
      if (!el) return;
      const idx = Number(el.dataset.index);
      const item = this._items[idx];
      this._onSelect(item, idx);
    });

    // Keyboard navigation
    this._listRoot.addEventListener('keydown', (e) => this._onKeydown(e));
  }

  connectedCallback() {
    // Initialize ARIA roles and open event
    this._listRoot.setAttribute('role', 'listbox');
    this._listRoot.setAttribute('aria-label', 'Options list');
    if (this._multi) this._listRoot.setAttribute('aria-multiselectable', 'true');
    this._emit('open', {});
  }

  disconnectedCallback() {
    this._emit('close', {});
    // Cleanup: remove listeners if any were added outside constructor
    if (this._typeTimeout) window.clearTimeout(this._typeTimeout);
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null) {
    switch (name) {
      case 'placement':
        this._options.placement = (newValue ?? undefined) as NativeSelectOptions['placement'];
        break;
      case 'strategy':
        this._options.strategy = (newValue ?? undefined) as NativeSelectOptions['strategy'];
        break;
      case 'portal':
        this._options.portal = newValue === 'true' ? true : newValue === 'false' ? false : undefined;
        break;
    }
  }

  set items(items: unknown[]) {
    this._items = items ?? [];
    // initialize virtualizer with estimated height (default 48) and buffer
    this._virtualizer = new Virtualizer(
      this._listRoot,
      this._items.length,
      (i) => this._items[i],
      { estimatedItemHeight: 48, buffer: 5 }
    );
    this.render();
  }

  get items() {
    return this._items;
  }

  set multi(value: boolean) {
    this._multi = value;
    if (value) {
      this._listRoot.setAttribute('aria-multiselectable', 'true');
    } else {
      this._listRoot.removeAttribute('aria-multiselectable');
    }
  }

  get multi() {
    return this._multi;
  }

  get selectedIndices(): number[] {
    return Array.from(this._selectedSet);
  }

  get selectedItems(): unknown[] {
    return Array.from(this._selectedItems.values());
  }

  set optionTemplate(template: OptionTemplate | undefined) {
    this._options.optionTemplate = template;
    this.render();
  }

  set optionRenderer(renderer: OptionRenderer | undefined) {
    this._options.optionRenderer = renderer;
    this.render();
  }

  /**
   * Public API: setItems() method for compatibility with EnhancedSelect
   * Accepts an array of items which can be:
   * - Simple primitives (string, number)
   * - Objects with {label, value} structure
   * - Objects with {label, value, optionComponent} for custom rendering (v1.2.0+)
   */
  setItems(items: unknown[]): void {
    this.items = items ?? [];
  }

  /**
   * Public API: setValue() method to programmatically select an item
   * For single select: clears selection and selects the item matching the value
   * For multi-select: adds to selection if not already selected
   */
  setValue(value: unknown): void {
    if (value === null || value === undefined || value === '') {
      // Clear selection
      this._selectedSet.clear();
      this._selectedItems.clear();
      this._activeIndex = -1;
      this.render();
      return;
    }

    // Find item by value
    const index = this._items.findIndex(item => {
      if (typeof item === 'object' && item !== null && 'value' in item) {
        return (item as any).value === value;
      }
      return item === value;
    });

    if (index >= 0) {
      const item = this._items[index];
      if (!this._multi) {
        // Single select: clear and set
        this._selectedSet.clear();
        this._selectedItems.clear();
      }
      this._selectedSet.add(index);
      this._selectedItems.set(index, item);
      this._activeIndex = index;
      this.render();
    }
  }

  /**
   * Public API: getValue() method to get currently selected value(s)
   * Returns single value for single-select, array for multi-select
   */
  getValue(): unknown | unknown[] {
    const values = Array.from(this._selectedItems.values()).map(item => {
      if (typeof item === 'object' && item !== null && 'value' in item) {
        return (item as any).value;
      }
      return item;
    });
    
    return this._multi ? values : (values[0] ?? null);
  }

  render() {
    const { optionTemplate, optionRenderer } = this._options;
    const viewportHeight = this.getBoundingClientRect().height || 300;
    const scrollTop = this.scrollTop || 0;
    
    // Update aria-activedescendant
    if (this._activeIndex >= 0) {
      this._listRoot.setAttribute('aria-activedescendant', `option-${this._activeIndex}`);
    } else {
      this._listRoot.removeAttribute('aria-activedescendant');
    }

    if (this._virtualizer) {
      const { startIndex, endIndex } = this._virtualizer.computeWindow(scrollTop, viewportHeight);
      this._virtualizer.render(startIndex, endIndex, (node, item, i) => {
        this._applyOptionAttrs(node, i);
        if (optionRenderer) {
          const el = optionRenderer(item, i, this._helpers);
          // replace node contents
          node.replaceChildren(el);
        } else if (optionTemplate) {
          const wrapper = document.createElement('div');
          wrapper.innerHTML = optionTemplate(item, i);
          const el = wrapper.firstElementChild as HTMLElement | null;
          node.replaceChildren(el ?? document.createTextNode(String(item)));
        } else {
          // Handle {label, value} objects or primitives
          const displayText = (typeof item === 'object' && item !== null && 'label' in item)
            ? String((item as any).label)
            : String(item);
          node.textContent = displayText;
        }
      });
      return;
    }
    const frag = document.createDocumentFragment();
    for (let i = 0; i < this._items.length; i++) {
      const item = this._items[i];
      if (optionRenderer) {
        const el = optionRenderer(item, i, this._helpers);
        if (!el.hasAttribute('data-selectable')) {
          el.setAttribute('data-selectable', '');
          el.setAttribute('data-index', String(i));
        }
        this._applyOptionAttrs(el, i);
        frag.appendChild(el);
      } else if (optionTemplate) {
        // Fast path: render all via DocumentFragment in one call
        renderTemplate(this._listRoot, this._items, optionTemplate);
        // Apply ARIA attrs after template render
        this._applyAriaToAll();
        return; // rendering complete
      } else {
        const el = document.createElement('div');
        // Handle {label, value} objects or primitives
        const displayText = (typeof item === 'object' && item !== null && 'label' in item)
          ? String((item as any).label)
          : String(item);
        el.textContent = displayText;
        el.setAttribute('data-selectable', '');
        el.setAttribute('data-index', String(i));
        this._applyOptionAttrs(el, i);
        frag.appendChild(el);
      }
    }
    this._listRoot.replaceChildren(frag);
  }

  private _applyOptionAttrs(node: HTMLElement, index: number) {
    node.setAttribute('role', 'option');
    node.id = `option-${index}`;
    if (this._selectedSet.has(index)) {
      node.setAttribute('aria-selected', 'true');
    } else {
      node.setAttribute('aria-selected', 'false');
    }
  }

  private _applyAriaToAll() {
    const children = Array.from(this._listRoot.children) as HTMLElement[];
    for (const child of children) {
      const idx = Number(child.dataset.index);
      if (Number.isFinite(idx)) this._applyOptionAttrs(child, idx);
    }
  }

  private _emit<K extends SelectEventName>(name: K, detail: SelectEventsDetailMap[K]) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }));
  }

  // Multi-select and interaction methods
  private _onSelect(item: unknown, index: number) {
    if (this._multi) {
      if (this._selectedSet.has(index)) {
        this._selectedSet.delete(index);
        this._selectedItems.delete(index);
      } else {
        this._selectedSet.add(index);
        this._selectedItems.set(index, item);
      }
    } else {
      this._selectedSet.clear();
      this._selectedItems.clear();
      this._selectedSet.add(index);
      this._selectedItems.set(index, item);
    }
    this._activeIndex = index;
    this.render();
    
    // Emit with all required fields
    const selected = this._selectedSet.has(index);
    const value = (item as any)?.value ?? item;
    const label = (item as any)?.label ?? String(item);
    
    this._emit('select', { 
      item, 
      index, 
      value,
      label,
      selected,
      multi: this._multi 
    });
    
    // Emit 'change' event for better React compatibility
    this._emit('change', { 
      selectedItems: Array.from(this._selectedItems.values()),
      selectedValues: Array.from(this._selectedItems.values()).map(i => (i as any)?.value ?? i),
      selectedIndices: Array.from(this._selectedSet)
    });
    
    this._announce(`Selected ${label}`);
  }

  private _onKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this._moveActive(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this._moveActive(-1);
        break;
      case 'Home':
        e.preventDefault();
        this._setActive(0);
        break;
      case 'End':
        e.preventDefault();
        this._setActive(this._items.length - 1);
        break;
      case 'PageDown':
        e.preventDefault();
        this._moveActive(10);
        break;
      case 'PageUp':
        e.preventDefault();
        this._moveActive(-10);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (this._activeIndex >= 0) {
          const item = this._items[this._activeIndex];
          this._onSelect(item, this._activeIndex);
        }
        break;
      case 'Escape':
        e.preventDefault();
        this._emit('close', {});
        break;
      default:
        // Type-ahead buffer
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
          this._onType(e.key);
        }
        break;
    }
  }

  private _moveActive(delta: number) {
    const next = Math.max(0, Math.min(this._items.length - 1, this._activeIndex + delta));
    this._setActive(next);
  }

  private _setActive(index: number) {
    this._activeIndex = index;
    this.render();
    this._scrollToActive();
    this._announce(`Navigated to ${String(this._items[index])}`);
  }

  private _scrollToActive() {
    const el = this._shadow.getElementById(`option-${this._activeIndex}`);
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  private _onType(char: string) {
    if (this._typeTimeout) window.clearTimeout(this._typeTimeout);
    this._typeBuffer += char.toLowerCase();
    this._typeTimeout = window.setTimeout(() => {
      this._typeBuffer = '';
    }, 400);
    
    // Find first matching item
    const match = this._items.findIndex((item) => String(item).toLowerCase().startsWith(this._typeBuffer));
    if (match >= 0) {
      this._setActive(match);
    }
  }

  private _announce(msg: string) {
    if (this._liveRegion) {
      this._liveRegion.textContent = msg;
      setTimeout(() => {
        if (this._liveRegion) this._liveRegion.textContent = '';
      }, 1000);
    }
  }

  // Focus management
  focus() {
    this._listRoot.focus();
  }
}

customElements.define('smilodon-select', NativeSelectElement);
