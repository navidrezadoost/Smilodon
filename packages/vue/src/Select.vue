<!--
  Vue 3 Adapter for Enhanced Select Component
-->

<template>
  <div ref="containerRef" :class="className" :style="style"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, defineExpose } from 'vue';
import type { GlobalSelectConfig } from '../../core/src/config/global-config';

export interface VueSelectProps {
  /** Items to display */
  items?: unknown[];
  /** Initial selected values */
  initialSelectedValues?: unknown[];
  /** Controlled selected values */
  modelValue?: unknown[];
  /** Configuration */
  config?: Partial<GlobalSelectConfig>;
  /** Custom className */
  className?: string;
  /** Custom style */
  style?: Record<string, string>;
}

export interface VueSelectEmits {
  (e: 'update:modelValue', values: unknown[]): void;
  (e: 'change', items: unknown[], values: unknown[]): void;
  (e: 'select', data: { item: unknown; index: number; value: unknown; label: string; selected: boolean }): void;
  (e: 'open'): void;
  (e: 'close'): void;
  (e: 'search', query: string): void;
  (e: 'loadMore', page: number): void;
  (e: 'error', error: Error): void;
}

const props = withDefaults(defineProps<VueSelectProps>(), {
  items: () => [],
  config: () => ({}),
});

const emit = defineEmits<VueSelectEmits>();

const containerRef = ref<HTMLDivElement | null>(null);
let selectElement: any = null;

onMounted(async () => {
  if (!containerRef.value) return;

  // Dynamically import the enhanced select component
  const { EnhancedSelect } = await import('../../core/src/components/enhanced-select');

  const select = document.createElement('enhanced-select') as any;
  containerRef.value.appendChild(select);
  selectElement = select;

  // Apply configuration
  select.updateConfig({
    ...props.config,
    callbacks: {
      onSelect: (data: any) => emit('select', data),
      onOpen: () => emit('open'),
      onClose: () => emit('close'),
      onSearch: (query: string) => emit('search', query),
      onLoadMore: (page: number) => emit('loadMore', page),
      onError: (error: Error) => emit('error', error),
      onChange: (items: unknown[], values: unknown[]) => {
        emit('change', items, values);
        emit('update:modelValue', values);
      },
    },
  });

  // Set initial items
  if (props.items && props.items.length > 0) {
    select.setItems(props.items);
  }

  // Set initial selected values
  if (props.initialSelectedValues) {
    await select.setSelectedValues(props.initialSelectedValues);
  }

  // Set model value if provided
  if (props.modelValue) {
    await select.setSelectedValues(props.modelValue);
  }
});

onUnmounted(() => {
  if (selectElement && containerRef.value) {
    containerRef.value.removeChild(selectElement);
  }
});

// Watch for items changes
watch(() => props.items, (newItems) => {
  if (selectElement && newItems) {
    selectElement.setItems(newItems);
  }
}, { deep: true });

// Watch for modelValue changes
watch(() => props.modelValue, (newValue) => {
  if (selectElement && newValue !== undefined) {
    selectElement.setSelectedValues(newValue);
  }
}, { deep: true });

// Watch for config changes
watch(() => props.config, (newConfig) => {
  if (selectElement) {
    selectElement.updateConfig(newConfig);
  }
}, { deep: true });

// Expose methods
defineExpose({
  getSelectedItems: () => selectElement?.getSelectedItems() || [],
  getSelectedValues: () => selectElement?.getSelectedValues() || [],
  setSelectedValues: async (values: unknown[]) => {
    await selectElement?.setSelectedValues(values);
  },
  clear: () => selectElement?.clear(),
  open: () => selectElement?.open(),
  close: () => selectElement?.close(),
  updateConfig: (config: Partial<GlobalSelectConfig>) => selectElement?.updateConfig(config),
  setItems: (items: unknown[]) => selectElement?.setItems(items),
});
</script>
