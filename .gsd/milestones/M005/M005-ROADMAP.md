# M005: Batch Encrypted Asset Fetch

**Vision:** Fetch multiple encrypted assets by `(address, contentId, revision)` tuples in a single Hasura round trip, with full include type narrowing across all four consumer packages.

## Success Criteria

- `fetchEncryptedAssetsBatch` accepts an array of tuples and returns matching encrypted assets in one query
- Address comparison uses `_ilike`, contentId and revision use `_eq`
- React and Next.js hooks expose batch with full `EncryptedAssetInclude` type narrowing
- Docs page documents the batch API
- Changeset ready for minor release
- `pnpm build` exits 0 across all 5 packages

## Key Risks / Unknowns

- None significant — `_or`/`_and` Hasura pattern proven by `fetchIsFollowingBatch`

## Proof Strategy

- No major unknowns to retire — straightforward extension of established patterns

## Verification Classes

- Contract verification: `pnpm build` across all 5 packages (types, node, react, next, docs)
- Integration verification: none (no test Hasura instance in CI)
- Operational verification: none
- UAT / human verification: manual test against live Hasura endpoint

## Milestone Definition of Done

This milestone is complete only when all are true:

- `fetchEncryptedAssetsBatch` builds correct `_or`/`_and` where-clause
- React and Next.js hooks export with 3-overload include narrowing
- Docs page documents batch function, hooks, and params
- Changeset exists for minor release of all four packages
- `pnpm build` exits 0 across types, node, react, next, docs
- Success criteria re-checked against build output

## Requirement Coverage

- Covers: R009, R010, R011, R012, R013, R014
- Partially covers: none
- Leaves for later: none
- Orphan risks: none

## Slices

- [x] **S01: Batch fetch across all packages** `risk:low` `depends:[]`
  > After this: `useEncryptedAssetsBatch` returns encrypted assets for an array of `(address, contentId, revision)` tuples in one Hasura query. Verified by `pnpm build` across types, node, react, next.

- [x] **S02: Docs, changeset & build verification** `risk:low` `depends:[S01]`
  > After this: Docs page documents batch API, changeset ready for minor release, full 5-package build passes including docs.

## Boundary Map

### S01 → S02

Produces:
- `EncryptedAssetBatchTuple` type and `UseEncryptedAssetsBatchParams` schema in `packages/types/src/encrypted-assets.ts`
- `fetchEncryptedAssetsBatch` service function in `packages/node/src/services/encrypted-assets.ts`
- `encryptedAssetKeys.batch()` key factory entry in `packages/node/src/keys/encrypted-assets.ts`
- `createUseEncryptedAssetsBatch` factory in `packages/react/src/hooks/factories/encrypted-assets/`
- `useEncryptedAssetsBatch` concrete hook in `packages/react/src/hooks/encrypted-assets/`
- Next.js server action `encryptedAssetsBatchAction` in `packages/next/src/actions/encrypted-assets.ts`
- Next.js `useEncryptedAssetsBatch` hook in `packages/next/src/hooks/encrypted-assets/`

Consumes:
- nothing (first slice)

### S02 consumes from S01:
- All exported batch functions, hooks, and types for documentation
- Package names for changeset
