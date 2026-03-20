# S01: Mutual Follow Hooks — Full Stack

**Goal:** All 3 mutual follow hooks (`useMutualFollows`, `useMutualFollowers`, `useFollowedByMyFollows`) return correct profile intersections from live Hasura in both `@lsp-indexer/react` and `@lsp-indexer/next`, with infinite scroll and include narrowing.
**Demo:** Import any of the 6 hooks (3 base + 3 infinite) from either `@lsp-indexer/react` or `@lsp-indexer/next`, pass two addresses, and get back typed `ProfileResult<I>[]` with `totalCount` (or infinite scroll controls). Include narrowing produces correctly narrowed types at compile time.

## Must-Haves

- `fetchMutualFollows`, `fetchMutualFollowers`, `fetchFollowedByMyFollows` service functions in `@lsp-indexer/node` using `fetchProfiles` with composed `_and` where-clauses on `followedBy`/`followed` relationship filters
- Zod param schemas + inferred TypeScript types for all 3 queries (base + infinite variants)
- Query key factories for cache management
- React hook factories + concrete hooks (3 base + 3 infinite) with 3-overload `ProfileInclude` narrowing
- Next.js server actions (3) + client hooks (3 base + 3 infinite)
- All 4 packages (`types`, `node`, `react`, `next`) build with zero errors

## Proof Level

- This slice proves: contract (compile-time type safety + build success across all packages)
- Real runtime required: no (S02 covers live Hasura verification via test app)
- Human/UAT required: no

## Verification

- `cd /home/coder/lsp-indexer/.gsd/worktrees/M004 && pnpm --filter=@lsp-indexer/types build` — exits 0
- `cd /home/coder/lsp-indexer/.gsd/worktrees/M004 && pnpm --filter=@lsp-indexer/node build` — exits 0
- `cd /home/coder/lsp-indexer/.gsd/worktrees/M004 && pnpm --filter=@lsp-indexer/react build` — exits 0
- `cd /home/coder/lsp-indexer/.gsd/worktrees/M004 && pnpm --filter=@lsp-indexer/next build` — exits 0

## Integration Closure

- Upstream surfaces consumed: `fetchProfiles` + `buildProfileWhere` + `buildProfileOrderBy` + `buildProfileIncludeDirectives` + `parseProfiles` from `packages/node/src/services/profiles.ts`; `GetProfilesDocument` from `packages/node/src/documents/profiles.ts`; `createUseList` + `createUseInfinite` generic factories from `packages/react/src/hooks/factories/`
- New wiring introduced in this slice: 3 service functions → 3 server actions → 6 react hooks → 6 next hooks, all following existing patterns exactly
- What remains before the milestone is truly usable end-to-end: S02 (build validation, test app playground page, docs)

## Tasks

- [ ] **T01: Add Zod schemas, service functions, and query keys for mutual follow queries** `est:45m`
  - Why: Foundation layer — types, data-fetching logic, and cache keys that all hooks depend on
  - Files: `packages/types/src/followers.ts`, `packages/node/src/services/followers.ts`, `packages/node/src/keys/followers.ts`
  - Do: Add 6 Zod param schemas (3 base + 3 infinite) to types. Add 3 `fetch*` service functions to node that call `fetchProfiles` with composed `_and` where-clauses. Add 6 query key entries to follower keys. Service functions must build `Universal_Profile_Bool_Exp` directly (not use `ProfileFilter`) because they need two simultaneous `followedBy`/`followed` conditions.
  - Verify: `pnpm --filter=@lsp-indexer/types build && pnpm --filter=@lsp-indexer/node build` exits 0
  - Done when: All 3 service functions and 6 param schemas exist, types and node packages compile clean

- [ ] **T02: Add React hook return types, factories, and concrete hooks** `est:45m`
  - Why: Exposes the 3 mutual follow queries as React hooks with include narrowing and infinite scroll
  - Files: `packages/react/src/hooks/types/followers.ts`, `packages/react/src/hooks/factories/followers/create-use-mutual-follows.ts`, `packages/react/src/hooks/factories/followers/create-use-mutual-followers.ts`, `packages/react/src/hooks/factories/followers/create-use-followed-by-my-follows.ts`, `packages/react/src/hooks/factories/followers/create-use-infinite-mutual-follows.ts`, `packages/react/src/hooks/factories/followers/create-use-infinite-mutual-followers.ts`, `packages/react/src/hooks/factories/followers/create-use-infinite-followed-by-my-follows.ts`, `packages/react/src/hooks/factories/followers/index.ts`, `packages/react/src/hooks/followers/use-mutual-follows.ts`, `packages/react/src/hooks/followers/use-mutual-followers.ts`, `packages/react/src/hooks/followers/use-followed-by-my-follows.ts`, `packages/react/src/hooks/followers/use-infinite-mutual-follows.ts`, `packages/react/src/hooks/followers/use-infinite-mutual-followers.ts`, `packages/react/src/hooks/followers/use-infinite-followed-by-my-follows.ts`, `packages/react/src/hooks/followers/index.ts`
  - Do: Add return types (`UseMutualFollowsReturn<F>` etc.) mirroring `UseProfilesReturn<F>` shape. Create 6 factory functions following `createUseProfiles`/`createUseInfiniteProfiles` pattern — each uses `createUseList`/`createUseInfinite` with `ProfileInclude` narrowing via 3-overload. Wire 6 concrete hooks using `getClientUrl()`. Update barrel exports.
  - Verify: `pnpm --filter=@lsp-indexer/react build` exits 0
  - Done when: 6 hooks exported from `@lsp-indexer/react` with correct `ProfileResult<I>` type narrowing

- [ ] **T03: Add Next.js server actions and client hooks** `est:30m`
  - Why: Completes the full stack — Next.js apps get server-action-routed hooks keeping Hasura endpoint hidden
  - Files: `packages/next/src/actions/followers.ts`, `packages/next/src/hooks/followers/use-mutual-follows.ts`, `packages/next/src/hooks/followers/use-mutual-followers.ts`, `packages/next/src/hooks/followers/use-followed-by-my-follows.ts`, `packages/next/src/hooks/followers/use-infinite-mutual-follows.ts`, `packages/next/src/hooks/followers/use-infinite-mutual-followers.ts`, `packages/next/src/hooks/followers/use-infinite-followed-by-my-follows.ts`, `packages/next/src/hooks/followers/index.ts`
  - Do: Add 3 server actions (`getMutualFollows`, `getMutualFollowers`, `getFollowedByMyFollows`) to followers.ts with 3-overload signatures + Zod validation. Wire 6 Next.js client hooks using the factory functions from `@lsp-indexer/react` + server actions. Update barrel exports.
  - Verify: `pnpm --filter=@lsp-indexer/next build` exits 0
  - Done when: 6 hooks exported from `@lsp-indexer/next`, full `pnpm build` passes all 4 packages

## Files Likely Touched

- `packages/types/src/followers.ts`
- `packages/node/src/services/followers.ts`
- `packages/node/src/keys/followers.ts`
- `packages/react/src/hooks/types/followers.ts`
- `packages/react/src/hooks/factories/followers/create-use-mutual-follows.ts` (new)
- `packages/react/src/hooks/factories/followers/create-use-mutual-followers.ts` (new)
- `packages/react/src/hooks/factories/followers/create-use-followed-by-my-follows.ts` (new)
- `packages/react/src/hooks/factories/followers/create-use-infinite-mutual-follows.ts` (new)
- `packages/react/src/hooks/factories/followers/create-use-infinite-mutual-followers.ts` (new)
- `packages/react/src/hooks/factories/followers/create-use-infinite-followed-by-my-follows.ts` (new)
- `packages/react/src/hooks/factories/followers/index.ts`
- `packages/react/src/hooks/followers/use-mutual-follows.ts` (new)
- `packages/react/src/hooks/followers/use-mutual-followers.ts` (new)
- `packages/react/src/hooks/followers/use-followed-by-my-follows.ts` (new)
- `packages/react/src/hooks/followers/use-infinite-mutual-follows.ts` (new)
- `packages/react/src/hooks/followers/use-infinite-mutual-followers.ts` (new)
- `packages/react/src/hooks/followers/use-infinite-followed-by-my-follows.ts` (new)
- `packages/react/src/hooks/followers/index.ts`
- `packages/next/src/actions/followers.ts`
- `packages/next/src/hooks/followers/use-mutual-follows.ts` (new)
- `packages/next/src/hooks/followers/use-mutual-followers.ts` (new)
- `packages/next/src/hooks/followers/use-followed-by-my-follows.ts` (new)
- `packages/next/src/hooks/followers/use-infinite-mutual-follows.ts` (new)
- `packages/next/src/hooks/followers/use-infinite-mutual-followers.ts` (new)
- `packages/next/src/hooks/followers/use-infinite-followed-by-my-follows.ts` (new)
- `packages/next/src/hooks/followers/index.ts`
