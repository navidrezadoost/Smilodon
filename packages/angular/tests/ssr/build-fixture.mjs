/**
 * S5-V — builds the SSR/hydration fixture end-to-end (reproducible):
 *
 *   1. ngc (AOT full) the SERVER program  -> .aot-out/   (ssr-server.module, ssr-app)
 *   2. ngc (AOT full) the CLIENT program  -> .aot-client/ (hydrate-client, publish-facade, ssr-app)
 *   3. render the server program to .aot-out/server-render.html (via render-server.mjs)
 *   4. esbuild-bundle the client program to .aot-client/client-bundle.js
 *
 * The two AOT programs are compiled SEPARATELY because ngc rejects a component
 * declared by two NgModules at once; server and client each declare their own
 * non-standalone `app-ssr-shell` root (identical selector) that imports the
 * shared standalone `SsrAppComponent` — required so hydration can match the
 * server-rendered root element.
 *
 * The client bundle uses `ignoreAnnotations: true` so esbuild does not elide the
 * partially-compiled `@angular/compiler` FESM: without it, esbuild drops the
 * `publishFacade(_global)` side effect, leaving `globalThis.ng.ɵcompilerFacade`
 * unset and breaking the JIT fallback that resolves `_PlatformLocation`.
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
  console.log(`[build-fixture] ${cmd} ${args.join(' ')}`);
  execFileSync(cmd, args, { stdio: 'inherit', cwd: __dirname, ...opts });
}

// 1. AOT compile server + client programs.
run(process.execPath, [NGC, '-p', 'tsconfig.server.json']);
run(process.execPath, [NGC, '-p', 'tsconfig.client.json']);

// 2. Render the server program to HTML.
run(process.execPath, ['--import', './register-loader.mjs', 'render-server.mjs']);

// 3. Bundle the client program.
// NOTE: absWorkingDir is a dir OUTSIDE the repo so esbuild does not pick up the
// repo's Yarn Plug'n'Play manifest (.pnp.cjs); module resolution then uses the
// explicit nodePaths (the repo node_modules). Running inside the repo would make
// esbuild read .pnp.cjs and fail to resolve the hoisted @angular/* packages.
await esbuild.build({
  entryPoints: [join(__dirname, '.aot-client/hydrate-client.js')],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  absWorkingDir: join(__dirname, '../../../../..'),
  nodePaths: [join(__dirname, '../../../../node_modules')],
  outfile: join(__dirname, '.aot-client/client-bundle.js'),
  ignoreAnnotations: true,
  logLevel: 'warning',
});

// eslint-disable-next-line no-console
console.log('[build-fixture] DONE');
