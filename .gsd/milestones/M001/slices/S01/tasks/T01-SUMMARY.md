---
id: T01
parent: S01
milestone: M001
provides:
  - Async handler support (void | Promise<void>)
  - Delete queue for DB-level entity removal (Step 4a)
  - Post-verification handler hook (Step 5.5)
  - Topological handler ordering by dependsOn
  - postVerification flag for handlers needing verified entities
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration: 5min
verification_result: passed
completed_at: 2026-02-06
blocker_discovered: false
---
# T01: 01-handler-migration 01

**# Phase 1 Plan 01: Infrastructure Summary**

## What Happened

# Phase 1 Plan 01: Infrastructure Summary

**Async handler support, delete queue (Step 4a), post-verification hook (Step 5.5), and topological handler ordering via Kahn's algorithm**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-06T10:07:34Z
- **Completed:** 2026-02-06T10:12:55Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- EntityHandler.handle() now supports async implementations (void | Promise<void>)
- Pipeline awaits all handler.handle() calls in both Step 3 and Step 5.5
- Delete queue enables DB-level entity removal in Step 4a before upserts
- Post-verification hook (Step 5.5) allows handlers to run after core entities are verified/persisted
- Registry topologically sorts handlers by dependsOn using Kahn's algorithm with cycle detection
- All 15+ existing handlers compile without changes (new features are opt-in via optional properties)

## Task Commits

Each task was committed atomically:

1. **Task 1: Async handler interface + delete queue + postVerification + dependsOn** - `cdb3bfd` (feat)
2. **Task 2: Pipeline changes — await handlers, Step 4a deletes, Step 5.5 hook** - `4f84934` (feat)
3. **Task 3: Registry topological sort for handler dependencies** - `06614bd` (feat)

## Files Created/Modified

- `packages/indexer-v2/src/core/types/handler.ts` - Extended EntityHandler with async handle(), postVerification, dependsOn
- `packages/indexer-v2/src/core/types/batchContext.ts` - Added DeleteRequest/StoredDeleteRequest types, queueDelete/getDeleteQueue to IBatchContext
- `packages/indexer-v2/src/core/batchContext.ts` - Implemented delete queue storage and methods
- `packages/indexer-v2/src/core/pipeline.ts` - Added Step 4a deletes, Step 5.5 post-verification hook, await handler.handle()
- `packages/indexer-v2/src/core/registry.ts` - Added topologicalSort() with Kahn's algorithm, called after discovery and manual registration

## Decisions Made

- Used `queueDelete()` instead of overloading `removeEntity()` to keep in-memory bag removal and DB-level deletion distinct
- `postVerification` is a simple boolean opt-in flag rather than a separate interface — keeps all handlers as one type
- Topological sort runs on every `registerEntityHandler()` call (not just discovery) to support test scenarios

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All infrastructure changes are in place for Phase 1 handler implementations
- Ready for 01-02-PLAN.md (totalSupply + ownedAssets handlers)
- Handlers can now use postVerification, dependsOn, and queueDelete() in their implementations

## Self-Check: PASSED

---

_Phase: 01-handler-migration_
_Completed: 2026-02-06_
