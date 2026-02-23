# Requirements: LSP Indexer — React Hooks Package

**Defined:** 2026-02-16
**Core Value:** Any developer can query LUKSO blockchain data through type-safe React hooks backed by a reliable indexer.

## v1.1 Requirements

Requirements for the React hooks package milestone. Each maps to roadmap phases.

### Foundation

- [x] **FOUND-01**: Developer can install package and get working ESM+CJS+DTS builds with `"use client"` directives
- [x] **FOUND-02**: Developer can run codegen to generate TypeScript types from Hasura GraphQL schema
- [x] **FOUND-03**: Developer can configure GraphQL URL (HTTP + WebSocket) via environment variable
- [x] **FOUND-04**: Developer can wrap app in `<IndexerProvider>` with optional existing QueryClient
- [x] **FOUND-05**: Developer gets typed `IndexerError` with network, GraphQL, and Hasura permission error categories
- [x] **FOUND-06**: Developer can import from `@lsp-indexer/react` (client hooks), `@lsp-indexer/node` (server), and `@lsp-indexer/types` (types) without bundle contamination
- [x] **FOUND-07**: A minimal Next.js test app (`apps/test`) exists in the monorepo that imports from all 4 packages, validates hooks work in both client and server components, and catches bundle/export issues during development

### Query Domains

Each domain includes: GraphQL document, parser (snake_case → camelCase), service function, TanStack Query hook, and query key factory entry.

- [x] **QUERY-01**: Developer can use `useProfile`, `useProfiles`, `useInfiniteProfiles` for Universal Profile data
- [x] **QUERY-02**: Developer can use `useDigitalAsset`, `useDigitalAssets`, `useDigitalAssetSearch` for Digital Asset data
- [x] **QUERY-03**: Developer can use `useNft`, `useNfts`, `useNftsByCollection` for NFT data
- [x] **QUERY-04**: Developer can use `useOwnedAssets`, `useOwnedTokens` for ownership data
- [x] **QUERY-05**: Developer can use `useFollowers`, `useFollowing`, `useFollowCount` for social/follow data
- [x] **QUERY-06**: Developer can use `useCreators`, `useInfiniteCreators` for LSP4 creator data
- [ ] **QUERY-07**: Developer can use `useEncryptedAsset`, `useEncryptedAssets` for LSP29 encrypted asset data
- [ ] **QUERY-08**: Developer can use `useEncryptedAssetFeed` for LSP29 feed discovery
- [ ] **QUERY-09**: Developer can use `useDataChangedEvents` for ERC725 data change events
- [ ] **QUERY-10**: Developer can use `useUniversalReceiverEvents` for universal receiver events

### Pagination

- [ ] **PAGE-01**: Developer can use `useInfinite*` hooks for offset-based infinite scroll on any list domain

### Subscriptions

- [ ] **SUB-01**: Developer can establish WebSocket connection to Hasura with `graphql-ws`, with automatic reconnection
- [ ] **SUB-02**: Developer can use `use*Subscription` hooks for all 11 domains (live data via WebSocket)
- [ ] **SUB-03**: Subscription updates automatically invalidate/update relevant TanStack Query cache entries

### Server Actions

- [ ] **ACTION-01**: Developer can use `@lsp-indexer/next` server actions for all 11 domains
- [ ] **ACTION-02**: Developer can import from `@lsp-indexer/node` (server) without client code leaking
- [ ] **ACTION-03**: All server action inputs are validated with Zod schemas from `@lsp-indexer/types`

### Developer Experience

- [x] **DX-01**: Developer can import all clean camelCase domain types from `@lsp-indexer/types`
- [x] **DX-02**: Developer can import query key factories for cache invalidation and prefetching
- [ ] **DX-03**: All 4 packages pass `publint` and `arethetypeswrong` validation for publish readiness
- [x] **DX-04**: Developer gets TypeScript return types narrowed by `include` parameter — excluded fields are absent from the type, not `null`
- [x] **DX-05**: All domain hooks/services/actions use 3-overload generic `<const I>` pattern with `XResult<I>` narrowing and zero type assertions

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

| Requirement | Phase | Status   |
| ----------- | ----- | -------- |
| FOUND-01    | 7     | Complete |
| FOUND-02    | 7     | Complete |
| FOUND-03    | 7     | Complete |
| FOUND-04    | 7     | Complete |
| FOUND-05    | 7     | Complete |
| FOUND-06    | 7     | Complete |
| FOUND-07    | 7     | Complete |
| QUERY-01    | 8     | Complete |
| DX-01       | 8     | Complete |
| DX-02       | 8     | Complete |
| QUERY-02    | 9.1   | Complete |
| QUERY-03    | 9.2   | Complete |
| QUERY-04    | 9.3   | Complete |
| DX-04       | 9.4   | Complete |
| QUERY-05    | 9.5   | Complete |
| DX-05       | 9.6   | Complete |
| QUERY-06    | 9.7   | Complete |
| QUERY-07    | 9.8   | Complete |
| QUERY-08    | 9.9   | Pending  |
| QUERY-09    | 9.10  | Pending  |
| QUERY-10    | 9.11  | Pending  |
| PAGE-01     | 9     | Pending  |
| SUB-01      | 10    | Pending  |
| SUB-02      | 10    | Pending  |
| SUB-03      | 10    | Pending  |
| ACTION-01   | 11    | Pending  |
| ACTION-02   | 11    | Pending  |
| ACTION-03   | 11    | Pending  |
| DX-03       | 11    | Pending  |

**Coverage:**

- v1.1 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0 ✓

---

_Requirements defined: 2026-02-16_
_Last updated: 2026-02-23 — DX-05 marked Complete (phase 9.6 verified)_
