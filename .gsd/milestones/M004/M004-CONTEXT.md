# M004: Mutual Follow Hooks — Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

## Project Description

Three new social graph intersection hooks for the LUKSO follower domain: `useMutualFollows`, `useMutualFollowers`, and `useFollowedByMyFollows`. Pure consumer-package work — no indexer or schema changes needed.

## Why This Milestone

Social graph intersection queries are fundamental for any social platform UX — showing mutual connections, social proof on profiles, and common interests. The `follower` table and Hasura relationship filters already support these queries; we just need to expose them through the typed hook layer.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Call `useMutualFollows(addressA, addressB)` and get back profiles both addresses follow
- Call `useMutualFollowers(addressA, addressB)` and get back profiles that follow both addresses
- Call `useFollowedByMyFollows(myAddress, targetAddress)` and get back profiles from their following list that also follow the target
- Use infinite scroll variants of all three
- Use include-based type narrowing on returned profiles
- Import from `@lsp-indexer/react` (direct Hasura) or `@lsp-indexer/next` (server actions)

### Entry point / environment

- Entry point: npm package imports in consumer React/Next.js apps
- Environment: browser (react) or Node.js server (next server actions)
- Live dependencies involved: Hasura GraphQL endpoint

## Completion Class

- Contract complete means: all 4 packages build + typecheck clean, hooks exported from correct entry points
- Integration complete means: hooks return correct data from live Hasura
- Operational complete means: none (read-only hooks, no lifecycle concerns)

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- All three hooks return correct intersection results against live Hasura data
- Include narrowing works (omitting profile fields produces correctly narrowed types)
- Infinite scroll variants paginate correctly
- Both react and next packages export and build clean

## Risks and Unknowns

- Hasura nested `followedBy`/`followed` filters for set intersection — low risk, verified in schema that `universal_profile_bool_exp` has these fields
- Performance of nested relationship filters on large follower sets — low risk, Hasura handles this server-side with SQL joins

## Existing Codebase / Prior Art

- `packages/types/src/followers.ts` — existing follower domain types, include system
- `packages/types/src/profiles.ts` — Profile type and ProfileInclude for return type
- `packages/node/src/services/followers.ts` — existing service functions, include var builders
- `packages/node/src/services/profiles.ts` — `buildProfileWhere`, `buildProfileIncludeVars`, `parseProfile`
- `packages/node/src/documents/followers.ts` — existing GraphQL documents
- `packages/react/src/hooks/factories/followers/` — existing hook factories
- `packages/next/src/hooks/followers/` — existing Next.js hooks

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions.

## Relevant Requirements

- R001–R003 — the three hooks themselves
- R004–R005 — dual-package availability (react + next)
- R006 — include-based type narrowing on returned profiles
- R007 — infinite scroll variants
- R008 — build verification

## Scope

### In Scope

- Zod param schemas and inferred types in `@lsp-indexer/types`
- GraphQL document for mutual follow queries in `@lsp-indexer/node`
- Service functions in `@lsp-indexer/node`
- Query key factory entries in `@lsp-indexer/node`
- React hooks in `@lsp-indexer/react`
- Next.js server actions + hooks in `@lsp-indexer/next`
- Test app playground page exercising the hooks
- Docs page updates

### Out of Scope / Non-Goals

- New indexer work or schema changes
- Subscription variants for mutual follows (can be added later)
- Computed Hasura views or custom SQL

## Technical Constraints

- Must use existing `universal_profile` query with nested `followed`/`followedBy` relationship filters
- Return type is `Profile[]` (or `ProfileResult<I>[]` with include narrowing), not `Follower[]`
- Must follow established patterns: 3-overload generics, TkDodo query keys, dual-package hooks

## Integration Points

- Hasura GraphQL — `universal_profile` table with `followed` and `followedBy` array relationship filters
- Existing profile parser and include var builders — reuse, don't duplicate

## Open Questions

- None — approach is clear from schema investigation
