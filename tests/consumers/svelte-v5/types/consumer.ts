import type { SelectItem, SelectProps } from '@smilodon/svelte';
import type { Snippet } from 'svelte';

declare const loadingSnippet: Snippet;

const items: SelectItem[] = [
  { value: 'alpha', label: 'Alpha' },
  { value: 'beta', label: 'Beta', disabled: true },
];

const props: SelectProps = {
  items,
  searchable: true,
  value: 'alpha',
  loadingIcon: loadingSnippet,
  loadingContent: loadingSnippet,
};

void props;
