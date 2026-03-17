---
id: T01
parent: S26
milestone: M001
provides:
  - "LOGGING.md field naming reference for all future structured logging"
  - "PluginRegistry optional Logger injection pattern"
  - "Zero console.* calls in registry.ts, config.ts, index.ts"
  - "All startup logs use structured (attrs, message) pattern"
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration: 4min
verification_result: passed
completed_at: 2026-03-14
blocker_discovered: false
---
# T01: 20.1-structured-logging-overhaul 01

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
