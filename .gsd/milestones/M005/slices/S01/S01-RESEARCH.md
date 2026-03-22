# S01 — Research

**Date:** 2026-03-21
**Depth:** Light — straightforward replication of `fetchIsFollowingBatch` pattern to encrypted assets domain.

## Summary

This slice adds `fetchEncryptedAssetsBatch` and corresponding hooks across types, node, react, and next packages. The exact pattern is already proven by `fetchIsFollowingBatch` in `packages/node/src/services/followers.ts` (lines 315–385): build an `_or` clause where each entry is an `_and` of the tuple fields, execute via the existing `GetEncryptedAssetsDocument`, and parse with `parseEncryptedAssets`.

The key difference from the follower batch is that encrypted asset batch needs **include type narrowing** (`EncryptedAssetInclude` with 3-overload signatures), whereas the follower batch only returns a boolean map. This means the service function, factory, server action, and hooks all need the same 3-overload pattern used by `fetchEncryptedAssets` / `createUseEncryptedAssets`.

No unknowns. Every file to create or modify has a direct precedent in the same domain or the followers domain.

## Recommendation

Replicate the `fetchIsFollowingBatch` `_or`/`_and` query pattern with encrypted asset tuple fields. Use `createUseIsFollowingBatch` as the structural template for the factory (direct `useQuery`, not `createUseList`), but add 3-overload include narrowing from the `createUseEncryptedAssets` factory.

## Implementation Landscape

### Key Files

**Types package — `packages/types/src/encrypted-assets.ts`:**
- Add `EncryptedAssetBatchTupleSchema` — `z.object({ address: z.string(), contentId: z.string(), revision: z.number() })`
- Add `UseEncryptedAssetsBatchParamsSchema` — `z.object({ tuples: z.array(EncryptedAssetBatchTupleSchema), include: EncryptedAssetIncludeSchema.optional() })`
- Export inferred types: `EncryptedAssetBatchTuple`, `UseEncryptedAssetsBatchParams`

**Node package — `packages/node/src/services/encrypted-assets.ts`:**
- Add `fetchEncryptedAssetsBatch` with 3-overload signatures matching `fetchEncryptedAssets` pattern
- Build `_or` clause: each tuple → `{ _and: [{ address: { _ilike: escapeLike(t.address) } }, { content_id: { _eq: t.contentId } }, { revision: { _eq: t.revision } }] }`
- Execute via `GetEncryptedAssetsDocument` with `buildEncryptedAssetIncludeVars(include)`
- Parse via `parseEncryptedAssets`
- Return `FetchEncryptedAssetsBatchResult<P>` with `{ encryptedAssets: P[] }` (no totalCount needed — batch returns exact matches)

**Node package — `packages/node/src/keys/encrypted-assets.ts`:**
- Add `batches: () => [...encryptedAssetKeys.all, 'batch'] as const`
- Add `batch: (tuples, include?) => [...encryptedAssetKeys.batches(), tuples, include] as const`

**React package — `packages/react/src/hooks/types/encrypted-assets.ts`:**
- Add `UseEncryptedAssetsBatchReturn<F>` — `{ encryptedAssets: F[] } & Omit<UseQueryResult<..., Error>, 'data'>`

**React package — `packages/react/src/hooks/factories/encrypted-assets/create-use-encrypted-assets-batch.ts`:**
- New file. Pattern: `createUseIsFollowingBatch` structure (direct `useQuery`) + 3-overload narrowing from `createUseEncryptedAssets`
- Factory accepts `queryFn: (params) => Promise<FetchEncryptedAssetsBatchResult<PartialEncryptedAsset>>`
- Inner function has 3 overloads on `UseEncryptedAssetsBatchParams & { include: I }` / no-include / generic
- `enabled: tuples.length > 0`
- Query key: `encryptedAssetKeys.batch(tuples, include)`

**React package — `packages/react/src/hooks/encrypted-assets/use-encrypted-assets-batch.ts`:**
- New file. Wires `createUseEncryptedAssetsBatch` to `fetchEncryptedAssetsBatch(getClientUrl(), params)`

**Next.js package — `packages/next/src/actions/encrypted-assets.ts`:**
- Add `getEncryptedAssetsBatch` server action with 3-overload signatures + Zod validation via `UseEncryptedAssetsBatchParamsSchema`

**Next.js package — `packages/next/src/hooks/encrypted-assets/use-encrypted-assets-batch.ts`:**
- New file. Wires `createUseEncryptedAssetsBatch` to `getEncryptedAssetsBatch` server action

**Index barrel exports to update:**
- `packages/react/src/hooks/factories/encrypted-assets/index.ts` — add `create-use-encrypted-assets-batch`
- `packages/react/src/hooks/encrypted-assets/index.ts` — add `use-encrypted-assets-batch`
- `packages/next/src/hooks/encrypted-assets/index.ts` — add `use-encrypted-assets-batch`

### Build Order

1. **Types** — `EncryptedAssetBatchTuple` + `UseEncryptedAssetsBatchParams` (unblocks all downstream)
2. **Node keys** — `batch` key factory entry (unblocks react factory)
3. **Node service** — `fetchEncryptedAssetsBatch` (unblocks react hook + next action)
4. **React types** — `UseEncryptedAssetsBatchReturn` (unblocks react factory)
5. **React factory + hook** — `createUseEncryptedAssetsBatch` + concrete `useEncryptedAssetsBatch`
6. **Next action + hook** — `getEncryptedAssetsBatch` server action + `useEncryptedAssetsBatch`

Steps 1–4 can be done as a single task (types + node). Steps 5–6 can each be a task.

### Verification Approach

```bash
pnpm --filter=@lsp-indexer/types build
pnpm --filter=@lsp-indexer/node build
pnpm --filter=@lsp-indexer/react build
pnpm --filter=@lsp-indexer/next build
```

All four must exit 0. The 3-overload type narrowing is verified at compile time — if the generic signatures are wrong, `tsc` catches it.

## Constraints

- Address comparison **must** use `_ilike` (not `_eq`) per D007 — checksummed vs non-checksummed equivalence
- `contentId` uses `_eq`, `revision` uses `_eq` per D007
- Batch hook uses `useQuery` directly (like `createUseIsFollowingBatch`), not `createUseList` — different input/output shape (tuple array, not filter/sort/limit/offset)
- The `FetchEncryptedAssetsBatchResult` should **not** include `totalCount` — the caller knows how many tuples they sent; the result is just the matched assets
