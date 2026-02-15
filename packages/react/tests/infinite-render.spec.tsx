import React, { useState, useEffect } from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Select } from '../src/index';

describe('Infinite Loop Protection', () => {
  it('should not cause infinite re-renders with inline optionRenderer', async () => {
    const renderSpy = vi.fn();
    
    // A component that forces re-renders
    const TestComponent = () => {
      const [count, setCount] = useState(0);
      
      useEffect(() => {
        // Force a re-render after mount
        if (count < 5) {
          setCount(c => c + 1);
        }
      }, [count]);

      renderSpy();

      // Inline optionRenderer (new function reference every render)
      return (
        <Select
          items={[{ value: '1', label: 'Item 1' }]}
          optionRenderer={(item: any) => {
            const div = document.createElement('div');
            div.textContent = item.label;
            return div;
          }}
        />
      );
    };

    render(<TestComponent />);

    // If there were an infinite loop, this would timeout or spy call count would be huge
    await waitFor(() => {
      // It should settle
      expect(renderSpy).toHaveBeenCalled();
    });
    
    // We expect a finite number of renders (initial + 5 updates = 6)
    // If infinite loop, this would keep increasing
    // We wait a bit to ensure stability
    await new Promise(r => setTimeout(r, 100));
    
    expect(renderSpy.mock.calls.length).toBeLessThan(20);
  });
});
