/**
 * @smilodon/angular - Angular wrapper for Smilodon Select
 * 
 * A production-ready, accessible select component for Angular applications.
 * 
 * @packageDocumentation
 */

// Import core to register the web component
import '@smilodon/core';

export { SelectComponent } from './select.component';
export { SmilodonSelectModule } from './select.module';

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
export type { SelectItem } from './select.component';
