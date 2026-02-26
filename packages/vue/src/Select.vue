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
    :class="className"
    :style="style"
  />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed, render, isVNode, h } from 'vue';
import type {
  SelectEventDetail,
  OpenEventDetail,
  CloseEventDetail,
  SearchEventDetail,
  ChangeEventDetail,
  LoadMoreEventDetail,
  ClearEventDetail,
  GroupedItem,
  RendererHelpers,
  DiagnosticEventDetail,
  LimitationPolicyMap,
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
  /** Dropdown placement */
  placement?: 'bottom' | 'top' | 'auto';
  /** Custom CSS class */
  className?: string;
  /** Custom inline styles */
  style?: Record<string, string>;
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

// Manual management of renderer wrapper to avoid reactivity on function identity
const resolvedOptionRenderer = ref<any>(undefined);

// Watch for structural changes in renderers (presence only)
watch(
  [() => !!props.optionRenderer, () => !!props.customRenderer],
  ([hasOption, hasCustom]) => {
    if (hasOption) {
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
      return;
    }
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }

  isElementReady.value = typeof (selectRef.value as any)?.setItems === 'function';
  if (isElementReady.value && resolvedOptionRenderer.value) {
    (selectRef.value as any).optionRenderer = resolvedOptionRenderer.value;
  }
};

function safeCall(fn: (el: any) => void) {
  const el = selectRef.value as any;
  if (!el || !isElementReady.value) return;
  fn(el);
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
      if (renderer) {
        el.groupHeaderRenderer = (group: any, idx: number) => {
          const container = document.createElement('div');
          const node = renderer(group, idx);
          if (node && isVNode(node)) {
            render(node, container);
          } else if (node) {
            render(h('span', String(node)), container);
          }
          return container;
        };
      }
    });
  }
);

// Sync custom group header renderer
watch(
  () => props.groupHeaderRenderer,
  (renderer) => {
    safeCall((el) => {
      if (renderer) {
        el.groupHeaderRenderer = (group: any, idx: number) => {
          const container = document.createElement('div');
          const node = renderer(group, idx);
          if (node && isVNode(node)) {
            render(node, container);
          } else if (node) {
            render(h('span', String(node)), container);
          }
          return container;
        };
      }
    });
  }
);

// removed old watcher

// We need to keep rendererRefs in sync with props
// Wait, the previous replacement put the watch inside the script setup directly after refs.
// That watch updates rendererRefs.
// But we ALSO need to update the web component if the *presence* of renderers changes (e.g. going from undefined to defined).
// The existing watcher below was watching `resolvedOptionRenderer.value`.
// Since `resolvedOptionRenderer` computed now depends only on PRESENCE (implicitly through logic), it should remain stable.
// So `watch(() => resolvedOptionRenderer.value)` will only fire when PRESENCE changes.
// THIS IS EXACTLY WHAT WE WANT. It won't fire on identity change.
// So the original watcher is actually fine as is!
// BUT: I changed how `resolvedOptionRenderer` works. Let's double check if I broke the watch logic.
// The computed property returns a *new function* only if the structure changes (e.g. `hasOptionRenderer` flips).
// So the watcher below will trigger correctly only when structure changes.

// Wait, I see I didn't include `rendererRefs` update in the previous `replace_string_in_file` properly?
// Previous call:
// Replaced `const resolvedOptionRenderer ...` block.
// Included `rendererRefs` definition and `watch` to update refs.

// But wait, the previous `replace_string_in_file` REPLACED the computed property, but did it include the watch for refs?
// Yes.
// So the code looks like:
// ...
// const rendererRefs = ...
// watch( ... updates rendererRefs ... )
// const resolvedOptionRenderer = computed( ... )
// ...
//
// And further down there is existing code:
// watch(() => resolvedOptionRenderer.value, ...)
//
// This existing code is correct! It will update the WC only when the wrapper function changes (which is stable).
// So I don't need to change the watcher below.
// UNLESS: The watcher below relies on `resolvedOptionRenderer.value` changing.
// If props.customRenderer changes from `undefined` to `fn`, computed re-runs -> new wrapper -> watcher runs -> WC updated. Correct.
// If props.customRenderer changes from `fn1` to `fn2`, computed (depending on `!!props`? No, computed in Vue tracks all dependencies accessed).
// Wait! `resolvedOptionRenderer` accesses `rendererRefs`.
// `rendererRefs` is a local object. It is NOT reactive (it's a plain object).
// `computed` tracks dependencies. If I access `rendererRefs.customRenderer`, does Vue track it? No.
// So `resolvedOptionRenderer` will NOT re-run when `rendererRefs` changes. This is GOOD. It's stable.
// But `watch(() => [props.optionRenderer, props.customRenderer], ...)` updates `rendererRefs`.
// So when `fn1` -> `fn2`, `rendererRefs` is updated. `resolvedOptionRenderer` is NOT re-computed. The OLD wrapper function is still used.
// But the wrapper function calls `rendererRefs.customRenderer`. This is the NEW function `fn2`.
// So it works! The wrapper delegates to the current ref.
// And `resolvedOptionRenderer.value` (the wrapper) hasn't changed identity, so the watcher below (syncing to WC) does NOT fire.
// This means `el.optionRenderer = wrapper` is NOT called again.
// Is this okay? Yes, because `el.optionRenderer` is already set to the wrapper. The wrapper hasn't changed.
// So the infinite loop is broken.

// HOWEVER: I still need to check if my previous replacement was syntactically correct and complete.
// I see I replaced `const resolvedOptionRenderer ...` with a block that includes `const rendererRefs ...`.
// Let's verify `rendererRefs` is reactive or not.
// `const rendererRefs = { ... }` is NOT reactive. This is intentional.
// We don't want reactivity to trigger computed re-eval.

// BUT `watch(() => [props.optionRenderer...])` updates it.
// The watcher needs `props` to be in scope. `props` is defined above.
// It seems correct.

// One detail:
// `const resolvedOptionRenderer = computed(() => { ... })`
// Vue computed properties track dependencies.
// Inside computed, I access `props.optionRenderer` (to check boolean).
// So computed depends on `props.optionRenderer`.
// If `props.optionRenderer` changes from `fn1` to `fn2`, `!!props.optionRenderer` is still `true`.
// Does the dependency change?
// Vue tracks access. If I only access `!!props.optionRenderer`, maybe it only tracks the boolean?
// No, usually it tracks the property.
// If I use `props.optionRenderer` in `if (props.optionRenderer)`, it tracks it.
// So if it changes, computed re-runs!
// And returns a NEW function.
// So watcher runs -> WC update -> Loop.
// I need `computed` to NOT depend on the function identity.
// I should use `!!props.optionRenderer` in a way that doesn't trigger on identity change?
// Or better: explicit dependencies or a structure that isolates the check.
// In Vue `computed`, we can't easily control the dependency array like React's `useMemo`.
// But we can access the boolean via a separate stable computed property or just trust that Vue's dependency tracking is based on value?.
// No, props are reactive.
// If I assume Vue computes re-run on prop change:
// Then the wrapper is recreated.
// I need `resolvedOptionRenderer` to be a `shallowRef` or generic `ref` that I manually update only when structure changes!
// `computed` is risky here.

// Better approach for Vue:
// Use `ref` for the wrapper.
// Watch `[() => !!props.optionRenderer, () => !!props.customRenderer]` explicitly.
// When that specific boolean tuple changes, update the wrapper ref.
// And have the "Sync custom option renderer" watch depend on that wrapper ref.

// Let's undo/redo the Vue part with this safer `shallowRef` approach.

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
        const hasChanged = 
          currentSelected.length !== newValues.length ||
          !currentSelected.every((v: any, i: number) => v === newValues[i]);
        
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
      selection: {
        mode: props.multiple ? 'multi' : 'single',
        maxSelections: props.maxSelections,
      },
      infiniteScroll: {
        enabled: props.infiniteScroll,
        pageSize: props.pageSize,
      },
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
  });
};

watch(
  [
    () => props.searchable,
    () => props.placeholder,
    () => props.disabled,
    () => props.multiple,
    () => props.maxSelections,
    () => props.infiniteScroll,
    () => props.pageSize,
    () => props.virtualized,
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
  customRendererCache.forEach((container) => render(null, container));
  customRendererCache.clear();

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
