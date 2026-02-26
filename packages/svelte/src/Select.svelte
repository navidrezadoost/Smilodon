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

<script lang="ts" context="module">
  export interface SelectItem {
    value: string | number;
    label: string;
    disabled?: boolean;
    group?: string;
    [key: string]: any;
  }
</script>

<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import type {
    SelectEventDetail,
    OpenEventDetail,
    CloseEventDetail,
    SearchEventDetail,
    ChangeEventDetail,
    LoadMoreEventDetail,
    ClearEventDetail,
    GroupedItem,
    DiagnosticEventDetail,
    LimitationPolicyMap,
  } from '@smilodon/core';

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
  export let clearable: boolean = false;
  export let clearSelectionOnClear: boolean = true;
  export let clearSearchOnClear: boolean = true;
  export let clearAriaLabel: string = 'Clear selection and search';
  export let clearIcon: string = '×';
  export let optionRenderer: ((item: SelectItem, index: number, helpers: any) => HTMLElement) | undefined = undefined;
  export let trackingEnabled: boolean = false;
  export let trackEvents: boolean = true;
  export let trackStyling: boolean = true;
  export let trackLimitations: boolean = true;
  export let emitDiagnostics: boolean = false;
  export let trackingMaxEntries: number = 200;
  export let limitationPolicies: LimitationPolicyMap | undefined = undefined;
  export let autoMitigateRuntimeModeSwitch: boolean = true;

  const dispatch = createEventDispatcher<{
    change: { value: string | number | (string | number)[]; selectedItems: SelectItem[] };
    select: { item: SelectItem; index: number };
    open: void;
    close: void;
    search: { query: string };
    loadMore: { page: number };
    create: { value: string };
    clear: { clearedSelection: boolean; clearedSearch: boolean };
    diagnostic: DiagnosticEventDetail;
  }>();

  let selectRef: HTMLElement;
  let internalValue: string | number | (string | number)[] | undefined = defaultValue;

  // Stable wrapper to handle optionRenderer updates without triggering infinite loops
  const resolvedOptionRenderer = (item: SelectItem, index: number, helpers: any) => {
    return optionRenderer ? optionRenderer(item, index, helpers) : document.createElement('div');
  };

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

  function handleClear(e: Event) {
    const customEvent = e as CustomEvent<ClearEventDetail>;
    dispatch('clear', {
      clearedSelection: customEvent.detail.clearedSelection,
      clearedSearch: customEvent.detail.clearedSearch,
    });
  }

  function handleDiagnostic(e: Event) {
    const customEvent = e as CustomEvent<DiagnosticEventDetail>;
    dispatch('diagnostic', customEvent.detail);
  }

  function updateConfig() {
    if (!selectRef) return;
    (selectRef as any).updateConfig?.({
      searchable,
      placeholder,
      enabled: !disabled,
      selection: {
        mode: multiple ? 'multi' : 'single',
        maxSelections,
      },
      infiniteScroll: {
        enabled: infiniteScroll,
        pageSize,
      },
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
      limitations: {
        policies: limitationPolicies,
        autoMitigateRuntimeModeSwitch,
      },
    });
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
      (element as any).optionRenderer = resolvedOptionRenderer;
    }

    // Set initial items
    if (items?.length) {
      // Auto-convert flat items with `group` property into groupedItems
      const first = items[0];
      if (first && (first as any).group !== undefined) {
        const map = new Map<string, any[]>();
        items.forEach((it: any) => {
          const g = it.group ?? 'Ungrouped';
          if (!map.has(g)) map.set(g, []);
          map.get(g)!.push(it);
        });
        const groups = Array.from(map.entries()).map(([label, options]) => ({ label, options }));
        (element as any).setGroupedItems(groups);
      } else {
        (element as any).setItems(items);
      }
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
    element.addEventListener('clear', handleClear as EventListener);
    element.addEventListener('diagnostic', handleDiagnostic as EventListener);

    updateConfig();
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
    element.removeEventListener('clear', handleClear as EventListener);
    element.removeEventListener('diagnostic', handleDiagnostic as EventListener);
  });

  // Reactive updates
  $: if (selectRef && items) {
    if (typeof (selectRef as any).setItems === 'function') {
      (selectRef as any).setItems(items);
    }
  }

  $: if (selectRef && groupedItems) {
    if (typeof (selectRef as any).setGroupedItems === 'function') {
      (selectRef as any).setGroupedItems(groupedItems);
    }
  }

  $: if (selectRef && currentValue !== undefined) {
    if (typeof (selectRef as any).setSelectedValues === 'function') {
      const values = Array.isArray(currentValue) ? currentValue : [currentValue];
      (selectRef as any).setSelectedValues(values);
    }
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
      if ((selectRef as any).optionRenderer !== resolvedOptionRenderer) {
        (selectRef as any).optionRenderer = resolvedOptionRenderer;
      }
    } else if ((selectRef as any).optionRenderer === resolvedOptionRenderer) {
      (selectRef as any).optionRenderer = undefined;
    }
  }

  $: if (selectRef) {
    updateConfig();
  }

  // Public methods
  export function open() {
    if (typeof (selectRef as any)?.open === 'function') {
      (selectRef as any).open();
    }
  }

  export function close() {
    if (typeof (selectRef as any)?.close === 'function') {
      (selectRef as any).close();
    }
  }

  export function focus() {
    if (typeof (selectRef as any)?.focus === 'function') {
      (selectRef as any).focus();
    }
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

  export function getCapabilities() {
    return (selectRef as any)?.getCapabilities?.();
  }

  export function getKnownLimitations() {
    return (selectRef as any)?.getKnownLimitations?.() || [];
  }

  export function getTrackingSnapshot() {
    return (selectRef as any)?.getTrackingSnapshot?.() || { events: [], styles: [], limitations: [] };
  }

  export function clearTracking(source?: 'event' | 'style' | 'limitation' | 'all') {
    (selectRef as any)?.clearTracking?.(source);
  }

  export function setLimitationPolicies(policies: LimitationPolicyMap) {
    (selectRef as any)?.setLimitationPolicies?.(policies);
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
