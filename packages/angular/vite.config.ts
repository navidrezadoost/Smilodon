import { defineConfig } from 'vite';
import { resolve } from 'path';

// Angular Wave 2 — S1 scaffold build configuration.
//
// S1 ships only the package foundation + public type surface. There is NO
// Angular component, directive, ControlValueAccessor, or event bridge yet
// (those arrive in S2+). As a result this build has NO `@angular/*` import and
// must not pull `@smilodon/core`'s runtime into the bundle.
//
// `@smilodon/core` is externalized (peer dependency, single runtime copy) and
// aliased to its source only for type/declaration resolution during build.
// Because S1's entry uses `export type` exclusively, the emitted runtime chunk
// contains NO require/import of `@smilodon/core` (verified in the S1 gate).
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SmilodonAngular',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      external: ['@angular/core', '@smilodon/core'],
      output: {
        globals: {
          '@angular/core': 'ng.core',
          '@smilodon/core': 'SmilodonCore',
        },
        exports: 'named',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
  },
  resolve: {
    alias: {
      '@smilodon/core': resolve(__dirname, '../core/src/index.ts'),
    },
  },
});
