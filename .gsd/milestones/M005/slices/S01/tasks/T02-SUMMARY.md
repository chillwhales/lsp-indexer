---
id: T02
parent: S01
milestone: M005
provides:
  - UseEncryptedAssetsBatchReturn<F> type for React hooks
  - createUseEncryptedAssetsBatch factory with 3-overload include narrowing
  - useEncryptedAssetsBatch concrete hook wired to fetchEncryptedAssetsBatch
key_files:
  - packages/react/src/hooks/types/encrypted-assets.ts
  - packages/react/src/hooks/factories/encrypted-assets/create-use-encrypted-assets-batch.ts
  - packages/react/src/hooks/encrypted-assets/use-encrypted-assets-batch.ts
  - packages/react/src/hooks/factories/encrypted-assets/index.ts
  - packages/react/src/hooks/encrypted-assets/index.ts
key_decisions:
  - Used direct useQuery (not createUseList) since batch results have no totalCount or pagination
patterns_established:
  - Batch hook factory pattern: direct useQuery + 3-overload include narrowing + stable EMPTY array + enabled guard on tuples.length
observability_surfaces:
  - Build failure signals: pnpm --filter=@lsp-indexer/react build exits non-zero with tsc/tsup errors for type mismatches
  - Runtime: useQuery disabled state when tuples is empty prevents unnecessary network calls; TanStack Query devtools show query key structure
duration: 4m
verification_result: passed
completed_at: 2026-03-21T20:52:00Z
blocker_discovered: false
---

# T02: Add React batch factory, return type, and concrete hook

**Added `createUseEncryptedAssetsBatch` factory with 3-overload include narrowing and `useEncryptedAssetsBatch` concrete hook to the React package.**

## What Happened

Added the React hook layer for batch encrypted asset fetching across three concerns:

1. **Return type** — Added `UseEncryptedAssetsBatchReturn<F>` to `packages/react/src/hooks/types/encrypted-assets.ts`. This follows the same pattern as `UseEncryptedAssetsReturn<F>` but omits `totalCount` since the batch endpoint doesn't provide it.

2. **Factory** — Created `createUseEncryptedAssetsBatch` with 3 overloads matching the `createUseEncryptedAssets` narrowing pattern: `include: I` → `EncryptedAssetResult<I>`, no include → `EncryptedAsset`, optional include → `PartialEncryptedAsset`. Uses direct `useQuery` (not `createUseList`) since batch results are unpaginated. Includes `enabled: tuples.length > 0` guard and a stable `EMPTY` array reference to prevent re-renders.

3. **Concrete hook** — Created `useEncryptedAssetsBatch` wired to `fetchEncryptedAssetsBatch(getClientUrl(), params)`, matching the pattern of `useEncryptedAssets`.

Updated both barrel index files for factories and hooks.

## Verification

All four package builds pass. Both barrel files export the new symbols.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `pnpm --filter=@lsp-indexer/types build` | 0 | ✅ pass | 2s |
| 2 | `pnpm --filter=@lsp-indexer/node build` | 0 | ✅ pass | 5s |
| 3 | `pnpm --filter=@lsp-indexer/react build` | 0 | ✅ pass | 4s |
| 4 | `grep "batch" packages/react/src/hooks/factories/encrypted-assets/index.ts` | 0 | ✅ pass | <1s |
| 5 | `grep "batch" packages/react/src/hooks/encrypted-assets/index.ts` | 0 | ✅ pass | <1s |

## Diagnostics

- **Build check**: `pnpm --filter=@lsp-indexer/react build` — non-zero exit with tsc errors for type mismatches in overloads or return types.
- **Runtime query inspection**: TanStack Query devtools show the `['encryptedAssets', 'batch', tuples, include]` key structure. Query is disabled when `tuples` is empty.
- **Type narrowing verification**: Pass `{ include: { digitalAsset: true } }` to get `EncryptedAssetResult<{ digitalAsset: true }>` with `digitalAsset` field required; omit include to get full `EncryptedAsset`.

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `packages/react/src/hooks/types/encrypted-assets.ts` — Added `UseEncryptedAssetsBatchReturn<F>` type and `FetchEncryptedAssetsBatchResult` import
- `packages/react/src/hooks/factories/encrypted-assets/create-use-encrypted-assets-batch.ts` — New factory with 3-overload include narrowing using direct `useQuery`
- `packages/react/src/hooks/encrypted-assets/use-encrypted-assets-batch.ts` — New concrete hook wired to `fetchEncryptedAssetsBatch`
- `packages/react/src/hooks/factories/encrypted-assets/index.ts` — Added barrel export for factory
- `packages/react/src/hooks/encrypted-assets/index.ts` — Added barrel export for concrete hook
