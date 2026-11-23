import type { SelectProps as ReactProps } from '@smilodon/react';
import type { SelectProps as VueProps } from '@smilodon/vue';
import type { SelectProps as SvelteProps } from '@smilodon/svelte';
import type { SelectProps as SolidProps } from '@smilodon/solid';
import type { SelectProps as ReactNativeProps } from '@smilodon/react-native';
import { createSelect } from '@smilodon/vanilla';

const partialCoreSettings = {
  selectedOptions: { placement: 'selected-first' },
  scrollToSelected: { onOpen: 'align' },
} as const;

const reactConfig: NonNullable<ReactProps['config']> = partialCoreSettings;
const vueConfig: NonNullable<VueProps['config']> = partialCoreSettings;
const svelteConfig: NonNullable<SvelteProps['config']> = partialCoreSettings;
const solidConfig: NonNullable<SolidProps['config']> = partialCoreSettings;
const nativeConfig: NonNullable<ReactNativeProps['config']> = partialCoreSettings;
const vanillaConfig: NonNullable<Parameters<typeof createSelect>[0]['config']> = partialCoreSettings;

void [reactConfig, vueConfig, svelteConfig, solidConfig, nativeConfig, vanillaConfig];
