---
id: T02
parent: S08
milestone: M001
provides:
  - Orb NFT mint-time default entities (OrbLevel=0, OrbCooldownExpiry=0, OrbFaction='Neutral')
  - Dual-trigger support in orbLevel and orbFaction handlers (LSP8Transfer + TokenIdDataChanged)
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration: 4min
verification_result: passed
completed_at: 2026-02-13
blocker_discovered: false
---
# T02: 05.2-lsp4-base-uri-count-parity 02

**# Phase 05.2 Plan 02: Orb Mint Detection Summary**

## What Happened

# Phase 05.2 Plan 02: Orb Mint Detection Summary

**Orb handlers now create mint-time defaults (OrbLevel=0, OrbCooldownExpiry=0, OrbFaction='Neutral') matching V1 behavior**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-13T13:04:36Z
- **Completed:** 2026-02-13T13:08:11Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- orbLevel.handler.ts creates OrbLevel(value=0) and OrbCooldownExpiry(value=0) on Orb NFT mint
- orbFaction.handler.ts creates OrbFaction(value='Neutral') on Orb NFT mint
- Both handlers listen to LSP8Transfer and TokenIdDataChanged with triggeredBy branching
- Mint defaults are overwritten when TokenIdDataChanged events arrive (same Map.set() semantics as V1)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add LSP8Transfer mint detection to orbLevel handler** - `3eb0279` (feat)
2. **Task 2: Add LSP8Transfer mint detection to orbFaction handler** - `21fbfb2` (feat)

## Files Created/Modified

- `packages/indexer-v2/src/handlers/chillwhales/orbLevel.handler.ts` - Added LSP8Transfer to listensToBag, mint detection branch creates OrbLevel(0) and OrbCooldownExpiry(0) defaults
- `packages/indexer-v2/src/handlers/chillwhales/orbFaction.handler.ts` - Added LSP8Transfer to listensToBag, mint detection branch creates OrbFaction('Neutral') default

## Decisions Made

1. **Mint detection via LSP8Transfer from zero address** - Matches V1's orbsLevelHandler.ts lines 35-84 exactly
2. **Default entity overwrites via addEntity()** - When TokenIdDataChanged arrives, addEntity() replaces the default entity in the batch bag (same Map.set() semantics as V1)
3. **Enrichment queued in both branches** - Both mint detection and TokenIdDataChanged queue enrichment for digitalAsset and nft FKs to ensure FKs resolve correctly

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation followed nft.handler.ts dual-trigger pattern successfully.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Orb mint detection complete, closing count gaps for OrbLevel, OrbCooldownExpiry, and OrbFaction entities
- Ready for 05.2-03 (LSP4 Base URI derivation handler)
- No blockers or concerns

## Self-Check: PASSED

---

_Phase: 05.2-lsp4-base-uri-count-parity_
_Completed: 2026-02-13_
