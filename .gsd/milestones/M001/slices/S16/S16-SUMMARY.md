---
id: S16
parent: M001
milestone: M001
provides:
  - '@chillwhales/erc725 and @chillwhales/lsp1 as npm dependencies replacing local packages'
  - 'DataKeyNameSchema and TypeIdNameSchema imported directly from upstream (Zod 4 compatible)'
  - 'packages/data-keys/ and packages/lsp1/ directories removed'
  - 'Cross-check audit confirming no additional swap opportunities across 16 @chillwhales packages'
  - 'Documented analysis of 15 local utility functions for upstream extraction potential'
requires: []
affects: []
key_files: []
key_decisions:
  - 'Import DataKeyNameSchema and TypeIdNameSchema directly from @chillwhales/erc725 and @chillwhales/lsp1 (both use Zod 4, same as this repo)'
  - 'No additional @chillwhales package swaps warranted — lsp-indexer utilities operate at Hasura/GraphQL read layer while @chillwhales packages operate at on-chain interaction layer'
  - 'No upstream PRs warranted — all local utilities are either Hasura-specific, tightly coupled to internal include system, already covered by @chillwhales/utils, or trivially simple'
patterns_established:
  - 'Direct schema import from upstream @chillwhales packages — no local wrappers needed when Zod versions match'
observability_surfaces: []
drill_down_paths: []
duration: 9min
verification_result: passed
completed_at: 2026-03-05
blocker_discovered: false
---
# S16: Replace Local Packages With Chillwhales Npm

**# Phase 12 Plan 01: Replace Local Packages with @chillwhales NPM Summary**

## What Happened

# Phase 12 Plan 01: Replace Local Packages with @chillwhales NPM Summary

**Replaced local packages/data-keys/ and packages/lsp1/ with @chillwhales/erc725@^0.1.1 and @chillwhales/lsp1@^0.1.1 from npm — direct schema and function imports, no local wrappers**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-05T22:16:10Z
- **Completed:** 2026-03-05T22:21:24Z
- **Tasks:** 2
- **Files modified:** 19 modified, 16 deleted

## Accomplishments

- All imports swapped from @lsp-indexer/data-keys → @chillwhales/erc725 and @lsp-indexer/lsp1 → @chillwhales/lsp1 across types, node, and test app packages
- DataKeyNameSchema and TypeIdNameSchema imported directly from upstream (both packages use Zod 4)
- Deleted packages/data-keys/ and packages/lsp1/ directories (16 files removed)
- All 4 publishable packages build, pass publint and attw with zero errors
- Test app next build compiles successfully

## Task Commits

Each task was committed atomically:

1. **Task 1: Swap all imports to @chillwhales packages + handle Zod compatibility** - `cc9e5fa` (feat)
2. **Task 2: Delete local packages + install + build validation** - `61b611a` (chore)

## Files Created/Modified

- `packages/types/src/data-changed-events.ts` - Import DataKeyNameSchema from @chillwhales/erc725
- `packages/types/src/token-id-data-changed-events.ts` - Import DataKeyNameSchema from @chillwhales/erc725
- `packages/types/src/universal-receiver-events.ts` - Import TypeIdNameSchema from @chillwhales/lsp1
- `packages/types/package.json` - @chillwhales/erc725 + @chillwhales/lsp1 deps
- `packages/types/tsup.config.ts` - Updated externals
- `packages/node/src/parsers/data-changed-events.ts` - @chillwhales/erc725 import
- `packages/node/src/parsers/token-id-data-changed-events.ts` - @chillwhales/erc725 import
- `packages/node/src/parsers/universal-receiver-events.ts` - @chillwhales/lsp1 import
- `packages/node/src/services/data-changed-events.ts` - @chillwhales/erc725 import
- `packages/node/src/services/token-id-data-changed-events.ts` - @chillwhales/erc725 import
- `packages/node/src/services/universal-receiver-events.ts` - @chillwhales/lsp1 import
- `packages/node/package.json` - @chillwhales deps
- `packages/node/tsup.config.ts` - Updated externals
- `apps/test/package.json` - @chillwhales deps
- `apps/test/src/app/data-changed-events/page.tsx` - Split imports
- `apps/test/src/app/token-id-data-changed-events/page.tsx` - Split imports
- `apps/test/src/app/universal-receiver-events/page.tsx` - Split imports
- `pnpm-lock.yaml` - Updated with npm @chillwhales packages

## Decisions Made

- Import DataKeyNameSchema and TypeIdNameSchema directly from upstream — both @chillwhales packages use Zod 4 (zod@^4.3.6), same as this repo

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for plan 12-02 (upstream contribution audit)
- All 4 packages build and validate cleanly with @chillwhales deps
- packages/data-keys/ and packages/lsp1/ fully removed from repo

---

_Phase: 12-replace-local-packages-with-chillwhales-npm_
_Completed: 2026-03-05_

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
