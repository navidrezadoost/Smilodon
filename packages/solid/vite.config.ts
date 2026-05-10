import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [solid()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.tsx'),
      name: 'SmilodonSolid',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      external: ['solid-js', 'solid-js/web', '@smilodon/core'],
      output: {
        globals: {
          'solid-js': 'SolidJS',
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
})
