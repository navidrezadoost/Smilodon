<script lang="ts">
  import { Select } from '@smilodon/svelte';
  import type { EmptyStateContext } from '@smilodon/core';

  let items: Array<{ value: string; label: string }> = [];
</script>

{#snippet emptyState(context: EmptyStateContext)}
  <span data-testid="svelte-empty-state">{context.reason}:{context.query}</span>
{/snippet}

<Select {items} {emptyState} />
