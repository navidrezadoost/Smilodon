# Angular Wave 2 — S5-V Test-Only Verification

**Increment:** Angular Wave 2 — **S5-V SSR/Hydration Test-Only Verification**
**Accepted baseline commit (production):** `2a9bd9985315507cefc215d30dbebf0c286466c4` (S4/S4-R CLOSED)
**Starting commit for this slice:** `ce86fcd` (S5 readiness assessment, docs-only)
**Branch:** `codex/w1-p1-3-keyboard-characterization`
**Authorization:** Lead S5-V directive "GO — S5-V TEST-ONLY VERIFICATION": add a
reproducible **server-render** and **real-browser hydration** test using the
**built** Angular package (public distribution entry, not a bypass), validate the
`<smilodon-select>` host shadow-root collision **in a real browser** (not only
jsdom), and capture hydration errors explicitly. Developer-only dependencies,
fixtures, and test config are authorized where strictly necessary. **No production
behavior change** permitted. Production source, public selectors, core engine,
runtime deps, and existing contract behavior MUST NOT change.

> **Verdict: the S5 readiness hypotheses (H1/H2/H3) are CONFIRMED in real
> browsers (Chromium + Firefox). WebKit is unverified due to environmental
> limitations (missing system libraries), not an app defect. Production source is
> unchanged vs `2a9bd99`.**

---

## 0. What was verified vs. what the S5 assessment left open

The S5 assessment (commit `ce86fcd`) classified three hypotheses as *unverified*
and flagged two blockers (B-S5-1, B-S5-2). This slice closes them with actual
execution:

| S5 open item | How S5-V closed it | Result |
| --- | --- | --- |
| **H3** SSR serialization shape (§2 of S5) | Real `renderModule()` server render of the built package | **CONFIRMED** |
| **H1** foreign host shadow root benign under hydration (§3.1/§4 of S5) | Real-browser hydration e2e; shadow-root collision characterized in-engine | **CONFIRMED** (Chromium + Firefox) |
| **H2** hydration does not re-run `writeValue` as a user edit (§6 of S5) | Real-browser hydration; reactive initial value + touched/pristine asserted | **CONFIRMED** (Chromium + Firefox) |
| **B-S5-1** "no real SSR render + no hydration e2e" | Added SSR render probe + real-browser hydration e2e | **CLOSED** |
| **B-S5-2** tag collision benignity in real engines | Characterized in Chromium + Firefox; WebKit blocked by environment | **CLOSED for Chromium/Firefox; WebKit unverified-environmental** |

The directive's three-level distinction is respected throughout:

- **Import safety** — already PASS at S5 (unchanged); not re-litigated here.
- **SSR rendering** — now **actually performed** (§1).
- **Hydration correctness** — now **actually performed in real browsers** (§2).

---

## 1. S5-V1 — Reproducible server render (built package, public entry)

**Conclusion: PASS — the built Angular package server-renders the derived
placeholder exactly; core is NOT evaluated on the server.**

**Method.** A fixture Angular application (`ssr-app.component.ts`) uses the
**built** `@smilodon/angular` (resolved via the package's public entry through a
workspace symlink `tests/ssr/node_modules/@smilodon/angular → ../../dist`; the
public distribution entry is used, not a source bypass). It renders two selects:

- `#plain` — `[items]` + `(change)` (unbound value), placeholder `"Pick one"`.
- `#reactive` — `[items]` + `[formControl]` with initial value `'b'`.

The app is rendered with Angular's real SSR path: `renderModule(SsrAppModule, …)`
from `@angular/platform-server` (NgModule/bootstrapped shell — the partial
`@angular/*` ESM in this workspace does not export `bootstrapApplication`, so the
NgModule path is the correct, supported real-SSR equivalent). Run:

```
cd packages/angular/tests/ssr
node --import ./register-loader.mjs render-server.mjs
```

**All 9 assertions PASS:**

| # | Assertion | Detail |
| --- | --- | --- |
| 1 | server produced non-empty HTML | 644 bytes |
| 2 | two `<smilodon-select>` hosts serialized | found 2 |
| 3 | each host serializes an `<enhanced-select>` placeholder | found 2 |
| 4 | NO shadow/combobox internals server-side (core not evaluated) | no `role=combobox` / `role=listbox` |
| 5 | empty `<enhanced-select></enhanced-select>` placeholders (no children) | — |
| 6 | Angular SSR/hydration markers present | `ng-version`/`ng-server-context`/ngh |
| 7 | `provideServerRendering` exported (platform-server active) | — |
| 8 | `platformServer` exported (platform-server active) | — |
| 9 | `@smilodon/core` NOT evaluated on the server | — |

**Actual serialized region (verbatim):**

```html
<app-ssr-shell ng-version="21.2.26" ng-server-context="other">
<app-ssr>
<smilodon-select id="plain" placeholder="Pick one" _nghost-ng-c1503081821="">
<enhanced-select _ngcontent-ng-c1503081821="">
</enhanced-select>
</smilodon-select>
<smilodon-select id="reactive" _nghost-ng-c1503081821="" class="ng-untouched ng-pristine ng-valid">
<enhanced-select _ngcontent-ng-c1503081821="">
</enhanced-select>
</smilodon-select>
</app-ssr>
</app-ssr-shell>
```

**Findings.**

- **H3 CONFIRMED.** The server output matches the derived placeholder exactly:
  each `<smilodon-select>` host contains exactly one **empty** `<enhanced-select>`
  child, with **no** shadow DOM, combobox, popup, chips, or ARIA — all of which are
  built only in the browser after the deferred upgrade. The reactive select's
  server-side class already reflects the S4 forms state (`ng-untouched ng-pristine
  ng-valid`).
- **Core not evaluated server-side.** No `role=combobox`/`role=listbox` and no
  element internals appear; API-075 is never triggered on the server (Option A
  strategy holds, verified by real render — not just source).
- **Static `_nghost-…`/`_ngcontent-…` attributes** confirm the hydration boundary
  markers Angular emits are present, i.e. real Angular SSR, not a hand-serialized
  string.

---

## 2. S5-V2 — Real-browser hydration (Chromium + Firefox)

**Conclusion: PASS — hydration completes with no mismatch errors; the H1/H2
semantics hold; the `<smilodon-select>` host shadow-root collision is
characterized in-engine and is benign under hydration.**

**Method.** The server-rendered HTML from §1 is served with a module bundle of the
**built** package (client entry `hydrate-client.ts`, compiled by `ngc` and bundled
by esbuild with annotations preserved so the `@angular/compiler` JIT fallback that
this partial-compiled workspace needs is retained). The client bootstraps with
`provideClientHydration(withEventReplay())` on the **same** shell selector
(`app-ssr-shell`) as the server, so Angular hydrates the existing server DOM. A
Playwright config drives 4 specs across engine projects. Run:

```
cd packages/angular/tests/ssr
NO_PROXY=localhost,127.0.0.1,::1 no_proxy=localhost,127.0.0.1,::1 \
  npx playwright test --config=playwright.ssr.config.ts \
  --project=ssr-hydration-chromium --project=ssr-hydration-firefox
```

**Result: 8 passed (4 specs × 2 engines), ~8.1s.** Per spec (both engines):

| Spec | Asserts | Result |
| --- | --- | --- |
| Hydration completes with no mismatch errors + preserves server DOM shape (H1/H3) | `window.__hydrateError === null`; `window.__hydrated === true`; two hosts present; real combobox lives **inside** `<enhanced-select>` shadow; **host `<smilodon-select>` carries a shadow root** (collision characterized) and yet **no visible artifact / no mismatch** | ✔ |
| Reactive form applies initial value without a programmatic feedback echo (H2) | reactive select value `'b'`; control `untouched` **and** `pristine` after hydration (hydration is NOT a user edit); no spurious `(change)` | ✔ |
| Selection works after hydration and forwards change | clicking the option container opens the popup, selecting `Alpha` sets value `'a'` and emits a forwarded core `change` to Angular (filtered on `hostId === 'plain'`) | ✔ |
| Focus/touched semantics correct after hydration | synthetic `focusin` + `focusout(relatedTarget: document.body)` marks `ng-touched` (S4-R focus-loss boundary), not on hydration | ✔ |

**Findings.**

- **H1 CONFIRMED (Chromium + Firefox).** The host `<smilodon-select>` element *does*
  receive a foreign shadow root when core upgrades it (collision is real in-engine,
  not a jsdom artifact), **but** Angular hydration does **not** report a mismatch,
  and the real combobox lives correctly inside the `<enhanced-select>` shadow root.
  The foreign shadow root on the host is inert w.r.t. the adapter and produces no
  visible artifact or hydration error. The tag collision is therefore
  **characterized and benign under hydration** in these two engines.
- **H2 CONFIRMED (Chromium + Firefox).** Initial reactive value `'b'` is applied;
  the control remains `untouched` **and** `pristine` after hydration — hydration /
  initial reconciliation is **not** interpreted as a user edit — and no feedback
  echo `(change)` fires. The S4/S4-R provenance model holds across the
  server→client boundary.
- **Selection + event forwarding + touched-on-focus-loss** all behave identically
  to the CSR baseline after hydration.
- The collision was **not** "fixed", the **public selector was not changed**, and
  core registration was **not** suppressed — only characterized, per the directive.

### 2.1 WebKit — unverified due to environmental limitations

WebKit could not be launched in this environment:

```
Host system is missing dependencies to run browsers.
Please install them with the following command:
  npx playwright install-deps   (needs: libicu74 libxml2 libflite1 …)
```

Passwordless `sudo` is unavailable in this sandbox, so the WebKit launch fails
before any test body runs (all 4 specs report a browser-launch error, not an
assertion failure). **Classification: `unverified-due-to-environmental-limitations`
— NOT an application defect.** The WebKit project remains wired in
`playwright.ssr.config.ts` so it will run verbatim once the host has the system
libraries.

---

## 3. Result classification

| Result | Classification |
| --- | --- |
| S5-V1 server render — 9/9 checks | **PASS** |
| S5-V2 hydration — Chromium | **PASS** |
| S5-V2 hydration — Firefox | **PASS** |
| S5-V2 hydration — WebKit | **unverified-due-to-environmental-limitations** (missing system libs) |
| H1 (host shadow root benign under hydration) | **CONFIRMED** (Chromium + Firefox) |
| H2 (hydration ≠ user edit; value applied) | **CONFIRMED** (Chromium + Firefox) |
| H3 (SSR shape = derived placeholder) | **CONFIRMED** |
| `<smilodon-select>` tag collision | **CHARACTERIZED — benign under hydration** (Chromium + Firefox); **NOT fixed**, selector unchanged, core registration not suppressed; WebKit unverified |

No confirmed defect was found. The only non-pass is WebKit, blocked by the host
environment, not by the application.

---

## 4. Reproducible artifacts (test-only)

All fixtures live under `packages/angular/tests/ssr/` and are **test-only**; none
touch production source. Build artifacts (`.aot-out/`, `.aot-client/`,
`node_modules/`) are `.gitignore`d and regenerated on demand.

| File | Role |
| --- | --- |
| `ssr-app.component.ts` | Fixture app: `#plain` and `#reactive` (initial `'b'`) selects using the built package |
| `ssr-server.module.ts` | `SsrAppModule` + `SsrServerShellComponent` (`app-ssr-shell`) for the SSR bootstrapped shell |
| `render-server.mjs` | `renderModule()` SSR probe; writes `.aot-out/server-render.{html,summary.json}`; prints the serialized region; asserts 9 checks |
| `build-fixture.mjs` | Reproducible pipeline: ngc (server) → ngc (client) → server render → esbuild bundle (annotations preserved to keep the JIT fallback) |
| `tsconfig.server.json` / `tsconfig.client.json` | AOT compile configs mirroring a real consumer tsconfig |
| `publish-facade.ts` | Keeps the `@angular/compiler` `publishFacade` binding live for the partial-compiled workspace JIT fallback (test-only) |
| `hydrate-client.ts` | Client entry: `BrowserModule` + `provideClientHydration(withEventReplay())`; bootstraps `app-ssr-shell` to hydrate |
| `hydrate-server.mjs` | Serves the server HTML + client bundle on `localhost:5174` |
| `hydration.spec.ts` | 4 Playwright specs (H1/H3, H2, selection+change, focus/touched) |
| `playwright.ssr.config.ts` | Engine projects: `ssr-hydration-chromium`, `ssr-hydration-firefox`, `ssr-hydration-webkit`; `NO_PROXY` bypass |
| `global-setup.ts` | Runs `build-fixture.mjs` before tests |
| `.gitignore` | Excludes regenerated build artifacts |

**Isolation:** `packages/angular/vitest.config.ts` was updated to **exclude**
`packages/angular/tests/ssr/**` from the jsdom vitest run (the hydration spec uses
Playwright's runner). This is a test-config-only change; the jsdom suite now reports
**6 files / 62 tests** (unchanged test count).

---

## 5. Environment and dependency note

- Added **`@angular/platform-server@21.2.26`** as a **devDependency** of the
  `packages/angular` workspace (required to perform a real Angular SSR render). This
  is a developer-only dependency; it is a **peer/dev** tool for the test, not a
  runtime dependency of the published package (`dist/package.json` runtime deps
  unchanged: only `tslib`; peers unchanged).
- Playwright browser binaries were launched via explicit `executablePath` to the
  locally installed revision (Chromium 1248, Firefox 1511) to match the installed
  binaries.
- `esbuild` was run with the working directory outside the repo root and an
  explicit `nodePaths` to bypass the repository's stale Yarn-PnP shim (`.pnp.cjs`)
  that otherwise fails to resolve `@smilodon/*`; this is a build-tooling
  workaround for the test fixture build only.

---

## 6. Production-unchanged confirmation

- `git diff packages/angular/src packages/core/src` vs `2a9bd99` is **empty**.
- Public component selector `smilodon-select`, template, lifecycle, forms,
  provenance, event bridge: **unchanged**.
- Core engine: **unchanged**; core registration **not** altered or suppressed.
- Runtime dependencies of the built package: **unchanged**.
- The tag collision is characterized, **not** fixed — no selector rename, no
  `ElementRef`/`HostBinding` change, no core guard added.

---

## 7. Compliance with the S5-V directive

| Directive requirement | Status |
| --- | --- |
| Reproducible server-render test using the built package (public entry) | **Done** (§1, `render-server.mjs`, resolves through the dist public entry) |
| Real-browser hydration test | **Done** (§2, Playwright, Chromium + Firefox) |
| Validate host shadow-root collision in a real browser (not just jsdom) | **Done** (§2, host shadow root observed in-engine) |
| Capture hydration errors explicitly | **Done** (`window.__hydrateError === null` asserted per spec) |
| Distinguish import safety / SSR rendering / hydration correctness | **Done** (§0, §1, §2 kept separate) |
| WebKit/environmental failures classified as environmental, not app defects | **Done** (§2.1, §3) |
| No production source / selector / core / runtime-dep / contract changes | **Confirmed** (§6) |
| Developer-only deps/fixtures/test config permitted where necessary | **Used** (platform-server devDep, fixtures, vitest exclude) |

---

_End of S5-V Test-Only Verification. Server rendering (**H3**) and real-browser
hydration (**H1/H2**) are confirmed on Chromium and Firefox using the built
package; WebKit is unverified due to missing host system libraries (environmental,
not an app defect). The `<smilodon-select>` host shadow-root collision is a real
in-engine behavior yet produces no hydration mismatch or visible artifact — it is
characterized, not fixed, and the public selector and core registration are
unchanged. Production source remains identical to `2a9bd99`._
