# Directive 178-H.2G.16 — Toolchain Compatibility and Qualification Readiness

Date: 2026-11-10

Reference baseline: `main` at `c1e95d637ddbdda426448e8944c7bfe766e6b7fa`

Candidate: preserved H.2G.14 changes, carried into isolated branch `experiment/178-h2g16-qualification-readiness`

Disposition: **`NODE18_CONSUMER_LOCAL_PASS — NODE20_PUBLISH_BUILD_PROPOSED — HOSTED_QUALIFICATION_PENDING — SECURITY_HIGH_OPEN — PRODUCTION_NO_GO`**

This work is isolated from the H.2G.14 reference worktree. It preserves that candidate's lockfile, package changes, H.2G.14/H.2G.15 documents, local qualification evidence, and generated-bundle records. H.2G.16 adds proposed CI configuration, a locked packed-Core consumer fixture, comparison/audit scripts, and this report. It changes no published package metadata, peer range, package API, or production implementation. No GitHub workflow was run, and nothing was committed, pushed, published, or opened as a PR.

## 1. Node 18 publishing-toolchain investigation

The current publication workflow on `main` uses Node 18 for `npm ci`, the selected workspace build, and `npm publish`. In the candidate, `@rollup/plugin-terser@1.0.2` requires Node `>=20`; the locked graph also includes Node-20-only packages such as `serialize-javascript@7.1.4`, `smob@1.6.1`, and Vitest 4. `npm ci` under Node 18.20.6/npm 10.8.2 completed, but emitted six `EBADENGINE` warnings. The selected Core build and `npm pack` also completed under Node 18.20.6; that is observed behavior outside the declared engine requirements and does not establish a supported or reliable Node 18 build toolchain.

The proposed publication workflow now selects Node `20.20.2`, matching the candidate's supported build-tool boundary. This changes only the CI publishing environment. The Core package's existing `engines.node: ">=18"` metadata remains unchanged and is assessed separately as a consumer contract.

## 2. Independent Node 18 packed consumer evidence

Core was built and packed from the candidate under Node 18.20.6/npm 10.8.2. Its tarball was installed in a separate consumer fixture using the fixture's lockfile and Node 18.20.6/npm 10.8.2. TypeScript 5.6.3 compiled the packed declarations in both NodeNext and Bundler resolution modes with `strict: true` and `skipLibCheck: false`. All four consumer commands exited zero. This establishes a strict **declaration-consumer** pass for this one Core artifact on Node 18. It is not an application runtime test: Core's main entry requires browser globals such as `HTMLElement`.

The packed Node 18 consumer result is local-only and excluded from the proposed Git tree. Reference `H2G16-NODE18-CONSUMER` uses manifest `178-H2G16-SHA256SUMS`, SHA-256 `0d65a4a710becee9e929d34646d777bcbe065b708ebbc732845b2848aa3d0318`, and artifact SHA-256 `f0b9d2358db3a79712e14c7728bd7e2536cc641c3d42bb1e3b2e87e2dcec48a9`; see [178-H.2G.20 Evidence Index](./SECURITY-EVIDENCE-INDEX-178-H2G20.md#h2g16-node18-consumer). Key hashes:

| Input | SHA-256 |
| --- | --- |
| Candidate root lockfile | `3d7a4f8e4c4b536f5c33911128a76ce4a5807306dc0d76f1e02bd71adcf61c74` |
| Node 18 consumer fixture lockfile | `df0d060b13a0551c18122ab23d1d35341d18d6c4064d0137d5e340a140b6aff0` |
| Packed Core tarball | `3754a587b86b13f57ebcb66969d202353962163c7ccdd319ce26733d722a582e` |

The original H.2G.16 local result records Node `18.20.6`, npm `10.8.2`, the baseline checkout, and zero exit codes for fixture install, packed package install, NodeNext, and Bundler. H.2G.17 replaces the ambiguous `testedCommit` label with distinct baseline, candidate commit, candidate tree, lockfile, and tarball identities. Hosted reproduction remains pending.

## 3. Prepared hosted qualification changes

The new [`h2g16-qualification-readiness.yml`](../../.github/workflows/h2g16-qualification-readiness.yml) defines separate jobs for:

- Node 22.22.3 locked install, lint, packed React Native type consumer, workspace build, unit tests, and contracts. It records commit, lockfile hash, Node/npm versions, and uploads diagnostics.
- Full locked and production-only npm audit evidence. The job preserves both raw JSON reports and an explicit gate status. With the current remaining High, it is expected to fail as a visible release blocker.
- Baseline-versus-candidate test identity and outcome comparison. It records Vitest JSON for Core unit, data-loading, and contract suites, plus Node test discovery TAP output; missing identities, added identities, or changed pass/skip/fail states fail the comparison.
- Core build and pack under Node 20 followed by the independent Node 18 packed declaration consumer. The consumer result records commit, Node/npm, root and fixture lock hashes, tarball hash, and each command exit status.

The comparison runner and audit-status summarizer are in `scripts/`. The Node 18 packed consumer is in `tests/consumers/core-node18/`. The workflow is a proposed change only; it has not run on GitHub. Existing CI, Tests, Phase 4 Certification, performance, replication, and branch-protection behavior are not removed or rewritten. Manual accessibility, Svelte 3/4/5, Solid contract, Android device, and iOS runtime gaps remain explicit in the [machine-readable qualification manifest](./178-H2G16-qualification-manifest.yml).

The assertion comparison now uses the pinned certified baseline `c1e95d637ddbdda426448e8944c7bfe766e6b7fa`, installs baseline and candidate dependencies separately, and records exact identities and pass/skip/fail statuses. It has one measured reporter-only identity mapping for a Vitest 1 versus Vitest 4 `test.each` name (`%s` versus `undefined`); statuses still must match. Vitest 1's single empty root ancestor is removed only when present in baseline reporter data. Event-dependent PR-base or previous-push selection has been removed. Hosted reproduction remains pending.

## 4. Validation record

| Check | Result |
| --- | --- |
| Clean root `npm ci` with Node 18.20.6/npm 10.8.2 | Exit 0; six unsupported-engine warnings |
| Candidate Core workspace build on Node 18.20.6 | Exit 0; package build toolchain remains outside declared engine support |
| Candidate Core pack on Node 18.20.6 | Exit 0 |
| Locked consumer fixture install on Node 18.20.6/npm 10.8.2 | Exit 0 |
| Packed Core NodeNext consumer | Exit 0; strict, `skipLibCheck: false` |
| Packed Core Bundler consumer | Exit 0; strict, `skipLibCheck: false` |
| New JavaScript scripts: `node --check` | Passed |
| H.2G.17 focused evidence-integrity tests | 9 passed; includes changed status/name, missing report, malformed audit output, simulated High, and absent fixture cases |
| H.2G.17 certified-baseline assertion comparison | Local pass: 703 identities on each side, zero differences, zero command failures; Vitest `1.6.1` versus `4.1.12`, Node `26.10.0` / npm `12.2.0` |
| H.2G.17 packed Node 18 consumer, built/packed with Node 20 | Passed with Node `18.20.6` / npm `10.8.2`; packed artifact was verified as an extracted package, not a workspace symlink |
| H.2G.17 source provenance | Base `c1e95d637ddbdda426448e8944c7bfe766e6b7fa`; no candidate commit exists; candidate snapshot SHA-256 `2a8810a14efbc90fee623cf3bcc83a90f654b9e508c78d424410ed21a4ecbcb4`; root lock SHA-256 `3d7a4f8e4c4b536f5c33911128a76ce4a5807306dc0d76f1e02bd71adcf61c74`; packed Core SHA-256 `3754a587b86b13f57ebcb66969d202353962163c7ccdd319ce26733d722a582e` |
| Hosted qualification workflow | Not run, as directed |
| Node 22.22.3 full suite job | Prepared, pending hosted run |
| Cross-framework packed consumers, live locked audit gate, assertion comparison | Pending hosted run; local assertion comparator and simulated audit-failure paths passed |

## 5. Blockers and decision

The Node 18 consumer declaration check passes locally, while using Node 18 to build the candidate emits engine warnings for dependencies that require Node 20. The publishing workflow is therefore proposed for Node 20; Core's public Node `>=18` metadata is retained and must continue to be supported by consumer tests.

The full audit still reports one High `image-size` entry through Metro. The production-only audit does not grant an exception. Svelte 3/4 are not in the declared peer range after ADR 179; the supported Svelte 5 packed-consumer check is being added. Solid contract parity, manual accessibility, Android physical-device certification, and iOS runtime certification remain unresolved. No H.2G.16 hosted job is yet qualified, and the prepared workflow definitions do not change the current release disposition.

Disposition at candidate preparation: **`H2G16_READINESS_CHANGES_PREPARED — LOCAL_NODE18_DECLARATION_PASS — HOSTED_RUN_PENDING — SECURITY_HIGH_OPEN — PRODUCTION_NO_GO`**. The subsequent H.2G.21 executive track below records the changed authorization and new technical work; the historical section remains as originally assessed.

## 7. Directive 178-H.2G.18 — Final candidate freeze and hosted-workflow review

This is a local-only freeze and workflow review of the preserved H.2G.16 candidate. No candidate source, dependency, manifest, workflow, package API, or production implementation was changed for H.2G.18. H.2G.18 raw comparison and integrity outputs are local-only and excluded from the proposed Git tree. Reference `H2G18-NODE20-QUALIFICATION` uses manifest `178-H2G18-NODE20-SHA256SUMS`, SHA-256 `58c0ad5838be99299e8f704a9a9afd2ea1433d137b41eeef4e60e7e54aca8550`; see [178-H.2G.20 Evidence Index](./SECURITY-EVIDENCE-INDEX-178-H2G20.md#h2g18-node20-qualification).

The candidate is based on `c1e95d637ddbdda426448e8944c7bfe766e6b7fa`; its deterministic source snapshot SHA-256 is `2a8810a14efbc90fee623cf3bcc83a90f654b9e508c78d424410ed21a4ecbcb4` across 367 included files, and the root lockfile SHA-256 is `3d7a4f8e4c4b536f5c33911128a76ce4a5807306dc0d76f1e02bd71adcf61c74`. The inventory records each included path, byte length, and SHA-256, plus the explicit excluded generated/evidence paths. The source snapshot is still uncommitted. Therefore there is no immutable hosted candidate commit SHA: the checkout is still the baseline commit, while the candidate changes are represented by the snapshot digest. Creating a commit was outside this directive's authorization; hosted qualification must wait until a separately authorized commit is created and its SHA is frozen.

### Node 20 focused validation

The H.2G.17 evidence-integrity test suite passed under Node `20.20.2` and npm `10.8.2`: 9 tests passed, with zero failures, skips, or todos. The certified-baseline comparator also passed under that runtime. It installed the baseline and candidate dependencies separately, built all six configured workspaces on each side, captured the Core unit, data-loading, contract, and Node test-discovery inventories, and cleaned up the detached baseline worktree. Baseline `c1e95d6` and candidate each produced 703 assertion identities; there were zero identity or status differences and zero command failures. The direct comparison with the preserved Node 26 candidate inventory also found 703 identities on both runs and zero identity/status changes. The single documented Vitest 1-versus-4 reporter-name exception remained exact; it did not normalize sibling identities or statuses.

| Check | Node 20 result | Evidence |
| --- | --- | --- |
| Evidence-integrity tests | 9/9 passed | Local-only evidence `H2G18-NODE20-QUALIFICATION`; manifest SHA-256 `58c0ad5838be99299e8f704a9a9afd2ea1433d137b41eeef4e60e7e54aca8550` |
| Certified baseline versus candidate | 703 / 703; zero differences; zero command failures | Local-only evidence `H2G18-NODE20-QUALIFICATION`; manifest SHA-256 `58c0ad5838be99299e8f704a9a9afd2ea1433d137b41eeef4e60e7e54aca8550` |
| Node 20 versus preserved Node 26 candidate inventory | 703 / 703; zero identity or status changes | Local-only evidence `H2G18-NODE20-QUALIFICATION`; manifest SHA-256 `58c0ad5838be99299e8f704a9a9afd2ea1433d137b41eeef4e60e7e54aca8550` |
| Frozen candidate inventory | 367 files; source snapshot and root lock hashes recorded above | Local-only evidence `H2G18-NODE20-QUALIFICATION`; manifest SHA-256 `58c0ad5838be99299e8f704a9a9afd2ea1433d137b41eeef4e60e7e54aca8550` |

### Hosted workflow execution-path review

The proposed workflow checks out the explicit pull-request head SHA (or push SHA), uses read-only `contents` permission, and does not alter branch protection. The Node 20 security job preserves `npm ci` stdout/stderr and exit status; audit capture preserves raw full and production-only JSON, stderr, and exit codes; the gate reparses those raw reports and cross-checks counts and exit-code consistency. Malformed or missing evidence exits 2. A structurally valid graph with a Critical or High finding, or any production-only finding, exits 1. Artifact uploads use `if: always()` and warn when earlier setup failures leave no files, so missing audit artifacts remain visible alongside a failed job.

The preserved H.2G.14 locked-graph audit contains one High `image-size` finding through Metro and the production-only audit contains zero. On that preserved evidence, the expected hosted security disposition is a valid blocked result (gate exit 1), not a clean pass or an evidence-parser failure. H.2G.18 did not rerun npm audit; the live hosted result remains pending. The prepared workflow has no cache that can substitute dependencies for the lockfile install. The assertion job uses the pinned baseline, separately installs both trees, and uploads comparison evidence after success or failure. The Node 18 consumer job builds and packs under Node 20, then tests the extracted tarball under Node 18; this remains declaration-consumer evidence, not an application runtime claim.

No hosted workflow, GitHub action, PR, commit, push, publication, exception, or production promotion was performed. Hosted qualification remains unexecuted because its checkout must target a real, immutable candidate commit. Security High, Solid contract coverage, manual accessibility, Android physical-device certification, iOS runtime certification, independent review, and the other open readiness gates remain unresolved. Svelte compatibility is limited to the Svelte 5 peer range by ADR 179, pending packed-consumer qualification.

Disposition: **`H2G18_LOCAL_NODE20_VALIDATION_PASS — CANDIDATE_SNAPSHOT_FROZEN — HOSTED_COMMIT_NOT_CREATED — SECURITY_HIGH_OPEN — PRODUCTION_NO_GO`**. H.2G.18's local checks are complete. Its hosted-candidate acceptance item remains blocked until a candidate commit is separately authorized and created; no hosted result is inferred from this local evidence.

## 8. Directive 178-H.2G.20 — Evidence reference closure

This documentation-only amendment replaces links to evidence directories excluded from the proposed Git tree with explicit local-only references. The H2G14/H2G15 security reports, this H2G16 report, and the machine-readable qualification manifest identify each local artifact by evidence ID, manifest ID, and SHA-256. The [H.2G.20 evidence index](./SECURITY-EVIDENCE-INDEX-178-H2G20.md) records each artifact category, producing directive, expected local or hosted location, digest where available, and availability status. Historical local evidence is labeled as excluded from the proposed Git tree; hosted evidence is labeled pending with no fabricated digest.

The local manifests were verified with `sha256sum -c`. The H2G14 manifest digest is `42226e5ed0b08b0329568fd95518b27c16aa8fd01b0cc3a486d4e669b3cdc5a8`; the H2G16 evidence manifest digest is `0d65a4a710becee9e929d34646d777bcbe065b708ebbc732845b2848aa3d0318`; and the H2G18 Node 20 evidence manifest digest is `58c0ad5838be99299e8f704a9a9afd2ea1433d137b41eeef4e60e7e54aca8550`. The H2G18 evidence manifest covers its raw result files and intentionally does not checksum this summary document, avoiding a self-referential digest. No local evidence is represented as remotely accessible.

H2G.20 changed documentation and the qualification manifest only. The root lockfile remains SHA-256 `3d7a4f8e4c4b536f5c33911128a76ce4a5807306dc0d76f1e02bd71adcf61c74`; the 703/703 assertion result is unchanged; the React Native generated bundle remains byte-identical to the parent. The updated source snapshot is `73c12b432cb305d01da0406d401e289fd7f33f1bddd5f8ab58b13f0c8994f91f` across 368 included files. The proposed Git tree was recalculated using a temporary index; the real index remains empty. No commit, push, PR, hosted workflow, or publication was performed. The Metro High and other release gates remain open; `PRODUCTION_NO_GO` remains in effect.

## 8. H.2G.21 executive-track update — Metro and Svelte

The CTO fast-track directive authorizes isolated P0 troubleshooting while the H.2G.20 commit remains immutable. The candidate was pushed separately as commit `e2733eb2a4bc826e2cdf0023afd852c3c01ffb5c` on PR #65. Hosted workflows ran on that exact head: CI, Tests, Phase 4 Certification, Phase 4 Performance Baseline, Phase 4 End-key Replication, and the Node 22 qualification passed; the locked audit gate failed as expected with 0 Critical, 1 High, 13 Moderate, and 5 Low. The High was `image-size` through Metro 0.81.5. The production-only audit was zero. The audit check was not weakened.

The Metro remediation remains a separate workstream and is not claimed as closed by this Svelte change.

The CTO selected Svelte 5 only. ADR 179 limits `@smilodon/svelte` to peer `^5.0.0` and versions the compatibility-contract change as package 2.0.0. Svelte 3/4 are explicitly unsupported by this artifact; no separate legacy package is claimed. The packed Svelte 5.57.3 consumer passed strict TypeScript checking with `skipLibCheck: false` and a production Vite build locally; hosted Node 20 qualification remains pending. This narrows the published compatibility contract and is included in the release change summary.

These workstreams remain separate from the frozen H.2G.20 candidate and require their own hosted evidence. Solid contract coverage, manual accessibility, Android physical-device certification, and iOS runtime certification remain unresolved. No merge or publication is authorized by this update; `PRODUCTION_NO_GO` remains in effect.

## 6. Directive 178-H.2G.17 — CI reliability and evidence integrity amendment

This local-only amendment hardens the three proposed qualification helpers and their workflow. The comparator pins the certified `c1e95d6` baseline, keeps separate `npm ci` installations, emits original reports and logs, and fails on missing/malformed reports, command failures, changed identities, or changed statuses. The exact empirically observed `test.each` name difference is recorded above and in the comparison JSON. Its local run reports 703 identities per side and zero differences. It does not imply hosted qualification.

The audit helper now validates npm's vulnerability-count schema and detailed report, captures raw stdout, raw stderr, and exit codes for full and production-only audit commands, and reparses the preserved raw JSON at gate time to cross-check the summary counts and exit codes. It separates invalid evidence (exit 2) from a valid but policy-blocked graph (exit 1). Local tests exercised a clean synthetic graph, a simulated remaining High, malformed output, command execution failure, and missing gate JSON. Raw failure output and status records are local-only and excluded from the proposed Git tree. Reference `H2G17-FAILURE-PATHS` uses manifest `178-H2G16-SHA256SUMS`, SHA-256 `0d65a4a710becee9e929d34646d777bcbe065b708ebbc732845b2848aa3d0318`; see [178-H.2G.20 Evidence Index](./SECURITY-EVIDENCE-INDEX-178-H2G20.md#h2g17-failure-paths).

The Node 18 consumer runner records `baseCommit`, nullable `candidateCommit`, `checkoutCommit`, a deterministic candidate tree digest, root and fixture lock hashes, tarball hash, Node/npm versions, and exact invocations. The final local Node 18 run consumed the packed Core tarball (SHA-256 `3754a587b86b13f57ebcb66969d202353962163c7ccdd319ce26733d722a582e`) and passed strict NodeNext and Bundler declaration checks; the installed package directory was confirmed not to be a symlink. The source was uncommitted, so `candidateCommit` is correctly null and the immutable snapshot identity is `2a8810a14efbc90fee623cf3bcc83a90f654b9e508c78d424410ed21a4ecbcb4`.

Workflow reliability changes include a pinned baseline rather than event-derived SHA, checking out the exact candidate head, `if: always()` artifact uploads with warning behavior where an earlier setup stage may leave partial evidence, raw npm install logs, read-only repository permissions, and a non-cancelling concurrency group. No branch protection was changed. Local YAML/syntax, focused test, and diff checks are recorded with this amendment. No hosted workflow, commit, push, PR, merge, or publication was performed. The one High `image-size` finding remains open; production remains **NO-GO**.
