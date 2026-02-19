# Roadmap: LSP Indexer v1.1 — React Hooks Package

**Created:** 2026-02-16
**Depth:** Standard
**Phases:** 5 (Phase 7–11, continuing from v1.0)
**Coverage:** 28/28 v1.1 requirements mapped

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
| PAGE-01  | Developer can use `useInfinite*` hooks for offset-based infinite scroll on any list domain              |

**Plans:** 11 plans

Plans:

- [ ] 09-01-PLAN.md — Setup: schema:dump + codegen (Wave 1)
- [ ] 09-02-PLAN.md — Digital Assets domain: types → documents → parsers → services → keys → hooks → actions → playground (Wave 2)
- [ ] 09-03-PLAN.md — NFTs domain: types → documents → parsers → services → keys → hooks → actions → playground (Wave 2)
- [ ] 09-04-PLAN.md — Owned Assets domain: OwnedAsset + OwnedToken tables → full vertical slice (Wave 2)
- [ ] 09-05-PLAN.md — Social/Follows domain: useFollowers, useFollowing, useFollowCount + infinite variants (Wave 2)
- [ ] 09-06-PLAN.md — Creators domain: useCreatorAddresses + infinite variant (Wave 2)
- [ ] 09-07-PLAN.md — Encrypted Assets domain: LSP29 encrypted asset container records (Wave 2)
- [ ] 09-08-PLAN.md — Encrypted Feed domain: LSP29 encrypted asset entries + /feed playground route (Wave 2)
- [ ] 09-09-PLAN.md — Data Changed Events domain: ERC725 events, default sort block_number DESC (Wave 2)
- [ ] 09-10-PLAN.md — Universal Receiver Events domain: events, default sort block_number DESC (Wave 2)
- [ ] 09-11-PLAN.md — Integration: audit all 4 package exports, update nav (long route names) + home page, full build validation (Wave 3)

**Per-domain pattern (replicate for each of the 10 remaining domains):**

Each domain follows the validated vertical-slice pattern from Phase 8 (profiles):

1. **`@lsp-indexer/types`** — Add Zod schemas + inferred TS types in `src/{domain}.ts`, export from `src/index.ts`
2. **`@lsp-indexer/node`** — Add GraphQL documents in `src/documents/{domain}.ts`, run codegen, add parser in `src/parsers/{domain}.ts`, add service in `src/services/{domain}.ts`, add query key factory in `src/keys/{domain}.ts`, export all from `src/index.ts`
3. **`@lsp-indexer/react`** — Add hooks in `src/hooks/{domain}.ts` (useX, useXs, useInfiniteXs), export from `src/index.ts`
4. **`@lsp-indexer/next`** — Add server actions in `src/actions/{domain}.ts`, add hooks in `src/hooks/{domain}.ts`, export from `src/index.ts`
5. **`apps/test`** — Add playground page at `src/app/{domain}/page.tsx` with Client/Server mode toggle, using shared playground components from `src/components/playground/`

**Success Criteria:**

1. Developer can use hooks for all 11 domains and see typed data returned — every domain follows the same document → parser → service → hook pattern established in Phase 8
2. Developer can call `useInfiniteProfiles()`, `useInfiniteDigitalAssets()`, `useInfiniteNfts()`, etc. and see offset-based infinite scroll working with `fetchNextPage` / `hasNextPage`
3. Developer can import query key factories for all 11 domains and use them for targeted cache invalidation (e.g., `digitalAssetKeys.detail(address)`, `nftKeys.byCollection(address)`)
4. Developer can import all domain types from `@lsp-indexer/types` — all 11 domains export clean camelCase types

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

**Goal:** Developer can use `@lsp-indexer/next` server actions for all domains from Next.js Server Components, and all 4 packages pass publish validation checks.

**Dependencies:** Phase 9 (all domain services must exist — actions wrap services), Phase 10 (subscriptions should be complete for full package validation)

**Note:** Profile domain server actions (`getProfile`, `getProfiles`) and corresponding hooks (`useProfile`, `useProfiles`, `useInfiniteProfiles`) already exist in `@lsp-indexer/next` from Phase 8. Phase 11 replicates this pattern to the remaining 10 domains and adds Zod input validation + publish readiness checks.

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

| Phase | Name                                 | Requirements | Status   |
| ----- | ------------------------------------ | :----------: | -------- |
| 7     | Package Foundation                   |     7/7      | Complete |
| 8     | First Vertical Slice (Profiles)      |     3/3      | Complete |
| 9     | Remaining Query Domains & Pagination |      11      | Pending  |
| 10    | Subscriptions                        |      3       | Pending  |
| 11    | Server Actions & Publish Readiness   |      4       | Pending  |

**Total:** 10/28 requirements delivered

---

## Dependency Graph

```
Phase 7 (Package Foundation)
  └──→ Phase 8 (First Vertical Slice — Universal Profiles + 4-package split)
         └──→ Phase 9 (Remaining Query Domains & Pagination)
                ├──→ Phase 10 (Subscriptions)
                └──→ Phase 11 (Server Actions & Publish Readiness) ←── also depends on Phase 10
```

**Package dependency graph:**

```
@lsp-indexer/types ← @lsp-indexer/node ← @lsp-indexer/react
                                        ← @lsp-indexer/next
```

**Parallelization opportunities:**

- Within Phase 7: Codegen pipeline and build tooling can be worked in parallel with provider/error handling
- Within Phase 9: All 10 remaining domains are independent — can be built in any order. Each domain follows the checklist in PROJECT.md "Adding a New Domain" (types → documents → codegen → parsers → services → keys → hooks → actions → playground). Run `pnpm schema:dump` before starting if Hasura schema has changed.
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

The types package (`@lsp-indexer/types`) and query key factory pattern need to be validated with the first domain before replicating. If the pattern is wrong, it's cheaper to fix with 1 domain than 11. Phase 9 then replicates the validated pattern.

### Why DX-03 in Phase 11 (not earlier)?

`publint` and `arethetypeswrong` validation for publish readiness only makes sense when all 4 packages have their full domain coverage — including `@lsp-indexer/next` server actions. Running it earlier would miss domains still being added.

### Why subscriptions before server actions?

Subscriptions (Phase 10) add cache integration logic that affects the query layer from Phase 9. Server actions in `@lsp-indexer/next` (Phase 11) are isolated wrappers around `@lsp-indexer/node` services — they don't affect the query/subscription layer. Building subscriptions first means the full client-side story (queries + subscriptions) is complete before expanding the server-side layer to all domains.

---

_Created: 2026-02-16_
_Last updated: 2026-02-19 — added Phase 9 per-domain pattern, Phase 11 existing actions note_
