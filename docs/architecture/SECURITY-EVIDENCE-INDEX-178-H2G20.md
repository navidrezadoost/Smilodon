# Security and Qualification Evidence Index — H.2G.20

Status: **Historical local evidence is not included in the proposed Git tree. Hosted evidence listed as pending does not yet exist.** These manifest identifiers and SHA-256 digests identify local files in the isolated worktree. A checksum does not make a local artifact remotely accessible.

### H2G14 locked audit

Reference: `H2G14-LOCKED-AUDIT`.

- Category/directive: Full and production-only locked npm audits, dependency graph, build and test evidence / 178-H.2G.14.
- Expected location: local worktree `docs/architecture/178-h2g14-evidence/`.
- Manifest `178-H2G14-SHA256SUMS`; SHA-256 `42226e5ed0b08b0329568fd95518b27c16aa8fd01b0cc3a486d4e669b3cdc5a8`.
- Full audit JSON SHA-256 `a6f82252cef000114d92e65e5abcf5f2bb7d44485f51e6cc9e04107084754433`; production audit JSON SHA-256 `405b4807f0ccd243d28c20bf2cf55558d34948cbf95019f1b6915eab507724d5`.
- Availability: directory retained in the isolated worktree; manifest verified; excluded from proposed Git tree.

### H2G15 Metro reachability

Reference: `H2G15-METRO-REACHABILITY`.

- Category/directive: Metro `image-size` High reachability assessment / 178-H.2G.15, supported by H2G14 audit artifacts.
- Expected location: local worktree `docs/architecture/178-h2g14-evidence/`.
- Supporting manifest `178-H2G14-SHA256SUMS`; SHA-256 `42226e5ed0b08b0329568fd95518b27c16aa8fd01b0cc3a486d4e669b3cdc5a8`.
- Availability: supporting files retained in the isolated worktree; manifest verified; the assessment report is in the proposed Git tree. No security exception is implied.

### H2G16 Node18 consumer

Reference: `H2G16-NODE18-CONSUMER`.

- Category/directive: Packed Core NodeNext and Bundler declaration consumer result / 178-H.2G.16–.17.
- Expected location: local worktree `docs/architecture/178-h2g16-evidence/node18/node18-consumer-result.json`.
- Manifest `178-H2G16-SHA256SUMS`; SHA-256 `0d65a4a710becee9e929d34646d777bcbe065b708ebbc732845b2848aa3d0318`.
- Result artifact SHA-256 `f0b9d2358db3a79712e14c7728bd7e2536cc641c3d42bb1e3b2e87e2dcec48a9`.
- Availability: directory retained in the isolated worktree; manifest verified; excluded from proposed Git tree.

### H2G17 failure paths

Reference: `H2G17-FAILURE-PATHS`; includes the assertion comparison and simulated audit/failure-path outputs.

- Category/directive: 703-assertion comparison, Node 18 result, and simulated audit/failure-path outputs / 178-H.2G.17.
- Expected location: local worktree `docs/architecture/178-h2g16-evidence/h2g17/`.
- Manifest `178-H2G16-SHA256SUMS`; SHA-256 `0d65a4a710becee9e929d34646d777bcbe065b708ebbc732845b2848aa3d0318`.
- Assertion comparison JSON SHA-256 `cc2fdca95ffb413cfb50435f3d401c524b9383f4dd580ea5f26cb6f9f6645fa1`.
- Availability: directory retained in the isolated worktree; manifest verified; excluded from proposed Git tree.

### H2G18 Node20 qualification

Reference: `H2G18-NODE20-QUALIFICATION`.

- Category/directive: Node 20 integrity tests, certified-baseline comparison, cross-version identity comparison, and candidate inventory / 178-H.2G.18.
- Expected location: local worktree `docs/architecture/178-h2g16-evidence/h2g18/`.
- Manifest `178-H2G18-NODE20-SHA256SUMS`; SHA-256 `58c0ad5838be99299e8f704a9a9afd2ea1433d137b41eeef4e60e7e54aca8550`.
- Comparison JSON SHA-256 `2e73f544d7c3c7b25092c013e202c4f9a318242ea640f89badd10378f647f4f2`; integrity TAP SHA-256 `51b772feb1e0f965f8685bdbdaba7f894584d3d21a94c42e2c027ffa73be0abd`.
- Availability: directory retained in the isolated worktree; manifest verified; excluded from proposed Git tree.

### Hosted Node 22 full suite — `H2G16-NODE22-HOSTED`

- Category/directive: Node 22 lint, type, build, unit, and contract checks / H2G16 readiness workflow.
- Expected location: GitHub Actions artifact `h2g16-node22-<run_id>`.
- SHA-256: not available; the workflow has not run.
- Availability: **pending; artifact does not exist.**

### Hosted security audit — `H2G16-SECURITY-HOSTED`

- Category/directive: Full and production-only npm audit JSON and gate status / H2G16 readiness workflow.
- Expected location: GitHub Actions artifact `h2g16-security-audit-<run_id>`.
- SHA-256: not available; the workflow has not run.
- Availability: **pending; artifact does not exist.** A valid report is expected to show the remaining Metro High as policy-blocked; malformed or missing evidence is a separate failure.

### Hosted assertion comparison — `H2G16-ASSERTIONS-HOSTED`

- Category/directive: Baseline/candidate assertion reports and comparison / H2G16 readiness workflow.
- Expected location: GitHub Actions artifact `h2g16-assertion-inventory-<run_id>`.
- SHA-256: not available; the workflow has not run.
- Availability: **pending; artifact does not exist.**

### Hosted Node 18 consumer — `H2G16-NODE18-HOSTED`

- Category/directive: Hosted packed Core Node 18 consumer result and package provenance / H2G16 readiness workflow.
- Expected location: GitHub Actions artifact `h2g16-core-node18-result-<run_id>`.
- SHA-256: not available; the workflow has not run.
- Availability: **pending; artifact does not exist.**

The H2G14/H2G16 manifests list repository-relative paths present only in the isolated local worktree. Their checksums are verifiable there, but they are not accessible to reviewers from a checkout of the proposed Git tree. Do not treat local digests as hosted evidence or as proof of independent review. Hosted artifacts become available only after a separately authorized candidate commit is tested.
