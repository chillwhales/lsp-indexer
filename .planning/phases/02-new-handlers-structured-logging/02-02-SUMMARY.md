---
phase: 02-new-handlers-structured-logging
plan: 02
subsystem: handlers
tags: [follower, follow, unfollow, LSP26, entityhandler, vitest, deterministic-id]

# Dependency graph
requires:
  - phase: 02-new-handlers-structured-logging
    provides: Phase 2 context and research for handler patterns
provides:
  - Follower EntityHandler (listensToBag: Follow, Unfollow)
  - Follow EventPlugin TypeScript source
  - Unfollow EventPlugin TypeScript source
  - Vitest test infrastructure (config, setup, CJS alias resolution)
  - 8 unit tests covering follow/unfollow cycle
affects: [04-integration-wiring, 05-deployment-validation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'EntityHandler for derived entity creation from raw events'
    - 'queueDelete with minimal entity instances (just ID) for entity removal'
    - 'vitest.setup.ts with Module._resolveFilename hook for @/* CJS alias'

key-files:
  created:
    - packages/indexer-v2/src/handlers/follower.handler.ts
    - packages/indexer-v2/src/plugins/events/follow.plugin.ts
    - packages/indexer-v2/src/plugins/events/unfollow.plugin.ts
    - packages/indexer-v2/src/handlers/__tests__/follower.handler.test.ts
    - packages/indexer-v2/vitest.config.ts
    - packages/indexer-v2/vitest.setup.ts
  modified: []

key-decisions:
  - 'vitest @/* alias uses lib/ directory (compiled JS) since src/ is incomplete'
  - 'CJS require resolution for @/* handled via Module._resolveFilename hook in vitest.setup.ts'
  - 'Follower handler uses generateFollowId from @/utils for V1-compatible deterministic IDs'

patterns-established:
  - 'Mock BatchContext helper pattern for handler unit tests'
  - 'EntityHandler test pattern: seed entity bags, call handle(), verify addEntity/queueDelete/queueEnrichment calls'

# Metrics
duration: 5min
completed: 2026-02-06
---

# Phase 2 Plan 2: Follower Handler + EventPlugin TypeScript Sources Summary

**Follower EntityHandler creating/deleting Follower entities via generateFollowId deterministic IDs, with Follow/Unfollow EventPlugin TypeScript ports and 8 unit tests**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-06T15:46:55Z
- **Completed:** 2026-02-06T15:52:47Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Follower EntityHandler handles both Follow (create) and Unfollow (delete) events with deterministic IDs matching V1's `generateFollowId` format
- Follow and Unfollow EventPlugin TypeScript sources faithfully port compiled JS behavior (uuid IDs, LSP26 ABI decode, enrichment queuing)
- 8 unit tests covering HNDL-01 (follow creation) and HNDL-02 (unfollow deletion), including critical pitfall test for `unfollowedAddress` vs `followedAddress`
- Vitest test infrastructure established with CJS `@/*` alias resolution

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Follow/Unfollow EventPlugin TS sources and Follower handler** - `ff7f2cf` (feat)
2. **Task 2: Unit tests for Follower handler** - `194277c` (test)

## Files Created/Modified

- `packages/indexer-v2/src/handlers/follower.handler.ts` - Follower EntityHandler with listensToBag: ['Follow', 'Unfollow']
- `packages/indexer-v2/src/plugins/events/follow.plugin.ts` - Follow EventPlugin TypeScript source (port from compiled JS)
- `packages/indexer-v2/src/plugins/events/unfollow.plugin.ts` - Unfollow EventPlugin TypeScript source (port from compiled JS)
- `packages/indexer-v2/src/handlers/__tests__/follower.handler.test.ts` - 8 unit tests for Follower handler (315 lines)
- `packages/indexer-v2/vitest.config.ts` - Vitest configuration with @/\* alias to lib/
- `packages/indexer-v2/vitest.setup.ts` - CJS Module.\_resolveFilename hook for @/\* path alias

## Decisions Made

- **vitest alias strategy:** Mapped `@/*` to `lib/` (compiled JS) since `src/` doesn't have full module coverage yet. A `vitest.setup.ts` patches Node's `Module._resolveFilename` to handle CJS `require("@/...")` calls inside compiled lib files.
- **Test approach:** Mock BatchContext with vi.fn() tracking, seed entity bags directly, verify handler interactions via mock call assertions. This pattern is reusable for future handler tests.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created vitest.setup.ts for CJS @/\* path resolution**

- **Found during:** Task 2 (unit tests)
- **Issue:** Compiled JS files in `lib/` use `require("@/constants")` which Node's CJS loader cannot resolve. Vitest's Vite-based alias only handles ESM imports, not CJS require calls.
- **Fix:** Created `vitest.setup.ts` that patches `Module._resolveFilename` to rewrite `@/*` paths to `lib/*` at CJS resolution time.
- **Files modified:** packages/indexer-v2/vitest.setup.ts, packages/indexer-v2/vitest.config.ts
- **Verification:** All 8 tests pass successfully
- **Committed in:** 194277c (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to make tests runnable. No scope creep — the CJS alias setup is infrastructure for all future V2 handler tests.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Follower handler and EventPlugins ready for Phase 4 integration wiring
- Mock BatchContext pattern established for LSP6Controllers handler tests (02-03)
- vitest test infrastructure ready for all future handler unit tests

---

## Self-Check: PASSED

_Phase: 02-new-handlers-structured-logging_
_Completed: 2026-02-06_
