# ADR 179 — Svelte Package Compatibility Contract

Status: **Accepted for the current release candidate**
Decision date: 2026-11-10

## Context

`@smilodon/svelte` previously declared `svelte: ">=3.0.0 || >=4.0.0 || >=5.0.0"`, which is effectively an unbounded `>=3.0.0` range. The package build uses Svelte 5 and externalizes Svelte runtime imports. Its packed output therefore depends on Svelte 5 runtime entry points. The preserved H.2G.14 consumer evidence records that the Svelte 5-built artifact fails with Svelte 4 at `svelte/legacy`, while a separately Svelte 4-built artifact fails with Svelte 5 at `svelte/internal`.

One compiled artifact cannot truthfully claim compatibility across those major versions. No packed Svelte 3 consumer result is available.

## Decision

The next `@smilodon/svelte` release is **2.0.0** and supports **Svelte 5.x only**. Its published peer range is `^5.0.0`. Svelte 3 and Svelte 4 are outside this package's support contract. The package keeps its existing name, exports, API, and build output strategy. The major version signals that consumers relying on the previous Svelte 3/4 peer claim must not treat this as a compatible 1.x update.

The package does not publish a Svelte 3/4 artifact under the same package name. A future legacy adapter would require a separately named package and independent packed-consumer evidence for every advertised major. That work is not part of this release candidate.

## Qualification

The supported peer is tested by packing `@smilodon/core` and `@smilodon/svelte`, installing those tarballs into an isolated Svelte 5 consumer, strict-type-checking its imports with `skipLibCheck: false`, and running a production Vite build. The fixture records the exact Svelte version and package tarball hashes. Local qualification passed with Svelte 5.57.3, Node 26.10.0, npm 12.2.0, Core tarball SHA-256 `b0711634325f230e3c2c8f9d1d001ab8886d1122ce460ab614245c7f1398ca77`, Svelte 2.0.0 tarball SHA-256 `15c3acd6cba6d5e87dceaaf3910c57707af1f05d850c963513cf1e8260b409e9`, and consumer lock SHA-256 `dea42590e229afa1dddb3db994b1283e32d73fc8598e21f272d0b8ad4da30414`. Hosted qualification under Node 20.20.2 remains pending. The published range remains limited to Svelte 5.x; the tested lockfile version is a qualification point, not a claim that every future Svelte 5 release has already been exercised.

The Svelte 3/4 incompatibility evidence and the Svelte 5 packed-consumer result must remain visible in CI artifacts. No support for Svelte 3/4 may be restored without a distinct artifact and successful consumer validation.

## Consequences

- npm metadata for version 2.0.0 no longer advertises Svelte 3/4 compatibility.
- Existing consumers on Svelte 3/4 need to remain on an earlier compatible release or migrate to Svelte 5 before using this package release.
- This decision changes the published peer compatibility contract and must be included in the release change summary.
- Manual accessibility, SSR/hydration, and exhaustive adapter parity remain separate qualification gates.
