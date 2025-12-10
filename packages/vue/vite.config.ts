import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SmilodonVue',
      formats: ['es', 'cjs'],
      fileName: (format) => format === 'es' ? 'index.js' : 'index.cjs',
    },
    rollupOptions: {
      external: ['vue', '@smilodon/core'],
      output: {
        globals: {
          vue: 'Vue',
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
