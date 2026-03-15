---
phase: 23-lsp29-lsp31-decoding-update
plan: 03
subsystem: consumer-packages
tags: [lsp29, encrypted-assets, zod, graphql, parsers, types, react, next]

# Dependency graph
requires:
  - phase: 23-lsp29-lsp31-decoding-update
    provides: "Redesigned schema entities, handler rewrite with @chillwhales/lsp29"
provides:
  - "v2.0.0 Zod schemas for encrypted assets (EncryptedAssetEncryptionParamsSchema)"
  - "Updated GraphQL documents with provider-first encryption and per-backend chunks"
  - "Node parsers mapping new Hasura fields (parseEncryptionParams, updated parseChunks)"
  - "Service include vars for new field structure"
  - "Full monorepo build passing including test app"
affects: [consumer-api, deployment, documentation]

# Tech tracking
tech-stack:
  added: []
  patterns: ["provider-first encryption in consumer types", "per-backend chunk JSON strings in consumer types"]

key-files:
  created: []
  modified:
    - "packages/types/src/encrypted-assets.ts"
    - "packages/node/src/documents/encrypted-assets.ts"
    - "packages/node/src/parsers/encrypted-assets.ts"
    - "packages/node/src/services/encrypted-assets.ts"
    - "packages/node/schema.graphql"
    - "packages/node/src/graphql/gql.ts"
    - "packages/node/src/graphql/graphql.ts"
    - "apps/test/src/components/encrypted-asset-card.tsx"

key-decisions:
  - "Updated node/schema.graphql locally to add new Hasura types for codegen validation (will be overwritten on next schema:dump)"
  - "Fixed test app encrypted-asset-card.tsx as blocking deviation — it referenced old AccessControlCondition types"

patterns-established:
  - "EncryptionParams as flat nullable fields instead of array of condition objects"
  - "Per-backend chunk references as nullable JSON strings (ipfsChunks, lumeraChunks, s3Chunks, arweaveChunks)"

requirements-completed: [LSP29-07, LSP29-08, LSP29-09, LSP29-10]

# Metrics
duration: 10min
completed: 2026-03-15
---

# Phase 23 Plan 03: Consumer Package Rewrite Summary

**Rewrote all consumer packages (types, node, react, next) for v2.0.0 encrypted asset structure — provider-first encryption, method-discriminated params, per-backend chunk storage**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-15T10:14:20Z
- **Completed:** 2026-03-15T10:25:17Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- Replaced AccessControlConditionSchema with EncryptedAssetEncryptionParamsSchema across types package
- Updated EncryptedAssetEncryptionSchema to provider-first model (provider, method, condition, encryptedKey, params)
- Updated EncryptedAssetChunksSchema for per-backend storage (ipfsChunks, lumeraChunks, s3Chunks, arweaveChunks)
- Rewrote GraphQL documents (query + subscription) with new @include directives for v2.0.0 fields
- Added parseEncryptionParams parser, removed parseAccessControlCondition
- Updated service include variable builders for new encryption/chunks field structure
- Full monorepo build passes (all 9 packages + test app) with zero TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite types package encrypted-assets.ts** - `733c057` (feat)
2. **Task 2: Rewrite node package documents, parsers, service, and keys** - `82f8bdb` (feat)
3. **Task 3: Update react hooks and next server actions + full build verification** - `6d26800` (feat)

## Files Created/Modified
- `packages/types/src/encrypted-assets.ts` - v2.0.0 Zod schemas, include schemas, field maps, result types
- `packages/node/src/documents/encrypted-assets.ts` - GraphQL documents with new encryption/chunks fields
- `packages/node/src/parsers/encrypted-assets.ts` - parseEncryptionParams + updated parseEncryption/parseChunks
- `packages/node/src/services/encrypted-assets.ts` - Updated include variable builders
- `packages/node/schema.graphql` - Added lsp29_encrypted_asset_encryption_params type, updated encryption/chunks types
- `packages/node/src/graphql/gql.ts` - Regenerated codegen
- `packages/node/src/graphql/graphql.ts` - Regenerated codegen
- `apps/test/src/components/encrypted-asset-card.tsx` - Updated UI for v2.0.0 encryption/chunks structure

## Decisions Made
- Updated node/schema.graphql locally to add new Hasura types for codegen validation — this file is auto-generated from Hasura introspection and will be overwritten on next `pnpm schema:dump` after DB migration
- Fixed test app encrypted-asset-card.tsx as blocking deviation — component referenced old AccessControlCondition types

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] node/schema.graphql needed updates for codegen validation**
- **Found during:** Task 2 (codegen step)
- **Issue:** GraphQL codegen validates documents against local schema.graphql (Hasura introspection dump), which still had old field definitions
- **Fix:** Updated lsp29_encrypted_asset_encryption type (added provider, condition, encrypted_key, params), added lsp29_encrypted_asset_encryption_params type, updated lsp29_encrypted_asset_chunks type (added per-backend fields), updated bool_exp
- **Files modified:** packages/node/schema.graphql
- **Verification:** `pnpm --filter=@lsp-indexer/node codegen` succeeded
- **Committed in:** 82f8bdb

**2. [Rule 3 - Blocking] Missing EncryptedAssetEncryptionParams import in parser**
- **Found during:** Task 2 (node build)
- **Issue:** Initial edit replaced AccessControlCondition import but forgot to add EncryptedAssetEncryptionParams to import list
- **Fix:** Added EncryptedAssetEncryptionParams to type imports
- **Files modified:** packages/node/src/parsers/encrypted-assets.ts
- **Verification:** `pnpm --filter=@lsp-indexer/node build` succeeded
- **Committed in:** 82f8bdb

**3. [Rule 3 - Blocking] Test app encrypted-asset-card.tsx referenced old types**
- **Found during:** Task 3 (full monorepo build)
- **Issue:** apps/test component used `encryption.accessControlConditions`, `encryption.ciphertext`, `encryption.dataToEncryptHash`, `encryption.decryptionCode`, and `chunks.cids` — all removed in v2.0.0
- **Fix:** Rewrote EncryptionSection to use provider/method/condition/encryptedKey/params, rewrote ChunksSection for per-backend fields
- **Files modified:** apps/test/src/components/encrypted-asset-card.tsx
- **Verification:** `pnpm build` succeeded (all packages + test app)
- **Committed in:** 6d26800

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** All fixes necessary for compilation. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All consumer packages updated for v2.0.0 encrypted asset structure
- Phase 23 (LSP29/LSP31 Decoding Update) complete — all 3 plans executed
- Ready for phase transition or deployment

## Self-Check: PASSED

All files verified on disk, all commits found in git log.

---
*Phase: 23-lsp29-lsp31-decoding-update*
*Completed: 2026-03-15*
