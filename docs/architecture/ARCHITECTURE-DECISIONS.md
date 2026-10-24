# Architecture Decisions — Smilodon 1.x Modernization

Status snapshot: approved direction for continued 1.x development, based on the v1.10.0 tree at `b0216e6ed7356cfb2e8236767cd3694061449c79` (2026-10-24). This record distinguishes accepted direction from unresolved design choices; it is not authorization to implement every proposal immediately.

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

Phase 0 records the current behavior; Phase 1 reproduces/characterizes gaps; Phase 3 may implement compatible corrections after API decisions. Scope must include:

1. Static item lists, client-side search, and optional local progressive loading.
2. Host-backed server search with configurable page size and page- or cursor-based pagination.
3. Query change/reset, request cancellation or generation guards, end-of-data, duplicate-page policy, and errors/retry.
4. Selection/label persistence when selected records are absent from current search results or loaded pages.
5. Global defaults, per-instance configuration, runtime `updateConfig`, and adapter forwarding precedence.
6. Loading/busy-state ownership and disposal while requests are pending.
7. Deterministic core and affected-adapter tests for concurrency, empty pages, repeated signals, failure, teardown, and selection invariants.

Compatibility rule: extend current event/callback contracts where possible. Do not introduce a second pagination system until the current fields and callback sequence are characterized. An empty page/end-of-data signal and whether pagination is controlled by the host or a first-party optional `DataSource` are open design decisions.

## Unresolved decisions requiring ADR or evidence

| Topic | Current evidence / question | Required next step |
| --- | --- | --- |
| Search E2E validity | Search implementation filters loaded items, while several skipped E2E tests say filtering is absent | Replace stale skip commentary with active exact-result tests; do not infer implementation absence from the comments |
| Pagination fields | Some `InfiniteScrollConfig`/`LoadMoreConfig` fields are declared but no runtime read sites were found in the 1.10.0 core source inventory | Decide field-by-field: implement and test, document inert/deprecated status, or reserve removal for 2.0 |
| `setItems` append/replace | Core `setItems` replaces the loaded collection; page accumulation is host-managed | Decide whether to preserve host accumulation or offer a compatible append/data-source operation |
| Page vs cursor | Current load-more signal carries a numeric page | Decide if a generic cursor contract is additive and how numeric callback compatibility is maintained |
| End-of-data and errors | Core emits a request and busy state but has no general end-of-data/cancel/retry API | Define host acknowledgements and error/retry transitions before implementation |
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

These phase numbers refer to the proposed modernization sequence, not the historical Phase 4 virtualization certification record. Phase 0 establishes the capability/API/evidence baseline. Phase 1 investigates and reproduces prioritized issues. Phase 2 strengthens engine authority. Phase 3 addresses host/data-source and pagination contracts. The modernization sequence's Phase 4 would harden guarded virtualization; it does not supersede the historical certification or authorize production activation. Accessibility, lifecycle, compatibility, and tests remain continuous requirements. Later phases extract the Web Component incrementally, expand adapter parity, certify, and govern release. Each implementation phase requires its own scoped approval and exit evidence.
