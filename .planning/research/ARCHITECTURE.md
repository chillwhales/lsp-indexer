# Architecture: packages/react Hooks Library

**Project:** LSP Indexer v1.1 — React Hooks Package
**Domain:** Publishable React hooks library for GraphQL data consumption
**Researched:** 2026-02-16
**Confidence:** HIGH (codebase analysis + official library documentation + established patterns)

---

## Executive Summary

The `packages/react` library provides type-safe React hooks for consuming LUKSO indexer data via the Hasura GraphQL API. It replaces the marketplace's fragmented pattern (mixin-based LSPIndexerClient → class services → actions → hooks) with a clean, three-layer architecture: **codegen types → service functions → hooks**.

The architecture uses **function-based services** (not classes) as the framework-agnostic core, with thin hook wrappers for client-side TanStack Query and thin action wrappers for server-side next-safe-action. Both patterns share the same services, eliminating code duplication.

The package uses **multiple entry points** (`@lsp-indexer/react`, `@lsp-indexer/react/server`) to keep server-only code (next-safe-action) out of client bundles, with `tsup` for ESM/CJS dual builds and `@graphql-codegen/client-preset` for type generation from the Hasura introspection schema.

**Key design decisions:**

1. **Function-based services over class-based** — eliminates mixin complexity, enables tree-shaking
2. **`fetch`-based GraphQL client over graphql-request** — `graphql-request` is now `graffle` (renamed, heavier); raw `fetch` with a typed wrapper is simpler, lighter, zero dependencies
3. **Multiple entry points** — `@lsp-indexer/react` (client hooks + services), `@lsp-indexer/react/server` (server actions + utilities)
4. **Parsers transform at the service layer** — raw Hasura snake_case → clean camelCase happens once in services, hooks get clean types
5. **tsup for builds** — proven, fast, handles ESM/CJS/DTS, supports multiple entry points natively

---

## Package Directory Structure

```
packages/react/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── codegen.ts                         # GraphQL codegen configuration
│
├── src/
│   ├── index.ts                       # Main entry: re-exports client hooks + services + types + provider
│   ├── server.ts                      # Server entry: re-exports server actions + utilities
│   │
│   ├── client/                        # GraphQL client setup
│   │   ├── index.ts                   # createIndexerClient(), default client
│   │   ├── client.ts                  # Typed fetch wrapper for GraphQL
│   │   └── provider.tsx               # <IndexerProvider> React context for client config
│   │
│   ├── graphql/                       # Codegen output (GENERATED — do not edit)
│   │   ├── graphql.ts                 # TypedDocumentString, fragment masking
│   │   ├── fragment-masking.ts        # Fragment utilities
│   │   └── gql.ts                     # graphql() tagged template helper
│   │
│   ├── documents/                     # GraphQL query documents per domain
│   │   ├── index.ts                   # Re-exports all documents
│   │   ├── universal-profile.ts       # UP queries
│   │   ├── digital-asset.ts           # DA queries
│   │   ├── nft.ts                     # NFT queries
│   │   ├── owned-assets.ts            # OwnedAsset/OwnedToken queries
│   │   ├── social.ts                  # Follow/Follower/Unfollow queries
│   │   ├── creator.ts                 # LSP4Creator queries
│   │   ├── lsp29.ts                   # Encrypted asset queries
│   │   ├── lsp29-feed.ts             # LSP29 feed queries
│   │   ├── data-changed.ts           # DataChanged event queries
│   │   ├── universal-receiver.ts     # UniversalReceiver event queries
│   │   └── up-stats.ts               # UP aggregate stats queries
│   │
│   ├── types/                         # Clean output types (not raw Hasura types)
│   │   ├── index.ts                   # Re-exports all types
│   │   ├── universal-profile.ts       # UniversalProfile, ProfileMetadata
│   │   ├── digital-asset.ts           # DigitalAsset, TokenMetadata
│   │   ├── nft.ts                     # NFT, NFTMetadata
│   │   ├── owned-assets.ts            # OwnedAsset, OwnedToken
│   │   ├── social.ts                  # Follow, Follower
│   │   ├── common.ts                  # Pagination, shared types
│   │   └── params.ts                  # Service function parameter types
│   │
│   ├── parsers/                       # Transform raw Hasura → clean types
│   │   ├── index.ts                   # Re-exports all parsers
│   │   ├── universal-profile.ts       # parseUniversalProfile()
│   │   ├── digital-asset.ts           # parseDigitalAsset()
│   │   ├── nft.ts                     # parseNFT()
│   │   ├── owned-assets.ts            # parseOwnedAsset()
│   │   ├── social.ts                  # parseFollow()
│   │   ├── metadata.ts               # parseLSP3Metadata(), parseLSP4Metadata()
│   │   └── utils.ts                   # camelCase helpers, null coalescing
│   │
│   ├── services/                      # Framework-agnostic query functions
│   │   ├── index.ts                   # Re-exports all services
│   │   ├── universal-profile.ts       # getUniversalProfile(), getUniversalProfiles()
│   │   ├── digital-asset.ts           # getDigitalAsset(), getDigitalAssets()
│   │   ├── nft.ts                     # getNFT(), getNFTs(), getNFTsByAsset()
│   │   ├── owned-assets.ts            # getOwnedAssets(), getOwnedTokens()
│   │   ├── social.ts                  # getFollowers(), getFollowing()
│   │   ├── creator.ts                 # getCreators(), getCreatedAssets()
│   │   ├── lsp29.ts                   # getEncryptedAssets(), getEncryptedAsset()
│   │   ├── lsp29-feed.ts             # getLSP29Feed()
│   │   ├── data-changed.ts           # getDataChangedEvents()
│   │   ├── universal-receiver.ts     # getUniversalReceiverEvents()
│   │   └── up-stats.ts               # getUPStats()
│   │
│   ├── hooks/                         # TanStack Query hooks (client-side)
│   │   ├── index.ts                   # Re-exports all hooks
│   │   ├── universal-profile.ts       # useUniversalProfile(), useUniversalProfiles()
│   │   ├── digital-asset.ts           # useDigitalAsset(), useDigitalAssets()
│   │   ├── nft.ts                     # useNFT(), useNFTs()
│   │   ├── owned-assets.ts            # useOwnedAssets(), useOwnedTokens()
│   │   ├── social.ts                  # useFollowers(), useFollowing()
│   │   ├── creator.ts                 # useCreators(), useCreatedAssets()
│   │   ├── lsp29.ts                   # useEncryptedAssets(), useEncryptedAsset()
│   │   ├── lsp29-feed.ts             # useLSP29Feed()
│   │   ├── data-changed.ts           # useDataChangedEvents()
│   │   ├── universal-receiver.ts     # useUniversalReceiverEvents()
│   │   └── up-stats.ts               # useUPStats()
│   │
│   └── server/                        # Server-side utilities (next-safe-action)
│       ├── index.ts                   # Re-exports server actions
│       ├── action-client.ts           # createActionClient() helper
│       └── actions/                   # Server action wrappers per domain
│           ├── index.ts
│           ├── universal-profile.ts   # getUniversalProfileAction()
│           ├── digital-asset.ts       # getDigitalAssetAction()
│           └── ...                    # (mirrors services/ structure)
│
├── generated/                         # Committed codegen output (outside src for clarity)
│   ├── schema.graphql                 # Introspected Hasura schema
│   └── hasura-types.ts               # Full Hasura operation types (used by documents)
│
└── test/
    ├── services/                      # Service function tests
    ├── parsers/                       # Parser unit tests
    └── hooks/                         # Hook integration tests
```

### Why This Structure

1. **`documents/` separate from `services/`** — queries define WHAT to ask, services define HOW to ask and WHAT to return. A service may compose multiple documents or add pagination logic.
2. **`parsers/` as explicit layer** — raw Hasura types have `_bool_exp`, snake_case, nullable everything. Parsers transform this into clean TypeScript types. Making this explicit (not hidden in services) ensures consistent transformation and testability.
3. **`types/` for clean output** — consumers import types from `@lsp-indexer/react` that are camelCase, non-nullable where appropriate, and documented. These are NOT the raw codegen types.
4. **`server/` behind separate entry point** — `next-safe-action` and Node.js-only code stays out of client bundles. Only importable via `@lsp-indexer/react/server`.

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    packages/react                            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Entry: @lsp-indexer/react (src/index.ts)            │   │
│  │                                                       │   │
│  │  ┌─────────────┐  ┌────────────┐  ┌──────────────┐  │   │
│  │  │   hooks/    │  │  services/ │  │   types/     │  │   │
│  │  │ TanStack Q  │──│ Pure fns   │  │ Clean types  │  │   │
│  │  └─────────────┘  └──────┬─────┘  └──────────────┘  │   │
│  │                          │                            │   │
│  │  ┌─────────────┐  ┌─────┴──────┐  ┌──────────────┐  │   │
│  │  │  client/    │  │ documents/ │  │  parsers/    │  │   │
│  │  │ Fetch wrap  │  │ GQL docs   │  │ Raw → Clean  │  │   │
│  │  └──────┬──────┘  └────────────┘  └──────────────┘  │   │
│  │         │                                             │   │
│  │  ┌──────┴──────┐                                     │   │
│  │  │  graphql/   │  (codegen output — generated)       │   │
│  │  └─────────────┘                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Entry: @lsp-indexer/react/server (src/server.ts)    │   │
│  │                                                       │   │
│  │  ┌─────────────────┐                                 │   │
│  │  │ server/actions/  │───► uses services/ from above  │   │
│  │  │ next-safe-action │                                 │   │
│  │  └─────────────────┘                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  External Dependencies:                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  packages/typeorm/schema.graphql → Hasura endpoint  │    │
│  │  (codegen source — introspects Hasura for types)    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Dependency Flow (Internal)

```
hooks/ ──────────► services/ ──────────► documents/
  │                    │                      │
  │                    │                      ▼
  │                    │                 graphql/  (codegen types)
  │                    │
  │                    ├──────────► parsers/
  │                    │                │
  │                    │                ▼
  │                    │           types/ (clean output)
  │                    │
  │                    └──────────► client/ (GraphQL fetch wrapper)
  │
  └──────────► client/provider.tsx (for QueryClient + URL context)

server/actions/ ───► services/ (reuses same services)
```

### External Dependency Map

```
packages/react depends on:
  ├── packages/typeorm/schema.graphql  (codegen source — dev time only)
  │
  ├── Peer Dependencies (user provides):
  │   ├── react ^18.0.0
  │   ├── @tanstack/react-query ^5.0.0
  │   └── next-safe-action ^7.0.0  (optional — only for server entry)
  │
  └── Direct Dependencies:
      └── (none — fetch is global, codegen output is committed)
```

---

## Data Flow: Client-Side Pattern

The primary consumption pattern. Hook calls service → service executes GraphQL → parser transforms result → hook returns clean typed data.

```
┌──────────────────────────────────────────────────────────────────┐
│  Consumer Component                                               │
│                                                                   │
│  const { data } = useUniversalProfile({ address: "0x..." });    │
│                     │                                            │
└─────────────────────┼────────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────────┐
│  hooks/universal-profile.ts                                       │
│                                                                   │
│  export function useUniversalProfile(params) {                   │
│    const client = useIndexerClient();   // from context           │
│    return useQuery({                                              │
│      queryKey: ['universal-profile', params.address],             │
│      queryFn: () => getUniversalProfile(client, params),         │
│      enabled: !!params.address,                                   │
│    });                                                            │
│  }                                                                │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  services/universal-profile.ts                                    │
│                                                                   │
│  export async function getUniversalProfile(                      │
│    client: IndexerClient,                                         │
│    params: GetUniversalProfileParams                              │
│  ): Promise<UniversalProfile> {                                  │
│    const raw = await client.execute(                              │
│      UniversalProfileDocument,     // from documents/             │
│      { address: params.address }                                  │
│    );                                                             │
│    return parseUniversalProfile(raw.universalProfile[0]);        │
│  }                                                                │
└──────────────────────┬───────────────────────────────────────────┘
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
┌─────────────────────┐  ┌────────────────────────┐
│  client/client.ts   │  │  parsers/universal-    │
│                     │  │  profile.ts            │
│  execute(doc, vars) │  │                        │
│    │                │  │  parseUniversalProfile │
│    ▼                │  │  (raw) → clean type    │
│  fetch(hasuraUrl, { │  │  - camelCase fields    │
│    body: JSON.str.. │  │  - null coalescing     │
│    headers: {       │  │  - nested parsing      │
│      x-hasura-role  │  │    (metadata, images)  │
│    }                │  │                        │
│  })                 │  └────────────────────────┘
│    │                │
│    ▼                │
│  Hasura GraphQL API │
└─────────────────────┘
```

### Detailed Data Flow

1. **Component** calls `useUniversalProfile({ address: "0x..." })`
2. **Hook** reads `IndexerClient` from React context (URL, headers configured at app root)
3. **Hook** wraps `getUniversalProfile()` service call in `useQuery()` with deterministic query key
4. **Service** calls `client.execute(UniversalProfileDocument, variables)`
5. **Client** performs `fetch(url, { method: 'POST', body: JSON.stringify({ query, variables }) })`
6. **Hasura** returns raw GraphQL response with snake_case fields, nullable everything
7. **Service** passes raw data to `parseUniversalProfile()` which:
   - Transforms snake_case → camelCase (e.g., `lsp3_profile` → `lsp3Profile`)
   - Coalesces nulls (e.g., `name?.value ?? null`)
   - Recursively parses nested objects (metadata → images, tags, links)
   - Returns clean `UniversalProfile` type
8. **Hook** returns TanStack Query result (`{ data, isLoading, error, ... }`)

---

## Data Flow: Server-Side Pattern

For Next.js App Router server components that need server-only data fetching via next-safe-action.

```
┌──────────────────────────────────────────────────────────────────┐
│  Server Component (Next.js App Router)                            │
│                                                                   │
│  const { data } = await getUniversalProfileAction({              │
│    address: "0x..."                                               │
│  });                                                              │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  server/actions/universal-profile.ts                              │
│                                                                   │
│  export const getUniversalProfileAction = actionClient           │
│    .schema(z.object({ address: z.string() }))                    │
│    .action(async ({ parsedInput }) => {                          │
│      const client = createServerClient();  // server env vars    │
│      return getUniversalProfile(client, parsedInput);            │
│    });                                                            │
│  // Uses SAME service as client-side hooks                       │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  services/universal-profile.ts  (SAME as client-side)            │
│                                                                   │
│  getUniversalProfile(client, params) → UniversalProfile          │
└──────────────────────────────────────────────────────────────────┘
                       │
                       ▼
                  Hasura GraphQL API
```

### Key Design: Service Reuse

The **services** layer is framework-agnostic. It takes an `IndexerClient` (which is just a thin typed `fetch` wrapper) and returns parsed types. This means:

- **Client-side hooks** call `service(clientFromContext, params)`
- **Server-side actions** call `service(clientFromEnvVars, params)`
- **Tests** call `service(mockClient, params)` directly

No code duplication. The service is the single source of truth for "how to query X."

---

## Type Flow

```
packages/typeorm/schema.graphql                    (entity definitions — source of truth)
        │
        ▼
Hasura auto-generates GraphQL schema               (adds _bool_exp, _order_by, aggregate, etc.)
        │
        ▼
codegen.ts introspects Hasura endpoint             (fetches full schema with Hasura types)
        │
        ▼
generated/schema.graphql                            (full introspected Hasura schema — committed)
        │
        ▼
@graphql-codegen/client-preset                     (generates TypeScript from documents)
        │
        ├──► src/graphql/graphql.ts                 (TypedDocumentString with full response types)
        │
        └──► Used by: src/documents/*.ts            (query documents use graphql() tagged template)
                │
                ▼
        Codegen infers per-document types:           (UniversalProfileQuery, UniversalProfileQueryVariables)
                │
                ▼
        services/ call client.execute(doc, vars)    (TypedDocumentString provides input/output types)
                │
                ▼
        Raw response types → parsers/               (Hasura raw types: nullable, snake_case)
                │
                ▼
        parsers/ → types/                           (Clean types: non-nullable where safe, camelCase)
                │
                ▼
        hooks/ return clean types                    (useUniversalProfile() → { data: UniversalProfile })
```

### Type Layers

| Layer                            | Example Type                       | Characteristics                                                              |
| -------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------- |
| **Hasura Raw** (codegen)         | `UniversalProfile_Bool_Exp`        | Generated, snake_case, all nullable, includes `_bool_exp`, `_order_by`       |
| **Document Response** (codegen)  | `UniversalProfileQuery`            | Generated per-document, exact shape of query response                        |
| **Clean Output** (hand-written)  | `UniversalProfile`                 | camelCase, documented, non-nullable where guaranteed, nested types flattened |
| **Hook Return** (TanStack Query) | `UseQueryResult<UniversalProfile>` | Wraps clean type in TanStack Query's loading/error states                    |

### Parser Example

```typescript
// Raw from Hasura (codegen type)
interface RawUniversalProfile {
  id: string;
  address: string;
  lsp3_profile: {
    name: { value: string | null } | null;
    description: { value: string | null } | null;
    profile_image: Array<{
      url: string | null;
      width: number | null;
      height: number | null;
    }> | null;
    tags: Array<{ value: string | null }> | null;
  } | null;
}

// Clean output type (hand-written)
interface UniversalProfile {
  id: string;
  address: string;
  name: string | null;
  description: string | null;
  profileImages: ProfileImage[];
  tags: string[];
}

// Parser function
function parseUniversalProfile(raw: RawUniversalProfile): UniversalProfile {
  const profile = raw.lsp3_profile;
  return {
    id: raw.id,
    address: raw.address,
    name: profile?.name?.value ?? null,
    description: profile?.description?.value ?? null,
    profileImages: (profile?.profile_image ?? []).map((img) => ({
      url: img.url ?? '',
      width: img.width ?? 0,
      height: img.height ?? 0,
    })),
    tags: (profile?.tags ?? []).map((t) => t.value).filter(Boolean) as string[],
  };
}
```

---

## Export Strategy

### Multiple Entry Points

```jsonc
// package.json
{
  "name": "@lsp-indexer/react",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts",
    },
    "./server": {
      "import": "./dist/server.mjs",
      "require": "./dist/server.js",
      "types": "./dist/server.d.ts",
    },
  },
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
}
```

### What Each Entry Point Exports

**`@lsp-indexer/react`** (client-safe):

```typescript
// Provider
export { IndexerProvider, type IndexerConfig } from './client/provider';
export { createIndexerClient, type IndexerClient } from './client';

// Hooks (all 11 domains)
export { useUniversalProfile, useUniversalProfiles } from './hooks/universal-profile';
export { useDigitalAsset, useDigitalAssets } from './hooks/digital-asset';
export { useNFT, useNFTs } from './hooks/nft';
export { useOwnedAssets, useOwnedTokens } from './hooks/owned-assets';
export { useFollowers, useFollowing } from './hooks/social';
export { useCreators, useCreatedAssets } from './hooks/creator';
export { useEncryptedAssets, useEncryptedAsset } from './hooks/lsp29';
export { useLSP29Feed } from './hooks/lsp29-feed';
export { useDataChangedEvents } from './hooks/data-changed';
export { useUniversalReceiverEvents } from './hooks/universal-receiver';
export { useUPStats } from './hooks/up-stats';

// Services (for advanced/custom use)
export * from './services';

// Types
export * from './types';
```

**`@lsp-indexer/react/server`** (server-only):

```typescript
// Server action helpers
export { createServerClient } from './server';
export { createActionClient } from './server/action-client';

// Pre-built actions (all 11 domains)
export { getUniversalProfileAction } from './server/actions/universal-profile';
export { getDigitalAssetAction } from './server/actions/digital-asset';
// ... etc

// Re-export services + types for direct server use
export * from './services';
export * from './types';
```

### Tree-Shaking Considerations

1. **ESM output is tree-shakeable** — tsup with `splitting: true` produces separate chunks
2. **Function-based services** are fully tree-shakeable (unlike class methods which can't be individually eliminated)
3. **Per-domain files** ensure importing `useUniversalProfile` doesn't pull in `useNFT`'s query documents
4. **`"sideEffects": false`** in package.json tells bundlers everything is safe to tree-shake

### Server-Only Import Safety

The `./server` entry point should use `import "server-only"` at the top (a Next.js convention) to cause build errors if accidentally imported in client components:

```typescript
// src/server.ts
import 'server-only'; // Build error if imported in client component

export { createServerClient } from './server/action-client';
// ...
```

This is a Next.js specific pattern but harmless for other frameworks (they won't have the `server-only` package installed, and this import is only in the server entry).

---

## GraphQL Client Configuration

### Client Architecture

```typescript
// src/client/client.ts

export interface IndexerClientConfig {
  url: string;
  headers?: Record<string, string>;
}

export interface IndexerClient {
  execute<TResult, TVariables>(
    document: TypedDocumentString<TResult, TVariables>,
    ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
  ): Promise<TResult>;
}

export function createIndexerClient(config: IndexerClientConfig): IndexerClient {
  return {
    async execute(document, ...args) {
      const [variables] = args;
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/graphql-response+json',
          ...config.headers,
        },
        body: JSON.stringify({
          query: document.toString(),
          variables: variables ?? undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      if (json.errors?.length) {
        throw new GraphQLError(json.errors);
      }

      return json.data;
    },
  };
}
```

### Why `fetch` Over graphql-request

1. **graphql-request is now "graffle"** — renamed, much heavier (extensible client framework), overkill for typed queries
2. **Zero dependencies** — `fetch` is global in all modern runtimes (Node 18+, browsers, Deno, Bun)
3. **TypedDocumentString compatibility** — `@graphql-codegen/client-preset` generates `TypedDocumentString` which is just a string wrapper; works directly with fetch
4. **Full control** — Hasura needs custom headers (`x-hasura-role`, `x-hasura-admin-secret`); trivial with fetch, requires middleware with graphql-request/graffle
5. **Bundle size** — zero bytes added vs ~15KB+ for graphql-request

### Environment Variable Handling

```typescript
// Client-side (Next.js convention)
// Consumer's next.config.js exposes NEXT_PUBLIC_INDEXER_URL
const clientUrl = process.env.NEXT_PUBLIC_INDEXER_URL ?? 'http://localhost:8080/v1/graphql';

// Server-side (not exposed to browser)
const serverUrl = process.env.INDEXER_URL ?? process.env.NEXT_PUBLIC_INDEXER_URL;
```

The package does NOT read env vars directly. Instead:

```tsx
// Consumer's app sets up the provider
<IndexerProvider url={process.env.NEXT_PUBLIC_INDEXER_URL!} headers={{ 'x-hasura-role': 'public' }}>
  <App />
</IndexerProvider>
```

### Client Instantiation Strategy

| Context                   | Strategy                    | Reason                                                     |
| ------------------------- | --------------------------- | ---------------------------------------------------------- |
| **Client-side (hooks)**   | Singleton via React Context | One client per app, shared across all hooks                |
| **Server-side (actions)** | Per-request                 | Server actions may need different auth headers per request |
| **Testing**               | Mock per test               | Each test gets isolated client                             |

---

## Provider Component

```tsx
// src/client/provider.tsx
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createIndexerClient, type IndexerClient, type IndexerClientConfig } from './client';

interface IndexerContextValue {
  client: IndexerClient;
}

const IndexerContext = createContext<IndexerContextValue | null>(null);

export function useIndexerClient(): IndexerClient {
  const ctx = useContext(IndexerContext);
  if (!ctx) throw new Error('useIndexerClient must be used within <IndexerProvider>');
  return ctx.client;
}

export interface IndexerProviderProps extends IndexerClientConfig {
  children: ReactNode;
  queryClient?: QueryClient; // Use existing QueryClient if available
}

export function IndexerProvider({ children, queryClient, ...config }: IndexerProviderProps) {
  const client = useMemo(() => createIndexerClient(config), [config.url]);
  const qc = useMemo(() => queryClient ?? new QueryClient(), [queryClient]);

  return (
    <QueryClientProvider client={qc}>
      <IndexerContext.Provider value={{ client }}>{children}</IndexerContext.Provider>
    </QueryClientProvider>
  );
}
```

**Key decisions:**

- Provider optionally wraps `QueryClientProvider` — if consumer already has one, they pass it in
- Client is memoized on URL to prevent unnecessary re-renders
- No default URL in the package — consumer must provide it (explicit > implicit)

---

## Service Layer Design

### Function-Based, Not Class-Based

The marketplace uses:

```typescript
// BAD: marketplace pattern
class LSPIndexerClient { ... }  // base with mixin
class DigitalAssetService extends IndexerService { ... }  // per-domain class
```

Problems:

- Mixins are fragile and hard to type
- Class instances can't be tree-shaken
- Constructor dependency injection is cumbersome
- Testing requires mocking class hierarchy

The new pattern:

```typescript
// GOOD: function-based
export async function getDigitalAsset(
  client: IndexerClient,
  params: GetDigitalAssetParams,
): Promise<DigitalAsset> {
  const raw = await client.execute(DigitalAssetDocument, {
    address: params.address,
    getLsp4Metadata: params.includeMetadata ?? true,
    getTransferEvents: params.includeTransfers ?? false,
  });
  return parseDigitalAsset(raw.digital_asset[0]);
}
```

Benefits:

- Pure function — testable with just a mock client
- Tree-shakeable — unused services are eliminated
- Type-safe — TypedDocumentString carries input/output types
- Composable — one service can call another without class hierarchy

### Service Function Signature Convention

Every service follows the same pattern:

```typescript
export async function get[Entity](
  client: IndexerClient,
  params: Get[Entity]Params
): Promise<[CleanType]>;

export async function get[Entities](
  client: IndexerClient,
  params: Get[Entities]Params
): Promise<{ items: [CleanType][]; totalCount: number }>;
```

- First arg is always `IndexerClient` (dependency injection via parameter, not constructor)
- Second arg is always a typed params object
- Return type is always a clean type (not raw Hasura type)
- List queries always return `{ items, totalCount }` for pagination

### How @include Directives Map

The marketplace queries use `@include(if: $getLsp4Metadata)` etc. to conditionally fetch nested data. This maps to service params:

```typescript
interface GetDigitalAssetParams {
  address: string;
  includeMetadata?: boolean; // → $getLsp4Metadata @include
  includeTransfers?: boolean; // → $getTransferEvents @include
  includeCreators?: boolean; // → $getLsp4Creators @include
  includeOwnedAssets?: boolean; // → $getOwnedAssets @include
}
```

Services convert these boolean params to GraphQL variables, keeping the API clean for consumers.

---

## Build Configuration

### tsup.config.ts

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    server: 'src/server.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  external: ['react', '@tanstack/react-query', 'next-safe-action', 'zod', 'server-only'],
  treeshake: true,
});
```

### package.json (Build-Relevant Fields)

```jsonc
{
  "name": "@lsp-indexer/react",
  "version": "0.1.0",
  "description": "Type-safe React hooks for LUKSO indexer data",
  "license": "MIT",
  "sideEffects": false,

  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.mts", "default": "./dist/index.mjs" },
      "require": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
    },
    "./server": {
      "import": { "types": "./dist/server.d.mts", "default": "./dist/server.mjs" },
      "require": { "types": "./dist/server.d.ts", "default": "./dist/server.js" },
    },
  },
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "files": ["dist"],

  "scripts": {
    "build": "tsup",
    "clean": "rm -rf dist/",
    "codegen": "graphql-codegen --config codegen.ts",
    "codegen:watch": "graphql-codegen --config codegen.ts --watch",
    "test": "vitest run",
    "test:watch": "vitest",
  },

  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "@tanstack/react-query": "^5.0.0",
  },
  "peerDependenciesMeta": {
    "next-safe-action": { "optional": true },
    "zod": { "optional": true },
  },

  "devDependencies": {
    "@graphql-codegen/cli": "^5.0.0",
    "@graphql-codegen/client-preset": "^4.0.0",
    "@graphql-codegen/schema-ast": "^4.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.9.2",
    "vitest": "^2.1.8",
  },
}
```

### GraphQL Codegen Configuration

```typescript
// codegen.ts
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  // Introspect from Hasura endpoint (or use local schema file)
  schema: [
    {
      [process.env.HASURA_GRAPHQL_ENDPOINT ?? 'http://localhost:8080/v1/graphql']: {
        headers: {
          'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET ?? '',
        },
      },
    },
  ],
  documents: ['src/documents/**/*.ts'],
  ignoreNoDocuments: true,
  generates: {
    // TypedDocumentString types from documents
    './src/graphql/': {
      preset: 'client',
      config: {
        documentMode: 'string', // String mode — no graphql-tag dependency
        scalars: {
          DateTime: 'string',
          BigInt: 'string',
          Int: 'number',
          Float: 'number',
        },
      },
    },
    // Schema file for reference (committed)
    './generated/schema.graphql': {
      plugins: ['schema-ast'],
      config: {
        includeDirectives: true,
      },
    },
  },
};

export default config;
```

### Why These Codegen Choices

1. **`documentMode: 'string'`** — No runtime `graphql-tag` dependency. The `graphql()` function returns a `TypedDocumentString` (just a string with type information). Works directly with our fetch-based client.
2. **`client` preset** — The modern recommended approach. Generates types per-document (not per-schema-type). Only generates types for fields you actually query.
3. **`scalars` mapping** — Hasura's `DateTime` and `BigInt` come as strings. Map them explicitly rather than importing scalar packages.
4. **Schema introspection from Hasura** — Not from `packages/typeorm/schema.graphql` directly, because Hasura adds `_bool_exp`, `_order_by`, `aggregate` types that TypeORM's schema doesn't have. Codegen needs the full Hasura schema.

---

## Build Order for Implementation

### Phase Dependencies

```
Phase 1: Foundation
  ├── Package scaffolding (package.json, tsconfig, tsup)
  ├── GraphQL codegen pipeline
  └── Client module (fetch wrapper, types)
      │
      ▼
Phase 2: Core Services (per domain)
  ├── Query documents for each of 11 domains
  ├── Parser functions for each domain
  ├── Clean type definitions
  └── Service functions for each domain
      │
      ▼
Phase 3: React Layer
  ├── Provider component (IndexerProvider)
  ├── TanStack Query hooks for all 11 domains
  └── Client-side integration tests
      │
      ▼
Phase 4: Server Layer
  ├── Server action client helper
  ├── next-safe-action wrappers for all 11 domains
  └── Server-side integration tests
      │
      ▼
Phase 5: Polish
  ├── Build verification (ESM/CJS/types)
  ├── Tree-shaking verification
  ├── Documentation and examples
  └── Package publish configuration
```

### What Must Exist Before What

| Component                  | Depends On                                        | Reason                                   |
| -------------------------- | ------------------------------------------------- | ---------------------------------------- |
| `codegen.ts`               | Running Hasura endpoint                           | Introspects schema for types             |
| `src/graphql/` (generated) | `codegen.ts` + `src/documents/`                   | Codegen reads documents, generates types |
| `src/documents/`           | Hasura schema knowledge                           | Query documents reference Hasura types   |
| `src/types/`               | `src/graphql/`                                    | Clean types mirror raw types             |
| `src/parsers/`             | `src/graphql/` + `src/types/`                     | Transforms raw → clean                   |
| `src/client/`              | `src/graphql/`                                    | Client uses TypedDocumentString          |
| `src/services/`            | `src/client/` + `src/documents/` + `src/parsers/` | Composes all three                       |
| `src/hooks/`               | `src/services/` + `src/client/provider.tsx`       | Wraps services in TanStack Query         |
| `src/server/`              | `src/services/`                                   | Wraps services in next-safe-action       |
| `tsup` build               | All source files                                  | Bundles everything                       |

### Suggested Implementation Sequence (Vertical Slice)

Rather than building all documents, then all parsers, then all services, use a **vertical slice** approach per domain:

1. **Start with Universal Profile** (simplest, most used):
   - Write `documents/universal-profile.ts`
   - Run codegen → generates types
   - Write `types/universal-profile.ts`
   - Write `parsers/universal-profile.ts`
   - Write `services/universal-profile.ts`
   - Write `hooks/universal-profile.ts`
   - Test end-to-end
2. **Then Digital Asset** (adds complexity: @include directives)
3. **Then NFT** (adds complexity: token-level queries)
4. **Then remaining 8 domains** (follow established pattern)

This way, the pattern is validated early on one domain before replicating across all 11.

---

## Integration with Existing Monorepo

### New vs Modified Components

| Component                         | Status                        | Notes                          |
| --------------------------------- | ----------------------------- | ------------------------------ |
| `packages/react/`                 | **NEW**                       | Entire package is new          |
| `pnpm-workspace.yaml`             | Already includes `packages/*` | No change needed               |
| `packages/typeorm/schema.graphql` | **READ-ONLY**                 | Source of truth, not modified  |
| Root `package.json`               | May add `codegen` script      | Optional convenience script    |
| Root `tsconfig.json`              | No change                     | React package has own tsconfig |

### Monorepo Workspace Integration

The package is automatically included in the pnpm workspace because `pnpm-workspace.yaml` already specifies `packages/*`. To use it from another package or app within the monorepo:

```jsonc
// In consumer's package.json
{
  "dependencies": {
    "@lsp-indexer/react": "workspace:*",
  },
}
```

### Build Order in Monorepo

```
packages/abi (no deps)
    ↓
packages/typeorm (depends on abi indirectly — uses schema.graphql)
    ↓
packages/react (dev-time: introspects Hasura which reads typeorm schema)
```

The React package does NOT depend on `packages/typeorm` at runtime. The dependency is **dev-time only**: codegen introspects the Hasura endpoint, which auto-generates its schema from the PostgreSQL tables created by TypeORM entities.

---

## Anti-Patterns to Avoid

### 1. Class-Based Services with Mixins

**Don't:**

```typescript
class LSPIndexerClient extends DigitalAssetMixin(UniversalProfileMixin(BaseClient)) {}
```

**Why bad:** Untypeable beyond 2-3 mixins, impossible to tree-shake, testing nightmare.
**Do:** Function-based services with `IndexerClient` as first parameter.

### 2. Hooks That Directly Execute GraphQL

**Don't:**

```typescript
function useUniversalProfile(address: string) {
  return useQuery({
    queryKey: ['up', address],
    queryFn: async () => {
      const res = await fetch(url, { body: ... });
      const data = await res.json();
      return data.data.universalProfile;  // raw Hasura type leaks
    }
  });
}
```

**Why bad:** Query logic duplicated in every hook. Raw types leak to consumers. Can't reuse on server.
**Do:** Hook calls service → service handles fetch + parse.

### 3. Circular Dependencies Between Parsers

**Don't:**

```typescript
// parsers/universal-profile.ts
import { parseDigitalAsset } from './digital-asset';

// parsers/digital-asset.ts
import { parseUniversalProfile } from './universal-profile';
```

**Why bad:** Circular dependency causes runtime issues with ESM.
**Do:** Keep parsers independent. If both need shared logic, extract to `parsers/utils.ts`.

### 4. Server-Only Code in Main Entry Point

**Don't:**

```typescript
// src/index.ts
export { createActionClient } from './server/action-client'; // imports 'server-only'
```

**Why bad:** Client bundles fail because `server-only` throws in browser. Even tree-shaking can't help if the import exists in the entry point.
**Do:** Server code goes ONLY in `src/server.ts` entry point.

### 5. Hardcoding GraphQL URL

**Don't:**

```typescript
const client = createIndexerClient({
  url: 'https://indexer.myapp.com/v1/graphql',
});
```

**Why bad:** Package becomes app-specific. Can't be published.
**Do:** Consumer provides URL via `<IndexerProvider url={...}>` or `createServerClient({ url: process.env.INDEXER_URL })`.

### 6. Giant All-Fields Queries

**Don't:** Write one mega-query per domain that fetches every field and relation.
**Why bad:** Hasura sends massive payloads. Even with `@include`, the query itself is huge.
**Do:** Use targeted queries: `getUniversalProfile` (with metadata), `getUniversalProfileMinimal` (just address + name). The `@include` pattern from the marketplace is good — keep it.

---

## Scalability Considerations

| Concern            | At 1 app (internal)         | At 10 apps (published)                      | At scale                           |
| ------------------ | --------------------------- | ------------------------------------------- | ---------------------------------- |
| **Query patterns** | Fixed 11 domains, all known | Same domains, varied usage patterns         | May need query customization hooks |
| **Bundle size**    | Doesn't matter              | Tree-shaking critical                       | Per-domain code splitting          |
| **Schema changes** | Just re-run codegen         | Semver: new fields = minor, removed = major | Automated codegen in CI            |
| **Caching**        | Default TanStack Query      | Consumer configures stale times             | Consider query key factory pattern |
| **Error handling** | Simple throw                | Structured error types                      | Retry logic in client              |

---

## Sources

- **TanStack Query v5 Docs:** https://tanstack.com/query/latest (HIGH confidence — official)
- **GraphQL Codegen Client Preset:** https://the-guild.dev/graphql/codegen/docs/guides/react-query (HIGH confidence — official)
- **GraphQL Codegen Config:** https://the-guild.dev/graphql/codegen/docs/config-reference/codegen-config (HIGH confidence — official)
- **tsup Documentation:** https://tsup.egoist.dev/ (HIGH confidence — official)
- **graphql-request → Graffle rename:** https://github.com/graffle-js/graffle (HIGH confidence — official repo)
- **Hasura GraphQL Engine:** https://hasura.io/docs (HIGH confidence — auto-schema generation pattern)
- **Codebase analysis:** `packages/typeorm/schema.graphql` (925 lines, 72+ entity types) (HIGH confidence — direct)
- **Monorepo patterns:** Existing `packages/abi/package.json`, `packages/typeorm/package.json` (HIGH confidence — direct)
- **Next.js App Router patterns:** `server-only` import, React Server Components (HIGH confidence — established pattern)
- **Package.json exports:** Node.js conditional exports documentation (HIGH confidence — official spec)

---

_Researched: 2026-02-16_
_Confidence: HIGH — Architecture derived from direct codebase analysis of existing monorepo patterns, official library documentation (TanStack Query v5, GraphQL Codegen client preset, tsup), and established React hooks package conventions. The marketplace reference implementation provides concrete patterns to improve upon._
