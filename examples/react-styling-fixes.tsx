import React from 'react';
import { Select } from '@smilodon/react';
import type { SelectItem } from '@smilodon/react';

const items: SelectItem[] = [
  { value: '1', label: 'Apple 🍎' },
  { value: '2', label: 'Banana 🍌' },
  { value: '3', label: 'Cherry 🍒' },
  { value: '4', label: 'Dragon Fruit 🐉' },
  { value: '5', label: 'Elderberry 🫐' },
  { value: '6', label: 'Fig 🌰' },
  { value: '7', label: 'Grape 🍇' },
  { value: '8', label: 'Honeydew 🍈' },
];

export function StylingFixesDemo() {
  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🎨 React - Styling Fixes Examples</h1>
      <p style={{ color: '#666', marginBottom: '40px' }}>
        All styling issues fixed: Arrow SVG, Separator, Dropdown Background, Option Borders
      </p>

      {/* Test 1: Arrow Size Control */}
      <section style={{ marginBottom: '40px' }}>
        <h2>1. Arrow SVG Size & Stroke Width Control</h2>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
          ✅ Fixed: Arrow now respects CSS variables
        </p>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
            Default Arrow (16px, stroke-width: 2)
          </label>
          <Select
            items={items}
            searchable
            placeholder="Select fruits..."
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
            Large Arrow (24px, stroke-width: 3)
          </label>
          <Select
            items={items}
            searchable
            placeholder="Select fruits..."
            style={{
              '--select-arrow-size': '24px',
              '--select-arrow-stroke-width': '3',
              '--select-arrow-color': '#10b981',
              '--select-arrow-hover-color': '#059669',
            } as React.CSSProperties}
          />
          <pre style={{
            background: '#f8f8f8',
            padding: '15px',
            borderRadius: '4px',
            fontSize: '13px',
            marginTop: '10px'
          }}>
{`style={{
  '--select-arrow-size': '24px',
  '--select-arrow-stroke-width': '3',
  '--select-arrow-color': '#10b981',
  '--select-arrow-hover-color': '#059669',
} as React.CSSProperties}`}
          </pre>
        </div>
      </section>

      {/* Test 2: Separator Control */}
      <section style={{ marginBottom: '40px' }}>
        <h2>2. Separator Line Customization</h2>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
          ✅ Fixed: Added --select-separator-bg for solid colors
        </p>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
            Custom Separator (3px, gradient)
          </label>
          <Select
            items={items}
            searchable
            placeholder="Select fruits..."
            style={{
              '--select-separator-width': '3px',
              '--select-separator-height': '80%',
              '--select-separator-bg': 'linear-gradient(to bottom, #667eea 0%, #764ba2 100%)',
              '--select-separator-position': '50px',
            } as React.CSSProperties}
          />
          <pre style={{
            background: '#f8f8f8',
            padding: '15px',
            borderRadius: '4px',
            fontSize: '13px',
            marginTop: '10px'
          }}>
{`style={{
  '--select-separator-width': '3px',
  '--select-separator-height': '80%',
  '--select-separator-bg': 'linear-gradient(...)',
  '--select-separator-position': '50px',
} as React.CSSProperties}`}
          </pre>
        </div>
      </section>

      {/* Test 3: Dropdown Background */}
      <section style={{ marginBottom: '40px' }}>
        <h2>3. Dropdown & Options Background</h2>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
          ✅ Working: Fully customizable backgrounds
        </p>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
            Custom Gray Background
          </label>
          <Select
            items={items}
            searchable
            placeholder="Select fruits..."
            style={{
              '--select-dropdown-bg': '#f9fafb',
              '--select-options-bg': '#f9fafb',
              '--select-option-bg': '#f9fafb',
              '--select-option-hover-bg': '#e5e7eb',
            } as React.CSSProperties}
          />
          <pre style={{
            background: '#f8f8f8',
            padding: '15px',
            borderRadius: '4px',
            fontSize: '13px',
            marginTop: '10px'
          }}>
{`style={{
  '--select-dropdown-bg': '#f9fafb',
  '--select-options-bg': '#f9fafb',
  '--select-option-bg': '#f9fafb',
  '--select-option-hover-bg': '#e5e7eb',
} as React.CSSProperties}`}
          </pre>
        </div>
      </section>

      {/* Test 4: Option Borders */}
      <section style={{ marginBottom: '40px' }}>
        <h2>4. Option Borders in Multi-Select</h2>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
          ✅ Fixed: Added --select-option-border
        </p>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
            Options with Borders
          </label>
          <Select
            items={items}
            searchable
            multiple
            placeholder="Select multiple fruits..."
            style={{
              '--select-option-border': '1px solid #e5e7eb',
              '--select-option-border-bottom': '1px solid #d1d5db',
              '--select-option-padding': '12px 16px',
            } as React.CSSProperties}
          />
          <pre style={{
            background: '#f8f8f8',
            padding: '15px',
            borderRadius: '4px',
            fontSize: '13px',
            marginTop: '10px'
          }}>
{`style={{
  '--select-option-border': '1px solid #e5e7eb',
  '--select-option-border-bottom': '1px solid #d1d5db',
  '--select-option-padding': '12px 16px',
} as React.CSSProperties}`}
          </pre>
        </div>
      </section>

      {/* Test 5: All Combined */}
      <section style={{ marginBottom: '40px' }}>
        <h2>5. All Fixes Combined - Purple Theme</h2>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
          Complete customization example
        </p>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
            Fully Customized Select
          </label>
          <Select
            items={items}
            searchable
            multiple
            placeholder="Select multiple fruits..."
            style={{
              // Arrow
              '--select-arrow-size': '20px',
              '--select-arrow-stroke-width': '2.5',
              '--select-arrow-color': '#8b5cf6',
              '--select-arrow-hover-bg': 'rgba(139, 92, 246, 0.1)',
              
              // Separator
              '--select-separator-width': '2px',
              '--select-separator-bg': '#8b5cf6',
              '--select-separator-height': '70%',
              
              // Dropdown & Options
              '--select-dropdown-bg': '#faf5ff',
              '--select-options-bg': '#faf5ff',
              '--select-option-bg': '#faf5ff',
              '--select-option-hover-bg': '#f3e8ff',
              '--select-option-selected-bg': '#e9d5ff',
              
              // Option Borders
              '--select-option-border': '1px solid #e9d5ff',
              '--select-option-padding': '14px 18px',
              
              // Input
              '--select-input-border': '2px solid #8b5cf6',
              '--select-input-border-radius': '8px',
            } as React.CSSProperties}
          />
          <pre style={{
            background: '#f8f8f8',
            padding: '15px',
            borderRadius: '4px',
            fontSize: '13px',
            marginTop: '10px'
          }}>
{`style={{
  // Arrow
  '--select-arrow-size': '20px',
  '--select-arrow-stroke-width': '2.5',
  '--select-arrow-color': '#8b5cf6',
  
  // Separator
  '--select-separator-width': '2px',
  '--select-separator-bg': '#8b5cf6',
  
  // Dropdown & Options
  '--select-dropdown-bg': '#faf5ff',
  '--select-option-bg': '#faf5ff',
  
  // Option Borders
  '--select-option-border': '1px solid #e9d5ff',
} as React.CSSProperties}`}
          </pre>
        </div>
      </section>

      {/* Test 6: Dark Theme */}
      <section style={{ marginBottom: '40px' }}>
        <h2>6. Dark Theme Example</h2>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
          Complete dark theme
        </p>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
            Dark Mode Select
          </label>
          <Select
            items={items}
            searchable
            multiple
            placeholder="Select fruits..."
            style={{
              // Arrow
              '--select-arrow-size': '18px',
              '--select-arrow-color': '#818cf8',
              '--select-arrow-stroke-width': '2',
              
              // Separator
              '--select-separator-bg': 'linear-gradient(to bottom, transparent, #4b5563, transparent)',
              
              // Dark backgrounds
              '--select-input-bg': '#1f2937',
              '--select-input-border': '1px solid #4b5563',
              '--select-input-color': '#f9fafb',
              
              '--select-dropdown-bg': '#1f2937',
              '--select-options-bg': '#1f2937',
              '--select-option-bg': '#1f2937',
              '--select-option-color': '#f9fafb',
              '--select-option-hover-bg': '#374151',
              '--select-option-selected-bg': '#4338ca',
              
              // Option styling
              '--select-option-border': 'none',
              '--select-option-border-bottom': '1px solid #374151',
            } as React.CSSProperties}
          />
        </div>
      </section>
    </div>
  );
}

export default StylingFixesDemo;
