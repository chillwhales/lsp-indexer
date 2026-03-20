# S01: Mutual Follow Hooks — Full Stack — Research

**Date:** 2026-03-20
**Depth:** Light — well-understood work using established patterns already in the codebase.

## Summary

All three mutual follow hooks can be implemented by reusing the existing `fetchProfiles` service with composed `ProfileFilter` where-clauses. The `ProfileFilter` already has `followedBy` and `following` fields that map to Hasura nested relationship filters — the exact mechanism needed for set intersections. The `buildProfileWhere` function in `packages/node/src/services/profiles.ts` already translates these to `{ followedBy: { follower_address: { _ilike: X } } }` and `{ followed: { followed_address: { _ilike: X } } }` conditions.

The work is pure wiring: new Zod param schemas → new service functions that call `fetchProfiles` with composed filters → new query key entries → new hook factories → new React hooks → new Next.js server actions + hooks. Every layer has a clear pattern to follow from the existing `useProfiles`/`useFollows` implementations.

**Key insight:** No new GraphQL documents needed. The existing `GetProfilesDocument` already supports `universal_profile_bool_exp` which includes `followedBy` and `followed` array relationship filters. The new service functions just compose `_and` conditions on the `where` clause.

## Recommendation

Follow the existing profiles pattern exactly. Each mutual follow hook is essentially `fetchProfiles` with a pre-composed filter:

- **`fetchMutualFollows(addressA, addressB)`** → `fetchProfiles` where `{ _and: [{ followedBy: { follower_address: A } }, { followedBy: { follower_address: B } }] }`
- **`fetchMutualFollowers(addressA, addressB)`** → `fetchProfiles` where `{ _and: [{ followed: { followed_address: A } }, { followed: { followed_address: B } }] }`
- **`fetchFollowedByMyFollows(myAddress, targetAddress)`** → `fetchProfiles` where `{ _and: [{ followedBy: { follower_address: myAddress } }, { followed: { followed_address: targetAddress } }] }`

Return type is `FetchProfilesResult<ProfileResult<I>>` (profiles, not followers). Reuse `buildProfileIncludeDirectives`, `parseProfiles`, and `buildProfileOrderBy` from profiles service.

## Implementation Landscape

### Key Files

**Types (packages/types/src/followers.ts):**
- Add `UseMutualFollowsParamsSchema`, `UseMutualFollowersParamsSchema`, `UseFollowedByMyFollowsParamsSchema` and their infinite variants
- Each takes `{ addressA, addressB }` (or `{ myAddress, targetAddress }`), plus optional `sort`, `limit`, `offset`, `include` (ProfileInclude)
- Infer types: `UseMutualFollowsParams`, etc.
- Pattern: follow existing `UseFollowsParamsSchema` but with mandatory address params and `ProfileInclude` instead of `FollowerInclude`

**Service (packages/node/src/services/followers.ts):**
- Add `fetchMutualFollows`, `fetchMutualFollowers`, `fetchFollowedByMyFollows` — each calls `fetchProfiles` internally with a composed filter
- Use 3-overload pattern from `fetchProfiles` (no include → `Profile`, `include: I` → `ProfileResult<I>`, `include?` → `PartialProfile`)
- Reuse `FetchProfilesResult` from profiles service as return type

**Keys (packages/node/src/keys/followers.ts):**
- Add `followerKeys.mutualFollows(addressA, addressB, sort?, limit?, offset?, include?)`, `.mutualFollowers(...)`, `.followedByMyFollows(...)`
- Add infinite variants: `.infiniteMutualFollows(addressA, addressB, sort?, include?)`, etc.

**React hook factories (packages/react/src/hooks/factories/followers/):**
- Add `create-use-mutual-follows.ts`, `create-use-mutual-followers.ts`, `create-use-followed-by-my-follows.ts`
- Add infinite variants: `create-use-infinite-mutual-follows.ts`, etc.
- Pattern: follow `create-use-profiles.ts` (returns `{ profiles, totalCount }`, 3-overload with `ProfileInclude` narrowing)
- Could use `createUseList`/`createUseInfinite` base factories

**React hooks (packages/react/src/hooks/followers/):**
- Add `use-mutual-follows.ts`, `use-mutual-followers.ts`, `use-followed-by-my-follows.ts` + infinite variants
- Each is 3 lines: import factory + `getClientUrl` + wire

**React hook types (packages/react/src/hooks/types/):**
- Add return types: `UseMutualFollowsReturn<F>`, etc. — same shape as `UseProfilesReturn<F>` (profiles + totalCount)
- Infinite return types: same shape as `UseInfiniteProfilesReturn<F>`
- Could add to `followers.ts` or a new `mutual-follows.ts` types file

**Next.js server actions (packages/next/src/actions/followers.ts):**
- Add `getMutualFollows`, `getMutualFollowers`, `getFollowedByMyFollows` — 3-overload server actions calling the node service functions

**Next.js hooks (packages/next/src/hooks/followers/):**
- Add `use-mutual-follows.ts`, `use-mutual-followers.ts`, `use-followed-by-my-follows.ts` + infinite variants
- Each is 4 lines: `'use client'` + import factory + import server action + wire

**Index files to update:**
- `packages/react/src/hooks/factories/followers/index.ts` — export new factories
- `packages/react/src/hooks/followers/index.ts` — export new hooks
- `packages/next/src/hooks/followers/index.ts` — export new hooks
- `packages/types/src/followers.ts` — new schemas + types are in same file

### Build Order

1. **Types first** — Zod schemas + inferred types in `packages/types/src/followers.ts`. This unblocks everything downstream.
2. **Node service + keys** — `fetchMutualFollows` etc. in `packages/node/src/services/followers.ts`, key factories in `packages/node/src/keys/followers.ts`. These reuse `fetchProfiles` and require no new documents.
3. **React hook types + factories + hooks** — factory functions, return types, and concrete hooks. All follow established patterns.
4. **Next.js server actions + hooks** — server action wrappers and client hooks. Trivial wiring.

### Verification Approach

- `pnpm --filter=@lsp-indexer/types build` — types compile
- `pnpm --filter=@lsp-indexer/node build` — service functions and keys compile
- `pnpm --filter=@lsp-indexer/react build` — hooks compile
- `pnpm --filter=@lsp-indexer/next build` — server actions and hooks compile
- Full: `pnpm build` — all 4 packages build clean

## Constraints

- Return type must be `ProfileResult<I>` (profiles), not `FollowerResult<I>` — per decision D002
- Must query `universal_profile` table (via `fetchProfiles`/`GetProfilesDocument`), not `follower` table — per decision D003
- The `followedBy` filter field semantics: `followedBy: { follower_address: X }` means "profiles that X follows" (X appears as follower in the follow table, the profile is the followed)
- The `followed` filter field semantics: `followed: { followed_address: X }` means "profiles that follow X" (the profile appears as follower in the follow table, X is followed)
- `ProfileFilter.followedBy` and `following` fields are single-string, but for mutual follow queries we need TWO simultaneous `followedBy` conditions. This means the service functions must call `fetchProfiles` with a raw `_and` where-clause via `buildProfileWhere` composition, OR build the where-clause directly. The current `ProfileFilter` schema only accepts one `followedBy` value. **The service functions should build the `Universal_Profile_Bool_Exp` directly rather than trying to encode two addresses into a single `ProfileFilter`.**
