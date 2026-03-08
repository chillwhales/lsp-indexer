---
phase: 08-first-vertical-slice
verified: 2026-03-08T16:10:00Z
status: passed
score: 18/18 must-haves verified
---

# Phase 8: First Vertical Slice (Universal Profiles) Verification Report

**Phase Goal:** Developer can use complete Universal Profile hooks in a real app — validating the full document → parser → service → hook architecture end-to-end.
**Verified:** 2026-03-08
**Status:** ✅ PASSED
**Re-verification:** No — initial verification (gap closure for v1.1 audit)

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Profile, ProfileFilter, ProfileSort, ProfileInclude types exist with clean camelCase fields | ✓ VERIFIED | `packages/types/src/profiles.ts` lines 10-31 (ProfileSchema), 37-55 (ProfileFilterSchema), 60-64 (ProfileSortSchema), 67-86 (ProfileIncludeSchema); all fields use camelCase: `profileImage`, `backgroundImage`, `followerCount`, `followingCount` |
| 2  | ProfileResult<I> narrows return type based on include parameter | ✓ VERIFIED | `packages/types/src/profiles.ts` lines 171-176 — uses `IncludeResult<Profile, 'address', ProfileIncludeFieldMap, I>` conditional type |
| 3  | Profile types are re-exported from @lsp-indexer/types via barrel export | ✓ VERIFIED | `packages/types/src/index.ts` line 13 — `export * from './profiles'` |
| 4  | GraphQL documents for profile queries exist with @include directives | ✓ VERIFIED | `packages/node/src/documents/profiles.ts` — `GetProfileDocument` (lines 4-67, 9 `@include` directives), `GetProfilesDocument` (lines 70-141, 9 `@include` directives) |
| 5  | parseProfile transforms Hasura snake_case to clean camelCase Profile type | ✓ VERIFIED | `packages/node/src/parsers/profiles.ts` lines 12-33 — maps `lsp3Profile.name.value` → `name`, `followedBy_aggregate.aggregate.count` → `followerCount`, `followed_aggregate.aggregate.count` → `followingCount` |
| 6  | parseProfile supports include parameter for conditional type narrowing via stripExcluded | ✓ VERIFIED | `packages/node/src/parsers/profiles.ts` lines 10-11 (overloads) + line 32 — calls `stripExcluded(profile, include, ['address'])` |
| 7  | fetchProfile (detail) service function exists with 3-overload generic pattern | ✓ VERIFIED | `packages/node/src/services/profiles.ts` lines 187-214 — 3 overloads: no-include → `Profile | null`, `<const I>` → `ProfileResult<I> | null`, catch-all → `PartialProfile | null` |
| 8  | fetchProfiles (list) service function exists with pagination support | ✓ VERIFIED | `packages/node/src/services/profiles.ts` lines 222-278 — accepts filter, sort, limit, offset; returns `FetchProfilesResult<P>` with profiles + totalCount |
| 9  | profileKeys cache key factory uses hierarchical TkDodo pattern | ✓ VERIFIED | `packages/node/src/keys/profiles.ts` lines 15-37 — `all`, `details()`, `detail(addr, include)`, `lists()`, `list(f,s,l,o,i)`, `infinites()`, `infinite(f,s,i)` |
| 10 | profileKeys is exported from @lsp-indexer/node | ✓ VERIFIED | `packages/node/src/index.ts` line 46 — `export * from './keys/profiles'` |
| 11 | useProfile, useProfiles, useInfiniteProfiles hooks exist in @lsp-indexer/react | ✓ VERIFIED | `packages/react/src/hooks/profiles/use-profile.ts` (5 lines), `use-profiles.ts` (5 lines), `use-infinite-profiles.ts` (7 lines); all exported via `packages/react/src/hooks/profiles/index.ts` |
| 12 | React hooks use factory pattern with fetchProfile/fetchProfiles service functions | ✓ VERIFIED | `packages/react/src/hooks/profiles/use-profile.ts` line 5 — `createUseProfile((params) => fetchProfile(getClientUrl(), params))`; same pattern for useProfiles and useInfiniteProfiles |
| 13 | Server actions with 'use server' directive exist for profiles | ✓ VERIFIED | `packages/next/src/actions/profiles.ts` line 1 — `'use server'`; exports `getProfile` (lines 22-37) and `getProfiles` (lines 40-69) with Zod validation |
| 14 | Next.js hooks exist routing through server actions | ✓ VERIFIED | `packages/next/src/hooks/profiles/use-profile.ts` line 7 — `createUseProfile(getProfile)` (routes through server action); `use-profiles.ts` and `use-infinite-profiles.ts` follow same pattern |
| 15 | Profiles playground page exists at apps/test with multiple tabs | ✓ VERIFIED | `apps/test/src/app/profiles/page.tsx` — 420 lines, imports from both `@lsp-indexer/react` and `@lsp-indexer/next` |
| 16 | All domain types use clean camelCase — not snake_case from Hasura | ✓ VERIFIED | `packages/types/src/profiles.ts` — `profileImage` (not `profile_image`), `backgroundImage` (not `background_image`), `followerCount` (not `follower_count`), `followingCount` (not `following_count`) |
| 17 | All address filters use _ilike for case-insensitive matching | ✓ VERIFIED | `packages/node/src/services/profiles.ts` line 206 — `address: { _ilike: params.address }` in fetchProfile; filter builders use `_ilike` with `escapeLike` throughout (lines 36, 47, 57) |
| 18 | Types barrel uses `export *` pattern for all domain files | ✓ VERIFIED | `packages/types/src/index.ts` — 16 lines, all `export *` from domain files including `./profiles` (line 13), `./common` (line 1), `./include-types` (line 8) |

**Score:** 18/18 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/types/src/profiles.ts` | Profile domain types + conditional include types | ✓ VERIFIED | 184 lines, 8 types exported (Profile, ProfileFilter, ProfileSort, ProfileSortField, ProfileInclude, UseProfileParams, UseProfilesParams, UseInfiniteProfilesParams), ProfileResult<I> conditional narrowing |
| `packages/types/src/index.ts` | Barrel export of all domain types | ✓ VERIFIED | 16 lines, `export *` from 16 domain files including profiles |
| `packages/node/src/documents/profiles.ts` | GraphQL documents with @include directives | ✓ VERIFIED | 209 lines, 3 documents (GetProfile, GetProfiles, ProfileSubscription), 9 @include directives each |
| `packages/node/src/parsers/profiles.ts` | Parser with camelCase transform + stripExcluded | ✓ VERIFIED | 44 lines, overloaded parseProfile + parseProfiles |
| `packages/node/src/services/profiles.ts` | Service functions + internal builders | ✓ VERIFIED | 278 lines, fetchProfile/fetchProfiles + buildProfileWhere/OrderBy/IncludeDirectives/IncludeVars |
| `packages/node/src/keys/profiles.ts` | Cache key factory with hierarchical keys | ✓ VERIFIED | 37 lines, 7 key methods (all, details, detail, lists, list, infinites, infinite) |
| `packages/react/src/hooks/profiles/` | 3 query hooks + subscription hook | ✓ VERIFIED | 5 files: use-profile.ts, use-profiles.ts, use-infinite-profiles.ts, use-profile-subscription.ts, index.ts |
| `packages/next/src/actions/profiles.ts` | Server actions with 'use server' | ✓ VERIFIED | 69 lines, 2 functions (getProfile, getProfiles), 'use server' directive, Zod input validation |
| `packages/next/src/hooks/profiles/` | Next.js hooks via server actions | ✓ VERIFIED | 5 files: use-profile.ts, use-profiles.ts, use-infinite-profiles.ts, use-profile-subscription.ts, index.ts |
| `apps/test/src/app/profiles/page.tsx` | Playground page with query tabs | ✓ VERIFIED | 420 lines, imports from both @lsp-indexer/react and @lsp-indexer/next |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| React hooks | Node services | `import { fetchProfile, getClientUrl } from '@lsp-indexer/node'` | ✓ WIRED | All 3 query hooks import fetch functions via factory pattern |
| Next.js hooks | Server actions | `import { getProfile } from '../../actions/profiles'` | ✓ WIRED | All 3 Next.js hooks route through server actions via factory |
| Server actions | Node services | `import { fetchProfile, fetchProfiles, getServerUrl } from '@lsp-indexer/node'` | ✓ WIRED | Both server actions delegate to Node service functions |
| Services | Documents | `import { GetProfileDocument, GetProfilesDocument } from '../documents/profiles'` | ✓ WIRED | Both service functions use correct documents via `execute()` |
| Services | Parsers | `import { parseProfile, parseProfiles } from '../parsers/profiles'` | ✓ WIRED | fetchProfile calls parseProfile, fetchProfiles calls parseProfiles |
| Parsers | stripExcluded | `import { stripExcluded } from './strip'` | ✓ WIRED | parseProfile calls stripExcluded when include provided |
| Playground page | React hooks | `import { useProfile, useProfiles, useInfiniteProfiles } from '@lsp-indexer/react'` | ✓ WIRED | All hooks imported and used in tab components |
| Playground page | Next.js hooks | `import { useProfile as useProfileNext, ... } from '@lsp-indexer/next'` | ✓ WIRED | All hooks imported with aliases for server mode |
| Node index | Keys export | `export * from './keys/profiles'` | ✓ WIRED | profileKeys exported from @lsp-indexer/node (line 46) |
| Types index | Profiles export | `export * from './profiles'` | ✓ WIRED | All profile types exported from @lsp-indexer/types (line 13) |

### Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| QUERY-01: useProfile, useProfiles, useInfiniteProfiles for Universal Profile data | ✓ SATISFIED | All 3 hooks exist in both @lsp-indexer/react and @lsp-indexer/next; full end-to-end architecture: types → documents → parser → service → hooks |
| DX-01: Developer can import all clean camelCase domain types from @lsp-indexer/types | ✓ SATISFIED | `packages/types/src/index.ts` exports all domain files via `export *`; profile types use camelCase (`profileImage`, `followerCount`, not snake_case) |
| DX-02: Developer can import query key factories for cache invalidation and prefetching | ✓ SATISFIED | `profileKeys` exported from `packages/node/src/keys/profiles.ts` with hierarchical TkDodo pattern; exported via `packages/node/src/index.ts` line 46 |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | No stub patterns, TODOs, FIXMEs, or placeholder content found | — | — |

### Human Verification Required

### 1. Playground Page Visual Correctness

**Test:** Navigate to `/profiles`, enter a LUKSO address, verify that profile results render with name, description, images, and follower counts
**Expected:** Profile data loads, camelCase fields display correctly, all tabs functional
**Why human:** Visual rendering + real API data cannot be verified programmatically

### 2. Infinite Scroll Pagination

**Test:** In the "Infinite Profiles" tab, search for profiles and click "Load more"
**Expected:** Additional pages load and append to the list
**Why human:** Requires real Hasura data + interactive scroll behavior

### 3. Server Mode vs React Mode Toggle

**Test:** Switch between "React" and "Server" mode toggle on the playground page
**Expected:** Both modes return identical data — server mode routes through Next.js server actions
**Why human:** Requires runtime execution to verify server action routing

---

_Verified: 2026-03-08_
_Verifier: Claude (gsd-executor)_
