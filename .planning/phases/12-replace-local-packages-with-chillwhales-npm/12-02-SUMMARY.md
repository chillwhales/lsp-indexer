---
phase: 12-replace-local-packages-with-chillwhales-npm
plan: 02
subsystem: infra
tags: [npm, chillwhales, audit, upstream-contribution, cross-check]

# Dependency graph
requires:
  - phase: 12-replace-local-packages-with-chillwhales-npm
    provides: '@chillwhales/erc725 and @chillwhales/lsp1 swapped in Plan 01'
provides:
  - 'Cross-check audit confirming no additional swap opportunities across 16 @chillwhales packages'
  - 'Documented analysis of 15 local utility functions for upstream extraction potential'
affects: [13-indexer-v1-cleanup, 14-code-comments-cleanup]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created:
    - .planning/phases/12-replace-local-packages-with-chillwhales-npm/12-02-audit.md
  modified: []

key-decisions:
  - 'No additional @chillwhales package swaps warranted — lsp-indexer utilities operate at Hasura/GraphQL read layer while @chillwhales packages operate at on-chain interaction layer'
  - 'No upstream PRs warranted — all local utilities are either Hasura-specific, tightly coupled to internal include system, already covered by @chillwhales/utils, or trivially simple'

patterns-established: []

requirements-completed: [MIGRATE-03]

# Metrics
duration: 9min
completed: 2026-03-05
---

# Phase 12 Plan 02: Cross-Check Audit & Upstream Contribution Summary

**Comprehensive cross-check of all 16 @chillwhales/\* packages found no additional swap opportunities; all local utilities are Hasura-layer-specific, not generic LUKSO ecosystem utilities**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-05T22:24:08Z
- **Completed:** 2026-03-05T22:33:37Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Cross-checked all 16 @chillwhales/\* packages against lsp-indexer codebase (14 remaining after erc725 and lsp1 swapped in Plan 01)
- Detailed overlap analysis of @chillwhales/utils (90+ exported functions) against all local utilities
- Evaluated 15 local utility functions for upstream extraction potential with per-function rationale
- Documented three categories of why no PRs apply: different stack layers, tight internal coupling, and already-covered/trivially-simple

## Task Commits

Each task was committed atomically:

1. **Task 1: Cross-check @chillwhales packages + audit extractable utilities** - `5d21392` (docs)
2. **Task 2: Open at least one PR to chillwhales/LSPs** - No commit needed (valid "Why No PRs" outcome documented in Task 1)

## Files Created/Modified

- `.planning/phases/12-replace-local-packages-with-chillwhales-npm/12-02-audit.md` - Cross-check results: package overlap table, extractable utility analysis, and "Why No PRs" explanation

## Decisions Made

- No additional @chillwhales package swaps needed — the 14 remaining packages (lsp2, lsp3, lsp4, lsp6, lsp7, lsp8, lsp17, lsp23, lsp26, lsp29, lsp31, up, utils, config) have no functional overlap with lsp-indexer because they operate at the on-chain interaction layer while lsp-indexer operates at the Hasura/GraphQL read layer
- No upstream PRs warranted — local utilities are either Hasura-specific (escapeLike, orderDir, buildBlockOrderSort, parseImage/Links/Attributes), tightly coupled to the include type system (IncludeResult, stripExcluded, hasActiveIncludes), already available in @chillwhales/utils (isNumeric, truncateAddress), or trivially simple (normalizeTimestamp, PartialExcept)

## Deviations from Plan

None - plan executed exactly as written. The "no PRs" outcome was explicitly anticipated in the plan.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 12 complete — all @chillwhales swap opportunities identified and actioned
- Ready for Phase 13 (indexer v1 cleanup)
- All 4 publishable packages remain clean from Plan 01 (@chillwhales/erc725 + @chillwhales/lsp1 swapped, builds passing)

---

_Phase: 12-replace-local-packages-with-chillwhales-npm_
_Completed: 2026-03-05_
