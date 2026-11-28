# Angular Wave 2 — S5-Q Publication-Readiness Matrix (Q-12)

- **Artifact:** `Angular-Wave2-S5Q-PUBLICATION-READINESS-MATRIX`
- **Adapter:** `@smilodon/angular`
- **Starting commit:** `74fc5fc`
- **Published:** No
- **Overall status:** **PUBLICATION-READY-WITH-DOCUMENTED-LIMITATIONS**

This matrix records, for publication readiness, every readiness criterion (met/unmet) and every remaining
limitation with its classification, owner, remediation, and gating effect.

## Readiness criteria

| ID | Criterion | Status | Gate | Evidence |
|---|---|---|---|---|
| R-01 | Standalone CSR render + interaction (pointer+keyboard), Chromium+Firefox | MET | Q-01/Q-04 | CSR 18/18 chr, 18/18 ff |
| R-02 | Genuine SSR render + hydration reuse, zero mismatch diagnostics | MET | Q-02/Q-03 | SSR 10/10 chr, 10/10 ff |
| R-03 | S3 event forwarding (array-vs-scalar) | MET | Q-05 | CSR Q-05; unit events.spec |
| R-04 | S4 forms: zero initial echo, exactly-one change/edit | MET | Q-06 | CSR Q-06; unit CVA; AOT consumer |
| R-05 | Focus transitions + touched once at real focus-loss | MET | Q-07 | CSR Q-07; SSR focus; unit touched |
| R-06 | Disabled-state + programmatic reconciliation | MET | Q-08 | CSR Q-08 |
| R-07 | Deferred init + destroy/recreate safe | MET | Q-09 | CSR Q-09 |
| R-08 | Full-core import cannot revive host collision | MET | Q-10 | CSR Q-10; SSR F02-R02 |
| R-09 | Regression gates + traceability green | MET | Q-11 | S5Q evidence gateResults |
| R-10 | Every remaining limitation recorded | MET | Q-12 | this matrix |

## Remaining limitations

| ID | Limitation | Classification | Adapter defect? | Severity | Gating effect |
|---|---|---|---|---|---|
| L-01 | WebKit not verified on this build host | unverified-due-to-environmental-limitations | No | coverage-gap | Does not block Chromium/Firefox-qualified publication; WebKit unverified until provisioned |
| L-02 | S4 async (server-backed) provenance conservative classification | documented-adapter-limitation | Yes | low | Documented; not a blocker for common non-server-backed forms paths |
| L-03 | Multi select emits one initial empty `change` at init | documented-core-behavior | No | informational | None |
| L-04 | 44 pre-existing core tsc errors | pre-existing-out-of-scope | No | none-for-angular | None for Angular (Angular tsc = 0) |
| L-05 | Regression gates are developer-reported | disclosed | No | process | None (traceability independently recomputed 129/129) |

### Detail

- **L-01 WebKit** — `browserType.launch` fails in ~1ms: *"Host system is missing dependencies to run browsers"*
  (`libicu74`, `libxml2`, `libflite1`). Fails before any test body runs. Playwright projects remain wired.
  Remediation: `sudo npx playwright install-deps`, then re-run `csr-webkit` / `ssr-hydration-webkit`.
- **L-02 S4 async provenance** — while a server-backed `setSelectedValues()` fetch is in flight, any observed
  change is classified programmatic; a genuine user edit made during the fetch window is conservatively NOT
  reported to the form model (safer than a false echo). Documented in `select.component.ts` / `provenance.ts`.
  **Preserved and NOT silently classified resolved.** Owner: next forms-hardening increment.
- **L-03 Multi init empty change** — core `updateConfig()→clear()` on a single→multi mode switch at init.
  Correctly classified programmatic by the adapter (no form-model write-back; `#formgroup` groupChanges=0 at init).
  Single selects emit no boot change. Owner: core (informational).
- **L-04 Core tsc 44** — identical to accepted baseline; core remediation is a separate NO-GO track (S6).
- **L-05 Developer-reported gates** — disclosed; `verify_traceability.py` independently recomputes 129/129.

## Publication preconditions

1. Lead acceptance of the S5-Q artifact bundle.
2. An explicit publish decision (S5-Q does **not** publish).

## Not done here

No npm publish · no production source change · no core change · no selector redesign · no unrelated dependency changes.
