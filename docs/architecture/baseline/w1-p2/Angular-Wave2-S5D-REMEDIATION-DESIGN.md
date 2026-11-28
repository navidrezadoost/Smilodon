# Angular Wave 2 — S5-D Remediation Design (ADR)

**Increment:** Angular Wave 2 — **S5-D Angular Host Ownership & Selector Compatibility Decision**
**Type:** Architecture Decision Record — **read-only; NO production changes**
**Starting commit:** `272f0e9b4619e935031a65e93537a5d11454160c` (S5-VR accepted)
**Accepted production baseline:** `2a9bd9985315507cefc215d30dbebf0c286466c4`
**Branch:** `codex/w1-p1-3-keyboard-characterization`
**Status:** **PROPOSED** — awaits Lead acceptance of the selector compatibility decision.

> **Decision: adopt Option A — selector divergence to `smilodon-angular-select`.**
> The Angular adapter should own a distinct host tag instead of colliding with
> core's `NativeSelectElement`, and it should render the real `<enhanced-select>`
> directly (as every sibling adapter already does). The rename is **not executed**
> in S5-D; this ADR establishes the compatibility consequences and the exact
> production diff + tests for a separately authorized F02 remediation.

---

## 1. Problem (F02, confirmed in S5-VR)

The Angular component's host selector is `smilodon-select`
(`packages/angular/src/select.component.ts:106`). Core **also** registers a custom
element of that exact name (`packages/core/src/components/native-select.ts:562-563`,
`NativeSelectElement`). When the adapter's deferred `import('@smilodon/core')`
runs, the custom element upgrades the Angular host, calls
`attachShadow({mode:'open'})` **without a `<slot>`**, and the light-DOM
`<enhanced-select>` (the real widget) is excluded from the composed tree:
**0×0, invisible, unhittable, unfocusable** (S5-VR F02 measurements).

This is an **adapter architecture** defect — it affects CSR and SSR equally — not
an SSR-specific or core-selection defect. The widget internals remain healthy.

## 2. Investigation

### 2.1 Public API exposure

- **Selector declared once:** `select.component.ts:106` → `selector: 'smilodon-select'`.
- **Public export:** `src/index.ts` exports `SmilodonSelectComponent` (standalone).
  The selector **is** the consumer integration contract.
- **Consumer-facing references** (the full rename surface):
  - `README.md` — 5 usage snippets.
  - `tests/consumer/consumer-app.component.ts` — 4 template usages (AOT consumer).
  - `tests/ssr/ssr-app.component.ts` — 2 template usages.
  - `select.component.ts` — 1 JSDoc example + 3 comments.
- **NOT referenced by unit tests:** the 62 unit tests instantiate
  `new SmilodonSelectComponent()` with a mocked `ElementRef` and assert on the
  **inner** `enhanced-select` tag (`select.component.test.ts:70`). The host tag is
  never asserted → a rename is invisible to the unit suite.
- **`smilodon-angular-select` is unused**; no `smilodonSelect` attribute selector exists.

### 2.2 Release history — the package is pre-release

- `npm view @smilodon/angular` → **404 Not Found** — not currently published.
- Root `CHANGELOG.md`: *"Angular support has been discontinued as of
  December 2025 … `@smilodon/angular` is now deprecated on npm"*; historical
  commit `c4248e0 refactor: Remove Angular support completely`.
- Wave-2 **revived** `packages/angular` from scratch (`b972cd7 feat(angular): S1
  package scaffold`). Version field is `1.13.0` (carried), but the package is a
  **development/unpublished** artifact.

**Consequence:** the colliding selector is **not an in-the-wild public API**.
There is **no installed-base breakage cost** to a rename today.

### 2.3 Sibling adapters all render `<enhanced-select>` directly

| Adapter | Host | Evidence |
| --- | --- | --- |
| Vue | `<enhanced-select>` | `packages/vue/src/Select.vue` |
| Svelte | `<enhanced-select>` | `packages/svelte/src/Select.svelte` |
| Solid | `<enhanced-select>` | `packages/solid/src/Select.tsx` |
| Vanilla | `createElement('enhanced-select')` | `packages/vanilla/src/index.ts` |
| React-Native/Web | `enhanced-select` | `packages/react-native/src/Select.web.tsx` |
| Playground | `createElement('smilodon-select')` (core native, **not** the Angular adapter) | `playground/src/scenarios.ts` |

The Angular adapter is the **only** one that wraps the widget in a colliding host
element. The collision is a **deviation** from the established element-hosted
pattern; the fix aligns Angular with the others.

### 2.4 Core registration side effects (why D-03 is reachable without a core change)

Importing the full `@smilodon/core` entry registers **three** custom elements:
`smilodon-select`, `enhanced-select`, `select-option`. If the Angular host is
**renamed** (or made an attribute selector), full-core import still registers
`smilodon-select`, **but it no longer matches the Angular host** → the widget
cannot be hidden. The collision requires the host to be *named* `smilodon-select`.
So **D-03 is satisfiable with zero core changes.**

## 3. Options

| Option | Approach | D-01 | D-02 | D-03 | Production diff | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| **A** | Rename → `smilodon-angular-select` | ✅ | ✅ | ✅ | **1 line** + docs | **RECOMMENDED** |
| B | Inject `<slot>` into foreign shadow root | ✗ | ✗ | — | Coupled to core internals | **REJECTED** |
| C | Isolated core entry (`enhanced-select` only) | ✗* | ✅ | ✗* | Core architecture change | **INSUFFICIENT** |
| D | Attribute selector `[smilodonSelect]` on `<div>` | ✅ | ✅ | ✅ | Larger contract change | **VIABLE FALLBACK** |

\* Option C leaves the host as `smilodon-select`; an independent full-core import
re-registers the colliding element → mixed consumers still break (D-03 fails), and
it expands the remediation into core package architecture (D-10 risk).

**Option B is architecturally unsound** — Angular would depend on the private DOM
of another component, and the foreign listbox/ARIA/event semantics remain.

**Option D is viable** but is a larger consumer-contract change and diverges from
the element-shaped sibling adapters; retained as the fallback if the Lead mandates
a host the adapter fully controls without a new element-looking tag.

## 4. Decision

**Adopt Option A — selector divergence to `smilodon-angular-select`.** It satisfies
D-01/D-02/D-03 with **no core change** and **no foreign-shadow dependency**, aligns
with the sibling adapters, and needs only a one-line production change.

**Not yet authorized.** Per the directive, S5-D establishes consequences; the Lead
must accept the selector compatibility decision **before** F02 remediation.

## 5. Compatibility policy

- **Status:** pre-release / unpublished.
- **Policy:** **DIRECT REPLACEMENT** — rename with **no deprecation shim and no
  migration tooling**, because there is no published surface to preserve.
- **Do NOT** keep `smilodon-select` as an alias for the Angular component — an
  alias would re-introduce the exact collision this decision eliminates.

## 6. Remediation plan (for the separately authorized F02 increment)

### 6.1 Minimal production diff

| File | Change |
| --- | --- |
| `packages/angular/src/select.component.ts:106` | `selector: 'smilodon-angular-select'` — **the only logic-adjacent change** |
| `select.component.ts` JSDoc + comments (≈97, 335, 944, 1056) | update tag in text |
| `packages/angular/README.md` | update usage examples |
| `tests/consumer/consumer-app.component.ts` | 4 template usages → new tag |
| `tests/ssr/ssr-app.component.ts` | 2 template usages → new tag |

**Zero logic change is required.** `inject(ElementRef)` still resolves to the
component host (new tag); `@ViewChild('host')` still finds the inner
`<enhanced-select>`; `:host` styles and focus tracking are tag-agnostic.

**Explicitly unchanged:** all of `packages/core/**` (D-08/D-10), component
inputs/outputs/CVA/provenance/lifecycle (D-06/D-07), `core-loader.ts` (still loads
full core, which harmlessly registers `smilodon-select`), and the 62 unit tests.

### 6.2 Tests required to close F02 (flip — do not remove)

The three S5-VR expected-failures must become **genuine passes**:
1. *tag collision does NOT hide the real widget* — remove `test.fail()`; widget
   visible with >0 box; combobox clickable (Playwright actionability).
2. *collision does NOT suppress layout* — remove `test.fail()`; `enhClientRects>0`,
   width/height>0, `hitInsideWidget`.
3. *REAL focus cannot reach the widget* — remove `test.fail()`; real `.focus()`
   must move focus into the combobox (shadow-aware).

Also: retarget the F01 node-reuse stamp to `smilodon-angular-select` so node
identity is still verified on the renamed host; update SSR serialized-region
assertions to the new tag. **Do not delete or weaken any assertion.**

### 6.3 Watchpoint follow-ups (W01–W06, to address during qualification)

| ID | Follow-up |
| --- | --- |
| W01 | Replace "foreign shadow root has a slot" with implementation-independent visibility/geometry assertions. |
| W02 | Focus test uses shadow-aware active-element traversal (composed path / `shadowRoot.activeElement` chain). |
| W03 | Initial forms test asserts `formChanges === 0` exactly. |
| W04 | Output test asserts **exactly one** event per selection (`changeCount === 1`), not `>=1`. |
| W05 | F03 uses genuine pointer + keyboard interaction against the rendered widget. |
| W06 | Real focus-loss/touched exercised via genuine browser focus transitions. |

## 7. Invariant conformance (D-01 … D-10)

| ID | Requirement | Status under Option A |
| --- | --- | --- |
| D-01 | Angular host ownership unambiguous | ✅ owns `smilodon-angular-select` |
| D-02 | No foreign shadow-root dependency | ✅ nothing upgrades the new tag |
| D-03 | Full core imports cannot hide the widget | ✅ `smilodon-select` no longer matches the host |
| D-04 | CSR and SSR considered | ✅ shared selector; consumer + SSR fixtures updated |
| D-05 | Genuine hydration intact | ✅ design-sound; F01 stamp retargeted; verify at remediation |
| D-06 | S3 typed event contracts intact | ✅ events.ts / @Output unchanged |
| D-07 | S4 forms contracts intact | ✅ CVA / ElementRef / @ViewChild unchanged |
| D-08 | Core selection authority unchanged | ✅ zero core change |
| D-09 | Public API impact explicit | ✅ template tag rename; pre-release → no breakage; documented |
| D-10 | No unauthorized core remediation | ✅ Option A touches zero core files |

## 8. Compliance

- **Read-only increment** — no production, test, or dependency changes.
- Production source unchanged vs `2a9bd99`.
- F02 reproduction preserved (three `test.fail()` cases untouched in S5-D).

## 9. Recommendation

Adopt **Option A** as the F02 remediation direction. The next gate is the
separately authorized **F02 production remediation** (one-line selector change +
doc/fixture updates + flip the three expected-failures to genuine passes, addressing
W01–W06). **S5 production source changes remain NO-GO** until this ADR is accepted;
the Angular package release stays **BLOCKED**; **S6 core remediation is not needed**
under Option A.

---

_End of S5-D Remediation Design (ADR). Read-only architectural decision; no
production implementation performed._
