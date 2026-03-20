# Requirements

This file is the explicit capability and coverage contract for the project.

## Active

### R001 — Given two addresses A and B, return the set of profiles that both A and B follow. Computed server-side via Hasura nested `followedBy` relationship filters.
- Class: core-capability
- Status: active
- Description: Given two addresses A and B, return the set of profiles that both A and B follow. Computed server-side via Hasura nested `followedBy` relationship filters.
- Why it matters: Core social graph feature — "what do we have in common?"
- Source: user
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: fetchMutualFollows service function + useMutualFollows hooks compile and build across all 4 packages. Runtime validation pending S02.
- Notes: S01 delivered compile-time contract. Service function uses _and where-clause with dual followedBy filters.

### R002 — Given two addresses A and B, return profiles that follow both A and B. Computed server-side via Hasura nested `followed` relationship filters.
- Class: core-capability
- Status: active
- Description: Given two addresses A and B, return profiles that follow both A and B. Computed server-side via Hasura nested `followed` relationship filters.
- Why it matters: Core social graph feature — "who follows both of us?"
- Source: user
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: fetchMutualFollowers service function + useMutualFollowers hooks compile and build across all 4 packages. Runtime validation pending S02.
- Notes: S01 delivered compile-time contract. Service function uses _and where-clause with dual followed filters.

### R003 — Given user's address and a target profile, return profiles from user's following list that also follow the target. "People you follow who also follow this profile."
- Class: core-capability
- Status: active
- Description: Given user's address and a target profile, return profiles from user's following list that also follow the target. "People you follow who also follow this profile."
- Why it matters: Social proof — shows familiar faces in a profile's follower list
- Source: user
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: fetchFollowedByMyFollows service function + useFollowedByMyFollows hooks compile and build across all 4 packages. Runtime validation pending S02.
- Notes: S01 delivered compile-time contract. Uses myAddress + targetAddress params (plan said single address — corrected).

### R004 — React hooks calling Hasura directly via `getClientUrl()` for all three mutual follow queries
- Class: core-capability
- Status: active
- Description: React hooks calling Hasura directly via `getClientUrl()` for all three mutual follow queries
- Why it matters: Consumer packages must expose the hooks for direct browser usage
- Source: inferred
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: pnpm --filter=@lsp-indexer/react build exits 0. 6 concrete hooks exported from barrel.
- Notes: S01 delivered 6 React hooks calling Hasura directly via getClientUrl().

### R005 — Next.js hooks routing through server actions + server action exports for all three mutual follow queries
- Class: core-capability
- Status: active
- Description: Next.js hooks routing through server actions + server action exports for all three mutual follow queries
- Why it matters: Consumer packages must expose hooks for Next.js apps keeping endpoint hidden
- Source: inferred
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: pnpm --filter=@lsp-indexer/next build exits 0. 3 server actions with Zod validation, 6 hooks exported.
- Notes: S01 delivered 3 server actions + 6 Next.js client hooks routing through server actions.

### R006 — Returned profiles support the existing ProfileInclude type narrowing — consumers can opt into specific profile fields
- Class: quality-attribute
- Status: active
- Description: Returned profiles support the existing ProfileInclude type narrowing — consumers can opt into specific profile fields
- Why it matters: Consistency with existing hook API patterns (DX-04)
- Source: inferred
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: All factories use const I extends ProfileInclude generic with 3 overloads. Compiles clean.
- Notes: S01 delivered 3-overload ProfileInclude narrowing on all hooks and server actions.

### R007 — `useInfiniteMutualFollows`, `useInfiniteMutualFollowers`, `useInfiniteFollowedByMyFollows` with offset-based pagination
- Class: core-capability
- Status: active
- Description: `useInfiniteMutualFollows`, `useInfiniteMutualFollowers`, `useInfiniteFollowedByMyFollows` with offset-based pagination
- Why it matters: Social lists can be long — infinite scroll is table stakes
- Source: inferred
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: useInfiniteMutualFollows, useInfiniteMutualFollowers, useInfiniteFollowedByMyFollows all compile. Runtime pagination validation pending S02.
- Notes: S01 delivered 3 infinite scroll variants with offset-based pagination via createUseInfinite factories.

### R008 — types, node, react, next all compile with zero errors after changes
- Class: quality-attribute
- Status: active
- Description: types, node, react, next all compile with zero errors after changes
- Why it matters: Publish readiness
- Source: inferred
- Primary owning slice: M004/S02
- Supporting slices: none
- Validation: unmapped
- Notes: Build verification as final gate

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | core-capability | active | M004/S01 | none | fetchMutualFollows service function + useMutualFollows hooks compile and build across all 4 packages. Runtime validation pending S02. |
| R002 | core-capability | active | M004/S01 | none | fetchMutualFollowers service function + useMutualFollowers hooks compile and build across all 4 packages. Runtime validation pending S02. |
| R003 | core-capability | active | M004/S01 | none | fetchFollowedByMyFollows service function + useFollowedByMyFollows hooks compile and build across all 4 packages. Runtime validation pending S02. |
| R004 | core-capability | active | M004/S01 | none | pnpm --filter=@lsp-indexer/react build exits 0. 6 concrete hooks exported from barrel. |
| R005 | core-capability | active | M004/S01 | none | pnpm --filter=@lsp-indexer/next build exits 0. 3 server actions with Zod validation, 6 hooks exported. |
| R006 | quality-attribute | active | M004/S01 | none | All factories use const I extends ProfileInclude generic with 3 overloads. Compiles clean. |
| R007 | core-capability | active | M004/S01 | none | useInfiniteMutualFollows, useInfiniteMutualFollowers, useInfiniteFollowedByMyFollows all compile. Runtime pagination validation pending S02. |
| R008 | quality-attribute | active | M004/S02 | none | unmapped |

## Coverage Summary

- Active requirements: 8
- Mapped to slices: 8
- Validated: 0
- Unmapped active requirements: 0
