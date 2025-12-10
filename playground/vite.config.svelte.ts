import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    port: 5175,
    strictPort: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  build: {
    outDir: 'dist/svelte',
    rollupOptions: {
      input: './svelte-demo.html'
    }
  }
});
