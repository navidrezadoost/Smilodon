# Architecture Decisions — Smilodon 1.x Modernization

Status snapshot: approved direction for continued 1.x development, based on the v1.10.0 tree at `b0216e6ed7356cfb2e8236767cd3694061449c79` (2026-10-24). Phase 1 characterization and the Phase 2A search/pagination contract are closed. The approved 1.11.x acknowledged data-loading protocol is recorded in [Phase 2A — Search and Pagination Contract Design](./PHASE-2A-SEARCH-PAGINATION-CONTRACT.md). Phase 2B authorizes only a DOM-independent internal request coordinator and deterministic contract tests. Public component and adapter integration, package/version changes, and production viewport virtualization remain unauthorized.

## Accepted decisions

| ID | Decision | Consequence |
| --- | --- | --- |
| ADR-001 | Evolve the existing Smilodon repository and its seven package surfaces | Do not start a parallel successor implementation or rewrite the runtime wholesale |
| ADR-002 | Preserve backward-compatible behavior throughout 1.x; reserve breaking changes for 2.0.0 | Keep names, defaults, event shapes/order, adapter conventions, and legacy obligations until a migration plan is approved |
| ADR-003 | Target 1.11.x for the next development series | Additive work may be planned for 1.11.x after Phase 0 baseline review |
| ADR-004 | Progressively strengthen semantic state authority in the existing headless engine | `EnhancedSelect` remains the public facade while responsibilities move incrementally behind tested contracts |
| ADR-005 | Extract component responsibilities incrementally | Avoid a broad refactor; each extraction must preserve existing behavior and have focused regression coverage |
| ADR-006 | Treat adapters as compatibility surfaces requiring independent evidence | Core tests alone do not establish React, Vue, Svelte, Solid, Vanilla, React Native Web, or native WebView parity |
| ADR-007 | Production viewport virtualization remains disabled | Guarded private activation stays test-only unless a separate production-activation decision passes the release gates |
| ADR-008 | Use evidence-based gates and keep implementation, verification, certification, and release approval distinct | Claims must identify the tested scope; manual AT and release decisions remain separate from automated CI |
| ADR-009 | Prioritize search, pagination, and infinite-scroll correctness as a named workstream | Inventory existing `pageSize`, `initialPage`, `loadMore`, and `infiniteScroll` contracts before adding APIs |
| ADR-010 | Approve an opt-in acknowledged data-loading protocol for the 1.11.x target | Preserve legacy defaults and behavior; implement and verify the internal coordinator before any public component or adapter integration |

## Target dependency direction

```text
Framework adapters / Web Component / platform renderer
                    ↓
       Browser effects and lifecycle ownership
                    ↓
       Data-source and virtualization services
                    ↓
     DOM-independent semantic selection engine
```

The engine owns semantic decisions and stable selection identity. Renderers own presentation and DOM references. Data-source code owns request/cancellation policy. Adapters translate framework conventions rather than independently defining selection rules. The existing source only partially realizes this target; the diagram is a direction, not a claim of completed separation.

## Named search and pagination workstream

Phase 0 recorded the current behavior and Phase 1 characterized gaps. Phase 2A closed the contract design; Phase 2B now implements only its transport-neutral internal coordinator. Public component and adapter integration requires a later scoped authorization. The approved contract covers:

1. Static item lists, client-side search, and optional local progressive loading.
2. Host-backed server search with configurable page size and page- or cursor-based pagination.
3. Query change/reset, request cancellation or generation guards, end-of-data, duplicate-page policy, and errors/retry.
4. Selection/label persistence when selected records are absent from current search results or loaded pages.
5. Global defaults, per-instance configuration, runtime `updateConfig`, and adapter forwarding precedence.
6. Loading/busy-state ownership and disposal while requests are pending.
7. Deterministic core and affected-adapter tests for concurrency, empty pages, repeated signals, failure, teardown, and selection invariants.

Phase 2B does not integrate the coordinator with `EnhancedSelect`, alter adapters, or change public defaults/events. Those are later increments and require their own acceptance evidence.

Compatibility rule: extend current event/callback contracts additively and keep the acknowledged protocol opt-in. The host owns transport, cancellation controllers, response transformation, accumulation, and deduplication; the internal coordinator owns request identity, progression, completion acceptance, and stale rejection. Empty, exhausted, failed, cancelled, page, cursor, and retry semantics are specified by the approved Phase 2A contract. A first-party transport-owning `DataSource` is not approved.

## Unresolved decisions requiring ADR or evidence

| Topic | Current evidence / question | Required next step |
| --- | --- | --- |
| Search E2E validity | Search implementation filters loaded items, while several skipped E2E tests say filtering is absent | Replace stale skip commentary with active exact-result tests; do not infer implementation absence from the comments |
| Acknowledged coordinator integration | Phase 2A approved request identity, page/cursor progression, completion, error, retry, and lifecycle semantics; Phase 2B remains internal and DOM-independent | Complete coordinator tests first; public `EnhancedSelect` and adapter integration needs separate authorization and compatibility evidence |
| Global function config | Config clone uses JSON serialization despite function-valued callbacks/resolvers | Reproduce through `configureSelect` and instance construction; treat as risk until confirmed |
| Renderer security/CSP | Security helpers exist and historical docs contain caveats about HTML sanitization and dynamic evaluation | Audit current safe defaults, CSP behavior, and supported trusted-HTML contract before making security claims |
| Form and shadow-root labels | External IDREF forwarding into internal shadow control is documented as unsupported | Decide whether an interoperable solution is required; do not promise cross-root IDREF behavior without browser proof |
| Variable-height rows | Guarded virtualizer has measurements but variable heights are not certified | Keep as a separate capability gate after fixed-height mode |
| React Native architecture | Native WebView and RN Web are distinct implementations with differing surfaces | Decide target demand and test parity; evaluate a native renderer before implying equivalence |
| SSR/hydration | Current runtime is browser-first | Define server-safe imports, placeholder behavior, upgrade timing, and hydration contract per adapter |

## Explicit prohibitions for Phase 0

- No production runtime edits or broad refactors.
- No public API removals or behavior/default changes.
- No enabling public viewport windowing or removing the private guard.
- No new performance threshold enforcement or WCAG/conformance claim.
- No release publication as a side effect of documentation approval.

## Phase sequence reference

These phase numbers refer to the proposed modernization sequence, not the historical Phase 4 virtualization certification record. The separately named Phase 2A/2B search-and-pagination workstream above is not the modernization sequence's Phase 2 milestone. Modernization Phase 0 establishes the capability/API/evidence baseline. Phase 1 investigates and reproduces prioritized issues. Phase 2 strengthens engine authority. Phase 3 addresses host/data-source architecture. The modernization sequence's Phase 4 would harden guarded virtualization; it does not supersede the historical certification or authorize production activation. Accessibility, lifecycle, compatibility, and tests remain continuous requirements. Later phases extract the Web Component incrementally, expand adapter parity, certify, and govern release. Each implementation phase requires its own scoped approval and exit evidence.
