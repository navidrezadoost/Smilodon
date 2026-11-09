# Directive 178-G — Production Readiness Gap Audit

Audit date: 2026-11-09

Disposition: **`READINESS_GAPS_RECONCILED — PRODUCTION_NO_GO`**
Baseline: `main` at `5a407954302a5152c94d5dcaf900ee4adc71785c` (PR #61 merge)

This is an evidence-only audit. It changes no production implementation, package manifest, lockfile, or dependency. It does not certify a gate by inference. PR #62 remains a separate Draft and is not runtime certification evidence.

## 1. Baseline and method

The audit was performed in a clean worktree based on the exact verified `origin/main` commit above. The original IDE worktree was left untouched. GitHub reports CI run [42398060624](https://github.com/navidrezadoost/Smilodon/actions/runs/42398060624), Tests run [42398060693](https://github.com/navidrezadoost/Smilodon/actions/runs/42398060693), and Phase 4 Certification run [42398060634](https://github.com/navidrezadoost/Smilodon/actions/runs/42398060634) successful on that commit. These establish only the checks and scenarios those workflows actually ran.

The locked dependency audit used Node `20.20.2`, npm `10.8.2`, `package-lock.json` SHA-256 `e09d2f6ff33c905943cd2eb93b57a0887f5193b13e9bec0a04819c0282f447c5`, and:

```sh
npm audit --package-lock-only --json
npm audit --package-lock-only --omit=dev --json
```

Both full JSON outputs and the parsed audit context are preserved in [`178-g-evidence/`](./178-g-evidence/). The source-level skip inventory was produced by scanning test sources under `tests`, `packages`, and `scripts` for skipped/todo/fixme declarations and expanding the dynamic React `pendingTests` list. It counts source definitions, not browser-project executions. No test suite was run as part of this audit; hosted results are attributed to their recorded workflow runs.

## 2. Dependency security audit

The full locked-graph audit reports **45 vulnerable package entries**: 6 critical, 15 high, 21 moderate, and 3 low. These are package entries, not 45 distinct CVEs. Thirteen entries are direct dependencies and 32 are transitive. By severity, direct/transitive counts are: critical 3/3, high 2/13, moderate 7/14, and low 1/2.

The npm production-only omission audit reports zero findings. Every package location reported by the full audit is marked `dev: true` in this repository lockfile. This means the current workspace's production install graph has no reported findings under that command; it does **not** establish that peer dependencies resolved by downstream applications are clean. Several vulnerable dependencies (including `solid-js`, `svelte`, and `vue`) are also package peers, and consumer-resolved graphs were not audited here.

| Severity | Package entries | Direct / transitive | Exploitability assessment | npm remediation signal |
| --- | ---: | ---: | --- | --- |
| Critical | 6 | 3 / 3 | Advisory severity is high; reachability and exploitable invocation in Smilodon build/test usage are unassessed. No exploitation is evidenced. | 3 generic signals, 3 named targets, none without a fix signal. |
| High | 15 | 2 / 13 | Same limitation; inspect the advisory and whether affected code paths are reachable in trusted CI/build inputs. | 13 generic signals, 2 named targets, none without a fix signal. |
| Moderate | 21 | 7 / 14 | Same limitation; no claim of product runtime exposure. | 6 generic signals, 10 named targets, 5 without a fix signal. |
| Low | 3 | 1 / 2 | Same limitation. | 1 generic signal, 1 named target, 1 without a fix signal. |

Across all entries, npm reports a generic `fixAvailable: true` for 23, a named target version for 16, and no fix for 6. Named targets include semver-major upgrades (for example Vitest 4.x and `@vitest/ui` 5.x); they are not approved remediation instructions. The Svelte toolchain entries currently reporting no fix need a separate reassessment when advisory or upstream versions change. The detailed package/advisory/range/affected-location/fix data is in [`npm-audit-locked-full-2026-11-09.json`](./178-g-evidence/npm-audit-locked-full-2026-11-09.json). The production omission result is in [`npm-audit-locked-production-only-2026-11-09.json`](./178-g-evidence/npm-audit-locked-production-only-2026-11-09.json).

Direct vulnerable entries are owned by the root lint/test toolchain and the Core, Vue, Svelte, Solid, and Vanilla workspace toolchains. Critical examples include Vitest and `@vitest/ui` (root test tooling), and `solid-js` (Solid peer/development dependency); critical transitive examples include `seroval`, `shell-quote`, and `tinypool`. The npm severity and advisory details are preserved verbatim in the audit snapshot. This review did not reproduce advisory proof-of-concept behavior or determine whether each affected code path is reachable. All findings remain open security work; no dependency update is made in this PR.

**Next action:** assign a separate security remediation owner to review advisories and usage/reachability, prioritize direct and critical/high transitive entries, select compatible fixes, rerun the full audit and workspace/consumer CI, and separately audit supported downstream peer graphs. Do not apply upgrades as part of this evidence PR.

## 3. Skipped-test reconciliation

The source inventory contains **49 skipped definitions**: 43 dynamically skipped React contract cases and 6 explicit E2E/Core cases. The exact names, source locations, reason, classification, owner, and next action are recorded in [`skipped-test-inventory-2026-11-09.json`](./178-g-evidence/skipped-test-inventory-2026-11-09.json).

| Source | Count | Finding and classification | Owner / next action |
| --- | ---: | --- | --- |
| `tests/contracts/react.contract.spec.ts` | 43 | The source explicitly labels these generated skips “not implemented yet.” They span props/state, selection, search, keyboard, events, imperative APIs, grouping, accessibility/focus, and large lists. This is missing React adapter contract coverage, not an established unsupported-feature list. | React adapter maintainers: implement and activate the contracts, or make a reviewed explicit scope decision for each removed claim. |
| `tests/e2e/scenarios/search.spec.ts` | 4 | Skip comments say local client-side filtering is unimplemented, but current Core source and capability records describe local filtering as implemented. The comments are stale; the exact filtering assertions remain an E2E verification gap. Remote search transport remains host-owned. | Core/E2E maintainers: update stale comments, activate the four browser assertions, and keep remote transport ownership explicit. |
| `tests/e2e/scenarios/multi-select.spec.ts` | 1 | “Keep dropdown open” is skipped because blur closes it. The inventory found no current explicit product decision declaring this unsupported. Treat as an unresolved interaction contract, not a deliberate exclusion. | Core/adapter maintainers: decide and document expected behavior, then test it across maintained adapters. |
| `packages/core/tests/styling-contract.spec.ts` | 1 | Legacy `--select-*` CSS variable alias support is unverified. A skipped compatibility test alone does not establish that the aliases are intentionally unsupported. | Core maintainers: confirm compatibility policy; either restore/assert aliases or document a reviewed removal. |

In the successful main CI run, the Core unit suite logged 603 passed and 1 skipped; React contracts logged 12 passed and 43 skipped; E2E logged 15 skipped executions across Playwright projects (the source inventory has 5 E2E definitions). These skips do not turn the corresponding gaps into passes. No skipped test in this inventory is confidently classified as deliberate unsupported behavior based solely on its code comment.

## 4. Release blocker matrix

“Passed” below is limited to the explicitly named run and scope. Open items remain blockers to broad production readiness.

| Gate | Status and reproducible evidence | Responsible area / next action | Can progress without Android hardware? |
| --- | --- | --- | --- |
| Locked dependency security | **Open.** npm 10 audit on the baseline lock reports 45 entries (6 critical, 15 high, 21 moderate, 3 low); all corresponding lock locations are dev-only. Production omission audit is zero, with peer-consumer limitation described above. | Security and workspace toolchain owners: assess advisory reachability and compatible fixes in a separate change; audit downstream peer graphs. | Yes |
| Skipped tests / adapter contract parity | **Open.** 49 source definitions; 43 React cases are explicitly pending; 6 additional skipped E2E/Core cases require reconciliation. The main run’s skipped counts are recorded above. | React, Core, and adapter owners: close or explicitly scope each gap and activate applicable assertions. | Yes, except any specifically native scenario |
| Browser accessibility | **Automated scoped pass; human accessibility gate open.** Main Phase 4 run passed guarded Chromium/Firefox/WebKit scenarios. Manual NVDA/JAWS/VoiceOver assessment and WCAG conformance are not established; cross-shadow-root host ID references remain a documented limitation. | Accessibility/Core: complete and document manual AT sessions, review defects, and publish a current support policy. | Yes; desktop AT platforms required, not Android device |
| Browser support policy | **Unverified as a current policy.** `docs/compliance/BROWSER-SUPPORT.md` explicitly identifies itself as historical and not a current certification or SLA. Pinned browser tests are scoped behavior evidence, not a complete browser/version support commitment. | Release/docs owner: publish a maintained support matrix tied to actual CI versions and support commitments. | Yes |
| Packed consumer declaration compatibility | **Merged qualification evidence; ongoing coverage incomplete.** Core/Vue/Vanilla/RN declaration remediations are on `main`; PR evidence is retained in architecture records. Current main CI includes the packed React Native native NodeNext/Bundler consumer with strict mode, `skipLibCheck: false`, and no DOM library. Equivalent ongoing packed consumer gates for every package/condition are not established by the current workflows. | Package/release engineering: add or periodically run strict packed consumer checks for all supported package entries and conditions. | Yes |
| Browser performance and release thresholds | **Report-only; no release budget accepted.** Main’s pinned End-key workflow and Phase 4 evidence validate bounded benchmark provenance/scenarios, not a population latency target. The recorded evidence is small-sample and includes censored/skipped cases; broad multi-run/machine reproducibility is not established. | Performance/Core: define a decision-backed budget and sample plan, then collect sufficient independent runs before any gate changes. | Yes |
| Public viewport virtualization | **NO-GO.** `virtualize` currently enables chunked rendering but ultimately mounts all results; it does not bound DOM to the visible window. True windowed behavior remains behind a private/test seam. | Core maintainers/release authority: complete certification and separately authorize public activation; do not infer from the guarded browser test. | Yes |
| React Native Android runtime | **Blocked by physical device.** PR #62 remains Draft at verified head `efeb75165cc6403822a93f35368d57939fb45b58`, with zero independent reviews. Prior evidence records packed APK/build/install and partial bridge interactions plus QEMU crashes in two renderer modes; no complete native pass or attributable product defect. 178-F.5 confirms no physical device is available. No further emulator experimentation is authorized. | React Native QA/maintainer: resume only with a physical Android device; preserve PR #62 as Draft and do not call it certified. | No |
| React Native iOS runtime | **Unqualified.** No iOS simulator/device runtime result or current iOS runtime workflow is recorded. The native type boundary and web/browser evidence do not establish iOS behavior. | React Native QA: qualify on supported iOS simulator/device and record exact OS/runtime/dependency versions and bridge scenarios. | Requires macOS/iOS simulator or device |
| Solid adapter parity | **Dedicated parity evidence incomplete.** Current workflow matrix runs React, Vue, Svelte, and Vanilla contract/E2E jobs; no corresponding Solid contract job/spec is configured. Generic browser/core success does not prove Solid wrapper parity. | Solid adapter owner: add a direct contract and browser suite for the maintained Solid entry. | Yes |
| Independent review and release governance | **Open.** PR #62 is Draft and has no independent submitted reviews. This 178-G report is proposed as a Draft evidence PR; neither CI success nor audit authorship substitutes for independent approval. | Authorized maintainer/reviewer: independently review evidence PRs and runtime claims before merge; production remains NO-GO until release gates are resolved. | Yes |

## 5. Gate interpretation

The current main CI, Tests, and Phase 4 Certification runs are successful for their configured scope. They do not establish broad package parity, manual accessibility conformance, accepted performance budgets, viewport-bounded production virtualization, Android runtime certification, or iOS runtime certification. The 178-F physical Android dependency remains external and unchanged by this audit.

The browser policy document is historical, so this report does not reuse its old browser/version checkmarks as current support guarantees. The capability and Phase 4 records are used as scoped engineering evidence and have been cross-checked against current workflow/test configuration where possible.

## 6. Evidence-only change and disposition

This change adds this audit report, the locked npm audit outputs/context, the skipped-test source inventory, and an evidence hash manifest. It does not change code, tests, dependencies, package metadata, workflows, integrity rules, or PR #62. No checks were run locally for this documentation-only audit. The exact source data and reproduction commands are preserved for independent review.

Disposition: **`178-G_AUDIT_COMPLETE — REMEDIATION_AND_INDEPENDENT_REVIEW_OPEN — PRODUCTION_NO_GO`**. The evidence PR must remain unmerged until an independent authorized reviewer approves it and required checks pass. Passing this audit-document PR will not itself close any blocker in the matrix.
