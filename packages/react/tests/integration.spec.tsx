import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';
import { Select } from '../src/index';
import type { SelectItem } from '../src/index';

describe('Select React Integration', () => {
  const testItems: SelectItem[] = [
    { value: '1', label: 'Apple' },
    { value: '2', label: 'Banana' },
    { value: '3', label: 'Cherry' },
    { value: '4', label: 'Date' },
    { value: '5', label: 'Elderberry' },
  ];

  beforeAll(async () => {
    // Ensure custom element is registered
    if (!customElements.get('enhanced-select')) {
      const module = await import('@smilodon/core');
      customElements.define('enhanced-select', module.EnhancedSelect);
    }
  });

  it('should render enhanced-select element', () => {
    const { container } = render(<Select items={testItems} />);
    const element = container.querySelector('enhanced-select');
    expect(element).toBeTruthy();
  });

  it('should pass items prop to element', async () => {
    const { container } = render(<Select items={testItems} />);
    const element = container.querySelector('enhanced-select') as any;
    
    await waitFor(() => {
      expect(element?.items).toBeDefined();
      expect(element?.items.length).toBe(5);
    });
  });

  it('should handle controlled value', async () => {
    const { container, rerender } = render(
      <Select items={testItems} value="1" />
    );
    const element = container.querySelector('enhanced-select') as any;
    
    await waitFor(() => {
      expect(element?.value).toBe('1');
    });

    rerender(<Select items={testItems} value="2" />);

    await waitFor(() => {
      expect(element?.value).toBe('2');
    });
  });

  it('should handle onChange callback', async () => {
    let selectedValue: string | number | (string | number)[] | undefined;
    const handleChange = (value: string | number | (string | number)[]) => {
      selectedValue = value;
    };

    const { container } = render(
      <Select items={testItems} onChange={handleChange} />
    );
    const element = container.querySelector('enhanced-select') as any;

    await waitFor(() => expect(element?.items).toBeDefined());

    // Simulate selection by dispatching custom event
    const event = new CustomEvent('change', {
      detail: { value: '1', selectedItems: [testItems[0]] },
    });
    element.dispatchEvent(event);

    await waitFor(() => {
      expect(selectedValue).toBe('1');
    });
  });

  it('should handle multiple selection', async () => {
    const { container } = render(
      <Select items={testItems} multiple value={['1', '2']} />
    );
    const element = container.querySelector('enhanced-select') as any;
    
    await waitFor(() => {
      expect(element?.multiple).toBe(true);
      expect(element?.value).toEqual(['1', '2']);
    });
  });

  it('should handle searchable prop', async () => {
    const { container } = render(<Select items={testItems} searchable />);
    const element = container.querySelector('enhanced-select') as any;
    
    await waitFor(() => {
      expect(element?.searchable).toBe(true);
    });
  });

  it('should handle disabled prop', async () => {
    const { container } = render(<Select items={testItems} disabled />);
    const element = container.querySelector('enhanced-select') as any;
    
    await waitFor(() => {
      expect(element?.disabled).toBe(true);
    });
  });

  it('should handle placeholder prop', async () => {
    const placeholder = 'Select a fruit...';
    const { container } = render(
      <Select items={testItems} placeholder={placeholder} />
    );
    const element = container.querySelector('enhanced-select') as any;
    
    await waitFor(() => {
      expect(element?.placeholder).toBe(placeholder);
    });
  });

  it('should expose ref methods', async () => {
    const ref = React.createRef<any>();
    render(<Select ref={ref} items={testItems} />);

    await waitFor(() => {
      expect(ref.current).toBeDefined();
      expect(typeof ref.current?.focus).toBe('function');
      expect(typeof ref.current?.open).toBe('function');
      expect(typeof ref.current?.close).toBe('function');
      expect(typeof ref.current?.clear).toBe('function');
    });
  });

  it('should update when items prop changes', async () => {
    const { container, rerender } = render(<Select items={testItems} />);
    const element = container.querySelector('enhanced-select') as any;

    await waitFor(() => {
      expect(element?.items.length).toBe(5);
    });

    const newItems = testItems.slice(0, 3);
    rerender(<Select items={newItems} />);

    await waitFor(() => {
      expect(element?.items.length).toBe(3);
    });
  });

  it('should handle onSelect callback', async () => {
    let selectedItem: SelectItem | undefined;
    const handleSelect = (item: SelectItem, index: number) => {
      selectedItem = item;
    };

    const { container } = render(
      <Select items={testItems} onSelect={handleSelect} />
    );
    const element = container.querySelector('enhanced-select') as any;

    await waitFor(() => expect(element?.items).toBeDefined());

    // Simulate select event
    const event = new CustomEvent('select', {
      detail: { item: testItems[0], index: 0 },
    });
    element.dispatchEvent(event);

    await waitFor(() => {
      expect(selectedItem).toEqual(testItems[0]);
    });
  });

  it('should handle onOpen and onClose callbacks', async () => {
    let opened = false;
    let closed = false;

    const { container } = render(
      <Select
        items={testItems}
        onOpen={() => (opened = true)}
        onClose={() => (closed = true)}
      />
    );
    const element = container.querySelector('enhanced-select') as any;

    await waitFor(() => expect(element?.items).toBeDefined());

    // Simulate open event
    element.dispatchEvent(new Event('open'));
    await waitFor(() => expect(opened).toBe(true));

    // Simulate close event
    element.dispatchEvent(new Event('close'));
    await waitFor(() => expect(closed).toBe(true));
  });

  it('should handle custom className', () => {
    const { container } = render(
      <Select items={testItems} className="custom-select" />
    );
    const element = container.querySelector('enhanced-select');
    expect(element?.classList.contains('custom-select')).toBe(true);
  });

  it('should handle style prop', () => {
    const style = { width: '300px', border: '2px solid red' };
    const { container } = render(<Select items={testItems} style={style} />);
    const element = container.querySelector('enhanced-select') as HTMLElement;
    
    expect(element?.style.width).toBe('300px');
    expect(element?.style.border).toBe('2px solid red');
  });
});

