# Phase 8: First Vertical Slice (Universal Profiles) - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Developer can use complete Universal Profile hooks in a real app — validating the full document → parser → service → hook architecture end-to-end before replicating across 10 more domains. This includes standard query hooks, infinite scroll pagination (pulled from Phase 9 to validate the pattern early), and the test app profiles playground page.

**Requirements:** QUERY-01, DX-01, DX-02, plus PAGE-01 (partially — `useInfiniteProfiles` only, pulled forward from Phase 9 to validate the infinite scroll pattern as part of the vertical slice).

**Scope change from ROADMAP:** `useProfileSearch` dropped — search-by-name is a filter on `useProfiles`, not a separate hook. `useInfiniteProfiles` added to validate the pagination pattern before Phase 9 replicates it across 10 domains.

</domain>

<decisions>
## Implementation Decisions

### Hook API — Parameter style

- Simple flat params (not Hasura-style `where`/`order_by`) — the library hides Hasura completely
- Comprehensive filtering and sorting built in from day 1 — don't ship hooks that need constant updating
- Filters include ALL of these for profiles, even ones requiring complex Hasura joins:
  - Filter by name (`_ilike` search)
  - Filter by "profiles that address X follows" (join through Follow table)
  - Filter by "profiles that follow address X" (reverse join)
  - Filter by tokens owned (amount, token ID — join through OwnedAsset/DigitalAsset)
  - Sort by name, follower count, following count
- The service layer translates simple params to complex Hasura queries — consumers never see Hasura

### Hook API — Include/field selection

- `include` object pattern for controlling nested data:
  ```ts
  useProfile({ address, include: { tags: true, profileImage: false, links: false } });
  ```
- If `include` is omitted entirely, return everything (all nested data included by default)
- Maps to `@include(if: $var)` directives in GraphQL documents under the hood

### Hook API — Hook surface

- `useProfile({ address })` — single profile by address
- `useProfiles({ filter, sort, limit, offset })` — list with comprehensive filtering/sorting
- `useInfiniteProfiles({ filter, sort })` — infinite scroll pagination (TanStack `useInfiniteQuery`)
- **No `useProfileSearch`** — searching by name is just `useProfiles({ filter: { name: "alice" } })`
- This three-hook pattern (`use[Entity]`, `use[Entities]`, `useInfinite[Entities]`) becomes the template for all 11 domains

### Hook API — Return shape

- Each hook returns the full TanStack Query result but overrides `data` to domain-named key:
  - `useProfile` → `{ profile: Profile | null, isLoading, error, ... }`
  - `useProfiles` → `{ profiles: Profile[], totalCount: number, isLoading, error, ... }`
  - `useInfiniteProfiles` → `{ profiles: Profile[], hasNextPage, fetchNextPage, isLoading, error, ... }`
- All other TanStack Query properties (refetch, isFetching, status, etc.) pass through unchanged

### Profile data shape — Type structure

- Flat type — all fields at top level, no nested `metadata` wrapper
- Follow LSP3 standard JSON spec naming from the LIP
- Include follower and following counts at top level
- Full type:

  ```ts
  interface Profile {
    address: string;
    name: string | null;
    description: string | null;
    tags: string[];
    links: Array<{ title: string; url: string }>;
    avatar: Array<ProfileImage>;
    profileImage: Array<ProfileImage>;
    backgroundImage: Array<ProfileImage>;
    followerCount: number;
    followingCount: number;
  }

  interface ProfileImage {
    url: string;
    width: number | null;
    height: number | null;
    verification: {
      method: string;
      data: string;
    } | null;
  }
  ```

### Profile data shape — Null handling

- Mixed strategy: strings stay `| null`, arrays default to `[]`
- `name: string | null` — missing name is semantically different from empty string
- `tags: string[]` — always safe to `.map()`, empty means "none"
- Same principle for `links`, `avatar`, `profileImage`, `backgroundImage` — always `[]`, never `null`

### Profile data shape — Sub-entities

- Simplified values following LSP3 standard — no Hasura record IDs leak through
- `tags` → `string[]` (not `Array<{ id, value }>`)
- `links` → `Array<{ title: string; url: string }>` (not `Array<{ id, title, url }>`)
- Images → full objects with verification data: `Array<{ url, width, height, verification }>` (not just URL strings)

### Profile data shape — Image handling

- Full image objects, NOT convenience URL strings
- Each image has `url`, `width`, `height`, and `verification` (method + data)
- Verification object is `| null` when no verification data exists
- Applies to all three image arrays: `avatar`, `profileImage`, `backgroundImage`

### Test app profiles page

- Feature playground — exercises all profile hooks with real inputs
- Address input: text input field + preset buttons for known LUKSO Universal Profiles
- Data display: shadcn Card with visual rendering + collapsible raw JSON below for debugging
- Loading states: shadcn `Skeleton` components
- Error states: shadcn `Alert` with destructive variant
- Page demonstrates `useProfile`, `useProfiles`, and `useInfiniteProfiles` with live Hasura data

### Claude's Discretion

- Exact filter/sort param type naming and structure (as long as it's flat, not Hasura-style)
- Query key factory structure and naming convention (DX-02)
- Parser implementation details (camelCase conversion, null coalescing internals)
- Service function signatures and internal structure
- How `include` defaults map to `@include` directives in GraphQL documents
- Test app layout, spacing, component composition
- Preset LUKSO addresses for test app buttons
- How `useInfiniteProfiles` maps offset-based pagination to TanStack's cursor-based `useInfiniteQuery` API

</decisions>

<specifics>
## Specific Ideas

- LSP3 standard JSON spec (https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-3-Profile-Metadata.md) is the reference for Profile type field names and structure
- Image verification follows the LSP3 pattern: `{ method: "keccak256(bytes)", data: "0x..." }` — this is important for LUKSO apps that verify image integrity
- The three-hook pattern (`use[Entity]`, `use[Entities]`, `useInfinite[Entities]`) established here becomes the exact template Phase 9 replicates across 10 more domains
- Comprehensive filtering from day 1 — the hooks should feel "complete" so downstream apps don't need to work around missing filter options
- Hook return shape uses domain-named keys (`profile`, `profiles`) not generic `data` — this improves DX when destructuring multiple hooks in one component

</specifics>

<deferred>
## Deferred Ideas

- `useInfinite*` for remaining 10 domains — Phase 9 (PAGE-01, partially satisfied here for profiles only)
- The `useProfileSearch` hook name is dropped — search is a filter on `useProfiles`

</deferred>

---

_Phase: 08-first-vertical-slice_
_Context gathered: 2026-02-17_
