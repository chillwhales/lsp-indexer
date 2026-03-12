---
phase: quick
plan: 3
subsystem: indexer
tags: [timestamp, schema, block-ordering, enrichment, patch-fix]

key-files:
  created:
    - .changeset/add-timestamp-to-entities.md
  modified:
    - packages/typeorm/schema.graphql
    - packages/indexer/src/core/types/verification.ts
    - packages/indexer/src/core/pipeline.ts
    - packages/indexer/src/core/verification.ts
    - packages/indexer/src/plugins/events/*.plugin.ts (11 files)
    - packages/indexer/src/handlers/*.handler.ts (24 files)
    - packages/indexer/src/handlers/chillwhales/*.handler.ts (4 files)
    - packages/indexer/src/handlers/__tests__/*.test.ts (9 files)

key-decisions:
  - "Added timestamp to BlockPosition type so it flows through enrichment pipeline consistently with blockNumber/transactionIndex/logIndex"
  - "Timestamp stored as number (unix ms) in enrichment requests, converted to Date in entity constructors — matches existing event plugin pattern"

duration: 23min
completed: 2026-03-12
---

# Quick Task 3: Add Timestamp to All Entities Summary

**Added timestamp field to 36 entities missing it after Phase 19 block ordering, propagated through pipeline/verification/handlers/enrichment requests, with changeset for patch release**

## Performance

- **Duration:** 23 min
- **Started:** 2026-03-12T10:50:38Z
- **Completed:** 2026-03-12T11:14:01Z
- **Tasks:** 3
- **Files modified:** 52

## Accomplishments

- Added `timestamp: DateTime! @index` to all 36 entities that had blockNumber/transactionIndex/logIndex but were missing timestamp
- Added `timestamp: number` to `BlockPosition` type for consistent pipeline propagation
- Updated pipeline to include timestamp in earliest block position computation per address
- Updated verification to set timestamp on newly created UniversalProfile and DigitalAsset entities
- Updated all 11 EventPlugins (29 enrichment calls) with timestamp field
- Updated all 24 handler files with timestamp in entity constructors and enrichment requests
- Metadata fetch handlers (LSP3, LSP4, LSP29) propagate parent entity timestamp to sub-entities
- Chillwhales handlers (chillClaimed, orbsClaimed, orbLevel, orbFaction) get timestamp from Transfer/TokenIdDataChanged events
- All 260 tests pass, full monorepo build succeeds
- Created changeset for @chillwhales/indexer patch bump

## Task Commits

1. **Task 1: Add timestamp to schema.graphql** — `3f072ea` (feat)
2. **Task 2: Pipeline + verification + handlers + enrichment requests** — `6ad38c9` (feat)
3. **Task 2b: Fix orbLevel/orbFaction test fixtures** — `106c04e` (fix)
4. **Task 3: Changeset** — `eecfa83` (chore)

## Entities Updated (36 total)

### Core entities (3)
- UniversalProfile, DigitalAsset, NFT

### Post-verification entities (1)
- Decimals

### LSP6 sub-entities (3)
- LSP6Permission, LSP6AllowedCall, LSP6AllowedERC725YDataKey

### LSP3 sub-entities (7)
- LSP3ProfileName, LSP3ProfileDescription, LSP3ProfileTag, LSP3ProfileLink, LSP3ProfileAsset, LSP3ProfileImage, LSP3ProfileBackgroundImage

### LSP4 sub-entities (10)
- LSP4MetadataName, LSP4MetadataDescription, LSP4MetadataScore, LSP4MetadataRank, LSP4MetadataCategory, LSP4MetadataLink, LSP4MetadataIcon, LSP4MetadataImage, LSP4MetadataAsset, LSP4MetadataAttribute

### LSP29 sub-entities (7)
- LSP29EncryptedAssetTitle, LSP29EncryptedAssetDescription, LSP29EncryptedAssetFile, LSP29EncryptedAssetEncryption, LSP29AccessControlCondition, LSP29EncryptedAssetChunks, LSP29EncryptedAssetImage

### Chillwhales entities (5)
- ChillClaimed, OrbsClaimed, OrbLevel, OrbCooldownExpiry, OrbFaction

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

All key files verified on disk. All 4 commit hashes found in git log.

---
*Quick Task: 3*
*Completed: 2026-03-12*
