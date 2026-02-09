---
phase: 03-metadata-fetch-handlers
plan: 01
subsystem: indexer-core
tags: [metadata, fetchresult, type-guards, typeorm, worker-pool, retry]

# Dependency graph
requires:
  - phase: 01-handler-migration
    provides: EntityHandler interface and BatchContext with queueClear
  - phase: 02-new-handlers-structured-logging
    provides: Structured logging, handler test patterns
provides:
  - Extended FetchResult type with errorCode/errorStatus for cross-batch retry
  - Three V1 type guards (isVerification, isFileImage, isFileAsset) in V2 utils
  - Shared handleMetadataFetch() utility with empty value + head-only fetch paths
  - queryUnfetchedEntities() with 3-tier priority DB queries matching V1
affects: [03-02, 03-03, 03-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'MetadataFetchConfig generic pattern for handler-specific fetch configuration'
    - '3-tier priority DB backlog drain (unfetched → retryable HTTP → retryable network)'
    - 'Empty value path before isHead check pattern'

key-files:
  created:
    - packages/indexer-v2/src/utils/metadataFetch.ts
  modified:
    - packages/indexer-v2/src/core/types/metadata.ts
    - packages/indexer-v2/src/core/metadataWorkerPool.ts
    - packages/indexer-v2/src/utils/index.ts

key-decisions:
  - 'Type-only imports (import type) for @lukso/lsp2-contracts and @lukso/lsp3-contracts to avoid runtime dependency'
  - 'Type assertion for discriminated union narrowing due to TS strictNullChecks being off'
  - 'EntityConstructor used for entity updates (new config.entityClass({...})) to preserve TypeORM decorators'

patterns-established:
  - 'MetadataFetchConfig<TEntity>: generic config pattern for handler-specific fetch logic'
  - 'handleMetadataFetch(): two-path utility (empty value every batch, head-only fetch)'
  - 'queryUnfetchedEntities(): reusable 3-tier priority DB query'

# Metrics
duration: 7min
completed: 2026-02-09
---

# Phase 3 Plan 1: Foundation Layer for Metadata Fetch Handlers Summary

**Extended FetchResult with errorCode/errorStatus, ported V1 type guards, and created shared handleMetadataFetch() utility with 3-tier priority DB backlog drain**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-09T06:42:28Z
- **Completed:** 2026-02-09T06:49:27Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Extended FetchResult type to preserve errorCode/errorStatus from worker threads, fixing cross-batch retry prioritization
- Ported three V1 type guards (isVerification, isFileImage, isFileAsset) to V2 utils with type-safe `unknown` parameter signatures
- Created shared `handleMetadataFetch()` utility encapsulating empty value clearing, head-only DB backlog drain, worker pool interaction, and error tracking
- Implemented `queryUnfetchedEntities()` with exact V1 3-tier priority: unfetched → retryable HTTP → retryable network errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend FetchResult type and fix MetadataWorkerPool passthrough** - `58025d1` (feat)
2. **Task 2: Port V1 type guards and create shared metadata fetch utility** - `829d4b7` (feat)

## Files Created/Modified

- `packages/indexer-v2/src/core/types/metadata.ts` - Added errorCode/errorStatus to FetchResult interface
- `packages/indexer-v2/src/core/metadataWorkerPool.ts` - Fixed fetchBatch() failure path to pass error details through
- `packages/indexer-v2/src/utils/index.ts` - Added isVerification, isFileAsset, isFileImage type guards
- `packages/indexer-v2/src/utils/metadataFetch.ts` - NEW: Shared fetch utility with handleMetadataFetch() and queryUnfetchedEntities()

## Decisions Made

- Used `import type` for `@lukso/lsp2-contracts` and `@lukso/lsp3-contracts` imports — these are type-only dependencies (no runtime code needed), and `import type` ensures they're erased during compilation
- Used explicit type assertion `(parseResult as { success: false; fetchErrorMessage: string })` instead of relying on discriminated union narrowing — the V2 tsconfig doesn't enable `strictNullChecks`, which prevents TypeScript from properly narrowing the union in `if (!parseResult.success)` branches
- Used `new config.entityClass({...entity, ...updates})` pattern for entity updates instead of plain object spread — this preserves TypeORM decorator metadata on the entity instances, ensuring proper upsert behavior in the pipeline

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Used `import type` instead of `import` for @lukso type imports**

- **Found during:** Task 2 (Port V1 type guards)
- **Issue:** Regular imports failed to resolve with the V2 tsconfig's `Node10` module resolution. The `@lukso/lsp2-contracts` and `@lukso/lsp3-contracts` packages use the `exports` field which `Node10` doesn't fully support for value imports
- **Fix:** Changed to `import type` which resolves via the `typings` field in package.json
- **Files modified:** packages/indexer-v2/src/utils/index.ts
- **Verification:** TypeScript build succeeds
- **Committed in:** 829d4b7

**2. [Rule 3 - Blocking] Type assertion for discriminated union narrowing**

- **Found during:** Task 2 (Create shared metadata fetch utility)
- **Issue:** TypeScript 5.9 with `module: "commonjs"` and no `strictNullChecks` failed to narrow the discriminated union `{ success: true; ... } | { success: false; fetchErrorMessage: string }` in else branches
- **Fix:** Added explicit type assertion `(parseResult as { success: false; fetchErrorMessage: string }).fetchErrorMessage` in the failure branch
- **Files modified:** packages/indexer-v2/src/utils/metadataFetch.ts
- **Verification:** TypeScript build succeeds
- **Committed in:** 829d4b7

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary to unblock TypeScript compilation. No scope creep.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Foundation layer complete: FetchResult type gap fixed, type guards ported, shared fetch utility created
- Plans 02 and 03 can implement handlers by providing handler-specific MetadataFetchConfig objects with parsing functions
- No need to duplicate DB query logic, error tracking, or worker pool interaction in individual handlers

## Self-Check: PASSED

---

_Phase: 03-metadata-fetch-handlers_
_Completed: 2026-02-09_
