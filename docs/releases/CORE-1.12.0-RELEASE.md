# Smilodon Core 1.12.0 — release qualification and publication

**Status:** release candidate prepared on `release/prepare-core-1.12.0-docs`; **NOT published**. Do not claim npm publication until the public npm registry confirms the exact version and artifact integrity.

## Package scope and history

- **Core `1.12.0`**: includes the merged custom active-class fix (#82) and configurable dropdown exit animations (PR #86). This is a minor release because it adds a new configurable feature.
- **Related hover fix (#77)**: stable option-hover geometry was already included in the published Core `1.11.0` release. The three fixes are therefore documented across versions `1.11.0` and `1.12.0`; `1.12.0` does not change or replace the published `1.11.0` artifact.
- The private monorepo root `package.json` and root lockfile metadata are aligned to `1.12.0` for repository consistency. **Adapter packages keep independent versions** (`@smilodon/react@1.11.0` until #85 is merged; other adapter versions unchanged). A private root version is not an npm publication.
- **Core `1.11.1` is occupied on npm** with a different artifact integrity. Never publish a different tarball under the same version; npm does not allow overwriting published versions.
- The existing published `@smilodon/react@1.11.0` has peer dependency `@smilodon/core: ^1.11.0`, compatible with Core `1.12.0`.
- **React #85 is excluded**: its tested source is on an unpushed local branch `fix/85-react-acknowledged-items` at `29c67067b3bf345347f74e2dc074095dc9eb2ab9`. It must first be pushed and merged independently, then released under a fresh React version (potentially `1.11.1` if npm confirms it is vacant). Do not publish an unchanged React package as if it contained #85.

## Implementation verification

Core exit animation is controlled by `--select-dropdown-exit-animation` and the documented `--select-dropdown-exit-*` CSS variables. It updates popup semantics immediately and keeps the visual panel inert until animation completion. The custom-active-class fix normalizes `classMap.active` to prevent stale legacy `active` classes.

Read:
- [Core README](../../packages/core/README.md#dropdown-enter-and-exit-animations-core-1120-release-candidate)
- [React guide](../../packages/react/README.md#dropdown-animation-controls-core-1120-release-candidate)
- [Animation implementation](../architecture/DROPDOWN-EXIT-ANIMATION.md)
- [Changelog](../../CHANGELOG.md)

## Provenance and qualification

- Merged PR #86: https://github.com/navidrezadoost/Smilodon/pull/86
- Merge commit: `8dd48b2997016e3cb6258795d793a0f983cba0f9`
- Qualified feature head: `959e5e807477eee650ddd7c6fd097ae31b041869`
- Local PR qualification reported: `npm ci`, full build, lint 0 errors / 6 existing warnings, exit tests 8/8, React contracts 41 passed / 6 skipped, `npm test` 723 passed / 7 skipped, Chrome 156 browser scenarios 4/4 plus Escape, pointer outside, option selection, `animation: none` and disconnect.
- Pinned Playwright Chromium 147 unavailable; **no compatibility claim** for that browser version.
- A post-merge `1.11.1`-manifest Core archive was packed and verified with an isolated consumer. **Repack and reverify the `1.12.0` archive**, because its manifest and integrity must differ.

## Publication operator checklist (local, no GitHub Actions)

Run from a fresh checkout of the approved release commit with **Node 20 / npm 10**, and a clean working tree. Ensure no npm auth tokens are committed.

```bash
git status --short
node --version
npm --version
npm ci
npm run build
npm run lint
npm test
npm run test:contracts:react

# Verify exact manifest and lockfile versions.
node -p "require('./package.json').version"
node -p "require('./packages/core/package.json').version"
node -p "require('./package-lock.json').packages['packages/core'].version"

# Registry checks require network and npm access.
npm view @smilodon/core@1.11.1 version --registry=https://registry.npmjs.org/
npm view @smilodon/core@1.12.0 version --registry=https://registry.npmjs.org/
# The second command MUST indicate that 1.12.0 is still unpublished.
# If 1.12.0 already exists, STOP and select the next valid release version.
npm whoami --registry=https://registry.npmjs.org/
```

When all checks pass, pack Core from the workspace in a disposable directory:

```bash
mkdir -p /tmp/smilodon-core-1.12.0-pack
npm pack --workspace @smilodon/core --pack-destination /tmp/smilodon-core-1.12.0-pack --json
sha256sum /tmp/smilodon-core-1.12.0-pack/smilodon-core-1.12.0.tgz
tar -tzf /tmp/smilodon-core-1.12.0-pack/smilodon-core-1.12.0.tgz | head -40
```

Install the exact packed archive in a **fresh separate consumer** and smoke-test imports, `CSS` variables, logical/ARIA close, inert exit and accessibility. Inspect `npm pack --dry-run --json --workspace @smilodon/core` for included files.

**Only the npm account owner with publish rights should execute the irreversible publishing step** after verifying the exact package version and contents:

```bash
npm publish --workspace @smilodon/core --access public --registry=https://registry.npmjs.org/
```

If the registry requires two-factor authentication or an authorized publish token, complete that challenge securely in the user's terminal. Never pass credentials through a PR, chat transcript, README or repository file.

After the publish command succeeds:

```bash
npm view @smilodon/core@1.12.0 version dist.integrity dist.shasum --json --registry=https://registry.npmjs.org/
npm view @smilodon/core dist-tags --json --registry=https://registry.npmjs.org/
```

Verify the registry archive is the one just published. Commit/tag only according to the repository's existing release policy; update the changelog from `Pending npm publication` to the **actual publish date** only after verification. There is no need to invoke hosted CI.

## Follow-up React release — Issue #85

Before a React release containing #85:

1. Push the prequalified local branch for the fix and open its own PR against the now-current `main`; preserve all existing tests and commit history where possible.
2. Rebase/merge and resolve documentation overlaps with the Core `1.12.0` release docs; run local focused acknowledged tests, React contracts, full tests and available browser certification.
3. Verify npm availability of the intended new React version. A React patch such as `1.11.1` is sensible **only if unoccupied** and only after the fix has been merged.
4. Build, pack, install in a clean consumer and verify cumulative pagination survives unrelated React configuration rerenders. Validate React's peer range with Core `1.12.0`.
5. Publish **React only**, using the npm account owner's authenticated local environment; verify registry integrity and close Issue #85 after availability is confirmed.

## No hosted workflows

No GitHub Actions should be invoked by release preparation, testing or merge operations. Respect branch protection; do not bypass required checks. Use local qualification evidence and the repository's normal review/merge process.
