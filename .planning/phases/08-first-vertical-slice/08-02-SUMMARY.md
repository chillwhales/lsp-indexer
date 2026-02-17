---
phase: 08-first-vertical-slice
plan: 02
subsystem: react-profile-plumbing
tags: [query-keys, parser, service, hasura, profiles, translation-boundary]
dependency-graph:
  requires: [08-01]
  provides: [profile-query-keys, profile-parser, profile-service-functions]
  affects: [08-03, 08-04, 09-01]
tech-stack:
  added: []
  patterns:
    [
      tkdodo-query-key-factory,
      hasura-translation-boundary,
      codegen-type-extraction,
      include-directive-mapping,
      flat-filter-to-hasura-where,
    ]
key-files:
  created:
    - packages/react/src/keys/profiles.ts
    - packages/react/src/parsers/profiles.ts
    - packages/react/src/services/profiles.ts
  modified: []
decisions:
  - id: D-0802-01
    decision: 'Used structural RawImageWithDimensions interface instead of codegen union for parseImage'
    rationale: 'Codegen types for profile_image and background_image have different __typename discriminators but identical structural fields. A structural interface avoids the type incompatibility while maintaining the same safety.'
  - id: D-0802-02
    decision: 'tokenOwned filter branches into owned_tokens (with tokenId) or owned_assets (without tokenId)'
    rationale: 'NFT/LSP8 tokens use owned_tokens table with token_id, while fungible/LSP7 use owned_assets with balance. The filter.tokenOwned.tokenId presence determines which relation to query.'
  - id: D-0802-03
    decision: 'Single condition filters skip _and wrapper for cleaner Hasura queries'
    rationale: 'When only one filter is active, wrapping in _and is unnecessary noise. Returns the condition directly.'
metrics:
  duration: '~8 minutes'
  completed: '2026-02-17'
---

# Phase 8 Plan 02: Query Key Factory + Parsers + Service Functions Summary

**One-liner:** TkDodo query key factory with separate list/infinite namespaces, codegen-typed parser with full @include/null handling, and service layer translating all 4 filter types + 3 sort fields + include mapping to Hasura variables.

## What Was Done

### Task 1: Create query key factory

- Created `packages/react/src/keys/profiles.ts` with `profileKeys` factory
- 7 key functions: `all`, `details()`, `detail(addr)`, `lists()`, `list(filter, sort)`, `infinites()`, `infinite(filter, sort)`
- **Separate namespaces for list vs infinite** — `['profiles', 'list', ...]` vs `['profiles', 'infinite', ...]` prevents cache corruption between useQuery and useInfiniteQuery
- Hierarchical invalidation: `profileKeys.all` invalidates everything, `profileKeys.lists()` invalidates all lists, etc.
- Comprehensive JSDoc with hierarchy diagram, cache invalidation examples, and prefetch examples

### Task 2: Create parser and service functions

**Part A — Parser (`parsers/profiles.ts`):**

- Extracts `RawProfile` type from codegen `GetProfileQuery['universal_profile'][number]` — type-safe against schema changes
- `parseProfile` transforms Hasura nested response to flat `Profile`:
  - `lsp3_profile.name.value` → `profile.name` (with `?. ?? null`)
  - `lsp3_profile.tags[].value` → `profile.tags[]` (filters nulls)
  - `lsp3_profile.links[]` → `profile.links[]` (with `title/url ?? ''`)
  - `lsp3_profile.avatar[]` → `profile.avatar[]` (width/height always `null`)
  - `lsp3_profile.profile_image[]` → `profile.profileImage[]` (with dimensions)
  - `lsp3_profile.background_image[]` → `profile.backgroundImage[]` (with dimensions)
  - `followed_by_aggregate.aggregate.count` → `profile.followerCount`
  - `followed_aggregate.aggregate.count` → `profile.followingCount`
- All @include-omitted fields use optional chaining (`?.`) and default to `[]` for arrays, `null` for scalars
- Verification parsing: `verification_method` present → `{ method, data }`, absent → `null`
- `parseProfiles` convenience wrapper for batch results

**Part B — Service (`services/profiles.ts`):**

- `buildProfileWhere(filter?)` — translates all 4 filter types:
  - `name` → `{ lsp3_profile: { name: { value: { _ilike: '%name%' } } } }`
  - `followedBy` → `{ followed_by: { follower_address: { _eq } } }` (correct: X is the follower)
  - `following` → `{ followed: { followed_address: { _eq } } }` (correct: X is the followed)
  - `tokenOwned` → `owned_tokens` (with tokenId) or `owned_assets` (with optional minBalance)
  - Multiple filters combine with `_and`
- `buildProfileOrderBy(sort?)` — translates all 3 sort fields:
  - `'name'` → `[{ lsp3_profile: { name: { value: direction } } }]`
  - `'followerCount'` → `[{ followed_by_aggregate: { count: direction } }]`
  - `'followingCount'` → `[{ followed_aggregate: { count: direction } }]`
- `buildIncludeVars(include?)` — maps include object to `@include` boolean variables:
  - Omitted → `{}` (GraphQL defaults all to `true`)
  - Provided → explicit `{ includeTags: true/false, ... }` with `false` defaults
- `fetchProfile(url, { address, include? })` → `Profile | null`
- `fetchProfiles(url, { filter?, sort?, limit?, offset?, include? })` → `{ profiles, totalCount }`
- Builder functions are **internal-only** — not exported
- **No Hasura types in public API** — only `Profile`, `ProfileFilter`, `ProfileSort`, `ProfileInclude` in signatures

## Task Commits

| Task | Name                                | Commit  | Key Files                                 |
| ---- | ----------------------------------- | ------- | ----------------------------------------- |
| 1    | Create query key factory            | 772234a | keys/profiles.ts                          |
| 2    | Create parser and service functions | 24136b9 | parsers/profiles.ts, services/profiles.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed \_\_typename incompatibility in parseImage**

- **Found during:** Task 2 (typecheck)
- **Issue:** Codegen generates different `__typename` discriminators for `lsp3_profile_image` and `lsp3_profile_background_image`. Using the `RawImage` type extracted from `profile_image` caused a type error when mapping `background_image`.
- **Fix:** Created a structural `RawImageWithDimensions` interface with the shared fields (url, width, height, verification_method, verification_data) instead of using the codegen discriminated union. Both image types structurally match this interface.
- **Files modified:** `parsers/profiles.ts`
- **Commit:** 24136b9

## Decisions Made

| ID        | Decision                                                               | Rationale                                                          |
| --------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------ |
| D-0802-01 | Structural interface for image parsing instead of codegen union        | Different \_\_typename discriminators, identical structural fields |
| D-0802-02 | tokenOwned branches into owned_tokens vs owned_assets based on tokenId | NFT/LSP8 uses token_id, fungible/LSP7 uses balance                 |
| D-0802-03 | Single condition filters skip \_and wrapper                            | Cleaner Hasura queries, no unnecessary nesting                     |

## Verification Results

| Check                                                                          | Result |
| ------------------------------------------------------------------------------ | ------ |
| `pnpm typecheck` passes in packages/react                                      | PASS   |
| `profileKeys.list()` and `profileKeys.infinite()` differ                       | PASS   |
| `parseProfile` handles all @include-omitted fields                             | PASS   |
| `fetchProfile` and `fetchProfiles` accept flat params                          | PASS   |
| No Hasura types leak into public exports                                       | PASS   |
| Service imports execute, documents, parser, types                              | PASS   |
| All 4 filter types translated (name, followedBy, following, tokenOwned)        | PASS   |
| All 3 sort fields translated (name, followerCount, followingCount)             | PASS   |
| Include mapping: omit = everything, provided = opt-in                          | PASS   |
| Follow relation naming correct (followed_by = followers, followed = following) | PASS   |
| Builder functions are internal-only (not exported)                             | PASS   |

## Next Phase Readiness

- **Blockers:** None
- **Ready for:** 08-03 (Hooks + entry point wiring + build validation)
- **Dependencies delivered:** Query key factory, parser, and service functions — all needed by hooks layer
- **Key exports available for 08-03:** `profileKeys` (keys), `parseProfile`/`parseProfiles` (parser), `fetchProfile`/`fetchProfiles`/`FetchProfilesResult` (service)

## Self-Check: PASSED
