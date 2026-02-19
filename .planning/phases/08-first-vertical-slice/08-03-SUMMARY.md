---
phase: 08-first-vertical-slice
plan: 03
subsystem: react-profile-hooks
tags: [tanstack-query, hooks, entry-points, useQuery, useInfiniteQuery, profiles]
dependency-graph:
  requires: [08-01, 08-02]
  provides: [profile-hooks, profile-entry-points, build-validated]
  affects: [08-04, 09-01]
tech-stack:
  added: []
  patterns:
    [
      tanstack-usequery-wrapper,
      tanstack-useinfinitequery-offset,
      domain-named-return-keys,
      entry-point-segregation,
    ]
key-files:
  created:
    - packages/react/src/hooks/profiles.ts
  modified:
    - packages/react/src/index.ts
    - packages/react/src/server.ts
    - packages/react/src/types.ts
decisions:
  - id: D-0803-01
    decision: 'Destructure hasNextPage/fetchNextPage/isFetchingNextPage separately before rest spread to avoid TS2783 duplicate properties'
    rationale: 'TanStack useInfiniteQuery result includes these in the base object. Spreading ...rest after explicit keys caused TypeScript error. Destructuring them out first eliminates duplicates while preserving the desired API surface.'
metrics:
  duration: '~4 minutes'
  completed: '2026-02-17'
---

# Phase 8 Plan 03: Hooks + Entry Point Wiring + Build Validation Summary

**One-liner:** Three TanStack Query profile hooks (useProfile, useProfiles, useInfiniteProfiles) with domain-named returns, wired through client/server/types entry points, build-validated with ESM+CJS+DTS output.

## What Was Done

### Task 1: Create profile hooks

- Created `packages/react/src/hooks/profiles.ts` with three hooks:

**useProfile(params: UseProfileParams)**

- Wraps `useQuery` calling `fetchProfile` via service layer
- queryKey: `profileKeys.detail(address)` — enables granular cache invalidation
- enabled: `Boolean(params.address)` — prevents unnecessary fetches for empty address
- Returns: `{ profile: data ?? null, ...rest }` — domain-named key, null when missing

**useProfiles(params?: UseProfilesParams)**

- Wraps `useQuery` calling `fetchProfiles` via service layer
- queryKey: `profileKeys.list(filter, sort)` — cache varies by filter/sort combo
- Returns: `{ profiles: data?.profiles ?? [], totalCount: data?.totalCount ?? 0, ...rest }` — always safe to iterate

**useInfiniteProfiles(params?: UseInfiniteProfilesParams)**

- Wraps `useInfiniteQuery` with offset-based pagination
- queryKey: `profileKeys.infinite(filter, sort)` — **SEPARATE namespace** from list to prevent cache corruption
- `initialPageParam: 0`, `getNextPageParam`: returns `lastPageParam + pageSize` if full page, `undefined` otherwise
- Pages flattened via `data.pages.flatMap(page => page.profiles)` into single array
- Returns: `{ profiles, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }`
- Default `pageSize = 20`

All hooks include comprehensive JSDoc with usage examples.

### Task 2: Wire entry points and validate build

**Updated `index.ts` (client entry):**

- Added `useProfile`, `useProfiles`, `useInfiniteProfiles` hook exports
- Added `profileKeys` query key factory export

**Updated `server.ts` (server entry):**

- Added `fetchProfile`, `fetchProfiles` service function exports
- Added `FetchProfilesResult` type export

**Updated `types.ts` (types entry):**

- Added all profile domain type re-exports: `Profile`, `ProfileImage`, `ProfileFilter`, `ProfileSort`, `ProfileSortField`, `SortDirection`, `ProfileInclude`, `UseProfileParams`, `UseProfilesParams`, `UseInfiniteProfilesParams`

**Build validation:**

- `pnpm build` succeeds with zero errors
- `pnpm typecheck` passes
- All 3 entry points produce ESM (.js) + CJS (.cjs) + DTS (.d.ts + .d.cts)
- All expected exports verified present in .d.ts files

## Task Commits

| Task | Name                                 | Commit  | Key Files                     |
| ---- | ------------------------------------ | ------- | ----------------------------- |
| 1    | Create profile hooks                 | 55eb416 | hooks/profiles.ts             |
| 2    | Wire entry points and validate build | db9d963 | index.ts, server.ts, types.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Branch based on 08-02 feature branch instead of integration branch**

- **Found during:** Setup
- **Issue:** 08-01 and 08-02 feature branches haven't been merged into `refactor/indexer-v2-react` yet, so the prerequisite files (keys, parsers, services, types) didn't exist on the integration branch.
- **Fix:** Created the feature branch from `feat/react-profile-keys-parsers-services` (08-02 branch) which contains all prerequisite work.
- **Impact:** PR for 08-03 will need to target `refactor/indexer-v2-react` after 08-01 and 08-02 PRs are merged first.

**2. [Rule 1 - Bug] Fixed TS2783 duplicate property error in useInfiniteProfiles**

- **Found during:** Task 1 (typecheck)
- **Issue:** Initially destructured `{ data, ...rest }` from useInfiniteQuery then returned `{ hasNextPage: rest.hasNextPage, ...rest }`. TypeScript flagged this as TS2783 because `hasNextPage`, `fetchNextPage`, and `isFetchingNextPage` appear in both the explicit keys and the `...rest` spread.
- **Fix:** Changed to destructure all needed properties first: `{ data, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }`, then return them explicitly alongside `...rest`.
- **Files modified:** `hooks/profiles.ts`
- **Commit:** 55eb416

## Decisions Made

| ID        | Decision                                                 | Rationale                                                     |
| --------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| D-0803-01 | Destructure infinite query properties before rest spread | Avoids TS2783 duplicate properties while preserving API shape |

## Verification Results

| Check                                                              | Result |
| ------------------------------------------------------------------ | ------ |
| `pnpm build` succeeds in packages/react                            | PASS   |
| `pnpm typecheck` passes                                            | PASS   |
| useProfile returns `{ profile: Profile \| null, ...rest }`         | PASS   |
| useProfiles returns `{ profiles: Profile[], totalCount, ...rest }` | PASS   |
| useInfiniteProfiles returns `{ profiles, hasNextPage, ... }`       | PASS   |
| useInfiniteProfiles uses separate query key namespace              | PASS   |
| index.ts exports hooks + profileKeys                               | PASS   |
| server.ts exports fetchProfile + fetchProfiles                     | PASS   |
| types.ts exports all profile domain types                          | PASS   |
| dist/ contains index.js, server.js, types.js + .d.ts files         | PASS   |
| dist/index.d.ts has useProfile, useProfiles, useInfiniteProfiles   | PASS   |
| dist/types.d.ts has Profile, ProfileImage, etc.                    | PASS   |
| dist/server.d.ts has fetchProfile, fetchProfiles                   | PASS   |

## Next Phase Readiness

- **Blockers:** None
- **Ready for:** 08-04 (Test app profiles playground page + end-to-end verification)
- **Dependencies delivered:** All hooks importable from `@lsp-indexer/react`, services from `@lsp-indexer/react/server`, types from `@lsp-indexer/react/types`
- **Key exports for 08-04:** `useProfile`, `useProfiles`, `useInfiniteProfiles` (hooks), `profileKeys` (keys), all profile types
- **Note:** PRs for 08-01 and 08-02 need to be merged to `refactor/indexer-v2-react` before this branch's PR can be merged cleanly

## Self-Check: PASSED
