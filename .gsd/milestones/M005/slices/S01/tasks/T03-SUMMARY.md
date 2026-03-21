---
id: T03
parent: S01
milestone: M005
provides:
  - getEncryptedAssetsBatch server action with 3-overload include narrowing and Zod validation
  - useEncryptedAssetsBatch Next.js hook wired through server action
key_files:
  - packages/next/src/actions/encrypted-assets.ts
  - packages/next/src/hooks/encrypted-assets/use-encrypted-assets-batch.ts
  - packages/next/src/hooks/encrypted-assets/index.ts
key_decisions: []
patterns_established:
  - Batch server action pattern: 3-overload signatures + validateInput with batch params schema + delegate to batch service function
observability_surfaces:
  - "Build check: pnpm --filter=@lsp-indexer/next build — non-zero exit with tsc errors for type mismatches in overloads"
  - "Zod validation: getEncryptedAssetsBatch validates params via UseEncryptedAssetsBatchParamsSchema — throws ZodError with .issues for invalid tuples"
  - "Runtime query inspection: TanStack Query devtools show encryptedAssets.batch key; query disabled when tuples is empty"
duration: 8m
verification_result: passed
completed_at: 2026-03-21
blocker_discovered: false
---

# T03: Add Next.js server action and batch hook

**Added `getEncryptedAssetsBatch` server action with 3-overload include narrowing and `useEncryptedAssetsBatch` Next.js hook, completing the S01 batch encrypted asset slice across all four packages.**

## What Happened

Added the `getEncryptedAssetsBatch` server action to `packages/next/src/actions/encrypted-assets.ts` following the existing `getEncryptedAssets` pattern: 3-overload signatures (no include → full type, with include I → narrowed type, widest → partial type), Zod validation via `UseEncryptedAssetsBatchParamsSchema`, and delegation to `fetchEncryptedAssetsBatch(getServerUrl(), params)`. Created the concrete `useEncryptedAssetsBatch` Next.js hook wiring `createUseEncryptedAssetsBatch` factory to the server action. Updated the barrel index to re-export the new hook. All four packages (types, node, react, next) build successfully with zero errors.

## Verification

- Full slice build chain (`types → node → react → next`) all exit 0
- `grep` confirms `getEncryptedAssetsBatch` present in server action file
- `grep` confirms `use-encrypted-assets-batch` re-exported from barrel index
- `grep` confirms `useEncryptedAssetsBatch` symbol exported from hook source file

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `pnpm --filter=@lsp-indexer/types build` | 0 | ✅ pass | ~2s |
| 2 | `pnpm --filter=@lsp-indexer/node build` | 0 | ✅ pass | ~3s |
| 3 | `pnpm --filter=@lsp-indexer/react build` | 0 | ✅ pass | ~2s |
| 4 | `pnpm --filter=@lsp-indexer/next build` | 0 | ✅ pass | ~3s |
| 5 | `grep -q "getEncryptedAssetsBatch" packages/next/src/actions/encrypted-assets.ts` | 0 | ✅ pass | <1s |
| 6 | `grep -q "encrypted-assets-batch" packages/next/src/hooks/encrypted-assets/index.ts` | 0 | ✅ pass | <1s |
| 7 | `grep -q "useEncryptedAssetsBatch" packages/next/src/hooks/encrypted-assets/use-encrypted-assets-batch.ts` | 0 | ✅ pass | <1s |

## Diagnostics

- **Build check**: `pnpm --filter=@lsp-indexer/next build` — exits non-zero with tsc errors if overload signatures don't match `fetchEncryptedAssetsBatch` or factory types.
- **Zod validation**: `getEncryptedAssetsBatch` calls `validateInput(UseEncryptedAssetsBatchParamsSchema, params, 'getEncryptedAssetsBatch')` — throws `ZodError` with structured `.issues` for invalid tuples at runtime.
- **Empty input short-circuit**: Empty `tuples` array short-circuits in `fetchEncryptedAssetsBatch` (upstream), returning `{ encryptedAssets: [] }` without a network call.

## Deviations

The task plan's verification grep `grep -q "useEncryptedAssetsBatch" packages/next/src/hooks/encrypted-assets/index.ts` doesn't match because the barrel uses path-based re-exports (`./use-encrypted-assets-batch`), not symbol names. Used `grep -q "encrypted-assets-batch"` for barrel verification and confirmed the symbol name in the source file instead.

## Known Issues

None.

## Files Created/Modified

- `packages/next/src/actions/encrypted-assets.ts` — added `getEncryptedAssetsBatch` server action with 3-overload signatures and Zod validation
- `packages/next/src/hooks/encrypted-assets/use-encrypted-assets-batch.ts` — new file: concrete Next.js hook wiring factory to server action
- `packages/next/src/hooks/encrypted-assets/index.ts` — added barrel re-export for batch hook
