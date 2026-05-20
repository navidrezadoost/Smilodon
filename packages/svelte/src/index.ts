/**
 * @smilodon/svelte - Svelte wrapper for Smilodon Select
 * 
 * A production-ready, accessible select component for Svelte applications.
 * 
 * @packageDocumentation
 */

import '@smilodon/core'; // Ensure the custom element is defined

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
  ErrorEventDetail,
  GroupedItem,
  DiagnosticEventDetail,
  LimitationPolicyMap,
  TrackingSnapshot,
  SelectCapabilitiesReport,
  LimitationState,
  GlobalSelectConfig,
  SelectionConfig,
  MultiSelectDisplayConfig,
  ScrollToSelectedConfig,
  StyleConfig,
  ClearControlConfig,
  ExpandableConfig,
  InfiniteScrollConfig,
  LoadMoreConfig,
  BusyBucketConfig,
  ServerSideConfig,
  TrackingConfig,
  LimitationsConfig,
} from '@smilodon/core';

export { configureSelect, resetSelectConfig, selectConfig } from '@smilodon/core';

// Export component-specific types
export type { SelectItem, SelectProps, SelectEvents } from './Select.svelte.d.ts';
