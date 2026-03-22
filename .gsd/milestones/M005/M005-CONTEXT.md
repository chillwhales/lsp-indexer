# M005: Batch Encrypted Asset Fetch

**Gathered:** 2026-03-21
**Status:** Ready for planning

## Project Description

Add a batch-fetch capability for encrypted assets. Each bookmark in the consumer app references an encrypted asset by a unique `(address, contentId, revision)` tuple. The current `fetchEncryptedAssets` API only supports a single filter — no way to say "give me these 20 specific encrypted assets" without 20 separate queries. This milestone adds `fetchEncryptedAssetsBatch` and corresponding hooks across all four packages.

## Why This Milestone

Consumers with bookmark lists need to resolve N encrypted assets in one round trip. The current API forces N queries. This is a table-stakes capability for any app with a bookmarks/favorites feature.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Call `fetchEncryptedAssetsBatch` with an array of `{ address, contentId, revision }` tuples and get all matching encrypted assets in one Hasura query
- Use `useEncryptedAssetsBatch` in React and Next.js with full `EncryptedAssetInclude` type narrowing

### Entry point / environment

- Entry point: npm package API (`@lsp-indexer/node`, `@lsp-indexer/react`, `@lsp-indexer/next`)
- Environment: local dev / browser / Node.js
- Live dependencies involved: Hasura GraphQL endpoint

## Completion Class

- Contract complete means: all four packages compile, batch function builds correct `_or`/`_and` Hasura query, hooks wire through correctly
- Integration complete means: batch query returns correct results from Hasura (verified via build, not live query — no test Hasura instance in CI)
- Operational complete means: none

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- `pnpm build` exits 0 across all 5 packages (types, node, react, next, docs)
- `fetchEncryptedAssetsBatch` constructs `_or`/`_and` where-clause with `_ilike` for address, `_eq` for contentId, `_eq` for revision
- React and Next.js hooks export correctly with include type narrowing
- Docs page documents the batch API
- Changeset exists for minor release

## Risks and Unknowns

- None significant — the `_or`/`_and` Hasura pattern is proven by `fetchIsFollowingBatch` in `packages/node/src/services/followers.ts`

## Existing Codebase / Prior Art

- `packages/node/src/services/followers.ts` — `fetchIsFollowingBatch` uses `_or`/`_and` pattern, direct precedent
- `packages/node/src/services/encrypted-assets.ts` — existing `fetchEncryptedAssets` with `buildEncryptedAssetWhere`, `buildEncryptedAssetIncludeVars`
- `packages/types/src/encrypted-assets.ts` — `EncryptedAssetFilter`, `EncryptedAssetInclude`, `EncryptedAssetResult<I>` type narrowing
- `packages/node/src/keys/encrypted-assets.ts` — query key factory, needs `batch` entry
- `packages/react/src/hooks/factories/encrypted-assets/` — factory pattern for encrypted asset hooks
- `packages/react/src/hooks/factories/followers/create-use-is-following-batch.ts` — batch hook factory precedent (uses `useQuery` directly, not `createUseList`)

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions.

## Relevant Requirements

- R009 — batch service function with `_or`/`_and` tuples
- R010 — include type narrowing on batch results
- R011 — React + Next.js hooks
- R012 — docs update
- R013 — changeset for minor release
- R014 — full build passes

## Scope

### In Scope

- `EncryptedAssetBatchTuple` type in types package
- `UseEncryptedAssetsBatchParams` schema in types package
- `fetchEncryptedAssetsBatch` service function in node package
- Query key factory `batch` entry in node package
- `createUseEncryptedAssetsBatch` factory in react package
- `useEncryptedAssetsBatch` concrete hook in react package
- Next.js server action + hook for batch
- Docs page update for encrypted assets
- Changeset for minor release

### Out of Scope / Non-Goals

- Infinite scroll variant for batch (batch is finite — known set of tuples)
- Subscription variant for batch
- Modifying existing `fetchEncryptedAssets` or `EncryptedAssetFilter`
- Playground page for batch (not needed — the API is straightforward)

## Technical Constraints

- Address comparison must use `_ilike` (checksummed ≡ non-checksummed)
- contentId comparison uses `_eq`
- revision comparison uses `_eq`
- Batch hook uses `useQuery` directly (like `createUseIsFollowingBatch`), not `createUseList` — different input/output shape
- All four packages are in a changesets fixed group — one changeset bumps all together

## Integration Points

- Hasura GraphQL — reuses existing `GetEncryptedAssetsDocument` with dynamically built `_or`/`_and` where-clause
- TanStack Query — batch hook uses `useQuery` with tuple-based query key

## Open Questions

- None — pattern is well-established
