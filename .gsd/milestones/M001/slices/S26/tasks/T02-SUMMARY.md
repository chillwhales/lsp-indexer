---
id: T02
parent: S26
milestone: M001
provides:
  - Structured handler logs with step/handler attrs for Grafana/Loki queryability
  - Worker thread LOG relay pattern (postMessage → parent pino logger)
  - Template-free metadata fetch logging with extractable numeric fields
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration: 7min
verification_result: passed
completed_at: 2026-03-14
blocker_discovered: false
---
# T02: 20.1-structured-logging-overhaul 02

**# Phase 20.1 Plan 02: Handlers, MetadataFetch, and Worker Thread Structured Logging Summary**

## What Happened

# Phase 20.1 Plan 02: Handlers, MetadataFetch, and Worker Thread Structured Logging Summary

**Eliminated JSON.stringify anti-pattern, template string logs, and console.* calls across handlers/utilities with worker thread LOG relay through parent pino logger**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-14T10:44:10Z
- **Completed:** 2026-03-14T10:51:23Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Migrated 8 JSON.stringify log calls (4 orbsClaimed + 4 chillClaimed) to structured attrs pattern
- Migrated 1 console.warn in totalSupply to hctx.context.log.warn with bigint→string conversion
- Migrated 13 template string log calls in metadataFetch.ts to structured (attrs, msg) pattern
- Added worker thread LOG message relay: worker postMessage → parent pool handleLogMessage → pino logger

## Task Commits

Each task was committed atomically:

1. **Task 1: Handler JSON.stringify + console.warn migration** - `4d1ef0b` (feat)
2. **Task 2: MetadataFetch template strings + Worker thread LOG relay** - `07876ed` (feat)

## Files Created/Modified
- `packages/indexer/src/handlers/chillwhales/orbsClaimed.handler.ts` - 4 JSON.stringify → structured attrs
- `packages/indexer/src/handlers/chillwhales/chillClaimed.handler.ts` - 4 JSON.stringify → structured attrs
- `packages/indexer/src/handlers/totalSupply.handler.ts` - 1 console.warn → context.log.warn
- `packages/indexer/src/utils/metadataFetch.ts` - 13 template string logs → structured attrs
- `packages/indexer/src/core/metadataWorker.ts` - WorkerLogMessage type + LOG relay via postMessage
- `packages/indexer/src/core/metadataWorkerPool.ts` - WorkerLogMessage interface + handleLogMessage method

## Decisions Made
- Kept 1 console.error in metadataWorker.ts for parentPort null check — it's a startup invariant failure where the worker literally cannot communicate with parent, so console.error is the only option
- Used type discrimination for worker messages: `Array.isArray(message)` differentiates FetchResult[] from WorkerLogMessage
- In metadataFetch.ts error branch, kept the template string `message` variable for entity `fetchErrorMessage` field but used separate structured attrs for the log call itself

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 02 complete — all handlers, utilities, and worker threads now use structured logging
- Ready for Phase 20.2 pipeline instrumentation (if planned)
- All structured log patterns established: step/handler/component attrs convention

## Self-Check: PASSED

All 6 modified files exist. Both task commits (4d1ef0b, 07876ed) verified in git log. SUMMARY.md created.

---
*Phase: 20.1-structured-logging-overhaul*
*Completed: 2026-03-14*
