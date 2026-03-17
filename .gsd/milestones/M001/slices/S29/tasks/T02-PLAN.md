# T02: 21-sorting-consumer-package-release 02

**Slice:** S29 — **Milestone:** M001

## Description

Build-verify all 4 consumer packages and create a changeset for coordinated release with sorting support.

Purpose: RELP-01 requires all 4 packages (`@lsp-indexer/types`, `@lsp-indexer/node`, `@lsp-indexer/react`, `@lsp-indexer/next`) released with sorting support. The changeset config has a `fixed` group ensuring all 4 packages are versioned and released together.

Output: Verified builds + changeset file ready for version bump and publish

## Must-Haves

- [ ] "All 4 consumer packages build successfully with sorting changes"
- [ ] "Changeset created with minor bump describing sorting support"
- [ ] "All 4 packages version-bumped to same new version"

## Files

- `.changeset/sorting-support.md`
- `packages/types/package.json`
- `packages/node/package.json`
- `packages/react/package.json`
- `packages/next/package.json`
- `packages/types/CHANGELOG.md`
- `packages/node/CHANGELOG.md`
- `packages/react/CHANGELOG.md`
- `packages/next/CHANGELOG.md`
