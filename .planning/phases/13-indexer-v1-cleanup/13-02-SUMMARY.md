---
phase: 13-indexer-v1-cleanup
plan: 02
subsystem: infra
tags: [cleanup, documentation, comparison-tool]

# Dependency graph
requires:
  - phase: 13-indexer-v1-cleanup
    provides: v1 deleted, v2 renamed to canonical packages/indexer/
provides:
  - Version-neutral comparison-tool (--source/--target only, no ComparisonMode)
  - All documentation reflects single-indexer, flat-docker reality
  - Zero v1/v2 references outside .planning/
affects: [14-code-comments-cleanup]

# Tech tracking
tech-stack:
  added: []
  patterns: [source-target-comparison-labels]

key-files:
  created: []
  modified:
    - packages/comparison-tool/package.json
    - packages/comparison-tool/src/types.ts
    - packages/comparison-tool/src/cli.ts
    - packages/comparison-tool/src/comparisonEngine.ts
    - packages/comparison-tool/src/entityRegistry.ts
    - packages/comparison-tool/src/reporter.ts
    - README.md
    - docs/AGENTS.md
    - docs/README.md
    - docs/docker/README.md
    - docs/docker/QUICKSTART.md
    - docs/docker/REFERENCE.md

key-decisions:
  - 'Removed KnownDivergence type and V1_V2_DIVERGENCES entirely — all diffs are now unexpected since v1 no longer exists'
  - 'Simplified RowDiff to single diffs field — no known/unexpected split needed without v1-v2 mode'
  - 'FK coverage always checks both endpoints — no v1-v2 branch that only checks target'
  - 'Kept refactor/indexer-v2-react branch name in AGENTS.md — it is the actual working branch name'

patterns-established:
  - 'Source/Target labels for comparison-tool (not V1/V2 or V2-A/V2-B)'
  - 'All documentation references flat docker/ with manage.sh'

requirements-completed: [CLEAN-03, CLEAN-04]

# Metrics
duration: 8min
completed: 2026-03-06
---

# Phase 13 Plan 02: Comparison Tool Cleanup & Documentation Sweep Summary

**Removed v1-v2 mode from comparison-tool (~400 lines deleted including V1_V2_DIVERGENCES), swept all documentation to eliminate v1/v2 references, deleted legacy planning artifacts**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-06T09:42:14Z
- **Completed:** 2026-03-06T09:50:59Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

- Removed ComparisonMode type, KnownDivergence interface, and V1_V2_DIVERGENCES array (~225 lines of dead code) from comparison-tool
- Simplified CLI to --source/--target only (removed --v1/--v2/--mode flags), hardcoded Source/Target labels
- Updated all 8 documentation files to reflect single-indexer, flat-docker reality
- Deleted PR_CLEANUP_PLAN.md and IMPROVEMENTS_ROADMAP.md legacy planning artifacts

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove v1 mode from comparison-tool** - `db78fbd` (feat)
2. **Task 2: Documentation sweep — eliminate all v1/v2 references** - `46cb52e` (docs)

## Files Created/Modified

- `packages/comparison-tool/package.json` — Updated description (removed "v1-v2 or v2-v2")
- `packages/comparison-tool/src/types.ts` — Deleted ComparisonMode, KnownDivergence, simplified RowDiff
- `packages/comparison-tool/src/cli.ts` — Removed --v1/--v2/--mode args, simplified usage text
- `packages/comparison-tool/src/comparisonEngine.ts` — Hardcoded Source/Target labels, removed mode branching, simplified diff logic
- `packages/comparison-tool/src/entityRegistry.ts` — Deleted V1_V2_DIVERGENCES (~225 lines), removed getKnownDivergences
- `packages/comparison-tool/src/reporter.ts` — Removed mode display, known divergences logic, simplified to single diff category
- `README.md` — Single indexer, flat docker/, manage.sh commands
- `docs/AGENTS.md` — 3 packages (not 4), @chillwhales/indexer build commands
- `docs/README.md` — Single indexer listing, Docker Setup label
- `docs/docker/README.md` — Flat docker/, manage.sh, removed v1 section and migration content
- `docs/docker/QUICKSTART.md` — Updated all paths and container names
- `docs/docker/REFERENCE.md` — ~50 references updated throughout

## Decisions Made

- Removed KnownDivergence type and V1_V2_DIVERGENCES entirely — all diffs are now unexpected since v1 no longer exists
- Simplified RowDiff interface to single `diffs` field — no known/unexpected split needed without v1-v2 mode
- FK coverage always checks both endpoints — removed conditional v1-v2 branch that only checked target
- Kept `refactor/indexer-v2-react` branch name reference in AGENTS.md — it is the actual working branch name, not a v2 product reference

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 13 complete — all v1 code, Docker artifacts, and documentation references cleaned up
- Zero "indexer-v2" or "v1-v2" references in any operational file outside .planning/
- Ready for Phase 14 (code comments cleanup & release prep)

---

_Phase: 13-indexer-v1-cleanup_
_Completed: 2026-03-06_
