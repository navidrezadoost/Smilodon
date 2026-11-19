# Smilodon Core 1.12.0 — release qualification and publication

**Status:** published and registry-verified on 2026-11-19. Source: `main` commit `d4711d4437b7a8809c8e672c46832b22a77cb069`.

## Package scope and history

- **Core `1.12.0`**: adds configurable dropdown exit animation (#86). The package also retains earlier fixes from the current Core source: stable option-hover geometry (#77), shipped in `1.11.0`, and custom active-class lifecycle (#82), shipped in `1.11.1`.
- These three fixes are available across Core `1.11.0`, `1.11.1`, and `1.12.0`; `1.12.0` does not replace or alter either previously published archive.
- The private monorepo root `package.json` and root lockfile metadata are aligned to `1.12.0` for repository consistency. **Adapter packages keep independent versions** (`@smilodon/react@1.11.0` until #85 is merged; other adapter versions unchanged). A private root version is not an npm publication.
- **Core `1.11.1` is occupied on npm** with a different artifact integrity. Never publish a different tarball under the same version; npm does not allow overwriting published versions.
- The existing published `@smilodon/react@1.11.0` has peer dependency `@smilodon/core: ^1.11.0`, compatible with Core `1.12.0`.
- **React #85 is excluded**: its tested source is on an unpushed local branch `fix/85-react-acknowledged-items` at `29c67067b3bf345347f74e2dc074095dc9eb2ab9`. It must first be pushed and merged independently, then released under a fresh React version (potentially `1.11.1` if npm confirms it is vacant). Do not publish an unchanged React package as if it contained #85.

## Implementation verification

Core exit animation is controlled by `--select-dropdown-exit-animation` and the documented `--select-dropdown-exit-*` CSS variables. It updates popup semantics immediately and keeps the visual panel inert until animation completion. The custom-active-class fix normalizes `classMap.active` to prevent stale legacy `active` classes.

Read:
- [Core README](../../packages/core/README.md#dropdown-enter-and-exit-animations-core-1120)
- [React guide](../../packages/react/README.md#dropdown-animation-controls-core-1120)
- [Animation implementation](../architecture/DROPDOWN-EXIT-ANIMATION.md)
- [Changelog](../../CHANGELOG.md)

## Provenance and qualification

- Merged PR #86: https://github.com/navidrezadoost/Smilodon/pull/86
- Merge commit: `8dd48b2997016e3cb6258795d793a0f983cba0f9`
- Qualified feature head: `959e5e807477eee650ddd7c6fd097ae31b041869`
- Local PR qualification reported: `npm ci`, full build, lint 0 errors / 6 existing warnings, exit tests 8/8, React contracts 41 passed / 6 skipped, `npm test` 723 passed / 7 skipped, Chrome 156 browser scenarios 4/4 plus Escape, pointer outside, option selection, `animation: none` and disconnect.
- Pinned Playwright Chromium 147 unavailable; **no compatibility claim** for that browser version.
- Published archive: SHA-256 `0f672e6535a7483790249f44de6392ec715f7f32205f319470432168f4571049`; npm shasum `a9242b47c963f48550a0ce70417f16fa53556467`; SRI `sha512-/aA5Y96rvbvk+iyF8qz+pHuN/Pum1o5wrQIY9y9jCTjYLyyb8+7vP65cSHlNskOAafS/SJeoa/d9HTAGYv7QpA==`.
- The registry's integrity and shasum match the packed archive. A fresh consumer installed `@smilodon/core@1.12.0` from npm and verified its metadata and packaged README.
- On this exact main commit, Node `20.20.2` / npm `10.8.2`, `npm ci`, and the Core build passed. The local PR qualification remains 723 passed/7 skipped, React contracts 41 passed/6 skipped, focused exit tests 8/8, and Chrome 156 scenarios 4/4. Chromium 147 remains unverified.

## Publication record (local, no GitHub Actions)

The release was built from the merged `main` commit with **Node 20 / npm 10**. `npm ci`, the Core workspace build, archive inspection, and a clean tarball consumer install completed before publication. The exact tarball was published and verified below.

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

# Registry availability and identity were verified before publication.
npm view @smilodon/core@1.11.1 version --registry=https://registry.npmjs.org/
npm view @smilodon/core@1.12.0 version --registry=https://registry.npmjs.org/
npm whoami --registry=https://registry.npmjs.org/
```

Packed artifact record:

```bash
mkdir -p /tmp/smilodon-core-1.12.0-pack
npm pack --workspace @smilodon/core --pack-destination /tmp/smilodon-core-1.12.0-pack --json
sha256sum /tmp/smilodon-core-1.12.0-pack/smilodon-core-1.12.0.tgz
tar -tzf /tmp/smilodon-core-1.12.0-pack/smilodon-core-1.12.0.tgz | head -40
```

The exact archive was installed in a fresh consumer before publication. After the registry accepted the publish, these commands confirmed the published version and integrity:

```bash
npm view @smilodon/core@1.12.0 version dist.integrity dist.shasum --json --registry=https://registry.npmjs.org/
npm view @smilodon/core dist-tags --json --registry=https://registry.npmjs.org/
```

Registry SRI and SHA-1 matched the packed artifact. The `latest` dist-tag now resolves to `1.12.0`. There was no need to invoke hosted CI.

## Follow-up React release — Issue #85

Before a React release containing #85:

1. Push the prequalified local branch for the fix and open its own PR against the now-current `main`; preserve all existing tests and commit history where possible.
2. Rebase/merge and resolve documentation overlaps with the Core `1.12.0` release docs; run local focused acknowledged tests, React contracts, full tests and available browser certification.
3. Verify npm availability of the intended new React version. A React patch such as `1.11.1` is sensible **only if unoccupied** and only after the fix has been merged.
4. Build, pack, install in a clean consumer and verify cumulative pagination survives unrelated React configuration rerenders. Validate React's peer range with Core `1.12.0`.
5. Publish **React only**, using the npm account owner's authenticated local environment; verify registry integrity and close Issue #85 after availability is confirmed.

## No hosted workflows

No GitHub Actions should be invoked by release preparation, testing or merge operations. Respect branch protection; do not bypass required checks. Use local qualification evidence and the repository's normal review/merge process.
