import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default [
  // ESM build
  {
    input: 'src/index.tsx',
    output: {
      file: 'dist/index.js',
      format: 'esm',
      sourcemap: true,
    },
    external: ['react', '@native-select/core'],
    plugins: [
      resolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
      }),
    ],
  },
  // ESM minified
  {
    input: 'src/index.tsx',
    output: {
      file: 'dist/index.min.js',
      format: 'esm',
      sourcemap: true,
    },
    external: ['react', '@native-select/core'],
    plugins: [
      resolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
      }),
      terser(),
    ],
  },
  // CommonJS build
  {
    input: 'src/index.tsx',
    output: {
      file: 'dist/index.cjs',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    external: ['react', '@native-select/core'],
    plugins: [
      resolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
      }),
    ],
  },
];
