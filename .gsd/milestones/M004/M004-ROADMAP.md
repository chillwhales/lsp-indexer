# M004: Mutual Follow Hooks

**Vision:** Three social graph intersection hooks — `useMutualFollows`, `useMutualFollowers`, and `useFollowedByMyFollows` — exposing mutual connection queries through the typed consumer package layer.

## Success Criteria

- `useMutualFollows(addressA, addressB)` returns profiles both A and B follow
- `useMutualFollowers(addressA, addressB)` returns profiles that follow both A and B
- `useFollowedByMyFollows(myAddress, targetAddress)` returns profiles user follows who also follow target
- All three have infinite scroll variants
- Include-based type narrowing works on returned profiles
- All 4 packages build and typecheck clean
- Hooks available from both `@lsp-indexer/react` and `@lsp-indexer/next`

## Key Risks / Unknowns

- Hasura nested relationship filter performance on large follower sets — low risk, SQL join under the hood

## Proof Strategy

- Performance risk → retire in S01 by querying live Hasura with real addresses

## Verification Classes

- Contract verification: build + typecheck across all 4 packages
- Integration verification: hooks return correct data from live Hasura
- Operational verification: none
- UAT / human verification: test app playground page

## Milestone Definition of Done

This milestone is complete only when all are true:

- All three hooks work in both react and next packages
- Include narrowing produces correctly typed results
- Infinite scroll variants paginate correctly
- All 4 packages build + typecheck with zero errors
- Test app playground page exercises all hooks against live data
- Docs updated

## Requirement Coverage

- Covers: R001, R002, R003, R004, R005, R006, R007, R008
- Partially covers: none
- Leaves for later: none
- Orphan risks: none

## Slices

- [x] **S01: Mutual Follow Hooks — Full Stack** `risk:low` `depends:[]`
  > After this: All 3 hooks return correct profile intersections from live Hasura in both `@lsp-indexer/react` and `@lsp-indexer/next`, with infinite scroll and include narrowing.

- [ ] **S02: Build Validation & Docs** `risk:low` `depends:[S01]`
  > After this: All 4 packages build clean, test app playground page exercises the 3 new hooks, docs pages updated.

## Boundary Map

### S01 → S02

Produces:
- `packages/types/src/followers.ts` → `UseMutualFollowsParamsSchema`, `UseMutualFollowersParamsSchema`, `UseFollowedByMyFollowsParamsSchema` + inferred types
- `packages/node/src/documents/followers.ts` → `GetMutualFollowsDocument` (or shared profile document with mutual follow where-clause)
- `packages/node/src/services/followers.ts` → `fetchMutualFollows()`, `fetchMutualFollowers()`, `fetchFollowedByMyFollows()`
- `packages/node/src/keys/followers.ts` → `followerKeys.mutualFollows()`, `.mutualFollowers()`, `.followedByMyFollows()`
- `packages/react/src/hooks/followers/` → `useMutualFollows`, `useMutualFollowers`, `useFollowedByMyFollows` + infinite variants
- `packages/next/src/hooks/followers/` → same hooks via server actions
- `packages/next/src/actions/followers.ts` → `getMutualFollows`, `getMutualFollowers`, `getFollowedByMyFollows` server actions

Consumes:
- nothing (first slice)

### S02

Produces:
- `apps/test/src/app/mutual-follows/page.tsx` → playground page
- `apps/docs/` → updated docs pages

Consumes from S01:
- All hook exports from react and next packages
