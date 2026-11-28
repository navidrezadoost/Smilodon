# Angular Wave 2 — S5 SSR/Hydration Readiness Assessment

**Increment:** Angular Wave 2 — **S5 SSR/Hydration Readiness (READ-ONLY ASSESSMENT)**
**Accepted baseline commit:** `2a9bd9985315507cefc215d30dbebf0c286466c4` (S4/S4-R CLOSED)
**Branch:** `codex/w1-p1-3-keyboard-characterization`
**Scope:** assessment only. **NO** production changes, **NO** SSR remediation, **NO**
new dependencies, **NO** test changes. Read-only evidence gathering.

> **GO — S5 READINESS ASSESSMENT ONLY.** No SSR production changes are authorized
> by this GO. The next gate (S5 implementation) remains **NO-GO** until this
> assessment is independently reviewed and the implementation gate is explicitly
> opened.

---

## 0. Method and evidence base

This assessment reuses existing architecture and source evidence and adds a small
number of **read-only empirical probes** against the **built** package (run in a
throwaway script, no committed files). Where an actual SSR render or real-browser
reproduction was **not** performed, the conclusion is classified as a
**hypothesis** or **unverified risk**, never a confirmed defect — per the
directive's strict distinction between *import safety*, *successful SSR
rendering*, and *hydration correctness*.

Sources examined:

- `packages/angular/src/core-loader.ts` — browser-deferred dynamic core import.
- `packages/angular/src/select.component.ts` — template, lifecycle, forms,
  focus/provenance, `getSelectElement()`.
- `packages/angular/tests/ssr-import-safety.ssr.spec.ts` + `setup.ssr.ts` +
  `vitest.ssr.config.ts` — what SSR import-safety actually proves.
- `packages/angular/tests/setup.ts` — jsdom element registration (full core entry).
- `packages/angular/tests/consumer/run-consumer.mjs` — real AOT consumer flow.
- `packages/angular/dist/fesm2022/smilodon-angular.mjs` + `dist/package.json` —
  built artifact imports/exports/peer deps.
- `packages/core/src/index.ts`, `components/enhanced-select.ts`,
  `components/native-select.ts`, `components/select-option.ts` — SSR throw
  sources and custom-element registrations.
- `docs/architecture/baseline/w1-p2/W1-P2-T2-ANGULAR-INTEGRATION-READINESS.md` —
  prior Option A analysis (browser-deferred import + placeholder).
- `tests/e2e/playwright.config.ts` + `tests/e2e/scenarios/*` — existing browser
  coverage (vanilla, not Angular/SSR).

---

## 1. Angular server import safety

**Conclusion: PASS (import safety) — verified by source + existing SSR test +
built-artifact inspection.**

| Aspect | Evidence | Status |
| --- | --- | --- |
| No static `@smilodon/core` value import in the runtime bundle | `grep` of `dist/fesm2022/smilodon-angular.mjs`: no `import … from '@smilodon/core'`; only `import('@smilodon/core')` dynamic | PASS |
| Core reached only via a browser-guarded dynamic import | `core-loader.ts` + FESM lines 46/61/72 (`isBrowserEnvironment()` guard before `import('@smilodon/core')`) | PASS |
| Import path / entry | `dist/package.json` `exports["."].default → ./fesm2022/smilodon-angular.mjs`; `typings → types/smilodon-angular.d.ts` | PASS |
| Runtime deps | Only `tslib` (dependency); `@angular/core`, `@angular/forms`, `@smilodon/core` are peers | PASS |
| `sideEffects` | `false` (tree-shakeable; entry module has no import side effects) | PASS |
| Entry imports without a DOM / without evaluating core | `ssr-import-safety.ssr.spec.ts` (4 tests) in genuine Node (`environment: 'node'`) — entry, component module, events module, core-loader all import clean | PASS |
| Component/module DOM access at import/construct time | No `document`/`window`/`customElements` in field initializers or constructor; all DOM use is inside methods reached after the browser guard or optional-chained | PASS |

**Caveat (as directed):** the SSR import-safety test loads `@angular/compiler`
(`setup.ssr.ts`) so the partially-compiled `@angular/*` FESMs (pulled by the S4
`@angular/forms` import) can **JIT-fallback** in a bare Node process. This is a
**test-only** accommodation so the spec can exercise import safety without a real
Angular SSR toolchain. It defines **no** DOM global and does **not** import core,
so the *contract* (core not evaluated; no DOM created) holds — but it means the
SSR spec proves **import safety**, **not** that a real Angular SSR render works.
Whether an actual `@angular/platform-server` build can render the component
without the JIT fallback is **unverified** (see §2 and §7).

---

## 2. Server-rendered HTML (the placeholder)

**Conclusion: HYPOTHESIS — not empirically verified. No SSR render is performed
anywhere in the repo (`@angular/platform-server` is not installed).**

- The component template is a single static host:
  `template: '<enhanced-select #host></enhanced-select>'`
  (`select.component.ts:109`). The host `<smilodon-select>` wrappers the static
  `<enhanced-select>` placeholder.
- On the server, `ngAfterViewInit()` returns immediately when
  `isBrowserEnvironment()` is false (`select.component.ts:346-348`) → core is
  **not** imported, element is **not** touched, no inputs applied.
- **Derived SSR markup (hypothesis):** for each `<smilodon-select>`, Angular would
  emit an empty-attribute host containing one empty `<enhanced-select>` child:
  ```html
  <smilodon-select><enhanced-select></enhanced-select></smilodon-select>
  ```
  No shadow DOM, no chips, no popup, no ARIA combobox — all of that is created
  only when the element upgrades in the browser.
- **Verification gap:** this markup is inferred from the template + server-side
  no-op guard. It has **not** been produced by a real Angular SSR render. The
  exact serialization (attribute ordering, comment nodes from Angular's renderer,
  hydration markers) is **unverified**.

---

## 3. Hydration boundaries (Angular-owned vs custom-element-owned DOM)

**Conclusion: RISK FRAMING confirmed by source — the boundary is one-directional
and there is a concrete tag-collision hazard (see §3.1). Real hydration
correctness is UNVERIFIED (no SSR/hydration test).**

- **Angular-owned:** the host `<smilodon-select>` element and its light-DOM child
  `<enhanced-select>` placeholder. Angular creates these on the server and, with
  hydration, expects the client DOM to match the server DOM.
- **Custom-element-owned:** everything *inside* `<enhanced-select>`'s shadow root
  (combobox input, popup, chips, listbox, clear control, ARIA) — built by the
  core element's **constructor** (`enhanced-select.ts:512-572`). None of this
  exists server-side.
- **Boundary direction:** Angular owns the light DOM shell; core owns the shadow
  DOM. Because the shadow root is created **after** hydration (on the deferred
  browser upgrade), Angular's hydration algorithm never needs to reconcile
  shadow content — a favorable boundary **in principle**.
- **Hydration-mismatch surface (light DOM):** only the empty `<enhanced-select>`
  placeholder must be byte-consistent between server and client pre-upgrade. That
  is stable (static template, no interpolation). The genuine risk is **timing of
  the upgrade relative to Angular hydration**, not the markup shape (§4).

### 3.1 Tag-name collision: `<smilodon-select>` (NEW finding)

The Angular component's selector is `smilodon-select`
(`select.component.ts:106`). Core's **full entry** (the one reached by the
browser-deferred `import('@smilodon/core')`) registers a *different* custom
element **also named `smilodon-select`**:

```ts
// packages/core/src/components/native-select.ts:562-563
if (!customElements.get("smilodon-select")) {
  customElements.define("smilodon-select", NativeSelectElement);
}
```

Because the component's own host element is `<smilodon-select>`, when the deferred
core import resolves, the browser **upgrades the Angular host** to
`NativeSelectElement` — whose constructor calls `this.attachShadow({mode:'open'})`
and builds its own listbox DOM.

**Empirically confirmed (read-only probe against the built package, jsdom):**
```
BEFORE core load: host.shadowRoot = null | smilodon-select defined? false
AFTER  core load: smilodon-select defined? true
AFTER  core load: host.shadowRoot upgraded? true
enhanced-select defined? true
inner still light child of host? true
```

**Why existing tests still pass:** all current tests query the child via the
**light DOM** (`host.querySelector('enhanced-select')`), and the `<enhanced-select>`
child **remains a light child** after the host upgrade (it is not moved into the
shadow root). The Angular `<enhanced-select>` element itself is unaffected — it is
still upgraded by its own definition and still configured. The **foreign shadow
root** on the host is inert w.r.t. the adapter's logic but is a real artifact.

**Classification:**
- **Not currently a functional blocker** for the tested (CSR, light-DOM-queried)
  behavior — confirmed: the child remains queryable and functional.
- **Genuine S5/hydration risk** because: (a) on the server the host is a plain
  unknown element; on the client it becomes an upgraded custom element with a
  shadow root — a DOM-shape change at the exact boundary Angular hydration
  inspects; (b) a `<smilodon-select>` host carrying an unexpected shadow root is
  not what the adapter's design intends; (c) it is **not documented** in any prior
  evidence or covered by any test assertion on `host.shadowRoot`.
- **Requires real-browser verification** (§7) before it can be called benign under
  hydration. In jsdom it is confirmed to occur; whether it causes a visible
  hydration mismatch in Chrome/Firefox/WebKit is **unverified**.

---

## 4. Deferred upgrade: ordering and races

**Conclusion: analyzed from source; the ordering is deterministic in CSR, but the
upgrade-vs-hydration interleaving is a real race that needs a real-browser check.**

Ordering (browser, first client render):

1. **Angular hydrates** the light DOM shell (`<smilodon-select><enhanced-select>`).
2. `ngAfterViewInit()` runs (browser): `attachEventListeners()` → provenance probes
   → focus tracking → `initialize()`.
3. `initialize()` calls `ensureEnhancedSelectDefined()`:
   - If `<enhanced-select>` already defined (e.g. another Smilodon adapter on the
     page) → resolves immediately.
   - Else dynamic `import('@smilodon/core')` → **defines `enhanced-select` AND
     (side effect) `smilodon-select`/`select-option`** → `customElements.whenDefined`
     → resolves.
4. `ready = true` → `applyInputs()` sets items/config/required/error/selection.

**Upgrade timing properties:**
- The `<enhanced-select>` element is upgraded when its definition runs (step 3),
  which is **after** Angular has hydrated the shell. Angular therefore sees a
  static, already-present `<enhanced-select>` node whose *light* content is empty;
  the element then self-populates its **shadow** root — no Angular reconciliation
  of shadow content is required. Favorable boundary in CSR.
- **The `<smilodon-select>` host upgrade (§3.1) happens in this same step** — a
  foreign shadow root is attached to the Angular host *after* hydration. This is
  the interleaving to verify in a real browser.
- **Race to confirm:** if Angular hydration runs an assertion that the server DOM
  equals the client DOM *before* step 3 completes, the host shows no shadow root
  and (post-step-3) shows a foreign shadow root — a *mutation* of the host, not a
  *mismatch of Angular-owned nodes*. Angular hydration specifically checks its own
  nodes; an added shadow root is outside that set. **[Hypothesis — needs browser
  verification.]**

---

## 5. Inputs and events (reconciliation + listener behavior)

**Conclusion: PASS for CSR; ordering is hydration-safe by construction. SSR
correctness of listener attachment is UNVERIFIED (but listeners are browser-only).**

- **Event listeners** are attached in `ngAfterViewInit()` (browser guard first) via
  `attachEventListeners()`, on the *current* `<enhanced-select>` element reference.
  On the server, no listeners are attached. The reference is resolved through
  `@ViewChild('host', { static: true })` → the `<enhanced-select>` template node,
  which survives hydration unchanged. **The §3.1 host upgrade does not move or
  replace `<enhanced-select>`** (confirmed: still a light child), so the
  `ViewChild` reference and the attached listeners remain valid across the upgrade.
- **Inputs** are applied only after `ready` (post-`whenDefined`), in `applyInputs()`.
  Pre-ready input changes are held in fields and folded in at init; pre-ready
  `ngOnChanges` is a no-op (`if (!this.ready) return;`). This is hydration-safe:
  server-rendered inputs (bound on the shell) are not "applied" until the element
  is upgraded, so there is no premature DOM touch on the server.
- **Single-listener authority** and the `stopPropagation` single-delivery guard are
  unchanged from S3 and independent of SSR.

---

## 6. Forms (`writeValue` / touched / disabled / programmatic semantics)

**Conclusion: PASS for CSR lifecycle ordering; hydration/initial-reconcile must NOT
be interpreted as a user edit (guarded — see below).**

- `writeValue` before readiness stores `pendingFormValue` and applies at init; it
  **never** calls `onChange` (S4 anti-echo contract). Initial form-model application
  on the client (post-hydration) is a programmatic sync → classified programmatic →
  **not** echoed. This directly satisfies the Lead watchpoint: *hydration or initial
  value reconciliation must not be interpreted as a user edit* — the S4 provenance
  model already treats any adapter-initiated `setSelectedValues()` as programmatic
  (`pendingProgrammaticApplications` + `programmaticReason`), and no user gesture
  exists during hydration.
- `onTouched` (S4-R) fires only at a **focus-loss** boundary — hydration does not
  move focus, so no spurious touch on init.
- `setDisabledState` pre-ready folds into config at init; post-ready writes a single
  config. No `onChange` on disabled changes.
- **SSR-specific watchpoint (hypothesis):** if Angular hydration re-runs
  `writeValue` (it may, to reconcile the model after the client boots), the adapter
  re-applies through the generation-guarded async path — safe (no echo), but the
  *number* of `setSelectedValues()` calls during hydration vs. CSR is unverified.

---

## 7. Browser compatibility verification gaps

**Conclusion: GAP — no Angular SSR/hydration browser coverage exists; add before
S5 implementation acceptance.**

| Verification | Present today | Gap |
| --- | --- | --- |
| Angular component CSR in a real browser | **No** `.spec.ts` tagged `@angular`; the `angular-chromium/firefox` playwright projects use `grep /@angular|@all/` but the `@all` specs are **vanilla-core** scenarios, not the Angular component | Angular adapter has **no** real-browser test |
| Angular SSR render (`@angular/platform-server`) | **Not installed**; no render test | **Unverified** (§2) |
| Hydration correctness | **No** hydration e2e anywhere in repo | **Unverified** (§3, §4) |
| WebKit (Safari) | `angular-*` projects are Chromium + Firefox only; no `angular-webkit` | **Not covered** |
| §3.1 host-upgrade benignity | jsdom-confirmed to occur; not browser-verified | **Unverified in real engines** |

Required verification before S5 implementation GO: a real-browser (Chrome +
Firefox + **WebKit**) Angular SSR/hydration e2e that (a) server-renders the
component, (b) hydrates, (c) asserts no hydration mismatch and a single working
combobox, and (d) confirms the §3.1 host upgrade does not produce a visible
artifact.

---

## 8. API-075 relationship to the SSR strategy

**Conclusion: the current design SIDESTEPS API-075 without remediating it — this is
correct and unchanged; remediation remains a separate, unauthorized increment.**

- **API-075 (Partial):** `@smilodon/core`'s entry throws on import in no-DOM Node
  — `class EnhancedSelect extends HTMLElement` (`enhanced-select.ts:218`) +
  unguarded top-level `customElements.get('enhanced-select')` (`:9107`); likewise
  `native-select` (`:562`) and `select-option` (`:632`).
- **Strategy in force (T2 Option A):** the Angular adapter never statically imports
  core and only dynamically imports it inside `isBrowserEnvironment()`. Therefore
  the **server bundle never evaluates core** → API-075 is never triggered on the
  server. This is exactly Option A and it is **already implemented**; S5 does not
  need to remediate API-075 to achieve import safety / placeholder SSR.
- **What API-075 remediation would/would not buy:** a side-effect-free core entry
  would allow server-side *import*, but the element's **constructor** eagerly builds
  the shadow DOM (`:512-572`), so true server *rendering* of the element internals
  would still require a separate headless-render path. Remediation is **neither
  necessary nor sufficient** for the thin CSR-first adapter — consistent with T2 and
  **NOT AUTHORIZED** here.
- **Note:** because core's full entry also registers `smilodon-select` (§3.1), any
  future core-entry remediation (S6) would be the natural place to also resolve the
  tag-name collision — but that is core work and out of S5 scope.

---

## 9. Readiness matrix

| Area | Required evidence | Finding | Class |
| --- | --- | --- | --- |
| **Angular server import** | Built artifact import path + deps | No static core import; only `tslib` dep; peers only; `sideEffects:false`; entry imports clean in Node (4 SSR tests) | **PASS (verified)** |
| **SSR markup** | Exact host/placeholder output OR identified gap | Template = `<enhanced-select #host></enhanced-select>`; server no-op guard ⇒ placeholder `<smilodon-select><enhanced-select></enhanced-select>`; **no real SSR render performed** | **HYPOTHESIS / gap** |
| **Hydration** | Angular-owned vs custom-element-owned boundaries | Light DOM = Angular-owned; shadow DOM = core-owned (built in constructor after upgrade); boundary favorable in CSR | **RISK FRAMING (verified by source); correctness unverified** |
| **Deferred upgrade** | Ordering + race analysis | Deterministic CSR ordering (hydrate → afterViewInit → import → whenDefined → applyInputs); host gets a foreign shadow root when core loads | **Verified ordering; race needs real-browser check** |
| **Inputs & events** | Reconciliation + listener behavior | Listeners browser-only on stable `<enhanced-select>` ref; inputs applied post-ready; §3.1 upgrade does not disturb `ViewChild`/child | **PASS (CSR, source-verified)** |
| **Forms** | writeValue/touched/disabled/programmatic | Pre-ready writeValue deferred; programmatic init never echoes; touched only on focus-loss; hydration not a user edit | **PASS (CSR, source-verified)** |
| **Browser compatibility** | Chrome/Firefox/WebKit verification | No Angular real-browser test; no SSR/hydration e2e; no WebKit project for Angular | **GAP (unverified)** |
| **API-075** | Relationship to SSR strategy | Sidestepped via Option A (no server core eval); remediation not needed for import safety, not sufficient for element render | **PASS (strategy verified); remediation NOT AUTHORIZED** |
| **Tag collision** (`<smilodon-select>`) | — | Core defines `smilodon-select` (NativeSelectElement); Angular host upgraded with a foreign shadow root when core loads (jsdom-confirmed) | **NEW RISK (unverified in browsers)** |

---

## 10. Risk prioritization

**Known-covered / not blockers (existing tests):**
- Server **import safety** (no core evaluation, no DOM) — covered by 4 SSR tests.
- CSR input reconciliation, event bridge, forms semantics, touched/provenance — covered by 62 jsdom tests + 30-assertion AOT consumer.

**Genuine blockers to *claiming* SSR/hydration support (not to CSR):**
- **B-S5-1 — No real SSR render + no hydration e2e.** Cannot assert "SSR works" or
  "hydration is correct" without `@angular/platform-server` render + a real-browser
  hydration test. This is a **verification gap**, not a proven defect.
- **B-S5-2 — Tag-name collision `<smilodon-select>` (§3.1).** Confirmed in jsdom
  that the Angular host is upgraded to core's `NativeSelectElement` (foreign shadow
  root) when core loads. Whether this is benign under hydration (Angular-owned
  host gaining a shadow root post-hydration) is **unverified in real engines**.
  This is the highest-priority *technical* risk.

**Hypotheses requiring real-browser verification (not confirmed defects):**
- H1: The foreign host shadow root causes no visible artifact / no Angular hydration
  mismatch (§4).
- H2: Hydration does not re-run `writeValue` in a way that changes observable
  selection timing (§6).
- H3: SSR serialization shape matches the derived placeholder exactly (§2).

**Non-risks for the thin CSR-first adapter:**
- API-075 import throw — sidestepped by Option A (already implemented).
- Shadow-DOM reconciliation — not needed (element-owned, created post-hydration).

---

## 11. Implementation recommendation

**Recommendation: NO-GO on S5 *implementation* at this time, with a narrowly scoped
**assessment-completion** GO to close the two verification gaps. Do not open the S5
implementation gate until the gaps below are reproduced.**

Rationale: the **adapter's server-import strategy is sound and already correct**
(Option A, no core change). The remaining unknowns are **verification**, not proven
implementation blockers — so the honest decision is to *verify first*, then decide.

### 11.1 Smallest compatibility-preserving steps to reach a defensible decision

**(A) Assessment-completion (read-only / test-only, NO production change) — recommended to open now:**
1. Add an **SSR-render probe** (dev-only, e.g. `@angular/platform-server`
   `renderApplication` against the built component in a throwaway test) to capture
   the **actual** server HTML and confirm the derived placeholder (§2) and that
   core is not evaluated server-side. *(Introduces a devDependency; needs a
   separate explicit authorization — classified here as the next assessment step,
   not part of this GO.)*
2. Add a **real-browser hydration e2e** (Chrome/Firefox/WebKit) that server-renders,
   hydrates, and asserts no mismatch + one working combobox + host-upgrade
   benignity (§3.1, §4). *(Test-only; separate authorization.)*

**(B) If verification is authorized and passes** — S5 implementation would then be
**optional and small**, since Option A is already in place:
- **S5-A (Angular adapter only, no core change):** resolve the `<smilodon-select>`
  tag collision — the minimal fix is to change the Angular **component selector**
  to a non-colliding tag (e.g. `smilodon-angular-select`) or use `ElementRef`/
  `@HostBinding` so no host custom-element upgrade occurs. This is an **Angular
  adapter** change (in-scope for S5, not core), and should be validated against the
  hydration e2e. *(Deferred until the gate opens.)*
- **Harden lifecycle** to assert no-op pre-hydration and idempotent init (small,
  defensive).

**(C) If the collision cannot be safely resolved adapter-side** — the alternative
is **core-entry remediation** (guarding `smilodon-select`/`select-option`
registration and/or an SSR-safe entry). That is **S6, optional core remediation,
NOT AUTHORIZED**.

### 11.2 What is explicitly NOT recommended here
- No SSR production code changes now (per GO).
- No core changes / API-075 remediation (S6, not authorized).
- No tag-rename now (it is an implementation step behind the gate).

---

## 12. Compliance with this GO

- **No production changes made.** `git status` shows no tracked modifications;
  HEAD remains `2a9bd99`.
- **No test changes, no dependency changes, no new packages.**
- Empirical probes were run in throwaway scripts (deleted); only read-only
  inspection and jsdom observation, no committed files.
- The S5 implementation gate remains **NO-GO**.

---

_End of S5 SSR/Hydration Readiness Assessment (read-only). The Angular adapter's
server-import strategy is sound and already implements T2's Option A (browser-
deferred dynamic core import; no server-side core evaluation; static hydration-
stable placeholder). Import safety is verified. SSR rendering and hydration
correctness are **unverified** (no `@angular/platform-server`, no SSR/hydration
e2e, no Angular real-browser coverage, no WebKit coverage). One concrete technical
risk was newly identified and jsdom-confirmed: core's full entry defines a
`smilodon-select` custom element (`NativeSelectElement`) that upgrades the Angular
component's `<smilodon-select>` host with a foreign shadow root when core loads;
whether this is benign under real-browser hydration is unverified. Recommendation:
NO-GO on S5 implementation; GO a narrowly scoped verification pass (SSR-render
probe + real-browser hydration e2e) before deciding. Smallest subsequent S5
implementation is adapter-only (resolve the tag collision behind the gate); core
remediation remains S6/unauthorized._
