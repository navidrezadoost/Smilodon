/**
 * @smilodon/react
 * 
 * React adapter for Smilodon Select Component
 * 
 * A production-ready, accessible select component for React applications.
 * 
 * @example
 * ```tsx
 * import { Select } from '@smilodon/react';
 * 
 * function MyComponent() {
 *   const [value, setValue] = useState('');
 *   
 *   return (
 *     <Select
 *       items={[
 *         { value: '1', label: 'Option 1' },
 *         { value: '2', label: 'Option 2' },
 *       ]}
 *       value={value}
 *       onChange={(newValue) => setValue(newValue as string)}
 *       searchable
 *       placeholder="Select an option..."
 *     />
 *   );
 * }
 * ```
 * 
 * @packageDocumentation
 */

export { Select } from './Select';
export type { SelectProps, SelectItem, SelectHandle } from './Select';

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
