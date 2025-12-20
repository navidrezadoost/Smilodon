import { SvelteComponentTyped } from 'svelte';
import type { NativeSelectOptions } from '@native-select/core';

export interface NativeSelectProps {
  items?: unknown[];
  multi?: boolean;
  placement?: 'top' | 'bottom';
  estimatedItemHeight?: number;
  buffer?: number;
}

export interface NativeSelectEvents {
  select: CustomEvent<{ indices: number[]; items: unknown[] }>;
  open: CustomEvent<void>;
  close: CustomEvent<void>;
}

export interface NativeSelectSlots {}

export default class NativeSelect extends SvelteComponentTyped<
  NativeSelectProps,
  NativeSelectEvents,
  NativeSelectSlots
> {
  focus(): void;
  open(): void;
  close(): void;
  selectedIndices: number[];
  selectedItems: unknown[];
}
