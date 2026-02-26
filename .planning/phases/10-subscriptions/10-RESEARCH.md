# Phase 10: Subscriptions - Research

**Researched:** 2026-02-26
**Domain:** WebSocket subscriptions via graphql-ws, Hasura real-time, TanStack Query cache integration
**Confidence:** HIGH

## Summary

Phase 10 adds real-time WebSocket subscription hooks for all 11 domains using `graphql-ws` to connect to Hasura's native subscription support. The architecture introduces subscription GraphQL documents (mirroring query documents but with `subscription` operation type), a shared WebSocket client singleton managed via React context, and 11 `use*Subscription` hooks that are standalone React hooks (NOT TanStack Query hooks) with optional cache invalidation.

The codebase already has all foundational pieces in place: env helpers for WS URLs (`getClientWsUrl`, `getServerWsUrl`), parsers for all 11 domains, query key factories for cache invalidation, and the `IndexerError` class. The Hasura schema's `subscription_root` mirrors the `query_root` exactly — same table names, same `where`/`order_by`/`limit`/`offset` arguments — so subscription documents can reuse the same Hasura types and parsers.

**Primary recommendation:** Build a `SubscriptionClient` singleton class in `@lsp-indexer/react` that wraps `graphql-ws`'s `createClient`, manages lazy connection lifecycle, and exposes connection state. Subscription hooks use `useSyncExternalStore` to subscribe to this client's state, and `client.subscribe()` (sink-based API) for receiving data. Subscription documents go in `@lsp-indexer/node/src/documents/subscriptions/` as raw string templates (NOT codegen — subscriptions use the same Hasura types as queries).

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- List-level subscription hooks for all 11 domains — NOT per-entity hooks
- Filters are optional — consumer controls scope from global firehose down to single-entity watch
- Always return full type — no `include` parameter on subscription hooks. One subscription document per domain.
- Limit with sensible default (~10), fixed newest-first sort (block-order desc for event domains, timestamp desc for entity domains). No sort parameter exposed.
- Same filter types as query hooks — `EncryptedAssetFilter`, `ProfileFilter`, etc.
- `invalidate` flag on each hook (default `false`) — subscriptions are a data stream by default
- `onData` callback for custom reactions
- When `invalidate: true`, two-tier invalidation: precise detail key for the specific entity + broad list keys for the domain
- `enabled` option (default `true`)
- Hook return shape: `{ data, isConnected, isSubscribed, error }` — lean standalone React hooks, NOT TanStack Query hooks
- `data: T[] | null` — live subscription results
- `isConnected: boolean` — WebSocket to Hasura is open
- `isSubscribed: boolean` — this specific subscription is active and receiving
- `error: IndexerError | null` — typed error with network/GraphQL/permission categories
- Declarative lifecycle only — `enabled` + mount/unmount controls subscription. No imperative methods.
- Hook input shape: `filter?`, `limit?` (~10 default), `enabled?` (true), `invalidate?` (false), `onData?`, `onReconnect?`
- Lazy WebSocket connection — opens when first subscription hook mounts with `enabled: true`, closes when last subscription unmounts. Zero overhead when subscriptions aren't used.
- Infinite retry with exponential backoff on disconnect — `graphql-ws` built-in behavior. Never gives up.
- Automatic resubscribe on reconnect — all active subscriptions silently re-establish.
- On reconnect: cache invalidation only fires if consumer set `invalidate: true`. `onReconnect` callback fires regardless.
- WebSocket URL auto-derived from HTTP URL (swap `https://` → `wss://`). Optional override via `NEXT_PUBLIC_INDEXER_WS_URL` env var (client) and `INDEXER_WS_URL` env var (server).

### Claude's Discretion

- Internal WebSocket client singleton pattern (how the shared connection is managed across hooks)
- Subscription document structure (GraphQL subscription syntax for Hasura)
- Exact exponential backoff timing (graphql-ws defaults are fine)
- Hook internal state management (useState/useRef/useSyncExternalStore)
- Default limit value (around 10, exact number flexible)
- Which package each piece lives in (subscription documents in node, hooks in react, etc.)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core

| Library                 | Version                                  | Purpose                                    | Why Standard                                                                                                                                   |
| ----------------------- | ---------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `graphql-ws`            | ^6.0.0 (latest 6.x)                      | WebSocket client for GraphQL subscriptions | Official graphql-transport-ws protocol client; zero-dependency; lazy connection; built-in reconnection; Hasura natively supports this protocol |
| `@tanstack/react-query` | ^5.0.0 (existing peer dep)               | Cache invalidation target                  | Already used by all query hooks; `queryClient.invalidateQueries()` API for subscription-driven cache freshness                                 |
| `react`                 | ^18.0.0 \|\| ^19.0.0 (existing peer dep) | React hooks runtime                        | Already peer dependency of `@lsp-indexer/react`                                                                                                |

### Supporting

| Library              | Version      | Purpose                                 | When to Use                                                             |
| -------------------- | ------------ | --------------------------------------- | ----------------------------------------------------------------------- |
| `@lsp-indexer/types` | workspace:\* | Filter types, error types, domain types | All subscription hook parameter types and return types                  |
| `@lsp-indexer/node`  | workspace:\* | Parsers, query keys, env helpers        | Parse subscription data, invalidate cache via key factories, get WS URL |

### Alternatives Considered

| Instead of             | Could Use                    | Tradeoff                                                                                                                                                                                 |
| ---------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `graphql-ws`           | `subscriptions-transport-ws` | DEPRECATED — uses different protocol; Hasura supports both but recommends `graphql-ws` protocol                                                                                          |
| Custom singleton       | React context provider       | Provider adds wrapping boilerplate; singleton is simpler for lazy connection. **Recommendation: Use both** — singleton for client management, context for providing `queryClient` access |
| `useSyncExternalStore` | `useState` + `useEffect`     | `useSyncExternalStore` is the React-blessed way to subscribe to external stores; avoids tearing in concurrent mode                                                                       |

**Installation:**

```bash
pnpm add graphql-ws --filter @lsp-indexer/react
```

**Note:** `graphql-ws` must be a regular dependency (not peerDependency) of `@lsp-indexer/react` because it's an internal implementation detail — consumers don't interact with it directly.

## Architecture Patterns

### Recommended Project Structure

```
packages/react/src/
├── hooks/                           # Existing query hooks (unchanged)
│   ├── profiles.ts
│   ├── ...11 domain files...
├── subscriptions/                   # NEW — subscription system
│   ├── client.ts                    # SubscriptionClient singleton class
│   ├── context.ts                   # React context for subscription client + queryClient
│   ├── provider.tsx                 # IndexerSubscriptionProvider component
│   ├── use-subscription.ts          # Core generic useSubscription hook
│   ├── documents.ts                 # Subscription document strings (all 11 domains)
│   ├── profiles.ts                  # useProfileSubscription (thin wrapper)
│   ├── digital-assets.ts            # useDigitalAssetSubscription
│   ├── nfts.ts                      # useNftSubscription
│   ├── owned-assets.ts              # useOwnedAssetSubscription
│   ├── owned-tokens.ts              # useOwnedTokenSubscription
│   ├── followers.ts                 # useFollowerSubscription
│   ├── creators.ts                  # useCreatorSubscription
│   ├── issued-assets.ts             # useIssuedAssetSubscription
│   ├── encrypted-assets.ts          # useEncryptedAssetSubscription
│   ├── data-changed-events.ts       # useDataChangedEventSubscription
│   ├── token-id-data-changed-events.ts  # useTokenIdDataChangedEventSubscription
│   └── universal-receiver-events.ts     # useUniversalReceiverEventSubscription
├── index.ts                         # Updated to export subscription hooks
```

### Pattern 1: SubscriptionClient Singleton (Claude's Discretion)

**What:** A class that wraps `graphql-ws`'s `createClient` and adds connection state tracking, subscriber counting for lazy lifecycle, and reconnection event propagation.

**Why:** `graphql-ws` is already lazy by default (`lazy: true`) and handles reconnection, but we need to:

1. Track `isConnected` state for hook consumers
2. Count active subscriptions for lazy close when all unmount
3. Derive WS URL from HTTP URL with fallback to env var
4. Fire `onReconnect` callbacks

**Example:**

```typescript
// packages/react/src/subscriptions/client.ts
import { createClient, type Client } from 'graphql-ws';
import { getClientWsUrl } from '@lsp-indexer/node';

type ConnectionState = 'disconnected' | 'connecting' | 'connected';
type Listener = () => void;

export class SubscriptionClient {
  private client: Client | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private listeners: Set<Listener> = new Set();
  private reconnectCallbacks: Set<() => void> = new Set();
  private subscriptionCount = 0;
  private url: string;

  constructor(url?: string) {
    // URL from explicit param, env var, or derived from HTTP URL
    this.url = url ?? getClientWsUrl();
  }

  /** Get or lazily create the graphql-ws client */
  private getClient(): Client {
    if (!this.client) {
      let abruptlyClosed = false;
      this.client = createClient({
        url: this.url,
        lazy: true, // graphql-ws default
        lazyCloseTimeout: 3000, // 3s grace period before closing idle connection
        retryAttempts: Infinity, // Never give up
        shouldRetry: () => true, // Retry on all non-fatal close events
        on: {
          connecting: () => {
            this.setConnectionState('connecting');
          },
          connected: () => {
            const wasReconnect = abruptlyClosed;
            abruptlyClosed = false;
            this.setConnectionState('connected');
            if (wasReconnect) {
              this.reconnectCallbacks.forEach((cb) => cb());
            }
          },
          closed: (event) => {
            this.setConnectionState('disconnected');
            if ((event as CloseEvent).code !== 1000) {
              abruptlyClosed = true;
            }
          },
        },
      });
    }
    return this.client;
  }

  private setConnectionState(state: ConnectionState) {
    this.connectionState = state;
    this.notify();
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  /** Subscribe to connection state changes (for useSyncExternalStore) */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Get current connection state snapshot (for useSyncExternalStore) */
  getSnapshot(): ConnectionState {
    return this.connectionState;
  }

  get isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  /** Register a reconnect callback, returns unregister function */
  onReconnect(cb: () => void): () => void {
    this.reconnectCallbacks.add(cb);
    return () => this.reconnectCallbacks.delete(cb);
  }

  /** Execute a subscription via graphql-ws sink API */
  executeSubscription<TData>(
    payload: { query: string; variables?: Record<string, unknown> },
    sink: {
      next: (value: { data?: TData; errors?: Array<{ message: string }> }) => void;
      error: (error: unknown) => void;
      complete: () => void;
    },
  ): () => void {
    this.subscriptionCount++;
    const client = this.getClient();
    const unsubscribe = client.subscribe(payload, sink);

    return () => {
      unsubscribe();
      this.subscriptionCount--;
    };
  }

  /** Dispose the entire client (for cleanup) */
  dispose(): void {
    this.client?.dispose();
    this.client = null;
    this.connectionState = 'disconnected';
  }
}
```

### Pattern 2: WS URL Derivation

**What:** Auto-derive WebSocket URL from HTTP URL by swapping the protocol.

**Important detail:** The env helpers `getClientWsUrl()` and `getServerWsUrl()` already exist in `@lsp-indexer/node/src/client/env.ts` and throw `IndexerError` if the env vars are not set. However, per the user decision, the WS URL should be auto-derived from the HTTP URL if the dedicated env var is not set.

**Recommendation:** Add a `getClientWsUrlOrDerive()` helper that:

1. Tries `NEXT_PUBLIC_INDEXER_WS_URL` first
2. Falls back to deriving from `NEXT_PUBLIC_INDEXER_URL` (`https://` → `wss://`, `http://` → `ws://`)

```typescript
export function getClientWsUrlOrDerive(): string {
  // Try dedicated WS env var first
  const wsUrl = process.env.NEXT_PUBLIC_INDEXER_WS_URL;
  if (wsUrl) {
    try {
      new URL(wsUrl);
      return wsUrl;
    } catch {
      /* fall through */
    }
  }
  // Derive from HTTP URL
  const httpUrl = getClientUrl(); // throws if not set
  return httpUrl.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');
}
```

### Pattern 3: Subscription Document Structure (Hasura-specific)

**What:** Hasura subscriptions use the EXACT same field selection and arguments as queries, but with `subscription` operation type.

**Critical finding:** Hasura's `subscription_root` mirrors `query_root` exactly. Every table in query_root has a matching entry in subscription_root with identical arguments (`where`, `order_by`, `limit`, `offset`). This means subscription documents are structurally identical to query documents, just with `subscription` keyword.

**However:** The subscription documents should be MUCH simpler than query documents because:

1. **No `include` parameter** — subscriptions always return full types
2. **Fixed sort** — newest-first (block_number desc for events, no sort for entities)
3. **Simpler fields** — select base fields + relationships without conditional `@include` directives

**Document approach:** Write subscription documents as raw template literal strings (not using the `graphql()` tagged template from codegen). Reasoning:

- Codegen `graphql()` function maps to the `Documents` type map which only contains query operations
- Subscription documents would need codegen to process `subscription` operations, requiring codegen config changes
- Since subscription hooks parse data with the existing domain parsers (which accept raw Hasura types), we don't need codegen type inference — we can type the response manually
- Raw strings are simpler and avoid codegen coupling

```typescript
// packages/react/src/subscriptions/documents.ts

// Hasura subscription for Universal Profiles
export const ProfileSubscriptionDocument = `
  subscription ProfileSubscription(
    $where: universal_profile_bool_exp
    $order_by: [universal_profile_order_by!]
    $limit: Int
  ) {
    universal_profile(where: $where, order_by: $order_by, limit: $limit) {
      id
      address
      lsp3Profile {
        name { value }
        description { value }
        tags { value }
        links { title url }
        avatar { url file_type verification_method verification_data }
        profileImage { url width height verification_method verification_data }
        backgroundImage { url width height verification_method verification_data }
      }
      followedBy_aggregate { aggregate { count } }
      followed_aggregate { aggregate { count } }
    }
  }
`;
```

**IMPORTANT:** Subscription documents ALWAYS include all fields (no `@include` directives) because the decision locks "always return full type."

### Pattern 4: Generic useSubscription Hook (Core Pattern)

**What:** A reusable internal hook that handles the subscription lifecycle, state management, and optional cache invalidation.

```typescript
// packages/react/src/subscriptions/use-subscription.ts
import { useSyncExternalStore, useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { IndexerErrorOptions } from '@lsp-indexer/types';
import { IndexerError } from '@lsp-indexer/node';

interface UseSubscriptionOptions<TRaw, TParsed> {
  document: string;
  variables: Record<string, unknown>;
  parser: (raw: TRaw[]) => TParsed[];
  enabled?: boolean;
  invalidate?: boolean;
  invalidateKeys?: readonly (readonly unknown[])[];
  onData?: (data: TParsed[]) => void;
  onReconnect?: () => void;
}

interface UseSubscriptionReturn<T> {
  data: T[] | null;
  isConnected: boolean;
  isSubscribed: boolean;
  error: IndexerError | null;
}
```

The hook uses:

- `useSyncExternalStore` to read `isConnected` from `SubscriptionClient`
- `useEffect` to establish/teardown the subscription when `enabled` changes or component mounts/unmounts
- `useState` for `data`, `isSubscribed`, and `error`
- `useQueryClient()` to get the `QueryClient` for cache invalidation when `invalidate: true`
- `useRef` for stable callback references

### Pattern 5: Domain Subscription Hook (Thin Wrapper)

**What:** Each domain gets a thin wrapper around `useSubscription` that:

1. Builds the `where` clause from filter (reusing existing service `buildXWhere` functions)
2. Sets the default sort (newest-first)
3. Passes the correct document and parser
4. Computes invalidation keys from the domain's key factory

```typescript
// packages/react/src/subscriptions/profiles.ts
import type { Profile, ProfileFilter } from '@lsp-indexer/types';
import { profileKeys, parseProfile } from '@lsp-indexer/node';
import { ProfileSubscriptionDocument } from './documents';
import { useSubscription } from './use-subscription';

const DEFAULT_LIMIT = 10;

interface UseProfileSubscriptionParams {
  filter?: ProfileFilter;
  limit?: number;
  enabled?: boolean;
  invalidate?: boolean;
  onData?: (data: Profile[]) => void;
  onReconnect?: () => void;
}

export function useProfileSubscription(
  params: UseProfileSubscriptionParams = {},
): UseSubscriptionReturn<Profile> {
  const {
    filter,
    limit = DEFAULT_LIMIT,
    enabled = true,
    invalidate = false,
    onData,
    onReconnect,
  } = params;

  // Build Hasura where clause from filter
  const variables = buildProfileSubscriptionVars(filter, limit);

  return useSubscription({
    document: ProfileSubscriptionDocument,
    variables,
    parser: (raw) => raw.map((r) => parseProfile(r)),
    enabled,
    invalidate,
    invalidateKeys: invalidate
      ? [
          profileKeys.all, // Broad invalidation for all profile queries
        ]
      : undefined,
    onData,
    onReconnect,
  });
}
```

### Pattern 6: Cache Invalidation Strategy

**What:** When `invalidate: true`, subscription data triggers TanStack Query cache invalidation.

**Two-tier invalidation (per user decision):**

1. **Broad list invalidation** — `queryClient.invalidateQueries({ queryKey: domainKeys.all })` — invalidates all list/detail/infinite queries for the domain
2. **Precise detail invalidation** — For entity domains (profiles, digital-assets, nfts, owned-assets, owned-tokens), extract the entity identifier from subscription data and invalidate the specific detail key

```typescript
// Inside useSubscription, on data received:
if (invalidate && queryClient && invalidateKeys) {
  for (const key of invalidateKeys) {
    queryClient.invalidateQueries({ queryKey: key });
  }
}
```

**TanStack Query behavior:** `invalidateQueries` only triggers refetch for queries that are currently observed (have active `useQuery` consumers). Stale queries in cache are marked as stale but not refetched until next observation. This aligns perfectly with the subscription model.

### Anti-Patterns to Avoid

- **Don't use `useQuery` for subscriptions** — Subscription data is push-based, not pull-based. Wrapping in `useQuery` adds unnecessary caching/stale-while-revalidate semantics.
- **Don't create multiple WebSocket connections** — One connection per app, shared across all subscription hooks. graphql-ws multiplexes subscriptions over a single connection.
- **Don't use `setQueryData` for subscription updates** — The decision says `invalidate`, not `update`. Invalidation triggers a fresh fetch, which is simpler and avoids cache structure mismatches between subscription data shape and query data shape (subscriptions have no `totalCount`, no pagination).
- **Don't use codegen `graphql()` for subscription documents** — The existing codegen setup only processes query operations. Adding subscription support to codegen would require schema changes and adds complexity for minimal benefit since we manually type the response.
- **Don't expose the graphql-ws client directly** — It's an internal implementation detail of `@lsp-indexer/react`.

## Don't Hand-Roll

| Problem                      | Don't Build                 | Use Instead                                                           | Why                                                                                                |
| ---------------------------- | --------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| WebSocket protocol handling  | Custom WebSocket wrapper    | `graphql-ws`'s `createClient`                                         | Handles graphql-transport-ws protocol, connection_init/ack, subscription management, multiplexing  |
| Reconnection with backoff    | Custom retry logic          | `graphql-ws`'s built-in `retryAttempts` + `shouldRetry` + `retryWait` | Default randomized exponential backoff; handles fatal vs non-fatal close codes                     |
| Cache invalidation matching  | Custom key matching         | TanStack Query's `invalidateQueries` with `queryKey` prefix matching  | Hierarchical key matching is built-in (e.g., `['profiles']` matches `['profiles', 'detail', ...]`) |
| External store subscription  | Custom event emitter        | React's `useSyncExternalStore`                                        | React 18+ blessed API for subscribing to external state without tearing                            |
| Hasura where clause building | New filter → where builders | Existing `buildProfileWhere`, etc. from services                      | Already handles all filter types, LIKE escaping, AND composition                                   |
| Data parsing                 | New subscription parsers    | Existing `parseProfile`, `parseProfiles`, etc.                        | Hasura subscription responses have identical structure to query responses                          |

**Key insight:** The subscription system is mostly glue code — connecting graphql-ws (which handles WebSocket complexity) to React hooks (which handle component lifecycle) to TanStack Query (which handles cache invalidation). Very little novel logic is needed.

## Common Pitfalls

### Pitfall 1: Hasura Subscription vs Live Query Confusion

**What goes wrong:** Assuming Hasura subscriptions push individual change events. They don't — Hasura live queries re-execute the full query periodically and push the complete result set each time.
**Why it happens:** Mental model from Firestore/Supabase realtime where you get individual inserts/updates/deletes.
**How to avoid:** Understand that each subscription `next` event contains the FULL current result set (not a delta). This means `data` in the hook is always the complete array, not an append.
**Warning signs:** Trying to merge/diff subscription results or accumulate them.

### Pitfall 2: Subscription Document Must Use `subscription` Keyword

**What goes wrong:** Using `query` keyword in a document sent via WebSocket subscription.
**Why it happens:** Copy-pasting from existing query documents.
**How to avoid:** Subscription documents MUST start with `subscription { ... }`, not `query { ... }`. Hasura validates the operation type.
**Warning signs:** Hasura returns an error about invalid operation type.

### Pitfall 3: Connection State Race Conditions

**What goes wrong:** `isConnected` and `isSubscribed` get out of sync, or hooks report wrong state during rapid mount/unmount.
**Why it happens:** WebSocket events are async; React renders may interleave with connection state changes.
**How to avoid:** Use `useSyncExternalStore` for `isConnected` (safe in concurrent mode). Use `useRef` for subscription-active flag to avoid stale closures.
**Warning signs:** Flashing `isConnected: false` on first render even when connection is established.

### Pitfall 4: graphql-ws `lazy: true` Already Handles Lazy Connection

**What goes wrong:** Building custom lazy connection logic on top of graphql-ws which is already lazy by default.
**Why it happens:** Not reading the docs carefully.
**How to avoid:** `graphql-ws` with `lazy: true` (the default) only connects when the first subscription is made and disconnects after the last subscription completes (respecting `lazyCloseTimeout`). We just need to ensure our singleton creates the client once and reuses it.
**Warning signs:** Duplicate WebSocket connections in devtools.

### Pitfall 5: Missing QueryClient in Subscription Context

**What goes wrong:** `useQueryClient()` throws because subscription hooks are rendered outside `QueryClientProvider`.
**Why it happens:** Subscription hooks optionally call `useQueryClient()` for cache invalidation.
**How to avoid:** Only call `useQueryClient()` when `invalidate: true`. Guard with try/catch or conditional hook call pattern. Or require the SubscriptionProvider to be inside QueryClientProvider and document this.
**Warning signs:** Runtime error: "No QueryClient set, use QueryClientProvider to set one."

### Pitfall 6: Stale Closures in useEffect Cleanup

**What goes wrong:** Subscription cleanup function captures stale values of `filter`/`limit`, causing memory leaks or wrong unsubscriptions.
**Why it happens:** JavaScript closures capture by reference; React's `useEffect` cleanup runs asynchronously.
**How to avoid:** Use `useRef` for mutable values that change. Only put stable references in `useEffect` dependency arrays.
**Warning signs:** Multiple active subscriptions for the same hook (visible in WebSocket messages).

### Pitfall 7: URL Derivation Must Handle Both http:// and https://

**What goes wrong:** WS URL derivation only handles `https://` → `wss://` and breaks for local `http://` dev servers.
**Why it happens:** Only testing against production URLs.
**How to avoid:** Handle both cases: `https://` → `wss://` and `http://` → `ws://`.
**Warning signs:** WebSocket connection fails in local development.

### Pitfall 8: `buildXWhere` Functions Are Private

**What goes wrong:** Trying to import `buildProfileWhere` from `@lsp-indexer/node` — it's not exported.
**Why it happens:** Service functions are public but the `where` builders are internal helpers.
**How to avoid:** Either: (a) export the `buildXWhere` functions from `@lsp-indexer/node`, or (b) duplicate minimal where-building logic in subscription hooks, or (c) use the existing filter types and build where clauses in the subscription hook file.
**Recommendation:** Option (a) — export the `buildXWhere` functions. They're pure, stateless, and useful for subscription variable construction.

## Code Examples

### graphql-ws Client Creation (from official docs)

```typescript
// Source: https://the-guild.dev/graphql/ws/get-started
import { createClient } from 'graphql-ws';

const client = createClient({
  url: 'ws://localhost:4000/graphql',
});

// Subscribe with sink API
const unsubscribe = client.subscribe(
  { query: 'subscription { greetings }' },
  {
    next: (data) => console.log('Received:', data),
    error: (err) => console.error('Error:', err),
    complete: () => console.log('Complete'),
  },
);

// Cleanup
unsubscribe();
```

### graphql-ws Reconnection Detection (from official recipes)

```typescript
// Source: https://the-guild.dev/graphql/ws/recipes
// "Client usage with reconnect listener" recipe
let abruptlyClosed = false;
const client = createClient({
  url: 'ws://...',
  on: {
    closed: (event) => {
      if ((event as CloseEvent).code !== 1000) {
        abruptlyClosed = true;
      }
    },
    connected: () => {
      if (abruptlyClosed) {
        abruptlyClosed = false;
        // This is a reconnect!
        reconnectedCallbacks.forEach((cb) => cb());
      }
    },
  },
});
```

### graphql-ws Infinite Retry Config

```typescript
// Source: https://the-guild.dev/graphql/ws/docs/client/interfaces/ClientOptions
const client = createClient({
  url: 'ws://...',
  retryAttempts: Infinity, // Never give up (default is 5)
  shouldRetry: () => true, // Retry all non-fatal close events
  // retryWait default: randomized exponential backoff
  // First retry: ~1s, then ~2s, ~4s, etc. with randomization
});
```

### TanStack Query Cache Invalidation

```typescript
// Source: TanStack Query v5 docs
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

// Invalidate all queries matching prefix
queryClient.invalidateQueries({ queryKey: ['profiles'] });
// Matches: ['profiles', 'detail', ...], ['profiles', 'list', ...], etc.

// Invalidate specific detail
queryClient.invalidateQueries({
  queryKey: ['profiles', 'detail', { address: '0x123' }],
});

// IMPORTANT: Only refetches queries with active observers
// (components currently mounted with useQuery/useInfiniteQuery)
```

### useSyncExternalStore for Connection State

```typescript
// React 18+ pattern for subscribing to external state
import { useSyncExternalStore } from 'react';

function useConnectionState(client: SubscriptionClient) {
  return useSyncExternalStore(
    (cb) => client.subscribe(cb),
    () => client.getSnapshot(),
    () => 'disconnected' as const, // SSR fallback
  );
}
```

### Hasura Subscription Document Example

```graphql
# Hasura subscriptions mirror queries exactly
# Same table names, same where/order_by/limit args
subscription ProfileSubscription(
  $where: universal_profile_bool_exp
  $order_by: [universal_profile_order_by!]
  $limit: Int
) {
  universal_profile(where: $where, order_by: $order_by, limit: $limit) {
    id
    address
    lsp3Profile {
      name {
        value
      }
      description {
        value
      }
      tags {
        value
      }
      links {
        title
        url
      }
      avatar {
        url
        file_type
        verification_method
        verification_data
      }
      profileImage {
        url
        width
        height
        verification_method
        verification_data
      }
      backgroundImage {
        url
        width
        height
        verification_method
        verification_data
      }
    }
    followedBy_aggregate {
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
```

## State of the Art

| Old Approach                                 | Current Approach                                     | When Changed      | Impact                                                                                                             |
| -------------------------------------------- | ---------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| `subscriptions-transport-ws`                 | `graphql-ws`                                         | 2021              | Old protocol deprecated; Hasura supports both but recommends new protocol                                          |
| `client.subscribe()` sink API only           | `client.iterate()` async iterator API also available | graphql-ws v5.11+ | Iterate is more ergonomic for one-shot queries; subscribe still preferred for ongoing subscriptions in React hooks |
| Manual WebSocket + JSON parsing              | `graphql-ws` handles protocol                        | Always            | Never hand-roll the graphql-transport-ws protocol                                                                  |
| `useEffect` + `useState` for external stores | `useSyncExternalStore`                               | React 18          | Prevents tearing in concurrent mode                                                                                |

**Current state:**

- `graphql-ws` latest stable is 6.x (released late 2024/early 2025)
- The `subscribe()` method (sink-based) returns `() => void` cleanup — ideal for `useEffect` cleanup
- The `iterate()` method returns `AsyncIterableIterator` — better for Node.js but awkward in React hooks
- `lazy: true` is the default — connection only opens on first subscribe
- `lazyCloseTimeout` defaults to 0 — closes immediately after last unsubscribe. Recommend setting to ~3000ms to debounce rapid mount/unmount

## Package Placement Recommendations

### Where Each Piece Goes

| Component                      | Package              | Directory                                       | Reasoning                                                                |
| ------------------------------ | -------------------- | ----------------------------------------------- | ------------------------------------------------------------------------ |
| `getClientWsUrlOrDerive()`     | `@lsp-indexer/node`  | `src/client/env.ts`                             | Next to existing `getClientWsUrl()` — URL derivation is a client utility |
| `buildXWhere` exports          | `@lsp-indexer/node`  | `src/services/*.ts`                             | Already exist as private functions — just need to be exported            |
| `SubscriptionClient` class     | `@lsp-indexer/react` | `src/subscriptions/client.ts`                   | React-only (browser WebSocket); not needed in Node                       |
| Subscription context/provider  | `@lsp-indexer/react` | `src/subscriptions/context.ts` + `provider.tsx` | React component tree integration                                         |
| Generic `useSubscription` hook | `@lsp-indexer/react` | `src/subscriptions/use-subscription.ts`         | Core reusable hook                                                       |
| Subscription documents         | `@lsp-indexer/react` | `src/subscriptions/documents.ts`                | Co-located with hooks that use them; raw strings don't need codegen      |
| 11 domain subscription hooks   | `@lsp-indexer/react` | `src/subscriptions/{domain}.ts`                 | One file per domain, consistent with query hooks                         |
| Subscription param types       | `@lsp-indexer/types` | `src/{domain}.ts`                               | Add `Use{Domain}SubscriptionParams` alongside existing param types       |

### Why NOT in `@lsp-indexer/node`

The subscription client and hooks are React-only because:

1. `graphql-ws` uses browser WebSocket by default (would need `ws` polyfill for Node)
2. Hooks require React
3. `useSyncExternalStore` is a React API
4. The lazy lifecycle is a React component concern

Subscription documents COULD go in `@lsp-indexer/node/src/documents/subscriptions/` for consistency, but since they're raw strings (not codegen-processed) and only used by React hooks, co-locating them in `@lsp-indexer/react` reduces cross-package coupling.

### Provider Strategy

**Recommendation:** Create `IndexerSubscriptionProvider` that:

1. Creates the `SubscriptionClient` singleton
2. Provides it via React context
3. Is placed INSIDE `QueryClientProvider` (for cache invalidation access)
4. Is OPTIONAL — subscription hooks throw a helpful error if provider is missing

```tsx
// Consumer setup
import { IndexerSubscriptionProvider } from '@lsp-indexer/react';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <IndexerSubscriptionProvider>
        <MyComponents />
      </IndexerSubscriptionProvider>
    </QueryClientProvider>
  );
}
```

## Hasura Subscription Specifics

### Hasura Live Queries (NOT Streaming)

Hasura offers two subscription types:

1. **Live queries** — Re-execute the query at regular intervals (default 1s, configurable) and push result if changed. Use the same syntax as regular queries. **This is what we use.**
2. **Streaming subscriptions** — Push only new rows via cursor-based streaming (`*_stream` fields). Requires `batch_size` and `cursor` params.

**We use live queries** because:

- Same field selection as existing query documents
- Same parser functions work
- Consumer always gets full current state, not deltas
- Simpler mental model for the SDK consumer

### Subscription Root Mirrors Query Root

Verified from Hasura schema (`schema.graphql`):

- `subscription_root.universal_profile` has identical args to `query_root.universal_profile`: `distinct_on`, `limit`, `offset`, `order_by`, `where`
- Same for all 11 domain tables: `data_changed`, `digital_asset`, `nft`, `owned_asset`, `owned_token`, `follower`, `lsp4_creator`, `lsp12_issued_asset`, `lsp29_encrypted_asset`, `token_id_data_changed`, `universal_receiver`
- Response shape is identical — same nested relations, same field names

### Hasura Table Names → Domain Mapping

| Domain                       | Hasura Table            | Subscription Field                              |
| ---------------------------- | ----------------------- | ----------------------------------------------- |
| profiles                     | `universal_profile`     | `universal_profile(where, order_by, limit)`     |
| digital-assets               | `digital_asset`         | `digital_asset(where, order_by, limit)`         |
| nfts                         | `nft`                   | `nft(where, order_by, limit)`                   |
| owned-assets                 | `owned_asset`           | `owned_asset(where, order_by, limit)`           |
| owned-tokens                 | `owned_token`           | `owned_token(where, order_by, limit)`           |
| followers                    | `follower`              | `follower(where, order_by, limit)`              |
| creators                     | `lsp4_creator`          | `lsp4_creator(where, order_by, limit)`          |
| issued-assets                | `lsp12_issued_asset`    | `lsp12_issued_asset(where, order_by, limit)`    |
| encrypted-assets             | `lsp29_encrypted_asset` | `lsp29_encrypted_asset(where, order_by, limit)` |
| data-changed-events          | `data_changed`          | `data_changed(where, order_by, limit)`          |
| token-id-data-changed-events | `token_id_data_changed` | `token_id_data_changed(where, order_by, limit)` |
| universal-receiver-events    | `universal_receiver`    | `universal_receiver(where, order_by, limit)`    |

## graphql-ws API Summary

### Key Client Interface Members

| Method        | Signature                                               | Use                                           |
| ------------- | ------------------------------------------------------- | --------------------------------------------- |
| `subscribe()` | `(payload: SubscribePayload, sink: Sink) => () => void` | Subscribe to events, returns cleanup function |
| `iterate()`   | `(payload: SubscribePayload) => AsyncIterableIterator`  | Async iterator (prefer `subscribe` for React) |
| `on()`        | `(event: Event, listener: EventListener) => () => void` | Listen to connection lifecycle events         |
| `dispose()`   | `() => void \| Promise<void>`                           | Clean up client and close connection          |
| `terminate()` | `() => void`                                            | Force-close WebSocket (for stuck connections) |

### Key ClientOptions

| Option             | Default                | Our Config                                               |
| ------------------ | ---------------------- | -------------------------------------------------------- |
| `url`              | required               | From `getClientWsUrlOrDerive()`                          |
| `lazy`             | `true`                 | `true` (keep default)                                    |
| `lazyCloseTimeout` | `0`                    | `3000` (3s grace period)                                 |
| `retryAttempts`    | `5`                    | `Infinity` (never give up)                               |
| `shouldRetry`      | CloseEvents only       | `() => true` (retry everything non-fatal)                |
| `retryWait`        | Randomized exp backoff | Default is fine                                          |
| `connectionParams` | `undefined`            | Leave undefined (Hasura public endpoint, no auth needed) |
| `on`               | `{}`                   | Track `connecting`, `connected`, `closed` for state      |

### SubscribePayload Interface

```typescript
interface SubscribePayload {
  query: string; // GraphQL subscription document string
  variables?: Record<string, unknown>;
  operationName?: string;
  extensions?: Record<string, unknown>;
}
```

### Sink Interface

```typescript
interface Sink<T> {
  next(value: T): void; // Called for each subscription result
  error(error: unknown): void; // Called on subscription error
  complete(): void; // Called when subscription completes
}
```

## Open Questions

1. **Should `buildXWhere` functions be exported directly or via a new `builders` module?**

   - What we know: They're currently private in each service file
   - What's unclear: Whether to export from the service files directly or create a separate builders module
   - Recommendation: Export directly from service files — minimal change, maintains existing file structure. Add `export` keyword to existing functions.

2. **graphql-ws version: 5.x or 6.x?**

   - What we know: Latest is 6.x but couldn't verify exact version due to env constraints
   - What's unclear: Whether 6.x has breaking changes from 5.x
   - Recommendation: Use `^6.0.0` (or `^5.16.0` if 6.x has issues). The API (`createClient`, `subscribe`, `on`) is stable across both.

3. **Should subscription documents be kept in sync with query documents manually?**
   - What we know: Subscription documents select ALL fields (no `@include`), query documents use conditional `@include`
   - What's unclear: How to ensure schema changes propagate to both
   - Recommendation: Subscription documents are simpler (no `@include` directives). When the schema changes and parsers are updated, subscription documents should be updated too. Document this in the codebase.

## Sources

### Primary (HIGH confidence)

- **graphql-ws official docs** — https://the-guild.dev/graphql/ws/docs — createClient, Client interface, ClientOptions, all verified
- **graphql-ws recipes** — https://the-guild.dev/graphql/ws/recipes — Reconnection detection, retry config patterns
- **Hasura schema** — `packages/node/schema.graphql` — subscription_root structure verified, mirrors query_root exactly
- **Existing codebase** — All files read directly: hooks, documents, services, parsers, keys, env, errors, package.json

### Secondary (MEDIUM confidence)

- **Hasura subscription docs** — https://hasura.io/docs/latest/subscriptions/overview/ — Live queries vs streaming subscriptions
- **TanStack Query v5 docs** — `invalidateQueries` API behavior (only refetches observed queries)

### Tertiary (LOW confidence)

- **graphql-ws exact latest version** — Couldn't verify via npm due to env constraints; stated as ^6.0.0 based on training data

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — graphql-ws is the locked decision, well-documented
- Architecture: HIGH — Based on thorough analysis of existing codebase patterns + official graphql-ws API
- Pitfalls: HIGH — Derived from actual codebase constraints (private buildWhere functions, codegen limitations) and official docs (Hasura live query semantics)
- Package placement: MEDIUM — Discretion area; recommendation based on codebase conventions but could go either way for documents

**Research date:** 2026-02-26
**Valid until:** ~60 days (graphql-ws is stable; Hasura subscription API is stable; codebase patterns are established)
