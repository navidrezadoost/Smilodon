# Directive 178-C — Vue Published Declaration Remediation

Date: 2026-11-07
Branch: `fix/178-c-vue-nodenext-declarations`
Baseline: `7c5256c39f15222b8fb81d332122d2a9744c4021` (`origin/main`)

## Disposition

`LOCAL_PACKED_CONSUMER_PASS — HOSTED_CI_AND_INDEPENDENT_REVIEW_PENDING`

The published Vue declaration graph now resolves in strict NodeNext and Bundler consumers. The generated component props and emitted-event signatures are retained, and the named and default `Select` exports remain available. No runtime implementation or package dependency changed.

## Related process exception

PR #58 (Directive 178-B) was merged on 2026-11-07 at 16:18 UTC as merge commit `7c5256c39f15`, despite having zero submitted independent reviews. This is recorded as a process exception. It is not represented as satisfying the independent-review gate. PR #58's reported checks also do not establish post-merge `main` checks; this work starts from the observed `origin/main` baseline above.

## Diagnosis

The original packed NodeNext consumer failed with this complete diagnostic:

```text
../smilodon-178-c-baseline-minimal/node_modules/@smilodon/vue/dist/types/index.d.ts(33,20): error TS2307: Cannot find module './Select.vue' or its corresponding type declarations.
```

The tarball contained `dist/types/Select.vue.d.ts`, but NodeNext does not resolve a `.vue` module specifier to that declaration file. The package entry declaration retained the source SFC import, so the otherwise-present sibling declaration did not help consumers.

Once that reference was normalized during the investigation, strict TypeScript 5.6.3 with Vue 3.4.38 also exposed `TS2707`: the generated `DefineComponent` declaration used a newer, longer internal generic signature than Vue 3.4 accepts. The public props and event interfaces emitted by `vue-tsc` were valid; only the internal component type instantiation needed a stable compatibility surface.

## Change

- The Vue entry now re-exports `SelectProps`, `SelectItem`, and `SelectEmits` as types. The runtime named and default `Select` exports are unchanged.
- The cleanup step publishes `Select.vue.d.ts` as `Select.d.ts` and rewrites the declaration entry's component type specifier to `./Select.js`. NodeNext maps that JavaScript specifier to the adjacent `Select.d.ts`; Bundler resolution also accepts it.
- The generated props and event interfaces are retained. The generated internal `DefineComponent` instantiation is normalized to the stable Vue 3.4-compatible generic surface, including typed `v-model` and emitted events and the component's exposed methods.
- Declaration maps are disabled so the tarball does not contain declaration maps pointing back to unpublished source files. The cleanup step also fails if a published `.d.ts` still contains a `.vue` reference.
- No runtime code, JavaScript exports, or dependencies changed.

## Qualification evidence

- Baseline `origin/main`: `7c5256c39f15222b8fb81d332122d2a9744c4021`; new worktree was clean before edits.
- `npm run build -w @smilodon/core`: passed (Rollup emitted its existing `eval` warnings in `packages/core/src/utils/security.ts`).
- `npm run build -w @smilodon/vue`: passed; `test -s packages/vue/dist/types/index.d.ts`: passed.
- Packed actual `@smilodon/core@1.10.0` and `@smilodon/vue@1.10.0` tarballs into a fresh external consumer. Vue tarball contains `dist/types/index.d.ts`, `dist/types/Select.d.ts`, and `dist/types/types.d.ts`; it contains no `Select.vue.d.ts` or declaration maps.
- Consumer setup used Vue `3.4.38` and TypeScript `5.6.3`. Both compiler runs passed without diagnostics with `strict: true` and `skipLibCheck: false`:
  - `tsc -p tsconfig.nodenext.json` (`module` and `moduleResolution`: `NodeNext`).
  - `tsc -p tsconfig.bundler.json` (`module: ESNext`, `moduleResolution: Bundler`).
- Consumer assertions cover named/default component typing, `SelectProps`, `SelectItem`, Core `GlobalSelectConfig` and `SelectionConfig`, contextual `v-model` and `change` handler types, the exported event signatures, and rejection of a non-boolean `searchable` prop.
- Scanned packed `.d.ts` files: no `.vue` imports or unpublished source-path references remain.
- ESM and CommonJS packed entry points both loaded in a JSDOM environment; named/default `Select` identity and `configureSelect` were verified.
- `npm run test:contracts:vue`: 3 passed.
- `npm run lint`: zero errors, six existing warnings.
- `git diff --check`: passed.

## Browser test limitation and remaining gates

The local `npm run test:e2e:vue` preflight could not launch the pinned Chromium, Firefox, or WebKit engines because their binaries were absent. `npx playwright install chromium firefox webkit` failed with HTTP 403 from the Playwright CDN in this environment. A trial using the system Firefox executable could not launch under Playwright's automation protocol, so it is not counted as an E2E result. Vue browser E2E remains unverified locally and must be covered by hosted CI.

PR #59 is open against `main` at code commit `df5f8a78f5f122e6cbedfcd14b398cae1c04afa5`. All required hosted checks passed on that commit, including Vue browser E2E: CI run `42391655650`, Phase 4 Certification run `42391655564`, Tests run `42391655506`, and Phase 4 Performance Baseline run `42391655697`. Independent review is still pending; no merge is authorized by this directive. React Native qualification, security remediation, and production release readiness remain separate gates; `PRODUCTION_NO_GO` remains in effect.
