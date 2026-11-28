/**
 * S5-V — publishes the Angular JIT compiler facade as EARLY as possible.
 *
 * The partially-compiled `@angular/platform-browser` FESM references
 * `_PlatformLocation`, whose JIT fallback is resolved via
 * `globalThis.ng.ɵcompilerFacade` at *module-evaluation* time. Because ESM
 * evaluates imported module bodies in declaration order, this module MUST be
 * imported before `@angular/platform-browser` in `hydrate-client.ts` so the
 * facade is installed before the platform library's top-level code runs.
 *
 * esbuild aggressively tree-shakes `@angular/compiler` (a partially-compiled
 * FESM marked largely side-effect-free), so a plain `import '@angular/compiler'`
 * or even `publishFacade(globalThis)` can be elided. We therefore reference the
 * imported binding on `globalThis` FIRST (so it is observably live) and then
 * publish, which forces esbuild to keep the real compiler implementation.
 */
import { publishFacade } from '@angular/compiler';

// Keep a live reference (prevents esbuild from eliding the compiler) and publish
// the facade so `getCompilerFacade()` can resolve the JIT fallback.
(globalThis as unknown as { __smilodonCompilerFacade?: unknown }).__smilodonCompilerFacade =
  publishFacade;
publishFacade(globalThis);
