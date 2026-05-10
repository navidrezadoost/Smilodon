import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.tsx'),
      name: 'SmilodonReact',
      formats: ['es', 'cjs'],
      fileName: (format) => format === 'es' ? 'index.js' : 'index.cjs',
    },
    rollupOptions: {
      external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', '@smilodon/core'],
      output: {
        banner: '"use client";',
        globals: {
          react: 'React',
        },
        exports: 'named',
      },
    },
    sourcemap: true,
    minify: false,
  },
  resolve: {
    alias: {
      '@smilodon/core': resolve(__dirname, '../core/src/index.ts'),
    },
  },
});
