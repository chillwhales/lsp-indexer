# Requirements

## Active

### R001 — `useMutualFollows` returns profiles both addresses follow
- Class: core-capability
- Status: active
- Description: Given two addresses A and B, return the set of profiles that both A and B follow. Computed server-side via Hasura nested `followedBy` relationship filters.
- Why it matters: Core social graph feature — "what do we have in common?"
- Source: user
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: unmapped
- Notes: Query uses `universal_profile` where `followedBy` contains both A and B as `follower_address`

### R002 — `useMutualFollowers` returns profiles that follow both addresses
- Class: core-capability
- Status: active
- Description: Given two addresses A and B, return profiles that follow both A and B. Computed server-side via Hasura nested `followed` relationship filters.
- Why it matters: Core social graph feature — "who follows both of us?"
- Source: user
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: unmapped
- Notes: Query uses `universal_profile` where `followed` contains both A and B as `followed_address`

### R003 — `useFollowedByMyFollows` returns profiles user follows who also follow target
- Class: core-capability
- Status: active
- Description: Given user's address and a target profile, return profiles from user's following list that also follow the target. "People you follow who also follow this profile."
- Why it matters: Social proof — shows familiar faces in a profile's follower list
- Source: user
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: unmapped
- Notes: Query uses `universal_profile` where `followedBy` has user AND `followed` has target

### R004 — All three hooks available in `@lsp-indexer/react`
- Class: core-capability
- Status: active
- Description: React hooks calling Hasura directly via `getClientUrl()` for all three mutual follow queries
- Why it matters: Consumer packages must expose the hooks for direct browser usage
- Source: inferred
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: unmapped
- Notes: Follows established dual-package hook pattern

### R005 — All three hooks available in `@lsp-indexer/next`
- Class: core-capability
- Status: active
- Description: Next.js hooks routing through server actions + server action exports for all three mutual follow queries
- Why it matters: Consumer packages must expose hooks for Next.js apps keeping endpoint hidden
- Source: inferred
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: unmapped
- Notes: Follows established dual-package hook pattern

### R006 — Include-based type narrowing on returned profiles
- Class: quality-attribute
- Status: active
- Description: Returned profiles support the existing ProfileInclude type narrowing — consumers can opt into specific profile fields
- Why it matters: Consistency with existing hook API patterns (DX-04)
- Source: inferred
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: unmapped
- Notes: Uses existing ProfileInclude, ProfileResult<I> machinery

### R007 — Infinite scroll variants for all three hooks
- Class: core-capability
- Status: active
- Description: `useInfiniteMutualFollows`, `useInfiniteMutualFollowers`, `useInfiniteFollowedByMyFollows` with offset-based pagination
- Why it matters: Social lists can be long — infinite scroll is table stakes
- Source: inferred
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: unmapped
- Notes: Follows established useInfinite* pattern with separate query key namespace

### R008 — All 4 packages build and typecheck clean
- Class: quality-attribute
- Status: active
- Description: types, node, react, next all compile with zero errors after changes
- Why it matters: Publish readiness
- Source: inferred
- Primary owning slice: M004/S02
- Supporting slices: none
- Validation: unmapped
- Notes: Build verification as final gate

## Validated

(No validated requirements yet — M004 not started)

## Deferred

(None)

## Out of Scope

(None)

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | core-capability | active | M004/S01 | none | unmapped |
| R002 | core-capability | active | M004/S01 | none | unmapped |
| R003 | core-capability | active | M004/S01 | none | unmapped |
| R004 | core-capability | active | M004/S01 | none | unmapped |
| R005 | core-capability | active | M004/S01 | none | unmapped |
| R006 | quality-attribute | active | M004/S01 | none | unmapped |
| R007 | core-capability | active | M004/S01 | none | unmapped |
| R008 | quality-attribute | active | M004/S02 | none | unmapped |

## Coverage Summary

- Active requirements: 8
- Mapped to slices: 8
- Validated: 0
- Unmapped active requirements: 0
