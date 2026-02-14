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
  GroupedItem,
  RendererHelpers,
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

  /** Custom option renderer returning an HTMLElement */
  optionRenderer?: (item: SelectItem, index: number, helpers: RendererHelpers) => HTMLElement;

  /** Custom Vue renderer returning a VNode */
  customRenderer?: (item: SelectItem, index: number) => ReturnType<typeof h>;
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
});

const emit = defineEmits<SelectEmits>();

const selectRef = ref<HTMLElement | null>(null);
const isElementReady = ref(false);
const internalValue = ref<string | number | (string | number)[] | undefined>(
  props.defaultValue
);
const customRendererCache = new Map<number, HTMLElement>();

const resolvedOptionRenderer = computed(() => {
  if (props.optionRenderer) return props.optionRenderer;
  if (!props.customRenderer) return undefined;

  return (item: SelectItem, index: number) => {
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
});

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

const safeCall = (fn: (el: any) => void) => {
  const el = selectRef.value as any;
  if (!el || !isElementReady.value) return;
  fn(el);
};

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

// Sync custom option renderer
watch(
  () => resolvedOptionRenderer.value,
  (renderer) => {
    safeCall((el) => {
      (el as any).optionRenderer = renderer;
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
    element.setItems(props.items);
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
});
</script>

<style scoped>
/* Component uses web component styling from @smilodon/core */
</style>
