---
estimated_steps: 4
estimated_files: 15
---

# T02: Add React hook return types, factories, and concrete hooks

**Slice:** S01 — Mutual Follow Hooks — Full Stack
**Milestone:** M004

## Description

Create the React layer for mutual follow queries: return types, factory functions, and concrete hooks. Since mutual follow hooks return **profiles** (not followers), their return types mirror `UseProfilesReturn<F>` / `UseInfiniteProfilesReturn<F>` from `packages/react/src/hooks/types/profiles.ts`, and the factories use `createUseList` / `createUseInfinite` with `ProfileInclude` narrowing. Each factory follows the 3-overload pattern from `createUseProfiles`.

## Steps

1. **Add return types to `packages/react/src/hooks/types/followers.ts`:**
   - `UseMutualFollowsReturn<F>` — `{ profiles: F[]; totalCount: number } & Omit<UseQueryResult<FetchProfilesResult<F>, Error>, 'data'>` (same shape as `UseProfilesReturn<F>`)
   - `UseInfiniteMutualFollowsReturn<F>` — same shape as `UseInfiniteProfilesReturn<F>`
   - Same types for MutualFollowers and FollowedByMyFollows (they all return profiles)
   - Total: 6 new return types. Import `FetchProfilesResult` from `@lsp-indexer/node`.

2. **Create 6 factory files in `packages/react/src/hooks/factories/followers/`:**
   - `create-use-mutual-follows.ts` — follows `create-use-profiles.ts` pattern exactly:
     - Import `FetchProfilesResult`, `followerKeys` from `@lsp-indexer/node`
     - Import param types from `@lsp-indexer/types`: `UseMutualFollowsParams`, `ProfileInclude`, `ProfileResult`, `Profile`, `PartialProfile`
     - Import return type from `../../types`
     - Uses `createUseList` with `queryKey: (p) => followerKeys.mutualFollows(p.addressA, p.addressB, p.sort, p.limit, p.offset, p.include)`, `extractItems: (r) => r.profiles`
     - 3-overload: `include: I` → `ProfileResult<I>`, no include → `Profile`, `include?` → `PartialProfile`
     - Remaps `items` to `profiles` in return
   - `create-use-infinite-mutual-follows.ts` — follows `create-use-infinite-profiles.ts` pattern:
     - Uses `createUseInfinite` with `queryKey: (p) => followerKeys.infiniteMutualFollows(p.addressA, p.addressB, p.sort, p.include)`, `extractItems: (r) => r.profiles`
     - 3-overload include narrowing, remaps `items` to `profiles`
   - Same pattern for `create-use-mutual-followers.ts`, `create-use-infinite-mutual-followers.ts`, `create-use-followed-by-my-follows.ts`, `create-use-infinite-followed-by-my-follows.ts`
   - Update `packages/react/src/hooks/factories/followers/index.ts` — add 6 new exports

3. **Create 6 concrete hook files in `packages/react/src/hooks/followers/`:**
   - Each is ~3 lines following `use-follows.ts` pattern: import factory + `getClientUrl` + `fetchMutualFollows` + wire
   - `use-mutual-follows.ts`: `export const useMutualFollows = createUseMutualFollows((params) => fetchMutualFollows(getClientUrl(), params));`
   - Same pattern for all 6 hooks
   - Update `packages/react/src/hooks/followers/index.ts` — add 6 new exports

4. **Verify:** `pnpm --filter=@lsp-indexer/react build` exits 0

## Must-Haves

- [ ] 6 return types in `packages/react/src/hooks/types/followers.ts`
- [ ] 6 factory functions in `packages/react/src/hooks/factories/followers/`
- [ ] 6 concrete hooks in `packages/react/src/hooks/followers/`
- [ ] All factories use 3-overload `ProfileInclude` narrowing
- [ ] All barrel exports updated
- [ ] `@lsp-indexer/react` builds clean

## Verification

- `cd /home/coder/lsp-indexer/.gsd/worktrees/M004 && pnpm --filter=@lsp-indexer/react build` exits 0
- `ls packages/react/src/hooks/factories/followers/create-use-*mutual* packages/react/src/hooks/factories/followers/create-use-*followed-by*` — 6 files exist
- `ls packages/react/src/hooks/followers/use-*mutual* packages/react/src/hooks/followers/use-*followed-by*` — 6 files exist

## Inputs

- `packages/react/src/hooks/factories/profiles/create-use-profiles.ts` — reference pattern for list factory with `ProfileInclude` 3-overload
- `packages/react/src/hooks/factories/profiles/create-use-infinite-profiles.ts` — reference pattern for infinite factory
- `packages/react/src/hooks/followers/use-follows.ts` — reference pattern for concrete hook wiring
- `packages/react/src/hooks/types/profiles.ts` — reference return type shapes (`UseProfilesReturn<F>`, `UseInfiniteProfilesReturn<F>`)
- T01 outputs: `followerKeys.mutualFollows(...)` etc. in keys, `fetchMutualFollows` etc. in services, param types in types package

## Expected Output

- `packages/react/src/hooks/types/followers.ts` — extended with 6 new return types
- `packages/react/src/hooks/factories/followers/` — 6 new factory files + updated index.ts
- `packages/react/src/hooks/followers/` — 6 new hook files + updated index.ts
