---
phase: 04-integration-wiring
plan: 02
subsystem: infra
tags: [subsquid, registry, bootstrap, typescript, lukso]

# Dependency graph
requires:
  - phase: 04-01-processor-configuration
    provides: Processor instance ready for log subscription configuration
provides:
  - Bootstrap module with registry discovery and validation
  - Main entry point configured with all plugin/handler log subscriptions
  - Structured boot logging showing discovery summary
affects: [04-03-pipeline-integration, 04-04-block-fixtures, 04-05-integration-tests]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Bootstrap module pattern for registry creation and validation'
    - 'Automatic plugin/handler discovery from filesystem'
    - 'Structured boot logging with BOOTSTRAP step'
    - 'Log subscription aggregation from registry'

key-files:
  created:
    - packages/indexer-v2/src/app/bootstrap.ts
  modified:
    - packages/indexer-v2/src/app/index.ts

key-decisions:
  - 'createRegistry() takes Logger parameter for structured boot logging'
  - 'Registry.discover() and discoverHandlers() called with resolved __dirname paths'
  - 'Log subscriptions configured via for-loop calling processor.addLog()'
  - 'Bootstrap happens before processor.run() to ensure all subscriptions configured'

patterns-established:
  - 'Bootstrap function returns initialized registry for use in pipeline'
  - 'Structured logging at boot shows plugin count, handler count, and dependency order'
  - 'createStepLogger with BOOTSTRAP step for all discovery logs'

# Metrics
duration: 1min
completed: 2026-02-09
---

# Phase 04 Plan 02: Registry Discovery and Log Subscription Wiring Summary

**Bootstrap module discovers all 11 EventPlugins and EntityHandlers from filesystem, validates registry contracts, and configures processor with aggregated log subscriptions**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-09T18:55:21Z
- **Completed:** 2026-02-09T18:56:37Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Bootstrap module exports createRegistry() function for registry initialization
- Registry automatically discovers all EventPlugins from plugins/events/ directory
- Registry automatically discovers all EntityHandlers from handlers/ directory
- Structured boot logging shows plugin count, handler count in dependency order, and subscription count
- Main entry point calls createRegistry() before processor.run()
- Processor configured with all log subscriptions from registry.getLogSubscriptions()
- Fail-fast validation throws on duplicates or circular dependencies at boot

## Task Commits

Each task was committed atomically:

1. **Task 1: Create bootstrap module with registry discovery** - `e6b6cdc` (feat)
2. **Task 2: Wire registry and subscriptions into main entry point** - `ccf268f` (feat)

## Files Created/Modified

- `packages/indexer-v2/src/app/bootstrap.ts` - Bootstrap module with createRegistry() function
- `packages/indexer-v2/src/app/index.ts` - Main entry point updated with registry bootstrap and processor configuration

## Decisions Made

- createRegistry() accepts Logger parameter to enable structured logging during discovery
- Plugin directory resolved as `path.resolve(__dirname, '../plugins/events')`
- Handler directory resolved as `path.resolve(__dirname, '../handlers')`
- Log subscriptions applied to processor via for-loop calling processor.addLog() for each subscription
- Bootstrap sequence executes before processor.run() to ensure processor is fully configured
- Removed Plan 02 TODO comment, kept Plan 03 TODO for pipeline integration

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness

Ready for Plan 04-03 (Pipeline integration with processBatch wiring).

Foundation complete:

- Registry discovery fully functional and tested via structured logs
- All EventPlugins and EntityHandlers will be discovered at boot
- Processor configured with correct log subscriptions from all plugins
- Bootstrap logs provide visibility into discovery process (counts and order)
- Registry available for use in pipeline integration

---

_Phase: 04-integration-wiring_
_Completed: 2026-02-09_

## Self-Check: PASSED
