<!--
  Smilodon Select Component for Vue 3
  
  A production-ready, accessible select component with advanced features:
  - Single and multi-select modes
  - Searchable with client or server-side filtering
  - Infinite scroll and virtual scrolling for large datasets
  - Grouped options
  - Custom rendering
  - Full keyboard navigation
  - WCAG 2.1 AAA compliant
  
  @example
  <Select
    :items="items"
    v-model="selectedValue"
    searchable
    placeholder="Select an option..."
  />
-->

<template>
  <enhanced-select
    ref="selectRef"
    v-bind="$attrs"
    :class="className"
    :dir="direction"
    :style="style"
  />
</template>

<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
});

import { ref, watch, onMounted, onBeforeUnmount, computed, render, isVNode, h } from 'vue';
import { arraysEqualByValue } from '@smilodon/core';
import type {
  SelectEventDetail,
  OpenEventDetail,
  CloseEventDetail,
  SearchEventDetail,
  ChangeEventDetail,
  LoadMoreEventDetail,
  ClearEventDetail,
  GroupedItem,
  ClassMap,
  RendererHelpers,
  DiagnosticEventDetail,
  LimitationPolicyMap,
  GlobalSelectConfig,
  SelectionConfig,
  MultiSelectDisplayConfig,
  ScrollToSelectedConfig,
  StyleConfig,
} from '@smilodon/core';

export interface SelectItem {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
  [key: string]: any;
}

export interface SelectProps {
  /** Array of items to display in the select */
  items?: SelectItem[];
  /** Grouped items (alternative to items) */
  groupedItems?: GroupedItem[];
  /** Custom renderer for group headers when groupedItems are used */
  groupHeaderRenderer?: (group: GroupedItem, index: number) => ReturnType<typeof h>;
  /** Selected value(s) - for v-model binding */
  modelValue?: string | number | (string | number)[];
  /** Default value for uncontrolled mode */
  defaultValue?: string | number | (string | number)[];
  /** Enable multi-select mode */
  multiple?: boolean;
  /** Enable search functionality */
  searchable?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Disable the select */
  disabled?: boolean;
  /** Mark as required */
  required?: boolean;
  /** Show error state */
  error?: boolean;
  /** Enable infinite scroll */
  infiniteScroll?: boolean;
  /** Number of items per page (for infinite scroll) */
  pageSize?: number;
  /** Enable virtual scrolling */
  virtualized?: boolean;
  /** Maximum number of selections (for multi-select) */
  maxSelections?: number;
  /** Partial core selection config for advanced selection behavior */
  selectionConfig?: Partial<SelectionConfig>;
  /** Multi-select chip display behavior */
  multiSelectDisplay?: Partial<MultiSelectDisplayConfig>;
  /** Scroll-to-selected behavior */
  scrollToSelected?: Partial<ScrollToSelectedConfig>;
  /** Core style configuration for internal parts */
  styles?: StyleConfig;
  /** Full core config passthrough for advanced runtime features */
  config?: Partial<GlobalSelectConfig>;
  /** Custom icon/markup for selected chip remove buttons */
  removeButtonIcon?: string;
  /** Behavior overrides for visually disabled options */
  disabledOptionBehavior?: {
    selectable?: boolean;
    hoverable?: boolean;
    focusable?: boolean;
  };
  /** Show the selected-state side indicator */
  showSelectedIndicator?: boolean;
  /** Text and layout direction */
  direction?: 'ltr' | 'rtl';
  /** Dropdown placement */
  placement?: 'bottom' | 'top' | 'auto';
  /** Custom CSS class */
  className?: string;
  /** Custom inline styles */
  style?: Record<string, string>;
  /** State-class mapping for utility CSS frameworks */
  classMap?: ClassMap;
  /** Enable expandable dropdown */
  expandable?: boolean;

  /** Enable clear control button */
  clearable?: boolean;

  /** Clear selected values when clear control is clicked */
  clearSelectionOnClear?: boolean;

  /** Clear search query when clear control is clicked */
  clearSearchOnClear?: boolean;

  /** ARIA label for clear control */
  clearAriaLabel?: string;

  /** Icon text for clear control */
  clearIcon?: string;

  /** Custom option renderer returning an HTMLElement */
  optionRenderer?: (item: SelectItem, index: number, helpers: RendererHelpers) => HTMLElement;

  /** Custom Vue renderer returning a VNode */
  customRenderer?: (item: SelectItem, index: number) => ReturnType<typeof h>;

  /** Enable runtime tracking */
  trackingEnabled?: boolean;

  /** Track emitted events */
  trackEvents?: boolean;

  /** Track styling changes */
  trackStyling?: boolean;

  /** Track limitations and policy updates */
  trackLimitations?: boolean;

  /** Emit diagnostic events */
  emitDiagnostics?: boolean;

  /** Max entries retained per tracking channel */
  trackingMaxEntries?: number;

  /** Limitation control policies */
  limitationPolicies?: LimitationPolicyMap;

  /** Automatically mitigate mode switching limitation */
  autoMitigateRuntimeModeSwitch?: boolean;
}

export interface SelectEmits {
  /** Emitted when selection changes - for v-model */
  (e: 'update:modelValue', value: string | number | (string | number)[]): void;
  /** Emitted when selection changes with full details */
  (e: 'change', value: string | number | (string | number)[], selectedItems: SelectItem[]): void;
  /** Emitted when an item is selected */
  (e: 'select', item: SelectItem, index: number): void;
  /** Emitted when dropdown opens */
  (e: 'open'): void;
  /** Emitted when dropdown closes */
  (e: 'close'): void;
  /** Emitted when search query changes */
  (e: 'search', query: string): void;
  /** Emitted when more items are requested (infinite scroll) */
  (e: 'loadMore', page: number): void;
  /** Emitted when user creates a new item (if enabled) */
  (e: 'create', value: string): void;
  /** Emitted when clear control is used */
  (e: 'clear', detail: { clearedSelection: boolean; clearedSearch: boolean }): void;
  /** Emitted when runtime diagnostics are enabled */
  (e: 'diagnostic', detail: DiagnosticEventDetail): void;
}

const props = withDefaults(defineProps<SelectProps>(), {
  items: () => [],
  multiple: false,
  searchable: false,
  disabled: false,
  required: false,
  error: false,
  infiniteScroll: false,
  pageSize: 50,
  virtualized: true,
  showSelectedIndicator: true,
  placement: 'auto',
  clearable: false,
  clearSelectionOnClear: true,
  clearSearchOnClear: true,
  trackingEnabled: false,
  trackEvents: true,
  trackStyling: true,
  trackLimitations: true,
  emitDiagnostics: false,
  trackingMaxEntries: 200,
  autoMitigateRuntimeModeSwitch: true,
});

const emit = defineEmits<SelectEmits>();

const selectRef = ref<HTMLElement | null>(null);
const isElementReady = ref(false);
const internalValue = ref<string | number | (string | number)[] | undefined>(
  props.defaultValue
);
const customRendererCache = new Map<number, HTMLElement>();
const groupHeaderCache = new Map<number, HTMLElement>();

const cleanupCustomRendererCache = () => {
  customRendererCache.forEach((container) => render(null, container));
  customRendererCache.clear();
};

const cleanupGroupHeaderCache = () => {
  groupHeaderCache.forEach((container) => render(null, container));
  groupHeaderCache.clear();
};

// Manual management of renderer wrapper to avoid reactivity on function identity
const resolvedOptionRenderer = ref<any>(undefined);

// Watch for structural changes in renderers (presence only)
watch(
  [() => !!props.optionRenderer, () => !!props.customRenderer],
  ([hasOption, hasCustom]) => {
    if (hasOption) {
      cleanupCustomRendererCache();
      resolvedOptionRenderer.value = (item: SelectItem, index: number, helpers: RendererHelpers) => {
        // Accessing props inside here is safe - it delegates to current prop
        return props.optionRenderer?.(item, index, helpers) || document.createElement('div');
      };
    } else if (hasCustom) {
      resolvedOptionRenderer.value = (item: SelectItem, index: number) => {
        let container = customRendererCache.get(index);
        if (!container) {
          container = document.createElement('div');
          customRendererCache.set(index, container);
        }

        const node = props.customRenderer?.(item, index);
        if (node && isVNode(node)) {
          render(node, container);
        } else if (node) {
          render(h('span', String(node)), container);
        } else {
          render(null, container);
        }
        return container;
      };
    } else {
      cleanupCustomRendererCache();
      resolvedOptionRenderer.value = undefined;
    }
  },
  { immediate: true }
);

// Sync custom option renderer
// We watch the stable `resolvedOptionRenderer` ref, which only updates when structure changes.
watch(
  resolvedOptionRenderer,
  (renderer) => {
    safeCall((el) => {
      (el as any).optionRenderer = renderer;
    });
  },
  { immediate: true }
);

watch(
  () => props.classMap,
  (map) => {
    safeCall((el) => {
      (el as any).classMap = map;
    });
  },
  { immediate: true, deep: true }
);

const waitForUpgrade = async () => {
  if (typeof window === 'undefined') return;

  // Ensure the module is loaded (it registers the custom element on import)
  if (!customElements.get('enhanced-select')) {
    await import('@smilodon/core');
  }

  const el = selectRef.value as any;
  if (!el) return;

  // Wait until the element is upgraded and its methods exist.
  // In some environments, the tag can be defined but the particular instance
  // hasn't been upgraded yet when watchers/mounted run.
  try {
    await customElements.whenDefined('enhanced-select');
  } catch {
    // ignore
  }

  // Retry a few frames to let the browser upgrade the instance.
  for (let i = 0; i < 5; i++) {
    const candidate = selectRef.value as any;
    if (candidate && typeof candidate.setItems === 'function') {
      isElementReady.value = true;
      if (resolvedOptionRenderer.value) {
        (candidate as any).optionRenderer = resolvedOptionRenderer.value;
      }
      if (props.classMap) {
        (candidate as any).classMap = props.classMap;
      }
      if (props.groupHeaderRenderer) {
        (candidate as any).groupHeaderRenderer = createGroupHeaderRenderer(props.groupHeaderRenderer);
      }
      return;
    }
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }

  isElementReady.value = typeof (selectRef.value as any)?.setItems === 'function';
  if (isElementReady.value && resolvedOptionRenderer.value) {
    (selectRef.value as any).optionRenderer = resolvedOptionRenderer.value;
  }
  if (isElementReady.value && props.classMap) {
    (selectRef.value as any).classMap = props.classMap;
  }
  if (isElementReady.value && props.groupHeaderRenderer) {
    (selectRef.value as any).groupHeaderRenderer = createGroupHeaderRenderer(props.groupHeaderRenderer);
  }
};

function safeCall(fn: (el: any) => void) {
  const el = selectRef.value as any;
  if (!el || !isElementReady.value) return;
  fn(el);
}

function createGroupHeaderRenderer(renderer: NonNullable<SelectProps['groupHeaderRenderer']>) {
  return (group: GroupedItem, idx: number) => {
    const previous = groupHeaderCache.get(idx);
    if (previous) {
      render(null, previous);
      groupHeaderCache.delete(idx);
    }

    const container = document.createElement('div');
    const node = renderer(group, idx);
    if (node && isVNode(node)) {
      render(node, container);
    } else if (node) {
      render(h('span', String(node)), container);
    } else {
      render(null, container);
    }

    groupHeaderCache.set(idx, container);
    return container;
  };
}

// Check if component is controlled
const isControlled = computed(() => props.modelValue !== undefined);

// Get current value
const currentValue = computed(() =>
  isControlled.value ? props.modelValue : internalValue.value
);

// Sync items to web component
watch(
  () => props.items,
  (newItems) => {
    safeCall((el) => {
      if (newItems) el.setItems(newItems);
    });
  },
  { deep: true }
);

// Sync grouped items to web component
watch(
  () => props.groupedItems,
  (newGroups) => {
    safeCall((el) => {
      if (newGroups) el.setGroupedItems(newGroups);
    });
  },
  { deep: true }
);

// Sync custom group header renderer
watch(
  () => props.groupHeaderRenderer,
  (renderer) => {
    safeCall((el) => {
      cleanupGroupHeaderCache();

      if (!renderer) {
        el.groupHeaderRenderer = undefined;
        return;
      }

      el.groupHeaderRenderer = createGroupHeaderRenderer(renderer);
    });
  },
  { immediate: true }
);

watch(
  () => [props.items, props.groupedItems],
  () => {
    const totalItems = props.groupedItems
      ? props.groupedItems.reduce((count, group) => count + group.options.length, 0)
      : props.items.length;

    customRendererCache.forEach((container, index) => {
      if (index >= totalItems) {
        render(null, container);
        customRendererCache.delete(index);
      }
    });

    const totalGroups = props.groupedItems?.length ?? 0;
    groupHeaderCache.forEach((container, index) => {
      if (index >= totalGroups) {
        render(null, container);
        groupHeaderCache.delete(index);
      }
    });
  },
  { deep: true }
);

// Sync value to web component
watch(
  currentValue,
  (newValue) => {
    safeCall((el) => {
      if (newValue !== undefined) {
        // Get current selected values from the element to avoid infinite loop
        const currentSelected = el.getSelectedValues?.() || [];
        const newValues = Array.isArray(newValue) ? newValue : [newValue];
        
        // Only update if values have actually changed
        const hasChanged = !arraysEqualByValue(currentSelected, newValues);
        
        if (hasChanged) {
          el.setSelectedValues(newValues);
        }
      }
    });
  },
  { immediate: true }
);

// Sync configuration
const updateConfig = () => {
  safeCall((el) => {
    const config = {
      searchable: props.searchable,
      placeholder: props.placeholder,
      enabled: !props.disabled,
      virtualize: props.virtualized,
      direction: props.direction,
      dropdownPlacement: {
        mode: props.placement,
      },
      selection: {
        ...(props.selectionConfig ?? {}),
        mode: props.multiple ? 'multi' : 'single',
        maxSelections: props.maxSelections,
        removeButtonIcon: props.removeButtonIcon,
        disabledOptionBehavior: props.disabledOptionBehavior,
        showSelectedIndicator: props.showSelectedIndicator,
      },
      multiSelectDisplay: props.multiSelectDisplay,
      infiniteScroll: {
        enabled: props.infiniteScroll,
        pageSize: props.pageSize,
      },
      scrollToSelected: {
        enabled: true,
        ...(props.scrollToSelected ?? {}),
      },
      styles: props.styles,
      expandable: {
        enabled: props.expandable,
      },
      clearControl: {
        enabled: props.clearable,
        clearSelection: props.clearSelectionOnClear,
        clearSearch: props.clearSearchOnClear,
        ariaLabel: props.clearAriaLabel,
        icon: props.clearIcon,
      },
      tracking: {
        enabled: props.trackingEnabled,
        events: props.trackEvents,
        styling: props.trackStyling,
        limitations: props.trackLimitations,
        emitDiagnostics: props.emitDiagnostics,
        maxEntries: props.trackingMaxEntries,
      },
      limitations: {
        policies: props.limitationPolicies,
        autoMitigateRuntimeModeSwitch: props.autoMitigateRuntimeModeSwitch,
      },
    };

    el.updateConfig(config);
    if (props.config) {
      el.updateConfig(props.config);
    }
  });
};

watch(
  [
    () => props.searchable,
    () => props.placeholder,
    () => props.disabled,
    () => props.multiple,
    () => props.maxSelections,
    () => props.removeButtonIcon,
    () => props.infiniteScroll,
    () => props.pageSize,
    () => props.virtualized,
    () => props.direction,
    () => props.disabledOptionBehavior,
    () => props.showSelectedIndicator,
    () => props.expandable,
    () => props.clearable,
    () => props.clearSelectionOnClear,
    () => props.clearSearchOnClear,
    () => props.clearAriaLabel,
    () => props.clearIcon,
    () => props.trackingEnabled,
    () => props.trackEvents,
    () => props.trackStyling,
    () => props.trackLimitations,
    () => props.emitDiagnostics,
    () => props.trackingMaxEntries,
    () => props.limitationPolicies,
    () => props.autoMitigateRuntimeModeSwitch,
  ],
  updateConfig
);

// Event handlers
const handleSelect = (e: Event) => {
  const customEvent = e as CustomEvent<SelectEventDetail>;
  const { item, index } = customEvent.detail;
  emit('select', item as SelectItem, index);
};

const handleChange = (e: Event) => {
  const customEvent = e as CustomEvent<ChangeEventDetail>;
  const { selectedItems, selectedValues } = customEvent.detail;

  const values = selectedValues as (string | number)[];

  // Update internal value in uncontrolled mode
  if (!isControlled.value) {
    internalValue.value = props.multiple ? values : values[0];
  }

  // Emit events
  const value = props.multiple ? values : values[0];
  emit('update:modelValue', value);
  emit('change', value, selectedItems as SelectItem[]);
};

const handleOpen = () => {
  emit('open');
};

const handleClose = () => {
  emit('close');
};

const handleSearch = (e: Event) => {
  const customEvent = e as CustomEvent<SearchEventDetail>;
  emit('search', customEvent.detail.query);
};

const handleLoadMore = (e: Event) => {
  const customEvent = e as CustomEvent<LoadMoreEventDetail>;
  emit('loadMore', customEvent.detail.page);
};

const handleCreate = (e: Event) => {
  const customEvent = e as CustomEvent<{ value: string }>;
  emit('create', customEvent.detail.value);
};

const handleClear = (e: Event) => {
  const customEvent = e as CustomEvent<ClearEventDetail>;
  emit('clear', {
    clearedSelection: customEvent.detail.clearedSelection,
    clearedSearch: customEvent.detail.clearedSearch,
  });
};

const handleDiagnostic = (e: Event) => {
  const customEvent = e as CustomEvent<DiagnosticEventDetail>;
  emit('diagnostic', customEvent.detail);
};

// Setup event listeners
onMounted(async () => {
  await waitForUpgrade();
  if (!selectRef.value || !isElementReady.value) return;

  const element = selectRef.value as any;

  // Initial configuration
  updateConfig();

  if (props.placement) {
    element.setAttribute('placement', props.placement);
  }

  // Set initial items
  if (props.items?.length) {
    // Auto-convert flat items that include a `group` property into groupedItems
    const first = props.items[0];
    if (first && (first as any).group !== undefined) {
      const map = new Map<string, any[]>();
      props.items.forEach((it: any) => {
        const g = it.group ?? 'Ungrouped';
        if (!map.has(g)) map.set(g, []);
        map.get(g)!.push(it);
      });
      const groups = Array.from(map.entries()).map(([label, options]) => ({ label, options }));
      element.setGroupedItems(groups);
    } else {
      element.setItems(props.items);
    }
  }
  if (props.groupedItems?.length) {
    element.setGroupedItems(props.groupedItems);
  }

  // Set initial value
  if (currentValue.value !== undefined) {
    const values = Array.isArray(currentValue.value)
      ? currentValue.value
      : [currentValue.value];
    element.setSelectedValues(values);
  }

  // Add event listeners
  element.addEventListener('select', handleSelect as EventListener);
  element.addEventListener('change', handleChange as EventListener);
  element.addEventListener('open', handleOpen as EventListener);
  element.addEventListener('close', handleClose as EventListener);
  element.addEventListener('search', handleSearch as EventListener);
  element.addEventListener('loadMore', handleLoadMore as EventListener);
  element.addEventListener('create', handleCreate as EventListener);
  element.addEventListener('clear', handleClear as EventListener);
  element.addEventListener('diagnostic', handleDiagnostic as EventListener);
});

onBeforeUnmount(() => {
  cleanupCustomRendererCache();
  cleanupGroupHeaderCache();

  if (!selectRef.value) return;

  const element = selectRef.value;

  // Remove event listeners
  element.removeEventListener('select', handleSelect as EventListener);
  element.removeEventListener('change', handleChange as EventListener);
  element.removeEventListener('open', handleOpen as EventListener);
  element.removeEventListener('close', handleClose as EventListener);
  element.removeEventListener('search', handleSearch as EventListener);
  element.removeEventListener('loadMore', handleLoadMore as EventListener);
  element.removeEventListener('create', handleCreate as EventListener);
  element.removeEventListener('clear', handleClear as EventListener);
  element.removeEventListener('diagnostic', handleDiagnostic as EventListener);
});

// Expose imperative API
defineExpose({
  /** Open the dropdown */
  open: () => {
    (selectRef.value as any)?.open();
  },
  /** Close the dropdown */
  close: () => {
    (selectRef.value as any)?.close();
  },
  /** Focus the select */
  focus: () => {
    selectRef.value?.focus();
  },
  /** Set items programmatically */
  setItems: (items: SelectItem[]) => {
    (selectRef.value as any)?.setItems(items);
  },
  /** Set grouped items programmatically */
  setGroupedItems: (groups: GroupedItem[]) => {
    (selectRef.value as any)?.setGroupedItems(groups);
  },
  /** Clear selection */
  clear: () => {
    (selectRef.value as any)?.setSelectedValues([]);
    if (!isControlled.value) {
      internalValue.value = props.multiple ? [] : undefined;
    }
    const value = props.multiple ? [] : '';
    emit('update:modelValue', value);
    emit('change', value, []);
  },
  /** Get selected items */
  getSelectedItems: () => {
    return (selectRef.value as any)?.getSelectedItems?.() || [];
  },
  /** Get selected values */
  getSelectedValues: () => {
    return (selectRef.value as any)?.getSelectedValues?.() || [];
  },
  /** Clear current search query */
  clearSearch: () => {
    (selectRef.value as any)?.clearSearch?.();
  },
  /** Apply partial core config at runtime */
  updateConfig: (config: Partial<GlobalSelectConfig>) => {
    (selectRef.value as any)?.updateConfig?.(config);
  },
  /** Set error state */
  setError: (message: string) => {
    (selectRef.value as any)?.setError?.(message);
  },
  /** Clear error state */
  clearError: () => {
    (selectRef.value as any)?.clearError?.();
  },
  /** Toggle required state */
  setRequired: (required: boolean) => {
    (selectRef.value as any)?.setRequired?.(required);
  },
  /** Validate the component */
  validate: () => {
    return (selectRef.value as any)?.validate?.() ?? true;
  },
  /** Runtime capability report */
  getCapabilities: () => {
    return (selectRef.value as any)?.getCapabilities?.();
  },
  /** Known limitations report */
  getKnownLimitations: () => {
    return (selectRef.value as any)?.getKnownLimitations?.() || [];
  },
  /** Tracking snapshot */
  getTrackingSnapshot: () => {
    return (selectRef.value as any)?.getTrackingSnapshot?.() || { events: [], styles: [], limitations: [] };
  },
  /** Clear tracking entries */
  clearTracking: (source?: 'event' | 'style' | 'limitation' | 'all') => {
    (selectRef.value as any)?.clearTracking?.(source);
  },
  /** Update limitation policies */
  setLimitationPolicies: (policies: LimitationPolicyMap) => {
    (selectRef.value as any)?.setLimitationPolicies?.(policies);
  },
});
</script>

<style scoped>
/* Component uses web component styling from @smilodon/core */
</style>
