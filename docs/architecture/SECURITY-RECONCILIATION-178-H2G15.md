# Directive 178-H.2G.15 — Metro Risk Boundary and Candidate Qualification Plan

Date: 2026-11-10

Reference candidate: `experiment/178-h2g14-high-remediation` at baseline `c1e95d637ddbdda426448e8944c7bfe766e6b7fa`

Disposition: **`H2_CANDIDATE_SCOPE_DEFINED — METRO_HIGH_OPEN — HOSTED_QUALIFICATION_PENDING — PRODUCTION_NO_GO`**

This is an assessment and qualification plan. It changes no dependency, source, workflow, peer range, package API, or release configuration. The H.2G.14 lockfile, manifest changes, local audit/test evidence, generated-artifact comparison, and hash manifest remain preserved in this worktree. No hosted workflow was run for this assessment.

## 1. Current evidence and gate state

The preserved candidate's local Node 20.20.2 / npm 10.8.2 evidence records 0 Critical, 1 High, 13 Moderate, and 5 Low audit entries; the production-only omission audit is zero. The remaining High is `image-size@1.2.1` reached through Metro `0.81.5`. The existing report is [`SECURITY-REMEDIATION-178-H2G14.md`](./SECURITY-REMEDIATION-178-H2G14.md). Its raw snapshots are local-only and excluded from the proposed Git tree: reference `H2G15-METRO-REACHABILITY` uses manifest `178-H2G14-SHA256SUMS`, SHA-256 `42226e5ed0b08b0329568fd95518b27c16aa8fd01b0cc3a486d4e669b3cdc5a8`; see [178-H.2G.20 Evidence Index](./SECURITY-EVIDENCE-INDEX-178-H2G20.md#h2g15-metro-reachability). These results are not an exception to a zero-High policy. Until the High is remediated or a formally permitted exception is approved, security closure remains blocked.

The advisories cover denial of service from crafted image buffers: JXL/HEIF box-size fields that do not advance parsing, and an ICNS entry length of zero that leaves the parser loop offset unchanged. Both list `image-size` 2.0.3 as patched. The locked candidate has 1.2.1, inside both affected ranges. See the [JXL/HEIF advisory](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq) and the [ICNS advisory](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr).

## 2. Bounded Metro reachability assessment

### Where the vulnerable parser runs

The observed dependency path is `react-native@0.76.9` → `@react-native/community-cli-plugin@0.76.9` → `metro@0.81.5` → `image-size@1.2.1`. Metro imports `image-size` in `metro/src/Assets.js`. Its `getAssetData` path reads asset bytes and calls the parser to derive image dimensions; the asset serializer invokes this path when bundling assets. This is build/development tooling, not a Smilodon application runtime dependency. The check is exercised when a Metro project bundles or serves a recognized local image asset.

Metro's default asset extensions include common image types such as PNG, JPEG, GIF, WebP, BMP, PSD, and SVG. Its own image-dimension helper is also gated by an image-extension allowlist. JXL, HEIF, and ICNS are not default extensions or image types in this Metro version. However, `image-size` selects its parser from the buffer signature, not from the filename suffix. Thus a specially crafted JXL, HEIF, or ICNS buffer named with a Metro-recognized image suffix can reach the corresponding parser. A custom Metro `assetExts` configuration is another input-boundary variation that should be checked in an application-specific assessment.

### Attacker prerequisites and impact

An attacker needs a path to cause a crafted local asset to be present in a Metro project or watched folder and then cause a bundle, asset request, or development-server operation to process it. Plausible paths include an untrusted contribution that adds an image asset to a repository whose pull-request workflow runs Metro, or an application build system that copies untrusted uploads into the bundle input tree. The likely affected process is the Node.js build/development worker: its event loop can hang, causing a CI job or developer bundling process to stop making progress until an external timeout or process termination.

The reviewed source establishes the parser call and accepted asset path. It does not establish that Smilodon's own repository workflows run Metro, that Smilodon accepts remote image uploads into a Metro tree, or that an attacker can reach a particular consumer's build inputs. No exploit was run. Reachability in downstream applications is therefore **conditional and application-specific**, not proven absent. The package-entry severity remains High and is not downgraded by this assessment.

### Mitigations available without changing Metro

These are operational mitigations, not a dependency remediation or a security-policy exception:

- Keep untrusted uploads and generated user content outside Metro's project root and watch folders. Do not copy remote files into bundle inputs without validation.
- For CI that builds untrusted contributions, use isolated, time-bounded jobs with no release credentials; retain logs and terminate on the configured timeout. This limits impact but does not stop the parser loop.
- If the consuming application does not need the affected image formats, enforce an asset allowlist before Metro sees files and reject suspicious signature/extension mismatches. A suffix-only check is insufficient because parser detection is content-based.
- Treat custom Metro asset extensions and asset plugins as part of the input surface; document them and review their handling of untrusted files.
- Reassess when Metro publishes a compatible dependency fix or when a separately authorized Metro/RN modernization is qualified. Do not use an npm override or patch Metro outside that scope.

These mitigations cannot make the locked audit clean, cannot establish all downstream consumers' exposure, and do not satisfy a policy requiring zero High findings without exceptions. Directive 180's Node 22 / React 19 / React Native modernization remains proposed, not authorized by this document.

## 3. Reviewable H.2 candidate boundary

The H.2G.14 candidate remains the reference snapshot; its files are not split, reset, or rewritten in this assessment. Inspection of the candidate diff shows no changes to `packages/react-native/package.json`, no production `src/` changes, and no changes to published peer dependency ranges. The Svelte-related changes in this candidate are development/build and contract-test toolchain changes required by the Vitest 4 migration: Svelte 5, Vite 6, the Svelte Vite plugin, and Svelte 4 component-API compatibility mode. They are not the proposed Svelte 3/4/5 distribution redesign in ADR 179.

| Review area | In-scope candidate changes | Boundary / unresolved qualification |
| --- | --- | --- |
| Security wave 1 | Lockfile-only semver-safe transitive resolutions and already-recorded package toolchain adjustments | No dependency override; the Metro `image-size` High remains open. |
| Vitest/Svelte test-toolchain integration | Vitest/UI 4, Vite 6, Svelte 5 dev toolchain and test configuration needed to keep the existing assertions running | Must preserve test identity and assertion behavior; does not prove published consumer compatibility for Svelte 3/4/5. |
| Published package contracts | Existing package exports and peer ranges are retained | No peer-range widening/narrowing, export-map redesign, multi-major artifact layout, or migration promises. |
| RN/Metro | Existing RN 0.76.9 and Metro 0.81.5 boundary remains | No Metro override, RN major upgrade, runtime claim, or Android/iOS qualification claim. |

ADR 179's multi-major Svelte distribution design and Directive 180's RN/Metro modernization are excluded. Before an H.2 candidate can be called consumer-qualified, run the packed-consumer matrix below against the **post-separation artifact**. The current H.2G.14 local report contains packed RN type checks but does not provide the full cross-framework peer-version matrix; that matrix is pending, not inferred from monorepo tests.

One compatibility issue must be resolved explicitly during qualification: `.github/workflows/publish-github-packages.yml` currently selects Node 18, while the candidate's `@rollup/plugin-terser@1.0.2` declares Node `>=20`. Existing Core metadata declares Node `>=18`. The current local Node 20 build does not qualify this Node 18 publication path. Preserve the Node 18 claim only if the exact package build succeeds on Node 18 without engine bypass; otherwise document and approve the support-policy and publishing-workflow change separately before release. Do not silently omit the workflow from the matrix.

## 4. Hosted qualification matrix — planned, not executed

The existing workflows below remain required according to their current triggers and branch protection. Their present Node setup is Node 20. H.2's proposed qualification should add explicit matrix coverage; it must not replace current checks or mark a missing framework/configuration as passed.

| Axis / package | Required hosted qualification | Planned versions/configurations | Current gap or evidence rule |
| --- | --- | --- | --- |
| Node support and locked graph | Clean `npm ci`, full locked audit, production-only audit, engine checks; record Node/npm and lock hash | Node 20.20.2 + npm 10.8.2 (primary); Node 22 LTS + supported npm (secondary); Node 18.20.x publication/build probe because Core declares `>=18` and publish workflow currently uses 18 | Node 18 is a hard compatibility check, not an ignorable matrix failure. Record engine warnings and command outcomes. Do not run `npm audit fix` or use overrides. |
| Core | Build, unit/data-loading suites, declarations, packed Core consumer in NodeNext and Bundler modes, strict mode and `skipLibCheck: false` | Node 20 and 22 full checks; Node 18 build/consumer probe | Preserve assertion identities/results and deterministic failure behavior. |
| React | Build, existing React contracts and browser E2E; packed consumer against minimum supported React 16.8 line and current React 18 line | Node 20 and 22; Chromium/Firefox/WebKit where current project matrix provides them | Current CI runs React tests; exact minimum-peer packed check is still required. |
| Vue | Build, Vue contracts/E2E, packed consumer at Vue 3.0 boundary and current Vue 3.5 line | Node 20 and 22; current configured browser projects | The manifest claim remains `vue ^3.0.0`; test its lower bound, not only the updated dev version. |
| Vanilla | Build, Vanilla contracts/E2E, packed NodeNext and Bundler consumer | Node 20 and 22; Node 18 package-build probe | Keep `dist/types/index.d.ts` and runtime entry checks; preserve strict compiler settings. |
| Solid | Build and packed consumer for `solid-js ^1.9.0`; add/run direct contract coverage before calling adapter parity complete | Node 20 and 22 | Current Tests matrix has no Solid contract/E2E job. Record this as blocked until a real Solid suite exists; do not substitute Core success. |
| Svelte | Build plus packed consumers using Svelte 3, 4, and 5 matching the unchanged declared peer range; run contract assertions under supported configurations | Node 20 and 22; one consumer job per peer major | H.2 toolchain uses Svelte 5. The Svelte 3/4 packed consumers are mandatory evidence; ADR 179 remains separate. |
| React Native | Existing packed native type test in strict NodeNext/Bundler modes with `react-native` condition and no DOM libs; packed consumer against RN 0.74 boundary and current 0.76 fixture | Node 20 and 22 | Type qualification only. Android runtime remains blocked by hardware; iOS runtime remains unqualified. Do not label either native runtime passed. |
| Browser and performance | Keep CI E2E, Phase 4 guarded Chromium/Firefox/WebKit certification, report-only performance baseline, Core stress, lifecycle, and controlled End-key replication/aggregation checks | Retain each workflow's pinned Node 20 and pinned browser/runtime inputs; do not mix Node matrix changes into benchmark comparison | Preserve raw reports/artifacts, provenance, censored samples, and exact tested commit. Report-only results do not become a performance budget. |
| Security and assertions | Audit full and `--omit=dev` graphs; compare test identities, skip counts, and assertion outcomes to H.2G.14 baseline; verify a deliberately failing fixture exits nonzero | On each primary Node line after the lockfile is fixed | Current workflows do not show a dedicated npm audit gate. Add one only in a separately reviewed workflow change; retain audit JSON and diffable test inventory. |

Current workflow references: [`ci.yml`](../../.github/workflows/ci.yml), [`test.yml`](../../.github/workflows/test.yml), [`phase-4-certification.yml`](../../.github/workflows/phase-4-certification.yml), [`phase-4-performance-benchmark.yml`](../../.github/workflows/phase-4-performance-benchmark.yml), [`phase-4-endkey-replication.yml`](../../.github/workflows/phase-4-endkey-replication.yml), and [`publish-github-packages.yml`](../../.github/workflows/publish-github-packages.yml). The first five currently select Node 20 (as applicable); package publication selects Node 18. This table is a plan, not evidence that these jobs ran or that branch protection currently requires every listed context.

For every matrix job, preserve the exact commit, Node/npm versions, install output, exit code, package tarballs and hashes, consumer fixture, test identity/results, and failure diagnostics. Unsupported configurations must produce an explicit failed or blocked record with the reason and a disposition. A skipped job, absent workflow, or green aggregate summary cannot imply support.

## 5. Acceptance status and next actions

| Acceptance item | Status |
| --- | --- |
| Critical findings | 0 reported in the preserved H.2G.14 candidate audit |
| Remaining High | 1 Metro `image-size` entry; explicitly blocked pending compatible remediation or a policy-approved exception |
| Production-only audit | 0 reported; supporting evidence only, not closure of the full graph |
| Dependency overrides | None in the preserved candidate |
| Existing assertions | Local H.2G.14 suite and deliberate failure probe passed as recorded; hosted equivalence gate pending |
| Published peer compatibility | Peer ranges unchanged; packed cross-framework/minimum-version matrix pending |
| Hosted qualification | Matrix defined; execution pending |
| Independent review | Pending |
| Production release | **NO-GO** |

Next actions are to retain this H.2G.14 snapshot; run the packed-consumer matrix after the review boundary is agreed; reconcile Node 18 publication/build support against the plugin engine declaration; add hosted security/test-inventory checks in a separately reviewed change; and pursue the Metro fix only within a compatible, separately authorized dependency path. No merge, publication, framework migration, public peer-range change, or security exception is authorized by this assessment.
