# @lsp-indexer/next

## 2.0.0

### Major Changes

- [#340](https://github.com/chillwhales/lsp-indexer/pull/340) [`ab1b873`](https://github.com/chillwhales/lsp-indexer/commit/ab1b873fa059d6f998a5987e44eac7af26089409) Thanks [@b00ste](https://github.com/b00ste)! - **BREAKING:** Remove subscription hooks, provider, and client from `@lsp-indexer/next`.

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

### Patch Changes

- Updated dependencies []:
  - @lsp-indexer/types@2.0.0
  - @lsp-indexer/node@2.0.0
  - @lsp-indexer/react@2.0.0

## 1.2.0

### Patch Changes

- Updated dependencies [[`35eb9b3`](https://github.com/chillwhales/lsp-indexer/commit/35eb9b3eb3fe7bf462958e08b89e353f6fca68c5)]:
  - @lsp-indexer/types@1.2.0
  - @lsp-indexer/node@1.2.0
  - @lsp-indexer/react@1.2.0

## 1.1.0

### Patch Changes

- Updated dependencies [[`85fe631`](https://github.com/chillwhales/lsp-indexer/commit/85fe631bb18a4e40e8a9f49b61df1d52a79e30bc)]:
  - @lsp-indexer/types@1.1.0
  - @lsp-indexer/node@1.1.0
  - @lsp-indexer/react@1.1.0

## 1.0.0

### Major Changes

- [#280](https://github.com/chillwhales/lsp-indexer/pull/280) [`5834874`](https://github.com/chillwhales/lsp-indexer/commit/5834874a26fdc3f1464dee668438840e6c91e4d5) Thanks [@b00ste](https://github.com/b00ste)! - Initial release of @lsp-indexer packages to npm

  This is the first publication of the @lsp-indexer package suite:

  - `@lsp-indexer/types`: Zod schemas and TypeScript types for all indexer domains
  - `@lsp-indexer/node`: GraphQL services, parsers, codegen documents, and typed fetch client
  - `@lsp-indexer/react`: TanStack Query hooks for profiles, digital assets, NFTs, followers, and more
  - `@lsp-indexer/next`: Next.js server actions with 'use server' directive support

### Patch Changes

- Updated dependencies [[`5834874`](https://github.com/chillwhales/lsp-indexer/commit/5834874a26fdc3f1464dee668438840e6c91e4d5)]:
  - @lsp-indexer/types@1.0.0
  - @lsp-indexer/node@1.0.0
  - @lsp-indexer/react@1.0.0

## 0.1.0

### Minor Changes

- Initial release of @lsp-indexer/next package with Next.js server actions with 'use server' directive support
