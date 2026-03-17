---
id: S12
parent: M001
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
# S12: First Vertical Slice

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

# Phase 8 Plan 03: Hooks + Entry Point Wiring + Build Validation Summary

**One-liner:** Three TanStack Query profile hooks (useProfile, useProfiles, useInfiniteProfiles) with domain-named returns, wired through client/server/types entry points, build-validated with ESM+CJS+DTS output.

## What Was Done

### Task 1: Create profile hooks

- Created `packages/react/src/hooks/profiles.ts` with three hooks:

**useProfile(params: UseProfileParams)**

- Wraps `useQuery` calling `fetchProfile` via service layer
- queryKey: `profileKeys.detail(address)` — enables granular cache invalidation
- enabled: `Boolean(params.address)` — prevents unnecessary fetches for empty address
- Returns: `{ profile: data ?? null, ...rest }` — domain-named key, null when missing

**useProfiles(params?: UseProfilesParams)**

- Wraps `useQuery` calling `fetchProfiles` via service layer
- queryKey: `profileKeys.list(filter, sort)` — cache varies by filter/sort combo
- Returns: `{ profiles: data?.profiles ?? [], totalCount: data?.totalCount ?? 0, ...rest }` — always safe to iterate

**useInfiniteProfiles(params?: UseInfiniteProfilesParams)**

- Wraps `useInfiniteQuery` with offset-based pagination
- queryKey: `profileKeys.infinite(filter, sort)` — **SEPARATE namespace** from list to prevent cache corruption
- `initialPageParam: 0`, `getNextPageParam`: returns `lastPageParam + pageSize` if full page, `undefined` otherwise
- Pages flattened via `data.pages.flatMap(page => page.profiles)` into single array
- Returns: `{ profiles, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }`
- Default `pageSize = 20`

All hooks include comprehensive JSDoc with usage examples.

### Task 2: Wire entry points and validate build

**Updated `index.ts` (client entry):**

- Added `useProfile`, `useProfiles`, `useInfiniteProfiles` hook exports
- Added `profileKeys` query key factory export

**Updated `server.ts` (server entry):**

- Added `fetchProfile`, `fetchProfiles` service function exports
- Added `FetchProfilesResult` type export

**Updated `types.ts` (types entry):**

- Added all profile domain type re-exports: `Profile`, `ProfileImage`, `ProfileFilter`, `ProfileSort`, `ProfileSortField`, `SortDirection`, `ProfileInclude`, `UseProfileParams`, `UseProfilesParams`, `UseInfiniteProfilesParams`

**Build validation:**

- `pnpm build` succeeds with zero errors
- `pnpm typecheck` passes
- All 3 entry points produce ESM (.js) + CJS (.cjs) + DTS (.d.ts + .d.cts)
- All expected exports verified present in .d.ts files

## Task Commits

| Task | Name                                 | Commit  | Key Files                     |
| ---- | ------------------------------------ | ------- | ----------------------------- |
| 1    | Create profile hooks                 | 55eb416 | hooks/profiles.ts             |
| 2    | Wire entry points and validate build | db9d963 | index.ts, server.ts, types.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Branch based on 08-02 feature branch instead of integration branch**

- **Found during:** Setup
- **Issue:** 08-01 and 08-02 feature branches haven't been merged into `refactor/indexer-v2-react` yet, so the prerequisite files (keys, parsers, services, types) didn't exist on the integration branch.
- **Fix:** Created the feature branch from `feat/react-profile-keys-parsers-services` (08-02 branch) which contains all prerequisite work.
- **Impact:** PR for 08-03 will need to target `refactor/indexer-v2-react` after 08-01 and 08-02 PRs are merged first.

**2. [Rule 1 - Bug] Fixed TS2783 duplicate property error in useInfiniteProfiles**

- **Found during:** Task 1 (typecheck)
- **Issue:** Initially destructured `{ data, ...rest }` from useInfiniteQuery then returned `{ hasNextPage: rest.hasNextPage, ...rest }`. TypeScript flagged this as TS2783 because `hasNextPage`, `fetchNextPage`, and `isFetchingNextPage` appear in both the explicit keys and the `...rest` spread.
- **Fix:** Changed to destructure all needed properties first: `{ data, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }`, then return them explicitly alongside `...rest`.
- **Files modified:** `hooks/profiles.ts`
- **Commit:** 55eb416

## Decisions Made

| ID        | Decision                                                 | Rationale                                                     |
| --------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| D-0803-01 | Destructure infinite query properties before rest spread | Avoids TS2783 duplicate properties while preserving API shape |

## Verification Results

| Check                                                              | Result |
| ------------------------------------------------------------------ | ------ |
| `pnpm build` succeeds in packages/react                            | PASS   |
| `pnpm typecheck` passes                                            | PASS   |
| useProfile returns `{ profile: Profile \| null, ...rest }`         | PASS   |
| useProfiles returns `{ profiles: Profile[], totalCount, ...rest }` | PASS   |
| useInfiniteProfiles returns `{ profiles, hasNextPage, ... }`       | PASS   |
| useInfiniteProfiles uses separate query key namespace              | PASS   |
| index.ts exports hooks + profileKeys                               | PASS   |
| server.ts exports fetchProfile + fetchProfiles                     | PASS   |
| types.ts exports all profile domain types                          | PASS   |
| dist/ contains index.js, server.js, types.js + .d.ts files         | PASS   |
| dist/index.d.ts has useProfile, useProfiles, useInfiniteProfiles   | PASS   |
| dist/types.d.ts has Profile, ProfileImage, etc.                    | PASS   |
| dist/server.d.ts has fetchProfile, fetchProfiles                   | PASS   |

## Next Phase Readiness

- **Blockers:** None
- **Ready for:** 08-04 (Test app profiles playground page + end-to-end verification)
- **Dependencies delivered:** All hooks importable from `@lsp-indexer/react`, services from `@lsp-indexer/react/server`, types from `@lsp-indexer/react/types`
- **Key exports for 08-04:** `useProfile`, `useProfiles`, `useInfiniteProfiles` (hooks), `profileKeys` (keys), all profile types
- **Note:** PRs for 08-01 and 08-02 need to be merged to `refactor/indexer-v2-react` before this branch's PR can be merged cleanly

## Self-Check: PASSED

# Phase 8 Plan 04: Test App Profiles Playground + E2E Validation Summary

**One-liner:** Profiles playground page with three tabs (single/list/infinite) exercising all hooks against live Hasura, plus DRY shared playground components (FilterFieldsRow, SortControls, ResultsList) ready for 10+ domain pages.

## What Was Done

### Task 1: Build profiles playground page (commit 91e9bcf)

- Installed 4 shadcn/ui components: `alert`, `collapsible`, `select`, `tabs`
- Created `/profiles` page with three tabs using shadcn Tabs:

**Tab 1 — Single Profile:**

- Address input + preset buttons (chill-labs, b00ste, feindura)
- `useProfile({ address })` — loading skeleton, error alert, full profile card
- Profile card: name, description, address, follower/following counts, tags (Badges), links, image counts
- Collapsible raw JSON toggle for debugging

**Tab 2 — Profile List:**

- Filter controls: name search, followed-by, following, token-owned address inputs
- Sort: field select (Name/Followers/Following) + direction (Asc/Desc) + limit input
- `useProfiles({ filter, sort, limit })` — skeleton loading, error, card grid
- Total count display from aggregate query

**Tab 3 — Infinite Scroll:**

- Same filter/sort controls as list (no limit — uses pageSize)
- `useInfiniteProfiles({ filter, sort, pageSize: 10 })` — Load More button
- hasNextPage/isFetchingNextPage state indicators
- "All profiles loaded" message when no more pages

- Updated nav.tsx: Profiles link set to `available: true`
- Created `force-dynamic` layout for profiles route

### Schema alignment fix (commit 7b39353)

- Updated GraphQL documents to use camelCase field names matching live Hasura
- Updated schema.graphql local fallback to match
- Regenerated codegen output (graphql.ts, gql.ts)
- Updated parsers to access camelCase fields
- Updated services to use `_ilike` for address comparisons
- Verified all three hooks return real data from live Hasura

### DRY refactor: shared playground components (commit 6ce5e52)

- Extracted `components/playground/` with 5 reusable modules:

**FilterFieldsRow** (filter-field.tsx):

- `FilterFieldConfig` interface: `{ key, label, placeholder, mono? }`
- `FilterField`: single labeled input with optional monospace font
- `FilterFieldsRow`: renders N filter fields from config array
- `useFilterFields(configs, debounceMs)`: manages raw + debounced values for all fields

**SortControls** (sort-controls.tsx):

- Sort field select, direction select, optional limit input
- `SortOption` interface: `{ value, label }`
- Config-driven — pass different `SortOption[]` per domain

**ResultsList<T>** (results-list.tsx):

- Generic typed component for list/infinite display
- Handles: loading skeletons, error alerts, empty states, item grid, raw JSON toggle
- Optional `infinite` prop adds Load More button + "all loaded" message
- `ResultsHeader`: count display + loading indicator
- `CardSkeleton`: generic loading placeholder

**ErrorAlert + RawJsonToggle** (shared.tsx):

- Reusable error display (destructive Alert)
- Collapsible raw JSON viewer with Code2 icon

**useDebounce** (hooks/use-debounce.ts):

- Generic debounce hook: `useDebounce<T>(value, delay)`
- Used by `useFilterFields` for 300ms input debounce

- Rewrote profiles/page.tsx to use shared components
- Domain-specific parts reduced to: config arrays + `buildProfileFilter()` + `ProfileCardCompact`
- Each future domain playground only needs to define these three things

### Fix: name sort nulls_last (commit 6ce5e52)

- Fixed `buildProfileOrderBy` in services/profiles.ts
- Name sort now uses `asc_nulls_last` / `desc_nulls_last`
- Profiles without lsp3Profile names appear last in sort results

## Task Commits

| Task | Name                                      | Commit  | Key Files                                       |
| ---- | ----------------------------------------- | ------- | ----------------------------------------------- |
| 1a   | Build profiles playground page            | 91e9bcf | profiles/page.tsx, nav.tsx, 4 shadcn components |
| 1b   | Align schema with live Hasura (camelCase) | 7b39353 | documents, parsers, services, schema.graphql    |
| 1c   | DRY refactor + nulls_last fix             | 6ce5e52 | playground/\*, use-debounce.ts, services        |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Hasura field names are camelCase, not snake_case**

- **Found during:** Task 1 (runtime testing against live Hasura)
- **Issue:** GraphQL documents used snake_case (`lsp3_profile`, `followed_by`, `profile_image`) but live Hasura returns camelCase (`lsp3Profile`, `followedBy`, `profileImage`). All queries returned null/empty data.
- **Fix:** Updated all documents, schema.graphql, codegen output, parsers, and services to use camelCase field names.
- **Files modified:** documents/profiles.ts, schema.graphql, graphql/graphql.ts, graphql/gql.ts, parsers/profiles.ts, services/profiles.ts
- **Commit:** 7b39353

**2. [Rule 1 - Bug] Address comparisons used \_eq (case-sensitive)**

- **Found during:** Task 1 (runtime testing)
- **Issue:** Ethereum addresses can be mixed-case due to EIP-55 checksumming. Using `_eq` for address comparisons failed when case didn't match exactly.
- **Fix:** Changed all address/tokenId comparisons to `_ilike` in service builders.
- **Files modified:** services/profiles.ts
- **Commit:** 7b39353

**3. [Rule 1 - Bug] Name sort placed nulls first**

- **Found during:** DRY refactor (testing sort)
- **Issue:** Profiles without names (null lsp3Profile) appeared at top of sorted results.
- **Fix:** Changed name sort to use `asc_nulls_last` / `desc_nulls_last`.
- **Files modified:** services/profiles.ts
- **Commit:** 6ce5e52

**4. [Rule 2 - Missing Critical] No input debounce on filter fields**

- **Found during:** DRY refactor
- **Issue:** Filter inputs triggered GraphQL queries on every keystroke, causing excessive API calls.
- **Fix:** Created `useDebounce` hook with 300ms delay, integrated into `useFilterFields`.
- **Files modified:** hooks/use-debounce.ts, components/playground/filter-field.tsx
- **Commit:** 6ce5e52

**5. [Rule 2 - Missing Critical] Playground code not DRY for future domains**

- **Found during:** Planning for Phase 9 (10+ domain pages)
- **Issue:** Original profiles page was ~750 lines with filter/sort/results logic that would be copy-pasted for every domain.
- **Fix:** Extracted shared components to `components/playground/`. New domains now only need ~100 lines of config + domain card.
- **Files modified:** New playground/ directory, rewritten profiles/page.tsx
- **Commit:** 6ce5e52

## Decisions Made

| ID        | Decision                                              | Rationale                                                               |
| --------- | ----------------------------------------------------- | ----------------------------------------------------------------------- |
| D-0804-01 | camelCase GraphQL fields matching live Hasura         | Live schema uses camelCase, local schema must match                     |
| D-0804-02 | \_ilike for all address comparisons                   | Case-insensitive matching prevents EIP-55 case mismatch bugs            |
| D-0804-03 | asc_nulls_last / desc_nulls_last for name sort        | Unnamed profiles sort last, not first                                   |
| D-0804-04 | Shared playground components in components/playground | DRY — 10+ domain pages share FilterFieldsRow, SortControls, ResultsList |
| D-0804-05 | 300ms debounce on filter inputs                       | Standard UX, prevents excessive GraphQL queries                         |

## Verification Results

| Check                                                             | Result |
| ----------------------------------------------------------------- | ------ |
| `pnpm build` succeeds in packages/react                           | PASS   |
| `pnpm build` succeeds in apps/test (Next.js build)                | PASS   |
| /profiles page file exists                                        | PASS   |
| Nav shows Profiles as available (not "Soon")                      | PASS   |
| 4 shadcn components installed (alert, collapsible, select, tabs)  | PASS   |
| Three tabs present: Single Profile, Profile List, Infinite Scroll | PASS   |
| useProfile hook exercised in Single Profile tab                   | PASS   |
| useProfiles hook exercised in Profile List tab                    | PASS   |
| useInfiniteProfiles hook exercised in Infinite Scroll tab         | PASS   |
| Preset address buttons present (chill-labs, b00ste, feindura)     | PASS   |
| Loading skeletons present                                         | PASS   |
| Error alerts present                                              | PASS   |
| Raw JSON toggle present                                           | PASS   |
| Shared playground components extracted                            | PASS   |
| 300ms debounce on filter inputs                                   | PASS   |
| \_ilike used for all address comparisons                          | PASS   |
| nulls_last used for name sort                                     | PASS   |

## Next Phase Readiness

- **Blockers:** None
- **Ready for:** Phase 9 (Remaining Query Domains & Pagination)
- **Dependencies delivered:** Profiles playground validates entire vertical slice works E2E; shared playground components ready for reuse across 10+ domain pages
- **Shared components for Phase 9:** `FilterFieldsRow`, `SortControls`, `ResultsList<T>`, `useFilterFields`, `ErrorAlert`, `RawJsonToggle`, `CardSkeleton`, `useDebounce`
- **Pattern for new domains:** Define `FilterFieldConfig[]`, `SortOption[]`, `buildDomainFilter()`, `DomainCard` component → plug into shared components
- **PR:** #183 — needs push with latest commits

## Self-Check: PASSED
