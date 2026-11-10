# Release consumer qualification — 2026-11-10

**Status: registry publication and tested-scope qualification complete for the web package set. React Native runtime qualification remains excluded.**

## Source and hosted qualification

- Package source tree: `7987875c162560575482d07024fd537ffc193df3` (the PR #70 head tree, identical to the merged tree).
- Current main at post-merge qualification: `7987875c162560575482d07024fd537ffc193df3`.
- Post-merge workflows all succeeded on that exact commit: Tests `42875704103`, CI `42875704012`, H.2G.16 Qualification Readiness `42875704090`, and Phase 4 Certification `42875704023`.
- PR #70 reported 26/26 successful PR-head checks. Its local packed matrix reported six packages × NodeNext/Bundler (12/12) using strict TypeScript 5.6.3, `strict: true`, and `skipLibCheck: false`.

## Public npm package set

The five corrected artifacts were published in dependency order, Core first, followed by React, Vue, Solid, and Vanilla. Each registry-downloaded tarball was SHA-256 checked against the exact archive prepared from the qualified source tree. `@smilodon/svelte@2.0.0` was retained and independently verified against its already-published artifact; it declares Svelte 5 only.

| Package | Version | npm integrity (SHA-512) | Tarball SHA-256 |
| --- | --- | --- | --- |
| `@smilodon/core` | `1.10.1` | `sha512-+WjilNMOToHuSMCUVLHQXI5PFrl5Bph03GqUiUkb9qnkh7tPOZm0mEPQ1g9TWeFF2i3UenytPc7PKXa9xsM8Aw==` | `b7213ae48e927c49bfc18897509513ed593d30bb974b28b8ad4fd9e3564a509b` |
| `@smilodon/react` | `1.10.1` | `sha512-KWaPchLQReH+XDAA7ssRBtu/WCf3D7ylP7I2dzYL5dmWzhBQQ+HGZX9+K+FGLR10bgs00J/sPydizh2BxxpEJA==` | `675ab4b1abce06dfaba5c804046466b2e3a7d13e734c2a33efb266bfaedec606` |
| `@smilodon/vue` | `1.10.1` | `sha512-+CpVnqo0S2Iy5G8H8+DaZJDAB/CNvxmtCYeKXFUKStvXk9javfAHBrOl4Poc5QsLi4l6T2n4jIZZsTMXBGMvkw==` | `93cff8c0d12de2b530a00f20695e22aef73825c1f77d35e29887c5be18391e54` |
| `@smilodon/solid` | `1.10.1` | `sha512-dWOjOijYc/TLTT9JilfEK2ypd8OKh4gs3glC0iCspuBS8ntx9xV1FJo6q8ePGq9MQiGqgj1Z/EdfH8oFwoBx8Q==` | `488c7347bc7b859c655fc47b18d5fd691b3860a3af539f64189c9dc98bf8ab87` |
| `@smilodon/vanilla` | `1.10.1` | `sha512-+JyKHZybW9qQuLl3dlvMdWVtwBolCKJGL3lI+Evv7j0GbDUqBO/BHBSEpJRl/eUnezHaL/AhOHPC6+Zu3uDmgA==` | `8b2d5a1e3cf78a95b5947aa682ba2c04c2c6ac9887918450d0b22b99fcd57c14` |
| `@smilodon/svelte` | `2.0.0` | `sha512-JbT4qPv44ZdObbLbpUuY1xrnuq2HR+BYynudLTRB6hMTBtrYE0EOikxSdWdBkaGxG15Qj7JZ4lhOWFWkpVxq/g==` | `f5aa20c1064e465c9e0ffa833dd963095b63d5a732b377bcbd7b74c7f040e82c` |

## Registry consumer checks

Clean temporary projects installed the six exact versions from `registry.npmjs.org`, with Core `1.10.1` as the peer for the five adapters. The checks ran with Node `26.10.0`, npm `12.2.0`, and TypeScript `5.6.3`. All 12 declaration checks passed: each package compiled once with NodeNext resolution and once with Bundler resolution, using TypeScript `5.6.3`, strict mode, and `skipLibCheck: false`. The fixture lockfiles record the registry-resolved package versions and integrity metadata. React used matching React and ReactDOM `18.3.1`; Vue used `3.5.22`; Solid used `1.9.9`; Svelte used `5.57.3`.

A Chromium `133.0.6943.126` browser smoke test imported all six registry-installed packages, observed their module exports, registered Core's `enhanced-select` custom element, and attached an element with two items. It completed without page errors or failed requests. This is a basic runtime import/mount smoke check, not full framework interaction certification.

## Release scope and limitations

- Core, React, Vue, Solid, and Vanilla are published at `1.10.1`. Svelte remains at `2.0.0`, is Svelte 5 only, and is a breaking compatibility change from the former Svelte 3/4 claim.
- React Native is excluded: Android physical-device and iOS runtime qualification are incomplete.
- Manual assistive-technology assessment and formal WCAG conformance remain unverified. Performance results remain report-only, and public viewport virtualization remains disabled.
- The acknowledged data-loading API and examples remain future development, outside this release.
- The prior `1.10.0` npm artifacts remain immutable and are not replaced by this publication.

The GitHub Release is created only after the exact registry versions and attached checksums are verified. No GitHub Packages publication is claimed.
