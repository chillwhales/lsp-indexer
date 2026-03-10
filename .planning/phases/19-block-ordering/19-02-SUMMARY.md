---
phase: 19-block-ordering
plan: 02
subsystem: indexer
tags: [block-ordering, enrichment-queue, pipeline, verification, eventplugin, BORD-04]

# Dependency graph
requires:
  - phase: 19-block-ordering plan 01
    provides: "blockNumber/transactionIndex/logIndex fields on all 72 entities + EnrichmentRequest type with block fields + placeholder 0 values in queueEnrichment calls"
provides:
  - "All 11 EventPlugins pass real block/tx/log values in enrichment requests"
  - "Pipeline computes earliest block position per address from enrichment queue"
  - "New UP/DA entities receive block fields from earliest enrichment (BORD-04)"
  - "BlockPosition type exported from core/types"
  - "compareBlockPosition helper for tuple ordering"
affects: [19-block-ordering plan 03, handlers]

# Tech tracking
tech-stack:
  added: []
  patterns: ["earliest-enrichment-retention for core entity block ordering (BORD-04)", "BlockPosition tuple comparison"]

key-files:
  created: []
  modified:
    - "packages/indexer/src/plugins/events/*.plugin.ts (all 11)"
    - "packages/indexer/src/core/pipeline.ts"
    - "packages/indexer/src/core/verification.ts"
    - "packages/indexer/src/core/types/verification.ts"

key-decisions:
  - "BlockPosition type defined in core/types/verification.ts (central types barrel) rather than verification.ts to avoid circular imports"
  - "Block position map is optional param on VerifyFn to maintain backward compatibility"
  - "Fallback to 0 for block fields when no block position available (blockPos?.blockNumber ?? 0)"

patterns-established:
  - "BORD-04 earliest-enrichment: pipeline computes min(blockNumber, transactionIndex, logIndex) per address and passes to verification for new entity creation"
  - "compareBlockPosition: standard 3-field tuple comparison (blockNumber → transactionIndex → logIndex)"

requirements-completed: [BORD-02, BORD-04]

# Metrics
duration: 8min
completed: 2026-03-09
---

# Phase 19 Plan 02: Wire Block Ordering Through Plugins and Pipeline Summary

**All 11 EventPlugins pass real block data in enrichment requests; pipeline computes earliest-seen block position per address for new UP/DA entity creation (BORD-04 oldest retention)**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-09T13:43:58Z
- **Completed:** 2026-03-09T13:52:49Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Replaced placeholder `blockNumber: 0, transactionIndex: 0, logIndex: 0` with real values in all 29 queueEnrichment() calls across 11 EventPlugins
- Pipeline Step 5 now computes earliest block position per address from enrichment queue before verification
- New UP/DA entities created with block fields from their earliest enrichment request (BORD-04 oldest retention guarantee)
- FK stubs confirmed id-only — no risk of block field overwrite during enrichment

## Task Commits

Each task was committed atomically:

1. **Task 1: Update all EventPlugins to pass real block fields** - `9a54f71` (feat)
2. **Task 2: Update pipeline + verification to set block fields on core entities** - `53e693d` (feat)

## Files Created/Modified
- `packages/indexer/src/plugins/events/dataChanged.plugin.ts` - 2 enrichment calls updated with real block values
- `packages/indexer/src/plugins/events/deployedContracts.plugin.ts` - 1 enrichment call updated
- `packages/indexer/src/plugins/events/deployedProxies.plugin.ts` - 1 enrichment call updated
- `packages/indexer/src/plugins/events/executed.plugin.ts` - 3 enrichment calls updated
- `packages/indexer/src/plugins/events/follow.plugin.ts` - 2 enrichment calls updated
- `packages/indexer/src/plugins/events/lsp7Transfer.plugin.ts` - 4 enrichment calls updated
- `packages/indexer/src/plugins/events/lsp8Transfer.plugin.ts` - 5 enrichment calls updated
- `packages/indexer/src/plugins/events/ownershipTransferred.plugin.ts` - 4 enrichment calls updated
- `packages/indexer/src/plugins/events/tokenIdDataChanged.plugin.ts` - 2 enrichment calls updated
- `packages/indexer/src/plugins/events/unfollow.plugin.ts` - 2 enrichment calls updated
- `packages/indexer/src/plugins/events/universalReceiver.plugin.ts` - 3 enrichment calls updated
- `packages/indexer/src/core/types/verification.ts` - Added BlockPosition type
- `packages/indexer/src/core/pipeline.ts` - Added compareBlockPosition, earliest block computation, updated VerifyFn type
- `packages/indexer/src/core/verification.ts` - Updated verifyWithInterface and createVerifyFn to accept/use block position map

## Decisions Made
- BlockPosition type placed in `core/types/verification.ts` (the types barrel) rather than in `verification.ts` directly, to avoid circular imports between pipeline.ts and verification.ts
- VerifyFn signature updated with optional `blockPositionByAddress` parameter for backward compatibility
- Fallback `?? 0` for block fields when no position data available — safe default for edge cases

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 03 (EntityHandlers) is next — will wire block data through handler-created entities
- Uncommitted handler files with block ordering changes observed in working directory (from Plan 03 scope work started previously) — these build correctly but should be committed under Plan 03
- All prerequisite types, pipeline infrastructure, and plugin changes are ready

---
*Phase: 19-block-ordering*
*Completed: 2026-03-09*
