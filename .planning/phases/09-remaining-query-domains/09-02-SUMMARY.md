---
phase: 09-remaining-query-domains
plan: 02
subsystem: digital-assets
tags: [digital-assets, graphql, hooks, server-actions, playground]
depends_on:
  requires: ['09-01']
  provides: ['QUERY-02', 'PAGE-01-digital-assets']
  affects: ['10-subscriptions']
tech-stack:
  added: []
  patterns: ['vertical-slice', 'offset-pagination', 'infinite-scroll']
key-files:
  created:
    - packages/types/src/digital-assets.ts
    - packages/node/src/documents/digital-assets.ts
    - packages/node/src/parsers/digital-assets.ts
    - packages/node/src/services/digital-assets.ts
    - packages/node/src/keys/digital-assets.ts
    - packages/react/src/hooks/digital-assets.ts
    - packages/next/src/actions/digital-assets.ts
    - packages/next/src/hooks/digital-assets.ts
    - apps/test/src/app/digital-assets/page.tsx
  modified:
    - packages/types/src/index.ts
    - packages/node/src/index.ts
    - packages/node/src/graphql/gql.ts
    - packages/node/src/graphql/graphql.ts
    - packages/react/src/index.ts
    - packages/next/src/index.ts
decisions:
  - id: DA-01
    description: 'holderCount maps to ownedTokens_aggregate, creatorCount maps to lsp4Creators_aggregate'
  - id: DA-02
    description: 'totalSupply stored as nullable string (numeric scalar from Hasura, large numbers)'
  - id: DA-03
    description: 'Token type filtering uses _eq (exact match "0"/"1"/"2"), not _ilike'
  - id: DA-04
    description: 'Creator filter uses creator_address field on lsp4_creator (not address, which is the asset address)'
metrics:
  duration: '12 minutes'
  completed: '2026-02-19'
---

# Phase 9 Plan 02: Digital Assets Domain Summary

**One-liner:** Complete digital assets vertical slice with Zod types, GraphQL documents, Hasura parser, service layer, query keys, React/Next.js hooks, server actions, and playground page at /digital-assets.

## Task Commits

| Task | Name                                | Commit  | Key Changes                                                                      |
| ---- | ----------------------------------- | ------- | -------------------------------------------------------------------------------- |
| 1    | Types + Node layer                  | 449bfc5 | DigitalAsset Zod schema, GraphQL documents, parser, service, keys, index exports |
| 2    | React hooks + Next.js actions/hooks | 0423a4c | useDigitalAsset, useDigitalAssets, useInfiniteDigitalAssets in both packages     |
| 3    | Digital Assets playground page      | 5497d6e | /digital-assets page with Client/Server toggle and three tabs                    |

## What Was Built

### Types (`@lsp-indexer/types`)

- `DigitalAssetSchema` — Zod schema with address, name, symbol, tokenType, totalSupply, creatorCount, holderCount
- `DigitalAssetFilterSchema` — name (partial ilike), symbol (partial ilike), tokenType (exact), creatorAddress (ilike)
- `DigitalAssetSortFieldSchema` — name, symbol, holderCount, creatorCount
- `DigitalAssetSortSchema`, `UseDigitalAssetParamsSchema`, `UseDigitalAssetsParamsSchema`, `UseInfiniteDigitalAssetsParamsSchema`
- All inferred TypeScript types exported

### Node Layer (`@lsp-indexer/node`)

- **Documents:** `GetDigitalAssetDocument` (single), `GetDigitalAssetsDocument` (list + aggregate count)
  - Fields: address, lsp4TokenName.value, lsp4TokenSymbol.value, lsp4TokenType.value, totalSupply.value, lsp4Creators_aggregate.count, ownedTokens_aggregate.count
- **Parser:** `parseDigitalAsset` / `parseDigitalAssets` — maps nested Hasura fields to flat DigitalAsset type
- **Service:** `fetchDigitalAsset` / `fetchDigitalAssets` with `buildDigitalAssetWhere` and `buildDigitalAssetOrderBy`
  - Name sort uses `asc_nulls_last` / `desc_nulls_last`
  - Symbol sort uses `asc_nulls_last` / `desc_nulls_last`
  - Creator filter uses `lsp4Creators.creator_address._ilike`
- **Keys:** `digitalAssetKeys` factory with `.all`, `.detail(address)`, `.list(filter, sort, limit, offset)`, `.infinite(filter, sort)`
- Codegen regenerated with new document types

### React Hooks (`@lsp-indexer/react`)

- `useDigitalAsset({ address })` — single asset lookup, enabled when address is truthy
- `useDigitalAssets({ filter?, sort?, limit?, offset? })` — paginated list with name/symbol search via filter params
- `useInfiniteDigitalAssets({ filter?, sort?, pageSize? })` — infinite scroll with offset pagination, DEFAULT_PAGE_SIZE=20

### Next.js Actions + Hooks (`@lsp-indexer/next`)

- `getDigitalAsset(address)` / `getDigitalAssets(params?)` — server actions with `'use server'` directive
- `useDigitalAsset`, `useDigitalAssets`, `useInfiniteDigitalAssets` — identical API to react hooks, routed through server actions

### Playground Page

- `/digital-assets` — full playground with Client/Server mode toggle
- **Tab 1 (Single Asset):** Address input, preset buttons (CHILL, LYX Airdrop, LYXE), detailed asset card
- **Tab 2 (Asset List):** FilterFieldsRow + SortControls + ResultsList with pagination
- **Tab 3 (Infinite Scroll):** Same filters/sort with infinite scroll via fetchNextPage
- `DigitalAssetCard` component: address, name, symbol badge, tokenType badge (LSP7 Token/LSP8 NFT/LSP8 Collection), totalSupply, holderCount, creatorCount

## Decisions Made

| ID    | Decision                                  | Rationale                                                                                         |
| ----- | ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| DA-01 | holderCount = ownedTokens_aggregate count | Tracks token ownership records for the digital asset                                              |
| DA-02 | totalSupply as nullable string            | Hasura returns numeric scalar, large numbers need string representation                           |
| DA-03 | tokenType filter uses \_eq not \_ilike    | Token type is exact "0", "1", or "2" — not a partial match                                        |
| DA-04 | Creator filter on creator_address field   | lsp4_creator has both `address` (asset address) and `creator_address` (creator's profile address) |

## Deviations from Plan

None — plan executed exactly as written.

## Verification

1. ✅ `pnpm build` succeeds in packages/types, packages/node, packages/react, packages/next
2. ✅ `packages/react/src/index.ts` exports `useDigitalAsset`, `useDigitalAssets`, `useInfiniteDigitalAssets` (no search hook)
3. ✅ `packages/next/src/index.ts` exports same hooks + `getDigitalAsset`, `getDigitalAssets`
4. ✅ `apps/test/src/app/digital-assets/page.tsx` exists with 'use client' directive, imports from both packages
5. ✅ `digitalAssetKeys.detail(address)`, `.list()`, `.infinite()` all return correctly typed arrays
6. ✅ TypeScript type-check passes with zero errors

## Next Phase Readiness

- Digital assets domain fully operational — QUERY-02 delivered
- Playground page functional for testing against live Hasura
- Ready for Phase 10 (subscriptions) to add real-time digital asset updates

## Self-Check: PASSED
