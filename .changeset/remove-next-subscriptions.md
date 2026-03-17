---
'@lsp-indexer/next': major
---

**BREAKING:** Remove subscription hooks, provider, and client from `@lsp-indexer/next`.

All subscriptions now use `@lsp-indexer/react` hooks pointed at the WS proxy
(`NEXT_PUBLIC_INDEXER_WS_URL`). Next.js cannot hold WebSocket connections in API routes,
so a separate subscription provider in the Next.js package was unnecessary complexity.

**BREAKING:** Server actions are now exported from `@lsp-indexer/next/actions` (separate entry point).

The root import (`@lsp-indexer/next`) exports query hooks only. This separation ensures
server action code (with `"use server"` directive) is never bundled into the client JS,
preventing server env var leaks (`INDEXER_URL`).

### Migration

```diff
- import { IndexerSubscriptionProvider } from '@lsp-indexer/next';
+ import { IndexerSubscriptionProvider } from '@lsp-indexer/react';

- import { getProfile } from '@lsp-indexer/next';
+ import { getProfile } from '@lsp-indexer/next/actions';

- import { useProfileSubscription } from '@lsp-indexer/next';
+ import { useProfileSubscription } from '@lsp-indexer/react';
```

### Removed exports

- `SubscriptionClient`
- `SubscriptionClientContext`
- `IndexerSubscriptionProvider`
- `useSubscription`
- 12 domain subscription hooks (`useProfileSubscription`, `useDigitalAssetSubscription`, etc.)

### What stays in `@lsp-indexer/next`

- Query hooks (`useProfile`, `useProfiles`, `useInfiniteProfiles`, etc.) — root import
- Server actions (`getProfile`, `getProfiles`, etc.) — `@lsp-indexer/next/actions`
- WS proxy (`createProxyServer`) — `@lsp-indexer/next/server`
