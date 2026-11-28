/**
 * SSR import-safety test setup (node environment only).
 *
 * @angular/core, @angular/common, AND @angular/forms all ship PARTIALLY compiled
 * (Angular Linker format). When a decorator/DI factory is touched before
 * `@angular/compiler` is present, they throw "needs JIT compiler". The Angular
 * adapter's `select.component.ts` imports `NG_VALUE_ACCESSOR` from
 * `@angular/forms` (S4), whose FESM transitively imports `@angular/common` — so
 * importing the component module in a bare Node process would trip that JIT
 * fallback and fail the import-safety spec for a reason unrelated to the spec's
 * actual contract (which is about `@smilodon/core` NOT being evaluated).
 *
 * Loading `@angular/compiler` first lets the Linker JIT-fallback those library
 * packages so the import succeeds. This does NOT define any DOM global, does NOT
 * import `@smilodon/core`, and does NOT touch the element — so the spec's
 * `assertNoDom()` guard and its "core is not evaluated" evidence remain valid.
 */
import '@angular/compiler';
