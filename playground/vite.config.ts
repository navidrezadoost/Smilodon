import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    port: 3000,
    open: true,
    headers: {
      // Enable SharedArrayBuffer for worker performance
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './index.html',
        sandbox: './sandbox.html',
        react: './react-demo.html',
        vue: './vue-demo.html',
        svelte: './svelte-demo.html',
        vanilla: './vanilla-demo.html'
      }
    }
  },
  optimizeDeps: {
    include: ['monaco-editor']
  },
  worker: {
    format: 'es'
  }
});
