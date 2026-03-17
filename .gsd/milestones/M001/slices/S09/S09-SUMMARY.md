---
id: S09
parent: M001
milestone: M001
provides:
  - resolveEntity<T>() helper for single-entity batch→DB→null lookup
  - resolveEntities<T>() helper for bulk entity batch+DB merge
  - Foundation for unified entity upsert pattern (Plans 02-04 will migrate all handlers)
requires: []
affects: []
key_files: []
key_decisions:
  - 'resolveEntities has identical semantics to mergeEntitiesFromBatchAndDb (preserves all batch entities, not just requested IDs)'
  - 'resolveEntity is new single-entity variant for handlers that only need one lookup'
  - 'Deleted old function immediately to force migration via compile errors'
patterns_established:
  - 'Pattern: resolveEntity → ...existing spread → override fields → addEntity'
  - 'Visual signature: When you see ...existing in constructor, handler is safe'
observability_surfaces: []
drill_down_paths: []
duration: 2min
verification_result: passed
completed_at: 2026-02-13
blocker_discovered: false
---
# S09: Entity Upsert Pattern Standardization

**# Phase 05.3 Plan 01: Entity Upsert Pattern Standardization Summary**

## What Happened

# Phase 05.3 Plan 01: Entity Upsert Pattern Standardization Summary

**Created `resolveEntity<T>()` and `resolveEntities<T>()` helpers with comprehensive unit tests (12/12 passing), deleted `mergeEntitiesFromBatchAndDb` to force handler migration in Plans 02-04**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-13T18:12:41Z
- **Completed:** 2026-02-13T18:15:29Z
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments

- Created `resolveEntity<T>()` single-entity helper (batch → DB → null lookup)
- Created `resolveEntities<T>()` bulk helper (batch + DB merge, identical semantics to old function)
- Deleted `mergeEntitiesFromBatchAndDb` from handlerHelpers.ts
- Wrote 12 comprehensive unit tests covering both helpers, all edge cases
- 6 handlers now show expected compile errors (will be fixed in Plans 02-04)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create resolveEntity and resolveEntities helpers + delete mergeEntitiesFromBatchAndDb** - `fe278a9` (feat)
2. **Task 2: Unit tests for resolveEntity and resolveEntities** - `f54c589` (test)

## Files Created/Modified

- `packages/indexer-v2/src/core/handlerHelpers.ts` - Replaced 78 lines with 109 lines: new helpers, deleted old function
- `packages/indexer-v2/src/core/__tests__/handlerHelpers.test.ts` - 335 lines of comprehensive unit tests

## Decisions Made

**resolveEntities semantics match old function exactly:**

- Rationale: Preserves ALL batch entities (not just requested IDs) to support intra-batch updates. This is critical for handlers that process multiple events per batch where one event's entity creation affects another event's lookup.

**Deleted old function immediately (before Plans 02-04):**

- Rationale: Forces compile errors in 6 files (5 handlers + 1 test), making it impossible to forget migration. Clear signal that the old pattern is gone.

**resolveEntity as new single-entity variant:**

- Rationale: Many handlers only need one entity lookup. Providing both single and bulk variants makes the API complete and handlers clearer (don't need to create `[id]` arrays for single lookups).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness

- ✓ Helpers created and tested (12/12 tests passing)
- ✓ Old function deleted (6 expected compile errors in handlers)
- ✓ Ready for Plan 02 (Tier 1 bugfix handlers: chillClaimed, orbsClaimed, lsp5ReceivedAssets, orbLevel, orbFaction)

**Expected state for Plans 02-04:**

- These plans will migrate handlers from `mergeEntitiesFromBatchAndDb` → `resolveEntities`
- Compile errors will be resolved one plan at a time
- Full handler migration complete after Plan 04

---

_Phase: 05.3-entity-upsert-pattern-standardization_
_Completed: 2026-02-13_

## Self-Check: PASSED
