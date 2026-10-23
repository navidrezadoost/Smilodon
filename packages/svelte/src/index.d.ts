/**
 * @smilodon/svelte - Svelte wrapper for Smilodon Select
 * 
 * Select component for Svelte applications; accessibility certification is pending.
 * 
 * @packageDocumentation
 */

export { default as Select } from './Select.svelte';

// Re-export types from core
export type {
  SelectEventDetail,
  OpenEventDetail,
  CloseEventDetail,
  SearchEventDetail,
  ChangeEventDetail,
  LoadMoreEventDetail,
  GroupedItem,
} from '@smilodon/core';

// Export component-specific types
export type { SelectItem, SelectProps, SelectEvents } from './Select.svelte.d.ts';
