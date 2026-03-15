---
phase: 23-lsp29-lsp31-decoding-update
plan: 02
subsystem: indexer
tags: [lsp29, encrypted-assets, handlers, type-guards, decoding, isLsp29Asset]

# Dependency graph
requires:
  - phase: 23-lsp29-lsp31-decoding-update
    provides: "@chillwhales/lsp29 package, redesigned schema entities, entity registry"
provides:
  - "LSP29 data key handler using @chillwhales/lsp29 package imports"
  - "LSP29 fetch handler using isLsp29Asset() type guard for v2.0.0 validation"
  - "v2.0.0 sub-entity creation: provider-first encryption, params, per-backend chunks"
  - "Cleaned utils/index.ts free of LSP29 type guards"
affects: [23-03, lsp29-handlers, indexer-build]

# Tech tracking
tech-stack:
  added: []
  patterns: ["isLsp29Asset() schema validation replaces hand-rolled type guards", "EncryptionParams entity replaces AccessControlCondition"]

key-files:
  created: []
  modified:
    - "packages/indexer/src/handlers/lsp29EncryptedAsset.handler.ts"
    - "packages/indexer/src/handlers/lsp29EncryptedAssetFetch.handler.ts"
    - "packages/indexer/src/utils/index.ts"
    - "packages/indexer/src/constants/index.ts"
    - "packages/indexer/src/core/entityRegistry.ts"
    - "packages/indexer/src/handlers/__tests__/lsp29EncryptedAssetFetch.handler.test.ts"

key-decisions:
  - "Used isLsp29Asset() type guard for schema validation instead of decodeLsp29Metadata() — type guard returns boolean for graceful error handling vs throwing"
  - "Kept isFileImage() guard for images — shared utility used by LSP3/LSP4 domains, not LSP29-specific"

patterns-established:
  - "Package-based validation: use isLsp29Asset() for structural validation before accessing typed fields"
  - "EncryptionParams 1:1 with Encryption: params entity uses FK to encryption, not to main asset"

requirements-completed: [LSP29-04, LSP29-05, LSP29-06]

# Metrics
duration: 6min
completed: 2026-03-15
---

# Phase 23 Plan 02: Handler Rewrite Summary

**Rewrote LSP29 handlers to use @chillwhales/lsp29 package imports (isLsp29Asset type guard + data keys) and removed all hand-rolled LSP29 type guards from utils**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-15T10:04:23Z
- **Completed:** 2026-03-15T10:10:32Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Data key handler now imports LSP29DataKeys from @chillwhales/lsp29 instead of deleted local constants
- Fetch handler uses isLsp29Asset() for v2.0.0 schema validation, creating typed sub-entities directly
- Replaced LSP29AccessControlCondition with LSP29EncryptedAssetEncryptionParams (1:1 with Encryption)
- Removed ~210 lines of hand-rolled LSP29 type guards and extractors from utils/index.ts
- Updated test suite to match v2.0.0 schema structure (fixture, assertions, entity references)
- Indexer builds cleanly with zero TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite lsp29EncryptedAsset.handler.ts to use package data keys** - `ace451c` (feat)
2. **Task 2: Rewrite lsp29EncryptedAssetFetch.handler.ts and remove old utils** - `2ef10d7` (feat)

## Files Created/Modified
- `packages/indexer/src/handlers/lsp29EncryptedAsset.handler.ts` - Import path changed from local constants to @chillwhales/lsp29
- `packages/indexer/src/handlers/lsp29EncryptedAssetFetch.handler.ts` - Full rewrite using isLsp29Asset() and v2.0.0 entity creation
- `packages/indexer/src/utils/index.ts` - Removed ~210 lines of LSP29 type guards and extractors
- `packages/indexer/src/constants/index.ts` - Removed stale re-export of deleted ./lsp29 module
- `packages/indexer/src/core/entityRegistry.ts` - Added missing LSP29EncryptedAssetEncryptionParams import
- `packages/indexer/src/handlers/__tests__/lsp29EncryptedAssetFetch.handler.test.ts` - Updated to v2.0.0 schema structure

## Decisions Made
- Used `isLsp29Asset()` type guard instead of `decodeLsp29Metadata()` for schema validation — type guard returns boolean for graceful error handling, while decode throws
- Kept `isFileImage()` guard for image filtering — it's a shared utility used by LSP3/LSP4 domains, not LSP29-specific

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing LSP29EncryptedAssetEncryptionParams import in entityRegistry.ts**
- **Found during:** Task 2 (build verification)
- **Issue:** Plan 01 added LSP29EncryptedAssetEncryptionParams to the EntityRegistry interface and ENTITY_CONSTRUCTORS map but missed adding it to the import statement
- **Fix:** Added missing import from @chillwhales/typeorm
- **Files modified:** packages/indexer/src/core/entityRegistry.ts
- **Verification:** Build succeeds
- **Committed in:** 2ef10d7

**2. [Rule 3 - Blocking] Stale re-export of deleted ./lsp29 module in constants/index.ts**
- **Found during:** Task 2 (build verification)
- **Issue:** Plan 01 deleted constants/lsp29.ts but left the `export * from './lsp29'` re-export in constants/index.ts
- **Fix:** Removed the stale re-export line
- **Files modified:** packages/indexer/src/constants/index.ts
- **Verification:** Build succeeds
- **Committed in:** 2ef10d7

**3. [Rule 3 - Blocking] Test file referencing old v1.0 schema entities and fields**
- **Found during:** Task 2 (build verification)
- **Issue:** Test file imported LSP29AccessControlCondition (deleted entity), used old encryption fields (ciphertext, dataToEncryptHash, etc.), old chunks fields (cids), and createdAt (removed field)
- **Fix:** Rewrote test fixture to v2.0.0 schema, updated all assertions to match new entity structure
- **Files modified:** packages/indexer/src/handlers/__tests__/lsp29EncryptedAssetFetch.handler.test.ts
- **Verification:** Build succeeds
- **Committed in:** 2ef10d7

---

**Total deviations:** 3 auto-fixed (3 blocking — all pre-existing issues from Plan 01 schema changes)
**Impact on plan:** All fixes necessary for build to succeed. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Both LSP29 handlers fully migrated to @chillwhales/lsp29 package
- Ready for Plan 03 (if exists) or phase completion

## Self-Check: PASSED

All files verified on disk, all commits found in git log.

---
*Phase: 23-lsp29-lsp31-decoding-update*
*Completed: 2026-03-15*
