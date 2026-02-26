# Phase 10: Subscriptions - Context

**Gathered:** 2026-02-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Developer can subscribe to real-time updates on any domain via WebSocket, with subscription data optionally keeping query caches fresh. Covers: WebSocket connection management (graphql-ws), 11 domain subscription hooks, and TanStack Query cache integration. Server actions and publish readiness are Phase 11.

</domain>

<decisions>
## Implementation Decisions

### Subscription granularity

- List-level subscription hooks for all 11 domains — NOT per-entity hooks
- Filters are optional — consumer controls scope from global firehose (`useEncryptedAssetsSubscription({ limit: 20 })`) down to single-entity watch (`useProfileSubscription({ filter: { address: '0x...' }, limit: 1 })`)
- Always return full type — no `include` parameter on subscription hooks. Subscriptions are about freshness, not data shaping. One subscription document per domain.
- Limit with sensible default (~10), fixed newest-first sort (block-order desc for event domains, timestamp desc for entity domains). No sort parameter exposed.
- Same filter types as query hooks — `EncryptedAssetFilter`, `ProfileFilter`, etc. Consistent API, zero learning curve.

### Cache freshness strategy

- `invalidate` flag on each hook (default `false`) — subscriptions are a data stream by default, no automatic cache side effects
- `onData` callback for custom reactions — consumer can insert into local state, show toasts, etc.
- When `invalidate: true`, two-tier invalidation: precise detail key for the specific entity + broad list keys for the domain. TanStack Query only refetches actively observed queries.
- `enabled` option (default `true`) — matches TanStack Query convention for conditional activation

### Hook return shape

- `{ data, isConnected, isSubscribed, error }` — lean standalone React hooks, NOT TanStack Query hooks
- `data: T[] | null` — live subscription results
- `isConnected: boolean` — WebSocket to Hasura is open
- `isSubscribed: boolean` — this specific subscription is active and receiving
- `error: IndexerError | null` — typed error with network/GraphQL/permission categories, consistent with query hooks
- Declarative lifecycle only — `enabled` + mount/unmount controls subscription. No imperative `unsubscribe()`/`resubscribe()`.

### Hook input shape

- `filter?: XFilter` — optional, same filter types as query hooks
- `limit?: number` — default ~10
- `enabled?: boolean` — default true
- `invalidate?: boolean` — default false
- `onData?: (data: X[]) => void` — optional callback when subscription receives data
- `onReconnect?: () => void` — optional callback when WebSocket reconnects after a drop

### Reconnection & lifecycle

- Lazy WebSocket connection — opens when first subscription hook mounts with `enabled: true`, closes when last subscription unmounts. Zero overhead when subscriptions aren't used.
- Infinite retry with exponential backoff on disconnect — `graphql-ws` built-in behavior. Never gives up. `isConnected` reflects current state.
- Automatic resubscribe on reconnect — all active subscriptions silently re-establish. `isSubscribed` goes `false → true` automatically.
- On reconnect: cache invalidation only fires if consumer set `invalidate: true`. `onReconnect` callback fires regardless for consumer-side reactions.
- WebSocket URL auto-derived from HTTP URL (swap `https://` → `wss://`). Optional override via `NEXT_PUBLIC_INDEXER_WS_URL` env var (client) and `INDEXER_WS_URL` env var (server). Env vars already scaffolded in `apps/test/.env.example`.

### Claude's Discretion

- Internal WebSocket client singleton pattern (how the shared connection is managed across hooks)
- Subscription document structure (GraphQL subscription syntax for Hasura)
- Exact exponential backoff timing (graphql-ws defaults are fine)
- Hook internal state management (useState/useRef/useSyncExternalStore)
- Default limit value (around 10, exact number flexible)
- Which package each piece lives in (subscription documents in node, hooks in react, etc.)

</decisions>

<specifics>
## Specific Ideas

- Primary use case: global feed of new LSP29 encrypted assets — `useEncryptedAssetsSubscription({ limit: 20 })` with no address filter, subscribing to ALL new encrypted assets as they're indexed
- Subscription hooks are standalone React hooks managing `graphql-ws` directly — NOT TanStack Query hooks. The two systems are independent: query hooks → TanStack Query → HTTP, subscription hooks → graphql-ws → WebSocket. Cache invalidation is the bridge between them.
- Hook API should feel familiar to TanStack Query users (`enabled`, `data`, `error`) even though it's a separate system

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 10-subscriptions_
_Context gathered: 2026-02-26_
