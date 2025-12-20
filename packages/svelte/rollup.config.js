import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import svelte from 'rollup-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';

export default [
  // ESM build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'esm',
      sourcemap: true,
    },
    external: ['svelte', 'svelte/internal', '@native-select/core'],
    plugins: [
      svelte({
        preprocess: sveltePreprocess(),
        emitCss: false,
      }),
      resolve({
        extensions: ['.svelte', '.ts', '.js'],
      }),
    ],
  },
  // ESM minified
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.min.js',
      format: 'esm',
      sourcemap: true,
    },
    external: ['svelte', 'svelte/internal', '@native-select/core'],
    plugins: [
      svelte({
        preprocess: sveltePreprocess(),
        emitCss: false,
      }),
      resolve({
        extensions: ['.svelte', '.ts', '.js'],
      }),
      terser(),
    ],
  },
];
