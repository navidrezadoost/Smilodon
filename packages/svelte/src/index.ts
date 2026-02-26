/**
 * @smilodon/svelte - Svelte wrapper for Smilodon Select
 * 
 * A production-ready, accessible select component for Svelte applications.
 * 
 * @packageDocumentation
 */

// @ts-ignore - Svelte component import
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
  DiagnosticEventDetail,
  LimitationPolicyMap,
  TrackingSnapshot,
  SelectCapabilitiesReport,
  LimitationState,
} from '@smilodon/core';

// Export component-specific types
export type { SelectItem, SelectProps, SelectEvents } from './Select.svelte.d.ts';
