---
id: M007
title: "Chillwhales NFT Extensions"
status: complete
completed_at: 2026-03-30T11:37:57.637Z
key_decisions:
  - D010: Use distinct_on with lsp4_metadata_attribute for collection attribute facets — Hasura-native deduplication, total count via nft_aggregate in same query
  - All 7 chillwhales fields are nullable — non-chillwhales NFTs get null, no separate schema needed
  - Boolean filters use _eq, numeric filters use _lte — matches Hasura relationship value types
  - buildNftIncludeVars serves both NFT and owned-token documents — single function, no duplication
  - Collection-attributes follows simple-query pattern (like useFollowCount) — direct useQuery, no pagination
key_files:
  - packages/types/src/nfts.ts
  - packages/types/src/common.ts
  - packages/types/src/collection-attributes.ts
  - packages/types/src/owned-tokens.ts
  - packages/node/src/documents/nfts.ts
  - packages/node/src/documents/owned-tokens.ts
  - packages/node/src/documents/collection-attributes.ts
  - packages/node/src/parsers/nfts.ts
  - packages/node/src/parsers/utils.ts
  - packages/node/src/services/nfts.ts
  - packages/node/src/services/collection-attributes.ts
  - packages/node/src/keys/collection-attributes.ts
  - packages/react/src/hooks/factories/collection-attributes/create-use-collection-attributes.ts
  - packages/react/src/hooks/collection-attributes/use-collection-attributes.ts
  - packages/next/src/actions/collection-attributes.ts
  - packages/next/src/hooks/collection-attributes/use-collection-attributes.ts
  - apps/docs/src/app/docs/node/page.mdx
  - apps/docs/src/app/docs/react/page.mdx
  - apps/docs/src/app/docs/next/page.mdx
  - apps/docs/src/app/(home)/page.mdx
lessons_learned:
  - OwnedTokenNftIncludeSchema auto-inherits from NftIncludeSchema via .omit() — new NftInclude fields flow through automatically, but the scalar field map and GraphQL documents need manual updates
  - buildNftIncludeVars can serve both NFT and owned-token documents when variable naming follows the $includeNft* prefix convention — avoids duplication
  - Hasura relationship names used as string keys in where-clause objects have no compile-time protection — if the schema renames relationships, queries silently return empty results
  - The collection-attributes simple-query pattern (distinct_on + aggregate, direct useQuery, no pagination) is a useful template for future non-paginated aggregate queries
---

# M007: Chillwhales NFT Extensions

**Extended the @lsp-indexer package stack with 7 chillwhales-specific NFT fields, 4 game-property filters, score sorting, a new collection-attributes query vertical, and full documentation — all propagated through types → node → react → next with clean 9-project builds.**

## What Happened

M007 extended the NFT domain across the entire 4-package stack to expose chillwhales-specific data that the frontend needs for game mechanics, rarity display, and collection filtering.

**S01 (NFT type + include extensions)** laid the foundation: 7 nullable fields added to NftSchema (score, rank, chillClaimed, orbsClaimed, level, cooldownExpiry, faction), 7 boolean flags in NftIncludeSchema, score/rarity on Lsp4AttributeSchema, 'score' in NftSortFieldSchema, all 3 NFT and 3 owned-token GraphQL documents extended with @include variables, parseNft updated with metadata fallback chain, buildIncludeVars/buildNftIncludeVars/buildNftOrderBy updated. This was the highest-risk slice — it touched the most files and established the pattern for all downstream work.

**S02 (NftFilter + OwnedToken propagation)** added 4 filter fields to NftFilterSchema (chillClaimed, orbsClaimed, maxLevel, cooldownExpiryBefore) with corresponding nested Hasura relationship conditions in buildNftWhere. Boolean filters use `_eq`, numeric filters use `_lte`. Guards use `!== undefined` so `false` and `0` are valid filter values.

**S03 (Collection attributes vertical)** built an entirely new query domain from scratch — CollectionAttribute/CollectionAttributesResult Zod schemas, a GraphQL document using distinct_on for attribute deduplication + nft_aggregate for total count, fetchCollectionAttributes service with escapeLike, key factory, React factory/hook, Next.js server action with Zod validation + hook. 18 new files across 4 packages with 9 barrel exports.

**S04 (Docs + verification)** updated all 4 docs pages (node, react, next, home) with the new types, hooks, filters, sort fields, and collection-attributes domain. 8 grep content assertions verified. Full 9-project build passed with 22/22 static pages.

Total: 35 files changed, ~1161 lines across types, node, react, next, and docs packages.

## Success Criteria Results

- ✅ **fetchNfts returns 7 chillwhales fields** — S01 added score, rank, chillClaimed, orbsClaimed, level, cooldownExpiry, faction as nullable fields to NftSchema, GraphQL documents, parseNft, and buildIncludeVars
- ✅ **Lsp4Attribute includes score/rarity** — S01 added both nullable number fields to Lsp4AttributeSchema and parseAttributes
- ✅ **NFTs sortable by score** — S01 added 'score' to NftSortFieldSchema and nested lsp4Metadata path in buildNftOrderBy
- ✅ **NFTs filterable by 4 game-property fields** — S02 added chillClaimed, orbsClaimed, maxLevel, cooldownExpiryBefore to NftFilterSchema with Hasura relationship conditions in buildNftWhere
- ✅ **getOwnedTokens returns nested NFT custom fields** — S01 T03 extended all 3 owned-token documents with $includeNft* variables; buildNftIncludeVars already covered
- ✅ **getCollectionAttributes returns distinct {key,value} + totalCount** — S03 delivered full vertical: types, GraphQL document with distinct_on, service with escapeLike, key factory, React/Next.js hooks, server action
- ✅ **useCollectionAttributes hook available** — S03 delivered React hook (createUseCollectionAttributes factory) and Next.js hook (via server action)
- ✅ **Docs pages reflect all new types, hooks, filters, sort fields** — S04 updated node, react, next, home docs pages; 8 grep assertions pass
- ✅ **Full 5-package build passes** — `pnpm build` exits 0 across all 9 workspace projects, 22/22 static pages generated

## Definition of Done Results

- ✅ All 4 slices complete: S01 ✅, S02 ✅, S03 ✅, S04 ✅
- ✅ All 4 slice summaries exist and are well-formed
- ✅ Cross-slice integration verified: S01 → S02 (filter fields use S01's relationship types), S01 → S03 (collection attributes query on same attribute table), S01+S02+S03 → S04 (all documented)
- ✅ Full workspace build passes clean (9 projects, 22/22 static pages)
- ✅ No blockers discovered during execution

## Requirement Outcomes

| Requirement | Previous Status | New Status | Evidence |
|-------------|----------------|------------|----------|
| R017 | active | validated | S01: score/rarity added to Lsp4AttributeSchema + parseAttributes. Build passes. |
| R018 | active | validated | S01: score/rank in NftSchema, NftIncludeSchema, GraphQL docs, parseNft, buildNftOrderBy. Build passes. |
| R019 | active | validated | S01: chillClaimed/orbsClaimed/level/cooldownExpiry/faction in NftSchema + NftIncludeSchema + GraphQL docs. Build passes. |
| R020 | active | validated | S02: 4 filter fields in NftFilterSchema + 4 buildNftWhere conditions with !== undefined guards. Build passes. |
| R021 | active | validated | S01: 'score' in NftSortFieldSchema + nested lsp4Metadata path in buildNftOrderBy. Build passes. |
| R022 | active | validated | S03: Full vertical — types, GraphQL document (distinct_on + nft_aggregate), service, key factory, React/Next.js hooks, server action. Build passes. |
| R023 | active | validated | S01 T03: OwnedTokenNftScalarFieldMap + 3 owned-token documents with $includeNft* variables + buildNftIncludeVars. Build passes. |
| R024 | active | validated | Existing wiring confirmed functional — OwnedAssetInclude.holder uses z.union([z.boolean(), ProfileIncludeSchema]) pattern unchanged by M007. No regression. |
| R025 | active | validated | S04: pnpm build exits 0 across all 9 workspace projects. |
| R026 | active | validated | S04: 4 docs pages updated, 8 content grep checks pass, 22/22 pages generated. |

## Deviations

S01 T01 initially missed 'score' from NftSortFieldSchema enum — caught and fixed in T02. S01 T03 found buildNftIncludeVars already populated by T02, making planned service changes a no-op. Neither deviation affected the final outcome.

## Follow-ups

D010 (distinct_on for collection attributes) should be revisited if attribute cardinality grows large enough to cause performance issues. R024 was validated by confirming existing wiring — no new code written, but a runtime integration test against live Hasura would strengthen confidence.
