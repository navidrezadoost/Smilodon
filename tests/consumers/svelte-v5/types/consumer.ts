import type { SelectItem, SelectProps } from '@smilodon/svelte';

const items: SelectItem[] = [
  { value: 'alpha', label: 'Alpha' },
  { value: 'beta', label: 'Beta', disabled: true },
];

const props: SelectProps = {
  items,
  searchable: true,
  value: 'alpha',
};

void props;
