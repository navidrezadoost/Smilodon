/**
 * Global Configuration System for Select Components
 * Allows users to define default behaviors that can be overridden at component level
 */

export interface ScrollToSelectedConfig {
  /** Whether to scroll to selected item when dropdown opens/closes */
  enabled: boolean;
  /** Which selected item to scroll to in multi-select mode: 'first' | 'last' */
  multiSelectTarget: 'first' | 'last';
  /** Scroll behavior */
  behavior?: ScrollBehavior;
  /** Scroll block alignment */
  block?: ScrollLogicalPosition;
}

export interface LoadMoreConfig {
  /** Enable load more functionality */
  enabled: boolean;
  /** Number of items to load per increment */
  itemsPerLoad: number;
  /** Threshold (in pixels from bottom) to trigger auto-load */
  threshold?: number;
  /** Show loading indicator */
  showLoader?: boolean;
}

export interface BusyBucketConfig {
  /** Enable busy/loading state bucket */
  enabled: boolean;
  /** Show spinner in bucket */
  showSpinner?: boolean;
  /** Custom loading message */
  message?: string;
  /** Minimum display time (ms) to prevent flashing */
  minDisplayTime?: number;
}

export interface ExpandableConfig {
  /** Enable expandable dropdown height */
  enabled: boolean;
  /** Height when collapsed (default) */
  collapsedHeight?: string;
  /** Height when expanded */
  expandedHeight?: string;
  /** Label for the expand button */
  expandLabel?: string;
  /** Label for the collapse button */
  collapseLabel?: string;
}

export interface SelectionConfig {
  /** Single or multi-select mode */
  mode: 'single' | 'multi';
  /** Allow deselection in single-select mode */
  allowDeselect?: boolean;
  /** Maximum selections in multi-select (0 = unlimited) */
  maxSelections?: number;
  /** Show remove button on selected options in multi-select */
  showRemoveButton?: boolean;
  /** Close dropdown after selection in single-select */
  closeOnSelect?: boolean;
}

export interface StyleConfig {
  /** Container styles */
  container?: Partial<CSSStyleDeclaration>;
  /** Dropdown styles */
  dropdown?: Partial<CSSStyleDeclaration>;
  /** Option item styles */
  option?: Partial<CSSStyleDeclaration>;
  /** Selected option styles */
  selectedOption?: Partial<CSSStyleDeclaration>;
  /** Disabled option styles */
  disabledOption?: Partial<CSSStyleDeclaration>;
  /** Hover option styles */
  hoverOption?: Partial<CSSStyleDeclaration>;
  /** Input field styles */
  input?: Partial<CSSStyleDeclaration>;
  /** Loading indicator styles */
  loader?: Partial<CSSStyleDeclaration>;
  /** Custom CSS class names */
  classNames?: {
    container?: string;
    dropdown?: string;
    option?: string;
    selectedOption?: string;
    disabledOption?: string;
    input?: string;
    loader?: string;
    removeButton?: string;
  };
}

export interface ServerSideConfig {
  /** Enable server-side data management */
  enabled: boolean;
  /** Initial selected value(s) from server */
  initialSelectedValues?: unknown[];
  /** Initial selected indices from server */
  initialSelectedIndices?: number[];
  /** Function to fetch pre-selected items not in current page */
  fetchSelectedItems?: (values: unknown[]) => Promise<unknown[]>;
  /** Value accessor function */
  getValueFromItem?: (item: unknown) => unknown;
  /** Label accessor function */
  getLabelFromItem?: (item: unknown) => string;
}

export interface InfiniteScrollConfig {
  /** Enable infinite scroll */
  enabled: boolean;
  /** Page size for pagination */
  pageSize: number;
  /** Initial page */
  initialPage?: number;
  /** Cache loaded pages */
  cachePages?: boolean;
  /** Maximum cached pages (LRU eviction) */
  maxCachedPages?: number;
  /** Preload adjacent pages */
  preloadAdjacent?: boolean;
  /** Scroll restoration strategy for selected items on distant pages */
  scrollRestoration?: 'auto' | 'manual' | 'disabled';
}

export interface CallbackConfig {
  /** Called when option is selected/deselected */
  onSelect?: (data: { item: unknown; index: number; value: unknown; label: string; selected: boolean }) => void;
  /** Called when dropdown opens */
  onOpen?: () => void;
  /** Called when dropdown closes */
  onClose?: () => void;
  /** Called when search query changes */
  onSearch?: (query: string) => void;
  /** Called when more items are loaded */
  onLoadMore?: (page: number) => void;
  /** Called when selection changes */
  onChange?: (selectedItems: unknown[], selectedValues: unknown[]) => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

export interface GlobalSelectConfig {
  /** Selection behavior */
  selection: SelectionConfig;
  /** Scroll to selected configuration */
  scrollToSelected: ScrollToSelectedConfig;
  /** Load more configuration */
  loadMore: LoadMoreConfig;
  /** Busy bucket configuration */
  busyBucket: BusyBucketConfig;
  /** Style customization */
  styles: StyleConfig;
  /** Server-side configuration */
  serverSide: ServerSideConfig;
  /** Infinite scroll configuration */
  infiniteScroll: InfiniteScrollConfig;
  /** Expandable dropdown configuration */
  expandable: ExpandableConfig;
  /** Callbacks */
  callbacks: CallbackConfig;
  /** Enable/disable entire component */
  enabled: boolean;
  /** Enable search/filter */
  searchable?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Virtualization */
  virtualize?: boolean;
  /** Estimated item height for virtualization */
  estimatedItemHeight?: number;
}

/**
 * Default global configuration
 */
const defaultConfig: GlobalSelectConfig = {
  selection: {
    mode: 'single',
    allowDeselect: false,
    maxSelections: 0,
    showRemoveButton: true,
    closeOnSelect: true,
  },
  scrollToSelected: {
    enabled: true,
    multiSelectTarget: 'first',
    behavior: 'smooth',
    block: 'nearest',
  },
  loadMore: {
    enabled: false,
    itemsPerLoad: 3,
    threshold: 100,
    showLoader: true,
  },
  busyBucket: {
    enabled: true,
    showSpinner: true,
    message: 'Loading...',
    minDisplayTime: 200,
  },
  styles: {
    classNames: {},
  },
  serverSide: {
    enabled: false,
    getValueFromItem: (item: unknown) => (item as any)?.value ?? item,
    getLabelFromItem: (item: unknown) => (item as any)?.label ?? String(item),
  },
  infiniteScroll: {
    enabled: false,
    pageSize: 20,
    initialPage: 1,
    cachePages: true,
    maxCachedPages: 10,
    preloadAdjacent: true,
    scrollRestoration: 'auto',
  },
  expandable: {
    enabled: false,
    collapsedHeight: '300px',
    expandedHeight: '500px',
    expandLabel: 'Show more',
    collapseLabel: 'Show less',
  },
  callbacks: {},
  enabled: true,
  searchable: false,
  placeholder: 'Select an option...',
  virtualize: true,
  estimatedItemHeight: 48,
};

/**
 * Global configuration instance
 */
class SelectConfigManager {
  private config: GlobalSelectConfig;

  constructor() {
    this.config = this.deepClone(defaultConfig);
  }

  /**
   * Get current global configuration
   */
  getConfig(): Readonly<GlobalSelectConfig> {
    return this.config;
  }

  /**
   * Update global configuration (deep merge)
   */
  updateConfig(updates: Partial<GlobalSelectConfig>): void {
    this.config = this.deepMerge(this.config, updates);
  }

  /**
   * Reset to default configuration
   */
  resetConfig(): void {
    this.config = this.deepClone(defaultConfig);
  }

  /**
   * Merge component-level config with global config
   * Component-level config takes precedence
   */
  mergeWithComponentConfig(componentConfig: Partial<GlobalSelectConfig>): GlobalSelectConfig {
    return this.deepMerge(this.deepClone(this.config), componentConfig);
  }

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  private deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const result = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const sourceValue = source[key];
        const targetValue = result[key];
        
        if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
          result[key] = this.deepMerge(
            targetValue && typeof targetValue === 'object' ? targetValue : {},
            sourceValue
          ) as any;
        } else {
          result[key] = sourceValue as any;
        }
      }
    }
    
    return result;
  }
}

/**
 * Singleton instance
 */
export const selectConfig = new SelectConfigManager();

/**
 * Helper function to configure select globally
 */
export function configureSelect(config: Partial<GlobalSelectConfig>): void {
  selectConfig.updateConfig(config);
}

/**
 * Helper function to reset select configuration
 */
export function resetSelectConfig(): void {
  selectConfig.resetConfig();
}
