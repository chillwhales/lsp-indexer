# S29: Sorting Consumer Package Release

**Goal:** Add consistent `newest`/`oldest` block-order sorting across all 12 domain types and services.
**Demo:** Add consistent `newest`/`oldest` block-order sorting across all 12 domain types and services.

## Must-Haves


## Tasks

- [x] **T01: 21-sorting-consumer-package-release 01** `est:8min`
  - Add consistent `newest`/`oldest` block-order sorting across all 12 domain types and services.

Purpose: SORT-01 through SORT-05 require all domains to support sorting by blockchain position. The types package defines which sort fields exist (Zod schemas), and the node services translate those to Hasura order_by variables. React hooks and Next.js server actions automatically pick up the new sort options since they pass through types and services transparently — no code changes needed in react/next packages.

Output: 8 updated type files + 12 updated service files (8 new + 4 tiebreaker addition)
- [x] **T02: 21-sorting-consumer-package-release 02** `est:2min`
  - Build-verify all 4 consumer packages and create a changeset for coordinated release with sorting support.

Purpose: RELP-01 requires all 4 packages (`@lsp-indexer/types`, `@lsp-indexer/node`, `@lsp-indexer/react`, `@lsp-indexer/next`) released with sorting support. The changeset config has a `fixed` group ensuring all 4 packages are versioned and released together.

Output: Verified builds + changeset file ready for version bump and publish

## Files Likely Touched

- `packages/types/src/profiles.ts`
- `packages/types/src/digital-assets.ts`
- `packages/types/src/nfts.ts`
- `packages/types/src/owned-assets.ts`
- `packages/types/src/owned-tokens.ts`
- `packages/types/src/creators.ts`
- `packages/types/src/issued-assets.ts`
- `packages/types/src/encrypted-assets.ts`
- `packages/node/src/services/profiles.ts`
- `packages/node/src/services/digital-assets.ts`
- `packages/node/src/services/nfts.ts`
- `packages/node/src/services/owned-assets.ts`
- `packages/node/src/services/owned-tokens.ts`
- `packages/node/src/services/creators.ts`
- `packages/node/src/services/issued-assets.ts`
- `packages/node/src/services/encrypted-assets.ts`
- `packages/node/src/services/followers.ts`
- `packages/node/src/services/data-changed-events.ts`
- `packages/node/src/services/token-id-data-changed-events.ts`
- `packages/node/src/services/universal-receiver-events.ts`
- `.changeset/sorting-support.md`
- `packages/types/package.json`
- `packages/node/package.json`
- `packages/react/package.json`
- `packages/next/package.json`
- `packages/types/CHANGELOG.md`
- `packages/node/CHANGELOG.md`
- `packages/react/CHANGELOG.md`
- `packages/next/CHANGELOG.md`
