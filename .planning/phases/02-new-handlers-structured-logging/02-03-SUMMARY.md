---
phase: 02-new-handlers-structured-logging
plan: 03
subsystem: handlers
tags: [lsp6, permissions, entityhandler, typeorm, vitest, viem, erc725]

# Dependency graph
requires:
  - phase: 02-new-handlers-structured-logging
    provides: EntityHandler patterns and test mock conventions from follower handler
provides:
  - LSP6Controllers TypeScript source with full type annotations
  - Unit tests proving delete-and-recreate cycle for 3 sub-entity types
  - Test patterns for mocking mergeEntitiesFromBatchAndDb and queueClear
affects: [integration-wiring, deployment-validation]

# Tech tracking
tech-stack:
  added: ['@lukso/lsp6-contracts@0.15.5', '@erc725/erc725.js@^0.28.1']
  patterns:
    [
      'queueClear for sub-entity delete-then-reinsert',
      'mergeEntitiesFromBatchAndDb for cross-batch entity lookup',
      'vi.mock for handler helper isolation in tests',
    ]

key-files:
  created:
    - packages/indexer-v2/src/handlers/lsp6Controllers.handler.ts
    - packages/indexer-v2/src/handlers/__tests__/lsp6Controllers.handler.test.ts
  modified:
    - packages/indexer-v2/package.json
    - pnpm-lock.yaml

key-decisions:
  - "Used type assertions (null as unknown as undefined) for entity FK fields where TypeORM model types don't include null but compiled JS sets null at runtime"
  - 'Cast dataKey/dataValue to 0x${string} template literals for viem hexToBytes compatibility'
  - 'Mocked mergeEntitiesFromBatchAndDb at module level to isolate handler logic from DB dependencies'

patterns-established:
  - 'LSP6 handler test pattern: mock BatchContext with _entityBags/_clearQueue/_enrichmentQueue accessors'
  - 'Sub-entity FK linking verification: check controller field set on all permission/call/key entities'

# Metrics
duration: 10min
completed: 2026-02-06
---

# Phase 2 Plan 3: LSP6Controllers Handler TypeScript Port + Tests Summary

**LSP6Controllers handler ported to 568-line TypeScript source with 9 unit tests verifying queueClear delete-and-recreate cycle, controller merge, sub-entity linking, and enrichment**

## Performance

- **Duration:** 10 min
- **Started:** 2026-02-06T15:48:13Z
- **Completed:** 2026-02-06T15:58:54Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Faithful TypeScript port of compiled lsp6Controllers.handler.js (456→568 lines) with full type annotations
- Added @lukso/lsp6-contracts and @erc725/erc725.js as indexer-v2 dependencies
- 9 unit tests covering all critical behaviors: queueClear for 3 sub-entity types, merge-upsert, sub-entity linking, orphan detection, enrichment
- All tests pass in 14ms

## Task Commits

Each task was committed atomically:

1. **Task 1: Port LSP6Controllers handler to TypeScript source** - `93704ae` (feat)
2. **Task 2: Unit tests for LSP6Controllers handler delete-and-recreate cycle** - `1670790` (test)

## Files Created/Modified

- `packages/indexer-v2/src/handlers/lsp6Controllers.handler.ts` - TypeScript source for LSP6Controllers EntityHandler (568 lines)
- `packages/indexer-v2/src/handlers/__tests__/lsp6Controllers.handler.test.ts` - 9 unit tests proving delete-and-recreate cycle (438 lines)
- `packages/indexer-v2/package.json` - Added @lukso/lsp6-contracts and @erc725/erc725.js dependencies
- `pnpm-lock.yaml` - Updated lockfile

## Decisions Made

- Used type assertions (`null as unknown as undefined`) for entity FK fields where TypeORM model types don't include `| null` in their TypeScript declarations but the compiled JS sets `null` at runtime — maintains identical behavior to V1
- Cast `dataKey`/`dataValue` parameters to `` `0x${string}` `` template literals for viem's `hexToBytes` which requires hex-prefixed types
- Mocked `mergeEntitiesFromBatchAndDb` at module level via `vi.mock()` to isolate handler logic from database dependencies in tests

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added @lukso/lsp6-contracts and @erc725/erc725.js dependencies**

- **Found during:** Task 1 (TypeScript port)
- **Issue:** These packages were not in indexer-v2's package.json but are required imports in the handler. The compiled JS works because they're hoisted from sibling packages, but TypeScript source compilation and vitest need them as explicit dependencies.
- **Fix:** Added both packages to indexer-v2/package.json dependencies
- **Files modified:** packages/indexer-v2/package.json, pnpm-lock.yaml
- **Verification:** pnpm install succeeded, all imports resolve
- **Committed in:** 93704ae (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required for TypeScript compilation. No scope creep.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- LSP6Controllers handler verified as correct TypeScript source with passing unit tests
- Ready for plan 02-04 (structured logging replacement)
- All 3 handler-related plans in Phase 2 now complete (follower, LSP6, logging module)

---

## Self-Check: PASSED

_Phase: 02-new-handlers-structured-logging_
_Completed: 2026-02-06_
