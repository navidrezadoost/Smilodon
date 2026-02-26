/**
 * @smilodon/vue
 * 
 * Vue 3 adapter for Smilodon Select Component
 * 
 * A production-ready, accessible select component for Vue 3 applications.
 * 
 * @example
 * ```vue
 * <script setup>
 * import { ref } from 'vue';
 * import { Select } from '@smilodon/vue';
 * 
 * const selectedValue = ref('');
 * const items = [
 *   { value: '1', label: 'Option 1' },
 *   { value: '2', label: 'Option 2' },
 * ];
 * </script>
 * 
 * <template>
 *   <Select
 *     :items="items"
 *     v-model="selectedValue"
 *     searchable
 *     placeholder="Select an option..."
 *   />
 * </template>
 * ```
 * 
 * @packageDocumentation
 */

import Select from './Select.vue';

// Re-export useful types from core
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

export { Select };
export default Select;
