import type { SelectConfigUpdate } from '@smilodon/core';

export const fixtureItems = [
  { value: '1', label: 'Apple' },
  { value: '2', label: 'Banana' },
  { value: '3', label: 'Cherry' },
  { value: '4', label: 'Date' },
  { value: '5', label: 'Elderberry' },
];

export const initialConfig: SelectConfigUpdate = {
  selectedOptions: { placement: 'selected-first' as const },
  scrollToSelected: {
    enabled: false,
    multiSelectTarget: 'last' as const,
    onOpen: 'preserve' as const,
    behavior: 'auto' as const,
    block: 'center' as const,
  },
};

export const partialConfig: SelectConfigUpdate = {
  selectedOptions: { placement: 'original' as const },
  scrollToSelected: { onOpen: 'align' as const },
};
