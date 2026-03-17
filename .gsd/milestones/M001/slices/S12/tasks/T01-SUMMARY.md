---
id: T01
parent: S12
milestone: M001
provides: []
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration: 
verification_result: passed
completed_at: 
blocker_discovered: false
---
# T01: 08-first-vertical-slice 01

**# Phase 8 Plan 01: Profile Domain Types + GraphQL Documents + Codegen Summary**

## What Happened

# Phase 8 Plan 01: Profile Domain Types + GraphQL Documents + Codegen Summary

**One-liner:** Profile domain types with full JSDoc (10 exports), 2 GraphQL documents with @include directives for optional field selection, and Hasura-compatible local schema.graphql enabling codegen without live introspection.

## What Was Done

### Task 1: Create Profile domain types

- Created `packages/react/src/types/profiles.ts` with all 10 exported types
- `Profile` and `ProfileImage` interfaces match CONTEXT.md exactly (mixed null strategy, arrays default to `[]`)
- `ProfileFilter` with 4 filter types: name search, followedBy, following, tokenOwned (with nested address/tokenId/minBalance)
- `ProfileSort` with `ProfileSortField` ('name' | 'followerCount' | 'followingCount') and `SortDirection` ('asc' | 'desc')
- `ProfileInclude` for controlling nested data (tags, links, avatar, profileImage, backgroundImage)
- `UseProfileParams`, `UseProfilesParams`, `UseInfiniteProfilesParams` hook parameter types
- Comprehensive JSDoc on every interface, field, and type with `@example` blocks for hook params
- No Hasura types leak — all camelCase, all clean domain types

### Task 2: Create GraphQL documents and run codegen

- **Step 1 — Extended `schema.graphql`**: Added 230+ lines of Hasura-style type stubs:
  - `universal_profile` type with `lsp3_profile`, aggregate relations
  - All 7 LSP3 sub-types (`lsp3_profile_name`, `_description`, `_tag`, `_link`, `_asset`, `_image`, `_background_image`)
  - Aggregate types: `follow_aggregate`, `universal_profile_aggregate`
  - Input types: `universal_profile_bool_exp`, `follow_bool_exp`, `owned_asset_bool_exp`, `owned_token_bool_exp`, `lsp3_profile_bool_exp`, `lsp3_profile_name_bool_exp`, `String_comparison_exp`
  - Order types: `universal_profile_order_by`, `lsp3_profile_order_by`, `follow_aggregate_order_by`
  - `order_by` enum with all 6 Hasura ordering variants
- **Step 2 — Created `documents/profiles.ts`** with 2 GraphQL documents:
  - `GetProfileDocument` — single profile by address with `@include` directives on 5 nested fields
  - `GetProfilesDocument` — paginated list with `universal_profile_aggregate` for total count
  - Both use `Boolean! = true` defaults for include variables (omit = include everything)
- **Step 3 — Removed `_placeholder.ts`** — placeholder superseded by profile documents
- **Step 4 — Ran codegen** — regenerated `graphql.ts` (410 lines) and `gql.ts` with:
  - `GetProfileQuery` / `GetProfileQueryVariables` types
  - `GetProfilesQuery` / `GetProfilesQueryVariables` types
  - `GetProfileDocument` / `GetProfilesDocument` TypedDocumentString exports
  - Full Hasura input types: `Universal_Profile_Bool_Exp`, `Universal_Profile_Order_By`, `Follow_Bool_Exp`, `String_Comparison_Exp`, etc.

## Task Commits

| Task | Name                                     | Commit  | Key Files                                                         |
| ---- | ---------------------------------------- | ------- | ----------------------------------------------------------------- |
| 1    | Create Profile domain types              | d8a2da2 | packages/react/src/types/profiles.ts                              |
| 2    | Create GraphQL documents and run codegen | 67a279b | schema.graphql, documents/profiles.ts, graphql/graphql.ts, gql.ts |

## Deviations from Plan

None — plan executed exactly as written.

## Decisions Made

| ID        | Decision                                                                | Rationale                                               |
| --------- | ----------------------------------------------------------------------- | ------------------------------------------------------- |
| D-0801-01 | Extended local schema.graphql with full Hasura-style stubs              | Enables codegen without live Hasura endpoint (CI/build) |
| D-0801-02 | Removed \_placeholder.ts — profile documents replace it                 | Placeholder was Phase 7 bootstrap, no longer needed     |
| D-0801-03 | All image types share ProfileImage interface with nullable width/height | Consistent API — avatars simply have null dimensions    |

## Verification Results

| Check                                                    | Result |
| -------------------------------------------------------- | ------ |
| `pnpm typecheck` passes in packages/react                | PASS   |
| `pnpm codegen` succeeds without HASURA_GRAPHQL_ENDPOINT  | PASS   |
| `types/profiles.ts` exports all 10 types                 | PASS   |
| `documents/profiles.ts` exports GetProfileDocument       | PASS   |
| `documents/profiles.ts` exports GetProfilesDocument      | PASS   |
| `graphql.ts` contains GetProfileQuery types              | PASS   |
| `graphql.ts` contains GetProfilesQuery types             | PASS   |
| `graphql.ts` contains Universal_Profile_Bool_Exp         | PASS   |
| `graphql.ts` contains Universal_Profile_Order_By         | PASS   |
| @include directives on all 5 optional fields (both docs) | PASS   |
| Boolean! = true defaults on all include variables        | PASS   |
| Codegen is idempotent (re-running produces no changes)   | PASS   |
| No Hasura types in types/profiles.ts (pure camelCase)    | PASS   |
| Profile shape matches CONTEXT.md exactly                 | PASS   |

## Next Phase Readiness

- **Blockers:** None
- **Ready for:** 08-02 (Query key factory + parsers + service functions)
- **Dependencies delivered:** Profile domain types, GraphQL documents, Hasura codegen types — all needed by parsers and service layer
- **Key codegen types available:** `Universal_Profile_Bool_Exp`, `Universal_Profile_Order_By`, `Follow_Bool_Exp`, `String_Comparison_Exp`, `Follow_Aggregate_Order_By` — service layer will import these for type-safe Hasura query construction

## Self-Check: PASSED
