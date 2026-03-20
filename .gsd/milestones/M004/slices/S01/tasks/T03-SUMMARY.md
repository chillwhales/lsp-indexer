---
id: T03
parent: S01
milestone: M004
provides:
  - 3 Next.js server actions (getMutualFollows, getMutualFollowers, getFollowedByMyFollows) with 3-overload signatures and Zod validation
  - 6 Next.js client hooks wired to server actions via React factory functions
key_files:
  - packages/next/src/actions/followers.ts
  - packages/next/src/hooks/followers/use-mutual-follows.ts
  - packages/next/src/hooks/followers/use-infinite-mutual-follows.ts
  - packages/next/src/hooks/followers/use-mutual-followers.ts
  - packages/next/src/hooks/followers/use-infinite-mutual-followers.ts
  - packages/next/src/hooks/followers/use-followed-by-my-follows.ts
  - packages/next/src/hooks/followers/use-infinite-followed-by-my-follows.ts
  - packages/next/src/hooks/followers/index.ts
key_decisions:
  - Server action overloads match service function param shapes exactly (addressA/addressB for mutual, myAddress/targetAddress for followed-by-my-follows) rather than using simplified params
patterns_established:
  - Mutual follow server actions follow identical 3-overload pattern as getFollows with validateInput + fetch delegation
  - Mutual follow Next.js hooks follow identical 4-line pattern as useFollows (use client + import action + import factory + wire)
observability_surfaces:
  - Server actions propagate Hasura GraphQL errors via execute() — callers see structured GraphQLError with query details
  - Zod validation in validateInput throws ZodError with field-level detail before any network call
duration: 8m
verification_result: passed
completed_at: 2026-03-20T21:05Z
blocker_discovered: false
---

# T03: Add Next.js server actions and client hooks

**Added 3 server actions with Zod validation and 6 Next.js client hooks for mutual follow queries**

## What Happened

Extended `packages/next/src/actions/followers.ts` with three new server actions:
- `getMutualFollows(params)` — profiles mutually followed by two addresses (addressA, addressB)
- `getMutualFollowers(params)` — profiles that follow both addresses (addressA, addressB)
- `getFollowedByMyFollows(params)` — profiles followed by the follows of a given address (myAddress, targetAddress)

Each server action has 3 overloads for include narrowing (no include → `FetchProfilesResult`, `include: I` → `FetchProfilesResult<ProfileResult<I>>`, `include?` → `FetchProfilesResult<PartialProfile>`) and validates input with the corresponding Zod schema before delegating to the node service function.

Created 6 Next.js client hook files in `packages/next/src/hooks/followers/`, each following the established 4-line pattern (`'use client'` + import server action + import factory + wire). Updated the barrel `index.ts` to export all 6 new hooks.

The task plan specified `address` as the param for `getFollowedByMyFollows`, but the actual service function signature uses `myAddress` + `targetAddress`. Fixed to match the real API.

## Verification

- `pnpm build` exits 0 across all 9 workspace projects (types, node, react, next, docs, indexer, etc.)
- 6 new hook files exist at expected paths
- `grep -c 'getMutualFollow|getFollowedByMyFollow'` returns 15 (≥6 required)
- `grep -c 'MutualFollow|FollowedByMyFollow' packages/types/src/followers.ts` returns 19 (≥12 required)

## Verification Evidence

| Check | Command | Exit Code | Verdict | Duration |
|-------|---------|-----------|---------|----------|
| types build | `pnpm --filter=@lsp-indexer/types build` | 0 | ✅ pass | ~2s |
| node build | `pnpm --filter=@lsp-indexer/node build` | 0 | ✅ pass | ~4s |
| react build | `pnpm --filter=@lsp-indexer/react build` | 0 | ✅ pass | ~2s |
| next build | `pnpm --filter=@lsp-indexer/next build` | 0 | ✅ pass | ~3s |
| full monorepo build | `pnpm build` | 0 | ✅ pass | ~23s |
| hook files exist | `ls use-*mutual* use-*followed-by*` | 0 | ✅ pass (6 files) | <1s |
| server action grep | `grep -c 'getMutualFollow\|getFollowedByMyFollow'` | 0 | ✅ pass (15 ≥ 6) | <1s |
| types schema grep | `grep -c 'MutualFollow\|FollowedByMyFollow'` | 0 | ✅ pass (19 ≥ 12) | <1s |

## Slice Verification Status (Final Task)

All 5 slice verification checks pass:
- ✅ `pnpm --filter=@lsp-indexer/types build` — exits 0
- ✅ `pnpm --filter=@lsp-indexer/node build` — exits 0
- ✅ `pnpm --filter=@lsp-indexer/react build` — exits 0
- ✅ `pnpm --filter=@lsp-indexer/next build` — exits 0
- ✅ `grep -c 'MutualFollow\|FollowedByMyFollow' packages/types/src/followers.ts` — returns 19 (≥ 12)
