---
id: T01
parent: S13
milestone: M001
provides: []
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration: 
verification_result: passed
completed_at: 
blocker_discovered: false
---
# T01: 09.1-digital-assets 01

**# Phase 9.1 Plan 01: Digital Asset Types + Codegen Summary**

## What Happened

# Phase 9.1 Plan 01: Digital Asset Types + Codegen Summary

**One-liner:** Zod-first digital asset domain types with inverted include default + GraphQL documents with 17 Boolean! = true variables and regenerated codegen output.

## Objective

Create the Digital Asset domain types (Zod schemas + inferred TS types) and GraphQL documents — the foundation layer for the entire digital assets vertical slice.

## Tasks Completed

| Task | Name                                     | Commit  | Key Files                                                          |
| ---- | ---------------------------------------- | ------- | ------------------------------------------------------------------ |
| 1    | Create Digital Asset domain types        | 113506a | packages/types/src/digital-assets.ts, packages/types/src/common.ts |
| 2    | Create GraphQL documents and run codegen | 23b6f5a | packages/node/src/documents/digital-assets.ts, graphql.ts, gql.ts  |

## What Was Built

### Task 1: Digital Asset Domain Types (`@lsp-indexer/types`)

**New file: `packages/types/src/common.ts`**

- `SortDirectionSchema` — shared across all domain sort schemas (moved from profiles.ts)
- `SortDirection` — inferred type

**New file: `packages/types/src/digital-assets.ts`** with all schemas:

- `StandardSchema` — `z.enum(['LSP7', 'LSP8'])` for parser-derived standard
- `TokenTypeSchema` — `z.enum(['TOKEN', 'NFT', 'COLLECTION'])` — clean strings, no raw 0/1/2
- `DigitalAssetImageSchema` — url, width?, height?, verification? (matches ProfileImageSchema pattern)
- `DigitalAssetLinkSchema` — title, url
- `DigitalAssetAttributeSchema` — key, value, type (NFT trait attributes)
- `DigitalAssetOwnerSchema` — address + timestamp (contract controller)
- `DigitalAssetSchema` — full type with all 15+ fields including nullable LSP8-specific fields
- `DigitalAssetFilterSchema` — 6 fields: name, symbol, tokenType, category, holderAddress, ownerAddress
- `DigitalAssetSortFieldSchema` — 6 sort fields including createdAt
- `DigitalAssetSortSchema` — field + direction (uses shared SortDirectionSchema)
- `DigitalAssetIncludeSchema` — 17 optional boolean fields with **inverted-default JSDoc**
- `UseDigitalAssetParamsSchema` — address + optional include
- `UseDigitalAssetsParamsSchema` — filter? + sort? + limit? + offset? + include?
- `UseInfiniteDigitalAssetsParamsSchema` — filter? + sort? + pageSize? + include?

**Modified: `packages/types/src/profiles.ts`**

- Imports `SortDirectionSchema` from `./common` instead of defining inline
- Re-exports for backward compatibility

**Modified: `packages/types/src/index.ts`**

- Exports `SortDirectionSchema` and `SortDirection` from `./common` (canonical source)
- Exports all new digital asset schemas and inferred types

### Task 2: GraphQL Documents + Codegen (`@lsp-indexer/node`)

**New file: `packages/node/src/documents/digital-assets.ts`**

`GetDigitalAssetDocument` — Single asset query with:

- `$where: digital_asset_bool_exp!` for the filter
- 17 `Boolean! = true` variables for all includable fields
- Queries: `lsp4TokenName`, `lsp4TokenSymbol`, `lsp4TokenType`, `decimals`, `totalSupply`
- `lsp4Metadata` sub-fields: `description`, `category`, `icon`, `images`, `links`, `attributes`
- `owner { address, timestamp }` for contract controller
- `ownedAssets_aggregate` for holderCount
- `lsp4CreatorsLength { value }` for creatorCount
- LSP8: `lsp8ReferenceContract`, `lsp8TokenIdFormat`, `lsp8TokenMetadataBaseUri`

`GetDigitalAssetsDocument` — List query with pagination + total count:

- Same include variables + `$order_by`, `$limit`, `$offset`
- `digital_asset_aggregate(where: $where)` for total count UI

**Codegen output updated: `packages/node/src/graphql/graphql.ts` + `gql.ts`**

- `GetDigitalAssetQuery` and `GetDigitalAssetQueryVariables` types generated
- `GetDigitalAssetsQuery` and `GetDigitalAssetsQueryVariables` types generated
- Full Hasura type coverage for all selected fields

## Decisions Made

| Decision                                              | Rationale                                                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `SortDirectionSchema` moved to `common.ts`            | Avoid duplication across domains; profiles.ts re-exports for backward compat                      |
| Inverted include default (all true)                   | Digital assets fetch everything by default — richer out-of-box experience                         |
| `lsp4Metadata` always fetched (no top-level @include) | Sub-fields use individual @include directives; metadata itself is always needed for nested access |
| `ownedAssets_aggregate` for holderCount               | Counts unique asset holders via owned_asset table join                                            |
| `lsp4CreatorsLength.value` (numeric) for creatorCount | Creator count stored as numeric value in lsp4_creators_length table                               |

## Deviations from Plan

### None — plan executed exactly as written.

The `SortDirectionSchema` move to `common.ts` was explicitly called for in the plan. All schemas created as specified with correct field names verified against `schema.graphql`.

## Verification Results

- ✅ `pnpm --filter @lsp-indexer/types typecheck` — PASSED
- ✅ `pnpm --filter @lsp-indexer/types build` — PASSED (12.18 KB ESM, 15.76 KB CJS)
- ✅ `pnpm codegen` — PASSED (no errors, documents generated)
- ✅ `pnpm --filter @lsp-indexer/node typecheck` — PASSED
- ✅ `packages/types/src/digital-assets.ts` exports: DigitalAsset, TokenType, Standard, DigitalAssetFilter, DigitalAssetSort, DigitalAssetInclude
- ✅ `packages/node/src/documents/digital-assets.ts` exports: GetDigitalAssetDocument, GetDigitalAssetsDocument
- ✅ `packages/node/src/graphql/graphql.ts` contains GetDigitalAssetQuery, GetDigitalAssetsQuery types

## Next Phase Readiness

Phase 9.1 Plan 02 (parsers + services + query key factory) can proceed immediately:

- All Zod schemas available for parser validation
- `GetDigitalAssetQuery` and `GetDigitalAssetsQuery` Hasura types available for type-safe parsing
- `DigitalAsset` type is the parser output target
- `DigitalAssetFilter`, `DigitalAssetSort`, `DigitalAssetInclude` available for service layer input

## Self-Check: PASSED
