<!-- This file is auto-generated from content/docs/quickstart.mdx — do not edit directly. Run `pnpm --filter docs generate` to regenerate. -->

---
title: Quickstart
description: Get up and running with @lsp-indexer in under 5 minutes.
---

Get up and running with `@lsp-indexer` in under 5 minutes. This guide covers running the indexer
and using the consumer packages in your React or Next.js app.

---

## Prerequisites

- Node.js 20+
- Docker & Docker Compose (for the indexer)
- A LUKSO RPC endpoint (public: `https://rpc.lukso.sigmacore.io`)

---

## 1. Run the Indexer

The indexer processes LUKSO blockchain events into a PostgreSQL database, exposed via Hasura GraphQL.

```bash
# Clone the repo
git clone https://github.com/chillwhales/lsp-indexer.git
cd lsp-indexer

# Copy and configure environment
cp .env.example .env
# Edit .env — set HASURA_GRAPHQL_ADMIN_SECRET at minimum

# Start all services (PostgreSQL, Indexer, Hasura, Grafana)
cd docker
docker compose --env-file ../.env up -d

# Watch indexer logs
docker compose --env-file ../.env logs -f indexer
```

Once running, your Hasura GraphQL endpoint is at `http://localhost:8080/v1/graphql`.

See the [Indexer documentation](/docs/indexer) for detailed configuration and architecture.

---

## 2. Install Consumer Packages

```bash
# Install whichever package you need — transitive deps are included automatically
npm install @lsp-indexer/react @tanstack/react-query   # client mode
npm install @lsp-indexer/next @tanstack/react-query     # server mode (Next.js)
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
# Optional — falls back to HTTP URL with wss:// protocol
# NEXT_PUBLIC_INDEXER_WS_URL=ws://localhost:8080/v1/graphql
```

### Server mode (`@lsp-indexer/next`)

Data flows through Next.js server actions. Set the server-only vars:

```env
# .env.local
INDEXER_URL=http://localhost:8080/v1/graphql

# Subscriptions: point browser at the WS proxy (keeps Hasura URL hidden)
NEXT_PUBLIC_INDEXER_WS_URL=ws://localhost:4000
# Upstream Hasura WS for the proxy (falls back to INDEXER_URL with ws://)
# INDEXER_WS_URL=ws://localhost:8080/v1/graphql
# Required for WS proxy CORS validation
INDEXER_ALLOWED_ORIGINS=http://localhost:3000
```

### Both modes

Set both HTTP variables to enable toggling between client and server mode:

```env
NEXT_PUBLIC_INDEXER_URL=http://localhost:8080/v1/graphql
INDEXER_URL=http://localhost:8080/v1/graphql
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
  const { profile, isLoading, error } = useProfile({ address });

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

| Hook                     | Returns           | Example                                         |
| ------------------------ | ----------------- | ----------------------------------------------- |
| `useProfile`             | Single entity     | `useProfile({ address })`                       |
| `useProfiles`            | Paginated list    | `useProfiles({ filter, sort, limit })`          |
| `useInfiniteProfiles`    | Infinite scroll   | `useInfiniteProfiles({ filter, pageSize: 20 })` |
| `useProfileSubscription` | Real-time updates | `useProfileSubscription({ filter })`            |

Most domains follow this pattern. Some (like Creators, Follows, Issued Assets) only have list/infinite/subscription hooks — see the [full domain table](/docs/react#available-domains) for details.

---

## Next Steps

- [Indexer setup & architecture](/docs/indexer) — Docker, environment, monitoring
- [@lsp-indexer/node](/docs/node) — Low-level fetch functions, query keys, parsers
- [@lsp-indexer/react](/docs/react) — Client-side hooks, subscriptions, include fields
- [@lsp-indexer/next](/docs/next) — Server actions, WS proxy, deployment
- **Domain Playgrounds** — Try every hook live in the sidebar
