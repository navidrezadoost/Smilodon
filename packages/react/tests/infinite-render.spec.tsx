import React, { useState, useEffect } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Select } from '../src/index';
import type { SelectItem } from '../src/index';

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

  it('should not loop in controlled multi-select when value array reference changes', async () => {
    const renderSpy = vi.fn();

    const TestComponent = () => {
      const [selected, setSelected] = useState<Array<string | number>>(['1']);
      renderSpy();

      return (
        <Select
          multiple
          items={[{ value: '1', label: 'Item 1' }, { value: '2', label: 'Item 2' }]}
          value={[...selected]}
          onChange={(nextValue) => {
            const values = Array.isArray(nextValue) ? nextValue : [nextValue];
            setSelected([...values]);
          }}
        />
      );
    };

    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(<TestComponent />));
      await Promise.resolve();
    });
    const element = container.querySelector('enhanced-select') as HTMLElement;

    await waitFor(() => {
      expect(element).toBeTruthy();
    });

    await new Promise(r => setTimeout(r, 100));
    expect(renderSpy.mock.calls.length).toBeLessThan(20);
  });

  it('should not loop in controlled single-select with inline customRenderer', async () => {
    const renderSpy = vi.fn();

    interface LanguageItem extends SelectItem {
      value: string;
      label: string;
      icon: string;
      description: string;
      [key: string]: unknown;
    }

    const languages: LanguageItem[] = [
      { value: 'js', label: 'JavaScript', icon: '🟨', description: 'Dynamic scripting language' },
      { value: 'py', label: 'Python', icon: '🐍', description: 'General-purpose programming' },
      { value: 'rs', label: 'Rust', icon: '🦀', description: 'Systems programming language' },
    ];

    const TestComponent = () => {
      const [lang, setLang] = useState('');
      renderSpy();

      return (
        <Select
          items={languages}
          value={lang}
          onChange={(val) => setLang(val as string)}
          customRenderer={(item) => {
            const language = item as LanguageItem;
            return (
              <div>
                <span>{language.icon}</span>
                <span>{language.label}</span>
                <span>{language.description}</span>
              </div>
            );
          }}
          placeholder="Select a language..."
        />
      );
    };

    const { container } = render(<TestComponent />);
    const element = container.querySelector('enhanced-select') as HTMLElement;

    await waitFor(() => {
      expect(element).toBeTruthy();
    });

    await act(async () => {
      element.dispatchEvent(new CustomEvent('change', {
        detail: {
          selectedItems: [languages[1]],
          selectedValues: ['py'],
        },
      }));
      await Promise.resolve();
    });

    await new Promise(r => setTimeout(r, 100));
    expect(renderSpy.mock.calls.length).toBeLessThan(20);
  });

  it('should apply uncontrolled defaultValue without re-sync loop on parent re-renders', async () => {
    const renderSpy = vi.fn();

    const TestComponent = () => {
      const [tick, setTick] = useState(0);

      useEffect(() => {
        if (tick < 5) {
          setTick((current) => current + 1);
        }
      }, [tick]);

      renderSpy();

      return (
        <Select
          items={[{ value: 'js', label: 'JavaScript' }, { value: 'py', label: 'Python' }]}
          defaultValue="py"
        />
      );
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(renderSpy).toHaveBeenCalled();
    });

    await new Promise(r => setTimeout(r, 100));
    expect(renderSpy.mock.calls.length).toBeLessThan(20);
  });
});
