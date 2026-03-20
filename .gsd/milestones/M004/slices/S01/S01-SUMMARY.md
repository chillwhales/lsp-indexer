---
id: S01
parent: M004
milestone: M004
provides:
  - 6 Zod param schemas + inferred types for mutual follow queries (3 base + 3 infinite)
  - 3 service functions (fetchMutualFollows, fetchMutualFollowers, fetchFollowedByMyFollows) with 3-overload ProfileInclude narrowing
  - 6 query key entries in followerKeys for cache management
  - 6 React hook return types mirroring UseProfilesReturn shape
  - 6 React factory functions with 3-overload ProfileInclude narrowing
  - 6 concrete React hooks wired to service functions via getClientUrl()
  - 3 Next.js server actions with Zod validation and 3-overload signatures
  - 6 Next.js client hooks wired to server actions via factory functions
requires:
  - slice: none
    provides: first slice in M004
affects:
  - S02
key_files:
  - packages/types/src/followers.ts
  - packages/node/src/services/followers.ts
  - packages/node/src/keys/followers.ts
  - packages/react/src/hooks/types/followers.ts
  - packages/react/src/hooks/factories/followers/
  - packages/react/src/hooks/followers/
  - packages/next/src/actions/followers.ts
  - packages/next/src/hooks/followers/
key_decisions:
  - Service functions call execute(url, GetProfilesDocument, ...) directly with composed _and where-clauses rather than going through fetchProfiles (which builds its own where from ProfileFilter)
  - Mutual follow return types mirror UseProfilesReturn since hooks return profiles not followers
  - Factory param types use intersection with include for consistency with createUseProfiles pattern
  - Server action overloads match service function param shapes exactly (addressA/addressB for mutual, myAddress/targetAddress for followed-by-my-follows)
patterns_established:
  - Mutual follow service functions follow 3-overload pattern as fetchProfiles, returning FetchProfilesResult<ProfileResult<I>>
  - Query keys use 'followers' root with sub-segments like 'mutual-follows', 'mutual-followers', 'followed-by-my-follows'
  - Mutual follow factories follow identical createUseList/createUseInfinite plumbing with items→profiles remap
  - Concrete hooks follow same 3-line wiring pattern (import service + import factory + wire with getClientUrl)
  - Next.js hooks follow 4-line pattern ('use client' + import action + import factory + wire)
observability_surfaces:
  - Zod validation in validateInput throws ZodError with field-level detail before any network call
  - Service functions propagate Hasura GraphQL errors via execute() as structured GraphQLError
  - React hooks surface errors via TanStack Query error/isError state
  - Query key arrays inspectable at runtime for cache debugging
drill_down_paths:
  - .gsd/milestones/M004/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M004/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M004/slices/S01/tasks/T03-SUMMARY.md
duration: 31m
verification_result: passed
completed_at: 2026-03-20
---

# S01: Mutual Follow Hooks — Full Stack

**Three mutual follow query hooks (`useMutualFollows`, `useMutualFollowers`, `useFollowedByMyFollows`) delivered across all 4 packages with infinite scroll variants, ProfileInclude type narrowing, and Next.js server action routing**

## What Happened

Built the complete vertical stack for three social graph intersection queries across `@lsp-indexer/types`, `@lsp-indexer/node`, `@lsp-indexer/react`, and `@lsp-indexer/next`.

**T01 — Foundation (types + node):** Added 6 Zod param schemas and inferred types to `packages/types/src/followers.ts` (3 base + 3 infinite variants). Added 3 service functions to `packages/node/src/services/followers.ts` — each calls `execute()` directly with composed `Universal_Profile_Bool_Exp` using `_and` + nested `followedBy`/`followed` relationship filters, bypassing `fetchProfiles` which would have imposed its own where-clause construction from `ProfileFilter`. Added 6 query key entries to `packages/node/src/keys/followers.ts`.

**T02 — React hooks:** Added 6 return types mirroring `UseProfilesReturn<F>` shape (these hooks return profiles, not followers). Created 6 factory functions using `createUseList`/`createUseInfinite` with the standard 3-overload pattern for `ProfileInclude` narrowing. Wired 6 concrete hooks via `getClientUrl()`. Notable deviation: mutual follow factories require `addressA` and `addressB` as mandatory params (no `= {}` default) since mutual follow queries always need two addresses.

**T03 — Next.js server actions + hooks:** Extended `packages/next/src/actions/followers.ts` with 3 server actions (`getMutualFollows`, `getMutualFollowers`, `getFollowedByMyFollows`), each with 3 overloads + Zod validation. Created 6 Next.js client hooks following the established 4-line pattern. The plan originally specified `address` as the param for `getFollowedByMyFollows`, but the actual service signature uses `myAddress` + `targetAddress` — corrected to match.

## Verification

All 5 slice-level verification checks pass:

| # | Check | Result |
|---|-------|--------|
| 1 | `pnpm --filter=@lsp-indexer/types build` | ✅ exits 0 |
| 2 | `pnpm --filter=@lsp-indexer/node build` | ✅ exits 0 |
| 3 | `pnpm --filter=@lsp-indexer/react build` | ✅ exits 0 |
| 4 | `pnpm --filter=@lsp-indexer/next build` | ✅ exits 0 |
| 5 | `grep -c 'MutualFollow\|FollowedByMyFollow' packages/types/src/followers.ts` | ✅ 19 (≥ 12) |

## Requirements Advanced

- R001 — `fetchMutualFollows` service function computes mutual follows via Hasura nested `followedBy` relationship filters; exposed through React and Next.js hooks
- R002 — `fetchMutualFollowers` service function computes mutual followers via Hasura nested `followed` relationship filters; exposed through React and Next.js hooks
- R003 — `fetchFollowedByMyFollows` service function computes "followed by my follows" via composed `_and` where-clauses; exposed through React and Next.js hooks
- R004 — 6 React hooks (`useMutualFollows`, `useInfiniteMutualFollows`, `useMutualFollowers`, `useInfiniteMutualFollowers`, `useFollowedByMyFollows`, `useInfiniteFollowedByMyFollows`) call Hasura directly via `getClientUrl()`
- R005 — 3 Next.js server actions + 6 Next.js client hooks route through server actions keeping endpoint hidden
- R006 — All hooks support `ProfileInclude` type narrowing via 3-overload signatures
- R007 — 3 infinite scroll variants (`useInfiniteMutualFollows`, `useInfiniteMutualFollowers`, `useInfiniteFollowedByMyFollows`) with offset-based pagination

## New Requirements Surfaced

- none

## Deviations

- `getFollowedByMyFollows` server action uses `myAddress` + `targetAddress` params instead of the plan's `address` — matches actual service function signature
- Mutual follow factory hooks require mandatory `addressA`/`addressB` params (no `= {}` default) unlike `createUseProfiles` — two addresses are always required for intersection queries

## Known Limitations

- No runtime verification against live Hasura yet — S02 covers this via test app playground
- No documentation updates yet — S02 covers docs
- No build validation across full monorepo with docs app — S02 covers this

## Follow-ups

- S02: Build validation, test app playground page, docs updates

## Files Created/Modified

- `packages/types/src/followers.ts` — 6 Zod param schemas + 6 inferred types + ProfileSortSchema import
- `packages/node/src/services/followers.ts` — 3 service functions with 3-overload include narrowing
- `packages/node/src/keys/followers.ts` — 6 query key entries
- `packages/react/src/hooks/types/followers.ts` — 6 return types for mutual follow hooks
- `packages/react/src/hooks/factories/followers/create-use-mutual-follows.ts` — list factory
- `packages/react/src/hooks/factories/followers/create-use-infinite-mutual-follows.ts` — infinite factory
- `packages/react/src/hooks/factories/followers/create-use-mutual-followers.ts` — list factory
- `packages/react/src/hooks/factories/followers/create-use-infinite-mutual-followers.ts` — infinite factory
- `packages/react/src/hooks/factories/followers/create-use-followed-by-my-follows.ts` — list factory
- `packages/react/src/hooks/factories/followers/create-use-infinite-followed-by-my-follows.ts` — infinite factory
- `packages/react/src/hooks/factories/followers/index.ts` — 6 new barrel exports
- `packages/react/src/hooks/followers/use-mutual-follows.ts` — concrete hook
- `packages/react/src/hooks/followers/use-infinite-mutual-follows.ts` — concrete hook
- `packages/react/src/hooks/followers/use-mutual-followers.ts` — concrete hook
- `packages/react/src/hooks/followers/use-infinite-mutual-followers.ts` — concrete hook
- `packages/react/src/hooks/followers/use-followed-by-my-follows.ts` — concrete hook
- `packages/react/src/hooks/followers/use-infinite-followed-by-my-follows.ts` — concrete hook
- `packages/react/src/hooks/followers/index.ts` — 6 new barrel exports
- `packages/next/src/actions/followers.ts` — 3 server actions with Zod validation
- `packages/next/src/hooks/followers/use-mutual-follows.ts` — Next.js client hook
- `packages/next/src/hooks/followers/use-infinite-mutual-follows.ts` — Next.js client hook
- `packages/next/src/hooks/followers/use-mutual-followers.ts` — Next.js client hook
- `packages/next/src/hooks/followers/use-infinite-mutual-followers.ts` — Next.js client hook
- `packages/next/src/hooks/followers/use-followed-by-my-follows.ts` — Next.js client hook
- `packages/next/src/hooks/followers/use-infinite-followed-by-my-follows.ts` — Next.js client hook
- `packages/next/src/hooks/followers/index.ts` — 6 new barrel exports

## Forward Intelligence

### What the next slice should know
- All 18 hooks (6 React + 6 Next.js + 6 return types) are exported from barrel `index.ts` files — imports work from `@lsp-indexer/react` and `@lsp-indexer/next` directly
- The service functions call `execute()` directly (not `fetchProfiles`) because they need custom `_and` where-clauses with dual relationship filters — the test app should call the hooks, not the service functions
- Server actions use `getServerUrl()` internally; React hooks use `getClientUrl()` — the test app playground needs both `NEXT_PUBLIC_HASURA_URL` and `HASURA_URL` env vars

### What's fragile
- The `_and` where-clause composition in service functions constructs `Universal_Profile_Bool_Exp` manually — if Hasura schema changes relationship names (`followedBy`/`followed`), these break silently (GraphQL returns empty results, not errors)

### Authoritative diagnostics
- `pnpm --filter=@lsp-indexer/types build && pnpm --filter=@lsp-indexer/node build && pnpm --filter=@lsp-indexer/react build && pnpm --filter=@lsp-indexer/next build` — if all 4 exit 0, the type contracts are sound
- `grep -c 'MutualFollow\|FollowedByMyFollow' packages/types/src/followers.ts` — should return ≥ 19 confirming all schemas present

### What assumptions changed
- Plan assumed `getFollowedByMyFollows` would use a single `address` param — actual implementation uses `myAddress` + `targetAddress` to match the service function's two-address requirement
