# Roadmap: LSP Indexer v1.1 — React Hooks Package

**Created:** 2026-02-16
**Depth:** Standard
**Phases:** 9 (Phase 7–15, continuing from v1.0)
**Coverage:** 46/46 v1.1 requirements mapped

## Overview

Ship a set of publishable packages (`@lsp-indexer/types`, `@lsp-indexer/node`, `@lsp-indexer/react`, `@lsp-indexer/next`) that give any app type-safe access to all 11 indexer query domains — with client-side (TanStack Query) hooks, real-time WebSocket subscriptions (graphql-ws), and Next.js server actions (`'use server'`). The phases follow vertical-slice delivery: scaffold the package and validate exports → build one domain end-to-end → replicate across all domains → add subscriptions → add server actions and ship.

**Package architecture:**

```
@lsp-indexer/types  — Zod schemas + inferred TS types (zero framework deps)
@lsp-indexer/node   — services, parsers, documents, codegen, query keys, execute, errors
@lsp-indexer/react  — thin TanStack Query hooks (browser → Hasura directly)
@lsp-indexer/next   — server actions + hooks routing through them (browser → server → Hasura)
```

---

## Phase 7 — Package Foundation

**Goal:** Developer can install the package, run codegen, and see a working build with correct entry points validated in a real Next.js app — before any domain logic exists.

**Dependencies:** None — this is the foundation for v1.1.

**Requirements:**

| ID       | Requirement                                                                                                                                                                                                      |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FOUND-01 | Developer can install package and get working ESM+CJS+DTS builds with `"use client"` directives                                                                                                                  |
| FOUND-02 | Developer can run codegen to generate TypeScript types from Hasura GraphQL schema                                                                                                                                |
| FOUND-03 | Developer can configure GraphQL URL (HTTP + WebSocket) via environment variable                                                                                                                                  |
| FOUND-04 | Developer can wrap app in `<IndexerProvider>` with optional existing QueryClient                                                                                                                                 |
| FOUND-05 | Developer gets typed `IndexerError` with network, GraphQL, and Hasura permission error categories                                                                                                                |
| FOUND-06 | Developer can import from `@lsp-indexer/react` (client hooks), `@lsp-indexer/node` (server), and `@lsp-indexer/types` (types) without bundle contamination                                                       |
| FOUND-07 | A minimal Next.js test app (`apps/test`) exists in the monorepo that imports from all 4 packages, validates hooks work in both client and server components, and catches bundle/export issues during development |

**Plans:** 2 plans

Plans:

- [x] 07-01-PLAN.md — React package scaffold, codegen, error handling, client utilities
- [x] 07-02-PLAN.md — Next.js test app + end-to-end validation

**Success Criteria:**

1. Developer can run `pnpm build` in all 4 packages and get ESM + CJS + DTS output with `"use client"` directives on hook files — verified by inspecting dist output
2. Developer can run codegen against Hasura and see TypeScript types generated with `TypedDocumentString` wrappers — output committed to `packages/node/src/graphql/`, query documents in `packages/node/src/documents/`
3. Developer can import from `@lsp-indexer/react` in a client component and from `@lsp-indexer/node` in a server component without bundle errors — validated by `next build` in the test app (`apps/test`)
4. Developer can wrap a Next.js app in `<IndexerProvider url={...}>` and see TanStack Query context available to child components — with optional existing QueryClient pass-through working
5. Developer can run `publint` and `arethetypeswrong` against each package and see zero errors — exports map is correct for all entry points

---

## Phase 8 — First Vertical Slice (Universal Profiles)

**Goal:** Developer can use complete Universal Profile hooks in a real app — validating the full document → parser → service → hook architecture end-to-end before replicating across 10 more domains.

**Dependencies:** Phase 7 (package scaffold, codegen, build, provider, error handling must exist)

**Requirements:**

| ID       | Requirement                                                                                     |
| -------- | ----------------------------------------------------------------------------------------------- |
| QUERY-01 | Developer can use `useProfile`, `useProfiles`, `useInfiniteProfiles` for Universal Profile data |
| DX-01    | Developer can import all clean camelCase domain types from `@lsp-indexer/types`                 |
| DX-02    | Developer can import query key factories for cache invalidation and prefetching                 |

**Plans:** 4 plans

Plans:

- [x] 08-01-PLAN.md — Profile domain types + GraphQL documents + codegen
- [x] 08-02-PLAN.md — Query key factory + parsers + service functions
- [x] 08-03-PLAN.md — Hooks + entry point wiring + build validation
- [x] 08-04-PLAN.md — Test app profiles playground page + end-to-end verification

**Success Criteria:**

1. Developer can call `useProfile({ address })` in a client component and see typed Universal Profile data rendered — with loading, error, and success states all working
2. Developer can call `useProfiles({ limit: 10 })` and `useProfileSearch({ query: "alice" })` and see correct filtered/paginated results from Hasura
3. Developer can import `profileKeys` from the query key factory and use it for manual cache invalidation (`queryClient.invalidateQueries({ queryKey: profileKeys.all })`) and prefetching
4. Developer can import `Profile` type from `@lsp-indexer/types` and see clean camelCase properties (e.g., `profileName`, `profileImage`) — not Hasura's snake_case
5. Developer can see the test app (`apps/test`) render Universal Profile data from the live Hasura endpoint in both a client component (via hook) and verify the service function works standalone

---

## Phase 9 — Remaining Query Domains & Pagination

**Goal:** Developer can query all 11 indexer domains with consistent hook patterns, and use infinite scroll pagination on any list query.

**Dependencies:** Phase 8 (vertical slice pattern validated — this is replication)

**Structure:** 11 sub-phases — 9 domain sub-phases (one per query domain) plus 2 cross-cutting DX sub-phases (9.4 — conditional include types, 9.6 — generic type propagation). Domain sub-phases follow the same 4-plan vertical-slice pattern established in Phase 8 (types+docs+codegen → parsers+services+keys → hooks+wiring+build → playground+verification). Each sub-phase gets its own branch and PR for granular review.

**Requirements:**

| ID       | Requirement                                                                                                                       | Sub-phase |
| -------- | --------------------------------------------------------------------------------------------------------------------------------- | --------- |
| QUERY-02 | Developer can use `useDigitalAsset`, `useDigitalAssets`, `useDigitalAssetSearch` for Digital Asset data                           | 9.1       |
| QUERY-03 | Developer can use `useNft`, `useNfts`, `useNftsByCollection` for NFT data                                                         | 9.2       |
| QUERY-04 | Developer can use `useOwnedAssets`, `useOwnedTokens` for ownership data                                                           | 9.3       |
| DX-04    | Developer gets TypeScript return types narrowed by `include` parameter — excluded fields are absent from the type, not `null`     | 9.4       |
| QUERY-05 | Developer can use `useFollowers`, `useFollowing`, `useFollowCount` for social/follow data                                         | 9.5       |
| DX-05    | All domain hooks/services/actions use 3-overload generic `<const I>` pattern with `XResult<I>` narrowing and zero type assertions | 9.6       |
| QUERY-06 | Developer can use `useCreators`, `useInfiniteCreators` for LSP4 creator data                                                      | 9.7       |
| QUERY-07 | Developer can use `useIssuedAssets`, `useInfiniteIssuedAssets` for LSP12 issued asset data                                        | 9.8       |
| QUERY-08 | Developer can use `useEncryptedAssetFeed` for LSP29 feed discovery                                                                | 9.9       |
| QUERY-09 | Developer can use `useDataChangedEvents` for ERC725 data change events                                                            | 9.10      |
| QUERY-10 | Developer can use `useUniversalReceiverEvents` for universal receiver events                                                      | 9.11      |
| PAGE-01  | Developer can use `useInfinite*` hooks for offset-based infinite scroll on any list domain                                        | All       |

**Per-domain pattern (4 plans per sub-phase, mirroring Phase 8):**

Each domain follows the validated vertical-slice pattern from Phase 8 (profiles):

1. **Plan 01 — Types + Documents + Codegen:** Zod schemas + TS types in `@lsp-indexer/types`, GraphQL documents using `graphql()` tag in `@lsp-indexer/node`, run codegen
2. **Plan 02 — Parsers + Services + Keys:** Parser (Hasura → clean types), service functions (fetch + paginate), query key factory in `@lsp-indexer/node`
3. **Plan 03 — Hooks + Actions + Wiring:** TanStack Query hooks (useX, useXs, useInfiniteXs) in `@lsp-indexer/react`, server actions in `@lsp-indexer/next`, export from all index.ts files, build validation
4. **Plan 04 — Playground + Verification:** Test app page at `apps/test/src/app/{domain}/page.tsx`, end-to-end verification against live Hasura

---

### Phase 9.1 — Digital Assets

**Goal:** Developer can use `useDigitalAsset`, `useDigitalAssets`, `useInfiniteDigitalAssets` for LSP7/LSP8 digital asset metadata.

**Requirement:** QUERY-02, PAGE-01

**Plans:** 4 plans

- [x] 09.1-01-PLAN.md — Digital Asset types + GraphQL documents + codegen
- [x] 09.1-02-PLAN.md — Digital Asset parsers + services + query keys
- [x] 09.1-03-PLAN.md — Digital Asset hooks + server actions + build validation
- [x] 09.1-04-PLAN.md — Digital Assets playground page + E2E verification

---

### Phase 9.2 — NFTs

**Goal:** Developer can use `useNft`, `useNfts`, `useInfiniteNfts` for LSP8 individual NFT token data.

**Requirement:** QUERY-03, PAGE-01

**Plans:** 4 plans

- [x] 09.2-01-PLAN.md — NFT types + GraphQL documents + codegen
- [x] 09.2-02-PLAN.md — NFT parsers + services + query keys
- [x] 09.2-03-PLAN.md — NFT hooks + server actions + build validation
- [x] 09.2-04-PLAN.md — NFTs playground page + E2E verification

---

### Phase 9.3 — Owned Assets

**Goal:** Developer can use `useOwnedAssets`, `useOwnedTokens`, `useInfiniteOwnedAssets`, `useInfiniteOwnedTokens` for LSP7 fungible + LSP8 NFT ownership data.

**Requirement:** QUERY-04, PAGE-01

**Plans:** 4 plans

- [x] 09.3-01-PLAN.md — Owned Asset/Token types + GraphQL documents + codegen
- [x] 09.3-02-PLAN.md — Owned Asset/Token parsers + services + query keys
- [x] 09.3-03-PLAN.md — Owned Asset/Token hooks + server actions + build validation
- [x] 09.3-04-PLAN.md — Owned Assets playground page + E2E verification

---

### Phase 9.4 — Conditional Include Types

**Goal:** Developer gets TypeScript return types that are narrowed based on the `include` parameter — excluded fields are absent from the type (not `null`), so autocomplete only shows what was requested. Applies to all 5 existing domains (Profiles, Digital Assets, NFTs, Owned Assets, Owned Tokens) and establishes the pattern for all future domains.

**Requirement:** DX-04

**Scope:**

This is a cross-cutting DX refactor that touches types, parsers, hooks, server actions, and the playground across all completed domains. The key technical challenges:

1. **Conditional TypeScript utility types** — `Pick`/`Omit`-based mapped types that derive the return shape from the `include` parameter at the type level (similar to Prisma's `select`/`include` inference)
2. **Nested conditional types** — `include: { digitalAsset: { name: true, symbol: true } }` narrows the nested `digitalAsset` type to only `{ name, symbol }`, not the full 17-field type
3. **Default = everything** — when `include` is omitted entirely, the full type is returned (backward compatible)
4. **Zod ↔ TypeScript interop** — Zod schemas define the _full_ shape; a separate TS utility type layer narrows based on include. Parsers conditionally omit keys instead of setting them to `null`
5. **Hook generic propagation** — TanStack Query hooks parameterized by include shape so `data` is correctly narrowed
6. **5 domains × 3 hooks × 2 packages** (react + next) = 30 hook signatures to update, plus 10 server actions

**Plans:** 5 plans

Plans:

- [x] 09.4-01-PLAN.md — Shared utility types (IncludeResult, stripExcluded) + Profile domain end-to-end
- [x] 09.4-02-PLAN.md — Digital Assets domain with standard↔decimals derived field handling
- [x] 09.4-03-PLAN.md — NFTs + Owned Assets domains with nested relation narrowing
- [x] 09.4-04-PLAN.md — Owned Tokens domain (most complex — 4 nested relations)
- [x] 09.4-05-PLAN.md — Playground cards update + full build validation

---

### Phase 9.5 — Social / Follows

**Goal:** Developer can use `useFollowers`, `useFollowing`, `useFollowCount`, `useInfiniteFollowers`, `useInfiniteFollowing` for LSP26 social graph data.

**Requirement:** QUERY-05, PAGE-01

**Plans:** 4 plans

- [x] 09.5-01-PLAN.md — Follower types + conditional include types + GraphQL documents + codegen
- [x] 09.5-02-PLAN.md — Follower parser (with stripExcluded) + services (3 functions) + query keys
- [x] 09.5-03-PLAN.md — 6 React hooks + 3 server actions + 6 Next.js hooks + build validation
- [x] 09.5-04-PLAN.md — FollowerCard + Follows playground page (6 tabs) + nav update

---

### Phase 9.6 — Generic Type Propagation

**Goal:** All 5 existing domain hooks, services, actions, and parsers use the 3-overload generic `<const I>` pattern established in followers — propagating `XResult<I>` narrowed types from parser → service → action → hook → consumer with zero type assertions. Fixes `error: unknown` → `error: Error` on all hook returns.

**Requirement:** DX-05

**Scope:**

This is a cross-cutting DX refactor that updates overload signatures across 5 domains × 5 layers = 25 files. The key changes per domain:

1. **Parser:** Add generic `<const I>` middle overload returning `XResult<I>` (between existing no-include and PartialX overloads)
2. **Service:** Add generic `<const I>` overload to detail and list functions returning `XResult<I>` / `FetchXsResult<XResult<I>>`
3. **Action:** Add generic `<const I>` overload to detail and list server actions matching service pattern
4. **React hooks:** Add 3-overload pattern with `UseXReturn<F>` / `UseInfiniteXReturn<F>` return type aliases using `UseQueryResult<T, Error>` and `UseInfiniteQueryResult<InfiniteData<T>, Error>`
5. **Next hooks:** Same 3-overload + return type alias pattern as React hooks

No implementation bodies change — only overload signatures and return type annotations.

**Plans:** 3 plans

- [x] 09.6-01-PLAN.md — Parsers + services: add generic overloads to all 5 domains (node package)
- [x] 09.6-02-PLAN.md — Actions + hooks: add generic overloads + return type aliases (next + react packages)
- [x] 09.6-03-PLAN.md — Build validation + verification across all 4 packages

---

### Phase 9.7 — Creators

**Goal:** Developer can use `useCreators`, `useInfiniteCreators` for LSP4 creator data.

**Requirement:** QUERY-06, PAGE-01

**Plans:** 4 plans

- [x] 09.7-01-PLAN.md — Creator types + GraphQL documents + codegen
- [x] 09.7-02-PLAN.md — Creator parsers + services + query keys
- [x] 09.7-03-PLAN.md — Creator hooks + server actions + build validation
- [x] 09.7-04-PLAN.md — Creators playground page + E2E verification

---

### Phase 9.8 — Issued Assets

**Goal:** Developer can use `useIssuedAssets`, `useInfiniteIssuedAssets` for LSP12 issued asset data — querying which digital assets were issued by which addresses/profiles.

**Requirement:** QUERY-07, PAGE-01

**Plans:** 4 plans

- [x] 09.8-01-PLAN.md — Issued Asset types + GraphQL documents + codegen
- [x] 09.8-02-PLAN.md — Issued Asset parsers + services + query keys
- [x] 09.8-03-PLAN.md — Issued Asset hooks + server actions + build validation
- [x] 09.8-04-PLAN.md — Issued Assets playground page + E2E verification

---

### Phase 9.9 — Encrypted Assets

**Goal:** Developer can use `useEncryptedAssets`, `useInfiniteEncryptedAssets` for LSP29 encrypted asset metadata — rich data from the `lsp29_encrypted_asset` table with encryption, file, chunks, images, and profile relations.

**Requirement:** QUERY-08, PAGE-01

**Plans:** 4 plans

- [x] 09.9-01-PLAN.md — Encrypted Asset types (5 sub-schemas + conditional include with encryption sub-include) + GraphQL document + codegen
- [x] 09.9-02-PLAN.md — Encrypted Asset parser (title/description flattening, encryption/file/chunks/images sub-parsing) + service + query keys
- [x] 09.9-03-PLAN.md — Encrypted Asset hooks + server action + build validation
- [x] 09.9-04-PLAN.md — ImageList reusable component + EncryptedAssetCard + backport to existing cards + playground page + E2E verification

---

### Phase 9.10 — Data Changed Events

**Goal:** Developer can use `useDataChangedEvents`, `useInfiniteDataChangedEvents` for contract-level ERC725 data change events AND `useTokenIdDataChangedEvents`, `useInfiniteTokenIdDataChangedEvents` for per-token data change events — two distinct domains implemented together in one phase.

**Requirement:** QUERY-09, PAGE-01

**Plans:** 4 plans

- [x] 09.10-01-PLAN.md — DataChangedEvent + TokenIdDataChangedEvent types (both domains) + GraphQL documents + codegen
- [x] 09.10-02-PLAN.md — Data key resolver utility (10 @lukso packages) + parsers + services + query keys for both domains
- [x] 09.10-03-PLAN.md — 4 React hooks + 2 server actions + 4 Next.js hooks + build validation
- [x] 09.10-04-PLAN.md — DataChangedEventCard + TokenIdDataChangedEventCard + playground page (4 tabs) + E2E verification

---

### Phase 9.11 — Universal Receiver Events

**Goal:** Developer can use `useUniversalReceiverEvents`, `useInfiniteUniversalReceiverEvents` for universal receiver event history.

**Requirement:** QUERY-10, PAGE-01

**Plans:** 4 plans

- [x] 09.11-01-PLAN.md — Universal Receiver Event types (6 base + 4 scalar + 3 relations) + GraphQL document (46 vars) + codegen
- [x] 09.11-02-PLAN.md — Universal Receiver Event parser (3-relation mapping) + service (3 prefix replacements) + query keys
- [x] 09.11-03-PLAN.md — 2 React hooks + server action + 2 Next.js hooks + build validation
- [x] 09.11-04-PLAN.md — UniversalReceiverEventCard (3 collapsible sections) + playground page (2 tabs) + nav update

---

### Phase 9.12 — Block-Ordered Sorting (INSERTED)

**Goal:** All event domains sort by `blockNumber → transactionIndex → logIndex` instead of timestamp for deterministic ordering — multiple events can share the same block timestamp, so timestamp alone is not sufficient for first/last ordering. Extract a shared sorting utility and apply across all event domains.

**Depends on:** Phase 9.11 (all event domains must exist)

**Scope:**

Cross-cutting refactor of 4 event domains that have `block_number`, `transaction_index`, and `log_index` fields:

1. **Followers** (9.5) — `follower` table
2. **Data Changed Events** (9.10) — `data_changed` table
3. **Token ID Data Changed Events** (9.10) — `token_id_data_changed` table
4. **Universal Receiver Events** (9.11) — `universal_receiver` table

Entity tables (`lsp4_creator`, `owned_asset`, `owned_token`, `lsp29_encrypted_asset`, `issued_asset`) are NOT affected — they only have `timestamp`, no block-level ordering fields.

**Key changes:**

- Extract shared `buildBlockOrderSort()` utility in `@lsp-indexer/node` — produces Hasura `order_by` arrays like `[{ block_number: desc }, { transaction_index: desc }, { log_index: desc }]` (or asc) for deterministic event ordering at the DB/Hasura layer
- Replace timestamp-based default sorting in all 4 event domain services with this block-based Hasura `order_by` sort
- Replace `timestamp` and `blockNumber` sort fields with consumer-friendly `newest` (block-order desc) and `oldest` (block-order asc) sort fields — abstracts away blockchain terminology so consumers never see `blockNumber`, `transactionIndex`, or `logIndex`
- Update playground sort controls for affected domains to use `newest`/`oldest` sort fields, hiding Direction/Nulls dropdowns when selected

**Plans:** 3 plans

Plans:

- [x] 09.12-01-PLAN.md — Shared utility + type schema updates (sort fields + Follower block fields)
- [x] 09.12-02-PLAN.md — Follower document/parser + all 4 service sort builders + default sort
- [x] 09.12-03-PLAN.md — Playground sort options + SortControls conditional hide/show + build validation

---

**Phase 9 overall success criteria:**

1. Developer can use hooks for all 11 domains and see typed data returned — every domain follows the same document → parser → service → hook pattern established in Phase 8
2. Developer can call `useInfiniteProfiles()`, `useInfiniteDigitalAssets()`, `useInfiniteNfts()`, etc. and see offset-based infinite scroll working with `fetchNextPage` / `hasNextPage`
3. Developer can import query key factories for all 11 domains and use them for targeted cache invalidation (e.g., `digitalAssetKeys.detail(address)`, `nftKeys.byCollection(address)`)
4. Developer can import all domain types from `@lsp-indexer/types` — all 11 domains export clean camelCase types
5. Developer gets TypeScript return types narrowed by `include` parameter — `useProfile({ address, include: { name: true } })` returns a type where only `address` + `name` exist, excluded fields are absent from autocomplete

---

## Phase 10 — Subscriptions

**Goal:** Developer can subscribe to real-time updates on any domain via WebSocket, with subscription data automatically keeping query caches fresh.

**Dependencies:** Phase 9 (all domain services and query hooks must exist for cache integration)

**Structure:** 13 sub-phases — 1 foundation sub-phase (10.1) plus 12 domain sub-phases (10.2–10.13, one per domain). Core subscription infrastructure (SubscriptionClient, context, provider, useSubscription hook, WebSocket proxy) already exists from prior work. The foundation sub-phase commits a type-safety revamp and adds subscription documents. Each domain sub-phase creates its subscription hook + playground demo.

**Requirements:**

| ID     | Requirement                                                                                           |
| ------ | ----------------------------------------------------------------------------------------------------- |
| SUB-01 | Developer can establish WebSocket connection to Hasura with `graphql-ws`, with automatic reconnection |
| SUB-02 | Developer can use `use*Subscription` hooks for all 12 domains (live data via WebSocket)               |
| SUB-03 | Subscription updates automatically invalidate/update relevant TanStack Query cache entries            |

### Phase 10.1 — Subscription Foundation & Type Safety

**Goal:** Type-safe subscription infrastructure with zero type assertions, exported where-clause builders, and test app wired with subscription provider — the foundation all 12 domain sub-phases build on.

**Requirement:** SUB-01

**Plans:** 1/1 plans complete

Plans:

- [x] 10.1-01-PLAN.md — Type-safety revamp (4-generic SubscriptionConfig) + export 12 buildXWhere functions + wire provider + playground skeleton

---

### Phase 10.2 — Profiles Subscription

**Goal:** Developer can use `useProfileSubscription` with full type inference from TypedDocumentString through to consumer.

**Requirement:** SUB-02, SUB-03

**Plans:** 1/1 plans complete

- [x] 10.2-01-PLAN.md — useProfileSubscription hook + playground demo

---

### Phase 10.3 — Digital Assets Subscription

**Goal:** Developer can use `useDigitalAssetSubscription` for live digital asset data.

**Requirement:** SUB-02, SUB-03

**Plans:** 1/1 plans complete

- [x] 10.3-01-PLAN.md — Factory refactoring + useDigitalAssetSubscription (include/sort/3-overload) + dual-package export + playground

---

### Phase 10.4 — NFTs Subscription

**Goal:** Developer can use `useNftSubscription` for live NFT data.

**Requirement:** SUB-02, SUB-03

**Plans:** 1/1 plans complete

- [x] 10.4-01-PLAN.md — useNftSubscription hook + playground demo

---

### Phase 10.5 — Owned Assets Subscription

**Goal:** Developer can use `useOwnedAssetSubscription` for live owned asset data.

**Requirement:** SUB-02, SUB-03

**Plans:** 1/1 plans complete

- [x] 10.5-01-PLAN.md — useOwnedAssetSubscription hook + playground demo

---

### Phase 10.6 — Owned Tokens Subscription

**Goal:** Developer can use `useOwnedTokenSubscription` for live owned token data.

**Requirement:** SUB-02, SUB-03

**Plans:** 1/1 plans complete

- [ ] 10.6-01-PLAN.md — useOwnedTokenSubscription hook + playground demo

---

### Phase 10.7 — Followers Subscription

**Goal:** Developer can use `useFollowerSubscription` for live follower events with block-order desc sorting.

**Requirement:** SUB-02, SUB-03

**Plans:** 1/1 plans complete

- [ ] 10.7-01-PLAN.md — Factory refactoring + useFollowerSubscription (include/sort/3-overload/event-domain-sort) + dual-package export + playground

---

### Phase 10.8 — Creators Subscription

**Goal:** Developer can use `useCreatorSubscription` for live creator data.

**Requirement:** SUB-02, SUB-03

**Plans:** 1/1 plans complete

- [ ] 10.8-01-PLAN.md — Factory refactoring + useCreatorSubscription (include/sort/3-overload) + dual-package export + playground

---

### Phase 10.9 — Issued Assets Subscription

**Goal:** Developer can use `useIssuedAssetSubscription` for live issued asset data.

**Requirement:** SUB-02, SUB-03

**Plans:** 1/1 plans complete

- [x] 10.9-01-PLAN.md — Factory refactoring + useIssuedAssetSubscription (include/sort/3-overload) + dual-package export + playground

---

### Phase 10.10 — Encrypted Assets Subscription

**Goal:** Developer can use `useEncryptedAssetSubscription` for live encrypted asset feed — the primary use case from CONTEXT.md.

**Requirement:** SUB-02, SUB-03

**Plans:** 1/1 plans complete

Plans:

- [x] 10.10-01-PLAN.md — Factory refactoring + useEncryptedAssetSubscription (include/sort/3-overload) + dual-package export + playground

---

### Phase 10.11 — Data Changed Events Subscription

**Goal:** Developer can use `useDataChangedEventSubscription` for live ERC725Y data change events with block-order desc sorting.

**Requirement:** SUB-02, SUB-03

**Plans:** 1/1 plans complete

- [ ] 10.11-01-PLAN.md — useDataChangedEventSubscription hook + playground demo

---

### Phase 10.12 — Token ID Data Changed Events Subscription

**Goal:** Developer can use `useTokenIdDataChangedEventSubscription` for live token ID data change events with block-order desc sorting.

**Requirement:** SUB-02, SUB-03

**Plans:** 1/1 plans complete

Plans:

- [ ] 10.12-01-PLAN.md — Factory refactoring + useTokenIdDataChangedEventSubscription (include/sort/3-overload/event-domain-sort) + dual-package export + directory migration + playground

---

### Phase 10.13 — Universal Receiver Events Subscription

**Goal:** Developer can use `useUniversalReceiverEventSubscription` for live universal receiver events with block-order desc sorting.

**Requirement:** SUB-02, SUB-03

**Plans:** 1/1 plans complete

- [ ] 10.13-01-PLAN.md — Factory refactoring + useUniversalReceiverEventSubscription (include/sort/3-overload/event-domain-sort) + dual-package export + directory migration + playground

---

**Phase 10 overall success criteria:**

1. Developer can see a WebSocket connection established to Hasura's `ws://` endpoint when any subscription hook mounts — with automatic reconnection on disconnect visible in browser devtools
2. Developer can call `useProfileSubscription({ address })` and see the component re-render within seconds when that profile's on-chain data changes — without manual refetch
3. Developer can observe that when a subscription fires, the corresponding TanStack Query cache entry is invalidated or updated (e.g., `useProfile` returns fresh data after `useProfileSubscription` receives an update)
4. Developer can see subscription hooks for all 12 domains following a consistent pattern — each has a subscription document, hook, and cache integration
5. Zero type assertions (`as`), zero `unknown`, zero `any` in the subscription data path — full end-to-end type inference from TypedDocumentString through extract/parser to consumer

---

## Phase 11 — Server Actions & Publish Readiness

**Goal:** Developer can use `@lsp-indexer/next` server actions for all domains from Next.js Server Components, and all 4 packages pass publish validation checks.

**Dependencies:** Phase 9 (all domain services must exist — actions wrap services), Phase 10 (subscriptions should be complete for full package validation)

**Note:** Profile domain server actions (`getProfile`, `getProfiles`) and corresponding hooks (`useProfile`, `useProfiles`, `useInfiniteProfiles`) already exist in `@lsp-indexer/next` from Phase 8. Phase 11 replicates this pattern to the remaining 10 domains and adds Zod input validation + publish readiness checks.

**Plans:** 2/2 plans complete

Plans:

- [ ] 11-01-PLAN.md — Zod input validation: VALIDATION error types + validate utility + wire all 11 domain action files
- [ ] 11-02-PLAN.md — Publish readiness: publint + arethetypeswrong + bundle separation + npm pack audit

**Requirements:**

| ID        | Requirement                                                                           |
| --------- | ------------------------------------------------------------------------------------- |
| ACTION-01 | Developer can use `@lsp-indexer/next` server actions for all 11 domains               |
| ACTION-02 | Developer can import from `@lsp-indexer/node` (server) without client code leaking    |
| ACTION-03 | All server action inputs are validated with Zod schemas from `@lsp-indexer/types`     |
| DX-03     | All 4 packages pass `publint` and `arethetypeswrong` validation for publish readiness |

**Success Criteria:**

1. Developer can call `getProfile(address)` from `@lsp-indexer/next` as a server action in a Next.js Server Component and see typed data returned — without any client-side JavaScript shipped to the browser
2. Developer can import from `@lsp-indexer/node` in a server context and run `next build` with zero "client-only code in server" errors — package separation is bulletproof
3. Developer can see Zod validation errors when passing invalid inputs to server actions (e.g., invalid address format) — with typed error responses from `@lsp-indexer/types` schemas
4. Developer can run `publint` and `arethetypeswrong` against all 4 packages and see zero errors — `@lsp-indexer/types`, `@lsp-indexer/node`, `@lsp-indexer/react`, `@lsp-indexer/next`
5. Developer can `npm pack` each package and see only `dist/` and `README.md` included — no source files, no test fixtures, no generated intermediates

---

## Progress

| Phase | Name                              | Requirements | Status      |
| ----- | --------------------------------- | :----------: | ----------- |
| 7     | Package Foundation                |     7/7      | Complete    |
| 8     | First Vertical Slice (Profiles)   |     3/3      | Complete    |
| 9.1   | Digital Assets                    |     1/1      | Complete    |
| 9.2   | NFTs                              |     1/1      | Complete    |
| 9.3   | Owned Assets                      |     1/1      | Complete    |
| 9.4   | Conditional Include Types         |     1/1      | Complete    |
| 9.5   | Social / Follows                  |     1/1      | Complete    |
| 9.6   | Generic Type Propagation          |     1/1      | Complete    |
| 9.7   | Creators                          |     1/1      | Complete    |
| 9.8   | Issued Assets                     |     1/1      | Complete    |
| 9.9   | Encrypted Feed                    |     1/1      | Complete    |
| 9.10  | Data Changed Events               |     1/1      | Complete    |
| 9.11  | Universal Receiver Events         |     1/1      | Complete    |
| 9.12  | Block-Ordered Sorting (INSERTED)  |      0       | Complete    |
| 10.1  | Subscription Foundation           |     1/1      | Complete    |
| 10.2  | Profiles Subscription             |     1/1      | Complete    |
| 10.3  | Digital Assets Subscription       |     1/1      | Complete    |
| 10.4  | NFTs Subscription                 |     1/1      | Complete    |
| 10.5  | Owned Assets Subscription         |     1/1      | Complete    |
| 10.6  | Owned Tokens Subscription         |     1/1      | Complete    |
| 10.7  | Followers Subscription            |     1/1      | Complete    |
| 10.8  | Creators Subscription             |     1/1      | Complete    |
| 10.9  | Issued Assets Subscription        |     1/1      | Complete    |
| 10.10 | Encrypted Assets Subscription     |     1/1      | Complete    |
| 10.11 | Data Changed Events Subscription  |     1/1      | Complete    |
| 10.12 | Token ID Data Changed Sub.        |     1/1      | Complete    |
| 10.13 | Universal Receiver Events Sub.    |     1/1      | Complete    |
| 11    | Server Actions & Publish Ready    |     4/4      | Complete    |
| 12    | Replace Local Pkgs → @chillwhales |     2/2      | Complete    |
| 13    | 1/2 | In Progress|  |
| 14    | Comments Cleanup & Release Prep   |      4       | Not started |
| 15    | CI/CD Workflows & Shared Infra    |      4       | Not started |

_Note:_ Phase 9 has 12 requirements total: 9 QUERY requirements (one per domain sub-phase), DX-04 (conditional include types), DX-05 (generic type propagation), plus PAGE-01 which is delivered incrementally across all sub-phases and counted once globally.

**Total:** 25/30 requirements delivered (SUB-02, SUB-03 incremental via Phases 10.2–10.5)

---

## Dependency Graph

```
Phase 7 (Package Foundation)
  └──→ Phase 8 (First Vertical Slice — Universal Profiles + 4-package split)
         └──→ Phase 9 (Remaining Query Domains + DX — 11 sub-phases)
                ├──→ 9.1 (Digital Assets)
                ├──→ 9.2 (NFTs)
                ├──→ 9.3 (Owned Assets)
                ├──→ 9.4 (Conditional Include Types) ←── depends on 9.1–9.3 (refactors existing domains)
                ├──→ 9.5 (Social / Follows) ←── built with DX-04 pattern from start
                ├──→ 9.6 (Generic Type Propagation) ←── depends on 9.5 (applies followers pattern to 9.1–9.4 + profiles)
                ├──→ 9.7 (Creators)
                ├──→ 9.8 (Issued Assets)
                ├──→ 9.9 (Encrypted Feed)
                ├──→ 9.10 (Data Changed Events)
                ├──→ 9.11 (Universal Receiver Events)
                └──→ 9.12 (Block-Ordered Sorting) ←── INSERTED: refactors 9.5, 9.10, 9.11 event domains
                       ↓ (all 9.x must complete)
                ├──→ Phase 10 (Subscriptions — 13 sub-phases)
                │      └──→ 10.1 (Subscription Foundation & Type Safety)
                │             └──→ 10.2–10.13 (one per domain — hook + playground demo)
                └──→ Phase 11 (Server Actions & Publish Readiness) ←── also depends on Phase 10
                       └──→ Phase 12 (Replace Local Packages → @chillwhales NPM) ←── stable codebase required
                              └──→ Phase 13 (Indexer v1 Cleanup — remove v1, promote v2) ←── migrations complete
                                     └──→ Phase 14 (Code Comments Cleanup & Release Prep) ←── final codebase shape
                                            └──→ Phase 15 (CI/CD Workflows & Shared Infra) ←── release-ready code
```

**Package dependency graph:**

```
@lsp-indexer/types ← @lsp-indexer/node ← @lsp-indexer/react
                                        ← @lsp-indexer/next
```

**Parallelization opportunities:**

- Within Phase 7: Codegen pipeline and build tooling can be worked in parallel with provider/error handling
- Within Phase 9: Domain sub-phases (9.1–9.3, 9.5, 9.7–9.11) are independent of each other — can be built in any order. Phase 9.4 (Conditional Include Types) depends on at least some domains existing to refactor. Phase 9.6 (Generic Type Propagation) depends on 9.5 (applies followers pattern to all earlier domains). Domain sub-phases 9.7–9.11 should ideally run after 9.6 so they're built with the correct pattern from the start. Each sub-phase gets its own branch and PR for granular review.
- Phase 10 and Phase 11 both depend on Phase 9, but Phase 11's ACTION-01/ACTION-02/ACTION-03 could technically start as soon as Phase 9 completes (only DX-03 needs Phase 10 for full validation)

---

## Coverage Validation

All 46 v1.1 requirements mapped to exactly one phase:

| Requirement | Phase | Category                      |
| ----------- | ----- | ----------------------------- |
| FOUND-01    | 7     | Foundation                    |
| FOUND-02    | 7     | Foundation                    |
| FOUND-03    | 7     | Foundation                    |
| FOUND-04    | 7     | Foundation                    |
| FOUND-05    | 7     | Foundation                    |
| FOUND-06    | 7     | Foundation                    |
| FOUND-07    | 7     | Foundation                    |
| QUERY-01    | 8     | Query Domains                 |
| DX-01       | 8     | Developer Exp                 |
| DX-02       | 8     | Developer Exp                 |
| QUERY-02    | 9.1   | Query Domains                 |
| QUERY-03    | 9.2   | Query Domains                 |
| QUERY-04    | 9.3   | Query Domains                 |
| DX-04       | 9.4   | Developer Exp                 |
| QUERY-05    | 9.5   | Query Domains                 |
| DX-05       | 9.6   | Developer Exp                 |
| QUERY-06    | 9.7   | Query Domains                 |
| QUERY-07    | 9.8   | Query Domains (Issued Assets) |
| QUERY-08    | 9.9   | Query Domains                 |
| QUERY-09    | 9.10  | Query Domains                 |
| QUERY-10    | 9.11  | Query Domains                 |
| PAGE-01     | 9.\*  | Pagination                    |
| SUB-01      | 10    | Subscriptions                 |
| SUB-02      | 10    | Subscriptions                 |
| SUB-03      | 10    | Subscriptions                 |
| ACTION-01   | 11    | Server Actions                |
| ACTION-02   | 11    | Server Actions                |
| ACTION-03   | 11    | Server Actions                |
| DX-03       | 11    | Developer Exp                 |

| MIGRATE-01 | 12 | Migration (data-keys → erc725) |
| MIGRATE-02 | 12 | Migration (lsp1 → @chillwhales/lsp1) |
| MIGRATE-03 | 12 | Migration (upstream PRs) |
| MIGRATE-04 | 12 | Migration (build validation) |
| CLEAN-01 | 13 | Cleanup (v1 removal + v2 rename) |
| CLEAN-02 | 13 | Cleanup (Docker v1 removal) |
| CLEAN-03 | 13 | Cleanup (root scripts) |
| CLEAN-04 | 13 | Cleanup (config files) |
| RELEASE-01 | 14 | Release (dead comments removal) |
| RELEASE-02 | 14 | Release (API JSDoc) |
| RELEASE-03 | 14 | Release (test app docs) |
| RELEASE-04 | 14 | Release (publish validation) |
| CICD-01 | 15 | CI/CD (layered CI pipeline) |
| CICD-02 | 15 | CI/CD (changesets release) |
| CICD-03 | 15 | CI/CD (preview releases) |
| CICD-04 | 15 | CI/CD (shared infra investigation) |

**Mapped: 46/46 ✓ — No orphans, no duplicates.**

---

## Roadmap Rationale

### Why 5 phases (not 4)?

Research suggested 4 phases with subscriptions out of scope. The user added subscriptions (SUB-01, SUB-02, SUB-03) requiring WebSocket transport (graphql-ws) and cache integration — a genuinely new capability that doesn't belong in any existing phase. This naturally creates Phase 10.

### Why DX-01 and DX-02 in Phase 8 (not Phase 9)?

The types package (`@lsp-indexer/types`) and query key factory pattern need to be validated with the first domain before replicating. If the pattern is wrong, it's cheaper to fix with 1 domain than 11. Phase 9 then replicates the validated pattern.

### Why DX-03 in Phase 11 (not earlier)?

`publint` and `arethetypeswrong` validation for publish readiness only makes sense when all 4 packages have their full domain coverage — including `@lsp-indexer/next` server actions. Running it earlier would miss domains still being added.

### Why conditional include types as Phase 9.4 (not later)?

Conditional include types (DX-04) refactor the return type system across all existing domains. Doing this _before_ building the remaining 6 domain sub-phases (9.5, 9.7–9.11) means those domains are built with the correct pattern from the start — no rework needed. If deferred to after all domains, every domain would need retrofitting. The research-first approach (plan 01 is a design spike) minimizes risk of a bad type pattern propagating.

### Why generic type propagation as Phase 9.6 (not later)?

Generic type propagation (DX-05) updates all 5 existing domains to use the 3-overload `<const I>` pattern established in followers. Doing this _before_ building the remaining 5 domain sub-phases (9.7–9.11) means those domains will be built following the correct pattern from the start — no rework needed. Similar rationale to Phase 9.4 (conditional include types): fix the pattern once, then replicate.

### Why subscriptions before server actions?

Subscriptions (Phase 10) add cache integration logic that affects the query layer from Phase 9. Server actions in `@lsp-indexer/next` (Phase 11) are isolated wrappers around `@lsp-indexer/node` services — they don't affect the query/subscription layer. Building subscriptions first means the full client-side story (queries + subscriptions) is complete before expanding the server-side layer to all domains.

## Phase 12 — Replace Local Packages with @chillwhales NPM Packages

**Goal:** Codebase uses `@chillwhales/erc725` and `@chillwhales/lsp1` from npm instead of local `packages/data-keys/` and `packages/lsp1/` — reducing maintained code and aligning with the shared LUKSO Standards ecosystem. Any extractable utilities from this repo are contributed upstream via PRs to `chillwhales/LSPs`.

**Dependencies:** Phase 11 (all packages publish-ready — migration happens on a stable, fully-functional codebase)

**Requirements:**

| ID         | Requirement                                                                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MIGRATE-01 | `packages/data-keys/` removed and all imports replaced with `@chillwhales/erc725` equivalents (`resolveDataKeyName`, `resolveDataKeyHex`, `DataKeyNameSchema`) |
| MIGRATE-02 | `packages/lsp1/` removed and all imports replaced with `@chillwhales/lsp1` equivalents (`resolveTypeIdName`, `resolveTypeIdHex`, `TypeIdNameSchema`)           |
| MIGRATE-03 | Utility functions in this repo that are generic enough for the LUKSO ecosystem are identified, extracted, and contributed as PRs to `chillwhales/LSPs`         |
| MIGRATE-04 | All 4 publishable packages (`@lsp-indexer/types`, `@lsp-indexer/node`, `@lsp-indexer/react`, `@lsp-indexer/next`) build and pass validation after migration    |

**Plans:** 2/2 plans complete

Plans:

- [ ] 12-01-PLAN.md — Dependency swap (data-keys → @chillwhales/erc725, lsp1 → @chillwhales/lsp1) + build validation
- [ ] 12-02-PLAN.md — Cross-check audit of @chillwhales packages + upstream contribution PR

**Success Criteria:**

1. Developer can `pnpm build` all packages and see zero errors — `@chillwhales/erc725` and `@chillwhales/lsp1` are resolved from `node_modules`, not local workspace packages
2. `packages/data-keys/` and `packages/lsp1/` directories no longer exist in the repo — no local data-key or type-ID registry code is maintained
3. All existing functionality (data key name resolution in parsers, type ID resolution in universal receiver events, Zod schemas in types package) works identically with the npm packages
4. At least one PR is opened to `chillwhales/LSPs` with utility functions extracted from this repo that benefit the broader ecosystem
5. `publint` and `arethetypeswrong` still pass on all 4 publishable packages after the dependency swap

## Phase 13 — Indexer v1 Cleanup

**Goal:** The repo has one indexer (`packages/indexer/`, currently `indexer-v2`) and one Docker setup — all v1 code, Docker images, scripts, and root-level v1 commands are gone. `packages/indexer-v2/` becomes the canonical `packages/indexer/`.

**Dependencies:** Phase 12 (dependency migrations complete — cleanup happens on a fully migrated codebase)

**Requirements:**

| ID       | Requirement                                                                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CLEAN-01 | `packages/indexer/` (v1) removed and `packages/indexer-v2/` renamed to `packages/indexer/` as the canonical indexer                                     |
| CLEAN-02 | `docker/v1/` removed — only the v2 Docker setup (`docker/v2/` or promoted to `docker/`) remains                                                         |
| CLEAN-03 | Root `package.json` scripts updated: v1 `start` removed, `start:v2` promoted to `start`, no dead references to `@chillwhales/indexer` (v1 package name) |
| CLEAN-04 | All config files (ESLint ignores, workspace config, tsconfig references) updated to reflect the renamed package — zero stale paths                      |

**Plans:** 1/2 plans executed

Plans:

- [ ] 13-01-PLAN.md — Delete v1 package + Docker, rename v2 → canonical, update all configs + CI
- [ ] 13-02-PLAN.md — Comparison tool v1 mode removal + documentation sweep

**Success Criteria:**

1. `packages/indexer/` contains the v2 indexer code (plugin architecture, pino logging, vitest tests) — no `packages/indexer-v2/` exists
2. `docker/v1/` directory no longer exists — only one Docker configuration remains for the current indexer
3. `pnpm start` in the repo root runs the (formerly v2) indexer — no `start:v2` script exists
4. `pnpm build` completes without errors — no broken workspace references to removed packages
5. ESLint, TypeScript, and workspace configs have zero references to the old v1 package paths

## Phase 14 — Code Comments Cleanup & Release Prep

**Goal:** Every published package has clean, consumer-facing JSDoc/TSDoc comments — no dead comments, no `.planning` references, no outdated implementation notes. The test app is easy to navigate for hook consumers. All packages are ready for public npm release.

**Dependencies:** Phase 13 (repo structure finalized — comments cleanup happens on the final codebase shape)

**Requirements:**

| ID         | Requirement                                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| RELEASE-01 | All dead, outdated, and `.planning`-referencing comments removed from all packages (`types`, `node`, `react`, `next`) and the test app                             |
| RELEASE-02 | All public API exports have concise JSDoc/TSDoc comments explaining purpose, params, and return types — oriented toward package consumers, not internal developers |
| RELEASE-03 | Test app (`apps/test`) has clear page-level comments and component documentation making it easy for hook consumers to understand usage patterns                    |
| RELEASE-04 | All 4 publishable packages pass final validation (`publint`, `arethetypeswrong`, `pnpm build`) and are ready for `npm publish`                                     |

**Plans:** 0 plans

Plans:

- [ ] TBD (run `/gsd-plan-phase 14` to break down)

**Success Criteria:**

1. Zero comments in any `.ts`/`.tsx` file reference `.planning`, `PLAN`, `Phase`, `TODO` (planning artifacts), or contain stale implementation notes that no longer match the code
2. Developer can hover over any exported hook, type, service, or action in their IDE and see a concise JSDoc description with `@param` and `@returns` — no "TODO" or "FIXME" in any public API doc
3. Test app pages have clear header comments explaining what each page demonstrates — a new developer can understand the hook usage patterns within minutes
4. `pnpm build && pnpm validate:publish` passes with zero errors across all 4 packages — ready for `npm publish`
5. `pnpm lint` passes with zero warnings related to unused code or dead comments

## Phase 15 — CI/CD Workflows & Shared Infra

**Goal:** This repo has the same CI/CD workflow quality as `chillwhales/LSPs` — layered CI (lint, typecheck, build, test, package verification), changesets-based release, and preview releases. Shared workflow logic is abstracted into a reusable third repo so both repos (and future repos) use identical pipeline patterns.

**Dependencies:** Phase 14 (code is clean and release-ready — CI/CD is the delivery mechanism)

**Requirements:**

| ID      | Requirement                                                                                                                                                                       |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CICD-01 | CI workflow matches LSPs pattern: layered install → (lint, typecheck, build in parallel) → (test with coverage, package verification with publint+attw) → coverage PR report      |
| CICD-02 | Release workflow using changesets: automated version PRs on main push, npm publish on merge, GitHub Releases created                                                              |
| CICD-03 | Preview release workflow for pre-release npm tags from non-main branches                                                                                                          |
| CICD-04 | Investigation completed on abstracting shared workflow patterns into a reusable third repo (e.g., `chillwhales/.github` or `chillwhales/ci-workflows`) — with decision documented |

**Plans:** 0 plans

Plans:

- [ ] TBD (run `/gsd-plan-phase 15` to break down)

**Success Criteria:**

1. PRs to this repo trigger a multi-layer CI pipeline that runs lint, typecheck, build, test, publint+attw in parallel layers — matching the `chillwhales/LSPs` CI pattern
2. Merging to main triggers a changesets-based release flow: either creates a "Version Packages" PR or publishes to npm with GitHub Releases — zero manual `npm publish` steps
3. A documented decision exists on whether shared workflows live in a third repo (reusable workflows) or are copied — with rationale for the chosen approach
4. If shared workflows are feasible, at least one reusable workflow is extracted and consumed by both repos
5. `pnpm test:coverage` runs in CI with coverage reports posted as PR comments on pull requests

---

_Created: 2026-02-16_
_Last updated: 2026-03-05 — Phase 15 added (CI/CD workflows & shared infra)_
