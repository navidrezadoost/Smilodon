import React, { useState } from 'react';
import { Select } from '@smilodon/react';
import type { SelectItem } from '@smilodon/react';

/**
 * Basic Example
 * 
 * Demonstrates simple usage of the Smilodon Select component
 */
export function BasicExample() {
  const [value, setValue] = useState<string>('');

  const items: SelectItem[] = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
    { value: 'date', label: 'Date' },
    { value: 'elderberry', label: 'Elderberry' },
  ];

  return (
    <div>
      <h2>Basic Select Example</h2>
      <Select
        items={items}
        value={value}
        onChange={(newValue) => setValue(newValue as string)}
        placeholder="Select a fruit..."
        searchable
      />
      <p>Selected value: {value || 'None'}</p>
    </div>
  );
}

/**
 * Multi-Select Example
 * 
 * Demonstrates multi-select mode
 */
export function MultiSelectExample() {
  const [values, setValues] = useState<(string | number)[]>([]);

  const items: SelectItem[] = [
    { value: '1', label: 'Red' },
    { value: '2', label: 'Green' },
    { value: '3', label: 'Blue' },
    { value: '4', label: 'Yellow' },
    { value: '5', label: 'Purple' },
  ];

  return (
    <div>
      <h2>Multi-Select Example</h2>
      <Select
        items={items}
        value={values}
        onChange={(newValues) => setValues(newValues as (string | number)[])}
        placeholder="Select colors..."
        multiple
        searchable
      />
      <p>Selected: {values.join(', ') || 'None'}</p>
    </div>
  );
}

/**
 * Uncontrolled Example
 * 
 * Demonstrates uncontrolled mode with default value
 */
export function UncontrolledExample() {
  const items: SelectItem[] = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'xlarge', label: 'Extra Large' },
  ];

  return (
    <div>
      <h2>Uncontrolled Select Example</h2>
      <Select
        items={items}
        defaultValue="medium"
        onChange={(value, selectedItems) => {
          console.log('Changed to:', value, selectedItems);
        }}
        placeholder="Select a size..."
      />
    </div>
  );
}
