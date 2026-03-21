---
estimated_steps: 4
estimated_files: 8
---

# T03: Add Next.js server actions and client hooks

**Slice:** S01 — Mutual Follow Hooks — Full Stack
**Milestone:** M004

## Description

Complete the full stack by adding Next.js server actions and client hooks. Server actions wrap the node service functions with Zod validation (keeping the Hasura endpoint hidden from the client). Client hooks wire the React factory functions to the server actions.

## Steps

1. **Add 3 server actions to `packages/next/src/actions/followers.ts`:**
   - `getMutualFollows(params)` — 3-overload server action: no include → `FetchProfilesResult`, `include: I` → `FetchProfilesResult<ProfileResult<I>>`, `include?` → `FetchProfilesResult<PartialProfile>`. Implementation: `validateInput(UseMutualFollowsParamsSchema, params, 'getMutualFollows')` then `return fetchMutualFollows(getServerUrl(), params)`.
   - `getMutualFollowers(params)` — same pattern with `UseMutualFollowersParamsSchema` + `fetchMutualFollowers`
   - `getFollowedByMyFollows(params)` — same pattern with `UseFollowedByMyFollowsParamsSchema` + `fetchFollowedByMyFollows`
   - Import new schemas from `@lsp-indexer/types`, new fetch functions from `@lsp-indexer/node`

2. **Create 6 Next.js client hook files in `packages/next/src/hooks/followers/`:**
   - Each follows `use-follows.ts` pattern (4 lines: `'use client'` + import factory from `@lsp-indexer/react` + import server action from `@lsp-indexer/next/actions` + wire)
   - `use-mutual-follows.ts`: `export const useMutualFollows = createUseMutualFollows(getMutualFollows);`
   - `use-infinite-mutual-follows.ts`: `export const useInfiniteMutualFollows = createUseInfiniteMutualFollows(getMutualFollows);`
   - Same for mutual-followers and followed-by-my-follows (6 files total)

3. **Update `packages/next/src/hooks/followers/index.ts`** — add 6 new exports

4. **Verify full build:** `pnpm build` (all 4 packages)

## Must-Haves

- [ ] 3 server actions with 3-overload signatures and Zod validation
- [ ] 6 Next.js client hooks wired to server actions via React factories
- [ ] All barrel exports updated
- [ ] `pnpm build` passes all 4 packages with zero errors

## Verification

- `cd /home/coder/lsp-indexer/.gsd/worktrees/M004 && pnpm --filter=@lsp-indexer/next build` exits 0
- `cd /home/coder/lsp-indexer/.gsd/worktrees/M004 && pnpm build` exits 0
- `ls packages/next/src/hooks/followers/use-*mutual* packages/next/src/hooks/followers/use-*followed-by*` — 6 files exist
- `grep -c 'getMutualFollow\|getFollowedByMyFollow' packages/next/src/actions/followers.ts` returns >= 6

## Inputs

- `packages/next/src/actions/followers.ts` — existing server actions file to extend (reference: `getFollows` pattern)
- `packages/next/src/hooks/followers/use-follows.ts` — reference pattern for Next.js hook wiring
- `packages/next/src/hooks/followers/use-infinite-follows.ts` — reference pattern for infinite hook wiring
- T01 outputs: `fetchMutualFollows` etc. from `@lsp-indexer/node`, Zod schemas from `@lsp-indexer/types`
- T02 outputs: `createUseMutualFollows` etc. factory functions from `@lsp-indexer/react`

## Expected Output

- `packages/next/src/actions/followers.ts` — extended with 3 new server actions
- `packages/next/src/hooks/followers/` — 6 new hook files + updated index.ts
- Full `pnpm build` passes all 4 packages
