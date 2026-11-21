<script lang="ts">
  import { Select } from '@smilodon/svelte';

  let showSlots = true;
  const items = [{ value: 'apple', label: 'Apple' }];
</script>

{#snippet loadingIcon()}
  <i data-testid="svelte-loading-icon">spinner</i>
{/snippet}

{#snippet loadingContent()}
  <strong data-testid="svelte-loading-content">Loading more</strong>
{/snippet}

<button type="button" on:click={() => (showSlots = !showSlots)}>Toggle loading slots</button>
<Select
  {items}
  loadingIcon={showSlots ? loadingIcon : undefined}
  loadingContent={showSlots ? loadingContent : undefined}
/>
