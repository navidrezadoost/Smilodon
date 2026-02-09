import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';
import { NativeSelect, useNativeSelect } from '../src/index';

describe('NativeSelect React Integration', () => {
  const testItems = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    label: `Item ${i}`,
  }));

  beforeAll(async () => {
    // Ensure custom element is registered
    if (!customElements.get('smilodon-select')) {
      const module = await import('@smilodon/core');
      customElements.define('smilodon-select', module.NativeSelectElement);
    }
  });

  it('should render native-select element', () => {
    const { container } = render(<NativeSelect items={testItems} />);
    const element = container.querySelector('smilodon-select');
    expect(element).toBeTruthy();
  });

  it('should sync items prop to element', async () => {
    const { container } = render(<NativeSelect items={testItems} />);
    const element = container.querySelector('smilodon-select') as any;
    
    await waitFor(() => {
      expect(element?.items).toBeDefined();
      expect(element?.items.length).toBe(100);
    });
  });

  it('should handle multi prop', async () => {
    const { container } = render(<NativeSelect items={testItems} multi={true} />);
    const element = container.querySelector('smilodon-select') as any;
    
    await waitFor(() => {
      expect(element?.multi).toBe(true);
    });
  });

  it('should emit select events', async () => {
    let selectedData: any;
    const handleSelect = (data: any) => {
      selectedData = data;
    };

    const { container } = render(
      <NativeSelect items={testItems} onSelect={handleSelect} />
    );
    const element = container.querySelector('smilodon-select') as any;

    await waitFor(() => expect(element?.items).toBeDefined());

    // Simulate selection
    const event = new CustomEvent('select', {
      detail: { indices: [0], items: [testItems[0]] },
    });
    element.dispatchEvent(event);

    await waitFor(() => {
      expect(selectedData).toBeDefined();
      expect(selectedData.indices).toEqual([0]);
    });
  });

  it('useNativeSelect hook should work', async () => {
    const TestComponent = () => {
      const { ref, selectedIndices, selectedItems } = useNativeSelect({
        items: testItems,
        multi: true,
      });

      return (
        <div>
          <native-select ref={ref as any} />
          <div data-testid="selected-count">{selectedIndices.length}</div>
        </div>
      );
    };

    const { container } = render(<TestComponent />);
    const element = container.querySelector('smilodon-select');
    
    expect(element).toBeTruthy();
  });

  it('should expose imperative handle methods', async () => {
    const ref = React.createRef<any>();
    render(<NativeSelect ref={ref} items={testItems} />);

    await waitFor(() => {
      expect(ref.current).toBeDefined();
      expect(typeof ref.current?.focus).toBe('function');
      expect(typeof ref.current?.open).toBe('function');
      expect(typeof ref.current?.close).toBe('function');
    });
  });

  it('should update when items prop changes', async () => {
    const { container, rerender } = render(<NativeSelect items={testItems} />);
    const element = container.querySelector('smilodon-select') as any;

    await waitFor(() => {
      expect(element?.items.length).toBe(100);
    });

    const newItems = testItems.slice(0, 50);
    rerender(<NativeSelect items={newItems} />);

    await waitFor(() => {
      expect(element?.items.length).toBe(50);
    });
  });
});
