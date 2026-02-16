# Feature Landscape: React Hooks Package for LUKSO Indexer Data

**Domain:** React hooks library wrapping GraphQL/Hasura indexer data
**Researched:** 2026-02-16
**Mode:** Ecosystem — how production-quality React hooks packages work
**Confidence:** HIGH (patterns verified from TanStack Query docs, wagmi source, GraphQL Codegen docs, tRPC patterns)

---

## Executive Summary

A production-quality React hooks package for consuming GraphQL/indexer data must solve three core problems: **type-safe data fetching** (GraphQL codegen → TypeScript types → typed hooks), **intelligent caching** (TanStack Query key factories, stale-while-revalidate, prefetching), and **dual consumption** (client-side direct fetching AND server-side via Next.js server actions).

The best-in-class packages in this space — wagmi, tRPC, and Apollo Client — all converge on the same fundamental pattern: a thin hook layer over TanStack Query that provides domain-specific convenience while exposing the full TanStack Query API for advanced use cases. The key differentiator for great DX is **how little a new developer needs to learn** before being productive.

For the `@chillwhales/react` package specifically, the 11 query domains (profiles, assets, NFTs, follows, etc.) map cleanly to per-domain hook files with a unified barrel export. The existing reference implementation in `chillwhales/marketplace` (services → server actions → hooks) provides a proven pattern to extract and generalize.

---

## Table Stakes

Features users expect from any quality hooks package. Missing = package feels amateur or unusable.

### TS-1: GraphQL Codegen Pipeline (Types from Hasura Schema)

| Aspect             | Detail                                                                                                                                                                                                                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Why Expected**   | Without generated types, every hook return value is `any` — defeats the entire purpose of a typed hooks package                                                                                                                                                                          |
| **Complexity**     | Medium                                                                                                                                                                                                                                                                                   |
| **Dependencies**   | Hasura endpoint or introspected schema file; `@graphql-codegen/cli` + `client` preset                                                                                                                                                                                                    |
| **Example**        | GraphQL Code Generator `client` preset with `documentMode: 'string'` — generates `TypedDocumentString` containers that carry both the query string and its TypeScript result/variables types                                                                                             |
| **Recommendation** | Use `@graphql-codegen/cli` with the `client` preset. Point schema at `packages/typeorm/schema.graphql` (local) or Hasura endpoint (remote). Write `.graphql` document files per domain, generate types + typed document strings. Commit generated types (not generated at install time). |

**Source:** [GraphQL Codegen React Query guide](https://the-guild.dev/graphql/codegen/docs/guides/react-query) — HIGH confidence, verified Feb 2026.

**Key pattern from docs:**

```typescript
// codegen generates TypedDocumentString with result + variable types
const ProfileQuery = graphql(`
  query UniversalProfile($address: String!) {
    universalProfileById(id: $address) { id name ... }
  }
`);

// execute() function provides type-safe execution
async function execute<TResult, TVariables>(
  query: TypedDocumentString<TResult, TVariables>,
  ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
): Promise<TResult>;
```

### TS-2: TanStack Query Integration with Query Key Factories

| Aspect             | Detail                                                                                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Why Expected**   | TanStack Query is the standard React async state manager; query keys enable cache invalidation, prefetching, and SSR hydration                                   |
| **Complexity**     | Medium                                                                                                                                                           |
| **Dependencies**   | `@tanstack/react-query` v5                                                                                                                                       |
| **Example**        | wagmi exports `queryKey` from every hook AND `get<X>QueryOptions` for vanilla JS usage outside React components                                                  |
| **Recommendation** | Create a `queryKeys` factory per domain that returns hierarchical keys. Export both hooks (React) and `get<X>QueryOptions` functions (vanilla JS / server-side). |

**Source:** [TanStack Query docs — Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys), [wagmi TanStack Query guide](https://wagmi.sh/react/guides/tanstack-query) — HIGH confidence.

**Key pattern (query key factory):**

```typescript
// Hierarchical query keys enable granular invalidation
export const profileKeys = {
  all: ['profiles'] as const,
  lists: () => [...profileKeys.all, 'list'] as const,
  list: (filters: ProfileFilters) => [...profileKeys.lists(), filters] as const,
  details: () => [...profileKeys.all, 'detail'] as const,
  detail: (address: string) => [...profileKeys.details(), address] as const,
};

// queryClient.invalidateQueries({ queryKey: profileKeys.all })  ← invalidates everything
// queryClient.invalidateQueries({ queryKey: profileKeys.detail('0x...') }) ← just one
```

**wagmi pattern (dual export):**

```typescript
// Hook returns queryKey for React usage
const { data, queryKey } = useProfile({ address });

// getProfileQueryOptions for vanilla/server usage
import { getProfileQueryOptions } from '@chillwhales/react/query';
const options = getProfileQueryOptions(config, { address });
queryClient.prefetchQuery(options);
```

### TS-3: Per-Domain Hook Coverage (All 11 Query Domains)

| Aspect             | Detail                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------ |
| **Why Expected**   | Each domain has distinct queries, variables, and return shapes — developers need a hook for each             |
| **Complexity**     | High (11 domains × multiple queries each = 20-40 hooks total)                                                |
| **Dependencies**   | TS-1 (codegen types), TS-2 (TanStack Query integration)                                                      |
| **Example**        | wagmi has 40+ hooks, one per operation (useBalance, useBlock, useReadContract, etc.)                         |
| **Recommendation** | One hook per distinct query operation, organized in per-domain files. NOT one mega-hook with mode switching. |

**The 11 domains and their primary hooks:**

| Domain                    | Primary Hooks                                    | Variables                           |
| ------------------------- | ------------------------------------------------ | ----------------------------------- |
| Universal Profiles        | `useProfile`, `useProfiles`, `useProfileSearch`  | `address`, `search`, `limit/offset` |
| Digital Assets            | `useDigitalAsset`, `useDigitalAssets`            | `address`, `filters`                |
| NFTs                      | `useNft`, `useNfts`, `useNftsByCollection`       | `id`, `collection`, `owner`         |
| Owned Assets              | `useOwnedAssets`, `useOwnedTokens`               | `ownerAddress`                      |
| Follows/Social            | `useFollowers`, `useFollowing`, `useFollowCount` | `address`                           |
| Creator Addresses         | `useCreatorAddresses`                            | `assetAddress`                      |
| LSP29 Encrypted Assets    | `useEncryptedAsset`, `useEncryptedAssets`        | `address`, `assetAddress`           |
| LSP29 Feed                | `useEncryptedAssetFeed`                          | `limit/offset`                      |
| Data Changed              | `useDataChangedEvents`                           | `address`, `dataKey`                |
| Universal Receiver Events | `useUniversalReceiverEvents`                     | `address`                           |
| UP Stats                  | `useProfileStats`                                | `address`                           |

### TS-4: Service Layer (Framework-Agnostic Data Fetching)

| Aspect             | Detail                                                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Why Expected**   | Hooks should not contain GraphQL execution logic directly — a service layer enables both client-side and server-side consumption                                                      |
| **Complexity**     | Medium                                                                                                                                                                                |
| **Dependencies**   | `graphql-request` (already used in reference implementation)                                                                                                                          |
| **Example**        | tRPC has a clear client → router → procedure separation; the reference marketplace has services as the data layer                                                                     |
| **Recommendation** | Each domain gets a service class/module that handles GraphQL execution. Hooks call services. Server actions call services. Services are the single source of truth for data fetching. |

**Pattern:**

```
Hook (useProfile) → Service (profileService.getByAddress) → graphql-request → Hasura
ServerAction (getProfile) → Service (profileService.getByAddress) → graphql-request → Hasura
```

### TS-5: Provider Pattern (Create-or-Reuse QueryClient)

| Aspect             | Detail                                                                                                                                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Why Expected**   | Apps that already have TanStack Query set up must not be forced to create a second QueryClient                                                                                                                    |
| **Complexity**     | Low                                                                                                                                                                                                               |
| **Dependencies**   | `@tanstack/react-query`                                                                                                                                                                                           |
| **Example**        | wagmi's `WagmiProvider` wraps `QueryClientProvider` but accepts an external `queryClient` prop; if the consumer already has one, they pass it in                                                                  |
| **Recommendation** | Export a `LuksoIndexerProvider` that accepts an optional `queryClient`. If none provided, create one internally. If provided, use the existing one. Always nest inside existing `QueryClientProvider` if present. |

**Source:** [wagmi WagmiProvider docs](https://wagmi.sh/react/api/WagmiProvider) — HIGH confidence.

**Key pattern:**

```typescript
// Option A: Package creates its own QueryClient
<LuksoIndexerProvider graphqlUrl="https://...">
  <App />
</LuksoIndexerProvider>

// Option B: Consumer provides existing QueryClient (e.g., already using TanStack Query)
<QueryClientProvider client={myQueryClient}>
  <LuksoIndexerProvider graphqlUrl="https://..." queryClient={myQueryClient}>
    <App />
  </LuksoIndexerProvider>
</QueryClientProvider>
```

### TS-6: Environment-Driven Configuration

| Aspect             | Detail                                                                                                                                                                            |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Why Expected**   | GraphQL URL, default stale times, and other config must come from environment, not hardcoded                                                                                      |
| **Complexity**     | Low                                                                                                                                                                               |
| **Dependencies**   | None                                                                                                                                                                              |
| **Example**        | wagmi's `createConfig()`, tRPC's `createTRPCReact()` — both use a config object                                                                                                   |
| **Recommendation** | Export a `createIndexerConfig()` that accepts `graphqlUrl` and optional overrides. Provider reads from config. Env var fallback: `NEXT_PUBLIC_GRAPHQL_URL` or `VITE_GRAPHQL_URL`. |

### TS-7: Error Handling (GraphQL + Network Errors)

| Aspect             | Detail                                                                                                                                                                                                                                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Why Expected**   | GraphQL errors are structurally different from HTTP errors; Hasura permission errors have specific shapes; developers need typed error objects                                                                                                                                                  |
| **Complexity**     | Medium                                                                                                                                                                                                                                                                                          |
| **Dependencies**   | TS-4 (service layer handles error normalization)                                                                                                                                                                                                                                                |
| **Example**        | Apollo Client has `ApolloError` with `graphQLErrors` + `networkError` separation; wagmi has typed `ConnectorAlreadyConnectedError` etc.                                                                                                                                                         |
| **Recommendation** | Create an `IndexerError` class that distinguishes: (1) network errors (server unreachable), (2) GraphQL errors (returned in `errors[]` array), (3) Hasura permission errors (specific error codes). The service layer catches and normalizes; hooks surface via TanStack Query's `error` field. |

**GraphQL error structure from Hasura:**

```typescript
// Network error (HTTP 500, timeout, etc.)
{ type: 'network', message: string, status?: number }

// GraphQL error (query syntax, validation)
{ type: 'graphql', errors: Array<{ message: string, extensions?: { code: string } }> }

// Hasura permission error (role-based access)
{ type: 'permission', message: 'field "X" not found in type', path: string[] }

// Partial data (GraphQL can return data + errors simultaneously)
{ type: 'partial', data: T, errors: GraphQLError[] }
```

### TS-8: Pagination Support (Offset-Based for Hasura)

| Aspect             | Detail                                                                                                                                                                                                                            |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Why Expected**   | Many query domains return lists (assets, NFTs, followers, events) that need pagination                                                                                                                                            |
| **Complexity**     | Medium                                                                                                                                                                                                                            |
| **Dependencies**   | TS-2 (TanStack Query), Hasura's `limit`/`offset` pagination                                                                                                                                                                       |
| **Example**        | TanStack Query's `useInfiniteQuery` with `getNextPageParam`                                                                                                                                                                       |
| **Recommendation** | Use `useInfiniteQuery` for list queries. Hasura supports `limit`/`offset` natively. `getNextPageParam` calculates next offset from current page length. Export both paginated (`useInfiniteX`) and single-page (`useX`) variants. |

**Source:** [TanStack Query Infinite Queries docs](https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries) — HIGH confidence.

**Key pattern for offset pagination (Hasura-compatible):**

```typescript
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: profileKeys.list(filters),
  queryFn: ({ pageParam = 0 }) =>
    profileService.list({ ...filters, offset: pageParam, limit: PAGE_SIZE }),
  initialPageParam: 0,
  getNextPageParam: (lastPage, _allPages, lastPageParam) => {
    // Hasura doesn't return cursor; use offset arithmetic
    if (lastPage.length < PAGE_SIZE) return undefined; // no more pages
    return lastPageParam + PAGE_SIZE;
  },
});
```

---

## Differentiators

Features that would set this package apart. Not expected, but make the package excellent for new developers.

### DF-1: Dual-Mode Hooks (Client-Side + Server Actions)

| Aspect                | Detail                                                                                                                                                                                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Value Proposition** | New developers using Next.js App Router can use the same hooks whether they're fetching client-side or via server actions — zero configuration change                                                                                                    |
| **Complexity**        | High                                                                                                                                                                                                                                                     |
| **Dependencies**      | TS-4 (service layer), `next-safe-action`                                                                                                                                                                                                                 |
| **Example**           | tRPC seamlessly supports both RSC and client components; the reference marketplace already has this pattern                                                                                                                                              |
| **Recommendation**    | Each domain exports: (1) `useProfile()` — client-side hook calling service directly, (2) `useProfileAction()` — hook calling server action that calls service. The server action pattern works in Next.js App Router; the direct pattern works anywhere. |

**Architecture:**

```
Client-side path:  useProfile() → profileService.getByAddress() → graphql-request → Hasura
Server-side path:  useProfileAction() → getProfileAction (server action) → profileService.getByAddress() → graphql-request → Hasura
```

**Why both?** Server actions add security (GraphQL URL never exposed to client), caching benefits (server-side cache), and work in RSC. Direct hooks work in any React app, not just Next.js.

### DF-2: Query Key Exports for Cache Management

| Aspect                | Detail                                                                                                                                                                     |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Value Proposition** | Consumers can invalidate, prefetch, and manage cache for specific domains without knowing internal key structure                                                           |
| **Complexity**        | Low                                                                                                                                                                        |
| **Dependencies**      | TS-2 (query key factories)                                                                                                                                                 |
| **Example**           | wagmi exports `queryKey` from every hook AND `get<X>QueryOptions` for vanilla JS. This is a hallmark of well-designed TanStack Query wrappers.                             |
| **Recommendation**    | Export query key factories from a `@chillwhales/react/keys` entrypoint. Consumers use them for invalidation after mutations, prefetching on navigation, and SSR hydration. |

**Usage example:**

```typescript
import { profileKeys, assetKeys } from '@chillwhales/react/keys';

// After a profile update mutation, invalidate all profile queries
queryClient.invalidateQueries({ queryKey: profileKeys.all });

// Prefetch asset data on hover
queryClient.prefetchQuery({
  queryKey: assetKeys.detail(assetAddress),
  queryFn: () => assetService.getByAddress(assetAddress),
});
```

### DF-3: SSR Hydration Support (Next.js App Router)

| Aspect                | Detail                                                                                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Value Proposition** | Zero-flash loading: data fetched on server is immediately available on client without a loading state                                                                                       |
| **Complexity**        | Medium                                                                                                                                                                                      |
| **Dependencies**      | TS-2, TS-5 (provider), `@tanstack/react-query` SSR features                                                                                                                                 |
| **Example**           | TanStack Query's `dehydrate`/`HydrationBoundary` pattern; wagmi's SSR guide                                                                                                                 |
| **Recommendation**    | Export `prefetchProfile`, `prefetchAssets`, etc. functions that work in Next.js `generateMetadata` or RSC. Provide a `HydrationBoundary` example in docs. Don't force SSR — make it opt-in. |

**Source:** [wagmi SSR guide](https://wagmi.sh/react/guides/ssr), TanStack Query Advanced SSR docs — HIGH confidence.

**Pattern:**

```typescript
// In server component (page.tsx)
import { getProfileQueryOptions } from '@chillwhales/react/query'

export default async function ProfilePage({ params }) {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery(getProfileQueryOptions(config, { address: params.address }))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProfileComponent address={params.address} />
    </HydrationBoundary>
  )
}
```

### DF-4: `select` Transforms for Common Data Shapes

| Aspect                | Detail                                                                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Value Proposition** | Many consumers need the same data transformations (e.g., profile with resolved images, asset with formatted balance). Pre-built selectors save repetitive work.    |
| **Complexity**        | Low-Medium                                                                                                                                                         |
| **Dependencies**      | TS-1 (types)                                                                                                                                                       |
| **Example**           | TanStack Query's `select` option for derived data without extra re-renders                                                                                         |
| **Recommendation**    | Export common selector functions: `selectProfileWithImages`, `selectAssetWithFormattedBalance`, `selectNftWithAttributes`. Consumers pass them as `select` option. |

**Pattern:**

```typescript
// Package exports pre-built selectors
export const selectProfileWithImages = (profile: RawProfile) => ({
  ...profile,
  avatarUrl: profile.lsp3Profile?.profileImage?.[0]?.url,
  backgroundUrl: profile.lsp3Profile?.backgroundImage?.[0]?.url,
});

// Consumer uses via select option
const { data } = useProfile({ address, select: selectProfileWithImages });
// data.avatarUrl is typed and available
```

### DF-5: Comprehensive TypeScript Types Export

| Aspect                | Detail                                                                                                                                             |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Value Proposition** | Consumers can import types for function parameters, component props, and other typed usage without reaching into codegen internals                 |
| **Complexity**        | Low                                                                                                                                                |
| **Dependencies**      | TS-1 (codegen)                                                                                                                                     |
| **Example**           | wagmi exports all types from `wagmi` and utility types from `wagmi/chains`                                                                         |
| **Recommendation**    | Re-export all codegen types from `@chillwhales/react/types`. Include utility types like `ProfileAddress`, `AssetAddress`, `NftId`, `TokenBalance`. |

### DF-6: Stale Time Defaults Per Domain

| Aspect                | Detail                                                                                                                                                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Value Proposition** | Profile metadata changes rarely (staleTime: 5min), follower counts change moderately (staleTime: 30s), event lists change frequently (staleTime: 10s). Smart defaults reduce unnecessary refetches. |
| **Complexity**        | Low                                                                                                                                                                                                 |
| **Dependencies**      | TS-2, TS-6 (config)                                                                                                                                                                                 |
| **Example**           | wagmi uses different stale times for different query types                                                                                                                                          |
| **Recommendation**    | Set domain-specific `staleTime` defaults in config. Allow per-hook override. Profile/asset metadata: 5 min. Follower counts: 30s. Events: 10s. All overridable.                                     |

---

## Anti-Features

Things to deliberately NOT build in v1.1. Common mistakes in this domain.

### AF-1: Do NOT Build a Custom Cache Layer

| Anti-Feature                                                             | Why Avoid                                                                                                                                                                                                | What to Do Instead                                                                                                             |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Custom in-memory cache, localStorage persistence, or deduplication logic | TanStack Query already provides all of this. Building custom caching creates bugs, stale data, and maintenance burden. Every major hooks library (wagmi, Apollo, tRPC) relies on TanStack Query's cache. | Use TanStack Query's built-in cache. For persistence, point users to `@tanstack/query-sync-storage-persister` (as wagmi does). |

### AF-2: Do NOT Build GraphQL Subscriptions/Real-Time

| Anti-Feature                                                 | Why Avoid                                                                                                                                                                                           | What to Do Instead                                                                                              |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| WebSocket subscriptions, polling, or real-time event streams | Adds significant complexity (WebSocket management, reconnection, state synchronization). Already explicitly out of scope for v1.1 per PROJECT.md. Hasura subscriptions require different transport. | Use `refetchInterval` on TanStack Query hooks for near-real-time when needed. Defer real subscriptions to v1.2. |

### AF-3: Do NOT Build Mutations/Write Hooks

| Anti-Feature                                                 | Why Avoid                                                                                                                                                                                                    | What to Do Instead                                                                                                                                                |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useFollow()`, `useTransfer()`, or any write operation hooks | The indexer is **read-only**. Write operations happen on-chain via wallets, not through the indexer. Building write hooks would create confusion about the package's purpose and require wallet integration. | Package is explicitly read-only query hooks. Write operations are the consuming app's responsibility. After writes, consumers can invalidate relevant query keys. |

### AF-4: Do NOT Build Complex Query Composition/Joins

| Anti-Feature                                                                                              | Why Avoid                                                                                                                                      | What to Do Instead                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hooks that combine multiple GraphQL queries into a single hook (e.g., `useProfileWithAssetsAndFollowers`) | GraphQL already supports nested queries. Hasura generates these relationships automatically. Client-side joins are slower and harder to cache. | Let consumers compose: `useProfile` + `useOwnedAssets` in the same component. Or write a single GraphQL query that uses Hasura's relationship fields. Don't pre-compose at the hook level. |

### AF-5: Do NOT Build Apollo Client / urql Adapters

| Anti-Feature                                                         | Why Avoid                                                                                                                                                                      | What to Do Instead                                                                                                                                                             |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Support for multiple GraphQL client libraries beyond graphql-request | Dramatically increases maintenance surface. The package uses graphql-request (lightweight, no framework lock-in). Supporting Apollo and urql means tripling the service layer. | Ship with graphql-request. It's 12KB, has zero dependencies beyond graphql, and works everywhere. Consumers who want Apollo can use the generated types with their own client. |

### AF-6: Do NOT Build Automatic Schema Watching/Hot Reload

| Anti-Feature                                                                               | Why Avoid                                                                                                                                                      | What to Do Instead                                                                                                                |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Runtime schema introspection, automatic type regeneration, or schema validation at startup | Adds runtime overhead, requires network access at init, and creates failure modes. Schema changes happen at deploy time (when Hasura updates), not at runtime. | Generate types at build time. Commit them. Consumers get types from npm package. Schema validation happens in CI, not at runtime. |

### AF-7: Do NOT Build a Full GraphQL Client Abstraction

| Anti-Feature                                                                        | Why Avoid                                                                                                                                                                                          | What to Do Instead                                                                                                                                                              |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A general-purpose `useGraphqlQuery()` hook that accepts arbitrary GraphQL documents | This is what `@apollo/client` and `urql` are for. Building a general-purpose GraphQL client duplicates their work. The value of this package is **domain-specific** hooks with **semantic names**. | Keep hooks domain-specific: `useProfile`, `useNft`, `useFollowers`. Not `useQuery(PROFILE_QUERY, { variables })`. The abstraction level is "LUKSO data," not "GraphQL queries." |

---

## Hook Pattern Recommendations

### Pattern 1: Hook → Service → Execute (The Layered Pattern)

**Recommended.** This is the pattern used by tRPC, the reference implementation, and most production hooks packages.

```
┌──────────────────────────────────────────┐
│  Hook Layer (React)                       │
│  useProfile({ address }) → useQuery({     │
│    queryKey: profileKeys.detail(address),  │
│    queryFn: () => profileService.get(addr) │
│  })                                        │
├──────────────────────────────────────────┤
│  Service Layer (Framework-agnostic)       │
│  profileService.get(address) → execute(   │
│    ProfileByAddressQuery, { address }     │
│  )                                         │
├──────────────────────────────────────────┤
│  Execute Layer (graphql-request)          │
│  execute(query, variables) → POST /graphql│
└──────────────────────────────────────────┘
```

**Why this pattern:**

- Services work in any context (client, server, tests)
- Hooks add only React/TanStack Query concerns
- Server actions are a thin wrapper around services
- Testing: mock at service layer, not at fetch layer

### Pattern 2: Hook Return Shape (wagmi-Style)

Every hook should return the full TanStack Query result plus `queryKey`:

```typescript
function useProfile(params: { address: string; enabled?: boolean; select?: (data: Profile) => T }) {
  const config = useIndexerConfig();
  const queryKey = profileKeys.detail(params.address);

  return {
    ...useQuery({
      queryKey,
      queryFn: () => profileService.getByAddress(config.graphqlUrl, params.address),
      enabled: params.enabled !== false && !!params.address,
      staleTime: config.staleTimes.profile,
      select: params.select,
    }),
    queryKey, // Expose for cache management
  };
}
```

### Pattern 3: Consistent Hook Options

All hooks accept the same base options for consistency:

```typescript
interface BaseHookOptions<TData, TSelected = TData> {
  enabled?: boolean; // Default: true (disabled when required params missing)
  select?: (data: TData) => TSelected; // Transform the data
  staleTime?: number; // Override default stale time
  refetchInterval?: number | false; // Polling interval
  // Full TanStack Query options passthrough via `query` prop
  query?: Partial<UseQueryOptions>;
}
```

---

## Query Domain Organization Recommendation

### Structure: Per-Domain Files with Barrel Export

```
packages/react/src/
├── config/
│   ├── context.ts              # React context for config
│   └── types.ts                # IndexerConfig type
├── provider/
│   └── LuksoIndexerProvider.tsx # Provider component
├── graphql/
│   ├── documents/              # .graphql files per domain
│   │   ├── universal-profile.graphql
│   │   ├── digital-asset.graphql
│   │   ├── nft.graphql
│   │   ├── owned-assets.graphql
│   │   ├── follow.graphql
│   │   ├── creator-addresses.graphql
│   │   ├── lsp29-encrypted-asset.graphql
│   │   ├── lsp29-feed.graphql
│   │   ├── data-changed.graphql
│   │   ├── universal-receiver.graphql
│   │   └── universal-profile-stats.graphql
│   └── generated/              # codegen output (committed)
│       ├── graphql.ts
│       └── fragment-masking.ts
├── services/
│   ├── execute.ts              # graphql-request wrapper
│   ├── universal-profile.ts
│   ├── digital-asset.ts
│   ├── nft.ts
│   ├── owned-assets.ts
│   ├── follow.ts
│   ├── creator-addresses.ts
│   ├── lsp29-encrypted-asset.ts
│   ├── lsp29-feed.ts
│   ├── data-changed.ts
│   ├── universal-receiver.ts
│   └── universal-profile-stats.ts
├── hooks/
│   ├── universal-profile.ts     # useProfile, useProfiles, useProfileSearch
│   ├── digital-asset.ts         # useDigitalAsset, useDigitalAssets
│   ├── nft.ts                   # useNft, useNfts, useNftsByCollection
│   ├── owned-assets.ts          # useOwnedAssets, useOwnedTokens
│   ├── follow.ts                # useFollowers, useFollowing, useFollowCount
│   ├── creator-addresses.ts     # useCreatorAddresses
│   ├── lsp29-encrypted-asset.ts # useEncryptedAsset, useEncryptedAssets
│   ├── lsp29-feed.ts            # useEncryptedAssetFeed
│   ├── data-changed.ts          # useDataChangedEvents
│   ├── universal-receiver.ts    # useUniversalReceiverEvents
│   └── universal-profile-stats.ts # useProfileStats
├── keys/
│   └── index.ts                 # All query key factories
├── actions/                     # Server action wrappers (Next.js)
│   ├── universal-profile.ts
│   ├── digital-asset.ts
│   └── ... (mirrors services)
├── types/
│   └── index.ts                 # Re-exported codegen types + utility types
└── index.ts                     # Barrel export
```

### Why Per-Domain Files (Not Single File or Namespace Object)

| Approach                                      | Pros                                          | Cons                                           | Verdict      |
| --------------------------------------------- | --------------------------------------------- | ---------------------------------------------- | ------------ |
| **Per-domain files** (recommended)            | Tree-shakeable, clear ownership, easy to find | More files                                     | **Use this** |
| Single `hooks.ts` file                        | Easy to find                                  | Massive file, no tree-shaking, merge conflicts | Don't use    |
| Namespace object (`hooks.profile.useProfile`) | Discoverable via autocomplete                 | Not tree-shakeable, unusual pattern, verbose   | Don't use    |

### Import Patterns for Consumers

```typescript
// Primary: individual hook imports (tree-shakeable)
import { useProfile, useFollowers } from '@chillwhales/react';

// Types
import type { UniversalProfile, DigitalAsset } from '@chillwhales/react/types';

// Cache management
import { profileKeys, assetKeys } from '@chillwhales/react/keys';

// Server-side prefetching
import { getProfileQueryOptions } from '@chillwhales/react/query';

// Provider
import { LuksoIndexerProvider } from '@chillwhales/react';
```

---

## Feature Dependencies

```
TS-1 (GraphQL Codegen)
  └──→ TS-3 (Per-Domain Hooks)  ← needs types
  └──→ TS-4 (Service Layer)     ← needs typed queries
  └──→ DF-5 (Type Exports)      ← needs generated types

TS-2 (TanStack Query + Key Factories)
  └──→ TS-3 (Per-Domain Hooks)  ← hooks use useQuery
  └──→ TS-8 (Pagination)        ← uses useInfiniteQuery
  └──→ DF-2 (Key Exports)       ← exports key factories
  └──→ DF-3 (SSR Hydration)     ← uses prefetchQuery

TS-4 (Service Layer)
  └──→ TS-3 (Per-Domain Hooks)  ← hooks call services
  └──→ DF-1 (Dual-Mode)         ← server actions call services

TS-5 (Provider) + TS-6 (Config)
  └──→ TS-3 (Per-Domain Hooks)  ← hooks read config from context

TS-7 (Error Handling)
  └──→ TS-4 (Service Layer)     ← services normalize errors
```

**Critical path:** TS-1 → TS-4 → TS-2 → TS-3 → TS-5/TS-6 → TS-7/TS-8

---

## MVP Recommendation

### v1.1 Must Ship (Table Stakes)

1. **TS-1** GraphQL codegen pipeline — types are the foundation
2. **TS-4** Service layer for all 11 domains — data access works anywhere
3. **TS-2** TanStack Query integration with key factories — caching works
4. **TS-3** Per-domain hooks — the primary consumer API
5. **TS-5** Provider with create-or-reuse pattern — setup works
6. **TS-6** Environment-driven config — deployable
7. **TS-7** Error handling — errors are intelligible
8. **TS-8** Offset pagination (top 3-4 list domains) — lists are usable

### v1.1 Should Ship (Differentiators)

9. **DF-1** Dual-mode hooks (at least for top 3 domains) — Next.js story
10. **DF-2** Query key exports — cache management
11. **DF-5** Type exports — consumer DX

### Defer to v1.2

- **DF-3** SSR hydration (docs + examples, not code changes)
- **DF-4** Select transforms (can add incrementally)
- **DF-6** Domain-specific stale times (use sensible defaults, optimize later)

---

## Sources

| Source                                                                                                                             | Confidence | How Used                                                                                       |
| ---------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| [TanStack Query v5 docs — Overview, Query Keys, Infinite Queries](https://tanstack.com/query/latest/docs/framework/react/overview) | HIGH       | Query key patterns, infinite queries API, hook return shapes                                   |
| [wagmi v3 docs — TanStack Query integration](https://wagmi.sh/react/guides/tanstack-query)                                         | HIGH       | Query key export pattern, `get<X>QueryOptions` pattern, provider setup, SSR approach           |
| [GraphQL Code Generator — React Query guide](https://the-guild.dev/graphql/codegen/docs/guides/react-query)                        | HIGH       | `client` preset with `documentMode: 'string'`, `TypedDocumentString` pattern, execute function |
| [TanStack Query — Infinite Queries](https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries)                | HIGH       | `useInfiniteQuery`, `getNextPageParam`, offset pagination pattern, `maxPages`                  |
| Reference implementation (chillwhales/marketplace)                                                                                 | HIGH       | 11 query domains, service→action→hook pattern, graphql-request usage                           |
| Existing lsp-indexer codebase (PROJECT.md, schema.graphql, ARCHITECTURE.md)                                                        | HIGH       | 72+ entity types, Hasura auto-generation, TypeORM schema, constraint documentation             |

---

_Researched: 2026-02-16_
_Confidence: HIGH — patterns verified from official documentation of TanStack Query v5, wagmi v3, and GraphQL Code Generator. Domain organization based on existing reference implementation._
