# Angular Wave 2 — F02-R Host Collision Remediation Evidence

- **Artifact:** `Angular-Wave2-F02R-HOST-REMEDIATION-EVIDENCE`
- **Increment:** Angular Wave 2
- **Slice:** F02-R — Production Remediation of the F02 Host Tag Collision
- **Authorized starting commit:** `0c2fffd00c120a5c1924328ca47709900d26a7ac`
- **Accepted production baseline:** `2a9bd9985315507cefc215d30dbebf0c286466c4`
- **Supersedes:** `Angular-Wave2-S5VR-TEST-CORRECTION-EVIDENCE` (S5-VR preserved the F02 defect as expected-failures; F02-R remediates it in production)
- **Design decision:** `Angular-Wave2-S5D-REMEDIATION-DESIGN` — Option A (selector divergence), **accepted by Lead**
- **Branch:** `codex/w1-p1-3-keyboard-characterization`

## Headline outcome

The **F02 adapter defect is remediated**. The Angular host selector was diverged from the
colliding `<smilodon-select>` tag (upgraded by core's slotless `NativeSelectElement`) to a tag
core never registers — **`smilodon-angular-select`**. The host is no longer upgraded by core, so
the light-DOM `<enhanced-select>` widget renders, is sized, hit-testable, and is fully operable
by **real pointer and keyboard** in real Chromium and Firefox. The three S5-VR expected-failures
are now **genuine passes**. A mixed-consumer regression test confirms that importing the full
core (which registers `smilodon-select`) does **not** upgrade the Angular host. All regression
gates pass; **WebKit remains unverified-environmental**.

## Production change

Single, bounded production change:

```
packages/angular/src/select.component.ts:112
-  selector: 'smilodon-select',
+  selector: 'smilodon-angular-select',
```

Plus JSDoc/comment references updated to the new tag. **Unchanged:** lifecycle hooks,
`ControlValueAccessor`, the event bridge (`SMILODON_SELECT_EVENT_NAMES`), provenance probes, and
the browser-deferred core loader (`ensureEnhancedSelectDefined`). The component still renders
`<enhanced-select #host>` in its template, exactly as every sibling adapter does.

> **Breaking-rename note (accepted by Lead, per S5-D):** consumers that used the
> `<smilodon-select>` Angular selector must switch to `<smilodon-angular-select>`. No runtime
> shim/alias was added because the Wave-2 Angular package is unpublished (npm 404) and there is
> no existing runtime contract to preserve. The rename is documented in the package README.

## Why the collision happened (recap)

`@smilodon/core`'s full entry self-registers three custom elements at module top-level:

| Tag | Definition site |
|---|---|
| `smilodon-select` | `native-select.ts:562-563` |
| `enhanced-select` | `enhanced-select.ts:9107-9108` |
| `select-option` | `select-option.ts:632-633` |

`NativeSelectElement` (the `smilodon-select` host) attaches an **open shadow root with no
`<slot>`**. Under a tag collision, the light-DOM `<enhanced-select>` widget was never composed
through that shadow tree → it was laid out 0×0, invisible, and unusable by pointer or keyboard.
Diverging the Angular host tag removes the upgrade entirely.

## Remediation verification (acceptance criteria)

| ID | Criterion | Result | Evidence |
|---|---|---|---|
| F02-R01 | Selector = `smilodon-angular-select` | **PASS** | `select.component.ts:112`; built FESM; AOT fixture |
| F02-R02 | Full core import cannot upgrade the Angular host | **PASS** | Mixed-consumer test: `customElements.get('smilodon-select')` defined ⟹ host `shadowRoot === null` |
| F02-R03 | Widget visible with non-zero geometry | **PASS** | `enhanced-select` box width/height > 0; hit-test inside |
| F02-R04 | Playwright pointer AND keyboard succeed | **PASS** | Real combobox click opens options; ArrowDown×3 + Enter commits |
| F02-R05 | Three expected-failures → genuine passes | **PASS** | 0 expected/unexpected/flaky; foreign-shadow-slot assertion replaced by positive no-foreign-shadow check |
| F02-R06 | SSR serialization + hydration node reuse | **PASS** | 2 hosts + 2 placeholders; `__serverNodesReused === true`; "0 component(s) were skipped" |
| F02-R07 | Exactly ONE change per selection | **PASS** | `changeCount === 1` exactly; `lastChange.selectedValues === ['a']` |
| F02-R08 | Initial reactive value = zero feedback | **PASS** | `formChanges === 0`; host `ng-untouched` + `ng-pristine` |
| F02-R09 | Real focus-loss marks touched | **PASS** | Focus into combobox → focus out to `#focus-sink` → `ng-touched` |
| F02-R10 | S1–S4 + core selection unchanged | **PASS** | All regression gates green (below) |

### Foreign-shadow assertion replacement (F02-R05 detail)

S5-VR asserted `hostShadowHasSlot === true` (it *required* the foreign, slot-bearing shadow root
to exist). That assertion is **removed**. It is replaced by a **positive** assertion that the
remediated host has **NO foreign shadow root** (`host.shadowRoot === null`), together with
independent widget visibility, geometry, and pointer/keyboard operability.

### Shadow-aware focus (W02 detail)

`document.activeElement` stops at a shadow host. The focus test walks
`element.shadowRoot.activeElement` down the open shadow chain to the deepest focused element and
asserts it **equals** the widget's `input[role="combobox"]` **and** lies inside the Angular host's
composed subtree.

## Playwright results

`npx playwright test --config tests/ssr/playwright.ssr.config.ts`

| Engine | Tests | Passed | Expected-failures | Status |
|---|---|---|---|---|
| chromium | 10 | 10 | 0 | **PASS** |
| firefox | 10 | 10 | 0 | **PASS** |
| webkit | — | — | — | **UNVERIFIED-ENVIRONMENTAL** (missing system libs: libicu74/libxml2/libflite1) |

Specs (all 10 genuine passes in both engines):

1. F01 server HTML is hydration-annotated (`ngh` + `nghm`) + serializes remediated `smilodon-angular-select` hosts
2. F01 client reuses server DOM nodes and reports positive hydration
3. F02 remediated host is NOT upgraded by core; widget visible, sized, hittable
4. F02 widget has real geometry (host + widget laid out, hit-test lands inside)
5. F02-R02 mixed-consumer regression: full core loaded does NOT upgrade the Angular host
6. F03 reactive select hydrates on initial value with ZERO feedback callbacks (H2)
7. F03 pointer selection fires EXACTLY ONE (change) output and updates the form model
8. REAL focus reaches the widget combobox (shadow-aware composed focus)
9. REAL focus-loss marks the control ng-touched (exactly once)
10. UNIT synthetic focusin/focusout(relatedTarget) marks touched

## Regression gates

| Gate | Command | Result |
|---|---|---|
| build:angular | `npm run build:angular` | **PASS** |
| playwright chromium | see above | **10 passed** |
| playwright firefox | see above | **10 passed** |
| angular unit | `npx vitest run --config packages/angular/vitest.config.ts` | **6 files / 62 tests passed** |
| angular SSR | `npx vitest run --config packages/angular/vitest.ssr.config.ts` | **4 passed** |
| AOT consumer | `node ./tests/consumer/run-consumer.mjs` (after build) | **PASSED** |
| angular tsc | `npx tsc -p packages/angular/tsconfig.json --noEmit` | **0 errors** |
| eslint | `npx eslint packages/angular/src packages/angular/tests` | **0 errors** |
| core unit | `npx vitest run --config packages/core/vitest.config.ts` | **1071 passed \| 1 skipped** |
| core SSR | `npx vitest run --config packages/core/vitest.ssr.config.ts` | **10 passed** |
| core tsc | `npx tsc -p packages/core/tsconfig.json --noEmit` | **44 errors (pre-existing, unchanged)** |
| traceability | `python3 docs/architecture/baseline/w1-p1/verify_traceability.py` | **129/129 PASS** |

## Files changed

- `packages/angular/src/select.component.ts` — selector + JSDoc/comments
- `packages/angular/README.md` — usage examples → `smilodon-angular-select`
- `packages/angular/tests/ssr/ssr-app.component.ts` — 2 fixture usages
- `packages/angular/tests/consumer/consumer-app.component.ts` — 4 AOT consumer usages
- `packages/angular/tests/ssr/render-server.mjs` — host-count regex → `<smilodon-angular-select\b`
- `packages/angular/tests/ssr/hydrate-client.ts` — doc comment
- `packages/angular/tests/consumer/run-consumer.mjs` — doc comment
- `packages/angular/tests/ssr/hydration.spec.ts` — full F02-R spec (3 expected-failures → genuine passes; no-foreign-shadow positive check; W01–W06; mixed-consumer regression)
- `docs/architecture/baseline/w1-p2/Angular-Wave2-F02R-HOST-REMEDIATION-EVIDENCE.md` (this file)
- `docs/architecture/baseline/w1-p2/Angular-Wave2-F02R-HOST-REMEDIATION-EVIDENCE.json`
- `docs/architecture/baseline/w1-p2/SHA256SUMS`

## Compliance

- Production change scope: **selector string + JSDoc/comments only** (lifecycle/CVA/event-bridge/provenance/loader unchanged)
- Public selector changed: **yes** (breaking rename **accepted by Lead** per S5-D; no runtime shim)
- Core engine changed: **no** · Core registration suppressed: **no** · Runtime deps changed: **no** · Existing contract behavior changed: **no**
- Build output committed: **no**
- WebKit classification: **unverified-due-to-environmental-limitations** (not an app defect)

## Recommendation

- **F02-R: REMEDIATED — VERIFIED.**
- **Next gate:** Final Angular SSR/browser qualification (separate gate). **Angular release remains BLOCKED** until that qualification is run and accepted.
- **Open items:** WebKit verification once host system libraries are installed (`npx playwright install-deps`); final SSR/browser qualification; **S6 core remediation remains NO-GO**.

---
Generated with [Continue](https://continue.dev)

Co-Authored-By: Continue <noreply@continue.dev>
