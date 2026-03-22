---
estimated_steps: 4
estimated_files: 3
---

# T03: Add Next.js server action and batch hook

**Slice:** S01 — Batch fetch across all packages
**Milestone:** M005

## Description

Add the Next.js server action `getEncryptedAssetsBatch` with Zod validation and 3-overload signatures, plus the concrete `useEncryptedAssetsBatch` Next.js hook wired through the server action. This completes the slice — all four packages will have batch encrypted asset support.

## Steps

1. **Add `getEncryptedAssetsBatch` server action to `packages/next/src/actions/encrypted-assets.ts`:**
   - Import `FetchEncryptedAssetsBatchResult`, `fetchEncryptedAssetsBatch`, `getServerUrl` from `@lsp-indexer/node`
   - Import `EncryptedAssetBatchTuple`, `EncryptedAssetInclude`, `EncryptedAssetResult`, `PartialEncryptedAsset`, `UseEncryptedAssetsBatchParamsSchema` from `@lsp-indexer/types`
   - Add 3-overload signatures following the `getEncryptedAssets` pattern:
     - Overload 1 (no include): `(params: { tuples: EncryptedAssetBatchTuple[] })` → `Promise<FetchEncryptedAssetsBatchResult>`
     - Overload 2 (with include I): `<const I extends EncryptedAssetInclude>(params: { tuples: EncryptedAssetBatchTuple[]; include: I })` → `Promise<FetchEncryptedAssetsBatchResult<EncryptedAssetResult<I>>>`
     - Overload 3 (widest): `(params: { tuples: EncryptedAssetBatchTuple[]; include?: EncryptedAssetInclude })` → `Promise<FetchEncryptedAssetsBatchResult<PartialEncryptedAsset>>`
   - Implementation: `validateInput(UseEncryptedAssetsBatchParamsSchema, params, 'getEncryptedAssetsBatch')` then `return await fetchEncryptedAssetsBatch(getServerUrl(), params)`

2. **Create `packages/next/src/hooks/encrypted-assets/use-encrypted-assets-batch.ts`:**
   - Add `'use client'` directive at top
   - Import `getEncryptedAssetsBatch` from `@lsp-indexer/next/actions`
   - Import `createUseEncryptedAssetsBatch` from `@lsp-indexer/react`
   - Wire: `export const useEncryptedAssetsBatch = createUseEncryptedAssetsBatch(getEncryptedAssetsBatch)`

3. **Update barrel index:**
   - `packages/next/src/hooks/encrypted-assets/index.ts` — add `export * from './use-encrypted-assets-batch'`

4. **Verify full build:** `pnpm --filter=@lsp-indexer/next build`

## Must-Haves

- [ ] `getEncryptedAssetsBatch` server action with 3-overload signatures
- [ ] Zod validation via `UseEncryptedAssetsBatchParamsSchema`
- [ ] Server action calls `fetchEncryptedAssetsBatch(getServerUrl(), params)`
- [ ] Concrete `useEncryptedAssetsBatch` Next.js hook wired to server action
- [ ] Barrel index updated
- [ ] Next package builds with zero errors

## Verification

- `pnpm --filter=@lsp-indexer/next build` exits 0
- `grep -q "getEncryptedAssetsBatch" packages/next/src/actions/encrypted-assets.ts`
- `grep -q "useEncryptedAssetsBatch" packages/next/src/hooks/encrypted-assets/index.ts`

## Inputs

- T01 output: `FetchEncryptedAssetsBatchResult`, `fetchEncryptedAssetsBatch` from `@lsp-indexer/node`; `UseEncryptedAssetsBatchParamsSchema`, `EncryptedAssetBatchTuple` from `@lsp-indexer/types`
- T02 output: `createUseEncryptedAssetsBatch` from `@lsp-indexer/react`
- `packages/next/src/actions/encrypted-assets.ts` — existing `getEncryptedAssets` as pattern reference
- `packages/next/src/hooks/encrypted-assets/use-encrypted-assets.ts` — existing hook wiring as pattern reference
- `packages/next/src/hooks/followers/use-is-following-batch.ts` — batch hook wiring reference (may need Map→Record serialization check, but batch result is plain array so no serialization needed)

## Expected Output

- `packages/next/src/actions/encrypted-assets.ts` — updated with `getEncryptedAssetsBatch` server action
- `packages/next/src/hooks/encrypted-assets/use-encrypted-assets-batch.ts` — new file
- `packages/next/src/hooks/encrypted-assets/index.ts` — updated barrel
