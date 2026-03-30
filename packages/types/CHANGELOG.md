# @lsp-indexer/types

## 2.4.0

### Minor Changes

- [#360](https://github.com/chillwhales/lsp-indexer/pull/360) [`493173b`](https://github.com/chillwhales/lsp-indexer/commit/493173b82c93cc08f54b0dc2f0949f992d93474b) Thanks [@b00ste](https://github.com/b00ste)! - Add chillwhales NFT extensions: 7 custom fields (score, rank, chillClaimed, orbsClaimed, level, cooldownExpiry, faction), 4 game-property filters, score sorting, and collection-attributes query vertical.

## 2.3.0

### Minor Changes

- [#355](https://github.com/chillwhales/lsp-indexer/pull/355) [`2cfa1ec`](https://github.com/chillwhales/lsp-indexer/commit/2cfa1ec0cd9520514c7afdb30fd7b9ea05fe4364) Thanks [@b00ste](https://github.com/b00ste)! - Add batch encrypted asset fetch for multiple `(address, contentId, revision)` tuples in a single query

  - Add `EncryptedAssetBatchTupleSchema`, `UseEncryptedAssetsBatchParamsSchema` Zod schemas and inferred types
  - Add `fetchEncryptedAssetsBatch` service with `_or`/`_and` Hasura query and 3-overload include narrowing
  - Add `encryptedAssetKeys.batch()` cache key factory entry
  - Add `createUseEncryptedAssetsBatch` factory and `useEncryptedAssetsBatch` hook in `@lsp-indexer/react`
  - Add `getEncryptedAssetsBatch` server action and `useEncryptedAssetsBatch` hook in `@lsp-indexer/next`
  - Add batch encrypted asset documentation to node, react, and next docs pages

## 2.2.0

### Minor Changes

- [#350](https://github.com/chillwhales/lsp-indexer/pull/350) [`54a0b42`](https://github.com/chillwhales/lsp-indexer/commit/54a0b423ee0b80b181509ad77f709e224e2e06db) Thanks [@b00ste](https://github.com/b00ste)! - Add mutual follow hooks: `useMutualFollows`, `useMutualFollowers`, `useFollowedByMyFollows` with infinite scroll variants, ProfileInclude type narrowing, and Next.js server action routing.

## 2.1.0

### Minor Changes

- [#348](https://github.com/chillwhales/lsp-indexer/pull/348) [`8e87755`](https://github.com/chillwhales/lsp-indexer/commit/8e8775508e9de11d848cee1a9bf6d086cfe5bee2) Thanks [@b00ste](https://github.com/b00ste)! - Add `useIsFollowingBatch` hook for checking multiple follower→followed pairs in a single query

  - Add `IsFollowingBatchPairSchema`, `UseIsFollowingBatchParamsSchema` Zod schemas and inferred types
  - Add `fetchIsFollowingBatch` service with `_or` Hasura query returning `Map<string, boolean>`
  - Add `followerKeys.isFollowingBatch(pairs)` cache key factory entry
  - Add `createUseIsFollowingBatch` factory and `useIsFollowingBatch` hook in `@lsp-indexer/react`
  - Add `getIsFollowingBatch` server action and `useIsFollowingBatch` hook in `@lsp-indexer/next`

## 2.0.0

## 1.2.0

### Minor Changes

- [#318](https://github.com/chillwhales/lsp-indexer/pull/318) [`35eb9b3`](https://github.com/chillwhales/lsp-indexer/commit/35eb9b3eb3fe7bf462958e08b89e353f6fca68c5) Thanks [@b00ste](https://github.com/b00ste)! - LSP29 v2.0.0 encrypted asset spec: replace AccessControlCondition with EncryptionParams, provider-first encryption model, per-backend chunk storage (ipfs/lumera/s3/arweave)

## 1.1.0

### Minor Changes

- [#300](https://github.com/chillwhales/lsp-indexer/pull/300) [`85fe631`](https://github.com/chillwhales/lsp-indexer/commit/85fe631bb18a4e40e8a9f49b61df1d52a79e30bc) Thanks [@b00ste](https://github.com/b00ste)! - Add newest/oldest block-order sorting across all 12 query domains. All domain services now default to newest-first when no sort parameter is provided. Non-block sort fields include block-order as a deterministic pagination tiebreaker. Removed individual block/timestamp sort fields in favor of consistent newest/oldest.

## 1.0.0

### Major Changes

- [#280](https://github.com/chillwhales/lsp-indexer/pull/280) [`5834874`](https://github.com/chillwhales/lsp-indexer/commit/5834874a26fdc3f1464dee668438840e6c91e4d5) Thanks [@b00ste](https://github.com/b00ste)! - Initial release of @lsp-indexer packages to npm

  This is the first publication of the @lsp-indexer package suite:

  - `@lsp-indexer/types`: Zod schemas and TypeScript types for all indexer domains
  - `@lsp-indexer/node`: GraphQL services, parsers, codegen documents, and typed fetch client
  - `@lsp-indexer/react`: TanStack Query hooks for profiles, digital assets, NFTs, followers, and more
  - `@lsp-indexer/next`: Next.js server actions with 'use server' directive support

## 0.1.0

### Minor Changes

- Initial release of @lsp-indexer/types package with Zod schemas and TypeScript types for all indexer domains
