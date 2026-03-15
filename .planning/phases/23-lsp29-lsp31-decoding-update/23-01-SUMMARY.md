---
phase: 23-lsp29-lsp31-decoding-update
plan: 01
subsystem: indexer
tags: [lsp29, lsp31, encrypted-assets, typeorm, codegen, schema]

# Dependency graph
requires: []
provides:
  - "@chillwhales/lsp29 and @chillwhales/lsp31 packages installed"
  - "Redesigned LSP29 schema entities for v2.0.0 spec"
  - "LSP29EncryptedAssetEncryptionParams entity replacing LSP29AccessControlCondition"
  - "Per-backend chunk storage in LSP29EncryptedAssetChunks"
  - "Updated entity registry with new type mappings"
affects: [23-02, 23-03, lsp29-handlers, lsp29-fetch]

# Tech tracking
tech-stack:
  added: ["@chillwhales/lsp29@0.1.3", "@chillwhales/lsp31@0.1.2"]
  patterns: ["provider-first encryption model", "method-discriminated params entity", "per-backend chunk storage as JSON strings"]

key-files:
  created: []
  modified:
    - "packages/indexer/package.json"
    - "packages/typeorm/schema.graphql"
    - "packages/indexer/src/core/entityRegistry.ts"

key-decisions:
  - "Used @chillwhales/lsp31@0.1.2 instead of @0.1.0 (plan version not published, latest used)"
  - "Stored per-backend chunk references as JSON strings (ipfsChunks, lumeraChunks, s3Chunks, arweaveChunks) rather than separate entities"
  - "Encryption params stored as flat discriminated entity with nullable method-specific fields"

patterns-established:
  - "Provider-first encryption: LSP29EncryptedAssetEncryption has provider+method, params derived via 1:1 relation"
  - "Per-backend chunks: JSON string fields per storage backend instead of array columns or child entities"

requirements-completed: [LSP29-01, LSP29-02, LSP29-03]

# Metrics
duration: 4min
completed: 2026-03-15
---

# Phase 23 Plan 01: Schema Foundation Summary

**Installed @chillwhales/lsp29 + lsp31, redesigned schema.graphql entities for v2.0.0 encrypted asset spec with provider-first encryption model and per-backend chunk storage**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-15T09:57:38Z
- **Completed:** 2026-03-15T10:01:40Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Installed @chillwhales/lsp29@0.1.3 and @chillwhales/lsp31@0.1.2, deleted hand-rolled constants file
- Redesigned LSP29EncryptedAssetEncryption with provider-first model (provider, method, condition, encryptedKey)
- Replaced LSP29AccessControlCondition with LSP29EncryptedAssetEncryptionParams (method-discriminated flat entity)
- Restructured LSP29EncryptedAssetChunks for per-backend storage (ipfs, lumera, s3, arweave)
- Removed createdAt field from LSP29EncryptedAsset (not in v2.0.0 spec)
- Updated entity registry with new entity type mappings, TypeORM codegen verified

## Task Commits

Each task was committed atomically:

1. **Task 1: Install packages and delete constants** - `9a717fd` (chore)
2. **Task 2: Redesign schema entities and update registry** - `24f2f1f` (feat)

## Files Created/Modified
- `packages/indexer/package.json` - Added @chillwhales/lsp29 and @chillwhales/lsp31 dependencies
- `packages/indexer/src/constants/lsp29.ts` - DELETED (replaced by package exports)
- `packages/typeorm/schema.graphql` - Redesigned LSP29 entities (encryption, params, chunks)
- `packages/indexer/src/core/entityRegistry.ts` - Replaced AccessControlCondition with EncryptionParams

## Decisions Made
- Used @chillwhales/lsp31@0.1.2 instead of @0.1.0 specified in plan (0.1.0 not published, latest available used) — Rule 3 auto-fix
- Kept per-backend chunk references as JSON strings for simplicity (ipfsChunks, lumeraChunks, s3Chunks, arweaveChunks)
- Encryption params stored as flat discriminated entity with nullable method-specific columns

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] @chillwhales/lsp31@0.1.0 not published**
- **Found during:** Task 1 (package installation)
- **Issue:** Plan specified @chillwhales/lsp31@0.1.0 but this version does not exist on npm registry; latest is 0.1.2
- **Fix:** Installed @chillwhales/lsp31@0.1.2 (latest published version)
- **Files modified:** packages/indexer/package.json, pnpm-lock.yaml
- **Verification:** pnpm install succeeded, package in dependencies
- **Committed in:** 9a717fd

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor version difference (0.1.0 → 0.1.2), no functional impact.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Schema entities in place for handler rewrite in Plan 02
- Entity registry updated, TypeORM codegen verified
- Handler imports will be broken until Plan 02 rewrites them (expected per plan notes)

## Self-Check: PASSED

All files verified on disk, all commits found in git log.

---
*Phase: 23-lsp29-lsp31-decoding-update*
*Completed: 2026-03-15*
