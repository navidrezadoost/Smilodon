<script lang="ts">
  import { Select } from '@smilodon/svelte';
  import { tick } from 'svelte';
  import type { SelectInstanceConfig } from '@smilodon/core';
  import { fixtureItems, initialConfig, partialConfig } from './selected-options-fixture-data';

  let config = $state(initialConfig);
  let value = $state('3');

  function applyPartialConfig() {
    config = partialConfig;
  }

  export async function setHarnessConfig(nextConfig: SelectInstanceConfig) {
    config = nextConfig;
    await tick();
  }

  export async function setHarnessValue(nextValue: string) {
    value = nextValue;
    await tick();
  }
</script>

<section data-framework="svelte">
  <button id="update-svelte" onclick={applyPartialConfig}>Update Svelte config</button>
  <button id="unmount-svelte">Unmount Svelte</button>
  <Select items={fixtureItems} bind:value {config} />
</section>
