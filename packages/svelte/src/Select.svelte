<!--
  Smilodon Select Component for Svelte
  
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
    {items}
    bind:value={selectedValue}
    searchable
    placeholder="Select an option..."
  />
-->

<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import type {
    SelectEventDetail,
    OpenEventDetail,
    CloseEventDetail,
    SearchEventDetail,
    ChangeEventDetail,
    LoadMoreEventDetail,
    GroupedItem,
  } from '@smilodon/core';

  export interface SelectItem {
    value: string | number;
    label: string;
    disabled?: boolean;
    group?: string;
    [key: string]: any;
  }

  // Props
  export let items: SelectItem[] = [];
  export let groupedItems: GroupedItem[] | undefined = undefined;
  export let value: string | number | (string | number)[] | undefined = undefined;
  export let defaultValue: string | number | (string | number)[] | undefined = undefined;
  export let multiple: boolean = false;
  export let searchable: boolean = false;
  export let placeholder: string = '';
  export let disabled: boolean = false;
  export let required: boolean = false;
  export let error: boolean = false;
  export let infiniteScroll: boolean = false;
  export let pageSize: number = 50;
  export let virtualized: boolean = true;
  export let maxSelections: number | undefined = undefined;
  export let placement: 'bottom' | 'top' | 'auto' = 'auto';
  export let className: string = '';
  export let style: string = '';
  export let optionRenderer: ((item: SelectItem, index: number, helpers: any) => HTMLElement) | undefined = undefined;

  const dispatch = createEventDispatcher<{
    change: { value: string | number | (string | number)[]; selectedItems: SelectItem[] };
    select: { item: SelectItem; index: number };
    open: void;
    close: void;
    search: { query: string };
    loadMore: { page: number };
    create: { value: string };
  }>();

  let selectRef: HTMLElement;
  let internalValue: string | number | (string | number)[] | undefined = defaultValue;

  // Check if component is controlled
  $: isControlled = value !== undefined;
  $: currentValue = isControlled ? value : internalValue;

  // Event handlers
  function handleSelect(e: Event) {
    const customEvent = e as CustomEvent<SelectEventDetail>;
    const { item, index } = customEvent.detail;
    dispatch('select', { item: item as SelectItem, index });
  }

  function handleChange(e: Event) {
    const customEvent = e as CustomEvent<ChangeEventDetail>;
    const { selectedItems, selectedValues } = customEvent.detail;

    const values = selectedValues as (string | number)[];

    // Update internal value in uncontrolled mode
    if (!isControlled) {
      internalValue = multiple ? values : values[0];
    }

    // Emit change event
    const newValue = multiple ? values : values[0];
    value = newValue; // Update binding
    dispatch('change', { value: newValue, selectedItems: selectedItems as SelectItem[] });
  }

  function handleOpen() {
    dispatch('open');
  }

  function handleClose() {
    dispatch('close');
  }

  function handleSearch(e: Event) {
    const customEvent = e as CustomEvent<SearchEventDetail>;
    dispatch('search', { query: customEvent.detail.query });
  }

  function handleLoadMore(e: Event) {
    const customEvent = e as CustomEvent<LoadMoreEventDetail>;
    dispatch('loadMore', { page: customEvent.detail.page });
  }

  function handleCreate(e: Event) {
    const customEvent = e as CustomEvent<{ value: string }>;
    dispatch('create', { value: customEvent.detail.value });
  }

  onMount(() => {
    if (!selectRef) return;

    const element = selectRef;

    // Set initial attributes
    if (placeholder) element.setAttribute('placeholder', placeholder);
    if (disabled) element.setAttribute('disabled', '');
    if (required) element.setAttribute('required', '');
    if (error) element.setAttribute('error', '');
    if (searchable) element.setAttribute('searchable', '');
    if (multiple) element.setAttribute('multiple', '');
    if (virtualized) element.setAttribute('virtualized', '');
    if (infiniteScroll) element.setAttribute('infinite-scroll', '');
    if (pageSize) element.setAttribute('page-size', String(pageSize));
    if (maxSelections) element.setAttribute('max-selections', String(maxSelections));
    if (placement) element.setAttribute('placement', placement);

    if (optionRenderer) {
      (element as any).optionRenderer = optionRenderer;
    }

    // Set initial items
    if (items?.length) {
      (element as any).setItems(items);
    }
    if (groupedItems?.length) {
      (element as any).setGroupedItems(groupedItems);
    }

    // Set initial value
    if (currentValue !== undefined) {
      const values = Array.isArray(currentValue) ? currentValue : [currentValue];
      (element as any).setSelectedValues(values);
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

  onDestroy(() => {
    if (!selectRef) return;

    const element = selectRef;

    // Remove event listeners
    element.removeEventListener('select', handleSelect as EventListener);
    element.removeEventListener('change', handleChange as EventListener);
    element.removeEventListener('open', handleOpen as EventListener);
    element.removeEventListener('close', handleClose as EventListener);
    element.removeEventListener('search', handleSearch as EventListener);
    element.removeEventListener('loadMore', handleLoadMore as EventListener);
    element.removeEventListener('create', handleCreate as EventListener);
  });

  // Reactive updates
  $: if (selectRef && items) {
    (selectRef as any).setItems(items);
  }

  $: if (selectRef && groupedItems) {
    (selectRef as any).setGroupedItems(groupedItems);
  }

  $: if (selectRef && currentValue !== undefined) {
    const values = Array.isArray(currentValue) ? currentValue : [currentValue];
    (selectRef as any).setSelectedValues(values);
  }

  $: if (selectRef) {
    if (placeholder) selectRef.setAttribute('placeholder', placeholder);
    if (disabled) {
      selectRef.setAttribute('disabled', '');
    } else {
      selectRef.removeAttribute('disabled');
    }
    if (searchable) {
      selectRef.setAttribute('searchable', '');
    } else {
      selectRef.removeAttribute('searchable');
    }
    if (multiple) {
      selectRef.setAttribute('multiple', '');
    } else {
      selectRef.removeAttribute('multiple');
    }
    if (virtualized) {
      selectRef.setAttribute('virtualized', '');
    } else {
      selectRef.removeAttribute('virtualized');
    }

    if (optionRenderer) {
      (selectRef as any).optionRenderer = optionRenderer;
    }
  }

  // Public methods
  export function open() {
    (selectRef as any)?.open();
  }

  export function close() {
    (selectRef as any)?.close();
  }

  export function focus() {
    selectRef?.focus();
  }

  export function setItems(newItems: SelectItem[]) {
    (selectRef as any)?.setItems(newItems);
  }

  export function setGroupedItems(groups: GroupedItem[]) {
    (selectRef as any)?.setGroupedItems(groups);
  }

  export function clear() {
    (selectRef as any)?.setSelectedValues([]);
    if (!isControlled) {
      internalValue = multiple ? [] : undefined;
    }
    const newValue = multiple ? [] : '';
    value = newValue as any;
    dispatch('change', { value: newValue as any, selectedItems: [] });
  }
</script>

<enhanced-select
  bind:this={selectRef}
  class={className}
  {style}
/>

<style>
  /* Component uses web component styling from @smilodon/core */
</style>
