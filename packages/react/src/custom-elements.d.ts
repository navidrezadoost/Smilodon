import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'enhanced-select': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        class?: string;
        placeholder?: string;
        value?: any;
        items?: any[];
        // Add other props as needed for direct usage in JSX
      };
    }
  }
}
