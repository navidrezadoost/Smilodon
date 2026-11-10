import type { SelectEventDetail, SelectionConfig } from '@smilodon/core';

const event: SelectEventDetail = {
  item: 'alpha',
  index: 0,
  value: 'alpha',
  label: 'Alpha',
  selected: true,
};

const selection: SelectionConfig = { mode: 'single' };
void [event, selection];
