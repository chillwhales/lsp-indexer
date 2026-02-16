# Requirements: LSP Indexer — React Hooks Package

**Defined:** 2026-02-16
**Core Value:** Any developer can query LUKSO blockchain data through type-safe React hooks backed by a reliable indexer.

## v1.1 Requirements

Requirements for the React hooks package milestone. Each maps to roadmap phases.

### Foundation

- [ ] **FOUND-01**: Developer can install package and get working ESM+CJS+DTS builds with `"use client"` directives
- [ ] **FOUND-02**: Developer can run codegen to generate TypeScript types from Hasura GraphQL schema
- [ ] **FOUND-03**: Developer can configure GraphQL URL (HTTP + WebSocket) via environment variable
- [ ] **FOUND-04**: Developer can wrap app in `<IndexerProvider>` with optional existing QueryClient
- [ ] **FOUND-05**: Developer gets typed `IndexerError` with network, GraphQL, and Hasura permission error categories
- [ ] **FOUND-06**: Developer can import from main (`@lsp-indexer/react`) and server (`@lsp-indexer/react/server`) entry points without bundle contamination
- [ ] **FOUND-07**: A minimal Next.js test app (`apps/test`) exists in the monorepo that imports from `@lsp-indexer/react`, validates hooks work in both client and server components, and catches bundle/export issues during development

### Query Domains

Each domain includes: GraphQL document, parser (snake_case → camelCase), service function, TanStack Query hook, and query key factory entry.

- [ ] **QUERY-01**: Developer can use `useProfile`, `useProfiles`, `useProfileSearch` for Universal Profile data
- [ ] **QUERY-02**: Developer can use `useDigitalAsset`, `useDigitalAssets`, `useDigitalAssetSearch` for Digital Asset data
- [ ] **QUERY-03**: Developer can use `useNft`, `useNfts`, `useNftsByCollection` for NFT data
- [ ] **QUERY-04**: Developer can use `useOwnedAssets`, `useOwnedTokens` for ownership data
- [ ] **QUERY-05**: Developer can use `useFollowers`, `useFollowing`, `useFollowCount` for social/follow data
- [ ] **QUERY-06**: Developer can use `useCreatorAddresses` for asset creator data
- [ ] **QUERY-07**: Developer can use `useEncryptedAsset`, `useEncryptedAssets` for LSP29 encrypted asset data
- [ ] **QUERY-08**: Developer can use `useEncryptedAssetFeed` for LSP29 feed discovery
- [ ] **QUERY-09**: Developer can use `useDataChangedEvents` for ERC725 data change events
- [ ] **QUERY-10**: Developer can use `useUniversalReceiverEvents` for universal receiver events
- [ ] **QUERY-11**: Developer can use `useProfileStats` for aggregate profile statistics

### Pagination

- [ ] **PAGE-01**: Developer can use `useInfinite*` hooks for offset-based infinite scroll on any list domain

### Subscriptions

- [ ] **SUB-01**: Developer can establish WebSocket connection to Hasura with `graphql-ws`, with automatic reconnection
- [ ] **SUB-02**: Developer can use `use*Subscription` hooks for all 11 domains (live data via WebSocket)
- [ ] **SUB-03**: Subscription updates automatically invalidate/update relevant TanStack Query cache entries

### Server Actions

- [ ] **ACTION-01**: Developer can use next-safe-action server actions for all 11 domains
- [ ] **ACTION-02**: Developer can import server utilities from `@lsp-indexer/react/server` without client code leaking
- [ ] **ACTION-03**: All server action inputs are validated with Zod schemas

### Developer Experience

- [ ] **DX-01**: Developer can import all clean camelCase domain types from `@lsp-indexer/react/types`
- [ ] **DX-02**: Developer can import query key factories for cache invalidation and prefetching
- [ ] **DX-03**: Package passes `publint` and `arethetypeswrong` validation for publish readiness

## Future Requirements

Deferred to v1.2+. Tracked but not in current roadmap.

### SSR & Optimization

- **SSR-01**: SSR hydration examples and documentation (prefetch + HydrationBoundary)
- **SSR-02**: Select transform helpers (selectProfileWithImages, selectAssetWithFormattedBalance)
- **SSR-03**: Domain-specific stale time tuning based on real usage data

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature                         | Reason                                                                            |
| ------------------------------- | --------------------------------------------------------------------------------- |
| Custom cache layer              | TanStack Query handles caching — building another creates bugs and maintenance    |
| Apollo/urql adapters            | Package uses typed fetch; consumers can use generated types with their own client |
| Complex query composition/joins | Let consumers compose hooks; Hasura handles relationship joins in single queries  |
| Schema watching/hot reload      | Codegen is build-time; schema validation happens in CI, not at runtime            |
| Mutation/write hooks            | Indexer is read-only; writes happen on-chain via wallets                          |
| Mobile-specific hooks           | React Native support deferred; web-first                                          |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status  |
| ----------- | ----- | ------- |
| FOUND-01    | —     | Pending |
| FOUND-02    | —     | Pending |
| FOUND-03    | —     | Pending |
| FOUND-04    | —     | Pending |
| FOUND-05    | —     | Pending |
| FOUND-06    | —     | Pending |
| FOUND-07    | —     | Pending |
| QUERY-01    | —     | Pending |
| QUERY-02    | —     | Pending |
| QUERY-03    | —     | Pending |
| QUERY-04    | —     | Pending |
| QUERY-05    | —     | Pending |
| QUERY-06    | —     | Pending |
| QUERY-07    | —     | Pending |
| QUERY-08    | —     | Pending |
| QUERY-09    | —     | Pending |
| QUERY-10    | —     | Pending |
| QUERY-11    | —     | Pending |
| PAGE-01     | —     | Pending |
| SUB-01      | —     | Pending |
| SUB-02      | —     | Pending |
| SUB-03      | —     | Pending |
| ACTION-01   | —     | Pending |
| ACTION-02   | —     | Pending |
| ACTION-03   | —     | Pending |
| DX-01       | —     | Pending |
| DX-02       | —     | Pending |
| DX-03       | —     | Pending |

**Coverage:**

- v1.1 requirements: 28 total
- Mapped to phases: 0
- Unmapped: 28 (pending roadmap)

---

_Requirements defined: 2026-02-16_
_Last updated: 2026-02-16 after initial definition_
