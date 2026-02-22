---
phase: 01-handler-migration
plan: 01
subsystem: infra
tags: [typescript, pipeline, handler, topological-sort, async]

# Dependency graph
requires:
  - phase: none
    provides: existing EntityHandler interface, BatchContext, pipeline, registry
provides:
  - Async handler support (void | Promise<void>)
  - Delete queue for DB-level entity removal (Step 4a)
  - Post-verification handler hook (Step 5.5)
  - Topological handler ordering by dependsOn
  - postVerification flag for handlers needing verified entities
affects: [01-02, 01-03, 01-04, phase-2, phase-3, phase-4]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Kahn's algorithm for handler dependency ordering"
    - 'Step 4a delete queue before Step 4b upserts'
    - 'Step 5.5 post-verification handler hook'

key-files:
  created: []
  modified:
    - packages/indexer-v2/src/core/types/handler.ts
    - packages/indexer-v2/src/core/types/batchContext.ts
    - packages/indexer-v2/src/core/batchContext.ts
    - packages/indexer-v2/src/core/pipeline.ts
    - packages/indexer-v2/src/core/registry.ts

key-decisions:
  - 'queueDelete() separate from removeEntity() to distinguish DB-level vs in-memory bag removal'
  - 'postVerification as opt-in boolean flag — existing handlers unaffected'
  - 'topologicalSort called on both discoverHandlers() and registerEntityHandler()'

patterns-established:
  - 'Opt-in handler capabilities via optional properties (postVerification, dependsOn)'
  - 'Pipeline step numbering: 4a (deletes) before 4b (upserts), 5.5 (post-verify handlers)'

# Metrics
duration: 5min
completed: 2026-02-06
---

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
