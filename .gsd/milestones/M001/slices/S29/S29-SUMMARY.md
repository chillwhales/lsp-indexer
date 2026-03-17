---
id: S29
parent: M001
milestone: M001
provides:
  - Consistent newest/oldest block-order sorting across all 12 domain types and services
  - Deterministic pagination via block-order tiebreaker on all non-block sort fields
  - Default newest-first ordering when no sort parameter is passed
  - Coordinated 1.1.0 version bump across all 4 consumer packages
  - CHANGELOGs documenting sorting support feature
  - Packages ready for npm publish
requires: []
affects: []
key_files: []
key_decisions:
  - "Removed block, timestamp, transactionIndex, logIndex as individual sort fields — replaced by deterministic newest/oldest"
  - "Block-order tiebreaker appended to ALL non-block sort fields for deterministic pagination"
  - "Default sort is buildBlockOrderSort('desc') when no sort parameter passed"
  - "Minor version bump 1.0.0 → 1.1.0 for sorting feature (removals not breaking since no external consumers yet)"
  - "Used changesets fixed group to version all 4 packages together from single changeset"
patterns_established:
  - "Block-order tiebreaker: every non-newest/oldest sort case appends ...buildBlockOrderSort('desc')"
  - "Default fallback: ?? buildBlockOrderSort('desc') on all fetch/subscription config functions"
  - "Changesets fixed group: single changeset on @lsp-indexer/types bumps all 4 packages in lockstep"
observability_surfaces: []
drill_down_paths: []
duration: 2min
verification_result: passed
completed_at: 2026-03-12
blocker_discovered: false
---
# S29: Sorting Consumer Package Release

**# Phase 21 Plan 01: Sorting Consumer Package Release Summary**

## What Happened

# Phase 21 Plan 01: Sorting Consumer Package Release Summary

**Consistent newest/oldest block-order sorting with deterministic pagination tiebreakers across all 12 domain types and services**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-12T05:24:58Z
- **Completed:** 2026-03-12T05:33:52Z
- **Tasks:** 3
- **Files modified:** 20

## Accomplishments
- All 12 SortFieldSchemas updated with `newest`/`oldest` as first two entries, removing individual `block`/`timestamp` fields
- All 12 buildOrderBy functions handle `newest → desc`, `oldest → asc` via buildBlockOrderSort
- All non-block sort fields across all 12 domains have block-order tiebreaker for deterministic pagination
- All fetch/subscription functions default to newest-first when no sort parameter is passed
- All 4 consumer packages (types, node, react, next) build successfully — sort fields propagate through full stack

## Task Commits

Each task was committed atomically:

1. **Task 1: Update SortFieldSchemas for 8 domains in types package** - `cce5afc` (feat)
2. **Task 2: Wire buildBlockOrderSort into 8 new domain services** - `856fdf5` (feat)
3. **Task 3: Add block-order tiebreaker to 4 existing domain services** - `86f6249` (feat)

## Files Created/Modified
- `packages/types/src/profiles.ts` - Added newest/oldest to ProfileSortFieldSchema
- `packages/types/src/digital-assets.ts` - Added newest/oldest to DigitalAssetSortFieldSchema
- `packages/types/src/nfts.ts` - Added newest/oldest to NftSortFieldSchema
- `packages/types/src/owned-assets.ts` - Added newest/oldest, removed timestamp/block from OwnedAssetSortFieldSchema
- `packages/types/src/owned-tokens.ts` - Added newest/oldest, removed block/timestamp from OwnedTokenSortFieldSchema
- `packages/types/src/creators.ts` - Added newest/oldest, removed timestamp from CreatorSortFieldSchema
- `packages/types/src/issued-assets.ts` - Added newest/oldest, removed timestamp from IssuedAssetSortFieldSchema
- `packages/types/src/encrypted-assets.ts` - Added newest/oldest, removed timestamp from EncryptedAssetSortFieldSchema
- `packages/node/src/services/profiles.ts` - Added newest/oldest cases, tiebreaker, default fallback
- `packages/node/src/services/digital-assets.ts` - Added newest/oldest cases, tiebreaker, default fallback
- `packages/node/src/services/nfts.ts` - Added newest/oldest cases, tiebreaker, default fallback
- `packages/node/src/services/owned-assets.ts` - Added newest/oldest cases, removed block/timestamp cases, tiebreaker, default fallback
- `packages/node/src/services/owned-tokens.ts` - Added newest/oldest cases, removed block/timestamp cases, tiebreaker, default fallback
- `packages/node/src/services/creators.ts` - Added newest/oldest cases, removed timestamp case, tiebreaker, default fallback
- `packages/node/src/services/issued-assets.ts` - Added newest/oldest cases, removed timestamp case, tiebreaker, default fallback
- `packages/node/src/services/encrypted-assets.ts` - Added newest/oldest cases, removed timestamp case, tiebreaker, default fallback
- `packages/node/src/services/followers.ts` - Added tiebreaker to 4 non-block sort fields
- `packages/node/src/services/data-changed-events.ts` - Added tiebreaker to 2 non-block sort fields
- `packages/node/src/services/token-id-data-changed-events.ts` - Added tiebreaker to 2 non-block sort fields
- `packages/node/src/services/universal-receiver-events.ts` - Added tiebreaker to 3 non-block sort fields

## Decisions Made
- Removed `block`, `timestamp`, `transactionIndex`, `logIndex` as individual sort fields — replaced by deterministic `newest`/`oldest` using `buildBlockOrderSort`
- Block-order tiebreaker (`...buildBlockOrderSort('desc')`) appended to ALL non-block sort fields for deterministic pagination
- Default sort is `buildBlockOrderSort('desc')` (newest-first) when no sort parameter passed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All sorting changes complete and verified across full stack
- Ready for Phase 21 Plan 02 (changeset release of consumer packages)

## Self-Check: PASSED

All 20 modified files verified on disk. All 3 task commits (cce5afc, 856fdf5, 86f6249) verified in git log.

---
*Phase: 21-sorting-consumer-package-release*
*Completed: 2026-03-12*

# Phase 21 Plan 02: Consumer Package Release Summary

**Coordinated 1.1.0 version bump of all 4 consumer packages via changesets fixed group for sorting support release**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-12T05:36:23Z
- **Completed:** 2026-03-12T05:38:26Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Verified all 4 consumer packages (types, node, react, next) build successfully with sorting changes from Plan 01
- Created changeset with minor bump describing sorting support feature
- Applied version bumps: all 4 packages 1.0.0 → 1.1.0 via changesets fixed group
- CHANGELOGs updated with sorting feature description in all 4 packages
- Final build verification passed at new 1.1.0 version

## Task Commits

Each task was committed atomically:

1. **Task 1: Full build verification across all 4 consumer packages** - No commit (verification-only, no files changed)
2. **Task 2: Create changeset for coordinated package release** - `9a340a9` (chore)

## Files Created/Modified
- `packages/types/package.json` - Version bumped to 1.1.0
- `packages/node/package.json` - Version bumped to 1.1.0
- `packages/react/package.json` - Version bumped to 1.1.0
- `packages/next/package.json` - Version bumped to 1.1.0
- `packages/types/CHANGELOG.md` - Added 1.1.0 entry with sorting description
- `packages/node/CHANGELOG.md` - Added 1.1.0 entry with sorting description
- `packages/react/CHANGELOG.md` - Added 1.1.0 entry with sorting description
- `packages/next/CHANGELOG.md` - Added 1.1.0 entry with sorting description

## Decisions Made
- Minor version bump (1.0.0 → 1.1.0) chosen per user decision: removals of block/timestamp sort fields are not breaking since no external consumers yet
- Used changesets fixed group: single changeset on `@lsp-indexer/types` automatically bumps all 4 packages in lockstep
- `pnpm changeset version` applied (bumps versions + CHANGELOGs); `pnpm changeset publish` left for CI/CD on merge

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 21 complete — all sorting changes implemented and versioned
- All 4 packages at 1.1.0, ready for `pnpm changeset publish` (via CI/CD on merge to main or manual publish)
- Phase complete, ready for transition

## Self-Check: PASSED

All 8 modified files verified on disk. Task commit 9a340a9 verified in git log.

---
*Phase: 21-sorting-consumer-package-release*
*Completed: 2026-03-12*
