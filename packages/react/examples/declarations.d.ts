import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'enhanced-select': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        class?: string;
        placeholder?: string;
        ref?: React.RefObject<any>;
        // Add other props used in examples
      };
    }
  }
}
