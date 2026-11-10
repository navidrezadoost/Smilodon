<script>
  import { Select } from '@smilodon/svelte';

  const items = [
    { value: 'alpha', label: 'Alpha' },
    { value: 'beta', label: 'Beta' },
  ];
  let value = 'alpha';
</script>

<main>
  <Select {items} bind:value searchable />
  <output>{value}</output>
</main>
