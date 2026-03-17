---
id: S03
parent: M001
milestone: M001
provides:
  - Extended FetchResult type with errorCode/errorStatus for cross-batch retry
  - Three V1 type guards (isVerification, isFileImage, isFileAsset) in V2 utils
  - Shared handleMetadataFetch() utility with empty value + head-only fetch paths
  - queryUnfetchedEntities() with 3-tier priority DB queries matching V1
  - LSP3 profile metadata fetch handler creating 7 sub-entity types
  - LSP29 encrypted asset metadata fetch handler creating 7 sub-entity types
  - LSP4 digital asset metadata fetch handler with 10 sub-entity types
  - Score and Rank extraction from attributes matching V1 logic
  - Attribute-level score (parseInt) and rarity (parseFloat) field parsing
  - Unit test coverage for all three metadata fetch handlers (58 tests)
  - Verification of META-01 through META-05 requirements via automated tests
  - Regression protection for sub-entity creation, head-only gating, and error tracking
requires: []
affects: []
key_files: []
key_decisions:
  - 'Type-only imports (import type) for @lukso/lsp2-contracts and @lukso/lsp3-contracts to avoid runtime dependency'
  - 'Type assertion for discriminated union narrowing due to TS strictNullChecks being off'
  - 'EntityConstructor used for entity updates (new config.entityClass({...})) to preserve TypeORM decorators'
  - 'LSP29 AccessControlCondition not in SubEntityDescriptors — cleared via encryption cascade'
  - 'LSP29 entityUpdates returns version, contentId, revision, createdAt for parent entity'
  - 'LSP3 profile images treated as flat arrays (matching V1 structure, unlike LSP4 nested arrays)'
  - 'Icons mapped without isFileImage filter to match V1 behavior exactly'
  - 'Category entity always created even when value is undefined'
  - 'Score uses parseInt, Rank uses parseInt, attribute.rarity uses parseFloat'
  - 'Test through shared utility (integration-style) rather than mocking handleMetadataFetch'
  - 'Mock store.find and workerPool.fetchBatch as the external boundaries'
  - 'Verify entity creation by count and field values rather than ID matching'
  - 'Type assertions for entity FK null vs undefined (matching 02-03 pattern)'
patterns_established:
  - 'MetadataFetchConfig<TEntity>: generic config pattern for handler-specific fetch logic'
  - 'handleMetadataFetch(): two-path utility (empty value every batch, head-only fetch)'
  - 'queryUnfetchedEntities(): reusable 3-tier priority DB query'
  - 'Metadata fetch handler pattern: config object + parseAndAddSubEntities callback'
  - 'Parent FK reference via new Entity({ id }) for sub-entity construction'
  - 'LSP4 fetch handler pattern: complex parsing with 10 sub-entity types via shared utility'
  - 'Metadata fetch handler test pattern: seed entity bag → mock store.find → mock fetchBatch → call handle() → verify addEntity/queueClear calls'
observability_surfaces: []
drill_down_paths: []
duration: 9min
verification_result: passed
completed_at: 2026-02-09
blocker_discovered: false
---
# S03: Metadata Fetch Handlers

**# Phase 3 Plan 1: Foundation Layer for Metadata Fetch Handlers Summary**

## What Happened

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

# Phase 3 Plan 02: LSP3 + LSP29 Metadata Fetch Handlers Summary

**LSP3 profile and LSP29 encrypted asset metadata fetch handlers with 14 total sub-entity types using shared handleMetadataFetch utility**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-09T06:53:09Z
- **Completed:** 2026-02-09T06:57:57Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- LSP3 profile fetch handler creates 7 sub-entity types (Name, Description, Tag, Link, Asset, Image, BackgroundImage)
- LSP29 encrypted asset fetch handler creates 7 sub-entity types (Title, Description, File, Encryption, AccessControlCondition, Chunks, Image)
- Both handlers use shared handleMetadataFetch utility for empty value clearing and head-only gating
- LSP29 FK chain correctly implemented: AccessControlCondition → Encryption → EncryptedAsset

## Task Commits

Each task was committed atomically:

1. **Task 1: LSP3 Profile fetch handler with 7 sub-entity types** - `ce9e865` (feat)
2. **Task 2: LSP29 Encrypted Asset fetch handler with 7 sub-entity types** - `ba1a9aa` (feat)

## Files Created/Modified

- `packages/indexer-v2/src/handlers/lsp3ProfileFetch.handler.ts` — LSP3 profile metadata fetch handler with 7 sub-entity parsing from JSON
- `packages/indexer-v2/src/handlers/lsp29EncryptedAssetFetch.handler.ts` — LSP29 encrypted asset metadata fetch handler with 7 sub-entity parsing, nested FK chain, BigInt conversions

## Decisions Made

- **LSP29 AccessControlCondition excluded from SubEntityDescriptors** — its FK points to Encryption not Asset; cleared via cascade when Encryption entities are removed
- **LSP29 returns entityUpdates** — version, contentId, revision, createdAt are stored on the parent LSP29EncryptedAsset entity after successful parse (matching V1 behavior)
- **LSP3 profile images as flat arrays** — unlike LSP4 which uses nested arrays, LSP3 profileImage and backgroundImage are simple flat arrays matching the LSP3 JSON schema

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for 03-03-PLAN.md (LSP4 metadata fetch handler)
- Both handlers follow the established fetch handler pattern for consistency
- No blockers or concerns

---

## Self-Check: PASSED

---

_Phase: 03-metadata-fetch-handlers_
_Completed: 2026-02-09_

# Phase 3 Plan 3: LSP4 Metadata Fetch Handler Summary

**LSP4 digital asset metadata fetch handler creating 10 sub-entity types (Name, Description, Category, Link, Image, Icon, Asset, Attribute, Score, Rank) with V1-matching attribute score/rarity parsing**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-09T06:53:38Z
- **Completed:** 2026-02-09T06:56:18Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created LSP4 metadata fetch handler with all 10 sub-entity types matching V1 extraction logic
- Score derived from attributes where key === 'Score' and value is numeric (parseInt)
- Rank derived from attributes where key === 'Rank' and value is numeric (parseInt)
- Attribute entities include score (parseInt) and rarity (parseFloat) fields from V1 parsing
- Images use nested Array<Array<ImageMetadata>> pattern with imageIndex
- Icons mapped without isFileImage filter (V1 compatibility)
- Category always created even if value is undefined
- All 10 types in subEntityDescriptors for queueClear

## Task Commits

Each task was committed atomically:

1. **Task 1: LSP4 Metadata fetch handler with 8+2 sub-entity types** - `66390b0` (feat)

## Files Created/Modified

- `packages/indexer-v2/src/handlers/lsp4MetadataFetch.handler.ts` - NEW: LSP4 digital asset metadata fetch handler with 10 sub-entity types

## Decisions Made

- Icons mapped without `isFileImage` filter — V1 maps ALL icon array items directly without checking url/width/height, so V2 matches this exactly
- Category entity always created even when `category` is undefined — V1 behavior
- Attribute `type` field always converted via `type?.toString()` — JSON may contain string or number

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- LSP4 fetch handler complete, ready for Plan 04 (LSP29 Encrypted Asset metadata fetch handler)
- All three standard metadata types (LSP3, LSP4, LSP29) will share the same MetadataFetchConfig pattern from Plan 01
- No blockers

## Self-Check: PASSED

---

_Phase: 03-metadata-fetch-handlers_
_Completed: 2026-02-09_

# Phase 3 Plan 4: Unit Tests for Metadata Fetch Handlers Summary

**58 unit tests across LSP3 (17), LSP29 (15), and LSP4 (26) verifying sub-entity creation, head-only gating, empty value clearing, and error tracking**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-02-09T07:00:58Z
- **Completed:** 2026-02-09T07:09:42Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments

- Created 17 unit tests for LSP3ProfileFetch handler covering all 7 sub-entity types (Name, Description, Tags, Links, Assets, ProfileImages, BackgroundImages), empty value clearing, head-only gating, and error tracking
- Created 15 unit tests for LSP29EncryptedAssetFetch handler covering all 7 sub-entity types (Title, Description, File, Encryption, AccessControlCondition, Chunks, Images), BigInt conversions, FK chain verification, entityUpdates, and error tracking
- Created 26 unit tests for LSP4MetadataFetch handler covering all 10 sub-entity types (Name, Description, Category, Link, Image, Icon, Asset, Attribute, Score, Rank), Score/Rank extraction, attribute score/rarity field parsing, Category always-created behavior, and Icon no-filter behavior
- All 58 new tests pass; build compiles cleanly

## Task Commits

Each task was committed atomically:

1. **Task 1: Unit tests for LSP3 and LSP29 fetch handlers** - `66e6c11` (test)
2. **Task 2: Unit tests for LSP4 fetch handler** - `2652719` (test)

## Files Created/Modified

- `packages/indexer-v2/src/handlers/__tests__/lsp3ProfileFetch.handler.test.ts` - NEW: 17 tests for LSP3 profile metadata fetch handler
- `packages/indexer-v2/src/handlers/__tests__/lsp29EncryptedAssetFetch.handler.test.ts` - NEW: 15 tests for LSP29 encrypted asset metadata fetch handler
- `packages/indexer-v2/src/handlers/__tests__/lsp4MetadataFetch.handler.test.ts` - NEW: 26 tests for LSP4 metadata fetch handler including Score/Rank

## Decisions Made

- Tested end-to-end through the shared `handleMetadataFetch()` utility rather than mocking it — validates the full flow from handler config → utility → worker pool → parsing → entity creation
- Mocked only external boundaries (`store.find` for DB queries, `workerPool.fetchBatch` for IPFS/HTTP fetches) — everything else runs as real code
- Verified entity creation by count and field values rather than asserting specific UUIDs
- Used type assertions for entity FK fields matching the pattern established in 02-03

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- Pre-existing test failures in `pipeline.test.ts` (18 tests, `baseLogger.child` mock issue) and `batchContext.test.ts` (1 test) — NOT caused by our changes, existed before Phase 3
- Pre-existing V1 indexer build failure (`@chillwhales/indexer` package type errors) — legacy package, not our concern

## User Setup Required

None - no external service configuration required.

## Requirements Verified

| ID      | Requirement                                         | Test Coverage                                                                    |
| ------- | --------------------------------------------------- | -------------------------------------------------------------------------------- |
| META-01 | LSP3 profile metadata sub-entity creation           | 7 sub-entity type tests in lsp3ProfileFetch.handler.test.ts                      |
| META-02 | LSP4 digital asset sub-entity creation + Score/Rank | 10 sub-entity type tests + Score/Rank in lsp4MetadataFetch.handler.test.ts       |
| META-03 | LSP29 encrypted asset sub-entity creation           | 7 sub-entity type tests in lsp29EncryptedAssetFetch.handler.test.ts              |
| META-04 | Head-only gating (isHead === true)                  | Head-gating tests in all 3 test files verify no fetchBatch when isHead=false     |
| META-05 | Error tracking with retry                           | Error tracking tests in all 3 test files verify errorCode/errorStatus/retryCount |

## Next Phase Readiness

- Phase 3 (Metadata Fetch Handlers) is now COMPLETE — all 4 plans executed, all 5 requirements verified
- Phase 4 (Integration & Wiring) can begin: all EventPlugins and EntityHandlers exist and are tested
- No blockers for Phase 4

## Self-Check: PASSED

---

_Phase: 03-metadata-fetch-handlers_
_Completed: 2026-02-09_
