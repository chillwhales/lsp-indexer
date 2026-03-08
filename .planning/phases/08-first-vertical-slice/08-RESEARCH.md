# Phase 8: First Vertical Slice (Universal Profiles) - Research

**Researched:** 2026-02-17
**Domain:** React hooks wrapping Hasura GraphQL (TanStack Query + graphql-codegen + Hasura)
**Confidence:** HIGH

## Summary

Phase 8 builds the first complete vertical slice: GraphQL documents → parsers → service functions → TanStack Query hooks → test app playground, all for the Universal Profiles domain. This research covers six key technical areas: (1) Hasura GraphQL query patterns for complex joins and aggregates specific to this data model, (2) TanStack Query's useInfiniteQuery with offset-based pagination, (3) GraphQL @include directive patterns for the `include` API, (4) query key factory best practices, (5) recommended file/module structure for the document→parser→service→hook pipeline, and (6) codegen implications.

The data model is well-understood from the TypeORM schema. Hasura auto-generates `universal_profile`, `follower`, `follow`, `owned_asset`, `lsp3_profile`, etc. table names from PascalCase entity names. The complex filters (profiles-that-X-follows, profiles-owning-tokens) map cleanly to Hasura's nested relation filtering. Aggregate counts (followerCount, followingCount) require `_aggregate { aggregate { count } }` on the `followed`/`followedBy` relations.

**Primary recommendation:** Build the pipeline in strict layer order — documents first (with @include directives), then parsers, then services, then hooks, then test app page. Each layer should be independently testable. The service layer is the key translation point where flat params become Hasura `where`/`order_by` objects.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

1. **Hook API — Parameter style:** Simple flat params (not Hasura-style `where`/`order_by`) — the library hides Hasura completely. Comprehensive filtering and sorting built in from day 1. Filters include ALL of these for profiles: filter by name (`_ilike` search), filter by "profiles that address X follows" (join through Follow table), filter by "profiles that follow address X" (reverse join), filter by tokens owned (amount, token ID — join through OwnedAsset/DigitalAsset), sort by name, follower count, following count.
2. **Hook API — Include/field selection:** `include` object pattern for controlling nested data. If `include` is omitted entirely, return everything (all nested data included by default). Maps to `@include(if: $var)` directives in GraphQL documents under the hood.
3. **Hook API — Hook surface:** `useProfile({ address })`, `useProfiles({ filter, sort, limit, offset })`, `useInfiniteProfiles({ filter, sort })`. No `useProfileSearch`.
4. **Hook API — Return shape:** Each hook returns the full TanStack Query result but overrides `data` to domain-named key: `useProfile` → `{ profile, isLoading, error, ... }`, `useProfiles` → `{ profiles, totalCount, isLoading, error, ... }`, `useInfiniteProfiles` → `{ profiles, hasNextPage, fetchNextPage, isLoading, error, ... }`.
5. **Profile data shape:** Interface with mixed null strategy (strings `| null`, arrays default to `[]`), simplified sub-entities following LSP3 standard.
6. **Test app profiles page:** Feature playground with real inputs, address input with preset buttons, shadcn Card with visual rendering + collapsible raw JSON, shadcn Skeleton loading, shadcn Alert error states, shadcn/ui components (new-york style, Tailwind v4).

### Claude's Discretion

- Exact filter/sort param type naming and structure (flat, not Hasura-style)
- Query key factory structure and naming convention (DX-02)
- Parser implementation details
- Service function signatures and internal structure
- How `include` defaults map to `@include` directives in GraphQL documents
- Test app layout, spacing, component composition
- Preset LUKSO addresses for test app buttons
- How `useInfiniteProfiles` maps offset-based pagination to TanStack's cursor-based API

### Deferred Ideas (OUT OF SCOPE)

- `useInfinite*` for remaining 10 domains — Phase 9
- `useProfileSearch` dropped — search is a filter on `useProfiles`
  </user_constraints>

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library                        | Version          | Purpose                                           | Why Standard                                                |
| ------------------------------ | ---------------- | ------------------------------------------------- | ----------------------------------------------------------- |
| @tanstack/react-query          | ^5.0.0           | Query/cache hooks (useQuery, useInfiniteQuery)    | Already a peerDep; TkDodo patterns are industry standard    |
| @graphql-codegen/client-preset | ^5.2.2           | Generate TypedDocumentString from .ts documents   | Already configured in codegen.ts; string-based documentMode |
| TypedDocumentString            | (codegen output) | Type-safe query documents with variable inference | Already in use; execute() is typed against it               |

### Supporting

| Library      | Version           | Purpose                | When to Use                                                               |
| ------------ | ----------------- | ---------------------- | ------------------------------------------------------------------------- |
| shadcn/ui    | latest (new-york) | Test app UI components | All test app UI; already installed (card, input, skeleton, button, badge) |
| lucide-react | ^0.574.0          | Icons for test app     | Already in test app deps                                                  |

### Already Available (No New Deps)

- `execute()` — typed fetch wrapper in `packages/react/src/client/execute.ts`
- `IndexerError` — structured error class with categories
- `getClientUrl()` / `getServerUrl()` — env-based URL resolution
- `QueryClientProvider` — already in test app providers.tsx
- All shadcn components except `alert` and `collapsible` (need to add these two)

### New shadcn Components Needed

| Component     | Purpose                                                                             |
| ------------- | ----------------------------------------------------------------------------------- |
| `alert`       | Error state display with destructive variant                                        |
| `collapsible` | Toggle raw JSON display                                                             |
| `tabs`        | Switch between single profile / list / infinite views (optional, layout discretion) |
| `select`      | Sort/filter dropdowns in test app                                                   |

**Installation (test app only):**

```bash
# In apps/test directory
npx shadcn@latest add alert collapsible select tabs
```

## Architecture Patterns

### Recommended Project Structure

```
packages/react/src/
├── client/                     # execute.ts, env.ts (existing)
├── documents/
│   └── profiles.ts             # GraphQL document strings with @include directives
├── errors/                     # IndexerError (existing)
├── graphql/                    # codegen output (existing)
├── hooks/
│   └── profiles.ts             # useProfile, useProfiles, useInfiniteProfiles
├── parsers/
│   └── profiles.ts             # parseProfile, parseProfiles (Hasura → clean types)
├── services/
│   └── profiles.ts             # fetchProfile, fetchProfiles, fetchInfiniteProfiles
├── keys/
│   └── profiles.ts             # profileKeys query key factory
├── types/
│   └── profiles.ts             # Profile, ProfileImage, ProfileFilter, ProfileSort
├── index.ts                    # client entry (add hook + key exports)
├── server.ts                   # server entry (add service exports)
└── types.ts                    # pure type re-exports (add Profile types)
```

### Pattern 1: Document → Parser → Service → Hook Pipeline

**What:** Each domain follows a strict 4-layer pipeline. The document defines the GraphQL query. The parser transforms Hasura's nested snake_case response to a clean camelCase type. The service combines execute + parse and handles param-to-variable translation. The hook wraps the service in TanStack Query.

**When to use:** Every domain hook follows this exact pattern.

**Flow:**

```
Hook (useProfile)
  → creates TanStack Query options (queryKey, queryFn, enabled)
    → queryFn calls Service (fetchProfile)
      → Service translates flat params to GraphQL variables
      → Service calls execute(url, document, variables)
      → Service pipes raw result through Parser (parseProfile)
        → Parser transforms Hasura response to clean Profile type
  → Hook reshapes TanStack result (data.profile instead of data)
```

### Pattern 2: Service Layer as Hasura Translation Boundary

**What:** The service layer is the ONLY place that knows about Hasura's where/order_by/limit/offset syntax. Hooks and consumers never see Hasura types.

**Example:**

```typescript
// Service translates flat filter → Hasura where clause
function buildProfileWhere(filter?: ProfileFilter): Universal_Profile_Bool_Exp {
  const conditions: Universal_Profile_Bool_Exp[] = [];

  if (filter?.name) {
    conditions.push({
      lsp3_profile: { name: { value: { _ilike: `%${filter.name}%` } } },
    });
  }

  if (filter?.followedBy) {
    // "Profiles that address X follows" = profiles where X appears as followerAddress
    conditions.push({
      followed_by: { follower_address: { _eq: filter.followedBy } },
    });
  }

  if (filter?.following) {
    // "Profiles that follow address X" = profiles where X appears as followedAddress
    conditions.push({
      followed: { followed_address: { _eq: filter.following } },
    });
  }

  return conditions.length > 0 ? { _and: conditions } : {};
}
```

### Pattern 3: Hook Return Shape Override

**What:** Each hook wraps TanStack Query result and renames `data` to a domain-specific key while spreading the rest of the query result.

**Example:**

```typescript
export function useProfile(params: UseProfileParams) {
  const url = getClientUrl();
  const result = useQuery({
    queryKey: profileKeys.detail(params.address),
    queryFn: () => fetchProfile(url, params),
    enabled: Boolean(params.address),
  });

  // Destructure data, spread rest (isLoading, error, etc.)
  const { data, ...rest } = result;
  return { profile: data ?? null, ...rest };
}
```

### Pattern 4: @include Directives for Optional Nested Data

**What:** GraphQL documents use `@include(if: $var)` directives on nested fields. The service layer maps the user's `include` object (or its absence — meaning "include all") to boolean variables.

**Critical insight:** When `include` is undefined/omitted, ALL include variables default to `true`. When `include` is provided, only specified fields are `true`.

**Example document:**

```typescript
const GetProfileDocument = graphql(`
  query GetProfile(
    $address: String!
    $includeTags: Boolean! = true
    $includeLinks: Boolean! = true
    $includeAvatar: Boolean! = true
    $includeProfileImage: Boolean! = true
    $includeBackgroundImage: Boolean! = true
  ) {
    universal_profile(where: { address: { _eq: $address } }) {
      address
      lsp3_profile {
        name { value }
        description { value }
        tags @include(if: $includeTags) { value }
        links @include(if: $includeLinks) { title url }
        avatar @include(if: $includeAvatar) { url file_type ... }
        profile_image @include(if: $includeProfileImage) { url width height ... }
        background_image @include(if: $includeBackgroundImage) { url width height ... }
      }
      followed_by_aggregate { aggregate { count } }
      followed_aggregate { aggregate { count } }
    }
  }
`);
```

**Service maps include → variables:**

```typescript
function buildIncludeVars(include?: ProfileInclude): Record<string, boolean> {
  if (!include) {
    // Omitted = include everything (all default to true via GraphQL defaults)
    return {};
  }
  return {
    includeTags: include.tags ?? false,
    includeLinks: include.links ?? false,
    includeAvatar: include.avatar ?? false,
    includeProfileImage: include.profileImage ?? false,
    includeBackgroundImage: include.backgroundImage ?? false,
  };
}
```

### Anti-Patterns to Avoid

- **Exposing Hasura types to consumers:** Never let `where`, `order_by`, `_eq`, `_ilike` appear in the public API
- **Building separate queries for each filter combination:** Use a single document with variables, not string concatenation
- **Separate useQuery for follower/following counts:** Include aggregates in the same query, not separate requests
- **useInfiniteQuery sharing the same queryKey prefix as useQuery:** TanStack Query requires different keys for useQuery vs useInfiniteQuery (they have different data shapes)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem                    | Don't Build             | Use Instead                                              | Why                                             |
| -------------------------- | ----------------------- | -------------------------------------------------------- | ----------------------------------------------- |
| Infinite scroll pagination | Custom page tracking    | TanStack useInfiniteQuery with offset pageParam          | Handles refetching, deduplication, page merging |
| Query key management       | Manual string arrays    | Query key factory pattern (TkDodo)                       | Type-safe, hierarchical invalidation            |
| GraphQL type generation    | Manual TypeScript types | graphql-codegen client-preset                            | Types auto-sync with schema changes             |
| Loading/error states in UI | Custom state management | TanStack Query's isLoading/error + shadcn Skeleton/Alert | Battle-tested, consistent patterns              |
| JSON display toggle        | Custom expand/collapse  | shadcn Collapsible + JSON.stringify                      | Already available component                     |

**Key insight:** The biggest temptation will be building custom Hasura query builders. Don't. The service layer should construct plain objects that match the Hasura-generated TypeScript types. graphql-codegen generates the exact types for `where`, `order_by`, etc.

## Common Pitfalls

### Pitfall 1: useQuery and useInfiniteQuery Key Collision

**What goes wrong:** Using `['profiles', 'list', { filter }]` for both `useProfiles` (useQuery) and `useInfiniteProfiles` (useInfiniteQuery) causes cache corruption because they have fundamentally different data structures (single result vs pages array).
**Why it happens:** Both queries feel like "listing profiles" so developers use the same key.
**How to avoid:** The query key factory MUST differentiate: `profileKeys.list(filter)` for useQuery and `profileKeys.infinite(filter)` for useInfiniteQuery.
**Warning signs:** "Cannot read properties of undefined" errors when switching between list and infinite views.

### Pitfall 2: Hasura Relation Names ≠ Entity Names

**What goes wrong:** Using `followed` when you mean `followed_by` (or vice versa) in where clauses.
**Why it happens:** The UniversalProfile entity has asymmetric relation names from the TypeORM schema:

- `followed` = `[Follow!]! @derivedFrom(field: "followerUniversalProfile")` → Follow records where THIS profile is the **follower** (profiles this profile follows)
- `followedBy` → `followed_by` = `[Follow!]! @derivedFrom(field: "followedUniversalProfile")` → Follow records where THIS profile is the **followed one** (this profile's followers)
  **How to avoid:** Document the mapping clearly. "Profiles that X follows" filters on `followed_by` (where the matched profiles appear as `followedUniversalProfile` in Follow records where X is followerAddress). "Profiles that follow X" filters on `followed` (where matched profiles appear as `followerUniversalProfile` in Follow records where X is followedAddress).
  **Warning signs:** Getting the opposite set of profiles from what you expected.

### Pitfall 3: Aggregate Counts Nested Too Deep

**What goes wrong:** Trying to access `followerCount` as a direct field on UniversalProfile.
**Why it happens:** There are NO direct count columns in the database. Counts come exclusively from Hasura aggregate queries on array relations.
**How to avoid:** Always query `followed_by_aggregate { aggregate { count } }` (for follower count) and `followed_aggregate { aggregate { count } }` (for following count) in the GraphQL document. The parser then maps these to flat `followerCount`/`followingCount` fields.
**Warning signs:** `null` or `undefined` count values.

### Pitfall 4: LSP3 Profile is One Level Deep from UniversalProfile

**What goes wrong:** Querying `universal_profile { name }` directly — name isn't on UniversalProfile.
**Why it happens:** The data model has UniversalProfile → lsp3Profile (FK) → LSP3Profile → name (derived → LSP3ProfileName).
**How to avoid:** Always traverse: `universal_profile { lsp3_profile { name { value } } }`. The parser flattens this to `profile.name`.

### Pitfall 5: @include Directive with Codegen Type Safety

**What goes wrong:** When `@include(if: false)` omits a field, the generated TypeScript type still includes it (as possibly undefined). If the parser doesn't handle missing fields, you get runtime errors.
**Why it happens:** GraphQL @include makes fields structurally optional at runtime, but codegen may or may not reflect this.
**How to avoid:** The parser should use optional chaining and default to `[]` for arrays and `null` for scalars when fields are absent due to @include being false. Codegen with `client-preset` in `documentMode: 'string'` generates types that include the fields — the response just won't have them when @include is false.
**Warning signs:** TypeScript compiles fine but runtime crashes on `.map()` of undefined arrays.

### Pitfall 6: Offset Pagination Race Conditions

**What goes wrong:** When data is inserted/deleted between page fetches, offset-based pagination skips or duplicates items.
**Why it happens:** Offset-based pagination is positional, not keyed.
**How to avoid:** This is a known limitation. For the profiles use case (blockchain data that doesn't change rapidly), it's acceptable. Use a consistent `order_by` to minimize issues. staleTime of 60s (already configured) helps. For Phase 8, this is documented as a known tradeoff.

### Pitfall 7: Sort by Follower Count Requires Aggregate Order By

**What goes wrong:** Trying to sort by a non-existent `followerCount` column.
**Why it happens:** Hasura sorts on array relationships use aggregate expressions: `order_by: { followed_by_aggregate: { count: desc } }`.
**How to avoid:** The service layer must translate `sort: { field: 'followerCount', direction: 'desc' }` to `order_by: [{ followed_by_aggregate: { count: desc } }]`.

## Code Examples

### Example 1: GraphQL Document for Single Profile

```typescript
// Source: Hasura docs (nested objects, aggregates, @include directives)
// packages/react/src/documents/profiles.ts

import { graphql } from '../graphql';

export const GetProfileDocument = graphql(`
  query GetProfile(
    $where: universal_profile_bool_exp!
    $includeTags: Boolean! = true
    $includeLinks: Boolean! = true
    $includeAvatar: Boolean! = true
    $includeProfileImage: Boolean! = true
    $includeBackgroundImage: Boolean! = true
  ) {
    universal_profile(where: $where, limit: 1) {
      id
      address
      lsp3_profile {
        name {
          value
        }
        description {
          value
        }
        tags @include(if: $includeTags) {
          value
        }
        links @include(if: $includeLinks) {
          title
          url
        }
        avatar @include(if: $includeAvatar) {
          url
          file_type
          verification_method
          verification_data
        }
        profile_image @include(if: $includeProfileImage) {
          url
          width
          height
          verification_method
          verification_data
        }
        background_image @include(if: $includeBackgroundImage) {
          url
          width
          height
          verification_method
          verification_data
        }
      }
      followed_by_aggregate {
        aggregate {
          count
        }
      }
      followed_aggregate {
        aggregate {
          count
        }
      }
    }
  }
`);
```

### Example 2: GraphQL Document for Profile List with Pagination + Total Count

```typescript
export const GetProfilesDocument = graphql(`
  query GetProfiles(
    $where: universal_profile_bool_exp
    $order_by: [universal_profile_order_by!]
    $limit: Int
    $offset: Int
    $includeTags: Boolean! = true
    $includeLinks: Boolean! = true
    $includeAvatar: Boolean! = true
    $includeProfileImage: Boolean! = true
    $includeBackgroundImage: Boolean! = true
  ) {
    universal_profile(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      id
      address
      lsp3_profile {
        name {
          value
        }
        description {
          value
        }
        tags @include(if: $includeTags) {
          value
        }
        links @include(if: $includeLinks) {
          title
          url
        }
        avatar @include(if: $includeAvatar) {
          url
          file_type
          verification_method
          verification_data
        }
        profile_image @include(if: $includeProfileImage) {
          url
          width
          height
          verification_method
          verification_data
        }
        background_image @include(if: $includeBackgroundImage) {
          url
          width
          height
          verification_method
          verification_data
        }
      }
      followed_by_aggregate {
        aggregate {
          count
        }
      }
      followed_aggregate {
        aggregate {
          count
        }
      }
    }
    universal_profile_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);
```

### Example 3: Hasura Complex Join Filters (Applied as Variables)

**Filter: "Profiles that address X follows":**
This means X is a follower, so we need profiles where X appears as `follower_address` in the `followed_by` relation.

```typescript
// Hasura where clause:
{
  followed_by: {
    follower_address: {
      _eq: '0xTargetAddress';
    }
  }
}
```

**Filter: "Profiles that follow address X":**
This means profiles that are followers of X, so we need profiles where X appears as `followed_address` in the `followed` relation.

```typescript
// Hasura where clause:
{
  followed: {
    followed_address: {
      _eq: '0xTargetAddress';
    }
  }
}
```

**Filter: "Profiles owning token Y" (by asset address):**

```typescript
// Join through owned_assets relation on UniversalProfile
{
  owned_assets: {
    address: { _eq: "0xTokenAddress" },
    balance: { _gt: "0" }  // Only profiles with non-zero balance
  }
}
```

**Filter: "Profiles owning specific token ID":**

```typescript
// Join through owned_tokens relation (via owned_assets)
{
  owned_tokens: {
    address: { _eq: "0xTokenAddress" },
    token_id: { _eq: "tokenId123" }
  }
}
```

**Filter: By name (ilike search):**

```typescript
// Navigate through lsp3_profile → name → value
{
  lsp3_profile: {
    name: {
      value: {
        _ilike: '%alice%';
      }
    }
  }
}
```

**Combining multiple filters (AND):**

```typescript
{
  _and: [
    { lsp3_profile: { name: { value: { _ilike: '%alice%' } } } },
    { followed_by: { follower_address: { _eq: '0x...' } } },
  ];
}
```

### Example 4: Hasura Sort by Aggregate (Follower Count)

```typescript
// Source: Hasura docs — sorting by array relationship aggregates

// Sort by follower count (descending)
const orderBy = [{ followed_by_aggregate: { count: 'desc' } }];

// Sort by following count (ascending)
const orderBy = [{ followed_aggregate: { count: 'asc' } }];

// Sort by name (through nested relation)
const orderBy = [{ lsp3_profile: { name: { value: 'asc' } } }];

// Multi-sort: name then follower count
const orderBy = [
  { lsp3_profile: { name: { value: 'asc' } } },
  { followed_by_aggregate: { count: 'desc' } },
];
```

### Example 5: Parser (Hasura → Clean Profile Type)

```typescript
// packages/react/src/parsers/profiles.ts

import type { Profile, ProfileImage } from '../types/profiles';

interface HasuraProfileImage {
  url: string | null;
  width: number | null;
  height: number | null;
  verification_method: string | null;
  verification_data: string | null;
}

interface HasuraUniversalProfile {
  id: string;
  address: string;
  lsp3_profile: {
    name: { value: string | null } | null;
    description: { value: string | null } | null;
    tags?: Array<{ value: string | null }>;
    links?: Array<{ title: string | null; url: string | null }>;
    avatar?: Array<{
      url: string | null;
      file_type: string | null;
      verification_method: string | null;
      verification_data: string | null;
    }>;
    profile_image?: Array<HasuraProfileImage>;
    background_image?: Array<HasuraProfileImage>;
  } | null;
  followed_by_aggregate: { aggregate: { count: number } | null } | null;
  followed_aggregate: { aggregate: { count: number } | null } | null;
}

function parseImage(img: HasuraProfileImage): ProfileImage {
  return {
    url: img.url ?? '',
    width: img.width,
    height: img.height,
    verification: img.verification_method
      ? { method: img.verification_method, data: img.verification_data ?? '' }
      : null,
  };
}

export function parseProfile(raw: HasuraUniversalProfile): Profile {
  const lsp3 = raw.lsp3_profile;
  return {
    address: raw.address,
    name: lsp3?.name?.value ?? null,
    description: lsp3?.description?.value ?? null,
    tags: lsp3?.tags?.map((t) => t.value).filter((v): v is string => v != null) ?? [],
    links: lsp3?.links?.map((l) => ({ title: l.title ?? '', url: l.url ?? '' })) ?? [],
    avatar:
      lsp3?.avatar?.map((a) => ({
        url: a.url ?? '',
        width: null, // LSP3ProfileAsset doesn't have width/height
        height: null,
        verification: a.verification_method
          ? { method: a.verification_method, data: a.verification_data ?? '' }
          : null,
      })) ?? [],
    profileImage: lsp3?.profile_image?.map(parseImage) ?? [],
    backgroundImage: lsp3?.background_image?.map(parseImage) ?? [],
    followerCount: raw.followed_by_aggregate?.aggregate?.count ?? 0,
    followingCount: raw.followed_aggregate?.aggregate?.count ?? 0,
  };
}
```

### Example 6: Query Key Factory

```typescript
// packages/react/src/keys/profiles.ts
// Source: TkDodo "Effective React Query Keys" pattern

import type { ProfileFilter, ProfileSort } from '../types/profiles';

export const profileKeys = {
  all: ['profiles'] as const,

  // Lists (useQuery)
  lists: () => [...profileKeys.all, 'list'] as const,
  list: (filter?: ProfileFilter, sort?: ProfileSort) =>
    [...profileKeys.lists(), { filter, sort }] as const,

  // Details (useQuery)
  details: () => [...profileKeys.all, 'detail'] as const,
  detail: (address: string) => [...profileKeys.details(), address] as const,

  // Infinite (useInfiniteQuery) — MUST differ from list keys
  infinites: () => [...profileKeys.all, 'infinite'] as const,
  infinite: (filter?: ProfileFilter, sort?: ProfileSort) =>
    [...profileKeys.infinites(), { filter, sort }] as const,
} as const;
```

### Example 7: useInfiniteProfiles with Offset-Based Pagination

```typescript
// packages/react/src/hooks/profiles.ts
// Source: TanStack Query docs — "What if my API doesn't return a cursor?"

import { useInfiniteQuery } from '@tanstack/react-query';

const DEFAULT_PAGE_SIZE = 20;

export function useInfiniteProfiles(params: UseInfiniteProfilesParams = {}) {
  const url = getClientUrl();
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE, include, ...queryOptions } = params;

  const result = useInfiniteQuery({
    queryKey: profileKeys.infinite(filter, sort),
    queryFn: async ({ pageParam }) => {
      return fetchProfiles(url, {
        filter,
        sort,
        limit: pageSize,
        offset: pageParam,
        include,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      // If we got fewer results than requested, there are no more pages
      if (lastPage.profiles.length < pageSize) {
        return undefined;
      }
      // Next offset = current offset + page size
      return lastPageParam + pageSize;
    },
    ...queryOptions,
  });

  // Flatten pages into a single profiles array
  const { data, ...rest } = result;
  const profiles = data?.pages.flatMap((page) => page.profiles) ?? [];

  return {
    profiles,
    hasNextPage: result.hasNextPage,
    fetchNextPage: result.fetchNextPage,
    isFetchingNextPage: result.isFetchingNextPage,
    ...rest,
  };
}
```

### Example 8: Service Function with Param Translation

```typescript
// packages/react/src/services/profiles.ts

export interface FetchProfilesResult {
  profiles: Profile[];
  totalCount: number;
}

export async function fetchProfiles(
  url: string,
  params: {
    filter?: ProfileFilter;
    sort?: ProfileSort;
    limit?: number;
    offset?: number;
    include?: ProfileInclude;
  },
): Promise<FetchProfilesResult> {
  const where = buildProfileWhere(params.filter);
  const orderBy = buildProfileOrderBy(params.sort);
  const includeVars = buildIncludeVars(params.include);

  const result = await execute(url, GetProfilesDocument, {
    where,
    order_by: orderBy,
    limit: params.limit,
    offset: params.offset,
    ...includeVars,
  });

  return {
    profiles: result.universal_profile.map(parseProfile),
    totalCount: result.universal_profile_aggregate?.aggregate?.count ?? 0,
  };
}
```

## State of the Art

| Old Approach               | Current Approach                   | When Changed                     | Impact                                    |
| -------------------------- | ---------------------------------- | -------------------------------- | ----------------------------------------- |
| graphql-tag + DocumentNode | TypedDocumentString (string-based) | codegen v5 client-preset         | No graphql runtime dep needed             |
| useQuery v3 (object key)   | useQuery v5 (array key, required)  | TanStack Query v5                | All keys must be arrays                   |
| Manual query key strings   | Query key factory pattern          | TkDodo blog 2021 (still current) | Type-safe, hierarchical invalidation      |
| Cursor-based infinite only | Offset-based via pageParam         | TanStack Query v5 docs           | Built-in support for any pagination style |

**Deprecated/outdated:**

- `useQuery({ queryKey: 'string' })` — string keys no longer supported in v5, must be arrays
- `cacheTime` option — renamed to `gcTime` in v5
- `onSuccess`/`onError`/`onSettled` callbacks on useQuery — removed in v5, use side effects in queryFn or useEffect

## Hasura-Specific Data Model Reference

### Table Name Mapping (TypeORM PascalCase → Hasura snake_case)

| Entity                     | Hasura Table                  | Notes                              |
| -------------------------- | ----------------------------- | ---------------------------------- |
| UniversalProfile           | universal_profile             | Main profiles table                |
| LSP3Profile                | lsp3_profile                  | Profile metadata (FK from UP)      |
| LSP3ProfileName            | lsp3_profile_name             | Name (derived from LSP3Profile)    |
| LSP3ProfileDescription     | lsp3_profile_description      | Description                        |
| LSP3ProfileTag             | lsp3_profile_tag              | Tags (array relation)              |
| LSP3ProfileLink            | lsp3_profile_link             | Links (array relation)             |
| LSP3ProfileAsset           | lsp3_profile_asset            | Avatar assets (array relation)     |
| LSP3ProfileImage           | lsp3_profile_image            | Profile images (array relation)    |
| LSP3ProfileBackgroundImage | lsp3_profile_background_image | Background images (array relation) |
| Follow                     | follow                        | Follow events                      |
| Follower                   | follower                      | Current follow state               |
| OwnedAsset                 | owned_asset                   | Token ownership                    |
| OwnedToken                 | owned_token                   | NFT ownership                      |

### Relation Mapping on universal_profile

| Hasura Relation       | Direction   | Join Entity  | Key Fields                  |
| --------------------- | ----------- | ------------ | --------------------------- |
| lsp3_profile          | object (FK) | lsp3_profile | universalProfile FK         |
| owned_assets          | array       | owned_asset  | universalProfile FK         |
| owned_tokens          | array       | owned_token  | universalProfile FK         |
| followed              | array       | follow       | followerUniversalProfile FK |
| followed_by           | array       | follow       | followedUniversalProfile FK |
| followed_aggregate    | aggregate   | follow       | followerUniversalProfile FK |
| followed_by_aggregate | aggregate   | follow       | followedUniversalProfile FK |

**Critical naming clarification:**

- `followed` on UniversalProfile = Follow records where this UP is `followerUniversalProfile` = "follow events initiated BY this profile" = **this profile's following list**
- `followed_by` on UniversalProfile = Follow records where this UP is `followedUniversalProfile` = "follow events targeting this profile" = **this profile's follower list**

Therefore:

- **followerCount** = `followed_by_aggregate { aggregate { count } }`
- **followingCount** = `followed_aggregate { aggregate { count } }`
- **"Profiles that address X follows"** = query universal_profiles `where: { followed_by: { follower_address: { _eq: X } } }`
- **"Profiles that follow address X"** = query universal_profiles `where: { followed: { followed_address: { _eq: X } } }`

### Note on Follower vs Follow Entities

The schema has BOTH `Follow` (event log — every follow event) and `Follower` (current state — active follows only). For filtering "who follows whom", use `followed`/`followed_by` relations (which map to the `follow` table). The `follower` table represents current state but the relations on UniversalProfile use `follow`.

**Verification needed:** Confirm at implementation time which table the `followed`/`followed_by` relations actually reference — it could be `follow` or `follower`. The TypeORM schema shows `followed: [Follow!]! @derivedFrom(field: "followerUniversalProfile")` pointing to the `Follow` entity, BUT Hasura may track either. The safest approach is to test the actual GraphQL query against the live endpoint.

## Type Definitions (Recommended)

```typescript
// packages/react/src/types/profiles.ts

export interface Profile {
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

export interface ProfileImage {
  url: string;
  width: number | null;
  height: number | null;
  verification: { method: string; data: string } | null;
}

export interface ProfileFilter {
  /** Filter by name (case-insensitive partial match) */
  name?: string;
  /** Filter profiles that the given address follows */
  followedBy?: string;
  /** Filter profiles that follow the given address */
  following?: string;
  /** Filter profiles owning a specific token */
  tokenOwned?: {
    address: string;
    tokenId?: string;
    minBalance?: string;
  };
}

export type ProfileSortField = 'name' | 'followerCount' | 'followingCount';
export type SortDirection = 'asc' | 'desc';

export interface ProfileSort {
  field: ProfileSortField;
  direction: SortDirection;
}

export interface ProfileInclude {
  tags?: boolean;
  links?: boolean;
  avatar?: boolean;
  profileImage?: boolean;
  backgroundImage?: boolean;
}

// Hook param types
export interface UseProfileParams {
  address: string;
  include?: ProfileInclude;
}

export interface UseProfilesParams {
  filter?: ProfileFilter;
  sort?: ProfileSort;
  limit?: number;
  offset?: number;
  include?: ProfileInclude;
}

export interface UseInfiniteProfilesParams {
  filter?: ProfileFilter;
  sort?: ProfileSort;
  pageSize?: number;
  include?: ProfileInclude;
}
```

## GraphQL @include Directive + Codegen Behavior

**How @include works with graphql-codegen client-preset (documentMode: 'string'):**

1. The document is written with `@include(if: $varName)` on fields
2. Codegen generates types where the `@include`-guarded fields are typed as optional (the type includes `| undefined` implicitly since the field may not be present in the response)
3. The `TypedDocumentString` includes the boolean variables in its type signature
4. At runtime, if `$includeTags: false`, the `tags` field simply won't be present in the JSON response
5. The parser MUST handle this with optional chaining: `raw.lsp3_profile?.tags?.map(...)` and default to `[]`

**Default values in GraphQL variables:** Using `$includeTags: Boolean! = true` in the query definition means if the variable is not provided, it defaults to `true`. This aligns perfectly with the "omit include = get everything" design.

**Codegen implication:** When running codegen against the Hasura introspection schema, the full Hasura schema types (including `universal_profile_bool_exp`, `universal_profile_order_by`, etc.) will be generated. These Hasura types can be imported in the service layer for type-safe where/order_by construction — but they should NEVER leak to the public API.

## Test App Preset Addresses

For the test app's preset buttons, use well-known LUKSO mainnet Universal Profile addresses:

| Label          | Address                                      | Notes                   |
| -------------- | -------------------------------------------- | ----------------------- |
| LUKSO          | `0x79eb93CC915D23E52aD18aCCF7897ACbd1031D42` | Official LUKSO UP       |
| Universal Page | `0x98b83eB9BDEcB8dB47BEA4579eb7e1C92C127E1e` | Universal Page platform |
| chillwhales    | `0xCf9F3a30e2B5E8A6B9e84B3E84e47d0cE8E46F2c` | NFT project             |

**Note:** These addresses should be verified at implementation time against the actual live Hasura endpoint. If the indexer doesn't have these profiles, use any 3 addresses that return data. The preset buttons are for developer convenience, not correctness.

## Open Questions

Things that couldn't be fully resolved:

1. **Exact Hasura relation names for Follow/Follower disambiguation**

   - What we know: TypeORM schema shows `followed: [Follow!]! @derivedFrom(field: "followerUniversalProfile")` on UniversalProfile
   - What's unclear: Whether Hasura tracks the `follow` table or `follower` table for these relations. Both exist in the schema.
   - Recommendation: Test against the live Hasura endpoint during implementation. If the filter doesn't work on `followed`/`followed_by`, try the `follower`-based relations. The introspected schema (via codegen) will reveal the exact available relations.

2. **Aggregate ordering type names in codegen output**

   - What we know: Hasura supports `order_by: [{ followed_by_aggregate: { count: desc } }]` for sorting by relation counts
   - What's unclear: The exact generated TypeScript type name for aggregate order_by expressions after codegen
   - Recommendation: Run codegen with Hasura introspection first, then inspect the generated types to confirm `universal_profile_order_by` includes aggregate ordering fields

3. **LSP3ProfileAsset vs ProfileImage shape difference**
   - What we know: `LSP3ProfileAsset` (avatar) has `url, file_type, verificationMethod, verificationData, verificationSource` while `LSP3ProfileImage` has `url, width, height, verificationMethod, verificationData, verificationSource`
   - What's unclear: Whether the `ProfileImage` interface (with width/height) should apply to avatar or if avatar needs a separate type
   - Recommendation: Use `ProfileImage` for all three (avatar, profileImage, backgroundImage) with `width: null, height: null` for avatars. The user-defined Profile shape already specifies `Array<ProfileImage>` for all three.

## Sources

### Primary (HIGH confidence)

- Hasura v2 docs — Nested object queries (https://hasura.io/docs/2.0/queries/postgres/nested-object-queries/)
- Hasura v2 docs — Filter based on nested objects (https://hasura.io/docs/2.0/queries/postgres/filters/using-nested-objects/)
- Hasura v2 docs — Aggregation queries (https://hasura.io/docs/2.0/queries/postgres/aggregation-queries/)
- Hasura v2 docs — Pagination with limit/offset (https://hasura.io/docs/2.0/queries/postgres/pagination/)
- Hasura v2 docs — Sorting including aggregate order_by (https://hasura.io/docs/2.0/queries/postgres/sorting/)
- Hasura v2 docs — @include directive (https://hasura.io/docs/2.0/queries/postgres/variables-aliases-fragments-directives/)
- TanStack Query v5 docs — useInfiniteQuery reference (https://tanstack.com/query/latest/docs/framework/react/reference/useInfiniteQuery)
- TanStack Query v5 docs — Infinite queries guide (https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries)
- TkDodo — Effective React Query Keys (https://tkdodo.eu/blog/effective-react-query-keys)
- Local codebase — TypeORM schema.graphql (`packages/typeorm/schema.graphql`)
- Local codebase — entityRegistry.ts (PascalCase → snake_case mapping)
- Local codebase — execute.ts, codegen.ts, tsup.config.ts (existing infrastructure)

### Secondary (MEDIUM confidence)

- @include directive codegen behavior with client-preset — inferred from codegen configuration and general graphql-codegen documentation patterns

### Tertiary (LOW confidence)

- Preset LUKSO addresses — unverified against live endpoint, may need adjustment
- Exact Follow vs Follower table usage in Hasura relations — needs live verification

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all deps already installed, patterns well-documented
- Architecture: HIGH — pipeline pattern proven in similar projects, Hasura query patterns verified from official docs
- Hasura query patterns: HIGH — verified against official Hasura v2 documentation
- TanStack Query patterns: HIGH — verified against official docs and TkDodo's authoritative blog
- @include directive codegen: MEDIUM — standard GraphQL behavior, but exact codegen output for this specific setup needs runtime verification
- Follow/Follower relation mapping: MEDIUM — TypeORM schema is clear but Hasura's actual tracking needs live verification
- Pitfalls: HIGH — drawn from official docs warnings and known patterns

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable stack, no expected breaking changes)
