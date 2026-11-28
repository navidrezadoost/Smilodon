# W1-P2 Task 2 — Angular Framework-Integration Readiness Assessment

**Increment:** W1-P2 (Extraction → Framework Readiness) — Task 2
**Type:** Bounded, **read-only** readiness assessment (assessment only)
**Baseline commit:** `a305c424293e660111d8a49e95a5c642702987e7` (W1-P2 Task 1 closed)
**Branch:** `codex/w1-p1-3-keyboard-characterization`
**Authorized scope (Lead directive):** assessment only. **NO** production modifications, **NO** new Angular package, **NO** SSR remediation, **NO** test changes. Finish with a concrete Wave 2 entry recommendation and the smallest possible implementation slices.

---

## 0. Executive summary

The Smilodon runtime is a **browser custom element** (`<enhanced-select>`) that owns **all** rendering, selection, keyboard, ARIA, and data-loading behavior in a shadow root. Every existing adapter (React, Vue, Svelte, Vanilla) is a **thin imperative host binding**: on mount it ensures the element is defined, pushes items/values/config, subscribes to DOM events, and exposes imperative methods. **There is no framework-framework sharing beyond the custom element contract.**

This is the single most important fact for Angular: **an Angular adapter does not need any engine extraction or wrapper-parity work.** The selection authority is already engine-owned (W1-P2 Task 1, closed); the observable integration surface is the DOM custom-element contract + its imperative methods + its `CustomEvent`s.

The blockers to a *thin* Angular adapter fall into two tiers:

1. **Fatal for the naive path — SSR import/runtime safety (API-075 / API-076).**
   - `@smilodon/core`'s **package entry throws at import** in a no-DOM process (`ReferenceError: HTMLElement is not defined`) because the components `class X extends HTMLElement` and self-register via an **unguarded** `customElements.get(...)` at module top-level (`enhanced-select.ts:9107`). This is the recorded **API-075 Partial** limitation.
   - Even if the import were guarded, the `EnhancedSelect` **constructor eagerly builds the entire shadow DOM** (`attachShadow`, `_createContainer()`, `_initializeObservers()`, …), so *instantiating* the element server-side would also fail.
   - Consequence: **Angular Universal / SSR cannot import `@smilodon/core` on the server today.** This is the hard blocker to an SSR-capable Wave 2. A **browser-only** Angular (CSR) adapter is *not* blocked by this — it never runs the element code on the server.

2. **Design constraints (not blockers) — a thin adapter must bind by *property/method*, not by attribute.**
   - The element's `observedAttributes` is **only `['aria-label','aria-description','aria-busy']`**. All behavior-indicating attributes (`multiple`, `searchable`, `disabled`, etc.) are **NOT** observed and do **NOT** drive behavior. Behavior is driven **exclusively** through `updateConfig()`, `setItems()`, `setSelectedValues()`, etc. An Angular adapter that binds `<enhanced-select [multiple]="...">` as an HTML *attribute* would silently do nothing; it must call the imperative API.
   - There is already an **Angular-specific hack in `connectedCallback`** (`this.style.display = 'block'`, commented "for Angular compatibility"), so Angular was previously exercised at some point; a review slice should evaluate whether it is still needed.

**Recommendation:** Wave 2 should proceed as a **browser-only (CSR) thin Angular standalone component first**, reusing `@smilodon/core` unchanged, gated behind an SSR story that is explicitly **out** of Wave 2 unless the Lead authorizes an SSR-safe entry-point remediation (API-075). The corrective SSR work is small and well-understood (see §6) but is **production-source change** and therefore outside T2 and outside a "thin adapter" mandate.

---

## 1. Existing headless capabilities vs component-owned behavior

The engine (`packages/core/src/engine/**`) is fully headless and DOM-free (proven by W1-P2-T1 Node SSR specs). But **the headless engine is not the integration surface** — the **custom element** is. The distinction matters because an Angular adapter binds to the element, not the engine.

| Concern | Owner | Evidence | Angular adapter impact |
| --- | --- | --- | --- |
| Selection membership / policy | **Engine** (`selection-policy.ts`) | `applySelectionRequest`; W1-P2-T1 oracle parity | None — adapter just reads `getSelectedValues()` |
| Selection ordering, required, disabled, maxSelections, allowDeselect | **Engine** (`SelectionConfig`) | W1-P2-T1 evidence | None |
| Item identity/registry | **Engine** (`item-registry.ts`) | `createDefaultItemAdapter` | Adapter only supplies items via `setItems()` |
| Keyboard navigation (open/close/typeahead/range) | **Platform component** (DOM) | `_selectKeyboardRange` → engine REPLACE | None — element handles it internally |
| ARIA / roles / live region | **Platform component** | `_syncListboxAccessibility`, `_syncComboboxAccessibility` | None — but note observed attrs are aria-only |
| Rendering / shadow DOM / chips / popup | **Platform component** | constructor builds shadow tree | None — but this is why SSR instantiation fails |
| Data loading (search/pagination/infinite scroll) | **Platform component + data-loading coordinator** | `startDataLoading`, `getDataLoadingState`, `completeDataRequest` | Adapter wires `search`/`loadMore` events + completion, same as React |
| Custom renderers (option/group/empty/loading) | **Platform component**, via DOM-returning callbacks | `optionRenderer`, `groupHeaderRenderer`, `empty-state` slot | Angular must bridge DOM nodes or slots (like React portals) |
| Events | **Platform component** dispatches `CustomEvent`s (bubbles+composed) | `_emit`, event map in `types.ts` | Adapter maps events → Angular `@Output()`s |
| Config | **Platform component** via `updateConfig()` | `updateConfig(config: SelectInstanceConfig)` | Adapter builds config object from Angular `@Input()`s |

**Conclusion:** There is no component-owned behavior that an Angular adapter needs to *re-implement*. The adapter's job is purely to bridge Angular's `@Input()`/`@Output()` model to the element's property/method + event surface — identical to what Vue/Svelte already do. **No engine refactor is required for Wave 2.**

---

## 2. Angular integration boundaries

All existing wrappers converge on the same lifecycle. The Angular equivalent is a **standalone component** hosting the `enhanced-select` element, binding by property/method, not attribute.

### 2.1 Inputs (Angular `@Input()` → element imperative API)

Because only `aria-*` are observed attributes, **inputs must map to method/property calls**, mirroring how React/Vue/Svelte build a `updateConfig` object:

| Angular input | Element call | Notes |
| --- | --- | --- |
| `@Input() items` / `groupedItems` | `setItems()` / `setGroupedItems()` | Plain-object arrays compared by value (React uses `areSemanticallyEqual`; Angular can use reference/iteration-diff) |
| `@Input() value` / `modelValue` / `defaultValue` | `setSelectedValues([...])` | Controlled vs uncontrolled parity with Vue `v-model` |
| `@Input() multiple/searchable/placeholder/disabled/required/error/…` | `updateConfig({ ... })` (single reconciled object) | Build once, dispatch on change; **do not** set raw attributes |
| `@Input() selectionConfig/multiSelectDisplay/scrollToSelected/config` | `updateConfig()` layering | Follow React precedence (adapter defaults then explicit core config) |
| `@Input() error` / `required` | `setError()` / `clearError()` / `setRequired()` | Dedicated methods exist |
| Custom renderers | property setter (`optionRenderer`, `groupHeaderRenderer`) + slots | Angular must bridge DOM/`<ng-template>` → element callbacks |
| form control | see §2.4 (Forms) | `ControlValueAccessor` |

### 2.2 Outputs (element `CustomEvent` → Angular `@Output()`)

Element dispatches these (from `SelectEventsDetailMap`): `select`, `open`, `close`, `search`, `pageLoaded`, `error`, `change`, `loadMore`, `remove`, `clear`, `emptyStateChange`, `diagnostic`. All are `bubbles:true, composed:true`. The adapter adds listeners on the host after upgrade and removes them on destroy (exact pattern in `packages/vue/src/Select.vue:724-733` and `:737-757`).

- `change` detail → `{ selectedItems, selectedValues }` → map to Angular `change` output + `ControlValueAccessor.onChange`.
- `select` detail → `{ item, index, value, label, selected, multi }`.

### 2.3 Lifecycle (mount/upgrade/configure/cleanup)

The element is a self-registering custom element; the browser upgrades the instance **after** creation. All wrappers handle this:

- React: dynamic `import('@smilodon/core')` then `customElements.define(...)` if absent; waits for readiness.
- Vue: `waitForUpgrade()` → `customElements.whenDefined('enhanced-select')` + retry loop up to 5 frames (`Select.vue:333-378`).
- Svelte: `onMount` → `await customElements.whenDefined(...)`.

**Angular equivalent:** in `ngAfterViewInit` (not `ngOnInit`), `await customElements.whenDefined('enhanced-select')` (or lazy-`import()` of core first), then set config/items/value and attach listeners. Guard all DOM access so it only runs on the browser (`isPlatformBrowser`). Cleanup in `ngOnDestroy`.

**Blocker-relevant:** on the server (`ngOnInit`/render phase), the element must **not** be touched and core must **not** be imported (API-075 throw). This is the SSR constraint in §3.

### 2.4 Forms

Element exposes `validate()`, `setRequired()`, `setError()`, `getSelectedValues()`. Angular `ControlValueAccessor` maps cleanly:
- `writeValue(values)` → `setSelectedValues()`
- `registerOnChange` hooked to the element `change` event
- `setDisabledState` → `updateConfig({ enabled: !disabled })`
- `validate()` for `NG_VALIDATORS`.

No new element API is needed.

### 2.5 Rendering ownership

**The element owns all rendering.** Angular must NOT attempt to manage the element's internal DOM (it is shadow-DOM encapsulated). Angular's only rendering responsibilities are: (a) host element creation + attribute/class/style binding, and (b) projecting anything into named slots / custom renderers. This matches the Svelte `<svelte:element>`/slot approach and the React portal approach for icon injection.

---

## 3. API-075 and minimum viable Angular SSR compatibility strategy

### 3.1 Current, verified state

- **API-075 (Partial, limitation recorded):** importing the package **entry** (`@smilodon/core`) in no-DOM Node **throws** `ReferenceError: HTMLElement is not defined`. Root cause: components `extend HTMLElement` at class-declaration time, and the module self-registers with an **unguarded** top-level `customElements.get('enhanced-select')` (`enhanced-select.ts:9107`). Evidence: `packages/core/tests/w1-p1-6-t3-ssr-import-safety.spec.ts` (API-075 test) + `W1-P1.6-CLOSURE-EVIDENCE.json`.
- **API-076 (Existing for tested utilities):** DOM access is deferred to *call time* for `utils/security.ts` / `utils/csp-styles.ts`. Not a general guarantee for all exports.
- **Second, deeper blocker beyond API-075:** even a guarded import is insufficient for *instantiating* the element server-side — the `EnhancedSelect` **constructor** eagerly builds the whole shadow DOM (`attachShadow`, `_createContainer`, `_initializeObservers`, …; `enhanced-select.ts:512-572`). Server rendering the element would fail regardless of import guarding.
- The Svelte multi-version ADR and the architecture decisions list **SSR/hydration as an explicit, separate qualification gate not yet passed** (`179-SVELTE-MULTI-VERSION-DISTRIBUTION-ADR.md:29`, `ARCHITECTURE-DECISIONS.md:61`).

### 3.2 Minimum viable SSR strategy for Angular (options, no implementation in T2)

**Option A — Defer element to browser (recommended for Wave 2).**
The Angular adapter renders only a **placeholder host** server-side (empty `<enhanced-select>` or a light-DOM skeleton), and performs **all** core import + element interaction in `isPlatformBrowser` after hydration. This requires:
- The Angular component must **not** statically `import` `@smilodon/core` at module top (would trigger API-075 on the server bundle). Use a **browser-only dynamic `import()`** guarded by `isPlatformBrowser`, exactly as React does.
- A server-rendered fallback that is hydration-stable (same tag/attributes on first client render to avoid hydration mismatch).

This makes Wave 2 SSR-capable **without touching core**, because the SSR failure is only triggered by importing/instantiating the element on the server — which Option A avoids.

**Option B — SSR-safe entry point in core (corrects API-075).** Add a side-effect-free export path (or guard the self-register/class-extension so the entry imports under no-DOM). This is a **production-source change** (API-075 remediation) — explicitly **NOT AUTHORIZED** in T2, and it does not by itself fix the *constructor* SSR problem (still needs Option A-style deferral for actual server rendering).

**Minimum viable conclusion:** For Wave 2, **Option A** (browser-deferred, dynamic import, `isPlatformBrowser` guard, hydration-stable placeholder) is the **shortest compatibility-preserving path** and needs **no core change**. API-075 remediation (Option B) buys a nicer SSR ergonomic but is neither sufficient nor necessary for a thin CSR-first adapter.

---

## 4. Reuse of the existing package without unnecessary engine refactoring

- **Reuse is fully viable and is the correct default.** All behavior lives in `@smilodon/core`; every existing adapter reuses it without engine changes.
- **No engine refactoring is needed.** The headless engine + platform component boundary already separates policy (engine) from DOM (component); Angular binds to the same DOM contract as React/Vue/Svelte.
- **Type reuse:** `@smilodon/core` exports all event-detail types, `SelectInstanceConfig`, `SelectionConfig`, `GroupedItem`, `EmptyStateContext`, etc. The Angular package can `import type` from core (type-only imports are erased and are **SSR-import-safe** — they do not execute the module). This parallels `packages/react/src/Select.tsx` which type-imports heavily from core while deferring the runtime import.
- **Public import-safe helpers already exist** for value equality (`arraysEqualByValue`, `valuesEqual`) — but note: these are re-exported from the *entry*, which throws under no-DOM. On the browser this is fine; on the server the adapter must not import them at top level (see Option A).

**Net:** the Angular adapter is a **~1 file** standalone component (plus a module + a CVA) that mirrors Vue/Svelte, reusing core unchanged. Suggested package location and build follow the existing per-framework `package.json` pattern (Vue/Svelte/React each have their own package). No changes to `packages/core/**`.

---

## 5. Prioritized list of actual blockers (mandatory vs deferrable)

### MUST (block a *thin* Angular adapter from shipping)
| # | Blocker | Severity | Class | Notes |
| --- | --- | --- | --- | --- |
| B1 | `@smilodon/core` cannot be imported on the server (API-075: unguarded `customElements.get` + `extends HTMLElement`; `enhanced-select.ts:9107`) | High **for SSR**; none for CSR | **Mandatory only if SSR is in scope** | Mitigated for Wave 2 by browser-deferred dynamic import (`isPlatformBrowser`), **no core change needed** |
| B2 | Element behavior is **not attribute-driven**; only `aria-*` observed. Inputs must call `updateConfig`/`setItems`/etc. | Medium | Design constraint (adapter must implement correctly) | If adapter naively binds attributes, features silently no-op — must be documented + implemented as method bindings |
| B3 | Custom element upgrade timing (instance not ready at creation) | Medium | Lifecycle constraint | Must gate on `customElements.whenDefined` / readiness before first `setItems` (all wrappers do this) |
| B4 | SSR instantiation of the element builds shadow DOM in constructor (`enhanced-select.ts:512-572`) | High **for true server-render of the element** | Mandatory only if the element must SSR-render | Avoided by rendering a placeholder server-side (Option A) |

### SHOULD (improve quality, can wait)
| # | Item | Class | Notes |
| --- | --- | --- | --- |
| S1 | Decide on/verify the Angular `style.display='block'` workaround in `connectedCallback` | Improvement | Validate whether still needed; do not alter core in Wave 2 unless proven |
| S2 | Framework-idiomatic custom-renderer bridging (`renderItem`/slots → element callbacks) | Improvement | Can start with default rendering; add custom renderers later (as Svelte did) |
| S3 | Forms integration (`ControlValueAccessor` + validators) | Improvement | Standalone component works without it; add CVA slice |
| S4 | Data-loading (search/pagination/infinite scroll) event wiring | Improvement | Mirror Vue/React `search`/`loadMore` wiring; can be a later slice |

### CAN WAIT / NOT BLOCKING
- Engine refactoring (not needed).
- API-075 remediation (§3 Option B) — nice ergonomic, not required for CSR-first.
- Full hydration equivalence for *internals* (shadow DOM is element-owned; only host placeholder needs hydration stability).

---

## 6. Wave 2 entry recommendation & smallest implementation slices

### Recommendation
**GO for a browser-only (CSR) thin Angular standalone adapter** that reuses `@smilodon/core` **unchanged**, as the Wave 2 entry. Treat **SSR as a follow-on** whose minimum-viable form is **Option A** (browser-deferred dynamic import + `isPlatformBrowser` guard + hydration-stable placeholder) — achievable **without any core production change**. If the Lead wants the element itself to server-render later, that is a separate **API-075 remediation** increment (production source), explicitly **NOT AUTHORIZED** today.

Rationale: the selection authority is already engine-owned and closed; there is no thin-wrapper parity work left; the only hard blocker (API-075) is *only* fatal to server-side import, which a CSR-first adapter sidesteps. This yields the **shortest compatibility-preserving path** to Angular Wave 2.

### Smallest implementation slices (each independently shippable; ordered)
1. **S1 — Package scaffold.** New `packages/angular` (standalone component, `@smilodon/core` peer dep), following the existing per-framework package.json/build pattern. *No core change.*
2. **S2 — Minimal standalone component (CSR).** `ngAfterViewInit` → `customElements.whenDefined('enhanced-select')` (browser-guarded) → `setItems`/`setSelectedValues`/`updateConfig`; `@Input()`s mapped to methods (per §2.1, **not** attributes); `ngOnDestroy` cleanup. Reuse type-only imports from core.
3. **S3 — Outputs.** Wire `select`/`change`/`open`/`close`/`search`/`loadMore`/`clear`/`emptyStateChange` → `@Output()`s; controlled-value parity.
4. **S4 — Forms.** `ControlValueAccessor` (`writeValue`→`setSelectedValues`, `change`→`onChange`, `validate`).
5. **S5 — SSR hardening (Option A).** Browser-only dynamic `import('@smilodon/core')`, `isPlatformBrowser` guards, hydration-stable placeholder. *No core change.* (Can be deferred past initial Angular support.)
6. **S6 (optional, gated) — API-075 remediation** for SSR-safe entry in core. **Requires explicit Lead authorization** (production source change); not needed for slices 1–5.

### Entry gate for Wave 2 (what must be true to start S1)
- Lead confirms **CSR-first** scope is acceptable (SSR deferred to S5 / Option A).
- Agreement that **no core refactor** is in scope; core is consumed as-is.
- Acceptance that API-075 remediation (S6) is **out of scope** unless separately authorized.

---

## 7. Authority & scope compliance (this task)

| Boundary | Result |
| --- | --- |
| No production source changed | Yes — read-only. No `packages/*/src/**` edits. |
| No new Angular package created | Yes — recommendation + slices only. |
| No SSR remediation | Yes — API-075/076/constructor SSR described, **not** fixed. |
| No test changes | Yes — existing specs only *read* for evidence. |
| Assessment grounded in real code | Yes — cites exact files/lines (§2–§4). |
| Ends with entry recommendation + smallest slices | Yes — §6. |

### Evidence cited (read-only)
- `packages/core/src/components/enhanced-select.ts` — `observedAttributes` (219), `attributeChangedCallback` (637), constructor DOM build (512–572), `connectedCallback` Angular workaround (595–598), Imperative API methods (6517+, 6620/6635, 6697/6709/6733/6740/6747, 7281/7292/7302/7315), event dispatch `_emit` (6278), unguarded registration (9107).
- `packages/core/src/types.ts:139–154` — `SelectEventsDetailMap` / event names.
- `packages/core/src/index.ts` — entry re-exports web components (SSR throw source).
- `packages/core/tests/w1-p1-6-t3-ssr-import-safety.spec.ts` — API-075/API-076 characterization.
- `packages/core/tests/w1-p2-t1-engine-framework-independence.spec.node.ts` — engine is DOM-free; entry throws noted.
- `docs/architecture/baseline/w1-p1/W1-P1.6-CLOSURE-EVIDENCE.json` — API-075=Partial, API-076=Existing.
- `docs/architecture/ARCHITECTURE-DECISIONS.md:61` — SSR/hydration is a separate gate.
- `docs/architecture/179-SVELTE-MULTI-VERSION-DISTRIBUTION-ADR.md:29` — SSR/hydration separate qualification.
- `packages/react/src/Select.tsx`, `packages/vue/src/Select.vue`, `packages/svelte/src/Select.svelte`, `packages/vanilla/src/index.ts` — adapter patterns (dynamic import, `whenDefined` retry, method binding, event wiring, cleanup).

---

_End of W1-P2 Task 2 readiness assessment. Read-only. No production, package, SSR, or test changes. Recommendation: browser-only (CSR) thin Angular adapter reusing `@smilodon/core` unchanged; SSR via browser-deferred import (no core change); API-075 remediation is a separate, unauthorized follow-on._
