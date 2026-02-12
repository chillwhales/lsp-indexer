---
phase: 05-deployment-validation
plan: 01
subsystem: validation
tags: [hasura, graphql, axios, typescript, comparison, testing]

# Dependency graph
requires:
  - phase: 04-integration-wiring
    provides: Complete V2 indexer pipeline with all handlers and metadata fetchers
provides:
  - Type definitions for comparison tool (EntityDefinition, ComparisonConfig, CountResult, RowDiff)
  - Entity registry with all 72 @entity types mapped to snake_case Hasura table names
  - Known divergence exclusions (null FK vs entity removal, unknown token format)
  - GraphQL client with count/sample/row query builders and field introspection
affects: [05-02]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - GraphQL introspection for dynamic field discovery
    - Factory pattern for client creation with cached field lists
    - Graceful error handling returning empty/invalid results instead of throwing

key-files:
  created:
    - packages/comparison-tool/src/types.ts
    - packages/comparison-tool/src/entityRegistry.ts
    - packages/comparison-tool/src/graphqlClient.ts
  modified: []

key-decisions:
  - 'Snake case conversion preserves LSP prefixes (LSP3ProfileImage → lsp3_profile_image)'
  - 'GraphQL client returns -1 for missing tables instead of throwing errors'
  - 'Field introspection filters to scalar types only (excludes object/array relations)'
  - 'Field cache per table to avoid repeated introspection queries'

patterns-established:
  - 'Entity categorization: core, event, metadata, ownership, lsp, custom'
  - 'isMetadataSub flag identifies sub-entities (ProfileImage, AssetImage, etc.)'
  - 'Known divergences documented with entity type, field, and reason'

# Metrics
duration: 2 min
completed: 2026-02-12
---

# Phase 05 Plan 01: Comparison Tool Foundation Summary

**Complete entity registry with all 72 types, known divergences, and GraphQL client with introspection-based field discovery**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-12T16:55:25Z
- **Completed:** 2026-02-12T16:58:21Z
- **Tasks:** 2/2
- **Files modified:** 3

## Accomplishments

- Type definitions for comparison tool with EntityDefinition, KnownDivergence, ComparisonConfig, and result types
- Entity registry with all 72 @entity types from schema.graphql correctly mapped to snake_case Hasura table names
- Known divergences cover V1→V2 differences: null FK vs entity removal for OwnedAsset/OwnedToken, unknown token format returns null for NFT
- GraphQL client factory using axios with four methods: queryCount (aggregate counts), querySampleIds (sample row IDs), queryRowsByIds (full rows with auto-discovered fields), checkHealth
- Field introspection via `__type` query filters to scalar types only, caches results per table
- All queries handle errors gracefully (return -1 or empty array instead of throwing)

## Task Commits

Each task was committed atomically:

1. **Task 1: Type definitions and entity registry with known divergences** - `5e30d04` (feat)
2. **Task 2: GraphQL client with count and sample query builders** - `e654323` (feat)

## Files Created/Modified

- `packages/comparison-tool/src/types.ts` - All comparison type definitions (EntityDefinition, KnownDivergence, ComparisonConfig, CountResult, FieldDiff, RowDiff, ComparisonReport)
- `packages/comparison-tool/src/entityRegistry.ts` - ENTITY_REGISTRY with 72 entity types, KNOWN_DIVERGENCES array, helper functions (getEntityByName, getKnownDivergences), toSnakeCase utility
- `packages/comparison-tool/src/graphqlClient.ts` - createGraphqlClient factory with queryCount, querySampleIds, queryRowsByIds, queryTableFields (introspection), checkHealth

## Decisions Made

- **Snake case conversion:** Implemented toSnakeCase utility that converts PascalCase entity names to snake_case Hasura table names while preserving LSP prefixes (LSP3ProfileImage → lsp3_profile_image, not lsp_3_profile_image)
- **Graceful error handling:** GraphQL client returns -1 for missing tables (queryCount) or empty arrays (querySampleIds, queryRowsByIds) instead of throwing errors — enables comparison tool to detect missing entity types without crashes
- **Scalar field filtering:** Introspection-based field discovery filters to scalar types only (String, Int, Boolean, bigint, timestamptz, etc.) and excludes object/array relations — ensures row comparison works with primitive values
- **Field caching:** Field lists cached per table in Map to avoid repeated introspection queries during sample comparisons
- **Entity categorization:** Five categories (core, event, metadata, ownership, lsp, custom) help organize the 72 entity types and support filtering strategies in Plan 02
- **Metadata sub-entity flag:** isMetadataSub distinguishes sub-entities (ProfileImage, AssetImage, Tags, Links, etc.) from parent metadata entities — enables separate handling of metadata timing differences

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness

- Foundation complete for Plan 02 (comparison engine and CLI)
- Entity registry contains all 72 types matching schema.graphql exactly
- GraphQL client ready to query both V1 and V2 Hasura endpoints
- Known divergences documented for exclusion during comparison
- Zero new dependencies added (uses existing axios from package.json)

---

_Phase: 05-deployment-validation_
_Completed: 2026-02-12_

## Self-Check: PASSED
