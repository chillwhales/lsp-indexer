# Requirements

This file is the explicit capability and coverage contract for the project.

## Validated

### R001 — Given two addresses A and B, return the set of profiles that both A and B follow. Computed server-side via Hasura nested `followedBy` relationship filters.
- Class: core-capability
- Status: validated
- Description: Given two addresses A and B, return the set of profiles that both A and B follow. Computed server-side via Hasura nested `followedBy` relationship filters.
- Why it matters: Core social graph feature — "what do we have in common?"
- Source: user
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: S01: service function + hooks compile. S02: playground page exercises useMutualFollows with include/sort controls, docs list fetchMutualFollows. Full 5-package build exits 0.
- Notes: S01 delivered compile-time contract. Service function uses _and where-clause with dual followedBy filters.

### R002 — Given two addresses A and B, return profiles that follow both A and B. Computed server-side via Hasura nested `followed` relationship filters.
- Class: core-capability
- Status: validated
- Description: Given two addresses A and B, return profiles that follow both A and B. Computed server-side via Hasura nested `followed` relationship filters.
- Why it matters: Core social graph feature — "who follows both of us?"
- Source: user
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: S01: service function + hooks compile. S02: playground page exercises useMutualFollowers with include/sort controls, docs list fetchMutualFollowers. Full 5-package build exits 0.
- Notes: S01 delivered compile-time contract. Service function uses _and where-clause with dual followed filters.

### R003 — Given user's address and a target profile, return profiles from user's following list that also follow the target. "People you follow who also follow this profile."
- Class: core-capability
- Status: validated
- Description: Given user's address and a target profile, return profiles from user's following list that also follow the target. "People you follow who also follow this profile."
- Why it matters: Social proof — shows familiar faces in a profile's follower list
- Source: user
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: S01: service function + hooks compile. S02: playground page exercises useFollowedByMyFollows with myAddress/targetAddress inputs, docs list fetchFollowedByMyFollows. Full 5-package build exits 0.
- Notes: S01 delivered compile-time contract. Uses myAddress + targetAddress params (plan said single address — corrected).

### R004 — React hooks calling Hasura directly via `getClientUrl()` for all three mutual follow queries
- Class: core-capability
- Status: validated
- Description: React hooks calling Hasura directly via `getClientUrl()` for all three mutual follow queries
- Why it matters: Consumer packages must expose the hooks for direct browser usage
- Source: inferred
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: S01: 6 React hooks exported. S02: playground page imports all 6 React hooks with HookMode toggle, docs list all 6 in domain table. Full build exits 0.
- Notes: S01 delivered 6 React hooks calling Hasura directly via getClientUrl().

### R005 — Next.js hooks routing through server actions + server action exports for all three mutual follow queries
- Class: core-capability
- Status: validated
- Description: Next.js hooks routing through server actions + server action exports for all three mutual follow queries
- Why it matters: Consumer packages must expose hooks for Next.js apps keeping endpoint hidden
- Source: inferred
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: pnpm --filter=@lsp-indexer/next build exits 0. 3 server actions with 'use server' directive + Zod validation in packages/next/src/actions/followers.ts. 6 Next.js hooks exported from packages/next/src/hooks/followers/index.ts. Playground page exercises all hooks.
- Notes: S01 delivered 3 server actions + 6 Next.js client hooks routing through server actions.

### R006 — Returned profiles support the existing ProfileInclude type narrowing — consumers can opt into specific profile fields
- Class: quality-attribute
- Status: validated
- Description: Returned profiles support the existing ProfileInclude type narrowing — consumers can opt into specific profile fields
- Why it matters: Consistency with existing hook API patterns (DX-04)
- Source: inferred
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: All service functions and factories use `<const I extends ProfileInclude>` with 3-overload signatures. TypeScript compilation across all 4 packages validates type narrowing works correctly.
- Notes: S01 delivered 3-overload ProfileInclude narrowing on all hooks and server actions.

### R007 — `useInfiniteMutualFollows`, `useInfiniteMutualFollowers`, `useInfiniteFollowedByMyFollows` with offset-based pagination
- Class: core-capability
- Status: validated
- Description: `useInfiniteMutualFollows`, `useInfiniteMutualFollowers`, `useInfiniteFollowedByMyFollows` with offset-based pagination
- Why it matters: Social lists can be long — infinite scroll is table stakes
- Source: inferred
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: useInfiniteMutualFollows, useInfiniteMutualFollowers, useInfiniteFollowedByMyFollows all present in react and next packages with offset-based pagination via createUseInfinite factory. Build passes. Playground page includes infinite scroll tabs.
- Notes: S01 delivered 3 infinite scroll variants with offset-based pagination via createUseInfinite factories.

### R008 — types, node, react, next all compile with zero errors after changes
- Class: quality-attribute
- Status: validated
- Description: types, node, react, next all compile with zero errors after changes
- Why it matters: Publish readiness
- Source: inferred
- Primary owning slice: M004/S02
- Supporting slices: none
- Validation: All 5 packages (types, node, react, next, docs) build with zero errors. Verified by pnpm build across all filters.
- Notes: S02 validated — full build chain exits 0 including docs app with MDX pages and playground page.

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | core-capability | validated | M004/S01 | none | S01: service function + hooks compile. S02: playground page exercises useMutualFollows with include/sort controls, docs list fetchMutualFollows. Full 5-package build exits 0. |
| R002 | core-capability | validated | M004/S01 | none | S01: service function + hooks compile. S02: playground page exercises useMutualFollowers with include/sort controls, docs list fetchMutualFollowers. Full 5-package build exits 0. |
| R003 | core-capability | validated | M004/S01 | none | S01: service function + hooks compile. S02: playground page exercises useFollowedByMyFollows with myAddress/targetAddress inputs, docs list fetchFollowedByMyFollows. Full 5-package build exits 0. |
| R004 | core-capability | validated | M004/S01 | none | S01: 6 React hooks exported. S02: playground page imports all 6 React hooks with HookMode toggle, docs list all 6 in domain table. Full build exits 0. |
| R005 | core-capability | validated | M004/S01 | none | pnpm --filter=@lsp-indexer/next build exits 0. 3 server actions with 'use server' directive + Zod validation in packages/next/src/actions/followers.ts. 6 Next.js hooks exported from packages/next/src/hooks/followers/index.ts. Playground page exercises all hooks. |
| R006 | quality-attribute | validated | M004/S01 | none | All service functions and factories use `<const I extends ProfileInclude>` with 3-overload signatures. TypeScript compilation across all 4 packages validates type narrowing works correctly. |
| R007 | core-capability | validated | M004/S01 | none | useInfiniteMutualFollows, useInfiniteMutualFollowers, useInfiniteFollowedByMyFollows all present in react and next packages with offset-based pagination via createUseInfinite factory. Build passes. Playground page includes infinite scroll tabs. |
| R008 | quality-attribute | validated | M004/S02 | none | All 5 packages (types, node, react, next, docs) build with zero errors. Verified by pnpm build across all filters. |

## Coverage Summary

- Active requirements: 0
- Mapped to slices: 0
- Validated: 8 (R001, R002, R003, R004, R005, R006, R007, R008)
- Unmapped active requirements: 0
