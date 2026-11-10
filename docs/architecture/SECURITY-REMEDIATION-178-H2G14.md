# Directive 178-H.2G.14 — Targeted High-Severity Remediation

Date: 2026-11-10
Baseline: isolated H.2G.12 candidate based on `c1e95d637ddbdda426448e8944c7bfe766e6b7fa`
Status: **Three of four High package entries eliminated. One Metro `image-size` entry, covering two advisories, remains blocked by the supported React Native toolchain boundary.** `PRODUCTION_NO_GO` remains in effect.

This is an isolated, uncommitted experiment in `experiment/178-h2g14-high-remediation`. No PR, push, merge, publication, or production change was made. ADR 179's distribution redesign was not included. Previous H.2G.12 source/test work was recreated from the surviving Vitest 4 experiment; the unrelated current IDE checkout was left untouched.

## 1. Remediation decisions

The full candidate lock audit before this directive had 23 entries: 0 critical, 4 high, 14 moderate, and 5 low. The production-omission audit had zero. The four High package entries were Vue, `@vue/server-renderer`, `serialize-javascript`, and `image-size`; the Vue parent/renderer entries are one advisory chain.

### Phase A — Vue renderer advisory chain

Updated the root and Vue-workspace development Vue floor from `^3.4.0` to `^3.5.42`; the lock resolves Vue and all associated compiler/runtime/renderer packages to `3.5.45`. This stays within Vue 3 and does not change the published adapter peer range (`^3.0.0`) or production API.

The first resolution attempt also selected `@vue/test-utils@2.5.1`, which brought `js-beautify@2` → `nopt@10` → `abbrev@5`; the latter two declare Node 22-only engine ranges. To preserve the qualified Node `20.20.2` tooling environment, the root development graph explicitly retains `@vue/test-utils@2.4.10`, a version already present in the baseline lock and accepted by `@testing-library/vue`'s `^2.4.1` range. The final lock therefore contains no Node 22-only `nopt`/`abbrev` chain.

The Vue and renderer advisory entries disappear from the final audit. `npm ls vue @vue/server-renderer --all` shows one consistent `3.5.45` tree across Vue, `@testing-library/vue`, and Vue Test Utils.

### Phase B — Rollup serializer advisory chain

Updated the root and Core development dependency `@rollup/plugin-terser` from `^0.4.4` to `^1.0.2`. Its declared Rollup peer range includes Rollup 4, its Node engine begins at 20, and the lock resolves `serialize-javascript@7.1.4`. This removes the RCE, CPU exhaustion, and script-context XSS advisory paths without an override or forced resolution. The lock graph remains valid under Node 20/npm 10.

Core and Vue generated distribution files were hashed before and after the plugin change: all 58 compared files are byte-identical. The full unit/contract suite also retains the baseline counts.

### Phase C — Metro feasibility; no dependency change selected

The current packed React Native tooling path is `react-native@0.76.9` → `@react-native/community-cli-plugin@0.76.9` → Metro `0.81.5` → `image-size@1.2.1`. Metro `0.81.5`, as well as Metro 0.82 through 0.87.0, declares `image-size ^1.0.2`, so patched `image-size@2.x` cannot satisfy that supported range. No override was used.

The first inspected Metro release without an `image-size` dependency is `0.87.1`. React Native 0.87.1 accepts Metro `^0.87.0`, but React Native 0.87 requires Node `^22.13.0 || ^24.3.0 || >=26.0.0` and React `^19.2.3`. The qualified fixture and CI baseline use Node `20.20.2`, React `18.3.1`, and React Native `0.76.9`. That is a multi-axis framework/toolchain migration, not a compatible targeted security update. It would require a separate approved React Native modernization and renewed packed-bundle qualification; Android runtime claims would still require device certification.

Disposition: **do not update Metro or React Native in H.2G.14.** The two `image-size` advisories remain open and block security closure. Revisit only in a separately scoped RN/Metro migration with explicit Node/React changes, Metro behavior checks, and appropriate native qualification.

## 2. Final dependency audit and graph

Validated with Node `20.20.2` and npm `10.8.2` after a clean `npm ci`:

| Audit / graph | Result |
| --- | --- |
| Full locked graph | 19 entries: 0 critical, 1 high, 13 moderate, 5 low |
| Remaining High | `image-size@1.2.1`: GHSA-5p2g-fcmc-qvqq and GHSA-w3rx-r6r6-pgpr |
| Production omission audit | 0 findings |
| `npm ls` target dependency graph | Passed; no invalid or unmet dependencies |
| `npm explain` paths | Captured for Vue/renderer, serializer, and image-size |
| Overrides / forced resolution | None |

Compared with the 23-entry candidate baseline, the audit has four fewer package entries; the three Vue/renderer/serializer High entries are absent. The remaining High has not been dismissed or excluded from the graph. Full JSON results and graph records are preserved as local-only artifacts, excluded from the proposed Git tree. Reference `H2G14-LOCKED-AUDIT` uses manifest `178-H2G14-SHA256SUMS`, SHA-256 `42226e5ed0b08b0329568fd95518b27c16aa8fd01b0cc3a486d4e669b3cdc5a8`; see [178-H.2G.20 Evidence Index](./SECURITY-EVIDENCE-INDEX-178-H2G20.md#h2g14-locked-audit).

## 3. Regression qualification

All commands ran locally in this isolated worktree; hosted CI was not run.

| Gate | Result |
| --- | --- |
| Clean `npm ci` (Node 20.20.2/npm 10.8.2) | Passed. No unsupported engine warnings; npm reported existing deprecation and blocked-install-script notices. |
| `npm run build` | Passed. All workspace builds completed. |
| Build artifact comparison | 58 Core/Vue distribution files byte-identical before/after Rollup plugin upgrade. |
| `npm test` | Passed: Core 603 passed/1 skipped; data loading 40 passed; contracts 12 passed/43 skipped. Same counts as baseline. |
| `npm run lint` | Passed: 0 errors, 6 existing warnings. |
| `npm run test:types:react-native` | Passed packed React Native NodeNext/Bundler consumer checks. No Metro version changed. |
| Deliberate failing assertion | Exactly 1 test failed and Vitest exited 1; temporary probe file was removed. |
| Generated React Native bundle | Build rewrote the tracked file; the exact clean snapshot was restored and SHA-256 verified. |
| `git diff --check` | Passed. |

Svelte compatibility remains outside this directive. The previously reported packed Svelte 5 consumer passed 1/1; a Svelte 5 artifact still fails on Svelte 4 at `svelte/legacy`, while a separately Svelte 4-built artifact passes its Svelte 4 consumer and fails on Svelte 5 at `svelte/internal`. This experiment changes no Svelte package peer range or export and makes no cross-major compatibility claim.

## 4. Remaining blocker and next action

The Vue and serializer findings are remediated in this candidate. The image-size package entry remains High because every Metro version compatible with the current RN 0.76 line still requests the vulnerable 1.x range; the available Metro line without that dependency requires a later Node and React baseline. The remaining work requires a separately approved React Native/Metro modernization rather than a dependency override.

This candidate has no hosted qualification or independent review. Do not merge or publish it as security closure. `PRODUCTION_NO_GO` remains in effect.
