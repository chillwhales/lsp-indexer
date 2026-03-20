# M003: useIsFollowingBatch Hook

**Vision:** Add a `useIsFollowingBatch` hook across all packages (`@lsp-indexer/types`, `@lsp-indexer/node`, `@lsp-indexer/react`, `@lsp-indexer/next`) to batch-check whether multiple address pairs have follow relationships, plus a playground component.

## Success Criteria

- [x] `UseIsFollowingBatchParamsSchema` Zod schema and types in `@lsp-indexer/types`
- [x] `fetchIsFollowingBatch` with `_or` Hasura query in `@lsp-indexer/node`
- [x] `followerKeys.isFollowingBatch(pairs)` cache key factory entry
- [x] `createUseIsFollowingBatch` factory + concrete hook in `@lsp-indexer/react`
- [x] `getIsFollowingBatch` server action with Map→Record serialization in `@lsp-indexer/next`
- [x] `useIsFollowingBatch` hook with Map reconstruction in `@lsp-indexer/next`
- [x] `BatchIsFollowingTab` playground component on `/follows` page
- [x] React and Next.js docs updated with `useIsFollowingBatch` sections
- [x] Case-insensitive address normalization for checksum vs lowercase mismatches

## Slices

- [x] **S01: useIsFollowingBatch across all packages** `risk:low` `depends:[]`
  > After this: Users can batch-check follow relationships with `useIsFollowingBatch` in React and Next.js, with a working playground demo on the `/follows` page.
