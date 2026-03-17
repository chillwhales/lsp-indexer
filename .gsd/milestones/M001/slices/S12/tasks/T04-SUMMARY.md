---
id: T04
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
# T04: 08-first-vertical-slice 04

**# Phase 8 Plan 04: Test App Profiles Playground + E2E Validation Summary**

## What Happened

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
