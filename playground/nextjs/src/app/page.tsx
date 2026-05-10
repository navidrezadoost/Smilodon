'use client';

import React, { useEffect, useRef, useState } from 'react';
import '@smilodon/react';

// Bypass React 19 / Next strict element typings for custom elements
const EnhancedSelectHtml = 'enhanced-select' as any;

// Common setup data
const INITIAL_CITIES = [
  { value: 'nyc', label: 'New York City' },
  { value: 'ldn', label: 'London' },
  { value: 'tok', label: 'Tokyo' },
  { value: 'ber', label: 'Berlin' },
  { value: 'par', label: 'Paris' },
  { value: 'syd', label: 'Sydney' }
];

export default function NextPlayground() {
  const singleRef = useRef<any>(null);
  const multiRef = useRef<any>(null);
  const customRef = useRef<any>(null);
  const stressRef = useRef<any>(null);

  const [singleValue, setSingleValue] = useState(['nyc']);
  const [multiValue, setMultiValue] = useState(['nyc', 'tok']);
  const [customValue, setCustomValue] = useState(['ldn']);
  const [stressValue, setStressValue] = useState(['city-3', 'city-24']);

  useEffect(() => {
    async function init() {
      const { EnhancedSelect } = await import('@smilodon/core');
      if (!customElements.get('enhanced-select')) {
        customElements.define('enhanced-select', EnhancedSelect);
      }
      
      await customElements.whenDefined('enhanced-select');

      if (singleRef.current) singleRef.current.setItems(INITIAL_CITIES);
      
      if (multiRef.current) multiRef.current.setItems(INITIAL_CITIES);
      
      if (customRef.current) {
        customRef.current.setItems(INITIAL_CITIES);
        customRef.current.optionRenderer = (item: any, index: number, helpers: any) => {
          const selectedValues = customRef.current.getSelectedValues ? customRef.current.getSelectedValues() : [];
          const isSelected = selectedValues.includes(item.value);
          const div = document.createElement('div');
          div.style.display = 'flex';
          div.style.alignItems = 'center';
          div.style.justifyContent = 'space-between';
          div.style.width = '100%';
          div.innerHTML = `
            <span>🌍 ${item.label}</span>
            ${isSelected ? '<span>✅</span>' : ''}
          `;
          return div;
        };
      }

      if (stressRef.current) {
        const items = Array.from({ length: 10000 }).map((_, i) => ({
          value: `city-${i}`,
          label: `City ${i}`
        }));
        stressRef.current.setItems(items);
      }
    }
    
    init();
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Smilodon Next.js Playground</h1>
      <p>Clean Monorepo Implementation using standard React components</p>

      <section style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>Single Select</h2>
        <EnhancedSelectHtml 
          ref={singleRef} 
          value={singleValue.join(',')}
          onchange={(e: any) => setSingleValue(e.detail?.selectedValues || [])}
        ></EnhancedSelectHtml>
        <div style={{ marginTop: '0.5rem', opacity: 0.7 }}>Selected: {singleValue.join(', ') || 'None'}</div>
      </section>

      <section style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>Multi Select</h2>
        <EnhancedSelectHtml 
          ref={multiRef} 
          multiple
          value={multiValue.join(',')}
          onchange={(e: any) => setMultiValue(e.detail?.selectedValues || [])}
        ></EnhancedSelectHtml>
        <div style={{ marginTop: '0.5rem', opacity: 0.7 }}>Selected: {multiValue.join(', ')}</div>
      </section>

      <section style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>Custom Renderer</h2>
        <EnhancedSelectHtml 
          ref={customRef} 
          value={customValue.join(',')}
          onchange={(e: any) => setCustomValue(e.detail?.selectedValues || [])}
        ></EnhancedSelectHtml>
        <div style={{ marginTop: '0.5rem', opacity: 0.7 }}>Selected: {customValue.join(', ')}</div>
      </section>

      <section style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>Stress Test (10,000 items)</h2>
        <EnhancedSelectHtml 
          ref={stressRef} 
          multiple
          value={stressValue.join(',')}
          onchange={(e: any) => setStressValue(e.detail?.selectedValues || [])}
        ></EnhancedSelectHtml>
        <div style={{ marginTop: '0.5rem', opacity: 0.7 }}>Selected: {stressValue.slice(0, 3).join(', ')}{stressValue.length > 3 ? '...' : ''}</div>
      </section>
    </div>
  );
}
