---
id: T01
parent: S01
milestone: M004
provides:
  - 6 Zod param schemas for mutual follow queries (3 base + 3 infinite)
  - 6 inferred TypeScript types for mutual follow params
  - 3 service functions (fetchMutualFollows, fetchMutualFollowers, fetchFollowedByMyFollows) with 3-overload ProfileInclude narrowing
  - 6 query key entries in followerKeys
key_files:
  - packages/types/src/followers.ts
  - packages/node/src/services/followers.ts
  - packages/node/src/keys/followers.ts
key_decisions:
  - Service functions call execute(url, GetProfilesDocument, ...) directly with composed _and where-clauses, rather than going through fetchProfiles (which builds its own where from ProfileFilter)
patterns_established:
  - Mutual follow service functions follow the same 3-overload pattern as fetchProfiles, returning FetchProfilesResult<ProfileResult<I>>
  - Query keys use the 'followers' root with sub-segments like 'mutual-follows', 'mutual-followers', 'followed-by-my-follows'
observability_surfaces:
  - none (pure type/schema/service layer — errors propagate via execute() GraphQL errors)
duration: 15m
verification_result: passed
completed_at: 2026-03-20
blocker_discovered: false
---

# T01: Add Zod schemas, service functions, and query keys for mutual follow queries

**Added 6 Zod param schemas, 3 service functions with include narrowing, and 6 query key entries for mutual follow queries across types and node packages**

## What Happened

Added the foundation layer for mutual follow queries to `@lsp-indexer/types` and `@lsp-indexer/node`:

1. **Types package** (`packages/types/src/followers.ts`): Added 6 Zod param schemas — `UseMutualFollowsParamsSchema`, `UseInfiniteMutualFollowsParamsSchema`, `UseMutualFollowersParamsSchema`, `UseInfiniteMutualFollowersParamsSchema`, `UseFollowedByMyFollowsParamsSchema`, `UseInfiniteFollowedByMyFollowsParamsSchema` — plus their inferred TypeScript types. Imported `ProfileSortSchema` from `./profiles` for sort parameter validation.

2. **Node services** (`packages/node/src/services/followers.ts`): Added 3 service functions — `fetchMutualFollows`, `fetchMutualFollowers`, `fetchFollowedByMyFollows` — each with 3-overload signatures for `ProfileInclude` narrowing. They call `execute(url, GetProfilesDocument, ...)` directly with composed `Universal_Profile_Bool_Exp` where-clauses using `_and` + nested `followedBy`/`followed` relationship filters.

3. **Node keys** (`packages/node/src/keys/followers.ts`): Added 6 query key entries — `mutualFollows`, `infiniteMutualFollows`, `mutualFollowers`, `infiniteMutualFollowers`, `followedByMyFollows`, `infiniteFollowedByMyFollows` — following the existing key factory pattern.

## Verification

- `pnpm --filter=@lsp-indexer/types build` — exits 0 ✅
- `pnpm --filter=@lsp-indexer/node build` — exits 0 ✅
- `grep -c 'MutualFollow\|FollowedByMyFollow' packages/types/src/followers.ts` — returned 19 (>= 12) ✅
- `grep -c 'fetchMutualFollow\|fetchFollowedByMyFollow' packages/node/src/services/followers.ts` — returned 12 (>= 6) ✅

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `pnpm --filter=@lsp-indexer/types build` | 0 | ✅ pass | 7.0s |
| 2 | `pnpm --filter=@lsp-indexer/node build` | 0 | ✅ pass | 7.1s |
| 3 | `grep -c 'MutualFollow\|FollowedByMyFollow' packages/types/src/followers.ts` | 0 | ✅ pass (19 >= 12) | <1s |
| 4 | `grep -c 'fetchMutualFollow\|fetchFollowedByMyFollow' packages/node/src/services/followers.ts` | 0 | ✅ pass (12 >= 6) | <1s |

## Diagnostics

No runtime diagnostics — this is a pure type/schema/service layer. Errors propagate via `execute()` which surfaces structured `GraphQLError` objects from Hasura. Query key arrays are inspectable at runtime for cache debugging.

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `packages/types/src/followers.ts` — Added 6 Zod param schemas + 6 inferred types + ProfileSortSchema import
- `packages/node/src/services/followers.ts` — Added 3 service functions with 3-overload include narrowing + new imports for profiles service/documents/parsers
- `packages/node/src/keys/followers.ts` — Added 6 query key entries + ProfileInclude/ProfileSort type imports
- `.gsd/milestones/M004/slices/S01/S01-PLAN.md` — Added Observability/Diagnostics section, marked T01 done
