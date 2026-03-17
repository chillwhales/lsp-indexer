# T03: 08-first-vertical-slice 03

**Slice:** S12 — **Milestone:** M001

## Description

Create the consumer-facing hooks and wire all profile domain exports through the three entry points — making the full API available for import.

Purpose: This is the plan that makes everything usable. Hooks wrap TanStack Query around the service functions. Entry points expose the right things from the right places (hooks from client, services from server, types from types).

Output: `hooks/profiles.ts` with 3 hooks, updated `index.ts` (hooks + keys), updated `server.ts` (services), updated `types.ts` (profile types). Package builds clean.

## Must-Haves

- [ ] 'Developer can import useProfile, useProfiles, useInfiniteProfiles from @lsp-indexer/react'
- [ ] 'Developer can import profileKeys from @lsp-indexer/react for cache invalidation'
- [ ] 'Developer can import Profile, ProfileImage, ProfileFilter types from @lsp-indexer/react/types'
- [ ] 'Developer can import fetchProfile, fetchProfiles from @lsp-indexer/react/server'
- [ ] 'useProfile returns { profile, isLoading, error, ...rest }'
- [ ] 'useProfiles returns { profiles, totalCount, isLoading, error, ...rest }'
- [ ] 'useInfiniteProfiles returns { profiles, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }'
- [ ] 'Package builds successfully with pnpm build'

## Files

- `packages/react/src/hooks/profiles.ts`
- `packages/react/src/index.ts`
- `packages/react/src/server.ts`
- `packages/react/src/types.ts`
