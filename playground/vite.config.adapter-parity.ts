import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  root: '.',
  plugins: [svelte({ compilerOptions: { compatibility: { componentApi: 4 } } })],
  server: { port: 5178, strictPort: true },
});
