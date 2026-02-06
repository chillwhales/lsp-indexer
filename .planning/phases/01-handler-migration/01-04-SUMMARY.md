---
phase: 01-handler-migration
plan: 04
subsystem: indexer-core
tags: [cleanup, dead-code, legacy-removal, barrel-export]

# Dependency graph
requires:
  - phase: 01-handler-migration (plans 01-03)
    provides: Standalone EntityHandler files (totalSupply, ownedAssets, decimals, formattedTokenId) that replace legacy helpers
provides:
  - Clean core/ module with no legacy populate/persist/handlerHelpers code
  - Barrel export (core/index.ts) reduced to 7 re-exports
  - Zero dangling references to legacy patterns
affects: [02-new-handlers, 04-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Legacy populate/persist/handler helpers fully removed — enrichment queue and pipeline are the only patterns'

key-files:
  created: []
  modified:
    - packages/indexer-v2/src/core/index.ts
    - packages/indexer-v2/src/handlers/totalSupply.handler.ts
    - packages/indexer-v2/src/handlers/ownedAssets.handler.ts

key-decisions:
  - "JSDoc 'Port from v1' references annotated with deletion note rather than removed entirely — preserves provenance trail"

patterns-established:
  - 'All handler logic lives in standalone handler files — no shared helper modules for handler business logic'

# Metrics
duration: 2min
completed: 2026-02-06
---

# Phase 1 Plan 4: Legacy Code Cleanup Summary

**Deleted handlerHelpers.ts, populateHelpers.ts, and persistHelpers.ts — 593 lines of legacy code removed, zero dangling references**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-06T10:24:09Z
- **Completed:** 2026-02-06T10:26:32Z
- **Tasks:** 1
- **Files modified:** 6 (3 deleted, 1 edited, 2 JSDoc updated)

## Accomplishments

- Deleted handlerHelpers.ts (updateTotalSupply, updateOwnedAssets — 335 lines, replaced by standalone handlers in Plans 02-03)
- Deleted populateHelpers.ts (populateByUP, populateByDA, enrichEntityFk, populateByUPAndDA, populateNFTs — 125 lines, replaced by enrichment queue)
- Deleted persistHelpers.ts (insertEntities, upsertEntities, insertNewEntities, mergeUpsertEntities — 131 lines, replaced by pipeline Steps 2/4)
- Updated core/index.ts barrel export from 10 to 7 re-exports
- Verified zero dangling imports or function references across entire codebase
- Build passes clean with zero type errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Verify zero imports, delete legacy files, update barrel export** - `d0499fa` (refactor)

## Files Created/Modified

- `packages/indexer-v2/src/core/handlerHelpers.ts` - DELETED (updateTotalSupply, updateOwnedAssets)
- `packages/indexer-v2/src/core/populateHelpers.ts` - DELETED (populateByUP, populateByDA, enrichEntityFk, populateByUPAndDA, populateNFTs)
- `packages/indexer-v2/src/core/persistHelpers.ts` - DELETED (insertEntities, upsertEntities, insertNewEntities, mergeUpsertEntities)
- `packages/indexer-v2/src/core/index.ts` - Barrel export updated, removed 3 re-export lines
- `packages/indexer-v2/src/handlers/totalSupply.handler.ts` - JSDoc updated to note source file deletion
- `packages/indexer-v2/src/handlers/ownedAssets.handler.ts` - JSDoc updated to note source file deletion

## Decisions Made

- JSDoc "Port from v1" comments annotated with "(deleted in 01-04)" rather than removed entirely — preserves the provenance trail for future developers tracing code origins

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated stale JSDoc references in handler files**

- **Found during:** Task 1 (final verification grep)
- **Issue:** totalSupply.handler.ts and ownedAssets.handler.ts had "Port from v1" JSDoc references to core/handlerHelpers.ts which no longer exists
- **Fix:** Annotated references with "(deleted in 01-04)" to preserve provenance while marking them as historical
- **Files modified:** packages/indexer-v2/src/handlers/totalSupply.handler.ts, packages/indexer-v2/src/handlers/ownedAssets.handler.ts
- **Verification:** grep confirms no live references remain
- **Committed in:** d0499fa (part of task commit)

---

**Total deviations:** 1 auto-fixed (1 bug — stale documentation references)
**Impact on plan:** Minimal — updated 2 JSDoc comments. No scope creep.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Phase 1 complete:** All 4 plans executed successfully
  - Plan 01: Core infrastructure (EntityHandler interface, dependsOn, postVerification, queueDelete, topological sort)
  - Plan 02: Transfer-derived handlers (totalSupply, ownedAssets)
  - Plan 03: Data-key-derived handlers (decimals, formattedTokenId)
  - Plan 04: Legacy code cleanup (this plan)
- **Ready for Phase 2:** New Handlers & Structured Logging
- **No blockers or concerns**

---

## Self-Check: PASSED

_Phase: 01-handler-migration_
_Completed: 2026-02-06_
