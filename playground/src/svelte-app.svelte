<script>
  import { SmilodonSelect } from '@smilodon/svelte';

  const fruits = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
    { value: 'orange', label: 'Orange' },
    { value: 'grape', label: 'Grape' }
  ];

  let selected = '';
</script>

<div>
  <SmilodonSelect
    options={fruits}
    bind:value={selected}
    placeholder="Select a fruit"
  />
  {#if selected}
    <p>Selected: {selected}</p>
  {/if}
</div>
