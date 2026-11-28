/**
 * S5-V — minimal ESM resolve hook.
 *
 * Angular's `ngc` emits relative imports WITHOUT file extensions
 * (e.g. `import './ssr-app.component'`). Node's ESM resolver requires the
 * extension, and `--experimental-specifier-resolution=node` is a no-op on this
 * Node version. This hook rewrites extensionless relative specifiers to `.js`
 * so the AOT-emitted `.aot-out` modules can be executed directly by the SSR
 * render driver.
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && !/\.[cm]?js$/.test(specifier) && context.parentURL) {
    const candidate = new URL(specifier + '.js', context.parentURL);
    if (existsSync(fileURLToPath(candidate))) {
      return nextResolve(candidate.href, context);
    }
  }
  return nextResolve(specifier, context);
}
