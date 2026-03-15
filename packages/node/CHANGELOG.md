# @lsp-indexer/node

## 2.0.0

### Major Changes

- [#318](https://github.com/chillwhales/lsp-indexer/pull/318) [`35eb9b3`](https://github.com/chillwhales/lsp-indexer/commit/35eb9b3eb3fe7bf462958e08b89e353f6fca68c5) Thanks [@b00ste](https://github.com/b00ste)! - LSP29 v2.0.0 encrypted asset spec: replace AccessControlCondition with EncryptionParams, provider-first encryption model, per-backend chunk storage (ipfs/lumera/s3/arweave)

### Patch Changes

- Updated dependencies [[`35eb9b3`](https://github.com/chillwhales/lsp-indexer/commit/35eb9b3eb3fe7bf462958e08b89e353f6fca68c5)]:
  - @lsp-indexer/types@2.0.0

## 1.1.0

### Minor Changes

- [#300](https://github.com/chillwhales/lsp-indexer/pull/300) [`85fe631`](https://github.com/chillwhales/lsp-indexer/commit/85fe631bb18a4e40e8a9f49b61df1d52a79e30bc) Thanks [@b00ste](https://github.com/b00ste)! - Add newest/oldest block-order sorting across all 12 query domains. All domain services now default to newest-first when no sort parameter is provided. Non-block sort fields include block-order as a deterministic pagination tiebreaker. Removed individual block/timestamp sort fields in favor of consistent newest/oldest.

### Patch Changes

- Updated dependencies [[`85fe631`](https://github.com/chillwhales/lsp-indexer/commit/85fe631bb18a4e40e8a9f49b61df1d52a79e30bc)]:
  - @lsp-indexer/types@1.1.0

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

## 0.1.0

### Minor Changes

- Initial release of @lsp-indexer/node package with GraphQL services, parsers, codegen documents, and typed fetch client
