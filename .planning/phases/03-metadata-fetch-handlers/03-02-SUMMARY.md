---
phase: 03-metadata-fetch-handlers
plan: 02
subsystem: indexer-handlers
tags: [lsp3, lsp29, metadata-fetch, sub-entities, profile, encrypted-asset]

# Dependency graph
requires:
  - phase: 03-metadata-fetch-handlers
    provides: Shared handleMetadataFetch utility, type guards, FetchResult type
  - phase: 01-handler-migration
    provides: EntityHandler interface, BatchContext, base LSP3/LSP29 handlers
provides:
  - LSP3 profile metadata fetch handler creating 7 sub-entity types
  - LSP29 encrypted asset metadata fetch handler creating 7 sub-entity types
affects:
  - 03-metadata-fetch-handlers (plan 03 — LSP4 metadata fetch uses same pattern)
  - 04-integration-wiring (registry must discover these handlers)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Fetch handler pattern: listensToBag + dependsOn base handler + parseAndAddSubEntities callback'
    - 'FK chain pattern: LSP29 AccessControlCondition → Encryption → Asset'

key-files:
  created:
    - packages/indexer-v2/src/handlers/lsp3ProfileFetch.handler.ts
    - packages/indexer-v2/src/handlers/lsp29EncryptedAssetFetch.handler.ts
  modified: []

key-decisions:
  - 'LSP29 AccessControlCondition not in SubEntityDescriptors — cleared via encryption cascade'
  - 'LSP29 entityUpdates returns version, contentId, revision, createdAt for parent entity'
  - 'LSP3 profile images treated as flat arrays (matching V1 structure, unlike LSP4 nested arrays)'

patterns-established:
  - 'Metadata fetch handler pattern: config object + parseAndAddSubEntities callback'
  - 'Parent FK reference via new Entity({ id }) for sub-entity construction'

# Metrics
duration: 4min
completed: 2026-02-09
---

# Phase 3 Plan 02: LSP3 + LSP29 Metadata Fetch Handlers Summary

**LSP3 profile and LSP29 encrypted asset metadata fetch handlers with 14 total sub-entity types using shared handleMetadataFetch utility**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-09T06:53:09Z
- **Completed:** 2026-02-09T06:57:57Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- LSP3 profile fetch handler creates 7 sub-entity types (Name, Description, Tag, Link, Asset, Image, BackgroundImage)
- LSP29 encrypted asset fetch handler creates 7 sub-entity types (Title, Description, File, Encryption, AccessControlCondition, Chunks, Image)
- Both handlers use shared handleMetadataFetch utility for empty value clearing and head-only gating
- LSP29 FK chain correctly implemented: AccessControlCondition → Encryption → EncryptedAsset

## Task Commits

Each task was committed atomically:

1. **Task 1: LSP3 Profile fetch handler with 7 sub-entity types** - `ce9e865` (feat)
2. **Task 2: LSP29 Encrypted Asset fetch handler with 7 sub-entity types** - `ba1a9aa` (feat)

## Files Created/Modified

- `packages/indexer-v2/src/handlers/lsp3ProfileFetch.handler.ts` — LSP3 profile metadata fetch handler with 7 sub-entity parsing from JSON
- `packages/indexer-v2/src/handlers/lsp29EncryptedAssetFetch.handler.ts` — LSP29 encrypted asset metadata fetch handler with 7 sub-entity parsing, nested FK chain, BigInt conversions

## Decisions Made

- **LSP29 AccessControlCondition excluded from SubEntityDescriptors** — its FK points to Encryption not Asset; cleared via cascade when Encryption entities are removed
- **LSP29 returns entityUpdates** — version, contentId, revision, createdAt are stored on the parent LSP29EncryptedAsset entity after successful parse (matching V1 behavior)
- **LSP3 profile images as flat arrays** — unlike LSP4 which uses nested arrays, LSP3 profileImage and backgroundImage are simple flat arrays matching the LSP3 JSON schema

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for 03-03-PLAN.md (LSP4 metadata fetch handler)
- Both handlers follow the established fetch handler pattern for consistency
- No blockers or concerns

---

## Self-Check: PASSED

---

_Phase: 03-metadata-fetch-handlers_
_Completed: 2026-02-09_
