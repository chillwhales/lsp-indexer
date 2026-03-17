---
id: S26
parent: M001
milestone: M001
provides:
  - "LOGGING.md field naming reference for all future structured logging"
  - "PluginRegistry optional Logger injection pattern"
  - "Zero console.* calls in registry.ts, config.ts, index.ts"
  - "All startup logs use structured (attrs, message) pattern"
  - Structured handler logs with step/handler attrs for Grafana/Loki queryability
  - Worker thread LOG relay pattern (postMessage → parent pino logger)
  - Template-free metadata fetch logging with extractable numeric fields
requires: []
affects: []
key_files: []
key_decisions:
  - "Optional Logger in PluginRegistry constructor so tests work without logger"
  - "Used warn (not error) for invalid METADATA_WORKER_POOL_SIZE since it's recoverable"
  - "Keep 1 console.error in metadataWorker.ts (parentPort null check — impossible to relay)"
  - "Worker LOG messages use type discrimination (array = results, object with type LOG = log relay)"
  - "metadataFetch.ts error branch keeps template string for entity fetchErrorMessage field but uses structured attrs for log call"
patterns_established:
  - "Constructor injection with optional chaining: this.logger?.info(attrs, msg)"
  - "Core fields step + component on every log call"
  - "Worker LOG relay: worker postMessage({ type: 'LOG', level, attrs, message }) → parent handleLogMessage() → pino logger"
  - "Handler structured attrs: { step: 'HANDLE', handler: name, ...contextFields }"
observability_surfaces: []
drill_down_paths: []
duration: 7min
verification_result: passed
completed_at: 2026-03-14
blocker_discovered: false
---
# S26: Structured Logging Overhaul

**# Phase 20.1 Plan 01: Infrastructure Structured Logging Summary**

## What Happened

# Phase 20.1 Plan 01: Infrastructure Structured Logging Summary

**LOGGING.md field reference established and registry/config/startup migrated from console.* to structured `(attrs, message)` logging with step + component fields**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-14T10:44:08Z
- **Completed:** 2026-03-14T10:49:02Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created LOGGING.md with core fields, optional fields, examples, and anti-patterns
- Migrated PluginRegistry to optional Logger constructor injection — 8 console.* calls replaced with structured this.logger?.* calls
- Migrated config.ts from console.error to structured logger.warn with attrs
- Migrated all 4 bare-string startup logs in index.ts to structured (attrs, message) pattern

## Task Commits

Each task was committed atomically:

1. **Task 1: LOGGING.md reference + Registry constructor logger injection** - `18b9d42` (feat)
2. **Task 2: Startup logs + config structured migration** - `c498deb` (feat)

## Files Created/Modified
- `packages/indexer/LOGGING.md` - Field naming reference document for structured logging
- `packages/indexer/src/core/registry.ts` - Optional Logger constructor injection, all 8 console.* replaced
- `packages/indexer/src/app/bootstrap.ts` - Passes bootLogger to PluginRegistry, removed duplicate discovery logs
- `packages/indexer/src/app/config.ts` - Accepts Logger param, structured warn for invalid pool size
- `packages/indexer/src/app/index.ts` - Passes logger to createPipelineConfig, all startup logs use (attrs, message)

## Decisions Made
- Used optional Logger (`logger?: Logger`) in PluginRegistry constructor so existing test callsites (`new PluginRegistry()`) continue to work without modification
- Changed `console.error` to `logger.warn` for invalid METADATA_WORKER_POOL_SIZE since the condition is recoverable (falls back to default)
- Hoisted `logDir` declaration in index.ts to avoid duplicate `const logDir` in separate if blocks

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Foundation logging conventions established in LOGGING.md
- Ready for 20.1-02 (pipeline + handler structured logging migration)
- All bootstrap/registry/config/startup files now use structured logging pattern

---
*Phase: 20.1-structured-logging-overhaul*
*Completed: 2026-03-14*

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
