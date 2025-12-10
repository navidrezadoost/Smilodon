/**
 * Common test data and fixtures used across all framework contract tests
 */

export interface SelectItem {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface GroupedItem {
  group: string;
  items: SelectItem[];
}

/**
 * Basic items for testing
 */
export const basicItems: SelectItem[] = [
  { value: '1', label: 'Apple' },
  { value: '2', label: 'Banana' },
  { value: '3', label: 'Cherry' },
  { value: '4', label: 'Date' },
  { value: '5', label: 'Elderberry' },
];

/**
 * Items with disabled states
 */
export const itemsWithDisabled: SelectItem[] = [
  { value: '1', label: 'Apple' },
  { value: '2', label: 'Banana', disabled: true },
  { value: '3', label: 'Cherry' },
  { value: '4', label: 'Date', disabled: true },
  { value: '5', label: 'Elderberry' },
];

/**
 * Grouped items for testing
 */
export const groupedItems: GroupedItem[] = [
  {
    group: 'Fruits',
    items: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'cherry', label: 'Cherry' },
    ],
  },
  {
    group: 'Vegetables',
    items: [
      { value: 'carrot', label: 'Carrot' },
      { value: 'potato', label: 'Potato' },
      { value: 'tomato', label: 'Tomato' },
    ],
  },
];

/**
 * Large dataset for performance testing
 */
export const largeDataset: SelectItem[] = Array.from({ length: 10000 }, (_, i) => ({
  value: i + 1,
  label: `Item ${i + 1}`,
}));

/**
 * Items for search testing
 */
export const searchableItems: SelectItem[] = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'jp', label: 'Japan' },
  { value: 'cn', label: 'China' },
  { value: 'in', label: 'India' },
  { value: 'br', label: 'Brazil' },
];

/**
 * Expected behavior constants
 */
export const expectedBehavior = {
  // Timing
  renderTimeout: 3000,
  interactionDelay: 100,
  debounceDelay: 300,
  
  // Accessibility
  minTouchTargetSize: 44, // pixels (WCAG 2.5.5)
  minContrastRatio: 7, // WCAG AAA
  
  // Performance
  maxRenderTime: 100, // ms
  maxSearchDelay: 50, // ms
  minFPS: 55, // frames per second for virtual scroll
  
  // Default values
  defaultPlaceholder: 'Select an option...',
  defaultPageSize: 50,
};

/**
 * Common test scenarios
 */
export const testScenarios = {
  basicSelection: {
    name: 'Basic Selection',
    items: basicItems,
    actions: [
      { type: 'click', target: 'dropdown' },
      { type: 'click', target: 'option', value: '2' },
    ],
    expected: {
      value: '2',
      label: 'Banana',
    },
  },
  
  multiSelect: {
    name: 'Multi-Select',
    items: basicItems,
    props: { multiple: true },
    actions: [
      { type: 'click', target: 'dropdown' },
      { type: 'click', target: 'option', value: '1' },
      { type: 'click', target: 'option', value: '3' },
      { type: 'click', target: 'option', value: '5' },
    ],
    expected: {
      values: ['1', '3', '5'],
      count: 3,
    },
  },
  
  searchFilter: {
    name: 'Search Filter',
    items: searchableItems,
    props: { searchable: true },
    actions: [
      { type: 'click', target: 'dropdown' },
      { type: 'type', target: 'search', value: 'united' },
    ],
    expected: {
      filteredCount: 2, // United States, United Kingdom
      visibleLabels: ['United States', 'United Kingdom'],
    },
  },
  
  keyboardNavigation: {
    name: 'Keyboard Navigation',
    items: basicItems,
    actions: [
      { type: 'focus', target: 'select' },
      { type: 'keydown', key: 'Enter' }, // Open
      { type: 'keydown', key: 'ArrowDown' }, // Navigate to first
      { type: 'keydown', key: 'ArrowDown' }, // Navigate to second
      { type: 'keydown', key: 'Enter' }, // Select
    ],
    expected: {
      value: '2',
      label: 'Banana',
    },
  },
  
  disabledState: {
    name: 'Disabled State',
    items: basicItems,
    props: { disabled: true },
    actions: [
      { type: 'click', target: 'dropdown' },
    ],
    expected: {
      dropdownOpen: false,
      clickable: false,
    },
  },
  
  errorState: {
    name: 'Error State',
    items: basicItems,
    props: { error: true, required: true },
    expected: {
      hasErrorAttribute: true,
      hasRequiredAttribute: true,
      ariaInvalid: 'true',
    },
  },
};

/**
 * Performance benchmarks
 */
export const performanceBenchmarks = {
  initialRender: {
    items: 100,
    maxTime: 50, // ms
  },
  virtualScroll: {
    items: 10000,
    minFPS: 55,
    scrollDistance: 1000, // pixels
  },
  search: {
    items: 1000,
    maxDelay: 16, // ms (60fps)
    query: 'test',
  },
};

/**
 * Accessibility requirements
 */
export const a11yRequirements = {
  roles: {
    select: 'combobox',
    dropdown: 'listbox',
    option: 'option',
  },
  attributes: {
    ariaExpanded: ['true', 'false'],
    ariaHasPopup: 'listbox',
    ariaLabel: /.+/, // Must have some label
    ariaLabelledBy: /.+/, // Or be labelled by something
  },
  keyboardSupport: {
    open: ['Enter', 'Space', 'ArrowDown', 'ArrowUp'],
    close: ['Escape'],
    navigate: ['ArrowDown', 'ArrowUp', 'Home', 'End'],
    select: ['Enter'],
  },
};
