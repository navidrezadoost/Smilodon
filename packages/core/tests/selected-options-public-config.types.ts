import { configureSelect, type SelectInstanceConfig } from '../src/index.js';

const instanceUpdate: SelectInstanceConfig = {
  selectedOptions: { placement: 'selected-first' },
  scrollToSelected: { onOpen: 'align', multiSelectTarget: 'last' },
};

configureSelect({
  selectedOptions: { placement: 'original' },
  scrollToSelected: { onOpen: 'preserve' },
});

void instanceUpdate;

// @ts-expect-error Unsupported placement must remain a type error.
const invalidPlacement: SelectInstanceConfig = { selectedOptions: { placement: 'selection-time' } };
// @ts-expect-error Unsupported open policy must remain a type error.
const invalidOpenPolicy: SelectInstanceConfig = { scrollToSelected: { onOpen: 'jump' } };

void invalidPlacement;
void invalidOpenPolicy;
