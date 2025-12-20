<script lang="ts">
  import { onMount } from 'svelte';
  import type { NativeSelectOptions } from '@native-select/core';

  export let items: unknown[] = [];
  export let multi: boolean = false;
  export let placement: 'top' | 'bottom' = 'bottom';
  export let estimatedItemHeight: number = 40;
  export let buffer: number = 5;

  let elementRef: any;

  // Register custom element
  onMount(async () => {
    if (typeof window !== 'undefined' && !customElements.get('native-select')) {
      const module = await import('@native-select/core');
      if (!customElements.get('native-select')) {
        customElements.define('native-select', module.NativeSelectElement);
      }
    }

    // Sync initial props
    if (elementRef) {
      elementRef.items = items;
      elementRef.multi = multi;
      elementRef.placement = placement;
      elementRef.estimatedItemHeight = estimatedItemHeight;
      elementRef.buffer = buffer;
    }
  });

  // Reactive updates
  $: if (elementRef) {
    elementRef.items = items;
  }
  $: if (elementRef) {
    elementRef.multi = multi;
  }
  $: if (elementRef) {
    elementRef.placement = placement;
  }
  $: if (elementRef) {
    elementRef.estimatedItemHeight = estimatedItemHeight;
  }
  $: if (elementRef) {
    elementRef.buffer = buffer;
  }

  // Export imperative methods
  export function focus() {
    elementRef?.focus();
  }

  export function open() {
    elementRef?.open();
  }

  export function close() {
    elementRef?.close();
  }

  export function getSelectedIndices(): number[] {
    return elementRef?.selectedIndices || [];
  }

  export function getSelectedItems(): unknown[] {
    return elementRef?.selectedItems || [];
  }

  export function getActiveIndex(): number {
    return elementRef?.activeIndex || -1;
  }
</script>

<native-select
  bind:this={elementRef}
  on:select
  on:open
  on:close
  on:search
  {...$$restProps}
/>
