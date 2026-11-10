# Release consumer qualification blockers — 2026-11-10

**Status: RELEASE BLOCKED (published npm consumer artifacts do not satisfy strict TypeScript NodeNext).** This document records post-publication findings and the required technical fixes. It does not certify the packages and does not authorize another registry publication or GitHub Release.

## Observed registry state

- The public npm registry already contains `@smilodon/core`, `@smilodon/react`, `@smilodon/vue`, `@smilodon/solid`, `@smilodon/vanilla`, and `@smilodon/react-native` at `1.10.0`.
- `@smilodon/svelte@2.0.0` is published. Its registry tarball was reported to match the qualified candidate SHA-256 `f5aa20c1064e465c9e0ffa833dd963095b63d5a732b377bcbd7b74c7f040e82c`.
- The existing npm tarballs for the five other targeted web packages at `1.10.0` differ from their later qualified candidate artifacts. Do not overwrite or attempt to republish immutable versions.
- The GitHub Packages scope `@smilodon` belongs to a separate GitHub user account; its ownership and publication access from this repository remain unverified. No GitHub Packages publication is claimed.
- No GitHub Release `v1.10.0` has been created.

## Post-publication verification

- Installation of the six target web packages from the public npm registry succeeded.
- A browser smoke test imported the six packages and created a Core `enhanced-select` with two items.
- **All six strict NodeNext consumers failed** with `strict: true` and `skipLibCheck: false`. The published Core declarations contain extensionless relative import specifiers that NodeNext cannot resolve. Downstream adapters are affected through Core.
- The published Vanilla adapter additionally has no resolvable TypeScript declaration entry.
- This strict consumer gate takes precedence over CI that only tests source trees, workspace links, locally packed artifacts, or builds with declaration checking disabled.

## Mandatory engineering remediation

1. Fix Core declaration emit/source import specifiers for NodeNext. Use valid explicit `.js` specifiers for emitted ESM declaration imports and ensure exported subpaths resolve. Preserve compatibility with Bundler resolution.
2. Fix Vanilla declaration generation and `package.json` exports/types paths so the packed archive includes the referenced `.d.ts` entry.
3. Add a clean, registry-installed consumer matrix for Core plus React, Vue, Solid, Vanilla, and Svelte with both NodeNext and Bundler; enforce `strict: true`, `skipLibCheck: false`, and independent install (not workspace symlinks). Exercise imports and public types from the actual `.tgz` files.
4. Check package manifests and peer ranges against the next corrected, independently versioned Core and adapter artifacts. **Never reuse an npm version for different bytes.** Define new publishable patch/minor versions as appropriate, including a new Svelte version after `2.0.0` if its Core dependency needs updating.
5. Publish only after the packed-consumer matrix passes. Verify each installed registry artifact (name, version, integrity/hash, declarations, basic runtime behavior), then create a GitHub Release with exact commit, assets, checksums, and supported scope.

## Explicitly excluded / pending

- React Native: Android physical-device and iOS runtime qualification remain outstanding, so it is excluded from the next web release.
- Manual assistive-technology assessment and formal WCAG conformance are not certified.
- Performance budgets are report-only; public viewport virtualization remains disabled.
- The acknowledged data-loading API under development is outside this release's certified scope.

## Git worktree hygiene for VS Code

A VS Code Source Control count (for example 172) is not sufficient to determine whether changes are untracked evidence, generated output, multiple open Git repositories/worktrees, or modified tracked files. Inspect each repository independently with `git status --short --untracked-files=normal`, `git diff --name-status`, `git diff --cached --name-status`, `git ls-files --others --exclude-standard`, and `git worktree list`. Do **not** run `git clean`, `git reset --hard`, or discard changes until every path is classified and backed up if needed. Never alter the original IDE checkout merely to remove an unexplained Source Control count.
