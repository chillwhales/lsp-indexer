---
phase: 09-remaining-query-domains
plan: 03
subsystem: nft-domain
tags: [nft, hooks, graphql, playground, pagination]
dependency-graph:
  requires: ['09-01']
  provides: ['QUERY-03', 'PAGE-01-nfts']
  affects: []
tech-stack:
  added: []
  patterns: ['convenience-wrapper-hook', 'typed-document-string-manual']
key-files:
  created:
    - packages/types/src/nfts.ts
    - packages/node/src/documents/nfts.ts
    - packages/node/src/parsers/nfts.ts
    - packages/node/src/services/nfts.ts
    - packages/node/src/keys/nfts.ts
    - packages/react/src/hooks/nfts.ts
    - packages/next/src/actions/nfts.ts
    - packages/next/src/hooks/nfts.ts
    - apps/test/src/app/nfts/page.tsx
    - apps/test/src/components/ui/label.tsx
  modified:
    - packages/types/src/index.ts
    - packages/node/src/index.ts
    - packages/react/src/index.ts
    - packages/next/src/index.ts
decisions:
  - id: NFT-01
    decision: 'Manual TypedDocumentString for NFT documents instead of codegen graphql() function'
    reason: "New domain documents aren't registered in gql.ts codegen output — used TypedDocumentString directly with manually defined result/variable types"
  - id: NFT-02
    decision: 'Joined through digitalAsset for collection-level metadata and ownedToken for owner'
    reason: 'NFT table has foreign keys to digital_asset (for name/symbol/baseUri) and owned_token (for owner address)'
  - id: NFT-03
    decision: 'Added isBurned and isMinted boolean fields to NftSchema'
    reason: "Actual Hasura schema has is_burned and is_minted boolean columns that weren't in original plan but are useful for UI filtering and display"
  - id: NFT-04
    decision: 'Added shadcn Label component for Single NFT tab form inputs'
    reason: 'Labels on top of inputs consistent with shadcn form patterns per project decisions'
metrics:
  duration: ~13m
  completed: 2026-02-19
---

# Phase 9 Plan 03: NFT Domain Summary

**One-liner:** Complete NFT vertical slice with useNft/useNfts/useNftsByCollection/useInfiniteNfts hooks, server actions, and playground page at /nfts.

## Task Commits

| Task | Name                       | Commit    | Key Files                                           |
| ---- | -------------------------- | --------- | --------------------------------------------------- |
| 1    | Types + Node layer         | `dbd69ee` | nfts.ts (types, documents, parsers, services, keys) |
| 2    | React/Next hooks + actions | `62ca490` | hooks/nfts.ts (react + next), actions/nfts.ts       |
| 3    | NFTs playground page       | `94af03f` | apps/test/src/app/nfts/page.tsx, label.tsx          |

**Note:** Task 2 was committed by a parallel execution agent (`62ca490` — feat(09-07)) with identical content. The files were verified as matching the plan specification exactly.

## What Was Built

### Types Layer (`@lsp-indexer/types`)

- `NftSchema`: address, tokenId, tokenIdFormat, isBurned, isMinted, name, symbol, baseUri, ownerAddress
- `NftFilterSchema`: collectionAddress, ownerAddress, tokenId (all optional)
- `NftSortFieldSchema`: 'tokenId' | 'name'
- Hook param schemas: UseNftParams, UseNftsParams, UseInfiniteNftsParams

### Node Layer (`@lsp-indexer/node`)

- **Documents:** GetNftDocument (single), GetNftsDocument (paginated + aggregate count)
  - Uses `TypedDocumentString` directly with manual result types (not codegen `graphql()`)
  - Joins through `digitalAsset` for LSP4 name/symbol and LSP8 base URI
  - Joins through `ownedToken` for current owner address
- **Parsers:** parseNft/parseNfts — snake_case → camelCase with null safety
- **Services:** fetchNft (single by address+tokenId), fetchNfts (paginated)
  - `buildNftWhere`: collectionAddress → `{ address: { _ilike } }`, ownerAddress → `{ ownedToken: { owner: { _ilike } } }`, tokenId → `{ token_id: { _ilike } }`
  - `buildNftOrderBy`: tokenId → `{ token_id: direction }`, name → `{ lsp4Metadata: { name: { value: dir_nulls_last } } }`
- **Keys:** nftKeys factory with all, detail, byCollection (convenience), list, infinite

### React Hooks (`@lsp-indexer/react`)

- `useNft({ address, tokenId })` — enabled when both are truthy
- `useNfts({ filter?, sort?, limit?, offset? })` — paginated list
- `useNftsByCollection(collectionAddress, params?)` — convenience wrapper merging filter
- `useInfiniteNfts({ filter?, sort?, pageSize? })` — offset-based infinite scroll

### Next.js Layer (`@lsp-indexer/next`)

- **Server Actions:** `getNft(address, tokenId)`, `getNfts(params?)`
- **Hooks:** Mirror of react hooks using server actions as queryFn

### Playground Page (`apps/test/src/app/nfts/page.tsx`)

- Three tabs: Single NFT, NFT List, Infinite Scroll
- Client/Server mode toggle with `key={mode}` for full remount
- NftCard: collection address, tokenId, name, symbol badge, owner, minted/burned badges
- Single NFT tab: two labeled inputs (Collection Address + Token ID) with Fetch button
- FilterFieldsRow: collectionAddress, ownerAddress, tokenId filters
- SortControls: tokenId, name sort fields

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added isBurned and isMinted fields**

- **Found during:** Task 1
- **Issue:** Plan specified `ownerAddress` and `baseUri` but not the `is_burned` / `is_minted` booleans which are non-nullable columns in Hasura
- **Fix:** Added both to NftSchema and parser; displayed as badges in NftCard
- **Files modified:** packages/types/src/nfts.ts, packages/node/src/parsers/nfts.ts, apps/test/src/app/nfts/page.tsx

**2. [Rule 3 - Blocking] Used TypedDocumentString directly instead of codegen graphql() function**

- **Found during:** Task 1
- **Issue:** New domain GraphQL documents aren't registered in the codegen `gql.ts` document map, so `graphql()` function returns empty object
- **Fix:** Created manual TypedDocumentString instances with hand-defined result/variable interfaces
- **Files modified:** packages/node/src/documents/nfts.ts

**3. [Rule 3 - Blocking] Added shadcn Label component**

- **Found during:** Task 3
- **Issue:** Label component not yet installed in test app, needed for form inputs
- **Fix:** Added via `npx shadcn add label`
- **Files modified:** apps/test/src/components/ui/label.tsx

**4. [Rule 1 - Bug] Task 2 already committed by parallel agent**

- **Found during:** Task 2
- **Issue:** Another parallel execution agent committed NFT hooks/actions as part of `feat(09-07)` commit `62ca490`
- **Fix:** Verified content matches plan specification exactly; no additional commit needed
- **Files affected:** None (content already correct)

## Verification Results

1. ✅ `pnpm build` succeeds in all 4 packages (types, node, react, next)
2. ✅ `useNft`, `useNfts`, `useNftsByCollection`, `useInfiniteNfts` exported from both @lsp-indexer/react and @lsp-indexer/next
3. ✅ `getNft`, `getNfts` exported from @lsp-indexer/next
4. ✅ `nftKeys.byCollection(address)` returns `['nfts', 'list', { filter: { collectionAddress } }]`
5. ✅ Playground page exists at `/nfts` with 'use client', imports from both packages, three tabs

## Schema Field Name Notes

The plan referenced some field names that differ from the actual Hasura schema:

| Plan Field                  | Actual Hasura Field                           | Notes                                                    |
| --------------------------- | --------------------------------------------- | -------------------------------------------------------- |
| `lsp4TokenName { value }`   | `digitalAsset.lsp4TokenName.value`            | Name lives on digitalAsset relation, not directly on nft |
| `lsp4TokenSymbol { value }` | `digitalAsset.lsp4TokenSymbol.value`          | Same — through digitalAsset                              |
| `baseUri { value }`         | `digitalAsset.lsp8TokenMetadataBaseUri.value` | Full field name includes lsp8 prefix                     |
| `owner_address`             | `ownedToken.owner`                            | Owner comes through ownedToken relation                  |
| `token_id_format`           | `formatted_token_id`                          | Actual column name differs                               |
| (not in plan)               | `is_burned`, `is_minted`                      | Boolean columns added to schema                          |

## Next Phase Readiness

- NFT domain is complete: types → node → react → next → playground
- `useNftsByCollection` convenience wrapper tested and exported
- Pattern established for domains using `TypedDocumentString` directly (no codegen dependency)
- No blockers for remaining domains

## Self-Check: PASSED
