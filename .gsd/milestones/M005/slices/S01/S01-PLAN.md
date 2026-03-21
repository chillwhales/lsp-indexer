# S01: Batch fetch across all packages

**Goal:** `fetchEncryptedAssetsBatch` service function + React and Next.js hooks with full `EncryptedAssetInclude` type narrowing, all wired and building.
**Demo:** `pnpm --filter=@lsp-indexer/types build && pnpm --filter=@lsp-indexer/node build && pnpm --filter=@lsp-indexer/react build && pnpm --filter=@lsp-indexer/next build` all exit 0, with batch function, factory, and hooks exported from each package.

## Must-Haves

- `EncryptedAssetBatchTupleSchema` and `UseEncryptedAssetsBatchParamsSchema` in types package with inferred type exports
- `fetchEncryptedAssetsBatch` with 3-overload include narrowing using `_or`/`_and` where-clauses (`_ilike` for address, `_eq` for contentId and revision)
- `encryptedAssetKeys.batch()` and `encryptedAssetKeys.batches()` key factory entries
- `UseEncryptedAssetsBatchReturn<F>` type in react types
- `createUseEncryptedAssetsBatch` factory with 3-overload include narrowing (direct `useQuery`, not `createUseList`)
- Concrete `useEncryptedAssetsBatch` React hook wired to `fetchEncryptedAssetsBatch`
- `getEncryptedAssetsBatch` server action with Zod validation + 3-overload signatures
- Concrete `useEncryptedAssetsBatch` Next.js hook wired to server action
- All barrel index files updated
- `pnpm build` exits 0 for types, node, react, next

## Verification

- `pnpm --filter=@lsp-indexer/types build` exits 0
- `pnpm --filter=@lsp-indexer/node build` exits 0
- `pnpm --filter=@lsp-indexer/react build` exits 0
- `pnpm --filter=@lsp-indexer/next build` exits 0

## Observability / Diagnostics

- **Build failure signals**: Each `pnpm --filter=<pkg> build` exits non-zero with tsc/tsup errors visible in stderr — type mismatches surface immediately.
- **Runtime query inspection**: `fetchEncryptedAssetsBatch` delegates to `execute()` which logs GraphQL errors to console. Empty-tuple short-circuit returns `{ encryptedAssets: [] }` without hitting the network.
- **Failure-path verification**: Pass an empty `tuples` array to confirm short-circuit path; pass invalid include fields to see TypeScript catch the error at compile time.
- **Zod validation**: `UseEncryptedAssetsBatchParamsSchema.parse()` throws `ZodError` with structured `.issues` for invalid input (wrong types, missing fields).

## Integration Closure

- Upstream surfaces consumed: `GetEncryptedAssetsDocument`, `parseEncryptedAssets`, `buildEncryptedAssetIncludeVars`, `escapeLike` from node package; `EncryptedAssetInclude*` types from types package
- New wiring introduced in this slice: batch service → react factory → concrete hooks (react + next)
- What remains before the milestone is truly usable end-to-end: S02 docs, changeset, and full 5-package build including docs

## Tasks

- [x] **T01: Add batch types, key factory, and service function (types + node)** `est:30m`
  - Why: Foundation — all downstream hooks depend on the Zod schemas, TS types, query keys, and service function
  - Files: `packages/types/src/encrypted-assets.ts`, `packages/node/src/keys/encrypted-assets.ts`, `packages/node/src/services/encrypted-assets.ts`
  - Do: Add `EncryptedAssetBatchTupleSchema`, `UseEncryptedAssetsBatchParamsSchema`, and inferred types to types package. Add `batches()` and `batch()` to key factory. Add `FetchEncryptedAssetsBatchResult<P>` (no totalCount) and `fetchEncryptedAssetsBatch` with 3-overload signatures. Build `_or` clause with `_and` per tuple: address uses `_ilike` via `escapeLike`, contentId uses `_eq`, revision uses `_eq`. Execute via `GetEncryptedAssetsDocument` with `buildEncryptedAssetIncludeVars`. Parse via `parseEncryptedAssets`. Return `{ encryptedAssets: P[] }`.
  - Verify: `pnpm --filter=@lsp-indexer/types build && pnpm --filter=@lsp-indexer/node build`
  - Done when: Both packages build with zero errors, new types and function exported

- [x] **T02: Add React batch factory, return type, and concrete hook** `est:25m`
  - Why: Consumers need a React hook with include type narrowing — the factory pattern separates the query function from the hook shape
  - Files: `packages/react/src/hooks/types/encrypted-assets.ts`, `packages/react/src/hooks/factories/encrypted-assets/create-use-encrypted-assets-batch.ts`, `packages/react/src/hooks/factories/encrypted-assets/index.ts`, `packages/react/src/hooks/encrypted-assets/use-encrypted-assets-batch.ts`, `packages/react/src/hooks/encrypted-assets/index.ts`
  - Do: Add `UseEncryptedAssetsBatchReturn<F>` to react types (like `UseEncryptedAssetsReturn` but without `totalCount`). Create factory `createUseEncryptedAssetsBatch` using direct `useQuery` (like `createUseIsFollowingBatch`) with 3-overload include narrowing (like `createUseEncryptedAssets`). Query key: `encryptedAssetKeys.batch(tuples, include)`. Enabled when `tuples.length > 0`. Create concrete hook wiring factory to `fetchEncryptedAssetsBatch(getClientUrl(), params)`. Update both barrel index files.
  - Verify: `pnpm --filter=@lsp-indexer/react build`
  - Done when: React package builds, `createUseEncryptedAssetsBatch` and `useEncryptedAssetsBatch` exported

- [ ] **T03: Add Next.js server action and batch hook** `est:20m`
  - Why: Next.js consumers need server-side data fetching through actions with Zod validation
  - Files: `packages/next/src/actions/encrypted-assets.ts`, `packages/next/src/hooks/encrypted-assets/use-encrypted-assets-batch.ts`, `packages/next/src/hooks/encrypted-assets/index.ts`
  - Do: Add `getEncryptedAssetsBatch` server action with 3-overload signatures matching `fetchEncryptedAssetsBatch`, Zod validation via `UseEncryptedAssetsBatchParamsSchema`. Create concrete Next.js hook wiring `createUseEncryptedAssetsBatch` factory to the server action. Update barrel index.
  - Verify: `pnpm --filter=@lsp-indexer/next build`
  - Done when: Next package builds, server action and hook exported

## Files Likely Touched

- `packages/types/src/encrypted-assets.ts`
- `packages/node/src/keys/encrypted-assets.ts`
- `packages/node/src/services/encrypted-assets.ts`
- `packages/react/src/hooks/types/encrypted-assets.ts`
- `packages/react/src/hooks/factories/encrypted-assets/create-use-encrypted-assets-batch.ts`
- `packages/react/src/hooks/factories/encrypted-assets/index.ts`
- `packages/react/src/hooks/encrypted-assets/use-encrypted-assets-batch.ts`
- `packages/react/src/hooks/encrypted-assets/index.ts`
- `packages/next/src/actions/encrypted-assets.ts`
- `packages/next/src/hooks/encrypted-assets/use-encrypted-assets-batch.ts`
- `packages/next/src/hooks/encrypted-assets/index.ts`
