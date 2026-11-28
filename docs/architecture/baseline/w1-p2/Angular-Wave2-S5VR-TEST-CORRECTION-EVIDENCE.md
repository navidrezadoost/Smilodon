# Angular Wave 2 — S5-VR Test-Correction (corrects S5-V)

**Increment:** Angular Wave 2 — **S5-VR Hydration Verification Test-Correction**
**Accepted baseline commit (production):** `2a9bd9985315507cefc215d30dbebf0c286466c4` (S4/S4-R CLOSED)
**Starting commit for this slice:** `04847cd0271dd9c6f7f0e2717af1de9f317ab98c` (S5-V)
**Supersedes:** `Angular-Wave2-S5V-VERIFICATION-EVIDENCE` — its **"collision benign"** classification was **WRONG** (see §3, F02).
**Branch:** `codex/w1-p1-3-keyboard-characterization`

**Authorization.** Lead S5-VR directive after independent review of `04847cd`: the
8/8 S5-V "passing" tests did **not** prove real hydration and **masked a serious
risk**. Undertake **one bounded test-only correction increment**: (F01) configure
`provideClientHydration()` on the **server** fixture too, require actual `ngh`
annotations + serialized state, verify positive hydration / DOM node reuse, and
capture warnings (e.g. NG0505); (F02) add **real** Playwright locator
visibility/geometry/pointer/keyboard/a11y assertions — the old
`container.click()` inside `page.evaluate()` masked the target; (F03) assert the
Angular `(change)` **OUTPUT** via the fixture (not just document capture) and
genuine form-model behavior. Retain WebKit environmental qualification. **If the
corrected tests expose a genuine adapter defect: preserve the failing
reproduction and STOP; production remediation requires separate authorization.**

> **Verdict: F01 is corrected and real hydration is now PROVEN; F03 is verified;
> F02 EXPOSED A GENUINE ADAPTER DEFECT — the `<enhanced-select>` widget is
> invisible and unusable under the tag collision. The S5-V "benign" claim is
> retracted and preserved as an expected-failing reproduction. Production source
> is unchanged vs `2a9bd99`.**

---

## 1. Why a correction was required (what S5-V got wrong)

| S5-V claim | Correction |
| --- | --- |
| "Hydration completes" (based on `ng-version`/`ng-server-context` presence) | **False proxy.** The server injector had no hydration DOM-reuse flag → **no `ngh` annotations** → the client **recreated** the app. Real hydration was never exercised. (F01) |
| "Collision is benign; no visible artifact" (based on programmatic `container.click()`) | **False.** A programmatic click bypasses actionability/visibility/hit-testing. In a real browser the widget is **0×0, invisible, unhittable**. (F02) |
| "(change) forwarded to Angular" (based on document-capture listener) | **Incomplete.** It did not prove the Angular `(change)` **output** reached the fixture consumer nor that the form model updated. (F03) |

## 2. F01 — Real hydration was NOT enabled; corrected and proven

**Root cause.** `ngh` annotations are emitted by `ɵannotateForHydration` **only
when `ɵIS_HYDRATION_DOM_REUSE_ENABLED` is set in the SERVER injector**. The
`SsrAppModule` used only `ServerModule`, so the flag was unset and the client fell
back to **recreating** the application. (Using
`provideClientHydration(withEventReplay())` on the server also fails — that
feature's client-only providers **prevent** server-side annotation.)

**Fix (test fixture only) —** `packages/angular/tests/ssr/ssr-server.module.ts`:

```ts
providers: [provideClientHydration()]   // NO withEventReplay() on the server
```

The client keeps `provideClientHydration(withEventReplay())`.

**Proof of real hydration / node reuse:**

- Server HTML now carries **4× `ngh="0"`** annotations plus the `<!--nghm-->`
  content-integrity marker.
- Client logs **"Angular hydrated 4 component(s) and 9 node(s), 0 component(s)
  were skipped"** — positive hydration, nothing skipped.
- `hydrate-server.mjs` injects a **blocking inline script** that stamps
  `data-server-node` on `app-ssr-shell`, `#plain`, and `#plain enhanced-select`
  at parse time; `hydrate-client.ts` records those node references **before**
  bootstrap and verifies the stamp **survives** `whenStable()` (object identity +
  attribute) → `window.__serverNodesReused === true`.

**Result: CONFIRMED.** Genuine hydration + node reuse; no NG05xx
warnings/mismatches (warnings are captured, not only errors).

## 3. F02 — The tag collision hides the real widget (GENUINE ADAPTER DEFECT)

**The S5-V "benign" classification is retracted.** Measured in Chromium + Firefox:

| Measurement | Value |
| --- | --- |
| host `<smilodon-select>` shadow root has a `<slot>` | **`false`** |
| `<enhanced-select>` `getClientRects().length` | **`0`** |
| `<enhanced-select>` bounding box | **`0×0`** |
| `elementFromPoint` at the widget centre | **`null`** (not painted / not hittable) |
| control experiment: same widget cloned into a plain `<div>` | **`48×1264` — renders** |
| combobox `INPUT` focus | `tabIndex:0` but `readOnly:true`, `offsetHeight:0`; `.focus()` does **not** move `document.activeElement` |

**Mechanism.** The `<smilodon-select>` host is upgraded by core's
`NativeSelectElement`, whose constructor does `attachShadow({mode:'open'})` and
appends only `_listRoot` (role=listbox) + `_liveRegion` (role=status). There is
**no `<slot>`**, so the light-DOM `<enhanced-select>` (the real widget) is **not
composed** into the rendered tree and is **not painted**. The widget itself is
fine (the clone renders); the **slotless foreign host shadow suppresses it**.

**Preserved as reproduction (not fixed).** Three Playwright tests are marked
`test.fail(true, …)` — reported as **expected failures** while F02 is open, and a
**loud unexpected-pass** if it is ever silently "fixed":

1. `tag collision does NOT hide the real widget (visible, sized, hittable)`
2. `collision does NOT suppress layout (host + widget have real geometry)`
3. `REAL focus cannot reach the widget while it is unrendered (F02 consequence)`

Production source, the public selector, and core registration are **unchanged**
per the directive. Remediation requires a **separate authorization**.

## 4. F03 — Genuine Angular `(change)` output + form-model behavior

`ChangeEventDetail` is `{ selectedItems, selectedValues, selectedIndices }`
(**not** `.value`). The fixture exposes
`window.__fixture = { lastChange, changeCount, formChanges, formLastValue }`.

- Initial reactive value `'b'` applied with **no programmatic echo**; control
  `untouched` **and** `pristine`.
- Selecting an option forwards the **Angular `(change)` output** to the fixture
  consumer (`changeCount` increments; `lastChange.selectedValues === ['a']`) —
  not merely a document-capture event.
- The reactive `FormControl` **model** updates to `'c'` after the corresponding
  click.
- Synthetic `focusin`/`focusout(relatedTarget)` → `ng-touched` retained as a
  separate **UNIT** check.

**Result: CONFIRMED (Chromium + Firefox).**

## 5. Test results

`npx playwright test --config tests/ssr/playwright.ssr.config.ts`

| Engine | Genuine passes | Expected failures | Status |
| --- | --- | --- | --- |
| **Chromium** | 5 | 3 (F02 reproduction) | **PASS** |
| **Firefox** | 5 | 3 (F02 reproduction) | **PASS** |
| **WebKit** | — | — | **UNVERIFIED-ENVIRONMENTAL** |

**WebKit** fails at **browser launch** (host missing `libicu74 libxml2
libflite1 …`), before any test body — **environmental, not an app defect.** The
project remains wired in `playwright.ssr.config.ts`.

## 6. Regression gates

| Gate | Result |
| --- | --- |
| `npx vitest run --config packages/angular/vitest.config.ts` | **6 files / 62 tests passed** |
| `npx vitest run --config packages/angular/vitest.ssr.config.ts` | **4 passed** |
| `cd packages/angular && node ./tests/consumer/run-consumer.mjs` | **PASSED** |
| `npm run build:angular` | **PASS** |
| `npx tsc -p packages/angular/tsconfig.json --noEmit` | **0 errors** |
| `npx eslint packages/angular/src packages/angular/tests` | **0 errors** |
| `npx vitest run --config packages/core/vitest.config.ts` | **1071 passed / 1 skipped** |
| `npx vitest run --config packages/core/vitest.ssr.config.ts` | **10 passed** |
| `npx tsc -p packages/core/tsconfig.json --noEmit` | **44 errors (pre-existing, unchanged)** |
| `python3 docs/architecture/baseline/w1-p1/verify_traceability.py` | **129/129 PASS** |

## 7. Files changed this increment (all test-fixture + docs)

- `packages/angular/tests/ssr/ssr-server.module.ts` — server-side `provideClientHydration()` (F01)
- `packages/angular/tests/ssr/hydrate-client.ts` — node-reuse detection via `data-server-node` + `whenStable()`
- `packages/angular/tests/ssr/ssr-app.component.ts` — `window.__fixture` state (change output + form model)
- `packages/angular/tests/ssr/hydrate-server.mjs` — inline stamp script before the client module
- `packages/angular/tests/ssr/hydration.spec.ts` — rewritten F01/F02/F03 specs + `test.fail()` F02 reproductions

**No production source, public selector, core engine, runtime dependency, or S4
contract was changed.** Production source is **identical to `2a9bd99`**.

## 8. Decision required

- **S5-VR:** VERIFIED-WITH-DEFECT-PRESERVED.
- **S5 production implementation:** **NO-GO** until F02 is resolved.
- **F02 requires a Lead decision.** This is an **adapter-level** defect (slotless
  `smilodon-select` host shadow suppresses the light-DOM `<enhanced-select>`).
  Remediation options (host-side slot handling, selector divergence, or core
  registration strategy) all touch production source and require **separate
  authorization**.

---

_End of S5-VR Test-Correction. F01 proven (real hydration + node reuse); F03
verified; F02 exposed a genuine adapter defect that the S5-V programmatic click
masked — the "benign" claim is retracted and the reproduction is preserved as
expected failures. WebKit remains environmental. Production source is unchanged
vs `2a9bd99`._
