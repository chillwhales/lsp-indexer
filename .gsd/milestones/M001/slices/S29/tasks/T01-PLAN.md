# T01: 21-sorting-consumer-package-release 01

**Slice:** S29 — **Milestone:** M001

## Description

Add consistent `newest`/`oldest` block-order sorting across all 12 domain types and services.

Purpose: SORT-01 through SORT-05 require all domains to support sorting by blockchain position. The types package defines which sort fields exist (Zod schemas), and the node services translate those to Hasura order_by variables. React hooks and Next.js server actions automatically pick up the new sort options since they pass through types and services transparently — no code changes needed in react/next packages.

Output: 8 updated type files + 12 updated service files (8 new + 4 tiebreaker addition)

## Must-Haves

- [ ] "All 12 SortFieldSchemas include 'newest' and 'oldest' as first two entries"
- [ ] "No SortFieldSchema includes 'block', 'timestamp', 'transactionIndex', or 'logIndex' as individual sort fields"
- [ ] "All 12 buildOrderBy functions handle 'newest' → buildBlockOrderSort('desc') and 'oldest' → buildBlockOrderSort('asc')"
- [ ] "All 12 non-block sort fields append ...buildBlockOrderSort('desc') as tiebreaker for deterministic pagination"
- [ ] "All 12 fetch* and subscription config functions default to buildBlockOrderSort('desc') when no sort is passed"
- [ ] "Sort parameter propagates through full stack: Zod types → services → hooks → server actions (no react/next code changes needed)"

## Files

- `packages/types/src/profiles.ts`
- `packages/types/src/digital-assets.ts`
- `packages/types/src/nfts.ts`
- `packages/types/src/owned-assets.ts`
- `packages/types/src/owned-tokens.ts`
- `packages/types/src/creators.ts`
- `packages/types/src/issued-assets.ts`
- `packages/types/src/encrypted-assets.ts`
- `packages/node/src/services/profiles.ts`
- `packages/node/src/services/digital-assets.ts`
- `packages/node/src/services/nfts.ts`
- `packages/node/src/services/owned-assets.ts`
- `packages/node/src/services/owned-tokens.ts`
- `packages/node/src/services/creators.ts`
- `packages/node/src/services/issued-assets.ts`
- `packages/node/src/services/encrypted-assets.ts`
- `packages/node/src/services/followers.ts`
- `packages/node/src/services/data-changed-events.ts`
- `packages/node/src/services/token-id-data-changed-events.ts`
- `packages/node/src/services/universal-receiver-events.ts`
