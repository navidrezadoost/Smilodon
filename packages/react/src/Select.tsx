"use client";

import React, {
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useState,
  useMemo,
} from "react";
import { createRoot, type Root } from "react-dom/client";
import { createPortal } from "react-dom";
import type {
  SelectEventDetail,
  SearchEventDetail,
  ChangeEventDetail,
  LoadMoreEventDetail,
  ClearEventDetail,
  GroupedItem,
  RendererHelpers,
  DiagnosticEventDetail,
  LimitationPolicyMap,
  TrackingSnapshot,
  SelectCapabilitiesReport,
  LimitationState,
  SelectionConfig,
  MultiSelectDisplayConfig,
  ScrollToSelectedConfig,
  StyleConfig as CoreStyleConfig,
  SelectInstanceConfig,
  SearchDataRequest,
  LoadMoreDataRequest,
  DataRequestCancelNotification,
  DataProjectionEventDetail,
  DataLoadingConfigErrorDetail,
  DataLoadingStateSnapshot,
  DataRequestCompletion,
  DataRequestCompletionResult,
  ResolvedDataLoadingConfig,
  EmptyStateContext,
} from "@smilodon/core";

type CoreModule = typeof import("@smilodon/core");

const DEFAULT_DATA_LOADING_CONFIG: ResolvedDataLoadingConfig = {
  protocol: "legacy",
  searchMode: "local",
  paginationMode: "page",
  firstPage: 1,
} as const;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function areSemanticallyEqual(
  left: unknown,
  right: unknown,
  seen = new WeakMap<object, WeakMap<object, boolean>>(),
): boolean {
  if (Object.is(left, right)) return true;
  if (left === null || right === null || typeof left !== "object" || typeof right !== "object") {
    return false;
  }

  const leftArray = Array.isArray(left);
  const rightArray = Array.isArray(right);
  if (leftArray !== rightArray) return false;
  if (!leftArray && (!isPlainRecord(left) || !isPlainRecord(right))) return false;
  if (leftArray && !Array.isArray(right)) return false;
  if (leftArray && rightArray && left.length !== right.length) return false;

  const leftPrototype = Object.getPrototypeOf(left);
  const rightPrototype = Object.getPrototypeOf(right);
  if (leftPrototype !== rightPrototype && !(isPlainRecord(left) && isPlainRecord(right))) return false;

  const prior = seen.get(left)?.get(right);
  if (prior !== undefined) return prior;
  let rightPairs = seen.get(left);
  if (!rightPairs) {
    rightPairs = new WeakMap<object, boolean>();
    seen.set(left, rightPairs);
  }
  // Mark the pair before descending so equivalent cyclic plain data can compare.
  rightPairs.set(right, true);

  const enumerableKeys = (value: object) =>
    Reflect.ownKeys(value).filter((key) => Object.getOwnPropertyDescriptor(value, key)?.enumerable);
  const leftKeys = enumerableKeys(left);
  const rightKeys = enumerableKeys(right);
  const rightKeySet = new Set(rightKeys);
  if (leftKeys.length !== rightKeys.length) {
    rightPairs.set(right, false);
    return false;
  }

  for (const key of leftKeys) {
    if (!rightKeySet.has(key)) {
      rightPairs.set(right, false);
      return false;
    }
    const leftDescriptor = Object.getOwnPropertyDescriptor(left, key)!;
    const rightDescriptor = Object.getOwnPropertyDescriptor(right, key)!;
    if ("value" in leftDescriptor !== ("value" in rightDescriptor)) {
      rightPairs.set(right, false);
      return false;
    }
    if ("value" in leftDescriptor) {
      if (!areSemanticallyEqual(leftDescriptor.value, rightDescriptor.value, seen)) {
        rightPairs.set(right, false);
        return false;
      }
    } else if (
      leftDescriptor.get !== rightDescriptor.get ||
      leftDescriptor.set !== rightDescriptor.set
    ) {
      rightPairs.set(right, false);
      return false;
    }
  }
  return true;
}

const EMPTY_ITEMS: SelectItem[] = [];

function isBusyToken(value: unknown): boolean {
  return value === true || value === "true";
}

function composeBusyToken(consumerValue: unknown, externalBusy: boolean): unknown {
  if (externalBusy || isBusyToken(consumerValue)) return "true";
  if (consumerValue === false || consumerValue === "false") return consumerValue;
  return consumerValue;
}

/**
 * Item type for the select component
 */
export interface SelectItem {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
  [key: string]: unknown;
}

/**
 * Style configuration for internal select parts using React.CSSProperties.
 */
export type StyleConfig = {
  [K in keyof CoreStyleConfig]: K extends "classNames"
    ? CoreStyleConfig[K]
    : React.CSSProperties | undefined;
};

/**
 * Props for the Select component
 */
export interface SelectComponentProps {
  /**
   * Array of items to display. Supply immutable plain-object records; React
   * compares equivalent arrays/records by their enumerable own data. Functions
   * and non-plain metadata (for example Date, Map, or class instances) compare
   * by identity and should be memoized when used as item metadata.
   */
  items?: SelectItem[];

  /** Grouped items (alternative to flat items array) */
  groupedItems?: GroupedItem[];

  /** Customize group header rendering when groupedItems are used */
  groupHeaderRenderer?: (group: GroupedItem, index: number) => React.ReactNode;

  /** Currently selected value(s) */
  value?: string | number | Array<string | number>;

  /** Default value(s) for uncontrolled mode */
  defaultValue?: string | number | Array<string | number>;

  /** Enable multi-select mode */
  multiple?: boolean;

  /** Enable search/filter functionality */
  searchable?: boolean;

  /** Placeholder text */
  placeholder?: string;

  /** Disable the select */
  disabled?: boolean;

  /** Required field */
  required?: boolean;

  /** Error state */
  error?: boolean;

  /** Error message to display */
  errorMessage?: string;

  /** Enable infinite scroll */
  infiniteScroll?: boolean;

  /** Page size for infinite scroll */
  pageSize?: number;

  /** Enable legacy chunked rendering for large flat lists; this does not window to the viewport. */
  virtualized?: boolean;

  /** Estimated height used by the guarded viewport-windowing test path. */
  estimatedItemHeight?: number;

  /** Maximum number of selections (for multiple mode) */
  maxSelections?: number;

  /** Partial core selection config for advanced selection behavior */
  selectionConfig?: Partial<SelectionConfig>;

  /** Multi-select chip display behavior */
  multiSelectDisplay?: Partial<MultiSelectDisplayConfig>;

  /** Scroll-to-selected behavior */
  scrollToSelected?: Partial<ScrollToSelectedConfig>;

  /** Core style configuration for internal parts */
  styles?: StyleConfig;

  /** Per-instance core config, including opt-in acknowledged data loading */
  config?: SelectInstanceConfig;

  /** Custom chip and selected-option remove icon: a legacy string or React content. */
  removeButtonIcon?: React.ReactNode;

  /** Custom decorative arrow icon rendered in the native arrow slot. */
  arrowIcon?: React.ReactNode;

  /** Decorative custom icon projected into Core's native busy-bucket slot. */
  loadingIcon?: React.ReactNode;

  /** Accessible custom busy UI projected into Core's native loading-content slot. */
  loadingContent?: React.ReactNode;

  /** Render custom empty-state content while Core reports a terminal empty result. */
  emptyStateRenderer?: (context: EmptyStateContext) => React.ReactNode;

  /** Behavior overrides for visually disabled (dimmed) options */
  disabledOptionBehavior?: {
    selectable?: boolean;
    hoverable?: boolean;
    focusable?: boolean;
  };

  /** Show the selected-state side indicator on lightweight/custom-rendered options */
  showSelectedIndicator?: boolean;

  /** Allow repeated clicks on the trigger to toggle the dropdown open and closed */
  toggleOnTriggerClick?: boolean;

  /** Dropdown placement */
  placement?:
    | "top"
    | "bottom"
    | "top-start"
    | "top-end"
    | "bottom-start"
    | "bottom-end";

  /** Text and layout direction */
  direction?: "ltr" | "rtl";

  /** Enable clear control button inside input */
  clearable?: boolean;

  /** Clear selection when clear control is clicked */
  clearSelectionOnClear?: boolean;

  /** Clear search query when clear control is clicked */
  clearSearchOnClear?: boolean;

  /** ARIA label for clear control */
  clearAriaLabel?: string;

  /** Icon text for clear control */
  clearIcon?: string;

  /** Custom CSS class name */
  className?: string;

  /** Inline styles */
  style?: React.CSSProperties;

  /** Custom item renderer */
  renderItem?: (item: SelectItem, index: number) => React.ReactNode;

  /** Custom React renderer for option content */
  customRenderer?: (item: SelectItem, index: number) => React.ReactNode;

  /** Custom option renderer (DOM). Returns an HTMLElement for full control. */
  optionRenderer?: (
    item: SelectItem,
    index: number,
    helpers: RendererHelpers,
  ) => HTMLElement;

  /** Custom selected value renderer */
  renderValue?: (selectedItems: SelectItem[]) => React.ReactNode;

  /**
   * Class map for overriding internal state classes.
   * Useful for Tailwind or other utility-first CSS frameworks.
   */
  classMap?: {
    selected?: string;
    active?: string;
    disabled?: string;
    [key: string]: string | undefined;
  };

  // Event Handlers
  /** Called when selection changes */
  onChange?: (
    value: string | number | Array<string | number>,
    items: SelectItem[],
  ) => void;

  /** Called when an item is selected */
  onSelect?: (item: SelectItem, index: number) => void;

  /** Called when dropdown opens */
  onOpen?: () => void;

  /** Called when dropdown closes */
  onClose?: () => void;

  /** Called when search query changes */
  onSearch?: (
    query: string,
    results?: SelectItem[],
    count?: number,
    request?: SearchDataRequest,
  ) => void;

  /** Called when more items are needed (infinite scroll) */
  onLoadMore?: (
    page: number,
    request?: LoadMoreDataRequest,
  ) => void | Promise<void>;

  /** Called when clear control is used */
  onClear?: (detail: {
    clearedSelection: boolean;
    clearedSearch: boolean;
  }) => void;

  /** Called when diagnostic tracking is emitted */
  onDiagnostic?: (detail: DiagnosticEventDetail) => void;

  /** Called when an acknowledged request is invalidated by the core */
  onDataRequestCancel?: (detail: DataRequestCancelNotification) => void;

  /** Called after an accepted data snapshot is projected or projection fails */
  onDataProjection?: (detail: DataProjectionEventDetail) => void;

  /** Called when the core rejects a data-loading config transition */
  onDataLoadingConfigError?: (detail: DataLoadingConfigErrorDetail) => void;

  /** Called when Core enters, updates, or clears its terminal empty state. */
  onEmptyStateChange?: (context: EmptyStateContext | null) => void;

  /** Enable runtime tracking */
  trackingEnabled?: boolean;

  /** Track emitted events */
  trackEvents?: boolean;

  /** Track styling changes */
  trackStyling?: boolean;

  /** Track limitations and policy changes */
  trackLimitations?: boolean;

  /** Emit diagnostic events */
  emitDiagnostics?: boolean;

  /** Max entries kept per tracking channel */
  trackingMaxEntries?: number;

  /** Limitation control policies */
  limitationPolicies?: LimitationPolicyMap;

  /** Automatically mitigate single/multi runtime switching */
  autoMitigateRuntimeModeSwitch?: boolean;

  /** Loading state for async operations */
  loading?: boolean;

  /** Enable creatable mode (allow creating new options) */
  creatable?: boolean;

  /** Called when a new option is created */
  onCreate?: (label: string) => void;
}

/** Standard DOM attributes forwarded to the underlying `enhanced-select` host element */
export type SelectProps = SelectComponentProps &
  Omit<React.HTMLAttributes<HTMLElement>, keyof SelectComponentProps | "dir">;

/**
 * Imperative handle for the Select component
 */
export interface SelectHandle {
  /** Focus the select input */
  focus: () => void;

  /** Open the dropdown */
  open: () => void;

  /** Close the dropdown */
  close: () => void;

  /** Get currently selected items */
  getSelectedItems: () => SelectItem[];

  /** Get currently selected values */
  getSelectedValues: () => Array<string | number>;
  /** Get the current terminal empty-state context, if any. */
  getEmptyStateContext: () => EmptyStateContext | null;

  /** Programmatically set items */
  setItems: (items: SelectItem[]) => void;

  /** Programmatically set grouped items */
  setGroupedItems: (groups: GroupedItem[]) => void;

  /** Clear the selection */
  clear: () => void;

  /** Clear the current search query */
  clearSearch: () => void;

  /** Set an error state message */
  setError: (message: string) => void;

  /** Clear the current error state */
  clearError: () => void;

  /** Toggle required state */
  setRequired: (required: boolean) => void;

  /** Validate the component state */
  validate: () => boolean;

  /** Runtime capability report */
  getCapabilities: () => SelectCapabilitiesReport | undefined;

  /** Known limitations report */
  getKnownLimitations: () => LimitationState[];

  /** Tracking snapshot */
  getTrackingSnapshot: () => TrackingSnapshot;

  /** Clear tracking logs */
  clearTracking: (source?: "event" | "style" | "limitation" | "all") => void;

  /** Update limitation policies */
  setLimitationPolicies: (policies: LimitationPolicyMap) => void;

  /** Update the per-instance config through the adapter's acceptance boundary */
  updateConfig: (config: SelectInstanceConfig) => void;

  /** Return the core-owned acknowledged request lifecycle snapshot */
  getDataLoadingState: () => DataLoadingStateSnapshot;

  /** Explicitly accept a host response for a core-issued request */
  completeDataRequest: (
    completion: DataRequestCompletion,
  ) => DataRequestCompletionResult;
}

/**
 * Smilodon Select Component for React
 *
 * A select component with the following implemented behavior groups:
 * - Single and multi-select modes
 * - Searchable with client or server-side filtering
 * - Infinite scroll and virtual scrolling for large datasets
 * - Grouped options
 * - Custom rendering
 * - Full keyboard navigation
 * - ARIA and keyboard behaviors implemented; complete accessibility certification pending
 *
 * @example
 * ```tsx
 * // Simple usage
 * <Select
 *   items={[
 *     { value: 'apple', label: 'Apple' },
 *     { value: 'banana', label: 'Banana' }
 *   ]}
 *   value="apple"
 *   onChange={(value) => console.log(value)}
 * />
 *
 * // Multi-select with search
 * <Select
 *   items={items}
 *   multiple
 *   searchable
 *   value={selectedValues}
 *   onChange={(values) => setSelectedValues(values)}
 * />
 *
 * // With grouped items
 * <Select
 *   groupedItems={[
 *     { label: 'Fruits', options: [...] },
 *     { label: 'Vegetables', options: [...] }
 *   ]}
 *   onChange={(value) => console.log(value)}
 * />
 * ```
 */
export const Select = forwardRef<SelectHandle, SelectProps>((props, ref) => {
  const {
    items = EMPTY_ITEMS,
    groupedItems,
    value,
    defaultValue,
    multiple = false,
    searchable = false,
    placeholder = "Select an option...",
    disabled = false,
    required = false,
    error = false,
    errorMessage,
    infiniteScroll = false,
    pageSize = 20,
    virtualized = false,
    estimatedItemHeight = 48,
    maxSelections,
    selectionConfig,
    multiSelectDisplay,
    scrollToSelected,
    styles: stylesConfig,
    config: coreConfig,
    removeButtonIcon,
    arrowIcon,
    loadingIcon,
    loadingContent,
    emptyStateRenderer,
    disabledOptionBehavior,
    showSelectedIndicator = true,
    toggleOnTriggerClick = true,
    placement = "bottom-start",
    direction,
    clearable = false,
    clearSelectionOnClear = true,
    clearSearchOnClear = true,
    clearAriaLabel,
    clearIcon,
    className,
    style,
    renderItem,
    customRenderer,
    renderValue,
    optionRenderer,
    onChange,
    onSelect,
    onOpen,
    onClose,
    onSearch,
    onLoadMore,
    onClear,
    onDiagnostic,
    onDataRequestCancel,
    onDataProjection,
    onDataLoadingConfigError,
    onEmptyStateChange,
    trackingEnabled = false,
    trackEvents = true,
    trackStyling = true,
    trackLimitations = true,
    emitDiagnostics = false,
    trackingMaxEntries = 200,
    limitationPolicies,
    autoMitigateRuntimeModeSwitch = true,
    loading = false,
    creatable = false,
    onCreate,
    classMap,
    groupHeaderRenderer,
    "aria-busy": consumerAriaBusy,
    ...hostProps
  } = props;

  const [isControlled] = useState(value !== undefined);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const hasAppliedInitialValueRef = useRef(false);
  const elementRef = useRef<any>(null);
  const coreModuleRef = useRef<CoreModule | null>(null);
  const acceptedDataLoadingConfigRef = useRef<ResolvedDataLoadingConfig>({
    ...DEFAULT_DATA_LOADING_CONFIG,
  });
  const configUpdateStackRef = useRef<Array<{ sawConfigError: boolean }>>([]);
  const configUpdateInProgressRef = useRef(false);
  const queuedConfigUpdatesRef = useRef<SelectInstanceConfig[]>([]);
  const queuedImperativeConfigsRef = useRef<SelectInstanceConfig[]>([]);
  const activeListenersRef = useRef<{
    element: HTMLElement;
    dispose: () => void;
  } | null>(null);
  const callbackStateRef = useRef({
    onSelect,
    onChange,
    onOpen,
    onClose,
    onSearch,
    onLoadMore,
    onClear,
    onDiagnostic,
    onDataRequestCancel,
    onDataProjection,
    onDataLoadingConfigError,
    onEmptyStateChange,
    isControlled,
    multiple,
  });
  callbackStateRef.current = {
    onSelect,
    onChange,
    onOpen,
    onClose,
    onSearch,
    onLoadMore,
    onClear,
    onDiagnostic,
    onDataRequestCancel,
    onDataProjection,
    onDataLoadingConfigError,
    onEmptyStateChange,
    isControlled,
    multiple,
  };
  const ariaBusyInputsRef = useRef({ consumerAriaBusy, loading });
  ariaBusyInputsRef.current = { consumerAriaBusy, loading };
  const initializingRef = useRef(true);
  const compatibilityFailureReportedRef = useRef(false);
  const unusableRef = useRef(false);
  const [acceptedProtocol, setAcceptedProtocol] = useState<"legacy" | "acknowledged">("legacy");
  const [isCoreModuleLoaded, setIsCoreModuleLoaded] = useState(false);
  const [isAcknowledgedQualified, setIsAcknowledgedQualified] = useState(false);
  const [isUnusable, setIsUnusable] = useState(false);
  const resolvedDropdownPlacement = useMemo<"top" | "bottom">(() => {
    if (placement?.startsWith("top")) return "top";
    return "bottom";
  }, [placement]);

  const reactRendererCache = useRef(
    new Map<number, { container: HTMLElement; root: Root }>(),
  );
  const groupHeaderRendererCache = useRef(
    new Map<number, { container: HTMLElement; root: Root }>(),
  );

  const areValuesEqual = useCallback(
    (
      nextValues: Array<string | number>,
      currentValues: Array<string | number>,
    ) => {
      if (nextValues.length !== currentValues.length) return false;
      return nextValues.every((value, index) => value === currentValues[index]);
    },
    [],
  );

  const setElementPropertyIfChanged = useCallback(
    <T,>(element: Record<string, T>, property: string, value: T) => {
      if (element[property] !== value) {
        element[property] = value;
      }
    },
    [],
  );

  const areClassMapsEqual = useCallback(
    (
      left?: SelectComponentProps["classMap"],
      right?: SelectComponentProps["classMap"],
    ) => {
      if (left === right) return true;
      if (!left || !right) return false;

      const leftKeys = Object.keys(left);
      const rightKeys = Object.keys(right);
      if (leftKeys.length !== rightKeys.length) return false;

      return leftKeys.every((key) => left[key] === right[key]);
    },
    [],
  );

  const scheduleRootUnmount = useCallback((root: Root) => {
    if (typeof queueMicrotask === "function") {
      queueMicrotask(() => root.unmount());
      return;
    }

    Promise.resolve().then(() => root.unmount());
  }, []);

  // Use refs for renderers to avoid reconstructing the wrapper function on every render
  const customRendererRef = useRef(customRenderer ?? renderItem);
  const optionRendererRef = useRef(optionRenderer);
  const groupHeaderRendererRef = useRef(groupHeaderRenderer);

  // Update ref when props change
  useEffect(() => {
    customRendererRef.current = customRenderer ?? renderItem;
    optionRendererRef.current = optionRenderer;
    groupHeaderRendererRef.current = groupHeaderRenderer;
  }, [customRenderer, renderItem, optionRenderer, groupHeaderRenderer]);

  const resolvedOptionRenderer = useMemo(() => {
    // If a direct DOM renderer is provided, use it (assumed stable or controlled by user)
    // Wait, if optionRenderer is provided as inline function, it changes every render.
    // We should wrap it too IF it is provided.

    if (optionRenderer) {
      return (item: SelectItem, index: number, helpers: RendererHelpers) => {
        return (
          optionRendererRef.current?.(item, index, helpers) ||
          document.createElement("div")
        );
      };
    }

    // We only want to reconstruct the wrapper if the existence of a renderer changes,
    // NOT if the identity of the function changes (to avoid infinite loops with inline functions).
    const hasReactRenderer = !!(customRenderer ?? renderItem);

    if (!hasReactRenderer) return undefined;

    return (item: SelectItem, index: number, _helpers: RendererHelpers) => {
      const renderer = customRendererRef.current;
      if (!renderer) return document.createElement("div");

      let entry = reactRendererCache.current.get(index);
      if (!entry) {
        const container = document.createElement("div");
        // Note: createRoot should be reused.
        const root = createRoot(container);
        entry = { container, root };
        reactRendererCache.current.set(index, entry);
      }

      entry.root.render(<>{renderer(item, index)}</>);
      return entry.container;
    };
  }, [!!optionRenderer, !!(customRenderer ?? renderItem)]); // Only reconstruct if presence changes

  const resolvedGroupHeaderRenderer = useMemo(() => {
    if (!groupHeaderRenderer) return undefined;

    return (group: GroupedItem, index: number) => {
      const renderer = groupHeaderRendererRef.current;
      if (!renderer) return document.createElement("div");

      let entry = groupHeaderRendererCache.current.get(index);
      if (!entry) {
        const container = document.createElement("div");
        const root = createRoot(container);
        entry = { container, root };
        groupHeaderRendererCache.current.set(index, entry);
      }

      entry.root.render(<>{renderer(group, index)}</>);
      return entry.container;
    };
  }, [!!groupHeaderRenderer]);

  useEffect(() => {
    return () => {
      reactRendererCache.current.forEach(({ root }) =>
        scheduleRootUnmount(root),
      );
      reactRendererCache.current.clear();
      groupHeaderRendererCache.current.forEach(({ root }) =>
        scheduleRootUnmount(root),
      );
      groupHeaderRendererCache.current.clear();
    };
  }, [scheduleRootUnmount]);

  useEffect(() => {
    const totalItems = groupedItems
      ? groupedItems.reduce((count, group) => count + group.options.length, 0)
      : items.length;

    reactRendererCache.current.forEach((entry, index) => {
      if (index >= totalItems) {
        scheduleRootUnmount(entry.root);
        reactRendererCache.current.delete(index);
      }
    });
  }, [items, groupedItems, scheduleRootUnmount]);

  useEffect(() => {
    const totalGroups = groupedItems?.length ?? 0;

    groupHeaderRendererCache.current.forEach((entry, index) => {
      if (index >= totalGroups) {
        scheduleRootUnmount(entry.root);
        groupHeaderRendererCache.current.delete(index);
      }
    });
  }, [groupedItems, scheduleRootUnmount]);

  useEffect(() => {
    if (groupHeaderRenderer) return;

    groupHeaderRendererCache.current.forEach(({ root }) =>
      scheduleRootUnmount(root),
    );
    groupHeaderRendererCache.current.clear();
  }, [groupHeaderRenderer, scheduleRootUnmount]);

  useEffect(() => {
    const frameworkRendererActive =
      !optionRenderer && Boolean(customRenderer ?? renderItem);
    if (frameworkRendererActive) return;

    reactRendererCache.current.forEach(({ root }) => scheduleRootUnmount(root));
    reactRendererCache.current.clear();
  }, [!!optionRenderer, !!(customRenderer ?? renderItem), scheduleRootUnmount]);

  // Register custom element if not already registered
  const [isElementReady, setIsElementReady] = useState(false);
  const [emptyStateContext, setEmptyStateContext] = useState<EmptyStateContext | null>(null);
  const [removeIconTargets, setRemoveIconTargets] = useState<HTMLElement[]>([]);
  const shouldPortalRemoveIcon =
    multiple
    && removeButtonIcon != null
    && typeof removeButtonIcon !== "string"
    && typeof removeButtonIcon !== "boolean"
    && coreConfig?.selection?.removeButtonIcon === undefined;
  const acknowledgedRequested =
    acceptedProtocol === "acknowledged" ||
    coreConfig?.dataLoading?.protocol === "acknowledged";
  const dataLoadingConfigured = coreConfig?.dataLoading !== undefined;
  const coreFacadeRequired = acknowledgedRequested || dataLoadingConfigured;
  const isElementUsable =
    isElementReady &&
    (!acknowledgedRequested || isAcknowledgedQualified) &&
    (!coreFacadeRequired || isCoreModuleLoaded) &&
    !isUnusable;

  const markUnusable = useCallback(
    (message: string) => {
      if (unusableRef.current) return;
      unusableRef.current = true;
      setIsUnusable(true);
      const element = elementRef.current;
      const { consumerAriaBusy: currentConsumerBusy } = ariaBusyInputsRef.current;
      if (element) {
        if (currentConsumerBusy === undefined) element.removeAttribute("aria-busy");
        else element.setAttribute("aria-busy", String(currentConsumerBusy));
      }
      if (!compatibilityFailureReportedRef.current) {
        compatibilityFailureReportedRef.current = true;
        console.error(`[Smilodon React] ${message}`);
      }
    },
    [],
  );

  const syncHostBusy = useCallback((element: HTMLElement) => {
    const { consumerAriaBusy: currentConsumerBusy, loading: externalBusy } =
      ariaBusyInputsRef.current;
    if (acceptedDataLoadingConfigRef.current.protocol === "acknowledged" && !unusableRef.current) {
      const composed = composeBusyToken(currentConsumerBusy, externalBusy);
      if (composed === undefined) element.removeAttribute("aria-busy");
      else element.setAttribute("aria-busy", String(composed));
      return;
    }

    if (currentConsumerBusy === undefined) element.removeAttribute("aria-busy");
    else element.setAttribute("aria-busy", String(currentConsumerBusy));
  }, []);

  const applyInstanceConfig = useCallback(
    (element: any, config: SelectInstanceConfig) => {
      if (!element?.updateConfig || unusableRef.current) return;
      if (configUpdateInProgressRef.current) {
        queuedConfigUpdatesRef.current.push({ ...config });
        return;
      }

      configUpdateInProgressRef.current = true;
      const queue: SelectInstanceConfig[] = [{ ...config }];
      let processed = 0;
      try {
        while (queue.length > 0 && !unusableRef.current) {
          if (processed++ >= 100) {
            queuedConfigUpdatesRef.current = [];
            markUnusable(
              "Too many reentrant configuration updates were queued; the wrapper has been stopped to avoid an unbounded update loop.",
            );
            break;
          }
          const currentConfig = queue.shift()!;
          const module = coreModuleRef.current;
          let validation:
            | ReturnType<CoreModule["validateDataLoadingConfig"]>
            | undefined;
          if (currentConfig.dataLoading !== undefined) {
            const candidate = isPlainRecord(currentConfig.dataLoading)
              ? { ...acceptedDataLoadingConfigRef.current, ...currentConfig.dataLoading }
              : currentConfig.dataLoading;
            if (!module) {
              markUnusable(
                "The core validator is unavailable; acknowledged configuration cannot be reconciled safely.",
              );
              break;
            }
            try {
              validation = module.validateDataLoadingConfig(candidate);
            } catch (error) {
              markUnusable(
                `Core data-loading preflight failed unexpectedly: ${String(error)}`,
              );
              break;
            }
          }

          const update = { sawConfigError: false };
          configUpdateStackRef.current.push(update);
          let threw = false;
          try {
            element.updateConfig(currentConfig);
          } catch (error) {
            threw = true;
            markUnusable(
              `Core configuration acceptance is uncertain after updateConfig() threw: ${String(error)}`,
            );
          } finally {
            configUpdateStackRef.current.pop();
          }

          if (validation?.valid && !threw) {
            if (update.sawConfigError) {
              markUnusable(
                "Core reported a data-loading configuration error for a preflight-valid candidate; the accepted protocol is uncertain.",
              );
              break;
            }
            acceptedDataLoadingConfigRef.current = { ...validation.value };
            setAcceptedProtocol(validation.value.protocol);
            syncHostBusy(element);
          }

          if (queuedConfigUpdatesRef.current.length > 0) {
            queue.push(...queuedConfigUpdatesRef.current);
            queuedConfigUpdatesRef.current = [];
          }
        }
      } finally {
        configUpdateInProgressRef.current = false;
      }
    },
    [markUnusable, syncHostBusy],
  );

  const requiresAcknowledgedQualification =
    acceptedProtocol === "acknowledged" ||
    coreConfig?.dataLoading?.protocol === "acknowledged";

  const qualifyAcknowledgedElement = useCallback((): boolean => {
    const element = elementRef.current;
    const module = coreModuleRef.current;
    if (!element || !module || typeof customElements === "undefined") return false;
    const registered = customElements.get("enhanced-select");
    const observed = (registered as unknown as { observedAttributes?: string[] } | undefined)
      ?.observedAttributes;
    const compatible =
      registered === module.EnhancedSelect &&
      element.constructor === module.EnhancedSelect &&
      Array.isArray(observed) &&
      observed.includes("aria-busy") &&
      typeof element.updateConfig === "function" &&
      typeof element.startDataLoading === "function" &&
      typeof element.getDataLoadingState === "function" &&
      typeof element.completeDataRequest === "function";
    if (!compatible) {
      markUnusable(
        "Acknowledged data loading requires the exact peer-resolved EnhancedSelect constructor with the Phase 2F facade and aria-busy observation support.",
      );
      return false;
    }
    setIsAcknowledgedQualified(true);
    return true;
  }, [markUnusable]);

  const subscribeToCoreEvents = useCallback((element: HTMLElement) => {
    const currentSubscription = activeListenersRef.current;
    if (currentSubscription?.element === element) return currentSubscription.dispose;
    currentSubscription?.dispose();

    const handleSelect = (event: Event) => {
      const detail = (event as CustomEvent<SelectEventDetail>).detail;
      callbackStateRef.current.onSelect?.(detail.item as SelectItem, detail.index);
    };

    const handleChange = (event: Event) => {
      const { selectedItems, selectedValues } =
        (event as CustomEvent<ChangeEventDetail>).detail;
      const callbacks = callbackStateRef.current;
      const values = selectedValues as Array<string | number>;
      const nextSingleValue: string | number = values.length > 0 ? values[0] : "";
      if (initializingRef.current) return;
      if (!callbacks.isControlled) {
        setInternalValue(callbacks.multiple ? values : nextSingleValue);
      }
      callbacks.onChange?.(
        callbacks.multiple ? values : nextSingleValue,
        selectedItems as SelectItem[],
      );
    };

    const handleOpen = () => callbackStateRef.current.onOpen?.();
    const handleClose = () => callbackStateRef.current.onClose?.();
    const handleSearch = (event: Event) => {
      const { query, results, count, request } =
        (event as CustomEvent<SearchEventDetail>).detail;
      const callback = callbackStateRef.current.onSearch;
      if (!callback) return;
      if (request) callback(query, results as SelectItem[] | undefined, count, request);
      else callback(query, results as SelectItem[] | undefined, count);
    };
    const handleLoadMore = (event: Event) => {
      const { page, request } = (event as CustomEvent<LoadMoreEventDetail>).detail;
      const callback = callbackStateRef.current.onLoadMore;
      if (!callback) return;
      if (request) callback(page, request);
      else callback(page);
    };
    const handleClear = (event: Event) => {
      const { clearedSelection, clearedSearch } =
        (event as CustomEvent<ClearEventDetail>).detail;
      callbackStateRef.current.onClear?.({ clearedSelection, clearedSearch });
    };
    const handleDiagnostic = (event: Event) => {
      callbackStateRef.current.onDiagnostic?.(
        (event as CustomEvent<DiagnosticEventDetail>).detail,
      );
    };
    const handleDataRequestCancel = (event: Event) => {
      callbackStateRef.current.onDataRequestCancel?.(
        (event as CustomEvent<DataRequestCancelNotification>).detail,
      );
    };
    const handleDataProjection = (event: Event) => {
      callbackStateRef.current.onDataProjection?.(
        (event as CustomEvent<DataProjectionEventDetail>).detail,
      );
    };
    const handleDataLoadingConfigError = (event: Event) => {
      const activeUpdate = configUpdateStackRef.current[
        configUpdateStackRef.current.length - 1
      ];
      if (activeUpdate) activeUpdate.sawConfigError = true;
      callbackStateRef.current.onDataLoadingConfigError?.(
        (event as CustomEvent<DataLoadingConfigErrorDetail>).detail,
      );
    };
    const handleEmptyStateChange = (event: Event) => {
      const context = (event as CustomEvent<{ context: EmptyStateContext | null }>).detail.context;
      setEmptyStateContext(context);
      callbackStateRef.current.onEmptyStateChange?.(context);
    };

    const listeners: Array<[string, EventListener]> = [
      ["select", handleSelect],
      ["change", handleChange],
      ["open", handleOpen],
      ["close", handleClose],
      ["search", handleSearch],
      ["loadMore", handleLoadMore],
      ["clear", handleClear],
      ["diagnostic", handleDiagnostic],
      ["dataRequestCancel", handleDataRequestCancel],
      ["dataProjection", handleDataProjection],
      ["dataLoadingConfigError", handleDataLoadingConfigError],
      ["emptyStateChange", handleEmptyStateChange],
    ];
    for (const [name, listener] of listeners) {
      element.addEventListener(name, listener);
    }
    setEmptyStateContext(
      (element as HTMLElement & { getEmptyStateContext?: () => EmptyStateContext | null })
        .getEmptyStateContext?.() ?? null,
    );
    const dispose = () => {
      if (activeListenersRef.current?.dispose === dispose) {
        activeListenersRef.current = null;
      }
      for (const [name, listener] of listeners) {
        element.removeEventListener(name, listener);
      }
    };
    activeListenersRef.current = { element, dispose };
    return dispose;
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !isElementReady) return;

    setElementPropertyIfChanged(
      element,
      "optionRenderer",
      resolvedOptionRenderer,
    );
  }, [isElementReady, resolvedOptionRenderer, setElementPropertyIfChanged]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !isElementReady) return;

    setElementPropertyIfChanged(
      element,
      "groupHeaderRenderer",
      resolvedGroupHeaderRenderer,
    );
  }, [
    isElementReady,
    resolvedGroupHeaderRenderer,
    setElementPropertyIfChanged,
  ]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !isElementReady) return;

    if (!areClassMapsEqual(element.classMap, classMap)) {
      element.classMap = classMap;
    }
  }, [isElementReady, classMap, areClassMapsEqual]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof customElements === "undefined") return;
    let active = true;
    const existingConstructor = customElements.get("enhanced-select");
    if (existingConstructor) setIsElementReady(true);

    import("@smilodon/core")
      .then((module) => {
        if (!active) return;
        coreModuleRef.current = module;
        setIsCoreModuleLoaded(true);
        const currentConstructor = customElements.get("enhanced-select");
        if (!currentConstructor) {
          customElements.define("enhanced-select", module.EnhancedSelect);
        }
        setIsElementReady(true);
      })
      .catch((error) => {
        if (!active) return;
        if (requiresAcknowledgedQualification) {
          markUnusable(`Unable to load the compatible core runtime: ${String(error)}`);
        } else if (!customElements.get("enhanced-select")) {
          console.error(`[Smilodon React] Unable to register enhanced-select: ${String(error)}`);
        }
      });

    return () => {
      active = false;
    };
  }, [markUnusable]);

  useEffect(() => {
    if (
      !isElementReady ||
      !isCoreModuleLoaded ||
      !requiresAcknowledgedQualification ||
      isUnusable
    ) return;
    qualifyAcknowledgedElement();
  }, [
    isElementReady,
    isCoreModuleLoaded,
    requiresAcknowledgedQualification,
    isUnusable,
    qualifyAcknowledgedElement,
  ]);

  // Acknowledged event listeners must exist before any config can open readiness.
  useEffect(() => {
    const element = elementRef.current;
    if (
      !(acknowledgedRequested || dataLoadingConfigured) ||
      !isElementUsable ||
      !element
    ) return;
    return subscribeToCoreEvents(element);
  }, [
    acknowledgedRequested,
    dataLoadingConfigured,
    isElementUsable,
    subscribeToCoreEvents,
  ]);

  useEffect(() => {
    return () => activeListenersRef.current?.dispose();
  }, []);

  const componentConfig = {
    searchable,
    placeholder,
    virtualize: virtualized,
    estimatedItemHeight,
    enabled: !disabled,
    dropdownPlacement: { mode: resolvedDropdownPlacement },
    selection: {
      ...selectionConfig,
      mode: multiple ? "multi" : "single",
      maxSelections,
      removeButtonIcon: typeof removeButtonIcon === "string" ? removeButtonIcon : undefined,
      disabledOptionBehavior,
      showSelectedIndicator,
      toggleOnTriggerClick,
    },
    direction,
    multiSelectDisplay,
    infiniteScroll: { enabled: infiniteScroll, pageSize },
    scrollToSelected: { enabled: true, ...scrollToSelected },
    creatable,
    styles: stylesConfig,
    clearControl: {
      enabled: clearable,
      clearSelection: clearSelectionOnClear,
      clearSearch: clearSearchOnClear,
      ariaLabel: clearAriaLabel,
      icon: clearIcon,
    },
    tracking: {
      enabled: trackingEnabled,
      events: trackEvents,
      styling: trackStyling,
      limitations: trackLimitations,
      emitDiagnostics,
      maxEntries: trackingMaxEntries,
    },
    limitations: { policies: limitationPolicies, autoMitigateRuntimeModeSwitch },
  };
  const configCandidate = { component: componentConfig, core: coreConfig };
  const appliedConfigRef = useRef<{
    hasComponent: boolean;
    component: typeof componentConfig | null;
    hasCore: boolean;
    core: SelectComponentProps["config"];
  }>({ hasComponent: false, component: null, hasCore: false, core: undefined });

  // Configuration has one owner and is reconciled before data and selection.
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !isElementUsable || !element.updateConfig) return;
    const previous = appliedConfigRef.current;
    const componentChanged = !previous.hasComponent
      || !areSemanticallyEqual(previous.component, configCandidate.component);
    const coreChanged = !previous.hasCore
      || !areSemanticallyEqual(previous.core, configCandidate.core);
    if (!componentChanged && !coreChanged) return;

    if (componentChanged) {
      applyInstanceConfig(element, configCandidate.component as SelectInstanceConfig);
      // Preserve the existing precedence: explicit Core config is layered on
      // top of the adapter defaults after an adapter-level change.
      if (configCandidate.core) applyInstanceConfig(element, configCandidate.core);
    } else if (coreChanged) {
      if (configCandidate.core) {
        applyInstanceConfig(element, configCandidate.core);
      } else {
        applyInstanceConfig(element, configCandidate.component as SelectInstanceConfig);
      }
    }
    appliedConfigRef.current = {
      hasComponent: true,
      component: configCandidate.component,
      hasCore: true,
      core: configCandidate.core,
    };
  });

  const sourceCandidate = groupedItems !== undefined
    ? { kind: "grouped" as const, data: groupedItems }
    : { kind: "items" as const, data: items };
  const synchronizedSourceRef = useRef<typeof sourceCandidate | null>(null);

  // Prop data is synchronized through this path only. Compare against the last
  // React source snapshot, never against Core's acknowledged cumulative data.
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !isElementUsable || !element.setItems) return;
    if (areSemanticallyEqual(synchronizedSourceRef.current, sourceCandidate)) return;

    if (sourceCandidate.kind === "grouped") {
      element.setGroupedItems(sourceCandidate.data as GroupedItem[]);
    } else {
      const sourceItems = sourceCandidate.data as SelectItem[];
      if (sourceItems.length > 0 && sourceItems[0]?.group !== undefined) {
        const groups = new Map<string, SelectItem[]>();
        sourceItems.forEach((item) => {
          const label = item.group ?? "Ungrouped";
          if (!groups.has(label)) groups.set(label, []);
          groups.get(label)!.push(item);
        });
        element.setGroupedItems(
          Array.from(groups, ([label, options]) => ({ label, options })) as GroupedItem[],
        );
      } else {
        element.setItems(sourceItems);
      }
    }
    synchronizedSourceRef.current = sourceCandidate;
  });

  // Apply an uncontrolled default only after the initial source data is registered.
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !isElementUsable || isControlled || hasAppliedInitialValueRef.current) return;
    if (internalValue === undefined) return;
    const values = Array.isArray(internalValue) ? internalValue : [internalValue];
    const currentValues = element.getSelectedValues?.() || [];
    if (!areValuesEqual(values, currentValues)) element.setSelectedValues(values);
    hasAppliedInitialValueRef.current = true;
  }, [isElementUsable, isControlled, internalValue, areValuesEqual]);

  // Update selected value when it changes (controlled mode)
  useEffect(() => {
    const element = elementRef.current;
    if (
      !element ||
      !isControlled ||
      !isElementUsable ||
      !element.setSelectedValues
    )
      return;

    if (value !== undefined) {
      const values = Array.isArray(value) ? value : [value];
      const currentValues = element.getSelectedValues?.() || [];
      if (!areValuesEqual(values, currentValues)) {
        element.setSelectedValues(values);
      }
    }
  }, [value, isControlled, isElementUsable, areValuesEqual]);

  // React nodes cannot be passed through Core's string-only icon configuration.
  // Instead, render the node into Core-owned icon spans using context-preserving
  // portals. Observe both the select and its nested SelectOption shadow roots,
  // since Core may recreate those spans during selection/configuration updates.
  useEffect(() => {
    const element = elementRef.current as HTMLElement | null;
    const shadow = element?.shadowRoot;
    if (!isElementUsable || !shouldPortalRemoveIcon || !shadow) {
      setRemoveIconTargets((previous) => previous.length ? [] : previous);
      return;
    }

    const observed = new Set<ShadowRoot>();
    let currentTargets: HTMLElement[] = [];
    let disposed = false;
    const observer = new MutationObserver(() => refresh());

    const refresh = () => {
      if (disposed) return;
      const optionRoots = Array.from(shadow.querySelectorAll("select-option"))
        .map((option) => option.shadowRoot)
        .filter((root): root is ShadowRoot => root !== null);
      const roots = [shadow, ...optionRoots];
      if (
        roots.length !== observed.size
        || roots.some((root) => !observed.has(root))
      ) {
        observer.disconnect();
        observed.clear();
        for (const root of roots) {
          observer.observe(root, { childList: true, subtree: true });
          observed.add(root);
        }
      }

      const targets = [
        ...Array.from(shadow.querySelectorAll<HTMLElement>('[part="chip-remove-icon"]')),
        ...optionRoots.flatMap((root) =>
          Array.from(root.querySelectorAll<HTMLElement>('[part="chip-remove-icon"]')),
        ),
      ];
      if (
        targets.length === currentTargets.length
        && targets.every((target, index) => target === currentTargets[index])
      ) return;

      // Remove Core's fallback glyph only for *new* portal destinations.
      // Previously mounted targets stay under React ownership.
      for (const target of targets) {
        if (!currentTargets.includes(target)) target.replaceChildren();
      }
      currentTargets = targets;
      setRemoveIconTargets(targets);
    };

    refresh();
    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, [isElementUsable, shouldPortalRemoveIcon]);

  // Update error state
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !isElementUsable) return;

    if (error) {
      if (element.setError)
        element.setError(errorMessage || "Invalid selection");
    } else {
      if (element.clearError) element.clearError();
    }
  }, [error, errorMessage, isElementUsable]);

  // Update required state
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !isElementUsable || !element.setRequired) return;
    element.setRequired(required);
  }, [required, isElementUsable]);

  // Open acknowledged readiness only after listeners, config, initial data/value,
  // and host presentation state have all been reconciled for this commit.
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !isElementUsable) return;
    if (isCoreModuleLoaded && queuedImperativeConfigsRef.current.length > 0) {
      const queued = queuedImperativeConfigsRef.current;
      queuedImperativeConfigsRef.current = [];
      for (const config of queued) {
        const requestsAcknowledged =
          acceptedDataLoadingConfigRef.current.protocol === "acknowledged" ||
          config.dataLoading?.protocol === "acknowledged";
        if (requestsAcknowledged && !qualifyAcknowledgedElement()) break;
        if (config.dataLoading !== undefined || requestsAcknowledged) {
          subscribeToCoreEvents(element);
        }
        applyInstanceConfig(element, config);
        if (unusableRef.current) break;
      }
    }
    initializingRef.current = false;
    syncHostBusy(element);
    if (acceptedDataLoadingConfigRef.current.protocol === "acknowledged") {
      element.startDataLoading?.();
    }
  }, [
    isElementUsable,
    acceptedProtocol,
    acknowledgedRequested,
    loading,
    consumerAriaBusy,
    syncHostBusy,
    isCoreModuleLoaded,
    qualifyAcknowledgedElement,
    subscribeToCoreEvents,
    applyInstanceConfig,
  ]);

  // Keep the legacy listener timing unchanged. Acknowledged instances install
  // the same stable listener set above, before configuration and readiness.
  useEffect(() => {
    const element = elementRef.current;
    if (
      !element ||
      acknowledgedRequested ||
      dataLoadingConfigured ||
      !isElementReady
    ) return;
    return subscribeToCoreEvents(element);
  }, [
    acknowledgedRequested,
    dataLoadingConfigured,
    isElementReady,
    subscribeToCoreEvents,
  ]);

  // Expose imperative handle
  useImperativeHandle(ref, () => ({
    focus: () => {
      const element = elementRef.current;
      const input = element?.shadowRoot?.querySelector('input');
      if (input instanceof HTMLElement) {
        input.focus();
      } else {
        element?.focus();
      }
    },
    open: () => {
      elementRef.current?.open();
    },
    close: () => {
      elementRef.current?.close();
    },
    getSelectedItems: () => {
      return elementRef.current?.getSelectedItems() || [];
    },
    getSelectedValues: () => {
      return elementRef.current?.getSelectedValues() || [];
    },
    getEmptyStateContext: () =>
      (elementRef.current as (HTMLElement & {
        getEmptyStateContext?: () => EmptyStateContext | null;
      }) | null)?.getEmptyStateContext?.() ?? null,
    setItems: (items: SelectItem[]) => {
      elementRef.current?.setItems(items);
    },
    setGroupedItems: (groups: GroupedItem[]) => {
      elementRef.current?.setGroupedItems(groups);
    },
    clear: () => {
      elementRef.current?.setSelectedValues([]);
      if (!isControlled) {
        setInternalValue(multiple ? [] : undefined);
      }
      onChange?.(multiple ? [] : "", []);
    },
    clearSearch: () => {
      elementRef.current?.clearSearch?.();
    },
    updateConfig: (config: SelectInstanceConfig) => {
      const element = elementRef.current;
      if (!element || unusableRef.current) return;
      const requestsAcknowledged =
        acceptedDataLoadingConfigRef.current.protocol === "acknowledged" ||
        config.dataLoading?.protocol === "acknowledged";
      if (!isElementReady || !isCoreModuleLoaded) {
        queuedImperativeConfigsRef.current.push({ ...config });
        return;
      }
      if (requestsAcknowledged && !qualifyAcknowledgedElement()) return;
      if (config.dataLoading !== undefined || requestsAcknowledged) {
        subscribeToCoreEvents(element);
      }
      applyInstanceConfig(element, config);
    },
    getDataLoadingState: () => {
      const snapshot = elementRef.current?.getDataLoadingState?.();
      if (snapshot) return snapshot;
      return {
        status: "idle",
        connected: Boolean(elementRef.current?.isConnected),
        busy: false,
        projectionPending: false,
        queryGeneration: 0,
        activeRequest: null,
        hasMore: false,
        nextEligiblePosition: {
          mode: "page",
          page: DEFAULT_DATA_LOADING_CONFIG.firstPage,
        },
        error: null,
        resourceLimit: null,
      };
    },
    completeDataRequest: (completion: DataRequestCompletion) => {
      return (
        elementRef.current?.completeDataRequest?.(completion) ?? "unknown-request"
      );
    },
    setError: (message: string) => {
      elementRef.current?.setError?.(message);
    },
    clearError: () => {
      elementRef.current?.clearError?.();
    },
    setRequired: (isRequired: boolean) => {
      elementRef.current?.setRequired?.(isRequired);
    },
    validate: () => {
      return elementRef.current?.validate?.() ?? true;
    },
    getCapabilities: () => {
      return elementRef.current?.getCapabilities?.();
    },
    getKnownLimitations: () => {
      return elementRef.current?.getKnownLimitations?.() || [];
    },
    getTrackingSnapshot: () => {
      return (
        elementRef.current?.getTrackingSnapshot?.() || {
          events: [],
          styles: [],
          limitations: [],
        }
      );
    },
    clearTracking: (source?: "event" | "style" | "limitation" | "all") => {
      elementRef.current?.clearTracking?.(source);
    },
    setLimitationPolicies: (policies: LimitationPolicyMap) => {
      elementRef.current?.setLimitationPolicies?.(policies);
    },
  }), [
    applyInstanceConfig,
    isElementReady,
    isCoreModuleLoaded,
    qualifyAcknowledgedElement,
    subscribeToCoreEvents,
    isElementUsable,
    isControlled,
    multiple,
    onChange,
  ]);

  const renderedAriaBusy =
    acceptedProtocol === "acknowledged" && !isUnusable
      ? composeBusyToken(consumerAriaBusy, loading)
      : consumerAriaBusy;
  const renderedEmptyState =
    emptyStateContext && emptyStateRenderer
      ? emptyStateRenderer(emptyStateContext)
      : null;

  return React.createElement(
    "enhanced-select",
    {
      ref: elementRef,
      ...hostProps,
      "aria-busy": renderedAriaBusy,
      "data-custom-arrow": arrowIcon != null ? "true" : undefined,
      class: className,
      dir: direction,
      style,
    } as React.HTMLAttributes<HTMLElement> & { class?: string },
    arrowIcon != null
      ? React.createElement(
          "span",
          {
            slot: "arrow",
            className: "smilodon-custom-arrow",
            "aria-hidden": "true",
          },
          arrowIcon,
        )
      : null,
    loadingIcon != null
      ? React.createElement(
          "span",
          {
            slot: "loading-icon",
            className: "smilodon-loading-icon",
            "aria-hidden": "true",
          },
          loadingIcon,
        )
      : null,
    loadingContent != null
      ? React.createElement(
          "div",
          {
            slot: "loading-content",
            className: "smilodon-loading-content",
          },
          loadingContent,
        )
      : null,
    renderedEmptyState != null && typeof renderedEmptyState !== "boolean"
      ? React.createElement(
          "div",
          { slot: "empty-state", className: "smilodon-empty-state" },
          renderedEmptyState,
        )
      : null,
    shouldPortalRemoveIcon
      ? removeIconTargets.map((target, index) =>
          createPortal(
            React.createElement("span", { "aria-hidden": "true" }, removeButtonIcon),
            target,
            index,
          ),
        )
      : null,
  );
});

Select.displayName = "Select";
