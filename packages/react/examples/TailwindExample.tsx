import React, { useEffect, useRef } from 'react';
import '@smilodon/core'; // Ensure the custom element is defined

// Type definition for the ref
interface EnhancedSelectElement extends HTMLElement {
  value: any;
  options: any[];
  classMap?: Record<string, string>;
}

export const TailwindSelect = () => {
  const selectRef = useRef<EnhancedSelectElement>(null);

  useEffect(() => {
    if (selectRef.current) {
      // 1. Set options
      selectRef.current.options = [
        { value: 'react', label: 'React' },
        { value: 'vue', label: 'Vue' },
        { value: 'svelte', label: 'Svelte' },
        { value: 'angular', label: 'Angular', disabled: true },
      ];

      // 2. Set classMap for Tailwind integration
      selectRef.current.classMap = {
        selected: 'bg-blue-600 text-white font-medium ring-2 ring-blue-300',
        active: 'bg-blue-50 text-blue-900',
        disabled: 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400'
      };

      // 3. Listen to events
      const handleChange = (e: Event) => {
        console.log('Selected:', (e.target as EnhancedSelectElement).value);
      };
      
      selectRef.current.addEventListener('change', handleChange);
      return () => {
        selectRef.current?.removeEventListener('change', handleChange);
      };
    }
  }, []);

  return (
    <div className="p-8 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Framework Selection</h2>
      
      {/* 
        Using ::part with Tailwind is tricky directly on the element 
        unless using @apply in CSS or an external stylesheet.
        
        Here we use arbitrary values or a wrapper for layout.
      */}
      <style>{`
        enhanced-select::part(button) {
          @apply border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 py-2;
        }
        /* Fallback if @apply is not available (e.g. without postcss setup here) */
        enhanced-select::part(button) {
          border: 1px solid #d1d5db;
          border-radius: 0.5rem; /* rounded-lg */
          padding: 0.5rem 0.75rem;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        enhanced-select::part(listbox) {
           border: 1px solid #e5e7eb;
           border-radius: 0.5rem;
           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
      `}</style>

      <enhanced-select 
        ref={selectRef}
        placeholder="Choose a framework..."
      ></enhanced-select>
      
      <p className="mt-4 text-sm text-gray-500">
        Using <strong>classMap</strong> to style options with Tailwind classes.
      </p>
    </div>
  );
};
