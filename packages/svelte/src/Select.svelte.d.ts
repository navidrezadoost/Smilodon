import { SvelteComponentTyped } from 'svelte';
import type {
  SelectEventDetail,
  OpenEventDetail,
  CloseEventDetail,
  SearchEventDetail,
  ChangeEventDetail,
  LoadMoreEventDetail,
  GroupedItem,
  DiagnosticEventDetail,
  LimitationPolicyMap,
  LimitationState,
  TrackingSnapshot,
  SelectCapabilitiesReport,
} from '@smilodon/core';

export interface SelectItem {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
  [key: string]: any;
}

export interface SelectProps {
  items?: SelectItem[];
  groupedItems?: GroupedItem[];
  value?: string | number | (string | number)[];
  defaultValue?: string | number | (string | number)[];
  multiple?: boolean;
  searchable?: boolean;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  infiniteScroll?: boolean;
  pageSize?: number;
  virtualized?: boolean;
  maxSelections?: number;
  placement?: 'bottom' | 'top' | 'auto';
  className?: string;
  style?: string;
  trackingEnabled?: boolean;
  trackEvents?: boolean;
  trackStyling?: boolean;
  trackLimitations?: boolean;
  emitDiagnostics?: boolean;
  trackingMaxEntries?: number;
  limitationPolicies?: LimitationPolicyMap;
  autoMitigateRuntimeModeSwitch?: boolean;
}

export interface SelectEvents {
  change: CustomEvent<{ value: string | number | (string | number)[]; selectedItems: SelectItem[] }>;
  select: CustomEvent<{ item: SelectItem; index: number }>;
  open: CustomEvent<void>;
  close: CustomEvent<void>;
  search: CustomEvent<{ query: string }>;
  loadMore: CustomEvent<{ page: number }>;
  create: CustomEvent<{ value: string }>;
  clear: CustomEvent<{ clearedSelection: boolean; clearedSearch: boolean }>;
  diagnostic: CustomEvent<DiagnosticEventDetail>;
}

export interface SelectSlots {}

export default class Select extends SvelteComponentTyped<SelectProps, SelectEvents, SelectSlots> {
  open(): void;
  close(): void;
  focus(): void;
  setItems(items: SelectItem[]): void;
  setGroupedItems(groups: GroupedItem[]): void;
  clear(): void;
  getCapabilities(): SelectCapabilitiesReport | undefined;
  getKnownLimitations(): LimitationState[];
  getTrackingSnapshot(): TrackingSnapshot;
  clearTracking(source?: 'event' | 'style' | 'limitation' | 'all'): void;
  setLimitationPolicies(policies: LimitationPolicyMap): void;
}
