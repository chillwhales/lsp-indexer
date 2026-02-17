# Roadmap: LSP Indexer v1.1 — React Hooks Package

**Created:** 2026-02-16
**Depth:** Standard
**Phases:** 5 (Phase 7–11, continuing from v1.0)
**Coverage:** 28/28 v1.1 requirements mapped

## Overview

Ship a standalone, publishable React hooks library (`packages/react`) that gives any app type-safe access to all 11 indexer query domains — with client-side (TanStack Query) hooks, real-time WebSocket subscriptions (graphql-ws), and server-side (next-safe-action) consumption patterns. The phases follow vertical-slice delivery: scaffold the package and validate exports → build one domain end-to-end → replicate across all domains → add subscriptions → add server actions and ship.

---

## Phase 7 — Package Foundation

**Goal:** Developer can install the package, run codegen, and see a working build with correct entry points validated in a real Next.js app — before any domain logic exists.

**Dependencies:** None — this is the foundation for v1.1.

**Requirements:**

| ID       | Requirement                                                                                                                                                                                                            |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FOUND-01 | Developer can install package and get working ESM+CJS+DTS builds with `"use client"` directives                                                                                                                        |
| FOUND-02 | Developer can run codegen to generate TypeScript types from Hasura GraphQL schema                                                                                                                                      |
| FOUND-03 | Developer can configure GraphQL URL (HTTP + WebSocket) via environment variable                                                                                                                                        |
| FOUND-04 | Developer can wrap app in `<IndexerProvider>` with optional existing QueryClient                                                                                                                                       |
| FOUND-05 | Developer gets typed `IndexerError` with network, GraphQL, and Hasura permission error categories                                                                                                                      |
| FOUND-06 | Developer can import from main (`@lsp-indexer/react`) and server (`@lsp-indexer/react/server`) entry points without bundle contamination                                                                               |
| FOUND-07 | A minimal Next.js test app (`apps/test`) exists in the monorepo that imports from `@lsp-indexer/react`, validates hooks work in both client and server components, and catches bundle/export issues during development |

**Plans:** 2 plans

Plans:

- [ ] 07-01-PLAN.md — React package scaffold, codegen, error handling, client utilities
- [ ] 07-02-PLAN.md — Next.js test app + end-to-end validation

**Success Criteria:**

1. Developer can run `pnpm build` in `packages/react` and get ESM + CJS + DTS output with `"use client"` directives on hook files — verified by inspecting dist output
2. Developer can run codegen against Hasura and see TypeScript types generated with `TypedDocumentString` wrappers — output committed to `src/graphql/`, query documents in `src/documents/`
3. Developer can import from `@lsp-indexer/react` in a client component and from `@lsp-indexer/react/server` in a server component without bundle errors — validated by `next build` in the test app (`apps/test`)
4. Developer can wrap a Next.js app in `<IndexerProvider url={...}>` and see TanStack Query context available to child components — with optional existing QueryClient pass-through working
5. Developer can run `publint` and `arethetypeswrong` against the built package and see zero errors — exports map is correct for all entry points

---

## Phase 8 — First Vertical Slice (Universal Profiles)

**Goal:** Developer can use complete Universal Profile hooks in a real app — validating the full document → parser → service → hook architecture end-to-end before replicating across 10 more domains.

**Dependencies:** Phase 7 (package scaffold, codegen, build, provider, error handling must exist)

**Requirements:**

| ID       | Requirement                                                                                  |
| -------- | -------------------------------------------------------------------------------------------- |
| QUERY-01 | Developer can use `useProfile`, `useProfiles`, `useProfileSearch` for Universal Profile data |
| DX-01    | Developer can import all clean camelCase domain types from `@lsp-indexer/react/types`        |
| DX-02    | Developer can import query key factories for cache invalidation and prefetching              |

**Success Criteria:**

1. Developer can call `useProfile({ address })` in a client component and see typed Universal Profile data rendered — with loading, error, and success states all working
2. Developer can call `useProfiles({ limit: 10 })` and `useProfileSearch({ query: "alice" })` and see correct filtered/paginated results from Hasura
3. Developer can import `profileKeys` from the query key factory and use it for manual cache invalidation (`queryClient.invalidateQueries({ queryKey: profileKeys.all })`) and prefetching
4. Developer can import `Profile` type from `@lsp-indexer/react/types` and see clean camelCase properties (e.g., `profileName`, `profileImage`) — not Hasura's snake_case
5. Developer can see the test app (`apps/test`) render Universal Profile data from the live Hasura endpoint in both a client component (via hook) and verify the service function works standalone

---

## Phase 9 — Remaining Query Domains & Pagination

**Goal:** Developer can query all 11 indexer domains with consistent hook patterns, and use infinite scroll pagination on any list query.

**Dependencies:** Phase 8 (vertical slice pattern validated — this is replication)

**Requirements:**

| ID       | Requirement                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------------- |
| QUERY-02 | Developer can use `useDigitalAsset`, `useDigitalAssets`, `useDigitalAssetSearch` for Digital Asset data |
| QUERY-03 | Developer can use `useNft`, `useNfts`, `useNftsByCollection` for NFT data                               |
| QUERY-04 | Developer can use `useOwnedAssets`, `useOwnedTokens` for ownership data                                 |
| QUERY-05 | Developer can use `useFollowers`, `useFollowing`, `useFollowCount` for social/follow data               |
| QUERY-06 | Developer can use `useCreatorAddresses` for asset creator data                                          |
| QUERY-07 | Developer can use `useEncryptedAsset`, `useEncryptedAssets` for LSP29 encrypted asset data              |
| QUERY-08 | Developer can use `useEncryptedAssetFeed` for LSP29 feed discovery                                      |
| QUERY-09 | Developer can use `useDataChangedEvents` for ERC725 data change events                                  |
| QUERY-10 | Developer can use `useUniversalReceiverEvents` for universal receiver events                            |
| QUERY-11 | Developer can use `useProfileStats` for aggregate profile statistics                                    |
| PAGE-01  | Developer can use `useInfinite*` hooks for offset-based infinite scroll on any list domain              |

**Success Criteria:**

1. Developer can use hooks for all 11 domains and see typed data returned — every domain follows the same document → parser → service → hook pattern established in Phase 8
2. Developer can call `useInfiniteProfiles()`, `useInfiniteDigitalAssets()`, `useInfiniteNfts()`, etc. and see offset-based infinite scroll working with `fetchNextPage` / `hasNextPage`
3. Developer can import query key factories for all 11 domains and use them for targeted cache invalidation (e.g., `digitalAssetKeys.detail(address)`, `nftKeys.byCollection(address)`)
4. Developer can import all domain types from `@lsp-indexer/react/types` — all 11 domains export clean camelCase types

---

## Phase 10 — Subscriptions

**Goal:** Developer can subscribe to real-time updates on any domain via WebSocket, with subscription data automatically keeping query caches fresh.

**Dependencies:** Phase 9 (all domain services and query hooks must exist for cache integration)

**Requirements:**

| ID     | Requirement                                                                                           |
| ------ | ----------------------------------------------------------------------------------------------------- |
| SUB-01 | Developer can establish WebSocket connection to Hasura with `graphql-ws`, with automatic reconnection |
| SUB-02 | Developer can use `use*Subscription` hooks for all 11 domains (live data via WebSocket)               |
| SUB-03 | Subscription updates automatically invalidate/update relevant TanStack Query cache entries            |

**Success Criteria:**

1. Developer can see a WebSocket connection established to Hasura's `ws://` endpoint when any subscription hook mounts — with automatic reconnection on disconnect visible in browser devtools
2. Developer can call `useProfileSubscription({ address })` and see the component re-render within seconds when that profile's on-chain data changes — without manual refetch
3. Developer can observe that when a subscription fires, the corresponding TanStack Query cache entry is invalidated or updated (e.g., `useProfile` returns fresh data after `useProfileSubscription` receives an update)
4. Developer can see subscription hooks for all 11 domains following a consistent pattern — each has a subscription document, hook, and cache integration

---

## Phase 11 — Server Actions & Publish Readiness

**Goal:** Developer can use server-side actions for all domains from Next.js Server Components, and the package passes all publish validation checks.

**Dependencies:** Phase 9 (all domain services must exist — actions wrap services), Phase 10 (subscriptions should be complete for full package validation)

**Requirements:**

| ID        | Requirement                                                                                        |
| --------- | -------------------------------------------------------------------------------------------------- |
| ACTION-01 | Developer can use next-safe-action server actions for all 11 domains                               |
| ACTION-02 | Developer can import server utilities from `@lsp-indexer/react/server` without client code leaking |
| ACTION-03 | All server action inputs are validated with Zod schemas                                            |
| DX-03     | Package passes `publint` and `arethetypeswrong` validation for publish readiness                   |

**Success Criteria:**

1. Developer can call `getProfile({ address })` as a server action in a Next.js Server Component and see typed data returned — without any client-side JavaScript shipped to the browser
2. Developer can import from `@lsp-indexer/react/server` and run `next build` with zero "client-only code in server" or "server-only code in client" errors — entry point separation is bulletproof
3. Developer can see Zod validation errors when passing invalid inputs to server actions (e.g., invalid address format) — with typed error responses
4. Developer can run `publint` and `arethetypeswrong` against the final built package and see zero errors across all entry points (`@lsp-indexer/react`, `@lsp-indexer/react/server`, `@lsp-indexer/react/types`)
5. Developer can `npm pack` the package and see only `dist/` and `README.md` included — no source files, no test fixtures, no generated intermediates

---

## Progress

| Phase | Name                                 | Requirements | Status  |
| ----- | ------------------------------------ | :----------: | ------- |
| 7     | Package Foundation                   |      7       | Pending |
| 8     | First Vertical Slice (Profiles)      |      3       | Pending |
| 9     | Remaining Query Domains & Pagination |      11      | Pending |
| 10    | Subscriptions                        |      3       | Pending |
| 11    | Server Actions & Publish Readiness   |      4       | Pending |

**Total:** 28 requirements across 5 phases

---

## Dependency Graph

```
Phase 7 (Package Foundation)
  └──→ Phase 8 (First Vertical Slice — Universal Profiles)
         └──→ Phase 9 (Remaining Query Domains & Pagination)
                ├──→ Phase 10 (Subscriptions)
                └──→ Phase 11 (Server Actions & Publish Readiness) ←── also depends on Phase 10
```

**Parallelization opportunities:**

- Within Phase 7: Codegen pipeline and build tooling can be worked in parallel with provider/error handling
- Within Phase 9: All 10 remaining domains are independent — can be built in any order
- Phase 10 and Phase 11 both depend on Phase 9, but Phase 11's ACTION-01/ACTION-02/ACTION-03 could technically start as soon as Phase 9 completes (only DX-03 needs Phase 10 for full validation)

---

## Coverage Validation

All 28 v1.1 requirements mapped to exactly one phase:

| Requirement | Phase | Category       |
| ----------- | ----- | -------------- |
| FOUND-01    | 7     | Foundation     |
| FOUND-02    | 7     | Foundation     |
| FOUND-03    | 7     | Foundation     |
| FOUND-04    | 7     | Foundation     |
| FOUND-05    | 7     | Foundation     |
| FOUND-06    | 7     | Foundation     |
| FOUND-07    | 7     | Foundation     |
| QUERY-01    | 8     | Query Domains  |
| DX-01       | 8     | Developer Exp  |
| DX-02       | 8     | Developer Exp  |
| QUERY-02    | 9     | Query Domains  |
| QUERY-03    | 9     | Query Domains  |
| QUERY-04    | 9     | Query Domains  |
| QUERY-05    | 9     | Query Domains  |
| QUERY-06    | 9     | Query Domains  |
| QUERY-07    | 9     | Query Domains  |
| QUERY-08    | 9     | Query Domains  |
| QUERY-09    | 9     | Query Domains  |
| QUERY-10    | 9     | Query Domains  |
| QUERY-11    | 9     | Query Domains  |
| PAGE-01     | 9     | Pagination     |
| SUB-01      | 10    | Subscriptions  |
| SUB-02      | 10    | Subscriptions  |
| SUB-03      | 10    | Subscriptions  |
| ACTION-01   | 11    | Server Actions |
| ACTION-02   | 11    | Server Actions |
| ACTION-03   | 11    | Server Actions |
| DX-03       | 11    | Developer Exp  |

**Mapped: 28/28 ✓ — No orphans, no duplicates.**

---

## Roadmap Rationale

### Why 5 phases (not 4)?

Research suggested 4 phases with subscriptions out of scope. The user added subscriptions (SUB-01, SUB-02, SUB-03) requiring WebSocket transport (graphql-ws) and cache integration — a genuinely new capability that doesn't belong in any existing phase. This naturally creates Phase 10.

### Why DX-01 and DX-02 in Phase 8 (not Phase 9)?

The types export pattern (`@lsp-indexer/react/types`) and query key factory pattern need to be validated with the first domain before replicating. If the pattern is wrong, it's cheaper to fix with 1 domain than 11. Phase 9 then replicates the validated pattern.

### Why DX-03 in Phase 11 (not earlier)?

`publint` and `arethetypeswrong` validation for publish readiness only makes sense when all entry points exist — including `@lsp-indexer/react/server` (Phase 11). Running it earlier would miss the server entry point.

### Why subscriptions before server actions?

Subscriptions (Phase 10) add cache integration logic that affects the query layer from Phase 9. Server actions (Phase 11) are isolated wrappers around services — they don't affect the query/subscription layer. Building subscriptions first means the full client-side story (queries + subscriptions) is complete before adding the server-side layer.

---

_Created: 2026-02-16_
_Last updated: 2026-02-16_
