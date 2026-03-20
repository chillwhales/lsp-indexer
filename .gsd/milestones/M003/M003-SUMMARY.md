# M003: useIsFollowingBatch Hook — Milestone Summary

**Status:** ✅ Complete
**Completed:** 2026-03-20

## What Was Delivered

### S01: useIsFollowingBatch across all packages ✅
Full-stack `useIsFollowingBatch` hook added across all four packages:
- `@lsp-indexer/types`: `UseIsFollowingBatchParamsSchema` Zod schema + `IsFollowingBatchPairSchema`
- `@lsp-indexer/node`: `fetchIsFollowingBatch` with `_or` Hasura query + cache key factory
- `@lsp-indexer/react`: `createUseIsFollowingBatch` factory + concrete hook
- `@lsp-indexer/next`: `getIsFollowingBatch` server action (Map→Record serialization) + `useIsFollowingBatch` hook (Map reconstruction)
- Playground: `BatchIsFollowingTab` component on `/follows` page using Textarea shadcn component
- Docs: React and Next.js docs updated with useIsFollowingBatch sections
- Bug fix: case-insensitive address normalization to prevent checksum vs lowercase false negatives

## Key Commit
- `8e87755` feat(M003): useIsFollowingBatch hook across all packages (#348)
