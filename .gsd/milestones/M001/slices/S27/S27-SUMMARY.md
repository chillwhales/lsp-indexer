---
id: S27
parent: M001
milestone: M001
provides:
  - performance.now() timing on all 9 pipeline steps
  - BATCH_SUMMARY log with step timings, entity counts, and block range
  - EXTRACT and HANDLE step loggers
  - getTotalEntityCount() method on BatchContext
requires: []
affects: []
key_files: []
key_decisions:
  - "Used performance.now() for sub-millisecond timing precision over Date.now()"
  - "Timing for VERIFY step includes single-pass grouping, verification, post-verify handlers, and late enrichment processing as one unit"
  - "RESOLVE timing logged via separate resolveTimingLog since fkResolution.ts creates its own internal logger"
patterns_established:
  - "Step timing pattern: const start = performance.now() → step code → const durationMs = Math.round(performance.now() - start) → log.info({ durationMs }, 'Step complete')"
observability_surfaces: []
drill_down_paths: []
duration: 4min
verification_result: passed
completed_at: 2026-03-14
blocker_discovered: false
---
# S27: Pipeline Instrumentation

**# Phase 20.2 Plan 01: Pipeline Instrumentation Summary**

## What Happened

# Phase 20.2 Plan 01: Pipeline Instrumentation Summary

**performance.now() timing wraps on all 9 pipeline steps with BATCH_SUMMARY log emitting step timings, entity counts, and total duration**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-14T16:29:21Z
- **Completed:** 2026-03-14T16:33:59Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- All 9 pipeline steps (EXTRACT through RESOLVE) emit durationMs in structured logs
- EXTRACT and HANDLE steps now have dedicated createStepLogger loggers
- BATCH_SUMMARY log emitted at end of each processBatch() with blockCount, totalEntities, totalEnrichments, all 9 stepTimings, and totalDurationMs
- getTotalEntityCount() added to BatchContext for summary reporting

## Task Commits

Each task was committed atomically:

1. **Task 1: Add step timing wrappers and missing loggers** - `1c83134` (feat)
2. **Task 2: Add batch summary log** - `fd62e75` (feat)

## Files Created/Modified
- `packages/indexer/src/core/logger.ts` - Added BATCH_SUMMARY to PipelineStep union type
- `packages/indexer/src/core/batchContext.ts` - Added getTotalEntityCount() method
- `packages/indexer/src/core/pipeline.ts` - Step timing wraps on all 9 steps, EXTRACT/HANDLE loggers, batch summary log

## Decisions Made
- Used `performance.now()` for sub-millisecond timing precision (appropriate for pipeline step measurement)
- VERIFY timing encompasses the full verify-through-post-verify-enrichment block as a single unit, matching the plan's boundary specification
- Created a separate `resolveTimingLog` for RESOLVE step timing since `fkResolution.ts` creates its own internal logger

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Pipeline instrumentation complete — operators can monitor step-level timing via structured logs
- BATCH_SUMMARY log provides at-a-glance health monitoring data for Grafana/Loki dashboards
- Phase 20.2 has 1 plan total — phase complete, ready for transition

## Self-Check: PASSED

- All 3 modified files verified on disk
- Both task commits (1c83134, fd62e75) verified in git log
- Build passes with zero errors

---
*Phase: 20.2-pipeline-instrumentation*
*Completed: 2026-03-14*
