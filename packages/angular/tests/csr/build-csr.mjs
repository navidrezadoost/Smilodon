/**
 * S5-Q — builds the CSR (client-side only) qualification fixture:
 *
 *   1. ngc (AOT full) the CSR program -> .aot-csr/  (csr-app, csr-main, publish-facade)
 *   2. esbuild-bundle the CSR program -> .aot-csr/csr-bundle.js
 *
 * The CSR program is compiled SEPARATELY from the SSR program (ngc rejects a
 * component declared by two NgModules; and CSR needs no platform-server). No
 * server render step — this is the pure client-side shape the CSR gates exercise.
 *
 * esbuild runs with `absWorkingDir` OUTSIDE the repo (so it does not read the
 * repo's Yarn PnP manifest `.pnp.cjs`) and resolves @angular/* via explicit
 * nodePaths, mirroring the SSR fixture builder.
 */
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const NGC = join(
  __dirname,
  '../../../../node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js',
);
const require = createRequire(join(__dirname, '../../../../package.json'));
const esbuild = require('esbuild');

function run(cmd, args, opts = {}) {
  // eslint-disable-next-line no-console
  console.log(`[build-csr] ${cmd} ${args.join(' ')}`);
  execFileSync(cmd, args, { stdio: 'inherit', cwd: __dirname, ...opts });
}

// 1. AOT compile the CSR program.
run(process.execPath, [NGC, '-p', 'tsconfig.json']);

// 2. Bundle the CSR program.
// NOTE: absWorkingDir is a dir OUTSIDE the repo so esbuild does not read the
// repo's Yarn Plug'n'Play manifest; module resolution uses explicit nodePaths.
await esbuild.build({
  entryPoints: [join(__dirname, '.aot-csr/csr/csr-main.js')],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  absWorkingDir: join(__dirname, '../../../../..'),
  nodePaths: [join(__dirname, '../../../../node_modules')],
  outfile: join(__dirname, '.aot-csr/csr-bundle.js'),
  ignoreAnnotations: true,
  logLevel: 'warning',
});

// eslint-disable-next-line no-console
console.log('[build-csr] DONE');
