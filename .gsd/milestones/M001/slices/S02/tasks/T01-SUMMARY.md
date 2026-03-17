---
id: T01
parent: S02
milestone: M001
provides:
  - Logger factory module (createStepLogger, initFileLogger, getFileLogger, createDualLogger)
  - PipelineStep type for all V2 pipeline stages
  - Dual-output architecture (Subsquid stdout + pino file)
  - Package.json and tsconfig.json for indexer-v2 TypeScript source
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration: 8min
verification_result: passed
completed_at: 2026-02-06
blocker_discovered: false
---
# T01: 02-new-handlers-structured-logging 01

**# Phase 2 Plan 1: Structured Logger Module Summary**

## What Happened

# Phase 2 Plan 1: Structured Logger Module Summary

**Dual-output structured logger factory with Subsquid Logger.child() for stdout and pino-roll for rotating JSON file output, plus 11 unit tests**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-06T15:45:34Z
- **Completed:** 2026-02-06T15:53:34Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Logger factory module with `createStepLogger`, `initFileLogger`, `getFileLogger`, `createDualLogger`, and `PipelineStep` type
- Dual-output architecture: Subsquid stdout + pino file with daily rotation via pino-roll
- All attributes passed as structured objects (no JSON.stringify) — ready for jq filtering
- 11 unit tests covering field injection, blockRange formatting, LOG_LEVEL override, NODE_ENV defaults, and dual logger attribute passthrough
- Created indexer-v2 package.json and tsconfig.json for TypeScript source compilation

## Task Commits

Each task was committed atomically:

1. **Task 1: Install pino dependencies and create logger module** - `f71b29e` (feat)
2. **Task 2: Unit tests for logger module** - `6616c9a` (test)

## Files Created/Modified

- `packages/indexer-v2/src/core/logger.ts` — Logger factory with PipelineStep, createStepLogger, initFileLogger, getFileLogger, createDualLogger
- `packages/indexer-v2/src/core/__tests__/logger.test.ts` — 11 unit tests for logger factory
- `packages/indexer-v2/package.json` — V2 package with pino, pino-roll, vitest, @subsquid/logger
- `packages/indexer-v2/tsconfig.json` — TypeScript config for V2 source compilation
- `pnpm-lock.yaml` — Updated lock file with new dependencies

## Decisions Made

- **Dual-output via Subsquid Logger.child() + pino file transport:** Keeps stdout/stderr under Subsquid control while adding independent file rotation. Subsquid already outputs to stderr with its own format — we don't fight it, just add file output.
- **Singleton pino logger pattern:** initFileLogger() called once at startup, getFileLogger() returns it anywhere. Clean lifecycle management.
- **\_resetFileLogger() exported for testing:** Internal helper allows test isolation without side effects between tests.
- **Added @subsquid/logger as direct dependency:** Was only a transitive dep via @subsquid/evm-processor, needed explicit declaration for type imports.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created package.json and tsconfig.json for indexer-v2**

- **Found during:** Task 1 (Install pino dependencies)
- **Issue:** No package.json or tsconfig.json existed for the indexer-v2 package — only compiled JS in lib/ and node_modules
- **Fix:** Created both files with appropriate config matching the V1 indexer patterns
- **Files modified:** packages/indexer-v2/package.json, packages/indexer-v2/tsconfig.json
- **Verification:** pnpm install succeeded, TypeScript compilation of logger.ts succeeded
- **Committed in:** f71b29e (Task 1 commit)

**2. [Rule 3 - Blocking] Added @subsquid/logger as direct dependency**

- **Found during:** Task 1 (Logger module creation)
- **Issue:** @subsquid/logger was only available as transitive dependency — `import type { Logger }` failed to resolve
- **Fix:** Added `"@subsquid/logger": "^1.4.0"` to package.json dependencies
- **Files modified:** packages/indexer-v2/package.json
- **Verification:** `require.resolve('@subsquid/logger')` succeeds from indexer-v2
- **Committed in:** f71b29e (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes necessary for task completion — no package infrastructure existed for V2 source code. No scope creep.

## Issues Encountered

None — plan executed with expected blocking issues resolved inline.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Logger factory module ready for integration into pipeline.js (Plan 02-04)
- All exports match plan specification: createStepLogger, initFileLogger, getFileLogger, createDualLogger, PipelineStep
- vitest.config.ts already existed with proper alias configuration — future tests can reuse
- Package.json establishes indexer-v2 as a proper TypeScript package for remaining Phase 2 plans

## Self-Check: PASSED

---

_Phase: 02-new-handlers-structured-logging_
_Completed: 2026-02-06_
