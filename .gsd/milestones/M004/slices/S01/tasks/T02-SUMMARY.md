---
id: T02
parent: S01
milestone: M004
provides:
  - 6 return types for mutual follow hooks (UseMutualFollowsReturn, UseInfiniteMutualFollowsReturn, etc.)
  - 6 factory functions with 3-overload ProfileInclude narrowing
  - 6 concrete React hooks wired to service functions
key_files:
  - packages/react/src/hooks/types/followers.ts
  - packages/react/src/hooks/factories/followers/create-use-mutual-follows.ts
  - packages/react/src/hooks/factories/followers/create-use-infinite-mutual-follows.ts
  - packages/react/src/hooks/factories/followers/create-use-mutual-followers.ts
  - packages/react/src/hooks/factories/followers/create-use-infinite-mutual-followers.ts
  - packages/react/src/hooks/factories/followers/create-use-followed-by-my-follows.ts
  - packages/react/src/hooks/factories/followers/create-use-infinite-followed-by-my-follows.ts
  - packages/react/src/hooks/followers/use-mutual-follows.ts
  - packages/react/src/hooks/followers/use-infinite-mutual-follows.ts
  - packages/react/src/hooks/followers/use-mutual-followers.ts
  - packages/react/src/hooks/followers/use-infinite-mutual-followers.ts
  - packages/react/src/hooks/followers/use-followed-by-my-follows.ts
  - packages/react/src/hooks/followers/use-infinite-followed-by-my-follows.ts
key_decisions:
  - Mutual follow return types mirror UseProfilesReturn/UseInfiniteProfilesReturn since these hooks return profiles not followers
  - Factory param types use intersection with include (e.g. UseMutualFollowsParams & { include?: ProfileInclude }) for consistency with createUseProfiles pattern, even though the Zod schema already has include
patterns_established:
  - Mutual follow factories follow identical 3-overload pattern as createUseProfiles — same createUseList/createUseInfinite plumbing with items→profiles remap
  - Concrete mutual follow hooks follow same 3-line wiring pattern as useFollows
observability_surfaces:
  - none — React hooks surface errors via TanStack Query error state; no additional logging added
duration: 8m
verification_result: passed
completed_at: 2026-03-20
blocker_discovered: false
---

# T02: Add React hook return types, factories, and concrete hooks

**Added 6 return types, 6 factory functions with 3-overload ProfileInclude narrowing, and 6 concrete React hooks for mutual follow queries**

## What Happened

Added the complete React layer for mutual follow queries. The 6 return types (`UseMutualFollowsReturn<F>`, `UseInfiniteMutualFollowsReturn<F>`, etc.) mirror the existing profile return type shapes since mutual follow hooks return profiles, not followers. Each of the 6 factories uses `createUseList` or `createUseInfinite` with the standard 3-overload pattern for `ProfileInclude` narrowing (`include: I` → `ProfileResult<I>`, no include → `Profile`, `include?` → `PartialProfile`). The 6 concrete hooks wire each factory to its corresponding service function via `getClientUrl()`.

## Verification

- `pnpm --filter=@lsp-indexer/react build` — exits 0, produces 54.68 KB ESM + 122.79 KB DTS
- 6 factory files confirmed present via `ls` glob
- 6 concrete hook files confirmed present via `ls` glob
- All upstream packages (`@lsp-indexer/types`, `@lsp-indexer/node`) also build clean

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `pnpm --filter=@lsp-indexer/types build` | 0 | ✅ pass | 2s |
| 2 | `pnpm --filter=@lsp-indexer/node build` | 0 | ✅ pass | 4s |
| 3 | `pnpm --filter=@lsp-indexer/react build` | 0 | ✅ pass | 7.5s |
| 4 | `ls packages/react/src/hooks/factories/followers/create-use-*mutual* create-use-*followed-by*` | 0 | ✅ pass (6 files) | <1s |
| 5 | `ls packages/react/src/hooks/followers/use-*mutual* use-*followed-by*` | 0 | ✅ pass (6 files) | <1s |
| 6 | `grep -c 'MutualFollow\|FollowedByMyFollow' packages/types/src/followers.ts` | 0 | ✅ pass (19 >= 12) | <1s |

## Diagnostics

None — React hooks surface errors via TanStack Query's `error` / `isError` state. Query key arrays are inspectable at runtime for cache debugging.

## Deviations

- The `useMutualFollows` list factory requires `addressA` and `addressB` as mandatory params (no default `= {}`), unlike `createUseProfiles` which defaults to `{}`. This is because mutual follow queries always require two addresses — calling without them would be nonsensical.

## Known Issues

None.

## Files Created/Modified

- `packages/react/src/hooks/types/followers.ts` — added 6 new return types for mutual follow hooks
- `packages/react/src/hooks/factories/followers/create-use-mutual-follows.ts` — new list factory with 3-overload ProfileInclude narrowing
- `packages/react/src/hooks/factories/followers/create-use-infinite-mutual-follows.ts` — new infinite factory
- `packages/react/src/hooks/factories/followers/create-use-mutual-followers.ts` — new list factory
- `packages/react/src/hooks/factories/followers/create-use-infinite-mutual-followers.ts` — new infinite factory
- `packages/react/src/hooks/factories/followers/create-use-followed-by-my-follows.ts` — new list factory
- `packages/react/src/hooks/factories/followers/create-use-infinite-followed-by-my-follows.ts` — new infinite factory
- `packages/react/src/hooks/factories/followers/index.ts` — added 6 new barrel exports
- `packages/react/src/hooks/followers/use-mutual-follows.ts` — new concrete hook
- `packages/react/src/hooks/followers/use-infinite-mutual-follows.ts` — new concrete hook
- `packages/react/src/hooks/followers/use-mutual-followers.ts` — new concrete hook
- `packages/react/src/hooks/followers/use-infinite-mutual-followers.ts` — new concrete hook
- `packages/react/src/hooks/followers/use-followed-by-my-follows.ts` — new concrete hook
- `packages/react/src/hooks/followers/use-infinite-followed-by-my-follows.ts` — new concrete hook
- `packages/react/src/hooks/followers/index.ts` — added 6 new barrel exports
