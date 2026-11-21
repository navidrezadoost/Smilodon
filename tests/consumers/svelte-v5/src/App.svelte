<script>
  import { Select } from '@smilodon/svelte';

  const items = [
    { value: 'alpha', label: 'Alpha' },
    { value: 'beta', label: 'Beta' },
  ];
  let value = 'alpha';
</script>

{#snippet loadingIcon()}
  <span aria-hidden="true">⌛</span>
{/snippet}

{#snippet loadingContent()}
  <span>Loading another page…</span>
{/snippet}

<main>
  <Select {items} bind:value searchable {loadingIcon} {loadingContent} />
  <output>{value}</output>
</main>
