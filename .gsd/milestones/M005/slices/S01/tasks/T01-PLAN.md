---
estimated_steps: 5
estimated_files: 3
---

# T01: Add batch types, key factory, and service function (types + node)

**Slice:** S01 — Batch fetch across all packages
**Milestone:** M005

## Description

Add the Zod schemas, TypeScript types, query key factory entries, and `fetchEncryptedAssetsBatch` service function. This is the foundation — all downstream React and Next.js hooks depend on these exports. The service function uses `_or`/`_and` Hasura where-clauses to batch-fetch encrypted assets by `(address, contentId, revision)` tuples in a single round trip.

## Steps

1. **Add Zod schemas and types to `packages/types/src/encrypted-assets.ts`:**
   - Add `EncryptedAssetBatchTupleSchema = z.object({ address: z.string(), contentId: z.string(), revision: z.number() })`
   - Add `UseEncryptedAssetsBatchParamsSchema = z.object({ tuples: z.array(EncryptedAssetBatchTupleSchema), include: EncryptedAssetIncludeSchema.optional() })`
   - Add inferred types: `export type EncryptedAssetBatchTuple = z.infer<typeof EncryptedAssetBatchTupleSchema>` and `export type UseEncryptedAssetsBatchParams = z.infer<typeof UseEncryptedAssetsBatchParamsSchema>`
   - Place schemas in the "Hook parameter schemas" section, types in "Inferred types" section

2. **Add key factory entries to `packages/node/src/keys/encrypted-assets.ts`:**
   - Import `EncryptedAssetBatchTuple` from `@lsp-indexer/types`
   - Add `batches: () => [...encryptedAssetKeys.all, 'batch'] as const`
   - Add `batch: (tuples: EncryptedAssetBatchTuple[], include?: EncryptedAssetInclude) => [...encryptedAssetKeys.batches(), tuples, include] as const`

3. **Add `FetchEncryptedAssetsBatchResult` interface and `fetchEncryptedAssetsBatch` to `packages/node/src/services/encrypted-assets.ts`:**
   - Add result interface (no `totalCount` — caller knows tuple count):
     ```typescript
     export interface FetchEncryptedAssetsBatchResult<P = EncryptedAsset> {
       encryptedAssets: P[];
     }
     ```
   - Add 3-overload function signatures following the `fetchEncryptedAssets` pattern:
     - Overload 1 (no include): `(url: string, params: { tuples: EncryptedAssetBatchTuple[] }): Promise<FetchEncryptedAssetsBatchResult>`
     - Overload 2 (with include I): `<const I extends EncryptedAssetInclude>(url: string, params: { tuples: EncryptedAssetBatchTuple[]; include: I }): Promise<FetchEncryptedAssetsBatchResult<EncryptedAssetResult<I>>>`
     - Overload 3 (widest): `(url: string, params: { tuples: EncryptedAssetBatchTuple[]; include?: EncryptedAssetInclude }): Promise<FetchEncryptedAssetsBatchResult<PartialEncryptedAsset>>`
   - Implementation: short-circuit on empty tuples (`return { encryptedAssets: [] }`). Build `_or` clause where each tuple becomes `{ _and: [{ address: { _ilike: escapeLike(t.address) } }, { content_id: { _eq: t.contentId } }, { revision: { _eq: t.revision } }] }`. Execute via `GetEncryptedAssetsDocument` with `buildEncryptedAssetIncludeVars(params.include)`. Parse via `parseEncryptedAssets`. Return `{ encryptedAssets }`.
   - Import `EncryptedAssetBatchTuple` from `@lsp-indexer/types`

4. **Verify types build:** `pnpm --filter=@lsp-indexer/types build`

5. **Verify node build:** `pnpm --filter=@lsp-indexer/node build`

## Must-Haves

- [ ] `EncryptedAssetBatchTupleSchema` and `UseEncryptedAssetsBatchParamsSchema` exported from types
- [ ] `EncryptedAssetBatchTuple` and `UseEncryptedAssetsBatchParams` types exported
- [ ] `encryptedAssetKeys.batches()` and `encryptedAssetKeys.batch()` entries in key factory
- [ ] `FetchEncryptedAssetsBatchResult` interface exported (no totalCount)
- [ ] `fetchEncryptedAssetsBatch` with 3-overload include narrowing
- [ ] Address comparison uses `_ilike` via `escapeLike()` (decision D007)
- [ ] contentId uses `_eq`, revision uses `_eq` (decision D007)
- [ ] Short-circuit on empty tuples array
- [ ] Both packages build with zero errors

## Verification

- `pnpm --filter=@lsp-indexer/types build` exits 0
- `pnpm --filter=@lsp-indexer/node build` exits 0
- `grep -q "EncryptedAssetBatchTupleSchema" packages/types/src/encrypted-assets.ts`
- `grep -q "fetchEncryptedAssetsBatch" packages/node/src/services/encrypted-assets.ts`

## Inputs

- `packages/types/src/encrypted-assets.ts` — existing Zod schemas and types for encrypted assets
- `packages/node/src/services/encrypted-assets.ts` — existing `fetchEncryptedAssets` with 3-overload pattern to replicate
- `packages/node/src/services/followers.ts` lines 315-385 — `fetchIsFollowingBatch` as the `_or`/`_and` query pattern reference
- `packages/node/src/keys/encrypted-assets.ts` — existing key factory to extend

## Expected Output

- `packages/types/src/encrypted-assets.ts` — updated with batch tuple schema, params schema, and inferred types
- `packages/node/src/keys/encrypted-assets.ts` — updated with `batches()` and `batch()` entries
- `packages/node/src/services/encrypted-assets.ts` — updated with `FetchEncryptedAssetsBatchResult` and `fetchEncryptedAssetsBatch`
