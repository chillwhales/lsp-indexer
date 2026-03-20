---
'@lsp-indexer/types': minor
'@lsp-indexer/node': minor
'@lsp-indexer/react': minor
'@lsp-indexer/next': minor
---

Add `useIsFollowingBatch` hook for checking multiple follower→followed pairs in a single query

- Add `IsFollowingBatchPairSchema`, `UseIsFollowingBatchParamsSchema` Zod schemas and inferred types
- Add `fetchIsFollowingBatch` service with `_or` Hasura query returning `Map<string, boolean>`
- Add `followerKeys.isFollowingBatch(pairs)` cache key factory entry
- Add `createUseIsFollowingBatch` factory and `useIsFollowingBatch` hook in `@lsp-indexer/react`
- Add `getIsFollowingBatch` server action and `useIsFollowingBatch` hook in `@lsp-indexer/next`
