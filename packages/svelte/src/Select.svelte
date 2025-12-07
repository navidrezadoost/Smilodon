<!--
  Svelte Adapter for Enhanced Select Component
-->

<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import type { GlobalSelectConfig } from '../../core/src/config/global-config';

  export let items: unknown[] = [];
  export let initialSelectedValues: unknown[] | undefined = undefined;
  export let selectedValues: unknown[] | undefined = undefined;
  export let config: Partial<GlobalSelectConfig> = {};
  export let className: string = '';
  export let style: string = '';

  const dispatch = createEventDispatcher<{
    change: { items: unknown[]; values: unknown[] };
    select: { item: unknown; index: number; value: unknown; label: string; selected: boolean };
    open: void;
    close: void;
    search: { query: string };
    loadMore: { page: number };
    error: { error: Error };
  }>();

  let containerRef: HTMLDivElement;
  let selectElement: any = null;

  onMount(async () => {
    // Dynamically import the enhanced select component
    const { EnhancedSelect } = await import('../../core/src/components/enhanced-select');

    const select = document.createElement('enhanced-select') as any;
    containerRef.appendChild(select);
    selectElement = select;

    // Apply configuration
    select.updateConfig({
      ...config,
      callbacks: {
        onSelect: (data: any) => dispatch('select', data),
        onOpen: () => dispatch('open'),
        onClose: () => dispatch('close'),
        onSearch: (query: string) => dispatch('search', { query }),
        onLoadMore: (page: number) => dispatch('loadMore', { page }),
        onError: (error: Error) => dispatch('error', { error }),
        onChange: (items: unknown[], values: unknown[]) => {
          dispatch('change', { items, values });
          selectedValues = values;
        },
      },
    });

    // Set initial items
    if (items.length > 0) {
      select.setItems(items);
    }

    // Set initial selected values
    if (initialSelectedValues) {
      await select.setSelectedValues(initialSelectedValues);
    }

    // Set selected values if provided
    if (selectedValues) {
      await select.setSelectedValues(selectedValues);
    }
  });

  onDestroy(() => {
    if (selectElement && containerRef) {
      containerRef.removeChild(selectElement);
    }
  });

  // Reactive statements for prop changes
  $: if (selectElement && items) {
    selectElement.setItems(items);
  }

  $: if (selectElement && selectedValues !== undefined) {
    selectElement.setSelectedValues(selectedValues);
  }

  $: if (selectElement && config) {
    selectElement.updateConfig(config);
  }

  // Public methods
  export function getSelectedItems(): unknown[] {
    return selectElement?.getSelectedItems() || [];
  }

  export function getSelectedValues(): unknown[] {
    return selectElement?.getSelectedValues() || [];
  }

  export async function setSelectedValues(values: unknown[]): Promise<void> {
    await selectElement?.setSelectedValues(values);
  }

  export function clear(): void {
    selectElement?.clear();
  }

  export function open(): void {
    selectElement?.open();
  }

  export function close(): void {
    selectElement?.close();
  }

  export function updateConfig(newConfig: Partial<GlobalSelectConfig>): void {
    selectElement?.updateConfig(newConfig);
  }

  export function setItems(newItems: unknown[]): void {
    selectElement?.setItems(newItems);
  }
</script>

<div bind:this={containerRef} class={className} {style}></div>

<style>
  div {
    width: 100%;
  }
</style>
