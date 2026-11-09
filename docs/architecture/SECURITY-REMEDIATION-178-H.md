# Directive 178-H — Security Advisory Triage and Controlled Remediation, Wave 1

Status: **Wave 1 local qualification complete; hosted PR checks and independent review pending. `PRODUCTION_NO_GO` remains in effect.**

## 1. Verified baseline and governance

Wave 1 is based on `origin/main` at `9e893521db78a42b63f9d0d1956ee6b09eeb5f72`, the merge commit for PR #63. PR #63 merged with 20/20 reported checks and zero submitted reviews. The missing review is recorded as a process exception, not approval. Its three post-merge workflows later completed successfully on that exact commit: CI run `42582874478`, Tests run `42582874439`, and Phase 4 Certification run `42582874444`.

PR #62 remains open, Draft, and unmerged at `efeb75165cc6403822a93f35368d57939fb45b58`, with zero submitted reviews. No Android emulator or physical-device work is part of this directive.

Before Wave 1 implementation, `main` branch protection required zero approving reviews. I changed the existing pull-request review rule to require **one approval**, preserving stale-review dismissal, the existing required status checks, and admin enforcement. GitHub’s API now reports `required_approving_review_count: 1`, `dismiss_stale_reviews: true`, and admin enforcement enabled. The before/after verification is preserved in [`main-branch-protection-after-review-gate.json`](./178-h-evidence/main-branch-protection-after-review-gate.json) and [`github-verification-2026-11-09.json`](./178-h-evidence/github-verification-2026-11-09.json). This corrects the future merge gate; it does not retroactively approve PR #63.

## 2. Reproduced audit baseline

The audit used Node `20.20.2`, npm `10.8.2`, and baseline lockfile SHA-256 `e09d2f6ff33c905943cd2eb93b57a0887f5193b13e9bec0a04819c0282f447c5`. The raw full and production-only JSON snapshots from before remediation are preserved in this directory. All 45 reported package locations were development-only in the baseline lock. The production omission audit reported zero, but does not audit peer versions selected by downstream applications.

The 21 critical/high package entries were triaged individually in [`critical-high-advisory-triage-2026-11-09.json`](./178-h-evidence/critical-high-advisory-triage-2026-11-09.json). Each record includes advisory IDs and titles, affected baseline versions and lock locations, shortest workspace dependency paths, workflow/tooling use, reachable-functionality assessment, npm’s fix signal, current disposition, and resolved version where changed. Reachability assessments are repository-specific; they do not claim that a package advisory is harmless in other applications or CI environments.

## 3. Wave 1 change and audit result

The bounded change updates vulnerable entries where the existing parent semver ranges permit a fix. It changes `package-lock.json` only. No package manifest, public API, runtime implementation, workflow, integrity rule, or published peer dependency range changed. No `--force` or automatic major upgrade was used. In particular, the public peer ranges for Vue and Solid remain as declared; local lock updates do not eliminate risk in consumer-resolved peer graphs.

The full audit changed as follows:

| Severity | Before | After | Critical/high entries resolved |
| --- | ---: | ---: | ---: |
| Critical | 6 | 3 | 3 |
| High | 15 | 5 | 10 |
| Moderate | 21 | 20 | 1 additional moderate entry |
| Low | 3 | 3 | 0 |
| **Total** | **45** | **31** | **14 total package entries** |

The post-update production omission audit still reports zero. The current lockfile SHA-256 is `413be68c19b11a2c3264976628453aabecaf23717d8ef9e39fc0da0c8b719111`. Full before/after audit JSON and the omission result are preserved in [`178-h-evidence/`](./178-h-evidence/).

### Critical/high triage decisions

| Entry | Baseline → resolved version | Advisory IDs | Dependency path / use | Decision |
| --- | --- | --- | --- | --- |
| `brace-expansion` — High | 1.1.14 / 2.1.0 / 5.0.5 → 1.1.21 / 2.1.7 / 5.0.12 | GHSA-jxxr-4gwj-5jf2, GHSA-3jxr-9vmj-r5cp, GHSA-mh99-v99m-4gvg, GHSA-rgw5-rvv9-x895, GHSA-q2hr-2g5m-vwhr, GHSA-qhr7-859c-m2p7, GHSA-6j4f-fj2g-mc7p | ESLint/minimatch/glob, Vue type tools, React Native codegen/CLI; crafted glob patterns can cause denial of service. | Resolved in existing parent ranges. Repository patterns are checked-in configuration; no untrusted pattern input was found. |
| `browserslist` — High | 4.28.2 → 4.29.5 | GHSA-c83g-rgw3-j3cx, GHSA-73wf-gq98-2v4g | Babel target resolution; affected behavior concerns resource exhaustion or unsafe custom stats. | Resolved within existing range; project build targets are configuration inputs. |
| `form-data` — High | 4.0.5 → 4.0.6 | GHSA-hmw2-7cc7-3qxx | jsdom test dependency; multipart field names/filenames are the vulnerable input. | Resolved within existing range; repository tests do not submit multipart data. |
| `js-cookie` — High | 3.0.5 → 3.0.8 | GHSA-qjx8-664m-686j | Indirect Vue test-tool dependency through js-beautify; no direct Smilodon import found. | Resolved within existing range. |
| `js-yaml` — High | 3.14.2 / 4.1.1 → 3.15.2 / 4.3.2 | GHSA-h67p-54hq-rp68, GHSA-52cp-r559-cp3m, GHSA-5p4m-2wfm-xmqj, GHSA-2883-xcg3-v3hh | ESLint and React Native build/config tooling; malformed YAML is the relevant input. | Resolved in both existing major lines; repository configuration is checked in. |
| `nanoid` — High | 3.3.12 → 3.3.20 | GHSA-28wg-ghj8-5hjv, GHSA-2v37-7h3g-55p8 | PostCSS/Vite transform dependency. | Resolved within existing parent ranges. |
| `node-forge` — High | 1.4.0 → 1.4.3 | 12 advisories, enumerated in the triage JSON | React Native dev middleware/self-signed certificate tooling; no production adapter import. | Resolved within existing parent range; remaining React Native tooling exposure is re-audited separately. |
| `postcss` — High | 8.5.14 → 8.5.32 | GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849 | Vite CSS build/test pipeline; inputs are repository CSS. | Resolved within existing ranges. |
| `seroval` — Critical | 1.5.4 → 1.6.12 | GHSA-p6vx-979v-rg4c, GHSA-jp82-f5mq-hwhp, GHSA-97r2-qh9m-474h, GHSA-wp97-x4hv-qvhp, GHSA-7rv5-mrxv-xcr9 | Transitive under Solid; findings concern deserialization of attacker-controlled nodes. Smilodon source does not import it directly. | Resolved within existing Solid dependency range; downstream SSR use is not certified. |
| `shell-quote` — Critical | 1.8.3 → 1.12.0 | GHSA-w7jw-789q-3m8p, GHSA-395f-4hp3-45gv | React Native React DevTools tooling; crafted `.op` data is required for the critical quoting issue. | Resolved within existing parent range; no Smilodon invocation was found. |
| `solid-js` — Critical | 1.9.12 → 1.9.18 | Inherited from `seroval` advisories above | Direct Solid peer/dev dependency, used by the adapter for signals/rendering; the reported critical path is serialization. | Local lock resolved to patched 1.9.x. Public peer range unchanged, so downstream peer graphs remain a separate risk. |
| `source-map-js` — High | 1.2.1 → 1.2.2 | GHSA-68fv-2mgg-jv7q | PostCSS/Svelte CSS and source-map build tooling. | Resolved within existing parent ranges. |
| `ws` — High | 6.2.3 / 7.5.10 / 8.20.0 → 6.2.6 / 7.5.13 / 8.22.2 | GHSA-58qx-3vcg-4xpx, GHSA-96hv-2xvq-fx4p | jsdom and React Native Metro/DevTools WebSocket paths; network access to the affected local service/client behavior is required. | Resolved at each vulnerable lock location within parent ranges; no public Smilodon WebSocket server is shipped. |
| `@vitest/ui` — Critical | 1.6.1 → remains 1.6.1 | GHSA-5xrq-8626-4rwp | Root dev dependency; the critical file-read/execute condition requires the Vitest UI server to be listening. CI invokes `vitest run`, not UI mode. | Defer aligned Vitest 4 / UI 5 major migration for separate compatibility work. |
| `tinypool` — Critical | 0.8.4 → remains 0.8.4 | GHSA-5gmw-xhrv-c9v3, GHSA-85c8-ppgw-ccpr | Vitest worker pool; affected RCE gadget requires crafted worker options. Current options come from checked-in test configuration. | Defer with the Vitest major migration; do not force an incompatible pool into Vitest 1. |
| `vitest` — Critical | 1.6.1 → remains 1.6.1 | GHSA-5xrq-8626-4rwp | Root/Core test runner; critical UI issue is conditional on the UI server listening. | Defer 1.x → 4.x as a coordinated runner/config migration with regression evidence. |
| `@vue/server-renderer` — High | 3.5.33 → remains 3.5.33 | GHSA-g2v6-rqmx-r4w6 | Inherited from Vue peer/dev dependency; XSS concerns SSR attribute names. No repository SSR use was found; downstream Vue apps may use SSR. | Keep public Vue peer range unchanged in Wave 1. Decide any minimum-version change separately and test the supported Vue matrix. |
| `vue` — High | 3.5.33 → remains 3.5.33 | GHSA-g2v6-rqmx-r4w6 via server renderer | Direct Vue peer/dev dependency; the affected surface is Vue SSR, not the client adapter alone. | Do not narrow `vue: ^3.0.0` in this wave. Consumer-resolved peer exposure remains open. |
| `image-size` — High | 1.2.1 → remains 1.2.1 | GHSA-5p2g-fcmc-qvqq, GHSA-w3rx-r6r6-pgpr | Metro asset dimension parsing in the Android bundling toolchain; crafted image assets can reach the parser there. | Defer: Metro resolves the 1.x line; the available image-size fix is outside its current range and needs a Metro compatibility migration. |
| `serialize-javascript` — High | 6.0.2 → remains 6.0.2 | GHSA-5c6j-r48x-rmvq, GHSA-qj8w-gfj5-8c6v, GHSA-m5mm-p8h7-m29v | Core minified bundle build through `@rollup/plugin-terser`; inputs are build sources. | Defer: plugin-terser 0.4.x uses the 6.x serializer line; npm’s path updates plugin-terser to 1.x, a major build-tool change. |
| `vite` — High | 5.4.21 → remains 5.4.21 | GHSA-4w7w-66w2-5vf9, GHSA-v6wh-96g9-6wx3, GHSA-698v-4r3x-3vcv, GHSA-r825-w8mm-5pxw, GHSA-587h-7wmj-h5pm, GHSA-9jrq-w75r-8gcw, GHSA-rq7h-c2jc-7f22, GHSA-fx2h-pf6j-xcff | Direct dev dependency for four adapters and playground; local Vite servers are used in browser tests. | Defer the Vite 5 → 6+ migration to a multi-plugin/workspace compatibility directive. |

The table is a concise index; exact affected ranges, all advisory titles, all package locations, and all resolved/current versions are in the triage JSON. Npm severity prioritizes review but does not establish exploitability. No proof-of-concept execution was performed. No application-level product vulnerability is claimed from these development-graph records.

## 4. Validation

The exact lockfile was installed with CI-aligned Node/npm using `npm ci`. Local checks on the remediation branch:

| Check | Result |
| --- | --- |
| `npm run lint` | Pass; zero errors and six existing warnings. |
| `npm run build` | Pass across workspaces. The React Native build rewrote tracked generated `coreBundle.ts`; the original clean bytes were restored and hash-verified. Before/after hashes are recorded in `generated-bundle-build-observation.json`. |
| `npm test` | Pass: 603 Core tests passed, 1 existing skip; data-loading 40/40; contracts 12 passed, 43 existing React skips. |
| `npm run test:types:react-native` | Pass: packed Core/React Native strict NodeNext and Bundler consumers, `skipLibCheck: false`, `react-native` condition, no DOM library. |
| `npm run test:e2e:react` | Did not reach browser tests. Preflight failed because the pinned Chromium, Firefox, and WebKit browser binaries were absent. An attempted pinned-browser download was interrupted after slow partial Chromium transfer; hosted E2E checks are required before merge. |
| `npm audit --package-lock-only --json` | Expected exit 1 due to remaining findings; 31 package entries (3 critical, 5 high, 20 moderate, 3 low). |
| `npm audit --package-lock-only --omit=dev --json` | Exit 0; zero findings in the current local production omission graph. |
| `git diff --check` | Pass. |

The strict packed consumer check exercises the native NodeNext and Bundler declaration modes. No native Android/iOS runtime behavior is inferred from it. Hosted CI must pass all required workflows, including browser suites, before this PR is ready for review/merge.

## 5. Reproduction

The remediation was performed on a clean worktree at the verified baseline. The bounded lock update was:

```sh
npm update @vue/server-renderer brace-expansion browserslist form-data image-size js-cookie js-yaml nanoid node-forge postcss serialize-javascript seroval shell-quote solid-js source-map-js tinypool vite vitest vue ws @vitest/ui \
  --package-lock-only --workspaces --include-workspace-root
npm ci
npm audit --package-lock-only --json
npm audit --package-lock-only --omit=dev --json
```

Only updates allowed by current dependency ranges were accepted. The command does not force upgrades and did not alter package manifests or peer ranges.

## 6. Next actions and release decision

1. Obtain all hosted checks on the remediation PR, including browser workflows.
2. Require one approving review from an authorized person other than the author; branch protection now enforces this on `main`.
3. Keep the eight remaining critical/high package entries assigned to separate compatible remediation work: Vitest/UI/Tinypool major migration; Vue peer/SSR compatibility policy; Vite major matrix; Metro/image-size; and Terser/serializer migration.
4. Audit supported downstream peer graphs and preserve the distinction between local dev-graph findings and consumer-selected dependencies.
5. Keep Android physical-device and iOS runtime qualification open. No security PR closes those gates.

Disposition: **`178-H_WAVE_1_LOCAL_PASS — 13_OF_21_CRITICAL_HIGH_ENTRIES_CLEARED — HOSTED_CHECKS_AND_INDEPENDENT_REVIEW_PENDING — PRODUCTION_NO_GO`**. The audit count reduction is not sufficient by itself to declare security readiness.
