<!-- This file is auto-generated from src/app/docs/quickstart/page.mdx.
     Do not edit directly — run `pnpm --filter docs generate` to regenerate. -->

# Quickstart

Get up and running with `@lsp-indexer` in under 5 minutes. This guide covers running the indexer
and using the consumer packages in your React or Next.js app.

---

## Prerequisites

- Node.js 22.15+
- Docker & Docker Compose (for the indexer)
- LUKSO and Ethereum RPC endpoints for a production deployment

---

## 1. Run the Indexer

The indexer processes LUKSO and Ethereum events in isolated Pipes processes, writes chain-scoped
PostgreSQL schemas, and exposes reviewed multi-chain views through Hasura GraphQL.

```bash
# Clone the repo
git clone https://github.com/chillwhales/lsp-indexer.git
cd lsp-indexer

# Copy and configure a bounded local run
cp .env.example .env
# Set INDEXER_TO_BLOCK_LUKSO_MAINNET and INDEXER_TO_BLOCK_ETHEREUM_MAINNET
# before starting if you do not want a complete backfill.

# Start PostgreSQL, two isolated v3 indexers and metadata workers,
# deterministic migrations/Hasura metadata, and monitoring.
cd docker
./manage.sh config
./manage.sh start

# Verify and watch one network
./manage.sh health
./manage.sh logs indexer-lukso
```

Once running, your Hasura GraphQL endpoint is at `http://localhost:8080/v1/graphql`.

See the [Indexer documentation](/docs/indexer) for detailed configuration and architecture.

### Run source-only diagnostics

The v3 runtime has an official Portal/RPC fallback path. Public cutover still waits on recorded
shadow-production evidence and owner approval. Validate a source without writing data by using a
small bounded probe:

```bash
# Requires Node.js >=22.15
pnpm install

INDEXER_NETWORK=ethereum-mainnet \
  pnpm --filter @chillwhales/indexer-v3 check:network

INDEXER_NETWORK=ethereum-mainnet \
INDEXER_FROM_BLOCK=22000000 \
INDEXER_TO_BLOCK=22000010 \
  pnpm --filter @chillwhales/indexer-v3 probe:network

# LUKSO defaults to historical Portal followed by the live official RPC source.
INDEXER_NETWORK=lukso-mainnet \
INDEXER_SOURCE_MODE=fallback \
INDEXER_FROM_BLOCK=<portal-boundary> \
INDEXER_TO_BLOCK=<portal-boundary-plus-2> \
  pnpm --filter @chillwhales/indexer-v3 probe:network
```

The probe reads raw blocks and logs without writing. To exercise the v3 PostgreSQL foundation,
first create a dedicated database and runtime login, then apply all network schemas with a separate
migration credential:

```bash
DATABASE_ADMIN_URL=postgresql://migration_admin:secret@localhost/lsp_indexer_v3 \
DATABASE_RUNTIME_LOGIN_ETHEREUM_MAINNET=lsp_v3_ethereum_runtime \
DATABASE_API_LOGIN=lsp_v3_hasura \
  pnpm --filter @chillwhales/indexer-v3 db:migrate

INDEXER_NETWORK=ethereum-mainnet \
DATABASE_URL=postgresql://lsp_v3_ethereum_runtime:secret@localhost/lsp_indexer_v3 \
  pnpm --filter @chillwhales/indexer-v3 db:check

# Run the network's event/projection pipe and metadata worker as separate processes
INDEXER_NETWORK=ethereum-mainnet \
DATABASE_URL=postgresql://lsp_v3_ethereum_runtime:secret@localhost/lsp_indexer_v3 \
  pnpm --filter @chillwhales/indexer-v3 index:events

INDEXER_NETWORK=ethereum-mainnet \
DATABASE_URL=postgresql://lsp_v3_ethereum_runtime:secret@localhost/lsp_indexer_v3 \
METADATA_METRICS_PORT=9091 \
  pnpm --filter @chillwhales/indexer-v3 metadata:worker

# Configure the Hasura server itself with the read-only source URL and:
# HASURA_GRAPHQL_V3_DATABASE_URL=postgresql://lsp_v3_hasura:secret@localhost/lsp_indexer_v3
# HASURA_GRAPHQL_UNAUTHORIZED_ROLE=public
# Then apply the generated source after all chain schemas are current.
HASURA_GRAPHQL_ENDPOINT=http://localhost:8080 \
HASURA_GRAPHQL_ADMIN_SECRET=operator-secret \
  pnpm --filter @chillwhales/indexer-v3 hasura:apply
```

The v3 source and database variables are:

| Variable                                | Scope and default                                                 |
| --------------------------------------- | ----------------------------------------------------------------- |
| `INDEXER_SOURCE_MODE`                   | `portal`, `rpc`, or `fallback`; LUKSO defaults to fallback        |
| `INDEXER_RPC_RATE_LIMIT`                | Official RPC rate limit; catalog default is `10`                  |
| `INDEXER_SOURCE_RETRIES`                | Per-source retries; defaults to `2`                               |
| `INDEXER_SOURCE_STALL_TIMEOUT_MS`       | Source stall threshold; defaults to `30000` milliseconds          |
| `INDEXER_SOURCE_MAX_LAG_BLOCKS`         | Active source lag budget; defaults to `10` blocks                 |
| `INDEXER_SOURCE_ALL_DOWN_TIMEOUT_MS`    | All-source failure threshold; defaults to `300000` milliseconds   |
| `DATABASE_URL`                          | Generic runtime PostgreSQL URL                                    |
| `DATABASE_URL_<NETWORK>`                | Per-network override; takes priority over `DATABASE_URL`          |
| `DATABASE_ADMIN_URL`                    | Separate admin URL used only by `db:migrate`                      |
| `DATABASE_MIGRATION_NETWORKS`           | Comma-separated migration set; defaults to every catalog network  |
| `DATABASE_RUNTIME_LOGIN_<NETWORK>`      | Existing login that receives only its matching writer role        |
| `DATABASE_POOL_MAX`                     | Runtime connection limit; defaults to `10`                        |
| `DATABASE_CONNECTION_TIMEOUT_MS`        | Connection timeout; defaults to `10000` milliseconds              |
| `DATABASE_IDLE_TIMEOUT_MS`              | Idle connection timeout; defaults to `30000` milliseconds         |
| `DATABASE_STATEMENT_TIMEOUT_MS`         | Statement timeout; defaults to `60000` milliseconds               |
| `DATABASE_LOCK_TIMEOUT_MS`              | Lock timeout; defaults to `10000` milliseconds                    |
| `DATABASE_IDLE_TRANSACTION_TIMEOUT_MS`  | Idle transaction timeout; defaults to `60000` milliseconds        |
| `DATABASE_UNFINALIZED_BLOCKS_RETENTION` | Defaults to max(`1000`, finality × 4) and must exceed finality    |
| `METADATA_CONCURRENCY`                  | Concurrent jobs per worker; defaults to `8`                       |
| `METADATA_POLL_INTERVAL_MS`             | Idle queue poll interval; defaults to `1000` milliseconds         |
| `METADATA_REQUEST_TIMEOUT_MS`           | Per-request timeout; defaults to `15000` milliseconds             |
| `METADATA_MAX_RESPONSE_BYTES`           | Response limit; defaults to `2097152` bytes                       |
| `METADATA_MAX_REDIRECTS`                | Redirect limit; defaults to `3`                                   |
| `METADATA_MAX_ATTEMPTS`                 | Attempts before terminal failure; defaults to `6`                 |
| `METADATA_RETRY_BASE_MS`                | Initial durable retry delay; defaults to `5000` milliseconds      |
| `METADATA_RETRY_MAX_MS`                 | Maximum retry delay; defaults to `1800000` milliseconds           |
| `METADATA_LEASE_TIMEOUT_MS`             | `300000`; exceeds timeout × configured gateway count              |
| `METADATA_METRICS_PORT`                 | Worker metrics port; defaults to `9091`                           |
| `METADATA_IPFS_GATEWAYS`                | Ordered comma-separated gateways; defaults to the network primary |
| `METADATA_ALLOW_HTTP`                   | Permit public plain-HTTP sources; defaults to `false`             |
| `METADATA_RUN_ONCE`                     | Process one bounded claim batch and exit; defaults to `false`     |

Replace `<NETWORK>` with an uppercase catalog key whose hyphens become underscores, such as
`DATABASE_URL_ETHEREUM_MAINNET` or `DATABASE_RUNTIME_LOGIN_LUKSO_MAINNET`.

Before production cutover, operators must run the repository's mapped parity comparison against
frozen v2/v3 shadow endpoints and the multi-network soak observer against real metrics endpoints:

```bash
pnpm --filter @chillwhales/indexer-v3 acceptance:parity
pnpm --filter @chillwhales/indexer-v3 acceptance:soak
```

These commands require the `V2_GRAPHQL_*`, `V3_GRAPHQL_*`, and `ACCEPTANCE_*` variables documented
under [Indexer v3 release candidate](/docs/indexer#indexer-v3-release-candidate). The root and docs
app `.env.example` files contain every variable, and the shadow-production acceptance runbook
defines the required evidence. A short soak is a diagnostic probe, not production acceptance.

This creates isolated chain schemas and unified read-only API views. Metadata jobs are committed
with their chain projections and drained only after finality, with durable retries and stale-result
protection. V3 also persists the LUKSO Mainnet-only `chillwhales_nfts` domain for
CHILL/ORBS claims and Orb state. The v3 Hasura API exposes multi-chain queries, aggregates,
relationships, and live subscriptions without mutations. A query without `chain_id` spans all
enabled networks. The v3 Node, types, React, and Next.js packages now expose explicit
network-scoped services, hooks, actions, subscriptions, and indexed-head status for every public
domain. See
[Indexer v3 release candidate](/docs/indexer#indexer-v3-release-candidate) for the schema model, safety
checks, and environment variables.

---

## 2. Install Consumer Packages

```bash
# Install whichever package you need — transitive deps are included automatically
npm install @lsp-indexer/react@^3 @tanstack/react-query   # client mode
npm install @lsp-indexer/next@^3 @tanstack/react-query    # server mode (Next.js)
```

| Package              | Purpose                                                               |
| -------------------- | --------------------------------------------------------------------- |
| `@lsp-indexer/types` | Shared TypeScript types, Zod schemas, filter/sort/include definitions |
| `@lsp-indexer/node`  | Low-level fetch functions, parsers, query keys, subscription client   |
| `@lsp-indexer/react` | Client-side React hooks — browser → Hasura directly                   |
| `@lsp-indexer/next`  | Next.js server actions + hooks — browser → server → Hasura            |

---

## 3. Configure Environment Variables

### Client mode (`@lsp-indexer/react`)

The browser connects to Hasura directly. Set the `NEXT_PUBLIC_` prefixed vars:

```env
# .env.local
NEXT_PUBLIC_INDEXER_URL=http://localhost:8080/v1/graphql
NEXT_PUBLIC_INDEXER_NETWORK=lukso-mainnet
# Optional — falls back to HTTP URL with wss:// protocol
# NEXT_PUBLIC_INDEXER_WS_URL=ws://localhost:8080/v1/graphql
```

### Server mode (`@lsp-indexer/next`)

Data flows through Next.js server actions. Set the server-only vars:

```env
# .env.local
INDEXER_URL=http://localhost:8080/v1/graphql
INDEXER_NETWORK=lukso-mainnet

# Subscriptions: point browser at the WS proxy (keeps Hasura URL hidden)
NEXT_PUBLIC_INDEXER_WS_URL=ws://localhost:4000
NEXT_PUBLIC_INDEXER_NETWORK=lukso-mainnet
# Upstream Hasura WS for the proxy (falls back to INDEXER_URL with ws://)
# INDEXER_WS_URL=ws://localhost:8080/v1/graphql
# Required for WS proxy CORS validation
INDEXER_ALLOWED_ORIGINS=http://localhost:3000
```

When the server-only pair is omitted, server helpers and the docs playground fall back to
`NEXT_PUBLIC_INDEXER_URL` and `NEXT_PUBLIC_INDEXER_NETWORK`. Set `INDEXER_URL` and
`INDEXER_NETWORK` when the server should use a private endpoint or a different network.

### Both modes

Set both HTTP variables to enable toggling between client and server mode:

```env
NEXT_PUBLIC_INDEXER_URL=http://localhost:8080/v1/graphql
NEXT_PUBLIC_INDEXER_NETWORK=lukso-mainnet
INDEXER_URL=http://localhost:8080/v1/graphql
INDEXER_NETWORK=lukso-mainnet
# For subscriptions via WS proxy
NEXT_PUBLIC_INDEXER_WS_URL=ws://localhost:4000
INDEXER_ALLOWED_ORIGINS=http://localhost:3000
```

---

## 4. Wrap Providers

### React (client mode)

```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IndexerSubscriptionProvider } from '@lsp-indexer/react';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <IndexerSubscriptionProvider>{children}</IndexerSubscriptionProvider>
    </QueryClientProvider>
  );
}
```

### Next.js (server mode)

Subscriptions always use `@lsp-indexer/react` hooks (Next.js does not support WebSocket
connections in API routes). Set `NEXT_PUBLIC_INDEXER_WS_URL` to your WS proxy URL
(from `@lsp-indexer/next/server`) to keep the Hasura URL hidden:

```tsx
// app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IndexerSubscriptionProvider } from '@lsp-indexer/react';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <IndexerSubscriptionProvider>{children}</IndexerSubscriptionProvider>
    </QueryClientProvider>
  );
}
```

---

## 5. Use Hooks

Every domain (profiles, digital assets, NFTs, etc.) has the same hook pattern:

```tsx
import { useProfile } from '@lsp-indexer/react';
// or
import { useProfile } from '@lsp-indexer/next';

function ProfileCard({ address }: { address: string }) {
  const { profile, isLoading, error } = useProfile({
    network: 'lukso-mainnet',
    address,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>{profile?.name}</h2>
      <p>{profile?.description}</p>
    </div>
  );
}
```

### Available hook patterns per domain

| Hook                     | Returns           | Example                                                  |
| ------------------------ | ----------------- | -------------------------------------------------------- |
| `useProfile`             | Single entity     | `useProfile({ network, address })`                       |
| `useProfiles`            | Paginated list    | `useProfiles({ network, filter, sort, limit })`          |
| `useInfiniteProfiles`    | Infinite scroll   | `useInfiniteProfiles({ network, filter, pageSize: 20 })` |
| `useProfileSubscription` | Real-time updates | `useProfileSubscription({ network, filter })`            |

Most domains follow this pattern. Some (like Creators, Follows, Issued Assets) only have list/infinite/subscription hooks — see the [full domain table](/docs/react#available-domains) for details.

---

## Next Steps

- [Indexer setup & architecture](/docs/indexer) — Docker, environment, monitoring
- [@lsp-indexer/node](/docs/node) — Low-level fetch functions, query keys, parsers
- [@lsp-indexer/react](/docs/react) — Client-side hooks, subscriptions, include fields
- [@lsp-indexer/next](/docs/next) — Server actions, WS proxy, deployment
- **Domain Playgrounds** — Try every hook live in the sidebar
