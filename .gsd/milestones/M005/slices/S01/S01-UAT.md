# S01: Batch fetch across all packages — UAT

**Milestone:** M005
**Written:** 2026-03-21

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: This slice produces library code (types, service functions, hooks) with no UI — correctness is proven by successful TypeScript compilation across all four packages and by inspecting the generated artifacts. No runtime Hasura instance is available in CI.

## Preconditions

- Repository checked out with all S01 changes applied
- `pnpm install` completed (node_modules present)
- No running servers required

## Smoke Test

Run `pnpm --filter=@lsp-indexer/types build && pnpm --filter=@lsp-indexer/node build && pnpm --filter=@lsp-indexer/react build && pnpm --filter=@lsp-indexer/next build` — all four must exit 0 with no TypeScript errors.

## Test Cases

### 1. Zod schemas export correctly from types package

1. Run `pnpm --filter=@lsp-indexer/types build`
2. Grep for `EncryptedAssetBatchTupleSchema` in `packages/types/src/encrypted-assets.ts`
3. Grep for `UseEncryptedAssetsBatchParamsSchema` in `packages/types/src/encrypted-assets.ts`
4. **Expected:** Both schemas are exported. Build exits 0. The tuple schema defines `address` (string), `contentId` (string), and `revision` (number or string) fields.

### 2. Key factory entries exist in node package

1. Run `pnpm --filter=@lsp-indexer/node build`
2. Grep for `batches` and `batch` in `packages/node/src/keys/encrypted-assets.ts`
3. **Expected:** `batches()` returns the base batch key. `batch(tuples, include?)` returns the full query key including tuples and optional include. Build exits 0.

### 3. fetchEncryptedAssetsBatch has 3-overload signatures

1. Open `packages/node/src/services/encrypted-assets.ts`
2. Search for `fetchEncryptedAssetsBatch` — verify there are 3 overload signatures plus the implementation
3. **Expected:** Overloads follow the pattern: (1) with `include: I` → `EncryptedAssetResult<I>`, (2) no include → `EncryptedAsset`, (3) optional include → `PartialEncryptedAsset`. Implementation builds `_or` clause with `_and` per tuple.

### 4. Address uses _ilike, contentId and revision use _eq

1. Open `packages/node/src/services/encrypted-assets.ts`
2. Find the where-clause construction in `fetchEncryptedAssetsBatch`
3. **Expected:** Address field uses `_ilike` with `escapeLike()` wrapper. `contentId` uses `_eq`. `revision` uses `_eq`.

### 5. React factory and hook build and export

1. Run `pnpm --filter=@lsp-indexer/react build`
2. Verify `createUseEncryptedAssetsBatch` is in `packages/react/src/hooks/factories/encrypted-assets/create-use-encrypted-assets-batch.ts`
3. Verify barrel export in `packages/react/src/hooks/factories/encrypted-assets/index.ts`
4. Verify `useEncryptedAssetsBatch` is in `packages/react/src/hooks/encrypted-assets/use-encrypted-assets-batch.ts`
5. Verify barrel export in `packages/react/src/hooks/encrypted-assets/index.ts`
6. **Expected:** All files exist, barrel indexes re-export the new symbols, build exits 0.

### 6. Next.js server action has Zod validation

1. Open `packages/next/src/actions/encrypted-assets.ts`
2. Find `getEncryptedAssetsBatch`
3. **Expected:** Function has 3 overload signatures, calls `validateInput` with `UseEncryptedAssetsBatchParamsSchema`, and delegates to `fetchEncryptedAssetsBatch(getServerUrl(), params)`.

### 7. Next.js hook wires factory to server action

1. Open `packages/next/src/hooks/encrypted-assets/use-encrypted-assets-batch.ts`
2. **Expected:** Hook calls `createUseEncryptedAssetsBatch` with `getEncryptedAssetsBatch` as the fetch function. Barrel index re-exports it.

## Edge Cases

### Empty tuples array

1. Trace the code path in `fetchEncryptedAssetsBatch` when `tuples` is `[]`
2. **Expected:** Function short-circuits and returns `{ encryptedAssets: [] }` without executing a GraphQL query.

### Zod validation of invalid input

1. Inspect `UseEncryptedAssetsBatchParamsSchema` definition
2. Construct a mental model of passing `{ tuples: [{ address: 123 }] }` (wrong type)
3. **Expected:** Zod would throw a `ZodError` with structured `.issues` array describing the type mismatch.

### React hook disabled state

1. Inspect `createUseEncryptedAssetsBatch` factory
2. **Expected:** `useQuery` has `enabled: tuples.length > 0` — when tuples is empty, the query doesn't fire. A stable `EMPTY` array reference prevents unnecessary re-renders.

## Failure Signals

- Any of the four `pnpm build` commands exits non-zero
- Missing exports: `EncryptedAssetBatchTupleSchema`, `fetchEncryptedAssetsBatch`, `createUseEncryptedAssetsBatch`, `useEncryptedAssetsBatch`, or `getEncryptedAssetsBatch` not found in their respective files
- Address comparison uses `_eq` instead of `_ilike` (would break checksummed address matching)
- No `_or` clause construction in the batch service function (would mean only one tuple is queried)
- Missing `enabled` guard in React factory (would fire queries with empty tuples)

## Not Proven By This UAT

- Runtime query execution against a live Hasura instance
- Actual data returned matches the tuples sent (requires integration test)
- Performance characteristics of large `_or` arrays (e.g., 100+ tuples)
- Docs page (S02 scope)
- Full 5-package build including docs (S02 scope)

## Notes for Tester

- This is entirely compile-time verification. The `_or`/`_and` Hasura pattern is proven by `fetchIsFollowingBatch` which is already in production. The batch encrypted asset function follows the exact same pattern.
- Barrel index files use path-based re-exports (`export * from './use-encrypted-assets-batch'`), so grepping for the symbol name in the barrel won't match — grep for the filename instead.
- The batch result type (`FetchEncryptedAssetsBatchResult`) intentionally omits `totalCount` because the caller already knows the tuple count.
