/**
 * S5-V — registers the extension-resolving ESM hook (see resolve-ts-loader.mjs)
 * via `module.register` so it applies to the whole SSR render process.
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('./resolve-ts-loader.mjs', pathToFileURL(import.meta.filename));
