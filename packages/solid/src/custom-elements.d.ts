import type { JSX } from 'solid-js'

declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      'enhanced-select': JSX.HTMLAttributes<HTMLElement>
    }
  }
}

export {}
