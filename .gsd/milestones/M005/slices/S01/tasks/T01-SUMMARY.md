---
id: T01
parent: S01
milestone: M005
provides:
  - EncryptedAssetBatchTupleSchema and UseEncryptedAssetsBatchParamsSchema Zod schemas
  - EncryptedAssetBatchTuple and UseEncryptedAssetsBatchParams inferred types
  - encryptedAssetKeys.batches() and encryptedAssetKeys.batch() key factory entries
  - FetchEncryptedAssetsBatchResult interface
  - fetchEncryptedAssetsBatch service function with 3-overload include narrowing
key_files:
  - packages/types/src/encrypted-assets.ts
  - packages/node/src/keys/encrypted-assets.ts
  - packages/node/src/services/encrypted-assets.ts
key_decisions:
  - Address comparison uses _ilike via escapeLike() per D007
  - contentId uses _eq and revision uses _eq per D007
  - No totalCount in batch result — caller already knows tuple count
patterns_established:
  - _or/_and Hasura where-clause pattern for batch tuple lookups in encrypted assets domain
observability_surfaces:
  - Zod validation via UseEncryptedAssetsBatchParamsSchema.parse() throws structured ZodError
  - Empty-tuple short-circuit returns { encryptedAssets: [] } without network call
duration: 15m
verification_result: passed
completed_at: 2026-03-21
blocker_discovered: false
---

# T01: Add batch types, key factory, and service function (types + node)

**Added EncryptedAssetBatchTuple schemas, key factory entries, and fetchEncryptedAssetsBatch with 3-overload include narrowing to types and node packages**

## What Happened

Added the foundational batch types and service function for fetching encrypted assets by `(address, contentId, revision)` tuples in a single Hasura round trip.

In the types package: added `EncryptedAssetBatchTupleSchema` and `UseEncryptedAssetsBatchParamsSchema` Zod schemas plus their inferred TypeScript types.

In the node key factory: added `batches()` and `batch(tuples, include?)` entries following the existing list/infinite pattern.

In the node service: added `FetchEncryptedAssetsBatchResult<P>` (no `totalCount`) and `fetchEncryptedAssetsBatch` with three overload signatures for include type narrowing. The implementation short-circuits on empty tuples and builds `_or` clauses with `_and` per tuple — address uses `_ilike` via `escapeLike()`, contentId and revision use `_eq`. Executes via the existing `GetEncryptedAssetsDocument` and `parseEncryptedAssets`.

## Verification

Both packages build cleanly. All grep checks pass confirming exports exist.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `pnpm --filter=@lsp-indexer/types build` | 0 | ✅ pass | 3.3s |
| 2 | `pnpm --filter=@lsp-indexer/node build` | 0 | ✅ pass | 4.3s |
| 3 | `grep -q "EncryptedAssetBatchTupleSchema" packages/types/src/encrypted-assets.ts` | 0 | ✅ pass | <1s |
| 4 | `grep -q "fetchEncryptedAssetsBatch" packages/node/src/services/encrypted-assets.ts` | 0 | ✅ pass | <1s |

## Diagnostics

- **Build verification**: `pnpm --filter=@lsp-indexer/types build && pnpm --filter=@lsp-indexer/node build` — non-zero exit with tsc errors for type mismatches.
- **Zod validation**: `UseEncryptedAssetsBatchParamsSchema.parse(input)` throws `ZodError` with `.issues` array for invalid tuples.
- **Empty input**: Calling `fetchEncryptedAssetsBatch(url, { tuples: [] })` returns `{ encryptedAssets: [] }` without a network call.

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `packages/types/src/encrypted-assets.ts` — Added EncryptedAssetBatchTupleSchema, UseEncryptedAssetsBatchParamsSchema, and their inferred types
- `packages/node/src/keys/encrypted-assets.ts` — Added batches() and batch() key factory entries with EncryptedAssetBatchTuple import
- `packages/node/src/services/encrypted-assets.ts` — Added FetchEncryptedAssetsBatchResult interface and fetchEncryptedAssetsBatch with 3-overload signatures
- `.gsd/milestones/M005/slices/S01/S01-PLAN.md` — Added Observability / Diagnostics section, marked T01 done
