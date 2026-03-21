---
estimated_steps: 5
estimated_files: 3
---

# T01: Add Zod schemas, service functions, and query keys for mutual follow queries

**Slice:** S01 — Mutual Follow Hooks — Full Stack
**Milestone:** M004

## Description

Add the foundation layer for mutual follow queries: Zod parameter schemas in `@lsp-indexer/types`, service functions in `@lsp-indexer/node`, and query key factories. These return **profiles** (not followers) by querying the `universal_profile` table via `fetchProfiles` with composed `_and` where-clauses on Hasura's `followedBy`/`followed` nested relationship filters.

## Steps

1. **Add 6 Zod param schemas to `packages/types/src/followers.ts`:**
   - `UseMutualFollowsParamsSchema` — `{ addressA: z.string(), addressB: z.string(), sort?: ProfileSortSchema, limit?: z.number(), offset?: z.number(), include?: ProfileIncludeSchema }`
   - `UseInfiniteMutualFollowsParamsSchema` — same but with `pageSize` instead of `limit`/`offset`
   - `UseMutualFollowersParamsSchema` — identical shape to MutualFollows (same `addressA`/`addressB` params, different semantics)
   - `UseInfiniteMutualFollowersParamsSchema` — infinite variant
   - `UseFollowedByMyFollowsParamsSchema` — `{ myAddress: z.string(), targetAddress: z.string(), sort?, limit?, offset?, include? }`
   - `UseInfiniteFollowedByMyFollowsParamsSchema` — infinite variant
   - Export inferred types for all 6. Note: import `ProfileSortSchema` and `ProfileIncludeSchema` from `./profiles` (they're already exported).

2. **Add 3 service functions to `packages/node/src/services/followers.ts`:**
   - `fetchMutualFollows(url, params)` — builds `Universal_Profile_Bool_Exp` with `{ _and: [{ followedBy: { follower_address: { _ilike: addressA } } }, { followedBy: { follower_address: { _ilike: addressB } } }] }`, then calls `fetchProfiles(url, { filter: undefined, sort, limit, offset, include }, where)`. **However**, `fetchProfiles` builds its own `where` from `filter` — so the mutual follow functions must call `execute` + `GetProfilesDocument` directly (same as `fetchProfiles` does internally), or we need to pass a raw where override. **The cleanest approach: duplicate the `execute(url, GetProfilesDocument, ...)` call pattern from `fetchProfiles`, constructing the where-clause directly.** Import `GetProfilesDocument`, `buildProfileOrderBy`, `buildProfileIncludeDirectives`, `parseProfiles`, `buildBlockOrderSort` from profiles service.
   - Each function uses 3-overload pattern (no include → `Profile`, `include: I` → `ProfileResult<I>`, `include?` → `PartialProfile`), returning `FetchProfilesResult<...>`.
   - `fetchMutualFollowers(url, params)` — where: `{ _and: [{ followed: { followed_address: { _ilike: addressA } } }, { followed: { followed_address: { _ilike: addressB } } }] }`
   - `fetchFollowedByMyFollows(url, params)` — where: `{ _and: [{ followedBy: { follower_address: { _ilike: myAddress } } }, { followed: { followed_address: { _ilike: targetAddress } } }] }`

3. **Add 6 query key entries to `packages/node/src/keys/followers.ts`:**
   - `followerKeys.mutualFollows(addressA, addressB, sort?, limit?, offset?, include?)` → `['followers', 'mutual-follows', 'list', addressA, addressB, sort, limit, offset, include]`
   - `followerKeys.infiniteMutualFollows(addressA, addressB, sort?, include?)` → `['followers', 'mutual-follows', 'infinite', addressA, addressB, sort, include]`
   - Same pattern for `mutualFollowers` / `infiniteMutualFollowers` and `followedByMyFollows` / `infiniteFollowedByMyFollows`

4. **Verify builds:** `pnpm --filter=@lsp-indexer/types build && pnpm --filter=@lsp-indexer/node build`

## Must-Haves

- [ ] 6 Zod param schemas exported from types package (3 base + 3 infinite)
- [ ] 6 inferred TypeScript types exported
- [ ] 3 service functions with 3-overload `ProfileInclude` narrowing, returning `FetchProfilesResult<ProfileResult<I>>`
- [ ] Service functions build `Universal_Profile_Bool_Exp` directly with `_and` + nested relationship filters
- [ ] 6 query key entries in `followerKeys`
- [ ] `@lsp-indexer/types` builds clean
- [ ] `@lsp-indexer/node` builds clean

## Verification

- `cd /home/coder/lsp-indexer/.gsd/worktrees/M004 && pnpm --filter=@lsp-indexer/types build` exits 0
- `cd /home/coder/lsp-indexer/.gsd/worktrees/M004 && pnpm --filter=@lsp-indexer/node build` exits 0
- `grep -c 'MutualFollow\|FollowedByMyFollow' packages/types/src/followers.ts` returns >= 12 (schemas + types)
- `grep -c 'fetchMutualFollow\|fetchFollowedByMyFollow' packages/node/src/services/followers.ts` returns >= 6 (3 functions × 2 for overloads)

## Inputs

- `packages/types/src/followers.ts` — existing follower schemas to extend (add new mutual follow schemas alongside existing `UseFollowsParamsSchema`)
- `packages/types/src/profiles.ts` — import `ProfileSortSchema`, `ProfileIncludeSchema`, `ProfileSort`, `ProfileInclude`, `ProfileResult`, `Profile`, `PartialProfile`
- `packages/node/src/services/profiles.ts` — reference implementation for `fetchProfiles` pattern; import `buildProfileOrderBy`, `buildProfileIncludeDirectives`, `FetchProfilesResult`, `buildBlockOrderSort` (note: `buildBlockOrderSort` is in `./utils`)
- `packages/node/src/services/followers.ts` — existing service file to extend
- `packages/node/src/keys/followers.ts` — existing key factory to extend
- `packages/node/src/documents/profiles.ts` — import `GetProfilesDocument`
- `packages/node/src/parsers/profiles.ts` — import `parseProfiles`
- `packages/node/src/graphql/graphql.ts` — import `Universal_Profile_Bool_Exp`

## Expected Output

- `packages/types/src/followers.ts` — extended with 6 new Zod schemas + 6 inferred types
- `packages/node/src/services/followers.ts` — extended with 3 new service functions (`fetchMutualFollows`, `fetchMutualFollowers`, `fetchFollowedByMyFollows`)
- `packages/node/src/keys/followers.ts` — extended with 6 new key entries
