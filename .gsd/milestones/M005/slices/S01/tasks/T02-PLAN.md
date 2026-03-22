---
estimated_steps: 5
estimated_files: 5
---

# T02: Add React batch factory, return type, and concrete hook

**Slice:** S01 — Batch fetch across all packages
**Milestone:** M005

## Description

Create the React hook layer for batch encrypted asset fetching. This includes the return type, the `createUseEncryptedAssetsBatch` factory with 3-overload include narrowing (using direct `useQuery`, not `createUseList`), and the concrete `useEncryptedAssetsBatch` hook. The factory pattern is modeled on `createUseIsFollowingBatch` (direct `useQuery`) combined with the 3-overload narrowing from `createUseEncryptedAssets`.

## Steps

1. **Add `UseEncryptedAssetsBatchReturn<F>` to `packages/react/src/hooks/types/encrypted-assets.ts`:**
   - Import `FetchEncryptedAssetsBatchResult` from `@lsp-indexer/node`
   - Add: `export type UseEncryptedAssetsBatchReturn<F> = { encryptedAssets: F[] } & Omit<UseQueryResult<FetchEncryptedAssetsBatchResult<F>, Error>, 'data'>`
   - Note: no `totalCount` — batch result doesn't include it

2. **Create `packages/react/src/hooks/factories/encrypted-assets/create-use-encrypted-assets-batch.ts`:**
   - Import: `FetchEncryptedAssetsBatchResult`, `encryptedAssetKeys` from `@lsp-indexer/node`; `EncryptedAsset`, `EncryptedAssetInclude`, `EncryptedAssetResult`, `PartialEncryptedAsset`, `UseEncryptedAssetsBatchParams` from `@lsp-indexer/types`; `UseEncryptedAssetsBatchReturn` from `../../types`; `useQuery` from `@tanstack/react-query`
   - Factory signature: `createUseEncryptedAssetsBatch(queryFn: (params: UseEncryptedAssetsBatchParams & { include?: EncryptedAssetInclude }) => Promise<FetchEncryptedAssetsBatchResult<PartialEncryptedAsset>>)`
   - Inner function with 3 overloads matching the `createUseEncryptedAssets` pattern:
     - Overload 1: `(params: UseEncryptedAssetsBatchParams & { include: I })` → `UseEncryptedAssetsBatchReturn<EncryptedAssetResult<I>>`
     - Overload 2: `(params: Omit<UseEncryptedAssetsBatchParams, 'include'> & { include?: never })` → `UseEncryptedAssetsBatchReturn<EncryptedAsset>`
     - Overload 3: `(params: UseEncryptedAssetsBatchParams & { include?: EncryptedAssetInclude })` → `UseEncryptedAssetsBatchReturn<PartialEncryptedAsset>`
   - Implementation: destructure `{ tuples, include }` from params. Use `useQuery` with `queryKey: encryptedAssetKeys.batch(tuples, include)`, `queryFn: () => queryFn(params)`, `enabled: tuples.length > 0`. Return `{ encryptedAssets: data?.encryptedAssets ?? [], ...rest }`.
   - Stable empty array reference: `const EMPTY: never[] = []` to avoid re-renders.

3. **Create `packages/react/src/hooks/encrypted-assets/use-encrypted-assets-batch.ts`:**
   - Import `fetchEncryptedAssetsBatch`, `getClientUrl` from `@lsp-indexer/node`
   - Import `createUseEncryptedAssetsBatch` from `../factories`
   - Wire: `export const useEncryptedAssetsBatch = createUseEncryptedAssetsBatch((params) => fetchEncryptedAssetsBatch(getClientUrl(), params))`

4. **Update barrel index files:**
   - `packages/react/src/hooks/factories/encrypted-assets/index.ts` — add `export * from './create-use-encrypted-assets-batch'`
   - `packages/react/src/hooks/encrypted-assets/index.ts` — add `export * from './use-encrypted-assets-batch'`

5. **Verify:** `pnpm --filter=@lsp-indexer/react build`

## Must-Haves

- [ ] `UseEncryptedAssetsBatchReturn<F>` type exported from react types
- [ ] `createUseEncryptedAssetsBatch` factory with 3-overload include narrowing
- [ ] Factory uses direct `useQuery` (not `createUseList`)
- [ ] `enabled: tuples.length > 0` to skip query on empty input
- [ ] Query key uses `encryptedAssetKeys.batch(tuples, include)`
- [ ] Concrete `useEncryptedAssetsBatch` hook wired to `fetchEncryptedAssetsBatch`
- [ ] Both barrel index files updated
- [ ] React package builds with zero errors

## Verification

- `pnpm --filter=@lsp-indexer/react build` exits 0
- `grep -q "createUseEncryptedAssetsBatch" packages/react/src/hooks/factories/encrypted-assets/index.ts`
- `grep -q "useEncryptedAssetsBatch" packages/react/src/hooks/encrypted-assets/index.ts`

## Inputs

- T01 output: `EncryptedAssetBatchTuple`, `UseEncryptedAssetsBatchParams` types from `@lsp-indexer/types`
- T01 output: `FetchEncryptedAssetsBatchResult`, `fetchEncryptedAssetsBatch`, `encryptedAssetKeys.batch()` from `@lsp-indexer/node`
- `packages/react/src/hooks/factories/followers/create-use-is-following-batch.ts` — structural reference for direct `useQuery` factory pattern
- `packages/react/src/hooks/factories/encrypted-assets/create-use-encrypted-assets.ts` — reference for 3-overload include narrowing pattern

## Expected Output

- `packages/react/src/hooks/types/encrypted-assets.ts` — updated with `UseEncryptedAssetsBatchReturn`
- `packages/react/src/hooks/factories/encrypted-assets/create-use-encrypted-assets-batch.ts` — new file
- `packages/react/src/hooks/factories/encrypted-assets/index.ts` — updated barrel
- `packages/react/src/hooks/encrypted-assets/use-encrypted-assets-batch.ts` — new file
- `packages/react/src/hooks/encrypted-assets/index.ts` — updated barrel
