# @lsp-indexer/types

## 1.1.0

### Minor Changes

- Add newest/oldest block-order sorting across all 12 query domains. All domain services now default to newest-first when no sort parameter is provided. Non-block sort fields include block-order as a deterministic pagination tiebreaker. Removed individual block/timestamp sort fields in favor of consistent newest/oldest.

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
