import type * as React from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'enhanced-select': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          class?: string;
          placeholder?: string;
          value?: any;
          items?: any[];
        },
        HTMLElement
      >;
    }
  }
}
