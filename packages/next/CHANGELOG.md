# @lsp-indexer/next

## 2.3.0

### Minor Changes

- [#355](https://github.com/chillwhales/lsp-indexer/pull/355) [`2cfa1ec`](https://github.com/chillwhales/lsp-indexer/commit/2cfa1ec0cd9520514c7afdb30fd7b9ea05fe4364) Thanks [@b00ste](https://github.com/b00ste)! - Add batch encrypted asset fetch for multiple `(address, contentId, revision)` tuples in a single query

  - Add `EncryptedAssetBatchTupleSchema`, `UseEncryptedAssetsBatchParamsSchema` Zod schemas and inferred types
  - Add `fetchEncryptedAssetsBatch` service with `_or`/`_and` Hasura query and 3-overload include narrowing
  - Add `encryptedAssetKeys.batch()` cache key factory entry
  - Add `createUseEncryptedAssetsBatch` factory and `useEncryptedAssetsBatch` hook in `@lsp-indexer/react`
  - Add `getEncryptedAssetsBatch` server action and `useEncryptedAssetsBatch` hook in `@lsp-indexer/next`
  - Add batch encrypted asset documentation to node, react, and next docs pages

### Patch Changes

- Updated dependencies [[`2cfa1ec`](https://github.com/chillwhales/lsp-indexer/commit/2cfa1ec0cd9520514c7afdb30fd7b9ea05fe4364)]:
  - @lsp-indexer/types@2.3.0
  - @lsp-indexer/node@2.3.0
  - @lsp-indexer/react@2.3.0

## 2.2.0

### Minor Changes

- [#350](https://github.com/chillwhales/lsp-indexer/pull/350) [`54a0b42`](https://github.com/chillwhales/lsp-indexer/commit/54a0b423ee0b80b181509ad77f709e224e2e06db) Thanks [@b00ste](https://github.com/b00ste)! - Add mutual follow hooks: `useMutualFollows`, `useMutualFollowers`, `useFollowedByMyFollows` with infinite scroll variants, ProfileInclude type narrowing, and Next.js server action routing.

### Patch Changes

- Updated dependencies [[`54a0b42`](https://github.com/chillwhales/lsp-indexer/commit/54a0b423ee0b80b181509ad77f709e224e2e06db)]:
  - @lsp-indexer/types@2.2.0
  - @lsp-indexer/node@2.2.0
  - @lsp-indexer/react@2.2.0

## 2.1.0

### Minor Changes

- [#348](https://github.com/chillwhales/lsp-indexer/pull/348) [`8e87755`](https://github.com/chillwhales/lsp-indexer/commit/8e8775508e9de11d848cee1a9bf6d086cfe5bee2) Thanks [@b00ste](https://github.com/b00ste)! - Add `useIsFollowingBatch` hook for checking multiple follower→followed pairs in a single query

  - Add `IsFollowingBatchPairSchema`, `UseIsFollowingBatchParamsSchema` Zod schemas and inferred types
  - Add `fetchIsFollowingBatch` service with `_or` Hasura query returning `Map<string, boolean>`
  - Add `followerKeys.isFollowingBatch(pairs)` cache key factory entry
  - Add `createUseIsFollowingBatch` factory and `useIsFollowingBatch` hook in `@lsp-indexer/react`
  - Add `getIsFollowingBatch` server action and `useIsFollowingBatch` hook in `@lsp-indexer/next`

### Patch Changes

- Updated dependencies [[`8e87755`](https://github.com/chillwhales/lsp-indexer/commit/8e8775508e9de11d848cee1a9bf6d086cfe5bee2)]:
  - @lsp-indexer/types@2.1.0
  - @lsp-indexer/node@2.1.0
  - @lsp-indexer/react@2.1.0

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
